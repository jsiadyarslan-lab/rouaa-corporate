export const revalidate = 300;
import { safeFindRisks, safeFindCountryScores, safeFindEvents } from '@/lib/geopolitical/safe-db';
import { getRealtimeCountryScores, getRealtimeEvents, getRealtimeRisks } from '@/lib/geopolitical/realtime-data';
import GeopoliticalRisksPageClient from './GeopoliticalRisksPageClient';

export const metadata = {
  title: 'المخاطر الجيوسياسية — رؤى',
  description: 'لوحة متابعة المخاطر الجيوسياسية: مؤشرات الخطر، التحليلات، السيناريوهات، وتأثيرها على الأسواق',
};

// Default locale for the Arabic (root) page
const PAGE_LOCALE = 'ar';

// Fallback JSON parse — needed for realtime data that may still be string
const safeParse = (value: any, fallback: any = []): any => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value; // Prisma Json type returns objects directly
  if (typeof value === 'string') { try { return JSON.parse(value); } catch { return fallback; } }
  return fallback;
};

export default async function GeopoliticalRisksPage() {
  // Try database first, then fall back to realtime API data
  let risks: any[] = [];
  let topCountries: any[] = [];
  let recentEvents: any[] = [];
  let usingRealtimeData = false;

  // 1. Try fetching from database — parallelized for faster TTFB
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    [risks, topCountries, recentEvents] = await Promise.all([
      safeFindRisks(
        { locale: PAGE_LOCALE, isPublished: true },
        { orderBy: { publishedAt: 'desc' }, take: 30, select: {
          id: true, title: true, slug: true, summary: true,
          riskCategory: true, riskLevel: true, riskScore: true,
          aiGprScore: true, acledEventCount: true, acledFatalityCount: true,
          worldBankStability: true, gdeltTone: true,
          affectedRegions: true, affectedCountries: true, affectedAssets: true,
          scenarios: true, tradeRoutes: true,
          latitude: true, longitude: true, imageUrl: true,
          publishedAt: true, createdAt: true,
        }}
      ),
      safeFindCountryScores({ orderBy: { compositeScore: 'desc' }, take: 10 }),
      safeFindEvents(
        { eventDate: { gte: sevenDaysAgo } },
        { orderBy: { eventDate: 'desc' }, take: 200 }
      ),
    ]);
  } catch (e) {
    console.warn('[GeoRisks] DB fetch error:', e);
  }

  // 2. If database is empty, fetch from realtime APIs
  if (risks.length === 0 || topCountries.length === 0) {
    console.log('[GeoRisks] DB empty, fetching realtime data...');
    usingRealtimeData = true;

    try {
      const [rtRisks, rtCountries, rtEvents] = await Promise.all([
        getRealtimeRisks(PAGE_LOCALE),
        getRealtimeCountryScores(),
        getRealtimeEvents(PAGE_LOCALE),
      ]);

      if (risks.length === 0) risks = rtRisks;
      if (topCountries.length === 0) topCountries = rtCountries.slice(0, 10);
      if (recentEvents.length === 0) recentEvents = rtEvents;
    } catch (e) {
      console.error('[GeoRisks] Realtime fetch error:', e);
    }
  }

  // Group events by countryCode
  const eventsByCountry: Record<string, number> = {};
  for (const ev of recentEvents) {
    eventsByCountry[ev.countryCode] = (eventsByCountry[ev.countryCode] || 0) + 1;
  }

  // Serialize for client — Prisma Json columns are auto-parsed, but we still
  // need date serialization and fallback for realtime string data
  const serializedRisks = risks.map((r: any) => ({
    ...r,
    affectedRegions: safeParse(r.affectedRegions, []),
    affectedCountries: safeParse(r.affectedCountries, []),
    affectedAssets: safeParse(r.affectedAssets, []),
    scenarios: safeParse(r.scenarios, null),
    tradeRoutes: safeParse(r.tradeRoutes, []),
    publishedAt: r.publishedAt ? (typeof r.publishedAt === 'string' ? r.publishedAt : r.publishedAt.toISOString()) : null,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : r.createdAt?.toISOString?.() || new Date().toISOString(),
  }));

  const serializedCountries = topCountries.map((c: any) => ({
    ...c,
    updatedAt: c.updatedAt ? (typeof c.updatedAt === 'string' ? c.updatedAt : c.updatedAt.toISOString()) : new Date().toISOString(),
  }));

  const serializedEvents = recentEvents.map((e: any) => ({
    ...e,
    eventDate: e.eventDate ? (typeof e.eventDate === 'string' ? e.eventDate : e.eventDate.toISOString()) : new Date().toISOString(),
    importedAt: e.importedAt ? (typeof e.importedAt === 'string' ? e.importedAt : e.importedAt.toISOString()) : new Date().toISOString(),
  }));

  return (
    <GeopoliticalRisksPageClient
      risks={serializedRisks}
      topCountries={serializedCountries}
      recentEvents={serializedEvents}
      eventsByCountry={eventsByCountry}
      usingRealtimeData={usingRealtimeData}
      locale={PAGE_LOCALE}
    />
  );
}
