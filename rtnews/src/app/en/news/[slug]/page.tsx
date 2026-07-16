// ─── English News Article Detail Page ────────────────────────
// Server Component — fetches a single English article by slug
// Passes data to EnNewsArticleClient for rendering

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { NEWS_CATEGORIES, getNewsCategoryId } from '@/lib/news-categories';
import {
  IMPACT_CONFIG_EN,
  SENTIMENT_CONFIG_EN,
  getCategoryNameEn,
  translateCategoryToEn,
  translateAffectedAssetsToEn,
  translateRecommendationToEn,
  translateAssetReasonToEn,
} from '@/lib/locale';
import EnNewsArticleClient from './EnNewsArticleClient';

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
// V260: Detect Arabic content that should not appear on English pages
function isMostlyArabic(text: string): boolean {
  if (!text || text.length < 20) return false;
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalAlpha = arabicChars + latinChars;
  if (totalAlpha === 0) return false;
  return arabicChars / totalAlpha > 0.4; // If >40% Arabic letters, consider it Arabic
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
  // { not: 'stock_analysis' } allowed 'article'/'analysis' types to leak into news.
  const newsOnlyFilter: Record<string, any> = {
    locale: 'en',
    isReady: true,
    isPublished: true,
    newsType: { in: ['live', 'breaking'] },
  };

  // Strategy 1: Slug match
  article = await db.newsItem.findFirst({
    where: { ...newsOnlyFilter, slug },
  }).catch(() => null);

  // V374→V375: If slug is a stock analysis, redirect to proper page
  // Check without newsType filter to detect stock analysis articles
  if (!article) {
    const stockArticle = await db.newsItem.findFirst({
      where: { locale: 'en', isReady: true, isPublished: true, slug, source: 'stock-analysis-pipeline' },
      select: { id: true, title: true, newsType: true, source: true },
    }).catch(() => null);
    if (stockArticle && (stockArticle.source === 'stock-analysis-pipeline' || stockArticle.newsType === 'stock_analysis')) {
      try {
        const stockAnalysis = await db.stockAnalysis.findFirst({
          where: { symbol: stockArticle.title?.match(/\(([A-Z.]+)\)/)?.[1] || '' },
          select: { symbol: true },
        });
        if (stockAnalysis) {
          redirect(`/en/stock-analysis/${stockAnalysis.symbol}`);
        }
      } catch {}
      // If we can't find the stock analysis record, redirect to stock analysis index
      redirect('/en/stock-analysis');
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

  // Strategy 4: Cross-locale fallback — if slug belongs to another locale, return it
  // with a flag so the page can redirect to the correct locale URL
  if (!article) {
    article = await db.newsItem.findFirst({
      where: { isReady: true, isPublished: true, slug },
    }).catch(() => null);
    if (article && article.locale && article.locale !== 'en') {
      // Return a special redirect marker
      articleCache.set(slug, { data: article, ts: Date.now() });
      return article; // Will be handled by page component
    }
    if (!article) {
      article = await db.newsItem.findFirst({
        where: { isReady: true, isPublished: true, id: slug },
      }).catch(() => null);
      if (article && article.locale && article.locale !== 'en') {
        articleCache.set(slug, { data: article, ts: Date.now() });
        return article;
      }
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
    return { title: 'Article Not Found — Rouaa', description: 'AI-powered financial news' };
  }

  try {
    const article = await fetchArticleBySlug(slug);
    if (!article) return { title: 'Article Not Found — Rouaa' };

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
      title: `${title} — Rouaa Financial News`,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/en/news/${slug}`,
        siteName: 'Rouaa',
        locale: 'en_US',
        type: 'article',
        images: [{ url: article.imageUrl || `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [article.imageUrl || `${baseUrl}/og-image.png`],
      },
      alternates: { canonical: `/en/news/${slug}` },
    };
  } catch {
    return { title: 'Rouaa Financial News', description: 'AI-powered financial news' };
  }
}

// ─── Page Component ──────────────────────────────────────────
export default async function EnNewsSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  let { slug } = await params;
  try { if (slug && slug.includes('%')) slug = decodeURIComponent(slug); } catch {}

  if (!slug || slug === 'undefined' || slug === 'null') notFound();

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dir="ltr">
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#E2E8F0' }}>Loading article...</h1>
          <p style={{ color: '#64748B' }}>The article will appear once data is available</p>
        </div>
      </div>
    );
  }

  const article = await fetchArticleBySlug(slug);
  if (!article) notFound();

  // Cross-locale redirect: if article belongs to another locale, redirect to the correct URL
  if (article.locale && article.locale !== 'en' && ['es', 'fr', 'tr', 'ar'].includes(article.locale)) {
    const targetLocale = article.locale === 'ar' ? '' : `/${article.locale}`;
    const targetSlug = article.slug || slug;
    redirect(`${targetLocale}/news/${targetSlug}`);
  }

  // Increment views (fire-and-forget)
  db.newsItem.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  }).catch(() => {});

  // Parse AI analysis
  let parsedAnalysis: any = {};
  try { parsedAnalysis = article.aiAnalysis ? JSON.parse(article.aiAnalysis) : {}; } catch {}

  // V260: Extract content and validate language — discard Arabic content on English pages
  let content = cleanObjectArtifacts(deepStr(parsedAnalysis.fullContent));
  let introduction = cleanObjectArtifacts(deepStr(parsedAnalysis.introduction));
  let body = cleanObjectArtifacts(deepStr(parsedAnalysis.body));
  let conclusion = cleanObjectArtifacts(deepStr(parsedAnalysis.conclusion));

  // V260: If AI analysis is in Arabic, discard it so the page shows source content only
  if (isMostlyArabic(content)) { content = ''; }
  if (isMostlyArabic(introduction)) { introduction = ''; }
  if (isMostlyArabic(body)) { body = ''; }
  if (isMostlyArabic(conclusion)) { conclusion = ''; }
  const articleContent = fixDollarSigns(cleanObjectArtifacts(article.content || ''));

  // Key takeaways — V260: filter out Arabic takeaways
  // V270: More aggressive — discard ANY takeaway containing Arabic characters
  let keyTakeaways: string[] = [];
  try {
    const raw = parsedAnalysis.keyTakeaways || parsedAnalysis.keyPoints;
    if (Array.isArray(raw)) keyTakeaways = raw
      .map((item: any) => fixDollarSigns(cleanObjectArtifacts(typeof item === 'string' ? item : deepStr(item))))
      .filter((s: string) => s.length > 0 && !isMostlyArabic(s) && !/[\u0600-\u06FF]/.test(s));
  } catch {}

  // Affected assets — V270: translate + filter out any with remaining Arabic
  let affectedAssets: any[] = [];
  try {
    affectedAssets = translateAffectedAssetsToEn(JSON.parse(article.affectedAssets || '[]'))
      .filter((a: any) => {
        if (typeof a === 'string') return !/[\u0600-\u06FF]/.test(a);
        const nameOk = !/[\u0600-\u06FF]/.test(a.name || a.symbol || '');
        const reasonOk = !/[\u0600-\u06FF]/.test(a.reason || '');
        return nameOk && reasonOk;
      });
  } catch {}

  // Analysis fields — V270: aggressively filter Arabic content
  const analysisSentiment = parsedAnalysis.sentiment || undefined;
  // V270: If recommendation contains ANY Arabic, discard it entirely
  let analysisRecommendation: string | undefined = undefined;
  if (parsedAnalysis.recommendation) {
    const rec = fixDollarSigns(String(parsedAnalysis.recommendation));
    if (!/[\u0600-\u06FF]/.test(rec)) {
      analysisRecommendation = rec;
    } else {
      const translated = translateRecommendationToEn(rec);
      // Only use translation if it no longer contains Arabic
      if (!/[\u0600-\u06FF]/.test(translated)) {
        analysisRecommendation = translated;
      }
      // Otherwise discard — no Arabic recommendations on English pages
    }
  }
  // V270: Filter analysis affected assets — discard any with Arabic names
  const analysisAffectedAssets = Array.isArray(parsedAnalysis.affectedAssets)
    ? translateAffectedAssetsToEn(parsedAnalysis.affectedAssets.map((asset: any) => {
        if (typeof asset === 'string') return { symbol: asset, direction: 'neutral', reason: '' };
        return {
          symbol: String(asset.symbol || asset.name || asset.ticker || ''),
          direction: String(asset.direction || 'neutral'),
          reason: translateAssetReasonToEn(String(asset.reason || '')),
        };
    })).filter((a: any) => {
      if (typeof a === 'string') return !/[\u0600-\u06FF]/.test(a);
      // Filter out assets with Arabic names or reasons
      const nameOk = !/[\u0600-\u06FF]/.test(a.symbol || '');
      const reasonOk = !/[\u0600-\u06FF]/.test(a.reason || '');
      return a.symbol.length > 0 && !a.symbol.includes('[object') && nameOk && reasonOk;
    })
    : undefined;

  const allContent = [content, introduction, body, conclusion].filter(Boolean).join(' ');
  const calculatedWordCount = allContent.split(/\s+/).filter(w => w.length > 0).length;

  // V254: Detect source content (original English text from the article)
  const hasSourceContent = articleContent.length > 20 && /[a-zA-Z]/.test(articleContent) && article.source !== 'رؤى' && article.source !== 'Rouaa' ;

  // Pass serializable data to client component
  const articleData = {
    id: article.id,
    title: fixDollarSigns(String(article.title || '')),
    slug: article.slug || '',
    summary: fixDollarSigns(String(article.summary || '')),
    source: String(article.source || ''),
    sourceName: String(article.sourceName || article.source || ''),
    category: translateCategoryToEn(article.category || 'economy'),
    categoryId: article.categoryId || null,
    sentiment: article.sentiment || 'neutral',
    sentimentScore: article.sentimentScore || 55,
    impactLevel: article.impactLevel || 'low',
    affectedAssets,
    publishedAt: (article.publishedAt?.toISOString?.() || article.fetchedAt?.toISOString?.() || String(article.fetchedAt || '')),
    content: fixDollarSigns(cleanObjectArtifacts(content)),
    contentText: articleContent,  // V254: Raw source content for "News from Source" section
    hasSourceContent,  // V254: Whether source content section should show
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
    generatedImage: undefined,  // Don't send large base64 data to client
    analysis: parsedAnalysis.analysis || null,
    updatedAt: article.updatedAt?.toISOString?.() || article.createdAt?.toISOString?.() || '',
    views: article.views || 0,
    tags: parsedAnalysis.tags || parsedAnalysis.keywords || [],
    originalUrl: article.url || '',
  };

  return <EnNewsArticleClient article={articleData} />;
}
