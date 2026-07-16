// ─── Stock Orchestrator Status API ────────────────────────────
// GET /api/stock-analysis/orchestrator-status
// Returns the current status of the stock pipeline orchestrator.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { getStockOrchestratorStats } = await import('@/lib/pipeline/stock-orchestrator');
    const stats = getStockOrchestratorStats();
    return NextResponse.json({ status: 'ok', ...stats, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
