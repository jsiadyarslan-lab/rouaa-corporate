// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Root Cause Analyzer
// ═══════════════════════════════════════════════════════════════
// The brain of the Guardian. Three-layer analysis:
//   Layer 1: Pattern detection (repeated error patterns)
//   Layer 2: Statistical analysis (hourly publish rate)
//   Layer 3: Deep root cause analysis (WHY not just WHAT)
// ═══════════════════════════════════════════════════════════════

import type {
  ArticleVitals,
  Locale,
  PipelineStage,
  RootCause,
  SensorySnapshot,
} from '../types/guardian-types';
import { matchPatterns, getPatternRemediationLevel, getPatternName } from './pattern-matcher';
import { analyzeTrends, detectAnomalies, getPublishingHealth } from './trend-analyzer';

export async function analyzeRootCauses(snapshot: SensorySnapshot): Promise<RootCause[]> {
  const rootCauses: RootCause[] = [];
  const { locale, articleVitals } = snapshot;

  // ── Layer 1: Pattern Detection ──────────────────────────────
  const patternMatches = matchPatterns(articleVitals);
  for (const match of patternMatches) {
    const level = getPatternRemediationLevel(match.patternId);
    const nameInfo = getPatternName(match.patternId);

    rootCauses.push({
      id: `${locale}_pattern_${match.patternId}`,
      category: 'pattern',
      severity: match.occurrences >= 50 ? 'critical' : match.occurrences >= 10 ? 'warning' : 'info',
      message: `${nameInfo.name}: ${match.occurrences} articles affected (${Math.round(match.confidence * 100)}% confidence)`,
      affectedCount: match.occurrences,
      affectedStage: getStageFromPatternId(match.patternId) as PipelineStage,
      pattern: match.patternId,
      evidence: [
        `Pattern: ${nameInfo.nameAr}`,
        `Confidence: ${Math.round(match.confidence * 100)}%`,
        `Occurrences: ${match.occurrences}`,
      ],
      remediationLevel: level,
      autoFixable: level !== 'L5',
    });
  }

  // ── Layer 2: Statistical Analysis ──────────────────────────
  const trends = analyzeTrends(locale);
  const anomalies = detectAnomalies(trends);
  const publishingHealth = getPublishingHealth(trends);

  if (publishingHealth === 'dead') {
    rootCauses.push({
      id: `${locale}_publishing_dead`,
      category: 'statistical',
      severity: 'critical',
      message: `ZERO articles being published for ${locale.toUpperCase()} — pipeline is completely dead`,
      affectedCount: snapshot.totalBlocked,
      affectedStage: 'imaged',
      pattern: 'zero_publish_rate',
      evidence: [
        `Published this hour: ${snapshot.publishedThisHour}`,
        `Published today: ${snapshot.publishedToday}`,
        `Blocked articles: ${snapshot.totalBlocked}`,
        `Pending: ${snapshot.pendingCount}`,
      ],
      remediationLevel: 'L4',
      autoFixable: true,
    });
  } else if (publishingHealth === 'declining') {
    const pubTrend = trends.find(t => t.metric === 'published_this_hour');
    rootCauses.push({
      id: `${locale}_publishing_declining`,
      category: 'statistical',
      severity: 'warning',
      message: `Publishing rate declining for ${locale.toUpperCase()}: ${pubTrend?.change.toFixed(1)}% change`,
      affectedCount: snapshot.totalBlocked,
      affectedStage: 'imaged',
      pattern: 'declining_publish_rate',
      evidence: [
        `Current hour: ${pubTrend?.current}`,
        `Previous: ${pubTrend?.previous}`,
        `Change: ${pubTrend?.change.toFixed(1)}%`,
      ],
      remediationLevel: 'L2',
      autoFixable: true,
    });
  }

  for (const anomaly of anomalies) {
    if (anomaly.metric === 'total_blocked' && anomaly.direction === 'up' && anomaly.isAnomalous) {
      rootCauses.push({
        id: `${locale}_blocked_spike`,
        category: 'statistical',
        severity: 'warning',
        message: `Sudden spike in blocked articles: ${anomaly.change.toFixed(1)}% increase`,
        affectedCount: anomaly.current,
        affectedStage: 'fetched',
        pattern: 'blocked_spike',
        evidence: [`Current: ${anomaly.current}`, `Previous: ${anomaly.previous}`, `Change: ${anomaly.change.toFixed(1)}%`],
        remediationLevel: 'L2',
        autoFixable: true,
      });
    }
  }

  // ── Layer 3: Deep Root Cause Analysis ──────────────────────
  // If no articles being published, trace back through the pipeline
  if (snapshot.publishedThisHour === 0 && snapshot.totalBlocked > 0) {
    const deepCause = await deepAnalyzePipelineBlock(snapshot, articleVitals);
    if (deepCause) {
      rootCauses.push(deepCause);
    }
  }

  // Check for specific EN pipeline issues
  if (locale === 'en') {
    const enSpecificCauses = analyzeEnSpecific(snapshot, articleVitals);
    rootCauses.push(...enSpecificCauses);
  }

  return rootCauses.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

async function deepAnalyzePipelineBlock(
  snapshot: SensorySnapshot,
  vitals: ArticleVitals[],
): Promise<RootCause | null> {
  const { locale, stageBreakdown } = snapshot;

  // Find which stage has the most articles stuck
  const stages = Object.entries(stageBreakdown).sort((a, b) => b[1] - a[1]);
  if (stages.length === 0) return null;

  const [bottleneck, count] = stages[0];

  // Analyze WHY articles are stuck at this bottleneck
  const atBottleneck = vitals.filter(v => v.currentStage === bottleneck);
  const missingContent = atBottleneck.filter(v => !v.hasContent).length;
  const missingAnalysis = atBottleneck.filter(v => !v.hasAnalysis).length;
  const highRetry = atBottleneck.filter(v => v.retryCount >= 3).length;

  let message = `Pipeline blocked at '${bottleneck}' with ${count} articles. `;
  const evidence: string[] = [`Bottleneck: ${bottleneck} (${count} articles)`];

  if (missingContent > missingAnalysis) {
    message += `Primary cause: Missing content (${missingContent}/${atBottleneck.length})`;
    evidence.push(`Missing content: ${missingContent}`);
  } else if (missingAnalysis > 0) {
    message += `Primary cause: Missing AI analysis (${missingAnalysis}/${atBottleneck.length})`;
    evidence.push(`Missing analysis: ${missingAnalysis}`);
  }

  if (highRetry > 0) {
    message += `. High retry: ${highRetry}`;
    evidence.push(`High retry (≥3): ${highRetry}`);
  }

  // Determine remediation level based on bottleneck
  let remediationLevel: 'L1' | 'L2' | 'L3' | 'L4' | 'L5' = 'L2';
  if (highRetry > atBottleneck.length * 0.8) remediationLevel = 'L4';
  if (bottleneck === 'skipped') remediationLevel = 'L2';

  return {
    id: `${locale}_deep_${bottleneck}`,
    category: 'deep',
    severity: 'critical',
    message,
    affectedCount: count,
    affectedStage: bottleneck as any,
    pattern: `bottleneck_${bottleneck}`,
    evidence,
    remediationLevel,
    autoFixable: true,
  };
}

function analyzeEnSpecific(
  snapshot: SensorySnapshot,
  vitals: ArticleVitals[],
): RootCause[] {
  const causes: RootCause[] = [];
  const { locale } = snapshot;

  // Check: isMostlyEnglish threshold issue (0.70 vs 0.50)
  const imagedHighRetry = vitals.filter(
    v => v.currentStage === 'imaged' && v.retryCount >= 3 && v.hasContent && v.contentLength >= 300
  );
  if (imagedHighRetry.length >= 10) {
    causes.push({
      id: `${locale}_en_threshold_strict`,
      category: 'deep',
      severity: 'critical',
      message: `isMostlyEnglish threshold too strict: 0.70 used instead of config 0.50 — ${imagedHighRetry.length} EN articles blocked`,
      affectedCount: imagedHighRetry.length,
      affectedStage: 'imaged',
      pattern: 'language_threshold_mismatch',
      evidence: [
        `Articles at imaged with retryCount≥3: ${imagedHighRetry.length}`,
        `All have content ≥ 300 chars`,
        `Likely blocked by isMostlyEnglish(0.70) instead of MIN_ENGLISH_RATIO(0.50)`,
      ],
      remediationLevel: 'L3',
      autoFixable: true,
    });
  }

  // Check: content length threshold (old 80 vs new 300)
  const shortContentAnalyzed = vitals.filter(
    v => ['analyzed', 'imaged'].includes(v.currentStage) && v.contentLength >= 80 && v.contentLength < 300 && v.retryCount >= 2
  );
  if (shortContentAnalyzed.length >= 5) {
    causes.push({
      id: `${locale}_en_length_threshold`,
      category: 'deep',
      severity: 'warning',
      message: `EN articles with short content (80-300 chars) being rejected by new 300-char minimum threshold`,
      affectedCount: shortContentAnalyzed.length,
      affectedStage: 'analyzed',
      pattern: 'content_length_threshold',
      evidence: [
        `Articles with 80-300 char content stuck: ${shortContentAnalyzed.length}`,
        `MIN_EN_CONTENT_LENGTH is now 300, these need reprocessing for longer content`,
      ],
      remediationLevel: 'L3',
      autoFixable: true,
    });
  }

  // Check: imaged↔analyzed infinite loop
  const imagedLoop = vitals.filter(
    v => v.currentStage === 'imaged' && v.retryCount >= 5
  );
  if (imagedLoop.length >= 5) {
    causes.push({
      id: `${locale}_en_imaged_loop`,
      category: 'deep',
      severity: 'critical',
      message: `EN articles stuck in imaged↔analyzed loop: ${imagedLoop.length} articles with retryCount≥5`,
      affectedCount: imagedLoop.length,
      affectedStage: 'imaged',
      pattern: 'imaged_analyzed_loop',
      evidence: [
        `Articles at imaged with retry≥5: ${imagedLoop.length}`,
        `These keep bouncing between imaged and analyzed`,
      ],
      remediationLevel: 'L4',
      autoFixable: true,
    });
  }

  return causes;
}

function getStageFromPatternId(patternId: string): string {
  const mapping: Record<string, string> = {
    imaged_no_publish: 'imaged',
    analyzed_no_content: 'analyzed',
    analyzed_no_image: 'analyzed',
    content_short: 'analyzed',
    language_threshold_mismatch: 'imaged',
    imaged_analyzed_loop: 'imaged',
    analysis_no_full_content: 'analyzed',
    high_retry_permanent: 'skipped',
  };
  return mapping[patternId] || 'fetched';
}
