// ─── Integration: Server-Sent Events (SSE) Stream V4 ────────
// Provides real-time market data updates to the news site frontend.
// Uses SSE instead of WebSocket for simpler Next.js App Router compatibility.
//
// V4: Fixed SSE stream to ALWAYS fetch fresh data every cycle.
//     - Removed cache-fresh bypass that caused stale data
//     - Cache is only used as last-resort fallback when all fetches fail
//     - Better fallback chain: Trading Platform → Finnhub → Alpha Vantage → Stale Cache
//     - Signals feed uses local signal generator as fallback
//     - Sparklines feed uses Finnhub hourly candles as additional fallback
//
// Usage: EventSource('/api/integration/stream?feeds=quotes,signals,sparklines,notifications')
//
// Available feeds:
//   quotes       — Live price updates (every 15 seconds)
//   signals      — New signal notifications (every 30 seconds)
//   sparklines   — Updated sparkline data (every 60 seconds)
//   notifications — Push notifications from trading platform (every 5 seconds)

import { NextRequest } from 'next/server';
import { fetchFromTradingPlatform, isCircuitClosed } from '@/lib/integration-auth';
import { getSyncCache, CacheKeys, CacheTTL } from '@/lib/integration-cache';
import { getQuote, getHistoricalData, getFinnhubCandleData } from '@/lib/financial-apis';
import { generateLocalSignals, canGenerateLocalSignals } from '@/lib/local-signals';

export const dynamic = 'force-dynamic';

// Maximum connection time: 5 minutes (then client reconnects)
const MAX_CONNECTION_MS = 5 * 60 * 1000;

// Track last notification ID to avoid resending
let lastNotificationId = '';

// Symbols for batch quotes
const QUOTE_SYMBOLS = [
  { tp: 'BTC-USDT', local: 'BINANCE:BTCUSDT' },
  { tp: 'ETH-USDT', local: 'BINANCE:ETHUSDT' },
  { tp: 'XAU-USD', local: 'OANDA:XAU_USD' },
  { tp: 'XAG-USD', local: 'OANDA:XAG_USD' },
  { tp: 'EUR-USD', local: 'OANDA:EUR_USD' },
  { tp: 'GBP-USD', local: 'OANDA:GBP_USD' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const feedsParam = searchParams.get('feeds') || 'quotes,signals,sparklines';
  const feeds = feedsParam.split(',').map(f => f.trim()).filter(Boolean);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function sendEvent(event: string, data: any) {
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Stream may have been closed
        }
      }

      function sendHeartbeat() {
        sendEvent('heartbeat', { ts: Date.now() });
      }

      // Send initial connection event
      sendEvent('connected', {
        feeds,
        circuitBreakerOpen: !isCircuitClosed(),
        timestamp: new Date().toISOString(),
      });

      // Track intervals for cleanup
      const intervals: NodeJS.Timeout[] = [];

      // ── Quotes Feed (every 15 seconds) ──
      if (feeds.includes('quotes')) {
        const fetchQuotes = async () => {
          try {
            const cache = getSyncCache();
            const cacheKey = CacheKeys.quotes();

            // Always attempt to fetch fresh data (V4 fix: no cache-fresh bypass)
            const quotes: Record<string, any> = {};
            let tpFetchCount = 0;
            let localFetchCount = 0;

            // Try trading platform first
            if (isCircuitClosed()) {
              const tpResults = await Promise.allSettled(
                QUOTE_SYMBOLS.map(async (sym) => {
                  try {
                    const response = await fetchFromTradingPlatform(
                      `/api/integration/quote?symbol=${encodeURIComponent(sym.tp)}`
                    );
                    if (response.ok) {
                      const data = await response.json();
                      if (data.quote?.price || data.price) {
                        quotes[sym.tp] = data.quote || data;
                        return true;
                      }
                    }
                    return false;
                  } catch {
                    return false;
                  }
                })
              );
              tpFetchCount = tpResults.filter(r => r.status === 'fulfilled' && r.value).length;
            }

            // Fill missing with local APIs (Finnhub + Alpha Vantage)
            const missing = QUOTE_SYMBOLS.filter(sym => !quotes[sym.tp] || !quotes[sym.tp]?.price);
            if (missing.length > 0) {
              const localResults = await Promise.allSettled(
                missing.map(async (sym) => {
                  try {
                    const quote = await getQuote(sym.local);
                    if (quote && quote.price > 0) {
                      quotes[sym.tp] = {
                        price: quote.price,
                        change: quote.change,
                        changePercent: quote.changePercent,
                        high: quote.high,
                        low: quote.low,
                        source: 'fallback',
                      };
                      return true;
                    }
                    return false;
                  } catch {
                    return false;
                  }
                })
              );
              localFetchCount = localResults.filter(r => r.status === 'fulfilled' && r.value).length;
            }

            // Update cache and broadcast if we got any data
            if (Object.keys(quotes).length > 0) {
              const cacheData = { ...quotes, _updatedAt: Date.now() };
              await cache.set(cacheKey, cacheData, CacheTTL.BATCH_QUOTES);
              sendEvent('quotes', {
                quotes,
                source: tpFetchCount > 0 && localFetchCount === 0 ? 'trading-platform' :
                        tpFetchCount > 0 && localFetchCount > 0 ? 'mixed' : 'fallback',
                tpCount: tpFetchCount,
                localCount: localFetchCount,
              });
            } else {
              // No fresh data available, broadcast stale cache as last resort
              const cached = await cache.get(cacheKey);
              if (cached) {
                sendEvent('quotes', { quotes: cached, source: 'cache-stale' });
              }
            }
          } catch {}
        };
        intervals.push(setInterval(fetchQuotes, 15_000));
        fetchQuotes();
      }

      // ── Signals Feed (every 30 seconds) ──
      if (feeds.includes('signals')) {
        const fetchSignals = async () => {
          try {
            const cache = getSyncCache();
            const cacheKey = CacheKeys.signals('stats');

            // Try trading platform first
            if (isCircuitClosed()) {
              try {
                const response = await fetchFromTradingPlatform('/api/integration/signals/stats');
                if (response.ok) {
                  const data = await response.json();
                  if (data.total !== undefined) {
                    await cache.set(cacheKey, data, CacheTTL.SIGNALS);
                    sendEvent('signals', { stats: data, source: 'trading-platform' });
                    return;
                  }
                }
              } catch {
                // Will try fallback
              }
            }

            // Fallback: Use local signal generator
            if (canGenerateLocalSignals()) {
              try {
                const { stats } = await generateLocalSignals({ includeWait: false, limit: 10 });
                const data = { ...stats, source: 'local-fallback' };
                await cache.set(cacheKey, data, CacheTTL.SIGNALS);
                sendEvent('signals', { stats: data, source: 'local-fallback' });
                return;
              } catch {
                // Local generator failed
              }
            }

            // Last resort: try cached data
            const cached = await cache.get(cacheKey);
            if (cached) {
              sendEvent('signals', { stats: cached, source: 'cache' });
            }
          } catch {}
        };
        intervals.push(setInterval(fetchSignals, 30_000));
        fetchSignals();
      }

      // ── Sparklines Feed (every 60 seconds) ──
      if (feeds.includes('sparklines')) {
        const fetchSparklines = async () => {
          try {
            const cache = getSyncCache();
            const cacheKey = CacheKeys.sparklines();

            const sparklines: Record<string, number[]> = {};
            let tpFetchCount = 0;

            // Try trading platform first
            if (isCircuitClosed()) {
              const symbols = ['BTC-USDT', 'ETH-USDT', 'XAU-USD', 'XAG-USD', 'EUR-USD', 'GBP-USD'];
              const tpResults = await Promise.allSettled(
                symbols.map(async (sym) => {
                  try {
                    let response = await fetchFromTradingPlatform(
                      `/api/integration/chart?symbol=${encodeURIComponent(sym)}&interval=1hour&limit=13`
                    );
                    let candles: any[] = [];
                    if (response.ok) {
                      const data = await response.json();
                      candles = data.candles || [];
                    }

                    // Fallback to daily
                    if (candles.length < 2) {
                      response = await fetchFromTradingPlatform(
                        `/api/integration/chart?symbol=${encodeURIComponent(sym)}&interval=1day&limit=13`
                      );
                      if (response.ok) {
                        const data = await response.json();
                        candles = data.candles || [];
                      }
                    }

                    const values = candles
                      .map((c: any) => typeof c.close === 'number' ? c.close : 0)
                      .filter((v: number) => v > 0);

                    if (values.length >= 2) {
                      sparklines[sym] = values;
                      return true;
                    }
                    return false;
                  } catch {
                    return false;
                  }
                })
              );
              tpFetchCount = tpResults.filter(r => r.status === 'fulfilled' && r.value).length;
            }

            // Fallback 1: Use local APIs (Alpha Vantage daily + Finnhub daily)
            const missingSyms = Object.entries(sparklines).filter(([, v]) => v.length < 2);
            const allMissing = missingSyms.length > 0
              ? missingSyms.map(([sym]) => sym)
              : ['BTC-USDT', 'ETH-USDT', 'XAU-USD', 'XAG-USD', 'EUR-USD', 'GBP-USD'].filter(sym => !sparklines[sym]);

            if (allMissing.length > 0 || Object.keys(sparklines).length === 0) {
              const avMap: Record<string, string> = {
                'BTC-USDT': 'BTCUSD', 'ETH-USDT': 'ETHUSD',
                'XAU-USD': 'XAUUSD', 'XAG-USD': 'XAGUSD',
                'EUR-USD': 'EURUSD', 'GBP-USD': 'GBPUSD',
              };
              const symsToFetch = Object.keys(sparklines).length === 0
                ? Object.keys(avMap)
                : allMissing;

              await Promise.allSettled(
                symsToFetch.map(async (sym) => {
                  try {
                    const localSymbol = avMap[sym] || sym.split('-')[0];
                    const history = await getHistoricalData(localSymbol, 30);
                    if (history && history.length > 0) {
                      sparklines[sym] = history.slice(-13).map(p => p.close).filter(v => v > 0);
                    }
                  } catch {
                    // Skip
                  }
                })
              );
            }

            // Fallback 2: Try Finnhub hourly candles for still-missing symbols
            const stillMissing = Object.entries(sparklines).filter(([, v]) => v.length < 2);
            const allStillMissing = stillMissing.length > 0
              ? stillMissing.map(([sym]) => sym)
              : ['BTC-USDT', 'ETH-USDT', 'XAU-USD', 'XAG-USD', 'EUR-USD', 'GBP-USD'].filter(sym => !sparklines[sym] || sparklines[sym].length < 2);

            if (allStillMissing.length > 0) {
              const fhMap: Record<string, string> = {
                'BTC-USDT': 'BINANCE:BTCUSDT', 'ETH-USDT': 'BINANCE:ETHUSDT',
                'XAU-USD': 'OANDA:XAU_USD', 'XAG-USD': 'OANDA:XAG_USD',
                'EUR-USD': 'OANDA:EUR_USD', 'GBP-USD': 'OANDA:GBP_USD',
              };

              await Promise.allSettled(
                allStillMissing.map(async (sym) => {
                  try {
                    const fhSymbol = fhMap[sym] || sym;
                    const fhHistory = await getFinnhubCandleData(fhSymbol, '60', 7);
                    if (fhHistory && fhHistory.length >= 2) {
                      sparklines[sym] = fhHistory.slice(-13).map(p => p.close).filter(v => v > 0);
                    }
                  } catch {
                    // Skip
                  }
                })
              );
            }

            if (Object.keys(sparklines).length > 0) {
              await cache.set(cacheKey, sparklines, CacheTTL.BATCH_SPARKLINES);
              const source = tpFetchCount > 0 ? 'trading-platform' : 'fallback';
              sendEvent('sparklines', { sparklines, source });
            }
          } catch {}
        };
        intervals.push(setInterval(fetchSparklines, 60_000));
        fetchSparklines();
      }

      // ── Notifications Feed (every 5 seconds) ──
      if (feeds.includes('notifications')) {
        const checkNotifications = async () => {
          try {
            const cache = getSyncCache();
            const notification = await cache.get('notifications:latest');
            if (notification && notification.id && notification.id !== lastNotificationId) {
              lastNotificationId = notification.id;
              sendEvent('notification', notification);
            }
          } catch {}
        };
        intervals.push(setInterval(checkNotifications, 5_000));
        checkNotifications();
      }

      // ── Heartbeat (every 15 seconds) ──
      intervals.push(setInterval(sendHeartbeat, 15_000));

      // ── Auto-disconnect after MAX_CONNECTION_MS ──
      const timeout = setTimeout(() => {
        sendEvent('disconnect', { reason: 'max_connection_time', reconnect: true });
        cleanup();
      }, MAX_CONNECTION_MS);

      // Cleanup function
      function cleanup() {
        intervals.forEach(id => clearInterval(id));
        clearTimeout(timeout);
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
