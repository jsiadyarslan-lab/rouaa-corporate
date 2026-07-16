// ─── Turkish Trading Signals API Route ───────────────────────
// GET /api/tr/signals — List trading signals
// Signals are language-agnostic but can be filtered

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const pair = searchParams.get('pair') || undefined;
    const category = searchParams.get('category') || undefined;
    const action = searchParams.get('action') || undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      return NextResponse.json({ signals: [], total: 0, limit, offset, hasMore: false });
    }

    // Auto-expire old signals
    try {
      await db.tradingSignal.updateMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { not: null, lte: new Date() },
        },
        data: { status: 'EXPIRED', updatedAt: new Date() },
      });
    } catch {}

    const where: any = {};
    if (status) where.status = status;
    if (pair) where.pair = pair;
    if (category) where.category = category;
    if (action) where.action = action;

    const [signals, total] = await Promise.all([
      db.tradingSignal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.tradingSignal.count({ where }),
    ]);

    return NextResponse.json({
      signals,
      total,
      limit,
      offset,
      hasMore: offset + signals.length < total,
    });
  } catch (error: any) {
    console.error('[TR Signals API] Hata:', error.message);
    return NextResponse.json(
      { error: 'İşlem sinyalleri yüklenemedi', detail: error.message },
      { status: 500 }
    );
  }
}
