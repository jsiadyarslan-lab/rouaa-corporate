// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — History API Route
// ═══════════════════════════════════════════════════════════════
// GET /api/guardian/history?limit=50 — Get fix history
// Returns recent remediation actions and their outcomes.
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getFixHistory, getFailurePatterns, getCommonFailures, getRemediationSuccessRate } from '@/lib/pipeline/guardian';
import type { Locale } from '@/lib/pipeline/guardian';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const locale = searchParams.get('locale') as Locale | null;

    const fixHistory = getFixHistory();
    const failurePatterns = locale ? getCommonFailures(locale) : getFailurePatterns();
    const successRate = locale ? getRemediationSuccessRate(locale) : 0;

    return NextResponse.json({
      success: true,
      fixHistory: fixHistory.slice(-limit).map(f => ({
        action: f.action,
        locale: f.locale,
        success: f.success,
        affectedCount: f.affectedCount,
        message: f.message,
        messageAr: f.messageAr,
        level: f.level,
        timestamp: f.timestamp,
        durationMs: f.durationMs,
        rollbackAvailable: f.rollbackAvailable,
      })),
      failurePatterns: failurePatterns.map(p => ({
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        locale: p.locale,
        frequency: p.frequency,
        successRate: Math.round(p.successRate * 100),
        successfulRemediation: p.successfulRemediation,
        lastSeen: p.lastSeen,
      })),
      successRate: Math.round(successRate * 100),
      totalFixes: fixHistory.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
