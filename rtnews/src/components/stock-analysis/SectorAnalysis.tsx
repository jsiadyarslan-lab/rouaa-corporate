'use client';

// ─── Sector Analysis Widget ────────────────────────────────────
// Shows sector performance, top/bottom performers, and heatmap.
// Fetches from /api/stock-analysis/sectors?sector=X

import { useState, useEffect } from 'react';
import type { Locale } from '@/lib/locale';

// ── Locale Labels ──
const LABELS: Record<string, Record<string, string>> = {
  en: {
    sectorAnalysis: 'Sector Analysis',
    sectorPerformance: 'Sector Performance',
    topPerformers: 'Top Performers',
    bottomPerformers: 'Bottom Performers',
    heatmap: 'Heatmap',
    price: 'Price',
    change: 'Change',
    loading: 'Loading sector data...',
    error: 'Failed to load sector data',
    noData: 'No sector data available',
    stockCount: 'Stocks',
    avgChange: 'Avg Change',
    symbol: 'Symbol',
    today: 'Today',
  },
  ar: {
    sectorAnalysis: 'تحليل القطاع',
    sectorPerformance: 'أداء القطاع',
    topPerformers: 'الأكثر ارتفاعاً',
    bottomPerformers: 'الأكثر انخفاضاً',
    heatmap: 'خريطة حرارية',
    price: 'السعر',
    change: 'التغير',
    loading: 'جارٍ تحميل بيانات القطاع...',
    error: 'فشل تحميل بيانات القطاع',
    noData: 'لا توجد بيانات قطاعية',
    stockCount: 'الأسهم',
    avgChange: 'متوسط التغير',
    symbol: 'الرمز',
    today: 'اليوم',
  },
  fr: {
    sectorAnalysis: 'Analyse du Secteur',
    sectorPerformance: 'Performance du Secteur',
    topPerformers: 'Meilleures Performances',
    bottomPerformers: 'Moins Bonnes Performances',
    heatmap: 'Carte Thermique',
    price: 'Prix',
    change: 'Variation',
    loading: 'Chargement des données du secteur...',
    error: 'Échec du chargement des données',
    noData: 'Aucune donnée sectorielle disponible',
    stockCount: 'Actions',
    avgChange: 'Variation Moy.',
    symbol: 'Symbole',
    today: "Aujourd'hui",
  },
  tr: {
    sectorAnalysis: 'Sektör Analizi',
    sectorPerformance: 'Sektör Performansı',
    topPerformers: 'En İyi Performans',
    bottomPerformers: 'En Düşük Performans',
    heatmap: 'Isı Haritası',
    price: 'Fiyat',
    change: 'Değişim',
    loading: 'Sektör verisi yükleniyor...',
    error: 'Sektör verisi yüklenemedi',
    noData: 'Sektör verisi mevcut değil',
    stockCount: 'Hisse',
    avgChange: 'Ort. Değişim',
    symbol: 'Sembol',
    today: 'Bugün',
  },
};

// ── Types ──
interface SectorStock {
  id: string;
  symbol: string;
  title: string;
  price: number;
  change: number;
  changePercent: number;
  overallSignal: string;
  confidenceScore: number;
  company?: {
    name?: string | null;
    nameAr?: string | null;
    nameFr?: string | null;
  } | null;
}

interface SectorData {
  status: string;
  sector: string;
  stockCount: number;
  avgChange: number;
  analyses: SectorStock[];
}

// ── Helpers ──
function getHeatColor(change: number): { bg: string; text: string } {
  if (change >= 3) return { bg: 'rgba(34,197,94,0.2)', text: '#22c55e' };
  if (change >= 1.5) return { bg: 'rgba(34,197,94,0.12)', text: '#16a34a' };
  if (change >= 0) return { bg: 'rgba(34,197,94,0.06)', text: '#15803d' };
  if (change >= -1.5) return { bg: 'rgba(239,83,80,0.06)', text: '#b91c1c' };
  if (change >= -3) return { bg: 'rgba(239,83,80,0.12)', text: '#dc2626' };
  return { bg: 'rgba(239,83,80,0.2)', text: '#ef4444' };
}

function getCompanyName(item: SectorStock, locale: string): string {
  if (locale === 'ar' && item.company?.nameAr) return item.company.nameAr;
  if (locale === 'fr' && item.company?.nameFr) return item.company.nameFr;
  return item.company?.name || item.title || item.symbol;
}

interface Props {
  sector: string;
  symbol: string;
  locale: Locale;
}

export default function SectorAnalysis({ sector, symbol, locale }: Props) {
  const t = LABELS[locale] || LABELS.en;
  const isRTL = locale === 'ar';

  const [data, setData] = useState<SectorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch sector data
  useEffect(() => {
    if (!sector) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function fetchSector() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/stock-analysis/sectors?sector=${encodeURIComponent(sector)}&locale=${locale}`);
        const json = await res.json();
        if (!cancelled && json.status === 'ok') {
          setData(json);
        } else if (!cancelled) {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      }
      if (!cancelled) setLoading(false);
    }
    fetchSector();
    return () => { cancelled = true; };
  }, [sector, locale]);

  const fmt = (n: number, dec = 2) => n?.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) ?? '—';

  // Sort stocks by changePercent
  const sortedStocks = [...(data?.analyses || [])].sort((a, b) => b.changePercent - a.changePercent);
  const top5 = sortedStocks.slice(0, 5);
  const bottom5 = sortedStocks.slice(-5).reverse();

  // Loading state
  if (loading) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="glass-card" style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.sectorAnalysis}</span>
        </div>
        <div style={{ textAlign: 'center', padding: 24, borderRadius: 8, background: 'var(--bg)', color: 'var(--text3)', fontSize: 13 }}>
          {t.loading}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="glass-card" style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.sectorAnalysis}</span>
        </div>
        <div style={{ textAlign: 'center', padding: 24, borderRadius: 8, background: 'var(--bg)', color: 'var(--bear)', fontSize: 13 }}>
          {t.error}
        </div>
      </div>
    );
  }

  // No data state
  if (!data || !data.analyses || data.analyses.length === 0) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="glass-card" style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.sectorAnalysis}</span>
        </div>
        <div style={{ textAlign: 'center', padding: 24, borderRadius: 8, background: 'var(--bg)', color: 'var(--text3)', fontSize: 13 }}>
          {t.noData}
        </div>
      </div>
    );
  }

  const avgChange = data.avgChange;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="glass-card" style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.sectorAnalysis}</span>
        <span style={{ marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0, fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'var(--bg4)', color: 'var(--text3)', fontWeight: 600 }}>
          {sector}
        </span>
      </div>

      {/* ── Sector Performance Bar ── */}
      <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg)', marginBottom: 16, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{t.sectorPerformance} ({t.today})</span>
          <span style={{
            fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono), monospace',
            color: avgChange >= 0 ? 'var(--bull)' : 'var(--bear)',
          }} suppressHydrationWarning>
            {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
          </span>
        </div>
        {/* Visual bar */}
        <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'var(--bg5)', overflow: 'hidden' }}>
          {/* Center line */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'var(--text4)', zIndex: 1 }} />
          {/* Performance fill */}
          {avgChange >= 0 ? (
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: '50%', width: `${Math.min(50, Math.abs(avgChange) * 5)}%`,
              background: 'var(--bull)', borderRadius: '0 4px 4px 0', opacity: 0.6,
            }} />
          ) : (
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              right: '50%', width: `${Math.min(50, Math.abs(avgChange) * 5)}%`,
              background: 'var(--bear)', borderRadius: '4px 0 0 4px', opacity: 0.6,
            }} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--text4)' }}>{data.stockCount} {t.stockCount}</span>
          <span style={{ fontSize: 10, color: 'var(--text4)' }}>{t.avgChange}</span>
        </div>
      </div>

      {/* ── Heatmap Boxes ── */}
      {data.analyses.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 8 }}>{t.heatmap}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 4 }}>
            {data.analyses.map(stock => {
              const heat = getHeatColor(stock.changePercent);
              const isCurrentSymbol = stock.symbol === symbol;
              return (
                <div
                  key={stock.id}
                  style={{
                    padding: '6px 4px', borderRadius: 6, background: heat.bg,
                    border: isCurrentSymbol ? '2px solid var(--cyan)' : '1px solid transparent',
                    textAlign: 'center', transition: 'transform 0.15s',
                    cursor: 'default',
                  }}
                  title={`${stock.symbol}: ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`}
                >
                  <div style={{ fontSize: 9, fontWeight: 700, color: heat.text, fontFamily: 'var(--font-jetbrains-mono), monospace', marginBottom: 2 }}>{stock.symbol}</div>
                  <div style={{ fontSize: 8, fontWeight: 600, color: heat.text }} suppressHydrationWarning>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Top & Bottom Performers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Top 5 */}
        <div style={{ padding: '12px', borderRadius: 8, background: 'var(--bull2)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bull)', marginBottom: 8 }}>{t.topPerformers}</div>
          {top5.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {top5.map((stock, i) => (
                <div key={stock.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 8px', borderRadius: 5, background: 'var(--bg)', fontSize: 11,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, color: 'var(--text4)', fontWeight: 700, width: 12 }}>{i + 1}</span>
                    <span style={{ fontWeight: 700, color: stock.symbol === symbol ? 'var(--cyan)' : 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{stock.symbol}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }} suppressHydrationWarning>${fmt(stock.price)}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--bull)' }} suppressHydrationWarning>+{stock.changePercent.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: 8 }}>{t.noData}</div>
          )}
        </div>

        {/* Bottom 5 */}
        <div style={{ padding: '12px', borderRadius: 8, background: 'var(--bear2)', border: '1px solid rgba(239,83,80,0.15)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bear)', marginBottom: 8 }}>{t.bottomPerformers}</div>
          {bottom5.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {bottom5.map((stock, i) => (
                <div key={stock.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 8px', borderRadius: 5, background: 'var(--bg)', fontSize: 11,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, color: 'var(--text4)', fontWeight: 700, width: 12 }}>{i + 1}</span>
                    <span style={{ fontWeight: 700, color: stock.symbol === symbol ? 'var(--cyan)' : 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{stock.symbol}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }} suppressHydrationWarning>${fmt(stock.price)}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--bear)' }} suppressHydrationWarning>{stock.changePercent.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: 8 }}>{t.noData}</div>
          )}
        </div>
      </div>
    </div>
  );
}
