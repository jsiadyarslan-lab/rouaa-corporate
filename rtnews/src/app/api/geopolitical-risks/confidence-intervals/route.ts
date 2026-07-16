import { NextResponse } from 'next/server';
import {
  computeConfidenceInterval,
  formatScoreWithCI,
  generateComponentOutcomes,
  computeComponentCIs,
} from '@/lib/geopolitical/confidence-intervals';

export const revalidate = 300; // Computational route — cache for 5 min instead of force-dynamic

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const score = parseFloat(searchParams.get('score') || '0');
  const uncertainty = parseFloat(searchParams.get('uncertainty') || '0.3');
  const allComponents = searchParams.get('all') === 'true';

  try {
    if (allComponents) {
      // Generate CIs for typical risk components
      const components = new Map<string, number[]>([
        ['gpr', generateComponentOutcomes(score || 65, 0.3, 5000)],
        ['acled', generateComponentOutcomes(score || 55, 0.35, 5000)],
        ['worldbank', generateComponentOutcomes(score || 48, 0.25, 5000)],
        ['gdelt', generateComponentOutcomes(score || 60, 0.4, 5000)],
        ['peaceIndex', generateComponentOutcomes(score || 42, 0.2, 5000)],
      ]);

      const cis = computeComponentCIs(components);
      const serialized = Object.fromEntries(
        Array.from(cis.entries()).map(([key, val]) => [key, val])
      );

      return NextResponse.json({
        components: serialized,
        composite: formatScoreWithCI(
          score || 58,
          computeConfidenceInterval(
            generateComponentOutcomes(score || 58, 0.25, 5000)
          )
        ),
      });
    }

    if (score > 0) {
      const outcomes = generateComponentOutcomes(score, uncertainty, 5000);
      const ci = computeConfidenceInterval(outcomes);
      const formatted = formatScoreWithCI(score, ci);

      return NextResponse.json(formatted);
    }

    // Default: explain the CI system
    return NextResponse.json({
      description: 'Confidence Intervals API for Geopolitical Risk Scores',
      usage: 'Add ?score=72&uncertainty=0.3 for a single score, or ?all=true for all components',
      methodology: 'Uses Monte Carlo simulation with Beta distribution approximation to compute 95% confidence intervals for risk scores.',
    });
  } catch (error) {
    console.error('[CI API] Error:', error);
    return NextResponse.json({ error: 'Confidence interval computation failed' }, { status: 500 });
  }
}
