// ═══════════════════════════════════════════════════════════════
// English Raqeeb — Pipeline Monitoring Agent for English Pipeline
// English version of raqeeb.ts with all alert messages in English.
// Same alert rules, same self-healing actions, same throttling.
// Only difference: all alert text, level names, and healing
// messages are in English.
//
// This is an ADDITIVE file — the Arabic raqeeb.ts is completely
// untouched.
// ═══════════════════════════════════════════════════════════════

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
  level: AlertLevel;
  check: (current: MetricSnapshot, prev: MetricSnapshot | null) => string | null; // null = no alert
}

interface AlertRecord {
  id: string;
  level: AlertLevel;
  ruleId: string;
  message: string;
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

// ─── Telegram Alert Sender (English) ─────────────────────────

async function sendRaqeebEnAlert(level: AlertLevel, message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_ALERT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('[RaqeebEn] No Telegram credentials — alert not sent');
    return false;
  }

  const icons: Record<AlertLevel, string> = {
    critical: '🔴',
    warning: '🟠',
    info: '🔵',
  };

  const levelNames: Record<AlertLevel, string> = {
    critical: 'Critical',
    warning: 'Warning',
    info: 'Info',
  };

  const text = `${icons[level]} <b>Raqeeb EN — ${levelNames[level]}</b>\n\n${message}\n\n⏰ ${new Date().toISOString()}`;

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
      console.warn(`[RaqeebEn] Telegram send failed (${response.status}): ${errText.slice(0, 200)}`);
    }

    return response.ok;
  } catch (err: unknown) {
    console.warn(`[RaqeebEn] Telegram send error: ${err instanceof Error ? err.message : String(err)}`);
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
    // V318: Fix — import from EN orchestrator, NOT Arabic orchestrator
    const { ensureEnRunning } = await import('./en-orchestrator');
    const result = ensureEnRunning();
    return {
      action: 'restart_en_pipeline',
      success: result.restarted,
      message: result.restarted
        ? `English pipeline restarted (${result.wasStale ? 'was stale' : 'was not running'})`
        : 'English pipeline is already running',
    };
  } catch (err: unknown) {
    return {
      action: 'restart_pipeline',
      success: false,
      message: `Restart failed: ${err instanceof Error ? err.message : String(err)}`,
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
      message: response.ok ? 'Bootstrap triggered successfully' : `Bootstrap failed: ${response.status}`,
    };
  } catch (err: unknown) {
    return {
      action: 'trigger_bootstrap',
      success: false,
      message: `Bootstrap failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function healFixUnreadyEn(): Promise<HealingResult> {
  try {
    const port = process.env.PORT || 8080;
    const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
    const url = process.env.RAILWAY_PRIVATE_DOMAIN
      ? `http://${process.env.RAILWAY_PRIVATE_DOMAIN}:${port}/api/news/cron-en?action=mark-ready`
      : `http://localhost:${port}/api/news/cron-en?action=mark-ready`;

    const response = await fetch(url, {
      headers: { 'x-internal': internalSecret },
      signal: AbortSignal.timeout(10000),
    });

    return {
      action: 'fix_unready_en',
      success: response.ok,
      message: response.ok ? 'English fix-unready triggered' : `Failed: ${response.status}`,
    };
  } catch (err: unknown) {
    return {
      action: 'fix_unready_en',
      success: false,
      message: `Failed: ${err instanceof Error ? err.message : String(err)}`,
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

// ─── Alert Rules (English messages) ──────────────────────────

const ALERT_RULES_EN: AlertRule[] = [
  // ── CRITICAL: Pipeline Health ──
  {
    id: 'pipeline_dead_en',
    name: 'Pipeline Dead (EN)',
    level: 'critical',
    check: (curr, _prev) => {
      if (!curr.pipelineRunning && curr.pipelineCycles > 0) {
        return `English pipeline is DEAD! Cycles: ${curr.pipelineCycles} | Idle: ${curr.pipelineIdleMin} minutes`;
      }
      return null;
    },
  },
  {
    id: 'no_new_articles_15min_en',
    name: 'No New Articles 15min (EN)',
    level: 'critical',
    check: (curr, _prev) => {
      if (curr.newestArticleAgeMin > 15 && curr.pipelineRunning) {
        return `⚠️ No new articles for ${curr.newestArticleAgeMin} minutes despite pipeline running.\nArticles/hour: ${curr.articlesLastHour} | Ready: ${curr.totalReady}`;
      }
      return null;
    },
  },
  {
    id: 'no_publish_30min_en',
    name: 'No Publish 30min (EN)',
    level: 'critical',
    check: (curr, _prev) => {
      if (curr.articlesLastHour === 0 && curr.uptime > 1800) {
        return `🔴 Zero articles in the past hour.\nReady: ${curr.totalReady} | Published: ${curr.totalPublished}`;
      }
      return null;
    },
  },
  {
    id: 'ai_cascade_failure_en',
    name: 'AI Cascade Failure (EN)',
    level: 'critical',
    check: (curr, _prev) => {
      if (curr.aiCascadeFailure) {
        return `🔴 AI provider cascade failure!\nAvailable: ${curr.aiProvidersAvailable}/${curr.aiProvidersTotal}`;
      }
      return null;
    },
  },
  {
    id: 'db_degraded_en',
    name: 'Database Degraded (EN)',
    level: 'critical',
    check: (curr, _prev) => {
      if (curr.dbStatus === 'degraded' || curr.dbStatus === 'not_configured') {
        return `🔴 Database status: ${curr.dbStatus}\nLatency: ${curr.dbLatencyMs}ms`;
      }
      return null;
    },
  },

  // ── WARNING: Quality ──
  {
    id: 'high_skip_rate_en',
    name: 'High Skip Rate (EN)',
    level: 'warning',
    check: (curr, _prev) => {
      if (curr.skipRate > 0.4 && curr.publishedToday > 5) {
        return `⚠️ Skip rate: ${Math.round(curr.skipRate * 100)}%\nPublished today: ${curr.publishedToday} | Skipped: ${curr.skippedCount}`;
      }
      return null;
    },
  },
  {
    id: 'low_publish_rate_en',
    name: 'Low Publish Rate (EN)',
    level: 'warning',
    check: (curr, _prev) => {
      if (curr.publishedThisHour < 5 && curr.publishedThisHour > 0 && curr.uptime > 3600) {
        return `⚠️ Low publish rate: ${curr.publishedThisHour} articles/hour (expected: 15+)\nPending: ${curr.pendingCount}`;
      }
      return null;
    },
  },
  {
    id: 'ai_providers_low_en',
    name: 'AI Providers Low (EN)',
    level: 'warning',
    check: (curr, _prev) => {
      if (curr.aiProvidersAvailable > 0 && curr.aiProvidersAvailable <= 2 && curr.aiProvidersTotal > 2) {
        return `⚠️ AI providers available: ${curr.aiProvidersAvailable}/${curr.aiProvidersTotal}\nPipeline running but with limited capacity`;
      }
      return null;
    },
  },
  {
    id: 'db_latency_high_en',
    name: 'DB Latency High (EN)',
    level: 'warning',
    check: (curr, _prev) => {
      if (curr.dbLatencyMs > 500 && curr.dbStatus === 'healthy') {
        return `⚠️ Database slow: ${curr.dbLatencyMs}ms\nStatus: healthy but slow`;
      }
      return null;
    },
  },
  {
    id: 'high_pending_count_en',
    name: 'High Pending Count (EN)',
    level: 'warning',
    check: (curr, _prev) => {
      if (curr.pendingCount > 200) {
        return `⚠️ Pending articles: ${curr.pendingCount}\nPossible processing bottleneck`;
      }
      return null;
    },
  },
  {
    id: 'pipeline_stale_running_en',
    name: 'Pipeline Stale While Running (EN)',
    level: 'warning',
    check: (curr, prev) => {
      if (curr.pipelineRunning && prev && curr.articlesLast15Min === 0 && prev.articlesLast15Min === 0 && curr.uptime > 600) {
        return `⚠️ Pipeline running but not producing — stale\nIdle: ${curr.pipelineIdleMin} minutes`;
      }
      return null;
    },
  },
  {
    id: 'articles_last_hour_drop_en',
    name: 'Articles Rate Drop (EN)',
    level: 'warning',
    check: (curr, prev) => {
      if (prev && prev.articlesLastHour > 10 && curr.articlesLastHour < prev.articlesLastHour * 0.3) {
        return `⚠️ Sharp drop: ${curr.articlesLastHour} articles/hour (was ${prev.articlesLastHour})`;
      }
      return null;
    },
  },

  // ── INFO: Informational ──
  {
    id: 'newest_article_old_en',
    name: 'Newest Article Old (EN)',
    level: 'info',
    check: (curr, _prev) => {
      if (curr.newestArticleAgeMin > 10 && curr.newestArticleAgeMin <= 15) {
        return `ℹ️ Newest article is ${curr.newestArticleAgeMin} minutes old\nPipeline: ${curr.pipelineRunning ? 'running' : 'stopped'}`;
      }
      return null;
    },
  },
  {
    id: 'ai_provider_recovered_en',
    name: 'AI Provider Recovered (EN)',
    level: 'info',
    check: (curr, prev) => {
      if (prev && prev.aiCascadeFailure && !curr.aiCascadeFailure) {
        return `✅ AI providers recovered: ${curr.aiProvidersAvailable}/${curr.aiProvidersTotal} available`;
      }
      return null;
    },
  },
  {
    id: 'db_recovered_en',
    name: 'DB Recovered (EN)',
    level: 'info',
    check: (curr, prev) => {
      if (prev && (prev.dbStatus === 'degraded') && curr.dbStatus === 'healthy') {
        return `✅ Database recovered — latency: ${curr.dbLatencyMs}ms`;
      }
      return null;
    },
  },
];

// ─── Metric Collection ────────────────────────────────────────

async function collectMetricsEn(): Promise<MetricSnapshot> {
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
    // ── Pipeline Stats from DB (English articles only) ──
    const { db } = await import('@/lib/db');

    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const fifteenMinAgo = new Date(now - 15 * 60 * 1000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Filter for English locale articles
    const enFilter = { locale: 'en' };

    // V379: Visibility filter for published counts — matches frontend
    const enPublishedFilter = { ...enFilter, isReady: true, isPublished: true, newsType: 'live' as const, slug: { not: '' }, title: { not: '' } };

    const [articlesLastHour, articlesLast15Min, totalReady, totalPublished, publishedToday, pendingCount, skippedCount, newestArticle] = await Promise.all([
      db.newsItem.count({ where: { ...enFilter, isReady: true, fetchedAt: { gte: oneHourAgo } } }),
      db.newsItem.count({ where: { ...enFilter, isReady: true, fetchedAt: { gte: fifteenMinAgo } } }),
      db.newsItem.count({ where: { ...enFilter, isReady: true } }),
      db.newsItem.count({ where: enPublishedFilter }),
      db.newsItem.count({ where: { ...enPublishedFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...enFilter, isReady: false, retryCount: { lt: 15 } } }),
      db.newsItem.count({ where: { ...enFilter, rejectCount: { gte: 3 } } }),
      db.newsItem.findFirst({ where: { ...enFilter, isReady: true, slug: { not: null } }, orderBy: { fetchedAt: 'desc' }, select: { fetchedAt: true } }),
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
      where: { ...enPublishedFilter, publishedAt: { gte: oneHourAgo } },
    });

    if (newestArticle) {
      snapshot.newestArticleAgeMin = Math.round((now - new Date(newestArticle.fetchedAt).getTime()) / 60000);
    }

    // ── DB Health ──
    try {
      const dbStart = Date.now();
      const { pingDB } = await import('@/lib/db');
      const dbOk = await pingDB();
      if (dbOk) {
        snapshot.dbLatencyMs = Date.now() - dbStart;
        snapshot.dbStatus = 'healthy';
      } else {
        // V322: If ping fails, try recovery
        const { recoverConnection } = await import('@/lib/db');
        const recovered = await recoverConnection();
        if (recovered) {
          const rePingStart = Date.now();
          const reOk = await pingDB();
          snapshot.dbLatencyMs = reOk ? (Date.now() - rePingStart) : -1;
          snapshot.dbStatus = reOk ? 'healthy' : 'degraded';
        } else {
          snapshot.dbStatus = 'degraded';
          snapshot.dbLatencyMs = -1;
        }
      }
    } catch (err: unknown) {
      snapshot.dbStatus = 'degraded';
      snapshot.dbLatencyMs = -1;
    }

  } catch (err: unknown) {
    console.warn(`[RaqeebEn] DB collection error: ${err instanceof Error ? err.message : String(err)}`);
    snapshot.dbStatus = 'degraded';
  }

  try {
    // ── Pipeline Orchestrator Stats (shared with Arabic) ──
    // V318: Fix — import EN orchestrator stats, NOT Arabic
    const { getEnOrchestratorStats } = await import('./en-orchestrator');
    const stats = await getEnOrchestratorStats();
    snapshot.pipelineRunning = stats.isRunning;
    snapshot.pipelineCycles = stats.cycleCount;
    snapshot.pipelineIdleMin = stats.idleMinutes || 0;
  } catch {
    snapshot.pipelineRunning = false;
  }

  try {
    // ── AI Provider Stats (shared with Arabic) ──
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

export interface RaqeebEnRunResult {
  timestamp: number;
  metrics: MetricSnapshot;
  alerts: AlertRecord[];
  healingActions: HealingResult[];
  durationMs: number;
}

let lastRunTime = 0;
const MIN_RUN_INTERVAL_MS = 30 * 1000; // 30 seconds minimum between runs

export async function runRaqeebEnCycle(): Promise<RaqeebEnRunResult> {
  const startTime = Date.now();
  const alerts: AlertRecord[] = [];
  const healingActions: HealingResult[] = [];

  // Prevent running too frequently
  if (startTime - lastRunTime < MIN_RUN_INTERVAL_MS) {
    const latest = getLatestMetric();
    return {
      timestamp: startTime,
      metrics: latest || (await collectMetricsEn()),
      alerts: [],
      healingActions: [],
      durationMs: Date.now() - startTime,
    };
  }
  lastRunTime = startTime;

  // 1. Collect metrics (English-specific)
  const metrics = await collectMetricsEn();
  const prevMetrics = metricHistory.length > 0 ? metricHistory[metricHistory.length - 1] : null;
  pushMetric(metrics);

  // 2. Evaluate rules
  for (const rule of ALERT_RULES_EN) {
    try {
      const alertMessage = rule.check(metrics, prevMetrics);
      if (alertMessage && shouldSendAlert(rule.id)) {
        const alert: AlertRecord = {
          id: `${rule.id}-${Date.now()}`,
          level: rule.level,
          ruleId: rule.id,
          message: alertMessage,
          timestamp: Date.now(),
        };

        // 3. Self-healing for critical issues
        if (rule.level === 'critical') {
          if (rule.id === 'pipeline_dead_en' || rule.id === 'no_new_articles_15min_en' || rule.id === 'no_publish_30min_en') {
            const healResult = await attemptSelfHealing(rule.id, healRestartPipeline);
            if (healResult) {
              alert.selfHealingAction = healResult.message;
              healingActions.push(healResult);
            }
            // Also try bootstrap if restart alone doesn't help
            if (rule.id === 'pipeline_dead_en') {
              const bootstrapResult = await attemptSelfHealing(`${rule.id}_bootstrap`, healTriggerBootstrap);
              if (bootstrapResult) {
                alert.selfHealingAction = (alert.selfHealingAction || '') + ` | ${bootstrapResult.message}`;
                healingActions.push(bootstrapResult);
              }
            }
          }
          if (rule.id === 'ai_cascade_failure_en') {
            // No auto-healing for AI cascade — needs human intervention
          }
          if (rule.id === 'db_degraded_en') {
            // Try connection recovery
            try {
              const { recoverConnection } = await import('@/lib/db');
              await recoverConnection();
              alert.selfHealingAction = 'Database connection recovery attempted';
            } catch {
              alert.selfHealingAction = 'Database connection recovery failed';
            }
          }
        }

        // 4. Send Telegram alert (English)
        const healingText = alert.selfHealingAction
          ? `\n\n🔧 <b>Self-healing:</b> ${alert.selfHealingAction}`
          : '';

        await sendRaqeebEnAlert(rule.level, `${alert.message}${healingText}`);
        markAlertSent(rule.id);
        alerts.push(alert);
        pushAlert(alert);

        console.warn(`[RaqeebEn] ${rule.level.toUpperCase()} [${rule.id}]: ${alertMessage}${alert.selfHealingAction ? ` | Healing: ${alert.selfHealingAction}` : ''}`);
      }
    } catch (err: unknown) {
      console.warn(`[RaqeebEn] Rule ${rule.id} error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const durationMs = Date.now() - startTime;

  // 5. Log summary
  if (alerts.length > 0) {
    console.log(`[RaqeebEn] Cycle complete: ${alerts.length} alerts, ${healingActions.length} healing actions, ${durationMs}ms`);
  }

  return { timestamp: startTime, metrics, alerts, healingActions, durationMs };
}

// ─── Startup Notification (English) ──────────────────────────

let startupNotificationSent = false;

export async function sendStartupNotificationEn(): Promise<void> {
  if (startupNotificationSent) return;
  startupNotificationSent = true;

  const gitSha = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_SHA || 'unknown';
  const shortSha = gitSha.slice(0, 7);

  await sendRaqeebEnAlert('info', `🚀 <b>Raqeeb EN is now monitoring</b>\n\nVersion: ${shortSha}\nTime: ${new Date().toISOString()}\n\nRaqeeb is watching the English pipeline 🔍`);
  console.log(`[RaqeebEn] Startup notification sent (${shortSha})`);
}

// ─── Status API ───────────────────────────────────────────────

export function getRaqeebEnStatus(): {
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

export function getMetricHistoryEn(): MetricSnapshot[] {
  return [...metricHistory];
}

// ─── Manual Alert Test (English) ─────────────────────────────

export async function sendTestAlertEn(): Promise<boolean> {
  return sendRaqeebEnAlert('info', '🧪 <b>Raqeeb EN Test</b>\n\nThis is a test alert — if you received this message, the English alert system is working correctly ✅');
}

// ─── Dashboard API Helpers ────────────────────────────────────

export function getAlertLogEn(): AlertRecord[] {
  return [...alertLog];
}

export function getAlertRulesEn(): { id: string; name: string; level: AlertLevel }[] {
  return ALERT_RULES_EN.map(r => ({ id: r.id, name: r.name, level: r.level }));
}

export type { AlertLevel, AlertRecord, MetricSnapshot as MetricSnapshotEn };
