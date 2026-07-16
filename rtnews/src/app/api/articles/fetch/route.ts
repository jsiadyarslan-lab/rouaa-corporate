// ─── Web Article Fetcher API ──────────────────────────────────
// Returns pre-translated Arabic content from the database.
// All content is pre-translated during the cron job — NO on-demand translation.
// If content is not yet in the DB, returns a "being prepared" response.

import { NextResponse } from 'next/server';
import { generateRateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';

// ── HTML Content Extractor ──
// Extracts the main article content from an HTML page
function extractArticleFromHtml(html: string, url: string): {
  title: string;
  content: string;
  author: string;
  publishDate: string;
  imageUrl: string;
} {
  let title = '';
  let content = '';
  let author = '';
  let publishDate = '';
  let imageUrl = '';

  // Extract title from <title> or og:title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    || html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i);
  if (titleMatch) {
    title = decodeHtmlEntities(titleMatch[1].trim());
    // Remove site name suffix like " - MarketWatch" or " | Reuters"
    title = title.replace(/\s*[-–|]\s*.{1,30}$/, '').trim();
  }

  // Extract og:image
  const imageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+name=["']image["'][^>]+content=["']([^"']+)["']/i);
  if (imageMatch) {
    imageUrl = decodeHtmlEntities(imageMatch[1].trim());
    // Ensure image URL is absolute
    if (imageUrl && !imageUrl.startsWith('http')) {
      try {
        imageUrl = new URL(imageUrl, url).href;
      } catch {
        imageUrl = ''; // Invalid URL, skip it
      }
    }
    // Validate image URL has a proper extension or is from a known CDN
    if (imageUrl && imageUrl.endsWith('?v=') || imageUrl.endsWith('?')) {
      imageUrl = imageUrl.replace(/[?&]v=$/, ''); // Remove empty query params
    }
  }

  // Extract author
  const authorMatch = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+name=["']byl["'][^>]+content=["']([^"']+)["']/i);
  if (authorMatch) {
    author = decodeHtmlEntities(authorMatch[1].trim());
  }

  // Extract publish date
  const dateMatch = html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+name=["']date["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<time[^>]+datetime=["']([^"']+)["']/i);
  if (dateMatch) {
    publishDate = dateMatch[1].trim();
  }

  // Extract main content
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
      // Only include paragraphs with substantial text (filter out nav, footer, etc.)
      if (text.length > 40) {
        paragraphs.push(text);
      }
    }
    if (paragraphs.length > 0) {
      content = paragraphs.join('\n\n');
    }
  }

  // Clean up content - split into paragraphs and filter out UI garbage
  const rawParagraphs = content.split('\n').map(p => p.trim()).filter(p => p.length > 0);
  const cleanParagraphs = rawParagraphs.filter(p => {
    // Filter out paragraphs that look like UI/navigation text
    const lower = p.toLowerCase();

    // Skip very short lines (likely UI labels)
    if (p.length < 30) return false;

    // Skip common UI patterns from news websites
    const uiPatterns = [
      /^(share|resize|comment|save|print|email|follow|subscribe|sign\s*up|log\s*in|register|newsletter|notification)/i,
      /^(ادخل|سجل|اشترك|تابع|شارك|حفظ|طباعة|بريد)/,
      /^\d+\s*(results?|items?|articles?|comments?)/i,
      /^(no results|no items|لا توجد نتائج|لا توجد عناصر)/i,
      /^(advanced search|البحث المتقدم|بحث متقدم)/i,
      /^(all articles|all news|جميع المقالات|جميع الأخبار)/i,
      /^(video|podcast|الفيديو|البودكاست)/i,
      /^(browse|search|استعراض|بحث)/i,
      /^(published|updated|نشر|تحديث)/i,
      /^\p{Emoji_Presentation}/u,  // Lines starting with emoji
    ];

    for (const pattern of uiPatterns) {
      if (pattern.test(p)) return false;
    }

    // Skip lines that are mostly single words repeated or look like menu items
    const words = p.split(/\s+/);
    if (words.length <= 3 && p.length < 60) return false;

    return true;
  });

  content = cleanParagraphs.join('\n\n');

  // Limit content length to avoid token overflow
  if (content.length > 12000) {
    content = content.slice(0, 12000) + '...';
  }

  return { title, content, author, publishDate, imageUrl };
}

// Strip HTML tags and decode entities
// Preserves paragraph boundaries (\n\n) for proper splitting on the client
function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      // Remove form elements, buttons, inputs
      .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
      .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '')
      .replace(/<input[^>]*>/gi, '')
      .replace(/<select[^>]*>[\s\S]*?<\/select>/gi, '')
      // Remove SVG and canvas (icons, charts)
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
      .replace(/<canvas[^>]*>[\s\S]*?<\/canvas>/gi, '')
      // Remove hidden elements
      .replace(/<[^>]+style=["'][^"']*display\s*:\s*none[^"']*["'][^>]*>[\s\S]*?<\/\w+>/gi, '')
      // Convert block elements to paragraph breaks
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/blockquote>/gi, '\n\n')
      // Remove remaining tags
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      // Collapse multiple spaces within lines but preserve paragraph breaks
      .replace(/[^\S\n]+/g, ' ')
      // Clean up excessive blank lines (keep max 2 = 1 paragraph break)
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
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// ── Fallback 1: Use z-ai-web-dev-sdk page_reader ──
// When direct HTTP fetch fails (bot blocked, paywall, etc.), page_reader
// uses a different mechanism that can bypass basic bot detection.
async function fetchViaPageReader(url: string): Promise<{ html: string; title: string } | null> {
  try {
    console.log(`[Article Fetch] Trying page_reader fallback for: ${url}`);
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    const result = await zai.functions.invoke('page_reader', { url });

    if (result?.data?.html && result.data.html.length > 100) {
      console.log(`[Article Fetch] page_reader succeeded: ${result.data.html.length} chars from ${url}`);
      return {
        html: result.data.html,
        title: result.data.title || '',
      };
    }
    console.warn(`[Article Fetch] page_reader returned insufficient content for ${url}`);
    return null;
  } catch (err: any) {
    console.warn(`[Article Fetch] page_reader fallback failed for ${url}: ${err.message}`);
    return null;
  }
}

// ── Fallback 2: Use z-ai-web-dev-sdk web search + AI to get article content ──
// When both direct fetch and page_reader fail (bot blocked, paywall),
// we use web_search to find the article and AI to summarize it.
async function fetchViaWebSearchAI(url: string): Promise<{ content: string; title: string } | null> {
  try {
    console.log(`[Article Fetch] Trying web_search + AI fallback for: ${url}`);
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // Extract article title from URL for search
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const slugPart = pathParts[pathParts.length - 1] || '';

    // Search for the article title
    const searchResults = await zai.functions.invoke('web_search', {
      query: slugPart.replace(/-/g, ' ').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 80),
      num: 3,
    });

    if (Array.isArray(searchResults) && searchResults.length > 0) {
      const topResult = searchResults[0];
      const articleTitle = topResult.name || '';
      const articleSnippet = topResult.snippet || '';

      if (articleTitle && articleSnippet) {
        console.log(`[Article Fetch] Found article via web_search: ${articleTitle}`);
        // Use AI to generate content from the search result
        const { chatCompletion } = await import('@/lib/ai-provider');
        const aiResult = await chatCompletion([
          {
            role: 'system',
            content: 'أنت صحفي مالي محترف. اكتب مقالاً إخبارياً مفصلاً بالعربية بناءً على العنوان والمعلومات المتاحة. اكتب 3-4 فقرات مفصلة.',
          },
          {
            role: 'user',
            content: `اكتب مقالاً إخبارياً مفصلاً بالعربية عن:\nالعنوان: ${articleTitle}\nالمعلومات المتاحة: ${articleSnippet}\nالمصدر: ${urlObj.hostname.replace('www.', '')}`,
          },
        ], { temperature: 0.3, maxTokens: 1500, maxRetries: 1, priority: 'translation' });

        if (aiResult.content && aiResult.content.length > 100) {
          console.log(`[Article Fetch] AI-generated article from web_search: ${aiResult.content.length} chars`);
          return { content: aiResult.content, title: articleTitle };
        }
      }
    }
    console.warn(`[Article Fetch] web_search + AI fallback returned insufficient content`);
    return null;
  } catch (err: any) {
    console.warn(`[Article Fetch] web_search + AI fallback failed: ${err.message}`);
    return null;
  }
}

// ── Shared fetch-and-extract logic ──
// Used by both GET and POST handlers to avoid duplication
async function fetchAndExtract(url: string) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    return { error: NextResponse.json({ error: 'رابط غير صالح' }, { status: 400 }) };
  }

  console.log(`[Article Fetch] Fetching content from: ${url}`);

  // ── Step 1: Try direct HTTP fetch ──
  let html = '';
  let directFetchFailed = false;
  try {
    const fetchRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });

    if (!fetchRes.ok) {
      console.warn(`[Article Fetch] HTTP ${fetchRes.status} for ${url}, trying page_reader fallback`);
      directFetchFailed = true;
    } else {
      html = await fetchRes.text();
    }
  } catch (fetchErr: any) {
    console.warn(`[Article Fetch] Fetch error for ${url}: ${fetchErr.message}, trying page_reader fallback`);
    directFetchFailed = true;
  }

  // ── Step 2: If direct fetch failed, try page_reader fallback ──
  if (directFetchFailed || !html) {
    const pageReaderResult = await fetchViaPageReader(url);
    if (pageReaderResult) {
      html = pageReaderResult.html;
    } else {
      // ── Step 2b: Try web_search + AI fallback ──
      const webSearchResult = await fetchViaWebSearchAI(url);
      if (webSearchResult && webSearchResult.content) {
        // Build HTML from the AI-generated content
        html = `<html><body><article><h1>${webSearchResult.title}</h1><p>${webSearchResult.content.split('\n').join('</p><p>')}</p></article></body></html>`;
      }
    }
  }

  // ── If all fetch methods failed, return graceful failure (NOT 502) ──
  // This allows the client to show available summary and trigger AI generation
  if (!html) {
    console.warn(`[Article Fetch] All fetch methods failed for ${url}, returning sourceFailed flag`);
    return {
      extracted: {
        title: '',
        content: '',
        author: '',
        publishDate: '',
        imageUrl: '',
      },
      parsedUrl,
      html: '',
      sourceFailed: true,
    };
  }

  // ── Step 3: Extract article content from HTML ──
  let extracted = extractArticleFromHtml(html, url);

  // ── Step 4: If extraction yielded nothing, try page_reader if we haven't already ──
  if ((!extracted.content || extracted.content.length < 50) && !directFetchFailed && html) {
    // Direct fetch succeeded but extraction failed — the HTML might be JS-rendered.
    // Try page_reader which handles JS-rendered pages better.
    console.log(`[Article Fetch] Direct extraction yielded ${extracted.content.length} chars, trying page_reader for JS-rendered content`);
    const pageReaderResult = await fetchViaPageReader(url);
    if (pageReaderResult) {
      const prExtracted = extractArticleFromHtml(pageReaderResult.html, url);
      if (prExtracted.content.length > extracted.content.length) {
        extracted = prExtracted;
        console.log(`[Article Fetch] page_reader extraction better: ${prExtracted.content.length} vs ${extracted.content.length} chars`);
      }
    }
  }

  return { extracted, parsedUrl, html, sourceFailed: false };
}

// ── Build raw-only response (FAST — no AI translation, returns in 1-3 seconds) ──
// When rawOnly=true, return the extracted content immediately WITHOUT waiting
// for AI translation. The client-side code handles translation asynchronously
// in a separate request. This ensures the user sees content within 2-3 seconds
// instead of waiting 10-20 seconds for translation.
async function buildRawResponseWithTranslation(
  extracted: ReturnType<typeof extractArticleFromHtml>,
  parsedUrl: URL,
  providedTitle?: string,
  providedSummary?: string,
) {
  if (!extracted.content || extracted.content.length < 50) {
    console.warn(`[Article Fetch] Could not extract content from ${parsedUrl.href}`);
    return NextResponse.json({
      error: 'لم يتم العثور على محتوى المقال في الصفحة',
      hasFullContent: false,
      title: extracted.title || '',
      source: parsedUrl.hostname.replace('www.', ''),
    });
  }

  // Return raw extracted content immediately (1-3 seconds)
  // Client will translate asynchronously via /api/news/translate
  const englishRatio = (extracted.content.match(/[A-Za-z]/g) || []).length / Math.max(extracted.content.length, 1);
  const isEnglish = englishRatio > 0.3;

  console.log(`[Article Fetch] Returning raw content immediately (${extracted.content.length} chars, ${isEnglish ? 'English' : 'non-English'}). Translation will happen client-side.`);

  return NextResponse.json({
    introduction: extracted.content.slice(0, 500),
    body: extracted.content,
    conclusion: '',
    fullContent: extracted.content,
    keyTakeaways: [],
    affectedAssets: [],
    sentiment: 'neutral',
    recommendation: '',
    hasFullContent: true,
    title: providedTitle || extracted.title,
    source: parsedUrl.hostname.replace('www.', ''),
    author: extracted.author,
    imageUrl: extracted.imageUrl || '',
    publishDate: extracted.publishDate || '',
    method: 'raw-extraction',
    rawOnly: true,
    wasTranslated: false,
    needsTranslation: isEnglish, // Tell client to translate
  });
}

// ── GET handler ──
// Quick fetch via query params: ?url=...&newsId=...
// Only returns pre-translated content from DB — NO on-demand translation
export async function GET(request: Request) {
  try {
    // Rate limiting
    const rateCheck = generateRateLimit.check(request);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'طلبات كثيرة جداً. حاول مرة أخرى بعد دقيقة.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const newsId = searchParams.get('newsId');

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'الرابط مطلوب' }, { status: 400 });
    }

    // ── CHECK DB: Return pre-translated content if available ──
    try {
      const dbLookup = newsId
        ? await db.newsItem.findUnique({ where: { id: newsId } })
        : await db.newsItem.findFirst({ where: { url }, orderBy: { fetchedAt: 'desc' } });

      if (dbLookup?.contentAr && dbLookup.contentAr.length > 20 && /[\u0600-\u06FF]/.test(dbLookup.contentAr)) {
        console.log(`[Article Fetch GET] Found cached Arabic content in DB for: ${url.slice(0, 60)}`);
        const paragraphs = dbLookup.contentAr.split('\n').filter(p => p.trim().length > 0);
        return NextResponse.json({
          introduction: paragraphs.slice(0, 2).join('\n\n'),
          body: dbLookup.contentAr,
          conclusion: '',
          fullContent: dbLookup.contentAr,
          keyTakeaways: [],
          affectedAssets: [],
          sentiment: dbLookup.sentiment || 'neutral',
          recommendation: '',
          hasFullContent: true,
          title: dbLookup.titleAr || dbLookup.title,
          source: dbLookup.sourceName || dbLookup.source || new URL(url).hostname.replace('www.', ''),
          author: '',
          imageUrl: dbLookup.imageUrl || '',
          publishDate: '',
          method: 'db-cache',
          rawOnly: true,
          wasTranslated: true,
          needsTranslation: false,
          newsId: dbLookup.id,
        });
      }
    } catch (dbErr: any) {
      console.warn(`[Article Fetch GET] DB lookup failed: ${dbErr.message}`);
    }

    // ── No pre-translated content in DB — return "not ready" ──
    return NextResponse.json({
      hasFullContent: false,
      isPreparing: true,
      message: 'المحتوى قيد التجهيز وسيكون متاحاً قريباً',
      source: new URL(url).hostname.replace('www.', ''),
    });

  } catch (error: any) {
    console.error('[Article Fetch] GET Error:', error.message);
    return NextResponse.json({
      error: `حدث خطأ: ${error.message}`,
      hasFullContent: false,
    }, { status: 500 });
  }
}

// ── POST handler ──
// Accepts JSON body: { url, newsId? }
// Only returns pre-translated content from DB — NO on-demand translation
export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateCheck = generateRateLimit.check(request);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'طلبات كثيرة جداً. حاول مرة أخرى بعد دقيقة.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url, newsId } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'الرابط مطلوب' }, { status: 400 });
    }

    // ── CHECK DB: Return pre-translated content if available ──
    try {
      const dbLookup = newsId
        ? await db.newsItem.findUnique({ where: { id: newsId } })
        : await db.newsItem.findFirst({ where: { url }, orderBy: { fetchedAt: 'desc' } });

      if (dbLookup?.contentAr && dbLookup.contentAr.length > 20 && /[\u0600-\u06FF]/.test(dbLookup.contentAr)) {
        console.log(`[Article Fetch POST] Found cached Arabic content in DB for: ${url.slice(0, 60)}`);
        const paragraphs = dbLookup.contentAr.split('\n').filter(p => p.trim().length > 0);
        return NextResponse.json({
          introduction: paragraphs.slice(0, 2).join('\n\n'),
          body: dbLookup.contentAr,
          conclusion: '',
          fullContent: dbLookup.contentAr,
          keyTakeaways: [],
          affectedAssets: [],
          sentiment: dbLookup.sentiment || 'neutral',
          recommendation: '',
          hasFullContent: true,
          title: dbLookup.titleAr || body.title || dbLookup.title,
          source: dbLookup.sourceName || dbLookup.source || new URL(url).hostname.replace('www.', ''),
          author: '',
          imageUrl: dbLookup.imageUrl || '',
          publishDate: '',
          method: 'db-cache',
          rawOnly: true,
          wasTranslated: true,
          needsTranslation: false,
          newsId: dbLookup.id,
        });
      }
    } catch (dbErr: any) {
      console.warn(`[Article Fetch POST] DB lookup failed: ${dbErr.message}`);
    }

    // ── No pre-translated content in DB — return "not ready" ──
    return NextResponse.json({
      hasFullContent: false,
      isPreparing: true,
      message: 'المحتوى قيد التجهيز وسيكون متاحاً قريباً',
      source: new URL(url).hostname.replace('www.', ''),
    });

  } catch (error: any) {
    console.error('[Article Fetch] POST Error:', error.message);
    return NextResponse.json({
      error: `حدث خطأ: ${error.message}`,
      hasFullContent: false,
    }, { status: 500 });
  }
}
