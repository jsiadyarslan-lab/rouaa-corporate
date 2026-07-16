// ─── Asset Prices API ──────────────────────────────────────────
// Fetches real-time asset prices from Finnhub and Yahoo Finance
// Falls back to calculated data from recent news analysis
// Returns Arabic-friendly formatted data for the ticker bar and hero section

import { NextRequest, NextResponse } from 'next/server';
import { fetchFromTradingPlatform, isCircuitClosed } from '@/lib/integration-auth';
import { getSyncCache, CacheTTL } from '@/lib/integration-cache';
import { getQuote, getHistoricalData } from '@/lib/financial-apis';

export const revalidate = 60;

// Cache for 2 minutes to avoid API rate limits
let cachedPrices: any[] = [];
let lastFetch = 0;
const CACHE_DURATION = 2 * 60 * 1000;

interface AssetConfig {
  symbol: string;
  displaySymbol: string;
  nameAr: string;
  nameEn: string;
  finnhubSymbol: string;
  yahooSymbol: string;
  twelvedataSymbol: string;
  category: string;
  categoryEn: string;
  decimals: number;
}

const ASSET_CONFIGS: AssetConfig[] = [
  // ── Global Benchmarks ──
  { symbol: 'XAU', displaySymbol: 'XAU/USD', nameAr: 'الذهب', nameEn: 'Gold', finnhubSymbol: 'OANDA:XAU_USD', yahooSymbol: 'GC=F', twelvedataSymbol: 'XAU/USD', category: 'سلع', categoryEn: 'Commodities', decimals: 2 },
  { symbol: 'NDX', displaySymbol: 'Nasdaq', nameAr: 'ناسداك', nameEn: 'Nasdaq 100', finnhubSymbol: '', yahooSymbol: '^NDX', twelvedataSymbol: 'NDX', category: 'أسهم', categoryEn: 'Indices', decimals: 2 },
  { symbol: 'JPY', displaySymbol: 'USD/JPY', nameAr: 'دولار/ين', nameEn: 'USD/JPY', finnhubSymbol: 'OANDA:USD_JPY', yahooSymbol: 'JPY=X', twelvedataSymbol: 'USD/JPY', category: 'عملات', categoryEn: 'Forex', decimals: 2 },
  { symbol: 'BTC', displaySymbol: 'BTC/USD', nameAr: 'بيتكوين', nameEn: 'Bitcoin', finnhubSymbol: 'BINANCE:BTCUSDT', yahooSymbol: 'BTC-USD', twelvedataSymbol: 'BTC/USD', category: 'كريبتو', categoryEn: 'Crypto', decimals: 2 },
  { symbol: 'EUR', displaySymbol: 'EUR/USD', nameAr: 'يورو/دولار', nameEn: 'EUR/USD', finnhubSymbol: 'OANDA:EUR_USD', yahooSymbol: 'EURUSD=X', twelvedataSymbol: 'EUR/USD', category: 'عملات', categoryEn: 'Forex', decimals: 4 },
  { symbol: 'SPX', displaySymbol: 'S&P 500', nameAr: 'إس آند بي', nameEn: 'S&P 500', finnhubSymbol: '', yahooSymbol: '^GSPC', twelvedataSymbol: 'SPX', category: 'أسهم', categoryEn: 'Indices', decimals: 2 },
  { symbol: 'WTI', displaySymbol: 'WTI', nameAr: 'النفط', nameEn: 'Crude Oil', finnhubSymbol: 'OANDA:WTI_USD', yahooSymbol: 'CL=F', twelvedataSymbol: 'WTI/USD', category: 'طاقة', categoryEn: 'Energy', decimals: 2 },
  { symbol: 'DXY', displaySymbol: 'DXY', nameAr: 'مؤشر الدولار', nameEn: 'US Dollar Index', finnhubSymbol: '', yahooSymbol: 'DX-Y.NYB', twelvedataSymbol: 'USDOLLAR', category: 'عملات', categoryEn: 'Forex', decimals: 2 },
  { symbol: 'GBP', displaySymbol: 'GBP/USD', nameAr: 'جنيه/دولار', nameEn: 'GBP/USD', finnhubSymbol: 'OANDA:GBP_USD', yahooSymbol: 'GBPUSD=X', twelvedataSymbol: 'GBP/USD', category: 'عملات', categoryEn: 'Forex', decimals: 4 },
  { symbol: 'ETH', displaySymbol: 'ETH/USD', nameAr: 'إيثريوم', nameEn: 'Ethereum', finnhubSymbol: 'BINANCE:ETHUSDT', yahooSymbol: 'ETH-USD', twelvedataSymbol: 'ETH/USD', category: 'كريبتو', categoryEn: 'Crypto', decimals: 2 },
  // ── European Indices ──
  { symbol: 'CAC40', displaySymbol: 'CAC 40', nameAr: 'كاك 40', nameEn: 'CAC 40', finnhubSymbol: '', yahooSymbol: '^FCHI', twelvedataSymbol: 'CAC', category: 'أسهم', categoryEn: 'Indices', decimals: 2 },
  { symbol: 'DAX', displaySymbol: 'DAX 40', nameAr: 'داكس 40', nameEn: 'DAX 40', finnhubSymbol: '', yahooSymbol: '^GDAXI', twelvedataSymbol: 'DAX', category: 'أسهم', categoryEn: 'Indices', decimals: 2 },
  { symbol: 'FTSE', displaySymbol: 'FTSE 100', nameAr: 'فتسي 100', nameEn: 'FTSE 100', finnhubSymbol: '', yahooSymbol: '^FTSE', twelvedataSymbol: 'FTSE100', category: 'أسهم', categoryEn: 'Indices', decimals: 2 },
  // ── Turkish Market ──
  { symbol: 'BIST', displaySymbol: 'BIST 100', nameAr: 'بيست 100', nameEn: 'BIST 100', finnhubSymbol: '', yahooSymbol: 'XU100.IS', twelvedataSymbol: 'XU100', category: 'أسهم', categoryEn: 'Indices', decimals: 2 },
  { symbol: 'USDTRY', displaySymbol: 'USD/TRY', nameAr: 'دولار/ليرة', nameEn: 'USD/TRY', finnhubSymbol: 'OANDA:USD_TRY', yahooSymbol: 'TRY=X', twelvedataSymbol: 'USD/TRY', category: 'عملات', categoryEn: 'Forex', decimals: 4 },
  { symbol: 'EURTRY', displaySymbol: 'EUR/TRY', nameAr: 'يورو/ليرة', nameEn: 'EUR/TRY', finnhubSymbol: 'OANDA:EUR_TRY', yahooSymbol: 'EURTRY=X', twelvedataSymbol: 'EUR/TRY', category: 'عملات', categoryEn: 'Forex', decimals: 4 },
  // ── Latin American Markets ──
  { symbol: 'IBEX', displaySymbol: 'IBEX 35', nameAr: 'إيبكس 35', nameEn: 'IBEX 35', finnhubSymbol: '', yahooSymbol: '^IBEX', twelvedataSymbol: 'IBEX', category: 'أسهم', categoryEn: 'Indices', decimals: 2 },
  { symbol: 'BOVESPA', displaySymbol: 'Bovespa', nameAr: 'بوفيسبا', nameEn: 'Bovespa', finnhubSymbol: '', yahooSymbol: '^BVSP', twelvedataSymbol: 'BVSP', category: 'أسهم', categoryEn: 'Indices', decimals: 2 },
  { symbol: 'USDMXN', displaySymbol: 'USD/MXN', nameAr: 'دولار/بيزو', nameEn: 'USD/MXN', finnhubSymbol: 'OANDA:USD_MXN', yahooSymbol: 'MXN=X', twelvedataSymbol: 'USD/MXN', category: 'عملات', categoryEn: 'Forex', decimals: 4 },
];

async function fetchFinnhubQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY || process.env.FINNHUB_KEY;
    if (!apiKey || apiKey.trim() === '' || !symbol) return null;

    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
      { signal: AbortSignal.timeout(5000), next: { revalidate: 60 } }
    );

    if (!res.ok) return null;
    const data = await res.json();

    if (data.c && data.c > 0) {
      return {
        price: data.c,
        change: data.d || 0,
        changePercent: data.dp || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchYahooQuote(yahooSymbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    if (!yahooSymbol) return null;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'RouaaNewsBot/2.0' },
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const result = data.chart?.result?.[0];
    const meta = result?.meta;

    if (meta?.regularMarketPrice) {
      return {
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - (meta.chartPreviousClose || meta.regularMarketPrice),
        changePercent: meta.chartPreviousClose
          ? ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100)
          : 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Calculate prices from DB news sentiment as last resort
function estimateFromDB(dbPrices: Record<string, { price: number; change: number }>, category: string): { price: number; change: number; changePercent: number } | null {
  return null; // We don't estimate — just return null if no real data
}

// ─── TwelveData Quote Fetcher ─────────────────────────────────
// TwelveData uses slash format for forex/crypto: BTC/USD, XAU/USD, etc.
// NOT the dash format (BTC-USD) used by Yahoo Finance.
async function fetchTwelveDataQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const apiKey = process.env.TWELVEDATA_API_KEY;
    if (!apiKey || apiKey.trim() === '') return null;

    const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const data = await res.json();

    // TwelveData price endpoint returns { price: "67890.12" }
    if (data.price && parseFloat(data.price) > 0) {
      const price = parseFloat(data.price);
      // Get change data from quote endpoint
      const quoteUrl = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
      const quoteRes = await fetch(quoteUrl, {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 60 },
      });

      let change = 0;
      let changePercent = 0;
      if (quoteRes.ok) {
        const quoteData = await quoteRes.json();
        if (quoteData.change) change = parseFloat(quoteData.change);
        if (quoteData.percent_change) changePercent = parseFloat(quoteData.percent_change);
      }

      return { price, change, changePercent };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const includeSparklines = request.nextUrl.searchParams.get('include')?.includes('sparklines');

    // Return cached prices if fresh
    if (cachedPrices.length > 0 && (now - lastFetch) < CACHE_DURATION) {
      // Even with cached prices, fetch sparklines if requested and not cached
      let sparklines: Record<string, number[]> | undefined;
      if (includeSparklines) {
        sparklines = await fetchSparklinesData();
      }
      return NextResponse.json({
        prices: cachedPrices,
        sparklines,
        cached: true,
        lastUpdate: new Date(lastFetch).toISOString(),
      });
    }

    // Fetch real prices for each asset in parallel
    // PERF: Uses Promise.any() to race all providers simultaneously.
    // Previous serial chain: Finnhub(5s timeout) → TwelveData(10s) → Yahoo(5s) = 20s worst case
    // Now: All fire at once, first success wins = 5s worst case (single provider timeout)
    async function fetchAssetQuote(asset: AssetConfig): Promise<{
      symbol: string;
      displaySymbol: string;
      nameAr: string;
      nameEn: string;
      price: number;
      change: number;
      changePercent: number;
      category: string;
      categoryEn: string;
      decimals: number;
      source: string;
      provider?: string;
    } | null> {
      // Build provider promises — null results become rejections so Promise.any skips them
      const providerPromises: Promise<{ quote: { price: number; change: number; changePercent: number }; provider: string }>[] = [];

      if (asset.finnhubSymbol) {
        providerPromises.push(
          fetchFinnhubQuote(asset.finnhubSymbol).then(q =>
            q && q.price > 0 ? { quote: q, provider: 'finnhub' } : Promise.reject(new Error('Finnhub: no data'))
          )
        );
      }

      if (asset.twelvedataSymbol) {
        providerPromises.push(
          fetchTwelveDataQuote(asset.twelvedataSymbol).then(q =>
            q && q.price > 0 ? { quote: q, provider: 'twelvedata' } : Promise.reject(new Error('TwelveData: no data'))
          )
        );
      }

      if (asset.yahooSymbol) {
        providerPromises.push(
          fetchYahooQuote(asset.yahooSymbol).then(q =>
            q && q.price > 0 ? { quote: q, provider: 'yahoo' } : Promise.reject(new Error('Yahoo: no data'))
          )
        );
      }

      if (providerPromises.length === 0) return null;

      let result: { quote: { price: number; change: number; changePercent: number }; provider: string } | null = null;

      try {
        // Race all providers — first valid result wins
        result = await Promise.any(providerPromises);
      } catch {
        // All providers failed or returned null — no data available
        console.warn(`[Prices] All providers failed for ${asset.symbol}`);
      }

      if (result && result.quote && result.quote.price > 0) {
        // ── Price sanity check: reject clearly wrong prices from any provider ──
        const PRICE_BOUNDS: Record<string, { min: number; max: number }> = {
          'BTC': { min: 10_000, max: 200_000 }, 'ETH': { min: 100, max: 15_000 },
          'XAU': { min: 1_000, max: 5_000 }, 'XAG': { min: 10, max: 100 },
          'WTI': { min: 10, max: 200 }, 'NDX': { min: 5_000, max: 30_000 },
          'SPX': { min: 2_000, max: 10_000 }, 'DXY': { min: 80, max: 120 },
          'EUR': { min: 0.5, max: 2.0 }, 'GBP': { min: 0.8, max: 2.5 },
          'JPY': { min: 50, max: 250 },
          'CAC40': { min: 3_000, max: 10_000 }, 'DAX': { min: 10_000, max: 25_000 },
          'FTSE': { min: 4_000, max: 12_000 }, 'BIST': { min: 1_000, max: 15_000 },
          'USDTRY': { min: 1, max: 100 }, 'EURTRY': { min: 1, max: 120 },
          'IBEX': { min: 5_000, max: 15_000 }, 'BOVESPA': { min: 50_000, max: 200_000 },
          'USDMXN': { min: 10, max: 30 },
        };
        const bounds = PRICE_BOUNDS[asset.symbol];
        if (bounds && (result.quote.price < bounds.min || result.quote.price > bounds.max)) {
          console.warn(`[Prices] 🚫 Rejected insane ${asset.symbol} price from ${result.provider}: $${result.quote.price} (bounds: $${bounds.min}–$${bounds.max})`);
          return null;
        }

        return {
          symbol: asset.symbol,
          displaySymbol: asset.displaySymbol,
          nameAr: asset.nameAr,
          nameEn: asset.nameEn,
          price: result.quote.price,
          change: result.quote.change,
          changePercent: result.quote.changePercent,
          category: asset.category,
          categoryEn: asset.categoryEn,
          decimals: asset.decimals,
          source: 'live',
          provider: result.provider,
        };
      }

      // No real data available — skip this asset instead of returning fake data
      return null;
    }

    const results = await Promise.allSettled(ASSET_CONFIGS.map(asset => fetchAssetQuote(asset)));
    const rawPrices: any[] = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);

    // Deduplicate by symbol — keep last occurrence if duplicates exist
    const seen = new Map<string, any>();
    for (const p of rawPrices) {
      seen.set(p.symbol, p);
    }
    const prices = Array.from(seen.values());

    cachedPrices = prices;
    lastFetch = now;

    // Fetch sparklines if requested (eliminates separate /api/markets/integration?mode=sparklines call)
    let sparklines: Record<string, number[]> | undefined;
    if (includeSparklines) {
      sparklines = await fetchSparklinesData();
    }

    return NextResponse.json({
      prices,
      sparklines,
      cached: false,
      lastUpdate: new Date(now).toISOString(),
    });
  } catch (error: any) {
    console.error('[Prices] API error:', error.message);

    // Return cached or fallback
    if (cachedPrices.length > 0) {
      return NextResponse.json({
        prices: cachedPrices,
        cached: true,
        error: 'using_stale_cache',
      });
    }

    return NextResponse.json({
      prices: [],
      error: 'فشل في جلب الأسعار',
    }, { status: 500 });
  }
}

// ─── Sparklines Helper ────────────────────────────────────────
// Fetches sparkline data for all price symbols.
// Tries trading platform first, falls back to local financial APIs.
// Used by ?include=sparklines to merge sparklines into the prices response
// instead of requiring a separate /api/markets/integration?mode=sparklines call.

const SPARKLINE_SYMBOL_MAP: Record<string, string> = {
  'BTC': 'BTC-USDT', 'ETH': 'ETH-USDT', 'SOL': 'SOL-USDT',
  'XAU': 'XAU-USD', 'XAG': 'XAG-USD', 'WTI': 'CL-USD',
  'EUR': 'EUR-USD', 'GBP': 'GBP-USD', 'JPY': 'USD-JPY',
  'DXY': 'DXY-USD',
};

const SPARKLINE_LOCAL_MAP: Record<string, string> = {
  'BTC-USDT': 'BINANCE:BTCUSDT', 'ETH-USDT': 'BINANCE:ETHUSDT',
  'XAU-USD': 'OANDA:XAU_USD', 'CL-USD': 'OANDA:WTI_USD',
  'EUR-USD': 'OANDA:EUR_USD', 'GBP-USD': 'OANDA:GBP_USD',
  'USD-JPY': 'OANDA:USD_JPY',
};

const SPARKLINE_AV_MAP: Record<string, string> = {
  'BTC': 'BTCUSD', 'ETH': 'ETHUSD', 'SOL': 'SOLUSD',
  'XAU': 'XAUUSD', 'XAG': 'XAGUSD', 'CL': 'CLUSD',
  'EUR': 'EURUSD', 'GBP': 'GBPUSD',
};

async function fetchSparklinesData(): Promise<Record<string, number[]>> {
  const cache = getSyncCache();
  const cacheKey = 'sparklines:prices_composite';

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) return cached as Record<string, number[]>;

  const sparklines: Record<string, number[]> = {};
  const symbols = Object.entries(SPARKLINE_SYMBOL_MAP);

  // PERF V2: Race ALL data sources in parallel per symbol using Promise.any()
  // Previous: Serial chain TP-1h → TP-1d → localAPI → AV = 20s worst case per symbol
  // Now: All fire at once, first valid result wins = 10s worst case (single TP timeout)
  await Promise.allSettled(symbols.map(async ([shortSym, tpSymbol]) => {
    try {
      const providers: Promise<number[]>[] = [];

      // Provider 1: Trading platform 1hour candles (if circuit is closed)
      if (isCircuitClosed()) {
        providers.push(
          fetchTPSparkline(tpSymbol, '1hour', 13).then(d =>
            d.length >= 2 ? d : Promise.reject(new Error('TP-1h: insufficient data'))
          )
        );
        // Provider 2: Trading platform 1day candles
        providers.push(
          fetchTPSparkline(tpSymbol, '1day', 13).then(d =>
            d.length >= 2 ? d : Promise.reject(new Error('TP-1d: insufficient data'))
          )
        );
      }

      // Provider 3: Local financial APIs (Alpha Vantage, Finnhub, CoinGecko)
      const localSymbol = SPARKLINE_LOCAL_MAP[tpSymbol];
      if (localSymbol) {
        providers.push(
          getHistoricalData(localSymbol, 30).then(history => {
            if (history && history.length > 0) {
              const prices = history.slice(-13).map(p => p.close).filter(v => v > 0);
              if (prices.length >= 2) return prices;
            }
            return Promise.reject(new Error('Local API: insufficient data'));
          })
        );
      }

      // Provider 4: Alpha Vantage direct mapping
      const avSymbol = SPARKLINE_AV_MAP[shortSym];
      if (avSymbol) {
        providers.push(
          getHistoricalData(avSymbol, 30).then(history => {
            if (history && history.length > 0) {
              const prices = history.slice(-13).map(p => p.close).filter(v => v > 0);
              if (prices.length >= 2) return prices;
            }
            return Promise.reject(new Error('AV direct: insufficient data'));
          })
        );
      }

      if (providers.length === 0) return;

      // Race all providers — first valid sparkline wins
      try {
        const result = await Promise.any(providers);
        sparklines[tpSymbol] = result;
      } catch {
        // All providers failed for this symbol
        console.warn(`[Prices Sparklines] All providers failed for ${shortSym}`);
      }
    } catch (err: any) {
      console.warn(`[Prices Sparklines] Failed for ${shortSym}:`, err?.message?.slice(0, 60));
    }
  }));

  // Cache for 60 seconds
  await cache.set(cacheKey, sparklines, CacheTTL.SPARKLINE);
  return sparklines;
}

/** Helper: fetch sparkline from trading platform */
async function fetchTPSparkline(symbol: string, interval: string, limit: number): Promise<number[]> {
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
