'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getRiskColor } from '@/lib/geopolitical/risk-thresholds';
import { getRouteName, getRouteTypeLabel } from '@/lib/geopolitical/trade-routes-data';
import type { TradeRoute as DataTradeRoute, LocalizedText } from '@/lib/geopolitical/trade-routes-data';
import { t } from '@/lib/geopolitical/i18n';

const TradeRouteMap = dynamic(() => import('@/components/geopolitical/TradeRouteMap'), { ssr: false });

// ─── Types ──────────────────────────────────────────────────────

interface TradeRisk {
  id: string;
  title: string;
  slug: string;
  riskScore: number;
  riskLevel: string;
  tradeRoutes: any[];
  affectedAssets: any[];
}

interface Props {
  risks: TradeRisk[];
  tradeRoutes: any[];
  locale?: string;
}

// ─── Constants ──────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  stable: 'var(--bull)',
  elevated: 'var(--gold)',
  disrupted: 'var(--bear)',
  critical: 'var(--bear)',
};

const STATUS_BG: Record<string, string> = {
  stable: 'var(--bull2)',
  elevated: 'var(--gold2)',
  disrupted: 'var(--bear2)',
  critical: 'var(--bear2)',
};

// ─── Main Component ─────────────────────────────────────────────

export default function TradeRoutesPageClient({ risks, tradeRoutes, locale = 'ar' }: Props) {
  const [mounted, setMounted] = useState(false);
  const localePrefix = locale === 'ar' ? '' : `/${locale}`;

  useEffect(() => {
    setMounted(true);
    window.scrollTo(0, 0);
  }, []);

  // Collect all trade routes from risks
  const allRiskRoutes = risks.flatMap(r => r.tradeRoutes || []);
  const routeStatusMap: Record<string, string> = {};
  for (const route of allRiskRoutes) {
    if (route.id || route.name) {
      routeStatusMap[route.id || route.name] = route.status || 'stable';
    }
  }

  // Statistics
  const totalRoutes = tradeRoutes.length;
  const disruptedRoutes = allRiskRoutes.filter(r => r.status === 'disrupted' || r.status === 'critical').length;
  const elevatedRoutes = allRiskRoutes.filter(r => r.status === 'elevated').length;

  // Oil flow data for Sankey-style bars
  const oilFlows = [
    { id: 'hormuz', pct: 21, color: 'var(--bear)' },
    { id: 'malacca', pct: 16, color: 'var(--gold)' },
    { id: 'suez', pct: 9, color: 'var(--cyan)' },
    { id: 'bab_el_mandeb', pct: 6, color: 'var(--bear)' },
    { id: 'turkish_straits', pct: 5, color: 'var(--bull)' },
    { id: 'other', pct: 43, color: 'var(--text4)' },
  ];

  return (
    <main className="min-h-screen pb-mobile-safe" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* ═══ HERO HEADER ═══ */}
      <div className="relative" style={{ padding: '32px 0 0' }}>
        <div className="max-w-[1280px] mx-auto" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>
          <div className="glass-card" style={{
            padding: '28px 32px',
            background: 'linear-gradient(135deg, rgba(0,229,255,.05), rgba(255,184,0,.03))',
          }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,229,255,.12)', border: '1px solid rgba(0,229,255,.2)',
                    fontSize: '22px',
                  }}>
                    🚢
                  </div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-head)' }}>
                    {t('tradeRoutes.title', locale)}
                  </h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--text2)' }}>
                  {t('tradeRoutes.description', locale)}
                </p>
              </div>
              <Link
                href={`${localePrefix}/geopolitical-risks`}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg transition-all"
                style={{ background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.15)', color: 'var(--cyan)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                {t('dashboard.riskDashboard', locale)}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-[1280px] mx-auto py-6" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>

        {/* Statistics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="glass-card text-center" style={{ padding: '16px' }}>
            <div className="text-xl font-bold" style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
              {totalRoutes}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('tradeRoutes.tradeRoute', locale)}</div>
          </div>
          <div className="glass-card text-center" style={{ padding: '16px' }}>
            <div className="text-xl font-bold" style={{ color: 'var(--bear)', fontFamily: 'var(--font-mono)' }}>
              {disruptedRoutes}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('tradeRoutes.disrupted', locale)}</div>
          </div>
          <div className="glass-card text-center" style={{ padding: '16px' }}>
            <div className="text-xl font-bold" style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
              {elevatedRoutes}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('tradeRoutes.elevatedRisk', locale)}</div>
          </div>
          <div className="glass-card text-center" style={{ padding: '16px' }}>
            <div className="text-xl font-bold" style={{ color: 'var(--bull)', fontFamily: 'var(--font-mono)' }}>
              {totalRoutes - disruptedRoutes - elevatedRoutes}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('tradeRoutes.stable', locale)}</div>
          </div>
        </div>

        {/* Trade Route Map */}
        <div className="glass-card mb-6" style={{ padding: '20px', minHeight: '400px' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>{t('tradeRoutes.tradeMap', locale)}</h3>
          </div>
          {mounted ? (
            <TradeRouteMap routes={tradeRoutes} locale={locale} />
          ) : (
            <div className="flex items-center justify-center" style={{ minHeight: '350px', color: 'var(--text4)' }}>
              {t('dashboard.loadingMap', locale)}
            </div>
          )}
        </div>

        {/* Route Status Cards + Oil Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Route Status Cards */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-head)' }}>{t('tradeRoutes.routeStatus', locale)}</h2>
            </div>

            {tradeRoutes.length === 0 ? (
              <div className="glass-card flex items-center justify-center" style={{ padding: '60px', minHeight: '200px' }}>
                <div className="text-center">
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚢</div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text3)' }}>
                    {t('tradeRoutes.noData', locale)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tradeRoutes.map((route: any, idx: number) => {
                  const status = routeStatusMap[route.id || route.name] || route.status || 'stable';
                  const statusColor = STATUS_COLORS[status] || 'var(--text3)';
                  const statusBg = STATUS_BG[status] || 'var(--surface-2)';
                  const statusLabelKey = `status.${status}` as string;
                  const statusLabel = t(statusLabelKey, locale);
                  const routeName = getRouteName(route.id, locale);

                  return (
                    <div key={idx} className="glass-card" style={{
                      padding: '16px',
                      borderInlineStart: `3px solid ${statusColor}`,
                      background: `linear-gradient(135deg, ${statusColor}06, var(--surface-1))`,
                    }}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                          {routeName}
                        </h4>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
                          background: statusBg, color: statusColor,
                          border: `1px solid ${statusColor}20`,
                        }}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {route.type && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px]" style={{ color: 'var(--text4)' }}>{t('tradeRoutes.type', locale)}</span>
                            <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{getRouteTypeLabel(route.type, locale)}</span>
                          </div>
                        )}
                        {route.dailyVolume && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px]" style={{ color: 'var(--text4)' }}>{t('tradeRoutes.dailyVolume', locale)}</span>
                            <span className="text-[10px] font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                              {typeof route.dailyVolume === 'object' ? (route.dailyVolume as LocalizedText)[locale as keyof LocalizedText] || (route.dailyVolume as LocalizedText).en : route.dailyVolume}
                            </span>
                          </div>
                        )}
                        {route.countries && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px]" style={{ color: 'var(--text4)' }}>{t('tradeRoutes.borderingCountries', locale)}</span>
                            <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                              {Array.isArray(route.countries) ? route.countries.join('، ') : route.countries}
                            </span>
                          </div>
                        )}
                        {route.disruptionRisk && (
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px]" style={{ color: 'var(--text4)' }}>{t('tradeRoutes.disruptionRisk', locale)}</span>
                              <span style={{
                                fontSize: '10px', fontFamily: 'var(--font-mono)',
                                fontWeight: 700, color: statusColor,
                              }}>
                                {route.disruptionRisk}%
                              </span>
                            </div>
                            <div style={{
                              width: '100%', height: '3px', borderRadius: '2px',
                              background: 'var(--surface-2)', overflow: 'hidden',
                            }}>
                              <div style={{ width: `${route.disruptionRisk}%`, height: '100%', borderRadius: '2px', background: statusColor }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Oil Flow Sankey-style */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="1.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>{t('tradeRoutes.oilFlows', locale)}</h2>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <p className="text-[10px] mb-4" style={{ color: 'var(--text4)' }}>
                {t('tradeRoutes.oilFlowsDesc', locale)}
              </p>
              <div className="space-y-3">
                {oilFlows.map((flow, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--text)' }}>
                        {flow.id === 'other' ? t('tradeRoutes.other', locale) : getRouteName(flow.id, locale)}
                      </span>
                      <span style={{
                        fontSize: '11px', fontFamily: 'var(--font-mono)',
                        fontWeight: 700, color: flow.color,
                      }}>
                        {flow.pct}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%', height: '8px', borderRadius: '4px',
                      background: 'var(--surface-2)', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${flow.pct}%`, height: '100%',
                        borderRadius: '4px', background: flow.color,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(239,83,80,.04)', border: '1px solid rgba(239,83,80,.1)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span style={{ fontSize: '12px' }}>⚠️</span>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--bear)' }}>{t('tradeRoutes.disruptionImpact', locale)}</span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text3)' }}>
                  {t('tradeRoutes.disruptionNote', locale)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
