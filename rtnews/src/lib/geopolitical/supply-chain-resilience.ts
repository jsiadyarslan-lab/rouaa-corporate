// ─── Supply Chain Resilience Index ────────────────────────────
// Rouaa Geopolitical Risk Platform
// Composite index measuring supply chain fragility per country/region.
// Based on three factors:
//   1. HHI (Herfindahl-Hirschman Index) for chokepoint concentration
//   2. Alternative route availability
//   3. Rapid adaptation capacity (logistics infrastructure)

import { TRADE_ROUTES, getRouteById, type TradeRoute } from './trade-routes-data';

export interface ResilienceFactor {
  key: string;
  labelAr: string;
  labelEn: string;
  labelFr: string;
  labelTr: string;
  labelEs: string;
  value: number;       // 0-100 (0 = worst, 100 = best)
  weight: number;      // Factor weight in composite
  details: string;
}

export interface SupplyChainResilience {
  countryCode: string;
  compositeScore: number;    // 0-100 (higher = more resilient)
  riskLevel: 'critical' | 'low' | 'moderate' | 'high';
  factors: ResilienceFactor[];
  chokepointDependency: number; // HHI score 0-10000
  alternativeRouteScore: number; // 0-100
  adaptationCapacity: number;    // 0-100
  recommendations: Recommendation[];
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  chokepointId: string;
  chokepointNameAr: string;
  chokepointNameEn: string;
  actionAr: string;
  actionEn: string;
  impactScore: number; // 0-100, how much this would improve resilience
}

// ─── Country-Chokepoint Dependency Data ───────────────────────
// Maps countries to their trade volume passing through each chokepoint
// Values represent % of total trade through each route

interface CountryChokepointDependency {
  countryCode: string;
  dependencies: {
    routeId: string;
    tradeShare: number; // % of country's trade through this route
  }[];
  logisticsIndex: number;  // 0-100, WTO Logistics Performance Index
  gdpPerCapita: number;    // Used for adaptation capacity proxy
}

const COUNTRY_DEPENDENCIES: CountryChokepointDependency[] = [
  {
    countryCode: 'SA',
    dependencies: [
      { routeId: 'hormuz', tradeShare: 0.35 },
      { routeId: 'bab_el_mandeb', tradeShare: 0.25 },
      { routeId: 'suez', tradeShare: 0.15 },
    ],
    logisticsIndex: 68,
    gdpPerCapita: 23500,
  },
  {
    countryCode: 'AE',
    dependencies: [
      { routeId: 'hormuz', tradeShare: 0.45 },
      { routeId: 'bab_el_mandeb', tradeShare: 0.20 },
    ],
    logisticsIndex: 72,
    gdpPerCapita: 44000,
  },
  {
    countryCode: 'CN',
    dependencies: [
      { routeId: 'malacca', tradeShare: 0.40 },
      { routeId: 'suez', tradeShare: 0.15 },
      { routeId: 'hormuz', tradeShare: 0.10 },
    ],
    logisticsIndex: 65,
    gdpPerCapita: 12700,
  },
  {
    countryCode: 'JP',
    dependencies: [
      { routeId: 'malacca', tradeShare: 0.35 },
      { routeId: 'hormuz', tradeShare: 0.25 },
    ],
    logisticsIndex: 78,
    gdpPerCapita: 34000,
  },
  {
    countryCode: 'KR',
    dependencies: [
      { routeId: 'malacca', tradeShare: 0.35 },
      { routeId: 'hormuz', tradeShare: 0.20 },
    ],
    logisticsIndex: 75,
    gdpPerCapita: 32500,
  },
  {
    countryCode: 'DE',
    dependencies: [
      { routeId: 'suez', tradeShare: 0.15 },
      { routeId: 'turkish_straits', tradeShare: 0.05 },
    ],
    logisticsIndex: 82,
    gdpPerCapita: 48500,
  },
  {
    countryCode: 'IN',
    dependencies: [
      { routeId: 'hormuz', tradeShare: 0.20 },
      { routeId: 'malacca', tradeShare: 0.25 },
      { routeId: 'bab_el_mandeb', tradeShare: 0.15 },
    ],
    logisticsIndex: 55,
    gdpPerCapita: 2500,
  },
  {
    countryCode: 'EG',
    dependencies: [
      { routeId: 'suez', tradeShare: 0.30 },
      { routeId: 'bab_el_mandeb', tradeShare: 0.20 },
    ],
    logisticsIndex: 48,
    gdpPerCapita: 3800,
  },
  {
    countryCode: 'TR',
    dependencies: [
      { routeId: 'turkish_straits', tradeShare: 0.15 },
      { routeId: 'suez', tradeShare: 0.10 },
    ],
    logisticsIndex: 60,
    gdpPerCapita: 9500,
  },
  {
    countryCode: 'US',
    dependencies: [
      { routeId: 'panama', tradeShare: 0.08 },
      { routeId: 'suez', tradeShare: 0.05 },
      { routeId: 'malacca', tradeShare: 0.10 },
    ],
    logisticsIndex: 80,
    gdpPerCapita: 76000,
  },
  {
    countryCode: 'GB',
    dependencies: [
      { routeId: 'suez', tradeShare: 0.12 },
      { routeId: 'turkish_straits', tradeShare: 0.03 },
    ],
    logisticsIndex: 79,
    gdpPerCapita: 46000,
  },
  {
    countryCode: 'RU',
    dependencies: [
      { routeId: 'turkish_straits', tradeShare: 0.10 },
      { routeId: 'suez', tradeShare: 0.05 },
    ],
    logisticsIndex: 52,
    gdpPerCapita: 11500,
  },
  {
    countryCode: 'IQ',
    dependencies: [
      { routeId: 'hormuz', tradeShare: 0.40 },
    ],
    logisticsIndex: 38,
    gdpPerCapita: 5200,
  },
  {
    countryCode: 'IR',
    dependencies: [
      { routeId: 'hormuz', tradeShare: 0.50 },
    ],
    logisticsIndex: 42,
    gdpPerCapita: 4200,
  },
  {
    countryCode: 'AU',
    dependencies: [
      { routeId: 'malacca', tradeShare: 0.30 },
      { routeId: 'lombok', tradeShare: 0.05 },
    ],
    logisticsIndex: 73,
    gdpPerCapita: 55000,
  },
];

// ─── Lazy-loaded lookup map ──────────────────────────────────
let _dependencyMap: Map<string, CountryChokepointDependency> | null = null;

function getDependencyMap(): Map<string, CountryChokepointDependency> {
  if (!_dependencyMap) {
    _dependencyMap = new Map(COUNTRY_DEPENDENCIES.map(d => [d.countryCode, d]));
  }
  return _dependencyMap;
}

/**
 * Calculate the Herfindahl-Hirschman Index (HHI) for a country's
 * chokepoint concentration.
 * HHI = Σ (share_i * 100)² for each route
 * Unconcentrated: < 1500 | Moderately concentrated: 1500-2500 | Highly concentrated: > 2500
 *
 * @param countryCode - ISO country code
 * @returns HHI score (0-10000)
 */
export function calculateHHI(countryCode: string): number {
  const dep = getDependencyMap().get(countryCode);
  if (!dep) return 0;

  let hhi = 0;
  for (const d of dep.dependencies) {
    hhi += (d.tradeShare * 100) ** 2;
  }
  return Math.round(hhi);
}

/**
 * Calculate the alternative route availability score.
 * Higher score = more alternatives available.
 * Based on: number of alternatives, their capacity, and current disruption status.
 *
 * @param countryCode - ISO country code
 * @returns Score 0-100
 */
export function calculateAlternativeRouteScore(countryCode: string): number {
  const dep = getDependencyMap().get(countryCode);
  if (!dep || dep.dependencies.length === 0) return 100; // No dependencies = no risk

  let totalAlternatives = 0;
  let totalCapacity = 0;
  let totalWeight = 0;

  for (const d of dep.dependencies) {
    const route = getRouteById(d.routeId);
    if (!route) continue;

    const weight = d.tradeShare;
    totalWeight += weight;

    if (route.alternativeRoutes.length > 0) {
      totalAlternatives += route.alternativeRoutes.length * weight;

      // Check if alternatives are operational
      for (const altId of route.alternativeRoutes) {
        const altRoute = getRouteById(altId);
        if (altRoute && altRoute.status === 'normal') {
          totalCapacity += weight * 0.7; // Alternative available and operational
        } else if (altRoute) {
          totalCapacity += weight * 0.3; // Alternative exists but may be disrupted
        }
      }
    }
    // No alternatives for this route = 0 contribution
  }

  if (totalWeight === 0) return 100;

  // Normalize: more alternatives and more capacity = higher score
  const altScore = Math.min(100, (totalAlternatives / totalWeight) * 30 + (totalCapacity / totalWeight) * 70);
  return Math.round(altScore);
}

/**
 * Calculate the rapid adaptation capacity score.
 * Based on logistics infrastructure quality and economic capacity.
 *
 * @param countryCode - ISO country code
 * @returns Score 0-100
 */
export function calculateAdaptationCapacity(countryCode: string): number {
  const dep = getDependencyMap().get(countryCode);
  if (!dep) return 50;

  // Logistics Performance Index (0-100) → 60% weight
  const logisticsScore = dep.logisticsIndex;

  // GDP per capita as economic capacity proxy → 40% weight
  // Normalize: $2,000 → 10, $50,000+ → 90
  const gdpScore = Math.min(90, Math.max(10, Math.log10(dep.gdpPerCapita / 500) * 30));

  return Math.round(0.6 * logisticsScore + 0.4 * gdpScore);
}

/**
 * Calculate the full Supply Chain Resilience Index for a country.
 *
 * Composite = 0.35 * (100 - normalized HHI) +
 *             0.35 * Alternative Route Score +
 *             0.30 * Adaptation Capacity
 *
 * @param countryCode - ISO country code
 * @returns Complete resilience analysis
 */
export function calculateSupplyChainResilience(countryCode: string): SupplyChainResilience {
  const hhi = calculateHHI(countryCode);
  const altScore = calculateAlternativeRouteScore(countryCode);
  const adaptCapacity = calculateAdaptationCapacity(countryCode);

  // Normalize HHI to 0-100 scale (inverted: higher HHI = less resilient)
  const hhiNormalized = Math.max(0, 100 - (hhi / 10000) * 100);

  // Composite score with equal-weight basis per FM Global methodology
  const composite = 0.35 * hhiNormalized + 0.35 * altScore + 0.30 * adaptCapacity;
  const roundedComposite = Math.round(Math.max(0, Math.min(100, composite)));

  // Risk level
  const riskLevel: SupplyChainResilience['riskLevel'] =
    roundedComposite < 25 ? 'critical' :
    roundedComposite < 45 ? 'low' :
    roundedComposite < 65 ? 'moderate' : 'high';

  // Factors detail
  const factors: ResilienceFactor[] = [
    {
      key: 'hhi',
      labelAr: 'تركيز الاعتماد (HHI)',
      labelEn: 'Concentration Dependency (HHI)',
      labelFr: 'Dépendance de concentration (HHI)',
      labelTr: 'Konsantrasyon bağımlılığı (HHI)',
      labelEs: 'Dependencia de concentración (HHI)',
      value: Math.round(hhiNormalized),
      weight: 0.35,
      details: hhi < 1500 ? 'Unconcentrated' : hhi < 2500 ? 'Moderately concentrated' : 'Highly concentrated',
    },
    {
      key: 'alternatives',
      labelAr: 'توفر المسارات البديلة',
      labelEn: 'Alternative Route Availability',
      labelFr: 'Disponibilité des routes alternatives',
      labelTr: 'Alternatif rota kullanılabilirliği',
      labelEs: 'Disponibilidad de rutas alternativas',
      value: altScore,
      weight: 0.35,
      details: altScore < 30 ? 'Very few alternatives' : altScore < 60 ? 'Some alternatives available' : 'Good alternative coverage',
    },
    {
      key: 'adaptation',
      labelAr: 'القدرة على التكيف',
      labelEn: 'Adaptation Capacity',
      labelFr: "Capacité d'adaptation",
      labelTr: 'Uyum kapasitesi',
      labelEs: 'Capacidad de adaptación',
      value: adaptCapacity,
      weight: 0.30,
      details: adaptCapacity < 40 ? 'Low infrastructure' : adaptCapacity < 65 ? 'Moderate infrastructure' : 'Strong infrastructure',
    },
  ];

  // Generate recommendations
  const recommendations = generateRecommendations(countryCode, hhi, altScore, adaptCapacity);

  return {
    countryCode,
    compositeScore: roundedComposite,
    riskLevel,
    factors,
    chokepointDependency: hhi,
    alternativeRouteScore: altScore,
    adaptationCapacity: adaptCapacity,
    recommendations,
  };
}

/**
 * Generate actionable recommendations to reduce chokepoint dependency.
 */
function generateRecommendations(
  countryCode: string,
  hhi: number,
  altScore: number,
  adaptCapacity: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const dep = getDependencyMap().get(countryCode);
  if (!dep) return recommendations;

  for (const d of dep.dependencies) {
    const route = getRouteById(d.routeId);
    if (!route) continue;

    // High dependency on a single chokepoint
    if (d.tradeShare > 0.25 && hhi > 1500) {
      const routeNameEn = route.nameEn;
      const routeNameAr = route.nameAr;

      if (route.alternativeRoutes.length === 0) {
        recommendations.push({
          priority: 'high',
          chokepointId: route.id,
          chokepointNameAr: routeNameAr,
          chokepointNameEn: routeNameEn,
          actionAr: `تطوير مسارات بديلة لتقليل الاعتماد على ${routeNameAr} (${Math.round(d.tradeShare * 100)}% من التجارة)`,
          actionEn: `Develop alternative routes to reduce dependency on ${routeNameEn} (${Math.round(d.tradeShare * 100)}% of trade)`,
          impactScore: Math.round(d.tradeShare * 100 * 0.6),
        });
      } else {
        recommendations.push({
          priority: 'medium',
          chokepointId: route.id,
          chokepointNameAr: routeNameAr,
          chokepointNameEn: routeNameEn,
          actionAr: `تعزيز استخدام المسارات البديلة ل${routeNameAr} لتقليل المخاطر`,
          actionEn: `Increase usage of alternative routes for ${routeNameEn} to reduce risk`,
          impactScore: Math.round(d.tradeShare * 100 * 0.4),
        });
      }
    }

    // Disrupted routes need urgent attention
    if (route.status === 'disrupted' || route.status === 'threatened') {
      recommendations.push({
        priority: 'high',
        chokepointId: route.id,
        chokepointNameAr: route.nameAr,
        chokepointNameEn: route.nameEn,
        actionAr: `${route.status === 'disrupted' ? 'تأمين بديل فوري' : 'وضع خطة طوارئ'} ل${route.nameAr}`,
        actionEn: `${route.status === 'disrupted' ? 'Secure immediate alternative' : 'Activate contingency plan'} for ${route.nameEn}`,
        impactScore: Math.round(route.disruptionRisk * 0.5),
      });
    }
  }

  // Low adaptation capacity
  if (adaptCapacity < 45) {
    recommendations.push({
      priority: 'medium',
      chokepointId: 'general',
      chokepointNameAr: 'البنية التحتية اللوجستية',
      chokepointNameEn: 'Logistics Infrastructure',
      actionAr: 'الاستثمار في البنية التحتية اللوجستية لتحسين سرعة التكيف مع الاضطرابات',
      actionEn: 'Invest in logistics infrastructure to improve rapid adaptation to disruptions',
      impactScore: Math.round((45 - adaptCapacity) * 1.2),
    });
  }

  return recommendations.sort((a, b) => b.impactScore - a.impactScore).slice(0, 5);
}

/**
 * Calculate resilience for all tracked countries.
 */
export function calculateAllResilienceIndices(): SupplyChainResilience[] {
  return COUNTRY_DEPENDENCIES.map(d => calculateSupplyChainResilience(d.countryCode));
}

/**
 * Get list of tracked country codes.
 */
export function getTrackedCountries(): string[] {
  return COUNTRY_DEPENDENCIES.map(d => d.countryCode);
}
