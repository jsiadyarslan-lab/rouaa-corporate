// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════

// ─── Signal Price Monitor V1 ──────────────────────────────────
// Automatically monitors active trading signals and updates their
// status when price hits Take Profit (HIT_TP) or Stop Loss (HIT_SL).
//
// Flow:
//   1. Fetch all ACTIVE signals from DB
//   2. Group by pair to minimize API calls
//   3. Fetch current price for each unique pair
//   4. Compare current price against TP/SL for each signal
//   5. Update DB: HIT_TP / HIT_SL / EXECUTED + profit metrics
//   6. Return monitoring report
//
// Called by: /api/signals/monitor (cron every 5 minutes)

import { getQuote } from './financial-apis';
import { db } from './db';

// ─── Types ──────────────────────────────────────────────────

export interface MonitorResult {
  checked: number;
  hitTP: number;
  hitSL: number;
  expired: number;
  errors: number;
  details: Array<{
    signalId: string;
    pair: string;
    action: string;
    oldStatus: string;
    newStatus: string;
    currentPrice: number;
    tp: number | null;
    sl: number | null;
    profitPips: number | null;
    profitPercent: number | null;
  }>;
  timestamp: string;
}

// ─── Symbol Mapping ──────────────────────────────────────────
// Maps pair formats stored in DB to API-compatible symbols
// e.g., "BTC/USDT" → "BINANCE:BTCUSDT" for Finnhub

const PAIR_TO_API_SYMBOL: Record<string, string> = {
  'BTC/USDT': 'BINANCE:BTCUSDT',
  'BTC/USD': 'BINANCE:BTCUSDT',
  'ETH/USDT': 'BINANCE:ETHUSDT',
  'ETH/USD': 'BINANCE:ETHUSDT',
  'SOL/USDT': 'BINANCE:SOLUSDT',
  'SOL/USD': 'BINANCE:SOLUSDT',
  'XRP/USDT': 'BINANCE:XRPUSDT',
  'BNB/USDT': 'BINANCE:BNBUSDT',
  'DOGE/USDT': 'BINANCE:DOGEUSDT',
  'ADA/USDT': 'BINANCE:ADAUSDT',
  'XAU/USD': 'OANDA:XAU_USD',
  'XAG/USD': 'OANDA:XAG_USD',
  'WTI/USD': 'OANDA:WTI_USD',
  'EUR/USD': 'OANDA:EUR_USD',
  'GBP/USD': 'OANDA:GBP_USD',
  'USD/JPY': 'OANDA:USD_JPY',
  'EUR/GBP': 'OANDA:EUR_GBP',
  'AUD/USD': 'OANDA:AUD_USD',
  'NZD/USD': 'OANDA:NZD_USD',
  'USD/CHF': 'OANDA:USD_CHF',
  'USD/CAD': 'OANDA:USD_CAD',
  'SPX/USD': 'SPX',
  'NDX/USD': 'NDX',
  'DJI/USD': 'DJI',
};

function getApiSymbol(pair: string): string {
  // Direct lookup first
  if (PAIR_TO_API_SYMBOL[pair]) return PAIR_TO_API_SYMBOL[pair];

  // Auto-detect: BTC/USDT → BINANCE:BTCUSDT
  const cryptoMatch = pair.match(/^([A-Z]{2,5})\/USDT?$/);
  if (cryptoMatch) return `BINANCE:${cryptoMatch[1]}USDT`;

  // Auto-detect: XAU/USD → OANDA:XAU_USD
  const forexMatch = pair.match(/^([A-Z]{3})\/([A-Z]{3})$/);
  if (forexMatch) return `OANDA:${forexMatch[1]}_${forexMatch[2]}`;

  // Fallback: use pair as-is
  return pair;
}

// ─── Pip Calculation ──────────────────────────────────────────

function getPairCategory(pair: string): 'crypto' | 'forex' | 'commodities' | 'stocks' | 'indices' {
  if (/BTC|ETH|SOL|XRP|BNB|DOGE|ADA|DOT|AVAX|MATIC/i.test(pair)) return 'crypto';
  if (/XAU|XAG|WTI|OIL|GOLD|SILVER/i.test(pair)) return 'commodities';
  if (/SPX|NDX|DJI|FTSE|NKY/i.test(pair)) return 'indices';
  if (pair.includes('/')) return 'forex';
  return 'stocks';
}

function calculatePipValue(pair: string): number {
  const category = getPairCategory(pair);
  switch (category) {
    case 'forex':
      if (/JPY/i.test(pair)) return 0.01;
      return 0.0001;
    case 'crypto':
      return 0.01; // For BTC, 1 pip = $0.01
    case 'commodities':
      if (/XAG/i.test(pair)) return 0.001;
      return 0.01; // Gold pips
    default:
      return 0.01;
  }
}

function calculateProfitPips(
  action: string,
  entryPrice: number,
  closePrice: number,
  pair: string
): number {
  const pipValue = calculatePipValue(pair);
  const priceDiff = action === 'BUY'
    ? closePrice - entryPrice
    : entryPrice - closePrice;
  return parseFloat((priceDiff / pipValue).toFixed(1));
}

function calculateProfitPercent(
  action: string,
  entryPrice: number,
  closePrice: number
): number {
  if (entryPrice <= 0) return 0;
  const priceDiff = action === 'BUY'
    ? closePrice - entryPrice
    : entryPrice - closePrice;
  return parseFloat(((priceDiff / entryPrice) * 100).toFixed(2));
}

// ─── Core Monitor Function ──────────────────────────────────

export async function monitorActiveSignals(): Promise<MonitorResult> {
  const result: MonitorResult = {
    checked: 0,
    hitTP: 0,
    hitSL: 0,
    expired: 0,
    errors: 0,
    details: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Fetch all ACTIVE signals with TP/SL
    const activeSignals = await db.tradingSignal.findMany({
      where: {
        status: 'ACTIVE',
        entryPrice: { not: null },
        // Must have at least TP or SL to monitor
        OR: [
          { takeProfit: { not: null } },
          { stopLoss: { not: null } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeSignals.length === 0) {
      console.log('[SignalMonitor] No active signals with TP/SL to monitor');
      return result;
    }

    console.log(`[SignalMonitor] Checking ${activeSignals.length} active signals...`);

    // 2. Group by unique pair to minimize API calls
    const pairPrices = new Map<string, number | null>();

    const uniquePairs = [...new Set(activeSignals.map(s => s.pair))];
    console.log(`[SignalMonitor] Fetching prices for ${uniquePairs.length} unique pairs...`);

    // Fetch prices in parallel (max 6 concurrent to avoid rate limits)
    const pricePromises = uniquePairs.map(async (pair) => {
      const apiSymbol = getApiSymbol(pair);
      try {
        const quote = await getQuote(apiSymbol);
        const price = quote?.price ?? null;
        pairPrices.set(pair, price);
        if (price) {
          console.log(`[SignalMonitor] ${pair} (${apiSymbol}): $${price}`);
        } else {
          console.warn(`[SignalMonitor] No price for ${pair} (${apiSymbol})`);
        }
      } catch (err: any) {
        console.warn(`[SignalMonitor] Price error for ${pair}: ${err?.message?.slice(0, 80)}`);
        pairPrices.set(pair, null);
      }
    });

    // Process in batches of 6 to respect rate limits
    for (let i = 0; i < pricePromises.length; i += 6) {
      await Promise.allSettled(pricePromises.slice(i, i + 6));
    }

    // 3. Check each signal against current price
    for (const signal of activeSignals) {
      const currentPrice = pairPrices.get(signal.pair);
      if (!currentPrice || currentPrice <= 0) {
        result.errors++;
        continue;
      }

      result.checked++;

      const entryPrice = signal.entryPrice!;
      const tp = signal.takeProfit;
      const sl = signal.stopLoss;
      const action = signal.action;

      let newStatus: string | null = null;
      let closePrice = currentPrice;

      // Check if price hit TP or SL
      if (action === 'BUY') {
        // BUY signal: profit when price goes UP
        if (tp && currentPrice >= tp) {
          newStatus = 'HIT_TP';
          closePrice = tp; // Use TP as close price for accurate profit calc
        } else if (sl && currentPrice <= sl) {
          newStatus = 'HIT_SL';
          closePrice = sl; // Use SL as close price for accurate profit calc
        }
      } else if (action === 'SELL') {
        // SELL signal: profit when price goes DOWN
        if (tp && currentPrice <= tp) {
          newStatus = 'HIT_TP';
          closePrice = tp;
        } else if (sl && currentPrice >= sl) {
          newStatus = 'HIT_SL';
          closePrice = sl;
        }
      }

      // 4. Update signal in DB if status changed
      if (newStatus) {
        const profitPips = calculateProfitPips(action, entryPrice, closePrice, signal.pair);
        const profitPercent = calculateProfitPercent(action, entryPrice, closePrice);
        const isWin = newStatus === 'HIT_TP';

        try {
          await db.tradingSignal.update({
            where: { id: signal.id },
            data: {
              status: newStatus,
              closePrice,
              closedAt: new Date(),
              profitPips,
              profitPercent,
              isWin,
              updatedAt: new Date(),
            },
          });

          if (newStatus === 'HIT_TP') result.hitTP++;
          if (newStatus === 'HIT_SL') result.hitSL++;

          result.details.push({
            signalId: signal.id,
            pair: signal.pair,
            action,
            oldStatus: 'ACTIVE',
            newStatus,
            currentPrice,
            tp,
            sl,
            profitPips,
            profitPercent,
          });

          const emoji = isWin ? '✅' : '❌';
          console.log(`[SignalMonitor] ${emoji} ${signal.pair} ${action}: ${newStatus} @ ${closePrice} | P/L: ${profitPercent}% (${profitPips} pips)`);
        } catch (err: any) {
          console.error(`[SignalMonitor] DB update error for ${signal.id}: ${err?.message?.slice(0, 80)}`);
          result.errors++;
        }
      }
    }

    // 5. Also auto-expire signals past their expiresAt
    try {
      const expireResult = await db.tradingSignal.updateMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { not: null, lte: new Date() },
        },
        data: {
          status: 'EXPIRED',
          closedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      result.expired = expireResult.count;
      if (result.expired > 0) {
        console.log(`[SignalMonitor] ⏰ Expired ${result.expired} old signals`);
      }
    } catch (err: any) {
      console.error(`[SignalMonitor] Expire error: ${err?.message?.slice(0, 80)}`);
    }

    console.log(`[SignalMonitor] Done: ${result.checked} checked, ${result.hitTP} hit TP ✅, ${result.hitSL} hit SL ❌, ${result.expired} expired ⏰, ${result.errors} errors`);

    return result;
  } catch (err: any) {
    console.error(`[SignalMonitor] Fatal error: ${err?.message}`);
    result.errors++;
    return result;
  }
}

// ─── Admin: Force Close Signal ──────────────────────────────

export async function forceCloseSignal(
  signalId: string,
  newStatus: 'HIT_TP' | 'HIT_SL' | 'EXECUTED' | 'CANCELLED',
  closePrice?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const signal = await db.tradingSignal.findUnique({ where: { id: signalId } });
    if (!signal) return { success: false, error: 'الإشارة غير موجودة' };
    if (signal.status !== 'ACTIVE') return { success: false, error: 'الإشارة ليست نشطة' };

    const finalClosePrice = closePrice ?? signal.entryPrice ?? 0;
    const isWin = newStatus === 'HIT_TP';
    let profitPips: number | null = null;
    let profitPercent: number | null = null;

    if (signal.entryPrice && finalClosePrice) {
      profitPips = calculateProfitPips(signal.action, signal.entryPrice, finalClosePrice, signal.pair);
      profitPercent = calculateProfitPercent(signal.action, signal.entryPrice, finalClosePrice);
    }

    await db.tradingSignal.update({
      where: { id: signalId },
      data: {
        status: newStatus,
        closePrice: finalClosePrice,
        closedAt: new Date(),
        profitPips,
        profitPercent,
        isWin: newStatus === 'EXECUTED' ? null : isWin,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
