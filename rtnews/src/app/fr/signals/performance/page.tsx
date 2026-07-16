'use client';

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

// ─── Labels en français ──────────────────────────────

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  crypto: { label: 'Crypto', color: 'var(--purple)', bg: 'var(--purple2)', icon: '₿' },
  forex: { label: 'Forex', color: '#3BA7F0', bg: 'rgba(59,167,240,0.08)', icon: '💱' },
  commodities: { label: 'Matières premières', color: 'var(--gold)', bg: 'var(--gold2)', icon: '🥇' },
  stocks: { label: 'Actions', color: '#5B8DEF', bg: 'rgba(91,141,239,0.08)', icon: '📈' },
  indices: { label: 'Indices', color: 'var(--bull)', bg: 'var(--bull2)', icon: '📊' },
};

const ACTION_LABELS: Record<string, string> = {
  BUY: 'Achat',
  SELL: 'Vente',
  WAIT: 'Surveiller',
};

// ─── Icônes SVG ──────────────────────────────────────

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

// ─── Cercle de taux de réussite ───────────────────────────

function WinRateCircle({ winRate, wonSignals, lostSignals }: { winRate: number; wonSignals: number; lostSignals: number }) {
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (winRate / 100) * circumference;
  const isPositive = winRate >= 50;

  return (
    <div className="glass-card p-6 flex flex-col items-center">
      <div className="relative" style={{ width: 160, height: 160 }}>
        <svg viewBox="0 0 140 140" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
          {/* Cercle de fond */}
          <circle
            cx="70" cy="70" r="60"
            fill="none"
            stroke="var(--bg4)"
            strokeWidth="10"
          />
          {/* Cercle de progression */}
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
        {/* Texte central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-price text-3xl font-bold" style={{ color: isPositive ? 'var(--bull)' : 'var(--bear)' }}>
            {winRate.toFixed(1)}%
          </span>
          <span className="text-[11px] font-medium" style={{ color: 'var(--text3)' }}>
            Taux de réussite
          </span>
        </div>
      </div>
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <span className="w-[8px] h-[8px] rounded-full" style={{ background: 'var(--bull)', boxShadow: '0 0 6px rgba(34,197,94,0.4)' }} />
          <span className="text-[12px]" style={{ color: 'var(--text2)' }}>
            Gagnants : <span className="font-mono-price font-bold" style={{ color: 'var(--bull)' }}>{wonSignals}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-[8px] h-[8px] rounded-full" style={{ background: 'var(--bear)', boxShadow: '0 0 6px rgba(239,83,80,0.4)' }} />
          <span className="text-[12px]" style={{ color: 'var(--text2)' }}>
            Perdants : <span className="font-mono-price font-bold" style={{ color: 'var(--bear)' }}>{lostSignals}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────

export default function FrPerformancePageClient() {
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
      // Silencieux
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
    <main className="min-h-screen pb-mobile-safe" dir="ltr" style={{ background: 'var(--ink)' }}>
      <div className="pt-4">

        {/* ── En-tête ── */}
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
                  Performance des Signaux
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="badge-live">
                    <span className="live-dot" />
                    En direct
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/fr/signals"
              className="text-[12px] px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              style={{
                background: 'var(--bg4)',
                color: 'var(--text3)',
                border: '1px solid var(--border)',
              }}
            >
              → Signaux
            </Link>
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text2)' }}>
            Statistiques complètes de performance des signaux de trading — taux de réussite, rendements moyens et analyse par catégorie et action
          </p>
        </div>

        {/* ── État de chargement ── */}
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
            {/* ── Ligne de statistiques principales ── */}
            <div className="max-w-[1200px] mx-auto px-4 mb-5" style={{ paddingInline: 'var(--space-md)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    label: 'Taux de réussite',
                    value: `${perf.winRate.toFixed(1)}%`,
                    color: perf.winRate >= 50 ? 'var(--bull)' : 'var(--bear)',
                    bg: perf.winRate >= 50 ? 'var(--bull2)' : 'var(--bear2)',
                    icon: <TargetIcon size={14} />,
                  },
                  {
                    label: 'Total signaux',
                    value: perf.totalSignals,
                    color: 'var(--cyan)',
                    bg: 'var(--cyan2)',
                    icon: <PerformanceIcon size={14} />,
                  },
                  {
                    label: 'Profit moyen',
                    value: `${perf.avgProfitPercent.toFixed(2)}%`,
                    color: perf.avgProfitPercent >= 0 ? 'var(--bull)' : 'var(--bear)',
                    bg: perf.avgProfitPercent >= 0 ? 'var(--bull2)' : 'var(--bear2)',
                    icon: <TrophyIcon size={14} />,
                  },
                  {
                    label: 'Signaux actifs',
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

            {/* ── Cercle de taux de réussite + Séries ── */}
            <div className="max-w-[1200px] mx-auto px-4 mb-5" style={{ paddingInline: 'var(--space-md)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cercle de taux de réussite */}
                <WinRateCircle
                  winRate={perf.winRate}
                  wonSignals={perf.wonSignals}
                  lostSignals={perf.lostSignals}
                />

                {/* Statistiques supplémentaires */}
                <div className="glass-card p-6">
                  <h3 className="text-[15px] font-bold mb-4" style={{ color: 'var(--text-head)' }}>
                    Statistiques supplémentaires
                  </h3>
                  <div className="space-y-3">
                    {/* Série en cours */}
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-2">
                        <StreakIcon size={14} />
                        <span className="text-[12px]" style={{ color: 'var(--text2)' }}>Série en cours</span>
                      </div>
                      <span
                        className="font-mono-price text-[13px] font-bold px-2 py-0.5 rounded-md"
                        style={{
                          background: perf.currentStreak.type === 'win' ? 'var(--bull2)' : perf.currentStreak.type === 'loss' ? 'var(--bear2)' : 'var(--bg4)',
                          color: perf.currentStreak.type === 'win' ? 'var(--bull)' : perf.currentStreak.type === 'loss' ? 'var(--bear)' : 'var(--text3)',
                        }}
                      >
                        {perf.currentStreak.type === 'win' ? 'Victoire' : perf.currentStreak.type === 'loss' ? 'Défaite' : '—'} × {perf.currentStreak.count}
                      </span>
                    </div>

                    {/* Plus longue série de victoires */}
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                      <span className="text-[12px]" style={{ color: 'var(--text2)' }}>Plus longue série de victoires</span>
                      <span className="font-mono-price text-[13px] font-bold" style={{ color: 'var(--bull)' }}>
                        {perf.longestWinStreak}
                      </span>
                    </div>

                    {/* Plus longue série de défaites */}
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                      <span className="text-[12px]" style={{ color: 'var(--text2)' }}>Plus longue série de défaites</span>
                      <span className="font-mono-price text-[13px] font-bold" style={{ color: 'var(--bear)' }}>
                        {perf.longestLossStreak}
                      </span>
                    </div>

                    {/* Calibrage de confiance */}
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                      <span className="text-[12px]" style={{ color: 'var(--text2)' }}>Taux de réussite haute confiance (≥70%)</span>
                      <span className="font-mono-price text-[13px] font-bold" style={{ color: 'var(--cyan)' }}>
                        {perf.confidenceCalibration.highConfidenceWinRate.toFixed(1)}%
                      </span>
                    </div>

                    {/* Meilleur signal */}
                    {perf.bestSignal && (
                      <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bull2)', border: '1px solid rgba(34,197,94,0.15)' }}>
                        <span className="text-[12px]" style={{ color: 'var(--text2)' }}>Meilleur signal</span>
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

                    {/* Pire signal */}
                    {perf.worstSignal && (
                      <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bear2)', border: '1px solid rgba(239,83,80,0.15)' }}>
                        <span className="text-[12px]" style={{ color: 'var(--text2)' }}>Pire signal</span>
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

            {/* ── Répartition par catégorie ── */}
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
                    Performance par catégorie
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(perf.byCategory).map(([cat, data]) => {
                    const catConfig = CATEGORY_LABELS[cat] || { label: cat, color: 'var(--text3)', bg: 'var(--bg4)', icon: '📊' };
                    return (
                      <div
                        key={cat}
                        className="glass-card rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                        style={{ borderLeft: `4px solid ${catConfig.color}` }}
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
                              {data.total} signaux
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                            <div className="font-mono-price text-[13px] font-bold" style={{ color: data.winRate >= 50 ? 'var(--bull)' : 'var(--bear)' }}>
                              {data.winRate.toFixed(1)}%
                            </div>
                            <div className="text-[9px]" style={{ color: 'var(--text3)' }}>Réussite</div>
                          </div>
                          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                            <div className="font-mono-price text-[13px] font-bold" style={{ color: 'var(--bull)' }}>
                              {data.wins}
                            </div>
                            <div className="text-[9px]" style={{ color: 'var(--text3)' }}>Gagnants</div>
                          </div>
                          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                            <div className="font-mono-price text-[13px] font-bold" style={{ color: 'var(--bear)' }}>
                              {data.losses}
                            </div>
                            <div className="text-[9px]" style={{ color: 'var(--text3)' }}>Perdants</div>
                          </div>
                        </div>
                        {/* Barre de taux de réussite */}
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

            {/* ── Tableau des signaux récents ── */}
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
                    Signaux récents
                  </h2>
                  <span className="font-mono-price text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
                    {recentSignals.length}
                  </span>
                </div>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
                >
                  {/* En-tête du tableau */}
                  <div
                    className="grid grid-cols-6 gap-2 p-3 text-[10px] font-bold"
                    style={{ background: 'var(--bg3)', color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}
                  >
                    <span>Paire</span>
                    <span>Action</span>
                    <span>Statut</span>
                    <span>Résultat</span>
                    <span>Profit %</span>
                    <span>Date</span>
                  </div>
                  {/* Corps du tableau */}
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
                          {/* Paire */}
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

                          {/* Statut */}
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
                            {signal.status === 'ACTIVE' ? 'Actif' :
                             signal.status === 'HIT_TP' ? 'TP atteint' :
                             signal.status === 'HIT_SL' ? 'SL atteint' :
                             signal.status === 'EXPIRED' ? 'Expiré' :
                             signal.status === 'EXECUTED' ? 'Exécuté' :
                             signal.status === 'CANCELLED' ? 'Annulé' : signal.status}
                          </span>

                          {/* Résultat */}
                          <span>
                            {isWin && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--bull2)', color: 'var(--bull)' }}>
                                ✓ Gagnant
                              </span>
                            )}
                            {isLoss && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--bear2)', color: 'var(--bear)' }}>
                                ✗ Perdant
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
                            {new Date(signal.createdAt).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
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
          /* ── État vide ── */
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
                Aucune donnée de performance pour le moment
              </div>
              <div className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
                Les statistiques de performance apparaîtront ici une fois que les signaux seront clôturés et leurs résultats enregistrés
              </div>
              <Link
                href="/fr/signals"
                className="inline-flex items-center gap-2 text-[12px] font-bold px-4 py-2 rounded-lg"
                style={{ background: 'var(--cyan)', color: 'white', boxShadow: '0 2px 8px rgba(0,229,255,0.2)' }}
              >
                ← Retour aux signaux
              </Link>
            </div>
          </div>
        )}

        {/* ── Avertissement ── */}
        <div className="max-w-[1200px] mx-auto px-4 mb-6" style={{ paddingInline: 'var(--space-md)' }}>
          <div
            className="rounded-xl p-4 text-[11px]"
            style={{ background: 'var(--gold2)', border: '1px solid var(--gold)33', color: 'var(--text2)' }}
          >
            <strong style={{ color: 'var(--gold)' }}>Avertissement :</strong> Les signaux fournis sont des recommandations basées sur l'analyse par l'IA et ne constituent pas des conseils financiers.
            Le trading comporte un risque élevé et vous pouvez perdre votre capital. Veuillez effectuer vos propres recherches avant de prendre toute décision d'investissement.
            Les performances passées ne garantissent pas les résultats futurs.
          </div>
        </div>
      </div>
    </main>
  );
}
