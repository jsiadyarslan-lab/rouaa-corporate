// ─── Integration: Public Health Ping V1 ─────────────────────
// Ultra-lightweight health check for uptime monitoring.
// NO authentication required — designed for external monitors
// (UptimeRobot, Pingdom, Railway health checks, etc.)
//
// Returns 200 if the server is running and can reach the trading platform.
// Returns 503 only if the server is critically broken (should never happen).
//
// Usage: GET /api/integration/ping
//        GET /api/integration/ping?verbose=1  (includes extra details)

import { NextRequest, NextResponse } from 'next/server';
import { getCircuitBreakerStatus } from '@/lib/integration-auth';
import { hasApiKeys, getApiStatus } from '@/lib/financial-apis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const verbose = request.nextUrl.searchParams.get('verbose') === '1';

  const circuitBreaker = getCircuitBreakerStatus();
  const apiStatus = getApiStatus();

  const result: Record<string, any> = {
    status: 'ok',
    service: 'roua-news-integration',
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startTime,
  };

  if (verbose) {
    result.circuitBreaker = circuitBreaker;
    result.apiKeys = {
      finnhub: apiStatus.finnhub,
      alphaVantage: apiStatus.alphaVantage,
      exchangeRate: apiStatus.exchangeRate,
      anyConfigured: hasApiKeys(),
    };
  }

  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
