// ─── News Bootstrap Endpoint V39 ──────────────────────────────────
// PUBLIC endpoint - NO authentication required.
// Called by docker-entrypoint.sh on server startup and by Railway cron.
//
// V39: Bootstrap NO LONGER fetches news directly!
// All fetching is done by the Pipeline Fetcher agent.
// Bootstrap only does:
//   1. Database cleanup (garbage contentAr, duplicate merging)
//   2. Slug migration
//   3. Trigger the pipeline (which handles fetch→translate→analyze→image→publish)
//
// This eliminates the DUAL CODE PATH problem that caused:
//   - saveNewsToDB resetting isPublished=false on published articles
//   - Race conditions between bootstrap and pipeline
//   - Different article creation logic between the two paths

import { NextResponse } from 'next/server';
import { ensureTablesExist } from '@/lib/db-init';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute max — bootstrap only fetches+saves, NO translation

// ── Text similarity function for duplicate contentAr detection ──
function computeSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const normalize = (s: string) => s.replace(/[\s\n\r]+/g, ' ').trim().slice(0, 2000).toLowerCase();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.length < 20 || nb.length < 20) return 0;

  // Bigram similarity (Dice coefficient)
  const bigrams = (s: string) => {
    const bg = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) bg.add(s.slice(i, i + 2));
    return bg;
  };
  const ba = bigrams(na);
  const bb = bigrams(nb);
  let intersection = 0;
  for (const b of ba) { if (bb.has(b)) intersection++; }
  return (2 * intersection) / (ba.size + bb.size);
}

// ── In-memory lock ──
let bootstrapRunning = false;
let bootstrapRunningSince = 0;
const BOOTSTRAP_LOCK_TIMEOUT = 2 * 60_000; // 2 minutes (bootstrap is now fast: ~30s)
let lastBootstrapStart = 0;
const BOOTSTRAP_MIN_INTERVAL = 20_000; // 20 seconds

// ── DB-based lock ──
async function acquireDBLock(lockKey: string, ttlMs: number = 300_000): Promise<boolean> {
  try {
    const now = new Date();

    // Step 1: Clean up any expired locks first
    try {
      const expiredThreshold = new Date(now.getTime() - ttlMs).toISOString();
      await db.siteSetting.deleteMany({
        where: {
          key: lockKey,
          value: { lt: expiredThreshold },
        },
      });
    } catch {}

    // Step 2: Try to find an existing lock
    const existing = await db.siteSetting.findUnique({ where: { key: lockKey } });

    if (existing) {
      const lockTime = new Date(existing.value).getTime();
      const lockAge = now.getTime() - lockTime;
      
      if (lockAge < ttlMs) {
        console.log(`[BootstrapLock] DB lock is ${Math.round(lockAge / 1000)}s old (TTL=${Math.round(ttlMs / 1000)}s) — cannot acquire`);
        return false;
      }
      
      console.warn(`[BootstrapLock] Taking over expired lock (${Math.round(lockAge / 1000)}s old)`);
      await db.siteSetting.update({
        where: { key: lockKey },
        data: { value: now.toISOString() },
      });
      return true;
    }

    // Step 3: No existing lock — create one
    await db.siteSetting.create({ data: { key: lockKey, value: now.toISOString(), type: 'string', group: 'system' } });
    return true;
  } catch (err: any) {
    if (err.message?.includes('Unique') || err.message?.includes('unique')) {
      return false;
    }
    console.warn('[BootstrapLock] DB lock error, proceeding anyway:', err.message);
    return true;
  }
}

async function releaseDBLock(lockKey: string): Promise<void> {
  try { await db.siteSetting.delete({ where: { key: lockKey } }).catch(err => console.warn('[BootstrapLock] Failed to release lock:', err instanceof Error ? err.message : String(err))); } catch {}
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const forceUnlock = searchParams.get('force') === 'true';

  // ── Auto-clear stale locks ──
  try {
    const staleThreshold = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const staleLocks = await db.siteSetting.findMany({
      where: { key: { in: ['bootstrap-lock', 'cron:news:lock'] }, value: { lt: staleThreshold } },
    });
    if (staleLocks.length > 0) {
      console.log(`[Bootstrap] Auto-clearing ${staleLocks.length} stale locks (>6 min old)`);
      for (const lock of staleLocks) {
        await db.siteSetting.delete({ where: { key: lock.key } }).catch(err => console.warn('[BootstrapLock] Failed to clear stale lock:', err instanceof Error ? err.message : String(err)));
      }
    }
  } catch {}

  // ── Force-unlock ──
  if (forceUnlock) {
    console.log('[Bootstrap] Force unlock requested — BYPASSING ALL LOCKS');
    bootstrapRunning = false;
    try { await db.siteSetting.deleteMany({ where: { key: { in: ['bootstrap-lock', 'cron:news:lock'] } } }); } catch {}
  } else {
    if (bootstrapRunning) {
      const lockAge = Date.now() - bootstrapRunningSince;
      if (lockAge < BOOTSTRAP_LOCK_TIMEOUT) {
        return NextResponse.json({ message: `Bootstrap already running (${Math.round(lockAge / 1000)}s ago)`, timestamp: new Date().toISOString() });
      }
      bootstrapRunning = false;
    }
    if (Date.now() - lastBootstrapStart < BOOTSTRAP_MIN_INTERVAL) {
      return NextResponse.json({ message: 'Bootstrap too recent', timestamp: new Date().toISOString() });
    }

    // CRITICAL FIX: Ensure tables exist BEFORE trying to acquire DB lock.
    // Previously, acquireDBLock ran before ensureTablesExist, causing
    // site_settings table-not-found errors on fresh deployments.
    // This was locking bootstrap permanently on first run.
    const tablesReadyForLock = await ensureTablesExist();
    if (!tablesReadyForLock) {
      return NextResponse.json({ error: 'Database tables not available', timestamp: new Date().toISOString() }, { status: 503 });
    }

    const dbLock = await acquireDBLock('bootstrap-lock');
    if (!dbLock) {
      return NextResponse.json({ message: 'Bootstrap locked by another instance', timestamp: new Date().toISOString() });
    }
  }

  bootstrapRunning = true;
  bootstrapRunningSince = Date.now();
  lastBootstrapStart = Date.now();

  try {
    // Tables are ensured before we get here (in the lock acquisition section above).
    // This call is a no-op if tables already exist, but handles the forceUnlock path.
    const tablesReady = await ensureTablesExist();
    if (!tablesReady) {
      return NextResponse.json({ error: 'Database tables not available', timestamp: new Date().toISOString() }, { status: 503 });
    }

    const results: any = {
      live: { status: 'pending', items: 0, saved: 0 },
      breaking: { status: 'pending', items: 0, saved: 0 },
      duplicateCleanup: { removed: 0 },
      slugMigration: { updated: 0 },
      markedReady: 0,
    };

    // ── PHASE 0a: V36 — Clean GARBAGE contentAr from old pipeline ──
    // The old pipeline loaded full HTML pages and "translated" navigation menus.
    // V36 clears this garbage so the new pipeline can generate proper content.
    // GOLDEN RULE: Only clear contentAr for UNPUBLISHED articles.
    // Published articles are NEVER modified.
    try {
      const garbageCleanup = await db.$executeRawUnsafe(`
        UPDATE news_items
        SET "contentAr" = NULL,
            "processingStage" = 'fetched',
            "retryCount" = 0,
            "lastError" = NULL,
            "updatedAt" = NOW()
        WHERE "isReady" = false
          AND "contentAr" IS NOT NULL
          AND LENGTH("contentAr") > 50
          AND (
            "contentAr" LIKE '%تجاوز التنقل%'
            OR "contentAr" LIKE '%تخطى إلى التنقل%'
            OR "contentAr" LIKE '%تخطي المحتوى%'
            OR "contentAr" LIKE '%الرئيسية%الأخبار%الرياضة%'
            OR "contentAr" LIKE '%أسواق الولايات المتحدة%أسواق أوروبا%'
            OR "contentAr" LIKE '%الأكثر نشاطاً%'
            OR "contentAr" LIKE '%تخطى إلى المحتوى الرئيسي%'
            OR "contentAr" LIKE '%سجّل الدخول%'
            OR "contentAr" LIKE '%قائمة المراقبة%'
            OR "contentAr" LIKE '%مُحول العملات%'
          )
      `);
      if (garbageCleanup > 0) {
        console.log(`[Bootstrap] V36: ✓ Cleared garbage contentAr from ${garbageCleanup} unpublished articles`);
      }
    } catch (cleanupErr: any) {
      console.warn('[Bootstrap] V36 garbage cleanup failed (non-critical):', cleanupErr.message?.slice(0, 100));
    }

    // ── PHASE 0a2: V36 — Backfill contentAr for UNPUBLISHED articles that lack it ──
    // Published articles are NEVER modified (golden rule).
    // Only unpublished articles get backfilled so the pipeline can process them.
    try {
      const articlesNeedingContentAr = await db.$queryRawUnsafe(`
        SELECT id, "titleAr", summary, title, category
        FROM news_items
        WHERE "isReady" = false
          AND ("contentAr" IS NULL OR "contentAr" = '' OR LENGTH("contentAr") < 200)
          AND summary IS NOT NULL
          AND LENGTH(summary) > 10
          AND "titleAr" IS NOT NULL
        ORDER BY "fetchedAt" DESC
        LIMIT 5
      `) as any[];

      if (articlesNeedingContentAr.length > 0) {
        console.log(`[Bootstrap] V36: Found ${articlesNeedingContentAr.length} unpublished articles needing contentAr — backfilling...`);
        const { chatCompletion } = await import('@/lib/ai-provider');
        let backfilled = 0;

        for (const article of articlesNeedingContentAr) {
          try {
            const title = article.title || '';
            const summary = article.summary || '';
            const category = article.category || 'اقتصاد كلي';

            const result = await Promise.race([
              chatCompletion(
                [
                  {
                    role: 'system',
                    content: 'أنت صحفي مالي محترف في منصة "رؤى". بناءً على العنوان والملخص الإنجليزي التاليين، اكتب خبراً صحفياً بالعربية يتكون من 4-6 فقرات. يجب أن يكون الخبر بأسلوب صحفي مهني. اكتب الخبر فقط بدون أي شرح أو عناوين فرعية.',
                  },
                  {
                    role: 'user',
                    content: `العنوان: ${title}\nالملخص: ${summary}\nالتصنيف: ${category}`,
                  },
                ],
                { temperature: 0.3, maxTokens: 2000, priority: 'translation' }  // V54: Auto-select best available provider
              ),
              new Promise((_, reject) => setTimeout(() => reject(new Error('V36 backfill timeout')), 45000))
            ]) as any;

            const content = result.content?.trim() || '';
            if (content.length > 200 && /[\u0600-\u06FF]/.test(content)) {
              await db.newsItem.update({
                where: { id: article.id },
                data: {
                  contentAr: content,
                  processingStage: 'content_loaded', // Ready for next stage
                },
              });
              backfilled++;
              console.log(`[Bootstrap] V36: ✓ Backfilled contentAr for "${(article.titleAr || '').slice(0, 40)}..." (${content.length} chars)`);
            }
          } catch (err: any) {
            console.warn(`[Bootstrap] V36: Failed to backfill article ${article.id}: ${err.message?.slice(0, 80)}`);
          }
        }
        console.log(`[Bootstrap] V36: ✓ Backfilled contentAr for ${backfilled}/${articlesNeedingContentAr.length} articles`);
      }
    } catch (backfillErr: any) {
      console.warn('[Bootstrap] V36 contentAr backfill failed (non-critical):', backfillErr.message?.slice(0, 100));
    }

    // ── PHASE 0b: MERGE duplicate URLs — NO MORE DELETION ──
    // V12 CRITICAL FIX: Previously this code DELETED duplicate articles.
    // This caused the "old articles disappear when new ones are added" bug.
    // Now we MERGE data instead of deleting. If an article with the same URL
    // exists as both "live" and "breaking", we keep BOTH but merge their data.
    // The only cleanup is: if the EXACT same URL has duplicate entries with
    // the same newsType, we merge into the best one and delete only the true duplicates.
    try {
      const duplicateUrls = await db.$queryRaw<Array<{ url: string; cnt: bigint }>>`
        SELECT url, COUNT(*) as cnt FROM news_items WHERE url != '' AND url IS NOT NULL
        GROUP BY url HAVING COUNT(*) > 1 LIMIT 100
      `;
      if (duplicateUrls.length > 0) {
        console.log(`[Bootstrap] V25: Found ${duplicateUrls.length} duplicate URLs — MERGING (published articles are NEVER deleted)`);
        let merged = 0;
        for (const dup of duplicateUrls) {
          try {
            const items = await db.newsItem.findMany({
              where: { url: dup.url },
              orderBy: [{ fetchedAt: 'desc' }],
            });
            if (items.length > 1) {
              // V12: Merge data from ALL duplicates into the BEST one.
              // Score: isReady=1000, generatedImage=500, aiAnalysis=200, titleAr=100, summaryAr=50
              const scored = items.map(item => ({
                item,
                score: (item.isReady ? 1000 : 0)
                      + (item.generatedImage ? 500 : 0)
                      + (item.aiAnalysis ? 200 : 0)
                      + (item.titleAr ? 100 : 0)
                      + (item.summaryAr ? 50 : 0),
              }));
              scored.sort((a, b) => b.score - a.score);
              const keeper  = scored[0].item;

              // Merge best data from ALL items into the keeper
              const keeperUpdates: any = {};
              for (const { item } of scored.slice(1)) {
                if (item.titleAr && !keeper.titleAr)           keeperUpdates.titleAr = item.titleAr;
                if (item.summaryAr && !keeper.summaryAr)       keeperUpdates.summaryAr = item.summaryAr;
                if (item.contentAr && !keeper.contentAr)       keeperUpdates.contentAr = item.contentAr;
                if (item.aiAnalysis && !keeper.aiAnalysis)     keeperUpdates.aiAnalysis = item.aiAnalysis;
                if (item.generatedImage && !keeper.generatedImage) keeperUpdates.generatedImage = item.generatedImage;
                if (item.slug && !keeper.slug)                 keeperUpdates.slug = item.slug;
                if (item.isReady && !keeper.isReady)           { keeperUpdates.isReady = true; keeperUpdates.isPublished = true; keeperUpdates.processingStage = 'imaged'; }
              }
              if (Object.keys(keeperUpdates).length > 0) {
                await db.newsItem.update({ where: { id: keeper.id }, data: keeperUpdates });
              }
              
              // V39: NEVER delete ANY articles — not even unpublished duplicates.
              // The old approach deleted unpublished same-type duplicates, but this caused
              // articles to disappear during processing. Even if an article is unpublished,
              // the pipeline might be actively working on it. Deletion causes data loss.
              // Instead, just merge data and leave both articles. The duplicate will be
              // ignored by the pipeline if the primary article is published.
              // 
              // If both duplicates are unpublished, the pipeline will process whichever
              // one it picks first and the other will eventually get permanently-failed
              // status after max retries — but it won't be deleted.
              const toMarkFailed = scored.slice(1).filter(s => {
                // Only mark (not delete) unpublished same-type duplicates
                if (s.item.isReady) return false; // Never touch published articles
                return s.item.newsType === keeper.newsType;
              });
              
              if (toMarkFailed.length > 0) {
                // Mark duplicates as permanently failed instead of deleting them
                const failedIds = toMarkFailed.map(s => s.item.id);
                await db.newsItem.updateMany({
                  where: {
                    id: { in: failedIds },
                    isReady: false,
                    isPublished: false,
                  },
                  data: {
                    retryCount: 999, // Beyond max — will never be picked up again
                    lastError: 'Duplicate of keeper article — permanently skipped',
                    processingStage: 'fetched',
                  },
                });
                merged += toMarkFailed.length;
              }
            }
          } catch {}
        }
        results.duplicateCleanup = { removed: merged };
        console.log(`[Bootstrap] V39: ✓ Merged ${merged} unpublished same-type duplicates (marked as failed, NOT deleted)`);
      }
    } catch (dupErr: any) {
      console.warn('[Bootstrap] Duplicate cleanup failed (non-critical):', dupErr.message?.slice(0, 100));
    }

    // ── PHASE 0b: Migrate slugs for items without one ──
    try {
      const { generateSlug } = await import('@/lib/slug');
      const itemsWithoutSlug = await db.newsItem.findMany({ where: { slug: null }, select: { id: true, titleAr: true, title: true } });
      if (itemsWithoutSlug.length > 0) {
        let slugUpdated = 0;
        for (const item of itemsWithoutSlug) {
          try {
            const slug = generateSlug(item.titleAr || item.title);
            if (!slug) continue;
            const existing = await db.newsItem.findFirst({ where: { slug, id: { not: item.id } } });
            const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;
            await db.newsItem.update({ where: { id: item.id }, data: { slug: finalSlug } });
            slugUpdated++;
          } catch {}
        }
        results.slugMigration = { updated: slugUpdated };
      }
      // Clean "العنوان:" prefixes
      const itemsWithPrefix = await db.newsItem.findMany({ where: { titleAr: { startsWith: 'العنوان:' } }, select: { id: true, titleAr: true } });
      for (const item of itemsWithPrefix) {
        try {
          const cleanTitle = item.titleAr!.replace(/^(العنوان|عنوان)\s*:\s*/, '').trim();
          if (cleanTitle && /[\u0600-\u06FF]/.test(cleanTitle)) await db.newsItem.update({ where: { id: item.id }, data: { titleAr: cleanTitle } });
        } catch {}
      }
    } catch {}

    // ── PHASE 1 & 2: REMOVED — V39: No more direct fetching from bootstrap!
    // Previously, bootstrap used saveNewsToDB to fetch and save news directly,
    // creating a DUAL code path with the pipeline fetcher. This caused:
    //   1. Different article creation logic between the two paths
    //   2. saveNewsToDB resetting isPublished=false on published articles
    //   3. Race conditions between bootstrap and the pipeline
    // Now, bootstrap ONLY triggers the pipeline, which handles ALL fetching
    // through its own fetcher agent. This is the SINGLE source of truth.
    results.live = { status: 'delegated_to_pipeline', items: 0, saved: 0 };
    results.breaking = { status: 'delegated_to_pipeline', items: 0, saved: 0 };
    console.log('[Bootstrap] V39: Skipping direct fetch — pipeline fetcher handles all news fetching.');

    // ── PHASE 3: REMOVED bulkMarkAllReady from bootstrap ──
    // No articles can be ready at this point — they haven't been translated or analyzed yet.
    // The ?action=images cron calls bulkMarkAllReady after image generation.
    results.markedReady = 0;
    console.log('[Bootstrap] ✓ Fetch+save complete. Translation+analysis queued for process cron.');

    // ── PHASE 4: Trigger agent-based pipeline in background (fire-and-forget) ──
    // The orchestrator handles ALL processing (translate + analyze + image + publish).
    // We trigger it now for faster results instead of waiting for the next cycle.
    try {
      const port = process.env.PORT || 8080;
      const triggerUrl = process.env.RAILWAY_PRIVATE_DOMAIN
        ? `http://${process.env.RAILWAY_PRIVATE_DOMAIN}:${port}/api/news/cron?action=trigger`
        : `http://localhost:${port}/api/news/cron?action=trigger`;
      // V48: Use INTERNAL_SECRET instead of hardcoded 'rouaa-cron'
      const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
      fetch(triggerUrl, { headers: { 'x-internal': internalSecret }, signal: AbortSignal.timeout(3000) }).catch(err => console.warn('[Bootstrap] Pipeline trigger failed:', err instanceof Error ? err.message : String(err)));
      console.log('[Bootstrap] ✓ Triggered agent-based pipeline');
    } catch {}

    // ── PHASE 5: Fix any articles that are isReady=true but missing Arabic content ──
    try {
      const port = process.env.PORT || 8080;
      const fixUrl = process.env.RAILWAY_PRIVATE_DOMAIN
        ? `http://${process.env.RAILWAY_PRIVATE_DOMAIN}:${port}/api/news/fix-unready`
        : `http://localhost:${port}/api/news/fix-unready`;
      // V48: Use INTERNAL_SECRET instead of hardcoded 'rouaa-cron'
      const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
      fetch(fixUrl, { headers: { 'x-internal': internalSecret }, signal: AbortSignal.timeout(3000) }).catch(err => console.warn('[Bootstrap] Fix-unready trigger failed:', err instanceof Error ? err.message : String(err)));
      console.log('[Bootstrap] ✓ Triggered fix-unready check');
    } catch {}

    const duration = Date.now() - startTime;
    console.log(`[Bootstrap] ✓ Completed in ${duration}ms (AI processing triggered separately)`);
    return NextResponse.json({ success: true, results, duration: `${duration}ms`, timestamp: new Date().toISOString() });

  } catch (error: any) {
    console.error('[Bootstrap] Error:', error);
    return NextResponse.json({ error: error.message, timestamp: new Date().toISOString() }, { status: 500 });
  } finally {
    bootstrapRunning = false;
    await releaseDBLock('bootstrap-lock');
  }
}

// Also support POST
export async function POST(request: Request) {
  return GET(request);
}
