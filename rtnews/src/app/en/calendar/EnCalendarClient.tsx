'use client';

import { useState, useEffect, useCallback } from 'react';

interface CalendarEvent {
  id: string; eventName: string; eventNameAr: string;
  country: string; currency: string;
  eventDate: string; importance: string; eventType: string;
  forecast: string; previous: string; actual: string | null;
  isActualReleased: boolean;
}

type WeekMode = 'current' | 'next';
type CountryFilter = 'ALL' | string;
type ImportanceFilter = '' | 'high' | 'critical';

const IMPORTANCE_COLORS: Record<string, string> = {
  critical: 'var(--bear)',
  high: 'var(--gold)',
  medium: 'var(--cyan)',
  low: 'var(--text3)',
};

/* ── Locale dictionaries ── */
const TEXT: Record<string, Record<string, string>> = {
  en: {
    pageTitle: 'Economic Calendar',
    live: 'Live',
    pageDesc: 'Track upcoming economic events, forecasts, and actual releases',
    totalEvents: 'Total Events',
    highImpact: 'High Impact',
    activeDays: 'Active Days',
    released: 'Released',
    thisWeek: 'This Week',
    nextWeek: 'Next Week',
    allCountries: '🌍 All Countries',
    allImportance: 'All Importance',
    highAndAbove: 'High & Above',
    criticalOnly: 'Critical Only',
    noEvents: 'No economic events scheduled for this week',
    event: 'event',
    events: 'events',
    forecast: 'Forecast',
    previous: 'Previous',
    actual: 'Actual',
    releasedBadge: 'Released',
    eventLabel: 'Event',
    currency: 'Currency',
    impactLevel: 'Impact Level',
    utcTime: 'UTC Time',
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    indicator: 'Indicator',
    speech: 'Speech',
    meeting: 'Meeting',
    earnings: 'Earnings',
    other: 'Other',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
  },
  es: {
    pageTitle: 'Calendario Económico',
    live: 'En vivo',
    pageDesc: 'Siga los próximos eventos económicos, previsiones y datos publicados',
    totalEvents: 'Total de eventos',
    highImpact: 'Alto impacto',
    activeDays: 'Días activos',
    released: 'Publicados',
    thisWeek: 'Esta semana',
    nextWeek: 'Próxima semana',
    allCountries: '🌍 Todos los países',
    allImportance: 'Toda importancia',
    highAndAbove: 'Alta y superior',
    criticalOnly: 'Solo crítico',
    noEvents: 'No hay eventos económicos programados para esta semana',
    event: 'evento',
    events: 'eventos',
    forecast: 'Previsión',
    previous: 'Anterior',
    actual: 'Real',
    releasedBadge: 'Publicado',
    eventLabel: 'Evento',
    currency: 'Moneda',
    impactLevel: 'Nivel de impacto',
    utcTime: 'Hora UTC',
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo',
    indicator: 'Indicador',
    speech: 'Discurso',
    meeting: 'Reunión',
    earnings: 'Ganancias',
    other: 'Otro',
    sunday: 'Domingo',
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
  },
  fr: {
    pageTitle: 'Calendrier Économique',
    live: 'En direct',
    pageDesc: 'Suivez les événements économiques à venir, les prévisions et les données publiées',
    totalEvents: 'Total événements',
    highImpact: 'Impact élevé',
    activeDays: 'Jours actifs',
    released: 'Publiés',
    thisWeek: 'Cette semaine',
    nextWeek: 'Semaine prochaine',
    allCountries: '🌍 Tous les pays',
    allImportance: 'Toute importance',
    highAndAbove: 'Élevée et plus',
    criticalOnly: 'Critique uniquement',
    noEvents: 'Aucun événement économique prévu cette semaine',
    event: 'événement',
    events: 'événements',
    forecast: 'Prévision',
    previous: 'Précédent',
    actual: 'Réel',
    releasedBadge: 'Publié',
    eventLabel: 'Événement',
    currency: 'Devise',
    impactLevel: "Niveau d'impact",
    utcTime: 'Heure UTC',
    critical: 'Critique',
    high: 'Élevé',
    medium: 'Moyen',
    low: 'Faible',
    indicator: 'Indicateur',
    speech: 'Discours',
    meeting: 'Réunion',
    earnings: 'Résultats',
    other: 'Autre',
    sunday: 'Dimanche',
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
  },
  tr: {
    pageTitle: 'Ekonomik Takvim',
    live: 'Canlı',
    pageDesc: 'Yaklaşan ekonomik olayları, tahminleri ve açıklanan verileri takip edin',
    totalEvents: 'Toplam olay',
    highImpact: 'Yüksek etki',
    activeDays: 'Aktif gün',
    released: 'Açıklandı',
    thisWeek: 'Bu hafta',
    nextWeek: 'Gelecek hafta',
    allCountries: '🌍 Tüm ülkeler',
    allImportance: 'Tüm önem',
    highAndAbove: 'Yüksek ve üzeri',
    criticalOnly: 'Sadece kritik',
    noEvents: 'Bu hafta planlanmış ekonomik olay yok',
    event: 'olay',
    events: 'olay',
    forecast: 'Tahmin',
    previous: 'Önceki',
    actual: 'Gerçek',
    releasedBadge: 'Açıklandı',
    eventLabel: 'Olay',
    currency: 'Para birimi',
    impactLevel: 'Etki seviyesi',
    utcTime: 'UTC Saati',
    critical: 'Kritik',
    high: 'Yüksek',
    medium: 'Orta',
    low: 'Düşük',
    indicator: 'Gösterge',
    speech: 'Konuşma',
    meeting: 'Toplantı',
    earnings: 'Kazançlar',
    other: 'Diğer',
    sunday: 'Pazar',
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',
    saturday: 'Cumartesi',
  },
};

const COUNTRY_NAMES_BY_LOCALE: Record<string, Record<string, string>> = {
  en: {
    US: 'United States', EU: 'Eurozone', GB: 'United Kingdom', JP: 'Japan', CN: 'China',
    SA: 'Saudi Arabia', AE: 'UAE', EG: 'Egypt', OPEC: 'OPEC+', DE: 'Germany', FR: 'France',
  },
  es: {
    US: 'Estados Unidos', EU: 'Eurozona', GB: 'Reino Unido', JP: 'Japón', CN: 'China',
    SA: 'Arabia Saudí', AE: 'EAU', EG: 'Egipto', OPEC: 'OPEP+', DE: 'Alemania', FR: 'Francia',
  },
  fr: {
    US: 'États-Unis', EU: 'Zone euro', GB: 'Royaume-Uni', JP: 'Japon', CN: 'Chine',
    SA: 'Arabie Saoudite', AE: 'EAU', EG: 'Égypte', OPEC: 'OPEP+', DE: 'Allemagne', FR: 'France',
  },
  tr: {
    US: 'Amerika Birleşik Devletleri', EU: 'Avrupa Bölgesi', GB: 'Birleşik Krallık', JP: 'Japonya', CN: 'Çin',
    SA: 'Suudi Arabistan', AE: 'BAE', EG: 'Mısır', OPEC: 'OPEC+', DE: 'Almanya', FR: 'Fransa',
  },
};

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', GB: '🇬🇧', JP: '🇯🇵', CN: '🇨🇳',
  SA: '🇸🇦', AE: '🇦🇪', EG: '🇪🇬', OPEC: '🛢️', DE: '🇩🇪', FR: '🇫🇷',
};

const LOCALE_DATE_FORMAT: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  tr: 'tr-TR',
};

function t(locale: string, key: string): string {
  return TEXT[locale]?.[key] || TEXT.en[key] || key;
}

function getImportanceLabel(locale: string, importance: string): string {
  const key = importance; // 'critical', 'high', 'medium', 'low'
  return t(locale, key);
}

function getEventTypeLabel(locale: string, eventType: string): string {
  return t(locale, eventType);
}

function getCountryName(locale: string, countryCode: string): string {
  return COUNTRY_NAMES_BY_LOCALE[locale]?.[countryCode] || COUNTRY_NAMES_BY_LOCALE.en[countryCode] || countryCode;
}

function getDayName(locale: string, dayIndex: number): string {
  const keys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return t(locale, keys[dayIndex]);
}

interface EnCalendarClientProps {
  locale?: string;
}

export default function EnCalendarClient({ locale = 'en' }: EnCalendarClientProps) {
  const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});
  const [week, setWeek] = useState<WeekMode>('current');
  const [country, setCountry] = useState<CountryFilter>('ALL');
  const [importance, setImportance] = useState<ImportanceFilter>('');
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ week });
      if (country !== 'ALL') params.set('country', country);
      if (importance) params.set('importance', importance);

      const res = await fetch(`/api/economic-calendar?${params}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.events) setEvents(data.events);
      if (data.availableCountries) setAvailableCountries(data.availableCountries);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [week, country, importance]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Auto-refresh for actual releases every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchEvents, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const sortedDays = Object.keys(events).sort();

  const totalEvents = Object.values(events).reduce((sum, dayEvents) => sum + dayEvents.length, 0);

  const criticalCount = Object.values(events)
    .flat()
    .filter((e) => e.importance === 'critical' || e.importance === 'high')
    .length;

  const dateFormat = LOCALE_DATE_FORMAT[locale] || 'en-US';

  return (
    <main className="min-h-screen pb-mobile-safe" dir="ltr" style={{ background: 'var(--ink)' }}>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ padding: '40px 0 24px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--ambient-tr)', zIndex: 0 }} />
        <div className="max-w-[1200px] mx-auto px-4 relative z-10" style={{ paddingInline: 'var(--space-md)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gold2)', border: '1px solid rgba(255,184,0,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold gradient-text-gold">{t(locale, 'pageTitle')}</h1>
            <span className="badge-live"><span className="live-dot" />{t(locale, 'live')}</span>
          </div>
          <p className="text-[14px]" style={{ color: 'var(--text2)' }}>{t(locale, 'pageDesc')}</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="glass-card p-3 text-center">
            <div className="font-mono-price text-lg font-bold" style={{ color: 'var(--text)' }}>{totalEvents}</div>
            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{t(locale, 'totalEvents')}</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="font-mono-price text-lg font-bold" style={{ color: 'var(--gold)' }}>{criticalCount}</div>
            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{t(locale, 'highImpact')}</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="font-mono-price text-lg font-bold" style={{ color: 'var(--cyan)' }}>{sortedDays.length}</div>
            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{t(locale, 'activeDays')}</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="font-mono-price text-lg font-bold" style={{ color: 'var(--bull)' }}>
              {Object.values(events).flat().filter(e => e.isActualReleased).length}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{t(locale, 'released')}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Week Toggle */}
            <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--bg4)' }}>
              {(['current', 'next'] as WeekMode[]).map((w) => (
                <button
                  key={w}
                  onClick={() => setWeek(w)}
                  className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all"
                  style={{
                    background: week === w ? 'var(--cyan)' : 'transparent',
                    color: week === w ? 'var(--bg)' : 'var(--text3)',
                  }}
                >
                  {w === 'current' ? t(locale, 'thisWeek') : t(locale, 'nextWeek')}
                </button>
              ))}
            </div>

            {/* Country Filter */}
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
              style={{
                background: 'var(--bg4)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                outline: 'none',
              }}
            >
              <option value="ALL">{t(locale, 'allCountries')}</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>{COUNTRY_FLAGS[c] || '🏳️'} {getCountryName(locale, c)}</option>
              ))}
            </select>

            {/* Importance Filter */}
            <select
              value={importance}
              onChange={(e) => setImportance(e.target.value as ImportanceFilter)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
              style={{
                background: 'var(--bg4)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                outline: 'none',
              }}
            >
              <option value="">{t(locale, 'allImportance')}</option>
              <option value="high">{t(locale, 'highAndAbove')}</option>
              <option value="critical">{t(locale, 'criticalOnly')}</option>
            </select>
          </div>
        </div>

        {/* Calendar Events */}
        {loading ? (
          <div className="space-y-4 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-card p-4">
                <div className="skeleton" style={{ width: '120px', height: '16px', marginBottom: '12px' }} />
                <div className="skeleton" style={{ width: '100%', height: '60px' }} />
              </div>
            ))}
          </div>
        ) : sortedDays.length === 0 ? (
          <div className="glass-card p-8 text-center mb-6">
            <p className="text-[14px]" style={{ color: 'var(--text3)' }}>{t(locale, 'noEvents')}</p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {sortedDays.map((dayKey) => {
              const dayEvents = events[dayKey];
              const dayDate = new Date(dayKey + 'T00:00:00');
              const dayName = mounted ? getDayName(locale, dayDate.getDay()) : '';
              const formattedDate = mounted ? dayDate.toLocaleDateString(dateFormat, { day: 'numeric', month: 'long' }) : dayKey;

              return (
                <div key={dayKey}>
                  {/* Day Header */}
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold"
                        style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
                        {dayDate.getDate()}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{dayName}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{formattedDate}</div>
                      </div>
                    </div>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    <span className="text-[10px] font-mono-price" style={{ color: 'var(--text3)' }}>
                      {dayEvents.length} {dayEvents.length === 1 ? t(locale, 'event') : t(locale, 'events')}
                    </span>
                  </div>

                  {/* Events for this day */}
                  <div className="space-y-2">
                    {dayEvents.map((event) => {
                      const eventTime = new Date(event.eventDate);
                      const isExpanded = expandedEvent === event.id;
                      const impColor = IMPORTANCE_COLORS[event.importance] || 'var(--text3)';
                      const isPast = mounted ? eventTime.getTime() < Date.now() : false;

                      return (
                        <div
                          key={event.id}
                          className="glass-card p-3 cursor-pointer transition-all"
                          onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                          style={{
                            borderInlineStart: `3px solid ${impColor}`,
                          }}
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-2">
                            {/* Time */}
                            <div className="flex items-center gap-2 md:w-24 flex-shrink-0">
                              <span className="font-mono-price text-[12px] font-bold" style={{ color: isPast ? 'var(--text3)' : 'var(--text)' }} suppressHydrationWarning>
                                {mounted ? eventTime.toLocaleTimeString(dateFormat, { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                              </span>
                            </div>

                            {/* Country & Name */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[14px]">{COUNTRY_FLAGS[event.country] || '🏳️'}</span>
                                <span className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>{event.eventName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                                  {getCountryName(locale, event.country)}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
                                  background: `${impColor}18`,
                                  color: impColor,
                                  border: `1px solid ${impColor}30`,
                                }}>
                                  {getImportanceLabel(locale, event.importance)}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
                                  background: 'var(--purple2)',
                                  color: 'var(--purple)',
                                }}>
                                  {getEventTypeLabel(locale, event.eventType)}
                                </span>
                                {event.isActualReleased && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
                                    background: 'var(--bull2)',
                                    color: 'var(--bull)',
                                  }}>
                                    {t(locale, 'releasedBadge')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Values */}
                            <div className="flex items-center gap-4 text-[11px] flex-shrink-0">
                              <div className="text-center">
                                <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{t(locale, 'forecast')}</div>
                                <div className="font-mono-price font-medium" style={{ color: 'var(--cyan)' }}>{event.forecast}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{t(locale, 'previous')}</div>
                                <div className="font-mono-price" style={{ color: 'var(--text2)' }}>{event.previous}</div>
                              </div>
                              {event.isActualReleased && event.actual && (
                                <div className="text-center">
                                  <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{t(locale, 'actual')}</div>
                                  <div className="font-mono-price font-bold" style={{
                                    color: event.actual > event.forecast ? 'var(--bull)' : event.actual < event.forecast ? 'var(--bear)' : 'var(--text)',
                                  }}>
                                    {event.actual}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <div className="text-[9px] mb-1" style={{ color: 'var(--text3)' }}>{t(locale, 'eventLabel')}</div>
                                  <div className="text-[11px]" style={{ color: 'var(--text2)' }}>{event.eventName}</div>
                                </div>
                                <div>
                                  <div className="text-[9px] mb-1" style={{ color: 'var(--text3)' }}>{t(locale, 'currency')}</div>
                                  <div className="font-mono-price text-[11px] font-bold" style={{ color: 'var(--text)' }}>{event.currency}</div>
                                </div>
                                <div>
                                  <div className="text-[9px] mb-1" style={{ color: 'var(--text3)' }}>{t(locale, 'impactLevel')}</div>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3].map((level) => (
                                      <span key={level} className="w-2 h-2 rounded-full" style={{
                                        background: level <= (event.importance === 'critical' ? 3 : event.importance === 'high' ? 2 : event.importance === 'medium' ? 1 : 0)
                                          ? impColor : 'rgba(255,255,255,0.06)',
                                      }} />
                                    ))}
                                    <span className="text-[10px] ml-1" style={{ color: impColor }}>
                                      {getImportanceLabel(locale, event.importance)}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[9px] mb-1" style={{ color: 'var(--text3)' }}>{t(locale, 'utcTime')}</div>
                                  <div className="font-mono-price text-[11px]" style={{ color: 'var(--text2)' }} suppressHydrationWarning>
                                    {mounted ? new Date(event.eventDate).toLocaleString(dateFormat, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }) : '--:--'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </main>
  );
}
