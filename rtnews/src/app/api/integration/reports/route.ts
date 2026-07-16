// ─── Integration: Reports Feed for Trading Platform V3 ──────
// Provides published economic reports and market analyses
// to the trading platform for display in its UI.
//
// V3: Unified auth with rate limiting + persistent cache layer.
//
// GET /api/integration/reports?limit=10&type=economic_report
// GET /api/integration/reports?limit=10&type=market_analysis
// GET /api/integration/reports?limit=10 (all types)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateIntegrationRequest } from '@/lib/integration-auth';
import { getSyncCache, CacheKeys, CacheTTL } from '@/lib/integration-cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // V3: Unified auth — allows public access with rate limiting
  const { rateLimited, rateLimitResult } = authenticateIntegrationRequest(request, 'reports');
  if (rateLimited) {
    return NextResponse.json(
      { error: 'تم تجاوز حد الطلبات. حاول لاحقاً.', retryAfterMs: rateLimitResult?.retryAfterMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult?.retryAfterMs || 60000) / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);
  const type = searchParams.get('type'); // economic_report | market_analysis | undefined (all)

  const cacheKey = CacheKeys.reports(`${limit}-${type}`);
  const cache = getSyncCache();

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'Cache-Control': 'public, max-age=120' },
    });
  }

  try {
    const reports: any[] = [];

    // Fetch Economic Reports
    if (!type || type === 'economic_report') {
      const economicReports = await db.economicReport.findMany({
        where: { isPublished: true, locale: searchParams.get('locale') || 'ar' },  // V337: locale-aware
        orderBy: { publishedAt: 'desc' },
        take: type ? limit : Math.ceil(limit / 2),
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          reportType: true,
          scope: true,
          sectors: true,
          countries: true,
          keyIndicators: true,
          marketImpact: true,
          confidenceScore: true,
          imageUrl: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
        },
      });

      for (const r of economicReports) {
        reports.push({
          id: r.id,
          titleAr: r.title,
          slug: r.slug,
          category: r.reportType,
          scope: r.scope,
          sectors: safeJsonParse(r.sectors, []),
          countries: safeJsonParse(r.countries, []),
          keyIndicators: safeJsonParse(r.keyIndicators, {}),
          marketImpact: r.marketImpact,
          confidenceScore: r.confidenceScore,
          imageUrl: r.imageUrl,
          publishedAt: r.publishedAt?.toISOString() || r.createdAt.toISOString(),
          type: 'economic_report',
        });
      }
    }

    // Fetch Market Analyses
    if (!type || type === 'market_analysis') {
      const marketAnalyses = await db.marketAnalysis.findMany({
        where: { isPublished: true, locale: searchParams.get('locale') || 'ar' },  // V337: locale-aware
        orderBy: { publishedAt: 'desc' },
        take: type ? limit : Math.ceil(limit / 2),
        select: {
          id: true,
          title: true,
          slug: true,
          assetClass: true,
          analysisType: true,
          timeFrame: true,
          indicators: true,
          priceTarget: true,
          riskLevel: true,
          sentiment: true,
          confidenceScore: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
        },
      });

      for (const a of marketAnalyses) {
        reports.push({
          id: a.id,
          titleAr: a.title,
          slug: a.slug,
          category: a.assetClass,
          analysisType: a.analysisType,
          timeFrame: a.timeFrame,
          indicators: safeJsonParse(a.indicators, {}),
          priceTarget: safeJsonParse(a.priceTarget, {}),
          riskLevel: a.riskLevel,
          sentiment: a.sentiment,
          confidenceScore: a.confidenceScore,
          publishedAt: a.publishedAt?.toISOString() || a.createdAt.toISOString(),
          type: 'market_analysis',
        });
      }
    }

    // Sort all reports by publishedAt descending and limit
    reports.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const limitedReports = reports.slice(0, limit);

    const data = {
      reports: limitedReports,
      count: limitedReports.length,
      source: 'roua-news',
      timestamp: new Date().toISOString(),
    };

    await cache.set(cacheKey, data, CacheTTL.REPORTS);

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=120' },
    });
  } catch (error: any) {
    console.error('[Integration Reports] Failed:', error?.message);
    return NextResponse.json(
      { reports: [], count: 0, error: error?.message },
      { status: 500 }
    );
  }
}

function safeJsonParse(jsonStr: string, fallback: any): any {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return fallback;
  }
}
