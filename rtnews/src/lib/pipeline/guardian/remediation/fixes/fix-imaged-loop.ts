// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Fix #3: Imaged↔Analyzed Loop
// ═══════════════════════════════════════════════════════════════
// Fixes: Articles stuck in imaged↔analyzed cycle.
// Condition: processingStage === 'imaged' && retryCount >= 5
// Action: If article has content+analysis, advance to publishable state.
//         If missing content, extract from fullContent or reset to fetched.
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import type { Locale, RemediationContext, RemediationResult } from '../../types/guardian-types';

export async function fixImagedLoop(ctx: RemediationContext): Promise<RemediationResult> {
  const startTime = Date.now();
  const { locale, dryRun } = ctx;

  try {
    // Find articles stuck in imaged↔analyzed loop
    const loopedArticles = await db.newsItem.findMany({
      where: {
        locale,
        isReady: false,
        isPublished: false,
        processingStage: 'imaged',
        retryCount: { gte: 5 },
      },
      select: {
        id: true,
        title: true,
        content: true,
        aiAnalysis: true,
        generatedImage: true,
        slug: true,
        retryCount: true,
      },
      take: 100,
    });

    if (loopedArticles.length === 0) {
      return {
        success: true,
        action: 'fix_imaged_loop',
        locale,
        affectedCount: 0,
        message: `No articles stuck in imaged↔analyzed loop`,
        messageAr: `لا توجد مقالات عالقة في حلقة صور↔تحليل`,
        beforeState: {},
        afterState: {},
        rollbackAvailable: false,
        durationMs: Date.now() - startTime,
      };
    }

    if (dryRun) {
      return {
        success: true,
        action: 'fix_imaged_loop',
        locale,
        affectedCount: loopedArticles.length,
        message: `[DRY RUN] Would fix ${loopedArticles.length} articles in imaged↔analyzed loop`,
        messageAr: `[تجربة] سيتم إصلاح ${loopedArticles.length} مقال عالق في حلقة صور↔تحليل`,
        beforeState: { looped: loopedArticles.length },
        afterState: { looped: loopedArticles.length },
        rollbackAvailable: false,
        durationMs: Date.now() - startTime,
      };
    }

    let fixedCount = 0;
    let resetCount = 0;

    for (const article of loopedArticles) {
      const hasContent = !!(article.content && article.content.length >= 80);
      const hasAnalysis = !!article.aiAnalysis;
      const hasImage = !!article.generatedImage;

      if (hasContent && hasAnalysis && hasImage && article.slug) {
        // Article has everything — reset retry count so publisher can try again
        await db.newsItem.update({
          where: { id: article.id },
          data: {
            retryCount: 0,
            lastError: null,
          },
        });
        fixedCount++;
      } else if (hasAnalysis && !hasContent) {
        // Try to extract content from AI analysis fullContent
        let extractedContent: string | null = null;
        try {
          const parsed = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
          if (parsed?.fullContent && typeof parsed.fullContent === 'string') {
            const cleaned = parsed.fullContent
              .replace(/\[\d+\]/g, '')
              .replace(/#{1,6}\s/g, '')
              .replace(/\*\*/g, '')
              .trim();
            if (cleaned.length >= 80) extractedContent = cleaned;
          }
        } catch { /* ignore */ }

        if (extractedContent) {
          await db.newsItem.update({
            where: { id: article.id },
            data: {
              content: extractedContent,
              retryCount: 0,
              lastError: null,
            },
          });
          fixedCount++;
        } else {
          // Can't extract content — reset to fetched
          await db.newsItem.update({
            where: { id: article.id },
            data: {
              processingStage: 'fetched',
              retryCount: 0,
              lastError: null,
            },
          });
          resetCount++;
        }
      } else {
        // Missing critical fields — reset to fetched
        await db.newsItem.update({
          where: { id: article.id },
          data: {
            processingStage: 'fetched',
            retryCount: 0,
            lastError: null,
          },
        });
        resetCount++;
      }
    }

    return {
      success: true,
      action: 'fix_imaged_loop',
      locale,
      affectedCount: loopedArticles.length,
      message: `Fixed ${fixedCount} articles (retry reset) + ${resetCount} reset to fetched — out of ${loopedArticles.length} looped`,
      messageAr: `تم إصلاح ${fixedCount} مقال (إعادة محاولة) + ${resetCount} أُعيد تعيينهم — من أصل ${loopedArticles.length} عالق`,
      beforeState: { looped: loopedArticles.length },
      afterState: { fixed: fixedCount, reset: resetCount },
      rollbackAvailable: false,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      action: 'fix_imaged_loop',
      locale,
      affectedCount: 0,
      message: `Fix failed: ${err.message}`,
      messageAr: `فشل الإصلاح: ${err.message}`,
      beforeState: {},
      afterState: {},
      rollbackAvailable: false,
      durationMs: Date.now() - startTime,
    };
  }
}
