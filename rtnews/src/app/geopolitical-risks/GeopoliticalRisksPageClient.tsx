'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getRiskLevel, getRiskColor, getRiskLabel } from '@/lib/geopolitical/risk-thresholds';
import { t, timeAgoLocalized } from '@/lib/geopolitical/i18n';

// V1025: LazySection — wrapper that delays loading heavy components until
// the user scrolls near them. This prevents ALL 10+ heavy geopolitical
// components (RiskMap, AIScenarioTree, BayesianEscalationLadder, etc.)
// from loading at once on page open, which was causing 5+ second load times.
// Now they load only when scrolled into view (with 200px rootMargin).
function LazySection({ children, minHeight = 300 }: { children: React.ReactNode; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading 200px before entering viewport
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!visible) {
    return <div ref={ref} style={{ minHeight }} className="animate-pulse rounded-xl" />;
  }
  return <>{children}</>;
}

// ─── Dynamic imports for heavy components (code-split, lazy loaded) ──
// These components are not needed for initial render and can be loaded
// after the page is interactive, reducing First Load JS significantly.

const RiskMap = dynamic(() => import('@/components/geopolitical/RiskMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center" style={{ minHeight: '250px', color: 'var(--text4)' }}>
      <div className="text-center">
        <div className="animate-pulse" style={{ fontSize: '28px', marginBottom: '8px' }}>🗺️</div>
        <span className="text-xs">...</span>
      </div>
    </div>
  ),
});

const RiskScoreGauge = dynamic(() => import('@/components/geopolitical/RiskScoreGauge'), {
  loading: () => <div style={{ height: '120px' }} className="animate-pulse rounded-lg" />,
});

const RiskCategoryCards = dynamic(() => import('@/components/geopolitical/RiskCategoryCards'), {
  loading: () => <div style={{ height: '80px' }} className="animate-pulse rounded-lg" />,
});

const MarketImpactBar = dynamic(() => import('@/components/geopolitical/MarketImpactBar'), {
  loading: () => <div style={{ height: '60px' }} className="animate-pulse rounded-lg" />,
});

const GeopoliticalRiskBadge = dynamic(() => import('@/components/geopolitical/GeopoliticalRiskBadge'), {
  loading: () => <span className="inline-block w-16 h-5 animate-pulse rounded-full" />,
});

// ─── Revolutionary Feature Components (lazy-loaded, deferred via IntersectionObserver) ──────
const BayesianEscalationLadder = dynamic(() => import('@/components/geopolitical/BayesianEscalationLadder'), {
  loading: () => <div style={{ height: '300px' }} className="animate-pulse rounded-xl" />,
});

const RiskContagionMap = dynamic(() => import('@/components/geopolitical/RiskContagionMap'), {
  ssr: false,
  loading: () => <div style={{ height: '400px' }} className="animate-pulse rounded-xl" />,
});

const SupplyChainResilienceIndex = dynamic(() => import('@/components/geopolitical/SupplyChainResilienceIndex'), {
  loading: () => <div style={{ height: '300px' }} className="animate-pulse rounded-xl" />,
});

const AIScenarioTree = dynamic(() => import('@/components/geopolitical/AIScenarioTree'), {
  ssr: false,
  loading: () => <div style={{ height: '350px' }} className="animate-pulse rounded-xl" />,
});

const SentimentDashboard = dynamic(() => import('@/components/geopolitical/SentimentDashboard'), {
  loading: () => <div style={{ height: '300px' }} className="animate-pulse rounded-xl" />,
});

const EconomicImpactPanel = dynamic(() => import('@/components/geopolitical/EconomicImpactPanel'), {
  loading: () => <div style={{ height: '300px' }} className="animate-pulse rounded-xl" />,
});

const GNNCorrelationGraph = dynamic(() => import('@/components/geopolitical/GNNCorrelationGraph'), {
  ssr: false,
  loading: () => <div style={{ height: '350px' }} className="animate-pulse rounded-xl" />,
});

const ConfidenceIntervalBadge = dynamic(() => import('@/components/geopolitical/ConfidenceIntervalBadge'), {
  loading: () => <span className="inline-block w-20 h-8 animate-pulse rounded-lg" />,
});

// ─── Types ──────────────────────────────────────────────────────

interface GeoRisk {
  id: string;
  title: string;
  slug: string;
  summary: string;
  riskCategory: string;
  riskLevel: string;
  riskScore: number;
  aiGprScore: number | null;
  acledEventCount: number;
  acledFatalityCount: number;
  worldBankStability: number | null;
  gdeltTone: number | null;
  affectedRegions: string[];
  affectedCountries: any[];
  affectedAssets: any[];
  scenarios: any;
  tradeRoutes: any[];
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

interface CountryRisk {
  id: string;
  countryCode: string;
  countryNameAr: string;
  countryNameEn: string;
  compositeScore: number;
  gprScore: number | null;
  aiGprScore: number | null;
  acledScore: number | null;
  worldBankScore: number | null;
  gdeltScore: number | null;
  peaceIndexScore: number | null;
  riskLevel: string;
  riskCategory: string;
  region: string;
  subRegion: string | null;
  latitude: number | null;
  longitude: number | null;
  updatedAt: string;
}

interface GeoEvent {
  id: string;
  eventId: string;
  source: string;
  eventType: string;
  actor1: string | null;
  actor2: string | null;
  country: string;
  countryCode: string;
  region: string | null;
  latitude: number;
  longitude: number;
  fatalities: number;
  notes: string | null;
  sourceUrl: string | null;
  eventDate: string;
  gdeltTone: number | null;
  importedAt: string;
}

interface Props {
  risks: GeoRisk[];
  topCountries: CountryRisk[];
  recentEvents: GeoEvent[];
  eventsByCountry: Record<string, number>;
  usingRealtimeData?: boolean;
  locale?: string;
}

// ─── Extracted Style Constants ──────────────────────────────────
// Prevents new object creation on every render — React can skip
// reconciliation when style references are stable across renders.

const S = {
  // Hero
  heroPadding: { padding: '32px 0 0' } as const,
  heroInner: { paddingInline: 'clamp(16px, 3vw, 48px)' } as const,
  heroCard: { padding: '28px 32px', background: 'linear-gradient(135deg, rgba(239,83,80,.06), rgba(255,184,0,.03))' } as const,
  heroIcon: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,83,80,.12)', border: '1px solid rgba(239,83,80,.2)', fontSize: '22px' } as const,
  realtimeDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--bull)', display: 'inline-block' } as const,
  // Links
  mapLink: { background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.15)', color: 'var(--cyan)' } as const,
  scenarioLink: { background: 'var(--gold2)', border: '1px solid rgba(255,184,0,.15)', color: 'var(--gold)' } as const,
  // Content
  contentPadding: { paddingInline: 'clamp(16px, 3vw, 48px)' } as const,
  scoreCard: { padding: '24px', background: 'linear-gradient(135deg, rgba(239,83,80,.04), var(--surface-1))' } as const,
  mapCard: { padding: '20px', minHeight: '300px' } as const,
  // Sidebar
  sidebarGlass: { padding: '20px' } as const,
  scenarioTeaser: { padding: '20px', background: 'linear-gradient(135deg, rgba(255,184,0,.04), var(--surface-1))', borderInlineStart: '3px solid var(--gold)' } as const,
  runScenariosBtn: { background: 'var(--gold)', color: '#000', fontWeight: 700 } as const,
  // Tags
  cyanTag: { background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,.12)' } as const,
  goldTag: { background: 'var(--gold2)', color: 'var(--gold)', border: '1px solid rgba(255,184,0,.15)' } as const,
  // Country row
  countryIdx: { fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text4)', width: '18px' } as const,
  scoreBarTrack: { width: '32px', height: '3px', borderRadius: '2px', background: 'var(--surface-2)', overflow: 'hidden' } as const,
  // Risk card
  riskBarTrack: { width: '40px', height: '4px', borderRadius: '2px', background: 'var(--surface-2)', overflow: 'hidden' } as const,
  riskScoreText: { fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700 } as const,
  dateText: { fontSize: '10px', color: 'var(--text4)' } as const,
  // Events
  eventsGrid: { background: 'var(--surface-2)' } as const,
  // Advanced
  advancedIcon: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(139,92,246,.15), rgba(59,130,246,.15))', border: '1px solid rgba(139,92,246,.25)', fontSize: '18px' } as const,
  ciCard: { padding: '20px', background: 'linear-gradient(135deg, rgba(34,197,94,.04), var(--surface-1))' } as const,
  // Map loading
  mapLoading: { minHeight: '250px', color: 'var(--text4)' } as const,
  // Empty state
  emptyState: { padding: '60px', minHeight: '200px' } as const,
  // View all link
  viewAllLink: { color: 'var(--cyan)', background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.12)' } as const,
  // Scrollable
  scrollable: { scrollbarWidth: 'thin' } as const,
  // Border bottom
  borderBottom: { borderBottom: '1px solid var(--rim)' } as const,
  // Details link
  detailsLink: { color: 'var(--cyan)', background: 'var(--cyan2)' } as const,
} as const;

// ─── Constants ──────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  conflict: '⚔️',
  trade: '📦',
  energy: '⚡',
  political: '🏛️',
  cyber: '🖥️',
  sanctions: '🚫',
  climate: '🌊',
};

// ─── IntersectionObserver Hook ──────────────────────────────────
// Defers loading of heavy sections (map, advanced analytics) until
// they are about to scroll into view, saving ~2MB of initial JS.
function useLazyVisible(rootMargin = '200px') {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin, threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, visible };
}

// ─── Main Component ─────────────────────────────────────────────

export default function GeopoliticalRisksPageClient({
  risks,
  topCountries,
  recentEvents,
  eventsByCountry,
  usingRealtimeData = false,
  locale = 'ar',
}: Props) {
  const [mounted, setMounted] = useState(false);

  // Advanced analytics is OFF by default — user must click to expand
  // This prevents 8 heavy components + ~2MB JS from loading on page open
  const [showAdvanced, setShowAdvanced] = useState(false);

  // IntersectionObserver hooks — defer heavy sections until visible
  const mapLazy = useLazyVisible();

  useEffect(() => {
    setMounted(true);
    window.scrollTo(0, 0);
  }, []);

  // i18n helpers — stable references
  const localePrefix = locale === 'ar' ? '' : `/${locale}`;
  const getCategoryLabel = useCallback((cat: string) => t(`category.${cat}`, locale), [locale]);

  // Memoize all derived data to prevent cascading re-renders
  const globalScore = useMemo(() =>
    risks.length > 0
      ? Math.round(risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length)
      : 50,
    [risks]
  );

  const globalRiskLevel = useMemo(() => getRiskLevel(globalScore), [globalScore]);
  const globalRiskColor = useMemo(() => getRiskColor(globalScore), [globalScore]);
  const globalRiskLabel = useMemo(() => getRiskLabel(globalScore, locale), [globalScore, locale]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of risks) counts[r.riskCategory] = (counts[r.riskCategory] || 0) + 1;
    return counts;
  }, [risks]);

  // Memoize category cards data — prevents RiskCategoryCards re-renders
  const categoryCardsData = useMemo(() =>
    Object.entries(categoryCounts).map(([category, count]) => ({
      category: category as any,
      score: Math.round(risks.filter(r => r.riskCategory === category).reduce((s, r) => s + r.riskScore, 0) / count),
      trend: 'stable' as const,
    })),
    [categoryCounts, risks]
  );

  // Memoize map props — prevents RiskMap re-renders
  const mapCountryScores = useMemo(() =>
    topCountries.map(c => ({ countryCode: c.countryCode, score: c.compositeScore })),
    [topCountries]
  );

  const mapEvents = useMemo(() =>
    recentEvents.slice(0, 100).map(e => ({ lat: e.latitude, lng: e.longitude, type: e.eventType, fatalities: e.fatalities, date: e.eventDate, title: e.notes || undefined })),
    [recentEvents]
  );

  // Lazy-load disrupted routes (only when needed)
  const [disruptedRoutes, setDisruptedRoutes] = useState<any[]>([]);
  useEffect(() => {
    if (mounted) {
      import('@/lib/geopolitical/trade-routes-data').then(({ getDisruptedRoutes }) => {
        setDisruptedRoutes(getDisruptedRoutes());
      });
    }
  }, [mounted]);

  // Lazy-load market impact (only when needed)
  const [marketImpacts, setMarketImpacts] = useState<any[]>([]);
  useEffect(() => {
    if (mounted && risks.length > 0) {
      import('@/lib/geopolitical/market-impact').then(({ calculateMarketImpact, GEOPOLITICAL_AFFECTED_ASSETS }) => {
        const impacts = risks.length > 0
          ? calculateMarketImpact(risks[0].riskCategory, globalScore).map(a => ({ symbol: a.symbol, name: a.nameAr, change: a.expectedImpact, direction: a.direction }))
          : GEOPOLITICAL_AFFECTED_ASSETS.map(a => ({ symbol: a.symbol, name: a.nameAr, change: 0, direction: a.direction as 'bullish' | 'bearish' | 'neutral' }));
        setMarketImpacts(impacts);
      });
    }
  }, [mounted, risks, globalScore]);

  // Memoize top 6 risks for display
  const displayRisks = useMemo(() => risks.slice(0, 6), [risks]);

  // Memoize countries count
  const countriesCount = useMemo(() => Object.keys(eventsByCountry).length, [eventsByCountry]);

  return (
    <main className="min-h-screen pb-mobile-safe" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* ═══ HERO HEADER ═══ */}
      <div className="relative" style={S.heroPadding}>
        <div className="max-w-[1280px] mx-auto" style={S.heroInner}>
          <div className="glass-card" style={S.heroCard}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div style={S.heroIcon}>
                    🌐
                  </div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-head)' }}>
                    {t('dashboard.title', locale)}
                  </h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--text2)' }}>
                  {t('dashboard.description', locale)}
                </p>
                {usingRealtimeData && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span style={S.realtimeDot} />
                    <span className="text-[10px]" style={{ color: 'var(--bull)' }}>
                      {t('dashboard.realtimeBadge', locale)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`${localePrefix}/geopolitical-risks/map`}
                  className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg transition-all"
                  style={S.mapLink}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  {t('dashboard.interactiveMap', locale)}
                </Link>
                <Link
                  href={`${localePrefix}/geopolitical-risks/scenarios`}
                  className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg transition-all"
                  style={S.scenarioLink}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                  </svg>
                  {t('dashboard.scenarios', locale)}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-[1280px] mx-auto py-6" style={S.contentPadding}>

        {/* ─── GLOBAL SCORE + GAUGE ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-1 glass-card" style={S.scoreCard}>
            <RiskScoreGauge score={globalScore} locale={locale} />
            <div className="text-center mt-3">
              <div className="text-xs mb-1" style={{ color: 'var(--text3)' }}>{t('dashboard.globalRiskLevel', locale)}</div>
              <div className="text-lg font-bold" style={{ color: globalRiskColor }}>
                {globalRiskLabel}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card" style={S.mapCard} ref={mapLazy.ref}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>{t('dashboard.riskMap', locale)}</h3>
            </div>
            {mounted && mapLazy.visible ? (
              <RiskMap
                countryScores={mapCountryScores}
                events={mapEvents}
                locale={locale}
              />
            ) : (
              <div className="flex items-center justify-center" style={S.mapLoading}>
                <div className="text-center">
                  <div className="animate-pulse" style={{ fontSize: '28px', marginBottom: '8px' }}>🗺️</div>
                  <span className="text-xs">{t('dashboard.loadingMap', locale)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── RISK CATEGORY CARDS ─── */}
        <div className="mb-6">
          <RiskCategoryCards locale={locale} categories={categoryCardsData} />
        </div>

        {/* ─── MARKET IMPACT BAR ─── */}
        <div className="mb-6">
          <MarketImpactBar locale={locale} impacts={marketImpacts} />
        </div>

        {/* ─── LATEST ANALYSES + SIDEBAR ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

          {/* Latest Analyses */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-head)' }}>{t('dashboard.latestAnalyses', locale)}</h2>
              </div>
              <Link
                href={`${localePrefix}/geopolitical-risks/reports`}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={S.viewAllLink}
              >
                {t('dashboard.viewAll', locale)}
              </Link>
            </div>

            {risks.length === 0 ? (
              <div className="glass-card flex items-center justify-center" style={S.emptyState}>
                <div className="text-center">
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌐</div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text3)' }}>
                    {t('dashboard.noAnalyses', locale)}
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'var(--text4)' }}>
                    {t('dashboard.autoGenerated', locale)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayRisks.map((risk) => {
                  const riskColor = getRiskColor(risk.riskScore);
                  const categoryIcon = CATEGORY_ICONS[risk.riskCategory] || '📌';
                  const categoryLabel = getCategoryLabel(risk.riskCategory);

                  return (
                    <Link
                      key={risk.id}
                      href={`${localePrefix}/geopolitical-risks/${risk.slug}`}
                      className="glass-card group transition-all duration-300 hover:-translate-y-1"
                      style={{
                        padding: '20px',
                        borderInlineStart: `3px solid ${riskColor}`,
                        background: `linear-gradient(135deg, ${riskColor}08, var(--surface-1))`,
                        textDecoration: 'none',
                      }}
                    >
                      {/* Tags Row */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <GeopoliticalRiskBadge score={risk.riskScore} level={risk.riskLevel} locale={locale} />
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={S.cyanTag}>
                          {categoryIcon} {categoryLabel}
                        </span>
                        {risk.scenarios && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={S.goldTag}>
                            {t('dashboard.scenariosTag', locale)}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-[15px] font-bold mb-2 line-clamp-2 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)' }}>
                        {risk.title}
                      </h4>

                      {/* Summary */}
                      {risk.summary && (
                        <p className="text-[12px] line-clamp-2 mb-3" style={{ color: 'var(--text3)' }}>
                          {risk.summary}
                        </p>
                      )}

                      {/* Score & Date */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          <div style={S.riskBarTrack}>
                            <div style={{
                              width: `${risk.riskScore}%`, height: '100%',
                              borderRadius: '2px', background: riskColor,
                              transition: 'width 0.3s',
                            }} />
                          </div>
                          <span style={{ ...S.riskScoreText, color: riskColor }}>
                            {risk.riskScore}
                          </span>
                        </div>
                        <span style={S.dateText}>
                          {risk.publishedAt ? timeAgoLocalized(risk.publishedAt, locale) : ''}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Scenario Teaser */}
            <div className="glass-card" style={S.scenarioTeaser}>
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>{t('dashboard.scenarioEngine', locale)}</h3>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--text3)' }}>
                {t('dashboard.scenarioDesc', locale)}
              </p>
              <Link
                href={`${localePrefix}/geopolitical-risks/scenarios`}
                className="flex items-center justify-center gap-2 text-xs w-full px-4 py-2.5 rounded-lg transition-all"
                style={S.runScenariosBtn}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {t('dashboard.runScenarios', locale)}
              </Link>
            </div>

            {/* Top Risk Countries */}
            <div className="glass-card" style={S.sidebarGlass}>
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>{t('dashboard.topRiskCountries', locale)}</h3>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto" style={S.scrollable}>
                {topCountries.map((country, idx) => {
                  const scoreColor = getRiskColor(country.compositeScore);
                  return (
                    <div key={country.id} className="flex items-center justify-between py-2" style={S.borderBottom}>
                      <div className="flex items-center gap-2">
                        <span style={S.countryIdx}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                          {locale === 'ar' ? country.countryNameAr : country.countryNameEn}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div style={S.scoreBarTrack}>
                          <div style={{ width: `${country.compositeScore}%`, height: '100%', borderRadius: '2px', background: scoreColor }} />
                        </div>
                        <span style={{ ...S.riskScoreText, color: scoreColor }}>
                          {country.compositeScore}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trade Route Status */}
            <div className="glass-card" style={S.sidebarGlass}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>{t('dashboard.tradeRoutes', locale)}</h3>
                </div>
                <Link
                  href={`${localePrefix}/geopolitical-risks/trade-routes`}
                  className="text-[10px] px-2 py-1 rounded"
                  style={S.detailsLink}
                >
                  {t('dashboard.details', locale)}
                </Link>
              </div>
              <div className="space-y-2">
                {disruptedRoutes.length > 0 ? disruptedRoutes.slice(0, 5).map((route: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-1.5" style={S.borderBottom}>
                    <span className="text-xs" style={{ color: 'var(--text)' }}>
                      {route.nameAr || route.name || route.id}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
                      background: route.status === 'disrupted' ? 'var(--bear2)' : route.status === 'elevated' ? 'var(--gold2)' : 'var(--bull2)',
                      color: route.status === 'disrupted' ? 'var(--bear)' : route.status === 'elevated' ? 'var(--gold)' : 'var(--bull)',
                      border: `1px solid ${route.status === 'disrupted' ? 'rgba(239,83,80,.2)' : route.status === 'elevated' ? 'rgba(255,184,0,.2)' : 'rgba(34,197,94,.2)'}`,
                    }}>
                      {t(`status.${route.status}`, locale)}
                    </span>
                  </div>
                )) : (
                  <div className="text-center py-4">
                    <p className="text-xs" style={{ color: 'var(--text4)' }}>{t('dashboard.noDisruptions', locale)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Events Summary */}
            <div className="glass-card" style={S.sidebarGlass}>
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bull)" strokeWidth="1.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>{t('dashboard.last7Days', locale)}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 rounded-lg" style={S.eventsGrid}>
                  <div className="text-lg font-bold" style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                    {recentEvents.length}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('dashboard.event', locale)}</div>
                </div>
                <div className="text-center p-2 rounded-lg" style={S.eventsGrid}>
                  <div className="text-lg font-bold" style={{ color: 'var(--bear)', fontFamily: 'var(--font-mono)' }}>
                    {countriesCount}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('dashboard.country', locale)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ ADVANCED ANALYTICS — Collapsed by default (opt-in) ═══ */}
        {/* This section contains 8 heavy components (~2MB JS) that consume
            significant CPU/GPU. It is OFF by default — the user must click
            to expand. This eliminates resource consumption for 90%+ of users
            who only need the basic risk dashboard. */}
        <div className="mb-8">
          {/* Section Header with expand/collapse toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between gap-3 mb-4 glass-card p-4 transition-all hover:brightness-110"
            style={{ cursor: 'pointer', textAlign: 'start' as const }}
          >
            <div className="flex items-center gap-3">
              <div style={S.advancedIcon}>
                🧠
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-head)' }}>
                  {t('dashboard.advancedAnalytics', locale)}
                </h2>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>
                  {t('dashboard.advancedAnalyticsDesc', locale)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--gold2)', color: 'var(--gold)', border: '1px solid rgba(255,184,0,.15)' }}>
                {showAdvanced
                  ? (locale === 'ar' ? 'إخفاء' : 'Hide')
                  : (locale === 'ar' ? 'عرض' : 'Show')}
              </span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"
                style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </button>

          {/* Only render when user explicitly clicks Show */}
          {showAdvanced && (
          <>
            {/* Confidence Intervals */}
            <div className="mb-6 glass-card" style={S.ciCard}>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: '16px' }}>📊</span>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>
                  {t('dashboard.confidenceIntervals', locale)}
                </h3>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <p className="text-xs mb-1" style={{ color: 'var(--text3)' }}>
                    {t('dashboard.globalCompositeScore', locale)}
                  </p>
                  <ConfidenceIntervalBadge score={globalScore} uncertainty={0.25} locale={locale} size="lg" />
                </div>
                {topCountries.slice(0, 4).map(country => (
                  <div key={country.id} className="text-center">
                    <p className="text-xs mb-1" style={{ color: 'var(--text3)' }}>
                      {locale === 'ar' ? country.countryNameAr : country.countryNameEn}
                    </p>
                    <ConfidenceIntervalBadge score={country.compositeScore} locale={locale} size="md" showRange={false} />
                  </div>
                ))}
              </div>
              <p className="text-[10px] mt-3" style={{ color: 'var(--text3)' }}>
                {t('dashboard.ciDisclaimer', locale)}
              </p>
            </div>

            {/* Row 1: AI Scenario Tree + Bayesian Escalation */}
            {/* V1025: Wrapped in LazySection — these 1200+ line components
                only load when the user scrolls down to them, not on page open */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <LazySection minHeight={350}>
                <AIScenarioTree locale={locale} />
              </LazySection>
              <LazySection minHeight={300}>
                <BayesianEscalationLadder locale={locale} />
              </LazySection>
            </div>

            {/* Row 2: SIR Contagion Map */}
            <div className="mb-4">
              <LazySection minHeight={400}>
                <RiskContagionMap locale={locale} />
              </LazySection>
            </div>

            {/* Row 3: Sentiment + Economic Impact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <LazySection minHeight={300}>
                <SentimentDashboard locale={locale} />
              </LazySection>
              <LazySection minHeight={300}>
                <EconomicImpactPanel locale={locale} />
              </LazySection>
            </div>

            {/* Row 4: Supply Chain Resilience + GNN Correlation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LazySection minHeight={300}>
                <SupplyChainResilienceIndex locale={locale} />
              </LazySection>
              <LazySection minHeight={350}>
                <GNNCorrelationGraph locale={locale} />
              </LazySection>
            </div>
          </>
          )}
        </div>

        {/* ─── NAVIGATION CARDS ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { href: `${localePrefix}/geopolitical-risks/map`, icon: '🗺️', label: t('nav.riskMap', locale), color: 'var(--cyan)' },
            { href: `${localePrefix}/geopolitical-risks/heatmap`, icon: '🔥', label: t('nav.heatmap', locale), color: 'var(--bear)' },
            { href: `${localePrefix}/geopolitical-risks/trade-routes`, icon: '🚢', label: t('nav.tradeRoutes', locale), color: 'var(--gold)' },
            { href: `${localePrefix}/geopolitical-risks/reports`, icon: '📊', label: t('nav.reports', locale), color: 'var(--bull)' },
          ].map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className="glass-card flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5"
              style={{ textDecoration: 'none', borderInlineStart: `2px solid ${nav.color}` }}
            >
              <span style={{ fontSize: '24px' }}>{nav.icon}</span>
              <span className="text-xs font-semibold" style={{ color: nav.color }}>{nav.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
