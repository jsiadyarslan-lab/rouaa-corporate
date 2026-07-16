// ─── Language Dashboard ──────────────────────────────────────
// Unified production dashboard per language with content-type tabs
// Each tab contains: Stats Counter + Prompts + Model Assignment + Controls
// Replaces the old ProductionControls with a content-centric layout
//
// Tabs: News | Reports | Strategic | Infographic | Video
// Each tab has sub-sections: لوحة العدادات | البرومبتات | تعيين النموذج | التحكم

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Newspaper, FileText, Shield, Layers, Video,
  BarChart3, Brain, Cpu, Settings2,
  Loader2, Save, Play, Clock, Hash, TrendingUp,
  Activity, CheckCircle2, XCircle, AlertTriangle,
  Sparkles, PenLine, ChevronDown, ChevronUp,
  Zap, Send, FileSearch, Film, RefreshCw,
} from 'lucide-react';
import {
  LanguageDashboardLabels,
  arDashboardLabels,
  enDashboardLabels,
  frDashboardLabels,
  trDashboardLabels,
  esDashboardLabels,
} from './language-dashboard-labels';

// Re-export labels
export { arDashboardLabels, enDashboardLabels, frDashboardLabels, trDashboardLabels, esDashboardLabels };

// ─── Types ──────────────────────────────────────────────────
type ContentType = 'news' | 'reports' | 'strategic' | 'infographic' | 'video';
type SubSection = 'stats' | 'prompts' | 'models' | 'controls' | 'generate';

interface PromptItem {
  key: string; name: string; description: string; source: string;
  locale: string; category: string; defaultContent: string;
  customContent: string | null; isActive: boolean;
}

interface PipelineOverview {
  pipeline: {
    version: string; isRunning: boolean; cycleCount: number;
    totalPublished: number; totalFailed: number;
    lastProcessError: string; consecutiveErrors: number;
  };
  articles: {
    total: number; ready: number; pending: number;
    fetched: number; translated: number; analyzed: number;
    imaged: number; rejected: number;
  };
  queue: {
    totalPending: number; totalRunning: number;
    totalDone24h: number; totalFailed24h: number;
  };
}

// ─── Provider Constants ──────────────────────────────────────
const PROVIDER_NAMES: Record<string, string> = {
  bedrock: 'Amazon Bedrock', gemini: 'Google Gemini', groq: 'Groq',
  cerebras: 'Cerebras', mistral: 'Mistral', deepseek: 'DeepSeek',
  glm: 'GLM (ZhipuAI)', nvidia: 'NVIDIA NIM', hf: 'HuggingFace',
  'z-ai-sdk': 'z-ai-sdk', ollama: 'Ollama',
};

const PROVIDER_COLORS: Record<string, string> = {
  bedrock: '#FF9900', gemini: '#4285F4', groq: '#F55036',
  cerebras: '#7C3AED', mistral: '#FF7000', deepseek: '#00B4D8',
  glm: '#00C853', nvidia: '#76B900', hf: '#FFD21E',
  'z-ai-sdk': '#00E5FF', ollama: '#6366F1',
};

// ─── Content type → pipeline key mapping ────────────────────
const CONTENT_PIPELINE_KEYS: Record<ContentType, (locale: string) => string> = {
  news: (l) => `models_${l}_news`,
  reports: (l) => `models_${l}_reports`,
  strategic: (l) => `models_${l}_reports`, // shares with reports
  infographic: (l) => `models_${l}_infographic`,
  video: (l) => `models_${l}_video`,
};

// ─── Content type → prompt categories ───────────────────────
const CONTENT_PROMPT_CATEGORIES: Record<ContentType, string[]> = {
  news: ['fetch', 'analyze', 'translate', 'classify', 'other'],
  reports: ['reports', 'categoryReports', 'otherReport'],
  strategic: ['reports', 'categoryReports'],
  infographic: ['infographic'],
  video: ['video'],
};

// ─── Component Props ────────────────────────────────────────
interface LanguageDashboardProps {
  locale: 'ar' | 'en' | 'fr' | 'tr' | 'es';
  labels: LanguageDashboardLabels;
}

// ─── Main Component ─────────────────────────────────────────
export default function LanguageDashboard({ locale, labels }: LanguageDashboardProps) {
  const { dir } = labels;
  const [activeTab, setActiveTab] = useState<ContentType>('news');
  const [activeSubSection, setActiveSubSection] = useState<SubSection>('stats');
  const [loading, setLoading] = useState(true);

  // ── Data State ──
  const [statsData, setStatsData] = useState<any>(null);
  const [promptsData, setPromptsData] = useState<PromptItem[]>([]);
  const [modelsData, setModelsData] = useState<any>(null);
  const [pipelineData, setPipelineData] = useState<PipelineOverview | null>(null);
  const [limits, setLimits] = useState({ maxPublishedPerDay: 200, maxPublishedPerHour: 20 });

  // ── Prompts State ──
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [promptsSaving, setPromptsSaving] = useState<string | null>(null);

  // ── Models State ──
  const [localMappings, setLocalMappings] = useState<Record<string, string>>({});
  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>({});
  const [modelsSaving, setModelsSaving] = useState<string | null>(null);

  // ── Limits State ──
  const [limitsSaving, setLimitsSaving] = useState(false);

  // ── Pipeline Control ──
  const [startingPipeline, setStartingPipeline] = useState(false);

  // ── Generate State ──
  const [generating, setGenerating] = useState<string | null>(null); // which generation is running
  const [genResults, setGenResults] = useState<Record<string, any>>({});

  // ── Load data on mount ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, pipelineRes] = await Promise.all([
          fetch('/api/admin/settings').catch(() => null),
          fetch('/api/admin/pipeline?section=overview').catch(() => null),
        ]);

        const settingsData = settingsRes ? await settingsRes.json().catch(() => ({ settings: {} })) : { settings: {} };
        const pipelineResult = pipelineRes ? await pipelineRes.json().catch(() => null) : null;

        // Pipeline limits
        const ps = settingsData.settings?.pipeline || {};
        setLimits({
          maxPublishedPerDay: parseInt(ps.pipeline_maxPublishedPerDay) || 200,
          maxPublishedPerHour: parseInt(ps.pipeline_maxPublishedPerHour) || 20,
        });

        if (pipelineResult) setPipelineData(pipelineResult);

        // Fetch prompts
        fetch('/api/admin/prompts').then(r => r?.json?.()).then((pData: any) => {
          if (pData?.prompts) {
            const localePrompts = pData.prompts.filter((p: any) => p.locale === locale);
            setPromptsData(localePrompts);
          }
        }).catch(err => console.warn(`[${locale} Dashboard] Prompts fetch failed:`, err));

        // Fetch production stats
        fetch(`/api/admin/production-stats?locale=${locale}`).then(r => r?.json?.()).then(data => {
          if (data) setStatsData(data);
        }).catch(err => console.warn(`[${locale} Dashboard] Stats fetch failed:`, err));

        // Fetch models
        fetch('/api/admin/models').then(r => r?.json?.()).then(data => {
          if (data) {
            setModelsData(data);
            const mappings: Record<string, string> = {};
            for (const m of data.pipelineMappings || []) {
              mappings[m.key] = m.currentProvider;
            }
            setLocalMappings(mappings);
            const toggles: Record<string, boolean> = {};
            for (const p of data.providers || []) {
              toggles[p.name] = !p.disabled;
            }
            setLocalToggles(toggles);
          }
        }).catch(err => console.warn(`[${locale} Dashboard] Models fetch failed:`, err));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [locale]);

  // ── Auto-refresh stats every 60 seconds ──
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/admin/production-stats?locale=${locale}`).then(r => r?.json?.()).then(data => {
        if (data) setStatsData(data);
      }).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [locale]);

  // ── Save pipeline limits ──
  const saveLimits = async () => {
    setLimitsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group: 'pipeline',
          settings: {
            maxPublishedPerDay: String(limits.maxPublishedPerDay),
            maxPublishedPerHour: String(limits.maxPublishedPerHour),
          },
        }),
      });
      if (res.ok) {
        toast.success(labels.toast.limitsSaved);
      } else {
        toast.error(labels.toast.limitsSaveFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setLimitsSaving(false);
    }
  };

  // ── Save prompt ──
  const savePrompt = async (key: string) => {
    setPromptsSaving(key);
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, locale, content: editContent }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(labels.toast.promptSaved);
        setPromptsData(prev => prev.map(p => p.key === key ? { ...p, customContent: editContent } : p));
        setEditingPrompt(null);
      } else {
        toast.error(data.error || labels.toast.promptSaveFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setPromptsSaving(null);
    }
  };

  // ── Toggle prompt active ──
  const togglePrompt = async (key: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, locale, isActive: !isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(!isActive ? labels.toast.promptEnabled : labels.toast.promptDisabled);
        setPromptsData(prev => prev.map(p => p.key === key ? { ...p, isActive: !isActive } : p));
      } else {
        toast.error(labels.toast.promptToggleFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    }
  };

  // ── Save model mapping ──
  const saveModelMapping = async (pipelineKey: string, provider: string) => {
    setModelsSaving(pipelineKey);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'mapping', key: pipelineKey, value: provider }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(labels.toast.mappingUpdated);
        setLocalMappings(prev => ({ ...prev, [pipelineKey]: provider }));
      } else {
        toast.error(labels.toast.mappingUpdateFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setModelsSaving(null);
    }
  };

  // ── Toggle provider ──
  const toggleProvider = async (providerName: string, currentlyEnabled: boolean) => {
    setModelsSaving(`toggle-${providerName}`);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'toggle', key: providerName, value: String(!currentlyEnabled) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(currentlyEnabled ? labels.toast.modelDisabled : labels.toast.modelEnabled);
        setLocalToggles(prev => ({ ...prev, [providerName]: !currentlyEnabled }));
      } else {
        toast.error(labels.toast.modelToggleFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setModelsSaving(null);
    }
  };

  // ── Start pipeline ──
  const startPipeline = async () => {
    setStartingPipeline(true);
    try {
      const res = await fetch('/api/admin/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: `start-${locale}` }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(labels.toast.pipelineStarted);
      } else {
        toast.error(data.error || labels.toast.pipelineStartFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setStartingPipeline(false);
    }
  };

  // ── Get prompts for current content type ──
  const getCurrentPrompts = useCallback((): PromptItem[] => {
    const categories = CONTENT_PROMPT_CATEGORIES[activeTab];
    return promptsData.filter(p => categories.includes(p.category));
  }, [promptsData, activeTab]);

  // ── Get pipeline key for current content type ──
  const getCurrentPipelineKey = useCallback((): string => {
    return CONTENT_PIPELINE_KEYS[activeTab](locale);
  }, [activeTab, locale]);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir={dir}>
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="mr-3 text-slate-400">{labels.loading}</span>
      </div>
    );
  }

  const tabConfig: { key: ContentType; icon: any; label: string }[] = [
    { key: 'news', icon: Newspaper, label: labels.tabs.news },
    { key: 'reports', icon: FileText, label: labels.tabs.reports },
    { key: 'strategic', icon: Shield, label: labels.tabs.strategic },
    { key: 'infographic', icon: Layers, label: labels.tabs.infographic },
    { key: 'video', icon: Video, label: labels.tabs.video },
  ];

  const subSections: { key: SubSection; icon: any; label: string }[] = [
    { key: 'stats', icon: BarChart3, label: labels.subSections.stats },
    { key: 'prompts', icon: PenLine, label: labels.subSections.prompts },
    { key: 'models', icon: Cpu, label: labels.subSections.models },
    { key: 'controls', icon: Settings2, label: labels.subSections.controls },
    { key: 'generate', icon: Zap, label: labels.subSections.generate },
  ];

  return (
    <div className="space-y-4" dir={dir}>
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{labels.localeFlag}</span>
        <div>
          <h1 className="text-xl font-bold text-white">{labels.title}</h1>
          <p className="text-sm text-slate-400">{labels.subtitle}</p>
        </div>
        <Badge variant="outline" className="ml-auto border-cyan-500/30 text-cyan-400">
          locale={locale}
        </Badge>
      </div>

      {/* ── Content Type Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {tabConfig.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setActiveSubSection('stats'); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                ${isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,229,255,0.1)]'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-300'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Sub-Section Navigation ── */}
      <div className="flex gap-1 border-b border-slate-700/50 pb-0">
        {subSections.map(sec => {
          const Icon = sec.icon;
          const isActive = activeSubSection === sec.key;
          // Hide prompts for strategic (no dedicated prompts)
          if (activeTab === 'strategic' && sec.key === 'prompts') return null;
          return (
            <button
              key={sec.key}
              onClick={() => setActiveSubSection(sec.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-all
                ${isActive
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* ── Content Area ── */}
      <div className="mt-4">
        {activeSubSection === 'stats' && (
          <StatsSection
            locale={locale}
            contentType={activeTab}
            statsData={statsData}
            pipelineData={pipelineData}
            labels={labels}
          />
        )}
        {activeSubSection === 'prompts' && (
          <PromptsSection
            locale={locale}
            contentType={activeTab}
            prompts={getCurrentPrompts()}
            allPrompts={promptsData}
            expandedPrompt={expandedPrompt}
            setExpandedPrompt={setExpandedPrompt}
            editingPrompt={editingPrompt}
            setEditingPrompt={setEditingPrompt}
            editContent={editContent}
            setEditContent={setEditContent}
            promptsSaving={promptsSaving}
            savePrompt={savePrompt}
            togglePrompt={togglePrompt}
            labels={labels}
          />
        )}
        {activeSubSection === 'models' && (
          <ModelsSection
            locale={locale}
            contentType={activeTab}
            modelsData={modelsData}
            localMappings={localMappings}
            localToggles={localToggles}
            modelsSaving={modelsSaving}
            saveModelMapping={saveModelMapping}
            toggleProvider={toggleProvider}
            getCurrentPipelineKey={getCurrentPipelineKey}
            labels={labels}
          />
        )}
        {activeSubSection === 'controls' && (
          <ControlsSection
            locale={locale}
            contentType={activeTab}
            pipelineData={pipelineData}
            limits={limits}
            setLimits={setLimits}
            limitsSaving={limitsSaving}
            saveLimits={saveLimits}
            startingPipeline={startingPipeline}
            startPipeline={startPipeline}
            labels={labels}
          />
        )}
        {activeSubSection === 'generate' && (
          <GenerateSection
            locale={locale}
            contentType={activeTab}
            generating={generating}
            setGenerating={setGenerating}
            genResults={genResults}
            setGenResults={setGenResults}
            startPipeline={startPipeline}
            startingPipeline={startingPipeline}
            labels={labels}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STATS SECTION — Publishing & Fetching Counters
// ═══════════════════════════════════════════════════════════════
function StatsSection({
  locale, contentType, statsData, pipelineData, labels,
}: {
  locale: string; contentType: ContentType;
  statsData: any; pipelineData: PipelineOverview | null;
  labels: LanguageDashboardLabels;
}) {
  // Extract relevant stats based on content type
  const getStatsCards = () => {
    if (!statsData) return [];

    switch (contentType) {
      case 'news': {
        const news = statsData.news || {};
        return [
          { label: labels.stats.totalPublished, value: news.totalPublished ?? 0, icon: Newspaper, color: '#00E5FF' },
          { label: labels.stats.todayPublished, value: news.todayPublished ?? 0, icon: TrendingUp, color: '#22C55E' },
          { label: labels.stats.thisWeek, value: news.thisWeek ?? 0, icon: BarChart3, color: '#8B5CF6' },
          { label: labels.stats.thisMonth, value: news.thisMonth ?? 0, icon: Hash, color: '#F59E0B' },
          { label: labels.stats.totalFetched, value: news.totalPublished ?? 0, icon: Activity, color: '#3BA7F0' },
          { label: labels.stats.successRate, value: `${news.successRate ?? 0}%`, icon: CheckCircle2, color: '#10B981' },
        ];
      }
      case 'reports': {
        const reports = statsData.reports || {};
        return [
          { label: labels.stats.totalPublished, value: reports.totalPublished ?? 0, icon: FileText, color: '#00E5FF' },
          { label: labels.stats.todayGen, value: reports.todayGenerated ?? 0, icon: TrendingUp, color: '#22C55E' },
          { label: labels.stats.thisWeek, value: reports.thisWeek ?? 0, icon: BarChart3, color: '#8B5CF6' },
          { label: labels.stats.thisMonth, value: reports.thisMonth ?? 0, icon: Hash, color: '#F59E0B' },
        ];
      }
      case 'strategic': {
        const reports = statsData.reports || {};
        return [
          { label: labels.stats.totalPublished, value: reports.totalPublished ?? 0, icon: Shield, color: '#00E5FF' },
          { label: labels.stats.todayGen, value: reports.todayGenerated ?? 0, icon: TrendingUp, color: '#22C55E' },
          { label: labels.stats.thisWeek, value: reports.thisWeek ?? 0, icon: BarChart3, color: '#8B5CF6' },
        ];
      }
      case 'infographic': {
        const infog = statsData.infographics || {};
        return [
          { label: labels.stats.totalPublished, value: infog.totalPublished ?? 0, icon: Layers, color: '#00E5FF' },
          { label: labels.stats.todayGen, value: infog.todayGenerated ?? 0, icon: TrendingUp, color: '#22C55E' },
          { label: labels.stats.thisWeek, value: infog.thisWeek ?? 0, icon: BarChart3, color: '#8B5CF6' },
          { label: labels.stats.thisMonth, value: infog.thisMonth ?? 0, icon: Hash, color: '#F59E0B' },
        ];
      }
      case 'video': {
        const videos = statsData.videos || {};
        return [
          { label: labels.stats.totalPublished, value: videos.totalCompleted ?? 0, icon: Video, color: '#00E5FF' },
          { label: labels.stats.todayGen, value: videos.todayGenerated ?? 0, icon: TrendingUp, color: '#22C55E' },
          { label: labels.stats.thisWeek, value: videos.thisWeek ?? 0, icon: BarChart3, color: '#8B5CF6' },
        ];
      }
      default:
        return [];
    }
  };

  const statsCards = getStatsCards();

  // Pipeline stats
  const pipelineStats = pipelineData?.pipeline;
  const articles = pipelineData?.articles;

  // Category breakdown for news — API returns array of {category, count}
  const newsByCategoryRaw: Array<{category: string; count: number}> = statsData?.news?.byCategory || [];
  const newsByStage = statsData?.news?.byStage || {};

  // Reports by type — API returns Record<string, number> for byType, array for byAssetClass
  const reportsByType: Record<string, number> = statsData?.reports?.byType || {};
  const reportsByAssetClassRaw: Array<{assetClass: string; count: number}> = statsData?.reports?.byAssetClass || [];

  return (
    <div className="space-y-4">
      {/* ── Counter Cards Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statsCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="bg-slate-800/60 border-slate-700/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                  <span className="text-[10px] text-slate-400 leading-tight">{card.label}</span>
                </div>
                <div className="text-xl font-bold text-white" style={{ color: card.color }}>
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Pipeline Overview ── */}
      {pipelineStats && (
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              {labels.stats.pipelineSection}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-white">{pipelineStats.totalPublished}</div>
                <div className="text-[10px] text-slate-400">{labels.stats.published}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-400">{pipelineStats.totalFailed}</div>
                <div className="text-[10px] text-slate-400">{labels.pipeline.failed}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-cyan-400">{pipelineStats.cycleCount}</div>
                <div className="text-[10px] text-slate-400">{labels.pipeline.cycle}</div>
              </div>
              <div className="flex items-center justify-center gap-1">
                {pipelineStats.isRunning ? (
                  <><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-xs text-green-400">{labels.pipeline.running}</span></>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-slate-500" /><span className="text-xs text-slate-500">{labels.pipeline.stopped}</span></>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Articles by Stage (News only) ── */}
      {contentType === 'news' && articles && (
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Hash className="w-4 h-4 text-violet-400" />
              {labels.stats.newsStages}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 text-center">
              {[
                { key: 'total', label: labels.pipeline.totalArticles, color: '#94A3B8' },
                { key: 'fetched', label: labels.stats.totalFetched, color: '#3BA7F0' },
                { key: 'translated', label: labels.pipeline.translated, color: '#8B5CF6' },
                { key: 'analyzed', label: labels.pipeline.analyzed, color: '#F59E0B' },
                { key: 'imaged', label: labels.pipeline.imaged, color: '#00C853' },
                { key: 'ready', label: labels.pipeline.ready, color: '#00E5FF' },
                { key: 'pending', label: labels.pipeline.pending, color: '#64748B' },
                { key: 'rejected', label: labels.pipeline.rejected, color: '#EF4444' },
              ].map(stage => (
                <div key={stage.key}>
                  <div className="text-sm font-bold" style={{ color: stage.color }}>
                    {(articles as any)[stage.key] ?? 0}
                  </div>
                  <div className="text-[9px] text-slate-500">{stage.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── By Category (News) ── */}
      {contentType === 'news' && newsByCategoryRaw.length > 0 && (
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              {labels.stats.byCategory}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {newsByCategoryRaw
                .slice(0, 8)
                .map((item) => {
                  const maxCount = Math.max(...newsByCategoryRaw.map(i => i.count), 1);
                  const pct = (item.count / maxCount) * 100;
                  return (
                    <div key={item.category} className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 w-24 text-left truncate">{item.category}</span>
                      <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-300 w-8 text-right">{item.count}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Reports by Type ── */}
      {(contentType === 'reports' || contentType === 'strategic') && Object.keys(reportsByType).length > 0 && (
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              {labels.stats.byType}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(reportsByType).map(([type, count]) => (
                <Badge key={type} variant="outline" className="border-cyan-500/30 text-cyan-300">
                  {type}: {count as number}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Reports by Asset Class ── */}
      {(contentType === 'reports' || contentType === 'strategic') && reportsByAssetClassRaw.length > 0 && (
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              {labels.stats.byAssetClass}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {reportsByAssetClassRaw
                .slice(0, 10)
                .map((item) => {
                  const maxCount = Math.max(...reportsByAssetClassRaw.map(i => i.count), 1);
                  const pct = (item.count / maxCount) * 100;
                  return (
                    <div key={item.assetClass} className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 w-28 text-left truncate">{item.assetClass}</span>
                      <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-300 w-8 text-right">{item.count}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {!statsData && (
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">{labels.stats.noStatsTitle}</p>
            <p className="text-xs text-slate-500 mt-1">{labels.stats.noStatsSubtitle}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROMPTS SECTION — News Prompts & Classification Reports
// ═══════════════════════════════════════════════════════════════
function PromptsSection({
  locale, contentType, prompts, allPrompts,
  expandedPrompt, setExpandedPrompt,
  editingPrompt, setEditingPrompt,
  editContent, setEditContent,
  promptsSaving, savePrompt, togglePrompt,
  labels,
}: {
  locale: string; contentType: ContentType;
  prompts: PromptItem[]; allPrompts: PromptItem[];
  expandedPrompt: string | null; setExpandedPrompt: (k: string | null) => void;
  editingPrompt: string | null; setEditingPrompt: (k: string | null) => void;
  editContent: string; setEditContent: (c: string) => void;
  promptsSaving: string | null; savePrompt: (k: string) => void;
  togglePrompt: (k: string, a: boolean) => void;
  labels: LanguageDashboardLabels;
}) {
  // Group prompts by category
  const groupedPrompts = prompts.reduce<Record<string, PromptItem[]>>((acc, p) => {
    const group = p.category || 'other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  // Category display names
  const categoryNames: Record<string, string> = {
    fetch: labels.prompts.fetchGroup,
    analyze: labels.prompts.analyzeGroup,
    translate: labels.prompts.translateGroup,
    classify: labels.prompts.classifyGroup,
    other: labels.prompts.otherGroup,
    reports: labels.prompts.reportsGroup,
    infographic: labels.prompts.infographicGroup,
    video: labels.prompts.videoGroup,
    otherReport: labels.prompts.otherReportGroup,
    categoryReports: labels.prompts.categoryReports,
  };

  // Category order
  const categoryOrder = ['fetch', 'analyze', 'translate', 'classify', 'other', 'reports', 'categoryReports', 'infographic', 'video', 'otherReport'];

  // Also get classification report prompts specifically (for news tab)
  const classificationPrompts = contentType === 'news'
    ? allPrompts.filter(p => p.category === 'categoryReports')
    : [];

  return (
    <div className="space-y-4">
      {/* ── Classification Reports Banner (News tab only) ── */}
      {contentType === 'news' && classificationPrompts.length > 0 && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {labels.prompts.categoryReports}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {classificationPrompts.map(prompt => (
                <PromptCard
                  key={prompt.key}
                  prompt={prompt}
                  isExpanded={expandedPrompt === prompt.key}
                  onToggle={() => setExpandedPrompt(expandedPrompt === prompt.key ? null : prompt.key)}
                  isEditing={editingPrompt === prompt.key}
                  onEdit={() => { setEditingPrompt(prompt.key); setEditContent(prompt.customContent || prompt.defaultContent); }}
                  editContent={editContent}
                  setEditContent={setEditContent}
                  isSaving={promptsSaving === prompt.key}
                  onSave={() => savePrompt(prompt.key)}
                  onCancel={() => setEditingPrompt(null)}
                  onToggleActive={() => togglePrompt(prompt.key, prompt.isActive)}
                  labels={labels}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Grouped Prompts ── */}
      {categoryOrder.map(category => {
        const groupPrompts = groupedPrompts[category];
        if (!groupPrompts || groupPrompts.length === 0) return null;

        return (
          <Card key={category} className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-400" />
                {categoryNames[category] || category}
                <Badge variant="secondary" className="text-[10px] bg-slate-700 text-slate-300">
                  {groupPrompts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupPrompts.map(prompt => (
                  <PromptCard
                    key={prompt.key}
                    prompt={prompt}
                    isExpanded={expandedPrompt === prompt.key}
                    onToggle={() => setExpandedPrompt(expandedPrompt === prompt.key ? null : prompt.key)}
                    isEditing={editingPrompt === prompt.key}
                    onEdit={() => { setEditingPrompt(prompt.key); setEditContent(prompt.customContent || prompt.defaultContent); }}
                    editContent={editContent}
                    setEditContent={setEditContent}
                    isSaving={promptsSaving === prompt.key}
                    onSave={() => savePrompt(prompt.key)}
                    onCancel={() => setEditingPrompt(null)}
                    onToggleActive={() => togglePrompt(prompt.key, prompt.isActive)}
                    labels={labels}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {prompts.length === 0 && (
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardContent className="p-8 text-center">
            <PenLine className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">{labels.prompts.noPrompts}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Prompt Card Sub-Component ──────────────────────────────
function PromptCard({
  prompt, isExpanded, onToggle,
  isEditing, onEdit, editContent, setEditContent,
  isSaving, onSave, onCancel, onToggleActive,
  labels,
}: {
  prompt: PromptItem; isExpanded: boolean; onToggle: () => void;
  isEditing: boolean; onEdit: () => void;
  editContent: string; setEditContent: (c: string) => void;
  isSaving: boolean; onSave: () => void; onCancel: () => void;
  onToggleActive: () => void; labels: LanguageDashboardLabels;
}) {
  return (
    <div className={`rounded-lg border transition-all ${
      prompt.isActive ? 'border-slate-600/50 bg-slate-800/40' : 'border-red-900/30 bg-red-950/10 opacity-60'
    }`}>
      {/* ── Prompt Header ── */}
      <div className="flex items-center gap-2 p-2.5">
        <button onClick={onToggle} className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-200">{prompt.name}</span>
            {prompt.customContent && (
              <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400">
                {labels.prompts.customBadge}
              </Badge>
            )}
            <Badge variant="outline" className={`text-[9px] ${prompt.isActive ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}>
              {prompt.isActive ? labels.prompts.active : labels.prompts.inactive}
            </Badge>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{prompt.description}</p>
        </button>

        <Switch
          checked={prompt.isActive}
          onCheckedChange={onToggleActive}
          className="scale-75"
        />
        <Button variant="ghost" size="sm" onClick={onToggle} className="h-6 w-6 p-0">
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </div>

      {/* ── Expanded Content ── */}
      {isExpanded && (
        <div className="px-2.5 pb-2.5 border-t border-slate-700/30">
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] border-slate-600 text-slate-400">
              {labels.prompts.source}: {prompt.source}
            </Badge>
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full h-40 bg-slate-900/80 border border-slate-600 rounded-md p-2 text-xs text-slate-200 font-mono resize-y focus:border-cyan-500 focus:outline-none"
                dir="ltr"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={onSave} disabled={isSaving} className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700">
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                  {labels.prompts.save}
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">
                  {labels.prompts.cancel}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              {prompt.customContent && (
                <div>
                  <div className="text-[9px] text-amber-400 mb-1">{labels.prompts.customContent}:</div>
                  <pre className="text-[10px] text-slate-300 bg-slate-900/60 rounded p-2 max-h-32 overflow-auto whitespace-pre-wrap" dir="ltr">
                    {prompt.customContent.slice(0, 500)}{prompt.customContent.length > 500 ? '...' : ''}
                  </pre>
                </div>
              )}
              <div>
                <div className="text-[9px] text-slate-500 mb-1">{labels.prompts.defaultContent}:</div>
                <pre className="text-[10px] text-slate-400 bg-slate-900/40 rounded p-2 max-h-32 overflow-auto whitespace-pre-wrap" dir="ltr">
                  {prompt.defaultContent.slice(0, 500)}{prompt.defaultContent.length > 500 ? '...' : ''}
                </pre>
              </div>
              <Button size="sm" variant="outline" onClick={onEdit} className="h-7 text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                <PenLine className="w-3 h-3 mr-1" />
                {labels.prompts.edit}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODELS SECTION — Model-to-Pipeline Assignment + Enable/Disable
// ═══════════════════════════════════════════════════════════════
function ModelsSection({
  locale, contentType, modelsData,
  localMappings, localToggles, modelsSaving,
  saveModelMapping, toggleProvider, getCurrentPipelineKey,
  labels,
}: {
  locale: string; contentType: ContentType;
  modelsData: any; localMappings: Record<string, string>;
  localToggles: Record<string, boolean>; modelsSaving: string | null;
  saveModelMapping: (key: string, provider: string) => void;
  toggleProvider: (name: string, enabled: boolean) => void;
  getCurrentPipelineKey: () => string;
  labels: LanguageDashboardLabels;
}) {
  const currentPipelineKey = getCurrentPipelineKey();

  // Get the current mapping for this content type
  const currentMapping = modelsData?.pipelineMappings?.find(
    (m: any) => m.key === currentPipelineKey
  );

  // Get available providers
  const providers = modelsData?.providers || [];

  // Circuit breakers
  const circuitBreakers = modelsData?.circuitBreakers || {};

  return (
    <div className="space-y-4">
      {/* ── Current Pipeline Model Assignment ── */}
      <Card className="bg-slate-800/40 border-cyan-500/20 border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-300 flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            {labels.models.currentAssignment}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentMapping ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{currentMapping.label || currentMapping.key}</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="text-cyan-400 font-medium">
                  {PROVIDER_NAMES[localMappings[currentPipelineKey] || currentMapping.currentProvider] || localMappings[currentPipelineKey] || currentMapping.currentProvider}
                </span>
                {currentMapping.isCustom && (
                  <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400">
                    {labels.models.custom}
                  </Badge>
                )}
              </div>

              {/* Model selector */}
              <div className="flex items-center gap-2">
                <Select
                  value={localMappings[currentPipelineKey] || currentMapping.currentProvider}
                  onValueChange={(val) => saveModelMapping(currentPipelineKey, val)}
                >
                  <SelectTrigger className="w-64 h-8 text-xs bg-slate-900/80 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {providers.filter((p: any) => p.available).map((p: any) => (
                      <SelectItem key={p.name} value={p.name} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[p.name] || '#64748B' }} />
                          {PROVIDER_NAMES[p.name] || p.name}
                          <span className="text-[9px] text-slate-500">({p.model})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {modelsSaving === currentPipelineKey && (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                )}
              </div>

              {currentMapping.defaultProvider !== (localMappings[currentPipelineKey] || currentMapping.currentProvider) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => saveModelMapping(currentPipelineKey, currentMapping.defaultProvider)}
                  className="h-6 text-[10px] text-slate-400 hover:text-cyan-400"
                >
                  {labels.models.resetToDefault}: {PROVIDER_NAMES[currentMapping.defaultProvider]}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{labels.models.noModelsTitle}</p>
          )}
        </CardContent>
      </Card>

      {/* ── All Providers with Enable/Disable ── */}
      <Card className="bg-slate-800/40 border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            {labels.models.providers}
            <Badge variant="secondary" className="text-[10px] bg-slate-700 text-slate-300">
              {providers.filter((p: any) => p.available && localToggles[p.name] !== false).length} {labels.models.activeCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {providers.map((p: any) => {
              const isEnabled = localToggles[p.name] !== false;
              const isSavingThis = modelsSaving === `toggle-${p.name}`;
              return (
                <div
                  key={p.name}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                    !p.available
                      ? 'bg-slate-900/30 opacity-50'
                      : isEnabled
                        ? 'bg-slate-800/60'
                        : 'bg-red-950/10 border border-red-900/20'
                  }`}
                >
                  {/* Provider dot + name */}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.available ? (PROVIDER_COLORS[p.name] || '#64748B') : '#334155' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {PROVIDER_NAMES[p.name] || p.name}
                      </span>
                      {!p.available && (
                        <Badge variant="outline" className="text-[9px] border-red-500/30 text-red-400">
                          {labels.models.noApiKey}
                        </Badge>
                      )}
                      {p.available && !isEnabled && (
                        <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400">
                          {labels.models.disabledManually}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">{p.model}</span>
                  </div>

                  {/* Enable/Disable Switch */}
                  <div className="flex items-center gap-1.5">
                    {isSavingThis && <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />}
                    <Switch
                      checked={isEnabled && p.available}
                      disabled={!p.available}
                      onCheckedChange={() => toggleProvider(p.name, isEnabled)}
                      className="scale-75"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Circuit Breakers ── */}
      {Object.keys(circuitBreakers).length > 0 && (
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              {labels.models.circuitBreakers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(circuitBreakers).map(([name, cb]: [string, any]) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  {cb.open ? (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  )}
                  <span className="font-medium text-slate-300">{PROVIDER_NAMES[name] || name}</span>
                  <Badge variant="outline" className={`text-[9px] ${cb.open ? 'border-red-500/30 text-red-400' : 'border-green-500/30 text-green-400'}`}>
                    {cb.open ? labels.models.open : labels.models.closed}
                  </Badge>
                  <span className="text-[9px] text-slate-500">{cb.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── All Pipeline Mappings Overview ── */}
      <Card className="bg-slate-800/40 border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-violet-400" />
            {labels.models.allMappings}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {modelsData?.pipelineMappings?.map((m: any) => {
              const isCurrentPipeline = m.key === currentPipelineKey;
              return (
                <div
                  key={m.key}
                  className={`flex items-center gap-2 p-1.5 rounded text-xs ${
                    isCurrentPipeline ? 'bg-cyan-500/10 border border-cyan-500/20' : ''
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[localMappings[m.key] || m.currentProvider] || '#64748B' }} />
                  <span className="text-slate-400 w-36">{m.label || m.key}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className="text-slate-200 font-medium">
                    {PROVIDER_NAMES[localMappings[m.key] || m.currentProvider] || localMappings[m.key] || m.currentProvider}
                  </span>
                  {isCurrentPipeline && (
                    <Badge variant="outline" className="text-[9px] border-cyan-500/30 text-cyan-400 ml-1">
                      {labels.models.currentTab}
                    </Badge>
                  )}
                  {m.isCustom && (
                    <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400">
                      {labels.models.custom}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── ArrowRight icon (small inline) ───
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// ─── Server icon (small inline) ───
function Server({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" /><rect width="20" height="8" x="2" y="14" rx="2" ry="2" /><line x1="6" x2="6.01" y1="6" y2="6" /><line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONTROLS SECTION — Pipeline Controls & Limits
// ═══════════════════════════════════════════════════════════════
function ControlsSection({
  locale, contentType, pipelineData,
  limits, setLimits, limitsSaving, saveLimits,
  startingPipeline, startPipeline,
  labels,
}: {
  locale: string; contentType: ContentType;
  pipelineData: PipelineOverview | null;
  limits: { maxPublishedPerDay: number; maxPublishedPerHour: number };
  setLimits: (l: { maxPublishedPerDay: number; maxPublishedPerHour: number }) => void;
  limitsSaving: boolean; saveLimits: () => void;
  startingPipeline: boolean; startPipeline: () => void;
  labels: LanguageDashboardLabels;
}) {
  const pipeline = pipelineData?.pipeline;
  const articles = pipelineData?.articles;
  const queue = pipelineData?.queue;

  return (
    <div className="space-y-4">
      {/* ── Pipeline Status ── */}
      <Card className="bg-slate-800/40 border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            {labels.pipeline.status}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            {pipeline?.isRunning ? (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-green-400 font-medium">{labels.pipeline.running}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-500" />
                <span className="text-sm text-slate-500">{labels.pipeline.stopped}</span>
                <Button
                  size="sm"
                  onClick={startPipeline}
                  disabled={startingPipeline}
                  className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700 ml-2"
                >
                  {startingPipeline ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                  {labels.pipeline.startPipeline}
                </Button>
              </div>
            )}
            {pipeline && (
              <div className="text-xs text-slate-400">
                {labels.pipeline.cycle}: {pipeline.cycleCount} | {labels.pipeline.published}: {pipeline.totalPublished} | {labels.pipeline.failed}: {pipeline.totalFailed}
              </div>
            )}
          </div>

          {/* Articles stages */}
          {articles && (
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
              {[
                { key: 'total', label: labels.pipeline.totalArticles },
                { key: 'pending', label: labels.pipeline.pending },
                { key: 'fetched', label: labels.stats.totalFetched },
                { key: 'translated', label: labels.pipeline.translated },
                { key: 'analyzed', label: labels.pipeline.analyzed },
                { key: 'ready', label: labels.pipeline.ready },
                { key: 'rejected', label: labels.pipeline.rejected },
              ].map(s => (
                <div key={s.key} className="bg-slate-900/50 rounded p-1.5">
                  <div className="text-sm font-bold text-slate-200">{(articles as any)[s.key] ?? 0}</div>
                  <div className="text-[9px] text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Queue Status ── */}
      {queue && (
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              {labels.pipeline.queueStatus}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-sm font-bold text-amber-400">{queue.totalPending}</div>
                <div className="text-[9px] text-slate-500">{labels.pipeline.pendingJobs}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-cyan-400">{queue.totalRunning}</div>
                <div className="text-[9px] text-slate-500">{labels.pipeline.runningJobs}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-green-400">{queue.totalDone24h}</div>
                <div className="text-[9px] text-slate-500">{labels.pipeline.done24h}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-red-400">{queue.totalFailed24h}</div>
                <div className="text-[9px] text-slate-500">{labels.pipeline.failed24h}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Production Limits ── */}
      <Card className="bg-slate-800/40 border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Hash className="w-4 h-4 text-amber-400" />
            {labels.pipeline.productionLimits}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">{labels.pipeline.dailyLimit}</label>
              <input
                type="number"
                value={limits.maxPublishedPerDay}
                onChange={e => setLimits({ ...limits, maxPublishedPerDay: parseInt(e.target.value) || 200 })}
                className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">{labels.pipeline.hourlyLimit}</label>
              <input
                type="number"
                value={limits.maxPublishedPerHour}
                onChange={e => setLimits({ ...limits, maxPublishedPerHour: parseInt(e.target.value) || 20 })}
                className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={saveLimits}
            disabled={limitsSaving}
            className="mt-3 h-7 text-xs bg-cyan-600 hover:bg-cyan-700"
          >
            {limitsSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
            {labels.pipeline.save}
          </Button>
        </CardContent>
      </Card>

      {/* ── Consecutive Errors Warning ── */}
      {pipeline && pipeline.consecutiveErrors > 0 && (
        <Card className="bg-red-950/30 border-red-900/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-300">
                {pipeline.consecutiveErrors} {labels.pipeline.consecutiveErrors}
              </span>
            </div>
            {pipeline.lastProcessError && (
              <p className="text-[10px] text-red-400/70 mt-1 font-mono">{pipeline.lastProcessError.slice(0, 200)}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GENERATE SECTION — Content Generation & Analysis for all tabs
// ═══════════════════════════════════════════════════════════════
function GenerateSection({
  locale, contentType, generating, setGenerating, genResults, setGenResults,
  startPipeline, startingPipeline, labels,
}: {
  locale: string; contentType: ContentType;
  generating: string | null;
  setGenerating: (g: string | null) => void;
  genResults: Record<string, any>;
  setGenResults: (r: Record<string, any>) => void;
  startPipeline: () => void;
  startingPipeline: boolean;
  labels: LanguageDashboardLabels;
}) {
  const g = labels.generate;

  // ── Report Generation Form State ──
  const [reportType, setReportType] = useState<string>('daily');
  const [assetClass, setAssetClass] = useState<string | undefined>(undefined);
  const [customPrompt, setCustomPrompt] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [forceGenerate, setForceGenerate] = useState(false);
  const [publishAfter, setPublishAfter] = useState(true);

  // ── Strategic Report State ──
  const [strategicTopic, setStrategicTopic] = useState('');
  const [strategicRegion, setStrategicRegion] = useState('');
  const [strategicSectors, setStrategicSectors] = useState<string[]>([]);

  // ── Infographic State ──
  const [infoSourceType, setInfoSourceType] = useState<string>('news');
  const [infoSourceId, setInfoSourceId] = useState('');

  // ── Video State ──
  const [videoSourceType, setVideoSourceType] = useState<string>('economic_report');
  const [videoSourceId, setVideoSourceId] = useState('');
  const [videoSymbol, setVideoSymbol] = useState('');
  const [videoAssetName, setVideoAssetName] = useState('');
  const [videoStyle, setVideoStyle] = useState<string>('pulse');
  const [videoReports, setVideoReports] = useState<any[]>([]);
  const [videoReportsLoading, setVideoReportsLoading] = useState(false);

  // ── Fetch published reports for video generation ──
  const fetchVideoReports = useCallback(async () => {
    setVideoReportsLoading(true);
    try {
      const res = await fetch(`/api/reports/manage?limit=30&isPublished=true&locale=${locale}`);
      const data = await res.json();
      if (data.reports) setVideoReports(data.reports);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setVideoReportsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (contentType === 'video') fetchVideoReports();
  }, [contentType, fetchVideoReports]);

  // ── News Analysis State ──
  const [newsAnalysisSourceId, setNewsAnalysisSourceId] = useState('');

  // ── Report types ──
  const reportTypes = [
    { value: 'daily', label: g.daily },
    { value: 'weekly', label: g.weekly },
    { value: 'monthly', label: g.monthly },
    { value: 'quarterly', label: g.quarterly },
    { value: 'special', label: g.special },
  ];

  // ── Asset classes ──
  const assetClasses = [
    { value: 'stocks', label: g.stocks },
    { value: 'commodities', label: g.commodities },
    { value: 'forex', label: g.forex },
    { value: 'crypto', label: g.crypto },
    { value: 'bonds', label: g.bonds },
    { value: 'energy', label: g.energy },
    { value: 'economy', label: g.economy },
    { value: 'banking', label: g.banking },
    { value: 'technicalAnalysis', label: g.technicalAnalysis },
    { value: 'arabMarkets', label: g.arabMarkets },
    { value: 'earnings', label: g.earnings },
  ];

  // ── Strategic sectors ──
  const strategicSectorOptions = [
    { value: 'energy', label: g.energy },
    { value: 'economy', label: g.economy },
    { value: 'banking', label: g.banking },
    { value: 'stocks', label: g.stocks },
    { value: 'forex', label: g.forex },
    { value: 'commodities', label: g.commodities },
    { value: 'crypto', label: g.crypto },
    { value: 'realEstate', label: g.realEstate },
  ];

  // ── Info source types ──
  const infoSourceTypes = [
    { value: 'news', label: g.sourceNews },
    { value: 'economic_report', label: g.sourceEconomicReport },
    { value: 'market_analysis', label: g.sourceMarketAnalysis },
  ];

  // ── Generate Report (Reports + Strategic) ──
  const handleGenerateReport = async () => {
    const genId = `report-${Date.now()}`;
    setGenerating(genId);
    try {
      const isStrategic = contentType === 'strategic';
      const body: any = {
        type: isStrategic ? 'strategic' : reportType,
        force: forceGenerate,
        publish: publishAfter,
        locale,
        prompt: customPrompt || undefined,
        title: isStrategic ? strategicTopic : reportTitle || undefined,
      };

      if (isStrategic) {
        body.region = strategicRegion || undefined;
        body.sectors = strategicSectors.length > 0 ? strategicSectors : undefined;
      }

      if (!isStrategic && assetClass) {
        body.assetClass = assetClass;
      }

      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      setGenResults(prev => ({ ...prev, [genId]: { ...data, timestamp: Date.now() } }));

      if (data.success) {
        toast.success(labels.toast.generateSuccess);
      } else {
        toast.error(data.error || labels.toast.generateFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setGenerating(null);
    }
  };

  // ── Generate Market Analysis ──
  const handleGenerateAnalysis = async () => {
    if (!assetClass) {
      toast.error(g.selectAssetClass);
      return;
    }
    const genId = `analysis-${Date.now()}`;
    setGenerating(genId);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'daily',
          assetClass,
          force: forceGenerate,
          publish: publishAfter,
          locale,
          prompt: customPrompt || undefined,
        }),
      });
      const data = await res.json();

      setGenResults(prev => ({ ...prev, [genId]: { ...data, timestamp: Date.now() } }));

      if (data.success) {
        toast.success(labels.toast.generateSuccess);
      } else {
        toast.error(data.error || labels.toast.generateFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setGenerating(null);
    }
  };

  // ── Generate Infographic ──
  const handleGenerateInfographic = async () => {
    if (!infoSourceId || !infoSourceType) {
      toast.error(g.sourceIdPlaceholder);
      return;
    }
    const genId = `infographic-${Date.now()}`;
    setGenerating(genId);
    try {
      // V1219k: Route to locale-specific generate endpoint
      // Prevents Spanish/French/English content being saved with locale='ar'
      const generateUrl = locale === 'ar'
        ? '/api/infographics/generate'
        : `/api/infographics/generate-${locale}`;
      const res = await fetch(generateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType: infoSourceType, sourceId: infoSourceId }),
      });
      const data = await res.json();

      setGenResults(prev => ({ ...prev, [genId]: { ...data, timestamp: Date.now() } }));

      if (data.success) {
        toast.success(labels.toast.generateSuccess);
      } else {
        toast.error(data.error || labels.toast.generateFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setGenerating(null);
    }
  };

  // ── Generate Video ──
  const handleGenerateVideo = async () => {
    const hasReport = videoSourceId && videoSourceType;
    const hasSymbol = videoSymbol.trim().length > 0;
    if (!hasReport && !hasSymbol) {
      toast.error(g.sourceIdPlaceholder);
      return;
    }
    const genId = `video-${Date.now()}`;
    setGenerating(genId);
    try {
      const body: any = { locale, marketImpact: 'neutral', style: videoStyle || 'pulse' };

      if (hasReport) {
        body.sourceReportId = videoSourceId;
        body.sourceType = videoSourceType;
      } else {
        body.symbol = videoSymbol;
        body.assetName = videoAssetName || videoSymbol;
      }

      // AI style uses a dedicated endpoint (LLM Engine + gold-engine renderer)
      const endpoint = videoStyle === 'ai' ? '/api/video/generate-ai' : '/api/video/generate';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      setGenResults(prev => ({ ...prev, [genId]: { ...data, timestamp: Date.now() } }));

      if (data.success) {
        toast.success(labels.toast.generateStarted);
      } else {
        toast.error(data.error || labels.toast.generateFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setGenerating(null);
    }
  };

  // ── Trigger News Pipeline ──
  const handleFetchNews = async () => {
    const genId = `fetch-news-${Date.now()}`;
    setGenerating(genId);
    try {
      const res = await fetch('/api/admin/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: `start-${locale}` }),
      });
      const data = await res.json();
      setGenResults(prev => ({ ...prev, [genId]: { ...data, timestamp: Date.now() } }));

      if (data.success) {
        toast.success(labels.toast.generateStarted);
      } else {
        toast.error(data.error || labels.toast.generateFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setGenerating(null);
    }
  };

  const toggleStrategicSector = (sector: string) => {
    setStrategicSectors(prev =>
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  };

  const recentResults = Object.entries(genResults)
    .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 5);

  const isGenerating = generating !== null;

  return (
    <div className="space-y-4">

      {/* ══════════ NEWS TAB ══════════ */}
      {contentType === 'news' && (
        <>
          <Card className="bg-slate-800/40 border-cyan-500/20 border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-300 flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                {g.triggerNewsPipeline}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400 mb-3">{g.triggerNewsDesc}</p>
              <Button onClick={handleFetchNews} disabled={isGenerating} className="h-8 text-xs bg-cyan-600 hover:bg-cyan-700">
                {generating?.startsWith('fetch-news') ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                {g.fetchNews}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-amber-500/20 border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-300 flex items-center gap-2">
                <FileSearch className="w-4 h-4" />
                {g.generateAnalysis}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">{g.sourceType}</label>
                  <Select value={infoSourceType} onValueChange={setInfoSourceType}>
                    <SelectTrigger className="w-full h-8 text-xs bg-slate-900/80 border-slate-600"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {infoSourceTypes.map(t => (<SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">{g.sourceId}</label>
                  <input type="text" value={newsAnalysisSourceId} onChange={e => setNewsAnalysisSourceId(e.target.value)} placeholder={g.sourceIdPlaceholder} className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none" />
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-1.5"><Switch checked={forceGenerate} onCheckedChange={setForceGenerate} className="scale-75" /><span className="text-[10px] text-slate-400">{g.forceGenerate}</span></div>
                  <div className="flex items-center gap-1.5"><Switch checked={publishAfter} onCheckedChange={setPublishAfter} className="scale-75" /><span className="text-[10px] text-slate-400">{g.publishAfterGenerate}</span></div>
                </div>
                <Button onClick={() => { setInfoSourceId(newsAnalysisSourceId); handleGenerateInfographic(); }} disabled={isGenerating || !newsAnalysisSourceId} className="h-7 text-xs bg-amber-600 hover:bg-amber-700">
                  {generating?.startsWith('infographic') ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                  {g.generateBtn}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-violet-500/20 border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-violet-300 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {g.generateReport}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {/* Quick generate buttons for each asset class */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-slate-400">{g.quickGenerate}</span>
                  <Button
                    onClick={async () => {
                      const genId = `all-news-rpt-${Date.now()}`;
                      setGenerating(genId);
                      let ok = 0; let fail = 0;
                      for (const ac of assetClasses) {
                        try {
                          const res = await fetch('/api/reports/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: reportType, assetClass: ac.value, force: forceGenerate, publish: publishAfter, locale }),
                          });
                          const data = await res.json();
                          if (data.success) ok++; else fail++;
                        } catch { fail++; }
                      }
                      setGenerating(null);
                      if (ok > 0) toast.success(`${ok} ${labels.toast.generateSuccess}`);
                      if (fail > 0) toast.error(`${fail} ${labels.toast.generateFailed}`);
                    }}
                    disabled={isGenerating}
                    className="h-6 text-[10px] bg-emerald-600/60 hover:bg-emerald-600 px-2 ml-auto"
                  >
                    {generating?.startsWith('all-news-rpt-') ? <Loader2 className="w-2.5 h-2.5 animate-spin mr-1" /> : <Sparkles className="w-2.5 h-2.5 mr-1" />}
                    {generating?.startsWith('all-news-rpt-') ? g.generatingAll : g.generateAll}
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5">
                  {assetClasses.map(ac => (
                    <Button
                      key={ac.value}
                      onClick={async () => {
                        const catGenId = `cat-news-${ac.value}`;
                        setGenerating(catGenId);
                        try {
                          const res = await fetch('/api/reports/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: reportType, assetClass: ac.value, force: forceGenerate, publish: publishAfter, locale }),
                          });
                          const data = await res.json();
                          setGenResults(prev => ({ ...prev, [catGenId]: { ...data, timestamp: Date.now() } }));
                          if (data.success) toast.success(`${ac.label}: ${labels.toast.generateSuccess}`);
                          else toast.error(data.error || `${ac.label}: ${labels.toast.generateFailed}`);
                        } catch {
                          toast.error(labels.toast.connectionFailed);
                        } finally {
                          setGenerating(null);
                        }
                      }}
                      disabled={isGenerating}
                      className="h-7 text-[10px] bg-slate-700/80 hover:bg-violet-600/40 border border-slate-600/50 hover:border-violet-500/40 text-slate-300 hover:text-violet-300 justify-start"
                    >
                      {generating === `cat-news-${ac.value}` ? <Loader2 className="w-2.5 h-2.5 animate-spin mr-1" /> : <Zap className="w-2.5 h-2.5 mr-1 text-violet-400" />}
                      {ac.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">{g.reportType}</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-full h-8 text-xs bg-slate-900/80 border-slate-600"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {reportTypes.map(t => (<SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">{g.assetClass}</label>
                  <Select value={assetClass} onValueChange={setAssetClass}>
                    <SelectTrigger className="w-full h-8 text-xs bg-slate-900/80 border-slate-600"><SelectValue placeholder={g.selectAssetClass} /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {assetClasses.map(a => (<SelectItem key={a.value} value={a.value} className="text-xs">{a.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">{g.customPrompt}</label>
                  <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder={g.customPromptPlaceholder} className="w-full h-16 bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1 text-xs text-slate-200 resize-y focus:border-cyan-500 focus:outline-none" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5"><Switch checked={forceGenerate} onCheckedChange={setForceGenerate} className="scale-75" /><span className="text-[10px] text-slate-400">{g.forceGenerate}</span></div>
                  <div className="flex items-center gap-1.5"><Switch checked={publishAfter} onCheckedChange={setPublishAfter} className="scale-75" /><span className="text-[10px] text-slate-400">{g.publishAfterGenerate}</span></div>
                </div>
                <Button onClick={assetClass ? handleGenerateAnalysis : handleGenerateReport} disabled={isGenerating} className="h-7 text-xs bg-violet-600 hover:bg-violet-700">
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                  {isGenerating ? g.generating : g.generateBtn}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ══════════ REPORTS TAB ══════════ */}
      {contentType === 'reports' && (
        <>
          {/* ── Quick Generate by Category ── */}
          <Card className="bg-slate-800/40 border-emerald-500/20 border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-emerald-300 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {g.quickGenerate}
                </CardTitle>
                <Button
                  onClick={async () => {
                    const genId = `all-${Date.now()}`;
                    setGenerating(genId);
                    let ok = 0; let fail = 0;
                    for (const ac of assetClasses) {
                      try {
                        const res = await fetch('/api/reports/generate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'daily', assetClass: ac.value, force: forceGenerate, publish: publishAfter, locale }),
                        });
                        const data = await res.json();
                        if (data.success) ok++; else fail++;
                        setGenResults(prev => ({ ...prev, [`${ac.value}-${Date.now()}`]: { ...data, timestamp: Date.now() } }));
                      } catch { fail++; }
                    }
                    setGenerating(null);
                    if (ok > 0) toast.success(`${ok} ${labels.toast.generateSuccess}`);
                    if (fail > 0) toast.error(`${fail} ${labels.toast.generateFailed}`);
                  }}
                  disabled={isGenerating}
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  {generating?.startsWith('all-') ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                  {generating?.startsWith('all-') ? g.generatingAll : g.generateAll}
                </Button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{g.quickGenerateDesc}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5"><Switch checked={forceGenerate} onCheckedChange={setForceGenerate} className="scale-75" /><span className="text-[10px] text-slate-400">{g.forceGenerate}</span></div>
                <div className="flex items-center gap-1.5"><Switch checked={publishAfter} onCheckedChange={setPublishAfter} className="scale-75" /><span className="text-[10px] text-slate-400">{g.publishAfterGenerate}</span></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {assetClasses.map(ac => {
                  const isBusy = generating === `cat-${ac.value}`;
                  return (
                    <Button
                      key={ac.value}
                      onClick={async () => {
                        const catGenId = `cat-${ac.value}`;
                        setGenerating(catGenId);
                        try {
                          const res = await fetch('/api/reports/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'daily', assetClass: ac.value, force: forceGenerate, publish: publishAfter, locale }),
                          });
                          const data = await res.json();
                          setGenResults(prev => ({ ...prev, [catGenId]: { ...data, timestamp: Date.now() } }));
                          if (data.success) toast.success(`${ac.label}: ${labels.toast.generateSuccess}`);
                          else toast.error(data.error || `${ac.label}: ${labels.toast.generateFailed}`);
                        } catch {
                          toast.error(labels.toast.connectionFailed);
                        } finally {
                          setGenerating(null);
                        }
                      }}
                      disabled={isGenerating}
                      className="h-8 text-xs bg-slate-700/80 hover:bg-emerald-600/40 border border-slate-600/50 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300 justify-start"
                    >
                      {isBusy ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Zap className="w-3 h-3 mr-1.5 text-emerald-400" />}
                      {ac.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── Custom Report Generation ── */}
          <Card className="bg-slate-800/40 border-cyan-500/20 border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-300 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {g.generateReport}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">{g.reportType}</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-full h-8 text-xs bg-slate-900/80 border-slate-600"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {reportTypes.map(t => (<SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">{g.assetClass}</label>
                  <Select value={assetClass} onValueChange={setAssetClass}>
                    <SelectTrigger className="w-full h-8 text-xs bg-slate-900/80 border-slate-600"><SelectValue placeholder={g.selectAssetClass} /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {assetClasses.map(a => (<SelectItem key={a.value} value={a.value} className="text-xs">{a.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">{g.customPrompt}</label>
                  <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder={g.customPromptPlaceholder} className="w-full h-16 bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1 text-xs text-slate-200 resize-y focus:border-cyan-500 focus:outline-none" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5"><Switch checked={forceGenerate} onCheckedChange={setForceGenerate} className="scale-75" /><span className="text-[10px] text-slate-400">{g.forceGenerate}</span></div>
                  <div className="flex items-center gap-1.5"><Switch checked={publishAfter} onCheckedChange={setPublishAfter} className="scale-75" /><span className="text-[10px] text-slate-400">{g.publishAfterGenerate}</span></div>
                </div>
                <Button onClick={assetClass ? handleGenerateAnalysis : handleGenerateReport} disabled={isGenerating} className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700">
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                  {isGenerating ? g.generating : g.generateBtn}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ══════════ STRATEGIC TAB ══════════ */}
      {contentType === 'strategic' && (
        <>
          {/* ── Quick Generate by Category for Strategic ── */}
          <Card className="bg-slate-800/40 border-emerald-500/20 border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-emerald-300 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {g.quickGenerate}
                </CardTitle>
                <Button
                  onClick={async () => {
                    const genId = `all-strat-${Date.now()}`;
                    setGenerating(genId);
                    let ok = 0; let fail = 0;
                    for (const ac of assetClasses) {
                      try {
                        const res = await fetch('/api/reports/generate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'strategic', assetClass: ac.value, force: forceGenerate, publish: publishAfter, locale, title: `${g.strategicType} - ${ac.label}` }),
                        });
                        const data = await res.json();
                        if (data.success) ok++; else fail++;
                        setGenResults(prev => ({ ...prev, [`strat-${ac.value}-${Date.now()}`]: { ...data, timestamp: Date.now() } }));
                      } catch { fail++; }
                    }
                    setGenerating(null);
                    if (ok > 0) toast.success(`${ok} ${labels.toast.generateSuccess}`);
                    if (fail > 0) toast.error(`${fail} ${labels.toast.generateFailed}`);
                  }}
                  disabled={isGenerating}
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  {generating?.startsWith('all-strat-') ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                  {generating?.startsWith('all-strat-') ? g.generatingAll : g.generateAll}
                </Button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{g.quickGenerateDesc}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5"><Switch checked={forceGenerate} onCheckedChange={setForceGenerate} className="scale-75" /><span className="text-[10px] text-slate-400">{g.forceGenerate}</span></div>
                <div className="flex items-center gap-1.5"><Switch checked={publishAfter} onCheckedChange={setPublishAfter} className="scale-75" /><span className="text-[10px] text-slate-400">{g.publishAfterGenerate}</span></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {assetClasses.map(ac => (
                  <Button
                    key={ac.value}
                    onClick={async () => {
                      const catGenId = `cat-strat-${ac.value}`;
                      setGenerating(catGenId);
                      try {
                        const res = await fetch('/api/reports/generate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'strategic', assetClass: ac.value, force: forceGenerate, publish: publishAfter, locale, title: `${g.strategicType} - ${ac.label}` }),
                        });
                        const data = await res.json();
                        setGenResults(prev => ({ ...prev, [catGenId]: { ...data, timestamp: Date.now() } }));
                        if (data.success) toast.success(`${ac.label}: ${labels.toast.generateSuccess}`);
                        else toast.error(data.error || `${ac.label}: ${labels.toast.generateFailed}`);
                      } catch {
                        toast.error(labels.toast.connectionFailed);
                      } finally {
                        setGenerating(null);
                      }
                    }}
                    disabled={isGenerating}
                    className="h-8 text-xs bg-slate-700/80 hover:bg-emerald-600/40 border border-slate-600/50 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300 justify-start"
                  >
                    {generating === `cat-strat-${ac.value}` ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Zap className="w-3 h-3 mr-1.5 text-emerald-400" />}
                    {ac.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-violet-500/20 border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-violet-300 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {g.strategicType}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">{g.topic}</label>
                <input type="text" value={strategicTopic} onChange={e => setStrategicTopic(e.target.value)} placeholder={g.topicPlaceholder} className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">{g.region}</label>
                <input type="text" value={strategicRegion} onChange={e => setStrategicRegion(e.target.value)} placeholder={g.regionPlaceholder} className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">{g.sectors}</label>
                <div className="flex flex-wrap gap-1.5">
                  {strategicSectorOptions.map(s => {
                    const isSelected = strategicSectors.includes(s.value);
                    return (
                      <button key={s.value} onClick={() => toggleStrategicSector(s.value)} className={`px-2 py-1 rounded text-[10px] transition-all ${isSelected ? 'bg-violet-500/30 text-violet-300 border border-violet-500/40' : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'}`}>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">{g.customPrompt}</label>
                <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder={g.customPromptPlaceholder} className="w-full h-20 bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1 text-xs text-slate-200 resize-y focus:border-cyan-500 focus:outline-none" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5"><Switch checked={forceGenerate} onCheckedChange={setForceGenerate} className="scale-75" /><span className="text-[10px] text-slate-400">{g.forceGenerate}</span></div>
                <div className="flex items-center gap-1.5"><Switch checked={publishAfter} onCheckedChange={setPublishAfter} className="scale-75" /><span className="text-[10px] text-slate-400">{g.publishAfterGenerate}</span></div>
              </div>
              <Button onClick={handleGenerateReport} disabled={isGenerating || (!strategicTopic && !customPrompt)} className="h-7 text-xs bg-violet-600 hover:bg-violet-700">
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                {isGenerating ? g.generating : g.generateBtn}
              </Button>
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* ══════════ INFOGRAPHIC TAB ══════════ */}
      {contentType === 'infographic' && (
        <Card className="bg-slate-800/40 border-cyan-500/20 border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-cyan-300 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              {g.generateBtn} — Infographic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">{g.sourceType}</label>
                <Select value={infoSourceType} onValueChange={setInfoSourceType}>
                  <SelectTrigger className="w-full h-8 text-xs bg-slate-900/80 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {infoSourceTypes.map(t => (<SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">{g.sourceId}</label>
                <input type="text" value={infoSourceId} onChange={e => setInfoSourceId(e.target.value)} placeholder={g.sourceIdPlaceholder} className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none" />
              </div>
              <div className="bg-slate-900/40 rounded p-2 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {locale === 'ar' ? 'سيتم توليد إنفوغرافيك من المحتوى المصدر. يتضمن: 6 شرائح احترافية، صور مولّدة بالذكاء الاصطناعي، ورسوم بيانية تفاعلية.' : 'An infographic will be generated from the source content with 6 professional slides, AI images, and interactive charts.'}
                </p>
              </div>
              <Button onClick={handleGenerateInfographic} disabled={isGenerating || !infoSourceId} className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700">
                {generating?.startsWith('infographic') ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                {generating?.startsWith('infographic') ? g.generating : g.generateBtn}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════ VIDEO TAB ══════════ */}
      {contentType === 'video' && (
        <>
          {/* Report-based video generation with report list */}
          <Card className="bg-slate-800/40 border-cyan-500/20 border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-300 flex items-center gap-2">
                <Film className="w-4 h-4" />
                {locale === 'ar' ? 'توليد فيديو من تقرير' : locale === 'fr' ? 'Générer vidéo depuis rapport' : 'Generate Video from Report'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Video style selector */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">{locale === 'ar' ? 'نمط الفيديو' : locale === 'fr' ? 'Style vidéo' : 'Video Style'}</label>
                  <Select value={videoStyle} onValueChange={setVideoStyle}>
                    <SelectTrigger className="w-full h-8 text-xs bg-slate-900/80 border-slate-600"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="pulse" className="text-xs">{locale === 'ar' ? '🔵 بلومبيرغ (Pulse)' : '🔵 Bloomberg (Pulse)'}</SelectItem>
                      <SelectItem value="dataviz" className="text-xs">{locale === 'ar' ? '🟢 الجزيرة (DataViz)' : '🟢 Al Jazeera (DataViz)'}</SelectItem>
                      <SelectItem value="ai" className="text-xs">{locale === 'ar' ? '🤖 ذكاء اصطناعي (AI)' : '🤖 AI Engine'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reports list */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400">{locale === 'ar' ? 'التقارير المنشورة' : 'Published Reports'}</label>
                    <button onClick={fetchVideoReports} className="text-[9px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                      <RefreshCw size={9} className={videoReportsLoading ? 'animate-spin' : ''} />
                      {locale === 'ar' ? 'تحديث' : 'Refresh'}
                    </button>
                  </div>

                  {videoReportsLoading && videoReports.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                      {locale === 'ar' ? 'جارٍ تحميل التقارير...' : 'Loading reports...'}
                    </div>
                  ) : videoReports.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-xs">
                      {locale === 'ar' ? 'لا توجد تقارير منشورة' : 'No published reports'}
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
                      {videoReports.slice(0, 20).map((report: any) => (
                        <div key={report.id} className="flex items-center gap-2 p-2 rounded-md bg-slate-900/60 border border-slate-700/50 hover:border-cyan-500/30 transition-all">
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-slate-200 truncate">{report.title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">{report.reportType || 'daily'}</span>
                              {report.marketImpact && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                  report.marketImpact === 'bullish' ? 'text-green-400 bg-green-500/10' :
                                  report.marketImpact === 'bearish' ? 'text-red-400 bg-red-500/10' :
                                  'text-amber-400 bg-amber-500/10'
                                }`}>{report.marketImpact}</span>
                              )}
                              <span className="text-[9px] text-slate-500">{report.confidenceScore ? `${report.confidenceScore}%` : ''}</span>
                            </div>
                          </div>
                          <Button
                            onClick={async () => {
                              const genId = `video-${Date.now()}`;
                              setGenerating(genId);
                              try {
                                const body: any = {
                                  locale,
                                  marketImpact: 'neutral',
                                  style: videoStyle || 'pulse',
                                  sourceReportId: report.id,
                                  sourceType: 'economic_report',
                                  title: report.title,
                                };
                                const res = await fetch('/api/video/generate', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(body),
                                });
                                const data = await res.json();
                                setGenResults(prev => ({ ...prev, [genId]: { ...data, timestamp: Date.now() } }));
                                if (data.success) {
                                  toast.success(locale === 'ar' ? 'بدأ توليد الفيديو' : 'Video generation started');
                                } else {
                                  toast.error(data.error || (locale === 'ar' ? 'فشل توليد الفيديو' : 'Video generation failed'));
                                }
                              } catch {
                                toast.error(locale === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
                              } finally {
                                setGenerating(null);
                              }
                            }}
                            disabled={isGenerating}
                            className="h-6 text-[10px] px-2 bg-cyan-600 hover:bg-cyan-700 shrink-0"
                          >
                            {generating?.startsWith('video') ? <Loader2 className="w-2.5 h-2.5 animate-spin mr-0.5" /> : <Film className="w-2.5 h-2.5 mr-0.5" />}
                            {locale === 'ar' ? 'توليد' : 'Generate'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Manual ID entry (collapsed by default) */}
                <details className="group">
                  <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-300 flex items-center gap-1">
                    <ChevronDown size={10} className="transition-transform group-open:rotate-180" />
                    {locale === 'ar' ? 'إدخال معرف يدوياً' : 'Enter ID manually'}
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">{g.sourceType}</label>
                      <Select value={videoSourceType} onValueChange={setVideoSourceType}>
                        <SelectTrigger className="w-full h-8 text-xs bg-slate-900/80 border-slate-600"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="economic_report" className="text-xs">{g.sourceEconomicReport}</SelectItem>
                          <SelectItem value="market_analysis" className="text-xs">{g.sourceMarketAnalysis}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">{g.reportId}</label>
                      <input type="text" value={videoSourceId} onChange={e => setVideoSourceId(e.target.value)} placeholder={g.reportIdPlaceholder} className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none" />
                    </div>
                    <Button onClick={handleGenerateVideo} disabled={isGenerating || !videoSourceId} className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700">
                      {generating?.startsWith('video') ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Film className="w-3 h-3 mr-1" />}
                      {generating?.startsWith('video') ? g.generating : g.generateBtn}
                    </Button>
                  </div>
                </details>
              </div>
            </CardContent>
          </Card>

          {/* Symbol-based video generation */}
          <Card className="bg-slate-800/40 border-amber-500/20 border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-300 flex items-center gap-2">
                <Film className="w-4 h-4" />
                {locale === 'ar' ? 'توليد فيديو من رمز' : locale === 'fr' ? 'Générer vidéo depuis symbole' : 'Generate Video from Symbol'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">{g.symbol}</label>
                    <input type="text" value={videoSymbol} onChange={e => setVideoSymbol(e.target.value)} placeholder={g.symbolPlaceholder} className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">{locale === 'ar' ? 'اسم الأصل' : 'Asset Name'}</label>
                    <input type="text" value={videoAssetName} onChange={e => setVideoAssetName(e.target.value)} placeholder={locale === 'ar' ? 'مثال: Apple Inc.' : 'e.g. Apple Inc.'} className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none" />
                  </div>
                </div>
                <Button onClick={handleGenerateVideo} disabled={isGenerating || !videoSymbol.trim()} className="h-7 text-xs bg-amber-600 hover:bg-amber-700">
                  {generating?.startsWith('video') ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Film className="w-3 h-3 mr-1" />}
                  {generating?.startsWith('video') ? g.generating : g.generateBtn}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ══════════ RECENT GENERATION RESULTS ══════════ */}
      {recentResults.length > 0 && (
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              {locale === 'ar' ? 'نتائج التوليد الأخيرة' : locale === 'fr' ? 'Résultats récents' : 'Recent Generation Results'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentResults.map(([id, result]: [string, any]) => (
                <div key={id} className={`p-2 rounded-lg border text-xs ${result.success ? 'bg-green-950/20 border-green-500/20' : 'bg-red-950/20 border-red-500/20'}`}>
                  <div className="flex items-center gap-2">
                    {result.success ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                    <span className="text-slate-300">{result.report?.title || result.infographic?.title || result.videoId || id.slice(0, 20)}</span>
                  </div>
                  {result.message && <p className="text-[10px] text-slate-400 mt-0.5">{result.message}</p>}
                  {result.error && <p className="text-[10px] text-red-400 mt-0.5">{result.error}</p>}
                  {result.jobId && <p className="text-[10px] text-slate-500 mt-0.5">Job: {result.jobId}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
