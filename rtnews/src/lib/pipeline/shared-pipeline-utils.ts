// ═══════════════════════════════════════════════════════════════
// Shared Pipeline Utilities V1
// ─────────────────────────────────────────────────────────────
// Common functions extracted from the Arabic pipeline that are
// needed by ALL language pipelines (EN, FR, ES, TR).
//
// This module ensures parity between the Arabic pipeline and
// non-Arabic pipelines for:
// - Content loading (scraping full article from source URL)
// - DAILY_LIMIT_RESET_HOUR-aware quota calculation
// - Live quota re-check during batch processing
// - publishedAt = fetchedAt (not new Date())
// - Mark-ready with 30% quota cap
// - Strong reset for stuck articles
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';

// ── RSS XML Parser (shared — was duplicated 5+ times) ──

export interface RSSItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  date: string;
}

export function parseRSSXML(
  xml: string,
  defaultCategory: string,
  sourceName: string,
): RSSItem[] {
  const items: RSSItem[] = [];

  try {
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;

    const matches = [...xml.matchAll(itemRegex), ...xml.matchAll(entryRegex)];

    for (const match of matches.slice(0, 30)) {
      const content = match[1];

      const titleMatch = content.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const title = titleMatch
        ? titleMatch[1]
            .trim()
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
        : '';

      if (!title || title.length < 10) continue;

      const descMatch =
        content.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) ||
        content.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i) ||
        content.match(/<content:encoded[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i);
      const summary = descMatch
        ? descMatch[1]
            .trim()
            .replace(/<[^>]*>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .slice(0, 500)
        : '';

      const linkMatch =
        content.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i) ||
        content.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      const url = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : '';

      if (!url) continue;

      const dateMatch =
        content.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
        content.match(/<published[^>]*>([\s\S]*?)<\/published>/i) ||
        content.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i) ||
        content.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);

      items.push({
        title,
        summary,
        url,
        source: sourceName,
        category: defaultCategory,
        date: dateMatch ? dateMatch[1].trim() : new Date().toISOString(),
      });
    }
  } catch (err: unknown) {
    console.warn(`[SharedRSS] Parse error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return items;
}

// ── DAILY_LIMIT_RESET_HOUR-aware todayStart calculation ──
// The Arabic pipeline respects DAILY_LIMIT_RESET_HOUR from config,
// but non-Arabic pipelines hardcoded setUTCHours(0,0,0,0) (midnight UTC).
// This function provides the correct calculation for all pipelines.

export function getTodayStart(resetHour: number = 0): Date {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(resetHour, 0, 0, 0);
  // If current hour is before the reset hour, the "today" window
  // started yesterday at resetHour
  if (now.getUTCHours() < resetHour) {
    todayStart.setUTCDate(todayStart.getUTCDate() - 1);
  }
  return todayStart;
}

// ── Live Quota Re-Check ──
// Checks current DB counts mid-batch to prevent concurrent publishers
// (orchestrator + cron route) from exceeding the limit.
// Returns true if quota is exceeded (should stop).

export async function liveQuotaReCheck(
  locale: string,
  todayStart: Date,
  hourStart: Date,
  maxDaily: number,
  maxHourly: number,
  publishCount: number,
): Promise<boolean> {
  try {
    // V376: Added newsType: 'live' — quota should ONLY count live news articles
    const publishedFilter = {
      locale,
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    const [liveToday, liveHour] = await Promise.all([
      db.newsItem.count({ where: { ...publishedFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...publishedFilter, publishedAt: { gte: hourStart } } }),
    ]);

    const liveRemainingHour = maxHourly > 0 ? maxHourly - liveHour : 999;
    const liveRemainingDay = maxDaily > 0 ? maxDaily - liveToday : 999;

    if (liveRemainingHour <= 0 || liveRemainingDay <= 0) {
      console.log(
        `[SharedV358] Live quota re-check: limit reached (hour=${liveHour}/${maxHourly}, day=${liveToday}/${maxDaily}). Stopping after ${publishCount} published.`,
      );
      return true; // Quota exceeded
    }
    return false; // Quota OK
  } catch (err: unknown) {
    console.warn(`[SharedV358] Live quota re-check failed: ${err instanceof Error ? err.message : String(err)}`);
    return false; // Fail-open — continue processing
  }
}

// ── Fix publishedAt = fetchedAt ──
// When articles are published in degraded mode (direct publish bypassing
// the publisher agent), publishedAt was set to new Date() which inflates
// daily counts. The Arabic pipeline uses publishedAt = fetchedAt.
// This function sets publishedAt correctly for a single article.

export async function fixPublishedAtToFetchedAt(articleId: string): Promise<void> {
  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
      select: { publishedAt: true, fetchedAt: true },
    });

    if (article && !article.publishedAt && article.fetchedAt) {
      await db.newsItem.update({
        where: { id: articleId },
        data: { publishedAt: article.fetchedAt },
      });
    }
  } catch {
    // Non-critical — best effort
  }
}

// ── Content Loader Step ──
// Loads full article content from the source URL before AI processing.
// Gracefully degrades — if loading fails, pipeline continues with RSS summary.

export async function runContentLoaderStep(articleId: string, locale: string): Promise<boolean> {
  try {
    const { loadArticleContent } = await import('@/lib/pipeline/agents/content-loader');
    const result = await loadArticleContent(articleId);
    if (result.success && result.contentLength > 0) {
      console.log(`[SharedContentLoader] Loaded ${result.contentLength} chars for ${locale} article ${articleId} via ${result.method}`);
      return true;
    }
    // Content loading failed or no content extracted — continue with RSS summary
    console.log(`[SharedContentLoader] No content loaded for ${locale} article ${articleId} — using RSS summary`);
    return false;
  } catch (err: unknown) {
    console.warn(`[SharedContentLoader] Error for ${locale} article ${articleId}: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

// ── Mark-Ready with 30% Quota Cap ──
// Safety net that catches articles the pipeline processed completely
// but somehow didn't get marked as ready.
// Takes at most 30% of remaining quota to avoid starving the orchestrator.

export const MARK_READY_QUOTA_RATIO = 0.3;

export async function markReadyWithQuotaCap(
  locale: string,
  maxDaily: number,
  maxHourly: number,
  resetHour: number = 0,
  titleField: string = 'title',
): Promise<{ markedCount: number; fixedPublishedCount: number }> {
  let markedCount = 0;
  let fixedPublishedCount = 0;

  try {
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setUTCMinutes(0, 0, 0);
    const todayStart = getTodayStart(resetHour);

    // V376: Added newsType: 'live' — quota should ONLY count live news articles
    const visibilityFilter: Record<string, unknown> = {
      locale,
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
    };
    visibilityFilter[titleField] = { not: '' };

    const [publishedToday, publishedThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...visibilityFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...visibilityFilter, publishedAt: { gte: hourStart } } }),
    ]);

    const remainingHourly = maxHourly > 0 ? Math.max(0, maxHourly - publishedThisHour) : 999;
    const remainingDaily = maxDaily > 0 ? Math.max(0, maxDaily - publishedToday) : 999;

    // Step 1: Fix isReady=true but isPublished=false
    const markMaxFix = Math.min(remainingHourly, remainingDaily);
    if (markMaxFix > 0) {
      const articlesToFix = await db.newsItem.findMany({
        where: { isReady: true, isPublished: false, locale },
        select: { id: true, fetchedAt: true },
        take: markMaxFix,
      });

      if (articlesToFix.length > 0) {
        // Set publishedAt = fetchedAt (not new Date())
        for (const article of articlesToFix) {
          await db.newsItem.update({
            where: { id: article.id },
            data: {
              isPublished: true,
              publishedAt: article.fetchedAt || new Date(),
            },
          });
        }
        fixedPublishedCount = articlesToFix.length;

        // Record publishes in quota manager
        try {
          const { recordPublish } = await import('./publish-quota');
          for (let i = 0; i < fixedPublishedCount; i++) {
            recordPublish(locale as 'ar' | 'en' | 'es' | 'fr' | 'tr');
          }
        } catch { /* non-critical */ }
      }
    }

    // Step 2: Find articles that have ALL required content but are NOT ready
    const qualifyingFilter: Record<string, unknown> = {
      isReady: false,
      isPublished: false,
      locale,
      slug: { not: { equals: '' } },
      generatedImage: { not: { equals: '' } },
      processingStage: 'imaged',
    };
    qualifyingFilter[titleField] = { not: { equals: '' } };

    const qualifyingArticles = await db.newsItem.findMany({
      where: qualifyingFilter,
      select: { id: true, fetchedAt: true },
      take: 100,
    });

    if (qualifyingArticles.length === 0) {
      return { markedCount, fixedPublishedCount };
    }

    // Apply 30% quota cap
    const markReadyDailyCap = maxDaily > 0 ? Math.max(1, Math.floor(remainingDaily * MARK_READY_QUOTA_RATIO)) : qualifyingArticles.length;
    const markReadyHourlyCap = maxHourly > 0 ? Math.max(1, Math.floor(remainingHourly * MARK_READY_QUOTA_RATIO)) : qualifyingArticles.length;
    const maxToPublish = Math.min(markReadyHourlyCap, markReadyDailyCap, qualifyingArticles.length);

    const idsToPublish = qualifyingArticles.slice(0, maxToPublish);

    if (idsToPublish.length > 0) {
      // Set publishedAt = fetchedAt for each article
      for (const article of idsToPublish) {
        await db.newsItem.update({
          where: { id: article.id },
          data: {
            isReady: true,
            isPublished: true,
            publishedAt: article.fetchedAt || new Date(),
            processingStage: 'imaged',
          },
        });
      }
      markedCount = idsToPublish.length;

      // Record publishes in quota manager
      try {
        const { recordPublish } = await import('./publish-quota');
        for (let i = 0; i < markedCount; i++) {
          recordPublish(locale as 'ar' | 'en' | 'es' | 'fr' | 'tr');
        }
      } catch { /* non-critical */ }

      console.log(`[SharedMarkReady] Marked ${markedCount} ${locale} articles as ready (quota cap: ${maxToPublish}, hour: ${publishedThisHour}/${maxHourly}, day: ${publishedToday}/${maxDaily})`);
    }
  } catch (err: unknown) {
    console.error(`[SharedMarkReady] Error for ${locale}: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { markedCount, fixedPublishedCount };
}

// ── Strong Reset for Stuck Articles ──
// Resets articles that are stuck at max retry count or in 'skipped' stage,
// giving them a fresh chance to be processed. Also resets very old articles
// that haven't been processed yet.

export async function strongReset(
  locale: string,
  maxRetryCount: number = 15,
): Promise<{ resetStuck: number; resetSkipped: number; resetOld: number }> {
  let resetStuck = 0;
  let resetSkipped = 0;
  let resetOld = 0;

  try {
    // Reset articles at max retry count
    const stuckArticles = await db.newsItem.findMany({
      where: {
        locale,
        isReady: false,
        isPublished: false,
        retryCount: { gte: maxRetryCount },
      },
      select: { id: true },
      take: 100,
    });

    if (stuckArticles.length > 0) {
      const result = await db.newsItem.updateMany({
        where: { id: { in: stuckArticles.map(a => a.id) } },
        data: { retryCount: 0, lastError: null, processingStage: 'fetched' },
      });
      resetStuck = result.count;
    }

    // Reset skipped articles
    const skippedArticles = await db.newsItem.findMany({
      where: {
        locale,
        isReady: false,
        isPublished: false,
        processingStage: 'skipped',
      },
      select: { id: true },
      take: 100,
    });

    if (skippedArticles.length > 0) {
      const result = await db.newsItem.updateMany({
        where: { id: { in: skippedArticles.map(a => a.id) } },
        data: { processingStage: 'fetched', retryCount: 0, lastError: null },
      });
      resetSkipped = result.count;
    }

    // Reset old articles (>12h in fetched/content_loaded stage)
    const ageCutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const result = await db.newsItem.updateMany({
      where: {
        locale,
        isReady: false,
        isPublished: false,
        processingStage: { in: ['fetched', 'content_loaded'] },
        fetchedAt: { lt: ageCutoff },
        retryCount: { lt: maxRetryCount },
      },
      data: {
        processingStage: 'fetched',
        retryCount: 0,
        lastError: null,
      },
    });
    resetOld = result.count;

    const total = resetStuck + resetSkipped + resetOld;
    if (total > 0) {
      console.log(`[SharedStrongReset] Reset ${total} ${locale} articles (stuck: ${resetStuck}, skipped: ${resetSkipped}, old: ${resetOld})`);
    }
  } catch (err: unknown) {
    console.error(`[SharedStrongReset] Error for ${locale}: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { resetStuck, resetSkipped, resetOld };
}

// ── Degraded Mode Tracking ──
// Tracks consecutive AI failures and enters degraded mode when
// too many failures occur in a row. In degraded mode, the pipeline
// publishes articles with Canvas images instead of waiting for AI.

interface DegradedModeState {
  consecutiveFailures: number;
  isDegraded: boolean;
  lastFailureTime: number;
  degradedSince: number;
}

const degradedModeStates: Map<string, DegradedModeState> = new Map();

const DEGRADED_MODE_THRESHOLD = 5; // Enter degraded mode after 5 consecutive failures
const DEGRADED_MODE_RECOVERY_ATTEMPTS = 3; // Try to recover after 3 successful cycles

export function recordAIFailure(locale: string): void {
  const state = degradedModeStates.get(locale) || {
    consecutiveFailures: 0,
    isDegraded: false,
    lastFailureTime: 0,
    degradedSince: 0,
  };

  state.consecutiveFailures++;
  state.lastFailureTime = Date.now();

  if (state.consecutiveFailures >= DEGRADED_MODE_THRESHOLD && !state.isDegraded) {
    state.isDegraded = true;
    state.degradedSince = Date.now();
    console.warn(`[SharedDegradedMode] ${locale} pipeline entering DEGRADED MODE after ${state.consecutiveFailures} consecutive AI failures`);
  }

  degradedModeStates.set(locale, state);
}

export function recordAISuccess(locale: string): void {
  const state = degradedModeStates.get(locale);
  if (!state) return;

  if (state.isDegraded) {
    // In degraded mode — count successes for recovery
    state.consecutiveFailures = Math.max(0, state.consecutiveFailures - 1);
    if (state.consecutiveFailures === 0) {
      state.isDegraded = false;
      state.degradedSince = 0;
      console.log(`[SharedDegradedMode] ${locale} pipeline RECOVERED from degraded mode`);
    }
  } else {
    state.consecutiveFailures = 0;
  }

  degradedModeStates.set(locale, state);
}

export function isDegradedMode(locale: string): boolean {
  return degradedModeStates.get(locale)?.isDegraded ?? false;
}

export function getDegradedModeInfo(locale: string): {
  isDegraded: boolean;
  consecutiveFailures: number;
  degradedSince: number;
} {
  const state = degradedModeStates.get(locale);
  return {
    isDegraded: state?.isDegraded ?? false,
    consecutiveFailures: state?.consecutiveFailures ?? 0,
    degradedSince: state?.degradedSince ?? 0,
  };
}
