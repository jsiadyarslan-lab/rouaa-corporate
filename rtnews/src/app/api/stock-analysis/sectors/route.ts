import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';
    const sector = searchParams.get('sector') || undefined;

    if (sector) {
      // Get specific sector details with its stocks
      // Match both stockAnalysis.sector AND company.sector
      let analyses = await db.stockAnalysis.findMany({
        where: {
          isPublished: true,
          locale,
          OR: [
            { sector },
            { company: { sector } },
          ],
        },
        select: {
          id: true, symbol: true, title: true,
          price: true, change: true, changePercent: true,
          overallSignal: true, overallScore: true, confidenceScore: true,
          riskLevel: true, marketCap: true, peRatio: true, eps: true,
          company: { select: { name: true, nameAr: true, nameFr: true, logoUrl: true, country: true, sector: true } },
        },
        orderBy: { marketCap: 'desc' },
        take: 50,
      });

      // Fallback to English if no results for the requested locale
      if (analyses.length === 0 && locale !== 'en') {
        analyses = await db.stockAnalysis.findMany({
          where: {
            isPublished: true,
            locale: 'en',
            OR: [
              { sector },
              { company: { sector } },
            ],
          },
          select: {
            id: true, symbol: true, title: true,
            price: true, change: true, changePercent: true,
            overallSignal: true, overallScore: true, confidenceScore: true,
            riskLevel: true, marketCap: true, peRatio: true, eps: true,
            company: { select: { name: true, nameAr: true, nameFr: true, logoUrl: true, country: true, sector: true } },
          },
          orderBy: { marketCap: 'desc' },
          take: 50,
        });
      }

      const avgChange = analyses.length > 0
        ? analyses.reduce((sum, a) => sum + a.changePercent, 0) / analyses.length
        : 0;

      const signalCounts: Record<string, number> = {};
      analyses.forEach(a => { signalCounts[a.overallSignal] = (signalCounts[a.overallSignal] || 0) + 1; });

      return NextResponse.json({
        status: 'ok',
        sector,
        stockCount: analyses.length,
        avgChange,
        signalDistribution: signalCounts,
        totalMarketCap: analyses.reduce((sum, a) => sum + (a.marketCap || 0), 0),
        analyses,
      });
    }

    // Get all sectors with aggregated stats
    // Use company profiles as the primary source of sector data,
    // since stockAnalysis.sector is often null while company.sector has the correct value.
    // We fetch all analyses with their company profiles and aggregate sectors client-side.

    let analyses = await db.stockAnalysis.findMany({
      where: { isPublished: true, locale },
      select: {
        id: true,
        symbol: true,
        sector: true,
        changePercent: true,
        confidenceScore: true,
        marketCap: true,
        overallSignal: true,
        company: {
          select: { sector: true },
        },
      },
    });

    // Fallback to English if no results for the requested locale
    if (analyses.length === 0 && locale !== 'en') {
      analyses = await db.stockAnalysis.findMany({
        where: { isPublished: true, locale: 'en' },
        select: {
          id: true,
          symbol: true,
          sector: true,
          changePercent: true,
          confidenceScore: true,
          marketCap: true,
          overallSignal: true,
          company: {
            select: { sector: true },
          },
        },
      });
    }

    // Aggregate by effective sector (prefer company.sector, fallback to analysis.sector)
    const sectorMap: Record<string, {
      count: number;
      totalChange: number;
      totalConfidence: number;
      totalMarketCap: number;
      signals: Record<string, number>;
    }> = {};

    for (const a of analyses) {
      const effectiveSector = a.company?.sector || a.sector;
      if (!effectiveSector) continue; // skip entries with no sector at all

      if (!sectorMap[effectiveSector]) {
        sectorMap[effectiveSector] = {
          count: 0,
          totalChange: 0,
          totalConfidence: 0,
          totalMarketCap: 0,
          signals: {},
        };
      }

      const s = sectorMap[effectiveSector];
      s.count++;
      s.totalChange += a.changePercent || 0;
      s.totalConfidence += a.confidenceScore || 0;
      s.totalMarketCap += a.marketCap || 0;
      const sig = a.overallSignal || 'neutral';
      s.signals[sig] = (s.signals[sig] || 0) + 1;
    }

    const sectors = Object.entries(sectorMap)
      .map(([sector, data]) => ({
        sector,
        stockCount: data.count,
        avgChange: data.count > 0 ? data.totalChange / data.count : 0,
        avgConfidence: data.count > 0 ? data.totalConfidence / data.count : 0,
        totalMarketCap: data.totalMarketCap,
      }))
      .sort((a, b) => b.stockCount - a.stockCount);

    return NextResponse.json({
      status: 'ok',
      sectors,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SectorsAPI] Error:', message);
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
