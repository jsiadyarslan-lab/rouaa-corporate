// ─── Report Views Tracking API V62 ───────────────────────────
// Track views for economic reports and market analyses
// POST /api/reports/[id]/views — Increment view count

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reportType = body.reportType || 'economic_report';

    if (!id) {
      return NextResponse.json({ error: 'معرف التقرير مطلوب' }, { status: 400 });
    }

    // Verify the report/analysis exists
    if (reportType === 'economic_report') {
      const report = await db.economicReport.findFirst({
        where: { OR: [{ id }, { slug: id }], isPublished: true },
        select: { id: true },
      });
      if (!report) {
        return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });
      }
    } else if (reportType === 'market_analysis') {
      const analysis = await db.marketAnalysis.findFirst({
        where: { OR: [{ id }, { slug: id }], isPublished: true },
        select: { id: true },
      });
      if (!analysis) {
        return NextResponse.json({ error: 'التحليل غير موجود' }, { status: 404 });
      }
    }

    // Create view record
    const headers = request.headers;
    await db.reportView.create({
      data: {
        reportId: id,
        reportType,
        userId: body.userId || null,
        ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || null,
        userAgent: headers.get('user-agent') || null,
        referrer: headers.get('referer') || null,
      },
    });

    // Get total views
    const viewCount = await db.reportView.count({
      where: { reportId: id, reportType },
    });

    return NextResponse.json({ success: true, views: viewCount });
  } catch (error: any) {
    console.error('[ReportViews] POST error:', error.message);
    return NextResponse.json({ error: 'فشل في تسجيل المشاهدة' }, { status: 500 });
  }
}

// GET /api/reports/[id]/views — Get view count for a report
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('reportType') || 'economic_report';

    const [viewCount, recentViews] = await Promise.all([
      db.reportView.count({
        where: { reportId: id, reportType },
      }),
      db.reportView.findMany({
        where: { reportId: id, reportType },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      reportId: id,
      reportType,
      totalViews: viewCount,
      recentViews,
    });
  } catch (error: any) {
    console.error('[ReportViews] GET error:', error.message);
    return NextResponse.json({ error: 'فشل في تحميل المشاهدات' }, { status: 500 });
  }
}
