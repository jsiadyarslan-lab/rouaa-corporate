// ─── Pipeline Guardian API V1 ────────────────────────────────
// Unified smart monitor & auto-fixer for ALL pipeline locales.
// GET: Read guardian status, diagnostics, and fix history.
// POST: Trigger guardian run, apply manual fixes.

import { NextRequest, NextResponse } from 'next/server';
import { runGuardianCycle, getGuardianStatus, getLastReport, getFixHistory, getLocaleConfigs } from '@/lib/pipeline/pipeline-guardian';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'dashboard';

    switch (section) {
      case 'dashboard': {
        const report = await runGuardianCycle(false);
        return NextResponse.json({
          status: 'ok',
          guardian: report,
          timestamp: new Date().toISOString(),
        });
      }

      case 'status': {
        const status = getGuardianStatus();
        return NextResponse.json({ status: 'ok', ...status });
      }

      case 'history': {
        const history = getFixHistory();
        return NextResponse.json({ status: 'ok', fixes: history, count: history.length });
      }

      case 'configs': {
        const configs = getLocaleConfigs();
        return NextResponse.json({ status: 'ok', configs });
      }

      case 'report': {
        const report = getLastReport();
        if (!report) {
          return NextResponse.json({ status: 'ok', message: 'No report yet', report: null });
        }
        return NextResponse.json({ status: 'ok', report });
      }

      default:
        return NextResponse.json({
          status: 'error',
          message: `Unknown section: ${section}. Valid: dashboard, status, history, configs, report`,
        }, { status: 400 });
    }
  } catch (err: unknown) {
    return NextResponse.json({
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'run';
    const locale = body.locale;
    const autoFix = body.autoFix !== false;

    switch (action) {
      case 'run': {
        const report = await runGuardianCycle(autoFix);
        return NextResponse.json({
          status: 'ok',
          message: `Guardian run complete: score ${report.overallScore}/100 (${report.overallStatus}), ${report.fixesApplied.length} fixes applied`,
          guardian: report,
        });
      }

      case 'fix-locale': {
        if (!locale || !['ar', 'en', 'fr', 'tr', 'es'].includes(locale)) {
          return NextResponse.json({
            status: 'error',
            message: 'Provide locale as one of: ar, en, fr, tr, es',
          }, { status: 400 });
        }

        const report = await runGuardianCycle(true);
        const localeHealth = report.locales[locale as keyof typeof report.locales];

        return NextResponse.json({
          status: 'ok',
          message: `Guardian fix for ${locale}: score ${localeHealth.score}/100`,
          locale: localeHealth,
          fixes: report.fixesApplied.filter(f => f.locale === locale),
        });
      }

      case 'reset-all': {
        const { db } = await import('@/lib/db');
        let totalReset = 0;

        for (const loc of ['ar', 'en', 'fr', 'tr', 'es']) {
          const result = await db.newsItem.updateMany({
            where: {
              locale: loc,
              isReady: false,
              isPublished: false,
              processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'imaged', 'translated', 'skipped'] },
            },
            data: {
              processingStage: 'fetched',
              retryCount: 0,
              lastError: null,
            },
          });
          totalReset += result.count;
        }

        // Restart all orchestrators
        const restartResults: Record<string, string> = {};
        const restarters: [string, () => Promise<void>][] = [];
        try { const m = await import('@/lib/pipeline/orchestrator'); restarters.push(['ar', async () => { m.ensureRunning(); }]); } catch { restartResults['ar'] = 'failed'; }
        try { const m = await import('@/lib/pipeline/en-orchestrator'); restarters.push(['en', async () => { m.ensureEnRunning(); }]); } catch { restartResults['en'] = 'failed'; }
        try { const m = await import('@/lib/pipeline/fr-orchestrator'); restarters.push(['fr', async () => { m.ensureFrRunning(); }]); } catch { restartResults['fr'] = 'failed'; }
        try { const m = await import('@/lib/pipeline/tr-orchestrator'); restarters.push(['tr', async () => { m.ensureTrRunning(); }]); } catch { restartResults['tr'] = 'failed'; }
        try { const m = await import('@/lib/pipeline/es-orchestrator'); restarters.push(['es', async () => { m.ensureEsRunning(); }]); } catch { restartResults['es'] = 'failed'; }

        for (const [loc, fn] of restarters) {
          try { await fn(); restartResults[loc] = 'restarted'; } catch { restartResults[loc] = 'failed'; }
        }

        return NextResponse.json({
          status: 'ok',
          message: `NUCLEAR RESET: ${totalReset} articles reset across all locales`,
          totalReset,
          orchestrators: restartResults,
        });
      }

      default:
        return NextResponse.json({
          status: 'error',
          message: `Unknown action: ${action}. Valid: run, fix-locale, reset-all`,
        }, { status: 400 });
    }
  } catch (err: unknown) {
    return NextResponse.json({
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
