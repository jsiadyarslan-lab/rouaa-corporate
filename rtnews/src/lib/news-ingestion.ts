// ─── News Ingestion Layer ──────────────────────────────────────────
// Core Engine: Deduplication, Slug Generation, and Storage
// This layer ensures news items are stored with proper SEO-friendly slugs
// and prevents duplicate entries based on originalUrl

import { db } from '@/lib/db';
import { generateSlug, generateUniqueSlug } from '@/lib/slug';

// ─── Types ──────────────────────────────────────────────────────────
export interface NewsItemInput {
  title: string;
  titleAr?: string;
  summary: string;
  summaryAr?: string;
  content?: string;
  contentAr?: string;
  url: string; // originalUrl
  source: string;
  sourceName?: string;
  category: string;
  categoryId?: string; // English category ID key (e.g. 'stocks', 'crypto', 'economy')
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  impactLevel: 'high' | 'medium' | 'low';
  originalLanguage: 'ar' | 'en';
  locale?: 'ar' | 'en'; // Locale of the published content — 'ar' for Arabic pipeline, 'en' for English pipeline
  newsType: 'live' | 'breaking' | 'article';
  imageUrl?: string;
  aiAnalysis?: string;
  affectedAssets?: string;
}

export interface IngestionResult {
  success: boolean;
  action: 'created' | 'skipped' | 'updated';
  item?: any;
  error?: string;
}

// ─── Deduplication Check ────────────────────────────────────────────
/**
 * Check if a news item already exists based on originalUrl
 * Returns the existing item if found, null otherwise
 */
export async function findExistingByUrl(originalUrl: string): Promise<any | null> {
  try {
    const existing = await db.newsItem.findFirst({
      where: { url: originalUrl },
    });
    return existing;
  } catch (error) {
    console.error('[Ingestion] Error checking existing URL:', error);
    return null;
  }
}

// ─── Locale-Aware Deduplication Check ────────────────────────────────
/**
 * Check if a news item already exists based on (originalUrl, locale) pair.
 * Same URL can exist in both Arabic and English pipelines.
 * Returns the existing item if found, null otherwise
 */
export async function findExistingByUrlAndLocale(originalUrl: string, locale: string): Promise<any | null> {
  try {
    const existing = await db.newsItem.findFirst({
      where: { url: originalUrl, locale },
    });
    return existing;
  } catch (error) {
    console.error('[Ingestion] Error checking existing URL+locale:', error);
    return null;
  }
}

// ─── Slug Generation with Uniqueness Check ──────────────────────────
/**
 * Generate a unique slug for a news item, scoped to its locale.
 * With the composite @@unique([slug, locale]) constraint, the same slug
 * is allowed in different locales. The random suffix from generateSlug()
 * already reduces collisions within the same locale.
 */
export async function generateUniqueSlugForNews(title: string, locale: string): Promise<string> {
  const baseSlug = generateSlug(title);
  
  try {
    // Check if this exact slug+locale combo already exists
    const existing = await db.newsItem.findFirst({
      where: { slug: baseSlug, locale },
      select: { slug: true },
    });
    
    if (!existing) {
      return baseSlug; // No collision — use as-is
    }
    
    // Collision within same locale — generate a new slug (will get a different random suffix)
    // Try up to 3 times with fresh random suffixes
    for (let attempt = 0; attempt < 3; attempt++) {
      const newSlug = generateSlug(title); // New random suffix each time
      const collision = await db.newsItem.findFirst({
        where: { slug: newSlug, locale },
        select: { slug: true },
      });
      if (!collision) return newSlug;
    }
    
    // Fallback: add timestamp to guarantee uniqueness
    return `${baseSlug}-${Date.now()}`;
  } catch (error) {
    console.error('[Ingestion] Error generating unique slug:', error);
    // Fallback: add timestamp
    return `${baseSlug}-${Date.now()}`;
  }
}

// ─── Main Ingestion Function ─────────────────────────────────────────
/**
 * Ingest a news item into the database
 * - Checks for duplicates by originalUrl
 * - Generates unique slug
 * - Stores or skips based on deduplication
 */
export async function ingestNewsItem(input: NewsItemInput): Promise<IngestionResult> {
  try {
    // Determine the locale for this article
    const locale = input.locale || (input.originalLanguage === 'ar' ? 'ar' : 'en');

    // Step 1: Check for existing item by (originalUrl, locale) — locale-aware dedup
    // Same URL can exist in both Arabic and English pipelines
    const existing = await findExistingByUrlAndLocale(input.url, locale);
    
    if (existing) {
      console.log(`[Ingestion] Skipping duplicate item: ${input.url} (locale=${locale})`);
      return {
        success: true,
        action: 'skipped',
        item: existing,
      };
    }
    
    // Step 2: Generate unique slug (locale-aware)
    const slug = await generateUniqueSlugForNews(input.title, locale);
    
    // Step 3: Create new item
    const newItem = await db.newsItem.create({
      data: {
        title: input.title,
        titleAr: input.titleAr,
        summary: input.summary,
        summaryAr: input.summaryAr,
        content: input.content,
        contentAr: input.contentAr,
        url: input.url,
        source: input.source,
        sourceName: input.sourceName || input.source,
        category: input.category,
        categoryId: input.categoryId || null,  // English category ID key
        sentiment: input.sentiment,
        sentimentScore: input.sentimentScore,
        impactLevel: input.impactLevel,
        impactScore: (input as any).impactScore || 0,  // V101: Importance score
        originalLanguage: input.originalLanguage,
        locale,  // Locale-aware: 'ar' or 'en'
        newsType: input.newsType,
        imageUrl: input.imageUrl,
        aiAnalysis: input.aiAnalysis,
        affectedAssets: input.affectedAssets || '[]',
        slug,
        isPublished: false,  // V38: NOT published until fully processed by pipeline
        views: 0,
      },
    });
    
    console.log(`[Ingestion] Created new item: ${slug} (${input.url})`);

    // ── REMOVED: Premature Telegram notification at ingestion time ──
    // V146 FIX: Previously, notifications were sent here at CREATION time when
    // isPublished=false, meaning the article link wouldn't work and the article
    // might fail validation and never be published.
    // Now, notifications are sent AFTER the article is published by:
    //   1. The Publisher agent (immediate notification after publish)
    //   2. The Telegram cron job (catches any missed notifications every 5 min)
    // This prevents broken links and duplicate notifications.

    return {
      success: true,
      action: 'created',
      item: newItem,
    };
  } catch (error: any) {
    // V256: P2002 on slug+locale composite unique — retry with a fresh slug
    if (error.code === 'P2002') {
      console.warn(`[Ingestion] P2002 unique constraint violation for slug — retrying with fresh slug`);
      try {
        const locale = input.locale || (input.originalLanguage === 'ar' ? 'ar' : 'en');
        const retrySlug = await generateUniqueSlugForNews(input.title, locale);
        const retryItem = await db.newsItem.create({
          data: {
            title: input.title,
            titleAr: input.titleAr,
            summary: input.summary,
            summaryAr: input.summaryAr,
            content: input.content,
            contentAr: input.contentAr,
            url: input.url,
            source: input.source,
            sourceName: input.sourceName || input.source,
            category: input.category,
            categoryId: input.categoryId || null,
            sentiment: input.sentiment,
            sentimentScore: input.sentimentScore,
            impactLevel: input.impactLevel,
            impactScore: (input as any).impactScore || 0,
            originalLanguage: input.originalLanguage,
            locale,
            newsType: input.newsType,
            imageUrl: input.imageUrl,
            aiAnalysis: input.aiAnalysis,
            affectedAssets: input.affectedAssets || '[]',
            slug: retrySlug,
            isPublished: false,
            views: 0,
          },
        });
        console.log(`[Ingestion] P2002 retry succeeded: ${retrySlug}`);
        return {
          success: true,
          action: 'created',
          item: retryItem,
        };
      } catch (retryError: any) {
        console.error('[Ingestion] P2002 retry also failed:', retryError.message);
        return {
          success: false,
          action: 'skipped',
          error: `P2002 slug collision retry failed: ${retryError.message}`,
        };
      }
    }
    console.error('[Ingestion] Error ingesting news item:', error);
    return {
      success: false,
      action: 'skipped',
      error: error.message,
    };
  }
}

// ─── Batch Ingestion ───────────────────────────────────────────────
/**
 * Ingest multiple news items in batch
 * Returns summary of created, skipped, and failed items
 */
export async function ingestNewsBatch(items: NewsItemInput[]): Promise<{
  created: number;
  skipped: number;
  failed: number;
  results: IngestionResult[];
}> {
  const results: IngestionResult[] = [];
  let created = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const item of items) {
    const result = await ingestNewsItem(item);
    results.push(result);
    
    if (result.success) {
      if (result.action === 'created') created++;
      else skipped++;
    } else {
      failed++;
    }
  }
  
  console.log(`[Ingestion] Batch complete: ${created} created, ${skipped} skipped, ${failed} failed`);
  
  return { created, skipped, failed, results };
}

// ─── Update Existing Item ─────────────────────────────────────────────
/**
 * Update an existing news item by ID
 * Useful for updating content, translations, or AI analysis
 */
export async function updateNewsItem(
  id: string,
  updates: Partial<NewsItemInput & { slug?: string }>
): Promise<IngestionResult> {
  try {
    const updated = await db.newsItem.update({
      where: { id },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.titleAr !== undefined && { titleAr: updates.titleAr }),
        ...(updates.summary !== undefined && { summary: updates.summary }),
        ...(updates.summaryAr !== undefined && { summaryAr: updates.summaryAr }),
        ...(updates.content !== undefined && { content: updates.content }),
        ...(updates.contentAr !== undefined && { contentAr: updates.contentAr }),
        ...(updates.source !== undefined && { source: updates.source }),
        ...(updates.sourceName !== undefined && { sourceName: updates.sourceName }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.sentiment !== undefined && { sentiment: updates.sentiment }),
        ...(updates.sentimentScore !== undefined && { sentimentScore: updates.sentimentScore }),
        ...(updates.impactLevel !== undefined && { impactLevel: updates.impactLevel }),
        ...(updates.imageUrl !== undefined && { imageUrl: updates.imageUrl }),
        ...(updates.aiAnalysis !== undefined && { aiAnalysis: updates.aiAnalysis }),
        ...(updates.affectedAssets !== undefined && { affectedAssets: updates.affectedAssets }),
        ...(updates.slug && { slug: updates.slug }),
      },
    });
    
    return {
      success: true,
      action: 'updated',
      item: updated,
    };
  } catch (error: any) {
    console.error('[Ingestion] Error updating news item:', error);
    return {
      success: false,
      action: 'skipped',
      error: error.message,
    };
  }
}
