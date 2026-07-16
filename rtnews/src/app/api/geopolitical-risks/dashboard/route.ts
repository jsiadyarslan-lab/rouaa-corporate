import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getGeopoliticalSchedulerStatus } from '@/lib/pipeline/geopolitical-scheduler';

export const dynamic = 'force-dynamic';

// GET /api/geopolitical-risks/dashboard — Scheduler status + publication stats
// Used by the admin dashboard to show counters and pipeline state.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'ar';

    // Get scheduler status (in-memory state)
    const schedulerStatus = getGeopoliticalSchedulerStatus();

    // Get publication stats from DB
    let stats = {
      total: 0,
      published: 0,
      byLocale: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      today: 0,
      thisWeek: 0,
      last7days: [] as { date: string; count: number }[],
      avgRiskScore: 0,
      topCountries: [] as { name: string; count: number }[],
    };

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);

      const [total, published, todayCount, weekCount, allRisks] = await Promise.all([
        db.geopoliticalRisk.count(),
        db.geopoliticalRisk.count({ where: { isPublished: true } }),
        db.geopoliticalRisk.count({ where: { publishedAt: { gte: todayStart } } }),
        db.geopoliticalRisk.count({ where: { publishedAt: { gte: weekStart } } }),
        db.geopoliticalRisk.findMany({
          where: { isPublished: true },
          select: { riskScore: true, riskLevel: true, riskCategory: true, locale: true, publishedAt: true, affectedCountries: true },
          orderBy: { publishedAt: 'desc' },
          take: 500,
        }),
      ]);

      stats.total = total;
      stats.published = published;
      stats.today = todayCount;
      stats.thisWeek = weekCount;

      // Aggregate by locale, category, level
      const byLocale: Record<string, number> = {};
      const byCategory: Record<string, number> = {};
      const byLevel: Record<string, number> = {};
      let scoreSum = 0;
      const countryCount: Record<string, number> = {};
      const dayCount: Record<string, number> = {};

      for (const risk of allRisks) {
        byLocale[risk.locale] = (byLocale[risk.locale] || 0) + 1;
        byCategory[risk.riskCategory] = (byCategory[risk.riskCategory] || 0) + 1;
        byLevel[risk.riskLevel] = (byLevel[risk.riskLevel] || 0) + 1;
        scoreSum += risk.riskScore;

        // Parse affectedCountries for top countries
        try {
          const countries = typeof risk.affectedCountries === 'string'
            ? JSON.parse(risk.affectedCountries)
            : risk.affectedCountries;
          if (Array.isArray(countries)) {
            for (const c of countries) {
              if (c && c.name) {
                countryCount[c.name] = (countryCount[c.name] || 0) + 1;
              }
            }
          }
        } catch {}

        // Day bucket for last 7 days chart
        if (risk.publishedAt) {
          const day = new Date(risk.publishedAt).toISOString().split('T')[0];
          dayCount[day] = (dayCount[day] || 0) + 1;
        }
      }

      stats.byLocale = byLocale;
      stats.byCategory = byCategory;
      stats.byLevel = byLevel;
      stats.avgRiskScore = allRisks.length > 0 ? Math.round(scoreSum / allRisks.length) : 0;

      // Top 5 countries
      stats.topCountries = Object.entries(countryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Last 7 days chart data
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().split('T')[0];
        stats.last7days.push({ date: dayKey, count: dayCount[dayKey] || 0 });
      }
    } catch (dbErr: any) {
      console.warn('[GeoDashboard] DB stats failed:', dbErr?.message?.slice(0, 100));
    }

    return NextResponse.json({
      scheduler: schedulerStatus,
      stats,
      locale,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GeoDashboard] Error:', message);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: message },
      { status: 500 },
    );
  }
}
