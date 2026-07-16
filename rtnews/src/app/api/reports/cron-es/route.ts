// ─── Spanish Reports Cron API Route V4 ─────────────────────
// Cron trigger for the SPANISH report generation pipeline.
// ?action=status | daily | weekly | monthly | quarterly | technical | market-analysis | special | strategic | all | test | generate-daily | generate-analyses | generate-technical
//
// Generates Spanish daily/weekly/monthly/quarterly/technical/special/strategic reports.
// Filters news by locale: 'es' and sets locale: 'es' on generated reports.
// Separate from the Arabic, English, French, and Turkish report generation — does NOT affect them.
//
// V3: Added quarterly and special event report support
// V4: Added strategic report support

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ES_PIPELINE_CONFIG } from '@/lib/pipeline/es-pipeline-config';

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

        const [dailyReportsToday, weeklyReportsThisWeek, monthlyReports, totalEsReports, totalEsAnalyses, totalEsInfographics] = await Promise.all([
          db.economicReport.count({
            where: { locale: 'es', reportType: 'daily', createdAt: { gte: todayStart } },
          }),
          db.economicReport.count({
            where: { locale: 'es', reportType: 'weekly', createdAt: { gte: weekAgo } },
          }),
          db.economicReport.count({
            where: { locale: 'es', reportType: 'monthly', createdAt: { gte: monthAgo } },
          }),
          db.economicReport.count({
            where: { locale: 'es' },
          }),
          db.marketAnalysis.count({
            where: { locale: 'es' },
          }),
          db.infographic.count({
            where: { locale: 'es' },
          }),
        ]);

        return NextResponse.json({
          status: 'ok',
          locale: 'es',
          reports: {
            dailyToday: dailyReportsToday,
            weeklyThisWeek: weeklyReportsThisWeek,
            monthlyReports,
            totalReports: totalEsReports,
            totalAnalyses: totalEsAnalyses,
            totalInfographics: totalEsInfographics,
            enabledAssetClasses: ES_PIPELINE_CONFIG.ES_REPORT_ASSET_CLASSES,
          },
          timestamp: new Date().toISOString(),
        });
      }

      case 'generate-daily':
      case 'daily': {
        console.log('[EsReportsCron] Generando informe diario español...');
        const { generateDailyBriefEs } = await import('@/lib/pipeline/agents/es-report-generator');
        const report = await generateDailyBriefEs('daily');

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'es',
            message: 'No se generó ningún informe diario español — datos españoles insuficientes o bloqueado por la puerta de especulación',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'es',
          message: 'Informe diario español generado con éxito',
          generated: true,
          report: { title: report.title, slug: report.slug, type: report.reportType, confidenceScore: report.confidenceScore, published: report.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'weekly': {
        const assetClass = searchParams.get('assetClass') || 'stocks';
        console.log(`[EsReportsCron] Generando análisis semanal español para ${assetClass}...`);
        const { generateWeeklyAnalysisEs } = await import('@/lib/pipeline/agents/es-report-generator');
        const analysis = await generateWeeklyAnalysisEs(assetClass as any);

        if (!analysis) {
          return NextResponse.json({
            status: 'ok', locale: 'es',
            message: `No se generó ningún análisis semanal español para ${assetClass} — datos insuficientes o bloqueado por la puerta de especulación`,
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'es',
          message: `Análisis semanal español para ${assetClass} generado con éxito`,
          generated: true,
          analysis: { title: analysis.title, slug: analysis.slug, assetClass: analysis.assetClass, riskLevel: analysis.riskLevel, sentiment: analysis.sentiment, confidenceScore: analysis.confidenceScore, published: analysis.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'monthly': {
        console.log('[EsReportsCron] Generando perspectivas mensuales españolas...');
        const { generateMonthlyOutlookEs } = await import('@/lib/pipeline/agents/es-report-generator');
        const report = await generateMonthlyOutlookEs();

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'es',
            message: 'No se generaron perspectivas mensuales españolas — datos insuficientes o bloqueado por la puerta de especulación',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'es',
          message: 'Perspectivas mensuales españolas generadas con éxito',
          generated: true,
          report: { title: report.title, slug: report.slug, type: report.reportType, confidenceScore: report.confidenceScore, published: report.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'generate-technical':
      case 'technical': {
        console.log('[EsReportsCron] Generando análisis técnico español...');
        const { generateTechnicalAnalysisEs } = await import('@/lib/pipeline/agents/es-report-generator');
        const analysis = await generateTechnicalAnalysisEs();

        if (!analysis) {
          return NextResponse.json({
            status: 'ok', locale: 'es',
            message: 'No se generó ningún análisis técnico español — datos insuficientes o bloqueado por la puerta de especulación',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'es',
          message: 'Análisis técnico español generado con éxito',
          generated: true,
          analysis: { title: analysis.title, slug: analysis.slug, assetClass: analysis.assetClass, riskLevel: analysis.riskLevel, sentiment: analysis.sentiment, confidenceScore: analysis.confidenceScore, published: analysis.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'market-analysis': {
        const assetClass = searchParams.get('assetClass') || 'stocks';
        console.log(`[EsReportsCron] Generando análisis de mercado español para ${assetClass}...`);
        const { generateMarketAnalysisEs } = await import('@/lib/pipeline/agents/es-report-generator');
        const analysis = await generateMarketAnalysisEs(assetClass as any);

        if (!analysis) {
          return NextResponse.json({
            status: 'ok', locale: 'es',
            message: `No se generó ningún análisis de mercado español para ${assetClass} — datos insuficientes o bloqueado por la puerta de especulación`,
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'es',
          message: `Análisis de mercado español para ${assetClass} generado con éxito`,
          generated: true,
          analysis: { title: analysis.title, slug: analysis.slug, assetClass: analysis.assetClass, riskLevel: analysis.riskLevel, sentiment: analysis.sentiment, confidenceScore: analysis.confidenceScore, published: analysis.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'generate-analyses': {
        const assetClasses = ES_PIPELINE_CONFIG.ES_REPORT_ASSET_CLASSES;
        const results: Array<{ type: string; title?: string; success: boolean; message: string }> = [];

        console.log(`[EsReportsCron] Generando análisis semanales españoles para ${assetClasses.length} clases de activos...`);

        for (const ac of assetClasses) {
          try {
            const { generateWeeklyAnalysisEs } = await import('@/lib/pipeline/agents/es-report-generator');
            const analysis = await generateWeeklyAnalysisEs(ac as any);
            results.push({
              type: `weekly-${ac}`,
              title: analysis?.title,
              success: !!analysis,
              message: analysis ? `Semanal ${ac}: "${analysis.title}" (${analysis.confidenceScore}%)` : `Semanal ${ac} no generado`,
            });
          } catch (err: any) {
            results.push({ type: `weekly-${ac}`, success: false, message: `Error semanal ${ac}: ${err.message}` });
          }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return NextResponse.json({
          status: 'ok', locale: 'es',
          message: `Análisis españoles generados: ${successCount} exitosos, ${failCount} fallidos`,
          results,
          summary: { successCount, failCount, total: results.length, assetClassesCount: assetClasses.length },
          timestamp: new Date().toISOString(),
        });
      }

      case 'all': {
        console.log('[EsReportsCron] Generando todos los informes españoles...');
        const { generateDailyBriefEs, generateWeeklyAnalysisEs, generateMonthlyOutlookEs, generateTechnicalAnalysisEs } = await import('@/lib/pipeline/agents/es-report-generator');

        const results: Array<{ type: string; title?: string; success: boolean; message: string }> = [];

        // 1. Daily brief
        try {
          const dailyReport = await generateDailyBriefEs('daily');
          results.push({
            type: 'daily',
            title: dailyReport?.title,
            success: !!dailyReport,
            message: dailyReport ? `Informe diario: "${dailyReport.title}" (${dailyReport.confidenceScore}%)` : 'Informe diario no generado — datos insuficientes',
          });
        } catch (err: any) {
          results.push({ type: 'daily', success: false, message: `Error informe diario: ${err.message}` });
        }

        // 2. Weekly analyses for ALL enabled asset classes
        const assetClasses = ES_PIPELINE_CONFIG.ES_REPORT_ASSET_CLASSES;
        for (const ac of assetClasses) {
          try {
            const weeklyAnalysis = await generateWeeklyAnalysisEs(ac as any);
            results.push({
              type: `weekly-${ac}`,
              title: weeklyAnalysis?.title,
              success: !!weeklyAnalysis,
              message: weeklyAnalysis ? `Semanal ${ac}: "${weeklyAnalysis.title}" (${weeklyAnalysis.confidenceScore}%)` : `Semanal ${ac} no generado`,
            });
          } catch (err: any) {
            results.push({ type: `weekly-${ac}`, success: false, message: `Error semanal ${ac}: ${err.message}` });
          }
        }

        // 3. Monthly outlook
        try {
          const monthlyReport = await generateMonthlyOutlookEs();
          results.push({
            type: 'monthly',
            title: monthlyReport?.title,
            success: !!monthlyReport,
            message: monthlyReport ? `Perspectivas mensuales: "${monthlyReport.title}" (${monthlyReport.confidenceScore}%)` : 'Perspectivas mensuales no generadas',
          });
        } catch (err: any) {
          results.push({ type: 'monthly', success: false, message: `Error perspectivas mensuales: ${err.message}` });
        }

        // 4. Technical analysis
        try {
          const techAnalysis = await generateTechnicalAnalysisEs();
          results.push({
            type: 'technical',
            title: techAnalysis?.title,
            success: !!techAnalysis,
            message: techAnalysis ? `Análisis técnico: "${techAnalysis.title}" (${techAnalysis.confidenceScore}%)` : 'Análisis técnico no generado',
          });
        } catch (err: any) {
          results.push({ type: 'technical', success: false, message: `Error análisis técnico: ${err.message}` });
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return NextResponse.json({
          status: 'ok', locale: 'es',
          message: `Informes españoles generados: ${successCount} exitosos, ${failCount} fallidos`,
          results,
          summary: { successCount, failCount, total: results.length, assetClassesCount: assetClasses.length },
          timestamp: new Date().toISOString(),
        });
      }

      case 'quarterly': {
        console.log('[EsReportsCron] Generando revisión trimestral española...');
        const { generateDailyBriefEs } = await import('@/lib/pipeline/agents/es-report-generator');
        const report = await generateDailyBriefEs('quarterly');

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'es',
            message: 'No se generó ninguna revisión trimestral española — datos españoles insuficientes',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'es',
          message: 'Revisión trimestral española generada con éxito',
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
            message: 'Tipo de evento requerido para el informe especial. Use ?event=fomc|opec|nfp|cpi|gdp|ecb|boj|fed-chairs|geopolitical|oil-shock',
          }, { status: 400 });
        }
        console.log(`[EsReportsCron] Generando informe especial español para el evento: ${event}`);
        const { generateDailyBriefEs } = await import('@/lib/pipeline/agents/es-report-generator');
        const report = await generateDailyBriefEs('special', { event });

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'es',
            message: `No se generó ningún informe especial español para el evento: ${event} — datos insuficientes`,
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'es',
          message: `Informe especial español generado para el evento: ${event}`,
          generated: true,
          report: { title: report.title, slug: report.slug, type: report.reportType, confidenceScore: report.confidenceScore, published: report.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'test': {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [esNews24h, esNews7d, esReportsToday, esAnalyses7d, esInfographics7d] = await Promise.all([
          db.newsItem.count({ where: { locale: 'es', isReady: true, fetchedAt: { gte: since24h } } }),
          db.newsItem.count({ where: { locale: 'es', isReady: true, fetchedAt: { gte: since7d } } }),
          db.economicReport.count({ where: { locale: 'es', createdAt: { gte: since24h } } }),
          db.marketAnalysis.count({ where: { locale: 'es', createdAt: { gte: since7d } } }),
          db.infographic.count({ where: { locale: 'es', createdAt: { gte: since7d } } }),
        ]);

        return NextResponse.json({
          status: 'ok', locale: 'es',
          readiness: {
            canGenerateDaily: esNews24h >= 3,
            canGenerateWeekly: esNews7d >= 5,
            esNews24h, esNews7d,
            minDailyNews: 3, minWeeklyNews: 5,
          },
          existing: {
            reportsToday: esReportsToday,
            analysesThisWeek: esAnalyses7d,
            infographicsThisWeek: esInfographics7d,
          },
          enabledAssetClasses: ES_PIPELINE_CONFIG.ES_REPORT_ASSET_CLASSES,
          timestamp: new Date().toISOString(),
        });
      }

      case 'strategic': {
        const topic = searchParams.get('topic') || searchParams.get('title');
        const region = searchParams.get('region') || 'Global';
        const sectorsParam = searchParams.get('sectors');
        const scenariosParam = searchParams.get('scenarios');
        const sectors = sectorsParam ? sectorsParam.split(',').map(s => s.trim()) : ['Macroeconomics'];
        const scenarios = scenariosParam ? scenariosParam.split(',').map(s => s.trim()) : ['Short-term (1-3 months)', 'Medium-term (6-12 months)'];

        console.log(`[EsReportsCron V4] Generando informe estratégico español: "${topic || 'Análisis estratégico general'}"...`);
        const { generateDailyBriefEs } = await import('@/lib/pipeline/agents/es-report-generator');
        const report = await generateDailyBriefEs('strategic', {
          title: topic || undefined,
          prompt: topic ? undefined : undefined, // Use default strategic prompt if no topic
          region,
          sectors,
          scenarios,
        });

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'es',
            message: 'No se generó ningún informe estratégico español — datos españoles insuficientes o bloqueado por la puerta de especulación',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'es',
          message: 'Informe estratégico español generado con éxito',
          generated: true,
          report: { title: report.title, slug: report.slug, type: report.reportType, confidenceScore: report.confidenceScore, published: report.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      default: {
        return NextResponse.json({
          status: 'error',
          message: `Acción desconocida: ${action}. Acciones válidas: status, daily, generate-daily, weekly, monthly, quarterly, technical, market-analysis, special, strategic, all, generate-analyses, generate-technical, test`,
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
// This was THE reason reports were never triggered by Railway cron.
export async function POST(request: NextRequest) {
  return GET(request);
}
