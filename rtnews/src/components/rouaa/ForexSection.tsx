'use client';

import { useState, useEffect } from 'react';

interface ForexPair {
  symbol: string;
  displaySymbol: string;
  nameAr: string;
  nameEn?: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  category: string;
  categoryEn?: string;
  decimals: number;
  source?: string;
}

// V355: Locale-aware labels
const LABELS = {
  ar: {
    sectionTitle: 'أزواج العملات',
    forex: 'فوركس',
    noData: 'لا توجد بيانات فوركس حالياً',
    eurUsd: 'يورو/دولار',
    gbpUsd: 'جنيه/دولار',
    dxy: 'مؤشر الدولار',
    usdJpy: 'دولار/ين',
    currencies: 'عملات',
  },
  en: {
    sectionTitle: 'Currency Pairs',
    forex: 'Forex',
    noData: 'No forex data available at the moment',
    eurUsd: 'EUR/USD',
    gbpUsd: 'GBP/USD',
    dxy: 'US Dollar Index',
    usdJpy: 'USD/JPY',
    currencies: 'Forex',
  },
  fr: {
    sectionTitle: 'Paires de Devises',
    forex: 'Forex',
    noData: 'Aucune donnée forex disponible',
    eurUsd: 'EUR/USD',
    gbpUsd: 'GBP/USD',
    dxy: 'Indice Dollar',
    usdJpy: 'USD/JPY',
    currencies: 'Forex',
  },
  tr: {
    sectionTitle: 'Döviz Çiftleri',
    forex: 'Forex',
    noData: 'Şu anda forex verisi yok',
    eurUsd: 'EUR/USD',
    gbpUsd: 'GBP/USD',
    dxy: 'Dolar Endeksi',
    usdJpy: 'USD/JPY',
    currencies: 'Forex',
  },
  es: {
    sectionTitle: 'Pares de Divisas',
    forex: 'Divisas',
    noData: 'No hay datos de divisas disponibles',
    eurUsd: 'EUR/USD',
    gbpUsd: 'GBP/USD',
    dxy: 'Índice del Dólar',
    usdJpy: 'USD/JPY',
    currencies: 'Divisas',
  },
} as const;

type Locale = keyof typeof LABELS;

const FOREX_SYMBOLS = ['EUR', 'GBP', 'DXY', 'JPY'];

// Mapping from news site symbols to trading platform symbols
const TP_SYMBOL_MAP: Record<string, string> = {
  'EUR': 'EUR-USD',
  'GBP': 'GBP-USD',
  'DXY': 'DXY-USD',
  'JPY': 'USD-JPY',
};

// Flag emojis for currencies
const CURRENCY_FLAGS: Record<string, string> = {
  'EUR': '🇪🇺', 'GBP': '🇬🇧', 'DXY': '🇺🇸', 'JPY': '🇯🇵',
  'USDJPY': '🇯🇵', 'AUDUSD': '🇦🇺', 'USDCAD': '🇨🇦', 'USDCHF': '🇨🇭', 'NZDUSD': '🇳🇿',
};

interface ForexSectionProps {
  locale?: Locale;
}

export default function ForexSection({ locale = 'ar' }: ForexSectionProps) {
  const t = LABELS[locale] || LABELS.ar;
  const [forexPairs, setForexPairs] = useState<ForexPair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForex = async () => {
        if (document.hidden) return; // V1020: skip polling when tab is hidden
      try {
        // Strategy: Try trading platform first, then fallback to external APIs
        const [tpQuotesRes, priceRes] = await Promise.allSettled([
          fetch('/api/markets/integration?mode=quotes', { cache: 'no-store', signal: AbortSignal.timeout(15_000) }),
          fetch('/api/markets/prices', { cache: 'no-store', signal: AbortSignal.timeout(15_000) }),
        ]);

        const tpQuotesData = tpQuotesRes.status === 'fulfilled' && tpQuotesRes.value.ok
          ? await tpQuotesRes.value.json()
          : { quotes: {} };

        const priceData = priceRes.status === 'fulfilled' && priceRes.value.ok
          ? await priceRes.value.json()
          : { prices: [] };

        // Build forex from trading platform data (primary source)
        const tpForex: ForexPair[] = [];

        for (const [shortSymbol, tpSymbol] of Object.entries(TP_SYMBOL_MAP)) {
          const tpQuote = tpQuotesData.quotes?.[tpSymbol];
          if (tpQuote && tpQuote.price > 0) {
            const nameMap: Record<string, string> = {
              'EUR': t.eurUsd,
              'GBP': t.gbpUsd,
              'DXY': t.dxy,
              'JPY': t.usdJpy,
            };
            tpForex.push({
              symbol: shortSymbol,
              displaySymbol: shortSymbol === 'DXY' ? 'DXY' :
                             shortSymbol === 'JPY' ? 'USD/JPY' :
                             `${shortSymbol}/USD`,
              nameAr: nameMap[shortSymbol] || shortSymbol,
              price: tpQuote.price,
              change: tpQuote.change || 0,
              changePercent: tpQuote.changePercent || 0,
              category: t.currencies,
              decimals: shortSymbol === 'EUR' || shortSymbol === 'GBP' ? 4 : 2,
              source: 'live',
            });
          }
        }

        // If trading platform provided forex data, use it
        if (tpForex.length > 0) {
          setForexPairs(tpForex);
          return;
        }

        // Fallback: use external API data
        if (priceData.prices && priceData.prices.length > 0) {
          const apiForex = priceData.prices.filter((p: ForexPair) =>
            FOREX_SYMBOLS.includes(p.symbol) || p.category === 'عملات' || p.category === t.currencies
          );
          setForexPairs(apiForex);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchForex();
    const interval = setInterval(fetchForex, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [t]);

  return (
    <section className="section-block" aria-label={t.forex} role="region">
      <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
        <div className="sh">
          <div className="sh-title">{t.sectionTitle}</div>
          <span className="text-[11px] font-mono-price" style={{ color: 'var(--text3)' }}>{t.forex}</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card p-3" style={{ height: '90px' }}>
                <div className="skeleton" style={{ height: '12px', width: '50%', marginBottom: '10px' }} />
                <div className="skeleton" style={{ height: '20px', width: '70%', marginBottom: '6px' }} />
                <div className="skeleton" style={{ height: '10px', width: '40%' }} />
              </div>
            ))}
          </div>
        ) : forexPairs.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-[13px]" style={{ color: 'var(--text3)' }}>{t.noData}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {forexPairs.map((pair) => {
              const isUp = (pair.changePercent ?? 0) >= 0;
              const flag = CURRENCY_FLAGS[pair.symbol] || '💱';

              return (
                <div key={pair.symbol} className="glass-card p-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-base">{flag}</span>
                    <span className="font-mono-price text-[12px] font-bold" style={{ color: 'var(--text)' }}>{pair.displaySymbol}</span>
                    {pair.source === 'live' && <span className="live-pulse-dot" />}
                  </div>
                  <div className="font-mono-price text-[16px] font-bold" style={{ color: 'var(--text)' }} suppressHydrationWarning>
                    {(pair.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: pair.decimals || 4 })}
                  </div>
                  <span className={`font-mono-price text-[11px] font-medium ${isUp ? 'flash-up' : 'flash-down'}`}
                    style={{ color: isUp ? 'var(--bull)' : 'var(--bear)' }} suppressHydrationWarning>
                    {isUp ? '▲' : '▼'} {Math.abs(pair.changePercent ?? 0).toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
