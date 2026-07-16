// ─── Quality Stats API Route V379 ────────────────────────
// Provides quality gate statistics for the admin monitoring dashboard.
// Returns publishing counts, rejection rates, and system health data.
// All text responses are in Arabic.
//
// V379: Added visibility filter (newsType: 'live', slug/title not empty)
// to published counts — same as V376 fix for overview tab. Without this,
// stats showed inflated numbers that don't match visible site content.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyInternalOrCronAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify admin auth — returns boolean directly
  const isAuthenticated = verifyInternalOrCronAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // V379: Visibility filter — only count live news with slug+title
    // (matches frontend display filter, same as V376 fix for overview tab)
    const visFilter = {
      isReady: true,
      isPublished: true,
      newsType: 'live' as const,
      slug: { not: '' },
      title: { not: '' },
    };

    // Published articles stats — V379: Use visibility filter
    const [publishedToday, publishedThisHour, totalPublished, pendingArticles] = await Promise.all([
      db.newsItem.count({ where: { ...visFilter, publishedAt: { gte: dayAgo } } }),
      db.newsItem.count({ where: { ...visFilter, publishedAt: { gte: hourAgo } } }),
      db.newsItem.count({ where: visFilter }),
      db.newsItem.count({ where: { isReady: false, processingStage: { notIn: ['skipped', 'archived'] } } }),
    ]);

    // Rejection stats
    const skippedArticles = await db.newsItem.count({
      where: { processingStage: 'skipped' },
    });

    return NextResponse.json({
      timestamp: now.toISOString(),
      publishing: {
        publishedToday,
        publishedThisHour,
        totalPublished,
        pending: pendingArticles,
        skipped: skippedArticles,
      },
      quality: {
        publishRate: publishedToday > 0
          ? `${((publishedThisHour / Math.max(publishedToday, 1)) * 100).toFixed(1)}% hourly`
          : '0%',
        skipRate: skippedArticles > 0
          ? `${((skippedArticles / (totalPublished + skippedArticles)) * 100).toFixed(1)}%`
          : '0%',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    console.error('[QualityStats V156] Error:', message);
    return NextResponse.json({ error: 'فشل في جلب الإحصائيات' }, { status: 500 });
  }
}
