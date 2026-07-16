'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getRiskColor, getRiskLabel } from '@/lib/geopolitical/risk-thresholds';
import { t, timeAgoLocalized } from '@/lib/geopolitical/i18n';

const ScenarioEngine = dynamic(() => import('@/components/geopolitical/ScenarioEngine'), {
  loading: () => <div style={{ height: '300px' }} className="animate-pulse rounded-lg" />,
});

const GeopoliticalRiskBadge = dynamic(() => import('@/components/geopolitical/GeopoliticalRiskBadge'), {
  loading: () => <span className="inline-block w-16 h-5 animate-pulse rounded-full" />,
});

// ─── Types ──────────────────────────────────────────────────────

interface ScenarioRisk {
  id: string;
  title: string;
  slug: string;
  summary: string;
  riskCategory: string;
  riskLevel: string;
  riskScore: number;
  scenarios: any;
  affectedAssets: any[];
  affectedRegions: string[];
  imageUrl: string | null;
  publishedAt: string | null;
}

interface Props {
  risks: ScenarioRisk[];
  locale?: string;
}

// ─── Constants ──────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  conflict: '⚔️', trade: '📦', energy: '⚡',
  political: '🏛️', cyber: '🖥️', sanctions: '🚫', climate: '🌊',
};

const SCENARIO_COLORS: Record<string, string> = {
  base: 'var(--bull)',
  adverse: 'var(--gold)',
  severe: 'var(--bear)',
};

const SCENARIO_KEY_MAP: Record<string, string> = {
  base: 'scenarios.baseCase',
  adverse: 'scenarios.adverseCase',
  severe: 'scenarios.severeCase',
};

// ─── Main Component ─────────────────────────────────────────────

export default function ScenariosPageClient({ risks, locale = 'ar' }: Props) {
  const [selectedRisk, setSelectedRisk] = useState<ScenarioRisk | null>(risks[0] || null);
  const localePrefix = locale === 'ar' ? '' : `/${locale}`;

  const getCategoryLabel = (cat: string) => t(`category.${cat}`, locale);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen pb-mobile-safe" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* ═══ HERO HEADER ═══ */}
      <div className="relative" style={{ padding: '32px 0 0' }}>
        <div className="max-w-[1280px] mx-auto" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>
          <div className="glass-card" style={{
            padding: '28px 32px',
            background: 'linear-gradient(135deg, rgba(255,184,0,.06), rgba(0,229,255,.03))',
          }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,184,0,.12)', border: '1px solid rgba(255,184,0,.2)',
                    fontSize: '22px',
                  }}>
                    🎯
                  </div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-head)' }}>
                    {t('scenarios.title', locale)}
                  </h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--text2)' }}>
                  {t('scenarios.description', locale)}
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

        {/* ScenarioEngine Component */}
        {selectedRisk && (
          <div className="mb-6">
            <ScenarioEngine locale={locale} />
          </div>
        )}

        {/* Available Scenarios */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-head)' }}>{t('scenarios.available', locale)}</h2>
          </div>

          {risks.length === 0 ? (
            <div className="glass-card flex items-center justify-center" style={{ padding: '60px', minHeight: '200px' }}>
              <div className="text-center">
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text3)' }}>
                  {t('scenarios.noScenarios', locale)}
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--text4)' }}>
                  {t('scenarios.autoGenerated', locale)}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {risks.map((risk) => {
                const riskColor = getRiskColor(risk.riskScore);
                const categoryIcon = CATEGORY_ICONS[risk.riskCategory] || '📌';
                const categoryLabel = getCategoryLabel(risk.riskCategory);
                const scenarioKeys = risk.scenarios ? Object.keys(risk.scenarios) : [];

                return (
                  <button
                    key={risk.id}
                    onClick={() => setSelectedRisk(risk)}
                    className="glass-card text-right transition-all duration-300 hover:-translate-y-1 w-full"
                    style={{
                      padding: '20px',
                      borderInlineStart: `3px solid ${selectedRisk?.id === risk.id ? 'var(--gold)' : riskColor}`,
                      background: selectedRisk?.id === risk.id
                        ? 'linear-gradient(135deg, rgba(255,184,0,.06), var(--surface-1))'
                        : 'var(--surface-1)',
                      border: selectedRisk?.id === risk.id ? '1px solid rgba(255,184,0,.2)' : '1px solid var(--rim)',
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
                    </div>

                    {/* Title */}
                    <h4 className="text-[14px] font-bold mb-2 line-clamp-2" style={{ color: 'var(--text)' }}>
                      {risk.title}
                    </h4>

                    {/* Scenario types */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {scenarioKeys.map((key) => (
                        <span key={key} className="text-[8px] px-2 py-0.5 rounded-full" style={{
                          background: `${SCENARIO_COLORS[key] || 'var(--text4)'}15`,
                          color: SCENARIO_COLORS[key] || 'var(--text4)',
                        }}>
                          {SCENARIO_KEY_MAP[key] ? t(SCENARIO_KEY_MAP[key], locale) : key}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Educational Section */}
        <div className="glass-card" style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(139,92,246,.04), rgba(0,229,255,.02))',
        }}>
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>{t('scenarios.aboutMethodology', locale)}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: '18px' }}>📊</span>
                <h4 className="text-xs font-bold" style={{ color: 'var(--bull)' }}>{t('scenarios.baseCase', locale)}</h4>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text3)' }}>
                {t('scenarios.baseDesc', locale)}
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <h4 className="text-xs font-bold" style={{ color: 'var(--gold)' }}>{t('scenarios.adverseCase', locale)}</h4>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text3)' }}>
                {t('scenarios.adverseDesc', locale)}
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: '18px' }}>🔴</span>
                <h4 className="text-xs font-bold" style={{ color: 'var(--bear)' }}>{t('scenarios.severeCase', locale)}</h4>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text3)' }}>
                {t('scenarios.severeDesc', locale)}
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(255,184,0,.04)', border: '1px solid rgba(255,184,0,.1)' }}>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text3)' }}>
              💡 {t('scenarios.methodologyNote', locale)}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
