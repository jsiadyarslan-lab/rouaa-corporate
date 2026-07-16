// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — Trend Analyzer
// ═══════════════════════════════════════════════════════════════
// Analyzes trends in pipeline metrics over time.
// Detects anomalous changes (sudden drops, spikes).
// ═══════════════════════════════════════════════════════════════

import type { Locale, SensorySnapshot, TrendData } from '../types/guardian-types';
import { getMetricsHistory } from '../sensors/sensory-engine';

export function analyzeTrends(locale: Locale): TrendData[] {
  const history = getMetricsHistory(locale);
  if (history.length < 2) return [];

  const trends: TrendData[] = [];
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];

  // 1. Publishing rate trend
  trends.push(computeTrend(
    'published_today',
    locale,
    latest.publishedToday,
    previous.publishedToday,
  ));

  // 2. Blocked articles trend
  trends.push(computeTrend(
    'total_blocked',
    locale,
    latest.totalBlocked,
    previous.totalBlocked,
  ));

  // 3. Pending articles trend
  trends.push(computeTrend(
    'pending_count',
    locale,
    latest.pendingCount,
    previous.pendingCount,
  ));

  // 4. Hourly publishing rate trend
  trends.push(computeTrend(
    'published_this_hour',
    locale,
    latest.publishedThisHour,
    previous.publishedThisHour,
  ));

  return trends;
}

function computeTrend(
  metric: string,
  locale: Locale,
  current: number,
  previous: number,
): TrendData {
  const change = previous === 0 ? 0 : ((current - previous) / Math.abs(previous)) * 100;
  const isAnomalous = Math.abs(change) > 50;  // >50% change is anomalous

  return {
    metric,
    locale,
    current,
    previous,
    change: Math.round(change * 100) / 100,
    direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
    isAnomalous,
  };
}

export function detectAnomalies(trends: TrendData[]): TrendData[] {
  return trends.filter(t => t.isAnomalous);
}

export function getPublishingHealth(trends: TrendData[]): 'healthy' | 'declining' | 'dead' {
  const pubTrend = trends.find(t => t.metric === 'published_this_hour');
  const blockedTrend = trends.find(t => t.metric === 'total_blocked');

  if (!pubTrend) return 'healthy';

  // No publishing happening at all
  if (pubTrend.current === 0 && blockedTrend && blockedTrend.current > 50) return 'dead';

  // Publishing declining
  if (pubTrend.direction === 'down' && pubTrend.change < -30) return 'declining';

  return 'healthy';
}
