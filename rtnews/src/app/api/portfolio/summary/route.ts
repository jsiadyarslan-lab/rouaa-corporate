// ─── Portfolio Summary API ──────────────────────────────────
// Returns signal performance data from the tradingSignal table.
// This is a signal performance tracker, NOT a real trading portfolio.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Query all trading signals from DB
    const signals = await db.tradingSignal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const activeSignals = signals.filter(s => s.status === 'ACTIVE');
    const hitTpSignals = signals.filter(s => s.status === 'HIT_TP');
    const hitSlSignals = signals.filter(s => s.status === 'HIT_SL');
    const totalResolved = hitTpSignals.length + hitSlSignals.length;
    const winRate = totalResolved > 0
      ? Math.round((hitTpSignals.length / totalResolved) * 10000) / 100
      : 0;

    const avgConfidence = activeSignals.length > 0
      ? Math.round(activeSignals.reduce((sum, s) => sum + s.confidence, 0) / activeSignals.length)
      : 0;

    // Category breakdown
    const categoryBreakdown: Record<string, { total: number; wins: number; winRate: number }> = {};
    signals.forEach(s => {
      const cat = s.category || 'forex';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { total: 0, wins: 0, winRate: 0 };
      }
      categoryBreakdown[cat].total++;
      if (s.status === 'HIT_TP') categoryBreakdown[cat].wins++;
    });

    // Calculate win rates for categories
    Object.values(categoryBreakdown).forEach(cat => {
      cat.winRate = cat.total > 0 ? Math.round((cat.wins / cat.total) * 10000) / 100 : 0;
    });

    // Holdings from active signals
    const holdings = activeSignals.map(s => ({
      pair: s.pair,
      action: s.action,
      entryPrice: s.entryPrice,
      stopLoss: s.stopLoss,
      takeProfit: s.takeProfit,
      confidence: s.confidence,
      category: s.category || 'forex',
      timeframe: s.timeframe,
    }));

    // Best performer (highest resultPercent among closed signals)
    const closedWithResult = signals.filter(s =>
      (s.status === 'HIT_TP' || s.status === 'HIT_SL') && s.resultPercent != null
    );
    const bestPerformer = closedWithResult.length > 0
      ? closedWithResult.reduce((best, s) =>
          (s.resultPercent ?? 0) > (best.resultPercent ?? 0) ? s : best
        )
      : null;
    const worstPerformer = closedWithResult.length > 0
      ? closedWithResult.reduce((worst, s) =>
          (s.resultPercent ?? 0) < (worst.resultPercent ?? 0) ? s : worst
        )
      : null;

    return NextResponse.json({
      portfolio: {
        totalValue: 0, // No real value — signal tracking only
        totalSignals: signals.length,
        activeSignals: activeSignals.length,
        winRate,
        avgConfidence,
        currency: 'USD',
        holdings,
        lastUpdate: new Date().toISOString(),
      },
      summary: {
        totalAssets: activeSignals.length,
        bestPerformer: bestPerformer
          ? { pair: bestPerformer.pair, result: `+${((bestPerformer.resultPercent ?? 0)).toFixed(1)}%` }
          : null,
        worstPerformer: worstPerformer && (worstPerformer.resultPercent ?? 0) < 0
          ? { pair: worstPerformer.pair, result: `${((worstPerformer.resultPercent ?? 0)).toFixed(1)}%` }
          : null,
        categoryBreakdown,
      },
    });
  } catch (error: any) {
    console.error('[Portfolio:Summary] Error:', error.message);
    return NextResponse.json({
      portfolio: {
        totalValue: 0,
        totalSignals: 0,
        activeSignals: 0,
        winRate: 0,
        avgConfidence: 0,
        currency: 'USD',
        holdings: [],
        lastUpdate: new Date().toISOString(),
      },
      summary: {
        totalAssets: 0,
        bestPerformer: null,
        worstPerformer: null,
        categoryBreakdown: {},
      },
      error: error.message,
    }, { status: 500 });
  }
}
