// AI News Writer Stats API — عدادات النشر لكل لغة (ساعة/يوم/شهر/إجمالي)
// + سجل النشاط اللحظي + حالة الوكيل
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const LOCALES = ['ar', 'en', 'fr', 'tr', 'es'];
const LOCALE_LABELS: Record<string, string> = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
  tr: 'Türkçe',
  es: 'Español',
};
const LOCALE_FLAGS: Record<string, string> = {
  ar: '🇸🇦', en: '🇬🇧', fr: '🇫🇷', tr: '🇹🇷', es: '🇪🇸',
};

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // عدادات لكل لغة: ساعة/يوم/شهر/إجمالي
    const statsByLocale: Record<string, {
      locale: string; label: string; flag: string;
      hour: number; day: number; month: number; total: number;
      published: number; drafts: number; violations: number;
      analyzed: number; pending: number;
    }> = {};

    for (const locale of LOCALES) {
      const [hour, day, month, total, published, drafts, analyzed, pending, violations] = await Promise.all([
        db.newsItem.count({
          where: { OR: [{ source: 'رؤى' }, { source: 'Rouaa' }], locale, createdAt: { gte: hourStart } },
        }),
        db.newsItem.count({
          where: { OR: [{ source: 'رؤى' }, { source: 'Rouaa' }], locale, createdAt: { gte: dayStart } },
        }),
        db.newsItem.count({
          where: { OR: [{ source: 'رؤى' }, { source: 'Rouaa' }], locale, createdAt: { gte: monthStart } },
        }),
        db.newsItem.count({
          where: { OR: [{ source: 'رؤى' }, { source: 'Rouaa' }], locale },
        }),
        db.newsItem.count({
          where: { OR: [{ source: 'رؤى' }, { source: 'Rouaa' }], locale, isPublished: true },
        }),
        db.newsItem.count({
          where: { OR: [{ source: 'رؤى' }, { source: 'Rouaa' }], locale, isPublished: false },
        }),
        db.newsItem.count({
          where: {
            OR: [{ source: 'رؤى' }, { source: 'Rouaa' }],
            locale,
            aiAnalysis: { contains: 'fullContent' },
          },
        }),
        db.newsItem.count({
          where: {
            OR: [{ source: 'رؤى' }, { source: 'Rouaa' }],
            locale,
            NOT: { aiAnalysis: { contains: 'fullContent' } },
            NOT: { aiAnalysis: { contains: 'analysisFailed' } },
          },
        }),
        db.newsItem.count({
          where: {
            OR: [{ source: 'رؤى' }, { source: 'Rouaa' }],
            locale,
            isPublished: true,
            NOT: { aiAnalysis: { contains: 'fullContent' } },
          },
        }),
      ]);

      statsByLocale[locale] = {
        locale, label: LOCALE_LABELS[locale], flag: LOCALE_FLAGS[locale],
        hour, day, month, total, published, drafts, analyzed, pending, violations,
      };
    }

    // الإجماليات
    const totals = {
      hour: Object.values(statsByLocale).reduce((s, l) => s + l.hour, 0),
      day: Object.values(statsByLocale).reduce((s, l) => s + l.day, 0),
      month: Object.values(statsByLocale).reduce((s, l) => s + l.month, 0),
      total: Object.values(statsByLocale).reduce((s, l) => s + l.total, 0),
      published: Object.values(statsByLocale).reduce((s, l) => s + l.published, 0),
      drafts: Object.values(statsByLocale).reduce((s, l) => s + l.drafts, 0),
      violations: Object.values(statsByLocale).reduce((s, l) => s + l.violations, 0),
    };

    // حالة الوكيل
    const settings = await db.siteSetting.findMany({
      where: { OR: [{ key: { contains: 'newsWriter' } }, { key: { contains: 'lastLocale' } }] },
      select: { key: true, value: true },
    });
    const agentState: Record<string, string> = {};
    for (const s of settings) agentState[s.key] = s.value;

    // آخر 5 أخبار (للتحديث اللحظي)
    const recentNews = await db.newsItem.findMany({
      where: { OR: [{ source: 'رؤى' }, { source: 'Rouaa' }] },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, title: true, locale: true, isPublished: true,
        impactLevel: true, sentiment: true, category: true,
        source: true, sourceName: true, createdAt: true, publishedAt: true,
        originalLanguage: true, slug: true,
      },
    });

    // أعلى المصادر إنتاجاً (آخر 7 أيام)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sourceStats = await db.newsItem.groupBy({
      by: ['source'],
      where: {
        OR: [{ source: 'رؤى' }, { source: 'Rouaa' }],
        createdAt: { gte: weekAgo },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    return NextResponse.json({
      timestamp: now.toISOString(),
      statsByLocale,
      totals,
      agentState: {
        lastLocale: agentState['newsWriter.lastLocale'] || 'ar',
        lastRunAt: agentState['newsWriter.lastRunAt'] || null,
        lastRunAgoMin: agentState['newsWriter.lastRunAt']
          ? Math.round((now.getTime() - new Date(agentState['newsWriter.lastRunAt']).getTime()) / 60000)
          : null,
      },
      recentNews: recentNews.map(n => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        publishedAt: n.publishedAt?.toISOString() || null,
      })),
      topSources: sourceStats.map(s => ({ source: s.source, count: s._count.id })),
    });
  } catch (err: any) {
    console.error('[ai-news-stats] Error:', err);
    return NextResponse.json({ error: err.message?.slice(0, 200) }, { status: 500 });
  }
}
