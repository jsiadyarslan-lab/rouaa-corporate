import { NextRequest, NextResponse } from 'next/server';
import { runAcledImport } from '@/lib/geopolitical/import-scheduler';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min timeout for long import

// POST /api/geopolitical-risks/import/acled — Trigger ACLED data import
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

    // Check if ACLED credentials are configured
    if (!process.env.ACLED_ACCESS_KEY || !process.env.ACLED_EMAIL) {
      return NextResponse.json(
        {
          error: 'ACLED API credentials not configured',
          message: 'Set ACLED_ACCESS_KEY and ACLED_EMAIL environment variables to enable ACLED data import.',
        },
        { status: 400 }
      );
    }

    console.log('[ACLED Import] Starting import...');

    const result = await runAcledImport();

    return NextResponse.json({
      success: result.status !== 'failed',
      source: 'acled',
      status: result.status,
      recordsProcessed: result.recordsProcessed,
      recordsImported: result.recordsImported,
      errors: result.errors,
      durationMs: result.durationMs,
      timestamp: result.timestamp,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ACLED Import] Error:', message);
    return NextResponse.json(
      { error: 'ACLED import failed', details: message },
      { status: 500 }
    );
  }
}

// GET /api/geopolitical-risks/import/acled — Get import status/info
export async function GET() {
  return NextResponse.json({
    source: 'acled',
    configured: !!(process.env.ACLED_ACCESS_KEY && process.env.ACLED_EMAIL),
    schedule: 'Every 6 hours',
    highPriorityCountries: [
      'SY', 'IQ', 'YE', 'UA', 'AF', 'SO', 'SD', 'LY',
      'IR', 'IL', 'PS', 'MM', 'ET', 'NG', 'CD', 'ML',
    ],
    lastImportInfo: 'Check POST response for latest import results',
  });
}
