// ─── SIR Contagion Model for Geopolitical Risk Propagation ─────
// Rouaa Geopolitical Risk Platform
// Modified SIR (Susceptible-Infected-Recovered) epidemiological model
// adapted for geopolitical risk contagion across countries.
// Transmission coefficients derived from real trade data and alliances.

export interface SIRCountryState {
  countryCode: string;
  susceptible: number;   // 0-1: proportion of risk capacity not yet affected
  infected: number;      // 0-1: current risk level from contagion
  recovered: number;     // 0-1: resilience/adaptation capacity activated
  phase: 'susceptible' | 'infected' | 'recovered' | 'initial_infection';
}

export interface TransmissionEdge {
  source: string;        // Source country code
  target: string;        // Target country code
  beta: number;          // Transmission rate (0-1): how easily risk transfers
  tradeVolume: number;   // Normalized trade volume (0-1)
  routeType: 'trade' | 'alliance' | 'supply_chain' | 'conflict';
}

export interface SIRSimulationConfig {
  initialInfected: string[];  // Country codes of initially infected countries
  baseTransmissionRate: number; // Base beta before trade adjustment (0-1)
  recoveryRate: number;       // Gamma: how quickly countries adapt (0-1)
  timeSteps: number;          // Number of simulation time steps
  dt: number;                 // Time step size (0-1)
  tradeMultiplier: number;    // How much trade volume amplifies transmission
}

export interface SIRTimeStep {
  step: number;
  states: Map<string, SIRCountryState>;
  totalInfected: number;
  totalSusceptible: number;
  totalRecovered: number;
  newInfections: string[];
}

export interface SIRSimulationResult {
  config: SIRSimulationConfig;
  timeSteps: SIRTimeStep[];
  finalStates: Map<string, SIRCountryState>;
  peakInfectionStep: number;
  peakInfectionCount: number;
  totalAffectedCountries: number;
  contagionPaths: ContagionPath[];
}

export interface ContagionPath {
  source: string;
  target: string;
  route: string;
  transmissionProbability: number;
  estimatedDelay: number; // Time steps until risk arrives
  tradeVolume: number;
}

// ─── Trade/Alliance Network Data ──────────────────────────────
// Simplified but realistic transmission network based on actual
// trade volumes, alliances, and supply chain dependencies.

const TRANSMISSION_NETWORK: TransmissionEdge[] = [
  // Hormuz-related contagion paths
  { source: 'IR', target: 'AE', beta: 0.7, tradeVolume: 0.85, routeType: 'trade' },
  { source: 'IR', target: 'SA', beta: 0.5, tradeVolume: 0.6, routeType: 'trade' },
  { source: 'IR', target: 'IQ', beta: 0.6, tradeVolume: 0.7, routeType: 'conflict' },
  { source: 'AE', target: 'IN', beta: 0.4, tradeVolume: 0.55, routeType: 'trade' },
  { source: 'AE', target: 'CN', beta: 0.3, tradeVolume: 0.4, routeType: 'trade' },
  { source: 'SA', target: 'EG', beta: 0.3, tradeVolume: 0.35, routeType: 'alliance' },
  { source: 'SA', target: 'PK', beta: 0.4, tradeVolume: 0.45, routeType: 'alliance' },
  // Suez-related contagion paths
  { source: 'EG', target: 'IT', beta: 0.4, tradeVolume: 0.5, routeType: 'trade' },
  { source: 'EG', target: 'GR', beta: 0.3, tradeVolume: 0.35, routeType: 'trade' },
  { source: 'EG', target: 'TR', beta: 0.35, tradeVolume: 0.4, routeType: 'trade' },
  // Russia-related contagion paths
  { source: 'RU', target: 'DE', beta: 0.5, tradeVolume: 0.6, routeType: 'supply_chain' },
  { source: 'RU', target: 'CN', beta: 0.4, tradeVolume: 0.5, routeType: 'trade' },
  { source: 'RU', target: 'IN', beta: 0.3, tradeVolume: 0.4, routeType: 'trade' },
  { source: 'RU', target: 'TR', beta: 0.35, tradeVolume: 0.45, routeType: 'trade' },
  // China supply chain contagion
  { source: 'CN', target: 'US', beta: 0.3, tradeVolume: 0.7, routeType: 'supply_chain' },
  { source: 'CN', target: 'JP', beta: 0.4, tradeVolume: 0.55, routeType: 'supply_chain' },
  { source: 'CN', target: 'KR', beta: 0.45, tradeVolume: 0.6, routeType: 'supply_chain' },
  { source: 'CN', target: 'DE', beta: 0.3, tradeVolume: 0.45, routeType: 'supply_chain' },
  { source: 'CN', target: 'AU', beta: 0.35, tradeVolume: 0.5, routeType: 'trade' },
  // Taiwan-related contagion
  { source: 'TW', target: 'CN', beta: 0.6, tradeVolume: 0.8, routeType: 'supply_chain' },
  { source: 'TW', target: 'US', beta: 0.4, tradeVolume: 0.5, routeType: 'alliance' },
  { source: 'TW', target: 'JP', beta: 0.5, tradeVolume: 0.6, routeType: 'trade' },
  // US contagion paths
  { source: 'US', target: 'CA', beta: 0.4, tradeVolume: 0.65, routeType: 'trade' },
  { source: 'US', target: 'MX', beta: 0.35, tradeVolume: 0.55, routeType: 'trade' },
  { source: 'US', target: 'GB', beta: 0.3, tradeVolume: 0.45, routeType: 'alliance' },
  // Middle East wider contagion
  { source: 'IQ', target: 'SY', beta: 0.5, tradeVolume: 0.5, routeType: 'conflict' },
  { source: 'SY', target: 'TR', beta: 0.4, tradeVolume: 0.4, routeType: 'conflict' },
  { source: 'SY', target: 'LB', beta: 0.55, tradeVolume: 0.5, routeType: 'conflict' },
  { source: 'YE', target: 'SA', beta: 0.4, tradeVolume: 0.35, routeType: 'conflict' },
  // Europe contagion
  { source: 'DE', target: 'FR', beta: 0.3, tradeVolume: 0.5, routeType: 'trade' },
  { source: 'DE', target: 'PL', beta: 0.3, tradeVolume: 0.4, routeType: 'supply_chain' },
  { source: 'UA', target: 'PL', beta: 0.5, tradeVolume: 0.45, routeType: 'conflict' },
  { source: 'UA', target: 'RO', beta: 0.4, tradeVolume: 0.35, routeType: 'conflict' },
  // Africa contagion
  { source: 'ET', target: 'KE', beta: 0.35, tradeVolume: 0.4, routeType: 'trade' },
  { source: 'NG', target: 'GH', beta: 0.3, tradeVolume: 0.35, routeType: 'trade' },
  { source: 'LY', target: 'IT', beta: 0.3, tradeVolume: 0.3, routeType: 'conflict' },
  // Energy supply chain
  { source: 'SA', target: 'JP', beta: 0.4, tradeVolume: 0.6, routeType: 'supply_chain' },
  { source: 'SA', target: 'KR', beta: 0.35, tradeVolume: 0.5, routeType: 'supply_chain' },
  { source: 'RU', target: 'HU', beta: 0.5, tradeVolume: 0.55, routeType: 'supply_chain' },
  { source: 'RU', target: 'CZ', beta: 0.45, tradeVolume: 0.5, routeType: 'supply_chain' },
];

// ─── Default Configuration ────────────────────────────────────
export const DEFAULT_SIR_CONFIG: SIRSimulationConfig = {
  initialInfected: ['IR'],
  baseTransmissionRate: 0.3,
  recoveryRate: 0.1,
  timeSteps: 50,
  dt: 0.2,
  tradeMultiplier: 1.5,
};

/**
 * Get all country codes involved in the transmission network.
 */
export function getNetworkCountries(): string[] {
  const countries = new Set<string>();
  for (const edge of TRANSMISSION_NETWORK) {
    countries.add(edge.source);
    countries.add(edge.target);
  }
  return Array.from(countries);
}

/**
 * Get all transmission edges from the network.
 */
export function getTransmissionNetwork(): TransmissionEdge[] {
  return [...TRANSMISSION_NETWORK];
}

/**
 * Get all edges connected to a specific country.
 */
export function getEdgesForCountry(countryCode: string): TransmissionEdge[] {
  return TRANSMISSION_NETWORK.filter(
    (e) => e.source === countryCode || e.target === countryCode
  );
}

/**
 * Run the SIR contagion simulation.
 * The model tracks how geopolitical risk propagates through the
 * trade/alliance/supply-chain network over time.
 *
 * dS/dt = -β * S * I  (susceptible become infected)
 * dI/dt = β * S * I - γ * I  (infected may recover)
 * dR/dt = γ * I  (infected recover)
 *
 * Where β is adjusted by trade volume and route type.
 *
 * @param config - Simulation configuration
 * @returns Full simulation result with time series
 */
export function runSIRSimulation(
  config: SIRSimulationConfig = DEFAULT_SIR_CONFIG
): SIRSimulationResult {
  const { initialInfected, baseTransmissionRate, recoveryRate, timeSteps, dt, tradeMultiplier } = config;

  // Initialize country states
  const states = new Map<string, SIRCountryState>();
  const allCountries = getNetworkCountries();

  for (const code of allCountries) {
    const isInitiallyInfected = initialInfected.includes(code);
    states.set(code, {
      countryCode: code,
      susceptible: isInitiallyInfected ? 0 : 1,
      infected: isInitiallyInfected ? 1 : 0,
      recovered: 0,
      phase: isInitiallyInfected ? 'initial_infection' : 'susceptible',
    });
  }

  // Build adjacency for faster lookup
  const outgoingEdges = new Map<string, TransmissionEdge[]>();
  for (const edge of TRANSMISSION_NETWORK) {
    const existing = outgoingEdges.get(edge.source) || [];
    existing.push(edge);
    outgoingEdges.set(edge.source, existing);
  }

  const timeStepResults: SIRTimeStep[] = [];
  let peakInfected = 0;
  let peakStep = 0;

  for (let step = 0; step <= timeSteps; step++) {
    // Record current state
    let totalInfected = 0;
    let totalSusceptible = 0;
    let totalRecovered = 0;
    const newInfections: string[] = [];

    for (const [, state] of states) {
      totalInfected += state.infected;
      totalSusceptible += state.susceptible;
      totalRecovered += state.recovered;
    }

    if (totalInfected > peakInfected) {
      peakInfected = totalInfected;
      peakStep = step;
    }

    timeStepResults.push({
      step,
      states: new Map(states),
      totalInfected: Math.round(totalInfected * 100) / 100,
      totalSusceptible: Math.round(totalSusceptible * 100) / 100,
      totalRecovered: Math.round(totalRecovered * 100) / 100,
      newInfections: [...newInfections],
    });

    if (step === timeSteps) break;

    // Update states for next time step
    const newStates = new Map<string, SIRCountryState>();

    for (const [code, state] of states) {
      let forceOfInfection = 0;

      // Sum infection pressure from all infected neighbors
      const incomingEdges = TRANSMISSION_NETWORK.filter((e) => e.target === code);
      for (const edge of incomingEdges) {
        const sourceState = states.get(edge.source);
        if (sourceState && sourceState.infected > 0) {
          // Adjusted beta: base rate * trade volume multiplier * route-specific factor
          const routeFactor = getRouteTypeFactor(edge.routeType);
          const adjustedBeta = baseTransmissionRate * edge.beta * (1 + tradeMultiplier * edge.tradeVolume) * routeFactor;
          forceOfInfection += adjustedBeta * sourceState.infected * state.susceptible;
        }
      }

      // SIR differential equations (Euler method)
      const dS = -forceOfInfection * dt;
      const dI = (forceOfInfection - recoveryRate * state.infected) * dt;
      const dR = recoveryRate * state.infected * dt;

      const newS = Math.max(0, Math.min(1, state.susceptible + dS));
      const newR = Math.max(0, Math.min(1, state.recovered + dR));
      const newI = Math.max(0, Math.min(1 - newS - newR, state.infected + dI));

      // Track new infections
      if (state.phase === 'susceptible' && newI > 0.01) {
        newInfections.push(code);
      }

      const phase: SIRCountryState['phase'] =
        newI > 0.01
          ? (state.phase === 'initial_infection' ? 'initial_infection' : 'infected')
          : newR > 0.5
            ? 'recovered'
            : 'susceptible';

      newStates.set(code, {
        countryCode: code,
        susceptible: Math.round(newS * 10000) / 10000,
        infected: Math.round(newI * 10000) / 10000,
        recovered: Math.round(newR * 10000) / 10000,
        phase,
      });
    }

    // Update states
    for (const [code, state] of newStates) {
      states.set(code, state);
    }

    // Add new infections to the last time step result
    timeStepResults[timeStepResults.length - 1].newInfections = newInfections;
  }

  // Compute contagion paths
  const contagionPaths = computeContagionPaths(config, timeStepResults);

  // Count total affected countries
  let totalAffected = 0;
  for (const [, state] of states) {
    if (state.infected > 0.01 || state.recovered > 0.5) totalAffected++;
  }

  return {
    config,
    timeSteps: timeStepResults,
    finalStates: states,
    peakInfectionStep: peakStep,
    peakInfectionCount: Math.round(peakInfected * 100) / 100,
    totalAffectedCountries: totalAffected,
    contagionPaths,
  };
}

/**
 * Get the route-type specific amplification factor.
 * Conflict routes transmit risk faster than trade routes.
 */
function getRouteTypeFactor(routeType: TransmissionEdge['routeType']): number {
  switch (routeType) {
    case 'conflict': return 1.5;
    case 'supply_chain': return 1.2;
    case 'alliance': return 1.0;
    case 'trade': return 0.8;
    default: return 1.0;
  }
}

/**
 * Compute the most likely contagion paths from the simulation.
 * Identifies which countries infected which others and through which routes.
 */
function computeContagionPaths(
  config: SIRSimulationConfig,
  timeSteps: SIRTimeStep[]
): ContagionPath[] {
  const paths: ContagionPath[] = [];
  const infectionTimes = new Map<string, number>();

  // Find when each country first became infected
  for (const ts of timeSteps) {
    for (const [code, state] of ts.states) {
      if (state.infected > 0.01 && !infectionTimes.has(code)) {
        infectionTimes.set(code, ts.step);
      }
    }
  }

  // Build contagion paths based on network edges and infection timing
  for (const edge of TRANSMISSION_NETWORK) {
    const sourceTime = infectionTimes.get(edge.source);
    const targetTime = infectionTimes.get(edge.target);

    if (sourceTime !== undefined && targetTime !== undefined && targetTime > sourceTime) {
      const delay = (targetTime - sourceTime) * config.dt;
      const routeFactor = getRouteTypeFactor(edge.routeType);
      const probability = Math.min(1, edge.beta * edge.tradeVolume * routeFactor);

      paths.push({
        source: edge.source,
        target: edge.target,
        route: edge.routeType,
        transmissionProbability: Math.round(probability * 100) / 100,
        estimatedDelay: Math.round(delay * 10) / 10,
        tradeVolume: edge.tradeVolume,
      });
    }
  }

  return paths.sort((a, b) => b.transmissionProbability - a.transmissionProbability);
}

/**
 * Pre-configured simulation scenarios.
 */
export const SIR_SCENARIOS: Record<string, { config: SIRSimulationConfig; labelAr: string; labelEn: string; labelFr: string; labelTr: string; labelEs: string }> = {
  hormuz: {
    config: { ...DEFAULT_SIR_CONFIG, initialInfected: ['IR'], baseTransmissionRate: 0.35, recoveryRate: 0.08 },
    labelAr: 'إغلاق مضيق هرمز',
    labelEn: 'Strait of Hormuz Closure',
    labelFr: "Fermeture du détroit d'Hormuz",
    labelTr: 'Hürmüz Boğazı kapatılması',
    labelEs: 'Cierre del estrecho de Ormuz',
  },
  suez: {
    config: { ...DEFAULT_SIR_CONFIG, initialInfected: ['EG'], baseTransmissionRate: 0.3, recoveryRate: 0.1 },
    labelAr: 'أزمة قناة السويس',
    labelEn: 'Suez Canal Crisis',
    labelFr: 'Crise du canal de Suez',
    labelTr: 'Süveyş Kanalı krizi',
    labelEs: 'Crisis del Canal de Suez',
  },
  russia: {
    config: { ...DEFAULT_SIR_CONFIG, initialInfected: ['RU'], baseTransmissionRate: 0.4, recoveryRate: 0.06 },
    labelAr: 'تصعيد روسيا-الناتو',
    labelEn: 'Russia-NATO Escalation',
    labelFr: 'Escalade Russie-OTAN',
    labelTr: 'Rusya-NATO tırmanması',
    labelEs: 'Escalada Rusia-OTAN',
  },
  taiwan: {
    config: { ...DEFAULT_SIR_CONFIG, initialInfected: ['TW'], baseTransmissionRate: 0.45, recoveryRate: 0.05 },
    labelAr: 'أزمة تايوان',
    labelEn: 'Taiwan Crisis',
    labelFr: 'Crise de Taïwan',
    labelTr: 'Tayvan krizi',
    labelEs: 'Crisis de Taiwán',
  },
  middle_east: {
    config: { ...DEFAULT_SIR_CONFIG, initialInfected: ['IR', 'IQ', 'SY'], baseTransmissionRate: 0.35, recoveryRate: 0.07 },
    labelAr: 'حرب شرق أوسطية شاملة',
    labelEn: 'Full Middle East War',
    labelFr: 'Guerre totale au Moyen-Orient',
    labelTr: 'Tam Orta Doğu savaşı',
    labelEs: 'Guerra total en Medio Oriente',
  },
};
