// ─── Earnings Calendar API ──────────────────────────────────────
// Returns upcoming company earnings data from Finnhub

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let cachedEarnings: any[] = [];
let lastFetch = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

async function fetchFinnhubEarnings(): Promise<any[]> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY || process.env.FINNHUB_KEY;
    if (!apiKey) return [];

    const now = new Date();
    const from = now.toISOString().split('T')[0];
    const to = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const res = await fetch(
      `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return data.earningsCalendar || [];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedEarnings.length > 0 && (now - lastFetch) < CACHE_DURATION) {
      return NextResponse.json({ earnings: cachedEarnings, cached: true });
    }

    const finnhubEarnings = await fetchFinnhubEarnings();

    if (finnhubEarnings.length > 0) {
      cachedEarnings = finnhubEarnings.slice(0, 15).map((e: any, i: number) => ({
        symbol: e.symbol || 'N/A',
        company: e.name || e.symbol || '',
        date: e.date || new Date().toISOString().split('T')[0],
        timing: e.hour === 'amc' ? 'after_close' : 'before_open',
        epsExpected: e.epsEstimate || 0,
        epsPrevious: e.epsActual || e.epsEstimate || 0,
        revenueExpected: e.revenueEstimate ? `$${(e.revenueEstimate / 1e9).toFixed(1)}B` : '-',
        aiPrediction: e.epsEstimate && e.epsActual ? (e.epsActual > e.epsEstimate ? 'beat' : e.epsActual < e.epsEstimate ? 'miss' : 'meet') : 'meet',
        aiConfidence: null,
        expectedMove: null,
        source: 'live',
      }));
    } else {
      // No real data — return empty instead of fake data
      cachedEarnings = [];
    }

    lastFetch = now;
    return NextResponse.json({ earnings: cachedEarnings, cached: false });
  } catch (error: any) {
    return NextResponse.json({ earnings: cachedEarnings.length > 0 ? cachedEarnings : [], error: error.message }, { status: 200 });
  }
}

function getFutureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}
