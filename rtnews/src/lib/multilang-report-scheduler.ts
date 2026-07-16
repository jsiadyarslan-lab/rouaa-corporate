// ─── Multi-Language Report Scheduler V400 ─────────────────────
// Self-healing report scheduler that generates reports/analyses for
// EN, TR, FR, and ES — mirroring the Arabic report-scheduler.ts approach.
//
// WHY THIS EXISTS:
// The Arabic pipeline uses report-scheduler.ts (checks DB staleness every 60 min)
// while EN/TR/FR/ES relied on in-memory timers inside orchestrators with 24h+
// intervals that update even on failure. This caused:
//   1. Reports never generated if first attempt failed (timer still updates)
//   2. After container restart, if first attempt failed → wait 24h again
//   3. No DB-based staleness check, so no recovery from failures
//   4. ES pipeline had NO report generation at all
//
// DESIGN:
// - Runs on 60-minute interval (same as Arabic scheduler)
// - Checks DB for staleness before generating (stateless, crash-resilient)
// - Generates one report type at a time to avoid AI rate limits
// - Each language generates independently based on its own data availability
// - Auto-infographic generation included (replaces V313 manual-only restriction)

import { db } from '@/lib/db';
import { EN_PIPELINE_CONFIG } from '@/lib/pipeline/en-pipeline-config';
import { TR_PIPELINE_CONFIG } from '@/lib/pipeline/tr-pipeline-config';
import { FR_PIPELINE_CONFIG } from '@/lib/pipeline/fr-pipeline-config';
import { ES_PIPELINE_CONFIG } from '@/lib/pipeline/es-pipeline-config';

// ── State ──
let isRunning = false;
let schedulerTimer: ReturnType<typeof setTimeout> | null = null;
let lastCheckTime = 0;
let cycleCount = 0;
let totalGenerated = 0;
let totalErrors = 0;
let lastError: string | null = null;

const SCHEDULER_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const REPORT_STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours for reports
const ANALYSIS_STALE_THRESHOLD_MS = 45 * 60 * 1000; // 45 minutes for analyses
const CRASH_RESTART_DELAY_MS = 30 * 1000;
const STARTUP_DELAY_MS = 150_000; // 2.5 min after server start (after pipelines are up)

const SUPPORTED_LOCALES = ['en', 'tr', 'fr', 'es'] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];

const LOCALE_CONFIG_MAP: Record<SupportedLocale, any> = {
  en: EN_PIPELINE_CONFIG,
  tr: TR_PIPELINE_CONFIG,
  fr: FR_PIPELINE_CONFIG,
  es: ES_PIPELINE_CONFIG,
};

// ── Public API ──

export function startMultilangReportScheduler(): void {
  if (isRunning) {
    console.log('[MultilangReportScheduler] Already running');
    return;
  }

  isRunning = true;
  console.log(`[MultilangReportScheduler V400] Starting — check every ${SCHEDULER_INTERVAL_MS / 60000} min for ${SUPPORTED_LOCALES.join('/')}`);

  schedulerTimer = setTimeout(async () => {
    try {
      await runSchedulerCycle();
    } catch (err: any) {
      console.error(`[MultilangReportScheduler] Initial cycle failed: ${err.message}`);
      scheduleNextCycle();
    }
  }, STARTUP_DELAY_MS);
}

export function stopMultilangReportScheduler(): void {
  isRunning = false;
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }
  console.log('[MultilangReportScheduler] Stopped');
}

export function getMultilangReportSchedulerStats() {
  return {
    isRunning,
    cycleCount,
    lastCheckTime: lastCheckTime ? new Date(lastCheckTime).toISOString() : null,
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

  console.log(`[MultilangReportScheduler V400] Cycle #${cycleCount} starting...`);

  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      console.log('[MultilangReportScheduler] No DATABASE_URL, skipping');
      scheduleNextCycle();
      return;
    }

    let generatedThisCycle = 0;

    // Process each locale sequentially to avoid AI rate limits
    for (const locale of SUPPORTED_LOCALES) {
      try {
        const localeGenerated = await processLocale(locale);
        generatedThisCycle += localeGenerated;
      } catch (localeErr: any) {
        console.error(`[MultilangReportScheduler V400] ${locale.toUpperCase()} cycle failed: ${localeErr.message}`);
        totalErrors++;
        lastError = localeErr.message;
      }
    }

    totalGenerated += generatedThisCycle;
    if (lastError && generatedThisCycle > 0) lastError = null;

    const cycleDuration = Date.now() - cycleStart;
    if (generatedThisCycle > 0) {
      console.log(`[MultilangReportScheduler V400] Cycle #${cycleCount} done: ${generatedThisCycle} reports/analyses generated in ${cycleDuration}ms`);
    } else {
      console.log(`[MultilangReportScheduler V400] Cycle #${cycleCount} done: no generation needed this hour (${cycleDuration}ms)`);
    }
  } catch (err: any) {
    lastError = err.message;
    totalErrors++;
    console.error(`[MultilangReportScheduler V400] Cycle #${cycleCount} FATAL ERROR: ${err.message}`);
  }

  scheduleNextCycle();
}

// ── Per-Locale Processing ──

async function processLocale(locale: SupportedLocale): Promise<number> {
  let generated = 0;

  // ── Daily Brief ──
  const dailyStale = await isReportStale(locale, 'daily', REPORT_STALE_THRESHOLD_MS);
  if (dailyStale) {
    const hasData = await hasMinimumNews(locale, 3, 24 * 60 * 60 * 1000);
    if (hasData) {
      console.log(`[MultilangReportScheduler] ${locale.toUpperCase()} daily report is stale — generating...`);
      try {
        const report = await generateDailyBrief(locale);
        if (report) {
          generated++;
          console.log(`[MultilangReportScheduler] ✓ ${locale.toUpperCase()} daily brief: "${report.title?.slice(0, 50)}"`);
        } else {
          console.log(`[MultilangReportScheduler] ${locale.toUpperCase()} daily brief returned null — insufficient data or speculation gate`);
        }
      } catch (err: any) {
        console.error(`[MultilangReportScheduler] ${locale.toUpperCase()} daily brief failed: ${err.message}`);
        totalErrors++;
        lastError = err.message;
      }
    } else {
      console.log(`[MultilangReportScheduler] ${locale.toUpperCase()} skipping daily — not enough news (< 3 articles in 24h)`);
    }
  }

  // ── Weekly Analyses ──
  const weeklyStale = await isAnalysisStale(locale, 'weekly', ANALYSIS_STALE_THRESHOLD_MS);
  if (weeklyStale) {
    const hasData = await hasMinimumNews(locale, 5, 7 * 24 * 60 * 60 * 1000);
    if (hasData) {
      const config = LOCALE_CONFIG_MAP[locale];
      const assetClasses = getAssetClasses(locale);
      console.log(`[MultilangReportScheduler] ${locale.toUpperCase()} weekly analyses stale — generating for ${assetClasses.length} asset classes...`);

      for (const ac of assetClasses) {
        try {
          const analysis = await generateWeeklyAnalysis(locale, ac);
          if (analysis) {
            generated++;
            console.log(`[MultilangReportScheduler] ✓ ${locale.toUpperCase()} weekly ${ac}: "${analysis.title?.slice(0, 50)}"`);
          }
        } catch (err: any) {
          console.error(`[MultilangReportScheduler] ${locale.toUpperCase()} weekly ${ac} failed: ${err.message}`);
          totalErrors++;
          lastError = err.message;
        }
      }
    } else {
      console.log(`[MultilangReportScheduler] ${locale.toUpperCase()} skipping weekly — not enough news (< 5 articles in 7d)`);
    }
  }

  // ── Monthly Outlook ──
  const monthlyStale = await isReportStale(locale, 'monthly', REPORT_STALE_THRESHOLD_MS);
  if (monthlyStale) {
    const hasData = await hasMinimumNews(locale, 8, 30 * 24 * 60 * 60 * 1000);
    if (hasData) {
      console.log(`[MultilangReportScheduler] ${locale.toUpperCase()} monthly outlook is stale — generating...`);
      try {
        const report = await generateMonthlyOutlook(locale);
        if (report) {
          generated++;
          console.log(`[MultilangReportScheduler] ✓ ${locale.toUpperCase()} monthly outlook: "${report.title?.slice(0, 50)}"`);
        }
      } catch (err: any) {
        console.error(`[MultilangReportScheduler] ${locale.toUpperCase()} monthly outlook failed: ${err.message}`);
        totalErrors++;
        lastError = err.message;
      }
    }
  }

  // ── Technical Analysis ──
  const techStale = await isAnalysisStale(locale, 'technicalAnalysis', ANALYSIS_STALE_THRESHOLD_MS);
  if (techStale) {
    const hasData = await hasMinimumNews(locale, 3, 24 * 60 * 60 * 1000);
    if (hasData) {
      console.log(`[MultilangReportScheduler] ${locale.toUpperCase()} technical analysis is stale — generating...`);
      try {
        const analysis = await generateTechnicalAnalysis(locale);
        if (analysis) {
          generated++;
          console.log(`[MultilangReportScheduler] ✓ ${locale.toUpperCase()} technical analysis: "${analysis.title?.slice(0, 50)}"`);
        }
      } catch (err: any) {
        console.error(`[MultilangReportScheduler] ${locale.toUpperCase()} technical analysis failed: ${err.message}`);
        totalErrors++;
        lastError = err.message;
      }
    }
  }

  // ── Market Analyses (per asset class) ──
  const marketStale = await isAnalysisStale(locale, 'market', ANALYSIS_STALE_THRESHOLD_MS);
  if (marketStale) {
    const assetClasses = getAssetClasses(locale);
    for (const ac of assetClasses) {
      try {
        const analysis = await generateMarketAnalysis(locale, ac);
        if (analysis) {
          generated++;
          console.log(`[MultilangReportScheduler] ✓ ${locale.toUpperCase()} market ${ac}: "${analysis.title?.slice(0, 50)}"`);
        }
      } catch (err: any) {
        console.error(`[MultilangReportScheduler] ${locale.toUpperCase()} market ${ac} failed: ${err.message}`);
      }
    }
  }

  return generated;
}

// ── Staleness Checks (DB-based, stateless) ──

async function isReportStale(locale: string, reportType: string, thresholdMs: number): Promise<boolean> {
  try {
    const cutoff = new Date(Date.now() - thresholdMs);
    const recentPublished = await db.economicReport.findFirst({
      where: { reportType, locale, isPublished: true, createdAt: { gte: cutoff } },
      select: { id: true },
    });
    if (recentPublished) return false;

    // Check for unpublished reports with 30-min grace period
    const unpublishedCutoff = new Date(Date.now() - 30 * 60 * 1000);
    const recentUnpublished = await db.economicReport.findFirst({
      where: { reportType, locale, isPublished: false, createdAt: { gte: unpublishedCutoff } },
      select: { id: true },
    });
    if (recentUnpublished) return false; // Give it time

    return true; // Stale
  } catch (err: any) {
    console.warn(`[MultilangReportScheduler] Stale check failed for ${locale}/${reportType}: ${err.message}`);
    return true; // Assume stale on error
  }
}

async function isAnalysisStale(locale: string, category: string, thresholdMs: number): Promise<boolean> {
  try {
    const cutoff = new Date(Date.now() - thresholdMs);
    const where: any = { locale, isPublished: true, createdAt: { gte: cutoff } };

    if (category === 'technicalAnalysis') {
      where.assetClass = 'technicalAnalysis';
    } else if (category !== 'market') {
      // For weekly: check if any weekly analysis for this locale exists
      where.analysisType = category;
    }
    // For 'market': check if ANY market analysis exists for any asset class

    const recentPublished = await db.marketAnalysis.findFirst({
      where,
      select: { id: true },
    });
    if (recentPublished) return false;

    const unpublishedCutoff = new Date(Date.now() - 30 * 60 * 1000);
    const recentUnpublished = await db.marketAnalysis.findFirst({
      where: { ...where, isPublished: false, createdAt: { gte: unpublishedCutoff } },
      select: { id: true },
    });
    if (recentUnpublished) return false;

    return true;
  } catch (err: any) {
    console.warn(`[MultilangReportScheduler] Analysis stale check failed for ${locale}/${category}: ${err.message}`);
    return true;
  }
}

async function hasMinimumNews(locale: string, minCount: number, windowMs: number): Promise<boolean> {
  try {
    const since = new Date(Date.now() - windowMs);
    const count = await db.newsItem.count({
      where: { locale, isReady: true, fetchedAt: { gte: since } },
    });
    return count >= minCount;
  } catch (err: any) {
    console.warn(`[MultilangReportScheduler] News count check failed for ${locale}: ${err.message}`);
    return false;
  }
}

// ── Report Generation Dispatchers ──

async function generateDailyBrief(locale: SupportedLocale) {
  switch (locale) {
    case 'en': {
      const { generateDailyBriefEn } = await import('@/lib/pipeline/agents/en-report-generator');
      return generateDailyBriefEn('daily');
    }
    case 'tr': {
      const { generateDailyBriefTr } = await import('@/lib/pipeline/agents/tr-report-generator');
      return generateDailyBriefTr('daily');
    }
    case 'fr': {
      const { generateDailyBriefFr } = await import('@/lib/pipeline/agents/fr-report-generator');
      return generateDailyBriefFr('daily');
    }
    case 'es': {
      const { generateDailyBriefEs } = await import('@/lib/pipeline/agents/es-report-generator');
      return generateDailyBriefEs('daily');
    }
  }
}

async function generateWeeklyAnalysis(locale: SupportedLocale, assetClass: string) {
  switch (locale) {
    case 'en': {
      const { generateWeeklyAnalysisEn } = await import('@/lib/pipeline/agents/en-report-generator');
      return generateWeeklyAnalysisEn(assetClass as any);
    }
    case 'tr': {
      const { generateWeeklyAnalysisTr } = await import('@/lib/pipeline/agents/tr-report-generator');
      return generateWeeklyAnalysisTr(assetClass as any);
    }
    case 'fr': {
      const { generateWeeklyAnalysisFr } = await import('@/lib/pipeline/agents/fr-report-generator');
      return generateWeeklyAnalysisFr(assetClass as any);
    }
    case 'es': {
      const { generateWeeklyAnalysisEs } = await import('@/lib/pipeline/agents/es-report-generator');
      return generateWeeklyAnalysisEs(assetClass as any);
    }
  }
}

async function generateMonthlyOutlook(locale: SupportedLocale) {
  switch (locale) {
    case 'en': {
      const { generateMonthlyOutlookEn } = await import('@/lib/pipeline/agents/en-report-generator');
      return generateMonthlyOutlookEn();
    }
    case 'tr': {
      const { generateMonthlyOutlookTr } = await import('@/lib/pipeline/agents/tr-report-generator');
      return generateMonthlyOutlookTr();
    }
    case 'fr': {
      const { generateMonthlyOutlookFr } = await import('@/lib/pipeline/agents/fr-report-generator');
      return generateMonthlyOutlookFr();
    }
    case 'es': {
      const { generateMonthlyOutlookEs } = await import('@/lib/pipeline/agents/es-report-generator');
      return generateMonthlyOutlookEs();
    }
  }
}

async function generateTechnicalAnalysis(locale: SupportedLocale) {
  switch (locale) {
    case 'en': {
      const { generateTechnicalAnalysisEn } = await import('@/lib/pipeline/agents/en-report-generator');
      return generateTechnicalAnalysisEn();
    }
    case 'tr': {
      const { generateTechnicalAnalysisTr } = await import('@/lib/pipeline/agents/tr-report-generator');
      return generateTechnicalAnalysisTr();
    }
    case 'fr': {
      const { generateTechnicalAnalysisFr } = await import('@/lib/pipeline/agents/fr-report-generator');
      return generateTechnicalAnalysisFr();
    }
    case 'es': {
      const { generateTechnicalAnalysisEs } = await import('@/lib/pipeline/agents/es-report-generator');
      return generateTechnicalAnalysisEs();
    }
  }
}

async function generateMarketAnalysis(locale: SupportedLocale, assetClass: string) {
  switch (locale) {
    case 'en': {
      const { generateMarketAnalysisEn } = await import('@/lib/pipeline/agents/en-report-generator');
      return generateMarketAnalysisEn(assetClass as any);
    }
    case 'tr': {
      const { generateMarketAnalysisTr } = await import('@/lib/pipeline/agents/tr-report-generator');
      return generateMarketAnalysisTr(assetClass as any);
    }
    case 'fr': {
      const { generateMarketAnalysisFr } = await import('@/lib/pipeline/agents/fr-report-generator');
      return generateMarketAnalysisFr(assetClass as any);
    }
    case 'es': {
      const { generateMarketAnalysisEs } = await import('@/lib/pipeline/agents/es-report-generator');
      return generateMarketAnalysisEs(assetClass as any);
    }
  }
}

function getAssetClasses(locale: SupportedLocale): string[] {
  const config = LOCALE_CONFIG_MAP[locale];
  switch (locale) {
    case 'en': return [...config.EN_REPORT_ASSET_CLASSES];
    case 'tr': return [...config.TR_REPORT_ASSET_CLASSES];
    case 'fr': return [...config.FR_REPORT_ASSET_CLASSES];
    case 'es': return [...config.ES_REPORT_ASSET_CLASSES];
    default: return ['stocks', 'commodities', 'forex', 'crypto', 'energy', 'economy'];
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
      console.error(`[MultilangReportScheduler] Unhandled error in cycle: ${err.message}`);
      lastError = err.message;
      totalErrors++;
      console.log(`[MultilangReportScheduler] Auto-restarting in ${CRASH_RESTART_DELAY_MS / 1000}s...`);
      schedulerTimer = setTimeout(async () => {
        try {
          await runSchedulerCycle();
        } catch (restartErr: any) {
          console.error(`[MultilangReportScheduler] Restart cycle also failed: ${restartErr.message}`);
          scheduleNextCycle();
        }
      }, CRASH_RESTART_DELAY_MS);
    }
  }, SCHEDULER_INTERVAL_MS);
}
