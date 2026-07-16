import { NextRequest, NextResponse } from 'next/server';
import { calculateMarketImpact } from '@/lib/geopolitical/market-impact';

export const dynamic = 'force-dynamic'; // Uses request.url/searchParams — must be dynamic

// GET /api/geopolitical-risks/market-impact — Return market impact data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const riskCategory = searchParams.get('riskCategory') || 'conflict';
    const riskScoreParam = searchParams.get('riskScore');
    const riskScore = riskScoreParam
      ? Math.min(Math.max(parseInt(riskScoreParam, 10), 0), 100)
      : 50;

    // Validate risk category
    const validCategories = [
      'conflict',
      'trade',
      'energy',
      'sanctions',
      'political',
      'cyber',
      'climate',
    ];

    if (riskScoreParam && isNaN(parseInt(riskScoreParam, 10))) {
      return NextResponse.json(
        { error: 'Invalid riskScore parameter. Must be a number between 0 and 100.' },
        { status: 400 }
      );
    }

    // Calculate market impact using the shared library
    const assets = calculateMarketImpact(riskCategory, riskScore);

    // Group results by category
    const byCategory: Record<string, typeof assets> = {
      commodity: [],
      currency: [],
      index: [],
      crypto: [],
    };
    for (const asset of assets) {
      if (!byCategory[asset.category]) {
        byCategory[asset.category] = [];
      }
      byCategory[asset.category].push(asset);
    }

    // Sort each category by absolute impact (most impacted first)
    for (const cat of Object.keys(byCategory)) {
      byCategory[cat].sort(
        (a, b) => Math.abs(b.expectedImpact) - Math.abs(a.expectedImpact)
      );
    }

    // Top 5 most impacted assets overall
    const topImpacted = [...assets]
      .sort((a, b) => Math.abs(b.expectedImpact) - Math.abs(a.expectedImpact))
      .slice(0, 5);

    return NextResponse.json({
      riskCategory,
      riskScore,
      isValidCategory: validCategories.includes(riskCategory),
      data: assets,
      byCategory,
      topImpacted,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GeopoliticalRisks] GET /market-impact error:', message);
    return NextResponse.json(
      { error: 'Failed to calculate market impact', details: message },
      { status: 500 }
    );
  }
}
