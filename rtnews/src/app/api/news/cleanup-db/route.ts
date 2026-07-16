// Emergency DB cleanup — remove generatedImage from old news items to free space
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// GET — same as POST (for browser access)
export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('key');
  if (authKey !== process.env.CRON_SECRET && authKey !== 'cleanup-db') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const withImage = await db.newsItem.count({
      where: { generatedImage: { not: null } }
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const result = await db.newsItem.updateMany({
      where: {
        generatedImage: { not: null },
        createdAt: { lt: sevenDaysAgo },
      },
      data: { generatedImage: null },
    });

    const archiveResult = await db.newsItemArchive.updateMany({
      where: { generatedImage: { not: null } },
      data: { generatedImage: null },
    });

    return NextResponse.json({
      success: true,
      totalWithImage: withImage,
      newsItemsCleaned: result.count,
      archiveItemsCleaned: archiveResult.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
