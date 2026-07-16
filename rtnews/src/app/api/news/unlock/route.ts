// ─── Lock Clearing Endpoint ─────────────────────────────────
// PUBLIC endpoint - NO authentication required.
// Clears stuck DB locks (bootstrap-lock and cron:news:lock) from SiteSetting table.
// Used to fix stuck states where bootstrap/cron can't run because locks are held.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: { key: string; cleared: boolean }[] = [];
  const lockKeys = ['bootstrap-lock', 'cron:news:lock'];

  for (const key of lockKeys) {
    try {
      const existing = await db.siteSetting.findUnique({ where: { key } });
      if (existing) {
        await db.siteSetting.delete({ where: { key } });
        results.push({ key, cleared: true });
      } else {
        results.push({ key, cleared: false });
      }
    } catch (err: any) {
      results.push({ key, cleared: false });
    }
  }

  const anyCleared = results.some(r => r.cleared);

  return NextResponse.json({
    success: true,
    message: anyCleared ? 'Locks cleared successfully' : 'No stuck locks found',
    locks: results,
    timestamp: new Date().toISOString(),
  });
}

export async function POST() {
  return GET();
}
