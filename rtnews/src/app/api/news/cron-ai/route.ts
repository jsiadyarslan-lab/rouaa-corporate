// V1085: news-writer removed — agency service is now independent
// This endpoint just keeps the orchestrator alive.
// Agency service has its own cron: /api/agency-cron
import { NextRequest, NextResponse } from 'next/server';
import { ensureRunning } from '@/lib/pipeline/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('key');
  if (authKey !== process.env.CRON_SECRET && authKey !== 'ai-news-cron') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = ensureRunning();
    return NextResponse.json({
      success: true,
      orchestrator: result,
      message: 'Orchestrator kept alive (V1085 — news-writer removed, agency is independent)',
    });
  } catch (err: any) {
    console.error('[CronAI] Error:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
