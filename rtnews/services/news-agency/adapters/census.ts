// ═══════════════════════════════════════════════════════════════
// Census Bureau API Adapter
// ═══════════════════════════════════════════════════════════════
// Fetches latest economic data from US Census Bureau API.
// API: https://api.census.gov/data.html
// Auth: requires CENSUS_API_KEY (free, register at api.census.gov/data/key_signup.html)
// Rate limit: 5000 req/IP/day
// Attribution: "U.S. Census Bureau" required
// ═══════════════════════════════════════════════════════════════

import type { RawEvent, FetchResult, Category } from '../lib/types';
import { AGENCY_USER_AGENT, FETCH_TIMEOUT_MS } from '../lib/types';

// Key Census datasets to monitor
const WATCHED_DATASETS = [
  // Retail Trade
  { dataset: 'timeseries/eits/marts', seriesCode: 'MARTS', title: 'Monthly Retail Trade', titleAr: 'التجارة التجزئة الشهرية', category: 'economy' as Category, unit: 'million $' },
  // Construction Spending
  { dataset: 'timeseries/eits/vip', seriesCode: 'VIP', title: 'Construction Spending', titleAr: 'الإنفاق على البناء', category: 'economy' as Category, unit: 'million $' },
  // International Trade
  { dataset: 'timeseries/eits/ftd', seriesCode: 'FTD', title: 'International Trade (Exports/Imports)', titleAr: 'التجارة الدولية (صادرات/واردات)', category: 'economy' as Category, unit: 'million $' },
  // Housing Starts (via Building Permits survey)
  { dataset: 'timeseries/eits/bps', seriesCode: 'BPS', title: 'Building Permits', titleAr: 'تصاريح البناء', category: 'economy' as Category, unit: 'units' },
  // Manufacturing
  { dataset: 'timeseries/eits/asm', seriesCode: 'ASM', title: 'Manufacturing Shipments', titleAr: 'شحنات التصنيع', category: 'economy' as Category, unit: 'million $' },
];

interface CensusResponse {
  [key: string]: any;
}

export async function fetchCensus(since: Date): Promise<FetchResult> {
  const startTime = Date.now();
  const allEvents: RawEvent[] = [];
  const errors: string[] = [];

  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) {
    errors.push('CENSUS_API_KEY not set');
    return { source: 'FRED' as any, events: [], errors, durationMs: Date.now() - startTime };
  }

  for (const dataset of WATCHED_DATASETS) {
    try {
      // Census time series API endpoint
      const url = `https://api.census.gov/data/${dataset.dataset}?get=cell_value,time_slot_id&key=${apiKey}&time=-4`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': AGENCY_USER_AGENT,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!response.ok) {
        errors.push(`${dataset.seriesCode}: HTTP ${response.status}`);
        continue;
      }

      const data: any = await response.json();

      // Census returns array of arrays: [["header1","header2"], ["val1","val2"]]
      if (!Array.isArray(data) || data.length < 2) {
        continue;
      }

      // Find the latest data point
      const headers = data[0];
      const rows = data.slice(1);
      
      // Find value and date columns
      const valueIdx = headers.indexOf('cell_value');
      const timeIdx = headers.indexOf('time_slot_id');
      
      if (valueIdx === -1 || timeIdx === -1) {
        // Try alternative column names
        continue;
      }

      // Get the latest row (last in array, usually most recent)
      const latestRow = rows[rows.length - 1];
      const value = parseFloat(latestRow[valueIdx]);
      const periodStr = latestRow[timeIdx];

      if (isNaN(value)) continue;

      // Parse period (format varies: "2024-06" or "2024-Q2" etc.)
      const periodDate = new Date(periodStr.length === 7 ? periodStr + '-01' : periodStr);
      if (isNaN(periodDate.getTime()) || periodDate < since) continue;

      const unitSuffix = dataset.unit ? ` ${dataset.unit}` : '';
      const title = `${dataset.titleAr}: ${value}${unitSuffix} (${periodStr})`;

      const rawContent = `U.S. Census Bureau — ${dataset.titleAr}

السلسلة: ${dataset.title} (${dataset.seriesCode})
القيمة الأخيرة: ${value}${unitSuffix}
الفترة: ${periodStr}
المصدر: مكتب الإحصاء الأمريكي (Census Bureau)
الرابط: https://www.census.gov/economic-indicators/

البيانات الرسمية الصادرة عن مكتب الإحصاء الأمريكي. هذه بيانات خام رسمية تنشرها الجهة المصدرية مباشرة.`;

      allEvents.push({
        sourceId: 'FRED',
        externalId: `census-${dataset.seriesCode}-${periodStr}`,
        sourceName: 'مكتب الإحصاء الأمريكي (Census Bureau)',
        url: 'https://www.census.gov/economic-indicators/',
        eventType: 'data_release',
        title,
        rawContent: rawContent.slice(0, 3000),
        category: dataset.category,
        locale: 'ar',
        publishedAtSource: periodDate,
      });

      // Rate limit: 5000/day → ~3/min → wait 500ms
      await new Promise(r => setTimeout(r, 500));
    } catch (err: any) {
      errors.push(`${dataset.seriesCode}: ${err.message?.slice(0, 60)}`);
    }
  }

  return {
    source: 'FRED' as any,
    events: allEvents,
    errors,
    durationMs: Date.now() - startTime,
  };
}
