export const revalidate = 300;
import { safeFindEvents } from '@/lib/geopolitical/safe-db';
import { getRealtimeEvents } from '@/lib/geopolitical/realtime-data';
import HeatmapPageClient from '../../../geopolitical-risks/heatmap/HeatmapPageClient';

export const metadata = { title: 'Olay Isı Haritası — Jeopolitik Riskler — Rouaa', description: 'Jeopolitik olayların interaktif ısı haritası' };

export default async function TrGeopoliticalHeatmapPage() {
  let events: any[] = [];
  try { const d = new Date(); d.setDate(d.getDate() - 30); events = await safeFindEvents({ eventDate: { gte: d } }, { orderBy: { eventDate: 'desc' }, take: 2000 }); } catch (e) { console.warn('[TrGeoHeatmap] DB error:', e); }
  if (events.length === 0) { try { events = await getRealtimeEvents('tr'); } catch (e) { console.error('[TrGeoHeatmap] Realtime error:', e); } }
  const serializedEvents = events.map(e => ({ ...e, eventDate: e.eventDate ? (typeof e.eventDate === 'string' ? e.eventDate : e.eventDate.toISOString()) : new Date().toISOString(), importedAt: e.importedAt ? (typeof e.importedAt === 'string' ? e.importedAt : e.importedAt.toISOString()) : new Date().toISOString() }));
  return <HeatmapPageClient events={serializedEvents} locale="tr" />;
}
