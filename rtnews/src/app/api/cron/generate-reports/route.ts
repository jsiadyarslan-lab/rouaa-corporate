// ─── Scheduled Report Generation Cron V110 ──────────────────
// Handles automatic report generation triggered by cron schedules.
// Actions: generate-daily, generate-weekly, generate-monthly,
//          generate-analyses, generate-technical-analysis, generate-special
// Protected with CRON_SECRET + x-internal header check.
//
// V110: Reads schedule config from DB. Each action checks:
//   1. Is this report type enabled?
//   2. Should it generate at this hour?
//   If not, returns immediately with minimal cost.
//   Manual triggers (?force=true) bypass schedule checks.
//
// V69: All saves use force=true since descriptive titles + timestamp slugs
// guarantee uniqueness. No more "same type today" dedup needed.

import { NextResponse } from 'next/server';
import {
  generateDailyBrief,
  generateWeeklyAnalysis,
  generateMonthlyOutlook,
  generateSpecialReport,
  generateMarketAnalysis,
  generateTechnicalAnalysis,
  saveReportToDb,
  saveAnalysisToDb,
  type AssetClass,
} from '@/lib/report-generator';
import {
  getReportScheduleConfig,
  shouldGenerateNow,
} from '@/lib/report-schedule-config';
import { verifyInternalOrCronAuth, verifyAdminToken } from '@/lib/auth-utils';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow up to 5 minutes for report generation (9 asset classes)

// V223: Support admin cookie auth for manual dashboard triggers
// The dashboard sends requests with credentials: 'include' (admin JWT cookie),
// but verifyInternalOrCronAuth only checks headers/params, not cookies.
async function verifyAuthWithCookie(request: Request): Promise<boolean> {
  // 1. Check internal/cron auth (headers, params)
  if (verifyInternalOrCronAuth(request)) return true;

  // 2. Check admin JWT cookie (for dashboard manual triggers)
  try {
    const token = (request as NextRequest).cookies?.get?.('admin_token')?.value;
    if (token && await verifyAdminToken(token)) return true;
  } catch {}

  return false;
}

// ─── POST Handler ───────────────────────────────────────────
export async function POST(request: Request) {
  const startTime = Date.now();

  // V223: Auth check — now also accepts admin cookie from dashboard
  if (!(await verifyAuthWithCookie(request))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const force = searchParams.get('force') === 'true'; // V110: Force bypass schedule check

  if (!action) {
    return NextResponse.json(
      { error: 'الإجراء مطلوب. الإجراءات المتاحة: generate-daily, generate-weekly, generate-monthly, generate-analyses, generate-technical-analysis, generate-special' },
      { status: 400 }
    );
  }

  // V110: Load schedule config (cached for 30s)
  const config = await getReportScheduleConfig();

  console.log(`[CronGenerateReports V110] Starting action: ${action} (force=${force})`);

  try {
    switch (action) {
      // ── Generate Daily Briefs for ALL Asset Classes ─────────
      case 'generate-daily': {
        // V110: Check schedule unless forced
        if (!force && !shouldGenerateNow('daily', config)) {
          console.log(`[CronGenerateReports] Daily report not scheduled for this hour — skipping (use ?force=true to override)`);
          return NextResponse.json({
            success: true,
            action: 'generate-daily',
            skipped: true,
            reason: 'not_scheduled',
            message: 'التقرير اليومي غير مجدول لهذه الساعة',
            config: {
              enabled: config.dailyEnabled,
              timesPerDay: config.dailyTimesPerDay,
              hour: config.dailyHour,
            },
          });
        }

        const assetClasses: AssetClass[] = config.analysesAssetClasses as AssetClass[];
        const results: Array<{ assetClass: string; id?: string; title?: string; confidence: number; published: boolean; error?: string }> = [];

        // Generate a general daily brief
        try {
          const report = await generateDailyBrief(undefined, undefined, config.dailyWordCount);
          const saved = await saveReportToDb(report, true);
          results.push({
            assetClass: 'general',
            id: saved?.id,
            title: saved?.title,
            confidence: report.confidenceScore,
            published: report.isPublished,
          });
        } catch (error: any) {
          console.error(`[CronGenerateReports] Error generating general daily:`, error.message);
          results.push({ assetClass: 'general', confidence: 0, published: false, error: error.message });
        }

        // Generate per-asset-class analyses (acts as daily reports per category)
        for (const ac of assetClasses) {
          try {
            // V166: forceFull=true — auto-generated reports should be comprehensive
            const analysis = await generateMarketAnalysis(ac, undefined, undefined, undefined, undefined, true);
            const saved = await saveAnalysisToDb(analysis, true);
            results.push({
              assetClass: ac,
              id: saved?.id,
              title: saved?.title,
              confidence: analysis.confidenceScore,
              published: analysis.isPublished,
            });
          } catch (error: any) {
            console.error(`[CronGenerateReports] Error generating ${ac} daily analysis:`, error.message);
            results.push({ assetClass: ac, confidence: 0, published: false, error: error.message });
          }
        }

        const duration = Date.now() - startTime;
        console.log(`[CronGenerateReports] generate-daily completed in ${duration}ms`);

        return NextResponse.json({
          success: true,
          action: 'generate-daily',
          duration,
          results,
        });
      }

      // ── Generate Weekly Analysis ──────────────────────────
      case 'generate-weekly': {
        if (!force && !shouldGenerateNow('weekly', config)) {
          console.log(`[CronGenerateReports] Weekly report not scheduled for this hour — skipping`);
          return NextResponse.json({
            success: true,
            action: 'generate-weekly',
            skipped: true,
            reason: 'not_scheduled',
            message: 'التقرير الأسبوعي غير مجدول لهذا اليوم/الساعة',
            config: {
              enabled: config.weeklyEnabled,
              day: config.weeklyDay,
              hour: config.weeklyHour,
            },
          });
        }

        const report = await generateWeeklyAnalysis(undefined, undefined, undefined, config.weeklyWordCount);
        const saved = await saveReportToDb(report, true);

        const duration = Date.now() - startTime;
        console.log(`[CronGenerateReports] generate-weekly completed in ${duration}ms`);

        return NextResponse.json({
          success: true,
          action: 'generate-weekly',
          duration,
          report: saved
            ? { id: saved.id, title: saved.title, confidence: report.confidenceScore, published: report.isPublished }
            : null,
        });
      }

      // ── Generate Monthly Outlook ──────────────────────────
      case 'generate-monthly': {
        if (!force && !shouldGenerateNow('monthly', config)) {
          console.log(`[CronGenerateReports] Monthly report not scheduled for this hour — skipping`);
          return NextResponse.json({
            success: true,
            action: 'generate-monthly',
            skipped: true,
            reason: 'not_scheduled',
            message: 'التقرير الشهري غير مجدول لهذا اليوم/الساعة',
            config: {
              enabled: config.monthlyEnabled,
              day: config.monthlyDay,
              hour: config.monthlyHour,
            },
          });
        }

        const report = await generateMonthlyOutlook(undefined, undefined, undefined, config.monthlyWordCount);
        const saved = await saveReportToDb(report, true);

        const duration = Date.now() - startTime;
        console.log(`[CronGenerateReports] generate-monthly completed in ${duration}ms`);

        return NextResponse.json({
          success: true,
          action: 'generate-monthly',
          duration,
          report: saved
            ? { id: saved.id, title: saved.title, confidence: report.confidenceScore, published: report.isPublished }
            : null,
        });
      }

      // ── Generate Analyses for All Asset Classes ───────────
      case 'generate-analyses': {
        if (!force && !shouldGenerateNow('analyses', config)) {
          console.log(`[CronGenerateReports] Analyses not scheduled for this hour — skipping`);
          return NextResponse.json({
            success: true,
            action: 'generate-analyses',
            skipped: true,
            reason: 'not_scheduled',
            message: 'التحليلات غير مجدولة لهذه الساعة',
            config: {
              enabled: config.analysesEnabled,
              timesPerDay: config.analysesTimesPerDay,
            },
          });
        }

        const assetClasses: AssetClass[] = config.analysesAssetClasses as AssetClass[];
        // V224: Skip disabled asset classes (chronic quality issues — insufficient data sources)
        // V335: Re-enabled arabMarkets — data sources now sufficient
        const V224_DISABLED: AssetClass[] = ['realEstate'];
        const enabledAssetClasses = assetClasses.filter(ac => !V224_DISABLED.includes(ac));
        if (enabledAssetClasses.length < assetClasses.length) {
          const skipped = assetClasses.filter(ac => V224_DISABLED.includes(ac));
          console.log(`[CronGenerateReports V224] ⏭️ Skipping disabled asset classes: ${skipped.join(', ')}`);
        }
        const results: Array<{ assetClass: string; id?: string; title?: string; confidence: number; published: boolean; error?: string }> = [];

        for (const ac of enabledAssetClasses) {
          try {
            // V166: forceFull=true — auto-generated reports should be comprehensive
            const analysis = await generateMarketAnalysis(ac, undefined, undefined, undefined, undefined, true);
            const saved = await saveAnalysisToDb(analysis, true);
            results.push({
              assetClass: ac,
              id: saved?.id,
              title: saved?.title,
              confidence: analysis.confidenceScore,
              published: analysis.isPublished,
            });
          } catch (error: any) {
            console.error(`[CronGenerateReports] Error generating ${ac} analysis:`, error.message);
            results.push({
              assetClass: ac,
              confidence: 0,
              published: false,
              error: error.message,
            });
          }
        }

        const duration = Date.now() - startTime;
        console.log(`[CronGenerateReports] generate-analyses completed in ${duration}ms`);

        return NextResponse.json({
          success: true,
          action: 'generate-analyses',
          duration,
          results,
        });
      }

      // ── Generate Technical Analysis ─────────────────────
      case 'generate-technical-analysis': {
        if (!force && !shouldGenerateNow('technical', config)) {
          console.log(`[CronGenerateReports] Technical analysis not scheduled for this hour — skipping`);
          return NextResponse.json({
            success: true,
            action: 'generate-technical-analysis',
            skipped: true,
            reason: 'not_scheduled',
            message: 'التحليل الفني غير مجدول لهذه الساعة',
            config: {
              enabled: config.technicalEnabled,
              timesPerDay: config.technicalTimesPerDay,
            },
          });
        }

        // Optionally specify a pair via ?pair=EUR/USD
        const specificPair = searchParams.get('pair') || undefined;
        const analysis = await generateTechnicalAnalysis(specificPair);
        const saved = await saveAnalysisToDb(analysis, true);

        const duration = Date.now() - startTime;
        console.log(`[CronGenerateReports] generate-technical-analysis completed in ${duration}ms`);

        return NextResponse.json({
          success: true,
          action: 'generate-technical-analysis',
          duration,
          analysis: saved
            ? { id: saved.id, title: saved.title, confidence: analysis.confidenceScore, published: analysis.isPublished }
            : null,
        });
      }

      // ── Generate Special Event Report ─────────────────────
      case 'generate-special': {
        // Special reports are always allowed (manual trigger)
        let event = searchParams.get('event');

        if (!event) {
          try {
            const body = await request.json() as { event?: string };
            event = body.event;
          } catch { /* no body */ }
        }

        if (!event) {
          return NextResponse.json(
            { error: 'اسم الحدث مطلوب للتقرير الخاص. مرر ?event=... في URL أو {event: "..."} في الجسم' },
            { status: 400 }
          );
        }

        const report = await generateSpecialReport(event);
        const saved = await saveReportToDb(report, true);

        const duration = Date.now() - startTime;
        console.log(`[CronGenerateReports] generate-special completed in ${duration}ms for event: ${event}`);

        return NextResponse.json({
          success: true,
          action: 'generate-special',
          event,
          duration,
          report: saved
            ? { id: saved.id, title: saved.title, confidence: report.confidenceScore, published: report.isPublished }
            : null,
        });
      }

      default:
        return NextResponse.json(
          { error: `إجراء غير معروف: "${action}". الإجراءات المتاحة: generate-daily, generate-weekly, generate-monthly, generate-analyses, generate-technical-analysis, generate-special` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[CronGenerateReports] Error in action "${action}":`, error.message);
    return NextResponse.json(
      {
        success: false,
        action,
        duration,
        error: process.env.NODE_ENV === 'production' ? 'حدث خطأ أثناء إنشاء التقرير' : error.message,
      },
      { status: 500 }
    );
  }
}

// ── Allow GET for easy cron pings ───────────────────────────
export async function GET(request: Request) {
  return POST(request);
}
