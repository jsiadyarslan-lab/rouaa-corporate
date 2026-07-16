// ─── Health Check Endpoint V54 ─────────────────────────────────
// CRITICAL: This endpoint must ALWAYS return 200.
// Railway uses this to determine if the container is healthy.
// If it returns 503, Railway kills the container.
//
// V54: Simplified — returns { status: "ok" } immediately.
// Heavy checks (DB, AI, pipeline self-healing, Raqeeb monitoring)
// moved to /api/admin/health for admin-only monitoring.
// This prevents health checks from consuming DB connections, running
// AI pipelines, and triggering self-healing on every ping.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    uptime: process.uptime ? Math.floor(process.uptime()) : null,
    version: process.env.BUILD_VERSION || process.env.npm_package_version || '1.0.0',
    gitSha: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_SHA || (() => { try { return require('fs').readFileSync('/tmp/.git-sha', 'utf8').trim() || null; } catch { return null; } })(),
    buildDate: process.env.RAILWAY_GIT_COMMIT_DATE || process.env.BUILD_DATE || new Date().toISOString().split('T')[0],
  }, { status: 200 });
}
