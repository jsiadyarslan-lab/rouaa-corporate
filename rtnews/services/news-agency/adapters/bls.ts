// ═══════════════════════════════════════════════════════════════
// BLS (Bureau of Labor Statistics) API Adapter
// ═══════════════════════════════════════════════════════════════
// Fetches latest economic data from BLS public API.
// API: https://api.bls.gov/publicAPI/v2/timeseries/data/
// Auth: NO API key needed (public, 25 req/day without key)
//       With registration key: 500 req/day
// Rate limit: 25 req/day (public) or 500/day (registered)
// Attribution: "U.S. Bureau of Labor Statistics" required by ToU
// ═══════════════════════════════════════════════════════════════

import type { RawEvent, FetchResult, Category } from '../lib/types';
import { AGENCY_USER_AGENT, FETCH_TIMEOUT_MS } from '../lib/types';

// Key BLS series to monitor
const WATCHED_SERIES = [
  { seriesId: 'LNS14000000', title: 'Unemployment Rate', titleAr: 'معدل البطالة', category: 'economy' as Category, unit: '%' },
  { seriesId: 'CUSR0000SA0', title: 'Consumer Price Index (CPI)', titleAr: 'مؤشر أسعار المستهلكين', category: 'economy' as Category, unit: 'Index' },
  { seriesId: 'CES0000000001', title: 'Total Nonfarm Payrolls', titleAr: 'إجمالي التوظيف خارج الزراعة', category: 'economy' as Category, unit: 'thousands' },
  { seriesId: 'LNS12300000', title: 'Average Hourly Earnings', titleAr: 'متوسط الأجر بالساعة', category: 'economy' as Category, unit: '$' },
  { seriesId: 'LNS11300000', title: 'Labor Force Participation Rate', titleAr: 'معدل مشاركة القوى العاملة', category: 'economy' as Category, unit: '%' },
  { seriesId: 'CUSR0000SAF1', title: 'CPI Food', titleAr: 'مؤشر أسعار الغذاء', category: 'commodities' as Category, unit: 'Index' },
  { seriesId: 'CUSR0000SAE', title: 'CPI Energy', titleAr: 'مؤشر أسعار الطاقة', category: 'commodities' as Category, unit: 'Index' },
  { seriesId: 'LNS14000024', title: 'Long-term Unemployment', titleAr: 'البطالة طويلة الأمد', category: 'economy' as Category, unit: '%' },
];

interface BLSSeriesData {
  seriesID: string;
  data: Array<{
    year: string;
    period: string;
    periodName: string;
    value: string;
    footnotes?: any[];
  }>;
}

interface BLSResponse {
  Results?: { series: BLSSeriesData[] };
  message?: string[];
  status?: string;
}

export async function fetchBLS(since: Date): Promise<FetchResult> {
  const startTime = Date.now();
  const allEvents: RawEvent[] = [];
  const errors: string[] = [];

  const apiKey = process.env.BLS_API_KEY || '';
  const startYear = since.getFullYear().toString();
  const endYear = new Date().getFullYear().toString();

  // BLS API allows up to 50 series per request
  const seriesIds = WATCHED_SERIES.map(s => s.seriesId);

  try {
    const url = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
    const body: any = {
      seriesid: seriesIds,
      startyear: startYear,
      endyear: endYear,
    };
    if (apiKey) {
      body.registrationkey = apiKey;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': AGENCY_USER_AGENT,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      errors.push(`HTTP ${response.status}`);
      return { source: 'FRED' as any, events: [], errors, durationMs: Date.now() - startTime };
    }

    const data: BLSResponse = await response.json();

    if (data.message && data.message.length > 0 && !data.Results) {
      errors.push(`BLS API: ${data.message.join('; ').slice(0, 100)}`);
      return { source: 'FRED' as any, events: [], errors, durationMs: Date.now() - startTime };
    }

    if (!data.Results || !data.Results.series) {
      errors.push('BLS API: no results');
      return { source: 'FRED' as any, events: [], errors, durationMs: Date.now() - startTime };
    }

    for (const seriesData of data.Results.series) {
      const watched = WATCHED_SERIES.find(s => s.seriesId === seriesData.seriesID);
      if (!watched) continue;

      if (!seriesData.data || seriesData.data.length === 0) continue;

      // Get the latest data point
      const latest = seriesData.data[0];
      const value = parseFloat(latest.value);
      if (isNaN(value)) continue;

      // Parse date: year + period (e.g., "2024" + "M06" = June 2024)
      const periodMatch = latest.period.match(/M(\d{2})/);
      if (!periodMatch) continue;
      const month = parseInt(periodMatch[1], 10) - 1;
      const dataDate = new Date(parseInt(latest.year), month, 1);

      if (dataDate < since) continue;

      const unitSuffix = watched.unit ? ` ${watched.unit}` : '';
      const title = `${watched.titleAr}: ${value}${unitSuffix} (${latest.periodName} ${latest.year})`;

      const rawContent = `U.S. Bureau of Labor Statistics — ${watched.titleAr}

السلسلة: ${watched.title} (${watched.seriesId})
القيمة الأخيرة: ${value}${unitSuffix}
الفترة: ${latest.periodName} ${latest.year}
المصدر: مكتب إحصاءات العمل الأمريكي (BLS)
الرابط: https://data.bls.gov/timeseries/${watched.seriesId}

البيانات الرسمية الصادرة عن مكتب إحصاءات العمل الأمريكي. هذه بيانات خام رسمية تنشرها الجهة المصدرية مباشرة.`;

      allEvents.push({
        sourceId: 'FRED',
        externalId: `bls-${watched.seriesId}-${latest.year}-${latest.period}`,
        sourceName: 'مكتب إحصاءات العمل الأمريكي (BLS)',
        url: `https://data.bls.gov/timeseries/${watched.seriesId}`,
        eventType: 'data_release',
        title,
        rawContent: rawContent.slice(0, 3000),
        category: watched.category,
        locale: 'ar',
        publishedAtSource: dataDate,
      });
    }
  } catch (err: any) {
    errors.push(`BLS fetch failed: ${err.message?.slice(0, 80)}`);
  }

  return {
    source: 'FRED' as any,
    events: allEvents,
    errors,
    durationMs: Date.now() - startTime,
  };
}
