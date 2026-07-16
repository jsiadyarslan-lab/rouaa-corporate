// ─── Data Slide V12 — الأرقام والبيانات ──────────────────────
// V12: Added locale prop for English/Arabic UI text translation
// V11: Slide-type gradient DNA + unified tokens + improved visual hierarchy

'use client';

import { InfographicSlide, DataIndicator, COLOR_MAP, getCategoryColor, DESIGN_TOKENS, getDirectionColor } from '../types';
import SlideWithImage, { EmptySlideFallback } from './SlideWithImage';
import { InfographicChart, buildSlideChartConfig } from '../InfographicChart';
import * as LucideIcons from 'lucide-react';

// V11: Unified constants from DESIGN_TOKENS
const GLASS_STYLE = DESIGN_TOKENS.glassCard();
const TEXT_SHADOW_IMG = DESIGN_TOKENS.textShadowOverImage;

interface DataSlideProps {
  slide: InfographicSlide;
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
}

// V12: Translation map
const DATA_I18N = {
  ar: {
    noData: 'لا توجد بيانات كافية',
    noDataShort: 'لا توجد بيانات',
  },
  en: {
    noData: 'Insufficient data',
    noDataShort: 'No data',
  },
  es: {
    noData: 'Insufficient data',
    noDataShort: 'No data',
  },
  fr: {
    noData: 'Insufficient data',
    noDataShort: 'No data',
  },
  tr: {
    noData: 'Insufficient data',
    noDataShort: 'No data',
  },
};

// Extract numeric percentage from change string
function parseChangePercent(change?: string): number | null {
  if (!change) return null;
  const match = change.match(/([\d.]+)\s*%/);
  if (match) return parseFloat(match[1]);
  return null;
}

export default function DataSlide({ slide, locale = 'ar' }: DataSlideProps) {
  const t = DATA_I18N[locale];
  const colorName = (slide as any).content.color || slide.color || '';
  const accentColor = COLOR_MAP[colorName] || slide.accentColor || getCategoryColor(slide.content.tag);
  const indicators = slide.content.indicators || [];

  if (indicators.length === 0) {
    return <EmptySlideFallback icon={LucideIcons.BarChart3} text={t.noData} locale={locale} />;
  }

  const maxPct = Math.max(
    ...indicators.map(ind => parseChangePercent((ind as any).change) || 0),
    1
  );

  return (
    <SlideWithImage slide={slide} fallbackIcon={LucideIcons.BarChart3} fallbackText={t.noDataShort} slideType="data" locale={locale}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: accentColor + '18', color: accentColor }}>
          <LucideIcons.BarChart3 size={22} aria-hidden="true" />
        </div>
        <h2 className="text-[20px] sm:text-[22px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary, textShadow: TEXT_SHADOW_IMG }}>{slide.title}</h2>
      </div>

      {/* Data indicators — unified glass cards */}
      <div className="flex-1 space-y-2.5">
        {indicators.map((ind: DataIndicator, index: number) => {
          const dirColor = getDirectionColor(ind.direction);
          const DirIcon = ind.direction === 'up' ? LucideIcons.TrendingUp : ind.direction === 'down' ? LucideIcons.TrendingDown : LucideIcons.Minus;
          const pct = parseChangePercent((ind as any).change);
          const barWidth = pct != null ? Math.min((pct / maxPct) * 100, 100) : 0;

          return (
            <div key={index} className="p-3 sm:p-3.5 rounded-2xl"
              style={{ ...DESIGN_TOKENS.glassCard(dirColor + '30'), borderInlineStart: `3px solid ${dirColor}` }}>
              <div className="flex items-center gap-2.5">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: dirColor + '12' }}>
                  <DirIcon size={14} style={{ color: dirColor }} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] sm:text-[14px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary, textShadow: TEXT_SHADOW_IMG }}>{ind.name}</span>
                    {ind.symbol && <span className="text-[10px] sm:text-[11px] font-mono" style={{ color: DESIGN_TOKENS.textSymbol }}>{ind.symbol}</span>}
                  </div>
                </div>
                <div className="text-left flex-shrink-0">
                  <div className="text-[16px] sm:text-[18px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary, textShadow: TEXT_SHADOW_IMG, fontFamily: DESIGN_TOKENS.fontData, fontFeatureSettings: DESIGN_TOKENS.fontFeatureSettings }}>{ind.value}</div>
                  {(ind as any).change && <div className="text-[10px] sm:text-[11px] font-bold mt-0.5" style={{ color: dirColor, fontFeatureSettings: DESIGN_TOKENS.fontFeatureSettings }}>{(ind as any).change}</div>}
                </div>
              </div>
              {/* Visual comparison bar */}
              {pct != null && pct > 0 && (
                <div className="mt-2 mr-10">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: DESIGN_TOKENS.borderSubtle }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${barWidth}%`, background: `linear-gradient(90deg, ${dirColor}30, ${dirColor})` }} />
                  </div>
                </div>
              )}
              {ind.reason && <p className="text-[11px] sm:text-[12px] mt-1.5 mr-10 line-clamp-2 leading-relaxed" style={{ color: DESIGN_TOKENS.textLabel }}>{ind.reason}</p>}
            </div>
          );
        })}
      </div>

      {/* ECharts Horizontal Bar Chart */}
      {(() => {
        const chartConfig = slide.chart_config || buildSlideChartConfig(slide);
        if (chartConfig) return (
          <div className="mt-4 rounded-2xl p-4" style={DESIGN_TOKENS.chartContainer as any}>
            <InfographicChart config={chartConfig} height={260} />
          </div>
        );
        return null;
      })()}
    </SlideWithImage>
  );
}
