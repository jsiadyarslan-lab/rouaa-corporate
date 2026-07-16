// ─── Migrate Existing News Items to Slugs ─────────────────────
// Admin/internal endpoint to generate slugs for existing news items
// Called by startup or admin to ensure ALL articles have slugs
// Uses Arabic title if available, English title as fallback

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSlug } from '@/lib/slug';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
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

    console.log('[Migrate Slugs] Starting migration...');

    // Get all news items without slugs
    const itemsWithoutSlug = await db.newsItem.findMany({
      where: { slug: null },
      select: { id: true, titleAr: true, title: true },
    });

    console.log(`[Migrate Slugs] Found ${itemsWithoutSlug.length} items without slugs`);

    let updated = 0;
    let errors = 0;

    for (const item of itemsWithoutSlug) {
      try {
        // CRITICAL: Use Arabic title if available, English title as fallback
        const slug = generateSlug(item.titleAr || item.title);
        if (!slug) continue;

        // Check for slug uniqueness
        const existing = await db.newsItem.findFirst({
          where: { slug, id: { not: item.id } },
        });
        const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

        await db.newsItem.update({
          where: { id: item.id },
          data: { slug: finalSlug },
        });

        updated++;
      } catch (err) {
        console.error(`[Migrate Slugs] Error updating ${item.id}:`, err);
        errors++;
      }
    }

    console.log(`[Migrate Slugs] Completed: ${updated} updated, ${errors} errors`);

    return NextResponse.json({
      success: true,
      updated,
      errors,
      total: itemsWithoutSlug.length,
    });
  } catch (error: any) {
    console.error('[Migrate Slugs] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
