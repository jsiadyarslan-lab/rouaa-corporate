// ─── Trending Articles API V2 ────────────────────────────────
// GET /api/trending?locale=ar&limit=5
//
// Smart trending algorithm that NEVER shows static data:
//
// 1. Primary: Score = views × recency_decay × impact_bonus
//    - Recency: exponential decay (half-life ~36h) — fresh articles rank higher
//    - Impact: critical=1.5x, high=1.3x, medium=1.1x, low=1.0x
//    - Even with views=0, the recency decay creates a dynamic, changing ranking
//
// 2. Category diversity: Ensures no single category dominates the list
//
// 3. Time windows: 14-day window with fallback to 30 days, then all-time
//
// 4. Cache: 3-minute in-memory cache to avoid DB hammering

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── In-memory cache (3 min) ──────────────────────────────────
let cachedTrending: Record<string, { items: any[]; timestamp: number }> = {};
const CACHE_TTL = 3 * 60 * 1000;

function calculateTrendingScore(
  views: number,
  publishedAt: Date | null,
  fetchedAt: Date,
  impactLevel: string
): number {
  const now = Date.now();
  const articleDate = publishedAt ? new Date(publishedAt).getTime() : new Date(fetchedAt).getTime();
  const ageHours = Math.max(0, (now - articleDate) / (1000 * 60 * 60));

  // Recency: exponential decay with half-life ~36 hours
  // < 6h  → ~1.0  (very fresh)
  // < 24h → ~0.63
  // < 48h → ~0.39
  // < 72h → ~0.25
  // < 168h → ~0.04 (7 days — very low)
  const recencyMultiplier = Math.exp(-ageHours * Math.LN2 / 36);

  // Impact bonus
  const impactBonus: Record<string, number> = {
    'critical': 1.5,
    'high': 1.3,
    'medium': 1.1,
    'low': 1.0,
  };
  const bonus = impactBonus[impactLevel] || 1.0;

  // Views: add 1 so articles with 0 views still get a score from recency
  const viewScore = views + 1;

  return viewScore * recencyMultiplier * bonus;
}

function formatItem(item: any): any {
  return {
    id: item.id,
    title: item.title,
    titleAr: item.titleAr || undefined,
    slug: item.slug,
    views: item.views || 0,
    category: item.category || 'اقتصاد كلي',
    categoryId: item.categoryId || undefined,
    publishedAt: item.publishedAt?.toISOString() || null,
    fetchedAt: item.fetchedAt?.toISOString() || null,
    imageUrl: `/api/article-image/${item.id}`,
    sentiment: item.sentiment || 'neutral',
    impactLevel: item.impactLevel || 'low',
    trendingScore: 0,
  };
}

function buildWhere(locale: string, timeWindow?: Date): any {
  const where: any = {
    isReady: true,
    isPublished: true,
    slug: { not: '' },
    newsType: { in: ['live', 'breaking'] },
  };

  if (locale === 'ar') {
    where.titleAr = { not: '' };
    where.locale = 'ar';
  } else {
    where.title = { not: '' };
    where.locale = locale;
  }

  if (timeWindow) {
    where.fetchedAt = { gte: timeWindow };
  }

  return where;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'ar';
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '5')));

    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      return NextResponse.json({ articles: [], source: 'no-db' });
    }

    // Check cache
    const cacheKey = `${locale}:${limit}`;
    const cached = cachedTrending[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return NextResponse.json({ articles: cached.items, source: 'cache' });
    }

    const selectFields = {
      id: true,
      title: true,
      titleAr: true,
      slug: true,
      views: true,
      category: true,
      categoryId: true,
      publishedAt: true,
      fetchedAt: true,
      sentiment: true,
      impactLevel: true,
      source: true,
      sourceName: true,
    };

    // Try progressively wider time windows
    const timeWindows = [
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
      undefined, // all time
    ];

    let items: any[] = [];

    for (const timeWindow of timeWindows) {
      const where = buildWhere(locale, timeWindow);
      try {
        const result = await db.newsItem.findMany({
          where,
          orderBy: [
            { views: 'desc' },
            { fetchedAt: 'desc' },
          ],
          take: Math.max(limit * 5, 50),
          select: selectFields,
        });
        if (result.length > 0) {
          items = result;
          break;
        }
      } catch (dbErr: any) {
        console.warn('[Trending API] DB query failed for window:', timeWindow?.toISOString() || 'all', dbErr.message);
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ articles: [], source: 'no-articles' });
    }

    // Calculate trending scores
    const scored = items.map(item => {
      const score = calculateTrendingScore(
        item.views || 0,
        item.publishedAt,
        item.fetchedAt,
        item.impactLevel || 'low'
      );
      return { ...formatItem(item), trendingScore: score };
    });

    // Sort by trending score (descending)
    scored.sort((a, b) => b.trendingScore - a.trendingScore);

    // Category diversity: ensure we don't show 5 articles from the same category
    // Pick top articles but prefer category diversity
    const selected: any[] = [];
    const categoryCount: Record<string, number> = {};
    const maxPerCategory = Math.max(2, Math.ceil(limit / 2)); // Max 2 articles per category for limit=5

    for (const article of scored) {
      if (selected.length >= limit) break;
      const cat = article.categoryId || article.category || 'unknown';
      const currentCount = categoryCount[cat] || 0;
      if (currentCount < maxPerCategory) {
        selected.push(article);
        categoryCount[cat] = currentCount + 1;
      }
    }

    // If we didn't get enough due to diversity constraint, fill with remaining
    if (selected.length < limit) {
      const selectedIds = new Set(selected.map(a => a.id));
      for (const article of scored) {
        if (selected.length >= limit) break;
        if (!selectedIds.has(article.id)) {
          selected.push(article);
        }
      }
    }

    // Update cache
    cachedTrending[cacheKey] = { items: selected, timestamp: Date.now() };

    return NextResponse.json({ articles: selected, source: 'trending' });
  } catch (error: any) {
    console.error('[Trending API] Error:', error.message);
    return NextResponse.json(
      { articles: [], error: 'Failed to load trending articles' },
      { status: 500 }
    );
  }
}
