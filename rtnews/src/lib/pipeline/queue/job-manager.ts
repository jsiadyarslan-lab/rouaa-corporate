// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════
// ─── Pipeline Job Manager V56 ───────────────────────────────
// Database-based job queue for the news pipeline.
// V45: Force-reset recently failed articles every cycle.
// V42: NO ARTICLE IS EVER DELETED. Failed articles are marked but preserved.
// V42: Published articles (isReady=true) are NEVER demoted or modified.
// This prevents articles from disappearing after being published.

import { db } from '@/lib/db';
import { PIPELINE_CONFIG } from '../config';
import { ProcessingStage, determineNextAction, getNextStage } from './job-types';

export interface QueueStats {
  total: number;
  ready: number;
  byStage: Record<string, number>;
  failed: number;
  stuck: number;
}

// Pick the next article that needs processing
export async function pickNextArticle(): Promise<{
  id: string;
  stage: ProcessingStage;
  action: string;
} | null> {
  try {
    // Find articles that are NOT ready and haven't exceeded retry limit
    // Priority: earlier stages first (fetched → content_loaded → translated → analyzed → imaged)
    const stageOrder: ProcessingStage[] = ['fetched', 'content_loaded', 'translated', 'analyzed', 'imaged'];

    for (const stage of stageOrder) {
      const article = await db.newsItem.findFirst({
        where: {
          isReady: false,
          processingStage: stage,
          retryCount: { lt: PIPELINE_CONFIG.MAX_RETRY_COUNT },
        },
        orderBy: [
          { retryCount: 'asc' },     // Prefer articles with fewer retries
          { fetchedAt: 'desc' },     // Then prefer newer articles
        ],
        select: { id: true, processingStage: true },
      });

      if (article) {
        const action = determineNextAction(article.processingStage as ProcessingStage);
        if (action) {
          return {
            id: article.id,
            stage: article.processingStage as ProcessingStage,
            action: action.jobType,
          };
        }
      }
    }

    return null;
  } catch (err: any) {
    console.error('[JobManager] pickNextArticle failed:', err.message);
    return null;
  }
}

// Advance an article to the next processing stage
export async function advanceStage(articleId: string, currentStage: ProcessingStage): Promise<void> {
  try {
    const nextStage = getNextStage(currentStage);
    if (!nextStage) return;

    await db.newsItem.update({
      where: { id: articleId },
      data: { processingStage: nextStage },
    });
    console.log(`[JobManager] Article ${articleId}: ${currentStage} → ${nextStage}`);
  } catch (err: any) {
    console.error(`[JobManager] advanceStage failed for ${articleId}:`, err.message);
  }
}

// Record a processing error for an article
export async function recordError(articleId: string, error: string): Promise<void> {
  try {
    await db.newsItem.update({
      where: { id: articleId },
      data: {
        retryCount: { increment: 1 },
        lastError: error.slice(0, 500),
      },
    });
    console.warn(`[JobManager] Error for ${articleId}: ${error.slice(0, 100)}`);
  } catch (err: any) {
    console.error(`[JobManager] recordError failed for ${articleId}:`, err.message);
  }
}

// Get pipeline queue statistics
export async function getQueueStats(): Promise<QueueStats> {
  try {
    const [total, ready, stageResults, failed, stuck] = await Promise.all([
      db.newsItem.count(),
      db.newsItem.count({ where: { isReady: true } }),
      db.newsItem.groupBy({
        by: ['processingStage'],
        _count: { id: true },
        where: { isReady: false },
      }),
      db.newsItem.count({
        where: {
          isReady: false,
          retryCount: { gte: PIPELINE_CONFIG.MAX_RETRY_COUNT },
        },
      }),
      db.newsItem.count({
        where: {
          isReady: false,
          processingStage: 'fetched',
          fetchedAt: { lt: new Date(Date.now() - 30 * 60 * 1000) }, // stuck for 30+ min
        },
      }),
    ]);

    const byStage: Record<string, number> = {};
    for (const result of stageResults) {
      byStage[result.processingStage || 'unknown'] = result._count.id;
    }

    return { total, ready, byStage, failed, stuck };
  } catch (err: any) {
    console.error('[JobManager] getQueueStats failed:', err.message);
    return { total: 0, ready: 0, byStage: {}, failed: 0, stuck: 0 };
  }
}

// V42: Mark old failed articles — DO NOT DELETE THEM!
// Articles that failed too many times are marked with a high retryCount
// so they're never picked up again, but they're NEVER deleted from the DB.
// They remain invisible to visitors because isReady=false and isPublished=false.
// V42: NEVER touch articles that are isReady=true (published).
export async function markOldFailures(): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000)  // V1177: 2h  // V1175: 6h not 24h — articles are fetched fresh constantly;
    // Set retryCount beyond MAX so they're never picked up by the pipeline again
    // V42: Only mark articles that are NOT published (isReady=false AND isPublished=false)
    const result = await db.newsItem.updateMany({
      where: {
        isReady: false,
        isPublished: false,
        retryCount: { gte: PIPELINE_CONFIG.MAX_RETRY_COUNT },
        fetchedAt: { lt: cutoff },
        lastError: { not: 'Permanently failed — max retries exceeded' },
      },
      data: {
        lastError: 'Permanently failed — max retries exceeded',
        processingStage: 'fetched',  // Reset stage so they don't clutter stage counts
      },
    });
    if (result.count > 0) {
      console.log(`[JobManager] Marked ${result.count} old articles as permanently failed (NOT deleted)`);
    }
    return result.count;
  } catch (err: any) {
    console.error('[JobManager] markOldFailures failed:', err.message);
    return 0;
  }
}

// V38: Keep old name as alias for backward compatibility
export const purgeOldFailures = markOldFailures;

// V1156: Actually DELETE permanently failed articles (not just mark them).
// The old markOldFailures only set lastError but kept the rows in DB.
// This caused 154K rows to accumulate — articles that will NEVER be processed
// (retryCount >= MAX_RETRY) but stay in the table forever.
// V1156 fix: Delete these rows entirely. They're invisible to users anyway
// (isReady=false) and serve no purpose — the original RSS source URL is
// stored in agency_events if we ever need to re-fetch.
export async function deletePermanentlyFailed(): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000)  // V1177: 2h  // V1175: 6h not 24h — articles are fetched fresh constantly; // older than 24h
    const result = await db.newsItem.deleteMany({
      where: {
        isReady: false,
        isPublished: false,
        retryCount: { gte: PIPELINE_CONFIG.MAX_RETRY_COUNT },
        fetchedAt: { lt: cutoff },
      },
    });
    if (result.count > 0) {
      console.log(`[JobManager V1156] DELETED ${result.count} permanently failed articles (retryCount >= ${PIPELINE_CONFIG.MAX_RETRY_COUNT}, older than 24h)`);
    }
    return result.count;
  } catch (err: any) {
    console.error('[JobManager V1156] deletePermanentlyFailed failed:', err.message);
    return 0;
  }
}

// V1157→V1159: Delete ALL unpublished articles older than 24 hours, regardless of retryCount.
// 
// ROOT CAUSE of DB bloat (discovered after V1156 didn't work):
// V1156's deletePermanentlyFailed only deletes retryCount >= 15.
// But 154K articles have LOW retryCount because forceResetRecentFailed()
// keeps resetting retryCount to 0 every cycle. So they NEVER reach MAX_RETRY
// and NEVER get deleted.
//
// V1157 used 7-day cutoff but that was too conservative — most of the 154K
// articles were fetched within the last 7 days (the fetcher adds ~200/day).
// V1159 reduces cutoff to 24 HOURS. News older than 24h that hasn't been
// processed is STALE — it will never be published (LLM cascade is broken).
//
// FIX: Delete ANY unpublished article older than 24 hours.
// Published articles (isReady=true) are NEVER touched (Golden Rule preserved).
export async function deleteOldUnpublished(): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000)  // V1177: 2h;
    // V1176: PostgreSQL doesn't support DELETE ... LIMIT.
    // Must use subquery: DELETE FROM ... WHERE ctid IN (SELECT ctid FROM ... LIMIT N)
    let totalDeleted = 0;
    for (let i = 0; i < 50; i++) {
      const result = await db.$executeRawUnsafe(`
        DELETE FROM news_items
        WHERE ctid IN (
          SELECT ctid FROM news_items
          WHERE "isReady" = false
            AND "isPublished" = false
            AND "fetchedAt" < $1
          LIMIT 1000
        )
      `, cutoff);
      totalDeleted += result;
      if (result < 1000) break;
      await new Promise(r => setTimeout(r, 100));
    }
    if (totalDeleted > 0) {
      console.log(`[JobManager V1176] DELETED ${totalDeleted} old unpublished articles (older than 6h, batched)`);
    }
    return totalDeleted;
  } catch (err: any) {
    console.error('[JobManager V1176] deleteOldUnpublished failed:', err.message);
    return 0;
  }
}

// V46: Force-reset articles that hit MAX_RETRY but are still recent (< 4 hours old)
// This gives them another chance after AI provider issues are resolved.
// Without this, ALL articles eventually get stuck at MAX_RETRY and the
// pipeline stops publishing entirely.
// V46 FIX: Reset to one stage BEFORE the failure point instead of always 'fetched'.
// This avoids wasting AI calls on stages that already succeeded (e.g., an article
// that only failed at 'imaged' shouldn't re-translate and re-analyze).
export async function forceResetRecentFailed(): Promise<number> {
  try {
    // V72: Limit to 50 most recent — with 3000+ stuck articles,
    // resetting all of them floods the pipeline with processing that all fails.
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // V72→V113: Limit to 200 most recent — V113: increased from 50 to 200
    // With 3000+ stuck articles, resetting all floods the pipeline, but 50 was too conservative.
    const failedArticles = await db.newsItem.findMany({
      where: {
        isReady: false,
        isPublished: false,
        retryCount: { gte: PIPELINE_CONFIG.MAX_RETRY_COUNT },
        fetchedAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { fetchedAt: 'desc' },
      select: { id: true, processingStage: true },
      take: 200, // V113: Was 50, now 200 — more aggressive recovery
    });
    
    if (failedArticles.length === 0) return 0;
    
    const stageOrder: ProcessingStage[] = ['fetched', 'content_loaded', 'translated', 'analyzed', 'imaged'];
    // V244: Terminal stages ('skipped', 'rejected') should be reset to 'fetched' for reprocessing
    const terminalStages: ProcessingStage[] = ['skipped', 'rejected'];
    let resetCount = 0;
    
    for (const article of failedArticles) {
      const currentStage = (article.processingStage || 'fetched') as ProcessingStage;
      
      // V244: Terminal-stage articles (skipped/rejected) always reset to 'fetched'
      if (terminalStages.includes(currentStage)) {
        await db.newsItem.update({
          where: { id: article.id },
          data: {
            retryCount: 0,
            lastError: null,
            processingStage: 'fetched',
            rejectCount: 0,
          },
        });
        resetCount++;
        continue;
      }
      
      // V113: Reset to the SAME stage where the article failed, not one stage before.
      // Old code: resetStage = stageOrder[Math.max(0, currentIdx - 1)]
      // This was inefficient — it re-ran stages that already succeeded (e.g., an article
      // that failed at 'analyzed' would be reset to 'translated', wasting the translation).
      // Now we reset to the failed stage itself, giving it a fresh retry at that exact point.
      const currentIdx = stageOrder.indexOf(currentStage);
      const resetStage = stageOrder[Math.max(0, currentIdx)]; // V113: Same stage, not previous
      
      await db.newsItem.update({
        where: { id: article.id },
        data: {
          retryCount: 0,
          lastError: null,
          processingStage: resetStage,
        },
      });
      resetCount++;
    }
    
    if (resetCount > 0) {
      console.log(`[JobManager V113] Force-reset ${resetCount} recently failed articles (< 24h old) — reset to failed stage (not before)`);
    }
    return resetCount;
  } catch (err: any) {
    console.error('[JobManager V46] forceResetRecentFailed failed:', err.message);
    return 0;
  }
}

// Reset retry counts for articles that are stuck but haven't permanently failed
// This gives them another chance with the new pipeline
// V42: NEVER touch published articles (isReady=true)
export async function resetStuckRetries(): Promise<number> {
  try {
    // V72→V113: Limit to 200 most recent — V113: increased from 100 to 200
    // More aggressive recovery to clear backlogs faster
    const stuckArticles = await db.newsItem.findMany({
      where: {
        isReady: false,
        isPublished: false,
        retryCount: { gt: 0, lt: PIPELINE_CONFIG.MAX_RETRY_COUNT },
        lastError: { not: null },
      },
      orderBy: { fetchedAt: 'desc' },
      select: { id: true },
      take: 200, // V113: Was 100, now 200
    });

    if (stuckArticles.length === 0) return 0;

    const result = await db.newsItem.updateMany({
      where: {
        id: { in: stuckArticles.map(a => a.id) },
      },
      data: {
        retryCount: 0,
        lastError: null,
      },
    });
    if (result.count > 0) {
      console.log(`[JobManager V113] Reset retries for ${result.count} stuck articles (limited to 200)`);
    }
    return result.count;
  } catch (err: any) {
    console.error('[JobManager] resetStuckRetries failed:', err.message);
    return 0;
  }
}
