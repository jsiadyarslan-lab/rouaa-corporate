// ─── French Market Pulse Page ─────────────────────────────────────
// Client Component — Real-time market data overview (French)
// Shows live market data with auto-refresh capability

'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Zap,
  RefreshCw,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  category: string;
}

const DEFAULT_ASSETS: MarketAsset[] = [
  { symbol: 'EUR/USD', name: 'Euro / ABD Doları', price: 1.0842, change: 0.0012, changePercent: 0.11, category: 'forex' },
  { symbol: 'GBP/USD', name: 'İngiliz Sterlini / ABD Doları', price: 1.2715, change: -0.0023, changePercent: -0.18, category: 'forex' },
  { symbol: 'USD/JPY', name: 'ABD Doları / Japon Yeni', price: 149.82, change: 0.45, changePercent: 0.30, category: 'forex' },
  { symbol: 'XAU/USD', name: 'Altın', price: 2034.50, change: 12.30, changePercent: 0.61, category: 'commodities' },
  { symbol: 'XAG/USD', name: 'Gümüş', price: 22.85, change: -0.15, changePercent: -0.65, category: 'commodities' },
  { symbol: 'BTC/USD', name: 'Bitcoin', price: 43250.00, change: 850.00, changePercent: 2.00, category: 'crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum', price: 2280.50, change: -32.50, changePercent: -1.40, category: 'crypto' },
  { symbol: 'USOIL', name: 'WTI Ham Petrol', price: 72.45, change: 0.85, changePercent: 1.19, category: 'commodities' },
  { symbol: 'SPX500', name: 'S&P 500', price: 4783.20, change: 25.60, changePercent: 0.54, category: 'indices' },
  { symbol: 'NAS100', name: 'NASDAQ 100', price: 16782.40, change: -45.80, changePercent: -0.27, category: 'indices' },
];

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  forex: { label: 'Forex', color: 'var(--cyan, #00E5FF)' },
  commodities: { label: 'Emtalar', color: 'var(--gold, #FFB800)' },
  crypto: { label: 'Crypto', color: 'var(--purple, #8B5CF6)' },
  indices: { label: 'Indices', color: '#3BA7F0' },
};

export default function TrMarketPulsePage() {
  const [assets, setAssets] = useState<MarketAsset[]>(DEFAULT_ASSETS);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/markets/prices');
      if (res.ok) {
        const data = await res.json();
        if (data.prices && data.prices.length > 0) {
          const mapped = data.prices.slice(0, 20).map((p: any) => ({
            symbol: p.symbol || p.pair || '---',
            name: p.name || p.pair || p.symbol || '---',
            price: p.price || p.last || 0,
            change: p.change || p.change24h || 0,
            changePercent: p.changePercent || p.changePct || 0,
            category: p.category || p.assetClass || 'forex',
          }));
          setAssets(mapped);
        }
      }
    } catch {
      // Keep default data on error
    } finally {
      setLastUpdated(new Date());
      setRefreshing(false);
    }
  };

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredAssets = activeCategory === 'all'
    ? assets
    : assets.filter(a => a.category === activeCategory);

  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(139,92,246,0.12))',
                border: '1px solid rgba(0,229,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity size={22} style={{ color: 'var(--cyan, #00E5FF)' }} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text, #E8EDF5)' }}>
                  Piyasa Nabzı
                </h1>
                <p className="text-xs" style={{ color: 'var(--text3, #8A9DB2)', marginTop: 2 }}>
                  Données de marché en temps réel sur toutes les classes d&apos;actifs
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text4, #6A7A8E)' }}>
              <Clock size={12} />
              {lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px',
                background: 'var(--bg4, #111828)',
                border: '1px solid var(--border, rgba(255,255,255,0.085))',
                color: 'var(--text2, #B0C4D8)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Yenile
            </button>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#22C55E',
            boxShadow: '0 0 8px rgba(34,197,94,0.5)',
            animation: 'pulse 2s infinite',
          }} />
          <span className="text-xs font-semibold" style={{ color: '#22C55E' }}>Canlı</span>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'all', label: 'Tüm Piyasalar' },
            ...Object.entries(CATEGORY_CONFIG).map(([id, config]) => ({
              id,
              label: config.label,
            })),
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '6px 14px', borderRadius: '8px',
                background: activeCategory === cat.id ? 'var(--cyan2, rgba(0,229,255,0.06))' : 'var(--bg4, #111828)',
                border: `1px solid ${activeCategory === cat.id ? 'var(--cyan, #00E5FF)' : 'var(--border, rgba(255,255,255,0.085))'}`,
                color: activeCategory === cat.id ? 'var(--cyan, #00E5FF)' : 'var(--text3, #8A9DB2)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Market table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold"
            style={{ color: 'var(--text4, #6A7A8E)', borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))' }}
          >
            <div className="col-span-3">Sembol</div>
            <div className="col-span-2 text-right">Fiyat</div>
            <div className="col-span-2 text-right">Değişim</div>
            <div className="col-span-2 text-right">Değişim %</div>
            <div className="col-span-3 text-right">Kategori</div>
          </div>

          {/* Table rows */}
          {filteredAssets.map((asset, i) => {
            const isPositive = asset.change >= 0;
            const catConfig = CATEGORY_CONFIG[asset.category] || CATEGORY_CONFIG.forex;

            return (
              <div
                key={asset.symbol}
                className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm"
                style={{
                  borderBottom: i < filteredAssets.length - 1 ? '1px solid var(--border, rgba(255,255,255,0.04))' : 'none',
                }}
              >
                <div className="col-span-3 flex items-center gap-2">
                  <span className="font-semibold" style={{ color: 'var(--text, #E8EDF5)' }}>
                    {asset.symbol}
                  </span>
                </div>
                <div className="col-span-2 text-right font-semibold" style={{ color: 'var(--text2, #B0C4D8)' }}>
                  {asset.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="col-span-2 text-right flex items-center justify-end gap-1">
                  {isPositive ? (
                    <ArrowUpRight size={12} style={{ color: '#22C55E' }} />
                  ) : (
                    <ArrowDownRight size={12} style={{ color: '#EF5350' }} />
                  )}
                  <span style={{ color: isPositive ? '#22C55E' : '#EF5350', fontWeight: 600 }}>
                    {isPositive ? '+' : ''}{asset.change.toFixed(2)}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      color: isPositive ? '#22C55E' : '#EF5350',
                      background: isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(239,83,80,0.12)',
                    }}
                  >
                    {isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="col-span-3 text-right">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ color: catConfig.color, background: `${catConfig.color}15` }}
                  >
                    {catConfig.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div
          className="rounded-xl p-3 mt-4 text-xs"
          style={{
            background: 'rgba(255,184,0,0.06)',
            border: '1px solid rgba(255,184,0,0.12)',
            color: 'var(--text3, #8A9DB2)',
          }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} style={{ color: 'var(--gold, #FFB800)', flexShrink: 0, marginTop: '1px' }} />
            <span>
              Piyasa verileri gecikmeli olabilir ve gerçek zamanlı fiyatları yansıtmayabilir. Fiyatlar yalnızca bilgilendirme amaçlıdır ve trading kararları için tek temel olarak kullanılmamalıdır.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
