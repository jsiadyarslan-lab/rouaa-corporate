// ─── Newsletter Admin API ────────────────────────────────────
// List subscribers, get stats (admin only, protected by middleware)

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: List newsletter subscribers (admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where = status !== 'all' ? { status } : {};

    const [subscribers, total] = await Promise.all([
      db.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          source: true,
          createdAt: true,
        },
      }),
      db.newsletterSubscriber.count({ where }),
    ]);

    // Stats
    const [activeCount, unsubscribedCount, bouncedCount] = await Promise.all([
      db.newsletterSubscriber.count({ where: { status: 'active' } }),
      db.newsletterSubscriber.count({ where: { status: 'unsubscribed' } }),
      db.newsletterSubscriber.count({ where: { status: 'bounced' } }),
    ]);

    return NextResponse.json({
      subscribers,
      total,
      page,
      limit,
      stats: { active: activeCount, unsubscribed: unsubscribedCount, bounced: bouncedCount },
    });
  } catch (error: any) {
    console.error('[Newsletter] GET error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
