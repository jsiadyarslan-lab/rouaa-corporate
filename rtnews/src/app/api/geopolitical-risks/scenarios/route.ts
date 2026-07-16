import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic'; // Uses request.url/searchParams — must be dynamic

// GET /api/geopolitical-risks/scenarios — Return available scenarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'ar';

    // Fetch risks that have non-null scenarios field
    const risks = await db.geopoliticalRisk.findMany({
      where: {
        locale,
        isPublished: true,
        scenarios: { not: null },
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        riskCategory: true,
        riskLevel: true,
        riskScore: true,
        scenarios: true,
        affectedCountries: true,
        affectedAssets: true,
        tradeRoutes: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    // Parse JSON string fields
    const parsedRisks = risks.map((risk) => ({
      ...risk,
      scenarios: risk.scenarios ? safeJsonParse(risk.scenarios as any) : null,
      affectedCountries: safeJsonParse(risk.affectedCountries as any),
      affectedAssets: safeJsonParse(risk.affectedAssets as any),
      tradeRoutes: risk.tradeRoutes ? safeJsonParse(risk.tradeRoutes as any) : null,
    }));

    // Filter out risks where scenarios parsed to null/empty
    const scenariosWithRisks = parsedRisks.filter((risk) => {
      if (!risk.scenarios) return false;
      if (typeof risk.scenarios === 'object' && Object.keys(risk.scenarios as object).length === 0) {
        return false;
      }
      return true;
    });

    // Extract scenario summary across all risks
    const scenarioSummary = scenariosWithRisks.map((risk) => {
      const scenarios = risk.scenarios as Record<string, unknown>;
      return {
        riskId: risk.id,
        title: risk.title,
        slug: risk.slug,
        riskCategory: risk.riskCategory,
        riskLevel: risk.riskLevel,
        riskScore: risk.riskScore,
        scenarioTypes: Object.keys(scenarios),
        publishedAt: risk.publishedAt,
      };
    });

    return NextResponse.json({
      data: scenariosWithRisks,
      summary: {
        totalRisksWithScenarios: scenariosWithRisks.length,
        scenarioOverview: scenarioSummary,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GeopoliticalRisks] GET /scenarios error:', message);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios', details: message },
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
