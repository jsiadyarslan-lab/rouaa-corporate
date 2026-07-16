'use client';

import { useState, useEffect } from 'react';

interface ArabMarket {
  id: string;
  name: string;
  nameEn: string;
  flag: string;
  country: string;
  region: string;
  value: number | null;
  change: number | null;
  sparkline: number[];
  timezone: string;
  openTime: string;
  closeTime: string;
  source: string;
}

// V355: Locale-aware labels — renamed per geographic region
const LABELS = {
  ar: {
    sectionTitle: 'الأسواق العربية',
    exclusive: 'حصري',
    subtitle: 'تغطية حية لأبرز أسواق المال في الوطن العربي',
    all: 'الكل',
    gulf: 'الخليج',
    egypt: 'مصر',
    levant: 'الشام',
    open: 'مفتوح',
    closed: 'مغلق',
    until: 'حتى',
    reference: 'مرجعي',
    tradingHours: 'ساعات التداول العربية',
    noData: 'لا توجد بيانات أسواق حالياً',
  },
  en: {
    sectionTitle: 'US & Global Markets',
    exclusive: 'Exclusive',
    subtitle: 'Live coverage of US and global financial markets',
    all: 'All',
    gulf: 'US Markets',
    egypt: 'Global',
    levant: 'Americas',
    open: 'Open',
    closed: 'Closed',
    until: 'until',
    reference: 'Ref',
    tradingHours: 'US Trading Hours',
    noData: 'No market data available at the moment',
  },
  fr: {
    sectionTitle: 'Marchés Européens',
    exclusive: 'Exclusif',
    subtitle: 'Couverture en direct des principaux marchés financiers européens',
    all: 'Tous',
    gulf: 'Zone Euro',
    egypt: 'France',
    levant: 'Europe',
    open: 'Ouvert',
    closed: 'Fermé',
    until: 'jusqu\'à',
    reference: 'Réf',
    tradingHours: 'Heures de Bourse Européennes',
    noData: 'Aucune donnée de marché disponible',
  },
  tr: {
    sectionTitle: 'BIST & Bölgesel Piyasalar',
    exclusive: 'Özel',
    subtitle: 'BIST ve bölgesel piyasalardan canlı veriler',
    all: 'Tümü',
    gulf: 'BIST',
    egypt: 'Türkiye',
    levant: 'Gelişmekte Olanlar',
    open: 'Açık',
    closed: 'Kapalı',
    until: 'kadar',
    reference: 'Ref',
    tradingHours: 'Türkiye Ticaret Saatleri',
    noData: 'Şu anda piyasa verisi yok',
  },
  es: {
    sectionTitle: 'Mercados Latinoamericanos',
    exclusive: 'Exclusivo',
    subtitle: 'Cobertura en vivo de los principales mercados financieros de Latinoamérica',
    all: 'Todos',
    gulf: 'España',
    egypt: 'México',
    levant: 'Brasil',
    open: 'Abierto',
    closed: 'Cerrado',
    until: 'hasta',
    reference: 'Ref',
    tradingHours: 'Horarios de Negociación LatAm',
    noData: 'No hay datos de mercado disponibles',
  },
} as const;

type Locale = keyof typeof LABELS;

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60, h = 20;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

interface ArabMarketsProps {
  locale?: Locale;
}

export default function ArabMarkets({ locale = 'ar' }: ArabMarketsProps) {
  const t = LABELS[locale] || LABELS.ar;
  const tabs = [t.all, t.gulf, t.egypt, t.levant] as const;
  type TabKey = typeof tabs[number];

  const [activeTab, setActiveTab] = useState<TabKey>(t.all);
  const [mounted, setMounted] = useState(false);
  const [markets, setMarkets] = useState<ArabMarket[]>([]);
  const [loading, setLoading] = useState(true);

  // Locale → region mapping for API requests
  const regionMap: Record<string, string> = { ar: 'arab', en: 'us', fr: 'europe', tr: 'turkey', es: 'hispanic' };
  const region = regionMap[locale] || 'arab';

  useEffect(() => {
    setMounted(true);
    const fetchMarkets = async () => {
        if (document.hidden) return; // V1020: skip polling when tab is hidden
      try {
        const res = await fetch(`/api/markets/arab?region=${region}&locale=${locale}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.markets?.length > 0) setMarkets(data.markets);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [region, locale]);

  const isMarketOpen = (market: ArabMarket) => {
    if (!mounted) return false;
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: market.timezone, hour: '2-digit', minute: '2-digit', hour12: false });
    const timeStr = formatter.format(now);
    const [h, m] = timeStr.split(':').map(Number);
    const currentMinutes = h * 60 + m;
    const [openH] = market.openTime.split(':').map(Number);
    const [closeH] = market.closeTime.split(':').map(Number);
    return currentMinutes >= openH * 60 && currentMinutes <= closeH * 60;
  };

  const filteredMarkets = activeTab === t.all ? markets :
    activeTab === t.gulf ? markets.filter(m => ['tasi', 'dfm', 'qe', 'bse', 'bk', 'msm'].includes(m.id)) :
    activeTab === t.egypt ? markets.filter(m => m.id === 'egx30') :
    markets;

  return (
    <section id="arab-markets" className="section-block">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="section-title">
          <h2>{t.sectionTitle}</h2>
          <span className="badge-exclusive">{t.exclusive}</span>
        </div>
        <p className="text-[14px] mb-5" style={{ color: 'var(--text2)' }}>{t.subtitle}</p>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`tab-underline ${activeTab === tab ? 'active' : ''}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Market Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="glass-card p-4" style={{ height: '140px' }}>
                <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '24px', width: '80%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '12px', width: '50%' }} />
              </div>
            ))}
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-[13px]" style={{ color: 'var(--text3)' }}>{t.noData}</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
              {filteredMarkets.map((market) => {
                const open = isMarketOpen(market);
                const isRef = market.source === 'reference';
                const displayName = market.name || market.nameEn;
                return (
                  <div key={market.id} className="glass-card p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 group" style={isRef ? { opacity: 0.85 } : {}}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span>{market.flag}</span>
                      <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--text)' }}>{displayName}</span>
                      {isRef && <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: 'rgba(234,179,8,.12)', color: '#eab308', fontWeight: 600 }}>{t.reference}</span>}
                    </div>
                    <div className="font-mono-price text-lg font-bold mb-1" style={{ color: 'var(--text)' }} suppressHydrationWarning>
                      {(market.value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono-price text-[12px] font-medium" style={{ color: isRef ? 'var(--text3)' : ((market.change ?? 0) >= 0 ? 'var(--bull)' : 'var(--bear)') }}>
                        {isRef ? '—' : <>{(market.change ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(market.change ?? 0).toFixed(2)}%</>}
                      </span>
                      {market.sparkline && market.sparkline.length > 0 && <MiniSparkline data={market.sparkline} color={(market.change ?? 0) >= 0 ? '#22C55E' : '#F43F5E'} />}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className={`w-[6px] h-[6px] rounded-full ${open ? 'live-dot' : ''}`}
                        style={{ background: open ? 'var(--bull)' : 'var(--text3)' }} />
                      <span style={{ color: 'var(--text3)' }}>{open ? t.open : t.closed} {t.until} {market.closeTime}</span>
                    </div>
                    {!isRef && (
                      <div className="mt-2 progress-bar h-[4px]">
                        <div className="progress-bar-fill" style={{
                          width: `${Math.min(Math.abs(market.change ?? 0) * 15, 100)}%`,
                          background: (market.change ?? 0) >= 0 ? 'var(--bull)' : 'var(--bear)',
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Trading Session Timeline */}
            <div className="glass-card p-5">
              <h3 className="text-[14px] font-bold mb-4" style={{ color: 'var(--text)' }}>{t.tradingHours}</h3>
              <div className="space-y-3">
                {markets.slice(0, 5).map((market) => {
                  const open = isMarketOpen(market);
                  const displayName = (market.name || market.nameEn).split(' ')[0];
                  return (
                    <div key={market.id} className="flex items-center gap-3 text-[12px]">
                      <span className="w-24 flex items-center gap-1.5" style={{ color: 'var(--text2)' }}>
                        {market.flag} <span className="truncate">{displayName}</span>
                      </span>
                      <div className="flex-1 h-[10px] rounded-full relative overflow-hidden" style={{ background: 'var(--bg5)' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            background: open ? 'rgba(34,197,94,0.25)' : 'rgba(75,85,99,0.25)',
                            marginInlineStart: `${(parseInt(market.openTime.split(':')[0]) - 9) / 8 * 100}%`,
                            width: `${(parseInt(market.closeTime.split(':')[0]) - parseInt(market.openTime.split(':')[0])) / 8 * 100}%`,
                          }} />
                        {open && <div className="absolute top-0 h-full w-[3px] rounded-full" style={{
                          background: 'var(--bull)',
                          left: mounted ? `${((new Date().getHours() - 9) / 8) * 100}%` : '50%',
                        }}></div>}
                      </div>
                      <span className="font-mono-price w-24 text-left" style={{ color: 'var(--text3)' }}>
                        {market.openTime} - {market.closeTime}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
