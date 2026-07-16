import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const isAdmin = await isAdminAuthenticated(request);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url);
  const articleId = url.searchParams.get('id');
  if (!articleId) return NextResponse.json({ error: 'id required' }, { status: 400 });
  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
      select: { id: true, title: true, titleAr: true, summary: true, summaryAr: true, content: true, contentAr: true, source: true, sourceName: true, url: true, category: true, sentiment: true, impactLevel: true, aiAnalysis: true, imageUrl: true, publishedAt: true, createdAt: true, locale: true, slug: true, isPublished: true },
    });
    if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // V1111: Fetch the raw source content from AgencyEvent for comparison
    let rawSource: { sourceId?: string; sourceName?: string; rawContent?: string; title?: string; url?: string; externalId?: string } | null = null;
    try {
      const agencyEvent = await db.agencyEvent.findFirst({
        where: { newsItemId: articleId },
        select: { sourceId: true, sourceName: true, rawContent: true, title: true, url: true, externalId: true },
      });
      if (agencyEvent) {
        rawSource = agencyEvent;
      }
    } catch {}

    return NextResponse.json({ ...article, rawSource });
  } catch (err: any) { return NextResponse.json({ error: err.message?.slice(0, 200) }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  const isAdmin = await isAdminAuthenticated(request);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { id, title, titleAr, summary, summaryAr, content, contentAr, category, sentiment, impactLevel } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (titleAr !== undefined) updateData.titleAr = titleAr;
    if (summary !== undefined) updateData.summary = summary;
    if (summaryAr !== undefined) updateData.summaryAr = summaryAr;
    if (content !== undefined) updateData.content = content;
    if (contentAr !== undefined) updateData.contentAr = contentAr;
    if (category !== undefined) updateData.category = category;
    if (sentiment !== undefined) updateData.sentiment = sentiment;
    if (impactLevel !== undefined) updateData.impactLevel = impactLevel;
    const updated = await db.newsItem.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, id: updated.id });
  } catch (err: any) { return NextResponse.json({ error: err.message?.slice(0, 200) }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const isAdmin = await isAdminAuthenticated(request);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const url = new URL(request.url);
    const articleId = url.searchParams.get('id');
    if (!articleId) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await db.newsItem.update({ where: { id: articleId }, data: { isPublished: false, isReady: false, publishedAt: null } });
    await db.newsItem.delete({ where: { id: articleId } });
    await db.agencyEvent.updateMany({ where: { newsItemId: articleId }, data: { status: 'failed', newsItemId: null, lastError: 'deleted by admin' } });
    return NextResponse.json({ success: true, deleted: articleId });
  } catch (err: any) { return NextResponse.json({ error: err.message?.slice(0, 200) }, { status: 500 }); }
}
