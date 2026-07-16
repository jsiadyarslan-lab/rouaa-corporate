// ─── Infographics List API ─────────────────────────────────
// GET /api/infographics — List all infographics (public + admin)
// POST /api/infographics — Alias for generate (backward compat)
// PERF V2: Added in-memory cache (60s TTL) + parallelized DB queries

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── In-Memory Cache ───────────────────────────────────────────
interface CacheEntry<T> { data: T; expiresAt: number }
const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 60 * 1000; // 60 seconds

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data as T;
}
function setCache<T>(key: string, data: T, ttl = CACHE_TTL): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
  if (cache.size > 50) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const published = searchParams.get('published');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    // V-LOCALE: Filter by locale to prevent Arabic/English mixing
    const locale = searchParams.get('locale') || 'ar';

    // Check cache
    const cacheKey = `infographics:${locale}:${category || ''}:${published || ''}:${limit}:${offset}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const where: any = { locale };
    if (category) where.category = category;
    if (published === 'true') where.isPublished = true;
    if (published === 'false') where.isPublished = false;

    // PERF: Parallelize findMany + count (was sequential)
    const [infographics, total] = await Promise.all([
      db.infographic.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          sourceType: true,
          sourceId: true,
          sourceTitle: true,
          category: true,
          thumbnailUrl: true,
          impactScore: true,
          viewCount: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
          slides: true,
        },
      }),
      db.infographic.count({ where }),
    ]);

    const result = { infographics, total, limit, offset };
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Infographics] List error:', error.message);
    return NextResponse.json({ error: 'فشل تحميل الإنفوغرافيك' }, { status: 500 });
  }
}
