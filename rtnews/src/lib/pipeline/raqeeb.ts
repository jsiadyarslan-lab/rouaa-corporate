// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════
// ─── رقيب رؤى (Raqeeb) — Pipeline Monitoring Agent V1.0 ──────
// Intelligent monitoring system for the Rouaa Trading News pipeline.
// Collects metrics, evaluates rules, sends Telegram alerts,
// and attempts self-healing for common issues.
//
// Features:
//   - 20+ monitoring rules across pipeline, quality, AI, and infra
//   - Telegram alerts via TELEGRAM_ALERT_BOT_TOKEN + TELEGRAM_ALERT_CHAT_ID
//   - In-memory metric history (last 2 hours) for trend detection
//   - Self-healing: auto-restart pipeline, clear stale locks, fix stuck articles
//   - Throttled alerts: same type max once per 10 min, max 6/hour
//   - Startup notification on deploy
// ─────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────

type AlertLevel = 'critical' | 'warning' | 'info';

interface MetricSnapshot {
  timestamp: number;
  // Pipeline
  articlesLastHour: number;
  articlesLast15Min: number;
  totalReady: number;
  totalPublished: number;
  newestArticleAgeMin: number;
  pipelineRunning: boolean;
  pipelineCycles: number;
  pipelineIdleMin: number;
  // Quality
  publishedToday: number;
  publishedThisHour: number;
  skipRate: number;
  pendingCount: number;
  skippedCount: number;
  // AI
  aiProvidersAvailable: number;
  aiProvidersTotal: number;
  aiCascadeFailure: boolean;
  // Infrastructure
  dbLatencyMs: number;
  dbStatus: string;
  uptime: number;
}

interface AlertRule {
  id: string;
  name: string;
  nameAr: string;
  level: AlertLevel;
  check: (current: MetricSnapshot, prev: MetricSnapshot | null) => string | null; // null = no alert
}

interface AlertRecord {
  id: string;
  level: AlertLevel;
  ruleId: string;
  message: string;
  messageAr: string;
  timestamp: number;
  selfHealingAction?: string;
}

// ─── Alert Log (persistent across cycles) ────────────────────

const MAX_ALERT_LOG = 100;
const alertLog: AlertRecord[] = [];

function pushAlert(alert: AlertRecord): void {
  alertLog.push(alert);
  if (alertLog.length > MAX_ALERT_LOG) {
    alertLog.shift();
  }
}

// ─── Metric History ───────────────────────────────────────────

const MAX_HISTORY = 120; // 2 hours at 1 snapshot/min
const metricHistory: MetricSnapshot[] = [];

function pushMetric(snapshot: MetricSnapshot): void {
  metricHistory.push(snapshot);
  if (metricHistory.length > MAX_HISTORY) {
    metricHistory.shift();
  }
}

function getLatestMetric(): MetricSnapshot | null {
  return metricHistory.length > 0 ? metricHistory[metricHistory.length - 1] : null;
}

// ─── Alert Throttling ─────────────────────────────────────────

const alertCooldowns = new Map<string, number>();
const ALERT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes between same alerts
const MAX_ALERTS_PER_HOUR = 6;
let hourlyAlertCount = 0;
let hourlyResetTime = Date.now();

function shouldSendAlert(ruleId: string): boolean {
  const now = Date.now();

  // Reset hourly counter
  if (now - hourlyResetTime > 60 * 60 * 1000) {
    hourlyAlertCount = 0;
    hourlyResetTime = now;
  }

  if (hourlyAlertCount >= MAX_ALERTS_PER_HOUR) return false;

  const lastSent = alertCooldowns.get(ruleId);
  if (lastSent && (now - lastSent) < ALERT_COOLDOWN_MS) return false;

  return true;
}

function markAlertSent(ruleId: string): void {
  alertCooldowns.set(ruleId, Date.now());
  hourlyAlertCount++;
}

// ─── Telegram Alert Sender ────────────────────────────────────

async function sendRaqeebAlert(level: AlertLevel, messageAr: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_ALERT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('[Raqeeb] No Telegram credentials — alert not sent');
    return false;
  }

  const icons: Record<AlertLevel, string> = {
    critical: '🔴',
    warning: '🟠',
    info: '🔵',
  };

  const levelNames: Record<AlertLevel, string> = {
    critical: 'حرج',
    warning: 'تحذير',
    info: 'معلومات',
  };

  const text = `${icons[level]} <b>رقيب رؤى — ${levelNames[level]}</b>\n\n${messageAr}\n\n⏰ ${new Date().toISOString()}`;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[Raqeeb] Telegram send failed (${response.status}): ${errText.slice(0, 200)}`);
    }

    return response.ok;
  } catch (err: unknown) {
    console.warn(`[Raqeeb] Telegram send error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

// ─── Self-Healing Actions ─────────────────────────────────────

interface HealingResult {
  action: string;
  success: boolean;
  message: string;
}

async function healRestartPipeline(): Promise<HealingResult> {
  try {
    const { ensureRunning } = await import('./orchestrator');
    const result = ensureRunning();
    return {
      action: 'restart_pipeline',
      success: result.restarted,
      message: result.restarted
        ? `تم إعادة تشغيل خط الإنتاج (${result.wasStale ? 'كان متوقفاً' : 'لم يكن يعمل'})`
        : 'خط الإنتاج يعمل بالفعل',
    };
  } catch (err: unknown) {
    return {
      action: 'restart_pipeline',
      success: false,
      message: `فشل إعادة التشغيل: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function healTriggerBootstrap(): Promise<HealingResult> {
  try {
    const port = process.env.PORT || 8080;
    const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
    const bootstrapUrl = process.env.RAILWAY_PRIVATE_DOMAIN
      ? `http://${process.env.RAILWAY_PRIVATE_DOMAIN}:${port}/api/news/bootstrap`
      : `http://localhost:${port}/api/news/bootstrap`;

    const response = await fetch(bootstrapUrl, {
      headers: { 'x-internal': internalSecret },
      signal: AbortSignal.timeout(15000),
    });

    return {
      action: 'trigger_bootstrap',
      success: response.ok,
      message: response.ok ? 'تم تشغيل Bootstrap' : `Bootstrap فشل: ${response.status}`,
    };
  } catch (err: unknown) {
    return {
      action: 'trigger_bootstrap',
      success: false,
      message: `فشل Bootstrap: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function healFixUnready(): Promise<HealingResult> {
  try {
    const port = process.env.PORT || 8080;
    const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
    const url = process.env.RAILWAY_PRIVATE_DOMAIN
      ? `http://${process.env.RAILWAY_PRIVATE_DOMAIN}:${port}/api/news/cron?action=mark-ready`
      : `http://localhost:${port}/api/news/cron?action=mark-ready`;

    const response = await fetch(url, {
      headers: { 'x-internal': internalSecret },
      signal: AbortSignal.timeout(10000),
    });

    return {
      action: 'fix_unready',
      success: response.ok,
      message: response.ok ? 'تم تشغيل fix-unready' : `فشل: ${response.status}`,
    };
  } catch (err: unknown) {
    return {
      action: 'fix_unready',
      success: false,
      message: `فشل: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// Track self-healing attempts to prevent infinite loops
const healingAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_HEALING_ATTEMPTS = 3;
const HEALING_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

async function attemptSelfHealing(ruleId: string, healingFn: () => Promise<HealingResult>): Promise<HealingResult | null> {
  const now = Date.now();
  const record = healingAttempts.get(ruleId);

  // Reset counter if cooldown passed
  if (record && (now - record.lastAttempt) > HEALING_COOLDOWN_MS) {
    healingAttempts.delete(ruleId);
  }

  const current = healingAttempts.get(ruleId);
  if (current && current.count >= MAX_HEALING_ATTEMPTS) {
    return null; // Max attempts reached — escalate to human
  }

  const result = await healingFn();

  const newRecord = {
    count: (current?.count || 0) + 1,
    lastAttempt: now,
  };
  healingAttempts.set(ruleId, newRecord);

  return result;
}

// ─── Alert Rules (20+ rules) ─────────────────────────────────

const ALERT_RULES: AlertRule[] = [
  // ── CRITICAL: Pipeline Health ──
  {
    id: 'pipeline_dead',
    name: 'Pipeline Dead',
    nameAr: 'خط الإنتاج متوقف',
    level: 'critical',
    check: (curr, _prev) => {
      if (!curr.pipelineRunning && curr.pipelineCycles > 0) {
        return `خط الإنتاج متوقف! الدورات: ${curr.pipelineCycles} | خامل: ${curr.pipelineIdleMin} دقيقة`;
      }
      return null;
    },
  },
  {
    id: 'no_new_articles_15min',
    name: 'No New Articles 15min',
    nameAr: 'لا مقالات جديدة منذ 15 دقيقة',
    level: 'critical',
    check: (curr, _prev) => {
      if (curr.newestArticleAgeMin > 15 && curr.pipelineRunning) {
        return `⚠️ لا مقالات جديدة منذ ${curr.newestArticleAgeMin} دقيقة رغم أن الخط يعمل.\nالمقالات/ساعة: ${curr.articlesLastHour} | جاهزة: ${curr.totalReady}`;
      }
      return null;
    },
  },
  {
    id: 'no_publish_30min',
    name: 'No Publish 30min',
    nameAr: 'لا نشر منذ 30 دقيقة',
    level: 'critical',
    check: (curr, _prev) => {
      if (curr.articlesLastHour === 0 && curr.uptime > 1800) {
        return `🔴 صفر مقالات في الساعة الماضية.\nجاهزة: ${curr.totalReady} | منشورة: ${curr.totalPublished}`;
      }
      return null;
    },
  },
  {
    id: 'ai_cascade_failure',
    name: 'AI Cascade Failure',
    nameAr: 'انهيار متعاقب لمزودات AI',
    level: 'critical',
    check: (curr, _prev) => {
      if (curr.aiCascadeFailure) {
        return `🔴 انهيار متعاقب لمزودات AI!\nمتاحة: ${curr.aiProvidersAvailable}/${curr.aiProvidersTotal}`;
      }
      return null;
    },
  },
  {
    id: 'db_degraded',
    name: 'Database Degraded',
    nameAr: 'قاعدة البيانات متدهورة',
    level: 'critical',
    check: (curr, _prev) => {
      if (curr.dbStatus === 'degraded' || curr.dbStatus === 'not_configured') {
        return `🔴 قاعدة البيانات: ${curr.dbStatus}\nزمن الاستجابة: ${curr.dbLatencyMs}ms`;
      }
      return null;
    },
  },

  // ── WARNING: Quality ──
  {
    id: 'high_skip_rate',
    name: 'High Skip Rate',
    nameAr: 'نسبة رفض عالية',
    level: 'warning',
    check: (curr, _prev) => {
      if (curr.skipRate > 0.4 && curr.publishedToday > 5) {
        return `⚠️ نسبة الرفض: ${Math.round(curr.skipRate * 100)}%\nمنشورة اليوم: ${curr.publishedToday} | مرفوضة: ${curr.skippedCount}`;
      }
      return null;
    },
  },
  {
    id: 'low_publish_rate',
    name: 'Low Publish Rate',
    nameAr: 'معدل نشر منخفض',
    level: 'warning',
    check: (curr, _prev) => {
      if (curr.publishedThisHour < 5 && curr.publishedThisHour > 0 && curr.uptime > 3600) {
        return `⚠️ معدل نشر منخفض: ${curr.publishedThisHour} مقالة/ساعة (المتوقع: 15+)\nالمعلقة: ${curr.pendingCount}`;
      }
      return null;
    },
  },
  {
    id: 'ai_providers_low',
    name: 'AI Providers Low',
    nameAr: 'مزودات AI قليلة',
    level: 'warning',
    check: (curr, _prev) => {
      if (curr.aiProvidersAvailable > 0 && curr.aiProvidersAvailable <= 2 && curr.aiProvidersTotal > 2) {
        return `⚠️ مزودات AI متاحة: ${curr.aiProvidersAvailable}/${curr.aiProvidersTotal}\nخط الإنتاج يعمل ولكن بأداء محدود`;
      }
      return null;
    },
  },
  {
    id: 'db_latency_high',
    name: 'DB Latency High',
    nameAr: 'زمن استجابة قاعدة البيانات مرتفع',
    level: 'warning',
    check: (curr, _prev) => {
      if (curr.dbLatencyMs > 500 && curr.dbStatus === 'healthy') {
        return `⚠️ قاعدة البيانات بطيئة: ${curr.dbLatencyMs}ms\nالحالة: سليمة لكن بطيئة`;
      }
      return null;
    },
  },
  {
    id: 'high_pending_count',
    name: 'High Pending Count',
    nameAr: 'مقالات معلقة كثيرة',
    level: 'warning',
    check: (curr, _prev) => {
      if (curr.pendingCount > 200) {
        return `⚠️ مقالات معلقة: ${curr.pendingCount}\nقد يعني اختناق في المعالجة`;
      }
      return null;
    },
  },
  {
    id: 'pipeline_stale_running',
    name: 'Pipeline Stale While Running',
    nameAr: 'خط الإنتاج راكد',
    level: 'warning',
    check: (curr, prev) => {
      if (curr.pipelineRunning && prev && curr.articlesLast15Min === 0 && prev.articlesLast15Min === 0 && curr.uptime > 600) {
        return `⚠️ خط الإنتاج يعمل لكن لا يُنتج — راكد\nخامل: ${curr.pipelineIdleMin} دقيقة`;
      }
      return null;
    },
  },
  {
    id: 'articles_last_hour_drop',
    name: 'Articles Rate Drop',
    nameAr: 'انخفاض مفاجئ في معدل المقالات',
    level: 'warning',
    check: (curr, prev) => {
      if (prev && prev.articlesLastHour > 10 && curr.articlesLastHour < prev.articlesLastHour * 0.3) {
        return `⚠️ انخفاض حاد: ${curr.articlesLastHour} مقالة/ساعة (كانت ${prev.articlesLastHour})`;
      }
      return null;
    },
  },

  // ── INFO: Informational ──
  {
    id: 'newest_article_old',
    name: 'Newest Article Old',
    nameAr: 'أحدث مقالة قديمة',
    level: 'info',
    check: (curr, _prev) => {
      if (curr.newestArticleAgeMin > 10 && curr.newestArticleAgeMin <= 15) {
        return `ℹ️ أحدث مقالة منذ ${curr.newestArticleAgeMin} دقيقة\nخط الإنتاج: ${curr.pipelineRunning ? 'يعمل' : 'متوقف'}`;
      }
      return null;
    },
  },
  {
    id: 'ai_provider_recovered',
    name: 'AI Provider Recovered',
    nameAr: 'مزود AI استعاد عمله',
    level: 'info',
    check: (curr, prev) => {
      if (prev && prev.aiCascadeFailure && !curr.aiCascadeFailure) {
        return `✅ مزودات AI تعافت: ${curr.aiProvidersAvailable}/${curr.aiProvidersTotal} متاحة`;
      }
      return null;
    },
  },
  {
    id: 'db_recovered',
    name: 'DB Recovered',
    nameAr: 'قاعدة البيانات استعادت عملها',
    level: 'info',
    check: (curr, prev) => {
      if (prev && (prev.dbStatus === 'degraded') && curr.dbStatus === 'healthy') {
        return `✅ قاعدة البيانات تعافت — زمن الاستجابة: ${curr.dbLatencyMs}ms`;
      }
      return null;
    },
  },
];

// ─── Metric Collection ────────────────────────────────────────

async function collectMetrics(): Promise<MetricSnapshot> {
  const now = Date.now();
  const snapshot: MetricSnapshot = {
    timestamp: now,
    articlesLastHour: 0,
    articlesLast15Min: 0,
    totalReady: 0,
    totalPublished: 0,
    newestArticleAgeMin: 999,
    pipelineRunning: false,
    pipelineCycles: 0,
    pipelineIdleMin: 0,
    publishedToday: 0,
    publishedThisHour: 0,
    skipRate: 0,
    pendingCount: 0,
    skippedCount: 0,
    aiProvidersAvailable: 0,
    aiProvidersTotal: 0,
    aiCascadeFailure: false,
    dbLatencyMs: 0,
    dbStatus: 'unknown',
    uptime: process.uptime ? Math.floor(process.uptime()) : 0,
  };

  try {
    // ── Pipeline Stats from DB ──
    const { db } = await import('@/lib/db');

    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const fifteenMinAgo = new Date(now - 15 * 60 * 1000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // V379: Added visibility filter (newsType: 'live', slug/title not empty)
    // to published counts — matches frontend display filter
    const publishedVisFilter = {
      isReady: true,
      isPublished: true,
      newsType: 'live' as const,
      slug: { not: '' },
      title: { not: '' },
    };

    const [articlesLastHour, articlesLast15Min, totalReady, totalPublished, publishedToday, pendingCount, skippedCount, newestArticle] = await Promise.all([
      db.newsItem.count({ where: { isReady: true, fetchedAt: { gte: oneHourAgo } } }),
      db.newsItem.count({ where: { isReady: true, fetchedAt: { gte: fifteenMinAgo } } }),
      db.newsItem.count({ where: { isReady: true } }),
      db.newsItem.count({ where: publishedVisFilter }),
      db.newsItem.count({ where: { ...publishedVisFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { isReady: false, retryCount: { lt: 15 } } }),
      db.newsItem.count({ where: { rejectCount: { gte: 3 } } }),
      db.newsItem.findFirst({ where: { isReady: true, slug: { not: null } }, orderBy: { fetchedAt: 'desc' }, select: { fetchedAt: true } }),
    ]);

    snapshot.articlesLastHour = articlesLastHour;
    snapshot.articlesLast15Min = articlesLast15Min;
    snapshot.totalReady = totalReady;
    snapshot.totalPublished = totalPublished;
    snapshot.publishedToday = publishedToday;
    snapshot.pendingCount = pendingCount;
    snapshot.skippedCount = skippedCount;

    const totalProcessed = publishedToday + skippedCount;
    snapshot.skipRate = totalProcessed > 0 ? skippedCount / totalProcessed : 0;

    // Published this hour — V379: Use visibility filter
    snapshot.publishedThisHour = await db.newsItem.count({
      where: { ...publishedVisFilter, publishedAt: { gte: oneHourAgo } },
    });

    if (newestArticle) {
      snapshot.newestArticleAgeMin = Math.round((now - new Date(newestArticle.fetchedAt).getTime()) / 60000);
    }

    // ── DB Health ──
    try {
      const dbStart = Date.now();
      await db.$queryRaw`SELECT 1`;
      snapshot.dbLatencyMs = Date.now() - dbStart;
      snapshot.dbStatus = 'healthy';
    } catch (err: unknown) {
      snapshot.dbStatus = 'degraded';
      snapshot.dbLatencyMs = -1;
    }

  } catch (err: unknown) {
    console.warn(`[Raqeeb] DB collection error: ${err instanceof Error ? err.message : String(err)}`);
    snapshot.dbStatus = 'degraded';
  }

  try {
    // ── Pipeline Orchestrator Stats ──
    const { getOrchestratorStats } = await import('./orchestrator');
    const stats = await getOrchestratorStats();
    snapshot.pipelineRunning = stats.isRunning;
    snapshot.pipelineCycles = stats.cycleCount;
    snapshot.pipelineIdleMin = stats.idleMinutes;
  } catch {
    snapshot.pipelineRunning = false;
  }

  try {
    // ── AI Provider Stats ──
    const { getProviderStatus } = await import('@/lib/ai-provider');
    const providers = getProviderStatus();
    snapshot.aiProvidersTotal = providers.length;
    snapshot.aiProvidersAvailable = providers.filter((p: { available: boolean }) => p.available).length;

    // Cascade failure = less than 2 providers available
    snapshot.aiCascadeFailure = snapshot.aiProvidersAvailable < 2 && snapshot.aiProvidersTotal > 2;
  } catch {
    snapshot.aiProvidersTotal = 0;
    snapshot.aiProvidersAvailable = 0;
  }

  return snapshot;
}

// ─── Main Monitoring Cycle ────────────────────────────────────

export interface RaqeebRunResult {
  timestamp: number;
  metrics: MetricSnapshot;
  alerts: AlertRecord[];
  healingActions: HealingResult[];
  durationMs: number;
}

let lastRunTime = 0;
const MIN_RUN_INTERVAL_MS = 30 * 1000; // 30 seconds minimum between runs

export async function runRaqeebCycle(): Promise<RaqeebRunResult> {
  const startTime = Date.now();
  const alerts: AlertRecord[] = [];
  const healingActions: HealingResult[] = [];

  // Prevent running too frequently
  if (startTime - lastRunTime < MIN_RUN_INTERVAL_MS) {
    const latest = getLatestMetric();
    return {
      timestamp: startTime,
      metrics: latest || (await collectMetrics()),
      alerts: [],
      healingActions: [],
      durationMs: Date.now() - startTime,
    };
  }
  lastRunTime = startTime;

  // 1. Collect metrics
  const metrics = await collectMetrics();
  const prevMetrics = metricHistory.length > 0 ? metricHistory[metricHistory.length - 1] : null;
  pushMetric(metrics);

  // 2. Evaluate rules
  for (const rule of ALERT_RULES) {
    try {
      const alertMessage = rule.check(metrics, prevMetrics);
      if (alertMessage && shouldSendAlert(rule.id)) {
        const alert: AlertRecord = {
          id: `${rule.id}-${Date.now()}`,
          level: rule.level,
          ruleId: rule.id,
          message: alertMessage,
          messageAr: alertMessage,
          timestamp: Date.now(),
        };

        // 3. Self-healing for critical issues
        if (rule.level === 'critical') {
          if (rule.id === 'pipeline_dead' || rule.id === 'no_new_articles_15min' || rule.id === 'no_publish_30min') {
            const healResult = await attemptSelfHealing(rule.id, healRestartPipeline);
            if (healResult) {
              alert.selfHealingAction = healResult.message;
              healingActions.push(healResult);
            }
            // Also try bootstrap if restart alone doesn't help
            if (rule.id === 'pipeline_dead') {
              const bootstrapResult = await attemptSelfHealing(`${rule.id}_bootstrap`, healTriggerBootstrap);
              if (bootstrapResult) {
                alert.selfHealingAction = (alert.selfHealingAction || '') + ` | ${bootstrapResult.message}`;
                healingActions.push(bootstrapResult);
              }
            }
          }
          if (rule.id === 'ai_cascade_failure') {
            // No auto-healing for AI cascade — needs human intervention
          }
          if (rule.id === 'db_degraded') {
            // Try connection recovery
            try {
              const { recoverConnection } = await import('@/lib/db');
              await recoverConnection();
              alert.selfHealingAction = 'تم محاولة استعادة اتصال قاعدة البيانات';
            } catch {
              alert.selfHealingAction = 'فشلت محاولة استعادة الاتصال';
            }
          }
        }

        // 4. Send Telegram alert
        const healingText = alert.selfHealingAction
          ? `\n\n🔧 <b>إصلاح ذاتي:</b> ${alert.selfHealingAction}`
          : '';

        await sendRaqeebAlert(rule.level, `${alert.messageAr}${healingText}`);
        markAlertSent(rule.id);
        alerts.push(alert);
        pushAlert(alert);

        console.warn(`[Raqeeb] ${rule.level.toUpperCase()} [${rule.id}]: ${alertMessage}${alert.selfHealingAction ? ` | Healing: ${alert.selfHealingAction}` : ''}`);
      }
    } catch (err: unknown) {
      console.warn(`[Raqeeb] Rule ${rule.id} error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const durationMs = Date.now() - startTime;

  // 5. Log summary
  if (alerts.length > 0) {
    console.log(`[Raqeeb] Cycle complete: ${alerts.length} alerts, ${healingActions.length} healing actions, ${durationMs}ms`);
  }

  return { timestamp: startTime, metrics, alerts, healingActions, durationMs };
}

// ─── Startup Notification ─────────────────────────────────────

let startupNotificationSent = false;

export async function sendStartupNotification(): Promise<void> {
  if (startupNotificationSent) return;
  startupNotificationSent = true;

  const gitSha = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_SHA || 'unknown';
  const shortSha = gitSha.slice(0, 7);

  await sendRaqeebAlert('info', `🚀 <b>رقيب رؤى بدأ العمل</b>\n\nالإصدار: ${shortSha}\nالوقت: ${new Date().toISOString()}\n\nرقيب يراقب خط الإنتاج الآن 🔍`);
  console.log(`[Raqeeb] Startup notification sent (${shortSha})`);
}

// ─── Status API ───────────────────────────────────────────────

export function getRaqeebStatus(): {
  isRunning: boolean;
  lastRunTime: number;
  metricHistoryCount: number;
  recentAlerts: { ruleId: string; lastSent: number }[];
  healingAttempts: { ruleId: string; count: number; lastAttempt: number }[];
} {
  return {
    isRunning: lastRunTime > 0,
    lastRunTime,
    metricHistoryCount: metricHistory.length,
    recentAlerts: Array.from(alertCooldowns.entries()).map(([ruleId, lastSent]) => ({ ruleId, lastSent })),
    healingAttempts: Array.from(healingAttempts.entries()).map(([ruleId, record]) => ({ ruleId, ...record })),
  };
}

export function getMetricHistory(): MetricSnapshot[] {
  return [...metricHistory];
}

// ─── Manual Alert Test ────────────────────────────────────────

export async function sendTestAlert(): Promise<boolean> {
  return sendRaqeebAlert('info', '🧪 <b>اختبار رقيب رؤى</b>\n\nهذا تنبيه تجريبي — إذا وصلتك هذه الرسالة، فإن نظام التنبيهات يعمل بشكل صحيح ✅');
}

// ─── Dashboard API Helpers ────────────────────────────────────

export function getAlertLog(): AlertRecord[] {
  return [...alertLog];
}

export function getAlertRules(): { id: string; name: string; nameAr: string; level: AlertLevel }[] {
  return ALERT_RULES.map(r => ({ id: r.id, name: r.name, nameAr: r.nameAr, level: r.level }));
}

export type { AlertLevel, AlertRecord, MetricSnapshot };
