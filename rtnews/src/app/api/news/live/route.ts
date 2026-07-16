// ─── Live News API V46 ──────────────────────────────────────────
// V46: Removed isArticleComplete() extra validation — TRUST THE PUBLISHER.
// The DB WHERE clause in getNewsFromDB already ensures isReady=true, isPublished=true,
// slug, titleAr, generatedImage, contentAr, aiAnalysis are all present.
// The previous isArticleComplete() added redundant checks that could filter out
// valid published articles in edge cases (e.g., slightly different Arabic ratio thresholds).
// Debug mode (?debug=1) is still available for diagnostics.
// V43: Fixed critical bug where generatedImage was dropped from getNewsFromDB output,
// causing isArticleComplete to filter out ALL articles.
// Added ?debug=1 parameter for diagnostics.

import { NextResponse } from 'next/server';
import { getNewsFromDB } from '@/lib/news-sources';
import { apiRateLimit } from '@/lib/rate-limit';
import { generateSlug } from '@/lib/slug';
import { db } from '@/lib/db';

export const revalidate = 120; // ISR: revalidate every 2 minutes — news changes slowly

// ─── In-memory cache (2 min, no persistence to disk) ──────────
let cachedNews: any[] = [];
let cachedTotal: number = 0;
let lastFetch = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes only

// V59: Simplified — getNewsFromDB no longer returns generatedImage/aiAnalysis in lists
function formatNewsItem(item: any, dbId?: string) {
  const titleAr = item.titleAr || undefined;
  const rawSummaryAr = item.summaryAr || undefined;
  const summaryAr = rawSummaryAr
    ? rawSummaryAr.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
    : undefined;
  const isTitleArArabic = titleAr && /[\u0600-\u06FF]/.test(titleAr);
  const displayTitle = isTitleArArabic ? titleAr : '';

  // V-LOCALE: Only use the slug from the database — NEVER generate a fake slug
  // Generated slugs don't exist in the DB, causing 404 errors when users click links
  const slug = item.slug || undefined;

  return {
    id: dbId || item.id,
    slug,
    newsType: 'live' as const,
    title: item.title,
    titleAr,
    summary: item.summary,
    summaryAr,
    time: item.date || item.time || item.fetchedAt,
    source: item.source,
    url: item.url,
    category: item.category,
    sentiment: item.sentiment,
    sentimentScore: item.sentimentScore,
    impactLevel: item.impactLevel,
    originalLanguage: item.language || item.originalLanguage,
    // V59: imageUrl is always the proxy route — generatedImage not in list queries
    imageUrl: item.imageUrl || `/api/article-image/${dbId || item.id}`,
    translatedTitle: titleAr || undefined,
    translatedSummary: summaryAr || undefined,
    hasFullContent: true, // V59: All published articles have full content
  };
}

export async function GET(request: Request) {
  try {
    // V59: Removed ensureTablesExist() — was doing ALTER TABLE on every API call

    const rateCheck = apiRateLimit.check(request);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'طلبات كثيرة جداً. حاول مرة أخرى بعد دقيقة.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetTime - Date.now()) / 1000)) } }
      );
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;
    const now = Date.now();

    // ── Read from DB ──
    // FIX: Always filter locale='ar' — this is the Arabic news API.
    // Without this filter, English articles leak into Arabic pages,
    // causing broken links (/article/{english-slug}) that render
    // English content in an Arabic shell or return 404.
    const result = await getNewsFromDB({ limit, offset, locale: 'ar' });

    if (result.items.length > 0) {
      // V46: TRUST THE PUBLISHER — no extra isArticleComplete() filtering.
      // The DB WHERE clause already guarantees isReady=true, isPublished=true,
      // and all required fields (slug, titleAr, generatedImage, contentAr, aiAnalysis).
      // Previous extra filtering could silently exclude valid published articles.
      // LOCALE GUARD: Also filter out items whose titleAr doesn't contain Arabic text.
      // This prevents English-only titles from leaking into the Arabic news feed.
      const ARABIC_REGEX = /[\u0600-\u06FF]/;
      const newsItems = result.items
        .filter((item) => ARABIC_REGEX.test(item.titleAr || ''))
        .map((item) => formatNewsItem(item, item.id));

      if (page === 1 && limit === 20) {
        cachedNews = newsItems;
        cachedTotal = newsItems.length;
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
    });

  } catch (error: any) {
    console.error('[LiveNews] API error:', error.message);
    return NextResponse.json({
      news: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      hasMore: false,
      error: error.message || 'Failed to load news',
      loading: true,
      retryAfter: 30,
    });
  }
}
