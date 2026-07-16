// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Escalation Ladder
// ═══════════════════════════════════════════════════════════════
// Defines the 5-level escalation ladder for remediation.
// L1 → L5: Simple retry → Full pipeline restart.
// Each level has increasing cooldown and decreasing auto-execute.
// ═══════════════════════════════════════════════════════════════

import type { EscalationStep, RemediationLevel } from '../types/guardian-types';
import { REMEDIATION_LEVELS } from '../types/guardian-types';

export const ESCALATION_LADDER: EscalationStep[] = [
  {
    level: 'L1',
    description: 'Simple retry — re-process failed articles without reset',
    autoExecute: true,
    maxDurationMs: 30_000,
    requiresVerification: false,
  },
  {
    level: 'L2',
    description: 'State reset — reset article stage back to fetched',
    autoExecute: true,
    maxDurationMs: 60_000,
    requiresVerification: true,
  },
  {
    level: 'L3',
    description: 'Threshold adjustment — re-validate with corrected thresholds',
    autoExecute: true,
    maxDurationMs: 120_000,
    requiresVerification: true,
  },
  {
    level: 'L4',
    description: 'Code fix — apply known bug fixes (imaged↔analyzed loop etc.)',
    autoExecute: true,
    maxDurationMs: 180_000,
    requiresVerification: true,
  },
  {
    level: 'L5',
    description: 'Full pipeline restart — reset everything + restart orchestrator',
    autoExecute: false,  // Requires manual approval
    maxDurationMs: 300_000,
    requiresVerification: true,
  },
];

export function getEscalationStep(level: RemediationLevel): EscalationStep {
  return ESCALATION_LADDER.find(s => s.level === level) || ESCALATION_LADDER[4];
}

export function shouldEscalate(
  currentLevel: RemediationLevel,
  consecutiveFailures: number,
): { shouldEscalate: boolean; newLevel: RemediationLevel } {
  const levelIndex = ['L1', 'L2', 'L3', 'L4', 'L5'].indexOf(currentLevel);

  // Escalate if 3+ consecutive failures at current level
  if (consecutiveFailures >= 3 && levelIndex < 4) {
    const newLevel = ['L1', 'L2', 'L3', 'L4', 'L5'][levelIndex + 1] as RemediationLevel;
    return { shouldEscalate: true, newLevel };
  }

  return { shouldEscalate: false, newLevel: currentLevel };
}

export function getLevelInfo(level: RemediationLevel) {
  return REMEDIATION_LEVELS[level];
}

// Cooldown tracking per locale+level
const lastExecution = new Map<string, number>();

export function isOnCooldown(locale: string, level: RemediationLevel): boolean {
  const key = `${locale}_${level}`;
  const lastTime = lastExecution.get(key) || 0;
  const config = REMEDIATION_LEVELS[level];
  return Date.now() - lastTime < config.cooldownMs;
}

export function recordExecution(locale: string, level: RemediationLevel): void {
  const key = `${locale}_${level}`;
  lastExecution.set(key, Date.now());
}
