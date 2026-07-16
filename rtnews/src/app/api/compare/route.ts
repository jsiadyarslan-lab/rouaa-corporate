// ─── Asset Comparison API ────────────────────────────────────
// GET /api/compare?symbols=SPX,NDX,XAU
// Returns comparison data for the requested symbols

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols') || '';
    const symbols = symbolsParam.split(',').filter(Boolean).slice(0, 5);

    if (symbols.length === 0) {
      return NextResponse.json({ error: 'يرجى تحديد رمز واحد على الأقل' }, { status: 400 });
    }

    // Fetch indicators for requested symbols
    const indicators = await db.marketIndicator.findMany({
      where: { symbol: { in: symbols } },
    });

    // Also get all available indicators for the search dropdown
    const allIndicators = await db.marketIndicator.findMany({
      select: { id: true, name: true, nameAr: true, symbol: true, category: true, region: true },
      orderBy: [{ category: 'asc' }, { symbol: 'asc' }],
    });

    const comparisonData = indicators.map((ind) => {
      const history: { date: string; value: number }[] = JSON.parse(ind.history || '[]');

      // Calculate key stats from history
      const values = history.map((h) => h.value);
      const high30d = values.length > 0 ? Math.max(...values) : ind.value;
      const low30d = values.length > 0 ? Math.min(...values) : ind.value;
      const avg30d = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : ind.value;
      const volatility = values.length > 1
        ? Math.sqrt(values.reduce((sum, v, i) => {
            if (i === 0) return 0;
            const prev = values[i - 1];
            const ret = prev !== 0 ? (v - prev) / prev : 0;
            return sum + ret * ret;
          }, 0) / (values.length - 1)) * 100
        : 0;

      // Normalize history for overlaid chart (percentage change from first point)
      const normalizedHistory = history.length > 0
        ? history.map((h) => ({
            date: h.date,
            value: h.value,
            pctChange: history[0].value !== 0 ? ((h.value - history[0].value) / history[0].value) * 100 : 0,
          }))
        : [];

      return {
        id: ind.id,
        name: ind.name,
        nameAr: ind.nameAr || ind.name,
        symbol: ind.symbol,
        category: ind.category,
        region: ind.region,
        currentData: {
          value: ind.value,
          change: ind.change,
          changePercent: ind.changePercent,
          lastUpdated: ind.lastUpdated.toISOString(),
        },
        history30d: normalizedHistory,
        keyStats: {
          high30d: Math.round(high30d * 100) / 100,
          low30d: Math.round(low30d * 100) / 100,
          avg30d: Math.round(avg30d * 100) / 100,
          volatility: Math.round(volatility * 100) / 100,
          range: Math.round((high30d - low30d) * 100) / 100,
          positionInRange: high30d !== low30d
            ? Math.round(((ind.value - low30d) / (high30d - low30d)) * 100)
            : 50,
        },
      };
    });

    // Calculate correlation between assets
    const correlations: { symbol1: string; symbol2: string; correlation: number }[] = [];
    for (let i = 0; i < comparisonData.length; i++) {
      for (let j = i + 1; j < comparisonData.length; j++) {
        const hist1 = comparisonData[i].history30d.map((h) => h.pctChange);
        const hist2 = comparisonData[j].history30d.map((h) => h.pctChange);
        const minLen = Math.min(hist1.length, hist2.length);
        if (minLen > 2) {
          const slice1 = hist1.slice(-minLen);
          const slice2 = hist2.slice(-minLen);
          const mean1 = slice1.reduce((a, b) => a + b, 0) / minLen;
          const mean2 = slice2.reduce((a, b) => a + b, 0) / minLen;
          let num = 0, den1 = 0, den2 = 0;
          for (let k = 0; k < minLen; k++) {
            const d1 = slice1[k] - mean1;
            const d2 = slice2[k] - mean2;
            num += d1 * d2;
            den1 += d1 * d1;
            den2 += d2 * d2;
          }
          const den = Math.sqrt(den1 * den2);
          const correlation = den !== 0 ? Math.round((num / den) * 100) / 100 : 0;
          correlations.push({
            symbol1: comparisonData[i].symbol,
            symbol2: comparisonData[j].symbol,
            correlation,
          });
        }
      }
    }

    return NextResponse.json({
      comparison: comparisonData,
      correlations,
      availableSymbols: allIndicators,
    });
  } catch (error: any) {
    console.error('[Compare API]', error);
    return NextResponse.json({ error: 'فشل في تحميل بيانات المقارنة' }, { status: 500 });
  }
}
