// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Main OODA Engine
// ═══════════════════════════════════════════════════════════════
// OODA Loop: Observe → Orient → Decide → Act → Learn
// 30-60 second cycle for continuous pipeline monitoring.
// 3 consecutive OODA cycles to confirm remediation success.
//
// DESIGN PRINCIPLES:
// 1. Proactive not reactive — fix before error
// 2. Source-first correction — fix at source not downstream
// 3. Safe escalation — try L1→L5
// 4. Per-step accountability — track input/output per step
// 5. isReady preservation — Guardian NEVER sets isReady=true
// ═══════════════════════════════════════════════════════════════

import type {
  GuardianFix,
  GuardianIssue,
  GuardianReport,
  HealthStatus,
  Locale,
  LocaleHealth,
  RootCause,
  SensorySnapshot,
} from './types/guardian-types';
import { collectSnapshot, ALL_LOCALES } from './sensors/sensory-engine';
import { analyzeRootCauses } from './analysis/root-cause-analyzer';
import { executeRemediation, getRecentFixes, getFixSuccessRate } from './remediation/remediation-engine';
import { recoverAllStuck } from './operations/lifecycle-manager';
import { recordLearning } from './learning/learning-store';
import { matchFailurePattern } from './learning/failure-patterns';

// ─── State ───────────────────────────────────────────────────

let lastReport: GuardianReport | null = null;
let lastRunTime = 0;
let cycleNumber = 0;
const MIN_RUN_INTERVAL_MS = 30 * 1000;  // 30 seconds minimum between cycles

// Telegram alert throttling
let lastAlertTime = 0;
const ALERT_COOLDOWN_MS = 15 * 60 * 1000;  // 15 minutes

// ─── Health Scoring ──────────────────────────────────────────

function computeHealthScore(
  publishedToday: number,
  publishedThisHour: number,
  totalBlocked: number,
  pendingCount: number,
  issues: GuardianIssue[],
  rootCauses: RootCause[],
): number {
  let score = 100;

  // Deduct for blocked articles
  if (totalBlocked > 500) score -= 30;
  else if (totalBlocked > 200) score -= 15;
  else if (totalBlocked > 50) score -= 5;

  // Deduct for no publishing today
  if (publishedToday === 0) score -= 40;
  else if (publishedToday < 5) score -= 20;

  // Deduct for no publishing this hour
  if (publishedThisHour === 0) score -= 15;

  // Deduct for critical issues
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  score -= criticalCount * 15;
  score -= warningCount * 5;

  // Deduct for high-priority root causes
  const criticalRootCauses = rootCauses.filter(r => r.severity === 'critical').length;
  score -= criticalRootCauses * 10;

  // Deduct for high pending
  if (pendingCount > 200) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function scoreToStatus(score: number): HealthStatus {
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'degraded';
  if (score >= 20) return 'critical';
  return 'dead';
}

// ─── OODA Loop ───────────────────────────────────────────────

export async function runGuardianCycle(autoFix: boolean = true): Promise<GuardianReport> {
  const startTime = Date.now();

  // Throttle
  if (startTime - lastRunTime < MIN_RUN_INTERVAL_MS && lastReport) {
    return lastReport;
  }
  lastRunTime = startTime;
  cycleNumber++;

  const fixesApplied: GuardianFix[] = [];
  const allRootCauses: RootCause[] = [];
  const localeResults: Record<Locale, LocaleHealth> = {} as any;

  // ═══ OBSERVE ═══════════════════════════════════════════════
  // Collect sensory snapshots for all locales
  const snapshots = new Map<Locale, SensorySnapshot>();
  for (const locale of ALL_LOCALES) {
    try {
      const snapshot = await collectSnapshot(locale);
      snapshots.set(locale, snapshot);
    } catch (err) {
      console.error(`[Guardian V2] Observe failed for ${locale}:`, err);
    }
  }

  // ═══ ORIENT ════════════════════════════════════════════════
  // Analyze root causes for each locale
  for (const locale of ALL_LOCALES) {
    const snapshot = snapshots.get(locale);
    if (!snapshot) continue;

    try {
      const rootCauses = await analyzeRootCauses(snapshot);
      allRootCauses.push(...rootCauses);

      // Convert root causes to issues
      const issues: GuardianIssue[] = rootCauses.map(rc => ({
        id: rc.id,
        severity: rc.severity,
        message: rc.message,
        messageAr: rc.evidence.find(e => e.includes('العرب')) || rc.message,
        affectedCount: rc.affectedCount,
        autoFixable: rc.autoFixable,
        rootCauseId: rc.id,
      }));

      // Add additional checks not covered by root cause analysis
      // Zero publishing check
      if (snapshot.publishedToday === 0 && snapshot.totalBlocked > 0) {
        const alreadyAdded = issues.some(i => i.id.includes('zero_published') || i.id.includes('publishing_dead'));
        if (!alreadyAdded) {
          issues.push({
            id: `${locale}_zero_published_today`,
            severity: 'critical',
            message: `ZERO articles published today for ${locale.toUpperCase()}, but ${snapshot.totalBlocked} are waiting`,
            affectedCount: snapshot.totalBlocked,
            autoFixable: true,
          });
        }
      }

      // Compute health score
      const score = computeHealthScore(
        snapshot.publishedToday,
        snapshot.publishedThisHour,
        snapshot.totalBlocked,
        snapshot.pendingCount,
        issues,
        rootCauses,
      );

      localeResults[locale] = {
        locale,
        score,
        status: scoreToStatus(score),
        totalBlocked: snapshot.totalBlocked,
        stageBreakdown: snapshot.stageBreakdown,
        issues,
        rootCauses,
        lastFix: null,
        publishedToday: snapshot.publishedToday,
        publishedThisHour: snapshot.publishedThisHour,
        pendingCount: snapshot.pendingCount,
        quotaRemaining: snapshot.quotaRemaining,
        snapshot,
      };
    } catch (err) {
      console.error(`[Guardian V2] Orient failed for ${locale}:`, err);
      localeResults[locale] = {
        locale,
        score: 0,
        status: 'dead',
        totalBlocked: -1,
        stageBreakdown: {},
        issues: [{ id: `${locale}_orient_error`, severity: 'critical', message: `Analysis failed: ${err}`, affectedCount: -1, autoFixable: false }],
        rootCauses: [],
        lastFix: null,
        publishedToday: 0,
        publishedThisHour: 0,
        pendingCount: -1,
        quotaRemaining: { hourly: 0, daily: 0 },
      };
    }
  }

  // ═══ DECIDE ════════════════════════════════════════════════
  // Determine which fixes to apply based on root causes
  const fixesToApply: { locale: Locale; rootCause: RootCause; snapshot: SensorySnapshot }[] = [];

  if (autoFix) {
    for (const locale of ALL_LOCALES) {
      const health = localeResults[locale];
      if (!health) continue;

      for (const rootCause of health.rootCauses) {
        if (rootCause.autoFixable && (rootCause.severity === 'critical' || rootCause.severity === 'warning')) {
          const snapshot = snapshots.get(locale);
          if (snapshot) {
            fixesToApply.push({ locale, rootCause, snapshot });
          }
        }
      }
    }
  }

  // ═══ ACT ═══════════════════════════════════════════════════
  // Execute remediation actions
  for (const { locale, rootCause, snapshot } of fixesToApply) {
    try {
      const fix = await executeRemediation(rootCause, snapshot);
      if (fix) {
        fixesApplied.push(fix);

        // Mark the corresponding issue as fixed
        const health = localeResults[locale];
        const matchingIssue = health?.issues.find(i => i.rootCauseId === rootCause.id);
        if (matchingIssue) {
          matchingIssue.fixApplied = true;
          matchingIssue.fixResult = fix.message;
        }
        health.lastFix = fix;

        // ═══ LEARN ══════════════════════════════════════════
        // Record the outcome for learning
        recordLearning({
          timestamp: Date.now(),
          locale,
          rootCause: rootCause.pattern,
          remediation: fix.action,
          success: fix.success,
          timeToFix: fix.durationMs,
          articleCount: fix.affectedCount,
        });

        // Match against known failure patterns
        const knownPattern = matchFailurePattern(rootCause.message);
        if (knownPattern) {
          console.log(`[Guardian V2] Matched known pattern: ${knownPattern.name} → recommended fix: ${knownPattern.recommendedFix}`);
        }
      }
    } catch (err) {
      console.error(`[Guardian V2] Act failed for ${locale}/${rootCause.pattern}:`, err);
    }
  }

  // ═══ LEARN (Post-cycle) ════════════════════════════════════
  // Send Telegram alerts for critical/dead locales
  const criticalLocales = ALL_LOCALES.filter(
    l => localeResults[l]?.status === 'critical' || localeResults[l]?.status === 'dead'
  );
  if (criticalLocales.length > 0) {
    await sendThrottledAlert(criticalLocales, localeResults);
  }

  // Compute overall score
  const scores = ALL_LOCALES.map(l => localeResults[l]?.score || 0);
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const overallStatus: HealthStatus = overallScore >= 80 ? 'healthy' : overallScore >= 50 ? 'degraded' : 'critical';

  const report: GuardianReport = {
    version: 'V2',
    timestamp: startTime,
    cycleNumber,
    locales: localeResults,
    overallScore,
    overallStatus,
    fixesApplied,
    rootCausesFound: allRootCauses,
    oodaPhase: 'learn',
    durationMs: Date.now() - startTime,
  };

  lastReport = report;

  // Console summary
  if (fixesApplied.length > 0 || criticalLocales.length > 0) {
    const fixSummary = fixesApplied.map(f => `${f.locale}:${f.action}(${f.success ? 'OK' : 'FAIL'})`).join(', ');
    console.log(
      `[Guardian V2] Cycle #${cycleNumber} | Score: ${overallScore}/100 (${overallStatus}) | ` +
      `Fixes: ${fixesApplied.length} [${fixSummary}] | Critical: ${criticalLocales.join(', ')} | ${Date.now() - startTime}ms`
    );
  }

  return report;
}

// ─── Telegram Alert ──────────────────────────────────────────

async function sendThrottledAlert(
  criticalLocales: Locale[],
  localeResults: Record<Locale, LocaleHealth>,
): Promise<void> {
  const now = Date.now();
  if (now - lastAlertTime < ALERT_COOLDOWN_MS) return;

  const botToken = process.env.TELEGRAM_ALERT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!botToken || !chatId) return;

  const alertMessage = criticalLocales.map(locale => {
    const h = localeResults[locale];
    const criticalIssues = h.issues.filter(i => i.severity === 'critical').map(i => `  • ${i.message}`).join('\n');
    return `🔴 ${locale.toUpperCase()}: Score ${h.score}/100 (${h.status})\n${criticalIssues}`;
  }).join('\n\n');

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🛡️ <b>Pipeline Guardian V2</b>\n\n${alertMessage}\n\n⏰ ${new Date().toISOString()}`,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(10000),
    });
    lastAlertTime = now;
  } catch (err) {
    console.error('[Guardian V2] Telegram alert failed:', err);
  }
}

// ─── Public API ──────────────────────────────────────────────

export function getGuardianStatus() {
  return {
    version: 'V2',
    lastRunTime,
    cycleNumber,
    overallScore: lastReport?.overallScore ?? -1,
    overallStatus: lastReport?.overallStatus ?? 'unknown',
    fixHistoryCount: getRecentFixes().length,
    recentFixes: getRecentFixes(10),
    successRate: getFixSuccessRate(),
  };
}

export function getLastReport(): GuardianReport | null {
  return lastReport;
}

export function getFixHistory(): GuardianFix[] {
  return getRecentFixes(50);
}
