// ═══════════════════════════════════════════════════════════════
// Publish Quota Manager V359
// ═══════════════════════════════════════════════════════════════
// CENTRALIZED quota enforcement for ALL publishing paths.
//
// ROOT CAUSE of limit violations (V359 analysis):
//   Multiple publishing paths (orchestrator, cron, housekeeping,
//   mark-ready, fix-published) all check limits INDEPENDENTLY,
//   then publish. This creates a race condition:
//     1. Orchestrator reads: hour=48/50, decides it can publish 2
//     2. Cron route reads: hour=48/50, decides it can publish 2
//     3. Both publish 2 each → hour=52/50 → LIMIT EXCEEDED
//
// FIX: This module provides a SINGLE point of quota enforcement
// that ALL publishing paths must use. It combines:
//   1. DB-based counting (accurate across processes)
//   2. In-process tracking (catches concurrent calls within same Node.js process)
//   3. Atomic-ish check: DB count + in-process tracking before every publish
//
// USAGE:
//   import { canPublish, recordPublish } from '@/lib/pipeline/publish-quota';
//
//   // Before publishing:
//   const check = await canPublish('ar');
//   if (!check.allowed) {
//     console.log(`Quota reached: ${check.reason}`);
//     return;
//   }
//
//   // After successful publish:
//   recordPublish('ar');
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { getPipelineLimits } from './config';
import { getEnPipelineLimits } from './en-pipeline-config';
import { getFrPipelineLimits } from './fr-pipeline-config';
import { getTrPipelineLimits } from './tr-pipeline-config';
import { PIPELINE_CONFIG } from './config';
import { getEsPipelineLimits } from './es-pipeline-config';

// ── Types ──

export type AppLocale = 'ar' | 'en' | 'es' | 'fr' | 'tr';

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  /** Current published count this hour (from DB + in-process) */
  hourCount: number;
  /** Current published count today (from DB + in-process) */
  dayCount: number;
  /** Max allowed per hour */
  hourLimit: number;
  /** Max allowed per day */
  dayLimit: number;
  /** Remaining slots this hour */
  hourRemaining: number;
  /** Remaining slots today */
  dayRemaining: number;
}

// ── In-Process Tracking ──
// Tracks publishes within the current Node.js process that haven't
// been reflected in the DB yet. This prevents two concurrent calls
// within the same process from both seeing the same DB count and
// both deciding they can publish.

interface LocaleTracking {
  /** Number of articles published this hour (in-process only, added to DB count) */
  hourlyPublished: number;
  /** Number of articles published today (in-process only, added to DB count) */
  dailyPublished: number;
  /** Hour key for tracking reset (e.g., "2026-05-26T14:00") */
  hourKey: string;
  /** Day key for tracking reset (e.g., "2026-05-26") */
  dayKey: string;
}

const tracking: Record<AppLocale, LocaleTracking> = {
  ar: { hourlyPublished: 0, dailyPublished: 0, hourKey: '', dayKey: '' },
  en: { hourlyPublished: 0, dailyPublished: 0, hourKey: '', dayKey: '' },
  es: { hourlyPublished: 0, dailyPublished: 0, hourKey: '', dayKey: '' },
  fr: { hourlyPublished: 0, dailyPublished: 0, hourKey: '', dayKey: '' },
  tr: { hourlyPublished: 0, dailyPublished: 0, hourKey: '', dayKey: '' },
};

// ── Cache ──
// DB queries are expensive. Cache the last count for each locale
// with a short TTL to avoid hammering the database.

interface CachedCount {
  hourCount: number;
  dayCount: number;
  ts: number;
  hourKey: string;
  dayKey: string;
}

const countCache: Record<AppLocale, CachedCount | null> = {
  ar: null,
  en: null,
  es: null,
  fr: null,
  tr: null,
};
const CACHE_TTL_MS = 5_000; // 5 seconds — short enough for accuracy, long enough to avoid DB hammering

// ── Helper: Get time boundaries ──

function getTimeBoundaries(): {
  hourStart: Date;
  todayStart: Date;
  currentHourKey: string;
  currentDayKey: string;
} {
  const now = new Date();
  const hourStart = new Date(now);
  hourStart.setUTCMinutes(0, 0, 0);

  const resetHour = PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0;
  const todayStart = new Date(now);
  todayStart.setUTCHours(resetHour, 0, 0, 0);
  if (now.getUTCHours() < resetHour) {
    todayStart.setUTCDate(todayStart.getUTCDate() - 1);
  }

  const currentHourKey = now.toISOString().slice(0, 13) + ':00';
  const currentDayKey = now.toISOString().slice(0, 10);

  return { hourStart, todayStart, currentHourKey, currentDayKey };
}

// ── Helper: Reset in-process tracking if hour/day changed ──

function resetTrackingIfNeeded(locale: AppLocale, currentHourKey: string, currentDayKey: string): void {
  const t = tracking[locale];
  if (t.hourKey !== currentHourKey) {
    t.hourlyPublished = 0;
    t.hourKey = currentHourKey;
  }
  if (t.dayKey !== currentDayKey) {
    t.dailyPublished = 0;
    t.dayKey = currentDayKey;
  }
}

// ── Core: Get published counts from DB ──

async function getDBPublishCounts(locale: AppLocale): Promise<{ hourCount: number; dayCount: number }> {
  const { hourStart, todayStart } = getTimeBoundaries();

  // Build locale-specific visibility filter
  // V377: Added newsType: 'live' — quota should ONLY count live news articles.
  // Reports and analyses should NOT consume the daily/hourly limit.
  const filter: Record<string, any> = {
    locale,
    isReady: true,
    isPublished: true,
    newsType: 'live',
    slug: { not: '' },
  };

  // Add title filter based on locale
  if (locale === 'ar') {
    filter.titleAr = { not: '' };
  } else {
    filter.title = { not: '' };
  }

  try {
    const [dayCount, hourCount] = await Promise.all([
      db.newsItem.count({
        where: { ...filter, publishedAt: { gte: todayStart } },
      }),
      db.newsItem.count({
        where: { ...filter, publishedAt: { gte: hourStart } },
      }),
    ]);
    return { hourCount, dayCount };
  } catch (err: any) {
    console.error(`[PublishQuota V359] DB count query failed for ${locale}: ${err.message}`);
    // Return 0 on failure — safer to allow publishing than to permanently block
    return { hourCount: 0, dayCount: 0 };
  }
}

// ── Core: Get limits for a locale ──

async function getLimitsForLocale(locale: AppLocale): Promise<{ hourLimit: number; dayLimit: number }> {
  switch (locale) {
    case 'ar': {
      const limits = await getPipelineLimits();
      return { hourLimit: limits.maxPublishedPerHour, dayLimit: limits.maxPublishedPerDay };
    }
    case 'en': {
      const limits = await getEnPipelineLimits();
      return { hourLimit: limits.maxHourlyEnNews, dayLimit: limits.maxDailyEnNews };
    }
    case 'fr': {
      const limits = await getFrPipelineLimits();
      return { hourLimit: limits.maxHourlyFrNews, dayLimit: limits.maxDailyFrNews };
    }
    case 'es': {
      const limits = await getEsPipelineLimits();
      return { hourLimit: limits.maxHourlyEsNews, dayLimit: limits.maxDailyEsNews };
    }
    case 'tr': {
      const limits = await getTrPipelineLimits();
      return { hourLimit: limits.maxHourlyTrNews, dayLimit: limits.maxDailyTrNews };
    }
    default:
      return { hourLimit: 999, dayLimit: 999 };
  }
}

// ── Public API ──

/**
 * Check if publishing is allowed for a given locale.
 * Combines DB-based counting with in-process tracking for accuracy.
 *
 * IMPORTANT: This must be called BEFORE every publish operation.
 * After a successful publish, call recordPublish() to update in-process tracking.
 */
export async function canPublish(locale: AppLocale): Promise<QuotaCheckResult> {
  const { currentHourKey, currentDayKey } = getTimeBoundaries();

  // Reset in-process tracking if hour/day changed
  resetTrackingIfNeeded(locale, currentHourKey, currentDayKey);

  // Get limits for this locale
  const { hourLimit, dayLimit } = await getLimitsForLocale(locale);

  // Get DB counts (with cache)
  const cached = countCache[locale];
  let dbHourCount: number;
  let dbDayCount: number;

  if (cached && Date.now() - cached.ts < CACHE_TTL_MS && cached.hourKey === currentHourKey && cached.dayKey === currentDayKey) {
    // Use cached DB counts
    dbHourCount = cached.hourCount;
    dbDayCount = cached.dayCount;
  } else {
    // Fresh DB query
    const counts = await getDBPublishCounts(locale);
    dbHourCount = counts.hourCount;
    dbDayCount = counts.dayCount;
    countCache[locale] = {
      hourCount: dbHourCount,
      dayCount: dbDayCount,
      ts: Date.now(),
      hourKey: currentHourKey,
      dayKey: currentDayKey,
    };
  }

  // Add in-process tracking (articles published in this process but not yet reflected in DB)
  const totalHourCount = dbHourCount + tracking[locale].hourlyPublished;
  const totalDayCount = dbDayCount + tracking[locale].dailyPublished;

  const hourRemaining = hourLimit > 0 ? Math.max(0, hourLimit - totalHourCount) : 999;
  const dayRemaining = dayLimit > 0 ? Math.max(0, dayLimit - totalDayCount) : 999;

  const allowed = hourRemaining > 0 && dayRemaining > 0;

  let reason: string | undefined;
  if (!allowed) {
    if (hourRemaining <= 0) {
      reason = `Hourly quota reached: ${totalHourCount}/${hourLimit} (DB: ${dbHourCount} + in-process: ${tracking[locale].hourlyPublished})`;
    } else {
      reason = `Daily quota reached: ${totalDayCount}/${dayLimit} (DB: ${dbDayCount} + in-process: ${tracking[locale].dailyPublished})`;
    }
  }

  return {
    allowed,
    reason,
    hourCount: totalHourCount,
    dayCount: totalDayCount,
    hourLimit,
    dayLimit,
    hourRemaining,
    dayRemaining,
  };
}

/**
 * Record that an article was published for a given locale.
 * Call this AFTER a successful publish to update in-process tracking.
 *
 * This ensures that subsequent canPublish() calls within the same
 * process account for articles that haven't been reflected in the DB yet.
 */
export function recordPublish(locale: AppLocale): void {
  const { currentHourKey, currentDayKey } = getTimeBoundaries();
  resetTrackingIfNeeded(locale, currentHourKey, currentDayKey);

  tracking[locale].hourlyPublished++;
  tracking[locale].dailyPublished++;

  // Invalidate the DB count cache for this locale
  // so the next canPublish() call fetches fresh data
  countCache[locale] = null;
}

/**
 * Force a fresh DB count on the next canPublish() call.
 * Use this when you know the DB state has changed externally
 * (e.g., after a fix-published or mark-ready operation).
 */
export function invalidateQuotaCache(locale?: AppLocale): void {
  if (locale) {
    countCache[locale] = null;
  } else {
    countCache.ar = null;
    countCache.en = null;
    countCache.es = null;
    countCache.fr = null;
    countCache.tr = null;
  }
}

/**
 * Get current quota status for a locale.
 * This always queries the DB for the most accurate counts.
 * Use for dashboard/stats display.
 */
export async function getQuotaStatus(locale: AppLocale): Promise<QuotaCheckResult> {
  // Force fresh DB query by invalidating cache
  countCache[locale] = null;
  return canPublish(locale);
}

/**
 * Get quota status for ALL locales.
 * Useful for dashboard display.
 */
export async function getAllQuotaStatuses(): Promise<Record<AppLocale, QuotaCheckResult>> {
  const [ar, en, es, fr, tr] = await Promise.all([
    getQuotaStatus('ar'),
    getQuotaStatus('en'),
    getQuotaStatus('es'),
    getQuotaStatus('fr'),
    getQuotaStatus('tr'),
  ]);
  return { ar, en, es, fr, tr };
}

// ═══════════════════════════════════════════════════════════════
// V380: Stock Analysis Quota
// ═══════════════════════════════════════════════════════════════
// The stock analysis pipeline was publishing with ZERO quota checks,
// creating up to 750 NewsItem records per day without any limit.
// This caused massive AI resource consumption that starved the news
// pipeline processors (fr-processor, tr-processor, es-processor),
// which — combined with REQUIRE_AI_ANALYSIS: true — blocked news
// publishing entirely when AI was slow or failing.
//
// FIX: Separate quota for stock_analysis articles. Does NOT consume
// the live news quota (they remain independent), but has its own
// ceiling to prevent unbounded AI usage.
// ═══════════════════════════════════════════════════════════════

// V381: Hardcoded defaults for stock analysis quotas — can be overridden from admin dashboard (DB)
const DEFAULT_MAX_STOCK_ANALYSIS_PER_DAY_PER_LOCALE = 200;
const DEFAULT_MAX_STOCK_ANALYSIS_PER_HOUR_PER_LOCALE = 40;

// Cache for DB-based stock analysis limits (same pattern as live pipeline limits)
let _stockLimitsCache: { maxDailyPerLocale: number; maxHourlyPerLocale: number; ts: number } | null = null;
const STOCK_LIMITS_CACHE_TTL_MS = 30_000; // 30 seconds

/**
 * V381: Get stock analysis limits from DB, falling back to hardcoded defaults.
 * Same pattern as getEnPipelineLimits(), getFrPipelineLimits(), etc.
 */
async function getStockAnalysisLimits(): Promise<{ maxDailyPerLocale: number; maxHourlyPerLocale: number }> {
  if (_stockLimitsCache && Date.now() - _stockLimitsCache.ts < STOCK_LIMITS_CACHE_TTL_MS) {
    return { maxDailyPerLocale: _stockLimitsCache.maxDailyPerLocale, maxHourlyPerLocale: _stockLimitsCache.maxHourlyPerLocale };
  }

  try {
    const { db } = await import('@/lib/db');
    const daySetting = await db.siteSetting.findUnique({ where: { key: 'stock_maxDailyStockPerLocale' } });
    const hourSetting = await db.siteSetting.findUnique({ where: { key: 'stock_maxHourlyStockPerLocale' } });

    const dbDayValue = daySetting?.value ? parseInt(daySetting.value, 10) : 0;
    const dbHourValue = hourSetting?.value ? parseInt(hourSetting.value, 10) : 0;

    const maxDailyPerLocale = dbDayValue > 0 ? dbDayValue : DEFAULT_MAX_STOCK_ANALYSIS_PER_DAY_PER_LOCALE;
    const maxHourlyPerLocale = dbHourValue > 0 ? dbHourValue : DEFAULT_MAX_STOCK_ANALYSIS_PER_HOUR_PER_LOCALE;

    _stockLimitsCache = { maxDailyPerLocale, maxHourlyPerLocale, ts: Date.now() };
    return { maxDailyPerLocale, maxHourlyPerLocale };
  } catch {
    return {
      maxDailyPerLocale: DEFAULT_MAX_STOCK_ANALYSIS_PER_DAY_PER_LOCALE,
      maxHourlyPerLocale: DEFAULT_MAX_STOCK_ANALYSIS_PER_HOUR_PER_LOCALE,
    };
  }
}

/**
 * V381: Clear stock analysis limits cache (call after saving new limits from admin).
 */
export function clearStockAnalysisLimitsCache(): void {
  _stockLimitsCache = null;
}

// In-process tracking for stock analysis (separate from live news)
interface StockAnalysisTracking {
  hourlyPublished: number;
  dailyPublished: number;
  hourKey: string;
  dayKey: string;
}

const stockTracking: Record<AppLocale, StockAnalysisTracking> = {
  ar: { hourlyPublished: 0, dailyPublished: 0, hourKey: '', dayKey: '' },
  en: { hourlyPublished: 0, dailyPublished: 0, hourKey: '', dayKey: '' },
  es: { hourlyPublished: 0, dailyPublished: 0, hourKey: '', dayKey: '' },
  fr: { hourlyPublished: 0, dailyPublished: 0, hourKey: '', dayKey: '' },
  tr: { hourlyPublished: 0, dailyPublished: 0, hourKey: '', dayKey: '' },
};

// Cache for stock analysis DB counts
const stockCountCache: Record<AppLocale, CachedCount | null> = {
  ar: null, en: null, es: null, fr: null, tr: null,
};

/**
 * Check if stock analysis publishing is allowed for a given locale.
 * Uses a SEPARATE quota from live news — stock_analysis articles do NOT
 * consume the live news quota, but they have their own ceiling.
 *
 * V380: This prevents the stock pipeline from consuming unlimited AI
 * resources and starving the news pipeline processors.
 */
export async function canPublishStockAnalysis(locale: AppLocale): Promise<QuotaCheckResult> {
  const { hourStart, todayStart, currentHourKey, currentDayKey } = getTimeBoundaries();

  // V381: Get limits from DB (with cache), fallback to hardcoded defaults
  const { maxDailyPerLocale, maxHourlyPerLocale } = await getStockAnalysisLimits();

  // Reset in-process tracking if hour/day changed
  const st = stockTracking[locale];
  if (st.hourKey !== currentHourKey) {
    st.hourlyPublished = 0;
    st.hourKey = currentHourKey;
  }
  if (st.dayKey !== currentDayKey) {
    st.dailyPublished = 0;
    st.dayKey = currentDayKey;
  }

  // Get DB counts for stock_analysis
  let dbHourCount = 0;
  let dbDayCount = 0;

  const cached = stockCountCache[locale];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS && cached.hourKey === currentHourKey && cached.dayKey === currentDayKey) {
    dbHourCount = cached.hourCount;
    dbDayCount = cached.dayCount;
  } else {
    try {
      const filter: Record<string, any> = {
        locale,
        isReady: true,
        isPublished: true,
        newsType: 'stock_analysis',
      };
      const [dCount, hCount] = await Promise.all([
        db.newsItem.count({ where: { ...filter, publishedAt: { gte: todayStart } } }),
        db.newsItem.count({ where: { ...filter, publishedAt: { gte: hourStart } } }),
      ]);
      dbDayCount = dCount;
      dbHourCount = hCount;
      stockCountCache[locale] = {
        hourCount: dbHourCount,
        dayCount: dbDayCount,
        ts: Date.now(),
        hourKey: currentHourKey,
        dayKey: currentDayKey,
      };
    } catch (err: any) {
      console.error(`[PublishQuota V380] Stock analysis DB count failed for ${locale}: ${err.message}`);
    }
  }

  const totalHourCount = dbHourCount + st.hourlyPublished;
  const totalDayCount = dbDayCount + st.dailyPublished;

  const hourRemaining = maxHourlyPerLocale > 0
    ? Math.max(0, maxHourlyPerLocale - totalHourCount) : 999;
  const dayRemaining = maxDailyPerLocale > 0
    ? Math.max(0, maxDailyPerLocale - totalDayCount) : 999;

  const allowed = hourRemaining > 0 && dayRemaining > 0;

  let reason: string | undefined;
  if (!allowed) {
    if (hourRemaining <= 0) {
      reason = `Stock analysis hourly quota reached: ${totalHourCount}/${maxHourlyPerLocale} (DB: ${dbHourCount} + in-process: ${st.hourlyPublished})`;
    } else {
      reason = `Stock analysis daily quota reached: ${totalDayCount}/${maxDailyPerLocale} (DB: ${dbDayCount} + in-process: ${st.dailyPublished})`;
    }
  }

  return {
    allowed,
    reason,
    hourCount: totalHourCount,
    dayCount: totalDayCount,
    hourLimit: maxHourlyPerLocale,
    dayLimit: maxDailyPerLocale,
    hourRemaining,
    dayRemaining,
  };
}

/**
 * Record that a stock analysis article was published for a given locale.
 * Call this AFTER a successful stock analysis publish.
 * V380: Updates separate in-process tracking for stock_analysis quota.
 */
export function recordStockAnalysisPublish(locale: AppLocale): void {
  const { currentHourKey, currentDayKey } = getTimeBoundaries();
  const st = stockTracking[locale];
  if (st.hourKey !== currentHourKey) {
    st.hourlyPublished = 0;
    st.hourKey = currentHourKey;
  }
  if (st.dayKey !== currentDayKey) {
    st.dailyPublished = 0;
    st.dayKey = currentDayKey;
  }

  st.hourlyPublished++;
  st.dailyPublished++;

  // Invalidate cache so next check fetches fresh data
  stockCountCache[locale] = null;
}
