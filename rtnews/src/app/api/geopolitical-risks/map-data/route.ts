import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic'; // Uses request.url/searchParams — must be dynamic

// GET /api/geopolitical-risks/map-data — Country risk scores for choropleth map
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (region) {
      where.region = region;
    }

    const countryScores = await db.countryRiskScore.findMany({
      where,
      orderBy: { compositeScore: 'desc' },
    });

    // Transform into GeoJSON-like features
    const features = countryScores.map((country) => ({
      type: 'Feature' as const,
      properties: {
        countryCode: country.countryCode,
        countryNameAr: country.countryNameAr,
        countryNameEn: country.countryNameEn,
        compositeScore: country.compositeScore,
        riskLevel: country.riskLevel,
        riskCategory: country.riskCategory,
        region: country.region,
        gprScore: country.gprScore,
        aiGprScore: country.aiGprScore,
        acledScore: country.acledScore,
        worldBankScore: country.worldBankScore,
        gdeltScore: country.gdeltScore,
        peaceIndexScore: country.peaceIndexScore,
        updatedAt: country.updatedAt.toISOString(),
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [country.longitude, country.latitude],
      },
    }));

    // Compute summary statistics
    const totalCountries = countryScores.length;
    const avgScore =
      totalCountries > 0
        ? Math.round(
            countryScores.reduce((sum, c) => sum + c.compositeScore, 0) /
              totalCountries
          )
        : 0;

    const riskDistribution = countryScores.reduce<
      Record<string, number>
    >((acc, c) => {
      acc[c.riskLevel] = (acc[c.riskLevel] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      type: 'FeatureCollection',
      features,
      metadata: {
        totalCountries,
        averageScore: avgScore,
        riskDistribution,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GeopoliticalRisks] GET /map-data error:', message);
    return NextResponse.json(
      { error: 'Failed to fetch map data', details: message },
      { status: 500 }
    );
  }
}
