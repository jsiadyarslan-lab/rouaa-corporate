'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
  ColorType,
  CrosshairMode,
  LineStyle,
  HistogramData,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  AreaSeries,
} from 'lightweight-charts';

// ─── Types ────────────────────────────────────────────────────
interface PriceChartProps {
  data: { date: string; value: number; volume?: number }[];
  symbol: string;
  nameAr?: string;
  nameEn?: string;
  nameFr?: string;
  height?: number;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

type ChartMode = 'candlestick' | 'area';

// Symbol mapping for trading platform
const TP_SYMBOL_MAP: Record<string, string> = {
  'BTC': 'BTC-USDT', 'ETH': 'ETH-USDT', 'SOL': 'SOL-USDT',
  'XRP': 'XRP-USDT', 'BNB': 'BNB-USDT',
  'XAU': 'XAU-USD', 'XAG': 'XAG-USD', 'CL': 'CL-USD', 'WTI': 'CL-USD',
  'EUR': 'EUR-USD', 'GBP': 'GBP-USD',
};

function normalizeSymbol(symbol: string): string {
  return TP_SYMBOL_MAP[symbol.toUpperCase()] || symbol;
}

// ─── Dark Theme ──────────────────────────────────────────────
const DARK_THEME = {
  /* Using system-mapped colors from rouaa design system */
  background: '#0a0e1a',
  text: '#94a3b8',
  grid: '#1e293b',
  border: '#334155',
  bullCandle: '#22c55e',  /* var(--bull) */
  bearCandle: '#ef4444',  /* var(--bear) */
  bullBorder: '#16a34a',
  bearBorder: '#dc2626',
  volumeBull: 'rgba(34, 197, 94, 0.25)',
  volumeBear: 'rgba(239, 68, 68, 0.25)',
  crosshair: '#475569',
  lineColor: '#00E5FF',   /* var(--cyan) — primary brand color */
  areaTop: 'rgba(0, 229, 255, 0.25)',
  areaBottom: 'rgba(0, 229, 255, 0)',
};

export default function PriceChart({
  data,
  symbol,
  nameAr,
  nameEn,
  nameFr,
  height = 320,
  locale = 'ar',
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const [chartMode, setChartMode] = useState<ChartMode>('area');
  const [loading, setLoading] = useState(false);
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);
  const [dataSource, setDataSource] = useState<'prop' | 'live' | 'empty'>('empty');

  // ─── Initialize chart ─────────────────────────────────────
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height - 60,
      layout: {
        background: { type: ColorType.Solid, color: DARK_THEME.background },
        textColor: DARK_THEME.text,
        fontSize: 10,
      },
      grid: {
        vertLines: { color: DARK_THEME.grid, style: LineStyle.Dotted },
        horzLines: { color: DARK_THEME.grid, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: DARK_THEME.crosshair, style: LineStyle.Dashed, labelBackgroundColor: '#1e40af' },
        horzLine: { color: DARK_THEME.crosshair, style: LineStyle.Dashed, labelBackgroundColor: '#1e40af' },
      },
      rightPriceScale: {
        borderColor: DARK_THEME.border,
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      timeScale: {
        borderColor: DARK_THEME.border,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
        minBarSpacing: 2,
      },
    });

    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [height, chartMode]);

  // ─── Try to fetch candlestick data from trading platform ───
  const fetchCandleData = useCallback(async () => {
    const tpSymbol = normalizeSymbol(symbol);
    try {
      const res = await fetch(
        `/api/markets/integration?mode=chart&symbol=${encodeURIComponent(tpSymbol)}&interval=1day&limit=90`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        const candles = data.candles || [];
        if (Array.isArray(candles) && candles.length > 0) {
          const transformed: CandlestickData[] = candles
            .map((c: any) => {
              const open = typeof c.open === 'number' ? c.open : (Array.isArray(c) ? c[1] : 0);
              const high = typeof c.high === 'number' ? c.high : (Array.isArray(c) ? c[2] : 0);
              const low = typeof c.low === 'number' ? c.low : (Array.isArray(c) ? c[3] : 0);
              const close = typeof c.close === 'number' ? c.close : (Array.isArray(c) ? c[4] : 0);
              const ts = c.timestamp || c.time || c.date;
              if (close <= 0) return null;
              let time: Time;
              if (typeof ts === 'string') {
                time = ts as Time;
              } else if (typeof ts === 'number') {
                time = (ts > 1e12 ? Math.floor(ts / 1000) : ts) as Time;
              } else {
                return null;
              }
              return { time, open, high, low, close };
            })
            .filter((d): d is CandlestickData => d !== null);
          
          if (transformed.length > 0) {
            setCandleData(transformed);
            setDataSource('live');
            return;
          }
        }
      }
    } catch {
      // Silent — will use prop data as fallback
    }
    setDataSource('prop');
  }, [symbol]);

  useEffect(() => {
    fetchCandleData();
  }, [fetchCandleData]);

  // ─── Render chart based on mode and data ──────────────────
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove existing series before adding new one
    if (seriesRef.current) {
      try {
        chartRef.current.removeSeries(seriesRef.current);
      } catch {
        // Series may have been removed already (chart was recreated)
      }
      seriesRef.current = null;
    }

    if (chartMode === 'candlestick' && candleData.length > 0) {
      const candleSeries = chartRef.current.addSeries(CandlestickSeries, {
        upColor: DARK_THEME.bullCandle,
        downColor: DARK_THEME.bearCandle,
        borderUpColor: DARK_THEME.bullBorder,
        borderDownColor: DARK_THEME.bearBorder,
        wickUpColor: DARK_THEME.bullCandle,
        wickDownColor: DARK_THEME.bearCandle,
      });
      candleSeries.setData(candleData);
      seriesRef.current = candleSeries;
      chartRef.current.timeScale().fitContent();
    } else if (data && data.length > 0) {
      const areaData = data.map(d => ({
        time: d.date as Time,
        value: d.value,
      }));

      const areaSeries = chartRef.current.addSeries(AreaSeries, {
        lineColor: DARK_THEME.lineColor,
        topColor: DARK_THEME.areaTop,
        bottomColor: DARK_THEME.areaBottom,
        lineWidth: 2,
      });
      areaSeries.setData(areaData);
      seriesRef.current = areaSeries;
      chartRef.current.timeScale().fitContent();
    }
  }, [chartMode, candleData, data]);

  // Determine if we can show candlestick mode
  const canShowCandlestick = candleData.length > 0;
  const hasAnyData = candleData.length > 0 || (data && data.length > 0);

  if (!hasAnyData) {
    return (
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          height,
          background: DARK_THEME.background,
          border: '1px solid var(--border)',
        }}
      >
        <span className="text-[12px]" style={{ color: 'var(--text3)' }}>
          {locale === 'ar' ? 'لا توجد بيانات كافية' : locale === 'fr' ? 'Données insuffisantes' : 'Insufficient data'}
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: DARK_THEME.background,
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 flex-wrap gap-2"
        style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold" style={{ color: 'var(--text-head)' }}>{locale === 'ar' ? (nameAr || symbol) : locale === 'fr' ? (nameFr || nameEn || symbol) : (nameEn || symbol)}</span>
            <span className="font-mono-price text-[10px]" style={{ color: 'var(--text3)' }}>{symbol}</span>
            {dataSource === 'live' && (
              <span className="text-[8px] px-1.5 py-0.5 rounded" style={{
                background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.2)',
              }}>{locale === 'ar' ? 'مباشر' : locale === 'fr' ? 'En direct' : 'Live'}</span>
            )}
          </div>
        </div>
        {/* Mode switcher */}
        <div className="flex items-center gap-1" style={{ background: 'rgba(30, 41, 59, 0.8)', borderRadius: '6px', padding: '2px' }}>
          <button
            onClick={() => setChartMode('area')}
            className="px-2 py-1 rounded text-[10px] font-medium transition-all"
            style={{
              background: chartMode === 'area' ? '#3b82f6' : 'transparent',
              color: chartMode === 'area' ? 'white' : '#94a3b8',
            }}
          >
            {locale === 'ar' ? 'خطي' : locale === 'fr' ? 'Linéaire' : 'Line'}
          </button>
          {canShowCandlestick && (
            <button
              onClick={() => setChartMode('candlestick')}
              className="px-2 py-1 rounded text-[10px] font-medium transition-all"
              style={{
                background: chartMode === 'candlestick' ? '#3b82f6' : 'transparent',
                color: chartMode === 'candlestick' ? 'white' : '#94a3b8',
              }}
            >
              {locale === 'ar' ? 'شموع' : locale === 'fr' ? 'Bougies' : 'Candles'}
            </button>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ position: 'relative' }}>
        {/* Roua Watermark */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
            pointerEvents: 'none',
            opacity: 0.04,
            fontSize: '36px',
            fontWeight: 700,
            color: '#e2e8f0',
            letterSpacing: '6px',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {locale === 'ar' ? 'رؤى' : 'Rouaa'}
        </div>
        {loading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(10, 14, 26, 0.7)', zIndex: 10,
          }}>
            <span className="text-[12px]" style={{ color: '#94a3b8' }}>{locale === 'ar' ? 'جاري التحميل...' : locale === 'fr' ? 'Chargement...' : 'Loading...'}</span>
          </div>
        )}
        <div ref={chartContainerRef} style={{ width: '100%', height: height - 60 }} />
      </div>

      {/* Footer */}
      {dataSource === 'live' && (
        <div className="flex items-center justify-between px-3 py-1"
          style={{ background: 'rgba(15, 23, 42, 0.5)', borderTop: '1px solid rgba(51, 65, 85, 0.5)' }}
        >
          <span className="text-[9px] font-medium" style={{ color: 'var(--cyan, #00e5ff)' }}>{locale === 'ar' ? 'منصة رؤى للتداول' : locale === 'fr' ? 'Plateforme Rouaa Trading' : 'Rouaa Trading Platform'}</span>
        </div>
      )}
    </div>
  );
}
