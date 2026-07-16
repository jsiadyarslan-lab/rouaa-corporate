// ─── On-Demand Article Generation API ──────────────────────
// DISABLED FOR VISITORS: This endpoint is reserved for internal/cron use only.
// All article generation must happen in the background via the cron job.
// Visitors should NEVER trigger generation — if content is missing, wait for cron.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Return cached content if available, otherwise indicate not ready
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const newsId = searchParams.get('newsId');

  if (!newsId) {
    return NextResponse.json({ hasFullContent: false }, { status: 400 });
  }

  // Check for internal/cron request
  const internalSecret = process.env.CRON_SECRET;
  const requestSecret = request.headers.get('x-cron-secret');
  const internalParam = searchParams.get('internal');

  if (!internalParam && requestSecret !== internalSecret) {
    // For visitors: just return that content is not ready — no generation
    return NextResponse.json({
      hasFullContent: false,
      message: 'المحتوى قيد التجهيز في الخلفية',
    });
  }

  return NextResponse.json({
    hasFullContent: false,
    message: 'On-demand generation is disabled. Use the cron job.',
  });
}

// POST: DISABLED for visitors — generation only via cron
export async function POST(request: Request) {
  const internalSecret = process.env.CRON_SECRET;
  const requestSecret = request.headers.get('x-cron-secret');
  const internalParam = new URL(request.url).searchParams.get('internal');

  if (!internalParam && requestSecret !== internalSecret) {
    return NextResponse.json({
      error: 'هذا المسار غير متاح. جميع المعالجات تتم في الخلفية.',
      hint: 'Article generation is background-only. The cron job will generate content.',
    }, { status: 403 });
  }

  return NextResponse.json({
    message: 'On-demand generation is disabled. Use the cron job for article generation.',
    action: 'Trigger /api/news/cron?action=process to generate article content.',
  });
}
