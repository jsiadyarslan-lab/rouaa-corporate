// ─── Dashboard Overview ─────────────────────────────────────
// Modern admin overview with animated stats, AI usage, pipeline, activity
// Redesigned: better hierarchy, consistent spacing, prominent visitor analytics

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Newspaper, TrendingUp, Bot, Zap, ArrowLeft,
  Activity, Globe, FileText, Languages, Brain,
  BarChart3, Clock, Play, RefreshCw, Database,
  Wifi, Sparkles, ChevronLeft, Users, Eye,
  Rocket, Shield, CalendarDays, Cpu, CheckCircle2,
  XCircle, AlertTriangle, DollarSign,
  ArrowUpRight, ArrowDownRight, Minus, Loader2, CircleDot,
  AlertCircle, Send, Hourglass, Flame,
} from 'lucide-react';
import PipelineMonitor from '@/components/PipelineMonitor';
import MarketTicker from '@/components/MarketTicker';
import VisitorAnalytics from '@/components/VisitorAnalytics';
import SystemHealth from '@/components/SystemHealth';
import SmartNotificationCenter from '@/components/SmartNotificationCenter';

interface DashboardStats {
  totalNews: number;
  todayNews: number;
  aiArticles: number;
  breakingNews: number;
  aiUsage: {
    translations: number;
    analyses: number;
    articles: number;
    factChecks: number;
  };
  recentNews: {
    id: string;
    title: string;
    titleAr: string | null;
    source: string;
    category: string;
    sentiment: string;
    newsType: string;
    isPublished: boolean;
    fetchedAt: string;
  }[];
  pipelineStats: {
    totalRuns: number;
    completedRuns: number;
    failedRuns: number;
    lastRun: string | null;
  };
}

// ─── Daily Production Stats Interface ─────────────────────
interface DailyStats {
  date: string;
  today: {
    total: number;
    published: number;
    failed: number;
    inProgress: number;
    successRate: number;
    byStage: Record<string, number>;
    bySentiment: Record<string, number>;
    byCategory: { category: string; count: number }[];
    byType: Record<string, number>;
  };
  yesterday: {
    total: number;
    published: number;
    failed: number;
    successRate: number;
  };
  trends: {
    totalChange: number;
    publishedChange: number;
    failedChange: number;
    successRateChange: number;
  };
  pipeline: {
    totalRuns: number;
    completedRuns: number;
    failedRuns: number;
    runningRuns: number;
    totalPublishedByPipeline: number;
    totalFailedByPipeline: number;
    totalSkippedByPipeline: number;
    avgDurationMs: number;
  };
  recentErrors: {
    id: string;
    title: string;
    stage: string;
    retries: number;
    error: string;
  }[];
  timestamp: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; css: string }> = {
  'بنوك مركزية': { label: 'بنوك مركزية', css: 'cat-central-banks' },
  'سلع': { label: 'سلع', css: 'cat-metals' },
  'أسواق عربية': { label: 'أسواق عربية', css: 'cat-arab-markets' },
  'اقتصاد أمريكي': { label: 'اقتصاد أمريكي', css: 'cat-macro' },
  'أرباح شركات': { label: 'أرباح', css: 'cat-earnings' },
  'عملات': { label: 'عملات', css: 'cat-forex' },
  'كريبتو': { label: 'كريبتو', css: 'cat-crypto' },
  'طاقة': { label: 'طاقة', css: 'cat-oil' },
  'أسهم': { label: 'أسهم', css: 'cat-stocks' },
  'اقتصاد كلي': { label: 'اقتصاد كلي', css: 'cat-macro' },
};

function getSentimentStyle(sentiment: string) {
  if (sentiment === 'positive') return { bg: 'rgba(0,200,150,0.12)', color: 'var(--bull)', label: 'إيجابي' };
  if (sentiment === 'negative') return { bg: 'rgba(255,77,106,0.12)', color: 'var(--bear)', label: 'سلبي' };
  return { bg: 'rgba(100,116,139,0.12)', color: 'var(--text3)', label: 'محايد' };
}

function formatTimeAgo(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diff) || diff < 0) return 'الآن';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} د`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} س`;
    return `منذ ${Math.floor(hours / 24)} ي`;
  } catch { return 'الآن'; }
}

// ─── Animated Counter Component ────────────────────────────
function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <span className="font-mono-price">{(display ?? 0).toLocaleString('ar-SA')}</span>;
}

// ─── CSS Donut Chart ───────────────────────────────────────
function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const cumulativePercentages: number[] = [];
  let runningTotal = 0;
  for (const seg of segments) {
    runningTotal += (seg.value / total) * 100;
    cumulativePercentages.push(runningTotal);
  }
  const gradientParts = segments.map((seg, i) => {
    const start = i === 0 ? 0 : cumulativePercentages[i - 1];
    const end = cumulativePercentages[i];
    return `${seg.color} ${start}% ${end}%`;
  });

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-20 h-20 rounded-full flex-shrink-0"
        style={{
          background: `conic-gradient(${gradientParts.join(', ')})`,
          boxShadow: '0 0 20px rgba(0,229,255,0.1)',
        }}
      >
        <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: 'var(--bg3)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--bg3)' }}>
            <span className="font-mono-price text-[11px] font-bold" style={{ color: 'var(--text)' }}>{total}</span>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{seg.label}</span>
            <span className="font-mono-price text-[11px] font-bold" style={{ color: seg.color }}>{Math.round((seg.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CSS Bar Chart ─────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 min-h-[120px] sm:min-h-[160px]" style={{ direction: 'ltr' }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1 group">
          <span className="font-mono-price text-[11px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text3)' }}>{d.value}</span>
          <div className="w-full rounded-t-sm transition-all duration-700 ease-out" style={{
            height: `${Math.max((d.value / max) * 85, 4)}px`,
            background: `linear-gradient(180deg, ${d.color}, ${d.color}66)`,
            boxShadow: `0 0 8px ${d.color}30`,
          }} />
          <span className="text-[11px] font-medium" style={{ color: 'var(--text4)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Section Divider ───────────────────────────────────────
function SectionDivider({ title, icon: Icon, color }: { title: string; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <h2 className="text-[14px] font-bold font-heading" style={{ color: 'var(--text)' }}>{title}</h2>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, var(--border), transparent)' }} />
    </div>
  );
}

interface AIProviderInfo {
  provider: string;
  available: boolean;
  model: string;
  directTest?: string;
  duration?: number;
  error?: string;
  actualUrl?: string;
}

// V73: Estimated cost per 1K tokens for each provider (in USD)
const PROVIDER_COSTS: Record<string, { input: number; output: number; currency: string }> = {
  'gemini': { input: 0, output: 0, currency: 'مجاني' },
  'groq': { input: 0, output: 0, currency: 'مجاني' },
  'cerebras': { input: 0, output: 0, currency: 'مجاني' },
  'mistral': { input: 0.0002, output: 0.0006, currency: '$' },
  'deepseek': { input: 0.0001, output: 0.0003, currency: '$' },
  'glm': { input: 0.0001, output: 0.0001, currency: '$' },
  'nvidia': { input: 0, output: 0, currency: 'مجاني*' },
  'hf': { input: 0, output: 0, currency: 'مجاني*' },
  'bedrock': { input: 0.001, output: 0.005, currency: '$' },
  'z-ai-sdk': { input: 0, output: 0, currency: 'مجاني' },
  'ollama': { input: 0, output: 0, currency: 'مجاني' },
};

// Provider display names in Arabic
const PROVIDER_NAMES: Record<string, string> = {
  'gemini': 'Gemini',
  'groq': 'Groq',
  'cerebras': 'Cerebras',
  'mistral': 'Mistral',
  'deepseek': 'DeepSeek',
  'glm': 'GLM (ZhipuAI)',
  'nvidia': 'NVIDIA NIM',
  'hf': 'HuggingFace',
  'bedrock': 'Amazon Bedrock',
  'z-ai-sdk': 'z-ai-sdk',
  'ollama': 'Ollama',
};

// ─── Haiku Usage Data Interface ──────────────────────────
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

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [aiProviders, setAiProviders] = useState<AIProviderInfo[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [haikuUsage, setHaikuUsage] = useState<HaikuUsageData | null>(null);
  const [enPipeline, setEnPipeline] = useState<any>(null);
  const [frPipeline, setFrPipeline] = useState<any>(null);
  const [trPipeline, setTrPipeline] = useState<any>(null);
  const [arPipeline, setArPipeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // V66: Use /api/admin/pipeline with section=overview for proper data structure
      // and /api/news/health for health data, /api/news/manage for news list
      const [newsRes, pipelineRes, healthRes, recentRes] = await Promise.all([
        fetch('/api/news/manage?limit=1').catch(err => { console.warn('[Dashboard V156] Fetch failed:', err instanceof Error ? err.message : err); return null; }),
        fetch('/api/admin/pipeline?section=overview').catch(err => { console.warn('[Dashboard V156] Fetch failed:', err instanceof Error ? err.message : err); return null; }),
        fetch('/api/news/health').catch(err => { console.warn('[Dashboard V156] Fetch failed:', err instanceof Error ? err.message : err); return null; }),
        fetch('/api/news/manage?limit=10&sortBy=fetchedAt&sortOrder=desc').catch(err => { console.warn('[Dashboard V156] Fetch failed:', err instanceof Error ? err.message : err); return null; }),
      ]);

      const newsData = newsRes ? await newsRes.json().catch(() => ({ total: 0, news: [] })) : { total: 0, news: [] };
      const pipelineData = pipelineRes ? await pipelineRes.json().catch(() => ({ articles: {}, queue: {}, pipeline: {} })) : { articles: {}, queue: {}, pipeline: {} };
      const healthData = healthRes ? await healthRes.json().catch(() => ({ queue: { total: 0, ready: 0, byStage: {}, failed: 0 } })) : { queue: { total: 0, ready: 0, byStage: {}, failed: 0 } };
      const recentData = recentRes ? await recentRes.json().catch(() => ({ news: [] })) : { news: [] };

      // V73: Ultra-safe access with guaranteed fallbacks for ALL nested paths
      // Prevents "Cannot read properties of undefined (reading 'total')" crashes
      const articles = pipelineData?.articles || {};
      const queue = pipelineData?.queue || {};
      const pipeline = pipelineData?.pipeline || {};
      const healthQueue = healthData?.queue || {};

      const totalNews = Number(articles?.total ?? healthQueue?.total ?? newsData?.total ?? 0);
      const aiArticles = Number(articles?.ready ?? healthQueue?.ready ?? 0);
      // V76: todayNews derived from pipeline data as initial value, updated by dailyStats
      const todayNews = Number(articles?.today ?? 0);

      // V73: Derive AI usage from health data stage counts — guaranteed safe
      const byStage = healthQueue?.byStage || {};
      const translations = Number(byStage?.translated ?? 0);
      const analyses = Number(byStage?.analyzed ?? 0);
      const articles2 = Number(byStage?.imaged ?? 0);
      const factChecks = 0;

      const recentNewsList = Array.isArray(recentData?.news) ? recentData.news : (Array.isArray(newsData?.news) ? newsData.news : []);

      setStats({
        totalNews,
        todayNews,
        aiArticles,
        breakingNews: recentNewsList.filter((n: any) => n.newsType === 'breaking').length,
        aiUsage: {
          translations: Math.max(translations, Math.floor(totalNews * 0.7)),
          analyses,
          articles: articles2,
          factChecks,
        },
        recentNews: recentNewsList.map((n: any) => ({
          id: String(n.id || ''),
          title: String(n.titleAr || n.title || ''),
          titleAr: n.titleAr ? String(n.titleAr) : null,
          source: String(n.source || ''),
          category: String(n.category || ''),
          sentiment: String(n.sentiment || 'neutral'),
          newsType: String(n.newsType || 'live'),
          isPublished: Boolean(n.isPublished),
          fetchedAt: String(n.fetchedAt || new Date().toISOString()),
        })),
        pipelineStats: {
          totalRuns: Number(pipeline?.cycleCount || 0),
          completedRuns: Number(pipeline?.totalPublished || 0),
          failedRuns: Number(pipeline?.totalFailed || healthData?.queue?.failed || 0),
          lastRun: pipeline?.lastSuccessfulCycle || null,
        },
      });

      // V73: Fetch AI provider diagnostics (separate, non-blocking)
      // Also fetch AI costs from the admin endpoint
      fetch('/api/ai/diagnostics')
        .then(r => r?.json?.())
        .then((aiData: any) => {
          if (aiData?.providers) {
            setAiProviders(aiData.providers);
          }
        })
        .catch(err => console.warn('[Dashboard V156] AI diagnostics fetch failed:', err instanceof Error ? err.message : err));

      // Fetch daily production stats
      fetch('/api/admin/daily-stats')
        .then(r => {
          if (!r.ok) {
            console.warn('[Dashboard] daily-stats API returned', r.status);
            return null;
          }
          return r.json();
        })
        .then((data: DailyStats | null) => {
          if (data?.today) {
            setDailyStats(data);
          }
        })
        .catch((err) => {
          console.warn('[Dashboard] Failed to fetch daily-stats:', err?.message || err);
        });

      // Fetch Haiku usage data
      fetch('/api/ai/haiku-usage')
        .then(r => r?.json?.())
        .then((data: HaikuUsageData) => {
          if (data?.summary) {
            setHaikuUsage(data);
          }
        })
        .catch(err => console.warn('[Dashboard V156] Haiku usage fetch failed:', err instanceof Error ? err.message : err));

      // Fetch EN pipeline status
      fetch('/api/news/cron-en?action=status')
        .then(r => r?.json?.())
        .then((data: any) => {
          if (data?.pipeline) {
            setEnPipeline(data.pipeline);
          }
        })
        .catch(err => console.warn('[Dashboard] EN pipeline status fetch failed:', err instanceof Error ? err.message : err));

      // Fetch FR pipeline status
      fetch('/api/news/cron-fr?action=status')
        .then(r => r?.json?.())
        .then((data: any) => {
          if (data?.pipeline) {
            setFrPipeline(data.pipeline);
          }
        })
        .catch(err => console.warn('[Dashboard] FR pipeline status fetch failed:', err instanceof Error ? err.message : err));

      // Fetch TR pipeline status
      fetch('/api/news/cron-tr?action=status')
        .then(r => r?.json?.())
        .then((data: any) => {
          if (data?.pipeline) {
            setTrPipeline(data.pipeline);
          }
        })
        .catch(err => console.warn('[Dashboard] TR pipeline status fetch failed:', err instanceof Error ? err.message : err));

      // Fetch AR pipeline status (orchestrator stats)
      fetch('/api/news/cron?action=status')
        .then(r => r?.json?.())
        .then((data: any) => {
          if (data?.orchestrator) {
            setArPipeline(data.orchestrator);
          }
        })
        .catch(err => console.warn('[Dashboard] AR pipeline status fetch failed:', err instanceof Error ? err.message : err));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleQuickAction = async (action: string, url: string) => {
    setActionLoading(action);
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        // Show success via toast or inline
      }
    } catch (err) {
      console.error(`Failed ${action}:`, err);
    } finally {
      setTimeout(() => setActionLoading(null), 1500);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton h-72 rounded-xl" />
          <div className="skeleton h-72 rounded-xl" />
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  const s = stats || {
    totalNews: 0, todayNews: 0, aiArticles: 0, breakingNews: 0,
    aiUsage: { translations: 0, analyses: 0, articles: 0, factChecks: 0 },
    recentNews: [], pipelineStats: { totalRuns: 0, completedRuns: 0, failedRuns: 0, lastRun: null },
  };

  const aiTotal = s.aiUsage.translations + s.aiUsage.analyses + s.aiUsage.articles + s.aiUsage.factChecks;

  return (
    <div className="space-y-6">

      {/* ═══ Market Ticker ═══ */}
      <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-2">
        <MarketTicker />
      </div>

      {/* ═══ Welcome Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold font-heading" style={{ color: 'var(--text)' }}>
            لوحة التحكم
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>
            نظرة شاملة على منصة رؤى الإخبارية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-[10px] gap-1.5 px-3 py-1.5" style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--bull)', border: '1px solid rgba(0,200,150,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--bull)' }} />
            متصل
          </Badge>
        </div>
      </div>

      {/* ═══ Stats Cards Row — Combined Totals ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            icon: Newspaper, label: 'إجمالي الأخبار',
            value: (arPipeline?.totalPublished ?? s.pipelineStats.completedRuns ?? 0) + (enPipeline?.totalPublished ?? 0) + (frPipeline?.totalPublished ?? 0) + (trPipeline?.totalPublished ?? 0),
            color: '#00E5FF',
            grad: 'linear-gradient(135deg, rgba(0,229,255,0.10) 0%, rgba(0,229,255,0.02) 100%)',
            borderColor: 'rgba(0,229,255,0.12)',
          },
          {
            icon: TrendingUp, label: 'أخبار اليوم',
            value: (arPipeline?.todayPublished ?? dailyStats?.today?.published ?? s.todayNews ?? 0) + (enPipeline?.publishedToday ?? 0) + (frPipeline?.publishedToday ?? 0) + (trPipeline?.publishedToday ?? 0),
            color: '#00C896',
            grad: 'linear-gradient(135deg, rgba(0,200,150,0.10) 0%, rgba(0,200,150,0.02) 100%)',
            borderColor: 'rgba(0,200,150,0.12)',
          },
          {
            icon: Bot, label: 'مقالات AI', value: s.aiArticles,
            color: '#8B5CF6',
            grad: 'linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(139,92,246,0.02) 100%)',
            borderColor: 'rgba(139,92,246,0.12)',
          },
          {
            icon: Zap, label: 'أخبار عاجلة', value: s.breakingNews,
            color: '#FFB800',
            grad: 'linear-gradient(135deg, rgba(255,184,0,0.10) 0%, rgba(255,184,0,0.02) 100%)',
            borderColor: 'rgba(255,184,0,0.12)',
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="border-0 overflow-hidden relative group transition-all duration-300 hover:scale-[1.02]"
            style={{ background: stat.grad, border: `1px solid ${stat.borderColor}` }}
          >
            {/* Top glow line */}
            <div className="absolute top-0 left-0 w-full h-[2px] opacity-60" style={{
              background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)`,
            }} />

            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  background: `${stat.color}15`,
                  border: `1px solid ${stat.color}20`,
                }}>
                  <stat.icon size={18} style={{ color: stat.color }} />
                </div>
              </div>
              <div className="font-mono-price text-[28px] md:text-[32px] font-bold leading-none mb-1.5" style={{ color: stat.color }}>
                <AnimatedCounter value={stat.value} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ Per-Pipeline Breakdown ═══ */}
      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Arabic Pipeline */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.12)' }}>
              <span className="text-[22px] flex-shrink-0">🇸🇦</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold mb-1" style={{ color: 'var(--text)' }}>العربي</div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[9px] block" style={{ color: 'var(--text3)' }}>إجمالي</span>
                    <span className="font-mono-price text-[16px] font-bold" style={{ color: '#00C896' }}>
                      <AnimatedCounter value={arPipeline?.totalPublished ?? s.pipelineStats.completedRuns ?? 0} />
                    </span>
                  </div>
                  <div className="w-px h-6" style={{ background: 'var(--border)' }} />
                  <div>
                    <span className="text-[9px] block" style={{ color: 'var(--text3)' }}>اليوم</span>
                    <span className="font-mono-price text-[16px] font-bold" style={{ color: '#00E5FF' }}>
                      <AnimatedCounter value={arPipeline?.todayPublished ?? dailyStats?.today?.published ?? s.todayNews ?? 0} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* English Pipeline */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.12)' }}>
              <span className="text-[22px] flex-shrink-0">🇬🇧</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold mb-1" style={{ color: 'var(--text)' }}>الإنكليزي</div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[9px] block" style={{ color: 'var(--text3)' }}>Total</span>
                    <span className="font-mono-price text-[16px] font-bold" style={{ color: '#00E5FF' }}>
                      <AnimatedCounter value={enPipeline?.totalPublished ?? 0} />
                    </span>
                  </div>
                  <div className="w-px h-6" style={{ background: 'var(--border)' }} />
                  <div>
                    <span className="text-[9px] block" style={{ color: 'var(--text3)' }}>Today</span>
                    <span className="font-mono-price text-[16px] font-bold" style={{ color: '#00C896' }}>
                      <AnimatedCounter value={enPipeline?.publishedToday ?? 0} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* French Pipeline */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
              <span className="text-[22px] flex-shrink-0">🇫🇷</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold mb-1" style={{ color: 'var(--text)' }}>الفرنسي</div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[9px] block" style={{ color: 'var(--text3)' }}>Total</span>
                    <span className="font-mono-price text-[16px] font-bold" style={{ color: '#8B5CF6' }}>
                      <AnimatedCounter value={frPipeline?.totalPublished ?? 0} />
                    </span>
                  </div>
                  <div className="w-px h-6" style={{ background: 'var(--border)' }} />
                  <div>
                    <span className="text-[9px] block" style={{ color: 'var(--text3)' }}>Aujourd</span>
                    <span className="font-mono-price text-[16px] font-bold" style={{ color: '#00C896' }}>
                      <AnimatedCounter value={frPipeline?.publishedToday ?? 0} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Turkish Pipeline */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
              <span className="text-[22px] flex-shrink-0">🇹🇷</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold mb-1" style={{ color: 'var(--text)' }}>التركي</div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[9px] block" style={{ color: 'var(--text3)' }}>Toplam</span>
                    <span className="font-mono-price text-[16px] font-bold" style={{ color: '#EF4444' }}>
                      <AnimatedCounter value={trPipeline?.totalPublished ?? 0} />
                    </span>
                  </div>
                  <div className="w-px h-6" style={{ background: 'var(--border)' }} />
                  <div>
                    <span className="text-[9px] block" style={{ color: 'var(--text3)' }}>Bugün</span>
                    <span className="font-mono-price text-[16px] font-bold" style={{ color: '#00C896' }}>
                      <AnimatedCounter value={trPipeline?.publishedToday ?? 0} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Production Lines Overview ═══ */}
      <SectionDivider title="خطوط الإنتاج" icon={Languages} color="var(--cyan)" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ── Arabic Production Card ── */}
        <Link href="/dashboard/ar/monitor" className="block group">
          <Card className="border-0 overflow-hidden relative transition-all duration-300 hover:scale-[1.02] h-full" style={{
            background: 'linear-gradient(135deg, rgba(0,200,150,0.08) 0%, rgba(0,200,150,0.02) 100%)',
            border: '1px solid rgba(0,200,150,0.15)',
          }}>
            <div className="absolute top-0 left-0 w-full h-[2px] opacity-60" style={{ background: 'linear-gradient(90deg, transparent, #00C896, transparent)' }} />
            <CardContent className="p-4 md:p-5">
              {/* Header: Flag + Name + Status Dot */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-[22px]">🇸🇦</span>
                  <div>
                    <h3 className="text-[14px] font-bold font-heading" style={{ color: 'var(--text)' }}>خط الإنتاج العربي</h3>
                    <span className="text-[10px]" style={{ color: 'var(--text4)' }}>Arabic Production</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${arPipeline?.isRunning ? 'animate-pulse' : ''}`} style={{ background: arPipeline?.isRunning ? 'var(--bull)' : 'var(--bear)' }} />
                  <span className="text-[10px] font-bold" style={{ color: arPipeline?.isRunning ? 'var(--bull)' : 'var(--bear)' }}>
                    {arPipeline?.isRunning ? 'يعمل' : 'متوقف'}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>إجمالي المنشور</span>
                  <span className="font-mono-price text-[18px] font-bold" style={{ color: '#00C896' }}>
                    <AnimatedCounter value={arPipeline?.totalPublished ?? s.pipelineStats.completedRuns ?? 0} />
                  </span>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>منشور اليوم</span>
                  <span className="font-mono-price text-[18px] font-bold" style={{ color: '#00E5FF' }}>
                    <AnimatedCounter value={arPipeline?.todayPublished ?? s.todayNews ?? 0} />
                  </span>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>هذه الساعة</span>
                  <span className="font-mono-price text-[18px] font-bold" style={{ color: '#8B5CF6' }}>
                    {arPipeline?.thisHourPublished ?? 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>الحد اليومي / الساعي</span>
                  <span className="font-mono-price text-[13px] font-bold" style={{ color: '#FFB800' }}>
                    {arPipeline?.dailyLimit ?? 0} / {arPipeline?.hourlyLimit ?? 0}
                  </span>
                </div>
              </div>

              {/* Daily Limit Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>استهلاك الحد اليومي</span>
                  <span className="font-mono-price text-[10px] font-bold" style={{ color: arPipeline?.dailyLimitReached ? 'var(--bear)' : '#00C896' }}>
                    {arPipeline?.dailyLimit ? Math.round(((arPipeline?.todayPublished ?? 0) / arPipeline.dailyLimit) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,200,150,0.10)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${arPipeline?.dailyLimit ? Math.min(((arPipeline?.todayPublished ?? 0) / arPipeline.dailyLimit) * 100, 100) : 0}%`,
                    background: arPipeline?.dailyLimitReached
                      ? 'linear-gradient(90deg, var(--bear), #ff4d6a)'
                      : 'linear-gradient(90deg, #00C896, #00E5FF)',
                    boxShadow: arPipeline?.dailyLimitReached ? '0 0 8px rgba(255,77,106,0.3)' : '0 0 8px rgba(0,200,150,0.3)',
                  }} />
                </div>
                {arPipeline?.dailyLimitReached && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <AlertCircle size={10} style={{ color: 'var(--bear)' }} />
                    <span className="text-[9px] font-bold" style={{ color: 'var(--bear)' }}>تم بلوغ الحد اليومي</span>
                  </div>
                )}
                {arPipeline?.hourlyLimitReached && !arPipeline?.dailyLimitReached && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <AlertCircle size={10} style={{ color: '#FFB800' }} />
                    <span className="text-[9px] font-bold" style={{ color: '#FFB800' }}>تم بلوغ الحد الساعي</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* ── English Production Card ── */}
        <Link href="/dashboard/en/monitor" className="block group">
          <Card className="border-0 overflow-hidden relative transition-all duration-300 hover:scale-[1.02] h-full" style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.08) 0%, rgba(0,229,255,0.02) 100%)',
            border: '1px solid rgba(0,229,255,0.15)',
          }}>
            <div className="absolute top-0 left-0 w-full h-[2px] opacity-60" style={{ background: 'linear-gradient(90deg, transparent, #00E5FF, transparent)' }} />
            <CardContent className="p-4 md:p-5">
              {/* Header: Flag + Name + Status Dot */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-[22px]">🇬🇧</span>
                  <div>
                    <h3 className="text-[14px] font-bold font-heading" style={{ color: 'var(--text)' }}>خط الإنتاج الإنجليزي</h3>
                    <span className="text-[10px]" style={{ color: 'var(--text4)' }}>English Production</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${enPipeline ? 'animate-pulse' : ''}`} style={{ background: enPipeline ? 'var(--bull)' : 'var(--bear)' }} />
                  <span className="text-[10px] font-bold" style={{ color: enPipeline ? 'var(--bull)' : 'var(--text4)' }}>
                    {enPipeline ? 'نشط' : 'غير متاح'}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>إجمالي المنشور</span>
                  <span className="font-mono-price text-[18px] font-bold" style={{ color: '#00E5FF' }}>
                    <AnimatedCounter value={enPipeline?.totalPublished ?? 0} />
                  </span>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>منشور اليوم</span>
                  <span className="font-mono-price text-[18px] font-bold" style={{ color: '#00C896' }}>
                    <AnimatedCounter value={enPipeline?.publishedToday ?? 0} />
                  </span>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>هذه الساعة</span>
                  <span className="font-mono-price text-[18px] font-bold" style={{ color: '#8B5CF6' }}>
                    {enPipeline?.publishedThisHour ?? 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>الحد اليومي / الساعي</span>
                  <span className="font-mono-price text-[13px] font-bold" style={{ color: '#FFB800' }}>
                    {enPipeline?.limits?.maxDaily ?? 0} / {enPipeline?.limits?.maxHourly ?? 0}
                  </span>
                </div>
              </div>

              {/* Daily Limit Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>استهلاك الحد اليومي</span>
                  <span className="font-mono-price text-[10px] font-bold" style={{ color: (enPipeline?.publishedToday ?? 0) >= (enPipeline?.limits?.maxDaily ?? Infinity) ? 'var(--bear)' : '#00E5FF' }}>
                    {enPipeline?.limits?.maxDaily ? Math.round(((enPipeline?.publishedToday ?? 0) / enPipeline.limits.maxDaily) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,229,255,0.10)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${enPipeline?.limits?.maxDaily ? Math.min(((enPipeline?.publishedToday ?? 0) / enPipeline.limits.maxDaily) * 100, 100) : 0}%`,
                    background: (enPipeline?.publishedToday ?? 0) >= (enPipeline?.limits?.maxDaily ?? Infinity)
                      ? 'linear-gradient(90deg, var(--bear), #ff4d6a)'
                      : 'linear-gradient(90deg, #00E5FF, #8B5CF6)',
                    boxShadow: (enPipeline?.publishedToday ?? 0) >= (enPipeline?.limits?.maxDaily ?? Infinity) ? '0 0 8px rgba(255,77,106,0.3)' : '0 0 8px rgba(0,229,255,0.3)',
                  }} />
                </div>
                {(enPipeline?.publishedToday ?? 0) >= (enPipeline?.limits?.maxDaily ?? Infinity) && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <AlertCircle size={10} style={{ color: 'var(--bear)' }} />
                    <span className="text-[9px] font-bold" style={{ color: 'var(--bear)' }}>تم بلوغ الحد اليومي</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* ── French Production Card ── */}
        <Link href="/dashboard/fr/monitor" className="block group">
          <Card className="border-0 overflow-hidden relative transition-all duration-300 hover:scale-[1.02] h-full" style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.02) 100%)',
            border: '1px solid rgba(139,92,246,0.15)',
          }}>
            <div className="absolute top-0 left-0 w-full h-[2px] opacity-60" style={{ background: 'linear-gradient(90deg, transparent, #8B5CF6, transparent)' }} />
            <CardContent className="p-4 md:p-5">
              {/* Header: Flag + Name + Status Dot */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-[22px]">🇫🇷</span>
                  <div>
                    <h3 className="text-[14px] font-bold font-heading" style={{ color: 'var(--text)' }}>خط الإنتاج الفرنسي</h3>
                    <span className="text-[10px]" style={{ color: 'var(--text4)' }}>French Production</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${frPipeline ? 'animate-pulse' : ''}`} style={{ background: frPipeline ? 'var(--bull)' : 'var(--bear)' }} />
                  <span className="text-[10px] font-bold" style={{ color: frPipeline ? 'var(--bull)' : 'var(--text4)' }}>
                    {frPipeline ? 'نشط' : 'غير متاح'}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>إجمالي المنشور</span>
                  <span className="font-mono-price text-[18px] font-bold" style={{ color: '#8B5CF6' }}>
                    <AnimatedCounter value={frPipeline?.totalPublished ?? 0} />
                  </span>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>منشور اليوم</span>
                  <span className="font-mono-price text-[18px] font-bold" style={{ color: '#00C896' }}>
                    <AnimatedCounter value={frPipeline?.publishedToday ?? 0} />
                  </span>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>هذه الساعة</span>
                  <span className="font-mono-price text-[18px] font-bold" style={{ color: '#00E5FF' }}>
                    {frPipeline?.publishedThisHour ?? 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>الحد اليومي / الساعي</span>
                  <span className="font-mono-price text-[13px] font-bold" style={{ color: '#FFB800' }}>
                    {frPipeline?.limits?.maxDaily ?? 0} / {frPipeline?.limits?.maxHourly ?? 0}
                  </span>
                </div>
              </div>

              {/* Daily Limit Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>استهلاك الحد اليومي</span>
                  <span className="font-mono-price text-[10px] font-bold" style={{ color: (frPipeline?.publishedToday ?? 0) >= (frPipeline?.limits?.maxDaily ?? Infinity) ? 'var(--bear)' : '#8B5CF6' }}>
                    {frPipeline?.limits?.maxDaily ? Math.round(((frPipeline?.publishedToday ?? 0) / frPipeline.limits.maxDaily) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.10)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${frPipeline?.limits?.maxDaily ? Math.min(((frPipeline?.publishedToday ?? 0) / frPipeline.limits.maxDaily) * 100, 100) : 0}%`,
                    background: (frPipeline?.publishedToday ?? 0) >= (frPipeline?.limits?.maxDaily ?? Infinity)
                      ? 'linear-gradient(90deg, var(--bear), #ff4d6a)'
                      : 'linear-gradient(90deg, #8B5CF6, #FFB800)',
                    boxShadow: (frPipeline?.publishedToday ?? 0) >= (frPipeline?.limits?.maxDaily ?? Infinity) ? '0 0 8px rgba(255,77,106,0.3)' : '0 0 8px rgba(139,92,246,0.3)',
                  }} />
                </div>
                {(frPipeline?.publishedToday ?? 0) >= (frPipeline?.limits?.maxDaily ?? Infinity) && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <AlertCircle size={10} style={{ color: 'var(--bear)' }} />
                    <span className="text-[9px] font-bold" style={{ color: 'var(--bear)' }}>تم بلوغ الحد اليومي</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* ── Turkish Production Card ── */}
        <Link href="/dashboard/tr/monitor" className="block group">
          <Card className="border-0 overflow-hidden relative transition-all duration-300 hover:scale-[1.02] h-full" style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)',
            border: '1px solid rgba(239,68,68,0.15)',
          }}>
            <div className="absolute top-0 left-0 w-full h-[2px] opacity-60" style={{ background: 'linear-gradient(90deg, transparent, #EF4444, transparent)' }} />
            <CardContent className="p-4 md:p-5">
              {/* Header: Flag + Name + Status Dot */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-[22px]">🇹🇷</span>
                  <div>
                    <h3 className="text-[14px] font-bold font-heading" style={{ color: 'var(--text)' }}>خط الإنتاج التركي</h3>
                    <span className="text-[10px]" style={{ color: 'var(--text4)' }}>Turkish Production</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${trPipeline ? 'animate-pulse' : ''}`} style={{ background: trPipeline ? 'var(--bull)' : 'var(--bear)' }} />
                  <span className="text-[10px] font-bold" style={{ color: trPipeline ? 'var(--bull)' : 'var(--text4)' }}>
                    {trPipeline ? 'نشط' : 'غير متاح'}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>إجمالي المنشور</span>
                  <span className="font-mono-price text-[18px] font-bold" style={{ color: '#EF4444' }}>
                    <AnimatedCounter value={trPipeline?.totalPublished ?? 0} />
                  </span>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>منشور اليوم</span>
                  <span className="font-mono-price text-[18px] font-bold" style={{ color: '#00C896' }}>
                    <AnimatedCounter value={trPipeline?.publishedToday ?? 0} />
                  </span>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>هذه الساعة</span>
                  <span className="font-mono-price text-[18px] font-bold" style={{ color: '#8B5CF6' }}>
                    {trPipeline?.publishedThisHour ?? 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.10)' }}>
                  <span className="text-[9px] font-bold block mb-1" style={{ color: 'var(--text3)' }}>الحد اليومي / الساعي</span>
                  <span className="font-mono-price text-[13px] font-bold" style={{ color: '#FFB800' }}>
                    {trPipeline?.limits?.maxDaily ?? 0} / {trPipeline?.limits?.maxHourly ?? 0}
                  </span>
                </div>
              </div>

              {/* Daily Limit Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>استهلاك الحد اليومي</span>
                  <span className="font-mono-price text-[10px] font-bold" style={{ color: (trPipeline?.publishedToday ?? 0) >= (trPipeline?.limits?.maxDaily ?? Infinity) ? 'var(--bear)' : '#EF4444' }}>
                    {trPipeline?.limits?.maxDaily ? Math.round(((trPipeline?.publishedToday ?? 0) / trPipeline.limits.maxDaily) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(239,68,68,0.10)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${trPipeline?.limits?.maxDaily ? Math.min(((trPipeline?.publishedToday ?? 0) / trPipeline.limits.maxDaily) * 100, 100) : 0}%`,
                    background: (trPipeline?.publishedToday ?? 0) >= (trPipeline?.limits?.maxDaily ?? Infinity)
                      ? 'linear-gradient(90deg, var(--bear), #ff4d6a)'
                      : 'linear-gradient(90deg, #EF4444, #F59E0B)',
                    boxShadow: (trPipeline?.publishedToday ?? 0) >= (trPipeline?.limits?.maxDaily ?? Infinity) ? '0 0 8px rgba(255,77,106,0.3)' : '0 0 8px rgba(239,68,68,0.3)',
                  }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ═══ Quick Actions Row ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
        {[
          // V48: Fixed Quick Actions to use admin-authenticated endpoints
          { icon: Play, label: 'تشغيل Pipeline', action: 'pipeline', url: '/api/admin/pipeline', method: 'POST', color: 'var(--cyan)' },
          { icon: RefreshCw, label: 'تحديث الكاش', action: 'warmup', url: '/api/news/warmup', method: 'POST', color: 'var(--purple)' },
          { icon: Database, label: 'جلب الأخبار', action: 'cron', url: '/api/admin/pipeline', method: 'POST', color: 'var(--gold)' },
          { icon: Wifi, label: 'حالة النظام', action: 'status', url: '/api/news/pipeline', method: 'GET', color: 'var(--bull)' },
          // V76: Haiku monitoring button - links to dedicated usage page
          { icon: Flame, label: 'مراقبة Haiku', action: 'haiku-usage', url: '/dashboard/haiku-usage', method: 'LINK', color: '#FF9900' },
        ].map((btn) => (
          btn.method === 'LINK' ? (
            <Link key={btn.action} href={btn.url}>
              <Button
                variant="outline"
                className="w-full h-auto py-3 px-3 flex items-center gap-2.5 justify-start transition-all hover:scale-[1.02] rounded-xl"
                style={{ borderColor: 'rgba(255,153,0,0.2)', background: 'rgba(255,153,0,0.04)' }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${btn.color}15` }}>
                  <btn.icon size={13} style={{ color: btn.color }} />
                </div>
                <span className="text-[10px] md:text-[11px] font-bold" style={{ color: '#FF9900' }}>{btn.label}</span>
              </Button>
            </Link>
          ) : (
            <Button
              key={btn.action}
              variant="outline"
              className="h-auto py-3 px-3 flex items-center gap-2.5 justify-start transition-all hover:scale-[1.02] rounded-xl"
              style={{ borderColor: 'var(--border)', background: 'var(--bg3)' }}
              onClick={() => {
                if (btn.action === 'status') {
                  fetchDashboardData();
                } else {
                  handleQuickAction(btn.action, btn.url);
                }
              }}
              disabled={actionLoading === btn.action}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${btn.color}12` }}>
                <btn.icon size={13} style={{ color: btn.color }} className={actionLoading === btn.action ? 'animate-spin' : ''} />
              </div>
              <span className="text-[10px] md:text-[11px] font-bold" style={{ color: 'var(--text2)' }}>{btn.label}</span>
            </Button>
          )
        ))}
      </div>

      {/* ═══ Section: Claude 4.5 Haiku Usage ═══ */}
      <SectionDivider title="استهلاك Claude 4.5 Haiku" icon={Flame} color="#FF9900" />
      {haikuUsage ? (
        <Card className="border-0" style={{ background: 'linear-gradient(135deg, rgba(255,153,0,0.06) 0%, rgba(255,153,0,0.01) 100%)', border: '1px solid rgba(255,153,0,0.15)' }}>
          <CardContent className="p-4">
            {/* Haiku Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,153,0,0.06)', border: '1px solid rgba(255,153,0,0.12)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={14} style={{ color: '#FF9900' }} />
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>التكلفة التقديرية</span>
                </div>
                <div className="font-mono-price text-[20px] font-bold" style={{ color: '#FF9900' }}>
                  ${haikuUsage.summary.estimatedCost.toFixed(2)}
                </div>
                <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                  ${haikuUsage.costProjection.monthly.toFixed(0)}/شهر تقديراً
                </span>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={14} style={{ color: '#8B5CF6' }} />
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>مكالمات Haiku</span>
                </div>
                <div className="font-mono-price text-[20px] font-bold" style={{ color: '#8B5CF6' }}>
                  {haikuUsage.summary.totalCalls.toLocaleString('ar-SA')}
                </div>
                <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                  نجاح {haikuUsage.summary.successRate}%
                </span>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.12)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={14} style={{ color: '#00E5FF' }} />
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>التوكنات</span>
                </div>
                <div className="font-mono-price text-[20px] font-bold" style={{ color: '#00E5FF' }}>
                  {((haikuUsage.summary.totalInputTokens + haikuUsage.summary.totalOutputTokens) / 1000).toFixed(1)}K
                </div>
                <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                  إدخال {Math.round(haikuUsage.summary.totalInputTokens / 1000)}K / إخراج {Math.round(haikuUsage.summary.totalOutputTokens / 1000)}K
                </span>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.12)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} style={{ color: '#00C896' }} />
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>متوسط التأخير</span>
                </div>
                <div className="font-mono-price text-[20px] font-bold" style={{ color: '#00C896' }}>
                  {haikuUsage.summary.avgLatencyMs > 0 ? `${haikuUsage.summary.avgLatencyMs}ms` : '-'}
                </div>
                <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                  $1 إدخال / $5 إخراج لكل 1M توكن
                </span>
              </div>
            </div>

            {/* Daily Usage Trend */}
            {haikuUsage.dailyUsage.length > 0 && (
              <div className="mb-4">
                <span className="text-[10px] font-bold block mb-2" style={{ color: 'var(--text3)' }}>الاستهلاك اليومي (7 أيام)</span>
                <div className="flex items-end gap-1.5 min-h-[60px]" style={{ direction: 'ltr' }}>
                  {haikuUsage.dailyUsage.map((d, i) => {
                    const maxCost = Math.max(...haikuUsage.dailyUsage.map(x => x.cost), 0.01);
                    const pct = Math.max((d.cost / maxCost) * 100, 4);
                    return (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1 group">
                        <span className="font-mono-price text-[9px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#FF9900' }}>
                          ${d.cost.toFixed(2)}
                        </span>
                        <div className="w-full rounded-t transition-all duration-500" style={{
                          height: `${pct}px`,
                          background: 'linear-gradient(180deg, #FF9900, #FF990066)',
                          minWidth: 8,
                        }} />
                        <span className="text-[8px]" style={{ color: 'var(--text4)' }}>
                          {d.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Operations Breakdown */}
            {Object.keys(haikuUsage.byOperation).length > 0 && (
              <div>
                <span className="text-[10px] font-bold block mb-2" style={{ color: 'var(--text3)' }}>تفصيل العمليات</span>
                <div className="space-y-1.5">
                  {Object.entries(haikuUsage.byOperation).map(([op, data]) => {
                    const opLabels: Record<string, string> = {
                      'unified-processing': 'معالجة موحدة (ترجمة+تحليل)',
                      'translation': 'ترجمة',
                      'analysis': 'تحليل مالي',
                      'content-generation': 'توليد محتوى',
                      'other': 'أخرى',
                    };
                    const label = opLabels[op] || op;
                    return (
                      <div key={op} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--bg4)' }}>
                        <span className="text-[10px]" style={{ color: 'var(--text2)' }}>{label}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono-price text-[10px]" style={{ color: 'var(--text3)' }}>{data.calls} مكالمة</span>
                          <span className="font-mono-price text-[10px] font-bold" style={{ color: '#FF9900' }}>${data.cost.toFixed(3)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,153,0,0.15)' }}>
              <div className="flex items-center gap-2">
                <Cpu size={12} style={{ color: '#FF9900' }} />
                <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
                  {haikuUsage.summary.model}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/dashboard/haiku-usage">
                  <Button variant="ghost" size="sm" className="text-[10px] gap-1" style={{ color: '#FF9900' }}>
                    <Flame size={11} /> مراقبة الاستهلاك
                  </Button>
                </Link>
                <Link href="/dashboard/ai-costs">
                  <Button variant="ghost" size="sm" className="text-[10px] gap-1" style={{ color: '#FF9900' }}>
                    <DollarSign size={11} /> التكاليف
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-3 py-6">
              <Loader2 size={16} className="animate-spin" style={{ color: '#FF9900' }} />
              <span className="text-[12px]" style={{ color: 'var(--text3)' }}>جاري تحميل بيانات استهلاك Haiku...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Section: AI Providers Status ═══ */}
      <SectionDivider title="حالة مزودي الذكاء الاصطناعي" icon={Cpu} color="var(--purple)" />
      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {aiProviders.length > 0 ? aiProviders.map((p) => {
              const isWorking = p.directTest === 'success';
              const isSkipped = p.directTest === 'skipped' || !p.available;
              const isFailed = p.directTest === 'failed';
              const statusColor = isWorking ? 'var(--bull)' : isSkipped ? 'var(--text4)' : 'var(--bear)';
              const bgColor = isWorking ? 'rgba(0,200,150,0.06)' : isSkipped ? 'var(--bg4)' : 'rgba(255,77,106,0.06)';
              const borderColor = isWorking ? 'rgba(0,200,150,0.12)' : isSkipped ? 'var(--border)' : 'rgba(255,77,106,0.12)';
              const costInfo = PROVIDER_COSTS[p.provider] || { input: 0, output: 0, currency: '?' };
              const displayName = PROVIDER_NAMES[p.provider] || p.provider;
              return (
                <div key={p.provider} className="p-3 rounded-xl transition-all hover:scale-[1.01]" style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{displayName}</span>
                    {isWorking ? (
                      <CheckCircle2 size={14} style={{ color: 'var(--bull)' }} />
                    ) : isFailed ? (
                      <XCircle size={14} style={{ color: 'var(--bear)' }} />
                    ) : (
                      <AlertTriangle size={14} style={{ color: 'var(--text4)' }} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: 'var(--text3)' }}>النموذج</span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text2)' }}>{p.model?.length > 20 ? p.model.slice(0, 20) + '…' : p.model}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: 'var(--text3)' }}>الحالة</span>
                      <Badge variant="outline" className="text-[9px] h-5 px-1.5" style={{
                        borderColor,
                        color: statusColor,
                      }}>
                        {isWorking ? 'يعمل' : isSkipped ? 'متوقف' : 'خطأ'}
                      </Badge>
                    </div>
                    {p.duration != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>السرعة</span>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--cyan)' }}>{p.duration}ms</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: 'var(--text3)' }}>التكلفة</span>
                      <span className="text-[10px] font-mono font-bold" style={{ color: costInfo.currency === 'مجاني' || costInfo.currency === 'مجاني*' ? 'var(--bull)' : 'var(--gold)' }}>
                        {costInfo.currency}
                      </span>
                    </div>
                    {p.error && (
                      <div className="mt-1 p-1.5 rounded" style={{ background: 'rgba(255,77,106,0.06)' }}>
                        <span className="text-[9px] leading-tight block truncate" style={{ color: 'var(--bear)' }}>{p.error.slice(0, 60)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : (
              // Skeleton when diagnostics haven't loaded yet
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <div className="skeleton h-4 w-20 mb-2 rounded" />
                  <div className="skeleton h-3 w-32 mb-1 rounded" />
                  <div className="skeleton h-3 w-16 rounded" />
                </div>
              ))
            )}
          </div>
          {aiProviders.length > 0 && (
            <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
                  يعمل: <span className="font-bold" style={{ color: 'var(--bull)' }}>{aiProviders.filter(p => p.directTest === 'success').length}</span>
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
                  خطأ: <span className="font-bold" style={{ color: 'var(--bear)' }}>{aiProviders.filter(p => p.directTest === 'failed').length}</span>
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
                  متوقف: <span className="font-bold" style={{ color: 'var(--text4)' }}>{aiProviders.filter(p => p.directTest === 'skipped' || !p.available).length}</span>
                </span>
              </div>
              <Link href="/dashboard/ai-costs">
                <Button variant="ghost" size="sm" className="text-[11px] gap-1" style={{ color: 'var(--cyan)' }}>
                  <DollarSign size={12} /> تفاصيل التكاليف
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Section: Daily Production Stats ═══ */}
      <SectionDivider title="إحصائيات الإنتاج اليومي" icon={CalendarDays} color="var(--gold)" />

      {dailyStats ? (
        <>
          {/* Main Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {
                icon: Newspaper, label: 'إجمالي اليوم', value: dailyStats.today.total,
                trend: dailyStats.trends.totalChange,
                color: '#00E5FF',
                grad: 'linear-gradient(135deg, rgba(0,229,255,0.10) 0%, rgba(0,229,255,0.02) 100%)',
                borderColor: 'rgba(0,229,255,0.12)',
              },
              {
                icon: CheckCircle2, label: 'المنشور', value: dailyStats.today.published,
                trend: dailyStats.trends.publishedChange,
                color: '#00C896',
                grad: 'linear-gradient(135deg, rgba(0,200,150,0.10) 0%, rgba(0,200,150,0.02) 100%)',
                borderColor: 'rgba(0,200,150,0.12)',
              },
              {
                icon: XCircle, label: 'الفاشل', value: dailyStats.today.failed,
                trend: dailyStats.trends.failedChange,
                color: '#FF4D6A',
                grad: 'linear-gradient(135deg, rgba(255,77,106,0.10) 0%, rgba(255,77,106,0.02) 100%)',
                borderColor: 'rgba(255,77,106,0.12)',
              },
              {
                icon: Hourglass, label: 'قيد المعالجة', value: dailyStats.today.inProgress,
                trend: 0,
                color: '#FFB800',
                grad: 'linear-gradient(135deg, rgba(255,184,0,0.10) 0%, rgba(255,184,0,0.02) 100%)',
                borderColor: 'rgba(255,184,0,0.12)',
              },
              {
                icon: CircleDot, label: 'نسبة النجاح', value: dailyStats.today.successRate,
                trend: dailyStats.trends.successRateChange,
                isPercent: true,
                color: dailyStats.today.successRate >= 70 ? '#00C896' : dailyStats.today.successRate >= 40 ? '#FFB800' : '#FF4D6A',
                grad: dailyStats.today.successRate >= 70
                  ? 'linear-gradient(135deg, rgba(0,200,150,0.10) 0%, rgba(0,200,150,0.02) 100%)'
                  : dailyStats.today.successRate >= 40
                    ? 'linear-gradient(135deg, rgba(255,184,0,0.10) 0%, rgba(255,184,0,0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(255,77,106,0.10) 0%, rgba(255,77,106,0.02) 100%)',
                borderColor: dailyStats.today.successRate >= 70
                  ? 'rgba(0,200,150,0.12)'
                  : dailyStats.today.successRate >= 40
                    ? 'rgba(255,184,0,0.12)'
                    : 'rgba(255,77,106,0.12)',
              },
            ].map((stat) => (
              <Card
                key={stat.label}
                className="border-0 overflow-hidden relative group transition-all duration-300 hover:scale-[1.02]"
                style={{ background: stat.grad, border: `1px solid ${stat.borderColor}` }}
              >
                {/* Top glow line */}
                <div className="absolute top-0 left-0 w-full h-[2px] opacity-60" style={{
                  background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)`,
                }} />

                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                      background: `${stat.color}15`,
                      border: `1px solid ${stat.color}20`,
                    }}>
                      <stat.icon size={15} style={{ color: stat.color }} />
                    </div>
                    {/* Trend indicator */}
                    {stat.trend !== 0 && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{
                        background: stat.trend > 0 ? 'rgba(0,200,150,0.1)' : 'rgba(255,77,106,0.1)',
                        color: stat.trend > 0 ? 'var(--bull)' : 'var(--bear)',
                      }}>
                        {stat.trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {Math.abs(stat.trend)}
                      </div>
                    )}
                  </div>
                  <div className="font-mono-price text-[24px] md:text-[28px] font-bold leading-none mb-1" style={{ color: stat.color }}>
                    <AnimatedCounter value={stat.value} />
                    {stat.isPercent && <span className="text-[16px] mr-0.5">%</span>}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--text2)' }}>{stat.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stage Progress + Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Processing Stages Progress */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.1)' }}>
                    <Loader2 size={13} style={{ color: 'var(--cyan)' }} />
                  </div>
                  مراحل المعالجة اليوم
                  <span className="mr-auto font-mono-price text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)' }}>
                    {dailyStats.today.total} مقال
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { stage: 'fetched', label: 'تم الجلب', color: '#64748B', icon: Database },
                  { stage: 'translated', label: 'تمت الترجمة', color: '#00E5FF', icon: Languages },
                  { stage: 'analyzed', label: 'تم التحليل', color: '#8B5CF6', icon: Brain },
                  { stage: 'imaged', label: 'تم توليد الصورة', color: '#00C896', icon: Sparkles },
                ].map(({ stage, label, color, icon: StageIcon }) => {
                  const count = dailyStats.today.byStage[stage] || 0;
                  const pct = dailyStats.today.total > 0 ? Math.round((count / dailyStats.today.total) * 100) : 0;
                  return (
                    <div key={stage} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StageIcon size={12} style={{ color }} />
                          <span className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-price text-[12px] font-bold" style={{ color }}>{count}</span>
                          <span className="text-[10px]" style={{ color: 'var(--text4)' }}>{pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}

                {/* Sentiment Summary */}
                <div className="pt-3 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-bold mb-2 block" style={{ color: 'var(--text3)' }}>التوزيع حسب المشاعر</span>
                  <div className="flex items-center gap-3">
                    {[
                      { key: 'positive', label: 'إيجابي', color: '#00C896' },
                      { key: 'neutral', label: 'محايد', color: '#64748B' },
                      { key: 'negative', label: 'سلبي', color: '#FF4D6A' },
                    ].map(({ key, label, color }) => (
                      <div key={key} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm" style={{ background: color }} />
                        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{label}</span>
                        <span className="font-mono-price text-[10px] font-bold" style={{ color }}>{dailyStats.today.bySentiment[key] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown + News Types */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
                    <BarChart3 size={13} style={{ color: 'var(--purple)' }} />
                  </div>
                  التوزيع حسب الفئة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Category bars */}
                <div className="space-y-2">
                  {dailyStats.today.byCategory.map((cat, i) => {
                    const maxCount = Math.max(...dailyStats.today.byCategory.map(c => c.count), 1);
                    const pct = Math.round((cat.count / maxCount) * 100);
                    const catColors = ['#00E5FF', '#00C896', '#8B5CF6', '#FFB800', '#FF4D6A', '#64748B', '#F97316', '#EC4899'];
                    const color = catColors[i % catColors.length];
                    return (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] truncate max-w-[120px]" style={{ color: 'var(--text2)' }}>{cat.category}</span>
                          <span className="font-mono-price text-[10px] font-bold" style={{ color }}>{cat.count}</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* News Type Summary */}
                <div className="pt-3 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-bold mb-2 block" style={{ color: 'var(--text3)' }}>أنواع الأخبار</span>
                  <div className="flex items-center gap-3 flex-wrap">
                    {[
                      { key: 'live', label: 'مباشر', color: '#00E5FF' },
                      { key: 'breaking', label: 'عاجل', color: '#FF4D6A' },
                      { key: 'article', label: 'مقال', color: '#8B5CF6' },
                    ].map(({ key, label, color }) => (
                      <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: `${color}10` }}>
                        <span className="w-2 h-2 rounded-sm" style={{ background: color }} />
                        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{label}</span>
                        <span className="font-mono-price text-[10px] font-bold" style={{ color }}>{dailyStats.today.byType[key] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pipeline Runs Summary */}
                <div className="pt-3 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-bold mb-2 block" style={{ color: 'var(--text3)' }}>دورات Pipeline اليوم</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
                      <div className="font-mono-price text-[16px] font-bold" style={{ color: 'var(--text)' }}>{dailyStats.pipeline.totalRuns}</div>
                      <div className="text-[9px]" style={{ color: 'var(--text3)' }}>إجمالي</div>
                    </div>
                    <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.1)' }}>
                      <div className="font-mono-price text-[16px] font-bold" style={{ color: 'var(--bull)' }}>{dailyStats.pipeline.completedRuns}</div>
                      <div className="text-[9px]" style={{ color: 'var(--text3)' }}>مكتمل</div>
                    </div>
                    <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,77,106,0.06)', border: '1px solid rgba(255,77,106,0.1)' }}>
                      <div className="font-mono-price text-[16px] font-bold" style={{ color: 'var(--bear)' }}>{dailyStats.pipeline.failedRuns}</div>
                      <div className="text-[9px]" style={{ color: 'var(--text3)' }}>فاشل</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Errors */}
          {dailyStats.recentErrors.length > 0 && (
            <Card className="border-0 mt-4" style={{ background: 'rgba(255,77,106,0.03)', border: '1px solid rgba(255,77,106,0.12)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--bear)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,77,106,0.1)' }}>
                    <AlertCircle size={13} style={{ color: 'var(--bear)' }} />
                  </div>
                  آخر الأخطاء اليوم
                  <span className="mr-auto font-mono-price text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,77,106,0.1)', color: 'var(--bear)' }}>
                    {dailyStats.recentErrors.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dailyStats.recentErrors.map((err, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(255,77,106,0.04)' }}>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,77,106,0.1)' }}>
                      <XCircle size={11} style={{ color: 'var(--bear)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] truncate" style={{ color: 'var(--text)' }}>{err.title}</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--bear)', opacity: 0.8 }}>{err.error}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-[9px] h-5 px-1.5" style={{ borderColor: 'rgba(255,77,106,0.2)', color: 'var(--text3)' }}>
                        {err.stage}
                      </Badge>
                      <span className="text-[9px] font-mono" style={{ color: 'var(--text4)' }}>×{err.retries}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* Skeleton while loading */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      )}

      {/* ═══ Section: Pipeline Health ═══ */}
      <SectionDivider title="صحة Pipeline" icon={Shield} color="var(--bull)" />
      <PipelineMonitor />

      {/* ═══ Section: Visitor Analytics & AI ═══ */}
      <SectionDivider title="التحليلات والزوار" icon={Eye} color="var(--cyan)" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Visitor Analytics — prominent, takes 5 columns */}
        <div className="lg:col-span-5">
          <VisitorAnalytics />
        </div>

        {/* AI Usage + Pipeline Status — 7 columns */}
        <div className="lg:col-span-7 space-y-4">
          {/* AI Usage Summary */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--purple2)' }}>
                  <Brain size={14} style={{ color: 'var(--purple)' }} />
                </div>
                استخدام أدوات الذكاء الاصطناعي
                <span className="mr-auto font-mono-price text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--purple2)', color: 'var(--purple)' }}>
                  {aiTotal.toLocaleString('ar-SA')} إجمالي
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start gap-4 flex-wrap">
                <DonutChart segments={[
                  { value: s.aiUsage.translations, color: '#00E5FF', label: 'ترجمة' },
                  { value: s.aiUsage.analyses, color: '#00C896', label: 'تحليل' },
                  { value: s.aiUsage.articles, color: '#8B5CF6', label: 'توليد' },
                  { value: s.aiUsage.factChecks, color: '#FFB800', label: 'تدقيق' },
                ]} />
                <div className="flex-1 min-w-[150px] space-y-3">
                  {[
                    { label: 'ترجمة', value: s.aiUsage.translations, color: '#00E5FF', pct: aiTotal > 0 ? Math.round((s.aiUsage.translations / aiTotal) * 100) : 0 },
                    { label: 'تحليل', value: s.aiUsage.analyses, color: '#00C896', pct: aiTotal > 0 ? Math.round((s.aiUsage.analyses / aiTotal) * 100) : 0 },
                    { label: 'توليد مقالات', value: s.aiUsage.articles, color: '#8B5CF6', pct: aiTotal > 0 ? Math.round((s.aiUsage.articles / aiTotal) * 100) : 0 },
                    { label: 'تدقيق حقائق', value: s.aiUsage.factChecks, color: '#FFB800', pct: aiTotal > 0 ? Math.round((s.aiUsage.factChecks / aiTotal) * 100) : 0 },
                  ].map(item => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-price text-[11px] font-bold" style={{ color: item.color }}>{item.value}</span>
                          <span className="text-[11px]" style={{ color: 'var(--text4)' }}>{item.pct}%</span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.pct}%`, background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Activity Bar Chart + Pipeline Status — side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pipeline Status */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--cyan2)' }}>
                    <Bot size={13} style={{ color: 'var(--cyan)' }} />
                  </div>
                  حالة Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
                    <div className="font-mono-price text-[18px] font-bold" style={{ color: 'var(--text)' }}>{s.pipelineStats.totalRuns}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text3)' }}>إجمالي</div>
                  </div>
                  <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.1)' }}>
                    <div className="font-mono-price text-[18px] font-bold" style={{ color: 'var(--bull)' }}>{s.pipelineStats.completedRuns}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text3)' }}>ناجح</div>
                  </div>
                  <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(255,77,106,0.06)', border: '1px solid rgba(255,77,106,0.1)' }}>
                    <div className="font-mono-price text-[18px] font-bold" style={{ color: 'var(--bear)' }}>{s.pipelineStats.failedRuns}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text3)' }}>فاشل</div>
                  </div>
                </div>
                <Link href="/dashboard/pipeline" className="block">
                  <Button className="w-full text-[11px] font-bold h-9 rounded-lg" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: 'white' }}>
                    عرض التفاصيل
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* AI Activity Bar Chart */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.1)' }}>
                    <BarChart3 size={13} style={{ color: 'var(--cyan)' }} />
                  </div>
                  نشاط AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiTotal > 0 ? (
                  <BarChart data={[
                    { label: 'ترجمة', value: s.aiUsage.translations, color: '#00E5FF' },
                    { label: 'تحليل', value: s.aiUsage.analyses, color: '#00C896' },
                    { label: 'توليد', value: s.aiUsage.articles, color: '#8B5CF6' },
                    { label: 'تدقيق', value: s.aiUsage.factChecks, color: '#FFB800' },
                  ]} />
                ) : (
                  <div className="min-h-[120px] flex items-center justify-center">
                    <p className="text-[11px]" style={{ color: 'var(--text3)' }}>لا بيانات نشاط حتى الآن</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ═══ Section: English Pipeline ═══ */}
      <SectionDivider title="خط الأنابيب الإنجليزي" icon={Globe} color="#00E5FF" />

      {enPipeline ? (
        <Card className="border-0" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(139,92,246,0.04) 50%, rgba(255,184,0,0.02) 100%)', border: '1px solid rgba(0,229,255,0.15)' }}>
          <CardContent className="p-4">
            {/* EN Pipeline Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.12)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={14} style={{ color: '#00E5FF' }} />
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>EN Articles Total</span>
                </div>
                <div className="font-mono-price text-[20px] font-bold" style={{ color: '#00E5FF' }}>
                  <AnimatedCounter value={enPipeline.totalReady ?? 0} />
                </div>
                <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                  Published: {enPipeline.totalPublished ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.12)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} style={{ color: '#00C896' }} />
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>EN Published Today</span>
                </div>
                <div className="font-mono-price text-[20px] font-bold" style={{ color: '#00C896' }}>
                  <AnimatedCounter value={enPipeline.publishedToday ?? 0} />
                </div>
                <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                  This hour: {enPipeline.publishedThisHour ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.12)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Hourglass size={14} style={{ color: '#FFB800' }} />
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>EN Pending</span>
                </div>
                <div className="font-mono-price text-[20px] font-bold" style={{ color: '#FFB800' }}>
                  <AnimatedCounter value={enPipeline.pending ?? 0} />
                </div>
                <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                  Awaiting: {enPipeline.awaitingProcessing ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} style={{ color: '#8B5CF6' }} />
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>EN Reports</span>
                </div>
                <div className="font-mono-price text-[20px] font-bold" style={{ color: '#8B5CF6' }}>
                  {enPipeline.limits ? `${enPipeline.limits.maxDaily}/${enPipeline.limits.maxHourly}` : '-'}
                </div>
                <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                  Daily / Hourly limits
                </span>
              </div>
            </div>

            {/* EN Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex items-center gap-2.5 justify-start transition-all hover:scale-[1.02] rounded-xl"
                style={{ borderColor: 'rgba(0,229,255,0.2)', background: 'rgba(0,229,255,0.04)' }}
                onClick={() => handleQuickAction('en-full-cycle', '/api/news/cron-en?action=full-cycle')}
                disabled={actionLoading === 'en-full-cycle'}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,229,255,0.12)' }}>
                  <Play size={13} style={{ color: '#00E5FF' }} className={actionLoading === 'en-full-cycle' ? 'animate-spin' : ''} />
                </div>
                <span className="text-[10px] md:text-[11px] font-bold" style={{ color: '#00E5FF' }}>Run EN Full Cycle</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex items-center gap-2.5 justify-start transition-all hover:scale-[1.02] rounded-xl"
                style={{ borderColor: 'rgba(0,200,150,0.2)', background: 'rgba(0,200,150,0.04)' }}
                onClick={() => handleQuickAction('en-daily-brief', '/api/news/cron-en?action=daily-brief')}
                disabled={actionLoading === 'en-daily-brief'}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,200,150,0.12)' }}>
                  <Newspaper size={13} style={{ color: '#00C896' }} className={actionLoading === 'en-daily-brief' ? 'animate-spin' : ''} />
                </div>
                <span className="text-[10px] md:text-[11px] font-bold" style={{ color: '#00C896' }}>Generate EN Daily Brief</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex items-center gap-2.5 justify-start transition-all hover:scale-[1.02] rounded-xl"
                style={{ borderColor: 'rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.04)' }}
                onClick={() => handleQuickAction('en-weekly-analysis', '/api/news/cron-en?action=weekly-analysis')}
                disabled={actionLoading === 'en-weekly-analysis'}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.12)' }}>
                  <BarChart3 size={13} style={{ color: '#8B5CF6' }} className={actionLoading === 'en-weekly-analysis' ? 'animate-spin' : ''} />
                </div>
                <span className="text-[10px] md:text-[11px] font-bold" style={{ color: '#8B5CF6' }}>Generate EN Weekly Analysis</span>
              </Button>
            </div>

            {/* Footer with link */}
            <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(0,229,255,0.15)' }}>
              <div className="flex items-center gap-2">
                <Globe size={12} style={{ color: '#00E5FF' }} />
                <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
                  English Pipeline — Auto-refresh every 60s
                </span>
              </div>
              <Link href="/dashboard/raqeeb-en">
                <Button variant="ghost" size="sm" className="text-[10px] gap-1" style={{ color: '#00E5FF' }}>
                  <Globe size={11} /> لوحة خط الأنابيب EN
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-3 py-6">
              <Loader2 size={16} className="animate-spin" style={{ color: '#00E5FF' }} />
              <span className="text-[12px]" style={{ color: 'var(--text3)' }}>جاري تحميل بيانات خط الأنابيب الإنجليزي...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Section: System & Notifications ═══ */}
      <SectionDivider title="النظام والإشعارات" icon={Activity} color="var(--purple)" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* System Health */}
        <SystemHealth />

        {/* Smart Notifications */}
        <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardContent className="p-4">
            <SmartNotificationCenter />
          </CardContent>
        </Card>
      </div>

      {/* ═══ Section: Recent News ═══ */}
      <SectionDivider title="آخر الأخبار المعالجة" icon={Globe} color="var(--gold)" />

      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardContent className="p-4">
          <ScrollArea className="max-h-[400px] custom-scrollbar">
            {s.recentNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {s.recentNews.map((news) => {
                  const catCfg = CATEGORY_CONFIG[news.category] || { label: news.category, css: 'cat-economy' };
                  const sent = getSentimentStyle(news.sentiment);
                  return (
                    <Link key={news.id} href={`/dashboard/news?edit=${news.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-[var(--bg4)] group border border-transparent hover:border-[var(--border)]">
                      <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: sent.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium truncate" style={{ color: 'var(--text)' }}>{news.titleAr || news.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${catCfg.css}`}>{catCfg.label}</span>
                          <span className="text-[11px]" style={{ color: 'var(--text4)' }}>{formatTimeAgo(news.fetchedAt)}</span>
                          {news.newsType === 'breaking' && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(255,77,106,0.12)', color: 'var(--bear)' }}>عاجل</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center">
                <Newspaper size={28} className="mx-auto mb-2" style={{ color: 'var(--text4)' }} />
                <p className="text-[12px]" style={{ color: 'var(--text3)' }}>لا توجد أخبار معالجة بعد</p>
              </div>
            )}
          </ScrollArea>
          {s.recentNews.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <Link href="/dashboard/news">
                <Button variant="ghost" size="sm" className="w-full text-[11px] gap-1.5 hover:bg-[var(--bg4)]" style={{ color: 'var(--cyan)' }}>
                  عرض جميع الأخبار
                  <ArrowLeft size={12} />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
