// ─── Public API v1: Markets ──────────────────────────────────
// Market data via API key

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function authenticate(request: Request): Promise<{ plan: string; rateLimit: number } | null> {
  const authHeader = request.headers.get('authorization');
  const key = authHeader?.replace('Bearer ', '');
  if (!key || !key.startsWith('rva_')) return null;

  const apiKey = await db.apiKey.findUnique({
    where: { key, isActive: true },
    select: { plan: true, rateLimit: true, expiresAt: true },
  });

  if (!apiKey) return null;
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) return null;

  return { plan: apiKey.plan, rateLimit: apiKey.rateLimit };
}

// GET: Market data (proxies to existing markets API)
export async function GET(request: Request) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'مفتاح API غير صالح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'forex'; // forex | arab | sentiment | earnings

    // Build internal URL based on type
    const internalUrls: Record<string, string> = {
      forex: '/api/markets/prices',
      arab: '/api/markets/arab',
      sentiment: '/api/markets/sentiment',
      earnings: '/api/markets/earnings',
      centralBanks: '/api/markets/central-banks',
    };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}${internalUrls[type] || internalUrls.forex}`;

    const res = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();

    return NextResponse.json({
      data,
      meta: { type, plan: auth.plan },
    });
  } catch (error: any) {
    console.error('[API v1 Markets] Error:', error.message);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
