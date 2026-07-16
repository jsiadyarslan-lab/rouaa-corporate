// ─── Database Health Check Endpoint ──────────────────────────
// Diagnoses database connection issues clearly.
// Returns connection status, mode (direct/pooler), port, latency,
// and error details if the connection fails.
//
// Use this endpoint to debug "site not loading" / "DB not connected" issues.
// GET /api/db-health → { connected, mode, port, latencyMs, error?, url? }

import { NextResponse } from 'next/server'
import { checkDBHealth } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const health = await checkDBHealth()

  const status = health.connected ? 200 : 503

  return NextResponse.json({
    status: health.connected ? 'ok' : 'error',
    database: {
      connected: health.connected,
      mode: health.mode,
      port: health.port,
      latencyMs: health.latencyMs,
      error: health.error,
      url: health.url,
    },
    hint: !health.connected
      ? health.mode === 'dummy'
        ? 'DATABASE_URL is not set. Add it in your deployment platform (Railway > Variables).'
        : health.mode === 'pooler'
          ? 'Pooler connection failed. Try: (1) Check password, (2) Try direct connection port 5432 instead, (3) Make sure pgbouncer=true is in URL.'
          : 'Direct connection failed. Try: (1) Check password, (2) Try pooler connection port 6543, (3) Check if IP is allowed in Supabase.'
      : undefined,
    timestamp: new Date().toISOString(),
  }, { status })
}
