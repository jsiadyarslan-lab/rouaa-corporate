// ─── TG Reports API ──────────────────────────────────────────
// GET /api/tg/reports?type=strategic&page=1&limit=10
// Returns paginated reports for the Telegram Mini App

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stripSummaryMarkdown } from '@/lib/clean-markdown';

export const dynamic = 'force-dynamic';

const REPORT_TYPE_MAP: Record<string, string[]> = {
  strategic: ['strategic'],  // FIX: was ['weekly', 'monthly', 'quarterly', 'special'] — that returned NON-strategic reports!
  daily: ['daily'],
  weekly: ['weekly', 'monthly', 'quarterly', 'special'],  // Regular reports (was mislabeled as 'strategic')
  stocks: ['stocks'],
  forex: ['forex'],
  commodities: ['commodities'],
  energy: ['energy'],
};

const SCOPE_TYPE_MAP: Record<string, string[]> = {
  strategic: ['strategic', 'global'],
  daily: ['daily'],
  stocks: ['stocks'],
  forex: ['forex'],
  commodities: ['commodities'],
  energy: ['energy'],
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    const skip = (page - 1) * limit;

    // Build where clause for EconomicReport
    const reportWhere: any = { isPublished: true };

    if (type && type !== 'الكل') {
      if (REPORT_TYPE_MAP[type]) {
        reportWhere.reportType = { in: REPORT_TYPE_MAP[type] };
      } else if (SCOPE_TYPE_MAP[type]) {
        reportWhere.scope = { in: SCOPE_TYPE_MAP[type] };
      } else {
        // Try matching reportType or scope directly
        reportWhere.OR = [
          { reportType: type },
          { scope: type },
        ];
        delete reportWhere.reportType;
      }
    }

    // Build where clause for MarketAnalysis
    const analysisWhere: any = { isPublished: true };

    if (type && type !== 'الكل') {
      const assetClassMap: Record<string, string> = {
        stocks: 'stocks',
        forex: 'forex',
        commodities: 'commodities',
        energy: 'energy',
        crypto: 'crypto',
      };
      if (assetClassMap[type]) {
        analysisWhere.assetClass = assetClassMap[type];
      }
    }

    // Fetch EconomicReports
    const [reports, reportTotal] = await Promise.all([
      db.economicReport.findMany({
        where: reportWhere,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          reportType: true,
          scope: true,
          marketImpact: true,
          confidenceScore: true,
          publishedAt: true,
        },
      }),
      db.economicReport.count({ where: reportWhere }),
    ]);

    // If we need more to fill the page, fetch MarketAnalyses
    let analysisItems: any[] = [];
    let analysisTotal = 0;

    if (reports.length < limit) {
      const remaining = limit - reports.length;
      const analysisSkip = Math.max(0, skip - reportTotal);

      [analysisItems, analysisTotal] = await Promise.all([
        db.marketAnalysis.findMany({
          where: analysisWhere,
          orderBy: { publishedAt: 'desc' },
          skip: analysisSkip,
          take: remaining,
          select: {
            id: true,
            title: true,
            slug: true,
            content: true,
            assetClass: true,
            sentiment: true,
            confidenceScore: true,
            publishedAt: true,
          },
        }),
        db.marketAnalysis.count({ where: analysisWhere }),
      ]);
    }

    // Transform EconomicReports
    const reportItems = reports.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      summary: stripSummaryMarkdown(r.summary || ''),
      reportType: r.reportType,
      scope: r.scope,
      marketImpact: r.marketImpact || 'neutral',
      confidenceScore: r.confidenceScore || 50,
      publishedAt: r.publishedAt,
      source: 'report' as const,
    }));

    // Transform MarketAnalyses
    const analysisResults = analysisItems.map((a) => {
      let summary = '';
      try {
        const parsed = JSON.parse(a.content || '{}');
        const sections = parsed.sections || {};
        summary = sections.introduction || sections.overview || sections.executiveSummary || '';
      } catch {}

      return {
        id: a.id,
        title: a.title,
        slug: a.slug,
        summary: stripSummaryMarkdown(summary),
        reportType: 'analysis',
        scope: a.assetClass || 'economy',
        marketImpact: a.sentiment || 'neutral',
        confidenceScore: a.confidenceScore || 50,
        publishedAt: a.publishedAt,
        source: 'analysis' as const,
      };
    });

    // Merge and sort by publishedAt
    const allReports = [...reportItems, ...analysisResults]
      .sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);

    const total = reportTotal + analysisTotal;
    const hasMore = skip + limit < total;

    return NextResponse.json({
      reports: allReports,
      total,
      page,
      hasMore,
    });
  } catch (error: any) {
    console.error('[TG Reports API] Error:', error.message);
    return NextResponse.json(
      { reports: [], total: 0, page: 1, hasMore: false, error: 'حدث خطأ أثناء جلب التقارير' },
      { status: 500 }
    );
  }
}
