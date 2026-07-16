// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Operation Coordinator
// ═══════════════════════════════════════════════════════════════
// Coordinates between all stages. Ensures each stage works correctly.
// Handles orchestrator restarts, concurrency management, and retries.
// ═══════════════════════════════════════════════════════════════

import type { Locale, OperationPlan, PlannedAction } from '../types/guardian-types';

const CONCURRENT_ARTICLES = 10;
const MAX_RETRIES = 20;
const VERIFICATION_INTERVAL_MS = 12_000;

// Orchestrator restart tracking
const lastRestart = new Map<string, number>();
const MIN_RESTART_INTERVAL_MS = 5 * 60 * 1000;  // 5 minutes

export async function ensureOrchestratorRunning(locale: Locale): Promise<boolean> {
  const lastTime = lastRestart.get(locale) || 0;
  const now = Date.now();

  // Prevent rapid restarts
  if (now - lastTime < MIN_RESTART_INTERVAL_MS) {
    console.log(`[OpCoordinator] Orchestrator for ${locale} restarted recently — skipping`);
    return false;
  }

  try {
    switch (locale) {
      case 'en': {
        const { ensureEnRunning } = await import('../../en-orchestrator');
        ensureEnRunning();
        break;
      }
      case 'fr': {
        const { ensureFrRunning } = await import('../../fr-orchestrator');
        ensureFrRunning();
        break;
      }
      case 'tr': {
        const { ensureTrRunning } = await import('../../tr-orchestrator');
        ensureTrRunning();
        break;
      }
      case 'es': {
        const { ensureEsRunning } = await import('../../es-orchestrator');
        ensureEsRunning();
        break;
      }
      case 'ar': {
        const { ensureRunning } = await import('../../orchestrator');
        ensureRunning();
        break;
      }
    }
    lastRestart.set(locale, now);
    console.log(`[OpCoordinator] Orchestrator for ${locale} restarted successfully`);
    return true;
  } catch (err) {
    console.error(`[OpCoordinator] Failed to restart ${locale} orchestrator:`, err);
    return false;
  }
}

export function createOperationPlan(
  locale: Locale,
  actions: PlannedAction[],
  riskLevel: 'low' | 'medium' | 'high' = 'low',
): OperationPlan {
  return {
    id: `plan_${locale}_${Date.now()}`,
    locale,
    actions,
    estimatedDurationMs: actions.length * 30_000,  // 30s per action estimate
    riskLevel,
    requiresOrchestratorPause: riskLevel === 'high',
  };
}

export async function executeOperationPlan(plan: OperationPlan): Promise<{
  success: boolean;
  completedActions: string[];
  failedActions: string[];
  durationMs: number;
}> {
  const startTime = Date.now();
  const completedActions: string[] = [];
  const failedActions: string[] = [];

  // Sort actions by dependencies
  const sorted = topologicalSort(plan.actions);

  for (const action of sorted) {
    try {
      // Check if dependencies are met
      const depsMet = action.dependsOn.every(dep => completedActions.includes(dep));
      if (!depsMet) {
        failedActions.push(action.step);
        continue;
      }

      // Execute action (currently just orchestrator restarts and resets)
      if (action.action === 'restart_orchestrator') {
        await ensureOrchestratorRunning(plan.locale);
      }

      completedActions.push(action.step);
    } catch (err) {
      console.error(`[OpCoordinator] Action ${action.step} failed:`, err);
      failedActions.push(action.step);
    }
  }

  return {
    success: failedActions.length === 0,
    completedActions,
    failedActions,
    durationMs: Date.now() - startTime,
  };
}

function topologicalSort(actions: PlannedAction[]): PlannedAction[] {
  // Simple topological sort for dependency resolution
  const sorted: PlannedAction[] = [];
  const remaining = [...actions];
  const completed = new Set<string>();

  while (remaining.length > 0) {
    const next = remaining.find(a => a.dependsOn.every(d => completed.has(d)));
    if (!next) break;  // Circular dependency or missing dep
    sorted.push(next);
    completed.add(next.step);
    remaining.splice(remaining.indexOf(next), 1);
  }

  return sorted;
}

export function getConcurrencyConfig() {
  return {
    concurrentArticles: CONCURRENT_ARTICLES,
    maxRetries: MAX_RETRIES,
    verificationIntervalMs: VERIFICATION_INTERVAL_MS,
  };
}
