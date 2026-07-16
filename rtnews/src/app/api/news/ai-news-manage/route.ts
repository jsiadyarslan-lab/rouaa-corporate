// AI News Management API — تعديل/إخفاء/إعادة تحليل/إعادة توليد صورة
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH — تعديل الخبر (title/summary/content/category/isPublished)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, fields } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    // تعديل الحقول مباشرة
    if (action === 'edit' && fields) {
      const allowed: Record<string, any> = {};
      if (fields.title !== undefined) allowed.title = fields.title;
      if (fields.titleAr !== undefined) allowed.titleAr = fields.titleAr;
      if (fields.summary !== undefined) allowed.summary = fields.summary;
      if (fields.summaryAr !== undefined) allowed.summaryAr = fields.summaryAr;
      if (fields.content !== undefined) allowed.content = fields.content;
      if (fields.contentAr !== undefined) allowed.contentAr = fields.contentAr;
      if (fields.category !== undefined) allowed.category = fields.category;
      if (fields.sentiment !== undefined) allowed.sentiment = fields.sentiment;
      if (fields.impactLevel !== undefined) allowed.impactLevel = fields.impactLevel;
      if (fields.isPublished !== undefined) allowed.isPublished = fields.isPublished;
      if (fields.isReady !== undefined) allowed.isReady = fields.isReady;

      const updated = await db.newsItem.update({ where: { id }, data: allowed });
      return NextResponse.json({ success: true, news: { id: updated.id, title: updated.title } });
    }

    // إخفاء/إظهار
    if (action === 'togglePublish') {
      const article = await db.newsItem.findUnique({ where: { id }, select: { isPublished: true, publishedAt: true } });
      if (!article) return NextResponse.json({ error: 'not found' }, { status: 404 });

      const newPublished = !article.isPublished;
      const updated = await db.newsItem.update({
        where: { id },
        data: {
          isPublished: newPublished,
          ...(newPublished && !article.publishedAt ? { publishedAt: new Date() } : {}),
        },
      });
      return NextResponse.json({ success: true, isPublished: updated.isPublished });
    }

    // تثبيت/إلغاء تثبيت (pinned field stored in affectedAssets JSON or a dedicated column)
    if (action === 'togglePin') {
      const article = await db.newsItem.findUnique({ where: { id }, select: { isReady: true } });
      if (!article) return NextResponse.json({ error: 'not found' }, { status: 404 });
      // استخدام isReady كـ pin flag مؤقتًا (يمكن إضافة عمود pinned لاحقًا)
      const updated = await db.newsItem.update({
        where: { id },
        data: { isReady: !article.isReady },
      });
      return NextResponse.json({ success: true, isReady: updated.isReady });
    }

    // إعادة التحليل
    if (action === 'reanalyze') {
      // مسح التحليل الحالي وإعادة تعيين المرحلة
      await db.newsItem.update({
        where: { id },
        data: {
          aiAnalysis: JSON.stringify({ pendingAnalysis: true, reanalyzeTriggered: new Date().toISOString() }),
          processingStage: 'analyzed',
        },
      });
      return NextResponse.json({ success: true, message: 'Re-analysis queued' });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[ai-news-manage] PATCH error:', err);
    return NextResponse.json({ error: err.message?.slice(0, 200) }, { status: 500 });
  }
}

// GET — جلب قائمة الأخبار مع فلاتر متقدمة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'all';
    const status = searchParams.get('status') || 'all'; // all/published/draft
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '30'));
    const offset = parseInt(searchParams.get('offset') || '0');
    const qualityFilter = searchParams.get('quality') || 'all'; // all/violations/pending/analyzed

    const where: any = {
      OR: [{ source: 'رؤى' }, { source: 'Rouaa' }],
    };

    if (locale !== 'all') where.locale = locale;
    if (status === 'published') where.isPublished = true;
    if (status === 'draft') where.isPublished = false;

    if (qualityFilter === 'violations') {
      where.isPublished = true;
      where.NOT = { aiAnalysis: { contains: 'fullContent' } };
    } else if (qualityFilter === 'pending') {
      where.NOT = { aiAnalysis: { contains: 'fullContent' } };
      where.NOT = { ...where.NOT, aiAnalysis: { contains: 'analysisFailed' } };
    } else if (qualityFilter === 'analyzed') {
      where.aiAnalysis = { contains: 'fullContent' };
    }

    const [news, total] = await Promise.all([
      db.newsItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true, title: true, titleAr: true, summary: true, summaryAr: true,
          content: true, contentAr: true, category: true, sentiment: true,
          sentimentScore: true, impactLevel: true, impactScore: true,
          isPublished: true, isReady: true, locale: true, originalLanguage: true,
          source: true, sourceName: true, url: true, slug: true,
          aiAnalysis: true, affectedAssets: true, generatedImage: true,
          createdAt: true, publishedAt: true, fetchedAt: true,
          processingStage: true, newsType: true,
        },
      }),
      db.newsItem.count({ where }),
    ]);

    return NextResponse.json({
      news: news.map(n => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        publishedAt: n.publishedAt?.toISOString() || null,
        fetchedAt: n.fetchedAt?.toISOString() || null,
        hasAnalysis: !!(n.aiAnalysis && n.aiAnalysis.includes('fullContent')),
        hasPendingAnalysis: !!(n.aiAnalysis && n.aiAnalysis.includes('pendingAnalysis')),
        hasFailed: !!(n.aiAnalysis && n.aiAnalysis.includes('analysisFailed')),
        hasImage: !!(n.generatedImage && (n.generatedImage.startsWith('http') || n.generatedImage.length > 1000)),
        analysisData: (() => {
          try { return n.aiAnalysis ? JSON.parse(n.aiAnalysis) : null; } catch { return null; }
        })(),
      })),
      total,
      limit,
      offset,
    });
  } catch (err: any) {
    console.error('[ai-news-manage] GET error:', err);
    return NextResponse.json({ error: err.message?.slice(0, 200) }, { status: 500 });
  }
}

// DELETE — حذف خبر
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await db.newsItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message?.slice(0, 200) }, { status: 500 });
  }
}
