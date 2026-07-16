'use client';

// ═══════════════════════════════════════════════════════════════════
// NewsTrustBadge — small badge showing source reliability tier
// ═══════════════════════════════════════════════════════════════════

import { getSourceTrust, getTrustLabel, TrustTier } from '@/lib/news-trust-index';

interface NewsTrustBadgeProps {
  source: string | undefined | null;
  locale: string;
  compact?: boolean;       // when true, renders as a tiny icon-only pill
}

export default function NewsTrustBadge({ source, locale, compact = false }: NewsTrustBadgeProps) {
  if (!source) return null;
  const trust = getSourceTrust(source);
  const label = getTrustLabel(trust.tier, locale);

  if (compact) {
    // Tiny icon-only badge — for use inside dense card layouts
    return (
      <span
        title={`${label} (${trust.score}/100)`}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '14px', height: '14px', borderRadius: '50%',
          background: trust.bg,
          color: trust.color,
          fontSize: '9px', fontWeight: 700,
          border: `1px solid ${trust.border}`,
          fontFamily: 'var(--font-jetbrains-mono, monospace)',
          flexShrink: 0,
        }}
      >
        {trust.icon}
      </span>
    );
  }

  return (
    <span
      title={`${label} — ${trust.score}/100`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '3px',
        padding: '2px 7px',
        borderRadius: '4px',
        background: trust.bg,
        color: trust.color,
        border: `1px solid ${trust.border}`,
        fontSize: '9px', fontWeight: 600,
        letterSpacing: '0.2px',
        fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
        flexShrink: 0,
      }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '10px', height: '10px', borderRadius: '50%',
        background: trust.color, color: '#fff',
        fontSize: '7px', fontWeight: 700,
      }}>
        {trust.icon}
      </span>
      {label}
    </span>
  );
}
