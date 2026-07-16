// ─── Public API v1: News ─────────────────────────────────────
// Access news articles via API key
// Rate limited: free=100/hr, pro=1000/hr, enterprise=10000/hr

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter per API key
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(apiKey: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(apiKey);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(apiKey, { count: 1, resetAt: now + 3600000 }); // 1 hour
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

async function authenticate(request: Request): Promise<{ userId: string; plan: string; rateLimit: number } | null> {
  const authHeader = request.headers.get('authorization');
  const key = authHeader?.replace('Bearer ', '');
  if (!key || !key.startsWith('rva_')) return null;

  const apiKey = await db.apiKey.findUnique({
    where: { key, isActive: true },
    select: { userId: true, plan: true, rateLimit: true, expiresAt: true },
  });

  if (!apiKey) return null;
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) return null;

  // Update last used
  await db.apiKey.update({ where: { key }, data: { lastUsedAt: new Date() } }).catch(err => console.error('[V1News V156] Failed to update API key lastUsedAt:', err instanceof Error ? err.message : err));

  return { userId: apiKey.userId || 'anonymous', plan: apiKey.plan, rateLimit: apiKey.rateLimit };
}

// GET: List news articles
export async function GET(request: Request) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'مفتاح API غير صالح', docs: '/docs/api' }, { status: 401 });
    }

    if (!checkRateLimit(request.headers.get('authorization')!, auth.rateLimit)) {
      return NextResponse.json({ error: 'تم تجاوز حد الطلبات', retryAfter: 3600 }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const newsType = searchParams.get('type') || 'live';
    const sentiment = searchParams.get('sentiment');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const lang = searchParams.get('lang') || 'ar'; // ar | en

    const where: any = { isPublished: true, isReady: true, newsType };
    if (category) where.category = category;
    if (sentiment) where.sentiment = sentiment;

    const [items, total] = await Promise.all([
      db.newsItem.findMany({
        where,
        orderBy: { fetchedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          titleAr: true,
          summary: true,
          summaryAr: true,
          category: true,
          sentiment: true,
          sentimentScore: true,
          impactLevel: true,
          sourceName: true,
          slug: true,
          imageUrl: true,
          views: true,
          fetchedAt: true,
        },
      }),
      db.newsItem.count({ where }),
    ]);

    return NextResponse.json({
      data: items.map(item => ({
        id: item.id,
        title: lang === 'ar' ? (item.titleAr || item.title) : item.title,
        summary: lang === 'ar' ? (item.summaryAr || item.summary) : item.summary,
        category: item.category,
        sentiment: item.sentiment,
        sentimentScore: item.sentimentScore,
        impactLevel: item.impactLevel,
        sourceName: item.sourceName,
        slug: item.slug,
        imageUrl: item.imageUrl,
        views: item.views,
        fetchedAt: item.fetchedAt,
      })),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        plan: auth.plan,
      },
    });
  } catch (error: any) {
    console.error('[API v1 News] Error:', error.message);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
