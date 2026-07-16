// ─── Turkish Live News API Route ────────────────────────────
// Returns published Turkish articles for the /tr frontend.
// V2: Direct DB query (like ES/FR live routes) instead of getNewsFromDB
//     which incorrectly requires titleAr for non-English locales.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      return NextResponse.json({ articles: [], count: 0 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const category = searchParams.get('category');

    const where: any = {
      locale: 'tr',
      isReady: true,
      isPublished: true,
      slug: { not: '' },
      title: { not: '' },
      // ROOT CAUSE FIX: Use POSITIVE whitelist (newsType: 'live') instead of
      // negative blacklist ({ not: 'stock_analysis' }). The blacklist approach
      // allowed articles with newsType='article' or 'analysis' to leak into
      // the news feed. Only newsType='live' and 'breaking' are legitimate news.
      newsType: { in: ['live', 'breaking'] },
    };

    if (category) {
      where.OR = [
        { categoryId: category },
        { category: category },
      ];
    }

    const [articles, total] = await Promise.all([
      db.newsItem.findMany({
        where,
        orderBy: { fetchedAt: 'desc' },
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
          impactScore: true,
          source: true,
          sourceName: true,
          url: true,
          imageUrl: true,
          generatedImage: true,
          publishedAt: true,
          fetchedAt: true,
        },
      }),
      db.newsItem.count({ where }),
    ]);

    const formatted = articles
      .filter(a => !/[\u0600-\u06FF]/.test(a.title || ''))
      .map(a => ({
        id: a.id,
        slug: a.slug || undefined,
        newsType: a.newsType || 'live',
        title: a.title || '',
        summary: a.summary || '',
        category: a.category || 'Ekonomi',
        categoryId: a.categoryId || undefined,
        sentiment: a.sentiment || 'neutral',
        sentimentScore: a.sentimentScore || 55,
        impactLevel: a.impactLevel || 'low',
        impactScore: a.impactScore || 0,
        source: a.sourceName || a.source || '',
        url: a.url || '',
        imageUrl: a.generatedImage
          ? (a.generatedImage.startsWith('http') ? a.generatedImage : `/api/article-image/${a.id}`)
          : a.imageUrl || `/api/article-image/${a.id}`,
        time: a.publishedAt?.toISOString() || a.fetchedAt?.toISOString() || new Date().toISOString(),
        hasFullContent: true,
      }));

    return NextResponse.json({ articles: formatted, count: total });
  } catch (err: any) {
    console.error('[TR Live API] Error:', err.message);
    return NextResponse.json({ articles: [], count: 0, error: err.message }, { status: 500 });
  }
}
