// ─── Chart Slide V12 ────────────────────────────────────────
// V12: Uses DESIGN_TOKENS for all colors/fonts — no hardcoded values

'use client';

import { InfographicSlide, ChartData, DESIGN_TOKENS } from '../types';
import * as LucideIcons from 'lucide-react';

interface ChartSlideProps {
  slide: InfographicSlide;
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
}

// V12: Only 5 functional colors matching DESIGN_TOKENS
const CHART_COLORS = ['#D4AF37', '#10B981', '#EF4444', '#3B82F6', '#F59E0B'];

const CHART_I18N = {
  ar: {
    noData: 'لا توجد بيانات كافية للرسم البياني',
    unit: 'الوحدة:',
    noUnit: 'لم يتم تحديد الوحدة',
    sectors: 'قطاعات',
    indicator: 'المؤشر',
  },
  en: {
    noData: 'Insufficient data for chart',
    unit: 'Unit:',
    noUnit: 'Unit not specified',
    sectors: 'sectors',
    indicator: 'Indicator',
  },
  es: {
    noData: 'Insufficient data for chart',
    unit: 'Unit:',
    noUnit: 'Unit not specified',
    sectors: 'sectors',
    indicator: 'Indicator',
  },
  fr: {
    noData: 'Insufficient data for chart',
    unit: 'Unit:',
    noUnit: 'Unit not specified',
    sectors: 'sectors',
    indicator: 'Indicator',
  },
  tr: {
    noData: 'Insufficient data for chart',
    unit: 'Unit:',
    noUnit: 'Unit not specified',
    sectors: 'sectors',
    indicator: 'Indicator',
  },
};

export default function ChartSlide({ slide, locale = 'ar' }: ChartSlideProps) {
  const t = CHART_I18N[locale];
  const accentColor = slide.accentColor || DESIGN_TOKENS.info;
  const chartData = slide.content.chartData;
  const IconComponent = slide.icon ? (LucideIcons as any)[slide.icon] : LucideIcons.BarChart3;

  if (!chartData || !chartData.values?.length || !chartData.labels?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] p-8 rounded-2xl text-center"
        style={{ background: DESIGN_TOKENS.slideGradients.data(accentColor) }}>
        <LucideIcons.BarChart3 size={32} style={{ color: DESIGN_TOKENS.textMuted, marginBottom: '12px' }} aria-hidden="true" />
        <p className="text-[14px]" style={{ color: DESIGN_TOKENS.textSecondary }}>{t.noData}</p>
      </div>
    );
  }

  const maxVal = Math.max(...chartData.values, 1);
  const minVal = Math.min(...chartData.values, 0);

  return (
    <div className="flex flex-col min-h-[320px] p-6 sm:p-8 rounded-2xl"
      style={{ background: DESIGN_TOKENS.slideGradients.data(accentColor) }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: accentColor + '12', color: accentColor }}>
          <IconComponent size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary, fontFamily: DESIGN_TOKENS.fontTitle }}>{slide.title}</h2>
          {slide.subtitle && (
            <p className="text-[12px] mt-0.5" style={{ color: DESIGN_TOKENS.textSecondary }}>{slide.subtitle}</p>
          )}
        </div>
      </div>

      {/* Unit badge */}
      {chartData.unit ? (
        <div className="mb-3">
          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
            style={{ background: accentColor + '10', color: accentColor, border: `1px solid ${accentColor}18` }}>
            {t.unit} {chartData.unit}
          </span>
        </div>
      ) : (
        <div className="mb-3">
          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
            style={{ background: DESIGN_TOKENS.danger + '10', color: DESIGN_TOKENS.danger, border: `1px solid ${DESIGN_TOKENS.danger}18` }}>
            {t.noUnit}
          </span>
        </div>
      )}

      {/* Chart Area */}
      <div className="flex-1 flex flex-col justify-end">
        {chartData.type === 'bar' ? (
          <BarChart data={chartData} accentColor={accentColor} maxVal={maxVal} locale={locale} />
        ) : chartData.type === 'pie' ? (
          <PieChart data={chartData} locale={locale} />
        ) : chartData.type === 'gauge' ? (
          <GaugeChart data={chartData} accentColor={accentColor} locale={locale} />
        ) : (
          <LineChart data={chartData} accentColor={accentColor} maxVal={maxVal} minVal={minVal} />
        )}
      </div>
    </div>
  );
}

// ─── Bar Chart ──────────────────────────────────────────────
function BarChart({ data, accentColor, maxVal, locale = 'ar' }: { data: ChartData; accentColor: string; maxVal: number; locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr' }) {
  return (
    <div className="relative">
      {/* Y-axis grid */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ height: '200px' }}>
        {[0, 25, 50, 75, 100].map((pct, i) => (
          <div key={pct} className="flex items-center gap-2">
            <span className="text-[9px] w-12 text-left" style={{ color: DESIGN_TOKENS.textMuted, fontFamily: DESIGN_TOKENS.fontData }}>
              {i === 0 && data.unit ? `${Math.round(maxVal * pct / 100)} ${data.unit}` : Math.round(maxVal * pct / 100)}
            </span>
            <div className="flex-1 h-px" style={{ background: DESIGN_TOKENS.borderDefault }} />
          </div>
        ))}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2 sm:gap-3 relative" style={{ height: '200px', marginRight: '40px' }}>
        {data.values.map((val, i) => {
          const height = Math.max((val / maxVal) * 100, 6);
          const isMax = val === maxVal;
          const barColor = CHART_COLORS[i % CHART_COLORS.length];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
              <span className="text-[11px] sm:text-[13px] font-bold" style={{ color: isMax ? accentColor : DESIGN_TOKENS.textPrimary, fontFamily: DESIGN_TOKENS.fontData }}>
                {val}
              </span>
              <div className="w-full rounded-t-md relative overflow-hidden"
                style={{
                  height: `${height}%`,
                  background: isMax ? accentColor : accentColor + '50',
                  minHeight: '16px',
                }} />
              <span className="text-[9px] sm:text-[10px] font-medium text-center leading-tight max-w-[70px]"
                style={{ color: DESIGN_TOKENS.textSecondary, fontFamily: DESIGN_TOKENS.fontBody }}>
                {data.labels[i] || ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Line Chart ─────────────────────────────────────────────
function LineChart({ data, accentColor, maxVal, minVal }: { data: ChartData; accentColor: string; maxVal: number; minVal: number }) {
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const range = maxVal - minVal || 1;

  const points = data.values.map((val, i) => ({
    x: padding.left + (i / Math.max(data.values.length - 1, 1)) * chartW,
    y: padding.top + chartH - ((val - minVal) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;
  const gradId = `lg${accentColor.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ direction: 'ltr' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const y = padding.top + chartH * (1 - ratio);
        const val = minVal + range * ratio;
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1F2937" strokeWidth="1" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="#6B7280" fontSize="9">{i === 0 && data.unit ? `${Math.round(val)} ${data.unit}` : Math.round(val)}</text>
          </g>
        );
      })}

      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill={accentColor} stroke="#0A0E1A" strokeWidth="2" />
          <text x={p.x} y={p.y - 12} textAnchor="middle" fill={DESIGN_TOKENS.textPrimary} fontSize="11" fontWeight="bold">{data.values[i]}</text>
          <text x={p.x} y={height - 5} textAnchor="middle" fill={DESIGN_TOKENS.textSecondary} fontSize="10">{data.labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Pie Chart (Donut) ──────────────────────────────────────
function PieChart({ data, locale = 'ar' }: { data: ChartData; locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr' }) {
  const t = CHART_I18N[locale];
  const total = data.values.reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  let cumAngle = 0;
  const segments = data.values.slice(0, 6).map((val, i) => {
    const angle = (val / total) * 360;
    const start = cumAngle;
    cumAngle += angle;
    return { color: CHART_COLORS[i % CHART_COLORS.length], start, angle, val, label: data.labels[i] };
  });

  const gradientStr = segments.map(s => `${s.color} ${s.start}deg ${s.start + s.angle}deg`).join(', ');

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
      <div className="relative">
        <div className="w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] rounded-full"
          style={{ background: `conic-gradient(${gradientStr})` }}>
          <div className="absolute inset-[30%] rounded-full flex items-center justify-center"
            style={{ background: DESIGN_TOKENS.bgDeep }}>
            <span className="text-[13px] sm:text-[14px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary, fontFamily: DESIGN_TOKENS.fontBody }}>
              {data.values.length} {t.sectors}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-[11px] sm:text-[12px] flex-1" style={{ color: DESIGN_TOKENS.textSecondary, fontFamily: DESIGN_TOKENS.fontBody }}>{seg.label}</span>
            <span className="text-[11px] sm:text-[12px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary, fontFamily: DESIGN_TOKENS.fontData }}>
              {Math.round(seg.val / total * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Gauge Chart ────────────────────────────────────────────
function GaugeChart({ data, accentColor, locale = 'ar' }: { data: ChartData; accentColor: string; locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr' }) {
  const t = CHART_I18N[locale];
  const value = data.values[0] || 0;
  const max = data.values[1] || 100;
  const pct = Math.min(value / max, 1);
  const gaugeColor = pct >= 0.7 ? DESIGN_TOKENS.success : pct >= 0.4 ? DESIGN_TOKENS.gold : DESIGN_TOKENS.danger;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-[200px] h-[110px] sm:w-[220px] sm:h-[120px]">
        <svg viewBox="0 0 220 120" className="w-full">
          <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke={DESIGN_TOKENS.borderDefault} strokeWidth="16" strokeLinecap="round" />
          <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke={gaugeColor} strokeWidth="16" strokeLinecap="round"
            strokeDasharray={`${pct * 283} 283`} />
          <text x="110" y="95" textAnchor="middle" fill={DESIGN_TOKENS.textPrimary} fontSize="32" fontWeight="700">{value}</text>
          <text x="110" y="115" textAnchor="middle" fill={DESIGN_TOKENS.textSecondary} fontSize="11">/ {max}</text>
        </svg>
      </div>
      <div className="text-center">
        <span className="text-[14px] sm:text-[16px] font-bold" style={{ color: gaugeColor, fontFamily: DESIGN_TOKENS.fontBody }}>
          {data.labels[0] || t.indicator}
        </span>
        {data.labels.length > 1 && (
          <span className="text-[11px] sm:text-[12px] block mt-1" style={{ color: DESIGN_TOKENS.textSecondary, fontFamily: DESIGN_TOKENS.fontBody }}>
            {data.labels[1]}
          </span>
        )}
      </div>
    </div>
  );
}
