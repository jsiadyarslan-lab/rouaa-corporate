// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Step Probe
// ═══════════════════════════════════════════════════════════════
// Probes each pipeline step for health metrics.
// Measures input/output/failed/skipped + duration statistics.
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import type { GuardianStep, Locale, PipelineStage, StepMetrics } from '../types/guardian-types';

// Map GuardianStep → processingStage values
const STEP_TO_STAGE: Record<GuardianStep, PipelineStage[]> = {
  fetch: ['fetched'],
  content_load: ['content_loaded'],
  process: ['analyzed'],  // After en-processor runs
  analyze: ['analyzed'],  // After analysis is added
  image: ['imaged'],
  publish: ['published'],
};

// Map previous stage → current stage for throughput calculation
const STAGE_TRANSITIONS: Record<GuardianStep, { from: PipelineStage; to: PipelineStage }> = {
  fetch: { from: 'fetched' as PipelineStage, to: 'content_loaded' as PipelineStage },
  content_load: { from: 'content_loaded' as PipelineStage, to: 'analyzed' as PipelineStage },
  process: { from: 'fetched' as PipelineStage, to: 'analyzed' as PipelineStage },
  analyze: { from: 'analyzed' as PipelineStage, to: 'imaged' as PipelineStage },
  image: { from: 'imaged' as PipelineStage, to: 'published' as PipelineStage },
  publish: { from: 'imaged' as PipelineStage, to: 'published' as PipelineStage },
};

export async function probeStep(
  step: GuardianStep,
  locale: Locale,
): Promise<StepMetrics> {
  const timestamp = Date.now();
  const failureReasons = new Map<string, number>();

  try {
    // Count articles at each relevant stage
    const [inputCount, outputCount, failedCount, skippedCount] = await Promise.all([
      // Input: articles currently at this stage (waiting to be processed)
      db.newsItem.count({
        where: {
          locale,
          isReady: false,
          isPublished: false,
          processingStage: { in: STEP_TO_STAGE[step] },
          retryCount: { lt: 15 },
        },
      }),
      // Output: articles that successfully moved past this stage
      step === 'publish'
        ? db.newsItem.count({
            where: {
              locale,
              isReady: true,
              isPublished: true,
              publishedAt: { gte: new Date(timestamp - 30 * 60 * 1000) },  // Last 30min
            },
          })
        : db.newsItem.count({
            where: {
              locale,
              processingStage: { notIn: STEP_TO_STAGE[step] },
              fetchedAt: { gte: new Date(timestamp - 30 * 60 * 1000) },
            },
          }),
      // Failed: articles with errors at this stage
      db.newsItem.count({
        where: {
          locale,
          isReady: false,
          isPublished: false,
          processingStage: { in: STEP_TO_STAGE[step] },
          lastError: { not: null },
        },
      }),
      // Skipped: articles in 'skipped' stage
      db.newsItem.count({
        where: {
          locale,
          isReady: false,
          isPublished: false,
          processingStage: 'skipped',
        },
      }),
    ]);

    // Collect failure reasons from last 30 minutes
    const errorSamples = await db.newsItem.findMany({
      where: {
        locale,
        isReady: false,
        isPublished: false,
        processingStage: { in: STEP_TO_STAGE[step] },
        lastError: { not: null },
      },
      select: { lastError: true },
      take: 100,
    });

    for (const sample of errorSamples) {
      if (sample.lastError) {
        // Normalize error message to a category
        const errorKey = normalizeError(sample.lastError);
        failureReasons.set(errorKey, (failureReasons.get(errorKey) || 0) + 1);
      }
    }

    return {
      step,
      locale,
      timestamp,
      input: inputCount,
      output: outputCount,
      failed: failedCount,
      skipped: skippedCount,
      failureReasons,
      avgDurationMs: 0,  // Will be populated by article tracker
      p95DurationMs: 0,
    };
  } catch (err) {
    console.error(`[StepProbe] Error probing ${step}/${locale}:`, err);
    return {
      step,
      locale,
      timestamp,
      input: -1,
      output: -1,
      failed: -1,
      skipped: -1,
      failureReasons: new Map([['probe_error', 1]]),
      avgDurationMs: 0,
      p95DurationMs: 0,
    };
  }
}

function normalizeError(error: string): string {
  const lower = error.toLowerCase();
  if (lower.includes('timeout') || lower.includes('timed out')) return 'timeout';
  if (lower.includes('short english') || lower.includes('missing or short english content')) return 'short_content';
  if (lower.includes('missing or invalid ai analysis')) return 'missing_analysis';
  if (lower.includes('ismostlyenglish') || lower.includes('english ratio')) return 'language_threshold';
  if (lower.includes('garbage') || lower.includes('gibberish')) return 'garbage_content';
  if (lower.includes('quota') || lower.includes('limit')) return 'quota_exceeded';
  if (lower.includes('duplicate') || lower.includes('already exists')) return 'duplicate';
  if (lower.includes('image') || lower.includes('canvas')) return 'image_failure';
  if (lower.includes('ai') || lower.includes('openai') || lower.includes('gpt')) return 'ai_error';
  if (lower.includes('slug')) return 'missing_slug';
  if (lower.includes('content length')) return 'content_length';
  return 'other';
}

export function computeStepHealth(metrics: StepMetrics): number {
  if (metrics.input <= 0) return 100;  // No articles to process = healthy
  const successRate = metrics.output / Math.max(1, metrics.input);
  const failRate = metrics.failed / Math.max(1, metrics.input);
  return Math.max(0, Math.min(100, Math.round((successRate - failRate * 2) * 100)));
}
