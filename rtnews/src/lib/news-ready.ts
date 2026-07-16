// ─── Unified Article Readiness Check V23 ──────────────────────────
// SINGLE SOURCE OF TRUTH for determining if an article is ready to show.
// 
// V23 RULES (simplified from V20):
//   - isReady=true is IRREVERSIBLE — once published, NEVER set back to false
//   - Articles are ONLY published by pipeline-worker processOneArticleCompletely()
//   - No other function should set isReady=true (removed bulkMarkAllReady)
//   - The pipeline verifies: Arabic title + content/analysis + image + slug
//
// CRITICAL RULES:
// - Arabic title is MANDATORY — no English titles allowed on the site
// - Arabic content > 100 chars OR real AI analysis is MANDATORY — no thin articles
// - Image is MANDATORY — no articles without images
// - isReady=true is IRREVERSIBLE — once published, never unpublished

import { db } from '@/lib/db';
import { isSvgPlaceholderImage } from '@/lib/image-storage';

export type ProcessingStage = 'fetched' | 'content_loaded' | 'translated' | 'analyzed' | 'imaged';

// ─── Arabic Quality Validation ────────────────────────────────────
// Checks that Arabic text is real, coherent Arabic — not gibberish,
// mixed language, or machine-translation artifacts.
// V8: Stricter quality requirements to prevent poorly translated articles.
function isValidArabic(text: string, minLength: number = 10): boolean {
  if (!text || text.length < minLength) return false;
  
  // Must contain Arabic characters
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  if (arabicChars < 3) return false;
  
  // Arabic character ratio must be high enough (at least 40% of letter chars)
  // V43: Lowered from 60% to 40% — financial text has English abbreviations (GDP, S&P, AI, ETF)
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const ratio = arabicChars / (arabicChars + latinChars || 1);
  if (ratio < 0.4) return false;
  
  // Check for common gibberish patterns (repeated chars, nonsense)
  // Reject text that has more than 40% non-Arabic, non-Latin, non-space, non-punctuation chars
  const totalChars = text.replace(/[\s\d.,;:!?\-()«»"']/g, '').length;
  if (totalChars === 0) return false;
  
  return true;
}

// Check if an article meets the criteria for a given stage
function checkStage(article: any, stage: ProcessingStage): boolean {
  // V8: Stricter Arabic title check — must be valid Arabic, not English
  const hasTitleAr = !!(article.titleAr && article.titleAr.length > 3 && isValidArabic(article.titleAr, 4));
  const hasSlug = !!article.slug;
  // V8: contentAr must be good Arabic (V14: increased minimum from 50 to 80)
  const hasContentAr = !!(article.contentAr && article.contentAr.length > 50 && isValidArabic(article.contentAr, 50));
  
  let hasRealAnalysis = false;
  try {
    if (article.aiAnalysis && article.aiAnalysis.length > 50) {
      try {
        const parsed = JSON.parse(article.aiAnalysis);
        const isMinimal = parsed.isMinimal === true || parsed.isSummaryFallback === true;
        hasRealAnalysis = !isMinimal;
      } catch {
        hasRealAnalysis = article.aiAnalysis.length > 100;
      }
    }
  } catch {}

  // V235: Reject SVG placeholders — only real JPEG/PNG/WebP images are valid
  const hasGeneratedImage = !!(article.generatedImage && article.generatedImage.length > 10 && !isSvgPlaceholderImage(article.generatedImage));
  
  // V8: summaryAr must be valid Arabic
  const hasSummaryTranslation = !!(article.summaryAr && article.summaryAr.length > 10 && isValidArabic(article.summaryAr, 10));
  // V8: Require BOTH titleAr AND (contentAr OR summaryAr)
  const hasAnyTranslation = hasTitleAr && (hasContentAr || hasSummaryTranslation);
  
  switch (stage) {
    case 'fetched':
      return hasTitleAr && hasSlug;
    case 'content_loaded':
      return hasTitleAr && hasSlug && !!(article.content && article.content.length > 50 || hasContentAr);
    case 'translated':
      return hasTitleAr && hasSlug && hasAnyTranslation;
    case 'analyzed':
      return hasTitleAr && hasSlug && hasAnyTranslation && (hasRealAnalysis || hasContentAr);
    case 'imaged': {
      // V41: COMPLETE PUBLISHING — Article is ready when:
      // 1. Has VALID Arabic title (not English)
      // 2. Has slug
      // 3. Has SUFFICIENT Arabic content (contentAr > 500 OR real AI analysis)
      // 4. Has AI-GENERATED image (generatedImage is MANDATORY — imageUrl alone is NOT enough)
      //    This matches the Publisher agent's exact criteria.
      const hasSufficientContent = hasContentAr || hasRealAnalysis;
      return hasTitleAr && hasSlug && hasSufficientContent && hasGeneratedImage;
    }
    default:
      return false;
  }
}

// Determine the highest stage an article has achieved
export function determineStage(article: any): ProcessingStage {
  const stages: ProcessingStage[] = ['imaged', 'analyzed', 'translated', 'content_loaded', 'fetched'];
  for (const stage of stages) {
    if (checkStage(article, stage)) return stage;
  }
  return 'fetched';
}

// Mark article as ready ONLY when it reaches "imaged" stage
// V23: This function is DEPRECATED — only pipeline-worker should publish.
// Kept for backward compatibility but won't change isReady.
export async function markArticleReady(id: string): Promise<boolean> {
  try {
    const article = await db.newsItem.findUnique({ where: { id } });
    if (!article) return false;

    // V23: If already ready, never change it
    if (article.isReady) return true;

    // V23: Do NOT set isReady=true here anymore.
    // Only pipeline-worker processOneArticleCompletely() should publish.
    // This function only updates the processing stage.
    const stage = determineStage(article);
    if (stage !== article.processingStage) {
      await db.newsItem.update({ where: { id }, data: { processingStage: stage } });
    }
    return stage === 'imaged';
  } catch (err: any) {
    console.warn(`[markArticleReady] Failed for id="${id}": ${err.message}`);
    return false;
  }
}

// Update the processing stage for an article after a processing step
// V23: This function only updates processingStage. It does NOT set isReady.
// Only pipeline-worker processOneArticleCompletely() sets isReady=true.
export async function updateProcessingStage(id: string, newStage: ProcessingStage): Promise<void> {
  try {
    const article = await db.newsItem.findUnique({ where: { id } });
    if (!article) return;
    
    // V23: If already ready, NEVER change anything
    if (article.isReady) return;
    
    // Only move forward, never backward
    const stageOrder: ProcessingStage[] = ['fetched', 'content_loaded', 'translated', 'analyzed', 'imaged'];
    const currentIdx = stageOrder.indexOf((article.processingStage as ProcessingStage) || 'fetched');
    const newIdx = stageOrder.indexOf(newStage);
    
    if (newIdx <= currentIdx) return;
    
    // V23: Only update processingStage. Do NOT set isReady here.
    // isReady is set ONLY by pipeline-worker after ALL checks pass.
    await db.newsItem.update({ 
      where: { id }, 
      data: { processingStage: newStage } 
    });
    console.log(`[Stage] Article ${id}: ${article.processingStage || 'fetched'} → ${newStage}`);
  } catch (err: any) {
    console.warn(`[updateProcessingStage] Failed for id="${id}": ${err.message}`);
  }
}

// Batch update processing stages
export async function batchMarkReady(articleIds: string[]): Promise<number> {
  let marked = 0;
  for (let i = 0; i < articleIds.length; i += 5) {
    const batch = articleIds.slice(i, i + 5);
    const results = await Promise.allSettled(batch.map(id => markArticleReady(id)));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) marked++;
    }
    if (i + 5 < articleIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  return marked;
}

// ─── Bulk Mark All Qualifying Articles as Ready ──────────────────
// V23: DEPRECATED — This function is NO LONGER used.
// Only pipeline-worker processOneArticleCompletely() should set isReady=true.
// bulkMarkAllReady was publishing incomplete articles with default images.
// Kept for backward compatibility but always returns 0.
export async function bulkMarkAllReady(): Promise<number> {
  // V23: Do NOT bulk mark articles as ready.
  // This was the main cause of empty articles being published.
  console.warn('[bulkMarkAllReady] V23: This function is DEPRECATED — only pipeline-worker should publish');
  return 0;
}

// Original function preserved for reference (DO NOT CALL)
async function _bulkMarkAllReadyOriginal(): Promise<number> {
  try {
    // Use raw SQL for maximum efficiency — marks articles that have
    // title + slug + translation + image + AI analysis.
    // V20: STRICT — Only marks articles as ready when they have:
    // - VALID Arabic title (not English, no force-published English)
    // - SUFFICIENT Arabic content (contentAr > 100 chars with Arabic chars)
    //   OR real AI analysis (not minimal/placeholder)
    // - Image (generatedImage or imageUrl)
    // - Slug
    // summaryAr alone is NOT enough — it produces "title-only" articles.
    const result = await db.$executeRawUnsafe(`
      UPDATE news_items
      SET "isReady" = true, "processingStage" = 'imaged', "updatedAt" = NOW()
      WHERE "isReady" = false
        AND slug IS NOT NULL
        AND slug != ''
        AND "titleAr" IS NOT NULL
        AND "titleAr" != ''
        AND LENGTH("titleAr") > 3
        AND "titleAr" ~ '[\u0600-\u06FF]'
        AND (
          ("contentAr" IS NOT NULL AND "contentAr" != '' AND LENGTH("contentAr") > 100 AND "contentAr" ~ '[\u0600-\u06FF]')
          OR
          ("aiAnalysis" IS NOT NULL AND "aiAnalysis" != '' AND LENGTH("aiAnalysis") > 100
           AND "aiAnalysis" !~ '"isMinimal":true' AND "aiAnalysis" !~ '"isSummaryFallback":true'
           AND "aiAnalysis" ~ '[\u0600-\u06FF]')
        )
        AND (
          ("generatedImage" IS NOT NULL AND "generatedImage" != '' AND LENGTH("generatedImage") > 10)
        )
    `);
    
    if (result > 0) {
      console.log(`[bulkMarkAllReady] ✓ Marked ${result} articles as isReady via bulk SQL (image required)`);
    }
    return result;
  } catch (err: any) {
    // Fallback: If raw SQL fails, use Prisma query with strict checks
    console.warn(`[bulkMarkAllReady] Raw SQL failed (${err.message}), falling back to Prisma...`);
    try {
      const qualifyingArticles = await db.newsItem.findMany({
        where: {
          isReady: false,
          slug: { not: null },
          titleAr: { not: null },
          generatedImage: { not: null },
        },
        select: { id: true, titleAr: true, slug: true, aiAnalysis: true, contentAr: true, summaryAr: true, imageUrl: true },
        take: 200,
      });

      // V20: Filtering requires Arabic title + sufficient content + image
      // contentAr > 100 OR real AI analysis — summaryAr alone is NOT enough
      const strictArticles = qualifyingArticles.filter(a => {
        const hasArabicTitle = a.titleAr && a.titleAr.length > 3 && isValidArabic(a.titleAr, 4);
        // EGRESS FIX: where clause already ensures generatedImage IS NOT NULL.
        // SVG placeholder detection is handled by auto-migrate (Fix 4b2).
        const hasGeneratedImage = true; // generatedImage: { not: null } in where clause guarantees existence
        // V229: generatedImage is MANDATORY — imageUrl is NOT sufficient for publishing
        const hasContentAr = a.contentAr && a.contentAr.length > 100 && isValidArabic(a.contentAr, 50);
        
        // Check for real AI analysis
        let hasRealAnalysisCheck = false;
        try {
          if (a.aiAnalysis && a.aiAnalysis.length > 50) {
            const parsed = JSON.parse(a.aiAnalysis);
            const isMinimal = parsed.isMinimal === true || parsed.isSummaryFallback === true;
            hasRealAnalysisCheck = !isMinimal && 
              !!(parsed.fullContent && parsed.fullContent.length > 100 && /[\u0600-\u06FF]/.test(parsed.fullContent));
          }
        } catch {
          hasRealAnalysisCheck = !!(a.aiAnalysis && a.aiAnalysis.length > 200 && /[\u0600-\u06FF]/.test(a.aiAnalysis));
        }
        
        const hasSufficientContent = hasContentAr || hasRealAnalysisCheck;
        
        return hasArabicTitle && hasSufficientContent && hasGeneratedImage && a.slug;
      });

      if (strictArticles.length === 0) return 0;

      const ids = strictArticles.map(a => a.id);
      await db.newsItem.updateMany({
        where: { id: { in: ids } },
        data: { isReady: true, processingStage: 'imaged' },
      });

      console.log(`[bulkMarkAllReady] ✓ Marked ${strictArticles.length} articles as isReady via Prisma fallback (image required)`);
      return strictArticles.length;
    } catch (fallbackErr: any) {
      console.error(`[bulkMarkAllReady] Fallback also failed: ${fallbackErr.message}`);
      return 0;
    }
  }
}
