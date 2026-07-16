'use client';

// ═══════════════════════════════════════════════════════════════════
// StrategicReportCard V3 — matches the visual style of /reports cards
// ═══════════════════════════════════════════════════════════════════
// V3 fixes from V2 feedback ("cards look awful"):
//   - Removed the tiny thumbnail image (was 120px of wasted space)
//   - Added prominent image area (140px) matching /reports card style
//   - Cleaner overlay badges (top-left impact, top-right scope)
//   - Removed inline AI summary button (was confusing)
//   - Removed inline Listen button (was cluttering)
//   - Hover effects now scale the image like /reports
//   - Footer matches /reports pattern (date + reading time + read more)
//   - Strategic AI summary + Listen moved INSIDE the detail page, not the card
//
// Visual style now matches /reports/ReportsPageClient.tsx cards so the
// strategic reports page looks like the rest of the site.

import { useState } from 'react';
import Link from 'next/link';
import { getStrategicStrings, formatTimeAgoStrategic, formatDateStrategic, StrategicLocale } from '@/lib/strategic-reports-i18n';

export interface StrategicReport {
  id: string;
  title: string;
  slug: string;
  summary: string;
  reportType: string;
  scope: string;
  marketImpact: string;
  confidenceScore: number;
  imageUrl?: string;
  sectors: string[];
  publishedAt: string | null;
  createdAt: string;
}

interface StrategicReportCardProps {
  report: StrategicReport;
  locale: StrategicLocale;
}

// ─── Scope meta (icon + label key) ─────────────────────────────
const SCOPE_META: Record<string, { icon: string; labelKey: 'global' | 'arabic' | 'regional' | 'domestic' }> = {
  global: { icon: '🌍', labelKey: 'global' },
  arabic: { icon: '🕌', labelKey: 'arabic' },
  regional: { icon: '🗺️', labelKey: 'regional' },
  domestic: { icon: '🏠', labelKey: 'domestic' },
};

// ─── Sector → emoji mapping ────────────────────────────────────
function getSectorIcon(sector: string): string {
  const s = sector.toLowerCase();
  if (s.includes('سياس') || s.includes('politic')) return '🏛️';
  if (s.includes('اقتصاد') || s.includes('econom')) return '📊';
  if (s.includes('سوق') || s.includes('market')) return '📈';
  if (s.includes('طاقة') || s.includes('energ') || s.includes('نفط') || s.includes('oil')) return '⚡';
  if (s.includes('عمل') || s.includes('currency') || s.includes('forex')) return '💱';
  if (s.includes('كريبتو') || s.includes('crypto') || s.includes('بتكوين')) return '₿';
  if (s.includes('بنك') || s.includes('bank')) return '🏦';
  if (s.includes('سلع') || s.includes('commodit') || s.includes('ذهب') || s.includes('gold')) return '🥇';
  if (s.includes('تقن') || s.includes('tech')) return '💻';
  if (s.includes('جيو') || s.includes('geopolit')) return '🌍';
  if (s.includes('غذاء') || s.includes('food')) return '🌾';
  if (s.includes('مناخ') || s.includes('climate')) return '🌡️';
  if (s.includes('عسكري') || s.includes('military')) return '⚔️';
  if (s.includes('هجرة') || s.includes('migrat')) return '🚶';
  return '📌';
}

// ─── Strip "تقرير استراتيجي:" prefix ──────────────────────────
function stripStrategicPrefix(title: string): string {
  return title
    .replace(/^تقرير استراتيجي:\s*/i, '')
    .replace(/^تقرير استراتيجي\s*[-–—:]\s*/i, '')
    .replace(/^Strategic Report:\s*/i, '')
    .replace(/^Strategic Report\s*[-–—:]\s*/i, '')
    .replace(/^Rapport Stratégique\s*[:\-–—]\s*/i, '')
    .replace(/^Stratejik Rapor\s*[:\-–—]\s*/i, '')
    .replace(/^Informe Estratégico\s*[:\-–—]\s*/i, '')
    .trim();
}

// ─── Component ─────────────────────────────────────────────────
export default function StrategicReportCard({
  report, locale,
}: StrategicReportCardProps) {
  const s = getStrategicStrings(locale);
  const [imageError, setImageError] = useState(false);

  const scopeMeta = SCOPE_META[report.scope] || SCOPE_META.global;
  const scopeLabel = s[`scope${scopeMeta.labelKey.charAt(0).toUpperCase()}${scopeMeta.labelKey.slice(1)}` as keyof typeof s] as string;
  const impactLabel = report.marketImpact === 'bullish' ? s.impactBullish : report.marketImpact === 'bearish' ? s.impactBearish : s.impactNeutral;
  const impactColor = report.marketImpact === 'bullish' ? 'var(--bull)' : report.marketImpact === 'bearish' ? 'var(--bear)' : 'var(--gold)';
  const title = stripStrategicPrefix(report.title);
  const reportHref = locale === 'ar' ? `/strategic-reports/${report.slug}` : `/${locale}/strategic-reports/${report.slug}`;
  const displayDate = report.publishedAt || report.createdAt;
  const isRTL = s.dir === 'rtl';

  // Reading time estimate (200 wpm)
  const readingTime = report.summary ? Math.max(1, Math.ceil(report.summary.split(/\s+/).length / 200)) : 3;

  // Date label (short form: "20 يونيو")
  const dateLabel = displayDate ? (() => {
    try {
      const d = new Date(displayDate);
      const localeTag = locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'tr' ? 'tr-TR' : locale === 'es' ? 'es-ES' : 'en-US';
      return d.toLocaleDateString(localeTag, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return ''; }
  })() : '';

  // Primary sector (first one for display)
  const primarySector = (report.sectors || [])[0];
  const primarySectorIcon = primarySector ? getSectorIcon(primarySector) : '🛡️';

  return (
    <Link
      href={reportHref}
      className="glass-card group transition-all duration-300 hover:-translate-y-1 block"
      style={{
        padding: 0,
        overflow: 'hidden',
        textDecoration: 'none',
        borderInlineStart: '3px solid var(--purple)',
      }}
    >
      {/* Image / Icon area — prominent, matches /reports style */}
      <div className="relative" style={{ height: '140px', overflow: 'hidden' }}>
        {report.imageUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={report.imageUrl}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            className="group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          // Gradient + big sector icon fallback (elegant, not cluttered)
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, var(--purple2), var(--cyan3))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
        )}

        {/* Strategic badge (top-end) */}
        <div style={{ position: 'absolute', top: '8px', insetInlineEnd: '8px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            fontSize: '9px', fontWeight: 700,
            padding: '3px 8px', borderRadius: '999px',
            background: 'var(--purple)', color: '#fff',
            backdropFilter: 'blur(8px)',
            fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
          }}>
            🛡️ {s.strategicBadge}
          </span>
        </div>

        {/* Impact badge (top-start) */}
        <div style={{ position: 'absolute', top: '8px', insetInlineStart: '8px' }}>
          <span style={{
            fontSize: '9px', fontWeight: 700,
            padding: '3px 8px', borderRadius: '999px',
            background: `${impactColor}cc`, color: '#fff',
            backdropFilter: 'blur(8px)',
            fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
          }}>
            {impactLabel}
          </span>
        </div>

        {/* Bottom gradient overlay for text readability */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(to top, var(--bg3), transparent)',
        }} />
      </div>

      {/* Content */}
      <div style={{ padding: '16px 20px' }}>
        {/* Title */}
        <h4 style={{
          fontSize: '15px', fontWeight: 700, color: 'var(--text-head)',
          lineHeight: 1.7, marginBottom: '8px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
          transition: 'color 0.2s',
        }} className="group-hover:text-[var(--cyan)]">
          {title}
        </h4>

        {/* Summary (2-line clamp) */}
        {report.summary && (
          <p style={{
            fontSize: '11px', color: 'var(--text2)', lineHeight: 1.8, marginBottom: '12px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {report.summary}
          </p>
        )}

        {/* Tags row: scope + sector */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
          marginBottom: '12px',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            padding: '2px 7px', borderRadius: '4px',
            background: 'var(--cyan3)', color: 'var(--cyan)',
            border: '1px solid var(--cyan2)',
            fontSize: '9px', fontWeight: 600,
            fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
          }}>
            {scopeMeta.icon} {scopeLabel}
          </span>
          {primarySector && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '2px 7px', borderRadius: '4px',
              background: 'var(--purple2)', color: 'var(--purple)',
              border: '1px solid var(--violet-dim)',
              fontSize: '9px', fontWeight: 600,
              fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
            }}>
              {primarySectorIcon} {primarySector.length > 15 ? primarySector.slice(0, 15) + '…' : primarySector}
            </span>
          )}
        </div>

        {/* Footer: date + reading time + confidence */}
        <div className="flex items-center justify-between" style={{ paddingTop: '10px', borderTop: '1px solid var(--rim)' }}>
          <div className="flex items-center gap-2">
            {dateLabel && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                fontSize: '10px', color: 'var(--text3)',
                fontFamily: 'var(--font-jetbrains-mono, monospace)',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {dateLabel}
              </span>
            )}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              fontSize: '10px', color: 'var(--text3)',
              fontFamily: 'var(--font-jetbrains-mono, monospace)',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {readingTime} {locale === 'ar' ? 'د' : 'm'}
            </span>
          </div>

          {/* Confidence score — small badge */}
          {report.confidenceScore > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '10px', fontWeight: 700,
              color: report.confidenceScore >= 70 ? 'var(--bull)' : report.confidenceScore >= 40 ? 'var(--gold)' : 'var(--bear)',
              fontFamily: 'var(--font-jetbrains-mono, monospace)',
            }} title={s.confidenceLabel}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {report.confidenceScore}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
