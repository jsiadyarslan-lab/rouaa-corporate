// ─── Fix Unready Articles API V40 ────────────────────────────
// V40 GOLDEN RULE: NEVER touch published articles.
// Published articles (isReady=true) are sacrosanct — their content
// must NOT be modified by this cleanup route. Previously, this route
// cleared garbage contentAr from published articles, leaving them
// published but with NULL content — worse than garbage!
//
// Now, this route ONLY handles UNPUBLISHED articles:
//   1. Clears garbage contentAr from UNPUBLISHED articles and resets their stage
//   2. Resets unpublished articles stuck at content_loaded stage
//   3. NEVER modifies any field on published articles (isReady=true)

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTablesExist } from '@/lib/db-init';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Garbage patterns from the old pipeline (translated HTML navigation)
const GARBAGE_SQL = `
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
  OR "contentAr" LIKE '%تخطى إلى العمود الأيمن%'
  OR "contentAr" LIKE '%برنامج الإذاعة%'
  OR "contentAr" LIKE '%مشاركة%حفظ%'
  OR "contentAr" LIKE '%الأعضاء المؤسسون%'
  OR "contentAr" LIKE '%أنشئ حساباً%'
  OR "contentAr" LIKE '%قائمة المراقبة%'
  OR "contentAr" LIKE '%مُحول العملات%'
  OR "contentAr" LIKE '%الرسومات المتقدمة%'
  OR "contentAr" LIKE '%اختيارات المحرر%'
  OR "contentAr" LIKE '%الأسهم الشائعة%'
`;

export async function GET(request: Request) {
  try {
    await ensureTablesExist();

    // ── V40: REMOVED — Never clear contentAr from published articles ──
    // Previously, this route cleared garbage contentAr from PUBLISHED articles,
    // leaving them with NULL contentAr. This was worse than garbage content
    // because at least garbage content showed SOMETHING. Now, published articles
    // are NEVER modified by this cleanup route.
    // If a published article has garbage content, it should be re-processed
    // through the pipeline (which will overwrite the garbage with AI-written content).

    // ── Step 1: Clear garbage contentAr from UNPUBLISHED articles and reset ──
    let unpublishedGarbageCleared = 0;
    try {
      unpublishedGarbageCleared = await db.$executeRawUnsafe(`
        UPDATE news_items
        SET "contentAr" = NULL,
            "processingStage" = 'fetched',
            "retryCount" = 0,
            "lastError" = NULL,
            "updatedAt" = NOW()
        WHERE "isReady" = false
          AND "contentAr" IS NOT NULL
          AND LENGTH("contentAr") > 50
          AND (${GARBAGE_SQL})
      `);
      if (unpublishedGarbageCleared > 0) {
        console.log(`[FixUnready] V40: ✓ Cleared garbage contentAr from ${unpublishedGarbageCleared} unpublished articles (reset to fetched)`);
      }
    } catch (err: any) {
      console.warn(`[FixUnready] Unpublished garbage cleanup failed: ${err.message?.slice(0, 100)}`);
    }

    // ── Step 2: Reset unpublished articles at content_loaded stage ──
    let resetFromContentLoaded = 0;
    try {
      const result = await db.newsItem.updateMany({
        where: {
          isReady: false,
          processingStage: 'content_loaded',
          retryCount: { lt: 5 },
        },
        data: {
          processingStage: 'fetched',
          retryCount: 0,
          lastError: null,
        },
      });
      resetFromContentLoaded = result.count;
    } catch {}

    // ── Step 3: Count issues (informational only — NO modifications) ──
    const weakContentButPublished = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM news_items
      WHERE "isReady" = true
        AND ("contentAr" IS NULL OR "contentAr" = '' OR LENGTH("contentAr") < 200)
    `) as any[];

    const noAnalysisButPublished = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM news_items
      WHERE "isReady" = true
        AND ("aiAnalysis" IS NULL OR "aiAnalysis" = '' OR LENGTH("aiAnalysis") < 100)
    `) as any[];

    return NextResponse.json({
      success: true,
      unpublishedGarbageCleared,
      resetFromContentLoaded,
      weakContentButPublished: Number(weakContentButPublished[0]?.count || 0),
      noAnalysisButPublished: Number(noAnalysisButPublished[0]?.count || 0),
      note: 'V40: Published articles are NEVER modified by this route. Only unpublished articles are cleaned.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
