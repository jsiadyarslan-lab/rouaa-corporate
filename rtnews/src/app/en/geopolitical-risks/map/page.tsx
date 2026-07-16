export const revalidate = 300;
import { safeFindCountryScores, safeFindEvents } from '@/lib/geopolitical/safe-db';
import { getRealtimeCountryScores, getRealtimeEvents } from '@/lib/geopolitical/realtime-data';
import FullScreenMapClient from '@/app/geopolitical-risks/map/FullScreenMapClient';

export const metadata = {
  title: 'Interactive Risk Map — Rouaa',
  description: 'Comprehensive interactive map of geopolitical risks with real-time country data and events',
};

export default async function EnGeopoliticalMapPage() {
  let countryScores: any[] = [];
  let events: any[] = [];

  try {
    countryScores = await safeFindCountryScores({ orderBy: { compositeScore: 'desc' } });
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    events = await safeFindEvents({ eventDate: { gte: thirtyDaysAgo } }, { orderBy: { eventDate: 'desc' }, take: 500 });
  } catch (e) {
    console.warn('[EnGeoMap] DB fetch error:', e);
  }

  if (countryScores.length === 0 || events.length === 0) {
    try {
      const [rtScores, rtEvents] = await Promise.all([
        getRealtimeCountryScores(),
        getRealtimeEvents('en'),
      ]);
      if (countryScores.length === 0) countryScores = rtScores;
      if (events.length === 0) events = rtEvents;
    } catch (e) {
      console.error('[EnGeoMap] Realtime fetch error:', e);
    }
  }

  const serializedScores = countryScores.map((c: any) => ({
    ...c,
    updatedAt: c.updatedAt ? (typeof c.updatedAt === 'string' ? c.updatedAt : c.updatedAt.toISOString()) : new Date().toISOString(),
  }));

  const serializedEvents = events.map((e: any) => ({
    ...e,
    eventDate: e.eventDate ? (typeof e.eventDate === 'string' ? e.eventDate : e.eventDate.toISOString()) : new Date().toISOString(),
    importedAt: e.importedAt ? (typeof e.importedAt === 'string' ? e.importedAt : e.importedAt.toISOString()) : new Date().toISOString(),
  }));

  return <FullScreenMapClient countryScores={serializedScores} events={serializedEvents} locale="en" />;
}
