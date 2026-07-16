// ═══════════════════════════════════════════════════════════════
// Unified Raqeeb — Multi-Locale Pipeline Monitoring Agent
// Factory-based design that creates a Raqeeb instance for any
// locale (en, fr, tr, es) without duplicating code.
//
// This is an ADDITIVE file — the Arabic raqeeb.ts and the
// English raqeeb-en.ts are completely untouched.
//
// Usage:
//   import { raqeebFr, raqeebTr, raqeebEs } from './raqeeb-multilang';
//   import { createRaqeeb } from './raqeeb-multilang';
//   const myRaqeeb = createRaqeeb('fr');
// ═══════════════════════════════════════════════════════════════

// ─── Supported Locales ────────────────────────────────────────

export type SupportedLocale = 'en' | 'fr' | 'tr' | 'es';

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
  check: (current: MetricSnapshot, prev: MetricSnapshot | null) => string | null;
}

interface AlertRecord {
  id: string;
  level: AlertLevel;
  ruleId: string;
  message: string;
  timestamp: number;
  selfHealingAction?: string;
}

interface HealingResult {
  action: string;
  success: boolean;
  message: string;
}

export interface RaqeebRunResult {
  timestamp: number;
  metrics: MetricSnapshot;
  alerts: AlertRecord[];
  healingActions: HealingResult[];
  durationMs: number;
}

export interface RaqeebInstance {
  runCycle: () => Promise<RaqeebRunResult>;
  sendStartupNotification: () => Promise<void>;
  getStatus: () => {
    isRunning: boolean;
    lastRunTime: number;
    metricHistoryCount: number;
    recentAlerts: { ruleId: string; lastSent: number }[];
    healingAttempts: { ruleId: string; count: number; lastAttempt: number }[];
  };
  getMetricHistory: () => MetricSnapshot[];
  getAlertLog: () => AlertRecord[];
}

// ─── Locale Configuration ─────────────────────────────────────

interface LocaleConfig {
  label: string;              // e.g. 'FR', 'TR', 'ES', 'EN'
  orchestratorPath: string;   // e.g. './fr-orchestrator'
  ensureFnName: string;       // e.g. 'ensureFrRunning'
  statsFnName: string;        // e.g. 'getFrOrchestratorStats'
  cronRoute: string;          // e.g. '/api/news/cron-fr'
  localeCode: string;         // e.g. 'fr'
  ruleSuffix: string;         // e.g. '_fr'
}

const LOCALE_CONFIGS: Record<SupportedLocale, LocaleConfig> = {
  en: {
    label: 'EN',
    orchestratorPath: './en-orchestrator',
    ensureFnName: 'ensureEnRunning',
    statsFnName: 'getEnOrchestratorStats',
    cronRoute: '/api/news/cron-en',
    localeCode: 'en',
    ruleSuffix: '_en',
  },
  fr: {
    label: 'FR',
    orchestratorPath: './fr-orchestrator',
    ensureFnName: 'ensureFrRunning',
    statsFnName: 'getFrOrchestratorStats',
    cronRoute: '/api/news/cron-fr',
    localeCode: 'fr',
    ruleSuffix: '_fr',
  },
  tr: {
    label: 'TR',
    orchestratorPath: './tr-orchestrator',
    ensureFnName: 'ensureTrRunning',
    statsFnName: 'getTrOrchestratorStats',
    cronRoute: '/api/news/cron-tr',
    localeCode: 'tr',
    ruleSuffix: '_tr',
  },
  es: {
    label: 'ES',
    orchestratorPath: './es-orchestrator',
    ensureFnName: 'ensureEsRunning',
    statsFnName: 'getEsOrchestratorStatus', // Note: ES uses 'Status' not 'Stats'
    cronRoute: '/api/news/cron-es',
    localeCode: 'es',
    ruleSuffix: '_es',
  },
};

// ─── Locale-specific Alert Messages ───────────────────────────

interface AlertMessages {
  pipelineDead: (c: MetricSnapshot) => string;
  noNewArticles15min: (c: MetricSnapshot) => string;
  noPublish30min: (c: MetricSnapshot) => string;
  aiCascadeFailure: (c: MetricSnapshot) => string;
  dbDegraded: (c: MetricSnapshot) => string;
  highSkipRate: (c: MetricSnapshot) => string;
  lowPublishRate: (c: MetricSnapshot) => string;
  aiProvidersLow: (c: MetricSnapshot) => string;
  dbLatencyHigh: (c: MetricSnapshot) => string;
  highPendingCount: (c: MetricSnapshot) => string;
  pipelineStaleRunning: (c: MetricSnapshot) => string;
  articlesLastHourDrop: (curr: MetricSnapshot, prev: MetricSnapshot) => string;
  newestArticleOld: (c: MetricSnapshot) => string;
  aiProviderRecovered: (c: MetricSnapshot) => string;
  dbRecovered: (c: MetricSnapshot) => string;
}

const ALERT_MSG: Record<SupportedLocale, AlertMessages> = {
  en: {
    pipelineDead: (c) => `English pipeline is DEAD! Cycles: ${c.pipelineCycles} | Idle: ${c.pipelineIdleMin} minutes`,
    noNewArticles15min: (c) => `⚠️ No new articles for ${c.newestArticleAgeMin} minutes despite pipeline running.\nArticles/hour: ${c.articlesLastHour} | Ready: ${c.totalReady}`,
    noPublish30min: (c) => `🔴 Zero articles in the past hour.\nReady: ${c.totalReady} | Published: ${c.totalPublished}`,
    aiCascadeFailure: (c) => `🔴 AI provider cascade failure!\nAvailable: ${c.aiProvidersAvailable}/${c.aiProvidersTotal}`,
    dbDegraded: (c) => `🔴 Database status: ${c.dbStatus}\nLatency: ${c.dbLatencyMs}ms`,
    highSkipRate: (c) => `⚠️ Skip rate: ${Math.round(c.skipRate * 100)}%\nPublished today: ${c.publishedToday} | Skipped: ${c.skippedCount}`,
    lowPublishRate: (c) => `⚠️ Low publish rate: ${c.publishedThisHour} articles/hour (expected: 15+)\nPending: ${c.pendingCount}`,
    aiProvidersLow: (c) => `⚠️ AI providers available: ${c.aiProvidersAvailable}/${c.aiProvidersTotal}\nPipeline running but with limited capacity`,
    dbLatencyHigh: (c) => `⚠️ Database slow: ${c.dbLatencyMs}ms\nStatus: healthy but slow`,
    highPendingCount: (c) => `⚠️ Pending articles: ${c.pendingCount}\nPossible processing bottleneck`,
    pipelineStaleRunning: (c) => `⚠️ Pipeline running but not producing — stale\nIdle: ${c.pipelineIdleMin} minutes`,
    articlesLastHourDrop: (c, p) => `⚠️ Sharp drop: ${c.articlesLastHour} articles/hour (was ${p.articlesLastHour})`,
    newestArticleOld: (c) => `ℹ️ Newest article is ${c.newestArticleAgeMin} minutes old\nPipeline: ${c.pipelineRunning ? 'running' : 'stopped'}`,
    aiProviderRecovered: (c) => `✅ AI providers recovered: ${c.aiProvidersAvailable}/${c.aiProvidersTotal} available`,
    dbRecovered: (c) => `✅ Database recovered — latency: ${c.dbLatencyMs}ms`,
  },
  fr: {
    pipelineDead: (c) => `French pipeline is DEAD! Cycles: ${c.pipelineCycles} | Idle: ${c.pipelineIdleMin} minutes`,
    noNewArticles15min: (c) => `⚠️ No new articles for ${c.newestArticleAgeMin} minutes despite pipeline running.\nArticles/hour: ${c.articlesLastHour} | Ready: ${c.totalReady}`,
    noPublish30min: (c) => `🔴 Zero articles in the past hour.\nReady: ${c.totalReady} | Published: ${c.totalPublished}`,
    aiCascadeFailure: (c) => `🔴 AI provider cascade failure!\nAvailable: ${c.aiProvidersAvailable}/${c.aiProvidersTotal}`,
    dbDegraded: (c) => `🔴 Database status: ${c.dbStatus}\nLatency: ${c.dbLatencyMs}ms`,
    highSkipRate: (c) => `⚠️ Skip rate: ${Math.round(c.skipRate * 100)}%\nPublished today: ${c.publishedToday} | Skipped: ${c.skippedCount}`,
    lowPublishRate: (c) => `⚠️ Low publish rate: ${c.publishedThisHour} articles/hour (expected: 15+)\nPending: ${c.pendingCount}`,
    aiProvidersLow: (c) => `⚠️ AI providers available: ${c.aiProvidersAvailable}/${c.aiProvidersTotal}\nPipeline running but with limited capacity`,
    dbLatencyHigh: (c) => `⚠️ Database slow: ${c.dbLatencyMs}ms\nStatus: healthy but slow`,
    highPendingCount: (c) => `⚠️ Pending articles: ${c.pendingCount}\nPossible processing bottleneck`,
    pipelineStaleRunning: (c) => `⚠️ Pipeline running but not producing — stale\nIdle: ${c.pipelineIdleMin} minutes`,
    articlesLastHourDrop: (c, p) => `⚠️ Sharp drop: ${c.articlesLastHour} articles/hour (was ${p.articlesLastHour})`,
    newestArticleOld: (c) => `ℹ️ Newest article is ${c.newestArticleAgeMin} minutes old\nPipeline: ${c.pipelineRunning ? 'running' : 'stopped'}`,
    aiProviderRecovered: (c) => `✅ AI providers recovered: ${c.aiProvidersAvailable}/${c.aiProvidersTotal} available`,
    dbRecovered: (c) => `✅ Database recovered — latency: ${c.dbLatencyMs}ms`,
  },
  tr: {
    pipelineDead: (c) => `Turkish pipeline is DEAD! Cycles: ${c.pipelineCycles} | Idle: ${c.pipelineIdleMin} minutes`,
    noNewArticles15min: (c) => `⚠️ No new articles for ${c.newestArticleAgeMin} minutes despite pipeline running.\nArticles/hour: ${c.articlesLastHour} | Ready: ${c.totalReady}`,
    noPublish30min: (c) => `🔴 Zero articles in the past hour.\nReady: ${c.totalReady} | Published: ${c.totalPublished}`,
    aiCascadeFailure: (c) => `🔴 AI provider cascade failure!\nAvailable: ${c.aiProvidersAvailable}/${c.aiProvidersTotal}`,
    dbDegraded: (c) => `🔴 Database status: ${c.dbStatus}\nLatency: ${c.dbLatencyMs}ms`,
    highSkipRate: (c) => `⚠️ Skip rate: ${Math.round(c.skipRate * 100)}%\nPublished today: ${c.publishedToday} | Skipped: ${c.skippedCount}`,
    lowPublishRate: (c) => `⚠️ Low publish rate: ${c.publishedThisHour} articles/hour (expected: 15+)\nPending: ${c.pendingCount}`,
    aiProvidersLow: (c) => `⚠️ AI providers available: ${c.aiProvidersAvailable}/${c.aiProvidersTotal}\nPipeline running but with limited capacity`,
    dbLatencyHigh: (c) => `⚠️ Database slow: ${c.dbLatencyMs}ms\nStatus: healthy but slow`,
    highPendingCount: (c) => `⚠️ Pending articles: ${c.pendingCount}\nPossible processing bottleneck`,
    pipelineStaleRunning: (c) => `⚠️ Pipeline running but not producing — stale\nIdle: ${c.pipelineIdleMin} minutes`,
    articlesLastHourDrop: (c, p) => `⚠️ Sharp drop: ${c.articlesLastHour} articles/hour (was ${p.articlesLastHour})`,
    newestArticleOld: (c) => `ℹ️ Newest article is ${c.newestArticleAgeMin} minutes old\nPipeline: ${c.pipelineRunning ? 'running' : 'stopped'}`,
    aiProviderRecovered: (c) => `✅ AI providers recovered: ${c.aiProvidersAvailable}/${c.aiProvidersTotal} available`,
    dbRecovered: (c) => `✅ Database recovered — latency: ${c.dbLatencyMs}ms`,
  },
  es: {
    pipelineDead: (c) => `Spanish pipeline is DEAD! Cycles: ${c.pipelineCycles} | Idle: ${c.pipelineIdleMin} minutes`,
    noNewArticles15min: (c) => `⚠️ No new articles for ${c.newestArticleAgeMin} minutes despite pipeline running.\nArticles/hour: ${c.articlesLastHour} | Ready: ${c.totalReady}`,
    noPublish30min: (c) => `🔴 Zero articles in the past hour.\nReady: ${c.totalReady} | Published: ${c.totalPublished}`,
    aiCascadeFailure: (c) => `🔴 AI provider cascade failure!\nAvailable: ${c.aiProvidersAvailable}/${c.aiProvidersTotal}`,
    dbDegraded: (c) => `🔴 Database status: ${c.dbStatus}\nLatency: ${c.dbLatencyMs}ms`,
    highSkipRate: (c) => `⚠️ Skip rate: ${Math.round(c.skipRate * 100)}%\nPublished today: ${c.publishedToday} | Skipped: ${c.skippedCount}`,
    lowPublishRate: (c) => `⚠️ Low publish rate: ${c.publishedThisHour} articles/hour (expected: 15+)\nPending: ${c.pendingCount}`,
    aiProvidersLow: (c) => `⚠️ AI providers available: ${c.aiProvidersAvailable}/${c.aiProvidersTotal}\nPipeline running but with limited capacity`,
    dbLatencyHigh: (c) => `⚠️ Database slow: ${c.dbLatencyMs}ms\nStatus: healthy but slow`,
    highPendingCount: (c) => `⚠️ Pending articles: ${c.pendingCount}\nPossible processing bottleneck`,
    pipelineStaleRunning: (c) => `⚠️ Pipeline running but not producing — stale\nIdle: ${c.pipelineIdleMin} minutes`,
    articlesLastHourDrop: (c, p) => `⚠️ Sharp drop: ${c.articlesLastHour} articles/hour (was ${p.articlesLastHour})`,
    newestArticleOld: (c) => `ℹ️ Newest article is ${c.newestArticleAgeMin} minutes old\nPipeline: ${c.pipelineRunning ? 'running' : 'stopped'}`,
    aiProviderRecovered: (c) => `✅ AI providers recovered: ${c.aiProvidersAvailable}/${c.aiProvidersTotal} available`,
    dbRecovered: (c) => `✅ Database recovered — latency: ${c.dbLatencyMs}ms`,
  },
};

// ─── Locale display names for startup notification ────────────

const LOCALE_DISPLAY: Record<SupportedLocale, string> = {
  en: 'English',
  fr: 'French',
  tr: 'Turkish',
  es: 'Spanish',
};

// ─── Factory Function ─────────────────────────────────────────

export function createRaqeeb(locale: SupportedLocale): RaqeebInstance {
  const config = LOCALE_CONFIGS[locale];
  const msg = ALERT_MSG[locale];
  const displayName = LOCALE_DISPLAY[locale];
  const logPrefix = `[Raqeeb${config.label}]`;

  // ── Instance-scoped state ──

  const alertLog: AlertRecord[] = [];
  const metricHistory: MetricSnapshot[] = [];
  const alertCooldowns = new Map<string, number>();
  const healingAttempts = new Map<string, { count: number; lastAttempt: number }>();

  let hourlyAlertCount = 0;
  let hourlyResetTime = Date.now();
  let lastRunTime = 0;
  let startupNotificationSent = false;

  // ── Constants ──

  const MAX_ALERT_LOG = 100;
  const MAX_HISTORY = 120; // 2 hours at 1 snapshot/min
  const ALERT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes between same alerts
  const MAX_ALERTS_PER_HOUR = 6;
  const MAX_HEALING_ATTEMPTS = 3;
  const HEALING_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
  const MIN_RUN_INTERVAL_MS = 30 * 1000; // 30 seconds minimum between runs

  // ── Internal helpers ──

  function pushAlert(alert: AlertRecord): void {
    alertLog.push(alert);
    if (alertLog.length > MAX_ALERT_LOG) {
      alertLog.shift();
    }
  }

  function pushMetric(snapshot: MetricSnapshot): void {
    metricHistory.push(snapshot);
    if (metricHistory.length > MAX_HISTORY) {
      metricHistory.shift();
    }
  }

  function getLatestMetric(): MetricSnapshot | null {
    return metricHistory.length > 0 ? metricHistory[metricHistory.length - 1] : null;
  }

  function shouldSendAlert(ruleId: string): boolean {
    const now = Date.now();

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

  async function attemptSelfHealing(
    ruleId: string,
    healingFn: () => Promise<HealingResult>,
  ): Promise<HealingResult | null> {
    const now = Date.now();
    const record = healingAttempts.get(ruleId);

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

  // ── Telegram Alert Sender ──

  async function sendAlert(level: AlertLevel, message: string): Promise<boolean> {
    const botToken = process.env.TELEGRAM_ALERT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;

    if (!botToken || !chatId) {
      console.warn(`${logPrefix} No Telegram credentials — alert not sent`);
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

    const text = `${icons[level]} <b>Raqeeb ${config.label} — ${levelNames[level]}</b>\n\n${message}\n\n⏰ ${new Date().toISOString()}`;

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
        console.warn(`${logPrefix} Telegram send failed (${response.status}): ${errText.slice(0, 200)}`);
      }

      return response.ok;
    } catch (err: unknown) {
      console.warn(`${logPrefix} Telegram send error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  // ── Self-Healing Actions ──

  async function healRestartPipeline(): Promise<HealingResult> {
    try {
      const mod = await import(config.orchestratorPath);
      const ensureFn = mod[config.ensureFnName] as () => { wasRunning: boolean; wasStale: boolean; restarted: boolean };
      const result = ensureFn();
      return {
        action: `restart_${config.localeCode}_pipeline`,
        success: result.restarted,
        message: result.restarted
          ? `${displayName} pipeline restarted (${result.wasStale ? 'was stale' : 'was not running'})`
          : `${displayName} pipeline is already running`,
      };
    } catch (err: unknown) {
      return {
        action: `restart_${config.localeCode}_pipeline`,
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

  async function healFixUnready(): Promise<HealingResult> {
    try {
      const port = process.env.PORT || 8080;
      const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
      const url = process.env.RAILWAY_PRIVATE_DOMAIN
        ? `http://${process.env.RAILWAY_PRIVATE_DOMAIN}:${port}${config.cronRoute}?action=mark-ready`
        : `http://localhost:${port}${config.cronRoute}?action=mark-ready`;

      const response = await fetch(url, {
        headers: { 'x-internal': internalSecret },
        signal: AbortSignal.timeout(10000),
      });

      return {
        action: `fix_unready_${config.localeCode}`,
        success: response.ok,
        message: response.ok ? `${displayName} fix-unready triggered` : `Failed: ${response.status}`,
      };
    } catch (err: unknown) {
      return {
        action: `fix_unready_${config.localeCode}`,
        success: false,
        message: `Failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // ── Alert Rules ──

  const suffix = config.ruleSuffix;

  const ALERT_RULES: AlertRule[] = [
    // ── CRITICAL: Pipeline Health ──
    {
      id: `pipeline_dead${suffix}`,
      name: `Pipeline Dead (${config.label})`,
      level: 'critical',
      check: (curr, _prev) => {
        if (!curr.pipelineRunning && curr.pipelineCycles > 0) {
          return msg.pipelineDead(curr);
        }
        return null;
      },
    },
    {
      id: `no_new_articles_15min${suffix}`,
      name: `No New Articles 15min (${config.label})`,
      level: 'critical',
      check: (curr, _prev) => {
        if (curr.newestArticleAgeMin > 15 && curr.pipelineRunning) {
          return msg.noNewArticles15min(curr);
        }
        return null;
      },
    },
    {
      id: `no_publish_30min${suffix}`,
      name: `No Publish 30min (${config.label})`,
      level: 'critical',
      check: (curr, _prev) => {
        if (curr.articlesLastHour === 0 && curr.uptime > 1800) {
          return msg.noPublish30min(curr);
        }
        return null;
      },
    },
    {
      id: `ai_cascade_failure${suffix}`,
      name: `AI Cascade Failure (${config.label})`,
      level: 'critical',
      check: (curr, _prev) => {
        if (curr.aiCascadeFailure) {
          return msg.aiCascadeFailure(curr);
        }
        return null;
      },
    },
    {
      id: `db_degraded${suffix}`,
      name: `Database Degraded (${config.label})`,
      level: 'critical',
      check: (curr, _prev) => {
        if (curr.dbStatus === 'degraded' || curr.dbStatus === 'not_configured') {
          return msg.dbDegraded(curr);
        }
        return null;
      },
    },

    // ── WARNING: Quality ──
    {
      id: `high_skip_rate${suffix}`,
      name: `High Skip Rate (${config.label})`,
      level: 'warning',
      check: (curr, _prev) => {
        if (curr.skipRate > 0.4 && curr.publishedToday > 5) {
          return msg.highSkipRate(curr);
        }
        return null;
      },
    },
    {
      id: `low_publish_rate${suffix}`,
      name: `Low Publish Rate (${config.label})`,
      level: 'warning',
      check: (curr, _prev) => {
        if (curr.publishedThisHour < 5 && curr.publishedThisHour > 0 && curr.uptime > 3600) {
          return msg.lowPublishRate(curr);
        }
        return null;
      },
    },
    {
      id: `ai_providers_low${suffix}`,
      name: `AI Providers Low (${config.label})`,
      level: 'warning',
      check: (curr, _prev) => {
        if (curr.aiProvidersAvailable > 0 && curr.aiProvidersAvailable <= 2 && curr.aiProvidersTotal > 2) {
          return msg.aiProvidersLow(curr);
        }
        return null;
      },
    },
    {
      id: `db_latency_high${suffix}`,
      name: `DB Latency High (${config.label})`,
      level: 'warning',
      check: (curr, _prev) => {
        if (curr.dbLatencyMs > 500 && curr.dbStatus === 'healthy') {
          return msg.dbLatencyHigh(curr);
        }
        return null;
      },
    },
    {
      id: `high_pending_count${suffix}`,
      name: `High Pending Count (${config.label})`,
      level: 'warning',
      check: (curr, _prev) => {
        if (curr.pendingCount > 200) {
          return msg.highPendingCount(curr);
        }
        return null;
      },
    },
    {
      id: `pipeline_stale_running${suffix}`,
      name: `Pipeline Stale While Running (${config.label})`,
      level: 'warning',
      check: (curr, prev) => {
        if (curr.pipelineRunning && prev && curr.articlesLast15Min === 0 && prev.articlesLast15Min === 0 && curr.uptime > 600) {
          return msg.pipelineStaleRunning(curr);
        }
        return null;
      },
    },
    {
      id: `articles_last_hour_drop${suffix}`,
      name: `Articles Rate Drop (${config.label})`,
      level: 'warning',
      check: (curr, prev) => {
        if (prev && prev.articlesLastHour > 10 && curr.articlesLastHour < prev.articlesLastHour * 0.3) {
          return msg.articlesLastHourDrop(curr, prev);
        }
        return null;
      },
    },

    // ── INFO: Informational ──
    {
      id: `newest_article_old${suffix}`,
      name: `Newest Article Old (${config.label})`,
      level: 'info',
      check: (curr, _prev) => {
        if (curr.newestArticleAgeMin > 10 && curr.newestArticleAgeMin <= 15) {
          return msg.newestArticleOld(curr);
        }
        return null;
      },
    },
    {
      id: `ai_provider_recovered${suffix}`,
      name: `AI Provider Recovered (${config.label})`,
      level: 'info',
      check: (curr, prev) => {
        if (prev && prev.aiCascadeFailure && !curr.aiCascadeFailure) {
          return msg.aiProviderRecovered(curr);
        }
        return null;
      },
    },
    {
      id: `db_recovered${suffix}`,
      name: `DB Recovered (${config.label})`,
      level: 'info',
      check: (curr, prev) => {
        if (prev && prev.dbStatus === 'degraded' && curr.dbStatus === 'healthy') {
          return msg.dbRecovered(curr);
        }
        return null;
      },
    },
  ];

  // ── Metric Collection (locale-filtered) ──

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
      // ── Pipeline Stats from DB (locale-filtered) ──
      const { db } = await import('@/lib/db');

      const oneHourAgo = new Date(now - 60 * 60 * 1000);
      const fifteenMinAgo = new Date(now - 15 * 60 * 1000);
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const localeFilter = { locale: config.localeCode };

      // V379: Visibility filter for published counts — matches frontend
      const publishedFilter = { ...localeFilter, isReady: true, isPublished: true, newsType: 'live' as const, slug: { not: '' }, title: { not: '' } };

      const [articlesLastHour, articlesLast15Min, totalReady, totalPublished, publishedToday, pendingCount, skippedCount, newestArticle] = await Promise.all([
        db.newsItem.count({ where: { ...localeFilter, isReady: true, fetchedAt: { gte: oneHourAgo } } }),
        db.newsItem.count({ where: { ...localeFilter, isReady: true, fetchedAt: { gte: fifteenMinAgo } } }),
        db.newsItem.count({ where: { ...localeFilter, isReady: true } }),
        db.newsItem.count({ where: publishedFilter }),
        db.newsItem.count({ where: { ...publishedFilter, publishedAt: { gte: todayStart } } }),
        db.newsItem.count({ where: { ...localeFilter, isReady: false, retryCount: { lt: 15 } } }),
        db.newsItem.count({ where: { ...localeFilter, rejectCount: { gte: 3 } } }),
        db.newsItem.findFirst({ where: { ...localeFilter, isReady: true, slug: { not: null } }, orderBy: { fetchedAt: 'desc' }, select: { fetchedAt: true } }),
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
        where: { ...publishedFilter, publishedAt: { gte: oneHourAgo } },
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
          // Try recovery if ping fails
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
      } catch {
        snapshot.dbStatus = 'degraded';
        snapshot.dbLatencyMs = -1;
      }

    } catch (err: unknown) {
      console.warn(`${logPrefix} DB collection error: ${err instanceof Error ? err.message : String(err)}`);
      snapshot.dbStatus = 'degraded';
    }

    try {
      // ── Pipeline Orchestrator Stats (locale-specific) ──
      const mod = await import(config.orchestratorPath);
      const statsFn = mod[config.statsFnName] as () => Promise<{
        isRunning: boolean;
        cycleCount: number;
        idleMinutes: number | null;
      }>;
      const stats = await statsFn();
      snapshot.pipelineRunning = stats.isRunning;
      snapshot.pipelineCycles = stats.cycleCount;
      snapshot.pipelineIdleMin = stats.idleMinutes || 0;
    } catch {
      snapshot.pipelineRunning = false;
    }

    try {
      // ── AI Provider Stats (shared across locales) ──
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

  // ── Main Monitoring Cycle ──

  async function runCycle(): Promise<RaqeebRunResult> {
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
            timestamp: Date.now(),
          };

          // 3. Self-healing for critical issues
          if (rule.level === 'critical') {
            const isPipelineDeadRule = rule.id === `pipeline_dead${suffix}`;
            const isNoNewArticlesRule = rule.id === `no_new_articles_15min${suffix}`;
            const isNoPublishRule = rule.id === `no_publish_30min${suffix}`;

            if (isPipelineDeadRule || isNoNewArticlesRule || isNoPublishRule) {
              const healResult = await attemptSelfHealing(rule.id, healRestartPipeline);
              if (healResult) {
                alert.selfHealingAction = healResult.message;
                healingActions.push(healResult);
              }
              // Also try bootstrap if restart alone doesn't help
              if (isPipelineDeadRule) {
                const bootstrapResult = await attemptSelfHealing(`${rule.id}_bootstrap`, healTriggerBootstrap);
                if (bootstrapResult) {
                  alert.selfHealingAction = (alert.selfHealingAction || '') + ` | ${bootstrapResult.message}`;
                  healingActions.push(bootstrapResult);
                }
              }
            }
            if (rule.id === `ai_cascade_failure${suffix}`) {
              // No auto-healing for AI cascade — needs human intervention
            }
            if (rule.id === `db_degraded${suffix}`) {
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

          // 4. Send Telegram alert
          const healingText = alert.selfHealingAction
            ? `\n\n🔧 <b>Self-healing:</b> ${alert.selfHealingAction}`
            : '';

          await sendAlert(rule.level, `${alert.message}${healingText}`);
          markAlertSent(rule.id);
          alerts.push(alert);
          pushAlert(alert);

          console.warn(`${logPrefix} ${rule.level.toUpperCase()} [${rule.id}]: ${alertMessage}${alert.selfHealingAction ? ` | Healing: ${alert.selfHealingAction}` : ''}`);
        }
      } catch (err: unknown) {
        console.warn(`${logPrefix} Rule ${rule.id} error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const durationMs = Date.now() - startTime;

    // 5. Log summary
    if (alerts.length > 0) {
      console.log(`${logPrefix} Cycle complete: ${alerts.length} alerts, ${healingActions.length} healing actions, ${durationMs}ms`);
    }

    return { timestamp: startTime, metrics, alerts, healingActions, durationMs };
  }

  // ── Startup Notification ──

  async function sendStartupNotification(): Promise<void> {
    if (startupNotificationSent) return;
    startupNotificationSent = true;

    const gitSha = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_SHA || 'unknown';
    const shortSha = gitSha.slice(0, 7);

    await sendAlert('info', `🚀 <b>Raqeeb ${config.label} is now monitoring</b>\n\nVersion: ${shortSha}\nTime: ${new Date().toISOString()}\n\nRaqeeb is watching the ${displayName} pipeline 🔍`);
    console.log(`${logPrefix} Startup notification sent (${shortSha})`);
  }

  // ── Status API ──

  function getStatus() {
    return {
      isRunning: lastRunTime > 0,
      lastRunTime,
      metricHistoryCount: metricHistory.length,
      recentAlerts: Array.from(alertCooldowns.entries()).map(([ruleId, lastSent]) => ({ ruleId, lastSent })),
      healingAttempts: Array.from(healingAttempts.entries()).map(([ruleId, record]) => ({ ruleId, ...record })),
    };
  }

  function getMetricHistory(): MetricSnapshot[] {
    return [...metricHistory];
  }

  function getAlertLogInstance(): AlertRecord[] {
    return [...alertLog];
  }

  // ── Return public API ──

  return {
    runCycle,
    sendStartupNotification,
    getStatus,
    getMetricHistory,
    getAlertLog: getAlertLogInstance,
  };
}

// ─── Pre-created Instances ────────────────────────────────────

export const raqeebEn = createRaqeeb('en');
export const raqeebFr = createRaqeeb('fr');
export const raqeebTr = createRaqeeb('tr');
export const raqeebEs = createRaqeeb('es');

// ─── Re-export types for convenience ──────────────────────────

export type { AlertLevel, AlertRecord, MetricSnapshot };
