// ─── Turkish Reports Cron API Route V3 ─────────────────────
// Cron trigger for the TURKISH report generation pipeline.
// ?action=status | daily | generate-daily | weekly | monthly | quarterly | technical | market-analysis | generate-analyses | special | all | test
//
// Generates Turkish daily/weekly/monthly/quarterly/technical/special reports.
// Filters news by locale: 'tr' and sets locale: 'tr' on generated reports.
// Separate from the Arabic, English and French report generation — does NOT affect them.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TR_PIPELINE_CONFIG } from '@/lib/pipeline/tr-pipeline-config';

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

        const [dailyReportsToday, weeklyReportsThisWeek, monthlyReports, totalTrReports, totalTrAnalyses, totalTrInfographics] = await Promise.all([
          db.economicReport.count({
            where: { locale: 'tr', reportType: 'daily', createdAt: { gte: todayStart } },
          }),
          db.economicReport.count({
            where: { locale: 'tr', reportType: 'weekly', createdAt: { gte: weekAgo } },
          }),
          db.economicReport.count({
            where: { locale: 'tr', reportType: 'monthly', createdAt: { gte: monthAgo } },
          }),
          db.economicReport.count({
            where: { locale: 'tr' },
          }),
          db.marketAnalysis.count({
            where: { locale: 'tr' },
          }),
          db.infographic.count({
            where: { locale: 'tr' },
          }),
        ]);

        return NextResponse.json({
          status: 'ok',
          locale: 'tr',
          reports: {
            dailyToday: dailyReportsToday,
            weeklyThisWeek: weeklyReportsThisWeek,
            monthlyReports,
            totalReports: totalTrReports,
            totalAnalyses: totalTrAnalyses,
            totalInfographics: totalTrInfographics,
            enabledAssetClasses: TR_PIPELINE_CONFIG.TR_REPORT_ASSET_CLASSES,
          },
          timestamp: new Date().toISOString(),
        });
      }

      case 'generate-daily':
      case 'daily': {
        console.log('[TrReportsCron] Türk günlük özet oluşturuluyor...');
        const { generateDailyBriefTr } = await import('@/lib/pipeline/agents/tr-report-generator');
        const report = await generateDailyBriefTr('daily');

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'tr',
            message: 'Türk günlük özet oluşturulmadı — yetersiz Türk verisi veya spekülasyon kapısı tarafından engellendi',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'tr',
          message: 'Türk günlük özet başarıyla oluşturuldu',
          generated: true,
          report: { title: report.title, slug: report.slug, type: report.reportType, confidenceScore: report.confidenceScore, published: report.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'weekly': {
        const assetClass = searchParams.get('assetClass') || 'stocks';
        console.log(`[TrReportsCron] ${assetClass} için Türk haftalık analiz oluşturuluyor...`);
        const { generateWeeklyAnalysisTr } = await import('@/lib/pipeline/agents/tr-report-generator');
        const analysis = await generateWeeklyAnalysisTr(assetClass as any);

        if (!analysis) {
          return NextResponse.json({
            status: 'ok', locale: 'tr',
            message: `${assetClass} için Türk haftalık analiz oluşturulmadı — yetersiz veri veya spekülasyon kapısı tarafından engellendi`,
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'tr',
          message: `${assetClass} için Türk haftalık analiz başarıyla oluşturuldu`,
          generated: true,
          analysis: { title: analysis.title, slug: analysis.slug, assetClass: analysis.assetClass, riskLevel: analysis.riskLevel, sentiment: analysis.sentiment, confidenceScore: analysis.confidenceScore, published: analysis.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'monthly': {
        console.log('[TrReportsCron] Türk aylık görünüm oluşturuluyor...');
        const { generateMonthlyOutlookTr } = await import('@/lib/pipeline/agents/tr-report-generator');
        const report = await generateMonthlyOutlookTr();

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'tr',
            message: 'Türk aylık görünüm oluşturulmadı — yetersiz veri veya spekülasyon kapısı tarafından engellendi',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'tr',
          message: 'Türk aylık görünüm başarıyla oluşturuldu',
          generated: true,
          report: { title: report.title, slug: report.slug, type: report.reportType, confidenceScore: report.confidenceScore, published: report.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'technical': {
        console.log('[TrReportsCron] Türk teknik analiz oluşturuluyor...');
        const { generateTechnicalAnalysisTr } = await import('@/lib/pipeline/agents/tr-report-generator');
        const analysis = await generateTechnicalAnalysisTr();

        if (!analysis) {
          return NextResponse.json({
            status: 'ok', locale: 'tr',
            message: 'Türk teknik analiz oluşturulmadı — yetersiz veri veya spekülasyon kapısı tarafından engellendi',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'tr',
          message: 'Türk teknik analiz başarıyla oluşturuldu',
          generated: true,
          analysis: { title: analysis.title, slug: analysis.slug, assetClass: analysis.assetClass, riskLevel: analysis.riskLevel, sentiment: analysis.sentiment, confidenceScore: analysis.confidenceScore, published: analysis.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'market-analysis': {
        const assetClass = searchParams.get('assetClass') || 'stocks';
        console.log(`[TrReportsCron] ${assetClass} için Türk piyasa analizi oluşturuluyor...`);
        const { generateMarketAnalysisTr } = await import('@/lib/pipeline/agents/tr-report-generator');
        const analysis = await generateMarketAnalysisTr(assetClass as any);

        if (!analysis) {
          return NextResponse.json({
            status: 'ok', locale: 'tr',
            message: `${assetClass} için Türk piyasa analizi oluşturulmadı — yetersiz veri veya spekülasyon kapısı tarafından engellendi`,
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'tr',
          message: `${assetClass} için Türk piyasa analizi başarıyla oluşturuldu`,
          generated: true,
          analysis: { title: analysis.title, slug: analysis.slug, assetClass: analysis.assetClass, riskLevel: analysis.riskLevel, sentiment: analysis.sentiment, confidenceScore: analysis.confidenceScore, published: analysis.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'all': {
        console.log('[TrReportsCron] Tüm Türk raporları oluşturuluyor...');
        const { generateDailyBriefTr, generateWeeklyAnalysisTr, generateMonthlyOutlookTr, generateTechnicalAnalysisTr } = await import('@/lib/pipeline/agents/tr-report-generator');

        const results: Array<{ type: string; title?: string; success: boolean; message: string }> = [];

        // 1. Daily brief
        try {
          const dailyReport = await generateDailyBriefTr('daily');
          results.push({
            type: 'daily',
            title: dailyReport?.title,
            success: !!dailyReport,
            message: dailyReport ? `Günlük özet: "${dailyReport.title}" (${dailyReport.confidenceScore}%)` : 'Günlük özet oluşturulmadı — yetersiz veri',
          });
        } catch (err: any) {
          results.push({ type: 'daily', success: false, message: `Günlük özet hatası: ${err.message}` });
        }

        // 2. Weekly analyses for ALL enabled asset classes
        const assetClasses = TR_PIPELINE_CONFIG.TR_REPORT_ASSET_CLASSES;
        for (const ac of assetClasses) {
          try {
            const weeklyAnalysis = await generateWeeklyAnalysisTr(ac as any);
            results.push({
              type: `weekly-${ac}`,
              title: weeklyAnalysis?.title,
              success: !!weeklyAnalysis,
              message: weeklyAnalysis ? `Haftalık ${ac}: "${weeklyAnalysis.title}" (${weeklyAnalysis.confidenceScore}%)` : `Haftalık ${ac} oluşturulmadı`,
            });
          } catch (err: any) {
            results.push({ type: `weekly-${ac}`, success: false, message: `Haftalık ${ac} hatası: ${err.message}` });
          }
        }

        // 3. Monthly outlook
        try {
          const monthlyReport = await generateMonthlyOutlookTr();
          results.push({
            type: 'monthly',
            title: monthlyReport?.title,
            success: !!monthlyReport,
            message: monthlyReport ? `Aylık görünüm: "${monthlyReport.title}" (${monthlyReport.confidenceScore}%)` : 'Aylık görünüm oluşturulmadı',
          });
        } catch (err: any) {
          results.push({ type: 'monthly', success: false, message: `Aylık görünüm hatası: ${err.message}` });
        }

        // 4. Technical analysis
        try {
          const techAnalysis = await generateTechnicalAnalysisTr();
          results.push({
            type: 'technical',
            title: techAnalysis?.title,
            success: !!techAnalysis,
            message: techAnalysis ? `Teknik analiz: "${techAnalysis.title}" (${techAnalysis.confidenceScore}%)` : 'Teknik analiz oluşturulmadı',
          });
        } catch (err: any) {
          results.push({ type: 'technical', success: false, message: `Teknik analiz hatası: ${err.message}` });
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return NextResponse.json({
          status: 'ok', locale: 'tr',
          message: `Türk raporları oluşturuldu: ${successCount} başarılı, ${failCount} başarısız`,
          results,
          summary: { successCount, failCount, total: results.length, assetClassesCount: assetClasses.length },
          timestamp: new Date().toISOString(),
        });
      }

      case 'quarterly': {
        console.log('[TrReportsCron] Türk üç aylık değerlendirme oluşturuluyor...');
        const { generateDailyBriefTr } = await import('@/lib/pipeline/agents/tr-report-generator');
        const report = await generateDailyBriefTr('quarterly');

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'tr',
            message: 'Türk üç aylık değerlendirme oluşturulmadı — yetersiz Türk verisi',
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'tr',
          message: 'Türk üç aylık değerlendirme başarıyla oluşturuldu',
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
            message: 'Özel rapor için olay türü gerekli. ?event=fomc|opec|nfp|cpi|gdp|ecb|boj|fed-chairs|geopolitical|oil-shock kullanın',
          }, { status: 400 });
        }
        console.log(`[TrReportsCron] Olay için Türk özel rapor oluşturuluyor: ${event}`);
        const { generateDailyBriefTr } = await import('@/lib/pipeline/agents/tr-report-generator');
        const report = await generateDailyBriefTr('special', { event });

        if (!report) {
          return NextResponse.json({
            status: 'ok', locale: 'tr',
            message: `Olay için Türk özel rapor oluşturulmadı: ${event} — yetersiz veri`,
            generated: false, timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          status: 'ok', locale: 'tr',
          message: `Olay için Türk özel rapor oluşturuldu: ${event}`,
          generated: true,
          report: { title: report.title, slug: report.slug, type: report.reportType, confidenceScore: report.confidenceScore, published: report.isPublished },
          timestamp: new Date().toISOString(),
        });
      }

      case 'generate-analyses': {
        console.log('[TrReportsCron] Türk piyasa analizleri oluşturuluyor...');
        const { generateMarketAnalysisTr } = await import('@/lib/pipeline/agents/tr-report-generator');
        const assetClasses = TR_PIPELINE_CONFIG.TR_REPORT_ASSET_CLASSES;
        const results: Array<{ assetClass: string; title?: string; success: boolean; message: string }> = [];

        for (const ac of assetClasses) {
          try {
            const analysis = await generateMarketAnalysisTr(ac as any);
            results.push({
              assetClass: ac,
              title: analysis?.title,
              success: !!analysis,
              message: analysis
                ? `${ac} piyasa analizi: "${analysis.title}" (${analysis.confidenceScore}%)`
                : `${ac} piyasa analizi oluşturulmadı — yetersiz veri`,
            });
          } catch (err: any) {
            results.push({ assetClass: ac, success: false, message: `${ac} hatası: ${err.message}` });
          }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return NextResponse.json({
          status: 'ok', locale: 'tr',
          message: `Türk piyasa analizleri oluşturuldu: ${successCount} başarılı, ${failCount} başarısız`,
          results,
          summary: { successCount, failCount, total: results.length },
          timestamp: new Date().toISOString(),
        });
      }

      // DISABLED: Auto-infographic generation is MANUAL ONLY.
      // Infographics should only be generated via manual API triggers, never automatically.
      case 'generate-infographics': {
        return NextResponse.json({
          status: 'disabled', locale: 'tr',
          message: 'Auto-infographic generation is DISABLED. Infographics are manual only. Use the manual generate API endpoints instead.',
          timestamp: new Date().toISOString(),
        });
      }

      case 'test': {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [trNews24h, trNews7d, trReportsToday, trAnalyses7d, trInfographics7d] = await Promise.all([
          db.newsItem.count({ where: { locale: 'tr', isReady: true, fetchedAt: { gte: since24h } } }),
          db.newsItem.count({ where: { locale: 'tr', isReady: true, fetchedAt: { gte: since7d } } }),
          db.economicReport.count({ where: { locale: 'tr', createdAt: { gte: since24h } } }),
          db.marketAnalysis.count({ where: { locale: 'tr', createdAt: { gte: since7d } } }),
          db.infographic.count({ where: { locale: 'tr', createdAt: { gte: since7d } } }),
        ]);

        return NextResponse.json({
          status: 'ok', locale: 'tr',
          readiness: {
            canGenerateDaily: trNews24h >= 3,
            canGenerateWeekly: trNews7d >= 5,
            trNews24h, trNews7d,
            minDailyNews: 3, minWeeklyNews: 5,
          },
          existing: {
            reportsToday: trReportsToday,
            analysesThisWeek: trAnalyses7d,
            infographicsThisWeek: trInfographics7d,
          },
          enabledAssetClasses: TR_PIPELINE_CONFIG.TR_REPORT_ASSET_CLASSES,
          timestamp: new Date().toISOString(),
        });
      }

      default: {
        return NextResponse.json({
          status: 'error',
          message: `Bilinmeyen eylem: ${action}. Geçerli eylemler: status, daily, generate-daily, weekly, monthly, quarterly, technical, market-analysis, generate-analyses, generate-infographics, special, all, test`,
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
// This was THE reason Turkish reports were never triggered by Railway cron.
export async function POST(request: NextRequest) {
  return GET(request);
}
