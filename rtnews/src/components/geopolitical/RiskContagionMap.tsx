'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  runSIRSimulation,
  SIR_SCENARIOS,
  getTransmissionNetwork,
  type SIRSimulationResult,
  type SIRCountryState,
  type SIRTimeStep,
  type ContagionPath,
  type TransmissionEdge,
} from '@/lib/geopolitical/sir-contagion-model';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RiskContagionMapProps {
  locale: string;
}

/* ------------------------------------------------------------------ */
/*  Country Geographic Positions (approximate, SVG viewport 800x450)   */
/* ------------------------------------------------------------------ */

const COUNTRY_POSITIONS: Record<string, { x: number; y: number; label: Record<string, string> }> = {
  US: { x: 140, y: 175, label: { ar: 'أمريكا', en: 'USA', fr: 'USA', tr: 'ABD', es: 'EEUU' } },
  CA: { x: 120, y: 110, label: { ar: 'كندا', en: 'Canada', fr: 'Canada', tr: 'Kanada', es: 'Canadá' } },
  MX: { x: 100, y: 230, label: { ar: 'المكسيك', en: 'Mexico', fr: 'Mexique', tr: 'Meksika', es: 'México' } },
  GB: { x: 370, y: 115, label: { ar: 'بريطانيا', en: 'UK', fr: 'R-U', tr: 'İngiltere', es: 'R-U' } },
  FR: { x: 385, y: 155, label: { ar: 'فرنسا', en: 'France', fr: 'France', tr: 'Fransa', es: 'Francia' } },
  DE: { x: 410, y: 130, label: { ar: 'ألمانيا', en: 'Germany', fr: 'Allemagne', tr: 'Almanya', es: 'Alemania' } },
  PL: { x: 440, y: 115, label: { ar: 'بولندا', en: 'Poland', fr: 'Pologne', tr: 'Polonya', es: 'Polonia' } },
  CZ: { x: 430, y: 145, label: { ar: 'التشيك', en: 'Czechia', fr: 'Tchéquie', tr: 'Çekya', es: 'Chequia' } },
  HU: { x: 445, y: 155, label: { ar: 'المجر', en: 'Hungary', fr: 'Hongrie', tr: 'Macaristan', es: 'Hungría' } },
  UA: { x: 480, y: 130, label: { ar: 'أوكرانيا', en: 'Ukraine', fr: 'Ukraine', tr: 'Ukrayna', es: 'Ucrania' } },
  RO: { x: 470, y: 160, label: { ar: 'رومانيا', en: 'Romania', fr: 'Roumanie', tr: 'Romanya', es: 'Rumanía' } },
  RU: { x: 570, y: 90, label: { ar: 'روسيا', en: 'Russia', fr: 'Russie', tr: 'Rusya', es: 'Rusia' } },
  TR: { x: 495, y: 185, label: { ar: 'تركيا', en: 'Turkey', fr: 'Turquie', tr: 'Türkiye', es: 'Turquía' } },
  GR: { x: 465, y: 200, label: { ar: 'اليونان', en: 'Greece', fr: 'Grèce', tr: 'Yunanistan', es: 'Grecia' } },
  IT: { x: 425, y: 185, label: { ar: 'إيطاليا', en: 'Italy', fr: 'Italie', tr: 'İtalya', es: 'Italia' } },
  LY: { x: 410, y: 230, label: { ar: 'ليبيا', en: 'Libya', fr: 'Libye', tr: 'Libya', es: 'Libia' } },
  EG: { x: 460, y: 240, label: { ar: 'مصر', en: 'Egypt', fr: 'Égypte', tr: 'Mısır', es: 'Egipto' } },
  ET: { x: 510, y: 290, label: { ar: 'إثيوبيا', en: 'Ethiopia', fr: 'Éthiopie', tr: 'Etiyopya', es: 'Etiopía' } },
  KE: { x: 525, y: 310, label: { ar: 'كينيا', en: 'Kenya', fr: 'Kenya', tr: 'Kenya', es: 'Kenia' } },
  NG: { x: 420, y: 310, label: { ar: 'نيجيريا', en: 'Nigeria', fr: 'Nigéria', tr: 'Nijerya', es: 'Nigeria' } },
  GH: { x: 400, y: 325, label: { ar: 'غانا', en: 'Ghana', fr: 'Ghana', tr: 'Gana', es: 'Ghana' } },
  SA: { x: 510, y: 260, label: { ar: 'السعودية', en: 'Saudi', fr: 'Arabie', tr: 'Suudi', es: 'Arabia' } },
  AE: { x: 545, y: 245, label: { ar: 'الإمارات', en: 'UAE', fr: 'EAU', tr: 'BAE', es: 'EAU' } },
  IR: { x: 565, y: 215, label: { ar: 'إيران', en: 'Iran', fr: 'Iran', tr: 'İran', es: 'Irán' } },
  IQ: { x: 540, y: 225, label: { ar: 'العراق', en: 'Iraq', fr: 'Irak', tr: 'Irak', es: 'Irak' } },
  SY: { x: 520, y: 215, label: { ar: 'سوريا', en: 'Syria', fr: 'Syrie', tr: 'Suriye', es: 'Siria' } },
  LB: { x: 505, y: 210, label: { ar: 'لبنان', en: 'Lebanon', fr: 'Liban', tr: 'Lübnan', es: 'Líbano' } },
  YE: { x: 525, y: 290, label: { ar: 'اليمن', en: 'Yemen', fr: 'Yémen', tr: 'Yemen', es: 'Yemen' } },
  PK: { x: 595, y: 245, label: { ar: 'باكستان', en: 'Pakistan', fr: 'Pakistan', tr: 'Pakistan', es: 'Pakistán' } },
  IN: { x: 620, y: 270, label: { ar: 'الهند', en: 'India', fr: 'Inde', tr: 'Hindistan', es: 'India' } },
  CN: { x: 680, y: 200, label: { ar: 'الصين', en: 'China', fr: 'Chine', tr: 'Çin', es: 'China' } },
  JP: { x: 740, y: 185, label: { ar: 'اليابان', en: 'Japan', fr: 'Japon', tr: 'Japonya', es: 'Japón' } },
  KR: { x: 720, y: 215, label: { ar: 'كوريا', en: 'S.Korea', fr: 'CoréeS', tr: 'G.Kore', es: 'CoreaS' } },
  TW: { x: 715, y: 240, label: { ar: 'تايوان', en: 'Taiwan', fr: 'Taïwan', tr: 'Tayvan', es: 'Taiwán' } },
  AU: { x: 710, y: 360, label: { ar: 'أستراليا', en: 'Australia', fr: 'Australie', tr: 'Avustralya', es: 'Australia' } },
};

/* ------------------------------------------------------------------ */
/*  i18n                                                               */
/* ------------------------------------------------------------------ */

const I18N: Record<string, Record<string, string>> = {
  title: {
    ar: 'نموذج عدوى المخاطر الجيوسياسية (SIR)',
    en: 'Geopolitical Risk Contagion Model (SIR)',
    fr: 'Modèle de contagion des risques géopolitiques (SIR)',
    tr: 'Jeopolitik Risk Bulaşma Modeli (SIR)',
    es: 'Modelo de contagio de riesgos geopolíticos (SIR)',
  },
  scenario: {
    ar: 'السيناريو',
    en: 'Scenario',
    fr: 'Scénario',
    tr: 'Senaryo',
    es: 'Escenario',
  },
  timeStep: {
    ar: 'الخطوة الزمنية',
    en: 'Time Step',
    fr: 'Étape temporelle',
    tr: 'Zaman Adımı',
    es: 'Paso temporal',
  },
  infected: {
    ar: 'مصاب',
    en: 'Infected',
    fr: 'Infecté',
    tr: 'Enfekte',
    es: 'Infectado',
  },
  susceptible: {
    ar: 'عرضة',
    en: 'Susceptible',
    fr: 'Susceptible',
    tr: 'Duyarlı',
    es: 'Susceptible',
  },
  recovered: {
    ar: 'متعافي',
    en: 'Recovered',
    fr: 'Rétabli',
    tr: 'İyileşen',
    es: 'Recuperado',
  },
  countriesAffected: {
    ar: 'دول متأثرة',
    en: 'Countries Affected',
    fr: 'Pays affectés',
    tr: 'Etkilenen Ülkeler',
    es: 'Países afectados',
  },
  peakInfection: {
    ar: 'ذروة العدوى',
    en: 'Peak Infection',
    fr: 'Pic d\'infection',
    tr: 'Enfeksiyon Zirvesi',
    es: 'Pico de infección',
  },
  contagionPaths: {
    ar: 'مسارات العدوى',
    en: 'Contagion Paths',
    fr: 'Chemins de contagion',
    tr: 'Bulaşma Yolları',
    es: 'Rutas de contagio',
  },
  probability: {
    ar: 'الاحتمالية',
    en: 'Probability',
    fr: 'Probabilité',
    tr: 'Olasılık',
    es: 'Probabilidad',
  },
  delay: {
    ar: 'التأخير',
    en: 'Delay',
    fr: 'Délai',
    tr: 'Gecikme',
    es: 'Retraso',
  },
  route: {
    ar: 'المسار',
    en: 'Route',
    fr: 'Route',
    tr: 'Rota',
    es: 'Ruta',
  },
  play: {
    ar: 'تشغيل',
    en: 'Play',
    fr: 'Lecture',
    tr: 'Oynat',
    es: 'Reproducir',
  },
  pause: {
    ar: 'إيقاف',
    en: 'Pause',
    fr: 'Pause',
    tr: 'Duraklat',
    es: 'Pausa',
  },
  reset: {
    ar: 'إعادة',
    en: 'Reset',
    fr: 'Réinitialiser',
    tr: 'Sıfırla',
    es: 'Reiniciar',
  },
  summary: {
    ar: 'ملخص المحاكاة',
    en: 'Simulation Summary',
    fr: 'Résumé de la simulation',
    tr: 'Simülasyon Özeti',
    es: 'Resumen de simulación',
  },
  noData: {
    ar: 'لا توجد بيانات',
    en: 'No data',
    fr: 'Aucune donnée',
    tr: 'Veri yok',
    es: 'Sin datos',
  },
  of: {
    ar: 'من',
    en: 'of',
    fr: 'de',
    tr: '/',
    es: 'de',
  },
};

function t(key: string, locale: string): string {
  return I18N[key]?.[locale] ?? I18N[key]?.['en'] ?? key;
}

const ROUTE_LABELS: Record<string, Record<string, string>> = {
  trade: { ar: 'تجارة', en: 'Trade', fr: 'Commerce', tr: 'Ticaret', es: 'Comercio' },
  alliance: { ar: 'تحالف', en: 'Alliance', fr: 'Alliance', tr: 'İttifak', es: 'Alianza' },
  supply_chain: { ar: 'سلسلة توريد', en: 'Supply Chain', fr: 'Chaîne d\'approvisionnement', tr: 'Tedarik Zinciri', es: 'Cadena de suministro' },
  conflict: { ar: 'صراع', en: 'Conflict', fr: 'Conflit', tr: 'Çatışma', es: 'Conflicto' },
};

const ROUTE_COLORS: Record<string, string> = {
  trade: '#22c55e',
  alliance: '#3b82f6',
  supply_chain: '#f59e0b',
  conflict: '#ef4444',
};

/* ------------------------------------------------------------------ */
/*  Phase Colors                                                       */
/* ------------------------------------------------------------------ */

const PHASE_COLORS = {
  susceptible: '#6b7280',
  infected: '#ef4444',
  recovered: '#22c55e',
  initial_infection: '#ef4444',
} as const;

function getInfectionFill(state: SIRCountryState): string {
  if (state.phase === 'initial_infection') return '#ef4444';
  if (state.phase === 'recovered') return '#22c55e';
  if (state.phase === 'susceptible') return '#6b7280';
  // infected — gradient from lighter to darker based on infection level
  const level = Math.min(1, Math.max(0, state.infected));
  const r = Math.round(239 - level * 40);
  const g = Math.round(68 + level * 20);
  const b = Math.round(68 + level * 30);
  return `rgb(${r},${g},${b})`;
}

function getInfectionGlow(state: SIRCountryState): string {
  if (state.phase === 'initial_infection') return 'rgba(239,68,68,0.6)';
  if (state.phase === 'infected' && state.infected > 0.3) return 'rgba(239,68,68,0.3)';
  return 'none';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RiskContagionMap({ locale }: RiskContagionMapProps) {
  const isRtl = locale === 'ar';

  // ── State ─────────────────────────────────────────────────────────
  const [scenario, setScenario] = useState<string>('hormuz');
  const [timeStepIndex, setTimeStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // ── Simulation ────────────────────────────────────────────────────
  const simulationResult: SIRSimulationResult | null = useMemo(() => {
    try {
      const scenarioConfig = SIR_SCENARIOS[scenario];
      if (!scenarioConfig) return null;
      return runSIRSimulation(scenarioConfig.config);
    } catch {
      return null;
    }
  }, [scenario]);

  // Reset time step when scenario changes
  useEffect(() => {
    setTimeStepIndex(0);
    setIsPlaying(false);
  }, [scenario]);

  // ── Current Time Step Data ────────────────────────────────────────
  const currentTimeStep: SIRTimeStep | null = useMemo(() => {
    if (!simulationResult) return null;
    return simulationResult.timeSteps[timeStepIndex] ?? null;
  }, [simulationResult, timeStepIndex]);

  const totalSteps = simulationResult?.timeSteps.length ?? 0;

  // ── Summary Stats ─────────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    if (!currentTimeStep) return { infected: 0, susceptible: 0, recovered: 0 };
    return {
      infected: currentTimeStep.totalInfected,
      susceptible: currentTimeStep.totalSusceptible,
      recovered: currentTimeStep.totalRecovered,
    };
  }, [currentTimeStep]);

  // ── Contagion Paths ───────────────────────────────────────────────
  const contagionPaths: ContagionPath[] = useMemo(() => {
    if (!simulationResult) return [];
    // Only show paths that have been activated up to current time step
    const infectionTimes = new Map<string, number>();
    for (let i = 0; i <= Math.min(timeStepIndex, simulationResult.timeSteps.length - 1); i++) {
      const ts = simulationResult.timeSteps[i];
      for (const [code, state] of ts.states) {
        if (state.infected > 0.01 && !infectionTimes.has(code)) {
          infectionTimes.set(code, i);
        }
      }
    }
    return simulationResult.contagionPaths
      .filter((p) => {
        const srcTime = infectionTimes.get(p.source);
        const tgtTime = infectionTimes.get(p.target);
        return srcTime !== undefined && tgtTime !== undefined && tgtTime <= timeStepIndex;
      })
      .slice(0, 10);
  }, [simulationResult, timeStepIndex]);

  // ── Transmission edges for current state ──────────────────────────
  const transmissionEdges: TransmissionEdge[] = useMemo(() => {
    return getTransmissionNetwork();
  }, []);

  // ── Active edges (both sides infected by current time step) ───────
  const activeEdges = useMemo(() => {
    if (!currentTimeStep) return new Set<string>();
    const infectedCodes = new Set<string>();
    for (const [code, state] of currentTimeStep.states) {
      if (state.infected > 0.01) infectedCodes.add(code);
    }
    const active = new Set<string>();
    for (const edge of transmissionEdges) {
      if (infectedCodes.has(edge.source) && (infectedCodes.has(edge.target) || currentTimeStep.states.get(edge.target)?.susceptible === 1)) {
        active.add(`${edge.source}->${edge.target}`);
      }
    }
    return active;
  }, [currentTimeStep, transmissionEdges]);

  // ── Playback Animation ────────────────────────────────────────────
  // Uses setInterval at 400ms instead of requestAnimationFrame at 60fps.
  // The old rAF approach called rAF 60 times/sec but only advanced a step
  // every 400ms — wasting 97% of frames and burning CPU/GPU for nothing.
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      tickIntervalRef.current = setInterval(() => {
        setTimeStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 400);
    } else {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    }
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [isPlaying, totalSteps]);

  const handlePlay = useCallback(() => {
    if (timeStepIndex >= totalSteps - 1) {
      setTimeStepIndex(0);
    }
    setIsPlaying(true);
  }, [timeStepIndex, totalSteps]);

  const handlePause = useCallback(() => setIsPlaying(false), []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setTimeStepIndex(0);
  }, []);

  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    setTimeStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  // ── Tooltip data ──────────────────────────────────────────────────
  const hoveredState = useMemo(() => {
    if (!hoveredCountry || !currentTimeStep) return null;
    return currentTimeStep.states.get(hoveredCountry) ?? null;
  }, [hoveredCountry, currentTimeStep]);

  // ── SVG Viewport ──────────────────────────────────────────────────
  const SVG_W = 800;
  const SVG_H = 430;

  // ── Render Helpers ────────────────────────────────────────────────
  const getCountryLabel = useCallback(
    (code: string) => COUNTRY_POSITIONS[code]?.label[locale] ?? COUNTRY_POSITIONS[code]?.label['en'] ?? code,
    [locale]
  );

  const scenarioOptions = useMemo(
    () =>
      Object.entries(SIR_SCENARIOS).map(([key, val]) => ({
        value: key,
        label: val[`label${locale.charAt(0).toUpperCase()}${locale.slice(1)}` as keyof typeof val] as string ?? val.labelEn,
      })),
    [locale]
  );

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div
      className="rounded-xl border p-4 sm:p-6"
      style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" style={{ color: '#ef4444' }} />
          <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-head)' }}>
            {t('title', locale)}
          </h3>
        </div>

        {/* Scenario Selector */}
        <div className="w-full sm:w-64">
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text3)' }}>
            {t('scenario', locale)}
          </label>
          <Select value={scenario} onValueChange={setScenario}>
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
            <SelectContent style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}>
              {scenarioOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SVG Visualization */}
      <div className="relative w-full overflow-hidden rounded-lg border mb-4" style={{ background: 'var(--bg4)', borderColor: 'var(--rim)' }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full"
          style={{ minHeight: 280 }}
        >
          <defs>
            {/* Pulse animation for initial infection */}
            <radialGradient id="pulseGrad">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>

            {/* Flow animation for edges */}
            <style>{`
              @keyframes dashFlow {
                to { stroke-dashoffset: -20; }
              }
              @keyframes pulse {
                0% { r: 16; opacity: 0.6; }
                50% { r: 26; opacity: 0.2; }
                100% { r: 16; opacity: 0.6; }
              }
              @keyframes ringPulse {
                0% { r: 14; opacity: 0.5; }
                100% { r: 30; opacity: 0; }
              }
              .edge-flow {
                animation: dashFlow 2s linear infinite;
              }
              .pulse-ring {
                animation: ringPulse 2.5s ease-out infinite;
              }
              .pulse-ring-delay {
                animation: ringPulse 2.5s ease-out infinite 0.8s;
              }
            `}</style>
          </defs>

          {/* Edges */}
          {transmissionEdges.map((edge, idx) => {
            const src = COUNTRY_POSITIONS[edge.source];
            const tgt = COUNTRY_POSITIONS[edge.target];
            if (!src || !tgt) return null;
            const edgeKey = `${edge.source}->${edge.target}`;
            const isActive = activeEdges.has(edgeKey);
            const routeColor = ROUTE_COLORS[edge.routeType] ?? '#475569';

            return (
              <line
                key={`edge-${idx}`}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={isActive ? routeColor : 'rgba(71,85,105,0.15)'}
                strokeWidth={isActive ? Math.max(1, edge.tradeVolume * 3) : 0.5}
                strokeDasharray={isActive ? '8,4' : 'none'}
                strokeOpacity={isActive ? 0.7 : 0.3}
                className={isActive ? 'edge-flow' : undefined}
              />
            );
          })}

          {/* Country Nodes */}
          {currentTimeStep && Array.from(currentTimeStep.states.entries()).map(([code, state]) => {
            const pos = COUNTRY_POSITIONS[code];
            if (!pos) return null;
            const fillColor = getInfectionFill(state);
            const glowColor = getInfectionGlow(state);
            const isInitial = state.phase === 'initial_infection';
            const isHovered = hoveredCountry === code;
            const nodeRadius = isInitial ? 12 : state.infected > 0.01 ? 10 + state.infected * 4 : 8;

            return (
              <g
                key={`node-${code}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredCountry(code)}
                onMouseLeave={() => setHoveredCountry(null)}
              >
                {/* Glow effect for infected / initial */}
                {glowColor !== 'none' && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={nodeRadius + 8}
                    fill={glowColor}
                    style={{ filter: 'blur(6px)' }}
                  />
                )}

                {/* Pulse ring for initial infection */}
                {isInitial && (
                  <>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={14}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={2}
                      className="pulse-ring"
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={14}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      className="pulse-ring-delay"
                    />
                  </>
                )}

                {/* Main circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeRadius}
                  fill={fillColor}
                  stroke={isHovered ? '#d4af37' : 'rgba(11,14,20,0.8)'}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  style={{
                    transition: 'fill 0.4s ease, r 0.4s ease',
                    filter: isInitial ? 'drop-shadow(0 0 8px rgba(239,68,68,0.7))' : undefined,
                  }}
                />

                {/* Country code label */}
                <text
                  x={pos.x}
                  y={pos.y + nodeRadius + 12}
                  textAnchor="middle"
                  fill={isHovered ? 'var(--text-head)' : 'var(--text3)'}
                  fontSize={isHovered ? 9 : 8}
                  fontFamily={isRtl ? 'Noto Sans Arabic, sans-serif' : 'Inter, sans-serif'}
                  direction={isRtl ? 'rtl' : 'ltr'}
                  style={{ transition: 'fill 0.2s ease, font-size 0.2s ease' }}
                >
                  {getCountryLabel(code)}
                </text>

                {/* Infection level inside circle */}
                {(state.infected > 0.01 || state.recovered > 0.5) && (
                  <text
                    x={pos.x}
                    y={pos.y + 3}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={7}
                    fontWeight="bold"
                  >
                    {state.infected > 0.01
                      ? `${Math.round(state.infected * 100)}`
                      : `${Math.round(state.recovered * 100)}`}
                  </text>
                )}
              </g>
            );
          })}

          {/* Legend */}
          <g transform={`translate(${isRtl ? SVG_W - 140 : 12}, ${SVG_H - 90})`}>
            <rect x="-4" y="-4" width="140" height="85" rx="6" fill="rgba(15,20,30,0.85)" stroke="var(--rim)" strokeWidth="0.5" />
            <circle cx="10" cy="12" r="5" fill="#6b7280" />
            <text x="22" y="15" fill="var(--text3)" fontSize="9">{t('susceptible', locale)}</text>
            <circle cx="10" cy="32" r="5" fill="#ef4444" />
            <text x="22" y="35" fill="var(--text3)" fontSize="9">{t('infected', locale)}</text>
            <circle cx="10" cy="52" r="5" fill="#22c55e" />
            <text x="22" y="55" fill="var(--text3)" fontSize="9">{t('recovered', locale)}</text>
            <line x1="4" y1="70" x2="18" y2="70" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />
            <text x="22" y="73" fill="var(--text3)" fontSize="9">{t('contagionPaths', locale)}</text>
          </g>
        </svg>

        {/* Tooltip overlay */}
        {hoveredState && hoveredCountry && COUNTRY_POSITIONS[hoveredCountry] && (
          <div
            className="absolute z-50 px-3 py-2 text-xs rounded-lg shadow-xl pointer-events-none"
            style={{
              background: 'rgba(21,26,34,0.95)',
              border: '1px solid var(--rim)',
              color: 'var(--text)',
              left: '50%',
              top: 8,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-bold mb-1" style={{ color: 'var(--text-head)' }}>
              {getCountryLabel(hoveredCountry)} ({hoveredCountry})
            </div>
            <div className="flex gap-3">
              <span style={{ color: '#6b7280' }}>S: {(hoveredState.susceptible * 100).toFixed(0)}%</span>
              <span style={{ color: '#ef4444' }}>I: {(hoveredState.infected * 100).toFixed(0)}%</span>
              <span style={{ color: '#22c55e' }}>R: {(hoveredState.recovered * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Controls */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg transition-colors"
            style={{
              background: 'var(--bg4)',
              border: '1px solid var(--rim)',
              color: 'var(--text3)',
            }}
            title={t('reset', locale)}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {isPlaying ? (
            <button
              onClick={handlePause}
              className="p-1.5 rounded-lg transition-colors"
              style={{
                background: 'var(--bg4)',
                border: '1px solid var(--rim)',
                color: '#f59e0b',
              }}
              title={t('pause', locale)}
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="p-1.5 rounded-lg transition-colors"
              style={{
                background: 'var(--bg4)',
                border: '1px solid var(--rim)',
                color: '#22c55e',
              }}
              title={t('play', locale)}
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleStepForward}
            className="p-1.5 rounded-lg transition-colors"
            style={{
              background: 'var(--bg4)',
              border: '1px solid var(--rim)',
              color: 'var(--text3)',
            }}
            title={t('timeStep', locale)}
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <div className="flex-1 mx-2">
            <input
              type="range"
              min={0}
              max={Math.max(0, totalSteps - 1)}
              value={timeStepIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setTimeStepIndex(Number(e.target.value));
              }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(timeStepIndex / Math.max(1, totalSteps - 1)) * 100}%, var(--bg4) ${(timeStepIndex / Math.max(1, totalSteps - 1)) * 100}%, var(--bg4) 100%)`,
              }}
            />
          </div>

          <span className="text-xs font-mono tabular-nums whitespace-nowrap" style={{ color: 'var(--text3)' }}>
            {timeStepIndex} / {Math.max(0, totalSteps - 1)}
          </span>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {/* Infected */}
        <div
          className="rounded-lg border p-3 text-center"
          style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}
        >
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text3)' }}>
            {t('infected', locale)}
          </div>
          <div className="text-lg font-bold tabular-nums" style={{ color: '#ef4444' }}>
            {summaryStats.infected.toFixed(1)}
          </div>
        </div>

        {/* Susceptible */}
        <div
          className="rounded-lg border p-3 text-center"
          style={{ background: 'rgba(107,114,128,0.08)', borderColor: 'rgba(107,114,128,0.25)' }}
        >
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text3)' }}>
            {t('susceptible', locale)}
          </div>
          <div className="text-lg font-bold tabular-nums" style={{ color: '#6b7280' }}>
            {summaryStats.susceptible.toFixed(1)}
          </div>
        </div>

        {/* Recovered */}
        <div
          className="rounded-lg border p-3 text-center"
          style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)' }}
        >
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text3)' }}>
            {t('recovered', locale)}
          </div>
          <div className="text-lg font-bold tabular-nums" style={{ color: '#22c55e' }}>
            {summaryStats.recovered.toFixed(1)}
          </div>
        </div>

        {/* Countries Affected */}
        <div
          className="rounded-lg border p-3 text-center"
          style={{ background: 'var(--bg4)', borderColor: 'var(--rim)' }}
        >
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text3)' }}>
            {t('countriesAffected', locale)}
          </div>
          <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-head)' }}>
            {simulationResult?.totalAffectedCountries ?? 0}
          </div>
        </div>

        {/* Peak Infection */}
        <div
          className="rounded-lg border p-3 text-center"
          style={{ background: 'var(--bg4)', borderColor: 'var(--rim)' }}
        >
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text3)' }}>
            {t('peakInfection', locale)}
          </div>
          <div className="text-lg font-bold tabular-nums" style={{ color: '#f59e0b' }}>
            {simulationResult?.peakInfectionStep ?? 0}
          </div>
        </div>
      </div>

      {/* Contagion Paths List */}
      <div
        className="rounded-lg border p-4"
        style={{ background: 'var(--bg4)', borderColor: 'var(--rim)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" style={{ color: '#f59e0b' }} />
          <h4 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>
            {t('contagionPaths', locale)}
          </h4>
        </div>

        {contagionPaths.length === 0 ? (
          <div className="text-xs py-4 text-center" style={{ color: 'var(--text3)' }}>
            {t('noData', locale)}
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--rim) transparent' }}>
            {contagionPaths.map((path, idx) => {
              const routeLabel = ROUTE_LABELS[path.route]?.[locale] ?? path.route;
              const routeColor = ROUTE_COLORS[path.route] ?? '#475569';
              return (
                <div
                  key={`path-${idx}`}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors"
                  style={{
                    background: 'var(--bg3)',
                    border: '1px solid var(--rim)',
                  }}
                >
                  <span className="font-bold" style={{ color: 'var(--text-head)' }}>
                    {getCountryLabel(path.source)}
                  </span>
                  <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: routeColor }} />
                  <span className="font-bold" style={{ color: 'var(--text-head)' }}>
                    {getCountryLabel(path.target)}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ background: `${routeColor}22`, color: routeColor }}
                  >
                    {routeLabel}
                  </span>
                  <span className="ml-auto font-mono tabular-nums" style={{ color: 'var(--text3)' }}>
                    {t('probability', locale)}: {(path.transmissionProbability * 100).toFixed(0)}%
                  </span>
                  <span className="font-mono tabular-nums" style={{ color: 'var(--text3)' }}>
                    {t('delay', locale)}: {path.estimatedDelay}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
