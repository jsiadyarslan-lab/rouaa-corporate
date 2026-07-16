import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic'; // Uses request.url/searchParams — must be dynamic

// GET /api/geopolitical-risks/[slug] — Get single risk by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'ar';

    // Strategy 1: Exact match on slug + locale
    let risk = await db.geopoliticalRisk.findUnique({
      where: {
        slug_locale: { slug, locale },
      },
    });

    // Strategy 2: Try slug without locale constraint (any locale)
    if (!risk) {
      risk = await db.geopoliticalRisk.findFirst({
        where: { slug, isPublished: true },
        orderBy: [
          { locale: 'asc' }, // Prefer 'ar' (alphabetically first among our locales)
          { publishedAt: 'desc' },
        ],
      });
    }

    // Strategy 3: URL-decode the slug and retry
    if (!risk) {
      const decodedSlug = decodeURIComponent(slug);
      if (decodedSlug !== slug) {
        risk = await db.geopoliticalRisk.findUnique({
          where: {
            slug_locale: { slug: decodedSlug, locale },
          },
        });

        if (!risk) {
          risk = await db.geopoliticalRisk.findFirst({
            where: { slug: decodedSlug, isPublished: true },
            orderBy: [
              { locale: 'asc' },
              { publishedAt: 'desc' },
            ],
          });
        }
      }
    }

    // Strategy 4: Case-insensitive search on slug
    if (!risk) {
      risk = await db.geopoliticalRisk.findFirst({
        where: {
          slug: { equals: slug, mode: 'insensitive' },
          isPublished: true,
        },
        orderBy: { publishedAt: 'desc' },
      });
    }

    if (!risk) {
      return NextResponse.json(
        { error: 'Geopolitical risk not found', slug },
        { status: 404 }
      );
    }

    // Parse JSON string fields
    const parsedRisk = {
      ...risk,
      affectedRegions: safeJsonParse(risk.affectedRegions as any),
      affectedCountries: safeJsonParse(risk.affectedCountries as any),
      affectedAssets: safeJsonParse(risk.affectedAssets as any),
      scenarios: risk.scenarios ? safeJsonParse(risk.scenarios as any) : null,
      tradeRoutes: risk.tradeRoutes ? safeJsonParse(risk.tradeRoutes as any) : null,
      sourceUrls: safeJsonParse(risk.sourceUrls as any),
    };

    return NextResponse.json({ data: parsedRisk });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GeopoliticalRisks] GET /[slug] error:', message);
    return NextResponse.json(
      { error: 'Failed to fetch geopolitical risk', details: message },
      { status: 500 }
    );
  }
}

/** Safely parse a JSON string, returning the original string on failure. */
function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
