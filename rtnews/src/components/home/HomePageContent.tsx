// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { InfographicData } from '@/components/infographics/types';
import StockCompanyAnalysisSection from '@/components/home/StockCompanyAnalysisSection';
import HomeVideosSection from '@/components/home/HomeVideosSection';
import TechnicalAnalysesHomeSection from '@/components/home/TechnicalAnalysesHomeSection';
import QuickInsightCards from '@/components/home/QuickInsightCards';
import GlobalRiskPulse from '@/components/home/GlobalRiskPulse';

// Dynamic import for InfographicCard (echarts) — saves ~200-400KB off homepage bundle
const InfographicCard = dynamic(() => import('@/components/infographics/InfographicCard'));

// ── Isolated UTC Clock — prevents re-rendering entire page every second ──
const UtcClock = memo(function UtcClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      if (document.hidden) return; // Skip when tab is hidden
      setTime(new Date().toUTCString().slice(17, 25));
    };
    tick();
    // V1024: Update every 5s instead of 1s — UTC time doesn't need second-precision
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono-price" style={{ fontSize: 13, color: 'var(--cyan)' }}>UTC {time}</span>;
});


/* ══════════════════════════════════════════════════════════════════════
   REUSED STYLE CONSTANTS — extracted from inline styles to avoid
   creating new objects on every render (289 inline styles → constants)
   ══════════════════════════════════════════════════════════════════════ */
const STYLES = {
  flexBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as React.CSSProperties,
  flexStart: { display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
  flexCol: { display: 'flex', flexDirection: 'column' } as React.CSSProperties,
  flexColGap: { display: 'flex', flexDirection: 'column', gap: 8 } as React.CSSProperties,
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' } as React.CSSProperties,
  cardBg: { background: 'var(--bg2)', borderRadius: 'var(--r2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' } as React.CSSProperties,
  cardPadding: { flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' } as React.CSSProperties,
  title15: { fontSize: 15, fontWeight: 700, color: 'var(--text-head)' } as React.CSSProperties,
  text11: { fontSize: 11, color: 'var(--text3)' } as React.CSSProperties,
  text13: { fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 } as React.CSSProperties,
  badgeSmall: { fontSize: 10, padding: '1px 6px', borderRadius: 3, fontWeight: 700 } as React.CSSProperties,
  dot4: { width: 4, height: 4, borderRadius: '50%', flexShrink: 0 } as React.CSSProperties,
  newsSidebar: { background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column' } as React.CSSProperties,
  linkSmall: { fontSize: 12, fontWeight: 700, textDecoration: 'none' } as React.CSSProperties,
  iconBox28: { width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties,
};

/* ══════════════════════════════════════════════════════════════════════
   TYPES — All data comes from live APIs
   ══════════════════════════════════════════════════════════════════════ */

interface PriceItem {
  symbol: string;
  displaySymbol: string;
  nameAr: string;
  price: number;
  change: number;
  changePercent: number;
  category: string;
  decimals: number;
  source: string;
  sparkline?: number[]; // Real sparkline data from trading platform
}

interface SentimentData {
  fearGreedIndex: { value: number; label: string; labelAr: string };
  arabSentimentIndex: { value: number; label: string; topSearchedAsset: string; majorityVote: string };
  geopoliticalRiskIndex: { value: number; label: string; description: string; impacts: Record<string, { trend: string; value: string }> };
  aiPowered: boolean;
  aiSummary: string | null;
}

interface ArabMarketItem {
  id: string;
  name: string;
  nameEn: string;
  flag: string;
  country: string;
  region: string;
  value: number;
  change: number;
  sparkline: number[];
  timezone: string;
  openTime: string;
  closeTime: string;
  source: string;
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

interface NewsItem {
  id: string;
  slug?: string;
  href?: string;
  kind?: string;
  badge?: string;
  sourceName?: string;
  isOfficialSource?: boolean;
  title: string;
  titleAr?: string;
  summary?: string;
  summaryAr?: string;
  time: string;
  source: string;
  category: string;
  sentiment: string;
  sentimentScore: number;
  impactLevel: string;
  imageUrl?: string;
}

interface CentralBankItem {
  id: string;
  name: string;
  country: string;
  flag: string;
  currentRate: number;
  previousRate: number;
  nextMeetingDate: string;
  aiPrediction: string;
  aiConfidence: number;
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

interface MarketAnalysis {
  id: string;
  title: string;
  slug: string;
  assetClass: string;
  analysisType: string;
  timeFrame: string;
  riskLevel: string;
  sentiment: string;
  confidenceScore: number;
  publishedAt: string;
}

interface EconomicReport {
  id: string;
  title: string;
  slug: string;
  reportType: string;
  scope: string;
  marketImpact: string;
  confidenceScore: number;
  publishedAt: string;
}

interface InfographicItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category?: string;
  thumbnailUrl?: string;
  slides: any[];
  publishedAt?: string;
  createdAt: string;
}

const MONO = `var(--font-jetbrains-mono), monospace`;

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════ */

function fmtPrice(p: number, d: number) {
  return p.toFixed(d);
}

function stripStrategicPrefix(title: string): string {
  return title.replace(/^تقرير استراتيجي:\s*/i, '').replace(/^تقرير استراتيجي\s*[-–—:]\s*/i, '');
}

function timeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `${diffMin} د`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} س`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} ي`;
  } catch {
    return '';
  }
}

/** Format publication time for Arabic — e.g. "15 مايو · 10:30 ص" */
function formatPubTimeAr(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
      + ' · '
      + date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatEventTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  } catch {
    return '--:--';
  }
}

/** Convert real sparkline data (array of numbers) to SVG points string */
function realSparklinePoints(data: number[]): string {
  if (!data || data.length < 2) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const step = w / (data.length - 1);
  return data.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`).join(' ');
}

/**
 * Generate a simple trend line (no fake randomness — just a directional indicator)
 * Used when real sparkline data is unavailable from the trading platform.
 */
function trendLinePoints(positive: boolean): string {
  const w = 80;
  const h = 28;
  const mid = h / 2;
  const dir = positive ? -1 : 1;
  // Generate a realistic-looking 8-point trend with minor oscillations
  const pts: [number, number][] = [];
  for (let i = 0; i <= 7; i++) {
    const x = (i / 7) * w;
    const baseY = mid + dir * (i / 7) * 8;
    // Add small deterministic "noise" (sin-based so it's consistent)
    const noise = Math.sin(i * 1.7) * 2.5;
    pts.push([x, baseY + noise]);
  }
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

const Sparkline = memo(function Sparkline({ positive, data }: { positive: boolean; data?: number[] }) {
  const points = useMemo(() => {
    if (data && data.length >= 2) return realSparklinePoints(data);
    return trendLinePoints(positive);
  }, [data, positive]);

  if (!points) return null;

  const hasRealData = data && data.length >= 2;
  const color = positive ? 'var(--bull)' : 'var(--bear)';
  const colorRgb = positive ? '34,197,94' : '239,83,80';

  return (
    <svg viewBox="0 0 80 28" style={{ width: 80, height: 28 }}>
      {/* Subtle area fill under the line */}
      <polygon
        fill={`rgba(${colorRgb},0.08)`}
        points={`0,28 ${points} 80,28`}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={hasRealData ? 1.5 : 1}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={hasRealData ? 'none' : '4 2'}
        points={points}
      />
    </svg>
  );
});

/* Loading skeleton */
const Skeleton = memo(function Skeleton({ w, h }: { w: string; h: string }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: 'var(--r)' }} />;
});

/* NoData placeholder — compact to avoid unjustified empty space */
const NoData = memo(function NoData({ message }: { message?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 0', color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>
      {message || 'لا توجد بيانات متاحة'}
    </div>
  );
});

/* Section Header — gradient left border with title + optional link */
function SectionHeader({ title, linkText, linkHref }: { title: string; linkText?: string; linkHref?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 4, height: 22, borderRadius: 2, background: 'linear-gradient(180deg, var(--cyan), var(--purple))', boxShadow: '0 0 12px rgba(0,229,255,.35)' }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-head)', letterSpacing: 0.3 }}>{title}</span>
      </div>
      {linkText && linkHref && (
        <a href={linkHref} style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 700, textDecoration: 'none', opacity: 0.85, transition: 'opacity .15s' }}>
          {linkText} ←
        </a>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — Fetches ALL data from live APIs
   ══════════════════════════════════════════════════════════════════════ */

// V60: Accept ALL server-fetched data for instant SSR rendering
// No more client-side waterfall — users see a fully populated page immediately.
interface HomePageContentProps {
  initialNews?: any[];
  initialPrices?: any[];
  initialSparklines?: Record<string, number[]>;
  initialSentiment?: any;
  initialArabMarkets?: any[];
  initialCalendar?: any[];
  initialCentralBanks?: any[];
  initialCouncilBriefs?: any[];
  initialAnalyses?: any[];
  initialReports?: any[];
  initialStrategicReports?: any[];
  initialInfographics?: any[];
}

// Helper to merge sparklines into price items
function enrichPricesWithSparklines(prices: any[], sparklines: Record<string, number[]>): PriceItem[] {
  const tpSymbolMap: Record<string, string> = {
    'BTC': 'BTC-USDT', 'ETH': 'ETH-USDT', 'SOL': 'SOL-USDT',
    'XAU': 'XAU-USD', 'XAG': 'XAG-USD', 'WTI': 'CL-USD',
    'EUR': 'EUR-USD', 'GBP': 'GBP-USD', 'JPY': 'USD-JPY',
    'DXY': 'DXY-USD',
  };
  return prices.map((p: any) => {
    const tpSymbol = tpSymbolMap[p.symbol];
    const sparkline = tpSymbol ? sparklines[tpSymbol] : undefined;
    return { ...p, sparkline: sparkline && sparkline.length >= 2 ? sparkline : undefined } as PriceItem;
  });
}

export default function HomePageContent({
  initialNews = [],
  initialPrices = [],
  initialSparklines = {},
  initialSentiment = null,
  initialArabMarkets = [],
  initialCalendar = [],
  initialCentralBanks = [],
  initialCouncilBriefs = [],
  initialAnalyses = [],
  initialReports = [],
  initialStrategicReports = [],
  initialInfographics = [],
}: HomePageContentProps = {}) {
  // ── State for all live data — initialized from SSR data ──
  const [prices, setPrices] = useState<PriceItem[]>(() =>
    initialPrices.length > 0 ? enrichPricesWithSparklines(initialPrices, initialSparklines) : []
  );
  const [sentiment, setSentiment] = useState<SentimentData | null>(initialSentiment);
  const [arabMarkets, setArabMarkets] = useState<ArabMarketItem[]>(initialArabMarkets);
  const [calendar, setCalendar] = useState<CalendarEvent[]>(initialCalendar);
  const [news, setNews] = useState<NewsItem[]>(() => {
    if (initialNews && initialNews.length > 0) {
      return initialNews.map((n: any) => ({
        id: n.id, slug: n.slug, newsType: n.newsType || 'live',
        title: n.title || '', titleAr: n.titleAr,
        summary: n.summary || '', summaryAr: n.summaryAr,
        contentAr: n.contentAr, category: n.category || 'اقتصاد كلي',
        sentiment: n.sentiment || 'neutral', sentimentScore: n.sentimentScore || 55,
        impactLevel: n.impactLevel || 'low', source: n.source || '',
        sourceName: n.sourceName || n.source || '',
        url: n.url || '', imageUrl: n.imageUrl,
        href: n.href, kind: n.kind, badge: n.badge, isOfficialSource: n.isOfficialSource,
        time: n.time || n.fetchedAt,
        translatedTitle: n.translatedTitle || n.titleAr,
        translatedSummary: n.translatedSummary || n.summaryAr,
        hasFullContent: n.hasFullContent ?? true, aiAnalysis: n.aiAnalysis,
      }));
    }
    return [];
  });
  const [centralBanks, setCentralBanks] = useState<CentralBankItem[]>(initialCentralBanks);
  const [councilBriefs, setCouncilBriefs] = useState<CouncilBrief[]>(initialCouncilBriefs);
  const [analyses, setAnalyses] = useState<MarketAnalysis[]>(initialAnalyses);
  const [reports, setReports] = useState<EconomicReport[]>(initialReports);
  const [infographics, setInfographics] = useState<InfographicItem[]>(initialInfographics);
  const [strategicReports, setStrategicReports] = useState<EconomicReport[]>(initialStrategicReports);
  // V60: If we have SSR data, DON'T show loading state — data is already there!
  const hasServerData = initialNews.length > 0 || initialPrices.length > 0;
  const [loading, setLoading] = useState(!hasServerData);

  // ── UI state ──
  const [screenerTab, setScreenerTab] = useState<'buy' | 'sell' | 'hot'>('buy');
  const [moversTab, setMoversTab] = useState<'gainers' | 'losers'>('gainers');
  const [newsSlide, setNewsSlide] = useState(0);
  const [marketTab, setMarketTab] = useState<string>('الكل');

  // ── UTC Hour for market sessions — updates every minute (not every second) ──
  const [utcHour, setUtcHour] = useState(-1);
  useEffect(() => {
    const h = new Date().getUTCHours();
    setUtcHour(h);
    const id = setInterval(() => setUtcHour(new Date().getUTCHours()), 60000); // update every minute
    return () => clearInterval(id);
  }, []);

  // ── Background refresh — only if we don't have SSR data yet, or periodically ──
  // V60: With SSR, the page already has ALL data. This useEffect is for:
  // 1. Refreshing data periodically (stays fresh)
  // 2. Fallback if SSR failed (no server data)
  // V15: Skip initial fetch when SSR data exists to prevent duplicate requests.
  // Auto-refresh interval increased from 2→3 min to reduce API load.
  // Added 429 retry backoff to prevent cascading failures.
  useEffect(() => {
    let cancelled = false;
    const FETCH_TIMEOUT = 12_000; // 12 seconds

    // V15: Fetch with 429 retry backoff — wait and retry on rate limit
    async function fetchWithBackoff(url: string, timeout = FETCH_TIMEOUT, retries = 2): Promise<Response> {
      for (let attempt = 0; attempt <= retries; attempt++) {
        const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
        if (response.status === 429 && attempt < retries) {
          // Exponential backoff: 2s, 4s
          const waitMs = Math.pow(2, attempt + 1) * 1000;
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }
        return response;
      }
      return fetch(url, { signal: AbortSignal.timeout(timeout) });
    }

    async function fetchAllData() {
      // Only show loading skeleton if we have NO server data at all
      if (!hasServerData) setLoading(true);
      try {
        const [pricesRes, sentimentRes, arabRes, calendarRes, newsRes, banksRes, councilRes, analysesRes, reportsRes, strategicRes, infographicsRes] = await Promise.allSettled([
          fetchWithBackoff('/api/markets/prices?include=sparklines'),
          fetchWithBackoff('/api/markets/sentiment'),
          fetchWithBackoff('/api/markets/arab?region=arab&locale=ar'),
          fetchWithBackoff('/api/markets/calendar?locale=ar'),
          fetchWithBackoff('/api/news/live?limit=10&locale=ar'),
          fetchWithBackoff('/api/markets/central-banks'),
          fetchWithBackoff('/api/integration/council?mode=briefs'),
          fetchWithBackoff('/api/market-analyses?limit=6&locale=ar'),
          fetchWithBackoff('/api/reports?limit=3'),
          fetchWithBackoff('/api/reports?type=strategic&limit=4'),
          fetchWithBackoff('/api/infographics?published=true&limit=4&locale=ar'),
        ]);

        if (!cancelled) {
          // Prices — includes sparklines
          if (pricesRes.status === 'fulfilled' && pricesRes.value.ok) {
            try {
              const data = await pricesRes.value.json();
              if (data.prices) {
                const enriched = enrichPricesWithSparklines(data.prices, data.sparklines || {});
                setPrices(enriched);
              }
            } catch (err) { console.error('[HomePageContent] Prices parse error:', err); }
          }

          if (sentimentRes.status === 'fulfilled' && sentimentRes.value.ok) {
            try { const data = await sentimentRes.value.json(); setSentiment(data); } catch {}
          }
          if (arabRes.status === 'fulfilled' && arabRes.value.ok) {
            try { const data = await arabRes.value.json(); if (data.markets) setArabMarkets(data.markets); } catch {}
          }
          if (calendarRes.status === 'fulfilled' && calendarRes.value.ok) {
            try { const data = await calendarRes.value.json(); if (data.events) setCalendar(data.events); } catch {}
          }
          if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
            try { const data = await newsRes.value.json(); if (data.news) {
              // LOCALE GUARD: Filter out any articles whose title doesn't contain Arabic text.
              const ARABIC_REGEX = /[\u0600-\u06FF]/;
              setNews(data.news.filter((n: any) => ARABIC_REGEX.test(n.titleAr || n.title || '')));
            } } catch {}
          }
          if (banksRes.status === 'fulfilled' && banksRes.value.ok) {
            try { const data = await banksRes.value.json(); if (data.banks) setCentralBanks(data.banks); } catch {}
          }
          if (councilRes.status === 'fulfilled' && councilRes.value.ok) {
            try {
              const data = await councilRes.value.json();
              const briefList = data?.data?.active || data?.active || data?.data || [];
              if (Array.isArray(briefList)) setCouncilBriefs(briefList);
            } catch {}
          }
          if (analysesRes.status === 'fulfilled' && analysesRes.value.ok) {
            try { const data = await analysesRes.value.json(); if (data.analyses) setAnalyses(data.analyses); } catch {}
          }
          if (reportsRes.status === 'fulfilled' && reportsRes.value.ok) {
            try {
              const data = await reportsRes.value.json();
              // Exclude strategic reports from regular reports — they belong in the strategic card only
              if (data.reports) setReports(data.reports.filter((r: any) => r.reportType !== 'strategic'));
            } catch {}
          }
          if (strategicRes.status === 'fulfilled' && strategicRes.value.ok) {
            try {
              const data = await strategicRes.value.json();
              if (data.reports) {
                // SAFETY FILTER: Only accept entries with reportType==='strategic'.
                // Prevents regular reports or market analyses from leaking into the strategic card.
                setStrategicReports(data.reports.filter((r: any) => r.reportType === 'strategic' && !r.isAnalysis));
              }
            } catch {}
          }
          if (infographicsRes.status === 'fulfilled' && infographicsRes.value.ok) {
            try { const data = await infographicsRes.value.json(); if (data.infographics) setInfographics(data.infographics); } catch {}
          }
        }
      } catch (err) {
        console.error('[HomePageContent] Background refresh error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // V15: Only fetch immediately if we DON'T have SSR data.
    // If SSR data exists, delay the first background refresh by 30 seconds
    // to avoid hammering the API with duplicate requests on page load.
    if (hasServerData) {
      const initialDelay = setTimeout(() => {
        if (!cancelled) fetchAllData();
      }, 30_000); // 30s delay before first background refresh
      return () => { cancelled = true; clearTimeout(initialDelay); };
    }

    fetchAllData();

    // V15: Auto-refresh every 3 minutes instead of 2 (reduces API load by 33%)
    // Pause polling when tab is hidden to save bandwidth and server resources
    let intervalId: ReturnType<typeof setInterval> | null = setInterval(fetchAllData, 3 * 60 * 1000);
    
    const handleVisibility = () => {
      if (document.hidden) {
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
      } else {
        if (!intervalId) {
          fetchAllData(); // Refresh immediately when tab becomes visible
          intervalId = setInterval(fetchAllData, 3 * 60 * 1000);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => { 
      cancelled = true; 
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // ── News slider auto-advance (CSS-based progress, no 100ms re-renders) ──
  const SLIDE_DURATION = 5000; // 5 seconds per slide
  useEffect(() => {
    if (news.length === 0) return;
    const id = setInterval(() => {
      setNewsSlide(s => (s + 1) % Math.min(news.length, 5));
    }, SLIDE_DURATION);
    return () => clearInterval(id);
  }, [news.length]);

  const handlePrevSlide = useCallback(() => {
    if (news.length === 0) return;
    const maxSlide = Math.min(news.length, 5);
    setNewsSlide(s => (s - 1 + maxSlide) % maxSlide);
  }, [news.length]);

  const handleNextSlide = useCallback(() => {
    if (news.length === 0) return;
    const maxSlide = Math.min(news.length, 5);
    setNewsSlide(s => (s + 1) % maxSlide);
  }, [news.length]);

  // ── Derived data from prices ──
  const forexPrices = useMemo(() => prices.filter(p => p.category === 'عملات'), [prices]);
  const metalsPrices = useMemo(() => prices.filter(p => p.category === 'سلع'), [prices]);
  const cryptoPrices = useMemo(() => prices.filter(p => p.category === 'كريبتو'), [prices]);
  const indicesPrices = useMemo(() => prices.filter(p => p.category === 'أسهم'), [prices]);
  const energyPrices = useMemo(() => prices.filter(p => p.category === 'طاقة'), [prices]);

  // Quick markets sidebar (all available prices)
  const quickMarkets = prices;

  // Market indicators for Row 1 pulse cards
  const marketPulseCards = useMemo(() =>
    [...prices].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 6)
      .map(p => ({ ...p, sparkline: p.sparkline })),
    [prices]
  );

  // Most traded
  const mostTraded = useMemo(() =>
    [...prices].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 6)
      .map(p => ({ s: p.displaySymbol, c: p.changePercent, p: p.price, d: p.decimals, sparkline: p.sparkline })),
    [prices]
  );

  // Commodities
  const commodities = useMemo(() =>
    [...metalsPrices, ...energyPrices].map(p => ({ s: p.displaySymbol, p: p.price, d: p.decimals, c: p.changePercent })),
    [metalsPrices, energyPrices]
  );

  // Arab indices — show all markets, including reference data (V230)
  const arabIndices = useMemo(() =>
    arabMarkets.map(m => ({ s: m.name, p: m.value, d: 2, c: m.change, i: m.flag, sparkline: m.sparkline, src: m.source })),
    [arabMarkets]
  );

  // Global indices
  const globalIndices = useMemo(() =>
    indicesPrices.map(p => ({ s: p.displaySymbol, p: p.price, d: p.decimals, c: p.changePercent })),
    [indicesPrices]
  );

  // Screener data derived from prices
  const screenerData = useMemo(() => {
    const buy = prices.filter(p => p.changePercent > 0.3).map(p => ({
      sym: p.displaySymbol, name: p.nameAr, p: p.price, c: p.changePercent, signal: 'buy' as const, conf: Math.min(95, 60 + Math.abs(p.changePercent) * 5)
    }));
    const sell = prices.filter(p => p.changePercent < -0.3).map(p => ({
      sym: p.displaySymbol, name: p.nameAr, p: p.price, c: p.changePercent, signal: 'sell' as const, conf: Math.min(95, 60 + Math.abs(p.changePercent) * 5)
    }));
    const hot = [...prices].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 8).map(p => ({
      sym: p.displaySymbol, name: p.nameAr, p: p.price, c: p.changePercent, signal: (p.changePercent >= 0 ? 'buy' : 'sell') as 'buy' | 'sell', conf: Math.min(95, 55 + Math.abs(p.changePercent) * 4)
    }));
    return { buy, sell, hot };
  }, [prices]);

  // Market sessions
  const sessions = [
    { name: 'لندن', flag: '🇬🇧', open: 8, close: 17 },
    { name: 'نيويورك', flag: '🇺🇸', open: 13, close: 22 },
    { name: 'طوكيو', flag: '🇯🇵', open: 0, close: 9 },
    { name: 'سيدني', flag: '🇦🇺', open: 22, close: 7 },
    { name: 'السعودية', flag: '🇸🇦', open: 7, close: 12 },
  ];

  // utcHour is now state (set every minute above), not derived from utcTime

  // Top movers
  const gainers = useMemo(() =>
    [...prices].filter(p => p.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5),
    [prices]
  );
  const losers = useMemo(() =>
    [...prices].filter(p => p.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5),
    [prices]
  );

  // Academy items (static educational content)
  const academyItems = [
    { abbr: 'P/E', full: 'نسبة السعر إلى الأرباح', icon: '📊', cat: 'تحليل أساسي' },
    { abbr: 'RSI', full: 'مؤشر القوة النسبية', icon: '📈', cat: 'تحليل فني' },
    { abbr: 'GDP', full: 'الناتج المحلي الإجمالي', icon: '🌍', cat: 'اقتصاد كلي' },
    { abbr: 'CPI', full: 'مؤشر أسعار المستهلكين', icon: '💰', cat: 'اقتصاد كلي' },
    { abbr: 'EPS', full: 'الأرباح لكل سهم', icon: '💵', cat: 'تحليل أساسي' },
    { abbr: 'MACD', full: 'متوسط التقارب والتباعد المتحرك', icon: '📉', cat: 'تحليل فني' },
  ];

  // Fear & Greed value for the marker position
  const fgValue = sentiment?.fearGreedIndex?.value ?? 50;

  // Market table tab filter
  const marketTabs = ['الكل', 'عملات', 'سلع', 'كريبتو', 'طاقة'];
  const filteredMarketPrices = useMemo(() => {
    if (marketTab === 'الكل') return prices;
    return prices.filter(p => p.category === marketTab);
  }, [prices, marketTab]);

  // Top news for the slider (max 5)
  const topNews = news.slice(0, 5);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 var(--space-md) var(--space-xl)' }}>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 1: MARKET PULSE CARDS — Full Width, elevated glass cards
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        {loading ? (
          <div className="home-pulse-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-sm)' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card" style={{ padding: 'var(--space-md)' }}>
                <Skeleton w="50%" h="14px" />
                <Skeleton w="70%" h="24px" />
                <Skeleton w="100%" h="28px" />
              </div>
            ))}
          </div>
        ) : marketPulseCards.length > 0 ? (
          <div className="home-pulse-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(marketPulseCards.length, 6)}, 1fr)`, gap: 'var(--space-sm)' }}>
            {marketPulseCards.map((p, i) => {
              const positive = p.changePercent >= 0;
              const gradBorder = positive
                ? 'linear-gradient(180deg, var(--bull), rgba(34,197,94,.2))'
                : 'linear-gradient(180deg, var(--bear), rgba(239,83,80,.2))';
              return (
                <div
                  key={i}
                  className="glass-card"
                  style={{
                    background: 'var(--bg2)',
                    borderRadius: 'var(--r2)',
                    padding: 'var(--space-md)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 0 20px rgba(0,229,255,0.05)',
                    borderInlineStart: `3px solid transparent`,
                    borderImage: `${gradBorder} 1`,
                    transition: 'transform 0.25s, box-shadow 0.25s',
                    cursor: 'default',
                  }}
                  data-trend={positive ? 'up' : 'down'}
                >
                  {/* Subtle glow background */}
                  <div style={{ position: 'absolute', top: -20, left: -20, width: 60, height: 60, borderRadius: '50%', background: positive ? 'rgba(34,197,94,.06)' : 'rgba(239,83,80,.06)', filter: 'blur(20px)', pointerEvents: 'none' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, position: 'relative' }}>
                    <div>
                      <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', display: 'block' }}>{p.displaySymbol}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{p.nameAr}</span>
                    </div>
                    <span className="font-mono-price" style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--r)',
                      background: positive ? 'rgba(34,197,94,.1)' : 'rgba(239,83,80,.1)',
                      color: positive ? 'var(--bull)' : 'var(--bear)',
                    }}>
                      {positive ? '+' : ''}{p.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <span className="font-mono-price" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-head)', display: 'block', marginBottom: 8 }}>
                    {fmtPrice(p.price, p.decimals)}
                  </span>
                  <Sparkline positive={positive} data={p.sparkline} />
                </div>
              );
            })}
          </div>
        ) : (
          <NoData message="لا توجد بيانات أسعار متاحة" />
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 2: NEWS — Sidebar + Featured Card
          ═══════════════════════════════════════════════════════════════ */}
      <section className="home-news-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* Sidebar: آخر الأخبار */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-md)' }}>
            <span className="sh-title" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>آخر الأخبار</span>
            <div className="live-dot" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 380, overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <Skeleton w="32px" h="32px" />
                  <div style={{ flex: 1 }}>
                    <Skeleton w="100%" h="13px" />
                    <Skeleton w="60%" h="11px" />
                  </div>
                </div>
              ))
            ) : news.length > 0 ? (
              news.slice(0, 8).map((n, i) => {
                const title = n.titleAr || n.title;
                const isActive = i === newsSlide;
                return (
                  <a
                    key={n.id}
                    href={n.href || (n.slug ? `/ar/news/${n.slug}` : n.id ? `/ar/news/${n.id}` : '#')}
                    onClick={e => { if (!n.slug && !n.id) e.preventDefault(); else return; setNewsSlide(Math.min(i, 4)); }}
                    style={{
                      display: 'flex', gap: 10, padding: '10px 8px',
                      borderRadius: 'var(--r)',
                      background: isActive ? 'rgba(0,229,255,.04)' : 'transparent',
                      borderInlineStart: isActive ? '3px solid var(--cyan)' : '3px solid transparent',
                      textDecoration: 'none',
                      transition: 'background .2s',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Thumbnail — V230: Use gradient fallback instead of hiding on error */}
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--r)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg4)', position: 'relative' }}>
                      {/* V400: Use <img> instead of <Image> for article-image API — avoids 400 errors from Next.js image optimizer */}
                      <img
                        src={`/api/article-image/${n.id}`}
                        alt={title}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        onError={e => { const el = e.target as HTMLImageElement; el.style.opacity = '0'; }}
                        onLoad={e => { const el = e.target as HTMLImageElement; el.style.opacity = '1'; }}
                        loading="lazy"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: isActive ? 'var(--text-head)' : 'var(--text)', margin: 0, lineHeight: 1.5, display: '-webkit-box' as const, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{title}</p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{n.source}</span>
                        <span style={{ fontSize: 11, color: 'var(--text4)' }}>•</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{timeAgo(n.time)}</span>
                      </div>
                    </div>
                  </a>
                );
              })
            ) : (
              <NoData message="لا توجد أخبار متاحة" />
            )}
          </div>

          <div style={{ marginTop: 'var(--space-sm)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border)' }}>
            <a href="/news" style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 700, textDecoration: 'none' }}>عرض الكل ←</a>
          </div>
        </div>

        {/* Middle: أحدث التقارير الاستراتيجية */}
        <div className="glass-card" style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 0 24px rgba(139,92,246,0.08)' }}>
          <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 14 }}>🛡️</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>أحدث التقارير الاستراتيجية</span>
              </div>
              <a href="/strategic-reports" style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 700, textDecoration: 'none', opacity: 0.85 }}>عرض الكل ←</a>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="56px" />)}
              </div>
            ) : strategicReports.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', maxHeight: 360 }} className="custom-scrollbar">
                {strategicReports.map((r) => {
                  const scopeLabel = r.scope === 'arabic' ? 'عربي' : r.scope === 'global' ? 'عالمي' : 'إقليمي';
                  const impactColor = r.marketImpact === 'bullish' ? 'var(--bull)' : r.marketImpact === 'bearish' ? 'var(--bear)' : 'var(--text3)';
                  const impactLabel = r.marketImpact === 'bullish' ? 'صعودي' : r.marketImpact === 'bearish' ? 'هبوطي' : 'محايد';
                  return (
                    <a
                      key={r.id}
                      href={`/strategic-reports/${r.slug}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        borderRadius: 'var(--r)', background: 'var(--bg4)',
                        borderInlineStart: '3px solid #8B5CF6',
                        textDecoration: 'none', cursor: 'pointer',
                        transition: 'background .2s',
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 'var(--r)', background: 'rgba(139,92,246,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 14 }}>🛡️</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', margin: 0, lineHeight: 1.5, display: '-webkit-box' as const, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{stripStrategicPrefix(r.title)}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' as const }}>
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'rgba(139,92,246,.1)', color: '#8B5CF6', fontWeight: 700 }}>استراتيجي</span>
                          <span style={{ fontSize: 10, color: 'var(--text4)' }}>{scopeLabel}</span>
                          <span style={{ fontSize: 10, color: 'var(--text4)' }}>•</span>
                          <span style={{ fontSize: 10, color: impactColor }}>{impactLabel}</span>
                          {r.confidenceScore > 0 && <span style={{ fontSize: 10, color: '#8B5CF6' }}>{r.confidenceScore}%</span>}
                          <span style={{ fontSize: 10, color: 'var(--text4)' }}>{timeAgo(r.publishedAt)}</span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)', textAlign: 'center' as const }}>لا توجد تقارير استراتيجية متاحة حالياً</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: أحدث التقارير والتحليلات */}
        <div className="glass-card" style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 0 24px rgba(0,229,255,0.06)' }}>
          <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>أحدث التقارير والتحليلات</span>
              </div>
              <a href="/reports" style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 700, textDecoration: 'none', opacity: 0.85 }}>عرض الكل ←</a>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="56px" />)}
              </div>
            ) : (analyses.length > 0 || reports.length > 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', maxHeight: 360 }} className="custom-scrollbar">
                {/* Reports Section — excludes strategic reports */}
                {reports.filter(r => r.reportType !== 'strategic').length > 0 && (
                  <>
                    {reports.filter(r => r.reportType !== 'strategic').map((r) => {
                      const typeLabel = r.reportType === 'weekly' ? 'أسبوعي' : r.reportType === 'monthly' ? 'شهري' : r.reportType === 'quarterly' ? 'ربع سنوي' : 'يومي';
                      const scopeLabel = r.scope === 'arabic' ? 'عربي' : r.scope === 'global' ? 'عالمي' : 'إقليمي';
                      const impactColor = r.marketImpact === 'bullish' ? 'var(--bull)' : r.marketImpact === 'bearish' ? 'var(--bear)' : 'var(--text3)';
                      return (
                        <a
                          key={r.id}
                          href={`/reports/${r.slug}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                            borderRadius: 'var(--r)', background: 'var(--bg4)',
                            borderInlineStart: '3px solid var(--gold)',
                            textDecoration: 'none', cursor: 'pointer',
                            transition: 'background .2s',
                          }}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: 'var(--r)', background: 'rgba(212,175,55,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', margin: 0, lineHeight: 1.5, display: '-webkit-box' as const, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{r.title}</p>
                            <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' as const }}>
                              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'rgba(212,175,55,.1)', color: 'var(--gold)', fontWeight: 700 }}>تقرير {typeLabel}</span>
                              <span style={{ fontSize: 10, color: 'var(--text4)' }}>{scopeLabel}</span>
                              <span style={{ fontSize: 10, color: 'var(--text4)' }}>•</span>
                              <span style={{ fontSize: 10, color: impactColor }}>{r.marketImpact === 'bullish' ? 'صعودي' : r.marketImpact === 'bearish' ? 'هبوطي' : 'محايد'}</span>
                              {r.confidenceScore > 0 && <span style={{ fontSize: 10, color: 'var(--purple)' }}>{r.confidenceScore}%</span>}
                              <span style={{ fontSize: 10, color: 'var(--text4)' }}>{timeAgo(r.publishedAt)}</span>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </>
                )}

                {/* Analyses Section */}
                {analyses.map((a) => {
                  const assetLabels: Record<string, string> = {
                    strategic: 'استراتيجي', stocks: 'أسهم', commodities: 'سلع', forex: 'فوركس', crypto: 'كريبتو',
                    bonds: 'سندات', energy: 'طاقة', realEstate: 'عقارات', economy: 'اقتصاد',
                    banking: 'بنوك', technicalAnalysis: 'فني', arabMarkets: 'عربي', earnings: 'أرباح',
                  };
                  const riskColors: Record<string, string> = { low: 'var(--bull)', medium: 'var(--gold)', high: 'var(--orange)', extreme: 'var(--bear)' };
                  const sentimentColors: Record<string, string> = { bullish: 'var(--bull)', bearish: 'var(--bear)', neutral: 'var(--text3)' };
                  const sentimentLabels: Record<string, string> = { bullish: 'صعودي', bearish: 'هبوطي', neutral: 'محايد' };
                  return (
                    <a
                      key={a.id}
                      href={`/reports/${a.slug}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        borderRadius: 'var(--r)', background: 'var(--bg4)',
                        borderInlineStart: `3px solid ${sentimentColors[a.sentiment] || 'var(--text4)'}`,
                        textDecoration: 'none', cursor: 'pointer',
                        transition: 'background .2s',
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 'var(--r)', background: 'rgba(0,229,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', margin: 0, lineHeight: 1.5, display: '-webkit-box' as const, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{a.title}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' as const }}>
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'rgba(0,229,255,.06)', color: 'var(--cyan)', fontWeight: 700 }}>{assetLabels[a.assetClass] || a.assetClass}</span>
                          <span style={{ fontSize: 10, color: sentimentColors[a.sentiment] || 'var(--text4)' }}>{sentimentLabels[a.sentiment] || a.sentiment}</span>
                          <span style={{ fontSize: 10, color: riskColors[a.riskLevel] || 'var(--text4)' }}>مخاطر: {a.riskLevel}</span>
                          {a.confidenceScore > 0 && <span style={{ fontSize: 10, color: 'var(--purple)' }}>{a.confidenceScore}%</span>}
                          <span style={{ fontSize: 10, color: 'var(--text4)' }}>{timeAgo(a.publishedAt)}</span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)', textAlign: 'center' as const }}>لا توجد تقارير أو تحليلات متاحة حالياً</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 2.5: STOCK & COMPANY ANALYSIS
          ═══════════════════════════════════════════════════════════════ */}
      <StockCompanyAnalysisSection locale="ar" />

      {/* ═══════════════════════════════════════════════════════════════
          ROW 2.5C: LATEST VIDEOS (V1044) — 4 latest videos
          Placed between Stock Analysis and Most Active Markets
          ═══════════════════════════════════════════════════════════════ */}
      <HomeVideosSection locale="ar" />
      <TechnicalAnalysesHomeSection locale="ar" />

      {/* ═══════════════════════════════════════════════════════════════
          ROW 2.5A: GLOBAL RISK PULSE + FLASH POINTS (V1057)
          Revolutionary widgets: semicircle gauge + Bloomberg-style KPI bar
          ═══════════════════════════════════════════════════════════════ */}
      <GlobalRiskPulse locale="ar" />

      {/* ═══════════════════════════════════════════════════════════════
          ROW 2.5B: QUICK INSIGHT CARDS
          4 cards: Crypto, AI Summary, Most Active, Sentiment
          ═══════════════════════════════════════════════════════════════ */}
      <QuickInsightCards prices={prices} sentiment={sentiment} locale="ar" />

      {/* ═══════════════════════════════════════════════════════════════
          ROW 3: MARKET MOVERS — Compact, 4-column
          Shows real price movements from live market data.
          Reduced size (~25% smaller) — compact horizontal cards.
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: 'linear-gradient(180deg, var(--cyan), var(--purple))', boxShadow: '0 0 8px rgba(0,229,255,.3)' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>أكثر الأسواق تحركاً</span>
            <span style={{ fontSize: 8, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: 'var(--cyan2)', color: 'var(--cyan)', letterSpacing: 0.5 }}>LIVE</span>
          </div>
          <a href="/markets" style={{ background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.25)', borderRadius: 'var(--r)', padding: '4px 12px', color: 'var(--purple)', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', transition: 'all .2s' }}>مركز الأسواق</a>
        </div>

        {loading ? (
          <div className="home-market-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card" style={{ padding: 8 }}>
                <Skeleton w="50%" h="12px" />
                <Skeleton w="100%" h="28px" />
              </div>
            ))}
          </div>
        ) : prices.length > 0 ? (
          <div className="home-market-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {prices.filter(p => Math.abs(p.changePercent) > 0.1).slice(0, 4).map((p, i) => {
              const isUp = p.changePercent >= 0;
              return (
                <div
                  key={i}
                  className="glass-card"
                  style={{
                    background: 'var(--bg3)',
                    borderRadius: 'var(--r)',
                    padding: '8px 10px',
                    borderInlineStart: `2px solid ${isUp ? 'var(--bull)' : 'var(--bear)'}`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = isUp ? '0 2px 12px rgba(34,197,94,.08)' : '0 2px 12px rgba(239,83,80,.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 14 }}>{p.icon || '📊'}</span>
                      <div>
                        <span className="font-mono-price" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-head)', display: 'block', lineHeight: 1.2 }}>{p.displaySymbol}</span>
                        <span style={{ fontSize: 9, color: 'var(--text4)', lineHeight: 1 }}>{p.nameAr}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: isUp ? 'rgba(34,197,94,.12)' : 'rgba(239,83,80,.12)', color: isUp ? 'var(--bull)' : 'var(--bear)' }}>
                      {isUp ? '▲' : '▼'} {Math.abs(p.changePercent).toFixed(2)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span className="font-mono-price" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{fmtPrice(p.price, p.decimals)}</span>
                    <span className="font-mono-price" style={{ fontSize: 10, fontWeight: 600, color: isUp ? 'var(--bull)' : 'var(--bear)' }}>
                      {isUp ? '+' : ''}{p.change?.toFixed(p.decimals || 2)}
                    </span>
                  </div>
                  {p.sparkline && p.sparkline.length > 0 && (
                    <div style={{ height: 20, marginBottom: 2 }}>
                      <Sparkline positive={isUp} data={p.sparkline} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <NoData />
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 3.5: INFOGRAPHICS — Latest 4 published infographics
          V228: Redesigned — bigger cards, responsive grid, InfographicCard
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 22, borderRadius: 2, background: 'linear-gradient(180deg, #d4af37, #059669)', boxShadow: '0 0 10px rgba(212,175,55,.35)' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-head)' }}>إنفوغرافيك</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, marginRight: 4 }}>تحليلات بصرية</span>
          </div>
          <a href="/infographics" style={{ background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.2)', borderRadius: 'var(--r)', padding: '6px 14px', color: '#d4af37', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', transition: 'all .2s', minHeight: 36, display: 'flex', alignItems: 'center' }}>عرض الكل ←</a>
        </div>

        {loading ? (
          <div className="home-infographic-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
                <Skeleton w="100%" h="180px" />
                <div style={{ padding: 12 }}>
                  <Skeleton w="80%" h="16px" />
                  <Skeleton w="50%" h="12px" />
                </div>
              </div>
            ))}
          </div>
        ) : infographics.length > 0 ? (
          <div className="home-infographic-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {infographics.map((ig) => (
              <InfographicCard key={ig.id} infographic={ig as InfographicData} />
            ))}
          </div>
        ) : (
          <NoData message="لا توجد إنفوغرافيك متاحة حالياً" />
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 4: CALENDAR + ARAB MARKETS — Two Columns
          ═══════════════════════════════════════════════════════════════ */}
      <section className="home-calendar-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* Left: الأجندة الاقتصادية */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title="الأجندة الاقتصادية" linkText="عرض الكل" linkHref="/calendar" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }} className="custom-scrollbar">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} w="100%" h="36px" />)
            ) : calendar.length > 0 ? (
              calendar.map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 'var(--r)', background: i % 2 === 0 ? 'var(--bg4)' : 'transparent', alignItems: 'center' }}>
                  <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)', minWidth: 44 }}>{formatEventTime(ev.time)}</span>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{ev.country}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{ev.eventAr || ev.event}</span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.impactLevel >= 3 ? 'var(--bear)' : ev.impactLevel >= 2 ? 'var(--gold)' : 'var(--text4)', flexShrink: 0, boxShadow: ev.impactLevel >= 3 ? '0 0 8px rgba(239,83,80,.4)' : 'none' }} />
                </div>
              ))
            ) : (
              <NoData />
            )}
          </div>
        </div>

        {/* Right: الأسواق العربية */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title="الأسواق العربية" linkText="عرض الكل" linkHref="/arabic-markets" />
          <div className="home-arab-inner" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} w="100%" h="64px" />)
            ) : arabIndices.length > 0 ? (
              arabIndices.slice(0, 6).map((a, i) => (
                <div key={i} style={{ background: 'var(--bg4)', borderRadius: 'var(--r2)', padding: '12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18 }}>{a.i}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{a.s}</span>
                    </div>
                    <span className="font-mono-price" style={{ fontSize: 12, fontWeight: 700, color: a.c >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                      {a.src === 'reference' ? '—' : <>{a.c >= 0 ? '+' : ''}{a.c.toFixed(2)}%</>}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="font-mono-price" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-head)' }}>{fmtPrice(a.p, a.d)}</span>
                    {a.src === 'reference' && (
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(234,179,8,.12)', color: '#eab308', fontWeight: 600 }}>مرجعي</span>
                    )}
                  </div>
                  {a.sparkline && a.sparkline.length > 0 ? (
                    <Sparkline positive={a.c >= 0} data={a.sparkline} />
                  ) : null}
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1' }}>
                <NoData />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 5: QUICK MARKETS TABLE — Full Width with tabs
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <SectionHeader title="جدول الأسواق" linkText="عرض الكل" linkHref="/markets" />

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 'var(--space-md)' }}>
          {marketTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setMarketTab(tab)}
              style={{
                padding: '6px 18px',
                borderRadius: 'var(--r)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                background: marketTab === tab ? 'rgba(0,229,255,.1)' : 'var(--bg4)',
                border: marketTab === tab ? '1px solid rgba(0,229,255,.25)' : '1px solid var(--border)',
                color: marketTab === tab ? 'var(--cyan)' : 'var(--text3)',
                transition: 'all .2s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 0, overflow: 'hidden' }}>
          {/* Table Header */}
          <div className="home-table-row" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 100px 100px 100px', gap: 0, padding: '12px 16px', background: 'var(--bg4)', borderBottom: '1px solid var(--border)' }}>
            <span className="home-table-col-symbol" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' as const }}>الرمز</span>
            <span className="home-table-col-name" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' as const }}>الاسم</span>
            <span className="home-table-col-price" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' as const }}>السعر</span>
            <span className="home-table-col-change" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' as const }}>التغير</span>
            <span className="home-table-col-pct" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' as const }}>% التغير</span>
            <span className="home-table-col-trend" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' as const }}>الاتجاه</span>
          </div>

          {/* Table Body */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }} className="custom-scrollbar">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 100px 100px 100px', padding: '10px 16px', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)' }}>
                  <Skeleton w="50px" h="14px" />
                  <Skeleton w="80px" h="14px" />
                  <Skeleton w="70px" h="14px" />
                  <Skeleton w="60px" h="14px" />
                  <Skeleton w="50px" h="14px" />
                  <Skeleton w="60px" h="14px" />
                </div>
              ))
            ) : filteredMarketPrices.length > 0 ? (
              filteredMarketPrices.map((m, i) => {
                const positive = m.changePercent >= 0;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 120px 100px 100px 100px',
                      padding: '12px 16px',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)',
                      borderBottom: '1px solid var(--border)',
                      alignItems: 'center',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)'}
                  >
                    <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)' }}>{m.displaySymbol}</span>
                    <span style={{ fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{m.nameAr}</span>
                    <span className="font-mono-price" style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{fmtPrice(m.price, m.decimals)}</span>
                    <span className="font-mono-price" style={{ fontSize: 13, color: positive ? 'var(--bull)' : 'var(--bear)', fontWeight: 700 }}>
                      {m.change >= 0 ? '+' : ''}{fmtPrice(m.change, m.decimals)}
                    </span>
                    <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: positive ? 'var(--bull)' : 'var(--bear)' }}>
                      {positive ? '+' : ''}{m.changePercent.toFixed(2)}%
                    </span>
                    <Sparkline positive={positive} data={m.sparkline} />
                  </div>
                );
              })
            ) : (
              <NoData />
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 6: ACADEMY — Full Width, 6 items in a row
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title="الأكاديمية" linkText="عرض الكل" linkHref="/academy" />
          <div className="home-academy-inner" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-sm)' }}>
            {academyItems.map((item, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  background: 'var(--bg4)',
                  borderRadius: 'var(--r2)',
                  padding: 'var(--space-sm)',
                  textAlign: 'center' as const,
                  cursor: 'pointer',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{item.icon}</span>
                <span className="font-mono-price" style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan)', display: 'block', marginBottom: 2 }}>{item.abbr}</span>
                <span style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.4, display: 'block' }}>{item.full}</span>
                <span style={{ fontSize: 10, color: 'var(--text4)', marginTop: 3, padding: '1px 6px', background: 'var(--bg3)', borderRadius: 'var(--r)', display: 'inline-block' }}>{item.cat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 6B: CENTRAL BANKS — Full Width, Horizontal Cards Grid
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <SectionHeader title="البنوك المركزية" linkText="عرض الكل" linkHref="/central-banks" />
        {loading ? (
          <div className="home-banks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} w="100%" h="120px" />)}
          </div>
        ) : centralBanks.length > 0 ? (
          <div className="home-banks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
            {centralBanks.map((b, i) => {
              const rateChange = (b.currentRate ?? 0) - (b.previousRate ?? 0);
              const predLabel = b.aiPrediction === 'raise' ? 'رفع' : b.aiPrediction === 'cut' ? 'خفض' : 'ثبات';
              const predColor = b.aiPrediction === 'raise' ? 'var(--bear)' : b.aiPrediction === 'cut' ? 'var(--bull)' : 'var(--text3)';
              const predBg = b.aiPrediction === 'raise' ? 'rgba(239,83,80,.08)' : b.aiPrediction === 'cut' ? 'rgba(34,197,94,.08)' : 'rgba(100,116,139,.08)';
              return (
                <a
                  key={i}
                  href="/central-banks"
                  className="glass-card"
                  style={{
                    background: 'var(--bg3)',
                    borderRadius: 'var(--r2)',
                    padding: 'var(--space-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'transform 0.25s, box-shadow 0.25s',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    borderInlineStart: `3px solid ${predColor}`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 20px ${b.aiPrediction === 'raise' ? 'rgba(239,83,80,.1)' : b.aiPrediction === 'cut' ? 'rgba(34,197,94,.1)' : 'rgba(0,229,255,.06)'}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  {/* Top: Flag + Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{b.flag}</span>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-head)', display: 'block', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{b.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--text3)' }}>{b.country}</span>
                    </div>
                  </div>

                  {/* Rate */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span className="font-mono-price" style={{ fontSize: 22, fontWeight: 700, color: 'var(--cyan)' }}>{b.currentRate}%</span>
                    {rateChange !== 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: rateChange > 0 ? 'var(--bear)' : 'var(--bull)' }}>
                        {rateChange > 0 ? '▲' : '▼'} {Math.abs(rateChange).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* AI Prediction Badge */}
                  {b.aiPrediction && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 'var(--r)', background: predBg, color: predColor, fontWeight: 700, border: `1px solid ${predColor}22` }}>
                        {predLabel}
                      </span>
                      {b.aiConfidence > 0 && (
                        <span className="font-mono-price" style={{ fontSize: 10, color: 'var(--purple)' }}>{b.aiConfidence}%</span>
                      )}
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        ) : (
          <NoData message="لا تتوفر بيانات البنوك المركزية حالياً" />
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 7: FEAR & GREED — Full Width (Council signals moved to HeroSection)
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="home-fear-greed" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', alignItems: 'center' }}>
          {/* Fear & Greed Gauge */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: 'linear-gradient(180deg, var(--bear), var(--gold), var(--bull))' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>مؤشر الخوف والطمع</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: 'linear-gradient(90deg, var(--bear), var(--orange), var(--gold), #84CC16, var(--bull))', position: 'relative', marginBottom: 10 }}>
              <div style={{ position: 'absolute', top: -5, left: `${Math.min(95, Math.max(5, fgValue))}%`, width: 20, height: 20, borderRadius: '50%', background: 'var(--text-head)', border: '3px solid var(--bg3)', transform: 'translateX(-50%)', transition: 'left 0.5s ease', boxShadow: '0 0 12px rgba(255,255,255,.2)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--bear)' }}>خوف شديد</span>
              <span style={{ fontSize: 11, color: 'var(--gold)' }}>محايد</span>
              <span style={{ fontSize: 11, color: 'var(--bull)' }}>طمع شديد</span>
            </div>
          </div>
          {/* Value + Label */}
          <div style={{ textAlign: 'center' }}>
            {loading ? (
              <Skeleton w="80px" h="40px" />
            ) : (
              <span className="font-mono-price" style={{ fontSize: 48, fontWeight: 700, color: fgValue <= 25 ? 'var(--bear)' : fgValue <= 40 ? 'var(--orange)' : fgValue <= 60 ? 'var(--gold)' : fgValue <= 75 ? '#84CC16' : 'var(--bull)', display: 'block' }}>{fgValue}</span>
            )}
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text2)' }}>
              {loading ? '...' : (sentiment?.fearGreedIndex?.labelAr || 'لا توجد بيانات')}
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 8: AI SCREENER + WHY رؤى — Two Columns
          ═══════════════════════════════════════════════════════════════ */}
      <section className="home-screener-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* AI Screener */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title="🤖 مراقب AI — أصول نشطة" />
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 'var(--space-md)' }}>
            {(['buy', 'sell', 'hot'] as const).map(tab => (
              <button key={tab} onClick={() => setScreenerTab(tab)} style={{
                padding: '7px 18px',
                borderRadius: 'var(--r)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                background: screenerTab === tab
                  ? (tab === 'buy' ? 'rgba(34,197,94,.12)' : tab === 'sell' ? 'rgba(239,83,80,.12)' : 'rgba(255,184,0,.12)')
                  : 'var(--bg4)',
                border: screenerTab === tab
                  ? (tab === 'buy' ? '1px solid rgba(34,197,94,.3)' : tab === 'sell' ? '1px solid rgba(239,83,80,.3)' : '1px solid rgba(255,184,0,.3)')
                  : '1px solid var(--border)',
                color: screenerTab === tab
                  ? (tab === 'buy' ? 'var(--bull)' : tab === 'sell' ? 'var(--bear)' : 'var(--gold)')
                  : 'var(--text3)',
                transition: 'all .2s',
              }}>
                {tab === 'buy' ? '▲ صاعدة' : tab === 'sell' ? '▼ هابطة' : '🔥 الأكثر حركة'}
              </button>
            ))}
          </div>
          {/* Screener rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }} className="custom-scrollbar">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} w="100%" h="36px" />)
            ) : screenerData[screenerTab].length > 0 ? (
              screenerData[screenerTab].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--r)', background: i % 2 === 0 ? 'var(--bg4)' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="font-mono-price" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text4)', width: 20 }}>{i + 1}</span>
                    <div>
                      <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)' }}>{row.sym}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 8 }}>{row.name}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <span className="font-mono-price" style={{ fontSize: 13, color: 'var(--text)' }}>{row.p.toFixed(row.p < 10 ? 4 : row.p < 1000 ? 2 : 0)}</span>
                    <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: row.c >= 0 ? 'var(--bull)' : 'var(--bear)' }}>{row.c >= 0 ? '+' : ''}{row.c.toFixed(2)}%</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--r)', background: row.signal === 'buy' ? 'rgba(34,197,94,.1)' : 'rgba(239,83,80,.1)', color: row.signal === 'buy' ? 'var(--bull)' : 'var(--bear)' }}>
                      {row.signal === 'buy' ? '▲ صاعد' : '▼ هابط'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 90 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${row.conf}%`, background: 'linear-gradient(90deg, var(--cyan), var(--purple))', height: '100%' }} />
                      </div>
                      <span className="font-mono-price" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>{Math.round(row.conf)}%</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <NoData />
            )}
          </div>
        </div>

        {/* Why رؤى */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title="لماذا رؤى" />
          <div className="home-2col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            {[
              { icon: '🧠', title: 'AI تحليل فوري', desc: 'تحليلات لحظية مدعومة بالذكاء الاصطناعي' },
              { icon: '📡', title: 'أخبار حية 24/7', desc: 'تغطية إخبارية مستمرة للأسواق العالمية' },
              { icon: '📊', title: 'تحليلات دقيقة', desc: 'رؤى مبنية على البيانات مع مستويات أسعار مهمة' },
              { icon: '🔔', title: 'تنبيهات ذكية', desc: 'إشعارات فورية عند تحرك الأسواق' },
            ].map((f, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  background: 'var(--bg4)',
                  borderRadius: 'var(--r2)',
                  padding: 'var(--space-md)',
                  textAlign: 'center' as const,
                  transition: 'transform 0.25s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
              >
                <span style={{ fontSize: 26, display: 'block', marginBottom: 8 }}>{f.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', display: 'block', marginBottom: 4 }}>{f.title}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 9: MARKET HOURS + TOP MOVERS — Two Columns
          ═══════════════════════════════════════════════════════════════ */}
      <section className="home-2col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* Market Hours */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 22, borderRadius: 2, background: 'linear-gradient(180deg, var(--cyan), var(--purple))', boxShadow: '0 0 12px rgba(0,229,255,.35)' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-head)' }}>ساعات التداول</span>
            </div>
            <UtcClock />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sessions.map((s, i) => {
              // V302: Handle utcHour=-1 (SSR/loading) gracefully
              const isOpen = utcHour >= 0
                ? (s.open < s.close
                  ? (utcHour >= s.open && utcHour < s.close)
                  : (utcHour >= s.open || utcHour < s.close))
                : false;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--r)', background: i % 2 === 0 ? 'var(--bg4)' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{s.flag}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="font-mono-price" style={{ fontSize: 12, color: 'var(--text3)' }}>{String(s.open).padStart(2, '0')}:00–{String(s.close).padStart(2, '0')}:00</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--r)',
                      background: utcHour < 0 ? 'rgba(100,116,139,.06)' : isOpen ? 'rgba(34,197,94,.1)' : 'rgba(100,116,139,.08)',
                      color: utcHour < 0 ? 'var(--text3)' : isOpen ? 'var(--bull)' : 'var(--text3)',
                      border: `1px solid ${isOpen ? 'rgba(34,197,94,.25)' : 'transparent'}`,
                    }}>
                      {utcHour < 0 ? '--:--' : isOpen ? 'مفتوح' : 'مغلق'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Movers */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 22, borderRadius: 2, background: 'linear-gradient(180deg, var(--cyan), var(--purple))', boxShadow: '0 0 12px rgba(0,229,255,.35)' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-head)' }}>أكبر التحركات</span>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 'var(--space-sm)' }}>
            {(['gainers', 'losers'] as const).map(tab => (
              <button key={tab} onClick={() => setMoversTab(tab)} style={{
                padding: '6px 18px',
                borderRadius: 'var(--r)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                background: moversTab === tab ? (tab === 'gainers' ? 'rgba(34,197,94,.12)' : 'rgba(239,83,80,.12)') : 'var(--bg4)',
                border: moversTab === tab ? (tab === 'gainers' ? '1px solid rgba(34,197,94,.3)' : '1px solid rgba(239,83,80,.3)') : '1px solid var(--border)',
                color: moversTab === tab ? (tab === 'gainers' ? 'var(--bull)' : 'var(--bear)') : 'var(--text3)',
                transition: 'all .2s',
              }}>
                {tab === 'gainers' ? '▲ صاعد' : '▼ هابط'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }} className="custom-scrollbar">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} w="100%" h="28px" />)
            ) : (moversTab === 'gainers' ? gainers : losers).length > 0 ? (
              (moversTab === 'gainers' ? gainers : losers).map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--r)', background: i % 2 === 0 ? 'var(--bg4)' : 'transparent' }}>
                  <span className="font-mono-price" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>{m.displaySymbol}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span className="font-mono-price" style={{ fontSize: 13, color: 'var(--text)' }}>{fmtPrice(m.price, m.decimals)}</span>
                    <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: m.changePercent >= 0 ? 'var(--bull)' : 'var(--bear)' }}>{m.changePercent >= 0 ? '+' : ''}{m.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <NoData />
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 10: COMMUNITY PULSE + GEOPOLITICAL RISK
          ═══════════════════════════════════════════════════════════════ */}
      <section className="home-2col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* Community Pulse */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title="نبض المجتمع" />
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="60px" />)}
            </div>
          ) : prices.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
              {prices.filter(p => p.category === 'عملات').slice(0, 4).map((p, i) => {
                const bullPercent = p.changePercent >= 0 ? 50 + Math.abs(p.changePercent) * 5 : 50 - Math.abs(p.changePercent) * 5;
                const clampedBull = Math.min(90, Math.max(10, bullPercent));
                return (
                  <div key={i} style={{ background: 'var(--bg4)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)' }}>{p.displaySymbol}</span>
                    </div>
                    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ width: `${clampedBull}%`, background: 'var(--bull)', borderRadius: '4px 0 0 4px', transition: 'width 0.5s' }} />
                      <div style={{ width: `${100 - clampedBull}%`, background: 'var(--bear)', borderRadius: '0 4px 4px 0', transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="font-mono-price" style={{ fontSize: 11, color: 'var(--bull)', fontWeight: 700 }}>▲ {Math.round(clampedBull)}%</span>
                      <span className="font-mono-price" style={{ fontSize: 11, color: 'var(--bear)', fontWeight: 700 }}>▼ {Math.round(100 - clampedBull)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <NoData />
          )}
        </div>

        {/* Geopolitical Risk */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title="مخاطر جيوسياسية" />
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton w="60px" h="40px" />
              <Skeleton w="100%" h="14px" />
              <Skeleton w="80%" h="14px" />
            </div>
          ) : sentiment?.geopoliticalRiskIndex && sentiment.geopoliticalRiskIndex.value > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
              <span className="font-mono-price" style={{ fontSize: 36, fontWeight: 700, color: sentiment.geopoliticalRiskIndex.value > 60 ? 'var(--bear)' : sentiment.geopoliticalRiskIndex.value > 30 ? 'var(--gold)' : 'var(--bull)', flexShrink: 0 }}>
                {sentiment.geopoliticalRiskIndex.value}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)', display: 'block', marginBottom: 6 }}>{sentiment.geopoliticalRiskIndex.label}</span>
                <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{sentiment.geopoliticalRiskIndex.description}</span>
              </div>
            </div>
          ) : (
            <NoData message="لا توجد بيانات" />
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 11: COMMODITIES + GLOBAL INDICES — Two Columns
          ═══════════════════════════════════════════════════════════════ */}
      <section className="home-2col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* السلع */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title="السلع" linkText="عرض الكل" linkHref="/markets" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="28px" />)
            ) : commodities.length > 0 ? (
              commodities.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--r)', background: i % 2 === 0 ? 'var(--bg4)' : 'transparent' }}>
                  <span className="font-mono-price" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>{c.s}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span className="font-mono-price" style={{ fontSize: 13, color: 'var(--text)' }}>{fmtPrice(c.p, c.d)}</span>
                    <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: c.c >= 0 ? 'var(--bull)' : 'var(--bear)' }}>{c.c >= 0 ? '+' : ''}{c.c.toFixed(2)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <NoData />
            )}
          </div>
        </div>

        {/* المؤشرات العالمية */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title="المؤشرات العالمية" linkText="عرض الكل" linkHref="/markets" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="28px" />)
            ) : globalIndices.length > 0 ? (
              globalIndices.map((idx, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--r)', background: i % 2 === 0 ? 'var(--bg4)' : 'transparent' }}>
                  <span className="font-mono-price" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>{idx.s}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span className="font-mono-price" style={{ fontSize: 13, color: 'var(--text)' }}>{fmtPrice(idx.p, idx.d)}</span>
                    <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: idx.c >= 0 ? 'var(--bull)' : 'var(--bear)' }}>{idx.c >= 0 ? '+' : ''}{idx.c.toFixed(2)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <NoData />
            )}
          </div>
        </div>
      </section>

      {/* RESPONSIVE STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* ROW 1: Pulse Cards - 6 -> 3 -> 2 -> 1 */
        .home-pulse-grid { grid-template-columns: repeat(6, 1fr) !important; }
        @media (max-width: 1024px) { .home-pulse-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 640px) { .home-pulse-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 400px) { .home-pulse-grid { grid-template-columns: 1fr !important; } }

        /* ROW 2: News - sidebar + strategic + featured -> stack on mobile */
        .home-news-grid { grid-template-columns: 1fr 1fr 1fr !important; }
        @media (max-width: 1100px) { .home-news-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 900px) { .home-news-grid { grid-template-columns: 1fr !important; } }

        /* News slider image - stack on mobile */
        .home-news-content { flex-direction: row !important; }
        @media (max-width: 768px) {
          .home-news-content { flex-direction: column !important; }
          .home-news-image { width: 100% !important; min-height: 140px !important; }
        }

        /* ROW 3: Movers - 3 -> 2 -> 1 */
        .home-movers-grid { grid-template-columns: repeat(3, 1fr) !important; }
        @media (max-width: 768px) { .home-movers-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .home-movers-grid { grid-template-columns: 1fr !important; } }

        /* ROW 4: Calendar + Arab - 2 -> 1 */
        .home-calendar-grid { grid-template-columns: 1fr 1fr !important; }
        @media (max-width: 768px) { .home-calendar-grid { grid-template-columns: 1fr !important; } }

        /* Arab inner - 2 -> 1 */
        @media (max-width: 400px) { .home-arab-inner { grid-template-columns: 1fr !important; } }

        /* ROW 5: Table - responsive columns */
        .home-table-row { grid-template-columns: 80px 1fr 120px 100px 100px 100px !important; }
        @media (max-width: 900px) {
          .home-table-row { grid-template-columns: 60px 1fr 80px !important; }
          .home-table-col-name, .home-table-col-trend { display: none !important; }
        }
        @media (max-width: 640px) {
          .home-table-row { grid-template-columns: 50px 1fr 60px !important; }
          .home-table-col-change { display: none !important; }
        }

        /* ROW 6: Academy - 6 items in a row, responsive */
        .home-academy-inner { grid-template-columns: repeat(6, 1fr) !important; }
        @media (max-width: 768px) { .home-academy-inner { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 480px) { .home-academy-inner { grid-template-columns: repeat(2, 1fr) !important; } }

        /* ROW 6B: Banks grid - auto-fill responsive */
        .home-banks-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important; }
        @media (max-width: 640px) { .home-banks-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; } }

        /* ROW 7: Fear & Greed - 2 -> 1 */
        .home-fear-greed { grid-template-columns: 1fr 1fr !important; }
        @media (max-width: 640px) { .home-fear-greed { grid-template-columns: 1fr !important; } }

        /* ROW 8: Screener - 1fr 340px -> 1fr */
        .home-screener-grid { grid-template-columns: 1fr 340px !important; }
        @media (max-width: 900px) { .home-screener-grid { grid-template-columns: 1fr !important; } }
      `}} />

    </div>
  );
}