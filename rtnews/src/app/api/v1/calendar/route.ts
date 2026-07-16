// ─── Public API v1: Calendar ─────────────────────────────────
// Economic calendar events via API key

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function authenticate(request: Request): Promise<{ plan: string } | null> {
  const authHeader = request.headers.get('authorization');
  const key = authHeader?.replace('Bearer ', '');
  if (!key || !key.startsWith('rva_')) return null;

  const apiKey = await db.apiKey.findUnique({
    where: { key, isActive: true },
    select: { plan: true, expiresAt: true },
  });

  if (!apiKey) return null;
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) return null;

  return { plan: apiKey.plan };
}

// GET: Economic calendar events
export async function GET(request: Request) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'مفتاح API غير صالح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const where: any = {
      eventDate: { gte: startDate, lte: endDate },
    };
    if (country) where.country = country;

    const events = await db.calendarEvent.findMany({
      where,
      orderBy: { eventDate: 'asc' },
      take: 100,
    });

    return NextResponse.json({
      data: events,
      meta: { days, plan: auth.plan },
    });
  } catch (error: any) {
    console.error('[API v1 Calendar] Error:', error.message);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
