export const revalidate = 300;
import { safeFindEvents } from '@/lib/geopolitical/safe-db';
import { getRealtimeEvents } from '@/lib/geopolitical/realtime-data';
import HeatmapPageClient from '@/app/geopolitical-risks/heatmap/HeatmapPageClient';

export const metadata = {
  title: 'Event Heatmap — Geopolitical Risks — Rouaa',
  description: 'Interactive heatmap of geopolitical events with filters by type, country, and date',
};

export default async function EnGeopoliticalHeatmapPage() {
  let events: any[] = [];
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    events = await safeFindEvents({ eventDate: { gte: thirtyDaysAgo } }, { orderBy: { eventDate: 'desc' }, take: 2000 });
  } catch (e) {
    console.warn('[EnGeoHeatmap] DB fetch error:', e);
  }

  if (events.length === 0) {
    try {
      events = await getRealtimeEvents('en');
    } catch (e) {
      console.error('[EnGeoHeatmap] Realtime fetch error:', e);
    }
  }

  const serializedEvents = events.map(e => ({
    ...e,
    eventDate: e.eventDate ? (typeof e.eventDate === 'string' ? e.eventDate : e.eventDate.toISOString()) : new Date().toISOString(),
    importedAt: e.importedAt ? (typeof e.importedAt === 'string' ? e.importedAt : e.importedAt.toISOString()) : new Date().toISOString(),
  }));

  return <HeatmapPageClient events={serializedEvents} locale="en" />;
}
