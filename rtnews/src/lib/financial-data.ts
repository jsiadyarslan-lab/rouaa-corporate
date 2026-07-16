// ─── Financial Market Data Fetcher ──────────────────────────────
// Fetches real market data from free public APIs:
//   1. Yahoo Finance (primary — no API key needed)
//   2. Alpha Vantage (fallback — key from ALPHA_VANTAGE_API_KEY env)
//   3. Finnhub (backup — key from FINNHUB_API_KEY env)
// Includes 5-minute in-memory caching and robust error handling.
// Server-side only.

// ─── Types ──────────────────────────────────────────────────────

export interface MarketDataResult {
  symbol: string;
  name: string;
  currency: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  historicalCloses: number[];   // last 60 days
  historicalHighs: number[];
  historicalLows: number[];
  historicalVolumes: number[];
  timestamps: string[];
  source: string;
}

export interface TickerItem {
  symbol: string;
  name: string;       // Arabic name if locale='ar'
  price: number;
  change: number;
  changePercent: number;
}

// ─── In-Memory Cache (5-minute TTL) ────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number = CACHE_TTL): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── Arabic Name Map for Default Tickers ───────────────────────

const ARABIC_NAMES: Record<string, string> = {
  'XAU=': 'الذهب',
  'EURUSD=X': 'يورو/دولار',
  'CL=F': 'النفط الخام',
  '^GSPC': 'إس آند بي 500',
  'DX-Y.NYB': 'مؤشر الدولار',
  'BTC-USD': 'بيتكوين',
};

const ENGLISH_NAMES: Record<string, string> = {
  'XAU=': 'Gold',
  'EURUSD=X': 'EUR/USD',
  'CL=F': 'Crude Oil',
  '^GSPC': 'S&P 500',
  'DX-Y.NYB': 'Dollar Index',
  'BTC-USD': 'Bitcoin',
};

// ─── Default Ticker Symbols ────────────────────────────────────

const DEFAULT_TICKER_SYMBOLS = [
  'XAU=',
  'EURUSD=X',
  'CL=F',
  '^GSPC',
  'DX-Y.NYB',
  'BTC-USD',
];

// ─── Yahoo Finance Fetcher ─────────────────────────────────────
// No API key needed. Uses the v8 chart endpoint.

async function fetchYahooFinance(symbol: string): Promise<MarketDataResult | null> {
  const cacheKey = `yahoo_${symbol}`;
  const cached = getCached<MarketDataResult>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MarketBot/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(`[FinancialData] Yahoo Finance returned ${res.status} for ${symbol}`);
      return null;
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta || {};
    const quotes = result.indicators?.quote?.[0] || {};
    const timestamps: number[] = result.timestamp || [];

    const closes: number[] = (quotes.close || [])
      .map((v: number | null) => v)
      .filter((v: number | null): v is number => v !== null && isFinite(v));
    const highs: number[] = (quotes.high || [])
      .map((v: number | null) => v)
      .filter((v: number | null): v is number => v !== null && isFinite(v));
    const lows: number[] = (quotes.low || [])
      .map((v: number | null) => v)
      .filter((v: number | null): v is number => v !== null && isFinite(v));
    const volumes: number[] = (quotes.volume || [])
      .map((v: number | null) => v)
      .filter((v: number | null): v is number => v !== null && isFinite(v));

    if (closes.length === 0) return null;

    const currentPrice = meta.regularMarketPrice || closes[closes.length - 1];
    const previousClose = meta.chartPreviousClose || meta.previousClose || (closes.length >= 2 ? closes[closes.length - 2] : currentPrice);
    const change = currentPrice - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    // Build timestamp strings aligned with the actual data points
    // Yahoo timestamps may differ in length from quote arrays; take the min
    const dataLen = Math.min(closes.length, timestamps.length);
    const tsStrings: string[] = [];
    for (let i = 0; i < dataLen; i++) {
      tsStrings.push(new Date(timestamps[i] * 1000).toISOString().split('T')[0]);
    }
    // If timestamps are fewer, pad with empty strings
    while (tsStrings.length < closes.length) {
      tsStrings.push('');
    }

    // Take only last 60 data points
    const last60Closes = closes.slice(-60);
    const last60Highs = highs.slice(-60);
    const last60Lows = lows.slice(-60);
    const last60Volumes = volumes.slice(-60);
    const last60Ts = tsStrings.slice(-60);

    const data: MarketDataResult = {
      symbol,
      name: meta.shortName || ENGLISH_NAMES[symbol] || symbol,
      currency: meta.currency || 'USD',
      currentPrice: Math.round(currentPrice * 10000) / 10000,
      change: Math.round(change * 10000) / 10000,
      changePercent: Math.round(changePercent * 100) / 100,
      historicalCloses: last60Closes,
      historicalHighs: last60Highs,
      historicalLows: last60Lows,
      historicalVolumes: last60Volumes,
      timestamps: last60Ts,
      source: 'yahoo_finance',
    };

    setCache(cacheKey, data);
    console.log(`[FinancialData] Yahoo Finance: ${symbol} = ${data.currentPrice} (${data.changePercent}%)`);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message?.slice(0, 100) : String(err).slice(0, 100);
    console.warn(`[FinancialData] Yahoo Finance error for ${symbol}: ${message}`);
    return null;
  }
}

// ─── Alpha Vantage Fetcher ─────────────────────────────────────

function getAlphaVantageKey(): string | null {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  return key && key.trim() !== '' && key !== 'demo' ? key : null;
}

async function fetchAlphaVantage(symbol: string): Promise<MarketDataResult | null> {
  const apiKey = getAlphaVantageKey();
  if (!apiKey) return null;

  const cacheKey = `av_${symbol}`;
  const cached = getCached<MarketDataResult>(cacheKey);
  if (cached) return cached;

  try {
    // Try TIME_SERIES_DAILY first (stocks & some forex)
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;

    const json = await res.json();
    const ts = json['Time Series (Daily)'];

    // If no daily data, try currency exchange rate
    if (!ts) {
      return await fetchAlphaVantageCurrency(symbol, apiKey);
    }

    const entries = Object.entries(ts) as [string, Record<string, string>][];
    if (entries.length === 0) return null;

    const closes: number[] = [];
    const highs: number[] = [];
    const lows: number[] = [];
    const volumes: number[] = [];
    const timestamps: string[] = [];

    // Entries are in reverse chronological order; we want chronological
    const sorted = entries.reverse().slice(-60);

    for (const [date, values] of sorted) {
      const close = parseFloat(values['4. close']) || 0;
      if (close <= 0) continue;
      closes.push(close);
      highs.push(parseFloat(values['2. high']) || close);
      lows.push(parseFloat(values['3. low']) || close);
      volumes.push(parseInt(values['5. volume'] || '0') || 0);
      timestamps.push(date);
    }

    if (closes.length === 0) return null;

    const currentPrice = closes[closes.length - 1];
    const previousClose = closes.length >= 2 ? closes[closes.length - 2] : currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    const data: MarketDataResult = {
      symbol,
      name: ENGLISH_NAMES[symbol] || symbol,
      currency: 'USD',
      currentPrice: Math.round(currentPrice * 10000) / 10000,
      change: Math.round(change * 10000) / 10000,
      changePercent: Math.round(changePercent * 100) / 100,
      historicalCloses: closes,
      historicalHighs: highs,
      historicalLows: lows,
      historicalVolumes: volumes,
      timestamps,
      source: 'alpha_vantage',
    };

    setCache(cacheKey, data, CACHE_TTL * 6); // 30 min for AV (rate-limited)
    console.log(`[FinancialData] Alpha Vantage: ${symbol} = ${data.currentPrice}`);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message?.slice(0, 100) : String(err).slice(0, 100);
    console.warn(`[FinancialData] Alpha Vantage error for ${symbol}: ${message}`);
    return null;
  }
}

async function fetchAlphaVantageCurrency(symbol: string, apiKey: string): Promise<MarketDataResult | null> {
  // Try to parse symbol as a currency pair
  const forexMatch = symbol.match(/^([A-Z]{3})([A-Z]{3})=X$/);
  const cryptoMatch = symbol.match(/^([A-Z]{2,6})-USD$/);

  let fromCurrency = '';
  let toCurrency = 'USD';

  if (forexMatch) {
    fromCurrency = forexMatch[1];
    toCurrency = forexMatch[2];
  } else if (cryptoMatch) {
    fromCurrency = cryptoMatch[1];
  } else {
    return null; // Can't determine currency pair
  }

  try {
    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${encodeURIComponent(fromCurrency)}&to_currency=${encodeURIComponent(toCurrency)}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;

    const json = await res.json();
    const rate = json['Realtime Currency Exchange Rate'];
    if (!rate || !rate['5. Exchange Rate']) return null;

    const price = parseFloat(rate['5. Exchange Rate']) || 0;
    if (price <= 0) return null;

    const data: MarketDataResult = {
      symbol,
      name: ENGLISH_NAMES[symbol] || `${fromCurrency}/${toCurrency}`,
      currency: toCurrency,
      currentPrice: price,
      change: 0,
      changePercent: 0,
      historicalCloses: [price],
      historicalHighs: [price],
      historicalLows: [price],
      historicalVolumes: [0],
      timestamps: [new Date().toISOString().split('T')[0]],
      source: 'alpha_vantage_currency',
    };

    const cacheKey = `av_curr_${symbol}`;
    setCache(cacheKey, data, CACHE_TTL * 6);
    console.log(`[FinancialData] Alpha Vantage Currency: ${symbol} = ${price}`);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message?.slice(0, 100) : String(err).slice(0, 100);
    console.warn(`[FinancialData] Alpha Vantage currency error for ${symbol}: ${message}`);
    return null;
  }
}

// ─── Finnhub Fetcher ───────────────────────────────────────────

function getFinnhubKey(): string | null {
  const key = process.env.FINNHUB_API_KEY;
  return key && key.trim() !== '' ? key : null;
}

/**
 * Translates Yahoo-style symbols to Finnhub format.
 */
function translateToFinnhub(symbol: string): string {
  // Crypto: BTC-USD → BINANCE:BTCUSDT
  const cryptoMatch = symbol.match(/^([A-Z]{2,6})-USD$/);
  if (cryptoMatch) return `BINANCE:${cryptoMatch[1].toUpperCase()}USDT`;

  // Forex: EURUSD=X → OANDA:EUR_USD
  const forexMatch = symbol.match(/^([A-Z]{3})([A-Z]{3})=X$/);
  if (forexMatch) return `OANDA:${forexMatch[1].toUpperCase()}_${forexMatch[2].toUpperCase()}`;

  // Futures / Commodities
  const futuresMap: Record<string, string> = {
    'XAU=': 'OANDA:XAU_USD',
    'CL=F': 'OANDA:WTI_USD',
    'GC=F': 'OANDA:XAU_USD',
    'SI=F': 'OANDA:XAG_USD',
    'DX-Y.NYB': 'OANDA:DX_USD',
  };
  if (futuresMap[symbol]) return futuresMap[symbol];

  // Indices
  const indexMap: Record<string, string> = {
    '^GSPC': 'SPX',
    '^DJI': 'DJI',
    '^IXIC': 'NDX',
    '^FTSE': 'FTSE100',
    '^N225': 'NI225',
  };
  if (indexMap[symbol]) return indexMap[symbol];

  return symbol;
}

async function fetchFinnhub(symbol: string): Promise<MarketDataResult | null> {
  const apiKey = getFinnhubKey();
  if (!apiKey) return null;

  const fhSymbol = translateToFinnhub(symbol);
  const cacheKey = `fh_${fhSymbol}`;
  const cached = getCached<MarketDataResult>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch candles (daily, 3 months)
    const to = Math.floor(Date.now() / 1000);
    const from = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
    const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(fhSymbol)}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;

    const candleRes = await fetch(candleUrl, { signal: AbortSignal.timeout(10000) });
    if (!candleRes.ok) return null;

    const candleJson = await candleRes.json();
    if (candleJson.s !== 'ok' || !candleJson.c || candleJson.c.length === 0) return null;

    const closes: number[] = [];
    const fhHighs: number[] = [];
    const fhLows: number[] = [];
    const fhVolumes: number[] = [];
    const fhTimestamps: string[] = [];

    for (let i = 0; i < candleJson.c.length; i++) {
      const close = candleJson.c[i];
      if (close <= 0) continue;
      closes.push(close);
      fhHighs.push(candleJson.h?.[i] || close);
      fhLows.push(candleJson.l?.[i] || close);
      fhVolumes.push(candleJson.v?.[i] || 0);
      fhTimestamps.push(new Date(candleJson.t[i] * 1000).toISOString().split('T')[0]);
    }

    if (closes.length === 0) return null;

    // Also get current quote for more accurate price
    let currentPrice = closes[closes.length - 1];
    let change = 0;
    let changePercent = 0;

    try {
      const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(fhSymbol)}&token=${apiKey}`;
      const quoteRes = await fetch(quoteUrl, { signal: AbortSignal.timeout(5000) });
      if (quoteRes.ok) {
        const quoteJson = await quoteRes.json();
        if (quoteJson.c && quoteJson.c > 0) {
          currentPrice = quoteJson.c;
          change = quoteJson.d || 0;
          changePercent = quoteJson.dp || 0;
        }
      }
    } catch {
      // Quote failed; use last candle close
    }

    // Take last 60
    const last60Closes = closes.slice(-60);
    const last60Highs = fhHighs.slice(-60);
    const last60Lows = fhLows.slice(-60);
    const last60Volumes = fhVolumes.slice(-60);
    const last60Ts = fhTimestamps.slice(-60);

    const data: MarketDataResult = {
      symbol,
      name: ENGLISH_NAMES[symbol] || symbol,
      currency: 'USD',
      currentPrice: Math.round(currentPrice * 10000) / 10000,
      change: Math.round(change * 10000) / 10000,
      changePercent: Math.round(changePercent * 100) / 100,
      historicalCloses: last60Closes,
      historicalHighs: last60Highs,
      historicalLows: last60Lows,
      historicalVolumes: last60Volumes,
      timestamps: last60Ts,
      source: 'finnhub',
    };

    setCache(cacheKey, data);
    console.log(`[FinancialData] Finnhub: ${symbol} = ${data.currentPrice} (${data.changePercent}%)`);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message?.slice(0, 100) : String(err).slice(0, 100);
    console.warn(`[FinancialData] Finnhub error for ${symbol}: ${message}`);
    return null;
  }
}

// ─── Public API: fetchMarketData ────────────────────────────────

/**
 * Fetch comprehensive market data for a symbol.
 * Tries Yahoo Finance first (no API key needed),
 * then Alpha Vantage, then Finnhub as fallbacks.
 * Never throws — always returns partial data on failure.
 */
export async function fetchMarketData(symbol: string): Promise<MarketDataResult> {
  const emptyResult: MarketDataResult = {
    symbol,
    name: ENGLISH_NAMES[symbol] || symbol,
    currency: 'USD',
    currentPrice: 0,
    change: 0,
    changePercent: 0,
    historicalCloses: [],
    historicalHighs: [],
    historicalLows: [],
    historicalVolumes: [],
    timestamps: [],
    source: 'none',
  };

  try {
    // 1. Try Yahoo Finance (free, no key)
    const yahooResult = await fetchYahooFinance(symbol);
    if (yahooResult && yahooResult.currentPrice > 0) return yahooResult;

    // 2. Try Alpha Vantage
    const avResult = await fetchAlphaVantage(symbol);
    if (avResult && avResult.currentPrice > 0) return avResult;

    // 3. Try Finnhub
    const fhResult = await fetchFinnhub(symbol);
    if (fhResult && fhResult.currentPrice > 0) return fhResult;

    // All providers failed
    console.warn(`[FinancialData] All providers failed for ${symbol}`);
    return emptyResult;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message?.slice(0, 100) : String(err).slice(0, 100);
    console.error(`[FinancialData] Unexpected error for ${symbol}: ${message}`);
    return emptyResult;
  }
}

// ─── Public API: fetchLiveTicker ────────────────────────────────

/**
 * Fetch live ticker data for the default set of symbols.
 * Used for video overlays and news tickers.
 * Returns partial data if some symbols fail — never throws.
 */
export async function fetchLiveTicker(locale: string = 'ar'): Promise<TickerItem[]> {
  const nameMap = locale === 'ar' ? ARABIC_NAMES : ENGLISH_NAMES;
  const results: TickerItem[] = [];

  // Fetch all symbols in parallel
  const promises = DEFAULT_TICKER_SYMBOLS.map(async (symbol) => {
    try {
      const data = await fetchMarketData(symbol);
      if (data.currentPrice > 0) {
        return {
          symbol,
          name: nameMap[symbol] || data.name || symbol,
          price: data.currentPrice,
          change: data.change,
          changePercent: data.changePercent,
        } satisfies TickerItem;
      }
      return null;
    } catch {
      return null;
    }
  });

  const settled = await Promise.allSettled(promises);

  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value !== null) {
      results.push(result.value);
    }
  }

  // If we got nothing, return placeholders with zero values
  if (results.length === 0) {
    for (const symbol of DEFAULT_TICKER_SYMBOLS) {
      results.push({
        symbol,
        name: nameMap[symbol] || symbol,
        price: 0,
        change: 0,
        changePercent: 0,
      });
    }
  }

  return results;
}

/**
 * Get the list of default ticker symbols.
 */
export function getDefaultTickerSymbols(): string[] {
  return [...DEFAULT_TICKER_SYMBOLS];
}

/**
 * Clear the in-memory cache (useful for forced refreshes).
 */
export function clearFinancialDataCache(): void {
  cache.clear();
}

/**
 * Check which data providers are available.
 */
export function getDataProviderStatus(): {
  yahooFinance: boolean;
  alphaVantage: boolean;
  finnhub: boolean;
} {
  return {
    yahooFinance: true, // Always available (no key needed)
    alphaVantage: !!getAlphaVantageKey(),
    finnhub: !!getFinnhubKey(),
  };
}
