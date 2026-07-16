'use client';

import { TradingQuote } from './types';
import type { Locale } from '@/components/analysis-v2/locales';
import s from './TradingQuotesPanel.module.css';

interface TradingQuotesPanelProps {
  quotes: TradingQuote[];
  loading: boolean;
  locale?: Locale;
}

const TEXT: Record<Locale, {
  loading: string;
  livePrices: string;
}> = {
  ar: { loading: 'جارٍ تحميل الأسعار...', livePrices: 'أسعار حية' },
  en: { loading: 'Loading prices...', livePrices: 'Live Prices' },
  fr: { loading: 'Chargement des prix...', livePrices: 'Prix en direct' },
  tr: { loading: 'Fiyatlar yükleniyor...', livePrices: 'Canlı Fiyatlar' },
  es: { loading: 'Cargando precios...', livePrices: 'Precios en vivo' },
};

export default function TradingQuotesPanel({ quotes, loading, locale = 'ar' }: TradingQuotesPanelProps) {
  const txt = TEXT[locale] || TEXT.ar;

  if (loading) {
    return (
      <div className={s.quotesLoading}>
        <div className={s.quotesLoadingSpinner} />
        <span className={s.quotesLoadingText}>{txt.loading}</span>
      </div>
    );
  }

  const visibleQuotes = quotes.slice(0, 6);

  return (
    <div className={s.quotesPanel}>
      <div className={s.quotesHeader}>
        <span className={s.quotesHeaderIcon}>💹</span>
        <span className={s.quotesHeaderTitle}>{txt.livePrices}</span>
        <span className={s.quotesLiveDot} />
      </div>
      <div className={s.quotesList}>
        {visibleQuotes.map((q, i) => {
          const isUp = q.change >= 0;
          return (
            <div key={i} className={`${s.quoteRow} ${i < visibleQuotes.length - 1 ? s.quoteRowBorder : ''}`}>
              <div className={s.quoteLeft}>
                <span className={`${s.quoteSymbol} ${isUp ? s.quoteSymbolUp : s.quoteSymbolDown}`}>
                  {q.symbol?.replace('/USDT', '').replace('/USD', '')}
                </span>
                <span className={s.quoteName}>{q.name}</span>
              </div>
              <div className={s.quoteRight}>
                <span className={s.quotePrice}>
                  {q.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className={`${s.quoteChange} ${isUp ? s.quoteChangeUp : s.quoteChangeDown}`}>
                  {isUp ? '▲' : '▼'} {Math.abs(q.changePercent)?.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
