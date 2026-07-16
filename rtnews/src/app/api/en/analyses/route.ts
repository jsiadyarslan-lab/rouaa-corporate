// ─── English Market Analyses API Route ──────────────────────────
// GET /api/en/analyses — List English market analyses
// Filters by locale='en', isPublished=true

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;
    const published = searchParams.get('published');

    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      return NextResponse.json({ items: [], total: 0, page, limit, totalPages: 0, hasMore: false });
    }

    const where: any = {
      locale: 'en',
    };
    if (published === 'true') where.isPublished = true;
    if (published === 'false') where.isPublished = false;

    const [items, total] = await Promise.all([
      db.marketAnalysis.findMany({
        where,
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
      }),
      db.marketAnalysis.count({ where }),
    ]);

    const formattedItems = items.map((a: any) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      summary: a.summary || '',
      category: a.assetClass,
      reportType: 'analysis',
      assetClass: a.assetClass,
      analysisType: a.analysisType,
      timeFrame: a.timeFrame,
      riskLevel: a.riskLevel,
      sentiment: a.sentiment,
      confidenceScore: a.confidenceScore,
      isPublished: a.isPublished,
      publishedAt: a.publishedAt?.toISOString() || null,
      createdAt: a.createdAt?.toISOString(),
    }));

    return NextResponse.json({
      items: formattedItems,
      reports: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + limit < total,
    });
  } catch (error: any) {
    console.error('[EN Analyses API] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to load English analyses', detail: error.message },
      { status: 500 }
    );
  }
}
