import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API to fetch live market data from roua-trading platform.
 * Symbols: BTC/USDT, ETH/USDT, AAPL, TSLA, SPY, XAU/USD
 */

const PLATFORM_URL = process.env.TRADING_PLATFORM_URL || 'https://roua-trading-production.up.railway.app';

const DEFAULT_SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'XAU/USD', 'AAPL', 'TSLA', 'SPY'];

interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  source: string;
  timestamp: string;
}

export async function GET(req: NextRequest) {
  try {
    const symbolsParam = req.nextUrl.searchParams.get('symbols');
    const symbols = symbolsParam ? symbolsParam.split(',') : DEFAULT_SYMBOLS;

    const results: QuoteData[] = [];

    // Fetch quotes in parallel
    const fetches = symbols.map(async (symbol) => {
      try {
        const symbolPath = symbol.replace('/', '/');
        const url = `${PLATFORM_URL}/api/exchange/quote/${symbolPath}`;
        const resp = await fetch(url, {
          next: { revalidate: 30 },
          signal: AbortSignal.timeout(10000),
        });

        if (resp.ok) {
          const raw = await resp.json();
          const quote = raw?.data || raw;
          return {
            symbol: quote.symbol || symbol,
            name: quote.name || symbol,
            price: Number(quote.price) || 0,
            change: Number(quote.change) || 0,
            changePercent: Number(quote.changePercent) || 0,
            high: Number(quote.high) || 0,
            low: Number(quote.low) || 0,
            volume: Number(quote.volume) || 0,
            source: quote.source || 'roua-trading',
            timestamp: quote.timestamp || new Date().toISOString(),
          } as QuoteData;
        }
        return null;
      } catch {
        return null;
      }
    });

    const fetched = await Promise.allSettled(fetches);
    for (const r of fetched) {
      if (r.status === 'fulfilled' && r.value) {
        results.push(r.value);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch trading platform data' },
      { status: 500 }
    );
  }
}
