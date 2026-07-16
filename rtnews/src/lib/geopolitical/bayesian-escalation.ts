// ─── Bayesian Escalation Ladder ────────────────────────────────
// Rouaa Geopolitical Risk Platform
// Predictive escalation system with Bayesian updating.
// Tracks geopolitical hotspots and provides escalation probabilities
// on a graduated ladder (diplomatic → sanctions → limited conflict → regional war).
// Uses Bayesian updating to adjust probabilities with each new event.

export type EscalationLevel =
  | 'diplomatic_tension'   // توتر دبلوماسي
  | 'economic_sanctions'   // عقوبات اقتصادية
  | 'cyber_attacks'        // هجمات سيبرانية
  | 'proxy_conflict'       // صراع بالوكالة
  | 'limited_armed'        // نزاع مسلح محدود
  | 'regional_war';        // حرب إقليمية

export interface EscalationLevelMeta {
  level: EscalationLevel;
  order: number;          // 1-6, higher = more severe
  labelAr: string;
  labelEn: string;
  labelFr: string;
  labelTr: string;
  labelEs: string;
  color: string;
  marketImpact: { oil: number; gold: number; dollar: number; equities: number };
}

export interface BayesianEvent {
  id: string;
  type: 'military' | 'diplomatic' | 'economic' | 'cyber' | 'political' | 'social';
  severity: number;       // 0-1
  countryCode: string;
  timestamp: string;
  descriptionAr: string;
  descriptionEn: string;
  sourceReliability: number; // 0-1, how reliable the source is
  corroborated: boolean;     // confirmed by 2+ sources
}

export interface EscalationState {
  hotspot: string;        // Country or region identifier
  currentLevel: EscalationLevel;
  probabilities: Record<EscalationLevel, number>;
  confidence: number;     // 0-1, statistical confidence
  priorEvents: number;    // Number of events that updated the state
  lastUpdate: string;     // ISO timestamp
  trendDirection: 'escalating' | 'stable' | 'de_escalating';
}

export interface EscalationUpdate {
  hotspot: string;
  event: BayesianEvent;
  priorProbabilities: Record<EscalationLevel, number>;
  posteriorProbabilities: Record<EscalationLevel, number>;
  levelChanged: boolean;
  confidenceChange: number;
  bayesFactor: number;
}

// ─── Escalation Ladder Definition ─────────────────────────────
export const ESCALATION_LEVELS: EscalationLevelMeta[] = [
  {
    level: 'diplomatic_tension',
    order: 1,
    labelAr: 'توتر دبلوماسي',
    labelEn: 'Diplomatic Tension',
    labelFr: 'Tension diplomatique',
    labelTr: 'Diplomatik gerilim',
    labelEs: 'Tensión diplomática',
    color: '#3B82F6',
    marketImpact: { oil: 2, gold: 1, dollar: -0.5, equities: -1 },
  },
  {
    level: 'economic_sanctions',
    order: 2,
    labelAr: 'عقوبات اقتصادية',
    labelEn: 'Economic Sanctions',
    labelFr: 'Sanctions économiques',
    labelTr: 'Ekonomik yaptırımlar',
    labelEs: 'Sanciones económicas',
    color: '#F59E0B',
    marketImpact: { oil: 5, gold: 3, dollar: 1, equities: -4 },
  },
  {
    level: 'cyber_attacks',
    order: 3,
    labelAr: 'هجمات سيبرانية',
    labelEn: 'Cyber Attacks',
    labelFr: 'Cyberattaques',
    labelTr: 'Siber saldırılar',
    labelEs: 'Ataques cibernéticos',
    color: '#8B5CF6',
    marketImpact: { oil: 3, gold: 2, dollar: -1, equities: -3 },
  },
  {
    level: 'proxy_conflict',
    order: 4,
    labelAr: 'صراع بالوكالة',
    labelEn: 'Proxy Conflict',
    labelFr: 'Conflit par procuration',
    labelTr: 'Vekil çatışma',
    labelEs: 'Conflicto subsidiario',
    color: '#F97316',
    marketImpact: { oil: 10, gold: 5, dollar: -2, equities: -8 },
  },
  {
    level: 'limited_armed',
    order: 5,
    labelAr: 'نزاع مسلح محدود',
    labelEn: 'Limited Armed Conflict',
    labelFr: 'Conflit armé limité',
    labelTr: 'Sınırlı silahlı çatışma',
    labelEs: 'Conflicto armado limitado',
    color: '#EF4444',
    marketImpact: { oil: 18, gold: 10, dollar: -4, equities: -14 },
  },
  {
    level: 'regional_war',
    order: 6,
    labelAr: 'حرب إقليمية',
    labelEn: 'Regional War',
    labelFr: 'Guerre régionale',
    labelTr: 'Bölgesel savaş',
    labelEs: 'Guerra regional',
    color: '#7F1D1D',
    marketImpact: { oil: 35, gold: 22, dollar: -8, equities: -25 },
  },
];

// ─── Prior probabilities by hotspot type ──────────────────────
// Base rates derived from historical conflict data (ACLED, UCDP)
const BASE_PRIORS: Record<string, Record<EscalationLevel, number>> = {
  default: {
    diplomatic_tension: 0.40,
    economic_sanctions: 0.25,
    cyber_attacks: 0.10,
    proxy_conflict: 0.12,
    limited_armed: 0.08,
    regional_war: 0.05,
  },
  middle_east: {
    diplomatic_tension: 0.25,
    economic_sanctions: 0.20,
    cyber_attacks: 0.10,
    proxy_conflict: 0.22,
    limited_armed: 0.15,
    regional_war: 0.08,
  },
  eastern_europe: {
    diplomatic_tension: 0.30,
    economic_sanctions: 0.25,
    cyber_attacks: 0.15,
    proxy_conflict: 0.12,
    limited_armed: 0.10,
    regional_war: 0.08,
  },
  east_asia: {
    diplomatic_tension: 0.35,
    economic_sanctions: 0.20,
    cyber_attacks: 0.18,
    proxy_conflict: 0.10,
    limited_armed: 0.10,
    regional_war: 0.07,
  },
};

// ─── Likelihood functions ─────────────────────────────────────
// P(event | escalation_level) — how likely is each event type
// given a specific escalation level

const LIKELIHOOD_MATRIX: Record<BayesianEvent['type'], Record<EscalationLevel, number>> = {
  military: {
    diplomatic_tension: 0.05,
    economic_sanctions: 0.10,
    cyber_attacks: 0.10,
    proxy_conflict: 0.30,
    limited_armed: 0.35,
    regional_war: 0.40,
  },
  diplomatic: {
    diplomatic_tension: 0.40,
    economic_sanctions: 0.25,
    cyber_attacks: 0.10,
    proxy_conflict: 0.08,
    limited_armed: 0.05,
    regional_war: 0.03,
  },
  economic: {
    diplomatic_tension: 0.15,
    economic_sanctions: 0.40,
    cyber_attacks: 0.10,
    proxy_conflict: 0.12,
    limited_armed: 0.08,
    regional_war: 0.05,
  },
  cyber: {
    diplomatic_tension: 0.05,
    economic_sanctions: 0.10,
    cyber_attacks: 0.45,
    proxy_conflict: 0.15,
    limited_armed: 0.10,
    regional_war: 0.08,
  },
  political: {
    diplomatic_tension: 0.30,
    economic_sanctions: 0.15,
    cyber_attacks: 0.08,
    proxy_conflict: 0.15,
    limited_armed: 0.12,
    regional_war: 0.10,
  },
  social: {
    diplomatic_tension: 0.20,
    economic_sanctions: 0.15,
    cyber_attacks: 0.08,
    proxy_conflict: 0.18,
    limited_armed: 0.20,
    regional_war: 0.15,
  },
};

/**
 * Get the region type for a country code.
 */
function getRegionType(countryCode: string): string {
  const middleEast = ['IR', 'IQ', 'SY', 'YE', 'SA', 'AE', 'IL', 'LB', 'JO', 'KW', 'QA', 'BH', 'OM'];
  const easternEurope = ['RU', 'UA', 'BY', 'MD', 'GE', 'AM', 'AZ'];
  const eastAsia = ['CN', 'TW', 'JP', 'KR', 'KP'];

  if (middleEast.includes(countryCode)) return 'middle_east';
  if (easternEurope.includes(countryCode)) return 'eastern_europe';
  if (eastAsia.includes(countryCode)) return 'east_asia';
  return 'default';
}

/**
 * Initialize a Bayesian escalation state for a hotspot.
 * Uses region-appropriate priors based on historical base rates.
 *
 * @param hotspot - Country code or region identifier
 * @returns Initial escalation state with prior probabilities
 */
export function initializeEscalationState(hotspot: string): EscalationState {
  const regionType = getRegionType(hotspot);
  const priors = BASE_PRIORS[regionType] || BASE_PRIORS.default;

  return {
    hotspot,
    currentLevel: 'diplomatic_tension',
    probabilities: { ...priors },
    confidence: 0.3, // Low initial confidence with just priors
    priorEvents: 0,
    lastUpdate: new Date().toISOString(),
    trendDirection: 'stable',
  };
}

/**
 * Apply Bayesian updating to an escalation state given a new event.
 *
 * Uses Bayes' theorem:
 * P(level | event) = P(event | level) * P(level) / P(event)
 *
 * Where P(event) = Σ P(event | level_i) * P(level_i)
 *
 * Also incorporates source reliability and corroboration into the update.
 *
 * @param state - Current escalation state
 * @param event - New event to incorporate
 * @returns Updated escalation state and update metadata
 */
export function updateEscalationBayesian(
  state: EscalationState,
  event: BayesianEvent
): { newState: EscalationState; update: EscalationUpdate } {
  const priorProbs = { ...state.probabilities };
  const likelihoods = LIKELIHOOD_MATRIX[event.type];

  // Calculate P(event) = marginal likelihood
  let marginalLikelihood = 0;
  for (const level of ESCALATION_LEVELS) {
    marginalLikelihood += likelihoods[level.level] * priorProbs[level.level];
  }

  // Avoid division by zero
  if (marginalLikelihood === 0) marginalLikelihood = 0.001;

  // Apply Bayes' theorem with severity and reliability adjustments
  const posteriorProbs: Record<EscalationLevel, number> = { ...priorProbs };
  const severityBoost = event.severity;
  const reliabilityWeight = event.sourceReliability;
  const corroborationBonus = event.corroborated ? 1.3 : 1.0;

  for (const level of ESCALATION_LEVELS) {
    const likelihood = likelihoods[level.level];
    const prior = priorProbs[level.level];

    // Weighted Bayesian update
    const fullPosterior = (likelihood * prior) / marginalLikelihood;

    // Blend between prior and posterior based on reliability
    // Higher reliability → more weight on the new evidence
    const blendWeight = 0.3 + 0.7 * reliabilityWeight; // 0.3-1.0
    const blendedPosterior = (1 - blendWeight) * prior + blendWeight * fullPosterior;

    // Apply severity and corroboration adjustments
    posteriorProbs[level.level] = blendedPosterior * severityBoost * corroborationBonus;
  }

  // Normalize probabilities to sum to 1
  const total = Object.values(posteriorProbs).reduce((s, v) => s + v, 0);
  for (const level of ESCALATION_LEVELS) {
    posteriorProbs[level.level] = Math.round((posteriorProbs[level.level] / total) * 10000) / 10000;
  }

  // Determine current level (highest probability)
  let maxProb = 0;
  let currentLevel: EscalationLevel = 'diplomatic_tension';
  for (const level of ESCALATION_LEVELS) {
    if (posteriorProbs[level.level] > maxProb) {
      maxProb = posteriorProbs[level.level];
      currentLevel = level.level;
    }
  }

  // Update confidence (increases with more events, decreases with conflicting signals)
  const entropyBefore = computeEntropy(priorProbs);
  const entropyAfter = computeEntropy(posteriorProbs);
  const entropyChange = entropyBefore - entropyAfter; // Positive = more certain
  const newConfidence = Math.min(1, Math.max(0.1,
    state.confidence + 0.05 * (1 + entropyChange * 2) * reliabilityWeight
  ));

  // Determine trend
  const priorLevel = ESCALATION_LEVELS.find(l => l.level === state.currentLevel);
  const newLevel = ESCALATION_LEVELS.find(l => l.level === currentLevel);
  let trendDirection: EscalationState['trendDirection'] = 'stable';
  if (newLevel && priorLevel) {
    if (newLevel.order > priorLevel.order) trendDirection = 'escalating';
    else if (newLevel.order < priorLevel.order) trendDirection = 'de_escalating';
  }

  // Compute Bayes factor (evidence strength)
  const bayesFactor = marginalLikelihood > 0
    ? (likelihoods[currentLevel] * priorProbs[currentLevel]) / marginalLikelihood
    : 1;

  const newState: EscalationState = {
    hotspot: state.hotspot,
    currentLevel,
    probabilities: posteriorProbs,
    confidence: Math.round(newConfidence * 100) / 100,
    priorEvents: state.priorEvents + 1,
    lastUpdate: event.timestamp,
    trendDirection,
  };

  const update: EscalationUpdate = {
    hotspot: state.hotspot,
    event,
    priorProbabilities: priorProbs,
    posteriorProbabilities: posteriorProbs,
    levelChanged: state.currentLevel !== currentLevel,
    confidenceChange: Math.round((newConfidence - state.confidence) * 100) / 100,
    bayesFactor: Math.round(bayesFactor * 100) / 100,
  };

  return { newState, update };
}

/**
 * Compute Shannon entropy of a probability distribution.
 * Lower entropy = more certain = higher confidence.
 */
function computeEntropy(probs: Record<EscalationLevel, number>): number {
  let entropy = 0;
  for (const p of Object.values(probs)) {
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

/**
 * Get the escalation level metadata.
 */
export function getEscalationLevelMeta(level: EscalationLevel): EscalationLevelMeta {
  return ESCALATION_LEVELS.find(l => l.level === level) || ESCALATION_LEVELS[0];
}

/**
 * Get the localized label for an escalation level.
 */
export function getEscalationLabel(level: EscalationLevel, locale: string): string {
  const meta = getEscalationLevelMeta(level);
  switch (locale) {
    case 'ar': return meta.labelAr;
    case 'fr': return meta.labelFr;
    case 'tr': return meta.labelTr;
    case 'es': return meta.labelEs;
    default: return meta.labelEn;
  }
}

/**
 * Pre-configured hotspot scenarios with simulated event sequences.
 */
export const HOTSPOT_SCENARIOS: Record<string, {
  labelAr: string;
  labelEn: string;
  labelFr: string;
  labelTr: string;
  labelEs: string;
  initialEvents: BayesianEvent[];
}> = {
  iran_nuclear: {
    labelAr: 'البرنامج النووي الإيراني',
    labelEn: 'Iran Nuclear Program',
    labelFr: 'Programme nucléaire iranien',
    labelTr: 'İran nükleer programı',
    labelEs: 'Programa nuclear iraní',
    initialEvents: [
      { id: 'ev1', type: 'diplomatic', severity: 0.4, countryCode: 'IR', timestamp: '2026-06-01T08:00:00Z', descriptionAr: 'تصريحات إيرانية حول تقدم التخصيب', descriptionEn: 'Iranian statements on enrichment progress', sourceReliability: 0.8, corroborated: true },
      { id: 'ev2', type: 'economic', severity: 0.6, countryCode: 'IR', timestamp: '2026-06-05T14:00:00Z', descriptionAr: 'فرض عقوبات جديدة على قطاع النفط', descriptionEn: 'New sanctions imposed on oil sector', sourceReliability: 0.9, corroborated: true },
      { id: 'ev3', type: 'military', severity: 0.7, countryCode: 'IR', timestamp: '2026-06-10T06:00:00Z', descriptionAr: 'تعزيزات عسكرية في مضيق هرمز', descriptionEn: 'Military reinforcements in Strait of Hormuz', sourceReliability: 0.85, corroborated: true },
    ],
  },
  taiwan_strait: {
    labelAr: 'أزمة مضيق تايوان',
    labelEn: 'Taiwan Strait Crisis',
    labelFr: 'Crise du détroit de Taïwan',
    labelTr: 'Tayvan Boğazı krizi',
    labelEs: 'Crisis del estrecho de Taiwán',
    initialEvents: [
      { id: 'ev1', type: 'military', severity: 0.5, countryCode: 'CN', timestamp: '2026-06-01T10:00:00Z', descriptionAr: 'مناورات عسكرية صينية قرب تايوان', descriptionEn: 'Chinese military drills near Taiwan', sourceReliability: 0.9, corroborated: true },
      { id: 'ev2', type: 'diplomatic', severity: 0.3, countryCode: 'US', timestamp: '2026-06-04T12:00:00Z', descriptionAr: 'تصريحات أمريكية داعمة لتايوان', descriptionEn: 'US statements supporting Taiwan', sourceReliability: 0.85, corroborated: true },
      { id: 'ev3', type: 'cyber', severity: 0.6, countryCode: 'TW', timestamp: '2026-06-08T03:00:00Z', descriptionAr: 'هجمات سيبرانية على البنية التحتية التايوانية', descriptionEn: 'Cyber attacks on Taiwanese infrastructure', sourceReliability: 0.75, corroborated: false },
    ],
  },
  russia_nato: {
    labelAr: 'تصعيد روسيا-الناتو',
    labelEn: 'Russia-NATO Escalation',
    labelFr: 'Escalade Russie-OTAN',
    labelTr: 'Rusya-NATO tırmanması',
    labelEs: 'Escalada Rusia-OTAN',
    initialEvents: [
      { id: 'ev1', type: 'military', severity: 0.6, countryCode: 'RU', timestamp: '2026-06-02T09:00:00Z', descriptionAr: 'حشد عسكري روسي على الحدود', descriptionEn: 'Russian military buildup at borders', sourceReliability: 0.85, corroborated: true },
      { id: 'ev2', type: 'economic', severity: 0.5, countryCode: 'RU', timestamp: '2026-06-06T11:00:00Z', descriptionAr: 'تجديد العقوبات الأوروبية', descriptionEn: 'Renewal of European sanctions', sourceReliability: 0.9, corroborated: true },
      { id: 'ev3', type: 'cyber', severity: 0.7, countryCode: 'UA', timestamp: '2026-06-11T02:00:00Z', descriptionAr: 'هجمات سيبرانية واسعة على أوكرانيا', descriptionEn: 'Massive cyber attacks on Ukraine', sourceReliability: 0.8, corroborated: true },
    ],
  },
  red_sea: {
    labelAr: 'أزمة البحر الأحمر',
    labelEn: 'Red Sea Crisis',
    labelFr: 'Crise de la mer Rouge',
    labelTr: 'Kızıldeniz krizi',
    labelEs: 'Crisis del mar Rojo',
    initialEvents: [
      { id: 'ev1', type: 'military', severity: 0.7, countryCode: 'YE', timestamp: '2026-06-01T07:00:00Z', descriptionAr: 'هجوم على سفينة تجارية في باب المندب', descriptionEn: 'Attack on commercial vessel at Bab el-Mandeb', sourceReliability: 0.9, corroborated: true },
      { id: 'ev2', type: 'military', severity: 0.8, countryCode: 'YE', timestamp: '2026-06-05T15:00:00Z', descriptionAr: 'تصعيد الهجمات على الشحن البحري', descriptionEn: 'Escalation of attacks on maritime shipping', sourceReliability: 0.85, corroborated: true },
      { id: 'ev3', type: 'economic', severity: 0.6, countryCode: 'EG', timestamp: '2026-06-09T10:00:00Z', descriptionAr: 'انخفاض حركة قناة السويس بنسبة 40%', descriptionEn: 'Suez Canal traffic drops 40%', sourceReliability: 0.9, corroborated: true },
    ],
  },
};
