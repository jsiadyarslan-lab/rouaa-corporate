// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Lifecycle Manager
// ═══════════════════════════════════════════════════════════════
// Manages the lifecycle of each article from creation to publish.
// Monitors for stuck articles (>5 minutes) and triggers recovery.
// Tracks: retry counts, stage durations, stuck detection.
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import type { ArticleLifecycle, LifecycleStage, LifecycleState, Locale, PipelineStage } from '../types/guardian-types';

const STUCK_THRESHOLD_MS = 5 * 60 * 1000;  // 5 minutes
const MAX_LIFECYCLE_RETRIES = 15;
const RECOVERY_COOLDOWN_MS = 3 * 60 * 1000;  // 3 minutes between recovery attempts

// In-memory lifecycle tracking
const lifecycleCache = new Map<string, ArticleLifecycle>();

export async function getArticleLifecycle(articleId: string, locale: Locale): Promise<ArticleLifecycle | null> {
  // Check cache first
  const cached = lifecycleCache.get(articleId);
  if (cached && Date.now() - cached.lastUpdatedAt < 60_000) {
    return cached;
  }

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        locale: true,
        processingStage: true,
        retryCount: true,
        updatedAt: true,
        fetchedAt: true,
        createdAt: true,
        lastError: true,
      },
    });

    if (!article) return null;

    const now = Date.now();
    const stuckMinutes = (now - article.updatedAt.getTime()) / 60000;
    const isStuck = stuckMinutes > 5 && article.processingStage !== 'published';

    const lifecycle: ArticleLifecycle = {
      articleId: article.id,
      locale: (article.locale || locale) as Locale,
      stages: buildLifecycleStages(article),
      currentStage: (article.processingStage || 'fetched') as PipelineStage,
      isStuck,
      stuckMinutes: Math.round(stuckMinutes),
      retryCount: article.retryCount || 0,
      lifecycleState: determineLifecycleState(article, isStuck),
      createdAt: article.createdAt.getTime(),
      lastUpdatedAt: article.updatedAt.getTime(),
    };

    // Cache it
    lifecycleCache.set(articleId, lifecycle);
    return lifecycle;
  } catch (err) {
    console.error(`[LifecycleManager] Error getting lifecycle for ${articleId}:`, err);
    return null;
  }
}

export async function getStuckArticles(locale: Locale): Promise<ArticleLifecycle[]> {
  try {
    const stuckThreshold = new Date(Date.now() - STUCK_THRESHOLD_MS);

    const articles = await db.newsItem.findMany({
      where: {
        locale,
        isReady: false,
        isPublished: false,
        processingStage: { notIn: ['published', 'skipped'] },
        updatedAt: { lt: stuckThreshold },
      },
      select: {
        id: true,
        processingStage: true,
        retryCount: true,
        updatedAt: true,
        fetchedAt: true,
        createdAt: true,
        lastError: true,
      },
      take: 50,
    });

    return articles.map(article => {
      const now = Date.now();
      const stuckMinutes = (now - article.updatedAt.getTime()) / 60000;

      return {
        articleId: article.id,
        locale,
        stages: buildLifecycleStages(article),
        currentStage: (article.processingStage || 'fetched') as PipelineStage,
        isStuck: true,
        stuckMinutes: Math.round(stuckMinutes),
        retryCount: article.retryCount || 0,
        lifecycleState: 'stuck' as LifecycleState,
        createdAt: article.createdAt.getTime(),
        lastUpdatedAt: article.updatedAt.getTime(),
      };
    });
  } catch (err) {
    console.error(`[LifecycleManager] Error getting stuck articles for ${locale}:`, err);
    return [];
  }
}

export async function recoverStuckArticle(articleId: string, locale: Locale): Promise<boolean> {
  try {
    const lifecycle = await getArticleLifecycle(articleId, locale);
    if (!lifecycle || !lifecycle.isStuck) return false;

    // Recovery strategy based on current stage
    if (lifecycle.retryCount >= MAX_LIFECYCLE_RETRIES) {
      // Permanently stuck — mark as skipped
      await db.newsItem.update({
        where: { id: articleId },
        data: {
          processingStage: 'skipped',
          lastError: `Lifecycle recovery: exceeded ${MAX_LIFECYCLE_RETRIES} retries`,
        },
      });
      return true;
    }

    // Reset to fetched with incremented retry
    await db.newsItem.update({
      where: { id: articleId },
      data: {
        processingStage: 'fetched',
        retryCount: { increment: 1 },
        lastError: null,
      },
    });

    return true;
  } catch (err) {
    console.error(`[LifecycleManager] Error recovering ${articleId}:`, err);
    return false;
  }
}

export async function recoverAllStuck(locale: Locale): Promise<{ recovered: number; skipped: number }> {
  const stuck = await getStuckArticles(locale);
  let recovered = 0;
  let skipped = 0;

  for (const article of stuck) {
    const success = await recoverStuckArticle(article.articleId, locale);
    if (success) recovered++;
    else skipped++;
  }

  return { recovered, skipped };
}

function buildLifecycleStages(article: any): LifecycleStage[] {
  const stages: LifecycleStage[] = [];
  const current = (article.processingStage || 'fetched') as PipelineStage;

  // Simplified stage tracking based on current state
  const stageOrder: PipelineStage[] = ['fetched', 'content_loaded', 'analyzed', 'imaged', 'published'];
  const currentIdx = stageOrder.indexOf(current);

  for (let i = 0; i <= currentIdx; i++) {
    stages.push({
      stage: stageOrder[i],
      enteredAt: i === 0 ? article.fetchedAt?.getTime() || article.createdAt?.getTime() : Date.now(),
      exitedAt: i < currentIdx ? Date.now() : null,
      durationMs: i < currentIdx ? 0 : 0,
      result: i < currentIdx ? 'success' : 'failed',
      errorReason: i === currentIdx && article.lastError ? article.lastError : undefined,
    });
  }

  return stages;
}

function determineLifecycleState(article: any, isStuck: boolean): LifecycleState {
  if (article.isReady && article.isPublished) return 'published';
  if (isStuck) return 'stuck';
  if (article.retryCount >= MAX_LIFECYCLE_RETRIES) return 'archived';
  if (article.processingStage === 'skipped') return 'archived';
  return 'active';
}

export function clearLifecycleCache(): void {
  lifecycleCache.clear();
}
