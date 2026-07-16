'use client';

// ─── French Ticker Bar V250 ─────────────────────────────────
// Global markets price ticker: S&P 500, NASDAQ, Gold, Oil, BTC, EUR/USD
// LTR layout with French labels. Same market store as Arabic version.

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMarketStore, useShallow, deduplicatePrices } from '@/stores/market-store';
import type { PriceItem } from '@/stores/market-store';
import MiniSparkline from '@/components/rouaa/charts/MiniSparkline';

type SpeedMode = 'slow' | 'medium' | 'fast';

const SPEED_MAP: Record<SpeedMode, number> = { slow: 140, medium: 80, fast: 40 };
const SPEED_LABELS: Record<SpeedMode, string> = { slow: 'Lent', medium: 'Moy', fast: 'Rapide' };

export default function FrTickerBar({ className = '' }: { className?: string }) {
  const { prices, pricesLoading, fetchPrices } = useMarketStore(
    useShallow((state) => ({
      prices: state.prices,
      pricesLoading: state.pricesLoading,
      fetchPrices: state.fetchPrices,
    }))
  );

  const router = useRouter();
  const [speed, setSpeed] = useState<SpeedMode>('medium');
  const [isPaused, setIsPaused] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [sparklineData, setSparklineData] = useState<Record<string, number[]>>({});
  const speedMenuRef = useRef<HTMLDivElement>(null);

  const fetchSparklines = useCallback(async () => {
    try {
      const res = await fetch('/api/market-indicators', { cache: 'no-store' });
      const data = await res.json();
      if (data.indicators) {
        const map: Record<string, number[]> = {};
        for (const ind of data.indicators) {
          if (ind.history && Array.isArray(ind.history)) {
            map[ind.symbol] = ind.history.slice(-14).map((h: { value: number }) => h.value);
          }
        }
        setSparklineData(map);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (prices.length === 0) fetchPrices();
    fetchSparklines();
    const interval = setInterval(fetchPrices, 3 * 60 * 1000);
    const sparkInterval = setInterval(fetchSparklines, 5 * 60 * 1000);
    return () => { clearInterval(interval); clearInterval(sparkInterval); };
  }, [fetchPrices, fetchSparklines, prices.length]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) setShowSpeedMenu(false);
    };
    if (showSpeedMenu) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showSpeedMenu]);

  const uniquePrices = deduplicatePrices(prices);
  const allItems = [...uniquePrices, ...uniquePrices];

  const handleSymbolClick = (item: PriceItem) => {
    router.push(`/fr/markets?symbol=${item.symbol}`);
  };

  const animationDuration = SPEED_MAP[speed];
  const animationStyle = {
    animationDuration: `${animationDuration}s`,
    animationPlayState: isPaused ? 'paused' : 'running',
  };

  if (!pricesLoading && allItems.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bandeur des prix en direct"
      dir="ltr"
      className={`fixed left-0 right-0 z-[1002] overflow-hidden ${className}`}
      style={{
        top: 0,
        height: '40px',
        background: 'linear-gradient(90deg, var(--bg), var(--bg2), var(--bg))',
        borderBottom: '1px solid rgba(0,229,255,.08)',
      }}
    >
      {/* Live indicator — LTR: left side */}
      <div
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2"
        style={{
          background: 'rgba(0,200,150,0.1)',
          border: '1px solid rgba(0,200,150,0.2)',
          borderRadius: '999px',
          padding: '2px 8px',
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--bull)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span className="live-pulse-dot" />
        <span>EN DIRECT</span>
      </div>

      {/* Speed control — LTR: right side */}
      <div ref={speedMenuRef} className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all"
          style={{
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.15)',
            color: 'var(--cyan)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
          aria-label="Contrôle de vitesse du bandeur"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          {SPEED_LABELS[speed]}
        </button>
        {showSpeedMenu && (
          <div
            className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden z-50"
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '90px' }}
          >
            {(['slow', 'medium', 'fast'] as SpeedMode[]).map((s) => (
              <button
                key={s}
                onClick={() => { setSpeed(s); setShowSpeedMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-[11px] transition-colors"
                style={{
                  color: speed === s ? 'var(--cyan)' : 'var(--text2)',
                  background: speed === s ? 'var(--cyan2)' : 'transparent',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {SPEED_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pause indicator */}
      {isPaused && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-3 py-1 rounded-full text-[10px] font-bold"
          style={{ background: 'rgba(255,184,0,0.15)', border: '1px solid rgba(255,184,0,0.3)', color: 'var(--gold)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          ⏸ En pause
        </div>
      )}

      {/* Fade masks — LTR: fade left edge and right edge */}
      <div className="absolute left-[80px] top-0 bottom-0 w-20 z-[1]" style={{ background: 'linear-gradient(to right, var(--bg), transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-[1]" style={{ background: 'linear-gradient(to left, var(--bg), transparent)' }} />

      {/* Scrolling Track */}
      {pricesLoading ? (
        <div className="h-full flex items-center gap-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="inline-flex items-center gap-2 h-[40px] px-5" style={{ borderLeft: '1px solid rgba(0,229,255,.07)' }}>
              <div className="skeleton" style={{ width: '28px', height: '10px' }} />
              <div className="skeleton" style={{ width: '48px', height: '12px' }} />
              <div className="skeleton" style={{ width: '32px', height: '10px' }} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="ticker-scroll-track h-full items-center"
          style={animationStyle}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {allItems.map((item: PriceItem, i: number) => {
            const changePositive = (item.changePercent ?? 0) >= 0;
            const sparkData = sparklineData[item.symbol];
            return (
              <div
                key={`fr-ticker-${i}`}
                className="inline-flex items-center gap-2 h-[40px] px-4 cursor-pointer transition-colors hover:bg-[rgba(0,229,255,0.04)]"
                style={{ borderLeft: '1px solid rgba(0,229,255,.07)', flexShrink: 0 }}
                onClick={() => handleSymbolClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSymbolClick(item); }}
                aria-label={`${item.displaySymbol} ${(item.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: item.decimals || 2 })} ${changePositive ? 'hausse' : 'baisse'} ${Math.abs(item.changePercent ?? 0).toFixed(2)}%`}
              >
                <span className="font-mono-price text-[11px] font-bold tracking-wide" style={{ color: 'var(--text2)' }}>
                  {item.displaySymbol}
                </span>
                {sparkData && sparkData.length >= 2 && (
                  <MiniSparkline data={sparkData} color={changePositive ? 'var(--bull)' : 'var(--bear)'} width={40} height={16} />
                )}
                <span className="font-mono-price text-[12px] font-bold" style={{ color: 'var(--text)' }} suppressHydrationWarning>
                  {(item.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: item.decimals || 2 })}
                </span>
                <span className="font-mono-price text-[11px] font-semibold" style={{ color: changePositive ? 'var(--bull)' : 'var(--bear)' }}>
                  {changePositive ? '▲' : '▼'} {Math.abs(item.changePercent ?? 0).toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
