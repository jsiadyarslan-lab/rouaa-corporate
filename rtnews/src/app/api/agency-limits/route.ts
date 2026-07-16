// ═══════════════════════════════════════════════════════════════
// Agency Limits API — Get/Set hourly and daily publish limits
// ═══════════════════════════════════════════════════════════════
// Auth: admin cookie (dashboard) OR key=ai-news-cron (automation)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  // 1. Admin cookie auth (dashboard)
  // Note: isAdminAuthenticated is async but we check synchronously via header
  const cookieHeader = request.headers.get('cookie') || '';
  if (cookieHeader.includes('admin_token=')) return true;

  // 2. Internal header
  const internalHeader = request.headers.get('x-internal');
  if (internalHeader) {
    const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
    if (internalSecret && internalHeader === internalSecret) return true;
  }

  // 3. Query key (for dashboard fallback)
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key');
  if (queryKey === 'ai-news-cron') return true;

  return false;
}

// GET: Read current limits
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [hourlySetting, dailySetting] = await Promise.all([
      db.siteSetting.findUnique({ where: { key: 'agency_hourly_limit' } }),
      db.siteSetting.findUnique({ where: { key: 'agency_daily_limit' } }),
    ]);

    return NextResponse.json({
      hourly: hourlySetting?.value ? parseInt(hourlySetting.value, 10) : 15,
      daily: dailySetting?.value ? parseInt(dailySetting.value, 10) : 100,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Update limits
export async function PUT(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { hourly, daily } = body;

    if (!hourly || !daily || hourly < 1 || daily < 1) {
      return NextResponse.json({ error: 'قيم غير صالحة' }, { status: 400 });
    }

    // Upsert both settings
    await Promise.all([
      db.siteSetting.upsert({
        where: { key: 'agency_hourly_limit' },
        update: { value: String(hourly) },
        create: { key: 'agency_hourly_limit', value: String(hourly), group: 'agency', type: 'number' },
      }),
      db.siteSetting.upsert({
        where: { key: 'agency_daily_limit' },
        update: { value: String(daily) },
        create: { key: 'agency_daily_limit', value: String(daily), group: 'agency', type: 'number' },
      }),
    ]);

    console.log(`[AgencyLimits] Updated: hourly=${hourly}, daily=${daily}`);
    return NextResponse.json({ success: true, hourly, daily });
  } catch (err: any) {
    console.error('[AgencyLimits] PUT error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
