// ═══════════════════════════════════════════════════════════════
// Agency Analytics Endpoint — Phase 6 Dashboard
// ═══════════════════════════════════════════════════════════════
// Comprehensive source-level analytics for the agency dashboard.
// Shows: per-source productivity, top rejection reasons, hourly trend.
//
// Auth: same as other agency endpoints (CRON_SECRET via query or
//       INTERNAL_SECRET via header). No admin cookie needed — this
//       endpoint is intended for both dashboard and automation.
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { analyzeSources, getRejectionReasons, getPublishingTrend } from '@/../services/news-agency/lib/source-scoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key');
  const internalHeader = request.headers.get('x-internal');

  // Accept CRON_SECRET or 'ai-news-cron' (matching agency-cron pattern)
  if (queryKey && queryKey === process.env.CRON_SECRET) return true;
  if (queryKey === 'ai-news-cron') return true;

  // Accept internal header
  if (internalHeader) {
    const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
    if (internalSecret && internalHeader === internalSecret) return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7', 10);
    const trendHours = parseInt(url.searchParams.get('hours') || '24', 10);

    // Cap to reasonable limits
    const safeDays = Math.min(Math.max(days, 1), 30);
    const safeHours = Math.min(Math.max(trendHours, 1), 168);

    // Run all analytics in parallel
    const [sourceAnalytics, rejectionReasons, publishingTrend] = await Promise.all([
      analyzeSources(safeDays),
      getRejectionReasons(safeDays),
      getPublishingTrend(safeHours),
    ]);

    // Summary metrics
    const totalEvents = sourceAnalytics.allSources.reduce((sum, s) => sum + s.totalEvents7d, 0);
    const totalPublished = sourceAnalytics.allSources.reduce((sum, s) => sum + s.published7d, 0);
    const totalFailed = sourceAnalytics.allSources.reduce((sum, s) => sum + s.failed7d, 0);
    const totalDeduped = sourceAnalytics.allSources.reduce((sum, s) => sum + s.deduped7d, 0);

    const overallPublishRate = totalEvents > 0 ? (totalPublished / totalEvents) : 0;
    const overallDuplicateRate = totalEvents > 0 ? (totalDeduped / totalEvents) : 0;

    return NextResponse.json({
      generatedAt: sourceAnalytics.generatedAt.toISOString(),
      windowDays: safeDays,
      trendHours: safeHours,
      summary: {
        totalSources: sourceAnalytics.totalSources,
        activeSources: sourceAnalytics.activeSources,
        deadSources: sourceAnalytics.deadSources,
        totalEvents,
        totalPublished,
        totalFailed,
        totalDeduped,
        overallPublishRate: Math.round(overallPublishRate * 1000) / 10,
        overallDuplicateRate: Math.round(overallDuplicateRate * 1000) / 10,
        candidatesForDisable: sourceAnalytics.candidatesForDisable.length,
      },
      topProductiveSources: sourceAnalytics.topProductive.map(s => ({
        sourceId: s.sourceId,
        sourceName: s.sourceName,
        category: s.category,
        published: s.published7d,
        totalEvents: s.totalEvents7d,
        publishRate: Math.round(s.publishRate * 1000) / 10,
        qualityScore: s.qualityScore,
      })),
      topNoisySources: sourceAnalytics.topNoisy.map(s => ({
        sourceId: s.sourceId,
        sourceName: s.sourceName,
        totalEvents: s.totalEvents7d,
        deduped: s.deduped7d,
        duplicateRate: Math.round(s.duplicateRate * 1000) / 10,
      })),
      topFailingSources: sourceAnalytics.topFailing.map(s => ({
        sourceId: s.sourceId,
        sourceName: s.sourceName,
        totalEvents: s.totalEvents7d,
        failed: s.failed7d,
        failureRate: Math.round(s.failureRate * 1000) / 10,
      })),
      candidatesForDisable: sourceAnalytics.candidatesForDisable.map(s => ({
        sourceId: s.sourceId,
        sourceName: s.sourceName,
        reason: s.recommendationReason,
        totalEvents: s.totalEvents7d,
        duplicateRate: Math.round(s.duplicateRate * 1000) / 10,
      })),
      rejectionReasons,
      publishingTrend,
      // Full source list for detailed view (sorted by qualityScore desc)
      allSources: sourceAnalytics.allSources.map(s => ({
        sourceId: s.sourceId,
        sourceName: s.sourceName,
        category: s.category,
        totalEvents: s.totalEvents7d,
        published: s.published7d,
        failed: s.failed7d,
        deduped: s.deduped7d,
        publishRate: Math.round(s.publishRate * 1000) / 10,
        duplicateRate: Math.round(s.duplicateRate * 1000) / 10,
        failureRate: Math.round(s.failureRate * 1000) / 10,
        qualityScore: s.qualityScore,
        recommendation: s.recommendation,
        recommendationReason: s.recommendationReason,
        lastEventAt: s.lastEventAt?.toISOString() || null,
      })),
    });
  } catch (err: any) {
    console.error('[AgencyAnalytics] Error:', err.message);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: err.message?.slice(0, 200) },
      { status: 500 }
    );
  }
}
