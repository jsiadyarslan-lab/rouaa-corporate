// @ts-nocheck
// ─── Financial APIs Client ──────────────────────────────────
// Central API client for fetching real financial data from
// multiple providers: Yahoo Finance (FREE, no key), FMP, Alpha Vantage, Finnhub, CoinGecko
// Includes smart in-memory caching with TTL to avoid rate limits.
// ALL API keys are read from env vars only (never exposed to client).
// Yahoo Finance is the PRIMARY free source — no API key needed!

// ─── Types ──────────────────────────────────────────────────

export interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  previousClose: number;
  timestamp: number;
}

export interface HistoricalPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketOverview {
  indices: Record<string, QuoteData>;
  commodities: Record<string, QuoteData>;
  currencies: Record<string, QuoteData>;
  crypto: Record<string, QuoteData>;
  bondYields: Record<string, QuoteData>;
}

export interface IndicatorUpdate {
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  history: { date: string; value: number }[];
  /** If true, this data is simulated/fake (no real API source was available) */
  isSimulated?: boolean;
}

// ─── In-Memory Cache ────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

const CACHE_TTL_QUOTES = 5 * 60 * 1000;    // 5 minutes for real-time quotes
const CACHE_TTL_HISTORY = 60 * 60 * 1000;  // 1 hour for historical data
const CACHE_TTL_RATES = 30 * 60 * 1000;    // 30 minutes for exchange rates

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── API Key Helpers ────────────────────────────────────────

function getAlphaVantageKey(): string | null {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  return key && key.trim() !== '' && key !== 'demo' ? key : null;
}

function getFinnhubKey(): string | null {
  const key = process.env.FINNHUB_API_KEY;
  return key && key.trim() !== '' ? key : null;
}

function getExchangeRateApiKey(): string | null {
  const key = process.env.EXCHANGE_RATE_API_KEY;
  return key && key.trim() !== '' ? key : null;
}

// ─── Alpha Vantage API ──────────────────────────────────────

async function fetchAlphaVantageQuote(symbol: string): Promise<QuoteData | null> {
  const apiKey = getAlphaVantageKey();
  if (!apiKey) return null;

  const cacheKey = `av_quote_${symbol}`;
  const cached = getCached<QuoteData>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    const gq = json['Global Quote'];
    if (!gq || !gq['05. price']) return null;

    const quote: QuoteData = {
      symbol: gq['01. symbol'] || symbol,
      price: parseFloat(gq['05. price']) || 0,
      change: parseFloat(gq['09. change']) || 0,
      changePercent: parseFloat((gq['10. change percent'] || '0').replace('%', '')) || 0,
      high: parseFloat(gq['03. high']) || 0,
      low: parseFloat(gq['04. low']) || 0,
      open: parseFloat(gq['02. open']) || 0,
      volume: parseInt(gq['06. volume']) || 0,
      previousClose: parseFloat(gq['08. previous close']) || 0,
      timestamp: new Date(gq['07. latest trading day'] || Date.now()).getTime(),
    };

    setCache(cacheKey, quote, CACHE_TTL_QUOTES);
    console.log(`[FinancialAPIs] Alpha Vantage quote fetched: ${symbol} = ${quote.price}`);
    return quote;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] Alpha Vantage quote error for ${symbol}:`, err.message?.slice(0, 100));
    return null;
  }
}

async function fetchAlphaVantageHistory(symbol: string, days: number = 90): Promise<HistoricalPoint[]> {
  const apiKey = getAlphaVantageKey();
  if (!apiKey) return [];

  const cacheKey = `av_history_${symbol}_${days}`;
  const cached = getCached<HistoricalPoint[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    const ts = json['Time Series (Daily)'];
    if (!ts) return [];

    const points: HistoricalPoint[] = [];
    const entries = Object.entries(ts).slice(0, days);

    for (const [date, values] of entries) {
      const v = values as Record<string, string>;
      points.push({
        date,
        open: parseFloat(v['1. open']) || 0,
        high: parseFloat(v['2. high']) || 0,
        low: parseFloat(v['3. low']) || 0,
        close: parseFloat(v['4. close']) || 0,
        volume: parseInt(v['5. volume']) || 0,
      });
    }

    setCache(cacheKey, points, CACHE_TTL_HISTORY);
    console.log(`[FinancialAPIs] Alpha Vantage history fetched: ${symbol} = ${points.length} days`);
    return points;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] Alpha Vantage history error for ${symbol}:`, err.message?.slice(0, 100));
    return [];
  }
}

// ─── Finnhub API ────────────────────────────────────────────

/**
 * Fetch OHLCV candle data from Finnhub.
 * Free tier supports daily/weekly/monthly candles for stocks, forex, crypto.
 * Returns empty array if API key not configured or request fails.
 *
 * Finnhub candle endpoint: GET /stock/candle?symbol=...&resolution=...&from=...&to=...
 * Resolution: 1, 5, 15, 30, 60, D, W, M
 */
async function fetchFinnhubCandles(
  symbol: string,
  resolution: string = 'D',
  days: number = 90
): Promise<HistoricalPoint[]> {
  const apiKey = getFinnhubKey();
  if (!apiKey) return [];

  // Translate symbol for Finnhub (e.g. BTC-USD → BINANCE:BTCUSDT)
  const fhSymbol = translateSymbolForFinnhub(symbol);

  const cacheKey = `fh_candle_${fhSymbol}_${resolution}_${days}`;
  const cached = getCached<HistoricalPoint[]>(cacheKey);
  if (cached) return cached;

  try {
    const to = Math.floor(Date.now() / 1000);
    const from = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(fhSymbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    // Finnhub returns: { s: "ok", t: [...], o: [...], h: [...], l: [...], c: [...], v: [...] }
    if (json.s !== 'ok' || !json.t || !json.c || json.t.length === 0) return [];

    const points: HistoricalPoint[] = [];
    for (let i = 0; i < json.t.length; i++) {
      const close = json.c[i];
      if (close <= 0) continue;
      points.push({
        date: new Date(json.t[i] * 1000).toISOString().split('T')[0],
        open: json.o?.[i] || close,
        high: json.h?.[i] || close,
        low: json.l?.[i] || close,
        close,
        volume: json.v?.[i] || 0,
      });
    }

    setCache(cacheKey, points, CACHE_TTL_HISTORY);
    console.log(`[FinancialAPIs] Finnhub candles fetched: ${symbol} = ${points.length} points (${resolution})`);
    return points;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] Finnhub candle error for ${symbol}:`, err.message?.slice(0, 100));
    return [];
  }
}

async function fetchFinnhubQuote(symbol: string): Promise<QuoteData | null> {
  const apiKey = getFinnhubKey();
  if (!apiKey) return null;

  // Translate symbol for Finnhub (e.g. BTC-USD → BINANCE:BTCUSDT)
  const fhSymbol = translateSymbolForFinnhub(symbol);

  const cacheKey = `fh_quote_${fhSymbol}`;
  const cached = getCached<QuoteData>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(fhSymbol)}&token=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.c || json.c === 0) return null;

    const quote: QuoteData = {
      symbol,
      price: json.c,          // current price
      change: json.d,          // change
      changePercent: json.dp,  // change percent
      high: json.h,            // high price of the day
      low: json.l,             // low price of the day
      open: json.o,            // open price of the day
      volume: 0,               // Finnhub quote doesn't include volume
      previousClose: json.pc,  // previous close price
      timestamp: json.t ? json.t * 1000 : Date.now(),
    };

    setCache(cacheKey, quote, CACHE_TTL_QUOTES);
    console.log(`[FinancialAPIs] Finnhub quote fetched: ${symbol} = ${quote.price}`);
    return quote;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] Finnhub quote error for ${symbol}:`, err.message?.slice(0, 100));
    return null;
  }
}

// ─── Exchange Rate API ──────────────────────────────────────

async function fetchExchangeRate(from: string, to: string): Promise<number | null> {
  const apiKey = getExchangeRateApiKey();
  if (!apiKey) return null;

  const cacheKey = `er_${from}_${to}`;
  const cached = getCached<number>(cacheKey);
  if (cached !== null) return cached;

  try {
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.conversion_result && json.result !== 'success') return null;

    const rate = json.conversion_rate || json.conversion_result;
    if (!rate || typeof rate !== 'number') return null;

    setCache(cacheKey, rate, CACHE_TTL_RATES);
    console.log(`[FinancialAPIs] Exchange rate fetched: ${from}/${to} = ${rate}`);
    return rate;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] Exchange rate error for ${from}/${to}:`, err.message?.slice(0, 100));
    return null;
  }
}

// ─── Symbol Format Detection for Alpha Vantage ────────────
// Alpha Vantage uses different endpoints and symbol formats than Finnhub.
// This parser detects the symbol type and extracts the base currencies
// so we can call the correct Alpha Vantage endpoint.
//
// Finnhub formats:  BINANCE:BTCUSDT, OANDA:XAU_USD, OANDA:EUR_USD
// Alpha Vantage needs: from_currency=XAU&to_currency=USD (for CURRENCY_EXCHANGE_RATE)
//                       symbol=BTC&market=USD (for DIGITAL_CURRENCY_DAILY)

function parseSymbolForAV(symbol: string): {
  type: 'stock' | 'crypto' | 'forex' | 'commodity';
  from?: string;
  to?: string;
} {
  // ── Yahoo Finance format symbols ──
  // Yahoo Finance crypto: BTC-USD, ETH-USD, SOL-USD
  const yahooCryptoMatch = symbol.match(/^([A-Z]{2,6})-USD$/i);
  if (yahooCryptoMatch) return { type: 'crypto', from: yahooCryptoMatch[1].toUpperCase(), to: 'USD' };

  // Yahoo Finance forex: EURUSD=X, GBPUSD=X, USDJPY=X
  const yahooForexMatch = symbol.match(/^([A-Z]{3})([A-Z]{3})=X$/i);
  if (yahooForexMatch) return { type: 'forex', from: yahooForexMatch[1].toUpperCase(), to: yahooForexMatch[2].toUpperCase() };

  // Yahoo Finance futures/commodities: GC=F (gold), SI=F (silver), CL=F (crude oil)
  const YAHOO_FUTURES_MAP: Record<string, { type: 'commodity'; from: string; to: string }> = {
    'GC=F':  { type: 'commodity', from: 'XAU', to: 'USD' },   // Gold
    'SI=F':  { type: 'commodity', from: 'XAG', to: 'USD' },   // Silver
    'CL=F':  { type: 'commodity', from: 'WTI', to: 'USD' },   // Crude Oil (WTI)
    'HG=F':  { type: 'commodity', from: 'XCU', to: 'USD' },   // Copper
    'NG=F':  { type: 'commodity', from: 'NGAS', to: 'USD' },  // Natural Gas
    'ZC=F':  { type: 'commodity', from: 'CORN', to: 'USD' },  // Corn
    'ZW=F':  { type: 'commodity', from: 'WHEAT', to: 'USD' }, // Wheat
    'ZN=F':  { type: 'commodity', from: 'NOTE', to: 'USD' },  // 10-Year Treasury Note
    'ZB=F':  { type: 'commodity', from: 'BOND', to: 'USD' },  // 30-Year Treasury Bond
  };
  if (YAHOO_FUTURES_MAP[symbol.toUpperCase()]) return YAHOO_FUTURES_MAP[symbol.toUpperCase()];

  // ── Provider-specific formats ──
  // BINANCE:BTCUSDT → crypto BTC/USD
  if (symbol.startsWith('BINANCE:')) {
    const pair = symbol.slice(8);
    if (pair.toUpperCase().endsWith('USDT')) return { type: 'crypto', from: pair.slice(0, -4), to: 'USD' };
    if (pair.toUpperCase().endsWith('USD'))  return { type: 'crypto', from: pair.slice(0, -3), to: 'USD' };
    if (pair.toUpperCase().endsWith('BUSD'))  return { type: 'crypto', from: pair.slice(0, -4), to: 'USD' };
    return { type: 'crypto', from: pair, to: 'USD' };
  }
  // OANDA:XAU_USD → commodity/forex XAU/USD
  if (symbol.startsWith('OANDA:')) {
    const pair = symbol.slice(6);
    const parts = pair.split('_');
    if (parts.length === 2) {
      const from = parts[0].toUpperCase();
      // Gold and Silver are commodities in AV
      if (['XAU', 'XAG', 'XPD', 'XPT', 'WTI'].includes(from)) {
        return { type: 'commodity', from: parts[0], to: parts[1] };
      }
      return { type: 'forex', from: parts[0], to: parts[1] };
    }
    return { type: 'forex', from: pair, to: 'USD' };
  }
  // ── Bare symbol patterns ──
  // Crypto patterns: BTCUSD, ETHUSD, SOLUSD
  const cryptoMatch = symbol.match(/^(BTC|ETH|SOL|XRP|BNB|DOGE|ADA|DOT|MATIC|AVAX)(USDT?|BUSD)$/i);
  if (cryptoMatch) return { type: 'crypto', from: cryptoMatch[1].toUpperCase(), to: 'USD' };
  // Commodity patterns: XAUUSD, XAGUSD
  if (/^XAU/i.test(symbol)) return { type: 'commodity', from: 'XAU', to: 'USD' };
  if (/^XAG/i.test(symbol)) return { type: 'commodity', from: 'XAG', to: 'USD' };
  // Forex patterns: EURUSD, GBPUSD, USDJPY
  const forexMatch = symbol.match(/^([A-Z]{3})([A-Z]{3})$/);
  if (forexMatch) return { type: 'forex', from: forexMatch[1], to: forexMatch[2] };
  // Default: stock
  return { type: 'stock' };
}

// ─── Finnhub Symbol Translation ────────────────────────────
// Translates Yahoo Finance and other symbol formats to Finnhub's expected format.
// Finnhub uses: BINANCE:BTCUSDT for crypto, OANDA:XAU_USD for commodities/forex.

function translateSymbolForFinnhub(symbol: string): string {
  // Yahoo Finance crypto: BTC-USD → BINANCE:BTCUSDT
  const yahooCryptoMatch = symbol.match(/^([A-Z]{2,6})-USD$/i);
  if (yahooCryptoMatch) return `BINANCE:${yahooCryptoMatch[1].toUpperCase()}USDT`;

  // Yahoo Finance forex: EURUSD=X → OANDA:EUR_USD
  const yahooForexMatch = symbol.match(/^([A-Z]{3})([A-Z]{3})=X$/i);
  if (yahooForexMatch) return `OANDA:${yahooForexMatch[1].toUpperCase()}_${yahooForexMatch[2].toUpperCase()}`;

  // Yahoo Finance futures: GC=F → OANDA:XAU_USD
  const YAHOO_FINNHUB_MAP: Record<string, string> = {
    'GC=F': 'OANDA:XAU_USD',
    'SI=F': 'OANDA:XAG_USD',
    'CL=F': 'OANDA:WTI_USD',
    'HG=F': 'OANDA:XCU_USD',
    'NG=F': 'OANDA:NGAS_USD',
  };
  if (YAHOO_FINNHUB_MAP[symbol.toUpperCase()]) return YAHOO_FINNHUB_MAP[symbol.toUpperCase()];

  // Already in Finnhub format or standard stock symbol
  return symbol;
}

// ─── Alpha Vantage Currency Exchange Rate ────────────────────
// Works for crypto, forex, and commodities (gold, silver).
// Uses CURRENCY_EXCHANGE_RATE function which supports all currency-like pairs.

async function fetchAlphaVantageCurrencyRate(fromCurrency: string, toCurrency: string): Promise<QuoteData | null> {
  const apiKey = getAlphaVantageKey();
  if (!apiKey) return null;

  const cacheKey = `av_currency_${fromCurrency}_${toCurrency}`;
  const cached = getCached<QuoteData>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${encodeURIComponent(fromCurrency)}&to_currency=${encodeURIComponent(toCurrency)}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    const rate = json['Realtime Currency Exchange Rate'];
    if (!rate || !rate['5. Exchange Rate']) return null;

    const price = parseFloat(rate['5. Exchange Rate']) || 0;
    if (price <= 0) return null;

    // CURRENCY_EXCHANGE_RATE doesn't provide change/high/low/volume
    // We'll populate what we can and set the rest to reasonable defaults
    const quote: QuoteData = {
      symbol: `${fromCurrency}${toCurrency}`,
      price,
      change: 0,
      changePercent: 0,
      high: price,
      low: price,
      open: price,
      volume: 0,
      previousClose: price,
      timestamp: new Date(rate['6. Last Refreshed'] || Date.now()).getTime(),
    };

    setCache(cacheKey, quote, CACHE_TTL_QUOTES);
    console.log(`[FinancialAPIs] Alpha Vantage currency rate: ${fromCurrency}/${toCurrency} = ${price}`);
    return quote;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] Alpha Vantage currency rate error for ${fromCurrency}/${toCurrency}:`, err.message?.slice(0, 100));
    return null;
  }
}

// ─── Alpha Vantage Digital Currency Daily ────────────────────
// For crypto historical data. Returns daily OHLCV data.
// Uses DIGITAL_CURRENCY_DAILY function.

async function fetchAlphaVantageCryptoHistory(
  symbol: string,
  market: string = 'USD',
  days: number = 90
): Promise<HistoricalPoint[]> {
  const apiKey = getAlphaVantageKey();
  if (!apiKey) return [];

  const cacheKey = `av_crypto_history_${symbol}_${market}_${days}`;
  const cached = getCached<HistoricalPoint[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${encodeURIComponent(symbol)}&market=${encodeURIComponent(market)}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    const ts = json['Time Series (Digital Currency Daily)'];
    if (!ts) return [];

    const points: HistoricalPoint[] = [];
    const entries = Object.entries(ts).slice(0, days);

    for (const [date, values] of entries) {
      const v = values as Record<string, string>;
      // Alpha Vantage returns both market currency and USD values
      // Keys like: "1a. open (USD)", "1b. open (EUR)", etc.
      // We always use the market-currency values (b keys)
      const marketKey = market.toUpperCase();
      const open  = parseFloat(v[`1b. open (${marketKey})`]  || v['1b. open (USD)']  || v['1a. open (USD)']  || '0');
      const high  = parseFloat(v[`2b. high (${marketKey})`]  || v['2b. high (USD)']  || v['2a. high (USD)']  || '0');
      const low   = parseFloat(v[`3b. low (${marketKey})`]   || v['3b. low (USD)']   || v['3a. low (USD)']   || '0');
      const close = parseFloat(v[`4b. close (${marketKey})`] || v['4b. close (USD)'] || v['4a. close (USD)'] || '0');

      if (close <= 0) continue;

      points.push({
        date,
        open:  open  || close,
        high:  high  || close,
        low:   low   || close,
        close,
        volume: parseInt(v['5. volume'] || '0') || 0,
      });
    }

    setCache(cacheKey, points, CACHE_TTL_HISTORY);
    console.log(`[FinancialAPIs] Alpha Vantage crypto history: ${symbol}/${market} = ${points.length} days`);
    return points;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] Alpha Vantage crypto history error for ${symbol}/${market}:`, err.message?.slice(0, 100));
    return [];
  }
}

// ─── CoinGecko API (FREE — no API key needed!) ──────────────
// CoinGecko provides free crypto price data without an API key.
// Rate limit: ~30 calls/minute on free tier. Perfect as last-resort fallback.
// Only supports crypto — not forex, stocks, or commodities.

const COINGECKO_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'XRP': 'ripple',
  'BNB': 'binancecoin',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'AVAX': 'avalanche-2',
  'MATIC': 'matic-network',
};

function getCoinGeckoId(symbol: string): string | null {
  // Strip BINANCE: prefix if present
  const clean = symbol.replace(/^BINANCE:/i, '').replace(/USDT?$/i, '').replace(/BUSD$/i, '');
  return COINGECKO_ID_MAP[clean.toUpperCase()] || null;
}

async function fetchCoinGeckoQuote(symbol: string): Promise<QuoteData | null> {
  const cgId = getCoinGeckoId(symbol);
  if (!cgId) return null;

  const cacheKey = `cg_quote_${cgId}`;
  const cached = getCached<QuoteData>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 0 },
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;

    const json = await res.json();
    const data = json[cgId];
    if (!data || !data.usd) return null;

    const price = data.usd;
    const changePercent = data.usd_24h_change || 0;
    const change = price * (changePercent / 100);
    const volume = data.usd_24h_vol || 0;

    const quote: QuoteData = {
      symbol: symbol.replace(/^BINANCE:/i, '').replace(/USDT$/i, 'USD'),
      price,
      change,
      changePercent,
      high: price * (1 + Math.abs(changePercent) / 200), // approximate
      low: price * (1 - Math.abs(changePercent) / 200),  // approximate
      open: price - change,
      volume: Math.round(volume),
      previousClose: price - change,
      timestamp: Date.now(),
    };

    setCache(cacheKey, quote, CACHE_TTL_QUOTES);
    console.log(`[FinancialAPIs] CoinGecko quote: ${cgId} = $${price}`);
    return quote;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] CoinGecko quote error for ${cgId}:`, err.message?.slice(0, 80));
    return null;
  }
}

async function fetchCoinGeckoHistory(symbol: string, days: number = 90): Promise<HistoricalPoint[]> {
  const cgId = getCoinGeckoId(symbol);
  if (!cgId) return [];

  const cacheKey = `cg_history_${cgId}_${days}`;
  const cached = getCached<HistoricalPoint[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 0 },
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return [];

    const json = await res.json();
    if (!json.prices || !Array.isArray(json.prices)) return [];

    const points: HistoricalPoint[] = [];
    for (let i = 0; i < json.prices.length; i++) {
      const [timestamp, price] = json.prices[i];
      if (price <= 0) continue;

      // CoinGecko returns [timestamp, price] for prices, total_volumes, market_caps
      const volume = json.total_volumes?.[i]?.[1] || 0;
      const date = new Date(timestamp).toISOString().split('T')[0];

      points.push({
        date,
        open: price,  // CoinGecko doesn't provide OHLCV on free endpoint
        high: price,
        low: price,
        close: price,
        volume: Math.round(volume),
      });
    }

    setCache(cacheKey, points, CACHE_TTL_HISTORY);
    console.log(`[FinancialAPIs] CoinGecko history: ${cgId} = ${points.length} days`);
    return points;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] CoinGecko history error for ${cgId}:`, err.message?.slice(0, 80));
    return [];
  }
}

// ─── Yahoo Finance Integration (FREE — no API key needed!) ──────────────
// Yahoo Finance via yahoo-finance2 package provides unlimited free data.
// This is the PRIMARY free data source. No API key required.
// Supports: stocks, ETFs, indices, forex, crypto, commodities.
// Rate limit: ~2,000 requests/hour (soft cap)

async function fetchYahooQuoteAsQuoteData(symbol: string): Promise<QuoteData | null> {
  const cacheKey = `yf_quote_${symbol}`;
  const cached = getCached<QuoteData>(cacheKey);
  if (cached) return cached;

  try {
    // Yahoo Finance v3: use new YahooFinance() constructor
    const YahooFinance = (await import('yahoo-finance2')).default;
    const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
    const quote = await yf.quote(symbol);

    if (!quote || !quote.regularMarketPrice) return null;

    const price = quote.regularMarketPrice || 0;
    if (price <= 0) return null;

    const result: QuoteData = {
      symbol: quote.symbol || symbol,
      price,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      high: quote.regularMarketDayHigh || price,
      low: quote.regularMarketDayLow || price,
      open: quote.regularMarketOpen || price,
      volume: quote.regularMarketVolume || 0,
      previousClose: quote.regularMarketPreviousClose || price,
      timestamp: quote.regularMarketTime ? quote.regularMarketTime * 1000 : Date.now(),
      // Extended fields stored in cache for enrichment
      _yahooExtra: {
        marketCap: quote.marketCap || null,
        peRatio: quote.trailingPE || quote.forwardPE || null,
        eps: quote.epsTrailingTwelveMonths || quote.epsForward || null,
        week52High: quote.fiftyTwoWeekHigh || null,
        week52Low: quote.fiftyTwoWeekLow || null,
        avgVolume: quote.averageDailyVolume3Month || null,
        dividendYield: quote.dividendYield ? quote.dividendYield * 100 : null,
        name: quote.shortName || quote.longName || null,
        exchange: quote.fullExchangeName || quote.exchangeName || null,
      },
    } as any;

    setCache(cacheKey, result, CACHE_TTL_QUOTES);
    console.log(`[FinancialAPIs] Yahoo Finance quote fetched: ${symbol} = $${price}`);
    return result;
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (!msg.includes('No data found') && !msg.includes('Not Found')) {
      console.warn(`[FinancialAPIs] Yahoo Finance quote error for ${symbol}:`, msg.slice(0, 100));
    }
    return null;
  }
}

async function fetchYahooHistoryAsHistoricalPoints(
  symbol: string,
  days: number = 90
): Promise<HistoricalPoint[]> {
  const cacheKey = `yf_history_${symbol}_${days}`;
  const cached = getCached<HistoricalPoint[]>(cacheKey);
  if (cached) return cached;

  try {
    const YahooFinance = (await import('yahoo-finance2')).default;
    const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
    const period1 = new Date();
    period1.setDate(period1.getDate() - days);

    const result = await yf.chart(symbol, {
      period1: period1.toISOString().split('T')[0],
      interval: '1d',
    });

    if (!result || !result.quotes || result.quotes.length === 0) return [];

    const points: HistoricalPoint[] = [];
    for (const q of result.quotes) {
      if (!q.close || q.close <= 0) continue;
      const dateStr = q.date instanceof Date
        ? q.date.toISOString().split('T')[0]
        : new Date(q.date).toISOString().split('T')[0];

      points.push({
        date: dateStr,
        open: q.open || q.close,
        high: q.high || q.close,
        low: q.low || q.close,
        close: q.close,
        volume: q.volume || 0,
      });
    }

    setCache(cacheKey, points, CACHE_TTL_HISTORY);
    console.log(`[FinancialAPIs] Yahoo Finance history fetched: ${symbol} = ${points.length} days`);
    return points;
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn(`[FinancialAPIs] Yahoo Finance history error for ${symbol}:`, msg.slice(0, 100));
    return [];
  }
}

/**
 * Fetch comprehensive company data from Yahoo Finance.
 * Returns profile, financials, and recommendations — all for free!
 * No API key required. This is used by the stock analysis API route
 * as a free fallback when FMP data is not available.
 */
interface YahooFinanceCompanyDataResult {
  quote: QuoteData | null;
  profile: {
    name: string;
    industry: string;
    sector: string;
    country: string;
    exchange: string;
    marketCap: number;
    peRatio: number;
    eps: number;
    dividendYield: number;
    beta: number;
    week52High: number;
    week52Low: number;
    avgVolume: number;
    price: number;
    description: string;
    website: string;
    ceo: string;
    fullTimeEmployees: number;
  } | null;
  incomeStatements: any[];
  balanceSheets: any[];
  cashFlowStatements: any[];
  recommendations: any[];
  keyMetrics: {
    peRatio: number;
    eps: number;
    marketCap: number;
    dividendYield: number;
    beta: number;
    roe: number;
    roa: number;
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    debtToEquity: number;
    currentRatio: number;
    revenueGrowth: number;
    earningsGrowth: number;
    sector: string;
    industry: string;
  } | null;
  rating: {
    ratingRecommendation: string;
    targetHigh: number;
    targetLow: number;
    targetMedian: number;
    targetConsensus: number;
  } | null;
}

export async function getYahooFinanceCompanyData(symbol: string): Promise<YahooFinanceCompanyDataResult> {
  try {
    const YahooFinance = (await import('yahoo-finance2')).default;
    const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

    // Fetch all data in parallel
    const [
      quoteResult,
      summaryResult,
    ] = await Promise.allSettled([
      yf.quote(symbol),
      yf.quoteSummary(symbol, {
        modules: [
          'assetProfile', 'summaryDetail', 'defaultKeyStatistics',
          'price', 'financialData', 'incomeStatementHistory',
          'balanceSheetHistory', 'cashflowStatementHistory',
          'recommendationTrend',
        ],
      }),
    ]);

    // Process quote
    let quote: QuoteData | null = null;
    let yahooQuoteExtra: any = {};
    if (quoteResult.status === 'fulfilled' && quoteResult.value?.regularMarketPrice) {
      const q = quoteResult.value;
      const price = q.regularMarketPrice;
      quote = {
        symbol: q.symbol || symbol,
        price,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        high: q.regularMarketDayHigh || price,
        low: q.regularMarketDayLow || price,
        open: q.regularMarketOpen || price,
        volume: q.regularMarketVolume || 0,
        previousClose: q.regularMarketPreviousClose || price,
        timestamp: q.regularMarketTime ? q.regularMarketTime * 1000 : Date.now(),
        // Include Yahoo extra data for company enrichment
        _yahooExtra: {
          marketCap: q.marketCap || null,
          peRatio: q.trailingPE || q.forwardPE || null,
          eps: q.epsTrailingTwelveMonths || q.epsForward || null,
          week52High: q.fiftyTwoWeekHigh || null,
          week52Low: q.fiftyTwoWeekLow || null,
          name: q.shortName || q.longName || null,
          exchange: q.fullExchangeName || q.exchangeName || null,
          beta: q.beta || null,
          dividendYield: q.dividendYield || q.trailingAnnualDividendYield ? (q.dividendYield || (q.trailingAnnualDividendYield ? q.trailingAnnualDividendYield * 100 : null)) : null,
          avgVolume: q.averageDailyVolume3Month || null,
        },
      } as any;
      yahooQuoteExtra = {
        marketCap: q.marketCap || null,
        peRatio: q.trailingPE || q.forwardPE || null,
        eps: q.epsTrailingTwelveMonths || q.epsForward || null,
        week52High: q.fiftyTwoWeekHigh || null,
        week52Low: q.fiftyTwoWeekLow || null,
        name: q.shortName || q.longName || null,
        exchange: q.fullExchangeName || q.exchangeName || null,
      };
    }

    // Process summary
    let profile: any = null;
    let incomeStatements: any[] = [];
    let balanceSheets: any[] = [];
    let cashFlowStatements: any[] = [];
    let recommendations: any[] = [];
    let keyMetrics: any = null;
    let rating: any = null;

    if (summaryResult.status === 'fulfilled' && summaryResult.value) {
      const s = summaryResult.value;
      const assetProfile = s.assetProfile;
      const summaryDetail = s.summaryDetail;
      const defaultKeyStats = s.defaultKeyStatistics;
      const priceData = s.price;
      const financialData = s.financialData;
      console.log(`[FinancialAPIs] quoteSummary modules received: assetProfile=${!!assetProfile}, financialData=${!!financialData}, summaryDetail=${!!summaryDetail}, defaultKeyStats=${!!defaultKeyStats}`);

      // Profile
      if (assetProfile || priceData) {
        profile = {
          name: priceData?.shortName || priceData?.longName || yahooQuoteExtra.name || symbol,
          industry: assetProfile?.industry || '',
          sector: assetProfile?.sector || '',
          country: assetProfile?.country || '',
          exchange: priceData?.exchangeName || yahooQuoteExtra.exchange || '',
          marketCap: defaultKeyStats?.enterpriseValue || summaryDetail?.marketCap || yahooQuoteExtra.marketCap || 0,
          peRatio: summaryDetail?.trailingPE || defaultKeyStats?.forwardPE || yahooQuoteExtra.peRatio || 0,
          eps: defaultKeyStats?.trailingEps || yahooQuoteExtra.eps || 0,
          dividendYield: summaryDetail?.dividendYield
            ? summaryDetail.dividendYield * 100
            : 0,
          beta: defaultKeyStats?.beta || 0,
          week52High: summaryDetail?.fiftyTwoWeekHigh || yahooQuoteExtra.week52High || 0,
          week52Low: summaryDetail?.fiftyTwoWeekLow || yahooQuoteExtra.week52Low || 0,
          avgVolume: summaryDetail?.averageVolume || 0,
          price: priceData?.regularMarketPrice || quote?.price || 0,
          description: assetProfile?.longBusinessSummary || '',
          website: assetProfile?.website || '',
          ceo: assetProfile?.companyOfficers?.[0]?.name || '',
          fullTimeEmployees: assetProfile?.fullTimeEmployees || 0,
        };
      }

      // Income Statements
      if (s.incomeStatementHistory?.incomeStatementHistory) {
        incomeStatements = s.incomeStatementHistory.incomeStatementHistory.slice(0, 4).map((st: any) => ({
          date: st.endDate?.fmt || '',
          symbol,
          revenue: st.totalRevenue || 0,
          costOfRevenue: st.costOfRevenue || 0,
          grossProfit: st.grossProfit || 0,
          operatingIncome: st.operatingIncome || 0,
          netIncome: st.netIncome || 0,
          eps: st.netIncome && st.basicAverageShares
            ? st.netIncome / st.basicAverageShares
            : 0,
          ebitda: st.ebitda || 0,
          period: 'annual',
        }));
      }

      // Balance Sheets
      if (s.balanceSheetHistory?.balanceSheetStatements) {
        balanceSheets = s.balanceSheetHistory.balanceSheetStatements.slice(0, 4).map((st: any) => ({
          date: st.endDate?.fmt || '',
          symbol,
          totalAssets: st.totalAssets || 0,
          totalLiabilities: st.totalLiab || 0,
          totalStockholdersEquity: st.totalStockholderEquity || 0,
          cashAndCashEquivalents: st.cash || 0,
          totalDebt: (st.shortLongTermDebt || 0) + (st.longTermDebt || 0),
          netDebt: 0,
          currentAssets: st.totalCurrentAssets || 0,
          currentLiabilities: st.totalCurrentLiabilities || 0,
          longTermDebt: st.longTermDebt || 0,
          retainedEarnings: st.retainedEarnings || 0,
          period: 'annual',
        }));
      }

      // Cash Flow Statements
      if (s.cashflowStatementHistory?.cashflowStatements) {
        cashFlowStatements = s.cashflowStatementHistory.cashflowStatements.slice(0, 4).map((st: any) => ({
          date: st.endDate?.fmt || '',
          symbol,
          operatingCashFlow: st.totalCashFromOperatingActivities || 0,
          capitalExpenditure: st.capitalExpenditures || 0,
          freeCashFlow: st.freeCashFlow || 0,
          netIncome: st.netIncome || 0,
          depreciationAndAmortization: st.depreciation || 0,
          period: 'annual',
        }));
      }

      // Recommendations
      if (s.recommendationTrend?.trend) {
        recommendations = s.recommendationTrend.trend.slice(0, 3).map((t: any) => ({
          period: t.period || '',
          strongBuy: t.strongBuy || 0,
          buy: t.buy || 0,
          hold: t.hold || 0,
          sell: t.sell || 0,
          strongSell: t.strongSell || 0,
        }));
      }

      // Key Metrics (from financialData + defaultKeyStatistics)
      if (financialData || defaultKeyStats) {
        keyMetrics = {
          peRatio: summaryDetail?.trailingPE || defaultKeyStats?.forwardPE || yahooQuoteExtra.peRatio || 0,
          eps: defaultKeyStats?.trailingEps || yahooQuoteExtra.eps || 0,
          marketCap: defaultKeyStats?.enterpriseValue || summaryDetail?.marketCap || yahooQuoteExtra.marketCap || 0,
          dividendYield: summaryDetail?.dividendYield
            ? summaryDetail.dividendYield * 100
            : 0,
          beta: defaultKeyStats?.beta || 0,
          roe: financialData?.returnOnEquity ? financialData.returnOnEquity * 100 : 0,
          roa: financialData?.returnOnAssets ? financialData.returnOnAssets * 100 : 0,
          grossMargin: financialData?.grossMargins ? financialData.grossMargins * 100 : 0,
          operatingMargin: financialData?.operatingMargins ? financialData.operatingMargins * 100 : 0,
          netMargin: financialData?.profitMargins ? financialData.profitMargins * 100 : 0,
          debtToEquity: financialData?.debtToEquity || 0,
          currentRatio: financialData?.currentRatio || 0,
          revenueGrowth: financialData?.revenueGrowth ? financialData.revenueGrowth * 100 : 0,
          earningsGrowth: financialData?.earningsGrowth ? financialData.earningsGrowth * 100 : 0,
          sector: assetProfile?.sector || '',
          industry: assetProfile?.industry || '',
        };

        // Rating from recommendations
        if (recommendations.length > 0) {
          const latest = recommendations[0];
          const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
          const buyWeight = (latest.strongBuy * 2 + latest.buy) / (total || 1);
          let ratingRecommendation = 'Hold';
          if (buyWeight > 0.7) ratingRecommendation = 'Strong Buy';
          else if (buyWeight > 0.5) ratingRecommendation = 'Buy';
          else if (buyWeight < 0.2) ratingRecommendation = 'Strong Sell';
          else if (buyWeight < 0.35) ratingRecommendation = 'Sell';

          rating = {
            ratingRecommendation,
            targetHigh: financialData?.targetHighPrice || 0,
            targetLow: financialData?.targetLowPrice || 0,
            targetMedian: financialData?.targetMedianPrice || 0,
            targetConsensus: financialData?.targetMeanPrice || 0,
          };
        }
      }
    }

    // ── Fallback: Try fetching financialData separately if keyMetrics is missing margins ──
    // Sometimes the full quoteSummary with all modules fails but a focused call succeeds
    if (keyMetrics && !keyMetrics.grossMargin && !keyMetrics.operatingMargin && !keyMetrics.netMargin) {
      try {
        const fdResult = await yf.quoteSummary(symbol, { modules: ['financialData'] });
        const fd = fdResult?.financialData;
        console.log(`[FinancialAPIs] Fallback financialData call for ${symbol}: financialData=${!!fd}, grossMargins=${!!fd?.grossMargins}`);
        if (fd) {
          if (fd.grossMargins && !keyMetrics.grossMargin) keyMetrics.grossMargin = fd.grossMargins * 100;
          if (fd.operatingMargins && !keyMetrics.operatingMargin) keyMetrics.operatingMargin = fd.operatingMargins * 100;
          if (fd.profitMargins && !keyMetrics.netMargin) keyMetrics.netMargin = fd.profitMargins * 100;
          if (fd.returnOnEquity && !keyMetrics.roe) keyMetrics.roe = fd.returnOnEquity * 100;
          if (fd.returnOnAssets && !keyMetrics.roa) keyMetrics.roa = fd.returnOnAssets * 100;
          if (fd.debtToEquity && !keyMetrics.debtToEquity) keyMetrics.debtToEquity = fd.debtToEquity;
          if (fd.currentRatio && !keyMetrics.currentRatio) keyMetrics.currentRatio = fd.currentRatio;
          if (fd.revenueGrowth && !keyMetrics.revenueGrowth) keyMetrics.revenueGrowth = fd.revenueGrowth * 100;
          if (fd.earningsGrowth && !keyMetrics.earningsGrowth) keyMetrics.earningsGrowth = fd.earningsGrowth * 100;
        }
      } catch (fdErr: any) {
        console.warn(`[FinancialAPIs] Fallback financialData error for ${symbol}:`, fdErr?.message?.slice(0, 80));
      }
    }

    // ── Final fallback: Use fundamentalsTimeSeries to compute margins/ratios ──
    // This endpoint works more reliably than quoteSummary's financialData module
    if (keyMetrics && !keyMetrics.grossMargin && !keyMetrics.netMargin) {
      try {
        const tsData = await yf.fundamentalsTimeSeries(symbol, {
          period1: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          period2: new Date().toISOString().split('T')[0],
          type: 'annual',
          module: 'all',
        });
        if (Array.isArray(tsData) && tsData.length > 0) {
          const latest = tsData[0] as any;
          const totalRevenue = latest.totalRevenue || latest.operatingRevenue || 0;
          const grossProfit = latest.grossProfit || 0;
          const operatingIncome = latest.operatingIncome || latest.EBIT || 0;
          const netIncome = latest.netIncome || latest.netIncomeCommonStockholders || 0;
          const totalAssets = latest.totalAssets || 0;
          const stockholdersEquity = latest.stockholdersEquity || latest.commonStockEquity || latest.totalEquityGrossMinorityInterest || 0;
          const totalLiabilities = latest.totalLiabilitiesNetMinorityInterest || 0;
          const currentAssets = latest.currentAssets || 0;
          const currentLiabilities = latest.currentLiabilities || 0;
          const totalDebt = latest.totalDebt || 0;

          if (totalRevenue > 0) {
            if (!keyMetrics.grossMargin && grossProfit) keyMetrics.grossMargin = (grossProfit / totalRevenue) * 100;
            if (!keyMetrics.operatingMargin && operatingIncome) keyMetrics.operatingMargin = (operatingIncome / totalRevenue) * 100;
            if (!keyMetrics.netMargin && netIncome) keyMetrics.netMargin = (netIncome / totalRevenue) * 100;
          }
          if (!keyMetrics.debtToEquity && totalDebt && stockholdersEquity > 0) {
            keyMetrics.debtToEquity = totalDebt / stockholdersEquity;
          }
          if (!keyMetrics.currentRatio && currentAssets && currentLiabilities > 0) {
            keyMetrics.currentRatio = currentAssets / currentLiabilities;
          }
          if (!keyMetrics.roe && netIncome && stockholdersEquity > 0) {
            keyMetrics.roe = (netIncome / stockholdersEquity) * 100;
          }
          if (!keyMetrics.roa && netIncome && totalAssets > 0) {
            keyMetrics.roa = (netIncome / totalAssets) * 100;
          }

          // Also fill income statements from fundamentalsTimeSeries if current ones are empty
          if (incomeStatements.length === 0 || (incomeStatements.length > 0 && !incomeStatements[0].revenue)) {
            incomeStatements = tsData.slice(0, 4).map((item: any) => ({
              date: item.date || '',
              symbol,
              revenue: item.totalRevenue || item.operatingRevenue || 0,
              costOfRevenue: item.costOfRevenue || 0,
              grossProfit: item.grossProfit || 0,
              operatingIncome: item.operatingIncome || item.EBIT || 0,
              netIncome: item.netIncome || item.netIncomeCommonStockholders || 0,
              eps: item.dilutedEPS || item.basicEPS || 0,
              ebitda: item.EBITDA || 0,
              period: 'annual',
            }));
          }

          // Also fill balance sheets from fundamentalsTimeSeries if current ones are empty
          if (balanceSheets.length === 0 || (balanceSheets.length > 0 && !balanceSheets[0].totalAssets)) {
            balanceSheets = tsData.slice(0, 4).map((item: any) => ({
              date: item.date || '',
              symbol,
              totalAssets: item.totalAssets || 0,
              totalLiabilities: item.totalLiabilitiesNetMinorityInterest || 0,
              totalStockholdersEquity: item.stockholdersEquity || item.commonStockEquity || 0,
              cashAndCashEquivalents: item.cashAndCashEquivalents || 0,
              totalDebt: item.totalDebt || 0,
              currentAssets: item.currentAssets || 0,
              currentLiabilities: item.currentLiabilities || 0,
              longTermDebt: item.longTermDebt || 0,
              retainedEarnings: item.retainedEarnings || 0,
              period: 'annual',
            }));
          }

          // Also fill cash flow statements from fundamentalsTimeSeries
          if (cashFlowStatements.length === 0 || (cashFlowStatements.length > 0 && !cashFlowStatements[0].operatingCashFlow)) {
            cashFlowStatements = tsData.slice(0, 4).map((item: any) => ({
              date: item.date || '',
              symbol,
              operatingCashFlow: item.operatingCashFlow || item.cashFlowFromContinuingOperatingActivities || 0,
              capitalExpenditure: item.capitalExpenditure || 0,
              freeCashFlow: item.freeCashFlow || 0,
              netIncome: item.netIncome || 0,
              depreciationAndAmortization: item.depreciationAndAmortization || 0,
              period: 'annual',
            }));
          }

          // Revenue and earnings growth
          if (!keyMetrics.revenueGrowth && tsData.length >= 2) {
            const c = tsData[0] as any;
            const p = tsData[1] as any;
            const curr = c.totalRevenue || c.operatingRevenue || 0;
            const prev = p.totalRevenue || p.operatingRevenue || 0;
            if (curr && prev && prev > 0) keyMetrics.revenueGrowth = ((curr - prev) / prev) * 100;
          }
          if (!keyMetrics.earningsGrowth && tsData.length >= 2) {
            const c = tsData[0] as any;
            const p = tsData[1] as any;
            const curr = c.netIncome || 0;
            const prev = p.netIncome || 0;
            if (curr && prev && prev > 0) keyMetrics.earningsGrowth = ((curr - prev) / prev) * 100;
          }

          console.log(`[FinancialAPIs] fundamentalsTimeSeries for ${symbol}: grossMargin=${keyMetrics.grossMargin?.toFixed(1)}, netMargin=${keyMetrics.netMargin?.toFixed(1)}, debtToEquity=${keyMetrics.debtToEquity?.toFixed(2)}, incomeRows=${incomeStatements.length}`);
        }
      } catch (tsErr: any) {
        console.warn(`[FinancialAPIs] fundamentalsTimeSeries error for ${symbol}:`, tsErr?.message?.slice(0, 80));
      }
    }

    // ── Very last fallback: try raw Yahoo Finance API with crumb ──
    if (keyMetrics && !keyMetrics.grossMargin && !keyMetrics.netMargin) {
      try {
        const crumbUrl = 'https://query1.finance.yahoo.com/v1/test/getcrumb';
        const crumbRes = await fetch(crumbUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        if (crumbRes.ok) {
          const crumb = await crumbRes.text();
          const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=financialData&crumb=${encodeURIComponent(crumb)}`;
          const summaryRes = await fetch(summaryUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          });
          if (summaryRes.ok) {
            const summaryJson = await summaryRes.json();
            const fd = summaryJson?.quoteSummary?.result?.[0]?.financialData;
            console.log(`[FinancialAPIs] Raw Yahoo API financialData for ${symbol}: available=${!!fd}`);
            if (fd) {
              const getVal = (v: any) => typeof v === 'object' ? v : v;
              if (getVal(fd.grossMargins) && !keyMetrics.grossMargin) keyMetrics.grossMargin = getVal(fd.grossMargins) * 100;
              if (getVal(fd.operatingMargins) && !keyMetrics.operatingMargin) keyMetrics.operatingMargin = getVal(fd.operatingMargins) * 100;
              if (getVal(fd.profitMargins) && !keyMetrics.netMargin) keyMetrics.netMargin = getVal(fd.profitMargins) * 100;
              if (getVal(fd.returnOnEquity) && !keyMetrics.roe) keyMetrics.roe = getVal(fd.returnOnEquity) * 100;
              if (getVal(fd.returnOnAssets) && !keyMetrics.roa) keyMetrics.roa = getVal(fd.returnOnAssets) * 100;
              if (getVal(fd.debtToEquity) && !keyMetrics.debtToEquity) keyMetrics.debtToEquity = getVal(fd.debtToEquity);
              if (getVal(fd.currentRatio) && !keyMetrics.currentRatio) keyMetrics.currentRatio = getVal(fd.currentRatio);
            }
          }
        }
      } catch (rawErr: any) {
        console.warn(`[FinancialAPIs] Raw Yahoo API fallback error for ${symbol}:`, rawErr?.message?.slice(0, 80));
      }
    }

    console.log(`[FinancialAPIs] Yahoo Finance comprehensive data fetched: ${symbol} (profile=${!!profile}, income=${incomeStatements.length}, balance=${balanceSheets.length}, cashflow=${cashFlowStatements.length})`);

    return {
      quote,
      profile,
      incomeStatements,
      balanceSheets,
      cashFlowStatements,
      recommendations,
      keyMetrics,
      rating,
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn(`[FinancialAPIs] Yahoo Finance comprehensive data error for ${symbol}:`, msg.slice(0, 100));
    return {
      quote: null,
      profile: null,
      incomeStatements: [],
      balanceSheets: [],
      cashFlowStatements: [],
      recommendations: [],
      keyMetrics: null,
      rating: null,
    };
  }
}

// ─── SEC EDGAR API (100% FREE — no API key needed!) ─────────
// SEC EDGAR provides all financial data from 10-K/10-Q filings.
// Base URL: https://data.sec.gov/
// Must include User-Agent header or requests will be rejected.
// Rate limit: 10 requests/second (be respectful!)
// Uses XBRL US-GAAP taxonomy keys for financial data.

const SEC_EDGAR_USER_AGENT = 'RouaaTradingNews/1.0 contact@rouaa.com';
const CACHE_TTL_SEC_EDGAR = 4 * 60 * 60 * 1000; // 4 hours (filings change infrequently)

export interface SECEdgarFinancials {
  revenue: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  stockholdersEquity: number;
  /** The fiscal period end date (e.g. "2023-12-31") */
  fiscalPeriod: string;
  /** CIK number for the company */
  cik: string;
  /** Ticker symbol */
  symbol: string;
}

export interface SECEdgarData {
  symbol: string;
  cik: string;
  /** Company name from SEC */
  entityName: string;
  /** Most recent annual financials from 10-K */
  annual: SECEdgarFinancials | null;
  /** Most recent quarterly financials from 10-Q */
  quarterly: SECEdgarFinancials | null;
}

// Cache for the company_tickers.json mapping (refreshed every 24h)
let tickerToCIKMap: Map<string, string> | null = null;
let tickerToCIKMapExpiry = 0;
const TICKER_MAP_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get CIK number for a ticker symbol.
 * Uses SEC's company_tickers.json endpoint to look up CIK by ticker.
 * The mapping is cached for 24 hours.
 */
export async function fetchSECEdgarCIK(symbol: string): Promise<string | null> {
  const upperSymbol = symbol.toUpperCase();

  // Check if we already have the mapping cached
  if (tickerToCIKMap && Date.now() < tickerToCIKMapExpiry) {
    return tickerToCIKMap.get(upperSymbol) || null;
  }

  const cacheKey = `sec_ticker_map`;
  const cached = getCached<Map<string, string>>(cacheKey);
  if (cached) {
    tickerToCIKMap = cached;
    tickerToCIKMapExpiry = Date.now() + TICKER_MAP_TTL;
    return cached.get(upperSymbol) || null;
  }

  try {
    const url = 'https://www.sec.gov/files/company_tickers.json';
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 0 },
      headers: {
        'User-Agent': SEC_EDGAR_USER_AGENT,
        'Accept': 'application/json',
      },
    });
    if (!res.ok) {
      console.warn(`[FinancialAPIs] SEC EDGAR ticker map fetch failed: ${res.status}`);
      return null;
    }

    const json = await res.json();
    // The response is an object like { "0": { "cik_str": "320193", "ticker": "AAPL", "title": "Apple Inc." }, ... }
    const mapping = new Map<string, string>();
    for (const entry of Object.values(json) as Array<{ cik_str: string; ticker: string; title: string }>) {
      if (entry.ticker && entry.cik_str) {
        mapping.set(entry.ticker.toUpperCase(), entry.cik_str.padStart(10, '0'));
      }
    }

    tickerToCIKMap = mapping;
    tickerToCIKMapExpiry = Date.now() + TICKER_MAP_TTL;
    setCache(cacheKey, mapping, TICKER_MAP_TTL);
    console.log(`[FinancialAPIs] SEC EDGAR ticker map loaded: ${mapping.size} tickers`);

    return mapping.get(upperSymbol) || null;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] SEC EDGAR CIK lookup error for ${symbol}:`, err.message?.slice(0, 100));
    return null;
  }
}

/**
 * Helper to extract the most recent value for a given XBRL fact key
 * from the SEC EDGAR companyfacts response.
 */
function extractLatestFactValue(
  facts: any,
  taxonomy: string,
  factKey: string,
  preferAnnual: boolean = true
): { value: number; period: string; form: string } | null {
  try {
    const usGaap = facts?.[taxonomy];
    if (!usGaap) return null;

    const fact = usGaap[factKey];
    if (!fact || !fact.units) return null;

    // Get the first unit key (usually USD or shares)
    const unitKeys = Object.keys(fact.units);
    if (unitKeys.length === 0) return null;

    const unitKey = unitKeys[0];
    const entries = fact.units[unitKey];
    if (!Array.isArray(entries) || entries.length === 0) return null;

    // Sort by filed date (most recent filing first), then by end date (most recent period)
    const sorted = [...entries].sort((a, b) => {
      // Prefer 10-K over 10-Q if preferAnnual
      if (preferAnnual) {
        const aIsAnnual = a.form === '10-K' ? 1 : 0;
        const bIsAnnual = b.form === '10-K' ? 1 : 0;
        if (aIsAnnual !== bIsAnnual) return bIsAnnual - aIsAnnual;
      }
      // Then sort by end date descending
      return (b.end || '').localeCompare(a.end || '');
    });

    // Pick the first non-zero entry
    for (const entry of sorted) {
      const val = Number(entry.val);
      if (val !== 0 && !isNaN(val)) {
        return {
          value: val,
          period: entry.end || '',
          form: entry.form || '',
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch SEC EDGAR company facts (financial data from 10-K/10-Q filings).
 * This is 100% free and provides the most authoritative financial data
 * directly from SEC filings. No API key needed.
 *
 * Returns structured data including Revenue, Net Income, Total Assets,
 * Total Liabilities, and Stockholders Equity from the most recent filings.
 */
export async function fetchSECEdgarCompanyFacts(symbol: string): Promise<SECEdgarData | null> {
  const cacheKey = `sec_edgar_facts_${symbol.toUpperCase()}`;
  const cached = getCached<SECEdgarData>(cacheKey);
  if (cached) return cached;

  try {
    // Step 1: Get CIK for the ticker
    const cik = await fetchSECEdgarCIK(symbol);
    if (!cik) {
      // Not a US SEC-filing company (could be international, crypto, etc.)
      return null;
    }

    // Step 2: Fetch company facts from SEC EDGAR
    const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 0 },
      headers: {
        'User-Agent': SEC_EDGAR_USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status !== 404) {
        console.warn(`[FinancialAPIs] SEC EDGAR company facts fetch failed for ${symbol}: ${res.status}`);
      }
      return null;
    }

    const json = await res.json();
    const entityName = json.entityName || symbol;
    const facts = json.facts;

    if (!facts) return null;

    // Step 3: Extract key financial data using US-GAAP taxonomy
    // Annual (10-K) data
    const annualRevenue = extractLatestFactValue(facts, 'us-gaap', 'Revenues', true);
    const annualNetIncome = extractLatestFactValue(facts, 'us-gaap', 'NetIncomeLoss', true);
    const annualTotalAssets = extractLatestFactValue(facts, 'us-gaap', 'Assets', true);
    const annualTotalLiabilities = extractLatestFactValue(facts, 'us-gaap', 'Liabilities', true);
    const annualEquity = extractLatestFactValue(facts, 'us-gaap', 'StockholdersEquity', true);

    // Quarterly (10-Q) data
    const qtrRevenue = extractLatestFactValue(facts, 'us-gaap', 'Revenues', false);
    const qtrNetIncome = extractLatestFactValue(facts, 'us-gaap', 'NetIncomeLoss', false);
    const qtrTotalAssets = extractLatestFactValue(facts, 'us-gaap', 'Assets', false);
    const qtrTotalLiabilities = extractLatestFactValue(facts, 'us-gaap', 'Liabilities', false);
    const qtrEquity = extractLatestFactValue(facts, 'us-gaap', 'StockholdersEquity', false);

    const result: SECEdgarData = {
      symbol: symbol.toUpperCase(),
      cik,
      entityName,
      annual: annualRevenue ? {
        revenue: annualRevenue.value,
        netIncome: annualNetIncome?.value || 0,
        totalAssets: annualTotalAssets?.value || 0,
        totalLiabilities: annualTotalLiabilities?.value || 0,
        stockholdersEquity: annualEquity?.value || 0,
        fiscalPeriod: annualRevenue.period,
        cik,
        symbol: symbol.toUpperCase(),
      } : null,
      quarterly: qtrRevenue ? {
        revenue: qtrRevenue.value,
        netIncome: qtrNetIncome?.value || 0,
        totalAssets: qtrTotalAssets?.value || 0,
        totalLiabilities: qtrTotalLiabilities?.value || 0,
        stockholdersEquity: qtrEquity?.value || 0,
        fiscalPeriod: qtrRevenue.period,
        cik,
        symbol: symbol.toUpperCase(),
      } : null,
    };

    setCache(cacheKey, result, CACHE_TTL_SEC_EDGAR);
    console.log(`[FinancialAPIs] SEC EDGAR company facts fetched: ${symbol} (CIK=${cik}, annual=${!!result.annual}, quarterly=${!!result.quarterly})`);

    return result;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] SEC EDGAR company facts error for ${symbol}:`, err.message?.slice(0, 100));
    return null;
  }
}

// ─── FRED API (Free — requires free API key) ────────────────
// Federal Reserve Economic Data from the St. Louis Fed.
// Base URL: https://api.stlouisfed.org/
// API key from env: FRED_API_KEY (optional — gracefully handles missing key)
// Provides macro economic indicators: GDP, CPI, Unemployment, Treasury rates, etc.

const CACHE_TTL_FRED = 60 * 60 * 1000; // 1 hour

export interface FREDIndicator {
  seriesId: string;
  title: string;
  value: number;
  date: string; // observation date (YYYY-MM-DD)
  units: string;
  /** Percent change from previous value */
  change?: number;
  changePercent?: number;
}

export interface FREDData {
  /** 10-Year Treasury Rate */
  treasury10Y: FREDIndicator | null;
  /** GDP (Gross Domestic Product) */
  gdp: FREDIndicator | null;
  /** Consumer Price Index (CPI) */
  cpi: FREDIndicator | null;
  /** Unemployment Rate */
  unemployment: FREDIndicator | null;
  /** Federal Funds Rate */
  fedFundsRate: FREDIndicator | null;
  /** 10Y-2Y Treasury Spread (recession indicator — negative = inverted yield curve) */
  treasurySpread10Y2Y: FREDIndicator | null;
  /** Whether the FRED API key is configured */
  apiKeyConfigured: boolean;
}

function getFREDApiKey(): string | null {
  const key = process.env.FRED_API_KEY;
  return key && key.trim() !== '' ? key : null;
}

/**
 * Fetch a single FRED series observation (latest value).
 */
async function fetchFREDSeries(seriesId: string, apiKey: string): Promise<FREDIndicator | null> {
  const cacheKey = `fred_series_${seriesId}`;
  const cached = getCached<FREDIndicator>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch the latest 2 observations so we can calculate change
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (!json.observations || !Array.isArray(json.observations) || json.observations.length === 0) {
      return null;
    }

    // Get the most recent non-empty observation
    let latest = null;
    for (const obs of json.observations) {
      if (obs.value !== '.' && obs.value !== '') {
        latest = obs;
        break;
      }
    }
    if (!latest) return null;

    const value = parseFloat(latest.value);
    if (isNaN(value)) return null;

    // Calculate change from previous observation
    let change: number | undefined;
    let changePercent: number | undefined;
    if (json.observations.length > 1) {
      for (const obs of json.observations) {
        if (obs !== latest && obs.value !== '.' && obs.value !== '') {
          const prevValue = parseFloat(obs.value);
          if (!isNaN(prevValue) && prevValue !== 0) {
            change = value - prevValue;
            changePercent = ((value - prevValue) / Math.abs(prevValue)) * 100;
          }
          break;
        }
      }
    }

    // Fetch series info for title and units
    let title = seriesId;
    let units = '';
    try {
      const infoUrl = `https://api.stlouisfed.org/fred/series?series_id=${seriesId}&api_key=${apiKey}&file_type=json`;
      const infoRes = await fetch(infoUrl, {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 0 },
      });
      if (infoRes.ok) {
        const infoJson = await infoRes.json();
        if (infoJson.seriess?.[0]) {
          title = infoJson.seriess[0].title || seriesId;
          units = infoJson.seriess[0].units || '';
        }
      }
    } catch {
      // Non-critical: just use series ID as title
    }

    const indicator: FREDIndicator = {
      seriesId,
      title,
      value,
      date: latest.date || '',
      units,
      change,
      changePercent,
    };

    setCache(cacheKey, indicator, CACHE_TTL_FRED);
    return indicator;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] FRED series fetch error for ${seriesId}:`, err.message?.slice(0, 80));
    return null;
  }
}

/**
 * Fetch macro economic indicators from FRED (Federal Reserve Economic Data).
 * Returns the latest values for key economic indicators:
 * - 10-Year Treasury Rate (DGS10)
 * - GDP (GDP)
 * - Consumer Price Index (CPIAUCSL)
 * - Unemployment Rate (UNRATE)
 * - Federal Funds Rate (FEDFUNDS)
 * - 10Y-2Y Treasury Spread (T10Y2Y — recession indicator)
 *
 * Requires FRED_API_KEY env var. Returns null if key is not configured.
 */
export async function fetchFREDIndicators(): Promise<FREDData | null> {
  const apiKey = getFREDApiKey();
  if (!apiKey) return null;

  const cacheKey = `fred_indicators_all`;
  const cached = getCached<FREDData>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch all indicators in parallel
    const [
      treasury10Y,
      gdp,
      cpi,
      unemployment,
      fedFundsRate,
      treasurySpread10Y2Y,
    ] = await Promise.allSettled([
      fetchFREDSeries('DGS10', apiKey),
      fetchFREDSeries('GDP', apiKey),
      fetchFREDSeries('CPIAUCSL', apiKey),
      fetchFREDSeries('UNRATE', apiKey),
      fetchFREDSeries('FEDFUNDS', apiKey),
      fetchFREDSeries('T10Y2Y', apiKey),
    ]);

    const result: FREDData = {
      treasury10Y: treasury10Y.status === 'fulfilled' ? treasury10Y.value : null,
      gdp: gdp.status === 'fulfilled' ? gdp.value : null,
      cpi: cpi.status === 'fulfilled' ? cpi.value : null,
      unemployment: unemployment.status === 'fulfilled' ? unemployment.value : null,
      fedFundsRate: fedFundsRate.status === 'fulfilled' ? fedFundsRate.value : null,
      treasurySpread10Y2Y: treasurySpread10Y2Y.status === 'fulfilled' ? treasurySpread10Y2Y.value : null,
      apiKeyConfigured: true,
    };

    setCache(cacheKey, result, CACHE_TTL_FRED);
    console.log(`[FinancialAPIs] FRED indicators fetched: 10Y=${result.treasury10Y?.value ?? 'N/A'}, GDP=${result.gdp?.value ?? 'N/A'}, CPI=${result.cpi?.value ?? 'N/A'}, Unemp=${result.unemployment?.value ?? 'N/A'}`);

    return result;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] FRED indicators error:`, err.message?.slice(0, 100));
    return null;
  }
}

// ─── Public API Functions ───────────────────────────────────

/**
 * Get real-time quote for a symbol.
 * Races all providers in parallel: Yahoo Finance (free), FMP, Alpha Vantage, Finnhub, CoinGecko.
 * First valid result wins. Returns null if all providers fail.
 */
// ─── FMP Real-Time Quote ─────────────────────────────────────
// Fetches real-time quote from Financial Modeling Prep.
// FMP has generous rate limits and reliable stock data.
// Endpoint: GET /api/v3/quote/{symbol}?apikey={key}

async function fetchFMPQuote(symbol: string): Promise<QuoteData | null> {
  const apiKey = getFMPKey();
  if (!apiKey) return null;

  const cacheKey = `fmp_quote_${symbol}`;
  const cached = getCached<QuoteData>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(symbol)}?apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const d = json[0];
    const price = Number(d.price) || 0;
    if (price <= 0) return null;

    const quote: QuoteData = {
      symbol: d.symbol || symbol,
      price,
      change: Number(d.change) || 0,
      changePercent: Number(d.changesPercentage) || 0,
      high: Number(d.dayHigh) || 0,
      low: Number(d.dayLow) || 0,
      open: Number(d.open) || 0,
      volume: Number(d.volume) || 0,
      previousClose: Number(d.previousClose) || 0,
      timestamp: new Date(d.timestamp * 1000 || Date.now()).getTime(),
    };

    setCache(cacheKey, quote, CACHE_TTL_QUOTES);
    console.log(`[FinancialAPIs] FMP quote fetched: ${symbol} = ${quote.price}`);
    return quote;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] FMP quote error for ${symbol}:`, err.message?.slice(0, 100));
    return null;
  }
}

export async function getQuote(symbol: string): Promise<QuoteData | null> {
  // PERF: Race all available providers in parallel with Promise.any()
  // All fire at once, first success wins = ~8s worst case (single timeout)
  const parsed = parseSymbolForAV(symbol);

  const providers: Promise<QuoteData | null>[] = [];

  // 0. Yahoo Finance (FREE — no API key needed, unlimited requests!)
  //    Best for stocks with full fundamental data (P/E, EPS, market cap)
  providers.push(fetchYahooQuoteAsQuoteData(symbol));

  // 1. FMP real-time quote (good rate limits, reliable for stocks)
  providers.push(fetchFMPQuote(symbol));

  // 2. Alpha Vantage GLOBAL_QUOTE (works for stocks and some forex)
  providers.push(fetchAlphaVantageQuote(symbol));

  // 3. Alpha Vantage CURRENCY_EXCHANGE_RATE (works for crypto, forex, commodities)
  if (parsed.from && parsed.to) {
    providers.push(fetchAlphaVantageCurrencyRate(parsed.from, parsed.to));
  }

  // 4. Finnhub (understands BINANCE: and OANDA: prefixes)
  providers.push(fetchFinnhubQuote(symbol));

  // 5. CoinGecko (FREE, no API key needed, crypto only)
  if (parsed.type === 'crypto') {
    providers.push(fetchCoinGeckoQuote(symbol));
  }

  // Race all providers — first valid result wins
  const validProviders = providers.map(p =>
    p.then(q => (q && q.price > 0) ? q : Promise.reject(new Error('No data')))
  );

  try {
    return await Promise.any(validProviders);
  } catch {
    // All providers failed
    console.warn(`[FinancialAPIs] All quote providers failed for ${symbol}`);
    return null;
  }
}

// ─── FMP Historical Price Data ───────────────────────────────
// Fetches daily OHLCV historical data from Financial Modeling Prep.
// This is the PRIMARY provider for stock historical data since FMP
// has generous rate limits and reliable data coverage.
// Endpoint: GET /api/v3/historical-price-full/{symbol}?apikey={key}

async function fetchFMPHistory(symbol: string, days: number = 90): Promise<HistoricalPoint[]> {
  const apiKey = getFMPKey();
  if (!apiKey) return [];

  const cacheKey = `fmp_history_${symbol}_${days}`;
  const cached = getCached<HistoricalPoint[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${encodeURIComponent(symbol)}?timeseries=${days}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    // FMP returns: { "symbol": "AAPL", "historical": [ {date, open, high, low, close, volume, ...}, ... ] }
    const historical = json.historical;
    if (!Array.isArray(historical) || historical.length === 0) return [];

    const points: HistoricalPoint[] = [];
    for (const d of historical) {
      const close = Number(d.close) || 0;
      if (close <= 0) continue;
      points.push({
        date: d.date || '',
        open: Number(d.open) || close,
        high: Number(d.high) || close,
        low: Number(d.low) || close,
        close,
        volume: Number(d.volume) || 0,
      });
    }

    // FMP returns newest first, but we need oldest first for technical analysis
    points.reverse();

    setCache(cacheKey, points, CACHE_TTL_FMP_HISTORY);
    console.log(`[FinancialAPIs] FMP history fetched: ${symbol} = ${points.length} days`);
    return points;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] FMP history error for ${symbol}:`, err.message?.slice(0, 100));
    return [];
  }
}

/**
 * Get historical data for a symbol (daily, last N days).
 * Smart provider racing: tries FMP (primary, best rate limits),
 * Alpha Vantage, Finnhub, and CoinGecko in parallel.
 * First valid result wins. Returns empty array if all providers fail.
 */
export async function getHistoricalData(symbol: string, days: number = 90): Promise<HistoricalPoint[]> {
  // PERF: Race all available providers in parallel with Promise.any()
  // All fire at once, first success wins = ~8s worst case (single timeout)
  const parsed = parseSymbolForAV(symbol);
  const providers: Promise<HistoricalPoint[]>[] = [];

  // 0. Yahoo Finance (FREE — no API key needed, full OHLCV data!)
  providers.push(fetchYahooHistoryAsHistoricalPoints(symbol, days));

  // 1. FMP historical-price-full (good rate limits, reliable for stocks)
  providers.push(fetchFMPHistory(symbol, days));

  // 2. Alpha Vantage TIME_SERIES_DAILY (works for stocks and some forex)
  providers.push(fetchAlphaVantageHistory(symbol, days));

  // 3. Alpha Vantage DIGITAL_CURRENCY_DAILY (works for crypto)
  if ((parsed.type === 'crypto' || parsed.type === 'commodity') && parsed.from) {
    providers.push(fetchAlphaVantageCryptoHistory(parsed.from, parsed.to || 'USD', days));
  }

  // 4. Finnhub candles (understands BINANCE: and OANDA: prefixes)
  providers.push(fetchFinnhubCandles(symbol, 'D', days));

  // 5. CoinGecko (FREE, no API key needed, crypto only)
  if (parsed.type === 'crypto') {
    providers.push(fetchCoinGeckoHistory(symbol, days));
  }

  // Race all providers — first valid result wins
  const validProviders = providers.map(p =>
    p.then(data => (data && data.length > 0) ? data : Promise.reject(new Error('No data')))
  );

  try {
    return await Promise.any(validProviders);
  } catch {
    // All providers failed
    console.warn(`[FinancialAPIs] All history providers failed for ${symbol}`);
    return [];
  }
}

/**
 * Get intraday candle data from Finnhub.
 * Useful for sparklines and short-term charts.
 * Resolution: '1' (1min), '5' (5min), '15' (15min), '30' (30min), '60' (1hour), 'D' (day)
 */
export async function getFinnhubCandleData(
  symbol: string,
  resolution: string = '60',
  days: number = 7
): Promise<HistoricalPoint[]> {
  return fetchFinnhubCandles(symbol, resolution, days);
}

/**
 * Get exchange rate between two currencies.
 * Uses ExchangeRate-API. Returns null if no API key is configured.
 */
export async function getExchangeRate(from: string, to: string): Promise<number | null> {
  return fetchExchangeRate(from, to);
}

/**
 * Get market overview (batch quotes for major indices, commodities, currencies, crypto, bond yields).
 * Uses Finnhub for batch efficiency, falls back to Alpha Vantage one-by-one.
 */
export async function getMarketOverview(): Promise<MarketOverview> {
  const overview: MarketOverview = {
    indices: {},
    commodities: {},
    currencies: {},
    crypto: {},
    bondYields: {},
  };

  // Define symbols for each category
  const symbolMap: Record<string, { symbols: string[]; category: keyof MarketOverview }> = {
    indices: {
      symbols: ['SPX', 'NDX', 'DJI', 'FTSE', 'NKY'],
      category: 'indices',
    },
    commodities: {
      symbols: ['XAU', 'WTI', 'XAG'],
      category: 'commodities',
    },
    currencies: {
      symbols: ['EURUSD', 'GBPUSD', 'USDJPY'],
      category: 'currencies',
    },
    crypto: {
      symbols: ['BTC', 'ETH'],
      category: 'crypto',
    },
    bondYields: {
      symbols: ['US10Y'],
      category: 'bondYields',
    },
  };

  // Finnhub symbol mappings (Finnhub uses different symbol conventions)
  const finnhubSymbolMap: Record<string, string> = {
    'SPX': 'SPX',
    'NDX': 'NDX',
    'DJI': 'DJI',
    'FTSE': 'FTSE100',
    'NKY': 'NI225',
    'XAU': 'OANDA:XAU_USD',
    'WTI': 'OANDA:WTI_USD',
    'XAG': 'OANDA:XAG_USD',
    'EURUSD': 'OANDA:EUR_USD',
    'GBPUSD': 'OANDA:GBP_USD',
    'USDJPY': 'OANDA:USD_JPY',
    'BTC': 'BINANCE:BTCUSDT',
    'ETH': 'BINANCE:ETHUSDT',
    'US10Y': 'US10Y',
  };

  // Fetch quotes for all symbols
  for (const [, group] of Object.entries(symbolMap)) {
    for (const sym of group.symbols) {
      try {
        // Try with Finnhub-specific symbol first
        const fhSymbol = finnhubSymbolMap[sym] || sym;
        let quote = await fetchFinnhubQuote(fhSymbol);
        if (!quote) {
          // Fallback to Alpha Vantage
          quote = await fetchAlphaVantageQuote(sym);
        }
        if (quote) {
          quote.symbol = sym; // Normalize symbol back
          overview[group.category][sym] = quote;
        }
      } catch {
        // Continue with other symbols
      }
    }
  }

  return overview;
}

/**
 * Batch update all indicators with real data.
 * Maps our indicator symbols to API symbols, fetches real quotes,
 * and returns updates ready to be written to the database.
 * If no API keys are configured, returns empty array (caller should fallback to simulation).
 */
export async function fetchRealMarketData(): Promise<IndicatorUpdate[]> {
  const hasAnyKey = getAlphaVantageKey() || getFinnhubKey();
  if (!hasAnyKey) {
    console.log('[FinancialAPIs] No API keys configured — skipping real data fetch');
    return [];
  }

  // Finnhub symbol mappings for more specific lookups
  const finnhubSymbolMap: Record<string, string> = {
    'SPX': 'SPX',
    'NDX': 'NDX',
    'DJI': 'DJI',
    'FTSE': 'FTSE100',
    'NKY': 'NI225',
    'XAU': 'OANDA:XAU_USD',
    'WTI': 'OANDA:WTI_USD',
    'XAG': 'OANDA:XAG_USD',
    'EURUSD': 'OANDA:EUR_USD',
    'GBPUSD': 'OANDA:GBP_USD',
    'USDJPY': 'OANDA:USD_JPY',
    'BTC': 'BINANCE:BTCUSDT',
    'ETH': 'BINANCE:ETHUSDT',
    'US10Y': 'US10Y',
  };

  // All indicator symbols we want to update
  const symbols = [
    'SPX', 'NDX', 'DJI', 'FTSE', 'NKY',       // indices
    'XAU', 'WTI', 'XAG',                        // commodities
    'EURUSD', 'GBPUSD', 'USDJPY',               // currencies
    'BTC', 'ETH',                                // crypto
    'US10Y',                                     // bond yields
  ];

  // ── Price Sanity Bounds ──
  // Prevents writing clearly wrong prices to the DB (e.g., ETH=$37,449 instead of ~$1,600).
  const SANITY_BOUNDS: Record<string, { min: number; max: number }> = {
    'BTC': { min: 10_000, max: 200_000 }, 'ETH': { min: 100, max: 15_000 }, 'SOL': { min: 5, max: 1_000 },
    'XAU': { min: 1_000, max: 5_000 }, 'XAG': { min: 10, max: 100 }, 'WTI': { min: 10, max: 200 },
    'SPX': { min: 2_000, max: 10_000 }, 'NDX': { min: 5_000, max: 30_000 }, 'DJI': { min: 20_000, max: 60_000 },
    'FTSE': { min: 4_000, max: 12_000 }, 'NKY': { min: 15_000, max: 60_000 },
    'EURUSD': { min: 0.5, max: 2.0 }, 'GBPUSD': { min: 0.8, max: 2.5 }, 'USDJPY': { min: 50, max: 250 },
    'US10Y': { min: 0.5, max: 10.0 },
  };

  const updates: IndicatorUpdate[] = [];
  let fetchedCount = 0;
  let failedCount = 0;

  for (const sym of symbols) {
    try {
      // Try Finnhub first (faster, better rate limits on free tier)
      const fhSymbol = finnhubSymbolMap[sym] || sym;
      let quote = await fetchFinnhubQuote(fhSymbol);

      // Fallback to Alpha Vantage
      if (!quote) {
        quote = await fetchAlphaVantageQuote(sym);
      }

      if (quote) {
        // ── Price sanity check: reject clearly wrong prices ──
        const bounds = SANITY_BOUNDS[sym];
        if (bounds && (quote.price < bounds.min || quote.price > bounds.max)) {
          console.warn(`[FinancialAPIs] 🚫 Rejected insane ${sym} price: $${quote.price} (bounds: $${bounds.min}–$${bounds.max})`);
          failedCount++;
          continue;
        }
        // Fetch history for this symbol (non-blocking, best-effort)
        let history: { date: string; value: number }[] = [];
        try {
          const histData = await fetchAlphaVantageHistory(sym, 90);
          history = histData.map(p => ({ date: p.date, value: p.close }));
        } catch {
          // History is best-effort
        }

        updates.push({
          symbol: sym,
          value: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          history,
        });
        fetchedCount++;
      } else {
        failedCount++;
      }
    } catch (err: any) {
      console.warn(`[FinancialAPIs] Failed to fetch data for ${sym}:`, err.message?.slice(0, 80));
      failedCount++;
    }
  }

  console.log(`[FinancialAPIs] fetchRealMarketData: ${fetchedCount} succeeded, ${failedCount} failed out of ${symbols.length}`);
  return updates;
}

/**
 * Check if any financial API key is configured.
 * Useful for determining whether to attempt real data fetches.
 */
export function hasApiKeys(): boolean {
  // Yahoo Finance always works (no key needed), so always return true
  return true;
}

/**
 * Get the status of API key configuration.
 * Returns which providers are configured (without exposing the actual keys).
 */
export function getApiStatus(): { alphaVantage: boolean; finnhub: boolean; exchangeRate: boolean; fmp: boolean; yahooFinance: boolean; secEdgar: boolean; fred: boolean } {
  return {
    yahooFinance: true, // Always available — no API key needed!
    secEdgar: true, // Always available — no API key needed! (100% free)
    alphaVantage: !!getAlphaVantageKey(),
    finnhub: !!getFinnhubKey(),
    exchangeRate: !!getExchangeRateApiKey(),
    fmp: !!getFMPKey(),
    fred: !!getFREDApiKey(),
  };
}

// ─── Financial Modeling Prep (FMP) API ──────────────────────
// Provides company profiles, financial statements, key metrics,
// sector performance, stock peers, analyst targets, and screener.
// API key: FMP_API_KEY env var

export interface CompanyProfile {
  symbol: string;
  companyName: string;
  currency: string;
  exchange: string;
  industry: string;
  sector: string;
  country: string;
  marketCap: number;
  price: number;
  beta: number;
  ceo: string;
  description: string;
  image: string;
  website: string;
  dividendYield: number;
  peRatio: number;
  eps: number;
  week52High: number;
  week52Low: number;
  avgVolume: number;
}

export interface IncomeStatement {
  date: string;
  symbol: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
  ebitda: number;
  interestExpense: number;
  incomeTaxExpense: number;
  totalRevenue: number;
  period: string;
}

export interface BalanceSheet {
  date: string;
  symbol: string;
  totalAssets: number;
  totalLiabilities: number;
  totalStockholdersEquity: number;
  cashAndCashEquivalents: number;
  totalDebt: number;
  netDebt: number;
  currentAssets: number;
  currentLiabilities: number;
  longTermDebt: number;
  retainedEarnings: number;
  period: string;
}

export interface CashFlowStatement {
  date: string;
  symbol: string;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  netIncome: number;
  depreciationAndAmortization: number;
  dividendsPaid: number;
  netChangeInCash: number;
  cashAtEndOfPeriod: number;
  cashAtBeginningOfPeriod: number;
  period: string;
}

export interface KeyMetrics {
  symbol: string;
  peRatio: number;
  pbRatio: number;
  evToRevenue: number;
  evToEbitda: number;
  grossProfitMargin: number;
  operatingProfitMargin: number;
  netProfitMargin: number;
  returnOnEquity: number;
  returnOnAssets: number;
  debtToEquity: number;
  currentRatio: number;
  dividendYield: number;
  eps: number;
  revenueGrowth: number;
  earningsGrowth: number;
}

export interface SectorPerformance {
  sector: string;
  changePercent: number;
  changesPercentage: number;
}

export interface PriceTarget {
  symbol: string;
  targetHigh: number;
  targetLow: number;
  targetConsensus: number;
  targetMedian: number;
  analystCount: number;
}

export interface StockScreenerQuery {
  signal?: string;
  sector?: string;
  marketCapMin?: number;
  marketCapMax?: number;
  peMin?: number;
  peMax?: number;
  limit?: number;
}

export interface StockScreenerResult {
  symbol: string;
  companyName: string;
  marketCap: number;
  price: number;
  changePercent: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  sector: string;
  industry: string;
}

function getFMPKey(): string | null {
  const key = process.env.FMP_API_KEY;
  return key && key.trim() !== '' ? key : null;
}

const CACHE_TTL_FMP = 5 * 60 * 1000;               // 5 minutes for real-time quotes
const CACHE_TTL_FMP_HISTORY = 60 * 60 * 1000;      // 1 hour for historical price data
const CACHE_TTL_FMP_PROFILE = 24 * 60 * 60 * 1000; // 24 hours for company profiles
const CACHE_TTL_FMP_METRICS = 6 * 60 * 60 * 1000;  // 6 hours for key metrics & price targets
const CACHE_TTL_FMP_PEERS = 24 * 60 * 60 * 1000;   // 24 hours for stock peers
const CACHE_TTL_FMP_STATEMENTS = 24 * 60 * 60 * 1000; // 24 hours for financial statements

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  const apiKey = getFMPKey();
  if (!apiKey) return null;

  const cacheKey = `fmp_profile_${symbol}`;
  const cached = getCached<CompanyProfile>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://financialmodelingprep.com/api/v3/profile/${encodeURIComponent(symbol)}?apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const d = json[0];
    const profile: CompanyProfile = {
      symbol: d.symbol || symbol,
      companyName: d.companyName || '',
      currency: d.currency || 'USD',
      exchange: d.exchange || '',
      industry: d.industry || '',
      sector: d.sector || '',
      country: d.country || '',
      marketCap: d.mktCap || d.marketCap || 0,
      price: d.price || 0,
      beta: d.beta || 0,
      ceo: d.ceo || '',
      description: d.description || '',
      image: d.image || '',
      website: d.website || '',
      dividendYield: d.lastDiv || 0,
      peRatio: 0,
      eps: 0,
      week52High: 0,
      week52Low: 0,
      avgVolume: d.volAvg || 0,
    };

    setCache(cacheKey, profile, CACHE_TTL_FMP_PROFILE);
    console.log(`[FinancialAPIs] FMP profile fetched: ${symbol}`);
    return profile;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[FinancialAPIs] FMP profile error for ${symbol}:`, msg.slice(0, 100));
    return null;
  }
}

export async function getIncomeStatements(symbol: string, period: 'annual' | 'quarter' = 'annual'): Promise<IncomeStatement[]> {
  const apiKey = getFMPKey();
  if (!apiKey) return [];

  const cacheKey = `fmp_income_${symbol}_${period}`;
  const cached = getCached<IncomeStatement[]>(cacheKey);
  if (cached) return cached;

  try {
    const endpoint = period === 'quarter' ? 'income-statement' : 'income-statement';
    const url = `https://financialmodelingprep.com/api/v3/${endpoint}/${encodeURIComponent(symbol)}?period=${period}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json)) return [];

    const statements: IncomeStatement[] = json.slice(0, 4).map((d: Record<string, unknown>) => ({
      date: d.date || '',
      symbol: d.symbol || symbol,
      revenue: Number(d.revenue) || 0,
      costOfRevenue: Number(d.costOfRevenue) || 0,
      grossProfit: Number(d.grossProfit) || 0,
      operatingIncome: Number(d.operatingIncome) || 0,
      netIncome: Number(d.netIncome) || 0,
      eps: Number(d.eps) || 0,
      ebitda: Number(d.ebitda) || 0,
      interestExpense: Number(d.interestExpense) || 0,
      incomeTaxExpense: Number(d.incomeTaxExpense) || 0,
      totalRevenue: Number(d.revenue) || 0,
      period: d.period || period,
    }));

    setCache(cacheKey, statements, CACHE_TTL_FMP_STATEMENTS);
    console.log(`[FinancialAPIs] FMP income statements fetched: ${symbol} (${period})`);
    return statements;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[FinancialAPIs] FMP income statement error for ${symbol}:`, msg.slice(0, 100));
    return [];
  }
}

export async function getBalanceSheets(symbol: string, period: 'annual' | 'quarter' = 'annual'): Promise<BalanceSheet[]> {
  const apiKey = getFMPKey();
  if (!apiKey) return [];

  const cacheKey = `fmp_balance_${symbol}_${period}`;
  const cached = getCached<BalanceSheet[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${encodeURIComponent(symbol)}?period=${period}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json)) return [];

    const sheets: BalanceSheet[] = json.slice(0, 4).map((d: Record<string, unknown>) => ({
      date: d.date || '',
      symbol: d.symbol || symbol,
      totalAssets: Number(d.totalAssets) || 0,
      totalLiabilities: Number(d.totalLiabilities) || 0,
      totalStockholdersEquity: Number(d.totalStockholdersEquity) || 0,
      cashAndCashEquivalents: Number(d.cashAndCashEquivalents) || Number(d.cashAndShortTermInvestments) || 0,
      totalDebt: Number(d.totalDebt) || 0,
      netDebt: Number(d.netDebt) || 0,
      currentAssets: Number(d.totalCurrentAssets) || 0,
      currentLiabilities: Number(d.totalCurrentLiabilities) || 0,
      longTermDebt: Number(d.longTermDebt) || 0,
      retainedEarnings: Number(d.retainedEarnings) || 0,
      period: d.period || period,
    }));

    setCache(cacheKey, sheets, CACHE_TTL_FMP_STATEMENTS);
    console.log(`[FinancialAPIs] FMP balance sheets fetched: ${symbol} (${period})`);
    return sheets;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[FinancialAPIs] FMP balance sheet error for ${symbol}:`, msg.slice(0, 100));
    return [];
  }
}

export async function getCashFlowStatements(symbol: string, period: 'annual' | 'quarter' = 'annual'): Promise<CashFlowStatement[]> {
  const apiKey = getFMPKey();
  if (!apiKey) return [];

  const cacheKey = `fmp_cashflow_${symbol}_${period}`;
  const cached = getCached<CashFlowStatement[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://financialmodelingprep.com/api/v3/cash-flow-statement/${encodeURIComponent(symbol)}?period=${period}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json)) return [];

    const statements: CashFlowStatement[] = json.slice(0, 4).map((d: Record<string, unknown>) => ({
      date: d.date || '',
      symbol: d.symbol || symbol,
      operatingCashFlow: Number(d.operatingCashFlow) || Number(d.netCashProvidedByOperatingActivities) || 0,
      capitalExpenditure: Number(d.capitalExpenditure) || 0,
      freeCashFlow: Number(d.freeCashFlow) || 0,
      netIncome: Number(d.netIncome) || 0,
      depreciationAndAmortization: Number(d.depreciationAndAmortization) || 0,
      dividendsPaid: Number(d.dividendsPaid) || 0,
      netChangeInCash: Number(d.netChangeInCash) || 0,
      cashAtEndOfPeriod: Number(d.cashAtEndOfPeriod) || 0,
      cashAtBeginningOfPeriod: Number(d.cashAtBeginningOfPeriod) || 0,
      period: d.period || period,
    }));

    setCache(cacheKey, statements, CACHE_TTL_FMP_STATEMENTS);
    console.log(`[FinancialAPIs] FMP cash flow statements fetched: ${symbol} (${period})`);
    return statements;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[FinancialAPIs] FMP cash flow error for ${symbol}:`, msg.slice(0, 100));
    return [];
  }
}

export async function getKeyMetrics(symbol: string): Promise<KeyMetrics | null> {
  const apiKey = getFMPKey();
  if (!apiKey) return null;

  const cacheKey = `fmp_metrics_${symbol}`;
  const cached = getCached<KeyMetrics>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://financialmodelingprep.com/api/v3/key-metrics/${encodeURIComponent(symbol)}?period=annual&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const d = json[0];
    const metrics: KeyMetrics = {
      symbol: d.symbol || symbol,
      peRatio: Number(d.peRatio) || 0,
      pbRatio: Number(d.pbRatio) || 0,
      evToRevenue: Number(d.evToRevenue) || 0,
      evToEbitda: Number(d.evToEbitda) || 0,
      grossProfitMargin: Number(d.grossProfitMargin) || 0,
      operatingProfitMargin: Number(d.operatingProfitMargin) || 0,
      netProfitMargin: Number(d.netProfitMargin) || 0,
      returnOnEquity: Number(d.returnOnEquity) || 0,
      returnOnAssets: Number(d.returnOnAssets) || 0,
      debtToEquity: Number(d.debtToEquity) || 0,
      currentRatio: Number(d.currentRatio) || 0,
      dividendYield: Number(d.dividendYield) || 0,
      eps: Number(d.eps) || 0,
      revenueGrowth: Number(d.revenueGrowth) || 0,
      earningsGrowth: Number(d.earningsGrowth) || 0,
    };

    setCache(cacheKey, metrics, CACHE_TTL_FMP_METRICS);
    console.log(`[FinancialAPIs] FMP key metrics fetched: ${symbol}`);
    return metrics;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[FinancialAPIs] FMP key metrics error for ${symbol}:`, msg.slice(0, 100));
    return null;
  }
}

export async function getSectorPerformance(): Promise<SectorPerformance[]> {
  const apiKey = getFMPKey();
  if (!apiKey) return [];

  const cacheKey = 'fmp_sector_performance';
  const cached = getCached<SectorPerformance[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://financialmodelingprep.com/api/v3/sector-performance?apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json)) return [];

    const sectors: SectorPerformance[] = json.map((d: Record<string, unknown>) => ({
      sector: String(d.sector || ''),
      changePercent: parseFloat(String(d.changesPercentage || '0').replace('%', '')) || 0,
      changesPercentage: parseFloat(String(d.changesPercentage || '0').replace('%', '')) || 0,
    }));

    setCache(cacheKey, sectors, CACHE_TTL_FMP);
    console.log(`[FinancialAPIs] FMP sector performance fetched: ${sectors.length} sectors`);
    return sectors;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[FinancialAPIs] FMP sector performance error:`, msg.slice(0, 100));
    return [];
  }
}

export async function getStockPeers(symbol: string): Promise<string[]> {
  const apiKey = getFMPKey();
  if (!apiKey) return [];

  const cacheKey = `fmp_peers_${symbol}`;
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://financialmodelingprep.com/api/v4/stock_peers?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return [];

    const peers: string[] = json[0]?.peersList || [];
    setCache(cacheKey, peers, CACHE_TTL_FMP_PEERS);
    console.log(`[FinancialAPIs] FMP peers fetched: ${symbol} = ${peers.length} peers`);
    return peers;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[FinancialAPIs] FMP peers error for ${symbol}:`, msg.slice(0, 100));
    return [];
  }
}

export async function getPriceTargetConsensus(symbol: string): Promise<PriceTarget | null> {
  const apiKey = getFMPKey();
  if (!apiKey) return null;

  const cacheKey = `fmp_price_target_${symbol}`;
  const cached = getCached<PriceTarget>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://financialmodelingprep.com/api/v4/price-target-consensus?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const d = json[0];
    const target: PriceTarget = {
      symbol: d.symbol || symbol,
      targetHigh: Number(d.targetHigh) || 0,
      targetLow: Number(d.targetLow) || 0,
      targetConsensus: Number(d.targetConsensus) || 0,
      targetMedian: Number(d.targetMedian) || 0,
      analystCount: Number(d.analystCount) || 0,
    };

    setCache(cacheKey, target, CACHE_TTL_FMP_METRICS);
    console.log(`[FinancialAPIs] FMP price target fetched: ${symbol}`);
    return target;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[FinancialAPIs] FMP price target error for ${symbol}:`, msg.slice(0, 100));
    return null;
  }
}

export async function getStockScreener(query: StockScreenerQuery): Promise<StockScreenerResult[]> {
  const apiKey = getFMPKey();
  if (!apiKey) return [];

  const { limit = 20 } = query;
  const cacheKey = `fmp_screener_${JSON.stringify(query)}`;
  const cached = getCached<StockScreenerResult[]>(cacheKey);
  if (cached) return cached;

  try {
    // Use the stock screener endpoint
    const params = new URLSearchParams({ apikey: apiKey, limit: String(limit), exchange: 'NYSE,NASDAQ' });
    if (query.marketCapMin) params.set('marketCapMoreThan', String(query.marketCapMin));
    if (query.marketCapMax) params.set('marketCapLowerThan', String(query.marketCapMax));
    if (query.peMin) params.set('priceMoreThan', String(query.peMin));
    if (query.peMax) params.set('priceLowerThan', String(query.peMax));

    const url = `https://financialmodelingprep.com/api/v3/stock_screener?${params.toString()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json)) return [];

    const results: StockScreenerResult[] = json.slice(0, limit).map((d: Record<string, unknown>) => ({
      symbol: d.symbol || '',
      companyName: d.companyName || '',
      marketCap: Number(d.marketCap) || 0,
      price: Number(d.price) || 0,
      changePercent: Number(d.changesPercentage) || 0,
      peRatio: Number(d.pe) || 0,
      eps: Number(d.eps) || 0,
      dividendYield: Number(d.lastDiv) || 0,
      sector: d.sector || '',
      industry: d.industry || '',
    }));

    setCache(cacheKey, results, CACHE_TTL_FMP);
    console.log(`[FinancialAPIs] FMP screener fetched: ${results.length} stocks`);
    return results;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[FinancialAPIs] FMP screener error:`, msg.slice(0, 100));
    return [];
  }
}

/**
 * Get FMP API key status.
 */
export function hasFMPKey(): boolean {
  return !!getFMPKey();
}

// ─── Company Fundamentals (alias for pipeline compatibility) ──────
// The stock-analysis-pipeline imports getCompanyFundamentals and CompanyFundamentals.
// These are wrappers around getCompanyProfile that provide the expected interface.

export interface CompanyFundamentals {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  beta: number;
  ceo: string;
  country: string;
  website: string;
  employees: number;
  description: string;
  price: number;
  change: number;
  changePercent: number;
}

/**
 * Get company fundamentals (profile + quote combined).
 * This is an alias used by the stock-analysis-pipeline.
 * Fetches company profile from FMP and enriches with live quote data.
 * Accepts an optional pre-fetched quote to avoid duplicate API calls.
 */
export async function getCompanyFundamentals(symbol: string, existingQuote?: QuoteData | null): Promise<CompanyFundamentals | null> {
  const [profile, quote] = await Promise.all([
    getCompanyProfile(symbol),
    existingQuote !== undefined ? Promise.resolve(existingQuote) : getQuote(symbol),
  ]);

  if (!profile && !quote) return null;

  return {
    symbol,
    name: profile?.companyName || symbol,
    exchange: profile?.exchange || '',
    sector: profile?.sector || '',
    industry: profile?.industry || '',
    marketCap: profile?.marketCap || 0,
    peRatio: profile?.peRatio || 0,
    eps: profile?.eps || 0,
    dividendYield: profile?.dividendYield || 0,
    beta: profile?.beta || 0,
    ceo: profile?.ceo || '',
    country: profile?.country || '',
    website: profile?.website || '',
    employees: 0,
    description: profile?.description || '',
    price: quote?.price || profile?.price || 0,
    change: quote?.change || 0,
    changePercent: quote?.changePercent || 0,
  };
}

// ─── Earnings Data — V300: Fetch quarterly earnings for reports ────────────

export interface EarningsResult {
  symbol: string;
  company: string;
  fiscalDateEnding: string;
  reportedEPS: number;
  estimatedEPS: number;
  surprise: number;        // reported - estimated
  surprisePercent: number; // (reported - estimated) / estimated * 100
  reportedRevenue: number;
  estimatedRevenue: number;
  revenueSurprise: number;
  revenueSurprisePercent: number;
  beatOrMiss: 'beat' | 'miss' | 'meet';
}

export interface EarningsData {
  symbol: string;
  company: string;
  currentQuarter: EarningsResult | null;
  previousQuarters: EarningsResult[];
  earningsHistory: { date: string; eps: number; revenue: number }[];
  guidance?: {
    direction: 'raised' | 'lowered' | 'maintained';
    nextQuarterEPS?: { low: number; high: number; consensus: number };
    fullYearEPS?: { low: number; high: number; consensus: number };
  };
  analystConsensus?: {
    rating: string;
    targetPrice: number;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  };
}

/**
 * Fetch earnings data for a specific stock symbol.
 * Uses Yahoo Finance as primary source (free, no API key).
 * Returns comprehensive earnings information including:
 * - Current quarter actual vs estimated EPS and Revenue
 * - Beat/Miss classification
 * - Previous quarters history
 * - Analyst consensus and price targets
 */
export async function getEarningsData(symbol: string): Promise<EarningsData | null> {
  const cacheKey = `earnings_${symbol}`;
  const cached = getCached<EarningsData>(cacheKey);
  if (cached) return cached;

  try {
    const YahooFinance = (await import('yahoo-finance2')).default;
    const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

    // Fetch quote summary with earnings-related modules
    const [quoteResult, summaryResult] = await Promise.allSettled([
      yf.quote(symbol),
      yf.quoteSummary(symbol, {
        modules: [
          'earningsHistory', 'earningsTrend', 'recommendationTrend',
          'financialData', 'defaultKeyStatistics', 'earnings',
        ],
      }),
    ]);

    // Extract basic info from quote
    let company = symbol;
    let currentPrice = 0;
    if (quoteResult.status === 'fulfilled' && quoteResult.value) {
      const q = quoteResult.value;
      company = q.shortName || q.longName || symbol;
      currentPrice = q.regularMarketPrice || 0;
    }

    const result: EarningsData = {
      symbol,
      company,
      currentQuarter: null,
      previousQuarters: [],
      earningsHistory: [],
    };

    if (summaryResult.status === 'fulfilled' && summaryResult.value) {
      const s = summaryResult.value;

      // Process earnings history
      if (s.earningsHistory?.history) {
        const history = s.earningsHistory.history;
        for (const entry of history) {
          const reportedEPS = entry.actualEarningsValue || 0;
          const estimatedEPS = entry.estimatedEarningsValue || 0;
          const surprise = reportedEPS - estimatedEPS;
          const surprisePercent = estimatedEPS !== 0 ? (surprise / Math.abs(estimatedEPS)) * 100 : 0;
          const beatOrMiss: 'beat' | 'miss' | 'meet' = 
            Math.abs(surprisePercent) < 1 ? 'meet' : (surprise > 0 ? 'beat' : 'miss');

          const earningsResult: EarningsResult = {
            symbol,
            company,
            fiscalDateEnding: entry.quarter?.fmt || entry.quarter?.toString() || '',
            reportedEPS,
            estimatedEPS,
            surprise: Math.round(surprise * 100) / 100,
            surprisePercent: Math.round(surprisePercent * 100) / 100,
            reportedRevenue: 0,
            estimatedRevenue: 0,
            revenueSurprise: 0,
            revenueSurprisePercent: 0,
            beatOrMiss,
          };

          if (!result.currentQuarter) {
            result.currentQuarter = earningsResult;
          } else {
            result.previousQuarters.push(earningsResult);
          }

          result.earningsHistory.push({
            date: earningsResult.fiscalDateEnding,
            eps: reportedEPS,
            revenue: 0,
          });
        }
      }

      // Process earnings trend for guidance
      if (s.earningsTrend?.trend) {
        const trend = s.earningsTrend.trend;
        // Current quarter (0q) and next quarter (1q) guidance
        const currentQ = trend.find((t: any) => t.period === '0q');
        const nextQ = trend.find((t: any) => t.period === '1q');
        const fullYear = trend.find((t: any) => t.period === '0y');

        if (nextQ) {
          const growth = nextQ.growth;
          result.guidance = {
            direction: growth && growth > 0 ? 'raised' : (growth && growth < 0 ? 'lowered' : 'maintained'),
            nextQuarterEPS: nextQ.earningsEstimate
              ? {
                  low: nextQ.earningsEstimate.low || 0,
                  high: nextQ.earningsEstimate.high || 0,
                  consensus: nextQ.earningsEstimate.avg || 0,
                }
              : undefined,
            fullYearEPS: fullYear?.earningsEstimate
              ? {
                  low: fullYear.earningsEstimate.low || 0,
                  high: fullYear.earningsEstimate.high || 0,
                  consensus: fullYear.earningsEstimate.avg || 0,
                }
              : undefined,
          };
        }
      }

      // Process recommendation trend for analyst consensus
      if (s.recommendationTrend?.trend && s.recommendationTrend.trend.length > 0) {
        const latest = s.recommendationTrend.trend[0];
        const total = (latest.strongBuy || 0) + (latest.buy || 0) + (latest.hold || 0) + (latest.sell || 0) + (latest.strongSell || 0);
        const buyWeight = total > 0 ? ((latest.strongBuy || 0) * 2 + (latest.buy || 0)) / total : 0;

        let rating = 'Hold';
        if (buyWeight > 0.7) rating = 'Strong Buy';
        else if (buyWeight > 0.5) rating = 'Buy';
        else if (buyWeight < 0.2) rating = 'Strong Sell';
        else if (buyWeight < 0.35) rating = 'Sell';

        result.analystConsensus = {
          rating,
          targetPrice: s.financialData?.targetMeanPrice || 0,
          strongBuy: latest.strongBuy || 0,
          buy: latest.buy || 0,
          hold: latest.hold || 0,
          sell: latest.sell || 0,
          strongSell: latest.strongSell || 0,
        };
      }

      // Enrich current quarter with revenue data from financialData
      if (s.financialData && result.currentQuarter) {
        // Revenue data comes from the income statement, not earnings history
        // We can use the totalRevenue from financialData as a reference
      }
    }

    // Try to get earnings with revenue from Yahoo Finance earnings endpoint
    try {
      const earningsData = await yf.earnings(symbol);
      if (earningsData?.financialsChart?.yearly) {
        for (const year of earningsData.financialsChart.yearly) {
          const existing = result.earningsHistory.find(h => h.date === year.date?.toString());
          if (existing) {
            existing.revenue = year.revenue || 0;
          }
        }
      }
      // Quarterly earnings with revenue
      if (earningsData?.financialsChart?.quarterly && result.currentQuarter) {
        const latestQ = earningsData.financialsChart.quarterly[0];
        if (latestQ) {
          result.currentQuarter.reportedRevenue = latestQ.revenue || 0;
        }
      }
    } catch (e: any) {
      // Non-critical: earnings endpoint may not be available for all symbols
      console.warn(`[FinancialAPIs] Yahoo earnings chart error for ${symbol}:`, e?.message?.slice(0, 60));
    }

    setCache(cacheKey, result, CACHE_TTL_QUOTES);
    console.log(`[FinancialAPIs] Earnings data fetched: ${symbol}, currentQ=${result.currentQuarter?.beatOrMiss || 'N/A'}`);
    return result;
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn(`[FinancialAPIs] getEarningsData error for ${symbol}:`, msg.slice(0, 100));
    return null;
  }
}

// ─── Earnings Financial Data for Reports (V320) ──────────────
// Fetches comprehensive financial data for earnings analysis reports.
// Combines quote data, company data, and earnings data into a single
// structured object that can be injected into the AI prompt.

export interface EarningsFinancialData {
  symbol: string;
  companyName: string;
  currentPrice: number;
  changePercent: number;
  marketCap: number;
  peRatio: number;
  eps: number;
  forwardPE: number;
  revenueGrowth: number;
  earningsGrowth: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  debtToEquity: number;
  currentRatio: number;
  week52High: number;
  week52Low: number;
  beta: number;
  dividendYield: number;
  analystRating: string;
  targetConsensus: number;
  targetHigh: number;
  targetLow: number;
  // Earnings-specific
  reportedEPS: number | null;
  epsActual: number | null;
  epsSurprise: number | null;
  reportedRevenue: number | null;
  expectedRevenue: number | null;
  revenueSurprise: number | null;
  beatOrMiss: string | null;
  // Income statement
  latestRevenue: number;
  latestNetIncome: number;
  latestGrossProfit: number;
  latestOperatingIncome: number;
  // Data source
  dataSource: string;
}

/**
 * Fetch comprehensive financial data for earnings analysis reports.
 * Uses Yahoo Finance (free) as primary source with multi-provider fallback.
 * Returns a structured object with real financial figures for AI prompt injection.
 */
export async function getEarningsFinancialData(symbol: string): Promise<EarningsFinancialData | null> {
  const cacheKey = `earnings_fin_${symbol}`;
  const cached = getCached<EarningsFinancialData>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch company data (quote + profile + financials) in one call
    const companyData = await getYahooFinanceCompanyData(symbol);
    const earningsData = await getEarningsData(symbol);

    if (!companyData || !companyData.quote) {
      console.warn(`[FinancialAPIs] getEarningsFinancialData: No quote data for ${symbol}`);
      return null;
    }

    const q = companyData.quote;
    const profile = companyData.profile;
    const metrics = companyData.keyMetrics;
    const rating = companyData.rating;
    const income = companyData.incomeStatements?.[0]; // Latest annual

    const result: EarningsFinancialData = {
      symbol: q.symbol || symbol,
      companyName: profile?.name || symbol,
      currentPrice: q.price || 0,
      changePercent: q.changePercent || 0,
      marketCap: metrics?.marketCap || profile?.marketCap || 0,
      peRatio: metrics?.peRatio || profile?.peRatio || 0,
      eps: metrics?.eps || profile?.eps || 0,
      forwardPE: (companyData as any)._forwardPE || 0,
      revenueGrowth: metrics?.revenueGrowth || 0,
      earningsGrowth: metrics?.earningsGrowth || 0,
      grossMargin: metrics?.grossMargin || 0,
      operatingMargin: metrics?.operatingMargin || 0,
      netMargin: metrics?.netMargin || 0,
      debtToEquity: metrics?.debtToEquity || 0,
      currentRatio: metrics?.currentRatio || 0,
      week52High: profile?.week52High || 0,
      week52Low: profile?.week52Low || 0,
      beta: profile?.beta || 0,
      dividendYield: profile?.dividendYield || 0,
      analystRating: rating?.ratingRecommendation || 'N/A',
      targetConsensus: rating?.targetConsensus || 0,
      targetHigh: rating?.targetHigh || 0,
      targetLow: rating?.targetLow || 0,
      // Earnings-specific
      reportedEPS: earningsData?.currentQuarter?.reportedEPS ?? null,
      epsActual: earningsData?.currentQuarter?.epsActual ?? null,
      epsSurprise: earningsData?.currentQuarter?.surprise ?? null,
      reportedRevenue: earningsData?.currentQuarter?.reportedRevenue ?? null,
      expectedRevenue: earningsData?.currentQuarter?.reportedRevenue ?? null,
      revenueSurprise: earningsData?.currentQuarter?.revenueSurprise ?? null,
      beatOrMiss: earningsData?.currentQuarter?.beatOrMiss ?? null,
      // Income statement
      latestRevenue: income?.revenue || 0,
      latestNetIncome: income?.netIncome || 0,
      latestGrossProfit: income?.grossProfit || 0,
      latestOperatingIncome: income?.operatingIncome || 0,
      dataSource: 'YahooFinance',
    };

    setCache(cacheKey, result, CACHE_TTL_QUOTES);
    console.log(`[FinancialAPIs] Earnings financial data: ${symbol} = $${result.currentPrice}, EPS=${result.reportedEPS}, Rev=${result.latestRevenue}`);
    return result;
  } catch (err: any) {
    console.warn(`[FinancialAPIs] getEarningsFinancialData error for ${symbol}:`, err?.message?.slice(0, 100));
    return null;
  }
}

/**
 * Format EarningsFinancialData as an Arabic text block for AI prompt injection.
 * This creates a structured data section that the AI can reference when writing
 * the earnings analysis report, ensuring real financial figures are used.
 */
export function formatEarningsDataForPrompt(data: EarningsFinancialData): string {
  if (!data) return '';

  const formatNumber = (n: number | null, suffix = '') => {
    if (n === null || n === 0) return 'غير متوفر';
    if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)} تريليون${suffix}`;
    if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)} مليار${suffix}`;
    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)} مليون${suffix}`;
    return `${n.toFixed(2)}${suffix}`;
  };

  const formatPercent = (n: number) => {
    if (!n) return 'غير متوفر';
    return `${n.toFixed(2)}%`;
  };

  const beatMissText = data.beatOrMiss === 'beat' ? 'تجاوز التوقعات ✅' :
    data.beatOrMiss === 'miss' ? 'أقل من التوقعات ❌' : 'لم يُعلن بعد';

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
البيانات المالية الحقيقية — ${data.companyName} (${data.symbol})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

السعر الحالي: ${formatNumber(data.currentPrice, ' دولار')}
التغيير: ${formatPercent(data.changePercent)}
القيمة السوقية: ${formatNumber(data.marketCap, ' دولار')}
نسبة السعر للأرباح (P/E): ${data.peRatio ? data.peRatio.toFixed(2) : 'غير متوفر'}
ربحية السهم (EPS): ${data.eps ? data.eps.toFixed(2) + ' دولار' : 'غير متوفر'}

نتائج الأرباح الحالية:
- ربحية السهم المُعلنة: ${data.reportedEPS !== null ? data.reportedEPS.toFixed(2) + ' دولار' : 'لم تُعلن بعد'}
- ربحية السهم المتوقعة: ${data.epsActual || epsActual !== null ? data.epsActual || epsActual.toFixed(2) + ' دولار' : 'غير متوفر'}
- مفاجأة ربحية السهم: ${data.surprise !== null ? (data.surprise > 0 ? '+' : '') + data.surprise.toFixed(2) + ' دولار' : 'غير متوفر'}
- الإيرادات المُعلنة: ${formatNumber(data.reportedRevenue, ' دولار')}
- الإيرادات المتوقعة: ${formatNumber(data.reportedRevenue, ' دولار')}
- النتيجة: ${beatMissText}

القوائم المالية (آخر سنة مالية):
- الإيرادات: ${formatNumber(data.latestRevenue, ' دولار')}
- صافي الدخل: ${formatNumber(data.latestNetIncome, ' دولار')}
- الربح الإجمالي: ${formatNumber(data.latestGrossProfit, ' دولار')}
- الربح التشغيلي: ${formatNumber(data.latestOperatingIncome, ' دولار')}
- هامش الربح الإجمالي: ${formatPercent(data.grossMargin)}
- هامش الربح التشغيلي: ${formatPercent(data.operatingMargin)}
- هامش صافي الربح: ${formatPercent(data.netMargin)}
- نمو الإيرادات: ${formatPercent(data.revenueGrowth)}
- نمو الأرباح: ${formatPercent(data.earningsGrowth)}

المؤشرات المالية:
- نسبة الدين إلى حقوق الملكية: ${data.debtToEquity ? data.debtToEquity.toFixed(2) : 'غير متوفر'}
- نسبة التداول: ${data.currentRatio ? data.currentRatio.toFixed(2) : 'غير متوفر'}
- بيتا: ${data.beta ? data.beta.toFixed(2) : 'غير متوفر'}
- عائد التوزيعات: ${formatPercent(data.dividendYield)}
- أعلى سعر في 52 أسبوع: ${formatNumber(data.week52High, ' دولار')}
- أدنى سعر في 52 أسبوع: ${formatNumber(data.week52Low, ' دولار')}

تقييم المحللين:
- التوصية: ${data.analystRating}
- السعر المستهدف (الإجماع): ${formatNumber(data.targetConsensus, ' دولار')}
- أعلى سعر مستهدف: ${formatNumber(data.targetHigh, ' دولار')}
- أدنى سعر مستهدف: ${formatNumber(data.targetLow, ' دولار')}

⚠️ استخدم هذه البيانات الحقيقية في التقرير. لا تخترع أرقاماً مختلفة عن المذكورة أعلاه.
⚠️ إذا كان حقل "غير متوفر" — لا تذكره في التقرير أو اكتب "لا تتوفر بيانات".
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
