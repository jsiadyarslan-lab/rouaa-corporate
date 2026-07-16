'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { InfographicData } from '@/components/infographics/types';

// Dynamic import for InfographicCard (echarts) — saves ~200-400KB off homepage bundle
const InfographicCard = dynamic(() => import('@/components/infographics/InfographicCard'));
import StockCompanyAnalysisSection from '@/components/home/StockCompanyAnalysisSection';
import HomeVideosSection from '@/components/home/HomeVideosSection';
import TechnicalAnalysesHomeSection from '@/components/home/TechnicalAnalysesHomeSection';
import QuickInsightCards from '@/components/home/QuickInsightCards';

// ── Isolated UTC Clock — prevents re-rendering entire page every second ──
const UtcClock = memo(function UtcClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toUTCString().slice(17, 25));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono-price" style={{ fontSize: 13, color: 'var(--cyan)' }}>UTC {time}</span>;
});


/* ══════════════════════════════════════════════════════════════════════
   TYPES — All data comes from live APIs
   ══════════════════════════════════════════════════════════════════════ */

interface PriceItem {
  symbol: string;
  displaySymbol: string;
  nameAr: string;
  nameEn?: string;
  price: number;
  change: number;
  changePercent: number;
  category: string;
  decimals: number;
  source: string;
  sparkline?: number[];
}

interface SentimentData {
  fearGreedIndex: { value: number; label: string };
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
  summary?: string;
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

/* Arabic-to-French category mapping for the French page */
const CATEGORY_MAP: Record<string, string> = {
  'أسهم': 'Actions',
  'عملات': 'Devises',
  'كريبتو': 'Crypto',
  'سلع': 'Matières Premières',
  'طاقة': 'Énergie',
};

function translateCategory(cat: string): string {
  return CATEGORY_MAP[cat] || cat;
}

/* Arabic-to-French central bank name mapping */
const CENTRAL_BANK_NAME_MAP: Record<string, string> = {
  'البنك المركزي السعودي': 'Banque Centrale Saoudienne (SAMA)',
  'البنك المركزي الإماراتي': 'Banque Centrale des EAU',
  'البنك المركزي المصري': 'Banque Centrale d\'Égypte',
  'البنك المركزي الكويتي': 'Banque Centrale du Koweït',
  'البنك المركزي القطري': 'Banque Centrale du Qatar',
  'البنك المركزي البحريني': 'Banque Centrale de Bahreïn',
  'البنك المركزي العماني': 'Banque Centrale d\'Oman',
  'البنك المركزي الأردني': 'Banque Centrale de Jordanie',
  'بنك المغرب': 'Bank Al-Maghrib',
  'الاحتياطي الفيدرالي الأمريكي': 'Réserve Fédérale (Fed)',
  'البنك المركزي الأوروبي': 'Banque Centrale Européenne (BCE)',
  'بنك إنجلترا': 'Banque d\'Angleterre (BoE)',
  'بنك اليابان': 'Banque du Japon (BoJ)',
  'البنك الوطني السويسري': 'Banque Nationale Suisse (BNS)',
  'البنك الشعبي الصيني': 'Banque Populaire de Chine (PBoC)',
};

/* Arabic-to-French sentiment label mapping */
const FEAR_GREED_LABEL_MAP: Record<string, string> = {
  'خوف شديد': 'Peur Extrême',
  'خوف': 'Peur',
  'حذر متوسط': 'Prudence Modérée',
  'طمع': 'Cupidité',
  'طمع شديد': 'Cupidité Extrême',
  'لا توجد بيانات': 'Aucune donnée',
};

const GEOPOLITICAL_LABEL_MAP: Record<string, string> = {
  'منخفض': 'Faible',
  'متوسط': 'Moyen',
  'مرتفع': 'Élevé',
};

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════ */

function fmtPrice(p: number, d: number) {
  return p.toFixed(d);
}

function stripStrategicPrefix(title: string): string {
  return title.replace(/^Report Strategic:\s*/i, '').replace(/^Report Strategic\s*[-–—:]\s*/i, '');
}

function timeAgo(dateStr: string | null | undefined): string {
  try {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'maintenant';
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'maintenant';
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}j`;
  } catch {
    return '';
  }
}

function formatEventTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
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

function trendLinePoints(positive: boolean): string {
  const w = 80;
  const h = 28;
  const mid = h / 2;
  const dir = positive ? -1 : 1;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 7; i++) {
    const x = (i / 7) * w;
    const baseY = mid + dir * (i / 7) * 8;
    const noise = Math.sin(i * 1.7) * 2.5;
    pts.push([x, baseY + noise]);
  }
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

function Sparkline({ positive, data }: { positive: boolean; data?: number[] }) {
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
      <polygon fill={`rgba(${colorRgb},0.08)`} points={`0,28 ${points} 80,28`} />
      <polyline fill="none" stroke={color} strokeWidth={hasRealData ? 1.5 : 1} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={hasRealData ? 'none' : '4 2'} points={points} />
    </svg>
  );
}

function Skeleton({ w, h }: { w: string; h: string }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: 'var(--r)' }} />;
}

function NoData({ message }: { message?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 0', color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>
      {message || 'Aucune donnée disponible'}
    </div>
  );
}

function SectionHeader({ title, linkText, linkHref }: { title: string; linkText?: string; linkHref?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 4, height: 22, borderRadius: 2, background: 'linear-gradient(180deg, var(--cyan), var(--purple))', boxShadow: '0 0 12px rgba(0,229,255,.35)' }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-head)', letterSpacing: 0.3 }}>{title}</span>
      </div>
      {linkText && linkHref && (
        <a href={linkHref} style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 700, textDecoration: 'none', opacity: 0.85, transition: 'opacity .15s' }}>
          {linkText} →
        </a>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — Fetches ALL data from live APIs (French)
   ══════════════════════════════════════════════════════════════════════ */

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
    return { ...p, category: translateCategory(p.category), sparkline: sparkline && sparkline.length >= 2 ? sparkline : undefined } as PriceItem;
  });
}

export default function FrHomePageContent({
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
        title: n.title || '',
        summary: n.summary || '',
        category: n.category || 'Macro',
        sentiment: n.sentiment || 'neutral', sentimentScore: n.sentimentScore || 55,
        impactLevel: n.impactLevel || 'low', source: n.source || '',
        url: n.url || '', imageUrl: n.imageUrl,
        sourceName: n.sourceName || n.source || '',
        href: n.href, kind: n.kind, badge: n.badge, isOfficialSource: n.isOfficialSource,
        time: n.time || n.fetchedAt,
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
  const hasServerData = initialNews.length > 0 || initialPrices.length > 0;
  const [loading, setLoading] = useState(!hasServerData);

  // ── UI state ──
  const [screenerTab, setScreenerTab] = useState<'buy' | 'sell' | 'hot'>('buy');
  const [moversTab, setMoversTab] = useState<'gainers' | 'losers'>('gainers');
  const [newsSlide, setNewsSlide] = useState(0);
  const [utcHour, setUtcHour] = useState(-1);
  const [marketTab, setMarketTab] = useState<string>('Tout');

  // ── UTC Hour for market sessions — updates every minute (not every second) ──
  useEffect(() => {
    const h = new Date().getUTCHours();
    setUtcHour(h);
    const id = setInterval(() => setUtcHour(new Date().getUTCHours()), 60000);
    return () => clearInterval(id);
  }, []);

  // ── Background refresh ──
  useEffect(() => {
    let cancelled = false;
    const FETCH_TIMEOUT = 12_000;

    async function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT): Promise<Response> {
      return fetch(url, { signal: AbortSignal.timeout(timeout) });
    }

    async function fetchAllData() {
      if (!hasServerData) setLoading(true);
      try {
        const [pricesRes, sentimentRes, arabRes, calendarRes, newsRes, banksRes, councilRes, analysesRes, reportsRes, strategicRes, infographicsRes] = await Promise.allSettled([
          fetchWithTimeout('/api/markets/prices?include=sparklines'),
          fetchWithTimeout('/api/markets/sentiment'),
          fetchWithTimeout('/api/markets/arab?region=europe&locale=fr'),
          fetchWithTimeout('/api/markets/calendar?locale=fr'),
          fetchWithTimeout('/api/fr/news?limit=10'),
          fetchWithTimeout('/api/markets/central-banks'),
          fetchWithTimeout('/api/integration/council?mode=briefs'),
          fetchWithTimeout('/api/fr/reports?limit=6'),
          fetchWithTimeout('/api/fr/reports?limit=3'),
          fetchWithTimeout('/api/fr/reports?type=strategic&limit=4'),
          fetchWithTimeout('/api/fr/infographics?published=true&limit=4'),
        ]);

        if (!cancelled) {
          if (pricesRes.status === 'fulfilled' && pricesRes.value.ok) {
            try {
              const data = await pricesRes.value.json();
              if (data.prices) {
                const enriched = enrichPricesWithSparklines(data.prices, data.sparklines || {});
                setPrices(enriched);
              }
            } catch (err) { console.error('[FrHomePageContent] Prices parse error:', err); }
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
              const ARABIC_REGEX = /[\u0600-\u06FF]/;
              setNews(data.news.filter((n: any) => !ARABIC_REGEX.test(n.title || '')));
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
            try {
              const data = await analysesRes.value.json();
              // Exclude strategic reports — they belong in the strategic card only
              const items = (data.analyses || data.reports || []).filter((r: any) => r.reportType !== 'strategic');
              if (Array.isArray(items)) setAnalyses(items);
            } catch {}
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
        console.error('[FrHomePageContent] Background refresh error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAllData();
    const interval = setInterval(fetchAllData, 2 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // ── News slider auto-advance (CSS-based progress, no 100ms re-renders) ──
  const SLIDE_DURATION = 5000;
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
  const forexPrices = useMemo(() => prices.filter(p => p.category === 'Devises'), [prices]);
  const metalsPrices = useMemo(() => prices.filter(p => p.category === 'Matières Premières'), [prices]);
  const cryptoPrices = useMemo(() => prices.filter(p => p.category === 'Crypto'), [prices]);
  const indicesPrices = useMemo(() => prices.filter(p => p.category === 'Actions'), [prices]);
  const energyPrices = useMemo(() => prices.filter(p => p.category === 'Énergie'), [prices]);

  const quickMarkets = prices;

  const marketPulseCards = useMemo(() =>
    [...prices].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 6)
      .map(p => ({ ...p, sparkline: p.sparkline })),
    [prices]
  );

  const mostTraded = useMemo(() =>
    [...prices].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 6)
      .map(p => ({ s: p.displaySymbol, c: p.changePercent, p: p.price, d: p.decimals, sparkline: p.sparkline })),
    [prices]
  );

  const commodities = useMemo(() =>
    [...metalsPrices, ...energyPrices].map(p => ({ s: p.displaySymbol, p: p.price, d: p.decimals, c: p.changePercent })),
    [metalsPrices, energyPrices]
  );

  const arabIndices = useMemo(() =>
    arabMarkets.map(m => ({ s: m.name || m.nameEn, p: m.value, d: 2, c: m.change, i: m.flag, sparkline: m.sparkline, src: m.source })),
    [arabMarkets]
  );

  const globalIndices = useMemo(() =>
    indicesPrices.map(p => ({ s: p.displaySymbol, p: p.price, d: p.decimals, c: p.changePercent })),
    [indicesPrices]
  );

  const screenerData = useMemo(() => {
    const buy = prices.filter(p => p.changePercent > 0.3).map(p => ({
      sym: p.displaySymbol, name: p.displaySymbol, p: p.price, c: p.changePercent, signal: 'buy' as const, conf: Math.min(95, 60 + Math.abs(p.changePercent) * 5)
    }));
    const sell = prices.filter(p => p.changePercent < -0.3).map(p => ({
      sym: p.displaySymbol, name: p.displaySymbol, p: p.price, c: p.changePercent, signal: 'sell' as const, conf: Math.min(95, 60 + Math.abs(p.changePercent) * 5)
    }));
    const hot = [...prices].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 8).map(p => ({
      sym: p.displaySymbol, name: p.displaySymbol, p: p.price, c: p.changePercent, signal: (p.changePercent >= 0 ? 'buy' : 'sell') as 'buy' | 'sell', conf: Math.min(95, 55 + Math.abs(p.changePercent) * 4)
    }));
    return { buy, sell, hot };
  }, [prices]);

  const sessions = [
    { name: 'Londres', flag: '🇬🇧', open: 8, close: 17 },
    { name: 'New York', flag: '🇺🇸', open: 13, close: 22 },
    { name: 'Tokyo', flag: '🇯🇵', open: 0, close: 9 },
    { name: 'Sydney', flag: '🇦🇺', open: 22, close: 7 },
    { name: 'Arabie Saoudite', flag: '🇸🇦', open: 7, close: 12 },
  ];

  // utcHour is now state (set every minute above), not derived from utcTime

  const gainers = useMemo(() =>
    [...prices].filter(p => p.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5),
    [prices]
  );
  const losers = useMemo(() =>
    [...prices].filter(p => p.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5),
    [prices]
  );

  const academyItems = [
    { abbr: 'P/E', full: 'Price to Earnings', icon: '📊', cat: 'Fondamental' },
    { abbr: 'RSI', full: 'Relative Strength Index', icon: '📈', cat: 'Technique' },
    { abbr: 'GDP', full: 'Gross Domestic Product', icon: '🌍', cat: 'Macro' },
    { abbr: 'CPI', full: 'Consumer Price Index', icon: '💰', cat: 'Macro' },
    { abbr: 'EPS', full: 'Earnings Per Share', icon: '💵', cat: 'Fondamental' },
    { abbr: 'MACD', full: 'Moving Avg Convergence Divergence', icon: '📉', cat: 'Technique' },
  ];

  const fgValue = sentiment?.fearGreedIndex?.value ?? 50;

  const marketTabs = ['Tout', 'Devises', 'Matières Premières', 'Crypto', 'Énergie'];
  const filteredMarketPrices = useMemo(() => {
    if (marketTab === 'Tout') return prices;
    return prices.filter(p => p.category === marketTab);
  }, [prices, marketTab]);

  const topNews = news.slice(0, 5);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 var(--space-md) var(--space-xl)' }}>

      {/* ═══ ROW 1: MARKET PULSE CARDS ═══ */}
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
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = positive ? '0 4px 24px rgba(34,197,94,.12)' : '0 4px 24px rgba(239,83,80,.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,229,255,0.05)'; }}
                >
                  <div style={{ position: 'absolute', top: -20, left: -20, width: 60, height: 60, borderRadius: '50%', background: positive ? 'rgba(34,197,94,.06)' : 'rgba(239,83,80,.06)', filter: 'blur(20px)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, position: 'relative' }}>
                    <div>
                      <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', display: 'block' }}>{p.displaySymbol}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{p.displaySymbol}</span>
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
          <NoData message="Aucune donnée de prix disponible" />
        )}
      </section>

      {/* ═══ ROW 2: NEWS ═══ */}
      <section className="home-news-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* Sidebar: Latest News */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-md)' }}>
            <span className="sh-title" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>Dernières Actualités</span>
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
                const title = n.title;
                const isActive = i === newsSlide;
                return (
                  <a
                    key={n.id}
                    href={n.href || (n.slug ? `/fr/news/${n.slug}` : n.id ? `/fr/news/${n.id}` : '#')}
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
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--r)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg4)', position: 'relative' }}>
                      <img src={`/api/article-image/${n.id}`} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} width={32} height={32}
                        onError={e => { const el = e.target as HTMLImageElement; el.style.opacity = '0'; }}
                        onLoad={e => { const el = e.target as HTMLImageElement; el.style.opacity = '1'; }}
                        loading="eager" />
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
              <NoData message="Aucune actualité disponible" />
            )}
          </div>

          <div style={{ marginTop: 'var(--space-sm)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border)' }}>
            <a href="/fr/news" style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 700, textDecoration: 'none' }}>Voir Tout →</a>
          </div>
        </div>

        {/* Middle: Strategic Reports */}
        <div className="glass-card" style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 0 24px rgba(139,92,246,0.08)' }}>
          <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 14 }}>🛡️</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>Rapports Stratégiques</span>
              </div>
              <a href="/fr/strategic-reports" style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 700, textDecoration: 'none', opacity: 0.85 }}>Voir Tout →</a>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="56px" />)}
              </div>
            ) : strategicReports.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', maxHeight: 360 }} className="custom-scrollbar">
                {strategicReports.map((r) => {
                  const scopeLabel = r.scope === 'arabic' ? 'Arabe' : r.scope === 'global' ? 'Mondial' : 'Régional';
                  const impactColor = r.marketImpact === 'bullish' ? 'var(--bull)' : r.marketImpact === 'bearish' ? 'var(--bear)' : 'var(--text3)';
                  const impactLabel = r.marketImpact === 'bullish' ? 'Haussier' : r.marketImpact === 'bearish' ? 'Baissier' : 'Neutre';
                  return (
                    <a
                      key={r.id}
                      href={`/fr/strategic-reports/${r.slug}`}
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
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'rgba(139,92,246,.1)', color: '#8B5CF6', fontWeight: 700 }}>Stratégique</span>
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
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)', textAlign: 'center' as const }}>Aucun rapport stratégique disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Reports & Analysis */}
        <div className="glass-card" style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 0 24px rgba(0,229,255,0.06)' }}>
          <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>Rapports &amp; Analyses</span>
              </div>
              <a href="/fr/reports" style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 700, textDecoration: 'none', opacity: 0.85 }}>Voir Tout →</a>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="56px" />)}
              </div>
            ) : analyses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', maxHeight: 360 }} className="custom-scrollbar">
                {analyses.map((a) => (
                  <a
                    key={a.id}
                    href={`/fr/reports/${a.slug}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderRadius: 'var(--r)', background: 'var(--bg4)',
                      borderInlineStart: '3px solid var(--cyan)',
                      textDecoration: 'none', cursor: 'pointer',
                      transition: 'background .2s',
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--r)', background: 'var(--cyan2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 14 }}>📊</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', margin: 0, lineHeight: 1.5, display: '-webkit-box' as const, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{a.title}</p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' as const }}>
                        <span style={{ fontSize: 10, color: 'var(--cyan)', fontWeight: 700 }}>{a.assetClass}</span>
                        <span style={{ fontSize: 10, color: 'var(--text4)' }}>•</span>
                        <span style={{ fontSize: 10, color: 'var(--text3)' }}>{a.sentiment}</span>
                        {a.confidenceScore > 0 && <span style={{ fontSize: 10, color: 'var(--cyan)' }}>{a.confidenceScore}%</span>}
                        <span style={{ fontSize: 10, color: 'var(--text4)' }}>{timeAgo(a.publishedAt)}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)', textAlign: 'center' as const }}>Aucune analyse disponible</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ ROW 2.5: STOCK & COMPANY ANALYSIS ═══ */}
      <StockCompanyAnalysisSection locale="fr" />
      <HomeVideosSection locale="fr" />
      <TechnicalAnalysesHomeSection locale="fr" />
      <QuickInsightCards locale="fr" />

      {/* ═══ ROW 2.5.5: INFOGRAPHICS — below stock analysis, matches Arabic homepage design ═══ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 22, borderRadius: 2, background: 'linear-gradient(180deg, #d4af37, #059669)', boxShadow: '0 0 10px rgba(212,175,55,.35)' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-head)' }}>Infographies</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, marginLeft: 4 }}>Analyses Visuelles</span>
          </div>
          <a href="/fr/infographics" style={{ background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.2)', borderRadius: 'var(--r)', padding: '6px 14px', color: '#d4af37', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', transition: 'all .2s', minHeight: 36, display: 'flex', alignItems: 'center' }}>Voir Tout →</a>
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
            {infographics.slice(0, 4).map((ig) => (
              <InfographicCard key={ig.id} infographic={ig as unknown as InfographicData} locale="fr" />
            ))}
          </div>
        ) : (
          <NoData message="Aucune infographie disponible pour le moment" />
        )}
      </section>

      {/* ═══ ROW 3: MARKET TABLE ═══ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <SectionHeader title="Aperçu du Marché" linkText="Voir Tout" linkHref="/fr/markets" />

        {/* Market table tabs */}
        <div className="flex items-center gap-2 mb-4">
          {marketTabs.map(tab => (
            <button key={tab} onClick={() => setMarketTab(tab)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
              style={{
                background: marketTab === tab ? 'var(--cyan2)' : 'transparent',
                color: marketTab === tab ? 'var(--cyan)' : 'var(--text3)',
                border: marketTab === tab ? '1px solid rgba(0,229,255,0.2)' : '1px solid var(--border)',
              }}>
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="glass-card p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} w="100%" h="40px" />)}
          </div>
        ) : filteredMarketPrices.length > 0 ? (
          <div className="glass-card overflow-hidden" style={{ borderRadius: 'var(--r2)' }}>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full" style={{ fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text3)' }}>Symbole</th>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text3)' }}>Prix</th>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text3)' }}>Changement</th>
                    <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell" style={{ color: 'var(--text3)' }}>Tendance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarketPrices.map((p) => {
                    const positive = p.changePercent >= 0;
                    return (
                      <tr key={p.symbol} className="transition-colors hover:bg-[rgba(0,229,255,0.03)]" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-4 py-2.5">
                          <a href={`/fr/markets?symbol=${p.symbol}`} style={{ textDecoration: 'none', color: 'var(--text-head)', fontWeight: 700 }} className="font-mono-price">
                            {p.displaySymbol}
                          </a>
                          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{translateCategory(p.category)}</div>
                        </td>
                        <td className="text-right px-4 py-2.5 font-mono-price font-semibold" style={{ color: 'var(--text-head)' }}>
                          {fmtPrice(p.price, p.decimals)}
                        </td>
                        <td className="text-right px-4 py-2.5">
                          <span className="font-mono-price font-semibold" style={{ color: positive ? 'var(--bull)' : 'var(--bear)' }}>
                            {positive ? '+' : ''}{p.changePercent.toFixed(2)}%
                          </span>
                        </td>
                        <td className="text-right px-4 py-2.5 hidden sm:table-cell">
                          <Sparkline positive={positive} data={p.sparkline} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <NoData message="Aucune donnée de marché disponible" />
        )}
      </section>

      {/* ═══ ROW 4: TOP MOVERS ═══ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <SectionHeader title="Mouvements du Jour" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gainers */}
          <div className="glass-card p-4" style={{ borderRadius: 'var(--r2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: 'var(--bull)', fontWeight: 700, fontSize: 14 }}>▲ Plus Haussiers</span>
            </div>
            {gainers.length > 0 ? gainers.map(p => (
              <a key={p.symbol} href={`/fr/markets?symbol=${p.symbol}`} className="flex items-center justify-between py-2 transition-colors hover:bg-[rgba(34,197,94,0.04)]" style={{ borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                <div>
                  <span className="font-mono-price font-semibold" style={{ color: 'var(--text-head)', fontSize: 12 }}>{p.displaySymbol}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 8 }}>{translateCategory(p.category)}</span>
                </div>
                <span className="font-mono-price font-semibold" style={{ color: 'var(--bull)', fontSize: 12 }}>+{p.changePercent.toFixed(2)}%</span>
              </a>
            )) : <NoData message="Aucun haussier trouvé" />}
          </div>
          {/* Losers */}
          <div className="glass-card p-4" style={{ borderRadius: 'var(--r2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: 'var(--bear)', fontWeight: 700, fontSize: 14 }}>▼ Plus Baissiers</span>
            </div>
            {losers.length > 0 ? losers.map(p => (
              <a key={p.symbol} href={`/fr/markets?symbol=${p.symbol}`} className="flex items-center justify-between py-2 transition-colors hover:bg-[rgba(239,83,80,0.04)]" style={{ borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                <div>
                  <span className="font-mono-price font-semibold" style={{ color: 'var(--text-head)', fontSize: 12 }}>{p.displaySymbol}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 8 }}>{translateCategory(p.category)}</span>
                </div>
                <span className="font-mono-price font-semibold" style={{ color: 'var(--bear)', fontSize: 12 }}>{p.changePercent.toFixed(2)}%</span>
              </a>
            )) : <NoData message="Aucun baissier trouvé" />}
          </div>
        </div>
      </section>

      {/* ═══ ROW 5: SENTIMENT & CALENDAR ═══ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fear & Greed */}
          <div className="glass-card p-4" style={{ borderRadius: 'var(--r2)' }}>
            <SectionHeader title="Indice de Peur & Cupidité" linkText="Voir Tout" linkHref="/fr/market-pulse" />
            {sentiment ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono-price text-2xl font-bold" style={{ color: 'var(--text-head)' }}>{sentiment.fearGreedIndex.value}</span>
                  <span className="text-sm font-semibold" style={{ color: fgValue <= 25 ? 'var(--bear)' : fgValue <= 45 ? 'var(--gold)' : fgValue <= 55 ? 'var(--text2)' : fgValue <= 75 ? 'var(--cyan)' : 'var(--bull)' }}>
                    {FEAR_GREED_LABEL_MAP[sentiment.fearGreedIndex.label] || sentiment.fearGreedIndex.label}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'linear-gradient(90deg, var(--bear), var(--gold), var(--cyan), var(--bull))' }}>
                  <div className="h-2 rounded-full" style={{ width: `${fgValue}%`, background: 'var(--text)', opacity: 0.3, transition: 'width 0.5s' }} />
                </div>
              </div>
            ) : (
              <NoData message="Aucune donnée de sentiment disponible" />
            )}
          </div>

          {/* Economic Calendar */}
          <div className="glass-card p-4" style={{ borderRadius: 'var(--r2)' }}>
            <SectionHeader title="Calendrier Économique" linkText="Voir Tout" linkHref="/fr/calendar" />
            {calendar.length > 0 ? calendar.slice(0, 5).map(ev => (
              <div key={ev.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-head)' }}>{ev.event}</span>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{ev.country} • {ev.currency}</div>
                </div>
                <div className="text-right">
                  <span className="font-mono-price" style={{ fontSize: 11, color: 'var(--text2)' }}>{formatEventTime(ev.time)}</span>
                  <div className="flex items-center gap-1 justify-end">
                    {Array.from({ length: ev.impactLevel }).map((_, i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: ev.impactLevel >= 3 ? 'var(--bear)' : 'var(--gold)' }} />
                    ))}
                  </div>
                </div>
              </div>
            )) : <NoData message="Aucun événement économique à venir" />}
          </div>
        </div>
      </section>

      {/* ═══ ROW 6: ARAB MARKETS ═══ */}
      {arabMarkets.length > 0 && (
        <section style={{ marginBottom: 'var(--space-lg)' }}>
          <SectionHeader title="Marchés Européens" linkText="Voir Tout" linkHref="/fr/markets" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {arabMarkets.map(m => {
              const positive = m.change >= 0;
              return (
                <a key={m.id} href="/fr/markets" className="glass-card p-3 transition-all hover:scale-[1.02]" style={{ borderRadius: 'var(--r)', textDecoration: 'none' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize: 16 }}>{m.flag}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-head)' }}>{m.nameEn || m.name}</span>
                  </div>
                  <span className="font-mono-price block" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>{m.value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</span>
                  <span className="font-mono-price" style={{ fontSize: 11, color: positive ? 'var(--bull)' : 'var(--bear)' }}>
                    {positive ? '+' : ''}{m.change.toFixed(2)}%
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ ROW 8: ACADEMY ═══ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <SectionHeader title="Académie" linkText="Voir Tout" linkHref="/fr/academy" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {academyItems.map(item => (
            <div key={item.abbr} className="glass-card p-3 text-center transition-all hover:scale-[1.03]" style={{ borderRadius: 'var(--r)', cursor: 'pointer' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span className="block font-mono-price font-bold" style={{ fontSize: 13, color: 'var(--cyan)', marginTop: 4 }}>{item.abbr}</span>
              <span className="block" style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.3 }}>{item.full}</span>
              <span className="block" style={{ fontSize: 9, color: 'var(--text4)', marginTop: 2 }}>{item.cat}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
