// ─── Timeline Slide ────────────────────────────────────────
// V3: Empty fallback + mobile responsive

'use client';

import { InfographicSlide, TimelineStep } from '../types';
import * as LucideIcons from 'lucide-react';

interface TimelineSlideProps {
  slide: InfographicSlide;
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
}

const TIMELINE_I18N = {
  ar: { noData: 'لا توجد بيانات زمنية كافية' },
  en: { noData: 'Insufficient timeline data' },
  es: { noData: 'Insufficient timeline data' },
  fr: { noData: 'Insufficient timeline data' },
  tr: { noData: 'Insufficient timeline data' },
};

export default function TimelineSlide({ slide, locale = 'ar' }: TimelineSlideProps) {
  const t = TIMELINE_I18N[locale];
  const accentColor = slide.accentColor || '#3b82f6';
  const steps = slide.content.steps || [];
  const IconComponent = slide.icon ? (LucideIcons as any)[slide.icon] : LucideIcons.Clock;

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] p-8 rounded-2xl text-center"
        style={{ background: 'linear-gradient(180deg, #0c1120 0%, #0B0F19 100%)' }}>
        <LucideIcons.Info size={32} style={{ color: '#6B7280', marginBottom: '12px' }} aria-hidden="true" />
        <p className="text-[14px]" style={{ color: '#8B95A8' }}>{t.noData}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[320px] p-6 sm:p-8 rounded-2xl"
      style={{ background: 'linear-gradient(180deg, #0c1120 0%, #0B0F19 100%)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: accentColor + '15', color: accentColor }}>
          <IconComponent size={20} aria-hidden="true" />
        </div>
        <h2 className="text-[18px] sm:text-[20px] font-bold" style={{ color: '#F0F2F7' }}>{slide.title}</h2>
      </div>

      {/* Timeline */}
      <div className="flex-1 relative" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="absolute right-[15px] top-0 bottom-0 w-[2px]" aria-hidden="true"
          style={{ background: `linear-gradient(180deg, ${accentColor}60, ${accentColor}10)` }} />

        <div className="space-y-4 sm:space-y-6">
          {steps.map((step: TimelineStep, index: number) => (
            <div key={index} className="flex gap-3 sm:gap-4 relative">
              <div className="relative z-10 flex-shrink-0 w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rounded-full flex items-center justify-center"
                style={{
                  background: accentColor + '20',
                  border: `2px solid ${accentColor}`,
                  color: accentColor,
                }}>
                <span className="text-[10px] sm:text-[11px] font-bold">{index + 1}</span>
              </div>

              <div className="flex-1 pt-0.5 sm:pt-1 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] sm:text-[14px] font-bold" style={{ color: '#F0F2F7' }}>{step.label}</span>
                  {step.date && (
                    <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: accentColor + '12', color: accentColor }}>
                      {step.date}
                    </span>
                  )}
                </div>
                {step.description && (
                  <p className="text-[12px] sm:text-[13px] leading-relaxed" style={{ color: '#8B95A8' }}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
