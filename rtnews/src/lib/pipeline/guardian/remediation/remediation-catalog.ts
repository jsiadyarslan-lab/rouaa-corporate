// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Remediation Catalog
// ═══════════════════════════════════════════════════════════════
// Maps root causes to specific remediation actions.
// Each root cause pattern maps to one or more fix modules.
// ═══════════════════════════════════════════════════════════════

import type { Locale, RemediationAction, RemediationContext, RemediationLevel, RemediationResult, RootCause } from '../types/guardian-types';
import { fixDuplicateWindow } from './fixes/fix-duplicate-window';
import { fixLanguageThreshold } from './fixes/fix-language-threshold';
import { fixImagedLoop } from './fixes/fix-imaged-loop';
import { fixContentLength } from './fixes/fix-content-length';
import { fixCriticalErrors } from './fixes/fix-critical-errors';

// Catalog of all available remediation actions
const CATALOG: RemediationAction[] = [
  {
    id: 'fix_duplicate_window',
    name: 'Reset Blocked Articles',
    nameAr: 'إعادة تعيين المقالات المحظورة',
    level: 'L2',
    description: 'Reset all blocked articles back to fetched stage',
    descriptionAr: 'إعادة تعيين جميع المقالات المحظورة إلى مرحلة الجلب',
    requiresApproval: false,
    cooldownMs: 5 * 60 * 1000,
    maxRetries: 3,
    currentRetries: 0,
    execute: fixDuplicateWindow,
  },
  {
    id: 'fix_language_threshold',
    name: 'Fix Language Threshold',
    nameAr: 'إصلاح عتبة اللغة',
    level: 'L3',
    description: 'Re-validate articles blocked by wrong isMostlyEnglish threshold',
    descriptionAr: 'إعادة التحقق من المقالات المحظورة بسبب عتبة isMostlyEnglish خاطئة',
    requiresApproval: false,
    cooldownMs: 15 * 60 * 1000,
    maxRetries: 3,
    currentRetries: 0,
    execute: fixLanguageThreshold,
  },
  {
    id: 'fix_imaged_loop',
    name: 'Fix Imaged↔Analyzed Loop',
    nameAr: 'إصلاح حلقة الصور↔التحليل',
    level: 'L4',
    description: 'Fix articles stuck in imaged↔analyzed infinite cycle',
    descriptionAr: 'إصلاح المقالات العالقة في حلقة صور↔تحليل مفرغة',
    requiresApproval: false,
    cooldownMs: 30 * 60 * 1000,
    maxRetries: 3,
    currentRetries: 0,
    execute: fixImagedLoop,
  },
  {
    id: 'fix_content_length',
    name: 'Fix Content Length Threshold',
    nameAr: 'إصلاح عتبة طول المحتوى',
    level: 'L3',
    description: 'Re-validate articles with content ≥80 chars blocked by old 200-char threshold',
    descriptionAr: 'إعادة التحقق من المقالات بمحتوى ≥80 حرف المحظورة بعتبة 200 حرف قديمة',
    requiresApproval: false,
    cooldownMs: 15 * 60 * 1000,
    maxRetries: 3,
    currentRetries: 0,
    execute: fixContentLength,
  },
  {
    id: 'fix_critical_errors',
    name: 'Full Pipeline Reset',
    nameAr: 'إعادة تعيين خط الأنابيب بالكامل',
    level: 'L5',
    description: 'Reset all blocked articles + restart orchestrator — last resort',
    descriptionAr: 'إعادة تعيين جميع المقالات المحظورة + إعادة تشغيل المنسق — الملاذ الأخير',
    requiresApproval: true,
    cooldownMs: 60 * 60 * 1000,
    maxRetries: 1,
    currentRetries: 0,
    execute: fixCriticalErrors,
  },
];

// Map root cause patterns to remediation actions
const PATTERN_TO_FIX: Record<string, string[]> = {
  // Pattern ID → list of fix IDs (in order of preference)
  imaged_no_publish: ['fix_duplicate_window', 'fix_critical_errors'],
  analyzed_no_content: ['fix_duplicate_window', 'fix_imaged_loop'],
  analyzed_no_image: ['fix_duplicate_window'],
  content_short: ['fix_content_length'],
  language_threshold_mismatch: ['fix_language_threshold'],
  imaged_analyzed_loop: ['fix_imaged_loop', 'fix_critical_errors'],
  analysis_no_full_content: ['fix_imaged_loop'],
  high_retry_permanent: ['fix_duplicate_window', 'fix_critical_errors'],
  zero_publish_rate: ['fix_critical_errors'],
  declining_publish_rate: ['fix_duplicate_window'],
  blocked_spike: ['fix_duplicate_window'],
  bottleneck_analyzed: ['fix_imaged_loop', 'fix_duplicate_window'],
  bottleneck_imaged: ['fix_language_threshold', 'fix_imaged_loop'],
  en_threshold_strict: ['fix_language_threshold'],
  en_length_threshold: ['fix_content_length'],
  en_imaged_loop: ['fix_imaged_loop', 'fix_critical_errors'],
};

export function getFixesForRootCause(rootCause: RootCause): RemediationAction[] {
  const fixIds = PATTERN_TO_FIX[rootCause.pattern] || ['fix_critical_errors'];
  return fixIds
    .map(id => CATALOG.find(c => c.id === id))
    .filter((a): a is RemediationAction => !!a);
}

export function getFixById(id: string): RemediationAction | undefined {
  return CATALOG.find(c => c.id === id);
}

export function getAllFixes(): RemediationAction[] {
  return [...CATALOG];
}

export function getFixesByLevel(level: RemediationLevel): RemediationAction[] {
  return CATALOG.filter(c => c.level === level);
}
