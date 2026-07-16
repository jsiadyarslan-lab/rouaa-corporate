import { NextRequest, NextResponse } from 'next/server';
import { runGdeltImport } from '@/lib/geopolitical/import-scheduler';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min timeout for long import

// POST /api/geopolitical-risks/import/gdelt — Trigger GDELT data import
// Should be called by a cron job or manually from admin panel
export async function POST(request: NextRequest) {
  try {
    // Security: Verify this is called with a valid cron secret or admin token
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide valid CRON_SECRET in Authorization header.' },
        { status: 401 }
      );
    }

    console.log('[GDELT Import] Starting import...');

    const result = await runGdeltImport();

    return NextResponse.json({
      success: result.status !== 'failed',
      source: 'gdelt',
      status: result.status,
      recordsProcessed: result.recordsProcessed,
      recordsImported: result.recordsImported,
      errors: result.errors,
      durationMs: result.durationMs,
      timestamp: result.timestamp,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GDELT Import] Error:', message);
    return NextResponse.json(
      { error: 'GDELT import failed', details: message },
      { status: 500 }
    );
  }
}

// GET /api/geopolitical-risks/import/gdelt — Get import status/info
export async function GET() {
  return NextResponse.json({
    source: 'gdelt',
    configured: true, // GDELT requires no API key
    schedule: 'Every 30 minutes',
    queries: [
      'geopolitical risk OR conflict OR sanctions',
      'war OR military OR troops OR invasion',
      'strait OR canal OR blockade OR trade war',
      'nuclear OR missile OR weapons program',
      'cyber attack OR cyber warfare',
      'oil disruption OR energy crisis',
      'coup OR political crisis OR unrest',
    ],
    lastImportInfo: 'Check POST response for latest import results',
  });
}
