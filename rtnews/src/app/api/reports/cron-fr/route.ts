// ─── French Reports Cron API Route V3 ─────────────────────
// Cron trigger for the FRENCH report generation pipeline.
// ?action=status | daily | weekly | monthly | quarterly | technical | market-analysis | special | all | test
//
// Generates French daily/weekly/monthly/quarterly/technical/special reports.
// Filters news by locale: 'fr' and sets locale: 'fr' on generated reports.
// Separate from the Arabic and English report generation — does NOT affect them.
//
// V3: Added quarterly and special event report support

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FR_PIPELINE_CONFIG } from '@/lib/pipeline/fr-pipeline-config';

export const dynamic = 'force-dynamic';

// ─── Main Handler ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status': {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [dailyReportsToday, weeklyReportsThisWeek, monthlyReports, totalFrReports, totalFrAnalyses, totalFrInfographics] = await Promise.all([
          db.economicReport.count({
            where: { locale: 'fr', reportType: 'daily', createdAt: { gte: todayStart } },
          }),
          db.economicReport.count({
            where: { locale: 'fr', reportType: 'weekly', createdAt: { gte: weekAgo } },
          }),
          db.economicReport.count({
            where: { locale: 'fr', reportType: 'monthly', createdAt: { gte: monthAgo } },
          }),
          db.economicReport.count({
            where: { locale: 'fr' },
          }),
          db.marketAnalysis.count({
            where: { locale: 'fr' },
          }),
          db.infographic.count({
            where: { locale: 'fr' },
          }),
        ]);

        return NextResponse.json({
          status: 'ok',
          locale: 'fr',
          reports: {
            dailyToday: dailyReportsToday,
            weeklyThisWeek: weeklyReportsThisWeek,
            monthlyReports,
            totalReports: totalFrReports,
            totalAnalyses: totalFrAnalyses,
            totalInfographics: totalFrInfographics,
            enabledAssetClasses: FR_PIPELINE_CONFIG.FR_REPORT_ASSET_CLASSES,
          },
          timestamp: new Date().toISOString(),
        });
      }

      case 'generate-daily':
      case 'daily': {
        console.log('[FrReportsCron] Génération du résumé quotidien français...');
        const { generateDailyBriefFr } = await import('@/lib/pipeline/agents/fr-report-generator');
        const report = await generateDailyBriefFr('daily');

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'fr',
            message: 'Aucun résumé quotidien français généré — données françaises insuffisantes ou bloqué par la porte de spéculation',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'fr',
          message: 'Résumé quotidien français généré avec succès',
          generated: true,
          report: { title: report.title, slug: report.slug, type: report.reportType, confidenceScore: report.confidenceScore, published: report.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'weekly': {
        const assetClass = searchParams.get('assetClass') || 'stocks';
        console.log(`[FrReportsCron] Génération de l'analyse hebdomadaire française pour ${assetClass}...`);
        const { generateWeeklyAnalysisFr } = await import('@/lib/pipeline/agents/fr-report-generator');
        const analysis = await generateWeeklyAnalysisFr(assetClass as any);

        if (!analysis) {
          return NextResponse.json({
            status: 'ok', locale: 'fr',
            message: `Aucune analyse hebdomadaire française pour ${assetClass} générée — données insuffisantes ou bloqué par la porte de spéculation`,
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'fr',
          message: `Analyse hebdomadaire française pour ${assetClass} générée avec succès`,
          generated: true,
          analysis: { title: analysis.title, slug: analysis.slug, assetClass: analysis.assetClass, riskLevel: analysis.riskLevel, sentiment: analysis.sentiment, confidenceScore: analysis.confidenceScore, published: analysis.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'monthly': {
        console.log('[FrReportsCron] Génération des perspectives mensuelles françaises...');
        const { generateMonthlyOutlookFr } = await import('@/lib/pipeline/agents/fr-report-generator');
        const report = await generateMonthlyOutlookFr();

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'fr',
            message: 'Aucune perspective mensuelle française générée — données insuffisantes ou bloqué par la porte de spéculation',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'fr',
          message: 'Perspectives mensuelles françaises générées avec succès',
          generated: true,
          report: { title: report.title, slug: report.slug, type: report.reportType, confidenceScore: report.confidenceScore, published: report.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'technical': {
        console.log('[FrReportsCron] Génération de l\'analyse technique française...');
        const { generateTechnicalAnalysisFr } = await import('@/lib/pipeline/agents/fr-report-generator');
        const analysis = await generateTechnicalAnalysisFr();

        if (!analysis) {
          return NextResponse.json({
            status: 'ok', locale: 'fr',
            message: 'Aucune analyse technique française générée — données insuffisantes ou bloqué par la porte de spéculation',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'fr',
          message: 'Analyse technique française générée avec succès',
          generated: true,
          analysis: { title: analysis.title, slug: analysis.slug, assetClass: analysis.assetClass, riskLevel: analysis.riskLevel, sentiment: analysis.sentiment, confidenceScore: analysis.confidenceScore, published: analysis.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'market-analysis': {
        const assetClass = searchParams.get('assetClass') || 'stocks';
        console.log(`[FrReportsCron] Génération de l'analyse de marché française pour ${assetClass}...`);
        const { generateMarketAnalysisFr } = await import('@/lib/pipeline/agents/fr-report-generator');
        const analysis = await generateMarketAnalysisFr(assetClass as any);

        if (!analysis) {
          return NextResponse.json({
            status: 'ok', locale: 'fr',
            message: `Aucune analyse de marché française pour ${assetClass} générée — données insuffisantes ou bloqué par la porte de spéculation`,
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'fr',
          message: `Analyse de marché française pour ${assetClass} générée avec succès`,
          generated: true,
          analysis: { title: analysis.title, slug: analysis.slug, assetClass: analysis.assetClass, riskLevel: analysis.riskLevel, sentiment: analysis.sentiment, confidenceScore: analysis.confidenceScore, published: analysis.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'all': {
        console.log('[FrReportsCron] Génération de tous les rapports français...');
        const { generateDailyBriefFr, generateWeeklyAnalysisFr, generateMonthlyOutlookFr, generateTechnicalAnalysisFr } = await import('@/lib/pipeline/agents/fr-report-generator');

        const results: Array<{ type: string; title?: string; success: boolean; message: string }> = [];

        // 1. Daily brief
        try {
          const dailyReport = await generateDailyBriefFr('daily');
          results.push({
            type: 'daily',
            title: dailyReport?.title,
            success: !!dailyReport,
            message: dailyReport ? `Résumé quotidien: "${dailyReport.title}" (${dailyReport.confidenceScore}%)` : 'Résumé quotidien non généré — données insuffisantes',
          });
        } catch (err: any) {
          results.push({ type: 'daily', success: false, message: `Erreur résumé quotidien: ${err.message}` });
        }

        // 2. Weekly analyses for ALL enabled asset classes
        const assetClasses = FR_PIPELINE_CONFIG.FR_REPORT_ASSET_CLASSES;
        for (const ac of assetClasses) {
          try {
            const weeklyAnalysis = await generateWeeklyAnalysisFr(ac as any);
            results.push({
              type: `weekly-${ac}`,
              title: weeklyAnalysis?.title,
              success: !!weeklyAnalysis,
              message: weeklyAnalysis ? `Hebdomadaire ${ac}: "${weeklyAnalysis.title}" (${weeklyAnalysis.confidenceScore}%)` : `Hebdomadaire ${ac} non généré`,
            });
          } catch (err: any) {
            results.push({ type: `weekly-${ac}`, success: false, message: `Erreur hebdomadaire ${ac}: ${err.message}` });
          }
        }

        // 3. Monthly outlook
        try {
          const monthlyReport = await generateMonthlyOutlookFr();
          results.push({
            type: 'monthly',
            title: monthlyReport?.title,
            success: !!monthlyReport,
            message: monthlyReport ? `Perspectives mensuelles: "${monthlyReport.title}" (${monthlyReport.confidenceScore}%)` : 'Perspectives mensuelles non générées',
          });
        } catch (err: any) {
          results.push({ type: 'monthly', success: false, message: `Erreur perspectives mensuelles: ${err.message}` });
        }

        // 4. Technical analysis
        try {
          const techAnalysis = await generateTechnicalAnalysisFr();
          results.push({
            type: 'technical',
            title: techAnalysis?.title,
            success: !!techAnalysis,
            message: techAnalysis ? `Analyse technique: "${techAnalysis.title}" (${techAnalysis.confidenceScore}%)` : 'Analyse technique non générée',
          });
        } catch (err: any) {
          results.push({ type: 'technical', success: false, message: `Erreur analyse technique: ${err.message}` });
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return NextResponse.json({
          status: 'ok', locale: 'fr',
          message: `Rapports français générés: ${successCount} réussis, ${failCount} échoués`,
          results,
          summary: { successCount, failCount, total: results.length, assetClassesCount: assetClasses.length },
          timestamp: new Date().toISOString(),
        });
      }

      case 'quarterly': {
        console.log('[FrReportsCron] Génération de la revue trimestrielle française...');
        const { generateDailyBriefFr } = await import('@/lib/pipeline/agents/fr-report-generator');
        const report = await generateDailyBriefFr('quarterly');

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'fr',
            message: 'Aucune revue trimestrielle française générée — données françaises insuffisantes',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'fr',
          message: 'Revue trimestrielle française générée avec succès',
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
            message: 'Type d\'événement requis pour le rapport spécial. Utilisez ?event=fomc|opec|nfp|cpi|gdp|ecb|boj|fed-chairs|geopolitical|oil-shock',
          }, { status: 400 });
        }
        console.log(`[FrReportsCron] Génération du rapport spécial français pour l'événement: ${event}`);
        const { generateDailyBriefFr } = await import('@/lib/pipeline/agents/fr-report-generator');
        const report = await generateDailyBriefFr('special', { event });

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'fr',
            message: `Aucun rapport spécial français généré pour l'événement: ${event} — données insuffisantes`,
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'fr',
          message: `Rapport spécial français généré pour l'événement: ${event}`,
          generated: true,
          report: { title: report.title, slug: report.slug, type: report.reportType, confidenceScore: report.confidenceScore, published: report.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'test': {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [frNews24h, frNews7d, frReportsToday, frAnalyses7d, frInfographics7d] = await Promise.all([
          db.newsItem.count({ where: { locale: 'fr', isReady: true, fetchedAt: { gte: since24h } } }),
          db.newsItem.count({ where: { locale: 'fr', isReady: true, fetchedAt: { gte: since7d } } }),
          db.economicReport.count({ where: { locale: 'fr', createdAt: { gte: since24h } } }),
          db.marketAnalysis.count({ where: { locale: 'fr', createdAt: { gte: since7d } } }),
          db.infographic.count({ where: { locale: 'fr', createdAt: { gte: since7d } } }),
        ]);

        return NextResponse.json({
          status: 'ok', locale: 'fr',
          readiness: {
            canGenerateDaily: frNews24h >= 3,
            canGenerateWeekly: frNews7d >= 5,
            frNews24h, frNews7d,
            minDailyNews: 3, minWeeklyNews: 5,
          },
          existing: {
            reportsToday: frReportsToday,
            analysesThisWeek: frAnalyses7d,
            infographicsThisWeek: frInfographics7d,
          },
          enabledAssetClasses: FR_PIPELINE_CONFIG.FR_REPORT_ASSET_CLASSES,
          timestamp: new Date().toISOString(),
        });
      }

      default: {
        return NextResponse.json({
          status: 'error',
          message: `Action inconnue: ${action}. Actions valides: status, daily, generate-daily, weekly, monthly, quarterly, technical, market-analysis, special, all, test`,
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

// V4 CRITICAL FIX: Added POST handler — Railway cron sends POST requests
// but this route only had GET, causing 405 Method Not Allowed.
// This was THE reason French reports were never triggered by Railway cron.
export async function POST(request: NextRequest) {
  return GET(request);
}
