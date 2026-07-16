// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Remediation Engine
// ═══════════════════════════════════════════════════════════════
// Executes remediation actions based on root cause analysis.
// Uses safe escalation: L1→L2→L3→L4→L5 with cooldowns.
// Preserves isReady — guardian NEVER sets isReady=true.
// ═══════════════════════════════════════════════════════════════

import type {
  GuardianFix,
  Locale,
  RemediationContext,
  RemediationResult,
  RootCause,
  SensorySnapshot,
} from '../types/guardian-types';
import { getFixesForRootCause, getFixById } from './remediation-catalog';
import { isOnCooldown, recordExecution, shouldEscalate } from './escalation-ladder';

// Track consecutive failures per locale+pattern
const consecutiveFailures = new Map<string, number>();
// Track current escalation level per locale+pattern
const currentLevel = new Map<string, string>();
// Fix history for the engine
const fixHistory: GuardianFix[] = [];
const MAX_FIX_HISTORY = 100;

export async function executeRemediation(
  rootCause: RootCause,
  snapshot: SensorySnapshot,
  dryRun: boolean = false,
): Promise<GuardianFix | null> {
  const locale = snapshot.locale;
  const { pattern, remediationLevel } = rootCause;
  const key = `${locale}_${pattern}`;

  // Check escalation
  const current = currentLevel.get(key) || 'L1';
  const failures = consecutiveFailures.get(key) || 0;
  const { shouldEscalate: doEscalate, newLevel } = shouldEscalate(current as any, failures);

  if (doEscalate) {
    currentLevel.set(key, newLevel);
    console.log(`[RemediationEngine] Escalating ${key}: ${current} → ${newLevel} (${failures} consecutive failures)`);
  }

  // Get fixes for this root cause
  const fixes = getFixesForRootCause(rootCause);
  if (fixes.length === 0) {
    console.warn(`[RemediationEngine] No fixes found for pattern: ${pattern}`);
    return null;
  }

  // Try fixes in order
  for (const fix of fixes) {
    // Check cooldown
    if (isOnCooldown(locale, fix.level)) {
      console.log(`[RemediationEngine] Fix ${fix.id} on cooldown for ${locale}`);
      continue;
    }

    // Check if auto-execute is allowed
    if (fix.requiresApproval && !dryRun) {
      console.log(`[RemediationEngine] Fix ${fix.id} requires manual approval — skipping auto-execute`);
      continue;
    }

    // Build context
    const context: RemediationContext = {
      locale,
      rootCause,
      affectedArticles: [],  // Will be determined by fix module
      snapshot,
      dryRun,
    };

    try {
      console.log(`[RemediationEngine] Executing fix: ${fix.id} (${fix.level}) for ${locale} — ${rootCause.message}`);
      const result = await fix.execute(context);

      // Record execution
      recordExecution(locale, fix.level);

      const guardianFix: GuardianFix = {
        action: fix.id,
        locale,
        affectedCount: result.affectedCount,
        success: result.success,
        message: result.message,
        messageAr: result.messageAr,
        level: fix.level,
        timestamp: Date.now(),
        durationMs: result.durationMs,
        rollbackAvailable: result.rollbackAvailable,
      };

      // Track success/failure
      if (result.success) {
        consecutiveFailures.set(key, 0);
        currentLevel.set(key, 'L1');  // Reset escalation on success
      } else {
        consecutiveFailures.set(key, failures + 1);
      }

      // Add to history
      fixHistory.push(guardianFix);
      if (fixHistory.length > MAX_FIX_HISTORY) fixHistory.shift();

      return guardianFix;
    } catch (err) {
      console.error(`[RemediationEngine] Fix ${fix.id} threw error:`, err);
      consecutiveFailures.set(key, failures + 1);
    }
  }

  return null;
}

export async function executeManualFix(
  fixId: string,
  locale: Locale,
  rootCause: RootCause,
  snapshot: SensorySnapshot,
): Promise<GuardianFix | null> {
  const fix = getFixById(fixId);
  if (!fix) return null;

  const context: RemediationContext = {
    locale,
    rootCause,
    affectedArticles: [],
    snapshot,
    dryRun: false,
  };

  try {
    const result = await fix.execute(context);
    recordExecution(locale, fix.level);

    const guardianFix: GuardianFix = {
      action: fix.id,
      locale,
      affectedCount: result.affectedCount,
      success: result.success,
      message: result.message,
      messageAr: result.messageAr,
      level: fix.level,
      timestamp: Date.now(),
      durationMs: result.durationMs,
      rollbackAvailable: result.rollbackAvailable,
    };

    fixHistory.push(guardianFix);
    if (fixHistory.length > MAX_FIX_HISTORY) fixHistory.shift();

    return guardianFix;
  } catch (err) {
    console.error(`[RemediationEngine] Manual fix ${fixId} failed:`, err);
    return null;
  }
}

export function getFixHistory(): GuardianFix[] {
  return [...fixHistory];
}

export function getRecentFixes(count: number = 10): GuardianFix[] {
  return fixHistory.slice(-count);
}

export function getFixSuccessRate(): number {
  if (fixHistory.length === 0) return 1;
  const successful = fixHistory.filter(f => f.success).length;
  return successful / fixHistory.length;
}

export function resetEscalation(locale: string, pattern: string): void {
  const key = `${locale}_${pattern}`;
  consecutiveFailures.set(key, 0);
  currentLevel.set(key, 'L1');
}
