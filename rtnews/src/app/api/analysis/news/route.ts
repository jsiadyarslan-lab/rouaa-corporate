// ─── Analysis News API Route ────────────────────────────────
// Returns published news items that have AI analysis attached.
// Used by the /analysis page to display "Latest AI News Analysis".
// V-LOCALE: Supports locale filtering to prevent Arabic/English mixing.
// V322: Auto-recovery on database connection errors.

import { NextResponse } from 'next/server';
import { db, safeDBQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get('limit') || '6')));
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));
  const locale = url.searchParams.get('locale') || 'ar';

  try {
    // Build where clause based on locale
    const where: any = {
      isReady: true,
      isPublished: true,
      aiAnalysis: { not: null },
    };

    if (locale === 'en') {
      // English page: fetch English-locale news (originalLanguage=en)
      where.originalLanguage = 'en';
      where.title = { not: '' };
    } else {
      // Arabic page: fetch Arabic-locale news
      where.locale = 'ar';
      where.titleAr = { not: '' };
    }

    const selectFields: any = {
      id: true,
      slug: true,
      category: true,
      sentiment: true,
      impactLevel: true,
      publishedAt: true,
      aiAnalysis: true,
      locale: true,
    };

    // Add the appropriate title field based on locale
    if (locale === 'en') {
      selectFields.title = true;
    } else {
      selectFields.titleAr = true;
      selectFields.title = true; // fallback
    }

    // V322: Use safeDBQuery to auto-recover on connection errors
    const items = await safeDBQuery(
      () => db.newsItem.findMany({
        where,
        select: selectFields,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      'analysis-news-findMany'
    );

    const total = await safeDBQuery(
      () => db.newsItem.count({ where }),
      'analysis-news-count'
    );

    // Normalize the response: always return a `title` field + `titleAr` field
    const normalizedItems = (items || []).map((item: any) => ({
      ...item,
      title: locale === 'en' ? (item.title || '') : (item.titleAr || item.title || ''),
      titleAr: item.titleAr || '',
    }));

    return NextResponse.json({
      items: normalizedItems,
      total: total || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('[AnalysisNewsAPI] Error:', error.message);
    return NextResponse.json({
      items: [],
      total: 0,
      limit,
      offset,
      error: error.message,
    });
  }
}
