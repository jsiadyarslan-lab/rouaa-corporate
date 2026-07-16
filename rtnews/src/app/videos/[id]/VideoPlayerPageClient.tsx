// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
import type { TechnicalAnalysisResult } from '@/lib/technical-analysis';
import InteractiveVideoPlayer from '@/components/video/InteractiveVideoPlayer';

// ─── Fix legacy local video URLs ──────────────────────────────
// Old videos have URLs like /generated/videos/xxx.mp4 which don't work
// on Railway (ephemeral filesystem). Convert them to the API serve route.
function fixVideoUrl(url: string | null): string | null {
  if (!url) return null;
  // Legacy local URLs → serve API
  if (url.startsWith('/generated/videos/')) {
    return url.replace('/generated/videos/', '/api/video/serve/');
  }
  // R2 public URLs → redirect through our serve API as proxy
  // R2 public URLs may expire/become inaccessible, but our server can
  // access R2 via S3 API credentials and cache the file locally.
  if (url.includes('.r2.dev/') || url.includes('.cloudflarestorage.com/')) {
    const match = url.match(/\/videos\/([^?]+)/);
    if (match) {
      return `/api/video/serve/${match[1]}`;
    }
  }
  return url;
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

// ─── Types ────────────────────────────────────────────────────
interface VideoData {
  id: string;
  title: string;
  slug: string;
  symbol: string;
  assetName: string;
  locale: string;
  reportType: string;
  assetClass: string;
  analysisText: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  status: string;
  error: string | null;
  viewCount: number;
  createdAt: string;
  sourceReportId: string | null;
  sourceType: string | null;
}

interface ChartPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type TimePeriod = '1W' | '1M' | '3M' | '6M' | '1Y';

const TIME_PERIODS: { key: TimePeriod; label: string; days: number }[] = [
  { key: '1W', label: 'أسبوع', days: 7 },
  { key: '1M', label: 'شهر', days: 30 },
  { key: '3M', label: '3 أشهر', days: 90 },
  { key: '6M', label: '6 أشهر', days: 180 },
  { key: '1Y', label: 'سنة', days: 365 },
];

// ─── Chart Component ──────────────────────────────────────────

function AnalysisChart({
  candleData,
  volumeData,
  analysis,
  selectedPeriod,
}: {
  candleData: CandlestickData[];
  volumeData: { time: Time; value: number; color?: string }[];
  analysis: TechnicalAnalysisResult;
  selectedPeriod: TimePeriod;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<any>[]>([]);
  const ohlcRef = useRef<HTMLDivElement>(null);

  // Filter data based on selected period
  const filteredData = useMemo(() => {
    if (!candleData.length) return { candles: [], volumes: [] };
    const periodDays = TIME_PERIODS.find(p => p.key === selectedPeriod)?.days || 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const filteredCandles = candleData.filter(d => (d.time as string) >= cutoffStr);
    const filteredVolumes = volumeData.filter(d => (d.time as string) >= cutoffStr);

    // If filtered results are too small, return all data
    if (filteredCandles.length < 5) {
      return { candles: candleData, volumes: volumeData };
    }
    return { candles: filteredCandles, volumes: filteredVolumes };
  }, [candleData, volumeData, selectedPeriod]);

  // Create chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: T.chartBg },
        textColor: T.text3,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: T.grid, style: LineStyle.Dotted },
        horzLines: { color: T.grid, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          visible: true,
          color: 'rgba(255,255,255,0.15)',
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e293b',
        },
        horzLine: {
          visible: true,
          color: 'rgba(255,255,255,0.15)',
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e293b',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        scaleMargins: { top: 0.05, bottom: 0.2 },
        ticksVisible: true,
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: false,
        rightOffset: 5,
        barSpacing: 8,
        ticksVisible: true,
      },
    });

    chartRef.current = chart;

    // Subscribe to crosshair move for OHLCV display
    chart.subscribeCrosshairMove((param) => {
      if (!ohlcRef.current) return;
      if (!param || !param.time || !param.seriesData) {
        // Show default
        if (filteredData.candles.length > 0) {
          const last = filteredData.candles[filteredData.candles.length - 1];
          ohlcRef.current.innerHTML = sanitizeHTML(formatOHLCV(last));
        }
        return;
      }

      // Find candlestick data from series data
      for (const [, seriesValue] of param.seriesData) {
        if (typeof seriesValue === 'object' && 'open' in seriesValue) {
          const d = seriesValue as CandlestickData;
          ohlcRef.current.innerHTML = sanitizeHTML(formatOHLCV(d));
          return;
        }
      }
    });

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update chart data
  useEffect(() => {
    if (!chartRef.current || filteredData.candles.length === 0) return;

    // Remove all existing series
    for (const s of seriesRefs.current) {
      try { chartRef.current!.removeSeries(s); } catch {}
    }
    seriesRefs.current = [];

    // Candlestick series
    const candleSeries = chartRef.current.addSeries(CandlestickSeries, {
      upColor: T.bull,
      downColor: T.bear,
      borderUpColor: T.bull,
      borderDownColor: T.bear,
      wickUpColor: T.bull,
      wickDownColor: T.bear,
    });
    candleSeries.setData(filteredData.candles);
    seriesRefs.current.push(candleSeries);

    // Volume series
    if (filteredData.volumes.length > 0) {
      const volSeries = chartRef.current.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chartRef.current.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
      volSeries.setData(filteredData.volumes);
      seriesRefs.current.push(volSeries);
    }

    // SMA 20 line
    const closes = filteredData.candles.map(d => d.close);
    if (closes.length >= 20) {
      const sma20Data: { time: Time; value: number }[] = [];
      for (let i = 19; i < closes.length; i++) {
        const sum = closes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0);
        sma20Data.push({ time: filteredData.candles[i].time, value: sum / 20 });
      }
      const smaSeries = chartRef.current.addSeries(LineSeries, {
        color: T.cyan,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      smaSeries.setData(sma20Data);
      seriesRefs.current.push(smaSeries);
    }

    // SMA 50 line
    if (closes.length >= 50) {
      const sma50Data: { time: Time; value: number }[] = [];
      for (let i = 49; i < closes.length; i++) {
        const sum = closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0);
        sma50Data.push({ time: filteredData.candles[i].time, value: sum / 50 });
      }
      const sma50Series = chartRef.current.addSeries(LineSeries, {
        color: T.orange,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      sma50Series.setData(sma50Data);
      seriesRefs.current.push(sma50Series);
    }

    // Support/resistance price lines
    for (const level of analysis.supportLevels.slice(0, 3)) {
      candleSeries.createPriceLine({
        price: level.price,
        color: 'rgba(34, 197, 94, 0.4)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: level.labelAr,
      });
    }
    for (const level of analysis.resistanceLevels.slice(0, 3)) {
      candleSeries.createPriceLine({
        price: level.price,
        color: 'rgba(239, 68, 68, 0.4)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: level.labelAr,
      });
    }

    chartRef.current.timeScale().fitContent();
  }, [filteredData, analysis]);

  return (
    <div className="relative w-full" style={{ height: '460px' }}>
      {/* OHLCV Display */}
      <div
        ref={ohlcRef}
        className="absolute top-3 right-16 z-10 px-3 py-1.5 rounded-md font-mono text-[11px]"
        style={{
          background: 'rgba(10,14,26,0.85)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(8px)',
          direction: 'ltr',
        }}
      >
        {filteredData.candles.length > 0 &&
          formatOHLCV(filteredData.candles[filteredData.candles.length - 1])}
      </div>

      {/* SMA Legend */}
      <div
        className="absolute top-3 left-3 z-10 flex items-center gap-4 px-2 py-1 rounded-md"
        style={{ background: 'rgba(10,14,26,0.7)', direction: 'ltr' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded" style={{ background: T.cyan }} />
          <span className="text-[9px]" style={{ color: T.text3 }}>SMA 20</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded" style={{ background: T.orange }} />
          <span className="text-[9px]" style={{ color: T.text3 }}>SMA 50</span>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
    </div>
  );
}

function formatOHLCV(d: CandlestickData): string {
  const o = d.open.toFixed(2);
  const h = d.high.toFixed(2);
  const l = d.low.toFixed(2);
  const c = d.close.toFixed(2);
  const isUp = d.close >= d.open;
  const color = isUp ? T.bull : T.bear;
  return `<span style="color:${T.text3}">O</span> <span style="color:${color}">${o}</span> <span style="color:${T.text3}">H</span> <span style="color:${color}">${h}</span> <span style="color:${T.text3}">L</span> <span style="color:${color}">${l}</span> <span style="color:${T.text3}">C</span> <span style="color:${color}">${c}</span>`;
}

/** Sanitize HTML before innerHTML assignment — strips script tags and event handler attributes */
function sanitizeHTML(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

// ─── Strength Bar ─────────────────────────────────────────────

function StrengthBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  );
}

// ─── Indicator Signal Dot ─────────────────────────────────────

function SignalDot({ signal }: { signal: 'bullish' | 'bearish' | 'neutral' }) {
  const color = signal === 'bullish' ? T.bull : signal === 'bearish' ? T.bear : T.gold;
  return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />;
}

// ─── Main Component ───────────────────────────────────────────

export default function VideoPlayerPageClient() {
  const params = useParams();
  const videoId = params.id as string;

  const [video, setVideo] = useState<VideoData | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [analysis, setAnalysis] = useState<TechnicalAnalysisResult | null>(null);
  const [isSynthetic, setIsSynthetic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('3M');
  const [viewMode, setViewMode] = useState<'video' | 'interactive'>('video');
  const [videoError, setVideoError] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/video/${videoId}`);
        if (!res.ok) throw new Error('لم يتم العثور على التحليل');
        const data = await res.json();

        if (data.success) {
          setVideo(data.video);
          setChartData(data.chartData || []);
          setQuote(data.quote);
          setAnalysis(data.analysis || null);
          setIsSynthetic(data.isSynthetic || false);
        } else {
          setError(data.error || 'فشل تحميل التحليل');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (videoId) fetchData();
  }, [videoId]);

  // Auto-fallback: when MP4 playback fails, switch to interactive player
  useEffect(() => {
    if (videoError && viewMode === 'video' && chartData.length > 0) {
      setViewMode('interactive');
    }
  }, [videoError, viewMode, chartData.length]);

  // Auto-poll when video is still processing
  useEffect(() => {
    if (!video || video.status !== 'processing') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video/${videoId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.video) {
          setVideo(data.video);
          if (data.video.status !== 'processing') {
            clearInterval(interval);
            if (data.video.status === 'completed') {
              setVideoError(false);
            }
          }
        }
      } catch {}
    }, 8000); // Poll every 8 seconds
    return () => clearInterval(interval);
  }, [video?.status, videoId]);

  // Handle regenerate video
  const handleRegenerate = useCallback(async () => {
    if (!video || regenerating) return;
    setRegenerating(true);
    setVideoError(false);
    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: video.symbol,
          assetName: video.assetName,
          locale: video.locale,
          assetClass: video.assetClass,
          marketImpact: video.analysisText ? JSON.parse(video.analysisText).market_impact : 'neutral',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Navigate to new video
          window.location.href = `/videos/${data.videoId}`;
        }
      }
    } catch (err) {
      console.error('Regeneration failed:', err);
    } finally {
      setRegenerating(false);
    }
  }, [video, regenerating]);

  // Transform chart data for lightweight-charts
  const candlestickData = useMemo<CandlestickData[]>(() => {
    if (!chartData.length) return [];
    return chartData
      .map((d) => ({
        time: d.date as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
      .sort((a, b) => (a.time as string).localeCompare(b.time as string));
  }, [chartData]);

  // Volume data
  const volumeData = useMemo(() => {
    if (!chartData.length) return [];
    return chartData
      .map((d) => ({
        time: d.date as Time,
        value: d.volume || 0,
        color: d.close >= d.open ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
      }))
      .sort((a, b) => (a.time as string).localeCompare(b.time as string));
  }, [chartData]);

  const currentPrice = quote?.price || (chartData.length > 0 ? chartData[chartData.length - 1].close : 0);
  const changePercent = quote?.changePercent || 0;
  const changeAmount = quote?.change || 0;
  const isUp = changePercent >= 0;

  // ─── Loading State ────────────────────────────────────────
  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen" style={{ background: T.bg }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Skeleton Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="flex-1">
              <div className="h-5 w-48 rounded animate-pulse mb-2" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="h-3 w-32 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
            </div>
            <div className="h-10 w-32 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
          {/* Skeleton Chart */}
          <div className="w-full rounded-xl animate-pulse mb-6" style={{ height: '460px', background: 'rgba(255,255,255,0.02)' }} />
          {/* Skeleton Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────
  if (error || !video) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <div className="text-center px-6">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.15)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: T.text }}>خطأ في التحميل</h2>
          <p className="text-sm mb-6" style={{ color: T.text2 }}>{error || 'لم يتم العثور على التحليل'}</p>
          <Link href="/videos" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105" style={{
            background: 'rgba(0,229,255,0.1)',
            color: T.cyan,
            border: '1px solid rgba(0,229,255,0.2)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            العودة للتحليلات
          </Link>
        </div>
      </div>
    );
  }

  // ─── Default analysis fallback ────────────────────────────
  const defaultAnalysis: TechnicalAnalysisResult = {
    symbol: video.symbol,
    currentPrice,
    changePercent,
    trend: { direction: 'neutral', strength: 0, descriptionAr: 'جارٍ التحليل', descriptionEn: 'Analyzing' },
    supportLevels: [],
    resistanceLevels: [],
    movingAverages: { sma20: currentPrice, sma50: currentPrice, crossover: 'none', priceVsSMA20: 'above', priceVsSMA50: 'above' },
    indicators: [],
    tradeSetup: { direction: 'wait', entryPrice: currentPrice, stopLoss: 0, targetPrice: 0, riskRewardRatio: 0, confidence: 0, reasoningAr: 'جارٍ التحليل', reasoningEn: 'Analyzing' },
    volatility: 0,
    overallSignal: 'neutral',
    overallScore: 0,
    summaryAr: 'جارٍ تحميل التحليل الفني',
    summaryEn: 'Loading technical analysis',
    keyLevelsAr: 'جارٍ التحليل',
    keyLevelsEn: 'Analyzing',
  };
  const an = analysis || defaultAnalysis;

  const trendColor = an.trend.direction === 'bullish' ? T.bull : an.trend.direction === 'bearish' ? T.bear : T.gold;
  const trendLabelAr = an.trend.direction === 'bullish' ? 'صاعد' : an.trend.direction === 'bearish' ? 'هابط' : 'عرضي';
  const signalColor = an.overallSignal === 'bullish' ? T.bull : an.overallSignal === 'bearish' ? T.bear : T.gold;

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: T.bg }}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* ─── Breadcrumb ─── */}
        <div className="flex items-center gap-2 mb-4 text-[11px]" style={{ color: T.text3 }}>
          <Link href="/videos" className="hover:text-[var(--cyan)] transition-colors" style={{ color: T.text3 }}>
            التحليلات
          </Link>
          <span>/</span>
          <span style={{ color: T.text2 }}>{video.symbol}</span>
        </div>

        {/* ─── Synthetic Data Warning ─── */}
        {isSynthetic && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div className="flex-1">
              <span className="text-[11px] font-bold" style={{ color: T.orange }}>بيانات تقريبية</span>
              <span className="text-[11px] mr-2" style={{ color: T.text2 }}>
                البيانات المعروضة تقريبية وليست بيانات سوق حقيقية مباشرة. قد لا تعكس الأسعار الفعلية بدقة.
              </span>
            </div>
          </motion.div>
        )}

        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5"
        >
          {/* Symbol Badge */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
              background: isUp ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${isUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
            }}>
              <span className="text-sm font-bold" style={{ color: isUp ? T.bull : T.bear }}>
                {video.symbol.slice(0, 4)}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: T.text }}>{video.assetName}</h1>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold" style={{ color: T.text2 }}>{video.symbol}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{
                  background: isUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: isUp ? T.bull : T.bear,
                }}>
                  {isUp ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="sm:mr-auto text-left sm:text-left">
            <div className="text-3xl font-mono font-bold" style={{ color: T.text }}>
              {currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-mono font-bold" style={{ color: isUp ? T.bull : T.bear }}>
                {isUp ? '+' : ''}{changeAmount.toFixed(2)}
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: isUp ? T.bull : T.bear }}>
                ({isUp ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Data source badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{
            background: isSynthetic ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)',
            border: `1px solid ${isSynthetic ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)'}`,
          }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSynthetic ? T.orange : T.bull }} />
            <span className="text-[10px] font-bold" style={{ color: isSynthetic ? T.orange : T.bull }}>
              {isSynthetic ? 'بيانات تقريبية' : 'بيانات حقيقية'}
            </span>
          </div>
        </motion.div>

        {/* ─── View Mode Toggle ─── */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setViewMode('video')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-bold transition-all"
            style={{
              background: viewMode === 'video' ? 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(245,158,11,0.1))' : 'rgba(255,255,255,0.02)',
              color: viewMode === 'video' ? T.gold : T.text3,
              border: `1px solid ${viewMode === 'video' ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.04)'}`,
              boxShadow: viewMode === 'video' ? '0 0 12px rgba(212,175,55,0.08)' : 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            عرض الفيديو
          </button>
          <button
            onClick={() => setViewMode('interactive')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-bold transition-all"
            style={{
              background: viewMode === 'interactive' ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.02)',
              color: viewMode === 'interactive' ? T.cyan : T.text3,
              border: `1px solid ${viewMode === 'interactive' ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.04)'}`,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20V10M18 20V4M6 20v-4" />
            </svg>
            عرض تفاعلي
          </button>
        </div>

        {/* ─── Video Mode (MP4 or Interactive fallback) ─── */}
        {viewMode === 'video' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {video.videoUrl && !videoError ? (
              /* ─── Real MP4 Video Player ─── */
              <div className="relative rounded-xl overflow-hidden" style={{
                background: T.bg,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <video
                  key={fixVideoUrl(video.videoUrl) || ''}
                  controls
                  autoPlay
                  playsInline
                  poster={fixVideoUrl(video.thumbnailUrl) || undefined}
                  className="w-full"
                  style={{ aspectRatio: '16/9', background: '#000' }}
                  onError={() => {
                    console.error('Video playback error — file likely missing');
                    setVideoError(true);
                  }}
                >
                  <source src={fixVideoUrl(video.videoUrl)} type="video/mp4" />
                  متصفحك لا يدعم تشغيل الفيديو
                </video>
                {/* Video badge */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                  <span className="text-[9px] px-2 py-0.5 rounded font-bold" style={{
                    background: 'rgba(212,175,55,0.8)',
                    color: '#050810',
                  }}>MP4</span>
                  <span className="text-[9px] px-2 py-0.5 rounded font-bold" style={{
                    background: 'rgba(139,92,246,0.7)',
                    color: '#fff',
                  }}>AI</span>
                </div>
              </div>
            ) : (videoError || video.status === 'failed') && candlestickData.length > 0 ? (
              /* ─── Video Error but chart data available — show interactive player directly ─── */
              <InteractiveVideoPlayer
                symbol={video.symbol}
                assetNameAr={video.assetName}
                assetNameEn={video.assetName}
                currentPrice={currentPrice}
                changePercent={changePercent}
                locale="ar"
                candleData={candlestickData}
                volumeData={volumeData}
                analysis={an}
              />
            ) : (videoError || video.status === 'failed') ? (
              /* ─── Video Error / Expired / Failed — NO chart data fallback ─── */
              <div className="flex items-center justify-center rounded-xl" style={{
                height: '400px',
                background: T.bg,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div className="text-center px-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.15)',
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                  </div>
                  <p className="text-base font-bold mb-2" style={{ color: T.text }}>
                    {videoError ? 'الفيديو غير متوفر حالياً' : 'فشل إنشاء الفيديو'}
                  </p>
                  <p className="text-sm mb-4" style={{ color: T.text3 }}>
                    {videoError
                      ? 'الفيديو قيد المعالجة أو غير متوفر حالياً. يمكنك الاطلاع على التحليل التفاعلي.'
                      : video.error?.includes('expired')
                        ? 'انتهت صلاحية الفيديو. يمكنك الاطلاع على التحليل التفاعلي.'
                        : video.error || 'حدث خطأ أثناء توليد الفيديو'}
                  </p>
                  <button
                    onClick={() => setViewMode('interactive')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
                    style={{
                      background: 'rgba(0,229,255,0.1)',
                      color: T.cyan,
                      border: '1px solid rgba(0,229,255,0.2)',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20V10M18 20V4M6 20v-4" />
                    </svg>
                    الاطلاع على التحليل التفاعلي
                  </button>
                </div>
              </div>
            ) : candlestickData.length > 0 ? (
              /* ─── Fallback: Interactive Player ─── */
              <InteractiveVideoPlayer
                symbol={video.symbol}
                assetNameAr={video.assetName}
                assetNameEn={video.assetName}
                currentPrice={currentPrice}
                changePercent={changePercent}
                locale="ar"
                candleData={candlestickData}
                volumeData={volumeData}
                analysis={an}
              />
            ) : (
              /* ─── No data at all — show processing/failed state ─── */
              <div className="flex items-center justify-center rounded-xl" style={{
                height: '400px',
                background: T.bg,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div className="text-center">
                  {video.status === 'processing' ? (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.15)',
                      }}>
                        <div className="w-8 h-8 border-3 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                      </div>
                      <p className="text-base font-bold mb-2" style={{ color: T.text }}>جارٍ إنشاء الفيديو</p>
                      <p className="text-sm" style={{ color: T.text3 }}>يتم توليد الفيديو بالذكاء الاصطناعي مع الصور والتعليق الصوتي</p>
                      <p className="text-xs mt-2" style={{ color: T.text3 }}>قد يستغرق 3-10 دقائق</p>
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.bull }} />
                          <span className="text-[10px]" style={{ color: T.text3 }}>صور AI</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.cyan, animationDelay: '0.5s' }} />
                          <span className="text-[10px]" style={{ color: T.text3 }}>تعليق صوتي</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.gold, animationDelay: '1s' }} />
                          <span className="text-[10px]" style={{ color: T.text3 }}>رسومات متحركة</span>
                        </div>
                      </div>
                    </>
                  ) : video.status === 'failed' ? (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.15)',
                      }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      </div>
                      <p className="text-base font-bold mb-2" style={{ color: T.text }}>فشل إنشاء الفيديو</p>
                      <p className="text-sm" style={{ color: T.text3 }}>
                        {video.error?.includes('expired') ? 'انتهت صلاحية الفيديو. يمكنك الاطلاع على التحليل التفاعلي.' : video.error || 'حدث خطأ أثناء توليد الفيديو'}
                      </p>
                    </>
                  ) : (
                    <>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="1.5" className="mx-auto mb-3">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                      <p className="text-sm" style={{ color: T.text3 }}>لا يتوفر فيديو حالياً</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Interactive Mode ─── */}
        {viewMode === 'interactive' && (
        <>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl overflow-hidden mb-6"
          style={{
            background: T.chartBg,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Chart Header with Period Selector */}
          <div className="flex items-center justify-between px-4 py-3" style={{
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold" style={{ color: T.text }}>الرسم البياني</span>
              <span className="text-[10px]" style={{ color: T.text3 }}>— {video.symbol}</span>
            </div>
            <div className="flex items-center gap-1" style={{ direction: 'ltr' }}>
              {TIME_PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setSelectedPeriod(p.key)}
                  className="px-2.5 py-1 rounded text-[10px] font-bold transition-all"
                  style={{
                    background: selectedPeriod === p.key ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.03)',
                    color: selectedPeriod === p.key ? T.cyan : T.text3,
                    border: `1px solid ${selectedPeriod === p.key ? 'rgba(0,229,255,0.2)' : 'transparent'}`,
                  }}
                >
                  {p.key}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          {candlestickData.length > 0 ? (
            <AnalysisChart
              candleData={candlestickData}
              volumeData={volumeData}
              analysis={an}
              selectedPeriod={selectedPeriod}
            />
          ) : (
            <div className="flex items-center justify-center" style={{ height: '460px' }}>
              <div className="text-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="1.5" className="mx-auto mb-3">
                  <path d="M3 3v18h18" />
                  <path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
                </svg>
                <p className="text-sm" style={{ color: T.text3 }}>لا تتوفر بيانات الرسم البياني</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ─── Analysis Cards Grid ─── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {/* ─── Trend Card ─── */}
          <div className="rounded-xl p-4" style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={trendColor} strokeWidth="2">
                {an.trend.direction === 'bullish' ? (
                  <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
                ) : an.trend.direction === 'bearish' ? (
                  <polyline points="22,17 13.5,8.5 8.5,13.5 2,7" />
                ) : (
                  <line x1="5" y1="12" x2="19" y2="12" />
                )}
              </svg>
              <span className="text-[11px] font-bold" style={{ color: T.text }}>الاتجاه</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold" style={{ color: trendColor }}>{trendLabelAr}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded" style={{
                background: `${trendColor}12`,
                color: trendColor,
              }}>
                {an.trend.strength}%
              </span>
            </div>
            <StrengthBar value={an.trend.strength} color={trendColor} />
            <p className="text-[10px] mt-2 leading-relaxed" style={{ color: T.text3 }}>
              {an.trend.descriptionAr}
            </p>
          </div>

          {/* ─── Key Levels Card ─── */}
          <div className="rounded-xl p-4" style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2">
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
              <span className="text-[11px] font-bold" style={{ color: T.text }}>المستويات المفتاحية</span>
            </div>

            {/* Support */}
            <div className="mb-3">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: T.bull }}>
                مستويات الدعم
              </span>
              <div className="mt-1 space-y-0.5">
                {an.supportLevels.length > 0 ? an.supportLevels.map((l, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5">
                    <span className="text-[10px]" style={{ color: T.text3 }}>{l.labelAr}</span>
                    <span className="text-[11px] font-mono font-bold" style={{ color: T.bull }}>
                      {l.price.toFixed(2)}
                    </span>
                  </div>
                )) : (
                  <span className="text-[10px]" style={{ color: T.text3 }}>لا مستويات واضحة</span>
                )}
              </div>
            </div>

            {/* Resistance */}
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: T.bear }}>
                مستويات المقاومة
              </span>
              <div className="mt-1 space-y-0.5">
                {an.resistanceLevels.length > 0 ? an.resistanceLevels.map((l, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5">
                    <span className="text-[10px]" style={{ color: T.text3 }}>{l.labelAr}</span>
                    <span className="text-[11px] font-mono font-bold" style={{ color: T.bear }}>
                      {l.price.toFixed(2)}
                    </span>
                  </div>
                )) : (
                  <span className="text-[10px]" style={{ color: T.text3 }}>لا مستويات واضحة</span>
                )}
              </div>
            </div>
          </div>

          {/* ─── Indicators Card ─── */}
          <div className="rounded-xl p-4" style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.cyan} strokeWidth="2">
                <path d="M12 20V10M18 20V4M6 20v-4" />
              </svg>
              <span className="text-[11px] font-bold" style={{ color: T.text }}>المؤشرات الفنية</span>
            </div>
            {an.indicators.length > 0 ? (
              <div className="space-y-2">
                {an.indicators.map((ind, i) => {
                  const sigColor = ind.signal === 'bullish' ? T.bull : ind.signal === 'bearish' ? T.bear : T.gold;
                  const sigLabel = ind.signal === 'bullish' ? 'شراء' : ind.signal === 'bearish' ? 'بيع' : 'محايد';
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <SignalDot signal={ind.signal} />
                      <span className="text-[10px] font-bold flex-1" style={{ color: T.text2 }}>{ind.name}</span>
                      <span className="text-[10px] font-mono" style={{ color: T.text3 }}>{ind.value.toFixed(1)}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{
                        background: `${sigColor}12`,
                        color: sigColor,
                      }}>{sigLabel}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-[10px]" style={{ color: T.text3 }}>لا مؤشرات متاحة</span>
            )}

            {/* Overall Signal */}
            <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-[10px] font-bold" style={{ color: T.text2 }}>الإشارة العامة</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{
                background: `${signalColor}12`,
                color: signalColor,
              }}>
                {an.overallSignal === 'bullish' ? 'شرائية' : an.overallSignal === 'bearish' ? 'بيعية' : 'محايدة'}
              </span>
            </div>
          </div>

          {/* ─── Trade Setup Card ─── */}
          <div className="rounded-xl p-4" style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.purple} strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="text-[11px] font-bold" style={{ color: T.text }}>فرصة التداول</span>
              {an.tradeSetup.direction !== 'wait' && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded mr-auto" style={{
                  background: an.tradeSetup.direction === 'long' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                  color: an.tradeSetup.direction === 'long' ? T.bull : T.bear,
                  border: `1px solid ${an.tradeSetup.direction === 'long' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  {an.tradeSetup.direction === 'long' ? 'شراء' : 'بيع'}
                </span>
              )}
            </div>

            {an.tradeSetup.direction !== 'wait' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px]" style={{ color: T.text3 }}>الدخول</span>
                    <div className="text-[12px] font-mono font-bold" style={{ color: T.text }}>
                      {an.tradeSetup.entryPrice.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px]" style={{ color: T.text3 }}>وقف خسارة</span>
                    <div className="text-[12px] font-mono font-bold" style={{ color: T.bear }}>
                      {an.tradeSetup.stopLoss.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px]" style={{ color: T.text3 }}>الهدف</span>
                    <div className="text-[12px] font-mono font-bold" style={{ color: T.bull }}>
                      {an.tradeSetup.targetPrice.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px]" style={{ color: T.text3 }}>مخاطرة:عائد</span>
                    <div className="text-[12px] font-mono font-bold" style={{
                      color: an.tradeSetup.riskRewardRatio >= 2 ? T.bull : T.gold,
                    }}>
                      1:{an.tradeSetup.riskRewardRatio.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Confidence */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px]" style={{ color: T.text3 }}>مستوى الثقة</span>
                    <span className="text-[10px] font-mono font-bold" style={{ color: T.cyan }}>
                      {an.tradeSetup.confidence}%
                    </span>
                  </div>
                  <StrengthBar value={an.tradeSetup.confidence} color={T.cyan} />
                </div>
              </div>
            ) : (
              <div className="py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
                    background: 'rgba(212,175,55,0.1)',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                  <span className="text-[11px] font-bold" style={{ color: T.gold }}>انتظار</span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: T.text3 }}>
                  {an.tradeSetup.reasoningAr}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ─── AI Analysis Text ─── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl p-5 mb-6" style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
              background: 'rgba(139,92,246,0.1)',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.purple} strokeWidth="2">
                <path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20z" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
            <span className="text-[12px] font-bold" style={{ color: T.text }}>تحليل الذكاء الاصطناعي</span>
            <span className="text-[9px] px-2 py-0.5 rounded" style={{
              background: 'rgba(139,92,246,0.1)',
              color: T.purple,
            }}>AI</span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: T.text2 }} dir="rtl">
            {an.summaryAr}
          </p>
          {video.analysisText && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[12px] leading-relaxed" style={{ color: T.text3 }} dir="rtl">
                {video.analysisText}
              </p>
            </div>
          )}
        </motion.div>

        {/* ─── Moving Averages & Additional Info ─── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {/* SMA Info */}
          <div className="rounded-xl p-4" style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span className="text-[11px] font-bold" style={{ color: T.text }}>المتوسطات المتحركة</span>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 rounded" style={{ background: T.cyan }} />
                  <span className="text-[10px]" style={{ color: T.text3 }}>SMA 20</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold" style={{ color: T.text }}>
                    {an.movingAverages.sma20.toFixed(2)}
                  </span>
                  <span className="text-[9px] px-1 py-0.5 rounded" style={{
                    background: an.movingAverages.priceVsSMA20 === 'above' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: an.movingAverages.priceVsSMA20 === 'above' ? T.bull : T.bear,
                  }}>
                    {an.movingAverages.priceVsSMA20 === 'above' ? 'فوق' : 'تحت'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 rounded" style={{ background: T.orange }} />
                  <span className="text-[10px]" style={{ color: T.text3 }}>SMA 50</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold" style={{ color: T.text }}>
                    {an.movingAverages.sma50.toFixed(2)}
                  </span>
                  <span className="text-[9px] px-1 py-0.5 rounded" style={{
                    background: an.movingAverages.priceVsSMA50 === 'above' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: an.movingAverages.priceVsSMA50 === 'above' ? T.bull : T.bear,
                  }}>
                    {an.movingAverages.priceVsSMA50 === 'above' ? 'فوق' : 'تحت'}
                  </span>
                </div>
              </div>
              {an.movingAverages.crossover !== 'none' && (
                <div className="pt-2 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{
                    background: an.movingAverages.crossover === 'golden' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: an.movingAverages.crossover === 'golden' ? T.bull : T.bear,
                  }}>
                    {an.movingAverages.crossover === 'golden' ? 'تقاطع ذهبي ↑' : 'تقاطع الموت ↓'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Volatility */}
          <div className="rounded-xl p-4" style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span className="text-[11px] font-bold" style={{ color: T.text }}>التذبذب (ATR)</span>
            <div className="mt-3">
              <div className="text-2xl font-mono font-bold" style={{ color: T.orange }}>
                {an.volatility.toFixed(2)}
              </div>
              <div className="text-[10px] mt-1" style={{ color: T.text3 }}>
                متوسط المدى الحقيقي لآخر 14 يوم
              </div>
              <div className="mt-2">
                <StrengthBar
                  value={Math.min(100, (an.volatility / currentPrice) * 1000)}
                  color={an.volatility / currentPrice > 0.03 ? T.bear : T.orange}
                />
              </div>
            </div>
          </div>

          {/* Source Report Link */}
          <div className="rounded-xl p-4 flex flex-col" style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span className="text-[11px] font-bold" style={{ color: T.text }}>معلومات إضافية</span>
            <div className="mt-3 space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: T.text3 }}>تاريخ الإنشاء</span>
                <span className="text-[10px] font-mono" style={{ color: T.text2 }}>
                  {new Date(video.createdAt).toLocaleDateString('ar-SA')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: T.text3 }}>المشاهدات</span>
                <span className="text-[10px] font-mono" style={{ color: T.text2 }}>
                  {video.viewCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: T.text3 }}>النوع</span>
                <span className="text-[10px]" style={{ color: T.text2 }}>{video.reportType}</span>
              </div>
            </div>
            {video.sourceReportId && (
              <Link href={`/reports/${video.sourceReportId}`}
                className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-[1.01]"
                style={{
                  background: 'rgba(212,175,55,0.06)',
                  border: '1px solid rgba(212,175,55,0.12)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                <span className="text-[10px] font-bold" style={{ color: T.gold }}>التقرير الأصلي</span>
              </Link>
            )}
          </div>
        </motion.div>

        {/* ─── Disclaimer ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl p-4 mb-6" style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.03)',
          }}
        >
          <div className="flex items-start gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[10px] leading-relaxed" style={{ color: T.text3 }} dir="rtl">
              تنبيه هام: هذا التحليل مُوَلَّد بالذكاء الاصطناعي لأغراض تعليمية وتثقيفية فقط، ولا يُعد نصيحة مالية أو استثمارية بأي شكل. الأداء السابق لا يضمن النتائج المستقبلية. يرجى إجراء بحثك الخاص واستشارة مستشار مالي معتمد قبل اتخاذ أي قرارات استثمارية. شركة رؤى غير مسؤولة عن أي خسائر ناتجة عن استخدام هذه المعلومات.
            </p>
          </div>
        </motion.div>
        </>
        )}
      </div>
    </div>
  );
}
