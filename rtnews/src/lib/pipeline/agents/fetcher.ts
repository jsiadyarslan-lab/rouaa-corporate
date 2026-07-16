// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════
// ─── Pipeline Fetcher Agent V38 ─────────────────────────────
// Fetches live + breaking news from multiple sources.
// V38 GOLDEN RULE: Articles are INVISIBLE until fully processed.
//   - isPublished=false and isReady=false at creation
//   - Only the Publisher agent sets isPublished=true + isReady=true
//   - Articles NEVER appear on site until 100% complete
// V37: Filters out NON-FINANCIAL news (entertainment, sports, crime, etc.)
// This is a FINANCIAL news platform — only financial/economic news is accepted.

import { db } from '@/lib/db';
import { generateSlug } from '@/lib/slug';
import { fetchAllNews, fetchBreakingNews } from '@/lib/news-sources';
import { PIPELINE_CONFIG } from '../config';

export interface FetchResult {
  fetched: number;
  duplicates: number;
  filtered: number;  // V37: count of non-financial articles filtered out
  errors: number;
  duration: number;
}

// V37: Non-financial keywords — articles containing these are REJECTED
const NON_FINANCIAL_PATTERNS: RegExp[] = [
  // Entertainment / Celebrity
  /\boscar\b/i, /\bacademy award\b/i, /\bgrammy\b/i, /\bemmy\b/i, /\bgolden globe\b/i,
  /\bcelebrity\b/i, /\bhollywood\b/i, /\bmovie\b/i, /\bfilm\b/i, /\bactor\b/i, /\bactress\b/i,
  /\bmusic\b/i, /\bsinger\b/i, /\bconcert\b/i, /\balbum\b/i, /\bsong\b/i,
  /\breality show\b/i, /\btv show\b/i, /\bnetflix\b/i, /\bdisney\b/i,
  // Sports
  /\bworld cup\b/i, /\bolympics?\b/i, /\bchampionship\b/i, /\bfootball\b/i, /\bsoccer\b/i,
  /\bbasketball\b/i, /\btennis\b/i, /\bgolf\b/i, /\bboxing\b/i, /\bfifa\b/i,
  /\bnba\b/i, /\bnfl\b/i, /\bmlb\b/i, /\bnhl\b/i,
  // Crime / War (non-financial)
  /\bmurder\b/i, /\bhomicide\b/i, /\bkidnap\b/i, /\bassassinat/i,
  /\bwar criminal\b/i, /\bgenocide\b/i,
  // General non-financial
  /\brecipe\b/i, /\bcooking\b/i, /\bfashion\b/i, /\bbeauty\b/i, /\bdating\b/i,
  /\bwedding\b/i, /\bpregnancy\b/i, /\bbaby\b/i, /\bpet\b/i, /\bdog\b/i, /\bcat\b/i,
];

// Financial keywords — articles containing these are ACCEPTED
// V112: Added plural forms + Arabic financial keywords
// BEFORE V112: 28/30 English plurals were rejected, ALL Arabic articles were rejected
// This was the #1 cause of zero articles being fetched
const FINANCIAL_KEYWORDS: RegExp[] = [
  // ── English — singular + plural ──
  /\bstocks?\b/i, /\bshares?\b/i, /\bmarkets?\b/i, /\btrading?\b/i, /\binvest/i,
  /\beconom/i, /\bfinanc/i, /\bbanks?\b/i, /\brates?\b/i, /\bbonds?\b/i, /\byields?\b/i,
  /\bgdp\b/i, /\binflat/i, /\bfed\b/i, /\bfederal reserve\b/i, /\binterest/i,
  /\bcrypto\b/i, /\bbitcoin\b/i, /\bethereum\b/i, /\boil\b/i, /\bgold\b/i,
  /\bdollars?\b/i, /\bcurrenc(?:y|ies)\b/i, /\bforex\b/i, /\brecession\b/i, /\bprofits?\b/i,
  /\brevenue/i, /\bearnings?\b/i, /\bipo\b/i, /\bmergers?\b/i, /\bacquisit/i,
  /\bportfolios?\b/i, /\bdividends?\b/i, /\bhedges?\b/i, /\bfunds?\b/i, /\betf\b/i,
  /\bwall street\b/i, /\bdow\b/i, /\bs&p\b/i, /\bnasdaq\b/i, /\bftse\b/i,
  /\btariffs?\b/i, /\btrades?\b/i, /\bimports?\b/i, /\bexports?\b/i, /\bsuppl(?:y|ies)\b/i,
  /\bmortgages?\b/i, /\bloans?\b/i, /\bcredits?\b/i, /\bdebts?\b/i, /\bdeficits?\b/i,
  /\btaxes?\b/i, /\bfiscal\b/i, /\bmonetary\b/i, /\bpolicies?\b/i, /\bregulat/i,
  /\bcompan(?:y|ies)\b/i, /\bcorporat/i, /\bceo\b/i, /\bcfo\b/i, /\bstartups?\b/i,
  /\bvaluations?\b/i, /\bassets?\b/i, /\bcommodit/i, /\bprices?\b/i, /\bcosts?\b/i,
  // ── Arabic financial keywords (V112: CRITICAL — were completely missing!) ──
  // اقتصاد ومالية
  /اقتصاد/i, /اقتصادي/i, /مالي/i, /مالية/i, /تمويل/i,
  // بنوك ومصارف
  /بنك/i, /بنوك/i, /مصرف/i, /مصارف/i,
  // استثمار وأسواق
  /استثمار/i, /استثمارات/i, /مستثمر/i, /بورصة/i, /سوق/i, /أسواق/i,
  // أسهم وأرباح
  /أسهم/i, /سهم/i, /أرباح/i, /ربح/i, /خسارة/i, /خسائر/i, /إيرادات/i,
  // نفط وطاقة ومعادن
  /نفط/i, /بترول/i, /طاقة/i, /ذهب/i, /معادن/i,
  // عملات وفائدة
  /عملة/i, /عملات/i, /دولار/i, /يورو/i, /فائدة/i, /فوائد/i,
  // تجارة ورسوم
  /تجارة/i, /صادرات/i, /واردات/i, /رسوم/i, /جمركي/i,
  // شركات وأعمال
  /شركة/i, /شركات/i, /رأس مال/i, /رسملة/i,
  // ديون وضرائب
  /دين/i, /ديون/i, /ضريبة/i, /ضرائب/i, /عجز/i, /فائض/i,
  // أسعار وتضخم
  /سعر/i, /أسعار/i, /تضخم/i, /ركود/i,
  // قروض وائتمان
  /قرض/i, /قروض/i, /ائتمان/i, /رهن/i,
  // فوركس وكريبتو
  /فوركس/i, /كريبتو/i, /بيتكوين/i, /إيثريوم/i,
  // كلمات إضافية مهمة
  /إفلاس/i, /محفظة/i, /حصة/i, /اندماج/i, /استحواذ/i, /اكتتاب/i,
];

function isFinancialNews(title: string, summary: string): boolean {
  const text = `${title} ${summary}`;

  // V113: Check for financial keywords FIRST — if any found, accept immediately.
  // Old order checked NON_FINANCIAL first, which caused false rejections for articles
  // like "Netflix stock drops after earnings" (rejected because "netflix" is non-financial)
  // or "Disney theme park revenue impacts stock" (rejected because "disney" is non-financial).
  // Financial keywords should take priority — if an article mentions stocks, markets,
  // or trading, it's financial regardless of any entertainment/celebrity keywords.
  for (const pattern of FINANCIAL_KEYWORDS) {
    if (pattern.test(text)) {
      return true; // Financial news — accept immediately
    }
  }

  // Only check non-financial patterns AFTER confirming no financial keywords exist.
  // This prevents articles that are genuinely non-financial from passing through.
  for (const pattern of NON_FINANCIAL_PATTERNS) {
    if (pattern.test(text)) {
      return false; // Definitely not financial
    }
  }

  // If no financial keywords found and no non-financial patterns matched,
  // it's ambiguous — reject to be safe (the pipeline's AI will do further filtering)
  return false;
}

export async function runFetcher(): Promise<FetchResult> {
  const startTime = Date.now();
  const result: FetchResult = { fetched: 0, duplicates: 0, filtered: 0, errors: 0, duration: 0 };

  try {
    console.log('[Fetcher] Starting news fetch...');

    // Fetch both live and breaking news
    const [liveResult, breakingResult] = await Promise.allSettled([
      fetchAllNews({ autoTranslate: false, maxItems: PIPELINE_CONFIG.MAX_FETCH_ITEMS }),
      fetchBreakingNews({ autoTranslate: false }),
    ]);

    const allItems: any[] = [];

    if (liveResult.status === 'fulfilled' && liveResult.value.news.length > 0) {
      allItems.push(...liveResult.value.news.map(item => ({ ...item, newsType: 'live' })));
    }

    if (breakingResult.status === 'fulfilled' && breakingResult.value.news.length > 0) {
      allItems.push(...breakingResult.value.news.map(item => ({ ...item, newsType: 'breaking' })));
    }

    if (allItems.length === 0) {
      console.log('[Fetcher] No new items fetched');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[Fetcher] Fetched ${allItems.length} items from sources. Filtering and saving...`);

    // Save to database — deduplicate by URL, filter non-financial
    for (const item of allItems) {
      try {
        if (!item.url || item.url.length < 5) {
          result.errors++;
          continue;
        }

        // V37: Filter out non-financial news
        if (!isFinancialNews(item.title || '', item.summary || '')) {
          result.filtered++;
          continue;
        }

        // Check for duplicate by URL
        const existing = await db.newsItem.findFirst({
          where: { url: item.url },
          select: { id: true },
        });

        if (existing) {
          result.duplicates++;
          continue;
        }

        // Generate slug from title (prefer Arabic title if available)
        // slug now includes a random 4-char suffix to reduce collisions
        const slugSource = item.titleAr || item.title || '';
        const slug = generateSlug(slugSource);

        // FIX: The Arabic fetcher MUST always set locale='ar'.
        // Previously, English-language RSS items got locale='en', which created
        // orphaned articles that neither pipeline processes (Arabic pipeline filters
        // locale='ar', English pipeline doesn't know about them). All articles
        // fetched by this pipeline go through Arabic translation/processing,
        // so they MUST be locale='ar' regardless of source language.
        const isArabicSource = /[\u0600-\u06FF]/.test(item.title);
        const itemLocale = 'ar';

        // Get category default image
        const categoryImage = PIPELINE_CONFIG.CATEGORY_IMAGES[item.category || ''] ||
          PIPELINE_CONFIG.CATEGORY_IMAGES['اقتصاد كلي'];

        try {
          await db.newsItem.create({
            data: {
              title: item.title || '',
              titleAr: isArabicSource ? item.title : null,
              summary: item.summary || '',
              summaryAr: isArabicSource ? item.summary : null,
              content: '',
              contentAr: null,
              source: item.source || 'Unknown',
              sourceName: item.source || 'Unknown',
              url: item.url,
              category: item.category || 'اقتصاد كلي',
              sentiment: item.sentiment || 'neutral',
              sentimentScore: item.sentimentScore || 55,
              impactLevel: item.impactLevel || 'low',
              impactScore: item.impactScore || 0,  // V101: Importance score for priority sorting
              originalLanguage: item.language || 'en',
              locale: itemLocale,
              newsType: item.newsType || 'live',
              affectedAssets: '[]',
              isPublished: false,  // V38: INVISIBLE until fully processed!
              isReady: false,
              processingStage: 'fetched',
              retryCount: 0,
              imageUrl: item.imageUrl || categoryImage,
              slug: slug || `news-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            },
          });

          result.fetched++;
        } catch (createErr: any) {
          // V256: P2002 on slug+locale — retry with a fresh slug (new random suffix)
          if (createErr.code === 'P2002') {
            try {
              const retrySlug = generateSlug(slugSource); // New random suffix
              await db.newsItem.create({
                data: {
                  title: item.title || '',
                  titleAr: isArabicSource ? item.title : null,
                  summary: item.summary || '',
                  summaryAr: isArabicSource ? item.summary : null,
                  content: '',
                  contentAr: null,
                  source: item.source || 'Unknown',
                  sourceName: item.source || 'Unknown',
                  url: item.url,
                  category: item.category || 'اقتصاد كلي',
                  sentiment: item.sentiment || 'neutral',
                  sentimentScore: item.sentimentScore || 55,
                  impactLevel: item.impactLevel || 'low',
                  impactScore: item.impactScore || 0,
                  originalLanguage: item.language || 'en',
                  locale: itemLocale,
                  newsType: item.newsType || 'live',
                  affectedAssets: '[]',
                  isPublished: false,
                  isReady: false,
                  processingStage: 'fetched',
                  retryCount: 0,
                  imageUrl: item.imageUrl || categoryImage,
                  slug: retrySlug,
                },
              });
              result.fetched++;
            } catch (retryErr: any) {
              // Second P2002 = true duplicate (same URL already exists)
              result.duplicates++;
            }
          } else {
            throw createErr; // Re-throw to outer catch
          }
        }
      } catch (err: any) {
        // Non-P2002 error — log and continue
        result.errors++;
        console.error(`[Fetcher] Error saving "${item.title?.slice(0, 40)}": ${err.message}`);
      }
    }

    result.duration = Date.now() - startTime;
    console.log(`[Fetcher] Done: ${result.fetched} new, ${result.duplicates} dupes, ${result.filtered} non-financial filtered, ${result.errors} errors in ${result.duration}ms`);
    return result;
  } catch (err: any) {
    result.errors++;
    result.duration = Date.now() - startTime;
    console.error('[Fetcher] Fatal error:', err.message);
    return result;
  }
}
