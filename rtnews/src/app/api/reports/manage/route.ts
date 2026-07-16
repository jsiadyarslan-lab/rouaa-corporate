// ─── Economic Reports CRUD API V63 ───────────────────────────
// Admin endpoints for managing economic reports
// Protected with x-internal header, CRON_SECRET, or admin JWT cookie

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-utils';
import { verifyAdminToken, verifyInternalOrCronAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';



// Verify admin dashboard session (JWT cookie)
async function verifyDashboardAuth(request: Request): Promise<boolean> {
  try {
    const token = (request as NextRequest).cookies?.get?.('admin_token')?.value;
    if (!token) return false;
    return await verifyAdminToken(token);
  } catch {
    return false;
  }
}

// Combined auth: internal OR dashboard session
async function isAuthorized(request: Request): Promise<boolean> {
  if (verifyInternalOrCronAuth(request)) return true;
  if (await verifyDashboardAuth(request)) return true;
  return false;
}

// GET /api/reports/manage — List all reports (admin view, includes unpublished)
// Query params: page, limit, reportType, scope, isPublished, locale
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const reportType = searchParams.get('reportType');
    const scope = searchParams.get('scope');
    const isPublishedParam = searchParams.get('isPublished');
    const locale = searchParams.get('locale');

    const where: any = {};
    if (reportType) where.reportType = reportType;
    if (scope) where.scope = scope;
    if (locale) where.locale = locale;
    if (isPublishedParam !== null && isPublishedParam !== undefined && isPublishedParam !== '') {
      where.isPublished = isPublishedParam === 'true';
    }

    const [reports, total] = await Promise.all([
      db.economicReport.findMany({
        where,
        select: {
          id: true, title: true, slug: true, summary: true,
          reportType: true, scope: true, sectors: true, countries: true,
          marketImpact: true, confidenceScore: true, isPublished: true,
          publishedAt: true, createdAt: true, updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
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
  } catch (error) {
    return apiError(error, 'تقارير اقتصادية');
  }
}

// POST /api/reports/manage — Create a new report manually
export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title, content, reportType, scope, sectors, countries,
      marketImpact, confidenceScore, isPublished, summary, slug: customSlug,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'العنوان مطلوب' }, { status: 400 });
    }

    // Generate slug from title
    const slug = customSlug || title
      .replace(/[^\u0600-\u06FF\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .slice(0, 80) + '-' + Date.now().toString(36);

    const report = await db.economicReport.create({
      data: {
        title,
        slug,
        summary: summary || '',
        content: content || '',
        reportType: reportType || 'special',
        scope: scope || 'global',
        sectors: JSON.stringify(sectors || []),
        countries: JSON.stringify(countries || []),
        marketImpact: marketImpact || 'neutral',
        confidenceScore: confidenceScore ?? 50,
        isPublished: isPublished ?? false,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        title: report.title,
        slug: report.slug,
        isPublished: report.isPublished,
      },
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      return NextResponse.json({ error: 'الرابط موجود بالفعل، جرب عنواناً مختلفاً' }, { status: 409 });
    }
    return apiError(error, 'إنشاء تقرير');
  }
}

// PUT /api/reports/manage — Update a report
export async function PUT(request: NextRequest) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف التقرير مطلوب' }, { status: 400 });
    }

    const existing = await db.economicReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });
    }

    const data: any = {};
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.content !== undefined) data.content = updates.content;
    if (updates.summary !== undefined) data.summary = updates.summary;
    if (updates.reportType !== undefined) data.reportType = updates.reportType;
    if (updates.scope !== undefined) data.scope = updates.scope;
    if (updates.sectors !== undefined) data.sectors = JSON.stringify(updates.sectors);
    if (updates.countries !== undefined) data.countries = JSON.stringify(updates.countries);
    if (updates.marketImpact !== undefined) data.marketImpact = updates.marketImpact;
    if (updates.confidenceScore !== undefined) data.confidenceScore = updates.confidenceScore;
    if (updates.isPublished !== undefined) {
      data.isPublished = updates.isPublished;
      if (updates.isPublished && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const report = await db.economicReport.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        title: report.title,
        isPublished: report.isPublished,
      },
    });
  } catch (error) {
    return apiError(error, 'تحديث تقرير');
  }
}

// DELETE /api/reports/manage — Delete a report
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    let id: string | undefined;
    try {
      const body = await request.json();
      id = body.id;
    } catch {
      // Body may be empty — check query params
      const { searchParams } = new URL(request.url);
      id = searchParams.get('id') || undefined;
    }

    if (!id) {
      return NextResponse.json({ error: 'معرف التقرير مطلوب' }, { status: 400 });
    }

    const existing = await db.economicReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });
    }

    // Delete associated views first
    await db.reportView.deleteMany({ where: { reportId: id, reportType: 'economic_report' } });
    await db.economicReport.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'تم حذف التقرير بنجاح' });
  } catch (error) {
    return apiError(error, 'حذف تقرير');
  }
}
