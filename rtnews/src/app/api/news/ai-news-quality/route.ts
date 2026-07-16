// AI News Quality Dashboard API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. مقالات بانتظار التحليل
    const pendingAnalysis = await db.newsItem.count({
      where: {
        OR: [{ source: 'رؤى' }, { source: 'Rouaa' }],
        NOT: { aiAnalysis: { contains: 'fullContent' } },
        NOT: { aiAnalysis: { contains: 'analysisFailed' } },
        createdAt: { gte: weekAgo },
      },
    });

    // 2. مقالات فشل تحليلها
    const failedAnalysis = await db.newsItem.count({
      where: {
        OR: [{ source: 'رؤى' }, { source: 'Rouaa' }],
        aiAnalysis: { contains: 'analysisFailed' },
        createdAt: { gte: weekAgo },
      },
    });

    // 3. مقالات منشورة بدون تحليل (انتهاكات)
    const violations = await db.newsItem.count({
      where: {
        OR: [{ source: 'رؤى' }, { source: 'Rouaa' }],
        isPublished: true,
        NOT: { aiAnalysis: { contains: 'fullContent' } },
      },
    });

    // 4. مقالات بدون صورة
    const noImage = await db.newsItem.count({
      where: {
        OR: [{ source: 'رؤى' }, { source: 'Rouaa' }],
        isPublished: true,
        OR: [
          { generatedImage: null },
          { generatedImage: '' },
        ],
      },
    });

    // 5. مصادر رسمية vs صحفية (آخر أسبوع)
    const officialCount = await db.newsItem.count({
      where: { isOfficialSource: true, createdAt: { gte: weekAgo } },
    });
    const mediaCount = await db.newsItem.count({
      where: { isOfficialSource: false, createdAt: { gte: weekAgo } },
    });

    // 6. إجمالي + منشور (آخر 7 أيام)
    const totalArticles = await db.newsItem.count({
      where: { OR: [{ source: 'رؤى' }, { source: 'Rouaa' }], createdAt: { gte: weekAgo } },
    });
    const publishedArticles = await db.newsItem.count({
      where: { OR: [{ source: 'رؤى' }, { source: 'Rouaa' }], isPublished: true, createdAt: { gte: weekAgo } },
    });
    const successRate = totalArticles > 0 ? ((publishedArticles / totalArticles) * 100).toFixed(1) : '0';

    // 7. توزيع حسب اللغة (آخر 24 ساعة)
    const localeStatsRaw = await db.newsItem.findMany({
      where: { OR: [{ source: 'رؤى' }, { source: 'Rouaa' }], createdAt: { gte: dayAgo } },
      select: { locale: true },
    });
    const localeMap: Record<string, number> = {};
    for (const item of localeStatsRaw) {
      localeMap[item.locale] = (localeMap[item.locale] || 0) + 1;
    }

    // 8. توزيع حسب sourceType
    const recentArticles = await db.newsItem.findMany({
      where: { OR: [{ source: 'رؤى' }, { source: 'Rouaa' }], createdAt: { gte: weekAgo } },
      select: { aiAnalysis: true },
      take: 500,
    });
    const sourceTypes: Record<string, number> = {};
    for (const a of recentArticles) {
      try {
        const parsed = JSON.parse(a.aiAnalysis || '{}');
        const st = parsed.sourceType || parsed.rawData?.source || 'unknown';
        sourceTypes[st] = (sourceTypes[st] || 0) + 1;
      } catch {}
    }

    return NextResponse.json({
      timestamp: now.toISOString(),
      summary: {
        totalArticlesLast7d: totalArticles,
        publishedLast7d: publishedArticles,
        successRate: `${successRate}%`,
        pendingAnalysis,
        failedAnalysis,
        violations,
        noImage,
      },
      localeStats: Object.entries(localeMap).map(([locale, count]) => ({ locale, count })),
      sourceSplit: {
        official: officialCount,
        media: mediaCount,
        officialPercent: officialCount + mediaCount > 0
          ? `${((officialCount / (officialCount + mediaCount)) * 100).toFixed(1)}%`
          : '0%',
      },
      sourceTypes: Object.entries(sourceTypes)
        .sort(([, a], [, b]) => b - a)
        .map(([type, count]) => ({ type, count })),
    });
  } catch (err: any) {
    console.error('[ai-news-quality] Error:', err);
    return NextResponse.json({ error: err.message?.slice(0, 200) }, { status: 500 });
  }
}
