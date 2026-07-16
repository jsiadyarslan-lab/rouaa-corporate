// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Public API (index.ts)
// ═══════════════════════════════════════════════════════════════
// Single entry point for all Guardian functionality.
// Import from '@/lib/pipeline/guardian' to use.
// ═══════════════════════════════════════════════════════════════

// Main OODA engine
export { runGuardianCycle, getGuardianStatus, getLastReport, getFixHistory } from './pipeline-guardian';

// Sensory Engine
export { collectSnapshot, collectAllLocales } from './sensors/sensory-engine';

// Root Cause Analysis
export { analyzeRootCauses } from './analysis/root-cause-analyzer';
export { matchPatterns } from './analysis/pattern-matcher';

// Remediation
export { executeRemediation, executeManualFix } from './remediation/remediation-engine';
export { getAllFixes, getFixesForRootCause, getFixById } from './remediation/remediation-catalog';

// Operations
export { ensureOrchestratorRunning } from './operations/operation-coordinator';
export { recoverStuckArticle, recoverAllStuck, getStuckArticles } from './operations/lifecycle-manager';

// Learning
export { getFailurePatterns, getCommonFailures, getRemediationSuccessRate } from './learning/learning-store';
export { matchFailurePattern, getPatternsForLocale } from './learning/failure-patterns';

// Types
export type {
  Locale,
  PipelineStage,
  GuardianStep,
  HealthStatus,
  LifecycleState,
  RemediationLevel,
  IssueSeverity,
  StepMetrics,
  ArticleVitals,
  SensorySnapshot,
  RootCause,
  PatternMatch,
  TrendData,
  RemediationAction,
  RemediationContext,
  RemediationResult,
  EscalationStep,
  ArticleLifecycle,
  LifecycleStage,
  OperationPlan,
  PlannedAction,
  FailurePattern,
  LearningEntry,
  LocaleHealth,
  GuardianIssue,
  GuardianFix,
  GuardianReport,
  GuardianDashboardData,
} from './types/guardian-types';
