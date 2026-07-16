import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// V128: GOLDEN RULE #4 — Pipeline NEVER stops.
// This endpoint is used by Railway's health checker (healthcheckPath in railway.toml).
// It MUST also call ensureRunning() to auto-restart dead/stale pipelines.
// Previously, this only returned {status: "ok"} without any self-healing,
// meaning Railway thought the container was healthy even when the pipeline was dead.
export async function GET() {
  // ── V128: Self-healing — ensure pipeline is running ──
  // This is the SAME logic as /api/health, but lighter weight.
  // Railway's health checker hits this every 30-60 seconds.
  // If the pipeline is dead/stale, this will auto-restart it.
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
      const { ensureRunning } = await import('@/lib/pipeline/orchestrator');
      const result = ensureRunning();
      if (result.restarted) {
        console.warn(`[API V128] Pipeline was ${result.wasStale ? 'STALE' : 'NOT RUNNING'} — auto-restarted via health check`);
      }
    }
  } catch (err: any) {
    // Non-critical — the pipeline may not be initialized yet during startup
    console.warn(`[API V128] ensureRunning() failed (non-critical during startup): ${err.message}`);
  }

  // Always return 200 — the server IS running even if pipeline is temporarily down
  // Railway must not kill the container just because of a transient issue
  return NextResponse.json({
    status: "ok",
    service: "RouaTradingNews",
    timestamp: new Date().toISOString(),
  });
}
