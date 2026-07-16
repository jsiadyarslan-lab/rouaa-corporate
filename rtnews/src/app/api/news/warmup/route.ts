// ─── News Cache Warmup Endpoint V48 ──────────────────────────────
// Triggers background refresh of live and breaking news caches.
// ⚠️ Requires admin authentication
// V48: Uses shared verifyAdminToken from auth-utils (fixes JWT secret inconsistency)
// Returns immediately — does NOT wait for fetches to complete.

import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

async function verifyAdmin(request: Request): Promise<boolean> {
  const token = (request as any).cookies?.get?.('admin_token')?.value;
  if (!token) return false;
  try {
    return await verifyAdminToken(token);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // Require admin auth
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'غير مصرح — سجّل الدخول أولاً' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Trigger the actual API route caches to load in the background
    const baseUrl = process.env.RAILWAY_STATIC_URL
      ? `https://${process.env.RAILWAY_STATIC_URL}`
      : process.env.PORT
        ? `http://localhost:${process.env.PORT}`
        : 'http://localhost:3000';

    // Fire and forget — don't wait for these
    fetch(`${baseUrl}/api/news/live`, { signal: AbortSignal.timeout(5000) }).catch(err => console.error('[Warmup V156] Failed to warmup live news cache:', err instanceof Error ? err.message : err));
    fetch(`${baseUrl}/api/news/breaking`, { signal: AbortSignal.timeout(5000) }).catch(err => console.error('[Warmup V156] Failed to warmup breaking news cache:', err instanceof Error ? err.message : err));

    const duration = Date.now() - startTime;
    console.log(`[Warmup] Triggered in ${duration}ms`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      message: 'Background refresh triggered',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Warmup] Failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      duration: `${Date.now() - startTime}ms`,
    }, { status: 500 });
  }
}

// Also support GET for easy browser testing (requires auth)
export async function GET(request: Request) {
  return POST(request);
}
