'use client';

// ═══════════════════════════════════════════════════════════════════
// Shared Sidebar Widgets for News/Reports Pages
// Includes: Smart Council, Economic Calendar, Most Read
// Both Arabic and English variants
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

// ─── Theme Colors Hook ─────────────────────────────────────────
function useColors() {
  const { resolvedTheme } = useTheme();
  // Default to dark when theme is not yet resolved (SSR / hydration)
  const isDark = resolvedTheme !== 'light';
  return useMemo(() => ({
    cardBg: isDark ? '#0F1629' : '#FFFFFF',
    textPrimary: isDark ? '#E2E8F0' : '#1A1A2E',
    textSecondary: isDark ? '#94A3B8' : '#4A5568',
    textMuted: isDark ? '#64748B' : '#718096',
    border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    cyan: isDark ? '#00E5FF' : '#0891B2',
    cyanDim: isDark ? 'rgba(0,229,255,0.06)' : 'rgba(8,145,178,0.08)',
    cyanBorder: isDark ? 'rgba(0,229,255,0.15)' : 'rgba(8,145,178,0.2)',
    gold: isDark ? '#d4af37' : '#B8860B',
    goldDim: isDark ? 'rgba(212,175,55,0.06)' : 'rgba(184,134,11,0.06)',
    green: isDark ? '#10B981' : '#059669',
    red: isDark ? '#EF4444' : '#DC2626',
    inputBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    isDark,
  }), [isDark]);
}

// ─── SVG Icons ─────────────────────────────────────────────────
function CouncilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    US: '🇺🇸', EU: '🇪🇺', GB: '🇬🇧', JP: '🇯🇵', SA: '🇸🇦',
    AE: '🇦🇪', CN: '🇨🇳', OPEC: '🛢️', EG: '🇪🇬', DE: '🇩🇪',
    FR: '🇫🇷', AU: '🇦🇺', CA: '🇨🇦', CH: '🇨🇭', NZ: '🇳🇿',
  };
  return flags[country] || '🌍';
}

// ═══════════════════════════════════════════════════════════════════
// SMART COUNCIL WIDGET — Last 3 Recommendations
// ═══════════════════════════════════════════════════════════════════

interface CouncilBrief {
  pair: string;
  direction: 'BUY' | 'SELL' | 'HOLD';
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  confidence?: number;
  timeframe?: string;
  analysisSummary?: string;
  isActive?: boolean;
  consensus?: {
    totalModels?: number;
    buyVotes?: number;
    sellVotes?: number;
    neutralVotes?: number;
    modelVotes?: Array<{ name: string; nameEn: string; vote: string; confidence: number }>;
  };
}

interface SmartCouncilWidgetProps {
  locale: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function SmartCouncilWidget({ locale }: SmartCouncilWidgetProps) {
  const C = useColors();
  const [briefs, setBriefs] = useState<CouncilBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<string>('');
  const isAr = locale === 'ar';
  const isFr = locale === 'fr';
  const isTr = locale === 'tr';
  const isEs = locale === 'es';

  useEffect(() => {
    const fetchCouncil = async () => {
      try {
        const res = await fetch('/api/integration/council?mode=briefs');
        const data = await res.json();
        const activeBriefs = data?.data?.active || data?.active || [];
        setBriefs(activeBriefs.slice(0, 3));
        // Track data source for honest labeling
        setDataSource(data?.source || data?.data?.source || '');
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchCouncil();
    const interval = setInterval(fetchCouncil, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const directionColor = (dir: string) => {
    if (dir === 'BUY') return C.green;
    if (dir === 'SELL') return C.red;
    return C.gold;
  };

  const directionLabel = (dir: string) => {
    if (isAr) return dir === 'BUY' ? 'شراء' : dir === 'SELL' ? 'بيع' : 'انتظار';
    if (isFr) return dir === 'BUY' ? 'ACHAT' : dir === 'SELL' ? 'VENTE' : 'CONSERVE';
    if (isTr) return dir === 'BUY' ? 'AL' : dir === 'SELL' ? 'SAT' : 'BEKLE';
    if (isEs) return dir === 'BUY' ? 'COMPRA' : dir === 'SELL' ? 'VENTA' : 'MANTENER';
    return dir;
  };

  return (
    <div style={{
      background: C.cardBg, borderRadius: '14px',
      border: `1px solid ${C.border}`, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: C.goldDim, border: '1px solid rgba(212,175,55,0.2)',
          color: C.gold,
        }}>
          <CouncilIcon />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: C.textPrimary }}>
            {isAr ? 'المجلس الذكي' : isFr ? 'Conseil Intelligent' : isTr ? 'Akıllı Kurul' : isEs ? 'Consejo Inteligente' : 'Smart Council'}
          </h3>
          <p style={{ fontSize: '9px', color: C.textMuted }}>
            {dataSource === 'local-fallback'
              ? (isAr ? 'تحليل خوارزمي' : isFr ? 'Analyse algorithmique' : isTr ? 'Algoritmik analiz' : isEs ? 'Análisis algorítmico' : 'Algorithmic analysis')
              : (isAr ? 'توصيات استراتيجية فورية' : isFr ? 'Recommandations stratégiques instantanées' : isTr ? 'Anlık stratejik tavsiyeler' : isEs ? 'Recomendaciones estratégicas instantáneas' : 'Instant strategic recommendations')
            }
          </p>
          {dataSource === 'local-fallback' && (
            <span style={{
              fontSize: '8px', padding: '1px 5px', borderRadius: '3px',
              background: 'rgba(239,68,68,0.08)', color: C.textMuted,
              border: '1px solid rgba(239,68,68,0.15)', marginTop: '2px', display: 'inline-block',
            }}>
              {isAr ? 'تحليل محلي' : isFr ? 'Analyse locale' : isTr ? 'Yerel analiz' : isEs ? 'Análisis local' : 'Local analysis'}
            </span>
          )}
        </div>
        <Link href={isAr ? '/advisor' : isTr ? '/tr/advisor' : isFr ? '/fr/advisor' : isEs ? '/es/advisor' : '/en/advisor'} style={{ textDecoration: 'none' }}>
          <span style={{
            fontSize: '9px', padding: '3px 8px', borderRadius: '4px', fontWeight: 700,
            background: C.goldDim, color: C.gold, border: '1px solid rgba(212,175,55,0.2)',
            cursor: 'pointer',
          }}>
            {isAr ? 'الكل' : isFr ? 'Tout' : isTr ? 'Tümü' : isEs ? 'Todo' : 'All'}
          </span>
        </Link>
      </div>

      {/* Briefs List */}
      <div style={{ padding: '8px' }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: '8px', marginBottom: '4px', background: C.inputBg }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ width: '60px', height: '12px', borderRadius: '4px', background: C.border }} />
                <div style={{ width: '40px', height: '12px', borderRadius: '4px', background: C.border }} />
              </div>
              <div style={{ width: '80%', height: '10px', borderRadius: '4px', background: C.border }} />
            </div>
          ))
        ) : briefs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 12px' }}>
            <p style={{ fontSize: '12px', color: C.textMuted }}>
              {isAr ? 'لا توجد توصيات نشطة حالياً' : isFr ? 'Aucune recommandation active' : isTr ? 'Şu anda aktif tavsiye yok' : isEs ? 'Sin recomendaciones activas' : 'No active recommendations'}
            </p>
          </div>
        ) : (
          briefs.map((brief, idx) => (
            <div key={idx} style={{
              padding: '10px 12px', borderRadius: '8px', marginBottom: '4px',
              border: `1px solid ${C.border}`, background: 'transparent',
              transition: 'all 0.2s ease', cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.cyanDim; e.currentTarget.style.borderColor = C.cyanBorder; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: C.textPrimary, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                  {brief.pair}
                </span>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                  background: brief.direction === 'BUY' ? 'rgba(16,185,129,0.12)' : brief.direction === 'SELL' ? 'rgba(239,68,68,0.12)' : 'rgba(212,175,55,0.12)',
                  color: directionColor(brief.direction),
                }}>
                  {directionLabel(brief.direction)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px' }}>
                {brief.entryPrice != null && (
                  <div><span style={{ color: C.textMuted }}>{isAr ? 'دخول' : isFr ? 'Entrée' : isTr ? 'Giriş' : isEs ? 'Entrada' : 'Entry'} </span><span style={{ color: C.textSecondary, fontWeight: 600, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{brief.entryPrice}</span></div>
                )}
                {brief.takeProfit != null && (
                  <div><span style={{ color: C.textMuted }}>{isAr ? 'هدف' : isFr ? 'Objectif' : isTr ? 'Hedef' : isEs ? 'TP' : 'TP'} </span><span style={{ color: C.green, fontWeight: 600, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{brief.takeProfit}</span></div>
                )}
                {brief.stopLoss != null && (
                  <div><span style={{ color: C.textMuted }}>{isAr ? 'وقف' : isFr ? 'Stop' : isTr ? 'Zarar Durdur' : isEs ? 'SL' : 'SL'} </span><span style={{ color: C.red, fontWeight: 600, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{brief.stopLoss}</span></div>
                )}
              </div>
              {brief.confidence != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: C.inputBg, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${brief.confidence}%`, borderRadius: '2px', background: brief.confidence >= 70 ? C.green : brief.confidence >= 50 ? C.gold : C.red, transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: '9px', color: C.textMuted, fontWeight: 600, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{brief.confidence}%</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ECONOMIC CALENDAR WIDGET — Upcoming Events
// ═══════════════════════════════════════════════════════════════════

interface CalendarEvent {
  id?: string;
  eventName?: string;
  eventNameAr?: string;
  country: string;
  currency?: string;
  eventDate: string;
  importance: string;
  eventType?: string;
  forecast?: string;
  previous?: string;
  actual?: string | null;
  source?: string;
}

interface EconomicCalendarWidgetProps {
  locale: 'ar' | 'en' | 'fr' | 'tr' | 'es';
  limit?: number;
}

export function EconomicCalendarWidget({ locale, limit = 5 }: EconomicCalendarWidgetProps) {
  const C = useColors();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);
  const isAr = locale === 'ar';
  const isFr = locale === 'fr';
  const isTr = locale === 'tr';
  const isEs = locale === 'es';

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const res = await fetch('/api/economic-calendar?importance=high');
        const data = await res.json();
        const grouped = data?.events || {};
        const allEvents: CalendarEvent[] = [];
        for (const dayKey of Object.keys(grouped).sort()) {
          for (const evt of grouped[dayKey]) {
            allEvents.push(evt);
          }
        }
        const now = Date.now();
        const upcoming = allEvents.filter(e => new Date(e.eventDate).getTime() >= now - 3600000);
        setEvents(upcoming.slice(0, limit));
        setHasRealData(data?.hasRealData === true);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchCalendar();
    const interval = setInterval(fetchCalendar, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [limit]);

  const importanceColor = (imp: string) => {
    if (imp === 'critical') return C.red;
    if (imp === 'high') return C.gold;
    if (imp === 'medium') return C.cyan;
    return C.textMuted;
  };

  const formatEventTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isAr) return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      if (isFr) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      if (isTr) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      if (isEs) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return '--:--'; }
  };

  const formatEventDay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      if (d.toDateString() === today.toDateString()) return isAr ? 'اليوم' : isFr ? "Aujourd'hui" : isTr ? 'Bugün' : isEs ? 'Hoy' : 'Today';
      if (d.toDateString() === tomorrow.toDateString()) return isAr ? 'غداً' : isFr ? 'Demain' : isTr ? 'Yarın' : isEs ? 'Mañana' : 'Tomorrow';
      if (isAr) return d.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' });
      if (isFr) return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      if (isTr) return d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' });
      if (isEs) return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  return (
    <div style={{
      background: C.cardBg, borderRadius: '14px',
      border: `1px solid ${C.border}`, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: C.cyanDim, border: `1px solid ${C.cyanBorder}`,
          color: C.cyan,
        }}>
          <CalendarIcon />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: C.textPrimary }}>
            {isAr ? 'الأجندة الاقتصادية' : isFr ? 'Calendrier Économique' : isTr ? 'Ekonomik Takvim' : isEs ? 'Calendario Económico' : 'Economic Calendar'}
          </h3>
          <p style={{ fontSize: '9px', color: C.textMuted }}>
            {isAr ? 'أحداث مؤثرة قادمة' : isFr ? 'Événements à fort impact à venir' : isTr ? 'Yaklaşan yüksek etkili olaylar' : isEs ? 'Próximos eventos de alto impacto' : 'Upcoming high-impact events'}
          </p>
          {!hasRealData && events.length > 0 && (
            <span style={{
              fontSize: '8px', padding: '1px 5px', borderRadius: '3px',
              background: 'rgba(234,179,8,0.08)', color: C.textMuted,
              border: '1px solid rgba(234,179,8,0.15)', marginTop: '2px', display: 'inline-block',
            }}>
              {isAr ? 'بيانات مرجعية' : isFr ? 'Données de référence' : isTr ? 'Referans verileri' : isEs ? 'Datos de referencia' : 'Reference data'}
            </span>
          )}
        </div>
        <Link href={isAr ? '/economic-calendar' : isTr ? '/tr/economic-calendar' : isFr ? '/fr/calendar' : isEs ? '/es/economic-calendar' : '/en/economic-calendar'} style={{ textDecoration: 'none' }}>
          <span style={{
            fontSize: '9px', padding: '3px 8px', borderRadius: '4px', fontWeight: 700,
            background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}`,
            cursor: 'pointer',
          }}>
            {isAr ? 'الكل' : isFr ? 'Tout' : isTr ? 'Tümü' : isEs ? 'Todo' : 'All'}
          </span>
        </Link>
      </div>

      {/* Events List */}
      <div style={{ padding: '8px' }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: '8px', marginBottom: '4px', background: C.inputBg }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ width: '50px', height: '10px', borderRadius: '4px', background: C.border }} />
                <div style={{ width: '80px', height: '10px', borderRadius: '4px', background: C.border }} />
              </div>
              <div style={{ width: '70%', height: '10px', borderRadius: '4px', background: C.border }} />
            </div>
          ))
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 12px' }}>
            <p style={{ fontSize: '12px', color: C.textMuted }}>
              {isAr ? 'لا توجد أحداث اقتصادية قادمة' : isFr ? 'Aucun événement économique à venir' : isTr ? 'Yaklaşan ekonomik olay yok' : isEs ? 'Sin eventos económicos próximos' : 'No upcoming economic events'}
            </p>
          </div>
        ) : (
          events.map((evt, idx) => (
            <div key={evt.id || idx} style={{
              padding: '10px 12px', borderRadius: '8px', marginBottom: '4px',
              border: `1px solid ${C.border}`, background: 'transparent',
              transition: 'all 0.2s ease', cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.cyanDim; e.currentTarget.style.borderColor = C.cyanBorder; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px' }}>{getCountryFlag(evt.country)}</span>
                  <span style={{ fontSize: '10px', color: C.textMuted, fontWeight: 600, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                    {formatEventTime(evt.eventDate)}
                  </span>
                  <span style={{
                    fontSize: '9px', padding: '1px 6px', borderRadius: '4px',
                    background: evt.importance === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(212,175,55,0.1)',
                    color: importanceColor(evt.importance), fontWeight: 700,
                  }}>
                    {evt.importance === 'critical' ? (isAr ? 'حرج' : isFr ? 'Critique' : isTr ? 'Kritik' : isEs ? 'Crítico' : 'Critical') : isAr ? 'عالي' : isFr ? 'Élevé' : isTr ? 'Yüksek' : isEs ? 'Alto' : 'High'}
                  </span>
                </div>
                <span style={{ fontSize: '9px', color: C.textMuted }}>{formatEventDay(evt.eventDate)}</span>
              </div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: C.textPrimary, lineHeight: '1.5', marginBottom: '4px' }}>
                {isAr ? (evt.eventNameAr || evt.eventName) : evt.eventName}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '10px' }}>
                {evt.forecast && evt.forecast !== '-' && (
                  <div><span style={{ color: C.textMuted }}>{isAr ? 'توقع' : isFr ? 'Prévis.' : isTr ? 'Tahmin' : isEs ? 'Pron.' : 'Fcst'}: </span><span style={{ color: C.textSecondary, fontWeight: 600, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{evt.forecast}</span></div>
                )}
                {evt.previous && evt.previous !== '-' && (
                  <div><span style={{ color: C.textMuted }}>{isAr ? 'سابق' : isFr ? 'Préc.' : isTr ? 'Önceki' : isEs ? 'Ant.' : 'Prev'}: </span><span style={{ color: C.textMuted, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{evt.previous}</span></div>
                )}
                {evt.currency && (
                  <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: C.inputBg, color: C.textMuted, fontWeight: 600 }}>{evt.currency}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MOST READ WIDGET — Smart Trending Algorithm (V2)
// Uses /api/trending endpoint for dynamic, ever-changing results.
// Fallback: uses locale-specific /api/{locale}/news?sort=views
// Algorithm: trending_score = views * recency_decay * impact_bonus
// ═══════════════════════════════════════════════════════════════════

interface MostReadArticle {
  id: string;
  title: string;
  titleAr?: string;
  slug?: string;
  views: number;
  category?: string;
  publishedAt?: string | null;
  imageUrl?: string;
  trendingScore?: number;
}

interface MostReadWidgetProps {
  locale: 'ar' | 'en' | 'fr' | 'tr' | 'es';
  limit?: number;
}

function FireIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z" />
    </svg>
  );
}

export function MostReadWidget({ locale, limit = 5 }: MostReadWidgetProps) {
  const C = useColors();
  const [articles, setArticles] = useState<MostReadArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const isAr = locale === 'ar';
  const isFr = locale === 'fr';
  const isTr = locale === 'tr';
  const isEs = locale === 'es';

  useEffect(() => {
    const fetchMostRead = async () => {
      try {
        // V2: Use dedicated trending API with smart algorithm
        // This combines views + recency + impact for truly dynamic results
        const res = await fetch(`/api/trending?locale=${locale}&limit=${limit}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.articles) && data.articles.length > 0) {
            setArticles(data.articles.slice(0, limit));
            return;
          }
        }

        // Fallback: use locale-specific news API sorted by views
        const apiBase = isAr ? '/api/news' : isTr ? '/api/tr/news' : isFr ? '/api/fr/news' : isEs ? '/api/es/news' : '/api/en/news';
        const fallbackRes = await fetch(`${apiBase}?limit=${limit}&sort=views&order=desc`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const items = fallbackData?.news || fallbackData?.items || fallbackData || [];
          setArticles(Array.isArray(items) ? items.slice(0, limit) : []);
          return;
        }
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchMostRead();
    // Auto-refresh every 5 minutes to keep trending data fresh
    const interval = setInterval(fetchMostRead, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [locale, limit, isAr, isFr, isTr, isEs]);

  const medalColors = ['#FFB800', '#C0C0C0', '#CD7F32'];
  const medalBgs = ['rgba(255,184,0,0.1)', 'rgba(192,192,192,0.1)', 'rgba(205,127,50,0.1)'];

  const formatTimeAgo = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const now = Date.now();
      const then = new Date(dateStr).getTime();
      const diffMs = now - then;
      const diffM = Math.floor(diffMs / 60000);
      const diffH = Math.floor(diffMs / 3600000);
      if (isAr) {
        if (diffM < 60) return `منذ ${diffM} دقيقة`;
        if (diffH < 24) return `منذ ${diffH} ساعة`;
        return `منذ ${Math.floor(diffH / 24)} يوم`;
      }
      if (isTr) {
        if (diffM < 60) return `${diffM} dk önce`;
        if (diffH < 24) return `${diffH} saat önce`;
        return `${Math.floor(diffH / 24)} gün önce`;
      }
      if (isFr) {
        if (diffM < 60) return `il y a ${diffM} min`;
        if (diffH < 24) return `il y a ${diffH}h`;
        return `il y a ${Math.floor(diffH / 24)}j`;
      }
      if (isEs) {
        if (diffM < 60) return `hace ${diffM} min`;
        if (diffH < 24) return `hace ${diffH}h`;
        return `hace ${Math.floor(diffH / 24)}d`;
      }
      if (diffM < 60) return `${diffM}m ago`;
      if (diffH < 24) return `${diffH}h ago`;
      return `${Math.floor(diffH / 24)}d ago`;
    } catch { return ''; }
  };

  return (
    <div style={{
      background: C.cardBg, borderRadius: '14px',
      border: `1px solid ${C.border}`, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)',
          color: '#FFB800',
        }}>
          <FireIcon />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: C.textPrimary }}>
            {isAr ? 'الأكثر قراءة' : isFr ? 'Les Plus Lus' : isTr ? 'En Çok Okunanlar' : isEs ? 'Más Leídas' : 'Most Read'}
          </h3>
          <p style={{ fontSize: '9px', color: C.textMuted }}>
            {isAr ? 'أخبار رائجة الآن' : isFr ? 'Articles tendance du moment' : isTr ? 'Şu an trend olan haberler' : isEs ? 'Artículos en tendencia ahora' : 'Trending articles now'}
          </p>
        </div>
        <Link href={isAr ? '/news' : isTr ? '/tr/news' : isFr ? '/fr/news' : isEs ? '/es/news' : '/en/news'} style={{ textDecoration: 'none' }}>
          <span style={{
            fontSize: '9px', padding: '3px 8px', borderRadius: '4px', fontWeight: 700,
            background: 'rgba(255,184,0,0.06)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.15)',
            cursor: 'pointer',
          }}>
            {isAr ? 'الكل' : isFr ? 'Tout' : isTr ? 'Tümü' : isEs ? 'Todo' : 'All'}
          </span>
        </Link>
      </div>

      {/* Articles List */}
      <div style={{ padding: '8px' }}>
        {loading ? (
          Array.from({ length: limit > 5 ? 5 : limit }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 12px', borderRadius: '8px', marginBottom: '4px', background: C.inputBg }}>
              <div style={{ width: '26px', height: '12px', borderRadius: '4px', background: C.border }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '90%', height: '10px', borderRadius: '4px', background: C.border, marginBottom: '4px' }} />
                <div style={{ width: '50%', height: '8px', borderRadius: '4px', background: C.border }} />
              </div>
            </div>
          ))
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 12px' }}>
            <p style={{ fontSize: '12px', color: C.textMuted }}>
              {isAr ? 'لا توجد أخبار رائجة حالياً' : isFr ? 'Aucun article tendance' : isTr ? 'Şu an trend haber yok' : isEs ? 'Sin artículos en tendencia' : 'No trending articles'}
            </p>
          </div>
        ) : (
          articles.map((article, idx) => {
            const articleTitle = isAr ? (article.titleAr || article.title) : article.title;
            const articleSlug = article.slug || article.id;
            const basePath = isAr ? '/news' : isTr ? '/tr/news' : isFr ? '/fr/news' : isEs ? '/es/news' : '/en/news';
            const timeAgo = formatTimeAgo(article.publishedAt);
            return (
              <Link key={article.id} href={`${basePath}/${articleSlug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '10px 12px', borderRadius: '8px', marginBottom: '4px',
                  transition: 'all 0.2s ease', cursor: 'pointer',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.cyanDim; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: idx < 3 ? medalBgs[idx] : 'rgba(100,116,139,0.08)',
                    color: idx < 3 ? medalColors[idx] : C.textMuted,
                    fontSize: '11px', fontWeight: 700,
                    fontFamily: 'var(--font-jetbrains-mono, monospace)',
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{
                      fontSize: '12px', fontWeight: 600, color: C.textPrimary, lineHeight: '1.6',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {articleTitle}
                    </h5>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      {article.views > 0 && (
                        <span style={{ fontSize: '9px', color: C.textMuted, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                          {article.views >= 1000 ? `${(article.views / 1000).toFixed(1)}K` : article.views} {isAr ? 'قراءة' : isFr ? 'lectures' : isTr ? 'okuma' : isEs ? 'lecturas' : 'reads'}
                        </span>
                      )}
                      {timeAgo && (
                        <span style={{ fontSize: '9px', color: C.textMuted, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                          {timeAgo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
