'use client';

import dynamic from 'next/dynamic';
import { CHART_PAIRS } from './types';
import type { Locale } from '@/components/analysis-v2/locales';
import s from './ChartPanel.module.css';

const PlatformChart = dynamic(() => import('@/components/rouaa/charts/PlatformChart'), {
  ssr: false,
  loading: () => <div className={s.chartLoading}>Loading chart...</div>,
});

interface ChartPanelProps {
  chartPair: string;
  onPairChange: (pair: string) => void;
  locale?: Locale;
}

const TEXT: Record<Locale, {
  loading: string;
  title: string;
  fromPlatform: string;
}> = {
  ar: { loading: 'جاري تحميل الشارت...', title: '📈 الرسم البياني', fromPlatform: 'من المنصة' },
  en: { loading: 'Loading chart...', title: '📈 Chart', fromPlatform: 'From Platform' },
  fr: { loading: 'Chargement du graphique...', title: '📈 Graphique', fromPlatform: 'De la plateforme' },
  tr: { loading: 'Grafik yükleniyor...', title: '📈 Grafik', fromPlatform: 'Platformdan' },
  es: { loading: 'Cargando gráfico...', title: '📈 Gráfico', fromPlatform: 'De la plataforma' },
};

const CHART_SYMBOL_MAP: Record<string, string> = {
  'EUR/USD': 'EUR', 'XAU/USD': 'XAU', 'BTC/USD': 'BTC',
  'GBP/USD': 'GBP', 'USD/JPY': 'JPY', 'SOL/USD': 'SOL',
};

export default function ChartPanel({ chartPair, onPairChange, locale = 'ar' }: ChartPanelProps) {
  const txt = TEXT[locale] || TEXT.ar;
  const chartSymbol = CHART_SYMBOL_MAP[chartPair] || 'EUR';

  // Override loading text with locale
  const ChartWithLocale = dynamic(() => import('@/components/rouaa/charts/PlatformChart'), {
    ssr: false,
    loading: () => <div className={s.chartLoading}>{txt.loading}</div>,
  });

  return (
    <div className={s.chartPanel}>
      <div className={s.chartHeader}>
        <div className={s.chartHeaderLeft}>
          <span className={s.chartTitle}>{txt.title}</span>
          <span className={s.chartBadge}>{txt.fromPlatform}</span>
        </div>
        <div className={s.chartHeaderRight}>
          {Object.keys(CHART_PAIRS).map(p => (
            <button key={p} onClick={() => onPairChange(p)}
              className={`${s.chartPairBtn} ${chartPair === p ? s.chartPairBtnActive : ''}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: 450, borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
        <PlatformChart
          symbol={chartSymbol}
          nameAr={chartPair}
          height={450}
          showVolume={true}
          showToolbar={true}
          defaultInterval="1hour"
        />
      </div>
    </div>
  );
}
