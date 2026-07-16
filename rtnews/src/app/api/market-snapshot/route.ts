import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/market-snapshot — Combined market overview data
export async function GET() {
  try {
    // Parallel fetch all data
    const [indicators, latestReports, latestAnalyses, sentimentCounts] = await Promise.all([
      // All indicators
      db.marketIndicator.findMany({ orderBy: [{ category: 'asc' }] }),
      // Latest 3 reports
      db.economicReport.findMany({
        where: { isPublished: true, locale: 'ar' },  // V337: Arabic market snapshot
        select: {
          id: true, title: true, slug: true, reportType: true,
          scope: true, marketImpact: true, confidenceScore: true,
          publishedAt: true,
        },
        take: 3,
        orderBy: { publishedAt: 'desc' },
      }),
      // Latest 3 analyses
      db.marketAnalysis.findMany({
        where: { isPublished: true, locale: 'ar' },  // V337: Arabic market snapshot
        select: {
          id: true, title: true, slug: true, assetClass: true,
          analysisType: true, sentiment: true, confidenceScore: true,
          riskLevel: true, publishedAt: true,
        },
        take: 3,
        orderBy: { publishedAt: 'desc' },
      }),
      // News sentiment distribution (last 7 days)
      db.newsItem.groupBy({
        by: ['sentiment'],
        where: {
          isReady: true,
          locale: 'ar',  // V337: Arabic sentiment only
          fetchedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count: { sentiment: true },
      }),
    ]);

    // Format sentiment
    const sentiment = {
      bullish: 0,
      bearish: 0,
      neutral: 0,
    };
    for (const s of sentimentCounts) {
      const key = s.sentiment as string;
      if (key === 'positive' || key === 'bullish') sentiment.bullish = s._count.sentiment;
      else if (key === 'negative' || key === 'bearish') sentiment.bearish = s._count.sentiment;
      else sentiment.neutral = s._count.sentiment;
    }

    // Category-based heatmap from news
    const categoryCounts = await db.newsItem.groupBy({
      by: ['category'],
      where: {
        isReady: true,
        locale: 'ar',  // V337: Arabic heatmap only
        fetchedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      _count: { category: true },
      _avg: { sentimentScore: true },
    });

    const heatmap = categoryCounts.map(c => ({
      category: c.category,
      count: c._count.category,
      avgSentiment: Math.round((c._avg.sentimentScore || 50)),
    }));

    // Top movers from indicators
    const topGainers = [...indicators]
      .filter(i => i.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);
    
    const topLosers = [...indicators]
      .filter(i => i.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    return NextResponse.json({
      indicators: indicators.map(i => ({ ...i, history: JSON.parse(i.history) })),
      latestReports,
      latestAnalyses,
      sentiment,
      heatmap,
      topGainers,
      topLosers,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[MarketSnapshot API]', error);
    return NextResponse.json({ error: 'فشل في تحميل لقطة السوق' }, { status: 500 });
  }
}
