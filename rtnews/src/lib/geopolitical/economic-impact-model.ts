// ─── Economic Impact Model (BlackRock-style VaR) ──────────────
// Rouaa Geopolitical Risk Platform
// Links geopolitical events to financial market impacts.
// Implements Conditional Value-at-Risk (CVaR) linked to geopolitical scenarios.
// Inspired by BlackRock's systematic risk approach for institutional investors.

import { runMonteCarloSimulation, type ScenarioInput, type SimulationResult } from './monte-carlo';
import { TRADE_ROUTES, getDisruptedRoutes, getTotalTradeAtRisk } from './trade-routes-data';

export interface PortfolioHolding {
  symbol: string;
  nameAr: string;
  nameEn: string;
  allocation: number;  // Weight in portfolio (0-1, sum = 1)
  baseVolatility: number; // Annual volatility %
  category: 'equity' | 'commodity' | 'currency' | 'bond' | 'real_estate';
  region: string;
}

export interface GeopoliticalScenarioImpact {
  scenarioId: string;
  scenarioNameAr: string;
  scenarioNameEn: string;
  probability: number;
  portfolioImpact: {
    expectedLoss: number;     // Expected % change in portfolio value
    var95: number;            // Value at Risk (95% confidence)
    cvar95: number;           // Conditional VaR (expected shortfall)
    maxDrawdown: number;      // Maximum expected drawdown
  };
  assetImpacts: Map<string, {
    expectedChange: number;
    var95: number;
    correlationContribution: number; // How much this asset adds to portfolio risk via correlation
  }>;
  tradeRouteImpact: {
    tradeAtRiskPct: number;
    affectedRoutes: string[];
    estimatedSupplyChainCost: number; // % of GDP
  };
}

export interface EconomicImpactResult {
  portfolio: PortfolioHolding[];
  scenarios: GeopoliticalScenarioImpact[];
  aggregateVaR: number;         // Overall portfolio VaR across all scenarios
  aggregateCVaR: number;        // Overall CVaR
  diversificationScore: number; // 0-100, how well diversified against geo risk
  stressTestResults: StressTestResult[];
}

export interface StressTestResult {
  testName: string;
  testNameAr: string;
  portfolioImpact: number;
  worstAsset: string;
  recoveryTimeMonths: number;
}

// ─── Correlation Matrix (Simplified) ─────────────────────────
// Correlations between asset classes during geopolitical stress
// These increase during crises (correlation breakdown)

const STRESS_CORRELATIONS: Record<string, Record<string, number>> = {
  'OIL': { 'OIL': 1.0, 'GOLD': 0.3, 'USD': -0.4, 'TASI': -0.5, 'SP500': -0.3, 'BONDS': 0.2 },
  'GOLD': { 'OIL': 0.3, 'GOLD': 1.0, 'USD': -0.6, 'TASI': -0.2, 'SP500': -0.2, 'BONDS': 0.3 },
  'USD': { 'OIL': -0.4, 'GOLD': -0.6, 'USD': 1.0, 'TASI': -0.3, 'SP500': 0.1, 'BONDS': 0.4 },
  'TASI': { 'OIL': -0.5, 'GOLD': -0.2, 'USD': -0.3, 'TASI': 1.0, 'SP500': 0.5, 'BONDS': -0.2 },
  'SP500': { 'OIL': -0.3, 'GOLD': -0.2, 'USD': 0.1, 'TASI': 0.5, 'SP500': 1.0, 'BONDS': -0.3 },
  'BONDS': { 'OIL': 0.2, 'GOLD': 0.3, 'USD': 0.4, 'TASI': -0.2, 'SP500': -0.3, 'BONDS': 1.0 },
};

// ─── Pre-configured Geopolitical Scenarios ────────────────────

export const GEO_ECONOMIC_SCENARIOS: {
  id: string;
  nameAr: string;
  nameEn: string;
  probability: number;
  assetShocks: Record<string, { base: number; adverse: number; severe: number; vol: number }>;
  affectedRoutes: string[];
  supplyChainCostPct: number; // % of global GDP
}[] = [
  {
    id: 'hormuz_closure',
    nameAr: 'إغلاق مضيق هرمز',
    nameEn: 'Strait of Hormuz Closure',
    probability: 0.15,
    assetShocks: {
      'OIL': { base: 15, adverse: 30, severe: 55, vol: 8 },
      'GOLD': { base: 5, adverse: 12, severe: 22, vol: 3 },
      'USD': { base: -2, adverse: -5, severe: -10, vol: 2 },
      'TASI': { base: -8, adverse: -18, severe: -32, vol: 6 },
      'SP500': { base: -3, adverse: -7, severe: -14, vol: 3 },
      'BONDS': { base: 1, adverse: 3, severe: 5, vol: 1 },
    },
    affectedRoutes: ['hormuz'],
    supplyChainCostPct: 0.8,
  },
  {
    id: 'suez_disruption',
    nameAr: 'تعطيل قناة السويس',
    nameEn: 'Suez Canal Disruption',
    probability: 0.25,
    assetShocks: {
      'OIL': { base: 5, adverse: 12, severe: 25, vol: 4 },
      'GOLD': { base: 2, adverse: 5, severe: 10, vol: 2 },
      'USD': { base: -1, adverse: -2, severe: -4, vol: 1 },
      'TASI': { base: -3, adverse: -8, severe: -15, vol: 3 },
      'SP500': { base: -2, adverse: -5, severe: -10, vol: 2 },
      'BONDS': { base: 0.5, adverse: 1.5, severe: 3, vol: 0.5 },
    },
    affectedRoutes: ['suez', 'bab_el_mandeb'],
    supplyChainCostPct: 0.4,
  },
  {
    id: 'taiwan_crisis',
    nameAr: 'أزمة تايوان',
    nameEn: 'Taiwan Crisis',
    probability: 0.12,
    assetShocks: {
      'OIL': { base: 3, adverse: 8, severe: 20, vol: 3 },
      'GOLD': { base: 3, adverse: 10, severe: 20, vol: 3 },
      'USD': { base: 1, adverse: 3, severe: -5, vol: 2 },
      'TASI': { base: -3, adverse: -10, severe: -25, vol: 4 },
      'SP500': { base: -5, adverse: -12, severe: -22, vol: 5 },
      'BONDS': { base: 1, adverse: 2, severe: 4, vol: 0.5 },
    },
    affectedRoutes: ['malacca'],
    supplyChainCostPct: 0.6,
  },
  {
    id: 'russia_nato',
    nameAr: 'تصعيد روسيا-الناتو',
    nameEn: 'Russia-NATO Escalation',
    probability: 0.10,
    assetShocks: {
      'OIL': { base: 5, adverse: 15, severe: 35, vol: 5 },
      'GOLD': { base: 6, adverse: 14, severe: 25, vol: 4 },
      'USD': { base: 2, adverse: 4, severe: -3, vol: 2 },
      'TASI': { base: -4, adverse: -12, severe: -22, vol: 4 },
      'SP500': { base: -4, adverse: -10, severe: -20, vol: 4 },
      'BONDS': { base: 1, adverse: 3, severe: 6, vol: 1 },
    },
    affectedRoutes: ['turkish_straits'],
    supplyChainCostPct: 0.5,
  },
  {
    id: 'middle_east_war',
    nameAr: 'حرب إقليمية في الشرق الأوسط',
    nameEn: 'Regional Middle East War',
    probability: 0.08,
    assetShocks: {
      'OIL': { base: 20, adverse: 40, severe: 60, vol: 10 },
      'GOLD': { base: 8, adverse: 18, severe: 30, vol: 5 },
      'USD': { base: -3, adverse: -7, severe: -12, vol: 3 },
      'TASI': { base: -15, adverse: -28, severe: -45, vol: 8 },
      'SP500': { base: -6, adverse: -14, severe: -25, vol: 5 },
      'BONDS': { base: 2, adverse: 4, severe: 7, vol: 1 },
    },
    affectedRoutes: ['hormuz', 'bab_el_mandeb', 'suez'],
    supplyChainCostPct: 1.2,
  },
];

// ─── Default Portfolio ────────────────────────────────────────
export const DEFAULT_PORTFOLIO: PortfolioHolding[] = [
  { symbol: 'TASI', nameAr: 'مؤشر تاسي', nameEn: 'TASI Index', allocation: 0.30, baseVolatility: 18, category: 'equity', region: 'GCC' },
  { symbol: 'SP500', nameAr: 'مؤشر S&P 500', nameEn: 'S&P 500', allocation: 0.25, baseVolatility: 15, category: 'equity', region: 'US' },
  { symbol: 'OIL', nameAr: 'النفط الخام', nameEn: 'Crude Oil', allocation: 0.15, baseVolatility: 30, category: 'commodity', region: 'Global' },
  { symbol: 'GOLD', nameAr: 'الذهب', nameEn: 'Gold', allocation: 0.10, baseVolatility: 15, category: 'commodity', region: 'Global' },
  { symbol: 'BONDS', nameAr: 'سندات حكومية', nameEn: 'Government Bonds', allocation: 0.15, baseVolatility: 5, category: 'bond', region: 'Global' },
  { symbol: 'USD', nameAr: 'الدولار الأمريكي', nameEn: 'US Dollar', allocation: 0.05, baseVolatility: 8, category: 'currency', region: 'US' },
];

/**
 * Calculate portfolio Value-at-Risk conditioned on a geopolitical scenario.
 *
 * VaR(95%) = Portfolio Expected Change - 1.645 * Portfolio Volatility
 * CVaR(95%) = Expected loss given that loss exceeds VaR
 *
 * @param portfolio - Portfolio holdings with allocations
 * @param scenario - Geopolitical scenario with asset shocks
 * @returns Impact analysis for the scenario
 */
export function calculateScenarioImpact(
  portfolio: PortfolioHolding[],
  scenario: typeof GEO_ECONOMIC_SCENARIOS[0]
): GeopoliticalScenarioImpact {
  // Run Monte Carlo for this scenario
  const scenarioInput: ScenarioInput = {
    name: scenario.nameEn,
    probability: scenario.probability,
    marketImpacts: Object.entries(scenario.assetShocks).map(([symbol, shock]) => ({
      symbol,
      baseChange: shock.base,
      adverseChange: shock.adverse,
      severeChange: shock.severe,
      volatility: shock.vol,
    })),
  };

  const simResults = runMonteCarloSimulation(scenarioInput, 10000);

  // Calculate portfolio-level impact
  let expectedLoss = 0;
  let portfolioVariance = 0;

  const assetImpacts = new Map<string, {
    expectedChange: number;
    var95: number;
    correlationContribution: number;
  }>();

  for (const holding of portfolio) {
    const simResult = simResults.find(r => r.symbol === holding.symbol);
    if (!simResult) continue;

    const expectedChange = (0.6 * simResult.baseP50 + 0.3 * simResult.adverseP50 + 0.1 * simResult.severeP50) * scenario.probability;
    expectedLoss += holding.allocation * expectedChange;

    const assetVar95 = Math.abs(simResult.confidenceInterval.p5);

    // Correlation contribution: how much this asset adds to portfolio risk
    let corrContribution = 0;
    for (const other of portfolio) {
      if (other.symbol === holding.symbol) continue;
      const corr = STRESS_CORRELATIONS[holding.symbol]?.[other.symbol] ?? 0;
      corrContribution += corr * other.allocation * other.baseVolatility;
    }
    corrContribution = corrContribution * holding.allocation * holding.baseVolatility;

    assetImpacts.set(holding.symbol, {
      expectedChange: Math.round(expectedChange * 100) / 100,
      var95: Math.round(assetVar95 * 100) / 100,
      correlationContribution: Math.round(corrContribution * 100) / 100,
    });

    // Add to portfolio variance (simplified)
    portfolioVariance += (holding.allocation * holding.baseVolatility / 100) ** 2;
  }

  // Add cross-term variance (correlation effects)
  for (let i = 0; i < portfolio.length; i++) {
    for (let j = i + 1; j < portfolio.length; j++) {
      const corr = STRESS_CORRELATIONS[portfolio[i].symbol]?.[portfolio[j].symbol] ?? 0;
      portfolioVariance += 2 * portfolio[i].allocation * portfolio[j].allocation *
        (portfolio[i].baseVolatility / 100) * (portfolio[j].baseVolatility / 100) * corr;
    }
  }

  const portfolioVol = Math.sqrt(portfolioVariance);
  const var95 = Math.abs(expectedLoss - 1.645 * portfolioVol * 100);
  const cvar95 = var95 * 1.2; // Simplified: CVaR ≈ 1.2 * VaR for near-normal distributions
  const maxDrawdown = var95 * 1.5; // Max drawdown estimate

  // Trade route impact
  const tradeAtRisk = getTotalTradeAtRisk();
  const affectedRoutes = scenario.affectedRoutes;

  return {
    scenarioId: scenario.id,
    scenarioNameAr: scenario.nameAr,
    scenarioNameEn: scenario.nameEn,
    probability: scenario.probability,
    portfolioImpact: {
      expectedLoss: Math.round(expectedLoss * 100) / 100,
      var95: Math.round(var95 * 100) / 100,
      cvar95: Math.round(cvar95 * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    },
    assetImpacts,
    tradeRouteImpact: {
      tradeAtRiskPct: tradeAtRisk,
      affectedRoutes,
      estimatedSupplyChainCost: scenario.supplyChainCostPct,
    },
  };
}

/**
 * Calculate the diversification score of a portfolio against geopolitical risk.
 * A well-diversified portfolio has low correlation between assets during stress.
 *
 * @param portfolio - Portfolio holdings
 * @returns Score 0-100 (higher = better diversified)
 */
export function calculateDiversificationScore(portfolio: PortfolioHolding[]): number {
  if (portfolio.length <= 1) return 0;

  // Average pairwise correlation during stress
  let totalCorr = 0;
  let pairCount = 0;

  for (let i = 0; i < portfolio.length; i++) {
    for (let j = i + 1; j < portfolio.length; j++) {
      const corr = Math.abs(STRESS_CORRELATIONS[portfolio[i].symbol]?.[portfolio[j].symbol] ?? 0.3);
      totalCorr += corr;
      pairCount++;
    }
  }

  const avgCorrelation = pairCount > 0 ? totalCorr / pairCount : 0.5;

  // Convert to score: avgCorr 0 → 100, avgCorr 1 → 0
  const score = Math.max(0, Math.min(100, (1 - avgCorrelation) * 120));
  return Math.round(score);
}

/**
 * Run stress tests on the portfolio.
 */
export function runStressTests(portfolio: PortfolioHolding[]): StressTestResult[] {
  const tests: StressTestResult[] = [
    {
      testName: 'Oil Price Shock +40%',
      testNameAr: 'صدمة أسعار النفط +40%',
      portfolioImpact: 0,
      worstAsset: '',
      recoveryTimeMonths: 0,
    },
    {
      testName: 'Middle East Conflict',
      testNameAr: 'صراع شرق أوسطي',
      portfolioImpact: 0,
      worstAsset: '',
      recoveryTimeMonths: 0,
    },
    {
      testName: 'Global Trade Disruption',
      testNameAr: 'اضطراب التجارة العالمية',
      portfolioImpact: 0,
      worstAsset: '',
      recoveryTimeMonths: 0,
    },
  ];

  // Oil shock
  let oilImpact = 0;
  let worstOilAsset = '';
  let worstOilChange = 0;
  for (const h of portfolio) {
    const shockMap: Record<string, number> = {
      'OIL': 40, 'GOLD': 8, 'USD': -4, 'TASI': -15, 'SP500': -8, 'BONDS': 2,
    };
    const change = shockMap[h.symbol] ?? -5;
    const contribution = h.allocation * change;
    oilImpact += contribution;
    if (contribution < worstOilChange) {
      worstOilChange = contribution;
      worstOilAsset = h.nameEn;
    }
  }
  tests[0].portfolioImpact = Math.round(oilImpact * 100) / 100;
  tests[0].worstAsset = worstOilAsset || 'TASI';
  tests[0].recoveryTimeMonths = Math.max(3, Math.round(Math.abs(oilImpact) * 0.5));

  // Middle East conflict
  let meImpact = 0;
  let worstMEAsset = '';
  let worstMEChange = 0;
  for (const h of portfolio) {
    const shockMap: Record<string, number> = {
      'OIL': 25, 'GOLD': 12, 'USD': -5, 'TASI': -25, 'SP500': -10, 'BONDS': 3,
    };
    const change = shockMap[h.symbol] ?? -8;
    const contribution = h.allocation * change;
    meImpact += contribution;
    if (contribution < worstMEChange) {
      worstMEChange = contribution;
      worstMEAsset = h.nameEn;
    }
  }
  tests[1].portfolioImpact = Math.round(meImpact * 100) / 100;
  tests[1].worstAsset = worstMEAsset || 'TASI';
  tests[1].recoveryTimeMonths = Math.max(4, Math.round(Math.abs(meImpact) * 0.6));

  // Global trade disruption
  let tradeImpact = 0;
  let worstTradeAsset = '';
  let worstTradeChange = 0;
  for (const h of portfolio) {
    const shockMap: Record<string, number> = {
      'OIL': 15, 'GOLD': 10, 'USD': 2, 'TASI': -12, 'SP500': -12, 'BONDS': 4,
    };
    const change = shockMap[h.symbol] ?? -6;
    const contribution = h.allocation * change;
    tradeImpact += contribution;
    if (contribution < worstTradeChange) {
      worstTradeChange = contribution;
      worstTradeAsset = h.nameEn;
    }
  }
  tests[2].portfolioImpact = Math.round(tradeImpact * 100) / 100;
  tests[2].worstAsset = worstTradeAsset || 'SP500';
  tests[2].recoveryTimeMonths = Math.max(6, Math.round(Math.abs(tradeImpact) * 0.8));

  return tests;
}

/**
 * Calculate full economic impact analysis across all scenarios.
 */
export function calculateEconomicImpact(
  portfolio: PortfolioHolding[] = DEFAULT_PORTFOLIO
): EconomicImpactResult {
  const scenarioImpacts = GEO_ECONOMIC_SCENARIOS.map(scenario =>
    calculateScenarioImpact(portfolio, scenario)
  );

  // Aggregate VaR: probability-weighted
  let aggregateVaR = 0;
  let aggregateCVaR = 0;

  for (const impact of scenarioImpacts) {
    aggregateVaR += impact.probability * impact.portfolioImpact.var95;
    aggregateCVaR += impact.probability * impact.portfolioImpact.cvar95;
  }

  const diversificationScore = calculateDiversificationScore(portfolio);
  const stressTests = runStressTests(portfolio);

  return {
    portfolio,
    scenarios: scenarioImpacts,
    aggregateVaR: Math.round(aggregateVaR * 100) / 100,
    aggregateCVaR: Math.round(aggregateCVaR * 100) / 100,
    diversificationScore,
    stressTestResults: stressTests,
  };
}
