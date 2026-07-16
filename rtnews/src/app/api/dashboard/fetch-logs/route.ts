// ─── Dashboard Fetch Logs API ──────────────────────────────
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await db.newsFetchLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      logs: logs.map(log => ({
        id: log.id,
        newsType: log.newsType,
        status: log.status,
        itemsFetched: log.itemsFetched,
        itemsSaved: log.itemsSaved,
        errors: log.errors,
        duration: log.duration,
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ logs: [], error: error.message }, { status: 500 });
  }
}
