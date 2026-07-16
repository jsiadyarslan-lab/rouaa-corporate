// ─── World Bank WGI API Integration ────────────────────────────
// API docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
// Free REST API, no key required
// Indicator: PV.STD.PER.RNK (Political Stability and Absence of Violence/Terrorism: Percentile Rank)
// Also uses: PV.EST (Estimate), PV.STD.PER.RNK.LOWER, PV.STD.PER.RNK.UPPER

const WB_BASE_URL = 'https://api.worldbank.org/v2';

export interface WorldBankIndicator {
  countryCode: string;
  countryName: string;
  indicatorCode: string;
  indicatorName: string;
  value: number | null;
  year: string;
}

/**
 * Fetch the latest Political Stability indicator for a specific country.
 * Uses the PV.EST indicator (estimate, range -2.5 to +2.5) for the composite score,
 * and also fetches PV.STD.PER.RNK (percentile rank 0-100) for display.
 *
 * @param countryCode - ISO 2-letter country code (e.g., 'SA', 'AE', 'EG')
 * @returns World Bank indicator data or null if not found
 */
export async function fetchPoliticalStability(
  countryCode: string
): Promise<WorldBankIndicator | null> {
  try {
    // Fetch both the estimate and percentile rank indicators
    // PV.EST: Political Stability estimate (-2.5 to +2.5)
    const url = `${WB_BASE_URL}/country/${countryCode}/indicator/PV.EST?format=json&date=2015:2024&per_page=10&sort=desc`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 }, // Cache for 24 hours (Next.js fetch extension)
    } as any);

    if (!response.ok) {
      throw new Error(`World Bank API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // World Bank API returns [paginationInfo, dataArray]
    if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) {
      console.warn(`[WorldBank] No data for country ${countryCode}`);
      return null;
    }

    // Find the most recent year with actual data
    const records = data[1] as Record<string, unknown>[];
    const latestRecord = records.find(
      (r) => r.value !== null && r.value !== undefined
    );

    if (!latestRecord) {
      console.warn(`[WorldBank] No recent data for country ${countryCode}`);
      return null;
    }

    const country = latestRecord.country as Record<string, string>;
    const indicator = latestRecord.indicator as Record<string, string>;

    return {
      countryCode: country?.id || countryCode,
      countryName: country?.value || '',
      indicatorCode: indicator?.id || 'PV.EST',
      indicatorName: indicator?.value || 'Political Stability and Absence of Violence/Terrorism: Estimate',
      value: latestRecord.value as number | null,
      year: String(latestRecord.date || ''),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[WorldBank] Fetch error for ${countryCode}: ${message}`);
    return null;
  }
}

/**
 * Fetch Political Stability indicators for all countries.
 * Returns the latest available data for each country.
 * Uses the percentile rank indicator (0-100) for easy comparison.
 *
 * @returns Array of World Bank indicators for all countries
 */
export async function fetchAllCountriesStability(): Promise<WorldBankIndicator[]> {
  try {
    // Fetch PV.EST for all countries, latest 5 years, sorted by most recent first
    // Use per_page=17000 to get all countries in one request (World Bank has ~270 economies)
    // This handles pagination — the API returns at most per_page results per page.
    const url = `${WB_BASE_URL}/country/all/indicator/PV.EST?format=json&date=2020:2024&per_page=17000&sort=desc`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 }, // Cache for 24 hours (Next.js fetch extension)
    } as any);

    if (!response.ok) {
      throw new Error(`World Bank API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) {
      console.warn('[WorldBank] No data returned for all countries');
      return [];
    }

    // Check pagination: if total > per_page, we need to fetch more pages
    const pagination = data[0] as Record<string, number>;
    const totalRecords = pagination?.total ?? 0;
    const perPage = pagination?.per_page ?? 300;
    let allRecords = data[1] as Record<string, unknown>[];

    // Fetch remaining pages if needed (World Bank may have >300 records)
    if (totalRecords > perPage && perPage < 17000) {
      const totalPages = Math.ceil(totalRecords / perPage);
      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        const pageUrl = `${WB_BASE_URL}/country/all/indicator/PV.EST?format=json&date=2020:2024&per_page=${perPage}&sort=desc&page=${page}`;
        pagePromises.push(
          fetch(pageUrl, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 86400 },
          } as any)
            .then(r => r.json())
            .then(d => Array.isArray(d) && d.length >= 2 && Array.isArray(d[1]) ? d[1] : [])
            .catch(() => [])
        );
      }
      const additionalPages = await Promise.allSettled(pagePromises);
      for (const result of additionalPages) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          allRecords = allRecords.concat(result.value);
        }
      }
      console.log(`[WorldBank] Pagination: fetched ${allRecords.length} total records across ${totalPages} pages`);
    }

    // Group by country and keep only the latest year with data
    const latestByCountry = new Map<string, WorldBankIndicator>();

    for (const record of allRecords) {
      const country = record.country as Record<string, string>;
      const indicator = record.indicator as Record<string, string>;
      const code = country?.id || '';

      if (!code || record.value === null || record.value === undefined) continue;

      // Skip aggregate regions (codes like '1A', 'S3', etc. — non-2-letter codes)
      if (code.length !== 2) continue;

      // Only keep if we don't have this country yet (data is sorted desc by date)
      if (!latestByCountry.has(code)) {
        latestByCountry.set(code, {
          countryCode: code,
          countryName: country?.value || '',
          indicatorCode: indicator?.id || 'PV.EST',
          indicatorName: indicator?.value || '',
          value: record.value as number,
          year: String(record.date || ''),
        });
      }
    }

    const results = Array.from(latestByCountry.values());
    console.log(`[WorldBank] Fetched stability data for ${results.length} countries`);
    return results;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[WorldBank] Fetch all countries error: ${message}`);
    return [];
  }
}

/**
 * Fetch the Political Stability Percentile Rank for a country.
 * Returns a value 0-100 where 100 = most stable.
 *
 * @param countryCode - ISO 2-letter country code
 * @returns Percentile rank (0-100) or null
 */
export async function fetchStabilityPercentileRank(
  countryCode: string
): Promise<number | null> {
  try {
    const url = `${WB_BASE_URL}/country/${countryCode}/indicator/PV.STD.PER.RNK?format=json&date=2015:2024&per_page=5&sort=desc`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 }, // Next.js fetch extension
    } as any);

    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) {
      return null;
    }

    const records = data[1] as Record<string, unknown>[];
    const latestRecord = records.find(
      (r) => r.value !== null && r.value !== undefined
    );

    return latestRecord ? (latestRecord.value as number) : null;
  } catch {
    return null;
  }
}
