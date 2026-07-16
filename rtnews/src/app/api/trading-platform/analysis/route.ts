import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API to fetch content agent analyses from roua-trading platform.
 * Uses the X-Integration-Key for server-to-server authentication.
 * Returns published analysis articles with support/resistance levels,
 * technical indicators, price targets, and risk warnings.
 *
 * V181: Filters out articles that contain API error messages in their
 * title/content/summary — these are artifacts from failed AI generation
 * in the upstream platform that should never reach the UI.
 *
 * V317: Added Arabic content filtering when locale=en — prevents Arabic
 * articles from leaking onto the English analysis page. Detects Arabic
 * Unicode characters (U+0600-U+06FF) in title/content/summary.
 */

const PLATFORM_URL = process.env.INTEGRATION_PARTNER_URL || process.env.TRADING_PLATFORM_URL || 'https://roua-trading-production.up.railway.app';
const INTEGRATION_KEY = process.env.INTEGRATION_API_KEY || process.env.TRADING_PLATFORM_INTEGRATION_KEY || '';

// ── V12: Translation cache + function ──────────────────────────
// In-memory cache for translated text. Key = `${locale}:${hash(text)}`.
// TTL = 1 hour (3600000ms). Prevents re-translating the same text on
// every page load. Cache is per-server-instance (not shared across
// instances) but that's fine — translations are idempotent.
const translationCache = new Map<string, { text: string; expiresAt: number }>();
const TRANSLATION_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const LOCALE_NAMES: Record<string, string> = {
  fr: 'French',
  tr: 'Turkish',
  es: 'Spanish',
};

/**
 * Translate text to the target locale using the project's AI provider chain
 * (OpenRouter → Grok → GLM → Bedrock → Gemini — 12+ providers with fallback).
 * Uses in-memory cache to avoid re-translating on every request.
 * Falls back to original text if translation fails.
 *
 * @param text Text to translate
 * @param locale Target locale (fr, tr, es)
 * @param timeoutMs Timeout in milliseconds (default 8000, use 15000 for long content)
 */
async function translateText(text: string, locale: string, timeoutMs: number = 8000): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  if (locale === 'ar' || locale === 'en') return text; // no translation needed

  const targetLanguage = LOCALE_NAMES[locale];
  if (!targetLanguage) return text;

  // Check cache
  const cacheKey = `${locale}:${text.substring(0, 200)}`;
  const cached = translationCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.text;
  }

  try {
    // Use the project's AI provider chain (12+ providers with automatic fallback)
    // instead of z-ai-web-dev-sdk alone. This ensures translation works even if
    // one provider is down.
    const { chatCompletion } = await import('@/lib/ai-provider');

    const result = await Promise.race([
      chatCompletion(
        [
          {
            role: 'system',
            content: `You are a professional financial translator. Translate the following text to ${targetLanguage}. Rules:
1. Preserve ALL markdown formatting (###, **, -, bullet lists, etc.)
2. Keep all numbers, prices, percentages, and currency symbols EXACTLY as-is
3. Keep all ticker symbols (BTC, ETH, EUR/USD, XAU/USD) in English
4. Translate financial terms accurately
5. Return ONLY the translated text — no explanations, no quotes, no preamble`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        {
          temperature: 0.3,
          maxTokens: 4000,
          priority: 'translation',
          locale: locale as 'ar' | 'en' | 'fr' | 'tr' | 'es',
        }
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Translation timeout (${timeoutMs}ms)`)), timeoutMs)
      ),
    ]);

    const translated = result.content?.trim() || text;

    // Cache the result
    translationCache.set(cacheKey, { text: translated, expiresAt: Date.now() + TRANSLATION_CACHE_TTL });

    // Clean up expired entries periodically
    if (translationCache.size > 200) {
      const now = Date.now();
      for (const [k, v] of translationCache) {
        if (now > v.expiresAt) translationCache.delete(k);
      }
    }

    return translated;
  } catch (err: any) {
    console.warn(`[Translation V12] Failed to translate to ${locale} (${timeoutMs}ms): ${err?.message?.slice(0, 100)}`);
    return text; // fallback to original
  }
}

/** Patterns that indicate an article is an error artifact, not real content */
const ERROR_PATTERNS = [
  /GLM API error/i,
  /API error/i,
  /timeout of \d+ms exceeded/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /fetch failed/i,
  /Internal Server Error/i,
  /502 Bad Gateway/i,
  /503 Service Unavailable/i,
  /circuit breaker/i,
  /rate limit/i,
  /Too Many Requests/i,
];

/**
 * Check if an article is an error artifact (failed AI generation
 * that leaked into the database as content).
 */
function isErrorArticle(article: Record<string, any>): boolean {
  const fieldsToCheck = [article.title, article.content, article.summary];
  for (const field of fieldsToCheck) {
    if (typeof field !== 'string') continue;
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.test(field)) return true;
    }
  }
  return false;
}

/**
 * V317: Detect if text contains significant Arabic content.
 * Arabic Unicode range: U+0600-U+06FF (Arabic), U+0750-U+077F (Arabic Supplement),
 * U+08A0-U+08FF (Arabic Extended-A), U+FB50-U+FDFF (Arabic Presentation Forms-A),
 * U+FE70-U+FEFF (Arabic Presentation Forms-B)
 * We check for at least 3 Arabic characters to avoid false positives from numbers/symbols.
 */
function isArabicContent(text: string): boolean {
  if (typeof text !== 'string' || text.length === 0) return false;
  const arabicCharCount = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
  return arabicCharCount >= 3;
}

/**
 * V350: Sanitize stock analysis titles from the trading platform.
 * Removes template prefixes like "Comprehensive Analysis:", "Technical Analysis:", etc.
 * and reconstructs clean titles using symbol and sentiment data.
 */
const STOCK_TITLE_PREFIXES = [
  /Comprehensive\s+Analysis\s*:\s*/i,
  /Technical\s+Analysis\s*:\s*/i,
  /Fundamental\s+Analysis\s*:\s*/i,
  /Full\s+Analysis\s*:\s*/i,
  /Risk\s+Analysis\s*:\s*/i,
  /News\s+Impact\s*:\s*/i,
  /Weekly\s+Outlook\s*:\s*/i,
  /Daily\s+Analysis\s*:\s*/i,
  /Market\s+Analysis\s*:\s*/i,
  /Quick\s+Analysis\s*:\s*/i,
  /In-Depth\s+Analysis\s*:\s*/i,
  /Entry\/Exit\s+Analysis\s*:\s*/i,
  /AI\s+Analysis\s*:\s*/i,
  /Analysis\s*:\s*/i,
];

const SENTIMENT_WORDS_API = ['Bullish', 'Bearish', 'Neutral', 'Positive', 'Negative', 'Strong Buy', 'Strong Sell', 'Buy', 'Sell', 'Hold'];

function sanitizeTitleForApi(article: Record<string, any>, locale: string): Record<string, any> {
  const rawTitle = String(article.title || '').trim();
  if (!rawTitle) return article;

  // Check if the title matches a template pattern
  const hasTemplatePrefix = STOCK_TITLE_PREFIXES.some(rx => rx.test(rawTitle));
  if (!hasTemplatePrefix) return article;

  // Strip the template prefix
  let t = rawTitle;
  for (const rx of STOCK_TITLE_PREFIXES) {
    t = t.replace(rx, '');
  }
  t = t.trim();

  // Determine sentiment
  const sentiment = String(article.sentiment || '');
  let sLabel = 'Neutral';
  if (/bull|positive|up/i.test(sentiment)) sLabel = 'Bullish';
  else if (/bear|negative|down/i.test(sentiment)) sLabel = 'Bearish';

  // Remove sentiment word from remaining title
  for (const sw of SENTIMENT_WORDS_API) {
    t = t.replace(new RegExp(`^${sw}\\s+`, 'i'), '');
  }

  // Get symbols
  const symbols: string[] = Array.isArray(article.symbols)
    ? article.symbols
    : typeof article.symbols === 'string'
      ? (() => { try { const p = JSON.parse(article.symbols); return Array.isArray(p) ? p : article.symbols.split(',').filter(Boolean); } catch { return article.symbols.split(',').filter(Boolean); } })()
      : [];

  const primarySymbol = symbols.length > 0 ? symbols[0] : '';

  // Pattern: "C CAT" (broken first letter + symbol)
  const singleLetterMatch = t.match(/^([A-Z])\s+([A-Z]{2,5})$/);
  if (singleLetterMatch) {
    return { ...article, title: `${singleLetterMatch[2]} – ${sLabel}` };
  }

  // Pattern: "Caterpillar Inc. (CAT)"
  const nameWithSymbol = t.match(/^(.+?)\s*\(([A-Z]{1,5})\)\s*$/);
  if (nameWithSymbol) {
    return { ...article, title: `${nameWithSymbol[1].trim()} (${nameWithSymbol[2]}) – ${sLabel}` };
  }

  // Use symbol from data if available
  if (primarySymbol) {
    const displaySymbol = primarySymbol.replace('/USDT', '').replace('/USD', '');
    const remaining = t.replace(new RegExp(`\\b${displaySymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'), '').trim();
    if (remaining && remaining.length > 1 && remaining !== displaySymbol) {
      return { ...article, title: `${remaining} (${displaySymbol}) – ${sLabel}` };
    }
    return { ...article, title: `${displaySymbol} – ${sLabel}` };
  }

  // Fallback
  if (t) {
    return { ...article, title: `${t} – ${sLabel}` };
  }

  return article;
}

/**
 * V317: Check if an article's primary language is Arabic.
 * Examines title, content, and summary for Arabic text.
 */
function isArabicArticle(article: Record<string, any>): boolean {
  const title = String(article.title || '');
  const content = String(article.content || '');
  const summary = String(article.summary || '');
  // If title is Arabic, the article is definitely Arabic
  if (isArabicContent(title)) return true;
  // If content has significant Arabic text (more than 20% of first 500 chars), it's Arabic
  const contentSample = content.slice(0, 500);
  if (isArabicContent(contentSample)) {
    const arabicChars = (contentSample.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
    const totalChars = contentSample.replace(/\s/g, '').length;
    if (totalChars > 0 && (arabicChars / totalChars) > 0.15) return true;
  }
  // If summary is Arabic, likely Arabic article
  if (isArabicContent(summary)) return true;
  return false;
}

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET(req: NextRequest) {
  try {
    const limit = req.nextUrl.searchParams.get('limit') || '5';
    const category = req.nextUrl.searchParams.get('category');
    const type = req.nextUrl.searchParams.get('type');
    const symbol = req.nextUrl.searchParams.get('symbol');
    const locale = req.nextUrl.searchParams.get('locale') || 'ar';

    // Request more articles than needed so we have buffer after filtering errors
    const requestedLimit = Math.min(parseInt(limit, 10) || 5, 20);
    const fetchLimit = Math.min(requestedLimit * 3, 30); // 3x buffer for error articles

    let url = `${PLATFORM_URL}/api/integration/content-feed?limit=${fetchLimit}&locale=${encodeURIComponent(locale)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;
    if (symbol) url += `&symbol=${encodeURIComponent(symbol)}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add integration key if available
    if (INTEGRATION_KEY) {
      headers['X-Integration-Key'] = INTEGRATION_KEY;
    }

    const resp = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      // If the integration endpoint isn't available yet, return empty
      return NextResponse.json({
        success: false,
        articles: [],
        count: 0,
        error: `Platform returned ${resp.status}`,
        timestamp: new Date().toISOString(),
      });
    }

    const data = await resp.json();

    // V181: Filter out error artifacts from the articles array
    const rawArticles: Record<string, any>[] = Array.isArray(data.articles) ? data.articles : [];
    let cleanArticles = rawArticles.filter(a => !isErrorArticle(a));
    let errorFiltered = rawArticles.length - cleanArticles.length;

    if (errorFiltered > 0) {
      console.log(`[Analysis API V181] Filtered ${errorFiltered} error article(s) from ${rawArticles.length} total`);
    }

    // V350: Sanitize template-based titles from the trading platform
    cleanArticles = cleanArticles.map(a => sanitizeTitleForApi(a, locale));

    // V317: Filter out Arabic content for ALL non-Arabic locales
    let localeFiltered = 0;
    if (locale !== 'ar') {
      const beforeCount = cleanArticles.length;
      const nonArabicArticles = cleanArticles.filter(a => !isArabicArticle(a));
      
      if (nonArabicArticles.length >= 1) {
        // We have at least 1 non-Arabic article — filter out Arabic ones
        cleanArticles = nonArabicArticles;
        localeFiltered = beforeCount - cleanArticles.length;
      } else {
        // ALL articles are Arabic — keep them as fallback rather than
        // showing an empty page. The user sees Arabic content but at least
        // the page isn't broken.
        console.log(`[Analysis API V317] All ${beforeCount} articles are Arabic — keeping as fallback for locale=${locale}`);
      }
      
      if (localeFiltered > 0) {
        console.log(`[Analysis API V317] Filtered ${localeFiltered} Arabic article(s) for locale=${locale} from ${beforeCount} candidates`);
      }
    }

    const filteredCount = errorFiltered + localeFiltered;

    // Return only the requested number of clean articles
    const trimmedArticles = cleanArticles.slice(0, requestedLimit);

    // FIX V12: Translate title + summary + content for non-Arabic, non-English locales.
    // The content agent only generates Arabic + English. For French/Turkish/Spanish
    // pages, we translate ALL text fields on-the-fly using z-ai-web-dev-sdk
    // (free, built-in). Cached for 1 hour to avoid re-translating.
    if (locale === 'fr' || locale === 'tr' || locale === 'es') {
      try {
        const translated = await Promise.all(
          trimmedArticles.map(async (article) => {
            try {
              // Translate title + summary + content in parallel
              // Content gets a longer timeout (15s) since it's longer text
              const [translatedTitle, translatedSummary, translatedContent] = await Promise.all([
                translateText(article.title || '', locale, 8000),
                translateText(article.summary || '', locale, 8000),
                translateText(article.content || '', locale, 15000),
              ]);
              return {
                ...article,
                title: translatedTitle || article.title,
                summary: translatedSummary || article.summary,
                content: translatedContent || article.content,
                _translated: true,
              };
            } catch {
              // Translation failed — return original English
              return { ...article, _translated: false };
            }
          })
        );
        trimmedArticles.length = 0;
        trimmedArticles.push(...translated);
        console.log(`[Analysis API V12] Translated ${trimmedArticles.length} articles (title+summary+content) to ${locale}`);
      } catch (translateErr: any) {
        console.warn(`[Analysis API V12] Translation batch failed for ${locale}: ${translateErr?.message?.slice(0, 100)}`);
        // Continue with untranslated articles — better than failing
      }
    }

    return NextResponse.json({
      ...data,
      articles: trimmedArticles,
      count: trimmedArticles.length,
      _meta: {
        totalFetched: rawArticles.length,
        errorArticlesFiltered: filteredCount,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        articles: [],
        count: 0,
        error: error.message || 'Failed to fetch content agent analyses',
        timestamp: new Date().toISOString(),
      },
      { status: 200 } // Return 200 with empty data so UI doesn't break
    );
  }
}
