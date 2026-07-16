'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getRiskColor, getRiskLabel } from '@/lib/geopolitical/risk-thresholds';
import { t, timeAgoLocalized } from '@/lib/geopolitical/i18n';
import GeopoliticalRiskBadge from '@/components/geopolitical/GeopoliticalRiskBadge';

// ─── Types ──────────────────────────────────────────────────────

interface GeoRisk {
  id: string;
  title: string;
  slug: string;
  summary: string;
  riskCategory: string;
  riskLevel: string;
  riskScore: number;
  affectedRegions: string[];
  affectedCountries: any[];
  affectedAssets: any[];
  scenarios: any;
  imageUrl: string | null;
  publishedAt: string | null;
}

interface Props {
  risks: GeoRisk[];
  locale?: string;
}

// ─── Constants ──────────────────────────────────────────────────

const CATEGORY_FILTERS = [
  { id: 'all', icon: '📋' },
  { id: 'conflict', icon: '⚔️' },
  { id: 'trade', icon: '📦' },
  { id: 'energy', icon: '⚡' },
  { id: 'political', icon: '🏛️' },
  { id: 'cyber', icon: '🖥️' },
  { id: 'sanctions', icon: '🚫' },
  { id: 'climate', icon: '🌊' },
] as const;

const RISK_LEVEL_FILTERS = [
  { id: 'all' },
  { id: 'low' },
  { id: 'moderate' },
  { id: 'elevated' },
  { id: 'high' },
  { id: 'severe' },
] as const;

// ─── Main Component ─────────────────────────────────────────────

export default function GeopoliticalReportsClient({ risks, locale = 'ar' }: Props) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const localePrefix = locale === 'ar' ? '' : `/${locale}`;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filter reports
  const filteredRisks = useMemo(() => {
    return risks.filter(r => {
      if (categoryFilter !== 'all' && r.riskCategory !== categoryFilter) return false;
      if (riskLevelFilter !== 'all' && r.riskLevel !== riskLevelFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesSummary = (r.summary || '').toLowerCase().includes(q);
        const matchesRegions = (r.affectedRegions || []).some((reg: string) => reg.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesRegions) return false;
      }
      return true;
    });
  }, [risks, categoryFilter, riskLevelFilter, searchQuery]);

  return (
    <main className="min-h-screen pb-mobile-safe" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* ═══ HERO HEADER ═══ */}
      <div className="relative" style={{ padding: '32px 0 0' }}>
        <div className="max-w-[1280px] mx-auto" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>
          <div className="glass-card" style={{
            padding: '28px 32px',
            background: 'linear-gradient(135deg, rgba(239,83,80,.05), rgba(0,229,255,.03))',
          }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(239,83,80,.1)', border: '1px solid rgba(239,83,80,.2)',
                    fontSize: '22px',
                  }}>
                    📊
                  </div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-head)' }}>
                    {t('reports.title', locale)}
                  </h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--text2)' }}>
                  {t('reports.description', locale)}
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

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text4)" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('reports.searchPlaceholder', locale)}
              className="w-full text-xs py-2.5 pr-9 pl-4 rounded-lg outline-none transition-all"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--rim)',
                color: 'var(--text)',
              }}
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', marginLeft: 4 }}>{t('reports.category', locale)}</span>
          {CATEGORY_FILTERS.map(filter => {
            const isActive = categoryFilter === filter.id;
            const count = filter.id === 'all'
              ? risks.length
              : risks.filter(r => r.riskCategory === filter.id).length;
            const filterLabel = filter.id === 'all' ? t('category.all', locale) : t(`category.${filter.id}`, locale);
            return (
              <button
                key={filter.id}
                onClick={() => setCategoryFilter(filter.id)}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: isActive ? 'rgba(239,83,80,.1)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(239,83,80,.2)' : 'var(--rim)'}`,
                  color: isActive ? 'var(--bear)' : 'var(--text3)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span>{filter.icon}</span>
                {filterLabel}
                <span style={{
                  fontSize: '9px', fontWeight: 700,
                  background: isActive ? 'rgba(239,83,80,.1)' : 'var(--surface-2)',
                  color: isActive ? 'var(--bear)' : 'var(--text4)',
                  padding: '1px 5px', borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Risk Level Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', marginLeft: 4 }}>{t('reports.level', locale)}</span>
          {RISK_LEVEL_FILTERS.map(filter => {
            const isActive = riskLevelFilter === filter.id;
            const count = filter.id === 'all'
              ? risks.length
              : risks.filter(r => r.riskLevel === filter.id).length;
            const filterLabel = filter.id === 'all' ? t('risk.all', locale) : t(`risk.${filter.id}`, locale);
            return (
              <button
                key={filter.id}
                onClick={() => setRiskLevelFilter(filter.id)}
                className="text-[10px] px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: isActive ? 'var(--cyan2)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(0,229,255,.2)' : 'var(--rim)'}`,
                  color: isActive ? 'var(--cyan)' : 'var(--text3)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {filterLabel}
                <span className="mr-1" style={{
                  fontSize: '9px', fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                }}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Results count */}
        <div className="mb-4">
          <span className="text-[11px]" style={{ color: 'var(--text4)' }}>
            {t('reports.showing', locale)} {filteredRisks.length} {t('reports.of', locale)} {risks.length} {t('reports.report', locale)}
          </span>
        </div>

        {/* Reports Grid */}
        {filteredRisks.length === 0 ? (
          <div className="glass-card flex items-center justify-center" style={{ padding: '60px', minHeight: '200px' }}>
            <div className="text-center">
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text3)' }}>
                {t('reports.noResults', locale)}
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text4)' }}>
                {t('reports.tryFilters', locale)}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRisks.map((risk) => {
              const riskColor = getRiskColor(risk.riskScore);
              const categoryFilterItem = CATEGORY_FILTERS.find(c => c.id === risk.riskCategory);
              const categoryIcon = categoryFilterItem?.icon || '📌';
              const categoryLabel = t(`category.${risk.riskCategory}`, locale);

              return (
                <Link
                  key={risk.id}
                  href={`${localePrefix}/geopolitical-risks/${risk.slug}`}
                  className="glass-card group transition-all duration-300 hover:-translate-y-1"
                  style={{
                    padding: '20px',
                    borderInlineStart: `3px solid ${riskColor}`,
                    background: `linear-gradient(135deg, ${riskColor}08, var(--surface-1))`,
                    textDecoration: 'none',
                  }}
                >
                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <GeopoliticalRiskBadge score={risk.riskScore} level={risk.riskLevel} locale={locale} />
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
                      background: 'var(--cyan2)', color: 'var(--cyan)',
                      border: '1px solid rgba(0,229,255,.12)',
                    }}>
                      {categoryIcon} {categoryLabel}
                    </span>
                    {risk.scenarios && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
                        background: 'var(--gold2)', color: 'var(--gold)',
                        border: '1px solid rgba(255,184,0,.15)',
                      }}>
                        {t('dashboard.scenariosTag', locale)}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-[15px] font-bold mb-2 line-clamp-2 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)' }}>
                    {risk.title}
                  </h4>

                  {/* Summary */}
                  {risk.summary && (
                    <p className="text-[12px] line-clamp-2 mb-3" style={{ color: 'var(--text3)' }}>
                      {risk.summary}
                    </p>
                  )}

                  {/* Affected Assets Tags */}
                  {risk.affectedAssets.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      {risk.affectedAssets.slice(0, 3).map((asset: any, idx: number) => {
                        const direction = asset.direction || 'neutral';
                        const assetColor = direction === 'bullish' ? 'var(--bull)' : direction === 'bearish' ? 'var(--bear)' : 'var(--gold)';
                        return (
                          <span key={idx} className="text-[8px] px-1.5 py-0.5 rounded" style={{
                            background: `${assetColor}10`, color: assetColor,
                          }}>
                            {asset.symbol || asset.name}
                          </span>
                        );
                      })}
                      {risk.affectedAssets.length > 3 && (
                        <span className="text-[8px]" style={{ color: 'var(--text4)' }}>
                          +{risk.affectedAssets.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Regions */}
                  {risk.affectedRegions.length > 0 && (
                    <div className="flex items-center gap-1 mb-3 flex-wrap">
                      {risk.affectedRegions.slice(0, 2).map((region: string, idx: number) => (
                        <span key={idx} className="text-[8px] px-1.5 py-0.5 rounded" style={{
                          background: 'var(--purple2)', color: 'var(--purple)',
                        }}>
                          {region}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Score & Date */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <div style={{
                        width: '40px', height: '4px', borderRadius: '2px',
                        background: 'var(--surface-2)', overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${risk.riskScore}%`, height: '100%',
                          borderRadius: '2px', background: riskColor,
                        }} />
                      </div>
                      <span style={{
                        fontSize: '10px', fontFamily: 'var(--font-mono)',
                        fontWeight: 700, color: riskColor,
                      }}>
                        {risk.riskScore}
                      </span>
                    </div>
                    {risk.publishedAt && (
                      <span style={{ fontSize: '10px', color: 'var(--text4)' }}>
                        {timeAgoLocalized(risk.publishedAt, locale)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
