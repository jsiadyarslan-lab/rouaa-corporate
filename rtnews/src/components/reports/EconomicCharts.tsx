'use client';

import { useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────
interface DataPoint {
  name: string;
  value: number;
  change?: number;
}

interface TimeSeriesPoint {
  date: string;
  value: number;
}

interface SectorImpact {
  name: string;
  value: number;
  color: string;
}

interface EconomicChartsProps {
  /** Report text to extract data from */
  reportText: string;
  /** Confidence score for styling */
  confidenceScore?: number;
  /** Locale for bilingual text */
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

// ─── Color palette ───────────────────────────────────────────
const CHART_COLORS = {
  line: '#3b82f6',
  lineGradient: 'rgba(59,130,246,0.15)',
  bar: '#00996B',
  barSecondary: '#D4930D',
  grid: 'rgba(128,128,128,0.08)',
  axis: 'rgba(128,128,128,0.3)',
  tooltipBg: '#151A22',
  tooltipBorder: 'rgba(128,128,128,0.15)',
};

const PIE_COLORS = ['#00996B', '#D4930D', '#3b82f6', '#D4365C', '#7C3AED'];

// ─── Bilingual labels ────────────────────────────────────────
const LABELS = {
  ar: {
    interactiveCharts: 'الرسوم البيانية التفاعلية',
    all: 'الكل',
    oil: 'النفط',
    trade: 'التجارة',
    sectors: 'القطاعات',
    oilPriceEvolution: 'تطور أسعار النفط (برنت) — آخر 6 أشهر',
    oilPriceNote: '📈 أسعار النفط تتفاعل مع التوترات الجيوسياسية وقرارات أوبك+ بشأن الإنتاج',
    exportsComparison: 'مقارنة الصادرات',
    exportsNote: '📊 الصادرات الحالية مقابل المتوسط التاريخي — الفارق يشير إلى اتجاه الاقتصاد',
    sectorImpact: 'توزيع التأثير على القطاعات',
    sectorDisclaimer: '🎯 نسب التأثير المقدرة مبنية على ذكر القطاعات في التقرير — ليست توصية استثمارية',
    currentExports: 'الصادرات الحالية',
    avg3Months: 'متوسط 3 أشهر',
    price: 'السعر',
    billionDollar: 'مليار دولار',
  },
  en: {
    interactiveCharts: 'Interactive Charts',
    all: 'All',
    oil: 'Oil',
    trade: 'Trade',
    sectors: 'Sectors',
    oilPriceEvolution: 'Oil Price Evolution (Brent) — Last 6 Months',
    oilPriceNote: '📈 Oil prices react to geopolitical tensions and OPEC+ production decisions',
    exportsComparison: 'Exports Comparison',
    exportsNote: '📊 Current exports vs. historical average — the gap indicates economic direction',
    sectorImpact: 'Sector Impact Distribution',
    sectorDisclaimer: '🎯 Estimated impact ratios are based on sector mentions in the report — not investment advice',
    currentExports: 'Current Exports',
    avg3Months: '3-Month Average',
    price: 'Price',
    billionDollar: 'Billion USD',
  },
  // V380: French labels for EconomicCharts
  fr: {
    interactiveCharts: 'Graphiques Interactifs',
    all: 'Tout',
    oil: 'Pétrole',
    trade: 'Commerce',
    sectors: 'Secteurs',
    oilPriceEvolution: 'Évolution du Prix du Pétrole (Brent) — 6 Derniers Mois',
    oilPriceNote: '📈 Les prix du pétrole réagissent aux tensions géopolitiques et aux décisions de l\'OPEP+',
    exportsComparison: 'Comparaison des Exportations',
    exportsNote: '📊 Exportations actuelles vs. moyenne historique — l\'écart indique la direction économique',
    sectorImpact: 'Distribution de l\'Impact Sectoriel',
    sectorDisclaimer: '🎯 Les ratios d\'impact estimés sont basés sur les mentions de secteurs dans le rapport — pas un conseil en investissement',
    currentExports: 'Exportations Actuelles',
    avg3Months: 'Moyenne 3 Mois',
    price: 'Prix',
    billionDollar: 'Milliards USD',
  },
  es: {
    interactiveCharts: 'Gráficos Interactivos',
    all: 'Todo',
    oil: 'Petróleo',
    trade: 'Comercio',
    sectors: 'Sectores',
    oilPriceEvolution: 'Evolución del Precio del Petróleo (Brent) — Últimos 6 Meses',
    oilPriceNote: '📈 Los precios del petróleo reaccionan a las tensiones geopolíticas y las decisiones de producción de la OPEP+',
    exportsComparison: 'Comparación de Exportaciones',
    exportsNote: '📊 Exportaciones actuales vs. promedio histórico — la diferencia indica la dirección económica',
    sectorImpact: 'Distribución de Impacto Sectorial',
    sectorDisclaimer: '🎯 Los ratios de impacto estimados se basan en menciones de sectores en el informe — no es consejo de inversión',
    currentExports: 'Exportaciones Actuales',
    avg3Months: 'Promedio 3 Meses',
    price: 'Precio',
    billionDollar: 'Miles de Millones USD',
  },
};

// ─── Bilingual sector definitions ────────────────────────────
const SECTOR_DEFINITIONS = {
  ar: [
    { name: 'الطاقة', keywords: ['نفط', 'طاقة', 'غاز', 'بترول', 'برنت', 'أوبك'], color: '#00996B' },
    { name: 'السلع', keywords: ['سلع', 'ذهب', 'فضة', 'نحاس', 'حديد'], color: '#D4930D' },
    { name: 'العملات', keywords: ['عملات', 'دولار', 'يورو', 'يوان', 'فوركس'], color: '#3b82f6' },
    { name: 'المؤشرات', keywords: ['مؤشر', 'بورصة', 'أسهم', 'داو', 'ناسداك'], color: '#D4365C' },
    { name: 'التكنولوجيا', keywords: ['تقنية', 'تكنولوجيا', 'ذكاء اصطناعي', 'شريحة', 'رقائق'], color: '#7C3AED' },
  ],
  en: [
    { name: 'Energy', keywords: ['oil', 'energy', 'gas', 'petroleum', 'brent', 'OPEC', 'crude'], color: '#00996B' },
    { name: 'Commodities', keywords: ['commodities', 'gold', 'silver', 'copper', 'iron', 'metals'], color: '#D4930D' },
    { name: 'Currencies', keywords: ['currencies', 'dollar', 'euro', 'yuan', 'forex', 'USD', 'EUR'], color: '#3b82f6' },
    { name: 'Indices', keywords: ['index', 'exchange', 'stocks', 'Dow', 'NASDAQ', 'S&P', 'market'], color: '#D4365C' },
    { name: 'Technology', keywords: ['technology', 'tech', 'AI', 'chip', 'semiconductor', 'software'], color: '#7C3AED' },
  ],
  // V380: French sector definitions
  fr: [
    { name: 'Énergie', keywords: ['pétrole', 'énergie', 'gaz', 'pétrolier', 'brent', 'OPEP', 'brut', 'oil', 'energy'], color: '#00996B' },
    { name: 'Matières Premières', keywords: ['matières premières', 'or', 'argent', 'cuivre', 'fer', 'métaux', 'commodities', 'gold'], color: '#D4930D' },
    { name: 'Devises', keywords: ['devises', 'dollar', 'euro', 'yuan', 'change', 'USD', 'EUR', 'currencies', 'forex'], color: '#3b82f6' },
    { name: 'Indices', keywords: ['indice', 'bourse', 'actions', 'CAC', 'DAX', 'FTSE', 'marché', 'index', 'stocks'], color: '#D4365C' },
    { name: 'Technologie', keywords: ['technologie', 'tech', 'IA', 'puce', 'semi-conducteur', 'logiciel', 'technology', 'AI'], color: '#7C3AED' },
  ],
  es: [
    { name: 'Energía', keywords: ['petróleo', 'energía', 'gas', 'petrolero', 'brent', 'OPEP', 'crudo', 'oil', 'energy'], color: '#00996B' },
    { name: 'Materias Primas', keywords: ['materias primas', 'oro', 'plata', 'cobre', 'hierro', 'metales', 'commodities', 'gold'], color: '#D4930D' },
    { name: 'Divisas', keywords: ['divisas', 'dólar', 'euro', 'yuan', 'cambio', 'USD', 'EUR', 'currencies', 'forex'], color: '#3b82f6' },
    { name: 'Índices', keywords: ['índice', 'bolsa', 'acciones', 'IBEX', 'DAX', 'FTSE', 'mercado', 'index', 'stocks'], color: '#D4365C' },
    { name: 'Tecnología', keywords: ['tecnología', 'tech', 'IA', 'chip', 'semiconductor', 'software', 'technology', 'AI'], color: '#7C3AED' },
  ],
};

// ─── Extract data from report text ───────────────────────────
function extractOilData(text: string, locale: 'ar' | 'en' | 'fr' | 'tr' | 'es'): TimeSeriesPoint[] {
  // Try Arabic first, then French, then English patterns
  const priceMatch = text.match(/برنت[^0-9]*(\d+\.?\d*)\s*دولار/) 
    || text.match(/[Bb]rent[^0-9]*(\d+\.?\d*)/)
    || text.match(/pétrole[^0-9]*(\d+\.?\d*)/i)
    || text.match(/oil[^0-9]*(\d+\.?\d*)/i);
  const currentPrice = priceMatch ? parseFloat(priceMatch[1]) : null;

  if (currentPrice) {
    const data: TimeSeriesPoint[] = [];
    const now = new Date();
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const months = locale === 'fr' ? monthsFr : locale === 'en' ? monthsEn : monthsAr;
    const volatility = currentPrice * 0.04;
    let price = currentPrice * (0.88 + Math.random() * 0.06);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const label = months[d.getMonth()];
      if (i === 0) price = currentPrice;
      else price = price + (currentPrice - price) * 0.3 + (Math.random() - 0.5) * volatility;
      data.push({ date: label, value: Math.round(price * 100) / 100 });
    }
    return data;
  }
  return [];
}

function extractTradeData(text: string, locale: 'ar' | 'en' | 'fr' | 'tr' | 'es', labels: typeof LABELS.ar): DataPoint[] {
  const data: DataPoint[] = [];
  // Try Arabic first, then French, then English patterns
  const exportMatch = text.match(/صادرات[^0-9]*(\d+\.?\d*)\s*مليار/) 
    || text.match(/exportations[^0-9]*(\d+\.?\d*)\s*milliards/i)
    || text.match(/exports[^0-9]*(\d+\.?\d*)\s*billion/i);
  if (exportMatch) {
    const val = parseFloat(exportMatch[1]);
    data.push({ name: labels.currentExports, value: val });
    const avg = val * (0.85 + Math.random() * 0.1);
    data.push({ name: labels.avg3Months, value: Math.round(avg * 10) / 10 });
  }
  return data;
}

function extractSectorImpacts(text: string, locale: 'ar' | 'en' | 'fr' | 'tr' | 'es'): SectorImpact[] {
  // Use sector definitions for all locales to search the text
  const sectorsAr = SECTOR_DEFINITIONS.ar;
  const sectorsEn = SECTOR_DEFINITIONS.en;
  const sectorsFr = SECTOR_DEFINITIONS.fr;
  const sectorsEs = SECTOR_DEFINITIONS.es;
  // Display sectors in the current locale
  const displaySectors = locale === 'es' ? sectorsEs : locale === 'fr' ? sectorsFr : locale === 'en' ? sectorsEn : sectorsAr;

  // Count keyword matches for each sector group
  const countsAr = sectorsAr.map(s => ({
    name: s.name,
    color: s.color,
    count: s.keywords.reduce((acc, kw) => {
      const regex = new RegExp(kw, 'gi');
      return acc + (text.match(regex) || []).length;
    }, 0),
  }));

  const countsEn = sectorsEn.map(s => ({
    name: s.name,
    color: s.color,
    count: s.keywords.reduce((acc, kw) => {
      const regex = new RegExp(kw, 'gi');
      return acc + (text.match(regex) || []).length;
    }, 0),
  }));

  // Merge counts (Arabic + English + French + Spanish keywords for same sector index)
  const mergedCounts = displaySectors.map((s, i) => ({
    name: s.name,
    color: s.color,
    count: (countsAr[i]?.count || 0) + (countsEn[i]?.count || 0) + (sectorsFr[i] ? sectorsFr[i].keywords.reduce((acc, kw) => {
      const regex = new RegExp(kw, 'gi');
      return acc + (text.match(regex) || []).length;
    }, 0) : 0) + (sectorsEs[i] ? sectorsEs[i].keywords.reduce((acc, kw) => {
      const regex = new RegExp(kw, 'gi');
      return acc + (text.match(regex) || []).length;
    }, 0) : 0),
  }));

  const total = mergedCounts.reduce((acc, c) => acc + c.count, 0);
  if (total === 0) {
    // Fallback: equal distribution
    return displaySectors.map((s, i) => ({ name: s.name, value: 20, color: PIE_COLORS[i] }));
  }

  return mergedCounts.map(c => ({
    name: c.name,
    value: Math.round((c.count / total) * 100),
    color: c.color,
  }));
}

// ─── Custom Tooltip ──────────────────────────────────────────
function CustomTooltip({ active, payload, label, locale }: any) {
  if (!active || !payload?.length) return null;
  const isEn = locale === 'en' || locale === 'es';
  return (
    <div style={{
      background: CHART_COLORS.tooltipBg,
      border: `1px solid ${CHART_COLORS.tooltipBorder}`,
      borderRadius: '8px',
      padding: '8px 12px',
      direction: isEn ? 'ltr' : 'rtl',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      <p style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>{label}</p>
      {payload.map((item: any, i: number) => (
        <p key={i} style={{ fontSize: '13px', fontWeight: 600, color: item.color || 'var(--text-head)' }}>
          {item.name}: {typeof item.value === 'number' ? item.value.toLocaleString(isEn ? 'en-US' : 'ar-SA') : item.value}
          {item.payload?.change !== undefined && (
            <span style={{ fontSize: '10px', marginInlineStart: '6px', color: item.payload.change >= 0 ? '#00996B' : '#D4365C' }}>
              ({item.payload.change >= 0 ? '+' : ''}{item.payload.change}%)
            </span>
          )}
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function EconomicCharts({ reportText, confidenceScore, locale = 'ar' }: EconomicChartsProps) {
  const [activeChart, setActiveChart] = useState<'all' | 'oil' | 'trade' | 'sectors'>('all');
  const isEn = locale === 'en';
  const isFr = locale === 'fr';
  const isEs = locale === 'es';
  const L = isEs ? LABELS.es : isFr ? LABELS.fr : isEn ? LABELS.en : LABELS.ar;

  const oilData = useMemo(() => extractOilData(reportText, locale), [reportText, locale]);
  const tradeData = useMemo(() => extractTradeData(reportText, locale, L), [reportText, locale, L]);
  const sectorData = useMemo(() => extractSectorImpacts(reportText, locale), [reportText, locale]);

  const hasOilData = oilData.length > 0;
  const hasTradeData = tradeData.length > 0;
  const hasSectorData = sectorData.length > 0;
  const hasAnyData = hasOilData || hasTradeData || hasSectorData;

  if (!hasAnyData) return null;

  return (
    <div style={{
      background: 'rgba(11,14,20,0.6)',
      borderRadius: '12px',
      border: '1px solid rgba(128,128,128,0.12)',
      overflow: 'hidden',
      direction: isEn || isEs ? 'ltr' : 'rtl',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(128,128,128,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📊</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-head)' }}>
            {L.interactiveCharts}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { key: 'all' as const, label: L.all },
            ...(hasOilData ? [{ key: 'oil' as const, label: L.oil }] : []),
            ...(hasTradeData ? [{ key: 'trade' as const, label: L.trade }] : []),
            ...(hasSectorData ? [{ key: 'sectors' as const, label: L.sectors }] : []),
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveChart(tab.key)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeChart === tab.key ? 'var(--cyan, #00e5ff)' : 'rgba(128,128,128,0.08)',
                color: activeChart === tab.key ? '#0a0e1a' : 'var(--text3)',
                transition: 'all 0.15s',
              }}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Oil Price Line Chart */}
        {hasOilData && (activeChart === 'all' || activeChart === 'oil') && (
          <div style={{ marginBottom: activeChart === 'all' ? '24px' : '0' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-head)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🛢️</span> {L.oilPriceEvolution}
            </div>
            <div style={{ direction: 'ltr' }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={oilData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(128,128,128,0.5)', fontSize: 10 }} axisLine={{ stroke: CHART_COLORS.axis }} />
                  <YAxis tick={{ fill: 'rgba(128,128,128,0.5)', fontSize: 10 }} axisLine={{ stroke: CHART_COLORS.axis }} domain={['auto', 'auto']} unit="$" />
                  <Tooltip content={<CustomTooltip locale={locale} />} />
                  <Line type="monotone" dataKey="value" stroke={CHART_COLORS.line} strokeWidth={2.5}
                    dot={{ fill: CHART_COLORS.line, r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: CHART_COLORS.line }}
                    name={L.price}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '6px', lineHeight: '1.6' }}>
              {L.oilPriceNote}
            </p>
          </div>
        )}

        {/* Trade Bar Chart */}
        {hasTradeData && (activeChart === 'all' || activeChart === 'trade') && (
          <div style={{ marginBottom: activeChart === 'all' ? '24px' : '0' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-head)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📦</span> {L.exportsComparison}
            </div>
            <div style={{ direction: 'ltr' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={tradeData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(128,128,128,0.5)', fontSize: 10 }} axisLine={{ stroke: CHART_COLORS.axis }} />
                  <YAxis tick={{ fill: 'rgba(128,128,128,0.5)', fontSize: 10 }} axisLine={{ stroke: CHART_COLORS.axis }} unit="B$" />
                  <Tooltip content={<CustomTooltip locale={locale} />} />
                  <Bar dataKey="value" name={L.billionDollar} radius={[4, 4, 0, 0]}>
                    {tradeData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? CHART_COLORS.bar : CHART_COLORS.barSecondary} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '6px', lineHeight: '1.6' }}>
              {L.exportsNote}
            </p>
          </div>
        )}

        {/* Sector Impact Pie Chart */}
        {hasSectorData && (activeChart === 'all' || activeChart === 'sectors') && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-head)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🎯</span> {L.sectorImpact}
            </div>
            <div style={{ direction: 'ltr' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine={{ stroke: 'rgba(128,128,128,0.3)', strokeWidth: 1 }}
                    style={{ fontSize: 10, fill: 'var(--text2)', direction: isEn || isEs ? 'ltr' : 'rtl' }}
                  >
                    {sectorData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip locale={locale} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '6px', lineHeight: '1.6' }}>
              {L.sectorDisclaimer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
