'use client';

import { getRiskColor, getRiskLabel, getRiskLevel } from '@/lib/geopolitical/risk-thresholds';
import { t } from '@/lib/geopolitical/i18n';
import { cn } from '@/lib/utils';

interface GeopoliticalRiskBadgeProps {
  score: number;
  locale?: string;
  level?: string;
  className?: string;
  showScore?: boolean;
}

const LEVEL_LABEL_KEYS: Record<string, string> = {
  low: 'risk.low',
  moderate: 'risk.moderate',
  elevated: 'risk.elevated',
  high: 'risk.high',
  severe: 'risk.severe',
  critical: 'risk.critical',
};

export default function GeopoliticalRiskBadge({
  score,
  locale = 'ar',
  level,
  className,
  showScore = true,
}: GeopoliticalRiskBadgeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const color = getRiskColor(clampedScore);

  // If `level` prop is provided directly (from API data), use it;
  // otherwise compute from score
  let label: string;
  const levelKey = level?.toLowerCase();
  if (levelKey && LEVEL_LABEL_KEYS[levelKey]) {
    label = t(LEVEL_LABEL_KEYS[levelKey], locale);
  } else if (level) {
    label = level.charAt(0).toUpperCase() + level.slice(1);
  } else {
    label = getRiskLabel(clampedScore, locale);
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        className
      )}
      style={{
        background: `${color}18`,
        color: color,
      }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: color, boxShadow: `0 0 4px ${color}88` }}
      />
      {label}
      {showScore && (
        <span className="tabular-nums opacity-80">({clampedScore})</span>
      )}
    </span>
  );
}
