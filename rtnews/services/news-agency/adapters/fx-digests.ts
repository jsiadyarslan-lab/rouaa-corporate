// ═══════════════════════════════════════════════════════════════
// FX Digests V3 — Rich context with history + econ events + DXY
// ═══════════════════════════════════════════════════════════════
// For each FX pair:
//   - Current price + change%
//   - 7d/30d history (high, low, avg, volatility, trend, S/R)
//   - DXY context (if USD pair)
//   - Upcoming economic events for both currencies
//   - Other FX pairs for cross-currency context
//   - Interpretation hints
// ═══════════════════════════════════════════════════════════════

import type { RawEvent } from '../lib/types';
import { db } from '@/lib/db';
import { computeHistoryStats, fmtPrice, fmtPct, buildHistoryBlock } from '../lib/market-math';

const FX_PAIRS = [
  { symbol: 'EURUSD', name: 'اليورو/الدولار', aliases: ['EUR/USD', 'EURUSD', 'EUR_USD'], currencies: ['EUR', 'USD'] },
  { symbol: 'GBPUSD', name: 'الجنيه الإسترليني/الدولار', aliases: ['GBP/USD', 'GBPUSD'], currencies: ['GBP', 'USD'] },
  { symbol: 'USDJPY', name: 'الدولار/الين الياباني', aliases: ['USD/JPY', 'USDJPY'], currencies: ['USD', 'JPY'] },
  { symbol: 'USDCHF', name: 'الدولار/الفرنك السويسري', aliases: ['USD/CHF', 'USDCHF'], currencies: ['USD', 'CHF'] },
  { symbol: 'AUDUSD', name: 'الدولار الأسترالي/الدولار', aliases: ['AUD/USD', 'AUDUSD'], currencies: ['AUD', 'USD'] },
];

/**
 * Fetch DXY for USD-pair context.
 */
async function getDxyContext(): Promise<{ value: number; changePercent: number } | null> {
  try {
    const dxy = await db.marketIndicator.findFirst({
      where: { OR: [{ symbol: 'DXY' }, { symbol: 'USD' }, { name: { contains: 'Dollar Index' } }, { name: { contains: 'دولار' } }], lastUpdated: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      select: { value: true, changePercent: true },
    });
    if (!dxy) return null;
    return { value: dxy.value || 0, changePercent: dxy.changePercent || 0 };
  } catch {
    return null;
  }
}

/**
 * Fetch upcoming economic events for the two currencies in a pair.
 */
async function getRelevantEconEvents(currencies: string[]): Promise<string> {
  try {
    const now = new Date();
    const twoDaysAhead = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const countryMap: Record<string, string[]> = {
      USD: ['US', 'United States'],
      EUR: ['EU', 'Germany', 'France', 'Italy', 'Spain', 'Eurozone'],
      GBP: ['UK', 'United Kingdom', 'GB'],
      JPY: ['Japan', 'JP'],
      CHF: ['Switzerland', 'CH'],
      AUD: ['Australia', 'AU'],
      CAD: ['Canada', 'CA'],
    };
    const countries = currencies.flatMap(c => countryMap[c] || [c]);
    const events = await db.economicEvent.findMany({
      where: {
        isActualReleased: false,
        importance: { in: ['high', 'critical'] },
        eventDate: { gte: now, lte: twoDaysAhead },
        OR: [
          { country: { in: countries } },
          { currency: { in: currencies } },
        ],
      },
      orderBy: { eventDate: 'asc' },
      take: 4,
      select: { eventName: true, eventNameAr: true, country: true, currency: true, eventDate: true, importance: true, forecast: true },
    });
    if (events.length === 0) return '';
    return events.map(e => {
      const name = e.eventNameAr || e.eventName;
      const time = new Date(e.eventDate).toLocaleString('ar', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      const fc = e.forecast ? `، التوقع: ${e.forecast}` : '';
      return `• ${name} (${e.country}/${e.currency}) — ${time}${fc}`;
    }).join('\n');
  } catch {
    return '';
  }
}

/**
 * Fetch other FX pairs for cross-currency context.
 */
async function getOtherPairs(excludeSymbol: string): Promise<string> {
  try {
    const pairs = await db.marketIndicator.findMany({
      where: {
        category: 'currency', lastUpdated: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        changePercent: { not: 0 },
        symbol: { not: excludeSymbol },
      },
      orderBy: { changePercent: 'desc' },
      take: 4,
      select: { symbol: true, name: true, nameAr: true, value: true, changePercent: true },
    });
    if (pairs.length === 0) return '';
    return pairs.map(p => `• ${p.nameAr || p.name || p.symbol}: ${fmtPct(p.changePercent)} (${p.value.toFixed(4)})`).join('\n');
  } catch {
    return '';
  }
}

async function getFXAnalysis(pair: typeof FX_PAIRS[0], dxyCtx: { value: number; changePercent: number } | null): Promise<RawEvent | null> {
  try {
    let ind: any = null;
    for (const alias of pair.aliases) {
      const found = await db.marketIndicator.findMany({
        where: { OR: [{ symbol: alias }, { symbol: alias.replace('/', '') }] },
        select: { symbol: true, name: true, nameAr: true, value: true, change: true, changePercent: true, history: true, lastUpdated: true },
        take: 1,
      });
      if (found.length > 0) { ind = found[0]; break; }
    }
    if (!ind) return null;

    const price = ind.value || 0;
    const changePercent = ind.changePercent || 0;
    if (Math.abs(changePercent) < 1.0) return null;
    const direction = changePercent > 0 ? 'صعودي' : 'هبوطي';

    const stats = computeHistoryStats(ind.history, price);

    const lines: string[] = [];
    lines.push(`الزوج: ${pair.name} (${pair.symbol})`);
    lines.push(`السعر الحالي: ${price.toFixed(4)}`);
    lines.push(`التغير اليومي: ${fmtPct(changePercent)}`);
    lines.push(`الاتجاه اليومي: ${direction}`);
    if (ind.nameAr) lines.push(`الاسم العربي: ${ind.nameAr}`);
    if (ind.lastUpdated) lines.push(`آخر تحديث: ${new Date(ind.lastUpdated).toLocaleString('ar')}`);

    // Historical block
    const histBlock = buildHistoryBlock(stats);
    if (histBlock) {
      lines.push('');
      lines.push('—— السياق التاريخي ——');
      lines.push(histBlock);
    }

    // DXY context for USD pairs
    if (pair.currencies.includes('USD') && dxyCtx) {
      lines.push('');
      lines.push('—— سياق مؤشر الدولار (DXY) ——');
      lines.push(`قيمة DXY: ${dxyCtx.value.toFixed(2)}`);
      lines.push(`تغير DXY: ${fmtPct(dxyCtx.changePercent)}`);
      const dxyDir = dxyCtx.changePercent > 0 ? 'صعودي' : dxyCtx.changePercent < 0 ? 'هبوطي' : 'عرضي';
      lines.push(`اتجاه DXY: ${dxyDir}`);
      // For EURUSD, GBPUSD, AUDUSD: USD up = pair down (inverse)
      // For USDJPY, USDCHF: USD up = pair up (direct)
      const isUsdBase = pair.symbol.startsWith('USD');
      if (isUsdBase) {
        if (Math.sign(changePercent) === Math.sign(dxyCtx.changePercent)) {
          lines.push(`الارتباط: ${pair.symbol} يتحرك مع DXY (تأكيد قوة الدولار)`);
        } else {
          lines.push(`الارتباط: ${pair.symbol} يتحرك عكس DXY (انفصال)`);
        }
      } else {
        if (Math.sign(changePercent) !== Math.sign(dxyCtx.changePercent)) {
          lines.push(`الارتباط: ${pair.symbol} يتحرك عكس DXY (تأكيد ضعف/قوة الدولار)`);
        } else {
          lines.push(`الارتباط: ${pair.symbol} يتحرك مع DXY (انفصال — راجع العملة المقابلة)`);
        }
      }
    }

    // Other pairs
    const others = await getOtherPairs(pair.symbol);
    if (others) {
      lines.push('');
      lines.push('—— سياق الأزواج الأخرى ——');
      lines.push(others);
    }

    // Upcoming economic events
    const econEvents = await getRelevantEconEvents(pair.currencies);
    if (econEvents) {
      lines.push('');
      lines.push('—— أحداث اقتصادية قادمة مؤثرة ——');
      lines.push(econEvents);
    }

    // Interpretation hints
    lines.push('');
    lines.push('—— ملاحظات للتحليل ——');
    if (stats.hasHistory) {
      if (stats.support !== null && stats.resistance !== null) {
        lines.push(`السعر الحالي ${price.toFixed(4)} بين الدعم ${stats.support.toFixed(4)} والمقاومة ${stats.resistance.toFixed(4)}`);
      }
      if (stats.change7d !== null && stats.change30d !== null) {
        if (stats.change7d > 0 && stats.change30d < 0) {
          lines.push(`ارتفاع قصير المدى (${fmtPct(stats.change7d)}) ضمن اتجاه هبوطي شهري (${fmtPct(stats.change30d)}) — احتمال تصحيح فني`);
        } else if (stats.change7d < 0 && stats.change30d > 0) {
          lines.push(`تراجع قصير المدى (${fmtPct(stats.change7d)}) ضمن اتجاه صعودي شهري (${fmtPct(stats.change30d)}) — احتمال فرصة شراء`);
        }
      }
      if (stats.volatility7d !== null && stats.volatility7d > 1.5) {
        lines.push(`تقلب مرتفع (${stats.volatility7d.toFixed(2)}%) — حذر من التذبذب`);
      }
    }

    return {
      sourceId: 'DB',
      externalId: `fx-${pair.symbol}-${new Date().toISOString().split('T')[0] + '-' + new Date().getHours()}`,
      sourceName: 'تحليلات العملات الداخلية (رؤى)',
      url: '',
      eventType: 'data_release',
      title: `تحليل ${pair.name}: اتجاه ${direction} ${changePercent !== 0 ? `بـ${Math.abs(changePercent).toFixed(2)}%` : ''} عند ${price.toFixed(4)}`,
      rawContent: `تحليل فني شامل لزوج ${pair.name} (${pair.symbol}) — ${new Date().toLocaleDateString('ar')}\n\n${lines.join('\n')}`,
      category: 'forex',
      locale: 'ar',
      publishedAtSource: new Date(),
    };
  } catch (err: any) {
    console.warn(`[FXDigests] failed: ${err.message?.slice(0, 80)}`);
    return null;
  }
}

async function getDXYOverview(): Promise<RawEvent[]> {
  try {
    const dxy = await db.marketIndicator.findFirst({
      where: { OR: [{ symbol: 'DXY' }, { symbol: 'USD' }, { name: { contains: 'Dollar Index' } }, { name: { contains: 'دولار' } }], lastUpdated: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      select: { symbol: true, name: true, nameAr: true, value: true, change: true, changePercent: true, history: true, lastUpdated: true },
    });
    if (!dxy) return [];

    const stats = computeHistoryStats(dxy.history, dxy.value);
    const lines: string[] = [
      `المؤشر: مؤشر الدولار (DXY)`,
      `القيمة الحالية: ${dxy.value.toFixed(2)}`,
      `التغير: ${fmtPct(dxy.changePercent)}`,
    ];
    if (dxy.nameAr) lines.push(`الاسم العربي: ${dxy.nameAr}`);
    const histBlock = buildHistoryBlock(stats);
    if (histBlock) {
      lines.push('');
      lines.push('—— السياق التاريخي ——');
      lines.push(histBlock);
    }

    return [{
      sourceId: 'DB',
      externalId: `fx-dxy-${new Date().toISOString().split('T')[0] + '-' + new Date().getHours()}`,
      sourceName: 'مؤشر الدولار الداخلي (رؤى)',
      url: '',
      eventType: 'data_release',
      title: `مؤشر الدولار: ${dxy.changePercent >= 0 ? 'يرتفع' : 'ينخفض'} ${Math.abs(dxy.changePercent).toFixed(2)}% عند ${dxy.value.toFixed(2)}`,
      rawContent: `مؤشر الدولار (DXY) — ${new Date().toLocaleDateString('ar')}\n\n${lines.join('\n')}`,
      category: 'forex',
      locale: 'ar',
      publishedAtSource: new Date(),
    }];
  } catch (err: any) { return []; }
}

export async function collectFXDigests(): Promise<RawEvent[]> {
  console.log('[FXDigests] Collecting rich FX digests V3...');
  const dxyCtx = await getDxyContext();
  const fxResults = await Promise.allSettled(FX_PAIRS.map(p => getFXAnalysis(p, dxyCtx)));
  const dxyResult = await getDXYOverview();
  const allEvents: RawEvent[] = [];
  for (const result of fxResults) {
    if (result.status === 'fulfilled' && result.value) allEvents.push(result.value);
  }
  allEvents.push(...dxyResult);
  console.log(`[FXDigests] ✓ Collected ${allEvents.length} rich FX events`);
  return allEvents;
}
