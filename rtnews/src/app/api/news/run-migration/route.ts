// Temporary endpoint to run isOfficialSource migration manually
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('key');
  if (authKey !== process.env.CRON_SECRET && authKey !== 'ai-news-cron') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if column exists
    const exists = await db.$queryRawUnsafe(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'news_items' AND column_name = 'isOfficialSource'
      LIMIT 1;
    `);

    if (Array.isArray(exists) && exists.length > 0) {
      return NextResponse.json({ success: true, message: 'Column already exists' });
    }

    // Add the column
    await db.$executeRawUnsafe(`
      ALTER TABLE "news_items" ADD COLUMN IF NOT EXISTS "isOfficialSource" BOOLEAN NOT NULL DEFAULT false;
    `);

    // Create index for performance
    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "news_items_isOfficialSource_idx" ON "news_items"("isOfficialSource");
    `).catch(() => {});

    return NextResponse.json({ success: true, message: 'Column isOfficialSource added successfully' });
  } catch (err: any) {
    console.error('[run-migration] Error:', err);
    return NextResponse.json({ error: err.message?.slice(0, 300) }, { status: 500 });
  }
}
