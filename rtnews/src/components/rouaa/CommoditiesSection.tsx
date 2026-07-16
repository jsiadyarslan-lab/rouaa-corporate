'use client';

import { useState, useEffect } from 'react';

interface CommodityAsset {
  symbol: string;
  displaySymbol: string;
  nameAr: string;
  nameEn?: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  category: string;
  categoryEn?: string;
  decimals: number;
  source?: string;
  sparkline?: number[];
}

// V355: Locale-aware labels
const LABELS = {
  ar: {
    sectionTitle: 'السلع والطاقة',
    live: 'مباشر',
    noData: 'لا توجد بيانات سلع حالياً',
    gold: 'الذهب',
    oil: 'النفط',
    silver: 'الفضة',
    commodities: 'سلع',
    energy: 'طاقة',
  },
  en: {
    sectionTitle: 'Commodities & Energy',
    live: 'LIVE',
    noData: 'No commodity data available at the moment',
    gold: 'Gold',
    oil: 'Crude Oil',
    silver: 'Silver',
    commodities: 'Commodities',
    energy: 'Energy',
  },
  fr: {
    sectionTitle: 'Matières Premières & Énergie',
    live: 'EN DIRECT',
    noData: 'Aucune donnée sur les matières premières disponible',
    gold: 'Or',
    oil: 'Pétrole Brut',
    silver: 'Argent',
    commodities: 'Matières Premières',
    energy: 'Énergie',
  },
  tr: {
    sectionTitle: 'Emtialar & Enerji',
    live: 'CANLI',
    noData: 'Şu anda emtia verisi yok',
    gold: 'Altın',
    oil: 'Ham Petrol',
    silver: 'Gümüş',
    commodities: 'Emtia',
    energy: 'Enerji',
  },
  es: {
    sectionTitle: 'Materias Primas & Energía',
    live: 'EN VIVO',
    noData: 'No hay datos de materias primas disponibles',
    gold: 'Oro',
    oil: 'Petróleo Crudo',
    silver: 'Plata',
    commodities: 'Materias Primas',
    energy: 'Energía',
  },
} as const;

type Locale = keyof typeof LABELS;

// Mini sparkline SVG component
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  const fillPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0">
      <polygon points={fillPoints} fill={color} opacity="0.1" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

const COMMODITY_SYMBOLS = ['XAU', 'WTI', 'XAG'];

// Symbol mapping for trading platform
const TP_SYMBOL_MAP: Record<string, string> = {
  'XAU': 'XAU-USD',
  'WTI': 'CL-USD',
  'XAG': 'XAG-USD',
};

// Individual commodity card
function CommodityCard({ asset, meta }: { asset: CommodityAsset; meta: { icon: string; color: string; label: string } }) {
  const isUp = (asset.changePercent ?? 0) >= 0;
  const sparkline = asset.sparkline || [];

  return (
    <div className="glass-card p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <div>
            <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{meta.label}</div>
            <div className="font-mono-price text-[10px]" style={{ color: 'var(--text3)' }}>{asset.displaySymbol}</div>
          </div>
        </div>
        {asset.source === 'live' && (
          <span className="live-pulse-dot" />
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono-price text-2xl font-bold" style={{ color: 'var(--text)' }} suppressHydrationWarning>
            {(asset.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: asset.decimals || 2 })}
          </div>
          <span className={`font-mono-price text-[12px] font-medium ${isUp ? 'flash-up' : 'flash-down'}`}
            style={{ color: isUp ? 'var(--bull)' : 'var(--bear)' }} suppressHydrationWarning>
            {isUp ? '▲' : '▼'} {Math.abs(asset.changePercent ?? 0).toFixed(2)}%
          </span>
        </div>
        {sparkline.length >= 2 && (
          <MiniSparkline data={sparkline} color={isUp ? '#22C55E' : '#F43F5E'} />
        )}
      </div>
    </div>
  );
}

interface CommoditiesSectionProps {
  locale?: Locale;
}

export default function CommoditiesSection({ locale = 'ar' }: CommoditiesSectionProps) {
  const t = LABELS[locale] || LABELS.ar;
  const [commodities, setCommodities] = useState<CommodityAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommodities = async () => {
        if (document.hidden) return; // V1020: skip polling when tab is hidden
      try {
        // Strategy: Try trading platform first, then fallback to external APIs
        // Fetch batch quotes and sparklines from trading platform
        const [tpQuotesRes, tpSparklinesRes, priceRes] = await Promise.allSettled([
          fetch('/api/markets/integration?mode=quotes', { cache: 'no-store', signal: AbortSignal.timeout(15_000) }),
          fetch('/api/markets/integration?mode=sparklines', { cache: 'no-store', signal: AbortSignal.timeout(15_000) }),
          fetch('/api/markets/prices', { cache: 'no-store', signal: AbortSignal.timeout(15_000) }),
        ]);

        const tpQuotesData = tpQuotesRes.status === 'fulfilled' && tpQuotesRes.value.ok
          ? await tpQuotesRes.value.json()
          : { quotes: {} };

        const tpSparklinesData = tpSparklinesRes.status === 'fulfilled' && tpSparklinesRes.value.ok
          ? await tpSparklinesRes.value.json()
          : { sparklines: {} };

        const priceData = priceRes.status === 'fulfilled' && priceRes.value.ok
          ? await priceRes.value.json()
          : { prices: [] };

        // Build commodities from trading platform data (primary source)
        const tpCommodities: CommodityAsset[] = [];

        for (const [shortSymbol, tpSymbol] of Object.entries(TP_SYMBOL_MAP)) {
          const tpQuote = tpQuotesData.quotes?.[tpSymbol];
          const tpSparkline = tpSparklinesData.sparklines?.[tpSymbol];

          if (tpQuote && tpQuote.price > 0) {
            tpCommodities.push({
              symbol: shortSymbol,
              displaySymbol: shortSymbol === 'WTI' ? 'WTI/USD' : `${shortSymbol}/USD`,
              nameAr: shortSymbol === 'XAU' ? t.gold : shortSymbol === 'WTI' ? t.oil : t.silver,
              price: tpQuote.price,
              change: tpQuote.change || 0,
              changePercent: tpQuote.changePercent || 0,
              category: shortSymbol === 'WTI' ? t.energy : t.commodities,
              decimals: shortSymbol === 'XAU' ? 2 : shortSymbol === 'XAG' ? 2 : 2,
              source: 'live',
              sparkline: tpSparkline || [],
            });
          }
        }

        // If trading platform provided data, use it
        if (tpCommodities.length > 0) {
          setCommodities(tpCommodities);
          return;
        }

        // Fallback: use external API data (Finnhub/Yahoo/TwelveData)
        if (priceData.prices && priceData.prices.length > 0) {
          const filtered = priceData.prices
            .filter((p: CommodityAsset) =>
              COMMODITY_SYMBOLS.includes(p.symbol) || p.category === 'سلع' || p.category === 'طاقة' || p.category === t.commodities || p.category === t.energy
            )
            .map((asset: CommodityAsset) => ({
              ...asset,
              sparkline: [],
              source: asset.source || 'external',
            }));
          setCommodities(filtered);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchCommodities();
    const interval = setInterval(fetchCommodities, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [t]);

  const commodityMeta: Record<string, { icon: string; color: string; label: string }> = {
    'XAU': { icon: '🥇', color: 'var(--gold)', label: t.gold },
    'WTI': { icon: '🛢️', color: 'var(--orange)', label: t.oil },
    'XAG': { icon: '🪙', color: 'var(--text2)', label: t.silver },
  };

  return (
    <section className="section-block" aria-label={t.sectionTitle} role="region">
      <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
        <div className="sh">
          <div className="sh-title">{t.sectionTitle}</div>
          <span className="badge-live">
            <span className="live-dot" />
            {t.live}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-4" style={{ height: '120px' }}>
                <div className="skeleton" style={{ height: '14px', width: '40%', marginBottom: '12px' }} />
                <div className="skeleton" style={{ height: '28px', width: '60%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '12px', width: '50%' }} />
              </div>
            ))}
          </div>
        ) : commodities.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-[13px]" style={{ color: 'var(--text3)' }}>{t.noData}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {commodities.map((asset) => {
              const meta = commodityMeta[asset.symbol] || { icon: '📊', color: 'var(--cyan)', label: asset.nameAr };
              return <CommodityCard key={asset.symbol} asset={asset} meta={meta} />;
            })}
          </div>
        )}
      </div>
    </section>
  );
}
