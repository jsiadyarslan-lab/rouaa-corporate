'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import MarketsSentiment from '@/components/rouaa/MarketsSentiment';
import MiniSparkline from '@/components/rouaa/charts/MiniSparkline';

// Dynamic imports for below-fold sections
const ArabMarkets = dynamic(() => import('@/components/rouaa/ArabMarkets'), {
  loading: () => <div className="section-block"><div className="max-w-7xl mx-auto px-4"><div className="skeleton" style={{ height: '300px', borderRadius: 'var(--r2)' }} /></div></div>,
});
const CommoditiesSection = dynamic(() => import('@/components/rouaa/CommoditiesSection'), {
  loading: () => <div className="section-block"><div className="max-w-7xl mx-auto px-4"><div className="skeleton" style={{ height: '200px', borderRadius: 'var(--r2)' }} /></div></div>,
});
const ForexSection = dynamic(() => import('@/components/rouaa/ForexSection'), {
  loading: () => <div className="section-block"><div className="max-w-7xl mx-auto px-4"><div className="skeleton" style={{ height: '200px', borderRadius: 'var(--r2)' }} /></div></div>,
});
const PlatformChart = dynamic(() => import('@/components/rouaa/charts/PlatformChart'), {
  ssr: false,
  loading: () => <div className="section-block"><div className="max-w-7xl mx-auto px-4"><div className="skeleton" style={{ height: '500px', borderRadius: 'var(--r2)' }} /></div></div>,
});

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */
interface AssetPrice {
  symbol: string;
  displaySymbol: string;
  nameAr: string;
  nameEn?: string;
  nameEs?: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  category: string;
  categoryEn?: string;
  categoryEs?: string;
  decimals: number;
  source?: string;
}

type MarketTabId = 'overview' | 'movers' | 'arab' | 'chart' | 'commodities' | 'forex' | 'crypto';
type MoverFilter = 'gainers' | 'losers' | 'active';
type ViewMode = 'cards' | 'table';

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS — Spanish labels
   ═══════════════════════════════════════════════════════════════════ */
const MARKET_TABS: { id: MarketTabId; label: string; icon: React.JSX.Element }[] = [
  {
    id: 'overview',
    label: 'Resumen',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  },
  {
    id: 'movers',
    label: 'Movimientos',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  },
  {
    id: 'arab',
    label: 'Mercados LatAm',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  },
  {
    id: 'chart',
    label: 'Gráficos',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 5-9"/></svg>,
  },
  {
    id: 'commodities',
    label: 'Materias Primas',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  },
  {
    id: 'forex',
    label: 'Forex',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  },
  {
    id: 'crypto',
    label: 'Cripto',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 21.75m4.908-2.661c-4.924-.869-6.14 6.025-1.216 6.894m1.216-6.894l7.122-2.661M11.767 4.911c4.924-.869 6.14 6.025 1.216 6.894m-1.216-6.894L4.645 7.572m7.122-2.661c-4.924.868-6.14-6.025-1.216-6.894m1.216 6.894l7.122 2.661"/></svg>,
  },
];

// Hero index cards — Latin American market focus
const HERO_INDICES = [
  { symbol: 'IBEX', label: 'IBEX 35', icon: '🇪🇸', color: '#EF4444' },
  { symbol: 'BOVESPA', label: 'Bovespa', icon: '🇧🇷', color: '#22C55E' },
  { symbol: 'USDMXN', label: 'USD/MXN', icon: '🇲🇽', color: '#F59E0B' },
  { symbol: 'XAU', label: 'Oro', icon: '🥇', color: '#F59E0B' },
  { symbol: 'WTI', label: 'Petróleo Crudo', icon: '🛢️', color: '#EF4444' },
  { symbol: 'BTC', label: 'Bitcoin', icon: '₿', color: '#F7931A' },
  { symbol: 'EUR', label: 'EUR/USD', icon: '🇪🇺', color: '#3B82F6' },
  { symbol: 'SPX', label: 'S&P 500', icon: '📊', color: '#6366F1' },
];

// Popular chart symbols with Spanish names
const CHART_SYMBOLS = [
  { symbol: 'IBEX', nameEs: 'IBEX 35' },
  { symbol: 'USDMXN', nameEs: 'USD/MXN' },
  { symbol: 'XAU', nameEs: 'Oro' },
  { symbol: 'WTI', nameEs: 'Petróleo Crudo' },
  { symbol: 'BTC', nameEs: 'Bitcoin' },
  { symbol: 'EUR', nameEs: 'EUR/USD' },
  { symbol: 'BOVESPA', nameEs: 'Bovespa' },
];

/* ═══════════════════════════════════════════════════════════════════
   CATEGORY MAPPING — Arabic-to-Spanish for DB data compatibility
   ═══════════════════════════════════════════════════════════════════ */
const CATEGORY_AR_TO_ES: Record<string, string> = {
  'أسهم': 'Acciones',
  'عملات': 'Forex',
  'كريبتو': 'Cripto',
  'سلع': 'Materias Primas',
  'طاقة': 'Energía',
};

/* ═══════════════════════════════════════════════════════════════════
   HELPER — Get Spanish display name
   ═══════════════════════════════════════════════════════════════════ */
function getEsName(a: AssetPrice): string {
  return a.nameEs || a.nameEn || a.nameAr;
}

function getEsCategory(a: AssetPrice): string {
  if (a.categoryEs) return a.categoryEs;
  if (a.categoryEn) return a.categoryEn;  // fallback to English
  return CATEGORY_AR_TO_ES[a.category] || a.category;
}

/* ═══════════════════════════════════════════════════════════════════
   HEATMAP CELL — Sector/Asset performance visualization
   ═══════════════════════════════════════════════════════════════════ */
interface HeatmapItem {
  symbol: string;
  nameEs: string;
  changePercent: number;
  categoryEs: string;
}

function MarketHeatmap({ items }: { items: HeatmapItem[] }) {
  if (items.length === 0) {
    return (
      <div className="glass-card p-8 text-center" style={{ borderRadius: 'var(--r2)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        <p style={{ color: 'var(--text3)', fontSize: 12 }}>Datos insuficientes para el mapa de calor</p>
      </div>
    );
  }

  // Group by category
  const categories = [...new Set(items.map(i => i.categoryEs))];
  const grouped = categories.map(cat => ({
    categoryEs: cat,
    items: items.filter(i => i.categoryEs === cat),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {grouped.map(group => (
        <div key={group.categoryEs}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 3, paddingLeft: 4 }}>
            {group.categoryEs}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 3 }}>
            {group.items.map(item => {
              const pct = item.changePercent ?? 0;
              const intensity = Math.min(Math.abs(pct) / 3, 1);
              const bg = pct >= 0
                ? `rgba(34,197,94,${0.08 + intensity * 0.22})`
                : `rgba(239,83,80,${0.08 + intensity * 0.22})`;
              const border = pct >= 0
                ? `1px solid rgba(34,197,94,${0.12 + intensity * 0.2})`
                : `1px solid rgba(239,83,80,${0.12 + intensity * 0.2})`;

              return (
                <div
                  key={item.symbol}
                  className="transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                  style={{
                    background: bg,
                    border,
                    borderRadius: 'var(--r)',
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 52,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-head)' }}>{item.symbol}</div>
                  <div style={{ fontSize: 8, color: 'var(--text3)', lineHeight: 1.3, textAlign: 'center', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{item.nameEs}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: pct >= 0 ? 'var(--bull)' : 'var(--bear)', marginTop: 1 }}>
                    {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MARKET MOVERS — Top Gainers / Losers / Most Active
   ═══════════════════════════════════════════════════════════════════ */
function MarketMovers({ assets, loading }: { assets: AssetPrice[]; loading: boolean }) {
  const [moverFilter, setMoverFilter] = useState<MoverFilter>('gainers');

  const sorted = useMemo(() => {
    if (loading) return [];
    const valid = assets.filter(a => a.price && a.price > 0 && a.changePercent != null);
    if (moverFilter === 'gainers') return [...valid].sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0)).slice(0, 8);
    if (moverFilter === 'losers') return [...valid].sort((a, b) => (a.changePercent ?? 0) - (b.changePercent ?? 0)).slice(0, 8);
    // 'active' — sorted by absolute change
    return [...valid].sort((a, b) => Math.abs(b.changePercent ?? 0) - Math.abs(a.changePercent ?? 0)).slice(0, 8);
  }, [assets, moverFilter, loading]);

  const MOVER_TABS: { id: MoverFilter; label: string; color: string }[] = [
    { id: 'gainers', label: 'Alcistas', color: 'var(--bull)' },
    { id: 'losers', label: 'Bajistas', color: 'var(--bear)' },
    { id: 'active', label: 'Más Activos', color: 'var(--cyan)' },
  ];

  return (
    <div className="glass-card" style={{ borderRadius: 'var(--r2)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 'var(--r)', background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>Movimientos del Mercado</span>
        </div>
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg4)', borderRadius: 'var(--r)', padding: 2 }}>
          {MOVER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setMoverFilter(tab.id)}
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: 'calc(var(--r) - 2px)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: moverFilter === tab.id ? 'var(--bg3)' : 'transparent',
                color: moverFilter === tab.id ? tab.color : 'var(--text3)',
                boxShadow: moverFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 12px 12px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 36, borderRadius: 'var(--r)' }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 12 }}>
            No hay datos disponibles en este momento
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sorted.map((asset, idx) => {
              const isUp = (asset.changePercent ?? 0) >= 0;
              return (
                <div
                  key={asset.symbol}
                  className="transition-all duration-150"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--r)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--cyan3)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text4)', width: 16, textAlign: 'center' }}>{idx + 1}</span>
                    <div>
                      <span className="font-mono-price" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-head)' }}>{asset.displaySymbol}</span>
                      <span style={{ fontSize: 10, color: 'var(--text3)', marginInlineStart: 6 }}>{getEsName(asset)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="font-mono-price" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }} suppressHydrationWarning>
                      {(asset.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: asset.decimals || 2 })}
                    </span>
                    <span
                      className="font-mono-price"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: isUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,83,80,0.1)',
                        color: isUp ? 'var(--bull)' : 'var(--bear)',
                        minWidth: 60,
                        textAlign: 'center',
                      }}
                      suppressHydrationWarning
                    >
                      {isUp ? '+' : ''}{(asset.changePercent ?? 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SEARCH BAR — Asset search (Spanish)
   ═══════════════════════════════════════════════════════════════════ */
function MarketSearchBar({ assets, onSelect }: { assets: AssetPrice[]; onSelect: (symbol: string) => void }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return assets
      .filter(a =>
        a.symbol.toLowerCase().includes(q) ||
        a.displaySymbol.toLowerCase().includes(q) ||
        (a.nameEs && a.nameEs.toLowerCase().includes(q)) ||
        a.nameAr.includes(query.trim())
      )
      .slice(0, 6);
  }, [query, assets]);

  return (
    <div className="relative flex-1 max-w-full md:max-w-[360px]">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: focused ? 'var(--bg3)' : 'var(--bg4)',
        border: `1px solid ${focused ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--r2)',
        padding: '6px 12px',
        transition: 'all 0.2s ease',
        boxShadow: focused ? '0 0 0 3px rgba(0,229,255,0.08)' : 'none',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Buscar activos..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 12,
            color: 'var(--text)',
            fontFamily: 'inherit',
          }}
        />
        {query && (
          <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}
      </div>
      {focused && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 50,
          marginTop: 4,
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          {results.map(asset => {
            const isUp = (asset.changePercent ?? 0) >= 0;
            return (
              <button
                key={asset.symbol}
                onClick={() => { onSelect(asset.symbol); setQuery(''); setFocused(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  textAlign: 'left' as const,
                  direction: 'ltr' as const,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--cyan3)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="font-mono-price" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-head)' }}>{asset.displaySymbol}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{getEsName(asset)}</span>
                </div>
                <span className="font-mono-price" style={{ fontSize: 11, fontWeight: 700, color: isUp ? 'var(--bull)' : 'var(--bear)' }} suppressHydrationWarning>
                  {isUp ? '+' : ''}{(asset.changePercent ?? 0).toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function EsMarketsPageClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<MarketTabId>(tabParam === 'arab' ? 'arab' : 'overview');
  const [quickStats, setQuickStats] = useState<AssetPrice[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedChartSymbol, setSelectedChartSymbol] = useState('BTC');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Fetch all asset prices
  const fetchQuickStats = useCallback(async () => {
    try {
      const [tpRes, priceRes] = await Promise.allSettled([
        fetch('/api/markets/integration?mode=quotes', { cache: 'no-store', signal: AbortSignal.timeout(15_000) }),
        fetch('/api/markets/prices', { cache: 'no-store', signal: AbortSignal.timeout(15_000) }),
      ]);

      const tpData = tpRes.status === 'fulfilled' && tpRes.value.ok
        ? await tpRes.value.json()
        : { quotes: {} };

      const priceData = priceRes.status === 'fulfilled' && priceRes.value.ok
        ? await priceRes.value.json()
        : { prices: [] };

      const tpSymbolMap: Record<string, { displaySymbol: string; nameEs: string; categoryEs: string; decimals: number }> = {
        'BTC-USDT': { displaySymbol: 'BTC/USD', nameEs: 'Bitcoin', categoryEs: 'Cripto', decimals: 2 },
        'ETH-USDT': { displaySymbol: 'ETH/USD', nameEs: 'Ethereum', categoryEs: 'Cripto', decimals: 2 },
        'XAU-USD': { displaySymbol: 'XAU/USD', nameEs: 'Oro', categoryEs: 'Materias Primas', decimals: 2 },
        'CL-USD': { displaySymbol: 'WTI', nameEs: 'Petróleo Crudo', categoryEs: 'Energía', decimals: 2 },
        'EUR-USD': { displaySymbol: 'EUR/USD', nameEs: 'EUR/USD', categoryEs: 'Forex', decimals: 4 },
        'GBP-USD': { displaySymbol: 'GBP/USD', nameEs: 'GBP/USD', categoryEs: 'Forex', decimals: 4 },
        'SOL-USDT': { displaySymbol: 'SOL/USD', nameEs: 'Solana', categoryEs: 'Cripto', decimals: 2 },
      };

      const tpStats: AssetPrice[] = [];
      const shortSymbolMap: Record<string, string> = {
        'BTC-USDT': 'BTC', 'ETH-USDT': 'ETH', 'XAU-USD': 'XAU',
        'CL-USD': 'WTI', 'EUR-USD': 'EUR', 'GBP-USD': 'GBP',
        'SOL-USDT': 'SOL', 'DXY-USD': 'DXY',
      };

      for (const [tpSym, quote] of Object.entries(tpData.quotes || {})) {
        const q = quote as any;
        const meta = tpSymbolMap[tpSym];
        const shortSym = shortSymbolMap[tpSym] || tpSym;
        if (q && q.price > 0) {
          tpStats.push({
            symbol: shortSym,
            displaySymbol: meta?.displaySymbol || tpSym,
            nameAr: tpSym,
            nameEs: meta?.nameEs || tpSym,
            price: q.price,
            change: q.change || 0,
            changePercent: q.changePercent || 0,
            category: meta?.categoryEs || 'Mercados',
            categoryEs: meta?.categoryEs || 'Mercados',
            decimals: meta?.decimals || 2,
            source: 'live',
          });
        }
      }

      const tpSymbols = new Set(tpStats.map(s => s.symbol));
      const externalPrices = (priceData.prices || []).filter(
        (p: AssetPrice) => !tpSymbols.has(p.symbol)
      );

      const allStats = [...tpStats, ...externalPrices];
      if (allStats.length > 0) {
        setQuickStats(allStats);
      }
    } catch {
      // Silent
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuickStats();
    const interval = setInterval(fetchQuickStats, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchQuickStats]);

  const getQuickStatPrice = (symbol: string) => quickStats.find((p: AssetPrice) => p.symbol === symbol);

  // Heatmap data derived from quickStats — use Spanish names
  const heatmapItems = useMemo<HeatmapItem[]>(() => {
    return quickStats
      .filter(a => a.changePercent != null && a.price && a.price > 0)
      .map(a => ({
        symbol: a.displaySymbol,
        nameEs: getEsName(a),
        changePercent: a.changePercent ?? 0,
        categoryEs: getEsCategory(a),
      }));
  }, [quickStats]);

  // Handle search selection — switch to chart tab
  const handleSearchSelect = useCallback((symbol: string) => {
    setSelectedChartSymbol(symbol);
    setActiveTab('chart');
  }, []);

  return (
    <main className="min-h-screen pb-mobile-safe" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="pt-4">
        {/* ═══════════════════════════════════════════════════════════
            PAGE HEADER — Title + Search + View Toggle
            ═══════════════════════════════════════════════════════════ */}
        <div className="max-w-7xl mx-auto px-4 mb-3" style={{ paddingInline: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 className="font-heading" style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, color: 'var(--text-head)' }}>
                Centro de Mercados
              </h1>
              <span className="badge-live" style={{ fontSize: 9 }}>
                <span className="live-dot" />
                LIVE
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <MarketSearchBar assets={quickStats} onSelect={handleSearchSelect} />
              {/* View Toggle */}
              <div style={{ display: 'flex', background: 'var(--bg4)', borderRadius: 'var(--r)', padding: 2, gap: 1 }}>
                <button
                  onClick={() => setViewMode('cards')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'calc(var(--r) - 2px)',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === 'cards' ? 'var(--bg3)' : 'transparent',
                    color: viewMode === 'cards' ? 'var(--cyan)' : 'var(--text3)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                  }}
                  aria-label="Vista tarjetas"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  Tarjetas
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'calc(var(--r) - 2px)',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === 'table' ? 'var(--bg3)' : 'transparent',
                    color: viewMode === 'table' ? 'var(--cyan)' : 'var(--text3)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                  }}
                  aria-label="Vista tabla"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                  Tabla
                </button>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              HERO INDICES — Key market stats at a glance
              ═══════════════════════════════════════════════════════════ */}
          <div className="market-hero-stats">
            {HERO_INDICES.map((idx) => {
              const stat = getQuickStatPrice(idx.symbol);
              const isUp = stat ? (stat.changePercent ?? 0) >= 0 : true;
              return (
                <div key={idx.symbol} className="market-hero-stat-card">
                  <div className="market-hero-stat-header">
                    <span className="market-hero-stat-icon" style={{ background: `${idx.color}12`, color: idx.color }}>{idx.icon}</span>
                    <span className="market-hero-stat-label">{idx.label}</span>
                  </div>
                  {statsLoading ? (
                    <div className="skeleton" style={{ height: '18px', width: '70%', margin: '4px 0 2px' }} />
                  ) : stat ? (
                    <>
                      <div className="market-hero-stat-price" suppressHydrationWarning>
                        {(stat.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: stat.decimals || 2 })}
                      </div>
                      <div className="market-hero-stat-change" style={{ color: isUp ? 'var(--bull)' : 'var(--bear)' }} suppressHydrationWarning>
                        <span style={{ fontSize: 9 }}>{isUp ? '▲' : '▼'}</span>
                        <span>{Math.abs(stat.changePercent ?? 0).toFixed(2)}%</span>
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>—</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════════════════════════
              MODERN TABS — With icons and active indicator
              ═══════════════════════════════════════════════════════════ */}
          <div className="market-tabs-container">
            {MARKET_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`market-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span className="market-tab-icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            TAB CONTENT
            ═══════════════════════════════════════════════════════════ */}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Heatmap + Market Movers Row */}
            <div className="max-w-7xl mx-auto px-4 mb-4" style={{ paddingInline: 'var(--space-md)' }}>
              <div className="market-overview-grid">
                {/* Heatmap */}
                <div className="glass-card" style={{ borderRadius: 'var(--r2)', border: '1px solid var(--border)', padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 'var(--r)', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)' }}>Mapa de Calor del Mercado</span>
                  </div>
                  <MarketHeatmap items={heatmapItems} />
                </div>
                {/* Market Movers */}
                <MarketMovers assets={quickStats} loading={statsLoading} />
              </div>
            </div>

            {/* Sentiment */}
            <MarketsSentiment locale="es" />

            {/* Arab Markets */}
            <ArabMarkets locale="es" />

            {/* Live Chart on overview */}
            <div className="section-block">
              <div className="max-w-7xl mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
                <div className="sh">
                  <div className="sh-title">Gráfico en Vivo</div>
                  <span className="badge-live"><span className="live-dot" />EN VIVO</span>
                </div>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {CHART_SYMBOLS.slice(0, 5).map((cs) => (
                    <button
                      key={cs.symbol}
                      onClick={() => setSelectedChartSymbol(cs.symbol)}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                      style={{
                        background: selectedChartSymbol === cs.symbol ? 'var(--cyan)' : 'var(--bg4)',
                        color: selectedChartSymbol === cs.symbol ? 'white' : 'var(--text3)',
                        border: `1px solid ${selectedChartSymbol === cs.symbol ? 'var(--cyan)' : 'var(--border)'}`,
                      }}
                    >
                      {cs.nameEs}
                    </button>
                  ))}
                </div>
                <PlatformChart
                  symbol={selectedChartSymbol}
                  nameAr={CHART_SYMBOLS.find(c => c.symbol === selectedChartSymbol)?.nameEs}
                  locale="es"
                  height={420}
                  showVolume={true}
                  showToolbar={true}
                />
              </div>
            </div>
            <CommoditiesSection locale="es" />
            <ForexSection locale="es" />
          </>
        )}

        {/* MOVERS TAB */}
        {activeTab === 'movers' && (
          <div className="max-w-7xl mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-sm)] movers-grid">
              <div>
                <MarketMovers assets={quickStats} loading={statsLoading} />
              </div>
              <div>
                <div className="glass-card" style={{ borderRadius: 'var(--r2)', border: '1px solid var(--border)', padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 'var(--r)', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)' }}>Mapa de Calor del Mercado</span>
                  </div>
                  <MarketHeatmap items={heatmapItems} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ARAB MARKETS TAB */}
        {activeTab === 'arab' && (
          <>
            <MarketsSentiment locale="es" />
            <ArabMarkets locale="es" />
          </>
        )}

        {/* CHART TAB */}
        {activeTab === 'chart' && (
          <div className="section-block">
            <div className="max-w-7xl mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
              <div className="sh">
                <div className="sh-title">Gráficos en Vivo</div>
                <span className="badge-live"><span className="live-dot" />EN VIVO</span>
              </div>
              <p className="text-[13px] mb-4" style={{ color: 'var(--text2)' }}>
                Datos en vivo de la plataforma Rouaa — velas japonesas profesionales
              </p>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {CHART_SYMBOLS.map((cs) => (
                  <button
                    key={cs.symbol}
                    onClick={() => setSelectedChartSymbol(cs.symbol)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                    style={{
                      background: selectedChartSymbol === cs.symbol ? 'var(--cyan)' : 'var(--bg4)',
                      color: selectedChartSymbol === cs.symbol ? 'white' : 'var(--text3)',
                      border: `1px solid ${selectedChartSymbol === cs.symbol ? 'var(--cyan)' : 'var(--border)'}`,
                    }}
                  >
                    {cs.nameEs}
                  </button>
                ))}
              </div>
              <PlatformChart
                symbol={selectedChartSymbol}
                nameAr={CHART_SYMBOLS.find(c => c.symbol === selectedChartSymbol)?.nameEs}
                locale="es"
                height={500}
                showVolume={true}
                showToolbar={true}
              />
            </div>
          </div>
        )}

        {/* COMMODITIES TAB */}
        {activeTab === 'commodities' && (
          <CommoditiesSection locale="es" />
        )}

        {/* FOREX TAB */}
        {activeTab === 'forex' && (
          <ForexSection locale="es" />
        )}

        {/* CRYPTO TAB */}
        {activeTab === 'crypto' && (
          <EsCryptoSection />
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE STYLES
          ═══════════════════════════════════════════════════════════ */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Hero Stats Grid */
        .market-hero-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 12px;
        }
        @media (max-width: 768px) {
          .market-hero-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .market-hero-stat-card {
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: var(--r2);
          padding: 10px 12px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .market-hero-stat-card:hover {
          border-color: rgba(0,229,255,0.15);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .market-hero-stat-header {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 4px;
        }
        .market-hero-stat-icon {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }
        .market-hero-stat-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text3);
        }
        .market-hero-stat-price {
          font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
          font-size: 15px;
          font-weight: 700;
          color: var(--text-head);
          line-height: 1.2;
        }
        .market-hero-stat-change {
          display: flex;
          align-items: center;
          gap: 3px;
          font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
        }

        /* Modern Tabs */
        .market-tabs-container {
          display: flex;
          align-items: center;
          gap: 2px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .market-tabs-container::-webkit-scrollbar { display: none; }
        .market-tab {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px 14px;
          border-radius: var(--r2);
          border: 1px solid transparent;
          background: transparent;
          color: var(--text3);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          font-family: inherit;
        }
        .market-tab:hover {
          color: var(--text2);
          background: var(--bg4);
        }
        .market-tab.active {
          color: var(--cyan);
          background: var(--cyan2);
          border-color: rgba(0,229,255,0.12);
        }
        .market-tab-icon {
          display: flex;
          align-items: center;
          opacity: 0.7;
        }
        .market-tab.active .market-tab-icon {
          opacity: 1;
        }

        /* Overview Grid: Heatmap + Movers */
        .market-overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-sm);
        }
        @media (max-width: 900px) {
          .market-overview-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Movers Grid */
        .movers-grid {
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 768px) {
          .movers-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CRYPTO SECTION — Spanish version
   ═══════════════════════════════════════════════════════════════════ */
function EsCryptoSection() {
  const [crypto, setCrypto] = useState<AssetPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrypto = async () => {
      try {
        const [tpRes, priceRes] = await Promise.allSettled([
          fetch('/api/markets/integration?mode=quotes', { cache: 'no-store' }),
          fetch('/api/markets/prices', { cache: 'no-store' }),
        ]);

        const tpData = tpRes.status === 'fulfilled' && tpRes.value.ok
          ? await tpRes.value.json()
          : { quotes: {} };

        const priceData = priceRes.status === 'fulfilled' && priceRes.value.ok
          ? await priceRes.value.json()
          : { prices: [] };

        const tpCryptoMap: Record<string, { displaySymbol: string; nameEs: string; decimals: number }> = {
          'BTC-USDT': { displaySymbol: 'BTC/USD', nameEs: 'Bitcoin', decimals: 2 },
          'ETH-USDT': { displaySymbol: 'ETH/USD', nameEs: 'Ethereum', decimals: 2 },
          'SOL-USDT': { displaySymbol: 'SOL/USD', nameEs: 'Solana', decimals: 2 },
        };

        const shortMap: Record<string, string> = {
          'BTC-USDT': 'BTC', 'ETH-USDT': 'ETH', 'SOL-USDT': 'SOL',
        };

        const tpCrypto: AssetPrice[] = [];
        for (const [tpSym, quote] of Object.entries(tpData.quotes || {})) {
          const q = quote as any;
          const meta = tpCryptoMap[tpSym];
          if (meta && q && q.price > 0) {
            tpCrypto.push({
              symbol: shortMap[tpSym] || tpSym,
              displaySymbol: meta.displaySymbol,
              nameAr: meta.nameEs,
              nameEs: meta.nameEs,
              price: q.price,
              change: q.change || 0,
              changePercent: q.changePercent || 0,
              category: 'Cripto',
              categoryEs: 'Cripto',
              decimals: meta.decimals,
              source: 'live',
            });
          }
        }

        if (tpCrypto.length > 0) {
          setCrypto(tpCrypto);
          return;
        }

        if (priceData.prices && priceData.prices.length > 0) {
          const filtered = priceData.prices.filter((p: AssetPrice) =>
            getEsCategory(p) === 'Cripto'
          );
          setCrypto(filtered);
        }
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchCrypto();
    const interval = setInterval(fetchCrypto, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const CRYPTO_META: Record<string, { icon: string; color: string }> = {
    'BTC': { icon: '₿', color: '#F7931A' },
    'ETH': { icon: 'Ξ', color: '#627EEA' },
    'SOL': { icon: '◎', color: '#9945FF' },
  };

  return (
    <section className="section-block" aria-label="Criptomonedas" role="region">
      <div className="max-w-7xl mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
        <div className="sh">
          <div className="sh-title">Criptomonedas</div>
          <span className="badge-ai" style={{ fontSize: 9 }}>CRIPTO</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-4" style={{ height: '140px' }}>
                <div className="skeleton" style={{ height: '14px', width: '40%', marginBottom: '12px' }} />
                <div className="skeleton" style={{ height: '28px', width: '60%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '12px', width: '50%' }} />
              </div>
            ))}
          </div>
        ) : crypto.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-[13px]" style={{ color: 'var(--text3)' }}>No hay datos cripto disponibles en este momento</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {crypto.map((asset) => {
              const meta = CRYPTO_META[asset.symbol] || { icon: '🪙', color: 'var(--purple)' };
              const isUp = (asset.changePercent ?? 0) >= 0;

              return (
                <div key={asset.symbol} className="glass-card p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1"
                  style={{ borderTop: `2px solid ${meta.color}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{ background: `${meta.color}18`, color: meta.color }}>
                      {meta.icon}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{getEsName(asset)}</div>
                      <div className="font-mono-price text-[10px]" style={{ color: 'var(--text3)' }}>{asset.displaySymbol}</div>
                    </div>
                  </div>
                  <div className="font-mono-price text-2xl font-bold mb-1" style={{ color: 'var(--text)' }} suppressHydrationWarning>
                    ${(asset.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: asset.decimals || 2 })}
                  </div>
                  <span className={`font-mono-price text-[12px] font-medium ${isUp ? 'flash-up' : 'flash-down'}`}
                    style={{ color: isUp ? 'var(--bull)' : 'var(--bear)' }} suppressHydrationWarning>
                    {isUp ? '▲' : '▼'} {Math.abs(asset.changePercent ?? 0).toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
