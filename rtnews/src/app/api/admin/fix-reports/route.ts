// ─── Admin Report Fix/Recovery Endpoint V364 ────────────────
// POST /api/admin/fix-reports
// Two modes:
//   1. Default (no action): Fix published reports with "لا تنشر" or AI confidence ≤ 6/10
//   2. ?action=recover: Re-publish reports that V242 incorrectly unpublished (confidence >= 30)
//   3. ?action=clear-v242-flag: Delete reports_v242_fix_done flag so V363 fix can re-run
// Protected by CRON_SECRET or admin JWT.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyInternalOrCronAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Auth check — accept INTERNAL_SECRET, CRON_SECRET, or admin JWT
  if (!verifyInternalOrCronAuth(request)) {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    const adminKey = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET || process.env.CRON_SECRET;
    if (!key || !adminKey || key !== adminKey) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'fix';

  try {
    // ── Action: Recover reports incorrectly unpublished by V242 ──
    if (action === 'recover') {
      const results = {
        analysesRepublished: 0,
        reportsRepublished: 0,
        v242FlagDeleted: false,
        details: [] as string[],
      };

      // Re-publish Arabic market analyses with confidence >= 30 that are unpublished
      const unpublishedAnalyses = await db.marketAnalysis.findMany({
        where: {
          isPublished: false,
          locale: 'ar',
          confidenceScore: { gte: 30 },
        },
        select: { id: true, title: true, confidenceScore: true, slug: true, content: true },
      });

      for (const analysis of unpublishedAnalyses) {
        // Skip if content has explicit "لا تنشر" directive or AI confidence ≤ 6/10
        const contentStr = typeof analysis.content === 'string' ? analysis.content : JSON.stringify(analysis.content || '');
        const hasDoNotPublish = /لا\s*تنشر/i.test(contentStr);
        const confMatch = contentStr.match(/(?:مستوى\s*)?ثقة\s*[:\s]*(\d+)\s*\/\s*10/i);
        const aiConfLow = confMatch && parseInt(confMatch[1], 10) <= 6;

        if (!hasDoNotPublish && !aiConfLow) {
          await db.marketAnalysis.update({
            where: { id: analysis.id },
            data: { isPublished: true, publishedAt: new Date() },
          });
          results.analysesRepublished++;
          results.details.push(`[analysis] ${analysis.slug}: confidence=${analysis.confidenceScore} → republished`);
        }
      }

      // Re-publish Arabic economic reports with confidence >= 30 that are unpublished
      const unpublishedReports = await db.economicReport.findMany({
        where: {
          isPublished: false,
          locale: 'ar',
          confidenceScore: { gte: 30 },
        },
        select: { id: true, title: true, confidenceScore: true, slug: true, content: true },
      });

      for (const report of unpublishedReports) {
        const contentStr = typeof report.content === 'string' ? report.content : JSON.stringify(report.content || '');
        const hasDoNotPublish = /لا\s*تنشر/i.test(contentStr);
        const confMatch = contentStr.match(/(?:مستوى\s*)?ثقة\s*[:\s]*(\d+)\s*\/\s*10/i);
        const aiConfLow = confMatch && parseInt(confMatch[1], 10) <= 6;

        if (!hasDoNotPublish && !aiConfLow) {
          await db.economicReport.update({
            where: { id: report.id },
            data: { isPublished: true, publishedAt: new Date() },
          });
          results.reportsRepublished++;
          results.details.push(`[report] ${report.slug}: confidence=${report.confidenceScore} → republished`);
        }
      }

      // Delete the V242 fix flag so V363-modified one-time fix can re-run
      try {
        const deleted = await db.siteSetting.deleteMany({
          where: { key: 'reports_v242_fix_done' },
        });
        results.v242FlagDeleted = deleted.count > 0;
        if (deleted.count > 0) {
          results.details.push('Deleted reports_v242_fix_done flag — V363 fix will re-evaluate on next scheduler cycle');
        }
      } catch (flagErr: any) {
        results.details.push(`Flag deletion error: ${flagErr.message}`);
      }

      return NextResponse.json({
        success: true,
        action: 'recover',
        message: `Recovered: ${results.analysesRepublished} analyses + ${results.reportsRepublished} reports republished. V242 flag deleted: ${results.v242FlagDeleted}`,
        results,
      });
    }

    // ── Action: Clear V242 fix flag only ──
    if (action === 'clear-v242-flag') {
      try {
        const deleted = await db.siteSetting.deleteMany({
          where: { key: 'reports_v242_fix_done' },
        });
        return NextResponse.json({
          success: true,
          action: 'clear-v242-flag',
          deleted: deleted.count > 0,
          message: deleted.count > 0
            ? 'V242 fix flag deleted — V363-modified fix will run on next scheduler cycle'
            : 'V242 fix flag was not found (already deleted or never set)',
        });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }

    // ── Default Action: Fix published reports with problematic content ──
    // V364: Raised confidence threshold from 40 to 25 for unpublish.
    // The old threshold (40) was too aggressive and conflicted with V240's lowered
    // min confidence (30). Reports with confidence 30-39 are VALID and should NOT
    // be unpublished by this endpoint.
    const results = {
      marketAnalysis: { scanned: 0, fixed: 0, details: [] as string[] },
      economicReport: { scanned: 0, fixed: 0, details: [] as string[] },
    };

    // ── Fix MarketAnalysis ──
    const publishedAnalyses = await db.marketAnalysis.findMany({
      where: { isPublished: true, locale: 'ar' },
      select: { id: true, title: true, content: true, confidenceScore: true, slug: true },
    });
    results.marketAnalysis.scanned = publishedAnalyses.length;

    for (const analysis of publishedAnalyses) {
      let shouldUnpublish = false;
      let reason = '';

      // Check for "لا تنشر" in content
      if (analysis.content && /لا\s*تنشر/i.test(analysis.content)) {
        shouldUnpublish = true;
        reason = 'Contains "لا تنشر" directive';
      }

      // Check for low confidence in content (≤ 6/10)
      if (analysis.content) {
        const confMatch = analysis.content.match(/(?:مستوى\s*)?ثقة\s*[:\s]*(\d+)\s*\/\s*10/i);
        if (confMatch) {
          const score = parseInt(confMatch[1], 10);
          if (score <= 6) {
            shouldUnpublish = true;
            reason = reason ? `${reason}; AI confidence ${score}/10` : `AI confidence ${score}/10`;
          }
        }
      }

      // V364: Only unpublish if confidence < 25 (was 40 — way too aggressive)
      if (analysis.confidenceScore < 25) {
        shouldUnpublish = true;
        reason = reason ? `${reason}; confidenceScore=${analysis.confidenceScore}` : `confidenceScore=${analysis.confidenceScore} < 25`;
      }

      if (shouldUnpublish) {
        await db.marketAnalysis.update({
          where: { id: analysis.id },
          data: { isPublished: false, publishedAt: null },
        });
        results.marketAnalysis.fixed++;
        results.marketAnalysis.details.push(`[${analysis.slug}] "${analysis.title?.slice(0, 50)}": ${reason}`);
      }
    }

    // ── Fix EconomicReport ──
    const publishedReports = await db.economicReport.findMany({
      where: { isPublished: true, locale: 'ar' },
      select: { id: true, title: true, content: true, confidenceScore: true, slug: true },
    });
    results.economicReport.scanned = publishedReports.length;

    for (const report of publishedReports) {
      let shouldUnpublish = false;
      let reason = '';

      // Check for "لا تنشر" in content
      if (report.content && /لا\s*تنشر/i.test(report.content)) {
        shouldUnpublish = true;
        reason = 'Contains "لا تنشر" directive';
      }

      // Check for low confidence in content (≤ 6/10)
      if (report.content) {
        const confMatch = report.content.match(/(?:مستوى\s*)?ثقة\s*[:\s]*(\d+)\s*\/\s*10/i);
        if (confMatch) {
          const score = parseInt(confMatch[1], 10);
          if (score <= 6) {
            shouldUnpublish = true;
            reason = reason ? `${reason}; AI confidence ${score}/10` : `AI confidence ${score}/10`;
          }
        }
      }

      // V364: Only unpublish if confidence < 25 (was 40 — way too aggressive)
      if (report.confidenceScore < 25) {
        shouldUnpublish = true;
        reason = reason ? `${reason}; confidenceScore=${report.confidenceScore}` : `confidenceScore=${report.confidenceScore} < 25`;
      }

      if (shouldUnpublish) {
        await db.economicReport.update({
          where: { id: report.id },
          data: { isPublished: false, publishedAt: null },
        });
        results.economicReport.fixed++;
        results.economicReport.details.push(`[${report.slug}] "${report.title?.slice(0, 50)}": ${reason}`);
      }
    }

    return NextResponse.json({
      success: true,
      action: 'fix',
      message: `Fixed ${results.marketAnalysis.fixed + results.economicReport.fixed} reports`,
      results,
    });
  } catch (error: any) {
    console.error('[FixReports V364] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
