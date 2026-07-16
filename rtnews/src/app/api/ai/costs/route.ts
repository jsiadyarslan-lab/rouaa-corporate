// ─── V68 AI Provider Cost Comparison Endpoint ───────────────
// Returns cost comparison data for all configured AI providers.
// Helps users understand the cost implications of different providers
// and make informed decisions about which to use.

import { NextResponse } from 'next/server';
import { PROVIDER_COSTS, getV68ProviderStatus, V68_DEFAULT_MODEL, V68_PROVIDER_PRIORITY } from '@/lib/ai/ai-provider';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get current provider health status
    const healthStatus = getV68ProviderStatus();

    // Enrich cost data with availability info
    const enrichedCosts = PROVIDER_COSTS.map(cost => {
      const health = healthStatus.find(h => h.provider === cost.provider);
      return {
        ...cost,
        available: health?.available ?? false,
        healthy: health?.healthy ?? false,
        avgLatencyMs: health?.avgLatencyMs ?? 0,
      };
    });

    // Calculate estimated monthly cost based on usage
    // Assume: ~10,000 articles/day, ~500 tokens input, ~300 tokens output per article
    const DAILY_ARTICLES = 10000;
    const AVG_INPUT_TOKENS = 500;
    const AVG_OUTPUT_TOKENS = 300;
    const DAYS_PER_MONTH = 30;

    const monthlyEstimates = enrichedCosts.map(cost => {
      const monthlyInputTokens = (DAILY_ARTICLES * AVG_INPUT_TOKENS * DAYS_PER_MONTH) / 1_000_000;
      const monthlyOutputTokens = (DAILY_ARTICLES * AVG_OUTPUT_TOKENS * DAYS_PER_MONTH) / 1_000_000;
      const monthlyCost = (monthlyInputTokens * cost.inputCostPer1M) + (monthlyOutputTokens * cost.outputCostPer1M);

      return {
        provider: cost.provider,
        model: cost.model,
        monthlyCost: Math.round(monthlyCost * 100) / 100,
        currency: cost.currency,
        available: cost.available,
        healthy: cost.healthy,
      };
    });

    // Sort by monthly cost (cheapest first)
    monthlyEstimates.sort((a, b) => a.monthlyCost - b.monthlyCost);

    // Recommend best cost/performance option
    const recommendedProvider = V68_PROVIDER_PRIORITY[0]; // bedrock
    const recommendedCost = enrichedCosts.find(c => c.provider === recommendedProvider);

    return NextResponse.json({
      version: 'V68',
      defaultModel: V68_DEFAULT_MODEL,
      providerPriority: V68_PROVIDER_PRIORITY,
      costs: enrichedCosts,
      monthlyEstimates,
      recommendation: {
        provider: recommendedProvider,
        model: recommendedCost?.model || V68_DEFAULT_MODEL,
        reason: recommendedCost?.notes || 'Default V68 provider',
        monthlyCost: monthlyEstimates.find(m => m.provider === recommendedProvider)?.monthlyCost || 0,
      },
      assumptions: {
        dailyArticles: DAILY_ARTICLES,
        avgInputTokens: AVG_INPUT_TOKENS,
        avgOutputTokens: AVG_OUTPUT_TOKENS,
        daysPerMonth: DAYS_PER_MONTH,
        note: 'Estimates based on full pipeline processing. Actual costs may vary based on article length and gate decisions.',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      version: 'V68',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
