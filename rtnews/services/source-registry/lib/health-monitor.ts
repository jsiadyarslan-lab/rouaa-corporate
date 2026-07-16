// ═══════════════════════════════════════════════════════════════
// Source Health Monitor (V1220 Phase 1A — Step 3)
// ═══════════════════════════════════════════════════════════════
// Tracks health of every source:
// - Success/failure rates
// - Response times
// - Auto-disable on consecutive failures
// - Health score recalculation
// ═══════════════════════════════════════════════════════════════
import { db } from '@/lib/db';
import type { HealthUpdate } from '../adapters/types';

const MAX_CONSECUTIVE_FAILURES = 5;
const HEALTH_SCORE_THRESHOLD = 30; // Below this = auto-disable

/**
 * Update source health after a fetch operation
 */
export async function updateSourceHealth(update: HealthUpdate): Promise<void> {
  try {
    const source = await db.officialSource.findUnique({
      where: { id: update.sourceId },
      select: { totalFetches: true, totalSuccesses: true, totalFailures: true, avgResponseTime: true, consecutiveFailures: true, healthScore: true, isActive: true },
    });

    if (!source) return;

    const newTotalFetches = source.totalFetches + 1;
    const newTotalSuccesses = source.totalSuccesses + (update.success ? 1 : 0);
    const newTotalFailures = source.totalFailures + (update.success ? 0 : 1);
    const newConsecutiveFailures = update.success ? 0 : source.consecutiveFailures + 1;

    // Calculate new health score (0-100)
    const successRate = newTotalFetches > 0 ? (newTotalSuccesses / newTotalFetches) * 100 : 100;
    const failurePenalty = Math.min(newConsecutiveFailures * 10, 70);
    const newHealthScore = Math.max(0, Math.round(successRate - failurePenalty));

    // Calculate new average response time
    const newAvgResponseTime = source.avgResponseTime
      ? Math.round((source.avgResponseTime + update.durationMs) / 2)
      : update.durationMs;

    // Auto-disable if too many failures
    const shouldDisable = newConsecutiveFailures >= MAX_CONSECUTIVE_FAILURES || newHealthScore < HEALTH_SCORE_THRESHOLD;

    await db.officialSource.update({
      where: { id: update.sourceId },
      data: {
        lastFetchedAt: new Date(),
        lastSuccessAt: update.success ? new Date() : source.lastSuccessAt,
        lastErrorAt: update.success ? null : new Date(),
        lastErrorMessage: update.success ? null : (update.error || 'Unknown error'),
        healthScore: newHealthScore,
        consecutiveFailures: newConsecutiveFailures,
        totalFetches: newTotalFetches,
        totalSuccesses: newTotalSuccesses,
        totalFailures: newTotalFailures,
        avgResponseTime: newAvgResponseTime,
        isActive: shouldDisable ? false : source.isActive,
        totalDocuments: update.success ? { increment: update.documentsCount } : undefined,
      },
    });

    if (shouldDisable && source.isActive) {
      console.warn(`[HealthMonitor] ⚠️ Auto-disabled source ${update.sourceId}: health=${newHealthScore}, failures=${newConsecutiveFailures}`);
    }
  } catch (error: any) {
    console.error('[HealthMonitor] Error updating health:', error?.message?.slice(0, 100));
  }
}

/**
 * Get health summary for dashboard
 */
export async function getHealthSummary(): Promise<{
  total: number;
  active: number;
  disabled: number;
  healthy: number;
  degraded: number;
  critical: number;
  avgHealthScore: number;
}> {
  const sources = await db.officialSource.findMany({
    select: { isActive: true, healthScore: true },
  });

  const total = sources.length;
  const active = sources.filter(s => s.isActive).length;
  const disabled = total - active;
  const healthy = sources.filter(s => s.isActive && s.healthScore >= 80).length;
  const degraded = sources.filter(s => s.isActive && s.healthScore >= 50 && s.healthScore < 80).length;
  const critical = sources.filter(s => s.isActive && s.healthScore < 50).length;
  const avgHealthScore = total > 0 ? Math.round(sources.reduce((sum, s) => sum + s.healthScore, 0) / total) : 0;

  return { total, active, disabled, healthy, degraded, critical, avgHealthScore };
}
