// ─── Market Analyses CRUD API V62 ────────────────────────────
// Admin endpoints for managing market analyses
// Protected with x-internal header or CRON_SECRET

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-utils';
import { verifyInternalOrCronAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';



// GET /api/analyses/manage — List all analyses (admin view, includes unpublished)
// Query params: page, limit, assetClass, analysisType, isPublished
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const assetClass = searchParams.get('assetClass');
    const analysisType = searchParams.get('analysisType');
    const isPublishedParam = searchParams.get('isPublished');

    const where: any = {};
    if (assetClass) where.assetClass = assetClass;
    if (analysisType) where.analysisType = analysisType;
    if (isPublishedParam !== null && isPublishedParam !== undefined && isPublishedParam !== '') {
      where.isPublished = isPublishedParam === 'true';
    }

    const [analyses, total] = await Promise.all([
      db.marketAnalysis.findMany({
        where,
        select: {
          id: true, title: true, slug: true, assetClass: true,
          analysisType: true, timeFrame: true, riskLevel: true,
          sentiment: true, confidenceScore: true, isPublished: true,
          publishedAt: true, validUntil: true, createdAt: true, updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.marketAnalysis.count({ where }),
    ]);

    return NextResponse.json({
      analyses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError(error, 'تحليلات السوق');
  }
}

// POST /api/analyses/manage — Create a new analysis manually
export async function POST(request: Request) {
  try {
    if (!verifyInternalOrCronAuth(request)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title, content, assetClass, analysisType, timeFrame,
      indicators, priceTarget, riskLevel, sentiment,
      confidenceScore, isPublished, slug: customSlug,
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

    const analysis = await db.marketAnalysis.create({
      data: {
        title,
        slug,
        content: content || '',
        assetClass: assetClass || 'stocks',
        analysisType: analysisType || 'fundamental',
        timeFrame: timeFrame || 'daily',
        indicators: JSON.stringify(indicators || {}),
        priceTarget: JSON.stringify(priceTarget || {}),
        riskLevel: riskLevel || 'medium',
        sentiment: sentiment || 'neutral',
        confidenceScore: confidenceScore ?? 50,
        isPublished: isPublished ?? false,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        title: analysis.title,
        slug: analysis.slug,
        isPublished: analysis.isPublished,
      },
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      return NextResponse.json({ error: 'الرابط موجود بالفعل، جرب عنواناً مختلفاً' }, { status: 409 });
    }
    return apiError(error, 'إنشاء تحليل');
  }
}

// PUT /api/analyses/manage — Update an analysis
export async function PUT(request: Request) {
  try {
    if (!verifyInternalOrCronAuth(request)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف التحليل مطلوب' }, { status: 400 });
    }

    const existing = await db.marketAnalysis.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'التحليل غير موجود' }, { status: 404 });
    }

    const data: any = {};
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.content !== undefined) data.content = updates.content;
    if (updates.assetClass !== undefined) data.assetClass = updates.assetClass;
    if (updates.analysisType !== undefined) data.analysisType = updates.analysisType;
    if (updates.timeFrame !== undefined) data.timeFrame = updates.timeFrame;
    if (updates.indicators !== undefined) data.indicators = JSON.stringify(updates.indicators);
    if (updates.priceTarget !== undefined) data.priceTarget = JSON.stringify(updates.priceTarget);
    if (updates.riskLevel !== undefined) data.riskLevel = updates.riskLevel;
    if (updates.sentiment !== undefined) data.sentiment = updates.sentiment;
    if (updates.confidenceScore !== undefined) data.confidenceScore = updates.confidenceScore;
    if (updates.isPublished !== undefined) {
      data.isPublished = updates.isPublished;
      if (updates.isPublished && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const analysis = await db.marketAnalysis.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        title: analysis.title,
        isPublished: analysis.isPublished,
      },
    });
  } catch (error) {
    return apiError(error, 'تحديث تحليل');
  }
}

// DELETE /api/analyses/manage — Delete an analysis
export async function DELETE(request: Request) {
  try {
    if (!verifyInternalOrCronAuth(request)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    let id: string | undefined;
    try {
      const body = await request.json();
      id = body.id;
    } catch {
      const { searchParams } = new URL(request.url);
      id = searchParams.get('id') || undefined;
    }

    if (!id) {
      return NextResponse.json({ error: 'معرف التحليل مطلوب' }, { status: 400 });
    }

    const existing = await db.marketAnalysis.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'التحليل غير موجود' }, { status: 404 });
    }

    // Delete associated views first
    await db.reportView.deleteMany({ where: { reportId: id, reportType: 'market_analysis' } });
    await db.marketAnalysis.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'تم حذف التحليل بنجاح' });
  } catch (error) {
    return apiError(error, 'حذف تحليل');
  }
}
