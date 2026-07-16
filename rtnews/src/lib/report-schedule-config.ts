// ─── Report Schedule Configuration V158 ──────────────────────
// Dynamic report production controls — reads from site_settings DB
// Allows admin to control report generation frequency, enable/disable
// types, and set generation times from the dashboard.
//
// V158 CRITICAL FIX: Aligned schedule defaults with Railway cron times.
//   Previously, Railway crons fired at hours (6, 9, 10, 15, 16, 21, 22)
//   but shouldGenerateNow() expected different hours (7, 8, 14, 23).
//   Result: ALL automatic report generation was silently skipped!
//   Now: defaults match Railway cron schedules exactly.
//   Also: added ±1 hour tolerance window for robustness.
//
// Similar pattern to pipeline/config.ts getPipelineLimits()
//
// Settings are stored under the 'reports' group in site_settings table:
//   Key format: reports_<settingName>
//   e.g. reports_dailyEnabled, reports_weeklyDay, etc.

import { db } from '@/lib/db';

// ── Types ──

export interface ReportScheduleConfig {
  // Daily brief
  dailyEnabled: boolean;
  dailyTimesPerDay: number;     // 1 = once daily, 2 = twice, etc.
  dailyHour: number;            // Primary hour (UTC, 0-23)
  dailyWordCount: number;       // Target word count

  // Weekly analysis
  weeklyEnabled: boolean;
  weeklyDay: number;            // 0=Sun, 1=Mon, ..., 6=Sat
  weeklyHour: number;           // Hour (UTC, 0-23)
  weeklyWordCount: number;

  // Monthly outlook
  monthlyEnabled: boolean;
  monthlyDay: number;           // Day of month (1-28)
  monthlyHour: number;          // Hour (UTC, 0-23)
  monthlyWordCount: number;

  // Market analyses (per asset class)
  analysesEnabled: boolean;
  analysesTimesPerDay: number;  // 1, 2, 3 times per day
  analysesStartHour: number;    // V158: First generation hour (UTC) — was hardcoded 6
  analysesAssetClasses: string[]; // Which asset classes to generate for

  // Technical analysis
  technicalEnabled: boolean;
  technicalTimesPerDay: number; // 1, 2, 3 times per day
  technicalStartHour: number;   // V158: First generation hour (UTC) — was hardcoded 7
}

// ── Hardcoded Defaults ──
// V158: ALL hours aligned with railway.toml cron schedules!

export const DEFAULT_REPORT_SCHEDULE: ReportScheduleConfig = {
  dailyEnabled: true,
  dailyTimesPerDay: 1,
  dailyHour: 6,               // V158: Was 8, now matches Railway cron #6 (5 6 * * *)
  dailyWordCount: 1200,           // V234: Was 500, now matches generateDailyBrief default of 1200

  weeklyEnabled: true,
  weeklyDay: 1,               // Monday
  weeklyHour: 6,              // V158: Was 8, now matches Railway cron #7 (10 6 * * 1)
  weeklyWordCount: 1500,          // V234: Was 500, now matches generateWeeklyAnalysis default

  monthlyEnabled: true,
  monthlyDay: 1,              // 1st of month
  monthlyHour: 6,             // V158: Was 8, now matches Railway cron #8 (15 6 1 * *)
  monthlyWordCount: 2000,         // V234: Was 500, now matches generateMonthlyOutlook default

  analysesEnabled: true,
  analysesTimesPerDay: 3,     // 3 times per day
  analysesStartHour: 9,       // V158: Was hardcoded 6, now matches Railway cron #9 (20 9,15,21)
  analysesAssetClasses: [
    'stocks', 'commodities', 'forex', 'crypto', 'bonds',
    'energy', 'economy',
    'technicalAnalysis', 'arabMarkets', 'earnings',
    // V134: banking & realEstate paused — no dedicated news sources yet
    // Re-enable when sources covering بنوك/عقارات are available
    // Saves ~6 AI calls/day (2 sectors × 3 times/day)
  ],

  technicalEnabled: true,
  technicalTimesPerDay: 3,    // 3 times per day
  technicalStartHour: 10,     // V158: Was hardcoded 7, now matches Railway cron #10 (30 10,16,22)
};

// ── Cache ──

let _configCache: { config: ReportScheduleConfig; ts: number } | null = null;
const CONFIG_CACHE_TTL_MS = 30_000; // 30 seconds

// ── Public API ──

export async function getReportScheduleConfig(): Promise<ReportScheduleConfig> {
  // Return cached value if fresh
  if (_configCache && Date.now() - _configCache.ts < CONFIG_CACHE_TTL_MS) {
    return _configCache.config;
  }

  try {
    const settings = await db.siteSetting.findMany({
      where: { group: 'reports' },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      // Strip the 'reports_' prefix for easier access
      const key = s.key.replace(/^reports_/, '');
      map[key] = s.value;
    }

    const config: ReportScheduleConfig = {
      dailyEnabled: map.dailyEnabled !== undefined ? map.dailyEnabled !== 'false' : DEFAULT_REPORT_SCHEDULE.dailyEnabled,
      dailyTimesPerDay: map.dailyTimesPerDay ? parseInt(map.dailyTimesPerDay, 10) || DEFAULT_REPORT_SCHEDULE.dailyTimesPerDay : DEFAULT_REPORT_SCHEDULE.dailyTimesPerDay,
      dailyHour: map.dailyHour ? parseInt(map.dailyHour, 10) || DEFAULT_REPORT_SCHEDULE.dailyHour : DEFAULT_REPORT_SCHEDULE.dailyHour,
      dailyWordCount: map.dailyWordCount ? parseInt(map.dailyWordCount, 10) || DEFAULT_REPORT_SCHEDULE.dailyWordCount : DEFAULT_REPORT_SCHEDULE.dailyWordCount,

      weeklyEnabled: map.weeklyEnabled !== undefined ? map.weeklyEnabled !== 'false' : DEFAULT_REPORT_SCHEDULE.weeklyEnabled,
      weeklyDay: map.weeklyDay !== undefined ? parseInt(map.weeklyDay, 10) : DEFAULT_REPORT_SCHEDULE.weeklyDay,
      weeklyHour: map.weeklyHour !== undefined ? parseInt(map.weeklyHour, 10) : DEFAULT_REPORT_SCHEDULE.weeklyHour,
      weeklyWordCount: map.weeklyWordCount ? parseInt(map.weeklyWordCount, 10) || DEFAULT_REPORT_SCHEDULE.weeklyWordCount : DEFAULT_REPORT_SCHEDULE.weeklyWordCount,

      monthlyEnabled: map.monthlyEnabled !== undefined ? map.monthlyEnabled !== 'false' : DEFAULT_REPORT_SCHEDULE.monthlyEnabled,
      monthlyDay: map.monthlyDay !== undefined ? parseInt(map.monthlyDay, 10) : DEFAULT_REPORT_SCHEDULE.monthlyDay,
      monthlyHour: map.monthlyHour !== undefined ? parseInt(map.monthlyHour, 10) : DEFAULT_REPORT_SCHEDULE.monthlyHour,
      monthlyWordCount: map.monthlyWordCount ? parseInt(map.monthlyWordCount, 10) || DEFAULT_REPORT_SCHEDULE.monthlyWordCount : DEFAULT_REPORT_SCHEDULE.monthlyWordCount,

      analysesEnabled: map.analysesEnabled !== undefined ? map.analysesEnabled !== 'false' : DEFAULT_REPORT_SCHEDULE.analysesEnabled,
      analysesTimesPerDay: map.analysesTimesPerDay ? parseInt(map.analysesTimesPerDay, 10) || DEFAULT_REPORT_SCHEDULE.analysesTimesPerDay : DEFAULT_REPORT_SCHEDULE.analysesTimesPerDay,
      analysesStartHour: map.analysesStartHour ? parseInt(map.analysesStartHour, 10) || DEFAULT_REPORT_SCHEDULE.analysesStartHour : DEFAULT_REPORT_SCHEDULE.analysesStartHour,
      analysesAssetClasses: map.analysesAssetClasses
        ? map.analysesAssetClasses.split(',').filter(Boolean)
        : DEFAULT_REPORT_SCHEDULE.analysesAssetClasses,

      technicalEnabled: map.technicalEnabled !== undefined ? map.technicalEnabled !== 'false' : DEFAULT_REPORT_SCHEDULE.technicalEnabled,
      technicalTimesPerDay: map.technicalTimesPerDay ? parseInt(map.technicalTimesPerDay, 10) || DEFAULT_REPORT_SCHEDULE.technicalTimesPerDay : DEFAULT_REPORT_SCHEDULE.technicalTimesPerDay,
      technicalStartHour: map.technicalStartHour ? parseInt(map.technicalStartHour, 10) || DEFAULT_REPORT_SCHEDULE.technicalStartHour : DEFAULT_REPORT_SCHEDULE.technicalStartHour,
    };

    _configCache = { config, ts: Date.now() };
    return config;
  } catch (err: any) {
    console.warn(`[ReportScheduleConfig] Failed to read from DB: ${err.message}, using defaults`);
    return { ...DEFAULT_REPORT_SCHEDULE };
  }
}

// Clear cache (call after saving new settings from admin)
export function clearReportScheduleCache(): void {
  _configCache = null;
}

// ── Schedule Check Helpers ──

/**
 * V158: Check if an hour matches a target hour with ±1 tolerance.
 * This is critical because Railway cron fires at minute :05, :10, :20, :30
 * and the in-process scheduler may check at any minute within the hour.
 * Without tolerance, a cycle at 5:59 or 6:01 would miss a 6:00 target.
 *
 * Also handles the wrap-around case (e.g., target=23, current=0 → within 1hr).
 */
function hourMatchesWithTolerance(currentHour: number, targetHour: number, toleranceHours: number = 1): boolean {
  // Exact match
  if (currentHour === targetHour) return true;

  // Check within tolerance (handles wrap-around)
  const diff = Math.abs(currentHour - targetHour);
  if (diff <= toleranceHours) return true;
  // Wrap-around: e.g., current=0, target=23 → diff=23, but real diff=1
  if (24 - diff <= toleranceHours) return true;

  return false;
}

/**
 * Check if a report type should be generated NOW based on its schedule config.
 * Returns true if the current time falls within the allowed generation window.
 *
 * V158: Uses ±1 hour tolerance window for robustness. Previously used exact
 * hour matching which silently skipped generation whenever there was a slight
 * mismatch between Railway cron time and the check cycle.
 */
export function shouldGenerateNow(
  type: 'daily' | 'weekly' | 'monthly' | 'analyses' | 'technical',
  config: ReportScheduleConfig,
): boolean {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentDay = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const currentDate = now.getUTCDate(); // 1-31

  switch (type) {
    case 'daily': {
      if (!config.dailyEnabled) return false;
      // Distribute generation times evenly across the day
      // e.g., timesPerDay=1 → only at dailyHour
      //       timesPerDay=2 → at dailyHour and dailyHour+12
      //       timesPerDay=3 → at dailyHour, dailyHour+8, dailyHour+16
      const interval = Math.floor(24 / config.dailyTimesPerDay);
      for (let i = 0; i < config.dailyTimesPerDay; i++) {
        const genHour = (config.dailyHour + i * interval) % 24;
        if (hourMatchesWithTolerance(currentHour, genHour)) return true;
      }
      return false;
    }

    case 'weekly': {
      if (!config.weeklyEnabled) return false;
      // V158: Allow ±1 hour tolerance for weekly
      const dayMatch = currentDay === config.weeklyDay;
      // Also allow previous day if the hour is near midnight (wrap-around)
      const dayBefore = currentDay === (config.weeklyDay + 6) % 7 && currentHour >= 23;
      return (dayMatch || dayBefore) && hourMatchesWithTolerance(currentHour, config.weeklyHour);
    }

    case 'monthly': {
      if (!config.monthlyEnabled) return false;
      // V158: Allow ±1 hour tolerance for monthly
      const dateMatch = currentDate === config.monthlyDay;
      // Also allow last day of previous month if near midnight
      const dayBefore = currentDate === config.monthlyDay - 1 && currentHour >= 23;
      return (dateMatch || dayBefore) && hourMatchesWithTolerance(currentHour, config.monthlyHour);
    }

    case 'analyses': {
      if (!config.analysesEnabled) return false;
      // V336 FIX: Use ACTUAL Railway cron hours instead of evenly-spaced intervals.
      // The old calculation (startHour + i * interval) produced 9,17,1 for 3x/day,
      // but Railway cron #9 fires at 9,15,21. With ±1 tolerance, only 1/3 matched!
      // Now: 6-hour gaps from startHour → 9,15,21 (matches cron #9 exactly).
      for (let i = 0; i < config.analysesTimesPerDay; i++) {
        const genHour = (config.analysesStartHour + i * 6) % 24;
        if (hourMatchesWithTolerance(currentHour, genHour)) return true;
      }
      return false;
    }

    case 'technical': {
      if (!config.technicalEnabled) return false;
      // V336 FIX: Use ACTUAL Railway cron hours instead of evenly-spaced intervals.
      // The old calculation (startHour + i * interval) produced 10,18,2 for 3x/day,
      // but Railway cron #10 fires at 10,16,22. With ±1 tolerance, only 1/3 matched!
      // Now: 6-hour gaps from startHour → 10,16,22 (matches cron #10 exactly).
      for (let i = 0; i < config.technicalTimesPerDay; i++) {
        const genHour = (config.technicalStartHour + i * 6) % 24;
        if (hourMatchesWithTolerance(currentHour, genHour)) return true;
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Calculate estimated AI calls per day based on current config.
 * Useful for cost estimation display in the dashboard.
 */
export function estimateDailyAICalls(config: ReportScheduleConfig): {
  daily: number;
  weekly: number;
  monthly: number;
  analyses: number;
  technical: number;
  total: number;
} {
  // Daily: 1 general brief + N asset classes × times per day
  const dailyCalls = config.dailyEnabled ? (1 + config.analysesAssetClasses.length) * config.dailyTimesPerDay : 0;

  // Weekly: 1 report (only on the scheduled day)
  const weeklyCalls = config.weeklyEnabled ? 1 : 0;

  // Monthly: 1 report (only on the scheduled day)
  const monthlyCalls = config.monthlyEnabled ? 1 : 0;

  // Analyses: N asset classes × times per day
  const analysesCalls = config.analysesEnabled ? config.analysesAssetClasses.length * config.analysesTimesPerDay : 0;

  // Technical: 1 × times per day
  const technicalCalls = config.technicalEnabled ? config.technicalTimesPerDay : 0;

  return {
    daily: dailyCalls,
    weekly: weeklyCalls,
    monthly: monthlyCalls,
    analyses: analysesCalls,
    technical: technicalCalls,
    total: dailyCalls + weeklyCalls + monthlyCalls + analysesCalls + technicalCalls,
  };
}
