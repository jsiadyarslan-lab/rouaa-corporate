// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Fix #1: Duplicate Window
// ═══════════════════════════════════════════════════════════════
// Fixes: Weekly publish count dropped 80%+ → restart weekly call
// Condition: publishedAt < 3 days ago, error rate > 80%
// Action: Reset blocked articles + restart orchestrator
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import type { Locale, RemediationContext, RemediationResult } from '../../types/guardian-types';

export async function fixDuplicateWindow(ctx: RemediationContext): Promise<RemediationResult> {
  const startTime = Date.now();
  const { locale, snapshot, dryRun } = ctx;

  try {
    // Count articles published in last 3 days vs blocked
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const [recentPublished, totalBlocked] = await Promise.all([
      db.newsItem.count({
        where: {
          locale,
          isReady: true,
          isPublished: true,
          publishedAt: { gte: threeDaysAgo },
        },
      }),
      db.newsItem.count({
        where: {
          locale,
          isReady: false,
          isPublished: false,
          processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'imaged', 'skipped'] },
        },
      }),
    ]);

    const errorRate = totalBlocked > 0 ? (totalBlocked / (totalBlocked + recentPublished)) : 0;

    if (errorRate < 0.8) {
      return {
        success: false,
        action: 'fix_duplicate_window',
        locale,
        affectedCount: 0,
        message: `Error rate ${Math.round(errorRate * 100)}% is below 80% threshold — no fix needed`,
        messageAr: `معدل الخطأ ${Math.round(errorRate * 100)}% أقل من عتبة 80% — لا حاجة للإصلاح`,
        beforeState: { published: recentPublished, blocked: totalBlocked },
        afterState: { published: recentPublished, blocked: totalBlocked },
        rollbackAvailable: false,
        durationMs: Date.now() - startTime,
      };
    }

    if (dryRun) {
      return {
        success: true,
        action: 'fix_duplicate_window',
        locale,
        affectedCount: totalBlocked,
        message: `[DRY RUN] Would reset ${totalBlocked} blocked articles`,
        messageAr: `[تجربة] سيتم إعادة تعيين ${totalBlocked} مقال محظور`,
        beforeState: { published: recentPublished, blocked: totalBlocked },
        afterState: { published: recentPublished, blocked: totalBlocked },
        rollbackAvailable: false,
        durationMs: Date.now() - startTime,
      };
    }

    // Apply fix: Reset all blocked articles
    const beforeState = { published: recentPublished, blocked: totalBlocked };

    const resetResult = await db.newsItem.updateMany({
      where: {
        locale,
        isReady: false,
        isPublished: false,
        processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'imaged', 'translated', 'skipped'] },
      },
      data: {
        processingStage: 'fetched',
        retryCount: 0,
        lastError: null,
      },
    });

    // Restart orchestrator
    try {
      await restartOrchestrator(locale);
    } catch (err) {
      console.warn(`[Fix#1] Orchestrator restart failed for ${locale}:`, err);
    }

    return {
      success: true,
      action: 'fix_duplicate_window',
      locale,
      affectedCount: resetResult.count,
      message: `Reset ${resetResult.count} blocked articles (error rate was ${Math.round(errorRate * 100)}%)`,
      messageAr: `تم إعادة تعيين ${resetResult.count} مقال محظور (معدل الخطأ كان ${Math.round(errorRate * 100)}%)`,
      beforeState,
      afterState: { published: recentPublished, blocked: 0 },
      rollbackAvailable: false,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      action: 'fix_duplicate_window',
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

async function restartOrchestrator(locale: Locale) {
  switch (locale) {
    case 'en': {
      const { ensureEnRunning } = await import('../../../en-orchestrator');
      ensureEnRunning();
      break;
    }
    case 'fr': {
      const { ensureFrRunning } = await import('../../../fr-orchestrator');
      ensureFrRunning();
      break;
    }
    case 'tr': {
      const { ensureTrRunning } = await import('../../../tr-orchestrator');
      ensureTrRunning();
      break;
    }
    case 'es': {
      const { ensureEsRunning } = await import('../../../es-orchestrator');
      ensureEsRunning();
      break;
    }
    case 'ar': {
      const { ensureRunning } = await import('../../../orchestrator');
      ensureRunning();
      break;
    }
  }
}
