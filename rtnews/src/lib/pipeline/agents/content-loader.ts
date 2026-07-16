// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════
// ─── Content Loader Agent V146 ────────────────────────────────
// Fetches full article content from the source URL and stores it
// in the `content` field BEFORE the unified processor runs.
//
// WHY: The pipeline currently only uses RSS summaries (≤500 chars)
// which means the AI has minimal source material. By scraping the
// full article content from the source URL, the unified processor
// gets much richer input (up to 12,000 chars), producing more
// detailed and accurate Arabic articles.
//
// APPROACH:
// 1. Try direct HTTP fetch with browser-like User-Agent
// 2. If blocked (403, paywall), try z-ai-web-dev-sdk page_reader
// 3. Extract article content from HTML using smart parsing
// 4. V146: If article is from a secondary source (Seeking Alpha, etc.),
//    detect the original source URL and try to scrape it for richer content
// 5. Store extracted content in `content` field
// 6. Graceful failure — if scraping fails, pipeline continues
//    with just the RSS summary (same as before V145)

import { db } from '@/lib/db';

// ── Secondary Source Detection (V146) ──
// Some sources republish articles from other sources with shorter summaries.
// We detect these and try to scrape the ORIGINAL source for richer content.
const SECONDARY_SOURCES: Record<string, {
  domain: string;
  originalUrlPatterns: RegExp[];
}> = {
  seekingalpha: {
    domain: 'seekingalpha.com',
    // Seeking Alpha articles often link to the original source in various patterns:
    // - "Originally published on FT.com" or "Source: Financial Times"
    // - Links to ft.com, bloomberg.com, reuters.com, wsj.com in the article body
    originalUrlPatterns: [
      /href=["'](https?:\/\/(?:www\.)?(?:ft\.com|financialtimes\.com)\/[^"']+)["']/i,
      /href=["'](https?:\/\/(?:www\.)?bloomberg\.com\/[^"']+)["']/i,
      /href=["'](https?:\/\/(?:www\.)?reuters\.com\/[^"']+)["']/i,
      /href=["'](https?:\/\/(?:www\.)?wsj\.com\/[^"']+)["']/i,
      /href=["'](https?:\/\/(?:www\.)?economist\.com\/[^"']+)["']/i,
      /originally\s+published\s+on[^<]*?<a[^>]+href=["'](https?:\/\/[^"']+)["']/i,
      /source\s*:\s*<a[^>]+href=["'](https?:\/\/[^"']+)["']/i,
      /via\s*<a[^>]+href=["'](https?:\/\/[^"']+)["']/i,
    ],
  },
};

// Check if URL is from a secondary source that republishes from original sources
function detectSecondarySource(url: string): { domain: string; patterns: RegExp[] } | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    for (const [, config] of Object.entries(SECONDARY_SOURCES)) {
      if (hostname.includes(config.domain)) {
        return { domain: config.domain, patterns: config.originalUrlPatterns };
      }
    }
  } catch { /* invalid URL */ }
  return null;
}

// Extract original source URLs from HTML content of a secondary source
function extractOriginalSourceUrls(html: string, patterns: RegExp[]): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] && !seen.has(match[1])) {
      // Validate the URL looks like an article URL (not a homepage or category page)
      const url = match[1];
      try {
        const parsed = new URL(url);
        // Must have a path longer than just "/" (i.e., an actual article, not a homepage)
        if (parsed.pathname.length > 5 && !parsed.pathname.match(/^\/(?:en|ar|home|about|contact|subscribe|login)?\/?$/)) {
          urls.push(url);
          seen.add(url);
        }
      } catch { /* invalid URL from regex match */ }
    }
  }

  return urls;
}

export interface ContentLoadResult {
  articleId: string;
  success: boolean;
  contentLength: number;
  method: string;
  duration: number;
  error?: string;
}

// ── HTML Content Extractor ──
// Extracts the main article content from an HTML page
function extractArticleFromHtml(html: string, url: string): string {
  let content = '';

  // Strategy 1: Look for <article> tag
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    content = stripHtml(articleMatch[1]);
  }

  // Strategy 2: Look for common content containers
  if (!content || content.length < 200) {
    const contentPatterns = [
      /<div[^>]+class=["'][^"']*article[^"']*body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+class=["'][^"']*story[^"']*body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+class=["'][^"']*post[^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+class=["'][^"']*entry[^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+class=["'][^"']*article[^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+id=["']article-body["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+id=["']article-content["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+itemprop=["']articleBody["'][^>]*>([\s\S]*?)<\/div>/i,
    ];

    for (const pattern of contentPatterns) {
      const match = html.match(pattern);
      if (match && stripHtml(match[1]).length > 200) {
        content = stripHtml(match[1]);
        break;
      }
    }
  }

  // Strategy 3: Find the largest block of <p> tags
  if (!content || content.length < 200) {
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(html)) !== null) {
      const text = stripHtml(pMatch[1]).trim();
      if (text.length > 40) {
        paragraphs.push(text);
      }
    }
    if (paragraphs.length > 0) {
      content = paragraphs.join('\n\n');
    }
  }

  // Clean up content - filter out UI garbage
  const rawParagraphs = content.split('\n').map(p => p.trim()).filter(p => p.length > 0);
  const cleanParagraphs = rawParagraphs.filter(p => {
    if (p.length < 30) return false;
    const lower = p.toLowerCase();
    const uiPatterns = [
      /^(share|resize|comment|save|print|email|follow|subscribe|sign\s*up|log\s*in)/i,
      /^\d+\s*(results?|items?|articles?|comments?)/i,
      /^(no results|no items)/i,
      /^(video|podcast|browse|search)/i,
      /^(published|updated)/i,
      /^(ادخل|سجل|اشترك|تابع|شارك|حفظ|طباعة)/,
    ];
    for (const pattern of uiPatterns) {
      if (pattern.test(p)) return false;
    }
    return true;
  });

  content = cleanParagraphs.join('\n\n');

  // Limit content length
  if (content.length > 12000) {
    content = content.slice(0, 12000);
  }

  return content;
}

// Strip HTML tags and decode entities
function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
      .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '')
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/blockquote>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/[^\S\n]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// ── Fetch article content from source URL ──
export async function loadArticleContent(articleId: string): Promise<ContentLoadResult> {
  const startTime = Date.now();
  const result: ContentLoadResult = {
    articleId,
    success: false,
    contentLength: 0,
    method: '',
    duration: 0,
  };

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
      select: {
        url: true,
        content: true,
        source: true,
        sourceName: true,
      },
    });

    if (!article) {
      result.error = 'Article not found';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Skip if already has substantial content
    if (article.content && article.content.length > 500) {
      result.success = true;
      result.contentLength = article.content.length;
      result.method = 'already-loaded';
      result.duration = Date.now() - startTime;
      return result;
    }

    if (!article.url || article.url.length < 10) {
      result.error = 'No valid URL';
      result.duration = Date.now() - startTime;
      return result;
    }

    let extractedContent = '';
    let method = '';

    // ── Step 1: Try direct HTTP fetch ──
    let html = '';
    let directFetchFailed = false;

    try {
      const fetchRes = await fetch(article.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(12000), // 12s timeout
        redirect: 'follow',
      });

      if (!fetchRes.ok) {
        directFetchFailed = true;
      } else {
        html = await fetchRes.text();
        method = 'direct-fetch';
      }
    } catch {
      directFetchFailed = true;
    }

    // ── Step 2: Try page_reader fallback ──
    if (directFetchFailed || !html) {
      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default;
        const zai = await ZAI.create();
        const pageResult = await zai.functions.invoke('page_reader', { url: article.url });

        if (pageResult?.data?.html && pageResult.data.html.length > 100) {
          html = pageResult.data.html;
          method = 'page-reader';
        }
      } catch (err: any) {
        console.warn(`[ContentLoader] page_reader failed for ${article.url.slice(0, 60)}: ${err.message}`);
      }
    }

    // ── Step 3: Extract article content from HTML ──
    if (html) {
      extractedContent = extractArticleFromHtml(html, article.url);

      // If extraction yielded very little, try page_reader if we haven't already
      if (extractedContent.length < 200 && method === 'direct-fetch') {
        try {
          const ZAI = (await import('z-ai-web-dev-sdk')).default;
          const zai = await ZAI.create();
          const pageResult = await zai.functions.invoke('page_reader', { url: article.url });

          if (pageResult?.data?.html) {
            const prContent = extractArticleFromHtml(pageResult.data.html, article.url);
            if (prContent.length > extractedContent.length) {
              extractedContent = prContent;
              method = 'page-reader-fallback';
            }
          }
        } catch {
          // Silent — continue with whatever we got
        }
      }
    }

    // ── Step 3.5: V146 — Try original source if this is a secondary source ──
    // If the article comes from Seeking Alpha (or similar), and the content
    // we extracted is short, try to find and scrape the ORIGINAL source article.
    // This gives us much richer content (numbers, percentages, specific names).
    const secondarySource = detectSecondarySource(article.url);
    if (secondarySource && html && extractedContent.length < 3000) {
      const originalUrls = extractOriginalSourceUrls(html, secondarySource.patterns);

      for (const originalUrl of originalUrls.slice(0, 2)) { // Try max 2 original URLs
        try {
          console.log(`[ContentLoader V146] Found original source URL: ${originalUrl.slice(0, 60)} — attempting scrape...`);

          // Try page_reader first for original source (often paywalled)
          let originalHtml = '';
          try {
            const ZAI = (await import('z-ai-web-dev-sdk')).default;
            const zai = await ZAI.create();
            const pageResult = await zai.functions.invoke('page_reader', { url: originalUrl });

            if (pageResult?.data?.html && pageResult.data.html.length > 200) {
              originalHtml = pageResult.data.html;
            }
          } catch (err: any) {
            console.warn(`[ContentLoader V146] page_reader failed for original source ${originalUrl.slice(0, 50)}: ${err.message}`);
          }

          // Try direct fetch as fallback
          if (!originalHtml) {
            try {
              const fetchRes = await fetch(originalUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                  'Accept-Language': 'en-US,en;q=0.5',
                },
                signal: AbortSignal.timeout(10000),
                redirect: 'follow',
              });
              if (fetchRes.ok) {
                originalHtml = await fetchRes.text();
              }
            } catch {
              // Direct fetch failed — probably paywalled
            }
          }

          if (originalHtml) {
            const originalContent = extractArticleFromHtml(originalHtml, originalUrl);
            if (originalContent.length > extractedContent.length + 200) {
              // Original source has significantly more content — use it instead
              console.log(`[ContentLoader V146] Original source richer: ${originalContent.length} chars vs ${extractedContent.length} chars from secondary — using original`);
              extractedContent = originalContent;
              method = 'original-source-via-' + secondarySource.domain;
              break; // Found a good original source, no need to try more
            } else {
              console.log(`[ContentLoader V146] Original source not richer: ${originalContent.length} chars vs ${extractedContent.length} chars — keeping secondary`);
            }
          }
        } catch (err: any) {
          console.warn(`[ContentLoader V146] Error scraping original source: ${err.message}`);
        }
      }
    }

    // ── Step 4: Store extracted content ──
    if (extractedContent.length > 100) {
      await db.newsItem.update({
        where: { id: articleId },
        data: { content: extractedContent },
      });

      result.success = true;
      result.contentLength = extractedContent.length;
      result.method = method;
      console.log(`[ContentLoader V146] Loaded ${extractedContent.length} chars from ${article.url.slice(0, 50)} via ${method}`);
    } else {
      // Content too short — probably a paywall or login wall
      // This is fine — the pipeline will continue with just the RSS summary
      result.success = true; // Not an error — graceful degradation
      result.contentLength = 0;
      result.method = 'no-content-extracted';
      console.log(`[ContentLoader V146] Could not extract content from ${article.url.slice(0, 50)} (${extractedContent.length} chars) — will use RSS summary only`);
    }
  } catch (err: any) {
    result.error = err.message;
    console.warn(`[ContentLoader V145] Error loading content for ${articleId}: ${err.message}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}
