// ─── On-Demand Article Processing Endpoint ─────────────────────
// DISABLED FOR VISITORS: This endpoint is reserved for internal/cron use only.
// All article processing (fetch, translate, generate, analyze) must happen
// in the background via the cron job. Visitors should NEVER trigger processing.
// If an article is not ready, the visitor sees 404 — the cron will process it.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: Request) {
  // Only allow internal cron requests (same-server or with cron secret)
  const internalSecret = process.env.CRON_SECRET;
  const requestSecret = request.headers.get('x-cron-secret');
  const internalParam = new URL(request.url).searchParams.get('internal');

  if (!internalParam && requestSecret !== internalSecret) {
    return NextResponse.json({
      error: 'هذا المسار غير متاح. جميع المعالجات تتم في الخلفية.',
      hint: 'Article processing is background-only. The cron job will process this article.',
    }, { status: 403 });
  }

  return NextResponse.json({
    message: 'On-demand processing is disabled. Use the cron job for article processing.',
    action: 'Trigger /api/news/cron?action=process to process incomplete articles.',
  });
}
