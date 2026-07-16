// ─── ACLED API Integration for Conflict Event Data ─────────────
// API docs: https://acleddata.com/api-documentation/getting-started
// Requires ACLED_ACCESS_KEY and ACLED_EMAIL env vars

import { db } from '@/lib/db';

const ACLED_BASE_URL = 'https://api.acleddata.com/acled/read';

export interface AcledEvent {
  eventId: string;
  eventType: string;     // battle, protest, riot, violence-civilians, etc.
  actor1: string;
  actor2: string;
  country: string;
  countryCode: string;   // ISO code
  region: string;        // subnational
  latitude: number;
  longitude: number;
  fatalities: number;
  notes: string;
  eventDate: string;     // YYYY-MM-DD
}

/**
 * Get ACLED API credentials from environment variables.
 * Throws if not configured.
 */
function getAcledCredentials(): { key: string; email: string } {
  const key = process.env.ACLED_ACCESS_KEY;
  const email = process.env.ACLED_EMAIL;
  if (!key || !email) {
    throw new Error(
      'ACLED API credentials not configured. Set ACLED_ACCESS_KEY and ACLED_EMAIL environment variables.'
    );
  }
  return { key, email };
}

/**
 * Map raw ACLED API response to our AcledEvent interface.
 * The ACLED API returns fields like: data_id, event_type, actor1, actor2,
 * country, iso, region, latitude, longitude, fatalities, notes, event_date
 */
function mapAcledResponse(raw: Record<string, string>): AcledEvent {
  return {
    eventId: raw.data_id || raw.event_id || '',
    eventType: raw.event_type || '',
    actor1: raw.actor1 || '',
    actor2: raw.interaction2 || raw.actor2 || '',
    country: raw.country || '',
    countryCode: raw.iso || '',
    region: raw.admin1 || raw.region || '',
    latitude: parseFloat(raw.latitude) || 0,
    longitude: parseFloat(raw.longitude) || 0,
    fatalities: parseInt(raw.fatalities, 10) || 0,
    notes: raw.notes || '',
    eventDate: raw.event_date || '',
  };
}

/**
 * Fetch conflict events from the ACLED API.
 *
 * @param params - Filter parameters
 * @param params.country - ISO country code or country name
 * @param params.startDate - Start date in YYYY-MM-DD format
 * @param params.endDate - End date in YYYY-MM-DD format
 * @param params.limit - Maximum number of records to return (default: 500, max: 1000)
 * @returns Array of ACLED conflict events
 */
export async function fetchAcledEvents(params: {
  country?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<AcledEvent[]> {
  const { key, email } = getAcledCredentials();
  const limit = Math.min(params.limit || 500, 1000);

  const searchParams = new URLSearchParams({
    key,
    email,
    limit: String(limit),
    format: 'json',
  });

  if (params.country) {
    searchParams.set('country', params.country);
  }
  if (params.startDate) {
    searchParams.set('event_date', params.startDate);
    searchParams.set('event_date_where', 'BETWEEN');
    // ACLED requires both start and end for range queries
    searchParams.set('event_date2', params.endDate || params.startDate);
  } else if (params.endDate) {
    searchParams.set('event_date', params.endDate);
  }

  const url = `${ACLED_BASE_URL}?${searchParams.toString()}`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 }, // Cache for 1 hour (Next.js fetch extension)
    } as any);

    if (!response.ok) {
      throw new Error(`ACLED API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      console.warn('[ACLED] Unexpected response format:', typeof data.data);
      return [];
    }

    const events: AcledEvent[] = data.data.map((raw: Record<string, string>) =>
      mapAcledResponse(raw)
    );

    console.log(`[ACLED] Fetched ${events.length} events for country=${params.country || 'all'}`);
    return events;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ACLED] Fetch error: ${message}`);
    throw error;
  }
}

/**
 * Import ACLED events into the database.
 * Uses upsert to avoid duplicates based on eventId.
 *
 * Note: This function expects a Prisma model named `GeopoliticalEvent`
 * to exist. If it doesn't, events are logged but not persisted.
 *
 * @param events - Array of ACLED events to import
 * @returns Number of events successfully imported
 */
export async function importAcledEventsToDb(events: AcledEvent[]): Promise<number> {
  if (!events.length) return 0;

  let imported = 0;

  try {
    // Check if the GeopoliticalEvent model exists by attempting a count
    // If the model doesn't exist in the Prisma schema, this will throw
    const modelExists = await doesGeopoliticalEventModelExist();

    if (!modelExists) {
      console.warn(
        '[ACLED] GeopoliticalEvent model not found in Prisma schema. Skipping DB import.'
      );
      console.warn('[ACLED] Add the model to prisma/schema.prisma and run db:push.');
      return 0;
    }

    for (const event of events) {
      try {
        await db.geopoliticalEvent.upsert({
          where: { eventId: event.eventId },
          update: {
            eventType: event.eventType,
            actor1: event.actor1,
            actor2: event.actor2,
            country: event.country,
            countryCode: event.countryCode,
            region: event.region,
            latitude: event.latitude,
            longitude: event.longitude,
            fatalities: event.fatalities,
            notes: event.notes,
            eventDate: new Date(event.eventDate),

          },
          create: {
            eventId: event.eventId,
            eventType: event.eventType,
            actor1: event.actor1,
            actor2: event.actor2,
            country: event.country,
            countryCode: event.countryCode,
            region: event.region,
            latitude: event.latitude,
            longitude: event.longitude,
            fatalities: event.fatalities,
            notes: event.notes,
            eventDate: new Date(event.eventDate),
            source: 'acled',
          },
        });
        imported++;
      } catch (upsertError: unknown) {
        const msg = upsertError instanceof Error ? upsertError.message : String(upsertError);
        console.warn(`[ACLED] Failed to upsert event ${event.eventId}: ${msg.slice(0, 100)}`);
      }
    }

    console.log(`[ACLED] Imported ${imported}/${events.length} events to DB`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ACLED] DB import error: ${message.slice(0, 150)}`);
  }

  return imported;
}

/**
 * Check if the GeopoliticalEvent model exists in the Prisma schema.
 * Tries a minimal query; if it fails, the model likely doesn't exist.
 */
async function doesGeopoliticalEventModelExist(): Promise<boolean> {
  try {
    await db.geopoliticalEvent.count({ take: 1 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get aggregated event and fatality counts for a country over a given period.
 * First checks the database, then falls back to the ACLED API if no data.
 *
 * @param countryCode - ISO country code
 * @param days - Number of days to look back (default: 30)
 * @returns Object with event count and fatality count
 */
export async function getAcledEventCounts(
  countryCode: string,
  days: number = 30
): Promise<{ events: number; fatalities: number }> {
  // Try database first
  try {
    const modelExists = await doesGeopoliticalEventModelExist();
    if (modelExists) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const dbEvents = await db.geopoliticalEvent.findMany({
        where: {
          countryCode,
          eventDate: { gte: startDate },
          source: 'acled',
        },
        select: { fatalities: true },
      });

      if (dbEvents.length > 0) {
        return {
          events: dbEvents.length,
          fatalities: dbEvents.reduce((sum, e) => sum + (e.fatalities || 0), 0),
        };
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[ACLED] DB query failed, falling back to API: ${msg.slice(0, 80)}`);
  }

  // Fall back to ACLED API
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - days);
    const startDate = startDateObj.toISOString().split('T')[0];

    const events = await fetchAcledEvents({
      country: countryCode,
      startDate,
      endDate,
      limit: 1000,
    });

    return {
      events: events.length,
      fatalities: events.reduce((sum, e) => sum + (e.fatalities || 0), 0),
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ACLED] Failed to get event counts for ${countryCode}: ${msg.slice(0, 100)}`);
    return { events: 0, fatalities: 0 };
  }
}
