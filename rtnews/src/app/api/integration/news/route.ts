// ─── Integration: News Feed for Trading Platform V3 ─────────
// Provides latest Arabic financial news to the trading platform.
// Public API route — server-side fetches from DB, no auth from browser needed.
//
// V3: Unified auth with rate limiting + persistent cache layer.
//
// GET /api/integration/news?limit=20&category=كريبتو&symbol=BTC

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateIntegrationRequest } from '@/lib/integration-auth';
import { getSyncCache, CacheKeys, CacheTTL } from '@/lib/integration-cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // V3: Unified auth — allows public access with rate limiting
  const { rateLimited, rateLimitResult } = authenticateIntegrationRequest(request, 'news');
  if (rateLimited) {
    return NextResponse.json(
      { error: 'تم تجاوز حد الطلبات. حاول لاحقاً.', retryAfterMs: rateLimitResult?.retryAfterMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult?.retryAfterMs || 60000) / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const category = searchParams.get('category');
  const symbol = searchParams.get('symbol');

  const cacheKey = CacheKeys.news(`${limit}-${category}-${symbol}`);
  const cache = getSyncCache();

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  }

  try {
    const where: any = { isPublished: true };

    if (category) {
      where.category = category;
    }

    if (symbol) {
      // Search in title and content for the symbol
      where.OR = [
        { title: { contains: symbol, mode: 'insensitive' } },
        { summary: { contains: symbol, mode: 'insensitive' } },
      ];
    }

    const articles = await db.newsItem.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        titleAr: true,
        summary: true,
        summaryAr: true,
        content: true,
        contentAr: true,
        category: true,
        source: true,
        sourceName: true,
        url: true,
        imageUrl: true,
        publishedAt: true,
        sentiment: true,
        sentimentScore: true,
        impactLevel: true,
        impactScore: true,
        affectedAssets: true,
        newsType: true,
        aiAnalysis: true,
        slug: true,
      },
    });

    // Map articles to include Arabic fields prominently for the trading platform
    const mappedArticles = articles.map((a) => {
      // Parse aiAnalysis if available for structured data
      let parsedAnalysis: any = null;
      if (a.aiAnalysis) {
        try { parsedAnalysis = JSON.parse(a.aiAnalysis); } catch { parsedAnalysis = null; }
      }

      return {
        id: a.id,
        // Arabic-first: trading platform should prefer Arabic
        title: a.title,
        titleAr: a.titleAr || '',
        summary: a.summary,
        summaryAr: a.summaryAr || '',
        content: a.content || '',
        contentAr: a.contentAr || '',
        category: a.category,
        source: a.sourceName || a.source,
        url: a.url,
        imageUrl: `/api/article-image/${a.id}`,
        publishedAt: a.publishedAt,
        sentiment: a.sentiment,
        sentimentScore: a.sentimentScore,
        impactLevel: a.impactLevel,
        impactScore: a.impactScore,
        affectedAssets: a.affectedAssets,
        newsType: a.newsType,
        // Structured AI analysis for trading insights
        keyTakeaways: parsedAnalysis?.keyTakeaways || [],
        fullContent: parsedAnalysis?.fullContent || '',
        slug: a.slug,
      };
    });

    const data = {
      articles: mappedArticles,
      count: mappedArticles.length,
      source: 'roua-news',
      timestamp: new Date().toISOString(),
    };

    await cache.set(cacheKey, data, CacheTTL.NEWS);

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error: any) {
    console.error('[Integration News] Failed:', error?.message);
    return NextResponse.json(
      { articles: [], count: 0, error: error?.message },
      { status: 500 }
    );
  }
}
