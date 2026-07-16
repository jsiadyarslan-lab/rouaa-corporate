export const revalidate = 300;
import { safeFindEvents } from '@/lib/geopolitical/safe-db';
import { getRealtimeEvents } from '@/lib/geopolitical/realtime-data';
import HeatmapPageClient from './HeatmapPageClient';

export const metadata = {
  title: 'خريطة حرارة الأحداث — المخاطر الجيوسياسية — رؤى',
  description: 'خريطة حرارة تفاعلية للأحداث الجيوسياسية مع فلاتر حسب النوع والدولة والتاريخ',
};

export default async function GeopoliticalHeatmapPage() {
  let events: any[] = [];

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    events = await safeFindEvents(
      { eventDate: { gte: thirtyDaysAgo } },
      { orderBy: { eventDate: 'desc' }, take: 2000 },
    );
  } catch (e) {
    console.warn('[GeoHeatmap] DB fetch error:', e);
  }

  // Fallback to realtime APIs
  if (events.length === 0) {
    try {
      events = await getRealtimeEvents('ar');
    } catch (e) {
      console.error('[GeoHeatmap] Realtime fetch error:', e);
    }
  }

  const serializedEvents = events.map(e => ({
    ...e,
    eventDate: e.eventDate ? (typeof e.eventDate === 'string' ? e.eventDate : e.eventDate.toISOString()) : new Date().toISOString(),
    importedAt: e.importedAt ? (typeof e.importedAt === 'string' ? e.importedAt : e.importedAt.toISOString()) : new Date().toISOString(),
  }));

  return <HeatmapPageClient events={serializedEvents} locale="ar" />;
}
