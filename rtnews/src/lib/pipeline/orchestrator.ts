// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// Patent Pending: "Pipeline Resilience Architecture for
// Automated Financial News Processing"
// ═══════════════════════════════════════════════════════════════
// ─── Pipeline Orchestrator V58 ─────────────────────────────
// The main pipeline controller. Runs on a continuous loop,
// processing articles through ALL stages in one pass:
// fetch → translate → analyze → image → publish
//
// V58 CRITICAL FIX — "publishing stops when dev stops checking":
//   ROOT CAUSE: The orchestrator's setTimeout loop + setInterval watchdog BOTH die
//   when Railway hibernates the container. No external cron existed to trigger
//   the pipeline, so only manual API calls (from dev) would restart it.
//   FIXES:
//   1. Added Railway cron every 5 min to trigger pipeline (in railway.toml)
//   2. Wrapped initial runCycle() in try/catch — prevents unhandled rejection
//   3. Crash-restart timer now tracked in cycleTimer — prevents zombie state
//   4. ensureRunning() is now the ONLY way external callers should start the pipeline
//
// V52 CRITICAL FIXES:
//   1. Watchdog timer — if no cycle runs in 5 min, auto-restart
//   2. Every external call (health, cron) ensures orchestrator is running
//   3. Cycle heartbeat — tracks last successful cycle for watchdog
//
// V45 CRITICAL FIXES:
//   1. Article detail pages now TRUST the Publisher — no extra checks
//   2. Aggressive stuck article reset every cycle (not just every 5)
//   3. Force-reset articles stuck at high retry counts more often
//   4. Better logging for pipeline failures
//
// V42 GOLDEN RULE: Articles are INVISIBLE until fully processed.
//   - isPublished=false and isReady=false at creation
//   - Only the Publisher agent sets isPublished=true + isReady=true + publishedAt
//   - Articles NEVER appear on site until 100% complete
//   - NO ARTICLE IS EVER DELETED after publishing
//   - isReady=true is IRREVERSIBLE — auto-migration NEVER demotes published articles
//
// CRITICAL DESIGN:
// - Crash-resilient: auto-restarts on any error
// - V52: Watchdog auto-restarts if no cycle in 5 minutes
// - Full-pipeline: each article goes through all stages in one pass
// - Concurrent: processes up to 2 articles in parallel
// - No duplicate processing: uses DB-based state (processingStage)

import { db } from '@/lib/db';
import { PIPELINE_CONFIG, getPipelineLimits } from './config';
import { getQueueStats, purgeOldFailures, resetStuckRetries, recordError, advanceStage, forceResetRecentFailed, deletePermanentlyFailed, deleteOldUnpublished } from './queue/job-manager';
import { ProcessingStage, STAGE_ORDER, RESETTABLE_STAGES } from './queue/job-types';
import { runFetcher } from './agents/fetcher';
import { translateArticle } from './agents/translator';
import { analyzeArticle } from './agents/analyzer';
import { imageArticle } from './agents/imager';
import { publishArticle } from './agents/publisher';
import { processArticleUnified } from './agents/unified-processor';
import { loadArticleContent } from './agents/content-loader';
import { runAutoMigration } from './auto-migrate';
import { isCascadeFailure } from '@/lib/ai/ai-provider';
import { checkAlertConditions, alertAiProvidersDown } from './alert-manager';
import { runArchiver } from './agents/archiver';

// ── V118: Degraded Mode State ──
// When ALL AI providers are down for 15+ minutes, the pipeline enters
// degraded mode: simplified processing with existing content + SVG image.
// GOLDEN RULE: Articles are NEVER published without a generated image.
let degradedModeActive = false;
let degradedModeSince = 0;
let lastSuccessfulAICall = Date.now();

// ── State ──
let isRunning = false;
let isPaused = false;
let cycleCount = 0;
let newsWriterRunning = false;
let analysisRunning = false;  // V1043: separate lock — analysis independent of news-writer
let lastCycleTime = 0;
let lastError: string | null = null;
let totalPublished = 0;
let totalProcessed = 0;
let totalErrors = 0;
let cycleTimer: ReturnType<typeof setTimeout> | null = null;

// V56: Smart Watchdog — track consecutive empty cycles
// If 5+ cycles produce 0 published articles, force a strong reset
let consecutiveEmptyCycles = 0;
const MAX_EMPTY_CYCLES_BEFORE_RESET = 10; // V72: Increased from 5 to 10 — 5 was too aggressive (7.5min → 15min)
let lastStrongResetTime = 0;
const STRONG_RESET_COOLDOWN_MS = 10 * 60 * 1000; // Don't strong-reset more than once per 10 min

// V120: Track strong reset count to detect permanently stuck articles.
// When the same articles survive 3+ strong resets, they're unprocessable
// (translation/AI keeps failing) — archive them instead of infinite retry.
let strongResetCount = 0;
const MAX_STRONG_RESETS_BEFORE_ARCHIVE = 3;

// V93: Daily production limit — stop publishing once MAX_PUBLISHED_PER_DAY is reached
let todayPublishedCount = 0;
let todayDateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD in UTC
// V93b: Hourly production limit — distribute 200 articles evenly over 24 hours
let thisHourPublishedCount = 0;
let thisHourKey = `${new Date().toISOString().slice(0, 13)}:00`; // YYYY-MM-DDTHH:00

// V99→V103→V357: DB-based published counting — accurate across restarts and ALL publishers
// Counts articles with publishedAt in the current hour/day from the database.
// V357 CRITICAL FIX: Changed from fetchedAt → publishedAt for counting.
// The old V103 logic used fetchedAt (article's original fetch time) to prevent
// old articles from being counted as "today". But this was WRONG because:
//   1. Articles fetched yesterday but published TODAY should count as today's quota.
//   2. The fetchedAt approach UNDERCOUNTS publications, allowing the limit to be EXCEEDED.
//   3. The English pipeline was already fixed to use publishedAt (V317), but Arabic wasn't.
// V357 also adds: locale: 'ar' filter — ensures we only count ARABIC publications.
//   Previous version relied on titleAr filter alone, which is fragile.
async function getPublishedCountsFromDB(): Promise<{ today: number; thisHour: number }> {
  try {
    const now = new Date();
    const resetHour = PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0;

    // Calculate start of current "day" based on reset hour
    const todayStart = new Date(now);
    todayStart.setUTCHours(resetHour, 0, 0, 0);
    if (now.getUTCHours() < resetHour) {
      todayStart.setUTCDate(todayStart.getUTCDate() - 1);
    }

    // Start of current hour
    const hourStart = new Date(now);
    hourStart.setUTCMinutes(0, 0, 0);

    // V357: Count only VISIBLE ARABIC articles published in the current period.
    // Use publishedAt (when article became visible), NOT fetchedAt (when it was scraped).
    // This matches the English pipeline's V317 approach.
    // V379: Added newsType: 'live' — quota should ONLY count live news articles,
    // NOT reports/analyses. Without this, reports were counted against the daily
    // limit, causing the pipeline to stop publishing news prematurely.
    const visibilityFilter = {
      locale: 'ar',           // V357: Explicit locale filter — don't rely on titleAr alone
      isReady: true,
      isPublished: true,
      newsType: { in: ['live', 'breaking'] }, // Include breaking news in quota
      slug: { not: '' },
      titleAr: { not: '' },
    };

    const [todayCount, hourCount] = await Promise.all([
      db.newsItem.count({
        where: {
          ...visibilityFilter,
          publishedAt: { gte: todayStart },   // V357: publishedAt instead of fetchedAt
        },
      }),
      db.newsItem.count({
        where: {
          ...visibilityFilter,
          publishedAt: { gte: hourStart },     // V357: publishedAt instead of fetchedAt
        },
      }),
    ]);

    return { today: todayCount, thisHour: hourCount };
  } catch (err: any) {
    // V111: Return hardcoded defaults on DB failure — NOT Infinity
    // Infinity was causing the pipeline to PERMANENTLY block (Infinity >= any limit = true)
    // Instead, return 0 counts so the pipeline continues with default limits
    console.error(`[Orchestrator V111] getPublishedCountsFromDB FAILED — using 0 counts as fallback: ${err.message}`);
    return { today: 0, thisHour: 0 };
  }
}

// V52: Watchdog — detects dead orchestrator and auto-restarts
let watchdogTimer: ReturnType<typeof setInterval> | null = null;
const WATCHDOG_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes
const WATCHDOG_MAX_IDLE_MS = 5 * 60 * 1000;  // Max idle time before restart

// V1043: Independent analysis loop — runs every 60s, decoupled from runCycle
// This ensures analysis throughput is NOT throttled by slow RSS processing cycles.
// analyzeRecentAINews has its own time-budget (75s) and batch limit (5).
let analysisLoopTimer: ReturnType<typeof setInterval> | null = null;
const ANALYSIS_LOOP_INTERVAL_MS = 60 * 1000;  // Every 60s — independent of cycle timing

async function runAnalysisLoopTick(): Promise<void> {
  if (!isRunning || isPaused) return;
  if (analysisRunning) return;  // Previous tick still running — skip

  try {
    analysisRunning = true;
    const { analyzeRecentAINews } = await import('./agents/news-writer');
    const result = await analyzeRecentAINews(5);
    if (result.processed > 0) {
      console.log(`[Orchestrator V1043 AnalysisLoop] ${result.succeeded}/${result.processed} analyzed (${result.failed} failed)`);
    }
  } catch (err: any) {
    console.warn(`[Orchestrator V1043 AnalysisLoop] Error: ${err.message?.slice(0, 100)}`);
  } finally {
    analysisRunning = false;
  }
}

// V56: Strong reset — force-reset ALL stuck articles when pipeline is dead
async function strongResetAllStuckArticles(): Promise<void> {
  const now = Date.now();
  if (now - lastStrongResetTime < STRONG_RESET_COOLDOWN_MS) {
    console.log(`[Orchestrator V56] Strong reset skipped — cooldown active (${Math.round((now - lastStrongResetTime) / 60000)}min ago)`);
    return;
  }
  lastStrongResetTime = now;
  
  console.warn(`[Orchestrator V72] STRONG RESET — ${consecutiveEmptyCycles} consecutive empty cycles!`);
  
  try {
    // V120: Track strong reset count. After MAX_STRONG_RESETS_BEFORE_ARCHIVE,
    // archive permanently stuck articles instead of infinitely retrying them.
    strongResetCount++;
    
    if (strongResetCount >= MAX_STRONG_RESETS_BEFORE_ARCHIVE) {
      // Archive articles that keep failing after multiple strong resets.
      // These are articles where translation/AI consistently fails
      // (e.g., "titleAr is not mostly Arabic", "Missing Arabic contentAr").
      // Instead of deleting them, mark them as archived so they're invisible
      // but preserved for analysis.
      const stuckToArchive = await db.newsItem.findMany({
        where: {
          locale: 'ar',  // V260: Only manage Arabic articles
          isReady: false,
          isPublished: false,
          retryCount: { gte: Math.floor(PIPELINE_CONFIG.MAX_RETRY_COUNT / 2) },
          lastError: { not: null },
        },
        orderBy: { fetchedAt: 'desc' },
        select: { id: true, lastError: true },
        take: 200,
      });
      
      if (stuckToArchive.length > 0) {
        // Delete permanently stuck articles — they're invisible anyway (isReady=false)
        // and just waste AI resources on infinite retry loops.
        const archived = await db.newsItem.deleteMany({
          where: {
            id: { in: stuckToArchive.map(a => a.id) },
          },
        });
        console.warn(`[Orchestrator V120] ARCHIVED ${archived.count} permanently stuck articles after ${strongResetCount} strong resets. Errors: ${stuckToArchive.slice(0, 3).map(a => a.lastError?.substring(0, 60)).join(' | ')}`);
      }
      
      // Reset the counter — give remaining/new articles a fresh chance
      strongResetCount = 0;
    }

    const recentStuck = await db.newsItem.findMany({
      where: {
        locale: 'ar',  // V260: Only reset Arabic articles
        isReady: false,
        isPublished: false,
        retryCount: { gte: PIPELINE_CONFIG.MAX_RETRY_COUNT },
      },
      orderBy: { fetchedAt: 'desc' },
      select: { id: true },
      take: 100, // V113: Was 50, now 100
    });

    if (recentStuck.length > 0) {
      const resetResult = await db.newsItem.updateMany({
        where: {
          id: { in: recentStuck.map(a => a.id) },
        },
        data: {
          retryCount: 0,
          lastError: null,
          processingStage: 'fetched',
        },
      });
      console.warn(`[Orchestrator V72] Strong reset: ${resetResult.count} most-recent MAX_RETRY articles reset (limited from full set)`);
    }

    // Also reset high-retry articles (limited to 100)
    // V113: Increased from 50 to 100
    const highRetryArticles = await db.newsItem.findMany({
      where: {
        locale: 'ar',  // V260: Only reset Arabic articles
        isReady: false,
        isPublished: false,
        retryCount: { gte: Math.floor(PIPELINE_CONFIG.MAX_RETRY_COUNT / 2) },
        lastError: { not: null },
      },
      orderBy: { fetchedAt: 'desc' },
      select: { id: true },
      take: 100, // V113: Was 50, now 100
    });

    if (highRetryArticles.length > 0) {
      const highRetryResult = await db.newsItem.updateMany({
        where: {
          id: { in: highRetryArticles.map(a => a.id) },
        },
        data: {
          retryCount: 0,
          lastError: null,
        },
      });
      console.warn(`[Orchestrator V72] High-retry reset: ${highRetryResult.count} articles reset (limited)`);
    }

    // V72: Delete old stuck articles that are just wasting space
    const deleted = await db.newsItem.deleteMany({
      where: {
        locale: 'ar',  // V260: Only delete Arabic articles
        isReady: false,
        isPublished: false,
        retryCount: { gte: PIPELINE_CONFIG.MAX_RETRY_COUNT },
        fetchedAt: { lt: new Date(Date.now() - 12 * 60 * 60 * 1000) }, // Older than 12h
      },
    });
    if (deleted.count > 0) {
      console.log(`[Orchestrator V72] Deleted ${deleted.count} old stuck articles (>12h old)`);
    }
  } catch (err: any) {
    console.error(`[Orchestrator V72] Strong reset failed: ${err.message}`);
  }
}

// ── Public API ──

export function startOrchestrator(): void {
  if (isRunning) {
    // V52: Even if already running, check if it's actually alive
    const idleMs = Date.now() - lastCycleTime;
    if (lastCycleTime > 0 && idleMs > WATCHDOG_MAX_IDLE_MS) {
      console.warn(`[Orchestrator V52] RUNNING but STALE — last cycle ${Math.round(idleMs / 60000)} min ago. Force-restarting!`);
      stopOrchestrator();
      // Fall through to restart below
    } else {
      console.log('[Orchestrator] Already running');
      return;
    }
  }

  isRunning = true;
  isPaused = false;
  console.log(`[Orchestrator V55] Starting — cycle every ${PIPELINE_CONFIG.CYCLE_INTERVAL_MS / 1000}s, max ${PIPELINE_CONFIG.ARTICLES_PER_CYCLE} articles, ${PIPELINE_CONFIG.CONCURRENT_ARTICLES} concurrent. Watchdog: restarts if idle > ${WATCHDOG_MAX_IDLE_MS / 60000} min.`);

  // V52: Start watchdog — checks every 5 min that the orchestrator is actually alive
  if (watchdogTimer) clearInterval(watchdogTimer);
  watchdogTimer = setInterval(() => {
    if (!isRunning) return; // Not running is handled by external callers
    const idleMs = Date.now() - lastCycleTime;
    // Only warn if we've had at least one cycle and it's been too long
    if (lastCycleTime > 0 && idleMs > WATCHDOG_MAX_IDLE_MS) {
      console.warn(`[Orchestrator V52 Watchdog] ⚠️ STALE — last cycle ${Math.round(idleMs / 60000)} min ago. Force-restarting!`);
      stopOrchestrator();
      startOrchestrator();
    }
  }, WATCHDOG_INTERVAL_MS);

  // V1043: Start independent analysis loop — runs every 60s, decoupled from runCycle
  // This ensures news-writer articles get analyzed even when RSS processing is slow
  if (analysisLoopTimer) clearInterval(analysisLoopTimer);
  analysisLoopTimer = setInterval(() => {
    runAnalysisLoopTick().catch((err) => {
      console.warn(`[Orchestrator V1043 AnalysisLoop] Unhandled error: ${err.message?.slice(0, 100)}`);
    });
  }, ANALYSIS_LOOP_INTERVAL_MS);
  console.log(`[Orchestrator V1043] Analysis loop started — every ${ANALYSIS_LOOP_INTERVAL_MS / 1000}s (independent of cycle)`);

  // V41: Run auto-migration FIRST to fix legacy data
  // V58: Wrap runCycle() in try/catch — prevents unhandled rejection that could
  // leave isRunning=true with no cycle loop (zombie state)
  setTimeout(async () => {
    try {
      await runAutoMigration();
    } catch (err: any) {
      console.error(`[Orchestrator V58] Auto-migration failed: ${err.message}`);
    }
    try {
      await runCycle();
    } catch (err: any) {
      console.error(`[Orchestrator V58] Initial cycle failed: ${err.message}`);
      // Still schedule next cycle even if first cycle fails
      scheduleNextCycle();
    }
  }, PIPELINE_CONFIG.STARTUP_DELAY_MS);
}

export function stopOrchestrator(): void {
  isRunning = false;
  if (cycleTimer) {
    clearTimeout(cycleTimer);
    cycleTimer = null;
  }
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
  // V1043: Clean up analysis loop timer
  if (analysisLoopTimer) {
    clearInterval(analysisLoopTimer);
    analysisLoopTimer = null;
  }
  analysisRunning = false;  // Reset lock on stop
  console.log('[Orchestrator] Stopped');
}

export function pauseOrchestrator(): void {
  isPaused = true;
  console.log('[Orchestrator] Paused');
}

export function resumeOrchestrator(): void {
  isPaused = false;
  console.log('[Orchestrator] Resumed');
}

// V111: Cache the last DB-based limits so stats can show the ACTUAL values being used
let _lastDBLimits: { maxPublishedPerDay: number; maxPublishedPerHour: number } = {
  maxPublishedPerDay: PIPELINE_CONFIG.MAX_PUBLISHED_PER_DAY,
  maxPublishedPerHour: PIPELINE_CONFIG.MAX_PUBLISHED_PER_HOUR,
};

export async function getOrchestratorStats() {
  const idleMs = lastCycleTime > 0 ? Date.now() - lastCycleTime : null;
  // V111: Use cached DB limits for accurate stats display
  const dailyLimit = _lastDBLimits.maxPublishedPerDay;
  const hourlyLimit = _lastDBLimits.maxPublishedPerHour;

  // V360: Query DB for ALL published counts (total, today, thisHour) instead of in-memory counters.
  // V359 fixed totalPublished to use DB, but todayPublished and thisHourPublished still used
  // in-memory counters, causing impossible stats like "today (235) > total (162)".
  // The in-memory counters reset to 0 on server restart and can drift from reality.
  // The DB counts are always accurate and consistent.

  const now = new Date();
  const resetHour = PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0;
  const todayStart = new Date(now);
  todayStart.setUTCHours(resetHour, 0, 0, 0);
  if (now.getUTCHours() < resetHour) {
    todayStart.setUTCDate(todayStart.getUTCDate() - 1);
  }
  const hourStart = new Date(now);
  hourStart.setUTCMinutes(0, 0, 0);

  // V379: Added newsType: 'live' — stats should match what's visible on the site
  const visibilityFilter = {
    locale: 'ar',
    isReady: true,
    isPublished: true,
    newsType: { in: ['live', 'breaking'] } as const,
    slug: { not: '' },
    titleAr: { not: '' },
  };

  let dbTotalPublished = totalPublished; // fallback
  let dbTodayPublished = todayPublishedCount; // fallback
  let dbThisHourPublished = thisHourPublishedCount; // fallback

  try {
    [dbTotalPublished, dbTodayPublished, dbThisHourPublished] = await Promise.all([
      // V377: Use visibility filter for total too — consistent with today/thisHour counts
      db.newsItem.count({ where: visibilityFilter }),
      db.newsItem.count({ where: { ...visibilityFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...visibilityFilter, publishedAt: { gte: hourStart } } }),
    ]);
  } catch (dbErr: any) {
    console.warn(`[Orchestrator V360] DB published counts failed: ${dbErr.message}`);
  }

  return {
    isRunning,
    isPaused,
    cycleCount,
    lastCycleTime: lastCycleTime ? new Date(lastCycleTime).toISOString() : null,
    idleMinutes: idleMs ? Math.round(idleMs / 60000) : null,
    isStale: idleMs !== null && idleMs > WATCHDOG_MAX_IDLE_MS,
    lastError,
    totalPublished: dbTotalPublished,
    totalProcessed,
    totalErrors,
    // V360: Now uses DB queries for consistency — never shows today > total again
    todayPublished: dbTodayPublished,
    todayDate: todayDateStr,
    dailyLimit,
    dailyLimitReached: dailyLimit > 0 && dbTodayPublished >= dailyLimit,
    // V360: Now uses DB queries for consistency
    thisHourPublished: dbThisHourPublished,
    thisHour: thisHourKey,
    hourlyLimit,
    hourlyLimitReached: hourlyLimit > 0 && dbThisHourPublished >= hourlyLimit,
    config: {
      cycleIntervalMs: PIPELINE_CONFIG.CYCLE_INTERVAL_MS,
      articlesPerCycle: PIPELINE_CONFIG.ARTICLES_PER_CYCLE,
      concurrentArticles: PIPELINE_CONFIG.CONCURRENT_ARTICLES,
      maxRetryCount: PIPELINE_CONFIG.MAX_RETRY_COUNT,
      maxPublishedPerDay: dailyLimit,
      maxPublishedPerHour: hourlyLimit,
    },
    // V118: Degraded mode info
    degradedMode: degradedModeActive,
    degradedModeSince: degradedModeActive ? new Date(degradedModeSince).toISOString() : null,
  };
}

// V52: Public function to ensure orchestrator is running.
// Called by health check, cron, and any external trigger.
// Unlike startOrchestrator(), this also handles stale-but-running state.
export function ensureRunning(): { wasRunning: boolean; wasStale: boolean; restarted: boolean } {
  const idleMs = lastCycleTime > 0 ? Date.now() - lastCycleTime : null;
  const wasStale = idleMs !== null && idleMs > WATCHDOG_MAX_IDLE_MS;
  const wasRunning = isRunning;

  if (!isRunning || wasStale) {
    if (wasStale) {
      console.warn(`[Orchestrator V52] ensureRunning: STALE orchestrator (idle ${Math.round((idleMs || 0) / 60000)} min) — force-restarting`);
      stopOrchestrator();
    } else {
      console.log(`[Orchestrator V52] ensureRunning: Orchestrator NOT running — starting`);
    }
    startOrchestrator();
    return { wasRunning, wasStale, restarted: true };
  }

  return { wasRunning: true, wasStale: false, restarted: false };
}

// ── Main Cycle ──

async function runCycle(): Promise<void> {
  if (!isRunning) return;
  if (isPaused) {
    scheduleNextCycle();
    return;
  }

  cycleCount++;
  const cycleStart = Date.now();
  console.log(`[Orchestrator] Cycle #${cycleCount} starting...`);

  try {
    // V1173: REMOVED deleteOldUnpublished from top of runCycle.
    // It was causing an infinite crash loop: the deleteMany query on 157K rows
    // takes 30-60s, which causes the orchestrator to timeout/crash before
    // reaching any other code. Then watchdog restarts it, and it crashes again.
    // deleteOldUnpublished now runs ONLY in housekeeping (every 10 cycles)
    // and uses batch deletion (1000 at a time) to avoid locking the table.

    // V102: Get dynamic pipeline limits from DB (with 30s cache)
    const limits = await getPipelineLimits();
    const MAX_PUBLISHED_PER_DAY = limits.maxPublishedPerDay;
    const MAX_PUBLISHED_PER_HOUR = limits.maxPublishedPerHour;
    // V111: Update the cached DB limits so stats show the ACTUAL values being used
    _lastDBLimits = { maxPublishedPerDay: MAX_PUBLISHED_PER_DAY, maxPublishedPerHour: MAX_PUBLISHED_PER_HOUR };

    // V99: Sync counters from DB — accurate across restarts and ALL publishers
    // This counts ALL published articles (from orchestrator, mark-ready cron, V43 fix)
    const publishedCounts = await getPublishedCountsFromDB();
    const previousToday = todayPublishedCount;
    const previousHour = thisHourPublishedCount;
    todayPublishedCount = publishedCounts.today;
    thisHourPublishedCount = publishedCounts.thisHour;

    const currentDateStr = new Date().toISOString().slice(0, 10);
    if (currentDateStr !== todayDateStr) {
      console.log(`[Orchestrator V99] Date check: ${todayDateStr} → ${currentDateStr}. DB count: today=${todayPublishedCount}`);
      todayDateStr = currentDateStr;
    }
    const currentHourKey = `${new Date().toISOString().slice(0, 13)}:00`;
    if (currentHourKey !== thisHourKey) {
      console.log(`[Orchestrator V99] Hour check: ${thisHourKey} → ${currentHourKey}. DB count: hour=${thisHourPublishedCount}`);
      thisHourKey = currentHourKey;
    }

    // Log if DB count differs from previous in-memory count (indicates external publishing)
    if (previousToday !== todayPublishedCount || previousHour !== thisHourPublishedCount) {
      console.log(`[Orchestrator V99] DB sync: today ${previousToday}→${todayPublishedCount}, hour ${previousHour}→${thisHourPublishedCount}`);
    }

    // V93b: Check hourly production limit first — distribute articles evenly over 24h
    const hourlyLimitReached = MAX_PUBLISHED_PER_HOUR > 0 && thisHourPublishedCount >= MAX_PUBLISHED_PER_HOUR;
    if (hourlyLimitReached) {
      // Still fetch to keep queue fresh, but skip processing until next hour
      const fetchResult = await runFetcher();
      console.log(`[Orchestrator V93b] Hourly limit reached (${thisHourPublishedCount}/${MAX_PUBLISHED_PER_HOUR}). Waiting for next hour. Fetch: ${fetchResult.fetched}`);
      lastCycleTime = Date.now();
      scheduleNextCycle();
      return;
    }

    // V93: Check daily production limit — skip processing if limit reached
    const dailyLimitReached = MAX_PUBLISHED_PER_DAY > 0 && todayPublishedCount >= MAX_PUBLISHED_PER_DAY;
    if (dailyLimitReached) {
      // Still fetch to keep queue fresh, but skip processing
      const fetchResult = await runFetcher();
      console.log(`[Orchestrator V93] Daily limit reached (${todayPublishedCount}/${MAX_PUBLISHED_PER_DAY}). Skipping processing. Fetch: ${fetchResult.fetched}`);
      lastCycleTime = Date.now();
      scheduleNextCycle();
      return;
    }

    // ── Step 1: Fetch new articles ──
    // V1160: Skip fetching if queue is already large (>1000 unpublished).
    // This prevents DB bloat — no point fetching more articles when 1000+
    // are already waiting to be processed.
    let fetchResult = { fetched: 0, duplicates: 0, filtered: 0, errors: 0, duration: 0 };
    try {
      const unpublishedCount = await db.newsItem.count({
        where: { isReady: false, isPublished: false }
      });
      if (unpublishedCount > 1000) {
        console.log(`[Orchestrator V1160] Skipping fetch — ${unpublishedCount} unpublished articles already in queue (limit: 1000)`);
      } else {
        fetchResult = await runFetcher();
        if (fetchResult.fetched > 0) {
          console.log(`[Orchestrator] Fetched ${fetchResult.fetched} new articles`);
        }
      }
    } catch (fetchErr: any) {
      console.warn(`[Orchestrator V1160] Fetch check failed, fetching anyway: ${fetchErr.message}`);
      fetchResult = await runFetcher();
    }

    // V121: CASCADE FAILURE — log warning but CONTINUE processing.
    if (isCascadeFailure()) {
      console.warn(`[Orchestrator V121] AI provider CASCADE FAILURE detected — continuing processing with available providers.`);
    }

    // ── Step 1.5: News Writer (every ~15 min) ──
    // يُشغّل قبل معالجة RSS لأن news-writer له أولوية — ينتج محتوى أصليًا
    // لو تأخر حتى بعد RSS (الذي يأخذ 25+ دقيقة)، قد لا يُشغّل أبدًا
    try {
      if (!newsWriterRunning) {
        const now = Date.now();
        const lastWriterRun = await db.siteSetting.findUnique({ where: { key: 'newsWriter.lastRunAt' } });
        const lastRunTime = lastWriterRun?.value ? new Date(lastWriterRun.value).getTime() : 0;
        const elapsedMin = (now - lastRunTime) / 60000;

        if (elapsedMin >= 15) {
          newsWriterRunning = true;
          console.log(`[Orchestrator] Step 1.5: Triggering news-writer (${elapsedMin.toFixed(0)} min since last run)...`);
          const { runNewsWriter } = await import('./agents/news-writer');
          const writerResult = await runNewsWriter();
          console.log(`[Orchestrator] News-writer done (${writerResult.locale}): ${writerResult.generated} generated, ${writerResult.skipped} skipped, ${writerResult.errors} errors`);
          newsWriterRunning = false;
        }
      }
    } catch (err: any) {
      newsWriterRunning = false;
      console.warn(`[Orchestrator] News-writer step failed: ${err.message?.slice(0, 100)}`);
    }

    // ── Step 1.6: AI Analysis for News-Writer articles ──
    // V1043: Analysis now runs in a SEPARATE setInterval loop (every 60s),
    // independent of runCycle. This is just a fallback trigger for the first
    // cycle after startup (before the interval fires).
    // The analysisLoopTimer handles all subsequent runs.
    try {
      if (!analysisRunning) {
        // Fire-and-forget — don't block runCycle
        runAnalysisLoopTick().catch(() => {});
      }
    } catch (err: any) {
      console.warn(`[Orchestrator V1043] Analysis trigger failed: ${err.message?.slice(0, 100)}`);
    }

    // ── Step 2: Pick articles that need processing and process them through ALL stages ──
    let publishedThisCycle = 0;
    let errorsThisCycle = 0;
    let processedThisCycle = 0;

    // Pick articles that are NOT ready, prioritizing later stages first
    // (so articles closest to publishing get processed first)
    // V93b: Limit articles to process based on both hourly AND daily remaining quota
    const remainingDailyQuota = MAX_PUBLISHED_PER_DAY > 0
      ? Math.max(0, MAX_PUBLISHED_PER_DAY - todayPublishedCount)
      : PIPELINE_CONFIG.ARTICLES_PER_CYCLE;
    const remainingHourlyQuota = MAX_PUBLISHED_PER_HOUR > 0
      ? Math.max(0, MAX_PUBLISHED_PER_HOUR - thisHourPublishedCount)
      : PIPELINE_CONFIG.ARTICLES_PER_CYCLE;
    const effectiveMaxArticles = Math.min(
      PIPELINE_CONFIG.ARTICLES_PER_CYCLE,
      remainingDailyQuota,
      remainingHourlyQuota
    );

    if (effectiveMaxArticles === 0) {
      console.log(`[Orchestrator V93] Daily limit reached during cycle (${todayPublishedCount}/${MAX_PUBLISHED_PER_DAY}). Skipping processing.`);
      lastCycleTime = Date.now();
      scheduleNextCycle();
      return;
    }

    const articlesToProcess = await pickArticlesForProcessing(effectiveMaxArticles, remainingHourlyQuota);

    if (articlesToProcess.length > 0) {
      console.log(`[Orchestrator] Processing ${articlesToProcess.length} articles through full pipeline...`);

      // Process articles with limited concurrency
      const concurrency = PIPELINE_CONFIG.CONCURRENT_ARTICLES;
      for (let i = 0; i < articlesToProcess.length; i += concurrency) {
        // V357: Re-check publishing limits from DB before each batch.
        // Between batches, other publishing paths (mark-ready cron, fix-published API)
        // may have published articles, consuming quota. Without this check,
        // the orchestrator could exceed the limit when running concurrently with
        // other publishing paths (the #1 race condition bug).
        if (i > 0) {
          const liveCounts = await getPublishedCountsFromDB();
          const liveLimits = await getPipelineLimits();
          const liveHourlyReached = liveLimits.maxPublishedPerHour > 0 && liveCounts.thisHour >= liveLimits.maxPublishedPerHour;
          const liveDailyReached = liveLimits.maxPublishedPerDay > 0 && liveCounts.today >= liveLimits.maxPublishedPerDay;
          if (liveHourlyReached || liveDailyReached) {
            console.log(`[Orchestrator V357] Limit reached mid-cycle (DB re-check: hour=${liveCounts.thisHour}/${liveLimits.maxPublishedPerHour}, day=${liveCounts.today}/${liveLimits.maxPublishedPerDay}). Stopping batch processing after ${publishedThisCycle} published.`);
            break;
          }
          // Update in-memory counters to match DB reality
          todayPublishedCount = liveCounts.today;
          thisHourPublishedCount = liveCounts.thisHour;
        }

        const batch = articlesToProcess.slice(i, i + concurrency);
        const batchResults = await Promise.allSettled(
          batch.map(articleId => processArticleThroughAllStages(articleId))
        );

        for (const result of batchResults) {
          processedThisCycle++;
          if (result.status === 'fulfilled') {
            if (result.value.published) {
              publishedThisCycle++;
            }
            if (!result.value.success) {
              errorsThisCycle++;
            }
          } else {
            errorsThisCycle++;
          }
        }
      }
    }

    totalProcessed += processedThisCycle;
    totalPublished += publishedThisCycle;
    totalErrors += errorsThisCycle;
    todayPublishedCount += publishedThisCycle; // V93: Track daily count
    thisHourPublishedCount += publishedThisCycle; // V93b: Track hourly count
    lastError = null;

    // V93b: Log daily & hourly progress
    if (publishedThisCycle > 0 && MAX_PUBLISHED_PER_DAY > 0) {
      console.log(`[Orchestrator V93b] Progress — Hour: ${thisHourPublishedCount}/${MAX_PUBLISHED_PER_HOUR} | Day: ${todayPublishedCount}/${MAX_PUBLISHED_PER_DAY}`);
    }

    // V56: Smart Watchdog — track consecutive empty cycles
    if (publishedThisCycle === 0 && processedThisCycle > 0) {
      consecutiveEmptyCycles++;
      if (consecutiveEmptyCycles >= MAX_EMPTY_CYCLES_BEFORE_RESET) {
        console.warn(`[Orchestrator V56] Smart Watchdog: ${consecutiveEmptyCycles} consecutive empty cycles! Triggering strong reset...`);
        await strongResetAllStuckArticles();
        consecutiveEmptyCycles = 0; // Reset counter after strong reset
      }
    } else if (publishedThisCycle > 0) {
      consecutiveEmptyCycles = 0; // Reset on successful publish
    }

    // ── Step 3: Housekeeping (every 10 cycles) ──
    if (cycleCount % 10 === 0) {
      try {
        await purgeOldFailures();
      } catch (err: any) {
        console.warn(`[Orchestrator] Housekeeping failed: ${err.message}`);
      }

      // V1156: Delete permanently failed articles (retryCount >= MAX_RETRY, older than 24h)
      // This is the MAIN fix for DB bloat — 154K rows were stuck as "permanently failed"
      // but never deleted. Now we delete them every 10 cycles (~15 min).
      try {
        await deletePermanentlyFailed();
      } catch (err: any) {
        console.warn(`[Orchestrator V1156] deletePermanentlyFailed failed: ${err.message}`);
      }

      // V1157: Delete ALL unpublished articles older than 7 days, regardless of retryCount.
      // V1156 alone wasn't enough — most articles have LOW retryCount because
      // forceResetRecentFailed() keeps resetting it to 0. So they never reach
      // MAX_RETRY and never get deleted by V1156.
      // This function deletes ANY article that's:
      //   - isReady=false (not published)
      //   - isPublished=false
      //   - fetchedAt older than 7 days
      // No retryCount condition. This is the actual bloat killer.
      try {
        await deleteOldUnpublished();
      } catch (err: any) {
        console.warn(`[Orchestrator V1157] deleteOldUnpublished failed: ${err.message}`);
      }

      // V43/V99→V356: Fix articles that have isReady=true but isPublished=false
      // V356: WITH limit enforcement — previously published unlimited articles every 10 cycles
      try {
        // Check current quota before fixing
        const fixLimits = await getPipelineLimits();
        const fixNow = new Date();
        const fixHourStart = new Date(fixNow);
        fixHourStart.setUTCMinutes(0, 0, 0);
        const fixResetHour = PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0;
        const fixTodayStart = new Date(fixNow);
        fixTodayStart.setUTCHours(fixResetHour, 0, 0, 0);
        if (fixNow.getUTCHours() < fixResetHour) {
          fixTodayStart.setUTCDate(fixTodayStart.getUTCDate() - 1);
        }

        // V358 FIX: Added locale: 'ar' — was missing, causing cross-locale counting!
        // Without this, EN/FR articles with non-empty titleAr were counted as Arabic
        // publications, inflating the count and causing the Arabic pipeline to stop
        // publishing prematurely (thinking the daily/hourly limit was reached).
        // V379: Added newsType: 'live' — matches getPublishedCountsFromDB() filter
        const fixVisFilter = {
          locale: 'ar',           // V358: Explicit locale filter — MUST match getPublishedCountsFromDB()
          isReady: true,
          isPublished: true,
          newsType: { in: ['live', 'breaking'] }, // Include breaking news
          slug: { not: '' },
          titleAr: { not: '' },
        };

        const [fixPubToday, fixPubThisHour] = await Promise.all([
          db.newsItem.count({ where: { ...fixVisFilter, publishedAt: { gte: fixTodayStart } } }),
          db.newsItem.count({ where: { ...fixVisFilter, publishedAt: { gte: fixHourStart } } }),
        ]);

        const fixRemainingHourly = fixLimits.maxPublishedPerHour > 0
          ? Math.max(0, fixLimits.maxPublishedPerHour - fixPubThisHour) : 999;
        const fixRemainingDaily = fixLimits.maxPublishedPerDay > 0
          ? Math.max(0, fixLimits.maxPublishedPerDay - fixPubToday) : 999;
        const fixMaxAllowed = Math.min(fixRemainingHourly, fixRemainingDaily);

        if (fixMaxAllowed > 0) {
          // V1044: Only publish articles that have COMPLETE analysis (fullContent) + image
          // Previously this blindly set isPublished=true for any isReady=true article,
          // re-publishing drafts that were intentionally unpublished (missing analysis).
          const articlesToFix = await db.newsItem.findMany({
            where: {
              isReady: true,
              isPublished: false,
              locale: 'ar',
              // V1044: MUST have complete analysis
              aiAnalysis: { contains: 'fullContent' },
              // V1044: MUST have image
              generatedImage: { not: '' },
            },
            select: { id: true },
            take: fixMaxAllowed,
          });

          if (articlesToFix.length > 0) {
            const fixResult = await db.newsItem.updateMany({
              where: { id: { in: articlesToFix.map(a => a.id) } },
              data: { isPublished: true },
            });
            if (fixResult.count > 0) {
              // V359: Record publishes in quota manager's in-process tracking
              try {
                const { recordPublish } = await import('./publish-quota');
                for (let i = 0; i < fixResult.count; i++) {
                  recordPublish('ar');
                }
              } catch { /* non-critical */ }
              console.log(`[Orchestrator V356] Fixed ${fixResult.count} articles with isReady=true but isPublished=false (limited by quota: hour=${fixPubThisHour}/${fixLimits.maxPublishedPerHour}, day=${fixPubToday}/${fixLimits.maxPublishedPerDay})`);
            }
          }
        } else {
          console.log(`[Orchestrator V356] Quota reached — skipping isPublished fix. Hour: ${fixPubThisHour}/${fixLimits.maxPublishedPerHour}, Day: ${fixPubToday}/${fixLimits.maxPublishedPerDay}`);
        }
        // V99→V102: Ensure publishedAt is set for articles missing it (required for DB-based counting)
        // V102 FIX: Use fetchedAt instead of new Date() — setting publishedAt=today on old articles
        // inflates the daily count, causing the 200/day limit to be reached prematurely.
        // The article's original publish time is fetchedAt, not "now".
        // V358 FIX: Added locale filter to publishedAt fix — was modifying ALL locales!
        // The Arabic orchestrator should ONLY fix Arabic articles' publishedAt.
        // Without this filter, EN/FR articles' publishedAt was being set by the Arabic
        // pipeline, corrupting their quota counts and causing limit violations.
        try {
          const fixPubDate = await db.$executeRawUnsafe(`
            UPDATE news_items SET "publishedAt" = "fetchedAt"
            WHERE "isReady" = true AND "publishedAt" IS NULL AND "locale" = 'ar'
          `);
          if (Number(fixPubDate) > 0) {
            console.log(`[Orchestrator V358] Set publishedAt=fetchedAt for ${fixPubDate} ARABIC articles missing it (locale-filtered)`);
          }
        } catch (rawErr: any) {
          // Fallback for DBs that don't support $executeRawUnsafe well
          try {
            const fallbackFix = await db.newsItem.updateMany({
              where: { isReady: true, publishedAt: null, locale: 'ar' },  // V358: Added locale filter
              data: { publishedAt: new Date() },
            });
            if (fallbackFix.count > 0) {
              console.log(`[Orchestrator V358] Set publishedAt for ${fallbackFix.count} ARABIC articles (fallback: used current time, locale-filtered)`);
            }
          } catch (fallbackErr: any) {
            console.warn(`[Orchestrator V358] publishedAt fix failed: ${fallbackErr.message}`);
          }
        }
      } catch (fixErr: any) {
        console.warn(`[Orchestrator V43] isPublished fix failed: ${fixErr.message}`);
      }

      // V104/V113: Purge aged-out articles in early stages that will NEVER be processed.
      // The article picker skips articles older than MAX_ARTICLE_AGE_MS (4h),
      // so articles stuck in 'fetched' or 'content_loaded' older than this
      // will never be picked — they just waste DB space and inflate queue stats.
      // V113 FIX: Use MAX_ARTICLE_AGE_PURGE_MS (8h) instead of MAX_ARTICLE_AGE_MS (4h)
      // for the deletion cutoff. When the pipeline is rate-limited, articles wait
      // without being processed. Using the same 4h cutoff for both picking AND
      // deletion means articles that were waiting during a rate limit pause get
      // permanently deleted even though they were never given a chance to process.
      // Also: skip purging entirely when rate limits were recently active.
      // V1156: Removed the "skip purge if rate-limited" condition.
      // The old logic skipped purging when hourly/daily limits were active,
      // but the pipeline hits daily limits EVERY day (1001 articles/day),
      // so the purge NEVER ran. This caused 154K rows to accumulate.
      // Now purge runs unconditionally — stale articles are stale regardless
      // of whether we're rate-limited.
      if (PIPELINE_CONFIG.MAX_ARTICLE_AGE_PURGE_MS > 0) {
        try {
          const ageCutoff = new Date(Date.now() - PIPELINE_CONFIG.MAX_ARTICLE_AGE_PURGE_MS);
          const agedOut = await db.newsItem.deleteMany({
            where: {
              isReady: false,
              isPublished: false,
              processingStage: { in: ['fetched', 'content_loaded'] },
              fetchedAt: { lt: ageCutoff },
              retryCount: { lt: PIPELINE_CONFIG.MAX_RETRY_COUNT },
            },
          });
          if (agedOut.count > 0) {
            console.log(`[Orchestrator V1156] Purged ${agedOut.count} aged-out articles (fetched >${PIPELINE_CONFIG.MAX_ARTICLE_AGE_PURGE_MS / 3600000}h ago, early stage, never processed)`);
          }
        } catch (ageErr: any) {
          console.warn(`[Orchestrator V1156] Aged-out purge failed: ${ageErr.message}`);
        }
      }
    }

    // ── Step 4: Reset stuck articles (V45: EVERY cycle!) ──
    // V45: Reset stuck articles EVERY cycle, not just every 5.
    // The old approach (every 5 cycles = every 7.5 minutes) was too slow
    // and caused 4+ hour gaps in publishing when all articles got stuck.
    try {
      const resetCount = await resetStuckRetries();
      if (resetCount > 0) {
        console.log(`[Orchestrator V45] Reset ${resetCount} stuck articles for retry`);
      }
    } catch (err: any) {
      console.warn(`[Orchestrator] Reset stuck failed: ${err.message}`);
    }

    // V45: Also force-reset articles that hit MAX_RETRY but are still recent
    // These articles should get another chance — the pipeline may have been
    // experiencing temporary AI provider issues that are now resolved.
    try {
      const forceResetResult = await forceResetRecentFailed();
      if (forceResetResult > 0) {
        console.log(`[Orchestrator V45] Force-reset ${forceResetResult} recently failed articles`);
      }
    } catch (err: any) {
      console.warn(`[Orchestrator V45] Force reset failed: ${err.message}`);
    }

    // V125→V244: Reset terminal-stage articles (rejected + skipped) back to 'fetched'.
    // 'skipped' articles were previously lost forever — they had valid content from
    // the source but AI refused to process them. Now they get re-processed with the
    // V244 logic (AI rejection produces Path C content instead of skipping).
    // 'rejected' articles are reset for the same reason — V125's one-time cleanup
    // has been generalized to cover both terminal stages every cycle.
    try {
      const terminalCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const terminalArticles = await db.newsItem.findMany({
        where: {
          locale: 'ar',  // V260: Only reset Arabic articles
          processingStage: { in: ['rejected', 'skipped'] },
          isReady: false,
          isPublished: false,
          fetchedAt: { gte: terminalCutoff },
        },
        select: { id: true },
        take: 100,
      });
      if (terminalArticles.length > 0) {
        const resetResult = await db.newsItem.updateMany({
          where: { id: { in: terminalArticles.map(a => a.id) } },
          data: {
            processingStage: 'fetched',
            retryCount: 0,
            rejectCount: 0,
            lastError: null,
          },
        });
        if (resetResult.count > 0) {
          console.log(`[Orchestrator V244] Reset ${resetResult.count} terminal-stage (rejected/skipped) articles back to 'fetched' for re-processing`);
        }
      }
    } catch (err: any) {
      console.warn(`[Orchestrator V244] Terminal-stage reset failed: ${err.message}`);
    }

    // V118: Degraded mode check — if ALL AI providers are down for 15+ min
    if (isCascadeFailure()) {
      const timeSinceSuccess = Date.now() - lastSuccessfulAICall;
      if (!degradedModeActive && timeSinceSuccess > PIPELINE_CONFIG.DEGRADED_MODE_TIMEOUT_MS) {
        degradedModeActive = true;
        degradedModeSince = Date.now();
        console.warn(`[Orchestrator V118] 🔴 DEGRADED MODE activated — AI providers down for ${Math.round(timeSinceSuccess / 60000)} min. Processing with simplified content + SVG images.`);
        await alertAiProvidersDown();
      }
    } else {
      lastSuccessfulAICall = Date.now();
      if (degradedModeActive) {
        degradedModeActive = false;
        console.log(`[Orchestrator V118] 🟢 DEGRADED MODE deactivated — AI providers recovered after ${Math.round((Date.now() - degradedModeSince) / 60000)} min`);
      }
    }

    // V118: Check alert conditions at end of each cycle
    try {
      await checkAlertConditions(publishedThisCycle, errorsThisCycle, processedThisCycle);
    } catch (alertErr: any) {
      console.warn(`[Orchestrator V118] Alert check failed: ${alertErr.message}`);
    }

    // V118→V1156: Run archiver every 10 cycles (~15 min) instead of 100 (~2.5h)
    // The old 100-cycle interval was too slow — DB bloated to 154K rows because
    // the archiver only ran every 2.5 hours with take=50. Now it runs every
    // 15 minutes with take=500, giving 10x faster cleanup.
    if (cycleCount % 10 === 0) {
      try {
        const archiveResult = await runArchiver();
        if (archiveResult.archived > 0) {
          console.log(`[Orchestrator V118] Archiver: ${archiveResult.archived} articles archived in ${archiveResult.duration}ms`);
        }
      } catch (archiveErr: any) {
        console.warn(`[Orchestrator V118] Archiver failed: ${archiveErr.message}`);
      }
    }

    const cycleDuration = Date.now() - cycleStart;
    lastCycleTime = Date.now();

    if (processedThisCycle > 0 || fetchResult.fetched > 0) {
      console.log(`[Orchestrator] Cycle #${cycleCount} done: ${processedThisCycle} processed, ${publishedThisCycle} published, ${errorsThisCycle} errors${degradedModeActive ? ' (DEGRADED)' : ''} in ${cycleDuration}ms`);
    }
  } catch (err: any) {
    lastError = err.message;
    totalErrors++;
    console.error(`[Orchestrator] Cycle #${cycleCount} FATAL ERROR:`, err.message);
  }

  // Schedule next cycle
  scheduleNextCycle();
}

// ── Pick articles for processing ──
// V101: Enhanced article picker with impact-based prioritization.
// V73 base: Priority starvation fix — reserve 60% for early-stage articles.
// V100: Age filter — skip articles older than MAX_ARTICLE_AGE_MS.
// V101: Impact-based sorting — high-impact articles are processed first.
//        When quota is tight (≤10 remaining hourly), skip low-impact articles entirely.
async function pickArticlesForProcessing(maxCount: number, remainingHourlyQuota?: number): Promise<string[]> {
  try {
    // Split stages into two groups:
    // Group A (later stages): imaged, analyzed — closer to publishing, but may be stuck
    // Group B (early stages): translated, content_loaded, fetched — need AI processing
    const laterStages: ProcessingStage[] = ['imaged', 'analyzed'];
    // V244: Added 'skipped' to early stages — skipped articles need to be picked
    // up and re-processed (they're reset to 'fetched' by the terminal-stage reset).
    // Added 'rejected' for the same reason.
    const earlyStages: ProcessingStage[] = ['skipped', 'rejected', 'translated', 'content_loaded', 'fetched'];

    // V100: Age filter — skip articles older than MAX_ARTICLE_AGE_MS
    // Stale news wastes AI resources. Fresh news = better quality + lower cost.
    // V115 FIX: Later stages (analyzed, imaged) are EXEMPT from age filter.
    // These articles only need an image to publish — skipping them due to age
    // causes permanent stuck-state where articles never get picked again.
    // Age filter should only apply to early stages where AI processing is expensive.
    const ageFilter = PIPELINE_CONFIG.MAX_ARTICLE_AGE_MS > 0
      ? { fetchedAt: { gte: new Date(Date.now() - PIPELINE_CONFIG.MAX_ARTICLE_AGE_MS) } }
      : {};
    // V115: No age filter for later stages — they just need an image
    const noAgeFilter = {};

    // V120: REMOVED impactScore filter — it was a DEADLY self-throttling trap.
    // When remainingHourlyQuota <= 10, the filter required impactScore >= 20.
    // But RSS articles always have impactScore=0 (never populated), so the filter
    // excluded ALL articles, killing the pipeline for the rest of the hour.
    // This was the #1 cause of 500→47 articles/day drop.
    const impactFilter: Record<string, any> = {};

    const articleIds: string[] = [];
    const MAX_PER_STAGE = 5; // V73: No single stage can take more than 5 slots
    const MAX_LATER_STAGES = Math.max(5, Math.floor(maxCount * 0.4)); // V73: Max 40% for later stages

    // First, pick from later stages (up to 40% of capacity)
    // V101: Sort by impactScore DESC first, then retryCount ASC, then fetchedAt DESC
    let laterCount = 0;
    for (const stage of laterStages) {
      if (articleIds.length >= maxCount) break;
      if (laterCount >= MAX_LATER_STAGES) break;

      const remaining = Math.min(
        maxCount - articleIds.length,
        MAX_PER_STAGE,
        MAX_LATER_STAGES - laterCount
      );
      if (remaining <= 0) break;

      const articles = await db.newsItem.findMany({
        where: {
          locale: 'ar',  // V260: Only process Arabic articles — EN articles go through en-orchestrator
          isReady: false,
          processingStage: stage,
          retryCount: { lt: PIPELINE_CONFIG.MAX_RETRY_COUNT },
          ...noAgeFilter,  // V115: Later stages exempt from age filter — just need image
          ...impactFilter,
        },
        orderBy: [
          { impactScore: 'desc' },  // V101: High-impact articles first
          { retryCount: 'asc' },
          { fetchedAt: 'desc' },
        ],
        select: { id: true },
        take: remaining,
      });

      articleIds.push(...articles.map(a => a.id));
      laterCount += articles.length;
    }

    // Then, pick from early stages (fill remaining capacity — at least 60%)
    // V101: Sort by impactScore DESC — important news gets AI processing first
    for (const stage of earlyStages) {
      if (articleIds.length >= maxCount) break;

      const remaining = Math.min(
        maxCount - articleIds.length,
        MAX_PER_STAGE * 2 // Allow more from early stages since they need processing
      );
      if (remaining <= 0) break;

      const articles = await db.newsItem.findMany({
        where: {
          locale: 'ar',  // V260: Only process Arabic articles
          isReady: false,
          processingStage: stage,
          retryCount: { lt: PIPELINE_CONFIG.MAX_RETRY_COUNT },
          ...ageFilter,
          ...impactFilter,
        },
        orderBy: [
          { impactScore: 'desc' },  // V101: High-impact articles first
          { retryCount: 'asc' },
          { fetchedAt: 'desc' },
        ],
        select: { id: true },
        take: remaining,
      });

      articleIds.push(...articles.map(a => a.id));
    }

    // V73: If we still have capacity and no early-stage articles, fill with later stages
    if (articleIds.length < maxCount) {
      for (const stage of laterStages) {
        if (articleIds.length >= maxCount) break;

        const articles = await db.newsItem.findMany({
          where: {
            isReady: false,
            processingStage: stage,
            retryCount: { lt: PIPELINE_CONFIG.MAX_RETRY_COUNT },
            id: { notIn: articleIds }, // Don't pick already-selected articles
            ...noAgeFilter,  // V115: Later stages exempt from age filter
            // No impactFilter in overflow — if we have capacity, process anything
          },
          orderBy: [
            { impactScore: 'desc' },  // V101: Still prefer high-impact
            { retryCount: 'asc' },
            { fetchedAt: 'desc' },
          ],
          select: { id: true },
          take: maxCount - articleIds.length,
        });

        articleIds.push(...articles.map(a => a.id));
      }
    }

    if (articleIds.length > 0) {
      console.log(`[Orchestrator V120] Picked ${articleIds.length} articles (later: ${laterCount}, early: ${articleIds.length - laterCount}, maxAge: ${PIPELINE_CONFIG.MAX_ARTICLE_AGE_MS / 3600000}h)`);
    }

    return articleIds;
  } catch (err: any) {
    console.error('[Orchestrator] pickArticlesForProcessing failed:', err.message);
    return [];
  }
}

// ── Process one article through ALL remaining stages ──
interface FullProcessResult {
  success: boolean;
  published: boolean;
  stagesCompleted: string[];
  error?: string;
}

async function processArticleThroughAllStages(articleId: string): Promise<FullProcessResult> {
  const result: FullProcessResult = { success: false, published: false, stagesCompleted: [] };

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
      select: { processingStage: true, isReady: true },
    });

    if (!article) {
      result.error = 'Article not found';
      return result;
    }

    if (article.isReady) {
      result.success = true;
      result.published = true;
      return result;
    }

    const currentStage = (article.processingStage || 'fetched') as ProcessingStage;

    // V244: Handle terminal stages (skipped/rejected) — reset to 'fetched' for reprocessing.
    // These articles were previously lost forever. Now the V244 logic produces Path [C]
    // content instead of skipping, but we still need to handle legacy skipped/rejected articles.
    if (RESETTABLE_STAGES.includes(currentStage)) {
      try {
        await db.newsItem.update({
          where: { id: articleId },
          data: {
            processingStage: 'fetched',
            retryCount: 0,
            lastError: null,
            rejectCount: 0,
          },
        });
        console.log(`[Orchestrator V244] Reset article ${articleId} from '${currentStage}' → 'fetched' for re-processing`);
      } catch (resetErr: any) {
        console.warn(`[Orchestrator V244] Failed to reset article ${articleId}: ${resetErr.message}`);
        result.error = `Failed to reset from ${currentStage}`;
        return result;
      }
    }

    const stageIdx = STAGE_ORDER.includes(currentStage) ? STAGE_ORDER.indexOf(currentStage) : 0;

    // Process each remaining stage in order
    const stagesToProcess = STAGE_ORDER.slice(stageIdx);

    for (const stage of stagesToProcess) {
      try {
        // V38: Cross-stage validation — check that the previous stage produced valid output
        if (stage !== 'fetched') {
          const validation = await validateStageOutput(articleId, stage);
          if (!validation.valid) {
            console.warn(`[Orchestrator] Article ${articleId} blocked at ${stage}: ${validation.reason}`);
            await recordError(articleId, `Stage ${stage} validation failed: ${validation.reason}`);
            // V93c/V233: If article is at 'imaged' without a real generatedImage (missing or SVG placeholder),
            // reset to 'analyzed' so the imager can try again. Without this, articles get permanently stuck.
            if (stage === 'imaged' && (validation.reason?.includes('generatedImage') || validation.reason?.includes('SVG'))) {
              try {
                // V233: Clear the SVG placeholder so imager starts fresh
                await db.newsItem.update({
                  where: { id: articleId },
                  data: { processingStage: 'analyzed', generatedImage: null },
                });
                console.log(`[Orchestrator V233] Reset article ${articleId} from 'imaged' → 'analyzed' (${validation.reason}, will retry with fresh image generation)`);
              } catch (resetErr: any) {
                console.warn(`[Orchestrator V233] Failed to reset article ${articleId}: ${resetErr.message}`);
              }
            }
            // V116: If article is at 'analyzed' without valid aiAnalysis, reset to
            // 'content_loaded' so the unified processor re-generates the analysis.
            // Without this, articles at 'analyzed' with missing/corrupt aiAnalysis
            // create an infinite validate-fail-reset loop (the #1 cause of 0 publications).
            // This is NOT the same as V113's concern about publish→analyze loops —
            // here we're fixing a MISSING prerequisite, not a quality rejection.
            if (stage === 'analyzed' && (
              validation.reason?.includes('aiAnalysis') ||
              validation.reason?.includes('fullContent')
            )) {
              try {
                await db.newsItem.update({
                  where: { id: articleId },
                  data: {
                    processingStage: 'content_loaded',
                    lastError: null,
                    retryCount: 0,
                  },
                });
                console.log(`[Orchestrator V116] Reset article ${articleId} from 'analyzed' → 'content_loaded' (missing aiAnalysis — will re-process)`);
              } catch (resetErr: any) {
                console.warn(`[Orchestrator V116] Failed to reset article ${articleId}: ${resetErr.message}`);
              }
            }
            // V113: Do NOT reset to a previous stage for non-image validation failures.
            // This prevents the infinite loop: fail publish → reset to analyzed →
            // re-generate same image → same rejection → retryCount=15 → loss.
            break;
          }
        }

        const stageResult = await processStage(articleId, stage);
        if (stageResult.success) {
          result.stagesCompleted.push(stage);

          // V124: After content_loaded, check article's actual stage to decide next steps.
          // The unified processor may have:
          //   a) REJECTED the article → stage='rejected' → stop pipeline
          //   b) Fully processed it → stage='analyzed' → skip to 'imaged'
          if (stage === 'content_loaded') {
            const currentArticle = await db.newsItem.findUnique({
              where: { id: articleId },
              select: { processingStage: true },
            });
            const actualStage = currentArticle?.processingStage;

            if (actualStage === 'rejected' || actualStage === 'skipped') {
              console.log(`[Orchestrator V126] Article ${articleId} was ${actualStage} — stopping pipeline`);
              result.success = true; // Not an error — intentional filter
              return result;
            }

            if (actualStage === 'analyzed') {
              // Unified processor already did translate + analyze → skip to imaging
              console.log(`[Orchestrator V124] Article ${articleId} already at 'analyzed' (unified processor) — skipping to imaging`);
              // Skip 'translated' and 'analyzed' stages in the loop
              const analyzedIdx = STAGE_ORDER.indexOf('analyzed');
              const imagedIdx = STAGE_ORDER.indexOf('imaged');
              if (analyzedIdx >= 0 && imagedIdx >= 0) {
                // Re-read article for imaging validation
                const imgValidation = await validateStageOutput(articleId, 'imaged');
                if (!imgValidation.valid) {
                  // Need to generate image first
                  const imageResult = await imageArticle(articleId);
                  if (imageResult.success) {
                    result.stagesCompleted.push('analyzed', 'imaged');
                    const pubResult = await publishArticle(articleId);
                    if (pubResult.success) {
                      result.published = true;
                    } else {
                      await recordError(articleId, `Publish failed: ${pubResult.reason}`);
                    }
                  } else {
                    await recordError(articleId, `imaged failed: ${imageResult.error}`);
                  }
                } else {
                  // Already has image, just publish
                  result.stagesCompleted.push('analyzed', 'imaged');
                  const pubResult = await publishArticle(articleId);
                  if (pubResult.success) {
                    result.published = true;
                  } else {
                    await recordError(articleId, `Publish failed: ${pubResult.reason}`);
                  }
                }
                result.success = true;
                return result;
              }
            }
          }

          if (stage === 'imaged') {
            // After imaging, try to publish
            const pubResult = await publishArticle(articleId);
            if (pubResult.success) {
              result.published = true;
            } else {
              await recordError(articleId, `Publish failed: ${pubResult.reason}`);
              // V113/V233: Only reset to 'analyzed' if the failure is about a missing/invalid/SVG image.
              // For ALL other publish failures (bad Arabic, missing fields, etc.), do NOT reset
              // to a previous stage — this caused the infinite loop where articles cycle:
              // analyzed → imaged → publish fail → reset to analyzed → same result → retryCount=15
              if (pubResult.reason?.includes('generatedImage') || pubResult.reason?.includes('SVG')) {
                try {
                  // V233: Clear the SVG placeholder so imager starts fresh
                  await db.newsItem.update({
                    where: { id: articleId },
                    data: { processingStage: 'analyzed', generatedImage: null },
                  });
                  console.log(`[Orchestrator V233] Reset article ${articleId} from 'imaged' → 'analyzed' (publish failed: ${pubResult.reason?.slice(0, 80)})`);
                } catch (resetErr: any) {
                  console.warn(`[Orchestrator V233] Failed to reset article ${articleId}: ${resetErr.message}`);
                }
              } else {
                // V113: Non-image publish failure — log but do NOT reset stage.
                // The article stays at 'imaged' and will be picked up again, but without
                // regressing to 'analyzed' and re-triggering the whole pipeline.
                // After MAX_RETRY_COUNT failures, it will be permanently marked as failed.
                console.warn(`[Orchestrator V113] Publish failed for ${articleId}: ${pubResult.reason?.slice(0, 100)} — NOT resetting stage (prevents infinite loop)`);
              }
            }
          }
        } else {
          // Stage failed — stop processing this article
          if (stageResult.error) {
            await recordError(articleId, `${stage} failed: ${stageResult.error}`);
          }
          break;
        }
      } catch (err: any) {
        await recordError(articleId, `${stage} error: ${err.message}`);
        break;
      }
    }

    result.success = result.stagesCompleted.length > 0;
    return result;
  } catch (err: any) {
    result.error = err.message;
    return result;
  }
}

// V38: Cross-stage validation — verify the previous stage produced valid output
async function validateStageOutput(articleId: string, stage: ProcessingStage): Promise<{ valid: boolean; reason?: string }> {
  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
      select: {
        titleAr: true,
        contentAr: true,
        aiAnalysis: true,
        // EGRESS FIX: removed generatedImage from select — use processingStage to check image existence
        slug: true,
        processingStage: true,
        locale: true,
        title: true,
        content: true,
      },
    });

    if (!article) return { valid: false, reason: 'Article not found' };

    const isEn = article.locale === 'en';

    switch (stage) {
      case 'content_loaded': {
        // Before translating: title must exist (from fetch)
        // V248: For English articles, check title; for Arabic, check titleAr or title
        if (isEn) {
          if (!article.title || article.title.length < 3) {
            return { valid: false, reason: 'No English title to process' };
          }
        } else {
          if (!article.titleAr && !article.title) {
            return { valid: false, reason: 'No title to translate' };
          }
        }
        return { valid: true };
      }

      case 'translated': {
        // V248: English articles skip this stage (en-processor goes straight to 'analyzed')
        // For Arabic articles: must have Arabic title AND Arabic content
        if (isEn) {
          // English articles should NOT be at 'translated' stage — they go directly to 'analyzed'
          return { valid: true };
        }
        if (!article.titleAr) {
          return { valid: false, reason: 'Missing titleAr — translation did not complete' };
        }
        if (!article.contentAr || article.contentAr.length < PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH) {
          return { valid: false, reason: `Missing or short contentAr (${article.contentAr?.length || 0} < ${PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH}) — translation did not complete` };
        }
        return { valid: true };
      }

      case 'analyzed': {
        // Before imaging: must have AI analysis
        if (!article.aiAnalysis || article.aiAnalysis.length < 50) {
          return { valid: false, reason: 'Missing aiAnalysis — analysis did not complete' };
        }
        try {
          const parsed = JSON.parse(article.aiAnalysis);
          if (!parsed.fullContent) {
            return { valid: false, reason: 'aiAnalysis has no fullContent' };
          }
          // V248: For English articles, check for English content; for Arabic, check for Arabic content
          if (isEn) {
            if (!/[a-zA-Z]/.test(parsed.fullContent)) {
              return { valid: false, reason: 'aiAnalysis fullContent has no English text' };
            }
          } else {
            if (!/[\u0600-\u06FF]/.test(parsed.fullContent)) {
              return { valid: false, reason: 'aiAnalysis has no Arabic fullContent' };
            }
          }
        } catch {
          return { valid: false, reason: 'aiAnalysis is not valid JSON' };
        }
        return { valid: true };
      }

      case 'imaged': {
        // EGRESS FIX: Check processingStage instead of pulling generatedImage base64 data.
        // If the article reached 'imaged' stage, the imager successfully generated an image.
        // SVG placeholder detection is handled by auto-migrate (Fix 4b2).
        if (article.processingStage !== 'imaged') {
          return { valid: false, reason: 'Article not at imaged stage — image generation did not complete' };
        }
        return { valid: true };
      }

      default:
        return { valid: true };
    }
  } catch (err: any) {
    return { valid: false, reason: `Validation error: ${err.message}` };
  }
}

// Process a single stage for an article
async function processStage(articleId: string, stage: ProcessingStage): Promise<{ success: boolean; error?: string }> {
  switch (stage) {
    case 'fetched': {
      // V145: RESTORED URL CONTENT LOADING with smart extraction!
      // V36 removed URL loading because it got garbage (nav, footers, sidebars).
      // V145 brings it back with proper HTML extraction that filters out UI junk.
      // The extracted content goes into the `content` field, giving the unified
      // processor MUCH richer source material than just the 500-char RSS summary.
      // Graceful degradation: if scraping fails, pipeline continues with RSS summary only.
      try {
        const loadResult = await loadArticleContent(articleId);
        if (loadResult.contentLength > 0) {
          console.log(`[Orchestrator V145] Content loaded for ${articleId}: ${loadResult.contentLength} chars via ${loadResult.method} in ${loadResult.duration}ms`);
        }
      } catch (err: any) {
        // Non-fatal — continue with RSS summary only
        console.warn(`[Orchestrator V145] Content loading failed for ${articleId}: ${err.message} — continuing with RSS summary`);
      }
      await advanceStage(articleId, 'fetched');
      return { success: true };
    }

    case 'content_loaded': {
      // V248: Route English articles through the English pipeline
      try {
        const articleCheck = await db.newsItem.findUnique({
          where: { id: articleId },
          select: { locale: true },
        });
        if (articleCheck?.locale === 'en') {
          // ═══ ENGLISH PIPELINE ═══
          console.log(`[Orchestrator V248] Processing English article ${articleId} via en-processor`);
          try {
            const { processArticleEn } = await import('./agents/en-processor');
            const enResult = await processArticleEn(articleId);
            if (enResult.success) {
              console.log(`[Orchestrator V248] English article ${articleId} processed — fields: ${enResult.fields.join(', ')}`);
              return { success: true };
            }
            console.warn(`[Orchestrator V248] English processor failed for ${articleId}: ${enResult.error} — retrying once`);
            // Retry once
            const retryResult = await processArticleEn(articleId);
            if (retryResult.success) {
              console.log(`[Orchestrator V248] English article ${articleId} retry succeeded — fields: ${retryResult.fields.join(', ')}`);
              return { success: true };
            }
            console.warn(`[Orchestrator V248] English processor retry also failed for ${articleId}: ${retryResult.error}`);
            return { success: false, error: retryResult.error };
          } catch (enErr: any) {
            console.error(`[Orchestrator V248] English processor fatal error for ${articleId}: ${enErr.message}`);
            return { success: false, error: enErr.message };
          }
        }
      } catch (localeErr: any) {
        // V260: Do NOT fall back to Arabic pipeline — return error instead
        // Previously this fell through and Arabic pipeline overwrote EN articles with Arabic content
        console.error(`[Orchestrator V260] Locale check failed for ${articleId}: ${localeErr.message} — skipping article (not falling back to Arabic pipeline)`);
        return { success: false, error: `Locale check failed: ${localeErr.message}` };
      }

      // ═══ ARABIC PIPELINE (default) ═══
      // V66: Try unified processor first (single API call: translate + analyze)
      // V98: Retry once before falling back to separate agents (saves 2-3 API calls)
      // Falls back to separate translator + analyzer only if BOTH attempts fail
      try {
        const unifiedResult = await processArticleUnified(articleId);
        if (unifiedResult.success) {
          // Unified processor succeeded — article is now at 'analyzed' stage
          return { success: true };
        }
        console.warn(`[Orchestrator V66] Unified processor failed for ${articleId}: ${unifiedResult.error}`);

        // V98: Retry once before expensive fallback — common case is JSON parsing issue
        // that resolves on second attempt. This saves 2-3 API calls vs separate agents.
        console.log(`[Orchestrator V98] Retrying unified processor for ${articleId} before fallback...`);
        const retryResult = await processArticleUnified(articleId);
        if (retryResult.success) {
          return { success: true };
        }
        console.warn(`[Orchestrator V98] Unified processor retry also failed for ${articleId}: ${retryResult.error} — falling back to separate agents`);
      } catch (err: any) {
        console.warn(`[Orchestrator V66] Unified processor error for ${articleId}: ${err.message} — falling back to separate agents`);
      }
      // Fallback: use separate translator
      const translateResult = await translateArticle(articleId);
      return { success: translateResult.success, error: translateResult.error };
    }

    case 'translated': {
      // This stage is reached when unified processor was NOT used (fallback path)
      const analyzeResult = await analyzeArticle(articleId);
      return { success: analyzeResult.success, error: analyzeResult.error };
    }

    case 'analyzed': {
      const imageResult = await imageArticle(articleId);
      return { success: imageResult.success, error: imageResult.error };
    }

    case 'imaged': {
      // This stage is handled by the publisher call above
      return { success: true };
    }

    default:
      return { success: false, error: `Unknown stage: ${stage}` };
  }
}

function scheduleNextCycle(): void {
  if (!isRunning) return;

  // V56: Clear previous timer to prevent duplicate cycles
  if (cycleTimer) {
    clearTimeout(cycleTimer);
    cycleTimer = null;
  }

  cycleTimer = setTimeout(async () => {
    try {
      await runCycle();
    } catch (err: any) {
      console.error(`[Orchestrator V58] Unhandled error in cycle: ${err.message}`);
      lastError = err.message;
      totalErrors++;
      // V58: Track the crash-restart timer in cycleTimer so it can be properly
      // managed and so ensureRunning() can detect if this restart also dies
      console.log(`[Orchestrator V58] Auto-restarting in ${PIPELINE_CONFIG.CRASH_RESTART_DELAY_MS / 1000}s...`);
      cycleTimer = setTimeout(async () => {
        try {
          await runCycle();
        } catch (restartErr: any) {
          console.error(`[Orchestrator V58] Restart cycle also failed: ${restartErr.message}`);
          // Don't give up — schedule another attempt
          scheduleNextCycle();
        }
      }, PIPELINE_CONFIG.CRASH_RESTART_DELAY_MS);
    }
  }, PIPELINE_CONFIG.CYCLE_INTERVAL_MS);
}
