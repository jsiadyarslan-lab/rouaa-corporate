// ─── Turkish Single Report API Route ────────────────────────
// GET /api/tr/reports/[slug] — Single Turkish report by slug
// Filters by locale='tr', isPublished=true

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || slug === 'undefined' || slug === 'null') {
      return NextResponse.json({ error: 'Slug gereklidir' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      return NextResponse.json({ error: 'Rapor bulunamadı' }, { status: 404 });
    }

    let report = await db.economicReport.findFirst({
      where: { locale: 'tr', isPublished: true, slug },
    });

    if (!report) {
      report = await db.economicReport.findFirst({
        where: { locale: 'tr', isPublished: true, id: slug },
      });
    }

    if (!report) {
      const analysis = await db.marketAnalysis.findFirst({
        where: { locale: 'tr', isPublished: true, OR: [{ slug }, { id: slug }] },
      });

      if (analysis) {
        const safeParse = (str: string, fallback: any = []) => {
          try { return JSON.parse(str); } catch { return fallback; }
        };

        return NextResponse.json({
          id: analysis.id, slug: analysis.slug, title: analysis.title,
          reportType: 'analysis', content: analysis.content, summary: '',
          scope: analysis.assetClass, sentiment: analysis.sentiment,
          confidenceScore: analysis.confidenceScore, riskLevel: analysis.riskLevel,
          priceTarget: safeParse(analysis.priceTarget, {}),
          indicators: safeParse(analysis.indicators, {}),
          timeFrame: analysis.timeFrame,
          publishedAt: analysis.publishedAt?.toISOString() || null,
          createdAt: analysis.createdAt?.toISOString(), isAnalysis: true,
        });
      }
    }

    if (!report) {
      return NextResponse.json({ error: 'Rapor bulunamadı' }, { status: 404 });
    }

    const safeParse = (str: string, fallback: any = []) => {
      try { return JSON.parse(str); } catch { return fallback; }
    };

    return NextResponse.json({
      id: report.id, slug: report.slug, title: report.title,
      reportType: report.reportType, content: report.content, summary: report.summary,
      scope: report.scope, marketImpact: report.marketImpact,
      confidenceScore: report.confidenceScore,
      sectors: safeParse(report.sectors, []), countries: safeParse(report.countries, []),
      keyIndicators: safeParse(report.keyIndicators, {}),
      imageUrl: report.imageUrl,
      publishedAt: report.publishedAt?.toISOString() || null,
      createdAt: report.createdAt?.toISOString(), isAnalysis: false,
    });
  } catch (error: any) {
    console.error('[TR Report Slug API] Error:', error.message);
    return NextResponse.json(
      { error: 'Rapor yüklenemedi', detail: error.message },
      { status: 500 }
    );
  }
}
