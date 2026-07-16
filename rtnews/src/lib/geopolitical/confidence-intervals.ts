// ─── Confidence Intervals Engine ─────────────────────────────
// Rouaa Geopolitical Risk Platform
// Computes statistical confidence intervals for all risk scores
// based on Monte Carlo simulation distributions.
// Top Priority: Easiest to implement, highest impact on credibility.

export interface ConfidenceInterval {
  point: number;       // Central estimate (median)
  lower95: number;     // 2.5th percentile
  upper95: number;     // 97.5th percentile
  marginOfError: number; // Half-width of 95% CI (e.g., ±8)
  sampleSize: number;  // Number of simulation iterations
  stdDev: number;      // Standard deviation of the distribution
}

export interface ScoreWithCI {
  score: number;
  ci: ConfidenceInterval;
  display: string;     // e.g., "72 ±8"
  level95: string;     // e.g., "64–80"
}

/**
 * Compute a confidence interval from an array of Monte Carlo simulation outcomes.
 * Uses the percentile method (non-parametric) for the 95% CI.
 *
 * @param outcomes - Array of numerical outcomes from Monte Carlo simulation
 * @param confidenceLevel - Confidence level (default: 0.95 for 95% CI)
 * @returns ConfidenceInterval object with point estimate and bounds
 */
export function computeConfidenceInterval(
  outcomes: number[],
  confidenceLevel: number = 0.95
): ConfidenceInterval {
  if (outcomes.length === 0) {
    return {
      point: 0,
      lower95: 0,
      upper95: 0,
      marginOfError: 0,
      sampleSize: 0,
      stdDev: 0,
    };
  }

  const sorted = [...outcomes].sort((a, b) => a - b);
  const n = sorted.length;

  // Point estimate: median
  const median = percentile(sorted, 0.5);

  // CI bounds
  const alpha = 1 - confidenceLevel;
  const lowerP = alpha / 2;       // 0.025 for 95%
  const upperP = 1 - alpha / 2;   // 0.975 for 95%

  const lower = percentile(sorted, lowerP);
  const upper = percentile(sorted, upperP);

  // Standard deviation
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1 || 1);
  const stdDev = Math.sqrt(variance);

  return {
    point: Math.round(median * 100) / 100,
    lower95: Math.round(lower * 100) / 100,
    upper95: Math.round(upper * 100) / 100,
    marginOfError: Math.round(((upper - lower) / 2) * 100) / 100,
    sampleSize: n,
    stdDev: Math.round(stdDev * 100) / 100,
  };
}

/**
 * Create a ScoreWithCI object for easy display in the UI.
 * Formats the score as "72 ±8" and the range as "64–80".
 *
 * @param score - The point estimate (median) score
 * @param ci - The confidence interval
 * @returns ScoreWithCI with formatted display strings
 */
export function formatScoreWithCI(score: number, ci: ConfidenceInterval): ScoreWithCI {
  const roundedScore = Math.round(score);
  const roundedMOE = Math.round(ci.marginOfError);
  const roundedLower = Math.round(ci.lower95);
  const roundedUpper = Math.round(ci.upper95);

  return {
    score: roundedScore,
    ci,
    display: `${roundedScore} \u00B1${roundedMOE}`,
    level95: `${roundedLower}\u2013${roundedUpper}`,
  };
}

/**
 * Compute confidence intervals for all components of a composite score.
 * Takes the Monte Carlo distribution for each component and returns
 * a map of component key → ScoreWithCI.
 *
 * @param componentDistributions - Map of component key to array of outcomes
 * @returns Map of component key to ScoreWithCI
 */
export function computeComponentCIs(
  componentDistributions: Map<string, number[]>
): Map<string, ScoreWithCI> {
  const result = new Map<string, ScoreWithCI>();

  for (const [key, outcomes] of componentDistributions) {
    const ci = computeConfidenceInterval(outcomes);
    const scoreWithCI = formatScoreWithCI(ci.point, ci);
    result.set(key, scoreWithCI);
  }

  return result;
}

/**
 * Compute CI from Monte Carlo SimulationResult distribution + percentiles.
 * If the distribution histogram is available, reconstruct approximate CI.
 * Otherwise, use the p5/p95 values directly.
 *
 * @param p50 - Median value
 * @param p5 - 5th percentile
 * @param p95 - 95th percentile
 * @param iterations - Number of simulation iterations
 * @returns ScoreWithCI formatted for display
 */
export function ciFromSimulationPercentiles(
  p50: number,
  p5: number,
  p95: number,
  iterations: number = 10000
): ScoreWithCI {
  const ci: ConfidenceInterval = {
    point: p50,
    lower95: p5,
    upper95: p95,
    marginOfError: (p95 - p5) / 2,
    sampleSize: iterations,
    stdDev: (p95 - p5) / (2 * 1.96), // Approximate from 95% CI width
  };

  return formatScoreWithCI(p50, ci);
}

/**
 * Generate Monte Carlo outcomes for a single risk component
 * to produce confidence intervals even without running a full simulation.
 * Uses a beta distribution approximation for bounded scores (0-100).
 *
 * @param baseScore - The base risk score (0-100)
 * @param uncertainty - Uncertainty level (0-1, higher = wider CI)
 * @param iterations - Number of MC iterations
 * @returns Array of simulated outcomes
 */
export function generateComponentOutcomes(
  baseScore: number,
  uncertainty: number = 0.3,
  iterations: number = 5000
): number[] {
  const outcomes: number[] = [];
  const clampedBase = Math.max(0, Math.min(100, baseScore));

  // Map score to beta distribution parameters
  // Higher uncertainty → more spread
  const alpha = Math.max(0.5, clampedBase / 100 * (1 / uncertainty));
  const beta = Math.max(0.5, (100 - clampedBase) / 100 * (1 / uncertainty));

  for (let i = 0; i < iterations; i++) {
    const sample = sampleBeta(alpha, beta);
    outcomes.push(Math.round(sample * 10000) / 100); // 0-100 with 2 decimal places
  }

  return outcomes;
}

// ─── Helper: Percentile computation ────────────────────────────
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  if (lower === upper) return sorted[lower];
  return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
}

// ─── Helper: Beta distribution sampling (Jöhnk's algorithm) ───
function sampleBeta(alpha: number, beta: number): number {
  // Use gamma distribution: Beta(a,b) = Gamma(a) / (Gamma(a) + Gamma(b))
  const x = sampleGamma(alpha);
  const y = sampleGamma(beta);
  return x / (x + y);
}

function sampleGamma(shape: number): number {
  // Marsaglia and Tsang's method for shape >= 1
  if (shape < 1) {
    // For shape < 1, use the transformation: X = Y^(1/shape) where Y ~ Gamma(shape+1)
    return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x: number;
    let v: number;
    do {
      const u1 = Math.random();
      const u2 = Math.random();
      x = Math.sqrt(-2 * Math.log(Math.max(Number.EPSILON, u1))) * Math.cos(2 * Math.PI * u2);
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
