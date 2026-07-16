// ═══════════════════════════════════════════════════════════════
// Crypto Digests V3 — Rich context with history + cross-asset
// ═══════════════════════════════════════════════════════════════
// For each major crypto (BTC, ETH, BNB, SOL, XRP):
//   - Current price + change%
//   - 7d/30d history (high, low, avg, volatility, trend)
//   - Support/resistance levels
//   - BTC correlation context (if not BTC itself)
//   - Upcoming economic events that affect crypto (CPI, FOMC)
//   - Other crypto movers for sector context
// ═══════════════════════════════════════════════════════════════

import type { RawEvent } from '../lib/types';
import { db } from '@/lib/db';
import { computeHistoryStats, fmtPrice, fmtPct, buildHistoryBlock } from '../lib/market-math';

const CRYPTO_PAIRS = [
  { symbol: 'BTC', name: 'بيتكوين', aliases: ['BTC', 'BTCUSDT', 'BTC/USDT', 'Bitcoin'] },
  { symbol: 'ETH', name: 'إيثيريوم', aliases: ['ETH', 'ETHUSDT', 'ETH/USDT', 'Ethereum'] },
  { symbol: 'BNB', name: 'بينانس كوين', aliases: ['BNB', 'BNBUSDT', 'BNB/USDT'] },
  { symbol: 'SOL', name: 'سولانا', aliases: ['SOL', 'SOLUSDT', 'SOL/USDT', 'Solana'] },
  { symbol: 'XRP', name: 'ريبل', aliases: ['XRP', 'XRPUSDT', 'XRP/USDT', 'Ripple'] },
];

/**
 * Fetch BTC stats for correlation context.
 */
async function getBtcContext(): Promise<{ price: number; changePercent: number } | null> {
  try {
    const btc = await db.marketIndicator.findFirst({
      where: { OR: [{ symbol: 'BTC' }, { symbol: 'BTCUSDT' }, { symbol: 'BTC/USDT' }], lastUpdated: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      select: { value: true, changePercent: true },
    });
    if (!btc) return null;
    return { price: btc.value || 0, changePercent: btc.changePercent || 0 };
  } catch {
    return null;
  }
}

/**
 * Fetch upcoming high-impact economic events that typically move crypto.
 */
async function getRelevantEconEvents(): Promise<string> {
  try {
    const now = new Date();
    const twoDaysAhead = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const events = await db.economicEvent.findMany({
      where: {
        isActualReleased: false,
        importance: { in: ['high', 'critical'] },
        eventDate: { gte: now, lte: twoDaysAhead },
        OR: [
          { country: { in: ['US', 'United States'] } },
          { eventName: { contains: 'CPI' } },
          { eventName: { contains: 'Rate' } },
          { eventName: { contains: 'Fed' } },
          { eventName: { contains: 'FOMC' } },
          { eventName: { contains: 'Nonfarm' } },
          { eventName: { contains: 'PCE' } },
        ],
      },
      orderBy: { eventDate: 'asc' },
      take: 3,
      select: { eventName: true, eventNameAr: true, country: true, eventDate: true, importance: true, forecast: true },
    });
    if (events.length === 0) return '';
    return events.map(e => {
      const name = e.eventNameAr || e.eventName;
      const time = new Date(e.eventDate).toLocaleString('ar', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      const fc = e.forecast ? `، التوقع: ${e.forecast}` : '';
      return `• ${name} (${e.country}) — ${time}${fc}`;
    }).join('\n');
  } catch {
    return '';
  }
}

/**
 * Fetch top crypto movers (excluding the current pair) for sector context.
 */
async function getOtherMovers(excludeSymbol: string): Promise<string> {
  try {
    const movers = await db.marketIndicator.findMany({
      where: {
        category: 'crypto',
        changePercent: { not: 0 },
        symbol: { not: excludeSymbol },
      },
      orderBy: { changePercent: 'desc' },
      take: 4,
      select: { symbol: true, name: true, value: true, changePercent: true },
    });
    if (movers.length === 0) return '';
    return movers.map(m => `• ${m.name || m.symbol}: ${fmtPct(m.changePercent)} (${fmtPrice(m.value)})`).join('\n');
  } catch {
    return '';
  }
}

async function getCryptoAnalysis(pair: { symbol: string; name: string; aliases: string[] }, btcCtx: { price: number; changePercent: number } | null, econEvents: string): Promise<RawEvent | null> {
  try {
    let ind: any = null;
    for (const alias of pair.aliases) {
      const found = await db.marketIndicator.findMany({
        where: { OR: [{ symbol: alias }, { name: alias }], category: 'crypto', lastUpdated: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        select: { symbol: true, name: true, nameAr: true, value: true, change: true, changePercent: true, history: true, lastUpdated: true },
        take: 1,
      });
      if (found.length > 0) { ind = found[0]; break; }
    }
    if (!ind) return null;

    const price = ind.value || 0;
    const changePercent = ind.changePercent || 0;
    if (Math.abs(changePercent) < 2.0) return null;

    const direction = changePercent > 0 ? 'صعودي' : 'هبوطي';
    const priceStr = fmtPrice(price);
    const stats = computeHistoryStats(ind.history, price);

    // Build rich context
    const lines: string[] = [];
    lines.push(`الرمز: ${pair.symbol}`);
    lines.push(`الاسم: ${pair.name}`);
    if (ind.nameAr) lines.push(`الاسم العربي: ${ind.nameAr}`);
    lines.push(`السعر الحالي: ${priceStr}`);
    lines.push(`التغير اليومي: ${fmtPct(changePercent)}`);
    lines.push(`الاتجاه اليومي: ${direction}`);
    lines.push(`آخر تحديث: ${ind.lastUpdated ? new Date(ind.lastUpdated).toLocaleString('ar') : 'غير متوفر'}`);

    // Historical block
    const histBlock = buildHistoryBlock(stats);
    if (histBlock) {
      lines.push('');
      lines.push('—— السياق التاريخي ——');
      lines.push(histBlock);
    }

    // BTC correlation (skip if this IS BTC)
    if (pair.symbol !== 'BTC' && btcCtx) {
      lines.push('');
      lines.push('—— سياق بيتكوين (المؤشر المرجعي) ——');
      lines.push(`سعر BTC: ${fmtPrice(btcCtx.price)}`);
      lines.push(`تغير BTC اليومي: ${fmtPct(btcCtx.changePercent)}`);
      const btcDir = btcCtx.changePercent > 0 ? 'صعودي' : btcCtx.changePercent < 0 ? 'هبوطي' : 'عرضي';
      lines.push(`اتجاه BTC: ${btcDir}`);
      // Correlation hint
      if (Math.sign(changePercent) === Math.sign(btcCtx.changePercent)) {
        lines.push(`الارتباط: ${pair.symbol} يتحرك مع BTC (نفس الاتجاه)`);
      } else {
        lines.push(`الارتباط: ${pair.symbol} يتحرك عكس BTC (انفصال)`);
      }
    }

    // Other movers for sector context
    const movers = await getOtherMovers(pair.symbol);
    if (movers) {
      lines.push('');
      lines.push('—— حركة العملات الرقمية الأخرى ——');
      lines.push(movers);
    }

    // Upcoming economic events
    if (econEvents) {
      lines.push('');
      lines.push('—— أحداث اقتصادية قادمة مؤثرة ——');
      lines.push(econEvents);
    }

    // Interpretation hints for the LLM (data-driven, not opinions)
    lines.push('');
    lines.push('—— ملاحظات للتحليل ——');
    if (stats.hasHistory) {
      if (stats.support !== null && stats.resistance !== null) {
        lines.push(`السعر الحالي ${fmtPrice(price)} بين الدعم ${fmtPrice(stats.support)} والمقاومة ${fmtPrice(stats.resistance)}`);
      }
      if (stats.change7d !== null && stats.change30d !== null) {
        const shortTerm = stats.change7d;
        const longTerm = stats.change30d;
        if (shortTerm > 0 && longTerm < 0) {
          lines.push(`ارتفاع قصير المدى (${fmtPct(shortTerm)}) ضمن اتجاه هبوطي شهري (${fmtPct(longTerm)}) — احتمال تصحيح فني`);
        } else if (shortTerm < 0 && longTerm > 0) {
          lines.push(`تراجع قصير المدى (${fmtPct(shortTerm)}) ضمن اتجاه صعودي شهري (${fmtPct(longTerm)}) — احتمال فرصة شراء`);
        } else if (shortTerm > 0 && longTerm > 0) {
          lines.push(`اتجاه صعودي متوافق قصير وطويل المدى`);
        } else if (shortTerm < 0 && longTerm < 0) {
          lines.push(`اتجاه هبوطي متوافق قصير وطويل المدى`);
        }
      }
      if (stats.volatility7d !== null && stats.volatility7d > 5) {
        lines.push(`تقلب مرتفع (${stats.volatility7d.toFixed(2)}%) — حذر من التذبذب`);
      }
    }

    return {
      sourceId: 'DB',
      externalId: `crypto-${pair.symbol}-${new Date().toISOString().split('T')[0] + '-' + new Date().getHours()}`,
      sourceName: 'تحليلات الكريبتو الداخلية (رؤى)',
      url: '',
      eventType: 'data_release',
      title: `${pair.name}: اتجاه ${direction} عند ${priceStr} ${changePercent !== 0 ? `بـ${Math.abs(changePercent).toFixed(2)}%` : ''}`,
      rawContent: `تحليل فني شامل لـ${pair.name} (${pair.symbol}) — ${new Date().toLocaleDateString('ar')}\n\n${lines.join('\n')}`,
      category: 'crypto',
      locale: 'ar',
      publishedAtSource: new Date(),
    };
  } catch (err: any) {
    console.warn(`[CryptoDigests] getCryptoAnalysis(${pair.symbol}) failed: ${err.message?.slice(0, 80)}`);
    return null;
  }
}

async function getCryptoMovers(): Promise<RawEvent[]> {
  try {
    const cryptos = await db.marketIndicator.findMany({
      where: { category: 'crypto', lastUpdated: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, changePercent: { not: 0 } },
      orderBy: { changePercent: 'desc' },
      take: 12,
      select: { symbol: true, name: true, nameAr: true, value: true, changePercent: true, history: true, lastUpdated: true },
    });
    if (cryptos.length < 3) return [];

    const topGainers = cryptos.filter(c => c.changePercent > 0).slice(0, 5);
    const topLosers = cryptos.filter(c => c.changePercent < 0).slice(-5).reverse();
    if (topGainers.length === 0 && topLosers.length === 0) return [];

    const moversList: string[] = [];
    if (topGainers.length > 0) {
      moversList.push('أعلى ارتفاعاً:');
      for (const c of topGainers) {
        const stats = computeHistoryStats(c.history, c.value);
        const histNote = stats.change7d !== null ? `، أسبوعي: ${fmtPct(stats.change7d)}` : '';
        moversList.push(`  ${c.nameAr || c.name || c.symbol}: ${fmtPct(c.changePercent)} (${fmtPrice(c.value)})${histNote}`);
      }
    }
    if (topLosers.length > 0) {
      moversList.push('');
      moversList.push('أعلى انخفاضاً:');
      for (const c of topLosers) {
        const stats = computeHistoryStats(c.history, c.value);
        const histNote = stats.change7d !== null ? `، أسبوعي: ${fmtPct(stats.change7d)}` : '';
        moversList.push(`  ${c.nameAr || c.name || c.symbol}: ${fmtPct(c.changePercent)} (${fmtPrice(c.value)})${histNote}`);
      }
    }

    return [{
      sourceId: 'DB',
      externalId: `crypto-movers-${new Date().toISOString().split('T')[0] + '-' + new Date().getHours()}`,
      sourceName: 'تحليلات الكريبتو الداخلية (رؤى)',
      url: '',
      eventType: 'data_release',
      title: `حركة سوق الكريبتو اليوم: ${topGainers[0]?.name || topGainers[0]?.symbol} يتصدر بـ${fmtPct(topGainers[0]?.changePercent || 0)}`,
      rawContent: `حركة سوق العملات الرقمية اليوم (${new Date().toLocaleDateString('ar')}):\n\n${moversList.join('\n')}`,
      category: 'crypto',
      locale: 'ar',
      publishedAtSource: new Date(),
    }];
  } catch (err: any) {
    console.warn(`[CryptoDigests] getCryptoMovers failed: ${err.message?.slice(0, 80)}`);
    return [];
  }
}

export async function collectCryptoDigests(): Promise<RawEvent[]> {
  console.log('[CryptoDigests] Collecting rich crypto digests V3...');
  const btcCtx = await getBtcContext();
  const econEvents = await getRelevantEconEvents();
  const cryptoResults = await Promise.allSettled(CRYPTO_PAIRS.map(p => getCryptoAnalysis(p, btcCtx, econEvents)));
  const moversResult = await getCryptoMovers();
  const allEvents: RawEvent[] = [];
  for (const result of cryptoResults) {
    if (result.status === 'fulfilled' && result.value) allEvents.push(result.value);
  }
  allEvents.push(...moversResult);
  console.log(`[CryptoDigests] ✓ Collected ${allEvents.length} rich crypto digest events`);
  return allEvents;
}

export async function noop(): Promise<void> {}
