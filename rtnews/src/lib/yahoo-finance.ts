// ─── Yahoo Finance Integration ──────────────────────────────────
// Free, no-API-key data source using yahoo-finance2 package.
// Provides quotes, historical data, company profiles, financials,
// and more — completely free with ~2,000 requests/hour soft limit.
//
// This is the BEST free data source because:
// 1. No API key needed
// 2. Unlimited requests (soft cap ~2K/hr)
// 3. Full fundamental data (P/E, EPS, market cap, etc.)
// 4. Real-time quotes with 15-min delay
// 5. Historical OHLCV data
// 6. Company profiles, financial statements, recommendations
//
// Rate Limits: ~2,000 requests/hour before Yahoo throttles
// Legal: OK for personal/educational use; not for commercial products per Yahoo ToS

import YahooFinance2 from 'yahoo-finance2';

// Singleton instance for Yahoo Finance — reused across all API calls
const yf = new YahooFinance2({ suppressNotices: ['yahooSurvey'] });

// ─── Types ──────────────────────────────────────────────────

export interface YahooQuoteData {
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
  marketCap?: number;
  peRatio?: number;
  eps?: number;
  week52High?: number;
  week52Low?: number;
  avgVolume?: number;
  dividendYield?: number;
  name?: string;
  exchange?: string;
}

export interface YahooHistoricalPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface YahooCompanyProfile {
  symbol: string;
  companyName: string;
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
  logoUrl: string;
  ceo: string;
  fullTimeEmployees: number;
}

export interface YahooIncomeStatement {
  date: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
  ebitda: number;
}

export interface YahooBalanceSheet {
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  totalStockholdersEquity: number;
  cashAndCashEquivalents: number;
  totalDebt: number;
  currentAssets: number;
  currentLiabilities: number;
}

export interface YahooCashFlowStatement {
  date: string;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  netIncome: number;
  depreciationAndAmortization: number;
}

export interface YahooRecommendation {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

// ─── In-Memory Cache ────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

const CACHE_TTL_QUOTES = 15 * 60 * 1000;       // 15 minutes for quotes
const CACHE_TTL_HISTORY = 2 * 60 * 60 * 1000;   // 2 hours for historical
const CACHE_TTL_PROFILE = 24 * 60 * 60 * 1000;  // 24 hours for profiles
const CACHE_TTL_FINANCIALS = 24 * 60 * 60 * 1000; // 24 hours for financials
const MAX_CACHE_SIZE = 500; // Prevent unbounded memory growth

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
  // Evict oldest entry if cache is full
  if (cache.size >= MAX_CACHE_SIZE) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [k, v] of cache) {
      if (v.createdAt < oldestTime) {
        oldestTime = v.createdAt;
        oldestKey = k;
      }
    }
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + ttlMs, createdAt: Date.now() });
}

// ─── Yahoo Finance Fetch Functions ──────────────────────────

/**
 * Fetch real-time quote from Yahoo Finance.
 * No API key needed. Returns comprehensive quote data including
 * market cap, P/E, EPS, 52-week range, etc.
 */
export async function fetchYahooQuote(symbol: string): Promise<YahooQuoteData | null> {
  const cacheKey = `yf_quote_${symbol}`;
  const cached = getCached<YahooQuoteData>(cacheKey);
  if (cached) return cached;

  try {
    // yf is module-level singleton
    const quote = await yf.quote(symbol);

    if (!quote || !quote.regularMarketPrice) return null;

    const price = quote.regularMarketPrice || 0;
    if (price <= 0) return null;

    const change = quote.regularMarketChange || 0;
    const changePercent = quote.regularMarketChangePercent || 0;

    const result: YahooQuoteData = {
      symbol: quote.symbol || symbol,
      price,
      change,
      changePercent,
      high: quote.regularMarketDayHigh || price,
      low: quote.regularMarketDayLow || price,
      open: quote.regularMarketOpen || price,
      volume: quote.regularMarketVolume || 0,
      previousClose: quote.regularMarketPreviousClose || price,
      timestamp: quote.regularMarketTime ? quote.regularMarketTime * 1000 : Date.now(),
      marketCap: quote.marketCap || undefined,
      peRatio: quote.trailingPE || undefined,
      eps: quote.epsTrailingTwelveMonths || quote.epsForward || undefined,
      week52High: quote.fiftyTwoWeekHigh || undefined,
      week52Low: quote.fiftyTwoWeekLow || undefined,
      avgVolume: quote.averageDailyVolume3Month || undefined,
      dividendYield: quote.dividendYield ? quote.dividendYield * 100 : undefined,
      name: quote.shortName || quote.longName || undefined,
      exchange: quote.fullExchangeName || quote.exchangeName || undefined,
    };

    setCache(cacheKey, result, CACHE_TTL_QUOTES);
    return result;
  } catch (err: any) {
    // Yahoo Finance throws for invalid symbols
    const msg = err?.message || String(err);
    if (!msg.includes('No data found') && !msg.includes('Not Found')) {
      console.warn(`[YahooFinance] Quote error for ${symbol}:`, msg.slice(0, 100));
    }
    return null;
  }
}

/**
 * Fetch historical OHLCV data from Yahoo Finance.
 * No API key needed. Returns daily data for the specified number of days.
 * Can also be used for intraday data by changing the period/interval.
 */
export async function fetchYahooHistory(
  symbol: string,
  days: number = 90
): Promise<YahooHistoricalPoint[]> {
  const cacheKey = `yf_history_${symbol}_${days}`;
  const cached = getCached<YahooHistoricalPoint[]>(cacheKey);
  if (cached) return cached;

  try {
    const period1 = new Date();
    period1.setDate(period1.getDate() - days);

    // yf is module-level singleton
    const result = await yf.chart(symbol, {
      period1: period1.toISOString().split('T')[0],
      interval: '1d',
    });

    if (!result || !result.quotes || result.quotes.length === 0) return [];

    const points: YahooHistoricalPoint[] = [];
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
    return points;
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn(`[YahooFinance] History error for ${symbol}:`, msg.slice(0, 100));
    return [];
  }
}

/**
 * Fetch comprehensive company profile from Yahoo Finance.
 * Includes industry, sector, description, employees, and more.
 * Uses quoteSummary with multiple modules.
 */
export async function fetchYahooProfile(symbol: string): Promise<YahooCompanyProfile | null> {
  const cacheKey = `yf_profile_${symbol}`;
  const cached = getCached<YahooCompanyProfile>(cacheKey);
  if (cached) return cached;

  try {
    // yf is module-level singleton
    const summary = await yf.quoteSummary(symbol, {
      modules: ['assetProfile', 'summaryDetail', 'defaultKeyStatistics', 'price', 'financialData'],
    });

    if (!summary) return null;

    const profile = summary.assetProfile;
    const detail = summary.summaryDetail;
    const stats = summary.defaultKeyStatistics;
    const priceData = summary.price;
    const financial = summary.financialData;

    if (!profile && !detail && !priceData) return null;

    const result: YahooCompanyProfile = {
      symbol,
      companyName: priceData?.shortName || priceData?.longName || symbol,
      industry: profile?.industry || '',
      sector: profile?.sector || '',
      country: profile?.country || '',
      exchange: priceData?.exchangeName || '',
      marketCap: stats?.enterpriseValue || detail?.marketCap || 0,
      peRatio: detail?.trailingPE || stats?.forwardPE || 0,
      eps: stats?.trailingEps || 0,
      dividendYield: detail?.dividendYield ? detail.dividendYield * 100 : 0,
      beta: stats?.beta || 0,
      week52High: detail?.fiftyTwoWeekHigh || 0,
      week52Low: detail?.fiftyTwoWeekLow || 0,
      avgVolume: detail?.averageVolume || 0,
      price: priceData?.regularMarketPrice || 0,
      description: profile?.longBusinessSummary || profile?.description || '',
      website: profile?.website || '',
      logoUrl: '', // Yahoo Finance doesn't provide logos directly
      ceo: profile?.companyOfficers?.[0]?.name || '',
      fullTimeEmployees: profile?.fullTimeEmployees || 0,
    };

    setCache(cacheKey, result, CACHE_TTL_PROFILE);
    return result;
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn(`[YahooFinance] Profile error for ${symbol}:`, msg.slice(0, 100));
    return null;
  }
}

/**
 * Fetch all financial statements + recommendations in a single quoteSummary call.
 * Consolidates 5 separate API calls into 1, reducing Yahoo Finance API usage by 80%.
 * Called internally by the individual fetch functions via shared cache.
 */
async function fetchConsolidatedFinancials(symbol: string): Promise<{
  incomeStatements: YahooIncomeStatement[];
  balanceSheets: YahooBalanceSheet[];
  cashFlowStatements: YahooCashFlowStatement[];
  recommendations: YahooRecommendation[];
}> {
  const consolidatedKey = `yf_consolidated_${symbol}`;
  const cached = getCached<{
    incomeStatements: YahooIncomeStatement[];
    balanceSheets: YahooBalanceSheet[];
    cashFlowStatements: YahooCashFlowStatement[];
    recommendations: YahooRecommendation[];
  }>(consolidatedKey);
  if (cached) return cached;

  try {
    const summary = await yf.quoteSummary(symbol, {
      modules: ['incomeStatementHistory', 'balanceSheetHistory', 'cashflowStatementHistory', 'recommendationTrend'],
    });

    // Parse income statements
    const incomeStatements: YahooIncomeStatement[] =
      summary?.incomeStatementHistory?.incomeStatementHistory?.slice(0, 4).map((s: any) => ({
        date: s.endDate?.fmt || '',
        revenue: s.totalRevenue?.raw || 0,
        costOfRevenue: s.costOfRevenue?.raw || 0,
        grossProfit: s.grossProfit?.raw || 0,
        operatingIncome: s.operatingIncome?.raw || 0,
        netIncome: s.netIncome?.raw || 0,
        eps: s.netIncome?.raw && s.basicAverageShares?.raw
          ? s.netIncome.raw / s.basicAverageShares.raw
          : 0,
        ebitda: s.ebitda?.raw || 0,
      })) || [];

    // Parse balance sheets
    const balanceSheets: YahooBalanceSheet[] =
      summary?.balanceSheetHistory?.balanceSheetStatements?.slice(0, 4).map((s: any) => ({
        date: s.endDate?.fmt || '',
        totalAssets: s.totalAssets?.raw || 0,
        totalLiabilities: s.totalLiab?.raw || 0,
        totalStockholdersEquity: s.totalStockholderEquity?.raw || 0,
        cashAndCashEquivalents: s.cash?.raw || 0,
        totalDebt: (s.shortLongTermDebt?.raw || 0) + (s.longTermDebt?.raw || 0),
        currentAssets: s.totalCurrentAssets?.raw || 0,
        currentLiabilities: s.totalCurrentLiabilities?.raw || 0,
      })) || [];

    // Parse cash flow statements
    const cashFlowStatements: YahooCashFlowStatement[] =
      summary?.cashflowStatementHistory?.cashflowStatements?.slice(0, 4).map((s: any) => ({
        date: s.endDate?.fmt || '',
        operatingCashFlow: s.totalCashFromOperatingActivities?.raw || 0,
        capitalExpenditure: s.capitalExpenditures?.raw || 0,
        freeCashFlow: s.freeCashFlow?.raw || 0,
        netIncome: s.netIncome?.raw || 0,
        depreciationAndAmortization: s.depreciation?.raw || 0,
      })) || [];

    // Parse recommendations
    const recommendations: YahooRecommendation[] =
      summary?.recommendationTrend?.trend?.slice(0, 3).map((t: any) => ({
        period: t.period || '',
        strongBuy: t.strongBuy || 0,
        buy: t.buy || 0,
        hold: t.hold || 0,
        sell: t.sell || 0,
        strongSell: t.strongSell || 0,
      })) || [];

    const result = { incomeStatements, balanceSheets, cashFlowStatements, recommendations };
    setCache(consolidatedKey, result, CACHE_TTL_FINANCIALS);

    // Also populate individual caches so individual fetch functions find them
    setCache(`yf_income_${symbol}`, incomeStatements, CACHE_TTL_FINANCIALS);
    setCache(`yf_balance_${symbol}`, balanceSheets, CACHE_TTL_FINANCIALS);
    setCache(`yf_cashflow_${symbol}`, cashFlowStatements, CACHE_TTL_FINANCIALS);
    setCache(`yf_reco_${symbol}`, recommendations, CACHE_TTL_QUOTES);

    return result;
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn(`[YahooFinance] Consolidated financials error for ${symbol}:`, msg.slice(0, 100));
    return { incomeStatements: [], balanceSheets: [], cashFlowStatements: [], recommendations: [] };
  }
}

/**
 * Fetch income statements from Yahoo Finance.
 * Uses consolidated call to reduce API usage.
 */
export async function fetchYahooIncomeStatements(
  symbol: string
): Promise<YahooIncomeStatement[]> {
  const cacheKey = `yf_income_${symbol}`;
  const cached = getCached<YahooIncomeStatement[]>(cacheKey);
  if (cached) return cached;
  // Trigger consolidated fetch which populates individual caches
  const data = await fetchConsolidatedFinancials(symbol);
  return data.incomeStatements;
}

/**
 * Fetch balance sheets from Yahoo Finance.
 * Uses consolidated call to reduce API usage.
 */
export async function fetchYahooBalanceSheets(
  symbol: string
): Promise<YahooBalanceSheet[]> {
  const cacheKey = `yf_balance_${symbol}`;
  const cached = getCached<YahooBalanceSheet[]>(cacheKey);
  if (cached) return cached;
  const data = await fetchConsolidatedFinancials(symbol);
  return data.balanceSheets;
}

/**
 * Fetch cash flow statements from Yahoo Finance.
 * Uses consolidated call to reduce API usage.
 */
export async function fetchYahooCashFlowStatements(
  symbol: string
): Promise<YahooCashFlowStatement[]> {
  const cacheKey = `yf_cashflow_${symbol}`;
  const cached = getCached<YahooCashFlowStatement[]>(cacheKey);
  if (cached) return cached;
  const data = await fetchConsolidatedFinancials(symbol);
  return data.cashFlowStatements;
}

/**
 * Fetch analyst recommendation trends from Yahoo Finance.
 * Uses consolidated call to reduce API usage.
 */
export async function fetchYahooRecommendations(
  symbol: string
): Promise<YahooRecommendation[]> {
  const cacheKey = `yf_reco_${symbol}`;
  const cached = getCached<YahooRecommendation[]>(cacheKey);
  if (cached) return cached;
  const data = await fetchConsolidatedFinancials(symbol);
  return data.recommendations;
}

/**
 * Fetch all Yahoo Finance data in parallel for a given symbol.
 * Uses consolidated financial call to reduce API usage from 7→3 calls.
 */
export async function fetchYahooAllData(symbol: string): Promise<{
  quote: YahooQuoteData | null;
  profile: YahooCompanyProfile | null;
  history: YahooHistoricalPoint[];
  incomeStatements: YahooIncomeStatement[];
  balanceSheets: YahooBalanceSheet[];
  cashFlowStatements: YahooCashFlowStatement[];
  recommendations: YahooRecommendation[];
}> {
  // 3 parallel calls instead of 7: quote + profile+history + consolidated financials
  const [
    quote,
    profileAndHistory,
    financials,
  ] = await Promise.allSettled([
    fetchYahooQuote(symbol),
    // Fetch profile separately since it uses different modules
    (async () => {
      const [p, h] = await Promise.allSettled([
        fetchYahooProfile(symbol),
        fetchYahooHistory(symbol, 365),
      ]);
      return {
        profile: p.status === 'fulfilled' ? p.value : null,
        history: h.status === 'fulfilled' ? h.value : [],
      };
    })(),
    fetchConsolidatedFinancials(symbol),
  ]);

  return {
    quote: quote.status === 'fulfilled' ? quote.value : null,
    profile: profileAndHistory.status === 'fulfilled' ? profileAndHistory.value.profile : null,
    history: profileAndHistory.status === 'fulfilled' ? profileAndHistory.value.history : [],
    incomeStatements: financials.status === 'fulfilled' ? financials.value.incomeStatements : [],
    balanceSheets: financials.status === 'fulfilled' ? financials.value.balanceSheets : [],
    cashFlowStatements: financials.status === 'fulfilled' ? financials.value.cashFlowStatements : [],
    recommendations: financials.status === 'fulfilled' ? financials.value.recommendations : [],
  };
}

/**
 * Check if Yahoo Finance is available.
 * Always returns true since no API key is needed.
 */
export function isYahooFinanceAvailable(): boolean {
  return true;
}
