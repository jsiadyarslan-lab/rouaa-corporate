import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Deterministic seeded PRNG (simple mulberry32) — same seed always yields same sequence
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hash a date string (YYYY-MM-DD) to a numeric seed
function dateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const ch = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash;
}

const getLabel = (val: number) => {
  if (val <= 20) return 'خوف شديد';
  if (val <= 35) return 'خوف';
  if (val <= 50) return 'قلق';
  if (val <= 65) return 'حياد';
  if (val <= 80) return 'جشع';
  return 'جشع شديد';
};

const getColor = (val: number) => {
  if (val <= 20) return '#EF4444';
  if (val <= 35) return '#F97316';
  if (val <= 50) return '#EAB308';
  if (val <= 65) return '#D4A017';
  if (val <= 80) return '#84CC16';
  return '#22C55E';
};

// GET /api/market-sentiment — Fear & Greed Index
export async function GET() {
  try {
    // Component 1: News Sentiment (0-100)
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sentimentData = await db.newsItem.groupBy({
      by: ['sentiment'],
      where: { isReady: true, fetchedAt: { gte: last7d } },
      _count: { sentiment: true },
      _avg: { sentimentScore: true },
    });

    let newsSentiment = 50;
    const totalNews = sentimentData.reduce((sum, s) => sum + s._count.sentiment, 0);
    if (totalNews > 0) {
      const avgScore = sentimentData.reduce((sum, s) => sum + (s._avg.sentimentScore || 50) * s._count.sentiment, 0) / totalNews;
      newsSentiment = Math.round(avgScore);
    }

    // Component 2: Market Momentum (0-100) — based on indicator changes
    const indicators = await db.marketIndicator.findMany();
    let momentumScore = 50;
    if (indicators.length > 0) {
      const avgChange = indicators.reduce((sum, i) => sum + i.changePercent, 0) / indicators.length;
      momentumScore = Math.round(Math.min(100, Math.max(0, 50 + avgChange * 10)));
    }

    // Component 3: Volatility (0-100) — inverse: more volatile = more fear
    let volatilityScore = 50;
    if (indicators.length > 0) {
      const changes = indicators.map(i => Math.abs(i.changePercent));
      const avgAbsChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
      volatilityScore = Math.round(Math.min(100, Math.max(0, 100 - avgAbsChange * 15)));
    }

    // Component 4: Safe Haven Demand (0-100)
    let safeHavenScore = 50;
    const goldInd = indicators.find(i => i.symbol === 'XAU');
    const spxInd = indicators.find(i => i.symbol === 'SPX');
    if (goldInd && spxInd) {
      const goldVsStocks = goldInd.changePercent - spxInd.changePercent;
      safeHavenScore = Math.round(Math.min(100, Math.max(0, 50 + goldVsStocks * 5)));
    }

    // Composite Fear & Greed Index
    const fearGreedValue = Math.round(
      newsSentiment * 0.3 + momentumScore * 0.3 + volatilityScore * 0.2 + safeHavenScore * 0.2
    );

    // ── Persist today's value to DB for real history ──
    try {
      const today = new Date().toISOString().split('T')[0];

      // Try to find or create the FEAR_GREED indicator
      let sentimentIndicator = await db.marketIndicator.findUnique({
        where: { symbol: 'FEAR_GREED' },
      });

      if (sentimentIndicator) {
        // Parse existing history
        let history: { date: string; value: number }[] = [];
        try {
          if (sentimentIndicator.history) {
            history = JSON.parse(sentimentIndicator.history);
          }
        } catch { /* ignore parse errors */ }

        // Check if today's value already exists
        const todayEntry = history.find(h => h.date === today);
        if (!todayEntry) {
          // Add today's value
          history.push({ date: today, value: fearGreedValue });

          // Keep only last 60 days
          if (history.length > 60) {
            history = history.slice(-60);
          }

          await db.marketIndicator.update({
            where: { symbol: 'FEAR_GREED' },
            data: {
              value: fearGreedValue,
              change: fearGreedValue - (history[history.length - 2]?.value || fearGreedValue),
              history: JSON.stringify(history),
              updatedAt: new Date(),
            },
          });
        }
      } else {
        // Create the FEAR_GREED indicator with today's value
        await db.marketIndicator.create({
          data: {
            symbol: 'FEAR_GREED',
            name: 'Fear & Greed Index',
            nameAr: 'مؤشر الخوف والجشع',
            value: fearGreedValue,
            change: 0,
            changePercent: 0,
            category: 'sentiment',

            history: JSON.stringify([{ date: today, value: fearGreedValue }]),
          },
        });
      }
    } catch (persistErr: any) {
      // Don't fail the request if persistence fails
      console.warn('[MarketSentiment] Failed to persist daily value:', persistErr?.message?.slice(0, 80));
    }

    // ── History: try real stored data first, fall back to deterministic simulation ──
    let isHistoryReal = false;
    let history: { date: string; value: number }[] = [];

    // Try to fetch stored sentiment history from MarketIndicator (sentiment symbol)
    try {
      const sentimentIndicator = await db.marketIndicator.findUnique({
        where: { symbol: 'FEAR_GREED' },
      });
      if (sentimentIndicator?.history) {
        const parsed: { date?: string; value?: number }[] = JSON.parse(sentimentIndicator.history);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(h => h.date && typeof h.value === 'number')) {
          history = parsed.map(h => ({ date: h.date!, value: h.value! }));
          isHistoryReal = true;
        }
      }
    } catch {
      // DB read failed or no stored history — fall through to deterministic generation
    }

    // Deterministic simulated history (seeded per date so chart is stable across refreshes)
    // Only used when we don't have enough real history (< 7 days)
    if (!isHistoryReal || history.length < 7) {
      const realHistoryMap = new Map(history.map(h => [h.date, h.value]));
      const simulatedHistory: { date: string; value: number }[] = [];

      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];

        // Use real value if available
        if (realHistoryMap.has(dateStr)) {
          simulatedHistory.push({ date: dateStr, value: realHistoryMap.get(dateStr)! });
        } else {
          // Generate deterministic simulated value
          const rng = mulberry32(dateSeed(dateStr));
          const variation = Math.round((rng() - 0.5) * 20);
          simulatedHistory.push({
            date: dateStr,
            value: Math.min(100, Math.max(0, fearGreedValue + variation)),
          });
        }
      }

      history = simulatedHistory;
      // Mark as real only if we have substantial real data
      isHistoryReal = realHistoryMap.size >= 7;
    }

    return NextResponse.json({
      value: fearGreedValue,
      label: getLabel(fearGreedValue),
      color: getColor(fearGreedValue),
      components: {
        newsSentiment: { value: newsSentiment, label: 'مشاعر الأخبار', weight: '30%' },
        marketMomentum: { value: momentumScore, label: 'زخم السوق', weight: '30%' },
        volatility: { value: volatilityScore, label: 'التقلب', weight: '20%' },
        safeHavenDemand: { value: safeHavenScore, label: 'طلب الملاذ الآمن', weight: '20%' },
      },
      history,
      isHistoryReal,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[MarketSentiment]', error);
    return NextResponse.json(
      {
        value: null,
        label: 'لا توجد بيانات',
        color: '#64748B',
        components: null,
        history: [],
        isHistoryReal: false,
        error: 'لا توجد بيانات كافية لحساب مؤشر المشاعر',
        updatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
