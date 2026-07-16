// ─── Integration: Quote Proxy V3 ───────────────────────────
// Proxies real-time quote requests to the trading platform.
// Falls back to local financial APIs (Finnhub/Alpha Vantage) if
// the trading platform is unreachable or returns errors.
//
// Usage: GET /api/integration/quote?symbol=XAUUSD
// Auth: X-Integration-Key header OR rate-limited public access

import { NextRequest, NextResponse } from 'next/server';
import { authenticateIntegrationRequest, fetchFromTradingPlatform } from '@/lib/integration-auth';
import { getSyncCache, CacheKeys, CacheTTL } from '@/lib/integration-cache';
import { getQuote } from '@/lib/financial-apis';

export const dynamic = 'force-dynamic';

// Symbol mapping: common symbols → Alpha Vantage / Finnhub format
const LOCAL_SYMBOL_MAP: Record<string, string> = {
  'XAUUSD': 'OANDA:XAU_USD',
  'XAGUSD': 'OANDA:XAG_USD',
  'EURUSD': 'OANDA:EUR_USD',
  'GBPUSD': 'OANDA:GBP_USD',
  'USDJPY': 'OANDA:USD_JPY',
  'BTC-USDT': 'BINANCE:BTCUSDT',
  'ETH-USDT': 'BINANCE:ETHUSDT',
  'SOL-USDT': 'BINANCE:SOLUSDT',
  'XRP-USDT': 'BINANCE:XRPUSDT',
  'BNB-USDT': 'BINANCE:BNBUSDT',
  'XAU-USD': 'OANDA:XAU_USD',
  'XAG-USD': 'OANDA:XAG_USD',
  'CL-USD': 'OANDA:WTI_USD',
  'EUR-USD': 'OANDA:EUR_USD',
  'GBP-USD': 'OANDA:GBP_USD',
  'USD-JPY': 'OANDA:USD_JPY',
};

function toLocalSymbol(tpSymbol: string): string {
  return LOCAL_SYMBOL_MAP[tpSymbol.toUpperCase()] || tpSymbol;
}

export async function GET(request: NextRequest) {
  const { authenticated, rateLimited, rateLimitResult } = authenticateIntegrationRequest(request, 'quote');
  if (rateLimited) {
    return NextResponse.json(
      { error: 'تم تجاوز حد الطلبات. حاول لاحقاً.', retryAfterMs: rateLimitResult?.retryAfterMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult?.retryAfterMs || 60000) / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'symbol parameter is required' }, { status: 400 });
  }

  const cache = getSyncCache();
  const cacheKey = CacheKeys.quote(symbol);

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=5' } });
  }

  // Try trading platform first
  try {
    const response = await fetchFromTradingPlatform(
      `/api/integration/quote?symbol=${encodeURIComponent(symbol)}`
    );

    if (response.ok) {
      const data = await response.json();
      // Check if TP returned an error in the body (some TPs return 200 with error JSON)
      if (!data.error && (data.quote?.price || data.price)) {
        const result = { ...data, source: 'trading-platform' };
        await cache.set(cacheKey, result, CacheTTL.QUOTES);
        return NextResponse.json(result, { headers: { 'Cache-Control': 'public, max-age=5' } });
      } else {
        console.warn('[Integration Quote] TP returned OK but no valid quote:', JSON.stringify(data).slice(0, 200));
      }
    }
  } catch (error: any) {
    console.warn('[Integration Quote] Trading platform failed, trying fallback:', error?.message);
  }

  // Fallback: Use local financial APIs
  try {
    const localSymbol = toLocalSymbol(symbol);
    const quote = await getQuote(localSymbol);

    if (quote && quote.price > 0) {
      const result = {
        symbol,
        quote: {
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          high: quote.high,
          low: quote.low,
          open: quote.open,
          previousClose: quote.previousClose,
          volume: quote.volume,
          timestamp: quote.timestamp,
        },
        source: 'fallback',
      };
      await cache.set(cacheKey, result, CacheTTL.QUOTES);
      return NextResponse.json(result, { headers: { 'Cache-Control': 'public, max-age=15' } });
    }
  } catch (error: any) {
    console.warn('[Integration Quote] Fallback also failed:', error?.message);
  }

  return NextResponse.json(
    { error: 'فشل في جلب بيانات السعر من جميع المصادر', symbol },
    { status: 502 }
  );
}
