import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/economic-reports/[id] — Single report by ID or slug
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const report = await db.economicReport.findFirst({
      where: {
        isPublished: true,
        OR: [{ id }, { slug: id }],
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });
    }

    // Parse JSON fields
    const parsed = {
      ...report,
      sectors: JSON.parse(report.sectors),
      countries: JSON.parse(report.countries),
      keyIndicators: JSON.parse(report.keyIndicators),
      sourceUrls: JSON.parse(report.sourceUrls),
    };

    // Get related reports (same scope or type)
    // V92: Fetch more then filter by title similarity
    const allRelated = await db.economicReport.findMany({
      where: {
        isPublished: true,
        id: { not: report.id },
        OR: [{ scope: report.scope }, { reportType: report.reportType }],
      },
      select: {
        id: true, title: true, slug: true, reportType: true,
        marketImpact: true, confidenceScore: true, publishedAt: true,
      },
      take: 10,
      orderBy: { publishedAt: 'desc' },
    });

    // V92: Title-similarity deduplication
    const normalizeTitle = (t: string): string => {
      return t.trim()
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 30);
    };
    const seenTitles = new Set<string>();
    seenTitles.add(normalizeTitle(report.title));
    const related = allRelated.filter(r => {
      const norm = normalizeTitle(r.title);
      for (const seen of seenTitles) {
        if (norm === seen) return false;
        const normWords = new Set(norm.split(' ').filter(w => w.length > 2));
        const seenWords = new Set(seen.split(' ').filter(w => w.length > 2));
        if (normWords.size > 0 && seenWords.size > 0) {
          const intersection = new Set([...normWords].filter(w => seenWords.has(w)));
          const overlapRatio = intersection.size / Math.min(normWords.size, seenWords.size);
          if (overlapRatio >= 0.7) return false;
        }
      }
      seenTitles.add(norm);
      return true;
    }).slice(0, 4);

    return NextResponse.json({ report: parsed, related });
  } catch (error: any) {
    console.error('[EconomicReport Detail API]', error);
    return NextResponse.json({ error: 'فشل في تحميل التقرير' }, { status: 500 });
  }
}
