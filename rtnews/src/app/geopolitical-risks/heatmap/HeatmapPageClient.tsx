'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getRiskColor } from '@/lib/geopolitical/risk-thresholds';
import { t } from '@/lib/geopolitical/i18n';

const HeatmapLayer = dynamic(() => import('@/components/geopolitical/HeatmapLayer'), { ssr: false });

// ─── Types ──────────────────────────────────────────────────────

interface GeoEvent {
  id: string;
  eventId: string;
  source: string;
  eventType: string;
  actor1: string | null;
  actor2: string | null;
  country: string;
  countryCode: string;
  region: string | null;
  latitude: number;
  longitude: number;
  fatalities: number;
  notes: string | null;
  sourceUrl: string | null;
  eventDate: string;
  gdeltTone: number | null;
  importedAt: string;
}

interface Props {
  events: GeoEvent[];
  locale?: string;
}

// ─── Constants ──────────────────────────────────────────────────

const EVENT_TYPE_FILTERS = [
  { id: 'all', icon: '📋' },
  { id: 'battle', icon: '⚔️' },
  { id: 'protest', icon: '📣' },
  { id: 'riot', icon: '🔥' },
  { id: 'violence-civilians', icon: '⚠️' },
  { id: 'strategic-development', icon: '🏛️' },
] as const;

const EVENT_TYPE_COLORS: Record<string, string> = {
  battle: 'var(--bear)',
  protest: 'var(--gold)',
  riot: 'var(--orange)',
  'violence-civilians': 'var(--bear)',
  'strategic-development': 'var(--cyan)',
};

const EVENT_TYPE_LABEL_KEYS: Record<string, string> = {
  battle: 'event.battle',
  protest: 'event.protest',
  riot: 'event.riot',
  'violence-civilians': 'event.violenceCivilians',
  'strategic-development': 'event.strategicDev',
};

const EVENT_TYPE_FILTER_LABEL_KEYS: Record<string, string> = {
  all: 'map.all',
  battle: 'event.battle',
  protest: 'event.protest',
  riot: 'event.riot',
  'violence-civilians': 'event.violenceCivShort',
  'strategic-development': 'event.strategicDev',
};

// ─── Main Component ─────────────────────────────────────────────

export default function HeatmapPageClient({ events, locale = 'ar' }: Props) {
  const [mounted, setMounted] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[number, number]>([
    events.length > 0 ? new Date(events[events.length - 1].eventDate).getTime() : Date.now() - 30 * 86400000,
    events.length > 0 ? new Date(events[0].eventDate).getTime() : Date.now(),
  ]);
  const localePrefix = locale === 'ar' ? '' : `/${locale}`;

  useEffect(() => {
    setMounted(true);
    window.scrollTo(0, 0);
  }, []);

  // Get unique countries
  const uniqueCountries = useMemo(() => {
    const countries = [...new Set(events.map(e => e.country))];
    return countries.sort();
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (eventTypeFilter !== 'all' && e.eventType !== eventTypeFilter) return false;
      if (countryFilter !== 'all' && e.country !== countryFilter) return false;
      const eventTime = new Date(e.eventDate).getTime();
      if (eventTime < dateRange[0] || eventTime > dateRange[1]) return false;
      return true;
    });
  }, [events, eventTypeFilter, countryFilter, dateRange]);

  // Statistics
  const stats = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const totalFatalities = filteredEvents.reduce((sum, e) => sum + e.fatalities, 0);
    const affectedCountries = new Set(filteredEvents.map(e => e.countryCode)).size;
    const typeBreakdown: Record<string, number> = {};
    for (const e of filteredEvents) {
      typeBreakdown[e.eventType] = (typeBreakdown[e.eventType] || 0) + 1;
    }
    const countryBreakdown: Record<string, number> = {};
    for (const e of filteredEvents) {
      countryBreakdown[e.country] = (countryBreakdown[e.country] || 0) + 1;
    }
    const topCountries = Object.entries(countryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    return { totalEvents, totalFatalities, affectedCountries, typeBreakdown, topCountries };
  }, [filteredEvents]);

  const textAlign = locale === 'ar' ? 'text-right' : 'text-left';

  return (
    <main className="min-h-screen pb-mobile-safe" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* ═══ HERO HEADER ═══ */}
      <div className="relative" style={{ padding: '32px 0 0' }}>
        <div className="max-w-[1280px] mx-auto" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>
          <div className="glass-card" style={{
            padding: '28px 32px',
            background: 'linear-gradient(135deg, rgba(239,83,80,.05), rgba(255,128,64,.03))',
          }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(239,83,80,.12)', border: '1px solid rgba(239,83,80,.2)',
                    fontSize: '22px',
                  }}>
                    🔥
                  </div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-head)' }}>
                    {t('heatmap.title', locale)}
                  </h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--text2)' }}>
                  {t('heatmap.description', locale)}
                </p>
              </div>
              <Link
                href={`${localePrefix}/geopolitical-risks`}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg transition-all"
                style={{ background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.15)', color: 'var(--cyan)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                {t('dashboard.riskDashboard', locale)}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-[1280px] mx-auto py-6" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>

        {/* Filters Row */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {/* Event Type Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)' }}>{t('heatmap.type', locale)}</span>
            {EVENT_TYPE_FILTERS.map(filter => {
              const isActive = eventTypeFilter === filter.id;
              const count = filter.id === 'all'
                ? events.length
                : events.filter(e => e.eventType === filter.id).length;
              return (
                <button
                  key={filter.id}
                  onClick={() => setEventTypeFilter(filter.id)}
                  className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg transition-all"
                  style={{
                    background: isActive ? 'rgba(239,83,80,.1)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(239,83,80,.2)' : 'var(--rim)'}`,
                    color: isActive ? 'var(--bear)' : 'var(--text3)',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <span>{filter.icon}</span>
                  {t(EVENT_TYPE_FILTER_LABEL_KEYS[filter.id] || filter.id, locale)}
                  <span style={{
                    fontSize: '8px', fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: isActive ? 'var(--bear)' : 'var(--text4)',
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Country Filter + Date Range */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)' }}>{t('heatmap.country', locale)}</span>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="text-[11px] px-3 py-1.5 rounded-lg outline-none"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--rim)',
                color: 'var(--text)',
              }}
            >
              <option value="all">{t('heatmap.allCountries', locale)}</option>
              {uniqueCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)' }}>{t('heatmap.shownEvents', locale)}</span>
            <span style={{
              fontSize: '11px', fontFamily: 'var(--font-mono)',
              fontWeight: 700, color: 'var(--bear)',
            }}>
              {filteredEvents.length}
            </span>
          </div>
        </div>

        {/* Heatmap + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Heatmap */}
          <div className="lg:col-span-3 glass-card" style={{ padding: '20px', minHeight: '500px' }}>
            {mounted && filteredEvents.length > 0 ? (
              <HeatmapLayer
                events={filteredEvents.map(e => ({ lat: e.latitude, lng: e.longitude, intensity: Math.max(1, e.fatalities), eventType: e.eventType }))}
                visible={true}
                radius={25000}
                opacity={0.8}
                locale={locale}
              />
            ) : mounted ? (
              <div className="flex flex-col items-center justify-center" style={{ minHeight: '450px', color: 'var(--text4)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔥</div>
                <p className="text-sm mb-2">{t('heatmap.noEvents', locale)}</p>
                <Link
                  href={`${localePrefix}/geopolitical-risks/map`}
                  className="text-xs px-4 py-2 rounded-lg inline-block"
                  style={{ background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.15)', color: 'var(--cyan)' }}
                >
                  {t('heatmap.openMap', locale)}
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-center" style={{ minHeight: '450px', color: 'var(--text4)' }}>
                {t('heatmap.loadingHeatmap', locale)}
              </div>
            )}
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--text-head)' }}>{t('heatmap.summary', locale)}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('heatmap.totalEvents', locale)}</span>
                  <span style={{
                    fontSize: '14px', fontFamily: 'var(--font-mono)',
                    fontWeight: 700, color: 'var(--gold)',
                  }}>
                    {stats.totalEvents}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('heatmap.totalFatalities', locale)}</span>
                  <span style={{
                    fontSize: '14px', fontFamily: 'var(--font-mono)',
                    fontWeight: 700, color: 'var(--bear)',
                  }}>
                    {stats.totalFatalities}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('heatmap.affectedCountries', locale)}</span>
                  <span style={{
                    fontSize: '14px', fontFamily: 'var(--font-mono)',
                    fontWeight: 700, color: 'var(--cyan)',
                  }}>
                    {stats.affectedCountries}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Type Breakdown */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--text-head)' }}>{t('heatmap.typeBreakdown', locale)}</h3>
              <div className="space-y-2">
                {Object.entries(stats.typeBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const color = EVENT_TYPE_COLORS[type] || 'var(--text3)';
                    const label = t(EVENT_TYPE_LABEL_KEYS[type] || type, locale);
                    const pct = stats.totalEvents > 0 ? Math.round((count / stats.totalEvents) * 100) : 0;
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px]" style={{ color }}>{label}</span>
                          <span style={{
                            fontSize: '10px', fontFamily: 'var(--font-mono)',
                            fontWeight: 700, color,
                          }}>
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div style={{
                          width: '100%', height: '3px', borderRadius: '2px',
                          background: 'var(--surface-2)', overflow: 'hidden',
                        }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: '2px', background: color }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Top Countries */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--text-head)' }}>{t('heatmap.topCountries', locale)}</h3>
              <div className="space-y-1.5 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {stats.topCountries.map(([country, count], idx) => {
                  const pct = stats.totalEvents > 0 ? Math.round((count / stats.totalEvents) * 100) : 0;
                  return (
                    <button
                      key={country}
                      onClick={() => setCountryFilter(country)}
                      className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg transition-all hover:bg-[var(--surface-2)]"
                    >
                      <div className="flex items-center gap-2">
                        <span style={{
                          fontSize: '9px', fontWeight: 700,
                          fontFamily: 'var(--font-mono)', color: 'var(--text4)',
                          width: '14px',
                        }}>
                          {idx + 1}
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--text)' }}>{country}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div style={{
                          width: '24px', height: '3px', borderRadius: '2px',
                          background: 'var(--surface-2)', overflow: 'hidden',
                        }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: '2px', background: 'var(--bear)' }} />
                        </div>
                        <span style={{
                          fontSize: '9px', fontFamily: 'var(--font-mono)',
                          fontWeight: 700, color: 'var(--bear)',
                        }}>
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events Table */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>{t('heatmap.recentEvents', locale)}</h3>
          </div>
          <div className="max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--rim)' }}>
                  <th className={`${textAlign} py-2 px-2 font-semibold`} style={{ color: 'var(--text4)' }}>{t('heatmap.date', locale)}</th>
                  <th className={`${textAlign} py-2 px-2 font-semibold`} style={{ color: 'var(--text4)' }}>{t('heatmap.typeCol', locale)}</th>
                  <th className={`${textAlign} py-2 px-2 font-semibold`} style={{ color: 'var(--text4)' }}>{t('heatmap.countryCol', locale)}</th>
                  <th className={`${textAlign} py-2 px-2 font-semibold`} style={{ color: 'var(--text4)' }}>{t('heatmap.fatalitiesCol', locale)}</th>
                  <th className={`${textAlign} py-2 px-2 font-semibold`} style={{ color: 'var(--text4)' }}>{t('heatmap.detailsCol', locale)}</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.slice(0, 50).map((event) => {
                  const typeColor = EVENT_TYPE_COLORS[event.eventType] || 'var(--text3)';
                  const typeLabel = t(EVENT_TYPE_LABEL_KEYS[event.eventType] || event.eventType, locale);
                  return (
                    <tr key={event.id} style={{ borderBottom: '1px solid var(--rim)' }}>
                      <td className={`${textAlign} py-2 px-2`} style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                        {new Date(event.eventDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale, { month: 'short', day: 'numeric' })}
                      </td>
                      <td className={`${textAlign} py-2 px-2`}>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: `${typeColor}15`, color: typeColor }}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className={`${textAlign} py-2 px-2`} style={{ color: 'var(--text)' }}>{event.country}</td>
                      <td className={`${textAlign} py-2 px-2`} style={{ color: event.fatalities > 0 ? 'var(--bear)' : 'var(--text4)', fontFamily: 'var(--font-mono)' }}>
                        {event.fatalities > 0 ? event.fatalities : '-'}
                      </td>
                      <td className={`${textAlign} py-2 px-2 max-w-[200px] truncate`} style={{ color: 'var(--text3)' }}>
                        {event.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
