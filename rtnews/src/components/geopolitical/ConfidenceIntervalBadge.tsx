'use client';

import { useMemo } from 'react';
import { generateComponentOutcomes, computeConfidenceInterval, formatScoreWithCI, type ScoreWithCI } from '@/lib/geopolitical/confidence-intervals';
import { t } from '@/lib/geopolitical/i18n';

interface ConfidenceIntervalBadgeProps {
  score: number;
  uncertainty?: number;
  locale: string;
  size?: 'sm' | 'md' | 'lg';
  showRange?: boolean;
}

/**
 * Displays a risk score with its confidence interval.
 * Shows "72 ±8" format instead of just "72".
 * Top priority recommendation: easiest to implement, highest impact on credibility.
 */
export default function ConfidenceIntervalBadge({
  score,
  uncertainty = 0.3,
  locale,
  size = 'md',
  showRange = true,
}: ConfidenceIntervalBadgeProps) {
  const scoreWithCI: ScoreWithCI = useMemo(() => {
    const outcomes = generateComponentOutcomes(score, uncertainty, 5000);
    const ci = computeConfidenceInterval(outcomes);
    return formatScoreWithCI(score, ci);
  }, [score, uncertainty]);

  const fontSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm';
  const moeFontSize = size === 'lg' ? 'text-sm' : size === 'md' ? 'text-xs' : 'text-[10px]';
  const rangeFontSize = size === 'lg' ? 'text-xs' : 'text-[10px]';

  const moeColor = () => {
    const moe = scoreWithCI.ci.marginOfError;
    if (moe > 15) return '#EF4444'; // Large uncertainty = red
    if (moe > 8) return '#F59E0B';  // Moderate = yellow
    return '#22C55E';               // Low uncertainty = green
  };

  return (
    <div className="inline-flex flex-col items-center">
      <div className="flex items-baseline gap-1">
        <span className={`${fontSize} font-bold tabular-nums`} style={{ color: 'var(--text)' }}>
          {scoreWithCI.score}
        </span>
        <span className={`${moeFontSize} font-medium tabular-nums`} style={{ color: moeColor() }}>
          {'\u00B1'}{Math.round(scoreWithCI.ci.marginOfError)}
        </span>
      </div>
      {showRange && (
        <span className={`${rangeFontSize} tabular-nums`} style={{ color: 'var(--text3)' }}>
          {t('confidence.ci95', locale)} {scoreWithCI.level95}
        </span>
      )}
      {/* Uncertainty bar */}
      <div className="w-full mt-1 relative h-1 rounded-full" style={{ background: 'var(--bg5)' }}>
        <div
          className="absolute h-full rounded-full"
          style={{
            left: `${Math.max(0, scoreWithCI.ci.lower95)}%`,
            width: `${Math.min(100 - scoreWithCI.ci.lower95, scoreWithCI.ci.upper95 - scoreWithCI.ci.lower95)}%`,
            background: moeColor(),
            opacity: 0.4,
          }}
        />
        <div
          className="absolute w-1.5 h-1.5 rounded-full -top-0.5"
          style={{
            left: `${scoreWithCI.score}%`,
            background: 'var(--text)',
            transform: 'translateX(-50%)',
          }}
        />
      </div>
      {size !== 'sm' && (
        <span className="text-[8px] mt-0.5" style={{ color: 'var(--text3)' }}>
          {t('confidence.sampleSize', locale)}{scoreWithCI.ci.sampleSize.toLocaleString()}
        </span>
      )}
    </div>
  );
}
