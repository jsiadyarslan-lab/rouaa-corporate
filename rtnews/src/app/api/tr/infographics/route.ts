// ─── Turkish Infographics API Route V2 ─────────────────────────
// GET /api/tr/infographics — List Turkish infographics (public + admin)
// V2: Added 'published' query parameter support (matches Arabic API pattern)
//   - No published param → show ALL (for dashboard)
//   - published=true → only published (for public pages)
//   - published=false → only drafts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const published = searchParams.get('published');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      return NextResponse.json({ infographics: [], total: 0, limit, offset });
    }

    const where: any = {
      locale: 'tr',
    };
    if (category) where.category = category;
    if (published === 'true') where.isPublished = true;
    if (published === 'false') where.isPublished = false;

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

    return NextResponse.json({ infographics, total, limit, offset });
  } catch (error: any) {
    console.error('[TR Infographics API V2] Hata:', error.message);
    return NextResponse.json(
      { error: 'Türk infografikleri yüklenemedi', detail: error.message },
      { status: 500 }
    );
  }
}
