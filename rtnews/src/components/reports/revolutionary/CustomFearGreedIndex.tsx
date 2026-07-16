'use client';

import { useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════
// Revolutionary Addition #6: Custom Fear & Greed Index
// A composite index calculated from the report's data:
// market impact, confidence, sector sentiment, and volatility.
// Visual gauge with animated needle.
// ═══════════════════════════════════════════════════════════════

interface Props {
  marketImpact: string;
  confidenceScore: number;
  sectors: string[];
  keyIndicators: Record<string, any>;
  locale?: 'en' | 'fr' | 'ar' | 'tr' | 'es';
}

const LABELS: Record<string, Record<string, string>> = {
  en: {
    title: 'Custom Fear & Greed Index',
    extremeFear: 'Extreme Fear',
    fear: 'Fear',
    neutral: 'Neutral',
    greed: 'Greed',
    extremeGreed: 'Extreme Greed',
    components: 'Index Components',
    marketMomentum: 'Market Momentum',
    confidence: 'Confidence Level',
    sectorBreadth: 'Sector Breadth',
    volatility: 'Volatility Signal',
    interpretation: 'Interpretation',
    fearInterp: 'Market participants are exhibiting fear — potential buying opportunity for contrarians',
    neutralInterp: 'Market is balanced — wait for clearer signals before making significant moves',
    greedInterp: 'Market participants are showing greed — consider reducing exposure and tightening stops',
  },
  fr: {
    title: 'Indice Personnalisé Peur & Avidité',
    extremeFear: 'Peur Extrême',
    fear: 'Peur',
    neutral: 'Neutre',
    greed: 'Avidité',
    extremeGreed: 'Avidité Extrême',
    components: 'Composants de l\'Indice',
    marketMomentum: 'Élan du Marché',
    confidence: 'Niveau de Confiance',
    sectorBreadth: 'Ampleur Sectorielle',
    volatility: 'Signal de Volatilité',
    interpretation: 'Interprétation',
    fearInterp: 'Les participants au marché manifestent de la peur — opportunité d\'achat potentielle pour les contrariens',
    neutralInterp: 'Le marché est équilibré — attendez des signaux plus clairs avant de prendre des positions importantes',
    greedInterp: 'Les participants au marché font preuve d\'avidité — envisagez de réduire l\'exposition et de resserrer les stops',
  },
  ar: {
    title: 'مؤشر الخوف والجشع المخصص',
    extremeFear: 'خوف شديد',
    fear: 'خوف',
    neutral: 'محايد',
    greed: 'جشع',
    extremeGreed: 'جشع شديد',
    components: 'مكونات المؤشر',
    marketMomentum: 'زخم السوق',
    confidence: 'مستوى الثقة',
    sectorBreadth: 'اتساع القطاعات',
    volatility: 'إشارة التقلب',
    interpretation: 'التفسير',
    fearInterp: 'المشاركون في السوق يظهرون الخوف — فرصة شراء محتملة للمضاربين المعاكسين',
    neutralInterp: 'السوق متوازن — انتظر إشارات أوضح قبل اتخاذ خطوات كبيرة',
    greedInterp: 'المشاركون في السوق يظهرون الجشع — فكر في تقليل المخاطر وتضييق وقف الخسارة',
  },
  tr: {
    title: 'Özel Korku ve Açgözlülük Endeksi',
    extremeFear: 'Aşırı Korku',
    fear: 'Korku',
    neutral: 'Orta Dikkat',
    greed: 'Açgözlülük',
    extremeGreed: 'Aşırı Açgözlülük',
    components: 'Endeks Bileşenleri',
    marketMomentum: 'Piyasa Momentumu',
    confidence: 'Güven Seviyesi',
    sectorBreadth: 'Sektör Genişliği',
    volatility: 'Oynaklık Sinyali',
    interpretation: 'Yorum',
    fearInterp: 'Piyasa katılımcıları korku gösteriyor — tersine yatırım yapanlar için alım fırsatı olabilir',
    neutralInterp: 'Piyasa dengede — önemli hamleler yapmadan önce daha net sinyaller bekleyin',
    greedInterp: 'Piyasa katılımcıları açgözlülük gösteriyor — maruziyeti azaltmayı ve zarar durdurmayı sıkılaştırmayı düşünün',
  },
  es: {
    title: 'Índice de Miedo y Codicia',
    extremeFear: 'Miedo Extremo',
    fear: 'Miedo',
    neutral: 'Neutral',
    greed: 'Codicia',
    extremeGreed: 'Codicia Extrema',
    components: 'Componentes del Índice',
    marketMomentum: 'Impulso del Mercado',
    confidence: 'Nivel de Confianza',
    sectorBreadth: 'Amplitud Sectorial',
    volatility: 'Señal de Volatilidad',
    interpretation: 'Interpretación',
    fearInterp: 'Los participantes del mercado muestran miedo — posible oportunidad de compra para contrarianos',
    neutralInterp: 'El mercado está equilibrado — espere señales más claras antes de hacer movimientos significativos',
    greedInterp: 'Los participantes del mercado muestran codicia — considere reducir la exposición y ajustar los stops',
  },
};

export default function CustomFearGreedIndex({ marketImpact, confidenceScore, sectors, keyIndicators, locale = 'en' }: Props) {
  const t = (key: string) => LABELS[locale]?.[key] || LABELS.en[key] || key;

  const index = useMemo(() => {
    // Market Momentum component (0-100)
    let momentum = 50;
    if (marketImpact === 'bullish') momentum = 75;
    else if (marketImpact === 'bearish') momentum = 25;

    // Confidence component (0-100)
    const confidenceComponent = Math.min(100, Math.max(0,
      marketImpact === 'bullish' ? 40 + confidenceScore * 0.6 :
      marketImpact === 'bearish' ? 60 - confidenceScore * 0.4 :
      30 + confidenceScore * 0.4
    ));

    // Sector breadth (more sectors = more diversification = less extreme)
    const sectorBreadth = Math.min(100, 30 + sectors.length * 12);

    // Volatility signal (inversely correlated with confidence)
    const volatility = Math.max(0, 100 - confidenceScore);

    // Weighted composite
    const composite = Math.round(
      momentum * 0.35 +
      confidenceComponent * 0.30 +
      sectorBreadth * 0.20 +
      (100 - volatility) * 0.15
    );

    return { composite, momentum, confidenceComponent, sectorBreadth, volatility };
  }, [marketImpact, confidenceScore, sectors, keyIndicators]);

  const getLabel = (val: number): { text: string; color: string; tKey: string } => {
    if (val <= 20) return { text: t('extremeFear'), color: '#D4365C', tKey: 'extremeFear' };
    if (val <= 40) return { text: t('fear'), color: '#E67E22', tKey: 'fear' };
    if (val <= 60) return { text: t('neutral'), color: '#D4930D', tKey: 'neutral' };
    if (val <= 80) return { text: t('greed'), color: '#2ECC71', tKey: 'greed' };
    return { text: t('extremeGreed'), color: '#00996B', tKey: 'extremeGreed' };
  };

  const label = getLabel(index.composite);
  const interpKey = index.composite <= 40 ? 'fearInterp' : index.composite <= 60 ? 'neutralInterp' : 'greedInterp';

  // Gauge SVG arc
  const angle = (index.composite / 100) * 180 - 90; // -90 to 90 degrees
  const rad = (angle * Math.PI) / 180;
  const cx = 100, cy = 80, r = 60;
  const nx = cx + r * Math.cos(rad - Math.PI / 2 + Math.PI);
  const ny = cy + r * Math.sin(rad - Math.PI / 2 + Math.PI);

  return (
    <div style={{
      background: 'rgba(10, 14, 39, 0.6)',
      border: '1px solid rgba(0, 229, 255, 0.15)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '18px' }}>&#9888;</span>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-head)', margin: 0 }}>{t('title')}</h3>
      </div>

      {/* Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
        <svg width="200" height="110" viewBox="0 0 200 110">
          {/* Background arc segments */}
          <path d="M 30 90 A 60 60 0 0 1 170 90" fill="none" stroke="#D4365C" strokeWidth="8" strokeLinecap="round" />
          <path d="M 50 75 A 60 60 0 0 1 170 90" fill="none" stroke="#E67E22" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
          <path d="M 70 62 A 60 60 0 0 1 150 62" fill="none" stroke="#D4930D" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
          <path d="M 90 55 A 60 60 0 0 1 130 55" fill="none" stroke="#2ECC71" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
          <path d="M 110 55 A 60 60 0 0 1 170 90" fill="none" stroke="#00996B" strokeWidth="8" strokeLinecap="round" opacity="0.7" />

          {/* Needle */}
          <line
            x1={cx} y1={cy}
            x2={cx + 50 * Math.cos(Math.PI - (index.composite / 100) * Math.PI)}
            y2={cy - 50 * Math.sin((index.composite / 100) * Math.PI)}
            stroke={label.color} strokeWidth="2.5" strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="5" fill={label.color} />

          {/* Labels */}
          <text x="20" y="105" fontSize="9" fill="#D4365C" fontWeight="600">0</text>
          <text x="93" y="30" fontSize="9" fill="#D4930D" fontWeight="600">50</text>
          <text x="170" y="105" fontSize="9" fill="#00996B" fontWeight="600">100</text>
        </svg>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: 900, color: label.color, lineHeight: 1 }}>{index.composite}</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: label.color, marginTop: '2px' }}>{label.text}</div>
        </div>
      </div>

      {/* Components */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, marginBottom: '8px' }}>{t('components')}</div>
        {[
          { label: t('marketMomentum'), value: index.momentum },
          { label: t('confidence'), value: index.confidenceComponent },
          { label: t('sectorBreadth'), value: index.sectorBreadth },
          { label: t('volatility'), value: 100 - index.volatility },
        ].map((comp, i) => (
          <div key={i} style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text3)' }}>
              <span>{comp.label}</span>
              <span style={{ fontWeight: 700, color: 'var(--text2)' }}>{comp.value}%</span>
            </div>
            <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(128,128,128,0.1)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${comp.value}%`, borderRadius: '2px',
                background: comp.value >= 60 ? '#00996B' : comp.value >= 40 ? '#D4930D' : '#D4365C',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Interpretation */}
      <div style={{
        padding: '10px 14px', borderRadius: '8px',
        background: `${label.color}08`, border: `1px solid ${label.color}15`,
        fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6,
      }}>
        <span style={{ fontWeight: 700, color: label.color }}>{t('interpretation')}: </span>
        {t(interpKey)}
      </div>
    </div>
  );
}
