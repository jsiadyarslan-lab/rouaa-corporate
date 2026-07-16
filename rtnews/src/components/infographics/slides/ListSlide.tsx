// ─── List Slide ────────────────────────────────────────────
// V3: Empty fallback + mobile responsive

'use client';

import { InfographicSlide, ListItem } from '../types';
import * as LucideIcons from 'lucide-react';

interface ListSlideProps {
  slide: InfographicSlide;
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
}

const LIST_I18N = {
  ar: { noData: 'لا توجد بيانات كافية لعرض هذه الشريحة' },
  en: { noData: 'Insufficient data to display this slide' },
  es: { noData: 'Insufficient data to display this slide' },
  fr: { noData: 'Insufficient data to display this slide' },
  tr: { noData: 'Insufficient data to display this slide' },
};

export default function ListSlide({ slide, locale = 'ar' }: ListSlideProps) {
  const t = LIST_I18N[locale];
  const accentColor = slide.accentColor || '#10B981';
  const items = slide.content.items || [];
  const IconComponent = slide.icon ? (LucideIcons as any)[slide.icon] : LucideIcons.List;

  if (items.length === 0) {
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

      {/* Items */}
      <div className="flex-1 space-y-2 sm:space-y-3">
        {items.map((item: ListItem, index: number) => {
          const ItemIcon = item.icon ? (LucideIcons as any)[item.icon] : LucideIcons.CircleDot;
          return (
            <div key={index} className="flex items-start gap-3 p-3 sm:p-4 rounded-xl transition-colors"
              style={{ background: '#151A22', border: '1px solid #2A313C', borderInlineStart: `3px solid ${accentColor}` }}>
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: accentColor + '12', color: accentColor }}>
                <ItemIcon size={16} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="text-[13px] sm:text-[14px] font-bold mb-0.5 sm:mb-1" style={{ color: '#F0F2F7' }}>{item.title}</h3>
                <p className="text-[11px] sm:text-[12px] leading-relaxed" style={{ color: '#8B95A8' }}>{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
