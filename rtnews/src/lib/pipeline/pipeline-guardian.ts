// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V1 — Unified Smart Monitor & Auto-Fixer
// ═══════════════════════════════════════════════════════════════
// Monitors ALL pipeline locales (AR, EN, FR, TR, ES) from one place.
// Auto-diagnoses WHY articles are stuck and auto-fixes common issues.
//
// KEY FEATURES:
// 1. Cross-locale health scoring (0-100 per locale)
// 2. Auto-detect: stuck stages, short content, missing analysis
// 3. Auto-fix: reset blocked articles, restart stalled orchestrators
// 4. Telegram alerts for critical failures across any locale
// 5. Unified API + Dashboard for all pipelines
//
// DIFFERENT FROM RAQEEB:
// - Raqeeb monitors pipeline throughput (articles/hour, publish rate)
// - Guardian monitors pipeline HEALTH (WHY articles fail, WHERE they're stuck)
// - Raqeeb alerts on symptoms, Guardian diagnoses root causes
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';

// ─── Types ────────────────────────────────────────────────────

type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

interface LocaleHealth {
  locale: Locale;
  score: number;          // 0-100 (100 = perfectly healthy)
  status: 'healthy' | 'degraded' | 'critical' | 'dead';
  totalBlocked: number;
  stageBreakdown: Record<string, number>;
  issues: GuardianIssue[];
  lastFix: GuardianFix | null;
  publishedToday: number;
  publishedThisHour: number;
  pendingCount: number;
  quotaRemaining: { hourly: number; daily: number };
}

interface GuardianIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  affectedCount: number;
  autoFixable: boolean;
  fixApplied?: boolean;
  fixResult?: string;
}

interface GuardianFix {
  action: string;
  locale: Locale;
  affectedCount: number;
  success: boolean;
  message: string;
  timestamp: number;
}

interface GuardianReport {
  timestamp: number;
  locales: Record<Locale, LocaleHealth>;
  overallScore: number;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  fixesApplied: GuardianFix[];
  durationMs: number;
}

// ─── In-Memory State ──────────────────────────────────────────

const fixHistory: GuardianFix[] = [];
const MAX_FIX_HISTORY = 50;
let lastReport: GuardianReport | null = null;
let lastRunTime = 0;
const MIN_RUN_INTERVAL_MS = 60 * 1000; // 1 minute between runs

// ─── Locale Config ────────────────────────────────────────────

interface LocaleConfig {
  name: string;
  nameAr: string;
  orchestratorModule: string;
  cronRoute: string;
  minContentLength: number;
  stagesToProcess: string[];
}

const LOCALE_CONFIGS: Record<Locale, LocaleConfig> = {
  ar: {
    name: 'Arabic',
    nameAr: 'العربية',
    orchestratorModule: './orchestrator',
    cronRoute: '/api/news/cron',
    minContentLength: 200,
    stagesToProcess: ['fetched', 'content_loaded', 'translated', 'analyzed', 'imaged'],
  },
  en: {
    name: 'English',
    nameAr: 'الإنجليزية',
    orchestratorModule: './en-orchestrator',
    cronRoute: '/api/news/cron-en',
    minContentLength: 80,
    stagesToProcess: ['fetched', 'content_loaded', 'analyzed', 'imaged'],
  },
  fr: {
    name: 'French',
    nameAr: 'الفرنسية',
    orchestratorModule: './fr-orchestrator',
    cronRoute: '/api/news/cron-fr',
    minContentLength: 80,
    stagesToProcess: ['fetched', 'content_loaded', 'analyzed', 'imaged'],
  },
  tr: {
    name: 'Turkish',
    nameAr: 'التركية',
    orchestratorModule: './tr-orchestrator',
    cronRoute: '/api/news/cron-tr',
    minContentLength: 80,
    stagesToProcess: ['fetched', 'content_loaded', 'analyzed', 'imaged'],
  },
  es: {
    name: 'Spanish',
    nameAr: 'الإسبانية',
    orchestratorModule: './es-orchestrator',
    cronRoute: '/api/news/cron-es',
    minContentLength: 80,
    stagesToProcess: ['fetched', 'content_loaded', 'analyzed', 'imaged'],
  },
};

// ─── Health Scoring ───────────────────────────────────────────

function computeHealthScore(
  publishedToday: number,
  publishedThisHour: number,
  totalBlocked: number,
  pendingCount: number,
  issues: GuardianIssue[],
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

  // Deduct for high pending
  if (pendingCount > 200) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function scoreToStatus(score: number): 'healthy' | 'degraded' | 'critical' | 'dead' {
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'degraded';
  if (score >= 20) return 'critical';
  return 'dead';
}

// ─── Diagnose Locale ─────────────────────────────────────────

async function diagnoseLocale(locale: Locale): Promise<LocaleHealth> {
  const issues: GuardianIssue[] = [];
  let lastFix: GuardianFix | null = null;

  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // ── Count by stage ──
    const stageResults = await db.newsItem.groupBy({
      by: ['processingStage'],
      where: { locale, isReady: false, isPublished: false },
      _count: { id: true },
    });
    const stageBreakdown: Record<string, number> = {};
    for (const row of stageResults) {
      stageBreakdown[row.processingStage || 'unknown'] = row._count.id;
    }

    // ── Total blocked ──
    const totalBlocked = await db.newsItem.count({
      where: { locale, isReady: false, isPublished: false },
    });

    // ── Published counts ──
    const visFilter = {
      locale,
      isReady: true,
      isPublished: true,
      newsType: 'live' as const,
      slug: { not: '' },
      title: { not: '' },
    };

    const [publishedToday, publishedThisHour, pendingCount] = await Promise.all([
      db.newsItem.count({ where: { ...visFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...visFilter, publishedAt: { gte: oneHourAgo } } }),
      db.newsItem.count({ where: { locale, isReady: false, isPublished: false, retryCount: { lt: 15 } } }),
    ]);

    // ── Issue 1: Articles stuck at 'analyzed' without content (classic EN blocker) ──
    const analyzedWithoutContent = await db.newsItem.count({
      where: {
        locale,
        isReady: false,
        isPublished: false,
        processingStage: 'analyzed',
        OR: [
          { content: { equals: '' } },
          { content: null },
        ],
      },
    });
    if (analyzedWithoutContent > 0) {
      issues.push({
        id: `${locale}_analyzed_no_content`,
        severity: 'critical',
        message: `${analyzedWithoutContent} articles at 'analyzed' stage with insufficient content (<${LOCALE_CONFIGS[locale].minContentLength} chars) — publisher will block them`,
        affectedCount: analyzedWithoutContent,
        autoFixable: true,
      });
    }

    // ── Issue 2: Articles stuck at 'imaged' that publisher keeps blocking ──
    const imagedBlocked = await db.newsItem.count({
      where: {
        locale,
        isReady: false,
        isPublished: false,
        processingStage: 'imaged',
        retryCount: { gte: 3 },
      },
    });
    if (imagedBlocked > 0) {
      issues.push({
        id: `${locale}_imaged_blocked`,
        severity: 'critical',
        message: `${imagedBlocked} articles at 'imaged' stage keep getting blocked by publisher (retryCount>=3) — stuck in infinite loop`,
        affectedCount: imagedBlocked,
        autoFixable: true,
      });
    }

    // ── Issue 3: High retry count articles (permanently stuck) ──
    const highRetry = stageBreakdown['skipped'] || 0;
    const highRetryCount = await db.newsItem.count({
      where: { locale, isReady: false, isPublished: false, retryCount: { gte: 15 } },
    });
    if (highRetryCount > 0) {
      issues.push({
        id: `${locale}_high_retry`,
        severity: 'warning',
        message: `${highRetryCount} articles with retryCount>=15 — permanently excluded from processing`,
        affectedCount: highRetryCount,
        autoFixable: true,
      });
    }

    // ── Issue 4: Zero publishing today ──
    if (publishedToday === 0 && totalBlocked > 0) {
      issues.push({
        id: `${locale}_zero_published_today`,
        severity: 'critical',
        message: `ZERO articles published today, but ${totalBlocked} articles are waiting — pipeline is completely stuck`,
        affectedCount: totalBlocked,
        autoFixable: true,
      });
    }

    // ── Issue 5: Articles with analysis but no content ──
    // This catches the fullContent-fallback gap
    const hasAnalysisNoContent = await db.newsItem.count({
      where: {
        locale,
        isReady: false,
        isPublished: false,
        processingStage: { in: ['analyzed', 'imaged'] },
        aiAnalysis: { not: null },
        OR: [
          { content: { equals: '' } },
          { content: null },
        ],
      },
    });
    if (hasAnalysisNoContent > 0) {
      issues.push({
        id: `${locale}_analysis_no_content`,
        severity: 'warning',
        message: `${hasAnalysisNoContent} articles have AI analysis but no content — fullContent fallback may not be working`,
        affectedCount: hasAnalysisNoContent,
        autoFixable: true,
      });
    }

    // ── Issue 6: Massive backlog ──
    if (totalBlocked > 500) {
      issues.push({
        id: `${locale}_massive_backlog`,
        severity: 'warning',
        message: `${totalBlocked} blocked articles — massive backlog. Pipeline may be under-fetching or over-processing`,
        affectedCount: totalBlocked,
        autoFixable: false,
      });
    }

    // ── Get quota ──
    let quotaRemaining = { hourly: 999, daily: 999 };
    try {
      if (locale === 'en') {
        const { getEnPipelineLimits } = await import('./en-pipeline-config');
        const limits = await getEnPipelineLimits();
        quotaRemaining = { daily: limits.maxDailyEnNews - publishedToday, hourly: limits.maxHourlyEnNews - publishedThisHour };
      } else if (locale === 'fr') {
        const { getFrPipelineLimits } = await import('./fr-pipeline-config');
        const limits = await getFrPipelineLimits();
        quotaRemaining = { daily: limits.maxDailyFrNews - publishedToday, hourly: limits.maxHourlyFrNews - publishedThisHour };
      } else if (locale === 'tr') {
        const { getTrPipelineLimits } = await import('./tr-pipeline-config');
        const limits = await getTrPipelineLimits();
        quotaRemaining = { daily: limits.maxDailyTrNews - publishedToday, hourly: limits.maxHourlyTrNews - publishedThisHour };
      } else if (locale === 'es') {
        const { getEsPipelineLimits } = await import('./es-pipeline-config');
        const limits = await getEsPipelineLimits();
        quotaRemaining = { daily: limits.maxDailyEsNews - publishedToday, hourly: limits.maxHourlyEsNews - publishedThisHour };
      } else {
        // Arabic — use hardcoded defaults (no separate limits function)
        quotaRemaining = { daily: 800 - publishedToday, hourly: 120 - publishedThisHour };
      }
    } catch {
      // Non-critical
    }

    // ── Compute score ──
    const score = computeHealthScore(publishedToday, publishedThisHour, totalBlocked, pendingCount, issues);
    const status = scoreToStatus(score);

    // ── Get last fix for this locale ──
    lastFix = fixHistory.find(f => f.locale === locale) || null;

    return {
      locale,
      score,
      status,
      totalBlocked,
      stageBreakdown,
      issues,
      lastFix,
      publishedToday,
      publishedThisHour,
      pendingCount,
      quotaRemaining,
    };
  } catch (err: unknown) {
    return {
      locale,
      score: 0,
      status: 'dead',
      totalBlocked: -1,
      stageBreakdown: {},
      issues: [{
        id: `${locale}_db_error`,
        severity: 'critical',
        message: `Database error during diagnosis: ${err instanceof Error ? err.message : String(err)}`,
        affectedCount: -1,
        autoFixable: false,
      }],
      lastFix: null,
      publishedToday: 0,
      publishedThisHour: 0,
      pendingCount: -1,
      quotaRemaining: { hourly: 0, daily: 0 },
    };
  }
}

// ─── Auto-Fix ────────────────────────────────────────────────

async function applyAutoFix(locale: Locale, issue: GuardianIssue): Promise<GuardianFix | null> {
  if (!issue.autoFixable) return null;

  const fixId = `${issue.id}_fix`;
  const now = Date.now();

  // Prevent re-fixing same issue within 5 minutes
  const recentFix = fixHistory.find(f => f.action === fixId && f.locale === locale && (now - f.timestamp) < 5 * 60 * 1000);
  if (recentFix) return null;

  try {
    // Fix: Reset articles stuck at analyzed/imaged with no content back to fetched
    if (issue.id.includes('analyzed_no_content') || issue.id.includes('imaged_blocked') || issue.id.includes('zero_published_today')) {
      const resetResult = await db.newsItem.updateMany({
        where: {
          locale,
          isReady: false,
          isPublished: false,
          processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'imaged', 'translated', 'skipped'] },
        },
        data: {
          processingStage: 'fetched',
          retryCount: 0,
          lastError: null,
        },
      });

      // Restart the orchestrator
      try {
        const config = LOCALE_CONFIGS[locale];
        if (locale === 'en') {
          const { ensureEnRunning } = await import('./en-orchestrator');
          ensureEnRunning();
        } else if (locale === 'fr') {
          const { ensureFrRunning } = await import('./fr-orchestrator');
          ensureFrRunning();
        } else if (locale === 'tr') {
          const { ensureTrRunning } = await import('./tr-orchestrator');
          ensureTrRunning();
        } else if (locale === 'es') {
          const { ensureEsRunning } = await import('./es-orchestrator');
          ensureEsRunning();
        } else if (locale === 'ar') {
          const { ensureRunning } = await import('./orchestrator');
          ensureRunning();
        }
      } catch (orchErr: unknown) {
        console.warn(`[Guardian] Orchestrator restart failed for ${locale}: ${orchErr instanceof Error ? orchErr.message : String(orchErr)}`);
      }

      const fix: GuardianFix = {
        action: fixId,
        locale,
        affectedCount: resetResult.count,
        success: true,
        message: `Reset ${resetResult.count} blocked articles to 'fetched' + restarted ${LOCALE_CONFIGS[locale].name} orchestrator`,
        timestamp: now,
      };
      fixHistory.push(fix);
      if (fixHistory.length > MAX_FIX_HISTORY) fixHistory.shift();
      return fix;
    }

    // Fix: Reset high-retry articles
    if (issue.id.includes('high_retry')) {
      const resetResult = await db.newsItem.updateMany({
        where: {
          locale,
          isReady: false,
          isPublished: false,
          retryCount: { gte: 15 },
        },
        data: {
          retryCount: 0,
          processingStage: 'fetched',
          lastError: null,
        },
      });

      const fix: GuardianFix = {
        action: fixId,
        locale,
        affectedCount: resetResult.count,
        success: true,
        message: `Reset ${resetResult.count} high-retry articles to 'fetched' with retryCount=0`,
        timestamp: now,
      };
      fixHistory.push(fix);
      if (fixHistory.length > MAX_FIX_HISTORY) fixHistory.shift();
      return fix;
    }

    // Fix: Articles with analysis but no content — try to extract fullContent
    if (issue.id.includes('analysis_no_content')) {
      // Get articles that have analysis but no content
      const articles = await db.newsItem.findMany({
        where: {
          locale,
          isReady: false,
          isPublished: false,
          processingStage: { in: ['analyzed', 'imaged'] },
          aiAnalysis: { not: null },
          OR: [{ content: { equals: '' } }, { content: null }],
        },
        select: { id: true, aiAnalysis: true },
        take: 50,
      });

      let fixed = 0;
      for (const article of articles) {
        try {
          const parsed = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
          if (parsed?.fullContent && typeof parsed.fullContent === 'string' && parsed.fullContent.length >= LOCALE_CONFIGS[locale].minContentLength) {
            // Extract fullContent and save as content
            const cleanContent = parsed.fullContent
              .replace(/\[1\]/g, '')
              .replace(/\[2\]/g, '')
              .replace(/\[3\]/g, '')
              .replace(/\[4\]/g, '')
              .replace(/\[5\]/g, '')
              .replace(/\[6\]/g, '')
              .replace(/#{1,6}\s/g, '')
              .replace(/\*\*/g, '')
              .trim();

            if (cleanContent.length >= LOCALE_CONFIGS[locale].minContentLength) {
              await db.newsItem.update({
                where: { id: article.id },
                data: {
                  content: cleanContent,
                  processingStage: 'analyzed',
                  retryCount: 0,
                },
              });
              fixed++;
            }
          }
        } catch {
          // Skip this article
        }
      }

      if (fixed > 0) {
        const fix: GuardianFix = {
          action: fixId,
          locale,
          affectedCount: fixed,
          success: true,
          message: `Extracted fullContent as content for ${fixed} articles`,
          timestamp: now,
        };
        fixHistory.push(fix);
        if (fixHistory.length > MAX_FIX_HISTORY) fixHistory.shift();
        return fix;
      }
    }
  } catch (err: unknown) {
    const fix: GuardianFix = {
      action: fixId,
      locale,
      affectedCount: 0,
      success: false,
      message: `Auto-fix failed: ${err instanceof Error ? err.message : String(err)}`,
      timestamp: now,
    };
    fixHistory.push(fix);
    if (fixHistory.length > MAX_FIX_HISTORY) fixHistory.shift();
    return fix;
  }

  return null;
}

// ─── Telegram Alert ──────────────────────────────────────────

async function sendGuardianAlert(level: 'critical' | 'warning', message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_ALERT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;

  if (!botToken || !chatId) return false;

  const icons = { critical: '🚨', warning: '⚠️' };
  const text = `${icons[level]} <b>Pipeline Guardian</b>\n\n${message}\n\n⏰ ${new Date().toISOString()}`;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ─── Main Guardian Run ───────────────────────────────────────

export async function runGuardianCycle(autoFix: boolean = true): Promise<GuardianReport> {
  const startTime = Date.now();

  // Throttle
  if (startTime - lastRunTime < MIN_RUN_INTERVAL_MS && lastReport) {
    return lastReport;
  }
  lastRunTime = startTime;

  const locales: Locale[] = ['ar', 'en', 'fr', 'tr', 'es'];
  const localeResults: Record<Locale, LocaleHealth> = {} as any;
  const fixesApplied: GuardianFix[] = [];

  // 1. Diagnose all locales
  for (const locale of locales) {
    localeResults[locale] = await diagnoseLocale(locale);
  }

  // 2. Auto-fix critical issues
  if (autoFix) {
    for (const locale of locales) {
      const health = localeResults[locale];
      for (const issue of health.issues) {
        if (issue.severity === 'critical' && issue.autoFixable) {
          const fix = await applyAutoFix(locale, issue);
          if (fix) {
            fixesApplied.push(fix);
            issue.fixApplied = true;
            issue.fixResult = fix.message;
          }
        }
      }
    }
  }

  // 3. Send Telegram alerts for critical issues (throttled to 1 per 15min)
  const criticalLocales = locales.filter(l => localeResults[l].status === 'critical' || localeResults[l].status === 'dead');
  if (criticalLocales.length > 0) {
    const alertMessage = criticalLocales.map(l => {
      const h = localeResults[l];
      return `${LOCALE_CONFIGS[l].nameAr} ${LOCALE_CONFIGS[l].name}: Score ${h.score}/100\n${h.issues.filter(i => i.severity === 'critical').map(i => `• ${i.message}`).join('\n')}`;
    }).join('\n\n');

    // Only send if no alert in last 15 minutes
    const lastAlert = fixHistory.find(f => f.action === 'guardian_alert');
    if (!lastAlert || (startTime - lastAlert.timestamp) > 15 * 60 * 1000) {
      await sendGuardianAlert('critical', alertMessage);
      fixHistory.push({
        action: 'guardian_alert',
        locale: 'ar',
        affectedCount: criticalLocales.length,
        success: true,
        message: 'Telegram alert sent',
        timestamp: startTime,
      });
    }
  }

  // 4. Compute overall score
  const scores = locales.map(l => localeResults[l].score);
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const overallStatus = overallScore >= 80 ? 'healthy' as const : overallScore >= 50 ? 'degraded' as const : 'critical' as const;

  const report: GuardianReport = {
    timestamp: startTime,
    locales: localeResults,
    overallScore,
    overallStatus,
    fixesApplied,
    durationMs: Date.now() - startTime,
  };

  lastReport = report;

  if (fixesApplied.length > 0 || criticalLocales.length > 0) {
    console.log(`[Guardian V1] Score: ${overallScore}/100 (${overallStatus}) | Fixes: ${fixesApplied.length} | Critical locales: ${criticalLocales.join(', ')} | ${Date.now() - startTime}ms`);
  }

  return report;
}

// ─── Public API ──────────────────────────────────────────────

export function getGuardianStatus(): {
  lastRunTime: number;
  overallScore: number;
  overallStatus: string;
  fixHistoryCount: number;
  recentFixes: GuardianFix[];
} {
  return {
    lastRunTime,
    overallScore: lastReport?.overallScore ?? -1,
    overallStatus: lastReport?.overallStatus ?? 'unknown',
    fixHistoryCount: fixHistory.length,
    recentFixes: fixHistory.slice(-10),
  };
}

export function getLastReport(): GuardianReport | null {
  return lastReport;
}

export function getFixHistory(): GuardianFix[] {
  return [...fixHistory];
}

export function getLocaleConfigs(): Record<Locale, { name: string; nameAr: string; cronRoute: string }> {
  const result: any = {};
  for (const [locale, config] of Object.entries(LOCALE_CONFIGS)) {
    result[locale] = { name: config.name, nameAr: config.nameAr, cronRoute: config.cronRoute };
  }
  return result;
}

export type { Locale, LocaleHealth, GuardianIssue, GuardianFix, GuardianReport };
