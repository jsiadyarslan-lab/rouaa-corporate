// ─── Process Endpoint — DISABLED ──────────────────────────────
// V2: This endpoint has been DISABLED. All processing is now handled
// by the Agent-Based Pipeline (orchestrator.ts + 5 agents).
//
// The old prefetchArticleContent() function was a 1295-line monster
// that processed articles via the OLD pipeline path. It could set
// processingStage without proper readiness checks, causing articles
// to appear partially processed.
//
// The new pipeline:
//   - Fetcher → Translator → Analyzer → Imager → Publisher
//   - Publisher is the ONLY agent that sets isReady=true
//   - Articles stay invisible until ALL steps complete
//
// To trigger processing, use: /api/news/cron?action=trigger

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    message: 'This endpoint is disabled. Use /api/news/cron?action=trigger to start the agent-based pipeline.',
    pipeline: 'V1-Agent',
    timestamp: new Date().toISOString(),
  });
}

export async function POST() {
  return GET();
}
