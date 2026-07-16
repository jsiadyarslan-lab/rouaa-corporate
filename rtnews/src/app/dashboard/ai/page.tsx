// ─── Merged AI Dashboard ───────────────────────────────────────
// Combines AI Providers (formerly ai-diagnostics), Haiku Usage, and AI Costs
// into a single tabbed dashboard with glassmorphism style.
// RTL direction. Arabic labels.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity, Bot, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Clock, Zap, Server, Shield, Cpu,
  ChevronDown, ChevronUp, Info, Wifi, WifiOff,
  ArrowDownRight, Sparkles, DollarSign, Brain,
  Globe, Settings2, TrendingDown, TrendingUp,
  PiggyBank, BarChart3, Languages, Image, Flame,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

// ── Providers (formerly ai-diagnostics) ──
interface ProviderResult {
  provider: string;
  available: boolean;
  model: string;
  directTest: 'success' | 'failed' | 'skipped';
  duration?: number;
  content?: string;
  error?: string;
  actualUrl?: string;
}

interface V68Health {
  provider: string;
  available: boolean;
  model: string;
  healthy: boolean;
  successCount: number;
  failureCount: number;
  avgLatencyMs: number;
  consecutiveFailures: number;
  lastSuccess: string | null;
  lastFailure: string | null;
}

interface DiagnosticsData {
  version: string;
  v68Config: {
    defaultModel: string;
    providerPriority: string[];
    pipeline: string;
  };
  envDiagnostics: Record<string, string>;
  envWarnings: string[];
  summary: {
    total: number;
    available: number;
    working: number;
    failed: number;
    unavailable: number;
    pipelineCanFunction: boolean;
    recommendedProvider: string;
  };
  providers: ProviderResult[];
  v68Health: V68Health[];
  timestamp: string;
}

// ── Haiku Usage ──
interface HaikuUsageData {
  summary: {
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCost: number;
    avgLatencyMs: number;
    successRate: number;
    model: string;
    pricingPer1M: { input: number; output: number };
  };
  dailyUsage: { date: string; calls: number; tokens: number; cost: number }[];
  byOperation: Record<string, { calls: number; tokens: number; cost: number }>;
  costProjection: { daily: number; weekly: number; monthly: number };
}

// ── AI Costs ──
interface ProviderStat {
  provider: string;
  name: string;
  nameAr: string;
  color: string;
  freeTier: string;
  calls: number;
  successCount: number;
  failCount: number;
  totalDuration: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
  avgDuration: number;
  successRate: number;
}

interface OperationCost {
  count: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
}

interface DailyUsageCost {
  date: string;
  calls: number;
  articles: number;
}

interface CostData {
  period: string;
  summary: {
    totalArticles: number;
    readyArticles: number;
    pendingArticles: number;
    analyzedArticles: number;
    imagedArticles: number;
    translatedArticles: number;
    totalAICalls: number;
    successfulCalls: number;
    failedCalls: number;
    successRate: number;
    actualCost: number;
    hypotheticalCostGroq: number;
    hypotheticalCostBedrock: number;
    savingsVsGroq: number;
    savingsVsBedrock: number;
  };
  providerStats: ProviderStat[];
  operationCosts: {
    translation: OperationCost;
    analysis: OperationCost;
    contentGeneration: OperationCost;
    imageGeneration: OperationCost;
  };
  dailyUsage: DailyUsageCost[];
}

// V68 Cost types
interface V68CostEntry {
  provider: string;
  model: string;
  inputCostPer1M: number;
  outputCostPer1M: number;
  currency: string;
  notes: string;
  available: boolean;
  healthy: boolean;
  avgLatencyMs: number;
}

interface V68MonthlyEstimate {
  provider: string;
  model: string;
  monthlyCost: number;
  currency: string;
  available: boolean;
  healthy: boolean;
}

interface V68CostsData {
  version: string;
  defaultModel: string;
  providerPriority: string[];
  costs: V68CostEntry[];
  monthlyEstimates: V68MonthlyEstimate[];
  recommendation: {
    provider: string;
    model: string;
    reason: string;
    monthlyCost: number;
  };
  assumptions: {
    dailyArticles: number;
    avgInputTokens: number;
    avgOutputTokens: number;
    daysPerMonth: number;
    note: string;
  };
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function maskDisplay(val: string): string {
  if (val === '(not set)') return '❌ غير محدد';
  if (val.includes('***')) return '✅ محدد';
  return val;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'أبداً';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'الآن';
  if (diff < 3600000) return `منذ ${Math.floor(diff / 60000)} دقيقة`;
  if (diff < 86400000) return `منذ ${Math.floor(diff / 3600000)} ساعة`;
  return `منذ ${Math.floor(diff / 86400000)} يوم`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('ar-SA');
}

function formatCost(n: number): string {
  if (n === 0) return '$0.00';
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

const OP_LABELS: Record<string, { label: string; color: string }> = {
  'unified-processing': { label: 'معالجة موحدة (ترجمة+تحليل)', color: '#00E5FF' },
  'translation': { label: 'ترجمة', color: '#8B5CF6' },
  'analysis': { label: 'تحليل مالي', color: '#00C896' },
  'content-generation': { label: 'توليد محتوى', color: '#FFB800' },
  'other': { label: 'أخرى', color: '#64748B' },
};

const COST_PERIODS = [
  { value: '24h', label: '24 ساعة' },
  { value: '7d', label: '7 أيام' },
  { value: '30d', label: '30 يوم' },
  { value: 'all', label: 'الكل' },
];

// Mini bar chart component
function MiniBarChart({ data, color }: { data: { value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-0.5 h-20" style={{ direction: 'ltr' }}>
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all duration-300"
          style={{
            height: `${Math.max((d.value / max) * 100, 2)}%`,
            background: color,
            opacity: 0.7,
            minWidth: 4,
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab definitions
// ═══════════════════════════════════════════════════════════════

type TabKey = 'providers' | 'haiku' | 'costs';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'providers', label: 'مزودو الذكاء الاصطناعي', icon: Activity },
  { key: 'haiku', label: 'استهلاك Haiku', icon: Flame },
  { key: 'costs', label: 'تكاليف AI', icon: DollarSign },
];

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function AiDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('costs');

  // Providers data
  const [diagData, setDiagData] = useState<DiagnosticsData | null>(null);
  const [diagLoading, setDiagLoading] = useState(true);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [showEnvDetails, setShowEnvDetails] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  // Haiku data
  const [haikuData, setHaikuData] = useState<HaikuUsageData | null>(null);
  const [haikuLoading, setHaikuLoading] = useState(true);
  const [haikuError, setHaikuError] = useState<string | null>(null);

  // Costs data
  const [costData, setCostData] = useState<CostData | null>(null);
  const [v68Costs, setV68Costs] = useState<V68CostsData | null>(null);
  const [costsLoading, setCostsLoading] = useState(true);
  const [costPeriod, setCostPeriod] = useState('30d');

  // ── Fetch Providers ──
  const fetchProviders = useCallback(async () => {
    setDiagLoading(true);
    setDiagError(null);
    try {
      const res = await fetch('/api/ai/diagnostics');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      setDiagData(await res.json());
    } catch (err: any) {
      setDiagError(err.message);
    } finally {
      setDiagLoading(false);
    }
  }, []);

  // ── Fetch Haiku ──
  const fetchHaiku = useCallback(async () => {
    setHaikuLoading(true);
    setHaikuError(null);
    try {
      const res = await fetch('/api/ai/haiku-usage');
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.summary) {
        setHaikuData(json);
      } else if (json.error) {
        setHaikuError(json.error);
      } else {
        setHaikuError('بيانات غير متوقعة من الخادم');
      }
    } catch (err: any) {
      setHaikuError(err.message || 'فشل في تحميل البيانات');
    } finally {
      setHaikuLoading(false);
    }
  }, []);

  // ── Fetch Costs ──
  const fetchCosts = useCallback(async () => {
    setCostsLoading(true);
    try {
      const [legacyRes, v68Res] = await Promise.allSettled([
        fetch(`/api/admin/ai-costs?period=${costPeriod}`),
        fetch('/api/ai/costs'),
      ]);
      if (legacyRes.status === 'fulfilled' && legacyRes.value.ok) {
        setCostData(await legacyRes.value.json());
      }
      if (v68Res.status === 'fulfilled' && v68Res.value.ok) {
        setV68Costs(await v68Res.value.json());
      }
    } catch (err) {
      console.error('Failed to fetch AI cost data:', err);
    } finally {
      setCostsLoading(false);
    }
  }, [costPeriod]);

  // ── Initial fetch based on active tab ──
  useEffect(() => {
    if (activeTab === 'providers') fetchProviders();
    else if (activeTab === 'haiku') fetchHaiku();
    else if (activeTab === 'costs') fetchCosts();
  }, [activeTab, fetchProviders, fetchHaiku, fetchCosts]);

  // ── Auto-refresh haiku every 60s when visible ──
  useEffect(() => {
    if (activeTab !== 'haiku' || !haikuData) return;
    const interval = setInterval(fetchHaiku, 60000);
    return () => clearInterval(interval);
  }, [activeTab, haikuData, fetchHaiku]);

  // ── Global refresh for current tab ──
  const refreshCurrentTab = useCallback(() => {
    if (activeTab === 'providers') fetchProviders();
    else if (activeTab === 'haiku') fetchHaiku();
    else if (activeTab === 'costs') fetchCosts();
  }, [activeTab, fetchProviders, fetchHaiku, fetchCosts]);

  const isTabLoading = activeTab === 'providers' ? diagLoading : activeTab === 'haiku' ? haikuLoading : costsLoading;

  // ═══════════════════════════════════════════════════════════
  // Tab: Providers
  // ═══════════════════════════════════════════════════════════

  const renderProviders = () => {
    if (diagLoading && !diagData) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
          </div>
          <div className="skeleton h-72 rounded-xl" />
        </div>
      );
    }

    if (diagError && !diagData) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle size={48} style={{ color: 'var(--bear)' }} />
          <p className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>فشل تحميل التشخيصات</p>
          <p className="text-[12px]" style={{ color: 'var(--text3)' }}>{diagError}</p>
          <Button onClick={fetchProviders} variant="outline" className="gap-2">
            <RefreshCw size={14} /> إعادة المحاولة
          </Button>
        </div>
      );
    }

    if (!diagData) return null;

    const { v68Config, summary, providers, v68Health, envWarnings } = diagData;

    return (
      <div className="space-y-6">
        {/* V68 Config Banner */}
        <Card className="border-0" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(139,92,246,0.06) 100%)', border: '1px solid rgba(0,229,255,0.15)' }}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>النموذج الافتراضي</span>
                <code className="text-[11px] font-mono px-2 py-1 rounded" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)' }}>
                  {v68Config.defaultModel}
                </code>
              </div>
              <div>
                <span className="text-[10px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>سلسلة الاحتياط</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {v68Config.providerPriority.map((p, i) => (
                    <span key={p} className="flex items-center gap-1">
                      <Badge className="text-[9px]" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        {i + 1}. {p}
                      </Badge>
                      {i < v68Config.providerPriority.length - 1 && <ArrowDownRight size={10} style={{ color: 'var(--text4)' }} />}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>خط الأنابيب</span>
                <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>
                  {v68Config.pipeline}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'إجمالي المزودين', value: summary.total, icon: Server, color: '#8B5CF6' },
            { label: 'متاح', value: summary.available, icon: Wifi, color: '#00E5FF' },
            { label: 'يعمل', value: summary.working, icon: CheckCircle2, color: '#00C896' },
            { label: 'فاشل', value: summary.failed, icon: XCircle, color: '#F43F5E' },
            { label: 'غير متاح', value: summary.unavailable, icon: WifiOff, color: '#64748B' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>{label}</span>
                </div>
                <div className="font-mono-price text-[26px] font-bold" style={{ color }}>{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pipeline Status */}
        <Card className="border-0" style={{ background: summary.pipelineCanFunction ? 'rgba(0,200,150,0.06)' : 'rgba(244,63,94,0.06)', border: `1px solid ${summary.pipelineCanFunction ? 'rgba(0,200,150,0.2)' : 'rgba(244,63,94,0.2)'}` }}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {summary.pipelineCanFunction ? (
                <CheckCircle2 size={24} style={{ color: 'var(--bull)' }} />
              ) : (
                <AlertTriangle size={24} style={{ color: 'var(--bear)' }} />
              )}
              <div>
                <span className="text-[14px] font-bold" style={{ color: summary.pipelineCanFunction ? 'var(--bull)' : 'var(--bear)' }}>
                  {summary.pipelineCanFunction ? 'خط الأنابيب يعمل' : 'خط الأنابيب متوقف'}
                </span>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
                  {summary.pipelineCanFunction
                    ? `المزود الموصى به: ${summary.recommendedProvider}`
                    : 'لا يوجد مزود يعمل — تحقق من مفاتيح API'}
                </p>
              </div>
            </div>
            <Badge className="text-[10px] gap-1" style={{
              background: summary.pipelineCanFunction ? 'rgba(0,200,150,0.1)' : 'rgba(244,63,94,0.1)',
              color: summary.pipelineCanFunction ? 'var(--bull)' : 'var(--bear)',
              border: `1px solid ${summary.pipelineCanFunction ? 'rgba(0,200,150,0.2)' : 'rgba(244,63,94,0.2)'}`,
            }}>
              {summary.pipelineCanFunction ? <Wifi size={10} /> : <WifiOff size={10} />}
              {summary.working}/{summary.total} يعمل
            </Badge>
          </CardContent>
        </Card>

        {/* Provider Details */}
        <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--cyan2)' }}>
                <Bot size={16} style={{ color: 'var(--cyan)' }} />
              </div>
              تفاصيل المزودين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {providers.map((provider) => {
              const health = v68Health.find(h => h.provider === provider.provider);
              const isExpanded = expandedProvider === provider.provider;
              const isPriority = v68Config.providerPriority.includes(provider.provider);
              const priorityIndex = v68Config.providerPriority.indexOf(provider.provider);

              return (
                <div key={provider.provider} className="rounded-xl transition-all" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <button
                    className="w-full flex items-center gap-3 p-3 text-right"
                    onClick={() => setExpandedProvider(isExpanded ? null : provider.provider)}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                      background: provider.directTest === 'success' ? 'rgba(0,200,150,0.1)' :
                        provider.directTest === 'failed' ? 'rgba(244,63,94,0.1)' :
                          provider.available ? 'rgba(255,184,0,0.1)' : 'rgba(100,116,139,0.1)',
                    }}>
                      {provider.directTest === 'success' ? <CheckCircle2 size={18} style={{ color: 'var(--bull)' }} /> :
                        provider.directTest === 'failed' ? <XCircle size={18} style={{ color: 'var(--bear)' }} /> :
                          provider.available ? <AlertTriangle size={18} style={{ color: '#FFB800' }} /> :
                            <WifiOff size={18} style={{ color: 'var(--text4)' }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{provider.provider}</span>
                        {isPriority && (
                          <Badge className="text-[8px] gap-0.5" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
                            <Sparkles size={7} /> #{priorityIndex + 1}
                          </Badge>
                        )}
                        {health && !health.healthy && (
                          <Badge className="text-[8px]" style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--bear)', border: '1px solid rgba(244,63,94,0.2)' }}>
                            غير صحي
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] font-mono block truncate" style={{ color: 'var(--text4)' }}>{provider.model}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {provider.duration && (
                        <div className="text-center">
                          <span className="text-[9px] block" style={{ color: 'var(--text4)' }}>الوقت</span>
                          <span className="font-mono text-[11px] font-bold" style={{ color: provider.duration < 2000 ? 'var(--bull)' : provider.duration < 5000 ? '#FFB800' : 'var(--bear)' }}>
                            {formatDuration(provider.duration)}
                          </span>
                        </div>
                      )}
                      {health && health.avgLatencyMs > 0 && (
                        <div className="text-center">
                          <span className="text-[9px] block" style={{ color: 'var(--text4)' }}>متوسط</span>
                          <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--text2)' }}>
                            {formatDuration(health.avgLatencyMs)}
                          </span>
                        </div>
                      )}
                      {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--text4)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text4)' }} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold block" style={{ color: 'var(--text3)' }}>نتيجة الاختبار المباشر</span>
                          {provider.directTest === 'success' && provider.content && (
                            <div className="p-2 rounded-lg text-[11px]" style={{ background: 'rgba(0,200,150,0.06)', color: 'var(--text2)' }}>
                              {provider.content.slice(0, 200)}
                            </div>
                          )}
                          {provider.directTest === 'failed' && provider.error && (
                            <div className="p-2 rounded-lg text-[11px]" style={{ background: 'rgba(244,63,94,0.06)', color: 'var(--bear)' }}>
                              {provider.error.slice(0, 300)}
                            </div>
                          )}
                          {provider.directTest === 'skipped' && (
                            <div className="p-2 rounded-lg text-[11px]" style={{ background: 'var(--bg2)', color: 'var(--text4)' }}>
                              تم تخطي الاختبار — المزود غير متاح (مفتاح API غير محدد)
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold block" style={{ color: 'var(--text3)' }}>تفاصيل</span>
                          {provider.actualUrl && (
                            <div className="flex items-center gap-2 text-[10px]">
                              <Globe size={10} style={{ color: 'var(--text4)' }} />
                              <code className="truncate" style={{ color: 'var(--text4)' }}>{provider.actualUrl}</code>
                            </div>
                          )}
                          {health && (
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="p-2 rounded" style={{ background: 'var(--bg2)' }}>
                                <span style={{ color: 'var(--text4)' }}>نجاح:</span>
                                <span className="font-bold mr-1" style={{ color: 'var(--bull)' }}>{health.successCount}</span>
                              </div>
                              <div className="p-2 rounded" style={{ background: 'var(--bg2)' }}>
                                <span style={{ color: 'var(--text4)' }}>فشل:</span>
                                <span className="font-bold mr-1" style={{ color: 'var(--bear)' }}>{health.failureCount}</span>
                              </div>
                              <div className="p-2 rounded" style={{ background: 'var(--bg2)' }}>
                                <span style={{ color: 'var(--text4)' }}>آخر نجاح:</span>
                                <span className="font-bold mr-1" style={{ color: 'var(--text2)' }}>{timeAgo(health.lastSuccess)}</span>
                              </div>
                              <div className="p-2 rounded" style={{ background: 'var(--bg2)' }}>
                                <span style={{ color: 'var(--text4)' }}>فشل متتالي:</span>
                                <span className="font-bold mr-1" style={{ color: health.consecutiveFailures > 0 ? 'var(--bear)' : 'var(--bull)' }}>{health.consecutiveFailures}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Environment Warnings */}
        {envWarnings.length > 0 && (
          <Card className="border-0" style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: '#FFB800' }}>
                <AlertTriangle size={16} />
                تحذيرات متغيرات البيئة ({envWarnings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {envWarnings.map((warning, i) => (
                <div key={i} className="p-2 rounded-lg text-[11px] flex items-start gap-2" style={{ background: 'rgba(255,184,0,0.08)' }}>
                  <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" style={{ color: '#FFB800' }} />
                  <span style={{ color: 'var(--text2)' }}>{warning}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Environment Variables (collapsible) */}
        <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardHeader className="pb-2">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setShowEnvDetails(!showEnvDetails)}
            >
              <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                <Settings2 size={16} style={{ color: 'var(--text3)' }} />
                متغيرات البيئة (مخفية)
              </CardTitle>
              {showEnvDetails ? <ChevronUp size={16} style={{ color: 'var(--text4)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text4)' }} />}
            </button>
          </CardHeader>
          {showEnvDetails && (
            <CardContent>
              <ScrollArea className="max-h-[400px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(diagData.envDiagnostics).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--bg4)' }}>
                      <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text2)' }}>{key}</span>
                      <span className="text-[10px]" style={{ color: value.includes('not set') ? 'var(--text4)' : 'var(--bull)' }}>
                        {maskDisplay(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // Tab: Haiku Usage
  // ═══════════════════════════════════════════════════════════

  const renderHaiku = () => {
    if (haikuLoading && !haikuData) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="skeleton h-72 rounded-xl" />
            <div className="skeleton h-72 rounded-xl" />
          </div>
        </div>
      );
    }

    if (haikuError && !haikuData) {
      return (
        <Card className="border-0" style={{ background: 'rgba(255,77,106,0.06)', border: '1px solid rgba(255,77,106,0.15)' }}>
          <CardContent className="p-6 text-center">
            <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: 'var(--bear)' }} />
            <p className="text-[14px] mb-2" style={{ color: 'var(--text)' }}>فشل في تحميل بيانات الاستهلاك</p>
            <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>{haikuError}</p>
            <Button onClick={fetchHaiku} variant="outline" className="gap-2">
              <RefreshCw size={14} /> إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      );
    }

    const summary = haikuData?.summary || {
      totalCalls: 0, totalInputTokens: 0, totalOutputTokens: 0,
      estimatedCost: 0, avgLatencyMs: 0, successRate: 0,
      model: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
      pricingPer1M: { input: 1.00, output: 5.00 },
    };
    const dailyUsage = haikuData?.dailyUsage || [];
    const byOperation = haikuData?.byOperation || {};
    const costProjection = haikuData?.costProjection || { daily: 0, weekly: 0, monthly: 0 };
    const totalTokens = summary.totalInputTokens + summary.totalOutputTokens;

    return (
      <div className="space-y-6">
        {/* Model Info Banner */}
        <Card className="border-0" style={{
          background: 'linear-gradient(135deg, rgba(255,153,0,0.08) 0%, rgba(255,153,0,0.02) 100%)',
          border: '1px solid rgba(255,153,0,0.15)',
        }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                  background: 'rgba(255,153,0,0.12)',
                  border: '1px solid rgba(255,153,0,0.2)',
                }}>
                  <Bot size={24} style={{ color: '#FF9900' }} />
                </div>
                <div>
                  <div className="text-[14px] font-bold font-mono" style={{ color: 'var(--text)' }}>
                    {summary.model}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
                    نموذج Claude 4.5 Haiku عبر AWS Bedrock (Cross-Region Inference)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="font-mono-price text-[16px] font-bold" style={{ color: '#FF9900' }}>${summary.pricingPer1M.input}</div>
                  <div className="text-[9px]" style={{ color: 'var(--text4)' }}>إدخال/1M توكن</div>
                </div>
                <div className="text-center">
                  <div className="font-mono-price text-[16px] font-bold" style={{ color: '#FF9900' }}>${summary.pricingPer1M.output}</div>
                  <div className="text-[9px]" style={{ color: 'var(--text4)' }}>إخراج/1M توكن</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0" style={{
            background: 'linear-gradient(135deg, rgba(255,153,0,0.08) 0%, rgba(255,153,0,0.02) 100%)',
            border: '1px solid rgba(255,153,0,0.15)',
          }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,153,0,0.12)' }}>
                  <DollarSign size={18} style={{ color: '#FF9900' }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>التكلفة التقديرية (7 أيام)</span>
              </div>
              <div className="font-mono-price text-[28px] font-bold" style={{ color: '#FF9900' }}>
                ${summary.estimatedCost.toFixed(2)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
                  ~${costProjection.daily.toFixed(2)}/يوم
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
                  | ~${costProjection.monthly.toFixed(0)}/شهر
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0" style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.02) 100%)',
            border: '1px solid rgba(139,92,246,0.15)',
          }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)' }}>
                  <Bot size={18} style={{ color: '#8B5CF6' }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>إجمالي المكالمات</span>
              </div>
              <div className="font-mono-price text-[28px] font-bold" style={{ color: '#8B5CF6' }}>
                {formatNumber(summary.totalCalls)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {summary.successRate >= 90 ? (
                  <CheckCircle2 size={11} style={{ color: 'var(--bull)' }} />
                ) : (
                  <AlertTriangle size={11} style={{ color: '#FFB800' }} />
                )}
                <span className="text-[10px]" style={{ color: summary.successRate >= 90 ? 'var(--bull)' : '#FFB800' }}>
                  نسبة النجاح {summary.successRate}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0" style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.08) 0%, rgba(0,229,255,0.02) 100%)',
            border: '1px solid rgba(0,229,255,0.15)',
          }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.12)' }}>
                  <Activity size={18} style={{ color: '#00E5FF' }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>إجمالي التوكنات</span>
              </div>
              <div className="font-mono-price text-[28px] font-bold" style={{ color: '#00E5FF' }}>
                {formatNumber(totalTokens)}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
                  إدخال: {formatNumber(summary.totalInputTokens)}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
                  إخراج: {formatNumber(summary.totalOutputTokens)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0" style={{
            background: 'linear-gradient(135deg, rgba(0,200,150,0.08) 0%, rgba(0,200,150,0.02) 100%)',
            border: '1px solid rgba(0,200,150,0.15)',
          }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,200,150,0.12)' }}>
                  <Clock size={18} style={{ color: '#00C896' }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>متوسط التأخير</span>
              </div>
              <div className="font-mono-price text-[28px] font-bold" style={{ color: '#00C896' }}>
                {summary.avgLatencyMs > 0 ? `${summary.avgLatencyMs}ms` : '-'}
              </div>
              <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
                {summary.avgLatencyMs > 0
                  ? summary.avgLatencyMs < 2000 ? 'سريع' : summary.avgLatencyMs < 5000 ? 'متوسط' : 'بطيء'
                  : 'لا توجد بيانات'}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Cost Projection */}
        <Card className="border-0" style={{
          background: 'linear-gradient(135deg, rgba(255,153,0,0.04) 0%, rgba(139,92,246,0.04) 100%)',
          border: '1px solid rgba(255,153,0,0.12)',
        }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,153,0,0.1)' }}>
                <TrendingUp size={16} style={{ color: '#FF9900' }} />
              </div>
              تقدير التكاليف المستقبلية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,153,0,0.06)', border: '1px solid rgba(255,153,0,0.1)' }}>
                <span className="text-[11px] font-bold block mb-2" style={{ color: 'var(--text3)' }}>يومياً</span>
                <div className="font-mono-price text-[24px] font-bold" style={{ color: '#FF9900' }}>
                  ${costProjection.daily.toFixed(2)}
                </div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <span className="text-[11px] font-bold block mb-2" style={{ color: 'var(--text3)' }}>أسبوعياً</span>
                <div className="font-mono-price text-[24px] font-bold" style={{ color: '#8B5CF6' }}>
                  ${costProjection.weekly.toFixed(2)}
                </div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.1)' }}>
                <span className="text-[11px] font-bold block mb-2" style={{ color: 'var(--text3)' }}>شهرياً</span>
                <div className="font-mono-price text-[24px] font-bold" style={{ color: '#00C896' }}>
                  ${costProjection.monthly.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-lg flex items-center gap-2" style={{ background: 'var(--bg4)' }}>
              <Info size={12} style={{ color: 'var(--text4)' }} />
              <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
                التقدير مبني على متوسط الاستهلاك خلال آخر 7 أيام. التكلفة الفعلية قد تختلف حسب حجم وطبيعة المحتوى.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Daily Usage Trend */}
        <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.1)' }}>
                <BarChart3 size={16} style={{ color: '#00E5FF' }} />
              </div>
              الاستهلاك اليومي (7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyUsage.length > 0 ? (
              <div className="space-y-6">
                {/* Cost Chart */}
                <div>
                  <span className="text-[11px] font-bold mb-2 block" style={{ color: 'var(--text3)' }}>التكلفة اليومية ($)</span>
                  <div className="flex items-end gap-2 min-h-[120px]" style={{ direction: 'ltr' }}>
                    {dailyUsage.map((d, i) => {
                      const maxCost = Math.max(...dailyUsage.map(x => x.cost), 0.01);
                      const pct = Math.max((d.cost / maxCost) * 100, 4);
                      return (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1 group">
                          <span className="font-mono-price text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#FF9900' }}>
                            ${d.cost.toFixed(2)}
                          </span>
                          <div className="w-full rounded-t transition-all duration-500" style={{
                            height: `${pct}px`,
                            background: 'linear-gradient(180deg, #FF9900, #FF990066)',
                            minWidth: 12,
                          }} />
                          <span className="text-[9px] font-medium" style={{ color: 'var(--text4)' }}>
                            {formatDate(d.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tokens Chart */}
                <div>
                  <span className="text-[11px] font-bold mb-2 block" style={{ color: 'var(--text3)' }}>التوكنات المستهلكة</span>
                  <div className="flex items-end gap-2 min-h-[100px]" style={{ direction: 'ltr' }}>
                    {dailyUsage.map((d, i) => {
                      const maxTokens = Math.max(...dailyUsage.map(x => x.tokens), 1);
                      const pct = Math.max((d.tokens / maxTokens) * 100, 4);
                      return (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1 group">
                          <span className="font-mono-price text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#00E5FF' }}>
                            {formatNumber(d.tokens)}
                          </span>
                          <div className="w-full rounded-t transition-all duration-500" style={{
                            height: `${pct}px`,
                            background: 'linear-gradient(180deg, #00E5FF, #00E5FF66)',
                            minWidth: 12,
                          }} />
                          <span className="text-[9px] font-medium" style={{ color: 'var(--text4)' }}>
                            {formatDate(d.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Calls Chart */}
                <div>
                  <span className="text-[11px] font-bold mb-2 block" style={{ color: 'var(--text3)' }}>عدد المكالمات</span>
                  <div className="flex items-end gap-2 min-h-[80px]" style={{ direction: 'ltr' }}>
                    {dailyUsage.map((d, i) => {
                      const maxCalls = Math.max(...dailyUsage.map(x => x.calls), 1);
                      const pct = Math.max((d.calls / maxCalls) * 100, 4);
                      return (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1 group">
                          <span className="font-mono-price text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#8B5CF6' }}>
                            {d.calls}
                          </span>
                          <div className="w-full rounded-t transition-all duration-500" style={{
                            height: `${pct}px`,
                            background: 'linear-gradient(180deg, #8B5CF6, #8B5CF666)',
                            minWidth: 12,
                          }} />
                          <span className="text-[9px] font-medium" style={{ color: 'var(--text4)' }}>
                            {formatDate(d.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Data Table */}
                <div className="overflow-x-auto">
                  <div className="min-w-[500px]">
                    <div className="grid grid-cols-4 gap-3 px-3 py-2 text-[10px] font-bold" style={{ color: 'var(--text3)' }}>
                      <span>التاريخ</span>
                      <span className="text-center">المكالمات</span>
                      <span className="text-center">التوكنات</span>
                      <span className="text-center">التكلفة</span>
                    </div>
                    {dailyUsage.map((d, i) => (
                      <div key={i} className="grid grid-cols-4 gap-3 px-3 py-2.5 rounded-lg items-center" style={{ borderBottom: '1px solid var(--border)' }}>
                        <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{formatDate(d.date)}</span>
                        <span className="font-mono-price text-[11px] text-center" style={{ color: 'var(--text2)' }}>{d.calls}</span>
                        <span className="font-mono-price text-[11px] text-center" style={{ color: 'var(--text2)' }}>{formatNumber(d.tokens)}</span>
                        <span className="font-mono-price text-[11px] text-center font-bold" style={{ color: '#FF9900' }}>${d.cost.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[12px]" style={{ color: 'var(--text3)' }}>
                لا توجد بيانات استهلاك في آخر 7 أيام
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operations Breakdown */}
        <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,200,150,0.1)' }}>
                <Zap size={16} style={{ color: '#00C896' }} />
              </div>
              تفصيل العمليات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(byOperation).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(byOperation)
                  .sort(([, a], [, b]) => b.cost - a.cost)
                  .map(([op, opData]) => {
                    const opInfo = OP_LABELS[op] || { label: op, color: '#64748B' };
                    const maxCalls = Math.max(...Object.values(byOperation).map(v => v.calls), 1);
                    const barWidth = Math.max((opData.calls / maxCalls) * 100, 5);
                    return (
                      <div key={op} className="p-4 rounded-xl" style={{ background: 'var(--bg4)', border: `1px solid ${opInfo.color}15` }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-sm" style={{ background: opInfo.color }} />
                            <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{opInfo.label}</span>
                          </div>
                          <span className="font-mono-price text-[14px] font-bold" style={{ color: '#FF9900' }}>
                            ${opData.cost.toFixed(3)}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full mb-3" style={{ background: 'var(--bg2)' }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{
                            width: `${barWidth}%`,
                            background: `linear-gradient(90deg, ${opInfo.color}, ${opInfo.color}66)`,
                            minWidth: 4,
                          }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                            {opData.calls} مكالمة
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                            {formatNumber(opData.tokens)} توكن
                          </span>
                        </div>
                      </div>
                    );
                  })}

                <div className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'rgba(255,153,0,0.06)', border: '1px solid rgba(255,153,0,0.1)' }}>
                  <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>إجمالي العمليات</span>
                  <div className="flex items-center gap-4">
                    <span className="font-mono-price text-[11px]" style={{ color: 'var(--text2)' }}>
                      {Object.values(byOperation).reduce((s, v) => s + v.calls, 0)} مكالمة
                    </span>
                    <span className="font-mono-price text-[13px] font-bold" style={{ color: '#FF9900' }}>
                      ${Object.values(byOperation).reduce((s, v) => s + v.cost, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[12px]" style={{ color: 'var(--text3)' }}>
                لا توجد بيانات عمليات Haiku في آخر 7 أيام
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Reference */}
        <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.1)' }}>
                <Info size={16} style={{ color: '#FFB800' }} />
              </div>
              معلومات التسعير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)' }}>
                <div className="text-[11px] font-bold mb-2" style={{ color: 'var(--text3)' }}>توكنات الإدخال (Input)</div>
                <div className="font-mono-price text-[22px] font-bold" style={{ color: '#00E5FF' }}>
                  $1.00 <span className="text-[12px] font-normal" style={{ color: 'var(--text4)' }}>/ 1M توكن</span>
                </div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--text4)' }}>
                  النص المُرسل للنموذج (المحتوى الأصلي + التعليمات)
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.1)' }}>
                <div className="text-[11px] font-bold mb-2" style={{ color: 'var(--text3)' }}>توكنات الإخراج (Output)</div>
                <div className="font-mono-price text-[22px] font-bold" style={{ color: '#FF9900' }}>
                  $5.00 <span className="text-[12px] font-normal" style={{ color: 'var(--text4)' }}>/ 1M توكن</span>
                </div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--text4)' }}>
                  النص المُولَّد من النموذج (الترجمة + التحليل + المحتوى)
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={11} style={{ color: '#FF9900' }} />
                <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>ملاحظة حول تقدير التوكنات</span>
              </div>
              <span className="text-[9px] leading-relaxed block" style={{ color: 'var(--text4)' }}>
                التوكنات مُقدَّرة تقريبياً بناءً على طول النص: العربية ~2 حرف/توكن، الإنجليزية ~4 حرف/توكن.
                الأرقام الفعلية قد تختلف. لتقدير أكثر دقة، يُنصح بتفعيل تتبع التوكنات الفعلي من AWS CloudWatch.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // Tab: Costs
  // ═══════════════════════════════════════════════════════════

  const renderCosts = () => {
    if (costsLoading && !costData?.summary) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="skeleton h-72 rounded-xl" />
            <div className="skeleton h-72 rounded-xl" />
          </div>
        </div>
      );
    }

    if (!costData?.summary || !costData?.operationCosts) {
      return (
        <Card className="border-0" style={{ background: 'rgba(255,77,106,0.06)', border: '1px solid rgba(255,77,106,0.15)' }}>
          <CardContent className="p-6 text-center">
            <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: 'var(--bear)' }} />
            <p className="text-[14px] mb-2" style={{ color: 'var(--text)' }}>لا توجد بيانات تكاليف</p>
            <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>لم يتم تحميل بيانات التكاليف بعد</p>
            <Button onClick={fetchCosts} variant="outline" className="gap-2">
              <RefreshCw size={14} /> إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      );
    }

    const s = costData.summary;
    const ops = costData.operationCosts ?? {
      translation: { count: 0, estimatedInputTokens: 0, estimatedOutputTokens: 0, estimatedCost: 0 },
      analysis: { count: 0, estimatedInputTokens: 0, estimatedOutputTokens: 0, estimatedCost: 0 },
      contentGeneration: { count: 0, estimatedInputTokens: 0, estimatedOutputTokens: 0, estimatedCost: 0 },
      imageGeneration: { count: 0, estimatedInputTokens: 0, estimatedOutputTokens: 0, estimatedCost: 0 },
    };

    return (
      <div className="space-y-6">
        {/* Period selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {COST_PERIODS.map(p => (
            <Button
              key={p.value}
              variant={costPeriod === p.value ? 'default' : 'outline'}
              size="sm"
              className="text-[11px]"
              onClick={() => setCostPeriod(p.value)}
              style={costPeriod === p.value ? {
                background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
                color: 'white',
                border: 'none',
              } : {
                borderColor: 'var(--border)',
                color: 'var(--text2)',
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.08) 0%, rgba(0,229,255,0.02) 100%)', border: '1px solid rgba(0,229,255,0.15)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.12)' }}>
                  <DollarSign size={18} style={{ color: '#00E5FF' }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>التكلفة الفعلية</span>
              </div>
              <div className="font-mono-price text-[28px] font-bold" style={{ color: '#00E5FF' }}>
                {formatCost(s.actualCost)}
              </div>
              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                {s.actualCost === 0 ? 'جميع المزودين مجانيون' : 'تكلفة تقديرية'}
              </span>
            </CardContent>
          </Card>

          <Card className="border-0" style={{ background: 'linear-gradient(135deg, rgba(0,200,150,0.08) 0%, rgba(0,200,150,0.02) 100%)', border: '1px solid rgba(0,200,150,0.15)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,200,150,0.12)' }}>
                  <PiggyBank size={18} style={{ color: '#00C896' }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>التوفير</span>
              </div>
              <div className="font-mono-price text-[28px] font-bold" style={{ color: '#00C896' }}>
                {formatCost(s.savingsVsBedrock)}
              </div>
              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                مقارنة بـ AWS Bedrock
              </span>
            </CardContent>
          </Card>

          <Card className="border-0" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.02) 100%)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)' }}>
                  <Bot size={18} style={{ color: '#8B5CF6' }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>مكالمات AI</span>
              </div>
              <div className="font-mono-price text-[28px] font-bold" style={{ color: '#8B5CF6' }}>
                {formatNumber(s.totalAICalls)}
              </div>
              <span className="text-[10px]" style={{ color: 'var(--bull)' }}>
                {s.successRate}% نجاح
              </span>
            </CardContent>
          </Card>

          <Card className="border-0" style={{ background: 'linear-gradient(135deg, rgba(255,184,0,0.08) 0%, rgba(255,184,0,0.02) 100%)', border: '1px solid rgba(255,184,0,0.15)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.12)' }}>
                  <Zap size={18} style={{ color: '#FFB800' }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>مقالات معالجة</span>
              </div>
              <div className="font-mono-price text-[28px] font-bold" style={{ color: '#FFB800' }}>
                {formatNumber(s.readyArticles)}
              </div>
              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                من أصل {formatNumber(s.totalArticles)}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Cost Comparison & Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--cyan2)' }}>
                  <TrendingDown size={16} style={{ color: 'var(--cyan)' }} />
                </div>
                مقارنة التكاليف
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.15)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>التكلفة الفعلية (المزودون المجانيون)</span>
                  <span className="font-mono-price text-[18px] font-bold" style={{ color: 'var(--bull)' }}>
                    {formatCost(s.actualCost)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg4)' }}>
                  <div className="h-full rounded-full" style={{ width: '2%', background: 'var(--bull)', minWidth: 4 }} />
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ background: 'var(--bg4)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>لو استخدمت Groq فقط</span>
                  <span className="font-mono-price text-[16px] font-bold" style={{ color: '#FF6B35' }}>
                    {formatCost(s.hypotheticalCostGroq)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg2)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min((s.hypotheticalCostGroq / Math.max(s.hypotheticalCostBedrock, 0.01)) * 100, 100)}%`, background: '#FF6B35', minWidth: 4 }} />
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ background: 'var(--bg4)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>لو استخدمت AWS Bedrock (Haiku 4.5) فقط</span>
                  <span className="font-mono-price text-[16px] font-bold" style={{ color: '#FF9900' }}>
                    {formatCost(s.hypotheticalCostBedrock)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg2)' }}>
                  <div className="h-full rounded-full" style={{ width: '100%', background: '#FF9900' }} />
                </div>
              </div>

              <div className="p-3 rounded-lg flex items-center gap-3" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.1)' }}>
                <PiggyBank size={20} style={{ color: 'var(--bull)' }} />
                <div>
                  <span className="text-[12px] font-bold" style={{ color: 'var(--bull)' }}>
                    وفرت {formatCost(s.savingsVsBedrock)}
                  </span>
                  <span className="text-[10px] mr-2" style={{ color: 'var(--text3)' }}>
                    باستخدام المزودين المجانيين
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--purple2)' }}>
                  <Activity size={16} style={{ color: 'var(--purple)' }} />
                </div>
                تفصيل العمليات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: Languages, label: 'ترجمة عربية', op: ops.translation, color: '#00E5FF' },
                { icon: Brain, label: 'تحليل مالي AI', op: ops.analysis, color: '#8B5CF6' },
                { icon: BarChart3, label: 'توليد محتوى', op: ops.contentGeneration, color: '#00C896' },
                { icon: Image, label: 'توليد صور AI', op: ops.imageGeneration, color: '#FFB800' },
              ].map(({ icon: Icon, label, op, color }) => (
                <div key={label} className="p-3 rounded-xl flex items-center gap-4" style={{ background: 'var(--bg4)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{label}</span>
                      <span className="font-mono-price text-[14px] font-bold" style={{ color }}>{formatNumber(op.count)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                        ~{formatNumber(op.estimatedInputTokens + op.estimatedOutputTokens)} توكن
                      </span>
                      <span className="font-mono-price text-[10px] font-bold" style={{ color: op.estimatedCost > 0 ? 'var(--bear)' : 'var(--bull)' }}>
                        {formatCost(op.estimatedCost)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Provider Stats Table */}
        <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--cyan2)' }}>
                <Bot size={16} style={{ color: 'var(--cyan)' }} />
              </div>
              أداء المزودين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-8 gap-3 px-3 py-2 text-[10px] font-bold" style={{ color: 'var(--text3)' }}>
                  <span>المزود</span>
                  <span className="text-center">المكالمات</span>
                  <span className="text-center">النجاح</span>
                  <span className="text-center">متوسط الوقت</span>
                  <span className="text-center">التوكنات</span>
                  <span className="text-center">التكلفة التقديرية</span>
                  <span className="text-center">الطبقة المجانية</span>
                  <span className="text-center">الحالة</span>
                </div>
                {costData.providerStats.length > 0 ? costData.providerStats.map((provider) => (
                  <div key={provider.provider} className="grid grid-cols-8 gap-3 px-3 py-3 rounded-lg items-center transition-colors hover:bg-[var(--bg4)]" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: provider.color }} />
                      <span className="text-[12px] font-bold truncate" style={{ color: 'var(--text)' }}>{provider.nameAr}</span>
                    </div>
                    <span className="font-mono-price text-[12px] text-center" style={{ color: 'var(--text2)' }}>{formatNumber(provider.calls)}</span>
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-mono-price text-[12px]" style={{ color: provider.successRate >= 80 ? 'var(--bull)' : provider.successRate >= 50 ? '#eab308' : 'var(--bear)' }}>
                        {provider.successRate}%
                      </span>
                    </div>
                    <span className="font-mono-price text-[11px] text-center" style={{ color: 'var(--text3)' }}>{provider.avgDuration}ms</span>
                    <span className="font-mono-price text-[11px] text-center" style={{ color: 'var(--text3)' }}>
                      {formatNumber(provider.estimatedInputTokens + provider.estimatedOutputTokens)}
                    </span>
                    <span className="font-mono-price text-[12px] text-center font-bold" style={{ color: provider.estimatedCost > 0 ? 'var(--bear)' : 'var(--bull)' }}>
                      {formatCost(provider.estimatedCost)}
                    </span>
                    <span className="text-[10px] text-center" style={{ color: 'var(--text3)' }}>{provider.freeTier}</span>
                    <div className="flex justify-center">
                      <Badge className="text-[9px] gap-1" style={{
                        background: provider.calls > 0 ? 'rgba(0,200,150,0.1)' : 'rgba(100,116,139,0.1)',
                        color: provider.calls > 0 ? 'var(--bull)' : 'var(--text4)',
                        border: `1px solid ${provider.calls > 0 ? 'rgba(0,200,150,0.2)' : 'rgba(100,116,139,0.2)'}`,
                      }}>
                        {provider.calls > 0 ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                        {provider.calls > 0 ? 'نشط' : 'غير مستخدم'}
                      </Badge>
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center text-[12px]" style={{ color: 'var(--text3)' }}>
                    لا توجد بيانات استخدام في هذه الفترة
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Daily Usage Trend */}
        <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
                <BarChart3 size={16} style={{ color: 'var(--purple)' }} />
              </div>
              اتجاه الاستخدام اليومي (30 يوم)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {costData.dailyUsage.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold mb-2 block" style={{ color: 'var(--text3)' }}>المقالات المنشورة</span>
                  <MiniBarChart
                    data={costData.dailyUsage.map(d => ({ value: d.articles }))}
                    color="#00C896"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[8px]" style={{ color: 'var(--text4)' }}>{formatDate(costData.dailyUsage[0]?.date || '')}</span>
                    <span className="text-[8px]" style={{ color: 'var(--text4)' }}>اليوم</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[12px]" style={{ color: 'var(--text3)' }}>
                لا توجد بيانات كافية
              </div>
            )}
          </CardContent>
        </Card>

        {/* Provider Pricing Reference */}
        <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.1)' }}>
                <Info size={16} style={{ color: '#FFB800' }} />
              </div>
              أسعار المزودين (لكل مليون توكن)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-5 gap-3 px-3 py-2 text-[10px] font-bold" style={{ color: 'var(--text3)' }}>
                  <span>المزود</span>
                  <span className="text-center">إدخال/1M</span>
                  <span className="text-center">إخراج/1M</span>
                  <span className="text-center">صورة/طلب</span>
                  <span className="text-center">النوع</span>
                </div>
                {Object.entries((costData as any).providerPricing || {}).map(([key, pricing]: [string, any]) => (
                  <div key={key} className="grid grid-cols-5 gap-3 px-3 py-2.5 rounded-lg items-center" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: pricing.color }} />
                      <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{pricing.nameAr}</span>
                    </div>
                    <span className="font-mono-price text-[11px] text-center" style={{ color: pricing.inputPer1M === 0 ? 'var(--bull)' : 'var(--text2)' }}>
                      {pricing.inputPer1M === 0 ? 'مجاني' : `$${pricing.inputPer1M}`}
                    </span>
                    <span className="font-mono-price text-[11px] text-center" style={{ color: pricing.outputPer1M === 0 ? 'var(--bull)' : 'var(--text2)' }}>
                      {pricing.outputPer1M === 0 ? 'مجاني' : `$${pricing.outputPer1M}`}
                    </span>
                    <span className="font-mono-price text-[11px] text-center" style={{ color: pricing.imagePerCall === 0 ? 'var(--bull)' : 'var(--text2)' }}>
                      {pricing.imagePerCall === 0 ? 'مجاني' : `$${pricing.imagePerCall}`}
                    </span>
                    <span className="text-[10px] text-center" style={{ color: pricing.inputPer1M === 0 ? 'var(--bull)' : 'var(--text3)' }}>
                      {pricing.freeTier}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* V68 Cost Comparison */}
        {v68Costs && (
          <Card className="border-0" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.04) 0%, rgba(139,92,246,0.04) 100%)', border: '1px solid rgba(0,229,255,0.15)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(139,92,246,0.15))' }}>
                  <Sparkles size={16} style={{ color: 'var(--cyan)' }} />
                </div>
                مقارنة تكاليف V68
                <Badge className="text-[9px] gap-1" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
                  <Sparkles size={8} /> V68
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.15)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Cpu size={16} style={{ color: 'var(--bull)' }} />
                  <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>التوصية</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className="text-[11px] gap-1" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
                    {v68Costs.recommendation.provider}
                  </Badge>
                  <span style={{ color: 'var(--text4)' }}>←</span>
                  <span className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>{v68Costs.recommendation.model}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                    ~{formatCost(v68Costs.recommendation.monthlyCost)}/شهر
                  </span>
                </div>
                <p className="text-[10px] mt-2" style={{ color: 'var(--text3)' }}>{v68Costs.recommendation.reason}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold block mb-2" style={{ color: 'var(--text3)' }}>
                  التكلفة الشهرية التقديرية ({v68Costs.assumptions.dailyArticles.toLocaleString()} مقال/يوم)
                </span>
                <ScrollArea className="w-full">
                  <div className="min-w-[500px]">
                    <div className="grid grid-cols-4 gap-3 px-3 py-2 text-[9px] font-bold" style={{ color: 'var(--text4)' }}>
                      <span>المزود</span>
                      <span className="text-center">النموذج</span>
                      <span className="text-center">التكلفة/شهر</span>
                      <span className="text-center">الحالة</span>
                    </div>
                    {v68Costs.monthlyEstimates.map((est) => (
                      <div key={`${est.provider}-${est.model}`} className="grid grid-cols-4 gap-3 px-3 py-2 rounded-lg items-center" style={{ borderBottom: '1px solid var(--border)' }}>
                        <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{est.provider}</span>
                        <span className="text-[10px] text-center" style={{ color: 'var(--text3)' }}>{est.model}</span>
                        <span className="font-mono-price text-[11px] text-center font-bold" style={{ color: est.monthlyCost === 0 ? 'var(--bull)' : 'var(--text2)' }}>
                          {est.monthlyCost === 0 ? 'مجاني' : formatCost(est.monthlyCost)}
                        </span>
                        <div className="flex justify-center">
                          <Badge className="text-[8px] gap-1" style={{
                            background: est.available ? 'rgba(0,200,150,0.1)' : 'rgba(100,116,139,0.1)',
                            color: est.available ? 'var(--bull)' : 'var(--text4)',
                            border: `1px solid ${est.available ? 'rgba(0,200,150,0.2)' : 'rgba(100,116,139,0.2)'}`,
                          }}>
                            {est.available ? <CheckCircle2 size={8} /> : <XCircle size={8} />}
                            {est.available ? 'متاح' : 'غير محدد'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <span className="text-[10px] font-bold block mb-2" style={{ color: 'var(--text3)' }}>تفاصيل أسعار V68</span>
                <ScrollArea className="w-full">
                  <div className="min-w-[600px]">
                    <div className="grid grid-cols-5 gap-3 px-3 py-2 text-[9px] font-bold" style={{ color: 'var(--text4)' }}>
                      <span>المزود</span>
                      <span className="text-center">إدخال/1M</span>
                      <span className="text-center">إخراج/1M</span>
                      <span className="text-center">متوسط التأخير</span>
                      <span className="text-center">ملاحظات</span>
                    </div>
                    {v68Costs.costs.map((cost, i) => (
                      <div key={`${cost.provider}-${i}`} className="grid grid-cols-5 gap-3 px-3 py-2 rounded-lg items-center" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{cost.provider}</span>
                          {!cost.available && <XCircle size={10} style={{ color: 'var(--text4)' }} />}
                        </div>
                        <span className="font-mono-price text-[10px] text-center" style={{ color: cost.inputCostPer1M === 0 ? 'var(--bull)' : 'var(--text2)' }}>
                          {cost.inputCostPer1M === 0 ? 'مجاني' : `$${cost.inputCostPer1M}`}
                        </span>
                        <span className="font-mono-price text-[10px] text-center" style={{ color: cost.outputCostPer1M === 0 ? 'var(--bull)' : 'var(--text2)' }}>
                          {cost.outputCostPer1M === 0 ? 'مجاني' : `$${cost.outputCostPer1M}`}
                        </span>
                        <span className="text-[10px] text-center" style={{ color: 'var(--text3)' }}>
                          {cost.avgLatencyMs > 0 ? `${cost.avgLatencyMs}ms` : '-'}
                        </span>
                        <span className="text-[9px] text-center truncate" style={{ color: 'var(--text4)' }}>
                          {cost.notes}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="p-3 rounded-lg text-[9px]" style={{ background: 'var(--bg4)', color: 'var(--text4)' }}>
                <Info size={10} className="inline ml-1" />
                {v68Costs.assumptions.note}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(139,92,246,0.15))',
            border: '1px solid rgba(0,229,255,0.2)',
            backdropFilter: 'blur(12px)',
          }}>
            <Bot size={20} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold font-heading" style={{ color: 'var(--text)' }}>
              لوحة الذكاء الاصطناعي
            </h1>
            <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>
              تشخيصات، استهلاك، وتكاليف الذكاء الاصطناعي
            </p>
          </div>
        </div>
        <Button onClick={refreshCurrentTab} variant="outline" size="sm" className="gap-2" disabled={isTabLoading} style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
          <RefreshCw size={14} className={isTabLoading ? 'animate-spin' : ''} />
          تحديث
        </Button>
      </div>

      {/* Tab Navigation — Glassmorphism Style */}
      <div
        className="flex items-center gap-1 p-1.5 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 flex-1 justify-center"
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(139,92,246,0.15))',
                color: 'var(--text)',
                border: '1px solid rgba(0,229,255,0.25)',
                boxShadow: '0 4px 16px rgba(0,229,255,0.1)',
                backdropFilter: 'blur(12px)',
              } : {
                background: 'transparent',
                color: 'var(--text3)',
                border: '1px solid transparent',
              }}
            >
              <Icon size={16} style={{ color: isActive ? 'var(--cyan)' : 'var(--text4)' }} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'providers' && renderProviders()}
        {activeTab === 'haiku' && renderHaiku()}
        {activeTab === 'costs' && renderCosts()}
      </div>
    </div>
  );
}
