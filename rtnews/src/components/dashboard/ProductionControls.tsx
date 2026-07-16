// ─── Shared Production Controls ──────────────────────────
// Combines report-controls, pipeline, stats, prompts, and model management
// 6 tabs: Stats, Pipeline, Reports, News Prompts, Report Prompts, Models
// Accepts locale and labels props for i18n support

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  FileText, Calendar, BarChart3, TrendingUp, Zap, Save, Loader2,
  Play, Clock, Hash, Settings2, CheckCircle2,
  RefreshCw, Activity, XCircle, CircleDashed,
  Search, Languages, Brain, Image, Upload,
  AlertTriangle, Database, Bot, Sparkles, X, Wand2, PenLine,
  Newspaper, Video, Cpu, Server, ArrowRight, Shield,
} from 'lucide-react';
import {
  ProductionControlsLabels,
  arLabels,
  enLabels,
  frLabels,
  trLabels,
} from './production-controls-labels';

// Re-export labels for convenience
export { arLabels, enLabels, frLabels, trLabels };

// ─── Pipeline Types ──────────────────────────────────────
interface PipelineOverview {
  pipeline: {
    version: string;
    isRunning: boolean;
    cycleCount: number;
    totalPublished: number;
    totalFailed: number;
    lastProcessError: string;
    consecutiveErrors: number;
  };
  articles: {
    total: number;
    ready: number;
    pending: number;
    fetched: number;
    translated: number;
    analyzed: number;
    imaged: number;
    rejected: number;
  };
  queue: {
    totalPending: number;
    totalRunning: number;
    totalDone24h: number;
    totalFailed24h: number;
  };
}

// ─── Report Schedule Config ──────────────────────────────
interface ReportScheduleConfig {
  dailyEnabled: boolean;
  dailyTimesPerDay: number;
  dailyHour: number;
  dailyWordCount: number;
  weeklyEnabled: boolean;
  weeklyDay: number;
  weeklyHour: number;
  weeklyWordCount: number;
  monthlyEnabled: boolean;
  monthlyDay: number;
  monthlyHour: number;
  monthlyWordCount: number;
}

const DEFAULT_CONFIG: ReportScheduleConfig = {
  dailyEnabled: true,
  dailyTimesPerDay: 1,
  dailyHour: 6,
  dailyWordCount: 500,
  weeklyEnabled: true,
  weeklyDay: 1,
  weeklyHour: 6,
  weeklyWordCount: 500,
  monthlyEnabled: true,
  monthlyDay: 1,
  monthlyHour: 6,
  monthlyWordCount: 500,
};

// ─── Provider Constants ──────────────────────────────
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

// ─── Component Props ──────────────────────────────────────
interface ProductionControlsProps {
  locale: 'ar' | 'en' | 'fr' | 'tr' | 'es';
  labels: ProductionControlsLabels;
}

// ─── Main Component ──────────────────────────────────────
export default function ProductionControls({ locale, labels }: ProductionControlsProps) {
  const { dir, daysOfWeek, assetClasses, specialEvents } = labels;

  const [config, setConfig] = useState<ReportScheduleConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [pipelineData, setPipelineData] = useState<PipelineOverview | null>(null);
  const [activeSection, setActiveSection] = useState<'stats' | 'pipeline' | 'reports' | 'news-prompts' | 'report-prompts' | 'models'>('stats');
  const [limits, setLimits] = useState({ maxPublishedPerDay: 200, maxPublishedPerHour: 20 });
  const [limitsSaving, setLimitsSaving] = useState(false);

  // ── Manual Report Generation Modal State ──
  const [showGenModal, setShowGenModal] = useState(false);
  const [genForm, setGenForm] = useState({
    title: '',
    type: 'daily' as string,
    assetClass: '' as string,
    event: '' as string,
    wordCount: 500,
    prompt: '',
    force: true,
    publish: true,
  });
  const [genSubmitting, setGenSubmitting] = useState(false);

  // ── Generation Job Status Tracker State ──
  const [genJobId, setGenJobId] = useState<string | null>(null);
  const [genJobStatus, setGenJobStatus] = useState<{ 'status': string; 'result'?: { 'id': string; 'title': string; 'slug': string }; 'error'?: string; 'duration'?: number } | null>(null);

  // ── Manual Categories Generation State ──
  const [manualCategoryStatus, setManualCategoryStatus] = useState<Record<string, 'idle' | 'generating' | 'completed' | 'failed'>>({});
  const [manualCategoryLastGen, setManualCategoryLastGen] = useState<Record<string, string>>({});

  // ── Prompts Management State ──
  const [promptsData, setPromptsData] = useState<Array<{
    key: string; name: string; description: string; source: string;
    locale: string; category: string; defaultContent: string;
    customContent: string | null; isActive: boolean;
  }>>([]);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [promptsSaving, setPromptsSaving] = useState<string | null>(null);

  // ── Production Stats State ──
  const [statsData, setStatsData] = useState<any>(null);

  // ── Models State ──
  const [modelsData, setModelsData] = useState<any>(null);
  const [localMappings, setLocalMappings] = useState<Record<string, string>>({});
  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>({});
  const [modelsSaving, setModelsSaving] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, pipelineRes] = await Promise.all([
          fetch('/api/admin/settings').catch(() => null),
          fetch('/api/admin/pipeline?section=overview').catch(() => null),
        ]);

        const settingsData = settingsRes ? await settingsRes.json().catch(() => ({ settings: {} })) : { settings: {} };
        const pipelineResult = pipelineRes ? await pipelineRes.json().catch(() => null) : null;

        // Apply persisted report settings
        const s = settingsData.settings?.reports || {};
        if (Object.keys(s).length > 0) {
          setConfig(prev => ({
            ...prev,
            dailyEnabled: s.reports_dailyEnabled !== undefined ? s.reports_dailyEnabled !== 'false' : prev.dailyEnabled,
            dailyTimesPerDay: s.reports_dailyTimesPerDay ? parseInt(s.reports_dailyTimesPerDay, 10) : prev.dailyTimesPerDay,
            dailyHour: s.reports_dailyHour !== undefined ? parseInt(s.reports_dailyHour, 10) : prev.dailyHour,
            dailyWordCount: s.reports_dailyWordCount ? parseInt(s.reports_dailyWordCount, 10) : prev.dailyWordCount,
            weeklyEnabled: s.reports_weeklyEnabled !== undefined ? s.reports_weeklyEnabled !== 'false' : prev.weeklyEnabled,
            monthlyEnabled: s.reports_monthlyEnabled !== undefined ? s.reports_monthlyEnabled !== 'false' : prev.monthlyEnabled,
          }));
        }

        // Pipeline settings
        const ps = settingsData.settings?.pipeline || {};
        setLimits({
          maxPublishedPerDay: parseInt(ps.pipeline_maxPublishedPerDay) || 200,
          maxPublishedPerHour: parseInt(ps.pipeline_maxPublishedPerHour) || 20,
        });

        if (pipelineResult) setPipelineData(pipelineResult);

        // Fetch prompts data
        fetch('/api/admin/prompts').then(r => r?.json?.()).then((pData: any) => {
          if (pData?.prompts) {
            const localePrompts = pData.prompts.filter((p: any) => p.locale === locale);
            setPromptsData(localePrompts);
          }
        }).catch(err => console.warn(`[${locale} Controls] Prompts fetch failed:`, err));

        // Fetch production stats
        fetch(`/api/admin/production-stats?locale=${locale}`).then(r => r?.json?.()).then(data => {
          if (data) setStatsData(data);
        }).catch(err => console.warn(`[${locale} Controls] Stats fetch failed:`, err));

        // Fetch models data
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
        }).catch(err => console.warn(`[${locale} Controls] Models fetch failed:`, err));
      } catch (err) {
        console.error('Failed to load controls:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [locale]);

  // Auto-refresh stats every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/admin/production-stats?locale=${locale}`).then(r => r?.json?.()).then(data => {
        if (data) setStatsData(data);
      }).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [locale]);

  // Save settings
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const settings: Record<string, string> = {
        dailyEnabled: String(config.dailyEnabled),
        dailyTimesPerDay: String(config.dailyTimesPerDay),
        dailyHour: String(config.dailyHour),
        dailyWordCount: String(config.dailyWordCount),
        weeklyEnabled: String(config.weeklyEnabled),
        weeklyDay: String(config.weeklyDay),
        weeklyHour: String(config.weeklyHour),
        weeklyWordCount: String(config.weeklyWordCount),
        monthlyEnabled: String(config.monthlyEnabled),
        monthlyDay: String(config.monthlyDay),
        monthlyHour: String(config.monthlyHour),
        monthlyWordCount: String(config.monthlyWordCount),
      };
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: 'reports', settings }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(labels.toast.settingsSaved);
      } else {
        toast.error(data.error || labels.toast.settingsSaveFailed);
      }
    } catch {
      toast.error(labels.toast.settingsSaveFailed);
    } finally {
      setSaving(false);
    }
  }, [config, labels]);

  // Manual trigger (cron-based actions)
  const handleTrigger = async (action: string) => {
    setTriggering(action);
    try {
      const res = await fetch(`/api/cron/generate-reports?action=${action}&force=true`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        toast.error(labels.toast.reportGenerateFailed);
        return;
      }
      const data = await res.json();
      if (data.success) {
        toast.success(labels.toast.reportGenerated);
      } else {
        toast.error(data.error || labels.toast.reportGenerateFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setTriggering(null);
    }
  };

  // Custom report generation (POST to /api/reports/generate)
  const handleGenerateReport = async (params: {
    type?: string;
    assetClass?: string;
    event?: string;
    label?: string;
  }) => {
    const key = `custom-${params.type || params.assetClass || params.event || 'unknown'}`;
    setTriggering(key);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: params.type || 'daily',
          assetClass: params.assetClass,
          eventType: params.event,
          force: true,
          async: true,
          publish: true,
        }),
      });
      const data = await res.json();
      if (data.success || data.jobId) {
        toast.success(labels.toast.generationStartedBg);
        if (data.jobId) {
          setGenJobId(data.jobId);
          pollGenJobStatus(data.jobId);
        }
      } else {
        toast.error(data.error || labels.toast.generationFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setTriggering(null);
    }
  };

  // Save pipeline limits
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

  // ── Poll Generation Job Status ──
  const pollGenJobStatus = useCallback((jId: string) => {
    let attempts = 0;
    const maxAttempts = 120;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/reports/generate?jobId=${jId}`);
        const data = await res.json();
        setGenJobStatus(data);

        if (data.status === 'completed') {
          clearInterval(interval);
          toast.success(labels.toast.generationComplete);
          setTimeout(() => { setGenJobId(null); setGenJobStatus(null); }, 30000);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          toast.error(`${labels.toast.generationFailed}: ${data.error || labels.genStatus.generationFailedUnknown}`);
          setTimeout(() => { setGenJobId(null); setGenJobStatus(null); }, 30000);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          toast.error(labels.toast.generationTimeout);
          setTimeout(() => { setGenJobId(null); setGenJobStatus(null); }, 30000);
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setTimeout(() => { setGenJobId(null); setGenJobStatus(null); }, 30000);
        }
      }
    }, 5000);
  }, [labels]);

  // ── Handle manual generation from modal ──
  const handleManualGenerate = async () => {
    setGenSubmitting(true);
    try {
      const payload: Record<string, any> = {
        type: genForm.type || 'daily',
        force: genForm.force,
        async: true,
        publish: genForm.publish,
        wordCount: genForm.wordCount || undefined,
      };
      if (genForm.title?.trim()) payload.title = genForm.title.trim();
      if (genForm.prompt?.trim()) payload.prompt = genForm.prompt.trim();
      if (genForm.assetClass) payload.assetClass = genForm.assetClass;
      if (genForm.type === 'special' && genForm.event) payload.eventType = genForm.event;

      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success || data.jobId) {
        toast.success(labels.toast.generationStartedBg);
        if (data.jobId) {
          setGenJobId(data.jobId);
          pollGenJobStatus(data.jobId);
        }
        setShowGenModal(false);
        setGenForm({ title: '', type: 'daily', assetClass: '', event: '', wordCount: 500, prompt: '', force: true, publish: true });
      } else {
        toast.error(data.error || labels.toast.generationFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setGenSubmitting(false);
    }
  };

  const triggerPipeline = async () => {
    try {
      const res = await fetch('/api/admin/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      if (res.ok) {
        toast.success(labels.toast.pipelineStarted);
      } else {
        toast.error(labels.toast.pipelineStartFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    }
  };

  // ── Model Management Handlers ──
  const handleMappingChange = async (key: string, provider: string) => {
    setLocalMappings(prev => ({ ...prev, [key]: provider }));
    setModelsSaving(key);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'mapping', key, value: provider }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(labels.toast.mappingUpdated);
      } else {
        toast.error(json.error || labels.toast.mappingUpdateFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setModelsSaving(null);
    }
  };

  const handleModelToggle = async (providerName: string, enabled: boolean) => {
    setLocalToggles(prev => ({ ...prev, [providerName]: enabled }));
    setModelsSaving(`toggle_${providerName}`);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'toggle', key: providerName, value: enabled ? 'false' : 'true' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${providerName}: ${enabled ? labels.toast.modelEnabled : labels.toast.modelDisabled}`);
      } else {
        toast.error(json.error || labels.toast.modelToggleFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setModelsSaving(null);
    }
  };

  // ── Prompt Save Handler ──
  const handlePromptSave = async (key: string) => {
    setPromptsSaving(key);
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'prompt', key, value: editContent }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(labels.toast.promptSaved);
        setEditingPrompt(null);
        setPromptsData(prev => prev.map(p =>
          p.key === key ? { ...p, customContent: editContent } : p
        ));
      } else {
        toast.error(data.error || labels.toast.promptSaveFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setPromptsSaving(null);
    }
  };

  const handlePromptToggle = async (key: string, isActive: boolean) => {
    setPromptsSaving(`toggle_${key}`);
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'toggle', key, value: String(!isActive) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isActive ? labels.toast.promptDisabled : labels.toast.promptEnabled);
        setPromptsData(prev => prev.map(p =>
          p.key === key ? { ...p, isActive: !isActive } : p
        ));
      } else {
        toast.error(data.error || labels.toast.promptToggleFailed);
      }
    } catch {
      toast.error(labels.toast.connectionFailed);
    } finally {
      setPromptsSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" dir={dir}>
        {[1, 2, 3].map(i => <div key={i} className="h-52 rounded-xl animate-pulse" style={{ background: 'var(--bg3)' }} />)}
      </div>
    );
  }

  const p = pipelineData?.pipeline;
  const a = pipelineData?.articles;
  const q = pipelineData?.queue;

  // ── Prompt Filters ──
  const newsPrompts = promptsData.filter(p =>
    p.category?.includes('news') || p.key?.includes('news') ||
    p.key?.includes('fetch') || p.key?.includes('analyze') ||
    p.key?.includes('translate') || p.key?.includes('classify') ||
    p.key?.includes('categorize')
  );

  const reportPrompts = promptsData.filter(p =>
    !newsPrompts.some(np => np.key === p.key)
  );

  // ── Prompt Renderer Helper ──
  const renderPromptCard = (prompt: typeof promptsData[0], groupColor: string) => {
    const isExpanded = expandedPrompt === prompt.key;
    const isEditing = editingPrompt === prompt.key;
    const isSaving = promptsSaving === prompt.key || promptsSaving === `toggle_${prompt.key}`;
    const displayContent = prompt.customContent || prompt.defaultContent;

    return (
      <div key={prompt.key} className="rounded-xl overflow-hidden transition-all" style={{
        background: `${groupColor}06`,
        border: `1px solid ${isExpanded ? `${groupColor}30` : `${groupColor}15`}`,
      }}>
        <div className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${groupColor}15` }}>
                <PenLine size={12} style={{ color: groupColor }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold truncate" style={{ color: 'var(--text)' }}>{prompt.name}</span>
                  <Badge className="text-[7px] px-1.5 py-0.5" style={{
                    background: prompt.source === 'code' ? 'rgba(0,229,255,0.1)' : 'rgba(212,175,55,0.1)',
                    color: prompt.source === 'code' ? 'var(--cyan)' : 'var(--gold)',
                    border: `1px solid ${prompt.source === 'code' ? 'rgba(0,229,255,0.2)' : 'rgba(212,175,55,0.2)'}`,
                  }}>
                    {prompt.source === 'code' ? labels.prompts.codeBadge : labels.prompts.settingsBadge}
                  </Badge>
                  <Badge className="text-[7px] px-1.5 py-0.5" style={{
                    background: prompt.isActive ? 'rgba(0,200,150,0.1)' : 'rgba(255,77,106,0.1)',
                    color: prompt.isActive ? 'var(--bull)' : 'var(--bear)',
                    border: `1px solid ${prompt.isActive ? 'rgba(0,200,150,0.2)' : 'rgba(255,77,106,0.2)'}`,
                  }}>
                    {prompt.isActive ? labels.prompts.active : labels.prompts.inactive}
                  </Badge>
                </div>
                <div className="text-[9px] truncate" style={{ color: 'var(--text4)' }}>{prompt.description}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Switch
                checked={prompt.isActive}
                onCheckedChange={() => handlePromptToggle(prompt.key, prompt.isActive)}
                disabled={isSaving}
                className="scale-75"
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-[9px] gap-1 h-7 px-2"
                style={{ color: groupColor }}
                onClick={() => {
                  setExpandedPrompt(isExpanded ? null : prompt.key);
                  if (isEditing) setEditingPrompt(null);
                }}
              >
                {isExpanded ? <X size={10} /> : <Search size={10} />}
                {isExpanded ? labels.prompts.close : labels.prompts.view}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-2">
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 rounded-lg text-[10px] resize-y font-mono leading-relaxed"
                    style={{ background: 'var(--bg4)', color: 'var(--text)', border: '1px solid var(--border)', outline: 'none' }}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="text-[10px] gap-1 h-7"
                      style={{ background: `linear-gradient(135deg, ${groupColor}, var(--cyan))`, color: 'white' }}
                      disabled={promptsSaving === prompt.key}
                      onClick={() => handlePromptSave(prompt.key)}
                    >
                      {promptsSaving === prompt.key ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                      {labels.prompts.save}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] h-7"
                      style={{ color: 'var(--text3)' }}
                      onClick={() => setEditingPrompt(null)}
                    >
                      {labels.prompts.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <pre className="p-3 rounded-lg text-[9px] font-mono leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto" style={{ background: 'var(--bg4)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                    {displayContent}
                  </pre>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[9px] gap-1 h-7"
                      style={{ color: groupColor }}
                      onClick={() => {
                        setEditingPrompt(prompt.key);
                        setEditContent(displayContent || '');
                      }}
                    >
                      <PenLine size={10} /> {labels.prompts.edit}
                    </Button>
                    {prompt.customContent && (
                      <Badge className="text-[7px]" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.2)' }}>
                        {labels.prompts.customBadge}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Grouped Prompts Helper ──
  const groupPrompts = (prompts: typeof promptsData, groups: { key: string; label: string; filter: (p: typeof promptsData[0]) => boolean; color: string }[]) => {
    return groups.map(group => {
      const items = prompts.filter(group.filter);
      if (items.length === 0) return null;
      return (
        <div key={group.key} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full" style={{ background: group.color }} />
            <span className="text-[12px] font-bold" style={{ color: group.color }}>{group.label}</span>
            <Badge className="text-[8px]" style={{ background: `${group.color}10`, color: group.color, border: `1px solid ${group.color}20` }}>
              {items.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {items.map(p => renderPromptCard(p, group.color))}
          </div>
        </div>
      );
    });
  };

  // Arrow direction based on RTL/LTR
  const arrowRotate = dir === 'rtl' ? 'rotate-180' : '';

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-bold font-heading flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--cyan2)' }}>
              <Settings2 size={18} style={{ color: 'var(--cyan)' }} />
            </div>
            {labels.title}
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
              {labels.localeBadge}
            </span>
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>
            {labels.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-[11px] gap-1"
            style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}
            onClick={triggerPipeline}
          >
            <Play size={12} /> {labels.pipeline.startPipeline}
          </Button>
          <Dialog open={showGenModal} onOpenChange={setShowGenModal}>
            <DialogTrigger asChild>
              <Button
                className="text-[12px] gap-1.5 font-bold"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #00E5FF)', color: 'white', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
              >
                <Wand2 size={14} />
                {labels.reports.generateManual}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: '#0A0E27', border: '1px solid rgba(0,229,255,0.15)' }} dir={dir}>
              <DialogHeader>
                <DialogTitle className="text-[16px] font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Sparkles size={18} style={{ color: 'var(--purple)' }} />
                  {labels.genModal.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* ── Title ── */}
                <div>
                  <label className="text-[11px] font-bold mb-1 block" style={{ color: 'var(--text2)' }}>{labels.genModal.titleLabel}</label>
                  <div className="relative">
                    <PenLine size={14} className={`absolute top-1/2 ${dir === 'rtl' ? 'right-3' : 'left-3'} -translate-y-1/2`} style={{ color: 'var(--text4)' }} />
                    <input
                      type="text"
                      value={genForm.title}
                      onChange={e => setGenForm({ ...genForm, title: e.target.value })}
                      className={`w-full ${dir === 'rtl' ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2.5 rounded-lg text-[12px]`}
                      style={{ background: 'var(--bg4)', color: 'var(--text)', border: '1px solid var(--border)', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* ── Report Type ── */}
                <div>
                  <label className="text-[11px] font-bold mb-1.5 block" style={{ color: 'var(--text2)' }}>{labels.genModal.typeLabel}</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'daily', name: labels.reportTypes.daily, color: '#00E5FF', icon: FileText },
                      { id: 'weekly', name: labels.reportTypes.weekly, color: '#D4AF37', icon: Calendar },
                      { id: 'monthly', name: labels.reportTypes.monthly, color: '#8B5CF6', icon: BarChart3 },
                      { id: 'quarterly', name: labels.reportTypes.quarterly, color: '#3BA7F0', icon: TrendingUp },
                      { id: 'special', name: labels.reportTypes.special, color: '#EF5350', icon: Zap },
                    ].map(t => {
                      const TIcon = t.icon;
                      const active = genForm.type === t.id;
                      return (
                        <button key={t.id} onClick={() => setGenForm({ ...genForm, type: t.id })}
                          className="p-2 rounded-xl text-center transition-all"
                          style={{
                            background: active ? `${t.color}15` : 'var(--bg4)',
                            border: `1px solid ${active ? t.color : 'var(--border)'}`,
                            boxShadow: active ? `0 0 12px ${t.color}20` : 'none',
                          }}
                        >
                          <TIcon size={14} style={{ color: active ? t.color : 'var(--text4)' }} className="mx-auto mb-1" />
                          <div className="text-[10px] font-bold" style={{ color: active ? t.color : 'var(--text3)' }}>{t.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Asset Class ── */}
                <div>
                  <label className="text-[11px] font-bold mb-1.5 block" style={{ color: 'var(--text2)' }}>{labels.genModal.assetClassLabel}</label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                    {[{ id: '', name: labels.noneOption, color: 'var(--text4)' },
                      ...assetClasses
                    ].map(ac => {
                      const active = genForm.assetClass === ac.id;
                      return (
                        <button key={ac.id || 'none'} onClick={() => setGenForm({ ...genForm, assetClass: ac.id })}
                          className="p-1.5 rounded-lg text-center transition-all"
                          style={{
                            background: active ? `${ac.color}15` : 'var(--bg4)',
                            border: `1px solid ${active ? ac.color : 'var(--border)'}`,
                          }}
                        >
                          <div className="text-[9px] font-bold" style={{ color: active ? ac.color : 'var(--text4)' }}>{ac.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Special Event (only when "special" type) ── */}
                {genForm.type === 'special' && (
                  <div>
                    <label className="text-[11px] font-bold mb-1.5 block" style={{ color: 'var(--text2)' }}>{labels.genModal.specialEventLabel}</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {specialEvents.map(ev => {
                        const active = genForm.event === ev.id;
                        return (
                          <button key={ev.id} onClick={() => setGenForm({ ...genForm, event: ev.id })}
                            className="p-1.5 rounded-lg text-center transition-all"
                            style={{
                              background: active ? `${ev.color}15` : 'var(--bg4)',
                              border: `1px solid ${active ? ev.color : 'var(--border)'}`,
                            }}
                          >
                            <div className="text-[9px] font-bold" style={{ color: active ? ev.color : 'var(--text4)' }}>{ev.name}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Word Count + Toggles ── */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold mb-1 block" style={{ color: 'var(--text2)' }}>{labels.genModal.wordCount}</label>
                    <input
                      type="number"
                      min={200}
                      max={3000}
                      value={genForm.wordCount}
                      onChange={e => setGenForm({ ...genForm, wordCount: parseInt(e.target.value) || 500 })}
                      className="w-full px-3 py-2 rounded-lg text-[12px] font-mono-price text-center"
                      style={{ background: 'var(--bg4)', color: 'var(--text)', border: '1px solid var(--border)', outline: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                      <Switch checked={genForm.force} onCheckedChange={v => setGenForm({ ...genForm, force: v })} className="scale-75" />
                      <span className="text-[10px]" style={{ color: genForm.force ? 'var(--cyan)' : 'var(--text4)' }}>{labels.genModal.forceGenerate}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                      <Switch checked={genForm.publish} onCheckedChange={v => setGenForm({ ...genForm, publish: v })} className="scale-75" />
                      <span className="text-[10px]" style={{ color: genForm.publish ? 'var(--bull)' : 'var(--text4)' }}>{labels.genModal.autoPublish}</span>
                    </label>
                  </div>
                </div>

                {/* ── Custom Prompt ── */}
                <div>
                  <label className="text-[11px] font-bold mb-1 block" style={{ color: 'var(--text2)' }}>{labels.genModal.customPrompt}</label>
                  <textarea
                    value={genForm.prompt}
                    onChange={e => setGenForm({ ...genForm, prompt: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg text-[11px] resize-none"
                    style={{ background: 'var(--bg4)', color: 'var(--text)', border: '1px solid var(--border)', outline: 'none' }}
                  />
                </div>

                {/* ── Summary ── */}
                <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.04), rgba(139,92,246,0.04))', border: '1px solid rgba(0,229,255,0.1)' }}>
                  <div className="text-[10px] font-bold mb-1.5" style={{ color: 'var(--cyan)' }}>{labels.genModal.summaryTitle}</div>
                  <div className="grid grid-cols-2 gap-1.5 text-[9px]" style={{ color: 'var(--text3)' }}>
                    <div>{labels.genModal.summaryType}: <span style={{ color: 'var(--text)' }}>{labels.reportTypes[genForm.type as keyof typeof labels.reportTypes] || genForm.type}</span></div>
                    <div>{labels.genModal.summaryAsset}: <span style={{ color: 'var(--text)' }}>{genForm.assetClass ? assetClasses.find(a => a.id === genForm.assetClass)?.name || genForm.assetClass : labels.genModal.general}</span></div>
                    <div>{labels.genModal.summaryEvent}: <span style={{ color: 'var(--text)' }}>{genForm.type === 'special' ? (specialEvents.find(e => e.id === genForm.event)?.name || genForm.event || labels.genModal.notSet) : '—'}</span></div>
                    <div>{labels.genModal.summaryWords}: <span style={{ color: 'var(--text)' }}>{genForm.wordCount}</span></div>
                    <div>{labels.genModal.summaryTitle2}: <span style={{ color: 'var(--text)' }}>{genForm.title || labels.genModal.automatic}</span></div>
                    <div>{labels.genModal.summaryPublish}: <span style={{ color: genForm.publish ? 'var(--bull)' : 'var(--text4)' }}>{genForm.publish ? labels.genModal.summaryYes : labels.genModal.summaryNo}</span></div>
                  </div>
                </div>

                {/* ── Generate Button ── */}
                <Button
                  onClick={handleManualGenerate}
                  disabled={genSubmitting}
                  className="w-full text-[13px] font-bold gap-2 h-11"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #00E5FF)', color: 'white', boxShadow: '0 0 25px rgba(139,92,246,0.25)' }}
                >
                  {genSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  {genSubmitting ? labels.genModal.generating : labels.genModal.generateNow}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="text-[12px] gap-1.5"
            style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: 'white' }}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {labels.reports.save}
          </Button>
        </div>
      </div>

      {/* ═══ Generation Status Indicator ═══ */}
      {genJobId && genJobStatus && (
        <Card className="border-0" style={{
          background: genJobStatus.status === 'completed'
            ? 'var(--bull2)' : genJobStatus.status === 'failed'
            ? 'var(--bear2)' : 'rgba(139,92,246,0.04)',
          border: `1px solid ${genJobStatus.status === 'completed'
            ? 'rgba(0,200,150,0.2)' : genJobStatus.status === 'failed'
            ? 'rgba(255,77,106,0.2)' : 'rgba(139,92,246,0.15)'}`,
        }}>
          <CardContent className="p-4 flex items-center gap-3">
            {genJobStatus.status === 'completed' ? (
              <CheckCircle2 size={20} style={{ color: 'var(--bull)' }} />
            ) : genJobStatus.status === 'failed' ? (
              <AlertTriangle size={20} style={{ color: 'var(--bear)' }} />
            ) : (
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--purple)' }} />
            )}
            <div className="flex-1">
              <div className="text-[12px] font-bold" style={{
                color: genJobStatus.status === 'completed' ? 'var(--bull)' : genJobStatus.status === 'failed' ? 'var(--bear)' : 'var(--purple)',
              }}>
                {genJobStatus.status === 'completed' ? labels.genStatus.completed
                  : genJobStatus.status === 'failed' ? labels.genStatus.failed
                  : genJobStatus.status === 'running' ? labels.genStatus.running
                  : labels.genStatus.queued}
              </div>
              {genJobStatus.result && (
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>
                  {genJobStatus.result.title}
                </div>
              )}
              {genJobStatus.error && (
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--bear)' }}>
                  {genJobStatus.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Section Toggle ═══ */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { key: 'stats', label: labels.tabs.stats, icon: BarChart3, color: '#00E5FF' },
          { key: 'pipeline', label: labels.tabs.pipeline, icon: Activity, color: '#00E5FF' },
          { key: 'reports', label: labels.tabs.reports, icon: FileText, color: '#00E5FF' },
          { key: 'news-prompts', label: labels.tabs.newsPrompts, icon: Newspaper, color: '#8B5CF6' },
          { key: 'report-prompts', label: labels.tabs.reportPrompts, icon: PenLine, color: '#D4AF37' },
          { key: 'models', label: labels.tabs.models, icon: Bot, color: '#00C896' },
        ].map(tab => {
          const TabIcon = tab.icon;
          const active = activeSection === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveSection(tab.key as any)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold transition-all"
              style={{
                background: active ? `${tab.color}15` : 'var(--bg3)',
                border: `1px solid ${active ? `${tab.color}25` : 'var(--border)'}`,
                color: active ? tab.color : 'var(--text3)',
              }}
            >
              <TabIcon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB 1: STATISTICS DASHBOARD
          ════════════════════════════════════════════════════════════════ */}
      {activeSection === 'stats' && (
        <div className="space-y-4">
          {/* ── Top Stats Grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Newspaper, label: labels.stats.publishedNews, value: statsData?.news?.totalPublished ?? '—', color: '#00E5FF' },
              { icon: FileText, label: labels.stats.publishedReports, value: statsData?.reports?.totalPublished ?? '—', color: '#D4AF37' },
              { icon: Image, label: labels.stats.infographics, value: statsData?.infographics?.totalPublished ?? '—', color: '#8B5CF6' },
              { icon: Video, label: labels.stats.videos, value: statsData?.videos?.totalPublished ?? '—', color: '#00C896' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i} className="border-0 overflow-hidden relative" style={{
                  background: `linear-gradient(135deg, ${stat.color}08, ${stat.color}02)`,
                  border: `1px solid ${stat.color}12`,
                }}>
                  <div className="absolute top-0 left-0 w-full h-[2px] opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)` }} />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                        <Icon size={15} style={{ color: stat.color }} />
                      </div>
                    </div>
                    <div className="font-mono-price text-[24px] font-bold" style={{ color: stat.color }}>{stat.value}</div>
                    <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{stat.label}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── News Section ── */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Newspaper size={15} style={{ color: '#00E5FF' }} />
                {labels.stats.newsSection}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: labels.stats.totalFetched, value: statsData?.news?.totalFetched ?? '—', color: '#3BA7F0' },
                  { label: labels.stats.todayFetched, value: statsData?.news?.todayFetched ?? '—', color: '#00E5FF' },
                  { label: labels.stats.thisWeek, value: statsData?.news?.thisWeekPublished ?? '—', color: '#00C896' },
                  { label: labels.stats.thisMonth, value: statsData?.news?.thisMonthPublished ?? '—', color: '#8B5CF6' },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                    <div className="font-mono-price text-[20px] font-bold" style={{ color: s.color }}>{s.value}</div>
                    <span className="text-[9px]" style={{ color: 'var(--text3)' }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* byStage Pipeline */}
              {statsData?.news?.byStage && (
                <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <div className="text-[10px] font-bold mb-2" style={{ color: 'var(--cyan)' }}>{labels.stats.newsStages}</div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {Object.entries(statsData.news.byStage as Record<string, number>).map(([stage, count], i, arr) => (
                      <div key={stage} className="flex items-center gap-1">
                        <div className="px-2 py-1 rounded-lg text-center" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.1)' }}>
                          <div className="font-mono-price text-[14px] font-bold" style={{ color: 'var(--cyan)' }}>{count}</div>
                          <div className="text-[8px]" style={{ color: 'var(--text4)' }}>{stage}</div>
                        </div>
                        {i < arr.length - 1 && <ArrowRight size={10} style={{ color: 'var(--text4)' }} className={`flex-shrink-0 ${arrowRotate}`} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* byCategory Top 5 */}
              {statsData?.news?.byCategory && (
                <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <div className="text-[10px] font-bold mb-2" style={{ color: 'var(--gold)' }}>{labels.stats.top5Categories}</div>
                  <div className="space-y-1.5">
                    {Object.entries(statsData.news.byCategory as Record<string, number>).slice(0, 5).map(([cat, count]) => {
                      const maxCount = Math.max(...Object.values(statsData.news.byCategory as Record<string, number>));
                      const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      return (
                        <div key={cat} className="flex items-center gap-2">
                          <span className="text-[9px] w-20 truncate" style={{ color: 'var(--text2)' }}>{cat}</span>
                          <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'rgba(212,175,55,0.08)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--gold), #b8860b)' }} />
                          </div>
                          <span className="text-[9px] font-mono-price font-bold w-8 text-left" style={{ color: 'var(--gold)' }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Success Rate & Avg Duration */}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.12)' }}>
                  <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{labels.stats.successRate}</div>
                  <div className="font-mono-price text-[18px] font-bold" style={{ color: 'var(--bull)' }}>
                    {statsData?.news?.successRate != null ? `${statsData.news.successRate}%` : '—'}
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.12)' }}>
                  <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{labels.stats.avgDuration}</div>
                  <div className="font-mono-price text-[18px] font-bold" style={{ color: 'var(--cyan)' }}>
                    {statsData?.news?.avgFetchDuration != null ? `${statsData.news.avgFetchDuration}${labels.stats.sec}` : '—'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Reports Section ── */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <FileText size={15} style={{ color: '#D4AF37' }} />
                {labels.stats.reportsSection}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: labels.stats.todayGen, value: statsData?.reports?.todayGenerated ?? '—', color: '#D4AF37' },
                  { label: labels.stats.weekGen, value: statsData?.reports?.thisWeekGenerated ?? '—', color: '#00C896' },
                  { label: labels.stats.monthGen, value: statsData?.reports?.thisMonthGenerated ?? '—', color: '#8B5CF6' },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                    <div className="font-mono-price text-[20px] font-bold" style={{ color: s.color }}>{s.value}</div>
                    <span className="text-[9px]" style={{ color: 'var(--text3)' }}>{s.label}</span>
                  </div>
                ))}
              </div>
              {statsData?.reports?.byType && (
                <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <div className="text-[10px] font-bold mb-2" style={{ color: 'var(--gold)' }}>{labels.stats.byType}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(statsData.reports.byType as Record<string, number>).map(([type, count]) => (
                      <Badge key={type} className="text-[9px] gap-1" style={{ background: 'rgba(212,175,55,0.08)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.15)' }}>
                        {type}: <span className="font-mono-price font-bold">{count}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {statsData?.reports?.byAssetClass && (
                <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <div className="text-[10px] font-bold mb-2" style={{ color: '#8B5CF6' }}>{labels.stats.byAssetClass}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(statsData.reports.byAssetClass as Record<string, number>).map(([ac, count]) => (
                      <Badge key={ac} className="text-[9px] gap-1" style={{ background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.15)' }}>
                        {ac}: <span className="font-mono-price font-bold">{count}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Infographics & Videos Mini Section ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Image size={14} style={{ color: '#8B5CF6' }} />
                  <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{labels.stats.infographicsSection}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.06)' }}>
                    <div className="font-mono-price text-[16px] font-bold" style={{ color: '#8B5CF6' }}>{statsData?.infographics?.totalPublished ?? '—'}</div>
                    <div className="text-[8px]" style={{ color: 'var(--text3)' }}>{labels.stats.published}</div>
                  </div>
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.06)' }}>
                    <div className="font-mono-price text-[16px] font-bold" style={{ color: '#8B5CF6' }}>{statsData?.infographics?.todayGenerated ?? '—'}</div>
                    <div className="text-[8px]" style={{ color: 'var(--text3)' }}>{labels.stats.today}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Video size={14} style={{ color: '#00C896' }} />
                  <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{labels.stats.videosSection}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(0,200,150,0.06)' }}>
                    <div className="font-mono-price text-[16px] font-bold" style={{ color: '#00C896' }}>{statsData?.videos?.totalPublished ?? '—'}</div>
                    <div className="text-[8px]" style={{ color: 'var(--text3)' }}>{labels.stats.published}</div>
                  </div>
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(0,200,150,0.06)' }}>
                    <div className="font-mono-price text-[16px] font-bold" style={{ color: '#00C896' }}>{statsData?.videos?.todayGenerated ?? '—'}</div>
                    <div className="text-[8px]" style={{ color: 'var(--text3)' }}>{labels.stats.today}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Pipeline Stats Section ── */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Activity size={15} style={{ color: '#00E5FF' }} />
                {labels.stats.pipelineSection}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: labels.stats.pipelineRuns, value: statsData?.pipeline?.totalRuns ?? '—', color: '#3BA7F0' },
                  { label: labels.stats.completedRuns, value: statsData?.pipeline?.completedRuns ?? '—', color: '#00C896' },
                  { label: labels.stats.failedRuns, value: statsData?.pipeline?.failedRuns ?? '—', color: '#FF4D6A' },
                  { label: labels.stats.lastRun, value: statsData?.pipeline?.lastRunAt ?? '—', color: '#FFB800' },
                  { label: labels.stats.avgPerRun, value: statsData?.pipeline?.avgArticlesPerRun ?? '—', color: '#8B5CF6' },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                    <div className="font-mono-price text-[18px] font-bold" style={{ color: s.color }}>{s.value}</div>
                    <span className="text-[9px]" style={{ color: 'var(--text3)' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {!statsData && (
            <div className="p-6 rounded-xl text-center" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <Database size={24} style={{ color: 'var(--text4)' }} className="mx-auto mb-2" />
              <div className="text-[12px]" style={{ color: 'var(--text3)' }}>{labels.stats.noStatsTitle}</div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text4)' }}>{labels.stats.noStatsSubtitle}</div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 2: PIPELINE SECTION
          ════════════════════════════════════════════════════════════════ */}
      {activeSection === 'pipeline' && (
        <div className="space-y-4">
          {/* Pipeline Status Banner */}
          <Card className="border-0 overflow-hidden" style={{
            background: p?.isRunning
              ? 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(139,92,246,0.04))'
              : 'var(--bg3)',
            border: `1px solid ${p?.isRunning ? 'rgba(0,229,255,0.15)' : 'var(--border)'}`,
          }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: p?.isRunning ? 'var(--cyan2)' : 'var(--bg4)' }}>
                    {p?.isRunning ? (
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--cyan)' }} />
                    ) : (
                      <CircleDashed size={20} style={{ color: 'var(--text3)' }} />
                    )}
                  </div>
                  <div>
                    <span className="text-[14px] font-bold" style={{ color: p?.isRunning ? 'var(--cyan)' : 'var(--text3)' }}>
                      {p?.isRunning ? labels.pipeline.running : labels.pipeline.stopped}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="text-[9px]" style={{ background: 'var(--bg4)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                        {labels.pipeline.cycle} #{p?.cycleCount || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-center">
                  <div>
                    <div className="font-mono-price text-[18px] font-bold" style={{ color: 'var(--bull)' }}>{p?.totalPublished || 0}</div>
                    <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{labels.pipeline.published}</div>
                  </div>
                  <div>
                    <div className="font-mono-price text-[18px] font-bold" style={{ color: 'var(--bear)' }}>{p?.totalFailed || 0}</div>
                    <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{labels.pipeline.failed}</div>
                  </div>
                </div>
              </div>
              {p?.lastProcessError && (
                <div className="mt-3 p-2 rounded-lg flex items-center gap-2" style={{ background: 'rgba(255,77,106,0.06)' }}>
                  <AlertTriangle size={12} style={{ color: 'var(--bear)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{p.lastProcessError}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
            {[
              { icon: Database, label: labels.pipeline.totalArticles, value: a?.total || 0, color: '#3BA7F0' },
              { icon: CheckCircle2, label: labels.pipeline.ready, value: a?.ready || 0, color: '#00C896' },
              { icon: Clock, label: labels.pipeline.pending, value: a?.pending || 0, color: '#FFB800' },
              { icon: Languages, label: labels.pipeline.translated, value: a?.translated || 0, color: '#00E5FF' },
              { icon: Brain, label: labels.pipeline.analyzed, value: a?.analyzed || 0, color: '#8B5CF6' },
              { icon: Image, label: labels.pipeline.imaged, value: a?.imaged || 0, color: '#00C896' },
              { icon: XCircle, label: labels.pipeline.rejected, value: a?.rejected || 0, color: '#FF4D6A' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="p-4 rounded-xl" style={{ background: `${stat.color}08`, border: `1px solid ${stat.color}18` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                      <Icon size={16} style={{ color: stat.color }} />
                    </div>
                  </div>
                  <div className="font-mono-price text-[22px] font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{stat.label}</span>
                </div>
              );
            })}
          </div>

          {/* Queue Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: CircleDashed, label: labels.pipeline.pendingJobs, value: q?.totalPending || 0, color: '#FFB800' },
              { icon: Loader2, label: labels.pipeline.runningJobs, value: q?.totalRunning || 0, color: '#00E5FF' },
              { icon: CheckCircle2, label: labels.pipeline.done24h, value: q?.totalDone24h || 0, color: '#00C896' },
              { icon: XCircle, label: labels.pipeline.failed24h, value: q?.totalFailed24h || 0, color: '#FF4D6A' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="p-4 rounded-xl" style={{ background: `${stat.color}08`, border: `1px solid ${stat.color}18` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                      <Icon size={16} style={{ color: stat.color }} />
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{stat.label}</span>
                  </div>
                  <div className="font-mono-price text-[22px] font-bold" style={{ color: stat.color }}>{stat.value}</div>
                </div>
              );
            })}
          </div>

          {/* Publishing Limits */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Settings2 size={15} style={{ color: 'var(--cyan)' }} />
                  {labels.pipeline.productionLimits}
                </CardTitle>
                <Button
                  onClick={saveLimits}
                  disabled={limitsSaving}
                  size="sm"
                  className="text-[11px] gap-1.5 h-8"
                  style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: 'white' }}
                >
                  {limitsSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  {labels.pipeline.save}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 size={16} style={{ color: 'var(--bull)' }} />
                    <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{labels.pipeline.dailyLimit}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={limits.maxPublishedPerDay}
                      onChange={(e) => setLimits(prev => ({ ...prev, maxPublishedPerDay: parseInt(e.target.value) || 200 }))}
                      className="w-24 px-3 py-2 rounded-lg text-[16px] font-mono-price font-bold text-center"
                      style={{ background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', outline: 'none' }}
                    />
                    <span className="text-[11px]" style={{ color: 'var(--text2)' }}>{labels.stats.articlesPerDay}</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={16} style={{ color: 'var(--gold)' }} />
                    <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{labels.pipeline.hourlyLimit}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={limits.maxPublishedPerHour}
                      onChange={(e) => setLimits(prev => ({ ...prev, maxPublishedPerHour: parseInt(e.target.value) || 20 }))}
                      className="w-24 px-3 py-2 rounded-lg text-[16px] font-mono-price font-bold text-center"
                      style={{ background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', outline: 'none' }}
                    />
                    <span className="text-[11px]" style={{ color: 'var(--text2)' }}>{labels.stats.articlesPerHour}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 3: REPORTS SCHEDULE SECTION
          ════════════════════════════════════════════════════════════════ */}
      {activeSection === 'reports' && (
        <div className="space-y-5">
          {/* ── Section Header ── */}
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(139,92,246,0.04))', border: '1px solid rgba(0,229,255,0.1)' }}>
            <Zap size={16} style={{ color: 'var(--cyan)' }} />
            <div>
              <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{labels.reports.scheduleHeader}</div>
              <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{labels.reports.scheduleSubtitle}</div>
            </div>
          </div>

          {/* ═══ A. Temporal Reports ═══ */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <FileText size={15} style={{ color: 'var(--cyan)' }} />
                {labels.reports.temporalReports}
                <Badge className="text-[8px]" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>{labels.reports.temporalBadge}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Daily */}
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.1)' }}>
                        <FileText size={13} style={{ color: 'var(--cyan)' }} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{labels.reports.daily}</div>
                        <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{config.dailyTimesPerDay}x{labels.reports.timesPerDay}</div>
                      </div>
                    </div>
                    <Badge className="text-[8px]" style={{ background: config.dailyEnabled ? 'var(--bull2)' : 'var(--bg3)', color: config.dailyEnabled ? 'var(--bull)' : 'var(--text4)', border: `1px solid ${config.dailyEnabled ? 'rgba(0,200,150,0.2)' : 'var(--border)'}` }}>
                      {config.dailyEnabled ? labels.reports.enabled : labels.reports.disabled}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={config.dailyEnabled} onCheckedChange={(v) => setConfig({ ...config, dailyEnabled: v })} className="scale-75" />
                    <Button size="sm" className="text-[10px] gap-1 h-7 px-3 flex-1"
                      style={{ background: 'rgba(0,229,255,0.08)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.15)' }}
                      disabled={!!triggering}
                      onClick={() => handleTrigger('generate-daily')}>
                      {triggering === 'generate-daily' ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                      {labels.reports.generate}
                    </Button>
                  </div>
                </div>

                {/* Weekly */}
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.1)' }}>
                        <Calendar size={13} style={{ color: 'var(--gold)' }} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{labels.reports.weekly}</div>
                        <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{labels.reports.dayOfWeek} {daysOfWeek[config.weeklyDay]}</div>
                      </div>
                    </div>
                    <Badge className="text-[8px]" style={{ background: config.weeklyEnabled ? 'var(--bull2)' : 'var(--bg3)', color: config.weeklyEnabled ? 'var(--bull)' : 'var(--text4)', border: `1px solid ${config.weeklyEnabled ? 'rgba(0,200,150,0.2)' : 'var(--border)'}` }}>
                      {config.weeklyEnabled ? labels.reports.enabled : labels.reports.disabled}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={config.weeklyEnabled} onCheckedChange={(v) => setConfig({ ...config, weeklyEnabled: v })} className="scale-75" />
                    <Button size="sm" className="text-[10px] gap-1 h-7 px-3 flex-1"
                      style={{ background: 'rgba(255,184,0,0.06)', color: 'var(--gold)', border: '1px solid rgba(255,184,0,0.15)' }}
                      disabled={!!triggering}
                      onClick={() => handleTrigger('generate-weekly')}>
                      {triggering === 'generate-weekly' ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                      {labels.reports.generate}
                    </Button>
                  </div>
                </div>

                {/* Monthly */}
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
                        <BarChart3 size={13} style={{ color: 'var(--purple)' }} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{labels.reports.monthly}</div>
                        <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{labels.reports.dayOfMonth} {config.monthlyDay}</div>
                      </div>
                    </div>
                    <Badge className="text-[8px]" style={{ background: config.monthlyEnabled ? 'var(--bull2)' : 'var(--bg3)', color: config.monthlyEnabled ? 'var(--bull)' : 'var(--text4)', border: `1px solid ${config.monthlyEnabled ? 'rgba(0,200,150,0.2)' : 'var(--border)'}` }}>
                      {config.monthlyEnabled ? labels.reports.enabled : labels.reports.disabled}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={config.monthlyEnabled} onCheckedChange={(v) => setConfig({ ...config, monthlyEnabled: v })} className="scale-75" />
                    <Button size="sm" className="text-[10px] gap-1 h-7 px-3 flex-1"
                      style={{ background: 'rgba(139,92,246,0.06)', color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.15)' }}
                      disabled={!!triggering}
                      onClick={() => handleTrigger('generate-monthly')}>
                      {triggering === 'generate-monthly' ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                      {labels.reports.generate}
                    </Button>
                  </div>
                </div>

                {/* Quarterly */}
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,167,240,0.1)' }}>
                        <TrendingUp size={13} style={{ color: '#3BA7F0' }} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{labels.reports.quarterly}</div>
                        <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{labels.reports.everyQuarter}</div>
                      </div>
                    </div>
                    <Badge className="text-[8px]" style={{ background: 'rgba(59,167,240,0.1)', color: '#3BA7F0', border: '1px solid rgba(59,167,240,0.2)' }}>{labels.reports.manual}</Badge>
                  </div>
                  <Button size="sm" className="text-[10px] gap-1 h-7 px-3 w-full"
                    style={{ background: 'rgba(59,167,240,0.06)', color: '#3BA7F0', border: '1px solid rgba(59,167,240,0.15)' }}
                    disabled={!!triggering}
                    onClick={() => handleGenerateReport({ type: 'quarterly', label: labels.reports.quarterly })}>
                    {triggering === 'custom-quarterly' ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                    {labels.reports.generate}
                  </Button>
                </div>

                {/* Technical Analysis */}
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,200,150,0.1)' }}>
                        <Zap size={13} style={{ color: '#00C896' }} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{labels.reports.technicalAnalysis}</div>
                        <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{labels.reports.auto3x}</div>
                      </div>
                    </div>
                    <Badge className="text-[8px]" style={{ background: 'rgba(0,200,150,0.1)', color: '#00C896', border: '1px solid rgba(0,200,150,0.2)' }}>{labels.reports.scheduled}</Badge>
                  </div>
                  <Button size="sm" className="text-[10px] gap-1 h-7 px-3 w-full"
                    style={{ background: 'rgba(0,200,150,0.06)', color: '#00C896', border: '1px solid rgba(0,200,150,0.15)' }}
                    disabled={!!triggering}
                    onClick={() => handleTrigger('generate-technical-analysis')}>
                    {triggering === 'generate-technical-analysis' ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                    {labels.reports.generate}
                  </Button>
                </div>

                {/* Strategic — Link */}
                <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,229,255,0.04))', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
                        <Bot size={13} style={{ color: 'var(--purple)' }} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{labels.reports.strategic}</div>
                        <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{labels.reports.deepAnalysis}</div>
                      </div>
                    </div>
                    <Badge className="text-[8px]" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.2)' }}>{labels.reports.manual}</Badge>
                  </div>
                  <a href="/dashboard/strategic-reports" className="block">
                    <Button size="sm" className="text-[10px] gap-1 h-7 px-3 w-full"
                      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(0,229,255,0.05))', color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.2)' }}>
                      <Sparkles size={10} />
                      {labels.reports.strategicPageLink}
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ═══ Manual Categories Table ═══ */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <BarChart3 size={15} style={{ color: 'var(--gold)' }} />
                {labels.reports.manualCategoriesTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {assetClasses.map(ac => {
                  const catStatus = manualCategoryStatus[ac.id] || 'idle';
                  const lastGen = manualCategoryLastGen[ac.id];
                  return (
                    <div key={ac.id} className="p-3 rounded-xl" style={{ background: 'var(--bg4)', border: `1px solid ${ac.color}20` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${ac.color}15` }}>
                          <BarChart3 size={13} style={{ color: ac.color }} />
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: ac.color }}>{ac.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Button size="sm" className="text-[10px] gap-1 h-7 px-3 flex-1"
                          style={{ background: `${ac.color}08`, color: ac.color, border: `1px solid ${ac.color}20` }}
                          disabled={catStatus === 'generating' || !!triggering}
                          onClick={async () => {
                            setManualCategoryStatus(prev => ({ ...prev, [ac.id]: 'generating' }));
                            try {
                              const res = await fetch('/api/reports/generate', {
                                method: 'POST',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'daily', assetClass: ac.id, force: true, async: true, publish: true }),
                              });
                              const data = await res.json();
                              if (data.success || data.jobId) {
                                toast.success(labels.toast.generationStartedBg);
                                setManualCategoryStatus(prev => ({ ...prev, [ac.id]: 'completed' }));
                                setManualCategoryLastGen(prev => ({ ...prev, [ac.id]: new Date().toLocaleString(locale === 'ar' ? 'ar-SA' : locale) }));
                                if (data.jobId) { setGenJobId(data.jobId); pollGenJobStatus(data.jobId); }
                              } else {
                                setManualCategoryStatus(prev => ({ ...prev, [ac.id]: 'failed' }));
                                toast.error(data.error || labels.toast.generationFailed);
                              }
                            } catch {
                              setManualCategoryStatus(prev => ({ ...prev, [ac.id]: 'failed' }));
                              toast.error(labels.toast.connectionFailed);
                            }
                          }}>
                          {catStatus === 'generating' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          {catStatus === 'generating' ? labels.reports.generating : labels.reports.generate}
                        </Button>
                        <Badge className="text-[8px]" style={{
                          background: catStatus === 'completed' ? 'var(--bull2)' : catStatus === 'failed' ? 'var(--bear2)' : catStatus === 'generating' ? 'rgba(139,92,246,0.08)' : 'var(--bg3)',
                          color: catStatus === 'completed' ? 'var(--bull)' : catStatus === 'failed' ? 'var(--bear)' : catStatus === 'generating' ? 'var(--purple)' : 'var(--text4)',
                          border: `1px solid ${catStatus === 'completed' ? 'rgba(0,200,150,0.2)' : catStatus === 'failed' ? 'rgba(255,77,106,0.2)' : 'var(--border)'}`,
                        }}>
                          {catStatus === 'completed' ? '✅' : catStatus === 'failed' ? '❌' : catStatus === 'generating' ? '⏳' : '—'}
                        </Badge>
                      </div>
                      {lastGen && (
                        <div className="text-[8px]" style={{ color: 'var(--text4)' }}>
                          {labels.reports.lastGeneration}: {lastGen}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ═══ B. Market Analyses by Asset Class ═══ */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <BarChart3 size={15} style={{ color: 'var(--gold)' }} />
                  {labels.reports.marketAnalysesTitle}
                  <Badge className="text-[8px]" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.2)' }}>{labels.reports.marketAnalysesBadge}</Badge>
                </CardTitle>
                <Button size="sm" className="text-[10px] gap-1 h-7"
                  style={{ background: 'linear-gradient(135deg, var(--gold), #b8860b)', color: 'white', border: 'none' }}
                  disabled={!!triggering}
                  onClick={() => handleTrigger('generate-analyses')}>
                  {triggering === 'generate-analyses' ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
                  {labels.reports.generateAll}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {assetClasses.map(ac => (
                  <button
                    key={ac.id}
                    onClick={() => handleGenerateReport({ type: 'daily', assetClass: ac.id, label: ac.name })}
                    disabled={!!triggering}
                    className="p-3 rounded-xl text-center transition-all hover:scale-[1.02]"
                    style={{
                      background: `${ac.color}06`,
                      border: `1px solid ${ac.color}20`,
                      cursor: triggering ? 'not-allowed' : 'pointer',
                      opacity: triggering ? 0.6 : 1,
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center" style={{ background: `${ac.color}15` }}>
                      <BarChart3 size={14} style={{ color: ac.color }} />
                    </div>
                    <div className="text-[10px] font-bold" style={{ color: ac.color }}>{ac.name}</div>
                    <div className="text-[8px] mt-0.5" style={{ color: 'var(--text4)' }}>
                      {triggering === `custom-${ac.id}` ? labels.reports.generating : labels.reports.clickToGenerate}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ═══ B2. Quick Generate per Asset Class ═══ */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Sparkles size={15} style={{ color: 'var(--purple)' }} />
                {labels.reports.quickGenTitle}
                <Badge className="text-[8px]" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.2)' }}>{labels.reports.quickGenBadge}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {assetClasses.map(ac => (
                  <div key={ac.id} className="flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: `${ac.color}06`, border: `1px solid ${ac.color}15` }}>
                    <span className="text-[10px] font-bold truncate" style={{ color: ac.color }}>{ac.name}</span>
                    <Button size="sm" className="text-[10px] gap-1 h-7 px-3"
                      style={{ background: `${ac.color}08`, color: ac.color, border: `1px solid ${ac.color}20` }}
                      disabled={!!triggering}
                      onClick={() => handleGenerateReport({ assetClass: ac.id, label: ac.name })}>
                      {triggering === `custom-${ac.id}` ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      {labels.reports.generate}
                    </Button>
                  </div>
                ))}
              </div>

              {/* ── Technical Analysis ── */}
              <div className="mt-3 flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: 'rgba(0,200,150,0.04)', border: '1px solid rgba(0,200,150,0.12)' }}>
                <div className="flex items-center gap-2">
                  <Zap size={13} style={{ color: '#00C896' }} />
                  <span className="text-[10px] font-bold" style={{ color: '#00C896' }}>{labels.reports.technicalAnalysis}</span>
                </div>
                <Button size="sm" className="text-[10px] gap-1 h-7 px-3"
                  style={{ background: 'rgba(0,200,150,0.08)', color: '#00C896', border: '1px solid rgba(0,200,150,0.2)' }}
                  disabled={!!triggering}
                  onClick={() => handleGenerateReport({ assetClass: 'technicalAnalysis', label: labels.reports.technicalAnalysis })}>
                  {triggering === 'custom-technicalAnalysis' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  {labels.reports.generate}
                </Button>
              </div>

              {/* ── Strategic Reports ── */}
              <div className="mt-2 flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)' }}>
                <div className="flex items-center gap-2">
                  <TrendingUp size={13} style={{ color: 'var(--gold)' }} />
                  <span className="text-[10px] font-bold" style={{ color: 'var(--gold)' }}>{labels.reports.strategic}</span>
                </div>
                <Button size="sm" className="text-[10px] gap-1 h-7 px-3"
                  style={{ background: 'rgba(212,175,55,0.08)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.2)' }}
                  disabled={!!triggering}
                  onClick={() => handleGenerateReport({ assetClass: 'strategic', label: labels.reports.strategic })}>
                  {triggering === 'custom-strategic' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  {labels.reports.generate}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ═══ C. Special Event Reports ═══ */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <AlertTriangle size={15} style={{ color: '#EF5350' }} />
                {labels.reports.specialEventsTitle}
                <Badge className="text-[8px]" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF5350', border: '1px solid rgba(239,68,68,0.2)' }}>{labels.reports.specialEventsBadge}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {specialEvents.map(ev => {
                  const evKey = `event-${ev.id}`;
                  const catStatus = manualCategoryStatus[evKey] || 'idle';
                  const lastGen = manualCategoryLastGen[evKey];
                  return (
                    <div key={ev.id} className="p-3 rounded-xl text-center" style={{ background: `${ev.color}06`, border: `1px solid ${ev.color}20` }}>
                      <div className="w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center" style={{ background: `${ev.color}15` }}>
                        <Zap size={14} style={{ color: ev.color }} />
                      </div>
                      <div className="text-[10px] font-bold mb-1.5" style={{ color: ev.color }}>{ev.name}</div>
                      <div className="flex items-center gap-1.5 justify-center">
                        <Button size="sm" className="text-[9px] gap-1 h-6 px-2"
                          style={{ background: `${ev.color}08`, color: ev.color, border: `1px solid ${ev.color}20` }}
                          disabled={catStatus === 'generating' || !!triggering}
                          onClick={async () => {
                            setManualCategoryStatus(prev => ({ ...prev, [evKey]: 'generating' }));
                            try {
                              const res = await fetch('/api/reports/generate', {
                                method: 'POST',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'special', eventType: ev.id, force: true, async: true, publish: true }),
                              });
                              const data = await res.json();
                              if (data.success || data.jobId) {
                                toast.success(labels.toast.generationStartedBg);
                                setManualCategoryStatus(prev => ({ ...prev, [evKey]: 'completed' }));
                                setManualCategoryLastGen(prev => ({ ...prev, [evKey]: new Date().toLocaleString(locale === 'ar' ? 'ar-SA' : locale) }));
                                if (data.jobId) { setGenJobId(data.jobId); pollGenJobStatus(data.jobId); }
                              } else {
                                setManualCategoryStatus(prev => ({ ...prev, [evKey]: 'failed' }));
                                toast.error(data.error || labels.toast.generationFailed);
                              }
                            } catch {
                              setManualCategoryStatus(prev => ({ ...prev, [evKey]: 'failed' }));
                              toast.error(labels.toast.connectionFailed);
                            }
                          }}>
                          {catStatus === 'generating' ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                          {catStatus === 'generating' ? labels.reports.generating : labels.reports.generate}
                        </Button>
                        <Badge className="text-[7px] px-1.5" style={{
                          background: catStatus === 'completed' ? 'var(--bull2)' : catStatus === 'failed' ? 'var(--bear2)' : catStatus === 'generating' ? 'rgba(139,92,246,0.08)' : 'var(--bg3)',
                          color: catStatus === 'completed' ? 'var(--bull)' : catStatus === 'failed' ? 'var(--bear)' : catStatus === 'generating' ? 'var(--purple)' : 'var(--text4)',
                          border: `1px solid ${catStatus === 'completed' ? 'rgba(0,200,150,0.2)' : catStatus === 'failed' ? 'rgba(255,77,106,0.2)' : 'var(--border)'}`,
                        }}>
                          {catStatus === 'completed' ? '✅' : catStatus === 'failed' ? '❌' : catStatus === 'generating' ? '⏳' : '—'}
                        </Badge>
                      </div>
                      {lastGen && (
                        <div className="text-[7px] mt-1" style={{ color: 'var(--text4)' }}>
                          {labels.reports.lastGeneration}: {lastGen}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 4: NEWS PROMPTS
          ════════════════════════════════════════════════════════════════ */}
      {activeSection === 'news-prompts' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <Newspaper size={16} style={{ color: '#8B5CF6' }} />
            <div>
              <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{labels.prompts.newsTitle}</div>
              <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{labels.prompts.newsSubtitle} — {newsPrompts.length} prompts</div>
            </div>
          </div>

          {groupPrompts(newsPrompts, [
            { key: 'fetch', label: labels.prompts.fetchGroup, filter: (p) => p.key?.includes('fetch'), color: '#00E5FF' },
            { key: 'analyze', label: labels.prompts.analyzeGroup, filter: (p) => p.key?.includes('analyze'), color: '#8B5CF6' },
            { key: 'translate', label: labels.prompts.translateGroup, filter: (p) => p.key?.includes('translate'), color: '#00C896' },
            { key: 'classify', label: labels.prompts.classifyGroup, filter: (p) => p.key?.includes('classify') || p.key?.includes('categorize'), color: '#D4AF37' },
            { key: 'other-news', label: labels.prompts.otherGroup, filter: (p) => !p.key?.includes('fetch') && !p.key?.includes('analyze') && !p.key?.includes('translate') && !p.key?.includes('classify') && !p.key?.includes('categorize'), color: '#3BA7F0' },
          ])}

          {/* Category Distribution from Stats */}
          {statsData?.news?.byCategory && (
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <BarChart3 size={15} style={{ color: 'var(--gold)' }} />
                  {labels.prompts.categoryReports}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {Object.entries(statsData.news.byCategory as Record<string, number>).map(([cat, count]) => {
                    const acMatch = assetClasses.find(a => a.id === cat);
                    const color = acMatch?.color || '#6B7280';
                    return (
                      <div key={cat} className="p-3 rounded-xl text-center" style={{ background: `${color}06`, border: `1px solid ${color}15` }}>
                        <div className="font-mono-price text-[18px] font-bold" style={{ color }}>{count}</div>
                        <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{acMatch?.name || cat}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {newsPrompts.length === 0 && (
            <div className="p-6 rounded-xl text-center" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <PenLine size={24} style={{ color: 'var(--text4)' }} className="mx-auto mb-2" />
              <div className="text-[12px]" style={{ color: 'var(--text3)' }}>{labels.prompts.noPrompts}</div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 5: REPORT PROMPTS
          ════════════════════════════════════════════════════════════════ */}
      {activeSection === 'report-prompts' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <PenLine size={16} style={{ color: '#D4AF37' }} />
            <div>
              <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{labels.prompts.reportTitle}</div>
              <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{labels.prompts.reportSubtitle} — {reportPrompts.length} prompts</div>
            </div>
          </div>

          {groupPrompts(reportPrompts, [
            { key: 'report', label: labels.prompts.reportsGroup, filter: (p) => p.key?.includes('report'), color: '#D4AF37' },
            { key: 'infographic', label: labels.prompts.infographicGroup, filter: (p) => p.key?.includes('infographic'), color: '#8B5CF6' },
            { key: 'video', label: labels.prompts.videoGroup, filter: (p) => p.key?.includes('video'), color: '#00C896' },
            { key: 'other-report', label: labels.prompts.otherReportGroup, filter: (p) => !p.key?.includes('report') && !p.key?.includes('infographic') && !p.key?.includes('video'), color: '#3BA7F0' },
          ])}

          {reportPrompts.length === 0 && (
            <div className="p-6 rounded-xl text-center" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <PenLine size={24} style={{ color: 'var(--text4)' }} className="mx-auto mb-2" />
              <div className="text-[12px]" style={{ color: 'var(--text3)' }}>{labels.prompts.noPrompts}</div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 6: MODEL ASSIGNMENT
          ════════════════════════════════════════════════════════════════ */}
      {activeSection === 'models' && (
        <div className="space-y-4">
          {/* Provider List */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Server size={14} style={{ color: 'var(--cyan)' }} />
                {labels.models.providers}
                <Badge className="text-[9px]" style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--bull)', border: '1px solid rgba(0,200,150,0.2)' }}>
                  {(modelsData?.providers || []).filter((p: any) => p.available && !p.disabled).length} {labels.models.activeCount}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin' }}>
                {(modelsData?.providers || []).map((provider: any) => {
                  const color = PROVIDER_COLORS[provider.name] || '#6B7280';
                  const isEnabled = localToggles[provider.name] !== false;
                  const isEffectivelyAvailable = provider.available && isEnabled;
                  return (
                    <div key={provider.name}
                      className="flex items-center gap-4 p-3 rounded-xl transition-all"
                      style={{
                        background: isEffectivelyAvailable ? `${color}06` : 'var(--bg4)',
                        border: `1px solid ${isEffectivelyAvailable ? `${color}20` : 'var(--border)'}`,
                        opacity: !provider.available ? 0.5 : 1,
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                        background: `${color}15`,
                        border: `1px solid ${color}25`,
                      }}>
                        <Bot size={18} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold" style={{ color: isEffectivelyAvailable ? 'var(--text)' : 'var(--text3)' }}>
                            {PROVIDER_NAMES[provider.name] || provider.name}
                          </span>
                          {isEffectivelyAvailable ? (
                            <Badge className="text-[9px] gap-1 px-2 py-0.5" style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--bull)', border: '1px solid rgba(0,200,150,0.2)' }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--bull)' }} />
                              {labels.models.available}
                            </Badge>
                          ) : provider.available && !isEnabled ? (
                            <Badge className="text-[9px] gap-1 px-2 py-0.5" style={{ background: 'rgba(255,184,0,0.1)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.2)' }}>
                              {labels.models.disabledManually}
                            </Badge>
                          ) : (
                            <Badge className="text-[9px] gap-1 px-2 py-0.5" style={{ background: 'rgba(255,77,106,0.1)', color: 'var(--bear)', border: '1px solid rgba(255,77,106,0.2)' }}>
                              {labels.models.unavailable}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text4)' }}>{provider.model}</span>
                      </div>
                      {provider.available && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] font-bold" style={{ color: isEnabled ? 'var(--bull)' : 'var(--text4)' }}>
                            {isEnabled ? labels.models.enabled : labels.models.disabledLabel}
                          </span>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => handleModelToggle(provider.name, checked)}
                            disabled={modelsSaving === `toggle_${provider.name}`}
                          />
                          {modelsSaving === `toggle_${provider.name}` && (
                            <Loader2 size={12} className="animate-spin" style={{ color: 'var(--cyan)' }} />
                          )}
                        </div>
                      )}
                      {!provider.available && (
                        <div className="flex items-center gap-1.5 flex-shrink-0" style={{ color: 'var(--text4)' }}>
                          <XCircle size={14} />
                          <span className="text-[10px]">{labels.models.noApiKey}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Mappings — locale-specific */}
          <Card className="border-0 overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(0,200,150,0.06), rgba(0,200,150,0.02))',
            border: '1px solid rgba(0,200,150,0.18)',
          }}>
            <div className="absolute top-0 left-0 w-full h-[2px] opacity-60" style={{ background: 'linear-gradient(90deg, transparent, #00C896, transparent)' }} />
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <span className="text-[18px]">{labels.localeFlag}</span>
                {labels.pipelineLocaleLabel}
                <Badge className="text-[9px]" style={{ background: 'rgba(0,200,150,0.1)', color: '#00C896', border: '1px solid rgba(0,200,150,0.2)' }}>
                  {(modelsData?.pipelineMappings || []).filter((m: any) => m.locale === locale).length} {labels.models.mappingsCount}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(modelsData?.pipelineMappings || []).filter((m: any) => m.locale === locale).map((mapping: any) => {
                  const currentProvider = localMappings[mapping.key] || mapping.currentProvider;
                  const providerColor = PROVIDER_COLORS[currentProvider] || '#6B7280';
                  const isSaving = modelsSaving === mapping.key;
                  const PipelineIcon = mapping.key?.includes('news') ? Newspaper : mapping.key?.includes('infographic') ? Image : mapping.key?.includes('video') ? Video : FileText;

                  return (
                    <div key={mapping.key} className="flex items-center gap-3 p-3 rounded-xl" style={{
                      background: 'var(--bg4)',
                      border: `1px solid ${mapping.isCustom ? `${providerColor}25` : 'var(--border)'}`,
                    }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                        background: 'rgba(0,200,150,0.12)',
                        border: '1px solid rgba(0,200,150,0.20)',
                      }}>
                        <PipelineIcon size={16} style={{ color: '#00C896' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{mapping.label}</span>
                          {mapping.isCustom && (
                            <Badge className="text-[8px] px-1.5 py-0.5" style={{ background: `${providerColor}12`, color: providerColor, border: `1px solid ${providerColor}25` }}>
                              {labels.models.custom}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                          {labels.models.default}: {PROVIDER_NAMES[mapping.defaultProvider] || mapping.defaultProvider}
                        </span>
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--text4)' }} className={`flex-shrink-0 ${arrowRotate}`} />
                      <div className="w-[180px] flex-shrink-0">
                        <Select
                          value={currentProvider}
                          onValueChange={(v) => handleMappingChange(mapping.key, v)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="text-[11px] h-9" style={{
                            background: `${providerColor}08`,
                            borderColor: `${providerColor}20`,
                            color: providerColor,
                          }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(modelsData?.providers || []).filter((p: any) => p.available).map((p: any) => (
                              <SelectItem key={p.name} value={p.name}>
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ background: PROVIDER_COLORS[p.name] || '#6B7280' }} />
                                  <span>{PROVIDER_NAMES[p.name] || p.name}</span>
                                  <span className="text-[9px] font-mono" style={{ color: 'var(--text4)' }}>({p.model})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {isSaving && (
                        <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: 'var(--cyan)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Circuit Breaker Status */}
          {modelsData?.circuitBreakers && (
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Shield size={14} style={{ color: '#FFB800' }} />
                  {labels.models.circuitBreakers}
                  <span className="text-[10px] font-normal" style={{ color: 'var(--text4)' }}>— {labels.models.circuitBreakersSubtitle}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(modelsData.circuitBreakers as Record<string, { open: boolean; description: string }>).map(([key, cb]) => {
                    const providerName = key === 'zaiSdk' ? 'z-ai-sdk' : key;
                    const color = PROVIDER_COLORS[providerName] || '#6B7280';
                    return (
                      <div key={key} className="flex items-center gap-4 p-4 rounded-xl" style={{
                        background: cb.open ? 'rgba(255,77,106,0.06)' : `${color}06`,
                        border: `1px solid ${cb.open ? 'rgba(255,77,106,0.15)' : `${color}15`}`,
                      }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                          background: cb.open ? 'rgba(255,77,106,0.12)' : `${color}12`,
                          border: `1px solid ${cb.open ? 'rgba(255,77,106,0.25)' : `${color}20`}`,
                        }}>
                          {cb.open ? (
                            <AlertTriangle size={18} style={{ color: 'var(--bear)' }} />
                          ) : (
                            <CheckCircle2 size={18} style={{ color }} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
                              {PROVIDER_NAMES[providerName] || providerName}
                            </span>
                            <Badge className="text-[9px]" style={{
                              background: cb.open ? 'rgba(255,77,106,0.12)' : 'rgba(0,200,150,0.1)',
                              color: cb.open ? 'var(--bear)' : 'var(--bull)',
                              border: `1px solid ${cb.open ? 'rgba(255,77,106,0.2)' : 'rgba(0,200,150,0.2)'}`,
                            }}>
                              {cb.open ? labels.models.openProtected : labels.models.closedWorking}
                            </Badge>
                          </div>
                          <p className="text-[10px]" style={{ color: 'var(--text3)' }}>{cb.description}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`w-3 h-3 rounded-full ${cb.open ? 'animate-pulse' : ''}`} style={{
                            background: cb.open ? 'var(--bear)' : 'var(--bull)',
                            boxShadow: cb.open ? '0 0 8px rgba(255,77,106,0.4)' : '0 0 8px rgba(0,200,150,0.4)',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {!modelsData && (
            <div className="p-6 rounded-xl text-center" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <Bot size={24} style={{ color: 'var(--text4)' }} className="mx-auto mb-2" />
              <div className="text-[12px]" style={{ color: 'var(--text3)' }}>{labels.models.noModelsTitle}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
