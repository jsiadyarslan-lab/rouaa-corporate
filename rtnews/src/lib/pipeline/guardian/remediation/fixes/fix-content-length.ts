// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Fix #4: Content Length
// ═══════════════════════════════════════════════════════════════
// Fixes: Content length threshold too high (200 → 80 for EN).
// Condition: Articles with 80-200 char content being rejected.
// Action: Re-evaluate with correct MIN_EN_CONTENT_LENGTH threshold.
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import type { Locale, RemediationContext, RemediationResult } from '../../types/guardian-types';

export async function fixContentLength(ctx: RemediationContext): Promise<RemediationResult> {
  const startTime = Date.now();
  const { locale, dryRun } = ctx;

  try {
    // Get correct minimum
    let minContentLength = 80;
    if (locale === 'en') {
      try {
        const { EN_PIPELINE_CONFIG } = await import('../../../en-pipeline-config');
        minContentLength = EN_PIPELINE_CONFIG.MIN_EN_CONTENT_LENGTH;
      } catch { /* use default 80 */ }
    }

    // Find articles at analyzed/imaged with content between minContentLength and 200
    // that have been rejected (high retryCount)
    const candidates = await db.newsItem.findMany({
      where: {
        locale,
        isReady: false,
        isPublished: false,
        processingStage: { in: ['analyzed', 'imaged'] },
        retryCount: { gte: 2 },
        content: { not: '' },
      },
      select: {
        id: true,
        content: true,
        retryCount: true,
        lastError: true,
      },
      take: 100,
    });

    // Filter articles that have content >= minContentLength (valid) but were still rejected
    const validArticles = candidates.filter(
      a => a.content && a.content.length >= minContentLength && a.content.length < 200
    );

    if (validArticles.length === 0) {
      return {
        success: true,
        action: 'fix_content_length',
        locale,
        affectedCount: 0,
        message: `No articles blocked by content length threshold`,
        messageAr: `لا توجد مقالات محظورة بسبب عتبة طول المحتوى`,
        beforeState: {},
        afterState: {},
        rollbackAvailable: false,
        durationMs: Date.now() - startTime,
      };
    }

    if (dryRun) {
      return {
        success: true,
        action: 'fix_content_length',
        locale,
        affectedCount: validArticles.length,
        message: `[DRY RUN] Would reset ${validArticles.length} articles with valid content (${minContentLength}+ chars)`,
        messageAr: `[تجربة] سيتم إعادة تعيين ${validArticles.length} مقال بمحتوى صالح (${minContentLength}+ حرف)`,
        beforeState: { candidates: candidates.length, valid: validArticles.length },
        afterState: { candidates: candidates.length, valid: validArticles.length },
        rollbackAvailable: false,
        durationMs: Date.now() - startTime,
      };
    }

    // Apply fix: Reset retryCount so publisher re-evaluates
    const ids = validArticles.map(a => a.id);
    const resetResult = await db.newsItem.updateMany({
      where: { id: { in: ids }, locale },
      data: {
        retryCount: 0,
        lastError: null,
      },
    });

    return {
      success: true,
      action: 'fix_content_length',
      locale,
      affectedCount: resetResult.count,
      message: `Reset ${resetResult.count} articles with valid content length (≥${minContentLength} chars) — were blocked by old threshold`,
      messageAr: `تم إعادة تعيين ${resetResult.count} مقال بطول محتوى صالح (≥${minContentLength} حرف) — كانوا محظورين بعتبة قديمة`,
      beforeState: { candidates: candidates.length, valid: validArticles.length },
      afterState: { reset: resetResult.count },
      rollbackAvailable: false,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      action: 'fix_content_length',
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
