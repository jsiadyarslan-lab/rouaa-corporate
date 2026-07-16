import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic'; // Uses request.url/searchParams — must be dynamic

// GET /api/geopolitical-risks/events — Recent geopolitical events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const countryCode = searchParams.get('countryCode');
    const eventType = searchParams.get('eventType');
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10), 1), 365);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '500', 10), 1), 2000);

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Build where clause
    const where: Record<string, unknown> = {
      eventDate: { gte: dateThreshold },
    };

    if (countryCode) {
      where.countryCode = countryCode.toUpperCase();
    }

    if (eventType) {
      where.eventType = eventType;
    }

    const events = await db.geopoliticalEvent.findMany({
      where,
      orderBy: { eventDate: 'desc' },
      take: limit,
    });

    // Compute summary statistics
    const totalEvents = events.length;
    const totalFatalities = events.reduce((sum, e) => sum + e.fatalities, 0);

    // Events by type
    const eventsByType: Record<string, number> = {};
    for (const event of events) {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
    }

    // Events by country (top 10)
    const eventsByCountry: Record<string, number> = {};
    for (const event of events) {
      const key = `${event.countryCode}:${event.country}`;
      eventsByCountry[key] = (eventsByCountry[key] || 0) + 1;
    }
    const topCountries = Object.entries(eventsByCountry)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, count]) => {
        const [code, name] = key.split(':');
        return { countryCode: code, country: name, eventCount: count };
      });

    // Average GDELT tone
    const toneValues = events
      .map((e) => e.gdeltTone)
      .filter((t): t is number => t !== null);
    const avgTone =
      toneValues.length > 0
        ? Math.round(
            (toneValues.reduce((sum, t) => sum + t, 0) / toneValues.length) * 100
          ) / 100
        : null;

    return NextResponse.json({
      data: events,
      summary: {
        totalEvents,
        totalFatalities,
        eventsByType,
        topCountries,
        averageGdeltTone: avgTone,
        dateRange: {
          from: dateThreshold.toISOString(),
          to: new Date().toISOString(),
          days,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GeopoliticalRisks] GET /events error:', message);
    return NextResponse.json(
      { error: 'Failed to fetch geopolitical events', details: message },
      { status: 500 }
    );
  }
}
