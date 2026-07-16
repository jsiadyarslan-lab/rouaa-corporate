// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════

// ─── Portfolio Trades API (V150) ────────────────────────────
// Trade history for portfolio holdings.
// GET:  List trade history for a holding or user
// POST: Record a new trade (buy/sell)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── GET: List trade history ────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const holdingId = searchParams.get('holdingId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const symbol = searchParams.get('symbol') || undefined;
    const tradeType = searchParams.get('tradeType') || undefined; // buy | sell

    // Pagination
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // At least one filter is required for meaningful results
    const where: any = {};
    if (holdingId) where.holdingId = holdingId;
    if (userId) where.userId = userId;
    if (symbol) where.symbol = symbol;
    if (tradeType) where.tradeType = tradeType;

    const [trades, total] = await Promise.all([
      (db as any).portfolioTrade.findMany({
        where,
        orderBy: { tradeDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      (db as any).portfolioTrade.count({ where }),
    ]);

    // Calculate trade summary stats
    const buyTrades = trades.filter(t => t.tradeType === 'buy');
    const sellTrades = trades.filter(t => t.tradeType === 'sell');
    const totalBought = buyTrades.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalSold = sellTrades.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalFees = trades.reduce((sum, t) => sum + t.fees, 0);

    return NextResponse.json({
      trades,
      total,
      limit,
      offset,
      hasMore: offset + trades.length < total,
      summary: {
        totalBuyTrades: buyTrades.length,
        totalSellTrades: sellTrades.length,
        totalBought: Math.round(totalBought * 100) / 100,
        totalSold: Math.round(totalSold * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        netCashflow: Math.round((totalSold - totalBought - totalFees) * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error('[Portfolio:Trades:GET] Error:', error?.message);
    return NextResponse.json(
      { error: 'فشل في جلب سجل الصفقات', detail: error?.message },
      { status: 500 }
    );
  }
}

// ─── POST: Record a new trade ───────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.holdingId || !body.symbol || !body.tradeType || body.quantity === undefined || body.price === undefined) {
      return NextResponse.json(
        { error: 'الحقول المطلوبة: holdingId, symbol, tradeType, quantity, price' },
        { status: 400 }
      );
    }

    const validTradeTypes = ['buy', 'sell'];
    if (!validTradeTypes.includes(body.tradeType)) {
      return NextResponse.json(
        { error: `نوع الصفقة غير صالح. القيم المقبولة: ${validTradeTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const quantity = parseFloat(body.quantity);
    const price = parseFloat(body.price);

    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: 'يجب أن يكون الكمية رقماً أكبر من صفر' },
        { status: 400 }
      );
    }
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: 'يجب أن يكون السعر رقماً أكبر من صفر' },
        { status: 400 }
      );
    }

    // Verify holding exists
    const holding = await (db as any).portfolioHolding.findUnique({
      where: { id: body.holdingId },
    });

    if (!holding) {
      return NextResponse.json(
        { error: 'لم يتم العثور على الاستثمار المرتبط' },
        { status: 404 }
      );
    }

    // For sell trades, verify quantity doesn't exceed holding
    if (body.tradeType === 'sell' && quantity > holding.quantity) {
      return NextResponse.json(
        { error: `لا يمكن بيع ${quantity} — الكمية المتاحة: ${holding.quantity}` },
        { status: 400 }
      );
    }

    const totalAmount = quantity * price;
    const fees = body.fees ? parseFloat(body.fees) : 0;
    const tradeDate = body.tradeDate ? new Date(body.tradeDate) : new Date();

    // Create the trade record
    const trade = await (db as any).portfolioTrade.create({
      data: {
        holdingId: body.holdingId,
        userId: body.userId ?? holding.userId ?? null,
        symbol: body.symbol,
        tradeType: body.tradeType,
        quantity,
        price,
        totalAmount,
        fees,
        notes: body.notes ?? null,
        tradeDate,
      },
    });

    // Update the holding based on trade type
    if (body.tradeType === 'buy') {
      const newQuantity = holding.quantity + quantity;
      const newCostBasis = holding.costBasis + totalAmount + fees;
      const newAvgBuyPrice = newCostBasis / newQuantity;
      const newMarketValue = newQuantity * holding.currentPrice;
      const newUnrealizedPL = newMarketValue - newCostBasis;
      const newUnrealizedPLPct = newCostBasis > 0 ? (newUnrealizedPL / newCostBasis) * 100 : 0;

      await (db as any).portfolioHolding.update({
        where: { id: holding.id },
        data: {
          quantity: newQuantity,
          avgBuyPrice: newAvgBuyPrice,
          costBasis: newCostBasis,
          marketValue: newMarketValue,
          unrealizedPL: newUnrealizedPL,
          unrealizedPLPct: newUnrealizedPLPct,
          lastTradeDate: tradeDate,
          firstBuyDate: holding.firstBuyDate ?? tradeDate,
        },
      });
    } else {
      // Sell trade
      const newQuantity = holding.quantity - quantity;
      const costPerUnit = holding.costBasis / holding.quantity;
      const newCostBasis = costPerUnit * newQuantity;
      const isFullSell = newQuantity <= 0;

      if (isFullSell) {
        await (db as any).portfolioHolding.update({
          where: { id: holding.id },
          data: {
            quantity: 0,
            isActive: false,
            currentPrice: price,
            marketValue: 0,
            unrealizedPL: (price * holding.quantity) - holding.costBasis,
            unrealizedPLPct: holding.costBasis > 0
              ? (((price * holding.quantity) - holding.costBasis) / holding.costBasis) * 100
              : 0,
            lastTradeDate: tradeDate,
          },
        });
      } else {
        const newMarketValue = newQuantity * price;
        const newUnrealizedPL = newMarketValue - newCostBasis;
        const newUnrealizedPLPct = newCostBasis > 0
          ? (newUnrealizedPL / newCostBasis) * 100
          : 0;

        await (db as any).portfolioHolding.update({
          where: { id: holding.id },
          data: {
            quantity: newQuantity,
            costBasis: newCostBasis,
            currentPrice: price,
            marketValue: newMarketValue,
            unrealizedPL: newUnrealizedPL,
            unrealizedPLPct: newUnrealizedPLPct,
            lastTradeDate: tradeDate,
          },
        });
      }
    }

    console.log(`[Portfolio:Trades:POST] Recorded: ${body.tradeType} ${quantity} ${body.symbol} @ ${price}`);

    return NextResponse.json({ trade }, { status: 201 });
  } catch (error: any) {
    console.error('[Portfolio:Trades:POST] Error:', error?.message);
    return NextResponse.json(
      { error: 'فشل في تسجيل الصفقة', detail: error?.message },
      { status: 500 }
    );
  }
}
