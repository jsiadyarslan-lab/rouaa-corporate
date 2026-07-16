'use client';

import {
  getRiskColor,
  getRiskLabel,
  getCategoryLabel,
  type RiskCategoryKey,
} from '@/lib/geopolitical/risk-thresholds';
import {
  Swords,
  Ship,
  Zap,
  Landmark,
  ShieldAlert,
  Gavel,
  TrendingUp,
  TrendingDown,
  Minus,
  CloudRain,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RiskCategoryData {
  category: RiskCategoryKey | string;
  score: number;
  trend: 'up' | 'down' | 'stable';
}

/** Legacy GeoRisk type used by GeopoliticalRisksPageClient */
interface LegacyGeoRisk {
  riskCategory: string;
  riskScore: number;
  [key: string]: unknown;
}

interface RiskCategoryCardsProps {
  locale?: string;
  categories?: RiskCategoryData[];
  /** Legacy prop: pass an array of GeoRisk objects */
  risks?: LegacyGeoRisk[];
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  conflict: Swords,
  trade: Ship,
  energy: Zap,
  political: Landmark,
  cyber: ShieldAlert,
  sanctions: Gavel,
  climate: CloudRain,
};

function TrendIcon({ trend, className }: { trend: 'up' | 'down' | 'stable'; className?: string }) {
  if (trend === 'up') return <TrendingUp className={cn('text-[var(--bear)]', className)} />;
  if (trend === 'down') return <TrendingDown className={cn('text-[var(--bull)]', className)} />;
  return <Minus className={cn('text-[var(--text3)]', className)} />;
}

/** Derive trend from score */
function scoreToTrend(score: number): 'up' | 'down' | 'stable' {
  if (score >= 65) return 'up';
  if (score <= 35) return 'down';
  return 'stable';
}

/** Normalize legacy risks into categories */
function normalizeRisks(risks: LegacyGeoRisk[]): RiskCategoryData[] {
  const grouped = new Map<string, { totalScore: number; count: number }>();
  for (const r of risks) {
    const key = r.riskCategory || 'conflict';
    const existing = grouped.get(key) || { totalScore: 0, count: 0 };
    existing.totalScore += r.riskScore;
    existing.count += 1;
    grouped.set(key, existing);
  }
  const result: RiskCategoryData[] = [];
  for (const [category, { totalScore, count }] of grouped) {
    const avgScore = Math.round(totalScore / count);
    result.push({ category, score: avgScore, trend: scoreToTrend(avgScore) });
  }
  return result.sort((a, b) => b.score - a.score);
}

export default function RiskCategoryCards({ locale = 'ar', categories, risks }: RiskCategoryCardsProps) {
  const isRtl = locale === 'ar';

  // Support both new `categories` prop and legacy `risks` prop
  const data: RiskCategoryData[] = categories ?? (risks ? normalizeRisks(risks) : []);

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {data.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.category] ?? ShieldAlert;
        const color = getRiskColor(cat.score);
        const levelLabel = getRiskLabel(cat.score, locale);
        const catLabel = getCategoryLabel(cat.category as RiskCategoryKey, locale);
        // Fallback if category key is not in our list (e.g., "climate")
        const displayLabel = catLabel !== cat.category ? catLabel : cat.category;

        return (
          <div
            key={cat.category}
            className="rounded-xl p-4 border transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            style={{
              background: 'var(--bg3)',
              borderColor: 'var(--rim)',
            }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg"
                  style={{ background: `${color}18` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: 'var(--text-head)' }}
                  >
                    {displayLabel}
                  </h3>
                  <span
                    className="text-xs font-medium"
                    style={{ color }}
                  >
                    {levelLabel}
                  </span>
                </div>
              </div>
              <TrendIcon trend={cat.trend} className="w-5 h-5" />
            </div>

            {/* Score + progress */}
            <div className="flex items-center gap-3">
              <span
                className="text-2xl font-bold tabular-nums"
                style={{ color: 'var(--text-head)' }}
              >
                {cat.score}
              </span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg5)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${cat.score}%`,
                    background: `linear-gradient(90deg, ${color}88, ${color})`,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
