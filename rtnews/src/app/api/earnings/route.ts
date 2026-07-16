import { NextRequest, NextResponse } from 'next/server';
import { getEarningsData } from '@/lib/financial-apis';

/**
 * GET /api/earnings?symbol=ORCL
 * Fetches earnings data for a specific stock symbol.
 * Returns EPS, Revenue, Beat/Miss, Guidance, and Analyst Consensus.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Missing required parameter: symbol' },
        { status: 400 }
      );
    }

    const earningsData = await getEarningsData(symbol.toUpperCase());

    if (!earningsData) {
      return NextResponse.json(
        { error: `No earnings data found for symbol: ${symbol}`, symbol },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      symbol: earningsData.symbol,
      company: earningsData.company,
      currentQuarter: earningsData.currentQuarter,
      previousQuarters: earningsData.previousQuarters,
      earningsHistory: earningsData.earningsHistory,
      guidance: earningsData.guidance,
      analystConsensus: earningsData.analystConsensus,
    });
  } catch (error: any) {
    console.error('[Earnings API] Error:', error?.message?.slice(0, 100));
    return NextResponse.json(
      { error: 'Failed to fetch earnings data' },
      { status: 500 }
    );
  }
}
