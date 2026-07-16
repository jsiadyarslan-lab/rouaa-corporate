// ─── Production Stats API Route ─────────────────────────────
// Returns detailed publishing and fetching statistics per locale.
// Covers: news, reports, infographics, videos, and pipeline metrics.
// Auth: requires admin session or internal/cron auth.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, apiError } from '@/lib/api-utils';
import { verifyInternalOrCronAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

// ── Date helpers ──────────────────────────────────────────────
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // Monday as start of week
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ── Auth helper: accept admin session OR internal/cron auth ──
async function checkAuth(request: Request): Promise<NextResponse | null> {
  // 1. Check internal/cron auth (synchronous)
  if (verifyInternalOrCronAuth(request)) return null;
  // 2. Check admin session (async)
  return requireAdmin(request);
}

export async function GET(request: NextRequest) {
  const authErr = await checkAuth(request);
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'ar';

    // Validate locale
    if (!['ar', 'en', 'fr', 'tr', 'es'].includes(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale. Must be one of: ar, en, fr, tr, es' },
        { status: 400 }
      );
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    // ── Run all queries in parallel for performance ─────────
    const [
      // News stats
      newsTotalPublished,
      newsTotalFetched,
      newsTodayPublished,
      newsTodayFetched,
      newsThisWeekPublished,
      newsThisMonthPublished,
      newsByStageRaw,
      newsByCategoryRaw,
      newsReadyCount,
      // Fetch log stats (global — no locale field on NewsFetchLog)
      fetchLogsAll,
      // Report stats
      reportsTotalPublished,
      reportsTodayGenerated,
      reportsThisWeekGenerated,
      reportsThisMonthGenerated,
      reportsByTypeRaw,
      reportsByScopeRaw,
      // Infographic stats
      infographicsTotalPublished,
      infographicsTodayGenerated,
      infographicsThisWeekGenerated,
      // Video stats
      videosTotalCompleted,
      videosTodayGenerated,
      videosThisWeekGenerated,
      videosByStatusRaw,
      // Pipeline stats
      pipelineTotalRuns,
      pipelineCompletedRuns,
      pipelineFailedRuns,
      pipelineLastRun,
      pipelineAllCompleted,
    ] = await Promise.all([
      // ── News ─────────────────────────────────────────────
      // V378: Added visibility filter — only count live news with slug+title
      // (matches frontend display filter, same as V376 fix for overview tab)
      db.newsItem.count({
        where: { locale, isPublished: true, isReady: true, newsType: 'live', slug: { not: '' }, title: { not: '' } },
      }),
      // totalFetched (all items ever fetched for this locale)
      db.newsItem.count({
        where: { locale },
      }),
      // V378: todayPublished — visibility filter (matches frontend)
      db.newsItem.count({
        where: {
          locale,
          isPublished: true,
          isReady: true,
          newsType: 'live',
          slug: { not: '' },
          title: { not: '' },
          publishedAt: { gte: todayStart },
        },
      }),
      // todayFetched (items fetched today for this locale)
      db.newsItem.count({
        where: {
          locale,
          fetchedAt: { gte: todayStart },
        },
      }),
      // V378: thisWeekPublished — visibility filter
      db.newsItem.count({
        where: {
          locale,
          isPublished: true,
          isReady: true,
          newsType: 'live',
          slug: { not: '' },
          title: { not: '' },
          publishedAt: { gte: weekStart },
        },
      }),
      // V378: thisMonthPublished — visibility filter
      db.newsItem.count({
        where: {
          locale,
          isPublished: true,
          isReady: true,
          newsType: 'live',
          slug: { not: '' },
          title: { not: '' },
          publishedAt: { gte: monthStart },
        },
      }),
      // byStage (groupBy processingStage)
      db.newsItem.groupBy({
        by: ['processingStage'],
        where: { locale },
        _count: { id: true },
      }),
      // byCategory (groupBy category)
      db.newsItem.groupBy({
        by: ['category'],
        where: { locale },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      // ready count (isReady=true, separate from processingStage)
      db.newsItem.count({
        where: { locale, isReady: true },
      }),

      // ── Fetch logs ───────────────────────────────────────
      // All fetch logs for success rate & avg duration
      // (NewsFetchLog has no locale field — these are global stats)
      db.newsFetchLog.findMany({
        select: { status: true, itemsFetched: true, duration: true },
      }),

      // ── Reports ──────────────────────────────────────────
      // totalPublished
      db.economicReport.count({
        where: { locale, isPublished: true },
      }),
      // todayGenerated
      db.economicReport.count({
        where: { locale, createdAt: { gte: todayStart } },
      }),
      // thisWeekGenerated
      db.economicReport.count({
        where: { locale, createdAt: { gte: weekStart } },
      }),
      // thisMonthGenerated
      db.economicReport.count({
        where: { locale, createdAt: { gte: monthStart } },
      }),
      // byType
      db.economicReport.groupBy({
        by: ['reportType'],
        where: { locale },
        _count: { id: true },
      }),
      // byScope (EconomicReport has no assetClass; use scope as closest categorization)
      db.economicReport.groupBy({
        by: ['scope'],
        where: { locale },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),

      // ── Infographics ─────────────────────────────────────
      // totalPublished
      db.infographic.count({
        where: { locale, isPublished: true },
      }),
      // todayGenerated
      db.infographic.count({
        where: { locale, createdAt: { gte: todayStart } },
      }),
      // thisWeekGenerated
      db.infographic.count({
        where: { locale, createdAt: { gte: weekStart } },
      }),

      // ── Videos ───────────────────────────────────────────
      // totalCompleted
      db.videoReport.count({
        where: { locale, status: 'completed' },
      }),
      // todayGenerated
      db.videoReport.count({
        where: { locale, createdAt: { gte: todayStart } },
      }),
      // thisWeekGenerated
      db.videoReport.count({
        where: { locale, createdAt: { gte: weekStart } },
      }),
      // byStatus
      db.videoReport.groupBy({
        by: ['status'],
        where: { locale },
        _count: { id: true },
      }),

      // ── Pipeline ─────────────────────────────────────────
      // totalRuns
      db.pipelineRun.count(),
      // completedRuns
      db.pipelineRun.count({
        where: { status: 'completed' },
      }),
      // failedRuns
      db.pipelineRun.count({
        where: { status: 'failed' },
      }),
      // lastRun (PipelineRun uses startedAt, not createdAt)
      db.pipelineRun.findFirst({
        orderBy: { startedAt: 'desc' },
        select: { startedAt: true, articlesPublished: true },
      }),
      // all completed runs for avg calculation
      db.pipelineRun.findMany({
        where: { status: 'completed' },
        select: { articlesPublished: true },
      }),
    ]);

    // ── Build news.byStage ────────────────────────────────────
    const stageKeys = ['fetched', 'content_loaded', 'translated', 'analyzed', 'imaged', 'ready'] as const;
    const byStage: Record<string, number> = {};
    for (const key of stageKeys) {
      byStage[key] = 0;
    }
    for (const row of newsByStageRaw) {
      const stage = row.processingStage || 'unknown';
      byStage[stage] = row._count.id;
    }
    // "ready" = isReady=true regardless of processingStage name
    byStage.ready = newsReadyCount;

    // ── Build news.byCategory ─────────────────────────────────
    const byCategory = newsByCategoryRaw.slice(0, 20).map(row => ({
      category: row.category || 'أخرى',
      count: row._count.id,
    }));

    // ── Calculate fetch success rate & avg duration ───────────
    const successCount = fetchLogsAll.filter(l => l.status === 'success').length;
    const totalFetchLogCount = fetchLogsAll.length;
    const successRate = totalFetchLogCount > 0
      ? Math.round((successCount / totalFetchLogCount) * 100)
      : 0;
    const totalDuration = fetchLogsAll.reduce((sum, l) => sum + l.duration, 0);
    const avgFetchDuration = totalFetchLogCount > 0
      ? Math.round(totalDuration / totalFetchLogCount)
      : 0;

    // ── Build reports.byType ──────────────────────────────────
    const reportTypeKeys = ['daily', 'weekly', 'monthly', 'special'] as const;
    const byType: Record<string, number> = {};
    for (const key of reportTypeKeys) {
      byType[key] = 0;
    }
    for (const row of reportsByTypeRaw) {
      byType[row.reportType || 'weekly'] = row._count.id;
    }

    // ── Build reports.byAssetClass ────────────────────────────
    // EconomicReport has no assetClass field; we use `scope` as the
    // closest categorization dimension and map it into the same shape.
    const byAssetClass = reportsByScopeRaw.map(row => ({
      assetClass: row.scope || 'global',
      count: row._count.id,
    }));

    // ── Build videos.byStatus ─────────────────────────────────
    const videoStatusKeys = ['pending', 'processing', 'completed', 'failed'] as const;
    const byStatus: Record<string, number> = {};
    for (const key of videoStatusKeys) {
      byStatus[key] = 0;
    }
    for (const row of videosByStatusRaw) {
      byStatus[row.status || 'pending'] = row._count.id;
    }

    // ── Build pipeline stats ──────────────────────────────────
    const totalArticlesPublished = pipelineAllCompleted.reduce(
      (sum, r) => sum + r.articlesPublished,
      0
    );
    const avgArticlesPerRun = pipelineAllCompleted.length > 0
      ? Math.round((totalArticlesPublished / pipelineAllCompleted.length) * 10) / 10
      : 0;

    // ── Assemble response ─────────────────────────────────────
    return NextResponse.json({
      news: {
        totalPublished: newsTotalPublished,
        totalFetched: newsTotalFetched,
        todayPublished: newsTodayPublished,
        todayFetched: newsTodayFetched,
        thisWeekPublished: newsThisWeekPublished,
        thisMonthPublished: newsThisMonthPublished,
        byStage,
        byCategory,
        successRate,
        avgFetchDuration,
      },
      reports: {
        totalPublished: reportsTotalPublished,
        todayGenerated: reportsTodayGenerated,
        thisWeekGenerated: reportsThisWeekGenerated,
        thisMonthGenerated: reportsThisMonthGenerated,
        byType,
        byAssetClass,
      },
      infographics: {
        totalPublished: infographicsTotalPublished,
        todayGenerated: infographicsTodayGenerated,
        thisWeekGenerated: infographicsThisWeekGenerated,
      },
      videos: {
        totalCompleted: videosTotalCompleted,
        todayGenerated: videosTodayGenerated,
        thisWeekGenerated: videosThisWeekGenerated,
        byStatus,
      },
      pipeline: {
        totalRuns: pipelineTotalRuns,
        completedRuns: pipelineCompletedRuns,
        failedRuns: pipelineFailedRuns,
        lastRunAt: pipelineLastRun?.startedAt?.toISOString() ?? null,
        lastRunArticlesPublished: pipelineLastRun?.articlesPublished ?? 0,
        avgArticlesPerRun,
      },
    });
  } catch (err) {
    return apiError(err, 'إحصائيات الإنتاج');
  }
}
