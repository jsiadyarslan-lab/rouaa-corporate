// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Pattern Matcher
// ═══════════════════════════════════════════════════════════════
// Detects repeated error patterns across pipeline articles.
// Matches known failure signatures to categorize root causes.
// ═══════════════════════════════════════════════════════════════

import type { ArticleVitals, Locale, PatternMatch, PipelineStage } from '../types/guardian-types';

// Known failure patterns
interface FailurePattern {
  id: string;
  name: string;
  nameAr: string;
  stage: PipelineStage;
  signature: (vitals: ArticleVitals) => boolean;
  remediationLevel: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
}

const KNOWN_PATTERNS: FailurePattern[] = [
  {
    id: 'imaged_no_publish',
    name: 'Imaged but not published',
    nameAr: 'صوّر لكن لم يُنشر',
    stage: 'imaged',
    signature: v => v.currentStage === 'imaged' && v.retryCount >= 3,
    remediationLevel: 'L2',
  },
  {
    id: 'analyzed_no_content',
    name: 'Analyzed without content',
    nameAr: 'حُلّل بدون محتوى',
    stage: 'analyzed',
    signature: v => v.currentStage === 'analyzed' && !v.hasContent,
    remediationLevel: 'L2',
  },
  {
    id: 'analyzed_no_image',
    name: 'Analyzed without image',
    nameAr: 'حُلّل بدون صورة',
    stage: 'analyzed',
    signature: v => ['analyzed', 'imaged'].includes(v.currentStage) && v.hasContent && !v.hasImage && v.retryCount < 3,
    remediationLevel: 'L1',
  },
  {
    id: 'content_short',
    name: 'Content too short',
    nameAr: 'المحتوى قصير جداً',
    stage: 'analyzed',
    signature: v => v.hasContent && v.contentLength < 80 && v.currentStage !== 'fetched',
    remediationLevel: 'L3',
  },
  {
    id: 'language_threshold_mismatch',
    name: 'Language threshold too strict',
    nameAr: 'عتبة اللغة صارمة جداً',
    stage: 'imaged',
    signature: v => v.currentStage === 'imaged' && v.hasContent && v.retryCount >= 3 && v.contentLength >= 80,
    remediationLevel: 'L3',
  },
  {
    id: 'imaged_analyzed_loop',
    name: 'Imaged↔Analyzed infinite loop',
    nameAr: 'حلقة مفرغة صور↔تحليل',
    stage: 'imaged',
    signature: v => v.currentStage === 'imaged' && v.retryCount >= 5,
    remediationLevel: 'L4',
  },
  {
    id: 'analysis_no_full_content',
    name: 'AI analysis missing fullContent',
    nameAr: 'تحليل AI بدون محتوى كامل',
    stage: 'analyzed',
    signature: v => v.hasAnalysis && !v.analysisHasFullContent && !v.hasContent && ['analyzed', 'imaged'].includes(v.currentStage),
    remediationLevel: 'L2',
  },
  {
    id: 'high_retry_permanent',
    name: 'Permanently stuck (high retry)',
    nameAr: 'عالق بشكل دائم (محاولات عالية)',
    stage: 'skipped',
    signature: v => v.retryCount >= 15,
    remediationLevel: 'L2',
  },
];

export function matchPatterns(articleVitals: ArticleVitals[]): PatternMatch[] {
  const patternCounts = new Map<string, { count: number; lastSeen: number; locales: Set<string> }>();

  for (const vitals of articleVitals) {
    for (const pattern of KNOWN_PATTERNS) {
      if (pattern.signature(vitals)) {
        const existing = patternCounts.get(pattern.id) || { count: 0, lastSeen: 0, locales: new Set<string>() };
        existing.count++;
        existing.lastSeen = Math.max(existing.lastSeen, Date.now());
        existing.locales.add(vitals.locale);
        patternCounts.set(pattern.id, existing);
      }
    }
  }

  const results: PatternMatch[] = [];
  for (const pattern of KNOWN_PATTERNS) {
    const data = patternCounts.get(pattern.id);
    if (data && data.count > 0) {
      // Take first locale (patterns can span multiple locales)
      const locale = Array.from(data.locales)[0] as Locale;
      results.push({
        patternId: pattern.id,
        patternName: pattern.name,
        confidence: Math.min(1, data.count / 10),  // Higher count = higher confidence
        occurrences: data.count,
        lastSeen: data.lastSeen,
        locale,
      });
    }
  }

  return results.sort((a, b) => b.occurrences - a.occurrences);
}

export function getPatternRemediationLevel(patternId: string): 'L1' | 'L2' | 'L3' | 'L4' | 'L5' {
  const pattern = KNOWN_PATTERNS.find(p => p.id === patternId);
  return pattern?.remediationLevel || 'L5';
}

export function getPatternName(patternId: string): { name: string; nameAr: string } {
  const pattern = KNOWN_PATTERNS.find(p => p.id === patternId);
  return pattern ? { name: pattern.name, nameAr: pattern.nameAr } : { name: patternId, nameAr: patternId };
}

export { KNOWN_PATTERNS };
