// ─── French Homepage — Full SSR with direct DB + API calls ────────
// Architecture: ALL data fetched server-side with ISR.
// Mirrors the English homepage but with French text, LTR, /fr/ links.
// Uses locale='fr' for DB queries where applicable.
//
// ISR revalidates every 2 minutes → most visitors get cached HTML instantly.

import dynamicImport from 'next/dynamic';
import { db } from '@/lib/db';
import { getInitialContentFeed } from '@/lib/content-feed';
import type { Metadata } from 'next';

// ISR: Revalidate every 2 minutes
export const revalidate = 120;

// French page title — overrides root layout Arabic template
export const metadata: Metadata = {
  title: 'Rouaa — Actualités Financières IA',
};

// ═══ Eager imports ═══
import FrFinancialDisclaimer from '@/components/fr/FrFinancialDisclaimer';
import FrTelegramSubscribe from '@/components/fr/FrTelegramSubscribe';
import HomeClientComponents from '@/components/home/HomeClientComponents';
import FrHomePageContent from '@/components/fr/FrHomePageContent';
import PersonalizedGreeting from '@/components/home/PersonalizedGreeting';

const FrHeroSection = dynamicImport(() => import('@/components/fr/FrHeroSection'), {
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

// ─── Direct DB queries — French locale ───────────────────────────

async function getFrenchNews() {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return [];
    const articles = await db.newsItem.findMany({
      where: { 
        locale: 'fr',
        isReady: true, 
        isPublished: true, 
        newsType: 'live',
        slug: { not: '' }, 
        title: { not: '' },
      },
      orderBy: { fetchedAt: 'desc' },
      take: 10,
      select: { 
        id: true, slug: true, newsType: true, 
        title: true, summary: true, 
        category: true, categoryId: true,
        sentiment: true, sentimentScore: true, 
        impactLevel: true, source: true, sourceName: true,
        url: true, fetchedAt: true,
      },
    });
    return articles
      .filter((item: any) => !/[\u0600-\u06FF]/.test(item.title || ''))
      .map((item: any) => ({
      id: item.id, 
      slug: item.slug || undefined, 
      newsType: item.newsType || 'live',
      title: item.title || '', 
      summary: item.summary || '',
      category: item.category || 'Macro', 
      sentiment: item.sentiment || 'neutral',
      sentimentScore: item.sentimentScore || 55, 
      impactLevel: item.impactLevel || 'low',
      source: item.sourceName || item.source || '', 
      url: item.url || '',
      imageUrl: `/api/article-image/${item.id}`,
      time: item.fetchedAt?.toISOString() || new Date().toISOString(),
      hasFullContent: true,
    }));
  } catch (err: any) {
    console.error('[FrHomePage] getFrenchNews error:', err.message);
    return [];
  }
}

async function getFrenchAnalyses() {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return [];
    const analyses = await db.marketAnalysis.findMany({
      where: { locale: 'fr', isPublished: true },
      select: { id: true, title: true, slug: true, assetClass: true, analysisType: true, timeFrame: true, riskLevel: true, sentiment: true, confidenceScore: true, priceTarget: true, publishedAt: true, validUntil: true, createdAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 6,
    });
    return analyses
      .filter((a: any) => !/[\u0600-\u06FF]/.test(a.title || ''))
      .map((a: any) => {
      let priceTarget = a.priceTarget;
      try { priceTarget = JSON.parse(a.priceTarget); } catch { /* keep original */ }
      return { ...a, priceTarget };
    });
  } catch { return []; }
}

async function getFrenchReports(reportType?: string, limit: number = 3) {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return [];
    const where: any = { locale: 'fr', isPublished: true };
    if (reportType) where.reportType = reportType;
    const reports = await db.economicReport.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: { id: true, title: true, slug: true, reportType: true, summary: true, scope: true, marketImpact: true, confidenceScore: true, publishedAt: true, createdAt: true },
    });
    return reports.filter((r: any) => !/[\u0600-\u06FF]/.test(r.title || ''));
  } catch { return []; }
}

async function getFrenchInfographics() {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return [];
    const infographics = await db.infographic.findMany({
      where: { locale: 'fr', isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, slug: true, title: true, subtitle: true, sourceType: true, sourceId: true, sourceTitle: true, category: true, thumbnailUrl: true, impactScore: true, viewCount: true, isPublished: true, publishedAt: true, createdAt: true, slides: true },
    });
    return infographics.filter((i: any) => !/[\u0600-\u06FF]/.test(i.title || ''));
  } catch { return []; }
}

async function getFrenchCouncilBriefs() {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return [];
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
async function getFrHomePageData() {
  const [initialNews, analyses, reports, strategicReports, infographics, councilBriefs] = await Promise.all([
    getInitialContentFeed('fr'),
    getFrenchAnalyses(),
    getFrenchReports(undefined, 3),
    getFrenchReports('strategic', 4),
    getFrenchInfographics(),
    getFrenchCouncilBriefs(),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const shortTimeout = 3_000;

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
    safeFetch('/api/markets/arab?region=europe&locale=fr'),
    safeFetch('/api/markets/calendar?locale=fr'),
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

export default async function FrHomePage() {
  const data = await getFrHomePageData();

  return (
    <main className="min-h-screen pb-mobile-safe" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[1400px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
        <RouaaHeroSection locale="fr" />
      </div>
      <FrHeroSection articles={data.initialNews} />
      <div className="max-w-[1400px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        <PersonalizedGreeting locale="fr" />
      </div>
      <FrHomePageContent
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
        <FrFinancialDisclaimer />
      </div>
      <div className="max-w-[1400px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
        <FrTelegramSubscribe />
      </div>
    </main>
  );
}
