'use client';

import { useState, useMemo } from 'react';
import { calculateEconomicImpact, DEFAULT_PORTFOLIO, GEO_ECONOMIC_SCENARIOS, type EconomicImpactResult, type PortfolioHolding } from '@/lib/geopolitical/economic-impact-model';
import { t } from '@/lib/geopolitical/i18n';

interface EconomicImpactPanelProps {
  locale: string;
}

const ASSET_LABELS: Record<string, Record<string, string>> = {
  OIL: { ar: 'النفط', en: 'Oil', fr: 'Pétrole', tr: 'Petrol', es: 'Petróleo' },
  GOLD: { ar: 'الذهب', en: 'Gold', fr: 'Or', tr: 'Altın', es: 'Oro' },
  USD: { ar: 'الدولار', en: 'USD', fr: 'USD', tr: 'USD', es: 'USD' },
  TASI: { ar: 'تاسي', en: 'TASI', fr: 'TASI', tr: 'TASI', es: 'TASI' },
  SP500: { ar: 'S&P 500', en: 'S&P 500', fr: 'S&P 500', tr: 'S&P 500', es: 'S&P 500' },
  BONDS: { ar: 'السندات', en: 'Bonds', fr: 'Obligations', tr: 'Tahviller', es: 'Bonos' },
};

export default function EconomicImpactPanel({ locale }: EconomicImpactPanelProps) {
  const isRtl = locale === 'ar';
  const [selectedScenario, setSelectedScenario] = useState('hormuz_closure');

  const result: EconomicImpactResult = useMemo(() => calculateEconomicImpact(DEFAULT_PORTFOLIO), []);

  const currentScenario = result.scenarios.find(s => s.scenarioId === selectedScenario) || result.scenarios[0];

  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-head)' }}>
        {t('economic.title', locale)}
      </h3>
      <p className="text-xs mb-4" style={{ color: 'var(--text3)' }}>
        {t('economic.subtitle', locale)}
      </p>

      {/* Scenario Selector */}
      <div className="mb-4">
        <select
          value={selectedScenario}
          onChange={(e) => setSelectedScenario(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--bg4)', borderColor: 'var(--rim)', color: 'var(--text)' }}
        >
          {GEO_ECONOMIC_SCENARIOS.map(s => (
            <option key={s.id} value={s.id}>
              {locale === 'ar' ? s.nameAr : s.nameEn}
            </option>
          ))}
        </select>
      </div>

      {/* Portfolio Impact Summary */}
      {currentScenario && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border p-3" style={{ background: 'var(--bg4)', borderColor: 'var(--rim)' }}>
            <p className="text-[10px]" style={{ color: 'var(--text3)' }}>
              {t('economic.expectedLoss', locale)}
            </p>
            <p className="text-lg font-bold tabular-nums" style={{ color: currentScenario.portfolioImpact.expectedLoss < 0 ? 'var(--bear)' : 'var(--bull)' }}>
              {currentScenario.portfolioImpact.expectedLoss > 0 ? '+' : ''}{currentScenario.portfolioImpact.expectedLoss.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border p-3" style={{ background: 'var(--bg4)', borderColor: 'var(--rim)' }}>
            <p className="text-[10px]" style={{ color: 'var(--text3)' }}>
              {t('economic.var95', locale)}
            </p>
            <p className="text-lg font-bold tabular-nums" style={{ color: '#EF4444' }}>
              -{currentScenario.portfolioImpact.var95.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border p-3" style={{ background: 'var(--bg4)', borderColor: 'var(--rim)' }}>
            <p className="text-[10px]" style={{ color: 'var(--text3)' }}>
              {t('economic.cvar95', locale)}
            </p>
            <p className="text-lg font-bold tabular-nums" style={{ color: '#7F1D1D' }}>
              -{currentScenario.portfolioImpact.cvar95.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border p-3" style={{ background: 'var(--bg4)', borderColor: 'var(--rim)' }}>
            <p className="text-[10px]" style={{ color: 'var(--text3)' }}>
              {t('economic.scenarioProb', locale)}
            </p>
            <p className="text-lg font-bold tabular-nums" style={{ color: '#F59E0B' }}>
              {(currentScenario.probability * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      )}

      {/* Asset Impact Breakdown */}
      {currentScenario && (
        <div className="mb-6">
          <h4 className="text-xs font-medium mb-3" style={{ color: 'var(--text3)' }}>
            {t('economic.assetImpacts', locale)}
          </h4>
          <div className="space-y-2">
            {Array.from(currentScenario.assetImpacts.entries()).map(([symbol, impact]) => (
              <div key={symbol} className="flex items-center justify-between rounded-lg p-2" style={{ background: 'var(--bg4)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                    {ASSET_LABELS[symbol]?.[locale] || symbol}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs tabular-nums" style={{ color: impact.expectedChange >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                    {impact.expectedChange >= 0 ? '+' : ''}{impact.expectedChange.toFixed(1)}%
                  </span>
                  <span className="text-[10px] tabular-nums" style={{ color: 'var(--text3)' }}>
                    {t('economic.varLabel', locale)} -{impact.var95.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diversification Score */}
      <div className="mb-6">
        <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>
          {t('economic.diversificationScore', locale)}
        </h4>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg5)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${result.diversificationScore}%`,
                background: result.diversificationScore > 60 ? '#22C55E' : result.diversificationScore > 40 ? '#EAB308' : '#EF4444',
              }}
            />
          </div>
          <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text)' }}>
            {result.diversificationScore}/100
          </span>
        </div>
      </div>

      {/* Stress Tests */}
      <div>
        <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>
          {t('economic.stressTests', locale)}
        </h4>
        <div className="space-y-2">
          {result.stressTestResults.map((test) => (
            <div key={test.testName} className="rounded-lg p-3" style={{ background: 'var(--bg4)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                  {locale === 'ar' ? test.testNameAr : test.testName}
                </span>
                <span className="text-sm font-bold tabular-nums" style={{ color: test.portfolioImpact < 0 ? 'var(--bear)' : 'var(--bull)' }}>
                  {test.portfolioImpact > 0 ? '+' : ''}{test.portfolioImpact.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--text3)' }}>
                <span>{t('economic.worstAsset', locale)}: {test.worstAsset}</span>
                <span>{t('economic.recovery', locale)}: {test.recoveryTimeMonths} {t('economic.months', locale)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trade Route Impact */}
      {currentScenario && (
        <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
          <p className="text-xs font-medium" style={{ color: '#EAB308' }}>
            {t('economic.supplyChainImpact', locale)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>
            {`${t('economic.tradeAtRisk', locale)}: ${currentScenario.tradeRouteImpact.tradeAtRiskPct}% | ${t('economic.estimatedCost', locale)}: ${currentScenario.tradeRouteImpact.estimatedSupplyChainCost}% ${t('economic.ofGdp', locale)}`}
          </p>
        </div>
      )}
    </div>
  );
}
