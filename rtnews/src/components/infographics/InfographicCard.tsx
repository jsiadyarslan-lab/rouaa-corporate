// ─── Infographic Card V17 ────────────────────────────────────
// V17: Responsive design fixes — touch targets, ellipsis, stat overlay,
//      badge alignment, image aspect ratio, spacing, date contrast

'use client';

import Link from 'next/link';
import { InfographicData, COLOR_MAP, STATUS_COLORS, getCategoryColor, DESIGN_TOKENS, hexToRgba } from './types';
import { Calendar, AlertTriangle, Info, TrendingUp, ShieldAlert, ChevronLeft } from 'lucide-react';
import { getProxiedImageUrl } from '@/lib/image-proxy';

type LocaleId = 'ar' | 'en' | 'es' | 'fr' | 'tr';

interface InfographicCardProps {
  infographic: InfographicData;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export default function InfographicCard({ infographic, locale = 'ar' }: InfographicCardProps) {
  const firstSlide = infographic.slides?.[0] as any;

  // Extract hero slide data
  const heroNumber = firstSlide?.content?.heroNumber || firstSlide?.heroNumber || '';
  const heroUnit = firstSlide?.content?.heroUnit || firstSlide?.heroUnit || '';
  const status = firstSlide?.content?.status || '';
  const colorName = firstSlide?.content?.color || firstSlide?.color || '';
  const subtitle = firstSlide?.subtitle || firstSlide?.content?.subtitle || infographic.subtitle || '';

  // Determine colors — use category color for accent (but don't show category text)
  const mainColor = COLOR_MAP[colorName] || firstSlide?.accentColor || getCategoryColor(infographic.category);
  const statusColor = STATUS_COLORS[status] || mainColor;

  // Image from first slide
  const rawImageUrl = firstSlide?.image_url || firstSlide?.imageUrl || firstSlide?.content?.image_url;
  // V124: Route through image proxy for Pollinations URLs (server-side caching)
  const imageUrl = getProxiedImageUrl(rawImageUrl) || rawImageUrl;
  const overlay = firstSlide?.image_overlay ?? 0.50;

  // Format date
  const dateStr = new Date(infographic.publishedAt || infographic.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'tr' ? 'tr-TR' : locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Status label — translate Arabic status to English when locale is 'en'
  const STATUS_LABEL_MAP: Record<string, Record<string, string>> = {
    'عاجل': { en: 'Breaking', fr: 'Urgent', tr: 'Acil', es: 'Urgente' },
    'مهم': { en: 'Important', fr: 'Important', tr: 'Önemli', es: 'Importante' },
    'فرصة': { en: 'Opportunity', fr: 'Opportunité', tr: 'Fırsat', es: 'Oportunidad' },
    'تحذير': { en: 'Warning', fr: 'Avertissement', tr: 'Uyarı', es: 'Advertencia' },
  };
  const statusLabel = STATUS_LABEL_MAP[status]?.[locale] || status;

  // Status icon
  const StatusIcon = status === 'عاجل' ? AlertTriangle
    : status === 'مهم' ? Info
    : status === 'فرصة' ? TrendingUp
    : status === 'تحذير' ? ShieldAlert
    : null;

  return (
    <Link href={locale === 'en' ? `/en/infographics/${infographic.slug}` : locale === 'tr' ? `/tr/infographics/${infographic.slug}` : locale === 'fr' ? `/fr/infographics/${infographic.slug}` : locale === 'es' ? `/es/infographics/${infographic.slug}` : `/infographics/${infographic.slug}`} className="block">
      <div className="group relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer h-full flex flex-col"
        style={{
          border: `1px solid ${DESIGN_TOKENS.borderDefault}`,
          boxShadow: DESIGN_TOKENS.shadowCard,
          background: DESIGN_TOKENS.bgSlide,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = mainColor + '30';
          e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.45), 0 0 16px ${mainColor}10`;
          e.currentTarget.style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = DESIGN_TOKENS.borderDefault;
          e.currentTarget.style.boxShadow = DESIGN_TOKENS.shadowCard;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Hero Preview Area — V17: fixed aspect ratio for consistent card heights */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] flex flex-col justify-end overflow-hidden"
          style={{ background: imageUrl ? undefined : `linear-gradient(150deg, ${mainColor}10 0%, ${DESIGN_TOKENS.bgDeep} 35%, ${DESIGN_TOKENS.bgDeep} 100%)` }}>

          {/* Background Image */}
          {imageUrl && (
            <>
              <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-108"
                style={{ backgroundImage: `url(${imageUrl})` }} />
              {/* V17: Stronger overlay for text readability */}
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(10,14,26,0.05) 0%, rgba(10,14,26,${overlay * 0.3}) 15%, rgba(10,14,26,${overlay * 0.65}) 45%, rgba(10,14,26,0.95) 100%)` }} />
            </>
          )}

          {/* Decorative when no image — subtle accent glow */}
          {!imageUrl && (
            <>
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `radial-gradient(circle at 20% 30%, ${mainColor} 0%, transparent 45%), radial-gradient(circle at 80% 70%, ${mainColor} 0%, transparent 45%)`,
              }} />
              <div className="absolute inset-0 opacity-[0.012]" style={{
                backgroundImage: `repeating-linear-gradient(0deg, ${mainColor} 0px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, ${mainColor} 0px, transparent 1px, transparent 60px)`,
              }} />
            </>
          )}

          {/* Top badge — status only */}
          <div className="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5">
              {status && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold min-h-[28px]"
                  style={{ background: imageUrl ? 'rgba(0,0,0,0.60)' : hexToRgba(statusColor, 0.12), color: statusColor, border: `1px solid ${statusColor}35`, backdropFilter: imageUrl ? 'blur(8px)' : undefined }}>
                  {StatusIcon && <StatusIcon size={11} aria-hidden="true" />}
                  {statusLabel}
                </span>
              )}
            </div>
            {/* Color dot indicator — subtle visual cue */}
            <div className="w-3 h-3 rounded-full" style={{ background: mainColor, boxShadow: `0 0 8px ${mainColor}40` }} />
          </div>

          {/* Hero Number — V17: added contrast pill background for readability */}
          {heroNumber && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
              <div className="px-4 py-2 rounded-xl" style={{ background: imageUrl ? 'rgba(10,14,26,0.45)' : 'transparent', backdropFilter: imageUrl ? 'blur(6px)' : undefined }}>
                <span className="text-[36px] sm:text-[44px] font-bold leading-none tracking-tight"
                  style={{ color: mainColor, textShadow: `0 4px 24px ${mainColor}25`, fontFamily: DESIGN_TOKENS.fontData, fontFeatureSettings: DESIGN_TOKENS.fontFeatureSettings }}>
                  {heroNumber}
                </span>
                {heroUnit && (
                  <span className="block text-[11px] sm:text-[12px] font-semibold mt-1.5"
                    style={{ color: DESIGN_TOKENS.textLabel, textShadow: '0 2px 8px rgba(0,0,0,0.6)', fontFamily: DESIGN_TOKENS.fontBody }}>
                    {heroUnit}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Bottom content overlay */}
          <div className="relative z-10 p-4 sm:p-5 pt-12 mt-auto">
            {/* Title — V17: proper line-clamp with ellipsis for truncated text */}
            <h3 className="text-[14px] sm:text-[16px] font-bold mb-1.5 leading-snug"
              style={{
                color: DESIGN_TOKENS.textPrimary,
                textShadow: imageUrl ? DESIGN_TOKENS.textShadowOverImage : undefined,
                fontFamily: DESIGN_TOKENS.fontTitle,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
              {infographic.title}
            </h3>

            {/* Subtitle — V17: proper line-clamp with ellipsis */}
            {subtitle && (
              <p className="text-[11px] sm:text-[12px] mb-2.5 leading-relaxed"
                style={{
                  color: imageUrl ? 'rgba(255,255,255,0.50)' : DESIGN_TOKENS.textSecondary,
                  fontFamily: DESIGN_TOKENS.fontBody,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                {subtitle}
              </p>
            )}

            {/* Accent line */}
            <div className="w-12 h-[2px] rounded-full"
              style={{ background: `linear-gradient(90deg, ${mainColor}, ${mainColor}30, transparent)` }} />
          </div>
        </div>

        {/* Footer — V17: larger touch targets, better date contrast */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 mt-auto"
          style={{ background: DESIGN_TOKENS.bgDeep, borderTop: `1px solid ${DESIGN_TOKENS.borderDefault}` }}>
          <span className="flex items-center gap-1.5 text-[11px] sm:text-[12px]"
            style={{ color: DESIGN_TOKENS.textSecondary, fontFamily: DESIGN_TOKENS.fontBody }}>
            <Calendar size={12} />
            {dateStr}
          </span>

          <span className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-bold transition-all duration-200 group-hover:gap-2 min-h-[32px]"
            style={{ color: mainColor, fontFamily: DESIGN_TOKENS.fontBody }}>
            {locale === 'en' ? 'View' : locale === 'tr' ? 'Görüntüle' : locale === 'fr' ? 'Voir' : locale === 'es' ? 'Ver' : 'عرض'}
            <ChevronLeft size={14} style={{ transform: locale === 'ar' ? undefined : 'scaleX(-1)' }} />
          </span>
        </div>

        {/* Bottom accent line — animated on hover */}
        <div className="h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out"
          style={{ background: `linear-gradient(90deg, ${mainColor}, ${mainColor}50, transparent)` }} />
      </div>
    </Link>
  );
}
