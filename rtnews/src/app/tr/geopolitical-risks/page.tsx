export const revalidate = 300;
import { safeFindRisks, safeFindCountryScores, safeFindEvents } from '@/lib/geopolitical/safe-db';
import { getRealtimeCountryScores, getRealtimeEvents, getRealtimeRisks } from '@/lib/geopolitical/realtime-data';
import GeopoliticalRisksPageClient from '../../geopolitical-risks/GeopoliticalRisksPageClient';

export const metadata = {
  title: 'Jeopolitik Riskler — Rouaa',
  description: 'Jeopolitik risk izleme paneli',
};

const safeParse = (str: string, fallback: any = []): any => {
  try { return JSON.parse(str); } catch { return fallback; }
};

export default async function TrGeopoliticalRisksPage() {
  let risks: any[] = [];
  let topCountries: any[] = [];
  let recentEvents: any[] = [];
  let usingRealtimeData = false;

  // Parallelized for faster TTFB
  try {
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    [risks, topCountries, recentEvents] = await Promise.all([
      safeFindRisks({ locale: 'tr', isPublished: true }, { orderBy: { publishedAt: 'desc' }, take: 30, select: { id: true, title: true, slug: true, summary: true, riskCategory: true, riskLevel: true, riskScore: true, aiGprScore: true, acledEventCount: true, acledFatalityCount: true, worldBankStability: true, gdeltTone: true, affectedRegions: true, affectedCountries: true, affectedAssets: true, scenarios: true, tradeRoutes: true, latitude: true, longitude: true, imageUrl: true, publishedAt: true, createdAt: true } }),
      safeFindCountryScores({ orderBy: { compositeScore: 'desc' }, take: 10 }),
      safeFindEvents({ eventDate: { gte: sevenDaysAgo } }, { orderBy: { eventDate: 'desc' }, take: 200 }),
    ]);
  } catch (e) { console.warn('[TrGeoRisks] DB error:', e); }

  if (risks.length === 0 || topCountries.length === 0) {
    usingRealtimeData = true;
    try {
      const [rtRisks, rtCountries, rtEvents] = await Promise.all([getRealtimeRisks('tr'), getRealtimeCountryScores(), getRealtimeEvents('tr')]);
      if (risks.length === 0) risks = rtRisks;
      if (topCountries.length === 0) topCountries = rtCountries.slice(0, 10);
      if (recentEvents.length === 0) recentEvents = rtEvents;
    } catch (e) { console.error('[TrGeoRisks] Realtime error:', e); }
  }

  const eventsByCountry: Record<string, number> = {};
  for (const ev of recentEvents) { eventsByCountry[ev.countryCode] = (eventsByCountry[ev.countryCode] || 0) + 1; }

  const serializedRisks = risks.map((r: any) => ({ ...r, affectedRegions: r.affectedRegions ? (typeof r.affectedRegions === 'string' ? safeParse(r.affectedRegions, []) : r.affectedRegions) : [], affectedCountries: r.affectedCountries ? (typeof r.affectedCountries === 'string' ? safeParse(r.affectedCountries, []) : r.affectedCountries) : [], affectedAssets: r.affectedAssets ? (typeof r.affectedAssets === 'string' ? safeParse(r.affectedAssets, []) : r.affectedAssets) : [], scenarios: r.scenarios ? (typeof r.scenarios === 'string' ? safeParse(r.scenarios, null) : r.scenarios) : null, tradeRoutes: r.tradeRoutes ? (typeof r.tradeRoutes === 'string' ? safeParse(r.tradeRoutes, []) : r.tradeRoutes) : [], publishedAt: r.publishedAt ? (typeof r.publishedAt === 'string' ? r.publishedAt : r.publishedAt.toISOString()) : null, createdAt: typeof r.createdAt === 'string' ? r.createdAt : r.createdAt?.toISOString?.() || new Date().toISOString() }));
  const serializedCountries = topCountries.map((c: any) => ({ ...c, updatedAt: c.updatedAt ? (typeof c.updatedAt === 'string' ? c.updatedAt : c.updatedAt.toISOString()) : new Date().toISOString() }));
  const serializedEvents = recentEvents.map((e: any) => ({ ...e, eventDate: e.eventDate ? (typeof e.eventDate === 'string' ? e.eventDate : e.eventDate.toISOString()) : new Date().toISOString(), importedAt: e.importedAt ? (typeof e.importedAt === 'string' ? e.importedAt : e.importedAt.toISOString()) : new Date().toISOString() }));

  return <GeopoliticalRisksPageClient risks={serializedRisks} topCountries={serializedCountries} recentEvents={serializedEvents} eventsByCountry={eventsByCountry} usingRealtimeData={usingRealtimeData} locale="tr" />;
}
