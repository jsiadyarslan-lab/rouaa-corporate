// ════════════════════════════════════════════════════════════════════
// Geopolitical Risk Analysis Scheduler (V1045)
// ════════════════════════════════════════════════════════════════════
// Auto-runs the geopolitical pipeline every 12 hours.
// Generates professional geopolitical risk analyses for all 5 locales.
// Crash-resilient: auto-restarts on any error with 30s delay.

import { runGeopoliticalPipeline, type Locale } from './geopolitical-pipeline';

// ── State ──
let isRunning = false;
let schedulerTimer: ReturnType<typeof setTimeout> | null = null;
let lastRunTime = 0;
let lastRunResult: {
  timestamp: string;
  generated: number;
  skipped: number;
  errors: string[];
  duration: number;
  analyses: { locale: Locale; title: string; slug: string; riskScore: number; riskLevel: string }[];
} | null = null;
let cycleCount = 0;
let totalGenerated = 0;
let totalErrors = 0;
let lastError: string | null = null;

const SCHEDULER_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours
const CRASH_RESTART_DELAY_MS = 30 * 1000; // 30 seconds
const STARTUP_DELAY_MS = 120 * 1000; // 2 minutes after server start

// ── Public API ──

export function startGeopoliticalScheduler(): void {
  if (isRunning) {
    console.log('[GeoScheduler] Already running');
    return;
  }

  isRunning = true;
  console.log(`[GeoScheduler V1045] Starting — runs every ${SCHEDULER_INTERVAL_MS / 3600000} hours`);

  // Delay first run to let the server fully start
  schedulerTimer = setTimeout(async () => {
    try {
      await runSchedulerCycle();
    } catch (err: any) {
      console.error(`[GeoScheduler] Startup cycle error: ${err.message}`);
      lastError = err.message;
      totalErrors++;
    }
    scheduleNextCycle();
  }, STARTUP_DELAY_MS);
}

export function stopGeopoliticalScheduler(): void {
  isRunning = false;
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }
  console.log('[GeoScheduler] Stopped');
}

export function getGeopoliticalSchedulerStatus() {
  return {
    isRunning,
    cycleCount,
    lastRunTime: lastRunTime ? new Date(lastRunTime).toISOString() : null,
    nextRunTime: schedulerTimer
      ? new Date(Date.now() + SCHEDULER_INTERVAL_MS).toISOString()
      : null,
    totalGenerated,
    totalErrors,
    lastError,
    lastRunResult,
    intervalHours: SCHEDULER_INTERVAL_MS / 3600000,
  };
}

// ── Scheduler Cycle ──

async function runSchedulerCycle(): Promise<void> {
  cycleCount++;
  const cycleNum = cycleCount;
  console.log(`[GeoScheduler] Cycle #${cycleNum} starting...`);

  try {
    // Generate for all 5 locales, up to 5 analyses each
    const result = await runGeopoliticalPipeline({
      force: false,
      maxAnalyses: 5,
      locales: ['ar', 'en', 'fr', 'tr', 'es'],
    });

    lastRunTime = Date.now();
    lastRunResult = {
      timestamp: new Date().toISOString(),
      generated: result.generated,
      skipped: result.skipped,
      errors: result.errors,
      duration: result.duration,
      analyses: result.analyses,
    };

    totalGenerated += result.generated;
    totalErrors += result.errors.length;
    lastError = result.errors.length > 0 ? result.errors[0] : null;

    console.log(`[GeoScheduler] Cycle #${cycleNum} complete: ${result.generated} generated, ${result.skipped} skipped, ${result.errors.length} errors, ${result.duration}ms`);
  } catch (err: any) {
    console.error(`[GeoScheduler] Cycle #${cycleNum} failed: ${err.message}`);
    lastError = err.message;
    totalErrors++;
    lastRunTime = Date.now();
    lastRunResult = {
      timestamp: new Date().toISOString(),
      generated: 0,
      skipped: 0,
      errors: [err.message],
      duration: 0,
      analyses: [],
    };
  }
}

function scheduleNextCycle(): void {
  if (!isRunning) return;

  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }

  schedulerTimer = setTimeout(async () => {
    try {
      await runSchedulerCycle();
    } catch (err: any) {
      console.error(`[GeoScheduler] Unhandled error in cycle: ${err.message}`);
      lastError = err.message;
      totalErrors++;
      // Crash-resilient: restart after delay
      console.log(`[GeoScheduler] Auto-restarting in ${CRASH_RESTART_DELAY_MS / 1000}s...`);
      schedulerTimer = setTimeout(async () => {
        try {
          await runSchedulerCycle();
        } catch (restartErr: any) {
          console.error(`[GeoScheduler] Restart cycle also failed: ${restartErr.message}`);
        }
        scheduleNextCycle();
      }, CRASH_RESTART_DELAY_MS);
      return;
    }
    scheduleNextCycle();
  }, SCHEDULER_INTERVAL_MS);
}
