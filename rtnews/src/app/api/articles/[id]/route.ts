// ─── Single Article API ─────────────────────────────────────
// DB-only architecture: All article data comes from the database.
// No URL query params, no fallback article construction.
// Lookup strategies: slug → ID → base64 decode → URL match
// If not found, return 404.
// NOTE: Title search removed — it matched WRONG articles.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fromUrlSafeBase64 } from '@/lib/news-sources';

function tryDecodeBase64Url(b64Part: string): string | null {
  try {
    const decoded = fromUrlSafeBase64(b64Part);
    if (decoded.startsWith('http')) return decoded;
  } catch {}
  try {
    const decoded = Buffer.from(b64Part, 'base64').toString();
    if (decoded.startsWith('http')) return decoded;
  } catch {}
  return null;
}

function tryPartialDecode(b64Part: string): string | null {
  for (let len = b64Part.length; len >= 8; len -= 4) {
    try {
      const partial = b64Part.slice(0, len);
      const decoded = fromUrlSafeBase64(partial);
      if (decoded.startsWith('http')) return decoded;
    } catch {}
    try {
      const partial = b64Part.slice(0, len);
      const decoded = Buffer.from(partial, 'base64').toString();
      if (decoded.startsWith('http')) return decoded;
    } catch {}
  }
  return null;
}

// ── Circuit Breaker for Database ──
const circuitBreaker = {
  failureCount: 0,
  lastFailureTime: 0,
  isOpen: false,
  THRESHOLD: 3,
  RECOVERY_TIMEOUT: 10_000,

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.THRESHOLD) {
      this.isOpen = true;
      console.warn(`[Article API] Circuit breaker OPEN — DB unavailable for ${this.RECOVERY_TIMEOUT / 1000}s`);
    }
  },

  recordSuccess() {
    this.failureCount = 0;
    this.isOpen = false;
  },

  canAttempt(): boolean {
    if (!this.isOpen) return true;
    if (Date.now() - this.lastFailureTime >= this.RECOVERY_TIMEOUT) {
      this.isOpen = false;
      this.failureCount = 0;
      console.log('[Article API] Circuit breaker CLOSED — retrying DB connection');
      return true;
    }
    return false;
  },
};

async function safeDbQuery<T>(queryFn: () => Promise<T>): Promise<T | null> {
  if (!circuitBreaker.canAttempt()) return null;
  try {
    const result = await queryFn();
    circuitBreaker.recordSuccess();
    return result;
  } catch (dbErr: any) {
    console.error('[Article API] DB query error:', dbErr.message);
    if (dbErr.message?.includes('connect') || dbErr.message?.includes('timeout') || dbErr.message?.includes('ECONNREFUSED')) {
      circuitBreaker.recordFailure();
    }
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── Early validation: reject clearly invalid IDs ──
    if (!id || id === 'undefined' || id === 'null' || id === '') {
      return NextResponse.json({ error: 'معرّف المقال غير صالح' }, { status: 400 });
    }

    // ── Decode if double-encoded (handles %25xx patterns) ──
    let decodedId = id;
    try {
      if (id.includes('%')) {
        decodedId = decodeURIComponent(id);
      }
    } catch {}

    // ── Strategy 1: Slug lookup (exact match — slug is @unique) ──
    // Try: raw id → decoded id → double-decoded id
    const slugCandidates = [id];
    if (decodedId !== id) slugCandidates.push(decodedId);
    // Also try double-decoding (handles %25xx patterns)
    if (decodedId.includes('%')) {
      try {
        const doubleDecoded = decodeURIComponent(decodedId);
        if (doubleDecoded !== decodedId && !slugCandidates.includes(doubleDecoded)) {
          slugCandidates.push(doubleDecoded);
        }
      } catch {}
    }

    for (const slugCandidate of slugCandidates) {
      const slugResult = await safeDbQuery(() => db.newsItem.findFirst({ where: { slug: slugCandidate } })) as any;
      if (slugResult) {
        // V59: Fire-and-forget views update (no await)
        safeDbQuery(() => db.newsItem.update({
          where: { id: slugResult.id },
          data: { views: { increment: 1 } }
        }));
        return NextResponse.json(formatArticle(slugResult));
      }
    }

    // ── Strategy 2: Direct ID lookup ──
    const directResult = await safeDbQuery(() => db.newsItem.findUnique({ where: { id } }))
      ?? (decodedId !== id ? await safeDbQuery(() => db.newsItem.findUnique({ where: { id: decodedId } })) : null);
    if (directResult) return NextResponse.json(formatArticle(directResult));

    // ── Strategy 3: Decode prefixed ID (live-xxx, breaking-xxx, article-xxx) ──
    const prefixMatch = id.match(/^(live|breaking|article)-(.+)$/);
    if (prefixMatch) {
      const b64Part = prefixMatch[2];
      const decodedUrl = tryDecodeBase64Url(b64Part);
      if (decodedUrl) {
        const a = await safeDbQuery(() => db.newsItem.findFirst({ where: { url: decodedUrl } }));
        if (a) return NextResponse.json(formatArticle(a));
      }
      const partialUrl = tryPartialDecode(b64Part);
      if (partialUrl && partialUrl.length > 10) {
        const a = await safeDbQuery(() => db.newsItem.findFirst({ where: { url: { startsWith: partialUrl.slice(0, 30) } } }));
        if (a) return NextResponse.json(formatArticle(a));
      }
    }

    // ── Strategy 4: URL field as-is ──
    const urlMatch = await safeDbQuery(() => db.newsItem.findFirst({ where: { url: id } }));
    if (urlMatch) return NextResponse.json(formatArticle(urlMatch));

    // ── Strategy 5: Decode entire id as base64 ──
    const decodedFull = tryDecodeBase64Url(id);
    if (decodedFull) {
      const a = await safeDbQuery(() => db.newsItem.findFirst({ where: { url: decodedFull } }));
      if (a) return NextResponse.json(formatArticle(a));
    }

    // ── Strategy 6 REMOVED: Title search with `contains` was matching WRONG articles ──
    // Previously, a `contains` search on title/titleAr could return a different article.
    // Since slug is @unique, slug lookup is exact. If we reach here, the article truly doesn't exist.

    // ── Not found in DB ──
    return NextResponse.json({ error: 'المقال غير موجود في قاعدة البيانات' }, { status: 404 });
  } catch (error: any) {
    console.error('[Article API] Fatal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatArticle(article: any) {
  let parsedAnalysis: any = {};
  try {
    parsedAnalysis = article.aiAnalysis ? JSON.parse(article.aiAnalysis) : {};
  } catch {}

  // Fix doubled dollar signs (e.g., $$4 → $4) from RSS feeds and AI translations
  const fixDollarSigns = (text: string): string => text ? text.replace(/\$\$/g, '$') : text;

  // Ensure all content fields are ALWAYS strings (fixes d.body.split is not a function)
  const content = fixDollarSigns(String(parsedAnalysis.fullContent || ''));
  const introduction = fixDollarSigns(String(parsedAnalysis.introduction || ''));
  const body = fixDollarSigns(typeof parsedAnalysis.body === 'string' ? parsedAnalysis.body
    : Array.isArray(parsedAnalysis.body) ? parsedAnalysis.body.join('\n')
    : String(parsedAnalysis.body || ''));
  const conclusion = fixDollarSigns(String(parsedAnalysis.conclusion || ''));
  const hasFullContent = !!(content || introduction || body || conclusion);
  const summary = fixDollarSigns(String(article.summary || ''));

  // ── Include contentAr (pre-translated source content) directly ──
  // This eliminates the need for a separate /api/articles/fetch call
  const contentAr = fixDollarSigns(String(article.contentAr || ''));
  const hasSourceContent = !!(contentAr && contentAr.length > 20 && /[\u0600-\u06FF]/.test(contentAr));

  let affectedAssets: any[] = [];
  try {
    affectedAssets = JSON.parse(article.affectedAssets || '[]');
  } catch {}

  let keyTakeaways: string[] = [];
  try {
    const raw = parsedAnalysis.keyTakeaways;
    if (Array.isArray(raw)) keyTakeaways = raw.map((item: any) => {
      if (typeof item === 'string') return item;
      if (item != null && typeof item === 'object') {
        // Try common text properties
        if (typeof item.text === 'string') return item.text;
        if (typeof item.content === 'string') return item.content;
        if (typeof item.value === 'string') return item.value;
        return JSON.stringify(item);
      }
      return String(item || '');
    }).filter((s: string) => s.length > 0);
  } catch {}

  // ── Include parsed analysis fields for direct use ──
  const parsedSentiment = parsedAnalysis.sentiment || null;
  const parsedRecommendation = parsedAnalysis.recommendation || null;
  const parsedAffectedAssets = Array.isArray(parsedAnalysis.affectedAssets) ? parsedAnalysis.affectedAssets : null;

  return {
    id: article.id,
    title: String(article.title || ''),
    slug: article.slug || '',
    summary,
    source: String(article.source || ''),
    sourceName: String(article.sourceName || article.source || ''),
    originalUrl: article.url || '',
    category: article.category || 'اقتصاد كلي',
    sentiment: article.sentiment || 'neutral',
    sentimentScore: article.sentimentScore || 55,
    impactLevel: article.impactLevel || 'low',
    originalLanguage: article.originalLanguage || 'ar',
    affectedAssets,
    translatedTitle: article.titleAr || undefined,
    translatedSummary: article.summaryAr || undefined,
    imageUrl: article.imageUrl || undefined,
    publishedAt: article.fetchedAt,
    createdAt: article.createdAt,
    // ── Pre-translated source content (from DB contentAr field) ──
    contentAr,
    hasSourceContent,
    // ── AI-generated analysis content (from DB aiAnalysis field) ──
    content,
    introduction,
    body,
    conclusion,
    keyTakeaways,
    hasFullContent,
    // ── Parsed analysis details ──
    analysis: parsedAnalysis.analysis || null,
    analysisSentiment: parsedSentiment,
    analysisRecommendation: parsedRecommendation,
    analysisAffectedAssets: parsedAffectedAssets,
    seo: parsedAnalysis.seo || null,
    wordCount: parsedAnalysis.wordCount || 0,
    editsCount: parsedAnalysis.editsCount || 0,
    newsType: article.newsType || 'live',
  };
}
