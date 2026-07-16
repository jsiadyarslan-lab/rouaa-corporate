// ─── News Health API Route V319 ─────────────────────────────
// Pipeline health check with detailed diagnostics.
// V73: Added publisher rejection diagnostics — shows WHY articles at
// "imaged" stage aren't being published, including specific error messages.
// V118: Expose pipeline config (concurrency, articlesPerCycle) and degradedMode state.
// V319: Added dbConnected + dbLatencyMs fields. Added locale param support
// to return EN-specific orchestrator stats when locale=en.
// Locale-aware error/diagnostics queries.

import { NextRequest, NextResponse } from 'next/server';
import { getOrchestratorStats } from '@/lib/pipeline/orchestrator';
import { getQueueStats } from '@/lib/pipeline/queue/job-manager';
import { db, pingDB, recoverConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request?: NextRequest) {
  const locale = request ? new URL(request.url).searchParams.get('locale') : null;
  const isEn = locale === 'en';

  try {
    // ── V319→V5: Real DB connectivity test WITH recovery ──
    // V5 FIX: The old version did a single SELECT 1 and reported "Disconnected"
    // on ANY failure — even transient ones (pool exhaustion, brief network glitch).
    // This caused the monitor to show "DB: Disconnected" permanently, even though
    // a simple reconnection would fix it.
    //
    // V5: Try SELECT 1 → if fails, attempt recovery → try SELECT 1 again.
    // Only report "Disconnected" if BOTH attempts fail.
    let dbConnected = false;
    let dbLatencyMs: number | undefined;
    let dbError: string | undefined;
    let dbRecoveryAttempted = false;
    let dbRecovered = false;

    try {
      const dbStart = Date.now();
      await db.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
      dbConnected = true;
    } catch (firstErr: any) {
      dbError = firstErr.message?.slice(0, 120) || 'Unknown DB error';
      console.warn(`[Health V5] DB SELECT 1 failed: ${dbError} — attempting recovery...`);

      // Attempt recovery before reporting "Disconnected"
      dbRecoveryAttempted = true;
      try {
        const recovered = await recoverConnection();
        if (recovered) {
          // Recovery succeeded — verify with another SELECT 1
          const dbStart = Date.now();
          await db.$queryRaw`SELECT 1`;
          dbLatencyMs = Date.now() - dbStart;
          dbConnected = true;
          dbRecovered = true;
          console.log('[Health V5] ✓ DB recovered successfully after initial failure');
        }
      } catch (recoveryErr: any) {
        dbError = recoveryErr.message?.slice(0, 120) || dbError;
        console.error(`[Health V5] ✗ DB recovery failed: ${recoveryErr.message?.slice(0, 100)}`);
      }
    }

    // ── V319: Use EN orchestrator stats when locale=en ──
    let orchestratorStats: any;
    if (isEn) {
      try {
        const { getEnOrchestratorStats } = await import('@/lib/pipeline/en-orchestrator');
        orchestratorStats = await getEnOrchestratorStats();
      } catch {
        // Fallback to Arabic stats if EN import fails
        orchestratorStats = await getOrchestratorStats();
      }
    } else {
      orchestratorStats = await getOrchestratorStats();
    }

    const queueStats = await getQueueStats();

    const isHealthy = orchestratorStats.isRunning && !orchestratorStats.isPaused;
    const hasRecentActivity = orchestratorStats.lastCycleTime !== null;
    const status = isHealthy ? 'healthy' : hasRecentActivity ? 'degraded' : 'unhealthy';

    // V319: Locale-aware filter for diagnostics queries
    const localeFilter = isEn ? { locale: 'en' as const } : {};

    // V43: Get recent errors for diagnostics (V319: locale-aware)
    let recentErrors: any[] = [];
    try {
      recentErrors = await db.newsItem.findMany({
        where: { lastError: { not: null }, isReady: false, ...localeFilter },
        select: { id: true, processingStage: true, retryCount: true, lastError: true },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      });
    } catch {}

    // V73: Get publisher rejection diagnostics — articles at "imaged" stage with errors
    let publisherDiagnostics: any[] = [];
    try {
      const imagedWithErrors = await db.newsItem.findMany({
        where: {
          processingStage: 'imaged',
          isReady: false,
          lastError: { not: null },
          ...localeFilter,
        },
        select: {
          id: true,
          titleAr: true,
          title: true,
          lastError: true,
          retryCount: true,
          contentAr: true,
          content: true,
          // EGRESS FIX: removed generatedImage from select — use processingStage='imaged' as proxy
          processingStage: true,
          aiAnalysis: true,
          slug: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      });
      publisherDiagnostics = imagedWithErrors.map(a => ({
        id: a.id.slice(0, 8),
        title: ((isEn ? a.title : a.titleAr) || '').slice(0, 60),
        error: (a.lastError || '').slice(0, 200),
        retries: a.retryCount,
        hasContent: !!(isEn ? (a.content && a.content.length > 100) : (a.contentAr && a.contentAr.length > 100)),
        contentLen: (isEn ? a.content : a.contentAr)?.length || 0,
        hasImage: a.processingStage === 'imaged', // EGRESS FIX: use processingStage instead of generatedImage
        imageIsUrl: false, // EGRESS FIX: cannot determine without pulling generatedImage data
        hasSlug: !!a.slug,
        hasAnalysis: !!(a.aiAnalysis && a.aiAnalysis.length > 50),
      }));
    } catch {}

    // V43: Check the ready articles (V319: locale-aware)
    let readyArticleDetails: any[] = [];
    try {
      readyArticleDetails = await db.newsItem.findMany({
        where: { isReady: true, ...localeFilter },
        select: {
          id: true,
          isPublished: true,
          titleAr: true,
          title: true,
          slug: true,
          // EGRESS FIX: removed generatedImage from select — use processingStage as proxy
          contentAr: true,
          content: true,
          aiAnalysis: true,
          processingStage: true,
        },
        take: 5,
      });
    } catch {}

    // Summarize ready article issues
    const readySummary = readyArticleDetails.map(a => ({
      id: a.id.slice(0, 8),
      isPublished: a.isPublished,
      hasTitle: !!(isEn ? a.title : a.titleAr),
      hasSlug: !!a.slug,
      hasImage: a.processingStage === 'imaged', // EGRESS FIX: use processingStage instead of generatedImage
      hasContent: !!(isEn ? (a.content && a.content.length > 100) : (a.contentAr && a.contentAr.length > 100)),
      hasAnalysis: !!(a.aiAnalysis && a.aiAnalysis.length > 50),
    }));

    return NextResponse.json({
      status,
      dbConnected,       // V319→V5: Real DB connectivity test result (with recovery)
      dbLatencyMs,       // V319: DB query latency in ms
      dbError,           // V5: Error message if DB connection failed
      dbRecoveryAttempted, // V5: Whether recovery was attempted
      dbRecovered,       // V5: Whether recovery succeeded
      locale: isEn ? 'en' : 'ar',  // V319: Which pipeline stats are shown
      orchestrator: {
        running: orchestratorStats.isRunning,
        paused: orchestratorStats.isPaused,
        cycles: orchestratorStats.cycleCount,
        lastCycle: orchestratorStats.lastCycleTime,
        published: orchestratorStats.totalPublished,
        errors: orchestratorStats.totalErrors,
        idleMinutes: orchestratorStats.idleMinutes,
        // V93b: Daily & hourly production limits (V319: safe defaults for EN orchestrator)
        todayPublished: orchestratorStats.todayPublished ?? null,
        dailyLimit: orchestratorStats.dailyLimit ?? orchestratorStats.config?.maxDailyPublished ?? null,
        dailyLimitReached: orchestratorStats.dailyLimitReached ?? false,
        thisHourPublished: orchestratorStats.thisHourPublished ?? null,
        hourlyLimit: orchestratorStats.hourlyLimit ?? orchestratorStats.config?.maxHourlyPublished ?? null,
        hourlyLimitReached: orchestratorStats.hourlyLimitReached ?? false,
        // V118: Pipeline config & degraded mode (V319: safe defaults for EN orchestrator)
        config: orchestratorStats.config,
        degradedMode: orchestratorStats.degradedMode ?? false,
        degradedModeSince: orchestratorStats.degradedModeSince ?? null,
        // V319: EN-specific fields
        totalFetched: orchestratorStats.totalFetched,
        isStale: orchestratorStats.isStale,
        reports: orchestratorStats.reports,
      },
      queue: {
        total: queueStats.total,
        ready: queueStats.ready,
        pending: queueStats.total - queueStats.ready - queueStats.failed,
        failed: queueStats.failed,
        stuck: queueStats.stuck,
        byStage: queueStats.byStage,
      },
      recentErrors: recentErrors.map(e => ({
        id: e.id.slice(0, 8),
        stage: e.processingStage,
        retries: e.retryCount,
        error: (e.lastError || '').slice(0, 200),
      })),
      publisherDiagnostics,
      readyArticles: readySummary,
      timestamp: new Date().toISOString(),
    }, { status: status === 'unhealthy' ? 503 : 200 });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      error: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
