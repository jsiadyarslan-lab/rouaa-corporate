// ─── Assets Slide V12 — الأصول المتأثرة ──────────────────────
// V12: Added locale prop for English/Arabic UI text translation
// V11: Split gradient DNA (green↔red) + unified tokens + improved treemap

'use client';

import { InfographicSlide, AssetItem, COLOR_MAP, getCategoryColor, DESIGN_TOKENS } from '../types';
import SlideWithImage, { EmptySlideFallback } from './SlideWithImage';
import { InfographicChart, buildSlideChartConfig } from '../InfographicChart';
import * as LucideIcons from 'lucide-react';

// V11: Unified constants
const TEXT_SHADOW_IMG = DESIGN_TOKENS.textShadowOverImage;

interface AssetsSlideProps {
  slide: InfographicSlide;
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
}

// V12: Translation map
const ASSETS_I18N = {
  ar: {
    noAssetData: 'لا توجد بيانات أصول',
    noAssets: 'لا توجد أصول',
    benefiting: 'تستفيد',
    harmed: 'تتضرر',
  },
  en: {
    noAssetData: 'No asset data available',
    noAssets: 'No assets',
    benefiting: 'Benefiting',
    harmed: 'Harmed',
  },
  es: {
    noAssetData: 'No asset data available',
    noAssets: 'No assets',
    benefiting: 'Benefiting',
    harmed: 'Harmed',
  },
  fr: {
    noAssetData: 'No asset data available',
    noAssets: 'No assets',
    benefiting: 'Benefiting',
    harmed: 'Harmed',
  },
  tr: {
    noAssetData: 'No asset data available',
    noAssets: 'No assets',
    benefiting: 'Benefiting',
    harmed: 'Harmed',
  },
};

export default function AssetsSlide({ slide, locale = 'ar' }: AssetsSlideProps) {
  const t = ASSETS_I18N[locale];
  const colorName = (slide as any).content.color || slide.color || '';
  const accentColor = COLOR_MAP[colorName] || slide.accentColor || getCategoryColor(slide.content.tag);
  const benefiting = slide.content.benefiting || [];
  const harmed = slide.content.harmed || [];

  if (benefiting.length === 0 && harmed.length === 0) {
    return <EmptySlideFallback icon={LucideIcons.Wallet} text={t.noAssetData} locale={locale} />;
  }

  return (
    <SlideWithImage slide={slide} fallbackIcon={LucideIcons.Wallet} fallbackText={t.noAssets} slideType="assets" locale={locale}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: accentColor + '18', color: accentColor }}>
          <LucideIcons.Wallet size={22} aria-hidden="true" />
        </div>
        <h2 className="text-[20px] sm:text-[22px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary, textShadow: TEXT_SHADOW_IMG }}>{slide.title}</h2>
      </div>

      <div className="flex-1 space-y-4">
        {/* Benefiting — green zone */}
        {benefiting.length > 0 && (
          <div className="rounded-2xl p-3" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.10)' }}>
            <div className="flex items-center gap-2 mb-2.5">
              <LucideIcons.TrendingUp size={16} style={{ color: DESIGN_TOKENS.success }} aria-hidden="true" />
              <span className="text-[14px] font-bold" style={{ color: DESIGN_TOKENS.success }}>{t.benefiting}</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(16,185,129,0.15)' }} />
            </div>
            <div className="space-y-1.5">
              {benefiting.map((asset: AssetItem, i: number) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.06)', borderInlineStart: `3px solid ${DESIGN_TOKENS.success}` }}>
                  <LucideIcons.ArrowUpRight size={12} style={{ color: DESIGN_TOKENS.success, flexShrink: 0 }} aria-hidden="true" />
                  <span className="text-[13px] font-bold truncate" style={{ color: DESIGN_TOKENS.textPrimary }}>{asset.name}</span>
                  {asset.symbol && <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: DESIGN_TOKENS.success, background: 'rgba(16,185,129,0.10)', flexShrink: 0 }}>{asset.symbol}</span>}
                  {asset.expected_move && <span className="text-[11px] font-bold mr-auto" style={{ color: DESIGN_TOKENS.success, fontFamily: DESIGN_TOKENS.fontData, fontFeatureSettings: DESIGN_TOKENS.fontFeatureSettings, flexShrink: 0 }}>{asset.expected_move}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Harmed — red zone */}
        {harmed.length > 0 && (
          <div className="rounded-2xl p-3" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.10)' }}>
            <div className="flex items-center gap-2 mb-2.5">
              <LucideIcons.TrendingDown size={16} style={{ color: DESIGN_TOKENS.danger }} aria-hidden="true" />
              <span className="text-[14px] font-bold" style={{ color: DESIGN_TOKENS.danger }}>{t.harmed}</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(239,68,68,0.15)' }} />
            </div>
            <div className="space-y-1.5">
              {harmed.map((asset: AssetItem, i: number) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.06)', borderInlineStart: `3px solid ${DESIGN_TOKENS.danger}` }}>
                  <LucideIcons.ArrowDownRight size={12} style={{ color: DESIGN_TOKENS.danger, flexShrink: 0 }} aria-hidden="true" />
                  <span className="text-[13px] font-bold truncate" style={{ color: DESIGN_TOKENS.textPrimary }}>{asset.name}</span>
                  {asset.symbol && <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: DESIGN_TOKENS.danger, background: 'rgba(239,68,68,0.10)', flexShrink: 0 }}>{asset.symbol}</span>}
                  {asset.expected_move && <span className="text-[11px] font-bold mr-auto" style={{ color: DESIGN_TOKENS.danger, fontFamily: DESIGN_TOKENS.fontData, fontFeatureSettings: DESIGN_TOKENS.fontFeatureSettings, flexShrink: 0 }}>{asset.expected_move}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ECharts Treemap */}
        {(() => {
          const chartConfig = slide.chart_config || buildSlideChartConfig(slide);
          if (chartConfig) return (
            <div className="mt-4 rounded-2xl p-4" style={DESIGN_TOKENS.chartContainer as any}>
              <InfographicChart config={chartConfig} height={250} />
            </div>
          );
          return null;
        })()}
      </div>
    </SlideWithImage>
  );
}
