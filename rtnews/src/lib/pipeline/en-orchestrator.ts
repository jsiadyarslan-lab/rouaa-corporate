// ═══════════════════════════════════════════════════════════════
// English Pipeline Orchestrator V1
// ─────────────────────────────────────────────────────────────
// Continuous-loop orchestrator for the English news pipeline.
// Modeled after the Arabic orchestrator (orchestrator.ts) but
// runs independently with its own schedule and state.
//
// CYCLE: fetch English RSS → process (en-processor → imager → publisher)
// REPORTS: daily brief every 24h, weekly analysis every 168h
//
// CRITICAL DESIGN:
// - Crash-resilient: auto-restarts on any error
// - Watchdog: auto-restarts if no cycle in 5 minutes (V318: was 20 min)
// - Full-pipeline: each article goes through all stages in one pass
// - Independent: does NOT affect the Arabic pipeline
// ═══════════════════════════════════════════════════════════════

import { db, pingDB, recoverConnection, startDBKeepalive } from '@/lib/db';
import { EN_PIPELINE_CONFIG, getEnPipelineLimits } from './en-pipeline-config';
import { isSvgPlaceholderImage } from '@/lib/image-storage';
import { getTodayStart, parseRSSXML, runContentLoaderStep, markReadyWithQuotaCap, strongReset, recordAIFailure, recordAISuccess, isDegradedMode } from './shared-pipeline-utils';
import { isCascadeFailure } from '@/lib/ai/ai-provider';

// ── Configurable Intervals ──
// V396f: Further sped up English pipeline — was 3min/40, now 90s/50 to match Arabic throughput.
// The English pipeline was still producing far fewer articles than Arabic (90s/50 vs 3min/40).
const NEWS_CYCLE_INTERVAL_MS = 60 * 1000;            // V412: 60 seconds — faster than Arabic (90s) since EN skips translation step
const STARTUP_DELAY_MS = 15_000;                     // V396f: 15s — matching Arabic
const MAX_ARTICLES_PER_CYCLE = 60;                    // V412: 60 articles — increased from 50 since EN pipeline is faster (no translation)
const MAX_RETRY_COUNT = 15;                         // Max retries before giving up

// ── Watchdog ──
const WATCHDOG_INTERVAL_MS = 5 * 60 * 1000;   // Check every 5 minutes
const WATCHDOG_MAX_IDLE_MS = 5 * 60 * 1000;   // V318: Reduced from 20min to 5min (matching Arabic)

// ── State ──
let isRunning = false;
let isPaused = false;
let cycleCount = 0;
let lastCycleTime = 0;
let lastError: string | null = null;
let totalPublished = 0;
let totalProcessed = 0;
let totalErrors = 0;
let totalFetched = 0;
let cycleTimer: ReturnType<typeof setTimeout> | null = null;
let watchdogTimer: ReturnType<typeof setInterval> | null = null;

// Report scheduling
let lastDailyBriefTime = 0;
let lastWeeklyAnalysisTime = 0;
let lastMonthlyOutlookTime = 0;
let lastTechnicalAnalysisTime = 0;
let lastQuarterlyReviewTime = 0;

// V56: Smart Watchdog — track consecutive empty cycles
let consecutiveEmptyCycles = 0;
const MAX_EMPTY_CYCLES_BEFORE_RESET = 10;

// V120: Track strong reset count to detect permanently stuck articles.
let strongResetCount = 0;
const MAX_STRONG_RESETS_BEFORE_ARCHIVE = 3;

// ── English RSS Fetcher ──

interface EnFetchResult {
  fetched: number;
  duplicates: number;
  filtered: number;
  errors: number;
  duration: number;
}

async function fetchEnglishRSSFeeds(): Promise<EnFetchResult> {
  const startTime = Date.now();
  const result: EnFetchResult = { fetched: 0, duplicates: 0, filtered: 0, errors: 0, duration: 0 };

  try {
    console.log('[EnOrchestrator] Fetching English RSS feeds...');

    const feeds = EN_PIPELINE_CONFIG.RSS_FEEDS_EN;
    const allItems: Array<{
      title: string;
      summary: string;
      url: string;
      source: string;
      category: string;
      date: string;
    }> = [];

    // V413: Parallel RSS fetching — fetch up to 10 feeds concurrently instead of sequentially.
    // This reduces RSS fetch time from ~45s (45 feeds × 1s each) to ~5s (5 batches of 10).
    const CONCURRENT_FEED_FETCHES = 10;
    for (let fi = 0; fi < feeds.length; fi += CONCURRENT_FEED_FETCHES) {
      const feedBatch = feeds.slice(fi, fi + CONCURRENT_FEED_FETCHES);
      const feedResults = await Promise.allSettled(
        feedBatch.map(async (feed) => {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(feed.url, {
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
              },
            });

            clearTimeout(timeout);

            if (!response.ok) {
              console.warn(`[EnOrchestrator] RSS feed ${feed.source} returned ${response.status}`);
              return null;
            }

            const xml = await response.text();
            return parseRSSXML(xml, feed.category, feed.source);
          } catch (err: any) {
            console.warn(`[EnOrchestrator] Failed to fetch ${feed.source}: ${err.message}`);
            result.errors++;
            return null;
          }
        })
      );

      for (const feedResult of feedResults) {
        if (feedResult.status === 'fulfilled' && feedResult.value) {
          allItems.push(...feedResult.value);
        }
      }
    }

    if (allItems.length === 0) {
      result.duration = Date.now() - startTime;
      return result;
    }

    // V393: REMOVED financial keyword filter — all RSS feeds are ALREADY curated financial
    // sources. The keyword filter was incorrectly rejecting valid business/economy articles
    // from sources like BBC Business, NYT Economy, Al Jazeera, etc. because they didn't
    // contain specific financial keywords like "stocks" or "bonds" in the title.
    // Since we control the source list, every article from these feeds IS financial news.

    for (const item of allItems) {
      try {
        if (!item.url || item.url.length < 5) {
          result.errors++;
          continue;
        }

        // V393: No financial keyword filter — all feeds are already curated financial sources
        // const isFinancial = FINANCIAL_KEYWORDS.some(pattern => pattern.test(textToCheck));
        // if (!isFinancial) { result.filtered++; continue; }

        const existing = await db.newsItem.findFirst({
          where: { url: item.url, locale: 'en' },
          select: { id: true },
        });

        if (existing) {
          result.duplicates++;
          continue;
        }

        const enCategory = EN_PIPELINE_CONFIG.CATEGORY_MAP_EN[item.category] || 'Economy';
        const { generateSlug } = await import('@/lib/slug');
        const slug = generateSlug(item.title);

        // Simple sentiment analysis
        const textToCheck = `${item.title} ${item.summary}`;
        const positiveWords = ['rise', 'surge', 'gain', 'rally', 'boost', 'jump', 'climb', 'record', 'beat', 'growth', 'profit'];
        const negativeWords = ['fall', 'drop', 'decline', 'slide', 'sink', 'crash', 'loss', 'low', 'miss', 'cut', 'recession', 'plunge'];
        const lowerText = textToCheck.toLowerCase();
        let posScore = 0, negScore = 0;
        positiveWords.forEach(w => { if (lowerText.includes(w)) posScore += 10; });
        negativeWords.forEach(w => { if (lowerText.includes(w)) negScore += 10; });
        const sentiment = posScore > negScore + 10 ? 'positive' : negScore > posScore + 10 ? 'negative' : 'neutral';
        const sentimentScore = posScore > negScore + 10 ? Math.min(55 + posScore, 95) : negScore > posScore + 10 ? Math.min(55 + negScore, 95) : 55;

        const contentFromSummary = item.summary || '';

        try {
          await db.newsItem.create({
            data: {
              title: item.title,
              summary: item.summary,
              content: contentFromSummary,
              source: item.source,
              sourceName: item.source,
              url: item.url,
              category: enCategory,
              categoryId: item.category,
              sentiment,
              sentimentScore,
              impactLevel: 'medium',
              impactScore: 30,
              originalLanguage: 'en',
              newsType: 'live',
              affectedAssets: '[]',
              isPublished: false,
              isReady: false,
              processingStage: 'fetched',
              retryCount: 0,
              slug: slug || `en-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              locale: 'en',
            },
          });

          result.fetched++;
        } catch (createErr: any) {
          // V256: P2002 on slug+locale — retry with a fresh slug (new random suffix)
          if (createErr.code === 'P2002') {
            try {
              const retrySlug = generateSlug(item.title); // New random suffix
              await db.newsItem.create({
                data: {
                  title: item.title,
                  summary: item.summary,
                  content: contentFromSummary,
                  source: item.source,
                  sourceName: item.source,
                  url: item.url,
                  category: enCategory,
                  categoryId: item.category,
                  sentiment,
                  sentimentScore,
                  impactLevel: 'medium',
                  impactScore: 30,
                  originalLanguage: 'en',
                  newsType: 'live',
                  affectedAssets: '[]',
                  isPublished: false,
                  isReady: false,
                  processingStage: 'fetched',
                  retryCount: 0,
                  slug: retrySlug,
                  locale: 'en',
                },
              });
              result.fetched++;
            } catch (retryErr: any) {
              // Second P2002 = true duplicate
              result.duplicates++;
            }
          } else {
            throw createErr; // Re-throw to outer catch
          }
        }
      } catch (err: any) {
        // Non-P2002 error — log and continue
        result.errors++;
        console.error(`[EnOrchestrator] Error saving "${item.title?.slice(0, 40)}": ${err.message}`);
      }
    }

    result.duration = Date.now() - startTime;
    if (result.fetched > 0) {
      console.log(`[EnOrchestrator] Fetched ${result.fetched} new, ${result.duplicates} dupes, ${result.filtered} filtered, ${result.errors} errors in ${result.duration}ms`);
    }
    return result;
  } catch (err: any) {
    result.errors++;
    result.duration = Date.now() - startTime;
    console.error('[EnOrchestrator] Fatal fetch error:', err.message);
    return result;
  }
}

// ── English Pipeline Processing ──

interface EnProcessResult {
  processed: number;
  published: number;
  failed: number;
  skipped: number;
  details: string[];
  duration: number;
}

// ── V411→V412: Concurrent article processing (matching Arabic pipeline architecture) ──
// V411 CRITICAL FIX: English pipeline was processing articles SEQUENTIALLY in a for-loop,
// while Arabic pipeline uses PARALLEL batches with Promise.allSettled (5 concurrent).
// V412: Increased from 5 → 8 concurrent — English articles don't need translation
// (which is the bottleneck for Arabic), so they can handle more parallelism.
// This gives ~8x throughput improvement over the original sequential processing.
const EN_CONCURRENT_ARTICLES = 8;

async function processSingleArticleEn(article: { id: string; title: string; processingStage: string; retryCount: number }): Promise<{ published: boolean; success: boolean }> {
  try {
    // V415 FIX: If article is already at 'imaged' stage, it has ALL required content
    // (AI analysis + generated image). Skip processor and imager — go directly to publisher.
    // Previously, the orchestrator ran processor on 'imaged' articles, which set
    // processingStage='analyzed' (DOWNGRADE!), creating an infinite loop:
    //   imaged → processor(analyzed) → imager(imaged) → processor(analyzed) → ...
    // Articles at 'imaged' stage are READY to publish — they just need publishArticle().
    if (article.processingStage === 'imaged') {
      let publishSuccess = false;
      try {
        const { publishArticle } = await import('@/lib/pipeline/agents/publisher');
        const pubResult = await publishArticle(article.id);
        if (pubResult.success) {
          publishSuccess = true;
        } else {
          // Publisher rejected — might need fallback. Try Canvas direct publish.
          console.warn(`[EnOrchestrator V415] Publisher rejected imaged article ${article.id}, trying Canvas fallback...`);
          try {
            const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
            const articleFull = await db.newsItem.findUnique({
              where: { id: article.id },
              select: { category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true, title: true, content: true, aiAnalysis: true, fetchedAt: true },
            });
            const canvasBuffer = await generateArticleImage({
              title: articleFull?.title || article.title || 'Financial News',
              category: articleFull?.categoryId || articleFull?.category || 'economy',
              locale: 'en',
              newsType: articleFull?.newsType || undefined,
              sentiment: articleFull?.sentiment || undefined,
              source: articleFull?.sourceName || articleFull?.source || undefined,
            });
            if (canvasBuffer && canvasBuffer.length > 500) {
              const { uploadImageToR2 } = await import('@/lib/image-storage');
              const base64DataUrl = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;
              const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
              const storedValue = r2Result.success ? r2Result.url : null;
              const { generateSlug } = await import('@/lib/slug');
              const slug = articleFull?.title ? generateSlug(articleFull.title) : article.id;
              await db.newsItem.update({
                where: { id: article.id },
                data: {
                  generatedImage: storedValue,
                  imageUrl: storedValue.startsWith('http') ? storedValue : `/api/article-image/${article.id}`,
                  isReady: true,
                  isPublished: true,
                  processingStage: 'imaged',
                  publishedAt: articleFull?.fetchedAt || new Date(),
                  slug: slug || article.id,
                },
              });
              try {
                const { recordPublish } = await import('./publish-quota');
                recordPublish('en');
              } catch { /* non-critical */ }
              publishSuccess = true;
            }
          } catch (canvasErr: any) {
            console.error(`[EnOrchestrator V415] Canvas fallback failed for imaged article ${article.id}: ${canvasErr.message}`);
          }
        }
      } catch (pubErr: any) {
        console.error(`[EnOrchestrator V415] Publisher error for imaged article ${article.id}: ${pubErr.message}`);
      }
      return { published: publishSuccess, success: publishSuccess };
    }

    // Step 0: Load full article content from source URL
    if (article.processingStage === 'fetched') {
      try {
        await runContentLoaderStep(article.id, 'en');
      } catch (clErr: any) {
        console.warn(`[EnOrchestrator] Content loader error for ${article.id}: ${clErr.message}`);
      }
    }

    // ── Step 1: Run en-processor (AI analysis + content enhancement) ──
    let processorSuccess = false;
    try {
      const { processArticleEn } = await import('@/lib/pipeline/agents/en-processor');
      const enResult = await processArticleEn(article.id);
      if (enResult.success) {
        processorSuccess = true;
        recordAISuccess('en');
      } else {
        // Retry once
        const retryResult = await processArticleEn(article.id);
        if (retryResult.success) {
          processorSuccess = true;
          recordAISuccess('en');
        } else {
          recordAIFailure('en');
        }
      }
    } catch (procErr: any) {
      console.error(`[EnOrchestrator] en-processor error for ${article.id}: ${procErr.message}`);
      recordAIFailure('en');
    }

    // ── Step 2: Run imager ──
    let imageSuccess = false;
    try {
      const { imageArticle } = await import('@/lib/pipeline/agents/imager');
      const imageResult = await imageArticle(article.id);
      if (imageResult.success) {
        imageSuccess = true;
      }
    } catch (imgErr: any) {
      console.error(`[EnOrchestrator] imager error for ${article.id}: ${imgErr.message}`);
    }

    // ── Step 3: Run publisher ──
    let publishSuccess = false;
    try {
      const updatedArticle = await db.newsItem.findUnique({
        where: { id: article.id },
        select: { processingStage: true, aiAnalysis: true, content: true, title: true },
      });

      if (updatedArticle?.processingStage === 'imaged') {
        const { publishArticle } = await import('@/lib/pipeline/agents/publisher');
        const pubResult = await publishArticle(article.id);
        if (pubResult.success) {
          publishSuccess = true;
        }
      } else {
        // Canvas image fallback + direct publish
        try {
          const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
          const articleFull = await db.newsItem.findUnique({
            where: { id: article.id },
            select: { category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true },
          });

          const canvasBuffer = await generateArticleImage({
            title: updatedArticle?.title || article.title || 'Financial News',
            category: articleFull?.categoryId || articleFull?.category || 'economy',
            locale: 'en',
            newsType: articleFull?.newsType || undefined,
            sentiment: articleFull?.sentiment || undefined,
            source: articleFull?.sourceName || articleFull?.source || undefined,
          });

          if (canvasBuffer && canvasBuffer.length > 500) {
            const { uploadImageToR2 } = await import('@/lib/image-storage');
            const base64DataUrl = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;
            const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
            const storedValue = r2Result.success ? r2Result.url : null;

            // V413: Lowered from 200 → 80 to match EN_PIPELINE_CONFIG.MIN_EN_CONTENT_LENGTH.
            // Many RSS summaries are 80-200 chars and were being blocked by the 200-char check.
            const hasContent = (updatedArticle?.content && updatedArticle.content.length >= EN_PIPELINE_CONFIG.MIN_EN_CONTENT_LENGTH);
            const hasAnalysis = (updatedArticle?.aiAnalysis && updatedArticle.aiAnalysis.length > 50);

            if (hasContent && hasAnalysis) {
              await db.newsItem.update({
                where: { id: article.id },
                data: { generatedImage: storedValue, processingStage: 'imaged' },
              });
              const { publishArticle } = await import('@/lib/pipeline/agents/publisher');
              const pubResult = await publishArticle(article.id);
              if (pubResult.success) {
                publishSuccess = true;
              }
            } else {
              // Degraded mode fallback
              let quotaAllowed = true;
              try {
                const { canPublish } = await import('./publish-quota');
                const quotaCheck = await canPublish('en');
                if (!quotaCheck.allowed) {
                  quotaAllowed = false;
                  console.warn(`[EnOrchestrator V359] Canvas fallback BLOCKED by quota: ${quotaCheck.reason}`);
                }
              } catch { /* fail-open */ }

              if (quotaAllowed) {
                const { generateSlug } = await import('@/lib/slug');
                const slug = updatedArticle?.title ? generateSlug(updatedArticle.title) : article.id;
                const articleForDate = await db.newsItem.findUnique({ where: { id: article.id }, select: { fetchedAt: true } });
                await db.newsItem.update({
                  where: { id: article.id },
                  data: {
                    generatedImage: storedValue,
                    imageUrl: storedValue.startsWith('http') ? storedValue : `/api/article-image/${article.id}`,
                    isReady: true,
                    isPublished: true,
                    processingStage: 'imaged',
                    publishedAt: articleForDate?.fetchedAt || new Date(),
                    slug: slug || article.id,
                  },
                });
                try {
                  const { recordPublish } = await import('./publish-quota');
                  recordPublish('en');
                } catch { /* non-critical */ }
                publishSuccess = true;
              }
            }
          }
        } catch (canvasErr: any) {
          console.error(`[EnOrchestrator] Canvas fallback failed for ${article.id}: ${canvasErr.message}`);
        }
      }
    } catch (pubErr: any) {
      console.error(`[EnOrchestrator] publisher error for ${article.id}: ${pubErr.message}`);
    }

    return { published: publishSuccess, success: publishSuccess || processorSuccess || imageSuccess };
  } catch (err: any) {
    console.error(`[EnOrchestrator] Error processing article ${article.id}: ${err.message}`);
    try {
      const { recordError } = await import('@/lib/pipeline/queue/job-manager');
      await recordError(article.id, `EN pipeline error: ${err.message}`);
    } catch { /* non-critical */ }
    return { published: false, success: false };
  }
}

async function processEnglishArticles(maxArticles: number = MAX_ARTICLES_PER_CYCLE): Promise<EnProcessResult> {
  const startTime = Date.now();
  const result: EnProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [], duration: 0 };

  try {
    const unprocessedArticles = await db.newsItem.findMany({
      where: {
        locale: 'en',
        isReady: false,
        isPublished: false,
        processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'translated', 'skipped', 'imaged'] },
        retryCount: { lt: MAX_RETRY_COUNT },
        title: { not: '' },
      },
      orderBy: [
        { processingStage: 'desc' },  // Process later stages first (closer to publishing)
        { fetchedAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        processingStage: true,
        retryCount: true,
      },
      take: maxArticles,
    });

    if (unprocessedArticles.length === 0) {
      result.details.push('No articles to process');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[EnOrchestrator V411] Found ${unprocessedArticles.length} English articles to process (concurrency: ${EN_CONCURRENT_ARTICLES})`);

    // Check EN-specific publish limits — V314: dynamic from DB
    const enLimits = await getEnPipelineLimits();
    const maxDaily = enLimits.maxDailyEnNews;
    const maxHourly = enLimits.maxHourlyEnNews;
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setUTCMinutes(0, 0, 0);
    const todayStart = getTodayStart(EN_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    const enPublishedFilter = {
      locale: 'en',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    const [publishedToday, publishedThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...enPublishedFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...enPublishedFilter, publishedAt: { gte: hourStart } } }),
    ]);

    const remainingHourly = maxHourly > 0 ? Math.max(0, maxHourly - publishedThisHour) : 999;
    const remainingDaily = maxDaily > 0 ? Math.max(0, maxDaily - publishedToday) : 999;

    if (remainingHourly <= 0 || remainingDaily <= 0) {
      result.details.push(`Quota reached — hour: ${publishedThisHour}/${maxHourly}, day: ${publishedToday}/${maxDaily}`);
      result.duration = Date.now() - startTime;
      return result;
    }

    // V411: Limit articles to process based on remaining quota (matching Arabic orchestrator)
    const effectiveMaxArticles = Math.min(
      unprocessedArticles.length,
      remainingHourly,
      remainingDaily,
    );

    const articlesToProcess = unprocessedArticles.slice(0, effectiveMaxArticles);

    let publishedThisCycle = 0;
    let errorsThisCycle = 0;
    let processedThisCycle = 0;

    // V411: Process articles with limited concurrency — matching Arabic pipeline architecture
    // Arabic uses CONCURRENT_ARTICLES=5 with Promise.allSettled for batch parallel processing.
    // This is 5x faster than sequential processing for AI-heavy pipeline stages.
    const concurrency = EN_CONCURRENT_ARTICLES;
    for (let i = 0; i < articlesToProcess.length; i += concurrency) {
      // V357: Re-check publishing limits from DB before each batch
      if (i > 0) {
        try {
          const [liveToday, liveHour] = await Promise.all([
            db.newsItem.count({ where: { ...enPublishedFilter, publishedAt: { gte: todayStart } } }),
            db.newsItem.count({ where: { ...enPublishedFilter, publishedAt: { gte: hourStart } } }),
          ]);
          const liveRemainingHour = maxHourly > 0 ? maxHourly - liveHour : 999;
          const liveRemainingDay = maxDaily > 0 ? maxDaily - liveToday : 999;
          if (liveRemainingHour <= 0 || liveRemainingDay <= 0) {
            console.log(`[EnOrchestrator V357] Limit reached mid-cycle (DB re-check: hour=${liveHour}/${maxHourly}, day=${liveToday}/${maxDaily}). Stopping batch processing after ${publishedThisCycle} published.`);
            break;
          }
        } catch (reCheckErr: any) {
          console.warn(`[EnOrchestrator V357] Live quota re-check failed: ${reCheckErr.message}`);
        }
      }

      const batch = articlesToProcess.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(article => processSingleArticleEn(article))
      );

      for (const batchResult of batchResults) {
        processedThisCycle++;
        if (batchResult.status === 'fulfilled') {
          if (batchResult.value.published) {
            publishedThisCycle++;
          }
          if (!batchResult.value.success) {
            errorsThisCycle++;
          }
        } else {
          errorsThisCycle++;
        }
      }
    }

    result.processed = processedThisCycle;
    result.published = publishedThisCycle;
    result.failed = errorsThisCycle;
    result.skipped = unprocessedArticles.length - processedThisCycle;
    result.details.push(`Processed: ${result.processed}, Published: ${result.published}, Failed: ${result.failed}, Skipped: ${result.skipped}`);

    if (publishedThisCycle > 0 && maxDaily > 0) {
      console.log(`[EnOrchestrator V411] Progress — Published this cycle: ${publishedThisCycle}, Errors: ${errorsThisCycle}, Concurrency: ${concurrency}`);
    }
  } catch (err: any) {
    result.failed++;
    result.details.push(`Fatal error: ${err.message}`);
    console.error(`[EnOrchestrator] process fatal error: ${err.message}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ── Reprocess incomplete articles ──

async function reprocessEnglishArticles(maxArticles: number = 3): Promise<EnProcessResult> {
  const startTime = Date.now();
  const result: EnProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [], duration: 0 };

  try {
    const candidateArticles = await db.newsItem.findMany({
      where: {
        locale: 'en',
        isReady: true,
        isPublished: true,
        OR: [
          { aiAnalysis: null },
          { aiAnalysis: '' },
          { generatedImage: null },
          { generatedImage: '' },
        ],
      },
      orderBy: { fetchedAt: 'desc' },
      // EGRESS FIX: removed generatedImage from select — where clause already filters null/empty
      select: { id: true, title: true, aiAnalysis: true, processingStage: true },
      take: maxArticles * 3,
    });

    // EGRESS FIX: simplified filter — where clause already ensures null/empty generatedImage is caught
    // SVG placeholder detection is handled by auto-migrate
    const incompleteArticles = candidateArticles.filter(a => {
      const hasAnalysis = a.aiAnalysis && a.aiAnalysis.length >= 50;
      // Articles with null/empty generatedImage are already caught by the OR where clause
      // Articles with generatedImage set are assumed valid (SVG handled by auto-migrate)
      return !hasAnalysis;
    }).slice(0, maxArticles);

    if (incompleteArticles.length === 0) {
      result.details.push('No incomplete articles');
      result.duration = Date.now() - startTime;
      return result;
    }

    for (const article of incompleteArticles) {
      try {
        const needsAnalysis = !article.aiAnalysis || article.aiAnalysis.length < 50;
        // EGRESS FIX: use processingStage instead of generatedImage to determine if image is needed
        const needsImage = article.processingStage !== 'imaged';

        if (needsAnalysis) {
          try {
            const { processArticleEn } = await import('@/lib/pipeline/agents/en-processor');
            await processArticleEn(article.id);
          } catch { /* non-critical */ }
        }

        if (needsImage) {
          try {
            await db.newsItem.update({
              where: { id: article.id },
              data: { generatedImage: null, processingStage: 'analyzed' },
            });
            const { imageArticle } = await import('@/lib/pipeline/agents/imager');
            const imgResult = await imageArticle(article.id);
            if (!imgResult.success) {
              // Canvas fallback
              try {
                const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
                const articleData = await db.newsItem.findUnique({
                  where: { id: article.id },
                  select: { title: true, category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true },
                });
                const canvasBuffer = await generateArticleImage({
                  title: articleData?.title || article.title || 'Financial News',
                  category: articleData?.categoryId || articleData?.category || 'economy',
                  locale: 'en',
                  newsType: articleData?.newsType || undefined,
                  sentiment: articleData?.sentiment || undefined,
                  source: articleData?.sourceName || articleData?.source || undefined,
                });
                if (canvasBuffer && canvasBuffer.length > 500) {
                  const { uploadImageToR2 } = await import('@/lib/image-storage');
                  const base64DataUrl = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;
                  const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
                  const storedValue = r2Result.success ? r2Result.url : null;
                  await db.newsItem.update({
                    where: { id: article.id },
                    data: { generatedImage: storedValue },
                  });
                }
              } catch { /* non-critical */ }
            }
          } catch { /* non-critical */ }
        }

        // Update imageUrl
        // EGRESS FIX: always use API route for imageUrl instead of pulling base64 generatedImage
        await db.newsItem.update({
          where: { id: article.id },
          data: {
            imageUrl: `/api/article-image/${article.id}`,
          },
        });

        result.processed++;
        result.published++;
      } catch (err: any) {
        result.failed++;
      }
    }
  } catch (err: any) {
    result.failed++;
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ── Report Generation ──

async function generateReportsIfNeeded(): Promise<void> {
  const now = Date.now();

  // Daily brief every 24h (V400: Only update timer on SUCCESS)
  if (now - lastDailyBriefTime >= EN_PIPELINE_CONFIG.EN_DAILY_INTERVAL_MS) {
    try {
      console.log('[EnOrchestrator] Generating English daily brief...');
      const { generateDailyBriefEn } = await import('@/lib/pipeline/agents/en-report-generator');
      const report = await generateDailyBriefEn('daily');
      if (report) {
        console.log(`[EnOrchestrator] Daily brief generated: "${report.title}" (${report.confidenceScore}%)`);
        lastDailyBriefTime = now; // V400: Only update timer on successful generation
      } else {
        console.log('[EnOrchestrator V400] Daily brief returned null — will retry next cycle (timer NOT updated)');
      }
    } catch (err: any) {
      console.warn(`[EnOrchestrator] Daily brief generation failed: ${err.message}`);
    }
  }

  // Weekly analyses for ALL enabled asset classes every 7 days (V400: Only update timer on SUCCESS)
  if (now - lastWeeklyAnalysisTime >= EN_PIPELINE_CONFIG.EN_WEEKLY_INTERVAL_MS) {
    try {
      console.log('[EnOrchestrator] Generating English weekly analyses...');
      const { generateWeeklyAnalysisEn } = await import('@/lib/pipeline/agents/en-report-generator');
      const assetClasses = EN_PIPELINE_CONFIG.EN_REPORT_ASSET_CLASSES;
      let generated = 0;
      for (const ac of assetClasses) {
        try {
          const analysis = await generateWeeklyAnalysisEn(ac as any);
          if (analysis) generated++;
        } catch { /* skip failed asset classes */ }
      }
      if (generated > 0) {
        console.log(`[EnOrchestrator] Generated ${generated} weekly analyses across ${assetClasses.length} asset classes`);
        lastWeeklyAnalysisTime = now; // V400: Only update timer on successful generation
      }
    } catch (err: any) {
      console.warn(`[EnOrchestrator] Weekly analysis generation failed: ${err.message}`);
    }
  }

  // Monthly outlook every 30 days (V400: Only update timer on SUCCESS)
  if (now - lastMonthlyOutlookTime >= EN_PIPELINE_CONFIG.EN_MONTHLY_INTERVAL_MS) {
    try {
      console.log('[EnOrchestrator] Generating English monthly outlook...');
      const { generateMonthlyOutlookEn } = await import('@/lib/pipeline/agents/en-report-generator');
      const report = await generateMonthlyOutlookEn();
      if (report) {
        console.log(`[EnOrchestrator] Monthly outlook generated: "${report.title}" (${report.confidenceScore}%)`);
        lastMonthlyOutlookTime = now;
      }
    } catch (err: any) {
      console.warn(`[EnOrchestrator] Monthly outlook generation failed: ${err.message}`);
    }
  }

  // Technical analysis every 8 hours (V400: Only update timer on SUCCESS)
  if (now - lastTechnicalAnalysisTime >= EN_PIPELINE_CONFIG.EN_TECHNICAL_INTERVAL_MS) {
    try {
      console.log('[EnOrchestrator] Generating English technical analysis...');
      const { generateTechnicalAnalysisEn } = await import('@/lib/pipeline/agents/en-report-generator');
      const analysis = await generateTechnicalAnalysisEn();
      if (analysis) {
        console.log(`[EnOrchestrator] Technical analysis generated: "${analysis.title}" (${analysis.confidenceScore}%)`);
        lastTechnicalAnalysisTime = now;
      }
    } catch (err: any) {
      console.warn(`[EnOrchestrator] Technical analysis generation failed: ${err.message}`);
    }
  }

  // Quarterly review every 90 days (V400: Only update timer on SUCCESS)
  if (now - lastQuarterlyReviewTime >= EN_PIPELINE_CONFIG.EN_QUARTERLY_INTERVAL_MS) {
    try {
      console.log('[EnOrchestrator] Generating English quarterly review...');
      const { generateDailyBriefEn } = await import('@/lib/pipeline/agents/en-report-generator');
      const report = await generateDailyBriefEn('quarterly');
      if (report) {
        console.log(`[EnOrchestrator] Quarterly review generated: "${report.title}" (${report.confidenceScore}%)`);
        lastQuarterlyReviewTime = now;
      }
    } catch (err: any) {
      console.warn(`[EnOrchestrator] Quarterly review generation failed: ${err.message}`);
    }
  }

  // V413: REMOVED auto-infographic generation call entirely.
  // Auto-infographic was disabled (V412) but still logged every cycle, adding noise.
  // Infographics should ONLY be generated via manual API triggers (/api/infographics/generate-en).
}

// ── Housekeeping ──

async function runHousekeeping(): Promise<void> {
  try {
    // V356: Fix isReady=true but isPublished=false for EN articles WITH limit enforcement
    const hkLimits = await getEnPipelineLimits();
    const hkNow = new Date();
    const hkHourStart = new Date(hkNow);
    hkHourStart.setUTCMinutes(0, 0, 0);
    const hkTodayStart = getTodayStart(EN_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    // V376: Added newsType: 'live' to match quota filter
    const hkVisFilter = {
      locale: 'en',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    const [hkPubToday, hkPubThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...hkVisFilter, publishedAt: { gte: hkTodayStart } } }),
      db.newsItem.count({ where: { ...hkVisFilter, publishedAt: { gte: hkHourStart } } }),
    ]);

    const hkRemainingHourly = hkLimits.maxHourlyEnNews > 0
      ? Math.max(0, hkLimits.maxHourlyEnNews - hkPubThisHour) : 999;
    const hkRemainingDaily = hkLimits.maxDailyEnNews > 0
      ? Math.max(0, hkLimits.maxDailyEnNews - hkPubToday) : 999;
    const hkMaxFix = Math.min(hkRemainingHourly, hkRemainingDaily);

    if (hkMaxFix > 0) {
      // V1044: Only publish articles that have COMPLETE analysis (fullContent) + image
      // Previously this blindly set isPublished=true for any isReady=true article,
      // re-publishing drafts that were intentionally unpublished (missing analysis).
      const articlesToHkFix = await db.newsItem.findMany({
        where: {
          isReady: true,
          isPublished: false,
          locale: 'en',
          // V1044: MUST have complete analysis
          aiAnalysis: { contains: 'fullContent' },
          // V1044: MUST have image (URL or base64)
          generatedImage: { not: '' },
        },
        select: { id: true, fetchedAt: true },
        take: hkMaxFix,
      });
      if (articlesToHkFix.length > 0) {
        // Fix each article individually to set publishedAt = fetchedAt
        for (const art of articlesToHkFix) {
          await db.newsItem.update({
            where: { id: art.id },
            data: { isPublished: true, publishedAt: art.fetchedAt || new Date() },
          });
        }
        const fixResult = { count: articlesToHkFix.length };
        if (fixResult.count > 0) {
          // V359: Record publishes in quota manager's in-process tracking
          try {
            const { recordPublish } = await import('./publish-quota');
            for (let i = 0; i < fixResult.count; i++) {
              recordPublish('en');
            }
          } catch { /* non-critical */ }
          console.log(`[EnOrchestrator V356] Fixed ${fixResult.count} EN articles (limited by quota: hour=${hkPubThisHour}/${hkLimits.maxHourlyEnNews}, day=${hkPubToday}/${hkLimits.maxDailyEnNews})`);
        }
      }
    } else {
      console.log(`[EnOrchestrator V356] Quota reached — skipping isPublished fix. Hour: ${hkPubThisHour}/${hkLimits.maxHourlyEnNews}, Day: ${hkPubToday}/${hkLimits.maxDailyEnNews}`);
    }
  } catch (err: any) {
    console.warn(`[EnOrchestrator] Housekeeping failed: ${err.message}`);
  }

  try {
    // Reset stuck EN articles
    const stuckArticles = await db.newsItem.findMany({
      where: {
        locale: 'en',
        isReady: false,
        isPublished: false,
        retryCount: { gte: MAX_RETRY_COUNT },
      },
      select: { id: true },
      take: 50,
    });

    if (stuckArticles.length > 0) {
      await db.newsItem.updateMany({
        where: { id: { in: stuckArticles.map(a => a.id) } },
        data: { retryCount: 0, lastError: null, processingStage: 'fetched' },
      });
      console.log(`[EnOrchestrator] Reset ${stuckArticles.length} stuck EN articles`);
    }
  } catch (err: any) {
    console.warn(`[EnOrchestrator] Stuck article reset failed: ${err.message}`);
  }

  try {
    // Purge old unprocessed EN articles (>12h old, early stage)
    const ageCutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const purged = await db.newsItem.deleteMany({
      where: {
        locale: 'en',
        isReady: false,
        isPublished: false,
        processingStage: { in: ['fetched', 'content_loaded'] },
        fetchedAt: { lt: ageCutoff },
        retryCount: { lt: MAX_RETRY_COUNT },
      },
    });
    if (purged.count > 0) {
      console.log(`[EnOrchestrator] Purged ${purged.count} aged-out EN articles (>12h old)`);
    }
  } catch (err: any) {
    console.warn(`[EnOrchestrator] Age purge failed: ${err.message}`);
  }

  // Mark-ready with 30% quota cap (matching Arabic pipeline)
  try {
    const markLimits = await getEnPipelineLimits();
    const markResult = await markReadyWithQuotaCap('en', markLimits.maxDailyEnNews, markLimits.maxHourlyEnNews, EN_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0, 'title');
    if (markResult.markedCount > 0 || markResult.fixedPublishedCount > 0) {
      console.log(`[EnOrchestrator] Mark-ready: ${markResult.markedCount} marked, ${markResult.fixedPublishedCount} fixed`);
    }
  } catch (markErr: any) {
    console.warn(`[EnOrchestrator] Mark-ready error: ${markErr.message}`);
  }

  // Strong reset for stuck articles + V120: Archive permanently stuck articles
  try {
    // V120: Track strong reset count. After MAX_STRONG_RESETS_BEFORE_ARCHIVE,
    // archive permanently stuck articles instead of infinitely retrying them.
    strongResetCount++;

    if (strongResetCount >= MAX_STRONG_RESETS_BEFORE_ARCHIVE) {
      // Archive articles that keep failing after multiple strong resets.
      // These are articles where AI consistently fails.
      // Delete them — they're invisible anyway (isReady=false) and just
      // waste AI resources on infinite retry loops.
      const stuckToArchive = await db.newsItem.findMany({
        where: {
          locale: 'en',
          isReady: false,
          isPublished: false,
          retryCount: { gte: Math.floor(MAX_RETRY_COUNT / 2) },
          lastError: { not: null },
        },
        orderBy: { fetchedAt: 'desc' },
        select: { id: true, lastError: true },
        take: 200,
      });

      if (stuckToArchive.length > 0) {
        const archived = await db.newsItem.deleteMany({
          where: {
            id: { in: stuckToArchive.map(a => a.id) },
          },
        });
        console.warn(`[EnOrchestrator V120] ARCHIVED ${archived.count} permanently stuck articles after ${strongResetCount} strong resets. Errors: ${stuckToArchive.slice(0, 3).map(a => a.lastError?.substring(0, 60)).join(' | ')}`);
      }

      // Reset the counter — give remaining/new articles a fresh chance
      strongResetCount = 0;
    }

    await strongReset('en', MAX_RETRY_COUNT);
  } catch (resetErr: any) {
    console.warn(`[EnOrchestrator] Strong reset error: ${resetErr.message}`);
  }
}

// ── Main Cycle ──

async function runCycle(): Promise<void> {
  if (!isRunning) return;
  if (isPaused) {
    scheduleNextCycle();
    return;
  }

  cycleCount++;
  const cycleStart = Date.now();

  // ── V322→V323: Pre-cycle DB health check with enhanced recovery ──
  // Before doing anything, verify the database is accessible.
  // If not, attempt recovery (up to 3 rounds) and skip this cycle if all fail.
  let dbOk = await pingDB();
  if (!dbOk) {
    console.warn(`[EnOrchestrator V323] DB not accessible — attempting recovery...`);
    for (let recoveryAttempt = 1; recoveryAttempt <= 3; recoveryAttempt++) {
      const recovered = await recoverConnection();
      if (recovered) {
        dbOk = await pingDB();
        if (dbOk) {
          console.log(`[EnOrchestrator V323] ✓ DB recovered on attempt ${recoveryAttempt} — proceeding with cycle #${cycleCount}`);
          break;
        }
      }
      // Wait before next recovery attempt
      console.warn(`[EnOrchestrator V323] Recovery attempt ${recoveryAttempt}/3 failed — waiting ${recoveryAttempt * 5}s...`);
      await new Promise(r => setTimeout(r, recoveryAttempt * 5000));
    }
    if (!dbOk) {
      console.error(`[EnOrchestrator V323] ✗ All 3 DB recovery attempts failed — skipping cycle #${cycleCount}`);
      lastError = 'Database connection failed — 3 recovery attempts unsuccessful';
      totalErrors++;
      scheduleNextCycle();
      return;
    }
  }

  console.log(`[EnOrchestrator V412] Cycle #${cycleCount} starting (interval=${NEWS_CYCLE_INTERVAL_MS/1000}s, max=${MAX_ARTICLES_PER_CYCLE}, concurrent=${EN_CONCURRENT_ARTICLES})...`);

  try {
    // V412: Diagnostic — Log actual DB limits at the start of each cycle
    // so we can see if site_settings is capping the pipeline too low.
    try {
      const diagLimits = await getEnPipelineLimits();
      const { canPublish: diagCanPublish } = await import('./publish-quota');
      const diagQuota = await diagCanPublish('en');
      console.log(`[EnOrchestrator V412] DIAGNOSTIC — DB Limits: daily=${diagLimits.maxDailyEnNews}, hourly=${diagLimits.maxHourlyEnNews} | Quota: hour=${diagQuota.hourCount}/${diagQuota.hourLimit} (remaining=${diagQuota.hourRemaining}), day=${diagQuota.dayCount}/${diagQuota.dayLimit} (remaining=${diagQuota.dayRemaining})`);
    } catch (diagErr: any) {
      console.warn(`[EnOrchestrator V412] Diagnostic failed: ${diagErr.message}`);
    }

    // V359: Early quota check — skip processing if limits reached.
    // This saves API calls (no en-processor/imager needed) and DB queries.
    // Like the Arabic orchestrator's V93b early return.
    try {
      const { canPublish } = await import('./publish-quota');
      const quotaCheck = await canPublish('en');
      if (!quotaCheck.allowed) {
        // Still fetch to keep queue fresh, but skip processing
        const fetchResult = await fetchEnglishRSSFeeds();
        totalFetched += fetchResult.fetched;
        console.log(`[EnOrchestrator V412] Quota reached — skipping processing. Fetch: ${fetchResult.fetched}. ${quotaCheck.reason}`);
        lastCycleTime = Date.now();
        scheduleNextCycle();
        return;
      }
    } catch (quotaErr: any) {
      // Non-critical — continue if quota check fails
      console.warn(`[EnOrchestrator V412] Quota check failed: ${quotaErr.message}`);
    }

    // ── Step 1: Fetch new English articles ──
    const fetchResult = await fetchEnglishRSSFeeds();
    totalFetched += fetchResult.fetched;

    // V121: CASCADE FAILURE — log warning but CONTINUE processing.
    // Better to process SOME articles with available providers than ZERO.
    if (isCascadeFailure()) {
      console.warn(`[EnOrchestrator V121] AI provider CASCADE FAILURE detected — continuing processing with available providers. ` +
        `Multiple providers are rate-limited but pipeline will NOT stop.`);
    }

    // ── Step 2: Process fetched articles through full pipeline ──
    const processResult = await processEnglishArticles(MAX_ARTICLES_PER_CYCLE);

    // ── Step 3: Reprocess incomplete published articles ──
    let reprocessResult: EnProcessResult | null = null;
    if (cycleCount % 3 === 0) { // Every 3 cycles (~45 min)
      reprocessResult = await reprocessEnglishArticles(3);
    }

    totalProcessed += processResult.processed;
    totalPublished += processResult.published;
    totalErrors += processResult.failed;
    lastError = null;

    // V56/V410: Smart Watchdog — track consecutive empty cycles
    // V410: Enhanced to match Arabic pipeline — strong reset + archive permanently stuck articles
    const publishedThisCycle = processResult.published;
    const processedThisCycle = processResult.processed;
    if (publishedThisCycle === 0 && processedThisCycle > 0) {
      consecutiveEmptyCycles++;
      if (consecutiveEmptyCycles >= MAX_EMPTY_CYCLES_BEFORE_RESET) {
        console.warn(`[EnOrchestrator V410] Smart Watchdog: ${consecutiveEmptyCycles} consecutive empty cycles! Triggering strong reset + archive...`);

        // V410: Archive permanently stuck articles (like Arabic pipeline V120)
        strongResetCount++;
        if (strongResetCount >= MAX_STRONG_RESETS_BEFORE_ARCHIVE) {
          try {
            const stuckToArchive = await db.newsItem.findMany({
              where: {
                locale: 'en',
                isReady: false,
                isPublished: false,
                retryCount: { gte: Math.floor(MAX_RETRY_COUNT / 2) },
                lastError: { not: null },
              },
              orderBy: { fetchedAt: 'desc' },
              select: { id: true, lastError: true },
              take: 200,
            });
            if (stuckToArchive.length > 0) {
              const archived = await db.newsItem.deleteMany({
                where: { id: { in: stuckToArchive.map(a => a.id) } },
              });
              console.warn(`[EnOrchestrator V410] ARCHIVED ${archived.count} permanently stuck EN articles after ${strongResetCount} strong resets`);
            }
            strongResetCount = 0;
          } catch (archiveErr: any) {
            console.warn(`[EnOrchestrator V410] Archive failed: ${archiveErr.message}`);
          }
        }

        await strongReset('en', MAX_RETRY_COUNT);
        consecutiveEmptyCycles = 0;
      }
    } else if (publishedThisCycle > 0) {
      consecutiveEmptyCycles = 0;
      strongResetCount = Math.max(0, strongResetCount - 1); // Decay on success
    }

    // ── Step 4: Generate reports if needed ──
    await generateReportsIfNeeded();

    // ── Step 5: Housekeeping (every 10 cycles) ──
    if (cycleCount % 10 === 0) {
      await runHousekeeping();
    }

    // V125→V244→V410: Reset terminal-stage articles (rejected + skipped) back to 'fetched'.
    // V410: Now runs EVERY cycle (not conditionally) — matches Arabic pipeline behavior.
    // 'skipped' articles had valid content but AI refused to process them.
    // 'rejected' articles are reset for the same reason.
    // Also reset high-retry articles that are stuck with errors.
    try {
      const terminalCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const terminalArticles = await db.newsItem.findMany({
        where: {
          locale: 'en',
          processingStage: { in: ['rejected', 'skipped'] },
          isReady: false,
          isPublished: false,
          fetchedAt: { gte: terminalCutoff },
        },
        select: { id: true },
        take: 100,
      });
      if (terminalArticles.length > 0) {
        const resetResult = await db.newsItem.updateMany({
          where: { id: { in: terminalArticles.map(a => a.id) } },
          data: {
            processingStage: 'fetched',
            retryCount: 0,
            lastError: null,
          },
        });
        if (resetResult.count > 0) {
          console.log(`[EnOrchestrator V244] Reset ${resetResult.count} terminal-stage (rejected/skipped) articles back to 'fetched' for re-processing`);
        }
      }
    } catch (err: any) {
      console.warn(`[EnOrchestrator V244] Terminal-stage reset failed: ${err.message}`);
    }

    // V410: Force-reset recent failed articles (like Arabic pipeline V45)
    // Articles that hit MAX_RETRY but are still recent should get another chance —
    // the pipeline may have been experiencing temporary AI provider issues that are now resolved.
    try {
      const forceResetArticles = await db.newsItem.findMany({
        where: {
          locale: 'en',
          isReady: false,
          isPublished: false,
          retryCount: { gte: MAX_RETRY_COUNT },
          fetchedAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }, // Last 4h only
        },
        select: { id: true },
        take: 50,
      });
      if (forceResetArticles.length > 0) {
        const forceResult = await db.newsItem.updateMany({
          where: { id: { in: forceResetArticles.map(a => a.id) } },
          data: { retryCount: 0, lastError: null, processingStage: 'fetched' },
        });
        if (forceResult.count > 0) {
          console.log(`[EnOrchestrator V410] Force-reset ${forceResult.count} recently failed EN articles back to 'fetched'`);
        }
      }
    } catch (forceErr: any) {
      console.warn(`[EnOrchestrator V410] Force reset failed: ${forceErr.message}`);
    }

    const cycleDuration = Date.now() - cycleStart;
    lastCycleTime = Date.now();

    if (processResult.published > 0 || fetchResult.fetched > 0) {
      console.log(`[EnOrchestrator] Cycle #${cycleCount} done: fetched ${fetchResult.fetched}, published ${processResult.published}, failed ${processResult.failed}${reprocessResult ? `, reprocessed ${reprocessResult.processed}` : ''} in ${cycleDuration}ms`);
    }
  } catch (err: any) {
    lastError = err.message;
    totalErrors++;
    console.error(`[EnOrchestrator] Cycle #${cycleCount} FATAL ERROR:`, err.message);
  }

  scheduleNextCycle();
}

// ── Schedule Next Cycle ──

function scheduleNextCycle(): void {
  if (!isRunning) return;
  cycleTimer = setTimeout(async () => {
    try {
      await runCycle();
    } catch (err: any) {
      console.error(`[EnOrchestrator] Cycle failed: ${err.message}`);
      scheduleNextCycle(); // Always keep the loop going
    }
  }, NEWS_CYCLE_INTERVAL_MS);
}

// ── Public API ──

export function startEnOrchestrator(): void {
  if (isRunning) {
    const idleMs = Date.now() - lastCycleTime;
    if (lastCycleTime > 0 && idleMs > WATCHDOG_MAX_IDLE_MS) {
      console.warn(`[EnOrchestrator] RUNNING but STALE — last cycle ${Math.round(idleMs / 60000)} min ago. Force-restarting!`);
      stopEnOrchestrator();
    } else {
      console.log('[EnOrchestrator] Already running');
      return;
    }
  }

  isRunning = true;
  isPaused = false;

  // V4: Start DB keepalive to prevent Supabase from dropping idle connections.
  // The keepalive ONLY pings — it does NOT call pg_terminate_backend (which was
  // the root cause of the recurring "DB: Disconnected" issue in V3).
  // See db.ts V4 comments for the full root cause analysis.
  try {
    startDBKeepalive();
    console.log('[EnOrchestrator V4] ✓ DB keepalive started (pings every 2 min, no pg_terminate_backend)');
  } catch {
    console.warn('[EnOrchestrator V4] DB keepalive failed to start — will rely on per-cycle recovery');
  }

  console.log(`[EnOrchestrator] Starting — cycle every ${NEWS_CYCLE_INTERVAL_MS / 1000}s, max ${MAX_ARTICLES_PER_CYCLE} articles/cycle. Watchdog: restarts if idle > ${WATCHDOG_MAX_IDLE_MS / 60000} min. Reports: daily/weekly/monthly/technical via EN_PIPELINE_CONFIG.`);

  // Initialize report timers
  if (lastDailyBriefTime === 0) lastDailyBriefTime = Date.now();
  if (lastWeeklyAnalysisTime === 0) lastWeeklyAnalysisTime = Date.now();
  if (lastMonthlyOutlookTime === 0) lastMonthlyOutlookTime = Date.now();
  if (lastTechnicalAnalysisTime === 0) lastTechnicalAnalysisTime = Date.now();
  if (lastQuarterlyReviewTime === 0) lastQuarterlyReviewTime = Date.now();

  // Start watchdog
  if (watchdogTimer) clearInterval(watchdogTimer);
  watchdogTimer = setInterval(() => {
    if (!isRunning) return;
    const idleMs = Date.now() - lastCycleTime;
    if (lastCycleTime > 0 && idleMs > WATCHDOG_MAX_IDLE_MS) {
      console.warn(`[EnOrchestrator Watchdog] STALE — last cycle ${Math.round(idleMs / 60000)} min ago. Force-restarting!`);
      stopEnOrchestrator();
      startEnOrchestrator();
    }
  }, WATCHDOG_INTERVAL_MS);

  // Start first cycle after startup delay
  setTimeout(async () => {
    try {
      await runCycle();
    } catch (err: any) {
      console.error(`[EnOrchestrator] Initial cycle failed: ${err.message}`);
      scheduleNextCycle();
    }
  }, STARTUP_DELAY_MS);
}

export function stopEnOrchestrator(): void {
  isRunning = false;
  if (cycleTimer) {
    clearTimeout(cycleTimer);
    cycleTimer = null;
  }
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
  console.log('[EnOrchestrator] Stopped');
}

export function pauseEnOrchestrator(): void {
  isPaused = true;
  console.log('[EnOrchestrator] Paused');
}

export function resumeEnOrchestrator(): void {
  isPaused = false;
  console.log('[EnOrchestrator] Resumed');
}

export async function getEnOrchestratorStats() {
  const idleMs = lastCycleTime > 0 ? Date.now() - lastCycleTime : null;
  const enLimits = await getEnPipelineLimits();

  // V359: Query DB for actual total published count instead of in-memory counter.
  // The in-memory counter resets to 0 on server restart, causing impossible stats
  // like totalPublished < todayPublished. The DB count is always accurate.
  // V377: Use visibility filter — only count live news visible on the frontend
  let dbTotalPublished = totalPublished; // fallback to in-memory counter
  try {
    dbTotalPublished = await db.newsItem.count({
      where: {
        locale: 'en',
        isReady: true,
        isPublished: true,
        newsType: 'live',
        slug: { not: '' },
        title: { not: '' },
      },
    });
  } catch (dbErr: any) {
    console.warn(`[EnOrchestrator V359] DB totalPublished count failed: ${dbErr.message}`);
  }

  return {
    isRunning,
    isPaused,
    cycleCount,
    lastCycleTime: lastCycleTime ? new Date(lastCycleTime).toISOString() : null,
    idleMinutes: idleMs ? Math.round(idleMs / 60000) : null,
    isStale: idleMs !== null && idleMs > WATCHDOG_MAX_IDLE_MS,
    lastError,
    totalPublished: dbTotalPublished,
    totalProcessed,
    totalFetched,
    totalErrors,
    config: {
      newsCycleIntervalMs: NEWS_CYCLE_INTERVAL_MS,
      enDailyIntervalMs: EN_PIPELINE_CONFIG.EN_DAILY_INTERVAL_MS,
      enWeeklyIntervalMs: EN_PIPELINE_CONFIG.EN_WEEKLY_INTERVAL_MS,
      enMonthlyIntervalMs: EN_PIPELINE_CONFIG.EN_MONTHLY_INTERVAL_MS,
      enTechnicalIntervalMs: EN_PIPELINE_CONFIG.EN_TECHNICAL_INTERVAL_MS,
      enQuarterlyIntervalMs: EN_PIPELINE_CONFIG.EN_QUARTERLY_INTERVAL_MS,
      enReportAssetClasses: EN_PIPELINE_CONFIG.EN_REPORT_ASSET_CLASSES,
      maxArticlesPerCycle: MAX_ARTICLES_PER_CYCLE,
      maxRetryCount: MAX_RETRY_COUNT,
      maxDailyPublished: enLimits.maxDailyEnNews,
      maxHourlyPublished: enLimits.maxHourlyEnNews,
    },
    reports: {
      lastDailyBriefTime: lastDailyBriefTime ? new Date(lastDailyBriefTime).toISOString() : null,
      lastWeeklyAnalysisTime: lastWeeklyAnalysisTime ? new Date(lastWeeklyAnalysisTime).toISOString() : null,
      lastMonthlyOutlookTime: lastMonthlyOutlookTime ? new Date(lastMonthlyOutlookTime).toISOString() : null,
      lastTechnicalAnalysisTime: lastTechnicalAnalysisTime ? new Date(lastTechnicalAnalysisTime).toISOString() : null,
      lastQuarterlyReviewTime: lastQuarterlyReviewTime ? new Date(lastQuarterlyReviewTime).toISOString() : null,
      nextDailyBriefIn: lastDailyBriefTime > 0 ? Math.max(0, Math.round((EN_PIPELINE_CONFIG.EN_DAILY_INTERVAL_MS - (Date.now() - lastDailyBriefTime)) / 60000)) : null,
      nextWeeklyAnalysisIn: lastWeeklyAnalysisTime > 0 ? Math.max(0, Math.round((EN_PIPELINE_CONFIG.EN_WEEKLY_INTERVAL_MS - (Date.now() - lastWeeklyAnalysisTime)) / 60000)) : null,
      nextMonthlyOutlookIn: lastMonthlyOutlookTime > 0 ? Math.max(0, Math.round((EN_PIPELINE_CONFIG.EN_MONTHLY_INTERVAL_MS - (Date.now() - lastMonthlyOutlookTime)) / 60000)) : null,
      nextTechnicalAnalysisIn: lastTechnicalAnalysisTime > 0 ? Math.max(0, Math.round((EN_PIPELINE_CONFIG.EN_TECHNICAL_INTERVAL_MS - (Date.now() - lastTechnicalAnalysisTime)) / 60000)) : null,
      nextQuarterlyReviewIn: lastQuarterlyReviewTime > 0 ? Math.max(0, Math.round((EN_PIPELINE_CONFIG.EN_QUARTERLY_INTERVAL_MS - (Date.now() - lastQuarterlyReviewTime)) / 60000)) : null,
    },
  };
}

// ensureRunning — called by external triggers (health checks, cron, etc.)
export function ensureEnRunning(): { wasRunning: boolean; wasStale: boolean; restarted: boolean } {
  const idleMs = lastCycleTime > 0 ? Date.now() - lastCycleTime : null;
  const wasStale = idleMs !== null && idleMs > WATCHDOG_MAX_IDLE_MS;
  const wasRunning = isRunning;

  if (!isRunning || wasStale) {
    if (wasStale) {
      console.warn(`[EnOrchestrator] ensureRunning: STALE (idle ${Math.round((idleMs || 0) / 60000)} min) — force-restarting`);
      stopEnOrchestrator();
    } else {
      console.log(`[EnOrchestrator] ensureRunning: NOT running — starting`);
    }
    startEnOrchestrator();
    return { wasRunning, wasStale, restarted: true };
  }

  return { wasRunning: true, wasStale: false, restarted: false };
}
