// ─── TG News API ─────────────────────────────────────────────
// GET /api/tg/news?page=1&limit=15
// Returns paginated news items for the Telegram Mini App

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '15', 10)));

    const skip = (page - 1) * limit;

    const where = {
      isPublished: true,
      isReady: true,
    };

    const [news, total] = await Promise.all([
      db.newsItem.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          titleAr: true,
          title: true,
          category: true,
          impactLevel: true,
          slug: true,
          publishedAt: true,
          newsType: true,
          sentiment: true,
        },
      }),
      db.newsItem.count({ where }),
    ]);

    const hasMore = skip + limit < total;

    const newsItems = news.map((item) => ({
      id: item.id,
      titleAr: item.titleAr || item.title,
      title: item.title,
      category: item.category,
      impactLevel: item.impactLevel || 'low',
      slug: item.slug,
      publishedAt: item.publishedAt,
      newsType: item.newsType,
      sentiment: item.sentiment,
    }));

    return NextResponse.json({
      news: newsItems,
      total,
      hasMore,
    });
  } catch (error: any) {
    console.error('[TG News API] Error:', error.message);
    return NextResponse.json(
      { news: [], total: 0, hasMore: false, error: 'حدث خطأ أثناء جلب الأخبار' },
      { status: 500 }
    );
  }
}
