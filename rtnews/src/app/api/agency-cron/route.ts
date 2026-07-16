// ═══════════════════════════════════════════════════════════════
// Agency Cron Endpoint
// ═══════════════════════════════════════════════════════════════
// Triggers the agency service cycle. Called by Railway cron every
// 10 minutes. Also ensures the agency_events table exists (self-
// healing — no manual migration needed).
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runAgencyCycle, disconnectAgency } from '@/../services/news-agency/lib/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// V1205: Mutex to prevent concurrent agency cycles.
let agencyCycleRunning = false;


function isAuthorized(request: NextRequest): boolean {
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key');
  const internalHeader = request.headers.get('x-internal');

  const cronSecret = process.env.CRON_SECRET;
  const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;

  // Accept CRON_SECRET or 'ai-news-cron' (matching cron-ai pattern)
  if (queryKey && cronSecret && queryKey === cronSecret) return true;
  if (queryKey === 'ai-news-cron') return true;

  // Accept internal header
  if (internalHeader && internalSecret && internalHeader === internalSecret) return true;

  return false;
}

/**
 * Ensure agency_events table exists (self-healing migration).
 * Uses CREATE TABLE IF NOT EXISTS — safe to run every time.
 */
async function ensureAgencyTableExists(): Promise<void> {
  try {
    const prisma = db;
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS agency_events (
        id TEXT NOT NULL,
        "sourceId" TEXT NOT NULL,
        "externalId" TEXT NOT NULL,
        "sourceName" TEXT,
        url TEXT NOT NULL DEFAULT '',
        "eventType" TEXT NOT NULL,
        title TEXT NOT NULL,
        "rawContent" TEXT NOT NULL,
        category TEXT,
        "draftTitle" TEXT,
        "draftBody" TEXT,
        "draftSummary" TEXT,
        "llmProvider" TEXT,
        "internalContext" TEXT,
        status TEXT NOT NULL DEFAULT 'fetched',
        "retryCount" INTEGER NOT NULL DEFAULT 0,
        "lastError" TEXT,
        locale TEXT NOT NULL DEFAULT 'ar',
        "newsItemId" TEXT,
        "publishedAt" TIMESTAMP(3),
        "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT agency_events_pkey PRIMARY KEY (id)
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS agency_events_sourceId_externalId_key ON agency_events("sourceId", "externalId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS agency_events_status_createdAt_idx ON agency_events(status, "createdAt")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS agency_events_newsItemId_idx ON agency_events("newsItemId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS agency_events_category_idx ON agency_events(category)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS agency_events_publishedAt_idx ON agency_events("publishedAt")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS agency_events_locale_idx ON agency_events(locale)`);
    console.log('[AgencyCron] ✓ agency_events table ensured');
  } catch (err: any) {
    console.error('[AgencyCron] Failed to ensure agency_events table:', err.message?.slice(0, 100));
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const windowHours = parseInt(url.searchParams.get('hours') || '24', 10);
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  try {
    // Ensure table exists before running
    await ensureAgencyTableExists();

    // V1205: Check mutex — prevent concurrent cycles.
    if (agencyCycleRunning) {
      console.log('[AgencyCron] Cycle already running — skipping');
      return NextResponse.json({ success: true, message: 'Cycle already in progress — skipped', timestamp: new Date().toISOString() });
    }
    agencyCycleRunning = true;
    console.log('[AgencyCron] Triggered — running cycle in background...');

    // Fire and forget — don't await
    runAgencyCycle(since)
      .then((result) => {
        console.log(`[AgencyCron] ✓ Background cycle done: ${result.published} published, ${result.failed} failed`);
      })
      .catch((err) => {
        console.error(`[AgencyCron] Background cycle error: ${err.message?.slice(0, 200)}`);
      })
      .finally(() => {
        disconnectAgency().catch(() => {});
      });

    // Return immediately — cron curl gets fast response
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Agency cycle triggered in background',
      windowHours,
    });
  } catch (err: any) {
    console.error('[AgencyCron] Fatal error:', err.message);
    return NextResponse.json({
      success: false,
      error: err.message?.slice(0, 200),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
