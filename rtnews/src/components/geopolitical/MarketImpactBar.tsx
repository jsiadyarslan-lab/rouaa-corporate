'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MarketImpact {
  symbol: string;
  name: string;
  change: number;
  direction: 'bullish' | 'bearish' | 'neutral';
}

/** Legacy asset type used by GeopoliticalRisksPageClient */
interface LegacyAsset {
  symbol: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  [key: string]: unknown;
}

/** Legacy GeoRisk type */
interface LegacyGeoRisk {
  riskScore: number;
  affectedAssets?: LegacyAsset[];
  [key: string]: unknown;
}

interface MarketImpactBarProps {
  impacts?: MarketImpact[];
  locale?: string;
  /** Legacy props */
  assets?: LegacyAsset[];
  risks?: LegacyGeoRisk[];
}

const SYMBOL_ICONS: Record<string, string> = {
  OIL: '🛢️',
  GOLD: '🥇',
  USD: '💵',
  DOLLAR: '💵',
  TASI: '📊',
  BTC: '₿',
  BITCOIN: '₿',
  EUR: '💶',
  CNY: '💴',
  SP500: '📈',
  VIX: '📉',
};

const NAMES: Record<string, Record<string, string>> = {
  OIL: { ar: 'النفط', en: 'Oil', fr: 'Pétrole', es: 'Petróleo', tr: 'Petrol' },
  GOLD: { ar: 'الذهب', en: 'Gold', fr: 'Or', es: 'Oro', tr: 'Altın' },
  USD: { ar: 'الدولار', en: 'Dollar', fr: 'Dollar', es: 'Dólar', tr: 'Dolar' },
  DOLLAR: { ar: 'الدولار', en: 'Dollar', fr: 'Dollar', es: 'Dólar', tr: 'Dolar' },
  TASI: { ar: 'تاسي', en: 'TASI', fr: 'TASI', es: 'TASI', tr: 'TASI' },
  BTC: { ar: 'بيتكوين', en: 'Bitcoin', fr: 'Bitcoin', es: 'Bitcoin', tr: 'Bitcoin' },
  BITCOIN: { ar: 'بيتكوين', en: 'Bitcoin', fr: 'Bitcoin', es: 'Bitcoin', tr: 'Bitcoin' },
  EUR: { ar: 'اليورو', en: 'Euro', fr: 'Euro', es: 'Euro', tr: 'Euro' },
  SP500: { ar: 'إس آند بي 500', en: 'S&P 500', fr: 'S&P 500', es: 'S&P 500', tr: 'S&P 500' },
  VIX: { ar: 'مؤشر الخوف', en: 'VIX', fr: 'VIX', es: 'VIX', tr: 'VIX' },
};

/** Compute approximate impact from legacy assets and risks */
function computeLegacyImpacts(
  assets: LegacyAsset[],
  risks: LegacyGeoRisk[]
): MarketImpact[] {
  // Average risk score as a global risk factor
  const avgRisk = risks.length > 0
    ? risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length
    : 50;

  // Simple heuristic: higher risk → positive for gold/oil/vix, negative for stocks
  const factor = (avgRisk - 50) / 50; // -1 to +1
  return assets.map((asset) => {
    const sym = (asset.symbol || '').toUpperCase();
    let change = 0;
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';

    if (sym === 'OIL' || sym === 'CRUDE') {
      change = +(factor * 8).toFixed(2);
    } else if (sym === 'GOLD') {
      change = +(factor * 4).toFixed(2);
    } else if (sym === 'USD' || sym === 'DOLLAR') {
      change = +(factor * -2).toFixed(2);
    } else if (sym === 'TASI') {
      change = +(factor * -6).toFixed(2);
    } else if (sym === 'BTC' || sym === 'BITCOIN') {
      change = +(factor * -5).toFixed(2);
    } else if (sym === 'VIX') {
      change = +(factor * 10).toFixed(2);
    } else {
      change = +(factor * -3).toFixed(2);
    }

    if (change > 0.5) direction = 'bullish';
    else if (change < -0.5) direction = 'bearish';

    return {
      symbol: sym,
      name: asset.nameAr || asset.nameEn || asset.name || sym,
      change,
      direction,
    };
  });
}

export default function MarketImpactBar({
  impacts,
  locale = 'ar',
  assets,
  risks,
}: MarketImpactBarProps) {
  const isRtl = locale === 'ar';

  // Use new `impacts` if provided, otherwise compute from legacy `assets` + `risks`
  const data: MarketImpact[] = impacts ?? (
    assets && risks ? computeLegacyImpacts(assets, risks) :
    assets ? computeLegacyImpacts(assets, []) :
    []
  );

  if (data.length === 0) return null;

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {data.map((item) => {
          const isBullish = item.direction === 'bullish';
          const isBearish = item.direction === 'bearish';
          const color = isBullish
            ? 'var(--bull)'
            : isBearish
              ? 'var(--bear)'
              : 'var(--text3)';
          const bgAlpha = isBullish
            ? 'rgba(34,197,94,0.1)'
            : isBearish
              ? 'rgba(239,83,80,0.1)'
              : 'var(--bg5)';
          const displayName =
            NAMES[item.symbol]?.[locale] ?? item.name;
          const emoji = SYMBOL_ICONS[item.symbol] ?? '';

          return (
            <div
              key={item.symbol}
              className="flex items-center gap-2 rounded-lg px-3 py-2 min-w-[140px]"
              style={{ background: bgAlpha }}
            >
              <span className="text-lg" role="img" aria-label={displayName}>
                {emoji}
              </span>
              <div className="flex flex-col">
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--text2)' }}
                >
                  {displayName}
                </span>
                <div className="flex items-center gap-1">
                  {isBullish && <TrendingUp className="w-3 h-3" style={{ color }} />}
                  {isBearish && <TrendingDown className="w-3 h-3" style={{ color }} />}
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color }}
                  >
                    {item.change > 0 ? '+' : ''}
                    {item.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
