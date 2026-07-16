// ─── News Article Detail Page V59 ─────────────────────────────────
// Bloomberg-inspired article layout with full server-side data fetching.
// Architecture: ALL content is pre-fetched from the database server-side.
// NO client-side fetching, translation, or AI analysis.
//
// V59 PERFORMANCE FIXES:
// 1. Removed ensureTablesExist() — was doing ALTER TABLE on every visit
// 2. Added 30-second in-memory cache to prevent double-fetch by
//    generateMetadata() + page body (both call fetchArticleBySlug)
// 3. Changed from force-dynamic to ISR (revalidate=60) for CDN caching
// 4. Views update is now fire-and-forget (no await)

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import ArticlePageClient from '@/app/article/[slug]/ArticlePageClient';
import { type ArticlePageData } from '@/app/article/[slug]/page';

// Re-export ArticlePageData as NewsArticleData for compatibility with NewsSlugPageClient
export type NewsArticleData = ArticlePageData;

// V130: Use proper ES module import instead of require().
// The previous `require('@/lib/db')` pattern failed in standalone mode because
// the `@/` path alias is not resolved by Node.js require() at runtime.
// The `import` is compiled by Next.js and resolves correctly.
import { db } from '@/lib/db';

// V130: force-dynamic — prevents ISR from caching 404 responses during Docker build
// ISR (revalidate=60) was causing 404 pages to be cached when DATABASE_URL=dummy at build time.
// These cached 404s persisted at runtime even after the real DB was connected.
// force-dynamic ensures every request renders fresh from the database.
export const revalidate = 300;
// ─── V59: In-memory cache (30s) to prevent double-fetch ──────────
// Both generateMetadata() and the page body call fetchArticleBySlug()
// for the same slug. Without caching, the DB is queried twice per visit.
const articleCache = new Map<string, { data: ArticlePageData | null; ts: number }>();
const ARTICLE_CACHE_TTL = 30_000; // 30 seconds

// ─── Fix doubled dollar signs ──────────────────────────────────
function fixDollarSigns(text: string): string {
  if (!text) return text;
  return text.replace(/\$\$/g, '$');
}

// ─── Clean [object Object] artifacts from any text ─────────────
function cleanObjectArtifacts(text: string): string {
  if (!text) return text;
  return text
    .replace(/\[object Object\]/g, '')
    .replace(/\[object\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Deep string conversion helper ─────────────────────────────
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
        if (typeof item.value === 'string') return item.value;
        if (typeof item.paragraph === 'string') return item.paragraph;
        const vals = Object.values(item).filter(v => typeof v === 'string') as string[];
        if (vals.length === 1) return vals[0];
        try { return JSON.stringify(item); } catch { return ''; }
      }
      return '';
    }).filter(s => s.length > 0).join('\n\n');
  }
  if (typeof val === 'object') {
    if (typeof val.text === 'string') return val.text;
    if (typeof val.content === 'string') return val.content;
    try { return JSON.stringify(val); } catch { return ''; }
  }
  return String(val);
};

// ─── Format Article from DB Row ────────────────────────────────
function formatArticleFromDb(article: any): ArticlePageData {
  let parsedAnalysis: any = {};
  try {
    parsedAnalysis = article.aiAnalysis ? JSON.parse(article.aiAnalysis) : {};
  } catch {}

  const summaryAr = String(article.summaryAr || '');
  const summaryEn = String(article.summary || '');

  const content = cleanObjectArtifacts(deepStr(parsedAnalysis.fullContent));
  let introduction = cleanObjectArtifacts(deepStr(parsedAnalysis.introduction));
  let body = cleanObjectArtifacts(deepStr(parsedAnalysis.body));
  let conclusion = cleanObjectArtifacts(deepStr(parsedAnalysis.conclusion));
  // Prefer Arabic summary over English
  const summary = summaryAr || cleanObjectArtifacts(deepStr(parsedAnalysis.summary || '')) || summaryEn;

  // Extract sections from [1]-[6] structured content (same as ArticlePage)
  if (content && /\[\s*1\s*\]/.test(content)) {
    const sectionMap: Record<number, string> = {};
    const parts = content.split(/\[\s*(\d)\s*\]/);
    for (let i = 1; i < parts.length; i += 2) {
      const num = parseInt(parts[i], 10);
      const secContent = (parts[i + 1] || '').trim();
      if (num >= 1 && num <= 6 && secContent) {
        const lines = secContent.split('\n');
        const bodyText = lines.slice(1).join('\n').trim() || lines[0].trim();
        sectionMap[num] = bodyText;
      }
    }
    if (!introduction && sectionMap[1]) introduction = sectionMap[1];
    if (!body && (sectionMap[4] || sectionMap[5])) {
      body = [sectionMap[4], sectionMap[5]].filter(Boolean).join('\n\n');
    }
    if (!conclusion && sectionMap[6]) conclusion = sectionMap[6];
  }

  // Ensure conclusion is never empty
  if (!conclusion || conclusion.trim().length === 0) {
    const recommendation = parsedAnalysis.recommendation ? String(parsedAnalysis.recommendation) : '';
    const sentimentLabel = parsedAnalysis.sentiment === 'positive' ? 'إيجابي' : parsedAnalysis.sentiment === 'negative' ? 'سلبي' : 'محايد';
    conclusion = recommendation || `التوجه العام للخبر: ${sentimentLabel}. يُنصح بمراقبة التطورات وعدم اتخاذ قرارات متسرعة.`;
  }
  if (!body || body.trim().length === 0) {
    if (introduction && content && /\[\s*[4-5]\s*\]/.test(content)) {
      const sectionMap: Record<number, string> = {};
      const parts = content.split(/\[\s*(\d)\s*\]/);
      for (let i = 1; i < parts.length; i += 2) {
        const num = parseInt(parts[i], 10);
        const secContent = (parts[i + 1] || '').trim();
        if ((num === 4 || num === 5) && secContent) {
          const lines = secContent.split('\n');
          sectionMap[num] = lines.slice(1).join('\n').trim() || lines[0].trim();
        }
      }
      body = [introduction, sectionMap[4], sectionMap[5]].filter(Boolean).join('\n\n');
    } else if (introduction) {
      body = introduction;
    }
  }

  // Clean contentAr
  let contentAr = cleanObjectArtifacts(String(article.contentAr || ''));

  // Filter out English sentences from contentAr
  if (contentAr && /[a-zA-Z]/.test(contentAr)) {
    const paragraphs = contentAr.split('\n');
    const filtered: string[] = [];
    for (const para of paragraphs) {
      const sentences = para.split(/(?<=[.!?؛؟])\s+/);
      const kept: string[] = [];
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;
        const latinChars = (trimmed.match(/[a-zA-Z]/g) || []).length;
        const arabicChars = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;
        const totalAlpha = latinChars + arabicChars;
        if (totalAlpha === 0) { kept.push(trimmed); continue; }
        const englishRatio = latinChars / totalAlpha;
        const latinWords = (trimmed.match(/[a-zA-Z]{2,}/g) || []).length;
        if (englishRatio > 0.6 && latinWords >= 5) continue;
        kept.push(trimmed);
      }
      if (kept.length > 0) filtered.push(kept.join(' '));
    }
    contentAr = filtered.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  // Check if contentAr is mostly English
  if (contentAr) {
    const totalArabicChars = (contentAr.match(/[\u0600-\u06FF]/g) || []).length;
    const totalLatinChars = (contentAr.match(/[a-zA-Z]/g) || []).length;
    const totalAlpha = totalArabicChars + totalLatinChars;
    if (totalAlpha > 0 && (totalLatinChars / totalAlpha) > 0.5) {
      contentAr = '';
    }
  }

  const hasSourceContent = !!(contentAr && contentAr.length > 50 && /[\u0600-\u06FF]/.test(contentAr)) && article.source !== 'رؤى' && article.source !== 'Rouaa'  && article.source !== 'رؤى' && article.source !== 'Rouaa' ;
  const hasFullContent = hasSourceContent || !!(content || introduction || body || conclusion);

  let affectedAssets: any[] = [];
  try {
    affectedAssets = JSON.parse(article.affectedAssets || '[]');
  } catch {}

  let keyTakeaways: string[] = [];
  try {
    const raw = parsedAnalysis.keyTakeaways || parsedAnalysis.keyPoints;
    if (Array.isArray(raw)) keyTakeaways = raw.map((item: any) => {
      const str = deepStr(item);
      return cleanObjectArtifacts(str);
    }).filter((s: string) => s.length > 0);
  } catch {}

  // If keyTakeaways is empty, extract from content
  if (keyTakeaways.length === 0) {
    if (content && /\[\s*1\s*\]/.test(content)) {
      const section1Match = content.match(/\[\s*1\s*\]([^\[]*)/);
      if (section1Match) {
        const sentences = section1Match[1]
          .split(/[.؟!،]\s+/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 15);
        keyTakeaways = sentences.slice(0, 4);
      }
    }
    if (keyTakeaways.length === 0 && introduction) {
      keyTakeaways = introduction
        .split(/[.؟!،]\s+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 15)
        .slice(0, 4);
    }
  }

  const parsedSentiment = parsedAnalysis.sentiment || undefined;
  const parsedRecommendation = parsedAnalysis.recommendation || undefined;

  // Clean analysisAffectedAssets — ensure proper structure
  const vagueAssetPatterns = [
    /العلاقات التجارية/i, /الاقتصاد العالمي/i, /السوق العالمي/i, /التجارة العالمية/i,
    /الأسواق المالية/i, /الأسواق العالمية/i, /القطاع المالي/i, /العلاقات الدولية/i,
    /التوترات التجارية/i, /الحرب التجارية/i, /التجارة الدولية/i, /النظام المالي/i,
    /سلسلة التوريد/i, /الاقتصاد الكلي/i,
  ];

  const parsedAffectedAssets = Array.isArray(parsedAnalysis.affectedAssets)
    ? parsedAnalysis.affectedAssets.map((asset: any) => {
        if (typeof asset === 'string') return { symbol: asset, direction: 'neutral', impactDegree: 'medium', reason: '', isTradable: true };
        return {
          symbol: String(asset.symbol || asset.name || asset.ticker || ''),
          direction: String(asset.direction || 'neutral'),
          impactDegree: String(asset.impactDegree || asset.impact || 'medium'),
          reason: String(asset.reason || ''),
          isTradable: asset.isTradable !== false,
        };
      }).filter((a: any) => {
        if (a.symbol.length === 0 || a.symbol.includes('[object')) return false;
        if (a.isTradable === false) return false;
        for (const vp of vagueAssetPatterns) {
          if (vp.test(a.symbol) || vp.test(a.reason)) return false;
        }
        return true;
      })
    : undefined;

  // Calculate wordCount from content
  const allContent = [content, introduction, body, conclusion].filter(Boolean).join(' ');
  const calculatedWordCount = allContent.split(/\s+/).filter(w => w.length > 0).length;

  // V70: Extract Four Gates system fields from parsed analysis
  const parsedPath = (['A', 'B', 'C'].includes(parsedAnalysis.path) ? parsedAnalysis.path : undefined) as 'A' | 'B' | 'C' | undefined;
  const parsedSector = parsedAnalysis.sector && typeof parsedAnalysis.sector === 'string' ? parsedAnalysis.sector : undefined;
  const parsedSentimentReason = parsedAnalysis.sentimentReason && typeof parsedAnalysis.sentimentReason === 'string' ? parsedAnalysis.sentimentReason : undefined;
  const parsedRawData = parsedAnalysis.rawData && typeof parsedAnalysis.rawData === 'object' ? parsedAnalysis.rawData : undefined;

  // Use sector from AI as display category
  const displayCategory = parsedSector || article.category || 'اقتصاد كلي';

  return {
    id: article.id,
    title: fixDollarSigns(String(article.titleAr || article.title || '')),
    titleAr: article.titleAr ? fixDollarSigns(article.titleAr) : undefined,
    slug: article.slug || '',
    summary: fixDollarSigns(cleanObjectArtifacts(summary)),
    summaryAr: article.summaryAr ? fixDollarSigns(article.summaryAr) : undefined,
    source: String(article.source || ''),
    sourceName: String(article.sourceName || article.source || ''),
    originalUrl: article.url || '',
    category: displayCategory,
    sentiment: article.sentiment || 'neutral',
    sentimentScore: article.sentimentScore || 55,
    impactLevel: article.impactLevel || 'low',
    originalLanguage: article.originalLanguage || 'ar',
    affectedAssets,
    publishedAt: (article.publishedAt?.toISOString?.() || article.fetchedAt?.toISOString?.() || String(article.fetchedAt || '')),
    contentAr: fixDollarSigns(cleanObjectArtifacts(contentAr)),
    hasSourceContent,
    content: fixDollarSigns(cleanObjectArtifacts(content)),
    introduction: fixDollarSigns(cleanObjectArtifacts(introduction)),
    body: fixDollarSigns(cleanObjectArtifacts(body)),
    conclusion: fixDollarSigns(cleanObjectArtifacts(conclusion)),
    keyTakeaways: keyTakeaways.map(k => fixDollarSigns(cleanObjectArtifacts(k))),
    hasFullContent,
    analysisSentiment: parsedSentiment,
    analysisRecommendation: parsedRecommendation ? fixDollarSigns(String(parsedRecommendation)) : undefined,
    analysisAffectedAssets: parsedAffectedAssets,
    wordCount: parsedAnalysis.wordCount || calculatedWordCount || 0,
    newsType: article.newsType || 'live',
    imageUrl: `/api/article-image/${article.id}`,
    isPreview: false,
    seo: parsedAnalysis.seo || null,
    analysis: parsedAnalysis.analysis || null,
    translatedTitle: article.titleAr ? fixDollarSigns(article.titleAr) : undefined,
    translatedSummary: article.summaryAr ? fixDollarSigns(article.summaryAr) : undefined,
    updatedAt: article.updatedAt?.toISOString?.() || article.createdAt?.toISOString?.() || article.publishedAt?.toISOString?.() || '',
    // V70: Four Gates system fields
    path: parsedPath,
    sector: parsedSector,
    sentimentReason: parsedSentimentReason,
    rawData: parsedRawData,
  };
}

// ─── Fetch Article from DB (with 30s cache) ───────────────────
async function fetchArticleBySlug(slug: string): Promise<ArticlePageData | null> {
  if (!slug || slug === 'undefined' || slug === 'null' || slug === '') return null;

  // V130: db is now imported directly (not lazy-loaded), so it's always available.
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    return null;
  }

  // V59: Check in-memory cache first to prevent double-fetch
  const cached = articleCache.get(slug);
  if (cached && (Date.now() - cached.ts) < ARTICLE_CACHE_TTL) {
    return cached.data;
  }

  // V59: Removed ensureTablesExist() — was doing ALTER TABLE on every visit.
  // DB schema is ensured at startup and in admin routes only.

  const slugCandidates = [slug];
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
    if (decodedSlug !== slug) slugCandidates.push(decodedSlug);
  } catch {}
  try {
    const doubleDecoded = decodeURIComponent(decodedSlug);
    if (doubleDecoded !== decodedSlug && !slugCandidates.includes(doubleDecoded)) {
      slugCandidates.push(doubleDecoded);
    }
  } catch {}

  // Safe select to avoid "column does not exist" errors when DB schema isn't fully migrated
  const safeSelect = {
    id: true, title: true, titleAr: true, summary: true, summaryAr: true,
    content: true, contentAr: true, source: true, sourceName: true, url: true,
    category: true, sentiment: true, sentimentScore: true, impactLevel: true,
    originalLanguage: true, newsType: true, affectedAssets: true, aiAnalysis: true,
    isPublished: true, isReady: true, processingStage: true, imageUrl: true, slug: true, views: true,
    publishedAt: true, fetchedAt: true, createdAt: true, updatedAt: true,
  };

  // ROOT CAUSE FIX: Use POSITIVE whitelist instead of negative blacklist.
  // { not: 'stock_analysis' } allowed 'article'/'analysis' types to leak into news.
  async function safeFindFirst(where: any) {
    const whereWithLocale = { ...where, locale: 'ar', newsType: { in: ['live', 'breaking'] } };
    return await db.newsItem.findFirst({ where: whereWithLocale, select: safeSelect });
  }

  let result: ArticlePageData | null = null;

  // Strategy 1: Slug exact match (with locale filter)
  for (const slugCandidate of slugCandidates) {
    try {
      const found = await safeFindFirst({ slug: slugCandidate });
      if (found) {
        // ── V45: TRUST the Publisher — if isReady=true AND isPublished=true, show the article ──
        if (!found.isReady || !found.isPublished) {
          console.log(`[NewsSlugPage V59] Article found but NOT published (isReady=${found.isReady}, isPublished=${found.isPublished}), slug="${slugCandidate}"`);
          continue; // Try next slug candidate
        }
        console.log(`[NewsSlugPage V59] Found article by exact slug match: "${slugCandidate}" → id="${found.id}"`);
        // V59: Fire-and-forget views update (no await)
        db.newsItem.update({ where: { id: found.id }, data: { views: { increment: 1 } } }).catch(err => console.warn('[NewsSlugPage V156] View count increment failed:', err instanceof Error ? err.message : err));
        result = formatArticleFromDb(found);
        break;
      }
    } catch {}
  }

  // V374→V375: If slug is a stock analysis, redirect to proper page
  // Check without newsType filter to detect stock analysis articles
  if (!result) {
    for (const slugCandidate of slugCandidates) {
      const stockArticle = await db.newsItem.findFirst({
        where: { locale: 'ar', isReady: true, isPublished: true, slug: slugCandidate, source: 'stock-analysis-pipeline' },
        select: { id: true, title: true, newsType: true, source: true },
      }).catch(() => null);
      if (stockArticle && (stockArticle.source === 'stock-analysis-pipeline' || stockArticle.newsType === 'stock_analysis')) {
        try {
          const stockAnalysis = await db.stockAnalysis.findFirst({
            where: { symbol: stockArticle.title?.match(/\(([A-Z.]+)\)/)?.[1] || '' },
            select: { symbol: true },
          });
          if (stockAnalysis) {
            redirect(`/stock-analysis/${stockAnalysis.symbol}`);
          }
        } catch {}
        // If we can't find the stock analysis record, redirect to stock analysis index
        redirect('/stock-analysis');
      }
    }
  }

  // Strategy 2: Direct ID lookup — V45: TRUST the Publisher (same as slug lookup, with locale filter)
  if (!result) {
    for (const idCandidate of slugCandidates) {
      const directResult = await safeFindFirst({ id: idCandidate }).catch(err => { console.warn('[NewsSlugPage V156] DB lookup failed:', err instanceof Error ? err.message : err); return null; });
      if (directResult) {
        if (!directResult.isReady || !directResult.isPublished) {
          console.log(`[NewsSlugPage V59] Article found by ID but NOT published (id="${idCandidate}")`);
          continue;
        }
        result = formatArticleFromDb(directResult);
        break;
      }
    }
  }

  // ── Strategy 3: V214 Archive table fallback ──
  // Articles that were published to Telegram with a specific slug may later be
  // archived (moved from news_items to news_item_archives). When users click the
  // "اقرأ التحليل الكامل" link in Telegram, the slug lookup fails because the
  // article is no longer in the main table. This fallback searches the archive.
  if (!result) {
    for (const slugCandidate of slugCandidates) {
      try {
        let archived: any = null;
        try {
          archived = await db.newsItemArchive.findFirst({
            where: { slug: slugCandidate, locale: 'ar' },
            select: { ...safeSelect, id: true },
          });
        } catch (selectErr: any) {
          if (selectErr.message?.includes('generatedImage') || selectErr.message?.includes('column')) {
            archived = await db.newsItemArchive.findFirst({
              where: { slug: slugCandidate, locale: 'ar' },
              select: { ...safeSelect, id: true },
            });
          }
        }
        if (archived && archived.isReady && archived.isPublished) {
          // V375: Skip stock analysis articles in archive — redirect instead
          if (archived.newsType === 'stock_analysis' || archived.source === 'stock-analysis-pipeline') {
            try {
              const stockAnalysis = await db.stockAnalysis.findFirst({
                where: { symbol: archived.title?.match(/\(([A-Z.]+)\)/)?.[1] || '' },
                select: { symbol: true },
              });
              if (stockAnalysis) {
                redirect(`/stock-analysis/${stockAnalysis.symbol}`);
              }
            } catch {}
            redirect('/stock-analysis');
          }
          console.log(`[NewsSlugPage V214] Found article in ARCHIVE table by slug: "${slugCandidate}" → id="${archived.id}"`);
          result = formatArticleFromDb(archived);
          break;
        }
      } catch (err: any) {
        console.warn(`[NewsSlugPage] Archive slug lookup error for "${slugCandidate}": ${err.message}`);
      }
    }
  }

  // Strategy 4: Archive table — ID lookup
  if (!result) {
    for (const idCandidate of slugCandidates) {
      try {
        const archivedById = await db.newsItemArchive.findFirst({
          where: { id: idCandidate, locale: 'ar' },
          select: safeSelect,
        }).catch(() => null);
        if (archivedById && archivedById.isReady && archivedById.isPublished) {
          // V375: Skip stock analysis articles in archive — redirect instead
          if (archivedById.newsType === 'stock_analysis' || archivedById.source === 'stock-analysis-pipeline') {
            try {
              const stockAnalysis = await db.stockAnalysis.findFirst({
                where: { symbol: archivedById.title?.match(/\(([A-Z.]+)\)/)?.[1] || '' },
                select: { symbol: true },
              });
              if (stockAnalysis) {
                redirect(`/stock-analysis/${stockAnalysis.symbol}`);
              }
            } catch {}
            redirect('/stock-analysis');
          }
          console.log(`[NewsSlugPage] Found article in ARCHIVE by ID: "${idCandidate}"`);
          result = formatArticleFromDb(archivedById);
          break;
        }
      } catch {}
    }
  }

  // V59: Cache the result (including null) for 30 seconds
  articleCache.set(slug, { data: result, ts: Date.now() });

  // Periodically clean old cache entries (prevent memory leak)
  if (articleCache.size > 200) {
    const now = Date.now();
    for (const [key, entry] of articleCache) {
      if (now - entry.ts > ARTICLE_CACHE_TTL) articleCache.delete(key);
    }
  }

  return result;
}

// ─── Generate Dynamic Metadata for SEO ────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  let { slug } = await params;
  try { if (slug && slug.includes('%')) slug = decodeURIComponent(slug); } catch {}

  if (!slug || slug === 'undefined' || slug === 'null') {
    return { title: 'المقال غير موجود - رؤى للأخبار المالية', description: 'منصة الأخبار المالية والتحليلات بالذكاء الاصطناعي' };
  }

  try {
    const article = await fetchArticleBySlug(slug);
    if (!article) return { title: 'المقال غير موجود - رؤى للأخبار المالية' };

    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    let baseUrl = envUrl || 'http://localhost:3000';
    if (!envUrl) {
      try {
        const hdrs = await headers();
        const host = hdrs.get('host');
        const proto = hdrs.get('x-forwarded-proto') || 'https';
        if (host) baseUrl = `${proto}://${host}`;
      } catch {}
    }

    const title = article.titleAr || article.translatedTitle || article.title;
    const description = article.summaryAr || article.translatedSummary || article.summary;

    return {
      title: `${fixDollarSigns(title)} - رؤى للأخبار المالية`,
      description: fixDollarSigns(description?.slice(0, 160) || ''),
      openGraph: {
        title: fixDollarSigns(title),
        description: fixDollarSigns(description?.slice(0, 160) || ''),
        url: `${baseUrl}/news/${slug}`,
        siteName: 'رؤى للأخبار المالية',
        locale: 'ar_AR',
        type: 'article',
        images: [{ url: article.imageUrl || `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: fixDollarSigns(title),
        description: fixDollarSigns(description?.slice(0, 160) || ''),
        images: [article.imageUrl || `${baseUrl}/og-image.png`],
      },
      alternates: { canonical: `/news/${slug}` },
    };
  } catch {
    return { title: 'رؤى للأخبار المالية', description: 'منصة الأخبار المالية والتحليلات بالذكاء الاصطناعي' };
  }
}

// ─── Server Page Component ─────────────────────────────────────
export default async function NewsSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  let { slug } = await params;
  try { if (slug && slug.includes('%')) slug = decodeURIComponent(slug); } catch {}

  if (!slug || slug === 'undefined' || slug === 'null' || slug === '') {
    notFound();
  }

  // V128: During Docker build (DATABASE_URL=dummy), render a loading placeholder
  // instead of calling notFound(). This prevents Next.js from caching a 404 page
  // in the ISR cache that would persist at runtime.
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text1)' }}>جاري تحميل المقال...</h1>
          <p style={{ color: 'var(--text3)' }}>سيتم عرض المقال بمجرد توفر البيانات</p>
        </div>
      </div>
    );
  }

  let articleData: ArticlePageData | null = null;
  try {
    articleData = await fetchArticleBySlug(slug);
  } catch {}

  if (!articleData) {
    notFound();
  }

  return <ArticlePageClient initialData={articleData!} />;
}
