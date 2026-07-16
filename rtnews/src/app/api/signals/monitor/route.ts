// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════

// ─── Signal Monitor API V1 ──────────────────────────────────
// Endpoint: GET /api/signals/monitor
//
// Monitors active signals against live prices and auto-updates
// status when price hits Take Profit or Stop Loss.
//
// Auth: Requires INTERNAL_SECRET or CRON_SECRET (same as other crons)
// Called by: Railway cron every 5 minutes

import { NextRequest, NextResponse } from 'next/server';
import { verifyInternalOrCronAuth } from '@/lib/auth-utils';
import { monitorActiveSignals, forceCloseSignal } from '@/lib/signal-monitor';

export const dynamic = 'force-dynamic';

// GET: Run signal monitoring (called by cron)
export async function GET(request: NextRequest) {
  // Auth check — only internal/cron calls allowed
  if (!verifyInternalOrCronAuth(request)) {
    return NextResponse.json(
      { error: 'غير مصرح — يتطلب مصادقة داخلية' },
      { status: 401 }
    );
  }

  try {
    console.log('[Signals:Monitor] Starting signal monitoring...');
    const result = await monitorActiveSignals();

    return NextResponse.json({
      success: true,
      message: `تم فحص ${result.checked} إشارة: ${result.hitTP} حققت الربح ✅، ${result.hitSL} ضربت الوقف ❌، ${result.expired} منتهية ⏰`,
      result,
    });
  } catch (error: any) {
    console.error('[Signals:Monitor] Error:', error?.message);
    return NextResponse.json(
      { error: 'فشل في مراقبة الإشارات', detail: error?.message },
      { status: 500 }
    );
  }
}

// POST: Force close a specific signal (admin action)
export async function POST(request: NextRequest) {
  // Auth check
  if (!verifyInternalOrCronAuth(request)) {
    return NextResponse.json(
      { error: 'غير مصرح — يتطلب مصادقة داخلية' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    if (!body.signalId || !body.status) {
      return NextResponse.json(
        { error: 'الحقول المطلوبة: signalId, status' },
        { status: 400 }
      );
    }

    const validStatuses = ['HIT_TP', 'HIT_SL', 'EXECUTED', 'CANCELLED'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `قيمة status غير صالحة. القيم المقبولة: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await forceCloseSignal(body.signalId, body.status, body.closePrice);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `تم تحديث حالة الإشارة إلى ${body.status}`,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'فشل في تحديث الإشارة' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('[Signals:Monitor:POST] Error:', error?.message);
    return NextResponse.json(
      { error: 'فشل في تحديث الإشارة', detail: error?.message },
      { status: 500 }
    );
  }
}
