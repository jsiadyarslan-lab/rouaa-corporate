// ─── Reports Search API V63 ──────────────────────────────────
// Advanced full-text search across economic reports and market analyses
// GET /api/reports/search?q=keyword&reportType=weekly&scope=arabic&category=stocks&dateFrom=xxx&dateTo=xxx&sort=date|confidence|views&page=1&limit=12

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

// GET /api/reports/search — Advanced search across reports and analyses
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const reportType = searchParams.get('reportType');
    const scope = searchParams.get('scope');
    const category = searchParams.get('category'); // assetClass for analyses, sector for reports
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sort = searchParams.get('sort') || 'date';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    // V-LOCALE: Filter by locale to prevent Arabic/English mixing
    const locale = searchParams.get('locale') || 'ar';  // Default to Arabic for backward compat

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    // Search economic reports
    const reportWhere: any = { isPublished: true, locale };
    if (q) {
      reportWhere.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (reportType) reportWhere.reportType = reportType;
    if (scope) reportWhere.scope = scope;
    if (category) reportWhere.sectors = { has: category }; // Also search sectors for reports
    if (Object.keys(dateFilter).length > 0) {
      reportWhere.publishedAt = dateFilter;
    }

    // Search market analyses
    const analysisWhere: any = { isPublished: true, locale };
    if (q) {
      analysisWhere.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (category) analysisWhere.assetClass = category;
    if (Object.keys(dateFilter).length > 0) {
      analysisWhere.publishedAt = dateFilter;
    }

    // Fetch ALL matching results from both tables (no per-table pagination)
    // Then combine, sort, and paginate the combined set correctly
    const [reports, analyses] = await Promise.all([
      db.economicReport.findMany({
        where: reportWhere,
        select: {
          id: true, title: true, slug: true, summary: true,
          reportType: true, scope: true, marketImpact: true,
          confidenceScore: true, sectors: true, countries: true,
          publishedAt: true, createdAt: true,
        },
        orderBy: { publishedAt: 'desc' },
      }),
      db.marketAnalysis.findMany({
        where: analysisWhere,
        select: {
          id: true, title: true, slug: true, assetClass: true,
          analysisType: true, timeFrame: true, riskLevel: true,
          sentiment: true, confidenceScore: true,
          publishedAt: true, createdAt: true,
        },
        orderBy: { publishedAt: 'desc' },
      }),
    ]);

    // Get view counts
    const reportIds = reports.map(r => r.id);
    const analysisIds = analyses.map(a => a.id);

    const [reportViews, analysisViews] = await Promise.all([
      reportIds.length > 0 ? db.reportView.groupBy({
        by: ['reportId'],
        where: { reportId: { in: reportIds }, reportType: 'economic_report' },
        _count: { id: true },
      }) : [],
      analysisIds.length > 0 ? db.reportView.groupBy({
        by: ['reportId'],
        where: { reportId: { in: analysisIds }, reportType: 'market_analysis' },
        _count: { id: true },
      }) : [],
    ]);

    const viewMap = new Map<string, number>();
    for (const v of reportViews) viewMap.set(v.reportId, v._count.id);
    for (const v of analysisViews) viewMap.set(v.reportId, v._count.id);

    // Format results
    const formattedReports = reports.map(r => ({
      type: 'economic_report' as const,
      id: r.id,
      title: r.title,
      slug: r.slug,
      summary: r.summary,
      reportType: r.reportType,
      scope: r.scope,
      marketImpact: r.marketImpact,
      confidenceScore: r.confidenceScore,
      sectors: JSON.parse(r.sectors),
      countries: JSON.parse(r.countries),
      views: viewMap.get(r.id) || 0,
      publishedAt: r.publishedAt,
      createdAt: r.createdAt,
    }));

    const formattedAnalyses = analyses.map(a => ({
      type: 'market_analysis' as const,
      id: a.id,
      title: a.title,
      slug: a.slug,
      assetClass: a.assetClass,
      analysisType: a.analysisType,
      timeFrame: a.timeFrame,
      riskLevel: a.riskLevel,
      sentiment: a.sentiment,
      confidenceScore: a.confidenceScore,
      views: viewMap.get(a.id) || 0,
      publishedAt: a.publishedAt,
      createdAt: a.createdAt,
    }));

    // Combine and sort results
    let combinedResults: any[];
    if (sort === 'confidence') {
      combinedResults = [...formattedReports, ...formattedAnalyses]
        .sort((a, b) => b.confidenceScore - a.confidenceScore);
    } else if (sort === 'views') {
      combinedResults = [...formattedReports, ...formattedAnalyses]
        .sort((a, b) => b.views - a.views);
    } else {
      combinedResults = [...formattedReports, ...formattedAnalyses]
        .sort((a, b) => {
          const dateA = a.publishedAt || a.createdAt;
          const dateB = b.publishedAt || b.createdAt;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
    }

    // Paginate the COMBINED sorted results correctly
    const totalResults = combinedResults.length;
    const paginatedResults = combinedResults.slice((page - 1) * limit, page * limit);

    // Build facets for filters
    const [reportTypes, scopes, assetClasses] = await Promise.all([
      db.economicReport.findMany({
        where: { isPublished: true, locale },
        select: { reportType: true },
        distinct: ['reportType'],
      }),
      db.economicReport.findMany({
        where: { isPublished: true, locale },
        select: { scope: true },
        distinct: ['scope'],
      }),
      db.marketAnalysis.findMany({
        where: { isPublished: true, locale },
        select: { assetClass: true },
        distinct: ['assetClass'],
      }),
    ]);

    return NextResponse.json({
      results: paginatedResults,
      query: q,
      pagination: {
        page,
        limit,
        total: totalResults,
        pages: Math.ceil(totalResults / limit),
      },
      facets: {
        reportTypes: reportTypes.map(r => r.reportType),
        scopes: scopes.map(s => s.scope),
        assetClasses: assetClasses.map(a => a.assetClass),
      },
      breakdown: {
        reports: formattedReports.length,
        analyses: formattedAnalyses.length,
      },
    });
  } catch (error) {
    return apiError(error, 'بحث التقارير');
  }
}
