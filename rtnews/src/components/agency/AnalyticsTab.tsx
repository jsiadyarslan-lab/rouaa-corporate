// ═══════════════════════════════════════════════════════════════
// Agency Analytics Dashboard — Phase 6 UI
// ═══════════════════════════════════════════════════════════════
// Visualizes the data from /api/agency-analytics endpoint.
// Shows: source productivity, dedup rate, rejection reasons, hourly trend.
//
// Auth: relies on dashboard layout's admin_token cookie (same as
// /dashboard/ai-news). The endpoint also accepts ?key=ai-news-cron
// for non-dashboard access (e.g., monitoring scripts).
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import {
  Activity, RefreshCw, Loader2, AlertTriangle, TrendingUp, TrendingDown,
  Database, Globe, BarChart3, Zap, Clock, CheckCircle2, XCircle,
  Filter, Award, AlertCircle, ChevronDown, ChevronUp, Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ── Types matching the API response ──────────────────────────

interface AnalyticsSummary {
  totalSources: number;
  activeSources: number;
  deadSources: number;
  totalEvents: number;
  totalPublished: number;
  totalFailed: number;
  totalDeduped: number;
  overallPublishRate: number;
  overallDuplicateRate: number;
  candidatesForDisable: number;
}

interface SourceStat {
  sourceId: string;
  sourceName: string;
  category: string;
  totalEvents: number;
  published: number;
  failed: number;
  deduped: number;
  publishRate: number;
  duplicateRate: number;
  failureRate: number;
  qualityScore: number;
  recommendation: 'keep' | 'investigate' | 'disable';
  recommendationReason: string;
  lastEventAt: string | null;
}

interface RejectionReason {
  reason: string;
  count: number;
  percent: number;
}

interface TrendPoint {
  hour: string;
  published: number;
  failed: number;
}

interface AnalyticsResponse {
  generatedAt: string;
  windowDays: number;
  trendHours: number;
  summary: AnalyticsSummary;
  topProductiveSources: SourceStat[];
  topNoisySources: SourceStat[];
  topFailingSources: SourceStat[];
  candidatesForDisable: SourceStat[];
  rejectionReasons: RejectionReason[];
  publishingTrend: TrendPoint[];
  allSources: SourceStat[];
}

// ── Color constants (matching platform theme) ────────────────

const COLORS = {
  bg: '#0B0E14',
  card: '#151A22',
  border: '#2A313C',
  primary: '#059669',      // green
  gold: '#d4af37',
  red: '#ef4444',
  amber: '#f59e0b',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  text: '#e5e7eb',
  textMuted: '#9ca3af',
  textDim: '#6b7280',
};

const CATEGORY_COLORS: Record<string, string> = {
  economy: COLORS.blue,
  stocks: COLORS.primary,
  crypto: '#f7931a',
  commodities: COLORS.amber,
  forex: COLORS.purple,
  central_banks: '#ec4899',
  unknown: COLORS.textDim,
};

const CATEGORY_LABELS: Record<string, string> = {
  economy: 'اقتصاد',
  stocks: 'أسهم',
  crypto: 'كريبتو',
  commodities: 'سلع',
  forex: 'عملات',
  central_banks: 'بنوك مركزية',
  unknown: 'غير مصنف',
};

const RECOMMENDATION_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  keep: { color: COLORS.primary, label: 'إبقاء', icon: CheckCircle2 },
  investigate: { color: COLORS.amber, label: 'تحقيق', icon: AlertCircle },
  disable: { color: COLORS.red, label: 'تعطيل', icon: XCircle },
};

// ── Helper: format percentage ────────────────────────────────

function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(isoDate: string | null): string {
  if (!isoDate) return '—';
  const diff = Date.now() - new Date(isoDate).getTime();
  if (diff < 60_000) return 'الآن';
  if (diff < 3_600_000) return `منذ ${Math.floor(diff / 60_000)} دقيقة`;
  if (diff < 86_400_000) return `منذ ${Math.floor(diff / 3_600_000)} ساعة`;
  return `منذ ${Math.floor(diff / 86_400_000)} يوم`;
}

// ── Stat Card Component ──────────────────────────────────────

function StatCard({
  icon: Icon, label, value, color, sublabel,
}: {
  icon: any; label: string; value: string | number; color: string; sublabel?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-4 transition-all hover:scale-[1.02]"
      style={{
        background: `rgba(${parseInt(COLORS.card.slice(1, 3), 16)}, ${parseInt(COLORS.card.slice(3, 5), 16)}, ${parseInt(COLORS.card.slice(5, 7), 16)}, 0.8)`,
        border: `1px solid ${COLORS.border}`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
        style={{ background: color, filter: 'blur(30px)' }}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${color}20` }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <span className="text-xs" style={{ color: COLORS.textMuted }}>{label}</span>
          </div>
        </div>
        <div className="text-2xl font-bold" style={{ color: COLORS.text }}>{value}</div>
        {sublabel && (
          <div className="text-[10px] mt-1" style={{ color: COLORS.textDim }}>{sublabel}</div>
        )}
      </div>
    </div>
  );
}

// ── Source Row Component ─────────────────────────────────────

function SourceRow({ source, rank }: { source: SourceStat; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const recConfig = RECOMMENDATION_CONFIG[source.recommendation] || RECOMMENDATION_CONFIG.keep;
  const RecIcon = recConfig.icon;
  const catColor = CATEGORY_COLORS[source.category] || COLORS.textDim;
  const catLabel = CATEGORY_LABELS[source.category] || source.category;

  return (
    <div
      className="rounded-lg overflow-hidden transition-all"
      style={{
        background: 'rgba(11,14,20,0.6)',
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-right p-3 hover:bg-[rgba(42,49,60,0.3)] transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-[10px] font-bold w-6 text-center" style={{ color: COLORS.textDim }}>
              #{rank}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-medium truncate" style={{ color: COLORS.text }}>
                  {source.sourceName}
                </span>
                <span
                  className="px-2 py-0.5 text-[10px] rounded font-medium"
                  style={{ background: `${catColor}20`, color: catColor, border: `1px solid ${catColor}30` }}
                >
                  {catLabel}
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded font-medium"
                  style={{
                    background: `${recConfig.color}20`,
                    color: recConfig.color,
                    border: `1px solid ${recConfig.color}30`,
                  }}
                >
                  <RecIcon className="w-3 h-3" />
                  {recConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]" style={{ color: COLORS.textMuted }}>
                <span>📊 {source.totalEvents} event</span>
                <span style={{ color: COLORS.primary }}>✓ {source.published}</span>
                <span style={{ color: COLORS.amber }}>↔ {source.deduped}</span>
                <span style={{ color: COLORS.red }}>✗ {source.failed}</span>
                <span>•</span>
                <span>أخير نشاط: {timeAgo(source.lastEventAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-[10px]" style={{ color: COLORS.textDim }}>جودة</div>
              <div
                className="text-lg font-bold"
                style={{
                  color:
                    source.qualityScore >= 70
                      ? COLORS.primary
                      : source.qualityScore >= 40
                        ? COLORS.amber
                        : COLORS.red,
                }}
              >
                {source.qualityScore}
              </div>
            </div>
            {expanded ? (
              <ChevronUp className="w-4 h-4" style={{ color: COLORS.textDim }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: COLORS.textDim }} />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: COLORS.border }}>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <div className="text-[10px] mb-1" style={{ color: COLORS.textDim }}>نسبة النشر</div>
              <div className="text-lg font-bold" style={{ color: COLORS.primary }}>
                {pct(source.publishRate)}
              </div>
              <div className="w-full h-1.5 rounded-full mt-1" style={{ background: COLORS.border }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(source.publishRate, 100)}%`,
                    background: COLORS.primary,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: COLORS.textDim }}>نسبة التكرار</div>
              <div className="text-lg font-bold" style={{ color: COLORS.amber }}>
                {pct(source.duplicateRate)}
              </div>
              <div className="w-full h-1.5 rounded-full mt-1" style={{ background: COLORS.border }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(source.duplicateRate, 100)}%`,
                    background: COLORS.amber,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: COLORS.textDim }}>نسبة الفشل</div>
              <div className="text-lg font-bold" style={{ color: COLORS.red }}>
                {pct(source.failureRate)}
              </div>
              <div className="w-full h-1.5 rounded-full mt-1" style={{ background: COLORS.border }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(source.failureRate, 100)}%`,
                    background: COLORS.red,
                  }}
                />
              </div>
            </div>
          </div>
          {source.recommendationReason && (
            <div
              className="mt-3 p-2 rounded text-xs"
              style={{
                background: `${recConfig.color}10`,
                border: `1px solid ${recConfig.color}30`,
                color: recConfig.color,
              }}
            >
              <AlertCircle className="w-3 h-3 inline mr-1" />
              {source.recommendationReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Rejection Reasons Bar Chart ──────────────────────────────

function RejectionReasonsChart({ reasons }: { reasons: RejectionReason[] }) {
  if (!reasons.length) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: COLORS.textDim }}>
        لا توجد أسباب فشل في النافذة الزمنية
      </div>
    );
  }
  const maxCount = Math.max(...reasons.map(r => r.count));
  const colorMap: Record<string, string> = {
    'Pre-LLM dedup (URL)': COLORS.primary,
    'Pre-LLM dedup (symbol+numbers)': COLORS.cyan,
    'Post-LLM dedup (V1148)': COLORS.blue,
    'LLM call failed (all providers)': COLORS.red,
    'LLM parse failed (invalid JSON)': COLORS.amber,
    'Content validation failed (too short)': COLORS.purple,
    'Content validation failed (no Arabic)': COLORS.purple,
    'Content validation failed (template copy)': COLORS.purple,
    'Source attribution detected': COLORS.gold,
    'Math validation failed': COLORS.amber,
    'Other': COLORS.textDim,
  };

  return (
    <div className="space-y-2">
      {reasons.map(r => {
        const color = colorMap[r.reason] || COLORS.textDim;
        const width = maxCount > 0 ? (r.count / maxCount) * 100 : 0;
        return (
          <div key={r.reason} className="flex items-center gap-3">
            <div className="w-56 text-xs flex-shrink-0" style={{ color: COLORS.textMuted }}>
              {r.reason}
            </div>
            <div className="flex-1 h-6 rounded relative overflow-hidden" style={{ background: 'rgba(11,14,20,0.6)' }}>
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${width}%`, background: color, opacity: 0.8 }}
              />
              <div
                className="absolute inset-0 flex items-center justify-end px-2 text-[11px] font-medium"
                style={{ color: COLORS.text }}
              >
                {r.count} ({r.percent}%)
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Publishing Trend Chart ───────────────────────────────────

function PublishingTrendChart({ trend }: { trend: TrendPoint[] }) {
  if (!trend.length) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: COLORS.textDim }}>
        لا توجد بيانات في النافذة الزمنية
      </div>
    );
  }
  const maxVal = Math.max(...trend.map(t => Math.max(t.published, t.failed)), 1);
  const maxHeight = 120;

  return (
    <div>
      <div className="flex items-end gap-1 h-32 mb-2 overflow-x-auto pb-2">
        {trend.map(t => {
          const pubHeight = (t.published / maxVal) * maxHeight;
          const failHeight = (t.failed / maxVal) * maxHeight;
          const hourLabel = t.hour.slice(11, 16);
          return (
            <div
              key={t.hour}
              className="flex flex-col items-center gap-1 flex-shrink-0 group relative"
              style={{ minWidth: '32px' }}
            >
              <div className="flex items-end gap-0.5" style={{ height: maxHeight }}>
                <div
                  className="w-2 rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${pubHeight}px`,
                    background: COLORS.primary,
                    minHeight: t.published > 0 ? '2px' : '0',
                  }}
                  title={`منشور: ${t.published}`}
                />
                <div
                  className="w-2 rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${failHeight}px`,
                    background: COLORS.red,
                    opacity: 0.6,
                    minHeight: t.failed > 0 ? '2px' : '0',
                  }}
                  title={`فشل: ${t.failed}`}
                />
              </div>
              <div className="text-[9px]" style={{ color: COLORS.textDim }}>
                {hourLabel}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-[11px]" style={{ color: COLORS.textMuted }}>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: COLORS.primary }} />
          منشور
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: COLORS.red, opacity: 0.6 }} />
          فشل
        </div>
      </div>
    </div>
  );
}

// ── Quality Distribution Donut ───────────────────────────────

function QualityDistribution({ sources }: { sources: SourceStat[] }) {
  const buckets = {
    excellent: 0, // 80-100
    good: 0,      // 60-79
    fair: 0,      // 40-59
    poor: 0,      // 0-39
  };
  for (const s of sources) {
    if (s.qualityScore >= 80) buckets.excellent++;
    else if (s.qualityScore >= 60) buckets.good++;
    else if (s.qualityScore >= 40) buckets.fair++;
    else buckets.poor++;
  }
  const total = sources.length || 1;

  return (
    <div className="grid grid-cols-4 gap-2">
      <QualityBucket label="ممتاز" count={buckets.excellent} total={total} color={COLORS.primary} min="80+" />
      <QualityBucket label="جيد" count={buckets.good} total={total} color={COLORS.cyan} min="60-79" />
      <QualityBucket label="مقبول" count={buckets.fair} total={total} color={COLORS.amber} min="40-59" />
      <QualityBucket label="ضعيف" count={buckets.poor} total={total} color={COLORS.red} min="0-39" />
    </div>
  );
}

function QualityBucket({
  label, count, total, color, min,
}: {
  label: string; count: number; total: number; color: string; min: string;
}) {
  const pctValue = (count / total) * 100;
  return (
    <div
      className="rounded-lg p-3 text-center"
      style={{ background: `${color}10`, border: `1px solid ${color}30` }}
    >
      <div className="text-[10px] mb-1" style={{ color: COLORS.textDim }}>{min}</div>
      <div className="text-2xl font-bold" style={{ color }}>{count}</div>
      <div className="text-[10px]" style={{ color }}>{label}</div>
      <div className="text-[9px] mt-1" style={{ color: COLORS.textDim }}>{pctValue.toFixed(0)}%</div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────

export function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [windowDays, setWindowDays] = useState(7);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      setError(null);
      const res = await fetch(`/api/agency-analytics?key=ai-news-cron&days=${windowDays}&hours=24`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const result = await res.json();
      setData(result);
      if (showToast) toast.success('تم تحديث التحليلات');
    } catch (err: any) {
      console.error('[AgencyAnalytics] fetch error:', err);
      setError(err.message || 'فشل تحميل التحليلات');
      if (showToast) toast.error('فشل تحديث التحليلات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [windowDays]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => fetchAnalytics(false), 60_000); // auto-refresh every 60s
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  // ── Loading state ────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.bg }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: COLORS.primary }} />
          <div className="text-sm" style={{ color: COLORS.textMuted }}>جاري تحميل التحليلات...</div>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────
  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: COLORS.bg }}>
        <div
          className="max-w-md p-6 rounded-xl text-center"
          style={{ background: COLORS.card, border: `1px solid ${COLORS.red}40` }}
        >
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: COLORS.red }} />
          <h2 className="text-lg font-bold mb-2" style={{ color: COLORS.text }}>فشل تحميل التحليلات</h2>
          <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>{error}</p>
          <Button
            onClick={() => fetchAnalytics(true)}
            style={{ background: COLORS.primary, color: '#fff' }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;

  return (
    <div className="p-2" style={{ color: COLORS.text }} dir="rtl">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: COLORS.text }}>
            <BarChart3 className="w-6 h-6" style={{ color: COLORS.primary }} />
            تحليلات الوكالة
          </h1>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            مصادر الأخبار • إنتاجية • جودة • اتجاهات
            {' • '}
            آخر تحديث: {new Date(data.generatedAt).toLocaleString('ar')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Window selector */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <Clock className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} />
            <select
              value={windowDays}
              onChange={e => setWindowDays(Number(e.target.value))}
              className="bg-transparent text-xs outline-none cursor-pointer"
              style={{ color: COLORS.text }}
            >
              <option value={1} style={{ background: COLORS.card }}>آخر 24 ساعة</option>
              <option value={3} style={{ background: COLORS.card }}>آخر 3 أيام</option>
              <option value={7} style={{ background: COLORS.card }}>آخر 7 أيام</option>
              <option value={14} style={{ background: COLORS.card }}>آخر 14 يوم</option>
              <option value={30} style={{ background: COLORS.card }}>آخر 30 يوم</option>
            </select>
          </div>
          <Button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            variant="outline"
            style={{ background: COLORS.card, borderColor: COLORS.border, color: COLORS.text }}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* ── Summary Stat Cards ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          icon={Globe}
          label="مصادر نشطة"
          value={summary.activeSources}
          color={COLORS.blue}
          sublabel={`من ${summary.totalSources} إجمالي`}
        />
        <StatCard
          icon={Database}
          label="إجمالي الأحداث"
          value={formatNumber(summary.totalEvents)}
          color={COLORS.purple}
          sublabel={`في ${data.windowDays} أيام`}
        />
        <StatCard
          icon={CheckCircle2}
          label="منشور"
          value={formatNumber(summary.totalPublished)}
          color={COLORS.primary}
          sublabel={`${summary.overallPublishRate}% نسبة النشر`}
        />
        <StatCard
          icon={Filter}
          label="مكرر مرفوض"
          value={formatNumber(summary.totalDeduped)}
          color={COLORS.amber}
          sublabel={`${summary.overallDuplicateRate}% نسبة التكرار`}
        />
        <StatCard
          icon={XCircle}
          label="فشل"
          value={formatNumber(summary.totalFailed)}
          color={COLORS.red}
          sublabel="LLM + validation errors"
        />
        <StatCard
          icon={AlertTriangle}
          label="للتعطيل"
          value={summary.candidatesForDisable}
          color={COLORS.gold}
          sublabel="مرشحون للإيقاف"
        />
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-4" style={{ background: COLORS.card }}>
          <TabsTrigger value="overview" className="data-[state=active]:bg-[rgba(5,150,105,0.2)]">
            <Activity className="w-4 h-4 ml-1" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="sources" className="data-[state=active]:bg-[rgba(5,150,105,0.2)]">
            <Globe className="w-4 h-4 ml-1" />
            كل المصادر
          </TabsTrigger>
          <TabsTrigger value="productive" className="data-[state=active]:bg-[rgba(5,150,105,0.2)]">
            <TrendingUp className="w-4 h-4 ml-1" />
            الأكثر إنتاجاً
          </TabsTrigger>
          <TabsTrigger value="issues" className="data-[state=active]:bg-[rgba(5,150,105,0.2)]">
            <AlertTriangle className="w-4 h-4 ml-1" />
            مشاكل
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-[rgba(5,150,105,0.2)]">
            <BarChart3 className="w-4 h-4 ml-1" />
            اتجاهات
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Overview ──────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Quality distribution */}
            <div
              className="rounded-xl p-4"
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
                <Award className="w-4 h-4" style={{ color: COLORS.gold }} />
                توزيع جودة المصادر
              </h3>
              <QualityDistribution sources={data.allSources} />
              <p className="text-[11px] mt-3" style={{ color: COLORS.textDim }}>
                الجودة = (50% نسبة نشر) + (30% عكس التكرار) + (20% عكس الفشل)
              </p>
            </div>

            {/* Rejection reasons */}
            <div
              className="rounded-xl p-4"
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
                <XCircle className="w-4 h-4" style={{ color: COLORS.red }} />
                أسباب الرفض (آخر {data.windowDays} أيام)
              </h3>
              <RejectionReasonsChart reasons={data.rejectionReasons} />
            </div>
          </div>

          {/* Publishing trend */}
          <div
            className="rounded-xl p-4"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
          >
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.primary }} />
              اتجاه النشر (آخر 24 ساعة)
            </h3>
            <PublishingTrendChart trend={data.publishingTrend} />
          </div>

          {/* Top productive + candidates for disable */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              className="rounded-xl p-4"
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
                <TrendingUp className="w-4 h-4" style={{ color: COLORS.primary }} />
                أعلى 5 مصادر إنتاجاً
              </h3>
              <div className="space-y-2">
                {data.topProductiveSources.slice(0, 5).map((s, i) => (
                  <SourceRow key={s.sourceId + i} source={s} rank={i + 1} />
                ))}
              </div>
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
                <AlertTriangle className="w-4 h-4" style={{ color: COLORS.gold }} />
                مرشحون للتعطيل ({data.candidatesForDisable.length})
              </h3>
              {data.candidatesForDisable.length === 0 ? (
                <div className="text-center py-8 text-sm" style={{ color: COLORS.textDim }}>
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.primary }} />
                  لا توجد مصادر مرشحة للتعطيل
                </div>
              ) : (
                <div className="space-y-2">
                  {data.candidatesForDisable.map((s, i) => (
                    <SourceRow key={s.sourceId + i} source={s} rank={i + 1} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: All Sources ───────────────────────────── */}
        <TabsContent value="sources">
          <div
            className="rounded-xl p-4"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: COLORS.text }}>
                <Layers className="w-4 h-4" style={{ color: COLORS.blue }} />
                كل المصادر ({data.allSources.length})
              </h3>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>
                مرتبة حسب الجودة (الأعلى أولاً)
              </span>
            </div>
            <div className="space-y-2">
              {data.allSources.map((s, i) => (
                <SourceRow key={s.sourceId + i} source={s} rank={i + 1} />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Productive ────────────────────────────── */}
        <TabsContent value="productive" className="space-y-4">
          <div
            className="rounded-xl p-4"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
          >
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.primary }} />
              أعلى 10 مصادر إنتاجاً
            </h3>
            <div className="space-y-2">
              {data.topProductiveSources.map((s, i) => (
                <SourceRow key={s.sourceId + i} source={s} rank={i + 1} />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Issues ────────────────────────────────── */}
        <TabsContent value="issues" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              className="rounded-xl p-4"
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
                <Filter className="w-4 h-4" style={{ color: COLORS.amber }} />
                أعلى 10 مصادر بمعدل تكرار عالٍ
              </h3>
              <div className="space-y-2">
                {data.topNoisySources.length === 0 ? (
                  <div className="text-center py-6 text-sm" style={{ color: COLORS.textDim }}>
                    لا توجد مصادر صاخبة
                  </div>
                ) : (
                  data.topNoisySources.map((s, i) => (
                    <SourceRow key={s.sourceId + i} source={s} rank={i + 1} />
                  ))
                )}
              </div>
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
                <XCircle className="w-4 h-4" style={{ color: COLORS.red }} />
                أعلى 10 مصادر بمعدل فشل عالٍ
              </h3>
              <div className="space-y-2">
                {data.topFailingSources.length === 0 ? (
                  <div className="text-center py-6 text-sm" style={{ color: COLORS.textDim }}>
                    لا توجد مصادر فاشلة
                  </div>
                ) : (
                  data.topFailingSources.map((s, i) => (
                    <SourceRow key={s.sourceId + i} source={s} rank={i + 1} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Candidates for disable */}
          <div
            className="rounded-xl p-4"
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.gold}40`,
            }}
          >
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.gold }}>
              <AlertTriangle className="w-4 h-4" />
              مصادر موصى بتعطيلها ({data.candidatesForDisable.length})
            </h3>
            {data.candidatesForDisable.length === 0 ? (
              <div className="text-center py-6 text-sm" style={{ color: COLORS.textDim }}>
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.primary }} />
                لا توجد مصادر تحتاج تعطيل — كل المصادر تنتج محتوى أصلي
              </div>
            ) : (
              <div className="space-y-2">
                {data.candidatesForDisable.map((s, i) => (
                  <SourceRow key={s.sourceId + i} source={s} rank={i + 1} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab: Trends ────────────────────────────────── */}
        <TabsContent value="trends" className="space-y-4">
          <div
            className="rounded-xl p-4"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
          >
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.primary }} />
              اتجاه النشر (آخر 24 ساعة)
            </h3>
            <PublishingTrendChart trend={data.publishingTrend} />
          </div>

          <div
            className="rounded-xl p-4"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
          >
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
              <Zap className="w-4 h-4" style={{ color: COLORS.amber }} />
              أسباب الرفض التفصيلية
            </h3>
            <RejectionReasonsChart reasons={data.rejectionReasons} />
            <div className="mt-4 text-xs space-y-1" style={{ color: COLORS.textMuted }}>
              <p>
                <strong style={{ color: COLORS.primary }}>Pre-LLM dedup</strong>: توفير استدعاءات LLM برفض التكرار مبكراً
              </p>
              <p>
                <strong style={{ color: COLORS.red }}>LLM call failed</strong>: فشل كل مزودي الـ LLM — يحتاج إصلاح API keys
              </p>
              <p>
                <strong style={{ color: COLORS.amber }}>LLM parse failed</strong>: الـ LLM رجع JSON غير صالح
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Footer ────────────────────────────────────────── */}
      <div className="mt-6 pt-4 border-t text-center text-[11px]" style={{ borderColor: COLORS.border, color: COLORS.textDim }}>
        <p>
          التحليلات تُحدّث تلقائياً كل 60 ثانية • النافذة الزمنية: {data.windowDays} أيام
        </p>
        <p className="mt-1">
          مصدر البيانات: <code className="px-1 py-0.5 rounded" style={{ background: COLORS.card, color: COLORS.primary }}>
            /api/agency-analytics
          </code>
        </p>
      </div>
    </div>
  );
}
