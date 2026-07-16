import { NextResponse } from 'next/server';
import { runGNNAnalysis } from '@/lib/geopolitical/gnn-correlation';

export const revalidate = 300; // Computational route — cache for 5 min instead of force-dynamic

export async function GET() {
  try {
    const result = runGNNAnalysis();

    // Serialize for JSON (no Maps)
    return NextResponse.json({
      nodes: result.nodes.map(n => ({
        id: n.id,
        riskScore: n.riskScore,
        features: n.features,
        region: n.region,
        embeddings: n.embeddings,
      })),
      edges: result.edges.map(e => ({
        source: e.source,
        target: e.target,
        weight: e.weight,
        relationType: e.relationType,
      })),
      correlations: result.correlations,
      systemicRiskScore: result.systemicRiskScore,
      vulnerableClusters: result.vulnerableClusters,
      hiddenRisks: result.hiddenRisks,
    });
  } catch (error) {
    console.error('[GNN API] Error:', error);
    return NextResponse.json({ error: 'GNN analysis failed' }, { status: 500 });
  }
}
