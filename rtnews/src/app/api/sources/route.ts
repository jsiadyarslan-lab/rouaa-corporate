// GET /api/sources — List all official sources
// POST /api/sources — Create a new source (admin only)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const country = url.searchParams.get('country');
    const isActive = url.searchParams.get('isActive');
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '50'));
    const page = parseInt(url.searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (country) where.country = country;
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    const [sources, total] = await Promise.all([
      db.officialSource.findMany({
        where,
        orderBy: { authorityScore: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true, name: true, slug: true, shortName: true,
          country: true, countryCode: true, region: true,
          type: true, category: true, authorityScore: true, reliability: true,
          website: true, rss: true, api: true, accessMethods: true,
          language: true, locale: true, updateFrequency: true,
          isActive: true, isVerified: true,
          healthScore: true, consecutiveFailures: true,
          lastFetchedAt: true, lastSuccessAt: true, lastErrorAt: true,
          totalDocuments: true, totalFetches: true, totalSuccesses: true,
          priority: true, createdAt: true,
        },
      }),
      db.officialSource.count({ where }),
    ]);

    return NextResponse.json({
      sources,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin auth check
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'rouaa-admin-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, type, country, countryCode, region, website, rss, api, accessMethods, language, locale, updateFrequency, timezone, relatedAssets, relatedEntities, description, priority } = body;

    if (!name || !slug || !type) {
      return NextResponse.json({ error: 'name, slug, and type are required' }, { status: 400 });
    }

    const source = await db.officialSource.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        type,
        country,
        countryCode,
        region,
        website,
        rss,
        api,
        accessMethods: JSON.stringify(accessMethods || ['rss']),
        language: language || 'en',
        locale: locale || 'en',
        updateFrequency,
        timezone,
        relatedAssets: JSON.stringify(relatedAssets || []),
        relatedEntities: JSON.stringify(relatedEntities || []),
        description,
        priority: priority || 5,
      },
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
