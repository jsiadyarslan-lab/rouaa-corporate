import { NextRequest, NextResponse } from 'next/server';
import { runGeopoliticalPipeline, type Locale } from '@/lib/pipeline/geopolitical-pipeline';
import { isAdminAuthenticated, verifyInternalOrCronAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min timeout for long generation

// POST /api/geopolitical-risks/generate — Manually trigger the geopolitical risk analysis pipeline
// Body: { force?: boolean, maxAnalyses?: number, locales?: string[] }
// Auth: Admin session (from dashboard) OR CRON_SECRET (from cron jobs) OR INTERNAL_SECRET
export async function POST(request: NextRequest) {
  try {
    // V1047: Simplified auth — accept ANY of: admin cookie, CRON_SECRET, INTERNAL_SECRET
    const isAdmin = await isAdminAuthenticated(request);
    const isCronOrInternal = verifyInternalOrCronAuth(request);
    if (!isAdmin && !isCronOrInternal) {
      console.warn('[GeoGenerate] Auth failed — no admin cookie, no CRON_SECRET, no INTERNAL_SECRET');
      return NextResponse.json(
        { error: 'Unauthorized. Admin session, CRON_SECRET, or INTERNAL_SECRET required.' },
        { status: 401 },
      );
    }
    console.log('[GeoGenerate] Auth passed —', isAdmin ? 'admin session' : 'cron/internal');

    // Parse optional body
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine — use defaults
    }

    const force = body.force === true;
    const maxAnalyses = Math.min(Math.max(parseInt(body.maxAnalyses) || 5, 1), 10);
    const locales: Locale[] = Array.isArray(body.locales) && body.locales.length > 0
      ? body.locales.filter((l: string) => ['ar', 'en', 'fr', 'tr', 'es'].includes(l))
      : ['ar', 'en', 'fr', 'tr', 'es'];

    console.log(`[GeoGenerate] Manual trigger — force=${force}, max=${maxAnalyses}, locales=${locales.join(',')}`);

    const result = await runGeopoliticalPipeline({ force, maxAnalyses, locales });

    return NextResponse.json({
      success: result.success,
      generated: result.generated,
      skipped: result.skipped,
      errors: result.errors,
      durationMs: result.duration,
      analyses: result.analyses,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GeoGenerate] Error:', message);
    return NextResponse.json(
      { error: 'Geopolitical pipeline failed', details: message },
      { status: 500 },
    );
  }
}

// GET — Health check endpoint (no auth required)
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    pipeline: 'geopolitical-risk-analysis',
    version: 'V1044',
    description: 'Generates professional geopolitical risk analyses from news data using AI',
    trigger: 'POST /api/geopolitical-risks/generate with Authorization: Bearer <CRON_SECRET>',
  });
}
