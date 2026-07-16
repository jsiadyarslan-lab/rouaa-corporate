// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Sensory Engine
// ═══════════════════════════════════════════════════════════════
// Collects data from 30+ sources every 30 seconds.
// Probes each step and tracks article vitals.
// Feeds data to Root Cause Analyzer.
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import type { GuardianStep, Locale, SensorySnapshot, StepMetrics } from '../types/guardian-types';
import { probeStep } from './step-probe';
import { trackArticles } from './article-tracker';

const ALL_STEPS: GuardianStep[] = ['fetch', 'content_load', 'process', 'analyze', 'image', 'publish'];
const ALL_LOCALES: Locale[] = ['ar', 'en', 'fr', 'tr', 'es'];

// Locale-specific minimum content lengths
const MIN_CONTENT_LENGTHS: Record<Locale, number> = {
  ar: 200,
  en: 300,  // V422: Raised from 80 → 300 to match EN_PIPELINE_CONFIG
  fr: 80,
  tr: 80,
  es: 80,
};

// In-memory metrics history (last 10 snapshots per locale)
const metricsHistory = new Map<string, SensorySnapshot[]>();
const MAX_HISTORY = 10;

export async function collectSnapshot(locale: Locale): Promise<SensorySnapshot> {
  const timestamp = Date.now();

  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // 1. Probe all steps in parallel
    const stepMetricsArray = await Promise.all(
      ALL_STEPS.map(step => probeStep(step, locale))
    );
    const stepMetrics = new Map<GuardianStep, StepMetrics>();
    stepMetricsArray.forEach(m => stepMetrics.set(m.step, m));

    // 2. Track article vitals
    const articleVitals = await trackArticles(locale);

    // 3. Count by processing stage
    const stageResults = await db.newsItem.groupBy({
      by: ['processingStage'],
      where: { locale, isReady: false, isPublished: false },
      _count: { id: true },
    });
    const stageBreakdown: Record<string, number> = {};
    for (const row of stageResults) {
      stageBreakdown[row.processingStage || 'unknown'] = row._count.id;
    }

    // 4. Total blocked
    const totalBlocked = await db.newsItem.count({
      where: { locale, isReady: false, isPublished: false },
    });

    // 5. Published counts
    const visFilter = {
      locale,
      isReady: true,
      isPublished: true,
      newsType: 'live' as const,
      slug: { not: '' },
      title: { not: '' },
    };

    const [publishedToday, publishedThisHour, pendingCount] = await Promise.all([
      db.newsItem.count({ where: { ...visFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...visFilter, publishedAt: { gte: oneHourAgo } } }),
      db.newsItem.count({ where: { locale, isReady: false, isPublished: false, retryCount: { lt: 15 } } }),
    ]);

    // 6. Quota remaining
    const quotaRemaining = await getQuotaRemaining(locale, publishedToday, publishedThisHour);

    const snapshot: SensorySnapshot = {
      timestamp,
      locale,
      stepMetrics,
      articleVitals,
      totalBlocked,
      publishedToday,
      publishedThisHour,
      pendingCount,
      stageBreakdown,
      quotaRemaining,
    };

    // Store in history
    const key = locale;
    const history = metricsHistory.get(key) || [];
    history.push(snapshot);
    if (history.length > MAX_HISTORY) history.shift();
    metricsHistory.set(key, history);

    return snapshot;
  } catch (err) {
    console.error(`[SensoryEngine] Error collecting ${locale} snapshot:`, err);
    return {
      timestamp,
      locale,
      stepMetrics: new Map(),
      articleVitals: [],
      totalBlocked: -1,
      publishedToday: 0,
      publishedThisHour: 0,
      pendingCount: -1,
      stageBreakdown: {},
      quotaRemaining: { hourly: 0, daily: 0 },
    };
  }
}

export async function collectAllLocales(): Promise<Map<Locale, SensorySnapshot>> {
  const snapshots = new Map<Locale, SensorySnapshot>();
  // Collect in parallel for speed
  const results = await Promise.all(
    ALL_LOCALES.map(async locale => ({ locale, snapshot: await collectSnapshot(locale) }))
  );
  for (const { locale, snapshot } of results) {
    snapshots.set(locale, snapshot);
  }
  return snapshots;
}

export function getMetricsHistory(locale: Locale): SensorySnapshot[] {
  return metricsHistory.get(locale) || [];
}

export function getLatestSnapshot(locale: Locale): SensorySnapshot | null {
  const history = metricsHistory.get(locale) || [];
  return history.length > 0 ? history[history.length - 1] : null;
}

async function getQuotaRemaining(
  locale: Locale,
  publishedToday: number,
  publishedThisHour: number,
): Promise<{ hourly: number; daily: number }> {
  try {
    switch (locale) {
      case 'en': {
        const { getEnPipelineLimits } = await import('../../en-pipeline-config');
        const limits = await getEnPipelineLimits();
        return { daily: limits.maxDailyEnNews - publishedToday, hourly: limits.maxHourlyEnNews - publishedThisHour };
      }
      case 'fr': {
        const { getFrPipelineLimits } = await import('../../fr-pipeline-config');
        const limits = await getFrPipelineLimits();
        return { daily: limits.maxDailyFrNews - publishedToday, hourly: limits.maxHourlyFrNews - publishedThisHour };
      }
      case 'tr': {
        const { getTrPipelineLimits } = await import('../../tr-pipeline-config');
        const limits = await getTrPipelineLimits();
        return { daily: limits.maxDailyTrNews - publishedToday, hourly: limits.maxHourlyTrNews - publishedThisHour };
      }
      case 'es': {
        const { getEsPipelineLimits } = await import('../../es-pipeline-config');
        const limits = await getEsPipelineLimits();
        return { daily: limits.maxDailyEsNews - publishedToday, hourly: limits.maxHourlyEsNews - publishedThisHour };
      }
      default:
        return { daily: 800 - publishedToday, hourly: 120 - publishedThisHour };
    }
  } catch {
    return { hourly: 999, daily: 999 };
  }
}

export { ALL_LOCALES, ALL_STEPS, MIN_CONTENT_LENGTHS };
