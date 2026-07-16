import { NextResponse } from 'next/server';
import { db, safeDBQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── In-Memory Cache for DB-only route ────────────────────────
// Market analyses rarely change between page loads.
// Cache for 60 seconds to avoid repeated DB hits from the homepage.
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
  // Evict expired entries periodically
  if (cache.size > 50) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
}

// GET /api/market-analyses — List market analyses
// Query params: assetClass, analysisType, timeFrame, riskLevel, sentiment, page, limit
// V241: Added includeUnpublished param for admin dashboard use
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetClass = searchParams.get('assetClass');
    const analysisType = searchParams.get('analysisType');
    const timeFrame = searchParams.get('timeFrame');
    const riskLevel = searchParams.get('riskLevel');
    const sentiment = searchParams.get('sentiment');
    const includeUnpublished = searchParams.get('includeUnpublished') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    // V-LOCALE: Filter by locale to prevent Arabic/English mixing
    const locale = searchParams.get('locale') || 'ar';

    // Build cache key from query params
    const cacheKey = `analyses:${locale}:${assetClass || ''}:${analysisType || ''}:${timeFrame || ''}:${riskLevel || ''}:${sentiment || ''}:${includeUnpublished}:${page}:${limit}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    // V241: Only filter by isPublished when not including unpublished (admin dashboard)
    const where: any = includeUnpublished ? { locale } : { isPublished: true, locale };
    if (assetClass) where.assetClass = assetClass;
    if (analysisType) where.analysisType = analysisType;
    if (timeFrame) where.timeFrame = timeFrame;
    if (riskLevel) where.riskLevel = riskLevel;
    if (sentiment) where.sentiment = sentiment;

    const [analyses, total] = await Promise.all([
      safeDBQuery(
        () => db.marketAnalysis.findMany({
          where,
          select: {
            id: true, title: true, slug: true, assetClass: true,
            analysisType: true, timeFrame: true, riskLevel: true,
            sentiment: true, confidenceScore: true, priceTarget: true,
            publishedAt: true, validUntil: true, createdAt: true,
          },
          orderBy: includeUnpublished ? { createdAt: 'desc' } : { publishedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        'market-analyses-findMany'
      ),
      safeDBQuery(
        () => db.marketAnalysis.count({ where }),
        'market-analyses-count'
      ),
    ]);

    const result = {
      analyses: (analyses || []).map(a => {
        let priceTarget = a.priceTarget;
        try { priceTarget = JSON.parse(a.priceTarget); } catch { /* keep original */ }
        return { ...a, priceTarget };
      }),
      pagination: { page, limit, total: total || 0, pages: Math.ceil((total || 0) / limit) },
    };

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[MarketAnalyses API]', error);
    return NextResponse.json({ error: 'فشل في تحميل التحليلات' }, { status: 500 });
  }
}
