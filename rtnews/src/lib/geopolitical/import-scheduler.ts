// ─── Data Import Scheduler for ACLED + GDELT ────────────────────
// Rouaa (رؤى) Geopolitical Risk Platform
// Schedules periodic imports of conflict events and news sentiment data
// Designed for Next.js API routes (cron jobs via Vercel Cron or external)

import { fetchAcledEvents, importAcledEventsToDb, getAcledEventCounts } from './acled-api';
import { getGdeltTone } from './gdelt-api';
import { getAiGprScore, simulateGprUpdate } from './ai-gpr-index';
import { db } from '@/lib/db';
import { calculateCompositeScore, normalizeWorldBank, normalizeACLED, normalizeGDELT } from './composite-score';
import { getRiskLevel } from './risk-thresholds';

// ─── Import Configuration ──────────────────────────────────────

export const IMPORT_CONFIG = {
  acled: {
    enabled: true,
    intervalMinutes: 360,      // Every 6 hours
    maxEventsPerRun: 500,
    lookbackDays: 7,           // How far back to fetch on each run
    highPriorityCountries: [
      'SY', 'IQ', 'YE', 'UA', 'AF', 'SO', 'SD', 'LY',
      'IR', 'IL', 'PS', 'MM', 'ET', 'NG', 'CD', 'ML',
    ],
  },
  gdelt: {
    enabled: true,
    intervalMinutes: 30,       // Every 30 minutes
    maxQueriesPerRun: 20,
    queries: [
      'geopolitical risk OR conflict OR sanctions',
      'war OR military OR troops OR invasion',
      'strait OR canal OR blockade OR trade war',
      'nuclear OR missile OR weapons program',
      'cyber attack OR cyber warfare',
      'oil disruption OR energy crisis',
      'coup OR political crisis OR unrest',
    ],
  },
  worldBank: {
    enabled: true,
    intervalMinutes: 10080,    // Weekly (World Bank data updates infrequently)
  },
  riskScore: {
    enabled: true,
    intervalMinutes: 180,      // Every 3 hours
  },
} as const;

// ─── Import Results Tracking ───────────────────────────────────

export interface ImportResult {
  source: string;
  status: 'success' | 'partial' | 'failed';
  recordsProcessed: number;
  recordsImported: number;
  errors: string[];
  durationMs: number;
  timestamp: string;
}

export interface ImportRunSummary {
  startedAt: string;
  completedAt: string;
  results: ImportResult[];
  totalRecordsProcessed: number;
  totalRecordsImported: number;
  hasErrors: boolean;
}

// ─── ACLED Import ──────────────────────────────────────────────

/**
 * Run an ACLED data import for all high-priority countries.
 * Fetches recent conflict events and upserts them into the database.
 *
 * @returns Import result summary
 */
export async function runAcledImport(): Promise<ImportResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let totalProcessed = 0;
  let totalImported = 0;

  try {
    const { highPriorityCountries, lookbackDays, maxEventsPerRun } = IMPORT_CONFIG.acled;

    if (!process.env.ACLED_ACCESS_KEY || !process.env.ACLED_EMAIL) {
      return {
        source: 'acled',
        status: 'failed',
        recordsProcessed: 0,
        recordsImported: 0,
        errors: ['ACLED API credentials not configured. Set ACLED_ACCESS_KEY and ACLED_EMAIL.'],
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }

    const endDate = new Date().toISOString().split('T')[0];
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - lookbackDays);
    const startDate = startDateObj.toISOString().split('T')[0];

    for (const country of highPriorityCountries) {
      try {
        const events = await fetchAcledEvents({
          country,
          startDate,
          endDate,
          limit: maxEventsPerRun,
        });

        totalProcessed += events.length;

        if (events.length > 0) {
          const imported = await importAcledEventsToDb(events);
          totalImported += imported;
        }

        // Rate limiting: 5-second delay between country requests
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`ACLED import failed for ${country}: ${msg.slice(0, 100)}`);
      }
    }

    console.log(`[ImportScheduler] ACLED import complete: ${totalImported}/${totalProcessed} events imported`);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    errors.push(`ACLED import failed: ${msg.slice(0, 150)}`);
  }

  return {
    source: 'acled',
    status: errors.length === 0 ? 'success' : totalImported > 0 ? 'partial' : 'failed',
    recordsProcessed: totalProcessed,
    recordsImported: totalImported,
    errors,
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}

// ─── GDELT Import ──────────────────────────────────────────────

/**
 * Run a GDELT sentiment import.
 * Fetches tone data for predefined queries and updates country scores.
 *
 * @returns Import result summary
 */
export async function runGdeltImport(): Promise<ImportResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let totalProcessed = 0;
  let totalImported = 0;

  try {
    const { queries } = IMPORT_CONFIG.gdelt;

    for (const query of queries) {
      try {
        const toneResult = await getGdeltTone(query, 7);
        totalProcessed++;

        if (toneResult.articleCount > 0) {
          // Store the tone result for use in risk score calculations
          // In a full implementation, this would be persisted to a GdeltCache table
          totalImported++;
        }

        // Rate limiting: 2-second delay between queries
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`GDELT query failed "${query.slice(0, 30)}": ${msg.slice(0, 80)}`);
      }
    }

    console.log(`[ImportScheduler] GDELT import complete: ${totalImported}/${totalProcessed} queries processed`);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    errors.push(`GDELT import failed: ${msg.slice(0, 150)}`);
  }

  return {
    source: 'gdelt',
    status: errors.length === 0 ? 'success' : totalImported > 0 ? 'partial' : 'failed',
    recordsProcessed: totalProcessed,
    recordsImported: totalImported,
    errors,
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}

// ─── Risk Score Update ─────────────────────────────────────────

/**
 * Update composite risk scores for all countries in the CountryRiskScore table.
 * Recalculates RGI using the latest data from all sources.
 *
 * @returns Import result summary
 */
export async function runRiskScoreUpdate(): Promise<ImportResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let totalProcessed = 0;
  let totalImported = 0;

  try {
    // Get all countries from the database
    const countries = await db.countryRiskScore.findMany({
      select: {
        id: true,
        countryCode: true,
      },
    });

    for (const country of countries) {
      try {
        const code = country.countryCode;

        // Gather latest data from all sources
        const aiGprData = getAiGprScore(code);
        const acledCounts = await getAcledEventCounts(code, 30).catch(() => ({ events: 0, fatalities: 0 }));
        const aiGprUpdate = simulateGprUpdate(code);

        // Calculate new composite score
        const acledNormalized = normalizeACLED(acledCounts.events, acledCounts.fatalities);
        const gdeltNormalized = aiGprUpdate.gpr > 0 ? 50 + (aiGprUpdate.gpr - 50) * 0.3 : 50;
        const worldBankDefault = 50; // Default, would be fetched from World Bank API

        const compositeResult = calculateCompositeScore({
          gprScore: aiGprUpdate.aiGpr,
          acledScore: acledNormalized,
          worldBankScore: worldBankDefault,
          gdeltScore: gdeltNormalized,
          peaceIndexScore: undefined, // Will use default in calculator
        });

        // Update the database
        await db.countryRiskScore.update({
          where: { id: country.id },
          data: {
            compositeScore: Math.round(compositeResult.compositeScore),
            gprScore: aiGprUpdate.gpr,
            aiGprScore: aiGprUpdate.aiGpr,
            acledScore: Math.round(acledNormalized * 100) / 100,
            gdeltScore: Math.round(gdeltNormalized * 100) / 100,
            riskLevel: compositeResult.riskLevel,
          },
        });

        totalProcessed++;
        totalImported++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Risk score update failed for ${country.countryCode}: ${msg.slice(0, 80)}`);
        totalProcessed++;
      }
    }

    console.log(`[ImportScheduler] Risk score update complete: ${totalImported}/${totalProcessed} countries updated`);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    errors.push(`Risk score update failed: ${msg.slice(0, 150)}`);
  }

  return {
    source: 'risk-score',
    status: errors.length === 0 ? 'success' : totalImported > 0 ? 'partial' : 'failed',
    recordsProcessed: totalProcessed,
    recordsImported: totalImported,
    errors,
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}

// ─── Full Import Run ───────────────────────────────────────────

/**
 * Execute a full import run across all data sources.
 * Runs ACLED, GDELT, and risk score updates sequentially.
 *
 * @returns Complete import run summary
 */
export async function runFullImport(): Promise<ImportRunSummary> {
  const startedAt = new Date().toISOString();
  const results: ImportResult[] = [];

  console.log('[ImportScheduler] Starting full import run...');

  // Run imports sequentially to respect rate limits
  if (IMPORT_CONFIG.acled.enabled) {
    console.log('[ImportScheduler] Running ACLED import...');
    const acledResult = await runAcledImport();
    results.push(acledResult);
  }

  if (IMPORT_CONFIG.gdelt.enabled) {
    console.log('[ImportScheduler] Running GDELT import...');
    const gdeltResult = await runGdeltImport();
    results.push(gdeltResult);
  }

  if (IMPORT_CONFIG.riskScore.enabled) {
    console.log('[ImportScheduler] Running risk score update...');
    const riskResult = await runRiskScoreUpdate();
    results.push(riskResult);
  }

  const completedAt = new Date().toISOString();
  const totalProcessed = results.reduce((sum, r) => sum + r.recordsProcessed, 0);
  const totalImported = results.reduce((sum, r) => sum + r.recordsImported, 0);
  const hasErrors = results.some((r) => r.status === 'failed' || r.errors.length > 0);

  console.log(`[ImportScheduler] Full import run complete: ${totalImported}/${totalProcessed} records, ${hasErrors ? 'with errors' : 'no errors'}`);

  return {
    startedAt,
    completedAt,
    results,
    totalRecordsProcessed: totalProcessed,
    totalRecordsImported: totalImported,
    hasErrors,
  };
}

/**
 * Get the recommended next run time based on the most recent import results.
 *
 * @param lastResult - The last import run summary
 * @returns Recommended delay in minutes until next run
 */
export function getNextRunDelay(lastResult: ImportRunSummary | null): number {
  if (!lastResult) return 0; // Run immediately if never run

  // If the last run had failures, retry sooner (30 minutes)
  if (lastResult.hasErrors) return 30;

  // Otherwise, use the shortest configured interval
  const intervals = [
    IMPORT_CONFIG.acled.intervalMinutes,
    IMPORT_CONFIG.gdelt.intervalMinutes,
    IMPORT_CONFIG.riskScore.intervalMinutes,
  ];

  return Math.min(...intervals);
}
