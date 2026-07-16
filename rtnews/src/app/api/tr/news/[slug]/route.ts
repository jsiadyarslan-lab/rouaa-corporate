// ─── Turkish Single News Article API Route ───────────────────
// GET /api/tr/news/[slug] — Single Turkish article by slug
// Filters by locale='tr', isReady=true, isPublished=true

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || slug === 'undefined' || slug === 'null') {
      return NextResponse.json({ error: 'Slug gereklidir' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      return NextResponse.json({ error: 'Makale bulunamadı' }, { status: 404 });
    }

    // ROOT CAUSE FIX: Only allow news types (live/breaking) on the news slug API.
    // Previously had NO newsType filter, allowing stock analyses and other
    // non-news content to be loaded at /api/tr/news/[slug].
    const newsOnlyFilter: Record<string, any> = {
      locale: 'tr',
      isReady: true,
      isPublished: true,
      newsType: { in: ['live', 'breaking'] },
    };

    // Try slug match first
    let article = await db.newsItem.findFirst({
      where: { ...newsOnlyFilter, slug },
    });

    // Try ID match
    if (!article) {
      article = await db.newsItem.findFirst({
        where: { ...newsOnlyFilter, id: slug },
      });
    }

    // If not found as news, check if it's a stock analysis and return 404
    // (the page-level [slug] will redirect to the stock-analysis page)
    if (!article) {
      const stockArticle = await db.newsItem.findFirst({
        where: { locale: 'tr', isReady: true, isPublished: true, slug, source: 'stock-analysis-pipeline' },
        select: { id: true, newsType: true },
      });
      if (stockArticle) {
        return NextResponse.json({ error: 'Bu makale bir hisse analizidir, haber değildir', isStockAnalysis: true }, { status: 404 });
      }
    }

    if (!article) {
      return NextResponse.json({ error: 'Makale bulunamadı' }, { status: 404 });
    }

    // Increment views
    db.newsItem.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    }).catch(() => {});

    // Parse AI analysis
    let parsedAnalysis: any = {};
    try { parsedAnalysis = article.aiAnalysis ? JSON.parse(article.aiAnalysis) : {}; } catch {}

    // Parse affected assets
    let affectedAssets: any[] = [];
    try { affectedAssets = JSON.parse(article.affectedAssets || '[]'); } catch {}

    // Parse key takeaways
    let keyTakeaways: string[] = [];
    try {
      const raw = parsedAnalysis.keyTakeaways || parsedAnalysis.keyPoints;
      if (Array.isArray(raw)) {
        keyTakeaways = raw.map((item: any) =>
          typeof item === 'string' ? item : item?.text || item?.content || JSON.stringify(item)
        ).filter((s: string) => s.length > 0);
      }
    } catch {}

    return NextResponse.json({
      id: article.id,
      slug: article.slug,
      newsType: article.newsType || 'live',
      title: article.title,
      summary: article.summary || '',
      content: article.content || '',
      category: article.category,
      categoryId: article.categoryId,
      sentiment: article.sentiment || 'neutral',
      sentimentScore: article.sentimentScore || 55,
      impactLevel: article.impactLevel || 'low',
      source: article.sourceName || article.source || '',
      url: article.url || '',
      imageUrl: article.imageUrl || `/api/article-image/${article.id}`,
      affectedAssets,
      keyTakeaways,
      analysis: parsedAnalysis.analysis || null,
      publishedAt: article.publishedAt?.toISOString() || null,
      fetchedAt: article.fetchedAt?.toISOString() || null,
      createdAt: article.createdAt?.toISOString() || null,
      updatedAt: article.updatedAt?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('[TR News Slug API] Error:', error.message);
    return NextResponse.json(
      { error: 'Makale yüklenemedi', detail: error.message },
      { status: 500 }
    );
  }
}
