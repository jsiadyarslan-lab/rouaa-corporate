'use client';

import { useState, useEffect, useMemo } from 'react';
import { getLocalePath, translateSectorToLocale } from '@/lib/locale';

/* ══════════════════════════════════════════════════════════════════════
   Stock & Company Analysis Section — Homepage Card
   Displays 3 sub-sections:
   1. Stock Analysis (latest 5)
   2. Stock Scanner (latest 10)
   3. Sector Analysis (latest 5)
   Shared across all locales (AR/EN/FR).
   ══════════════════════════════════════════════════════════════════════ */

interface AnalysisItem {
  id: string;
  symbol: string;
  title: string;
  price: number;
  change: number;
  changePercent: number;
  overallSignal: string;
  confidenceScore: number;
  company?: { name?: string; nameAr?: string; nameFr?: string } | null;
}

interface ScreenerItem {
  id: string;
  symbol: string;
  title?: string;
  price: number;
  changePercent: number;
  overallSignal: string;
  confidenceScore: number;
  marketCap?: number;
  company?: { name?: string; nameAr?: string; nameFr?: string } | null;
}

interface SectorItem {
  sector: string;
  stockCount: number;
  avgChange: number;
  avgConfidence: number;
}

// ── Labels ──
const LABELS: Record<string, Record<string, string>> = {
  ar: {
    sectionTitle: 'تحليلات الأسهم والشركات',
    stockAnalysis: 'تحليل الأسهم',
    stockScreener: 'ماسح الأسهم',
    sectorAnalysis: 'تحليل القطاعات',
    viewAll: 'عرض الكل',
    noAnalyses: 'لا توجد تحليلات متاحة',
    noScreener: 'لا توجد بيانات مسح متاحة',
    noSectors: 'لا توجد بيانات قطاعات متاحة',
    bullish: 'صاعد',
    bearish: 'هابط',
    neutral: 'محايد',
    confidence: 'ثقة',
    stocks: 'سهم',
    avgChange: 'متوسط التغير',
    low: 'منخفض',
    medium: 'متوسط',
    high: 'مرتفع',
    risk: 'مخاطر',
    arrowLeft: '←',
  },
  en: {
    sectionTitle: 'Stock & Company Analysis',
    stockAnalysis: 'Stock Analysis',
    stockScreener: 'Stock Scanner',
    sectorAnalysis: 'Sector Analysis',
    viewAll: 'View All',
    noAnalyses: 'No analyses available',
    noScreener: 'No screener data available',
    noSectors: 'No sector data available',
    bullish: 'Bullish',
    bearish: 'Bearish',
    neutral: 'Neutral',
    confidence: 'Confidence',
    stocks: 'stocks',
    avgChange: 'Avg Change',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    risk: 'Risk',
    arrowLeft: '→',
  },
  fr: {
    sectionTitle: 'Analyse Actions & Entreprises',
    stockAnalysis: 'Analyse des Actions',
    stockScreener: 'Scanner Boursier',
    sectorAnalysis: 'Analyse Sectorielle',
    viewAll: 'Voir Tout',
    noAnalyses: 'Aucune analyse disponible',
    noScreener: 'Aucune donnée de filtrage disponible',
    noSectors: 'Aucune donnée sectorielle disponible',
    bullish: 'Haussier',
    bearish: 'Baissier',
    neutral: 'Neutre',
    confidence: 'Confiance',
    stocks: 'actions',
    avgChange: 'Var. Moy.',
    low: 'Faible',
    medium: 'Moyen',
    high: 'Élevé',
    risk: 'Risque',
    arrowLeft: '→',
  },
  tr: {
    sectionTitle: 'Hisse ve Şirket Analizi',
    stockAnalysis: 'Hisse Analizi',
    stockScreener: 'Hisse Tarayıcı',
    sectorAnalysis: 'Sektör Analizi',
    viewAll: 'Tümünü Görüntüle',
    noAnalyses: 'Analiz mevcut değil',
    noScreener: 'Tarayıcı verisi mevcut değil',
    noSectors: 'Sektör verisi mevcut değil',
    bullish: 'Yükseliş',
    bearish: 'Düşüş',
    neutral: 'Nötr',
    confidence: 'Güven',
    stocks: 'hisse',
    avgChange: 'Ort. Değişim',
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    risk: 'Risk',
    arrowLeft: '→',
  },
  es: {
    sectionTitle: 'Análisis de Acciones y Empresas',
    stockAnalysis: 'Análisis de Acciones',
    stockScreener: 'Escáner de Acciones',
    sectorAnalysis: 'Análisis Sectorial',
    viewAll: 'Ver Todo',
    noAnalyses: 'No hay análisis disponibles',
    noScreener: 'No hay datos del escáner disponibles',
    noSectors: 'No hay datos sectoriales disponibles',
    bullish: 'Alcista',
    bearish: 'Bajista',
    neutral: 'Neutral',
    confidence: 'Confianza',
    stocks: 'acciones',
    avgChange: 'Cambio Prom.',
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto',
    risk: 'Riesgo',
    arrowLeft: '→',
  },
};

// ── Signal Config ──
const SIGNAL_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  bullish: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' },
  bearish: { color: '#ef5350', bg: 'rgba(239,83,80,0.1)', border: 'rgba(239,83,80,0.25)' },
  neutral: { color: '#ffb800', bg: 'rgba(255,184,0,0.1)', border: 'rgba(255,184,0,0.25)' },
};

function getSignalLabel(signal: string, locale: string): string {
  const t = LABELS[locale] || LABELS.en;
  if (signal === 'bullish') return t.bullish;
  if (signal === 'bearish') return t.bearish;
  return t.neutral;
}

function formatMarketCap(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString('en-US')}`;
}

// ── Sub-component: Analysis Card ──
function AnalysisCard({ item, locale }: { item: AnalysisItem; locale: string }) {
  const t = LABELS[locale] || LABELS.en;
  const sig = SIGNAL_CONFIG[item.overallSignal] || SIGNAL_CONFIG.neutral;
  const companyName = locale === 'ar'
    ? (item.company?.nameAr || item.company?.name || item.symbol)
    : locale === 'fr'
    ? (item.company?.nameFr || item.company?.name || item.symbol)
    : (item.company?.name || item.symbol);
  const isPositive = item.changePercent >= 0;

  return (
    <a
      href={`${getLocalePath(locale as any)}/stock-analysis/${item.symbol}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 'var(--r)',
        background: 'var(--bg4)',
        borderInlineStart: `3px solid ${sig.color}`,
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background .2s',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 'var(--r)',
        background: sig.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: sig.color, fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
          {item.symbol.slice(0, 3)}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 700, color: 'var(--text-head)', margin: 0,
          lineHeight: 1.5, display: '-webkit-box' as const,
          WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
        }}>
          {companyName}
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: sig.bg, color: sig.color, fontWeight: 700, border: `1px solid ${sig.border}` }}>
            {getSignalLabel(item.overallSignal, locale)}
          </span>
          <span style={{ fontSize: 10, color: isPositive ? 'var(--bull)' : 'var(--bear)', fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
            {isPositive ? '+' : ''}{item.changePercent?.toFixed(2)}%
          </span>
          {item.confidenceScore > 0 && (
            <span style={{ fontSize: 10, color: 'var(--purple)' }}>{item.confidenceScore}%</span>
          )}
        </div>
      </div>
      <span style={{
        fontSize: 13, fontWeight: 700, color: 'var(--text-head)',
        fontFamily: 'var(--font-jetbrains-mono), monospace', flexShrink: 0,
      }}>
        ${item.price?.toFixed(2)}
      </span>
    </a>
  );
}

// ── Sub-component: Screener Row ──
function ScreenerRow({ item, locale }: { item: ScreenerItem; locale: string }) {
  const sig = SIGNAL_CONFIG[item.overallSignal] || SIGNAL_CONFIG.neutral;
  const companyName = locale === 'ar'
    ? (item.company?.nameAr || item.company?.name || item.symbol)
    : locale === 'fr'
    ? (item.company?.nameFr || item.company?.name || item.symbol)
    : (item.company?.name || item.symbol);
  const isPositive = item.changePercent >= 0;

  return (
    <a
      href={`${getLocalePath(locale as any)}/stock-analysis/${item.symbol}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
        borderRadius: 'var(--r)', background: 'var(--bg4)',
        textDecoration: 'none', cursor: 'pointer', transition: 'background .15s',
      }}
    >
      <span style={{
        fontSize: 11, fontWeight: 800, color: 'var(--cyan)', minWidth: 48,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
      }}>
        {item.symbol}
      </span>
      <span style={{
        fontSize: 11, color: 'var(--text3)', flex: 1, minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
      }}>
        {companyName}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
        background: sig.bg, color: sig.color, border: `1px solid ${sig.border}`,
      }}>
        {getSignalLabel(item.overallSignal, locale)}
      </span>
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: isPositive ? 'var(--bull)' : 'var(--bear)',
        fontFamily: 'var(--font-jetbrains-mono), monospace', minWidth: 55, textAlign: 'right' as const,
      }}>
        {isPositive ? '+' : ''}{item.changePercent?.toFixed(2)}%
      </span>
    </a>
  );
}

// ── Sub-component: Sector Card ──
function SectorCard({ item, locale }: { item: SectorItem; locale: string }) {
  const t = LABELS[locale] || LABELS.en;
  const isPositive = item.avgChange >= 0;
  const sectorIcon = getSectorIcon(item.sector);

  function getSectorIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('tech')) return '💻';
    if (n.includes('health') || n.includes('pharma')) return '🏥';
    if (n.includes('financ') || n.includes('bank')) return '🏦';
    if (n.includes('energy') || n.includes('oil')) return '⚡';
    if (n.includes('consumer') && n.includes('cycl')) return '🛍️';
    if (n.includes('consumer') && n.includes('def')) return '🛒';
    if (n.includes('industr')) return '🏭';
    if (n.includes('basic') || n.includes('material') || n.includes('mining')) return '⛏️';
    if (n.includes('utilit')) return '💡';
    if (n.includes('commun') || n.includes('media')) return '📡';
    if (n.includes('real') || n.includes('estate')) return '🏠';
    if (n.includes('etf')) return '📊';
    return '📈';
  }

  return (
    <a
      href={`${getLocalePath(locale as any)}/stock-analysis/sectors/${encodeURIComponent(item.sector)}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
        borderRadius: 'var(--r)', background: 'var(--bg4)',
        textDecoration: 'none', cursor: 'pointer', transition: 'background .15s',
      }}
    >
      <span style={{ fontSize: 18 }}>{sectorIcon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-head)', display: 'block' }}>{item.sector}</span>
        <span style={{ fontSize: 10, color: 'var(--text4)' }}>{item.stockCount} {t.stocks}</span>
      </div>
      <div style={{ textAlign: 'right' as const }}>
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: isPositive ? 'var(--bull)' : 'var(--bear)',
          fontFamily: 'var(--font-jetbrains-mono), monospace', display: 'block',
        }}>
          {isPositive ? '+' : ''}{item.avgChange.toFixed(2)}%
        </span>
        <span style={{ fontSize: 9, color: 'var(--text4)' }}>{t.avgChange}</span>
      </div>
    </a>
  );
}

// ── Main Component ──
interface StockCompanyAnalysisSectionProps {
  locale: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export default function StockCompanyAnalysisSection({ locale }: StockCompanyAnalysisSectionProps) {
  const t = LABELS[locale] || LABELS.en;
  const isRTL = locale === 'ar';

  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [screenerData, setScreenerData] = useState<ScreenerItem[]>([]);
  const [sectors, setSectors] = useState<SectorItem[]>([]);
  const [loading, setLoading] = useState(true);

  // V410: Fetch with retry on 429 (rate limit) — backs off progressively
  async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const res = await fetch(url);
      if (res.status !== 429) return res;
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
    return fetch(url); // Final attempt without retry
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [analysesRes, screenerRes, sectorsRes] = await Promise.allSettled([
          fetchWithRetry(`/api/stock-analysis?action=list&locale=${locale}&limit=5`),
          fetchWithRetry(`/api/stock-analysis?action=screener&locale=${locale}&limit=10`),
          fetchWithRetry(`/api/stock-analysis/sectors?locale=${locale}`),
        ]);

        if (analysesRes.status === 'fulfilled' && analysesRes.value.ok) {
          try {
            const data = await analysesRes.value.json();
            if (data.analyses) setAnalyses(data.analyses.slice(0, 5));
          } catch {}
        }

        if (screenerRes.status === 'fulfilled' && screenerRes.value.ok) {
          try {
            const data = await screenerRes.value.json();
            if (data.analyses) setScreenerData(data.analyses.slice(0, 10));
          } catch {}
        }

        if (sectorsRes.status === 'fulfilled' && sectorsRes.value.ok) {
          try {
            const data = await sectorsRes.value.json();
            if (data.sectors) {
              const translated = data.sectors.slice(0, 5).map((s: any) => ({
                ...s,
                sector: translateSectorToLocale(s.sector, locale),
              }));
              setSectors(translated);
            }
          } catch {}
        }
      } catch (err) {
        console.error('[StockCompanyAnalysisSection] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [locale]);

  // Skeleton for loading state
  const skeletonRow = (w: string) => (
    <div style={{ display: 'flex', gap: 8, padding: '8px 0' }}>
      <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: 'var(--r)' }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: w, height: '13px', borderRadius: 4, marginBottom: 4 }} />
        <div className="skeleton" style={{ width: '50%', height: '10px', borderRadius: 4 }} />
      </div>
    </div>
  );

  return (
    <section style={{ marginBottom: 'var(--space-lg)' }} className="px-2 sm:px-0">
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 4, height: 22, borderRadius: 2,
            background: 'linear-gradient(180deg, var(--cyan), var(--purple))',
            boxShadow: '0 0 12px rgba(0,229,255,.35)',
          }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-head)', letterSpacing: 0.3 }}>
            {t.sectionTitle}
          </span>
        </div>
      </div>

      {/* 3-Column Grid — Responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch" style={{ gap: 'var(--space-md)' }}>

        {/* Column 1: Stock Analysis */}
        <div className="glass-card" style={{
          background: 'var(--bg2)', borderRadius: 'var(--r2)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 0 24px rgba(0,229,255,0.06)',
        }}>
          <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.stockAnalysis}</span>
              </div>
              <a href={`${getLocalePath(locale)}/stock-analysis`} style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 700, textDecoration: 'none', opacity: 0.85 }}>
                {t.viewAll} {t.arrowLeft}
              </a>
            </div>

            {/* Analysis Cards */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {Array.from({ length: 5 }).map((_, i) => skeletonRow('80%'))}
              </div>
            ) : analyses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {analyses.map(item => (
                  <AnalysisCard key={item.id} item={item} locale={locale} />
                ))}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)', textAlign: 'center' as const }}>{t.noAnalyses}</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Stock Scanner */}
        <div className="glass-card" style={{
          background: 'var(--bg2)', borderRadius: 'var(--r2)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 0 24px rgba(139,92,246,0.06)',
        }}>
          <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.stockScreener}</span>
              </div>
              <a href={`${getLocalePath(locale)}/stock-analysis/screener`} style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 700, textDecoration: 'none', opacity: 0.85 }}>
                {t.viewAll} {t.arrowLeft}
              </a>
            </div>

            {/* Screener Rows */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                {Array.from({ length: 10 }).map((_, i) => skeletonRow('60%'))}
              </div>
            ) : screenerData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto', maxHeight: 420 }} className="custom-scrollbar max-md:max-h-[280px]">
                {screenerData.map(item => (
                  <ScreenerRow key={item.id} item={item} locale={locale} />
                ))}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)', textAlign: 'center' as const }}>{t.noScreener}</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Sector Analysis */}
        <div className="glass-card" style={{
          background: 'var(--bg2)', borderRadius: 'var(--r2)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 0 24px rgba(255,184,0,0.06)',
        }}>
          <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(255,184,0,.12)', border: '1px solid rgba(255,184,0,.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.sectorAnalysis}</span>
              </div>
              <a href={`${getLocalePath(locale)}/stock-analysis/sectors`} style={{ fontSize: 12, color: '#FFB800', fontWeight: 700, textDecoration: 'none', opacity: 0.85 }}>
                {t.viewAll} {t.arrowLeft}
              </a>
            </div>

            {/* Sector Cards */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {Array.from({ length: 5 }).map((_, i) => skeletonRow('70%'))}
              </div>
            ) : sectors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {sectors.map(item => (
                  <SectorCard key={item.sector} item={item} locale={locale} />
                ))}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)', textAlign: 'center' as const }}>{t.noSectors}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
