// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Type Definitions
// ═══════════════════════════════════════════════════════════════
// Central type definitions for the Pipeline Guardian Agent.
// All components import from this single source of truth.
// ═══════════════════════════════════════════════════════════════

export type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

export type PipelineStage =
  | 'fetched'
  | 'content_loaded'
  | 'translated'
  | 'analyzed'
  | 'imaged'
  | 'published'
  | 'skipped';

export type GuardianStep =
  | 'fetch'
  | 'content_load'
  | 'process'
  | 'analyze'
  | 'image'
  | 'publish';

export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'dead';

export type LifecycleState = 'active' | 'stuck' | 'recovered' | 'published' | 'archived';

export type RemediationLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export type IssueSeverity = 'critical' | 'warning' | 'info';

// ─── Sensory Engine Types ────────────────────────────────────

export interface StepMetrics {
  step: GuardianStep;
  locale: Locale;
  timestamp: number;
  input: number;          // Articles entering this step
  output: number;         // Articles successfully exiting this step
  failed: number;         // Articles that failed at this step
  skipped: number;        // Articles skipped at this step
  failureReasons: Map<string, number>;  // Reason → count
  avgDurationMs: number;
  p95DurationMs: number;
}

export interface ArticleVitals {
  articleId: string;
  locale: Locale;
  currentStage: PipelineStage;
  hasTitle: boolean;
  hasContent: boolean;
  contentLength: number;
  hasAnalysis: boolean;
  analysisHasFullContent: boolean;
  hasImage: boolean;
  hasSlug: boolean;
  retryCount: number;
  lastError: string | null;
  stuckMinutes: number;
  isStuck: boolean;   // true if stuckMinutes > 5
}

export interface SensorySnapshot {
  timestamp: number;
  locale: Locale;
  stepMetrics: Map<GuardianStep, StepMetrics>;
  articleVitals: ArticleVitals[];
  totalBlocked: number;
  publishedToday: number;
  publishedThisHour: number;
  pendingCount: number;
  stageBreakdown: Record<string, number>;
  quotaRemaining: { hourly: number; daily: number };
}

// ─── Root Cause Analysis Types ───────────────────────────────

export interface RootCause {
  id: string;
  category: 'pattern' | 'statistical' | 'deep';
  severity: IssueSeverity;
  message: string;
  affectedCount: number;
  affectedStage: PipelineStage;
  pattern: string;          // Machine-readable pattern key
  evidence: string[];       // Supporting evidence details
  remediationLevel: RemediationLevel;
  autoFixable: boolean;
}

export interface PatternMatch {
  patternId: string;
  patternName: string;
  confidence: number;       // 0-1
  occurrences: number;
  lastSeen: number;
  locale: Locale;
}

export interface TrendData {
  metric: string;
  locale: Locale;
  current: number;
  previous: number;
  change: number;           // percentage change
  direction: 'up' | 'down' | 'stable';
  isAnomalous: boolean;
}

// ─── Remediation Types ──────────────────────────────────────

export interface RemediationAction {
  id: string;
  name: string;
  nameAr: string;
  level: RemediationLevel;
  description: string;
  descriptionAr: string;
  requiresApproval: boolean;
  cooldownMs: number;       // Minimum time between same fix
  maxRetries: number;
  currentRetries: number;
  execute: (context: RemediationContext) => Promise<RemediationResult>;
}

export interface RemediationContext {
  locale: Locale;
  rootCause: RootCause;
  affectedArticles: string[];  // Article IDs
  snapshot: SensorySnapshot;
  dryRun: boolean;
}

export interface RemediationResult {
  success: boolean;
  action: string;
  locale: Locale;
  affectedCount: number;
  message: string;
  messageAr: string;
  beforeState: Record<string, number>;
  afterState: Record<string, number>;
  rollbackAvailable: boolean;
  rollbackData?: unknown;
  durationMs: number;
}

export interface EscalationStep {
  level: RemediationLevel;
  description: string;
  autoExecute: boolean;
  maxDurationMs: number;
  requiresVerification: boolean;
}

// ─── Lifecycle Types ────────────────────────────────────────

export interface ArticleLifecycle {
  articleId: string;
  locale: Locale;
  stages: LifecycleStage[];
  currentStage: PipelineStage;
  isStuck: boolean;
  stuckMinutes: number;
  retryCount: number;
  lifecycleState: LifecycleState;
  createdAt: number;
  lastUpdatedAt: number;
}

export interface LifecycleStage {
  stage: PipelineStage;
  enteredAt: number;
  exitedAt: number | null;
  durationMs: number;
  result: 'success' | 'failed' | 'skipped';
  errorReason?: string;
}

// ─── Operation Coordinator Types ─────────────────────────────

export interface OperationPlan {
  id: string;
  locale: Locale;
  actions: PlannedAction[];
  estimatedDurationMs: number;
  riskLevel: 'low' | 'medium' | 'high';
  requiresOrchestratorPause: boolean;
}

export interface PlannedAction {
  step: GuardianStep;
  action: string;
  params: Record<string, unknown>;
  dependsOn: string[];      // IDs of actions this depends on
}

// ─── Learning Types ─────────────────────────────────────────

export interface FailurePattern {
  id: string;
  name: string;
  nameAr: string;
  locale: Locale;
  pattern: string;
  frequency: number;
  lastSeen: number;
  averageImpact: number;
  successfulRemediation: string | null;
  successRate: number;       // 0-1
}

export interface LearningEntry {
  id: string;
  timestamp: number;
  locale: Locale;
  rootCause: string;
  remediation: string;
  success: boolean;
  timeToFix: number;
  articleCount: number;
}

// ─── Guardian Report Types ──────────────────────────────────

export interface LocaleHealth {
  locale: Locale;
  score: number;          // 0-100
  status: HealthStatus;
  totalBlocked: number;
  stageBreakdown: Record<string, number>;
  issues: GuardianIssue[];
  rootCauses: RootCause[];
  lastFix: GuardianFix | null;
  publishedToday: number;
  publishedThisHour: number;
  pendingCount: number;
  quotaRemaining: { hourly: number; daily: number };
  snapshot?: SensorySnapshot;
}

export interface GuardianIssue {
  id: string;
  severity: IssueSeverity;
  message: string;
  messageAr?: string;
  affectedCount: number;
  autoFixable: boolean;
  fixApplied?: boolean;
  fixResult?: string;
  rootCauseId?: string;
}

export interface GuardianFix {
  action: string;
  locale: Locale;
  affectedCount: number;
  success: boolean;
  message: string;
  messageAr?: string;
  level: RemediationLevel;
  timestamp: number;
  durationMs: number;
  rollbackAvailable: boolean;
}

export interface GuardianReport {
  version: 'V2';
  timestamp: number;
  cycleNumber: number;
  locales: Record<Locale, LocaleHealth>;
  overallScore: number;
  overallStatus: HealthStatus;
  fixesApplied: GuardianFix[];
  rootCausesFound: RootCause[];
  oodaPhase: 'observe' | 'orient' | 'decide' | 'act' | 'learn';
  durationMs: number;
}

// ─── Dashboard Types ────────────────────────────────────────

export interface GuardianDashboardData {
  overallScore: number;
  overallStatus: HealthStatus;
  lastRunTime: number;
  nextRunTime: number;
  localeSummaries: Record<Locale, {
    score: number;
    status: HealthStatus;
    publishedToday: number;
    totalBlocked: number;
    topIssue: string | null;
  }>;
  recentFixes: GuardianFix[];
  recentRootCauses: RootCause[];
  fixHistoryCount: number;
  successRate: number;     // Last 24h fix success rate
}

// ─── Stage Performance Criteria ─────────────────────────────

export const STAGE_SUCCESS_CRITERIA: Record<string, {
  minimumRate: number;
  targetRate: number;
  description: string;
}> = {
  'fetch→content_load':  { minimumRate: 0.50, targetRate: 0.90, description: 'RSS fetch to content loading' },
  'content_load→process': { minimumRate: 0.40, targetRate: 0.85, description: 'Content loading to processing' },
  'process→analyze':     { minimumRate: 0.45, targetRate: 0.90, description: 'Processing to AI analysis' },
  'analyze→image':       { minimumRate: 0.60, targetRate: 0.95, description: 'Analysis to image generation' },
  'image→publish':       { minimumRate: 0.40, targetRate: 0.85, description: 'Image to publishing' },
};

// ─── Remediation Level Descriptions ─────────────────────────

export const REMEDIATION_LEVELS: Record<RemediationLevel, {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  autoExecute: boolean;
  cooldownMs: number;
}> = {
  L1: {
    name: 'Simple Retry',
    nameAr: 'إعادة محاولة بسيطة',
    description: 'Retry with simple fix (timeout, empty AI, skip)',
    descriptionAr: 'إعادة المحاولة مع إصلاح بسيط (مهلة، AI فارغ، تخطي)',
    autoExecute: true,
    cooldownMs: 2 * 60 * 1000,  // 2 minutes
  },
  L2: {
    name: 'State Reset',
    nameAr: 'إعادة تعيين الحالة',
    description: 'Reset articles stuck at skipped stage back to fetched',
    descriptionAr: 'إعادة تعيين المقالات العالقة في مرحلة التخطي إلى مرحلة الجلب',
    autoExecute: true,
    cooldownMs: 5 * 60 * 1000,  // 5 minutes
  },
  L3: {
    name: 'Threshold Adjustment',
    nameAr: 'تعديل العتبة',
    description: 'Adjust validation thresholds with monitoring (200→80 length)',
    descriptionAr: 'تعديل عتبات التحقق مع المراقبة (200→80 طول)',
    autoExecute: true,
    cooldownMs: 15 * 60 * 1000,  // 15 minutes
  },
  L4: {
    name: 'Code Fix',
    nameAr: 'إصلاح الكود',
    description: 'Fix known code bugs (imaged↔analyzed cycle)',
    descriptionAr: 'إصلاح أخطاء الكود المعروفة (دورة الصور↔التحليل)',
    autoExecute: true,
    cooldownMs: 30 * 60 * 1000,  // 30 minutes
  },
  L5: {
    name: 'Full Pipeline Restart',
    nameAr: 'إعادة تشغيل خط الأنابيب بالكامل',
    description: 'Full pipeline restart with complete step verification',
    descriptionAr: 'إعادة تشغيل خط الأنابيب بالكامل مع التحقق الكامل من الخطوات',
    autoExecute: false,  // Requires manual approval
    cooldownMs: 60 * 60 * 1000,  // 1 hour
  },
};
