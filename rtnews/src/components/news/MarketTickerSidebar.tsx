'use client';

// ═══════════════════════════════════════════════════════════════════
// MarketTickerSidebar — Live price strip for the news page sidebar
// ═══════════════════════════════════════════════════════════════════
// Shows 6 key assets: Gold, BTC, WTI Oil, S&P 500, USD Index, EUR/USD.
// Refreshes every 60s. Uses /api/integration/quote per symbol with
// Promise.allSettled for resilience (partial failure does not break UI).
//
// This is the "Market Companion" sidebar — the user reads the news and
// sees the immediate market reaction in real time, Bloomberg-style.

import { useEffect, useState, useCallback } from 'react';
import { getNewsStrings, NewsLocale } from '@/lib/news-i18n';

interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
}

interface TickerAsset {
  symbol: string;
  labelKey: string;
  icon: string;
  decimals: number;
}

// Yahoo Finance-native symbols — these are the formats Yahoo's quote()
// endpoint recognizes directly (Yahoo is the primary free provider).
//   GC=F       → Gold futures
//   BTC-USD    → Bitcoin
//   CL=F       → WTI Crude Oil futures
//   ^GSPC      → S&P 500 index
//   DX-Y.NYB   → US Dollar Index
//   EURUSD=X   → EUR/USD forex pair
//
// NOTE: The /api/integration/quote route has a LOCAL_SYMBOL_MAP for
// trading-platform formats (OANDA:XAU_USD etc.), but those TP formats
// only work if the trading platform is configured. The Yahoo-native
// symbols below bypass the TP and go straight to Yahoo Finance, which
// is free, keyless, and works in all environments.
const TICKER_ASSETS: TickerAsset[] = [
  { symbol: 'GC=F',     labelKey: 'gold',    icon: '🥇', decimals: 2 },
  { symbol: 'BTC-USD',  labelKey: 'btc',     icon: '₿',  decimals: 0 },
  { symbol: 'CL=F',     labelKey: 'oil',     icon: '🛢️', decimals: 2 },
  { symbol: '^GSPC',    labelKey: 'sp500',   icon: '📈', decimals: 2 },
  { symbol: 'DX-Y.NYB', labelKey: 'dxy',     icon: '💵', decimals: 2 },
  { symbol: 'EURUSD=X', labelKey: 'eurusd',  icon: '🇪🇺', decimals: 4 },
];

const ASSET_LABELS: Record<string, Record<string, string>> = {
  gold: { ar: 'الذهب', en: 'Gold', fr: 'Or', tr: 'Altın', es: 'Oro' },
  btc: { ar: 'بيتكوين', en: 'Bitcoin', fr: 'Bitcoin', tr: 'Bitcoin', es: 'Bitcoin' },
  oil: { ar: 'نفط WTI', en: 'WTI Oil', fr: 'Pétrole', tr: 'Petrol', es: 'Petróleo' },
  sp500: { ar: 'S&P 500', en: 'S&P 500', fr: 'S&P 500', tr: 'S&P 500', es: 'S&P 500' },
  dxy: { ar: 'مؤشر الدولار', en: 'Dollar Index', fr: 'Indice $', tr: 'Dolar Endeksi', es: 'Índice Dólar' },
  eurusd: { ar: 'يورو/دولار', en: 'EUR/USD', fr: 'EUR/USD', tr: 'EUR/USD', es: 'EUR/USD' },
};

interface MarketTickerSidebarProps {
  locale: NewsLocale;
  colors: {
    cardBg: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    cyan: string;
    cyanDim: string;
    cyanBorder: string;
    green: string;
    red: string;
    gold: string;
    goldDim: string;
    inputBg: string;
    isDark: boolean;
  };
}

export default function MarketTickerSidebar({ locale, colors: C }: MarketTickerSidebarProps) {
  const s = getNewsStrings(locale);
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const fetchQuotes = useCallback(async () => {
    try {
      const results = await Promise.allSettled(
        TICKER_ASSETS.map(async (asset) => {
          const res = await fetch(`/api/integration/quote?symbol=${encodeURIComponent(asset.symbol)}`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          // The /api/integration/quote route returns TWO possible shapes:
          //   1. Trading platform: { quote: { price, change, changePercent, ... }, source: 'trading-platform' }
          //   2. Fallback (Yahoo): { quote: { price, change, changePercent, ... }, source: 'fallback' }
          // Both wrap the actual quote data under .quote. Some legacy/edge cases
          // may also return flat { price, change, changePercent } at top level,
          // so we check both.
          const q = data.quote || data;
          const price = Number(q.price || q.currentPrice || 0);
          const change = Number(q.change || 0);
          const changePercent = Number(q.changePercent || q.changePercent || 0);

          return {
            asset,
            data: {
              symbol: asset.symbol,
              name: ASSET_LABELS[asset.labelKey]?.[locale] || asset.symbol,
              price,
              change,
              changePercent,
              currency: q.currency || data.currency || 'USD',
            } as QuoteData,
          };
        }),
      );

      const next: Record<string, QuoteData> = {};
      let anySuccess = false;
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value.data.price > 0) {
          next[TICKER_ASSETS[idx].symbol] = result.value.data;
          anySuccess = true;
        }
      });

      if (anySuccess) {
        setQuotes(next);
        setLastUpdate(new Date());
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 60_000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  const formatPrice = useCallback((asset: TickerAsset, price: number) => {
    if (!price) return '—';
    return price.toLocaleString('en-US', {
      minimumFractionDigits: asset.decimals,
      maximumFractionDigits: asset.decimals,
    });
  }, []);

  return (
    <div style={{
      background: C.cardBg,
      borderRadius: '14px',
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: C.goldDim, border: `1px solid rgba(212,175,55,0.25)`,
            fontSize: '14px',
          }}>
            ⚡
          </div>
          <div>
            <h3 style={{
              fontSize: '13px', fontWeight: 700, color: C.textPrimary,
              fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
            }}>
              {s.marketSidebarTitle}
            </h3>
            <p style={{ fontSize: '9px', color: C.textMuted, marginTop: '1px' }}>{s.marketPulse}</p>
          </div>
        </div>
        {lastUpdate && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '9px', color: C.textMuted,
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
          }}>
            <span style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: C.green, animation: 'pulse 2s infinite',
            }} />
            {lastUpdate.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        )}
      </div>

      {/* Asset rows */}
      <div style={{ padding: '8px 12px 12px' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 4px',
              borderBottom: i < 5 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: C.inputBg }} />
                <div style={{ width: '70px', height: '10px', borderRadius: '3px', background: C.inputBg }} />
              </div>
              <div style={{ width: '50px', height: '10px', borderRadius: '3px', background: C.inputBg }} />
            </div>
          ))
        ) : (
          TICKER_ASSETS.map((asset, idx) => {
            const q = quotes[asset.symbol];
            const isUp = q ? q.change >= 0 : false;
            const changeColor = !q ? C.textMuted : isUp ? C.green : C.red;
            const label = ASSET_LABELS[asset.labelKey]?.[locale] || asset.symbol;

            return (
              <div key={asset.symbol} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 4px',
                borderBottom: idx < TICKER_ASSETS.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '14px', width: '20px', textAlign: 'center' }}>{asset.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '11px', fontWeight: 600, color: C.textPrimary,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </div>
                    <div style={{
                      fontSize: '9px', color: C.textMuted,
                      fontFamily: 'var(--font-jetbrains-mono, monospace)',
                      letterSpacing: '0.3px',
                    }}>
                      {asset.symbol}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'end' }}>
                  <div style={{
                    fontSize: '12px', fontWeight: 700, color: C.textPrimary,
                    fontFamily: 'var(--font-jetbrains-mono, monospace)',
                    letterSpacing: '0.3px',
                  }}>
                    {q ? formatPrice(asset, q.price) : '—'}
                  </div>
                  {q && q.changePercent !== 0 && (
                    <div style={{
                      fontSize: '10px', fontWeight: 600, color: changeColor,
                      fontFamily: 'var(--font-jetbrains-mono, monospace)',
                      display: 'flex', alignItems: 'center', gap: '2px',
                      justifyContent: 'flex-end',
                    }}>
                      <span>{isUp ? '▲' : '▼'}</span>
                      <span>{Math.abs(q.changePercent).toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {!loading && error && Object.keys(quotes).length === 0 && (
          <div style={{
            textAlign: 'center', padding: '24px 8px',
            color: C.textMuted, fontSize: '11px',
          }}>
            <div style={{ fontSize: '20px', marginBottom: '6px', opacity: 0.5 }}>📊</div>
            {s.marketUnavailable}
          </div>
        )}
      </div>
    </div>
  );
}
