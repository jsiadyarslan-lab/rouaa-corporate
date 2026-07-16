// ═══════════════════════════════════════════════════════════════
// Agency Stats Endpoint
// ═══════════════════════════════════════════════════════════════
// Returns stats + recent events for the agency dashboard.
// Uses admin auth (same as other dashboard endpoints).
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Auth: require admin
  const authHeader = request.headers.get('authorization');
  const cookie = request.headers.get('cookie') || '';
  
  // Try admin auth via cookie (dashboard session)
  const isAdmin = await isAdminAuthenticated(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get stats
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [total, fetched, drafted, published, failed, publishedToday, publishedThisHour] = await Promise.all([
      db.agencyEvent.count(),
      db.agencyEvent.count({ where: { status: 'fetched' } }),
      db.agencyEvent.count({ where: { status: 'drafted' } }),
      db.agencyEvent.count({ where: { status: 'published' } }),
      db.agencyEvent.count({ where: { status: 'failed' } }),
      db.agencyEvent.count({ where: { status: 'published', publishedAt: { gte: oneDayAgo } } }),
      db.agencyEvent.count({ where: { status: 'published', publishedAt: { gte: oneHourAgo } } }),
    ]);

    // Get recent events (latest 20)
    const recentEvents = await db.agencyEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        sourceId: true,
        sourceName: true,
        eventType: true,
        title: true,
        status: true,
        category: true,
        llmProvider: true,
        newsItemId: true,
        publishedAt: true,
        createdAt: true,
        lastError: true,
      },
    });

    return NextResponse.json({
      stats: {
        total,
        fetched,
        drafted,
        published,
        failed,
        publishedToday,
        publishedThisHour,
      },
      recentEvents: recentEvents.map(e => ({
        ...e,
        publishedAt: e.publishedAt?.toISOString() || null,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (err: any) {
    console.error('[AgencyStats] Error:', err.message);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: err.message?.slice(0, 100) },
      { status: 500 }
    );
  }
}
