// ═══════════════════════════════════════════════════════════════
// World Bank API Adapter
// ═══════════════════════════════════════════════════════════════
// Fetches latest economic indicator updates from World Bank.
// API: https://api.worldbank.org/v2/country/{code}/indicator/{id}?format=json
// No API key required. CC BY-4.0 license (attribution required).
// ═══════════════════════════════════════════════════════════════

import type { RawEvent, FetchResult, Category } from '../lib/types';
import { AGENCY_USER_AGENT, FETCH_TIMEOUT_MS } from '../lib/types';

// Key indicators to monitor (most newsworthy)
interface WatchedIndicator {
  indicatorId: string;
  indicatorName: string;
  indicatorNameAr: string;
  category: Category;
}

const WATCHED_INDICATORS: WatchedIndicator[] = [
  {
    indicatorId: 'NY.GDP.MKTP.CD',
    indicatorName: 'GDP (current US$)',
    indicatorNameAr: 'الناتج المحلي الإجمالي بالدولار الأمريكي',
    category: 'economy',
  },
  {
    indicatorId: 'FP.CPI.TOTL.ZG',
    indicatorName: 'Inflation, consumer prices (annual %)',
    indicatorNameAr: 'التضخم، أسعار المستهلكين (سنوي %)',
    category: 'economy',
  },
  {
    indicatorId: 'SL.UEM.TOTL.ZS',
    indicatorName: 'Unemployment, total (% of total labor force)',
    indicatorNameAr: 'البطالة (% من إجمالي قوة العمل)',
    category: 'economy',
  },
  {
    indicatorId: 'FR.INR.RINR',
    indicatorName: 'Real interest rate (%)',
    indicatorNameAr: 'سعر الفائدة الحقيقي (%)',
    category: 'central_banks',
  },
  {
    indicatorId: 'PA.NUS.FCRF',
    indicatorName: 'Official exchange rate (LCU per US$, period average)',
    indicatorNameAr: 'سعر الصرف الرسمي (عملة محلية لكل دولار أمريكي)',
    category: 'forex',
  },
];

// Countries to monitor (focus on major economies + Arab countries)
interface WatchedCountry {
  code: string;
  nameAr: string;
}

const WATCHED_COUNTRIES: WatchedCountry[] = [
  { code: 'US', nameAr: 'الولايات المتحدة' },
  { code: 'CN', nameAr: 'الصين' },
  { code: 'DE', nameAr: 'ألمانيا' },
  { code: 'JP', nameAr: 'اليابان' },
  { code: 'GB', nameAr: 'المملكة المتحدة' },
  { code: 'FR', nameAr: 'فرنسا' },
  { code: 'IN', nameAr: 'الهند' },
  { code: 'SA', nameAr: 'السعودية' },
  { code: 'AE', nameAr: 'الإمارات' },
  { code: 'EG', nameAr: 'مصر' },
];

interface WorldBankResponse {
  metadata?: any;
  data?: Array<{
    indicator?: { id?: string; value?: string };
    country?: { id?: string; value?: string };
    countryiso3code?: string;
    date?: string;
    value?: number | null;
    unit?: string;
    obs_status?: string;
  }>;
  pagination?: { total?: number; per_page?: number; page?: number; pages?: number };
}

/**
 * Fetch latest data point for a country+indicator
 */
async function fetchIndicatorForCountry(
  indicator: WatchedIndicator,
  country: WatchedCountry,
  since: Date
): Promise<RawEvent | null> {
  // World Bank returns most recent first when we use date range
  // Format: /country/{code}/indicator/{id}?format=json&date=2020:2026&per_page=1
  const currentYear = new Date().getFullYear();
  const url = `https://api.worldbank.org/v2/country/${country.code}/indicator/${indicator.indicatorId}?format=json&date=${since.getFullYear()}:${currentYear}&per_page=1&sort=date:desc`;

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

  const data: WorldBankResponse[] = await response.json();

  // World Bank returns [metadata, data[]]
  const dataItems = Array.isArray(data) && data.length >= 2 ? data[1] : [];

  if (!Array.isArray(dataItems) || dataItems.length === 0) {
    return null;
  }

  const latest = dataItems[0];
  if (!latest || latest.value === null || latest.value === undefined) {
    return null;
  }

  // Parse date — World Bank uses annual data, so date is just a year
  const year = parseInt(latest.date || '0');
  if (year < since.getFullYear()) return null;

  const publishedAt = new Date(`${year}-01-01T00:00:00Z`);

  const title = `${country.nameAr}: ${indicator.indicatorNameAr} = ${latest.value} (${year})`;

  const rawContent = `World Bank data update — ${country.nameAr} (${country.code})

Indicator: ${indicator.indicatorName} (${indicator.indicatorNameAr})
Value: ${latest.value}
Year: ${year}
Unit: ${latest.unit || 'N/A'}

Source: World Bank Open Data (CC BY-4.0)
URL: ${url}

This data is the latest available update from the World Bank for ${country.nameAr} on ${indicator.indicatorNameAr}.`;

  const externalId = `${country.code}-${indicator.indicatorId}-${year}`;

  return {
    sourceId: 'WorldBank',
    externalId,
    sourceName: 'World Bank',
    url: `https://data.worldbank.org/indicator/${indicator.indicatorId}?locations=${country.code}`,
    eventType: 'data_release',
    title,
    rawContent,
    category: indicator.category,
    locale: 'ar',
    publishedAtSource: publishedAt,
  };
}

/**
 * Fetch all watched indicators for all watched countries
 */
export async function fetchWorldBank(since: Date): Promise<FetchResult> {
  const startTime = Date.now();
  const allEvents: RawEvent[] = [];
  const errors: string[] = [];

  // Limit concurrency to avoid overwhelming World Bank API
  const CONCURRENCY = 3;
  const tasks: Array<() => Promise<void>> = [];

  for (const indicator of WATCHED_INDICATORS) {
    for (const country of WATCHED_COUNTRIES) {
      tasks.push(async () => {
        try {
          const event = await fetchIndicatorForCountry(indicator, country, since);
          if (event) allEvents.push(event);
        } catch (err: any) {
          errors.push(`${country.code}/${indicator.indicatorId}: ${err.message?.slice(0, 60)}`);
        }
      });
    }
  }

  // Run with limited concurrency
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    const batch = tasks.slice(i, i + CONCURRENCY);
    await Promise.allSettled(batch.map(t => t()));
  }

  return {
    source: 'WorldBank',
    events: allEvents,
    errors,
    durationMs: Date.now() - startTime,
  };
}
