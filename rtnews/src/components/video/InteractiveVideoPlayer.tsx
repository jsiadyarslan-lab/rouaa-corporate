'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
  ColorType,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
} from 'lightweight-charts';
import type { TechnicalAnalysisResult, SupportResistanceLevel } from '@/lib/technical-analysis';

// ─── Types ────────────────────────────────────────────────────

export interface VideoSection {
  id: string;
  durationSeconds: number;
  titleAr: string;
  titleEn: string;
}

export interface InteractiveVideoProps {
  symbol: string;
  assetNameAr: string;
  assetNameEn: string;
  currentPrice: number;
  changePercent: number;
  locale: 'ar' | 'en' | 'fr' | 'tr' | 'es';
  candleData: CandlestickData[];
  volumeData?: { time: Time; value: number; color?: string }[];
  analysis: TechnicalAnalysisResult;
}

// ─── Theme ────────────────────────────────────────────────────

const T = {
  bg: '#070b14',
  surface: 'rgba(15, 23, 42, 0.95)',
  text: '#e2e8f0',
  text2: '#94a3b8',
  text3: '#64748b',
  bull: '#22c55e',
  bear: '#ef4444',
  cyan: '#00E5FF',
  gold: '#d4af37',
  purple: '#8b5cf6',
  orange: '#f59e0b',
  chartBg: '#0a0e1a',
  grid: '#1e293b',
};

// ─── Sections Timeline ────────────────────────────────────────

function buildSections(analysis: TechnicalAnalysisResult): VideoSection[] {
  return [
    { id: 'intro', durationSeconds: 4, titleAr: 'مقدمة', titleEn: 'Introduction' },
    { id: 'chart', durationSeconds: 12, titleAr: 'الرسم البياني', titleEn: 'Chart Overview' },
    { id: 'levels', durationSeconds: 12, titleAr: 'مستويات الدعم والمقاومة', titleEn: 'Support & Resistance' },
    { id: 'indicators', durationSeconds: 12, titleAr: 'المؤشرات الفنية', titleEn: 'Technical Indicators' },
    { id: 'setup', durationSeconds: 10, titleAr: 'فرصة التداول', titleEn: 'Trade Setup' },
    { id: 'summary', durationSeconds: 6, titleAr: 'الملخص', titleEn: 'Summary' },
  ];
}

// ─── Chart Component ──────────────────────────────────────────

function VideoChart({
  candleData,
  volumeData,
  visibleCount,
  analysis,
  showLevels,
  locale,
}: {
  candleData: CandlestickData[];
  volumeData?: { time: Time; value: number; color?: string }[];
  visibleCount: number;
  analysis: TechnicalAnalysisResult;
  showLevels: boolean;
  locale: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<any>[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: T.chartBg },
        textColor: T.text3,
        fontSize: 10,
      },
      grid: {
        vertLines: { color: T.grid, style: LineStyle.Dotted },
        horzLines: { color: T.grid, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.04)',
        scaleMargins: { top: 0.05, bottom: 0.2 },
        ticksVisible: false,
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.04)',
        timeVisible: false,
        rightOffset: 3,
        barSpacing: 8,
        ticksVisible: false,
      },
    });

    chartRef.current = chart;

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, []);

  // Update chart data and annotations
  useEffect(() => {
    if (!chartRef.current || candleData.length === 0) return;

    // Remove all existing series
    for (const s of seriesRefs.current) {
      try { chartRef.current!.removeSeries(s); } catch {}
    }
    seriesRefs.current = [];

    const visibleData = candleData.slice(0, Math.max(visibleCount, 10));

    // Candlestick series
    const candleSeries = chartRef.current.addSeries(CandlestickSeries, {
      upColor: T.bull, downColor: T.bear,
      borderUpColor: T.bull, borderDownColor: T.bear,
      wickUpColor: T.bull, wickDownColor: T.bear,
    });
    candleSeries.setData(visibleData);
    seriesRefs.current.push(candleSeries);

    // Volume series
    if (volumeData && volumeData.length > 0) {
      const visibleVol = volumeData.slice(0, Math.max(visibleCount, 10));
      const volSeries = chartRef.current.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chartRef.current.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      volSeries.setData(visibleVol);
      seriesRefs.current.push(volSeries);
    }

    // SMA 20 line
    const closes = visibleData.map(d => d.close);
    if (closes.length >= 20) {
      const sma20Data: { time: Time; value: number }[] = [];
      for (let i = 19; i < closes.length; i++) {
        const sum = closes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0);
        sma20Data.push({ time: visibleData[i].time, value: sum / 20 });
      }
      const smaSeries = chartRef.current.addSeries(LineSeries, {
        color: T.cyan, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
      });
      smaSeries.setData(sma20Data);
      seriesRefs.current.push(smaSeries);
    }

    // SMA 50 line
    if (closes.length >= 50) {
      const sma50Data: { time: Time; value: number }[] = [];
      for (let i = 49; i < closes.length; i++) {
        const sum = closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0);
        sma50Data.push({ time: visibleData[i].time, value: sum / 50 });
      }
      const sma50Series = chartRef.current.addSeries(LineSeries, {
        color: T.orange, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
      });
      sma50Series.setData(sma50Data);
      seriesRefs.current.push(sma50Series);
    }

    // Support/resistance price lines
    if (showLevels) {
      for (const level of analysis.supportLevels.slice(0, 2)) {
        candleSeries.createPriceLine({
          price: level.price,
          color: T.bull + '60',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: locale === 'ar' ? level.labelAr : level.labelEn,
        });
      }
      for (const level of analysis.resistanceLevels.slice(0, 2)) {
        candleSeries.createPriceLine({
          price: level.price,
          color: T.bear + '60',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: locale === 'ar' ? level.labelAr : level.labelEn,
        });
      }
    }

    chartRef.current.timeScale().fitContent();
  }, [candleData, volumeData, visibleCount, showLevels, analysis, locale]);

  return <div ref={containerRef} className="w-full h-full" />;
}

// ─── Section Badge ────────────────────────────────────────────

function SectionBadge({ title, color, locale }: { title: string; color: string; locale: 'ar' | 'en' | 'fr' | 'tr' | 'es' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-3 z-20 px-3 py-1.5 rounded-lg"
      style={{
        [locale === 'ar' ? 'right' : 'left']: '16px',
        background: `${color}15`,
        border: `1px solid ${color}30`,
      }}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{title}</span>
    </motion.div>
  );
}

// ─── Narration Subtitle ───────────────────────────────────────

function NarrationSubtitle({ text, locale, visible }: { text: string; locale: 'ar' | 'en' | 'fr' | 'tr' | 'es'; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && text && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-16 left-4 right-4 z-20 pointer-events-none"
        >
          <div className="max-w-2xl mx-auto px-4 py-2.5 rounded-xl" style={{
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p className="text-[12px] leading-relaxed text-center" style={{ color: 'rgba(255,255,255,0.9)' }}
              dir={locale === 'ar' ? 'rtl' : 'ltr'}>{text}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Indicator Panel ──────────────────────────────────────────

function IndicatorPanel({ indicators, locale, visible }: { indicators: TechnicalAnalysisResult['indicators']; locale: 'ar' | 'en' | 'fr' | 'tr' | 'es'; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: locale === 'ar' ? -30 : 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: locale === 'ar' ? -30 : 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="absolute bottom-20 z-20 w-64 rounded-xl overflow-hidden"
          style={{
            [locale === 'ar' ? 'right' : 'left']: '16px',
            background: T.surface, border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.cyan }}>
              {locale === 'ar' ? 'المؤشرات الفنية' : 'Technical Indicators'}
            </span>
          </div>
          {indicators.map((ind, i) => {
            const signalColor = ind.signal === 'bullish' ? T.bull : ind.signal === 'bearish' ? T.bear : T.gold;
            return (
              <div key={i} className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: signalColor }} />
                <span className="text-[10px] font-bold flex-1" style={{ color: T.text2 }}>{ind.name}</span>
                <span className="text-[10px] font-mono" style={{ color: signalColor }}>
                  {ind.value.toFixed(1)}
                </span>
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Trade Setup Panel ────────────────────────────────────────

function TradeSetupPanel({ setup, locale, visible }: { setup: TechnicalAnalysisResult['tradeSetup']; locale: 'ar' | 'en' | 'fr' | 'tr' | 'es'; visible: boolean }) {
  const dirColor = setup.direction === 'long' ? T.bull : setup.direction === 'short' ? T.bear : T.gold;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="absolute bottom-20 z-20 w-72 rounded-xl overflow-hidden"
          style={{
            [locale === 'ar' ? 'right' : 'left']: '16px',
            background: T.surface, border: `1px solid ${dirColor}20`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${dirColor}15` }}>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: dirColor }}>
              {setup.direction === 'long' ? (locale === 'ar' ? 'شراء' : 'LONG') :
               setup.direction === 'short' ? (locale === 'ar' ? 'بيع' : 'SHORT') :
               (locale === 'ar' ? 'انتظار' : 'WAIT')}
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{
              background: `${dirColor}15`, color: dirColor, border: `1px solid ${dirColor}30`,
            }}>
              {setup.confidence}% {locale === 'ar' ? 'ثقة' : 'conf.'}
            </span>
          </div>
          {setup.direction !== 'wait' ? (
            <div className="p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-[10px]" style={{ color: T.text3 }}>{locale === 'ar' ? 'الدخول' : 'Entry'}</span>
                <span className="text-[11px] font-mono font-bold" style={{ color: T.text }}>{setup.entryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px]" style={{ color: T.text3 }}>{locale === 'ar' ? 'وقف خسارة' : 'Stop Loss'}</span>
                <span className="text-[11px] font-mono font-bold" style={{ color: T.bear }}>{setup.stopLoss.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px]" style={{ color: T.text3 }}>{locale === 'ar' ? 'الهدف' : 'Target'}</span>
                <span className="text-[11px] font-mono font-bold" style={{ color: T.bull }}>{setup.targetPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <span className="text-[10px]" style={{ color: T.text3 }}>{locale === 'ar' ? 'مخاطرة/عائد' : 'R:R'}</span>
                <span className="text-[11px] font-mono font-bold" style={{ color: setup.riskRewardRatio >= 2 ? T.bull : T.gold }}>
                  1:{setup.riskRewardRatio.toFixed(1)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3">
              <p className="text-[11px] leading-relaxed" style={{ color: T.text2 }} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                {locale === 'ar' ? setup.reasoningAr : setup.reasoningEn}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Signal Gauge ─────────────────────────────────────────────

function SignalGauge({ signal, score, locale }: { signal: string; score: number; locale: 'ar' | 'en' | 'fr' | 'tr' | 'es' }) {
  const color = signal === 'bullish' ? T.bull : signal === 'bearish' ? T.bear : T.gold;
  const label = signal === 'bullish'
    ? (locale === 'ar' ? 'شرائي' : 'Bullish')
    : signal === 'bearish'
    ? (locale === 'ar' ? 'بيعي' : 'Bearish')
    : (locale === 'ar' ? 'محايد' : 'Neutral');

  const normalizedScore = ((score + 100) / 200) * 100; // 0-100%

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{
          width: `${normalizedScore}%`,
          background: `linear-gradient(90deg, ${T.bear}, ${T.gold}, ${T.bull})`,
        }} />
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Controls ─────────────────────────────────────────────────

function Controls({
  isPlaying, currentTime, totalTime, speed, locale, sections, currentSectionIdx,
  onPlay, onPause, onSeek, onSpeedChange, onSectionClick,
}: {
  isPlaying: boolean; currentTime: number; totalTime: number; speed: number; locale: 'ar' | 'en' | 'fr' | 'tr' | 'es';
  sections: VideoSection[]; currentSectionIdx: number;
  onPlay: () => void; onPause: () => void; onSeek: (t: number) => void;
  onSpeedChange: (s: number) => void; onSectionClick: (i: number) => void;
}) {
  const [showSections, setShowSections] = useState(false);
  const progress = totalTime > 0 ? (currentTime / totalTime) * 100 : 0;

  return (
    <div className="relative z-40">
      {/* Progress bar */}
      <div className="h-1 cursor-pointer group" style={{ background: 'rgba(255,255,255,0.06)' }}
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          onSeek(((e.clientX - rect.left) / rect.width) * totalTime);
        }}>
        <div className="h-full relative transition-all" style={{
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${T.cyan}, ${T.purple})`,
        }}>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: T.cyan, boxShadow: `0 0 6px ${T.cyan}50` }} />
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'rgba(7,11,20,0.95)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <button onClick={isPlaying ? onPause : onPlay}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
          )}
        </button>
        <span className="text-[9px] font-mono" style={{ color: T.text3 }}>
          {fmtTime(currentTime)} / {fmtTime(totalTime)}
        </span>
        <div className="flex-1" />
        {/* Speed */}
        <div className="flex items-center gap-0.5">
          {[1, 1.5, 2].map(s => (
            <button key={s} onClick={() => onSpeedChange(s)}
              className="px-1 py-0.5 rounded text-[8px] font-bold transition-all"
              style={{
                background: speed === s ? 'rgba(0,229,255,0.12)' : 'transparent',
                color: speed === s ? T.cyan : T.text3,
                border: speed === s ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent',
              }}>{s}x</button>
          ))}
        </div>
        {/* Sections */}
        <button onClick={() => setShowSections(!showSections)}
          className="px-2 py-1 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1"
          style={{
            background: showSections ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
            color: showSections ? T.purple : T.text3,
            border: `1px solid ${showSections ? 'rgba(139,92,246,0.2)' : 'transparent'}`,
          }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          {locale === 'ar' ? 'الأقسام' : 'Sections'}
        </button>
      </div>

      {/* Sections dropdown */}
      <AnimatePresence>
        {showSections && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute bottom-full left-3 right-3 mb-2 rounded-xl overflow-hidden"
            style={{ background: T.surface, border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 -8px 32px rgba(0,0,0,0.4)', maxHeight: '200px', overflowY: 'auto' }}>
            {sections.map((sec, idx) => {
              const secTime = sections.slice(0, idx).reduce((s, c) => s + c.durationSeconds, 0);
              const isActive = idx === currentSectionIdx;
              return (
                <button key={sec.id} onClick={() => { onSectionClick(idx); setShowSections(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left transition-all"
                  style={{ background: isActive ? 'rgba(0,229,255,0.05)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <span className="text-[9px] font-mono w-8" style={{ color: isActive ? T.cyan : T.text3 }}>{fmtTime(secTime)}</span>
                  <span className="text-[10px] font-medium truncate" style={{ color: isActive ? T.cyan : T.text2 }}>
                    {locale === 'ar' ? sec.titleAr : sec.titleEn}
                  </span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.cyan }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── Main InteractiveVideoPlayer ──────────────────────────────

export default function InteractiveVideoPlayer(props: InteractiveVideoProps) {
  const { symbol, assetNameAr, assetNameEn, currentPrice, changePercent, locale, candleData, volumeData, analysis } = props;

  const sections = useMemo(() => buildSections(analysis), [analysis]);
  const totalTime = useMemo(() => sections.reduce((s, sec) => s + sec.durationSeconds, 0), [sections]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);

  // Current section calculation
  const currentSectionIdx = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < sections.length; i++) {
      acc += sections[i].durationSeconds;
      if (elapsedTime < acc) return i;
    }
    return sections.length - 1;
  }, [elapsedTime, sections]);

  const currentSection = sections[currentSectionIdx];
  const sectionElapsed = useMemo(() => {
    const prevDuration = sections.slice(0, currentSectionIdx).reduce((s, sec) => s + sec.durationSeconds, 0);
    return elapsedTime - prevDuration;
  }, [elapsedTime, currentSectionIdx, sections]);

  const sectionProgress = currentSection ? sectionElapsed / currentSection.durationSeconds : 0;

  // Chart visible count
  const chartVisibleCount = useMemo(() => {
    if (candleData.length === 0) return 0;
    if (currentSection?.id === 'intro') return 0;
    if (currentSection?.id === 'summary') return candleData.length;
    // Progressive reveal: 30% base + 70% based on total progress through non-intro sections
    const chartSections = sections.filter(s => s.id !== 'intro' && s.id !== 'summary');
    const chartTotalTime = chartSections.reduce((s, sec) => s + sec.durationSeconds, 0);
    const introTime = sections[0]?.durationSeconds || 0;
    const chartElapsed = Math.max(0, elapsedTime - introTime);
    const chartProgress = Math.min(1, chartElapsed / chartTotalTime);
    const basePoints = Math.floor(candleData.length * 0.3);
    const revealPoints = candleData.length - basePoints;
    return Math.min(candleData.length, basePoints + Math.floor(revealPoints * chartProgress));
  }, [currentSection?.id, elapsedTime, sections, candleData.length]);

  // Animation timer — uses setInterval for reliability
  useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = ((now - lastTickRef.current) / 1000) * speed;
        lastTickRef.current = now;

        setElapsedTime(prev => {
          const next = prev + delta;
          if (next >= totalTime) {
            setIsPlaying(false);
            return totalTime;
          }
          return next;
        });
      }, 50); // 50ms interval for smooth updates
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, speed, totalTime]);

  // Auto-play on mount after a brief delay
  useEffect(() => {
    if (!hasStarted && candleData.length > 0 && sections.length > 0) {
      const timer = setTimeout(() => {
        setIsPlaying(true);
        setHasStarted(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasStarted, candleData.length, sections.length]);

  // TTS narration
  useEffect(() => {
    if (!isPlaying || typeof window === 'undefined' || !window.speechSynthesis) return;

    const text = getNarrationText(currentSection, analysis, symbol, locale === 'ar' ? assetNameAr : assetNameEn, currentPrice, changePercent, locale);
    if (!text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = speed * 0.85;
    utterance.volume = 0.7;

    try {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v =>
        locale === 'ar' ? v.lang.startsWith('ar') : (v.lang.startsWith('en') && v.name.includes('Google'))
      ) || voices.find(v => locale === 'ar' ? v.lang.startsWith('ar') : v.lang.startsWith('en'));
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    } catch {}

    return () => { window.speechSynthesis.cancel(); };
  }, [currentSectionIdx, isPlaying, locale, speed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlay = useCallback(() => {
    if (elapsedTime >= totalTime) {
      setElapsedTime(0);
    }
    setIsPlaying(true);
    setHasStarted(true);
  }, [elapsedTime, totalTime]);

  const handlePause = useCallback(() => setIsPlaying(false), []);

  const handleSeek = useCallback((time: number) => {
    setElapsedTime(Math.min(time, totalTime));
    if (!isPlaying) setIsPlaying(true);
    setHasStarted(true);
  }, [totalTime, isPlaying]);

  const handleSectionClick = useCallback((idx: number) => {
    const time = sections.slice(0, idx).reduce((s, sec) => s + sec.durationSeconds, 0);
    setElapsedTime(time);
    setIsPlaying(true);
    setHasStarted(true);
  }, [sections]);

  const isUp = changePercent >= 0;
  const isFinished = elapsedTime >= totalTime;

  // Section-specific rendering flags
  const showIntro = currentSection?.id === 'intro';
  const showChart = !showIntro;
  const showLevels = currentSection?.id === 'levels' && sectionProgress > 0.15;
  const showIndicators = currentSection?.id === 'indicators';
  const showSetup = currentSection?.id === 'setup';
  const showSummary = currentSection?.id === 'summary';

  // Narration text for current section
  const narrationText = getNarrationText(currentSection, analysis, symbol, locale === 'ar' ? assetNameAr : assetNameEn, currentPrice, changePercent, locale);

  return (
    <div className="relative rounded-xl overflow-hidden select-none" style={{
      background: T.bg, border: '1px solid rgba(255,255,255,0.06)', aspectRatio: '16/9', direction: locale === 'ar' ? 'rtl' : 'ltr',
    }}>
      <div className="relative w-full h-full">
        {/* ─── Chart ─── */}
        <AnimatePresence mode="wait">
          {showChart && candleData.length > 0 && (
            <motion.div key="chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
              <VideoChart
                candleData={candleData} volumeData={volumeData} visibleCount={chartVisibleCount}
                analysis={analysis} showLevels={showLevels} locale={locale}
              />
              {/* Header overlay */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2.5"
                style={{ background: 'linear-gradient(180deg, rgba(7,11,20,0.85) 0%, transparent 100%)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                    background: `linear-gradient(135deg, ${isUp ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}, transparent)`,
                    border: `1px solid ${isUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                  }}>
                    <span className="text-xs font-bold" style={{ color: isUp ? T.bull : T.bear }}>{symbol.slice(0, 3)}</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold" style={{ color: T.text }}>{locale === 'ar' ? assetNameAr : assetNameEn}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono" style={{ color: T.text2 }}>{symbol}</span>
                      <span className="text-[8px] px-1 py-0.5 rounded font-bold" style={{
                        background: isUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: isUp ? T.bull : T.bear,
                      }}>{isUp ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-bold" style={{ color: T.text }}>
                    {currentPrice.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              {/* Section badge */}
              <SectionBadge title={locale === 'ar' ? currentSection.titleAr : currentSection.titleEn}
                color={currentSection?.id === 'levels' ? T.gold : currentSection?.id === 'indicators' ? T.cyan : currentSection?.id === 'setup' ? T.purple : T.text3}
                locale={locale} />
              {/* SMA legend */}
              {(currentSection?.id === 'chart' || currentSection?.id === 'levels') && (
                <div className="absolute top-3 z-20 flex items-center gap-3" style={{ [locale === 'ar' ? 'left' : 'right']: '16px' }}>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-0.5 rounded" style={{ background: T.cyan }} />
                    <span className="text-[8px]" style={{ color: T.text3 }}>SMA20</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-0.5 rounded" style={{ background: T.orange }} />
                    <span className="text-[8px]" style={{ color: T.text3 }}>SMA50</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Intro ─── */}
        <AnimatePresence>
          {showIntro && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center"
              style={{ background: T.bg }}
            >
              <div className="text-center px-6">
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${isUp ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}, rgba(0,229,255,0.06))`,
                    border: `2px solid ${isUp ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    boxShadow: `0 0 30px ${isUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}`,
                  }}>
                  <span className="text-2xl font-bold" style={{ color: isUp ? T.bull : T.bear }}>{symbol}</span>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <h1 className="text-xl font-bold mb-1" style={{ color: T.text }}>
                    {locale === 'ar' ? 'تحليل فني متقدم' : 'Advanced Technical Analysis'}
                  </h1>
                  <h2 className="text-base mb-3" style={{ color: T.text2 }}>{locale === 'ar' ? assetNameAr : assetNameEn}</h2>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}
                  className="mb-4">
                  <div className="text-3xl font-mono font-bold" style={{ color: T.text }}>
                    {currentPrice.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-sm font-bold" style={{ color: isUp ? T.bull : T.bear }}>
                    {isUp ? '+' : ''}{changePercent.toFixed(2)}%
                  </span>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                  <SignalGauge signal={analysis.overallSignal} score={analysis.overallScore} locale={locale} />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
                  className="mt-3 flex items-center justify-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.cyan }} />
                  <span className="text-[10px]" style={{ color: T.text3 }}>
                    {locale === 'ar' ? 'جارٍ التحميل...' : 'Loading analysis...'}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Summary ─── */}
        <AnimatePresence>
          {showSummary && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center"
              style={{ background: 'rgba(7,11,20,0.92)', backdropFilter: 'blur(8px)' }}
            >
              <div className="max-w-md text-center px-6">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${analysis.overallSignal === 'bullish' ? 'rgba(34,197,94,0.12)' : analysis.overallSignal === 'bearish' ? 'rgba(239,68,68,0.12)' : 'rgba(212,175,55,0.12)'}, transparent)`,
                    border: `1px solid ${analysis.overallSignal === 'bullish' ? 'rgba(34,197,94,0.2)' : analysis.overallSignal === 'bearish' ? 'rgba(239,68,68,0.2)' : 'rgba(212,175,55,0.2)'}`,
                  }}>
                  <span className="text-lg font-bold" style={{
                    color: analysis.overallSignal === 'bullish' ? T.bull : analysis.overallSignal === 'bearish' ? T.bear : T.gold,
                  }}>{symbol.slice(0, 2)}</span>
                </motion.div>
                <h2 className="text-lg font-bold mb-2" style={{ color: T.text }}>
                  {locale === 'ar' ? `ملخص التحليل — ${symbol}` : `Analysis Summary — ${symbol}`}
                </h2>
                <p className="text-[12px] leading-relaxed mb-3" style={{ color: T.text2 }}
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                  {locale === 'ar' ? analysis.summaryAr : analysis.summaryEn}
                </p>
                <div className="mb-3">
                  <SignalGauge signal={analysis.overallSignal} score={analysis.overallScore} locale={locale} />
                </div>
                <div className="text-[9px]" style={{ color: T.text3 }}>
                  {locale === 'ar' ? 'رؤى — تحليلات ذكية بالذكاء الاصطناعي | ليس نصيحة مالية' : 'ROUA Insights — AI-Powered Analysis | Not financial advice'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Overlays ─── */}
        <IndicatorPanel indicators={analysis.indicators} locale={locale} visible={showIndicators && sectionProgress > 0.2} />
        <TradeSetupPanel setup={analysis.tradeSetup} locale={locale} visible={showSetup && sectionProgress > 0.15} />
        <NarrationSubtitle text={narrationText} locale={locale} visible={isPlaying && !showIntro && !showSummary} />

        {/* ─── Finished overlay ─── */}
        <AnimatePresence>
          {isFinished && !isPlaying && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 flex items-center justify-center"
              style={{ background: 'rgba(7,11,20,0.8)' }}>
              <div className="text-center">
                <button onClick={() => { setElapsedTime(0); setIsPlaying(true); }}
                  className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                  style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(0,229,255,0.15)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={T.cyan}><polygon points="5,3 19,12 5,21" /></svg>
                </button>
                <p className="text-[11px] font-medium" style={{ color: T.text2 }}>
                  {locale === 'ar' ? 'إعادة التشغيل' : 'Replay'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Play/Pause overlay (when paused mid-video) ─── */}
        {!isPlaying && !isFinished && hasStarted && !showIntro && (
          <div className="absolute inset-0 z-40 flex items-center justify-center cursor-pointer"
            onClick={handlePlay} style={{ background: 'rgba(0,0,0,0.25)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{
              background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
            </div>
          </div>
        )}
      </div>

      {/* ─── Controls ─── */}
      <Controls
        isPlaying={isPlaying} currentTime={elapsedTime} totalTime={totalTime}
        speed={speed} locale={locale} sections={sections} currentSectionIdx={currentSectionIdx}
        onPlay={handlePlay} onPause={handlePause} onSeek={handleSeek}
        onSpeedChange={setSpeed} onSectionClick={handleSectionClick}
      />
    </div>
  );
}

// ─── Narration Text Generator ─────────────────────────────────

function getNarrationText(
  section: VideoSection | undefined,
  analysis: TechnicalAnalysisResult,
  symbol: string,
  assetName: string,
  price: number,
  changePercent: number,
  locale: 'ar' | 'en' | 'fr' | 'tr' | 'es',
): string {
  if (!section) return '';
  const isUp = changePercent >= 0;

  switch (section.id) {
    case 'intro':
      return locale === 'ar'
        ? `مرحباً بكم في التحليل الفني المتقدم لـ ${assetName}. السعر الحالي ${price.toFixed(2)}، ${isUp ? 'بصعود' : 'بانخفاض'} ${Math.abs(changePercent).toFixed(2)} بالمئة.`
        : `Welcome to the advanced technical analysis for ${assetName}. Current price is ${price.toFixed(2)}, ${isUp ? 'up' : 'down'} ${Math.abs(changePercent).toFixed(2)} percent.`;

    case 'chart':
      return locale === 'ar'
        ? analysis.trend.descriptionAr
        : analysis.trend.descriptionEn;

    case 'levels':
      return locale === 'ar'
        ? analysis.keyLevelsAr
        : analysis.keyLevelsEn;

    case 'indicators': {
      const texts = analysis.indicators.map(ind =>
        locale === 'ar' ? ind.descriptionAr : ind.descriptionEn
      );
      return texts.join('. ');
    }

    case 'setup':
      return locale === 'ar'
        ? analysis.tradeSetup.reasoningAr
        : analysis.tradeSetup.reasoningEn;

    case 'summary':
      return locale === 'ar'
        ? analysis.summaryAr
        : analysis.summaryEn;

    default:
      return '';
  }
}
