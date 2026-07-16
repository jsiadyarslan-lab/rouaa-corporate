// ═══════════════════════════════════════════════════════════════
// Economic Events Collector — Calendar data (NEW)
// ═══════════════════════════════════════════════════════════════
// Produces 2 article types:
//   1. Upcoming high-impact events (next 24h)
//   2. Released events with surprise factor (actual vs forecast)
// ═══════════════════════════════════════════════════════════════
import type { RawEvent } from '../lib/types';
import { db } from '@/lib/db';

async function getUpcomingEvents(): Promise<RawEvent[]> {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const events = await db.economicEvent.findMany({
      where: {
        isActualReleased: false,
        importance: { in: ['high', 'critical'] },
        eventDate: { gte: now, lte: tomorrow },
      },
      orderBy: { eventDate: 'asc' },
      take: 5,
      select: { eventName: true, eventNameAr: true, country: true, currency: true, eventDate: true, importance: true, forecast: true, previous: true },
    });

    if (events.length === 0) return [];

    const eventsList = events.map(e => {
      const name = e.eventNameAr || e.eventName;
      const time = new Date(e.eventDate).toLocaleString('ar', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
      const parts = [`${name} (${e.country}/${e.currency})`, `التوقيت: ${time}`, `الأهمية: ${e.importance}`];
      if (e.forecast) parts.push(`التوقع: ${e.forecast}`);
      if (e.previous) parts.push(`السابق: ${e.previous}`);
      return parts.join('، ');
    }).join('\n\n');

    return [{
      sourceId: 'DB',
      externalId: `econ-upcoming-${new Date().toISOString().split('T')[0] + '-' + new Date().getHours()}`,
      sourceName: 'التقويم الاقتصادي (رؤى)',
      url: '',
      eventType: 'data_release',
      title: `${events.length} أحداث اقتصادية عالية التأثير خلال 24 ساعة: ${events[0].eventNameAr || events[0].eventName}`,
      rawContent: `أحداث اقتصادية قادمة عالية التأثير (${new Date().toLocaleDateString('ar')}):\n\n${eventsList}`,
      category: 'economy',
      locale: 'ar',
      publishedAtSource: new Date(),
    }];
  } catch (err: any) { return []; }
}

async function getReleasedEvents(): Promise<RawEvent[]> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const events = await db.economicEvent.findMany({
      where: { isActualReleased: true, eventDate: { gte: oneHourAgo } },
      orderBy: { eventDate: 'desc' },
      take: 5,
      select: { eventName: true, eventNameAr: true, country: true, currency: true, eventDate: true, importance: true, forecast: true, previous: true, actual: true },
    });

    if (events.length === 0) return [];

    const eventsList = events.map(e => {
      const name = e.eventNameAr || e.eventName;
      const parts = [`${name} (${e.country}/${e.currency})`, `الفعلي: ${e.actual || 'غير متوفر'}`];
      if (e.forecast) parts.push(`التوقع: ${e.forecast}`);
      if (e.previous) parts.push(`السابق: ${e.previous}`);
      // Compute surprise
      if (e.actual && e.forecast) {
        const actualNum = parseFloat(e.actual.replace(/[^0-9.-]/g, ''));
        const forecastNum = parseFloat(e.forecast.replace(/[^0-9.-]/g, ''));
        if (!isNaN(actualNum) && !isNaN(forecastNum)) {
          const surprise = actualNum - forecastNum;
          const surprisePct = forecastNum !== 0 ? ((surprise / forecastNum) * 100).toFixed(1) : 'N/A';
          parts.push(`المفاجأة: ${surprise > 0 ? '+' : ''}${surprise.toFixed(1)} (${surprisePct}%)`);
        }
      }
      return parts.join('، ');
    }).join('\n\n');

    return [{
      sourceId: 'DB',
      externalId: `econ-released-${new Date().toISOString().split('T')[0] + '-' + new Date().getHours()}`,
      sourceName: 'التقويم الاقتصادي (رؤى)',
      url: '',
      eventType: 'data_release',
      title: `نتائج اقتصادية: ${events[0].eventNameAr || events[0].eventName} — الفعلي ${events[0].actual || '?'}`,
      rawContent: `نتائج اقتصادية صادرة (${new Date().toLocaleDateString('ar')}):\n\n${eventsList}`,
      category: 'economy',
      locale: 'ar',
      publishedAtSource: new Date(),
    }];
  } catch (err: any) { return []; }
}

export async function collectEconomicEvents(): Promise<RawEvent[]> {
  console.log('[EconEvents] Collecting economic calendar events...');
  const results = await Promise.allSettled([getUpcomingEvents(), getReleasedEvents()]);
  const allEvents: RawEvent[] = [];
  for (const result of results) { if (result.status === 'fulfilled') allEvents.push(...result.value); }
  console.log(`[EconEvents] ✓ Collected ${allEvents.length} economic events`);
  return allEvents;
}
