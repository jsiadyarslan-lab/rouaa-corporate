// ─── Turkish News API Route ──────────────────────────────────
// GET /api/tr/news — List Turkish news articles
// Filters by locale='tr', isReady=true, isPublished=true
// Supports pagination, category filtering, sentiment filtering

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { NEWS_CATEGORIES, type NewsCategoryId } from '@/lib/news-categories';
import { CATEGORY_AR_TO_TR, IMPACT_CONFIG_TR, SENTIMENT_CONFIG_TR } from '@/lib/locale';
import { TR_PIPELINE_CONFIG } from '@/lib/pipeline/tr-pipeline-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;
    const categoryId = searchParams.get('category') || undefined;
    const sentiment = searchParams.get('sentiment') || undefined;
    const sort = searchParams.get('sort') || undefined;
    const order = searchParams.get('order') || 'desc';

    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      return NextResponse.json({ news: [], total: 0, page, limit, totalPages: 0, hasMore: false });
    }

    // Build where clause for Turkish locale
    // ONLY show 'live' (RSS) news here. Stock analyses (newsType='article')
    // are shown on the dedicated Stock Analysis page.
    // Also exclude legacy broken stock-analysis stubs that have "Hisse Analizi:" prefix in title.
    const where: any = {
      locale: 'tr',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
      NOT: {
        title: { startsWith: 'Hisse Analizi:' },
      },
    };

    // Category filter: accept both category ID (e.g., 'forex') and Turkish DB category names
    if (categoryId) {
      const catConfig = NEWS_CATEGORIES.find(c => c.id === categoryId);
      if (catConfig) {
        // Match by categoryId field OR by any of the DB category strings
        where.OR = [
          { categoryId: categoryId },
          ...catConfig.dbCategories.map(dbCat => ({ category: dbCat })),
        ];
      } else {
        // Direct category string match
        where.category = categoryId;
      }
    }

    // Sentiment filter
    if (sentiment && ['positive', 'negative', 'neutral', 'bullish', 'bearish', 'cautious'].includes(sentiment)) {
      where.sentiment = sentiment;
    }

    // Determine orderBy based on sort parameter
    const orderBy = sort === 'views'
      ? { views: order === 'asc' ? 'asc' as const : 'desc' as const }
      : { fetchedAt: 'desc' as const };

    const [items, total] = await Promise.all([
      db.newsItem.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          slug: true,
          newsType: true,
          title: true,
          summary: true,
          category: true,
          categoryId: true,
          sentiment: true,
          sentimentScore: true,
          impactLevel: true,
          source: true,
          sourceName: true,
          url: true,
          imageUrl: true,
          publishedAt: true,
          fetchedAt: true,
          createdAt: true,
          views: true,
        },
      }),
      db.newsItem.count({ where }),
    ]);

    // Filter out items with Arabic-only titles (data quality guard)
    // Translate Arabic category names to Turkish for display
    const ARABIC_REGEX = /[\u0600-\u06FF]/;
    const CATEGORY_MAP_TR = TR_PIPELINE_CONFIG.CATEGORY_MAP_TR;
    const news = items
      .filter((item: any) => !ARABIC_REGEX.test(item.title || '')) // Skip Arabic-titled items
      .map((item: any) => ({
      id: item.id,
      slug: item.slug,
      newsType: item.newsType || 'live',
      title: item.title,
      summary: item.summary || '',
      category: CATEGORY_AR_TO_TR[item.category] || CATEGORY_MAP_TR[item.categoryId || ''] || (ARABIC_REGEX.test(item.category || '') ? (item.categoryId || 'Ekonomi') : item.category),
      categoryId: item.categoryId,
      sentiment: item.sentiment || 'neutral',
      sentimentScore: item.sentimentScore || 55,
      impactLevel: item.impactLevel || 'low',
      source: item.sourceName || item.source || '',
      url: item.url || '',
      imageUrl: `/api/article-image/${item.id}`,
      publishedAt: item.publishedAt?.toISOString() || null,
      fetchedAt: item.fetchedAt?.toISOString() || null,
      createdAt: item.createdAt?.toISOString() || null,
      views: item.views || 0,
    }));

    return NextResponse.json({
      news,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + limit < total,
    });
  } catch (error: any) {
    console.error('[TR News API] Hata:', error.message);
    return NextResponse.json(
      { error: 'Türk haberleri yüklenemedi', detail: error.message },
      { status: 500 }
    );
  }
}
