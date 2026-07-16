// ─── Stock Analysis Cron Endpoint ────────────────────────────
// Triggered by Railway cron or external scheduler.
// Runs the stock analysis pipeline for all 5 locales sequentially (ar, en, fr, tr, es).
// Auth: x-internal header (matching all other cron endpoints) OR ?secret= param.
//
// V382: Added enforcement for maxStockCronRunsPerDay and maxStockAiCallsPerDay
// from admin dashboard settings. These were previously stored in DB but never
// checked — the admin could set them but they had no effect.

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Verify internal/cron auth — same pattern as raqeeb, horde-poll, and other cron endpoints
function verifyAuth(request: Request): boolean {
  const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
  // No secret configured — allow in dev mode
  if (!internalSecret) return true;

  // Check x-internal header (used by Railway cron via -H "x-internal: $SECRET")
  const headerSecret = request.headers.get('x-internal');
  if (headerSecret === internalSecret) return true;

  // Check ?secret= URL param (legacy support for direct invocations)
  const urlSecret = new URL(request.url).searchParams.get('secret');
  if (urlSecret === internalSecret) return true;

  // Also check CRON_SECRET for backward compatibility
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && urlSecret === cronSecret) return true;

  return false;
}

// V382: In-process tracking for daily cron run count and AI call count
// These prevent exceeding daily budgets even within a single Node.js process
let _dailyCronRuns = 0;
let _dailyAiCalls = 0;
let _dailyTrackingDate = ''; // YYYY-MM-DD

function resetDailyTrackingIfNeeded(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (_dailyTrackingDate !== today) {
    _dailyCronRuns = 0;
    _dailyAiCalls = 0;
    _dailyTrackingDate = today;
  }
}

export async function GET(req: NextRequest) {
  // Auth check — same as all other cron endpoints
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  resetDailyTrackingIfNeeded();

  const results: Record<string, { generated: number; published: number; errors: number }> = {};

  // ── V382: Read ALL stock settings from DB ──
  const urlParams = new URL(req.url).searchParams;
  const urlMaxStocks = urlParams.get('maxStocks') ? parseInt(urlParams.get('maxStocks')!, 10) : 0;

  let maxStocks = 9; // V381 default: 7 runs × 5 locales × 9 = 315 ≈ 300 AI calls/day
  let maxCronRunsPerDay = 7; // V382 default
  let maxAiCallsPerDay = 300; // V382 default

  try {
    const { db } = await import('@/lib/db');

    // Read maxStocksPerCronRun (V381)
    const stocksSetting = await db.siteSetting.findUnique({ where: { key: 'stock_maxStocksPerCronRun' } });
    if (stocksSetting?.value) {
      const dbValue = parseInt(stocksSetting.value, 10);
      if (dbValue > 0) maxStocks = dbValue;
    }

    // Read maxCronRunsPerDay (V382)
    const cronRunsSetting = await db.siteSetting.findUnique({ where: { key: 'stock_maxStockCronRunsPerDay' } });
    if (cronRunsSetting?.value) {
      const dbValue = parseInt(cronRunsSetting.value, 10);
      if (dbValue > 0) maxCronRunsPerDay = dbValue;
    }

    // Read maxAiCallsPerDay (V382)
    const aiCallsSetting = await db.siteSetting.findUnique({ where: { key: 'stock_maxStockAiCallsPerDay' } });
    if (aiCallsSetting?.value) {
      const dbValue = parseInt(aiCallsSetting.value, 10);
      if (dbValue > 0) maxAiCallsPerDay = dbValue;
    }

    // V382: Also count how many stock_analysis articles were already published today from DB
    // to estimate how many AI calls have been consumed
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const existingTodayCount = await db.newsItem.count({
      where: {
        newsType: 'stock_analysis',
        isPublished: true,
        publishedAt: { gte: todayStart },
      },
    });
    // Each published article ≈ 1 AI call. Add in-process tracking.
    _dailyAiCalls = Math.max(_dailyAiCalls, existingTodayCount);

  } catch (err: any) {
    console.warn(`[StockCron V382] Failed to read stock settings from DB, using defaults: ${err.message}`);
  }

  // Override maxStocks from URL param if provided
  if (urlMaxStocks > 0) {
    maxStocks = urlMaxStocks;
  }

  // ── V382: Check daily cron run limit ──
  if (_dailyCronRuns >= maxCronRunsPerDay) {
    console.warn(`[StockCron V382] Daily cron run limit reached: ${_dailyCronRuns}/${maxCronRunsPerDay}. Skipping.`);
    return NextResponse.json({
      success: false,
      reason: 'daily_cron_limit_reached',
      message: `تم بلوغ الحد اليومي لتشغيلات كرون الأسهم (${_dailyCronRuns}/${maxCronRunsPerDay}). يمكن تعديله من لوحة التحكم → الإعدادات → خط الإنتاج.`,
      cronRunsToday: _dailyCronRuns,
      maxCronRunsPerDay,
      results: {},
      total: { generated: 0, published: 0, errors: 0 },
      timestamp: new Date().toISOString(),
    });
  }

  // ── V382: Check daily AI call budget ──
  const potentialAiCalls = 5 * maxStocks; // 5 locales × maxStocks per locale
  if (_dailyAiCalls + potentialAiCalls > maxAiCallsPerDay) {
    // Only reduce maxStocks to fit within budget, or skip if no budget left
    const remainingAiBudget = maxAiCallsPerDay - _dailyAiCalls;
    if (remainingAiBudget <= 0) {
      console.warn(`[StockCron V382] Daily AI call budget exhausted: ${_dailyAiCalls}/${maxAiCallsPerDay}. Skipping.`);
      return NextResponse.json({
        success: false,
        reason: 'daily_ai_budget_exhausted',
        message: `تم استنفاد ميزانية نداءات AI اليومية للأسهم (${_dailyAiCalls}/${maxAiCallsPerDay}). يمكن تعديله من لوحة التحكم → الإعدادات → خط الإنتاج.`,
        aiCallsToday: _dailyAiCalls,
        maxAiCallsPerDay,
        results: {},
        total: { generated: 0, published: 0, errors: 0 },
        timestamp: new Date().toISOString(),
      });
    }
    // Reduce maxStocks to fit within remaining budget
    const adjustedMaxStocks = Math.floor(remainingAiBudget / 5); // 5 locales
    maxStocks = Math.max(1, adjustedMaxStocks);
    console.log(`[StockCron V382] AI budget limited: adjusting maxStocks from URL/DB to ${maxStocks} (remaining budget: ${remainingAiBudget})`);
  }

  // Increment daily cron run counter
  _dailyCronRuns++;

  // Run pipeline for each locale sequentially to avoid rate limits
  for (const locale of ['ar', 'en', 'fr', 'tr', 'es'] as const) {
    // V382: Check if we still have AI budget for this locale
    if (_dailyAiCalls >= maxAiCallsPerDay) {
      console.warn(`[StockCron V382] AI budget exhausted before ${locale}, skipping remaining locales.`);
      results[locale] = { generated: 0, published: 0, errors: 0 };
      continue;
    }

    try {
      console.log(`[StockCron] Starting pipeline for locale=${locale} (maxStocks=${maxStocks})`);
      const { runStockAnalysisPipeline } = await import('@/lib/pipeline/stock-analysis-pipeline');
      const result = await runStockAnalysisPipeline(locale, maxStocks);
      results[locale] = result;
      // V382: Track AI calls — each published article ≈ 1 AI call
      _dailyAiCalls += result.published || 0;
      console.log(`[StockCron] Completed locale=${locale}:`, result, `(total AI calls today: ${_dailyAiCalls}/${maxAiCallsPerDay})`);
    } catch (err: any) {
      console.error(`[StockCron] Failed for locale=${locale}:`, err.message);
      results[locale] = { generated: 0, published: 0, errors: 1 };
    }
  }

  const totalGenerated = Object.values(results).reduce((s, r) => s + r.generated, 0);
  const totalPublished = Object.values(results).reduce((s, r) => s + r.published, 0);
  const totalErrors = Object.values(results).reduce((s, r) => s + r.errors, 0);

  return NextResponse.json({
    success: true,
    results,
    total: { generated: totalGenerated, published: totalPublished, errors: totalErrors },
    budget: { // V382: Include budget info in response for monitoring
      aiCallsToday: _dailyAiCalls,
      maxAiCallsPerDay,
      cronRunsToday: _dailyCronRuns,
      maxCronRunsPerDay,
      maxStocksPerRun: maxStocks,
    },
    timestamp: new Date().toISOString(),
  });
}
