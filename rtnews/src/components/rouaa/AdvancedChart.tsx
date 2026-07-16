'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Load PlatformChart dynamically (it uses canvas, no SSR)
const PlatformChart = dynamic(
  () => import('@/components/rouaa/charts/PlatformChart'),
  {
    ssr: false,
    loading: () => (
      <div
        className="glass-card-elevated p-5"
        style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 'var(--r)' }} />
      </div>
    ),
  }
);

// Fallback chart using recharts (for when trading platform is unavailable)
import { ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

interface ChartData {
  time: string;
  price: number;
  volume: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

interface AdvancedChartProps {
  symbol: string;
  name?: string;
  data?: ChartData[];
  height?: number;
  showVolume?: boolean;
  showReference?: boolean;
}

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

export default function AdvancedChart({ symbol, name, data: propData, height = 500, showVolume = true, showReference = true }: AdvancedChartProps) {
  const [usePlatformChart, setUsePlatformChart] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [dataSource, setDataSource] = useState<'live' | 'demo'>('demo');

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    try {
      // Try the trading platform integration first
      const tpSymbol = normalizeSymbol(symbol);

      const tpRes = await fetch(
        `/api/markets/integration?mode=chart&symbol=${encodeURIComponent(tpSymbol)}&interval=1day&limit=90`,
        { cache: 'no-store' }
      );

      if (tpRes.ok) {
        const tpData = await tpRes.json();
        const candles = tpData.candles || [];

        if (Array.isArray(candles) && candles.length > 0) {
          const historicalData: ChartData[] = candles
            .map((c: any) => {
              const open = typeof c.open === 'number' ? c.open : (Array.isArray(c) ? c[1] : 0);
              const high = typeof c.high === 'number' ? c.high : (Array.isArray(c) ? c[2] : 0);
              const low = typeof c.low === 'number' ? c.low : (Array.isArray(c) ? c[3] : 0);
              const close = typeof c.close === 'number' ? c.close : (Array.isArray(c) ? c[4] : 0);
              const volume = typeof c.volume === 'number' ? c.volume : (Array.isArray(c) ? c[5] : 0);
              const time = c.timestamp || c.time || c.date || '';

              if (close <= 0) return null;

              return {
                time: typeof time === 'string' ? time : String(time),
                price: close,
                volume: volume || 0,
                open, high, low, close,
              };
            })
            .filter((d: ChartData | null): d is ChartData => d !== null && d.price > 0);

          if (historicalData.length > 0) {
            setChartData(historicalData);
            setCurrentPrice(historicalData[historicalData.length - 1]?.price || null);
            if (historicalData.length > 1) {
              const first = historicalData[0].price;
              const last = historicalData[historicalData.length - 1].price;
              setPriceChange(((last - first) / first) * 100);
            }
            setDataSource('live');
            setUsePlatformChart(true);
            return;
          }
        }
      }

      // No real data — show empty
      setChartData([]);
      setPriceChange(null);
      setDataSource('demo');
      setUsePlatformChart(false);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => { fetchChartData(); }, [fetchChartData]);

  const isPositive = priceChange !== null && priceChange >= 0;
  const avgPrice = useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData.reduce((sum, d) => sum + d.price, 0) / chartData.length;
  }, [chartData]);

  // If Platform chart is available and we have live data, use it
  if (usePlatformChart && !loading) {
    return (
      <PlatformChart
        symbol={symbol}
        nameAr={name}
        height={height}
        showVolume={showVolume}
        showToolbar={true}
        defaultInterval="1day"
      />
    );
  }

  // Fallback: recharts-based chart
  return (
    <div className="glass-card-elevated p-5" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono-price text-lg font-bold" style={{ color: 'var(--text)' }}>{symbol}</span>
            {name && <span className="text-[12px]" style={{ color: 'var(--text3)' }}>{name}</span>}
            {dataSource === 'live' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--bull)', border: '1px solid rgba(34,197,94,0.2)' }}>
                مباشر
              </span>
            )}
          </div>
          {currentPrice !== null && (
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono-price text-2xl font-bold" style={{ color: 'var(--text)' }}>${currentPrice.toFixed(2)}</span>
              {priceChange !== null && (
                <span className="text-[13px] font-medium px-2 py-0.5 rounded-full" style={{
                  background: isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(244,63,94,0.12)',
                  color: isPositive ? 'var(--bull)' : 'var(--bear)',
                }}>
                  {isPositive ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height, borderRadius: 'var(--r)' }} />
      ) : chartData.length === 0 ? (
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg4)', borderRadius: 'var(--r)' }}>
          <span style={{ color: 'var(--text3)', fontSize: 14 }}>لا توجد بيانات متاحة</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#f43f5e'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#f43f5e'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="price" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} orientation="left" />
            {showVolume && (
              <YAxis yAxisId="volume" tick={false} axisLine={false} tickLine={false} domain={[0, 'auto']} orientation="right" />
            )}
            <Tooltip
              contentStyle={{ background: '#0c1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', direction: 'rtl' }}
              labelStyle={{ color: 'var(--text3)' }}
              formatter={(value: number, name: string) => [
                name === 'price' ? `$${(value ?? 0).toFixed(2)}` : (value ?? 0).toLocaleString(),
                name === 'price' ? 'السعر' : 'الحجم'
              ]}
            />
            {showReference && avgPrice > 0 && (
              <ReferenceLine yAxisId="price" y={avgPrice} stroke="rgba(255,255,255,0.15)" strokeDasharray="5 5" />
            )}
            <Area yAxisId="price" type="monotone" dataKey="price" stroke={isPositive ? '#22c55e' : '#f43f5e'} strokeWidth={2} fill={`url(#gradient-${symbol})`} />
            {showVolume && (
              <Bar yAxisId="volume" dataKey="volume" fill="rgba(100,116,139,0.2)" radius={[2, 2, 0, 0]} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
