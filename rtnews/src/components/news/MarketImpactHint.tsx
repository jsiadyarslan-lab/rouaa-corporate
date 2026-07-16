'use client';

// ═══════════════════════════════════════════════════════════════════
// MarketImpactHint — one-line AI-style impact prediction per news card
// ═══════════════════════════════════════════════════════════════════
// Renders a short colored hint like:
//   📈 "May pressure oil prices lower"     (bearish tone — red)
//   📈 "May lift Bitcoin"                  (bullish tone — green)
//   ⚖️ "Mixed impact on Gold"              (neutral tone — gray)
//
// The hint is derived from the news item's affectedAssets field
// (which is set during pipeline analysis) using news-content-filter's
// deriveMarketImpactHint() — no extra API call needed.

import { useMemo } from 'react';
import { deriveMarketImpactHint } from '@/lib/news-content-filter';
import { getNewsStrings, NewsLocale } from '@/lib/news-i18n';

interface MarketImpactHintProps {
  item: {
    sentiment?: string;
    impactLevel?: string;
    affectedAssets?: Array<{ symbol: string; direction?: string }> | string;
    category?: string;
  };
  locale: NewsLocale;
  colors: {
    textSecondary: string;
    textMuted: string;
    green: string;
    red: string;
    cyan: string;
    border: string;
    inputBg: string;
    isDark: boolean;
  };
}

export default function MarketImpactHint({ item, locale, colors: C }: MarketImpactHintProps) {
  const s = getNewsStrings(locale);
  const hint = useMemo(() => deriveMarketImpactHint(item, locale), [item, locale]);

  if (!hint) return null;

  const toneColor = hint.tone === 'bullish' ? C.green : hint.tone === 'bearish' ? C.red : C.cyan;
  const toneIcon = hint.tone === 'bullish' ? '📈' : hint.tone === 'bearish' ? '📉' : '⚖️';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '6px 10px',
      borderRadius: '8px',
      background: C.inputBg,
      border: `1px solid ${C.border}`,
      borderInlineStart: `2px solid ${toneColor}`,
    }}>
      <span style={{ fontSize: '11px', flexShrink: 0 }}>{toneIcon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '8px', fontWeight: 700, color: C.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '1px',
        }}>
          {s.marketImpact}
        </div>
        <div style={{
          fontSize: '11px', fontWeight: 600, color: toneColor,
          lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {hint.text}
        </div>
      </div>
      {/* Confidence meter */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <div style={{
          width: '32px', height: '3px', borderRadius: '2px',
          background: C.border, overflow: 'hidden',
        }}>
          <div style={{
            width: `${hint.confidence * 100}%`,
            height: '100%',
            background: toneColor,
            borderRadius: '2px',
          }} />
        </div>
        <span style={{
          fontSize: '7px', color: C.textMuted, marginTop: '2px',
          fontFamily: 'var(--font-jetbrains-mono, monospace)',
        }}>
          {Math.round(hint.confidence * 100)}%
        </span>
      </div>
    </div>
  );
}
