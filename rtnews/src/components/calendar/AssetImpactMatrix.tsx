'use client';

// ═══════════════════════════════════════════════════════════════════
// AssetImpactMatrix — 6-asset table showing predicted impact direction
// ═══════════════════════════════════════════════════════════════════
// For each event, renders a compact horizontal row of 6 asset chips:
//   🥇 Gold    🛢️ Oil    ₿ BTC    📈 S&P    💵 DXY    🇪🇺 EUR/USD
//
// Each chip is color-coded:
//   Green ▲   = expected up
//   Red ▼     = expected down
//   Cyan ↔    = volatile
//   Gray —    = neutral

import { useMemo } from 'react';
import { assessPreImpact, ImpactDirection } from '@/lib/calendar-impact';
import { getCalendarStrings, CalendarLocale } from '@/lib/calendar-i18n';

interface AssetImpactMatrixProps {
  eventName: string;
  importance: string | number;
  locale: CalendarLocale;
  colors: CalendarColors;
  compact?: boolean;  // when true, render as inline chips; when false, render as labeled grid
}

interface CalendarColors {
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  cyan: string;
  cyanDim: string;
  green: string;
  red: string;
  gold: string;
  goldDim: string;
  inputBg: string;
  isDark: boolean;
}

const ASSET_META: Record<string, { icon: string; labelKey: string }> = {
  XAU: { icon: '🥇', labelKey: 'gold' },
  WTI: { icon: '🛢️', labelKey: 'oil' },
  BTC: { icon: '₿', labelKey: 'btc' },
  SPX: { icon: '📈', labelKey: 'sp500' },
  DXY: { icon: '💵', labelKey: 'dxy' },
  EURUSD: { icon: '🇪🇺', labelKey: 'eurusd' },
};

function getDirectionDisplay(direction: ImpactDirection, locale: CalendarLocale) {
  const s = getCalendarStrings(locale);
  switch (direction) {
    case 'up':
      return { icon: '▲', color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: s.expectedUp };
    case 'down':
      return { icon: '▼', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: s.expectedDown };
    case 'volatile':
      return { icon: '↔', color: '#06B6D4', bg: 'rgba(6,182,212,0.12)', label: s.expectedNeutral };
    case 'neutral':
    default:
      return { icon: '—', color: '#64748B', bg: 'rgba(100,116,139,0.08)', label: s.noImpactData };
  }
}

export default function AssetImpactMatrix({
  eventName,
  importance,
  locale,
  colors: C,
  compact = false,
}: AssetImpactMatrixProps) {
  const s = getCalendarStrings(locale);

  const assessment = useMemo(
    () => assessPreImpact(eventName, importance, locale),
    [eventName, importance, locale],
  );

  if (compact) {
    // Compact: 6 small chips in a row
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap',
      }}>
        {assessment.assetImpacts.map((impact) => {
          const meta = ASSET_META[impact.symbol] || { icon: '•', labelKey: impact.symbol };
          const display = getDirectionDisplay(impact.direction, locale);
          const isMuted = impact.direction === 'neutral';
          return (
            <span
              key={impact.symbol}
              title={`${meta.labelKey}: ${display.label} (magnitude: ${impact.magnitude})`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '2px',
                padding: '2px 5px', borderRadius: '4px',
                background: isMuted ? C.inputBg : display.bg,
                color: isMuted ? C.textMuted : display.color,
                border: `1px solid ${isMuted ? C.border : 'transparent'}`,
                fontSize: '9px', fontWeight: 600,
                fontFamily: 'var(--font-jetbrains-mono, monospace)',
                opacity: isMuted ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: '10px' }}>{meta.icon}</span>
              <span>{display.icon}</span>
              {/* Show magnitude bars */}
              {!isMuted && impact.magnitude > 1 && (
                <span style={{ opacity: 0.6, fontSize: '7px' }}>
                  {'|'.repeat(impact.magnitude - 1)}
                </span>
              )}
            </span>
          );
        })}
      </div>
    );
  }

  // Full: labeled grid with title
  return (
    <div style={{
      background: C.cardBg, borderRadius: '12px',
      border: `1px solid ${C.border}`,
      padding: '14px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '10px',
      }}>
        <div>
          <h4 style={{
            fontSize: '12px', fontWeight: 700, color: C.textPrimary,
            fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
            marginBottom: '2px',
          }}>{s.assetImpactTitle}</h4>
          <p style={{ fontSize: '10px', color: C.textMuted }}>{s.assetImpactSubtitle}</p>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px',
      }}>
        {assessment.assetImpacts.map((impact) => {
          const meta = ASSET_META[impact.symbol] || { icon: '•', labelKey: impact.symbol };
          const display = getDirectionDisplay(impact.direction, locale);
          const isMuted = impact.direction === 'neutral';
          const assetLabel = (s as any)[meta.labelKey] || impact.symbol;

          return (
            <div
              key={impact.symbol}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: '8px 4px', borderRadius: '8px',
                background: isMuted ? C.inputBg : display.bg,
                border: `1px solid ${isMuted ? C.border : 'transparent'}`,
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '14px' }}>{meta.icon}</span>
              <span style={{
                fontSize: '9px', fontWeight: 600, color: C.textSecondary,
                fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
              }}>{assetLabel}</span>
              <span style={{
                fontSize: '14px', fontWeight: 700,
                color: isMuted ? C.textMuted : display.color,
                fontFamily: 'var(--font-jetbrains-mono, monospace)',
              }}>{display.icon}</span>
              {/* Magnitude indicator */}
              <div style={{
                display: 'flex', gap: '2px', marginTop: '2px',
              }}>
                {[1, 2, 3].map((level) => (
                  <span
                    key={level}
                    style={{
                      width: '4px', height: '4px', borderRadius: '50%',
                      background: level <= impact.magnitude
                        ? (isMuted ? C.textMuted : display.color)
                        : C.inputBg,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical note */}
      <div style={{
        marginTop: '10px', padding: '8px 10px', borderRadius: '6px',
        background: C.inputBg,
        borderInlineStart: `2px solid ${C.gold}`,
      }}>
        <div style={{
          fontSize: '9px', fontWeight: 700, color: C.textMuted,
          textTransform: 'uppercase', letterSpacing: '0.5px',
          marginBottom: '2px',
        }}>{s.historicalImpact}</div>
        <div style={{
          fontSize: '11px', color: C.textSecondary, lineHeight: 1.5,
          fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
        }}>{assessment.historicalNote}</div>
      </div>
    </div>
  );
}

// ─── Pre-Impact Score Badge ────────────────────────────────────
// Compact score badge shown on event cards
export function PreImpactScoreBadge({
  eventName,
  importance,
  locale,
  colors: C,
}: {
  eventName: string;
  importance: string | number;
  locale: CalendarLocale;
  colors: CalendarColors;
}) {
  const s = getCalendarStrings(locale);
  const assessment = useMemo(
    () => assessPreImpact(eventName, importance, locale),
    [eventName, importance, locale],
  );

  const tierColor = assessment.tier === 'high' ? C.red : assessment.tier === 'medium' ? C.gold : C.green;
  const tierLabel = assessment.tier === 'high' ? s.preImpactHigh : assessment.tier === 'medium' ? s.preImpactMedium : s.preImpactLow;

  return (
    <div
      title={`${s.preImpactTitle}: ${tierLabel} (${assessment.score}/100, ${s.confidenceScore}: ${Math.round(assessment.confidence * 100)}%)`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '3px 8px', borderRadius: '6px',
        background: `${tierColor}14`, color: tierColor,
        border: `1px solid ${tierColor}33`,
        fontSize: '9px', fontWeight: 700,
        fontFamily: 'var(--font-jetbrains-mono, monospace)',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '10px' }}>🧠</span>
      <span>{assessment.score}</span>
      <span style={{ opacity: 0.6, fontSize: '8px' }}>/100</span>
    </div>
  );
}
