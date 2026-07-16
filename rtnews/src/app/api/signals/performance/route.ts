// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════

// ─── Signal Performance API (V150) ─────────────────────────
// Calculates comprehensive signal performance statistics from
// the TradingSignal table. Includes win rate, avg profit,
// breakdowns by category/source/pair, and streaks.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── Types ──────────────────────────────────────────────────

interface PerformanceStats {
  totalSignals: number;
  activeSignals: number;
  closedSignals: number;
  wonSignals: number;
  lostSignals: number;
  expiredSignals: number;
  cancelledSignals: number;
  winRate: number;
  avgProfitPips: number;
  avgProfitPercent: number;
  totalProfitPips: number;
  totalProfitPercent: number;
  bestSignal: {
    pair: string;
    action: string;
    profitPercent: number;
    closedAt: string | null;
  } | null;
  worstSignal: {
    pair: string;
    action: string;
    profitPercent: number;
    closedAt: string | null;
  } | null;
  byCategory: Record<string, { total: number; wins: number; losses: number; winRate: number; avgProfitPips: number; avgProfitPercent: number }>;
  bySource: Record<string, { total: number; wins: number; losses: number; winRate: number; avgProfitPips: number; avgProfitPercent: number }>;
  byPair: Record<string, { total: number; wins: number; losses: number; winRate: number; avgProfitPips: number; avgProfitPercent: number }>;
  byAction: Record<string, { total: number; wins: number; losses: number; winRate: number; avgProfitPips: number; avgProfitPercent: number }>;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
  longestWinStreak: number;
  longestLossStreak: number;
  confidenceCalibration: { highConfidenceWinRate: number; lowConfidenceWinRate: number };
  period: string;
  generatedAt: string;
}

// ─── GET: Calculate performance stats ───────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all | 7d | 30d | 90d
    const category = searchParams.get('category') || undefined;
    const source = searchParams.get('source') || undefined;

    // Calculate date filter based on period
    let dateFilter: Date | null = null;
    if (period === '7d') {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === '90d') {
      dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    }

    // Build where clause
    const where: any = {};
    if (dateFilter) where.createdAt = { gte: dateFilter };
    if (category) where.category = category;
    if (source) where.source = source;

    // Fetch all relevant signals
    const signals = await db.tradingSignal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // If no signals, return empty stats
    if (signals.length === 0) {
      return NextResponse.json({
        totalSignals: 0,
        activeSignals: 0,
        closedSignals: 0,
        wonSignals: 0,
        lostSignals: 0,
        expiredSignals: 0,
        cancelledSignals: 0,
        winRate: 0,
        avgProfitPips: 0,
        avgProfitPercent: 0,
        totalProfitPips: 0,
        totalProfitPercent: 0,
        bestSignal: null,
        worstSignal: null,
        byCategory: {},
        bySource: {},
        byPair: {},
        byAction: {},
        currentStreak: { type: 'none', count: 0 },
        longestWinStreak: 0,
        longestLossStreak: 0,
        confidenceCalibration: { highConfidenceWinRate: 0, lowConfidenceWinRate: 0 },
        period,
        generatedAt: new Date().toISOString(),
      });
    }

    // ─── Core Stats ────────────────────────────────────────
    const totalSignals = signals.length;
    const activeSignals = signals.filter(s => s.status === 'active').length;
    const closedSignals = signals.filter(s => ['hit_tp', 'hit_sl'].includes(s.status)).length;
    const wonSignals = signals.filter(s => s.isWin === true).length;
    const lostSignals = signals.filter(s => s.isWin === false).length;
    const expiredSignals = signals.filter(s => s.status === 'expired').length;
    const cancelledSignals = signals.filter(s => s.status === 'cancelled').length;

    const winRate = closedSignals > 0 ? (wonSignals / closedSignals) * 100 : 0;

    // ─── Profit Stats ──────────────────────────────────────
    const signalsWithPips = signals.filter(s => s.profitPips !== null && s.profitPips !== undefined);
    const signalsWithPercent = signals.filter(s => s.profitPercent !== null && s.profitPercent !== undefined);

    const avgProfitPips = signalsWithPips.length > 0
      ? signalsWithPips.reduce((sum, s) => sum + (s.profitPips ?? 0), 0) / signalsWithPips.length
      : 0;

    const avgProfitPercent = signalsWithPercent.length > 0
      ? signalsWithPercent.reduce((sum, s) => sum + (s.profitPercent ?? 0), 0) / signalsWithPercent.length
      : 0;

    const totalProfitPips = signalsWithPips.reduce((sum, s) => sum + (s.profitPips ?? 0), 0);
    const totalProfitPercent = signalsWithPercent.reduce((sum, s) => sum + (s.profitPercent ?? 0), 0);

    // ─── Best / Worst Signal ───────────────────────────────
    const closedWithPercent = signals.filter(
      s => s.isWin !== null && s.profitPercent !== null && s.profitPercent !== undefined
    );

    const bestSignal = closedWithPercent.length > 0
      ? closedWithPercent.reduce((best, s) =>
          (s.profitPercent ?? 0) > (best.profitPercent ?? 0) ? s : best
        )
      : null;

    const worstSignal = closedWithPercent.length > 0
      ? closedWithPercent.reduce((worst, s) =>
          (s.profitPercent ?? 0) < (worst.profitPercent ?? 0) ? s : worst
        )
      : null;

    // ─── Breakdown by Category ─────────────────────────────
    const categoryGroups: Record<string, typeof signals> = {};
    for (const s of signals) {
      if (!categoryGroups[s.category]) categoryGroups[s.category] = [];
      categoryGroups[s.category].push(s);
    }
    const byCategory: PerformanceStats['byCategory'] = {};
    for (const [cat, group] of Object.entries(categoryGroups)) {
      const catWon = group.filter(s => s.isWin === true).length;
      const catLost = group.filter(s => s.isWin === false).length;
      const catClosed = catWon + catLost;
      const catWithPips = group.filter(s => s.profitPips !== null && s.profitPips !== undefined);
      const catWithPercent = group.filter(s => s.profitPercent !== null && s.profitPercent !== undefined);
      byCategory[cat] = {
        total: group.length,
        wins: catWon,
        losses: catLost,
        winRate: catClosed > 0 ? (catWon / catClosed) * 100 : 0,
        avgProfitPips: catWithPips.length > 0
          ? catWithPips.reduce((sum, s) => sum + (s.profitPips ?? 0), 0) / catWithPips.length
          : 0,
        avgProfitPercent: catWithPercent.length > 0
          ? catWithPercent.reduce((sum, s) => sum + (s.profitPercent ?? 0), 0) / catWithPercent.length
          : 0,
      };
    }

    // ─── Breakdown by Source ───────────────────────────────
    const sourceGroups: Record<string, typeof signals> = {};
    for (const s of signals) {
      if (!sourceGroups[s.source]) sourceGroups[s.source] = [];
      sourceGroups[s.source].push(s);
    }
    const bySource: PerformanceStats['bySource'] = {};
    for (const [src, group] of Object.entries(sourceGroups)) {
      const srcWon = group.filter(s => s.isWin === true).length;
      const srcLost = group.filter(s => s.isWin === false).length;
      const srcClosed = srcWon + srcLost;
      const srcWithPips = group.filter(s => s.profitPips !== null && s.profitPips !== undefined);
      const srcWithPercent = group.filter(s => s.profitPercent !== null && s.profitPercent !== undefined);
      bySource[src] = {
        total: group.length,
        wins: srcWon,
        losses: srcLost,
        winRate: srcClosed > 0 ? (srcWon / srcClosed) * 100 : 0,
        avgProfitPips: srcWithPips.length > 0
          ? srcWithPips.reduce((sum, s) => sum + (s.profitPips ?? 0), 0) / srcWithPips.length
          : 0,
        avgProfitPercent: srcWithPercent.length > 0
          ? srcWithPercent.reduce((sum, s) => sum + (s.profitPercent ?? 0), 0) / srcWithPercent.length
          : 0,
      };
    }

    // ─── Breakdown by Pair ─────────────────────────────────
    const pairGroups: Record<string, typeof signals> = {};
    for (const s of signals) {
      if (!pairGroups[s.pair]) pairGroups[s.pair] = [];
      pairGroups[s.pair].push(s);
    }
    const byPair: PerformanceStats['byPair'] = {};
    for (const [pair, group] of Object.entries(pairGroups)) {
      const pairWon = group.filter(s => s.isWin === true).length;
      const pairLost = group.filter(s => s.isWin === false).length;
      const pairClosed = pairWon + pairLost;
      const pairWithPips = group.filter(s => s.profitPips !== null && s.profitPips !== undefined);
      const pairWithPercent = group.filter(s => s.profitPercent !== null && s.profitPercent !== undefined);
      byPair[pair] = {
        total: group.length,
        wins: pairWon,
        losses: pairLost,
        winRate: pairClosed > 0 ? (pairWon / pairClosed) * 100 : 0,
        avgProfitPips: pairWithPips.length > 0
          ? pairWithPips.reduce((sum, s) => sum + (s.profitPips ?? 0), 0) / pairWithPips.length
          : 0,
        avgProfitPercent: pairWithPercent.length > 0
          ? pairWithPercent.reduce((sum, s) => sum + (s.profitPercent ?? 0), 0) / pairWithPercent.length
          : 0,
      };
    }

    // ─── Breakdown by Action ───────────────────────────────
    const actionGroups: Record<string, typeof signals> = {};
    for (const s of signals) {
      if (!actionGroups[s.action]) actionGroups[s.action] = [];
      actionGroups[s.action].push(s);
    }
    const byAction: PerformanceStats['byAction'] = {};
    for (const [act, group] of Object.entries(actionGroups)) {
      const actWon = group.filter(s => s.isWin === true).length;
      const actLost = group.filter(s => s.isWin === false).length;
      const actClosed = actWon + actLost;
      const actWithPips = group.filter(s => s.profitPips !== null && s.profitPips !== undefined);
      const actWithPercent = group.filter(s => s.profitPercent !== null && s.profitPercent !== undefined);
      byAction[act] = {
        total: group.length,
        wins: actWon,
        losses: actLost,
        winRate: actClosed > 0 ? (actWon / actClosed) * 100 : 0,
        avgProfitPips: actWithPips.length > 0
          ? actWithPips.reduce((sum, s) => sum + (s.profitPips ?? 0), 0) / actWithPips.length
          : 0,
        avgProfitPercent: actWithPercent.length > 0
          ? actWithPercent.reduce((sum, s) => sum + (s.profitPercent ?? 0), 0) / actWithPercent.length
          : 0,
      };
    }

    // ─── Streaks ───────────────────────────────────────────
    // Only consider closed signals (isWin is not null) in chronological order
    const closedSignalsSorted = signals
      .filter(s => s.isWin !== null)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // newest first

    let currentStreak: { type: 'win' | 'loss' | 'none'; count: number } = { type: 'none', count: 0 };
    let longestWinStreak = 0;
    let longestLossStreak = 0;

    if (closedSignalsSorted.length > 0) {
      // Current streak (from most recent closed signal)
      const firstIsWin = closedSignalsSorted[0].isWin === true;
      currentStreak.type = firstIsWin ? 'win' : 'loss';
      currentStreak.count = 0;
      for (const s of closedSignalsSorted) {
        if (s.isWin === firstIsWin) {
          currentStreak.count++;
        } else {
          break;
        }
      }

      // Calculate longest streaks
      let tempWinStreak = 0;
      let tempLossStreak = 0;
      // Process in chronological order (oldest first)
      const chronological = [...closedSignalsSorted].reverse();
      for (const s of chronological) {
        if (s.isWin === true) {
          tempWinStreak++;
          tempLossStreak = 0;
          longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
        } else {
          tempLossStreak++;
          tempWinStreak = 0;
          longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
        }
      }
    }

    // ─── Confidence Calibration ────────────────────────────
    // How well does confidence predict wins?
    const highConfSignals = signals.filter(s => s.confidence >= 70 && s.isWin !== null);
    const lowConfSignals = signals.filter(s => s.confidence < 50 && s.isWin !== null);
    const highConfidenceWinRate = highConfSignals.length > 0
      ? (highConfSignals.filter(s => s.isWin === true).length / highConfSignals.length) * 100
      : 0;
    const lowConfidenceWinRate = lowConfSignals.length > 0
      ? (lowConfSignals.filter(s => s.isWin === true).length / lowConfSignals.length) * 100
      : 0;

    const stats: PerformanceStats = {
      totalSignals,
      activeSignals,
      closedSignals,
      wonSignals,
      lostSignals,
      expiredSignals,
      cancelledSignals,
      winRate: Math.round(winRate * 100) / 100,
      avgProfitPips: Math.round(avgProfitPips * 100) / 100,
      avgProfitPercent: Math.round(avgProfitPercent * 100) / 100,
      totalProfitPips: Math.round(totalProfitPips * 100) / 100,
      totalProfitPercent: Math.round(totalProfitPercent * 100) / 100,
      bestSignal: bestSignal
        ? {
            pair: bestSignal.pair,
            action: bestSignal.action,
            profitPercent: Math.round((bestSignal.profitPercent ?? 0) * 100) / 100,
            closedAt: bestSignal.closedAt?.toISOString() ?? null,
          }
        : null,
      worstSignal: worstSignal
        ? {
            pair: worstSignal.pair,
            action: worstSignal.action,
            profitPercent: Math.round((worstSignal.profitPercent ?? 0) * 100) / 100,
            closedAt: worstSignal.closedAt?.toISOString() ?? null,
          }
        : null,
      byCategory,
      bySource,
      byPair,
      byAction,
      currentStreak,
      longestWinStreak,
      longestLossStreak,
      confidenceCalibration: {
        highConfidenceWinRate: Math.round(highConfidenceWinRate * 100) / 100,
        lowConfidenceWinRate: Math.round(lowConfidenceWinRate * 100) / 100,
      },
      period,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('[Signals:Performance] Error:', error?.message);
    return NextResponse.json(
      { error: 'فشل في حساب أداء الإشارات', detail: error?.message },
      { status: 500 }
    );
  }
}
