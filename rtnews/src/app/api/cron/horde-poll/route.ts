// ── V261: Stable Horde Background Image Poller ────────────────────
// Cron endpoint that checks pending Stable Horde generations and
// replaces Canvas images with AI-generated images when ready.
//
// Trigger: Every 5 minutes via Railway cron (cron #23 in railway.toml).
// URL: /api/cron/horde-poll
//
// Auth: Same as other cron endpoints — x-internal header or ?secret= param.
//
// Flow:
// 1. Find articles with lastError = "HORDE_PENDING:<generationId>"
// 2. Poll each Stable Horde generation
// 3. If done: download AI image → upload to R2 → replace Canvas image
// 4. If faulted/timeout: clear the marker
// 5. Also cleans up stale HORDE_PENDING markers older than 30 minutes

import { NextRequest, NextResponse } from 'next/server';
import { getPendingHordeGenerations, pollAndReplaceHordeImage } from '@/lib/pipeline/agents/imager';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min max for Railway

// Verify internal/cron auth — same pattern as raqeeb and other cron endpoints
function verifyAuth(request: Request): boolean {
  const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
  if (!internalSecret) return true; // No secret configured — allow (dev mode)
  const headerSecret = request.headers.get('x-internal');
  const urlSecret = new URL(request.url).searchParams.get('secret');
  return headerSecret === internalSecret || urlSecret === internalSecret;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Auth check — same as all other cron endpoints
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    console.log('[Horde Poll V261] Starting background image replacement poll...');

    // Find all articles with pending Stable Horde generations
    const pending = await getPendingHordeGenerations();

    if (pending.length === 0) {
      return NextResponse.json({
        status: 'idle',
        message: 'No pending Stable Horde generations',
        duration: Date.now() - startTime,
      });
    }

    console.log(`[Horde Poll V261] Found ${pending.length} pending generations`);

    // Poll each one (sequentially to avoid rate limiting)
    const results = {
      replaced: 0,
      stillWaiting: 0,
      failed: 0,
      details: [] as Array<{ articleId: string; status: string }>,
    };

    for (const { articleId, generationId } of pending) {
      try {
        const replaced = await pollAndReplaceHordeImage(articleId, generationId);
        if (replaced) {
          results.replaced++;
          results.details.push({ articleId, status: 'replaced' });
        } else {
          results.stillWaiting++;
          results.details.push({ articleId, status: 'waiting' });
        }
      } catch (err: any) {
        results.failed++;
        results.details.push({ articleId, status: `error: ${err.message?.slice(0, 50)}` });
      }
    }

    // Cleanup: Clear stale HORDE_PENDING markers older than 60 minutes
    // V312: Increased from 30→60 min — Stable Horde can take 10-45+ min depending on load
    try {
      const sixtyMinAgo = new Date(Date.now() - 60 * 60 * 1000);
      const staleArticles = await db.newsItem.findMany({
        where: {
          lastError: { startsWith: 'HORDE_PENDING:' },
          updatedAt: { lt: sixtyMinAgo },
        },
        select: { id: true },
        take: 20,
      });

      if (staleArticles.length > 0) {
        // Use updateMany to clear stale markers
        const staleIds = staleArticles.map(a => a.id);
        await db.newsItem.updateMany({
          where: { id: { in: staleIds } },
          data: { lastError: null },
        });
        console.log(`[Horde Poll V261] Cleaned up ${staleArticles.length} stale HORDE_PENDING markers`);
        results.failed += staleArticles.length;
      }
    } catch (cleanupErr: any) {
      console.warn(`[Horde Poll V261] Cleanup error: ${cleanupErr.message?.slice(0, 80)}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[Horde Poll V261] Done: ${results.replaced} replaced, ${results.stillWaiting} waiting, ${results.failed} failed (${duration}ms)`);

    return NextResponse.json({
      status: 'completed',
      ...results,
      duration,
      timestamp: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error(`[Horde Poll V261] Fatal error: ${err.message}`);
    return NextResponse.json({
      status: 'error',
      error: err.message,
      duration: Date.now() - startTime,
    }, { status: 500 });
  }
}
