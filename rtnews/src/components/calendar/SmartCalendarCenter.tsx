'use client';

// ═══════════════════════════════════════════════════════════════════
// SmartCalendarCenter — Unified Economic Calendar for all 5 locales
// ═══════════════════════════════════════════════════════════════════
// Replaces CalendarPageClient (ar) + EnCalendarClient (en/fr/tr/es).
//
// Revolutionary features:
//   🧠 Pre-Impact Roua Score — AI-style prediction badge on every event
//   📊 Asset Impact Matrix — gold/oil/BTC/S&P/DXY/EURUSD prediction grid
//   🎙️ Audio Summary — TTS for top 5 upcoming events
//   ⏱️ Live Event Tracker Sidebar — countdown to next critical event
//   🔗 RAG Links — "Related Analyses" link to /reports/search?q=event
//
// Data source: /api/markets/calendar (ForexFactory primary — free, no key)
// Falls back to Finnhub → DB seeded events → generated fallback.
//
// Architecture:
//   - One component, locale-driven (RTL for Arabic, LTR for others)
//   - Real-time countdown updates every 1s
//   - Event list refreshes every 5 min
//   - Filters: date (today/week/month), country, importance

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { getCalendarStrings, formatCountdown, CalendarLocale } from '@/lib/calendar-i18n';
import { assessPreImpact, buildRelatedReportsUrl } from '@/lib/calendar-impact';
import CalendarAudioSummary from './CalendarAudioSummary';
import EventTrackerSidebar, { TrackedEvent } from './EventTrackerSidebar';
import AssetImpactMatrix, { PreImpactScoreBadge } from './AssetImpactMatrix';

// ─── Theme colors ──────────────────────────────────────────────
interface ColorPalette {
  bg: string;
  cardBg: string;
  cardBgHover: string;
  headerBg: string;
  inputBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderHover: string;
  cyan: string;
  cyanDim: string;
  cyanBorder: string;
  purple: string;
  purpleDim: string;
  gold: string;
  goldDim: string;
  green: string;
  red: string;
  isDark: boolean;
}

function useColors(): ColorPalette {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  return useMemo<ColorPalette>(() => ({
    bg: isDark ? '#0A0E27' : '#F0F2F7',
    cardBg: isDark ? '#0F1629' : '#FFFFFF',
    cardBgHover: isDark ? '#141B33' : '#F8F9FC',
    headerBg: isDark ? 'rgba(10,14,39,0.93)' : 'rgba(240,242,247,0.93)',
    inputBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    textPrimary: isDark ? '#E2E8F0' : '#1A1A2E',
    textSecondary: isDark ? '#94A3B8' : '#4A5568',
    textMuted: isDark ? '#64748B' : '#718096',
    border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    borderHover: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.14)',
    cyan: isDark ? '#00E5FF' : '#0891B2',
    cyanDim: isDark ? 'rgba(0,229,255,0.06)' : 'rgba(8,145,178,0.08)',
    cyanBorder: isDark ? 'rgba(0,229,255,0.15)' : 'rgba(8,145,178,0.2)',
    purple: isDark ? '#8B5CF6' : '#7C3AED',
    purpleDim: isDark ? 'rgba(139,92,246,0.06)' : 'rgba(124,58,237,0.06)',
    gold: isDark ? '#d4af37' : '#B8860B',
    goldDim: isDark ? 'rgba(212,175,55,0.06)' : 'rgba(184,134,11,0.06)',
    green: isDark ? '#10B981' : '#059669',
    red: isDark ? '#EF4444' : '#DC2626',
    isDark,
  }), [isDark]);
}

// ─── Types ─────────────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  eventName: string;
  eventNameAr: string;
  event: string;
  eventAr: string;
  country: string;
  countryCode: string;
  currency: string;
  eventDate: string;
  time: string;
  importance: string | number;
  impactLevel: number;
  eventType: string;
  forecast: string;
  previous: string;
  actual: string | null;
  isActualReleased: boolean;
  source: string;
  affectedAssets?: Array<{ symbol: string; direction: string }>;
}

type DateFilter = 'all' | 'today' | 'thisWeek' | 'nextWeek' | 'thisMonth';
type ImportanceFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type CountryFilter = 'all' | string;

// ─── Normalize event from API (handles both API shapes) ────────
function normalizeEvent(raw: any): CalendarEvent {
  // /api/markets/calendar shape: { id, event, eventAr, country (flag emoji), countryCode, time, impactLevel (1-3), forecast, previous, currency, affectedAssets, source }
  // /api/economic-calendar shape: { id, eventName, eventNameAr, country, currency, eventDate, importance ('low'|'medium'|'high'|'critical'), eventType, forecast, previous, actual, isActualReleased, source }

  const eventName = raw.eventName || raw.event || '';
  const eventNameAr = raw.eventNameAr || raw.eventAr || eventName;
  const eventDate = raw.eventDate || raw.time || new Date().toISOString();
  const country = raw.country || '';
  const importance = raw.importance ?? raw.impactLevel ?? 'medium';

  return {
    id: raw.id || Math.random().toString(36),
    eventName,
    eventNameAr,
    event: eventName,
    eventAr: eventNameAr,
    country,
    countryCode: raw.countryCode || country,
    currency: raw.currency || '',
    eventDate,
    time: eventDate,
    importance,
    impactLevel: typeof importance === 'number' ? importance : (
      importance === 'critical' ? 3 : importance === 'high' ? 3 : importance === 'medium' ? 2 : 1
    ),
    eventType: raw.eventType || '',
    forecast: raw.forecast || '-',
    previous: raw.previous || '-',
    actual: raw.actual || null,
    isActualReleased: raw.isActualReleased || !!raw.actual,
    source: raw.source || 'unknown',
    affectedAssets: raw.affectedAssets || [],
  };
}

// ─── Importance helpers ────────────────────────────────────────
function getImportanceLevel(imp: string | number): 1 | 2 | 3 {
  if (typeof imp === 'number') return Math.min(3, Math.max(1, imp)) as 1 | 2 | 3;
  const v = (imp || '').toLowerCase();
  if (v === 'critical' || v === 'high') return 3;
  if (v === 'medium') return 2;
  return 1;
}

function getImportanceColor(level: number, C: ColorPalette): string {
  return level >= 3 ? C.red : level === 2 ? C.gold : C.green;
}

// ─── Timezone helper ───────────────────────────────────────────
// Returns the user's local timezone offset as a UTC+HH:MM string.
// Example: UTC+3 for Saudi Arabia, UTC-5 for New York.
function getTimezoneOffset(): string {
  try {
    const offset = -new Date().getTimezoneOffset(); // in minutes; negative for east of UTC
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    const hh = String(Math.floor(abs / 60)).padStart(2, '0');
    const mm = String(abs % 60).padStart(2, '0');
    return `${sign}${hh}:${mm}`;
  } catch {
    return '+00:00';
  }
}

// ─── Sub-components ────────────────────────────────────────────

function StatCard({
  label, value, color, C,
}: {
  label: string; value: string | number; color: string; C: ColorPalette;
}) {
  return (
    <div style={{
      background: C.cardBg, borderRadius: '12px',
      border: `1px solid ${C.border}`, padding: '12px 14px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '20px', fontWeight: 700, color,
        fontFamily: 'var(--font-jetbrains-mono, monospace)',
        letterSpacing: '0.5px',
      }}>{value}</div>
      <div style={{
        fontSize: '10px', color: C.textMuted, marginTop: '2px',
        fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
      }}>{label}</div>
    </div>
  );
}

function FilterChip({
  active, onClick, children, color, C,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; color: string; C: ColorPalette;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px', borderRadius: '8px',
        fontSize: '11px', fontWeight: 600,
        whiteSpace: 'nowrap', cursor: 'pointer',
        background: active ? `${color}18` : C.inputBg,
        color: active ? color : C.textMuted,
        border: `1px solid ${active ? `${color}40` : C.border}`,
        transition: 'all 0.2s ease',
        fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
      }}
    >
      {children}
    </button>
  );
}

// ─── Event Card ────────────────────────────────────────────────
function EventCard({
  event, locale, C, mounted, now,
}: {
  event: CalendarEvent; locale: CalendarLocale; C: ColorPalette; mounted: boolean; now: number;
}) {
  const s = getCalendarStrings(locale);
  const [expanded, setExpanded] = useState(false);

  const impLevel = getImportanceLevel(event.importance);
  const impColor = getImportanceColor(impLevel, C);
  const countdown = formatCountdown(event.eventDate, locale, now);
  const isPast = countdown.isPast;
  const isSoon = countdown.isSoon && !isPast;

  const eventName = locale === 'ar' ? (event.eventNameAr || event.eventName) : event.eventName;
  const eventDate = new Date(event.eventDate);
  const localeTag = locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'tr' ? 'tr-TR' : locale === 'es' ? 'es-ES' : 'en-US';

  const relatedUrl = buildRelatedReportsUrl(event.eventName, locale);

  return (
    <div
      style={{
        background: C.cardBg, borderRadius: '12px',
        border: `1px solid ${C.border}`,
        borderInlineStart: `3px solid ${impColor}`,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        opacity: isPast ? 0.65 : 1,
      }}
    >
      {/* Top row: time + country + importance dots + pre-impact badge */}
      <div style={{
        padding: '12px 14px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '18px' }}>{event.country}</span>
          <span style={{
            fontSize: '11px', fontWeight: 600, color: C.textSecondary,
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
          }}>
            {mounted ? eventDate.toLocaleDateString(localeTag, { month: 'short', day: 'numeric' }) : '...'}
          </span>
          <span style={{
            fontSize: '11px', fontWeight: 700, color: C.textPrimary,
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
          }}>
            {mounted ? eventDate.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          </span>
          {/* Importance dots */}
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            {[1, 2, 3].map(level => (
              <span key={level} style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: level <= impLevel ? impColor : C.inputBg,
                boxShadow: level <= impLevel ? `0 0 4px ${impColor}80` : 'none',
              }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PreImpactScoreBadge
            eventName={event.eventName}
            importance={event.importance}
            locale={locale}
            colors={C}
          />
          {isSoon && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '2px 7px', borderRadius: '4px',
              background: `${C.gold}18`, color: C.gold,
              border: `1px solid ${C.gold}33`,
              fontSize: '9px', fontWeight: 700,
              fontFamily: 'var(--font-jetbrains-mono, monospace)',
            }}>
              <span className="animate-pulse" style={{ width: '4px', height: '4px', borderRadius: '50%', background: C.gold }} />
              SOON
            </span>
          )}
        </div>
      </div>

      {/* Event name */}
      <div style={{ padding: '0 14px 8px' }}>
        <h3 style={{
          fontSize: '14px', fontWeight: 700, color: C.textPrimary,
          lineHeight: 1.5,
          fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
          marginBottom: '4px',
        }}>
          {eventName}
        </h3>
        <div style={{
          fontSize: '10px', color: C.textMuted,
          fontFamily: 'var(--font-jetbrains-mono, monospace)',
        }}>
          {event.eventName !== eventName && (
            <span style={{ opacity: 0.7 }}>{event.eventName}</span>
          )}
        </div>
      </div>

      {/* Forecast / Previous / Actual row */}
      <div style={{
        padding: '0 14px 10px',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px',
      }}>
        <div>
          <div style={{ fontSize: '9px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.forecast}</div>
          <div style={{
            fontSize: '12px', fontWeight: 700, color: C.textPrimary,
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
          }}>{event.forecast}</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.previous}</div>
          <div style={{
            fontSize: '12px', fontWeight: 600, color: C.textSecondary,
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
          }}>{event.previous}</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.actual}</div>
          <div style={{
            fontSize: '12px', fontWeight: 700,
            color: event.actual ? (event.isActualReleased ? C.green : C.gold) : C.textMuted,
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
          }}>{event.actual || '—'}</div>
        </div>
      </div>

      {/* Asset Impact Matrix (compact) */}
      <div style={{ padding: '0 14px 10px' }}>
        <AssetImpactMatrix
          eventName={event.eventName}
          importance={event.importance}
          locale={locale}
          colors={C}
          compact
        />
      </div>

      {/* Countdown */}
      <div style={{
        padding: '8px 14px',
        background: C.inputBg,
        borderTop: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
        flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '11px',
          fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isSoon ? C.gold : C.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          <span style={{
            color: isPast ? C.textMuted : isSoon ? C.gold : C.cyan,
            fontWeight: 600,
          }}>
            {countdown.text}
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: '4px 10px', borderRadius: '6px',
            background: 'transparent',
            border: `1px solid ${C.border}`,
            color: C.textSecondary,
            fontSize: '10px', fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          {expanded ? '−' : '+'} {s.viewAnalysis}
        </button>
      </div>

      {/* Expanded: Full Asset Impact Matrix + Related Reports (RAG) */}
      {expanded && (
        <div style={{
          padding: '12px 14px',
          background: C.inputBg,
          borderTop: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', gap: '10px',
          animation: 'fadeInUp 0.3s ease',
        }}>
          <AssetImpactMatrix
            eventName={event.eventName}
            importance={event.importance}
            locale={locale}
            colors={C}
          />

          {/* RAG: Related Reports */}
          <div style={{
            background: C.cardBg, borderRadius: '10px',
            padding: '10px 12px',
            border: `1px solid ${C.border}`,
          }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, color: C.textPrimary,
              marginBottom: '6px',
              display: 'flex', alignItems: 'center', gap: '5px',
              fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
            }}>
              <span style={{ fontSize: '12px' }}>🔗</span>
              {s.relatedReports}
            </div>
            <Link
              href={relatedUrl}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px', borderRadius: '6px',
                background: C.cyanDim, color: C.cyan,
                border: `1px solid ${C.cyanBorder}`,
                fontSize: '10px', fontWeight: 600,
                textDecoration: 'none',
                fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
              }}
            >
              {s.viewAnalysis}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

interface SmartCalendarCenterProps {
  locale: CalendarLocale;
  initialEvents?: any[];
}

export default function SmartCalendarCenter({ locale, initialEvents = [] }: SmartCalendarCenterProps) {
  const C = useColors();
  const s = getCalendarStrings(locale);
  const isRTL = s.dir === 'rtl';

  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>(() => initialEvents.map(normalizeEvent));
  const [loading, setLoading] = useState(initialEvents.length === 0);
  const [now, setNow] = useState(Date.now());
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [dataSource, setDataSource] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>('thisWeek');
  const [importanceFilter, setImportanceFilter] = useState<ImportanceFilter>('all');
  const [countryFilter, setCountryFilter] = useState<CountryFilter>('all');

  // Tick every second for live countdowns
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      // Use /api/markets/calendar (ForexFactory primary — free, no key)
      // Falls back to Finnhub → DB → generated
      const res = await fetch(`/api/markets/calendar?locale=${locale}&limit=80`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.events?.length > 0) {
        const normalized = data.events.map(normalizeEvent);
        setEvents(normalized);
        // Track data source for the badge
        setDataSource(data.source || data.events[0]?.source || 'unknown');
        const localeTag = locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'tr' ? 'tr-TR' : locale === 'es' ? 'es-ES' : 'en-US';
        setLastUpdate(new Date().toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' }));
      } else {
        setApiError('API returned 0 events');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[SmartCalendar] Fetch failed:', msg);
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (initialEvents.length === 0) fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchEvents, initialEvents.length]);

  // Get available countries from events
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) {
      if (e.countryCode) set.add(e.countryCode);
    }
    return Array.from(set).sort();
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      const endOfNextWeek = new Date(endOfWeek);
      endOfNextWeek.setDate(endOfWeek.getDate() + 7);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      result = result.filter(e => {
        const d = new Date(e.eventDate);
        switch (dateFilter) {
          case 'today': return d >= today && d < tomorrow;
          case 'thisWeek': return d >= startOfWeek && d < endOfWeek;
          case 'nextWeek': return d >= endOfWeek && d < endOfNextWeek;
          case 'thisMonth': return d >= today && d < endOfMonth;
          default: return true;
        }
      });
    }

    // Importance filter
    if (importanceFilter !== 'all') {
      result = result.filter(e => {
        const level = getImportanceLevel(e.importance);
        if (importanceFilter === 'critical') return level === 3 && (e.importance === 'critical' || e.importance === 3);
        if (importanceFilter === 'high') return level === 3;
        if (importanceFilter === 'medium') return level === 2;
        if (importanceFilter === 'low') return level === 1;
        return true;
      });
    }

    // Country filter
    if (countryFilter !== 'all') {
      result = result.filter(e => e.countryCode === countryFilter);
    }

    return result;
  }, [events, dateFilter, importanceFilter, countryFilter]);

  // Sort by date
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [filteredEvents]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    for (const e of sortedEvents) {
      const dayKey = new Date(e.eventDate).toISOString().split('T')[0];
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(e);
    }
    return groups;
  }, [sortedEvents]);

  // Stats
  const stats = useMemo(() => {
    const nowMs = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      total: sortedEvents.length,
      critical: sortedEvents.filter(e => getImportanceLevel(e.importance) === 3).length,
      upcoming: sortedEvents.filter(e => new Date(e.eventDate).getTime() > nowMs).length,
      releasedToday: sortedEvents.filter(e => {
        const d = new Date(e.eventDate);
        return d >= today && d < tomorrow && e.isActualReleased;
      }).length,
    };
  }, [sortedEvents]);

  // Top 5 critical events for audio summary
  const topEventsForAudio = useMemo(() => {
    return [...events]
      .filter(e => new Date(e.eventDate).getTime() > Date.now())
      .sort((a, b) => {
        // Sort by importance desc, then by date asc
        const aImp = getImportanceLevel(a.importance);
        const bImp = getImportanceLevel(b.importance);
        if (aImp !== bImp) return bImp - aImp;
        return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      })
      .slice(0, 5)
      .map(e => ({
        eventName: locale === 'ar' ? (e.eventNameAr || e.eventName) : e.eventName,
        country: e.country,
        eventDate: e.eventDate,
        importance: typeof e.importance === 'string' ? e.importance : String(e.importance),
      }));
  }, [events, locale]);

  // Convert to TrackedEvent format for sidebar
  const trackedEvents: TrackedEvent[] = useMemo(() => {
    return events.map(e => ({
      id: e.id,
      eventName: e.eventName,
      eventNameAr: e.eventNameAr,
      country: e.country,
      eventDate: e.eventDate,
      importance: e.importance,
      forecast: e.forecast,
      previous: e.previous,
      currency: e.currency,
    }));
  }, [events]);

  const localeTag = locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'tr' ? 'tr-TR' : locale === 'es' ? 'es-ES' : 'en-US';

  return (
    <main className="min-h-screen pb-mobile-safe" dir={s.dir} style={{ background: C.bg, transition: 'background 0.3s ease' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ═══ HERO HEADER ═══ */}
      <section style={{ padding: '28px 0 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingInline: 'clamp(16px, 4vw, 48px)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '14px', marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: C.goldDim, border: `1px solid ${C.gold}33`,
                color: C.gold,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h1 style={{
                fontSize: '24px', fontWeight: 700, color: C.textPrimary,
                fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
              }}>{s.pageTitle}</h1>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                background: 'rgba(16,185,129,0.1)', color: C.green,
                border: '1px solid rgba(16,185,129,0.2)',
                fontFamily: 'var(--font-jetbrains-mono, monospace)',
                letterSpacing: '0.5px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.green, animation: 'pulse 2s infinite' }} />
                {s.liveBadge}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {lastUpdate && (
                <span style={{ fontSize: '10px', color: C.textMuted }}>
                  {s.lastUpdate}: {lastUpdate}
                </span>
              )}
              <CalendarAudioSummary locale={locale} events={topEventsForAudio} colors={C} />
              <button
                onClick={() => fetchEvents()}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                  border: `1px solid ${C.border}`, color: C.textSecondary, background: C.cardBg,
                  cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'animate-spin' : ''}>
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                {s.refresh}
              </button>
            </div>
          </div>

          <p style={{
            fontSize: '13px', color: C.textSecondary, marginBottom: '14px',
            fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
          }}>{s.pageSubtitle}</p>

          {/* Data source + timezone + debug info bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
            marginBottom: '20px',
            padding: '8px 12px', borderRadius: '10px',
            background: C.cardBg, border: `1px solid ${C.border}`,
            fontSize: '10px',
          }}>
            {/* Data source badge */}
            {dataSource && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 8px', borderRadius: '6px',
                background: dataSource === 'forexfactory'
                  ? 'rgba(16,185,129,0.12)'
                  : dataSource === 'fmp' || dataSource === 'finnhub'
                    ? 'rgba(0,229,255,0.12)'
                    : dataSource === 'generated'
                      ? 'rgba(234,179,8,0.12)'
                      : C.inputBg,
                color: dataSource === 'forexfactory'
                  ? C.green
                  : dataSource === 'fmp' || dataSource === 'finnhub'
                    ? C.cyan
                    : dataSource === 'generated'
                      ? '#eab308'
                      : C.textMuted,
                border: `1px solid ${C.border}`,
                fontWeight: 700,
                fontFamily: 'var(--font-jetbrains-mono, monospace)',
                letterSpacing: '0.3px',
              }} title={`Data source: ${dataSource}`}>
                <span style={{ fontSize: '10px' }}>
                  {dataSource === 'forexfactory' ? '✓' : dataSource === 'generated' ? '⚠' : '📡'}
                </span>
                SOURCE: {dataSource.toUpperCase()}
              </span>
            )}

            {/* Timezone indicator */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              color: C.textMuted,
              fontFamily: 'var(--font-jetbrains-mono, monospace)',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {mounted ? `UTC${getTimezoneOffset()}` : 'UTC'}
            </span>

            {/* Events count */}
            <span style={{
              color: C.textMuted,
              fontFamily: 'var(--font-jetbrains-mono, monospace)',
            }}>
              {events.length} events loaded
            </span>

            {/* Error indicator */}
            {apiError && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 8px', borderRadius: '6px',
                background: 'rgba(239,68,68,0.12)', color: C.red,
                border: '1px solid rgba(239,68,68,0.25)',
                fontWeight: 700,
                fontFamily: 'var(--font-jetbrains-mono, monospace)',
              }} title={apiError}>
                ⚠ API: {apiError.slice(0, 40)}
              </span>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Direct API test link */}
            <a
              href={`/api/markets/calendar?locale=${locale}&limit=5`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: C.cyan, textDecoration: 'none',
                fontFamily: 'var(--font-jetbrains-mono, monospace)',
                fontWeight: 600,
                fontSize: '10px',
                display: 'inline-flex', alignItems: 'center', gap: '3px',
              }}
              title="Test API endpoint directly in a new tab"
            >
              TEST API ↗
            </a>
          </div>
        </div>
      </section>

      {/* ═══ MAIN CONTENT — Two-Column Layout ═══ */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 48px) 48px' }}>
        <style>{`
          @media (min-width: 900px) {
            .calendar-two-col { grid-template-columns: 5fr 2fr !important; }
          }
        `}</style>
        <div className="calendar-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* ═══ MAIN COLUMN ═══ */}
          <div>
            {/* Stats row */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px',
              marginBottom: '16px',
            }}>
              <StatCard label={s.totalEvents} value={stats.total} color={C.textPrimary} C={C} />
              <StatCard label={s.criticalEvents} value={stats.critical} color={C.red} C={C} />
              <StatCard label={s.upcomingEvents} value={stats.upcoming} color={C.cyan} C={C} />
              <StatCard label={s.releasedToday} value={stats.releasedToday} color={C.green} C={C} />
            </div>

            {/* Filters */}
            <div style={{
              background: C.cardBg, borderRadius: '12px', padding: '12px 14px',
              border: `1px solid ${C.border}`, marginBottom: '16px',
            }}>
              {/* Date filter */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
                marginBottom: '10px',
              }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: C.textMuted,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  marginRight: '6px',
                  fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                }}>{s.filterByDate}:</span>
                {(['all', 'today', 'thisWeek', 'nextWeek', 'thisMonth'] as DateFilter[]).map(d => (
                  <FilterChip key={d} active={dateFilter === d} onClick={() => setDateFilter(d)} color={C.cyan} C={C}>
                    {(s as any)[d] || d}
                  </FilterChip>
                ))}
              </div>

              {/* Importance filter */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
                marginBottom: '10px',
              }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: C.textMuted,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  marginRight: '6px',
                  fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                }}>{s.filterByImpact}:</span>
                {(['all', 'critical', 'high', 'medium', 'low'] as ImportanceFilter[]).map(imp => (
                  <FilterChip
                    key={imp}
                    active={importanceFilter === imp}
                    onClick={() => setImportanceFilter(imp)}
                    color={imp === 'critical' || imp === 'high' ? C.red : imp === 'medium' ? C.gold : imp === 'low' ? C.green : C.cyan}
                    C={C}
                  >
                    {(s as any)[imp] || imp}
                  </FilterChip>
                ))}
              </div>

              {/* Country filter */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
              }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: C.textMuted,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  marginRight: '6px',
                  fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                }}>{s.country}:</span>
                <FilterChip active={countryFilter === 'all'} onClick={() => setCountryFilter('all')} color={C.purple} C={C}>
                  🌍 {s.allCountries}
                </FilterChip>
                {availableCountries.slice(0, 12).map(c => (
                  <FilterChip
                    key={c}
                    active={countryFilter === c}
                    onClick={() => setCountryFilter(c)}
                    color={C.purple}
                    C={C}
                  >
                    {c}
                  </FilterChip>
                ))}
              </div>
            </div>

            {/* Loading state */}
            {loading && events.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{
                    background: C.cardBg, borderRadius: '12px', padding: '16px',
                    border: `1px solid ${C.border}`, height: '120px',
                  }}>
                    <div style={{
                      width: '60%', height: '12px', borderRadius: '4px',
                      background: C.inputBg, marginBottom: '8px',
                    }} />
                    <div style={{
                      width: '40%', height: '10px', borderRadius: '4px',
                      background: C.inputBg,
                    }} />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && sortedEvents.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '48px 24px',
                background: C.cardBg, borderRadius: '16px',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>📅</div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: C.textSecondary, marginBottom: '6px' }}>{s.noEvents}</p>
                <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '12px' }}>{s.noEventsHint}</p>
                <button
                  onClick={() => { setDateFilter('all'); setImportanceFilter('all'); setCountryFilter('all'); }}
                  style={{
                    padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                    background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}`,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                  }}
                >
                  {s.all}
                </button>
              </div>
            )}

            {/* Events grouped by day */}
            {!loading && sortedEvents.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {Object.entries(eventsByDay).map(([dayKey, dayEvents]) => {
                  const dayDate = new Date(dayKey + 'T00:00:00');
                  const dayName = s[(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const)[dayDate.getDay()]];
                  const isToday = dayKey === new Date().toISOString().split('T')[0];

                  return (
                    <div key={dayKey}>
                      {/* Day header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        marginBottom: '12px',
                      }}>
                        <div style={{
                          width: '4px', height: '22px', borderRadius: '2px',
                          background: isToday ? C.gold : C.cyan,
                        }} />
                        <h3 style={{
                          fontSize: '14px', fontWeight: 700, color: isToday ? C.gold : C.textPrimary,
                          fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                        }}>
                          {dayName}
                        </h3>
                        <span style={{
                          fontSize: '12px', color: C.textMuted,
                          fontFamily: 'var(--font-jetbrains-mono, monospace)',
                        }}>
                          {dayDate.toLocaleDateString(localeTag, { month: 'short', day: 'numeric' })}
                        </span>
                        {isToday && (
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px',
                            background: `${C.gold}18`, color: C.gold,
                            fontSize: '9px', fontWeight: 700,
                            border: `1px solid ${C.gold}33`,
                            fontFamily: 'var(--font-jetbrains-mono, monospace)',
                          }}>
                            {s.today.toUpperCase()}
                          </span>
                        )}
                        <span style={{
                          fontSize: '10px', color: C.textMuted, fontWeight: 600,
                          fontFamily: 'var(--font-jetbrains-mono, monospace)',
                        }}>
                          {dayEvents.length}
                        </span>
                      </div>

                      {/* Event cards */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr', gap: '10px',
                      }}>
                        {dayEvents.map(event => (
                          <EventCard
                            key={event.id}
                            event={event}
                            locale={locale}
                            C={C}
                            mounted={mounted}
                            now={now}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══ SIDEBAR ═══ */}
          <aside>
            <EventTrackerSidebar
              locale={locale}
              events={trackedEvents}
              colors={C}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
