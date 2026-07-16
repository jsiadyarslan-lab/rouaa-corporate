import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/economic-reports — List published economic reports
// Query params: reportType (weekly|monthly|quarterly|special), scope (arabic|global|regional), page, limit, sort (latest|popular)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('reportType');
    const scope = searchParams.get('scope');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const sort = searchParams.get('sort') || 'latest';

    const where: any = { isPublished: true, locale: 'ar' };  // V-LOCALE: Only Arabic reports
    if (reportType) where.reportType = reportType;
    if (scope) where.scope = scope;

    const orderBy = sort === 'popular' 
      ? { confidenceScore: 'desc' as const }
      : { publishedAt: 'desc' as const };

    const [reports, total] = await Promise.all([
      db.economicReport.findMany({
        where,
        select: {
          id: true, title: true, slug: true, summary: true,
          reportType: true, scope: true, marketImpact: true,
          confidenceScore: true, imageUrl: true,
          sectors: true, countries: true,
          publishedAt: true, createdAt: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.economicReport.count({ where }),
    ]);

    return NextResponse.json({
      reports: reports.map(r => ({
        ...r,
        sectors: JSON.parse(r.sectors),
        countries: JSON.parse(r.countries),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('[EconomicReports API]', error);
    return NextResponse.json({ error: 'فشل في تحميل التقارير' }, { status: 500 });
  }
}
