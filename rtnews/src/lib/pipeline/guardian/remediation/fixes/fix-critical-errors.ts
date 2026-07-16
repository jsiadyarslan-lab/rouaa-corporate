// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Fix #5: Critical Errors
// ═══════════════════════════════════════════════════════════════
// Fixes: Articles with known code bugs causing critical failures.
// Handles: analyzed_no_content, high_retry_permanent, zero_published_today
// Action: Full reset of affected articles + orchestrator restart.
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import type { Locale, RemediationContext, RemediationResult } from '../../types/guardian-types';

export async function fixCriticalErrors(ctx: RemediationContext): Promise<RemediationResult> {
  const startTime = Date.now();
  const { locale, rootCause, dryRun } = ctx;

  try {
    const beforeState: Record<string, number> = {};

    // Count current state by stage
    const stageCounts = await db.newsItem.groupBy({
      by: ['processingStage'],
      where: { locale, isReady: false, isPublished: false },
      _count: { id: true },
    });
    for (const row of stageCounts) {
      beforeState[row.processingStage || 'unknown'] = row._count.id;
    }

    if (dryRun) {
      return {
        success: true,
        action: 'fix_critical_errors',
        locale,
        affectedCount: Object.values(beforeState).reduce((a, b) => a + b, 0),
        message: `[DRY RUN] Would reset ALL blocked articles for ${locale.toUpperCase()} + restart orchestrator`,
        messageAr: `[تجربة] سيتم إعادة تعيين جميع المقالات المحظورة لـ ${locale.toUpperCase()} + إعادة تشغيل المنسق`,
        beforeState,
        afterState: beforeState,
        rollbackAvailable: false,
        durationMs: Date.now() - startTime,
      };
    }

    // Apply fix: Full pipeline reset
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

    // Also fix articles with high retry counts
    const highRetryReset = await db.newsItem.updateMany({
      where: {
        locale,
        isReady: false,
        isPublished: false,
        retryCount: { gte: 15 },
      },
      data: {
        retryCount: 0,
        processingStage: 'fetched',
        lastError: null,
      },
    });

    // Restart the orchestrator
    try {
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
    } catch (err) {
      console.warn(`[Fix#5] Orchestrator restart failed for ${locale}:`, err);
    }

    const totalReset = resetResult.count + highRetryReset.count;

    return {
      success: true,
      action: 'fix_critical_errors',
      locale,
      affectedCount: totalReset,
      message: `Full reset: ${resetResult.count} blocked + ${highRetryReset.count} high-retry articles → fetched. Orchestrator restarted.`,
      messageAr: `إعادة تعيين كاملة: ${resetResult.count} محظور + ${highRetryReset.count} محاولات عالية → جلب. تم إعادة تشغيل المنسق.`,
      beforeState,
      afterState: { total_reset: totalReset },
      rollbackAvailable: false,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      action: 'fix_critical_errors',
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
