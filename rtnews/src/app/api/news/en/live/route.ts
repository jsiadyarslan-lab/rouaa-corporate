// ─── English Live News API ──────────────────────────────────────
// Reads from database. Filters locale='en' for English articles.
// Uses English title directly — no Arabic title validation or display.
// Mirrors the Arabic /api/news/live route but for English content.

import { NextResponse } from 'next/server';
import { getNewsFromDB } from '@/lib/news-sources';
import { apiRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// ─── In-memory cache (2 min) ──────────────────────────────
let cachedNews: any[] = [];
let cachedTotal: number = 0;
let lastFetch = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes only

// Format news item for English display — use title directly, no Arabic fields
function formatNewsItem(item: any, dbId?: string) {
  const summary = item.summary || undefined;
  const slug = item.slug || undefined;

  return {
    id: dbId || item.id,
    slug,
    newsType: 'live' as const,
    title: item.title,
    summary,
    time: item.date || item.time || item.fetchedAt,
    source: item.source,
    url: item.url,
    category: item.category,
    sentiment: item.sentiment,
    sentimentScore: item.sentimentScore,
    impactLevel: item.impactLevel,
    originalLanguage: item.language || item.originalLanguage,
    imageUrl: item.imageUrl || `/api/article-image/${dbId || item.id}`,
    hasFullContent: true,
  };
}

export async function GET(request: Request) {
  try {
    const rateCheck = apiRateLimit.check(request);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetTime - Date.now()) / 1000)) } }
      );
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;
    const now = Date.now();

    // ── Read from DB — filter locale='en' ──
    const result = await getNewsFromDB({ limit, offset, locale: 'en' });

    if (result.items.length > 0) {
      // English: filter items with valid English title (no Arabic character check needed)
      const newsItems = result.items
        .filter((item) => item.title && item.title.length > 3)
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
      message: 'English news is being prepared, please try again in a minute',
      retryAfter: 60,
    });

  } catch (error: any) {
    console.error('[EnLiveNews] API error:', error.message);
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
