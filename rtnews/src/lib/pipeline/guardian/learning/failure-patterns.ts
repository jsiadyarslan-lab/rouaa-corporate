// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Failure Patterns
// ═══════════════════════════════════════════════════════════════
// Pre-defined failure pattern library for known pipeline issues.
// Maps error signatures to known root causes and remediations.
// ═══════════════════════════════════════════════════════════════

import type { Locale } from '../types/guardian-types';

export interface KnownFailurePattern {
  id: string;
  name: string;
  nameAr: string;
  errorSignature: string | RegExp;
  localeRelevance: Locale[];
  rootCauseCategory: string;
  recommendedFix: string;
  preventionTip: string;
}

export const KNOWN_FAILURE_PATTERNS: KnownFailurePattern[] = [
  {
    id: 'fp_short_english_content',
    name: 'Short English Content',
    nameAr: 'محتوى إنجليزي قصير',
    errorSignature: /short english|missing or short english/i,
    localeRelevance: ['en'],
    rootCauseCategory: 'content_length',
    recommendedFix: 'fix_content_length',
    preventionTip: 'Ensure en-processor extracts fullContent when summary is too short',
  },
  {
    id: 'fp_missing_ai_analysis',
    name: 'Missing AI Analysis',
    nameAr: 'تحليل AI مفقود',
    errorSignature: /missing or invalid ai analysis/i,
    localeRelevance: ['en', 'fr', 'tr', 'es'],
    rootCauseCategory: 'ai_failure',
    recommendedFix: 'fix_duplicate_window',
    preventionTip: 'Verify AI API key and rate limits; check en-processor V417 fallback',
  },
  {
    id: 'fp_language_threshold',
    name: 'Language Threshold Too Strict',
    nameAr: 'عتبة اللغة صارمة جداً',
    errorSignature: /ismostlyenglish|english ratio/i,
    localeRelevance: ['en'],
    rootCauseCategory: 'threshold_mismatch',
    recommendedFix: 'fix_language_threshold',
    preventionTip: 'Use EN_PIPELINE_CONFIG.MIN_ENGLISH_RATIO (0.50) not hardcoded 0.70',
  },
  {
    id: 'fp_imaged_loop',
    name: 'Imaged↔Analyzed Loop',
    nameAr: 'حلقة صور↔تحليل مفرغة',
    errorSignature: /imaged.*retry|retry.*imaged/i,
    localeRelevance: ['en'],
    rootCauseCategory: 'stage_loop',
    recommendedFix: 'fix_imaged_loop',
    preventionTip: 'En-processor should not advance to analyzed without content+analysis',
  },
  {
    id: 'fp_timeout',
    name: 'AI Timeout',
    nameAr: 'مهلة AI',
    errorSignature: /timeout|timed out/i,
    localeRelevance: ['ar', 'en', 'fr', 'tr', 'es'],
    rootCauseCategory: 'timeout',
    recommendedFix: 'fix_duplicate_window',
    preventionTip: 'Increase AI timeout or add retry with backoff',
  },
  {
    id: 'fp_quota_exceeded',
    name: 'Publish Quota Exceeded',
    nameAr: 'تجاوز حصة النشر',
    errorSignature: /quota|limit exceeded/i,
    localeRelevance: ['en', 'fr', 'tr', 'es'],
    rootCauseCategory: 'quota',
    recommendedFix: 'none',
    preventionTip: 'Increase daily/hourly limits or adjust fetch frequency',
  },
  {
    id: 'fp_image_failure',
    name: 'Image Generation Failure',
    nameAr: 'فشل توليد الصورة',
    errorSignature: /image|canvas|dall-e/i,
    localeRelevance: ['ar', 'en', 'fr', 'tr', 'es'],
    rootCauseCategory: 'image_generation',
    recommendedFix: 'fix_duplicate_window',
    preventionTip: 'Check Canvas API key and add fallback to placeholder images',
  },
];

export function matchFailurePattern(errorMessage: string): KnownFailurePattern | null {
  for (const pattern of KNOWN_FAILURE_PATTERNS) {
    const sig = pattern.errorSignature;
    const matches = sig instanceof RegExp
      ? sig.test(errorMessage)
      : errorMessage.toLowerCase().includes(sig.toLowerCase());
    if (matches) return pattern;
  }
  return null;
}

export function getPatternsForLocale(locale: Locale): KnownFailurePattern[] {
  return KNOWN_FAILURE_PATTERNS.filter(p => p.localeRelevance.includes(locale));
}
