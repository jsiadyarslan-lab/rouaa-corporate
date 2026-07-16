// ─── Integration: Chart Data Proxy V3 ──────────────────────
// Proxies OHLCV chart data requests to the trading platform.
// Falls back to local Alpha Vantage historical data if the
// trading platform is unreachable or returns errors.
//
// Usage: GET /api/integration/chart?symbol=BTC-USDT&interval=1day&limit=200
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
  'XAG-USD': 'XAGUSD',
  'CL-USD': 'CLUSD',
  'EUR-USD': 'EURUSD',
  'GBP-USD': 'GBPUSD',
  'USD-JPY': 'USDJPY',
  'DXY-USD': 'DXY',
};

function toLocalSymbol(tpSymbol: string): string {
  return LOCAL_SYMBOL_MAP[tpSymbol.toUpperCase()] || tpSymbol;
}

export async function GET(request: NextRequest) {
  const { authenticated, rateLimited, rateLimitResult } = authenticateIntegrationRequest(request, 'chart');
  if (rateLimited) {
    return NextResponse.json(
      { error: 'تم تجاوز حد الطلبات. حاول لاحقاً.', retryAfterMs: rateLimitResult?.retryAfterMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult?.retryAfterMs || 60000) / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '1day';
  const limit = searchParams.get('limit') || '200';

  if (!symbol) {
    return NextResponse.json({ error: 'symbol parameter is required' }, { status: 400 });
  }

  const cache = getSyncCache();
  const cacheKey = CacheKeys.chart(symbol, interval, limit);

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=30' } });
  }

  // Try trading platform first
  try {
    const response = await fetchFromTradingPlatform(
      `/api/integration/chart?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`
    );

    if (response.ok) {
      const data = await response.json();
      // Check if TP returned an error in the body (some TPs return 200 with error JSON)
      if (!data.error && data.candles && Array.isArray(data.candles) && data.candles.length > 0) {
        const result = { ...data, source: 'trading-platform' };
        await cache.set(cacheKey, result, CacheTTL.CHART);
        return NextResponse.json(result, { headers: { 'Cache-Control': 'public, max-age=30' } });
      }
    }
  } catch (error: any) {
    console.warn('[Integration Chart] Trading platform failed, trying fallback:', error?.message);
  }

  // Fallback 1: Use local financial APIs (Alpha Vantage + Finnhub)
  try {
    const localSymbol = toLocalSymbol(symbol);
    const days = Math.min(parseInt(limit), 365);
    const history = await getHistoricalData(localSymbol, days);

    if (history && history.length > 0) {
      // Transform historical data to candle format
      const candles = history.map(p => ({
        date: p.date,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
      }));

      const result = {
        symbol,
        candles,
        count: candles.length,
        source: 'fallback',
        interval: '1day',
      };
      await cache.set(cacheKey, result, CacheTTL.CHART);
      return NextResponse.json(result, { headers: { 'Cache-Control': 'public, max-age=60' } });
    }
  } catch (error: any) {
    console.warn('[Integration Chart] Alpha Vantage/Finnhub fallback failed:', error?.message);
  }

  // Fallback 2: Try Finnhub intraday candles directly (for hourly charts)
  if (interval !== '1day') {
    try {
      const finnhubSymbolMap: Record<string, string> = {
        'BTC-USDT': 'BINANCE:BTCUSDT',
        'ETH-USDT': 'BINANCE:ETHUSDT',
        'XAU-USD': 'OANDA:XAU_USD',
        'XAG-USD': 'OANDA:XAG_USD',
        'EUR-USD': 'OANDA:EUR_USD',
        'GBP-USD': 'OANDA:GBP_USD',
        'USD-JPY': 'OANDA:USD_JPY',
      };
      const fhSymbol = finnhubSymbolMap[symbol] || symbol;
      const resolution = interval === '1hour' ? '60' : interval === '15min' ? '15' : 'D';
      const fhDays = Math.min(parseInt(limit) * parseInt(interval === '1hour' ? '1' : '1') / 24, 30);
      const fhHistory = await getFinnhubCandleData(fhSymbol, resolution, Math.max(7, Math.ceil(fhDays)));

      if (fhHistory && fhHistory.length > 0) {
        const candles = fhHistory.slice(0, parseInt(limit)).map(p => ({
          date: p.date,
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: p.volume,
        }));
        const result = {
          symbol,
          candles,
          count: candles.length,
          source: 'fallback-finnhub',
          interval,
        };
        await cache.set(cacheKey, result, CacheTTL.CHART);
        return NextResponse.json(result, { headers: { 'Cache-Control': 'public, max-age=30' } });
      }
    } catch (error: any) {
      console.warn('[Integration Chart] Finnhub intraday fallback failed:', error?.message);
    }
  }

  return NextResponse.json(
    { error: 'فشل في جلب بيانات الرسم البياني من جميع المصادر', symbol, candles: [] },
    { status: 502 }
  );
}
