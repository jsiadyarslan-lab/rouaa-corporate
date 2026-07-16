// ─── Archive API V38 ────────────────────────────────────────
// Returns ALL archived news items with pagination and filtering.
// V38: Only returns FULLY COMPLETE articles (isReady=true).
// ARCHIVE-FIRST: No age filter — every complete article is included.
// Supports: ?page=1&limit=20&category=...&sentiment=...&impact=...

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const category = url.searchParams.get('category');
    const sentiment = url.searchParams.get('sentiment');
    const impact = url.searchParams.get('impact');
    const search = url.searchParams.get('q');

    const skip = (page - 1) * limit;

    // V260 FIX: Removed generatedImage, contentAr, aiAnalysis from WHERE — matching
    // getNewsFromDB V73 fix. These extra filters caused valid published articles to be
    // hidden from the archive. The Publisher agent (V42 principle) is the gatekeeper:
    // if isReady=true + isPublished=true, the article IS complete and MUST be visible.
    // FIX: Also filter locale='ar' — prevent English articles from appearing in Arabic archive
    const where: any = {
      isReady: true,
      isPublished: true,
      slug: { not: '' },
      titleAr: { not: '' },
      locale: 'ar',
    };

    if (category) {
      where.category = category;
    }

    if (sentiment) {
      where.sentiment = sentiment;
    }

    if (impact) {
      where.impactLevel = impact;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { titleAr: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { summaryAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch items with pagination
    const items = await db.newsItem.findMany({
      where,
      select: {
        id: true,
        title: true,
        titleAr: true,
        summary: true,
        summaryAr: true,
        category: true,
        source: true,
        url: true,
        imageUrl: true,
        sentiment: true,
        sentimentScore: true,
        impactLevel: true,
        fetchedAt: true,
        slug: true,
        newsType: true,
      },
      orderBy: { fetchedAt: 'desc' },
      skip,
      take: limit,
    });

    // Count total items
    const total = await db.newsItem.count({ where });

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error('[Archive API] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch archive', details: error.message },
      { status: 500 }
    );
  }
}
