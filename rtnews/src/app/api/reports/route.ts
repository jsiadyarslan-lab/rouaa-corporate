// ─── Automated Reports API ───────────────────────────────────
// Generate and retrieve automated news/market reports
// V67: Updated to use db.economicReport (consistent with the rest of the system)

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';

export const dynamic = 'force-dynamic';

// ─── In-Memory Cache for GET route ─────────────────────────────
// Reports change infrequently. Cache for 2 minutes.
interface CacheEntry<T> { data: T; expiresAt: number }
const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data as T;
}
function setCache<T>(key: string, data: T, ttl = CACHE_TTL): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
  if (cache.size > 50) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
}

// GET: List reports (uses economicReport model)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    // Check cache
    const cacheKey = `reports:${reportType || 'all'}:${page}:${limit}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const where: any = { locale: 'ar', isPublished: true };
    if (reportType) where.reportType = reportType;

    const [reports, total] = await Promise.all([
      db.economicReport.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          reportType: true,
          summary: true,
          scope: true,
          marketImpact: true,
          confidenceScore: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      db.economicReport.count({ where }),
    ]);

    const result = { reports, total, page, limit };
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Reports] GET error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Generate a new report (admin/cron)
export async function POST(request: Request) {
  try {
    const { reportType, period } = await request.json() as {
      reportType: 'daily' | 'weekly' | 'monthly';
      period?: string;
    };

    if (!reportType) {
      return NextResponse.json({ error: 'نوع التقرير مطلوب' }, { status: 400 });
    }

    // Determine time range
    const now = new Date();
    let startDate = new Date();
    if (reportType === 'daily') startDate.setDate(now.getDate() - 1);
    else if (reportType === 'weekly') startDate.setDate(now.getDate() - 7);
    else startDate.setMonth(now.getMonth() - 1);

    const periodStr = period || (reportType === 'daily'
      ? now.toISOString().split('T')[0]
      : reportType === 'weekly'
        ? `${now.getFullYear()}-W${String(Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7)).padStart(2, '0')}`
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    // Fetch news data for the period
    const [newsItems, categoryCounts, sentimentCounts] = await Promise.all([
      db.newsItem.findMany({
        where: {
          fetchedAt: { gte: startDate },
          isReady: true,
          locale: 'ar',
        },
        orderBy: { views: 'desc' },
        take: 20,
        select: { id: true, title: true, titleAr: true, category: true, sentiment: true, views: true, impactLevel: true },
      }),
      db.newsItem.groupBy({
        by: ['category'],
        where: { fetchedAt: { gte: startDate }, isReady: true, locale: 'ar' },
        _count: true,
      }),
      db.newsItem.groupBy({
        by: ['sentiment'],
        where: { fetchedAt: { gte: startDate }, isReady: true, locale: 'ar' },
        _count: true,
      }),
    ]);

    // Generate AI summary
    const topNews = newsItems.slice(0, 5).map(n => `- ${n.titleAr || n.title} (${n.category}, ${n.sentiment})`).join('\n');
    const catSummary = categoryCounts.map(c => `${c.category}: ${c._count}`).join(', ');
    const sentSummary = sentimentCounts.map(s => `${s.sentiment}: ${s._count}`).join(', ');

    let summaryAr = '';
    try {
      const aiResult = await chatCompletion([
        {
          role: 'system',
          content: 'أنت محلل مالي عربي. اكتب ملخصاً تنفيذياً مختصراً (3-5 جمل) عن أهم التطورات في الأسواق المالية بناءً على البيانات المقدمة. استخدم لغة مهنية.'
        },
        {
          role: 'user',
          content: `أخبار الأكثر قراءة:\n${topNews}\n\nتوزيع الفئات: ${catSummary}\nتوزيع المشاعر: ${sentSummary}\nنوع التقرير: ${reportType === 'daily' ? 'يومي' : reportType === 'weekly' ? 'أسبوعي' : 'شهري'}`
        }
      ], { temperature: 0.4, maxTokens: 300 });
      summaryAr = aiResult.content || '';
    } catch {
      summaryAr = `تقرير ${reportType === 'daily' ? 'يومي' : reportType === 'weekly' ? 'أسبوعي' : 'شهري'} — ${newsItems.length} خبر منشور`;
    }

    const slug = `${reportType}-report-${now.toISOString().split('T')[0]}-${Date.now().toString(36)}`;

    const report = await db.economicReport.create({
      data: {
        title: `تقرير ${reportType === 'daily' ? 'يومي' : reportType === 'weekly' ? 'أسبوعي' : 'شهري'} — ${periodStr}`,
        slug,
        content: JSON.stringify({
          period: periodStr,
          totalNews: newsItems.length,
          topNews: newsItems.slice(0, 10),
          categoryBreakdown: categoryCounts,
          sentimentBreakdown: sentimentCounts,
        }),
        summary: summaryAr,
        reportType,
        scope: 'global',
        sectors: JSON.stringify(Object.keys(categoryCounts.reduce((acc: Record<string, number>, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {}))),
        countries: '[]',
        keyIndicators: '{}',
        sourceUrls: '[]',
        marketImpact: 'neutral',
        confidenceScore: 50,
        isPublished: true,
        publishedAt: now,
        locale: 'ar',
      },
    });

    // Invalidate reports cache after creating a new report
    cache.clear();

    return NextResponse.json({ success: true, report: { id: report.id, title: report.title, slug: report.slug, summary: report.summary } });
  } catch (error: any) {
    console.error('[Reports] POST error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
