// ═══════════════════════════════════════════════════════════════
// Markets Wrap Collector — generates daily market summary
// ═══════════════════════════════════════════════════════════════
// Produces 3 markets wrap articles daily (Bloomberg style):
//   1. Morning wrap (GCC + Asia open)
//   2. Midday wrap (Europe open + US premarket)
//   3. Closing wrap (US close + summary)
// Each combines: indices, commodities, FX, crypto, bonds
// ═══════════════════════════════════════════════════════════════

import type { RawEvent } from '../lib/types';
import { db } from '@/lib/db';


/**
 * Get all market indicators grouped by category
 */
async function getMarketSnapshot(): Promise<{
  indices: any[];
  commodities: any[];
  currencies: any[];
  bonds: any[];
  crypto: any[];
} | null> {
  try {
    // V1167: Use live prices from /api/markets/prices instead of stale DB data.
    // The old code read from db.marketIndicator which was last updated 2 months ago.
    // The live API uses Finnhub + Yahoo Finance — same source as the ticker bar.
    const liveResponse = await fetch('http://localhost:' + (process.env.PORT || '8080') + '/api/markets/prices', {
      signal: AbortSignal.timeout(10000),
    });

    if (liveResponse.ok) {
      const liveData = await liveResponse.json();
      if (liveData.prices && Array.isArray(liveData.prices) && liveData.prices.length > 0) {
        // Convert live prices to the same format as marketIndicator
        const indicators = liveData.prices.map((p: any) => ({
          symbol: p.symbol || '',
          name: p.nameEn || p.displaySymbol || p.symbol || '',
          nameAr: p.nameAr || p.displaySymbol || p.symbol || '',
          value: p.price || 0,
          change: p.change || 0,
          changePercent: p.changePercent || 0,
          category: p.categoryEn === 'Commodities' ? 'commodity' : p.categoryEn === 'Crypto' ? 'crypto' : p.categoryEn === 'Forex' ? 'currency' : p.categoryEn === 'Energy' ? 'commodity' : 'index',
          lastUpdated: new Date(),
        }));

        const groupBy = (cat: string) => indicators
          .filter(i => i.category === cat)
          .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
          .slice(0, 8);

        return {
          indices: groupBy('index'),
          commodities: groupBy('commodity'),
          currencies: groupBy('currency'),
          bonds: [],
          crypto: groupBy('crypto'),
        };
      }
    }

    // Fallback: use DB data but ONLY if fresh (< 24h old)
    console.warn('[MarketsWrap] Live prices API failed, trying DB (may be stale)');
    const indicators = await db.marketIndicator.findMany({
      where: {
        OR: [
          { category: 'index' },
          { category: 'commodity' },
          { category: 'currency' },
          { category: 'bond_yield' },
          { category: 'crypto' },
        ],
        lastUpdated: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // V1167: Only fresh data
      },
      select: {
        symbol: true,
        name: true,
        nameAr: true,
        value: true,
        change: true,
        changePercent: true,
        category: true,
        lastUpdated: true,
      },
    });

    if (indicators.length === 0) {
      console.warn('[MarketsWrap] No fresh market data (live API failed + DB data older than 24h) — skipping markets wrap');
      return null;
    }

    const groupBy = (cat: string) => indicators
      .filter(i => i.category === cat)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 8);

    return {
      indices: groupBy('index'),
      commodities: groupBy('commodity'),
      currencies: groupBy('currency'),
      bonds: groupBy('bond_yield'),
      crypto: groupBy('crypto'),
    };
  } catch (err: any) {
    console.warn(`[MarketsWrap] getMarketSnapshot failed: ${err.message?.slice(0, 80)}`);
    return null;
  }
}

function formatIndicators(items: any[], label: string): string {
  if (items.length === 0) return `${label}: لا توجد بيانات`;
  const lines = items.map(i => {
    const name = i.nameAr || i.name || i.symbol;
    const change = i.changePercent >= 0 ? `+${i.changePercent.toFixed(2)}%` : `${i.changePercent.toFixed(2)}%`;
    return `  ${name}: ${i.value.toLocaleString('en', { maximumFractionDigits: 2 })} (${change})`;
  });
  return `${label}:\n${lines.join('\n')}`;
}

/**
 * Generate markets wrap event
 */
export async function collectMarketsWrap(): Promise<RawEvent[]> {
  console.log('[MarketsWrap] Collecting markets wrap...');
  const snapshot = await getMarketSnapshot();
  if (!snapshot) {
    console.log('[MarketsWrap] No market data available');
    return [];
  }

  const now = new Date();
  const hourUTC = now.getUTCHours();

  // Determine which wrap this is
  let wrapType: string;
  let wrapTitle: string;
  if (hourUTC >= 5 && hourUTC < 11) {
    wrapType = 'morning';
    wrapTitle = 'ملخص الصباح';
  } else if (hourUTC >= 11 && hourUTC < 17) {
    wrapType = 'midday';
    wrapTitle = 'ملخص منتصف اليوم';
  } else {
    wrapType = 'closing';
    wrapTitle = 'ملخص الإغلاق';
  }

  // Find top mover
  const allMovers = [...snapshot.indices, ...snapshot.commodities, ...snapshot.currencies, ...snapshot.crypto];
  const topMover = allMovers.length > 0 ? allMovers[0] : null;
  const topMoverName = topMover ? (topMover.nameAr || topMover.name || topMover.symbol) : 'الأسواق';
  const topMoverChange = topMover ? topMover.changePercent : 0;

  const content = [
    `${wrapTitle} — ${now.toLocaleDateString('ar')} ${now.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}`,
    '',
    formatIndicators(snapshot.indices, 'المؤشرات'),
    '',
    formatIndicators(snapshot.commodities, 'السلع'),
    '',
    formatIndicators(snapshot.currencies, 'العملات'),
    '',
    formatIndicators(snapshot.bonds, 'عوائد السندات'),
    '',
    formatIndicators(snapshot.crypto, 'العملات الرقمية'),
    '',
    ``,
  ].join('\n');

  const title = topMover
    ? `${wrapTitle}: ${topMoverName} ${topMoverChange >= 0 ? 'يرتفع' : 'ينخفض'} ${Math.abs(topMoverChange).toFixed(2)}%`
    : `${wrapTitle}: نظرة عامة على الأسواق`;

  return [{
    sourceId: 'DB',
    externalId: `markets-wrap-${wrapType}-${now.toISOString().split('T')[0]}`,
    sourceName: 'ملخص الأسواق (رؤى)',
    url: '',
    eventType: 'data_release',
    title,
    rawContent: content,
    category: 'economy',
    locale: 'ar',
    publishedAtSource: now,
  }];
}

export async function noop(): Promise<void> {}
