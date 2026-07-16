// ─── Run Database Migration ─────────────────────────────────
// Admin/internal endpoint to add missing columns to the database.
// Called during deployment to ensure the schema is up to date.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // V47: Auth — require ADMIN_SECRET or INTERNAL_SECRET, no hardcoded fallbacks
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  const internalSecret = process.env.INTERNAL_SECRET || adminSecret;
  const internalHeader = request.headers.get('x-internal');
  const isAdmin = adminSecret ? authHeader === `Bearer ${adminSecret}` : false;
  const isInternal = internalSecret ? internalHeader === internalSecret : false;
  if (!isAdmin && !isInternal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: any = { timestamp: new Date().toISOString(), migrations: [] };

  try {
    // Check if generatedImage column exists
    const columnCheck = await db.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'news_items' AND column_name = 'generatedImage'
    ` as any[];

    if (columnCheck.length === 0) {
      // Add the missing generatedImage column
      await db.$executeRawUnsafe(`
        ALTER TABLE "news_items" ADD COLUMN "generatedImage" TEXT
      `);
      results.migrations.push({
        name: 'add_generatedImage_column',
        status: 'applied',
        detail: 'Added generatedImage TEXT column to news_items table',
      });
    } else {
      results.migrations.push({
        name: 'add_generatedImage_column',
        status: 'already_exists',
        detail: 'generatedImage column already exists',
      });
    }

    // Also check for any other potentially missing columns
    const expectedColumns = [
      { name: 'generatedImage', type: 'TEXT' },
      { name: 'slug', type: 'TEXT' },
      { name: 'contentAr', type: 'TEXT' },
      { name: 'isReady', type: 'BOOLEAN DEFAULT false' },
      { name: 'views', type: 'INTEGER DEFAULT 0' },
      { name: 'sourceName', type: 'TEXT DEFAULT \'\'' },
      { name: 'originalLanguage', type: 'TEXT DEFAULT \'en\'' },
    ];

    for (const col of expectedColumns) {
      const exists = await db.$queryRaw`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'news_items' AND column_name = ${col.name}
      ` as any[];

      if (exists.length === 0) {
        try {
          // Use Prisma's executeRaw with proper parameterization for the column name
          // Column names can't be parameterized in ALTER TABLE, but we validate against
          // a hardcoded whitelist above (expectedColumns), so injection is impossible
          await db.$executeRawUnsafe(`
            ALTER TABLE "news_items" ADD COLUMN "${col.name}" ${col.type}
          `);
          results.migrations.push({
            name: `add_${col.name}_column`,
            status: 'applied',
            detail: `Added ${col.name} ${col.type} column to news_items table`,
          });
        } catch (err: any) {
          results.migrations.push({
            name: `add_${col.name}_column`,
            status: 'error',
            detail: err.message,
          });
        }
      }
    }

    // Also create slug unique index if it doesn't exist
    try {
      const indexCheck = await db.$queryRaw`
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'news_items' AND indexname LIKE '%slug%'
      ` as any[];

      if (indexCheck.length === 0) {
        await db.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS "news_items_slug_key" ON "news_items"("slug")
        `);
        results.migrations.push({
          name: 'add_slug_unique_index',
          status: 'applied',
        });
      } else {
        results.migrations.push({
          name: 'add_slug_unique_index',
          status: 'already_exists',
        });
      }
    } catch (err: any) {
      results.migrations.push({
        name: 'add_slug_unique_index',
        status: 'error_or_exists',
        detail: err.message,
      });
    }

    // V26: Add style column to video_reports table (pulse | dataviz)
    try {
      const styleColumnCheck = await db.$queryRaw`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'video_reports' AND column_name = 'style'
      ` as any[];

      if (styleColumnCheck.length === 0) {
        await db.$executeRawUnsafe(`
          ALTER TABLE "video_reports" ADD COLUMN "style" TEXT NOT NULL DEFAULT 'pulse'
        `);
        results.migrations.push({
          name: 'add_style_column_video_reports',
          status: 'applied',
          detail: 'Added style TEXT column to video_reports table (pulse | dataviz)',
        });
      } else {
        results.migrations.push({
          name: 'add_style_column_video_reports',
          status: 'already_exists',
          detail: 'style column already exists in video_reports',
        });
      }
    } catch (err: any) {
      results.migrations.push({
        name: 'add_style_column_video_reports',
        status: 'error',
        detail: err.message,
      });
    }

  } catch (err: any) {
    results.error = err.message;
    results.stack = err.stack?.slice(0, 500);
  }

  return NextResponse.json(results);
}

export async function GET(request: Request) {
  return POST(request);
}
