// ─── Home Page V61 — Full SSR with direct DB + API calls ────────
// Architecture: ALL data fetched server-side with ISR.
// No HTTP self-requests — calls DB and APIs directly for reliability.
// Users see a fully populated page immediately.
//
// ISR revalidates every 2 minutes → most visitors get cached HTML instantly.

import dynamicImport from 'next/dynamic';
import { db } from '@/lib/db';
import { getInitialContentFeed } from '@/lib/content-feed';

// ISR: Revalidate every 2 minutes
export const revalidate = 120;

// ═══ Eager imports ═══
import FinancialDisclaimer from '@/components/rouaa/FinancialDisclaimer';
import TelegramSubscribe from '@/components/rouaa/TelegramSubscribe';
import HomeClientComponents from '@/components/home/HomeClientComponents';
import HomePageContent from '@/components/home/HomePageContent';
import PersonalizedGreeting from '@/components/home/PersonalizedGreeting';

const HeroSection = dynamicImport(() => import('@/components/rouaa/HeroSection'), {
  loading: () => <SectionSkeleton height={280} />,
});

const RouaaHeroSection = dynamicImport(() => import('@/components/home/RouaaHeroSection'), {
  loading: () => <SectionSkeleton height={520} />,
});

function SectionSkeleton({ height }: { height: number }) {
  return (
    <div style={{ minHeight: height }}>
      <div className="max-w-[1400px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)', minHeight: height }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton" style={{ width: '120px', height: '20px' }} />
        </div>
        <div className="space-y-3">
          <div className="skeleton" style={{ height: '60px', borderRadius: 'var(--r)' }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--r)' }} />
            <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--r)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Direct DB queries — guaranteed to work, no HTTP overhead ───

async function getInitialNews() {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return [];
    // V260 FIX: Removed generatedImage, contentAr, aiAnalysis from WHERE — matching
    // English homepage + getNewsFromDB. These 3 extra filters were added in V50 but
    // getNewsFromDB removed them in V73 because they caused valid published articles
    // to be hidden from the site. The Arabic homepage was NEVER updated to match,
    // causing ALL Arabic articles with missing/empty generatedImage, contentAr, or
    // aiAnalysis to be invisible — even though isReady=true and isPublished=true.
    // The Publisher agent is the GATEKEEPER (V42 principle): if it set isReady=true,
    // the article IS complete and MUST be visible. Images are handled by
    // /api/article-image/{id} proxy; content/analysis are loaded on detail pages.
    const articles = await db.newsItem.findMany({
      where: { locale: 'ar', isReady: true, isPublished: true, newsType: { in: ['live', 'breaking'] }, slug: { not: '' }, titleAr: { not: '' } },
      orderBy: { fetchedAt: 'desc' },
      take: 10,
      select: { id: true, slug: true, newsType: true, title: true, titleAr: true, summary: true, summaryAr: true, category: true, sentiment: true, sentimentScore: true, impactLevel: true, source: true, url: true, fetchedAt: true },
    });
    // Defensive filter: only include articles whose Arabic title actually contains Arabic text
    // This prevents English-only titles from leaking into the Arabic slider
    const ARABIC_REGEX = /[\u0600-\u06FF]/;
    return articles
      .filter((item: any) => ARABIC_REGEX.test(item.titleAr || ''))
      .map((item: any) => ({
      id: item.id, slug: item.slug || undefined, newsType: item.newsType || 'live',
      title: item.titleAr || item.title || '', titleAr: item.titleAr || undefined,
      summary: item.summaryAr || item.summary || '', summaryAr: item.summaryAr || undefined,
      category: item.category || 'اقتصاد كلي', sentiment: item.sentiment || 'neutral',
      sentimentScore: item.sentimentScore || 55, impactLevel: item.impactLevel || 'low',
      source: item.source || '', url: item.url || '',
      imageUrl: `/api/article-image/${item.id}`,
      time: item.fetchedAt?.toISOString() || new Date().toISOString(),
      translatedTitle: item.titleAr || undefined, translatedSummary: item.summaryAr || undefined,
      hasFullContent: true,
    }));
  } catch (err: any) {
    console.error('[HomePage] getInitialNews error:', err.message);
    return [];
  }
}


async function getInitialAnalyses() {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return [];
    const analyses = await db.marketAnalysis.findMany({
      where: { locale: 'ar', isPublished: true },
      select: { id: true, title: true, slug: true, assetClass: true, analysisType: true, timeFrame: true, riskLevel: true, sentiment: true, confidenceScore: true, priceTarget: true, publishedAt: true, validUntil: true, createdAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 6,
    });
    return analyses.map(a => {
      let priceTarget = a.priceTarget;
      try { priceTarget = JSON.parse(a.priceTarget); } catch { /* keep original */ }
      return { ...a, priceTarget };
    });
  } catch { return []; }
}

async function getInitialReports(reportType?: string, limit: number = 3) {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return [];
    const where: any = { locale: 'ar', isPublished: true };
    if (reportType) where.reportType = reportType;
    const reports = await db.economicReport.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: { id: true, title: true, slug: true, reportType: true, summary: true, scope: true, marketImpact: true, confidenceScore: true, publishedAt: true, createdAt: true },
    });
    return reports;
  } catch { return []; }
}

async function getInitialInfographics() {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return [];
    const infographics = await db.infographic.findMany({
      where: { locale: 'ar', isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, slug: true, title: true, subtitle: true, sourceType: true, sourceId: true, sourceTitle: true, category: true, thumbnailUrl: true, impactScore: true, viewCount: true, isPublished: true, publishedAt: true, createdAt: true, slides: true },
    });
    return infographics;
  } catch { return []; }
}

async function getInitialCouncilBriefs() {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return [];
    // V5 FIX: Changed db.councilSignal → db.councilBrief (councilSignal model doesn't exist)
    // CouncilBrief fields: isActive, createdAt, pair, direction, entryPrice, stopLoss, etc.
    const signals = await db.councilBrief.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, pair: true, direction: true, entryPrice: true, stopLoss: true, takeProfit: true, confidence: true, timeframe: true, analysisSummary: true, createdAt: true },
    });
    return signals;
  } catch { return []; }
}

// ─── Fetch ALL homepage data server-side ────────────────────────
// Direct DB queries for DB data, API route calls for market data.
async function getHomePageData() {
  // Phase 1: DB queries (fast, guaranteed to work)
  // V1219: Use unified content feed (news + reports + analyses + stocks) for slider
  const [initialNews, analyses, reports, strategicReports, infographics, councilBriefs] = await Promise.all([
    getInitialContentFeed(),
    getInitialAnalyses(),
    getInitialReports(undefined, 3),
    getInitialReports('strategic', 4),
    getInitialInfographics(),
    getInitialCouncilBriefs(),
  ]);

  // Phase 2: Market data via API routes (external APIs, may fail)
  // V350: Removed 'Cache-Control: no-cache' — ISR handles revalidation.
  // This allows Next.js to cache API responses instead of re-fetching every ISR cycle.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const shortTimeout = 3_000; // V5: Reduced from 8s to 3s — fail fast, don't block page load

  async function safeFetch(path: string): Promise<any> {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        signal: AbortSignal.timeout(shortTimeout),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  const [pricesData, sentimentData, arabData, calendarData, banksData] = await Promise.all([
    safeFetch('/api/markets/prices?include=sparklines'),
    safeFetch('/api/markets/sentiment'),
    safeFetch('/api/markets/arab?region=arab&locale=ar'),
    safeFetch('/api/markets/calendar?locale=ar'),
    safeFetch('/api/markets/central-banks'),
  ]);

  return {
    initialNews,
    prices: pricesData?.prices || [],
    sparklines: pricesData?.sparklines || {},
    sentiment: sentimentData || null,
    arabMarkets: arabData?.markets || [],
    calendar: calendarData?.events || [],
    centralBanks: banksData?.banks || [],
    councilBriefs,
    analyses,
    reports,
    strategicReports,
    infographics,
  };
}

export default async function HomePage() {
  const data = await getHomePageData();

  return (
    <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[1400px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
        <RouaaHeroSection locale="ar" />
      </div>
      <HeroSection articles={data.initialNews} />
      <div className="max-w-[1400px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        <PersonalizedGreeting />
      </div>
      <HomePageContent
        initialNews={data.initialNews}
        initialPrices={data.prices}
        initialSparklines={data.sparklines}
        initialSentiment={data.sentiment}
        initialArabMarkets={data.arabMarkets}
        initialCalendar={data.calendar}
        initialCentralBanks={data.centralBanks}
        initialCouncilBriefs={data.councilBriefs}
        initialAnalyses={data.analyses}
        initialReports={data.reports}
        initialStrategicReports={data.strategicReports}
        initialInfographics={data.infographics}
      />
      <HomeClientComponents />
      <div className="max-w-[1400px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)', marginTop: '8px', marginBottom: '8px' }}>
        <FinancialDisclaimer />
      </div>
      <div className="max-w-[1400px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
        <TelegramSubscribe />
      </div>
    </main>
  );
}
