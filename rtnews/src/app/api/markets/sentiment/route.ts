// ─── Markets Sentiment API ──────────────────────────────────
// Generates real-time sentiment analysis using AI providers
// Falls back to calculated sentiment from DB news items
//
// PERFORMANCE: Uses in-memory caching with background refresh.
// The AI call takes ~15s, so we cache the result for 5 minutes
// and refresh in the background (non-blocking) after 3 minutes.

import { NextResponse } from 'next/server';
import { analyzeFinancialNews, getProviderStatus } from '@/lib/ai-provider';
import { db } from '@/lib/db';

export const revalidate = 60;

// ── In-memory cache ──
let cachedResponse: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes — serve cached data
const BACKGROUND_REFRESH_AFTER = 3 * 60 * 1000; // 3 minutes — trigger background refresh
let isRefreshing = false;

function buildResponse(dbSentimentScore: number, assetImpactData: { symbol: string; trend: 'up' | 'down'; value: string }[], aiSentiment: any) {
  const fearGreedValue = aiSentiment
    ? (aiSentiment.sentiment === 'positive' ? 65 + Math.round(aiSentiment.confidence * 0.3)
       : aiSentiment.sentiment === 'negative' ? 35 - Math.round(aiSentiment.confidence * 0.3)
       : 50 + Math.round((aiSentiment.confidence - 50) * 0.3))
    : dbSentimentScore;

  const arabValue = Math.min(100, Math.max(0, fearGreedValue));
  const geopoliticalRisk = aiSentiment?.impactLevel === 'high' ? 72
    : aiSentiment?.impactLevel === 'medium' ? 48
    : 35;

  return {
    fearGreedIndex: {
      value: Math.min(100, Math.max(0, fearGreedValue)),
      label: fearGreedValue <= 25 ? 'خوف شديد' : fearGreedValue <= 40 ? 'خوف' : fearGreedValue <= 60 ? 'حذر متوسط' : fearGreedValue <= 75 ? 'طمع' : 'طمع شديد',
      labelAr: fearGreedValue <= 25 ? 'خوف شديد' : fearGreedValue <= 40 ? 'خوف' : fearGreedValue <= 60 ? 'حذر متوسط' : fearGreedValue <= 75 ? 'طمع' : 'طمع شديد',
    },
    arabSentimentIndex: {
      value: Math.min(100, Math.max(0, arabValue)),
      label: arabValue <= 25 ? 'خوف' : arabValue <= 40 ? 'تشاؤم' : arabValue <= 60 ? 'حذر متوسط' : arabValue <= 75 ? 'تفاؤل' : 'تفاؤل شديد',
      topSearchedAsset: assetImpactData.length > 0 ? assetImpactData[0].symbol.replace('USD', '/USD').replace('XAU/USD', 'XAU/USD') : '—',
      majorityVote: arabValue > 50 ? `صعود ${50 + Math.round((arabValue - 50) * 1.5)}%` : `هبوط ${50 + Math.round((50 - arabValue) * 1.5)}%`,
      interactionsCount: null,
    },
    geopoliticalRiskIndex: {
      value: geopoliticalRisk,
      label: geopoliticalRisk <= 30 ? 'منخفض' : geopoliticalRisk <= 60 ? 'متوسط' : 'مرتفع',
      description: geopoliticalRisk > 60
        ? 'تصاعد التوترات الجيوسياسية يؤثر على أسواق الطاقة والمعادن الثمينة'
        : 'توترات جيوسياسية معتدلة مع تأثير محدود على الأسواق',
      impacts: assetImpactData.reduce((acc: Record<string, { trend: string; value: string }>, item: { symbol: string; trend: 'up' | 'down'; value: string }) => {
        const key = item.symbol === 'XAU' || item.symbol === 'XAUUSD' ? 'gold'
          : item.symbol === 'WTI' ? 'oil'
          : 'dollar';
        acc[key] = { trend: item.trend, value: item.value };
        return acc;
      }, {}),
    },
    aiPowered: !!aiSentiment,
    aiSummary: aiSentiment?.summary || null,
    lastUpdate: new Date().toISOString(),
  };
}

// ── Background refresh (non-blocking) ──
async function refreshCacheInBackground() {
  if (isRefreshing) return;
  isRefreshing = true;

  try {
    // ── 1. Calculate sentiment from DB news items ──
    let dbSentimentScore = 50;
    try {
      const recentNews = await db.newsItem.findMany({
        where: { fetchedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        select: { sentiment: true, sentimentScore: true },
        take: 100,
      });
      if (recentNews.length > 0) {
        dbSentimentScore = Math.round(recentNews.reduce((sum, n) => sum + (n.sentimentScore || 50), 0) / recentNews.length);
      }
    } catch {}

    // ── 2. Get AI-powered sentiment ──
    let aiSentiment: any = null;
    const providerStatus = getProviderStatus();
    if (providerStatus.some(p => p.available)) {
      try {
        aiSentiment = await analyzeFinancialNews(
          'Global financial markets overview',
          'Current market conditions including stock indices, commodities, and forex pairs. Analyzing fear and greed indicators, geopolitical risks, and economic data releases.'
        );
      } catch {}
    }

    // ── 3. Get asset impacts ──
    let assetImpactData: { symbol: string; trend: 'up' | 'down'; value: string }[] = [];
    try {
      const assetNews = await db.newsItem.findMany({
        where: { fetchedAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }, affectedAssets: { not: '[]' } },
        select: { affectedAssets: true, sentiment: true },
        take: 50,
      });
      const assetTrends: Record<string, { up: number; down: number }> = {};
      for (const news of assetNews) {
        try {
          const assets = JSON.parse(news.affectedAssets || '[]');
          for (const asset of assets) {
            const symbol = asset.symbol || asset;
            if (!assetTrends[symbol]) assetTrends[symbol] = { up: 0, down: 0 };
            if (news.sentiment === 'positive') assetTrends[symbol].up++;
            else if (news.sentiment === 'negative') assetTrends[symbol].down++;
          }
        } catch {}
      }
      for (const symbol of ['XAUUSD', 'WTI', 'DXY', 'BTCUSD', 'EURUSD']) {
        const trend = assetTrends[symbol];
        if (trend) assetImpactData.push({ symbol, trend: trend.up >= trend.down ? 'up' : 'down', value: `${trend.up + trend.down} خبر` });
      }
    } catch {}

    // ── 4. Build and cache the response ──
    cachedResponse = buildResponse(dbSentimentScore, assetImpactData, aiSentiment);
    lastCacheTime = Date.now();
    console.log(`[Sentiment] Cache refreshed (AI=${!!aiSentiment})`);
  } catch (err: any) {
    console.error('[Sentiment] Background refresh failed:', err.message);
  } finally {
    isRefreshing = false;
  }
}

export async function GET() {
  try {
    const now = Date.now();

    // ── Return cached response if fresh ──
    if (cachedResponse && (now - lastCacheTime) < CACHE_TTL) {
      // Trigger background refresh if cache is getting stale
      if ((now - lastCacheTime) >= BACKGROUND_REFRESH_AFTER) {
        refreshCacheInBackground();
      }
      return NextResponse.json({ ...cachedResponse, cached: true });
    }

    // ── No cache or expired: compute fresh data ──
    // If we have stale cache, return it immediately and refresh in background
    if (cachedResponse) {
      refreshCacheInBackground();
      return NextResponse.json({ ...cachedResponse, cached: true, stale: true });
    }

    // ── First-ever request: must compute synchronously ──
    let dbSentimentScore = 50;
    try {
      const recentNews = await db.newsItem.findMany({
        where: { fetchedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        select: { sentiment: true, sentimentScore: true },
        take: 100,
      });
      if (recentNews.length > 0) {
        dbSentimentScore = Math.round(recentNews.reduce((sum, n) => sum + (n.sentimentScore || 50), 0) / recentNews.length);
      }
    } catch {}

    // Skip AI call on first request for speed — use DB-only sentiment
    let assetImpactData: { symbol: string; trend: 'up' | 'down'; value: string }[] = [];
    try {
      const assetNews = await db.newsItem.findMany({
        where: { fetchedAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }, affectedAssets: { not: '[]' } },
        select: { affectedAssets: true, sentiment: true },
        take: 50,
      });
      const assetTrends: Record<string, { up: number; down: number }> = {};
      for (const news of assetNews) {
        try {
          const assets = JSON.parse(news.affectedAssets || '[]');
          for (const asset of assets) {
            const symbol = asset.symbol || asset;
            if (!assetTrends[symbol]) assetTrends[symbol] = { up: 0, down: 0 };
            if (news.sentiment === 'positive') assetTrends[symbol].up++;
            else if (news.sentiment === 'negative') assetTrends[symbol].down++;
          }
        } catch {}
      }
      for (const symbol of ['XAUUSD', 'WTI', 'DXY', 'BTCUSD', 'EURUSD']) {
        const trend = assetTrends[symbol];
        if (trend) assetImpactData.push({ symbol, trend: trend.up >= trend.down ? 'up' : 'down', value: `${trend.up + trend.down} خبر` });
      }
    } catch {}

    const response = buildResponse(dbSentimentScore, assetImpactData, null);
    cachedResponse = response;
    lastCacheTime = now;

    // Trigger background AI refresh immediately
    refreshCacheInBackground();

    return NextResponse.json({ ...response, cached: false });
  } catch (error: any) {
    // Return cached if available, even on error
    if (cachedResponse) {
      return NextResponse.json({ ...cachedResponse, cached: true, error: 'using_stale_cache' });
    }
    return NextResponse.json({
      fearGreedIndex: { value: -1, label: 'لا توجد بيانات', labelAr: 'لا توجد بيانات' },
      arabSentimentIndex: { value: -1, label: 'لا توجد بيانات', topSearchedAsset: '—', majorityVote: '—', interactionsCount: null },
      geopoliticalRiskIndex: { value: -1, label: 'لا توجد بيانات', description: '', impacts: {} },
      aiPowered: false,
      aiSummary: null,
      error: 'حدث خطأ في تحليل المشاعر',
      lastUpdate: new Date().toISOString(),
    });
  }
}
