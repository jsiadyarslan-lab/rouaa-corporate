// ─── FMP (Financial Modeling Prep) API Client ────────────────
// Central API client for fetching stock analysis data from
// Financial Modeling Prep (FMP). Includes smart in-memory
// caching with TTL to avoid rate limits.
// ALL API keys are read from env vars only (never exposed to client).

// ─── Types ──────────────────────────────────────────────────

export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  description: string;
  marketCap: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  beta: number;
  ceo: string;
  country: string;
  image: string; // logo URL
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  previousClose: number;
  marketCap: number;
  peRatio: number;
  peRatioTTM: number;
  eps: number;
  sharesOutstanding: number;
  avgVolume: number;
}

export interface KeyMetrics {
  symbol: string;
  roe: number;
  roa: number;
  debtToEquity: number;
  currentRatio: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  per: number;
  pbr: number;
  dividendYield: number;
  beta: number;
  revenueGrowth: number;
  earningsGrowth: number;
}

export interface StockRating {
  symbol: string;
  rating: string; // "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell"
  ratingScore: number; // 1-5
  ratingRecommendation: string;
  dcf: number; // DCF fair value
  priceTargets: { avg: number; high: number; low: number; median: number };
}

export interface IncomeStatement {
  symbol: string;
  date: string;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
}

export interface StockScreenerResult {
  symbol: string;
  name: string;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  roe: number;
  price: number;
  changePercent: number;
  sector: string;
  exchange: string;
}

// ─── In-Memory Cache ────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const fmpCache = new Map<string, CacheEntry<any>>();

const CACHE_TTL_QUOTES = 30 * 60 * 1000;     // 30 minutes for quotes
const CACHE_TTL_FUNDAMENTALS = 2 * 60 * 60 * 1000; // 2 hours for fundamentals

function getCached<T>(key: string): T | null {
  const entry = fmpCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    fmpCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  fmpCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── API Key Helper ─────────────────────────────────────────

function getFMPApiKey(): string | null {
  const key = process.env.FMP_API_KEY;
  return key && key.trim() !== '' ? key : null;
}

// ─── FMP Base URL ───────────────────────────────────────────

const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

// ─── API Functions ──────────────────────────────────────────

/**
 * Get company profile from FMP.
 * Endpoint: GET /profile/{symbol}
 * Returns null if API key not configured or request fails.
 */
export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return null;

  const cacheKey = `fmp_profile_${symbol}`;
  const cached = getCached<CompanyProfile>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE}/profile/${encodeURIComponent(symbol)}?apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const p = json[0];
    const profile: CompanyProfile = {
      symbol: p.symbol || symbol,
      name: p.companyName || p.name || '',
      exchange: p.exchange || '',
      sector: p.sector || '',
      industry: p.industry || '',
      description: p.description || '',
      marketCap: parseFloat(p.mktCap) || 0,
      peRatio: parseFloat(p.pe) || 0,
      eps: parseFloat(p.eps) || 0,
      dividendYield: parseFloat(p.lastDiv) || 0,
      beta: parseFloat(p.beta) || 0,
      ceo: p.ceo || '',
      country: p.country || '',
      image: p.image || '',
    };

    setCache(cacheKey, profile, CACHE_TTL_FUNDAMENTALS);
    console.log(`[FMP] Company profile fetched: ${symbol} = ${profile.name}`);
    return profile;
  } catch (err: any) {
    console.warn(`[FMP] Company profile error for ${symbol}:`, err.message?.slice(0, 100));
    return null;
  }
}

/**
 * Get real-time stock quote from FMP.
 * Endpoint: GET /quote/{symbol}
 * Returns null if API key not configured or request fails.
 */
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return null;

  const cacheKey = `fmp_quote_${symbol}`;
  const cached = getCached<StockQuote>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE}/quote/${encodeURIComponent(symbol)}?apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const q = json[0];
    const quote: StockQuote = {
      symbol: q.symbol || symbol,
      price: parseFloat(q.price) || 0,
      change: parseFloat(q.change) || 0,
      changePercent: parseFloat(q.changesPercentage) || 0,
      high: parseFloat(q.dayHigh) || 0,
      low: parseFloat(q.dayLow) || 0,
      open: parseFloat(q.open) || 0,
      volume: parseInt(q.volume) || 0,
      previousClose: parseFloat(q.previousClose) || 0,
      marketCap: parseFloat(q.marketCap) || 0,
      peRatio: parseFloat(q.pe) || 0,
      peRatioTTM: parseFloat(q.peRatioTTM) || 0,
      eps: parseFloat(q.eps) || 0,
      sharesOutstanding: parseInt(q.sharesOutstanding) || 0,
      avgVolume: parseInt(q.avgVolume) || 0,
    };

    setCache(cacheKey, quote, CACHE_TTL_QUOTES);
    console.log(`[FMP] Stock quote fetched: ${symbol} = ${quote.price}`);
    return quote;
  } catch (err: any) {
    console.warn(`[FMP] Stock quote error for ${symbol}:`, err.message?.slice(0, 100));
    return null;
  }
}

/**
 * Get key financial metrics from FMP.
 * Endpoint: GET /key-metrics/{symbol}
 * Returns null if API key not configured or request fails.
 */
export async function getKeyMetrics(symbol: string): Promise<KeyMetrics | null> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return null;

  const cacheKey = `fmp_keymetrics_${symbol}`;
  const cached = getCached<KeyMetrics>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE}/key-metrics/${encodeURIComponent(symbol)}?period=annual&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const m = json[0];
    const metrics: KeyMetrics = {
      symbol: m.symbol || symbol,
      roe: parseFloat(m.roe) || 0,
      roa: parseFloat(m.roa) || 0,
      debtToEquity: parseFloat(m.debtToEquity) || 0,
      currentRatio: parseFloat(m.currentRatio) || 0,
      grossMargin: parseFloat(m.grossProfitMargin) || 0,
      operatingMargin: parseFloat(m.operatingProfitMargin) || 0,
      netMargin: parseFloat(m.netProfitMargin) || 0,
      per: parseFloat(m.peRatio) || 0,
      pbr: parseFloat(m.pbRatio) || 0,
      dividendYield: parseFloat(m.dividendYield) || 0,
      beta: parseFloat(m.beta) || 0,
      revenueGrowth: parseFloat(m.revenueGrowth) || 0,
      earningsGrowth: parseFloat(m.earningsGrowth) || 0,
    };

    setCache(cacheKey, metrics, CACHE_TTL_FUNDAMENTALS);
    console.log(`[FMP] Key metrics fetched: ${symbol}`);
    return metrics;
  } catch (err: any) {
    console.warn(`[FMP] Key metrics error for ${symbol}:`, err.message?.slice(0, 100));
    return null;
  }
}

/**
 * Get TTM (Trailing Twelve Months) key metrics from FMP.
 * Endpoint: GET /key-metrics/{symbol}?period=ttm
 * Returns the most recent 12-month rolling metrics — more current than annual.
 */
export async function getKeyMetricsTTM(symbol: string): Promise<KeyMetrics | null> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return null;

  const cacheKey = `fmp_keymetrics_ttm_${symbol}`;
  const cached = getCached<KeyMetrics>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE}/key-metrics/${encodeURIComponent(symbol)}?period=ttm&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const m = json[0];
    const metrics: KeyMetrics = {
      symbol: m.symbol || symbol,
      roe: parseFloat(m.roe) || 0,
      roa: parseFloat(m.roa) || 0,
      debtToEquity: parseFloat(m.debtToEquity) || 0,
      currentRatio: parseFloat(m.currentRatio) || 0,
      grossMargin: parseFloat(m.grossProfitMargin) || 0,
      operatingMargin: parseFloat(m.operatingProfitMargin) || 0,
      netMargin: parseFloat(m.netProfitMargin) || 0,
      per: parseFloat(m.peRatio) || 0,
      pbr: parseFloat(m.pbRatio) || 0,
      dividendYield: parseFloat(m.dividendYield) || 0,
      beta: parseFloat(m.beta) || 0,
      revenueGrowth: parseFloat(m.revenueGrowth) || 0,
      earningsGrowth: parseFloat(m.earningsGrowth) || 0,
    };

    setCache(cacheKey, metrics, CACHE_TTL_FUNDAMENTALS);
    console.log(`[FMP] TTM Key metrics fetched: ${symbol}`);
    return metrics;
  } catch (err: any) {
    console.warn(`[FMP] TTM Key metrics error for ${symbol}:`, err.message?.slice(0, 100));
    return null;
  }
}

/**
 * Get stock rating from FMP.
 * Endpoint: GET /rating/{symbol}
 * Returns null if API key not configured or request fails.
 */
export async function getStockRating(symbol: string): Promise<StockRating | null> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return null;

  const cacheKey = `fmp_rating_${symbol}`;
  const cached = getCached<StockRating>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE}/rating/${encodeURIComponent(symbol)}?apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const r = json[0];
    const rating: StockRating = {
      symbol: r.symbol || symbol,
      rating: r.ratingRecommendation || r.rating || '',
      ratingScore: parseInt(r.ratingScore) || 0,
      ratingRecommendation: r.ratingRecommendation || '',
      dcf: parseFloat(r.dcf) || 0,
      priceTargets: {
        avg: parseFloat(r.priceTargetAvg) || 0,
        high: parseFloat(r.priceTargetHigh) || 0,
        low: parseFloat(r.priceTargetLow) || 0,
        median: parseFloat(r.priceTargetMedian) || 0,
      },
    };

    setCache(cacheKey, rating, CACHE_TTL_FUNDAMENTALS);
    console.log(`[FMP] Stock rating fetched: ${symbol} = ${rating.rating}`);
    return rating;
  } catch (err: any) {
    console.warn(`[FMP] Stock rating error for ${symbol}:`, err.message?.slice(0, 100));
    return null;
  }
}

/**
 * Get income statements from FMP.
 * Endpoint: GET /income-statement/{symbol}
 * Returns empty array if API key not configured or request fails.
 */
export async function getIncomeStatements(symbol: string, limit: number = 5): Promise<IncomeStatement[]> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return [];

  const cacheKey = `fmp_income_${symbol}_${limit}`;
  const cached = getCached<IncomeStatement[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE}/income-statement/${encodeURIComponent(symbol)}?limit=${limit}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return [];

    const statements: IncomeStatement[] = json.map((s: any) => ({
      symbol: s.symbol || symbol,
      date: s.date || s.fillDate || '',
      revenue: parseFloat(s.revenue) || 0,
      grossProfit: parseFloat(s.grossProfit) || 0,
      operatingIncome: parseFloat(s.operatingIncome) || 0,
      netIncome: parseFloat(s.netIncome) || 0,
      eps: parseFloat(s.eps) || 0,
    }));

    setCache(cacheKey, statements, CACHE_TTL_FUNDAMENTALS);
    console.log(`[FMP] Income statements fetched: ${symbol} = ${statements.length} periods`);
    return statements;
  } catch (err: any) {
    console.warn(`[FMP] Income statements error for ${symbol}:`, err.message?.slice(0, 100));
    return [];
  }
}

/**
 * Get TTM (Trailing Twelve Months) income statement for a symbol.
 * This is critical for showing CURRENT financial data instead of stale annual reports.
 * FMP API supports period=ttm on income-statement endpoint.
 */
export async function getIncomeStatementsTTM(symbol: string): Promise<IncomeStatement | null> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return null;

  const cacheKey = `fmp_income_ttm_${symbol}`;
  const cached = getCached<IncomeStatement>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE}/income-statement/${encodeURIComponent(symbol)}?period=ttm&limit=1&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const s = json[0];
    const statement: IncomeStatement = {
      symbol: s.symbol || symbol,
      date: s.date || s.fillDate || 'TTM',
      revenue: parseFloat(s.revenue) || 0,
      grossProfit: parseFloat(s.grossProfit) || 0,
      operatingIncome: parseFloat(s.operatingIncome) || 0,
      netIncome: parseFloat(s.netIncome) || 0,
      eps: parseFloat(s.eps) || 0,
    };

    setCache(cacheKey, statement, CACHE_TTL_FUNDAMENTALS);
    console.log(`[FMP] TTM Income statement fetched: ${symbol} (revenue: $${(statement.revenue / 1e9).toFixed(1)}B)`);
    return statement;
  } catch (err: any) {
    console.warn(`[FMP] TTM Income statement error for ${symbol}:`, err.message?.slice(0, 100));
    return null;
  }
}

/**
 * Get top performing stocks from FMP screener.
 * Uses stock screener with marketCap > 1B, sorted by performance.
 * Returns empty array if API key not configured or request fails.
 */
export async function getTopPerformers(limit: number = 20): Promise<StockScreenerResult[]> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return [];

  const cacheKey = `fmp_top_performers_${limit}`;
  const cached = getCached<StockScreenerResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE}/stock-screener?marketCapMoreThan=1000000000&limit=${limit}&exchange=NYSE,NASDAQ&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return [];

    const results: StockScreenerResult[] = json.map((s: any) => ({
      symbol: s.symbol || '',
      name: s.companyName || s.name || '',
      marketCap: parseFloat(s.marketCap) || 0,
      peRatio: parseFloat(s.pe) || 0,
      dividendYield: parseFloat(s.lastDiv) || parseFloat(s.dividendYield) || 0,
      roe: parseFloat(s.roe) || 0,
      price: parseFloat(s.price) || 0,
      changePercent: parseFloat(s.changesPercentage) || 0,
      sector: s.sector || '',
      exchange: s.exchange || '',
    }));

    // Sort by changePercent descending (top performers first)
    results.sort((a, b) => b.changePercent - a.changePercent);

    setCache(cacheKey, results, CACHE_TTL_QUOTES);
    console.log(`[FMP] Top performers fetched: ${results.length} stocks`);
    return results;
  } catch (err: any) {
    console.warn(`[FMP] Top performers error:`, err.message?.slice(0, 100));
    return [];
  }
}

/**
 * Get fastest growing stocks from FMP screener.
 * Uses stock screener with marketCap > 1B, sorted by revenue growth.
 * Returns empty array if API key not configured or request fails.
 */
export async function getFastestGrowing(limit: number = 20): Promise<StockScreenerResult[]> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return [];

  const cacheKey = `fmp_fastest_growing_${limit}`;
  const cached = getCached<StockScreenerResult[]>(cacheKey);
  if (cached) return cached;

  try {
    // Use the v4 screener endpoint which supports revenueGrowth sorting
    const url = `https://financialmodelingprep.com/api/v4/stock-screener?marketCapMoreThan=1000000000&limit=${limit}&exchange=NYSE,NASDAQ&sort=revenueGrowth&order=desc&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return [];

    const results: StockScreenerResult[] = json.map((s: any) => ({
      symbol: s.symbol || '',
      name: s.companyName || s.name || '',
      marketCap: parseFloat(s.marketCap) || 0,
      peRatio: parseFloat(s.pe) || 0,
      dividendYield: parseFloat(s.lastDiv) || parseFloat(s.dividendYield) || 0,
      roe: parseFloat(s.roe) || 0,
      price: parseFloat(s.price) || 0,
      changePercent: parseFloat(s.changesPercentage) || 0,
      sector: s.sector || '',
      exchange: s.exchange || '',
    }));

    setCache(cacheKey, results, CACHE_TTL_FUNDAMENTALS);
    console.log(`[FMP] Fastest growing fetched: ${results.length} stocks`);
    return results;
  } catch (err: any) {
    console.warn(`[FMP] Fastest growing error:`, err.message?.slice(0, 100));
    return [];
  }
}

/**
 * Search for stocks by name or symbol.
 * Endpoint: GET /search?query=...
 * Returns empty array if API key not configured or request fails.
 */
export async function searchStocks(query: string): Promise<Array<{ symbol: string; name: string }>> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return [];

  if (!query || query.trim().length === 0) return [];

  const cacheKey = `fmp_search_${query.toLowerCase().trim()}`;
  const cached = getCached<Array<{ symbol: string; name: string }>>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE}/search?query=${encodeURIComponent(query.trim())}&limit=10&exchange=NYSE,NASDAQ&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return [];

    const results: Array<{ symbol: string; name: string }> = json.map((s: any) => ({
      symbol: s.symbol || '',
      name: s.name || s.companyName || '',
    }));

    setCache(cacheKey, results, CACHE_TTL_QUOTES);
    console.log(`[FMP] Search stocks: "${query}" = ${results.length} results`);
    return results;
  } catch (err: any) {
    console.warn(`[FMP] Search stocks error for "${query}":`, err.message?.slice(0, 100));
    return [];
  }
}

/**
 * Get balance sheet statements from FMP.
 * Endpoint: GET /balance-sheet-statement/{symbol}
 * Returns empty array if API key not configured or request fails.
 */
export interface BalanceSheet {
  symbol: string;
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  cash: number;
  totalDebt: number;
  currentAssets: number;
  currentLiabilities: number;
  netReceivables: number;
  inventory: number;
  longTermDebt: number;
  retainedEarnings: number;
}

export async function getBalanceSheets(symbol: string, limit: number = 5): Promise<BalanceSheet[]> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return [];

  const cacheKey = `fmp_balancesheet_${symbol}_${limit}`;
  const cached = getCached<BalanceSheet[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE}/balance-sheet-statement/${encodeURIComponent(symbol)}?limit=${limit}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return [];

    const statements: BalanceSheet[] = json.map((s: any) => ({
      symbol: s.symbol || symbol,
      date: s.date || s.fillDate || '',
      totalAssets: parseFloat(s.totalAssets) || 0,
      totalLiabilities: parseFloat(s.totalLiabilities) || 0,
      totalEquity: parseFloat(s.totalStockholdersEquity) || parseFloat(s.totalEquity) || 0,
      cash: parseFloat(s.cashAndCashEquivalents) || parseFloat(s.cash) || 0,
      totalDebt: parseFloat(s.totalDebt) || 0,
      currentAssets: parseFloat(s.totalCurrentAssets) || 0,
      currentLiabilities: parseFloat(s.totalCurrentLiabilities) || 0,
      netReceivables: parseFloat(s.netReceivables) || 0,
      inventory: parseFloat(s.inventory) || 0,
      longTermDebt: parseFloat(s.longTermDebt) || 0,
      retainedEarnings: parseFloat(s.retainedEarnings) || 0,
    }));

    setCache(cacheKey, statements, CACHE_TTL_FUNDAMENTALS);
    console.log(`[FMP] Balance sheets fetched: ${symbol} = ${statements.length} periods`);
    return statements;
  } catch (err: any) {
    console.warn(`[FMP] Balance sheets error for ${symbol}:`, err.message?.slice(0, 100));
    return [];
  }
}

/**
 * Get cash flow statements from FMP.
 * Endpoint: GET /cash-flow-statement/{symbol}
 * Returns empty array if API key not configured or request fails.
 */
export interface CashFlowStatement {
  symbol: string;
  date: string;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  netIncome: number;
  depreciation: number;
  changeInCash: number;
  dividendPaid: number;
  stockRepurchased: number;
}

export async function getCashFlowStatements(symbol: string, limit: number = 5): Promise<CashFlowStatement[]> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return [];

  const cacheKey = `fmp_cashflow_${symbol}_${limit}`;
  const cached = getCached<CashFlowStatement[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE}/cash-flow-statement/${encodeURIComponent(symbol)}?limit=${limit}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return [];

    const statements: CashFlowStatement[] = json.map((s: any) => ({
      symbol: s.symbol || symbol,
      date: s.date || s.fillDate || '',
      operatingCashFlow: parseFloat(s.operatingCashFlow) || 0,
      capitalExpenditure: parseFloat(s.capitalExpenditure) || 0,
      freeCashFlow: parseFloat(s.freeCashFlow) || 0,
      netIncome: parseFloat(s.netIncome) || 0,
      depreciation: parseFloat(s.depreciationAndAmortization) || parseFloat(s.depreciation) || 0,
      changeInCash: parseFloat(s.changeInCash) || 0,
      dividendPaid: parseFloat(s.dividendsPaid) || parseFloat(s.dividendPaid) || 0,
      stockRepurchased: parseFloat(s.commonStockRepurchased) || parseFloat(s.stockRepurchased) || 0,
    }));

    setCache(cacheKey, statements, CACHE_TTL_FUNDAMENTALS);
    console.log(`[FMP] Cash flow statements fetched: ${symbol} = ${statements.length} periods`);
    return statements;
  } catch (err: any) {
    console.warn(`[FMP] Cash flow statements error for ${symbol}:`, err.message?.slice(0, 100));
    return [];
  }
}

/**
 * Get sector performance from FMP.
 * Endpoint: GET /sector-performance
 * Returns empty array if API key not configured or request fails.
 */
export interface SectorPerformance {
  sector: string;
  changePercent: number;
  stocksCount: number;
}

export async function getSectorPerformance(): Promise<SectorPerformance[]> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return [];

  const cacheKey = `fmp_sector_performance`;
  const cached = getCached<SectorPerformance[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE}/sector-performance?apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return [];

    const results: SectorPerformance[] = json.map((s: any) => ({
      sector: s.sector || '',
      changePercent: parseFloat(s.changesPercentage) || 0,
      stocksCount: parseInt(s.stocksCount) || 0,
    }));

    setCache(cacheKey, results, CACHE_TTL_QUOTES);
    console.log(`[FMP] Sector performance fetched: ${results.length} sectors`);
    return results;
  } catch (err: any) {
    console.warn(`[FMP] Sector performance error:`, err.message?.slice(0, 100));
    return [];
  }
}

/**
 * Get stock peers from FMP.
 * Endpoint: GET /stock_peers?symbol=...
 * Returns empty array if API key not configured or request fails.
 */
export async function getStockPeers(symbol: string): Promise<string[]> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return [];

  const cacheKey = `fmp_peers_${symbol}`;
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://financialmodelingprep.com/api/v4/stock_peers?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return [];

    // The API returns array of { symbol, peersList: string[] }
    const peersList: string[] = json[0]?.peersList || [];
    const peers = peersList.filter(Boolean);

    setCache(cacheKey, peers, CACHE_TTL_FUNDAMENTALS);
    console.log(`[FMP] Stock peers fetched: ${symbol} = ${peers.length} peers`);
    return peers;
  } catch (err: any) {
    console.warn(`[FMP] Stock peers error for ${symbol}:`, err.message?.slice(0, 100));
    return [];
  }
}

/**
 * Get price target consensus from FMP.
 * Endpoint: GET /price-target-consensus?symbol=...
 * Returns null if API key not configured or request fails.
 */
export interface PriceTargetConsensus {
  symbol: string;
  targetHigh: number;
  targetLow: number;
  targetConsensus: number;
  targetMedian: number;
}

export async function getPriceTargetConsensus(symbol: string): Promise<PriceTargetConsensus | null> {
  const apiKey = getFMPApiKey();
  if (!apiKey) return null;

  const cacheKey = `fmp_price_target_${symbol}`;
  const cached = getCached<PriceTargetConsensus>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE}/price-target-consensus?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const t = json[0];
    const consensus: PriceTargetConsensus = {
      symbol: t.symbol || symbol,
      targetHigh: parseFloat(t.targetHigh) || 0,
      targetLow: parseFloat(t.targetLow) || 0,
      targetConsensus: parseFloat(t.targetConsensus) || 0,
      targetMedian: parseFloat(t.targetMedian) || 0,
    };

    setCache(cacheKey, consensus, CACHE_TTL_FUNDAMENTALS);
    console.log(`[FMP] Price target consensus fetched: ${symbol} = ${consensus.targetConsensus}`);
    return consensus;
  } catch (err: any) {
    console.warn(`[FMP] Price target consensus error for ${symbol}:`, err.message?.slice(0, 100));
    return null;
  }
}

/**
 * Check if FMP API key is configured.
 * Useful for determining whether to attempt real data fetches.
 */
export function hasFMPApiKey(): boolean {
  return !!getFMPApiKey();
}
