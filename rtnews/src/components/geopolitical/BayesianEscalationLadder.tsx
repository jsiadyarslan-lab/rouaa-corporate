'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  ESCALATION_LEVELS,
  HOTSPOT_SCENARIOS,
  initializeEscalationState,
  updateEscalationBayesian,
  getEscalationLabel,
  type EscalationLevel,
  type EscalationState,
  type BayesianEvent,
} from '@/lib/geopolitical/bayesian-escalation';
import { t } from '@/lib/geopolitical/i18n';

// ─── Props ────────────────────────────────────────────────────────
interface BayesianEscalationLadderProps {
  locale: string;
}

// ─── Inline i18n strings ──────────────────────────────────────────
const UI_LABELS: Record<string, Record<string, string>> = {
  title: {
    ar: 'سُلّم التصعيد البيزي',
    en: 'Bayesian Escalation Ladder',
    fr: 'Échelle d\'escalade bayésienne',
    tr: 'Bayesyen Tırmanma Merdiveni',
    es: 'Escalera de escalada bayesiana',
  },
  hotspot: {
    ar: 'نقطة التأزم',
    en: 'Hotspot',
    fr: 'Point chaud',
    tr: 'Sıcak nokta',
    es: 'Punto crítico',
  },
  currentLevel: {
    ar: 'مستوى التصعيد الحالي',
    en: 'Current Escalation Level',
    fr: 'Niveau d\'escalade actuel',
    tr: 'Mevcut tırmanma seviyesi',
    es: 'Nivel de escalada actual',
  },
  trend: {
    ar: 'الاتجاه',
    en: 'Trend',
    fr: 'Tendance',
    tr: 'Eğilim',
    es: 'Tendencia',
  },
  confidence: {
    ar: 'مستوى الثقة',
    en: 'Confidence',
    fr: 'Confiance',
    tr: 'Güven',
    es: 'Confianza',
  },
  probability: {
    ar: 'الاحتمال',
    en: 'Probability',
    fr: 'Probabilité',
    tr: 'Olasılık',
    es: 'Probabilidad',
  },
  marketImpact: {
    ar: 'التأثير على السوق',
    en: 'Market Impact',
    fr: 'Impact marché',
    tr: 'Piyasa etkisi',
    es: 'Impacto de mercado',
  },
  recentEvents: {
    ar: 'أحداث حديثة',
    en: 'Recent Events',
    fr: 'Événements récents',
    tr: 'Son olaylar',
    es: 'Eventos recientes',
  },
  escalating: {
    ar: 'تصاعد ↑',
    en: 'Escalating ↑',
    fr: 'Escalade ↑',
    tr: 'Tırmanıyor ↑',
    es: 'Escalando ↑',
  },
  stable: {
    ar: 'مستقر →',
    en: 'Stable →',
    fr: 'Stable →',
    tr: 'Kararlı →',
    es: 'Estable →',
  },
  deEscalating: {
    ar: 'تراجع ↓',
    en: 'De-escalating ↓',
    fr: 'Désescalade ↓',
    tr: 'Geri çekiliyor ↓',
    es: 'Desescalada ↓',
  },
  oil: { ar: 'النفط', en: 'Oil', fr: 'Pétrole', es: 'Petróleo', tr: 'Petrol' },
  gold: { ar: 'الذهب', en: 'Gold', fr: 'Or', es: 'Oro', tr: 'Altın' },
  dollar: { ar: 'الدولار', en: 'USD', fr: 'USD', es: 'USD', tr: 'USD' },
  equities: { ar: 'الأسهم', en: 'Equities', fr: 'Actions', es: 'Acciones', tr: 'Hisse' },
  eventsApplied: {
    ar: 'أحداث مُطبّقة',
    en: 'Events applied',
    fr: 'Événements appliqués',
    tr: 'Uygulanan olaylar',
    es: 'Eventos aplicados',
  },
  bayesianModel: {
    ar: 'نموذج بايزي',
    en: 'Bayesian Model',
    fr: 'Modèle bayésien',
    tr: 'Bayesyen model',
    es: 'Modelo bayesiano',
  },
};

function tLocal(key: string, locale: string): string {
  return UI_LABELS[key]?.[locale] ?? UI_LABELS[key]?.['en'] ?? key;
}

function tTrend(direction: EscalationState['trendDirection'], locale: string): string {
  switch (direction) {
    case 'escalating': return tLocal('escalating', locale);
    case 'de_escalating': return tLocal('deEscalating', locale);
    default: return tLocal('stable', locale);
  }
}

const TREND_COLORS: Record<EscalationState['trendDirection'], string> = {
  escalating: '#EF4444',
  stable: '#F59E0B',
  de_escalating: '#22C55E',
};

const HOTSPOT_IDS = Object.keys(HOTSPOT_SCENARIOS);

function getHotspotLabel(hotspotId: string, locale: string): string {
  const scenario = HOTSPOT_SCENARIOS[hotspotId];
  if (!scenario) return hotspotId;
  switch (locale) {
    case 'ar': return scenario.labelAr;
    case 'fr': return scenario.labelFr;
    case 'tr': return scenario.labelTr;
    case 'es': return scenario.labelEs;
    default: return scenario.labelEn;
  }
}

function formatTimestamp(iso: string, locale: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ─── Component ────────────────────────────────────────────────────
export default function BayesianEscalationLadder({ locale }: BayesianEscalationLadderProps) {
  const isRtl = locale === 'ar';
  const [selectedHotspot, setSelectedHotspot] = useState<string>(HOTSPOT_IDS[0]);
  const [animKey, setAnimKey] = useState(0);

  // ── Build escalation state from scenario events ──────────────
  const { state, appliedEvents } = useMemo(() => {
    const scenario = HOTSPOT_SCENARIOS[selectedHotspot];
    let currentState = initializeEscalationState(
      scenario?.initialEvents?.[0]?.countryCode ?? selectedHotspot
    );
    const events: BayesianEvent[] = [];

    if (scenario?.initialEvents) {
      for (const event of scenario.initialEvents) {
        const { newState } = updateEscalationBayesian(currentState, event);
        currentState = newState;
        events.push(event);
      }
    }

    return { state: currentState, appliedEvents: events };
  }, [selectedHotspot]);

  // ── Re-trigger bar animation on hotspot change ───────────────
  const handleHotspotChange = useCallback((value: string) => {
    setSelectedHotspot(value);
    setAnimKey((k) => k + 1);
  }, []);

  // ── Current level metadata ───────────────────────────────────
  const currentLevelMeta = useMemo(
    () => ESCALATION_LEVELS.find((l) => l.level === state.currentLevel) ?? ESCALATION_LEVELS[0],
    [state.currentLevel]
  );

  // ── Sorted levels (1 → 6) ───────────────────────────────────
  const sortedLevels = useMemo(
    () => [...ESCALATION_LEVELS].sort((a, b) => a.order - b.order),
    []
  );

  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3
            className="text-lg font-bold"
            style={{ color: 'var(--text-head)' }}
          >
            {tLocal('title', locale)}
          </h3>
          <span
            className="text-xs mt-0.5 inline-flex items-center gap-1.5"
            style={{ color: 'var(--text3)' }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.5)' }}
            />
            {tLocal('bayesianModel', locale)}
          </span>
        </div>

        {/* Hotspot selector */}
        <div className="sm:w-56">
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text3)' }}>
            {tLocal('hotspot', locale)}
          </label>
          <Select value={selectedHotspot} onValueChange={handleHotspotChange}>
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
              {HOTSPOT_IDS.map((id) => (
                <SelectItem key={id} value={id}>
                  {getHotspotLabel(id, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Summary Strip ─────────────────────────────────────── */}
      <div
        className="rounded-lg border p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{
          background: `${currentLevelMeta.color}10`,
          borderColor: `${currentLevelMeta.color}40`,
        }}
      >
        {/* Current level badge */}
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{
              background: currentLevelMeta.color,
              boxShadow: `0 0 12px ${currentLevelMeta.color}80`,
            }}
          />
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {tLocal('currentLevel', locale)}
            </div>
            <div
              className="text-base font-bold"
              style={{ color: currentLevelMeta.color }}
            >
              {getEscalationLabel(state.currentLevel, locale)}
            </div>
          </div>
        </div>

        {/* Trend */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium" style={{ color: 'var(--text3)' }}>
            {tLocal('trend', locale)}
          </div>
          <span
            className="text-sm font-bold px-2.5 py-1 rounded-md"
            style={{
              color: TREND_COLORS[state.trendDirection],
              background: `${TREND_COLORS[state.trendDirection]}15`,
            }}
          >
            {tTrend(state.trendDirection, locale)}
          </span>
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium" style={{ color: 'var(--text3)' }}>
            {tLocal('confidence', locale)}
          </div>
          <span
            className="text-sm font-bold tabular-nums px-2.5 py-1 rounded-md"
            style={{
              color: 'var(--text)',
              background: 'var(--bg4)',
            }}
          >
            {Math.round(state.confidence * 100)}%
          </span>
        </div>

        {/* Events applied */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium" style={{ color: 'var(--text3)' }}>
            {tLocal('eventsApplied', locale)}
          </div>
          <span
            className="text-sm font-bold tabular-nums px-2.5 py-1 rounded-md"
            style={{
              color: 'var(--text)',
              background: 'var(--bg4)',
            }}
          >
            {state.priorEvents}
          </span>
        </div>
      </div>

      {/* ── Escalation Ladder ─────────────────────────────────── */}
      <div className="mb-6">
        <h4 className="text-xs font-medium mb-3" style={{ color: 'var(--text3)' }}>
          {tLocal('probability', locale)}
        </h4>
        <div className="relative">
          {/* Connecting line behind the ladder */}
          <div
            className="absolute top-3 bottom-3 w-0.5"
            style={{
              [isRtl ? 'right' : 'left']: '11px',
              background: 'var(--rim)',
            }}
          />

          <div className="space-y-1.5">
            {sortedLevels.map((levelMeta) => {
              const prob = state.probabilities[levelMeta.level];
              const isCurrent = levelMeta.level === state.currentLevel;
              const probPercent = Math.round(prob * 100);

              return (
                <div
                  key={levelMeta.level}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg transition-all duration-200',
                    isCurrent ? 'p-3' : 'p-2'
                  )}
                  style={{
                    background: isCurrent ? `${levelMeta.color}12` : 'transparent',
                    border: isCurrent ? `1px solid ${levelMeta.color}40` : '1px solid transparent',
                  }}
                >
                  {/* Node dot */}
                  <div
                    className="relative z-10 flex-shrink-0 rounded-full flex items-center justify-center"
                    style={{
                      width: isCurrent ? '24px' : '16px',
                      height: isCurrent ? '24px' : '16px',
                      background: isCurrent ? levelMeta.color : 'var(--bg4)',
                      border: isCurrent ? `2px solid ${levelMeta.color}` : `2px solid ${levelMeta.color}60`,
                      boxShadow: isCurrent
                        ? `0 0 16px ${levelMeta.color}60`
                        : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isCurrent && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: '#fff' }}
                      />
                    )}
                  </div>

                  {/* Level label */}
                  <div className="w-28 sm:w-36 flex-shrink-0">
                    <span
                      className={cn('text-xs', isCurrent ? 'font-bold' : 'font-medium')}
                      style={{ color: isCurrent ? levelMeta.color : 'var(--text2)' }}
                    >
                      {getEscalationLabel(levelMeta.level, locale)}
                    </span>
                  </div>

                  {/* Probability bar */}
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <div
                      className="h-6 rounded-md overflow-hidden flex-1 relative"
                      style={{ background: 'var(--bg4)' }}
                    >
                      <div
                        key={`${levelMeta.level}-${animKey}`}
                        className="h-full rounded-md transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.max(probPercent, 2)}%`,
                          background: `linear-gradient(90deg, ${levelMeta.color}CC, ${levelMeta.color}88)`,
                          boxShadow: isCurrent
                            ? `0 0 12px ${levelMeta.color}50`
                            : 'none',
                          animation: 'barGrow 0.7s ease-out',
                        }}
                      />
                      {isCurrent && (
                        <div
                          className="absolute inset-0 rounded-md pointer-events-none"
                          style={{
                            background: `linear-gradient(90deg, transparent 60%, ${levelMeta.color}30)`,
                          }}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs tabular-nums flex-shrink-0 w-10 text-right',
                        isCurrent ? 'font-bold' : 'font-medium'
                      )}
                      style={{ color: isCurrent ? levelMeta.color : 'var(--text2)' }}
                    >
                      {probPercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Market Impact ─────────────────────────────────────── */}
      <div className="mb-6">
        <h4 className="text-xs font-medium mb-3" style={{ color: 'var(--text3)' }}>
          {tLocal('marketImpact', locale)}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['oil', 'gold', 'dollar', 'equities'] as const).map((asset) => {
            const impact = currentLevelMeta.marketImpact[asset];
            const isPos = impact > 0;
            return (
              <div
                key={asset}
                className="rounded-lg border p-3 text-center"
                style={{
                  background: 'var(--bg4)',
                  borderColor: 'var(--rim)',
                }}
              >
                <div className="text-xs mb-1" style={{ color: 'var(--text3)' }}>
                  {t(asset, locale)}
                </div>
                <div
                  className="text-lg font-bold tabular-nums"
                  style={{ color: isPos ? 'var(--bull)' : 'var(--bear)' }}
                >
                  {isPos ? '+' : ''}{impact}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent Events ─────────────────────────────────────── */}
      <div>
        <h4 className="text-xs font-medium mb-3" style={{ color: 'var(--text3)' }}>
          {tLocal('recentEvents', locale)}
        </h4>
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'thin' }}>
          {appliedEvents.map((event, idx) => {
            const desc = locale === 'ar'
              ? event.descriptionAr
              : event.descriptionEn;
            const typeColor: Record<BayesianEvent['type'], string> = {
              military: '#EF4444',
              diplomatic: '#3B82F6',
              economic: '#F59E0B',
              cyber: '#8B5CF6',
              political: '#F97316',
              social: '#6B7280',
            };

            return (
              <div
                key={`${event.id}-${idx}`}
                className="rounded-lg border p-3 flex items-start gap-3 transition-colors duration-150 hover:brightness-110"
                style={{
                  background: 'var(--bg4)',
                  borderColor: 'var(--rim)',
                }}
              >
                {/* Type badge */}
                <div
                  className="flex-shrink-0 mt-0.5 w-2 h-2 rounded-full"
                  style={{ background: typeColor[event.type] }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-xs font-medium truncate"
                      style={{ color: 'var(--text)' }}
                    >
                      {desc}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                      {formatTimestamp(event.timestamp, locale)}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium capitalize"
                      style={{
                        background: `${typeColor[event.type]}18`,
                        color: typeColor[event.type],
                      }}
                    >
                      {event.type}
                    </span>
                    {event.corroborated && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          background: 'rgba(34,197,94,0.12)',
                          color: '#22C55E',
                        }}
                      >
                        {t('bayesian.corroborated', locale)}
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                      {t('bayesian.reliability', locale)}: {Math.round(event.sourceReliability * 100)}%
                    </span>
                  </div>
                </div>

                {/* Severity meter */}
                <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                    {t('bayesian.severity', locale)}
                  </span>
                  <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--rim)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round(event.severity * 100)}%`,
                        background: event.severity > 0.6 ? '#EF4444' : event.severity > 0.3 ? '#F59E0B' : '#22C55E',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Inline animation keyframes ────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes barGrow {
          from {
            width: 0%;
            opacity: 0.5;
          }
          to {
            opacity: 1;
          }
        }
      ` }} />
    </div>
  );
}
