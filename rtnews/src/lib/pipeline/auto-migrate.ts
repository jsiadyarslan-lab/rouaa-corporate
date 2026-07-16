// ─── Auto-Migration V45 ────────────────────────────────────
// Runs automatically on server startup to fix legacy data.
//
// V45 CRITICAL: Force-reset ALL stuck articles on startup.
// This ensures the pipeline can always make progress, even after
// prolonged AI provider outages that caused all articles to hit
// MAX_RETRY_COUNT.
//
// V43 CRITICAL FIX: ALWAYS set isPublished=true when isReady=true.
// V42: NEVER demote a published article!

import { db } from '@/lib/db';
import { PIPELINE_CONFIG } from './config';
import { isSvgPlaceholderImage } from '@/lib/image-storage';

// V43: Allow migration to run on every server restart (not just once)
// This ensures isPublished fix runs every time, catching any new inconsistencies
let migrationRan = false;

export async function runAutoMigration(): Promise<{
  totalChecked: number;
  demotedToUnready: number; // V42: Always 0 — we NEVER demote anymore
  warnings: number;
  inconsistenciesFixed: number;
  errors: string[];
}> {
  if (migrationRan) {
    return { totalChecked: 0, demotedToUnready: 0, warnings: 0, inconsistenciesFixed: 0, errors: [] };
  }
  migrationRan = true;

  const result = {
    totalChecked: 0,
    demotedToUnready: 0,
    warnings: 0,
    inconsistenciesFixed: 0,
    errors: [] as string[],
  };

  // V1050: Ensure isOfficialSource column exists
  try {
    const { ensureStockTablesExist } = await import("../db-migrate-stock");
    await ensureStockTablesExist();
    console.log("[AutoMigrate V1050] Stock tables migration completed (includes isOfficialSource)");
  } catch (err: any) {
    console.warn("[AutoMigrate V1050] Migration failed:", err.message?.slice(0, 100));
  }

  console.log('[AutoMigrate V42] Starting — GOLDEN RULE: NEVER demote published articles!');

  try {
    // ── Fix 1: Inconsistent states (isReady=false but isPublished=true) ──
    // This is the ONLY data modification we do on published-state articles.
    // If isReady is false, isPublished MUST also be false.
    try {
      const inconsistentResult = await db.newsItem.updateMany({
        where: {
          isReady: false,
          isPublished: true,
        },
        data: {
          isPublished: false,
        },
      });
      if (inconsistentResult.count > 0) {
        result.inconsistenciesFixed = inconsistentResult.count;
        console.log(`[AutoMigrate V42] Fixed ${inconsistentResult.count} articles with isReady=false but isPublished=true`);
      }
    } catch (err: any) {
      result.errors.push(`isPublished consistency fix failed: ${err.message}`);
    }

    // ── Fix 2: Check published articles and LOG WARNINGS (but NEVER demote!) ──
    // This helps us identify articles that don't meet current criteria,
    // but we NEVER change isReady from true to false.
    // V374: Locale-aware checks — Arabic, English, and French articles have different requirements.
    try {
      const publishedArticles = await db.newsItem.findMany({
        where: {
          isReady: true,
        },
        select: {
          id: true,
          title: true,
          titleAr: true,
          content: true,
          contentAr: true,
          locale: true,
          // EGRESS FIX: removed generatedImage from select — existence checked via separate query below
          aiAnalysis: true,
          slug: true,
          isPublished: true,
        },
      });

      result.totalChecked = publishedArticles.length;

      for (const article of publishedArticles) {
        const issues: string[] = [];
        const articleLocale: string = (article as any).locale || 'ar';

        // V43: ALWAYS fix isPublished=true when isReady=true (regardless of issues)
        if (!article.isPublished) {
          try {
            await db.newsItem.update({
              where: { id: article.id },
              data: { isPublished: true },
            });
            console.log(`[AutoMigrate V43] Fixed isPublished=true for article ${article.id} (isReady was true but isPublished was false)`);
          } catch {}
        }

        // V374: Locale-aware quality checks
        if (articleLocale === 'fr') {
          // ── FRENCH quality checks ──
          // French articles use title/content (not titleAr/contentAr)
          if (!article.title || article.title.length < 4) {
            issues.push('Missing or short French title');
          }
          if (!article.content || article.content.length < 80) {
            issues.push('Missing or short French content');
          }
        } else if (articleLocale === 'en') {
          // ── ENGLISH quality checks ──
          // English articles use title/content (not titleAr/contentAr)
          if (!article.title || article.title.length < 4) {
            issues.push('Missing or short English title');
          }
          if (!article.content || article.content.length < 200) {
            issues.push('Missing or short English content');
          }
        } else {
          // ── ARABIC quality checks (original logic preserved) ──
          // Check titleAr
          if (!article.titleAr || article.titleAr.length < PIPELINE_CONFIG.MIN_TITLE_AR_LENGTH) {
            issues.push('Missing or short titleAr');
          } else if (!isMostlyArabic(article.titleAr)) {
            issues.push('titleAr is not mostly Arabic');
          }

          // Check contentAr
          const hasContentAr = article.contentAr &&
            article.contentAr.length >= PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH &&
            isMostlyArabic(article.contentAr) &&
            !isGarbageContent(article.contentAr);
          if (!hasContentAr) {
            issues.push(`Missing or short Arabic contentAr (need ${PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH}+ chars)`);
          }
        }

        // EGRESS FIX: generatedImage existence checked via separate query below
        // SVG placeholder detection handled by Fix 4b2 in this same function

        // Check slug
        if (!article.slug || article.slug.length < 2) {
          issues.push('Missing slug');
        }

        // Check aiAnalysis — V374: locale-aware
        let hasValidAnalysis = false;
        if (article.aiAnalysis && article.aiAnalysis.length > 50) {
          try {
            const parsed = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
            const fullContent = parsed.fullContent || '';
            if (articleLocale === 'fr') {
              // French: fullContent must contain Latin/French characters
              if (fullContent.length > 50 && /[a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]{3,}/.test(fullContent)) {
                hasValidAnalysis = true;
              }
            } else if (articleLocale === 'en') {
              // English: fullContent must contain Latin characters
              if (fullContent.length > 50 && /[a-zA-Z]{3,}/.test(fullContent)) {
                hasValidAnalysis = true;
              }
            } else {
              // Arabic: fullContent must contain Arabic characters
              if (fullContent.length > 50 && /[\u0600-\u06FF]/.test(fullContent)) {
                hasValidAnalysis = true;
              }
            }
          } catch {}
        }
        if (!hasValidAnalysis) {
          issues.push('Missing or invalid AI analysis');
        }

        if (issues.length > 0) {
          result.warnings++;
          console.warn(`[AutoMigrate V42] WARNING: Published article ${article.id} has issues: ${issues.join('; ')} — NOT demoting (IRREVERSIBLE rule)`);

          // V43: isPublished is already fixed above (always set true when isReady=true)
          // Now just log the issues for monitoring
        }
      }

      if (result.warnings > 0) {
        console.log(`[AutoMigrate V42] ${result.warnings} published articles have quality issues — they remain published but should be improved`);
      }

      // EGRESS FIX: Separate lightweight query for generatedImage existence check
      // (instead of pulling base64 data for all published articles)
      try {
        const missingImageCount = await db.newsItem.count({
          where: { isReady: true, generatedImage: null },
        });
        const emptyImageCount = await db.newsItem.count({
          where: { isReady: true, generatedImage: '' },
        });
        if (missingImageCount > 0 || emptyImageCount > 0) {
          result.warnings += missingImageCount + emptyImageCount;
          console.warn(`[AutoMigrate V42] WARNING: ${missingImageCount} published articles with null generatedImage, ${emptyImageCount} with empty generatedImage — NOT demoting (IRREVERSIBLE rule)`);
        }
      } catch {}
    } catch (err: any) {
      result.errors.push(`Published articles check failed: ${err.message}`);
    }

    // ── Fix 3: V72: Force-reset ONLY RECENT stuck unpublished articles on startup ──
    // V72: Previously reset ALL stuck articles — with 3000+ failed articles this floods
    // the pipeline on every restart, causing infinite processing loops that all fail.
    // Now limit to the most recent 50 articles to avoid overwhelming the pipeline.
    try {
      // V72: Find the most recent 50 stuck articles (by fetchedAt) instead of ALL
      const recentStuckArticles = await db.newsItem.findMany({
        where: {
          isReady: false,
          isPublished: false,
          retryCount: { gte: PIPELINE_CONFIG.MAX_RETRY_COUNT },
        },
        orderBy: { fetchedAt: 'desc' },
        select: { id: true },
        take: 50, // V72: Only reset the most recent 50
      });

      if (recentStuckArticles.length > 0) {
        const recentIds = recentStuckArticles.map(a => a.id);
        const allStuckResult = await db.newsItem.updateMany({
          where: {
            id: { in: recentIds },
          },
          data: {
            retryCount: 0,
            lastError: null,
            processingStage: 'fetched', // Reset to start
          },
        });
        console.log(`[AutoMigrate V72] Force-reset ${allStuckResult.count} most-recent stuck articles (limited from ${recentStuckArticles.length} total stuck)`);

        // V72: Delete older stuck articles that will never be processed (keep DB clean)
        const oldStuckDelete = await db.newsItem.deleteMany({
          where: {
            isReady: false,
            isPublished: false,
            retryCount: { gte: PIPELINE_CONFIG.MAX_RETRY_COUNT },
            fetchedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Older than 24h
          },
        });
        if (oldStuckDelete.count > 0) {
          console.log(`[AutoMigrate V72] Deleted ${oldStuckDelete.count} old stuck articles (>24h, will never process)`);
        }
      }

      // Also reset articles with high retry counts but not yet at MAX (limit to 50)
      const highRetryArticles = await db.newsItem.findMany({
        where: {
          isReady: false,
          isPublished: false,
          retryCount: { gte: Math.floor(PIPELINE_CONFIG.MAX_RETRY_COUNT / 2) },
          lastError: { not: null },
        },
        orderBy: { fetchedAt: 'desc' },
        select: { id: true },
        take: 50, // V72: Limit to 50
      });

      if (highRetryArticles.length > 0) {
        const highRetryIds = highRetryArticles.map(a => a.id);
        const highRetryResult = await db.newsItem.updateMany({
          where: {
            id: { in: highRetryIds },
          },
          data: {
            retryCount: 0,
            lastError: null,
          },
        });
        console.log(`[AutoMigrate V72] Reset ${highRetryResult.count} high-retry articles (limited)`);
      }
    } catch (err: any) {
      result.errors.push(`Stuck articles reset failed: ${err.message}`);
    }

    // ── Fix 4: V104 — Purge aged-out articles in early stages that will NEVER be processed ──
    // Articles in 'fetched'/'content_loaded' older than MAX_ARTICLE_AGE_MS are never
    // picked by the article picker, so they just waste DB space and inflate queue stats.
    // V111: Also purge 'rejected' articles — they are a dead-end and never cleaned up.
    if (PIPELINE_CONFIG.MAX_ARTICLE_AGE_MS > 0) {
      try {
        const ageCutoff = new Date(Date.now() - PIPELINE_CONFIG.MAX_ARTICLE_AGE_MS);
        const agedOut = await db.newsItem.deleteMany({
          where: {
            isReady: false,
            isPublished: false,
            processingStage: { in: ['fetched', 'content_loaded', 'rejected', 'skipped', 'translated'] },
            fetchedAt: { lt: ageCutoff },
            retryCount: { lt: PIPELINE_CONFIG.MAX_RETRY_COUNT },
          },
        });
        if (agedOut.count > 0) {
          result.inconsistenciesFixed += agedOut.count;
          console.log(`[AutoMigrate V104/V240] Purged ${agedOut.count} aged-out articles (fetched >${PIPELINE_CONFIG.MAX_ARTICLE_AGE_MS / 3600000}h ago, early stage/rejected/translated — will never be processed)`);
        }
      } catch (err: any) {
        result.errors.push(`Aged-out purge failed: ${err.message}`);
        console.warn(`[AutoMigrate V104/V111] Aged-out purge failed: ${err.message}`);
      }
    }

    // ── Fix 4b: V111 — Reset recent 'rejected' articles back to 'fetched' for re-processing ──
    // V108's filter gate marks non-financial news as 'rejected', but this stage is invisible
    // to the article picker and they accumulate forever. Reset recent ones (< 4h old) so
    // they can be re-evaluated. Old ones are purged by Fix 4 above.
    try {
      const recentCutoff = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const resetRejected = await db.newsItem.updateMany({
        where: {
          processingStage: 'rejected',
          isReady: false,
          isPublished: false,
          fetchedAt: { gte: recentCutoff },
        },
        data: {
          processingStage: 'fetched',
          retryCount: 0,
          lastError: null,
        },
      });
      if (resetRejected.count > 0) {
        result.inconsistenciesFixed += resetRejected.count;
        console.log(`[AutoMigrate V111] Reset ${resetRejected.count} recent 'rejected' articles back to 'fetched' for re-processing`);
      }
    } catch (err: any) {
      result.errors.push(`Rejected article reset failed: ${err.message}`);
      console.warn(`[AutoMigrate V111] Rejected article reset failed: ${err.message}`);
    }

    // ── Fix 4b2: V235 — Reset UNPUBLISHED articles with SVG placeholder images ──
    // Articles at 'imaged' or 'analyzed' stage that have SVG placeholders in generatedImage
    // are stuck — the publisher will never accept them. Reset them to 'analyzed' so the
    // imager retries with a real image. Clear the SVG placeholder first.
    // Note: We do NOT touch isReady=true articles (IRREVERSIBLE rule), but we log them.
    try {
      const svgArticles = await db.newsItem.findMany({
        where: {
          isReady: false,
          isPublished: false,
          processingStage: { in: ['imaged', 'analyzed'] },
          generatedImage: { not: null },
        },
        // Case C: genuinely needs generatedImage data to detect SVG placeholders (low-frequency admin cleanup)
      select: { id: true, generatedImage: true },
        take: 200,
      });
      // Filter SVG articles in code (Prisma can't do substring matching)
      const svgIds: string[] = [];
      for (const a of svgArticles) {
        if (isSvgPlaceholderImage(a.generatedImage)) {
          svgIds.push(a.id);
        }
      }
      if (svgIds.length > 0) {
        // Clear the SVG placeholder and reset to 'analyzed' for re-imaging
        await db.newsItem.updateMany({
          where: { id: { in: svgIds } },
          data: {
            generatedImage: null,
            processingStage: 'analyzed',
            lastError: null,
          },
        });
        result.inconsistenciesFixed += svgIds.length;
        console.log(`[AutoMigrate V235] Reset ${svgIds.length} articles with SVG placeholders → cleared image + reset to 'analyzed' for re-imaging`);
      }
    } catch (err: any) {
      result.errors.push(`SVG article reset failed: ${err.message}`);
      console.warn(`[AutoMigrate V235] SVG article reset failed: ${err.message}`);
    }

    // ── Fix 4c: V240 — Reset 'translated' articles back to 'content_loaded' ──
    // The unified processor (V145) bypasses the 'translated' stage entirely,
    // going directly from 'content_loaded' → 'analyzed'. Articles that were
    // translated by the old separate translator are now stuck at 'translated'
    // because the pipeline doesn't process this stage anymore.
    // Reset them to 'content_loaded' so the unified processor can re-process them
    // with proper AI analysis + Arabic quality.
    try {
      const translatedArticles = await db.newsItem.findMany({
        where: {
          processingStage: 'translated',
          isReady: false,
          isPublished: false,
        },
        select: { id: true },
        take: 200,
      });
      if (translatedArticles.length > 0) {
        const translatedIds = translatedArticles.map(a => a.id);
        const resetTranslated = await db.newsItem.updateMany({
          where: { id: { in: translatedIds } },
          data: {
            processingStage: 'content_loaded',
            retryCount: 0,
            lastError: null,
          },
        });
        result.inconsistenciesFixed += resetTranslated.count;
        console.log(`[AutoMigrate V240] Reset ${resetTranslated.count} 'translated' articles back to 'content_loaded' for unified processor re-processing`);
      } else {
        console.log('[AutoMigrate V240] No stuck translated articles found — pipeline healthy');
      }
    } catch (err: any) {
      result.errors.push(`Translated article reset failed: ${err.message}`);
      console.warn(`[AutoMigrate V240] Translated article reset failed: ${err.message}`);
    }

    // ── Fix 4d: V116→V124 — Reset 'analyzed' articles with missing/invalid aiAnalysis ──
    // Articles at 'analyzed' stage without valid aiAnalysis create an infinite
    // validate-fail-reset loop (the #1 cause of 0 publications). Reset them
    // to 'content_loaded' so the unified processor re-generates the analysis.
    // V124: Fixed Prisma `length` filter error — Prisma doesn't support `length` on String fields.
    // Now fetches candidates and filters in code.
    try {
      const analyzedCandidates = await db.newsItem.findMany({
        where: {
          processingStage: 'analyzed',
          isReady: false,
          isPublished: false,
          OR: [
            { aiAnalysis: null },
            { aiAnalysis: { equals: '' } },
          ],
        },
        select: { id: true, aiAnalysis: true },
        take: 200,
      });
      // V124: Filter short aiAnalysis in code (Prisma doesn't support `length` on String)
      const analyzedArticles = analyzedCandidates.filter(a =>
        !a.aiAnalysis || a.aiAnalysis.length < 50
      );
      if (analyzedArticles.length > 0) {
        const resetAnalyzed = await db.newsItem.updateMany({
          where: {
            id: { in: analyzedArticles.map(a => a.id) },
          },
          data: {
            processingStage: 'content_loaded',
            retryCount: 0,
            lastError: null,
          },
        });
        result.inconsistenciesFixed += resetAnalyzed.count;
        console.log(`[AutoMigrate V124] Reset ${resetAnalyzed.count} 'analyzed' articles with missing aiAnalysis back to 'content_loaded' for re-processing`);
      }
    } catch (err: any) {
      result.errors.push(`Analyzed article reset failed: ${err.message}`);
      console.warn(`[AutoMigrate V124] Analyzed article reset failed: ${err.message}`);
    }

    // ── Fix 5: V374 — Update stock analysis NewsItem records to use correct newsType ──
    // The stock analysis pipeline was creating NewsItem records with newsType='article',
    // causing stock analyses to appear in the news feed. This fix updates them to
    // newsType='stock_analysis' so the news API routes can properly filter them out.
    try {
      const stockAnalysisFix = await db.newsItem.updateMany({
        where: {
          source: 'stock-analysis-pipeline',
          newsType: { not: 'stock_analysis' },
        },
        data: {
          newsType: 'stock_analysis',
        },
      });
      if (stockAnalysisFix.count > 0) {
        result.inconsistenciesFixed += stockAnalysisFix.count;
        console.log(`[AutoMigrate V374] Updated ${stockAnalysisFix.count} stock analysis NewsItem records from newsType='article' to 'stock_analysis'`);
      }
    } catch (err: any) {
      result.errors.push(`Stock analysis newsType fix failed: ${err.message}`);
      console.warn(`[AutoMigrate V374] Stock analysis newsType fix failed: ${err.message}`);
    }

    // ── Fix 5: V102→V103 ONE-TIME FIX — Reset inflated publishedAt for old articles ──
    // The mark-ready cron and housekeeping were setting publishedAt = new Date() on
    // old articles (published days/weeks ago). This inflated the daily count from ~195
    // to 691, causing the 200/day limit to be permanently reached and publishing to stop.
    // V102: Only fixed articles where publishedAt > fetchedAt + 1 day — too conservative.
    // V103: Fix ANY article where publishedAt differs from fetchedAt by more than 1 hour.
    // This catches articles that were fetched today but had publishedAt set to "now"
    // by mark-ready, even though they were actually published hours ago.
    // The publishedAt should always be close to fetchedAt (the article's original time).
    try {
      const resetPubDate = await db.$executeRawUnsafe(`
        UPDATE news_items SET "publishedAt" = "fetchedAt"
        WHERE "isReady" = true
          AND "publishedAt" IS NOT NULL
          AND ABS(EXTRACT(EPOCH FROM ("publishedAt" - "fetchedAt"))) > 3600
      `);
      const resetCount = Number(resetPubDate);
      if (resetCount > 0) {
        result.inconsistenciesFixed += resetCount;
        console.log(`[AutoMigrate V103] ONE-TIME FIX: Reset ${resetCount} inflated publishedAt values to fetchedAt (publishedAt differed from fetchedAt by >1h)`);
      } else {
        console.log('[AutoMigrate V103] No inflated publishedAt values found — already correct');
      }
    } catch (err: any) {
      result.errors.push(`publishedAt reset failed: ${err.message}`);
      console.warn(`[AutoMigrate V103] publishedAt reset failed: ${err.message}`);
    }

    console.log(`[AutoMigrate V45] Complete: ${result.totalChecked} checked, ${result.warnings} warnings, ${result.inconsistenciesFixed} inconsistencies fixed, ${result.demotedToUnready} demoted (always 0 — NEVER demote!)`);

    return result;
  } catch (err: any) {
    result.errors.push(`Migration failed: ${err.message}`);
    console.error('[AutoMigrate V42] Fatal error:', err.message);
    return result;
  }
}

// ── Quality Checks (same as Publisher) ──

function isMostlyArabic(text: string): boolean {
  if (!text || text.length < 3) return false;

  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalLetters = arabicChars + latinChars;

  if (totalLetters === 0) return false;
  const ratio = arabicChars / totalLetters;

  if (ratio < PIPELINE_CONFIG.ARABIC_RATIO_THRESHOLD || arabicChars < PIPELINE_CONFIG.MIN_ARABIC_CHARS) {
    return false;
  }

  return true;
}

function isGarbageContent(text: string): boolean {
  if (!text || text.length < 50) return true;

  const garbagePatterns = [
    /تجاوز التنقل/i, /تخطى إلى التنقل/i, /تخطي المحتوى/i,
    /الرئيسية.*الأخبار.*الرياضة/i,
    /أسواق الولايات المتحدة.*أسواق أوروبا/i,
    /الأكثر نشاطاً.*المكاسب اليومية/i,
    /تخطى إلى المحتوى الرئيسي/i, /تخطى إلى العمود الأيمن/i,
    /سجّل الدخول/i, /أنشئ حساباً/i,
    /قائمة المراقبة/i, /البث المباشر.*قائمة/i,
    /مُحول العملات/i, /الرسومات المتقدمة/i,
    /اختيارات المحرر/i, /الأسهم الشائعة/i,
    /تقويم الأرباح/i, /دليل الشراء/i,
    /أفكار الهدايا/i, /برنامج الإذاعة/i,
  ];

  for (const pattern of garbagePatterns) {
    if (pattern.test(text)) return true;
  }

  const lines = text.split(/\n/).filter(l => l.trim().length > 0);
  if (lines.length > 15) {
    const shortLines = lines.filter(l => l.trim().length < 30).length;
    if (shortLines / lines.length > 0.7) return true;
  }

  return false;
}
