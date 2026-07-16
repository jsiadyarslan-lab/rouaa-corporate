// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════
// ─── Pipeline Archiver Agent V118 ────────────────────────────
// Archives old published articles to keep the main news_items table fast.
// ARCHIVED articles are NEVER deleted — they remain accessible via /archive/[slug].
//
// GOLDEN RULES:
//   1. No published article is EVER deleted
//   2. No archived article is EVER deleted
//   3. Articles are MOVED (not copied) to news_item_archives table
//
// Archive criteria:
//   - Published articles older than 60 days → archive (still accessible)
//   - Rejected articles (rejectCount >= 3) older than 24h → archive
//   - Stuck non-published articles older than 30 days → archive

import { db } from '@/lib/db';

export interface ArchiveResult {
  archived: number;
  errors: number;
  duration: number;
}

// Archive a single article by moving it from news_items to news_item_archives
async function archiveArticle(article: any): Promise<boolean> {
  try {
    // Create in archive table
    await db.newsItemArchive.create({
      data: {
        id: article.id,
        title: article.title,
        titleAr: article.titleAr,
        summary: article.summary,
        summaryAr: article.summaryAr,
        content: article.content,
        contentAr: article.contentAr,
        source: article.source,
        sourceName: article.sourceName,
        url: article.url,
        category: article.category,
        sentiment: article.sentiment,
        sentimentScore: article.sentimentScore,
        impactLevel: article.impactLevel,
        impactScore: article.impactScore,
        originalLanguage: article.originalLanguage,
        newsType: article.newsType,
        affectedAssets: article.affectedAssets,
        aiAnalysis: article.aiAnalysis,
        isPublished: article.isPublished,
        isReady: article.isReady,
        processingStage: article.processingStage,
        retryCount: article.retryCount,
        rejectCount: article.rejectCount || 0,
        lastError: article.lastError,
        imageUrl: article.imageUrl,
        generatedImage: article.generatedImage,
        slug: article.slug,
        views: article.views,
        publishedAt: article.publishedAt,
        fetchedAt: article.fetchedAt,
        createdAt: article.createdAt,
        archivedAt: new Date(),
      },
    });

    // Delete from main table ONLY after successful archive
    await db.newsItem.delete({
      where: { id: article.id },
    });

    return true;
  } catch (err: any) {
    console.error(`[Archiver V118] Failed to archive ${article.id}: ${err.message}`);
    return false;
  }
}

export async function runArchiver(): Promise<ArchiveResult> {
  const startTime = Date.now();
  let archived = 0;
  let errors = 0;

  try {
    // V1156: Increased take from 100 to 500 — DB was bloated with 154K articles
    // because the archiver was too slow (only 100/run × every 2.5h = 960/day).
    // Need 10x throughput to clean existing bloat.
    // 1. Archive published articles older than 60 days
    const publishedCutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const oldPublished = await db.newsItem.findMany({
      where: {
        isReady: true,
        isPublished: true,
        publishedAt: { lt: publishedCutoff },
      },
      orderBy: { publishedAt: 'asc' },
      take: 500, // V1156: was 100 — too slow for current bloat
    });

    for (const article of oldPublished) {
      const success = await archiveArticle(article);
      if (success) {
        archived++;
      } else {
        errors++;
      }
    }

    if (oldPublished.length > 0) {
      console.log(`[Archiver V118] Archived ${archived} published articles older than 60 days`);
    }

    // V1156: Increased take from 50 to 500 for rejected articles too
    // 2. Archive rejected articles (rejectCount >= 3) older than 24 hours
    const rejectedCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rejectedArticles = await db.newsItem.findMany({
      where: {
        processingStage: 'rejected',
        rejectCount: { gte: 3 },
        isReady: false,
        isPublished: false,
        fetchedAt: { lt: rejectedCutoff },
      },
      take: 500, // V1156: was 50 — too slow for current bloat
    });

    let rejectedArchived = 0;
    for (const article of rejectedArticles) {
      const success = await archiveArticle(article);
      if (success) {
        rejectedArchived++;
        archived++;
      } else {
        errors++;
      }
    }

    if (rejectedArchived > 0) {
      console.log(`[Archiver V118] Archived ${rejectedArchived} permanently rejected articles`);
    }

    // V1156: Reduced cutoff from 30 days to 3 days — articles stuck for 3+ days
    // are clearly never going to be processed (LLM cascade is broken, retry limit
    // hit, etc.). Keeping them in main table for 30 days caused 154K row bloat.
    // Also increased take from 50 to 500 to clear existing backlog faster.
    // 3. Archive stuck non-published articles older than 3 days
    const stuckCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const stuckArticles = await db.newsItem.findMany({
      where: {
        isReady: false,
        isPublished: false,
        fetchedAt: { lt: stuckCutoff },
        processingStage: { not: 'rejected' }, // Already handled above
      },
      take: 500, // V1156: was 50 — too slow for current bloat
    });

    let stuckArchived = 0;
    for (const article of stuckArticles) {
      const success = await archiveArticle(article);
      if (success) {
        stuckArchived++;
        archived++;
      } else {
        errors++;
      }
    }

    if (stuckArchived > 0) {
      console.log(`[Archiver V118] Archived ${stuckArchived} stuck articles older than 30 days`);
    }

  } catch (err: any) {
    console.error(`[Archiver V118] Fatal error: ${err.message}`);
    errors++;
  }

  const duration = Date.now() - startTime;
  if (archived > 0 || errors > 0) {
    console.log(`[Archiver V118] Done: ${archived} archived, ${errors} errors in ${duration}ms`);
  }

  return { archived, errors, duration };
}
