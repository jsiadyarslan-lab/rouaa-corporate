// ─── Spanish Reports API Route V316 ───────────────────────────
// GET /api/es/reports — List Spanish reports AND market analyses
// V316: Added isPublished filter support, type param, MarketAnalysis entries
// Query params: page, limit, type, assetClass, includeAnalyses, isPublished

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || undefined;
    const assetClass = searchParams.get('assetClass') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    const includeAnalyses = searchParams.get('includeAnalyses') !== 'false'; // default true

    // V316: Support isPublished filter — default depends on context:
    // - Public frontend: isPublished not specified → defaults to true (only show published)
    // - Dashboard/admin: isPublished param sent explicitly → can be 'all', 'true', 'false'
    const isPublishedParam = searchParams.get('isPublished');
    const isPublishedFilter = isPublishedParam === 'all' ? undefined
      : isPublishedParam === 'false' ? false
      : isPublishedParam === 'true' ? true
      : true; // Default: only published for public API

    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      return NextResponse.json({ reports: [], total: 0, page, limit, totalPages: 0, hasMore: false });
    }

    // Build EconomicReport query
    const reportWhere: any = {
      locale: 'es',
    };
    if (isPublishedFilter !== undefined) reportWhere.isPublished = isPublishedFilter;
    if (reportType) reportWhere.reportType = reportType;

    // Build MarketAnalysis query
    const analysisWhere: any = {
      locale: 'es',
    };
    if (isPublishedFilter !== undefined) analysisWhere.isPublished = isPublishedFilter;
    if (assetClass) analysisWhere.assetClass = assetClass;

    // BUG FIX: When a specific reportType (e.g., 'strategic') is requested,
    // only fetch from EconomicReport — MarketAnalysis has no reportType field,
    // so including it causes non-strategic analyses to leak into strategic results.
    const skipAnalyses = !!reportType;
    const shouldFetchAnalyses = includeAnalyses && !skipAnalyses;

    // Fetch from both tables (or just EconomicReport when type filter is active)
    const [reports, reportTotal, analyses, analysisTotal] = await Promise.all([
      db.economicReport.findMany({
        where: reportWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          slug: true,
          reportType: true,
          summary: true,
          scope: true,
          marketImpact: true,
          confidenceScore: true,
          isPublished: true,
          imageUrl: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      db.economicReport.count({ where: reportWhere }),
      shouldFetchAnalyses ? db.marketAnalysis.findMany({
        where: analysisWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          slug: true,
          assetClass: true,
          analysisType: true,
          timeFrame: true,
          riskLevel: true,
          sentiment: true,
          confidenceScore: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
        },
      }) : Promise.resolve([]),
      shouldFetchAnalyses ? db.marketAnalysis.count({ where: analysisWhere }) : Promise.resolve(0),
    ]);

    // Format EconomicReport entries
    const formattedReports = reports.map(r => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      reportType: r.reportType,
      summary: r.summary,
      scope: r.scope,
      marketImpact: r.marketImpact,
      confidenceScore: r.confidenceScore,
      isPublished: r.isPublished,
      imageUrl: r.imageUrl,
      publishedAt: r.publishedAt?.toISOString() || null,
      createdAt: r.createdAt?.toISOString(),
      isAnalysis: false,
    }));

    // V315: Format MarketAnalysis entries
    const formattedAnalyses = (analyses as any[]).map(a => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      reportType: 'analysis',
      summary: '',
      scope: a.assetClass,
      marketImpact: a.sentiment,
      confidenceScore: a.confidenceScore,
      isPublished: a.isPublished,
      assetClass: a.assetClass,
      analysisType: a.analysisType,
      timeFrame: a.timeFrame,
      riskLevel: a.riskLevel,
      publishedAt: a.publishedAt?.toISOString() || null,
      createdAt: a.createdAt?.toISOString(),
      isAnalysis: true,
    }));

    // Combine and sort by createdAt (when type filter is active, formattedAnalyses is empty)
    const combined = [...formattedReports, ...formattedAnalyses]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, limit);

    const total = reportTotal + analysisTotal;

    return NextResponse.json({
      reports: combined,
      total,
      reportTotal,
      analysisTotal,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + limit < total,
    });
  } catch (error: any) {
    console.error('[ES Reports API V316] Error:', error.message);
    return NextResponse.json(
      { error: 'Error al cargar informes en español', detail: error.message },
      { status: 500 }
    );
  }
}
