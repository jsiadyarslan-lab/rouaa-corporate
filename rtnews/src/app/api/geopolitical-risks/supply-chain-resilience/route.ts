import { NextResponse } from 'next/server';
import {
  calculateSupplyChainResilience,
  calculateAllResilienceIndices,
  getTrackedCountries,
} from '@/lib/geopolitical/supply-chain-resilience';

export const revalidate = 300; // Computational route — cache for 5 min instead of force-dynamic

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get('country');
  const all = searchParams.get('all') === 'true';

  try {
    if (countryCode) {
      const result = calculateSupplyChainResilience(countryCode.toUpperCase());
      return NextResponse.json(result);
    }

    if (all) {
      const results = calculateAllResilienceIndices();
      return NextResponse.json({
        countries: results,
        summary: {
          totalTracked: results.length,
          critical: results.filter(r => r.riskLevel === 'critical').length,
          low: results.filter(r => r.riskLevel === 'low').length,
          moderate: results.filter(r => r.riskLevel === 'moderate').length,
          high: results.filter(r => r.riskLevel === 'high').length,
          averageScore: Math.round(results.reduce((s, r) => s + r.compositeScore, 0) / results.length),
        },
      });
    }

    // Default: return tracked countries list with quick scores
    const countries = getTrackedCountries();
    const quickScores = countries.map(code => {
      const r = calculateSupplyChainResilience(code);
      return {
        countryCode: code,
        compositeScore: r.compositeScore,
        riskLevel: r.riskLevel,
        hhi: r.chokepointDependency,
      };
    });

    return NextResponse.json({ trackedCountries: quickScores });
  } catch (error) {
    console.error('[Supply Chain API] Error:', error);
    return NextResponse.json({ error: 'Supply chain analysis failed' }, { status: 500 });
  }
}
