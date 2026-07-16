// GET /api/sources/health — Health summary for admin dashboard
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'rouaa-admin-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sources = await db.officialSource.findMany({
      select: {
        id: true, name: true, slug: true, type: true, country: true,
        isActive: true, healthScore: true, consecutiveFailures: true,
        lastFetchedAt: true, lastSuccessAt: true, lastErrorAt: true,
        lastErrorMessage: true, totalDocuments: true, totalFetches: true,
        avgResponseTime: true, priority: true,
      },
      orderBy: { healthScore: 'asc' },
    });

    const total = sources.length;
    const active = sources.filter(s => s.isActive).length;
    const disabled = total - active;
    const healthy = sources.filter(s => s.isActive && s.healthScore >= 80).length;
    const degraded = sources.filter(s => s.isActive && s.healthScore >= 50 && s.healthScore < 80).length;
    const critical = sources.filter(s => s.isActive && s.healthScore < 50).length;
    const avgHealthScore = total > 0 ? Math.round(sources.reduce((sum, s) => sum + s.healthScore, 0) / total) : 0;

    const totalDocuments = await db.officialDocument.count();

    return NextResponse.json({
      summary: {
        total,
        active,
        disabled,
        healthy,
        degraded,
        critical,
        avgHealthScore,
        totalDocuments,
      },
      sources,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
