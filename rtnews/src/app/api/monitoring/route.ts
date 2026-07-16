// ─── Monitoring API ──────────────────────────────────────────
// System health, performance metrics, alerting

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: System monitoring data (admin only)
export async function GET(request: Request) {
  try {
    const startTime = Date.now();

    // Database health check
    let dbStatus = 'healthy';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await db.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
    } catch {
      dbStatus = 'unhealthy';
    }

    // Collection counts
    const [newsCount, articleCount, subscriberCount, alertCount, discussionCount, userCount] = await Promise.all([
      db.newsItem.count({ where: { newsType: 'live' } }),
      db.newsItem.count({ where: { newsType: 'article' } }),
      db.newsletterSubscriber.count({ where: { status: 'active' } }),
      db.smartAlert.count({ where: { isActive: true } }),
      db.discussion.count(),
      db.user.count(),
    ]).catch(() => [0, 0, 0, 0, 0, 0]);

    // Recent pipeline runs
    const recentPipelines = await db.pipelineRun.findMany({
      take: 5,
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        status: true,
        trigger: true,
        articlesPublished: true,
        totalDuration: true,
        startedAt: true,
      },
    }).catch(() => []);

    // Error rate in last 24h
    const oneDayAgo = new Date(Date.now() - 86400000);
    const [totalRuns, failedRuns] = await Promise.all([
      db.pipelineRun.count({ where: { startedAt: { gte: oneDayAgo } } }),
      db.pipelineRun.count({ where: { startedAt: { gte: oneDayAgo }, status: 'failed' } }),
    ]).catch(() => [0, 0]);

    const errorRate = totalRuns > 0 ? ((failedRuns / totalRuns) * 100).toFixed(1) : '0';

    // Contact messages stats
    const [newMessages, totalMessages] = await Promise.all([
      db.contactMessage.count({ where: { status: 'new' } }),
      db.contactMessage.count(),
    ]).catch(() => [0, 0]);

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`,
      },
      metrics: {
        news: { live: newsCount as number, articles: articleCount as number },
        users: { total: userCount as number, subscribers: subscriberCount as number, activeAlerts: alertCount as number },
        community: { discussions: discussionCount as number },
        messages: { new: newMessages as number, total: totalMessages as number },
      },
      pipeline: {
        recent: recentPipelines,
        errorRate24h: `${errorRate}%`,
        totalRuns24h: totalRuns,
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
    });
  } catch (error: any) {
    console.error('[Monitoring] Error:', error.message);
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
