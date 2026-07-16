import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic'; // Uses request.url/searchParams — must be dynamic

// GET /api/geopolitical-risks/risk-score — Composite risk score statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (region) {
      where.region = region;
    }

    // Fetch all country risk scores
    const allScores = await db.countryRiskScore.findMany({
      where,
      orderBy: { compositeScore: 'desc' },
    });

    if (allScores.length === 0) {
      return NextResponse.json({
        globalCompositeScore: null,
        topHighestRisk: [],
        riskDistribution: {},
        regionalAverages: {},
        totalCountries: 0,
      });
    }

    // 1. Global composite score (weighted average)
    const globalCompositeScore = Math.round(
      allScores.reduce((sum, c) => sum + c.compositeScore, 0) /
        allScores.length
    );

    // 2. Top 10 highest risk countries
    const topHighestRisk = allScores.slice(0, 10).map((c) => ({
      countryCode: c.countryCode,
      countryNameAr: c.countryNameAr,
      countryNameEn: c.countryNameEn,
      compositeScore: c.compositeScore,
      riskLevel: c.riskLevel,
      riskCategory: c.riskCategory,
      region: c.region,
    }));

    // 3. Risk distribution by level
    const riskDistribution: Record<string, { count: number; percentage: number }> = {};
    for (const score of allScores) {
      if (!riskDistribution[score.riskLevel]) {
        riskDistribution[score.riskLevel] = { count: 0, percentage: 0 };
      }
      riskDistribution[score.riskLevel].count++;
    }
    for (const level of Object.keys(riskDistribution)) {
      riskDistribution[level].percentage = Math.round(
        (riskDistribution[level].count / allScores.length) * 100
      );
    }

    // 4. Regional averages
    const regionalData: Record<
      string,
      { totalScore: number; count: number; countries: number }
    > = {};
    for (const score of allScores) {
      if (!regionalData[score.region]) {
        regionalData[score.region] = { totalScore: 0, count: 0, countries: 0 };
      }
      regionalData[score.region].totalScore += score.compositeScore;
      regionalData[score.region].count++;
      regionalData[score.region].countries++;
    }

    const regionalAverages: Record<string, { averageScore: number; countryCount: number }> = {};
    for (const [regionKey, data] of Object.entries(regionalData)) {
      regionalAverages[regionKey] = {
        averageScore: Math.round(data.totalScore / data.count),
        countryCount: data.countries,
      };
    }

    // 5. Sub-score averages across all countries
    const subScoreFields = [
      'gprScore',
      'aiGprScore',
      'acledScore',
      'worldBankScore',
      'gdeltScore',
      'peaceIndexScore',
    ] as const;

    const subScoreAverages: Record<string, number | null> = {};
    for (const field of subScoreFields) {
      const values = allScores
        .map((c) => c[field])
        .filter((v): v is number => v !== null);
      subScoreAverages[field] =
        values.length > 0
          ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100
          : null;
    }

    return NextResponse.json({
      globalCompositeScore,
      topHighestRisk,
      riskDistribution,
      regionalAverages,
      subScoreAverages,
      totalCountries: allScores.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GeopoliticalRisks] GET /risk-score error:', message);
    return NextResponse.json(
      { error: 'Failed to compute risk score statistics', details: message },
      { status: 500 }
    );
  }
}
