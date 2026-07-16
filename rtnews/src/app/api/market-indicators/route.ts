import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/market-indicators — List market indicators
// Query params: category, region
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const region = searchParams.get('region');

    const where: any = {};
    if (category) where.category = category;
    if (region) where.region = region;

    const indicators = await db.marketIndicator.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { region: 'asc' },
      ],
    });

    return NextResponse.json({
      indicators: indicators.map(ind => ({
        ...ind,
        history: JSON.parse(ind.history),
      })),
      lastUpdated: indicators.length > 0 
        ? indicators.reduce((latest, ind) => 
            ind.lastUpdated > latest ? ind.lastUpdated : latest, 
            indicators[0].lastUpdated
          ).toISOString()
        : null,
    });
  } catch (error: any) {
    console.error('[MarketIndicators API]', error);
    return NextResponse.json({ error: 'فشل في تحميل المؤشرات' }, { status: 500 });
  }
}
