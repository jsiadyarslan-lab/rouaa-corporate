// ─── Monte Carlo Web Worker ────────────────────────────────────
// Offloads Monte Carlo simulation to a background thread
// Communicates via postMessage / onmessage protocol

// ─── Types (mirrored from monte-carlo.ts) ──────────────────────

interface ScenarioInput {
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

interface SimulationResult {
  symbol: string;
  baseP50: number;
  adverseP50: number;
  severeP50: number;
  confidenceInterval: {
    p5: number;
    p25: number;
    p75: number;
    p95: number;
  };
  distribution: number[];
}

// ─── Inbound message types ─────────────────────────────────────

interface RunSingleMessage {
  type: 'run';
  input: ScenarioInput;
  iterations: number;
}

interface RunMultiMessage {
  type: 'runMulti';
  scenarios: ScenarioInput[];
  iterations: number;
}

type WorkerInbound = RunSingleMessage | RunMultiMessage;

// ─── Outbound message types ────────────────────────────────────

interface SingleResultMessage {
  type: 'result';
  data: SimulationResult[];
}

interface MultiResultMessage {
  type: 'multiResult';
  data: [string, SimulationResult][]; // Map entries (Map can't be serialized)
}

type WorkerOutbound = SingleResultMessage | MultiResultMessage;

// ─── Core Simulation Logic (copied from monte-carlo.ts) ───────

/**
 * Generate a normally distributed random number using the Box-Muller transform.
 * Takes two uniform random numbers and outputs one normally distributed number.
 */
function randomNormal(mean: number = 0, stdDev: number = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const safeU1 = Math.max(Number.EPSILON, u1);
  const z0 = Math.sqrt(-2.0 * Math.log(safeU1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Compute the percentile of a sorted array.
 * Uses linear interpolation between adjacent values.
 */
function percentile(sorted: number[], pct: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = pct * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  if (lower === upper) return sorted[lower];

  return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
}

/**
 * Build a histogram from a set of values.
 * Returns an array of counts for each bucket.
 */
function buildHistogram(values: number[], numBuckets: number = 20): number[] {
  if (values.length === 0) return new Array(numBuckets).fill(0);

  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const range = max - min || 1;
  const bucketSize = range / numBuckets;

  const buckets = new Array(numBuckets).fill(0);

  for (const v of values) {
    let bucketIndex = Math.floor((v - min) / bucketSize);
    if (bucketIndex >= numBuckets) bucketIndex = numBuckets - 1;
    buckets[bucketIndex]++;
  }

  return buckets;
}

/**
 * Run a Monte Carlo simulation for a given geopolitical scenario.
 */
function runMonteCarloSimulation(
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
      const scenarioOccurs = Math.random() < input.probability;

      if (!scenarioOccurs) {
        baseOutcomes.push(0);
        adverseOutcomes.push(0);
        severeOutcomes.push(0);
        allOutcomes.push(0);
        continue;
      }

      const baseValue = impact.baseChange + randomNormal(0, impact.volatility * 0.5);
      baseOutcomes.push(baseValue);

      const adverseValue = impact.adverseChange + randomNormal(0, impact.volatility * 0.75);
      adverseOutcomes.push(adverseValue);

      const severeValue = impact.severeChange + randomNormal(0, impact.volatility);
      severeOutcomes.push(severeValue);

      const combinedValue = 0.6 * baseValue + 0.3 * adverseValue + 0.1 * severeValue;
      allOutcomes.push(combinedValue);
    }

    const sortedAll = [...allOutcomes].sort((a, b) => a - b);
    const sortedBase = [...baseOutcomes].sort((a, b) => a - b);
    const sortedAdverse = [...adverseOutcomes].sort((a, b) => a - b);
    const sortedSevere = [...severeOutcomes].sort((a, b) => a - b);

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
 */
function runMultiScenarioSimulation(
  scenarios: ScenarioInput[],
  iterations: number = 10000
): Map<string, SimulationResult> {
  const aggregatedResults = new Map<string, SimulationResult>();

  const allSymbols = new Set<string>();
  for (const scenario of scenarios) {
    for (const impact of scenario.marketImpacts) {
      allSymbols.add(impact.symbol);
    }
  }

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

  Array.from(scenarioResults.entries()).forEach(([symbol, results]) => {
    if (results.length === 0) return;

    const weight = 1 / results.length;

    const baseP50 = results.reduce((sum, r) => sum + r.baseP50 * weight, 0);
    const adverseP50 = results.reduce((sum, r) => sum + r.adverseP50 * weight, 0);
    const severeP50 = results.reduce((sum, r) => sum + r.severeP50 * weight, 0);

    const p5 = results.reduce((sum, r) => sum + r.confidenceInterval.p5 * weight, 0);
    const p25 = results.reduce((sum, r) => sum + r.confidenceInterval.p25 * weight, 0);
    const p75 = results.reduce((sum, r) => sum + r.confidenceInterval.p75 * weight, 0);
    const p95 = results.reduce((sum, r) => sum + r.confidenceInterval.p95 * weight, 0);

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

// ─── Worker Message Handler ────────────────────────────────────

self.onmessage = (event: MessageEvent<WorkerInbound>) => {
  const msg = event.data;

  if (msg.type === 'run') {
    const data = runMonteCarloSimulation(msg.input, msg.iterations);
    const response: SingleResultMessage = { type: 'result', data };
    self.postMessage(response);
  }

  if (msg.type === 'runMulti') {
    const resultMap = runMultiScenarioSimulation(msg.scenarios, msg.iterations);
    // Convert Map to array of entries for serialization
    const data: [string, SimulationResult][] = Array.from(resultMap.entries());
    const response: MultiResultMessage = { type: 'multiResult', data };
    self.postMessage(response);
  }
};
