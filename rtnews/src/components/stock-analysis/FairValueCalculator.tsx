'use client';

// ─── Fair Value Calculator ────────────────────────────────────
// Shows fair value estimation based on multiple methods:
// DCF, P/E Ratio, Price Target consensus.
// Each method displayed as a card with estimated value & upside/downside %.
// Visual bar comparing current price (dotted line) vs estimates.

import type { Locale } from '@/lib/locale';

// ── Locale Labels ──
const LABELS: Record<string, Record<string, string>> = {
  en: {
    fairValueCalculator: 'Fair Value Calculator',
    estimatedValue: 'Estimated Value',
    upside: 'Upside',
    downside: 'Downside',
    dcfMethod: 'DCF Model',
    peMethod: 'P/E Ratio Method',
    targetMethod: 'Price Target Consensus',
    currentPrice: 'Current Price',
    undervalued: 'Undervalued',
    overvalued: 'Overvalued',
    fairlyValued: 'Fairly Valued',
    sectorAvgPE: 'Sector Avg P/E',
    eps: 'EPS',
    noData: 'Insufficient data for estimation',
    vsCurrent: 'vs Current',
    peRatio: 'P/E Ratio',
    method: 'Method',
  },
  ar: {
    fairValueCalculator: 'حاسبة القيمة العادلة',
    estimatedValue: 'القيمة المقدرة',
    upside: 'ارتفاع متوقع',
    downside: 'انخفاض متوقع',
    dcfMethod: 'نموذج التدفقات المخصومة',
    peMethod: 'طريقة نسبة م/ر',
    targetMethod: 'إجماع الأهداف السعرية',
    currentPrice: 'السعر الحالي',
    undervalued: 'مُقيّم بأقل',
    overvalued: 'مُقيّم بأكثر',
    fairlyValued: 'تقييم عادل',
    sectorAvgPE: 'متوسط م/ر القطاع',
    eps: 'ربحية السهم',
    noData: 'بيانات غير كافية للتقدير',
    vsCurrent: 'مقابل الحالي',
    peRatio: 'نسبة م/ر',
    method: 'الطريقة',
  },
  fr: {
    fairValueCalculator: 'Calculateur de Valeur Juste',
    estimatedValue: 'Valeur Estimée',
    upside: 'Potentiel',
    downside: 'Risque',
    dcfMethod: 'Modèle DCF',
    peMethod: 'Méthode P/E',
    targetMethod: 'Consensus des Objectifs',
    currentPrice: 'Prix Actuel',
    undervalued: 'Sous-évalué',
    overvalued: 'Surévalué',
    fairlyValued: 'Justement Évalué',
    sectorAvgPE: 'P/E Moy. Secteur',
    eps: 'BPA',
    noData: 'Données insuffisantes',
    vsCurrent: 'vs Actuel',
    peRatio: 'Ratio P/E',
    method: 'Méthode',
  },
  tr: {
    fairValueCalculator: 'Adil Değer Hesaplayıcı',
    estimatedValue: 'Tahmini Değer',
    upside: 'Yukarı Potansiyel',
    downside: 'Aşağı Risk',
    dcfMethod: 'DCF Modeli',
    peMethod: 'F/K Yöntemi',
    targetMethod: 'Fiyat Hedefi Konsensüsü',
    currentPrice: 'Mevcut Fiyat',
    undervalued: 'Düşük Değerlenmiş',
    overvalued: 'Yüksek Değerlenmiş',
    fairlyValued: 'Adil Değerlenmiş',
    sectorAvgPE: 'Sektör Ort. F/K',
    eps: 'HBE',
    noData: 'Tahmin için yetersiz veri',
    vsCurrent: 'Mevcute Göre',
    peRatio: 'F/K Oranı',
    method: 'Yöntem',
  },
  es: {
    fairValueCalculator: 'Calculadora de Valor Justo',
    estimatedValue: 'Valor Estimado',
    upside: 'Potencial de Subida',
    downside: 'Riesgo de Bajada',
    dcfMethod: 'Modelo DCF',
    peMethod: 'Método de Ratio P/E',
    targetMethod: 'Consenso de Objetivos de Precio',
    currentPrice: 'Precio Actual',
    undervalued: 'Subvalorado',
    overvalued: 'Sobrevalorado',
    fairlyValued: 'Justamente Valorado',
    sectorAvgPE: 'P/E Prom. Sector',
    eps: 'BPA',
    noData: 'Datos insuficientes para la estimación',
    vsCurrent: 'vs Actual',
    peRatio: 'Ratio P/E',
    method: 'Método',
  },
};

interface Props {
  stockRating: any;
  priceTarget: any;
  currentPrice: number;
  fundamentals: any;
  locale: Locale;
}

export default function FairValueCalculator({ stockRating, priceTarget, currentPrice, fundamentals, locale }: Props) {
  const t = LABELS[locale] || LABELS.en;
  const isRTL = locale === 'ar';

  const fmt = (n: number, dec = 2) => n?.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) ?? '—';

  // Method 1: DCF
  const dcfValue = stockRating?.dcf || stockRating?.dcfFairValue || null;

  // Method 2: P/E Ratio Method (sector avg P/E × EPS)
  const eps = fundamentals?.eps;
  const peRatio = fundamentals?.peRatio;
  const sectorAvgPE = fundamentals?.sectorPE || 20; // default 20 if unknown
  const peFairValue = eps && eps > 0 ? sectorAvgPE * eps : null;

  // Method 3: Price Target consensus (median)
  const targetMedian = priceTarget?.targetMedian || priceTarget?.targetMedianFwd || null;

  // Build methods array
  const methods = [
    {
      name: t.dcfMethod,
      value: dcfValue,
      detail: 'DCF',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
        </svg>
      ),
      color: 'var(--cyan)',
      colorBg: 'var(--cyan2)',
    },
    {
      name: t.peMethod,
      value: peFairValue,
      detail: `${t.sectorAvgPE}: ${sectorAvgPE} | ${t.eps}: ${eps ? `$${fmt(eps)}` : '—'}`,
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
      ),
      color: 'var(--gold)',
      colorBg: 'var(--gold2)',
    },
    {
      name: t.targetMethod,
      value: targetMedian,
      detail: t.targetMethod,
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 5-9" />
        </svg>
      ),
      color: 'var(--bull)',
      colorBg: 'var(--bull2)',
    },
  ];

  const validMethods = methods.filter(m => m.value !== null);
  const hasAnyData = validMethods.length > 0;

  // No data state
  if (!hasAnyData) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="glass-card" style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.fairValueCalculator}</span>
        </div>
        <div style={{ textAlign: 'center', padding: 24, borderRadius: 8, background: 'var(--bg)', color: 'var(--text3)', fontSize: 13 }}>
          {t.noData}
        </div>
      </div>
    );
  }

  // Visual bar scale: min to max of all values + current price
  const allValues = [...validMethods.map(m => m.value as number), currentPrice];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const padding = range * 0.1;
  const scaleMin = minVal - padding;
  const scaleMax = maxVal + padding;
  const scaleRange = scaleMax - scaleMin;

  const getPosition = (val: number) => ((val - scaleMin) / scaleRange) * 100;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="glass-card" style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.fairValueCalculator}</span>
      </div>

      {/* ── Visual Comparison Bar ── */}
      <div style={{ padding: '16px', borderRadius: 10, background: 'var(--bg)', marginBottom: 16, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginBottom: 12 }}>{t.vsCurrent}</div>

        {/* Scale bar */}
        <div style={{ position: 'relative', height: 40, borderRadius: 6, background: 'var(--bg5)', marginBottom: 8 }}>
          {/* Method markers */}
          {validMethods.map(m => (
            <div key={m.name} style={{
              position: 'absolute', top: 4, bottom: 4,
              left: isRTL ? undefined : `${getPosition(m.value as number)}%`,
              right: isRTL ? `${getPosition(m.value as number)}%` : undefined,
              width: 8, transform: 'translateX(-4px)',
              background: m.color, borderRadius: 4,
              opacity: 0.8,
            }} />
          ))}
          {/* Current price dotted line */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: isRTL ? undefined : `${getPosition(currentPrice)}%`,
            right: isRTL ? `${getPosition(currentPrice)}%` : undefined,
            width: 2, borderLeft: '2px dashed var(--text-head)',
            transform: 'translateX(-1px)', opacity: 0.5, zIndex: 2,
          }} />
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          {validMethods.map(m => (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
              <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{m.name}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 2, borderTop: '2px dashed var(--text-head)', opacity: 0.5 }} />
            <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{t.currentPrice}</span>
          </div>
        </div>
      </div>

      {/* ── Method Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {validMethods.map(m => {
          const diff = ((m.value! - currentPrice) / currentPrice) * 100;
          const color = diff > 5 ? 'var(--bull)' : diff < -5 ? 'var(--bear)' : 'var(--gold)';
          const assessmentLabel = diff > 5 ? t.undervalued : diff < -5 ? t.overvalued : t.fairlyValued;
          return (
            <div key={m.name} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg)', border: `1px solid var(--border)` }}>
              {/* Method header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: m.colorBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                    {m.icon}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)' }}>{m.name}</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color, fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                  ${fmt(m.value!)}
                </span>
              </div>

              {/* Upside/downside */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{m.detail}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color, padding: '2px 6px', borderRadius: 4, background: `${color}15`, border: `1px solid ${color}30` }}>
                    {assessmentLabel}
                  </span>
                </div>
              </div>

              {/* Mini visual bar */}
              <div style={{ position: 'relative', height: 4, borderRadius: 2, background: 'var(--bg5)', overflow: 'hidden' }}>
                {/* Estimate bar */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: Math.min(getPosition(currentPrice), getPosition(m.value!)),
                  width: `${Math.abs(getPosition(m.value!) - getPosition(currentPrice))}%`,
                  background: color, borderRadius: 2, opacity: 0.4,
                }} />
                {/* Current price marker */}
                <div style={{
                  position: 'absolute', top: -2, bottom: -2,
                  left: `${getPosition(currentPrice)}%`,
                  width: 2, borderLeft: '2px dashed var(--text-head)',
                  opacity: 0.4, zIndex: 1,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
