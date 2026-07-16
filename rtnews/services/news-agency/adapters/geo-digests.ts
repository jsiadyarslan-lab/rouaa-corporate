// ═══════════════════════════════════════════════════════════════
// Geo Digests V3 — Rich risk context with affected assets + markets
// ═══════════════════════════════════════════════════════════════
// For each top geopolitical risk:
//   - Risk details (score, category, scenarios, trade routes)
//   - Affected assets (parsed)
//   - Current market prices of those affected assets
//   - Related commodity/FX movements
//   - Interpretation hints
// ═══════════════════════════════════════════════════════════════

import type { RawEvent } from '../lib/types';
import { db } from '@/lib/db';

function buildGeoContext(r: any): string {
  const lines: string[] = [];
  lines.push(`العنوان: ${r.title}`);
  if (r.summary) lines.push(`الملخص: ${r.summary.slice(0, 400)}`);
  if (r.content) lines.push(`المحتوى: ${r.content.slice(0, 600)}`);
  lines.push(`الفئة: ${r.riskCategory}`);
  lines.push(`مستوى الخطر: ${r.riskScore}/100 (${r.riskLevel})`);
  if (r.aiGprScore) lines.push(`مؤشر AI-GPR: ${r.aiGprScore.toFixed(1)}`);
  if (r.acledEventCount > 0) lines.push(`عدد الأحداث: ${r.acledEventCount}`);
  if (r.acledFatalityCount > 0) lines.push(`عدد الضحايا: ${r.acledFatalityCount}`);
  if (r.worldBankStability) lines.push(`مؤشر الاستقرار (البنك الدولي): ${r.worldBankStability.toFixed(1)}`);
  if (r.gdeltTone !== null && r.gdeltTone !== undefined) lines.push(`نبرة GDELT: ${r.gdeltTone.toFixed(1)}`);

  if (r.affectedAssets) {
    try {
      const assets = typeof r.affectedAssets === 'string' ? JSON.parse(r.affectedAssets) : r.affectedAssets;
      if (Array.isArray(assets) && assets.length > 0) {
        const assetList = assets.slice(0, 8).map((a: any) =>
          `${a.symbol || a.name}: ${a.impact || ''} (${a.direction || ''})${a.reason ? ` — ${a.reason}` : ''}`
        ).join('\n  • ');
        lines.push(`الأصول المتأثرة:\n  • ${assetList}`);
      }
    } catch {}
  }

  if (r.affectedCountries) {
    try {
      const countries = typeof r.affectedCountries === 'string' ? JSON.parse(r.affectedCountries) : r.affectedCountries;
      if (Array.isArray(countries) && countries.length > 0) {
        const countryList = countries.slice(0, 5).map((c: any) => `${c.name || c.code}: ${c.score || '?'}/100`).join('، ');
        lines.push(`الدول المتأثرة: ${countryList}`);
      }
    } catch {}
  }

  if (r.scenarios) {
    try {
      const scen = typeof r.scenarios === 'string' ? JSON.parse(r.scenarios) : r.scenarios;
      if (scen && typeof scen === 'object') {
        const scenLines: string[] = [];
        if (scen.base) scenLines.push(`السيناريو الأساسي: ${typeof scen.base === 'string' ? scen.base : JSON.stringify(scen.base).slice(0, 250)}`);
        if (scen.adverse) scenLines.push(`السيناريو المعاكس: ${typeof scen.adverse === 'string' ? scen.adverse : JSON.stringify(scen.adverse).slice(0, 250)}`);
        if (scen.severe) scenLines.push(`السيناريو الحاد: ${typeof scen.severe === 'string' ? scen.severe : JSON.stringify(scen.severe).slice(0, 250)}`);
        if (scenLines.length > 0) lines.push(`السيناريوهات:\n${scenLines.join('\n')}`);
      }
    } catch {}
  }

  if (r.tradeRoutes) {
    try {
      const routes = typeof r.tradeRoutes === 'string' ? JSON.parse(r.tradeRoutes) : r.tradeRoutes;
      if (Array.isArray(routes) && routes.length > 0) {
        const routeList = routes.slice(0, 4).map((rt: any) => `${rt.name}: ${rt.status || ''}${rt.disruptionRisk ? ` (خطر: ${rt.disruptionRisk})` : ''}`).join('، ');
        lines.push(`طرق التجارة: ${routeList}`);
      }
    } catch {}
  }

  return lines.join('\n');
}

/**
 * Fetch current market prices for commodities/indices that are
 * typically affected by geopolitical risks.
 */
async function getMarketsContextForGeo(): Promise<string> {
  try {
    const symbols = ['OIL', 'WTI', 'BRENT', 'GOLD', 'XAU', 'DXY', 'VIX', 'BTC'];
    // V1208: Only use market data updated in last 6 hours — prevents stale data
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const markets = await db.marketIndicator.findMany({
      where: {
        updatedAt: { gte: sixHoursAgo },
        OR: [
          { symbol: { in: symbols } },
          { category: 'commodity', name: { contains: 'oil' } },
          { category: 'commodity', name: { contains: 'Oil' } },
          { category: 'commodity', name: { contains: 'gold' } },
          { category: 'commodity', name: { contains: 'Gold' } },
        ],
      },
      orderBy: { changePercent: 'desc' },
      take: 6,
      select: { symbol: true, name: true, nameAr: true, value: true, changePercent: true, category: true, updatedAt: true },
    });
    if (markets.length === 0) return '';
    const lines = markets.map(m => {
      const nm = m.nameAr || m.name || m.symbol;
      const chg = m.changePercent >= 0 ? '+' : '';
      return `• ${nm}: ${chg}${m.changePercent.toFixed(2)}% (${m.value.toFixed(2)})`;
    });
    return lines.join('\n');
  } catch {
    return '';
  }
}

async function getTopRisks(): Promise<RawEvent[]> {
  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const risks = await db.geopoliticalRisk.findMany({
      where: { riskScore: { gte: 60 }, createdAt: { gte: since } },
      orderBy: { riskScore: 'desc' },
      take: 5,
      select: {
        id: true, title: true, summary: true, content: true,
        riskScore: true, riskLevel: true, riskCategory: true,
        affectedAssets: true, affectedCountries: true, affectedRegions: true,
        scenarios: true, tradeRoutes: true,
        aiGprScore: true, acledEventCount: true, acledFatalityCount: true,
        worldBankStability: true, gdeltTone: true, createdAt: true,
      },
    });
    if (risks.length === 0) return [];

    const marketsCtx = await getMarketsContextForGeo();

    // V1199: Generate ONE event PER risk (was 1 event with all 5 risks combined).
    // The old approach sent 5 risks in one LLM call, causing:
    //   - Repetitive content (LLM repeated "تحليل المخاطر" 5 times)
    //   - Sections too similar (all 5 risks share structure)
    //   - 66.7% failure rate for this source
    // Now: each risk gets its own event → cleaner, more focused articles.
    const events: RawEvent[] = [];
    for (let i = 0; i < risks.length; i++) {
      const r = risks[i];
      const riskData = buildGeoContext(r);
      let rawContent = `الخطر الجيوسياسي #${i + 1}: ${r.title}\n\n${riskData}`;
      if (marketsCtx) {
        rawContent += `\n\n—— الأسواق المرتبطة (السلع والمؤشرات) ——\n${marketsCtx}`;
      }

      events.push({
        sourceId: 'DB',
        externalId: `geo-risk-${r.id}-${new Date().toISOString().split('T')[0]}-${new Date().getHours()}`,
        sourceName: 'تحليلات المخاطر الجيوسياسية (رؤى)',
        url: '',
        eventType: 'data_release',
        title: `تحليل المخاطر الجيوسياسية: ${r.title.slice(0, 60)}`,
        rawContent,
        category: 'economy',
        locale: 'ar',
        publishedAtSource: new Date(),
      });
    }

    return events;
  } catch (err: any) { return []; }
}

export async function collectGeoDigests(): Promise<RawEvent[]> {
  console.log('[GeoDigests] Collecting rich geo digests V3...');
  const results = await Promise.allSettled([getTopRisks()]);
  const allEvents: RawEvent[] = [];
  for (const result of results) { if (result.status === 'fulfilled') allEvents.push(...result.value); }
  console.log(`[GeoDigests] ✓ Collected ${allEvents.length} rich geo events`);
  return allEvents;
}
