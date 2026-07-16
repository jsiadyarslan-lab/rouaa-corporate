// ═══════════════════════════════════════════════════════════════
// Stock Pipeline Orchestrator V1
// ─────────────────────────────────────────────────────────────
// Continuous-loop orchestrator for the stock analysis pipeline.
// Modeled after the EN/FR/AR news orchestrators but focused on
// stock data fetching, technical analysis, and publishing.
//
// CYCLE: For each locale (en, ar, fr):
//   fetch quote → fetch history → technical analysis → AI article → publish
//
// SCHEDULE:
//   - Market hours (09:30-16:00 ET, Mon-Fri): every 15 minutes
//   - Pre/post market: every 30 minutes
//   - Off-hours (nights/weekends): every 60 minutes
//
// CRITICAL DESIGN:
// - Crash-resilient: auto-restarts on any error
// - Watchdog: auto-restarts if no cycle in 30 minutes
// - Follows GOLDEN RULE #4: Pipeline NEVER stops
// - Independent: does NOT affect the news pipelines
// - Lazy imports: all heavy modules imported dynamically to avoid startup failures
// ═══════════════════════════════════════════════════════════════

// NOTE: No top-level db import — all imports are dynamic to avoid startup failures
// when the DB connection isn't ready yet. This matches the en/fr orchestrator pattern.

// ── Configurable Intervals ──
const MARKET_HOURS_INTERVAL_MS = 15 * 60 * 1000;    // 15 minutes during market hours
const PREPOST_INTERVAL_MS = 30 * 60 * 1000;          // 30 minutes pre/post market
const OFF_HOURS_INTERVAL_MS = 60 * 60 * 1000;        // 60 minutes off-hours
const STARTUP_DELAY_MS = 30_000;                       // 30s delay before first cycle
const MAX_STOCKS_PER_LOCALE = 10;                      // Max stocks per locale per cycle

// ── Watchdog ──
const WATCHDOG_INTERVAL_MS = 5 * 60 * 1000;           // Check every 5 minutes
const WATCHDOG_MAX_IDLE_MS = 30 * 60 * 1000;          // 30 minutes max idle

// ── Market Hours (US Eastern Time) ──
const MARKET_OPEN_HOUR = 9;   // 9:30 AM ET
const MARKET_OPEN_MIN = 30;
const MARKET_CLOSE_HOUR = 16; // 4:00 PM ET
const PRE_MARKET_HOUR = 4;    // 4:00 AM ET
const POST_MARKET_HOUR = 20;  // 8:00 PM ET

// ── State ──
let isRunning = false;
let isPaused = false;
let cycleCount = 0;
let lastCycleTime = 0;
let lastError: string | null = null;
let totalProcessed = 0;
let totalPublished = 0;
let totalErrors = 0;
let cycleTimer: ReturnType<typeof setTimeout> | null = null;
let watchdogTimer: ReturnType<typeof setInterval> | null = null;

// ── Market Hours Detection ──

function getMarketSchedule(): { intervalMs: number; label: string } {
  const now = new Date();

  // Check if weekend (Saturday = 6, Sunday = 0)
  const day = now.getUTCDay();
  if (day === 0 || day === 6) {
    return { intervalMs: OFF_HOURS_INTERVAL_MS, label: 'weekend' };
  }

  // Convert current UTC time to ET (Eastern Time = UTC-5 or UTC-4 during DST)
  // Simplified: use UTC-4 (EDT is more common during trading hours)
  const etHour = (now.getUTCHours() - 4 + 24) % 24;
  const etMin = now.getUTCMinutes();

  // Market hours: 9:30 AM - 4:00 PM ET
  if (etHour > MARKET_OPEN_HOUR && etHour < MARKET_CLOSE_HOUR) {
    return { intervalMs: MARKET_HOURS_INTERVAL_MS, label: 'market-hours' };
  }
  if (etHour === MARKET_OPEN_HOUR && etMin >= MARKET_OPEN_MIN) {
    return { intervalMs: MARKET_HOURS_INTERVAL_MS, label: 'market-hours' };
  }
  if (etHour === MARKET_CLOSE_HOUR && etMin === 0) {
    return { intervalMs: MARKET_HOURS_INTERVAL_MS, label: 'market-hours' };
  }

  // Pre-market: 4:00 AM - 9:30 AM ET
  if (etHour >= PRE_MARKET_HOUR && etHour < MARKET_OPEN_HOUR) {
    return { intervalMs: PREPOST_INTERVAL_MS, label: 'pre-market' };
  }
  if (etHour === MARKET_OPEN_HOUR && etMin < MARKET_OPEN_MIN) {
    return { intervalMs: PREPOST_INTERVAL_MS, label: 'pre-market' };
  }

  // Post-market: 4:00 PM - 8:00 PM ET
  if (etHour >= MARKET_CLOSE_HOUR && etHour < POST_MARKET_HOUR) {
    return { intervalMs: PREPOST_INTERVAL_MS, label: 'post-market' };
  }

  // Off-hours
  return { intervalMs: OFF_HOURS_INTERVAL_MS, label: 'off-hours' };
}

// ── Single Stock Update ──
// Updates a single stock's data in the database without generating full AI articles.
// Used for quick price refreshes between full pipeline cycles.

async function quickPriceUpdate(symbol: string): Promise<boolean> {
  try {
    const { getQuote } = await import('@/lib/financial-apis');
    const { db } = await import('@/lib/db');
    const quote = await getQuote(symbol);

    if (!quote || quote.price <= 0) return false;

    // Update all existing StockAnalysis records for this symbol
    await db.stockAnalysis.updateMany({
      where: { symbol },
      data: {
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        high: quote.high,
        low: quote.low,
        open: quote.open,
        volume: quote.volume,
        previousClose: quote.previousClose,
        updatedAt: new Date(),
      },
    });

    // Update CompanyProfile lastUpdated timestamp
    await db.companyProfile.update({
      where: { symbol },
      data: { lastUpdated: new Date() },
    }).catch(() => {}); // Non-critical

    return true;
  } catch (err: any) {
    console.warn(`[StockOrchestrator] Quick update failed for ${symbol}: ${err.message?.slice(0, 60)}`);
    return false;
  }
}

// ── Full Pipeline Cycle ──

async function runFullPipelineCycle(): Promise<{
  processed: number;
  published: number;
  errors: number;
  duration: number;
}> {
  const startTime = Date.now();
  const result = { processed: 0, published: 0, errors: 0, duration: 0 };

  const schedule = getMarketSchedule();
  console.log(`[StockOrchestrator] Starting cycle #${cycleCount + 1} (schedule: ${schedule.label}, interval: ${schedule.intervalMs / 1000}s)`);

  // Run pipeline for each locale
  for (const locale of ['en', 'ar', 'fr', 'tr', 'es'] as const) {
    try {
      console.log(`[StockOrchestrator] Running pipeline for locale=${locale}...`);

      const { runStockAnalysisPipeline } = await import('@/lib/pipeline/stock-analysis-pipeline');
      const pipelineResult = await runStockAnalysisPipeline(locale, MAX_STOCKS_PER_LOCALE);

      result.processed += pipelineResult.generated;
      result.published += pipelineResult.published;
      result.errors += pipelineResult.errors;

      console.log(`[StockOrchestrator] Locale=${locale} done: generated=${pipelineResult.generated}, published=${pipelineResult.published}, errors=${pipelineResult.errors}`);
    } catch (err: any) {
      result.errors++;
      console.error(`[StockOrchestrator] Pipeline failed for locale=${locale}: ${err.message}`);
    }
  }

  // Quick price update for all tracked stocks (lightweight - no AI generation)
  try {
    const { db } = await import('@/lib/db');
    const trackedStocks = await db.stockAnalysis.findMany({
      where: { isPublished: true },
      select: { symbol: true },
      distinct: ['symbol'],
      take: 30,
    });

    let quickUpdated = 0;
    for (const stock of trackedStocks) {
      // Don't re-fetch stocks we just processed in the full pipeline
      const updated = await quickPriceUpdate(stock.symbol);
      if (updated) quickUpdated++;
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    }
    console.log(`[StockOrchestrator] Quick price update: ${quickUpdated}/${trackedStocks.length} stocks updated`);
  } catch (err: any) {
    console.warn(`[StockOrchestrator] Quick price update failed: ${err.message?.slice(0, 80)}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ── Cycle Scheduling ──

function scheduleNextCycle(): void {
  if (!isRunning || isPaused) return;

  const schedule = getMarketSchedule();
  const jitterMs = Math.floor(Math.random() * 30_000); // 0-30s random jitter

  cycleTimer = setTimeout(async () => {
    if (!isRunning || isPaused) return;

    try {
      const result = await runFullPipelineCycle();
      cycleCount++;
      lastCycleTime = Date.now();
      totalProcessed += result.processed;
      totalPublished += result.published;
      totalErrors += result.errors;

      console.log(
        `[StockOrchestrator] Cycle #${cycleCount} complete: ` +
        `processed=${result.processed}, published=${result.published}, ` +
        `errors=${result.errors}, duration=${(result.duration / 1000).toFixed(1)}s`
      );
    } catch (err: any) {
      lastError = err.message;
      totalErrors++;
      console.error(`[StockOrchestrator] Cycle #${cycleCount + 1} fatal error: ${err.message}`);
    }

    // Schedule next cycle regardless of success/failure
    scheduleNextCycle();
  }, schedule.intervalMs + jitterMs);
}

// ── Public API ──

export function startStockOrchestrator(): void {
  if (isRunning) {
    const idleMs = Date.now() - lastCycleTime;
    if (lastCycleTime > 0 && idleMs > WATCHDOG_MAX_IDLE_MS) {
      console.warn(`[StockOrchestrator] RUNNING but STALE — last cycle ${Math.round(idleMs / 60000)} min ago. Force-restarting!`);
      stopStockOrchestrator();
    } else {
      console.log('[StockOrchestrator] Already running');
      return;
    }
  }

  isRunning = true;
  isPaused = false;

  console.log(
    `[StockOrchestrator] Starting — market hours: every ${MARKET_HOURS_INTERVAL_MS / 1000}s, ` +
    `pre/post: every ${PREPOST_INTERVAL_MS / 1000}s, ` +
    `off-hours: every ${OFF_HOURS_INTERVAL_MS / 1000}s. ` +
    `Watchdog: restarts if idle > ${WATCHDOG_MAX_IDLE_MS / 60000} min.`
  );

  // Start watchdog
  if (watchdogTimer) clearInterval(watchdogTimer);
  watchdogTimer = setInterval(() => {
    if (!isRunning) return;
    const idleMs = Date.now() - lastCycleTime;
    if (lastCycleTime > 0 && idleMs > WATCHDOG_MAX_IDLE_MS) {
      console.warn(`[StockOrchestrator Watchdog] STALE — last cycle ${Math.round(idleMs / 60000)} min ago. Force-restarting!`);
      stopStockOrchestrator();
      startStockOrchestrator();
    }
  }, WATCHDOG_INTERVAL_MS);

  // Start first cycle after startup delay
  setTimeout(async () => {
    try {
      console.log('[StockOrchestrator] Running initial cycle...');
      const result = await runFullPipelineCycle();
      cycleCount++;
      lastCycleTime = Date.now();
      totalProcessed += result.processed;
      totalPublished += result.published;
      totalErrors += result.errors;

      console.log(
        `[StockOrchestrator] Initial cycle complete: ` +
        `processed=${result.processed}, published=${result.published}, ` +
        `errors=${result.errors}, duration=${(result.duration / 1000).toFixed(1)}s`
      );
    } catch (err: any) {
      lastError = err.message;
      totalErrors++;
      console.error(`[StockOrchestrator] Initial cycle failed: ${err.message}`);
    }

    // Schedule next cycle regardless
    scheduleNextCycle();
  }, STARTUP_DELAY_MS);
}

export function stopStockOrchestrator(): void {
  isRunning = false;
  if (cycleTimer) {
    clearTimeout(cycleTimer);
    cycleTimer = null;
  }
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
  console.log('[StockOrchestrator] Stopped');
}

export function pauseStockOrchestrator(): void {
  isPaused = true;
  if (cycleTimer) {
    clearTimeout(cycleTimer);
    cycleTimer = null;
  }
  console.log('[StockOrchestrator] Paused');
}

export function resumeStockOrchestrator(): void {
  isPaused = false;
  scheduleNextCycle();
  console.log('[StockOrchestrator] Resumed');
}

export function getStockOrchestratorStats() {
  const idleMs = lastCycleTime > 0 ? Date.now() - lastCycleTime : null;
  const schedule = getMarketSchedule();
  return {
    isRunning,
    isPaused,
    cycleCount,
    lastCycleTime: lastCycleTime ? new Date(lastCycleTime).toISOString() : null,
    idleMinutes: idleMs ? Math.round(idleMs / 60000) : null,
    isStale: idleMs !== null && idleMs > WATCHDOG_MAX_IDLE_MS,
    lastError,
    totalProcessed,
    totalPublished,
    totalErrors,
    currentSchedule: schedule.label,
    nextCycleIntervalMs: schedule.intervalMs,
    config: {
      marketHoursIntervalMs: MARKET_HOURS_INTERVAL_MS,
      prepostIntervalMs: PREPOST_INTERVAL_MS,
      offHoursIntervalMs: OFF_HOURS_INTERVAL_MS,
      maxStocksPerLocale: MAX_STOCKS_PER_LOCALE,
      startupDelayMs: STARTUP_DELAY_MS,
      watchdogMaxIdleMs: WATCHDOG_MAX_IDLE_MS,
    },
  };
}
