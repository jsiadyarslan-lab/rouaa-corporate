import { NextRequest, NextResponse } from 'next/server';
import { getStockScreener, type StockScreenerQuery } from '@/lib/financial-apis';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sector = searchParams.get('sector') || undefined;
    const signal = searchParams.get('signal') || undefined;
    const search = searchParams.get('search') || undefined;
    const marketCapMin = searchParams.get('marketCapMin') ? Number(searchParams.get('marketCapMin')) : undefined;
    const marketCapMax = searchParams.get('marketCapMax') ? Number(searchParams.get('marketCapMax')) : undefined;
    const peMin = searchParams.get('peMin') ? Number(searchParams.get('peMin')) : undefined;
    const peMax = searchParams.get('peMax') ? Number(searchParams.get('peMax')) : undefined;
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');

    const query: StockScreenerQuery = {
      sector,
      marketCapMin,
      marketCapMax,
      peMin,
      peMax,
      limit: limit * 2, // fetch extra for filtering
    };

    let stocks = await getStockScreener(query);

    // Filter by signal if specified
    if (signal && signal !== 'all') {
      // We can't filter by signal from FMP directly, so we'd need technical analysis
      // For now, filter by changePercent direction as a proxy
      if (signal === 'bullish') {
        stocks = stocks.filter(s => s.changePercent > 1);
      } else if (signal === 'bearish') {
        stocks = stocks.filter(s => s.changePercent < -1);
      } else {
        stocks = stocks.filter(s => Math.abs(s.changePercent) <= 1);
      }
    }

    // Filter by search term
    if (search) {
      const q = search.toLowerCase();
      stocks = stocks.filter(s =>
        s.symbol.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q)
      );
    }

    // Paginate
    const start = (page - 1) * limit;
    const paginatedStocks = stocks.slice(start, start + limit);

    return NextResponse.json({
      stocks: paginatedStocks,
      total: stocks.length,
      page,
      limit,
      totalPages: Math.ceil(stocks.length / limit),
    });
  } catch (error) {
    console.error('[StockAnalysis] List error:', error);
    return NextResponse.json({ error: 'Failed to list stocks' }, { status: 500 });
  }
}
