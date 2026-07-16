// ─── English News Cron API Route V3 ──────────────────────────
// FULL PIPELINE: fetch → AI analysis → image generation → publish
//
// V3 KEY CHANGES (replacing V2 direct-publish bypass):
// - `process` action: Full pipeline processing for EN articles
//   (en-processor → imager → publisher) — NO bypasses
// - `full-cycle` action: fetch + process in one call (main cron action)
// - `direct-publish` kept as emergency fast-path ONLY (adds Canvas image)
// - `reprocess` action: Re-processes published articles missing AI analysis/images
// - Removed auto-direct-publish from fetch action
//
// V2 was publishing articles WITHOUT AI analysis, WITHOUT generated images,
// and with short RSS-summary content. V3 ensures full quality.
//
// This is an ADDITIVE file — the Arabic cron route is untouched.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EN_PIPELINE_CONFIG, getEnPipelineLimits } from '@/lib/pipeline/en-pipeline-config';
import { isSvgPlaceholderImage } from '@/lib/image-storage';
import { getTodayStart, liveQuotaReCheck, runContentLoaderStep, markReadyWithQuotaCap, strongReset, recordAIFailure, recordAISuccess, isDegradedMode, parseRSSXML } from '@/lib/pipeline/shared-pipeline-utils';

export const dynamic = 'force-dynamic';

// ─── English RSS Fetcher ───────────────────────────────────

interface EnFetchResult {
  fetched: number;
  duplicates: number;
  filtered: number;
  errors: number;
  duration: number;
}

/**
 * Fetch articles from English RSS feeds defined in EN_PIPELINE_CONFIG.
 * Saves them to DB with locale: 'en' and processingStage: 'fetched'.
 */
async function fetchEnglishRSSFeeds(): Promise<EnFetchResult> {
  const startTime = Date.now();
  const result: EnFetchResult = { fetched: 0, duplicates: 0, filtered: 0, errors: 0, duration: 0 };

  try {
    console.log('[EnCron V3] Fetching English RSS feeds...');

    const feeds = EN_PIPELINE_CONFIG.RSS_FEEDS_EN;
    const allItems: Array<{
      title: string;
      summary: string;
      url: string;
      source: string;
      category: string;
      date: string;
    }> = [];

    // Fetch each feed
    for (const feed of feeds) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(feed.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': feed.url.includes('sec.gov') ? 'Rouaa News Agent contact@rouaa.com' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
          },
          next: { revalidate: 300 },
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`[EnCron V3] RSS feed ${feed.source} returned ${response.status}`);
          continue;
        }

        const xml = await response.text();
        const items = parseRSSXML(xml, feed.category, feed.source);
        allItems.push(...items);
      } catch (err: any) {
        console.warn(`[EnCron V3] Failed to fetch ${feed.source}: ${err.message}`);
        result.errors++;
      }
    }

    if (allItems.length === 0) {
      console.log('[EnCron V3] No items fetched from English RSS feeds');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[EnCron V3] Fetched ${allItems.length} items from ${feeds.length} English feeds. Saving...`);

    // V410: REMOVED financial keyword filter — all RSS feeds are ALREADY curated financial
    // sources. The keyword filter was incorrectly rejecting valid business/economy articles
    // from sources like BBC Business, NYT Economy, Al Jazeera, etc. This matches the
    // en-orchestrator.ts V393 change. Since we control the source list, every article
    // from these feeds IS financial news.

    // Save to database
    for (const item of allItems) {
      try {
        if (!item.url || item.url.length < 5) {
          result.errors++;
          continue;
        }

        // V410: No financial keyword filter — all feeds are already curated financial sources

        // Locale-aware deduplication: check against English articles only
        const existing = await db.newsItem.findFirst({
          where: { url: item.url, locale: 'en' },
          select: { id: true },
        });

        if (existing) {
          result.duplicates++;
          continue;
        }

        // Get category in English from EN_PIPELINE_CONFIG
        const enCategory = EN_PIPELINE_CONFIG.CATEGORY_MAP_EN[item.category] || 'Economy';

        // Generate slug from English title (includes random suffix)
        const { generateSlug } = await import('@/lib/slug');
        const slug = generateSlug(item.title);

        // Simple sentiment analysis
        const positiveWords = ['rise', 'surge', 'gain', 'rally', 'boost', 'jump', 'climb', 'record', 'beat', 'growth', 'profit'];
        const negativeWords = ['fall', 'drop', 'decline', 'slide', 'sink', 'crash', 'loss', 'low', 'miss', 'cut', 'recession', 'plunge'];
        const textToCheck = `${item.title} ${item.summary}`;
        const lowerText = textToCheck.toLowerCase();
        let posScore = 0, negScore = 0;
        positiveWords.forEach(w => { if (lowerText.includes(w)) posScore += 10; });
        negativeWords.forEach(w => { if (lowerText.includes(w)) negScore += 10; });
        const sentiment = posScore > negScore + 10 ? 'positive' : negScore > posScore + 10 ? 'negative' : 'neutral';
        const sentimentScore = posScore > negScore + 10 ? Math.min(55 + posScore, 95) : negScore > posScore + 10 ? Math.min(55 + negScore, 95) : 55;

        // V3: Use the RSS summary as initial content — en-processor will enhance it
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
              isOfficialSource: isOfficialSourceUrl(item.url) || isOfficialSourceName(item.source), // V1070
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
                  isOfficialSource: isOfficialSourceUrl(item.url) || isOfficialSourceName(item.source), // V1070
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
        console.error(`[EnCron V3] Error saving "${item.title?.slice(0, 40)}": ${err.message}`);
      }
    }

    result.duration = Date.now() - startTime;
    console.log(`[EnCron V3] Done: ${result.fetched} new, ${result.duplicates} dupes, ${result.filtered} non-financial filtered, ${result.errors} errors in ${result.duration}ms`);
    return result;
  } catch (err: any) {
    result.errors++;
    result.duration = Date.now() - startTime;
    console.error('[EnCron V3] Fatal fetch error:', err.message);
    return result;
  }
}

// ─── RSS XML Parser ── (imported from shared-pipeline-utils) ──

// ─── V3: Full Pipeline Processing for English Articles ────────
// Processes articles through: en-processor → imager → publisher
// This is the PROPER pipeline — no shortcuts, full quality.

interface EnProcessResult {
  processed: number;
  published: number;
  failed: number;
  skipped: number;
  details: string[];
  duration: number;
}

async function processEnglishArticles(maxArticles: number = 20): Promise<EnProcessResult> {
  const startTime = Date.now();
  const result: EnProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [], duration: 0 };

  try {
    // Find English articles that need processing (fetched or content_loaded stage)
    const unprocessedArticles = await db.newsItem.findMany({
      where: {
        locale: 'en',
        isReady: false,
        isPublished: false,
        processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'translated', 'skipped', 'imaged'] },
        retryCount: { lt: 15 },  // V416: Matches MAX_RETRY_COUNT in en-orchestrator — kept as literal to avoid circular import
        title: { not: '' },
      },
      orderBy: { fetchedAt: 'desc' },
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

    console.log(`[EnCron V3] process: Found ${unprocessedArticles.length} English articles to process`);

    // Check EN-specific publish limits
    // V314: Use dynamic limits from DB (admin can change without redeployment)
    const enLimits = await getEnPipelineLimits();
    const maxDaily = enLimits.maxDailyEnNews;
    const maxHourly = enLimits.maxHourlyEnNews;
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setUTCMinutes(0, 0, 0);
    const todayStart = getTodayStart(EN_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    // V376: Added newsType: 'live' — quota should ONLY count live news articles
    const enPublishedFilter = {
      locale: 'en',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    // V317: Use publishedAt instead of fetchedAt for accurate daily/hourly counts
    const [publishedToday, publishedThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...enPublishedFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...enPublishedFilter, publishedAt: { gte: hourStart } } }),
    ]);

    const remainingHourly = maxHourly > 0 ? Math.max(0, maxHourly - publishedThisHour) : 999;
    const remainingDaily = maxDaily > 0 ? Math.max(0, maxDaily - publishedToday) : 999;

    console.log(`[EnCron V3] process: Quota — hour: ${publishedThisHour}/${maxHourly}, day: ${publishedToday}/${maxDaily}`);

    if (remainingHourly <= 0 || remainingDaily <= 0) {
      result.details.push(`Quota reached — hour: ${publishedThisHour}/${maxHourly}, day: ${publishedToday}/${maxDaily}`);
      result.duration = Date.now() - startTime;
      return result;
    }

    // Process each article through the full pipeline
    let publishCount = 0;

    for (const article of unprocessedArticles) {
      if (publishCount >= remainingHourly || publishCount >= remainingDaily) {
        result.skipped += unprocessedArticles.length - result.processed;
        result.details.push(`Quota reached after ${publishCount} articles`);
        break;
      }

      // V358: Live quota re-check every 5 articles — catches concurrent publishing
      // from the EN orchestrator or other cron routes. Without this, the cron route
      // and the orchestrator can both publish simultaneously, exceeding the limit.
      if (publishCount > 0 && publishCount % 5 === 0) {
        try {
          const [liveToday, liveHour] = await Promise.all([
            db.newsItem.count({ where: { ...enPublishedFilter, publishedAt: { gte: todayStart } } }),
            db.newsItem.count({ where: { ...enPublishedFilter, publishedAt: { gte: hourStart } } }),
          ]);
          const liveRemainingHour = maxHourly > 0 ? maxHourly - liveHour : 999;
          const liveRemainingDay = maxDaily > 0 ? maxDaily - liveToday : 999;
          if (liveRemainingHour <= 0 || liveRemainingDay <= 0) {
            console.log(`[EnCron V358] Live quota re-check: limit reached (hour=${liveHour}/${maxHourly}, day=${liveToday}/${maxDaily}). Stopping after ${publishCount} published.`);
            result.skipped += unprocessedArticles.length - result.processed;
            break;
          }
        } catch (reCheckErr: any) {
          // Non-critical — continue processing if re-check fails
          console.warn(`[EnCron V358] Live quota re-check failed: ${reCheckErr.message}`);
        }
      }

      try {
        console.log(`[EnCron V3] Processing article ${article.id}: "${article.title?.slice(0, 50)}..." (stage: ${article.processingStage})`);

        // ── Step 0: Run content-loader if article is at 'fetched' stage ──
        if (article.processingStage === 'fetched') {
          try {
            await runContentLoaderStep(article.id, 'en');
          } catch (clErr: any) {
            console.warn(`[EnCron V3] Content loader error for ${article.id}: ${clErr.message}`);
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
            console.log(`[EnCron V3] en-processor succeeded for ${article.id}: fields=${enResult.fields.join(',')}`);
          } else {
            console.warn(`[EnCron V3] en-processor failed for ${article.id}: ${enResult.error} — retrying once`);
            // Retry once
            const retryResult = await processArticleEn(article.id);
            if (retryResult.success) {
              processorSuccess = true;
              recordAISuccess('en');
              console.log(`[EnCron V3] en-processor retry succeeded for ${article.id}`);
            } else {
              recordAIFailure('en');
              console.warn(`[EnCron V3] en-processor retry also failed for ${article.id}: ${retryResult.error}`);
            }
          }
        } catch (procErr: any) {
          recordAIFailure('en');
          console.error(`[EnCron V3] en-processor fatal error for ${article.id}: ${procErr.message}`);
        }

        if (!processorSuccess) {
          // If en-processor fails, try to use existing content + Canvas image
          // This ensures articles still get published even when AI is down
          console.log(`[EnCron V3] en-processor failed — will try Canvas image + direct publish for ${article.id}`);
        }

        // ── Step 2: Run imager (hybrid: ZAI SDK → Pollinations → Canvas/Sharp) ──
        let imageSuccess = false;
        try {
          const { imageArticle } = await import('@/lib/pipeline/agents/imager');
          const imageResult = await imageArticle(article.id);
          if (imageResult.success) {
            imageSuccess = true;
            console.log(`[EnCron V3] imager succeeded for ${article.id}: source=${imageResult.imageSource}`);
          } else {
            console.warn(`[EnCron V3] imager failed for ${article.id}: ${imageResult.error}`);
          }
        } catch (imgErr: any) {
          console.error(`[EnCron V3] imager fatal error for ${article.id}: ${imgErr.message}`);
        }

        // ── Step 3: Run publisher (quality validation + publish) ──
        let publishSuccess = false;
        try {
          // Check if article is at 'imaged' stage now
          const updatedArticle = await db.newsItem.findUnique({
            where: { id: article.id },
            // EGRESS FIX: removed generatedImage from select — use processingStage to check image existence
            select: { processingStage: true, aiAnalysis: true, content: true, title: true },
          });

          if (updatedArticle?.processingStage === 'imaged') {
            const { publishArticle } = await import('@/lib/pipeline/agents/publisher');
            const pubResult = await publishArticle(article.id);
            if (pubResult.success) {
              publishSuccess = true;
              publishCount++;
              result.published++;
              console.log(`[EnCron V3] ✓ Article ${article.id} PUBLISHED successfully`);
            } else {
              console.warn(`[EnCron V3] publisher rejected ${article.id}: ${pubResult.reason}`);
            }
          } else {
            // Article didn't reach imaged stage — try Canvas image fallback + direct publish
            console.log(`[EnCron V3] Article ${article.id} not at 'imaged' stage — trying Canvas image + direct publish`);

            // Generate Canvas image as guaranteed fallback
            try {
              const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
              const title = updatedArticle?.title || article.title || 'Financial News';
              // V416 FIX: Removed dead variable `catConfig` that incorrectly used `article.processingStage`
              // instead of a category field. The correct category is fetched below from articleFull.

              // Get category from article
              const articleFull = await db.newsItem.findUnique({
                where: { id: article.id },
                select: { category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true },
              });

              const canvasBuffer = await generateArticleImage({
                title,
                category: articleFull?.categoryId || articleFull?.category || 'economy',
                locale: 'en',
                newsType: articleFull?.newsType || undefined,
                sentiment: articleFull?.sentiment || undefined,
                source: articleFull?.sourceName || articleFull?.source || undefined,
              });

              if (canvasBuffer && canvasBuffer.length > 500) {
                // Save the Canvas image
                const { uploadImageToR2 } = await import('@/lib/image-storage');
                const base64DataUrl = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;

                let storedValue: string;
                // Try R2 first
                const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
                if (r2Result.success) {
                  storedValue = r2Result.url;
                } else {
                  storedValue = null;
                }

                // V414 FIX: Use MIN_EN_CONTENT_LENGTH (80) from config instead of hardcoded 200.
                // The 200-char threshold was rejecting valid RSS articles with short summaries (80-200 chars),
                // causing them to fall into degraded mode or be stuck. Matches en-orchestrator.ts V413.
                const hasContent = (updatedArticle?.content && updatedArticle.content.length >= EN_PIPELINE_CONFIG.MIN_EN_CONTENT_LENGTH);
                const hasAnalysis = (updatedArticle?.aiAnalysis && updatedArticle.aiAnalysis.length > 50);

                if (hasContent && hasAnalysis) {
                  // Full quality — use publisher
                  await db.newsItem.update({
                    where: { id: article.id },
                    data: {
                      generatedImage: storedValue,
                      processingStage: 'imaged',
                    },
                  });

                  const { publishArticle } = await import('@/lib/pipeline/agents/publisher');
                  const pubResult = await publishArticle(article.id);
                  if (pubResult.success) {
                    publishSuccess = true;
                    publishCount++;
                    result.published++;
                    console.log(`[EnCron V3] ✓ Article ${article.id} PUBLISHED with Canvas image via publisher`);

                    // V312: Submit Stable Horde in background for AI image replacement
                    try {
                      const { submitToStableHordeBackground } = await import('@/lib/pipeline/agents/imager');
                      const articleFull = await db.newsItem.findUnique({ where: { id: article.id } });
                      if (articleFull) {
                        submitToStableHordeBackground(article.id, articleFull).catch(err => {
                          console.warn(`[EnCron V3] Background Horde submit failed for ${article.id}: ${err?.message?.slice(0, 80)}`);
                        });
                      }
                    } catch (hordeErr: any) {
                      console.warn(`[EnCron V3] Horde submit import failed for ${article.id}: ${hordeErr.message?.slice(0, 80)}`);
                    }
                  }
                } else {
                  // V1064: GOLDEN RULE — never publish without full AI analysis
                  // Previous "degraded mode" published articles with thin/missing analysis,
                  // producing empty article pages. Now we save the image but keep the article
                  // as DRAFT. The analyzer will process it later via analyzeRecentAINews.
                  const { generateSlug } = await import('@/lib/slug');
                  const slug = updatedArticle?.title ? generateSlug(updatedArticle.title) : article.id;

                  await db.newsItem.update({
                    where: { id: article.id },
                    data: {
                      generatedImage: storedValue,
                      imageUrl: storedValue.startsWith('http') ? storedValue : `/api/article-image/${article.id}`,
                      isReady: false,
                      isPublished: false,
                      processingStage: 'content_loaded',
                      slug: slug || article.id,
                    },
                  });

                  console.warn(`[EnCron V1064] Article ${article.id}: image saved but NOT published — missing ${!hasContent ? 'content' : 'analysis'}. Will retry next cycle.`);
                }
              }
            } catch (canvasErr: any) {
              console.error(`[EnCron V3] Canvas image fallback failed for ${article.id}: ${canvasErr.message}`);
            }
          }
        } catch (pubErr: any) {
          console.error(`[EnCron V3] publisher error for ${article.id}: ${pubErr.message}`);
        }

        if (publishSuccess) {
          result.processed++;
        } else if (processorSuccess || imageSuccess) {
          // Partial progress — will be retried next cycle
          result.processed++;
          result.failed++;
        } else {
          result.failed++;
        }

      } catch (err: any) {
        result.failed++;
        console.error(`[EnCron V3] Error processing article ${article.id}: ${err.message}`);
        // Record error in DB for retry tracking
        try {
          const { recordError } = await import('@/lib/pipeline/queue/job-manager');
          await recordError(article.id, `EN pipeline error: ${err.message}`);
        } catch { /* non-critical */ }
      }
    }

    result.details.push(`Processed: ${result.processed}, Published: ${result.published}, Failed: ${result.failed}, Skipped: ${result.skipped}`);
    console.log(`[EnCron V3] process complete: ${result.details.join(' | ')}`);
  } catch (err: any) {
    result.failed++;
    result.details.push(`Fatal error: ${err.message}`);
    console.error(`[EnCron V3] process fatal error: ${err.message}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ─── V3: Reprocess published articles missing AI analysis/images ──
// Finds already-published EN articles that lack aiAnalysis or generatedImage
// and re-processes them through the full pipeline.

async function reprocessEnglishArticles(maxArticles: number = 5): Promise<EnProcessResult> {
  const startTime = Date.now();
  const result: EnProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [], duration: 0 };

  try {
    // Find published EN articles missing AI analysis or generated image
    // Note: Prisma doesn't support `length` filter on String fields directly.
    // We fetch articles and filter in-memory instead.
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
      select: {
        id: true,
        title: true,
        aiAnalysis: true,
        processingStage: true,
      },
      take: maxArticles * 3, // Fetch more since we'll filter in-memory
    });

    // EGRESS FIX: simplified filter — where clause already ensures null/empty generatedImage is caught
    // SVG placeholder detection is handled by auto-migrate
    const incompleteArticles = candidateArticles.filter(a => {
      const hasAnalysis = a.aiAnalysis && a.aiAnalysis.length >= 50;
      // Articles with null/empty generatedImage are already caught by the OR where clause
      return !hasAnalysis;
    }).slice(0, maxArticles);

    if (incompleteArticles.length === 0) {
      result.details.push('No incomplete articles to reprocess');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[EnCron V3] reprocess: Found ${incompleteArticles.length} published EN articles missing analysis/images`);

    for (const article of incompleteArticles) {
      try {
        const needsAnalysis = !article.aiAnalysis || article.aiAnalysis.length < 50;
        // EGRESS FIX: use processingStage instead of generatedImage to determine if image is needed
        const needsImage = article.processingStage !== 'imaged';

        console.log(`[EnCron V3] Reprocessing ${article.id}: needsAnalysis=${needsAnalysis}, needsImage=${needsImage}`);

        // Step 1: Re-run en-processor if missing analysis
        if (needsAnalysis) {
          try {
            const { processArticleEn } = await import('@/lib/pipeline/agents/en-processor');
            const enResult = await processArticleEn(article.id);
            if (enResult.success) {
              console.log(`[EnCron V3] reprocess: en-processor succeeded for ${article.id}`);
            } else {
              console.warn(`[EnCron V3] reprocess: en-processor failed for ${article.id}: ${enResult.error}`);
            }
          } catch (procErr: any) {
            console.warn(`[EnCron V3] reprocess: en-processor error for ${article.id}: ${procErr.message}`);
          }
        }

        // Step 2: Re-run imager if missing image
        if (needsImage) {
          try {
            // Reset to 'analyzed' stage so imager picks it up
            await db.newsItem.update({
              where: { id: article.id },
              data: { generatedImage: null, processingStage: 'analyzed' },
            });
            const { imageArticle } = await import('@/lib/pipeline/agents/imager');
            const imgResult = await imageArticle(article.id);
            if (imgResult.success) {
              console.log(`[EnCron V3] reprocess: imager succeeded for ${article.id}: source=${imgResult.imageSource}`);
            } else {
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
                  console.log(`[EnCron V3] reprocess: Canvas image saved for ${article.id}`);
                }
              } catch (canvasErr: any) {
                console.warn(`[EnCron V3] reprocess: Canvas fallback failed for ${article.id}: ${canvasErr.message}`);
              }
            }
          } catch (imgErr: any) {
            console.warn(`[EnCron V3] reprocess: imager error for ${article.id}: ${imgErr.message}`);
          }
        }

        // Update imageUrl to point to generatedImage
        // EGRESS FIX: always use API route for imageUrl instead of pulling base64 generatedImage
        await db.newsItem.update({
          where: { id: article.id },
          data: {
            imageUrl: `/api/article-image/${article.id}`,
          },
        });

        result.processed++;
        result.published++; // Already published, just enhanced
      } catch (err: any) {
        result.failed++;
        console.error(`[EnCron V3] reprocess error for ${article.id}: ${err.message}`);
      }
    }

    result.details.push(`Reprocessed: ${result.processed}, Enhanced: ${result.published}, Failed: ${result.failed}`);
    console.log(`[EnCron V3] reprocess complete: ${result.details.join(' | ')}`);
  } catch (err: any) {
    result.failed++;
    result.details.push(`Fatal error: ${err.message}`);
    console.error(`[EnCron V3] reprocess fatal error: ${err.message}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ─── English Pipeline Trigger ───────────────────────────────

async function triggerEnPipeline(): Promise<{ message: string; orchestrator: any }> {
  try {
    // V317: Import from EN orchestrator, not Arabic
    const { ensureEnRunning } = await import('@/lib/pipeline/en-orchestrator');
    const result = ensureEnRunning();
    const { getEnOrchestratorStats } = await import('@/lib/pipeline/en-orchestrator');
    const stats = await getEnOrchestratorStats();

    return {
      message: result?.restarted ? 'English pipeline restarted (was stale or stopped)' : 'English pipeline already running',
      orchestrator: stats,
    };
  } catch (err: any) {
    return {
      message: `Pipeline trigger error: ${err.message}`,
      orchestrator: null,
    };
  }
}

// ─── V2 Legacy: Direct Publish (emergency fast-path only) ────
// Adds Canvas/Sharp image for guaranteed visual quality.
// Use ONLY for breaking news when AI processing is down.

async function directPublishEnglish(): Promise<{
  published: number;
  skipped: number;
  errors: number;
  details: string[];
}> {
  const result = { published: 0, skipped: 0, errors: 0, details: [] as string[] };

  try {
    const unpublishedArticles = await db.newsItem.findMany({
      where: {
        locale: 'en',
        isReady: false,
        isPublished: false,
        title: { not: '' },
        slug: { not: '' },
      },
      orderBy: { fetchedAt: 'desc' },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        slug: true,
        category: true,
        categoryId: true,
        newsType: true,
        sentiment: true,
        sourceName: true,
        source: true,
        fetchedAt: true,
      },
      take: 50,
    });

    console.log(`[EnCron V3] direct-publish: Found ${unpublishedArticles.length} unpublished English articles`);

    // V314: Use dynamic limits from DB
    const enDirectLimits = await getEnPipelineLimits();
    const maxDaily = enDirectLimits.maxDailyEnNews;
    const maxHourly = enDirectLimits.maxHourlyEnNews;
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setUTCMinutes(0, 0, 0);
    const todayStart = getTodayStart(EN_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    // V377: Added newsType: 'live' — quota should ONLY count live news articles
    const enVisibilityFilter = {
      locale: 'en',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    // V317: Use publishedAt instead of fetchedAt for accurate counts
    const [publishedToday, publishedThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...enVisibilityFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...enVisibilityFilter, publishedAt: { gte: hourStart } } }),
    ]);

    const remainingHourly = maxHourly > 0 ? Math.max(0, maxHourly - publishedThisHour) : 999;
    const remainingDaily = maxDaily > 0 ? Math.max(0, maxDaily - publishedToday) : 999;

    let publishCount = 0;
    const ARABIC_REGEX = /[\u0600-\u06FF]/;

    for (const article of unpublishedArticles) {
      if (publishCount >= remainingHourly || publishCount >= remainingDaily) {
        result.skipped += unpublishedArticles.length - publishCount;
        result.details.push(`Quota reached after ${publishCount} articles`);
        break;
      }

      // V358: Live quota re-check every 5 articles
      if (publishCount > 0 && publishCount % 5 === 0) {
        try {
          const [liveToday, liveHour] = await Promise.all([
            db.newsItem.count({ where: { ...enVisibilityFilter, publishedAt: { gte: todayStart } } }),
            db.newsItem.count({ where: { ...enVisibilityFilter, publishedAt: { gte: hourStart } } }),
          ]);
          const liveRemainingHour = maxHourly > 0 ? maxHourly - liveHour : 999;
          const liveRemainingDay = maxDaily > 0 ? maxDaily - liveToday : 999;
          if (liveRemainingHour <= 0 || liveRemainingDay <= 0) {
            console.log(`[EnCron V358] direct-publish: Live quota re-check: limit reached (hour=${liveHour}/${maxHourly}, day=${liveToday}/${maxDaily}). Stopping after ${publishCount} published.`);
            result.skipped += unpublishedArticles.length - publishCount;
            result.details.push(`Quota reached after ${publishCount} articles (live re-check)`);
            break;
          }
        } catch (reCheckErr: any) {
          console.warn(`[EnCron V358] direct-publish: Live quota re-check failed: ${reCheckErr.message}`);
        }
      }

      const hasEnglishTitle = !!(
        article.title &&
        article.title.length > 5 &&
        /[a-zA-Z]/.test(article.title) &&
        !ARABIC_REGEX.test(article.title)
      );

      if (!hasEnglishTitle || !article.slug || article.slug.length < 2) {
        result.skipped++;
        continue;
      }

      const hasContent = !!(
        (article.summary && article.summary.length > 5) ||
        (article.content && article.content.length > 20)
      );

      if (!hasContent) {
        result.skipped++;
        continue;
      }

      try {
        // V3: Generate Canvas/Sharp image as guaranteed fallback
        let generatedImage: string | null = null;
        try {
          const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
          const canvasBuffer = await generateArticleImage({
            title: article.title,
            category: article.categoryId || article.category || 'economy',
            locale: 'en',
            newsType: article.newsType || undefined,
            sentiment: article.sentiment || undefined,
            source: article.sourceName || article.source || undefined,
          });

          if (canvasBuffer && canvasBuffer.length > 500) {
            const { uploadImageToR2 } = await import('@/lib/image-storage');
            const base64DataUrl = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;
            const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
            generatedImage = r2Result.success ? r2Result.url : null;
          }
        } catch (canvasErr: any) {
          console.warn(`[EnCron V3] direct-publish: Canvas image failed for ${article.id}: ${canvasErr.message}`);
        }

        // V361: Check quota BEFORE direct publish (use centralized canPublish)
        try {
          const { canPublish: enCanPublish } = await import('@/lib/pipeline/publish-quota');
          const quotaCheck = await enCanPublish('en');
          if (!quotaCheck.allowed) {
            console.warn(`[EnCron V361] direct-publish BLOCKED by quota for ${article.id}: ${quotaCheck.reason}`);
            result.skipped++;
            continue;
          }
        } catch { /* fail-open */ }

        const articleForDate = await db.newsItem.findUnique({ where: { id: article.id }, select: { fetchedAt: true } });

        await db.newsItem.update({
          where: { id: article.id },
          data: {
            isReady: true,
            isPublished: true,
            processingStage: 'imaged',
            publishedAt: articleForDate?.fetchedAt || new Date(),
            generatedImage: generatedImage,
            imageUrl: generatedImage
              ? (generatedImage.startsWith('http') ? generatedImage : `/api/article-image/${article.id}`)
              : `https://image.pollinations.ai/prompt/${encodeURIComponent(article.title.slice(0, 60))}%20financial%20news?width=1200&height=675&nologo=true&seed=${article.id.slice(0, 8)}&model=flux`,
          },
        });

        // V361: Record publish in quota manager
        try {
          const { recordPublish } = await import('@/lib/pipeline/publish-quota');
          recordPublish('en');
        } catch { /* non-critical */ }

        publishCount++;
        result.published++;

        // V312: Submit Stable Horde in background for AI image replacement
        if (generatedImage) {
          try {
            const { submitToStableHordeBackground } = await import('@/lib/pipeline/agents/imager');
            submitToStableHordeBackground(article.id, article).catch(err => {
              console.warn(`[EnCron V3] direct-publish: Background Horde submit failed for ${article.id}: ${err?.message?.slice(0, 80)}`);
            });
          } catch (hordeErr: any) {
            console.warn(`[EnCron V3] direct-publish: Horde submit import failed for ${article.id}: ${hordeErr.message?.slice(0, 80)}`);

// V1070: Official source detection
const OFFICIAL_DOMAINS_V1070 = ['federalreserve.gov', 'ecb.europa.eu', 'bis.org', 'imf.org', 'worldbank.org', 'sec.gov', 'treasury.gov', 'bankofengland.co.uk', 'boj.or.jp', 'opec.org', 'eia.gov', 'iea.org', 'moodys.com', 'fitchratings.com', 'spglobal.com', 'brookings.edu', 'oecd.org', 'wto.org', 'nyse.com', 'nasdaq.com', 'cmegroup.com', 'sama.gov.sa', 'spa.gov.sa', 'wam.ae', 'qna.org.qa', 'pif.gov.sa', 'lme.com', 'fda.gov', 'bea.gov', 'bls.gov', 'census.gov', 'bruegel.org', 'chathamhouse.org', 'amf.org.ae', 'kuna.net.kw', 'map.org.ma', 'eib.org', 'ebrd.com', 'aiib.org', 'afdb.org', 'adb.org', 'iadb.org', 'isdb.org', 'euronext.com', 'hkex.com.hk', 'deutsche-boerse.com', 'saudiexchange.sa', 'adx.ae', 'dfm.ae', 'boursakuwait.com', 'theice.com', 'lseg.com', 'cato.org', 'heritage.org', 'cepr.org', 'ifri.org', 'cfr.org', 'lowyinstitute.org'];
const OFFICIAL_NAMES_V1070 = ['Federal Reserve', 'European Central Bank', 'ECB', 'Bank of England', 'Bank of Japan', 'BIS', 'IMF', 'World Bank', 'SEC', 'Treasury', 'Central Bank', 'Ministry of Finance', 'WTO', 'OECD', 'Moodys', 'Fitch', 'S&P Global', 'NYSE', 'Nasdaq', 'Euronext', 'LME', 'CME', 'IEA', 'OPEC', 'EIA', 'Brookings', 'Chatham House', 'Saudi Press Agency', 'WAM', 'QNA', 'KUNA', 'Arab Monetary Fund', 'PIF', 'Asian Development Bank', 'African Development Bank', 'European Investment Bank', 'EBRD', 'AIIB', 'IsDB', 'BLS', 'BEA', 'Census Bureau'];
function isOfficialSourceUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return OFFICIAL_DOMAINS_V1070.some(d => lower.includes(d));
}
function isOfficialSourceName(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return OFFICIAL_NAMES_V1070.some(n => lower.includes(n.toLowerCase()));
}
          }
        }
      } catch (err: any) {
        result.errors++;
        console.error(`[EnCron V3] direct-publish error for "${article.title?.slice(0, 40)}": ${err.message}`);
      }
    }

    result.details.push(`Published ${result.published}, skipped ${result.skipped}, errors ${result.errors}`);
    console.log(`[EnCron V3] direct-publish complete: ${result.details.join(' | ')}`);
  } catch (err: any) {
    result.errors++;
    result.details.push(`Fatal error: ${err.message}`);
    console.error(`[EnCron V3] direct-publish fatal error: ${err.message}`);
  }

  return result;
}

// ─── Main Handler ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    switch (action) {
      case 'status': {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        // V376: Visibility filter MUST match the frontend news page filter.
        // Previously counted ALL isReady+isPublished articles (including reports,
        // articles without slug/title, etc.) causing dashboard stats to show
        // inflated numbers that don't match what's actually visible on the site.
        const enVisFilter = {
          locale: 'en' as const,
          isReady: true,
          isPublished: true,
          newsType: 'live' as const,
          slug: { not: '' },
          title: { not: '' },
        };

        const enLimits = await getEnPipelineLimits();

        const [enReady, enPublished, enPublishedToday, enPending, enPublishedThisHour, enFetched, enWithoutImageRaw, enStuckHighRetry, enByStage] = await Promise.all([
          db.newsItem.count({ where: { locale: 'en', isReady: true } }),
          // V376: Use visibility filter for published counts — matches frontend
          db.newsItem.count({ where: enVisFilter }),
          db.newsItem.count({ where: { ...enVisFilter, publishedAt: { gte: todayStart } } }),
          db.newsItem.count({ where: { locale: 'en', isReady: false, retryCount: { lt: 15 } } }),
          db.newsItem.count({ where: { ...enVisFilter, publishedAt: { gte: oneHourAgo } } }),
          // V317: Count all unprocessed stages, not just 'fetched'
          db.newsItem.count({ where: { locale: 'en', isReady: false, processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'translated'] } } }),
          // EGRESS FIX: use count instead of findMany with generatedImage select
          db.newsItem.count({
            where: { locale: 'en', isReady: true, isPublished: true, OR: [{ generatedImage: null }, { generatedImage: '' }] },
          }),
          // V378: Count stuck articles (retryCount >= 15) — diagnostic for why pipeline might stall
          db.newsItem.count({ where: { locale: 'en', isReady: false, isPublished: false, retryCount: { gte: 15 } } }),
          // V378: Breakdown by processing stage — diagnostic for where articles are stuck
          db.newsItem.groupBy({ by: ['processingStage'], where: { locale: 'en', isReady: false, isPublished: false }, _count: { id: true } }),
        ]);
        const enWithoutImage = enWithoutImageRaw;

        // V378: Build stage breakdown for diagnostics
        const stageBreakdown: Record<string, number> = {};
        for (const row of enByStage) {
          stageBreakdown[row.processingStage || 'unknown'] = row._count.id;
        }

        // V378: Quota diagnostic info
        const remainingDaily = enLimits.maxDailyEnNews > 0 ? Math.max(0, enLimits.maxDailyEnNews - enPublishedToday) : 999;
        const remainingHourly = enLimits.maxHourlyEnNews > 0 ? Math.max(0, enLimits.maxHourlyEnNews - enPublishedThisHour) : 999;

        return NextResponse.json({
          status: 'ok',
          locale: 'en',
          pipeline: {
            totalReady: enReady,
            totalPublished: enPublished,
            publishedToday: enPublishedToday,
            publishedThisHour: enPublishedThisHour,
            pending: enPending,
            awaitingProcessing: enFetched,
            publishedWithoutImage: enWithoutImage,
            stuckHighRetry: enStuckHighRetry,
            stageBreakdown,
            limits: {
              maxDaily: enLimits.maxDailyEnNews,
              maxHourly: enLimits.maxHourlyEnNews,
              remainingDaily,
              remainingHourly,
              dailyQuotaReached: remainingDaily <= 0,
              hourlyQuotaReached: remainingHourly <= 0,
            },
          },
          timestamp: new Date().toISOString(),
        });
      }

      case 'full-cycle': {
        // V412: CRITICAL FIX — Defer processing to the in-memory orchestrator.
        // Previously, this route AND the orchestrator BOTH processed articles from
        // the same DB queue, wasting AI capacity on duplicate processing and causing
        // rate limits. Now the cron only fetches RSS and ensures the orchestrator
        // is running. The orchestrator handles ALL processing with parallel batches.
        const fetchResult = await fetchEnglishRSSFeeds();

        // Ensure the in-memory orchestrator is running (it handles processing)
        let orchestratorStatus: string = 'unknown';
        try {
          const { ensureEnRunning, getEnOrchestratorStats } = await import('@/lib/pipeline/en-orchestrator');
          const runResult = ensureEnRunning();
          const stats = await getEnOrchestratorStats();
          orchestratorStatus = runResult.restarted
            ? `restarted (${runResult.wasStale ? 'was stale' : 'was stopped'})`
            : 'already running';
          console.log(`[EnCron V412] full-cycle: Orchestrator ${orchestratorStatus}, cycles=${stats.cycleCount}, published=${stats.totalPublished}, idle=${stats.idleMinutes}min`);
        } catch (orchErr: any) {
          orchestratorStatus = `error: ${orchErr.message}`;
          console.warn(`[EnCron V412] Orchestrator check failed: ${orchErr.message}`);
        }

        return NextResponse.json({
          status: 'ok',
          locale: 'en',
          version: 'V416',
          fetch: fetchResult,
          orchestrator: orchestratorStatus,
          note: 'V412: Processing delegated to in-memory orchestrator (no duplicate AI calls)',
          timestamp: new Date().toISOString(),
        });
      }

      case 'fetch': {
        // Fetch ONLY — no processing (for debugging)
        const fetchResult = await fetchEnglishRSSFeeds();
        return NextResponse.json({
          status: 'ok',
          locale: 'en',
          fetch: fetchResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'process': {
        // Process existing fetched articles through full pipeline
        const processResult = await processEnglishArticles(limit);
        return NextResponse.json({
          status: 'ok',
          locale: 'en',
          process: processResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'reprocess': {
        // Reprocess published articles missing AI analysis/images
        const reprocessResult = await reprocessEnglishArticles(limit);
        return NextResponse.json({
          status: 'ok',
          locale: 'en',
          reprocess: reprocessResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'direct-publish': {
        // V2 legacy: Emergency fast-path with Canvas image
        const publishResult = await directPublishEnglish();
        return NextResponse.json({
          status: 'ok',
          locale: 'en',
          publish: publishResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'mark-ready': {
        const markLimits = await getEnPipelineLimits();
        const markResult = await markReadyWithQuotaCap('en', markLimits.maxDailyEnNews, markLimits.maxHourlyEnNews, EN_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0, 'title');

        // Step 3: Auto-start orchestrator if not running (like Arabic pipeline)
        try {
          const { ensureEnRunning } = await import('@/lib/pipeline/en-orchestrator');
          const orchResult = ensureEnRunning();
          if (orchResult?.restarted) {
            console.log(`[EnCron V52] mark-ready: EN orchestrator ${orchResult.wasStale ? 'was STALE — force-restarted' : 'was NOT running — started'}`);
          }
        } catch { /* non-critical */ }

        return NextResponse.json({
          status: 'ok',
          message: `Marked ${markResult.markedCount} articles as ready, fixed ${markResult.fixedPublishedCount} published flags`,
          ...markResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'force-reset': {
        const resetResult = await strongReset('en', 15);
        return NextResponse.json({
          status: 'ok',
          message: `Force-reset: stuck=${resetResult.resetStuck}, skipped=${resetResult.resetSkipped}, old=${resetResult.resetOld}`,
          ...resetResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'unlock': {
        // Reset retry counts for stuck articles
        const { resetStuckRetries } = await import('@/lib/pipeline/queue/job-manager');
        const resetCount = await resetStuckRetries();
        return NextResponse.json({
          status: 'ok',
          message: `Unlocked ${resetCount} English articles`,
          count: resetCount,
          timestamp: new Date().toISOString(),
        });
      }

      case 'fix-published': {
        // Fix articles with isReady=true but isPublished=false
        const fixLimits = await getEnPipelineLimits();
        const fixNow = new Date();
        const fixHourStart = new Date(fixNow);
        fixHourStart.setUTCMinutes(0, 0, 0);
        const fixResetHour = EN_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0;
        const fixTodayStart = getTodayStart(fixResetHour);

        // V379: Added newsType: 'live' — only live news counts toward quota
        const fixVisFilter = {
          locale: 'en',
          isReady: true,
          isPublished: true,
          newsType: 'live' as const,
          slug: { not: '' },
          title: { not: '' },
        };

        const [fixPubToday, fixPubThisHour] = await Promise.all([
          db.newsItem.count({ where: { ...fixVisFilter, publishedAt: { gte: fixTodayStart } } }),
          db.newsItem.count({ where: { ...fixVisFilter, publishedAt: { gte: fixHourStart } } }),
        ]);

        const fixRemainingHourly = fixLimits.maxHourlyEnNews > 0
          ? Math.max(0, fixLimits.maxHourlyEnNews - fixPubThisHour) : 999;
        const fixRemainingDaily = fixLimits.maxDailyEnNews > 0
          ? Math.max(0, fixLimits.maxDailyEnNews - fixPubToday) : 999;
        const fixMaxToFix = Math.min(fixRemainingHourly, fixRemainingDaily);

        if (fixMaxToFix <= 0) {
          return NextResponse.json({
            status: 'ok',
            message: `Quota reached — cannot fix-published. Hour: ${fixPubThisHour}/${fixLimits.maxHourlyEnNews}, Day: ${fixPubToday}/${fixLimits.maxDailyEnNews}`,
            count: 0,
            quotaExceeded: true,
            timestamp: new Date().toISOString(),
          });
        }

        const articlesToFix = await db.newsItem.findMany({
          where: {
            isReady: true,
            isPublished: false,
            locale: 'en',
            // V1044: golden rule — must have analysis + image
            aiAnalysis: { contains: 'fullContent' },
            generatedImage: { not: '' },
          },
          select: { id: true, fetchedAt: true },
          take: fixMaxToFix,
        });

        let fixedCount = 0;
        if (articlesToFix.length > 0) {
          for (const article of articlesToFix) {
            await db.newsItem.update({
              where: { id: article.id },
              data: { isPublished: true, publishedAt: article.fetchedAt || new Date() },
            });
          }
          fixedCount = articlesToFix.length;
          try {
            const { recordPublish } = await import('@/lib/pipeline/publish-quota');
            for (let i = 0; i < fixedCount; i++) {
              recordPublish('en');
            }
          } catch { /* non-critical */ }
        }

        return NextResponse.json({
          status: 'ok',
          message: `Fixed ${fixedCount} English articles (limited by quota: hour=${fixPubThisHour}/${fixLimits.maxHourlyEnNews}, day=${fixPubToday}/${fixLimits.maxDailyEnNews})`,
          count: fixedCount,
          quotaRemaining: { hourly: fixRemainingHourly - fixedCount, daily: fixRemainingDaily - fixedCount },
          timestamp: new Date().toISOString(),
        });
      }

      // V379: Reset HIGH-RETRY EN articles (retryCount >= 15) that are permanently excluded
      // from processing. These articles will NEVER be picked up by the pipeline again
      // unless explicitly reset. This is the most likely cause of "news not publishing".
      case 'reset-high-retry': {
        const highRetryReset = await db.newsItem.updateMany({
          where: {
            locale: 'en',
            isReady: false,
            isPublished: false,
            retryCount: { gte: 15 },
          },
          data: {
            retryCount: 0,
            processingStage: 'fetched',
            lastError: null,
          },
        });

        console.log(`[EnCron V379] reset-high-retry: Reset ${highRetryReset.count} EN articles with retryCount>=15 back to fetched`);

        return NextResponse.json({
          status: 'ok',
          action: 'reset-high-retry',
          resetCount: highRetryReset.count,
          message: `Reset ${highRetryReset.count} EN articles with retryCount>=15 back to 'fetched' stage with retryCount=0`,
        });
      }

      // V317: Reset stuck EN articles at intermediate stages back to 'fetched' for reprocessing
      case 'reset-stuck': {
        const stuckStages = ['content_loaded', 'translated'];
        const resetResult = await db.newsItem.updateMany({
          where: {
            locale: 'en',
            isReady: false,
            isPublished: false,
            processingStage: { in: stuckStages },
            retryCount: { lt: 15 },
          },
          data: {
            processingStage: 'fetched',
          },
        });

        // Also reset articles at 'analyzed' that have been sitting for >30 min
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
        const resetAnalyzed = await db.newsItem.updateMany({
          where: {
            locale: 'en',
            isReady: false,
            isPublished: false,
            processingStage: 'analyzed',
            retryCount: { lt: 15 },
            fetchedAt: { lt: thirtyMinAgo },
          },
          data: {
            processingStage: 'fetched',
          },
        });

        console.log(`[EnCron V317] reset-stuck: Reset ${resetResult.count} articles from content_loaded/translated, ${resetAnalyzed.count} from analyzed`);

        return NextResponse.json({
          status: 'ok',
          action: 'reset-stuck',
          resetFromIntermediate: resetResult.count,
          resetFromAnalyzed: resetAnalyzed.count,
          total: resetResult.count + resetAnalyzed.count,
          message: `Reset ${resetResult.count + resetAnalyzed.count} stuck articles to 'fetched' for reprocessing`,
        });
      }

      case 'test': {
        const [enTotal, enReady, enPublished, enPending, enFetched] = await Promise.all([
          db.newsItem.count({ where: { locale: 'en' } }),
          db.newsItem.count({ where: { locale: 'en', isReady: true } }),
          db.newsItem.count({ where: { locale: 'en', isReady: true, isPublished: true } }),
          db.newsItem.count({ where: { locale: 'en', isReady: false, retryCount: { lt: 15 } } }),
          // V317: Count all unprocessed stages, not just 'fetched'
          db.newsItem.count({ where: { locale: 'en', isReady: false, processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'translated'] } } }),
        ]);

        // Test Canvas/Sharp template engine
        let canvasTest: { success: boolean; sizeBytes: number; durationMs: number; error?: string } = { success: false, sizeBytes: 0, durationMs: 0, error: 'not tested' };
        try {
          const { testTemplateEngine } = await import('@/lib/image-templates/template-engine');
          canvasTest = await testTemplateEngine();
        } catch (err: any) {
          canvasTest.error = err.message;
        }

        return NextResponse.json({
          status: 'ok',
          locale: 'en',
          version: 'V3',
          stats: {
            total: enTotal,
            ready: enReady,
            published: enPublished,
            pending: enPending,
            fetched: enFetched,
          },
          canvasTest,
          config: {
            maxDaily: (await getEnPipelineLimits()).maxDailyEnNews,
            maxHourly: (await getEnPipelineLimits()).maxHourlyEnNews,
            minEnglishRatio: EN_PIPELINE_CONFIG.MIN_ENGLISH_RATIO,
            rssFeeds: EN_PIPELINE_CONFIG.RSS_FEEDS_EN.length,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // V320: Monitor action — called by Railway cron every 5 minutes.
      // Ensures the EN orchestrator is running (like the Arabic pipeline's trigger cron).
      // Without this, the EN orchestrator's in-memory state gets reset on server
      // recycling and never auto-restarts, causing "DB: Disconnected" in the monitor.
      case 'trigger':
      case 'monitor': {
        const monitorResult = await triggerEnPipeline();
        const enPipelineStatus = await (async () => {
          try {
            const [enReady, enPublished, enPending] = await Promise.all([
              db.newsItem.count({ where: { locale: 'en', isReady: true } }),
              // V376: Use visibility filter matching frontend
              db.newsItem.count({ where: { locale: 'en', isReady: true, isPublished: true, newsType: 'live', slug: { not: '' }, title: { not: '' } } }),
              db.newsItem.count({ where: { locale: 'en', isReady: false, retryCount: { lt: 15 } } }),
            ]);
            return { totalReady: enReady, totalPublished: enPublished, pending: enPending };
          } catch {
            return null;
          }
        })();
        return NextResponse.json({
          status: 'ok',
          locale: 'en',
          action: 'monitor',
          pipeline: monitorResult,
          stats: enPipelineStatus,
          timestamp: new Date().toISOString(),
        });
      }

      case 'start-orchestrator': {
        // Start the English pipeline orchestrator (continuous loop)
        try {
          const { startEnOrchestrator, getEnOrchestratorStats } = await import('@/lib/pipeline/en-orchestrator');
          startEnOrchestrator();
          const stats = await getEnOrchestratorStats();
          return NextResponse.json({
            status: 'ok',
            locale: 'en',
            message: 'English orchestrator started',
            orchestrator: stats,
            timestamp: new Date().toISOString(),
          });
        } catch (err: any) {
          return NextResponse.json({
            status: 'error',
            error: `Failed to start EN orchestrator: ${err.message}`,
          }, { status: 500 });
        }
      }

      case 'stop-orchestrator': {
        // Stop the English pipeline orchestrator
        try {
          const { stopEnOrchestrator, getEnOrchestratorStats } = await import('@/lib/pipeline/en-orchestrator');
          stopEnOrchestrator();
          const stats = await getEnOrchestratorStats();
          return NextResponse.json({
            status: 'ok',
            locale: 'en',
            message: 'English orchestrator stopped',
            orchestrator: stats,
            timestamp: new Date().toISOString(),
          });
        } catch (err: any) {
          return NextResponse.json({
            status: 'error',
            error: `Failed to stop EN orchestrator: ${err.message}`,
          }, { status: 500 });
        }
      }

      case 'orchestrator-status': {
        // Get the English pipeline orchestrator status
        try {
          const { getEnOrchestratorStats } = await import('@/lib/pipeline/en-orchestrator');
          const stats = await getEnOrchestratorStats();
          return NextResponse.json({
            status: 'ok',
            locale: 'en',
            orchestrator: stats,
            timestamp: new Date().toISOString(),
          });
        } catch (err: any) {
          return NextResponse.json({
            status: 'error',
            error: `Failed to get EN orchestrator status: ${err.message}`,
          }, { status: 500 });
        }
      }

      case 'ensure-orchestrator': {
        // Ensure the English orchestrator is running (for health checks/cron)
        try {
          const { ensureEnRunning, getEnOrchestratorStats } = await import('@/lib/pipeline/en-orchestrator');
          const result = ensureEnRunning();
          const stats = await getEnOrchestratorStats();
          return NextResponse.json({
            status: 'ok',
            locale: 'en',
            message: result.restarted
              ? `English orchestrator restarted (${result.wasStale ? 'was stale' : 'was stopped'})`
              : 'English orchestrator already running',
            wasRunning: result.wasRunning,
            wasStale: result.wasStale,
            restarted: result.restarted,
            orchestrator: stats,
            timestamp: new Date().toISOString(),
          });
        } catch (err: any) {
          return NextResponse.json({
            status: 'error',
            error: `Failed to ensure EN orchestrator running: ${err.message}`,
          }, { status: 500 });
        }
      }

      // V416: set-quota action — update EN pipeline limits in DB
      case 'set-quota': {
        const maxDaily = parseInt(searchParams.get('maxDaily') || '0', 10);
        const maxHourly = parseInt(searchParams.get('maxHourly') || '0', 10);
        if (maxDaily <= 0 && maxHourly <= 0) {
          return NextResponse.json({ status: 'error', message: 'Provide maxDaily and/or maxHourly as positive integers via query params: ?action=set-quota&maxHourly=120&maxDaily=1000' }, { status: 400 });
        }
        const results: string[] = [];
        if (maxDaily > 0) {
          await db.siteSetting.upsert({
            where: { key: 'pipeline_maxDailyEnNews' },
            update: { value: String(maxDaily), type: 'number', group: 'pipeline' },
            create: { key: 'pipeline_maxDailyEnNews', value: String(maxDaily), type: 'number', group: 'pipeline' },
          });
          results.push(`maxDaily=${maxDaily}`);
        }
        if (maxHourly > 0) {
          await db.siteSetting.upsert({
            where: { key: 'pipeline_maxHourlyEnNews' },
            update: { value: String(maxHourly), type: 'number', group: 'pipeline' },
            create: { key: 'pipeline_maxHourlyEnNews', value: String(maxHourly), type: 'number', group: 'pipeline' },
          });
          results.push(`maxHourly=${maxHourly}`);
        }
        // Clear cache so new values take effect immediately
        const { clearEnPipelineLimitsCache } = await import('@/lib/pipeline/en-pipeline-config');
        clearEnPipelineLimitsCache();
        const { invalidateQuotaCache } = await import('@/lib/pipeline/publish-quota');
        invalidateQuotaCache('en');
        return NextResponse.json({ status: 'ok', message: `EN pipeline quota updated: ${results.join(', ')}`, updated: { maxDaily, maxHourly } });
      }

      // V417: Diagnose WHY EN articles are not publishing — sample blocked articles with their actual data
      case 'diagnose': {
        // Get a sample of articles at each blocking stage
        const stages = ['fetched', 'content_loaded', 'analyzed', 'imaged', 'skipped'];
        const stageSamples: Record<string, any[]> = {};

        for (const stage of stages) {
          const articles = await db.newsItem.findMany({
            where: { locale: 'en', isReady: false, isPublished: false, processingStage: stage },
            orderBy: { fetchedAt: 'desc' },
            take: 3,
            select: {
              id: true, title: true, content: true, processingStage: true, retryCount: true,
              lastError: true, slug: true, generatedImage: true, aiAnalysis: true,
            },
          });
          stageSamples[stage] = articles.map(a => ({
            id: a.id.slice(0, 12),
            title: (a.title || '').slice(0, 80),
            contentLen: (a.content || '').length,
            contentPreview: (a.content || '').slice(0, 100),
            stage: a.processingStage,
            retryCount: a.retryCount,
            lastError: (a.lastError || '').slice(0, 120),
            hasSlug: !!(a.slug && a.slug.length > 2),
            hasImage: !!(a.generatedImage && a.generatedImage.length > 10),
            hasAnalysis: !!(a.aiAnalysis && a.aiAnalysis.length > 50),
            analysisHasFullContent: (() => {
              try {
                const parsed = typeof a.aiAnalysis === 'string' ? JSON.parse(a.aiAnalysis) : a.aiAnalysis;
                return !!(parsed?.fullContent && parsed.fullContent.length > 50);
              } catch { return false; }
            })(),
          }));
        }

        // Count by stage
        const stageCounts = await db.newsItem.groupBy({
          by: ['processingStage'],
          where: { locale: 'en', isReady: false, isPublished: false },
          _count: { id: true },
        });
        const breakdown: Record<string, number> = {};
        for (const row of stageCounts) breakdown[row.processingStage || 'unknown'] = row._count.id;

        // Total EN articles blocked
        const totalBlocked = await db.newsItem.count({
          where: { locale: 'en', isReady: false, isPublished: false },
        });

        return NextResponse.json({
          status: 'ok',
          totalBlocked,
          stageBreakdown: breakdown,
          samples: stageSamples,
          timestamp: new Date().toISOString(),
        });
      }

      // V417: Reset ALL blocked EN articles back to 'fetched' so they go through the pipeline
      // with the V417 fixes (fullContent fallback, skip-condition fix, stage-advance guard)
      case 'reset-blocked': {
        const resetResult = await db.newsItem.updateMany({
          where: {
            locale: 'en',
            isReady: false,
            isPublished: false,
            processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'imaged', 'translated', 'skipped'] },
          },
          data: {
            processingStage: 'fetched',
            retryCount: 0,
            lastError: null,
          },
        });

        // Restart the orchestrator so it picks up the reset articles
        try {
          const { ensureEnRunning } = await import('@/lib/pipeline/en-orchestrator');
          const orchResult = ensureEnRunning();
          console.log(`[EnCron V417] reset-blocked: Orchestrator ${orchResult.restarted ? 'restarted' : 'running'}, reset ${resetResult.count} articles`);
        } catch (orchErr: any) {
          console.warn(`[EnCron V417] reset-blocked: Orchestrator restart failed: ${orchErr.message}`);
        }

        return NextResponse.json({
          status: 'ok',
          action: 'reset-blocked',
          resetCount: resetResult.count,
          message: `Reset ${resetResult.count} blocked EN articles back to 'fetched' stage with retryCount=0. Orchestrator restarted.`,
          timestamp: new Date().toISOString(),
        });
      }

      default: {
        return NextResponse.json({
          status: 'error',
          message: `Unknown action: ${action}. Valid: status, full-cycle, fetch, process, reprocess, direct-publish, mark-ready, test, diagnose, reset-blocked, start-orchestrator, stop-orchestrator, orchestrator-status, ensure-orchestrator, set-quota`,
        }, { status: 400 });
      }
    }
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      error: err.message,
    }, { status: 500 });
  }
}
