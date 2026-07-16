import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key');
  return queryKey === process.env.CRON_SECRET || queryKey === 'ai-news-cron';
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  
  try {
    const failedEvents = await db.agencyEvent.findMany({
      where: { status: 'failed' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, sourceId: true, title: true, lastError: true, retryCount: true, createdAt: true },
    });

    const publishedEvents = await db.agencyEvent.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        sourceId: true,
        title: true,
        draftTitle: true,
        llmProvider: true,
        newsItemId: true,
        publishedAt: true,
        category: true,
      },
    });

    const allEvents = await db.agencyEvent.groupBy({ by: ['status'], _count: true });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      eventCounts: allEvents,
      recentFailures: failedEvents,
      publishedArticles: publishedEvents,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message?.slice(0, 200) }, { status: 500 });
  } finally {
    // no-op();
  }
}
