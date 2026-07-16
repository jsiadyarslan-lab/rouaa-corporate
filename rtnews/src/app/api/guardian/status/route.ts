// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Status API Route
// ═══════════════════════════════════════════════════════════════
// GET /api/guardian/status — Get current guardian status + health
// POST /api/guardian/status — Run a guardian cycle (with optional autoFix)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { runGuardianCycle, getGuardianStatus, getLastReport } from '@/lib/pipeline/guardian';

export async function GET(request: NextRequest) {
  try {
    // Return current cached status
    const status = getGuardianStatus();
    const lastReport = getLastReport();

    return NextResponse.json({
      success: true,
      status,
      lastReport: lastReport ? {
        timestamp: lastReport.timestamp,
        cycleNumber: lastReport.cycleNumber,
        overallScore: lastReport.overallScore,
        overallStatus: lastReport.overallStatus,
        fixesApplied: lastReport.fixesApplied.length,
        rootCausesFound: lastReport.rootCausesFound.length,
        durationMs: lastReport.durationMs,
        locales: Object.fromEntries(
          Object.entries(lastReport.locales).map(([locale, health]) => [
            locale,
            {
              score: health.score,
              status: health.status,
              totalBlocked: health.totalBlocked,
              publishedToday: health.publishedToday,
              publishedThisHour: health.publishedThisHour,
              issueCount: health.issues.length,
              topIssues: health.issues.slice(0, 3).map(i => ({
                severity: i.severity,
                message: i.message,
                fixApplied: i.fixApplied,
              })),
              topRootCauses: health.rootCauses.slice(0, 3).map(rc => ({
                category: rc.category,
                pattern: rc.pattern,
                severity: rc.severity,
                affectedCount: rc.affectedCount,
                remediationLevel: rc.remediationLevel,
              })),
            },
          ])
        ),
      } : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const autoFix = body.autoFix !== false;  // Default: true

    console.log(`[Guardian API] Running cycle with autoFix=${autoFix}`);
    const report = await runGuardianCycle(autoFix);

    return NextResponse.json({
      success: true,
      cycleNumber: report.cycleNumber,
      overallScore: report.overallScore,
      overallStatus: report.overallStatus,
      fixesApplied: report.fixesApplied.map(f => ({
        action: f.action,
        locale: f.locale,
        success: f.success,
        affectedCount: f.affectedCount,
        message: f.message,
        level: f.level,
      })),
      rootCausesFound: report.rootCausesFound.map(rc => ({
        id: rc.id,
        category: rc.category,
        severity: rc.severity,
        pattern: rc.pattern,
        affectedCount: rc.affectedCount,
        remediationLevel: rc.remediationLevel,
      })),
      durationMs: report.durationMs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
