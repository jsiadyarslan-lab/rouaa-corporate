// ═══════════════════════════════════════════════════════════════
// Stock Digests V4 — Per-stock articles (REAL expansion)
// ═══════════════════════════════════════════════════════════════
// V3 PROBLEM: produces 5+5+1+5 = 16 batched events/day total.
//             DB has 76,229 stock analyses/day → uses 0.021%
// V4 SOLUTION: produce ONE event per stock (top movers, strong signals,
//              volume spikes, analyst upgrades/downgrades, etc.)
//              Target: 50-200 unique per-stock events/cycle
//
// CRITICAL: each event must be SELF-CONTAINED — single stock story,
// not "top 5 list". This enables real journalism diversity.
// ═══════════════════════════════════════════════════════════════

import type { RawEvent } from '../lib/types';
import { db } from '@/lib/db';

// Sector name translation map (kept from V3)
// V1191: Expanded with common variations and short forms that LLMs sometimes use
const SECTOR_AR: Record<string, string> = {
  'Technology': 'التكنولوجيا',
  'Tech': 'التكنولوجيا',
  'Healthcare': 'الرعاية الصحية',
  'Health Care': 'الرعاية الصحية',
  'Health': 'الرعاية الصحية',
  'Financial Services': 'الخدمات المالية',
  'Financials': 'الخدمات المالية',
  'Finance': 'الخدمات المالية',
  'Banks': 'البنوك',
  'Banking': 'البنوك',
  'Consumer Cyclical': 'الاستهلاك الدوري',
  'Consumer Discretionary': 'الاستهلاك الدوري',
  'Consumer Defensive': 'السلع الاستهلاكية الأساسية',
  'Consumer Staples': 'السلع الاستهلاكية الأساسية',
  'Industrials': 'الصناعات',
  'Industrial': 'الصناعات',
  'Energy': 'الطاقة',
  'Oil & Gas': 'الطاقة',
  'Oil and Gas': 'الطاقة',
  'Materials': 'المواد الأساسية',
  'Basic Materials': 'المواد الأساسية',
  'Real Estate': 'العقارات',
  'Realty': 'العقارات',
  'Communication Services': 'خدمات الاتصالات',
  'Communications': 'خدمات الاتصالات',
  'Telecom': 'الاتصالات',
  'Utilities': 'المرافق',
  'Semiconductors': 'أشباه الموصلات',
  'Semis': 'أشباه الموصلات',
  'Biotech': 'التكنولوجيا الحيوية',
  'Biotechnology': 'التكنولوجيا الحيوية',
  'Pharma': 'الأدوية',
  'Pharmaceuticals': 'الأدوية',
  'Automotive': 'السيارات',
  'Autos': 'السيارات',
  'Retail': 'التجزئة',
  'Aerospace': 'الفضاء والدفاع',
  'Defense': 'الفضاء والدفاع',
};

function translateSector(sector: string | null): string {
  if (!sector) return '';
  return SECTOR_AR[sector] || sector;
}

function buildStockContext(s: any): string {
  const lines: string[] = [];
  lines.push(`الرمز: ${s.symbol}`);
  if (s.sector) lines.push(`القطاع: ${translateSector(s.sector)} (${s.sector})`);
  lines.push(`السعر الحالي: $${s.price?.toFixed(2) || 0}`);
  if (s.changePercent !== undefined) lines.push(`نسبة التغير (مقارنة بسعر الإغلاق السابق): ${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%`);
  if (s.change !== undefined && s.change !== 0) lines.push(`التغير المطلق: $${s.change.toFixed(2)}`);
  if (s.high > 0) lines.push(`أعلى سعر اليوم: $${s.high.toFixed(2)}`);
  if (s.low > 0) lines.push(`أدنى سعر اليوم: $${s.low.toFixed(2)}`);
  if (s.open > 0) lines.push(`سعر الافتتاح: $${s.open.toFixed(2)}`);
  if (s.previousClose > 0) lines.push(`سعر الإغلاق السابق: $${s.previousClose.toFixed(2)} (النسبة محسوبة من هذا السعر)`);
  if (s.volume > 0) lines.push(`حجم التداول: ${s.volume.toLocaleString('en')}`);
  if (s.marketCap && s.marketCap > 0) lines.push(`القيمة السوقية: $${(s.marketCap / 1e9).toFixed(2)} مليار`);
  if (s.peRatio && s.peRatio > 0) lines.push(`مكرر الربحية (P/E): ${s.peRatio.toFixed(2)}`);
  if (s.eps !== 0) lines.push(`ربحية السهم (EPS): $${s.eps.toFixed(2)}`);
  if (s.overallSignal) lines.push(`الإشارة الإجمالية: ${s.overallSignal}`);
  if (s.overallScore > 0) lines.push(`النتيجة الإجمالية: ${s.overallScore}/100`);
  if (s.confidenceScore > 0) lines.push(`مستوى الثقة: ${s.confidenceScore}/100`);
  if (s.technicalScore !== 0) lines.push(`النتيجة الفنية: ${s.technicalScore}/100`);
  if (s.fundamentalScore !== 0) lines.push(`النتيجة الأساسية: ${s.fundamentalScore}/100`);
  if (s.riskLevel) lines.push(`مستوى المخاطر: ${s.riskLevel}`);
  if (s.sentiment) lines.push(`المشاعر: ${s.sentiment}`);
  if (s.priceTarget) lines.push(`السعر المستهدف: $${s.priceTarget.toFixed(2)}`);
  if (s.stopLoss) lines.push(`وقف الخسارة: $${s.stopLoss.toFixed(2)}`);

  if (s.indicators) {
    try {
      const ind = typeof s.indicators === 'string' ? JSON.parse(s.indicators) : s.indicators;
      const indLines: string[] = [];
      if (ind.rsi) indLines.push(`RSI: ${ind.rsi.toFixed(1)}`);
      if (ind.macd) indLines.push(`MACD: ${ind.macd}`);
      if (ind.sma20) indLines.push(`SMA20: $${ind.sma20.toFixed(2)}`);
      if (ind.sma50) indLines.push(`SMA50: $${ind.sma50.toFixed(2)}`);
      if (ind.sma200) indLines.push(`SMA200: $${ind.sma200.toFixed(2)}`);
      if (indLines.length > 0) lines.push(`المؤشرات الفنية: ${indLines.join('، ')}`);
    } catch {}
  }

  if (s.tradeSetup) {
    try {
      const ts = typeof s.tradeSetup === 'string' ? JSON.parse(s.tradeSetup) : s.tradeSetup;
      const tsLines: string[] = [];
      if (ts.entryPrice) tsLines.push(`سعر الدخول: $${ts.entryPrice}`);
      if (ts.stopLoss) tsLines.push(`وقف الخسارة: $${ts.stopLoss}`);
      if (ts.takeProfit) tsLines.push(`جني الأرباح: $${ts.takeProfit}`);
      if (ts.riskReward) tsLines.push(`نسبة المخاطرة/المكافأة: ${ts.riskReward}`);
      if (tsLines.length > 0) lines.push(`إعداد التداول: ${tsLines.join('، ')}`);
    } catch {}
  }

  if (s.keyMetrics) {
    try {
      const km = typeof s.keyMetrics === 'string' ? JSON.parse(s.keyMetrics) : s.keyMetrics;
      const kmEntries = Object.entries(km).slice(0, 5).map(([k, v]) => `${k}: ${v}`);
      if (kmEntries.length > 0) lines.push(`المقاييس الرئيسية: ${kmEntries.join('، ')}`);
    } catch {}
  }

  if (s.title) lines.push(`العنوان التحليلي: ${s.title}`);
  if (s.summary) lines.push(`الملخص التحليلي: ${s.summary}`);

  return lines.join('\n');
}

async function getSectorContext(symbol: string, sector: string | null): Promise<string> {
  if (!sector) return '';
  try {
    const sectorStocks = await db.stockAnalysis.findMany({
      where: { sector, symbol: { not: symbol }, updatedAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } },
      select: { changePercent: true, symbol: true },
      take: 50,
    });
    if (sectorStocks.length === 0) return '';
    const avg = sectorStocks.reduce((a, b) => a + b.changePercent, 0) / sectorStocks.length;
    const gainers = sectorStocks.filter(s => s.changePercent > 0).length;
    const losers = sectorStocks.filter(s => s.changePercent < 0).length;
    const topMover = sectorStocks.sort((a, b) => b.changePercent - a.changePercent)[0];
    const lines = [
      `متوسط أداء القطاع (${translateSector(sector)}): ${avg >= 0 ? '+' : ''}${avg.toFixed(2)}%`,
      `عدد الرابحين: ${gainers}، الخاسرين: ${losers}`,
      `أبرز سهم في القطاع: ${topMover.symbol} (${topMover.changePercent >= 0 ? '+' : ''}${topMover.changePercent.toFixed(2)}%)`,
    ];
    return lines.join('\n');
  } catch {
    return '';
  }
}

async function getGeoContextForSector(sector: string | null): Promise<string> {
  if (!sector) return '';
  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const risks = await db.geopoliticalRisk.findMany({
      where: { riskScore: { gte: 60 }, createdAt: { gte: since } },
      orderBy: { riskScore: 'desc' },
      take: 2,
      select: { title: true, riskScore: true, riskCategory: true, affectedAssets: true },
    });
    if (risks.length === 0) return '';
    const lines: string[] = [];
    for (const r of risks) {
      let assetsNote = '';
      try {
        const assets = typeof r.affectedAssets === 'string' ? JSON.parse(r.affectedAssets) : r.affectedAssets;
        if (Array.isArray(assets) && assets.length > 0) {
          const symbols = assets.slice(0, 3).map((a: any) => a.symbol || a.name).filter(Boolean);
          if (symbols.length > 0) assetsNote = ` (أصول متأثرة: ${symbols.join(', ')})`;
        }
      } catch {}
      lines.push(`• ${r.title} — خطورة ${r.riskScore}/100${assetsNote}`);
    }
    return lines.join('\n');
  } catch {
    return '';
  }
}

async function getMacroEconContext(): Promise<string> {
  try {
    const now = new Date();
    const twoDaysAhead = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const events = await db.economicEvent.findMany({
      where: {
        isActualReleased: false,
        importance: { in: ['high', 'critical'] },
        eventDate: { gte: now, lte: twoDaysAhead },
      },
      orderBy: { eventDate: 'asc' },
      take: 3,
      select: { eventName: true, eventNameAr: true, country: true, eventDate: true, forecast: true },
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

// ─── V4 NEW: Per-stock individual events ─────────────────────

interface StockEvent {
  stock: any;
  eventType: 'top_gainer' | 'top_loser' | 'strong_signal' | 'volume_spike' | 'analyst_pick';
  title: string;
  reason: string;
}

async function buildPerStockEvent(
  stock: any,
  eventType: StockEvent['eventType'],
  reason: string
): Promise<RawEvent | null> {
  try {
    const stockCtx = buildStockContext(stock);
    const sectorCtx = await getSectorContext(stock.symbol, stock.sector);
    const geoCtx = await getGeoContextForSector(stock.sector);

    const blocks = [stockCtx];
    if (sectorCtx) blocks.push('', '—— سياق القطاع ——', sectorCtx);
    if (geoCtx) blocks.push('', '—— مخاطر جيوسياسية مؤثرة ——', geoCtx);

    // V1180: Pass the full technical analysis content (from stock-analysis-pipeline)
    // to the LLM as [التحليل الفني الكامل]. The agency re-writes this as a
    // journalistic news article — different style/purpose from the analysis itself.
    // The analysis remains available at /stock-analysis/{symbol} (analysisUrl below).
    const analysisContent = stock.content || '';
    if (analysisContent && analysisContent.length > 100) {
      blocks.push('', '—— التحليل الفني الكامل (أعد صياغته كخبر صحفي) ——', analysisContent);
    }

    const macroCtx = await getMacroEconContext();
    if (macroCtx) blocks.push('', '—— أحداث اقتصادية كلية قادمة ——', macroCtx);

    const rawContent = `${reason}\n\n${blocks.join('\n')}`;

    // Build event title from individual stock data — NOT a "top 5 list" title
    const direction = stock.changePercent >= 0 ? 'يرتفع' : 'يتراجع';
    const pctStr = Math.abs(stock.changePercent).toFixed(2);
    let title: string;
    if (eventType === 'top_gainer') {
      title = `سهم ${stock.symbol} ${direction} ${pctStr}% إلى $${stock.price?.toFixed(2)}`;
    } else if (eventType === 'top_loser') {
      title = `سهم ${stock.symbol} ${direction} ${pctStr}% إلى $${stock.price?.toFixed(2)}`;
    } else if (eventType === 'strong_signal') {
      const sig = stock.overallSignal?.replace('_', ' ') || 'شراء';
      title = `سهم ${stock.symbol} يحصل على إشارة ${sig} بثقة ${stock.confidenceScore}%`;
    } else if (eventType === 'volume_spike') {
      title = `سهم ${stock.symbol} يشهد حجم تداول استثنائي بـ${stock.volume.toLocaleString('en')} سهم`;
    } else if (eventType === 'analyst_pick') {
      const target = stock.priceTarget ? ` بهدف $${stock.priceTarget.toFixed(2)}` : '';
      title = `سهم ${stock.symbol} يتصدر توصيات المحللين${target}`;
    } else {
      title = `سهم ${stock.symbol} ${direction} ${pctStr}%`;
    }

    return {
      sourceId: 'DB',
      externalId: `stock-${stock.symbol}-${eventType}-${new Date().toISOString().split('T')[0]}-${new Date().getHours()}`,
      sourceName: 'تحليلات الأسهم الداخلية (رؤى)',
      url: '',
      eventType: 'data_release',
      title,
      rawContent,
      category: 'stocks',
      locale: 'ar',
      publishedAtSource: new Date(),
      // V1180: Integration with stock-analysis pipeline
      analysisUrl: `/stock-analysis/${stock.symbol}`,
      analysisContent: analysisContent || undefined,
    };
  } catch (err: any) {
    console.warn(`[StockDigests V4] buildPerStockEvent failed for ${stock.symbol}: ${err.message?.slice(0, 80)}`);
    return null;
  }
}

// ─── V4: Top Gainers — individual events (up to 30 stocks) ───
async function getTopGainerEvents(): Promise<RawEvent[]> {
  try {
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const stocks = await db.stockAnalysis.findMany({
      where: { updatedAt: { gte: since }, changePercent: { gte: 5 } },
      orderBy: { changePercent: 'desc' },
      take: 30,  // V1186: restored to 30 — V1161 reduction was unnecessary
      select: {
        symbol: true, title: true, summary: true, content: true, price: true, change: true,
        changePercent: true, high: true, low: true, open: true, previousClose: true,
        volume: true, sector: true, sentiment: true, overallSignal: true,
        overallScore: true, confidenceScore: true, technicalScore: true,
        fundamentalScore: true, riskLevel: true, marketCap: true, peRatio: true,
        eps: true, priceTarget: true, stopLoss: true, indicators: true,
        tradeSetup: true, keyMetrics: true,
      },
    });
    if (stocks.length === 0) return [];

    const events = await Promise.all(
      stocks.map(s => buildPerStockEvent(s, 'top_gainer',
        `سهم ${s.symbol} يتصدر قائمة الأسهم الصاعدة اليوم بارتفاع ملحوظ.`))
    );
    return events.filter((e): e is RawEvent => e !== null);
  } catch (err: any) {
    console.warn(`[StockDigests V4] getTopGainerEvents failed: ${err.message?.slice(0, 80)}`);
    return [];
  }
}

// ─── V4: Top Losers — individual events (up to 30 stocks) ───
async function getTopLoserEvents(): Promise<RawEvent[]> {
  try {
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const stocks = await db.stockAnalysis.findMany({
      where: { updatedAt: { gte: since }, changePercent: { lte: -5 } },
      orderBy: { changePercent: 'asc' },
      take: 30,  // V1186: restored to 30
      select: {
        symbol: true, title: true, summary: true, content: true, price: true, change: true,
        changePercent: true, high: true, low: true, open: true, previousClose: true,
        volume: true, sector: true, sentiment: true, overallSignal: true,
        overallScore: true, confidenceScore: true, technicalScore: true,
        fundamentalScore: true, riskLevel: true, marketCap: true, peRatio: true,
        eps: true, priceTarget: true, stopLoss: true, indicators: true,
        tradeSetup: true, keyMetrics: true,
      },
    });
    if (stocks.length === 0) return [];

    const events = await Promise.all(
      stocks.map(s => buildPerStockEvent(s, 'top_loser',
        `سهم ${s.symbol} يتصدر قائمة الأسهم الهابطة اليوم بتراجع ملحوظ.`))
    );
    return events.filter((e): e is RawEvent => e !== null);
  } catch (err: any) {
    console.warn(`[StockDigests V4] getTopLoserEvents failed: ${err.message?.slice(0, 80)}`);
    return [];
  }
}

// ─── V4: Strong Buy Signals — individual events (up to 20 stocks) ───
async function getStrongSignalEvents(): Promise<RawEvent[]> {
  try {
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const stocks = await db.stockAnalysis.findMany({
      where: {
        updatedAt: { gte: since },
        overallSignal: { in: ['BUY', 'STRONG_BUY', 'buy', 'strong_buy'] },
        confidenceScore: { gte: 75 },
      },
      orderBy: { confidenceScore: 'desc' },
      take: 20,  // V1186: restored to 20
      select: {
        symbol: true, title: true, summary: true, content: true, price: true, changePercent: true,
        overallSignal: true, confidenceScore: true, sentiment: true, sector: true,
        tradeSetup: true, indicators: true, priceTarget: true, stopLoss: true,
        riskLevel: true, marketCap: true, peRatio: true, volume: true,
      },
    });
    if (stocks.length === 0) return [];

    const events = await Promise.all(
      stocks.map(s => buildPerStockEvent(s, 'strong_signal',
        `سهم ${s.symbol} حصل على إشارة شراء قوية بثقة ${s.confidenceScore}%، مما يجعله مرشحاً للمراقبة.`))
    );
    return events.filter((e): e is RawEvent => e !== null);
  } catch (err: any) {
    console.warn(`[StockDigests V4] getStrongSignalEvents failed: ${err.message?.slice(0, 80)}`);
    return [];
  }
}

// ─── V4 NEW: Volume Spikes — stocks with abnormal trading volume ───
async function getVolumeSpikeEvents(): Promise<RawEvent[]> {
  try {
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
    // Volume > 10M AND price moved > 2% = abnormal activity
    const stocks = await db.stockAnalysis.findMany({
      where: {
        updatedAt: { gte: since },
        volume: { gte: 10_000_000 },
        OR: [
          { changePercent: { gte: 2 } },
          { changePercent: { lte: -2 } },
        ],
      },
      orderBy: { volume: 'desc' },
      take: 20,  // V1186: restored to 20
      select: {
        symbol: true, title: true, summary: true, content: true, price: true, change: true,
        changePercent: true, high: true, low: true, open: true, previousClose: true,
        volume: true, sector: true, sentiment: true, overallSignal: true,
        overallScore: true, confidenceScore: true, technicalScore: true,
        fundamentalScore: true, riskLevel: true, marketCap: true, peRatio: true,
        eps: true, priceTarget: true, stopLoss: true, indicators: true,
        tradeSetup: true, keyMetrics: true,
      },
    });
    if (stocks.length === 0) return [];

    const events = await Promise.all(
      stocks.map(s => buildPerStockEvent(s, 'volume_spike',
        `سهم ${s.symbol} يشهد نشاطاً تداولياً غير اعتيادي بحجم ${s.volume.toLocaleString('en')} سهم.`))
    );
    return events.filter((e): e is RawEvent => e !== null);
  } catch (err: any) {
    console.warn(`[StockDigests V4] getVolumeSpikeEvents failed: ${err.message?.slice(0, 80)}`);
    return [];
  }
}

// ─── V4 NEW: Analyst Picks — stocks with price target significantly above current price ───
async function getAnalystPickEvents(): Promise<RawEvent[]> {
  try {
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
    // Get all stocks with price target in last 12h
    const stocks = await db.stockAnalysis.findMany({
      where: {
        updatedAt: { gte: since },
        priceTarget: { not: null, gt: 0 },
        price: { gt: 0 },
      },
      orderBy: { updatedAt: 'desc' },
      take: 500,
      select: {
        symbol: true, title: true, summary: true, content: true, price: true, change: true,
        changePercent: true, high: true, low: true, open: true, previousClose: true,
        volume: true, sector: true, sentiment: true, overallSignal: true,
        overallScore: true, confidenceScore: true, technicalScore: true,
        fundamentalScore: true, riskLevel: true, marketCap: true, peRatio: true,
        eps: true, priceTarget: true, stopLoss: true, indicators: true,
        tradeSetup: true, keyMetrics: true,
      },
    });

    // Filter: only stocks where price target is >15% above current price
    const picks = stocks.filter(s => {
      if (!s.priceTarget || s.price <= 0) return false;
      const upside = (s.priceTarget - s.price) / s.price;
      return upside >= 0.15; // 15%+ upside
    }).slice(0, 20);

    if (picks.length === 0) return [];

    const events = await Promise.all(
      picks.map(s => {
        const upside = ((s.priceTarget - s.price) / s.price * 100).toFixed(1);
        return buildPerStockEvent(s, 'analyst_pick',
          `سهم ${s.symbol} يحظى بتقديرات إيجابية من المحللين، مع سعر مستهدف يبلغ $${s.priceTarget?.toFixed(2)} (${upside}% فوق السعر الحالي).`);
      })
    );
    return events.filter((e): e is RawEvent => e !== null);
  } catch (err: any) {
    console.warn(`[StockDigests V4] getAnalystPickEvents failed: ${err.message?.slice(0, 80)}`);
    return [];
  }
}

// ─── V4 NEW: Sector Rotation — one event per top/bottom sector ───
async function getSectorRotationEvents(): Promise<RawEvent[]> {
  try {
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const stocks = await db.stockAnalysis.findMany({
      where: { updatedAt: { gte: since }, sector: { not: null } },
      select: { sector: true, changePercent: true, symbol: true, price: true, volume: true },
      take: 500,
    });
    if (stocks.length === 0) return [];

    // V1163: Store full stock data per sector (not just symbols) so we can
    // sort by performance and include prices/changes in rawContent.
    const sectorMap: Record<string, { total: number; count: number; stocks: { symbol: string; changePercent: number; price: number; volume: number }[]; gainers: number; losers: number }> = {};
    for (const s of stocks) {
      if (!s.sector) continue;
      if (!sectorMap[s.sector]) sectorMap[s.sector] = { total: 0, count: 0, stocks: [], gainers: 0, losers: 0 };
      sectorMap[s.sector].total += s.changePercent;
      sectorMap[s.sector].count += 1;
      sectorMap[s.sector].stocks.push({ symbol: s.symbol, changePercent: s.changePercent, price: s.price || 0, volume: s.volume || 0 });
      if (s.changePercent > 0) sectorMap[s.sector].gainers += 1;
      else if (s.changePercent < 0) sectorMap[s.sector].losers += 1;
    }

    const sectors = Object.entries(sectorMap)
      .map(([sector, data]) => ({
        sector,
        avg: data.total / data.count,
        count: data.count,
        // V1163: Sort stocks by changePercent DESC — best performers first
        topStocks: data.stocks.sort((a, b) => b.changePercent - a.changePercent).slice(0, 5),
        gainers: data.gainers,
        losers: data.losers,
      }))
      .sort((a, b) => b.avg - a.avg);
    if (sectors.length === 0) return [];

    const events: RawEvent[] = [];

    // Top 3 sectors (positive rotation)
    for (const s of sectors.slice(0, 3)) {
      const macroCtx = await getMacroEconContext();
      // V1163: Rich rawContent with per-stock data so LLM has real numbers to write about
      let rawContent = `قطاع ${translateSector(s.sector)} يتصدر أداء السوق اليوم.\n\n`;
      rawContent += `متوسط الأداء: ${s.avg.toFixed(2)}%\n`;
      rawContent += `عدد الأسهم: ${s.count}\n`;
      rawContent += `الرابحون: ${s.gainers}، الخاسرون: ${s.losers}\n\n`;
      rawContent += `أفضل 5 أسهم في القطاع:\n`;
      for (const st of s.topStocks) {
        rawContent += `  ${st.symbol}: $${st.price.toFixed(2)} (${st.changePercent >= 0 ? '+' : ''}${st.changePercent.toFixed(2)}%)`;
        if (st.volume > 0) rawContent += `، حجم التداول: ${st.volume.toLocaleString('en')}`;
        rawContent += `\n`;
      }
      rawContent += `\n`;
      if (macroCtx) rawContent += `—— أحداث اقتصادية كلية قادمة ——\n${macroCtx}`;

      events.push({
        sourceId: 'DB',
        externalId: `sector-top-${s.sector.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}-${new Date().getHours()}`,
        sourceName: 'تحليلات الأسهم الداخلية (رؤى)',
        url: '',
        eventType: 'data_release',
        title: `قطاع ${translateSector(s.sector)} يتصدر السوق بارتفاع متوسط ${s.avg.toFixed(2)}%`,
        rawContent,
        category: 'stocks',
        locale: 'ar',
        publishedAtSource: new Date(),
      });
    }

    // Bottom 3 sectors (negative rotation)
    // V1172: Skip sectors where ALL stocks are gainers — calling it "bottom" when
    // zero stocks lost is misleading. Only generate bottom sector event if there
    // are actual losers in the sector.
    for (const s of sectors.slice(-3).reverse()) {
      // V1172: Skip if no losers — this sector isn't actually "bottom"
      if (s.losers === 0 && s.avg >= 0) {
        console.log(`[StockDigests V1172] Skipping bottom sector ${s.sector} — 0 losers, avg=${s.avg.toFixed(2)}%`);
        continue;
      }
      // V1172: Skip if only 1 stock — can't write a sector article from 1 stock
      if (s.count < 3) {
        console.log(`[StockDigests V1172] Skipping bottom sector ${s.sector} — only ${s.count} stocks`);
        continue;
      }

      const macroCtx = await getMacroEconContext();
      let rawContent = `قطاع ${translateSector(s.sector)} يتراجع اليوم.\n\n`;
      rawContent += `متوسط الأداء: ${s.avg.toFixed(2)}%\n`;
      rawContent += `عدد الأسهم: ${s.count}\n`;
      rawContent += `الرابحون: ${s.gainers}، الخاسرون: ${s.losers}\n\n`;
      rawContent += `أسوأ 5 أسهم في القطاع:\n`;
      // For bottom sectors, show worst performers (ascending order)
      const worstStocks = [...s.topStocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
      for (const st of worstStocks) {
        rawContent += `  ${st.symbol}: $${st.price.toFixed(2)} (${st.changePercent >= 0 ? '+' : ''}${st.changePercent.toFixed(2)}%)`;
        if (st.volume > 0) rawContent += `، حجم التداول: ${st.volume.toLocaleString('en')}`;
        rawContent += `\n`;
      }
      rawContent += `\n`;
      if (macroCtx) rawContent += `—— أحداث اقتصادية كلية قادمة ——\n${macroCtx}`;

      events.push({
        sourceId: 'DB',
        externalId: `sector-bottom-${s.sector.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}-${new Date().getHours()}`,
        sourceName: 'تحليلات الأسهم الداخلية (رؤى)',
        url: '',
        eventType: 'data_release',
        title: `قطاع ${translateSector(s.sector)} يتراجع بنسبة ${s.avg.toFixed(2)}%`,
        rawContent,
        category: 'stocks',
        locale: 'ar',
        publishedAtSource: new Date(),
      });
    }

    return events;
  } catch (err: any) {
    console.warn(`[StockDigests V4] getSectorRotationEvents failed: ${err.message?.slice(0, 80)}`);
    return [];
  }
}

// ─── V1186 NEW: All Stocks Coverage — produce events for ALL tracked stocks ───
// V4 only covered stocks with >5% movement or strong signals.
// V1186 adds coverage for ALL 74 stocks, even moderate movers.
// This ensures every tracked stock gets at least one news article per cycle.
async function getAllStockEvents(): Promise<RawEvent[]> {
  try {
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const stocks = await db.stockAnalysis.findMany({
      where: {
        updatedAt: { gte: since },
        // Only exclude stocks already covered by gainers/losers (>5% or <-5%)
        // These are moderate movers (-5% to +5%) that still have analysis data
        changePercent: { gt: -5, lt: 5 },
        // Only stocks with actual analysis content
        overallScore: { gt: 0 },
      },
      orderBy: { volume: 'desc' }, // Prioritize by volume
      take: 50, // Up to 50 moderate movers
      select: {
        symbol: true, title: true, summary: true, content: true, price: true, change: true,
        changePercent: true, high: true, low: true, open: true, previousClose: true,
        volume: true, sector: true, sentiment: true, overallSignal: true,
        overallScore: true, confidenceScore: true, technicalScore: true,
        fundamentalScore: true, riskLevel: true, marketCap: true, peRatio: true,
        eps: true, priceTarget: true, stopLoss: true, indicators: true,
        tradeSetup: true, keyMetrics: true,
      },
    });
    if (stocks.length === 0) return [];

    const events = await Promise.all(
      stocks.map(s => buildPerStockEvent(s, 'market_update',
        `تحليل سهم ${s.symbol}: الإشارة ${s.overallSignal}، النتيجة ${s.overallScore}/100، التغير ${s.changePercent?.toFixed(2)}%.`))
    );
    return events.filter((e): e is RawEvent => e !== null);
  } catch (err: any) {
    console.warn(`[StockDigests V4] getAllStockEvents failed: ${err.message?.slice(0, 80)}`);
    return [];
  }
}

// ─── V1186 NEW: Oversold/Overbought stocks — RSI-based events ───
async function getRSIExtremeEvents(): Promise<RawEvent[]> {
  try {
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const stocks = await db.stockAnalysis.findMany({
      where: {
        updatedAt: { gte: since },
      },
      orderBy: { updatedAt: 'desc' },
      take: 500,
      select: {
        symbol: true, title: true, summary: true, content: true, price: true, change: true,
        changePercent: true, high: true, low: true, open: true, previousClose: true,
        volume: true, sector: true, sentiment: true, overallSignal: true,
        overallScore: true, confidenceScore: true, technicalScore: true,
        fundamentalScore: true, riskLevel: true, marketCap: true, peRatio: true,
        eps: true, priceTarget: true, stopLoss: true, indicators: true,
        tradeSetup: true, keyMetrics: true,
      },
    });

    // Filter for RSI extremes from indicators JSON
    const rsiEvents: RawEvent[] = [];
    for (const s of stocks) {
      if (!s.indicators) continue;
      try {
        const ind = typeof s.indicators === 'string' ? JSON.parse(s.indicators) : s.indicators;
        const rsi = ind?.rsi;
        if (!rsi || typeof rsi !== 'number') continue;

        if (rsi < 30) {
          // Oversold
          const ev = await buildPerStockEvent(s, 'oversold',
            `سهم ${s.symbol} في منطقة تشبع بيعي (RSI=${rsi.toFixed(1)})، مما قد يشير لفرصة ارتداد.`);
          if (ev) rsiEvents.push(ev);
        } else if (rsi > 70) {
          // Overbought
          const ev = await buildPerStockEvent(s, 'overbought',
            `سهم ${s.symbol} في منطقة تشبع شرائي (RSI=${rsi.toFixed(1)})، مما قد يشير لاحتمال تصحيح.`);
          if (ev) rsiEvents.push(ev);
        }
      } catch {}
    }
    return rsiEvents.slice(0, 20); // Max 20 RSI events
  } catch (err: any) {
    console.warn(`[StockDigests V4] getRSIExtremeEvents failed: ${err.message?.slice(0, 80)}`);
    return [];
  }
}

// ─── V4 MAIN EXPORT ──────────────────────────────────────────
export async function collectStockDigests(): Promise<RawEvent[]> {
  console.log('[StockDigests V4] Collecting per-stock events...');
  const startMs = Date.now();

  const results = await Promise.allSettled([
    getTopGainerEvents(),        // up to 30 events
    getTopLoserEvents(),         // up to 30 events
    getStrongSignalEvents(),     // up to 20 events
    getVolumeSpikeEvents(),      // up to 20 events
    getAnalystPickEvents(),      // up to 20 events
    getSectorRotationEvents(),   // up to 6 events
    getAllStockEvents(),         // up to 50 events (V1186 NEW)
    getRSIExtremeEvents(),       // up to 20 events (V1186 NEW)
  ]);

  const allEvents: RawEvent[] = [];
  const counts: number[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allEvents.push(...result.value);
      counts.push(result.value.length);
    } else {
      counts.push(0);
      console.warn(`[StockDigests V4] Sub-collector rejected: ${result.reason?.message?.slice(0, 80)}`);
    }
  }

  // Deduplicate by externalId (in case same stock appears in multiple categories)
  const seen = new Set<string>();
  const unique: RawEvent[] = [];
  for (const ev of allEvents) {
    if (seen.has(ev.externalId)) continue;
    seen.add(ev.externalId);
    unique.push(ev);
  }

  // V1199: ALSO deduplicate by STOCK SYMBOL — one event per stock per cycle.
  // The old code generated up to 7 events for the same stock (top_gainer,
  // top_loser, strong_signal, volume_spike, analyst_pick, all_stock, rsi).
  // This caused:
  //   - 87 events/cycle but only 15-20 unique stocks
  //   - Same stock news published 3-5 times → dedup rejection
  //   - Wasted LLM calls on duplicate content
  // Now: keep only the FIRST event for each stock symbol (priority by event type).
  const seenSymbols = new Set<string>();
  const perStockUnique: RawEvent[] = [];
  for (const ev of unique) {
    // Extract symbol from externalId (format: stock-{SYMBOL}-{eventType}-...)
    const m = ev.externalId.match(/^stock-([A-Z.]+)-/);
    if (m) {
      const symbol = m[1];
      if (seenSymbols.has(symbol)) continue;
      seenSymbols.add(symbol);
    }
    perStockUnique.push(ev);
  }

  const durationMs = Date.now() - startMs;
  console.log(`[StockDigests V4] ✓ Collected ${perStockUnique.length} per-stock events (was ${unique.length} before symbol-dedup, gainers=${counts[0]}, losers=${counts[1]}, signals=${counts[2]}, volume=${counts[3]}, picks=${counts[4]}, sectors=${counts[5]}, all=${counts[6]}, rsi=${counts[7]}) in ${durationMs}ms`);

  return perStockUnique;
}
