// ─── Scenarios Slide V12 — السيناريوهات ──────────────────────
// V12: Added locale prop for English/Arabic UI text translation
// V11: Triple-zone gradient DNA (green/amber/red) + unified tokens + improved slope chart

'use client';

import { InfographicSlide, ScenarioItem, COLOR_MAP, getCategoryColor, DESIGN_TOKENS, hexToRgba } from '../types';
import SlideWithImage, { EmptySlideFallback } from './SlideWithImage';
import { InfographicChart, buildSlideChartConfig } from '../InfographicChart';
import * as LucideIcons from 'lucide-react';

// V11: Unified constants
const TEXT_SHADOW_IMG = DESIGN_TOKENS.textShadowOverImage;

interface ScenariosSlideProps {
  slide: InfographicSlide;
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
}

// V12: Translation map
const SCEN_I18N = {
  ar: {
    optimistic: 'متفائل',
    neutral: 'محايد',
    pessimistic: 'متشائم',
    noScenarios: 'لا توجد سيناريوهات',
    result: 'النتيجة:',
    price: 'السعر:',
  },
  en: {
    optimistic: 'Optimistic',
    neutral: 'Neutral',
    pessimistic: 'Pessimistic',
    noScenarios: 'No scenarios available',
    result: 'Result:',
    price: 'Price:',
  },
  es: {
    optimistic: 'Optimistic',
    neutral: 'Neutral',
    pessimistic: 'Pessimistic',
    noScenarios: 'No scenarios available',
    result: 'Result:',
    price: 'Price:',
  },
  fr: {
    optimistic: 'Optimistic',
    neutral: 'Neutral',
    pessimistic: 'Pessimistic',
    noScenarios: 'No scenarios available',
    result: 'Result:',
    price: 'Price:',
  },
  tr: {
    optimistic: 'Optimistic',
    neutral: 'Neutral',
    pessimistic: 'Pessimistic',
    noScenarios: 'No scenarios available',
    result: 'Result:',
    price: 'Price:',
  },
};

const SCENARIO_CONFIG_AR = {
  optimistic: {
    color: DESIGN_TOKENS.success,
    bg: hexToRgba(DESIGN_TOKENS.success, 0.07),
    border: hexToRgba(DESIGN_TOKENS.success, 0.20),
    icon: LucideIcons.TrendingUp,
    labelAr: 'متفائل',
    glow: DESIGN_TOKENS.shadowGlow(DESIGN_TOKENS.success, 15),
  },
  neutral: {
    color: DESIGN_TOKENS.warning,
    bg: hexToRgba(DESIGN_TOKENS.warning, 0.07),
    border: hexToRgba(DESIGN_TOKENS.warning, 0.20),
    icon: LucideIcons.Minus,
    labelAr: 'محايد',
    glow: DESIGN_TOKENS.shadowGlow(DESIGN_TOKENS.warning, 15),
  },
  pessimistic: {
    color: DESIGN_TOKENS.danger,
    bg: hexToRgba(DESIGN_TOKENS.danger, 0.07),
    border: hexToRgba(DESIGN_TOKENS.danger, 0.20),
    icon: LucideIcons.TrendingDown,
    labelAr: 'متشائم',
    glow: DESIGN_TOKENS.shadowGlow(DESIGN_TOKENS.danger, 15),
  },
};

export default function ScenariosSlide({ slide, locale = 'ar' }: ScenariosSlideProps) {
  const t = SCEN_I18N[locale];
  const colorName = (slide as any).content.color || slide.color || '';
  const accentColor = COLOR_MAP[colorName] || slide.accentColor || getCategoryColor(slide.content.tag);
  const scenarios = slide.content.scenarios || [];

  if (scenarios.length === 0) {
    return <EmptySlideFallback icon={LucideIcons.GitBranch} text={t.noScenarios} locale={locale} />;
  }

  return (
    <SlideWithImage slide={slide} fallbackIcon={LucideIcons.GitBranch} fallbackText={t.noScenarios} slideType="scenarios" locale={locale}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: accentColor + '18', color: accentColor }}>
          <LucideIcons.GitBranch size={22} aria-hidden="true" />
        </div>
        <h2 className="text-[20px] sm:text-[22px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary, textShadow: TEXT_SHADOW_IMG }}>{slide.title}</h2>
      </div>

      {/* Scenarios — each with its own zone color */}
      <div className="flex-1 space-y-3.5">
        {scenarios.map((scenario: ScenarioItem, index: number) => {
          const config = SCENARIO_CONFIG_AR[scenario.type] || SCENARIO_CONFIG_AR.neutral;
          const ScenarioIcon = config.icon;
          const scenarioLabel = locale === 'en'
            ? (scenario.type === 'optimistic' ? t.optimistic : scenario.type === 'pessimistic' ? t.pessimistic : t.neutral)
            : config.labelAr;
          return (
            <div key={index} className="p-3.5 sm:p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
              style={{
                background: config.bg,
                border: `1px solid ${config.border}`,
                borderInlineStart: `4px solid ${config.color}`,
                boxShadow: config.glow,
              }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <ScenarioIcon size={18} style={{ color: config.color }} aria-hidden="true" />
                  <span className="text-[15px] sm:text-[17px] font-bold" style={{ color: config.color, textShadow: TEXT_SHADOW_IMG }}>
                    {scenario.name || scenarioLabel}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-lg font-semibold"
                  style={{ background: config.color + '15', color: config.color }}>
                  {scenario.probability}
                </span>
              </div>
              <p className="text-[12px] sm:text-[13px] leading-relaxed" style={{ color: DESIGN_TOKENS.textLabel, textShadow: TEXT_SHADOW_IMG }}>
                {scenario.condition}
              </p>
              {scenario.result && (
                <p className="text-[11px] sm:text-[12px] mt-1.5" style={{ color: DESIGN_TOKENS.textSymbol }}>{t.result} {scenario.result}</p>
              )}
              {scenario.price && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <LucideIcons.Target size={12} style={{ color: config.color }} aria-hidden="true" />
                  <span className="text-[11px] sm:text-[12px] font-bold" style={{ color: DESIGN_TOKENS.textData, textShadow: TEXT_SHADOW_IMG, fontFamily: DESIGN_TOKENS.fontData, fontFeatureSettings: DESIGN_TOKENS.fontFeatureSettings }}>{t.price} {scenario.price}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ECharts Slope Chart */}
      {(() => {
        const chartConfig = slide.chart_config || buildSlideChartConfig(slide);
        if (chartConfig) return (
          <div className="mt-4 rounded-2xl p-4" style={DESIGN_TOKENS.chartContainer as any}>
            <InfographicChart config={chartConfig} height={250} />
          </div>
        );
        return null;
      })()}
    </SlideWithImage>
  );
}
