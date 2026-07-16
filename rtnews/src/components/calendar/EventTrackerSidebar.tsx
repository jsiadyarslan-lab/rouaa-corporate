'use client';

// ═══════════════════════════════════════════════════════════════════
// EventTrackerSidebar — Live countdown to next critical event
// ═══════════════════════════════════════════════════════════════════
// Sidebar that shows:
//   1. Next critical event with live countdown (HH:MM:SS)
//   2. List of events in next 24h (compact cards)
//   3. Total events in next 7 days (count)
//
// Updates every second for the countdown, every 5 min for the event list.

import { useEffect, useState, useMemo, useRef } from 'react';
import { getCalendarStrings, formatCountdown, CalendarLocale } from '@/lib/calendar-i18n';
import { PreImpactScoreBadge } from './AssetImpactMatrix';

export interface TrackedEvent {
  id: string;
  eventName: string;
  eventNameAr: string;
  country: string;
  eventDate: string;
  importance: string | number;
  forecast: string;
  previous: string;
  currency: string;
}

interface EventTrackerSidebarProps {
  locale: CalendarLocale;
  events: TrackedEvent[];
  colors: CalendarColors;
}

interface CalendarColors {
  cardBg: string;
  cardBgHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderHover: string;
  cyan: string;
  cyanDim: string;
  cyanBorder: string;
  green: string;
  red: string;
  gold: string;
  goldDim: string;
  inputBg: string;
  isDark: boolean;
  bg: string;
}

const IMPORTANCE_ORDER: Record<string, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
  '3': 3, '2': 2, '1': 1,
};

export default function EventTrackerSidebar({ locale, events, colors: C }: EventTrackerSidebarProps) {
  const s = getCalendarStrings(locale);
  const [now, setNow] = useState(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick every second for live countdown
  useEffect(() => {
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  // Sort upcoming events by date (closest first)
  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => new Date(e.eventDate).getTime() > now)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [events, now]);

  // Next critical event = first upcoming event with high/critical importance
  const nextCriticalEvent = useMemo(() => {
    return upcomingEvents.find(e => {
      const imp = typeof e.importance === 'number' ? e.importance : IMPORTANCE_ORDER[e.importance] || 0;
      return imp >= 3;
    }) || upcomingEvents[0];
  }, [upcomingEvents]);

  // Events in next 24h
  const next24hEvents = useMemo(() => {
    const cutoff = now + 24 * 60 * 60 * 1000;
    return upcomingEvents.filter(e => new Date(e.eventDate).getTime() <= cutoff).slice(0, 6);
  }, [upcomingEvents, now]);

  // Events in next 7 days (count only)
  const next7dCount = useMemo(() => {
    const cutoff = now + 7 * 24 * 60 * 60 * 1000;
    return upcomingEvents.filter(e => new Date(e.eventDate).getTime() <= cutoff).length;
  }, [upcomingEvents, now]);

  // Live countdown for next critical event
  const nextCountdown = useMemo(() => {
    if (!nextCriticalEvent) return null;
    return formatCountdown(nextCriticalEvent.eventDate, locale, now);
  }, [nextCriticalEvent, locale, now]);

  // Decompose countdown into HH:MM:SS for the digital display
  const countdownParts = useMemo(() => {
    if (!nextCriticalEvent) return null;
    const target = new Date(nextCriticalEvent.eventDate).getTime();
    const diff = Math.max(0, target - now);
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }, [nextCriticalEvent, now]);

  const localeTag = locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'tr' ? 'tr-TR' : locale === 'es' ? 'es-ES' : 'en-US';

  return (
    <div style={{
      background: C.cardBg, borderRadius: '14px',
      border: `1px solid ${C.border}`, overflow: 'hidden',
      position: 'sticky', top: '80px',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: C.cyanDim, border: `1px solid ${C.cyanBorder}`,
            color: C.cyan,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          </div>
          <div>
            <h3 style={{
              fontSize: '13px', fontWeight: 700, color: C.textPrimary,
              fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
            }}>{s.liveTracker}</h3>
            <p style={{ fontSize: '9px', color: C.textMuted, marginTop: '1px' }}>{s.nextEventSubtitle}</p>
          </div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontSize: '9px', color: C.green, fontWeight: 700,
          fontFamily: 'var(--font-jetbrains-mono, monospace)',
        }}>
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: C.green, animation: 'pulse 2s infinite',
          }} />
          LIVE
        </span>
      </div>

      {/* Next Event Countdown */}
      {nextCriticalEvent && countdownParts ? (
        <div style={{
          padding: '16px',
          background: `linear-gradient(180deg, ${C.goldDim} 0%, transparent 100%)`,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{
            fontSize: '9px', fontWeight: 700, color: C.textMuted,
            textTransform: 'uppercase', letterSpacing: '0.5px',
            marginBottom: '6px',
          }}>{s.nextEventTitle}</div>

          {/* Event name */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            marginBottom: '12px', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '16px' }}>{nextCriticalEvent.country}</span>
            <span style={{
              fontSize: '13px', fontWeight: 700, color: C.textPrimary,
              fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
              flex: 1, minWidth: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {locale === 'ar' ? (nextCriticalEvent.eventNameAr || nextCriticalEvent.eventName) : nextCriticalEvent.eventName}
            </span>
            <PreImpactScoreBadge
              eventName={nextCriticalEvent.eventName}
              importance={nextCriticalEvent.importance}
              locale={locale}
              colors={C}
            />
          </div>

          {/* Digital countdown display */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
          }}>
            {countdownParts.days > 0 && (
              <CountdownBlock value={countdownParts.days} label={s.days} color={C.gold} bg={C.goldDim} />
            )}
            <CountdownBlock value={countdownParts.hours} label={s.hours} color={C.gold} bg={C.goldDim} pad2 />
            <span style={{ color: C.gold, fontSize: '18px', fontWeight: 700 }}>:</span>
            <CountdownBlock value={countdownParts.minutes} label={s.minutes} color={C.gold} bg={C.goldDim} pad2 />
            <span style={{ color: C.gold, fontSize: '18px', fontWeight: 700 }}>:</span>
            <CountdownBlock value={countdownParts.seconds} label={s.seconds} color={C.gold} bg={C.goldDim} pad2 />
          </div>

          {/* Event time */}
          <div style={{
            marginTop: '10px', textAlign: 'center',
            fontSize: '10px', color: C.textMuted,
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
          }}>
            {new Date(nextCriticalEvent.eventDate).toLocaleString(localeTag, {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '24px 16px', textAlign: 'center',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: '24px', marginBottom: '6px', opacity: 0.4 }}>📅</div>
          <p style={{ fontSize: '11px', color: C.textMuted }}>{s.noUpcomingEvent}</p>
        </div>
      )}

      {/* Events in next 24h */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '8px',
        }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, color: C.textSecondary,
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>{s.eventsNext24h}</span>
          <span style={{
            fontSize: '10px', fontWeight: 700, color: C.cyan,
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
          }}>{next24hEvents.length}</span>
        </div>

        {next24hEvents.length === 0 ? (
          <p style={{ fontSize: '10px', color: C.textMuted, padding: '8px 0', textAlign: 'center' }}>
            {s.noUpcomingEvent}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {next24hEvents.map((evt) => {
              const cd = formatCountdown(evt.eventDate, locale, now);
              const impLevel = typeof evt.importance === 'number' ? evt.importance : IMPORTANCE_ORDER[evt.importance] || 0;
              const impColor = impLevel >= 3 ? C.red : impLevel === 2 ? C.gold : C.green;

              return (
                <div
                  key={evt.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px', borderRadius: '8px',
                    background: C.inputBg,
                    borderInlineStart: `2px solid ${impColor}`,
                    transition: 'background 0.2s',
                  }}
                >
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>{evt.country}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '10px', fontWeight: 600, color: C.textPrimary,
                      fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {locale === 'ar' ? (evt.eventNameAr || evt.eventName) : evt.eventName}
                    </div>
                    <div style={{
                      fontSize: '9px', color: cd.isSoon ? C.gold : C.textMuted,
                      fontFamily: 'var(--font-jetbrains-mono, monospace)',
                      marginTop: '2px',
                    }}>
                      {cd.isPast ? cd.text : (cd.isSoon ? '⚡ ' : '') + cd.text}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, color: impColor,
                    fontFamily: 'var(--font-jetbrains-mono, monospace)',
                    flexShrink: 0,
                  }}>
                    {new Date(evt.eventDate).toLocaleTimeString(localeTag, {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: 7-day count */}
      <div style={{
        padding: '10px 14px',
        background: C.inputBg,
        borderTop: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '10px', color: C.textMuted,
          fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
        }}>{s.eventsNext7d}</span>
        <span style={{
          fontSize: '12px', fontWeight: 700, color: C.cyan,
          fontFamily: 'var(--font-jetbrains-mono, monospace)',
        }}>{next7dCount}</span>
      </div>
    </div>
  );
}

// ─── Countdown Block (digital display digit) ───────────────────
function CountdownBlock({
  value, label, color, bg, pad2 = false,
}: {
  value: number; label: string; color: string; bg: string; pad2?: boolean;
}) {
  const display = pad2 ? String(value).padStart(2, '0') : String(value);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
    }}>
      <div style={{
        fontSize: '20px', fontWeight: 700, color,
        background: bg, padding: '4px 8px', borderRadius: '6px',
        minWidth: '36px', textAlign: 'center',
        fontFamily: 'var(--font-jetbrains-mono, monospace)',
        letterSpacing: '1px',
      }}>
        {display}
      </div>
      <span style={{
        fontSize: '8px', color: color, opacity: 0.7, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>{label}</span>
    </div>
  );
}
