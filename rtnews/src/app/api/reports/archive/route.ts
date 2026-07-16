// ─── Reports Archive & Stats API V62 ────────────────────────
// GET /api/reports/archive — Get archive statistics
// Returns: total reports, by type, by month, most viewed, top categories

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

// GET /api/reports/archive — Get archive statistics
export async function GET(request: Request) {
  try {
    // Total counts
    const [totalReports, totalAnalyses, publishedReports, publishedAnalyses] = await Promise.all([
      db.economicReport.count(),
      db.marketAnalysis.count(),
      db.economicReport.count({ where: { isPublished: true } }),
      db.marketAnalysis.count({ where: { isPublished: true } }),
    ]);

    // Reports by type
    const reportsByTypeRaw = await db.economicReport.groupBy({
      by: ['reportType'],
      where: { isPublished: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Reports by scope
    const reportsByScopeRaw = await db.economicReport.groupBy({
      by: ['scope'],
      where: { isPublished: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Analyses by asset class
    const analysesByClassRaw = await db.marketAnalysis.groupBy({
      by: ['assetClass'],
      where: { isPublished: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Analyses by sentiment
    const analysesBySentimentRaw = await db.marketAnalysis.groupBy({
      by: ['sentiment'],
      where: { isPublished: true },
      _count: { id: true },
    });

    // Most viewed reports (using ReportView data)
    const mostViewedReports = await db.reportView.groupBy({
      by: ['reportId', 'reportType'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Get details for most viewed items
    const mostViewedDetails = await Promise.all(
      mostViewedReports.map(async (mv) => {
        try {
          if (mv.reportType === 'economic_report') {
            const report = await db.economicReport.findUnique({
              where: { id: mv.reportId },
              select: { id: true, title: true, slug: true, reportType: true, publishedAt: true },
            });
            return report ? { ...report, type: 'economic_report', views: mv._count.id } : null;
          } else {
            const analysis = await db.marketAnalysis.findUnique({
              where: { id: mv.reportId },
              select: { id: true, title: true, slug: true, assetClass: true, publishedAt: true },
            });
            return analysis ? { ...analysis, type: 'market_analysis', views: mv._count.id } : null;
          }
        } catch {
          return null;
        }
      })
    );

    // Reports by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const reportsByMonthRaw = await db.economicReport.findMany({
      where: {
        isPublished: true,
        publishedAt: { gte: twelveMonthsAgo },
      },
      select: { publishedAt: true, reportType: true },
      orderBy: { publishedAt: 'asc' },
    });

    // Group by month
    const reportsByMonth: Record<string, { reports: number; analyses: number }> = {};
    for (const r of reportsByMonthRaw) {
      if (!r.publishedAt) continue;
      const monthKey = r.publishedAt.toISOString().slice(0, 7); // YYYY-MM
      if (!reportsByMonth[monthKey]) reportsByMonth[monthKey] = { reports: 0, analyses: 0 };
      reportsByMonth[monthKey].reports++;
    }

    const analysesByMonthRaw = await db.marketAnalysis.findMany({
      where: {
        isPublished: true,
        publishedAt: { gte: twelveMonthsAgo },
      },
      select: { publishedAt: true },
      orderBy: { publishedAt: 'asc' },
    });

    for (const a of analysesByMonthRaw) {
      if (!a.publishedAt) continue;
      const monthKey = a.publishedAt.toISOString().slice(0, 7);
      if (!reportsByMonth[monthKey]) reportsByMonth[monthKey] = { reports: 0, analyses: 0 };
      reportsByMonth[monthKey].analyses++;
    }

    // Top categories (from sectors field)
    const allSectorsRaw = await db.economicReport.findMany({
      where: { isPublished: true },
      select: { sectors: true },
    });

    const sectorCounts: Record<string, number> = {};
    for (const r of allSectorsRaw) {
      try {
        const sectors = JSON.parse(r.sectors) as string[];
        for (const s of sectors) {
          sectorCounts[s] = (sectorCounts[s] || 0) + 1;
        }
      } catch { /* skip invalid JSON */ }
    }

    const topCategories = Object.entries(sectorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Total views
    const [totalReportViews, totalAnalysisViews] = await Promise.all([
      db.reportView.count({ where: { reportType: 'economic_report' } }),
      db.reportView.count({ where: { reportType: 'market_analysis' } }),
    ]);

    return NextResponse.json({
      overview: {
        totalReports,
        totalAnalyses,
        publishedReports,
        publishedAnalyses,
        totalViews: totalReportViews + totalAnalysisViews,
      },
      reportsByType: reportsByTypeRaw.map(r => ({ type: r.reportType, count: r._count.id })),
      reportsByScope: reportsByScopeRaw.map(r => ({ scope: r.scope, count: r._count.id })),
      analysesByClass: analysesByClassRaw.map(r => ({ assetClass: r.assetClass, count: r._count.id })),
      analysesBySentiment: analysesBySentimentRaw.map(r => ({ sentiment: r.sentiment, count: r._count.id })),
      reportsByMonth,
      mostViewed: mostViewedDetails.filter(Boolean),
      topCategories,
    });
  } catch (error) {
    return apiError(error, 'أرشيف التقارير');
  }
}
