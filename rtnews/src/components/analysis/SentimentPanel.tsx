'use client';

import { SentimentData, NewsWithAnalysis } from './types';
import type { Locale } from '@/components/analysis-v2/locales';
import s from './SentimentPanel.module.css';

interface SentimentPanelProps {
  sentimentData: SentimentData | null;
  newsWithAnalysis: NewsWithAnalysis[];
  locale?: Locale;
}

const TEXT: Record<Locale, {
  title: string;
  live: string;
  fearGreed: string;
  arabSentiment: string;
  positive: string;
  neutral: string;
  negative: string;
  geoRisk: string;
  level: string;
}> = {
  ar: {
    title: '📊 مؤشرات المشاعر',
    live: 'مباشر',
    fearGreed: 'مؤشر الخوف والطمع',
    arabSentiment: 'المشاعر العربية',
    positive: 'إيجابي',
    neutral: 'محايد',
    negative: 'سلبي',
    geoRisk: 'المخاطر الجيوسياسية',
    level: 'المستوى',
  },
  en: {
    title: '📊 Sentiment Indicators',
    live: 'Live',
    fearGreed: 'Fear & Greed Index',
    arabSentiment: 'Market Sentiment',
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    geoRisk: 'Geopolitical Risk',
    level: 'Level',
  },
  fr: {
    title: '📊 Indicateurs de sentiment',
    live: 'En direct',
    fearGreed: 'Indice de peur et de cupidité',
    arabSentiment: 'Sentiment du marché',
    positive: 'Positif',
    neutral: 'Neutre',
    negative: 'Négatif',
    geoRisk: 'Risque géopolitique',
    level: 'Niveau',
  },
  tr: {
    title: '📊 Duygu Göstergeleri',
    live: 'Canlı',
    fearGreed: 'Korku ve Açgözlülük Endeksi',
    arabSentiment: 'Piyasa Duygusu',
    positive: 'Pozitif',
    neutral: 'Nötr',
    negative: 'Negatif',
    geoRisk: 'Jeopolitik Risk',
    level: 'Seviye',
  },
  es: {
    title: '📊 Indicadores de Sentimiento',
    live: 'En vivo',
    fearGreed: 'Índice de Miedo y Codicia',
    arabSentiment: 'Sentimiento del Mercado',
    positive: 'Positivo',
    neutral: 'Neutral',
    negative: 'Negativo',
    geoRisk: 'Riesgo Geopolítico',
    level: 'Nivel',
  },
};

export default function SentimentPanel({ sentimentData, newsWithAnalysis, locale = 'ar' }: SentimentPanelProps) {
  const txt = TEXT[locale] || TEXT.ar;
  const fearGreed = sentimentData?.fearGreedIndex || { value: 0, label: '—', labelAr: '—' };
  const arabSentiment = sentimentData?.arabSentimentIndex;
  const geoRisk = sentimentData?.geopoliticalRiskIndex;

  const fgColor = fearGreed.value >= 60 ? 'var(--bull)' :
    fearGreed.value >= 40 ? 'var(--gold)' : 'var(--bear)';

  const totalNews = newsWithAnalysis.length || 1;
  const posCount = newsWithAnalysis.filter(n => n.sentiment === 'positive').length;
  const negCount = newsWithAnalysis.filter(n => n.sentiment === 'negative').length;
  const neuCount = totalNews - posCount - negCount;

  // Use locale-aware label for Fear & Greed
  const fgLabel = locale === 'ar' ? fearGreed.labelAr : fearGreed.label;

  return (
    <div className={s.sentimentPanel}>
      <div className={s.sentimentHeader}>
        <div className={s.sentimentTitle}>{txt.title}</div>
        <div className={s.sentimentLive}>
          <span className={s.sentimentLiveDot} />
          <span>{txt.live}</span>
        </div>
      </div>
      <div className={s.sentimentBody}>
        {/* Fear & Greed Gauge */}
        <div className={s.fearGreedGauge}>
          <div className={s.gaugeCircle} style={{
            background: `conic-gradient(${fgColor} ${fearGreed.value * 3.6}deg, var(--bg4) 0deg)`,
          }}>
            <div className={s.gaugeInner}>
              <span className={s.gaugeValue} style={{ color: fgColor }}>{fearGreed.value}</span>
              <span className={s.gaugeLabel}>{fgLabel}</span>
            </div>
          </div>
          <div className={s.gaugeInfo}>
            <span className={s.gaugeTitle}>{txt.fearGreed}</span>
          </div>
        </div>

        {/* Market Sentiment */}
        {arabSentiment && (
          <div className={s.sentimentBarGroup}>
            <div className={s.sentimentBarLabel}>{txt.arabSentiment}</div>
            <div className={s.sentimentBarRow}>
              <span className={s.sentimentBarName}>{txt.positive}</span>
              <div className={s.sentimentBarTrack}>
                <div className={s.sentimentBarFill} style={{ width: `${(posCount / totalNews) * 100}%`, background: 'var(--bull)' }} />
              </div>
              <span className={s.sentimentBarPct}>{Math.round((posCount / totalNews) * 100)}%</span>
            </div>
            <div className={s.sentimentBarRow}>
              <span className={s.sentimentBarName}>{txt.neutral}</span>
              <div className={s.sentimentBarTrack}>
                <div className={s.sentimentBarFill} style={{ width: `${(neuCount / totalNews) * 100}%`, background: 'var(--gold)' }} />
              </div>
              <span className={s.sentimentBarPct}>{Math.round((neuCount / totalNews) * 100)}%</span>
            </div>
            <div className={s.sentimentBarRow}>
              <span className={s.sentimentBarName}>{txt.negative}</span>
              <div className={s.sentimentBarTrack}>
                <div className={s.sentimentBarFill} style={{ width: `${(negCount / totalNews) * 100}%`, background: 'var(--bear)' }} />
              </div>
              <span className={s.sentimentBarPct}>{Math.round((negCount / totalNews) * 100)}%</span>
            </div>
          </div>
        )}

        {/* Geopolitical Risk */}
        {geoRisk && (
          <div className={s.geoRiskGroup}>
            <div className={s.geoRiskTitle}>{txt.geoRisk}</div>
            <div className={s.geoRiskRow}>
              <span className={s.geoRiskLabel}>{txt.level}</span>
              <span className={s.geoRiskValue} style={{ color: geoRisk.value >= 70 ? 'var(--bear)' : geoRisk.value >= 40 ? 'var(--gold)' : 'var(--bull)' }}>
                {geoRisk.value}/100
              </span>
            </div>
            {geoRisk.impacts && Object.entries(geoRisk.impacts).slice(0, 3).map(([key, val]) => (
              <div key={key} className={s.geoRiskRow}>
                <span className={s.geoRiskLabel}>{key}</span>
                <span className={s.geoRiskValue} style={{
                  color: val.trend === 'up' ? 'var(--bear)' : val.trend === 'down' ? 'var(--bull)' : 'var(--text3)',
                  fontSize: 10,
                }}>
                  {val.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
