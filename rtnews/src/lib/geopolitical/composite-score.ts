// ─── Rouaa Geopolitical Index (RGI) — Composite Risk Score Calculator ───
// Default Formula: RGI = 0.35*GPR + 0.25*ACLED + 0.20*WorldBank + 0.10*GDELT + 0.10*PeaceIndex
// FM Global Equal-Weight: RGI = 0.20*each component (5 components)
// User can override weights for different contexts (investor, analyst, supply chain manager)
// All inputs normalized to 0-100 scale before weighting

import { type RiskLevel, getRiskLevel } from './risk-thresholds';

export interface ScoreComponents {
  gprScore?: number;        // GPR/AI-GPR index (raw scale varies, normalize)
  acledScore?: number;      // Based on event count + fatality count
  worldBankScore?: number;  // WGI Political Stability (-2.5 to +2.5)
  gdeltScore?: number;      // GDELT tone (-10 to +10)
  peaceIndexScore?: number; // Global Peace Index (1-5 scale, inverted)
}

export type WeightingMode = 'default' | 'fm_global' | 'investor' | 'analyst' | 'supply_chain';

export interface CompositeResult {
  compositeScore: number;    // 0-100
  riskLevel: RiskLevel;
  weightingMode: WeightingMode;
  components: {
    gpr: { value: number; weight: number; normalized: number };
    acled: { value: number; weight: number; normalized: number };
    worldBank: { value: number; weight: number; normalized: number };
    gdelt: { value: number; weight: number; normalized: number };
    peaceIndex: { value: number; weight: number; normalized: number };
  };
}

// ─── Weight Presets ─────────────────────────────────────────────
// Default: Original Rouaa weighting with GPR as primary signal
// FM Global: Equal weighting per FM Global Resilience Index methodology
// Investor: Emphasize market-impacting signals (GPR + GDELT)
// Analyst: Emphasize conflict data (ACLED + GPR)
// Supply Chain: Emphasize stability and trade (WorldBank + PeaceIndex)

const WEIGHT_PRESETS: Record<WeightingMode, Record<string, number>> = {
  default: {
    gpr: 0.35,
    acled: 0.25,
    worldBank: 0.20,
    gdelt: 0.10,
    peaceIndex: 0.10,
  },
  fm_global: {
    gpr: 0.20,
    acled: 0.20,
    worldBank: 0.20,
    gdelt: 0.20,
    peaceIndex: 0.20,
  },
  investor: {
    gpr: 0.30,
    acled: 0.15,
    worldBank: 0.15,
    gdelt: 0.25,
    peaceIndex: 0.15,
  },
  analyst: {
    gpr: 0.30,
    acled: 0.30,
    worldBank: 0.15,
    gdelt: 0.10,
    peaceIndex: 0.15,
  },
  supply_chain: {
    gpr: 0.20,
    acled: 0.15,
    worldBank: 0.30,
    gdelt: 0.10,
    peaceIndex: 0.25,
  },
};

// Default weights constant (backwards-compatible)
const WEIGHTS = WEIGHT_PRESETS.default;

/**
 * Normalize GPR (Geopolitical Risk Index) raw value to 0-100.
 * GPR values typically range 0-500+, with historical peaks ~500-600.
 * Uses sigmoid-like compression for extreme values.
 * @param raw - Raw GPR index value (0-500+)
 * @returns Normalized score 0-100
 */
export function normalizeGPR(raw: number): number {
  if (raw <= 0) return 0;
  // GPR typical range: 0 (peace) to ~500 (extreme conflict)
  // Use square-root compression to handle the wide range
  const normalized = (Math.sqrt(raw) / Math.sqrt(500)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Normalize ACLED conflict data (event count + fatality count) to 0-100.
 * Uses a logarithmic scale to handle the extreme variance in conflict data.
 * @param events - Number of conflict events in period
 * @param fatalities - Number of fatalities in period
 * @returns Normalized score 0-100
 */
export function normalizeACLED(events: number, fatalities: number): number {
  if (events <= 0 && fatalities <= 0) return 0;

  // Event score: log scale, 0-1000+ events typical range
  const eventScore = events > 0 ? Math.min(100, (Math.log10(events + 1) / Math.log10(1001)) * 100) : 0;

  // Fatality score: log scale, 0-10000+ fatalities in severe conflicts
  const fatalityScore = fatalities > 0 ? Math.min(100, (Math.log10(fatalities + 1) / Math.log10(10001)) * 100) : 0;

  // Weight fatalities more heavily (60/40 split)
  const combined = 0.4 * eventScore + 0.6 * fatalityScore;
  return Math.max(0, Math.min(100, combined));
}

/**
 * Normalize World Bank WGI Political Stability index to 0-100.
 * WGI range: -2.5 (very unstable) to +2.5 (very stable).
 * We invert so that instability maps to higher scores.
 * @param raw - WGI Political Stability value (-2.5 to +2.5)
 * @returns Normalized score 0-100 (higher = more risk)
 */
export function normalizeWorldBank(raw: number): number {
  // Clamp to valid range
  const clamped = Math.max(-2.5, Math.min(2.5, raw));
  // Invert and normalize: -2.5 → 100 (most risky), +2.5 → 0 (most stable)
  const normalized = ((2.5 - clamped) / 5.0) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Normalize GDELT tone value to 0-100 risk score.
 * GDELT tone ranges from -10 (extremely negative) to +10 (extremely positive).
 * We invert so that negative tone (more conflict coverage) → higher risk.
 * @param raw - GDELT average tone (-10 to +10)
 * @returns Normalized score 0-100 (higher = more risk)
 */
export function normalizeGDELT(raw: number): number {
  // Clamp to valid range
  const clamped = Math.max(-10, Math.min(10, raw));
  // Invert and normalize: -10 → 100 (most risky), +10 → 0 (least risky)
  const normalized = ((10 - clamped) / 20) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Normalize Global Peace Index to 0-100 risk score.
 * GPI range: 1 (most peaceful) to 5 (least peaceful).
 * Since higher GPI = less peaceful, we map directly (higher = more risk).
 * @param raw - Global Peace Index value (1-5)
 * @returns Normalized score 0-100 (higher = more risk)
 */
export function normalizePeaceIndex(raw: number): number {
  // Clamp to valid range
  const clamped = Math.max(1, Math.min(5, raw));
  // Normalize: 1 → 0 (most peaceful), 5 → 100 (least peaceful)
  const normalized = ((clamped - 1) / 4) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Calculate the Rouaa Geopolitical Index (RGI) composite score.
 *
 * Supports multiple weighting modes per FM Global methodology:
 * - 'default': Original Rouaa weighting (0.35/0.25/0.20/0.10/0.10)
 * - 'fm_global': Equal weighting (0.20 each) per FM Global Resilience Index
 * - 'investor': Market-impact emphasis
 * - 'analyst': Conflict-data emphasis
 * - 'supply_chain': Stability and trade emphasis
 *
 * Each component is first normalized to 0-100, then weighted.
 * Missing components use a default of 50 (moderate risk) to avoid
 * underestimating risk when data is unavailable.
 *
 * @param components - The raw score components from various data sources
 * @param weightingMode - Which weight preset to use (default: 'default')
 * @param customWeights - Optional custom weights to override presets
 * @returns Composite result with score, risk level, and detailed component breakdown
 */
export function calculateCompositeScore(
  components: ScoreComponents,
  weightingMode: WeightingMode = 'default',
  customWeights?: Partial<Record<string, number>>
): CompositeResult {
  // Default missing components to 50 (moderate risk)
  // This avoids underestimating risk when data sources are unavailable
  const DEFAULT_SCORE = 50;

  // Normalize each component
  const gprRaw = components.gprScore ?? DEFAULT_SCORE;
  const acledRaw = components.acledScore ?? DEFAULT_SCORE;
  const worldBankRaw = components.worldBankScore ?? DEFAULT_SCORE;
  const gdeltRaw = components.gdeltScore ?? DEFAULT_SCORE;
  const peaceIndexRaw = components.peaceIndexScore ?? DEFAULT_SCORE;

  const gprNormalized = components.gprScore !== undefined ? normalizeGPR(gprRaw) : DEFAULT_SCORE;
  // Fix: When ACLED data is missing, use DEFAULT_SCORE directly instead of
  // passing it through normalizeACLED (which treats the value as event count).
  // This was causing countries without ACLED data to get ~33 instead of 50.
  const acledNormalized = components.acledScore !== undefined
    ? normalizeACLED(acledRaw, 0)
    : DEFAULT_SCORE;
  const worldBankNormalized = components.worldBankScore !== undefined
    ? normalizeWorldBank(worldBankRaw)
    : DEFAULT_SCORE;
  const gdeltNormalized = components.gdeltScore !== undefined
    ? normalizeGDELT(gdeltRaw)
    : DEFAULT_SCORE;
  const peaceIndexNormalized = components.peaceIndexScore !== undefined
    ? normalizePeaceIndex(peaceIndexRaw)
    : DEFAULT_SCORE;

  // Get weights based on mode
  const selectedWeights = customWeights
    ? { ...WEIGHT_PRESETS[weightingMode], ...customWeights }
    : WEIGHT_PRESETS[weightingMode];

  // Normalize custom weights to sum to 1
  const weightSum = Object.values(selectedWeights).reduce((s, v) => s + v, 0);
  const w = {
    gpr: selectedWeights.gpr / weightSum,
    acled: selectedWeights.acled / weightSum,
    worldBank: selectedWeights.worldBank / weightSum,
    gdelt: selectedWeights.gdelt / weightSum,
    peaceIndex: selectedWeights.peaceIndex / weightSum,
  };

  // Calculate weighted composite
  const compositeScore =
    w.gpr * gprNormalized +
    w.acled * acledNormalized +
    w.worldBank * worldBankNormalized +
    w.gdelt * gdeltNormalized +
    w.peaceIndex * peaceIndexNormalized;

  // Clamp to 0-100
  const finalScore = Math.max(0, Math.min(100, Math.round(compositeScore * 100) / 100));

  return {
    compositeScore: finalScore,
    riskLevel: getRiskLevel(finalScore),
    weightingMode,
    components: {
      gpr: { value: gprRaw, weight: Math.round(w.gpr * 100) / 100, normalized: Math.round(gprNormalized * 100) / 100 },
      acled: { value: acledRaw, weight: Math.round(w.acled * 100) / 100, normalized: Math.round(acledNormalized * 100) / 100 },
      worldBank: { value: worldBankRaw, weight: Math.round(w.worldBank * 100) / 100, normalized: Math.round(worldBankNormalized * 100) / 100 },
      gdelt: { value: gdeltRaw, weight: Math.round(w.gdelt * 100) / 100, normalized: Math.round(gdeltNormalized * 100) / 100 },
      peaceIndex: { value: peaceIndexRaw, weight: Math.round(w.peaceIndex * 100) / 100, normalized: Math.round(peaceIndexNormalized * 100) / 100 },
    },
  };
}
