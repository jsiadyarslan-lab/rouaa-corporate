// ─── Arabic Markets Data Module ─────────────────────────────
// Provides Arabic market index data, attempting REAL data from
// Finnhub / financial APIs first, and falling back to realistic
// simulation only when no real source is available.
//
// Real Finnhub symbol mapping:
//   TASI  → SR:TASI   (Tadawul All Share Index)
//   DFM   → DU:DFMGI  (Dubai Financial Market General Index)
//   ADX   → ABU:FTAD  (Abu Dhabi FTSE Index)
//   EGX30 → EGX:EGX30 (Egypt EGX 30 Index)
//   KSE   → KU:KSE    (Kuwait Stock Exchange Index)

import type { IndicatorUpdate } from './financial-apis';
import { getQuote, getHistoricalData } from './financial-apis';

// ─── Arabic Market Index Definitions ────────────────────────

export interface ArabicMarketIndex {
  symbol: string;
  name: string;
  nameAr: string;
  category: string;
  region: string;
  /** Current realistic base value range [min, max] */
  valueRange: [number, number];
  /** Current base value (used as fallback when no real data) */
  baseValue: number;
  /** Typical daily change percent range */
  dailyChangeRange: [number, number];
  /** Country code */
  country: string;
  /** Currency */
  currency: string;
  /** Finnhub / API symbol for fetching real data */
  apiSymbol: string;
}

export const ARABIC_MARKET_INDICES: ArabicMarketIndex[] = [
  {
    symbol: 'TASI',
    name: 'Tadawul All Share Index',
    nameAr: 'مؤشر تداول للأسهم',
    category: 'index',
    region: 'arabic',
    valueRange: [11000, 13000],
    baseValue: 12200,
    dailyChangeRange: [-1.2, 1.2],
    country: 'SA',
    currency: 'SAR',
    apiSymbol: 'SR:TASI',
  },
  {
    symbol: 'DFM',
    name: 'Dubai Financial Market Index',
    nameAr: 'مؤشر سوق دبي المالي',
    category: 'index',
    region: 'arabic',
    valueRange: [3800, 4500],
    baseValue: 4150,
    dailyChangeRange: [-1.5, 1.5],
    country: 'AE',
    currency: 'AED',
    apiSymbol: 'DU:DFMGI',
  },
  {
    symbol: 'ADX',
    name: 'Abu Dhabi Securities Exchange Index',
    nameAr: 'مؤشر سوق أبوظبي للأوراق المالية',
    category: 'index',
    region: 'arabic',
    valueRange: [9000, 10000],
    baseValue: 9500,
    dailyChangeRange: [-1.0, 1.0],
    country: 'AE',
    currency: 'AED',
    apiSymbol: 'ABU:FTAD',
  },
  {
    symbol: 'EGX30',
    name: 'EGX 30 Index',
    nameAr: 'مؤشر البورصة المصرية 30',
    category: 'index',
    region: 'arabic',
    valueRange: [25000, 30000],
    baseValue: 27500,
    dailyChangeRange: [-1.8, 1.8],
    country: 'EG',
    currency: 'EGP',
    apiSymbol: 'EGX:EGX30',
  },
  {
    symbol: 'KSE',
    name: 'Kuwait Stock Exchange Index',
    nameAr: 'مؤشر بورصة الكويت',
    category: 'index',
    region: 'arabic',
    valueRange: [6500, 8000],
    baseValue: 7300,
    dailyChangeRange: [-1.0, 1.0],
    country: 'KW',
    currency: 'KWD',
    apiSymbol: 'KU:KSE',
  },
];

// ─── Persistent state for realistic simulation fallback ──────
// We store the last known value for each index so that
// consecutive updates produce smooth, realistic price movements.

const lastValues: Record<string, number> = {};

function getLastValue(symbol: string, baseValue: number): number {
  if (lastValues[symbol] !== undefined) {
    return lastValues[symbol];
  }
  // Initialize with base value + small random offset
  const offset = (Math.random() - 0.5) * baseValue * 0.02;
  lastValues[symbol] = baseValue + offset;
  return lastValues[symbol];
}

// ─── Seeded pseudo-random number generator ──────────────────
// Produces consistent daily values based on the date seed.
// Only used for simulation fallback.

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDaySeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

// ─── Generate realistic daily change (simulation only) ──────

function generateDailyChange(index: ArabicMarketIndex): number {
  const [minPct, maxPct] = index.dailyChangeRange;
  const daySeed = getDaySeed();
  const symbolSeed = index.symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const random = seededRandom(daySeed + symbolSeed);

  // Map [0,1] to [minPct, maxPct] with slight negative bias (realistic market tendency)
  const bias = -0.05; // Slight negative bias for realism
  const pct = minPct + (maxPct - minPct) * random + bias;
  return pct;
}

// ─── Public Functions ───────────────────────────────────────

/**
 * Get current Arabic market data for all indices.
 *
 * Attempts to fetch REAL data from Finnhub / financial APIs first.
 * Falls back to realistic simulation when no real source is available,
 * and marks the data with `isSimulated: true`.
 *
 * This function is async because it makes API calls.
 */
export async function getArabicMarketData(): Promise<IndicatorUpdate[]> {
  const updates: IndicatorUpdate[] = [];

  for (const index of ARABIC_MARKET_INDICES) {
    try {
      // ── Step 1: Try real quote from Finnhub / financial APIs ──
      const realQuote = await getQuote(index.apiSymbol);

      if (realQuote && realQuote.price > 0) {
        // We got real data! Try to also get real historical data.
        let history: { date: string; value: number }[] = [];
        try {
          const histData = await getHistoricalData(index.apiSymbol, 30);
          if (histData.length > 0) {
            history = histData.map(p => ({ date: p.date, value: p.close }));
          }
        } catch (histErr: any) {
          console.warn(`[ArabicMarkets] History fetch failed for ${index.apiSymbol}:`, histErr.message?.slice(0, 80));
        }

        // If no real history, generate simulated history but mark it
        const isHistorySimulated = history.length === 0;
        if (isHistorySimulated) {
          history = generateHistory(index, 30);
        }

        updates.push({
          symbol: index.symbol,
          value: Math.round(realQuote.price * 100) / 100,
          change: Math.round(realQuote.change * 100) / 100,
          changePercent: Math.round(realQuote.changePercent * 100) / 100,
          history,
          isSimulated: isHistorySimulated ? true : undefined, // only flag if history is simulated
        });

        console.log(
          `[ArabicMarkets] REAL data for ${index.symbol} (${index.apiSymbol}): price=${realQuote.price}, change=${realQuote.changePercent}%${isHistorySimulated ? ' (history simulated)' : ''}`
        );
        continue; // Move to next index
      }
    } catch (quoteErr: any) {
      console.warn(`[ArabicMarkets] Real quote failed for ${index.apiSymbol}:`, quoteErr.message?.slice(0, 80));
    }

    // ── Step 2: Fallback to simulation ──
    const lastValue = getLastValue(index.symbol, index.baseValue);
    const changePercent = generateDailyChange(index);
    const change = lastValue * (changePercent / 100);
    const newValue = Math.max(
      index.valueRange[0],
      Math.min(index.valueRange[1], lastValue + change)
    );

    // Update persisted value
    lastValues[index.symbol] = newValue;

    // Generate 30-day history with realistic movements
    const history = generateHistory(index, 30);

    updates.push({
      symbol: index.symbol,
      value: Math.round(newValue * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      history,
      isSimulated: true,
    });

    console.log(
      `[ArabicMarkets] SIMULATED data for ${index.symbol}: value=${newValue.toFixed(2)}, change=${changePercent.toFixed(2)}%`
    );
  }

  return updates;
}

/**
 * Generate realistic price history for an Arabic market index.
 * Uses a random walk with mean reversion to stay within known ranges.
 * This is SIMULATION ONLY — used as fallback when no real data is available.
 */
function generateHistory(index: ArabicMarketIndex, days: number): { date: string; value: number }[] {
  const history: { date: string; value: number }[] = [];
  const [minVal, maxVal] = index.valueRange;
  const midVal = (minVal + maxVal) / 2;

  // Start from a value slightly different from current
  let value = midVal + (Math.random() - 0.5) * (maxVal - minVal) * 0.3;

  for (let i = days; i >= 1; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Random walk with mean reversion
    const daySeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate() + index.symbol.charCodeAt(0);
    const random = seededRandom(daySeed);
    const dailyReturn = (random - 0.48) * 0.015; // Slight positive bias

    // Mean reversion factor — pull towards middle of range
    const reversionStrength = 0.02;
    const reversion = (midVal - value) * reversionStrength;

    value = value * (1 + dailyReturn) + reversion;
    // Clamp to range
    value = Math.max(minVal * 0.98, Math.min(maxVal * 1.02, value));

    history.push({
      date: dateStr,
      value: Math.round(value * 100) / 100,
    });
  }

  return history;
}

/**
 * Get seed data for Arabic market indicators.
 * Used when seeding the database for the first time.
 * This is always simulated — it's only for initial seed.
 */
export function getArabicMarketSeedData(): Array<{
  name: string;
  nameAr: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  category: string;
  region: string;
}> {
  return ARABIC_MARKET_INDICES.map(index => {
    const changePct = generateDailyChange(index);
    const value = index.baseValue + (Math.random() - 0.5) * index.baseValue * 0.02;
    const change = value * (changePct / 100);

    return {
      name: index.name,
      nameAr: index.nameAr,
      symbol: index.symbol,
      value: Math.round(value * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePct * 100) / 100,
      category: index.category,
      region: index.region,
    };
  });
}

/**
 * Get the list of Arabic market index symbols.
 */
export function getArabicSymbols(): string[] {
  return ARABIC_MARKET_INDICES.map(i => i.symbol);
}

/**
 * Check if a symbol is an Arabic market index.
 */
export function isArabicSymbol(symbol: string): boolean {
  return ARABIC_MARKET_INDICES.some(i => i.symbol === symbol);
}
