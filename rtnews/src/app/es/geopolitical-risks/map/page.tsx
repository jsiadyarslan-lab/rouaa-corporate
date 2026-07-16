export const revalidate = 300;
import { safeFindCountryScores, safeFindEvents } from '@/lib/geopolitical/safe-db';
import { getRealtimeCountryScores, getRealtimeEvents } from '@/lib/geopolitical/realtime-data';
import FullScreenMapClient from '../../../geopolitical-risks/map/FullScreenMapClient';

export const metadata = { title: 'Mapa Interactivo de Riesgos — Rouaa', description: 'Mapa interactivo completo de riesgos geopolíticos' };

export default async function EsGeopoliticalMapPage() {
  let countryScores: any[] = [], events: any[] = [];
  try {
    countryScores = await safeFindCountryScores({ orderBy: { compositeScore: 'desc' } });
    const d = new Date(); d.setDate(d.getDate() - 30);
    events = await safeFindEvents({ eventDate: { gte: d } }, { orderBy: { eventDate: 'desc' }, take: 500 });
  } catch (e) { console.warn('[EsGeoMap] DB error:', e); }
  if (countryScores.length === 0 || events.length === 0) {
    try { const [s, e2] = await Promise.all([getRealtimeCountryScores(), getRealtimeEvents('es')]); if (countryScores.length === 0) countryScores = s; if (events.length === 0) events = e2; } catch (e) { console.error('[EsGeoMap] Realtime error:', e); }
  }
  const serializedScores = countryScores.map((c: any) => ({ ...c, updatedAt: c.updatedAt ? (typeof c.updatedAt === 'string' ? c.updatedAt : c.updatedAt.toISOString()) : new Date().toISOString() }));
  const serializedEvents = events.map((e: any) => ({ ...e, eventDate: e.eventDate ? (typeof e.eventDate === 'string' ? e.eventDate : e.eventDate.toISOString()) : new Date().toISOString(), importedAt: e.importedAt ? (typeof e.importedAt === 'string' ? e.importedAt : e.importedAt.toISOString()) : new Date().toISOString() }));
  return <FullScreenMapClient countryScores={serializedScores} events={serializedEvents} locale="es" />;
}
