import { NextResponse } from 'next/server';
import {
  buildScenarioTree,
  getAvailableScenarioTrees,
  findHighestImpactPath,
  findMostProbablePath,
} from '@/lib/geopolitical/scenario-tree-ai';

export const revalidate = 300; // Computational route — cache for 5 min instead of force-dynamic

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenario = searchParams.get('scenario');
  const impactPath = searchParams.get('impactPath') === 'true';
  const probablePath = searchParams.get('probablePath') === 'true';

  try {
    if (!scenario) {
      // Return available scenarios
      return NextResponse.json({
        availableScenarios: getAvailableScenarioTrees(),
      });
    }

    const tree = buildScenarioTree(scenario, {
      maxDepth: 3,
      maxBranchesPerNode: 3,
      includeRAGValidation: true,
    });

    const result: Record<string, unknown> = { tree };

    if (impactPath) {
      result.highestImpactPath = findHighestImpactPath(tree);
    }

    if (probablePath) {
      result.mostProbablePath = findMostProbablePath(tree);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Scenario Tree API] Error:', error);
    return NextResponse.json({ error: 'Scenario tree generation failed' }, { status: 500 });
  }
}
