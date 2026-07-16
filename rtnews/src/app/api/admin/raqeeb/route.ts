// ─── Raqeeb Admin API ──────────────────────────────────────
// Admin-authenticated endpoints for the Raqeeb monitoring dashboard.
// Uses admin_token cookie (JWT) for authentication.

import { NextResponse } from 'next/server';
import { requireAdmin, apiError } from '@/lib/api-utils';
import {
  runRaqeebCycle,
  sendTestAlert,
  getRaqeebStatus,
  getMetricHistory,
  getAlertLog,
  getAlertRules,
} from '@/lib/pipeline/raqeeb';

export const dynamic = 'force-dynamic';

// GET: Fetch dashboard data (same as /api/cron/raqeeb?action=dashboard but admin-authenticated)
export async function GET(request: Request) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'dashboard';

    switch (section) {
      case 'dashboard': {
        const status = getRaqeebStatus();
        const history = getMetricHistory();
        const alerts = getAlertLog();
        const rules = getAlertRules();
        const latest = history.length > 0 ? history[history.length - 1] : null;

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

        const alertsByLevel = {
          critical: alerts.filter(a => a.level === 'critical').length,
          warning: alerts.filter(a => a.level === 'warning').length,
          info: alerts.filter(a => a.level === 'info').length,
        };

        return NextResponse.json({
          ok: true,
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

      case 'status': {
        const status = getRaqeebStatus();
        return NextResponse.json({ ok: true, ...status });
      }

      case 'alerts': {
        const alerts = getAlertLog();
        return NextResponse.json({ ok: true, alerts: alerts.slice(-50).reverse() });
      }

      case 'rules': {
        const rules = getAlertRules();
        return NextResponse.json({ ok: true, rules });
      }

      default:
        return NextResponse.json(
          { error: 'قسم غير معروف', available: ['dashboard', 'status', 'alerts', 'rules'] },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    return apiError(err, 'raqeeb');
  }
}

// POST: Trigger Raqeeb actions (test alert, run cycle)
export async function POST(request: Request) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'test';

    switch (action) {
      case 'test': {
        const sent = await sendTestAlert();
        return NextResponse.json({
          ok: sent,
          action: 'test',
          message: sent ? 'تم إرسال تنبيه تجريبي إلى تلغرام' : 'فشل إرسال التنبيه — تحقق من TELEGRAM_ALERT_BOT_TOKEN و TELEGRAM_ALERT_CHAT_ID',
        });
      }

      case 'monitor': {
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
            pipelineRunning: result.metrics.pipelineRunning,
            aiProvidersAvailable: result.metrics.aiProvidersAvailable,
            aiProvidersTotal: result.metrics.aiProvidersTotal,
            dbStatus: result.metrics.dbStatus,
            dbLatencyMs: result.metrics.dbLatencyMs,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'إجراء غير معروف', available: ['test', 'monitor'] },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    return apiError(err, 'raqeeb-action');
  }
}
