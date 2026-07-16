// ═══════════════════════════════════════════════════════════════
// Unified Content Feed — Shared across ALL locales (V1219h)
// ═══════════════════════════════════════════════════════════════
// Merges all content types into one feed sorted by publishedAt:
//   - NewsItem (news)
//   - EconomicReport (strategic reports)
//   - MarketAnalysis (technical analyses - local)
//   - GeopoliticalRisk (geopolitical risks)
//
// Each item has:
//   - kind: 'news' | 'strategic_report' | 'market_analysis' | 'geopolitical_risk'
//   - source: locale-aware ('محرر رؤى الذكي' / 'Rouaa Smart Editor' / etc.)
//   - sourceName: same as source
//   - href: link to detail page (locale-prefixed)
//   - badge: display label per content type (locale-aware)
//   - isOfficialSource: true for content produced by Rouaa
//
// Used by: page.tsx (ar), en/page.tsx, fr/page.tsx, tr/page.tsx, es/page.tsx
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';

// V1219h: Locale-aware source name mapping
const SOURCE_NAMES: Record<string, string> = {
  ar: 'محرر رؤى الذكي',
  en: 'Rouaa Smart Editor',
  fr: 'Rédacteur Intelligent Rouaa',
  tr: 'Rouaa Akıllı Editör',
  es: 'Editor Inteligente Rouaa',
};

// V1219h: Locale-aware badges per content kind
const BADGES: Record<string, Record<string, string>> = {
  ar: {
    news: 'خبر',
    strategic_report: 'تقرير استراتيجي',
    market_analysis: 'تحليل فني',
    geopolitical_risk: 'مخاطر جيوسياسية',
  },
  en: {
    news: 'News',
    strategic_report: 'Strategic Report',
    market_analysis: 'Technical Analysis',
    geopolitical_risk: 'Geopolitical Risk',
  },
  fr: {
    news: 'Actualité',
    strategic_report: 'Rapport Stratégique',
    market_analysis: 'Analyse Technique',
    geopolitical_risk: 'Risque Géopolitique',
  },
  tr: {
    news: 'Haber',
    strategic_report: 'Stratejik Rapor',
    market_analysis: 'Teknik Analiz',
    geopolitical_risk: 'Jeopolitik Risk',
  },
  es: {
    news: 'Noticia',
    strategic_report: 'Informe Estratégico',
    market_analysis: 'Análisis Técnico',
    geopolitical_risk: 'Riesgo Geopolítico',
  },
};

// V1219h: Risk category translations per locale
const RISK_CATEGORIES: Record<string, Record<string, string>> = {
  ar: {
    conflict: 'نزاعات', trade: 'تجارة', energy: 'طاقة',
    political: 'سياسي', cyber: 'أمن سيبراني', sanctions: 'عقوبات', climate: 'مناخ',
  },
  en: {
    conflict: 'Conflicts', trade: 'Trade', energy: 'Energy',
    political: 'Political', cyber: 'Cybersecurity', sanctions: 'Sanctions', climate: 'Climate',
  },
  fr: {
    conflict: 'Conflits', trade: 'Commerce', energy: 'Énergie',
    political: 'Politique', cyber: 'Cybersécurité', sanctions: 'Sanctions', climate: 'Climat',
  },
  tr: {
    conflict: 'Çatışmalar', trade: 'Ticaret', energy: 'Enerji',
    political: 'Siyasi', cyber: 'Siber Güvenlik', sanctions: 'Yaptırımlar', climate: 'İklim',
  },
  es: {
    conflict: 'Conflictos', trade: 'Comercio', energy: 'Energía',
    political: 'Político', cyber: 'Ciberseguridad', sanctions: 'Sanciones', climate: 'Clima',
  },
};

const RISK_LEVEL_MAP: Record<string, string> = {
  low: 'low', moderate: 'medium', elevated: 'medium', high: 'high', severe: 'high',
};

// V1219h: Arabic detection regex (for filtering Arabic content out of non-Arabic locales)
const ARABIC_REGEX = /[\u0600-\u06FF]/;

function getHref(kind: string, slug: string, locale: string, symbol?: string): string {
  const prefix = locale === 'ar' ? '' : `/${locale}`;
  if (!slug) return '#';
  switch (kind) {
    case 'news': return `${prefix}/news/${slug}`;
    case 'strategic_report': return `${prefix}/strategic-reports/${slug}`;
    case 'market_analysis': return `${prefix}/reports/${slug}`;
    case 'geopolitical_risk': return `${prefix}/geopolitical-risks/${slug}`;
    default: return '#';
  }
}

export interface FeedItem {
  id: string;
  kind: 'news' | 'strategic_report' | 'market_analysis' | 'geopolitical_risk';
  slug: string;
  newsType?: string;
  title: string;
  titleAr?: string;
  summary: string;
  summaryAr?: string;
  category: string;
  sentiment: string;
  sentimentScore: number;
  impactLevel: string;
  impactScore: number;
  source: string;
  sourceName: string;
  url: string;
  href: string;
  badge: string;
  imageUrl: string;
  time: string;
  publishedAt: string;
  isOfficialSource: boolean;
  symbol?: string;
}

/**
 * V1219h: Unified content feed — locale-aware, merges all content types.
 * Used by ALL locale homepages (ar, en, fr, tr, es).
 *
 * @param locale - 'ar' | 'en' | 'fr' | 'tr' | 'es'
 * @param limit - max items to return (default 12)
 * @returns sorted array of FeedItem
 */
export async function getInitialContentFeed(locale: string = 'ar', limit: number = 12): Promise<FeedItem[]> {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return [];

    const sourceName = SOURCE_NAMES[locale] || SOURCE_NAMES.ar;
    const badges = BADGES[locale] || BADGES.ar;
    const riskCategories = RISK_CATEGORIES[locale] || RISK_CATEGORIES.ar;
    const items: any[] = [];

    // ── 1. News (live + breaking) ────────────────────────────
    try {
      const news = await db.newsItem.findMany({
        where: {
          locale,
          isReady: true,
          isPublished: true,
          newsType: { in: ['live', 'breaking'] },
          slug: { not: '' },
          ...(locale === 'ar' ? { titleAr: { not: '' } } : { title: { not: '' } }),
        },
        orderBy: { fetchedAt: 'desc' },
        take: limit,
        select: {
          id: true, slug: true, newsType: true,
          title: true, titleAr: true,
          summary: true, summaryAr: true,
          category: true, categoryId: true,
          source: true, sourceName: true,
          sentiment: true, sentimentScore: true,
          impactLevel: true, impactScore: true,
          url: true, fetchedAt: true,
        },
      });

      for (const n of news) {
        // For non-Arabic locales, filter out Arabic titles
        if (locale !== 'ar' && ARABIC_REGEX.test(n.title || '')) continue;
        // For Arabic locale, filter out non-Arabic titles
        if (locale === 'ar' && !ARABIC_REGEX.test(n.titleAr || '')) continue;

        const itemSource = n.sourceName || n.source || sourceName;
        const isOfficial = itemSource === sourceName ||
                           itemSource === 'محرر رؤى الذكي' ||
                           itemSource === 'Rouaa Smart Editor';

        items.push({
          id: n.id,
          kind: 'news',
          slug: n.slug || '',
          newsType: n.newsType || 'live',
          title: locale === 'ar' ? (n.titleAr || n.title || '') : (n.title || ''),
          titleAr: n.titleAr || undefined,
          summary: locale === 'ar' ? (n.summaryAr || n.summary || '') : (n.summary || ''),
          summaryAr: n.summaryAr || undefined,
          category: n.category || (locale === 'ar' ? 'اقتصاد كلي' : 'Macro'),
          sentiment: n.sentiment || 'neutral',
          sentimentScore: n.sentimentScore || 55,
          impactLevel: n.impactLevel || 'low',
          impactScore: n.impactScore || 0,
          source: itemSource,
          sourceName: itemSource,
          url: n.url || '',
          href: getHref('news', n.slug || '', locale),
          badge: badges.news,
          imageUrl: `/api/article-image/${n.id}`,
          time: n.fetchedAt?.toISOString() || new Date().toISOString(),
          publishedAt: n.fetchedAt?.toISOString() || new Date().toISOString(),
          isOfficialSource: isOfficial,
        });
      }
    } catch (e: any) {
      console.error(`[ContentFeed:${locale}] news error:`, e?.message?.slice(0, 80));
    }

    // ── 2. Strategic reports (EconomicReport with reportType='strategic') ─
    try {
      const reports = await db.economicReport.findMany({
        where: { locale, isPublished: true, reportType: 'strategic' },
        orderBy: { publishedAt: 'desc' },
        take: Math.ceil(limit / 3),
        select: {
          id: true, slug: true, title: true, summary: true,
          source: true, sourceName: true,
          marketImpact: true, confidenceScore: true,
          imageUrl: true, publishedAt: true, createdAt: true,
        },
      });

      for (const r of reports) {
        const itemSource = r.sourceName || r.source || sourceName;
        items.push({
          id: r.id,
          kind: 'strategic_report',
          slug: r.slug,
          title: r.title,
          titleAr: r.title,
          summary: r.summary || '',
          summaryAr: r.summary || '',
          category: badges.strategic_report,
          sentiment: r.marketImpact || 'neutral',
          sentimentScore: r.confidenceScore || 50,
          impactLevel: (r.confidenceScore || 50) > 75 ? 'high' : (r.confidenceScore || 50) > 50 ? 'medium' : 'low',
          impactScore: r.confidenceScore || 50,
          source: itemSource,
          sourceName: itemSource,
          url: '',
          href: getHref('strategic_report', r.slug, locale),
          badge: badges.strategic_report,
          imageUrl: r.imageUrl || `/api/article-image/${r.id}`,
          time: (r.publishedAt || r.createdAt)?.toISOString() || new Date().toISOString(),
          publishedAt: (r.publishedAt || r.createdAt)?.toISOString() || new Date().toISOString(),
          isOfficialSource: true,
        });
      }
    } catch (e: any) {
      console.error(`[ContentFeed:${locale}] strategic error:`, e?.message?.slice(0, 80));
    }

    // ── 3. Market analyses (technical) ───────────────────────
    try {
      const analyses = await db.marketAnalysis.findMany({
        where: { locale, isPublished: true, analysisType: 'technical' },
        orderBy: { publishedAt: 'desc' },
        take: Math.ceil(limit / 3),
        select: {
          id: true, slug: true, title: true,
          assetClass: true, timeFrame: true,
          source: true, sourceName: true,
          riskLevel: true, sentiment: true, confidenceScore: true,
          imageUrl: true, publishedAt: true, createdAt: true,
        },
      });

      for (const a of analyses) {
        const itemSource = a.sourceName || a.source || sourceName;
        const contextLabel = locale === 'ar'
          ? `تحليل فني ${a.assetClass} - إطار ${a.timeFrame}`
          : `${a.assetClass} analysis - ${a.timeFrame}`;
        items.push({
          id: a.id,
          kind: 'market_analysis',
          slug: a.slug,
          title: a.title,
          titleAr: a.title,
          summary: contextLabel,
          summaryAr: contextLabel,
          category: badges.market_analysis,
          sentiment: a.sentiment || 'neutral',
          sentimentScore: a.confidenceScore || 50,
          impactLevel: a.riskLevel || 'medium',
          impactScore: a.confidenceScore || 50,
          source: itemSource,
          sourceName: itemSource,
          url: '',
          href: getHref('market_analysis', a.slug, locale),
          badge: badges.market_analysis,
          imageUrl: a.imageUrl || `/api/article-image/${a.id}`,
          time: (a.publishedAt || a.createdAt)?.toISOString() || new Date().toISOString(),
          publishedAt: (a.publishedAt || a.createdAt)?.toISOString() || new Date().toISOString(),
          isOfficialSource: true,
        });
      }
    } catch (e: any) {
      console.error(`[ContentFeed:${locale}] analysis error:`, e?.message?.slice(0, 80));
    }

    // ── 4. Geopolitical risks ────────────────────────────────
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

      for (const g of geoRisks) {
        items.push({
          id: g.id,
          kind: 'geopolitical_risk',
          slug: g.slug,
          title: g.title,
          titleAr: g.title,
          summary: g.summary || `${badges.geopolitical_risk} - ${riskCategories[g.riskCategory] || g.riskCategory}`,
          summaryAr: g.summary || `${badges.geopolitical_risk} - ${riskCategories[g.riskCategory] || g.riskCategory}`,
          category: riskCategories[g.riskCategory] || badges.geopolitical_risk,
          sentiment: 'negative',
          sentimentScore: g.riskScore || 50,
          impactLevel: RISK_LEVEL_MAP[g.riskLevel] || 'medium',
          impactScore: g.riskScore || 50,
          source: sourceName,
          sourceName: sourceName,
          url: '',
          href: getHref('geopolitical_risk', g.slug, locale),
          badge: badges.geopolitical_risk,
          imageUrl: g.imageUrl || `/api/article-image/${g.id}`,
          time: (g.publishedAt || g.createdAt)?.toISOString() || new Date().toISOString(),
          publishedAt: (g.publishedAt || g.createdAt)?.toISOString() || new Date().toISOString(),
          isOfficialSource: true,
        });
      }
    } catch (e: any) {
      console.error(`[ContentFeed:${locale}] geopolitical error:`, e?.message?.slice(0, 80));
    }

    // ── Sort all by publishedAt desc ─────────────────────────
    items.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

    return items.slice(0, limit);
  } catch (err: any) {
    console.error(`[ContentFeed:${locale}] fatal error:`, err.message);
    return [];
  }
}
