'use client';

import { useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════
// Revolutionary Addition #9: Global Heatmap
// Visual SVG world map showing impact regions with heat
// indicators based on report data.
// ═══════════════════════════════════════════════════════════════

interface Props {
  marketImpact: string;
  sectors: string[];
  scope: string;
  confidenceScore: number;
  locale?: 'en' | 'fr' | 'ar' | 'tr' | 'es';
}

const LABELS: Record<string, Record<string, string>> = {
  en: {
    title: 'Global Impact Heatmap',
    subtitle: 'Regional impact intensity based on report analysis',
    highImpact: 'High Impact',
    mediumImpact: 'Medium Impact',
    lowImpact: 'Low Impact',
    noImpact: 'No Impact',
    regions: 'Regions',
    northAmerica: 'North America',
    europe: 'Europe',
    middleEast: 'Middle East',
    asia: 'Asia',
    southAmerica: 'South America',
    africa: 'Africa',
  },
  fr: {
    title: 'Carte Thermique Mondiale',
    subtitle: 'Intensité d\'impact régionale basée sur l\'analyse du rapport',
    highImpact: 'Impact Élevé',
    mediumImpact: 'Impact Moyen',
    lowImpact: 'Impact Faible',
    noImpact: 'Aucun Impact',
    regions: 'Régions',
    northAmerica: 'Amérique du Nord',
    europe: 'Europe',
    middleEast: 'Moyen-Orient',
    asia: 'Asie',
    southAmerica: 'Amérique du Sud',
    africa: 'Afrique',
  },
  ar: {
    title: 'خريطة التأثير العالمي الحرارية',
    subtitle: 'شدة التأثير الإقليمي بناءً على تحليل التقرير',
    highImpact: 'تأثير عالي',
    mediumImpact: 'تأثير متوسط',
    lowImpact: 'تأثير منخفض',
    noImpact: 'بدون تأثير',
    regions: 'المناطق',
    northAmerica: 'أمريكا الشمالية',
    europe: 'أوروبا',
    middleEast: 'الشرق الأوسط',
    asia: 'آسيا',
    southAmerica: 'أمريكا الجنوبية',
    africa: 'أفريقيا',
  },
  tr: {
    title: 'Küresel Etki Isı Haritası',
    subtitle: 'Rapor analizine göre bölgesel etki yoğunluğu',
    highImpact: 'Yüksek Etki',
    mediumImpact: 'Orta Etki',
    lowImpact: 'Düşük Etki',
    noImpact: 'Etki Yok',
    regions: 'Bölgeler',
    northAmerica: 'Kuzey Amerika',
    europe: 'Avrupa',
    middleEast: 'Orta Doğu',
    asia: 'Asya',
    southAmerica: 'Güney Amerika',
    africa: 'Afrika',
  },
  es: {
    title: 'Mapa de Calor de Impacto Global',
    subtitle: 'Intensidad de impacto regional basada en el análisis del informe',
    highImpact: 'Impacto Alto',
    mediumImpact: 'Impacto Medio',
    lowImpact: 'Impacto Bajo',
    noImpact: 'Sin Impacto',
    regions: 'Regiones',
    northAmerica: 'América del Norte',
    europe: 'Europa',
    middleEast: 'Medio Oriente',
    asia: 'Asia',
    southAmerica: 'América del Sur',
    africa: 'África',
  },
};

interface RegionImpact {
  key: string;
  labelKey: string;
  impact: 'high' | 'medium' | 'low' | 'none';
  color: string;
  opacity: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

function calculateRegionImpacts(sectors: string[], scope: string, marketImpact: string): RegionImpact[] {
  const isBullish = marketImpact === 'bullish';
  const isBearish = marketImpact === 'bearish';
  const isArabMarkets = sectors.some(s => /arab|gulf|mideast|middle|arabia|emirates|saudi/i.test(s));
  const isEnergy = sectors.some(s => /energy|oil|gas|opec|pétre|gaz|énergie/i.test(s));
  const isEconomy = sectors.some(s => /econom|inflation|gdp|pib|croissance/i.test(s));
  const isTech = sectors.some(s => /tech|ai|semi|ia/i.test(s));
  const isForex = sectors.some(s => /forex|currenc|devises|dollar|euro/i.test(s));

  const regions: RegionImpact[] = [
    {
      key: 'na', labelKey: 'northAmerica', cx: 140, cy: 85, rx: 50, ry: 35,
      impact: isEconomy || isTech || isForex ? 'high' : isBearish ? 'medium' : 'low',
      color: '', opacity: 0,
    },
    {
      key: 'eu', labelKey: 'europe', cx: 280, cy: 75, rx: 40, ry: 25,
      impact: isEconomy || isForex ? 'high' : isEnergy ? 'medium' : 'low',
      color: '', opacity: 0,
    },
    {
      key: 'me', labelKey: 'middleEast', cx: 340, cy: 120, rx: 25, ry: 20,
      impact: isArabMarkets || isEnergy ? 'high' : isEconomy ? 'medium' : 'none',
      color: '', opacity: 0,
    },
    {
      key: 'asia', labelKey: 'asia', cx: 430, cy: 100, rx: 55, ry: 35,
      impact: isEconomy || isEnergy ? 'medium' : isTech ? 'high' : 'low',
      color: '', opacity: 0,
    },
    {
      key: 'sa', labelKey: 'southAmerica', cx: 180, cy: 175, rx: 30, ry: 30,
      impact: isEconomy ? 'low' : 'none',
      color: '', opacity: 0,
    },
    {
      key: 'af', labelKey: 'africa', cx: 290, cy: 170, rx: 30, ry: 30,
      impact: isEnergy || isEconomy ? 'low' : 'none',
      color: '', opacity: 0,
    },
  ];

  for (const region of regions) {
    switch (region.impact) {
      case 'high': region.color = isBullish ? '#00996B' : '#D4365C'; region.opacity = 0.35; break;
      case 'medium': region.color = '#D4930D'; region.opacity = 0.25; break;
      case 'low': region.color = '#D4930D'; region.opacity = 0.12; break;
      case 'none': region.color = 'rgba(128,128,128,0.05)'; region.opacity = 0.05; break;
    }
  }

  return regions;
}

export default function GlobalHeatmap({ marketImpact, sectors, scope, confidenceScore, locale = 'en' }: Props) {
  const t = (key: string) => LABELS[locale]?.[key] || LABELS.en[key] || key;

  const regions = useMemo(() => calculateRegionImpacts(sectors, scope, marketImpact), [sectors, scope, marketImpact]);

  return (
    <div style={{
      background: 'rgba(10, 14, 39, 0.6)',
      border: '1px solid rgba(0, 229, 255, 0.15)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '18px' }}>&#127758;</span>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-head)', margin: 0 }}>{t('title')}</h3>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '0 0 16px 0' }}>{t('subtitle')}</p>

      {/* SVG World Map */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <svg viewBox="0 0 560 250" style={{ width: '100%', height: 'auto' }}>
          {/* Ocean background */}
          <rect x="0" y="0" width="560" height="250" fill="rgba(10,14,39,0.3)" rx="8" />

          {/* Simplified continent outlines */}
          {/* North America */}
          <path d="M 80 40 Q 100 30 160 35 Q 190 40 200 60 Q 195 85 190 100 Q 170 110 140 115 Q 110 110 90 90 Q 75 70 80 40 Z" fill="rgba(128,128,128,0.12)" stroke="rgba(128,128,128,0.15)" strokeWidth="0.5" />
          {/* South America */}
          <path d="M 155 140 Q 175 130 195 140 Q 205 160 200 190 Q 190 215 175 225 Q 160 220 155 200 Q 150 170 155 140 Z" fill="rgba(128,128,128,0.12)" stroke="rgba(128,128,128,0.15)" strokeWidth="0.5" />
          {/* Europe */}
          <path d="M 250 30 Q 280 25 310 35 Q 320 50 315 70 Q 300 80 280 80 Q 260 75 250 60 Q 248 45 250 30 Z" fill="rgba(128,128,128,0.12)" stroke="rgba(128,128,128,0.15)" strokeWidth="0.5" />
          {/* Africa */}
          <path d="M 265 90 Q 290 85 315 90 Q 325 110 320 140 Q 310 170 295 185 Q 280 180 270 160 Q 260 130 265 90 Z" fill="rgba(128,128,128,0.12)" stroke="rgba(128,128,128,0.15)" strokeWidth="0.5" />
          {/* Middle East */}
          <path d="M 320 80 Q 340 75 360 85 Q 365 100 355 115 Q 340 120 325 110 Q 320 95 320 80 Z" fill="rgba(128,128,128,0.12)" stroke="rgba(128,128,128,0.15)" strokeWidth="0.5" />
          {/* Asia */}
          <path d="M 365 35 Q 410 25 470 40 Q 500 55 510 80 Q 505 110 480 125 Q 440 135 400 120 Q 370 100 365 75 Q 363 55 365 35 Z" fill="rgba(128,128,128,0.12)" stroke="rgba(128,128,128,0.15)" strokeWidth="0.5" />
          {/* Australia */}
          <path d="M 450 160 Q 480 155 510 165 Q 520 180 510 195 Q 490 200 465 195 Q 450 185 450 170 Z" fill="rgba(128,128,128,0.12)" stroke="rgba(128,128,128,0.15)" strokeWidth="0.5" />

          {/* Heat overlay ellipses */}
          {regions.map(region => (
            <g key={region.key}>
              <ellipse
                cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry}
                fill={region.color} opacity={region.opacity}
                style={{ transition: 'all 0.5s ease' }}
              />
              {region.impact !== 'none' && (
                <circle
                  cx={region.cx} cy={region.cy} r="4"
                  fill={region.color} opacity="0.9"
                  style={{ transition: 'all 0.5s' }}
                />
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {[
          { label: t('highImpact'), color: marketImpact === 'bullish' ? '#00996B' : '#D4365C' },
          { label: t('mediumImpact'), color: '#D4930D' },
          { label: t('lowImpact'), color: 'rgba(212,147,13,0.5)' },
          { label: t('noImpact'), color: 'rgba(128,128,128,0.3)' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
            <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Region list */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
        {regions.map(region => (
          <div key={region.key} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '4px 8px', borderRadius: '4px',
            background: 'rgba(128,128,128,0.04)',
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: region.impact === 'high' ? (marketImpact === 'bullish' ? '#00996B' : '#D4365C') :
                         region.impact === 'medium' ? '#D4930D' :
                         region.impact === 'low' ? 'rgba(212,147,13,0.5)' : 'rgba(128,128,128,0.3)',
            }} />
            <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{t(region.labelKey)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
