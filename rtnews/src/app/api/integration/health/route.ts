// ─── Integration Health Check Endpoint V4 ─────────────────
// Tests the connection between the news site and trading platform.
//
// V4: Supports both authenticated and public access:
//   - Authenticated (X-Integration-Key): Full health check with trading platform
//   - Public (rate-limited): Basic health check without trading platform ping

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateIntegrationRequest,
  createIntegrationResponse,
  createIntegrationError,
  fetchFromTradingPlatform,
  getCircuitBreakerStatus,
} from '@/lib/integration-auth';
import { getSyncCache } from '@/lib/integration-cache';

export async function GET(request: NextRequest) {
  const { authenticated, rateLimited, rateLimitResult } = authenticateIntegrationRequest(request, 'default');

  if (rateLimited) {
    return NextResponse.json(
      { error: 'تم تجاوز حد الطلبات', retryAfterMs: rateLimitResult?.retryAfterMs },
      { status: 429 }
    );
  }

  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

  // Check 1: Database connectivity (always)
  try {
    const dbStart = Date.now();
    const { db } = await import('@/lib/db');
    await db.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (error: any) {
    checks.database = { status: 'error', error: error?.message };
  }

  // Check 2: Trading platform connectivity (authenticated only)
  if (authenticated) {
    try {
      const tpStart = Date.now();
      const tpResponse = await fetchFromTradingPlatform('/api/health');
      const tpLatency = Date.now() - tpStart;

      if (tpResponse.ok) {
        const tpData = await tpResponse.json();
        checks.tradingPlatform = {
          status: tpData.status === 'ok' ? 'ok' : 'degraded',
          latencyMs: tpLatency,
        };
      } else {
        checks.tradingPlatform = {
          status: 'error',
          latencyMs: tpLatency,
          error: `HTTP ${tpResponse.status}`,
        };
      }
    } catch (error: any) {
      checks.tradingPlatform = {
        status: 'unreachable',
        error: error?.message,
      };
    }
  }

  // Check 3: News stats (always)
  try {
    const { db } = await import('@/lib/db');
    const totalArticles = await db.newsItem.count();
    const publishedArticles = await db.newsItem.count({
      where: { isPublished: true },
    });
    checks.newsStats = {
      status: 'ok',
      // @ts-ignore - custom field for stats
      totalArticles,
      // @ts-ignore
      publishedArticles,
    };
  } catch (error: any) {
    checks.newsStats = { status: 'error', error: error?.message };
  }

  // Check 4: Circuit Breaker status (authenticated only)
  let circuitBreaker;
  if (authenticated) {
    circuitBreaker = getCircuitBreakerStatus();
  }

  // Check 5: Cache stats (always)
  let cacheStats;
  try {
    const cache = getSyncCache();
    cacheStats = await cache.getStats();
  } catch {
    cacheStats = { size: 0, hits: 0, misses: 0, redisConnected: false };
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok' || c.status === 'unreachable');
  const authOk = authenticated ? !circuitBreaker?.isOpen : true;

  return createIntegrationResponse({
    status: allOk && authOk ? 'ok' : 'degraded',
    service: 'roua-news',
    version: '4.0',
    authenticated,
    timestamp: new Date().toISOString(),
    checks,
    circuitBreaker,
    cache: cacheStats,
  });
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const partnerUrl = process.env.INTEGRATION_PARTNER_URL || '';

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': partnerUrl || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Integration-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}
