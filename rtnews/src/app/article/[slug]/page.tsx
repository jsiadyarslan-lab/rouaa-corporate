// @ts-nocheck
// ─── Article Detail Page (Server Component) V59 ─────────────────
// Architecture: ALL content is pre-fetched from the database server-side.
// NO client-side fetching, translation, or AI analysis.
//
// CRITICAL: Only articles with isReady=true are accessible.
// Incomplete articles return 404 to protect site reputation.
// Visitors should NEVER see half-processed content.
//
// V59 PERFORMANCE FIXES:
// 1. Removed ensureTablesExist() — was doing ALTER TABLE on every visit
// 2. Added 30-second in-memory cache to prevent double-fetch by
//    generateMetadata() + page body (both call fetchArticleBySlug)
// 3. Changed from force-dynamic to ISR (revalidate=60) for CDN caching
// 4. Views update is now fire-and-forget (no await)
// 5. Arabic search (Strategy 5) now selects only lightweight fields

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import ArticlePageClient from './ArticlePageClient';
import { ArticleErrorBoundary } from '@/components/rouaa/article/ArticleErrorBoundary';

// V130: Use proper ES module import instead of require().
// The previous `require('@/lib/db')` pattern failed in standalone mode because
// the `@/` path alias is not resolved by Node.js require() at runtime.
// The `import` is compiled by Next.js and resolves correctly.
// The db.ts module already handles dummy DATABASE_URL gracefully.
import { db } from '@/lib/db';

// V130: force-dynamic — prevents ISR from caching 404 responses during Docker build
// ISR (revalidate=60) was causing 404 pages to be cached when DATABASE_URL=dummy at build time.
// These cached 404s persisted at runtime even after the real DB was connected.
// force-dynamic ensures every request renders fresh from the database.
// The 30-second in-memory cache in fetchArticleBySlug() provides sufficient caching.
export const revalidate = 300;
// ─── V59: In-memory cache (30s) to prevent double-fetch ──────────
const articleCache = new Map<string, { data: ArticlePageData | null; ts: number }>();
const ARTICLE_CACHE_TTL = 30_000; // 30 seconds

// ─── Article Page Data Interface ─────────────────────────────
export interface ArticlePageData {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  summary: string;
  summaryAr?: string;
  source: string;
  sourceName: string;
  originalUrl: string;
  category: string;
  sentiment: string;
  sentimentScore: number;
  impactLevel: string;
  originalLanguage: string;
  affectedAssets: any[];
  publishedAt: string;
  contentAr: string;
  hasSourceContent: boolean;
  // AI analysis fields
  content: string;
  introduction: string;
  body: string;
  conclusion: string;
  keyTakeaways: string[];
  hasFullContent: boolean;
  analysisSentiment?: string;
  analysisRecommendation?: string;
  analysisAffectedAssets?: any[];
  wordCount: number;
  newsType: string;
  imageUrl?: string;
  seo?: any;
  analysis?: any;
  translatedTitle?: string;
  translatedSummary?: string;
  updatedAt?: string;
  generatedImage?: string;
  isPreview?: boolean;
  // V70: Four Gates system fields
  path?: 'A' | 'B' | 'C';
  sector?: string;
  sentimentReason?: string;
  rawData?: { entityNameEn: string; ticker: string; exchange: string; figures: string[]; source: string };
}

// ─── Fix doubled dollar signs (e.g., $$4 → $4) ─────────────
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

// ─── Format Article from DB Row ──────────────────────────────
function formatArticleFromDb(article: any): ArticlePageData {
  let parsedAnalysis: any = {};
  try {
    parsedAnalysis = article.aiAnalysis ? JSON.parse(article.aiAnalysis) : {};
  } catch {}

  const summaryAr = String(article.summaryAr || '');
  const summaryEn = String(article.summary || '');

  // Deep string conversion helper — prevents [object Object] in any field
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
      // V65: If fullContent is a nested object, extract the inner string
      if (typeof val.fullContent === 'string') return val.fullContent;
      if (typeof val.text === 'string') return val.text;
      if (typeof val.content === 'string') return val.content;
      try { return JSON.stringify(val); } catch { return ''; }
    }
    return String(val);
  };

  // V65: Strip Markdown from server-side data before sending to client
  const stripMd = (text: string): string => {
    if (!text) return text;
    let r = text;
    r = r.replace(/^#{1,6}\s+/gm, '');
    r = r.replace(/\*\*(.+?)\*\*/g, '$1');
    r = r.replace(/__(.+?)__/g, '$1');
    r = r.replace(/\*(.+?)\*/g, '$1');
    r = r.replace(/(?<!\w)_(.+?)_(?!\w)/g, '$1');
    r = r.replace(/^[\-\*]\s+/gm, '');
    r = r.replace(/^[\-\*]{3,}\s*$/gm, '');
    r = r.replace(/`(.+?)`/g, '$1');
    r = r.replace(/\[(.+?)\]\(.+?\)/g, '$1');
    r = r.replace(/\n{3,}/g, '\n\n');
    return r.trim();
  };

  const content = stripMd(cleanObjectArtifacts(deepStr(parsedAnalysis.fullContent)));
  let introduction = stripMd(cleanObjectArtifacts(deepStr(parsedAnalysis.introduction)));
  let body = stripMd(cleanObjectArtifacts(deepStr(parsedAnalysis.body)));
  let conclusion = stripMd(cleanObjectArtifacts(deepStr(parsedAnalysis.conclusion)));
  // V72: Prefer Arabic summary over English — never show English as the main summary
  const summary = summaryAr || stripMd(cleanObjectArtifacts(deepStr(parsedAnalysis.summary || ''))) || summaryEn;

  // V67: For legacy articles that only have fullContent [1]-[6] but no introduction/body/conclusion,
  // extract these fields from the fullContent sections PER-FIELD (not requiring all three to be empty).
  // This ensures each tab always has content if fullContent has the [1]-[6] structure.
  if (content && /\[\s*1\s*\]/.test(content)) {
    const sectionMap: Record<number, string> = {};
    const parts = content.split(/\[\s*(\d)\s*\]/);
    for (let i = 1; i < parts.length; i += 2) {
      const num = parseInt(parts[i], 10);
      const secContent = (parts[i + 1] || '').trim();
      if (num >= 1 && num <= 6 && secContent) {
        // Remove the title line (e.g. "ملخص الحدث") and keep just the body
        const lines = secContent.split('\n');
        const bodyText = lines.slice(1).join('\n').trim() || lines[0].trim();
        sectionMap[num] = bodyText;
      }
    }
    // Per-field fallback: only fill if the field is missing/empty
    // [1] ملخص الحدث → introduction
    if (!introduction && sectionMap[1]) introduction = sectionMap[1];
    // [4] السياق الأوسع + [5] سيناريوهات التداول → body
    if (!body && (sectionMap[4] || sectionMap[5])) {
      body = [sectionMap[4], sectionMap[5]].filter(Boolean).join('\n\n');
    }
    // [6] توصية الخبراء → conclusion
    if (!conclusion && sectionMap[6]) conclusion = sectionMap[6];
  }

  // V68: Ensure conclusion and body are never empty — derive from other fields
  // Many old articles have empty conclusion/body/keyTakeaways from the AI
  if (!conclusion || conclusion.trim().length === 0) {
    const recommendation = parsedAnalysis.recommendation ? stripMd(String(parsedAnalysis.recommendation)) : '';
    const sentimentLabel = parsedAnalysis.sentiment === 'positive' ? 'إيجابي' : parsedAnalysis.sentiment === 'negative' ? 'سلبي' : 'محايد';
    conclusion = recommendation || `التوجه العام للخبر: ${sentimentLabel}. يُنصح بمراقبة التطورات وعدم اتخاذ قرارات متسرعة.`;
  }
  if (!body || body.trim().length === 0) {
    // Use introduction + content sections [4] [5] as body fallback
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

  // Build contentAr: ONLY the real translated article content from the source URL.
  let contentAr = stripMd(cleanObjectArtifacts(String(article.contentAr || '')));

  // V72: Filter out English sentences from contentAr — never show untranslated text
  // If contentAr contains significant English text (>60% Latin in a sentence), strip it
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
        // Skip sentences that are >60% English with 5+ Latin words (untranslated)
        if (englishRatio > 0.6 && latinWords >= 5) continue;
        kept.push(trimmed);
      }
      if (kept.length > 0) filtered.push(kept.join(' '));
    }
    contentAr = filtered.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  // V72: Also check if contentAr is mostly English (not Arabic at all) — if so, clear it
  // to prevent showing raw English text as "source content"
  if (contentAr) {
    const totalArabicChars = (contentAr.match(/[\u0600-\u06FF]/g) || []).length;
    const totalLatinChars = (contentAr.match(/[a-zA-Z]/g) || []).length;
    const totalAlpha = totalArabicChars + totalLatinChars;
    if (totalAlpha > 0 && (totalLatinChars / totalAlpha) > 0.5) {
      // Content is >50% Latin — likely untranslated English, clear it
      contentAr = '';
    }
  }

  // V28: Lowered threshold from 100 to 50 — short summaries still count as source content
  const hasSourceContent = !!(contentAr && contentAr.length > 50 && /[\u0600-\u06FF]/.test(contentAr));
  // hasFullContent: true if there's real content to show (source translation or AI analysis)
  const hasFullContent = hasSourceContent || !!(content || introduction || body || conclusion);

  // V73: Vague/non-tradeable asset names to filter from all asset displays
  const vagueAssetPatterns = [
    /العلاقات التجارية/i, /الاقتصاد العالمي/i, /السوق العالمي/i, /التجارة العالمية/i,
    /الأسواق المالية/i, /الأسواق العالمية/i, /القطاع المالي/i, /العلاقات الدولية/i,
    /التوترات التجارية/i, /الحرب التجارية/i, /التجارة الدولية/i, /النظام المالي/i,
    /سلسلة التوريد/i, /الاقتصاد الكلي/i,
  ];

  let affectedAssets: any[] = [];
  try {
    affectedAssets = JSON.parse(article.affectedAssets || '[]');
    // V73: Filter out vague concept "assets" from DB stored assets too
    affectedAssets = affectedAssets.filter((a: any) => {
      const name = String(a.name || a.symbol || '');
      for (const vp of vagueAssetPatterns) {
        if (vp.test(name)) return false;
      }
      return true;
    });
  } catch {}

  let keyTakeaways: string[] = [];
  try {
    const raw = parsedAnalysis.keyTakeaways || parsedAnalysis.keyPoints;
    if (Array.isArray(raw)) keyTakeaways = raw.map((item: any) => {
      const str = deepStr(item);
      return stripMd(cleanObjectArtifacts(str));
    }).filter((s: string) => s.length > 0);
  } catch {}

  // V68: If keyTakeaways is empty, extract from fullContent [1] section or introduction
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

  // Clean affectedAssets from analysis — ensure proper structure
  // V68: Also filter out non-tradable assets (private companies, subsidiaries)
  // V73: Also filter out vague concepts (already defined vagueAssetPatterns above)
  const analysisAffectedAssets = Array.isArray(parsedAnalysis.affectedAssets)
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
        // V73: Filter out vague concept "assets"
        for (const vp of vagueAssetPatterns) {
          if (vp.test(a.symbol) || vp.test(a.reason)) return false;
        }
        // Filter out assets whose symbol doesn't look like a real ticker
        const looksLikeTicker = /^[A-Z]{1,6}(\.[A-Z]{1,2})?$/.test(a.symbol);
        if (!looksLikeTicker) {
          const name = String(a.reason || a.symbol);
          if (/غير مدرج|خاصة|تابع/i.test(name)) return false;
        }
        return true;
      })
    : undefined;

  const parsedSentiment = parsedAnalysis.sentiment || undefined;
  const parsedRecommendation = parsedAnalysis.recommendation || undefined;

  // V70: Extract Four Gates system fields from parsed analysis
  const parsedPath = (['A', 'B', 'C'].includes(parsedAnalysis.path) ? parsedAnalysis.path : undefined) as 'A' | 'B' | 'C' | undefined;
  const parsedSector = parsedAnalysis.sector && typeof parsedAnalysis.sector === 'string' ? parsedAnalysis.sector : undefined;
  const parsedSentimentReason = parsedAnalysis.sentimentReason && typeof parsedAnalysis.sentimentReason === 'string' ? parsedAnalysis.sentimentReason : undefined;
  const parsedRawData = parsedAnalysis.rawData && typeof parsedAnalysis.rawData === 'object' ? parsedAnalysis.rawData : undefined;

  // V70: Use sector from AI as display category (fixes wrong categorizations like drugs under "currencies")
  const displayCategory = parsedSector || article.category || 'اقتصاد كلي';

  // V72: Filter English sentences from ALL AI analysis text fields at display level
  // This ensures old articles with English text in their analysis don't show it
  const filterEnglishSentences = (text: string): string => {
    if (!text || !/[a-zA-Z]/.test(text)) return text;
    const paragraphs = text.split('\n');
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
    return filtered.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  };

  // V72: Apply translation auto-fixes at display level (same as analyzer.ts TRANSLATION_FIXES)
  // This corrects common AI mistranslations in old articles without requiring re-analysis
  const fixDisplayTranslations = (text: string): string => {
    if (!text || typeof text !== 'string') return text;
    let r = text;
    // V71: Mistranslations
    r = r.replace(/أسهم النفط الخام/g, 'عقود النفط الخام الآجلة');
    r = r.replace(/أسهم النفط/g, 'عقود النفط الآجلة');
    r = r.replace(/أسهم الذهب/g, 'عقود الذهب الآجلة');
    r = r.replace(/أسهم السلع/g, 'عقود السلع الآجلة');
    r = r.replace(/تليق بزيادة/g, 'يؤدي إلى زيادة');
    r = r.replace(/تليق بانخفاض/g, 'يؤدي إلى انخفاض');
    r = r.replace(/تليق ب/g, 'يؤدي إلى');
    // V73: Foreign words leaking into Arabic text
    r = r.replace(/(\s)para(\s)/g, '$1من أجل$2');  // Spanish "para"
    r = r.replace(/(\s)pero(\s)/g, '$1لكن$2');      // Spanish "pero"
    r = r.replace(/(\s)avec(\s)/g, '$1مع$2');       // French "avec"
    r = r.replace(/(\s)dans(\s)/g, '$1في$2');       // French "dans"
    r = r.replace(/(\s)pour(\s)/g, '$1لـ$2');       // French "pour"
    // V73: Informal openings
    r = r.replace(/^حسناً\.?\s*/gm, '');
    r = r.replace(/^حسنًا\.?\s*/gm, '');
    r = r.replace(/^حسنا\.?\s*/gm, '');
    r = r.replace(/^إذن\.?\s*/gm, '');
    r = r.replace(/^طبعاً\.?\s*/gm, '');
    r = r.replace(/^بالتأكيد\.?\s*/gm, '');
    // V73: Forbidden vague phrases
    r = r.replace(/مراعاة التوترات/g, '');
    r = r.replace(/مراعاة الظروف/g, '');
    r = r.replace(/مراعاة التطورات/g, '');
    r = r.replace(/مراقبة التطورات/g, '');
    r = r.replace(/ينبغي الحذر/g, '');
    r = r.replace(/يجب الحذر/g, '');
    return r;
  };

  // Combined filter: first fix translations, then strip English
  const cleanDisplayText = (text: string): string => filterEnglishSentences(fixDisplayTranslations(text));

  // Calculate wordCount from content if not already stored
  const allContent = [content, introduction, body, conclusion].filter(Boolean).join(' ');
  const calculatedWordCount = allContent.split(/\s+/).filter(w => w.length > 0).length;

  return {
    id: article.id,
    title: fixDollarSigns(String(article.title || '')),
    titleAr: (article.titleAr && article.titleAr.length >= 10 && /[\u0600-\u06FF]/.test(article.titleAr)) ? fixDollarSigns(fixDisplayTranslations(article.titleAr)) : undefined, // V232: Skip garbage titles < 10 chars (e.g. "حس")
    slug: article.slug || '',
    // V72: Apply English sentence filtering + translation fixes to ALL text fields — never show English
    summary: fixDollarSigns(cleanObjectArtifacts(cleanDisplayText(summary))),
    summaryAr: article.summaryAr ? fixDollarSigns(fixDisplayTranslations(article.summaryAr)) : undefined,
    source: String(article.source || ''),
    sourceName: String(article.sourceName || article.source || ''),
    originalUrl: article.url || '',
    category: displayCategory,  // V70: Use sector from AI as display category
    sentiment: article.sentiment || 'neutral',
    sentimentScore: article.sentimentScore || 55,
    impactLevel: article.impactLevel || 'low',
    originalLanguage: article.originalLanguage || 'ar',
    affectedAssets,
    publishedAt: article.publishedAt?.toISOString?.() || article.fetchedAt?.toISOString?.() || String(article.fetchedAt || ''),
    contentAr: fixDollarSigns(cleanObjectArtifacts(cleanDisplayText(contentAr))),
    hasSourceContent,
    // V72: Apply English sentence filtering + translation fixes to ALL text fields
    content: fixDollarSigns(cleanObjectArtifacts(cleanDisplayText(content))),
    introduction: fixDollarSigns(cleanObjectArtifacts(cleanDisplayText(introduction))),
    body: fixDollarSigns(cleanObjectArtifacts(cleanDisplayText(body))),
    conclusion: fixDollarSigns(cleanObjectArtifacts(cleanDisplayText(conclusion))),
    keyTakeaways: keyTakeaways.map(k => fixDollarSigns(cleanObjectArtifacts(cleanDisplayText(k)))),
    hasFullContent,
    analysisSentiment: parsedSentiment,
    analysisRecommendation: parsedRecommendation ? fixDollarSigns(fixDisplayTranslations(String(parsedRecommendation))) : undefined,
    analysisAffectedAssets: analysisAffectedAssets,
    wordCount: parsedAnalysis.wordCount || calculatedWordCount || 0,
    newsType: article.newsType || 'live',
    imageUrl: `/api/article-image/${article.id}`,
    isPreview: false,
    seo: parsedAnalysis.seo || null,
    analysis: parsedAnalysis.analysis || null,
    translatedTitle: (article.titleAr && article.titleAr.length >= 10 && /[\u0600-\u06FF]/.test(article.titleAr)) ? fixDollarSigns(fixDisplayTranslations(article.titleAr)) : undefined, // V232: Skip garbage titles < 10 chars
    translatedSummary: article.summaryAr ? fixDollarSigns(fixDisplayTranslations(article.summaryAr)) : undefined,
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
  // The db.ts module handles dummy DATABASE_URL gracefully.
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    console.warn('[ArticlePage V130] DATABASE_URL not configured');
    return null;
  }

  // V59: Check in-memory cache first to prevent double-fetch
  const cached = articleCache.get(slug);
  if (cached && (Date.now() - cached.ts) < ARTICLE_CACHE_TTL) {
    return cached.data;
  }

  // V59: Removed ensureTablesExist() — was doing ALTER TABLE on every visit.
  // DB schema is ensured at startup and in admin routes only.

  // Normalize: ensure we have both encoded and decoded versions
  const slugCandidates = new Set<string>();
  slugCandidates.add(slug);
  let decodedSlug = slug;

  try {
    const d1 = decodeURIComponent(slug);
    slugCandidates.add(d1);
    decodedSlug = d1;
    try {
      const d2 = decodeURIComponent(d1);
      slugCandidates.add(d2);
    } catch {}
  } catch {}

  // Also try normalizing Arabic characters (e.g., ي vs ى, ة vs ه)
  for (const candidate of [...slugCandidates]) {
    slugCandidates.add(candidate.replace(/ى/g, 'ي').replace(/ة/g, 'ه'));
  }

  console.log(`[ArticlePage V59] Looking up article with slug="${slug}", candidates=${slugCandidates.size}`);

  // Strategy 1: Slug exact match (slug is @unique) — fastest
  const safeSelect = {
    id: true, title: true, titleAr: true, summary: true, summaryAr: true,
    content: true, contentAr: true, source: true, sourceName: true, url: true,
    category: true, sentiment: true, sentimentScore: true, impactLevel: true,
    originalLanguage: true, newsType: true, affectedAssets: true, aiAnalysis: true,
    isPublished: true, isReady: true, processingStage: true, imageUrl: true, slug: true, views: true,
    publishedAt: true, fetchedAt: true, createdAt: true, updatedAt: true,
  };

  let result: ArticlePageData | null = null;

  for (const slugCandidate of slugCandidates) {
    try {
      let found: any = null;
      try {
        found = await db.newsItem.findFirst({
          where: { slug: slugCandidate },
          select: { ...safeSelect, locale: true },
        });
      } catch (selectErr: any) {
        if (selectErr.message?.includes('column')) {
          console.warn(`[ArticlePage V59] Column missing, using fallback select`);
          found = await db.newsItem.findFirst({
            where: { slug: slugCandidate },
            select: { ...safeSelect, locale: true },
          });
        } else {
          throw selectErr;
        }
      }

      if (found) {
        // FIX: If article is a non-Arabic locale, redirect to the correct language shell
        const latinLocale = found.locale as string;
        if (['en', 'es', 'fr', 'tr'].includes(latinLocale)) {
          console.log(`[ArticlePage] ${latinLocale.toUpperCase()} article found at Arabic route, redirecting to /${latinLocale}/news/${slugCandidate}`);
          return { redirect: `/${latinLocale}/news/${slugCandidate}` } as any;
        }
        if (!found.isReady || !found.isPublished) {
          console.log(`[ArticlePage V59] Article found but NOT published (isReady=${found.isReady}, isPublished=${found.isPublished}), slug="${slugCandidate}"`);
          continue;
        }
        console.log(`[ArticlePage V59] Found article by exact slug match: "${slugCandidate}" → id="${found.id}"`);
        // V59: Fire-and-forget views update (no await)
        db.newsItem.update({ where: { id: found.id }, data: { views: { increment: 1 } } }).catch(err => console.warn('[ArticlePage V156] View count increment failed:', err instanceof Error ? err.message : err));
        result = formatArticleFromDb(found);
        break;
      }
    } catch (err: any) {
      console.warn(`[ArticlePage V59] Slug lookup error for "${slugCandidate}": ${err.message}`);
    }
  }

  // Strategy 2: Direct ID lookup
  if (!result) {
    for (const idCandidate of slugCandidates) {
      let directResult: any = null;
      try {
        directResult = await db.newsItem.findUnique({
          where: { id: idCandidate, isReady: true, isPublished: true },
          select: safeSelect,
        });
      } catch (selectErr: any) {
        if (selectErr.message?.includes('column')) {
          directResult = await db.newsItem.findUnique({
            where: { id: idCandidate, isReady: true, isPublished: true },
            select: safeSelect,
          }).catch(err => { console.warn('[ArticlePage V156] DB lookup failed:', err instanceof Error ? err.message : err); return null; });
        }
      }
      if (directResult) {
        // V-LOCALE: If non-Arabic article found, redirect to correct locale
        const directLocale = (directResult as any).locale as string;
        if (['en', 'es', 'fr', 'tr'].includes(directLocale)) {
          console.log(`[ArticlePage] ${directLocale.toUpperCase()} article found by ID, redirecting to /${directLocale}/news/${directResult.slug || idCandidate}`);
          return { redirect: `/${directLocale}/news/${directResult.slug || idCandidate}` } as any;
        }
        console.log(`[ArticlePage V59] Found article by ID match: "${idCandidate}"`);
        result = formatArticleFromDb(directResult);
        break;
      }
    }
  }

  // Strategy 3: URL field match
  if (!result) {
    for (const urlCandidate of slugCandidates) {
      let urlMatch: any = null;
      try {
        urlMatch = await db.newsItem.findFirst({
          where: { url: urlCandidate, isReady: true, isPublished: true, locale: 'ar' },
          select: safeSelect,
        });
      } catch (selectErr: any) {
        if (selectErr.message?.includes('column')) {
          urlMatch = await db.newsItem.findFirst({
            where: { url: urlCandidate, isReady: true, isPublished: true, locale: 'ar' },
            select: safeSelect,
          }).catch(err => { console.warn('[ArticlePage V156] DB lookup failed:', err instanceof Error ? err.message : err); return null; });
        }
      }
      if (urlMatch) {
        console.log(`[ArticlePage V59] Found article by URL match: "${urlCandidate}"`);
        result = formatArticleFromDb(urlMatch);
        break;
      }
    }
  }

  // Strategy 4: Fuzzy slug match with contains
  if (!result) {
    const searchSlug = decodedSlug.replace(/\s+/g, '-');
    if (searchSlug.length > 5) {
      try {
        const searchPortion = searchSlug.slice(0, Math.min(searchSlug.length, 40));
        // V59: Select only lightweight fields for fuzzy match (EGRESS FIX: no generatedImage base64, no aiAnalysis)
        const slugContains = await db.newsItem.findFirst({
          where: {
            slug: { startsWith: searchPortion.slice(0, 20) },
            isReady: true,
            isPublished: true,
            locale: 'ar',
            fetchedAt: { gte: new Date(Date.now() - 720 * 60 * 60 * 1000) },
          },
          orderBy: { fetchedAt: 'desc' },
          select: safeSelect,
        });
        if (slugContains) {
          console.log(`[ArticlePage V59] Found article by fuzzy slug match: "${searchPortion}"`);
          // V59: Fire-and-forget views update
          db.newsItem.update({ where: { id: slugContains.id }, data: { views: { increment: 1 } } }).catch(err => console.warn('[ArticlePage V156] View count increment failed:', err instanceof Error ? err.message : err));
          result = formatArticleFromDb(slugContains);
        }
      } catch {}
    }
  }

  // Strategy 5: Arabic title word matching
  // EGRESS FIX: Optimized — selects only lightweight fields (id, slug, titleAr, title) for matching
  // instead of ALL columns (was pulling generatedImage base64 + contentAr + aiAnalysis for 100 articles)
  if (!result && /[\u0600-\u06FF]/.test(decodedSlug)) {
    const arabicWords = decodedSlug.split(/[-_\s]+/).filter(w => w.length > 2 && /[\u0600-\u06FF]/.test(w));
    if (arabicWords.length >= 2) {
      try {
        // V59: Select ONLY the fields needed for matching — no heavy columns
        const recentArticles = await db.newsItem.findMany({
          where: {
            isReady: true,
            isPublished: true,
            locale: 'ar',
            fetchedAt: { gte: new Date(Date.now() - 720 * 60 * 60 * 1000) },
          },
          orderBy: { fetchedAt: 'desc' },
          take: 100,
          select: {
            id: true,
            slug: true,
            titleAr: true,
            title: true,
          },
        });

        let bestMatchId: string | null = null;
        let bestMatchScore = 0;

        for (const article of recentArticles) {
          const searchText = `${article.slug || ''} ${article.titleAr || article.title || ''}`.replace(/-/g, ' ');
          let matchCount = 0;
          for (const word of arabicWords) {
            if (searchText.includes(word)) matchCount++;
          }
          const matchScore = matchCount / arabicWords.length;
          const minMatchCount = arabicWords.length <= 3 ? arabicWords.length : 3;
          if (matchScore > bestMatchScore && matchScore >= 0.6 && matchCount >= Math.min(minMatchCount, 2)) {
            bestMatchId = article.id;
            bestMatchScore = matchScore;
          }
        }

        if (bestMatchId) {
          // Now fetch the FULL article data only for the best match
          let fullArticle: any = null;
          try {
            fullArticle = await db.newsItem.findUnique({
              where: { id: bestMatchId },
              select: safeSelect,
            });
          } catch {}
          if (fullArticle) {
            console.log(`[ArticlePage V59] Found article by Arabic word matching (score=${bestMatchScore})`);
            // V59: Fire-and-forget views update
            db.newsItem.update({ where: { id: bestMatchId }, data: { views: { increment: 1 } } }).catch(err => console.warn('[ArticlePage V156] View count increment failed:', err instanceof Error ? err.message : err));
            result = formatArticleFromDb(fullArticle);
          }
        }
      } catch (err: any) {
        console.warn('[ArticlePage V59] Arabic word search failed:', err.message);
      }
    }
  }

  // Strategy 6: Archive table fallback — articles are moved to news_item_archives after 60 days
  // Telegram links must continue working even after archival
  if (!result) {
    for (const slugCandidate of slugCandidates) {
      try {
        let archived: any = null;
        try {
          archived = await db.newsItemArchive.findUnique({
            where: { slug: slugCandidate },
            select: safeSelect,
          });
        } catch {}

        if (archived && archived.isReady && archived.isPublished) {
          // V-LOCALE: Redirect non-Arabic archived articles to correct locale
          const archiveLocale = (archived as any).locale as string;
          if (['en', 'es', 'fr', 'tr'].includes(archiveLocale)) {
            console.log(`[ArticlePage] ${archiveLocale.toUpperCase()} archived article found, redirecting to /${archiveLocale}/news/${slugCandidate}`);
            return { redirect: `/${archiveLocale}/news/${slugCandidate}` } as any;
          }
          console.log(`[ArticlePage] Found article in ARCHIVE by slug: "${slugCandidate}"`);
          result = formatArticleFromDb(archived);
          break;
        }
      } catch (err: any) {
        console.warn(`[ArticlePage] Archive slug lookup error for "${slugCandidate}": ${err.message}`);
      }
    }
  }

  // Strategy 7: Archive table — ID lookup
  if (!result) {
    for (const idCandidate of slugCandidates) {
      try {
        const archivedById: any = await db.newsItemArchive.findUnique({
          where: { id: idCandidate },
          select: safeSelect,
        }).catch(() => null);
        if (archivedById && archivedById.isReady && archivedById.isPublished) {
          // V-LOCALE: Redirect non-Arabic archived articles to correct locale
          const archivedLocale = (archivedById as any).locale as string;
          if (['en', 'es', 'fr', 'tr'].includes(archivedLocale)) {
            console.log(`[ArticlePage] ${archivedLocale.toUpperCase()} archived article found by ID, redirecting to /${archivedLocale}/news/${idCandidate}`);
            return { redirect: `/${archivedLocale}/news/${idCandidate}` } as any;
          }
          console.log(`[ArticlePage] Found article in ARCHIVE by ID: "${idCandidate}"`);
          result = formatArticleFromDb(archivedById);
          break;
        }
      } catch {}
    }
  }

  if (!result) {
    console.warn(`[ArticlePage V59] Article not found for slug="${slug}" (checked main + archive tables)`);
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

// ─── Generate Dynamic Metadata for SEO ──────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  let { slug } = await params;

  try {
    if (slug && slug.includes('%')) {
      slug = decodeURIComponent(slug);
    }
  } catch {}

  if (!slug || slug === 'undefined' || slug === 'null') {
    return {
      title: 'المقال غير موجود - رؤى للأخبار المالية',
      description: 'منصة الأخبار المالية والتحليلات بالذكاء الاصطناعي',
    };
  }

  try {
    const articleResult = await fetchArticleBySlug(slug);

    // FIX: If English article found at Arabic route, skip metadata (redirect will handle it)
    if (articleResult && typeof articleResult === 'object' && 'redirect' in articleResult) {
      return {
        title: 'رؤى للأخبار المالية',
        description: 'منصة الأخبار المالية والتحليلات بالذكاء الاصطناعي',
      };
    }

    const article = articleResult;

    if (!article) {
      return {
        title: 'المقال غير موجود - رؤى للأخبار المالية',
        description: 'منصة الأخبار المالية والتحليلات بالذكاء الاصطناعي',
      };
    }

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

    // V72: Apply translation fixes to SEO title too (أسهم النفط → عقود النفط الآجلة)
    const rawTitle = article.titleAr || article.translatedTitle || article.title;
    const title = rawTitle.replace(/أسهم النفط الخام/g, 'عقود النفط الخام الآجلة').replace(/أسهم النفط/g, 'عقود النفط الآجلة').replace(/أسهم الذهب/g, 'عقود الذهب الآجلة').replace(/أسهم السلع/g, 'عقود السلع الآجلة').replace(/تليق بزيادة/g, 'يؤدي إلى زيادة').replace(/تليق بانخفاض/g, 'يؤدي إلى انخفاض').replace(/تليق ب/g, 'يؤدي إلى');
    // V72: Filter English from SEO description — never show English in meta tags
    const rawDescription = article.summaryAr || article.translatedSummary || article.summary;
    // Apply translation fixes + English filter to SEO description
    let description = rawDescription || '';
    description = description.replace(/أسهم النفط الخام/g, 'عقود النفط الخام الآجلة').replace(/أسهم النفط/g, 'عقود النفط الآجلة').replace(/تليق ب/g, 'يؤدي إلى');
    if (description && /[a-zA-Z]{3,}\s+[a-zA-Z]{3,}\s+[a-zA-Z]{3,}\s+[a-zA-Z]{3,}\s+[a-zA-Z]{3,}/.test(description)) {
      // Description has English sentences — use fixed Arabic title as fallback
      description = title;
    }
    const articleImageUrl = article.imageUrl || `${baseUrl}/og-image.png`;
    const articleUrl = `${baseUrl}/article/${slug}`;

    return {
      // V154: Truncate SEO title to 60 chars max (Google cuts at ~60)
      title: `${fixDollarSigns(title.length > 60 ? title.slice(0, 57) + '...' : title)} - رؤى للأخبار المالية`,
      description: fixDollarSigns(description?.slice(0, 160) || ''),
      openGraph: {
        title: fixDollarSigns(title.slice(0, 100)),
        description: fixDollarSigns(description?.slice(0, 160) || ''),
        url: articleUrl,
        siteName: 'رؤى للأخبار المالية',
        locale: 'ar_AR',
        type: 'article',
        images: [{ url: articleImageUrl, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: fixDollarSigns(title),
        description: fixDollarSigns(description?.slice(0, 160) || ''),
        images: [articleImageUrl],
      },
      alternates: {
        canonical: `/article/${slug}`,
      },
    };
  } catch {
    return {
      title: 'رؤى للأخبار المالية',
      description: 'منصة الأخبار المالية والتحليلات بالذكاء الاصطناعي',
    };
  }
}

// ─── Server Page Component ──────────────────────────────────
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  let { slug } = await params;

  try {
    if (slug && slug.includes('%')) {
      slug = decodeURIComponent(slug);
    }
  } catch {}

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
    const fetchResult = await fetchArticleBySlug(slug);
    // FIX: If the article is English locale, redirect to /en/news/[slug]
    if (fetchResult && typeof fetchResult === 'object' && 'redirect' in fetchResult) {
      redirect((fetchResult as any).redirect);
    }
    articleData = fetchResult;
  } catch (err: any) {
    console.error('[ArticlePage V59] Fatal error fetching article:', err.message);
  }

  if (!articleData) {
    notFound();
  }

  // Article found — always show it. If isReady=false, the client component
  // will show a "preparing" message. NEVER 404 for an article that exists.
  return (
    <ArticleErrorBoundary>
      <ArticlePageClient initialData={articleData!} />
    </ArticleErrorBoundary>
  );
}
