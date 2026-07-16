'use client';

// ─── Lightweight Charts Wrapper ──────────────────────────────────
// Wraps the `lightweight-charts` v5 library for the stock detail page.
// This component MUST be client-only (dynamic imported with ssr: false).
// v5 API: chart.addSeries(CandlestickSeries, options)
// Supports: Candlestick/Line toggle, Volume overlay, SMA 20/50 lines,
// Bollinger Bands overlay, individual indicator toggles

import { useEffect, useRef, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  ColorType,
} from 'lightweight-charts';

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Props {
  data: CandleData[];
  chartType?: 'candlestick' | 'line';
  showSMA20?: boolean;
  showSMA50?: boolean;
  showBollinger?: boolean;
  showVolume?: boolean;
  height?: number;
  bollingerData?: {
    upper: { date: string; value: number }[];
    middle: { date: string; value: number }[];
    lower: { date: string; value: number }[];
  } | null;
}

// Calculate Simple Moving Average
function calcSMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += closes[j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

// Calculate Standard Deviation
function calcStdDev(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += values[j];
      }
      const mean = sum / period;
      let sqSum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sqSum += (values[j] - mean) ** 2;
      }
      result.push(Math.sqrt(sqSum / period));
    }
  }
  return result;
}

// Calculate Bollinger Bands (20-period SMA ± 2 std dev)
function calcBollingerBands(data: CandleData[]): {
  upper: { date: string; value: number }[];
  middle: { date: string; value: number }[];
  lower: { date: string; value: number }[];
} {
  const closes = data.map(d => d.close);
  const sma = calcSMA(closes, 20);
  const stdDev = calcStdDev(closes, 20);
  const upper: { date: string; value: number }[] = [];
  const middle: { date: string; value: number }[] = [];
  const lower: { date: string; value: number }[] = [];

  for (let i = 0; i < data.length; i++) {
    if (sma[i] != null && stdDev[i] != null) {
      const mid = sma[i]!;
      const band = 2 * stdDev[i]!;
      upper.push({ date: data[i].date, value: mid + band });
      middle.push({ date: data[i].date, value: mid });
      lower.push({ date: data[i].date, value: mid - band });
    }
  }

  return { upper, middle, lower };
}

export default function LightweightChartWrapper({
  data,
  chartType = 'candlestick',
  showSMA20 = true,
  showSMA50 = true,
  showBollinger = false,
  showVolume = true,
  height = 400,
  bollingerData: externalBollingerData,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Compute SMA 20 data
  const sma20Data = useMemo(() => {
    if (!showSMA20 || !data || data.length < 20) return [];
    const closes = data.map(d => d.close);
    const sma = calcSMA(closes, 20);
    return data.map((d, i) => ({
      time: d.date,
      value: sma[i],
    })).filter(d => d.value != null);
  }, [data, showSMA20]);

  // Compute SMA 50 data
  const sma50Data = useMemo(() => {
    if (!showSMA50 || !data || data.length < 50) return [];
    const closes = data.map(d => d.close);
    const sma = calcSMA(closes, 50);
    return data.map((d, i) => ({
      time: d.date,
      value: sma[i],
    })).filter(d => d.value != null);
  }, [data, showSMA50]);

  // Compute Bollinger Bands data
  const bollingerBands = useMemo(() => {
    if (!showBollinger || !data || data.length < 20) return null;
    if (externalBollingerData) return externalBollingerData;
    return calcBollingerBands(data);
  }, [data, showBollinger, externalBollingerData]);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    const chart = createChart(container, {
      width: rect.width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(59,130,246,0.3)', labelBackgroundColor: '#3b82f6' },
        horzLine: { color: 'rgba(59,130,246,0.3)', labelBackgroundColor: '#3b82f6' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        scaleMargins: { top: 0.1, bottom: showVolume ? 0.25 : 0.05 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: false,
      },
    });

    chartRef.current = chart;

    if (chartType === 'candlestick') {
      // Candlestick series — v5 API
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      candleSeries.setData(
        data.map(d => ({
          time: d.date,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      );
    } else {
      // Line series
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: '#3b82f6',
        crosshairMarkerBackgroundColor: '#0a0f1e',
      });

      lineSeries.setData(
        data.map(d => ({
          time: d.date,
          value: d.close,
        }))
      );
    }

    // Volume series
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });

      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      volumeSeries.setData(
        data.map(d => ({
          time: d.date,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
        }))
      );
    }

    // Bollinger Bands
    if (showBollinger && bollingerBands) {
      // Upper band
      if (bollingerBands.upper.length > 0) {
        const upperSeries = chart.addSeries(LineSeries, {
          color: 'rgba(59,130,246,0.35)',
          lineWidth: 1,
          crosshairMarkerVisible: false,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        upperSeries.setData(bollingerBands.upper as any as { time: string; value: number }[]);
      }
      // Middle band (same as SMA 20, only show if SMA20 is off)
      if (!showSMA20 && bollingerBands.middle.length > 0) {
        const middleSeries = chart.addSeries(LineSeries, {
          color: 'rgba(59,130,246,0.5)',
          lineWidth: 1,
          lineStyle: 2, // dashed
          crosshairMarkerVisible: false,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        middleSeries.setData(bollingerBands.middle as any as { time: string; value: number }[]);
      }
      // Lower band
      if (bollingerBands.lower.length > 0) {
        const lowerSeries = chart.addSeries(LineSeries, {
          color: 'rgba(59,130,246,0.35)',
          lineWidth: 1,
          crosshairMarkerVisible: false,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        lowerSeries.setData(bollingerBands.lower as any as { time: string; value: number }[]);
      }
    }

    // SMA 20 line
    if (showSMA20 && sma20Data.length > 0) {
      const sma20Series = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 1,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      sma20Series.setData(sma20Data as { time: string; value: number }[]);
    }

    // SMA 50 line
    if (showSMA50 && sma50Data.length > 0) {
      const sma50Series = chart.addSeries(LineSeries, {
        color: '#8b5cf6',
        lineWidth: 1,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      sma50Series.setData(sma50Data as { time: string; value: number }[]);
    }

    // Fit content
    chart.timeScale().fitContent();

    // Resize observer
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        chart.applyOptions({ width });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data, chartType, showSMA20, showSMA50, showBollinger, showVolume, height, sma20Data, sma50Data, bollingerBands]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: height,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    />
  );
}
