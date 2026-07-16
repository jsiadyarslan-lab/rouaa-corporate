// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Fix API Route
// ═══════════════════════════════════════════════════════════════
// POST /api/guardian/fix — Execute a specific fix manually
// Body: { fixId, locale, rootCausePattern? }
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import {
  executeManualFix,
  getAllFixes,
  getFixById,
  collectSnapshot,
  getLastReport,
} from '@/lib/pipeline/guardian';
import type { Locale, RootCause } from '@/lib/pipeline/guardian';

export async function GET(request: NextRequest) {
  // List available fixes
  const fixes = getAllFixes().map(f => ({
    id: f.id,
    name: f.name,
    nameAr: f.nameAr,
    level: f.level,
    description: f.description,
    descriptionAr: f.descriptionAr,
    requiresApproval: f.requiresApproval,
    cooldownMs: f.cooldownMs,
  }));

  return NextResponse.json({ success: true, fixes });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fixId, locale, rootCausePattern } = body as {
      fixId: string;
      locale: Locale;
      rootCausePattern?: string;
    };

    if (!fixId || !locale) {
      return NextResponse.json(
        { success: false, error: 'fixId and locale are required' },
        { status: 400 }
      );
    }

    const fix = getFixById(fixId);
    if (!fix) {
      return NextResponse.json(
        { success: false, error: `Fix '${fixId}' not found` },
        { status: 404 }
      );
    }

    // Create a synthetic root cause if not provided
    const rootCause: RootCause = {
      id: `manual_${locale}_${fixId}_${Date.now()}`,
      category: 'pattern',
      severity: 'critical',
      message: `Manual fix request: ${fix.name} for ${locale}`,
      affectedCount: 0,
      affectedStage: 'fetched',
      pattern: rootCausePattern || fixId,
      evidence: ['Manual trigger via API'],
      remediationLevel: fix.level as any,
      autoFixable: true,
    };

    // Get snapshot for context
    const snapshot = await collectSnapshot(locale);

    const result = await executeManualFix(fixId, locale, rootCause, snapshot);

    if (result) {
      return NextResponse.json({
        success: result.success,
        action: result.action,
        locale: result.locale,
        affectedCount: result.affectedCount,
        message: result.message,
        messageAr: result.messageAr,
        level: result.level,
        durationMs: result.durationMs,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Fix execution returned null — may be on cooldown' },
        { status: 409 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
