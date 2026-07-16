// ─── Comparison Slide ──────────────────────────────────────
// V3: Empty fallback + mobile responsive (stack on mobile)

'use client';

import { InfographicSlide } from '../types';
import * as LucideIcons from 'lucide-react';

interface ComparisonSlideProps {
  slide: InfographicSlide;
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
}

const COMP_I18N = {
  ar: { noData: 'لا توجد بيانات كافية للمقارنة' },
  en: { noData: 'Insufficient data for comparison' },
  es: { noData: 'Insufficient data for comparison' },
  fr: { noData: 'Insufficient data for comparison' },
  tr: { noData: 'Insufficient data for comparison' },
};

export default function ComparisonSlide({ slide, locale = 'ar' }: ComparisonSlideProps) {
  const t = COMP_I18N[locale];
  const accentColor = slide.accentColor || '#d4af37';
  const comp = slide.content.comparison;
  const IconComponent = slide.icon ? (LucideIcons as any)[slide.icon] : LucideIcons.GitCompareArrows;

  if (!comp || !comp.left?.items?.length || !comp.right?.items?.length) {
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

      {/* Comparison Grid — responsive: stack on mobile, side-by-side on desktop */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Left Column */}
        <div className="flex flex-col p-4 sm:p-5 rounded-xl" style={{ background: '#151A22', border: '1px solid #2A313C' }}>
          <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-3" style={{ borderBottom: '1px solid #2A313C' }}>
            <LucideIcons.MinusCircle size={14} style={{ color: '#EF4444' }} aria-hidden="true" />
            <span className="text-[13px] sm:text-[14px] font-bold" style={{ color: '#8B95A8' }}>{comp.left.label}</span>
          </div>
          <ul className="space-y-2 sm:space-y-3 flex-1">
            {comp.left.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] sm:text-[13px]" style={{ color: '#C8CDD6' }}>
                <LucideIcons.X size={12} className="flex-shrink-0 mt-1" style={{ color: '#EF4444' }} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column */}
        <div className="flex flex-col p-4 sm:p-5 rounded-xl" style={{ background: '#151A22', border: '1px solid #2A313C' }}>
          <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-3" style={{ borderBottom: '1px solid #2A313C' }}>
            <LucideIcons.CheckCircle size={14} style={{ color: '#10B981' }} aria-hidden="true" />
            <span className="text-[13px] sm:text-[14px] font-bold" style={{ color: '#8B95A8' }}>{comp.right.label}</span>
          </div>
          <ul className="space-y-2 sm:space-y-3 flex-1">
            {comp.right.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] sm:text-[13px]" style={{ color: '#C8CDD6' }}>
                <LucideIcons.Check size={12} className="flex-shrink-0 mt-1" style={{ color: '#10B981' }} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
