import { NextResponse } from 'next/server';
import { runSIRSimulation, SIR_SCENARIOS, DEFAULT_SIR_CONFIG, type SIRSimulationConfig } from '@/lib/geopolitical/sir-contagion-model';

export const revalidate = 300; // Computational route — cache for 5 min instead of force-dynamic

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenario = searchParams.get('scenario') || 'hormuz';

  try {
    const scenarioConfig = SIR_SCENARIOS[scenario];

    let config: SIRSimulationConfig;
    if (scenarioConfig) {
      config = scenarioConfig.config;
    } else {
      // Custom config from params
      const initialInfected = searchParams.get('countries')?.split(',') || ['IR'];
      config = {
        ...DEFAULT_SIR_CONFIG,
        initialInfected,
        baseTransmissionRate: parseFloat(searchParams.get('beta') || '0.3'),
        recoveryRate: parseFloat(searchParams.get('gamma') || '0.1'),
        timeSteps: parseInt(searchParams.get('steps') || '50'),
        dt: parseFloat(searchParams.get('dt') || '0.2'),
        tradeMultiplier: parseFloat(searchParams.get('tradeMultiplier') || '1.5'),
      };
    }

    const result = runSIRSimulation(config);

    // Serialize Maps for JSON
    const serializedTimeSteps = result.timeSteps.map(ts => ({
      step: ts.step,
      states: Object.fromEntries(ts.states),
      totalInfected: ts.totalInfected,
      totalSusceptible: ts.totalSusceptible,
      totalRecovered: ts.totalRecovered,
      newInfections: ts.newInfections,
    }));

    const serializedResult = {
      config: result.config,
      timeSteps: serializedTimeSteps,
      finalStates: Object.fromEntries(result.finalStates),
      peakInfectionStep: result.peakInfectionStep,
      peakInfectionCount: result.peakInfectionCount,
      totalAffectedCountries: result.totalAffectedCountries,
      contagionPaths: result.contagionPaths,
    };

    return NextResponse.json(serializedResult);
  } catch (error) {
    console.error('[SIR API] Error:', error);
    return NextResponse.json({ error: 'SIR simulation failed' }, { status: 500 });
  }
}
