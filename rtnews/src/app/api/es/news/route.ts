// ─── Spanish News API Route ──────────────────────────────────
// GET /api/es/news — List Spanish news articles
// Filters by locale='es', isReady=true, isPublished=true

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { NEWS_CATEGORIES } from '@/lib/news-categories';
import { CATEGORY_AR_TO_ES, CATEGORY_NAME_ES } from '@/lib/locale';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;
    const categoryId = searchParams.get('category') || undefined;
    const sentiment = searchParams.get('sentiment') || undefined;

    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      return NextResponse.json({ news: [], total: 0, page, limit, totalPages: 0, hasMore: false });
    }

    // ONLY show 'live' (RSS) news here. Stock analyses (newsType='article')
    // are shown on the dedicated Stock Analysis page.
    // Also exclude legacy broken stock-analysis stubs with template titles.
    const where: any = {
      locale: 'es',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
      NOT: {
        OR: [
          { title: { startsWith: 'Análisis de acciones:' } },
          { title: { startsWith: '📈 Análisis de acciones:' } },
          { title: { startsWith: 'Stock Analysis:' } },
        ],
      },
    };

    if (categoryId) {
      const catConfig = NEWS_CATEGORIES.find(c => c.id === categoryId);
      if (catConfig) {
        where.OR = [
          { categoryId: categoryId },
          ...catConfig.dbCategories.map(dbCat => ({ category: dbCat })),
        ];
      } else {
        where.OR = [
          { categoryId: categoryId },
          { category: categoryId },
        ];
      }
    }

    if (sentiment && ['positive', 'negative', 'neutral'].includes(sentiment)) {
      where.sentiment = sentiment;
    }

    const sort = searchParams.get('sort') || undefined;
    const order = searchParams.get('order') || 'desc';

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
          generatedImage: true,
          publishedAt: true,
          fetchedAt: true,
          createdAt: true,
          views: true,
        },
      }),
      db.newsItem.count({ where }),
    ]);

    const ARABIC_REGEX = /[\u0600-\u06FF]/;
    const news = items.map(item => ({
      id: item.id,
      slug: item.slug,
      newsType: item.newsType || 'live',
      title: item.title,
      summary: item.summary || '',
      category: CATEGORY_AR_TO_ES[item.category] || CATEGORY_NAME_ES[item.categoryId || ''] || (ARABIC_REGEX.test(item.category || '') ? (item.categoryId || 'Economía') : item.category) || 'Economía',
      categoryId: item.categoryId,
      sentiment: item.sentiment || 'neutral',
      sentimentScore: item.sentimentScore || 55,
      impactLevel: item.impactLevel || 'low',
      source: item.sourceName || item.source || '',
      url: item.url || '',
      imageUrl: item.generatedImage
        ? (item.generatedImage.startsWith('http') ? item.generatedImage : `/api/article-image/${item.id}`)
        : (item.imageUrl || `/api/article-image/${item.id}`),
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
    console.error('[ES News API] Error:', error.message);
    return NextResponse.json(
      { error: 'Error al cargar noticias en español', detail: error.message },
      { status: 500 }
    );
  }
}
