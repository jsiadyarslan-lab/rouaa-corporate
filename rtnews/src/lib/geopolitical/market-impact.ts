// ─── Market Impact Calculator ──────────────────────────────────
// Links geopolitical events to financial markets
// Uses Yahoo Finance for live prices (existing lib/yahoo-finance.ts)

export interface MarketImpactAsset {
  symbol: string;           // Yahoo Finance symbol
  nameAr: string;
  nameEn: string;
  category: 'commodity' | 'currency' | 'index' | 'crypto';
  direction: 'bullish' | 'bearish' | 'neutral';
  expectedImpact: number;   // % expected change
}

// ─── Predefined Market Assets Affected by Geopolitical Events ──

export const GEOPOLITICAL_AFFECTED_ASSETS: MarketImpactAsset[] = [
  { symbol: 'CL=F', nameAr: 'النفط الخام', nameEn: 'Crude Oil', category: 'commodity', direction: 'bullish', expectedImpact: 0 },
  { symbol: 'GC=F', nameAr: 'الذهب', nameEn: 'Gold', category: 'commodity', direction: 'bullish', expectedImpact: 0 },
  { symbol: 'DX-Y.NYB', nameAr: 'مؤشر الدولار', nameEn: 'Dollar Index', category: 'currency', direction: 'bearish', expectedImpact: 0 },
  { symbol: '^TASI.SR', nameAr: 'تاسي', nameEn: 'TASI', category: 'index', direction: 'bearish', expectedImpact: 0 },
  { symbol: 'BTC-USD', nameAr: 'بيتكوين', nameEn: 'Bitcoin', category: 'crypto', direction: 'neutral', expectedImpact: 0 },
  { symbol: '^DFMGI', nameAr: 'دبي المالي', nameEn: 'DFM', category: 'index', direction: 'bearish', expectedImpact: 0 },
  { symbol: 'EGX30.CA', nameAr: 'EGX30', nameEn: 'EGX 30', category: 'index', direction: 'bearish', expectedImpact: 0 },
];

// ─── Risk Category → Market Impact Multipliers ─────────────────
// Each risk category has different effects on asset classes.
// Multipliers represent the amplification factor relative to base risk score.

export const RISK_MARKET_MULTIPLIERS: Record<string, Record<string, number>> = {
  conflict: { oil: 3.2, gold: 1.5, dollar: -0.8, emerging: -2.5, crypto: 0.3 },
  trade: { oil: 0.5, gold: 0.8, dollar: 0.5, emerging: -1.5, crypto: -0.2 },
  energy: { oil: 5.0, gold: 2.0, dollar: -1.2, emerging: -3.0, crypto: 0.5 },
  sanctions: { oil: 2.0, gold: 1.8, dollar: 0.3, emerging: -2.0, crypto: 1.0 },
  political: { oil: 0.8, gold: 0.5, dollar: -0.3, emerging: -1.0, crypto: 0.1 },
  cyber: { oil: 0.2, gold: 0.3, dollar: -0.1, emerging: -0.5, crypto: -2.0 },
  climate: { oil: -0.5, gold: 0.5, dollar: 0.1, emerging: -0.8, crypto: 0.0 },
};

// ─── Asset-to-Market-Class Mapping ─────────────────────────────
// Maps each Yahoo Finance symbol to a market class used in multipliers.

const ASSET_MARKET_CLASS: Record<string, string> = {
  'CL=F': 'oil',
  'GC=F': 'gold',
  'DX-Y.NYB': 'dollar',
  '^TASI.SR': 'emerging',
  'BTC-USD': 'crypto',
  '^DFMGI': 'emerging',
  'EGX30.CA': 'emerging',
};

// ─── Direction Sign Mapping ────────────────────────────────────
// Converts bullish/bearish/neutral to a sign for impact calculation.

const DIRECTION_SIGN: Record<string, number> = {
  bullish: 1,
  bearish: -1,
  neutral: 0,
};

/**
 * Calculate market impact for all predefined assets based on a risk category and score.
 *
 * The calculation works as follows:
 * 1. Look up the multiplier for the risk category and asset's market class
 * 2. Multiply by the risk score (0-100) normalized to 0-1
 * 3. Apply the asset's natural direction (bullish/bearish/neutral)
 * 4. Scale to a percentage impact
 *
 * @param riskCategory - Category of geopolitical risk (conflict, trade, energy, etc.)
 * @param riskScore - Risk score 0-100
 * @returns Array of market impact assets with calculated expectedImpact values
 */
export function calculateMarketImpact(
  riskCategory: string,
  riskScore: number
): MarketImpactAsset[] {
  const normalizedScore = Math.max(0, Math.min(100, riskScore)) / 100;
  const multipliers = RISK_MARKET_MULTIPLIERS[riskCategory];

  if (!multipliers) {
    // Unknown risk category: return assets with zero impact
    return GEOPOLITICAL_AFFECTED_ASSETS.map((asset) => ({
      ...asset,
      expectedImpact: 0,
    }));
  }

  return GEOPOLITICAL_AFFECTED_ASSETS.map((asset) => {
    const marketClass = ASSET_MARKET_CLASS[asset.symbol] || 'emerging';
    const multiplier = multipliers[marketClass] ?? 0;
    const directionSign = DIRECTION_SIGN[asset.direction] ?? 0;

    // Calculate expected impact:
    // Base impact = multiplier * normalizedScore * 10 (scale to percentage)
    // Direction adjustment: if multiplier and direction agree, amplify; if they disagree, reduce
    const baseImpact = multiplier * normalizedScore * 10;

    // Adjust based on direction alignment
    // If multiplier is positive and asset is bullish (or both negative), impact is amplified
    // If multiplier is positive but asset is bearish, the natural tendency is already captured
    let expectedImpact: number;

    if (directionSign === 0) {
      // Neutral assets (like crypto in some scenarios): use raw multiplier effect
      expectedImpact = baseImpact * 0.5;
    } else {
      // Apply direction: the multiplier already encodes directionality
      // The asset's natural direction determines whether the impact
      // pushes the price up (positive) or down (negative)
      const alignment = Math.sign(multiplier) === directionSign ? 1.2 : 0.8;
      expectedImpact = Math.abs(baseImpact) * alignment * directionSign;
    }

    // Round to 2 decimal places
    expectedImpact = Math.round(expectedImpact * 100) / 100;

    return {
      ...asset,
      expectedImpact,
    };
  });
}

/**
 * Get the market impact for a specific asset and risk category.
 *
 * @param symbol - Yahoo Finance symbol
 * @param riskCategory - Risk category string
 * @param riskScore - Risk score 0-100
 * @returns Market impact asset or null if symbol not found
 */
export function getAssetImpact(
  symbol: string,
  riskCategory: string,
  riskScore: number
): MarketImpactAsset | null {
  const allImpacts = calculateMarketImpact(riskCategory, riskScore);
  return allImpacts.find((a) => a.symbol === symbol) || null;
}

/**
 * Get a summary of market impacts grouped by category (commodity, currency, index, crypto).
 *
 * @param riskCategory - Risk category string
 * @param riskScore - Risk score 0-100
 * @returns Map of category → array of impacted assets
 */
export function getMarketImpactByCategory(
  riskCategory: string,
  riskScore: number
): Record<string, MarketImpactAsset[]> {
  const impacts = calculateMarketImpact(riskCategory, riskScore);

  const grouped: Record<string, MarketImpactAsset[]> = {
    commodity: [],
    currency: [],
    index: [],
    crypto: [],
  };

  for (const impact of impacts) {
    if (!grouped[impact.category]) {
      grouped[impact.category] = [];
    }
    grouped[impact.category].push(impact);
  }

  return grouped;
}

/**
 * Get the top N most impacted assets sorted by absolute expected impact.
 *
 * @param riskCategory - Risk category string
 * @param riskScore - Risk score 0-100
 * @param topN - Number of top assets to return (default: 5)
 * @returns Top N most impacted assets
 */
export function getTopImpactedAssets(
  riskCategory: string,
  riskScore: number,
  topN: number = 5
): MarketImpactAsset[] {
  const impacts = calculateMarketImpact(riskCategory, riskScore);
  return impacts
    .sort((a, b) => Math.abs(b.expectedImpact) - Math.abs(a.expectedImpact))
    .slice(0, topN);
}
