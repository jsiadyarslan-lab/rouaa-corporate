'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

interface CandlestickChartProps {
  data: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  symbol: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { date: string; open: number; high: number; low: number; close: number; volume: number } }>;
}

function CandleTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  const isUp = d.close >= d.open;

  return (
    <div
      className="rounded-lg px-3 py-2 text-[12px] border"
      style={{
        background: 'var(--bg3)',
        borderColor: 'var(--border2)',
        boxShadow: 'var(--glow)',
        direction: 'rtl',
      }}
    >
      <div className="font-bold mb-1" style={{ color: 'var(--text)' }}>
        {d.date}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span style={{ color: 'var(--text3)' }}>افتتاح</span>
        <span className="font-mono-price text-left" style={{ color: 'var(--text)' }}>
          {d.open.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        <span style={{ color: 'var(--text3)' }}>أعلى</span>
        <span className="font-mono-price text-left" style={{ color: 'var(--bull)' }}>
          {d.high.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        <span style={{ color: 'var(--text3)' }}>أدنى</span>
        <span className="font-mono-price text-left" style={{ color: 'var(--bear)' }}>
          {d.low.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        <span style={{ color: 'var(--text3)' }}>إغلاق</span>
        <span
          className="font-mono-price text-left font-bold"
          style={{ color: isUp ? 'var(--bull)' : 'var(--bear)' }}
        >
          {d.close.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        <span style={{ color: 'var(--text3)' }}>الحجم</span>
        <span className="font-mono-price text-left" style={{ color: 'var(--text2)' }}>
          {d.volume.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function CandlestickChart({ data, symbol }: CandlestickChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(d => {
      const isUp = d.close >= d.open;
      // For the bar: bottom = min(open,close), top = max(open,close)
      const bodyBottom = Math.min(d.open, d.close);
      const bodyTop = Math.max(d.open, d.close);
      const bodyHeight = Math.max(bodyTop - bodyBottom, 0.001); // avoid 0 height

      return {
        date: d.date,
        // Body bar
        bodyBottom,
        bodyHeight,
        // Wick line
        wickLow: d.low,
        wickHigh: d.high,
        // For styling
        isUp,
        // Volume
        volume: d.volume,
        // Original data for tooltip
        open: d.open,
        close: d.close,
        high: d.high,
        low: d.low,
      };
    });
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          height: 400,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
        }}
      >
        <span className="text-[12px]" style={{ color: 'var(--text3)' }}>
          لا توجد بيانات كافية
        </span>
      </div>
    );
  }

  const minPrice = Math.min(...data.map(d => d.low));
  const maxPrice = Math.max(...data.map(d => d.high));
  const padding = (maxPrice - minPrice) * 0.05;
  const domain = [minPrice - padding, maxPrice + padding];

  const maxVolume = Math.max(...data.map(d => d.volume));
  const volumeDomain = [0, maxVolume * 4]; // Scale volume to 25% height

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>
            رسم شموعي
          </div>
          <div className="font-mono-price text-[11px]" style={{ color: 'var(--text3)' }}>
            {symbol}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--bull)' }} />
            <span className="text-[10px]" style={{ color: 'var(--text3)' }}>صعود</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--bear)' }} />
            <span className="text-[10px]" style={{ color: 'var(--text3)' }}>هبوط</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: 'relative' }}>
        {/* Roua Watermark */}
        <div
          style={{
            position: 'absolute',
            top: '45%',
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
          رؤى
        </div>
        <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border3)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text3)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            yAxisId="price"
            domain={domain}
            tick={{ fill: 'var(--text3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={65}
            tickFormatter={v =>
              v.toLocaleString(undefined, { maximumFractionDigits: 0 })
            }
          />
          <YAxis
            yAxisId="volume"
            domain={volumeDomain}
            hide
          />
          <Tooltip
            content={<CandleTooltip />}
            cursor={{ stroke: 'var(--border2)', strokeDasharray: '3 3' }}
          />

          {/* Volume bars at bottom */}
          <Bar
            yAxisId="volume"
            dataKey="volume"
            opacity={0.3}
            barSize={8}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`vol-${index}`}
                fill={entry.isUp ? 'var(--bull)' : 'var(--bear)'}
              />
            ))}
          </Bar>

          {/* Upper wicks (high to max(open,close)) */}
          <Line
            yAxisId="price"
            dataKey="wickHigh"
            stroke="transparent"
            dot={false}
            activeDot={false}
          />

          {/* Candle bodies */}
          <Bar
            yAxisId="price"
            dataKey="bodyHeight"
            barSize={8}
            radius={[1, 1, 1, 1]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`body-${index}`}
                fill={entry.isUp ? 'var(--bull)' : 'var(--bear)'}
                stroke={entry.isUp ? 'var(--bull)' : 'var(--bear)'}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
