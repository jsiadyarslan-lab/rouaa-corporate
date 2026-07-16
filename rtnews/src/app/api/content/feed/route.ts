// ═══════════════════════════════════════════════════════════════
// Unified Content Feed API V1219
// ═══════════════════════════════════════════════════════════════
// Merges all content types into one feed sorted by publishedAt:
//   - NewsItem (news)
//   - EconomicReport (strategic reports)
//   - MarketAnalysis (technical analyses - local)
//   - StockAnalysis (stock analyses)
//   - External trading-platform analyses (advanced technical)
//
// Each item has:
//   - kind: 'news' | 'strategic_report' | 'market_analysis' | 'stock_analysis' | 'external_analysis'
//   - source: derived from locale if null (ar → 'محرر رؤى الذكي')
//   - sourceName: same as source
//   - href: link to detail page
//   - badge: display label for the content type
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const revalidate = 120;

function getSourceName(locale: string, source?: string | null): string {
  if (source && source.trim()) return source;
  const map: Record<string, string> = {
    ar: 'محرر رؤى الذكي',
    en: 'Rouaa Smart Editor',
    fr: 'Rédacteur Intelligent Rouaa',
    tr: 'Rouaa Akıllı Editör',
    es: 'Editor Inteligente Rouaa',
  };
  return map[locale] || map.ar;
}

function getBadge(kind: string): string {
  const badges: Record<string, string> = {
    news: 'خبر',
    strategic_report: 'تقرير استراتيجي',
    market_analysis: 'تحليل فني',
    stock_analysis: 'تحليل سهم',
    external_analysis: 'تحليل فني متقدم',
    geopolitical_risk: 'مخاطر جيوسياسية',
  };
  return badges[kind] || 'محتوى';
}

function getHref(kind: string, slug: string, symbol?: string): string {
  if (!slug) return '#';
  switch (kind) {
    case 'news': return `/news/${slug}`;
    case 'strategic_report': return `/strategic-reports/${slug}`;
    case 'market_analysis': return `/reports/${slug}`;
    case 'stock_analysis': return symbol ? `/stock-analysis/${symbol}` : `/stock-analysis`;
    case 'external_analysis': return `/technical-analyses`;
    case 'geopolitical_risk': return `/geopolitical-risks/${slug}`;
    default: return '#';
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const locale = url.searchParams.get('locale') || 'ar';
    const kinds = url.searchParams.get('kinds')?.split(',').filter(Boolean) ||
      ['news', 'strategic_report', 'market_analysis', 'external_analysis', 'geopolitical_risk'];

    const items: any[] = [];

    // V1219b: Removed stock_analysis per user request — only:
    // news + strategic_report + market_analysis + external_analysis (advanced technicals)

    if (kinds.includes('news')) {
      try {
        const news = await db.newsItem.findMany({
          where: {
            locale, isReady: true, isPublished: true,
            slug: { not: '' }, titleAr: { not: '' },
            newsType: { in: ['live', 'breaking'] },
          },
          orderBy: { fetchedAt: 'desc' },
          take: limit,
          select: {
            id: true, slug: true, newsType: true,
            title: true, titleAr: true,
            summary: true, summaryAr: true,
            category: true, source: true, url: true,
            sentiment: true, sentimentScore: true,
            impactLevel: true, impactScore: true,
            imageUrl: true, publishedAt: true, fetchedAt: true,
          },
        });
        for (const n of news) {
          const sourceName = getSourceName(locale, n.source);
          items.push({
            id: n.id, kind: 'news', slug: n.slug, newsType: n.newsType,
            title: n.titleAr || n.title,
            summary: n.summaryAr || n.summary,
            category: n.category, source: sourceName, sourceName, url: n.url,
            href: getHref('news', n.slug), badge: getBadge('news'),
            sentiment: n.sentiment, sentimentScore: n.sentimentScore,
            impactLevel: n.impactLevel, impactScore: n.impactScore,
            imageUrl: n.imageUrl || `/api/article-image/${n.id}`,
            publishedAt: n.publishedAt || n.fetchedAt,
            isOfficialSource: n.source === 'محرر رؤى الذكي' || n.source === 'Rouaa Smart Editor',
          });
        }
      } catch (err: any) {
        console.error('[content/feed] News fetch error:', err?.message?.slice(0, 100));
      }
    }

    if (kinds.includes('strategic_report')) {
      try {
        const reports = await db.economicReport.findMany({
          where: { locale, isPublished: true, reportType: 'strategic' },
          orderBy: { publishedAt: 'desc' },
          take: Math.ceil(limit / 3),
          select: {
            id: true, slug: true, title: true, summary: true,
            reportType: true, scope: true, locale: true,
            source: true, sourceName: true,
            marketImpact: true, confidenceScore: true,
            imageUrl: true, publishedAt: true, createdAt: true,
          },
        });
        for (const r of reports) {
          const sourceName = getSourceName(locale, r.sourceName || r.source);
          items.push({
            id: r.id, kind: 'strategic_report', slug: r.slug,
            title: r.title, summary: r.summary,
            category: 'تقارير استراتيجية',
            source: sourceName, sourceName, url: '',
            href: getHref('strategic_report', r.slug), badge: getBadge('strategic_report'),
            sentiment: r.marketImpact, sentimentScore: r.confidenceScore,
            impactLevel: r.confidenceScore > 75 ? 'high' : r.confidenceScore > 50 ? 'medium' : 'low',
            impactScore: r.confidenceScore,
            imageUrl: r.imageUrl || `/api/article-image/${r.id}`,
            publishedAt: r.publishedAt || r.createdAt, isOfficialSource: true,
          });
        }
      } catch (err: any) {
        console.error('[content/feed] Strategic reports fetch error:', err?.message?.slice(0, 100));
      }
    }

    if (kinds.includes('market_analysis')) {
      try {
        const analyses = await db.marketAnalysis.findMany({
          where: { locale, isPublished: true, analysisType: 'technical' },
          orderBy: { publishedAt: 'desc' },
          take: Math.ceil(limit / 3),
          select: {
            id: true, slug: true, title: true,
            assetClass: true, analysisType: true, timeFrame: true, locale: true,
            source: true, sourceName: true,
            riskLevel: true, sentiment: true, confidenceScore: true,
            publishedAt: true, createdAt: true,
          },
        });
        for (const a of analyses) {
          const sourceName = getSourceName(locale, a.sourceName || a.source);
          items.push({
            id: a.id, kind: 'market_analysis', slug: a.slug,
            title: a.title,
            summary: `تحليل فني ${a.assetClass} - إطار ${a.timeFrame}`,
            category: 'تحليلات فنية',
            source: sourceName, sourceName, url: '',
            href: getHref('market_analysis', a.slug), badge: getBadge('market_analysis'),
            sentiment: a.sentiment, sentimentScore: a.confidenceScore,
            impactLevel: a.riskLevel, impactScore: a.confidenceScore,
            imageUrl: `/api/article-image/${a.id}`,
            publishedAt: a.publishedAt || a.createdAt, isOfficialSource: true,
          });
        }
      } catch (err: any) {
        console.error('[content/feed] Market analysis fetch error:', err?.message?.slice(0, 100));
      }
    }

    // V1219b: stock_analysis block removed — user requested only:
    // news + strategic_report + market_analysis + external_analysis (advanced technicals)
    // Stock analyses have their own dedicated /stock-analysis page.

    if (kinds.includes('external_analysis')) {
      try {
        const extUrl = `https://roua-trading-production.up.railway.app/api/analyses?limit=${Math.ceil(limit / 4)}&locale=${locale}`;
        const extRes = await fetch(extUrl, {
          signal: AbortSignal.timeout(5000),
          headers: { 'Accept': 'application/json' },
        });
        if (extRes.ok) {
          const extData = await extRes.json();
          const extItems = extData.articles || extData.analyses || extData.data || [];
          for (const a of extItems) {
            const sourceName = getSourceName(locale, 'Rouaa Trading');
            items.push({
              id: `ext_${a.id || a.slug || Math.random().toString(36).slice(2)}`,
              kind: 'external_analysis',
              slug: a.slug || '',
              title: a.title || a.titleAr || '',
              summary: a.summary || a.summaryAr || '',
              category: 'تحليلات فنية متقدمة',
              source: sourceName, sourceName, url: '',
              href: getHref('external_analysis', a.slug || ''),
              badge: getBadge('external_analysis'),
              sentiment: a.sentiment || 'neutral',
              sentimentScore: a.confidenceScore || 50,
              impactLevel: a.impactLevel || 'medium',
              impactScore: 0,
              imageUrl: a.imageUrl || '',
              publishedAt: a.publishedAt || a.createdAt || new Date().toISOString(),
              isOfficialSource: true,
            });
          }
        }
      } catch (err: any) {
        console.error('[content/feed] External analysis fetch error:', err?.message?.slice(0, 100));
      }
    }

    // ── 6. Fetch GeopoliticalRisk analyses & news ───────────
    if (kinds.includes('geopolitical_risk')) {
      try {
        const geoRisks = await db.geopoliticalRisk.findMany({
          where: { locale, isPublished: true },
          orderBy: { publishedAt: 'desc' },
          take: Math.ceil(limit / 4),
          select: {
            id: true, slug: true, title: true, summary: true,
            riskCategory: true, riskLevel: true, riskScore: true,
            imageUrl: true, publishedAt: true, createdAt: true,
          },
        });
        const riskLevelMap: Record<string, string> = {
          low: 'low', moderate: 'medium', elevated: 'medium', high: 'high', severe: 'high',
        };
        const categoryMap: Record<string, string> = {
          conflict: 'نزاعات', trade: 'تجارة', energy: 'طاقة',
          political: 'سياسي', cyber: 'أمن سيبراني', sanctions: 'عقوبات', climate: 'مناخ',
        };
        for (const g of geoRisks) {
          const sourceName = getSourceName(locale);
          items.push({
            id: g.id, kind: 'geopolitical_risk', slug: g.slug,
            title: g.title,
            summary: g.summary || `تحليل مخاطر ${categoryMap[g.riskCategory] || g.riskCategory}`,
            category: categoryMap[g.riskCategory] || 'مخاطر جيوسياسية',
            source: sourceName, sourceName, url: '',
            href: getHref('geopolitical_risk', g.slug),
            badge: getBadge('geopolitical_risk'),
            sentiment: 'negative',
            sentimentScore: g.riskScore || 50,
            impactLevel: riskLevelMap[g.riskLevel] || 'medium',
            impactScore: g.riskScore || 50,
            imageUrl: g.imageUrl || `/api/article-image/${g.id}`,
            publishedAt: g.publishedAt || g.createdAt,
            isOfficialSource: true,
          });
        }
      } catch (err: any) {
        console.error('[content/feed] Geopolitical risk fetch error:', err?.message?.slice(0, 100));
      }
    }

    items.sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || 0).getTime();
      return dateB - dateA;
    });

    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const offset = (page - 1) * limit;
    const paginated = items.slice(offset, offset + limit);

    return NextResponse.json({
      items: paginated,
      total: items.length,
      page, limit,
      totalPages: Math.ceil(items.length / limit),
      hasMore: offset + limit < items.length,
      locale,
      cached: false,
      source: 'unified_feed',
      lastUpdate: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[content/feed] FATAL:', error?.message?.slice(0, 200));
    return NextResponse.json(
      { error: 'Failed to fetch content feed', details: error?.message?.slice(0, 100) },
      { status: 500 }
    );
  }
}
