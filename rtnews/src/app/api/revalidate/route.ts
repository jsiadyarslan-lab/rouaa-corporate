// ─── Cache Revalidation Endpoint V1 ───────────────────────────
// Forces Next.js to purge cached responses for API routes.
// Fixes the issue where Next.js 16 standalone with Turbopack
// caches 404 responses for API routes (x-nextjs-cache: HIT).
//
// Usage: POST /api/revalidate?secret=<REVALIDATION_SECRET>
// Body: { "paths": ["/api/ping", "/api/news", ...] }
// Or: GET /api/revalidate?secret=<REVALIDATION_SECRET>&path=/api/ping

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// List of routes to revalidate (critical for pipeline operation)
// V130: Added page routes (article/news) to purge any stale ISR cache entries
const CRITICAL_ROUTES = [
  // API routes
  '/api/ping',
  '/api/news',
  '/api/news/cron',
  '/api/news/health',
  '/api/news/manage',
  '/api/news/bootstrap',
  '/api/news/live',
  '/api/news/breaking',
  '/api/news/test-sources',
  '/api/admin/pipeline',
  '/api/dashboard',
  '/api/markets',
  '/api/articles',
  '/api/search',
  // V130: Page routes — purge stale ISR cache for article/news pages
  '/article',
  '/news',
  '/infographics',
  '/',
];

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.REVALIDATION_SECRET || process.env.ADMIN_PASSWORD;
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Revalidation not configured' }, { status: 503 });
  }

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get('path');

  if (path) {
    // Revalidate a specific path
    try {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path });
    } catch (err: any) {
      return NextResponse.json({ revalidated: false, error: err.message }, { status: 500 });
    }
  }

  // Revalidate all critical API routes
  const results: string[] = [];
  for (const route of CRITICAL_ROUTES) {
    try {
      revalidatePath(route);
      results.push(`${route}: ok`);
    } catch (err: any) {
      results.push(`${route}: failed - ${err.message}`);
    }
  }

  return NextResponse.json({
    revalidated: true,
    routes: results,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.REVALIDATION_SECRET || process.env.ADMIN_PASSWORD;
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Revalidation not configured' }, { status: 503 });
  }

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const paths: string[] = body.paths || CRITICAL_ROUTES;

    const results: string[] = [];
    for (const path of paths) {
      try {
        revalidatePath(path);
        results.push(`${path}: ok`);
      } catch (err: any) {
        results.push(`${path}: failed - ${err.message}`);
      }
    }

    return NextResponse.json({
      revalidated: true,
      routes: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
