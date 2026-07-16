// ─── Arabic Markets API V62 ──────────────────────────────────
// Provides comprehensive Arabic/Gulf market data
// GET /api/arabic-markets — Get all Arabic market data
// GET /api/arabic-markets/overview — Arabic market overview

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getArabicMarketData, ARABIC_MARKET_INDICES } from '@/lib/arabic-markets';
import { apiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

// GET /api/arabic-markets
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    // Get Arabic market data (tries real APIs first, falls back to simulation)
    const arabicMarketData = await getArabicMarketData();

    // Get Arabic market indicators from DB
    const dbIndicators = await db.marketIndicator.findMany({
      where: { region: 'arabic' },
      select: {
        id: true, name: true, nameAr: true, symbol: true,
        value: true, change: true, changePercent: true,
        category: true, history: true, lastUpdated: true,
      },
    });

    // Build indices array combining simulated + DB data
    const indices = ARABIC_MARKET_INDICES.map(indexDef => {
      const simulated = arabicMarketData.find(d => d.symbol === indexDef.symbol);
      const dbInd = dbIndicators.find(d => d.symbol === indexDef.symbol);

      return {
        symbol: indexDef.symbol,
        name: indexDef.name,
        nameAr: indexDef.nameAr,
        country: indexDef.country,
        currency: indexDef.currency,
        value: simulated?.value || dbInd?.value || indexDef.baseValue,
        change: simulated?.change || dbInd?.change || 0,
        changePercent: simulated?.changePercent || dbInd?.changePercent || 0,
        history: simulated?.history || (dbInd ? JSON.parse(dbInd.history || '[]') : []),
        lastUpdated: dbInd?.lastUpdated || new Date(),
      };
    });

    // Get recent Arabic-scope news
    const arabicNews = await db.newsItem.findMany({
      where: {
        isReady: true,
        OR: [
          { category: { contains: 'عرب', mode: 'insensitive' } },
          { category: { contains: 'خليج', mode: 'insensitive' } },
          { category: { contains: 'سعود', mode: 'insensitive' } },
          { category: { contains: 'إمارات', mode: 'insensitive' } },
          { category: { contains: 'مصر', mode: 'insensitive' } },
        ],
      },
      select: {
        id: true, title: true, titleAr: true,
        summary: true, summaryAr: true,
        category: true, sentiment: true,
        impactLevel: true, slug: true,
        fetchedAt: true,
      },
      orderBy: { fetchedAt: 'desc' },
      take: 10,
    });

    // Get Arabic economic events
    const arabicCountries = ['SA', 'AE', 'EG', 'KW', 'QA', 'BH', 'OM'];
    const upcomingEvents = await db.economicEvent.findMany({
      where: {
        country: { in: arabicCountries },
        eventDate: { gte: new Date() },
      },
      select: {
        id: true, eventName: true, eventNameAr: true,
        country: true, currency: true, eventDate: true,
        importance: true, eventType: true,
        forecast: true, previous: true,
      },
      orderBy: { eventDate: 'asc' },
      take: 15,
    });

    // Get Arabic-scope reports
    const arabicReports = await db.economicReport.findMany({
      where: {
        isPublished: true,
        scope: 'arabic',
      },
      select: {
        id: true, title: true, slug: true, summary: true,
        reportType: true, marketImpact: true,
        confidenceScore: true, publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });

    // Top movers (based on change)
    const topGainers = [...indices]
      .sort((a, b) => b.changePercent - a.changePercent)
      .filter(i => i.changePercent > 0)
      .slice(0, 3);

    const topLosers = [...indices]
      .sort((a, b) => a.changePercent - b.changePercent)
      .filter(i => i.changePercent < 0)
      .slice(0, 3);

    // Performance comparison
    const performance = indices.map(idx => ({
      symbol: idx.symbol,
      nameAr: idx.nameAr,
      changePercent: idx.changePercent,
      performance: idx.history.length > 1
        ? ((idx.history[idx.history.length - 1].value - idx.history[0].value) / idx.history[0].value * 100)
        : 0,
    }));

    return NextResponse.json({
      indices,
      topGainers,
      topLosers,
      performance,
      news: arabicNews,
      events: upcomingEvents,
      reports: arabicReports,
      summary: {
        totalIndices: indices.length,
        gainers: indices.filter(i => i.changePercent > 0).length,
        losers: indices.filter(i => i.changePercent < 0).length,
        unchanged: indices.filter(i => i.changePercent === 0).length,
        averageChange: indices.length > 0
          ? indices.reduce((sum, i) => sum + i.changePercent, 0) / indices.length
          : 0,
      },
    });
  } catch (error) {
    return apiError(error, 'الأسواق العربية');
  }
}
