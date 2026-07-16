// ═══════════════════════════════════════════════════════════════
// Source Scoring System — Phase 5
// ═══════════════════════════════════════════════════════════════
// Tracks per-source productivity for the agency.
// Identifies:
//   - Top productive sources (high event volume + high publish rate)
//   - Dead sources (zero events in 7d)
//   - Noisy sources (high duplicate rate)
//   - Failed sources (high LLM failure rate)
//
// This is a READ-ONLY analyzer — no DB writes, no schema changes.
// All metrics are computed on-the-fly from agency_events table.
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';

export interface SourceStats {
  sourceId: string;
  sourceName: string;
  category: string;
  // Counts (last 7d)
  totalEvents7d: number;
  published7d: number;
  failed7d: number;
  deduped7d: number;       // events rejected as duplicates
  // Rates
  publishRate: number;     // published / totalEvents (0-1)
  duplicateRate: number;   // deduped / totalEvents (0-1)
  failureRate: number;     // failed (non-dedup) / totalEvents (0-1)
  // Quality score (0-100)
  qualityScore: number;
  // Recommendation
  recommendation: 'keep' | 'investigate' | 'disable';
  recommendationReason: string;
  // Last activity
  lastEventAt: Date | null;
}

export interface SourceAnalytics {
  generatedAt: Date;
  totalSources: number;
  activeSources: number;       // sources with events in 7d
  deadSources: number;         // sources with zero events in 7d
  topProductive: SourceStats[];   // top 10 by publish count
  topNoisy: SourceStats[];        // top 10 by duplicate rate
  topFailing: SourceStats[];      // top 10 by failure rate
  candidatesForDisable: SourceStats[]; // sources that should be disabled
  allSources: SourceStats[];      // full list sorted by qualityScore desc
}

/**
 * Analyze all agency sources over the last N days (default: 7).
 * Returns detailed per-source statistics and recommendations.
 *
 * V1153 FIX: Group by sourceName (not sourceId) because all RSS feeds
 * share sourceId='FedRSS'. The sourceName is the unique identifier
 * (e.g., "Bank of England Speeches", "SEC News", "MarketWatch Top Stories").
 */
export async function analyzeSources(days: number = 7): Promise<SourceAnalytics> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // 1. Pull all events in the window, grouped by sourceName (the real identifier)
  // sourceId is shared across all RSS feeds (= 'FedRSS'), so we cannot group by it.
  const sourceAggregates = await db.agencyEvent.groupBy({
    by: ['sourceName', 'category'],
    where: { createdAt: { gte: since } },
    _count: { id: true },
  });

  // 2. Pull status-specific counts per sourceName
  const [publishedBySource, failedBySource] = await Promise.all([
    db.agencyEvent.groupBy({
      by: ['sourceName'],
      where: { createdAt: { gte: since }, status: 'published' },
      _count: { id: true },
    }),
    db.agencyEvent.groupBy({
      by: ['sourceName'],
      where: { createdAt: { gte: since }, status: 'failed' },
      _count: { id: true },
    }),
  ]);

  // 3. Count dedup rejections (failed events with "Pre-LLM dedup" or "V1148 dedup" in lastError)
  const dedupedBySource = await db.agencyEvent.groupBy({
    by: ['sourceName'],
    where: {
      createdAt: { gte: since },
      status: 'failed',
      OR: [
        { lastError: { contains: 'Pre-LLM dedup' } },
        { lastError: { contains: 'V1148 dedup' } },
      ],
    },
    _count: { id: true },
  });

  // 4. Find last activity per source (by sourceName)
  const recentEvents = await db.agencyEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { sourceName: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 1000, // sample to find latest per source
  });
  const lastEventBySource = new Map<string, Date>();
  for (const e of recentEvents) {
    if (e.sourceName && !lastEventBySource.has(e.sourceName)) {
      lastEventBySource.set(e.sourceName, e.createdAt);
    }
  }

  // 5. Build per-source stats — keyed by sourceName
  const publishedMap = new Map(publishedBySource.map(s => [s.sourceName, s._count.id]));
  const failedMap = new Map(failedBySource.map(s => [s.sourceName, s._count.id]));
  const dedupedMap = new Map(dedupedBySource.map(s => [s.sourceName, s._count.id]));

  const allStats: SourceStats[] = sourceAggregates.map(agg => {
    // V1153: sourceName is the real identifier now (sourceId is shared = 'FedRSS')
    const sourceName = agg.sourceName || 'unknown';
    const sourceId = sourceName; // alias for backwards compat in SourceStats interface
    const total = agg._count.id;
    const published = publishedMap.get(sourceName) || 0;
    const failed = failedMap.get(sourceName) || 0;
    const deduped = dedupedMap.get(sourceName) || 0;
    const otherFailed = failed - deduped;

    const publishRate = total > 0 ? published / total : 0;
    const duplicateRate = total > 0 ? deduped / total : 0;
    const failureRate = total > 0 ? otherFailed / total : 0;

    // Quality score: weighted combination
    // 50% publish rate, 30% (1 - duplicate rate), 20% (1 - failure rate)
    const qualityScore = Math.round(
      (publishRate * 0.5 + (1 - duplicateRate) * 0.3 + (1 - failureRate) * 0.2) * 100
    );

    // Recommendation
    let recommendation: 'keep' | 'investigate' | 'disable' = 'keep';
    let recommendationReason = '';
    if (total >= 5 && published === 0 && deduped / total > 0.7) {
      recommendation = 'disable';
      recommendationReason = `All ${total} events are duplicates (no original content)`;
    } else if (total >= 5 && published === 0 && failureRate > 0.8) {
      recommendation = 'investigate';
      recommendationReason = `${Math.round(failureRate * 100)}% non-dedup failure rate (LLM issues?)`;
    } else if (total >= 5 && publishRate < 0.1 && duplicateRate < 0.5) {
      recommendation = 'investigate';
      recommendationReason = `Low publish rate (${Math.round(publishRate * 100)}%) without high dedup — quality issue`;
    } else if (total === 0) {
      recommendation = 'disable';
      recommendationReason = 'No events in window — possibly dead feed';
    }

    return {
      sourceId,
      sourceName,
      category: agg.category || 'unknown',
      totalEvents7d: total,
      published7d: published,
      failed7d: failed,
      deduped7d: deduped,
      publishRate,
      duplicateRate,
      failureRate,
      qualityScore,
      recommendation,
      recommendationReason,
      lastEventAt: lastEventBySource.get(sourceName) || null,
    };
  });

  // 6. Sort and pick top lists
  allStats.sort((a, b) => b.published7d - a.published7d);
  const topProductive = allStats.slice(0, 10);

  const topNoisy = [...allStats]
    .filter(s => s.totalEvents7d >= 5)
    .sort((a, b) => b.duplicateRate - a.duplicateRate)
    .slice(0, 10);

  const topFailing = [...allStats]
    .filter(s => s.totalEvents7d >= 5)
    .sort((a, b) => b.failureRate - a.failureRate)
    .slice(0, 10);

  const candidatesForDisable = allStats.filter(s => s.recommendation === 'disable');

  // Sort all by qualityScore desc
  allStats.sort((a, b) => b.qualityScore - a.qualityScore);

  return {
    generatedAt: new Date(),
    totalSources: allStats.length,
    activeSources: allStats.filter(s => s.totalEvents7d > 0).length,
    deadSources: allStats.filter(s => s.totalEvents7d === 0).length,
    topProductive,
    topNoisy,
    topFailing,
    candidatesForDisable,
    allSources: allStats,
  };
}

/**
 * Get top rejection reasons (failure breakdown).
 * Useful for debugging "why are events failing?"
 */
export async function getRejectionReasons(days: number = 7): Promise<Array<{
  reason: string;
  count: number;
  percent: number;
}>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Pull all failure errors in window
  const failedEvents = await db.agencyEvent.findMany({
    where: {
      createdAt: { gte: since },
      status: 'failed',
      lastError: { not: null },
    },
    select: { lastError: true },
    take: 5000,
  });

  // Categorize errors
  const categories: Record<string, number> = {
    'Pre-LLM dedup (URL)': 0,
    'Pre-LLM dedup (symbol+numbers)': 0,
    'Post-LLM dedup (V1148)': 0,
    'LLM call failed (all providers)': 0,
    'LLM parse failed (invalid JSON)': 0,
    'Content validation failed (too short)': 0,
    'Content validation failed (no Arabic)': 0,
    'Content validation failed (template copy)': 0,
    'Source attribution detected': 0,
    'Math validation failed': 0,
    'Other': 0,
  };

  for (const e of failedEvents) {
    const err = e.lastError || '';
    if (err.includes('Pre-LLM dedup') && err.includes('URL already published')) {
      categories['Pre-LLM dedup (URL)']++;
    } else if (err.includes('Pre-LLM dedup') && err.includes('Symbol overlap')) {
      categories['Pre-LLM dedup (symbol+numbers)']++;
    } else if (err.includes('V1148 dedup')) {
      categories['Post-LLM dedup (V1148)']++;
    } else if (err.includes('V387') || err.includes('All providers failed')) {
      categories['LLM call failed (all providers)']++;
    } else if (err.includes('Parse failed') || err.includes('Failed to parse')) {
      categories['LLM parse failed (invalid JSON)']++;
    } else if (err.includes('too short') || err.includes('len=')) {
      categories['Content validation failed (too short)']++;
    } else if (err.includes('no Arabic') || err.includes('no Arabic chars')) {
      categories['Content validation failed (no Arabic)']++;
    } else if (err.includes('Template copy') || err.includes('template')) {
      categories['Content validation failed (template copy)']++;
    } else if (err.includes('Source attribution') || err.includes('mentions source')) {
      categories['Source attribution detected']++;
    } else if (err.includes('Math') || err.includes('math')) {
      categories['Math validation failed']++;
    } else {
      categories['Other']++;
    }
  }

  const total = Object.values(categories).reduce((a, b) => a + b, 0);
  return Object.entries(categories)
    .filter(([_, count]) => count > 0)
    .map(([reason, count]) => ({
      reason,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get hourly publishing trend (last 24h).
 * Useful for spotting when agency is active vs idle.
 */
export async function getPublishingTrend(hours: number = 24): Promise<Array<{
  hour: string;
  published: number;
  failed: number;
}>> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Get all events in window
  const events = await db.agencyEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { status: true, createdAt: true, publishedAt: true },
    take: 10000,
  });

  // Group by hour
  const hourBuckets = new Map<string, { published: number; failed: number }>();

  for (const e of events) {
    const dt = (e.publishedAt || e.createdAt);
    const hourKey = dt.toISOString().slice(0, 13) + ':00';
    if (!hourBuckets.has(hourKey)) {
      hourBuckets.set(hourKey, { published: 0, failed: 0 });
    }
    const bucket = hourBuckets.get(hourKey)!;
    if (e.status === 'published') bucket.published++;
    else if (e.status === 'failed') bucket.failed++;
  }

  return Array.from(hourBuckets.entries())
    .map(([hour, counts]) => ({ hour, ...counts }))
    .sort((a, b) => a.hour.localeCompare(b.hour));
}
