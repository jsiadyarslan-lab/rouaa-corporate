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
  SeriesType,
} from 'lightweight-charts';

// ─── Types ────────────────────────────────────────────────────
interface PlatformChartProps {
  symbol: string;
  nameAr?: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
  height?: number;
  showVolume?: boolean;
  showToolbar?: boolean;
  defaultInterval?: string;
  onPriceUpdate?: (price: number, change: number, changePercent: number) => void;
}

type IntervalKey = '5m' | '15m' | '1hour' | '4hour' | '1day' | '1week';

const INTERVAL_LABELS: Record<string, Record<IntervalKey, string>> = {
  ar: { '5m': '5 دقائق', '15m': '15 دقيقة', '1hour': 'ساعة', '4hour': '4 ساعات', '1day': 'يومي', '1week': 'أسبوعي' },
  en: { '5m': '5 Min', '15m': '15 Min', '1hour': '1 Hour', '4hour': '4 Hours', '1day': 'Daily', '1week': 'Weekly' },
  fr: { '5m': '5 Min', '15m': '15 Min', '1hour': '1 Heure', '4hour': '4 Heures', '1day': 'Quotidien', '1week': 'Hebdo' },
  tr: { '5m': '5 Dak', '15m': '15 Dak', '1hour': '1 Saat', '4hour': '4 Saat', '1day': 'Günlük', '1week': 'Haftalık' },
  es: { '5m': '5 Min', '15m': '15 Min', '1hour': '1 Hora', '4hour': '4 Horas', '1day': 'Diario', '1week': 'Semanal' },
};

const INTERVALS: { key: IntervalKey }[] = [
  { key: '5m' }, { key: '15m' }, { key: '1hour' }, { key: '4hour' }, { key: '1day' }, { key: '1week' },
];

// Symbol mapping for trading platform
const TP_SYMBOL_MAP: Record<string, string> = {
  'BTC': 'BTC-USDT', 'ETH': 'ETH-USDT', 'SOL': 'SOL-USDT',
  'XRP': 'XRP-USDT', 'BNB': 'BNB-USDT',
  'XAU': 'XAU-USD', 'XAG': 'XAG-USD', 'CL': 'CL-USD', 'WTI': 'CL-USD',
  'EUR': 'EUR-USD', 'GBP': 'GBP-USD', 'JPY': 'USD-JPY',
  'DXY': 'DXY-USD',
};

function normalizeSymbol(symbol: string): string {
  return TP_SYMBOL_MAP[symbol.toUpperCase()] || symbol;
}

// ─── Chart Theme ──────────────────────────────────────────────
const DARK_THEME = {
  background: '#0a0e1a',
  text: '#94a3b8',
  grid: '#1e293b',
  border: '#334155',
  bullCandle: '#22c55e',
  bearCandle: '#ef4444',
  bullCandleBorder: '#16a34a',
  bearCandleBorder: '#dc2626',
  volumeBull: 'rgba(34, 197, 94, 0.25)',
  volumeBear: 'rgba(239, 68, 68, 0.25)',
  crosshair: '#475569',
  wickUp: '#22c55e',
  wickDown: '#ef4444',
};

const TEXT: Record<string, { loading: string; noData: string; dataWillLoad: string; fallback: string; live: string; local: string; candle: string; autoRefresh: string; platform: string; watermark: string }> = {
  ar: { loading: 'جاري تحميل البيانات...', noData: 'لا توجد بيانات متاحة حالياً', dataWillLoad: 'يتم تحميل البيانات عند توفر المصادر', fallback: 'بيانات محلية', live: 'مباشر', local: 'محلي', candle: 'شمعة', autoRefresh: 'تحديث تلقائي كل 30 ثانية', platform: 'منصة رؤى للتداول', watermark: 'رؤى' },
  en: { loading: 'Loading data...', noData: 'No data currently available', dataWillLoad: 'Data will load when sources become available', fallback: 'Local Data', live: 'Live', local: 'Local', candle: 'candles', autoRefresh: 'Auto-refresh every 30 seconds', platform: 'Rouaa Trading Platform', watermark: 'ROUAA' },
  fr: { loading: 'Chargement des données...', noData: 'Aucune donnée disponible actuellement', dataWillLoad: 'Les données se chargeront lorsque les sources seront disponibles', fallback: 'Données Locales', live: 'En Direct', local: 'Local', candle: 'bougies', autoRefresh: 'Actualisation automatique toutes les 30 secondes', platform: 'Plateforme de Trading Rouaa', watermark: 'ROUAA' },
  tr: { loading: 'Veriler yükleniyor...', noData: 'Şu anda kullanılabilir veri yok', dataWillLoad: 'Kaynaklar kullanılabilir olduğunda veriler yüklenecek', fallback: 'Yerel Veriler', live: 'Canlı', local: 'Yerel', candle: 'mum', autoRefresh: '30 saniyede bir otomatik yenileme', platform: 'Rouaa Trading Platformu', watermark: 'ROUAA' },
  es: { loading: 'Cargando datos...', noData: 'No hay datos disponibles actualmente', dataWillLoad: 'Los datos se cargarán cuando las fuentes estén disponibles', fallback: 'Datos Locales', live: 'En Vivo', local: 'Local', candle: 'velas', autoRefresh: 'Actualización automática cada 30 segundos', platform: 'Plataforma de Trading Rouaa', watermark: 'ROUAA' },
};

export default function PlatformChart({
  symbol,
  nameAr,
  locale = 'ar',
  height = 500,
  showVolume = true,
  showToolbar = true,
  defaultInterval = '1day',
  onPriceUpdate,
}: PlatformChartProps) {
  const t = TEXT[locale] || TEXT.ar;
  const intervalLabels = INTERVAL_LABELS[locale] || INTERVAL_LABELS.ar;
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [interval, setIntervalState] = useState<IntervalKey>(defaultInterval as IntervalKey);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [dataSource, setDataSource] = useState<'live' | 'fallback' | 'empty'>('empty');
  const [dataLabel, setDataLabel] = useState<string>('');
  const [candleCount, setCandleCount] = useState(0);

  // ─── Initialize Chart ─────────────────────────────────────
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height - (showToolbar ? 90 : 0),
      layout: {
        background: { type: ColorType.Solid, color: DARK_THEME.background },
        textColor: DARK_THEME.text,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: DARK_THEME.grid, style: LineStyle.Dotted },
        horzLines: { color: DARK_THEME.grid, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: DARK_THEME.crosshair,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e40af',
        },
        horzLine: {
          color: DARK_THEME.crosshair,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e40af',
        },
      },
      rightPriceScale: {
        borderColor: DARK_THEME.border,
        scaleMargins: showVolume ? { top: 0.1, bottom: 0.25 } : { top: 0.1, bottom: 0.05 },
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

    // Candlestick series — v5 API: chart.addSeries(CandlestickSeries, options)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: DARK_THEME.bullCandle,
      downColor: DARK_THEME.bearCandle,
      borderUpColor: DARK_THEME.bullCandleBorder,
      borderDownColor: DARK_THEME.bearCandleBorder,
      wickUpColor: DARK_THEME.wickUp,
      wickDownColor: DARK_THEME.wickDown,
    });

    // Volume series — v5 API: chart.addSeries(HistogramSeries, options)
    let volumeSeries: ISeriesApi<'Histogram'> | null = null;
    if (showVolume) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
    }

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
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
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [height, showVolume, showToolbar]);

  // ─── Fetch Data ──────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!candleSeriesRef.current) return;

    setLoading(true);
    const tpSymbol = normalizeSymbol(symbol);

    try {
      const res = await fetch(
        `/api/markets/integration?mode=chart&symbol=${encodeURIComponent(tpSymbol)}&interval=${interval}&limit=300`,
        { cache: 'no-store' }
      );

      if (!res.ok) {
        setDataSource('empty');
        setLoading(false);
        return;
      }

      const data = await res.json();
      const candles = data.candles || [];

      if (!Array.isArray(candles) || candles.length === 0) {
        setDataSource('empty');
        setLoading(false);
        return;
      }

      // Transform to lightweight-charts format
      const candleData: CandlestickData[] = [];
      const volumeData: HistogramData[] = [];

      for (const c of candles) {
        const open = typeof c.open === 'number' ? c.open : (Array.isArray(c) ? c[1] : 0);
        const high = typeof c.high === 'number' ? c.high : (Array.isArray(c) ? c[2] : 0);
        const low = typeof c.low === 'number' ? c.low : (Array.isArray(c) ? c[3] : 0);
        const close = typeof c.close === 'number' ? c.close : (Array.isArray(c) ? c[4] : 0);
        const volume = typeof c.volume === 'number' ? c.volume : (Array.isArray(c) ? c[5] : 0);

        if (close <= 0) continue;

        // Parse timestamp
        let time: Time;
        const ts = c.timestamp || c.time || c.date;
        if (typeof ts === 'string') {
          time = ts as Time;
        } else if (typeof ts === 'number') {
          // Unix timestamp
          time = (ts > 1e12 ? Math.floor(ts / 1000) : ts) as Time;
        } else {
          continue;
        }

        candleData.push({ time, open, high, low, close });

        if (showVolume && volume > 0) {
          volumeData.push({
            time,
            value: volume,
            color: close >= open ? DARK_THEME.volumeBull : DARK_THEME.volumeBear,
          });
        }
      }

      // Set data on series
      candleSeriesRef.current.setData(candleData);

      if (volumeSeriesRef.current && volumeData.length > 0) {
        volumeSeriesRef.current.setData(volumeData);
      }

      // Fit content
      chartRef.current?.timeScale().fitContent();

      // Calculate price change
      if (candleData.length > 1) {
        const firstClose = candleData[0].close;
        const lastClose = candleData[candleData.length - 1].close;
        const change = lastClose - firstClose;
        const changePercent = (change / firstClose) * 100;

        setCurrentPrice(lastClose);
        setPriceChange(change);
        setPriceChangePercent(changePercent);
        onPriceUpdate?.(lastClose, change, changePercent);
      } else if (candleData.length === 1) {
        setCurrentPrice(candleData[0].close);
      }

      setCandleCount(candleData.length);
      const src = data.source === 'fallback' ? 'fallback' : 'live';
      setDataSource(src);
      setDataLabel(data.source === 'fallback' ? t.fallback : t.platform);
    } catch (error) {
      console.error('[PlatformChart] Fetch failed:', error);
      setDataSource('empty');
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, showVolume, onPriceUpdate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Auto-refresh (every 30 seconds for live data, 5 min for fallback) ───────
  useEffect(() => {
    if (dataSource === 'empty') return;
    const refreshMs = dataSource === 'live' ? 30000 : 300000; // 30s live, 5min fallback
    const refreshInterval = setInterval(() => {
      fetchData();
    }, refreshMs);
    return () => clearInterval(refreshInterval);
  }, [dataSource, fetchData]);

  const isPositive = priceChangePercent >= 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: DARK_THEME.background,
        border: '1px solid var(--border)',
      }}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div
          className="flex items-center justify-between px-4 py-3 flex-wrap gap-2"
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Symbol & Price */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-price text-base font-bold" style={{ color: '#e2e8f0' }}>
                  {symbol}
                </span>
                {nameAr && (
                  <span className="text-[12px]" style={{ color: '#64748b' }}>{nameAr}</span>
                )}
                {(dataSource === 'live' || dataSource === 'fallback') && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                      background: dataSource === 'live' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: dataSource === 'live' ? '#22c55e' : '#f59e0b',
                      border: `1px solid ${dataSource === 'live' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                    }}
                  >
                    {dataSource === 'live' ? t.live : t.local}
                  </span>
                )}
              </div>
              {currentPrice !== null && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="font-mono-price text-xl font-bold"
                    style={{ color: '#f1f5f9' }}
                    suppressHydrationWarning
                  >
                    ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span
                    className="font-mono-price text-[12px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: isPositive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: isPositive ? '#22c55e' : '#ef4444',
                    }}
                    suppressHydrationWarning
                  >
                    {isPositive ? '▲' : '▼'} {Math.abs(priceChangePercent).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Interval Buttons */}
          <div
            className="flex items-center gap-1"
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              borderRadius: '8px',
              padding: '2px',
            }}
          >
            {INTERVALS.map((intv) => (
              <button
                key={intv.key}
                onClick={() => setIntervalState(intv.key)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
                style={{
                  background: interval === intv.key ? '#3b82f6' : 'transparent',
                  color: interval === intv.key ? 'white' : '#94a3b8',
                }}
              >
                {intervalLabels[intv.key]}
              </button>
            ))}
          </div>
        </div>
      )}

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
            fontSize: '48px',
            fontWeight: 700,
            color: '#e2e8f0',
            letterSpacing: '8px',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {t.watermark}
        </div>
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(10, 14, 26, 0.7)',
              zIndex: 10,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <span className="text-[13px]" style={{ color: '#94a3b8' }}>
                {t.loading}
              </span>
            </div>
          </div>
        )}

        {!loading && dataSource === 'empty' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
            }}
          >
            <div className="text-center">
              <div className="text-[14px] mb-1" style={{ color: '#64748b' }}>
                {t.noData}
              </div>
              <div className="text-[11px]" style={{ color: '#475569' }}>
                {symbol} — {t.dataWillLoad}
              </div>
            </div>
          </div>
        )}

        <div
          ref={chartContainerRef}
          style={{ width: '100%', height: height - (showToolbar ? 90 : 0) }}
        />
      </div>

      {/* Footer */}
      {(dataSource === 'live' || dataSource === 'fallback') && (
        <div
          className="flex items-center justify-between px-4 py-1.5"
          style={{
            background: 'rgba(15, 23, 42, 0.5)',
            borderTop: '1px solid rgba(51, 65, 85, 0.5)',
          }}
        >
          <span className="text-[10px]" style={{ color: '#475569' }}>
            {candleCount} {t.candle} | {t.autoRefresh}
          </span>
          <span className="text-[10px] font-medium" style={{ color: dataSource === 'fallback' ? '#f59e0b' : 'var(--cyan, #00e5ff)' }}>
            {dataLabel || t.platform}
          </span>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
