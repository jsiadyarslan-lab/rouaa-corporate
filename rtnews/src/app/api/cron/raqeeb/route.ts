// ─── Raqeeb (رقيب) Cron Trigger ───────────────────────────
// Called by Railway cron every 2 minutes to run the monitoring cycle.
// Also supports manual triggering via ?action= parameter.

import { NextResponse } from 'next/server';
import { runRaqeebCycle, sendStartupNotification, sendTestAlert, getRaqeebStatus, getMetricHistory, getAlertLog, getAlertRules } from '@/lib/pipeline/raqeeb';

export const dynamic = 'force-dynamic';

// Verify internal/cron auth
function verifyAuth(request: Request): boolean {
  const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
  if (!internalSecret) return false;

  const headerSecret = request.headers.get('x-internal');
  const urlSecret = new URL(request.url).searchParams.get('secret');

  return headerSecret === internalSecret || urlSecret === internalSecret;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'monitor';

  // Auth required for all actions except 'status' and 'dashboard' (read-only)
  if (action !== 'status' && action !== 'dashboard' && !verifyAuth(request)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    switch (action) {
      case 'monitor': {
        // Auto-send startup notification on first cycle
        await sendStartupNotification();

        const result = await runRaqeebCycle();
        return NextResponse.json({
          ok: true,
          action: 'monitor',
          alerts: result.alerts.length,
          healingActions: result.healingActions.length,
          durationMs: result.durationMs,
          metrics: {
            articlesLastHour: result.metrics.articlesLastHour,
            articlesLast15Min: result.metrics.articlesLast15Min,
            totalReady: result.metrics.totalReady,
            totalPublished: result.metrics.totalPublished,
            newestArticleAgeMin: result.metrics.newestArticleAgeMin,
            pipelineRunning: result.metrics.pipelineRunning,
            aiProvidersAvailable: result.metrics.aiProvidersAvailable,
            aiProvidersTotal: result.metrics.aiProvidersTotal,
            dbStatus: result.metrics.dbStatus,
            dbLatencyMs: result.metrics.dbLatencyMs,
          },
        });
      }

      case 'startup': {
        await sendStartupNotification();
        return NextResponse.json({ ok: true, action: 'startup', message: 'Startup notification sent' });
      }

      case 'test': {
        const sent = await sendTestAlert();
        return NextResponse.json({ ok: sent, action: 'test', message: sent ? 'Test alert sent to Telegram' : 'Failed to send test alert' });
      }

      case 'status': {
        const status = getRaqeebStatus();
        return NextResponse.json({
          ok: true,
          action: 'status',
          ...status,
        });
      }

      case 'metrics': {
        const history = getMetricHistory();
        // Return last 30 snapshots (30 min)
        const recent = history.slice(-30);
        return NextResponse.json({
          ok: true,
          action: 'metrics',
          count: recent.length,
          snapshots: recent.map(m => ({
            t: m.timestamp,
            aH: m.articlesLastHour,
            a15: m.articlesLast15Min,
            tR: m.totalReady,
            tP: m.totalPublished,
            pR: m.pipelineRunning,
            aA: m.aiProvidersAvailable,
            dL: m.dbLatencyMs,
            sR: Math.round(m.skipRate * 100),
          })),
        });
      }

      case 'dashboard': {
        const status = getRaqeebStatus();
        const history = getMetricHistory();
        const alerts = getAlertLog();
        const rules = getAlertRules();
        const latest = history.length > 0 ? history[history.length - 1] : null;

        // Build trend data for charts (last 60 snapshots = 1 hour)
        const trend = history.slice(-60).map(m => ({
          time: m.timestamp,
          articlesHour: m.articlesLastHour,
          articles15Min: m.articlesLast15Min,
          publishedToday: m.publishedToday,
          skipRate: Math.round(m.skipRate * 100),
          dbLatency: m.dbLatencyMs,
          aiAvailable: m.aiProvidersAvailable,
          pipelineRunning: m.pipelineRunning ? 1 : 0,
          pending: m.pendingCount,
        }));

        // Alert counts by level
        const alertsByLevel = {
          critical: alerts.filter(a => a.level === 'critical').length,
          warning: alerts.filter(a => a.level === 'warning').length,
          info: alerts.filter(a => a.level === 'info').length,
        };

        return NextResponse.json({
          ok: true,
          action: 'dashboard',
          status: {
            isRunning: status.isRunning,
            lastRunTime: status.lastRunTime,
            lastRunAgo: status.lastRunTime > 0 ? Math.round((Date.now() - status.lastRunTime) / 1000) : -1,
            metricHistoryCount: status.metricHistoryCount,
            healingAttemptsCount: status.healingAttempts.length,
          },
          current: latest ? {
            articlesLastHour: latest.articlesLastHour,
            articlesLast15Min: latest.articlesLast15Min,
            totalReady: latest.totalReady,
            totalPublished: latest.totalPublished,
            newestArticleAgeMin: latest.newestArticleAgeMin,
            pipelineRunning: latest.pipelineRunning,
            pipelineCycles: latest.pipelineCycles,
            pipelineIdleMin: latest.pipelineIdleMin,
            publishedToday: latest.publishedToday,
            publishedThisHour: latest.publishedThisHour,
            skipRate: latest.skipRate,
            pendingCount: latest.pendingCount,
            skippedCount: latest.skippedCount,
            aiProvidersAvailable: latest.aiProvidersAvailable,
            aiProvidersTotal: latest.aiProvidersTotal,
            aiCascadeFailure: latest.aiCascadeFailure,
            dbLatencyMs: latest.dbLatencyMs,
            dbStatus: latest.dbStatus,
            uptime: latest.uptime,
          } : null,
          trend,
          alerts: alerts.slice(-30).reverse(),
          alertsByLevel,
          rules,
        });
      }

      default:
        return NextResponse.json({ error: 'إجراء غير معروف', available: ['monitor', 'startup', 'test', 'status', 'metrics', 'dashboard'] }, { status: 400 });
    }
  } catch (err: unknown) {
    console.error(`[Raqeeb Cron] Error: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({
      ok: false,
      error: 'حدث خطأ في رقيب',
      details: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
