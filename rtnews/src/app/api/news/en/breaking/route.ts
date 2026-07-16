// ─── English Breaking News API ──────────────────────────────
// Reads from database first. If DB is empty, triggers background cron.
// ALL news processing happens in the background via the cron job.
// This is the English locale version — filters locale='en', uses English titles.

import { NextResponse } from 'next/server';
import { getNewsFromDB } from '@/lib/news-sources';
import { apiRateLimit } from '@/lib/rate-limit';
import { readPersistentCache, writePersistentCache } from '@/lib/persistent-cache';

export const dynamic = 'force-dynamic';

// ─── Cache Layer ────────────────────────────────────────────
let cachedBreaking: any[] = [];
let lastFetch = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
let isRefreshing = false;

// On first load, try to restore from persistent cache
(async () => {
  try {
    const restored = await readPersistentCache('breaking-news-en');
    if (restored && restored.length > 0) {
      cachedBreaking = restored;
      lastFetch = Date.now();
      console.log(`[EnBreakingNews] Restored ${restored.length} items from persistent cache`);
    }
  } catch {}
})();

// ─── Asset Pattern Detection ────────────────────────────────
const assetPatterns: Record<string, { symbol: string; keywords: string[] }> = {
  'XAU/USD': { symbol: 'XAUUSD', keywords: ['gold', 'xau'] },
  'BTC/USD': { symbol: 'BTCUSD', keywords: ['bitcoin', 'btc'] },
  'WTI': { symbol: 'WTI', keywords: ['oil', 'crude', 'wti', 'brent'] },
  'DXY': { symbol: 'DXY', keywords: ['dollar index', 'dxy'] },
  'EUR/USD': { symbol: 'EURUSD', keywords: ['euro', 'eurusd'] },
  'S&P 500': { symbol: 'SPX500', keywords: ['s&p', 'sp500', 'spx'] },
  'ETH/USD': { symbol: 'ETHUSD', keywords: ['ethereum', 'eth'] },
  'NASDAQ': { symbol: 'NDX', keywords: ['nasdaq'] },
  'SILVER': { symbol: 'XAGUSD', keywords: ['silver', 'xag'] },
};

function detectAffectedAssets(title: string, snippet: string): { symbol: string; change: number }[] {
  const text = `${title} ${snippet}`.toLowerCase();
  const affected: { symbol: string; change: number }[] = [];

  const posWords = ['rise', 'surge', 'gain', 'rally', 'high', 'record'];
  const negWords = ['fall', 'drop', 'decline', 'low', 'crash', 'plunge'];

  for (const [, data] of Object.entries(assetPatterns)) {
    for (const kw of data.keywords) {
      if (text.includes(kw)) {
        let change = 0;
        posWords.forEach(w => { if (text.includes(w)) change += 0.5; });
        negWords.forEach(w => { if (text.includes(w)) change -= 0.5; });
        affected.push({ symbol: data.symbol, change: Math.round(change * 100) / 100 });
        break;
      }
    }
  }

  return affected.length > 0 ? affected : [{ symbol: 'MIX', change: 0 }];
}

// ─── Helper: Format breaking news item for English ──────────
function formatBreakingItem(item: any, dbId?: string) {
  // English version: use title directly, no Arabic title needed
  const slug = item.slug || undefined;

  return {
    id: dbId || item.id,
    slug,
    newsType: 'breaking' as const,
    title: item.title,
    summary: item.summary,
    time: item.date || item.time,
    source: item.source,
    url: item.url,
    affectedAssets: detectAffectedAssets(item.title, item.summary || ''),
    isBreaking: true,
    sentiment: item.sentiment,
    sentimentScore: item.sentimentScore,
    impactLevel: item.impactLevel,
    originalLanguage: item.language || item.originalLanguage,
    imageUrl: item.imageUrl || `/api/article-image/${dbId || item.id}`,
    hasFullContent: true,
  };
}

// ─── Background Cache Refresh (DB-only) ──────────────────────
function refreshCache() {
  if (isRefreshing) return;
  isRefreshing = true;

  (async () => {
    try {
      // Filter locale='en' — this is the English breaking news API
      const result = await getNewsFromDB({ newsType: 'breaking', limit: 12, locale: 'en' });
      const dbNews = result.items;

      if (dbNews.length > 0) {
        cachedBreaking = dbNews.map((item) => formatBreakingItem(item, item.id));
        lastFetch = Date.now();
        writePersistentCache('breaking-news-en', cachedBreaking).catch(err => console.error('[EnBreakingNews] Failed to write persistent cache:', err instanceof Error ? err.message : err));
        console.log(`[EnBreakingNews] Cache refreshed from DB: ${cachedBreaking.length} items`);
      } else if (cachedBreaking.length > 0) {
        lastFetch = Date.now();
        console.log('[EnBreakingNews] DB returned 0 items — keeping existing cache (' + cachedBreaking.length + ' items)');
      }
    } catch (err: any) {
      console.error('[EnBreakingNews] Cache refresh failed — keeping existing cache:', err.message);
    } finally {
      isRefreshing = false;
    }
  })();
}

export async function GET(request: Request) {
  try {
    // Rate limiting
    const rateCheck = apiRateLimit.check(request);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetTime - Date.now()) / 1000)) } }
      );
    }

    const now = Date.now();

    // ── 1. Return fresh cache if available ──
    if (cachedBreaking.length > 0) {
      // English: filter out items without a valid English title
      const validatedCached = cachedBreaking.filter((n) => {
        return n.title && n.title.length > 3;
      });
      if ((now - lastFetch) >= CACHE_DURATION) {
        refreshCache();
      }
      return NextResponse.json({
        news: validatedCached,
        cached: true,
        lastUpdate: new Date(lastFetch).toISOString(),
        nextUpdate: new Date(Math.max(lastFetch, now) + CACHE_DURATION).toISOString(),
      });
    }

    // ── 2. Read from database first ──
    const result = await getNewsFromDB({ newsType: 'breaking', limit: 12, locale: 'en' });
    const dbNews = result.items;

    if (dbNews.length > 0) {
      const validatedNews = dbNews.filter((item) => {
        return item.title && item.title.length > 3;
      });
      const breakingItems = validatedNews.map((item) => formatBreakingItem(item, item.id));
      cachedBreaking = breakingItems;
      lastFetch = now;

      return NextResponse.json({
        news: breakingItems,
        cached: true,
        source: 'database',
        lastUpdate: new Date(now).toISOString(),
      });
    }

    // ── 3. DB is empty — trigger background cron ──
    console.log('[EnBreakingNews] No ready articles in DB — triggering background cron...');
    try {
      const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET || '';
      const internalUrl = process.env.RAILWAY_PRIVATE_DOMAIN
        ? `http://${process.env.RAILWAY_PRIVATE_DOMAIN}:8080/api/news/cron-en`
        : 'http://localhost:8080/api/news/cron-en';
      fetch(internalUrl, {
        signal: AbortSignal.timeout(5000),
        headers: { 'x-internal': internalSecret },
      }).catch(err => console.error('[EnBreakingNews] Failed to trigger background cron:', err instanceof Error ? err.message : err));
    } catch {}

    // Return stale cache if available
    if (cachedBreaking.length > 0) {
      return NextResponse.json({
        news: cachedBreaking,
        cached: true,
        source: 'stale-cache',
        lastUpdate: new Date(lastFetch).toISOString(),
      });
    }

    // ── 4. Everything failed — return empty with retry ──
    return NextResponse.json({
      news: [],
      cached: false,
      loading: true,
      message: 'Breaking news is being prepared in English, please try again in 30 seconds',
      retryAfter: 30,
    }, { status: 200 });

  } catch (error: any) {
    console.error('English breaking news API error:', error);

    if (cachedBreaking.length > 0) {
      return NextResponse.json({
        news: cachedBreaking,
        cached: true,
        error: 'using_stale_cache',
      });
    }

    return NextResponse.json({
      news: [],
      error: error.message || 'Failed to load breaking news',
      loading: true,
      retryAfter: 30,
    }, { status: 200 });
  }
}
