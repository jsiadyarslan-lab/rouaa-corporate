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

const IMPORTANCE_LABELS: Record<string, string> = {
  critical: 'Kritik',
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  indicator: 'Gösterge', speech: 'Konuşma', meeting: 'Toplantı', earnings: 'Sonuçlar', other: 'Diğer',
};

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', GB: '🇬🇧', JP: '🇯🇵', CN: '🇨🇳',
  SA: '🇸🇦', AE: '🇦🇪', EG: '🇪🇬', OPEC: '🛢️', DE: '🇩🇪', FR: '🇫🇷',
  UK: '🇬🇧', AU: '🇦🇺', CA: '🇨🇦', CH: '🇨🇭', NZ: '🇳🇿',
  KW: '🇰🇼', QA: '🇶🇦', BH: '🇧🇭', OM: '🇴🇲', JO: '🇯🇴', LB: '🇱🇧', IQ: '🇮🇶',
  TR: '🇹🇷', ES: '🇪🇸', MX: '🇲🇽', BR: '🇧🇷',
};

const COUNTRY_NAMES: Record<string, string> = {
  US: 'ABD', EU: 'Avro Bölgesi', GB: 'Birleşik Krallık', UK: 'Birleşik Krallık',
  JP: 'Japonya', CN: 'Çin', SA: 'Suudi Arabistan', AE: 'BAE', EG: 'Mısır',
  OPEC: 'OPEC+', DE: 'Almanya', FR: 'Fransa', AU: 'Avustralya', CA: 'Kanada',
  CH: 'İsviçre', NZ: 'Yeni Zelanda', KW: 'Kuveyt', QA: 'Katar', BH: 'Bahreyn',
  OM: 'Umman', JO: 'Ürdün', LB: 'Lübnan', IQ: 'Irak',
  TR: 'Türkiye', ES: 'İspanya', MX: 'Meksika', BR: 'Brezilya',
};

const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export default function TrEconomicCalendarClient() {
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

  // Actualisation automatique toutes les 10 minutes
  useEffect(() => {
    const interval = setInterval(fetchEvents, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const sortedDays = Object.keys(events).sort();

  const totalEvents = Object.values(events).reduce((sum, dayEvents) => sum + dayEvents.length, 0);

  const criticalCount = Object.values(events)
    .flat()
    .filter((e) => e.importance === 'critical' || e.importance === 'high')
    .length;

  return (
    <main className="min-h-screen pb-mobile-safe" dir="ltr" style={{ background: 'var(--ink)' }}>

      {/* En-tête */}
      <div className="relative overflow-hidden" style={{ padding: '40px 0 24px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--ambient-tr)', zIndex: 0 }} />
        <div className="max-w-[1200px] mx-auto px-4 relative z-10" style={{ paddingInline: 'var(--space-md)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gold2)', border: '1px solid rgba(255,184,0,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold gradient-text-gold">Ekonomik Takvim</h1>
            <span className="badge-live"><span className="live-dot" />Canlı</span>
          </div>
          <p className="text-[14px]" style={{ color: 'var(--text2)' }}>Yaklaşan ekonomik olayları, tahminleri ve gerçek sonuçları takip edin</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
        {/* Statistiques résumées */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="glass-card p-3 text-center">
            <div className="font-mono-price text-lg font-bold" style={{ color: 'var(--text)' }}>{totalEvents}</div>
            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>Toplam Olay</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="font-mono-price text-lg font-bold" style={{ color: 'var(--gold)' }}>{criticalCount}</div>
            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>Yüksek Etki</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="font-mono-price text-lg font-bold" style={{ color: 'var(--cyan)' }}>{sortedDays.length}</div>
            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>Aktif Gün</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="font-mono-price text-lg font-bold" style={{ color: 'var(--bull)' }}>
              {Object.values(events).flat().filter(e => e.isActualReleased).length}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>Yayınlanan</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Sélection de semaine */}
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
                  {w === 'current' ? 'Bu Hafta' : 'Gelecek Hafta'}
                </button>
              ))}
            </div>

            {/* Filtre par pays */}
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
              <option value="ALL">🌍 Tüm Ülkeler</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>{COUNTRY_FLAGS[c] || '🏳️'} {COUNTRY_NAMES[c] || c}</option>
              ))}
            </select>

            {/* Filtre par importance */}
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
              <option value="">Tüm Önem Dereceleri</option>
              <option value="high">Yüksek ve Üstü</option>
              <option value="critical">Yalnızca Kritik</option>
            </select>
          </div>
        </div>

        {/* Événements du calendrier */}
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
            <p className="text-[14px]" style={{ color: 'var(--text3)' }}>Bu hafta ekonomik olay bulunmamaktadır</p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {sortedDays.map((dayKey) => {
              const dayEvents = events[dayKey];
              const dayDate = new Date(dayKey + 'T00:00:00');
              const dayName = mounted ? DAY_NAMES[dayDate.getDay()] : '';
              const formattedDate = mounted ? dayDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : dayKey;

              return (
                <div key={dayKey}>
                  {/* En-tête du jour */}
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
                      {dayEvents.length} {dayEvents.length === 1 ? 'olay' : 'olaylar'}
                    </span>
                  </div>

                  {/* Événements du jour */}
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
                            borderLeft: `3px solid ${impColor}`,
                          }}
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-2">
                            {/* Heure */}
                            <div className="flex items-center gap-2 md:w-24 flex-shrink-0">
                              <span className="font-mono-price text-[12px] font-bold" style={{ color: isPast ? 'var(--text3)' : 'var(--text)' }} suppressHydrationWarning>
                                {mounted ? eventTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                              </span>
                            </div>

                            {/* Pays et nom */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[14px]">{COUNTRY_FLAGS[event.country] || '🏳️'}</span>
                                <span className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>{event.eventName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                                  {COUNTRY_NAMES[event.country] || event.country}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
                                  background: `${impColor}18`,
                                  color: impColor,
                                  border: `1px solid ${impColor}30`,
                                }}>
                                  {IMPORTANCE_LABELS[event.importance] || event.importance}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
                                  background: 'var(--purple2)',
                                  color: 'var(--purple)',
                                }}>
                                  {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                                </span>
                                {event.isActualReleased && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
                                    background: 'var(--bull2)',
                                    color: 'var(--bull)',
                                  }}>
                                    Yayınlandı
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Valeurs */}
                            <div className="flex items-center gap-4 text-[11px] flex-shrink-0">
                              <div className="text-center">
                                <div className="text-[9px]" style={{ color: 'var(--text3)' }}>Tahmin</div>
                                <div className="font-mono-price font-medium" style={{ color: 'var(--cyan)' }}>{event.forecast}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[9px]" style={{ color: 'var(--text3)' }}>Önceki</div>
                                <div className="font-mono-price" style={{ color: 'var(--text2)' }}>{event.previous}</div>
                              </div>
                              {event.isActualReleased && event.actual && (
                                <div className="text-center">
                                  <div className="text-[9px]" style={{ color: 'var(--text3)' }}>Gerçek</div>
                                  <div className="font-mono-price font-bold" style={{
                                    color: event.actual > event.forecast ? 'var(--bull)' : event.actual < event.forecast ? 'var(--bear)' : 'var(--text)',
                                  }}>
                                    {event.actual}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Détails étendus */}
                          {isExpanded && (
                            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <div className="text-[9px] mb-1" style={{ color: 'var(--text3)' }}>Olay</div>
                                  <div className="text-[11px]" style={{ color: 'var(--text2)' }}>{event.eventNameAr || event.eventName}</div>
                                </div>
                                <div>
                                  <div className="text-[9px] mb-1" style={{ color: 'var(--text3)' }}>Para Birimi</div>
                                  <div className="font-mono-price text-[11px] font-bold" style={{ color: 'var(--text)' }}>{event.currency}</div>
                                </div>
                                <div>
                                  <div className="text-[9px] mb-1" style={{ color: 'var(--text3)' }}>Önem Derecesi</div>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3].map((level) => (
                                      <span key={level} className="w-2 h-2 rounded-full" style={{
                                        background: level <= (event.importance === 'critical' ? 3 : event.importance === 'high' ? 2 : event.importance === 'medium' ? 1 : 0)
                                          ? impColor : 'rgba(255,255,255,0.06)',
                                      }} />
                                    ))}
                                    <span className="text-[10px] ml-1" style={{ color: impColor }}>
                                      {IMPORTANCE_LABELS[event.importance]}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[9px] mb-1" style={{ color: 'var(--text3)' }}>UTC Saati</div>
                                  <div className="font-mono-price text-[11px]" style={{ color: 'var(--text2)' }} suppressHydrationWarning>
                                    {mounted ? new Date(event.eventDate).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }) : '--:--'}
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
