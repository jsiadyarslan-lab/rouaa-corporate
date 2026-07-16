// ═══════════════════════════════════════════════════════════════
// Market Math — Shared technical analysis helpers
// ═══════════════════════════════════════════════════════════════
// All collectors use these to compute historical context,
// support/resistance, volatility, and trend strength from
// the `history` JSON field stored on MarketIndicator.
// ═══════════════════════════════════════════════════════════════

export interface PricePoint {
  date?: string;
  value?: number;
  price?: number;
  t?: number | string;
  close?: number;
}

export interface HistoryStats {
  hasHistory: boolean;
  points: number;
  current: number;
  change7d: number | null;
  change30d: number | null;
  high7d: number | null;
  low7d: number | null;
  high30d: number | null;
  low30d: number | null;
  avg7d: number | null;
  volatility7d: number | null;
  trend7d: 'صعودي' | 'هبوطي' | 'عرضي';
  trend30d: 'صعودي' | 'هبوطي' | 'عرضي';
  support: number | null;
  resistance: number | null;
  distanceFromHigh30d: number | null;
  distanceFromLow30d: number | null;
}

export function parseHistory(history: unknown): PricePoint[] {
  if (!history) return [];
  try {
    const raw = typeof history === 'string' ? JSON.parse(history) : history;
    if (!Array.isArray(raw)) return [];
    return raw as PricePoint[];
  } catch {
    return [];
  }
}

function getValue(p: PricePoint): number {
  return Number(p.value ?? p.price ?? p.close ?? 0);
}

export function computeHistoryStats(history: unknown, currentPrice: number): HistoryStats {
  const points = parseHistory(history);
  const empty: HistoryStats = {
    hasHistory: false, points: 0, current: currentPrice,
    change7d: null, change30d: null,
    high7d: null, low7d: null, high30d: null, low30d: null,
    avg7d: null, volatility7d: null,
    trend7d: 'عرضي', trend30d: 'عرضي',
    support: null, resistance: null,
    distanceFromHigh30d: null, distanceFromLow30d: null,
  };

  if (points.length < 2) return empty;

  const values = points.map(getValue).filter(v => v > 0);
  if (values.length < 2) return empty;

  const last7 = values.slice(-7);
  const last30 = values.slice(-30);

  const high7d = Math.max(...last7);
  const low7d = Math.min(...last7);
  const high30d = Math.max(...last30);
  const low30d = Math.min(...last30);
  const avg7d = last7.reduce((a, b) => a + b, 0) / last7.length;

  const change7d = last7[0] > 0 ? ((currentPrice - last7[0]) / last7[0]) * 100 : null;
  const change30d = values[0] > 0 ? ((currentPrice - values[0]) / values[0]) * 100 : null;

  const returns7: number[] = [];
  for (let i = 1; i < last7.length; i++) {
    if (last7[i - 1] > 0) {
      returns7.push(((last7[i] - last7[i - 1]) / last7[i - 1]) * 100);
    }
  }
  let volatility7d: number | null = null;
  if (returns7.length >= 2) {
    const mean = returns7.reduce((a, b) => a + b, 0) / returns7.length;
    const variance = returns7.reduce((a, b) => a + (b - mean) ** 2, 0) / returns7.length;
    volatility7d = Math.sqrt(variance);
  }

  const trend7d: HistoryStats['trend7d'] =
    change7d === null ? 'عرضي' :
    change7d > 1 ? 'صعودي' :
    change7d < -1 ? 'هبوطي' : 'عرضي';
  const trend30d: HistoryStats['trend30d'] =
    change30d === null ? 'عرضي' :
    change30d > 3 ? 'صعودي' :
    change30d < -3 ? 'هبوطي' : 'عرضي';

  const support = low7d;
  const resistance = high7d;

  const distanceFromHigh30d = high30d > 0 ? ((currentPrice - high30d) / high30d) * 100 : null;
  const distanceFromLow30d = low30d > 0 ? ((currentPrice - low30d) / low30d) * 100 : null;

  return {
    hasHistory: true,
    points: values.length,
    current: currentPrice,
    change7d, change30d,
    high7d, low7d, high30d, low30d,
    avg7d, volatility7d,
    trend7d, trend30d,
    support, resistance,
    distanceFromHigh30d, distanceFromLow30d,
  };
}

export function fmtPrice(v: number | null | undefined, decimals = 2): string {
  if (v === null || v === undefined || isNaN(v)) return 'غير متوفر';
  return `$${v.toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return 'غير متوفر';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

export function buildHistoryBlock(stats: HistoryStats): string {
  if (!stats.hasHistory) return '';
  const lines: string[] = [];
  lines.push(`الاتجاه الأسبوعي (7 أيام): ${stats.trend7d}`);
  if (stats.change7d !== null) lines.push(`التغير الأسبوعي: ${fmtPct(stats.change7d)}`);
  if (stats.change30d !== null) lines.push(`التغير الشهري (30 يوم): ${fmtPct(stats.change30d)}`);
  if (stats.high7d !== null) lines.push(`أعلى سعر (7 أيام): ${fmtPrice(stats.high7d)}`);
  if (stats.low7d !== null) lines.push(`أدنى سعر (7 أيام): ${fmtPrice(stats.low7d)}`);
  if (stats.high30d !== null) lines.push(`أعلى سعر (30 يوم): ${fmtPrice(stats.high30d)}`);
  if (stats.low30d !== null) lines.push(`أدنى سعر (30 يوم): ${fmtPrice(stats.low30d)}`);
  if (stats.avg7d !== null) lines.push(`متوسط (7 أيام): ${fmtPrice(stats.avg7d)}`);
  if (stats.volatility7d !== null) lines.push(`التقلب (7 أيام): ${stats.volatility7d.toFixed(2)}%`);
  if (stats.support !== null) lines.push(`مستوى الدعم القريب: ${fmtPrice(stats.support)}`);
  if (stats.resistance !== null) lines.push(`مستوى المقاومة القريب: ${fmtPrice(stats.resistance)}`);
  if (stats.distanceFromHigh30d !== null) lines.push(`البُعد عن قمة 30 يوم: ${fmtPct(stats.distanceFromHigh30d)}`);
  if (stats.distanceFromLow30d !== null) lines.push(`البُعد عن قاع 30 يوم: ${fmtPct(stats.distanceFromLow30d)}`);
  return lines.join('\n');
}
