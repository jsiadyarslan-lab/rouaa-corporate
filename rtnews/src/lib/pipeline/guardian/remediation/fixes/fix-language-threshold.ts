// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Fix #2: Language Threshold
// ═══════════════════════════════════════════════════════════════
// Fixes: isMostlyEnglish threshold 0.70 → use enCfg.MIN_ENGLISH_RATIO (0.50)
// This is the #1 cause of EN articles being blocked by publisher.
// The fix: Re-validate articles at imaged stage with correct threshold.
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import type { Locale, RemediationContext, RemediationResult } from '../../types/guardian-types';
import { isMostlyEnglish } from '@/lib/locale';

export async function fixLanguageThreshold(ctx: RemediationContext): Promise<RemediationResult> {
  const startTime = Date.now();
  const { locale, dryRun } = ctx;

  try {
    // Get the correct threshold from pipeline config
    let correctThreshold = 0.50;
    let minContentLength = 80;
    if (locale === 'en') {
      try {
        const { EN_PIPELINE_CONFIG } = await import('../../../en-pipeline-config');
        correctThreshold = EN_PIPELINE_CONFIG.MIN_ENGLISH_RATIO;
        minContentLength = EN_PIPELINE_CONFIG.MIN_EN_CONTENT_LENGTH;
      } catch { /* use defaults */ }
    }

    // Find articles at imaged stage with high retry that may be blocked by wrong threshold
    const candidates = await db.newsItem.findMany({
      where: {
        locale,
        isReady: false,
        isPublished: false,
        processingStage: 'imaged',
        retryCount: { gte: 2 },
        content: { not: '' },
      },
      select: {
        id: true,
        title: true,
        content: true,
        retryCount: true,
        lastError: true,
      },
      take: 100,
    });

    // Filter: articles that PASS with correct threshold but FAIL with 0.70
    const fixable = candidates.filter(article => {
      if (!article.title || !article.content) return false;

      const passesCorrect = isMostlyEnglish(article.title, correctThreshold);
      const failsStrict = !isMostlyEnglish(article.title, 0.70);

      return passesCorrect && failsStrict && article.content.length >= minContentLength;
    });

    if (fixable.length === 0) {
      return {
        success: true,
        action: 'fix_language_threshold',
        locale,
        affectedCount: 0,
        message: `No articles blocked by wrong language threshold`,
        messageAr: `لا توجد مقالات محظورة بسبب عتبة لغة خاطئة`,
        beforeState: { candidates: candidates.length, fixable: 0 },
        afterState: { candidates: candidates.length, fixable: 0 },
        rollbackAvailable: false,
        durationMs: Date.now() - startTime,
      };
    }

    if (dryRun) {
      return {
        success: true,
        action: 'fix_language_threshold',
        locale,
        affectedCount: fixable.length,
        message: `[DRY RUN] Would reset ${fixable.length} articles blocked by isMostlyEnglish(0.70) — should use ${correctThreshold}`,
        messageAr: `[تجربة] سيتم إعادة تعيين ${fixable.length} مقال محظور بسبب isMostlyEnglish(0.70) — يجب استخدام ${correctThreshold}`,
        beforeState: { candidates: candidates.length, fixable: fixable.length },
        afterState: { candidates: candidates.length, fixable: fixable.length },
        rollbackAvailable: false,
        durationMs: Date.now() - startTime,
      };
    }

    // Apply fix: Reset these articles back to 'analyzed' so publisher re-evaluates
    const ids = fixable.map(a => a.id);
    const resetResult = await db.newsItem.updateMany({
      where: {
        id: { in: ids },
        locale,
      },
      data: {
        processingStage: 'analyzed',
        retryCount: 0,
        lastError: null,
      },
    });

    return {
      success: true,
      action: 'fix_language_threshold',
      locale,
      affectedCount: resetResult.count,
      message: `Reset ${resetResult.count} articles blocked by isMostlyEnglish(0.70) — they pass with threshold ${correctThreshold}`,
      messageAr: `تم إعادة تعيين ${resetResult.count} مقال محظور بسبب isMostlyEnglish(0.70) — تجتاز مع عتبة ${correctThreshold}`,
      beforeState: { candidates: candidates.length, fixable: fixable.length },
      afterState: { reset: resetResult.count },
      rollbackAvailable: false,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      action: 'fix_language_threshold',
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
