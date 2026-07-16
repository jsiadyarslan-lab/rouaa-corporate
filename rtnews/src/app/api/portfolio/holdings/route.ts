// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════

// ─── Portfolio Holdings API (V150) ──────────────────────────
// CRUD operations for portfolio holdings.
// GET:   List all active holdings
// POST:  Add a new holding (buy)
// PUT:   Update a holding (price refresh)
// DELETE: Close a holding (sell)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── GET: List all active holdings ──────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || null;
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const category = searchParams.get('category') || undefined;
    const symbol = searchParams.get('symbol') || undefined;

    const where: any = {};
    if (!includeInactive) where.isActive = true;
    if (userId) where.userId = userId;
    if (category) where.category = category;
    if (symbol) where.symbol = symbol;

    const holdings = await (db as any).portfolioHolding.findMany({
      where,
      orderBy: { marketValue: 'desc' },
    });

    return NextResponse.json({
      holdings,
      total: holdings.length,
      activeCount: holdings.filter(h => h.isActive).length,
    });
  } catch (error: any) {
    console.error('[Portfolio:Holdings:GET] Error:', error?.message);
    return NextResponse.json(
      { error: 'فشل في جلب محفظة الاستثمار', detail: error?.message },
      { status: 500 }
    );
  }
}

// ─── POST: Add a new holding (buy) ─────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.symbol || !body.name || body.quantity === undefined || body.price === undefined) {
      return NextResponse.json(
        { error: 'الحقول المطلوبة: symbol, name, quantity, price' },
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

    const totalAmount = quantity * price;
    const fees = body.fees ? parseFloat(body.fees) : 0;

    // Check if holding already exists for this symbol + userId
    const existingWhere: any = { symbol: body.symbol, isActive: true };
    if (body.userId) existingWhere.userId = body.userId;
    else existingWhere.userId = null;

    const existing = await (db as any).portfolioHolding.findFirst({ where: existingWhere });

    let holding;

    if (existing) {
      // ─── Add to existing position (DCA) ────────────────
      const newQuantity = existing.quantity + quantity;
      const newCostBasis = existing.costBasis + totalAmount + fees;
      const newAvgBuyPrice = newCostBasis / newQuantity;
      const newMarketValue = newQuantity * existing.currentPrice;
      const newUnrealizedPL = newMarketValue - newCostBasis;
      const newUnrealizedPLPct = newCostBasis > 0 ? (newUnrealizedPL / newCostBasis) * 100 : 0;

      holding = await (db as any).portfolioHolding.update({
        where: { id: existing.id },
        data: {
          quantity: newQuantity,
          avgBuyPrice: newAvgBuyPrice,
          costBasis: newCostBasis,
          marketValue: newMarketValue,
          unrealizedPL: newUnrealizedPL,
          unrealizedPLPct: newUnrealizedPLPct,
          lastTradeDate: new Date(),
        },
      });

      console.log(`[Portfolio:Holdings:POST] Added to existing: ${body.symbol} +${quantity} @ ${price} (new avg: ${newAvgBuyPrice.toFixed(2)})`);
    } else {
      // ─── Create new holding ─────────────────────────────
      const marketValue = totalAmount;
      const costBasis = totalAmount + fees;

      holding = await (db as any).portfolioHolding.create({
        data: {
          userId: body.userId ?? null,
          symbol: body.symbol,
          name: body.name,
          nameAr: body.nameAr ?? null,
          category: body.category ?? 'crypto',
          quantity,
          avgBuyPrice: price,
          currentPrice: price,
          costBasis,
          marketValue,
          unrealizedPL: marketValue - costBasis,
          unrealizedPLPct: costBasis > 0 ? ((marketValue - costBasis) / costBasis) * 100 : 0,
          allocation: 0,
          firstBuyDate: new Date(),
          lastTradeDate: new Date(),
          notes: body.notes ?? null,
          isActive: true,
        },
      });

      console.log(`[Portfolio:Holdings:POST] New holding: ${body.symbol} ${quantity} @ ${price}`);
    }

    // Record the trade
    await (db as any).portfolioTrade.create({
      data: {
        holdingId: holding.id,
        userId: body.userId ?? null,
        symbol: body.symbol,
        tradeType: 'buy',
        quantity,
        price,
        totalAmount,
        fees,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json({ holding }, { status: existing ? 200 : 201 });
  } catch (error: any) {
    console.error('[Portfolio:Holdings:POST] Error:', error?.message);
    return NextResponse.json(
      { error: 'فشل في إضافة الاستثمار', detail: error?.message },
      { status: 500 }
    );
  }
}

// ─── PUT: Update a holding (price refresh) ─────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id && !body.symbol) {
      return NextResponse.json(
        { error: 'يجب تحديد id أو symbol لتحديث الاستثمار' },
        { status: 400 }
      );
    }

    // Find the holding
    let holding;
    if (body.id) {
      holding = await (db as any).portfolioHolding.findUnique({ where: { id: body.id } });
    } else {
      const findWhere: any = { symbol: body.symbol, isActive: true };
      if (body.userId) findWhere.userId = body.userId;
      holding = await (db as any).portfolioHolding.findFirst({ where: findWhere });
    }

    if (!holding) {
      return NextResponse.json(
        { error: 'لم يتم العثور على الاستثمار' },
        { status: 404 }
      );
    }

    // Update price and recalculate derived fields
    const currentPrice = body.currentPrice !== undefined
      ? parseFloat(body.currentPrice)
      : holding.currentPrice;

    if (isNaN(currentPrice)) {
      return NextResponse.json(
        { error: 'يجب أن يكون السعر الحالي رقماً صالحاً' },
        { status: 400 }
      );
    }

    const marketValue = holding.quantity * currentPrice;
    const unrealizedPL = marketValue - holding.costBasis;
    const unrealizedPLPct = holding.costBasis > 0
      ? (unrealizedPL / holding.costBasis) * 100
      : 0;

    const updatedHolding = await (db as any).portfolioHolding.update({
      where: { id: holding.id },
      data: {
        currentPrice,
        marketValue,
        unrealizedPL,
        unrealizedPLPct,
        name: body.name ?? holding.name,
        nameAr: body.nameAr ?? holding.nameAr,
        notes: body.notes ?? holding.notes,
        updatedAt: new Date(),
      },
    });

    console.log(`[Portfolio:Holdings:PUT] Updated: ${holding.symbol} price=${currentPrice} value=${marketValue.toFixed(2)}`);

    return NextResponse.json({ holding: updatedHolding });
  } catch (error: any) {
    console.error('[Portfolio:Holdings:PUT] Error:', error?.message);
    return NextResponse.json(
      { error: 'فشل في تحديث الاستثمار', detail: error?.message },
      { status: 500 }
    );
  }
}

// ─── DELETE: Close a holding (sell) ────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const symbol = searchParams.get('symbol');
    const userId = searchParams.get('userId') || null;
    const sellPrice = searchParams.get('sellPrice')
      ? parseFloat(searchParams.get('sellPrice')!)
      : null;
    const sellQuantity = searchParams.get('sellQuantity')
      ? parseFloat(searchParams.get('sellQuantity')!)
      : null;

    if (!id && !symbol) {
      return NextResponse.json(
        { error: 'يجب تحديد id أو symbol لبيع الاستثمار' },
        { status: 400 }
      );
    }

    // Find the holding
    let holding;
    if (id) {
      holding = await (db as any).portfolioHolding.findUnique({ where: { id } });
    } else {
      const findWhere: any = { symbol: symbol!, isActive: true };
      if (userId) findWhere.userId = userId;
      holding = await (db as any).portfolioHolding.findFirst({ where: findWhere });
    }

    if (!holding) {
      return NextResponse.json(
        { error: 'لم يتم العثور على الاستثمار' },
        { status: 404 }
      );
    }

    if (!holding.isActive) {
      return NextResponse.json(
        { error: 'الاستثمار مغلق بالفعل' },
        { status: 400 }
      );
    }

    const effectiveSellPrice = sellPrice ?? holding.currentPrice;
    const effectiveSellQuantity = sellQuantity ?? holding.quantity;

    if (effectiveSellQuantity > holding.quantity) {
      return NextResponse.json(
        { error: `لا يمكن بيع ${effectiveSellQuantity} — الكمية المتاحة: ${holding.quantity}` },
        { status: 400 }
      );
    }

    const isFullSell = effectiveSellQuantity >= holding.quantity;
    const totalAmount = effectiveSellQuantity * effectiveSellPrice;

    if (isFullSell) {
      // ─── Close the entire position ──────────────────────
      const closedHolding = await (db as any).portfolioHolding.update({
        where: { id: holding.id },
        data: {
          isActive: false,
          currentPrice: effectiveSellPrice,
          marketValue: 0,
          unrealizedPL: (effectiveSellPrice * holding.quantity) - holding.costBasis,
          unrealizedPLPct: holding.costBasis > 0
            ? (((effectiveSellPrice * holding.quantity) - holding.costBasis) / holding.costBasis) * 100
            : 0,
          lastTradeDate: new Date(),
        },
      });

      // Record the sell trade
      await (db as any).portfolioTrade.create({
        data: {
          holdingId: holding.id,
          userId: holding.userId,
          symbol: holding.symbol,
          tradeType: 'sell',
          quantity: effectiveSellQuantity,
          price: effectiveSellPrice,
          totalAmount,
          fees: 0,
          notes: 'إغلاق المركز بالكامل',
        },
      });

      console.log(`[Portfolio:Holdings:DELETE] Closed: ${holding.symbol} ${effectiveSellQuantity} @ ${effectiveSellPrice}`);

      return NextResponse.json({
        holding: closedHolding,
        action: 'closed',
        totalAmount: Math.round(totalAmount * 100) / 100,
      });
    } else {
      // ─── Partial sell ───────────────────────────────────
      const newQuantity = holding.quantity - effectiveSellQuantity;
      const costPerUnit = holding.costBasis / holding.quantity;
      const newCostBasis = costPerUnit * newQuantity;
      const newMarketValue = newQuantity * effectiveSellPrice;
      const newUnrealizedPL = newMarketValue - newCostBasis;
      const newUnrealizedPLPct = newCostBasis > 0
        ? (newUnrealizedPL / newCostBasis) * 100
        : 0;

      const updatedHolding = await (db as any).portfolioHolding.update({
        where: { id: holding.id },
        data: {
          quantity: newQuantity,
          costBasis: newCostBasis,
          avgBuyPrice: costPerUnit,
          currentPrice: effectiveSellPrice,
          marketValue: newMarketValue,
          unrealizedPL: newUnrealizedPL,
          unrealizedPLPct: newUnrealizedPLPct,
          lastTradeDate: new Date(),
        },
      });

      // Record the sell trade
      await (db as any).portfolioTrade.create({
        data: {
          holdingId: holding.id,
          userId: holding.userId,
          symbol: holding.symbol,
          tradeType: 'sell',
          quantity: effectiveSellQuantity,
          price: effectiveSellPrice,
          totalAmount,
          fees: 0,
          notes: 'بيع جزئي',
        },
      });

      console.log(`[Portfolio:Holdings:DELETE] Partial sell: ${holding.symbol} ${effectiveSellQuantity} @ ${effectiveSellPrice} (remaining: ${newQuantity})`);

      return NextResponse.json({
        holding: updatedHolding,
        action: 'partial_sell',
        totalAmount: Math.round(totalAmount * 100) / 100,
        remainingQuantity: newQuantity,
      });
    }
  } catch (error: any) {
    console.error('[Portfolio:Holdings:DELETE] Error:', error?.message);
    return NextResponse.json(
      { error: 'فشل في بيع الاستثمار', detail: error?.message },
      { status: 500 }
    );
  }
}
