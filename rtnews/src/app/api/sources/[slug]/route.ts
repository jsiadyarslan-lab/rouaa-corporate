// GET /api/sources/[slug] — Source detail + recent documents
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const source = await db.officialSource.findUnique({
      where: { slug },
      include: {
        documents: {
          where: { isLatest: true },
          orderBy: { fetchedAt: 'desc' },
          take: 20,
          select: {
            id: true, url: true, documentType: true, title: true,
            hash: true, version: true, publishedAt: true, fetchedAt: true,
            contentLength: true, httpStatus: true,
          },
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json({ source });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
