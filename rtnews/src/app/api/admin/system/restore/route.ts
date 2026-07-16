// ─── Emergency System Restoration API V47 ──────────────────────
// Fixes data inconsistencies: missing slugs, stuck isReady flags, etc.
// V47: Standardized auth + sanitized error responses
// V40 GOLDEN RULE: isReady=true is ONLY set when article meets ALL Publisher criteria.
// isReady=true is IRREVERSIBLE — once set, it is NEVER set back to false.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSlug } from '@/lib/slug';
import { requireAdmin, apiError } from '@/lib/api-utils';
import { PIPELINE_CONFIG } from '@/lib/pipeline/config';

// V40: Use the SAME strict validation as the Publisher agent
function isMostlyArabic(text: string): boolean {
  if (!text || text.length < 3) return false;
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalLetters = arabicChars + latinChars;
  if (totalLetters === 0) return false;
  const ratio = arabicChars / totalLetters;
  return ratio >= PIPELINE_CONFIG.ARABIC_RATIO_THRESHOLD && arabicChars >= PIPELINE_CONFIG.MIN_ARABIC_CHARS;
}

export async function POST(request: Request) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const results = {
      slugsGenerated: 0,
      markedReady: 0,
      notReadyReasons: [] as string[],
      processingStageFixed: 0,
      errors: [] as string[],
    };

    // 1. Fix missing slugs
    const itemsWithoutSlug = await db.newsItem.findMany({
      where: { OR: [{ slug: null }, { slug: '' }] },
      select: { id: true, titleAr: true, title: true }
    });

    for (const item of itemsWithoutSlug) {
      try {
        const slug = generateSlug(item.titleAr || item.title);
        await db.newsItem.update({
          where: { id: item.id },
          data: { slug }
        });
        results.slugsGenerated++;
      } catch (e: any) {
        results.errors.push(`Slug fix failed for ${item.id}: ${e.message}`);
      }
    }

    // 2. V40: Mark articles as ready ONLY if they meet ALL Publisher criteria
    // Previously, this set isReady=true for any article with titleAr — VERY DANGEROUS.
    // Now we check: titleAr + contentAr + generatedImage + aiAnalysis + slug
    const qualifyingArticles = await db.newsItem.findMany({
      where: {
        isReady: false,
        titleAr: { not: null },
      },
      select: {
        id: true,
        titleAr: true,
        contentAr: true,
        // EGRESS FIX: removed generatedImage from select — use where clause for existence check
        aiAnalysis: true,
        slug: true,
        processingStage: true,
      }
    });

    for (const item of qualifyingArticles) {
      // V40: Apply EXACT same checks as Publisher agent
      const validationErrors: string[] = [];

      // 1. Arabic title
      if (!item.titleAr || item.titleAr.length < PIPELINE_CONFIG.MIN_TITLE_AR_LENGTH || !isMostlyArabic(item.titleAr)) {
        validationErrors.push('Missing or non-Arabic titleAr');
      }

      // 2. Arabic content
      if (!item.contentAr || item.contentAr.length < PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH || !isMostlyArabic(item.contentAr)) {
        validationErrors.push(`Missing or short contentAr (${item.contentAr?.length || 0} < ${PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH})`);
      }

      // 3. AI-generated image — EGRESS FIX: use processingStage instead of pulling generatedImage
      if (item.processingStage !== 'imaged') {
        validationErrors.push('Not at imaged stage (missing generatedImage)');
      }

      // 4. Slug
      if (!item.slug || item.slug.length < 2) {
        validationErrors.push('Missing slug');
      }

      // 5. AI Analysis with Arabic fullContent
      let hasValidAnalysis = false;
      if (item.aiAnalysis && item.aiAnalysis.length > 50) {
        try {
          const parsed = JSON.parse(item.aiAnalysis);
          if (parsed.fullContent && parsed.fullContent.length > 50 && /[\u0600-\u06FF]/.test(parsed.fullContent)) {
            hasValidAnalysis = true;
          }
        } catch {}
      }
      if (!hasValidAnalysis) {
        validationErrors.push('Missing or invalid AI analysis');
      }

      if (validationErrors.length === 0) {
        // ALL checks pass — mark as ready (same as Publisher)
        await db.newsItem.update({
          where: { id: item.id },
          data: {
            isReady: true,
            isPublished: true,  // V40: Set both atomically like Publisher
            processingStage: 'imaged'
          }
        });
        results.markedReady++;
      } else {
        results.notReadyReasons.push(`Article ${item.id}: ${validationErrors.join('; ')}`);
      }
    }

    // 3. Fix NULL processingStage
    const fixedStages = await db.$executeRaw`
      UPDATE news_items
      SET "processingStage" = 'fetched'
      WHERE "processingStage" IS NULL
    `;
    results.processingStageFixed = Number(fixedStages);

    return NextResponse.json({
      success: true,
      message: 'System restoration completed (V40: Publisher-level validation applied)',
      results,
      notReadyCount: results.notReadyReasons.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SystemRestore] Error:', error);
    return apiError(error, 'استعادة النظام');
  }
}
