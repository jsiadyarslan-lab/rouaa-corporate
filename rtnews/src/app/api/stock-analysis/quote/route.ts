// ─── Stock Quote API Route ────────────────────────────────────
// GET /api/stock-analysis/quote?symbol=AAPL
//
// Fetches real-time quote and company fundamentals from external
// financial APIs. Proxies requests through the server-side
// financial-apis module to keep API keys secure.
//
// Returns: { quote, fundamentals }

import { NextRequest, NextResponse } from 'next/server';
import { getQuote, getCompanyFundamentals } from '@/lib/financial-apis';

export const dynamic = 'force-dynamic';

// ─── GET Handler ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.trim().toUpperCase();

    if (!symbol) {
      return NextResponse.json(
        { status: 'error', message: 'Symbol query parameter is required. Example: ?symbol=AAPL' },
        { status: 400 }
      );
    }

    // Fetch quote and fundamentals in parallel
    const [quote, fundamentals] = await Promise.all([
      getQuote(symbol),
      getCompanyFundamentals(symbol),
    ]);

    if (!quote && !fundamentals) {
      return NextResponse.json(
        {
          status: 'error',
          message: `No data available for symbol "${symbol}". Check that the symbol is valid and API keys are configured.`,
          symbol,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      symbol,
      quote: quote
        ? {
            symbol: quote.symbol,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            high: quote.high,
            low: quote.low,
            open: quote.open,
            volume: quote.volume,
            previousClose: quote.previousClose,
            timestamp: quote.timestamp,
          }
        : null,
      fundamentals: fundamentals
        ? {
            symbol: fundamentals.symbol,
            name: fundamentals.name,
            exchange: fundamentals.exchange,
            sector: fundamentals.sector,
            industry: fundamentals.industry,
            marketCap: fundamentals.marketCap,
            peRatio: fundamentals.peRatio,
            eps: fundamentals.eps,
            dividendYield: fundamentals.dividendYield,
            beta: fundamentals.beta,
            ceo: fundamentals.ceo,
            country: fundamentals.country,
            website: fundamentals.website,
            employees: fundamentals.employees,
            description: fundamentals.description,
            price: fundamentals.price,
            change: fundamentals.change,
            changePercent: fundamentals.changePercent,
          }
        : null,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[StockQuote API] Error:', message);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch stock quote', error: message },
      { status: 500 }
    );
  }
}
