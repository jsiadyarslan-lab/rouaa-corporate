// ─── Main News API Route V44 ────────────────────────────────
// CRITICAL PRINCIPLE: NO article is returned unless it is FULLY ready.
// V44 FIX: The Publisher agent is the SINGLE GATEKEEPER.
// getNewsFromDB already enforces quality via its WHERE clause:
//   isReady=true, isPublished=true, slug NOT NULL, titleAr NOT NULL,
//   generatedImage NOT NULL, contentAr NOT NULL, aiAnalysis NOT NULL.
// No additional post-query filtering is applied — the Publisher +
// DB WHERE clause are the gatekeepers.

import { NextResponse } from 'next/server';
import { getNewsFromDB } from '@/lib/news-sources';
import { forceReinitDB } from '@/lib/db-init';
import { generateSlug } from '@/lib/slug';

export const dynamic = 'force-dynamic';

// ─── In-memory cache (2 min) ──────────────────────────────
let cachedNews: any[] = [];
let cachedTotal: number = 0;
let lastFetch = 0;
const CACHE_DURATION = 2 * 60 * 1000;

function mapItemToResponse(item: any) {
  // V257: For Arabic API, always use Arabic title as primary `title` field
  // This prevents English titles from appearing on Arabic pages
  const displayTitle = item.titleAr || item.title;
  const displaySummary = item.summaryAr || item.summary;

  // V415 FIX: getNewsFromDB() already serializes publishedAt/fetchedAt to ISO strings.
  // Calling .toISOString() again on a string causes "toISOString is not a function" crash.
  // Use the value directly if it's a string, or serialize if it's still a Date object.
  const serializeDate = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (val instanceof Date) return val.toISOString();
    // Fallback: try toISOString if available (Date-like object)
    if (typeof val.toISOString === 'function') return val.toISOString();
    return String(val);
  };

  return {
    id: item.id,
    slug: item.slug || generateSlug(item.titleAr || item.title),
    newsType: item.newsType || 'live',
    title: displayTitle,
    titleAr: item.titleAr || undefined,
    summary: displaySummary,
    summaryAr: item.summaryAr || undefined,
    contentAr: item.contentAr || undefined,
    time: item.date || item.fetchedAt,
    source: item.source || '',
    url: item.url || '',
    category: item.category || 'اقتصاد كلي',
    sentiment: item.sentiment || 'neutral',
    sentimentScore: item.sentimentScore || 55,
    impactLevel: item.impactLevel || 'low',
    impactScore: item.impactScore || 0,   // V101: Importance score for client
    originalLanguage: item.language || 'en',
    // imageUrl is always /api/article-image/{id} — the proxy handles all formats
    imageUrl: `/api/article-image/${item.id}`,
    // DO NOT send generatedImage or aiAnalysis in listing API — they're megabytes of base64 data
    // generatedImage is served via /api/article-image/[id] route
    // aiAnalysis is used only on the article detail page (server-side)
    translatedTitle: item.titleAr || undefined,
    translatedSummary: item.summaryAr || undefined,
    views: item.views || 0,
    publishedAt: serializeDate(item.publishedAt),
    fetchedAt: serializeDate(item.fetchedAt),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;
  const sort = url.searchParams.get('sort') || undefined;
  const order = url.searchParams.get('order') || 'desc';
  const isHomePage = page === 1 && limit === 20 && sort !== 'views';
  const now = Date.now();

  // V415 FIX: Read locale from query param — previously hardcoded to 'ar'.
  // This allows /api/news?locale=en to return English articles too.
  // Default remains 'ar' for backward compatibility with Arabic homepage.
  const locale = url.searchParams.get('locale') || 'ar';
  const sortBy = sort === 'views' ? 'views' : undefined;
  const sortOrder = order === 'asc' ? 'asc' : 'desc';

  try {
    // V59: Removed ensureTablesExist() — was doing ALTER TABLE on every API call
    const cacheValid = cachedNews.length > 0 && cachedNews.every(n =>
      n.titleAr && n.titleAr.length > 3 && /[\u0600-\u06FF]/.test(n.titleAr)
    );
    if (isHomePage && cacheValid && (now - lastFetch) < CACHE_DURATION) {
      return NextResponse.json({
        news: cachedNews,
        total: cachedTotal,
        page: 1,
        limit: 20,
        totalPages: Math.ceil(cachedTotal / 20),
        hasMore: cachedTotal > 20,
        cached: true,
        lastUpdate: new Date(lastFetch).toISOString(),
      });
    }

    const result = await getNewsFromDB({ limit, offset, locale: locale as any, sortBy, sortOrder });

    if (result.items.length > 0) {
      // V44: TRUST THE DATABASE WHERE CLAUSE.
      // getNewsFromDB already filters by: isReady=true, isPublished=true,
      // slug IS NOT NULL, titleAr IS NOT NULL, generatedImage IS NOT NULL,
      // contentAr IS NOT NULL, aiAnalysis IS NOT NULL.
      // These are the EXACT same criteria the Publisher agent checks.
      // No additional filtering needed — the Publisher is the gatekeeper.
      // Previous V41 code applied EXTRA filters that were MORE strict than
      // the Publisher, causing ALL articles to be invisible on the site.
      const validatedItems = result.items;

      const newsItems = validatedItems.map(mapItemToResponse);

      if (isHomePage) {
        cachedNews = newsItems;
        cachedTotal = result.total;
        lastFetch = now;
      }

      return NextResponse.json({
        news: newsItems,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
        hasMore: offset + limit < result.total,
        cached: false,
        source: 'database',
        lastUpdate: new Date(now).toISOString(),
      });
    }

    // V50 DEBUG: Add diagnostic info when 0 articles returned
    let debugInfo: any = undefined;
    try {
      const { db } = await import('@/lib/db');
      const [isReadyCount, readyPublishedCount, withSlugCount] = await Promise.all([
        db.newsItem.count({ where: { isReady: true } }),
        db.newsItem.count({ where: { isReady: true, isPublished: true } }),
        db.newsItem.count({ where: { isReady: true, isPublished: true, slug: { not: '' } } }),
      ]);
      debugInfo = { isReady: isReadyCount, readyPublished: readyPublishedCount, withSlug: withSlugCount };
    } catch {}

    return NextResponse.json({
      news: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      hasMore: false,
      cached: false,
      loading: true,
      message: 'جاري تجهيز الأخبار بالعربية، يرجى المحاولة بعد دقيقة',
      retryAfter: 60,
      debug: debugInfo,
    });
  } catch (error: any) {
    if (error?.message?.includes('does not exist') || error?.message?.includes('relation')) {
      console.error('[NewsAPI] Tables missing! Re-initializing...');
      forceReinitDB();
      try {
        // V59: Removed ensureTablesExist() — just retry the query directly
        // V415: Use locale from query param in retry too
        const retryResult = await getNewsFromDB({ limit, offset, locale: locale as any, sortBy, sortOrder });
        if (retryResult.items.length > 0) {
          const validatedItems = retryResult.items;
          const newsItems = validatedItems.map(mapItemToResponse);
          return NextResponse.json({
            news: newsItems,
            total: retryResult.total,
            page,
            limit,
            totalPages: Math.ceil(retryResult.total / limit),
            hasMore: offset + limit < retryResult.total,
            cached: false,
            source: 'database-retry',
            lastUpdate: new Date(now).toISOString(),
          });
        }
      } catch (retryErr: any) {
        console.error('[NewsAPI] Retry failed:', retryErr.message?.slice(0, 200));
      }
    }
    console.error('[NewsAPI] Error:', error.message);
    return NextResponse.json({
      news: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      hasMore: false,
      error: error.message || 'Failed to load news',
      loading: true,
    });
  }
}
