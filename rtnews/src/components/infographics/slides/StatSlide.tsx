// ─── Stat Slide V12 ────────────────────────────────────────
// V12: Uses DESIGN_TOKENS for all colors/fonts — no hardcoded values

'use client';

import { InfographicSlide, StatItem, DESIGN_TOKENS, getDirectionColor } from '../types';
import * as LucideIcons from 'lucide-react';

interface StatSlideProps {
  slide: InfographicSlide;
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
}

const STAT_I18N = {
  ar: { noData: 'لا توجد بيانات كافية لعرض هذه الشريحة' },
  en: { noData: 'Insufficient data to display this slide' },
  es: { noData: 'Insufficient data to display this slide' },
  fr: { noData: 'Insufficient data to display this slide' },
  tr: { noData: 'Insufficient data to display this slide' },
};

export default function StatSlide({ slide, locale = 'ar' }: StatSlideProps) {
  const accentColor = slide.accentColor || DESIGN_TOKENS.info;
  const stats = slide.content.stats || [];
  const IconComponent = slide.icon ? (LucideIcons as any)[slide.icon] : LucideIcons.BarChart3;

  if (stats.length === 0) {
    return <FallbackSlide slide={slide} locale={locale} />;
  }

  return (
    <div className="flex flex-col min-h-[320px] p-6 sm:p-8 rounded-2xl"
      style={{ background: DESIGN_TOKENS.slideGradients.data(accentColor) }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: accentColor + '15', color: accentColor }}>
          <IconComponent size={20} aria-hidden="true" />
        </div>
        <h2 className="text-[22px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary, fontFamily: DESIGN_TOKENS.fontTitle }}>{slide.title}</h2>
      </div>

      {/* Stats Grid — responsive: 1 col mobile, 2 col desktop */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat: StatItem, index: number) => {
          const dirColor = getDirectionColor(stat.direction);
          const DirIcon = stat.direction === 'up' ? LucideIcons.TrendingUp : stat.direction === 'down' ? LucideIcons.TrendingDown : null;

          return (
            <div key={index} className="flex flex-col items-center justify-center p-5 rounded-xl"
              style={{
                background: DESIGN_TOKENS.bgCard,
                border: `1px solid ${DESIGN_TOKENS.borderDefault}`,
                borderInlineStart: `3px solid ${dirColor}`,
              }}>
              <span className="text-[26px] font-bold mb-1" style={{ color: DESIGN_TOKENS.textPrimary, fontFamily: DESIGN_TOKENS.fontData }}>
                {stat.value}
              </span>
              <span className="text-[12px] font-medium mb-2 text-center" style={{ color: DESIGN_TOKENS.textSecondary, fontFamily: DESIGN_TOKENS.fontBody }}>
                {stat.label}
              </span>
              {stat.change && (
                <div className="flex items-center gap-1">
                  {DirIcon && <DirIcon size={12} style={{ color: dirColor }} aria-hidden="true" />}
                  <span className="text-[12px] font-bold" style={{ color: dirColor, fontFamily: DESIGN_TOKENS.fontData }}>
                    {stat.change}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Fallback for empty slides ────────────────────────────
function FallbackSlide({ slide, locale = 'ar' }: { slide: InfographicSlide; locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr' }) {
  const t = STAT_I18N[locale];
  const accentColor = slide.accentColor || DESIGN_TOKENS.info;
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] p-8 rounded-2xl text-center"
      style={{ background: DESIGN_TOKENS.slideGradients.data(accentColor) }}>
      <LucideIcons.Info size={32} style={{ color: DESIGN_TOKENS.textMuted, marginBottom: '12px' }} aria-hidden="true" />
      <p className="text-[14px]" style={{ color: DESIGN_TOKENS.textSecondary }}>
        {t.noData}
      </p>
    </div>
  );
}
