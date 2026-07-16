// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Article Tracker
// ═══════════════════════════════════════════════════════════════
// Tracks individual article health and stuck detection.
// Identifies articles stuck at stages for too long (>5 minutes).
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import type { ArticleVitals, Locale } from '../types/guardian-types';
import { MIN_CONTENT_LENGTHS } from './sensory-engine';

const STUCK_THRESHOLD_MINUTES = 5;

export async function trackArticles(locale: Locale): Promise<ArticleVitals[]> {
  try {
    const now = Date.now();
    const stuckThreshold = new Date(now - STUCK_THRESHOLD_MINUTES * 60 * 1000);

    // Get all blocked articles (not published, not ready)
    const articles = await db.newsItem.findMany({
      where: {
        locale,
        isReady: false,
        isPublished: false,
        processingStage: { not: 'published' },
      },
      select: {
        id: true,
        title: true,
        content: true,
        aiAnalysis: true,
        generatedImage: true,
        slug: true,
        processingStage: true,
        retryCount: true,
        lastError: true,
        updatedAt: true,
        fetchedAt: true,
      },
      take: 200,  // Limit to prevent memory issues
    });

    return articles.map(article => {
      const contentLength = (article.content || '').length;
      const minLen = MIN_CONTENT_LENGTHS[locale] || 80;
      let analysisHasFullContent = false;
      try {
        const parsed = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
        analysisHasFullContent = !!(parsed?.fullContent && parsed.fullContent.length >= minLen);
      } catch { /* ignore */ }

      const stuckMinutes = Math.max(0, (now - article.updatedAt.getTime()) / 60000);

      return {
        articleId: article.id,
        locale,
        currentStage: (article.processingStage || 'fetched') as ArticleVitals['currentStage'],
        hasTitle: !!(article.title && article.title.length > 0),
        hasContent: !!(article.content && contentLength >= minLen),
        contentLength,
        hasAnalysis: !!article.aiAnalysis,
        analysisHasFullContent,
        hasImage: !!article.generatedImage,
        hasSlug: !!article.slug,
        retryCount: article.retryCount || 0,
        lastError: article.lastError,
        stuckMinutes: Math.round(stuckMinutes),
        isStuck: stuckMinutes > STUCK_THRESHOLD_MINUTES && article.processingStage !== 'fetched',
      };
    });
  } catch (err) {
    console.error(`[ArticleTracker] Error tracking ${locale}:`, err);
    return [];
  }
}

export async function getStuckArticles(locale: Locale, maxMinutes: number = 10): Promise<ArticleVitals[]> {
  const vitals = await trackArticles(locale);
  return vitals.filter(v => v.isStuck && v.stuckMinutes >= maxMinutes);
}

export async function getArticlesMissingFields(locale: Locale): Promise<{
  missingContent: ArticleVitals[];
  missingAnalysis: ArticleVitals[];
  missingImage: ArticleVitals[];
  missingSlug: ArticleVitals[];
}> {
  const vitals = await trackArticles(locale);
  return {
    missingContent: vitals.filter(v => !v.hasContent && v.currentStage !== 'fetched'),
    missingAnalysis: vitals.filter(v => !v.hasAnalysis && ['analyzed', 'imaged'].includes(v.currentStage)),
    missingImage: vitals.filter(v => !v.hasImage && v.currentStage === 'imaged'),
    missingSlug: vitals.filter(v => !v.hasSlug && ['analyzed', 'imaged'].includes(v.currentStage)),
  };
}
