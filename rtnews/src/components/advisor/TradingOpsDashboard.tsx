// ─── Trading Operations Dashboard V341 ─────────────────────────
// غرفة عمليات المتداول — تصميم عرضي أفقي (4 بطاقات في صف واحد)
// Accepts `locale` prop — single component for all languages.
// Uses i18n/shared dictionary for all text labels.

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Globe,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Target,
  ChevronLeft,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { getSharedLabels } from '@/lib/i18n/shared';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface PriceItem {
  symbol: string;
  displaySymbol: string;
  changePercent: number;
  category: string;
}

interface CalendarEvent {
  id: string;
  event: string;
  eventAr: string;
  country: string;
  time: string;
  impactLevel: number;
  forecast: string;
  previous: string;
  currency: string;
  affectedAssets: { symbol: string; direction: string }[];
}

interface CouncilBrief {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  timeframe: string;
  analysisSummary?: string;
  issuedAt: string;
}

/* ═══════════════════════════════════════════════════════════════
   MARKET SESSIONS CONFIG
   ═══════════════════════════════════════════════════════════════ */

interface MarketSession {
  name: string;
  flag: string;
  open: number;
  close: number;
  color: string;
}

/* ═══════════════════════════════════════════════════════════════
   CURRENCY STRENGTH
   ═══════════════════════════════════════════════════════════════ */

const SYMBOL_PAIR_MAP: Record<string, { base: string; quote: string; invert: boolean }> = {
  'EUR': { base: 'EUR', quote: 'USD', invert: false },
  'GBP': { base: 'GBP', quote: 'USD', invert: false },
  'JPY': { base: 'USD', quote: 'JPY', invert: true },
  'CHF': { base: 'USD', quote: 'CHF', invert: true },
  'CAD': { base: 'USD', quote: 'CAD', invert: true },
  'AUD': { base: 'AUD', quote: 'USD', invert: false },
  'NZD': { base: 'NZD', quote: 'USD', invert: false },
};

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵',
  CHF: '🇨🇭', CAD: '🇨🇦', AUD: '🇦🇺', NZD: '🇳🇿',
};

function calculateCurrencyStrength(prices: PriceItem[], currencyCategory: string): { currency: string; strength: number; change: number; flag: string }[] {
  const changes: Record<string, number[]> = { USD: [] };

  for (const p of prices) {
    if (p.category !== currencyCategory) continue;
    const mapping = SYMBOL_PAIR_MAP[p.displaySymbol];
    if (mapping) {
      const change = mapping.invert ? -p.changePercent : p.changePercent;
      if (!changes[mapping.base]) changes[mapping.base] = [];
      changes[mapping.base].push(change);
      if (!changes[mapping.quote]) changes[mapping.quote] = [];
      changes[mapping.quote].push(-change);
    }
  }

  const avgChanges: Record<string, number> = {};
  for (const [cur, vals] of Object.entries(changes)) {
    avgChanges[cur] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  const usdBaseline = 50;
  const results = Object.entries(avgChanges).map(([currency, change]) => {
    const strength = Math.max(5, Math.min(100, Math.round(usdBaseline + change * 10)));
    return { currency, strength, change, flag: CURRENCY_FLAGS[currency] || '💱' };
  });

  return results.sort((a, b) => b.strength - a.strength);
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function isSessionOpen(session: MarketSession, utcHour: number): boolean {
  if (session.open < session.close) return utcHour >= session.open && utcHour < session.close;
  return utcHour >= session.open || utcHour < session.close;
}

function getTimeRemaining(session: MarketSession, utcHour: number, utcMin: number, L: Record<string, string>): string {
  const open = isSessionOpen(session, utcHour);
  if (open) {
    const closeMin = session.close * 60;
    const curMin = utcHour * 60 + utcMin;
    let rem = session.close > session.open ? closeMin - curMin : (utcHour >= session.open ? (24 * 60 - curMin) + closeMin : closeMin - curMin);
    if (rem < 0) rem += 24 * 60;
    const h = Math.floor(rem / 60), m = rem % 60;
    return h > 0 ? `${h}${L['ops.time.hour']} ${m}${L['ops.time.min']}` : `${m}${L['ops.time.min']}`;
  } else {
    const openMin = session.open * 60;
    const curMin = utcHour * 60 + utcMin;
    let rem = openMin - curMin;
    if (rem < 0) rem += 24 * 60;
    const h = Math.floor(rem / 60), m = rem % 60;
    return h > 0 ? `${h}${L['ops.time.hour']} ${m}${L['ops.time.min']}` : `${m}${L['ops.time.min']}`;
  }
}

function formatEventTime(dateStr: string): string {
  try { return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }); }
  catch { return '--:--'; }
}

function timeAgoBrief(dateStr: string, L: Record<string, string>): string {
  try {
    const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diffMin < 1) return L['ops.time.now'];
    if (diffMin < 60) return `${diffMin} ${L['ops.time.min']}`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ${L['ops.time.hour']}`;
    return `${Math.floor(diffHr / 24)} ${L['ops.time.day']}`;
  } catch { return ''; }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — Horizontal 4-column layout
   ═══════════════════════════════════════════════════════════════ */

interface TradingOpsDashboardProps {
  /** Locale code: 'ar' | 'en' | 'fr'. Defaults to 'ar'. */
  locale?: string;
}

export default function TradingOpsDashboard({ locale = 'ar' }: TradingOpsDashboardProps) {
  // ── i18n labels ──
  const L = getSharedLabels(locale);

  // Locale-aware link prefix
  const prefix = locale === 'ar' ? '/ar' : `/${locale}`;

  // Build MARKET_SESSIONS with locale-aware names
  const MARKET_SESSIONS: MarketSession[] = useMemo(() => [
    { name: L['ops.sessions.tokyo'], flag: '🇯🇵', open: 0, close: 9, color: '#3B82F6' },
    { name: L['ops.sessions.saudi'], flag: '🇸🇦', open: 7, close: 12, color: '#10B981' },
    { name: L['ops.sessions.london'], flag: '🇬🇧', open: 8, close: 17, color: '#D4AF37' },
    { name: L['ops.sessions.newyork'], flag: '🇺🇸', open: 13, close: 22, color: '#00E5FF' },
    { name: L['ops.sessions.sydney'], flag: '🇦🇺', open: 22, close: 7, color: '#8B5CF6' },
  ], [L]);

  // The category key used in the prices API for currencies
  // Data layer stores Arabic; English/French versions need to match the actual API data
  const CURRENCY_CATEGORY = locale === 'ar' ? 'عملات' : 'Currencies'; // matches API data key

  const [utcTime, setUtcTime] = useState('');
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [councilBriefs, setCouncilBriefs] = useState<CouncilBrief[]>([]);
  const [loading, setLoading] = useState(true);

  // UTC Clock
  useEffect(() => {
    const tick = () => { if (document.hidden) return; setUtcTime(new Date().toUTCString().slice(17, 25)); };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch all data
  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      try {
        const [pricesRes, calendarRes, councilRes] = await Promise.allSettled([
          fetch('/api/markets/prices', { signal: AbortSignal.timeout(10000) }),
          fetch('/api/markets/calendar', { signal: AbortSignal.timeout(10000) }),
          fetch('/api/integration/council?mode=briefs', { signal: AbortSignal.timeout(10000) }),
        ]);
        if (!cancelled) {
          if (pricesRes.status === 'fulfilled' && pricesRes.value.ok) {
            try { const d = await pricesRes.value.json(); if (d.prices) setPrices(d.prices); } catch {}
          }
          if (calendarRes.status === 'fulfilled' && calendarRes.value.ok) {
            try { const d = await calendarRes.value.json(); if (d.events) setCalendar(d.events); } catch {}
          }
          if (councilRes.status === 'fulfilled' && councilRes.value.ok) {
            try {
              const d = await councilRes.value.json();
              const list = d?.data?.active || d?.active || d?.data || [];
              if (Array.isArray(list)) setCouncilBriefs(list);
            } catch {}
          }
        }
      } catch (err) { console.error('[TradingOps] Fetch error:', err); }
      finally { if (!cancelled) setLoading(false); }
    }
    fetchAll();
    const interval = setInterval(() => { if (document.hidden) return; fetchAll(); }, 2 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Derived data
  const utcHour = new Date().getUTCHours();
  const utcMin = new Date().getUTCMinutes();

  const currencyStrength = useMemo(() => calculateCurrencyStrength(prices, CURRENCY_CATEGORY), [prices, CURRENCY_CATEGORY]);

  const mostVolatile = useMemo(() => {
    if (!currencyStrength.length) return null;
    return currencyStrength.reduce((a, b) => Math.abs(b.change) > Math.abs(a.change) ? b : a);
  }, [currencyStrength]);

  const todayEvents = useMemo(() => calendar.filter(e => e.impactLevel >= 2).slice(0, 5), [calendar]);
  const activeBriefs = useMemo(() => councilBriefs.slice(0, 3), [councilBriefs]);
  const criticalEvents = useMemo(() => calendar.filter(e => e.impactLevel >= 3).length, [calendar]);

  // Top 5 currencies for compact display
  const topCurrencies = useMemo(() => currencyStrength.slice(0, 5), [currencyStrength]);

  // Calendar event name helper (locale-aware)
  const eventName = (ev: CalendarEvent) => locale === 'ar' ? (ev.eventAr || ev.event) : ev.event;

  return (
    <div className="trading-ops-dashboard">
      {/* ═══ Quick Summary Strip ═══ */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 7,
          background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)',
          fontSize: 11, fontWeight: 600, color: 'var(--cyan)',
        }}>
          <Clock size={12} />
          <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', letterSpacing: 1 }}>{utcTime}</span>
          <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500 }}>UTC</span>
        </div>
        {criticalEvents > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 7,
            background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.2)',
            fontSize: 11, fontWeight: 600, color: '#EF5350',
          }}>
            <AlertTriangle size={12} />
            {criticalEvents} {L['ops.criticalEvents']}
          </div>
        )}
        {activeBriefs.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 7,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            fontSize: 11, fontWeight: 600, color: '#10B981',
          }}>
            <Target size={12} />
            {activeBriefs.length} {L['ops.activeSignals']}
          </div>
        )}
        {mostVolatile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 7,
            background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
            fontSize: 11, fontWeight: 600, color: '#D4AF37',
          }}>
            <Zap size={12} />
            {mostVolatile.flag} {mostVolatile.currency} {L['ops.mostVolatile']}
          </div>
        )}
      </div>

      {/* ═══ HORIZONTAL 4-CARD GRID ═══ */}
      <div className="ops-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>

        {/* ───── Card 1: Trading Sessions ───── */}
        <div className="glass-card" style={{ background: 'var(--bg2)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 12px 8px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--border)' }}>
            <Globe size={14} style={{ color: 'var(--cyan)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-head)' }}>{L['ops.sessions.heading']}</span>
          </div>
          <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {MARKET_SESSIONS.map(session => {
              const open = isSessionOpen(session, utcHour);
              return (
                <div key={session.name} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 7px', borderRadius: 6,
                  background: open ? `${session.color}08` : 'transparent',
                  border: `1px solid ${open ? `${session.color}20` : 'var(--border)'}`,
                  transition: 'all 0.3s',
                }}>
                  <span style={{ fontSize: 14 }}>{session.flag}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: open ? session.color : 'var(--text3)' }}>{session.name}</span>
                      {open ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 9, fontWeight: 700, color: '#22C55E' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 4px rgba(34,197,94,0.5)', animation: 'subtle-pulse 2s ease-in-out infinite' }} />
                          {L['ops.sessions.open']}
                        </span>
                      ) : (
                        <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text4)' }}>{L['ops.sessions.closed']}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1, display: 'flex', gap: 5, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                        {String(session.open).padStart(2, '0')}:00–{String(session.close).padStart(2, '0')}:00
                      </span>
                      <span style={{ color: open ? '#22C55E' : 'var(--text4)' }}>
                        {getTimeRemaining(session, utcHour, utcMin, L)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Mini visual timeline */}
            <div style={{ position: 'relative', height: 20, borderRadius: 4, background: 'var(--bg4)', overflow: 'hidden', marginTop: 2 }}>
              {MARKET_SESSIONS.map(session => {
                const open = isSessionOpen(session, utcHour);
                const leftPct = (session.open / 24) * 100;
                const widthPct = session.close > session.open ? ((session.close - session.open) / 24) * 100 : ((24 - session.open + session.close) / 24) * 100;
                return (
                  <div key={session.name} style={{
                    position: 'absolute', top: 2, bottom: 2,
                    left: `${leftPct}%`, width: `${widthPct}%`,
                    borderRadius: 2,
                    background: open ? `${session.color}35` : `${session.color}12`,
                    border: `1px solid ${open ? `${session.color}40` : `${session.color}15`}`,
                    transition: 'all 0.3s',
                  }} />
                );
              })}
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${((utcHour + utcMin / 60) / 24) * 100}%`,
                width: 2, background: '#EF5350',
                boxShadow: '0 0 4px rgba(239,83,80,0.5)', zIndex: 10,
              }} />
            </div>
          </div>
        </div>

        {/* ───── Card 2: Currency Strength ───── */}
        <div className="glass-card" style={{ background: 'var(--bg2)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 12px 8px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--border)' }}>
            <BarChart3 size={14} style={{ color: '#D4AF37' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-head)' }}>{L['ops.currency.heading']}</span>
            {mostVolatile && (
              <span style={{
                fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)',
              }}>
                {mostVolatile.currency} 🔥
              </span>
            )}
          </div>
          <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {topCurrencies.length > 0 ? topCurrencies.map(c => {
              const isStrong = c.strength >= 55;
              const isWeak = c.strength <= 45;
              const barColor = isStrong ? '#22C55E' : isWeak ? '#EF5350' : '#FFB800';
              const isVolatile = mostVolatile?.currency === c.currency;
              return (
                <div key={c.currency} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 6px', borderRadius: 6,
                  background: isVolatile ? 'rgba(212,175,55,0.04)' : 'transparent',
                  border: `1px solid ${isVolatile ? 'rgba(212,175,55,0.12)' : 'transparent'}`,
                }}>
                  <span style={{ fontSize: 12 }}>{c.flag}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace', minWidth: 26 }}>{c.currency}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg4)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${c.strength}%`, background: `linear-gradient(90deg, ${barColor}80, ${barColor})`, transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, minWidth: 22, textAlign: 'center', fontFamily: 'var(--font-jetbrains-mono), monospace', color: barColor }}>{c.strength}</span>
                  {c.change !== 0 && (
                    <span style={{ fontSize: 9, fontWeight: 700, minWidth: 36, textAlign: 'right', color: c.change > 0 ? '#22C55E' : '#EF5350', display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                      {c.change > 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                      {c.change > 0 ? '+' : ''}{c.change.toFixed(1)}%
                    </span>
                  )}
                </div>
              );
            }) : Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 6px' }}>
                <span style={{ fontSize: 12 }}>💱</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text4)', minWidth: 26 }}>---</span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg4)' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text4)', minWidth: 22 }}>--</span>
              </div>
            ))}
          </div>
        </div>

        {/* ───── Card 3: Economic Calendar ───── */}
        <div className="glass-card" style={{ background: 'var(--bg2)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} style={{ color: '#8B5CF6' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-head)' }}>{L['ops.calendar.heading']}</span>
            </div>
            <a href={`${prefix}/calendar`} style={{ fontSize: 9, fontWeight: 700, color: '#8B5CF6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              {L['ops.calendar.all']} <ChevronLeft size={10} />
            </a>
          </div>
          <div style={{ padding: '6px 8px', flex: 1, overflowY: 'auto', maxHeight: 240 }} className="custom-scrollbar">
            {todayEvents.length > 0 ? todayEvents.map((ev, i) => {
              const impactColor = ev.impactLevel >= 3 ? '#EF5350' : ev.impactLevel >= 2 ? '#FFB800' : 'var(--text4)';
              const impactLabel = ev.impactLevel >= 3 ? '🔥' : ev.impactLevel >= 2 ? '⚡' : '';
              return (
                <div key={ev.id || i} style={{
                  display: 'flex', gap: 6, padding: '6px 5px', borderRadius: 6,
                  background: i % 2 === 0 ? 'var(--bg4)' : 'transparent',
                  alignItems: 'center', borderInlineStart: `2px solid ${impactColor}`,
                  marginBottom: 2,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', minWidth: 34, fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                    {formatEventTime(ev.time)}
                  </span>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{ev.country}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {eventName(ev)}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 1, alignItems: 'center' }}>
                      <span style={{ fontSize: 8, color: impactColor, fontWeight: 700 }}>{impactLabel}</span>
                      {ev.forecast && <span style={{ fontSize: 8, color: 'var(--text3)' }}>{L['ops.calendar.forecast']}{ev.forecast}</span>}
                      {ev.affectedAssets?.slice(0, 1).map((a, j) => (
                        <span key={j} style={{
                          fontSize: 8, fontWeight: 700, padding: '0px 3px', borderRadius: 2,
                          background: a.direction === 'up' ? 'rgba(34,197,94,0.1)' : 'rgba(239,83,80,0.1)',
                          color: a.direction === 'up' ? '#22C55E' : '#EF5350',
                        }}>
                          {a.symbol} {a.direction === 'up' ? '↑' : '↓'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 10, fontWeight: 600 }}>
                {loading ? L['ops.calendar.loading'] : L['ops.calendar.empty']}
              </div>
            )}
          </div>
        </div>

        {/* ───── Card 4: Council Signals ───── */}
        <div className="glass-card" style={{ background: 'var(--bg2)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={14} style={{ color: '#10B981' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-head)' }}>{L['ops.signals.heading']}</span>
            </div>
            <a href={`${prefix}/signals`} style={{ fontSize: 9, fontWeight: 700, color: '#10B981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              {L['ops.signals.all']} <ChevronLeft size={10} />
            </a>
          </div>
          <div style={{ padding: '6px 8px', flex: 1, overflowY: 'auto', maxHeight: 240 }} className="custom-scrollbar">
            {activeBriefs.length > 0 ? activeBriefs.map(brief => {
              const isBuy = brief.direction === 'BUY';
              const dirColor = isBuy ? '#22C55E' : '#EF5350';
              const DirIcon = isBuy ? TrendingUp : TrendingDown;
              return (
                <div key={brief.id} style={{
                  padding: '8px 8px', borderRadius: 8,
                  background: 'var(--bg4)', border: `1px solid ${dirColor}15`,
                  borderInlineStart: `2px solid ${dirColor}`, marginBottom: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{brief.pair}</span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 2,
                        padding: '1px 5px', borderRadius: 4,
                        background: `${dirColor}15`, color: dirColor,
                        fontSize: 9, fontWeight: 700, border: `1px solid ${dirColor}25`,
                      }}>
                        <DirIcon size={9} />
                        {isBuy ? L['ops.signals.buy'] : L['ops.signals.sell']}
                      </span>
                    </div>
                    <span style={{ fontSize: 8, color: 'var(--text4)' }}>{timeAgoBrief(brief.issuedAt, L)}</span>
                  </div>
                  <div style={{
                    display: 'flex', gap: 8, flexWrap: 'wrap',
                    padding: '5px 7px', borderRadius: 4,
                    background: 'rgba(10,14,20,0.4)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 8, color: 'var(--text3)' }}>{L['ops.signals.entry']}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{brief.entryPrice}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 8, color: 'var(--text3)' }}>{L['ops.signals.target']}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{brief.takeProfit}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 8, color: 'var(--text3)' }}>{L['ops.signals.stop']}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#EF5350', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{brief.stopLoss}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
                      <span style={{ fontSize: 8, color: 'var(--text3)' }}>{L['ops.signals.confidence']}</span>
                      <div style={{ flex: 1, maxWidth: 60, height: 3, borderRadius: 2, background: 'var(--bg5)' }}>
                        <div style={{
                          width: `${brief.confidence}%`, height: '100%', borderRadius: 2,
                          background: brief.confidence >= 70 ? '#22C55E' : brief.confidence >= 50 ? '#FFB800' : '#EF5350',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{brief.confidence}%</span>
                    </div>
                    {brief.timeframe && (
                      <span style={{ fontSize: 8, fontWeight: 600, padding: '1px 4px', borderRadius: 3, background: 'var(--bg4)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                        {brief.timeframe}
                      </span>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 10, fontWeight: 600 }}>
                {loading ? L['ops.signals.loading'] : L['ops.signals.empty']}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
