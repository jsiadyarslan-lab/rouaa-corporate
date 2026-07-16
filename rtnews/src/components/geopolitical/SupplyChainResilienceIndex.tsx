'use client';

import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  calculateSupplyChainResilience,
  calculateAllResilienceIndices,
  getTrackedCountries,
  type SupplyChainResilience,
  type ResilienceFactor,
  type Recommendation,
} from '@/lib/geopolitical/supply-chain-resilience';
import { getCountryName } from '@/lib/geopolitical/risk-thresholds';
import { Shield, AlertTriangle, Route, Wrench, ChevronUp, ChevronDown } from 'lucide-react';

// ─── Props ──────────────────────────────────────────────────────
interface SupplyChainResilienceIndexProps {
  locale: string;
}

// ─── Color helpers ──────────────────────────────────────────────
const RESILIENCE_COLORS: Record<string, { color: string; bg: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  low:      { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  moderate: { color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  high:     { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
};

function getResilienceColor(score: number): { color: string; bg: string } {
  if (score < 25) return RESILIENCE_COLORS.critical;
  if (score < 45) return RESILIENCE_COLORS.low;
  if (score < 65) return RESILIENCE_COLORS.moderate;
  return RESILIENCE_COLORS.high;
}

function getResilienceLevelLabel(score: number, locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    critical: { ar: 'حرج', en: 'Critical', fr: 'Critique', tr: 'Kritik', es: 'Crítico' },
    low:      { ar: 'منخفض', en: 'Low', fr: 'Faible', tr: 'Düşük', es: 'Bajo' },
    moderate: { ar: 'معتدل', en: 'Moderate', fr: 'Modéré', tr: 'Orta', es: 'Moderado' },
    high:     { ar: 'مرتفع', en: 'High', fr: 'Élevé', tr: 'Yüksek', es: 'Alto' },
  };
  const level = score < 25 ? 'critical' : score < 45 ? 'low' : score < 65 ? 'moderate' : 'high';
  return labels[level][locale] || labels[level].en;
}

function getHHIInterpretation(hhi: number, locale: string): { label: string; color: string } {
  if (hhi < 1500) {
    return {
      label:
        locale === 'ar' ? 'غير مركّز' :
        locale === 'fr' ? 'Non concentré' :
        locale === 'tr' ? 'Konsantre değil' :
        locale === 'es' ? 'No concentrado' :
        'Unconcentrated',
      color: '#22c55e',
    };
  }
  if (hhi <= 2500) {
    return {
      label:
        locale === 'ar' ? 'تركيز معتدل' :
        locale === 'fr' ? 'Concentration modérée' :
        locale === 'tr' ? 'Orta konsantrasyon' :
        locale === 'es' ? 'Concentración moderada' :
        'Moderately Concentrated',
      color: '#eab308',
    };
  }
  return {
    label:
      locale === 'ar' ? 'تركيز عالي' :
      locale === 'fr' ? 'Forte concentration' :
      locale === 'tr' ? 'Yüksek konsantrasyon' :
      locale === 'es' ? 'Alta concentración' :
      'Highly Concentrated',
    color: '#ef4444',
  };
}

function getPriorityLabel(priority: Recommendation['priority'], locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    high:   { ar: 'عالية', en: 'High', fr: 'Haute', tr: 'Yüksek', es: 'Alta' },
    medium: { ar: 'متوسطة', en: 'Medium', fr: 'Moyenne', tr: 'Orta', es: 'Media' },
    low:    { ar: 'منخفضة', en: 'Low', fr: 'Basse', tr: 'Düşük', es: 'Baja' },
  };
  return labels[priority][locale] || labels[priority].en;
}

function getPriorityColor(priority: Recommendation['priority']): string {
  switch (priority) {
    case 'high':   return '#ef4444';
    case 'medium': return '#f97316';
    case 'low':    return '#eab308';
    default:       return '#eab308';
  }
}

// ─── Country names for the tracked supply-chain countries ───────
const SC_COUNTRY_NAMES: Record<string, Record<string, string>> = {
  SA: { ar: 'السعودية', en: 'Saudi Arabia', fr: 'Arabie saoudite', tr: 'Suudi Arabistan', es: 'Arabia Saudita' },
  AE: { ar: 'الإمارات', en: 'UAE', fr: 'EAU', tr: 'BAE', es: 'EAU' },
  CN: { ar: 'الصين', en: 'China', fr: 'Chine', tr: 'Çin', es: 'China' },
  JP: { ar: 'اليابان', en: 'Japan', fr: 'Japon', tr: 'Japonya', es: 'Japón' },
  KR: { ar: 'كوريا الجنوبية', en: 'South Korea', fr: 'Corée du Sud', tr: 'Güney Kore', es: 'Corea del Sur' },
  DE: { ar: 'ألمانيا', en: 'Germany', fr: 'Allemagne', tr: 'Almanya', es: 'Alemania' },
  IN: { ar: 'الهند', en: 'India', fr: 'Inde', tr: 'Hindistan', es: 'India' },
  EG: { ar: 'مصر', en: 'Egypt', fr: 'Égypte', tr: 'Mısır', es: 'Egipto' },
  TR: { ar: 'تركيا', en: 'Turkey', fr: 'Turquie', tr: 'Türkiye', es: 'Turquía' },
  US: { ar: 'الولايات المتحدة', en: 'United States', fr: 'États-Unis', tr: 'ABD', es: 'Estados Unidos' },
  GB: { ar: 'المملكة المتحدة', en: 'United Kingdom', fr: 'Royaume-Uni', tr: 'Birleşik Krallık', es: 'Reino Unido' },
  RU: { ar: 'روسيا', en: 'Russia', fr: 'Russie', tr: 'Rusya', es: 'Rusia' },
  IQ: { ar: 'العراق', en: 'Iraq', fr: 'Irak', tr: 'Irak', es: 'Irak' },
  IR: { ar: 'إيران', en: 'Iran', fr: 'Iran', tr: 'İran', es: 'Irán' },
  AU: { ar: 'أستراليا', en: 'Australia', fr: 'Australie', tr: 'Avustralya', es: 'Australia' },
};

function getSCCountryName(code: string, locale: string): string {
  const names = SC_COUNTRY_NAMES[code];
  if (names) return names[locale] || names.en;
  // Fallback to risk-thresholds utility
  return getCountryName(code, locale);
}

// ─── Factor icon mapping ────────────────────────────────────────
const FACTOR_ICONS: Record<string, React.ElementType> = {
  hhi: AlertTriangle,
  alternatives: Route,
  adaptation: Wrench,
};

// ─── Gauge component ────────────────────────────────────────────
function ResilienceGauge({ score, locale }: { score: number; locale: string }) {
  const size = 220;
  const clamped = Math.max(0, Math.min(100, score));
  const { color } = getResilienceColor(clamped);
  const levelLabel = getResilienceLevelLabel(clamped, locale);

  const strokeWidth = size * 0.07;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const startAngle = 135;
  const endAngle = 405;
  const arcLength = endAngle - startAngle;
  const dashArray = (arcLength / 360) * circumference;
  const progressOffset = circumference * (1 - (clamped / 100) * 0.75);

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--bg4)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dashArray} ${circumference}`}
          strokeDashoffset={0}
          transform={`rotate(${startAngle} ${center} ${center})`}
        />
        {/* Foreground arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dashArray} ${circumference}`}
          strokeDashoffset={progressOffset}
          transform={`rotate(${startAngle} ${center} ${center})`}
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease',
            filter: `drop-shadow(0 0 8px ${color}55)`,
          }}
        />
        {/* Tick marks */}
        {Array.from({ length: 11 }, (_, i) => {
          const angle = startAngle + (arcLength * i) / 10;
          const rad = (angle * Math.PI) / 180;
          const innerR = radius - strokeWidth / 2 - 4;
          const outerR = radius - strokeWidth / 2 - 10;
          const x1 = center + innerR * Math.cos(rad);
          const y1 = center + innerR * Math.sin(rad);
          const x2 = center + outerR * Math.cos(rad);
          const y2 = center + outerR * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--text3)"
              strokeWidth={i % 5 === 0 ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold leading-none"
          style={{ color: 'var(--text-head)', fontSize: size * 0.24 }}
        >
          {clamped}
        </span>
        <span
          className="mt-1 font-semibold uppercase tracking-wider"
          style={{ color, fontSize: size * 0.075 }}
        >
          {levelLabel}
        </span>
      </div>
    </div>
  );
}

// ─── Factor bar component ───────────────────────────────────────
function FactorBreakdownBar({
  factor,
  locale,
}: {
  factor: ResilienceFactor;
  locale: string;
}) {
  const isRtl = locale === 'ar';
  const labelKey = factor.key as keyof typeof factor;
  const label = isRtl ? factor.labelAr : locale === 'fr' ? factor.labelFr : locale === 'tr' ? factor.labelTr : locale === 'es' ? factor.labelEs : factor.labelEn;
  const { color } = getResilienceColor(factor.value);
  const Icon = FACTOR_ICONS[factor.key] || Shield;

  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--bg4)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-md"
            style={{ background: `${color}18` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--bg5)', color: 'var(--text3)' }}>
            {(factor.weight * 100).toFixed(0)}%
          </span>
          <span className="text-sm font-bold tabular-nums" style={{ color }}>
            {factor.value}
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg5)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${factor.value}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
          }}
        />
      </div>
      <p className="text-[10px] mt-1.5" style={{ color: 'var(--text3)' }}>
        {factor.details}
      </p>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────
export default function SupplyChainResilienceIndex({ locale }: SupplyChainResilienceIndexProps) {
  const isRtl = locale === 'ar';

  const trackedCountries = useMemo(() => getTrackedCountries(), []);
  const [selectedCountry, setSelectedCountry] = useState<string>(trackedCountries[0] || 'SA');

  // Calculate resilience for selected country
  const resilience = useMemo<SupplyChainResilience>(
    () => calculateSupplyChainResilience(selectedCountry),
    [selectedCountry],
  );

  // Calculate all indices for comparison table
  const allIndices = useMemo<SupplyChainResilience[]>(
    () => calculateAllResilienceIndices(),
    [],
  );

  // Top 5 most resilient and least resilient
  const sortedByScore = useMemo(
    () => [...allIndices].sort((a, b) => b.compositeScore - a.compositeScore),
    [allIndices],
  );
  const top5 = sortedByScore.slice(0, 5);
  const bottom5 = sortedByScore.slice(-5).reverse();

  // HHI interpretation
  const hhiInterpretation = useMemo(
    () => getHHIInterpretation(resilience.chokepointDependency, locale),
    [resilience.chokepointDependency, locale],
  );

  // i18n labels
  const t = useMemo(() => {
    const dict: Record<string, Record<string, string>> = {
      title: {
        ar: 'مؤشر مرونة سلاسل التوريد',
        en: 'Supply Chain Resilience Index',
        fr: 'Indice de résilience de la chaîne d\'approvisionnement',
        tr: 'Tedarik Zinciri Dayanıklılık Endeksi',
        es: 'Índice de resiliencia de la cadena de suministro',
      },
      selectCountry: {
        ar: 'اختر الدولة',
        en: 'Select Country',
        fr: 'Sélectionner le pays',
        tr: 'Ülke seçin',
        es: 'Seleccionar país',
      },
      compositeScore: {
        ar: 'درجة المرونة المركبة',
        en: 'Composite Resilience Score',
        fr: 'Score de résilience composite',
        tr: 'Bileşik dayanıklılık puanı',
        es: 'Puntuación de resiliencia compuesta',
      },
      factorBreakdown: {
        ar: 'تفصيل العوامل',
        en: 'Factor Breakdown',
        fr: 'Décomposition des facteurs',
        tr: 'Faktör dağılımı',
        es: 'Desglose de factores',
      },
      hhiLabel: {
        ar: 'مؤشر HHI (تركيز نقاط الاختناق)',
        en: 'HHI (Chokepoint Concentration)',
        fr: 'HHI (Concentration des goulets d\'étranglement)',
        tr: 'HHI (Darboğaz konsantrasyonu)',
        es: 'HHI (Concentración de cuellos de botella)',
      },
      recommendations: {
        ar: 'التوصيات',
        en: 'Recommendations',
        fr: 'Recommandations',
        tr: 'Öneriler',
        es: 'Recomendaciones',
      },
      mostResilient: {
        ar: 'الأكثر مرونة',
        en: 'Most Resilient',
        fr: 'Plus résilient',
        tr: 'En dayanıklı',
        es: 'Más resiliente',
      },
      leastResilient: {
        ar: 'الأقل مرونة',
        en: 'Least Resilient',
        fr: 'Moins résilient',
        tr: 'En az dayanıklı',
        es: 'Menos resiliente',
      },
      score: {
        ar: 'الدرجة',
        en: 'Score',
        fr: 'Score',
        tr: 'Puan',
        es: 'Puntuación',
      },
      country: {
        ar: 'الدولة',
        en: 'Country',
        fr: 'Pays',
        tr: 'Ülke',
        es: 'País',
      },
      impact: {
        ar: 'التأثير',
        en: 'Impact',
        fr: 'Impact',
        tr: 'Etki',
        es: 'Impacto',
      },
      priority: {
        ar: 'الأولوية',
        en: 'Priority',
        fr: 'Priorité',
        tr: 'Öncelik',
        es: 'Prioridad',
      },
      hhiScale: {
        ar: '< 1500 غير مركّز | 1500–2500 معتدل | > 2500 عالي',
        en: '< 1500 Unconcentrated | 1500–2500 Moderate | > 2500 High',
        fr: '< 1500 Non concentré | 1500–2500 Modéré | > 2500 Élevé',
        tr: '< 1500 Konsantre değil | 1500–2500 Orta | > 2500 Yüksek',
        es: '< 1500 No concentrado | 1500–2500 Moderado | > 2500 Alto',
      },
    };
    return (key: string) => dict[key]?.[locale] || dict[key]?.en || key;
  }, [locale]);

  const { color: scoreColor, bg: scoreBg } = getResilienceColor(resilience.compositeScore);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: 'var(--bg2)', borderColor: 'var(--rim)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b"
        style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ background: `${scoreColor}18` }}
          >
            <Shield className="w-5 h-5" style={{ color: scoreColor }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-head)' }}>
              {t('title')}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
              {t('compositeScore')}
            </p>
          </div>
        </div>

        {/* Country selector */}
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger
            className="w-full sm:w-[200px]"
            style={{
              background: 'var(--bg4)',
              borderColor: 'var(--rim)',
              color: 'var(--text)',
            }}
          >
            <SelectValue placeholder={t('selectCountry')} />
          </SelectTrigger>
          <SelectContent
            style={{ background: 'var(--bg2)', borderColor: 'var(--rim)' }}
          >
            {trackedCountries.map((code) => (
              <SelectItem
                key={code}
                value={code}
                style={{ color: 'var(--text)' }}
              >
                {getSCCountryName(code, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* ─── Gauge + HHI Summary Row ──────────────────────────── */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
          {/* Gauge */}
          <div className="flex flex-col items-center">
            <ResilienceGauge score={resilience.compositeScore} locale={locale} />
          </div>

          {/* HHI + Quick Stats */}
          <div className="flex-1 w-full space-y-3">
            {/* Country name banner */}
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-2"
              style={{ background: scoreBg }}
            >
              <span className="text-sm font-bold" style={{ color: scoreColor }}>
                {getSCCountryName(selectedCountry, locale)}
              </span>
              <span className="text-xs" style={{ color: 'var(--text3)' }}>
                —
              </span>
              <span className="text-xs font-medium" style={{ color: scoreColor }}>
                {getResilienceLevelLabel(resilience.compositeScore, locale)}
              </span>
            </div>

            {/* HHI display */}
            <div
              className="rounded-lg p-3"
              style={{ background: 'var(--bg4)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>
                  {t('hhiLabel')}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: hhiInterpretation.color }}
                  >
                    {resilience.chokepointDependency.toLocaleString()}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${hhiInterpretation.color}20`,
                      color: hhiInterpretation.color,
                    }}
                  >
                    {hhiInterpretation.label}
                  </span>
                </div>
              </div>
              {/* HHI Scale bar */}
              <div className="relative h-2 rounded-full overflow-hidden mt-2" style={{ background: 'var(--bg5)' }}>
                {/* Gradient from green to yellow to red */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, #22c55e, #eab308 50%, #ef4444)',
                    opacity: 0.3,
                  }}
                />
                {/* Marker for current HHI (0-10000 mapped to 0-100%) */}
                <div
                  className="absolute top-0 h-full w-1 rounded-full"
                  style={{
                    left: `${Math.min(100, (resilience.chokepointDependency / 10000) * 100)}%`,
                    background: hhiInterpretation.color,
                    boxShadow: `0 0 6px ${hhiInterpretation.color}`,
                  }}
                />
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: 'var(--text3)' }}>
                {t('hhiScale')}
              </p>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: isRtl ? 'مركّز HHI' : locale === 'fr' ? 'HHI norm.' : locale === 'tr' ? 'HHI norm.' : locale === 'es' ? 'HHI norm.' : 'HHI norm.',
                  value: resilience.factors[0]?.value ?? 0,
                  key: 'hhi',
                },
                {
                  label: isRtl ? 'بدائل' : locale === 'fr' ? 'Alternatives' : locale === 'tr' ? 'Alternatifler' : locale === 'es' ? 'Alternativas' : 'Alternatives',
                  value: resilience.alternativeRouteScore,
                  key: 'alternatives',
                },
                {
                  label: isRtl ? 'تكيف' : locale === 'fr' ? 'Adaptation' : locale === 'tr' ? 'Uyum' : locale === 'es' ? 'Adaptación' : 'Adaptation',
                  value: resilience.adaptationCapacity,
                  key: 'adaptation',
                },
              ].map((stat) => {
                const { color: statColor } = getResilienceColor(stat.value);
                return (
                  <div
                    key={stat.key}
                    className="rounded-lg p-2.5 text-center"
                    style={{ background: 'var(--bg4)' }}
                  >
                    <p className="text-[10px] mb-1" style={{ color: 'var(--text3)' }}>
                      {stat.label}
                    </p>
                    <p className="text-lg font-bold tabular-nums" style={{ color: statColor }}>
                      {stat.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Factor Breakdown ───────────────────────────────────── */}
        <section>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-head)' }}>
            {t('factorBreakdown')}
          </h3>
          <div className="space-y-2">
            {resilience.factors.map((factor) => (
              <FactorBreakdownBar key={factor.key} factor={factor} locale={locale} />
            ))}
          </div>
        </section>

        {/* ─── Recommendations ────────────────────────────────────── */}
        {resilience.recommendations.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-head)' }}>
              {t('recommendations')}
            </h3>
            <div
              className="space-y-2 max-h-72 overflow-y-auto"
              style={{ scrollbarWidth: 'thin' }}
            >
              {resilience.recommendations.map((rec, idx) => {
                const pColor = getPriorityColor(rec.priority);
                const actionText = isRtl ? rec.actionAr : rec.actionEn;
                const chokepointName = isRtl ? rec.chokepointNameAr : rec.chokepointNameEn;
                return (
                  <div
                    key={`${rec.chokepointId}-${idx}`}
                    className="flex items-start gap-3 rounded-lg p-3 border"
                    style={{
                      background: 'var(--bg4)',
                      borderColor: `${pColor}30`,
                    }}
                  >
                    {/* Priority badge */}
                    <span
                      className="shrink-0 mt-0.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{
                        background: `${pColor}20`,
                        color: pColor,
                      }}
                    >
                      {getPriorityLabel(rec.priority, locale)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                        {actionText}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                          {chokepointName}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                          •
                        </span>
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: pColor }}
                        >
                          {t('impact')}: +{rec.impactScore}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Comparison Tables ──────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Most Resilient */}
            <div
              className="rounded-lg border overflow-hidden"
              style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2 border-b"
                style={{ background: 'var(--bg4)', borderColor: 'var(--rim)' }}
              >
                <ChevronUp className="w-4 h-4" style={{ color: '#22c55e' }} />
                <span className="text-xs font-semibold" style={{ color: '#22c55e' }}>
                  {t('mostResilient')}
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--rim)' }}>
                {top5.map((item, idx) => {
                  const { color: itemColor } = getResilienceColor(item.compositeScore);
                  const isSelected = item.countryCode === selectedCountry;
                  return (
                    <div
                      key={item.countryCode}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer transition-colors hover:opacity-80"
                      style={{
                        background: isSelected ? `${itemColor}10` : 'transparent',
                        borderColor: 'var(--rim)',
                      }}
                      onClick={() => setSelectedCountry(item.countryCode)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold w-5 text-center"
                          style={{ color: 'var(--text3)' }}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>
                          {getSCCountryName(item.countryCode, locale)}
                        </span>
                      </div>
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: itemColor }}
                      >
                        {item.compositeScore}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Least Resilient */}
            <div
              className="rounded-lg border overflow-hidden"
              style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2 border-b"
                style={{ background: 'var(--bg4)', borderColor: 'var(--rim)' }}
              >
                <ChevronDown className="w-4 h-4" style={{ color: '#ef4444' }} />
                <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>
                  {t('leastResilient')}
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--rim)' }}>
                {bottom5.map((item, idx) => {
                  const { color: itemColor } = getResilienceColor(item.compositeScore);
                  const isSelected = item.countryCode === selectedCountry;
                  return (
                    <div
                      key={item.countryCode}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer transition-colors hover:opacity-80"
                      style={{
                        background: isSelected ? `${itemColor}10` : 'transparent',
                        borderColor: 'var(--rim)',
                      }}
                      onClick={() => setSelectedCountry(item.countryCode)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold w-5 text-center"
                          style={{ color: 'var(--text3)' }}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>
                          {getSCCountryName(item.countryCode, locale)}
                        </span>
                      </div>
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: itemColor }}
                      >
                        {item.compositeScore}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
