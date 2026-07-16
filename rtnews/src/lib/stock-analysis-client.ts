// ─── Stock Analysis API Client ──────────────────────────────────
// Client-side API functions for the Stock Analysis feature.
// All requests use relative paths for Caddy gateway compatibility.

import type { Locale } from '@/lib/locale';

// ── Types ──

export interface StockPerformer {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  pe: number | null;
  sector: string;
  rating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  eps?: number | null;
  revenueGrowth?: number | null;
  earningsGrowth?: number | null;
}

export interface SectorOverview {
  name: string;
  nameLocal: string;
  avgChange: number;
  stockCount: number;
  topStock: string;
  topStockChange: number;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  sector: string;
  marketCap: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
  rsi: number | null;
  macdSignal: 'bullish' | 'bearish' | 'neutral';
  maSignal: 'bullish' | 'bearish' | 'neutral';
  aiSummary: string | null;
}

export interface StockAnalysisDetail {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  logo?: string;
  price: number;
  change: number;
  changePercent: number;
  candlestickData: { date: string; open: number; high: number; low: number; close: number; volume: number }[];
  technical: {
    rsi: number | null;
    macdSignal: 'bullish' | 'bearish' | 'neutral';
    bollingerUpper: number | null;
    bollingerLower: number | null;
    support: number | null;
    resistance: number | null;
    ma50: number | null;
    ma200: number | null;
  };
  fundamental: {
    pe: number | null;
    eps: number | null;
    marketCap: string;
    dividendYield: number | null;
    roe: number | null;
    roa: number | null;
  };
  aiAnalysis: string | null;
  relatedNews: { title: string; slug: string; date: string; source: string }[];
}

export interface StockAnalysisListItem {
  id: string;
  symbol: string;
  title: string;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  createdAt: string;
  locale: string;
}

// ── API Functions ──

/**
 * Fetch paginated list of stock analyses for a given locale.
 */
export async function fetchStockAnalyses(
  locale: string,
  page: number = 1,
  limit: number = 20
): Promise<{ analyses: StockAnalysisListItem[]; total: number; page: number }> {
  const res = await fetch(
    `/api/stock-analysis?action=list&locale=${locale}&page=${page}&limit=${limit}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to fetch stock analyses');
  return res.json();
}

/**
 * Fetch a single stock analysis by symbol.
 */
export async function fetchStockAnalysis(
  symbol: string,
  locale: string
): Promise<StockAnalysisDetail | null> {
  const res = await fetch(
    `/api/stock-analysis?action=symbol&symbol=${encodeURIComponent(symbol)}&locale=${locale}`,
    { cache: 'no-store' }
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch stock analysis');
  }
  return res.json();
}

/**
 * Fetch top 30 performing stocks.
 * Returns mock data if the API is not yet available.
 */
export async function fetchTopPerformers(): Promise<StockPerformer[]> {
  try {
    const res = await fetch('/api/stock-analysis?action=top-performers', { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch { /* fallback to mock */ }
  return getMockTopPerformers();
}

/**
 * Fetch fastest growing stocks.
 * Returns mock data if the API is not yet available.
 */
export async function fetchFastestGrowing(): Promise<StockPerformer[]> {
  try {
    const res = await fetch('/api/stock-analysis?action=fastest-growing', { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch { /* fallback to mock */ }
  return getMockFastestGrowing();
}

/**
 * Search for stocks by symbol or company name.
 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `/api/stock-analysis?action=search&q=${encodeURIComponent(query.trim())}`,
      { cache: 'no-store' }
    );
    if (res.ok) return res.json();
  } catch { /* fallback to mock */ }
  return getMockSearchResults(query);
}

/**
 * Fetch sector overview data.
 */
export async function fetchSectorOverview(locale: string): Promise<SectorOverview[]> {
  try {
    const res = await fetch(
      `/api/stock-analysis?action=sectors&locale=${locale}`,
      { cache: 'no-store' }
    );
    if (res.ok) return res.json();
  } catch { /* fallback to mock */ }
  return getMockSectors(locale);
}

/**
 * Fetch detail page data for a specific stock symbol.
 */
export async function fetchStockDetail(
  symbol: string,
  locale: string
): Promise<StockAnalysisDetail | null> {
  try {
    const res = await fetch(
      `/api/stock-analysis/${encodeURIComponent(symbol)}?locale=${locale}`,
      { cache: 'no-store' }
    );
    if (res.ok) return res.json();
    if (res.status === 404) return null;
  } catch { /* fallback to mock */ }
  return getMockStockDetail(symbol);
}

// ── Mock Data (for development before API is ready) ──

function getMockTopPerformers(): StockPerformer[] {
  return [
    { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.30, change: 28.50, changePercent: 3.37, marketCap: '2.16T', pe: 68.5, sector: 'Technology', rating: 'Buy' },
    { symbol: 'META', name: 'Meta Platforms', price: 505.20, change: 14.80, changePercent: 3.02, marketCap: '1.29T', pe: 27.3, sector: 'Technology', rating: 'Buy' },
    { symbol: 'AMZN', name: 'Amazon.com Inc', price: 185.60, change: 4.90, changePercent: 2.71, marketCap: '1.93T', pe: 58.2, sector: 'Consumer Cyclical', rating: 'Strong Buy' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', price: 425.50, change: 9.30, changePercent: 2.23, marketCap: '3.16T', pe: 36.8, sector: 'Technology', rating: 'Buy' },
    { symbol: 'GOOGL', name: 'Alphabet Inc', price: 175.80, change: 3.40, changePercent: 1.97, marketCap: '2.17T', pe: 25.1, sector: 'Communication', rating: 'Strong Buy' },
    { symbol: 'AAPL', name: 'Apple Inc', price: 195.20, change: 3.10, changePercent: 1.61, marketCap: '3.01T', pe: 31.2, sector: 'Technology', rating: 'Hold' },
    { symbol: 'TSLA', name: 'Tesla Inc', price: 245.80, change: 8.40, changePercent: 3.54, marketCap: '782B', pe: 62.8, sector: 'Consumer Cyclical', rating: 'Hold' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', price: 165.40, change: 5.20, changePercent: 3.25, marketCap: '267B', pe: 45.3, sector: 'Technology', rating: 'Buy' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co', price: 198.50, change: 2.80, changePercent: 1.43, marketCap: '572B', pe: 12.1, sector: 'Financial', rating: 'Buy' },
    { symbol: 'V', name: 'Visa Inc', price: 285.30, change: 3.90, changePercent: 1.39, marketCap: '583B', pe: 30.5, sector: 'Financial', rating: 'Buy' },
    { symbol: 'UNH', name: 'UnitedHealth Group', price: 528.60, change: 7.40, changePercent: 1.42, marketCap: '488B', pe: 22.8, sector: 'Healthcare', rating: 'Buy' },
    { symbol: 'LLY', name: 'Eli Lilly & Co', price: 782.40, change: 18.60, changePercent: 2.44, marketCap: '742B', pe: 82.5, sector: 'Healthcare', rating: 'Hold' },
    { symbol: 'COST', name: 'Costco Wholesale', price: 725.80, change: 10.20, changePercent: 1.42, marketCap: '322B', pe: 48.2, sector: 'Consumer Defensive', rating: 'Hold' },
    { symbol: 'WMT', name: 'Walmart Inc', price: 168.30, change: 2.10, changePercent: 1.26, marketCap: '453B', pe: 28.9, sector: 'Consumer Defensive', rating: 'Buy' },
    { symbol: 'XOM', name: 'Exxon Mobil Corp', price: 118.40, change: 1.80, changePercent: 1.54, marketCap: '478B', pe: 13.2, sector: 'Energy', rating: 'Hold' },
    { symbol: 'PG', name: 'Procter & Gamble', price: 168.20, change: 1.50, changePercent: 0.90, marketCap: '396B', pe: 26.1, sector: 'Consumer Defensive', rating: 'Hold' },
    { symbol: 'MA', name: 'Mastercard Inc', price: 468.50, change: 6.80, changePercent: 1.47, marketCap: '435B', pe: 34.8, sector: 'Financial', rating: 'Buy' },
    { symbol: 'HD', name: 'Home Depot Inc', price: 345.20, change: 4.10, changePercent: 1.20, marketCap: '343B', pe: 23.5, sector: 'Consumer Cyclical', rating: 'Buy' },
    { symbol: 'CVX', name: 'Chevron Corporation', price: 162.80, change: 2.30, changePercent: 1.43, marketCap: '301B', pe: 14.1, sector: 'Energy', rating: 'Hold' },
    { symbol: 'ABBV', name: 'AbbVie Inc', price: 171.30, change: 2.90, changePercent: 1.72, marketCap: '302B', pe: 18.3, sector: 'Healthcare', rating: 'Buy' },
    { symbol: 'KO', name: 'Coca-Cola Company', price: 62.40, change: 0.50, changePercent: 0.81, marketCap: '269B', pe: 24.5, sector: 'Consumer Defensive', rating: 'Hold' },
    { symbol: 'MRK', name: 'Merck & Co', price: 128.50, change: 1.80, changePercent: 1.42, marketCap: '325B', pe: 19.8, sector: 'Healthcare', rating: 'Buy' },
    { symbol: 'AVGO', name: 'Broadcom Inc', price: 1340.50, change: 32.80, changePercent: 2.51, marketCap: '621B', pe: 52.3, sector: 'Technology', rating: 'Buy' },
    { symbol: 'PEP', name: 'PepsiCo Inc', price: 172.60, change: 1.20, changePercent: 0.70, marketCap: '237B', pe: 22.1, sector: 'Consumer Defensive', rating: 'Hold' },
    { symbol: 'ADBE', name: 'Adobe Inc', price: 555.30, change: 12.40, changePercent: 2.28, marketCap: '248B', pe: 42.5, sector: 'Technology', rating: 'Buy' },
    { symbol: 'NFLX', name: 'Netflix Inc', price: 628.40, change: 15.60, changePercent: 2.55, marketCap: '271B', pe: 38.7, sector: 'Communication', rating: 'Buy' },
    { symbol: 'CRM', name: 'Salesforce Inc', price: 272.80, change: 5.90, changePercent: 2.21, marketCap: '264B', pe: 45.2, sector: 'Technology', rating: 'Buy' },
    { symbol: 'INTC', name: 'Intel Corporation', price: 31.50, change: 0.80, changePercent: 2.60, marketCap: '133B', pe: null, sector: 'Technology', rating: 'Sell' },
    { symbol: 'DIS', name: 'Walt Disney Co', price: 112.40, change: 1.90, changePercent: 1.72, marketCap: '205B', pe: 72.1, sector: 'Communication', rating: 'Hold' },
    { symbol: 'BA', name: 'Boeing Company', price: 195.60, change: 3.80, changePercent: 1.98, marketCap: '118B', pe: null, sector: 'Industrials', rating: 'Hold' },
  ];
}

function getMockFastestGrowing(): StockPerformer[] {
  return [
    { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.30, change: 28.50, changePercent: 3.37, marketCap: '2.16T', pe: 68.5, sector: 'Technology', rating: 'Buy', revenueGrowth: 122.4, earningsGrowth: 581.3 },
    { symbol: 'SMCI', name: 'Super Micro Computer', price: 785.20, change: 15.30, changePercent: 1.99, marketCap: '45.8B', pe: 42.3, sector: 'Technology', rating: 'Hold', revenueGrowth: 103.5, earningsGrowth: 120.8 },
    { symbol: 'LLY', name: 'Eli Lilly & Co', price: 782.40, change: 18.60, changePercent: 2.44, marketCap: '742B', pe: 82.5, sector: 'Healthcare', rating: 'Hold', revenueGrowth: 28.6, earningsGrowth: 68.2 },
    { symbol: 'VST', name: 'Vistra Energy Corp', price: 82.50, change: 2.10, changePercent: 2.61, marketCap: '29.1B', pe: 22.1, sector: 'Energy', rating: 'Buy', revenueGrowth: 38.2, earningsGrowth: 156.4 },
    { symbol: 'AFRM', name: 'Affirm Holdings', price: 45.30, change: 1.80, changePercent: 4.14, marketCap: '14.1B', pe: null, sector: 'Financial', rating: 'Buy', revenueGrowth: 46.2, earningsGrowth: null },
    { symbol: 'MSTR', name: 'MicroStrategy Inc', price: 1625.40, change: 42.80, changePercent: 2.71, marketCap: '24.8B', pe: null, sector: 'Technology', rating: 'Sell', revenueGrowth: 22.1, earningsGrowth: null },
    { symbol: 'TSLA', name: 'Tesla Inc', price: 245.80, change: 8.40, changePercent: 3.54, marketCap: '782B', pe: 62.8, sector: 'Consumer Cyclical', rating: 'Hold', revenueGrowth: -3.2, earningsGrowth: -23.1 },
    { symbol: 'PLTR', name: 'Palantir Technologies', price: 24.80, change: 0.90, changePercent: 3.77, marketCap: '54.2B', pe: 215.5, sector: 'Technology', rating: 'Hold', revenueGrowth: 19.6, earningsGrowth: 132.4 },
    { symbol: 'CEG', name: 'Constellation Energy', price: 168.30, change: 3.20, changePercent: 1.94, marketCap: '52.8B', pe: 28.3, sector: 'Energy', rating: 'Buy', revenueGrowth: 18.4, earningsGrowth: 92.6 },
    { symbol: 'MRVL', name: 'Marvell Technology', price: 72.40, change: 2.10, changePercent: 2.99, marketCap: '62.5B', pe: null, sector: 'Technology', rating: 'Buy', revenueGrowth: -5.8, earningsGrowth: null },
    { symbol: 'ARM', name: 'ARM Holdings', price: 148.50, change: 4.20, changePercent: 2.91, marketCap: '152B', pe: 412.8, sector: 'Technology', rating: 'Hold', revenueGrowth: 21.3, earningsGrowth: 52.1 },
    { symbol: 'PANW', name: 'Palo Alto Networks', price: 312.60, change: 5.80, changePercent: 1.89, marketCap: '103B', pe: 52.8, sector: 'Technology', rating: 'Buy', revenueGrowth: 18.5, earningsGrowth: 42.3 },
    { symbol: 'CRWD', name: 'CrowdStrike Holdings', price: 342.80, change: 8.40, changePercent: 2.51, marketCap: '82.1B', pe: 612.5, sector: 'Technology', rating: 'Buy', revenueGrowth: 33.4, earningsGrowth: 108.2 },
    { symbol: 'MNDY', name: 'Monday.com', price: 268.40, change: 6.30, changePercent: 2.40, marketCap: '12.8B', pe: null, sector: 'Technology', rating: 'Buy', revenueGrowth: 32.1, earningsGrowth: null },
    { symbol: 'SQ', name: 'Block Inc', price: 78.50, change: 2.80, changePercent: 3.70, marketCap: '48.2B', pe: null, sector: 'Financial', rating: 'Hold', revenueGrowth: 14.8, earningsGrowth: null },
  ];
}

function getMockSearchResults(query: string): StockSearchResult[] {
  const allStocks: StockSearchResult[] = [
    { symbol: 'AAPL', name: 'Apple Inc', sector: 'Technology', marketCap: '3.01T', price: 195.20, change: 3.10, changePercent: 1.61, sparkline: [188, 190, 192, 189, 193, 195], rsi: 62, macdSignal: 'bullish', maSignal: 'bullish', aiSummary: 'Apple continues to show strong momentum with its Services segment driving growth. The stock is trading above key moving averages, suggesting a bullish trend.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', marketCap: '3.16T', price: 425.50, change: 9.30, changePercent: 2.23, sparkline: [410, 415, 418, 420, 422, 425], rsi: 58, macdSignal: 'bullish', maSignal: 'bullish', aiSummary: 'Microsoft Azure cloud revenue growth remains robust. AI integration across products positions the company well for continued expansion.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc', sector: 'Communication', marketCap: '2.17T', price: 175.80, change: 3.40, changePercent: 1.97, sparkline: [170, 172, 173, 174, 175, 176], rsi: 55, macdSignal: 'neutral', maSignal: 'bullish', aiSummary: 'Alphabet benefits from growing AI capabilities and strong advertising revenue. Cloud segment showing improving profitability.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', marketCap: '2.16T', price: 875.30, change: 28.50, changePercent: 3.37, sparkline: [830, 840, 850, 860, 870, 875], rsi: 72, macdSignal: 'bullish', maSignal: 'bullish', aiSummary: 'NVIDIA dominates the AI chip market with exceptional revenue growth. However, RSI suggests overbought conditions — exercise caution.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc', sector: 'Consumer Cyclical', marketCap: '1.93T', price: 185.60, change: 4.90, changePercent: 2.71, sparkline: [178, 180, 182, 183, 184, 186], rsi: 60, macdSignal: 'bullish', maSignal: 'bullish', aiSummary: 'Amazon Web Services growth reaccelerating. E-commerce margins improving with regionalization strategy.' },
  ];
  const q = query.toLowerCase();
  return allStocks.filter(
    s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  );
}

function getMockSectors(locale: string): SectorOverview[] {
  const sectorsEN: SectorOverview[] = [
    { name: 'Technology', nameLocal: 'Technology', avgChange: 2.45, stockCount: 12, topStock: 'NVDA', topStockChange: 3.37 },
    { name: 'Healthcare', nameLocal: 'Healthcare', avgChange: 1.32, stockCount: 6, topStock: 'LLY', topStockChange: 2.44 },
    { name: 'Financial', nameLocal: 'Financial', avgChange: 1.18, stockCount: 5, topStock: 'JPM', topStockChange: 1.43 },
    { name: 'Consumer Cyclical', nameLocal: 'Consumer Cyclical', avgChange: 1.85, stockCount: 4, topStock: 'TSLA', topStockChange: 3.54 },
    { name: 'Consumer Defensive', nameLocal: 'Consumer Defensive', avgChange: 0.72, stockCount: 4, topStock: 'COST', topStockChange: 1.42 },
    { name: 'Energy', nameLocal: 'Energy', avgChange: 0.95, stockCount: 3, topStock: 'XOM', topStockChange: 1.54 },
    { name: 'Communication', nameLocal: 'Communication', avgChange: 1.55, stockCount: 3, topStock: 'NFLX', topStockChange: 2.55 },
    { name: 'Industrials', nameLocal: 'Industrials', avgChange: -0.23, stockCount: 2, topStock: 'BA', topStockChange: 1.98 },
  ];
  if (locale === 'ar') {
    return sectorsEN.map(s => ({ ...s, nameLocal: { Technology: 'تكنولوجيا', Healthcare: 'رعاية صحية', Financial: 'مالي', 'Consumer Cyclical': 'استهلاكي دوري', 'Consumer Defensive': 'استهلاكي دفاعي', Energy: 'طاقة', Communication: 'اتصالات', Industrials: 'صناعي' }[s.name] || s.name }));
  }
  if (locale === 'fr') {
    return sectorsEN.map(s => ({ ...s, nameLocal: { Technology: 'Technologie', Healthcare: 'Santé', Financial: 'Finance', 'Consumer Cyclical': 'Consommation Cyclique', 'Consumer Defensive': 'Consommation Défensive', Energy: 'Énergie', Communication: 'Communication', Industrials: 'Industrie' }[s.name] || s.name }));
  }
  return sectorsEN;
}

function getMockStockDetail(symbol: string): StockAnalysisDetail {
  const base: Record<string, Partial<StockAnalysisDetail>> = {
    AAPL: {
      name: 'Apple Inc', exchange: 'NASDAQ', sector: 'Technology',
      price: 195.20, change: 3.10, changePercent: 1.61,
      technical: { rsi: 62, macdSignal: 'bullish', bollingerUpper: 200, bollingerLower: 185, support: 188, resistance: 200, ma50: 190, ma200: 180 },
      fundamental: { pe: 31.2, eps: 6.25, marketCap: '3.01T', dividendYield: 0.55, roe: 156.3, roa: 28.5 },
      aiAnalysis: `## Apple Inc (AAPL) — AI Analysis\n\n**Current Sentiment: Bullish**\n\nApple continues to demonstrate resilience with its Services segment driving margin expansion. The iPhone 16 cycle is showing stronger adoption than expected in key markets.\n\n### Key Observations\n- Services revenue reached an all-time high of $24.2B, growing 14% YoY\n- Gross margin expansion to 46.8% driven by Services mix shift\n- Active installed base exceeds 2.2B devices globally\n\n### Technical Summary\nThe stock is trading above both 50-day and 200-day moving averages, confirming the bullish trend. RSI at 62 suggests room for further upside before overbought conditions.\n\n### Risk Factors\n- Regulatory pressure on App Store commissions in EU\n- China market competitive dynamics with Huawei resurgence\n- Consumer spending slowdown risk in inflationary environment\n\n### Outlook\nWe maintain a cautiously optimistic outlook. The expanding Services ecosystem and AI integration across products provide structural growth drivers. Near-term catalysts include the Vision Pro expansion and upcoming AI features.`,
    },
    NVDA: {
      name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology',
      price: 875.30, change: 28.50, changePercent: 3.37,
      technical: { rsi: 72, macdSignal: 'bullish', bollingerUpper: 920, bollingerLower: 780, support: 820, resistance: 950, ma50: 810, ma200: 680 },
      fundamental: { pe: 68.5, eps: 12.78, marketCap: '2.16T', dividendYield: 0.02, roe: 123.4, roa: 55.8 },
      aiAnalysis: `## NVIDIA Corporation (NVDA) — AI Analysis\n\n**Current Sentiment: Bullish with Caution**\n\nNVIDIA continues to dominate the AI accelerator market with unprecedented revenue growth. Data center revenue has become the primary growth engine.\n\n### Key Observations\n- Data center revenue grew 409% YoY to $22.1B\n- Blackwell architecture demand exceeds supply through 2025\n- Gross margins at 76.7% reflect pricing power in AI chips\n\n### Risk Factors\n- RSI at 72 indicates overbought conditions\n- Potential for competitive entry from AMD MI300X and custom silicon\n- Export restrictions to China may impact total addressable market\n\n### Outlook\nStrong secular tailwinds from AI infrastructure buildout, but valuation already prices in significant growth. Monitor for any demand normalization signals.`,
    },
  };

  const defaultDetail: StockAnalysisDetail = {
    symbol,
    name: symbol,
    exchange: 'NYSE',
    sector: 'Technology',
    price: 150.00,
    change: 2.50,
    changePercent: 1.70,
    candlestickData: Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const base = 145 + Math.random() * 10;
      const open = base;
      const close = base + (Math.random() - 0.45) * 5;
      const high = Math.max(open, close) + Math.random() * 3;
      const low = Math.min(open, close) - Math.random() * 3;
      return {
        date: d.toISOString().split('T')[0],
        open: +open.toFixed(2),
        high: +high.toFixed(2),
        low: +low.toFixed(2),
        close: +close.toFixed(2),
        volume: Math.floor(Math.random() * 5000000 + 1000000),
      };
    }),
    technical: { rsi: 55, macdSignal: 'neutral', bollingerUpper: 160, bollingerLower: 140, support: 142, resistance: 158, ma50: 148, ma200: 140 },
    fundamental: { pe: 25, eps: 6.00, marketCap: '500B', dividendYield: 1.5, roe: 22.0, roa: 10.5 },
    aiAnalysis: `## ${symbol} — AI Stock Analysis\n\n**Current Sentiment: Neutral**\n\nComprehensive AI-generated analysis for ${symbol}. This analysis considers technical indicators, fundamental metrics, and recent market developments.\n\n### Technical Summary\n- RSI indicates neutral momentum\n- MACD signal suggests consolidation phase\n- Price trading between support and resistance levels\n\n### Fundamental Overview\n- P/E ratio is in line with sector average\n- Revenue growth remains stable\n- Balance sheet shows moderate leverage\n\n### Outlook\nMaintain a balanced position. Monitor for breakout above resistance or breakdown below support for directional clarity.`,
    relatedNews: [],
  };

  const specific = base[symbol];
  if (specific) {
    return {
      ...defaultDetail,
      ...specific,
      candlestickData: defaultDetail.candlestickData.map(c => ({
        ...c,
        close: symbol === 'NVDA' ? c.close * 5.8 : c.close * 1.3,
        open: symbol === 'NVDA' ? c.open * 5.8 : c.open * 1.3,
        high: symbol === 'NVDA' ? c.high * 5.8 : c.high * 1.3,
        low: symbol === 'NVDA' ? c.low * 5.8 : c.low * 1.3,
      })),
    };
  }
  return defaultDetail;
}
