// ─── Lightweight Health Ping Endpoint V1 ────────────────────
// Ultra-light health check for monitoring and load balancers.
// Always returns 200 OK without any DB or external service checks.
// Use /api/health for detailed health checks with diagnostics.
//
// This endpoint is PUBLIC — no authentication required.
// Suitable for Railway/uptime monitoring without adding DB load.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? Math.floor(process.uptime()) : null,
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

// HEAD support for lightweight monitoring
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
