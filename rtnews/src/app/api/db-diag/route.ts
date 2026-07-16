// ─── Database Diagnostic API V44 ──────────────────────────────────
// Detailed check of database connectivity, schema, and counts.
// V44: Added admin auth — diagnostic info should NOT be public

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTablesExist } from '@/lib/db-init';
import { isAdminAuthenticated } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // SECURITY: Require admin authentication for diagnostic info
  const isAuthorized = await isAdminAuthenticated(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const diag: any = {
    timestamp: new Date().toISOString(),
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      dbUrlType: process.env.DATABASE_URL?.includes('dummy') ? 'dummy' : 'real',
      nodeEnv: process.env.NODE_ENV,
    },
    connection: 'pending',
    tables: {},
    counts: {},
    error: null,
  };

  try {
    // 1. Basic ping
    const start = Date.now();
    await db.$queryRaw`SELECT 1`;
    diag.pingMs = Date.now() - start;
    diag.connection = 'connected';

    // 2. Ensure tables exist
    diag.tablesExist = await ensureTablesExist();

    // 3. Get counts
    if (diag.tablesExist) {
      const [newsCount, adsCount, settingsCount] = await Promise.all([
        db.newsItem.count(),
        db.advertisement.count().catch(() => -1),
        db.siteSetting.count().catch(() => -1),
      ]);
      diag.counts = {
        news: newsCount,
        ads: adsCount,
        settings: settingsCount,
      };
      
      // 4. Check ready vs total
      diag.readyNews = await db.newsItem.count({ where: { isReady: true } });
    }

    return NextResponse.json(diag);
  } catch (err: any) {
    diag.connection = 'failed';
    diag.error = err.message;
    return NextResponse.json(diag, { status: 500 });
  }
}
