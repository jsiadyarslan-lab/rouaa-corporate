import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/reports/by-category — Fetch reports and analyses grouped by category
// Query params: category (assetClass), type (daily|weekly|monthly), limit, locale
// V-LOCALE: Added locale filtering to prevent Arabic/English mixing
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const reportType = searchParams.get('type');
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '6')));
    // V-LOCALE: Default to Arabic for backward compatibility
    const locale = searchParams.get('locale') || 'ar';

    const results: any = {};

    // Fetch MarketAnalyses by assetClass (for hourly categories)
    if (category) {
      // Strategic category comes from EconomicReport
      if (category === 'strategic') {
        const reports = await db.economicReport.findMany({
          where: { isPublished: true, reportType: 'strategic', locale },
          orderBy: { publishedAt: 'desc' },
          take: limit,
          select: {
            id: true, title: true, slug: true,
            reportType: true, scope: true, marketImpact: true,
            confidenceScore: true, publishedAt: true, createdAt: true,
          },
        });

        results.analyses = reports.map(r => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          assetClass: 'strategic',
          analysisType: 'strategic',
          timeFrame: 'long',
          riskLevel: 'medium',
          sentiment: r.marketImpact === 'bullish' ? 'bullish' : r.marketImpact === 'bearish' ? 'bearish' : 'neutral',
          confidenceScore: r.confidenceScore,
          priceTarget: {},
          publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
          validUntil: null,
          createdAt: r.createdAt.toISOString(),
        }));
      } else {
        const analyses = await db.marketAnalysis.findMany({
          where: { isPublished: true, assetClass: category, locale },
          orderBy: { publishedAt: 'desc' },
          take: limit,
          select: {
            id: true, title: true, slug: true, assetClass: true,
            analysisType: true, timeFrame: true, riskLevel: true,
            sentiment: true, confidenceScore: true, priceTarget: true,
            publishedAt: true, validUntil: true, createdAt: true,
          },
        });

        results.analyses = analyses.map(a => ({
          ...a,
          priceTarget: JSON.parse(a.priceTarget),
        }));
      }
    } else {
      // Fetch all categories at once
      const categories = ['strategic', 'economy', 'forex', 'crypto', 'energy', 'commodities', 'realEstate', 'banking', 'stocks', 'bonds', 'technicalAnalysis', 'arabMarkets', 'earnings', 'technology'];

      const categoryResults = await Promise.all(
        categories.map(async (cat) => {
          // Strategic reports come from EconomicReport with reportType='strategic'
          if (cat === 'strategic') {
            const reports = await db.economicReport.findMany({
              where: { isPublished: true, reportType: 'strategic', locale },
              orderBy: { publishedAt: 'desc' },
              take: 6,
              select: {
                id: true, title: true, slug: true,
                reportType: true, scope: true, marketImpact: true,
                confidenceScore: true, publishedAt: true, createdAt: true,
              },
            });

            return {
              category: cat,
              analyses: reports.map(r => ({
                id: r.id,
                title: r.title,
                slug: r.slug,
                assetClass: 'strategic',
                analysisType: 'strategic',
                timeFrame: 'long',
                riskLevel: 'medium',
                sentiment: r.marketImpact === 'bullish' ? 'bullish' : r.marketImpact === 'bearish' ? 'bearish' : 'neutral',
                confidenceScore: r.confidenceScore,
                priceTarget: {},
                publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
                validUntil: null,
                createdAt: r.createdAt.toISOString(),
              })),
            };
          }

          const analyses = await db.marketAnalysis.findMany({
            where: { isPublished: true, assetClass: cat, locale },
            orderBy: { publishedAt: 'desc' },
            take: 6,
            select: {
              id: true, title: true, slug: true, assetClass: true,
              analysisType: true, timeFrame: true, riskLevel: true,
              sentiment: true, confidenceScore: true, priceTarget: true,
              publishedAt: true, validUntil: true, createdAt: true,
            },
          });

          return {
            category: cat,
            analyses: analyses.map(a => ({
              ...a,
              priceTarget: JSON.parse(a.priceTarget),
            })),
          };
        })
      );

      results.categories = categoryResults;
    }

    // Fetch EconomicReports by type (for daily/weekly/monthly sections)
    if (reportType) {
      const reports = await db.economicReport.findMany({
        where: { isPublished: true, reportType, locale },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        select: {
          id: true, title: true, slug: true, summary: true,
          reportType: true, scope: true, marketImpact: true,
          confidenceScore: true, imageUrl: true,
          sectors: true, countries: true,
          publishedAt: true, createdAt: true,
        },
      });

      results.reports = reports.map(r => ({
        ...r,
        sectors: JSON.parse(r.sectors),
        countries: JSON.parse(r.countries),
      }));
    } else {
      // Fetch daily, weekly, monthly reports
      const [daily, weekly, monthly] = await Promise.all([
        db.economicReport.findMany({
          where: { isPublished: true, reportType: 'daily', locale },
          orderBy: { publishedAt: 'desc' },
          take: 6,
          select: {
            id: true, title: true, slug: true, summary: true,
            reportType: true, scope: true, marketImpact: true,
            confidenceScore: true, imageUrl: true,
            sectors: true, countries: true,
            publishedAt: true, createdAt: true,
          },
        }),
        db.economicReport.findMany({
          where: { isPublished: true, reportType: 'weekly', locale },
          orderBy: { publishedAt: 'desc' },
          take: 6,
          select: {
            id: true, title: true, slug: true, summary: true,
            reportType: true, scope: true, marketImpact: true,
            confidenceScore: true, imageUrl: true,
            sectors: true, countries: true,
            publishedAt: true, createdAt: true,
          },
        }),
        db.economicReport.findMany({
          where: { isPublished: true, reportType: 'monthly', locale },
          orderBy: { publishedAt: 'desc' },
          take: 6,
          select: {
            id: true, title: true, slug: true, summary: true,
            reportType: true, scope: true, marketImpact: true,
            confidenceScore: true, imageUrl: true,
            sectors: true, countries: true,
            publishedAt: true, createdAt: true,
          },
        }),
      ]);

      const parseReport = (r: any) => ({
        ...r,
        sectors: JSON.parse(r.sectors),
        countries: JSON.parse(r.countries),
      });

      results.daily = daily.map(parseReport);
      results.weekly = weekly.map(parseReport);
      results.monthly = monthly.map(parseReport);
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[Reports By-Category API]', error);
    return NextResponse.json({ error: 'فشل في تحميل التقارير' }, { status: 500 });
  }
}
