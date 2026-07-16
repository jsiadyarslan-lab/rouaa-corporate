// ─── Integration: Sparkline Data V3 ────────────────────────
// Returns compact sparkline data (last N close prices) for a symbol.
// Tries trading platform first, then falls back to local Alpha Vantage.
//
// Usage: GET /api/integration/sparkline?symbol=XAUUSD&points=13
// Auth: X-Integration-Key header OR rate-limited public access

import { NextRequest, NextResponse } from 'next/server';
import { authenticateIntegrationRequest, fetchFromTradingPlatform } from '@/lib/integration-auth';
import { getSyncCache, CacheKeys, CacheTTL } from '@/lib/integration-cache';
import { getHistoricalData, getFinnhubCandleData } from '@/lib/financial-apis';

export const dynamic = 'force-dynamic';

// Symbol mapping for local APIs
const LOCAL_SYMBOL_MAP: Record<string, string> = {
  'BTC-USDT': 'BTCUSD',
  'ETH-USDT': 'ETHUSD',
  'SOL-USDT': 'SOLUSD',
  'XRP-USDT': 'XRPUSD',
  'BNB-USDT': 'BNBUSD',
  'XAU-USD': 'XAUUSD',
  'XAUUSD': 'XAUUSD',
  'XAG-USD': 'XAGUSD',
  'XAGUSD': 'XAGUSD',
  'CL-USD': 'CLUSD',
  'EUR-USD': 'EURUSD',
  'EURUSD': 'EURUSD',
  'GBP-USD': 'GBPUSD',
  'GBPUSD': 'GBPUSD',
  'USD-JPY': 'USDJPY',
  'USDJPY': 'USDJPY',
  'DXY-USD': 'DXY',
};

function toLocalSymbol(tpSymbol: string): string {
  return LOCAL_SYMBOL_MAP[tpSymbol.toUpperCase()] || tpSymbol;
}

export async function GET(request: NextRequest) {
  const { authenticated, rateLimited, rateLimitResult } = authenticateIntegrationRequest(request, 'sparkline');
  if (rateLimited) {
    return NextResponse.json(
      { error: 'تم تجاوز حد الطلبات. حاول لاحقاً.', retryAfterMs: rateLimitResult?.retryAfterMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult?.retryAfterMs || 60000) / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const points = parseInt(searchParams.get('points') || '13', 10);

  if (!symbol) {
    return NextResponse.json({ error: 'symbol parameter is required' }, { status: 400 });
  }

  const cache = getSyncCache();
  const cacheKey = CacheKeys.sparkline(`${symbol}-${points}`);

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=30' } });
  }

  // Try trading platform first (1hour → 1day fallback)
  try {
    // Try 1hour interval first (better granularity for sparklines)
    let sparkline = await fetchSparklineFromTP(symbol, '1hour', points);

    // Fallback to 1day interval for symbols without hourly data
    if (sparkline.length < 2) {
      sparkline = await fetchSparklineFromTP(symbol, '1day', points);
    }

    if (sparkline.length >= 2) {
      sparkline = sparkline.slice(-points);
      const result = { symbol, sparkline, count: sparkline.length, source: 'trading-platform' };
      await cache.set(cacheKey, result, CacheTTL.SPARKLINE);
      return NextResponse.json(result, { headers: { 'Cache-Control': 'public, max-age=30' } });
    }
  } catch (error: any) {
    console.warn('[Integration Sparkline] Trading platform failed, trying fallback:', error?.message);
  }

  // Fallback 1: Use local financial APIs (Alpha Vantage + Finnhub daily)
  try {
    const localSymbol = toLocalSymbol(symbol);
    const history = await getHistoricalData(localSymbol, Math.min(points * 2, 60));

    if (history && history.length > 0) {
      const sparkline = history
        .slice(-points)
        .map(p => p.close)
        .filter(v => v > 0);

      if (sparkline.length >= 2) {
        const result = { symbol, sparkline, count: sparkline.length, source: 'fallback' };
        await cache.set(cacheKey, result, CacheTTL.SPARKLINE);
        return NextResponse.json(result, { headers: { 'Cache-Control': 'public, max-age=60' } });
      }
    }
  } catch (error: any) {
    console.warn('[Integration Sparkline] Alpha Vantage/Finnhub daily fallback failed:', error?.message);
  }

  // Fallback 2: Try Finnhub hourly candles directly
  try {
    const finnhubSymbolMap: Record<string, string> = {
      'BTC-USDT': 'BINANCE:BTCUSDT',
      'ETH-USDT': 'BINANCE:ETHUSDT',
      'XAU-USD': 'OANDA:XAU_USD',
      'XAG-USD': 'OANDA:XAG_USD',
      'EUR-USD': 'OANDA:EUR_USD',
      'GBP-USD': 'OANDA:GBP_USD',
      'USD-JPY': 'OANDA:USD_JPY',
      'XAUUSD': 'OANDA:XAU_USD',
      'XAGUSD': 'OANDA:XAG_USD',
      'EURUSD': 'OANDA:EUR_USD',
      'GBPUSD': 'OANDA:GBP_USD',
      'USDJPY': 'OANDA:USD_JPY',
    };
    const fhSymbol = finnhubSymbolMap[symbol.toUpperCase()] || symbol;
    const fhHistory = await getFinnhubCandleData(fhSymbol, '60', 7);

    if (fhHistory && fhHistory.length > 0) {
      const sparkline = fhHistory
        .slice(-points)
        .map(p => p.close)
        .filter(v => v > 0);

      if (sparkline.length >= 2) {
        const result = { symbol, sparkline, count: sparkline.length, source: 'fallback-finnhub' };
        await cache.set(cacheKey, result, CacheTTL.SPARKLINE);
        return NextResponse.json(result, { headers: { 'Cache-Control': 'public, max-age=30' } });
      }
    }
  } catch (error: any) {
    console.warn('[Integration Sparkline] Finnhub hourly fallback failed:', error?.message);
  }

  return NextResponse.json(
    { symbol, sparkline: [], source: 'unavailable' },
    { headers: { 'Cache-Control': 'public, max-age=10' } }
  );
}

/** Helper: fetch sparkline close prices from trading platform */
async function fetchSparklineFromTP(symbol: string, interval: string, limit: number): Promise<number[]> {
  try {
    const response = await fetchFromTradingPlatform(
      `/api/integration/chart?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`
    );
    if (!response.ok) return [];

    const data = await response.json();
    const candles = data.candles || [];
    return candles
      .map((c: any) => typeof c.close === 'number' ? c.close : (typeof c[4] === 'number' ? c[4] : 0))
      .filter((v: number) => v > 0);
  } catch {
    return [];
  }
}
