'use client';

// ─── AI Recommendations Section ────────────────────────────────
// Shows AI-generated buy/sell/hold recommendation with reasoning,
// DCF fair value comparison, and analyst consensus price targets.

import type { Locale } from '@/lib/locale';

// ── Locale Labels ──
const LABELS: Record<string, Record<string, string>> = {
  en: {
    aiRecommendation: 'AI Recommendation',
    dcfFairValue: 'DCF Fair Value',
    currentPrice: 'Current Price',
    upside: 'Upside',
    downside: 'Downside',
    analystConsensus: 'Analyst Consensus',
    targetLow: 'Low',
    targetMedian: 'Median',
    targetHigh: 'High',
    targetAvg: 'Average',
    keyFactors: 'Key Factors',
    vsCurrent: 'vs Current',
    noRating: 'No rating available',
    noPriceTarget: 'No price targets available',
    undervalued: 'Undervalued',
    overvalued: 'Overvalued',
    fairlyValued: 'Fairly Valued',
    bullFactors: 'Bullish Factors',
    bearFactors: 'Bearish Factors',
    loading: 'Loading recommendation...',
    error: 'Failed to load recommendation',
    priceTargets: 'Price Targets',
  },
  ar: {
    aiRecommendation: 'توصية الذكاء الاصطناعي',
    dcfFairValue: 'القيمة العادلة DCF',
    currentPrice: 'السعر الحالي',
    upside: 'ارتفاع متوقع',
    downside: 'انخفاض متوقع',
    analystConsensus: 'إجماع المحللين',
    targetLow: 'الأدنى',
    targetMedian: 'الوسيط',
    targetHigh: 'الأعلى',
    targetAvg: 'المتوسط',
    keyFactors: 'العوامل الرئيسية',
    vsCurrent: 'مقابل الحالي',
    noRating: 'لا يوجد تقييم متاح',
    noPriceTarget: 'لا توجد أهداف سعرية متاحة',
    undervalued: 'مُقيّم بأقل من قيمته',
    overvalued: 'مُقيّم بأكثر من قيمته',
    fairlyValued: 'تقييم عادل',
    bullFactors: 'عوامل صاعدة',
    bearFactors: 'عوامل هابطة',
    loading: 'جارٍ تحميل التوصية...',
    error: 'فشل تحميل التوصية',
    priceTargets: 'الأهداف السعرية',
  },
  fr: {
    aiRecommendation: "Recommandation IA",
    dcfFairValue: 'Valeur Juste DCF',
    currentPrice: 'Prix Actuel',
    upside: 'Potentiel',
    downside: 'Risque',
    analystConsensus: 'Consensus Analystes',
    targetLow: 'Bas',
    targetMedian: 'Médian',
    targetHigh: 'Haut',
    targetAvg: 'Moyen',
    keyFactors: 'Facteurs Clés',
    vsCurrent: 'vs Actuel',
    noRating: 'Aucune évaluation disponible',
    noPriceTarget: 'Aucun objectif de prix disponible',
    undervalued: 'Sous-évalué',
    overvalued: 'Surévalué',
    fairlyValued: 'Justement Évalué',
    bullFactors: 'Facteurs Haussiers',
    bearFactors: 'Facteurs Baissiers',
    loading: 'Chargement de la recommandation...',
    error: 'Échec du chargement',
    priceTargets: 'Objectifs de Prix',
  },
  tr: {
    aiRecommendation: 'Yapay Zeka Tavsiyesi',
    dcfFairValue: 'DCF Adil Değer',
    currentPrice: 'Mevcut Fiyat',
    upside: 'Yukarı Potansiyel',
    downside: 'Aşağı Risk',
    analystConsensus: 'Analist Konsensüsü',
    targetLow: 'Düşük Hedef',
    targetMedian: 'Medyan Hedef',
    targetHigh: 'Yüksek Hedef',
    targetAvg: 'Ortalama Hedef',
    keyFactors: 'Temel Faktörler',
    vsCurrent: 'Mevcute Göre',
    noRating: 'Değerlendirme mevcut değil',
    noPriceTarget: 'Fiyat hedefi mevcut değil',
    undervalued: 'Düşük Değerlenmiş',
    overvalued: 'Yüksek Değerlenmiş',
    fairlyValued: 'Adil Değerlenmiş',
    bullFactors: 'Yükseliş Faktörleri',
    bearFactors: 'Düşüş Faktörleri',
    loading: 'Tavsiye yükleniyor...',
    error: 'Tavsiye yüklenemedi',
    priceTargets: 'Fiyat Hedefleri',
  },
  es: {
    aiRecommendation: 'Recomendación IA',
    dcfFairValue: 'Valor Justo DCF',
    currentPrice: 'Precio Actual',
    upside: 'Potencial de Subida',
    downside: 'Riesgo de Bajada',
    analystConsensus: 'Consenso de Analistas',
    targetLow: 'Mínimo',
    targetMedian: 'Mediana',
    targetHigh: 'Máximo',
    targetAvg: 'Promedio',
    keyFactors: 'Factores Clave',
    vsCurrent: 'vs Actual',
    noRating: 'No hay calificación disponible',
    noPriceTarget: 'No hay objetivos de precio disponibles',
    undervalued: 'Subvalorado',
    overvalued: 'Sobrevalorado',
    fairlyValued: 'Justamente Valorado',
    bullFactors: 'Factores Alcistas',
    bearFactors: 'Factores Bajistas',
    loading: 'Cargando recomendación...',
    error: 'Error al cargar la recomendación',
    priceTargets: 'Objetivos de Precio',
  },
};

// ── Rating Color Map ──
const RATING_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  'strong buy':  { text: '#15803d', bg: 'rgba(21,128,61,0.15)',  border: 'rgba(21,128,61,0.3)' },
  'buy':         { text: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)' },
  'hold':        { text: '#eab308', bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.25)' },
  'sell':        { text: '#ef5350', bg: 'rgba(239,83,80,0.12)',   border: 'rgba(239,83,80,0.25)' },
  'strong sell': { text: '#991b1b', bg: 'rgba(153,27,27,0.15)',   border: 'rgba(153,27,27,0.3)' },
};

function getRatingStyle(rating: string) {
  const r = (rating || '').toLowerCase();
  if (r.includes('strong buy')) return RATING_COLORS['strong buy'];
  if (r.includes('buy')) return RATING_COLORS['buy'];
  if (r.includes('hold')) return RATING_COLORS['hold'];
  if (r.includes('strong sell')) return RATING_COLORS['strong sell'];
  if (r.includes('sell')) return RATING_COLORS['sell'];
  return { text: 'var(--text3)', bg: 'var(--bg4)', border: 'var(--border)' };
}

interface Props {
  stockRating: any;
  priceTarget: any;
  currentPrice: number;
  locale: Locale;
}

export default function AIRecommendations({ stockRating, priceTarget, currentPrice, locale }: Props) {
  const t = LABELS[locale] || LABELS.en;
  const isRTL = locale === 'ar';

  // Extract data
  const rating = stockRating?.ratingRecommendation || stockRating?.rating;
  const dcfFairValue = stockRating?.dcf || stockRating?.dcfFairValue;
  const ratingScore = stockRating?.ratingScore;

  const priceTargetLow = priceTarget?.targetLow || priceTarget?.targetLowFwd;
  const priceTargetMedian = priceTarget?.targetMedian || priceTarget?.targetMedianFwd;
  const priceTargetHigh = priceTarget?.targetHigh || priceTarget?.targetHighFwd;
  const priceTargetAvg = priceTarget?.targetAvg || priceTarget?.targetAvgFwd;

  const fmt = (n: number, dec = 2) => n?.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) ?? '—';

  // Rating style
  const ratingStyle = getRatingStyle(rating);

  // DCF comparison
  const dcfDiff = dcfFairValue && currentPrice ? ((dcfFairValue - currentPrice) / currentPrice) * 100 : null;
  const valuationLabel = dcfDiff !== null
    ? dcfDiff > 5 ? t.undervalued : dcfDiff < -5 ? t.overvalued : t.fairlyValued
    : null;
  const valuationColor = dcfDiff !== null
    ? dcfDiff > 5 ? 'var(--bull)' : dcfDiff < -5 ? 'var(--bear)' : 'var(--gold)'
    : 'var(--text3)';

  // Key factors from stockRating
  const bullFactors: string[] = stockRating?.bullFactors || stockRating?.bullishFactors || [];
  const bearFactors: string[] = stockRating?.bearFactors || stockRating?.bearishFactors || [];

  // Price target range for visual bar
  const allTargetValues = [priceTargetLow, priceTargetMedian, priceTargetHigh, priceTargetAvg, currentPrice].filter((v): v is number => v != null);
  const targetMin = allTargetValues.length > 0 ? Math.min(...allTargetValues) : 0;
  const targetMax = allTargetValues.length > 0 ? Math.max(...allTargetValues) : 0;
  const targetRange = targetMax - targetMin || 1;

  const getBarPosition = (val: number) => ((val - targetMin) / targetRange) * 100;

  // Error state
  if (!stockRating && !priceTarget) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="glass-card" style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 2v10l6.5-6.5" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.aiRecommendation}</span>
        </div>
        <div style={{ textAlign: 'center', padding: 24, borderRadius: 8, background: 'var(--bg)', color: 'var(--text3)', fontSize: 13 }}>
          {t.noRating}
        </div>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="glass-card" style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 2v10l6.5-6.5" />
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.aiRecommendation}</span>
      </div>

      {/* ── Large Recommendation Badge ── */}
      {rating ? (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-block', padding: '14px 40px', borderRadius: 12,
            background: ratingStyle.bg, border: `2px solid ${ratingStyle.border}`,
            fontSize: 24, fontWeight: 800, color: ratingStyle.text,
            letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            {rating}
          </div>
          {ratingScore && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
              {t.keyFactors}: <span style={{ fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>{ratingScore}/5</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginBottom: 24, padding: 20, borderRadius: 10, background: 'var(--bg)', color: 'var(--text3)', fontSize: 13, border: '1px solid var(--border)' }}>
          {t.noRating}
        </div>
      )}

      {/* ── DCF Fair Value vs Current Price ── */}
      {dcfFairValue && currentPrice ? (
        <div style={{ padding: '16px', borderRadius: 10, background: 'var(--bg)', marginBottom: 16, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{t.dcfFairValue}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
              ${fmt(dcfFairValue)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{t.currentPrice}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
              ${fmt(currentPrice)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: valuationColor }}>{valuationLabel}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: valuationColor, fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
              {dcfDiff !== null ? `${dcfDiff > 0 ? '+' : ''}${dcfDiff.toFixed(1)}% ${dcfDiff > 0 ? t.upside : t.downside}` : '—'}
            </span>
          </div>
        </div>
      ) : null}

      {/* ── Analyst Consensus Price Targets as Visual Bars ── */}
      {priceTargetMedian ? (
        <div style={{ padding: '16px', borderRadius: 10, background: 'var(--bg)', marginBottom: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 14 }}>{t.analystConsensus}</div>

          {/* Visual range bar */}
          <div style={{ position: 'relative', height: 32, borderRadius: 6, background: 'var(--bg5)', marginBottom: 12, overflow: 'hidden' }}>
            {/* Target range fill (low to high) */}
            {priceTargetLow && priceTargetHigh && (
              <div style={{
                position: 'absolute', top: 4, bottom: 4,
                left: `${getBarPosition(priceTargetLow)}%`,
                right: `${100 - getBarPosition(priceTargetHigh)}%`,
                background: 'linear-gradient(90deg, var(--bear2), var(--gold2), var(--bull2))',
                borderRadius: 4, opacity: 0.7,
              }} />
            )}
            {/* Median marker */}
            {priceTargetMedian && (
              <div style={{
                position: 'absolute', top: 2, bottom: 2,
                left: `${getBarPosition(priceTargetMedian)}%`,
                width: 3, background: 'var(--gold)', borderRadius: 2,
                transform: 'translateX(-1px)',
              }} />
            )}
            {/* Average marker */}
            {priceTargetAvg && (
              <div style={{
                position: 'absolute', top: 2, bottom: 2,
                left: `${getBarPosition(priceTargetAvg)}%`,
                width: 3, background: 'var(--cyan)', borderRadius: 2,
                transform: 'translateX(-1px)',
              }} />
            )}
            {/* Current price dotted line */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${getBarPosition(currentPrice)}%`,
              width: 2, borderLeft: '2px dashed var(--text-head)',
              transform: 'translateX(-1px)', opacity: 0.6,
            }} />
          </div>

          {/* Target values grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {priceTargetLow && (
              <div style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--bg2)' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{t.targetLow}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--bear)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>${fmt(priceTargetLow)}</div>
              </div>
            )}
            {priceTargetMedian && (
              <div style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--bg2)' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{t.targetMedian}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>${fmt(priceTargetMedian)}</div>
              </div>
            )}
            {priceTargetHigh && (
              <div style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--bg2)' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{t.targetHigh}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--bull)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>${fmt(priceTargetHigh)}</div>
              </div>
            )}
            {priceTargetAvg && (
              <div style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--bg2)' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{t.targetAvg}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>${fmt(priceTargetAvg)}</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: 16, borderRadius: 10, background: 'var(--bg)', marginBottom: 16, border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
          {t.noPriceTarget}
        </div>
      )}

      {/* ── Key Factors ── */}
      {(bullFactors.length > 0 || bearFactors.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: bullFactors.length > 0 && bearFactors.length > 0 ? '1fr 1fr' : '1fr', gap: 12 }}>
          {bullFactors.length > 0 && (
            <div style={{ padding: '12px', borderRadius: 8, background: 'var(--bull2)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bull)', marginBottom: 8 }}>{t.bullFactors}</div>
              {bullFactors.map((f: string, i: number) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'flex', gap: 4 }}>
                  <span style={{ color: 'var(--bull)' }}>▲</span> {f}
                </div>
              ))}
            </div>
          )}
          {bearFactors.length > 0 && (
            <div style={{ padding: '12px', borderRadius: 8, background: 'var(--bear2)', border: '1px solid rgba(239,83,80,0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bear)', marginBottom: 8 }}>{t.bearFactors}</div>
              {bearFactors.map((f: string, i: number) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'flex', gap: 4 }}>
                  <span style={{ color: 'var(--bear)' }}>▼</span> {f}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
