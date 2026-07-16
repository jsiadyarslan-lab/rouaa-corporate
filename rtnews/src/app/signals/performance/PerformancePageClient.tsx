'use client';

// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────

interface PerformanceStats {
  totalSignals: number;
  activeSignals: number;
  closedSignals: number;
  wonSignals: number;
  lostSignals: number;
  expiredSignals: number;
  cancelledSignals: number;
  winRate: number;
  avgProfitPips: number;
  avgProfitPercent: number;
  totalProfitPips: number;
  totalProfitPercent: number;
  bestSignal: {
    pair: string;
    action: string;
    profitPercent: number;
    closedAt: string | null;
  } | null;
  worstSignal: {
    pair: string;
    action: string;
    profitPercent: number;
    closedAt: string | null;
  } | null;
  byCategory: Record<string, {
    total: number;
    wins: number;
    losses: number;
    winRate: number;
    avgProfitPips: number;
    avgProfitPercent: number;
  }>;
  bySource: Record<string, {
    total: number;
    wins: number;
    losses: number;
    winRate: number;
    avgProfitPips: number;
    avgProfitPercent: number;
  }>;
  byAction: Record<string, {
    total: number;
    wins: number;
    losses: number;
    winRate: number;
    avgProfitPips: number;
    avgProfitPercent: number;
  }>;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
  longestWinStreak: number;
  longestLossStreak: number;
  confidenceCalibration: { highConfidenceWinRate: number; lowConfidenceWinRate: number };
  period: string;
  generatedAt: string;
}

interface RecentSignal {
  id: string;
  pair: string;
  action: string;
  confidence: number;
  status: string;
  isWin: boolean | null;
  profitPercent: number | null;
  category: string;
  createdAt: string;
  closedAt: string | null;
}

// ─── Category Labels ──────────────────────────────────────

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  crypto: { label: 'العملات الرقمية', color: 'var(--purple)', bg: 'var(--purple2)', icon: '₿' },
  forex: { label: 'الفوركس', color: '#3BA7F0', bg: 'rgba(59,167,240,0.08)', icon: '💱' },
  commodities: { label: 'السلع', color: 'var(--gold)', bg: 'var(--gold2)', icon: '🥇' },
  stocks: { label: 'الأسهم', color: '#5B8DEF', bg: 'rgba(91,141,239,0.08)', icon: '📈' },
  indices: { label: 'المؤشرات', color: 'var(--bull)', bg: 'var(--bull2)', icon: '📊' },
};

const ACTION_LABELS: Record<string, string> = {
  BUY: 'شراء',
  SELL: 'بيع',
  WAIT: 'انتظار',
};

// ─── SVG Icons ──────────────────────────────────────────────

function PerformanceIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h.01" />
      <path d="M7 20v-4" />
      <path d="M12 20v-8" />
      <path d="M17 20V8" />
      <path d="M22 4v16" />
    </svg>
  );
}

function TrophyIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function TargetIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function StreakIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

// ─── Win Rate Circle Component ───────────────────────────

function WinRateCircle({ winRate, wonSignals, lostSignals }: { winRate: number; wonSignals: number; lostSignals: number }) {
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (winRate / 100) * circumference;
  const isPositive = winRate >= 50;

  return (
    <div className="glass-card p-6 flex flex-col items-center">
      <div className="relative" style={{ width: 160, height: 160 }}>
        <svg viewBox="0 0 140 140" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="70" cy="70" r="60"
            fill="none"
            stroke="var(--bg4)"
            strokeWidth="10"
          />
          {/* Progress circle */}
          <circle
            cx="70" cy="70" r="60"
            fill="none"
            stroke={isPositive ? 'var(--bull)' : 'var(--bear)'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 8px ${isPositive ? 'rgba(34,197,94,0.3)' : 'rgba(239,83,80,0.3)'})`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-price text-3xl font-bold" style={{ color: isPositive ? 'var(--bull)' : 'var(--bear)' }}>
            {winRate.toFixed(1)}%
          </span>
          <span className="text-[11px] font-medium" style={{ color: 'var(--text3)' }}>
            نسبة النجاح
          </span>
        </div>
      </div>
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <span className="w-[8px] h-[8px] rounded-full" style={{ background: 'var(--bull)', boxShadow: '0 0 6px rgba(34,197,94,0.4)' }} />
          <span className="text-[12px]" style={{ color: 'var(--text2)' }}>
            رابحة: <span className="font-mono-price font-bold" style={{ color: 'var(--bull)' }}>{wonSignals}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-[8px] h-[8px] rounded-full" style={{ background: 'var(--bear)', boxShadow: '0 0 6px rgba(239,83,80,0.4)' }} />
          <span className="text-[12px]" style={{ color: 'var(--text2)' }}>
            خاسرة: <span className="font-mono-price font-bold" style={{ color: 'var(--bear)' }}>{lostSignals}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export default function PerformancePageClient() {
  const [perf, setPerf] = useState<PerformanceStats | null>(null);
  const [recentSignals, setRecentSignals] = useState<RecentSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [perfRes, recentRes] = await Promise.allSettled([
        fetch('/api/signals/performance?period=all', { cache: 'no-store' }),
        fetch('/api/signals?limit=50', { cache: 'no-store' }),
      ]);

      if (perfRes.status === 'fulfilled' && perfRes.value.ok) {
        const data = await perfRes.value.json();
        setPerf(data);
      }

      if (recentRes.status === 'fulfilled' && recentRes.value.ok) {
        const data = await recentRes.value.json();
        if (data.signals) {
          setRecentSignals(data.signals);
        }
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--ink)' }}>
      <div className="pt-4">

        {/* ── Header ── */}
        <div className="max-w-[1200px] mx-auto px-4 mb-4" style={{ paddingInline: 'var(--space-md)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 42, height: 42,
                  background: 'rgba(0,229,255,0.03)',
                  border: '1px solid rgba(0,229,255,0.06)',
                  color: 'var(--cyan)',
                }}
              >
                <TrophyIcon size={22} />
              </div>
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-head)' }}>
                  أداء الإشارات
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="badge-live">
                    <span className="live-dot" />
                    مباشر
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/signals"
              className="text-[12px] px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              style={{
                background: 'var(--bg4)',
                color: 'var(--text3)',
                border: '1px solid var(--border)',
              }}
            >
              → الإشارات
            </Link>
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text2)' }}>
            إحصائيات شاملة لأداء إشارات التداول — نسبة النجاح، متوسط الأرباح، والتحليل حسب الفئة والاتجاه
          </p>
        </div>

        {/* ── Loading State ── */}
        {loading ? (
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass-card p-4" style={{ height: '80px' }}>
                  <div className="skeleton" style={{ height: '24px', width: '50%', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ height: '10px', width: '70%' }} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {[1, 2].map(i => (
                <div key={i} className="glass-card p-6" style={{ height: '240px' }}>
                  <div className="skeleton" style={{ height: '16px', width: '40%', marginBottom: '16px' }} />
                  <div className="skeleton" style={{ height: '120px', width: '100%' }} />
                </div>
              ))}
            </div>
          </div>
        ) : perf ? (
          <>
            {/* ── Top Stats Row ── */}
            <div className="max-w-[1200px] mx-auto px-4 mb-5" style={{ paddingInline: 'var(--space-md)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    label: 'نسبة النجاح',
                    value: `${perf.winRate.toFixed(1)}%`,
                    color: perf.winRate >= 50 ? 'var(--bull)' : 'var(--bear)',
                    bg: perf.winRate >= 50 ? 'var(--bull2)' : 'var(--bear2)',
                    icon: <TargetIcon size={14} />,
                  },
                  {
                    label: 'إجمالي الإشارات',
                    value: perf.totalSignals,
                    color: 'var(--cyan)',
                    bg: 'var(--cyan2)',
                    icon: <PerformanceIcon size={14} />,
                  },
                  {
                    label: 'متوسط الربح',
                    value: `${perf.avgProfitPercent.toFixed(2)}%`,
                    color: perf.avgProfitPercent >= 0 ? 'var(--bull)' : 'var(--bear)',
                    bg: perf.avgProfitPercent >= 0 ? 'var(--bull2)' : 'var(--bear2)',
                    icon: <TrophyIcon size={14} />,
                  },
                  {
                    label: 'إشارات نشطة',
                    value: perf.activeSignals,
                    color: 'var(--purple)',
                    bg: 'var(--purple2)',
                    icon: <PerformanceIcon size={14} />,
                  },
                ].map((stat) => (
                  <div key={stat.label} className="glass-card p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span style={{ color: stat.color }}>{stat.icon}</span>
                      <span className="font-mono-price text-xl font-bold" style={{ color: stat.color }}>
                        {stat.value}
                      </span>
                    </div>
                    <div className="text-[10px] font-medium" style={{ color: 'var(--text3)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Win Rate Circle + Streaks ── */}
            <div className="max-w-[1200px] mx-auto px-4 mb-5" style={{ paddingInline: 'var(--space-md)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Win Rate Circle */}
                <WinRateCircle
                  winRate={perf.winRate}
                  wonSignals={perf.wonSignals}
                  lostSignals={perf.lostSignals}
                />

                {/* Streaks & Additional Stats */}
                <div className="glass-card p-6">
                  <h3 className="text-[15px] font-bold mb-4" style={{ color: 'var(--text-head)' }}>
                    إحصائيات إضافية
                  </h3>
                  <div className="space-y-3">
                    {/* Current Streak */}
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-2">
                        <StreakIcon size={14} />
                        <span className="text-[12px]" style={{ color: 'var(--text2)' }}>السلسلة الحالية</span>
                      </div>
                      <span
                        className="font-mono-price text-[13px] font-bold px-2 py-0.5 rounded-md"
                        style={{
                          background: perf.currentStreak.type === 'win' ? 'var(--bull2)' : perf.currentStreak.type === 'loss' ? 'var(--bear2)' : 'var(--bg4)',
                          color: perf.currentStreak.type === 'win' ? 'var(--bull)' : perf.currentStreak.type === 'loss' ? 'var(--bear)' : 'var(--text3)',
                        }}
                      >
                        {perf.currentStreak.type === 'win' ? 'فوز' : perf.currentStreak.type === 'loss' ? 'خسارة' : '—'} × {perf.currentStreak.count}
                      </span>
                    </div>

                    {/* Longest Win Streak */}
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                      <span className="text-[12px]" style={{ color: 'var(--text2)' }}>أطول سلسلة فوز</span>
                      <span className="font-mono-price text-[13px] font-bold" style={{ color: 'var(--bull)' }}>
                        {perf.longestWinStreak}
                      </span>
                    </div>

                    {/* Longest Loss Streak */}
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                      <span className="text-[12px]" style={{ color: 'var(--text2)' }}>أطول سلسلة خسارة</span>
                      <span className="font-mono-price text-[13px] font-bold" style={{ color: 'var(--bear)' }}>
                        {perf.longestLossStreak}
                      </span>
                    </div>

                    {/* Confidence Calibration */}
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                      <span className="text-[12px]" style={{ color: 'var(--text2)' }}>نجاح الثقة العالية (≥70%)</span>
                      <span className="font-mono-price text-[13px] font-bold" style={{ color: 'var(--cyan)' }}>
                        {perf.confidenceCalibration.highConfidenceWinRate.toFixed(1)}%
                      </span>
                    </div>

                    {/* Best Signal */}
                    {perf.bestSignal && (
                      <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bull2)', border: '1px solid rgba(34,197,94,0.15)' }}>
                        <span className="text-[12px]" style={{ color: 'var(--text2)' }}>أفضل إشارة</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-price text-[12px] font-bold" style={{ color: 'var(--text-head)' }}>
                            {perf.bestSignal.pair}
                          </span>
                          <span className="font-mono-price text-[12px] font-bold" style={{ color: 'var(--bull)' }}>
                            +{perf.bestSignal.profitPercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Worst Signal */}
                    {perf.worstSignal && (
                      <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bear2)', border: '1px solid rgba(239,83,80,0.15)' }}>
                        <span className="text-[12px]" style={{ color: 'var(--text2)' }}>أسوأ إشارة</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-price text-[12px] font-bold" style={{ color: 'var(--text-head)' }}>
                            {perf.worstSignal.pair}
                          </span>
                          <span className="font-mono-price text-[12px] font-bold" style={{ color: 'var(--bear)' }}>
                            {perf.worstSignal.profitPercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Category Breakdown ── */}
            {Object.keys(perf.byCategory).length > 0 && (
              <div className="max-w-[1200px] mx-auto px-4 mb-5" style={{ paddingInline: 'var(--space-md)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{ width: 32, height: 32, background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.06)', color: 'var(--purple)' }}
                  >
                    <TargetIcon size={16} />
                  </div>
                  <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-head)' }}>
                    الأداء حسب الفئة
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(perf.byCategory).map(([cat, data]) => {
                    const catConfig = CATEGORY_LABELS[cat] || { label: cat, color: 'var(--text3)', bg: 'var(--bg4)', icon: '📊' };
                    return (
                      <div
                        key={cat}
                        className="glass-card rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                        style={{ borderInlineStart: `4px solid ${catConfig.color}` }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className="flex items-center justify-center rounded-lg text-[14px]"
                            style={{ width: 32, height: 32, background: catConfig.bg, color: catConfig.color }}
                          >
                            {catConfig.icon}
                          </span>
                          <div>
                            <div className="text-[13px] font-bold" style={{ color: 'var(--text-head)' }}>
                              {catConfig.label}
                            </div>
                            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>
                              {data.total} إشارة
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                            <div className="font-mono-price text-[13px] font-bold" style={{ color: data.winRate >= 50 ? 'var(--bull)' : 'var(--bear)' }}>
                              {data.winRate.toFixed(1)}%
                            </div>
                            <div className="text-[9px]" style={{ color: 'var(--text3)' }}>نسبة النجاح</div>
                          </div>
                          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                            <div className="font-mono-price text-[13px] font-bold" style={{ color: 'var(--bull)' }}>
                              {data.wins}
                            </div>
                            <div className="text-[9px]" style={{ color: 'var(--text3)' }}>رابحة</div>
                          </div>
                          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                            <div className="font-mono-price text-[13px] font-bold" style={{ color: 'var(--bear)' }}>
                              {data.losses}
                            </div>
                            <div className="text-[9px]" style={{ color: 'var(--text3)' }}>خاسرة</div>
                          </div>
                        </div>
                        {/* Win Rate Bar */}
                        <div className="mt-3">
                          <div className="confidence-bar">
                            <div
                              className="confidence-fill"
                              style={{
                                width: `${data.winRate}%`,
                                background: data.winRate >= 50
                                  ? 'linear-gradient(90deg, var(--bull), var(--cyan))'
                                  : 'linear-gradient(90deg, var(--bear), var(--gold))',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Recent Signals Table ── */}
            {recentSignals.length > 0 && (
              <div className="max-w-[1200px] mx-auto px-4 mb-5" style={{ paddingInline: 'var(--space-md)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{ width: 32, height: 32, background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.06)', color: 'var(--cyan)' }}
                  >
                    <PerformanceIcon size={16} />
                  </div>
                  <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-head)' }}>
                    الإشارات الأخيرة
                  </h2>
                  <span className="font-mono-price text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
                    {recentSignals.length}
                  </span>
                </div>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
                >
                  {/* Table Header */}
                  <div
                    className="grid grid-cols-6 gap-2 p-3 text-[10px] font-bold"
                    style={{ background: 'var(--bg3)', color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}
                  >
                    <span>الزوج</span>
                    <span>الاتجاه</span>
                    <span>الحالة</span>
                    <span>النتيجة</span>
                    <span>الربح %</span>
                    <span>التاريخ</span>
                  </div>
                  {/* Table Body */}
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {recentSignals.slice(0, 30).map((signal) => {
                      const isWin = signal.isWin === true;
                      const isLoss = signal.isWin === false;
                      const actionLabel = ACTION_LABELS[signal.action] || signal.action;

                      return (
                        <div
                          key={signal.id}
                          className="grid grid-cols-6 gap-2 p-3 items-center transition-all duration-200 hover:bg-[var(--bg4)]"
                          style={{ borderBottom: '1px solid var(--border3)' }}
                        >
                          {/* Pair */}
                          <span className="font-mono-price text-[12px] font-bold truncate" style={{ color: 'var(--text-head)' }}>
                            {signal.pair}
                          </span>

                          {/* Action */}
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block text-center"
                            style={{
                              background: signal.action === 'BUY' ? 'var(--bull2)' : signal.action === 'SELL' ? 'var(--bear2)' : 'var(--gold2)',
                              color: signal.action === 'BUY' ? 'var(--bull)' : signal.action === 'SELL' ? 'var(--bear)' : 'var(--gold)',
                              border: `1px solid ${signal.action === 'BUY' ? 'var(--bull)' : signal.action === 'SELL' ? 'var(--bear)' : 'var(--gold)'}33`,
                            }}
                          >
                            {actionLabel}
                          </span>

                          {/* Status */}
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block text-center"
                            style={{
                              background:
                                signal.status === 'ACTIVE' ? 'var(--bull2)' :
                                signal.status === 'HIT_TP' ? 'var(--bull2)' :
                                signal.status === 'HIT_SL' ? 'var(--bear2)' :
                                signal.status === 'EXPIRED' ? 'var(--bg4)' :
                                signal.status === 'EXECUTED' ? 'var(--cyan2)' :
                                signal.status === 'CANCELLED' ? 'var(--bear2)' : 'var(--bg4)',
                              color:
                                signal.status === 'ACTIVE' ? 'var(--bull)' :
                                signal.status === 'HIT_TP' ? 'var(--bull)' :
                                signal.status === 'HIT_SL' ? 'var(--bear)' :
                                signal.status === 'EXPIRED' ? 'var(--text3)' :
                                signal.status === 'EXECUTED' ? 'var(--cyan)' :
                                signal.status === 'CANCELLED' ? 'var(--bear)' : 'var(--text3)',
                              border: `1px solid ${
                                signal.status === 'ACTIVE' ? 'var(--bull)' :
                                signal.status === 'HIT_TP' ? 'var(--bull)' :
                                signal.status === 'HIT_SL' ? 'var(--bear)' :
                                signal.status === 'EXPIRED' ? 'var(--border)' :
                                signal.status === 'EXECUTED' ? 'var(--cyan)' :
                                signal.status === 'CANCELLED' ? 'var(--bear)' : 'var(--border)'}33`,
                            }}
                          >
                            {signal.status === 'ACTIVE' ? 'نشطة' :
                             signal.status === 'HIT_TP' ? 'حققت الربح' :
                             signal.status === 'HIT_SL' ? 'ضربت الوقف' :
                             signal.status === 'EXPIRED' ? 'منتهية' :
                             signal.status === 'EXECUTED' ? 'منفذة' :
                             signal.status === 'CANCELLED' ? 'ملغاة' : signal.status}
                          </span>

                          {/* Result */}
                          <span>
                            {isWin && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--bull2)', color: 'var(--bull)' }}>
                                ✓ رابحة
                              </span>
                            )}
                            {isLoss && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--bear2)', color: 'var(--bear)' }}>
                                ✗ خاسرة
                              </span>
                            )}
                            {!isWin && !isLoss && (
                              <span className="text-[10px]" style={{ color: 'var(--text4)' }}>—</span>
                            )}
                          </span>

                          {/* Profit % */}
                          <span className="font-mono-price text-[11px] font-bold" style={{ color: signal.profitPercent !== null && signal.profitPercent !== undefined ? (signal.profitPercent >= 0 ? 'var(--bull)' : 'var(--bear)') : 'var(--text4)' }}>
                            {signal.profitPercent !== null && signal.profitPercent !== undefined ? `${signal.profitPercent >= 0 ? '+' : ''}${signal.profitPercent.toFixed(2)}%` : '—'}
                          </span>

                          {/* Date */}
                          <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                            {new Date(signal.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Empty State ── */
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: 'var(--bg2)', border: '1px dashed var(--border)' }}
            >
              <div className="flex items-center justify-center mb-4">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 56, height: 56, background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.06)', color: 'var(--cyan)' }}
                >
                  <TrophyIcon size={28} />
                </div>
              </div>
              <div className="text-[16px] mb-2 font-medium" style={{ color: 'var(--text2)' }}>
                لا توجد بيانات أداء بعد
              </div>
              <div className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
                ستظهر إحصائيات الأداء هنا بمجرد إغلاق الإشارات وتسجيل نتائجها
              </div>
              <Link
                href="/signals"
                className="inline-flex items-center gap-2 text-[12px] font-bold px-4 py-2 rounded-lg"
                style={{ background: 'var(--cyan)', color: 'white', boxShadow: '0 2px 8px rgba(0,229,255,0.2)' }}
              >
                ← العودة للإشارات
              </Link>
            </div>
          </div>
        )}

        {/* ── Disclaimer ── */}
        <div className="max-w-[1200px] mx-auto px-4 mb-6" style={{ paddingInline: 'var(--space-md)' }}>
          <div
            className="rounded-xl p-4 text-[11px]"
            style={{ background: 'var(--gold2)', border: '1px solid var(--gold)33', color: 'var(--text2)' }}
          >
            <strong style={{ color: 'var(--gold)' }}>تنبيه:</strong> الإشارات المقدمة هي توصيات مبنية على تحليل الذكاء الاصطناعي ولا تُعد نصيحة مالية.
            التداول ينطوي على مخاطر عالية وقد تخسر رأس مالك. يُرجى إجراء بحثك الخاص قبل اتخاذ أي قرار استثماري.
            الأداء السابق لا يضمن النتائج المستقبلية.
          </div>
        </div>
      </div>
    </main>
  );
}
