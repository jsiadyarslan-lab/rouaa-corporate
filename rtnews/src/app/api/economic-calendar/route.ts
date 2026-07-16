// ─── Economic Calendar API ────────────────────────────────────
// GET /api/economic-calendar?week=current|next&country=US|SA|AE|ALL&importance=high|critical
// Returns upcoming economic events.
// V2: Attempts real data from Finnhub economic calendar API first.
//     Falls back to DB-persisted events, then seeds if table is empty.
//     All data is tagged with source attribution.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Seed data for economic events if table is empty AND Finnhub is unavailable
// These are MAJOR recurring event templates with NO forecast/previous values
// (real values come from Finnhub or manual updates)
const SEED_EVENTS = [
  // ── US Events ──
  { eventName: 'Federal Reserve Interest Rate Decision', eventNameAr: 'قرار الفائدة الفيدرالي', country: 'US', currency: 'USD', importance: 'critical', eventType: 'meeting', forecast: '-', previous: '-' },
  { eventName: 'CPI Year-over-Year', eventNameAr: 'مؤشر أسعار المستهلكين السنوي', country: 'US', currency: 'USD', importance: 'critical', eventType: 'indicator', forecast: '-', previous: '-' },
  { eventName: 'Non-Farm Payrolls', eventNameAr: 'وظائف غير الزراعة', country: 'US', currency: 'USD', importance: 'critical', eventType: 'indicator', forecast: '-', previous: '-' },
  { eventName: 'GDP Growth Rate QoQ', eventNameAr: 'معدل نمو الناتج المحلي ربع سنوي', country: 'US', currency: 'USD', importance: 'high', eventType: 'indicator', forecast: '-', previous: '-' },
  { eventName: 'Unemployment Claims', eventNameAr: 'طلبات البطالة', country: 'US', currency: 'USD', importance: 'medium', eventType: 'indicator', forecast: '-', previous: '-' },
  { eventName: 'PMI Manufacturing', eventNameAr: 'مؤشر مديري المشتريات الصناعي', country: 'US', currency: 'USD', importance: 'high', eventType: 'indicator', forecast: '-', previous: '-' },
  { eventName: 'Retail Sales MoM', eventNameAr: 'المبيعات التجزئة الشهرية', country: 'US', currency: 'USD', importance: 'high', eventType: 'indicator', forecast: '-', previous: '-' },
  { eventName: 'Crude Oil Inventories', eventNameAr: 'مخزونات النفط الخام', country: 'US', currency: 'USD', importance: 'medium', eventType: 'indicator', forecast: '-', previous: '-' },
  { eventName: 'Fed Chair Speech', eventNameAr: 'كلمة رئيس الفيدرالي', country: 'US', currency: 'USD', importance: 'high', eventType: 'speech', forecast: '-', previous: '-' },
  { eventName: 'ADP Employment Change', eventNameAr: 'تغير التوظيف ADP', country: 'US', currency: 'USD', importance: 'medium', eventType: 'indicator', forecast: '-', previous: '-' },
  // ── EU/European Events ──
  { eventName: 'ECB Interest Rate Decision', eventNameAr: 'قرار الفائدة الأوروبي', country: 'EU', currency: 'EUR', importance: 'critical', eventType: 'meeting', forecast: '-', previous: '-' },
  { eventName: 'Eurozone CPI YoY', eventNameAr: 'مؤشر أسعار المستهلكين الأوروبي السنوي', country: 'EU', currency: 'EUR', importance: 'critical', eventType: 'indicator', forecast: '-', previous: '-' },
  { eventName: 'German ZEW Economic Sentiment', eventNameAr: 'مؤشر ZEW الألماني للثقة الاقتصادية', country: 'DE', currency: 'EUR', importance: 'high', eventType: 'indicator', forecast: '-', previous: '-' },
  { eventName: 'French GDP QoQ', eventNameAr: 'الناتج المحلي الفرنسي ربع سنوي', country: 'FR', currency: 'EUR', importance: 'high', eventType: 'indicator', forecast: '-', previous: '-' },
  { eventName: 'German Ifo Business Climate', eventNameAr: 'مؤشر إيفو الألماني لمناخ الأعمال', country: 'DE', currency: 'EUR', importance: 'high', eventType: 'indicator', forecast: '-', previous: '-' },
  // ── UK Events ──
  { eventName: 'UK CPI YoY', eventNameAr: 'مؤشر أسعار المستهلكين البريطاني السنوي', country: 'GB', currency: 'GBP', importance: 'high', eventType: 'indicator', forecast: '-', previous: '-' },
  { eventName: 'BOE Rate Decision', eventNameAr: 'قرار بنك إنجلترا', country: 'GB', currency: 'GBP', importance: 'critical', eventType: 'meeting', forecast: '-', previous: '-' },
  // ── Arab Events ──
  { eventName: 'Saudi Central Bank Rate Decision', eventNameAr: 'قرار معدل ساما', country: 'SA', currency: 'SAR', importance: 'critical', eventType: 'meeting', forecast: '-', previous: '-' },
  { eventName: 'UAE Non-Oil GDP Growth', eventNameAr: 'نمو الناتج المحلي غير النفطي الإماراتي', country: 'AE', currency: 'AED', importance: 'high', eventType: 'indicator', forecast: '-', previous: '-' },
  { eventName: 'OPEC+ Production Meeting', eventNameAr: 'اجتماع أوبك+ للإنتاج', country: 'OPEC', currency: 'USD', importance: 'critical', eventType: 'meeting', forecast: '-', previous: '-' },
  { eventName: 'Egypt Central Bank Rate', eventNameAr: 'قرار البنك المركزي المصري', country: 'EG', currency: 'EGP', importance: 'high', eventType: 'meeting', forecast: '-', previous: '-' },
  // ── Japan/China Events ──
  { eventName: 'Japan BOJ Rate Decision', eventNameAr: 'قرار بنك اليابان', country: 'JP', currency: 'JPY', importance: 'high', eventType: 'meeting', forecast: '-', previous: '-' },
  { eventName: 'China PMI Manufacturing', eventNameAr: 'مؤشر مديري المشتريات الصيني الصناعي', country: 'CN', currency: 'CNY', importance: 'high', eventType: 'indicator', forecast: '-', previous: '-' },
  // ── Turkish Events ──
  { eventName: 'CBRT Interest Rate Decision', eventNameAr: 'قرار البنك المركزي التركي', country: 'TR', currency: 'TRY', importance: 'critical', eventType: 'meeting', forecast: '-', previous: '-' },
  { eventName: 'Turkey CPI YoY', eventNameAr: 'مؤشر أسعار المستهلكين التركي السنوي', country: 'TR', currency: 'TRY', importance: 'critical', eventType: 'indicator', forecast: '-', previous: '-' },
  // ── Spanish Events ──
  { eventName: 'Spain CPI YoY', eventNameAr: 'مؤشر أسعار المستهلكين الإسباني السنوي', country: 'ES', currency: 'EUR', importance: 'high', eventType: 'indicator', forecast: '-', previous: '-' },
];

/**
 * Try to fetch real economic calendar data from Finnhub API.
 * Finnhub provides economic calendar on the free tier.
 * Returns an array of events with real forecast/previous/actual values.
 */
async function fetchFinnhubCalendar(): Promise<Array<{
  eventName: string;
  country: string;
  currency: string;
  eventDate: Date;
  importance: string;
  eventType: string;
  forecast: string;
  previous: string;
  actual: string | null;
  source: string;
}>> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey || apiKey.trim() === '') return [];

  try {
    const now = new Date();
    const from = now.toISOString().split('T')[0];
    const to = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const url = `https://finnhub.io/api/v1/calendar/economic?token=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!res.ok) {
      console.warn(`[EconomicCalendar] Finnhub API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const finnhubEvents = data?.economicCalendar;

    if (!Array.isArray(finnhubEvents) || finnhubEvents.length === 0) {
      console.log('[EconomicCalendar] No events from Finnhub');
      return [];
    }

    // Map Finnhub events to our format
    // Finnhub format: { time, country, event, impact, actual, consensus, prev }
    const impactMap: Record<string, string> = {
      'High': 'critical',
      'Medium': 'high',
      'Low': 'medium',
    };

    // Arabic event name mapping for common events
    const eventNameArMap: Record<string, string> = {
      'Nonfarm Payrolls': 'وظائف غير الزراعة',
      'CPI': 'مؤشر أسعار المستهلكين',
      'Core CPI': 'مؤشر أسعار المستهلكين الأساسي',
      'GDP': 'الناتج المحلي الإجمالي',
      'FOMC': 'قرار الفيدرالي',
      'Interest Rate': 'قرار الفائدة',
      'Unemployment Claims': 'طلبات البطالة',
      'PMI': 'مؤشر مديري المشتريات',
      'Retail Sales': 'المبيعات التجزئة',
      'Crude Oil Inventories': 'مخزونات النفط الخام',
    };

    const events = finnhubEvents
      .filter((evt: any) => {
        // Filter to only events from this week and next
        if (!evt.time) return false;
        const evtDate = new Date(evt.time);
        return evtDate >= now && evtDate <= new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      })
      .map((evt: any) => {
        const importance = impactMap[evt.impact] || 'medium';
        // Get Arabic name if available
        const arName = eventNameArMap[evt.event] || null;

        return {
          eventName: evt.event || 'Economic Event',
          eventNameAr: arName,
          country: evt.country || 'US',
          currency: evt.currency || 'USD',
          eventDate: new Date(evt.time),
          importance,
          eventType: (evt.event || '').toLowerCase().includes('rate') || (evt.event || '').toLowerCase().includes('fomc')
            ? 'meeting' : 'indicator',
          forecast: evt.consensus || '-',
          previous: evt.prev || '-',
          actual: evt.actual || null,
          source: 'finnhub',
        };
      });

    console.log(`[EconomicCalendar] Fetched ${events.length} events from Finnhub`);
    return events;
  } catch (err: any) {
    console.warn(`[EconomicCalendar] Finnhub fetch failed:`, err?.message?.slice(0, 100));
    return [];
  }
}

async function seedEventsIfEmpty() {
  try {
    const count = await db.economicEvent.count();
    if (count > 0) return;

    const now = new Date();
    const events = SEED_EVENTS.map((template, i) => {
      const date = new Date(now);
      // Spread events across current and next week
      date.setDate(date.getDate() + (i % 14));
      date.setHours(8 + (i % 10), (i * 15) % 60, 0, 0);

      return {
        eventName: template.eventName,
        eventNameAr: template.eventNameAr,
        country: template.country,
        currency: template.currency,
        eventDate: date,
        importance: template.importance as 'low' | 'medium' | 'high' | 'critical',
        eventType: template.eventType,
        forecast: template.forecast,
        previous: template.previous,
        source: 'seed',
      };
    });

    await db.economicEvent.createMany({ data: events });
    console.log(`[EconomicCalendar] Seeded ${events.length} events (no forecast/previous — awaiting real data)`);
  } catch (err: any) {
    console.error('[EconomicCalendar] Seed failed:', err.message);
  }
}

/**
 * Persist Finnhub events to the database.
 * Updates existing events or creates new ones.
 */
async function persistFinnhubEvents(events: Array<any>): Promise<void> {
  if (events.length === 0) return;

  try {
    for (const evt of events) {
      try {
        // Try to find existing event by name + approximate date
        const existing = await db.economicEvent.findFirst({
          where: {
            eventName: evt.eventName,
            eventDate: {
              gte: new Date(evt.eventDate.getTime() - 12 * 60 * 60 * 1000),
              lte: new Date(evt.eventDate.getTime() + 12 * 60 * 60 * 1000),
            },
          },
        });

        if (existing) {
          // Update with real forecast/previous/actual data
          await db.economicEvent.update({
            where: { id: existing.id },
            data: {
              forecast: evt.forecast,
              previous: evt.previous,
              actual: evt.actual,
              source: 'finnhub',
              ...(evt.eventNameAr ? { eventNameAr: evt.eventNameAr } : {}),
            },
          });
        } else {
          // Create new event
          await db.economicEvent.create({
            data: {
              eventName: evt.eventName,
              eventNameAr: evt.eventNameAr || evt.eventName,
              country: evt.country,
              currency: evt.currency,
              eventDate: evt.eventDate,
              importance: evt.importance as any,
              eventType: evt.eventType,
              forecast: evt.forecast,
              previous: evt.previous,
              actual: evt.actual,
              source: 'finnhub',
            },
          });
        }
      } catch (err: any) {
        // Skip individual errors — don't block the whole batch
        if (!err?.message?.includes('Unique')) {
          console.warn(`[EconomicCalendar] DB persist error: ${err?.message?.slice(0, 80)}`);
        }
      }
    }
    console.log(`[EconomicCalendar] Persisted ${events.length} Finnhub events to DB`);
  } catch (err: any) {
    console.warn(`[EconomicCalendar] DB persist failed: ${err?.message?.slice(0, 100)}`);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week') || 'current';
    const country = searchParams.get('country') || 'ALL';
    const importance = searchParams.get('importance');

    // ── Step 1: Try Finnhub for real calendar data ──
    const finnhubEvents = await fetchFinnhubCalendar();

    // Persist Finnhub events to DB (non-blocking)
    if (finnhubEvents.length > 0) {
      persistFinnhubEvents(finnhubEvents).catch(err =>
        console.warn('[EconomicCalendar] Background persist failed:', err?.message?.slice(0, 80))
      );
    }

    // Seed if DB is still empty
    await seedEventsIfEmpty();

    // ── Step 2: Read events from DB (which may now include Finnhub data) ──
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    let startDate = startOfWeek;
    let endDate = new Date(startOfWeek);
    endDate.setDate(endDate.getDate() + 7);

    if (week === 'next') {
      startDate = new Date(endDate);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
    }

    const where: any = {
      eventDate: { gte: startDate, lt: endDate },
    };

    if (country && country !== 'ALL') {
      where.country = country;
    }

    if (importance) {
      if (importance === 'critical') {
        where.importance = { in: ['critical', 'high'] };
      } else if (importance === 'high') {
        where.importance = { in: ['high', 'critical'] };
      } else {
        where.importance = importance;
      }
    }

    const events = await db.economicEvent.findMany({
      where,
      orderBy: { eventDate: 'asc' },
    });

    // Group events by day
    const groupedByDay: Record<string, any[]> = {};
    for (const event of events) {
      const dayKey = event.eventDate.toISOString().split('T')[0];
      if (!groupedByDay[dayKey]) groupedByDay[dayKey] = [];
      groupedByDay[dayKey].push({
        id: event.id,
        eventName: event.eventName,
        eventNameAr: event.eventNameAr || event.eventName,
        country: event.country,
        currency: event.currency,
        eventDate: event.eventDate.toISOString(),
        importance: event.importance,
        eventType: event.eventType,
        forecast: event.forecast || '-',
        previous: event.previous || '-',
        actual: event.actual || null,
        isActualReleased: event.isActualReleased,
        source: event.source || 'seed',
      });
    }

    // Get available countries for filter
    const availableCountries = await db.economicEvent.findMany({
      select: { country: true },
      distinct: ['country'],
      orderBy: { country: 'asc' },
    });

    return NextResponse.json({
      events: groupedByDay,
      availableCountries: availableCountries.map((c) => c.country),
      weekStart: startDate.toISOString(),
      weekEnd: endDate.toISOString(),
      hasRealData: finnhubEvents.length > 0,
    });
  } catch (error: any) {
    console.error('[EconomicCalendar API]', error);
    return NextResponse.json({ error: 'فشل في تحميل التقويم الاقتصادي' }, { status: 500 });
  }
}
