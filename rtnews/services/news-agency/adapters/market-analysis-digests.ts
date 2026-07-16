// ═══════════════════════════════════════════════════════════════
// Market Analysis Digests — V1186
// ═══════════════════════════════════════════════════════════════
// يستهلك تحليلات السوق من market_analyses table (731+ تحديث يومي)
// ينتج أحداثاً لكل رمز/نوع تحليل → أخبار عن فوركس، كريبتو، مؤشرات، سلع
//
// المصدر: market_analyses table (تُحدّث من stock-analysis-pipeline)
// الهدف: 50-100 حدث لكل دورة
// ═══════════════════════════════════════════════════════════════

import type { RawEvent } from '../lib/types';
import { db } from '@/lib/db';

const CATEGORY_MAP: Record<string, 'forex' | 'crypto' | 'commodities' | 'stocks' | 'economy'> = {
  'forex': 'forex',
  'crypto': 'crypto',
  'commodity': 'commodities',
  'commodities': 'commodities',
  'index': 'stocks',
  'indices': 'stocks',
  'stock': 'stocks',
  'stocks': 'stocks',
};

function buildMarketContext(m: any): string {
  const lines: string[] = [];
  lines.push(`الرمز: ${m.symbol}`);
  lines.push(`النوع: ${m.type || 'سوق'}`);
  if (m.overallSignal) lines.push(`الإشارة الإجمالية: ${m.overallSignal}`);
  if (m.overallScore !== null) lines.push(`النتيجة الإجمالية: ${m.overallScore}/100`);
  if (m.confidenceScore !== null) lines.push(`مستوى الثقة: ${m.confidenceScore}/100`);
  if (m.sentiment) lines.push(`المشاعر: ${m.sentiment}`);
  if (m.price !== null) lines.push(`السعر الحالي: ${m.price}`);
  if (m.changePercent !== null) lines.push(`نسبة التغير: ${m.changePercent}%`);
  if (m.sectors) {
    try {
      const sectors = typeof m.sectors === 'string' ? JSON.parse(m.sectors) : m.sectors;
      if (Array.isArray(sectors) && sectors.length > 0) {
        lines.push(`القطاعات: ${sectors.slice(0, 5).join('، ')}`);
      }
    } catch {}
  }
  if (m.content && m.content.length > 50) {
    // Include the full analysis content for the LLM to re-write as news
    lines.push(`\n[التحليل الفني الكامل]\n${m.content.substring(0, 2000)}`);
  }
  return lines.join('\n');
}

/**
 * Collect market analysis events from DB.
 * Targets: forex pairs, crypto pairs, commodities, indices with recent updates.
 */
export async function collectMarketAnalysisDigests(): Promise<RawEvent[]> {
  console.log('[MarketAnalysisDigests] Collecting market analysis events...');
  const startMs = Date.now();

  try {
    // Get market analyses updated in the last 6 hours, grouped by symbol
    const analyses = await db.marketAnalysis.findMany({
      where: {
        updatedAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      distinct: ['symbol'],
    });

    const events: RawEvent[] = [];
    const seen = new Set<string>();

    for (const m of analyses) {
      const symbol = m.symbol || '';
      if (!symbol || seen.has(symbol)) continue;
      seen.add(symbol);

      const category = CATEGORY_MAP[m.type || ''] || 'economy';
      const externalId = `market-${symbol}-${m.updatedAt?.getTime() || Date.now()}`;

      events.push({
        sourceId: 'DB',
        externalId,
        sourceName: 'تحليلات السوق المالية (رؤى)',
        url: `/markets?pair=${encodeURIComponent(symbol)}`,
        eventType: 'data_release',
        title: `${symbol}: ${m.overallSignal || 'تحليل'} (${m.overallScore || '?'}/100)`,
        rawContent: buildMarketContext(m),
        category,
        locale: 'ar',
        publishedAtSource: m.updatedAt || new Date(),
        analysisUrl: `/markets?pair=${encodeURIComponent(symbol)}`,
        analysisContent: m.content || '',
      });
    }

    const durationMs = Date.now() - startMs;
    console.log(`[MarketAnalysisDigests] ✓ Collected ${events.length} market analysis events in ${durationMs}ms`);
    return events;
  } catch (err: any) {
    console.warn(`[MarketAnalysisDigests] Failed: ${err.message?.slice(0, 80)}`);
    return [];
  }
}
