// ─── Daily Article Production Statistics API ─────────────────
// Provides today's article production metrics for the dashboard.
// Returns: total produced, published, failed, by-stage, success rate,
// and comparison with yesterday for trend indicators.
// No admin auth required — accessible by the dashboard for read-only stats.

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-utils';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper: get start of day in UTC
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: NextRequest) {
  // Auth removed — this is read-only production stats, not sensitive data

  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    // ── Today's statistics ────────────────────────────────
    const [
      todayTotal,
      todayPublished,
      todayFailed,
      todayByStageRaw,
      todayBySentimentRaw,
      todayByCategoryRaw,
      todayByTypeRaw,
      // Yesterday's for comparison
      yesterdayTotal,
      yesterdayPublished,
      yesterdayFailed,
    ] = await Promise.all([
      // Today: total articles fetched
      db.newsItem.count({
        where: { fetchedAt: { gte: todayStart } },
      }),
      // V378: Today: published — visibility filter (matches frontend display)
      db.newsItem.count({
        where: {
          fetchedAt: { gte: todayStart },
          isReady: true,
          isPublished: true,
          newsType: 'live',
          slug: { not: '' },
          title: { not: '' },
        },
      }),
      // Today: failed (retryCount >= 3 OR lastError exists AND not published)
      db.newsItem.count({
        where: {
          fetchedAt: { gte: todayStart },
          isReady: false,
          isPublished: false,
          retryCount: { gte: 3 },
        },
      }),
      // Today: by processing stage
      db.newsItem.groupBy({
        by: ['processingStage'],
        where: { fetchedAt: { gte: todayStart } },
        _count: { id: true },
      }),
      // Today: by sentiment
      db.newsItem.groupBy({
        by: ['sentiment'],
        where: { fetchedAt: { gte: todayStart } },
        _count: { id: true },
      }),
      // Today: by category
      db.newsItem.groupBy({
        by: ['category'],
        where: { fetchedAt: { gte: todayStart } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      // Today: by news type
      db.newsItem.groupBy({
        by: ['newsType'],
        where: { fetchedAt: { gte: todayStart } },
        _count: { id: true },
      }),
      // Yesterday: total
      db.newsItem.count({
        where: {
          fetchedAt: { gte: yesterdayStart, lt: todayStart },
        },
      }),
      // V378: Yesterday: published — visibility filter
      db.newsItem.count({
        where: {
          fetchedAt: { gte: yesterdayStart, lt: todayStart },
          isReady: true,
          isPublished: true,
          newsType: 'live',
          slug: { not: '' },
          title: { not: '' },
        },
      }),
      // Yesterday: failed
      db.newsItem.count({
        where: {
          fetchedAt: { gte: yesterdayStart, lt: todayStart },
          isReady: false,
          isPublished: false,
          retryCount: { gte: 3 },
        },
      }),
    ]);

    // Today: in-progress (fetched but not ready and not failed)
    const todayInProgress = todayTotal - todayPublished - todayFailed;

    // Success rate
    const successRate = todayTotal > 0 ? Math.round((todayPublished / todayTotal) * 100) : 0;

    // Yesterday comparison
    const yesterdaySuccessRate = yesterdayTotal > 0 ? Math.round((yesterdayPublished / yesterdayTotal) * 100) : 0;

    // Build by-stage object
    const byStage: Record<string, number> = {};
    for (const row of todayByStageRaw) {
      byStage[row.processingStage || 'unknown'] = row._count.id;
    }

    // Build by-sentiment object
    const bySentiment: Record<string, number> = {};
    for (const row of todayBySentimentRaw) {
      bySentiment[row.sentiment || 'neutral'] = row._count.id;
    }

    // Build by-category object (top 8)
    const byCategory = todayByCategoryRaw.slice(0, 8).map(row => ({
      category: row.category || 'أخرى',
      count: row._count.id,
    }));

    // Build by-type object
    const byType: Record<string, number> = {};
    for (const row of todayByTypeRaw) {
      byType[row.newsType || 'live'] = row._count.id;
    }

    // ── Pipeline runs today ────────────────────────────────
    const pipelineRunsToday = await db.pipelineRun.findMany({
      where: { startedAt: { gte: todayStart } },
      select: {
        status: true,
        articlesPublished: true,
        articlesFailed: true,
        articlesSkipped: true,
        totalDuration: true,
      },
    });

    const pipelineSummary = {
      totalRuns: pipelineRunsToday.length,
      completedRuns: pipelineRunsToday.filter(r => r.status === 'completed').length,
      failedRuns: pipelineRunsToday.filter(r => r.status === 'failed').length,
      runningRuns: pipelineRunsToday.filter(r => r.status === 'running').length,
      totalPublishedByPipeline: pipelineRunsToday.reduce((sum, r) => sum + r.articlesPublished, 0),
      totalFailedByPipeline: pipelineRunsToday.reduce((sum, r) => sum + r.articlesFailed, 0),
      totalSkippedByPipeline: pipelineRunsToday.reduce((sum, r) => sum + r.articlesSkipped, 0),
      avgDurationMs: pipelineRunsToday.length > 0
        ? Math.round(pipelineRunsToday.reduce((sum, r) => sum + r.totalDuration, 0) / pipelineRunsToday.length)
        : 0,
    };

    // ── Recent errors (last 5) ─────────────────────────────
    const recentErrors = await db.newsItem.findMany({
      where: {
        fetchedAt: { gte: todayStart },
        lastError: { not: null },
        isReady: false,
      },
      select: {
        id: true,
        titleAr: true,
        title: true,
        processingStage: true,
        retryCount: true,
        lastError: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      date: todayStart.toISOString().split('T')[0],
      today: {
        total: todayTotal,
        published: todayPublished,
        failed: todayFailed,
        inProgress: todayInProgress,
        successRate,
        byStage,
        bySentiment,
        byCategory,
        byType,
      },
      yesterday: {
        total: yesterdayTotal,
        published: yesterdayPublished,
        failed: yesterdayFailed,
        successRate: yesterdaySuccessRate,
      },
      trends: {
        totalChange: todayTotal - yesterdayTotal,
        publishedChange: todayPublished - yesterdayPublished,
        failedChange: todayFailed - yesterdayFailed,
        successRateChange: successRate - yesterdaySuccessRate,
      },
      pipeline: pipelineSummary,
      recentErrors: recentErrors.map(e => ({
        id: e.id.slice(0, 8),
        title: (e.titleAr || e.title || '').slice(0, 60),
        stage: e.processingStage,
        retries: e.retryCount,
        error: (e.lastError || '').slice(0, 100),
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return apiError(err, 'إحصائيات الإنتاج اليومي');
  }
}
