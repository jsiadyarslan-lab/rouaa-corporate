// Nuclear cleanup — null ALL generatedImage without any SELECT queries
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('key');
  if (authKey !== 'nuclear-cleanup-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result1 = await db.newsItem.updateMany({
      where: { generatedImage: { not: null } },
      data: { generatedImage: null },
    });

    const result2 = await db.newsItemArchive.updateMany({
      where: { generatedImage: { not: null } },
      data: { generatedImage: null },
    });

    return NextResponse.json({
      success: true,
      newsItemsCleaned: result1.count,
      archiveItemsCleaned: result2.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
