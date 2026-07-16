// ─── News by Category API Route ────────────────────────────────
// GET /api/news/by-category?category=forex&limit=6
// Returns news items grouped by our unified category ID.
// Maps the category ID to one or more DB categories for flexible matching.

import { NextRequest, NextResponse } from 'next/server';
import { getNewsFromDB } from '@/lib/news-sources';
import { NEWS_CATEGORIES, getNewsCategoryId } from '@/lib/news-categories';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const categoryId = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '6', 10);
    const maxAge = searchParams.get('maxAge') ? parseInt(searchParams.get('maxAge')!, 10) : undefined;

    if (!categoryId) {
      return NextResponse.json({ error: 'category parameter is required' }, { status: 400 });
    }

    // Find the category definition by ID
    const catDef = NEWS_CATEGORIES.find(c => c.id === categoryId);
    if (!catDef) {
      return NextResponse.json({ error: `Unknown category: ${categoryId}` }, { status: 400 });
    }

    // Fetch news for each DB category that maps to this unified category
    // Then merge and deduplicate
    const allItems: any[] = [];
    const seenIds = new Set<string>();

    for (const dbCat of catDef.dbCategories) {
      try {
        // FIX: Always filter locale='ar' — this is the Arabic news API.
        // Without this filter, English articles leak into Arabic category pages.
        const result = await getNewsFromDB({
          category: dbCat,
          limit: limit + 5, // Fetch a few extra to account for deduplication
          maxAge,
          locale: 'ar',
        });
        for (const item of result.items) {
          if (!seenIds.has(item.id || item.url)) {
            seenIds.add(item.id || item.url);
            allItems.push(item);
          }
        }
      } catch (err) {
        console.warn(`[NewsByCategory] Failed to fetch for "${dbCat}":`, err);
      }
    }

    // Sort by date (newest first) and limit
    allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const items = allItems.slice(0, limit);

    return NextResponse.json({
      category: catDef,
      items,
      total: items.length,
    });
  } catch (err: any) {
    console.error('[NewsByCategory] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
