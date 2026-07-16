// ─── Alerts API V62 ──────────────────────────────────────────
// Combined: User price alerts + Market-wide smart alerts
// GET /api/alerts — Get current market alerts + user alerts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkMarketAlerts, type MarketAlert } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

// GET /api/alerts — Get active market alerts + user alerts
// Query params: userId (for user alerts), type (market|user|all), severity
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'all';
    const severity = searchParams.get('severity');

    const result: {
      marketAlerts?: MarketAlert[];
      userAlerts?: any[];
      summary?: { total: number; critical: number; warning: number; info: number };
    } = {};

    // Fetch market alerts if requested
    if (type === 'all' || type === 'market') {
      const marketAlerts = await checkMarketAlerts();

      // Filter by severity if specified
      const filteredAlerts = severity
        ? marketAlerts.filter(a => a.severity === severity)
        : marketAlerts;

      result.marketAlerts = filteredAlerts;
    }

    // Fetch user alerts if userId provided
    if (userId && (type === 'all' || type === 'user')) {
      const userAlerts = await db.priceAlert.findMany({
        where: { userId, isTriggered: false },
        orderBy: { createdAt: 'desc' },
      });
      result.userAlerts = userAlerts;
    }

    // Build summary
    if (result.marketAlerts) {
      result.summary = {
        total: result.marketAlerts.length,
        critical: result.marketAlerts.filter(a => a.severity === 'critical').length,
        warning: result.marketAlerts.filter(a => a.severity === 'warning').length,
        info: result.marketAlerts.filter(a => a.severity === 'info').length,
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Alerts API] GET error:', error.message);
    return NextResponse.json({ error: 'فشل في تحميل التنبيهات' }, { status: 500 });
  }
}

// POST: Create user price alert
export async function POST(request: Request) {
  try {
    const { userId, symbol, targetPrice, direction } = await request.json();
    if (!userId || !symbol || !targetPrice) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }
    const alert = await db.priceAlert.create({
      data: { userId, symbol, targetPrice: parseFloat(targetPrice), direction: direction || 'above' },
    });
    return NextResponse.json({ success: true, alert });
  } catch (error: any) {
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
    await db.priceAlert.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
