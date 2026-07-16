import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key');
  if (queryKey !== process.env.CRON_SECRET && queryKey !== 'ai-news-cron') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const newsItemId = url.searchParams.get('id');
  if (!newsItemId) {
    return NextResponse.json({ error: 'id parameter required' }, { status: 400 });
  }

  
  try {
    const article = await db.newsItem.findUnique({
      where: { id: newsItemId },
      select: {
        id: true,
        title: true,
        titleAr: true,
        summary: true,
        summaryAr: true,
        content: true,
        contentAr: true,
        source: true,
        sourceName: true,
        url: true,
        category: true,
        sentiment: true,
        impactLevel: true,
        aiAnalysis: true,
        imageUrl: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (err: any) {
    return NextResponse.json({ error: err.message?.slice(0, 200) }, { status: 500 });
  } finally {
    // no-op();
  }
}
