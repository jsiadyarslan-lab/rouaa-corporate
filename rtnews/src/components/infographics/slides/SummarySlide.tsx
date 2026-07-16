// ─── Summary Slide V4 ────────────────────────────────────────
// V4: Added locale prop for English/Arabic UI text translation
// V3: Empty fallback + mobile responsive

'use client';

import { InfographicSlide } from '../types';
import * as LucideIcons from 'lucide-react';

interface SummarySlideProps {
  slide: InfographicSlide;
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
}

// V4: Translation map
const SUMMARY_I18N = {
  ar: {
    noSummaries: 'لا توجد ملخصات متاحة',
    footer: 'رؤى — تحليلات بصرية اقتصادية',
  },
  en: {
    noSummaries: 'No summaries available',
    footer: 'Rouaa — Visual Economic Analysis',
  },
  es: {
    noSummaries: 'No summaries available',
    footer: 'Rouaa — Visual Economic Analysis',
  },
  fr: {
    noSummaries: 'No summaries available',
    footer: 'Rouaa — Visual Economic Analysis',
  },
  tr: {
    noSummaries: 'No summaries available',
    footer: 'Rouaa — Visual Economic Analysis',
  },
};

export default function SummarySlide({ slide, locale = 'ar' }: SummarySlideProps) {
  const t = SUMMARY_I18N[locale];
  const accentColor = slide.accentColor || '#10B981';
  const summaryItems = (slide.content.summary || []).filter((s: string) => s && s.trim().length > 0);
  const IconComponent = slide.icon ? (LucideIcons as any)[slide.icon] : LucideIcons.Target;

  if (summaryItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] p-8 rounded-2xl text-center"
        style={{ background: 'linear-gradient(180deg, #0c1120 0%, #0B0F19 100%)' }}>
        <LucideIcons.Info size={32} style={{ color: '#6B7280', marginBottom: '12px' }} aria-hidden="true" />
        <p className="text-[14px]" style={{ color: '#8B95A8' }}>{t.noSummaries}</p>
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

      {/* Summary Items */}
      <div className="flex-1 space-y-3 sm:space-y-4">
        {summaryItems.map((item: string, index: number) => (
          <div key={index} className="flex items-start gap-3 p-3 sm:p-4 rounded-xl"
            style={{ background: '#151A22', border: '1px solid #2A313C', borderInlineStart: `3px solid ${accentColor}` }}>
            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mt-0.5"
              style={{ background: accentColor + '15', color: accentColor }}>
              <span className="text-[12px] sm:text-[13px] font-bold">{index + 1}</span>
            </div>
            <p className="text-[13px] sm:text-[14px] leading-relaxed pt-1" style={{ color: '#C8CDD6' }}>
              {item}
            </p>
          </div>
        ))}
      </div>

      {/* Footer badge */}
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 flex items-center justify-center" style={{ borderTop: '1px solid #2A313C' }}>
        <span className="text-[10px] sm:text-[11px] font-semibold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full"
          style={{ background: accentColor + '10', color: accentColor, border: `1px solid ${accentColor}25` }}>
          {t.footer}
        </span>
      </div>
    </div>
  );
}
