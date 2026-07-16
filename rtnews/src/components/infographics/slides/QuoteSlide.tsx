// ─── Quote Slide ───────────────────────────────────────────
// V3: Check for empty quote text — skip slide if empty

'use client';

import { InfographicSlide } from '../types';
import * as LucideIcons from 'lucide-react';

interface QuoteSlideProps {
  slide: InfographicSlide;
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
}

export default function QuoteSlide({ slide, locale = 'ar' }: QuoteSlideProps) {
  const accentColor = slide.accentColor || '#d4af37';
  const quote = slide.content.quote;

  // V4: Strip Arabic quote marks «» before checking, return null if empty
  const rawText = (quote?.text || '').replace(/[«»\u00AB\u00BB"]/g, '').trim();
  if (!rawText || rawText.length < 5) return null; // Must have at least 5 chars of real text

  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] p-6 sm:p-8 rounded-2xl text-center"
      style={{ background: 'linear-gradient(180deg, #0c1120 0%, #0B0F19 100%)' }}>

      {/* Quote icon */}
      <div className="mb-6" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill={accentColor} opacity={0.3}>
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>

      {/* Quote text */}
      <blockquote className="text-[18px] sm:text-[24px] font-bold leading-relaxed max-w-[540px] mb-6"
        style={{ color: '#F0F2F7' }}>
        &laquo;{rawText}&raquo;
      </blockquote>

      {/* Divider */}
      <div className="w-12 h-[2px] rounded-full mb-4" aria-hidden="true"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

      {/* Author */}
      {quote.author && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: accentColor + '15', color: accentColor }}>
            <LucideIcons.User size={14} aria-hidden="true" />
          </div>
          <span className="text-[13px] sm:text-[14px] font-semibold" style={{ color: '#8B95A8' }}>
            {quote.author}
          </span>
        </div>
      )}
    </div>
  );
}
