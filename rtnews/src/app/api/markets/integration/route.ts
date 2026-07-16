// ─── Markets Integration: Real Data from Trading Platform V4 ──
// Public API route (no integration key needed from browser).
// Server-side fetches from trading platform with integration auth,
// then returns data to the client. Falls back to local financial APIs.
//
// V4: Fallback data sources via Finnhub/Alpha Vantage when
//     trading platform is unreachable or rate-limited.

import { NextRequest, NextResponse } from 'next/server';
import { fetchFromTradingPlatform } from '@/lib/integration-auth';
import { getSyncCache, CacheKeys, CacheTTL } from '@/lib/integration-cache';
import { getQuote, getHistoricalData } from '@/lib/financial-apis';

export const dynamic = 'force-dynamic';

// Symbol mapping: news site symbols → trading platform symbols
const SYMBOL_MAP: Record<string, string> = {
  'BTC': 'BTC-USDT',
  'ETH': 'ETH-USDT',
  'SOL': 'SOL-USDT',
  'XRP': 'XRP-USDT',
  'BNB': 'BNB-USDT',
  'XAU': 'XAU-USD',
  'XAG': 'XAG-USD',
  'WTI': 'CL-USD',
  'OIL': 'CL-USD',
  'EUR': 'EUR-USD',
  'GBP': 'GBP-USD',
  'JPY': 'USD-JPY',
  'DXY': 'DXY-USD',
};

// Symbol mapping for local financial APIs
const LOCAL_SYMBOL_MAP: Record<string, string> = {
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
  'DXY-USD': 'US10Y',
};

function normalizeSymbol(symbol: string): string {
  return SYMBOL_MAP[symbol.toUpperCase()] || symbol;
}

function toLocalSymbol(tpSymbol: string): string {
  return LOCAL_SYMBOL_MAP[tpSymbol.toUpperCase()] || tpSymbol;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'quotes';

  try {
    switch (mode) {
      case 'quote':
        return await handleQuote(searchParams);
      case 'chart':
        return await handleChart(searchParams);
      case 'sparkline':
        return await handleSparkline(searchParams);
      case 'quotes':
        return await handleBatchQuotes();
      case 'sparklines':
        return await handleBatchSparklines();
      default:
        return NextResponse.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error(`[Markets Integration] mode=${mode} failed:`, error?.message);
    return NextResponse.json(
      { error: 'فشل في جلب البيانات', detail: error?.message },
      { status: 502 }
    );
  }
}

async function handleQuote(searchParams: URLSearchParams) {
  const symbol = searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  const tpSymbol = normalizeSymbol(symbol);
  const cache = getSyncCache();
  const cacheKey = CacheKeys.quote(tpSymbol);

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=5' } });
  }

  // PERF: Race trading platform + local APIs in parallel — first success wins
  const providers: Promise<{ data: any; source: string }>[] = [];

  // Provider 1: Trading platform
  providers.push(
    fetchFromTradingPlatform(`/api/integration/quote?symbol=${encodeURIComponent(tpSymbol)}`)
      .then(async (response) => {
        if (!response.ok) return Promise.reject(new Error('TP: not ok'));
        const data = await response.json();
        return { data: { ...data, source: 'trading-platform' }, source: 'trading-platform' };
      })
  );

  // Provider 2: Local financial APIs (Finnhub, Alpha Vantage, CoinGecko)
  providers.push(
    (async () => {
      const localSymbol = toLocalSymbol(tpSymbol);
      const quote = await getQuote(localSymbol);
      if (quote && quote.price > 0) {
        return {
          data: {
            symbol: tpSymbol,
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
          },
          source: 'fallback',
        };
      }
      return Promise.reject(new Error('Local: no data'));
    })()
  );

  try {
    const result = await Promise.any(providers);
    await cache.set(cacheKey, result.data, CacheTTL.QUOTES);
    const maxAge = result.source === 'trading-platform' ? '5' : '15';
    return NextResponse.json(result.data, { headers: { 'Cache-Control': `public, max-age=${maxAge}` } });
  } catch {
    console.warn(`[Markets Integration] All quote providers failed for ${symbol}`);
  }

  return NextResponse.json({ error: 'Quote unavailable', symbol }, { status: 502 });
}

async function handleChart(searchParams: URLSearchParams) {
  const symbol = searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  const tpSymbol = normalizeSymbol(symbol);
  const interval = searchParams.get('interval') || '1day';
  const limit = searchParams.get('limit') || '200';

  const cache = getSyncCache();
  const cacheKey = CacheKeys.chart(tpSymbol, interval, limit);

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=30' } });
  }

  // PERF: Race trading platform + local APIs in parallel — first success wins
  const providers: Promise<{ data: any; source: string }>[] = [];

  // Provider 1: Trading platform chart
  providers.push(
    fetchFromTradingPlatform(
      `/api/integration/chart?symbol=${encodeURIComponent(tpSymbol)}&interval=${interval}&limit=${limit}`
    ).then(async (response) => {
      if (!response.ok) return Promise.reject(new Error('TP: not ok'));
      const data = await response.json();
      if (!data.candles || !Array.isArray(data.candles) || data.candles.length === 0) {
        return Promise.reject(new Error('TP: no candles'));
      }
      return { data: { ...data, source: 'trading-platform' }, source: 'trading-platform' };
    })
  );

  // Provider 2: Local Alpha Vantage / Finnhub / CoinGecko historical data
  providers.push(
    (async () => {
      const rawSymbol = tpSymbol.split('-')[0];
      const avSymbolMap: Record<string, string> = {
        'BTC': 'BTCUSD', 'ETH': 'ETHUSD', 'SOL': 'SOLUSD',
        'XAU': 'XAUUSD', 'XAG': 'XAGUSD', 'CL': 'CLUSD',
        'EUR': 'EURUSD', 'GBP': 'GBPUSD', 'USD': 'USDJPY',
      };
      const localSymbol = avSymbolMap[rawSymbol] || rawSymbol;
      const days = Math.min(parseInt(limit), 365);
      const history = await getHistoricalData(localSymbol, days);

      if (history && history.length > 0) {
        const candles = history.map(p => ({
          date: p.date,
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: p.volume,
        }));
        return {
          data: {
            symbol: tpSymbol,
            candles,
            count: candles.length,
            source: 'fallback',
            interval: '1day',
          },
          source: 'fallback',
        };
      }
      return Promise.reject(new Error('Local: no history'));
    })()
  );

  try {
    const result = await Promise.any(providers);
    await cache.set(cacheKey, result.data, CacheTTL.CHART);
    const maxAge = result.source === 'trading-platform' ? '30' : '60';
    return NextResponse.json(result.data, { headers: { 'Cache-Control': `public, max-age=${maxAge}` } });
  } catch {
    console.warn(`[Markets Integration] All chart providers failed for ${symbol}`);
  }

  return NextResponse.json(
    { error: 'Chart data unavailable', symbol, candles: [] },
    { status: 502 }
  );
}

async function handleSparkline(searchParams: URLSearchParams) {
  const symbol = searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  const tpSymbol = normalizeSymbol(symbol);
  const points = searchParams.get('points') || '13';

  const cache = getSyncCache();
  const cacheKey = CacheKeys.sparkline(`${tpSymbol}-${points}`);

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=30' } });
  }

  // PERF: Race all sparkline sources in parallel — first valid result wins
  const providers: Promise<{ data: number[]; source: string }>[] = [];

  // Provider 1: Trading platform 1hour candles
  providers.push(
    fetchSparklineData(tpSymbol, '1hour', parseInt(points)).then(d =>
      d.length >= 2 ? { data: d, source: 'trading-platform' } : Promise.reject(new Error('TP-1h: insufficient'))
    )
  );

  // Provider 2: Trading platform 1day candles
  providers.push(
    fetchSparklineData(tpSymbol, '1day', parseInt(points)).then(d =>
      d.length >= 2 ? { data: d, source: 'trading-platform' } : Promise.reject(new Error('TP-1d: insufficient'))
    )
  );

  // Provider 3: Local APIs (Alpha Vantage, Finnhub, CoinGecko)
  providers.push(
    (async () => {
      const rawSymbol = tpSymbol.split('-')[0];
      const avSymbolMap: Record<string, string> = {
        'BTC': 'BTCUSD', 'ETH': 'ETHUSD', 'SOL': 'SOLUSD',
        'XAU': 'XAUUSD', 'XAG': 'XAGUSD', 'CL': 'CLUSD',
        'EUR': 'EURUSD', 'GBP': 'GBPUSD',
      };
      const localSymbol = avSymbolMap[rawSymbol] || rawSymbol;
      const history = await getHistoricalData(localSymbol, Math.min(parseInt(points) * 2, 60));

      if (history && history.length > 0) {
        const prices = history.slice(-parseInt(points)).map(p => p.close).filter(v => v > 0);
        if (prices.length >= 2) return { data: prices, source: 'fallback' };
      }
      return Promise.reject(new Error('Local: insufficient'));
    })()
  );

  let sparkline: number[] = [];
  let source = 'none';

  try {
    const result = await Promise.any(providers);
    sparkline = result.data;
    source = result.source;
  } catch {
    console.warn(`[Markets Integration] All sparkline providers failed for ${symbol}`);
  }

  sparkline = sparkline.slice(-parseInt(points));
  const result = { symbol, sparkline, count: sparkline.length, source };
  await cache.set(cacheKey, result, CacheTTL.SPARKLINE);

  return NextResponse.json(
    result,
    { headers: { 'Cache-Control': 'public, max-age=30' } }
  );
}

async function handleBatchQuotes() {
  const cache = getSyncCache();
  const cacheKey = CacheKeys.quotes();

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json({ quotes: cached, cached: true });
  }

  const symbols = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'XAU-USD', 'XAG-USD', 'CL-USD', 'EUR-USD', 'GBP-USD'];
  const quotes: Record<string, any> = {};

  // Try trading platform for all symbols
  await Promise.allSettled(
    symbols.map(async (sym) => {
      try {
        const response = await fetchFromTradingPlatform(
          `/api/integration/quote?symbol=${encodeURIComponent(sym)}`
        );
        if (response.ok) {
          const data = await response.json();
          quotes[sym] = { ...(data.quote || data), source: 'trading-platform' };
        }
      } catch {
        // Will try fallback below
      }
    })
  );

  // Fill missing quotes with local APIs
  const missingSymbols = symbols.filter(sym => !quotes[sym] || !quotes[sym].price);
  if (missingSymbols.length > 0) {
    await Promise.allSettled(
      missingSymbols.map(async (sym) => {
        try {
          const localSymbol = toLocalSymbol(sym);
          const quote = await getQuote(localSymbol);
          if (quote && quote.price > 0) {
            quotes[sym] = {
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
              high: quote.high,
              low: quote.low,
              open: quote.open,
              previousClose: quote.previousClose,
              volume: quote.volume,
              timestamp: quote.timestamp,
              source: 'fallback',
            };
          }
        } catch {
          // Skip
        }
      })
    );
  }

  await cache.set(cacheKey, quotes, CacheTTL.BATCH_QUOTES);
  return NextResponse.json({ quotes, cached: false });
}

async function handleBatchSparklines() {
  const cache = getSyncCache();
  const cacheKey = CacheKeys.sparklines();

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json({ sparklines: cached, cached: true });
  }

  const symbols = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'XAU-USD', 'XAG-USD', 'CL-USD', 'EUR-USD', 'GBP-USD'];
  const sparklines: Record<string, number[]> = {};

  // PERF: Race all sources per symbol in parallel — first valid result wins
  await Promise.allSettled(
    symbols.map(async (sym) => {
      try {
        const providers: Promise<number[]>[] = [];

        // Provider 1: TP 1hour
        providers.push(
          fetchSparklineData(sym, '1hour', 13).then(d =>
            d.length >= 2 ? d : Promise.reject(new Error('TP-1h: insufficient'))
          )
        );

        // Provider 2: TP 1day
        providers.push(
          fetchSparklineData(sym, '1day', 13).then(d =>
            d.length >= 2 ? d : Promise.reject(new Error('TP-1d: insufficient'))
          )
        );

        // Provider 3: Local APIs
        providers.push(
          (async () => {
            const rawSymbol = sym.split('-')[0];
            const avSymbolMap: Record<string, string> = {
              'BTC': 'BTCUSD', 'ETH': 'ETHUSD', 'SOL': 'SOLUSD',
              'XAU': 'XAUUSD', 'XAG': 'XAGUSD', 'CL': 'CLUSD',
              'EUR': 'EURUSD', 'GBP': 'GBPUSD',
            };
            const localSymbol = avSymbolMap[rawSymbol] || rawSymbol;
            const history = await getHistoricalData(localSymbol, 30);
            if (history && history.length > 0) {
              const prices = history.slice(-13).map(p => p.close).filter(v => v > 0);
              if (prices.length >= 2) return prices;
            }
            return Promise.reject(new Error('Local: insufficient'));
          })()
        );

        try {
          const result = await Promise.any(providers);
          sparklines[sym] = result;
        } catch {
          // All providers failed for this symbol — leave empty
          console.warn(`[Markets Integration] Batch sparkline: all providers failed for ${sym}`);
        }
      } catch {
        // Skip failed sparklines
      }
    })
  );

  await cache.set(cacheKey, sparklines, CacheTTL.BATCH_SPARKLINES);
  return NextResponse.json({ sparklines, cached: false });
}

/** Helper: fetch sparkline close prices for a symbol at a given interval */
async function fetchSparklineData(symbol: string, interval: string, limit: number): Promise<number[]> {
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
