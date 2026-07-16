import { NextResponse } from 'next/server';
import {
  calculateEconomicImpact,
  calculateScenarioImpact,
  calculateDiversificationScore,
  DEFAULT_PORTFOLIO,
  GEO_ECONOMIC_SCENARIOS,
  type PortfolioHolding,
} from '@/lib/geopolitical/economic-impact-model';

export const dynamic = 'force-dynamic'; // Uses request.url/searchParams — must be dynamic

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenario = searchParams.get('scenario');
  const full = searchParams.get('full') === 'true';

  try {
    if (scenario) {
      const scenarioData = GEO_ECONOMIC_SCENARIOS.find(s => s.id === scenario);
      if (!scenarioData) {
        return NextResponse.json({ error: 'Unknown scenario' }, { status: 400 });
      }

      const impact = calculateScenarioImpact(DEFAULT_PORTFOLIO, scenarioData);
      // Serialize Map
      const serializedAssetImpacts = Object.fromEntries(
        Array.from(impact.assetImpacts.entries()).map(([key, val]) => [key, val])
      );

      return NextResponse.json({
        ...impact,
        assetImpacts: serializedAssetImpacts,
      });
    }

    if (full) {
      const result = calculateEconomicImpact(DEFAULT_PORTFOLIO);
      // Serialize Maps in scenarios
      const serializedScenarios = result.scenarios.map(s => ({
        ...s,
        assetImpacts: Object.fromEntries(
          Array.from(s.assetImpacts.entries()).map(([key, val]) => [key, val])
        ),
      }));

      return NextResponse.json({
        ...result,
        scenarios: serializedScenarios,
      });
    }

    // Default: summary view
    const diversificationScore = calculateDiversificationScore(DEFAULT_PORTFOLIO);
    const scenarioSummaries = GEO_ECONOMIC_SCENARIOS.map(s => ({
      id: s.id,
      nameAr: s.nameAr,
      nameEn: s.nameEn,
      probability: s.probability,
      affectedRoutes: s.affectedRoutes,
    }));

    return NextResponse.json({
      diversificationScore,
      availableScenarios: scenarioSummaries,
      portfolio: DEFAULT_PORTFOLIO.map(h => ({
        symbol: h.symbol,
        nameAr: h.nameAr,
        nameEn: h.nameEn,
        allocation: h.allocation,
      })),
    });
  } catch (error) {
    console.error('[Economic Impact API] Error:', error);
    return NextResponse.json({ error: 'Economic impact analysis failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const portfolio: PortfolioHolding[] = body.portfolio || DEFAULT_PORTFOLIO;
    const result = calculateEconomicImpact(portfolio);

    const serializedScenarios = result.scenarios.map(s => ({
      ...s,
      assetImpacts: Object.fromEntries(
        Array.from(s.assetImpacts.entries()).map(([key, val]) => [key, val])
      ),
    }));

    return NextResponse.json({
      ...result,
      scenarios: serializedScenarios,
    });
  } catch (error) {
    console.error('[Economic Impact API] POST Error:', error);
    return NextResponse.json({ error: 'Economic impact analysis failed' }, { status: 500 });
  }
}
