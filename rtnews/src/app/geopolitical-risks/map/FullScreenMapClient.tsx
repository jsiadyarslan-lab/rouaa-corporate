'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getRiskColor, getRiskLabel } from '@/lib/geopolitical/risk-thresholds';
import { t } from '@/lib/geopolitical/i18n';
import TimelineSlider from '@/components/geopolitical/TimelineSlider';
import CountryRiskSheet from '@/components/geopolitical/CountryRiskSheet';

const RiskMap = dynamic(() => import('@/components/geopolitical/RiskMap'), { ssr: false });
const HeatmapLayer = dynamic(() => import('@/components/geopolitical/HeatmapLayer'), { ssr: false });

// ─── Types ──────────────────────────────────────────────────────

interface CountryScore {
  id: string;
  countryCode: string;
  countryNameAr: string;
  countryNameEn: string;
  compositeScore: number;
  gprScore: number | null;
  aiGprScore: number | null;
  acledScore: number | null;
  worldBankScore: number | null;
  gdeltScore: number | null;
  peaceIndexScore: number | null;
  riskLevel: string;
  riskCategory: string;
  region: string;
  subRegion: string | null;
  latitude: number | null;
  longitude: number | null;
  updatedAt: string;
}

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
  countryScores: CountryScore[];
  events: GeoEvent[];
  locale?: string;
}

// ─── Constants ──────────────────────────────────────────────────

type LayerType = 'choropleth' | 'heatmap' | 'events';

const LAYER_IDS: { id: LayerType; icon: string; labelKey: string }[] = [
  { id: 'choropleth', icon: '🗺️', labelKey: 'map.riskLevel' },
  { id: 'heatmap', icon: '🔥', labelKey: 'map.heatmapView' },
  { id: 'events', icon: '📍', labelKey: 'map.events' },
];

const REGION_FILTERS = [
  { id: 'all', labelKey: 'map.all' },
  { id: 'middle-east', labelKey: 'map.middleEast' },
  { id: 'africa', labelKey: 'map.africa' },
  { id: 'europe', labelKey: 'map.europe' },
  { id: 'east-asia', labelKey: 'map.eastAsia' },
  { id: 'americas', labelKey: 'map.americas' },
];

const EVENT_TYPE_LABEL_KEYS: Record<string, string> = {
  battle: 'event.battle',
  protest: 'event.protest',
  riot: 'event.riot',
  'violence-civilians': 'event.violenceCivilians',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  battle: 'var(--bear)',
  protest: 'var(--gold)',
  riot: 'var(--orange)',
  'violence-civilians': 'var(--bear)',
};

// ─── Main Component ─────────────────────────────────────────────

export default function FullScreenMapClient({ countryScores, events, locale = 'ar' }: Props) {
  const [mounted, setMounted] = useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerType>('choropleth');
  const [selectedCountry, setSelectedCountry] = useState<CountryScore | null>(null);
  const [regionFilter, setRegionFilter] = useState('all');
  const [dateRange, setDateRange] = useState<[number, number]>([0, Date.now()]);
  const [showSheet, setShowSheet] = useState(false);
  const localePrefix = locale === 'ar' ? '' : `/${locale}`;

  useEffect(() => {
    setMounted(true);
    window.scrollTo(0, 0);
  }, []);

  const filteredScores = useMemo(() =>
    regionFilter === 'all'
      ? countryScores
      : countryScores.filter(c => c.region === regionFilter),
    [countryScores, regionFilter]
  );

  const filteredEvents = useMemo(() =>
    events.filter(e => {
      const eventTime = new Date(e.eventDate).getTime();
      return eventTime >= dateRange[0] && eventTime <= dateRange[1];
    }),
    [events, dateRange]
  );

  const textAlign = locale === 'ar' ? 'text-right' : 'text-left';

  return (
    <main className="min-h-screen pb-mobile-safe" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* ═══ HEADER ═══ */}
      <div className="max-w-[1280px] mx-auto pt-4" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link
              href={`${localePrefix}/geopolitical-risks`}
              className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg"
              style={{ color: 'var(--text3)', background: 'var(--surface-2)', border: '1px solid var(--rim)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              {t('map.back', locale)}
            </Link>
            <div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--text-head)' }}>{t('map.title', locale)}</h1>
              <p className="text-[10px]" style={{ color: 'var(--text4)' }}>
                {countryScores.length} {t('map.country', locale)} · {events.length} {t('map.event', locale)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAP + SIDEBAR ═══ */}
      <div className="max-w-[1280px] mx-auto" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
          {/* Map Area */}
          <div className="lg:col-span-3">
            <div className="glass-card" style={{ padding: '16px', minHeight: '500px' }}>
              {/* Layer Toggle */}
              <div className="flex items-center gap-2 mb-3">
                {LAYER_IDS.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => setActiveLayer(layer.id)}
                    className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      background: activeLayer === layer.id ? 'var(--cyan2)' : 'transparent',
                      border: `1px solid ${activeLayer === layer.id ? 'rgba(0,229,255,.2)' : 'var(--rim)'}`,
                      color: activeLayer === layer.id ? 'var(--cyan)' : 'var(--text3)',
                      fontWeight: activeLayer === layer.id ? 600 : 400,
                    }}
                  >
                    <span>{layer.icon}</span>
                    {t(layer.labelKey, locale)}
                  </button>
                ))}
              </div>

              {/* Map */}
              {mounted ? (
                activeLayer === 'heatmap' ? (
                  <HeatmapLayer
                    events={filteredEvents.map(e => ({ lat: e.latitude, lng: e.longitude, intensity: Math.max(1, e.fatalities), eventType: e.eventType }))}
                    visible={true}
                    radius={25000}
                    opacity={0.8}
                    locale={locale}
                  />
                ) : (
                  <RiskMap
                    countryScores={filteredScores.map(c => ({ countryCode: c.countryCode, score: c.compositeScore }))}
                    events={activeLayer === 'events' ? filteredEvents.map(e => ({ lat: e.latitude, lng: e.longitude, type: e.eventType, fatalities: e.fatalities, date: e.eventDate, title: e.notes || undefined })) : []}
                    locale={locale}
                  />
                )
              ) : (
                <div className="flex items-center justify-center" style={{ minHeight: '450px', color: 'var(--text4)' }}>
                  {t('dashboard.loadingMap', locale)}
                </div>
              )}

              {/* Timeline Slider */}
              <div className="mt-3">
                <TimelineSlider
                  startDate={new Date(dateRange[0]).toISOString().split('T')[0]}
                  endDate={new Date(dateRange[1]).toISOString().split('T')[0]}
                  onRangeChange={(start, end) => setDateRange([new Date(start).getTime(), new Date(end).getTime()])}
                  locale={locale}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Region Filter */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--text-head)' }}>{t('map.region', locale)}</h3>
              <div className="space-y-1">
                {REGION_FILTERS.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => setRegionFilter(region.id)}
                    className={`w-full ${textAlign} text-[11px] px-3 py-1.5 rounded-lg transition-all`}
                    style={{
                      background: regionFilter === region.id ? 'var(--cyan2)' : 'transparent',
                      color: regionFilter === region.id ? 'var(--cyan)' : 'var(--text3)',
                      fontWeight: regionFilter === region.id ? 600 : 400,
                    }}
                  >
                    {t(region.labelKey, locale)}
                  </button>
                ))}
              </div>
            </div>

            {/* Country Risk Ranking */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--text-head)' }}>{t('map.riskRanking', locale)}</h3>
              <div className="space-y-1.5 max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {filteredScores.map((country, idx) => {
                  const scoreColor = getRiskColor(country.compositeScore);
                  return (
                    <button
                      key={country.id}
                      onClick={() => {
                        setSelectedCountry(country);
                        setShowSheet(true);
                      }}
                      className="w-full flex items-center justify-between py-2 px-2 rounded-lg transition-all hover:bg-[var(--surface-2)]"
                    >
                      <div className="flex items-center gap-2">
                        <span style={{
                          fontSize: '10px', fontWeight: 700,
                          fontFamily: 'var(--font-mono)', color: 'var(--text4)',
                          width: '16px',
                        }}>
                          {idx + 1}
                        </span>
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--text)' }}>
                          {locale === 'ar' ? country.countryNameAr : country.countryNameEn}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div style={{
                          width: '28px', height: '3px', borderRadius: '2px',
                          background: 'var(--surface-2)', overflow: 'hidden',
                        }}>
                          <div style={{ width: `${country.compositeScore}%`, height: '100%', borderRadius: '2px', background: scoreColor }} />
                        </div>
                        <span style={{
                          fontSize: '10px', fontFamily: 'var(--font-mono)',
                          fontWeight: 700, color: scoreColor,
                        }}>
                          {country.compositeScore}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Summary */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--text-head)' }}>{t('map.eventSummary', locale)}</h3>
              <div className="space-y-2">
                {['battle', 'protest', 'riot', 'violence-civilians'].map((type) => {
                  const count = filteredEvents.filter(e => e.eventType === type).length;
                  if (count === 0) return null;
                  const typeLabel = t(EVENT_TYPE_LABEL_KEYS[type] || type, locale);
                  const typeColor = EVENT_TYPE_COLORS[type] || 'var(--text3)';
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: typeColor }}>
                        {typeLabel}
                      </span>
                      <span style={{
                        fontSize: '10px', fontFamily: 'var(--font-mono)',
                        fontWeight: 700, color: typeColor,
                      }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Country Risk Sheet (Mobile) */}
      {showSheet && selectedCountry && (
        <CountryRiskSheet
          countryCode={selectedCountry.countryCode}
          locale={locale}
          open={showSheet}
          onClose={() => setShowSheet(false)}
        />
      )}
    </main>
  );
}
