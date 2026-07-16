// ─── News Cron API Route V48 ───────────────────────────────
// Manual cron trigger for pipeline operations.
// ?action=status | unlock | trigger | fetch | test | force-reset | fix-published | mark-ready

import { NextRequest, NextResponse } from 'next/server';
import { getOrchestratorStats, startOrchestrator, ensureRunning } from '@/lib/pipeline/orchestrator';
import { getQueueStats, resetStuckRetries, forceResetRecentFailed } from '@/lib/pipeline/queue/job-manager';
import { db } from '@/lib/db';
import { PIPELINE_CONFIG, getPipelineLimits } from '@/lib/pipeline/config';
import { runArchiver } from '@/lib/pipeline/agents/archiver';
import { isSvgPlaceholderImage } from '@/lib/image-storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status': {
        const [orchestratorStats, queueStats] = await Promise.all([
          getOrchestratorStats(),
          getQueueStats(),
        ]);
        return NextResponse.json({
          status: 'ok',
          orchestrator: orchestratorStats,
          queue: queueStats,
          timestamp: new Date().toISOString(),
        });
      }

      case 'unlock': {
        // Reset retry counts for stuck articles
        const resetCount = await resetStuckRetries();
        return NextResponse.json({
          status: 'ok',
          message: `Unlocked ${resetCount} articles`,
          count: resetCount,
          timestamp: new Date().toISOString(),
        });
      }

      case 'force-reset': {
        // V45: Force-reset ALL stuck articles (even at MAX_RETRY)
        const [resetCount, forceResetCount] = await Promise.all([
          resetStuckRetries(),
          forceResetRecentFailed(),
        ]);
        return NextResponse.json({
          status: 'ok',
          message: `Reset ${resetCount} stuck + ${forceResetCount} recently failed articles`,
          resetCount,
          forceResetCount,
          timestamp: new Date().toISOString(),
        });
      }

      case 'fix-published': {
        // V45→V356: Fix articles with isReady=true but isPublished=false
        // WITH limit enforcement — previously published unlimited articles
        const dynamicLimits = await getPipelineLimits();
        const now = new Date();
        const hourStart = new Date(now);
        hourStart.setUTCMinutes(0, 0, 0);
        const resetHour = PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0;
        const todayStart = new Date(now);
        todayStart.setUTCHours(resetHour, 0, 0, 0);
        if (now.getUTCHours() < resetHour) {
          todayStart.setUTCDate(todayStart.getUTCDate() - 1);
        }

        // V357→V380: Add locale: 'ar' + newsType: 'live' filter for accurate Arabic-only counting
        // V380: Added newsType: 'live' to match ALL other cron routes (FR, TR, ES, EN).
        // Previously relied on titleAr filter accidentally excluding stock_analysis articles — fragile.
        const visibilityFilter = {
          locale: 'ar',
          isReady: true,
          isPublished: true,
          newsType: 'live',       // V380: Explicit — only count live news, not stock_analysis
          slug: { not: '' },
          titleAr: { not: '' },
        };

        const [publishedToday, publishedThisHour] = await Promise.all([
          db.newsItem.count({ where: { ...visibilityFilter, publishedAt: { gte: todayStart } } }),
          db.newsItem.count({ where: { ...visibilityFilter, publishedAt: { gte: hourStart } } }),
        ]);

        const remainingHourly = dynamicLimits.maxPublishedPerHour > 0
          ? Math.max(0, dynamicLimits.maxPublishedPerHour - publishedThisHour) : 999;
        const remainingDaily = dynamicLimits.maxPublishedPerDay > 0
          ? Math.max(0, dynamicLimits.maxPublishedPerDay - publishedToday) : 999;
        const maxToFix = Math.min(remainingHourly, remainingDaily);

        if (maxToFix <= 0) {
          return NextResponse.json({
            status: 'ok',
            message: `Quota reached — cannot fix-published. Hour: ${publishedThisHour}/${dynamicLimits.maxPublishedPerHour}, Day: ${publishedToday}/${dynamicLimits.maxPublishedPerDay}`,
            count: 0,
            quotaExceeded: true,
            timestamp: new Date().toISOString(),
          });
        }

        // Only fix up to the remaining quota
        // V1044: golden rule — must have analysis (fullContent) + image
        const articlesToFix = await db.newsItem.findMany({
          where: {
            isReady: true,
            isPublished: false,
            locale: 'ar',
            aiAnalysis: { contains: 'fullContent' },
            generatedImage: { not: '' },
          },
          select: { id: true },
          take: maxToFix,
        });

        let fixedCount = 0;
        if (articlesToFix.length > 0) {
          const fixResult = await db.newsItem.updateMany({
            where: { id: { in: articlesToFix.map(a => a.id) } },
            data: { isPublished: true, publishedAt: new Date() },
          });
          fixedCount = fixResult.count;
          // V359: Record publishes in quota manager's in-process tracking
          try {
            const { recordPublish } = await import('@/lib/pipeline/publish-quota');
            for (let i = 0; i < fixedCount; i++) {
              recordPublish('ar');
            }
          } catch { /* non-critical */ }
        }

        return NextResponse.json({
          status: 'ok',
          message: `Fixed ${fixedCount} articles (limited by quota: hour=${publishedThisHour}/${dynamicLimits.maxPublishedPerHour}, day=${publishedToday}/${dynamicLimits.maxPublishedPerDay})`,
          count: fixedCount,
          quotaRemaining: { hourly: remainingHourly - fixedCount, daily: remainingDaily - fixedCount },
          timestamp: new Date().toISOString(),
        });
      }

      case 'mark-ready': {
        // V48: Mark qualifying articles as ready (isReady=true + isPublished=true).
        // This is a safety-net called by Railway cron every 10 minutes.
        // It catches articles that the pipeline processed completely
        // but somehow didn't get marked as ready.
        // It also auto-starts the orchestrator if it's not running.
        let markedCount = 0;
        let fixedPublishedCount = 0;

        try {
          // Step 1: Fix articles with isReady=true but isPublished=false
          // V356: WITH limit enforcement — count these against the quota
          // Get current published counts first
          const markLimits = await getPipelineLimits();
          const markNow = new Date();
          const markHourStart = new Date(markNow);
          markHourStart.setUTCMinutes(0, 0, 0);
          const markResetHour = PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0;
          const markTodayStart = new Date(markNow);
          markTodayStart.setUTCHours(markResetHour, 0, 0, 0);
          if (markNow.getUTCHours() < markResetHour) {
            markTodayStart.setUTCDate(markTodayStart.getUTCDate() - 1);
          }

          // V357: Add locale: 'ar' for accurate counting
          const markVisFilter = {
            locale: 'ar',
            isReady: true,
            isPublished: true,
            slug: { not: '' },
            titleAr: { not: '' },
          };

          const [markPubToday, markPubThisHour] = await Promise.all([
            db.newsItem.count({ where: { ...markVisFilter, publishedAt: { gte: markTodayStart } } }),
            db.newsItem.count({ where: { ...markVisFilter, publishedAt: { gte: markHourStart } } }),
          ]);

          const markRemainingHourly = markLimits.maxPublishedPerHour > 0
            ? Math.max(0, markLimits.maxPublishedPerHour - markPubThisHour) : 999;
          const markRemainingDaily = markLimits.maxPublishedPerDay > 0
            ? Math.max(0, markLimits.maxPublishedPerDay - markPubToday) : 999;
          const markMaxFix = Math.min(markRemainingHourly, markRemainingDaily);

          if (markMaxFix > 0) {
            // V1044: golden rule — must have analysis (fullContent) + image
            const articlesToFixPub = await db.newsItem.findMany({
              where: {
                isReady: true,
                isPublished: false,
                locale: 'ar',
                aiAnalysis: { contains: 'fullContent' },
                generatedImage: { not: '' },
              },
              select: { id: true },
              take: markMaxFix,
            });
            if (articlesToFixPub.length > 0) {
              const fixPub = await db.newsItem.updateMany({
                where: { id: { in: articlesToFixPub.map(a => a.id) } },
                data: { isPublished: true, publishedAt: new Date() },
              });
              fixedPublishedCount = fixPub.count;
              console.log(`[Cron V356] mark-ready Step 1: Fixed ${fixedPublishedCount} articles (limited by quota: hour=${markPubThisHour}/${markLimits.maxPublishedPerHour}, day=${markPubToday}/${markLimits.maxPublishedPerDay})`);
            }
          } else {
            console.log(`[Cron V356] mark-ready Step 1: Quota reached — skipping isPublished fix. Hour: ${markPubThisHour}/${markLimits.maxPublishedPerHour}, Day: ${markPubToday}/${markLimits.maxPublishedPerDay}`);
          }

          // Step 2: Find articles that have ALL required content but are NOT ready.
          // These are articles where the pipeline completed all stages
          // but the publisher agent failed to mark them.
          // Requirements: Arabic title + slug + sufficient Arabic content + generated image
          const qualifyingArticles = await db.newsItem.findMany({
            where: {
              isReady: false,
              isPublished: false,
              locale: 'ar',  // V317: Only mark Arabic articles — EN articles go through EN pipeline
              slug: { not: null },
              titleAr: { not: null },
              generatedImage: { not: null },
              processingStage: 'imaged',
            },
            select: {
              id: true,
              titleAr: true,
              contentAr: true,
              aiAnalysis: true,
              // EGRESS FIX: removed generatedImage from batch select — fetched separately only for candidates that pass other checks
            },
            take: 100,
          });

          // Apply strict checks — same criteria as the Publisher agent
          // EGRESS FIX: Two-phase approach — first filter on lightweight fields, then fetch generatedImage
          // only for the few articles that pass all other criteria (instead of pulling base64 for all 100)
          const candidateIds: string[] = [];
          for (const article of qualifyingArticles) {
            const hasArabicTitle = !!(
              article.titleAr &&
              article.titleAr.length > 3 &&
              /[\u0600-\u06FF]/.test(article.titleAr)
            );

            // Sufficient content: contentAr > 100 Arabic chars OR real AI analysis
            let hasSufficientContent = false;
            if (article.contentAr && article.contentAr.length > 100 && /[\u0600-\u06FF]/.test(article.contentAr)) {
              hasSufficientContent = true;
            }
            if (!hasSufficientContent && article.aiAnalysis && article.aiAnalysis.length > 50) {
              try {
                const parsed = JSON.parse(article.aiAnalysis);
                const isMinimal = parsed.isMinimal === true || parsed.isSummaryFallback === true;
                hasSufficientContent = !isMinimal && !!(
                  parsed.fullContent &&
                  parsed.fullContent.length > 100 &&
                  /[\u0600-\u06FF]/.test(parsed.fullContent)
                );
              } catch {
                hasSufficientContent = article.aiAnalysis.length > 200 && /[\u0600-\u06FF]/.test(article.aiAnalysis);
              }
            }

            if (hasArabicTitle && hasSufficientContent) {
              candidateIds.push(article.id);
            }
          }

          // EGRESS FIX: Only fetch generatedImage for candidates that passed other checks (typically few)
          let readyIds: string[] = [];
          if (candidateIds.length > 0) {
            const candidatesWithImage = await db.newsItem.findMany({
              where: { id: { in: candidateIds } },
              select: { id: true, generatedImage: true },
            });
            for (const c of candidatesWithImage) {
              // V235: Strict image validation — reject SVG placeholders
              const isSvgImage = isSvgPlaceholderImage(c.generatedImage);
              const hasGeneratedImage = !!(
                c.generatedImage &&
                c.generatedImage.length > 10 &&
                !isSvgImage
              );
              if (hasGeneratedImage) {
                readyIds.push(c.id);
              }
            }
          }

          // V99: Respect hourly and daily publishing limits before marking articles ready
          // V317: REDUCED mark-ready quota — only allow 30% of remaining daily quota here.
          // The orchestrator is the PRIMARY publisher. Mark-ready is a SAFETY NET that catches
          // articles the orchestrator missed. Previously, mark-ready could consume the ENTIRE
          // remaining daily quota, leaving the orchestrator with nothing → race condition.
          // Now mark-ready takes at most 30% of the remaining quota, leaving 70% for the orchestrator.
          let idsToPublish = readyIds;
          // V102: Get dynamic limits from DB
          const dynamicLimits = await getPipelineLimits();
          if (readyIds.length > 0 && (dynamicLimits.maxPublishedPerHour > 0 || dynamicLimits.maxPublishedPerDay > 0)) {
            const now = new Date();
            const hourStart = new Date(now);
            hourStart.setUTCMinutes(0, 0, 0);
            const resetHour = PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0;
            const todayStart = new Date(now);
            todayStart.setUTCHours(resetHour, 0, 0, 0);
            if (now.getUTCHours() < resetHour) {
              todayStart.setUTCDate(todayStart.getUTCDate() - 1);
            }

            // V357: Use publishedAt + locale filter for counting (matching orchestrator V357 fix).
            // The old V103 logic used fetchedAt which UNDERCOUNTED publications, allowing
            // the daily/hourly limits to be exceeded. publishedAt is the correct field because
            // it represents when the article actually became visible on the site.
            const visibilityFilter = {
              locale: 'ar',           // V357: Explicit locale filter
              isReady: true,
              isPublished: true,
              newsType: 'live',       // V380: Only count live news toward quota
              slug: { not: '' },
              titleAr: { not: '' },
            };

            const [publishedToday, publishedThisHour] = await Promise.all([
              db.newsItem.count({
                where: { ...visibilityFilter, publishedAt: { gte: todayStart } },
              }),
              db.newsItem.count({
                where: { ...visibilityFilter, publishedAt: { gte: hourStart } },
              }),
            ]);

            const remainingHourly = dynamicLimits.maxPublishedPerHour > 0
              ? Math.max(0, dynamicLimits.maxPublishedPerHour - publishedThisHour)
              : readyIds.length;
            const remainingDaily = dynamicLimits.maxPublishedPerDay > 0
              ? Math.max(0, dynamicLimits.maxPublishedPerDay - publishedToday)
              : readyIds.length;
            // V317: Mark-ready is a SAFETY NET — only take 30% of remaining quota.
            // The orchestrator is the primary publisher and needs the bulk of the quota.
            // This prevents the race condition where both paths publish independently
            // and exceed the daily limit combined.
            const MARK_READY_QUOTA_RATIO = 0.3;
            const markReadyDailyCap = dynamicLimits.maxPublishedPerDay > 0
              ? Math.max(1, Math.floor(remainingDaily * MARK_READY_QUOTA_RATIO))
              : readyIds.length;
            const markReadyHourlyCap = dynamicLimits.maxPublishedPerHour > 0
              ? Math.max(1, Math.floor(remainingHourly * MARK_READY_QUOTA_RATIO))
              : readyIds.length;
            const maxToPublish = Math.min(markReadyHourlyCap, markReadyDailyCap, readyIds.length);

            if (maxToPublish < readyIds.length) {
              console.log(`[Cron V99] mark-ready: Quota limit — publishing ${maxToPublish} of ${readyIds.length} ready articles (hour: ${publishedThisHour}/${dynamicLimits.maxPublishedPerHour}, day: ${publishedToday}/${dynamicLimits.maxPublishedPerDay})`);
              idsToPublish = readyIds.slice(0, maxToPublish);
            }
          }

          if (idsToPublish.length > 0) {
            // V102 FIX: Use fetchedAt instead of new Date() for publishedAt.
            // Setting publishedAt=today on old articles inflates the daily count,
            // causing the 200/day limit to be reached prematurely.
            // Use raw SQL to set publishedAt = fetchedAt (can't do column-to-column in Prisma ORM)
            try {
              // V156: Use Prisma ORM updateMany instead of raw SQL with string interpolation.
              // The previous $executeRawUnsafe with string-interpolated IDs was a SQL injection risk.
              // Prisma's updateMany with { in: idsToPublish } is safe and parameterized.
              // For publishedAt = COALESCE(publishedAt, fetchedAt), we handle in two steps:
              // Step 1: Set publishedAt = fetchedAt for articles where publishedAt is NULL
              const nullPublishedAt = await db.newsItem.findMany({
                where: { id: { in: idsToPublish }, publishedAt: null },
                select: { id: true, fetchedAt: true },
              });
              if (nullPublishedAt.length > 0) {
                for (const article of nullPublishedAt) {
                  await db.newsItem.update({
                    where: { id: article.id },
                    data: { publishedAt: article.fetchedAt || new Date() },
                  });
                }
              }
              // Step 2: Set isReady + isPublished + processingStage
              const updateResult = await db.newsItem.updateMany({
                where: { id: { in: idsToPublish } },
                data: {
                  isReady: true,
                  isPublished: true,
                  processingStage: 'imaged',
                },
              });
              markedCount = Number(updateResult);
              // V359: Record publishes in quota manager's in-process tracking
              try {
                const { recordPublish } = await import('@/lib/pipeline/publish-quota');
                for (let i = 0; i < markedCount; i++) {
                  recordPublish('ar');
                }
              } catch { /* non-critical */ }
            } catch (rawErr: any) {
              // Fallback: use Prisma ORM (publishedAt = now, but at least articles get published)
              console.warn(`[Cron V102] Raw SQL fallback: ${rawErr.message}`);
              await db.newsItem.updateMany({
                where: { id: { in: idsToPublish } },
                data: {
                  isReady: true,
                  isPublished: true,
                  publishedAt: new Date(),
                  processingStage: 'imaged',
                },
              });
              markedCount = idsToPublish.length;
            }
            console.log(`[Cron V102] mark-ready: Marked ${markedCount} articles as ready + published (publishedAt=fetchedAt)`);
          }

          if (fixedPublishedCount > 0) {
            console.log(`[Cron V48] mark-ready: Fixed ${fixedPublishedCount} articles with isReady=true but isPublished=false`);
          }
        } catch (markErr: any) {
          console.error(`[Cron V48] mark-ready failed: ${markErr.message}`);
        }

        // Step 3: V52 — Use ensureRunning() instead of manual check
        const result = ensureRunning();
        if (result.restarted) {
          console.log(`[Cron V52] mark-ready: Orchestrator ${result.wasStale ? 'was STALE — force-restarted' : 'was NOT running — started'}`);
        }

        return NextResponse.json({
          status: 'ok',
          message: `Marked ${markedCount} articles as ready, fixed ${fixedPublishedCount} published flags`,
          markedCount,
          fixedPublishedCount,
          orchestratorRestarted: result.restarted,
          timestamp: new Date().toISOString(),
        });
      }

      case 'trigger':
      case 'fetch': {
        // V52: Use ensureRunning() — always ensures pipeline is alive
        const triggerResult = ensureRunning();
        const stats = await getOrchestratorStats();
        return NextResponse.json({
          status: 'ok',
          message: triggerResult.restarted ? 'Pipeline restarted (was stale or stopped)' : 'Pipeline already running',
          orchestrator: stats,
          timestamp: new Date().toISOString(),
        });
      }

      case 'archive': {
        // V118: Run the archiver — move old articles to archive table
        // GOLDEN RULE: No article is ever deleted — only moved to archive
        const archiveResult = await runArchiver();
        return NextResponse.json({
          status: 'ok',
          message: `Archived ${archiveResult.archived} articles, ${archiveResult.errors} errors`,
          archived: archiveResult.archived,
          errors: archiveResult.errors,
          duration: archiveResult.duration,
          timestamp: new Date().toISOString(),
        });
      }

      case 'cleanup': {
        // V1174: Global cleanup — delete unpublished articles older than 24h
        // from ALL pipelines (AR/EN/FR/TR/ES). This runs via Railway cron.
        // The Arabic orchestrator has its own cleanup but the other 4 don't.
        try {
          const { deleteOldUnpublished } = await import('@/lib/pipeline/queue/job-manager');
          const deleted = await deleteOldUnpublished();
          return NextResponse.json({
            status: 'ok',
            deleted,
            message: `Deleted ${deleted} old unpublished articles (all pipelines, >24h)`,
            timestamp: new Date().toISOString(),
          });
        } catch (err: any) {
          return NextResponse.json({
            status: 'error',
            error: err.message?.slice(0, 200),
          }, { status: 500 });
        }
      }

      case 'test': {
        // Return current processing stage distribution
        const queueStats = await getQueueStats();
        const orchestratorStats = await getOrchestratorStats();
        return NextResponse.json({
          status: 'ok',
          queue: queueStats,
          orchestrator: orchestratorStats,
          timestamp: new Date().toISOString(),
        });
      }

      case 'cleanup-orphaned-en': {
        // FIX: Delete orphaned English-locale articles created by the Arabic fetcher.
        // The Arabic fetcher previously set locale='en' for English-language RSS items,
        // creating articles that neither pipeline processes (Arabic pipeline filters
        // locale='ar', English pipeline doesn't know about them). These are stuck forever.
        // This action deletes them to prevent broken links and data pollution.
        const orphanedArticles = await db.newsItem.findMany({
          where: {
            locale: 'en',
            isReady: false,
            processingStage: { in: ['fetched', 'processing', 'translating', 'analyzing', 'imaging'] },
          },
          select: { id: true, slug: true, title: true, processingStage: true, createdAt: true },
          take: 500,
        });

        if (orphanedArticles.length === 0) {
          return NextResponse.json({
            status: 'ok',
            message: 'No orphaned English-locale articles found',
            deleted: 0,
            timestamp: new Date().toISOString(),
          });
        }

        const deleteResult = await db.newsItem.deleteMany({
          where: {
            id: { in: orphanedArticles.map(a => a.id) },
          },
        });

        return NextResponse.json({
          status: 'ok',
          message: `Deleted ${deleteResult.count} orphaned English-locale articles from Arabic fetcher`,
          deleted: deleteResult.count,
          sample: orphanedArticles.slice(0, 5).map(a => ({ id: a.id, title: a.title?.slice(0, 50), stage: a.processingStage })),
          timestamp: new Date().toISOString(),
        });
      }

      default: {
        return NextResponse.json({
          status: 'error',
          message: `Unknown action: ${action}. Valid: status, unlock, trigger, fetch, test, force-reset, fix-published, mark-ready, archive, cleanup-orphaned-en`,
        }, { status: 400 });
      }
    }
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      error: err.message,
    }, { status: 500 });
  }
}
