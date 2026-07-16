// Migrate generatedImage from base64 in DB → R2 storage
// Processes 50 items at a time to avoid DB timeout
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadImageToR2 } from '@/lib/image-storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// GET — same as POST (for browser access)
export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('key');
  if (authKey !== process.env.CRON_SECRET && authKey !== 'migrate-images') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const items = await db.newsItem.findMany({
      where: {
        generatedImage: { not: null },
        NOT: { generatedImage: { startsWith: 'http' } },
      },
      select: { id: true, generatedImage: true },
      take: 50,
    });

    let migrated = 0;
    let nullified = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const base64Data = item.generatedImage!;
        if (!base64Data.startsWith('/9j/') && !base64Data.startsWith('iVBOR')) {
          await db.newsItem.update({ where: { id: item.id }, data: { generatedImage: null } });
          nullified++;
          continue;
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const mimeType = base64Data.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
        const filename = `news-images/${item.id}`;

        const result = await uploadImageToR2(filename, buffer, mimeType);
        
        if (result.success && result.url) {
          await db.newsItem.update({
            where: { id: item.id },
            data: { generatedImage: result.url },
          });
          migrated++;
        } else {
          await db.newsItem.update({ where: { id: item.id }, data: { generatedImage: null } });
          nullified++;
        }
      } catch (err: any) {
        try {
          await db.newsItem.update({ where: { id: item.id }, data: { generatedImage: null } });
          nullified++;
        } catch {}
        failed++;
      }
    }

    // Also clean NewsItemArchive
    const archiveItems = await db.newsItemArchive.findMany({
      where: {
        generatedImage: { not: null },
        NOT: { generatedImage: { startsWith: 'http' } },
      },
      select: { id: true, generatedImage: true },
      take: 50,
    });

    let archiveNullified = 0;
    for (const item of archiveItems) {
      try {
        await db.newsItemArchive.update({ where: { id: item.id }, data: { generatedImage: null } });
        archiveNullified++;
      } catch {}
    }

    const remaining = await db.newsItem.count({
      where: {
        generatedImage: { not: null },
        NOT: { generatedImage: { startsWith: 'http' } },
      },
    });

    return NextResponse.json({
      success: true,
      processed: items.length,
      migrated,
      nullified,
      failed,
      archiveNullified,
      remaining,
      message: remaining > 0 ? `${remaining} items still need migration. Run again.` : 'All done!'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
