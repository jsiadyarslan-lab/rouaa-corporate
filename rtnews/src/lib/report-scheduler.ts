// ─── Report Generation Scheduler V4 (V110) ──────────────────
// Self-healing report scheduler that runs in-process alongside the
// pipeline orchestrator. Ensures reports/analyses are ALWAYS generated
// on schedule, even if Railway cron fails or the container restarts.
//
// V110 CHANGES:
// - Reads schedule config from DB (report-schedule-config.ts)
// - Respects enabled/disabled toggles per report type
// - Respects frequency settings (times per day, day of week, etc.)
// - Skips disabled report types entirely
// - Reduces AI cost by only generating when schedule allows
//
// V3 CHANGES (V73):
// - Reduced stale threshold for analyses to 45 minutes (was 1h)
// - Added forced generation every 2 cycles regardless of staleness
// - Better error logging with full stack traces
// - Added health check endpoint support
// - Ensures technicalAnalysis, arabMarkets, earnings are always generated
//
// DESIGN:
// - Runs on a 60-minute interval (matches Railway cron schedules)
// - Checks schedule config from DB before generating
// - Crash-resilient: auto-restarts on any error with 30s delay
// - Uses the existing report-generator functions directly (no HTTP call)
// - Staggered execution: generates one type at a time to avoid AI rate limits

import { db } from '@/lib/db';
import {
  generateDailyBrief,
  generateWeeklyAnalysis,
  generateMonthlyOutlook,
  generateMarketAnalysis,
  generateTechnicalAnalysis,
  saveReportToDb,
  saveAnalysisToDb,
  type AssetClass,
} from '@/lib/report-generator';
import {
  getReportScheduleConfig,
  shouldGenerateNow,
  type ReportScheduleConfig,
} from '@/lib/report-schedule-config';

// ── State ──
let isRunning = false;
let schedulerTimer: ReturnType<typeof setTimeout> | null = null;
let lastCheckTime = 0;
let lastGenerationTime = 0;
let cycleCount = 0;
let totalGenerated = 0;
let totalErrors = 0;
let lastError: string | null = null;

const SCHEDULER_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const STALE_THRESHOLD_MS = 45 * 60 * 1000; // 45 minutes for analyses
const REPORT_STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours for daily/weekly/monthly
const CRASH_RESTART_DELAY_MS = 30 * 1000; // 30 seconds
const STARTUP_DELAY_MS = 90 * 1000; // Wait 90s after server start

const ALL_ASSET_CLASSES: AssetClass[] = ['stocks', 'commodities', 'forex', 'crypto', 'bonds', 'energy', 'realEstate', 'economy', 'banking', 'technicalAnalysis', 'arabMarkets', 'earnings'];

// V223: Disabled asset classes — chronic quality issues, suspended until data sources improve
// V335: Re-enabled arabMarkets — data sources now sufficient
const V223_DISABLED_ASSET_CLASSES: AssetClass[] = ['realEstate'];

// ── Public API ──

export function startReportScheduler(): void {
  if (isRunning) {
    console.log('[ReportScheduler] Already running');
    return;
  }

  isRunning = true;
  console.log(`[ReportScheduler V4] Starting — check every ${SCHEDULER_INTERVAL_MS / 60000} min, reads config from DB`);

  // Delay first check to let the server fully start
  schedulerTimer = setTimeout(async () => {
    try {
      await runSchedulerCycle();
    } catch (err: any) {
      console.error(`[ReportScheduler] Initial cycle failed: ${err.message}`);
      scheduleNextCycle();
    }
  }, STARTUP_DELAY_MS);
}

export function stopReportScheduler(): void {
  isRunning = false;
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }
  console.log('[ReportScheduler] Stopped');
}

export function getReportSchedulerStats() {
  return {
    isRunning,
    cycleCount,
    lastCheckTime: lastCheckTime ? new Date(lastCheckTime).toISOString() : null,
    lastGenerationTime: lastGenerationTime ? new Date(lastGenerationTime).toISOString() : null,
    totalGenerated,
    totalErrors,
    lastError,
    idleMinutes: lastCheckTime > 0 ? Math.round((Date.now() - lastCheckTime) / 60000) : null,
  };
}

// ── Main Cycle ──

async function runSchedulerCycle(): Promise<void> {
  if (!isRunning) return;

  cycleCount++;
  const cycleStart = Date.now();
  lastCheckTime = Date.now();

  console.log(`[ReportScheduler V4] Cycle #${cycleCount} starting...`);

  try {
    // Check if we have a valid database connection
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      console.log('[ReportScheduler] No DATABASE_URL, skipping');
      scheduleNextCycle();
      return;
    }

    // V364 RECOVERY: Re-publish reports that V242 incorrectly unpublished.
    // V242's generic summary gate was too aggressive — it unpublished ALL reports
    // with generic summaries, even those with confidence 70+. V363 fixed the code
    // to only penalize confidence (cap at 40) instead of blocking publication entirely.
    // But the old unpublished reports were never re-published. V364 adds this recovery.
    // Also deletes the reports_v242_fix_done flag so V363's corrected one-time fix runs.
    {
      try {
        const recoveryFlag = await db.siteSetting.findUnique({ where: { key: 'reports_v364_recovery_done' } });
        if (!recoveryFlag) {
          console.log('[ReportScheduler V364] Running one-time recovery: re-publishing incorrectly unpublished reports...');
          let recoveryCount = 0;

          // Re-publish Arabic analyses with confidence >= 30 that are unpublished
          // (but NOT if they contain explicit "لا تنشر" or AI confidence ≤ 6/10)
          const unpublishedAnalyses = await db.marketAnalysis.findMany({
            where: { isPublished: false, locale: 'ar', confidenceScore: { gte: 30 } },
            select: { id: true, content: true, confidenceScore: true, slug: true },
          });
          for (const a of unpublishedAnalyses) {
            const contentStr = typeof a.content === 'string' ? a.content : JSON.stringify(a.content || '');
            const hasDoNotPublish = /لا\s*تنشر/i.test(contentStr);
            const confMatch = contentStr.match(/(?:مستوى\s*)?ثقة\s*[:\s]*(\d+)\s*\/\s*10/i);
            const aiConfLow = confMatch && parseInt(confMatch[1], 10) <= 6;
            if (!hasDoNotPublish && !aiConfLow) {
              await db.marketAnalysis.update({ where: { id: a.id }, data: { isPublished: true, publishedAt: new Date() } });
              recoveryCount++;
            }
          }

          // Re-publish Arabic reports with confidence >= 30 that are unpublished
          const unpublishedReports = await db.economicReport.findMany({
            where: { isPublished: false, locale: 'ar', confidenceScore: { gte: 30 } },
            select: { id: true, content: true, confidenceScore: true, slug: true },
          });
          for (const r of unpublishedReports) {
            const contentStr = typeof r.content === 'string' ? r.content : JSON.stringify(r.content || '');
            const hasDoNotPublish = /لا\s*تنشر/i.test(contentStr);
            const confMatch = contentStr.match(/(?:مستوى\s*)?ثقة\s*[:\s]*(\d+)\s*\/\s*10/i);
            const aiConfLow = confMatch && parseInt(confMatch[1], 10) <= 6;
            if (!hasDoNotPublish && !aiConfLow) {
              await db.economicReport.update({ where: { id: r.id }, data: { isPublished: true, publishedAt: new Date() } });
              recoveryCount++;
            }
          }

          console.log(`[ReportScheduler V364] Recovery: republished ${recoveryCount} reports/analyses (from ${unpublishedAnalyses.length} unpublished analyses + ${unpublishedReports.length} unpublished reports)`);

          // Delete old V242 fix flag so V363's corrected one-time fix can run
          try {
            const deleted = await db.siteSetting.deleteMany({ where: { key: 'reports_v242_fix_done' } });
            if (deleted.count > 0) {
              console.log('[ReportScheduler V364] Deleted reports_v242_fix_done flag — V363 fix will re-evaluate');
            }
          } catch {}

          // Mark V364 recovery as done
          try {
            await db.siteSetting.create({
              data: { key: 'reports_v364_recovery_done', value: new Date().toISOString(), group: 'system', type: 'string' },
            });
          } catch {}
        }
      } catch (recoveryErr: any) {
        console.error(`[ReportScheduler V364] Recovery error (non-fatal): ${recoveryErr.message}`);
      }
    }

    // V222→V242→V363: One-time fix — unpublish low-quality reports
    // V336 FIX: Changed from cycleCount===1 (resets on every deploy) to DB-based flag.
    // V363 FIX: Removed hasGenericContent/hasGenericSummary from unpublish conditions.
    // The V364 recovery above deletes the V242 flag, so this will re-run with V363's logic.
    {
      try {
        const fixFlag = await db.siteSetting.findUnique({ where: { key: 'reports_v242_fix_done' } });
        if (!fixFlag) {
          try {
            // V241: Publish analyses that were blocked by the old confidence threshold (40)
            // Now that V240 lowered it to 30, these analyses should be published.
            await publishEligibleAnalyses();
          } catch (fixErr: any) {
            console.error(`[ReportScheduler V241] Publish eligible analyses error (non-fatal): ${fixErr.message}`);
          }

          try {
            console.log('[ReportScheduler V242] Running one-time fix: unpublishing low-quality reports...');
            let fixCount = 0;

            // V242: Generic summary patterns
            const GENERIC_SUMMARY_PATTERNS = [
              /تقرير\s+\S+\s+يغطي\s+\d+\s+خبر\s+اقتصادي/i,
              /متوسط\s+مشاعر\s+السوق\s*:\s*\d+\s*\/\s*100/i,
            ];

            // Fix MarketAnalysis — V336: Also filter by locale: 'ar'
            const publishedAnalyses = await db.marketAnalysis.findMany({
              where: { isPublished: true, locale: 'ar' },
              select: { id: true, content: true, confidenceScore: true, slug: true },
            });
            for (const a of publishedAnalyses) {
              const hasDoNotPublish = a.content && /لا\s*تنشر/i.test(a.content);
              const lowConfInContent = a.content && /(?:مستوى\s*)?ثقة\s*[:\s]*([1-6])\s*\/\s*10/i.test(a.content);
              // V336: Lowered threshold from 40 to 25 — V240 changed min confidence to 30,
              // so reports with confidence 30-39 should NOT be unpublished anymore.
              const lowAlgConfidence = a.confidenceScore < 25;
              // V242: Also check for generic summaries in analysis content
              const hasGenericContent = a.content && GENERIC_SUMMARY_PATTERNS.some(p => p.test(a.content));
              if (hasDoNotPublish || lowConfInContent || lowAlgConfidence) {
                // V363 FIX: Removed hasGenericContent from unpublish conditions.
                // Generic content/summaries should only penalize confidence (capped at 40),
                // NOT unpublish the report entirely. The old V242 logic was too aggressive
                // and caused ALL daily/weekly/monthly Arabic reports to be unpublished.
                await db.marketAnalysis.update({ where: { id: a.id }, data: { isPublished: false, publishedAt: null } });
                fixCount++;
                console.log(`[ReportScheduler V363] Unpublished analysis: ${a.slug} (doNotPublish=${hasDoNotPublish}, lowConf=${lowConfInContent}, score=${a.confidenceScore})`);
              }
            }

            // Fix EconomicReport — V336: Also filter by locale: 'ar'
            const publishedReports = await db.economicReport.findMany({
              where: { isPublished: true, locale: 'ar' },
              select: { id: true, content: true, confidenceScore: true, slug: true, summary: true },
            });
            for (const r of publishedReports) {
              const hasDoNotPublish = r.content && /لا\s*تنشر/i.test(r.content);
              const lowConfInContent = r.content && /(?:مستوى\s*)?ثقة\s*[:\s]*([1-6])\s*\/\s*10/i.test(r.content);
              // V336: Lowered threshold from 40 to 25 — V240 changed min confidence to 30,
              // so reports with confidence 30-39 should NOT be unpublished anymore.
              const lowAlgConfidence = r.confidenceScore < 25;
              // V242: Check for generic summaries in both summary and content
              const hasGenericSummary = (r.summary && GENERIC_SUMMARY_PATTERNS.some(p => p.test(r.summary))) ||
                                        (r.content && GENERIC_SUMMARY_PATTERNS.some(p => p.test(r.content)));
              if (hasDoNotPublish || lowConfInContent || lowAlgConfidence) {
                // V363 FIX: Removed hasGenericSummary from unpublish conditions.
                // Generic summaries should only penalize confidence (capped at 40),
                // NOT unpublish the report entirely. The old V242 logic was too aggressive
                // and caused ALL daily/weekly/monthly Arabic reports to be unpublished.
                await db.economicReport.update({ where: { id: r.id }, data: { isPublished: false, publishedAt: null } });
                fixCount++;
                console.log(`[ReportScheduler V363] Unpublished report: ${r.slug} (doNotPublish=${hasDoNotPublish}, lowConf=${lowConfInContent}, score=${r.confidenceScore})`);
              }
            }

            console.log(`[ReportScheduler V242] One-time fix complete: ${fixCount} reports/analyses unpublished`);
          } catch (fixErr: any) {
            console.error(`[ReportScheduler V242] Fix error (non-fatal): ${fixErr.message}`);
          }

          // Mark fix as done in DB so it never runs again
          try {
            await db.siteSetting.create({
              data: {
                key: 'reports_v242_fix_done',
                value: new Date().toISOString(),
                group: 'system',
                type: 'string',
              },
            });
            console.log('[ReportScheduler V336] V242 fix marked as done in DB — will not run again');
          } catch (dbErr: any) {
            // If create fails (e.g., duplicate key), the fix already ran — that's fine
            console.warn(`[ReportScheduler V336] Could not mark V242 fix as done: ${dbErr.message}`);
          }
        } else {
          console.log('[ReportScheduler V336] V242 fix already done — skipping');
        }
      } catch (flagErr: any) {
        console.warn(`[ReportScheduler V336] Could not check V242 fix flag: ${flagErr.message}`);
      }
    }

    // V110: Read schedule config from DB
    const config = await getReportScheduleConfig();
    let generatedThisCycle = 0;

    // V364: Force-generate a daily report on the FIRST cycle after deployment.
    // This ensures a new Arabic report appears immediately instead of waiting
    // for the next scheduled window (which could be hours away).
    const forceFirstCycle = cycleCount === 1;

    // ── Check Daily Brief ──
    if (forceFirstCycle || shouldGenerateNow('daily', config)) {
      const dailyStale = await isReportStaleWithThreshold('daily', REPORT_STALE_THRESHOLD_MS);
      if (dailyStale) {
        console.log('[ReportScheduler] Daily report is stale & schedule allows — generating...');
        try {
          const report = await generateDailyBrief(undefined, undefined, config.dailyWordCount);
          await saveReportToDb(report, true);
          generatedThisCycle++;
          lastGenerationTime = Date.now();
          console.log(`[ReportScheduler] ✓ Daily brief generated: "${report.title.slice(0, 50)}..."`);
        } catch (err: any) {
          console.error(`[ReportScheduler] Daily brief failed: ${err.message}`);
          totalErrors++;
          lastError = err.message;
        }
      } else {
        console.log('[ReportScheduler] Daily report is up-to-date, skipping');
      }
    } else {
      console.log('[ReportScheduler] Daily report not scheduled for this hour');
    }

    // ── Check Weekly Analysis ──
    if (shouldGenerateNow('weekly', config)) {
      const weeklyStale = await isReportStaleWithThreshold('weekly', REPORT_STALE_THRESHOLD_MS);
      if (weeklyStale) {
        console.log('[ReportScheduler] Weekly report is stale & schedule allows — generating...');
        try {
          const report = await generateWeeklyAnalysis(undefined, undefined, undefined, config.weeklyWordCount);
          await saveReportToDb(report, true);
          generatedThisCycle++;
          lastGenerationTime = Date.now();
          console.log(`[ReportScheduler] ✓ Weekly analysis generated: "${report.title.slice(0, 50)}..."`);
        } catch (err: any) {
          console.error(`[ReportScheduler] Weekly analysis failed: ${err.message}`);
          totalErrors++;
          lastError = err.message;
        }
      } else {
        console.log('[ReportScheduler] Weekly report is up-to-date, skipping');
      }
    } else {
      console.log('[ReportScheduler] Weekly report not scheduled for this hour');
    }

    // ── Check Monthly Outlook ──
    if (shouldGenerateNow('monthly', config)) {
      const monthlyStale = await isReportStaleWithThreshold('monthly', REPORT_STALE_THRESHOLD_MS);
      if (monthlyStale) {
        console.log('[ReportScheduler] Monthly report is stale & schedule allows — generating...');
        try {
          const report = await generateMonthlyOutlook(undefined, undefined, undefined, config.monthlyWordCount);
          await saveReportToDb(report, true);
          generatedThisCycle++;
          lastGenerationTime = Date.now();
          console.log(`[ReportScheduler] ✓ Monthly outlook generated: "${report.title.slice(0, 50)}..."`);
        } catch (err: any) {
          console.error(`[ReportScheduler] Monthly outlook failed: ${err.message}`);
          totalErrors++;
          lastError = err.message;
        }
      } else {
        console.log('[ReportScheduler] Monthly report is up-to-date, skipping');
      }
    } else {
      console.log('[ReportScheduler] Monthly report not scheduled for this hour');
    }

    // ── Generate Market Analyses for enabled asset classes ──
    if (shouldGenerateNow('analyses', config)) {
      const assetClasses = config.analysesAssetClasses as AssetClass[];
      for (const ac of assetClasses) {
        // V223: Skip disabled asset classes (chronic quality issues)
        if (V223_DISABLED_ASSET_CLASSES.includes(ac)) {
          console.log(`[ReportScheduler V223] ⏭️ Skipping disabled asset class: ${ac}`);
          continue;
        }
        const acStale = await isAssetClassAnalysisStale(ac);
        if (acStale) {
          console.log(`[ReportScheduler] ${ac} analysis is stale & schedule allows — generating...`);
          try {
            // V166: Pass forceFull=true — auto-generated reports should also be
            // comprehensive, not brief bulletins. Multi-pass generation + enhanced
            // prompts ensure quality even with limited data.
            const analysis = await generateMarketAnalysis(ac, undefined, undefined, undefined, undefined, true);
            await saveAnalysisToDb(analysis, true);
            generatedThisCycle++;
            lastGenerationTime = Date.now();
            console.log(`[ReportScheduler] ✓ ${ac} analysis generated`);
          } catch (err: any) {
            console.error(`[ReportScheduler] ${ac} analysis failed: ${err.message}`);
            totalErrors++;
            lastError = err.message;
          }
        }
      }
    } else {
      console.log('[ReportScheduler] Market analyses not scheduled for this hour');
    }

    // ── Generate Technical Analysis ──
    if (shouldGenerateNow('technical', config)) {
      const techStale = await isTechnicalAnalysisStale();
      if (techStale) {
        console.log('[ReportScheduler] Technical analysis is stale & schedule allows — generating...');
        try {
          const analysis = await generateTechnicalAnalysis();
          await saveAnalysisToDb(analysis, true);
          generatedThisCycle++;
          lastGenerationTime = Date.now();
          console.log(`[ReportScheduler] ✓ Technical analysis generated: "${analysis.title.slice(0, 50)}..."`);
        } catch (err: any) {
          console.error(`[ReportScheduler] Technical analysis failed: ${err.message}`);
          totalErrors++;
          lastError = err.message;
        }
      } else {
        console.log('[ReportScheduler] Technical analysis is up-to-date, skipping');
      }
    } else {
      console.log('[ReportScheduler] Technical analysis not scheduled for this hour');
    }

    // V413: Auto-infographic generation DISABLED — manual only via /api/infographics/generate

    totalGenerated += generatedThisCycle;
    lastError = null;

    const cycleDuration = Date.now() - cycleStart;
    if (generatedThisCycle > 0) {
      console.log(`[ReportScheduler V4] Cycle #${cycleCount} done: ${generatedThisCycle} reports/analyses/infographics generated in ${cycleDuration}ms`);
    } else {
      console.log(`[ReportScheduler V4] Cycle #${cycleCount} done: no generation needed this hour (${cycleDuration}ms)`);
    }
  } catch (err: any) {
    lastError = err.message;
    totalErrors++;
    console.error(`[ReportScheduler V4] Cycle #${cycleCount} FATAL ERROR: ${err.message}`);
  }

  // Schedule next cycle
  scheduleNextCycle();
}

// ── Staleness Checks ──

async function isReportStaleWithThreshold(reportType: string, thresholdMs: number): Promise<boolean> {
  try {
    const cutoff = new Date(Date.now() - thresholdMs);

    // V240→V325 FIX: Check for PUBLISHED reports first.
    // If a published report exists within the threshold → not stale.
    // V336 FIX: Added locale: 'ar' filter — English reports were blocking Arabic regeneration!
    const recentPublished = await db.economicReport.findFirst({
      where: {
        reportType,
        locale: 'ar',
        isPublished: true,
        createdAt: { gte: cutoff },
      },
      select: { id: true, createdAt: true },
    });
    if (recentPublished) {
      return false; // Not stale — a PUBLISHED Arabic report exists
    }

    // V325: Check for unpublished reports — but only count them as "not stale"
    // if they were created recently (within 30 minutes). If an unpublished report
    // is older than 30 minutes, it's STALE and we should try regenerating.
    // The old V240 logic caused a trap: unpublished reports blocked regeneration
    // forever, so reports stopped appearing on the site entirely.
    const unpublishedCutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
    const recentUnpublished = await db.economicReport.findFirst({
      where: {
        reportType,
        locale: 'ar',
        isPublished: false,
        createdAt: { gte: unpublishedCutoff },
      },
      select: { id: true, createdAt: true, confidenceScore: true },
    });
    if (recentUnpublished) {
      console.warn(`[ReportScheduler V325] Recent ${reportType} report exists but is UNPUBLISHED (id=${recentUnpublished.id}, confidence=${recentUnpublished.confidenceScore}) — giving it 30min grace period before regenerating.`);
      return false; // Just created — give it time, don't regenerate yet
    }

    // No published report within threshold, and no recent unpublished report → STALE
    // Also check if there are old unpublished reports (they should be retried)
    const oldUnpublished = await db.economicReport.findFirst({
      where: {
        reportType,
        locale: 'ar',
        isPublished: false,
        createdAt: { gte: cutoff, lt: unpublishedCutoff },
      },
      select: { id: true, createdAt: true, confidenceScore: true },
    });
    if (oldUnpublished) {
      console.warn(`[ReportScheduler V325] Old unpublished ${reportType} report found (id=${oldUnpublished.id}, confidence=${oldUnpublished.confidenceScore}, age=${Math.round((Date.now() - oldUnpublished.createdAt.getTime()) / 60000)}min) — regenerating to try to get a published version.`);
      // Don't return false — let it regenerate! This is the V325 fix.
    }

    return true; // Stale — no published report within threshold
  } catch (err: any) {
    console.warn(`[ReportScheduler] Stale check failed for ${reportType}: ${err.message}`);
    return true; // V336 FIX: Assume stale on error — safer to regenerate than skip
  }
}

async function isAssetClassAnalysisStale(assetClass: string): Promise<boolean> {
  try {
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

    // V325: Same fix as isReportStaleWithThreshold — check published first
    // V336 FIX: Added locale: 'ar' filter — English analyses were blocking Arabic regeneration!
    const recentPublished = await db.marketAnalysis.findFirst({
      where: {
        assetClass,
        locale: 'ar',
        isPublished: true,
        createdAt: { gte: cutoff },
      },
      select: { id: true, createdAt: true },
    });
    if (recentPublished) {
      return false; // Not stale — PUBLISHED Arabic analysis exists
    }

    // V325: Only count recent unpublished as "not stale" (30 min grace)
    const unpublishedCutoff = new Date(Date.now() - 30 * 60 * 1000);
    const recentUnpublished = await db.marketAnalysis.findFirst({
      where: {
        assetClass,
        locale: 'ar',
        isPublished: false,
        createdAt: { gte: unpublishedCutoff },
      },
      select: { id: true, createdAt: true, confidenceScore: true },
    });
    if (recentUnpublished) {
      console.warn(`[ReportScheduler V325] Recent ${assetClass} analysis UNPUBLISHED (id=${recentUnpublished.id}, confidence=${recentUnpublished.confidenceScore}) — 30min grace.`);
      return false;
    }

    // Old unpublished → stale, try regenerating
    const oldUnpublished = await db.marketAnalysis.findFirst({
      where: {
        assetClass,
        locale: 'ar',
        isPublished: false,
        createdAt: { gte: cutoff, lt: unpublishedCutoff },
      },
      select: { id: true, createdAt: true },
    });
    if (oldUnpublished) {
      console.warn(`[ReportScheduler V325] Old unpublished ${assetClass} analysis (id=${oldUnpublished.id}) — regenerating.`);
    }

    return true; // Stale
  } catch (err: any) {
    console.warn(`[ReportScheduler] Stale check failed for ${assetClass} analysis: ${err.message}`);
    return true; // V336 FIX: Assume stale on error — safer to regenerate than skip
  }
}

async function isTechnicalAnalysisStale(): Promise<boolean> {
  try {
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

    // V325: Same fix — check published first
    // V336 FIX: Added locale: 'ar' filter — English analyses were blocking Arabic regeneration!
    const recentPublished = await db.marketAnalysis.findFirst({
      where: {
        assetClass: 'technicalAnalysis',
        locale: 'ar',
        isPublished: true,
        createdAt: { gte: cutoff },
      },
      select: { id: true, createdAt: true },
    });
    if (recentPublished) {
      return false;
    }

    // V325: 30-min grace for unpublished
    const unpublishedCutoff = new Date(Date.now() - 30 * 60 * 1000);
    const recentUnpublished = await db.marketAnalysis.findFirst({
      where: {
        assetClass: 'technicalAnalysis',
        locale: 'ar',
        isPublished: false,
        createdAt: { gte: unpublishedCutoff },
      },
      select: { id: true, createdAt: true },
    });
    if (recentUnpublished) {
      console.warn(`[ReportScheduler V325] Recent technicalAnalysis UNPUBLISHED — 30min grace.`);
      return false;
    }

    return true; // Stale
  } catch (err: any) {
    console.warn(`[ReportScheduler] Technical analysis stale check failed: ${err.message}`);
    return true; // V336 FIX: Assume stale on error — safer to regenerate than skip
  }
}

// ── V241: One-time migration — publish analyses with confidence >= 30 ──
// The V240 change lowered the confidence threshold from 40 to 30, but existing
// analyses that were generated before V240 are still unpublished. This migration
// publishes them retroactively.

async function publishEligibleAnalyses(): Promise<number> {
  try {
    const result = await db.marketAnalysis.updateMany({
      where: {
        isPublished: false,
        confidenceScore: { gte: 30 },
      },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });
    if (result.count > 0) {
      console.log(`[ReportScheduler V241] Published ${result.count} previously blocked analyses (confidence >= 30)`);
    }
    return result.count;
  } catch (err: any) {
    console.error(`[ReportScheduler V241] publishEligibleAnalyses error: ${err.message}`);
    return 0;
  }
}

// ── Scheduling ──

function scheduleNextCycle(): void {
  if (!isRunning) return;

  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }

  schedulerTimer = setTimeout(async () => {
    try {
      await runSchedulerCycle();
    } catch (err: any) {
      console.error(`[ReportScheduler V4] Unhandled error in cycle: ${err.message}`);
      lastError = err.message;
      totalErrors++;
      // Crash-resilient: restart after delay
      console.log(`[ReportScheduler] Auto-restarting in ${CRASH_RESTART_DELAY_MS / 1000}s...`);
      schedulerTimer = setTimeout(async () => {
        try {
          await runSchedulerCycle();
        } catch (restartErr: any) {
          console.error(`[ReportScheduler] Restart cycle also failed: ${restartErr.message}`);
          scheduleNextCycle();
        }
      }, CRASH_RESTART_DELAY_MS);
    }
  }, SCHEDULER_INTERVAL_MS);
}
