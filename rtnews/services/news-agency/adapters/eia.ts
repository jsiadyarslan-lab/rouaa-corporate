// ═══════════════════════════════════════════════════════════════
// EIA (Energy Information Administration) API Adapter
// ═══════════════════════════════════════════════════════════════
// Fetches latest energy data from EIA API v2.
// API: https://api.eia.gov/v2/
// Auth: requires EIA_API_KEY (free, register at eia.gov/opendata/register.php)
// Rate limit: 5000 req/hour
// Attribution: "U.S. Energy Information Administration" required
// ═══════════════════════════════════════════════════════════════

import type { RawEvent, FetchResult, Category } from '../lib/types';
import { AGENCY_USER_AGENT, FETCH_TIMEOUT_MS } from '../lib/types';

// Key EIA series to monitor
const WATCHED_SERIES = [
  // Petroleum
  { route: 'petroleum/stoc/wstk', seriesId: 'PAP_STO_WCS0_DFW_NUS_DFW', title: 'Crude Oil Stocks', titleAr: 'مخزونات النفط الخام', category: 'commodities' as Category, unit: 'million barrels' },
  { route: 'petroleum/pri/spt', seriesId: 'PET.RWTC.D', title: 'WTI Crude Oil Spot Price', titleAr: 'سعر النفط الخام WTI', category: 'commodities' as Category, unit: '$/barrel' },
  { route: 'petroleum/pri/spt', seriesId: 'PET.RBRTE.D', title: 'Brent Crude Oil Spot Price', titleAr: 'سعر نفط برنت', category: 'commodities' as Category, unit: '$/barrel' },
  // Natural Gas
  { route: 'natural-gas/sto/wkpub', seriesId: 'NG.STOWCSM_W', title: 'Natural Gas Working Storage', titleAr: 'مخزونات الغاز الطبيعي', category: 'commodities' as Category, unit: 'BCF' },
  { route: 'natural-gas/pri/sum', seriesId: 'RNGWHHD', title: 'Henry Hub Natural Gas Price', titleAr: 'سعر الغاز الطبيعي (هنري هاب)', category: 'commodities' as Category, unit: '$/MMBtu' },
];

interface EIAResponse {
  response?: {
    data?: Array<{
      period: string;
      value: number | string;
      'series-description'?: string;
    }>;
  };
  error?: string;
}

export async function fetchEIA(since: Date): Promise<FetchResult> {
  const startTime = Date.now();
  const allEvents: RawEvent[] = [];
  const errors: string[] = [];

  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) {
    errors.push('EIA_API_KEY not set');
    return { source: 'FRED' as any, events: [], errors, durationMs: Date.now() - startTime };
  }

  for (const series of WATCHED_SERIES) {
    try {
      // EIA API v2 format
      const url = `https://api.eia.gov/v2/${series.route}/data/?api_key=${apiKey}&frequency=daily&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': AGENCY_USER_AGENT,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!response.ok) {
        errors.push(`${series.seriesId}: HTTP ${response.status}`);
        continue;
      }

      const data: EIAResponse = await response.json();

      if (data.error) {
        errors.push(`${series.seriesId}: ${data.error.slice(0, 60)}`);
        continue;
      }

      if (!data.response?.data || data.response.data.length === 0) {
        continue;
      }

      const latest = data.response.data[0];
      const value = typeof latest.value === 'string' ? parseFloat(latest.value) : latest.value;
      if (isNaN(value)) continue;

      // Parse date (format: YYYY-MM-DD or YYYY-MM)
      const periodDate = new Date(latest.period + (latest.period.length === 7 ? '-01' : '') + 'T00:00:00Z');
      if (isNaN(periodDate.getTime()) || periodDate < since) continue;

      const unitSuffix = series.unit ? ` ${series.unit}` : '';
      const title = `${series.titleAr}: ${value}${unitSuffix} (${latest.period})`;

      const rawContent = `U.S. Energy Information Administration — ${series.titleAr}

السلسلة: ${series.title} (${series.seriesId})
القيمة الأخيرة: ${value}${unitSuffix}
الفترة: ${latest.period}
المصدر: إدارة معلومات الطاقة الأمريكية (EIA)
الرابط: https://www.eia.gov/opendata/qb.php?sdid=${series.seriesId}

البيانات الرسمية الصادرة عن إدارة معلومات الطاقة الأمريكية. هذه بيانات خام رسمية تنشرها الجهة المصدرية مباشرة.`;

      allEvents.push({
        sourceId: 'FRED',
        externalId: `eia-${series.seriesId}-${latest.period}`,
        sourceName: 'إدارة معلومات الطاقة الأمريكية (EIA)',
        url: `https://www.eia.gov/opendata/qb.php?sdid=${series.seriesId}`,
        eventType: 'data_release',
        title,
        rawContent: rawContent.slice(0, 3000),
        category: series.category,
        locale: 'ar',
        publishedAtSource: periodDate,
      });

      // Rate limit: 5000 req/hour = ~83/min → wait 800ms
      await new Promise(r => setTimeout(r, 800));
    } catch (err: any) {
      errors.push(`${series.seriesId}: ${err.message?.slice(0, 60)}`);
    }
  }

  return {
    source: 'FRED' as any,
    events: allEvents,
    errors,
    durationMs: Date.now() - startTime,
  };
}
