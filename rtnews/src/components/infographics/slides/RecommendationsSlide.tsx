// ─── Recommendations Slide V12 — التوصيات والخلاصة ──────────────
// V12: Added locale prop for English/Arabic UI text translation
// V11: Unified DESIGN_TOKENS + slide-type gradient DNA + improved visual hierarchy

'use client';

import { InfographicSlide, COLOR_MAP, getCategoryColor, DESIGN_TOKENS, hexToRgba } from '../types';
import { InfographicChart, buildSlideChartConfig } from '../InfographicChart';
import * as LucideIcons from 'lucide-react';

interface RecommendationsSlideProps {
  slide: InfographicSlide;
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
}

// V12: Translation map
const REC_I18N = {
  ar: {
    dailyLabel: 'للمتداول اليومي',
    mediumLabel: 'للمستثمر متوسط المدى',
    longLabel: 'للمستثمر طويل المدى',
    noRecs: 'لا توجد توصيات متاحة',
    defaultCta: 'رؤى — تحليلات بخبرة اقتصادية',
    footer: 'رؤى — تحليلات بخبرة اقتصادية',
    at: 'عند',
    target: 'هدف:',
    stop: 'وقف:',
    horizon: 'أفق:',
    allocation: 'تخصيص:',
    buy: 'شراء',
    sell: 'بيع',
  },
  en: {
    dailyLabel: 'For Day Traders',
    mediumLabel: 'For Medium-term Investors',
    longLabel: 'For Long-term Investors',
    noRecs: 'No recommendations available',
    defaultCta: 'Rouaa — Expert Economic Analysis',
    footer: 'Rouaa — Expert Economic Analysis',
    at: 'at',
    target: 'Target:',
    stop: 'Stop:',
    horizon: 'Horizon:',
    allocation: 'Allocation:',
    buy: 'Buy',
    sell: 'Sell',
  },
  es: {
    dailyLabel: 'For Day Traders',
    mediumLabel: 'For Medium-term Investors',
    longLabel: 'For Long-term Investors',
    noRecs: 'No recommendations available',
    defaultCta: 'Rouaa — Expert Economic Analysis',
    footer: 'Rouaa — Expert Economic Analysis',
    at: 'at',
    target: 'Target:',
    stop: 'Stop:',
    horizon: 'Horizon:',
    allocation: 'Allocation:',
    buy: 'Buy',
    sell: 'Sell',
  },
  fr: {
    dailyLabel: 'For Day Traders',
    mediumLabel: 'For Medium-term Investors',
    longLabel: 'For Long-term Investors',
    noRecs: 'No recommendations available',
    defaultCta: 'Rouaa — Expert Economic Analysis',
    footer: 'Rouaa — Expert Economic Analysis',
    at: 'at',
    target: 'Target:',
    stop: 'Stop:',
    horizon: 'Horizon:',
    allocation: 'Allocation:',
    buy: 'Buy',
    sell: 'Sell',
  },
  tr: {
    dailyLabel: 'For Day Traders',
    mediumLabel: 'For Medium-term Investors',
    longLabel: 'For Long-term Investors',
    noRecs: 'No recommendations available',
    defaultCta: 'Rouaa — Expert Economic Analysis',
    footer: 'Rouaa — Expert Economic Analysis',
    at: 'at',
    target: 'Target:',
    stop: 'Stop:',
    horizon: 'Horizon:',
    allocation: 'Allocation:',
    buy: 'Buy',
    sell: 'Sell',
  },
};

export default function RecommendationsSlide({ slide, locale = 'ar' }: RecommendationsSlideProps) {
  const t = REC_I18N[locale];
  const colorName = (slide as any).content.color || slide.color || '';
  const accentColor = COLOR_MAP[colorName] || slide.accentColor || getCategoryColor(slide.content.tag);
  const recs = slide.content.recommendations || {};
  const daily = recs.daily || slide.content.daily;
  const medium = recs.medium || slide.content.medium;
  const long_ = recs.long || slide.content.long;
  const summary = (slide.content.summary || []).filter((s: string) => s && s.trim().length > 0);
  const cta = slide.content.cta || t.defaultCta;

  const hasContent = daily || medium || long_ || summary.length > 0;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] p-8 rounded-2xl text-center"
        style={{ background: DESIGN_TOKENS.slideGradients.recommendations(accentColor) }}>
        <LucideIcons.Target size={32} style={{ color: DESIGN_TOKENS.textMuted, marginBottom: '12px' }} aria-hidden="true" />
        <p className="text-[14px]" style={{ color: DESIGN_TOKENS.textSymbol }}>{t.noRecs}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 sm:p-8 rounded-2xl"
      style={{ background: DESIGN_TOKENS.slideGradients.recommendations(accentColor), minHeight: '320px' }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: accentColor + '18', color: accentColor }}>
          <LucideIcons.Target size={22} aria-hidden="true" />
        </div>
        <h2 className="text-[20px] sm:text-[22px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary }}>{slide.title}</h2>
      </div>

      {/* Recommendation Cards */}
      <div className="flex-1 space-y-3">
        {daily && <RecCard rec={daily} label={t.dailyLabel} icon={LucideIcons.Zap} accentColor={accentColor} locale={locale} />}
        {medium && <RecCard rec={medium} label={t.mediumLabel} icon={LucideIcons.Clock} accentColor={accentColor} locale={locale} />}
        {long_ && <RecCard rec={long_} label={t.longLabel} icon={LucideIcons.Building2} accentColor={accentColor} locale={locale} />}
      </div>

      {/* ECharts Funnel Chart */}
      {(() => {
        const chartConfig = slide.chart_config || buildSlideChartConfig(slide);
        if (chartConfig) return (
          <div className="mt-4 rounded-2xl p-4" style={DESIGN_TOKENS.chartContainer as any}>
            <InfographicChart config={chartConfig} height={230} />
          </div>
        );
        return null;
      })()}

      {/* Summary */}
      {summary.length > 0 && (
        <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${DESIGN_TOKENS.borderDefault}` }}>
          <div className="space-y-2.5">
            {summary.map((item: string, index: number) => (
              <div key={index} className="flex items-start gap-2.5">
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
                  style={{ background: accentColor + '15', color: accentColor }}>
                  <span className="text-[11px] font-bold">{index + 1}</span>
                </div>
                <p className="text-[13px] sm:text-[14px] leading-relaxed" style={{ color: DESIGN_TOKENS.textLabel }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <div className="mt-5 pt-4 flex items-center justify-center gap-3" style={{ borderTop: `1px solid ${DESIGN_TOKENS.borderDefault}` }}>
        <span className="text-[12px] sm:text-[13px] font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl"
          style={{ background: accentColor + '15', color: accentColor, border: `1px solid ${accentColor}30` }}>
          {cta}
        </span>
      </div>

      {/* Footer — source attribution */}
      <div className="mt-3 pt-2 flex items-center justify-center" style={{ borderTop: `1px solid rgba(255,255,255,0.03)` }}>
        <span className="text-[10px]" style={{ color: DESIGN_TOKENS.textMuted }}>
          {t.footer}
        </span>
      </div>
    </div>
  );
}

// ─── Recommendation Card ──────
function RecCard({ rec, label, icon: Icon, accentColor, locale }: { rec: any; label: string; icon: any; accentColor: string; locale: 'ar' | 'en' | 'es' | 'fr' | 'tr' }) {
  const t = REC_I18N[locale];
  // Support both Arabic and English action values
  const isBuy = rec.action === 'شراء' || rec.action?.toLowerCase() === 'buy';
  const isSell = rec.action === 'بيع' || rec.action?.toLowerCase() === 'sell';
  const actionColor = isBuy ? DESIGN_TOKENS.success : isSell ? DESIGN_TOKENS.danger : DESIGN_TOKENS.warning;

  // Translate action to display language
  const displayAction = locale === 'en'
    ? (isBuy ? t.buy : isSell ? t.sell : rec.action)
    : rec.action;

  return (
    <div className="p-4 sm:px-5 sm:py-4"
      style={{
        ...DESIGN_TOKENS.glassCard(actionColor + '25'),
        borderInlineStart: `3px solid ${actionColor}`,
        borderRadius: '0px',
        boxShadow: `0 1px 3px rgba(0,0,0,0.3)`,
      }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: accentColor }} aria-hidden="true" />
        <span className="text-[12px] sm:text-[13px] font-bold" style={{ color: DESIGN_TOKENS.textSymbol }}>{label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {rec.asset && <span className="text-[14px] sm:text-[15px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary }}>{rec.asset}</span>}
        {rec.symbol && <span className="text-[10px] font-mono font-bold" style={{ color: accentColor, fontFeatureSettings: DESIGN_TOKENS.fontFeatureSettings }}>{rec.symbol}</span>}
        {rec.action && (
          <span className="text-[11px] sm:text-[12px] px-2.5 py-0.5 rounded-full font-bold"
            style={{ background: actionColor + '15', color: actionColor, fontFamily: DESIGN_TOKENS.fontData }}>{displayAction}</span>
        )}
        {rec.entry && <span className="text-[11px]" style={{ color: DESIGN_TOKENS.textSymbol, fontFeatureSettings: DESIGN_TOKENS.fontFeatureSettings }}>{t.at} {rec.entry}</span>}
        {rec.target && <span className="text-[11px] font-bold" style={{ color: DESIGN_TOKENS.success, fontFeatureSettings: DESIGN_TOKENS.fontFeatureSettings }}>{t.target} {rec.target}</span>}
        {rec.stop && <span className="text-[11px] font-bold" style={{ color: DESIGN_TOKENS.danger, fontFeatureSettings: DESIGN_TOKENS.fontFeatureSettings }}>{t.stop} {rec.stop}</span>}
        {rec.horizon && <span className="text-[11px]" style={{ color: DESIGN_TOKENS.textSymbol }}>{t.horizon} {rec.horizon}</span>}
        {rec.timeframe && <span className="text-[11px]" style={{ color: DESIGN_TOKENS.textSymbol }}>{rec.timeframe}</span>}
        {rec.allocation && <span className="text-[11px] font-bold" style={{ color: accentColor, fontFeatureSettings: DESIGN_TOKENS.fontFeatureSettings }}>{t.allocation} {rec.allocation}</span>}
      </div>
      {/* Reason as separate line with muted color */}
      {rec.reason && (
        <p className="text-[11px] sm:text-[12px] mt-2 leading-relaxed" style={{ color: DESIGN_TOKENS.recCard.descriptionColor }}>
          {rec.reason}
        </p>
      )}
    </div>
  );
}
