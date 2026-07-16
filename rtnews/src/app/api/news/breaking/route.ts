// ─── Breaking News API ──────────────────────────────────────
// Reads from database first. If DB is empty, fetches live from sources.
// ALL news processing happens in the background via the cron job.
// Telegram notifications are triggered automatically via news-ingestion.ts
// when new breaking news is created. The notifyTelegramSubscribers
// function is also available here for manual triggers if needed.

import { NextResponse } from 'next/server';
import { getNewsFromDB, fetchBreakingNews as fetchBreakingFromSources, saveNewsToDB } from '@/lib/news-sources';
import { apiRateLimit } from '@/lib/rate-limit';
import { generateSlug } from '@/lib/slug';
import { readPersistentCache, writePersistentCache } from '@/lib/persistent-cache';
import { notifyTelegramSubscribers } from '@/lib/telegram-notifier';

export const dynamic = 'force-dynamic';

// ─── Cache Layer ────────────────────────────────────────────
let cachedBreaking: any[] = [];
let lastFetch = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
let isRefreshing = false;

// On first load, try to restore from persistent cache
(async () => {
  try {
    const restored = await readPersistentCache('breaking-news');
    if (restored && restored.length > 0) {
      cachedBreaking = restored;
      lastFetch = Date.now();
      console.log(`[BreakingNews] Restored ${restored.length} items from persistent cache`);
    }
  } catch {}
})();

// ─── Asset Pattern Detection ────────────────────────────────
const assetPatterns: Record<string, { symbol: string; keywords: string[] }> = {
  'XAU/USD': { symbol: 'XAUUSD', keywords: ['gold', 'ذهب', 'xau'] },
  'BTC/USD': { symbol: 'BTCUSD', keywords: ['bitcoin', 'btc', 'بيتكوين'] },
  'WTI': { symbol: 'WTI', keywords: ['oil', 'crude', 'wti', 'brent', 'نفط', 'خام'] },
  'DXY': { symbol: 'DXY', keywords: ['dollar index', 'dxy', 'مؤشر الدولار'] },
  'EUR/USD': { symbol: 'EURUSD', keywords: ['euro', 'eurusd', 'يورو'] },
  'S&P 500': { symbol: 'SPX500', keywords: ['s&p', 'sp500', 'spx'] },
  'ETH/USD': { symbol: 'ETHUSD', keywords: ['ethereum', 'eth', 'إيثريوم'] },
  'NASDAQ': { symbol: 'NDX', keywords: ['nasdaq', 'ناسداك'] },
  'SILVER': { symbol: 'XAGUSD', keywords: ['silver', 'فضة', 'xag'] },
};

function detectAffectedAssets(title: string, snippet: string): { symbol: string; change: number }[] {
  const text = `${title} ${snippet}`.toLowerCase();
  const affected: { symbol: string; change: number }[] = [];

  const posWords = ['rise', 'surge', 'gain', 'rally', 'high', 'record', 'ارتفاع', 'صعود', 'قفز'];
  const negWords = ['fall', 'drop', 'decline', 'low', 'crash', 'plunge', 'هبوط', 'تراجع', 'انخفاض'];

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

// ─── Helper: Format breaking news item ──────────────────────
// V59: Simplified — getNewsFromDB no longer returns generatedImage/aiAnalysis in lists
function formatBreakingItem(item: any, dbId?: string) {
  const titleAr = item.titleAr || undefined;
  const summaryAr = item.summaryAr || undefined;

  const isTitleArArabic = titleAr && /[\u0600-\u06FF]/.test(titleAr);
  const displayTitle = isTitleArArabic ? titleAr : '';
  const slug = item.slug || (displayTitle ? generateSlug(displayTitle) : undefined);

  return {
    id: dbId || item.id,
    slug,
    newsType: 'breaking' as const,
    title: item.title,
    titleAr,
    summary: item.summary,
    summaryAr,
    time: item.date || item.time,
    source: item.source,
    url: item.url,
    affectedAssets: detectAffectedAssets(item.title, item.summary || ''),
    isBreaking: true,
    sentiment: item.sentiment,
    sentimentScore: item.sentimentScore,
    impactLevel: item.impactLevel,
    originalLanguage: item.language || item.originalLanguage,
    // V59: imageUrl is always the proxy route — generatedImage not in list queries
    imageUrl: item.imageUrl || `/api/article-image/${dbId || item.id}`,
    translatedTitle: titleAr || item.translatedTitle || undefined,
    translatedSummary: summaryAr || item.translatedSummary || undefined,
    hasFullContent: true, // V59: All published articles have full content
  };
}

// ─── Background Cache Refresh (DB-only) ──────────────────────
// CRITICAL FIX: Same stale-cache preservation as live route.
// If DB returns 0 (transient error) or throws, KEEP existing cache.
function refreshCache() {
  if (isRefreshing) return;
  isRefreshing = true;

  (async () => {
    try {
      // FIX: Always filter locale='ar' — this is the Arabic breaking news API.
      // Without this filter, English articles leak into Arabic pages.
      const result = await getNewsFromDB({ newsType: 'breaking', limit: 12, locale: 'ar' });
      const dbNews = result.items;

      // CRITICAL FIX: Only update cache if DB returned items.
      // If DB returned 0 (transient error, connection issue), KEEP existing cache.
      if (dbNews.length > 0) {
        cachedBreaking = dbNews.map((item) => formatBreakingItem(item, item.id));
        lastFetch = Date.now();
        // Save to persistent cache (fire and forget, non-blocking)
        writePersistentCache('breaking-news', cachedBreaking).catch(err => console.error('[BreakingNews V156] Failed to write persistent cache:', err instanceof Error ? err.message : err));
        console.log(`[BreakingNews] Cache refreshed from DB: ${cachedBreaking.length} items`);
      } else if (cachedBreaking.length > 0) {
        // DB returned empty but we have cached data — keep it!
        lastFetch = Date.now();
        console.log('[BreakingNews] DB returned 0 items — keeping existing cache (' + cachedBreaking.length + ' items)');
      }
    } catch (err: any) {
      // CRITICAL FIX: On ANY error, do NOT wipe the cache.
      console.error('[BreakingNews] Cache refresh failed — keeping existing cache:', err.message);
    } finally {
      isRefreshing = false;
    }
  })();
}

export async function GET(request: Request) {
  try {
    // V59: Removed ensureTablesExist() — was doing ALTER TABLE on every API call

    // Rate limiting
    const rateCheck = apiRateLimit.check(request);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'طلبات كثيرة جداً. حاول مرة أخرى بعد دقيقة.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetTime - Date.now()) / 1000)) } }
      );
    }

    const now = Date.now();

    // ── 1. Return fresh cache if available ──
    if (cachedBreaking.length > 0) {
        // V11: Filter out articles without valid Arabic title
        // V59: Simplified — no generatedImage check (not in list data anymore)
        const validatedCached = cachedBreaking.filter((n) => {
          const hasArabicTitle = n.titleAr && n.titleAr.length > 3 && /[\u0600-\u06FF]/.test(n.titleAr);
          return hasArabicTitle;
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

    // ── 2. Read from database first (NO maxAge — breaking news stays forever) ──
    // FIX: Filter locale='ar' — prevent English articles from appearing in Arabic breaking news
    const result = await getNewsFromDB({ newsType: 'breaking', limit: 12, locale: 'ar' });
    const dbNews = result.items;

    // Return whatever is in the database
    if (dbNews.length > 0) {
      // V59: Simplified validation — getNewsFromDB WHERE guarantees all fields
      const validatedNews = dbNews.filter((item) => {
        const hasArabicTitle = item.titleAr && item.titleAr.length > 3 && /[\u0600-\u06FF]/.test(item.titleAr);
        return hasArabicTitle;
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

    // ── 3. DB is empty — trigger background cron, do NOT fetch live ──
    // Visitors should only see pre-processed, ready content.
    // Live-fetching would show untranslated English news — unacceptable for an Arabic platform.
    // V153: Use INTERNAL_SECRET env var instead of hardcoded 'rouaa-cron'
    console.log('[BreakingNews] No ready articles in DB — triggering background cron...');
    try {
      const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET || '';
      const internalUrl = process.env.RAILWAY_PRIVATE_DOMAIN
        ? `http://${process.env.RAILWAY_PRIVATE_DOMAIN}:8080/api/news/cron`
        : 'http://localhost:8080/api/news/cron';
      fetch(internalUrl, {
        signal: AbortSignal.timeout(5000),
        headers: { 'x-internal': internalSecret },
      }).catch(err => console.error('[BreakingNews V156] Failed to trigger background cron:', err instanceof Error ? err.message : err));
    } catch {}

    // Return stale cache if available, otherwise empty response
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
      message: 'جاري تجهيز الأخبار العاجلة بالعربية، يرجى المحاولة بعد 30 ثانية',
      retryAfter: 30,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Breaking news API error:', error);

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
