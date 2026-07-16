import { db } from '@/lib/db';
import MarketPulseClient from './MarketPulseClient';

export const revalidate = 60;
export default async function MarketPulsePage() {
  const indicators = await db.marketIndicator.findMany({
    orderBy: [{ category: 'asc' }, { region: 'asc' }],
  });

  const latestReports = await db.economicReport.findMany({
    where: { isPublished: true },
    select: { id: true, title: true, slug: true, reportType: true, marketImpact: true, confidenceScore: true, publishedAt: true },
    take: 4,
    orderBy: { publishedAt: 'desc' },
  });

  const latestAnalyses = await db.marketAnalysis.findMany({
    where: { isPublished: true },
    select: { id: true, title: true, slug: true, assetClass: true, sentiment: true, confidenceScore: true, riskLevel: true, publishedAt: true },
    take: 4,
    orderBy: { publishedAt: 'desc' },
  });

  // Sentiment from news
  const sentimentCounts = await db.newsItem.groupBy({
    by: ['sentiment'],
    where: { isReady: true, fetchedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    _count: { sentiment: true },
  });

  const sentiment = { bullish: 0, bearish: 0, neutral: 0 };
  for (const s of sentimentCounts) {
    const key = s.sentiment as string;
    if (key === 'positive' || key === 'bullish') sentiment.bullish = s._count.sentiment;
    else if (key === 'negative' || key === 'bearish') sentiment.bearish = s._count.sentiment;
    else sentiment.neutral = s._count.sentiment;
  }

  // Category heatmap
  const categoryCounts = await db.newsItem.groupBy({
    by: ['category'],
    where: { isReady: true, fetchedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    _count: { category: true },
    _avg: { sentimentScore: true },
  });

  const heatmap = categoryCounts.map(c => ({
    category: c.category,
    count: c._count.category,
    avgSentiment: Math.round(c._avg.sentimentScore || 50),
  }));

  return (
    <MarketPulseClient
      initialIndicators={indicators.map(i => ({ ...i, history: JSON.parse(i.history), lastUpdated: i.lastUpdated.toISOString() }))}
      latestReports={latestReports}
      latestAnalyses={latestAnalyses}
      sentiment={sentiment}
      heatmap={heatmap}
    />
  );
}
