// ─── Smart Alerts API ────────────────────────────────────────
// Create, list, update, delete smart alerts for users
// Supports: price alerts, sentiment alerts, breaking news, keyword alerts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizePromptInput } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

// GET: List user's smart alerts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const alertType = searchParams.get('type');
    const activeOnly = searchParams.get('active') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    const where: any = { userId };
    if (alertType) where.alertType = alertType;
    if (activeOnly) where.isActive = true;

    const alerts = await db.smartAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ alerts });
  } catch (error: any) {
    console.error('[SmartAlerts] GET error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a smart alert
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, alertType, symbol, condition, threshold, keywords } = body;

    if (!userId || !alertType) {
      return NextResponse.json({ error: 'بيانات غير كاملة' }, { status: 400 });
    }

    const validTypes = ['price', 'sentiment', 'breaking', 'volume', 'custom'];
    if (!validTypes.includes(alertType)) {
      return NextResponse.json({ error: 'نوع تنبيه غير صالح' }, { status: 400 });
    }

    // Limit alerts per user
    const existingCount = await db.smartAlert.count({
      where: { userId, isActive: true },
    });
    if (existingCount >= 20) {
      return NextResponse.json({ error: 'وصلت للحد الأقصى من التنبيهات (20)' }, { status: 400 });
    }

    const alertData: any = {
      userId,
      alertType,
      condition: condition || 'above',
      isActive: true,
    };

    if (symbol) alertData.symbol = sanitizePromptInput(symbol).toUpperCase();
    if (threshold !== undefined) alertData.threshold = parseFloat(threshold);
    if (keywords) {
      const parsed = Array.isArray(keywords) ? keywords : [keywords];
      alertData.keywords = JSON.stringify(parsed.map((k: string) => sanitizePromptInput(k)).filter(Boolean));
    }

    const alert = await db.smartAlert.create({ data: alertData });

    return NextResponse.json({ success: true, alert });
  } catch (error: any) {
    console.error('[SmartAlerts] POST error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update alert (toggle active, mark triggered)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isActive, isTriggered } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف التنبيه مطلوب' }, { status: 400 });
    }

    const data: any = {};
    if (isActive !== undefined) data.isActive = isActive;
    if (isTriggered !== undefined) {
      data.isTriggered = isTriggered;
      if (isTriggered) data.lastTriggeredAt = new Date();
    }

    const alert = await db.smartAlert.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, alert });
  } catch (error: any) {
    console.error('[SmartAlerts] PATCH error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove alert
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف التنبيه مطلوب' }, { status: 400 });
    }

    await db.smartAlert.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[SmartAlerts] DELETE error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
