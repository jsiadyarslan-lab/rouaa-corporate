'use client';

import { useState, useEffect } from 'react';

interface SentimentData {
  fearGreedIndex: { value: number; label: string; labelAr: string };
  arabSentimentIndex: { value: number; label: string; topSearchedAsset: string; majorityVote: string; interactionsCount: number };
  geopoliticalRiskIndex: { value: number; label: string; description: string; impacts: Record<string, { trend: string; value: string }> };
  aiPowered: boolean;
  aiSummary: string | null;
  lastUpdate: string;
}

// V355: Locale-aware labels
const LABELS = {
  ar: {
    sectionTitle: 'الأسواق والمشاعر',
    fearGreed: 'مؤشر الخوف والطمع',
    global: 'عالمي',
    arabSentiment: 'نبض المتداولين العرب',
    exclusive: 'حصري',
    mostSearched: 'الأكثر بحثاً',
    votes: 'التصويتات',
    geopolitical: 'التوترات الجيوسياسية',
    insights: 'رؤى',
    low: 'منخفض',
    medium: 'متوسط',
    high: 'مرتفع',
    aiAnalysis: 'AI تحليل',
    noData: 'لا توجد بيانات',
    oil: 'النفط',
    gold: 'الذهب',
    dollar: 'الدولار',
  },
  en: {
    sectionTitle: 'Markets & Sentiment',
    fearGreed: 'Fear & Greed Index',
    global: 'Global',
    arabSentiment: 'Arab Traders Pulse',
    exclusive: 'Exclusive',
    mostSearched: 'Most Searched',
    votes: 'Votes',
    geopolitical: 'Geopolitical Risk',
    insights: 'Insights',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    aiAnalysis: 'AI Analysis',
    noData: 'No data',
    oil: 'Oil',
    gold: 'Gold',
    dollar: 'Dollar',
  },
  fr: {
    sectionTitle: 'Marchés & Sentiment',
    fearGreed: 'Indice Peur & Cupidité',
    global: 'Mondial',
    arabSentiment: 'Pulse Traders Arabes',
    exclusive: 'Exclusif',
    mostSearched: 'Plus recherché',
    votes: 'Votes',
    geopolitical: 'Risques Géopolitiques',
    insights: 'Analyses',
    low: 'Bas',
    medium: 'Moyen',
    high: 'Élevé',
    aiAnalysis: 'Analyse IA',
    noData: 'Pas de données',
    oil: 'Pétrole',
    gold: 'Or',
    dollar: 'Dollar',
  },
  tr: {
    sectionTitle: 'Piyasalar & Duygu',
    fearGreed: 'Korku & Açgözlülük Endeksi',
    global: 'Küresel',
    arabSentiment: 'Arap Trader Nabzı',
    exclusive: 'Özel',
    mostSearched: 'En Çok Aranan',
    votes: 'Oylar',
    geopolitical: 'Jeopolitik Riskler',
    insights: 'Analizler',
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    aiAnalysis: 'AI Analizi',
    noData: 'Veri yok',
    oil: 'Petrol',
    gold: 'Altın',
    dollar: 'Dolar',
  },
  es: {
    sectionTitle: 'Mercados y Sentimiento',
    fearGreed: 'Índice de Miedo y Codicia',
    global: 'Global',
    arabSentiment: 'Pulso de Traders Árabes',
    exclusive: 'Exclusivo',
    mostSearched: 'Más Buscado',
    votes: 'Votos',
    geopolitical: 'Riesgo Geopolítico',
    insights: 'Perspectivas',
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto',
    aiAnalysis: 'Análisis IA',
    noData: 'Sin datos',
    oil: 'Petróleo',
    gold: 'Oro',
    dollar: 'Dólar',
  },
} as const;

type Locale = keyof typeof LABELS;

function FearGreedGauge({ value, label, noDataLabel }: { value: number; label: string; noDataLabel: string }) {
  // -1 means "no data" — show placeholder instead of a gauge with a fake value
  if (value < 0) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-[100px] h-[56px] flex items-center justify-center">
          <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{noDataLabel}</span>
        </div>
        <div className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text3)' }}>{label}</div>
      </div>
    );
  }
  const angle = (value / 100) * 180 - 90;
  const color = value <= 25 ? '#F43F5E' : value <= 45 ? '#E8A020' : value <= 55 ? '#64748B' : value <= 75 ? '#22C55E' : '#22C55E';

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="56" viewBox="0 0 180 100">
        {/* Background arc */}
        <path d="M 15 95 A 75 75 0 0 1 165 95" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
        {/* Colored segments */}
        <path d="M 15 95 A 75 75 0 0 1 52 30" fill="none" stroke="#F43F5E" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
        <path d="M 52 30 A 75 75 0 0 1 90 20" fill="none" stroke="#E8A020" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
        <path d="M 90 20 A 75 75 0 0 1 128 30" fill="none" stroke="#22C55E" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
        <path d="M 128 30 A 75 75 0 0 1 165 95" fill="none" stroke="#00C9A7" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
        {/* Active arc */}
        <path d="M 15 95 A 75 75 0 0 1 165 95" fill="none" stroke="url(#gaugeGrad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 236} 236`} />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="35%" stopColor="#E8A020" />
            <stop offset="65%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#00C9A7" />
          </linearGradient>
        </defs>
        {/* Needle */}
        <line x1="90" y1="95" x2={90 + 58 * Math.cos((angle - 90) * Math.PI / 180)} y2={95 + 58 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx={90 + 58 * Math.cos((angle - 90) * Math.PI / 180)} cy={95 + 58 * Math.sin((angle - 90) * Math.PI / 180)} r="3.5" fill={color} />
        <circle cx="90" cy="95" r="4" fill="var(--bg3)" stroke={color} strokeWidth="1.5" />
      </svg>
      <div className="font-mono-price text-2xl font-bold mt-[-4px]" style={{ color }}>{value}</div>
      <div className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text2)' }}>{label}</div>
    </div>
  );
}

interface MarketsSentimentProps {
  locale?: Locale;
}

export default function MarketsSentiment({ locale = 'ar' }: MarketsSentimentProps) {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const t = LABELS[locale] || LABELS.ar;

  // Helper: translate Fear & Greed numeric value to locale label
  function fgLabel(value: number): string {
    if (value < 0) return t.noData;
    if (value <= 25) return locale === 'ar' ? 'خوف شديد' : locale === 'es' ? 'Miedo Extremo' : locale === 'fr' ? 'Peur Extrême' : locale === 'tr' ? 'Aşırı Korku' : 'Extreme Fear';
    if (value <= 40) return locale === 'ar' ? 'خوف' : locale === 'es' ? 'Miedo' : locale === 'fr' ? 'Peur' : locale === 'tr' ? 'Korku' : 'Fear';
    if (value <= 60) return locale === 'ar' ? 'حذر متوسط' : locale === 'es' ? 'Precaución Moderada' : locale === 'fr' ? 'Prudence Modérée' : locale === 'tr' ? 'Orta Dikkat' : 'Moderate Caution';
    if (value <= 75) return locale === 'ar' ? 'طمع' : locale === 'es' ? 'Codicia' : locale === 'fr' ? 'Cupidité' : locale === 'tr' ? 'Açgözlülük' : 'Greed';
    return locale === 'ar' ? 'طمع شديد' : locale === 'es' ? 'Codicia Extrema' : locale === 'fr' ? 'Cupidité Extrême' : locale === 'tr' ? 'Aşırı Açgözlülük' : 'Extreme Greed';
  }

  // Helper: translate geo risk level label from API Arabic to locale
  function geoRiskLevelLabel(rawLabel: string): string {
    if (/منخفض/.test(rawLabel)) return t.low;
    if (/متوسط/.test(rawLabel)) return t.medium;
    if (/مرتفع/.test(rawLabel)) return t.high;
    return rawLabel; // fallback: show as-is if not Arabic
  }

  // Helper: translate majority vote from API (e.g., "صعود 109%" → "Alcista 109%")
  function majorityVoteLabel(raw: string): string {
    const numMatch = raw.match(/(\d+)/);
    if (!numMatch) return raw;
    const pct = numMatch[1];
    if (/صعود/.test(raw)) {
      return locale === 'ar' ? raw : locale === 'es' ? `Alcista ${pct}%` : locale === 'fr' ? `Haussier ${pct}%` : locale === 'tr' ? `Yukarı ${pct}%` : `Bullish ${pct}%`;
    }
    if (/هبوط/.test(raw)) {
      return locale === 'ar' ? raw : locale === 'es' ? `Bajista ${pct}%` : locale === 'fr' ? `Baissier ${pct}%` : locale === 'tr' ? `Aşağı ${pct}%` : `Bearish ${pct}%`;
    }
    return raw;
  }

  // Helper: translate impact value from API (e.g., "2 خبر" → "2 noticias")
  function translateImpactVal(val: string): string {
    const numMatch = val.match(/(\d+)/);
    if (!numMatch) return val;
    const num = parseInt(numMatch[1], 10);
    if (locale === 'ar') return `${num} خبر`;
    if (locale === 'es') return num === 1 ? '1 noticia' : `${num} noticias`;
    if (locale === 'fr') return num === 1 ? '1 actualité' : `${num} actualités`;
    if (locale === 'tr') return num === 1 ? '1 haber' : `${num} haber`;
    return num === 1 ? '1 news' : `${num} news`;
  }

  useEffect(() => {
    const fetchSentiment = async () => {
        if (document.hidden) return; // V1020: skip polling when tab is hidden
      try {
        const res = await fetch('/api/markets/sentiment', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSentimentData(data);
        }
      } catch {
        // Will use fallback rendering
      } finally {
        setLoading(false);
      }
    };
    fetchSentiment();

    // Refresh every 5 minutes
    const interval = setInterval(fetchSentiment, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fallback values when no data is available
  const fearGreed = sentimentData?.fearGreedIndex || { value: -1, label: t.noData, labelAr: t.noData };
  const arabSentiment = sentimentData?.arabSentimentIndex || { value: -1, label: t.noData, topSearchedAsset: '—', majorityVote: '—', interactionsCount: null };
  const geoRisk = sentimentData?.geopoliticalRiskIndex || { value: -1, label: t.noData, description: '', impacts: {} };

  return (
    <section id="markets" className="section-block" aria-label={t.sectionTitle} role="region">
      <div className="max-w-[1400px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
        <div className="section-title">
          <h2>{t.sectionTitle}</h2>
          <div className="flex items-center gap-2">
            {sentimentData?.aiPowered && (
              <span className="badge-ai" style={{ fontSize: '9px' }}>AI</span>
            )}
            <span className="badge-live">
              <span className="live-dot" />
              LIVE
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-3" style={{ height: '110px' }}>
                <div className="skeleton" style={{ height: '10px', width: '50%', marginBottom: '10px' }} />
                <div className="flex justify-center mb-2">
                  <div className="skeleton" style={{ width: '80px', height: '40px', borderRadius: '40px 40px 0 0' }} />
                </div>
                <div className="skeleton" style={{ height: '10px', width: '60%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2" style={{ gap: 'var(--space-xs)' }}>
            {/* Fear & Greed Index */}
            <div className="glass-card p-3 flex flex-col items-center" aria-label={t.fearGreed}>
              <div className="flex items-center gap-1.5 mb-2 w-full">
                <h3 className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{t.fearGreed}</h3>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--gold)' }}>{t.global}</span>
              </div>
              <FearGreedGauge value={fearGreed.value} label={fgLabel(fearGreed.value)} noDataLabel={t.noData} />
            </div>

            {/* Arab Sentiment */}
            <div className="glass-card p-3 flex flex-col items-center" aria-label={t.arabSentiment}>
              <div className="flex items-center gap-1.5 mb-2 w-full">
                <h3 className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{t.arabSentiment}</h3>
                <span className="badge-exclusive" style={{ fontSize: '8px' }}>{t.exclusive}</span>
              </div>
              <FearGreedGauge value={arabSentiment.value} label={fgLabel(arabSentiment.value)} noDataLabel={t.noData} />
              <div className="mt-2 w-full space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span style={{ color: 'var(--text3)' }}>{t.mostSearched}</span>
                  <span className="font-mono-price font-medium" style={{ color: 'var(--cyan)' }}>{arabSentiment.topSearchedAsset}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span style={{ color: 'var(--text3)' }}>{t.votes}</span>
                  <span className="font-medium" style={{ color: 'var(--bull)' }}>{majorityVoteLabel(arabSentiment.majorityVote)}</span>
                </div>
              </div>
            </div>

            {/* Geopolitical Risk */}
            <div className="glass-card p-3" aria-label={t.geopolitical}>
              <div className="flex items-center gap-1.5 mb-2">
                <h3 className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{t.geopolitical}</h3>
                <span className="badge-ai" style={{ fontSize: '8px' }}>{t.insights}</span>
              </div>
              <div className="mb-2">
                <div className="progress-bar h-[6px] rounded-full mb-1">
                  <div className="progress-bar-fill" style={{
                    width: geoRisk.value < 0 ? '0%' : `${geoRisk.value}%`,
                    background: geoRisk.value < 0 ? 'var(--text3)' : geoRisk.value <= 30 ? 'var(--bull)' : geoRisk.value <= 60 ? 'var(--gold)' : 'var(--bear)',
                  }} />
                </div>
                <div className="flex justify-between text-[8px]" style={{ color: 'var(--text3)' }}>
                  <span>{t.low}</span><span>{t.medium}</span><span>{t.high}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-price text-xl font-bold" style={{
                  color: geoRisk.value < 0 ? 'var(--text3)' : geoRisk.value <= 30 ? 'var(--bull)' : geoRisk.value <= 60 ? 'var(--gold)' : 'var(--bear)'
                }}>
                  {geoRisk.value < 0 ? '—' : geoRisk.value}
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text2)' }}>{geoRiskLevelLabel(geoRisk.label)}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {Object.entries(geoRisk.impacts || {}).map(([key, val]: [string, any]) => (
                  <div key={key} className="text-center p-1.5 rounded-md" style={{ background: 'var(--bg4)' }}>
                    <div className="text-[8px] mb-0.5" style={{ color: 'var(--text3)' }}>
                      {key === 'oil' ? t.oil : key === 'gold' ? t.gold : t.dollar}
                    </div>
                    <div className="font-mono-price text-[10px] font-medium" style={{ color: val.trend === 'up' ? 'var(--bull)' : 'var(--bear)' }}>
                      {val.trend === 'up' ? '▲' : '▼'} {translateImpactVal(String(val.value))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Summary — only show for Arabic locale; non-Arabic locales receive Arabic text from API */}
        {sentimentData?.aiSummary && locale === 'ar' && (
          <div className="glass-card p-3 mt-2" style={{ borderInlineStart: '3px solid var(--teal)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="badge-ai" style={{ fontSize: '8px' }}>{t.aiAnalysis}</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text2)' }}>{sentimentData.aiSummary}</p>
          </div>
        )}
      </div>
    </section>
  );
}
