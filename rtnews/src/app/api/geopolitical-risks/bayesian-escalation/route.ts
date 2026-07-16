import { NextResponse } from 'next/server';
import {
  initializeEscalationState,
  updateEscalationBayesian,
  HOTSPOT_SCENARIOS,
  getEscalationLabel,
  type BayesianEvent,
} from '@/lib/geopolitical/bayesian-escalation';

export const revalidate = 300; // Computational route — cache for 5 min instead of force-dynamic

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotspot = searchParams.get('hotspot') || 'iran_nuclear';

  try {
    const scenario = HOTSPOT_SCENARIOS[hotspot];

    if (!scenario) {
      return NextResponse.json({ error: 'Unknown hotspot scenario' }, { status: 400 });
    }

    // Initialize state and apply all events
    let state = initializeEscalationState(scenario.initialEvents[0]?.countryCode || 'IR');
    const updates = [];

    for (const event of scenario.initialEvents) {
      const { newState, update } = updateEscalationBayesian(state, event as BayesianEvent);
      updates.push({
        event: {
          id: event.id,
          type: event.type,
          severity: event.severity,
          descriptionAr: event.descriptionAr,
          descriptionEn: event.descriptionEn,
        },
        priorProbabilities: update.priorProbabilities,
        posteriorProbabilities: update.posteriorProbabilities,
        levelChanged: update.levelChanged,
        confidenceChange: update.confidenceChange,
        bayesFactor: update.bayesFactor,
      });
      state = newState;
    }

    return NextResponse.json({
      hotspot,
      labelAr: scenario.labelAr,
      labelEn: scenario.labelEn,
      currentState: {
        currentLevel: state.currentLevel,
        currentLevelLabelAr: getEscalationLabel(state.currentLevel, 'ar'),
        currentLevelLabelEn: getEscalationLabel(state.currentLevel, 'en'),
        probabilities: state.probabilities,
        confidence: state.confidence,
        priorEvents: state.priorEvents,
        trendDirection: state.trendDirection,
        lastUpdate: state.lastUpdate,
      },
      updates,
      availableHotspots: Object.entries(HOTSPOT_SCENARIOS).map(([key, s]) => ({
        key,
        labelAr: s.labelAr,
        labelEn: s.labelEn,
      })),
    });
  } catch (error) {
    console.error('[Bayesian API] Error:', error);
    return NextResponse.json({ error: 'Bayesian analysis failed' }, { status: 500 });
  }
}
