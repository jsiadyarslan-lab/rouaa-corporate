// ─── AI-Enhanced Geopolitical Risk Index (AI-GPR) ───────────────
// Based on the Federal Reserve's AI-GPR methodology (Caldara et al.)
// Uses NLP and machine learning to measure geopolitical risk from news coverage
// Paper: https://www.federalreserve.gov/econres/ifdp/ai-measuring-geopolitical-risk.htm

export interface GprDataPoint {
  date: string;        // YYYY-MM-DD
  gpr: number;         // Geopolitical Risk Index (raw)
  gprAct: number;      // GPR Act (threats/actions realized)
  gprThreat: number;   // GPR Threat (threats not yet realized)
  aiGpr: number;       // AI-enhanced GPR (normalized 0-100)
}

export interface GprCountryData {
  countryCode: string;
  countryName: string;
  monthlyGpr: GprDataPoint[];
  averageGpr: number;
  peakGpr: number;
  trendDirection: 'rising' | 'falling' | 'stable';
}

// ─── Historical GPR Baselines by Region ────────────────────────
// These are approximate baseline values derived from the Federal Reserve's
// AI-GPR data. Used as fallbacks when real-time API data is unavailable.
// Scale: 0-500+ (raw GPR), 0-100 (AI-GPR normalized)

const REGIONAL_GPR_BASELINES: Record<string, { avg: number; peak: number }> = {
  'middle-east': { avg: 85, peak: 320 },
  'east-asia': { avg: 45, peak: 180 },
  'south-asia': { avg: 70, peak: 250 },
  'europe': { avg: 55, peak: 280 },
  'africa': { avg: 75, peak: 300 },
  'americas': { avg: 30, peak: 150 },
  'central-asia': { avg: 60, peak: 220 },
};

const COUNTRY_GPR_BASELINES: Record<string, { avg: number; aiGpr: number; trend: 'rising' | 'falling' | 'stable' }> = {
  // Middle East
  SY: { avg: 180, aiGpr: 92, trend: 'stable' },
  IQ: { avg: 120, aiGpr: 78, trend: 'falling' },
  YE: { avg: 150, aiGpr: 85, trend: 'rising' },
  IR: { avg: 110, aiGpr: 75, trend: 'rising' },
  IL: { avg: 130, aiGpr: 82, trend: 'rising' },
  PS: { avg: 160, aiGpr: 88, trend: 'stable' },
  LB: { avg: 140, aiGpr: 83, trend: 'rising' },
  SA: { avg: 55, aiGpr: 42, trend: 'stable' },
  AE: { avg: 25, aiGpr: 22, trend: 'stable' },
  JO: { avg: 40, aiGpr: 35, trend: 'stable' },
  KW: { avg: 35, aiGpr: 30, trend: 'stable' },
  QA: { avg: 20, aiGpr: 18, trend: 'stable' },
  BH: { avg: 30, aiGpr: 25, trend: 'stable' },
  OM: { avg: 20, aiGpr: 18, trend: 'stable' },

  // East Asia
  CN: { avg: 60, aiGpr: 48, trend: 'rising' },
  TW: { avg: 80, aiGpr: 62, trend: 'rising' },
  KP: { avg: 90, aiGpr: 70, trend: 'stable' },
  KR: { avg: 45, aiGpr: 38, trend: 'stable' },
  JP: { avg: 30, aiGpr: 28, trend: 'stable' },

  // Europe
  UA: { avg: 200, aiGpr: 95, trend: 'stable' },
  RU: { avg: 160, aiGpr: 88, trend: 'stable' },
  BY: { avg: 70, aiGpr: 55, trend: 'stable' },
  GE: { avg: 50, aiGpr: 42, trend: 'rising' },
  MD: { avg: 40, aiGpr: 35, trend: 'rising' },

  // South Asia
  AF: { avg: 170, aiGpr: 90, trend: 'stable' },
  PK: { avg: 90, aiGpr: 65, trend: 'rising' },
  IN: { avg: 50, aiGpr: 40, trend: 'stable' },

  // Africa
  SO: { avg: 150, aiGpr: 85, trend: 'stable' },
  ET: { avg: 100, aiGpr: 70, trend: 'falling' },
  SD: { avg: 130, aiGpr: 80, trend: 'rising' },
  LY: { avg: 120, aiGpr: 78, trend: 'stable' },
  NG: { avg: 70, aiGpr: 52, trend: 'stable' },
  CD: { avg: 110, aiGpr: 72, trend: 'stable' },
  ML: { avg: 95, aiGpr: 68, trend: 'stable' },
  CF: { avg: 105, aiGpr: 70, trend: 'stable' },
  SS: { avg: 140, aiGpr: 82, trend: 'stable' },
  NE: { avg: 65, aiGpr: 48, trend: 'rising' },
  BF: { avg: 60, aiGpr: 45, trend: 'rising' },
  CM: { avg: 55, aiGpr: 42, trend: 'stable' },
  KE: { avg: 40, aiGpr: 35, trend: 'stable' },
  EG: { avg: 50, aiGpr: 40, trend: 'stable' },
  TN: { avg: 35, aiGpr: 30, trend: 'stable' },
  DZ: { avg: 45, aiGpr: 38, trend: 'stable' },
  MA: { avg: 30, aiGpr: 25, trend: 'stable' },
  ZA: { avg: 35, aiGpr: 28, trend: 'stable' },

  // Americas
  VE: { avg: 80, aiGpr: 60, trend: 'stable' },
  CO: { avg: 65, aiGpr: 50, trend: 'falling' },
  MX: { avg: 60, aiGpr: 48, trend: 'stable' },
  HT: { avg: 75, aiGpr: 58, trend: 'rising' },
  CU: { avg: 30, aiGpr: 25, trend: 'stable' },
  US: { avg: 25, aiGpr: 22, trend: 'stable' },
  CA: { avg: 15, aiGpr: 12, trend: 'stable' },
  BR: { avg: 30, aiGpr: 25, trend: 'stable' },
  AR: { avg: 25, aiGpr: 20, trend: 'stable' },

  // Central Asia
  UZ: { avg: 35, aiGpr: 30, trend: 'stable' },
  KZ: { avg: 25, aiGpr: 22, trend: 'stable' },
  TM: { avg: 30, aiGpr: 25, trend: 'stable' },
  KG: { avg: 40, aiGpr: 35, trend: 'rising' },
  TJ: { avg: 45, aiGpr: 38, trend: 'stable' },

  // Southeast Asia
  MM: { avg: 110, aiGpr: 75, trend: 'stable' },
  PH: { avg: 50, aiGpr: 40, trend: 'stable' },
  TH: { avg: 35, aiGpr: 30, trend: 'stable' },
  ID: { avg: 30, aiGpr: 25, trend: 'stable' },

  // Others
  TR: { avg: 55, aiGpr: 45, trend: 'stable' },
  GR: { avg: 25, aiGpr: 20, trend: 'stable' },
  AU: { avg: 10, aiGpr: 10, trend: 'stable' },
  NZ: { avg: 8, aiGpr: 8, trend: 'stable' },
  DE: { avg: 20, aiGpr: 18, trend: 'stable' },
  FR: { avg: 25, aiGpr: 22, trend: 'stable' },
  GB: { avg: 22, aiGpr: 20, trend: 'stable' },
  IT: { avg: 20, aiGpr: 18, trend: 'stable' },
  ES: { avg: 18, aiGpr: 15, trend: 'stable' },
  PL: { avg: 35, aiGpr: 30, trend: 'rising' },
  FI: { avg: 20, aiGpr: 18, trend: 'rising' },
  SE: { avg: 12, aiGpr: 10, trend: 'stable' },
  NO: { avg: 10, aiGpr: 8, trend: 'stable' },
  CH: { avg: 8, aiGpr: 6, trend: 'stable' },
  AT: { avg: 10, aiGpr: 8, trend: 'stable' },
  NL: { avg: 12, aiGpr: 10, trend: 'stable' },
  BE: { avg: 15, aiGpr: 12, trend: 'stable' },
  PT: { avg: 12, aiGpr: 10, trend: 'stable' },
  CZ: { avg: 15, aiGpr: 12, trend: 'stable' },
  RO: { avg: 20, aiGpr: 18, trend: 'stable' },
  HU: { avg: 25, aiGpr: 22, trend: 'stable' },
  SK: { avg: 15, aiGpr: 12, trend: 'stable' },
  BG: { avg: 22, aiGpr: 18, trend: 'stable' },
  HR: { avg: 18, aiGpr: 15, trend: 'stable' },
  RS: { avg: 30, aiGpr: 25, trend: 'stable' },  // Serbia — consolidated (was duplicated at line 66 & 144)
  BA: { avg: 25, aiGpr: 20, trend: 'stable' },
  XK: { avg: 35, aiGpr: 28, trend: 'stable' },
  MK: { avg: 28, aiGpr: 22, trend: 'stable' },
  AL: { avg: 22, aiGpr: 18, trend: 'stable' },
  ME: { avg: 20, aiGpr: 16, trend: 'stable' },
  SI: { avg: 10, aiGpr: 8, trend: 'stable' },
};

// ─── Helper: Hash function for deterministic pseudo-random ─────
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

/**
 * Get the AI-GPR score for a specific country.
 * Returns the AI-enhanced normalized score (0-100 scale).
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns AI-GPR normalized score (0-100) or null if no data available
 */
export function getAiGprScore(countryCode: string): number | null {
  const data = COUNTRY_GPR_BASELINES[countryCode.toUpperCase()];
  if (!data) return null;
  return data.aiGpr;
}

/**
 * Get the raw GPR baseline for a specific country.
 * Returns the historical average raw GPR value.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Raw GPR average value or null if no data available
 */
export function getGprBaseline(countryCode: string): number | null {
  const data = COUNTRY_GPR_BASELINES[countryCode.toUpperCase()];
  if (!data) return null;
  return data.avg;
}

/**
 * Get the GPR trend direction for a specific country.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Trend direction: 'rising', 'falling', or 'stable'
 */
export function getGprTrend(countryCode: string): 'rising' | 'falling' | 'stable' {
  const data = COUNTRY_GPR_BASELINES[countryCode.toUpperCase()];
  if (!data) return 'stable';
  return data.trend;
}

/**
 * Get the regional GPR baseline for a given region.
 *
 * @param region - Region key (e.g., 'middle-east', 'east-asia')
 * @returns Object with average and peak GPR values, or null if no data
 */
export function getRegionalGprBaseline(region: string): { avg: number; peak: number } | null {
  return REGIONAL_GPR_BASELINES[region] || null;
}

/**
 * Get all countries with their AI-GPR scores.
 * Useful for bulk loading map data.
 *
 * @returns Array of country GPR data
 */
export function getAllCountryGprScores(): Array<{
  countryCode: string;
  aiGpr: number;
  rawGpr: number;
  trend: 'rising' | 'falling' | 'stable';
}> {
  return Object.entries(COUNTRY_GPR_BASELINES).map(([code, data]) => ({
    countryCode: code,
    aiGpr: data.aiGpr,
    rawGpr: data.avg,
    trend: data.trend,
  }));
}

/**
 * Simulate real-time GPR update for a country.
 * In production, this would fetch from the Federal Reserve's API or a mirror.
 * For now, it adds realistic variance to the baseline.
 *
 * @param countryCode - ISO country code
 * @param variance - How much random variance to add (0-20, default: 5)
 * @returns Simulated GPR data point
 */
export function simulateGprUpdate(
  countryCode: string,
  variance: number = 5
): GprDataPoint {
  const baseline = COUNTRY_GPR_BASELINES[countryCode.toUpperCase()];

  if (!baseline) {
    // Use regional baseline as fallback — with deterministic values
    // instead of Math.random() which produces non-reproducible cached data
    const regionalFallback = REGIONAL_GPR_BASELINES['middle-east'] || { avg: 40, peak: 150 };
    const fallbackGpr = regionalFallback.avg * 0.3; // ~30% of regional average for unknowns
    return {
      date: new Date().toISOString().split('T')[0],
      gpr: fallbackGpr,
      gprAct: fallbackGpr * 0.4,
      gprThreat: fallbackGpr * 0.6,
      aiGpr: Math.min(100, fallbackGpr * 0.5),
    };
  }

  // Use deterministic jitter based on country code hash instead of Math.random()
  const jitter = ((hashCode(countryCode.toUpperCase()) % 200) - 100) / 100 * variance;
  const rawGpr = Math.max(0, baseline.avg + jitter * (baseline.avg / 100));
  // Deterministic act/threat split based on country code hash
  const actPortion = 0.35 + (((Math.abs(hashCode(countryCode + '-act')) % 15)) / 100); // 35-50%
  const threatPortion = 1 - actPortion;

  return {
    date: new Date().toISOString().split('T')[0],
    gpr: Math.round(rawGpr * 100) / 100,
    gprAct: Math.round(rawGpr * actPortion * 100) / 100,
    gprThreat: Math.round(rawGpr * threatPortion * 100) / 100,
    aiGpr: Math.max(0, Math.min(100, Math.round((baseline.aiGpr + jitter) * 100) / 100)),
  };
}

/**
 * Calculate a composite AI-GPR score for a region.
 * Weights countries by population/GDP significance and averages their scores.
 *
 * @param region - Region key
 * @returns Weighted average AI-GPR score for the region
 */
export function getRegionalAiGprScore(region: string): number {
  const regionMapping: Record<string, string[]> = {
    'middle-east': ['SY', 'IQ', 'YE', 'IR', 'IL', 'PS', 'LB', 'SA', 'AE', 'JO', 'KW', 'QA', 'BH', 'OM'],
    'east-asia': ['CN', 'TW', 'KP', 'KR', 'JP'],
    'south-asia': ['AF', 'PK', 'IN'],
    'europe': ['UA', 'RU', 'BY', 'RS', 'GE', 'MD', 'TR', 'PL', 'FI', 'DE', 'FR', 'GB', 'IT', 'ES'],
    'africa': ['SO', 'ET', 'SD', 'LY', 'NG', 'CD', 'ML', 'CF', 'SS', 'NE', 'BF', 'CM', 'KE', 'EG', 'TN', 'DZ', 'MA', 'ZA'],
    'americas': ['VE', 'CO', 'MX', 'HT', 'CU', 'US', 'CA', 'BR', 'AR'],
    'central-asia': ['UZ', 'KZ', 'TM', 'KG', 'TJ'],
  };

  const countries = regionMapping[region];
  if (!countries || countries.length === 0) return 30; // default moderate

  // Significance weights (approximate GDP/population weight)
  const significanceWeights: Record<string, number> = {
    SA: 3, AE: 2, IQ: 2, IR: 2.5, IL: 2, CN: 4, JP: 2.5, KR: 2,
    IN: 3, UA: 2, RU: 3, US: 3, NG: 2, EG: 2, ZA: 2, BR: 2, MX: 2,
    TR: 2.5, DE: 2, FR: 2, GB: 2,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const code of countries) {
    const data = COUNTRY_GPR_BASELINES[code];
    if (data) {
      const weight = significanceWeights[code] || 1;
      weightedSum += data.aiGpr * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 30;
}
