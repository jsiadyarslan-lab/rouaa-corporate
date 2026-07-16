// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Learning Store
// ═══════════════════════════════════════════════════════════════
// Stores remediation outcomes for learning.
// Tracks which fixes work for which root causes.
// Helps the Guardian make better decisions over time.
// ═══════════════════════════════════════════════════════════════

import type { FailurePattern, LearningEntry, Locale } from '../types/guardian-types';

// In-memory learning store (persisted to DB in future)
const learningEntries: LearningEntry[] = [];
const failurePatterns: Map<string, FailurePattern> = new Map();
const MAX_ENTRIES = 500;

export function recordLearning(entry: Omit<LearningEntry, 'id'>): void {
  const fullEntry: LearningEntry = {
    ...entry,
    id: `learn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };

  learningEntries.push(fullEntry);
  if (learningEntries.length > MAX_ENTRIES) learningEntries.shift();

  // Update failure pattern success rate
  updateFailurePattern(entry.locale, entry.rootCause, entry.remediation, entry.success);
}

function updateFailurePattern(
  locale: Locale,
  rootCause: string,
  remediation: string,
  success: boolean,
): void {
  const key = `${locale}_${rootCause}`;
  const existing = failurePatterns.get(key);

  if (existing) {
    existing.frequency++;
    existing.lastSeen = Date.now();
    if (success) {
      existing.successfulRemediation = remediation;
      // Update success rate with exponential moving average
      existing.successRate = existing.successRate * 0.8 + 0.2;
    } else {
      existing.successRate = existing.successRate * 0.8;
    }
  } else {
    failurePatterns.set(key, {
      id: key,
      name: rootCause,
      nameAr: rootCause,
      locale,
      pattern: rootCause,
      frequency: 1,
      lastSeen: Date.now(),
      averageImpact: 0,
      successfulRemediation: success ? remediation : null,
      successRate: success ? 1 : 0,
    });
  }
}

export function getBestRemediation(locale: Locale, rootCause: string): string | null {
  const key = `${locale}_${rootCause}`;
  const pattern = failurePatterns.get(key);
  return pattern?.successfulRemediation || null;
}

export function getFailurePatterns(locale?: Locale): FailurePattern[] {
  const all = Array.from(failurePatterns.values());
  if (locale) return all.filter(p => p.locale === locale);
  return all;
}

export function getLearningEntries(locale?: Locale, limit: number = 50): LearningEntry[] {
  let entries = locale
    ? learningEntries.filter(e => e.locale === locale)
    : learningEntries;
  return entries.slice(-limit);
}

export function getRemediationSuccessRate(locale: Locale): number {
  const localeEntries = learningEntries.filter(e => e.locale === locale);
  if (localeEntries.length === 0) return 1;
  const successful = localeEntries.filter(e => e.success).length;
  return successful / localeEntries.length;
}

export function getCommonFailures(locale: Locale, limit: number = 5): FailurePattern[] {
  return getFailurePatterns(locale)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
}
