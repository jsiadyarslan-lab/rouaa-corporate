import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/market-analyses/[id] — Single analysis by ID or slug
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const analysis = await db.marketAnalysis.findFirst({
      where: {
        isPublished: true,
        locale: 'ar',  // V-LOCALE: Only Arabic analyses for Arabic API
        OR: [{ id }, { slug: id }],
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'التحليل غير موجود' }, { status: 404 });
    }

    const parsed = {
      ...analysis,
      indicators: JSON.parse(analysis.indicators),
      priceTarget: JSON.parse(analysis.priceTarget),
      relatedNewsIds: JSON.parse(analysis.relatedNewsIds),
    };

    // Fetch related news articles (no locale filter — IDs are already specific to this analysis)
    const relatedNews = parsed.relatedNewsIds.length > 0
      ? await db.newsItem.findMany({
          where: { id: { in: parsed.relatedNewsIds }, isReady: true },
          select: {
            id: true, titleAr: true, title: true, slug: true,
            category: true, sentiment: true, fetchedAt: true,
          },
          take: 5,
        })
      : [];

    // Related analyses
    const related = await db.marketAnalysis.findMany({
      where: {
        isPublished: true,
        locale: 'ar',  // V-LOCALE
        id: { not: analysis.id },
        assetClass: analysis.assetClass,
      },
      select: {
        id: true, title: true, slug: true, assetClass: true,
        analysisType: true, sentiment: true, confidenceScore: true, publishedAt: true,
      },
      take: 4,
      orderBy: { publishedAt: 'desc' },
    });

    return NextResponse.json({ analysis: parsed, relatedNews, related });
  } catch (error: any) {
    console.error('[MarketAnalysis Detail API]', error);
    return NextResponse.json({ error: 'فشل في تحميل التحليل' }, { status: 500 });
  }
}
