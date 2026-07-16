// ─── Spanish News Article Detail Page ────────────────────────
// Server Component — fetches a single Spanish article by slug
// Reuses EnNewsArticleClient for rendering (same layout, Spanish content)

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { NEWS_CATEGORIES, getNewsCategoryId } from '@/lib/news-categories';
import {
  IMPACT_CONFIG_ES,
  SENTIMENT_CONFIG_ES,
  getCategoryNameEs,
  translateCategoryToEs,
  translateAffectedAssetsToEs,
  translateAssetReasonToEs,
} from '@/lib/locale';
import EnNewsArticleClient from '@/app/en/news/[slug]/EnNewsArticleClient';

export const revalidate = 300;
// ─── In-memory cache ─────────────────────────────────────────
const articleCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 30_000;

// ─── Deep string conversion helper ──────────────────────────
const deepStr = (val: any): string => {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) {
    return val.map(item => {
      if (typeof item === 'string') return item;
      if (item != null && typeof item === 'object') {
        if (typeof item.text === 'string') return item.text;
        if (typeof item.content === 'string') return item.content;
        try { return JSON.stringify(item); } catch { return ''; }
      }
      return '';
    }).filter(s => s.length > 0).join('\n\n');
  }
  if (typeof val === 'object') {
    if (typeof val.text === 'string') return val.text;
    try { return JSON.stringify(val); } catch { return ''; }
  }
  return String(val);
};

// ─── Language validation helper ──────────────────────────────
function isMostlyArabic(text: string): boolean {
  if (!text || text.length < 20) return false;
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
  const totalAlpha = arabicChars + latinChars;
  if (totalAlpha === 0) return false;
  return arabicChars / totalAlpha > 0.4;
}

function cleanObjectArtifacts(text: string): string {
  if (!text) return text;
  return text.replace(/\[object Object\]/g, '').replace(/\[object\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

function fixDollarSigns(text: string): string {
  if (!text) return text;
  return text.replace(/\$\$/g, '$');
}

// ─── Fetch article ───────────────────────────────────────────
async function fetchArticleBySlug(slug: string): Promise<any | null> {
  if (!slug || slug === 'undefined' || slug === 'null') return null;
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) return null;

  const cached = articleCache.get(slug);
  if (cached && (Date.now() - cached.ts) < CACHE_TTL) return cached.data;

  let article = null;

  // ROOT CAUSE FIX: Use POSITIVE whitelist instead of negative blacklist.
  const newsOnlyFilter: Record<string, any> = {
    locale: 'es',
    isReady: true,
    isPublished: true,
    newsType: { in: ['live', 'breaking'] },
  };

  // Strategy 1: Slug match (Spanish locale)
  article = await db.newsItem.findFirst({
    where: { ...newsOnlyFilter, slug },
  }).catch(() => null);

  // V374→V375: If slug is a stock analysis, redirect to proper page
  // Check without newsType filter to detect stock analysis articles
  if (!article) {
    const stockArticle = await db.newsItem.findFirst({
      where: { locale: 'es', isReady: true, isPublished: true, slug, source: 'stock-analysis-pipeline' },
      select: { id: true, title: true, newsType: true, source: true },
    }).catch(() => null);
    if (stockArticle && (stockArticle.source === 'stock-analysis-pipeline' || stockArticle.newsType === 'stock_analysis')) {
      try {
        const stockAnalysis = await db.stockAnalysis.findFirst({
          where: { symbol: stockArticle.title?.match(/\(([A-Z.]+)\)/)?.[1] || '' },
          select: { symbol: true },
        });
        if (stockAnalysis) {
          redirect(`/es/stock-analysis/${stockAnalysis.symbol}`);
        }
      } catch {}
      // If we can't find the stock analysis record, redirect to stock analysis index
      redirect('/es/stock-analysis');
    }
  }

  // Strategy 2: ID match
  if (!article) {
    article = await db.newsItem.findFirst({
      where: { ...newsOnlyFilter, id: slug },
    }).catch(() => null);
  }

  // Strategy 3: Try decoded slug
  if (!article) {
    try {
      const decoded = decodeURIComponent(slug);
      if (decoded !== slug) {
        article = await db.newsItem.findFirst({
          where: { ...newsOnlyFilter, slug: decoded },
        }).catch(() => null);
      }
    } catch {}
  }

  // Strategy 4: Try English article — redirect to English URL
  if (!article) {
    const enArticle = await db.newsItem.findFirst({
      where: { locale: 'en', isReady: true, isPublished: true, slug },
    }).catch(() => null);
    if (enArticle) {
      redirect(`/en/news/${enArticle.slug || slug}`);
    }
  }

  if (!article) {
    const enArticle = await db.newsItem.findFirst({
      where: { locale: 'en', isReady: true, isPublished: true, id: slug },
    }).catch(() => null);
    if (enArticle) {
      redirect(`/en/news/${enArticle.slug || slug}`);
    }
  }

  articleCache.set(slug, { data: article, ts: Date.now() });
  return article;
}

// ─── Generate metadata ───────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  let { slug } = await params;
  try { if (slug && slug.includes('%')) slug = decodeURIComponent(slug); } catch {}

  if (!slug || slug === 'undefined') {
    return { title: 'Artículo no encontrado — Rouaa', description: 'Noticias financieras con IA' };
  }

  try {
    const article = await fetchArticleBySlug(slug);
    if (!article) return { title: 'Artículo no encontrado — Rouaa' };

    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try {
      const hdrs = await headers();
      const host = hdrs.get('host');
      const proto = hdrs.get('x-forwarded-proto') || 'https';
      if (host) baseUrl = `${proto}://${host}`;
    } catch {}

    const title = article.title;
    const description = (article.summary || '').slice(0, 160);

    return {
      title: `${title} — Rouaa Noticias Financieras`,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/es/news/${slug}`,
        siteName: 'Rouaa',
        locale: 'es_ES',
        type: 'article',
        images: [{ url: article.imageUrl || `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [article.imageUrl || `${baseUrl}/og-image.png`],
      },
      alternates: { canonical: `/es/news/${slug}` },
    };
  } catch {
    return { title: 'Rouaa Noticias Financieras', description: 'Noticias financieras con IA' };
  }
}

// ─── Page Component ──────────────────────────────────────────
export default async function EsNewsSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  let { slug } = await params;
  try { if (slug && slug.includes('%')) slug = decodeURIComponent(slug); } catch {}

  if (!slug || slug === 'undefined' || slug === 'null') notFound();

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dir="ltr">
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#E2E8F0' }}>Cargando artículo...</h1>
          <p style={{ color: '#64748B' }}>El artículo aparecerá una vez que los datos estén disponibles</p>
        </div>
      </div>
    );
  }

  const article = await fetchArticleBySlug(slug);
  if (!article) notFound();

  // Increment views (fire-and-forget)
  db.newsItem.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  }).catch(() => {});

  // Parse AI analysis
  let parsedAnalysis: any = {};
  try { parsedAnalysis = article.aiAnalysis ? JSON.parse(article.aiAnalysis) : {}; } catch {}

  // Extract content and validate language
  let content = cleanObjectArtifacts(deepStr(parsedAnalysis.fullContent));
  let introduction = cleanObjectArtifacts(deepStr(parsedAnalysis.introduction));
  let body = cleanObjectArtifacts(deepStr(parsedAnalysis.body));
  let conclusion = cleanObjectArtifacts(deepStr(parsedAnalysis.conclusion));

  // Discard Arabic content on Spanish pages
  if (isMostlyArabic(content)) { content = ''; }
  if (isMostlyArabic(introduction)) { introduction = ''; }
  if (isMostlyArabic(body)) { body = ''; }
  if (isMostlyArabic(conclusion)) { conclusion = ''; }
  const articleContent = fixDollarSigns(cleanObjectArtifacts(article.content || ''));

  // Key takeaways — filter out Arabic takeaways
  let keyTakeaways: string[] = [];
  try {
    const raw = parsedAnalysis.keyTakeaways || parsedAnalysis.keyPoints;
    if (Array.isArray(raw)) keyTakeaways = raw
      .map((item: any) => fixDollarSigns(cleanObjectArtifacts(typeof item === 'string' ? item : deepStr(item))))
      .filter((s: string) => s.length > 0 && !isMostlyArabic(s) && !/[\u0600-\u06FF]/.test(s));
  } catch {}

  // Affected assets
  let affectedAssets: any[] = [];
  try {
    affectedAssets = translateAffectedAssetsToEs(JSON.parse(article.affectedAssets || '[]'))
      .filter((a: any) => {
        if (typeof a === 'string') return !/[\u0600-\u06FF]/.test(a);
        const nameOk = !/[\u0600-\u06FF]/.test(a.name || a.symbol || '');
        const reasonOk = !/[\u0600-\u06FF]/.test(a.reason || '');
        return nameOk && reasonOk;
      });
  } catch {}

  // Analysis fields
  const analysisSentiment = parsedAnalysis.sentiment || undefined;
  let analysisRecommendation: string | undefined = undefined;
  if (parsedAnalysis.recommendation) {
    const rec = fixDollarSigns(String(parsedAnalysis.recommendation));
    if (!/[\u0600-\u06FF]/.test(rec)) {
      analysisRecommendation = rec;
    }
  }

  const analysisAffectedAssets = Array.isArray(parsedAnalysis.affectedAssets)
    ? translateAffectedAssetsToEs(parsedAnalysis.affectedAssets.map((asset: any) => {
        if (typeof asset === 'string') return { symbol: asset, direction: 'neutral', reason: '' };
        return {
          symbol: String(asset.symbol || asset.name || asset.ticker || ''),
          direction: String(asset.direction || 'neutral'),
          reason: translateAssetReasonToEs(String(asset.reason || '')),
        };
    })).filter((a: any) => {
      if (typeof a === 'string') return !/[\u0600-\u06FF]/.test(a);
      const nameOk = !/[\u0600-\u06FF]/.test(a.symbol || '');
      const reasonOk = !/[\u0600-\u06FF]/.test(a.reason || '');
      return a.symbol.length > 0 && !a.symbol.includes('[object') && nameOk && reasonOk;
    })
    : undefined;

  const allContent = [content, introduction, body, conclusion].filter(Boolean).join(' ');
  const calculatedWordCount = allContent.split(/\s+/).filter(w => w.length > 0).length;

  const hasSourceContent = articleContent.length > 20 && /[a-zA-ZÀ-ÿ]/.test(articleContent) && article.source !== 'رؤى' && article.source !== 'Rouaa' ;

  // Pass serializable data to client component
  const articleData = {
    id: article.id,
    title: fixDollarSigns(String(article.title || '')),
    slug: article.slug || '',
    summary: fixDollarSigns(String(article.summary || '')),
    source: String(article.source || ''),
    sourceName: String(article.sourceName || article.source || ''),
    category: translateCategoryToEs(article.category || 'economy'),
    categoryId: article.categoryId || null,
    sentiment: article.sentiment || 'neutral',
    sentimentScore: article.sentimentScore || 55,
    impactLevel: article.impactLevel || 'low',
    affectedAssets,
    publishedAt: (article.publishedAt?.toISOString?.() || article.fetchedAt?.toISOString?.() || String(article.fetchedAt || '')),
    content: fixDollarSigns(cleanObjectArtifacts(content)),
    contentText: articleContent,
    hasSourceContent,
    introduction: fixDollarSigns(cleanObjectArtifacts(introduction)),
    body: fixDollarSigns(cleanObjectArtifacts(body)),
    conclusion: fixDollarSigns(cleanObjectArtifacts(conclusion)),
    keyTakeaways: keyTakeaways.map(k => fixDollarSigns(cleanObjectArtifacts(k))),
    hasFullContent: !!(content || introduction || body || conclusion || articleContent),
    analysisSentiment,
    analysisRecommendation,
    analysisAffectedAssets,
    wordCount: parsedAnalysis.wordCount || calculatedWordCount || 0,
    newsType: article.newsType || 'live',
    imageUrl: `/api/article-image/${article.id}`,
    generatedImage: undefined,
    analysis: parsedAnalysis.analysis || null,
    updatedAt: article.updatedAt?.toISOString?.() || article.createdAt?.toISOString?.() || '',
    views: article.views || 0,
    tags: parsedAnalysis.tags || parsedAnalysis.keywords || [],
    originalUrl: article.url || '',
  };

  return <EnNewsArticleClient article={articleData} locale="es" />;
}
