// ═══════════════════════════════════════════════════════════════
// FRED (Federal Reserve Economic Data) Adapter
// ═══════════════════════════════════════════════════════════════
// Fetches latest economic data from FRED (St. Louis Fed).
// API: https://api.stlouisfed.org/fred/series/observations
// Auth: requires FRED_API_KEY (free, register at fredaccount.stlouisfed.org)
// Rate limit: 120 req/min (default)
// Attribution: "Federal Reserve Bank of St. Louis" required by ToU
// ═══════════════════════════════════════════════════════════════

import type { RawEvent, FetchResult, Category } from '../lib/types';
import { AGENCY_USER_AGENT, FETCH_TIMEOUT_MS } from '../lib/types';

// Key economic indicators to monitor
interface WatchedSeries {
  seriesId: string;
  title: string;
  titleAr: string;
  category: Category;
  unit?: string;
}

const WATCHED_SERIES: WatchedSeries[] = [
  {
    seriesId: 'GDP',
    title: 'Gross Domestic Product',
    titleAr: 'الناتج المحلي الإجمالي',
    category: 'economy',
    unit: 'Bil. of $',
  },
  {
    seriesId: 'CPIAUCSL',
    title: 'Consumer Price Index: All Urban Consumers',
    titleAr: 'مؤشر أسعار المستهلكين',
    category: 'economy',
    unit: 'Index',
  },
  {
    seriesId: 'UNRATE',
    title: 'Unemployment Rate',
    titleAr: 'معدل البطالة',
    category: 'economy',
    unit: '%',
  },
  {
    seriesId: 'FEDFUNDS',
    title: 'Federal Funds Effective Rate',
    titleAr: 'سعر الفائدة الفيدرالي الفعلي',
    category: 'central_banks',
    unit: '%',
  },
  {
    seriesId: 'DGS10',
    title: '10-Year Treasury Constant Maturity Rate',
    titleAr: 'عائد سندات الخزانة الأمريكية لآجل 10 سنوات',
    category: 'central_banks',
    unit: '%',
  },
  {
    seriesId: 'DEXUSEU',
    title: 'US/Euro Foreign Exchange Rate',
    titleAr: 'سعر صرف الدولار مقابل اليورو',
    category: 'forex',
  },
  {
    seriesId: 'DEXCHUS',
    title: 'China/US Foreign Exchange Rate',
    titleAr: 'سعر صرف اليوان مقابل الدولار',
    category: 'forex',
  },
  {
    seriesId: 'DCOILWTICO',
    title: 'Crude Oil WTI Spot Price',
    titleAr: 'سعر النفط الخام WTI',
    category: 'commodities',
    unit: '$/barrel',
  },
  {
    seriesId: 'GOLDAMGBD228NLBM',
    title: 'Gold Fixing Price (London AM)',
    titleAr: 'سعر الذهب (تحديد لندن صباحاً)',
    category: 'commodities',
    unit: '$/ounce',
  },
  {
    seriesId: 'VIXCLS',
    title: 'CBOE Volatility Index VIX',
    titleAr: 'مؤشر التقلب VIX',
    category: 'stocks',
  },
];

interface FREDObservation {
  date: string;
  value: string;  // FRED returns value as string (can be ".")
  realtime_start?: string;
  realtime_end?: string;
}

interface FREDResponse {
  observations?: FREDObservation[];
  error_message?: string;
}

// ─── Rate limiter: 500ms between FRED requests (120/min limit) ───
let lastFREDRequest = 0;
const FRED_MIN_INTERVAL_MS = 600; // ~100 req/min — safe margin

async function enforceFREDRateLimit(): Promise<void> {
  const elapsed = Date.now() - lastFREDRequest;
  if (elapsed < FRED_MIN_INTERVAL_MS) {
    await new Promise(resolve => setTimeout(resolve, FRED_MIN_INTERVAL_MS - elapsed));
  }
  lastFREDRequest = Date.now();
}

/**
 * Fetch latest observation for a single FRED series.
 * Uses realtime_period to get the most recent value.
 */
async function fetchSeries(series: WatchedSeries, since: Date): Promise<RawEvent | null> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new Error('FRED_API_KEY not set');
  }

  await enforceFREDRateLimit();

  // Get the most recent observation since the "since" date
  // sort_order=desc → most recent first
  // limit=1 → only the latest
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series.seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1&observation_start=${since.toISOString().split('T')[0]}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': AGENCY_USER_AGENT,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err: any) {
    throw new Error(`fetch failed: ${err.message?.slice(0, 60)}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: FREDResponse = await response.json();

  if (data.error_message) {
    throw new Error(`FRED error: ${data.error_message.slice(0, 80)}`);
  }

  const observations = data.observations;
  if (!Array.isArray(observations) || observations.length === 0) {
    return null; // No new data since "since" date
  }

  const latest = observations[0];

  // FRED returns "." for missing values
  if (!latest.value || latest.value === '.') {
    return null;
  }

  const value = parseFloat(latest.value);
  if (isNaN(value)) {
    return null;
  }

  // Parse observation date (format: YYYY-MM-DD)
  const obsDate = new Date(latest.date + 'T00:00:00Z');
  if (isNaN(obsDate.getTime()) || obsDate < since) {
    return null;
  }

  const unitSuffix = series.unit ? ` ${series.unit}` : '';
  const title = `${series.titleAr}: ${value}${unitSuffix} (${latest.date})`;

  const rawContent = `Federal Reserve Economic Data (FRED) update — ${series.titleAr}

Series: ${series.title} (${series.seriesId})
Latest value: ${value}${unitSuffix}
Observation date: ${latest.date}
Source: Federal Reserve Bank of St. Louis (FRED)
URL: https://fred.stlouisfed.org/series/${series.seriesId}

This is the most recent data point published by FRED for ${series.titleAr} (${series.seriesId}).
The value of ${value}${unitSuffix} was recorded on ${latest.date}.

Attribution: Data provided by Federal Reserve Bank of St. Louis (FRED).`;

  const externalId = `FRED-${series.seriesId}-${latest.date}`;

  return {
    sourceId: 'FRED',
    externalId,
    sourceName: 'FRED (St. Louis Fed)',
    url: `https://fred.stlouisfed.org/series/${series.seriesId}`,
    eventType: 'data_release',
    title,
    rawContent,
    category: series.category,
    locale: 'ar',
    publishedAtSource: obsDate,
  };
}

/**
 * Fetch all watched FRED series.
 * Skips gracefully if FRED_API_KEY is not set.
 */
export async function fetchFRED(since: Date): Promise<FetchResult> {
  const startTime = Date.now();
  const allEvents: RawEvent[] = [];
  const errors: string[] = [];

  // Check if API key is configured
  if (!process.env.FRED_API_KEY) {
    return {
      source: 'FRED',
      events: [],
      errors: ['FRED_API_KEY not set — skipping FRED source'],
      durationMs: Date.now() - startTime,
    };
  }

  // Fetch each series sequentially (FRED has rate limits)
  for (const series of WATCHED_SERIES) {
    try {
      const event = await fetchSeries(series, since);
      if (event) {
        allEvents.push(event);
      }
    } catch (err: any) {
      errors.push(`${series.seriesId}: ${err.message?.slice(0, 60)}`);
    }
  }

  return {
    source: 'FRED',
    events: allEvents,
    errors,
    durationMs: Date.now() - startTime,
  };
}
