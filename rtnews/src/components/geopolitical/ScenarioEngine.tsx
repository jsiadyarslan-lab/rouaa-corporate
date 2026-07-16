'use client';

import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { t } from '@/lib/geopolitical/i18n';

interface ScenarioOption {
  id: string;
  labelAr: string;
  labelEn: string;
  labelFr: string;
  labelEs: string;
  labelTr: string;
}

interface ScenarioOutcome {
  label: 'base' | 'adverse' | 'severe';
  probability: number;
  oilImpact: number;
  goldImpact: number;
  dollarImpact: number;
  tasiImpact: number;
}

interface ScenarioEngineProps {
  locale: string;
}

const SCENARIOS: ScenarioOption[] = [
  {
    id: 'hormuz',
    labelAr: 'إغلاق مضيق هرمز',
    labelEn: 'Closure of Strait of Hormuz',
    labelFr: 'Fermeture du détroit d\'Hormuz',
    labelEs: 'Cierre del estrecho de Ormuz',
    labelTr: 'Hürmüz Boğazı\'nın kapatılması',
  },
  {
    id: 'us-china',
    labelAr: 'تصعيد الحرب التجارية الأمريكية الصينية',
    labelEn: 'US-China Trade War Escalation',
    labelFr: 'Escalade de la guerre commerciale USA-Chine',
    labelEs: 'Escalada de guerra comercial EE.UU.-China',
    labelTr: 'ABD-Çin ticaret savaşı tırmanması',
  },
  {
    id: 'taiwan',
    labelAr: 'أزمة مضيق تايوان',
    labelEn: 'Taiwan Strait Crisis',
    labelFr: 'Crise du détroit de Taïwan',
    labelEs: 'Crisis del estrecho de Taiwán',
    labelTr: 'Tayvan Boğazı krizi',
  },
  {
    id: 'middle-east',
    labelAr: 'حرب إقليمية في الشرق الأوسط',
    labelEn: 'Regional War in the Middle East',
    labelFr: 'Guerre régionale au Moyen-Orient',
    labelEs: 'Guerra regional en Medio Oriente',
    labelTr: 'Ortadoğu\'da bölgesel savaş',
  },
  {
    id: 'russia-nato',
    labelAr: 'مواجهة روسيا-الناتو',
    labelEn: 'Russia-NATO Confrontation',
    labelFr: 'Confrontation Russie-OTAN',
    labelEs: 'Confrontación Rusia-OTAN',
    labelTr: 'Rusya-NATO karşılaşması',
  },
];

const SCENARIO_DATA: Record<string, Record<string, ScenarioOutcome[]>> = {
  '1-week': {
    hormuz: [
      { label: 'base', probability: 40, oilImpact: 12, goldImpact: 5, dollarImpact: -2, tasiImpact: -8 },
      { label: 'adverse', probability: 45, oilImpact: 28, goldImpact: 12, dollarImpact: -5, tasiImpact: -18 },
      { label: 'severe', probability: 15, oilImpact: 55, goldImpact: 22, dollarImpact: -10, tasiImpact: -32 },
    ],
    'us-china': [
      { label: 'base', probability: 50, oilImpact: -3, goldImpact: 3, dollarImpact: 1, tasiImpact: -2 },
      { label: 'adverse', probability: 35, oilImpact: -8, goldImpact: 8, dollarImpact: 3, tasiImpact: -7 },
      { label: 'severe', probability: 15, oilImpact: -15, goldImpact: 15, dollarImpact: 6, tasiImpact: -14 },
    ],
    taiwan: [
      { label: 'base', probability: 55, oilImpact: 2, goldImpact: 3, dollarImpact: 1, tasiImpact: -3 },
      { label: 'adverse', probability: 30, oilImpact: 8, goldImpact: 10, dollarImpact: 3, tasiImpact: -10 },
      { label: 'severe', probability: 15, oilImpact: 20, goldImpact: 20, dollarImpact: -5, tasiImpact: -25 },
    ],
    'middle-east': [
      { label: 'base', probability: 35, oilImpact: 8, goldImpact: 4, dollarImpact: -1, tasiImpact: -6 },
      { label: 'adverse', probability: 40, oilImpact: 22, goldImpact: 10, dollarImpact: -4, tasiImpact: -16 },
      { label: 'severe', probability: 25, oilImpact: 45, goldImpact: 20, dollarImpact: -8, tasiImpact: -30 },
    ],
    'russia-nato': [
      { label: 'base', probability: 45, oilImpact: 5, goldImpact: 6, dollarImpact: 2, tasiImpact: -4 },
      { label: 'adverse', probability: 35, oilImpact: 15, goldImpact: 14, dollarImpact: 4, tasiImpact: -12 },
      { label: 'severe', probability: 20, oilImpact: 35, goldImpact: 25, dollarImpact: -3, tasiImpact: -22 },
    ],
  },
  '1-month': {
    hormuz: [
      { label: 'base', probability: 30, oilImpact: 8, goldImpact: 4, dollarImpact: -1, tasiImpact: -5 },
      { label: 'adverse', probability: 45, oilImpact: 22, goldImpact: 10, dollarImpact: -4, tasiImpact: -15 },
      { label: 'severe', probability: 25, oilImpact: 48, goldImpact: 18, dollarImpact: -8, tasiImpact: -28 },
    ],
    'us-china': [
      { label: 'base', probability: 45, oilImpact: -2, goldImpact: 2, dollarImpact: 1, tasiImpact: -1 },
      { label: 'adverse', probability: 35, oilImpact: -6, goldImpact: 7, dollarImpact: 2, tasiImpact: -6 },
      { label: 'severe', probability: 20, oilImpact: -12, goldImpact: 14, dollarImpact: 5, tasiImpact: -12 },
    ],
    taiwan: [
      { label: 'base', probability: 50, oilImpact: 1, goldImpact: 2, dollarImpact: 1, tasiImpact: -2 },
      { label: 'adverse', probability: 30, oilImpact: 6, goldImpact: 8, dollarImpact: 2, tasiImpact: -8 },
      { label: 'severe', probability: 20, oilImpact: 18, goldImpact: 18, dollarImpact: -4, tasiImpact: -22 },
    ],
    'middle-east': [
      { label: 'base', probability: 30, oilImpact: 6, goldImpact: 3, dollarImpact: -1, tasiImpact: -4 },
      { label: 'adverse', probability: 40, oilImpact: 18, goldImpact: 8, dollarImpact: -3, tasiImpact: -14 },
      { label: 'severe', probability: 30, oilImpact: 40, goldImpact: 18, dollarImpact: -7, tasiImpact: -26 },
    ],
    'russia-nato': [
      { label: 'base', probability: 40, oilImpact: 4, goldImpact: 5, dollarImpact: 2, tasiImpact: -3 },
      { label: 'adverse', probability: 35, oilImpact: 12, goldImpact: 12, dollarImpact: 3, tasiImpact: -10 },
      { label: 'severe', probability: 25, oilImpact: 30, goldImpact: 22, dollarImpact: -2, tasiImpact: -20 },
    ],
  },
  '3-month': {
    hormuz: [
      { label: 'base', probability: 25, oilImpact: 5, goldImpact: 3, dollarImpact: 0, tasiImpact: -3 },
      { label: 'adverse', probability: 40, oilImpact: 18, goldImpact: 8, dollarImpact: -3, tasiImpact: -12 },
      { label: 'severe', probability: 35, oilImpact: 42, goldImpact: 16, dollarImpact: -6, tasiImpact: -24 },
    ],
    'us-china': [
      { label: 'base', probability: 40, oilImpact: -1, goldImpact: 2, dollarImpact: 1, tasiImpact: -1 },
      { label: 'adverse', probability: 35, oilImpact: -5, goldImpact: 6, dollarImpact: 2, tasiImpact: -5 },
      { label: 'severe', probability: 25, oilImpact: -10, goldImpact: 12, dollarImpact: 4, tasiImpact: -10 },
    ],
    taiwan: [
      { label: 'base', probability: 45, oilImpact: 1, goldImpact: 2, dollarImpact: 1, tasiImpact: -1 },
      { label: 'adverse', probability: 30, oilImpact: 5, goldImpact: 7, dollarImpact: 2, tasiImpact: -6 },
      { label: 'severe', probability: 25, oilImpact: 15, goldImpact: 16, dollarImpact: -3, tasiImpact: -18 },
    ],
    'middle-east': [
      { label: 'base', probability: 25, oilImpact: 4, goldImpact: 2, dollarImpact: 0, tasiImpact: -3 },
      { label: 'adverse', probability: 40, oilImpact: 15, goldImpact: 7, dollarImpact: -2, tasiImpact: -12 },
      { label: 'severe', probability: 35, oilImpact: 35, goldImpact: 16, dollarImpact: -5, tasiImpact: -22 },
    ],
    'russia-nato': [
      { label: 'base', probability: 35, oilImpact: 3, goldImpact: 4, dollarImpact: 1, tasiImpact: -2 },
      { label: 'adverse', probability: 35, oilImpact: 10, goldImpact: 10, dollarImpact: 2, tasiImpact: -8 },
      { label: 'severe', probability: 30, oilImpact: 25, goldImpact: 20, dollarImpact: -1, tasiImpact: -18 },
    ],
  },
};

const DURATION_OPTIONS = [
  { value: '1-week', labelAr: 'أسبوع واحد', labelEn: '1 Week', labelFr: '1 semaine', labelEs: '1 semana', labelTr: '1 hafta' },
  { value: '1-month', labelAr: 'شهر واحد', labelEn: '1 Month', labelFr: '1 mois', labelEs: '1 mes', labelTr: '1 ay' },
  { value: '3-month', labelAr: '3 أشهر', labelEn: '3 Months', labelFr: '3 mois', labelEs: '3 meses', labelTr: '3 ay' },
];

const OUTCOME_COLORS: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  base: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', text: '#22C55E', accent: '#22C55E' },
  adverse: { bg: 'rgba(255,184,0,0.08)', border: 'rgba(255,184,0,0.25)', text: '#FFB800', accent: '#FFB800' },
  severe: { bg: 'rgba(239,83,80,0.08)', border: 'rgba(239,83,80,0.25)', text: '#EF5350', accent: '#EF5350' },
};

const OUTCOME_LABELS: Record<string, Record<string, string>> = {
  base: { ar: 'السيناريو الأساسي', en: 'Base Scenario', fr: 'Scénario de base', es: 'Escenario base', tr: 'Temel senaryo' },
  adverse: { ar: 'السيناريو المعاكس', en: 'Adverse Scenario', fr: 'Scénario adverse', es: 'Escenario adverso', tr: 'Olumsuz senaryo' },
  severe: { ar: 'السيناريو الحاد', en: 'Severe Scenario', fr: 'Scénario sévère', es: 'Escenario severo', tr: 'Şiddetli senaryo' },
};

const ASSET_LABELS: Record<string, Record<string, string>> = {
  oil: { ar: 'النفط', en: 'Oil', fr: 'Pétrole', es: 'Petróleo', tr: 'Petrol' },
  gold: { ar: 'الذهب', en: 'Gold', fr: 'Or', es: 'Oro', tr: 'Altın' },
  dollar: { ar: 'الدولار', en: 'USD', fr: 'USD', es: 'USD', tr: 'USD' },
  tasi: { ar: 'تاسي', en: 'TASI', fr: 'TASI', es: 'TASI', tr: 'TASI' },
};

function getLocalizedLabel(dict: Record<string, Record<string, string>>, key: string, locale: string): string {
  return dict[key]?.[locale] ?? dict[key]?.['en'] ?? key;
}

export default function ScenarioEngine({ locale }: ScenarioEngineProps) {
  const isRtl = locale === 'ar';
  const [selectedScenario, setSelectedScenario] = useState('hormuz');
  const [duration, setDuration] = useState('1-month');

  const outcomes = useMemo(() => {
    const durationData = SCENARIO_DATA[duration];
    if (!durationData) return [];
    return durationData[selectedScenario] ?? [];
  }, [selectedScenario, duration]);

  // Pre-compute scenario label lookup to avoid Object.fromEntries() on every render
  const scenarioLabelMap = useMemo(() =>
    Object.fromEntries(SCENARIOS.map((sc) => [sc.id, { ar: sc.labelAr, en: sc.labelEn, fr: sc.labelFr, es: sc.labelEs, tr: sc.labelTr }])),
    []
  );

  const durationLabelMap = useMemo(() =>
    Object.fromEntries(DURATION_OPTIONS.map((opt) => [opt.value, { ar: opt.labelAr, en: opt.labelEn, fr: opt.labelFr, es: opt.labelEs, tr: opt.labelTr }])),
    []
  );

  const distributionBars = useMemo(() => {
    return outcomes.map((o) => ({
      label: o.label,
      probability: o.probability,
      color: OUTCOME_COLORS[o.label]?.accent ?? '#888',
    }));
  }, [outcomes]);

  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <h3
        className="text-lg font-bold mb-4"
        style={{ color: 'var(--text-head)' }}
      >
        {t('scenarios.simulation', locale)}
      </h3>

      {/* Selectors */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text3)' }}>
            {t('scenarios.scenario', locale)}
          </label>
          <Select value={selectedScenario} onValueChange={setSelectedScenario}>
            <SelectTrigger
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--bg4)',
                borderColor: 'var(--rim)',
                color: 'var(--text)',
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
            >
              {SCENARIOS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {getLocalizedLabel(scenarioLabelMap, s.id, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:w-40">
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text3)' }}>
            {t('scenarios.duration', locale)}
          </label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--bg4)',
                borderColor: 'var(--rim)',
                color: 'var(--text)',
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
            >
              {DURATION_OPTIONS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {getLocalizedLabel(durationLabelMap, d.value, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Probability Distribution Histogram */}
      <div className="mb-6">
        <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>
          {t('scenarios.probDistribution', locale)}
        </h4>
        <div className="flex items-end gap-2 h-24">
          {distributionBars.map((bar) => (
            <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold tabular-nums" style={{ color: bar.color }}>
                {bar.probability}%
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${bar.probability}%`,
                  background: bar.color,
                  minHeight: '4px',
                  opacity: 0.85,
                }}
              />
              <span className="text-[10px] font-medium" style={{ color: 'var(--text3)' }}>
                {getLocalizedLabel(OUTCOME_LABELS, bar.label, locale).split(' ').pop()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Outcome Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {outcomes.map((outcome) => {
          const colors = OUTCOME_COLORS[outcome.label];
          const outcomeLabel = getLocalizedLabel(OUTCOME_LABELS, outcome.label, locale);
          const assetKeys = ['oil', 'gold', 'dollar', 'tasi'] as const;
          const impactValues = [
            outcome.oilImpact,
            outcome.goldImpact,
            outcome.dollarImpact,
            outcome.tasiImpact,
          ];

          return (
            <div
              key={outcome.label}
              className="rounded-xl border p-4 transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: colors.bg,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold" style={{ color: colors.text }}>
                  {outcomeLabel}
                </h4>
                <span
                  className="text-lg font-bold tabular-nums"
                  style={{ color: colors.text }}
                >
                  {outcome.probability}%
                </span>
              </div>

              <div className="space-y-2">
                {assetKeys.map((asset, i) => {
                  const val = impactValues[i];
                  const isPos = val > 0;
                  return (
                    <div key={asset} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--text2)' }}>
                        {getLocalizedLabel(ASSET_LABELS, asset, locale)}
                      </span>
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: isPos ? 'var(--bull)' : 'var(--bear)' }}
                      >
                        {isPos ? '+' : ''}{val}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
