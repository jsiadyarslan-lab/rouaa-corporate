// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════

// ─── Signal Persistence API (V150) ──────────────────────────
// CRUD operations for trading signals stored in the database.
// Supports filtering, pagination, and auto-expiry of old signals.
// Signals come from local-fallback generator and trading platform.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── Helper: Auto-expire old signals ────────────────────────

/**
 * Marks active signals past their expiresAt as "expired".
 * Called on every GET request to keep signal statuses fresh.
 * Returns the number of signals that were expired.
 */
export async function autoExpireSignals(): Promise<number> {
  try {
    const result = await db.tradingSignal.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { not: null, lte: new Date() },
      },
      data: {
        status: 'EXPIRED',
        updatedAt: new Date(),
      },
    });
    return result.count;
  } catch (error: any) {
    console.error('[Signals:AutoExpire] Error:', error?.message);
    return 0;
  }
}

// ─── GET: List signals with filters ─────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Filters
    const status = searchParams.get('status') || undefined;
    const pair = searchParams.get('pair') || undefined;
    const source = searchParams.get('source') || undefined;
    const category = searchParams.get('category') || undefined;
    const action = searchParams.get('action') || undefined;

    // Pagination
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Auto-expire old signals before listing
    const expiredCount = await autoExpireSignals();
    if (expiredCount > 0) {
      console.log(`[Signals] Auto-expired ${expiredCount} old signals`);
    }

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (pair) where.pair = pair;
    if (source) where.source = source;
    if (category) where.category = category;
    if (action) where.action = action;

    // Fetch signals
    const [signals, total] = await Promise.all([
      db.tradingSignal.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
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
      autoExpired: expiredCount,
    });
  } catch (error: any) {
    console.error('[Signals:GET] Error:', error?.message);
    return NextResponse.json(
      { error: 'فشل في جلب بيانات الإشارات', detail: error?.message },
      { status: 500 }
    );
  }
}

// ─── POST: Save a new signal ────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.pair || !body.action) {
      return NextResponse.json(
        { error: 'الحقول المطلوبة: pair, action' },
        { status: 400 }
      );
    }

    const validActions = ['BUY', 'SELL', 'WAIT'];
    if (!validActions.includes(body.action)) {
      return NextResponse.json(
        { error: `قيمة action غير صالحة. القيم المقبولة: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const validStatuses = ['ACTIVE', 'HIT_TP', 'HIT_SL', 'EXPIRED', 'CANCELLED', 'EXECUTED'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `قيمة status غير صالحة. القيم المقبولة: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Create the signal
    const signal = await db.tradingSignal.create({
      data: {
        pair: body.pair,
        action: body.action,
        confidence: body.confidence ?? 50,
        reason: body.reason ?? '',
        entryPrice: body.entryPrice ?? null,
        stopLoss: body.stopLoss ?? null,
        takeProfit: body.takeProfit ?? null,
        status: body.status ?? 'ACTIVE',
        source: body.source ?? 'local-fallback',
        category: body.category ?? 'crypto',
        timeframe: body.timeframe ?? 'H4',
        rsiAtSignal: body.rsiAtSignal ?? null,
        sma20AtSignal: body.sma20AtSignal ?? null,
        sma50AtSignal: body.sma50AtSignal ?? null,
        councilVotes: body.councilVotes ?? '{}',
        councilModels: body.councilModels ?? '[]',
        relatedNewsIds: body.relatedNewsIds ?? '[]',
        notes: body.notes ?? null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        // Outcome fields (only for signals being saved with a known outcome)
        closedAt: body.closedAt ? new Date(body.closedAt) : null,
        closePrice: body.closePrice ?? null,
        profitPips: body.profitPips ?? null,
        profitPercent: body.profitPercent ?? null,
        isWin: body.isWin ?? null,
      },
    });

    console.log(`[Signals:POST] Created signal: ${signal.pair} ${signal.action} (${signal.id})`);

    return NextResponse.json({ signal }, { status: 201 });
  } catch (error: any) {
    console.error('[Signals:POST] Error:', error?.message);
    return NextResponse.json(
      { error: 'فشل في حفظ الإشارة', detail: error?.message },
      { status: 500 }
    );
  }
}
