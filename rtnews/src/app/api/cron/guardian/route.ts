// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Cron Route
// ═══════════════════════════════════════════════════════════════
// Called by cron scheduler every 30 seconds.
// Runs the OODA cycle: Observe → Orient → Decide → Act → Learn
// Auto-fixes critical issues and sends alerts.
//
// CRON_URL: /api/cron/guardian
// SCHEDULE: Every 30 seconds
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { runGuardianCycle, getGuardianStatus } from '@/lib/pipeline/guardian';

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return true;  // No secret configured — allow
  if (!authHeader) return false;

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('[Guardian Cron] Starting OODA cycle...');

    // Run the guardian cycle with autoFix enabled
    const report = await runGuardianCycle(true);

    // Quick status check
    const status = getGuardianStatus();

    return NextResponse.json({
      success: true,
      cycle: report.cycleNumber,
      score: report.overallScore,
      status: report.overallStatus,
      fixesApplied: report.fixesApplied.length,
      rootCauses: report.rootCausesFound.length,
      durationMs: report.durationMs,
    });
  } catch (error: any) {
    console.error('[Guardian Cron] OODA cycle failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Same as GET — some cron services use POST
  return GET(request);
}
