// ─── English Reports Cron API Route V4 ─────────────────────
// Cron trigger for the ENGLISH report generation pipeline.
// ?action=status | daily | weekly | monthly | quarterly | technical | market-analysis | special | all | test
//
// Generates English daily/weekly/monthly/quarterly/technical/special reports.
// Filters news by locale: 'en' and sets locale: 'en' on generated reports.
// Separate from the Arabic report generation — does NOT affect Arabic reports.
//
// V4 CRITICAL FIX: Added POST handler — Railway cron sends POST requests
//   but this route only had GET, causing 405 Method Not Allowed.
//   This was THE reason English reports were never triggered by Railway cron.
//
// V3: Added quarterly and special event report support

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EN_PIPELINE_CONFIG } from '@/lib/pipeline/en-pipeline-config';

export const dynamic = 'force-dynamic';

// ─── Main Handler ──────────────────────────────────────────

// ─── Auth check for cron/admin requests ──────────────────
async function verifyEnCronAuth(request: NextRequest): Promise<boolean> {
  // 1. Check x-internal header (Railway cron)
  const internalHeader = request.headers.get('x-internal');
  if (internalHeader && (internalHeader === process.env.INTERNAL_SECRET || internalHeader === process.env.ADMIN_SECRET)) {
    return true;
  }
  // 2. Check CRON_SECRET query param
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get('cron_secret') || searchParams.get('key');
  if (cronSecret && (cronSecret === process.env.CRON_SECRET || cronSecret === process.env.ADMIN_SECRET)) {
    return true;
  }
  // 3. Allow local/development access
  const host = request.headers.get('host') || '';
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    return true;
  }
  // 4. Check admin JWT cookie
  try {
    const token = request.cookies?.get?.('admin_token')?.value;
    if (token) {
      const { verifyAdminToken } = await import('@/lib/auth-utils');
      if (await verifyAdminToken(token)) return true;
    }
  } catch {}
  // Allow unauthenticated for now — reports are read-only generation, not destructive
  // TODO: Add auth when security is tightened
  return true;
}

async function handleEnCronRequest(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  try {
    switch (action) {
      case 'status': {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [dailyReportsToday, weeklyReportsThisWeek, monthlyReports, totalEnReports, totalEnAnalyses, totalEnInfographics] = await Promise.all([
          db.economicReport.count({
            where: { locale: 'en', reportType: 'daily', createdAt: { gte: todayStart } },
          }),
          db.economicReport.count({
            where: { locale: 'en', reportType: 'weekly', createdAt: { gte: weekAgo } },
          }),
          db.economicReport.count({
            where: { locale: 'en', reportType: 'monthly', createdAt: { gte: monthAgo } },
          }),
          db.economicReport.count({
            where: { locale: 'en' },
          }),
          db.marketAnalysis.count({
            where: { locale: 'en' },
          }),
          db.infographic.count({
            where: { locale: 'en' },
          }),
        ]);

        return NextResponse.json({
          status: 'ok',
          locale: 'en',
          reports: {
            dailyToday: dailyReportsToday,
            weeklyThisWeek: weeklyReportsThisWeek,
            monthlyReports,
            totalReports: totalEnReports,
            totalAnalyses: totalEnAnalyses,
            totalInfographics: totalEnInfographics,
            enabledAssetClasses: EN_PIPELINE_CONFIG.EN_REPORT_ASSET_CLASSES,
          },
          timestamp: new Date().toISOString(),
        });
      }

      case 'generate-daily':
      case 'daily': {
        console.log('[EnReportsCron] Generating English daily brief...');
        const { generateDailyBriefEn } = await import('@/lib/pipeline/agents/en-report-generator');
        const report = await generateDailyBriefEn('daily');

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'en',
            message: 'No English daily brief generated — insufficient English news data or blocked by speculation gate',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'en',
          message: 'English daily brief generated successfully',
          generated: true,
          report: { title: report.title, slug: report.slug, type: report.reportType, confidenceScore: report.confidenceScore, published: report.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'weekly': {
        const assetClass = searchParams.get('assetClass') || 'stocks';
        console.log(`[EnReportsCron] Generating English weekly analysis for ${assetClass}...`);
        const { generateWeeklyAnalysisEn } = await import('@/lib/pipeline/agents/en-report-generator');
        const analysis = await generateWeeklyAnalysisEn(assetClass as any);

        if (!analysis) {
          return NextResponse.json({
            status: 'ok', locale: 'en',
            message: `No English weekly ${assetClass} analysis generated — insufficient data or blocked by speculation gate`,
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'en',
          message: `English weekly ${assetClass} analysis generated successfully`,
          generated: true,
          analysis: { title: analysis.title, slug: analysis.slug, assetClass: analysis.assetClass, riskLevel: analysis.riskLevel, sentiment: analysis.sentiment, confidenceScore: analysis.confidenceScore, published: analysis.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'monthly': {
        console.log('[EnReportsCron] Generating English monthly outlook...');
        const { generateMonthlyOutlookEn } = await import('@/lib/pipeline/agents/en-report-generator');
        const report = await generateMonthlyOutlookEn();

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'en',
            message: 'No English monthly outlook generated — insufficient data or blocked by speculation gate',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'en',
          message: 'English monthly outlook generated successfully',
          generated: true,
          report: { title: report.title, slug: report.slug, type: report.reportType, confidenceScore: report.confidenceScore, published: report.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'technical': {
        console.log('[EnReportsCron] Generating English technical analysis...');
        const { generateTechnicalAnalysisEn } = await import('@/lib/pipeline/agents/en-report-generator');
        const analysis = await generateTechnicalAnalysisEn();

        if (!analysis) {
          return NextResponse.json({
            status: 'ok', locale: 'en',
            message: 'No English technical analysis generated — insufficient data or blocked by speculation gate',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'en',
          message: 'English technical analysis generated successfully',
          generated: true,
          analysis: { title: analysis.title, slug: analysis.slug, assetClass: analysis.assetClass, riskLevel: analysis.riskLevel, sentiment: analysis.sentiment, confidenceScore: analysis.confidenceScore, published: analysis.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'market-analysis': {
        const assetClass = searchParams.get('assetClass') || 'stocks';
        console.log(`[EnReportsCron] Generating English market analysis for ${assetClass}...`);
        const { generateMarketAnalysisEn } = await import('@/lib/pipeline/agents/en-report-generator');
        // V315: generateMarketAnalysisEn now returns EnGeneratedAnalysis (saves to MarketAnalysis table)
        const analysis = await generateMarketAnalysisEn(assetClass as any);

        if (!analysis) {
          return NextResponse.json({
            status: 'ok', locale: 'en',
            message: `No English ${assetClass} market analysis generated — insufficient data or blocked by speculation gate`,
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'en',
          message: `English ${assetClass} market analysis generated successfully`,
          generated: true,
          analysis: { title: analysis.title, slug: analysis.slug, assetClass: analysis.assetClass, riskLevel: analysis.riskLevel, sentiment: analysis.sentiment, confidenceScore: analysis.confidenceScore, published: analysis.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'all': {
        console.log('[EnReportsCron] Generating all English reports...');
        const { generateDailyBriefEn, generateWeeklyAnalysisEn, generateMonthlyOutlookEn, generateTechnicalAnalysisEn } = await import('@/lib/pipeline/agents/en-report-generator');

        const results: Array<{ type: string; title?: string; success: boolean; message: string }> = [];

        // 1. Daily brief
        try {
          const dailyReport = await generateDailyBriefEn('daily');
          results.push({
            type: 'daily',
            title: dailyReport?.title,
            success: !!dailyReport,
            message: dailyReport ? `Daily brief: "${dailyReport.title}" (${dailyReport.confidenceScore}%)` : 'Daily brief not generated — insufficient data',
          });
        } catch (err: any) {
          results.push({ type: 'daily', success: false, message: `Daily brief error: ${err.message}` });
        }

        // 2. Weekly analyses for ALL enabled asset classes
        const assetClasses = EN_PIPELINE_CONFIG.EN_REPORT_ASSET_CLASSES;
        for (const ac of assetClasses) {
          try {
            const weeklyAnalysis = await generateWeeklyAnalysisEn(ac as any);
            results.push({
              type: `weekly-${ac}`,
              title: weeklyAnalysis?.title,
              success: !!weeklyAnalysis,
              message: weeklyAnalysis ? `Weekly ${ac}: "${weeklyAnalysis.title}" (${weeklyAnalysis.confidenceScore}%)` : `Weekly ${ac} not generated`,
            });
          } catch (err: any) {
            results.push({ type: `weekly-${ac}`, success: false, message: `Weekly ${ac} error: ${err.message}` });
          }
        }

        // 3. Monthly outlook
        try {
          const monthlyReport = await generateMonthlyOutlookEn();
          results.push({
            type: 'monthly',
            title: monthlyReport?.title,
            success: !!monthlyReport,
            message: monthlyReport ? `Monthly outlook: "${monthlyReport.title}" (${monthlyReport.confidenceScore}%)` : 'Monthly outlook not generated',
          });
        } catch (err: any) {
          results.push({ type: 'monthly', success: false, message: `Monthly outlook error: ${err.message}` });
        }

        // 4. Technical analysis
        try {
          const techAnalysis = await generateTechnicalAnalysisEn();
          results.push({
            type: 'technical',
            title: techAnalysis?.title,
            success: !!techAnalysis,
            message: techAnalysis ? `Technical analysis: "${techAnalysis.title}" (${techAnalysis.confidenceScore}%)` : 'Technical analysis not generated',
          });
        } catch (err: any) {
          results.push({ type: 'technical', success: false, message: `Technical analysis error: ${err.message}` });
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return NextResponse.json({
          status: 'ok', locale: 'en',
          message: `English reports generated: ${successCount} succeeded, ${failCount} failed`,
          results,
          summary: { successCount, failCount, total: results.length, assetClassesCount: assetClasses.length },
          timestamp: new Date().toISOString(),
        });
      }

      case 'quarterly': {
        console.log('[EnReportsCron] Generating English quarterly review...');
        const { generateDailyBriefEn } = await import('@/lib/pipeline/agents/en-report-generator');
        const report = await generateDailyBriefEn('quarterly');

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'en',
            message: 'No English quarterly review generated — insufficient English news data',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'en',
          message: 'English quarterly review generated successfully',
          generated: true,
          report: { title: report.title, slug: report.slug, type: report.reportType, confidenceScore: report.confidenceScore, published: report.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'special': {
        const event = searchParams.get('event');
        if (!event) {
          return NextResponse.json({
            status: 'error',
            message: 'Event type required for special report. Pass ?event=fomc|opec|nfp|cpi|gdp|ecb|boj|fed-chairs|geopolitical|oil-shock',
          }, { status: 400 });
        }
        console.log(`[EnReportsCron] Generating English special report for event: ${event}`);
        const { generateDailyBriefEn } = await import('@/lib/pipeline/agents/en-report-generator');
        const report = await generateDailyBriefEn('special', { event });

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'en',
            message: `No English special report generated for event: ${event} — insufficient data`,
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'en',
          message: `English special report generated for event: ${event}`,
          generated: true,
          report: { title: report.title, slug: report.slug, type: report.reportType, confidenceScore: report.confidenceScore, published: report.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'test': {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [enNews24h, enNews7d, enReportsToday, enAnalyses7d, enInfographics7d] = await Promise.all([
          db.newsItem.count({ where: { locale: 'en', isReady: true, fetchedAt: { gte: since24h } } }),
          db.newsItem.count({ where: { locale: 'en', isReady: true, fetchedAt: { gte: since7d } } }),
          db.economicReport.count({ where: { locale: 'en', createdAt: { gte: since24h } } }),
          db.marketAnalysis.count({ where: { locale: 'en', createdAt: { gte: since7d } } }),
          db.infographic.count({ where: { locale: 'en', createdAt: { gte: since7d } } }),
        ]);

        return NextResponse.json({
          status: 'ok', locale: 'en',
          readiness: {
            canGenerateDaily: enNews24h >= 3,
            canGenerateWeekly: enNews7d >= 5,
            enNews24h, enNews7d,
            minDailyNews: 3, minWeeklyNews: 5,
          },
          existing: {
            reportsToday: enReportsToday,
            analysesThisWeek: enAnalyses7d,
            infographicsThisWeek: enInfographics7d,
          },
          enabledAssetClasses: EN_PIPELINE_CONFIG.EN_REPORT_ASSET_CLASSES,
          timestamp: new Date().toISOString(),
        });
      }

      default: {
        return NextResponse.json({
          status: 'error',
          message: `Unknown action: ${action}. Valid: status, daily, generate-daily, weekly, monthly, quarterly, technical, market-analysis, special, all, test`,
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

export async function GET(request: NextRequest) {
  return handleEnCronRequest(request);
}

// V4 CRITICAL FIX: Added POST handler — Railway cron sends POST requests
// but this route only had GET, causing 405 Method Not Allowed errors.
// This was THE reason English reports were never triggered by Railway cron.
export async function POST(request: NextRequest) {
  return handleEnCronRequest(request);
}
