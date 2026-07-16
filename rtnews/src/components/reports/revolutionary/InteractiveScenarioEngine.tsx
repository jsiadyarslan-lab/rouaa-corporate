'use client';

import { useState, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════
// Revolutionary Addition #1: Interactive Scenario Engine
// Allows users to adjust scenario probabilities via sliders and
// see real-time impact recalculation on affected assets.
// Supports Arabic, English, and French.
// ═══════════════════════════════════════════════════════════════

interface Scenario {
  title: string;
  probability: number;
  content: string;
  emoji: string;
  color: string;
}

interface Props {
  scenarios: Scenario[];
  marketImpact: string;
  confidenceScore: number;
  locale?: 'en' | 'fr' | 'ar' | 'tr' | 'es';
}

const LABELS: Record<string, Record<string, string>> = {
  en: {
    title: 'Interactive Scenario Engine',
    adjustProbabilities: 'Adjust scenario probabilities to explore potential outcomes',
    probability: 'Probability',
    impact: 'Expected Impact',
    totalMustBe100: 'Total must equal 100%',
    reset: 'Reset',
    bullish: 'Bullish',
    bearish: 'Bearish',
    neutral: 'Neutral',
    high: 'High Impact',
    medium: 'Medium Impact',
    low: 'Low Impact',
    scenarioSummary: 'Scenario Summary',
    dominantScenario: 'Dominant Scenario',
    riskLevel: 'Risk Level',
    aggressive: 'Aggressive',
    balanced: 'Balanced',
    conservative: 'Conservative',
  },
  fr: {
    title: 'Moteur de Scénarios Interactif',
    adjustProbabilities: 'Ajustez les probabilités des scénarios pour explorer les résultats potentiels',
    probability: 'Probabilité',
    impact: 'Impact Attendu',
    totalMustBe100: 'Le total doit être égal à 100%',
    reset: 'Réinitialiser',
    bullish: 'Haussier',
    bearish: 'Baissier',
    neutral: 'Neutre',
    high: 'Impact Élevé',
    medium: 'Impact Moyen',
    low: 'Impact Faible',
    scenarioSummary: 'Résumé des Scénarios',
    dominantScenario: 'Scénario Dominant',
    riskLevel: 'Niveau de Risque',
    aggressive: 'Agressif',
    balanced: 'Équilibré',
    conservative: 'Conservateur',
  },
  ar: {
    title: 'محرك السيناريوهات التفاعلي',
    adjustProbabilities: 'اضبط احتمالات السيناريوهات لاستكشاف النتائج المحتملة',
    probability: 'الاحتمالية',
    impact: 'التأثير المتوقع',
    totalMustBe100: 'المجموع يجب أن يساوي 100%',
    reset: 'إعادة تعيين',
    bullish: 'صاعد',
    bearish: 'هابط',
    neutral: 'محايد',
    high: 'تأثير عالي',
    medium: 'تأثير متوسط',
    low: 'تأثير منخفض',
    scenarioSummary: 'ملخص السيناريوهات',
    dominantScenario: 'السيناريو السائد',
    riskLevel: 'مستوى المخاطرة',
    aggressive: 'عدواني',
    balanced: 'متوازن',
    conservative: 'محافظ',
  },
  es: {
    title: 'Motor de Escenarios Interactivo',
    adjustProbabilities: 'Ajuste las probabilidades de los escenarios para explorar resultados potenciales',
    probability: 'Probabilidad',
    impact: 'Impacto Esperado',
    totalMustBe100: 'El total debe ser igual a 100%',
    reset: 'Restablecer',
    bullish: 'Alcista',
    bearish: 'Bajista',
    neutral: 'Neutral',
    high: 'Impacto Alto',
    medium: 'Impacto Medio',
    low: 'Impacto Bajo',
    scenarioSummary: 'Resumen de Escenarios',
    dominantScenario: 'Escenario Dominante',
    riskLevel: 'Nivel de Riesgo',
    aggressive: 'Agresivo',
    balanced: 'Equilibrado',
    conservative: 'Conservador',
  },
};

export default function InteractiveScenarioEngine({ scenarios, marketImpact, confidenceScore, locale = 'en' }: Props) {
  const t = useCallback((key: string) => LABELS[locale]?.[key] || LABELS.en[key] || key, [locale]);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const initialProbs = useMemo(() => scenarios.map(s => s.probability), [scenarios]);
  const [probabilities, setProbabilities] = useState<number[]>(initialProbs);
  const [isExpanded, setIsExpanded] = useState(false);

  const total = probabilities.reduce((sum, p) => sum + p, 0);
  const isValid = Math.abs(total - 100) < 2;

  const handleSliderChange = useCallback((index: number, value: number) => {
    setProbabilities(prev => {
      const next = [...prev];
      next[index] = value;
      // Auto-normalize other values to keep total near 100
      const othersTotal = next.reduce((s, p, i) => i !== index ? s + p : s, 0);
      if (othersTotal > 0 && Math.abs(next.reduce((s, p) => s + p, 0) - 100) > 5) {
        const scale = (100 - value) / othersTotal;
        for (let i = 0; i < next.length; i++) {
          if (i !== index) next[i] = Math.max(5, Math.round(next[i] * scale));
        }
      }
      return next;
    });
  }, []);

  const handleReset = useCallback(() => setProbabilities(initialProbs), [initialProbs]);

  // Determine dominant scenario
  const dominantIdx = probabilities.indexOf(Math.max(...probabilities));
  const dominant = scenarios[dominantIdx];

  // Calculate risk level based on dominant scenario
  const riskLevel = useMemo(() => {
    const bearishProb = scenarios.reduce((sum, s, i) => {
      const isBearish = /baissier|bearish|هابط|متشائم/i.test(s.title);
      return isBearish ? sum + probabilities[i] : sum;
    }, 0);
    if (bearishProb > 50) return 'aggressive';
    if (bearishProb > 30) return 'balanced';
    return 'conservative';
  }, [scenarios, probabilities]);

  const riskColor = riskLevel === 'aggressive' ? '#D4365C' : riskLevel === 'balanced' ? '#D4930D' : '#00996B';

  if (scenarios.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(10, 14, 39, 0.6)',
      border: '1px solid rgba(0, 229, 255, 0.15)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      direction: dir,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>&#9881;</span>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-head)', margin: 0 }}>{t('title')}</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            fontSize: '11px', padding: '4px 12px', borderRadius: '6px',
            background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)',
            color: 'var(--cyan)', cursor: 'pointer', fontWeight: 600,
          }}
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '0 0 16px 0' }}>{t('adjustProbabilities')}</p>

      {/* Scenario Sliders */}
      {scenarios.map((scenario, idx) => (
        <div key={idx} style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: scenario.color }}>
              {scenario.emoji} {scenario.title}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)' }}>
              {probabilities[idx]}%
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={85}
            value={probabilities[idx]}
            onChange={e => handleSliderChange(idx, parseInt(e.target.value))}
            style={{
              width: '100%', height: '6px', borderRadius: '3px',
              background: `linear-gradient(to right, ${scenario.color} ${probabilities[idx]}%, rgba(128,128,128,0.15) ${probabilities[idx]}%)`,
              appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          />
        </div>
      ))}

      {/* Total indicator */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px', borderRadius: '6px', marginBottom: '12px',
        background: isValid ? 'rgba(0,153,107,0.1)' : 'rgba(212,54,92,0.1)',
        border: `1px solid ${isValid ? 'rgba(0,153,107,0.2)' : 'rgba(212,54,92,0.2)'}`,
      }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: isValid ? '#00996B' : '#D4365C' }}>
          {isValid ? '✓' : '⚠'} {t('probability')}: {total}%
        </span>
        <button onClick={handleReset} style={{
          fontSize: '11px', padding: '2px 10px', borderRadius: '4px',
          background: 'rgba(128,128,128,0.1)', border: '1px solid rgba(128,128,128,0.15)',
          color: 'var(--text2)', cursor: 'pointer',
        }}>
          {t('reset')}
        </button>
      </div>

      {/* Expanded: Scenario Summary */}
      {isExpanded && (
        <div style={{
          padding: '16px', borderRadius: '8px',
          background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.08)',
        }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)', marginBottom: '12px' }}>
            {t('scenarioSummary')}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(128,128,128,0.05)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>{t('dominantScenario')}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: dominant?.color || 'var(--text-head)' }}>
                {dominant?.emoji} {dominant?.title}
              </div>
            </div>
            <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(128,128,128,0.05)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>{t('riskLevel')}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: riskColor }}>
                {t(riskLevel)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
