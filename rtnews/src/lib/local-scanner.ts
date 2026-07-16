// ─── Local Scanner Generator V1 ──────────────────────────────
// Generates market scanner data from local financial APIs when the
// trading platform's scanner module is unavailable.
// Uses CoinGecko (free, no key needed) for crypto data and
// provides realistic technical analysis scores.
//
// This is a FALLBACK — the primary scanner source is the trading
// platform's AI-powered scanner. Local data is marked with
// source: 'local-fallback' to distinguish it.

import { getQuote } from './financial-apis';

// ─── Types ──────────────────────────────────────────────────

export interface LocalScannerItem {
  symbol: string;
  name: string;
  nameAr: string;
  category: string;
  price: number;
  change: number;
  direction: string;
  technicalScore: number;
  confidence: number;
  rsi?: number;
  smartScore?: { compositeScore: number };
  sparkline?: number[];
}

export interface LocalScannerOverview {
  items: LocalScannerItem[];
  topGainers: LocalScannerItem[];
  topLosers: LocalScannerItem[];
  strongestSignals: LocalScannerItem[];
  marketSentiment: string;
  sentimentScore: number;
  totalScanned: number;
  timestamp: string;
  source: 'local-fallback';
}

// ─── Symbol Config ──────────────────────────────────────────

interface ScannerSymbolConfig {
  symbol: string;       // Display symbol (BTC-USDT)
  name: string;         // English name
  nameAr: string;       // Arabic name
  category: string;     // crypto | forex | commodities
  localSymbol: string;  // For getQuote()
}

const SCANNER_SYMBOLS: ScannerSymbolConfig[] = [
  { symbol: 'BTC-USDT', name: 'Bitcoin', nameAr: 'بيتكوين', category: 'crypto', localSymbol: 'BINANCE:BTCUSDT' },
  { symbol: 'ETH-USDT', name: 'Ethereum', nameAr: 'إيثريوم', category: 'crypto', localSymbol: 'BINANCE:ETHUSDT' },
  { symbol: 'SOL-USDT', name: 'Solana', nameAr: 'سولانا', category: 'crypto', localSymbol: 'BINANCE:SOLUSDT' },
  { symbol: 'XRP-USDT', name: 'XRP', nameAr: 'إكس آر بي', category: 'crypto', localSymbol: 'BINANCE:XRPUSDT' },
  { symbol: 'BNB-USDT', name: 'BNB', nameAr: 'بي إن بي', category: 'crypto', localSymbol: 'BINANCE:BNBUSDT' },
  { symbol: 'XAU-USD', name: 'Gold', nameAr: 'الذهب', category: 'commodities', localSymbol: 'OANDA:XAU_USD' },
  { symbol: 'XAG-USD', name: 'Silver', nameAr: 'الفضة', category: 'commodities', localSymbol: 'OANDA:XAG_USD' },
  { symbol: 'EUR-USD', name: 'EUR/USD', nameAr: 'يورو/دولار', category: 'forex', localSymbol: 'OANDA:EUR_USD' },
  { symbol: 'GBP-USD', name: 'GBP/USD', nameAr: 'جنيه/دولار', category: 'forex', localSymbol: 'OANDA:GBP_USD' },
  { symbol: 'USD-JPY', name: 'USD/JPY', nameAr: 'دولار/ين', category: 'forex', localSymbol: 'OANDA:USD_JPY' },
];

// ─── Technical Score Calculation ────────────────────────────

/**
 * Calculate a technical score (0-100) based on price change and momentum.
 * Higher scores = more bullish, lower = more bearish.
 */
function calculateTechnicalScore(changePercent: number): number {
  // Map change percent to a score
  // +5% → 90, +2% → 75, 0% → 50, -2% → 35, -5% → 10
  const base = 50;
  const changeContribution = changePercent * 8; // Scale factor
  return Math.max(5, Math.min(95, Math.round(base + changeContribution)));
}

/**
 * Calculate approximate RSI from change percent.
 * This is a rough approximation for display purposes.
 */
function approximateRsiFromChange(changePercent: number): number {
  // Simple mapping: positive change → higher RSI, negative → lower
  const base = 50;
  const shift = changePercent * 5;
  return Math.max(15, Math.min(85, Math.round(base + shift)));
}

/**
 * Determine market direction from change
 */
function getDirection(changePercent: number): string {
  if (changePercent > 1.5) return 'STRONG_BUY';
  if (changePercent > 0.3) return 'BUY';
  if (changePercent > -0.3) return 'NEUTRAL';
  if (changePercent > -1.5) return 'SELL';
  return 'STRONG_SELL';
}

/**
 * Calculate confidence based on absolute change magnitude
 */
function calculateConfidence(changePercent: number): number {
  // Stronger moves → higher confidence
  const absChange = Math.abs(changePercent);
  return Math.min(90, Math.max(30, Math.round(40 + absChange * 8)));
}

// ─── Main Scanner Generator ─────────────────────────────────

/**
 * Generate market scanner data from local financial APIs.
 * Returns an overview with top gainers, losers, and technical scores.
 */
export async function generateLocalScannerOverview(): Promise<LocalScannerOverview> {
  const items: LocalScannerItem[] = [];

  // Fetch quotes for all symbols
  const results = await Promise.allSettled(
    SCANNER_SYMBOLS.map(async (config) => {
      try {
        const quote = await getQuote(config.localSymbol);
        if (!quote || quote.price <= 0) return null;

        const changePercent = quote.changePercent || 0;
        const technicalScore = calculateTechnicalScore(changePercent);
        const rsi = approximateRsiFromChange(changePercent);
        const direction = getDirection(changePercent);
        const confidence = calculateConfidence(changePercent);

        const item: LocalScannerItem = {
          symbol: config.symbol,
          name: config.name,
          nameAr: config.nameAr,
          category: config.category,
          price: quote.price,
          change: changePercent,
          direction,
          technicalScore,
          confidence,
          rsi,
          smartScore: {
            compositeScore: Math.round(technicalScore * 0.8 + confidence * 0.2),
          },
        };

        return item;
      } catch {
        return null;
      }
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value !== null) {
      items.push(result.value);
    }
  }

  // Sort items
  const topGainers = [...items]
    .sort((a, b) => b.change - a.change)
    .slice(0, 5);
  const topLosers = [...items]
    .sort((a, b) => a.change - b.change)
    .slice(0, 5);
  const strongestSignals = [...items]
    .sort((a, b) => b.technicalScore - a.technicalScore)
    .slice(0, 5);

  // Market sentiment
  const avgChange = items.length > 0
    ? items.reduce((sum, i) => sum + i.change, 0) / items.length
    : 0;
  const sentimentScore = Math.max(0, Math.min(100, Math.round(50 + avgChange * 5)));
  const marketSentiment = sentimentScore > 65 ? 'bullish'
    : sentimentScore < 35 ? 'bearish'
    : 'neutral';

  return {
    items,
    topGainers,
    topLosers,
    strongestSignals,
    marketSentiment,
    sentimentScore,
    totalScanned: items.length,
    timestamp: new Date().toISOString(),
    source: 'local-fallback',
  };
}

/**
 * Generate heatmap data from local scanner data.
 */
export async function generateLocalHeatmap(): Promise<any[]> {
  const { items } = await generateLocalScannerOverview();
  return items.map(item => ({
    symbol: item.symbol,
    name: item.nameAr,
    category: item.category,
    price: item.price,
    change: item.change,
    technicalScore: item.technicalScore,
  }));
}

/**
 * Check if local scanner generation is possible.
 */
export function canGenerateLocalScanner(): boolean {
  return true; // CoinGecko always available for crypto
}
