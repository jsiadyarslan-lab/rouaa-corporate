// ─── Monte Carlo Simulation Engine ─────────────────────────────
// Rouaa Geopolitical Scenario Modeling
// Generates probability distributions for market impacts
// Uses Box-Muller transform for normal distribution sampling

export interface ScenarioInput {
  name: string;
  probability: number;     // 0-1
  marketImpacts: {
    symbol: string;        // e.g. "OIL", "GOLD", "TASI"
    baseChange: number;    // % change in base scenario
    adverseChange: number; // % change in adverse scenario
    severeChange: number;  // % change in severe scenario
    volatility: number;    // standard deviation
  }[];
}

export interface SimulationResult {
  symbol: string;
  baseP50: number;         // median outcome
  adverseP50: number;
  severeP50: number;
  confidenceInterval: {
    p5: number;            // 5th percentile
    p25: number;           // 25th percentile
    p75: number;           // 75th percentile
    p95: number;           // 95th percentile
  };
  distribution: number[];  // histogram buckets for visualization
}

/**
 * Generate a normally distributed random number using the Box-Muller transform.
 * Takes two uniform random numbers and outputs one normally distributed number.
 * The second output is cached for efficiency.
 *
 * @param mean - Mean of the normal distribution (default: 0)
 * @param stdDev - Standard deviation (default: 1)
 * @returns A normally distributed random number
 */
function randomNormal(mean: number = 0, stdDev: number = 1): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  // Avoid log(0) by ensuring u1 > 0
  const safeU1 = Math.max(Number.EPSILON, u1);
  const z0 = Math.sqrt(-2.0 * Math.log(safeU1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Compute the percentile of a sorted array.
 * Uses linear interpolation between adjacent values.
 *
 * @param sorted - Sorted array of numbers
 * @param percentile - Percentile to compute (0-1)
 * @returns The percentile value
 */
function percentile(sorted: number[], percentile: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = percentile * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  if (lower === upper) return sorted[lower];

  return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
}

/**
 * Build a histogram from a set of values.
 * Returns an array of counts for each bucket.
 *
 * @param values - Array of numerical values
 * @param numBuckets - Number of histogram buckets (default: 20)
 * @returns Array of bucket counts
 */
function buildHistogram(values: number[], numBuckets: number = 20): number[] {
  if (values.length === 0) return new Array(numBuckets).fill(0);

  // Use loop-based min/max instead of Math.min(...values) / Math.max(...values)
  // to avoid "Maximum call stack size exceeded" with large arrays (10,000+ elements)
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const range = max - min || 1; // Avoid division by zero
  const bucketSize = range / numBuckets;

  const buckets = new Array(numBuckets).fill(0);

  for (const v of values) {
    let bucketIndex = Math.floor((v - min) / bucketSize);
    // Clamp to last bucket for max values
    if (bucketIndex >= numBuckets) bucketIndex = numBuckets - 1;
    buckets[bucketIndex]++;
  }

  return buckets;
}

/**
 * Run a Monte Carlo simulation for a given geopolitical scenario.
 *
 * For each market asset, the simulation:
 * 1. Generates N random scenarios based on the probability of occurrence
 * 2. For scenarios where the event occurs, samples from a normal distribution
 *    centered around the impact change with the given volatility
 * 3. Computes median outcomes for base, adverse, and severe scenarios
 * 4. Calculates confidence intervals (P5, P25, P75, P95)
 * 5. Builds a histogram for visualization
 *
 * @param input - Scenario definition with probabilities and market impacts
 * @param iterations - Number of Monte Carlo iterations (default: 10000)
 * @returns Array of simulation results, one per market asset
 */
export function runMonteCarloSimulation(
  input: ScenarioInput,
  iterations: number = 10000
): SimulationResult[] {
  const results: SimulationResult[] = [];

  for (const impact of input.marketImpacts) {
    const baseOutcomes: number[] = [];
    const adverseOutcomes: number[] = [];
    const severeOutcomes: number[] = [];
    const allOutcomes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      // Determine if the scenario occurs based on its probability
      const scenarioOccurs = Math.random() < input.probability;

      if (!scenarioOccurs) {
        // No event: zero impact
        baseOutcomes.push(0);
        adverseOutcomes.push(0);
        severeOutcomes.push(0);
        allOutcomes.push(0);
        continue;
      }

      // Base scenario: sample around baseChange with volatility
      const baseValue = impact.baseChange + randomNormal(0, impact.volatility * 0.5);
      baseOutcomes.push(baseValue);

      // Adverse scenario: sample around adverseChange with higher volatility
      const adverseValue = impact.adverseChange + randomNormal(0, impact.volatility * 0.75);
      adverseOutcomes.push(adverseValue);

      // Severe scenario: sample around severeChange with full volatility
      const severeValue = impact.severeChange + randomNormal(0, impact.volatility);
      severeOutcomes.push(severeValue);

      // Weighted combination based on scenario severity probabilities
      // Base: 60%, Adverse: 30%, Severe: 10%
      const combinedValue = 0.6 * baseValue + 0.3 * adverseValue + 0.1 * severeValue;
      allOutcomes.push(combinedValue);
    }

    // Sort for percentile calculations
    const sortedAll = [...allOutcomes].sort((a, b) => a - b);
    const sortedBase = [...baseOutcomes].sort((a, b) => a - b);
    const sortedAdverse = [...adverseOutcomes].sort((a, b) => a - b);
    const sortedSevere = [...severeOutcomes].sort((a, b) => a - b);

    // Calculate percentiles
    const p5 = Math.round(percentile(sortedAll, 0.05) * 100) / 100;
    const p25 = Math.round(percentile(sortedAll, 0.25) * 100) / 100;
    const p75 = Math.round(percentile(sortedAll, 0.75) * 100) / 100;
    const p95 = Math.round(percentile(sortedAll, 0.95) * 100) / 100;

    results.push({
      symbol: impact.symbol,
      baseP50: Math.round(percentile(sortedBase, 0.5) * 100) / 100,
      adverseP50: Math.round(percentile(sortedAdverse, 0.5) * 100) / 100,
      severeP50: Math.round(percentile(sortedSevere, 0.5) * 100) / 100,
      confidenceInterval: { p5, p25, p75, p95 },
      distribution: buildHistogram(allOutcomes, 20),
    });
  }

  return results;
}

/**
 * Run simulation for multiple scenarios and aggregate results.
 * Each scenario is simulated independently, then results are combined
 * using a weighted average based on scenario probability.
 *
 * @param scenarios - Array of scenario inputs
 * @param iterations - Number of iterations per scenario
 * @returns Aggregated simulation results
 */
export function runMultiScenarioSimulation(
  scenarios: ScenarioInput[],
  iterations: number = 10000
): Map<string, SimulationResult> {
  const aggregatedResults = new Map<string, SimulationResult>();

  // Collect all unique symbols across scenarios
  const allSymbols = new Set<string>();
  for (const scenario of scenarios) {
    for (const impact of scenario.marketImpacts) {
      allSymbols.add(impact.symbol);
    }
  }

  // Run each scenario independently
  const scenarioResults: Map<string, SimulationResult[]> = new Map();

  Array.from(allSymbols).forEach((symbol) => {
    scenarioResults.set(symbol, []);
  });

  for (const scenario of scenarios) {
    const results = runMonteCarloSimulation(scenario, iterations);
    for (const result of results) {
      const existing = scenarioResults.get(result.symbol);
      if (existing) {
        existing.push(result);
      }
    }
  }

  // Aggregate results per symbol using weighted average
  Array.from(scenarioResults.entries()).forEach(([symbol, results]) => {
    if (results.length === 0) return;

    // Weight by number of scenarios (equal weight for now)
    const weight = 1 / results.length;

    const baseP50 = results.reduce((sum, r) => sum + r.baseP50 * weight, 0);
    const adverseP50 = results.reduce((sum, r) => sum + r.adverseP50 * weight, 0);
    const severeP50 = results.reduce((sum, r) => sum + r.severeP50 * weight, 0);

    // Aggregate confidence intervals
    const p5 = results.reduce((sum, r) => sum + r.confidenceInterval.p5 * weight, 0);
    const p25 = results.reduce((sum, r) => sum + r.confidenceInterval.p25 * weight, 0);
    const p75 = results.reduce((sum, r) => sum + r.confidenceInterval.p75 * weight, 0);
    const p95 = results.reduce((sum, r) => sum + r.confidenceInterval.p95 * weight, 0);

    // Merge distributions by averaging bucket counts
    const numBuckets = results[0].distribution.length;
    const mergedDistribution = new Array(numBuckets).fill(0);
    for (const r of results) {
      for (let i = 0; i < numBuckets; i++) {
        mergedDistribution[i] += (r.distribution[i] || 0) * weight;
      }
    }

    aggregatedResults.set(symbol, {
      symbol,
      baseP50: Math.round(baseP50 * 100) / 100,
      adverseP50: Math.round(adverseP50 * 100) / 100,
      severeP50: Math.round(severeP50 * 100) / 100,
      confidenceInterval: {
        p5: Math.round(p5 * 100) / 100,
        p25: Math.round(p25 * 100) / 100,
        p75: Math.round(p75 * 100) / 100,
        p95: Math.round(p95 * 100) / 100,
      },
      distribution: mergedDistribution.map((d) => Math.round(d)),
    });
  });

  return aggregatedResults;
}
