import { NextRequest, NextResponse } from 'next/server';
import { getStockScreener, type StockScreenerQuery } from '@/lib/financial-apis';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const signal = searchParams.get('signal') || undefined;
    const sector = searchParams.get('sector') || undefined;
    const marketCapMin = searchParams.get('marketCapMin') ? Number(searchParams.get('marketCapMin')) : undefined;
    const marketCapMax = searchParams.get('marketCapMax') ? Number(searchParams.get('marketCapMax')) : undefined;
    const peMin = searchParams.get('peMin') ? Number(searchParams.get('peMin')) : undefined;
    const peMax = searchParams.get('peMax') ? Number(searchParams.get('peMax')) : undefined;
    const sort = searchParams.get('sort') || 'marketCap';
    const limit = Number(searchParams.get('limit') || '30');

    const query: StockScreenerQuery = {
      sector,
      marketCapMin,
      marketCapMax,
      peMin,
      peMax,
      limit,
    };

    let stocks = await getStockScreener(query);

    // Filter by signal
    if (signal && signal !== 'all') {
      if (signal === 'bullish') {
        stocks = stocks.filter(s => s.changePercent > 1);
      } else if (signal === 'bearish') {
        stocks = stocks.filter(s => s.changePercent < -1);
      } else {
        stocks = stocks.filter(s => Math.abs(s.changePercent) <= 1);
      }
    }

    // Sort
    if (sort === 'marketCap') {
      stocks.sort((a, b) => b.marketCap - a.marketCap);
    } else if (sort === 'changePercent') {
      stocks.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
    } else if (sort === 'peRatio') {
      stocks.sort((a, b) => (a.peRatio || 999) - (b.peRatio || 999));
    } else if (sort === 'dividendYield') {
      stocks.sort((a, b) => b.dividendYield - a.dividendYield);
    }

    return NextResponse.json({
      stocks: stocks.slice(0, limit),
      total: stocks.length,
      filters: { signal, sector, marketCapMin, marketCapMax, peMin, peMax },
    });
  } catch (error) {
    console.error('[StockAnalysis] Screener error:', error);
    return NextResponse.json({ error: 'Failed to screen stocks' }, { status: 500 });
  }
}
