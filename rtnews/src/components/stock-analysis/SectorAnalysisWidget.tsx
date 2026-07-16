'use client';

// ─── Sector Analysis Widget (Detail Page) ──────────────────────
// Shows sector performance, ranking, and heatmap for the stock's sector.

import { useState, useEffect, useCallback } from 'react';
import { type Locale, translateSectorToLocale } from '@/lib/locale';

// ── Locale Labels ──
const LABELS: Record<string, Record<string, string>> = {
  en: {
    sectorAnalysis: 'Sector Analysis',
    sectorPerformance: 'Sector Performance',
    sectorRanking: 'Your Stock Ranking',
    topPerformers: 'Top Performers',
    bottomPerformers: 'Bottom Performers',
    sectorHeatmap: 'Sector Heatmap',
    loading: 'Loading sector data...',
    noSector: 'No sector data available',
    rank: 'Rank',
    of: 'of',
    today: 'Today',
    change: 'Change',
    marketCap: 'Market Cap',
    signal: 'Signal',
    stockCount: 'stocks',
  },
  ar: {
    sectorAnalysis: 'تحليل القطاع',
    sectorPerformance: 'أداء القطاع',
    sectorRanking: 'ترتيب السهم',
    topPerformers: 'الأفضل أداءً',
    bottomPerformers: 'الأضعف أداءً',
    sectorHeatmap: 'خريطة القطاع الحرارية',
    loading: 'جاري تحميل بيانات القطاع...',
    noSector: 'لا توجد بيانات قطاع متاحة',
    rank: 'الترتيب',
    of: 'من',
    today: 'اليوم',
    change: 'التغيير',
    marketCap: 'القيمة السوقية',
    signal: 'الإشارة',
    stockCount: 'سهم',
  },
  fr: {
    sectorAnalysis: 'Analyse Sectorielle',
    sectorPerformance: 'Performance du Secteur',
    sectorRanking: 'Classement',
    topPerformers: 'Meilleurs Performeurs',
    bottomPerformers: 'Moins Bonnes Performances',
    sectorHeatmap: 'Carte Chaleur du Secteur',
    loading: 'Chargement des données sectorielles...',
    noSector: 'Aucune donnée sectorielle disponible',
    rank: 'Rang',
    of: 'sur',
    today: "Aujourd'hui",
    change: 'Variation',
    marketCap: 'Cap. Boursière',
    signal: 'Signal',
    stockCount: 'actions',
  },
  tr: {
    sectorAnalysis: 'Sektör Analizi',
    sectorPerformance: 'Sektör Performansı',
    sectorRanking: 'Hisse Sıralaması',
    topPerformers: 'En İyi Performans',
    bottomPerformers: 'En Düşük Performans',
    sectorHeatmap: 'Sektör Isı Haritası',
    loading: 'Sektör verisi yükleniyor...',
    noSector: 'Sektör verisi mevcut değil',
    rank: 'Sıra',
    of: '/',
    today: 'Bugün',
    change: 'Değişim',
    marketCap: 'Piyasa Değeri',
    signal: 'Sinyal',
    stockCount: 'hisse',
  },
  es: {
    sectorAnalysis: 'Análisis Sectorial',
    sectorPerformance: 'Rendimiento del Sector',
    sectorRanking: 'Clasificación de su Acción',
    topPerformers: 'Mejores Resultados',
    bottomPerformers: 'Peores Resultados',
    sectorHeatmap: 'Mapa de Calor del Sector',
    loading: 'Cargando datos del sector...',
    noSector: 'No hay datos sectoriales disponibles',
    rank: 'Posición',
    of: 'de',
    today: 'Hoy',
    change: 'Cambio',
    marketCap: 'Cap. de Mercado',
    signal: 'Señal',
    stockCount: 'acciones',
  },
};

interface Props {
  symbol: string;
  sector: string;
  locale: Locale;
}

export default function SectorAnalysisWidget({ symbol, sector, locale }: Props) {
  const t = LABELS[locale] || LABELS.en;
  const [sectorData, setSectorData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSectorData = useCallback(async () => {
    if (!sector) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/stock-analysis/sectors?locale=${locale}&sector=${encodeURIComponent(sector)}`);
      if (res.ok) {
        const data = await res.json();
        setSectorData(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [sector, locale]);

  useEffect(() => {
    fetchSectorData();
  }, [fetchSectorData]);

  const fmt = (n: number, dec = 2) => n?.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) ?? '—';

  if (!sector) {
    return (
      <div className="glass-card" style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.sectorAnalysis}</span>
        </div>
        <div style={{ textAlign: 'center', padding: '24px', borderRadius: 8, background: 'var(--bg)', color: 'var(--text3)', fontSize: 13 }}>
          {t.noSector}
        </div>
      </div>
    );
  }

  const analyses = sectorData?.analyses || [];
  const sortedByChange = [...analyses].sort((a: any, b: any) => b.changePercent - a.changePercent);
  const currentStockIdx = sortedByChange.findIndex((a: any) => a.symbol === symbol);
  const topPerformers = sortedByChange.slice(0, 3);
  const bottomPerformers = sortedByChange.slice(-3).reverse();

  const heatColor = (change: number) => {
    if (change > 3) return '#22c55e';
    if (change > 1) return '#4ade80';
    if (change > 0) return '#86efac';
    if (change > -1) return '#fca5a5';
    if (change > -3) return '#f87171';
    return '#ef4444';
  };

  return (
    <div className="glass-card" style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.sectorAnalysis}</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <div style={{ display: 'inline-block', width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 12 }}>{t.loading}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : (
        <>
          {/* Sector Performance */}
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg)', marginBottom: 16, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)' }}>{translateSectorToLocale(sector, locale)}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{analyses.length} {t.stockCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{t.sectorPerformance} ({t.today})</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: (sectorData?.avgChange || 0) >= 0 ? 'var(--bull)' : 'var(--bear)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                {(sectorData?.avgChange || 0) >= 0 ? '+' : ''}{(sectorData?.avgChange || 0).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Stock Ranking */}
          {currentStockIdx >= 0 && (
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg)', marginBottom: 16, border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 6 }}>{t.sectorRanking}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: currentStockIdx < analyses.length / 3 ? 'var(--bull)' : currentStockIdx > analyses.length * 2 / 3 ? 'var(--bear)' : 'var(--gold)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                #{currentStockIdx + 1}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{t.of} {analyses.length}</span>
            </div>
          )}

          {/* Top/Bottom Performers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {topPerformers.length > 0 && (
              <div style={{ padding: '12px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bull)', marginBottom: 8 }}>▲ {t.topPerformers}</div>
                {topPerformers.map((s: any) => (
                  <div key={s.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{s.symbol}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--bull)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                      +{s.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
            {bottomPerformers.length > 0 && (
              <div style={{ padding: '12px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bear)', marginBottom: 8 }}>▼ {t.bottomPerformers}</div>
                {bottomPerformers.map((s: any) => (
                  <div key={s.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{s.symbol}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--bear)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                      {s.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Heatmap */}
          {analyses.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-head)', marginBottom: 10 }}>{t.sectorHeatmap}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {sortedByChange.map((s: any) => (
                  <div
                    key={s.symbol}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: heatColor(s.changePercent),
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      opacity: s.symbol === symbol ? 1 : 0.75,
                      border: s.symbol === symbol ? '2px solid var(--text-head)' : 'none',
                    }}
                    title={`${s.symbol}: ${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%`}
                  >
                    {s.symbol}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
