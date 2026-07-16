// ─── AI Models Management Dashboard (Enhanced) ──────────────────────
// Comprehensive provider management, pipeline mapping, image providers,
// API keys overview — full RTL Arabic interface with dark theme

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Cpu, Zap, CheckCircle2, XCircle, AlertTriangle,
  Loader2, RefreshCw, Shield, Globe,
  Brain, Image, Video, FileText, Newspaper, Activity,
  Server, Key, TestTube2, Settings2, Sparkles,
  ChevronDown, CircleDot, ArrowUpDown, Volume2, Camera,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────
interface ProviderCapabilities {
  text: boolean;
  image: boolean;
  tts: boolean;
}

interface ProviderInfo {
  name: string;
  model: string;
  available: boolean;
  disabled: boolean;
  baseUrl?: string;
  capabilities: ProviderCapabilities;
  keyPrefix: string;
  hasKey: boolean;
}

interface ImageProviderInfo {
  name: string;
  model: string;
  label: string;
  labelEn: string;
  available: boolean;
  disabled: boolean;
  keyPrefix: string;
  hasKey: boolean;
}

interface PipelineMapping {
  key: string;
  label: string;
  labelEn: string;
  locale: 'ar' | 'en' | 'fr' | 'es' | 'tr';
  type: string;
  defaultProvider: string;
  currentProvider: string;
  isCustom: boolean;
}

interface CircuitBreakerInfo {
  open: boolean;
  description: string;
}

interface ApiKeyInfo {
  name: string;
  exists: boolean;
  keyPrefix: string;
  providers: string[];
  usedInPipelines: string[];
}

interface ModelsData {
  stats: { total: number; available: number; active: number; disabled: number };
  providers: ProviderInfo[];
  imageProviders: ImageProviderInfo[];
  pipelineMappings: PipelineMapping[];
  circuitBreakers: {
    bedrock: CircuitBreakerInfo;
    gemini: CircuitBreakerInfo;
    zaiSdk: CircuitBreakerInfo;
  };
  apiKeys: ApiKeyInfo[];
}

interface TestResult {
  provider: string;
  success: boolean;
  model: string;
  duration?: number;
  content?: string;
  error?: string;
}

// ─── Provider display names (Arabic) ──────────────────────
const PROVIDER_NAMES_AR: Record<string, string> = {
  bedrock: 'أمازون بيروك (كلود)',
  gemini: 'جوجل جيميني',
  groq: 'جروك',
  grok: 'جروك (xAI)',
  cerebras: 'سيريبيراس',
  mistral: 'ميسترال',
  deepseek: 'ديب سيك',
  glm: 'جي إل إم',
  nvidia: 'إنفيديا',
  hf: 'هجينج فيس',
  'z-ai-sdk': 'Z.ai SDK',
  ollama: 'أولاما',
  openrouter: 'أوبن راوتر',
  sambanova: 'سامبانوفا',
  cohere: 'كوهير',
  cloudflare: 'كلاودفلير',
  siliconflow: 'سيليكون فلو',
  deepinfra: 'ديب إنفرا',
  zukijourney: 'زوكي جورني',
  nagaai: 'ناجا AI',
  together: 'توغذر AI (FLUX)',
  prodia: 'بروديا',
  stablehorde: 'ستيبل هورد',
  pollinations: 'بولينيشنز',
  'cloudflare-image': 'كلاودفلير (FLUX)',
};

// Provider display names (English)
const PROVIDER_NAMES_EN: Record<string, string> = {
  bedrock: 'Amazon Bedrock',
  gemini: 'Google Gemini',
  groq: 'Groq',
  grok: 'Grok (xAI)',
  cerebras: 'Cerebras',
  mistral: 'Mistral',
  deepseek: 'DeepSeek',
  glm: 'GLM (ZhipuAI)',
  nvidia: 'NVIDIA NIM',
  hf: 'HuggingFace',
  'z-ai-sdk': 'z-ai-sdk',
  ollama: 'Ollama',
  openrouter: 'OpenRouter',
  sambanova: 'SambaNova',
  cohere: 'Cohere',
  cloudflare: 'Cloudflare',
  siliconflow: 'SiliconFlow',
  deepinfra: 'DeepInfra',
  zukijourney: 'Zukijourney',
  nagaai: 'NagaAI',
  together: 'Together AI (FLUX)',
  prodia: 'Prodia',
  stablehorde: 'Stable Horde',
  pollinations: 'Pollinations',
  'cloudflare-image': 'Cloudflare Image',
};

// ─── Provider brand colors ────────────────────────────────
const PROVIDER_COLORS: Record<string, string> = {
  bedrock: '#FF9900', gemini: '#4285F4', groq: '#F55036', grok: '#1DA1F2',
  cerebras: '#7C3AED', mistral: '#FF7000', deepseek: '#00B4D8', glm: '#00C853',
  nvidia: '#76B900', hf: '#FFD21E', 'z-ai-sdk': '#00E5FF', ollama: '#6366F1',
  openrouter: '#9945FF', sambanova: '#10B981', cohere: '#39594D',
  cloudflare: '#F48120', siliconflow: '#6366F1', deepinfra: '#0066FF',
  zukijourney: '#EC4899', nagaai: '#F59E0B',
  together: '#3B82F6', prodia: '#8B5CF6', stablehorde: '#EF4444', pollinations: '#22C55E',
  'cloudflare-image': '#F48120',
};

// ─── Locale config ────────────────────────────────────────
const LOCALE_CONFIG: Record<string, { flag: string; label: string; color: string }> = {
  ar: { flag: '🇸🇦', label: 'عربي', color: '#00C896' },
  en: { flag: '🇬🇧', label: 'English', color: '#00E5FF' },
  fr: { flag: '🇫🇷', label: 'Français', color: '#8B5CF6' },
  es: { flag: '🇪🇸', label: 'Español', color: '#F97316' },
  tr: { flag: '🇹🇷', label: 'Türkçe', color: '#EF4444' },
};

// ─── Pipeline type config ────────────────────────────────
const PIPELINE_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; labelAr: string }> = {
  news: { icon: Newspaper, label: 'News', labelAr: 'أخبار' },
  reports: { icon: FileText, label: 'Reports', labelAr: 'تقارير' },
  infographic: { icon: Image, label: 'Infographic', labelAr: 'إنفوغرافيك' },
  video: { icon: Video, label: 'Video', labelAr: 'فيديو' },
  image: { icon: Camera, label: 'Images', labelAr: 'صور' },
};

// ─── Provider icon component ──────────────────────────────
function ProviderIcon({ name, size = 20 }: { name: string; size?: number }) {
  const color = PROVIDER_COLORS[name] || '#888';
  return (
    <div
      className="rounded-lg flex items-center justify-center flex-shrink-0"
      style={{
        width: size + 16,
        height: size + 16,
        background: `${color}18`,
        border: `1px solid ${color}30`,
      }}
    >
      <Cpu size={size} style={{ color }} />
    </div>
  );
}

// ─── Status badge ──────────────────────────────────────────
function StatusBadge({ available, disabled }: { available: boolean; disabled: boolean }) {
  if (disabled) {
    return (
      <Badge
        className="text-[10px] px-2 py-0.5 font-semibold"
        style={{ background: 'rgba(251,146,60,0.15)', color: '#FB923C', border: '1px solid rgba(251,146,60,0.25)' }}
      >
        معطّل
      </Badge>
    );
  }
  if (available) {
    return (
      <Badge
        className="text-[10px] px-2 py-0.5 font-semibold"
        style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}
      >
        يعمل
      </Badge>
    );
  }
  return (
    <Badge
      className="text-[10px] px-2 py-0.5 font-semibold"
      style={{ background: 'rgba(244,63,94,0.15)', color: '#F43F5E', border: '1px solid rgba(244,63,94,0.25)' }}
    >
      متوقف
    </Badge>
  );
}

// ─── Key status badge ──────────────────────────────────────
function KeyBadge({ hasKey, prefix }: { hasKey: boolean; prefix: string }) {
  if (hasKey) {
    return (
      <div className="flex items-center gap-1.5">
        <Key size={11} style={{ color: '#22C55E' }} />
        <span className="text-[10px] font-medium" style={{ color: '#22C55E' }}>مفتاح موجود</span>
        {prefix && (
          <code className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.08)', color: '#86EFAC' }}>
            {prefix}
          </code>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <Key size={11} style={{ color: '#F43F5E' }} />
      <span className="text-[10px] font-medium" style={{ color: '#F43F5E' }}>لا يوجد مفتاح</span>
    </div>
  );
}

// ─── Capabilities badges ──────────────────────────────────
function CapabilitiesBadges({ capabilities }: { capabilities: ProviderCapabilities }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {capabilities.text && (
        <Badge className="text-[9px] px-1.5 py-0 h-5" style={{ background: 'rgba(0,229,255,0.12)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
          <Brain size={9} className="ml-1" /> نص
        </Badge>
      )}
      {capabilities.image && (
        <Badge className="text-[9px] px-1.5 py-0 h-5" style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}>
          <Image size={9} className="ml-1" /> صور
        </Badge>
      )}
      {capabilities.tts && (
        <Badge className="text-[9px] px-1.5 py-0 h-5" style={{ background: 'rgba(251,146,60,0.12)', color: '#FB923C', border: '1px solid rgba(251,146,60,0.2)' }}>
          <Volume2 size={9} className="ml-1" /> صوت
        </Badge>
      )}
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, color, sub,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  sub?: string;
}) {
  return (
    <Card
      className="border-0"
      style={{ background: `${color}08`, border: `1px solid ${color}18` }}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <p className="text-[11px] font-medium" style={{ color: 'var(--text3)' }}>{label}</p>
          <p className="text-[20px] font-bold leading-tight" style={{ color }}>{value}</p>
          {sub && <p className="text-[10px]" style={{ color: 'var(--text4)' }}>{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// ─── Main Page Component ──────────────────────────────────
// ═══════════════════════════════════════════════════════════
export default function ModelsPage() {
  const [data, setData] = useState<ModelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [localMappings, setLocalMappings] = useState<Record<string, string>>({});
  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('providers');
  const [settingsDialogProvider, setSettingsDialogProvider] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/models');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        // Initialize local state from server data
        const mappings: Record<string, string> = {};
        for (const m of json.pipelineMappings) {
          mappings[m.key] = m.currentProvider;
        }
        setLocalMappings(mappings);
        const toggles: Record<string, boolean> = {};
        for (const p of json.providers) {
          toggles[p.name] = !p.disabled;
        }
        for (const p of json.imageProviders) {
          toggles[p.name] = !p.disabled;
        }
        setLocalToggles(toggles);
      }
    } catch (err) {
      console.warn('[Models Page] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── Handlers ────────────────────────────────────────────
  const handleMappingChange = async (key: string, provider: string) => {
    setLocalMappings(prev => ({ ...prev, [key]: provider }));
    setSaving(key);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'mapping', key, value: provider }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`تم تحديث التعيين: ${key.replace('models_', '')} ← ${PROVIDER_NAMES_AR[provider] || provider}`);
      } else {
        toast.error(json.error || 'فشل تحديث التعيين');
      }
    } catch {
      toast.error('فشل الاتصال بالخادم');
    } finally {
      setSaving(null);
    }
  };

  const handleToggle = async (providerName: string, enabled: boolean) => {
    setLocalToggles(prev => ({ ...prev, [providerName]: enabled }));
    setSaving(`toggle_${providerName}`);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'toggle', key: providerName, value: enabled ? 'false' : 'true' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${PROVIDER_NAMES_AR[providerName] || providerName}: ${enabled ? 'مفعّل' : 'معطّل'}`);
      } else {
        toast.error(json.error || 'فشل تحديث الحالة');
      }
    } catch {
      toast.error('فشل الاتصال بالخادم');
    } finally {
      setSaving(null);
    }
  };

  const handleTest = async (providerName: string) => {
    setTestingProvider(providerName);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', provider: providerName }),
      });
      const result: TestResult = await res.json();
      setTestResults(prev => ({ ...prev, [providerName]: result }));
      if (result.success) {
        toast.success(`${PROVIDER_NAMES_AR[providerName] || providerName}: اختبار ناجح (${result.duration}ms)`);
      } else {
        toast.error(`${PROVIDER_NAMES_AR[providerName] || providerName}: فشل الاختبار — ${result.error || 'خطأ غير معروف'}`);
      }
    } catch {
      toast.error('فشل الاتصال بالخادم');
    } finally {
      setTestingProvider(null);
    }
  };

  // ─── Loading state ───────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5" dir="rtl">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div>
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const providers = data?.providers || [];
  const imageProviders = data?.imageProviders || [];
  const pipelineMappings = data?.pipelineMappings || [];
  const circuitBreakers = data?.circuitBreakers || { bedrock: { open: false, description: '' }, gemini: { open: false, description: '' }, zaiSdk: { open: false, description: '' } };
  const apiKeys = data?.apiKeys || [];
  const stats = data?.stats || { total: 0, available: 0, active: 0, disabled: 0 };

  // Build "where used" map for each provider
  const providerUsageMap: Record<string, string[]> = {};
  for (const m of pipelineMappings) {
    const prov = localMappings[m.key] || m.currentProvider;
    if (!providerUsageMap[prov]) providerUsageMap[prov] = [];
    providerUsageMap[prov].push(m.label);
  }

  // Group pipelines by locale then type
  const groupedByLocale: Record<string, PipelineMapping[]> = {};
  for (const m of pipelineMappings) {
    if (!groupedByLocale[m.locale]) groupedByLocale[m.locale] = [];
    groupedByLocale[m.locale].push(m);
  }

  // Sort provider list: available first, then disabled, then unavailable
  const sortedProviders = [...providers].sort((a, b) => {
    const aActive = a.available && !a.disabled;
    const bActive = b.available && !b.disabled;
    const aDisabled = a.disabled;
    const bDisabled = b.disabled;
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    if (aDisabled && !bDisabled) return 1;
    if (!aDisabled && bDisabled) return -1;
    return 0;
  });

  // ─── Provider card component ─────────────────────────────
  const ProviderCard = ({ provider }: { provider: ProviderInfo }) => {
    const color = PROVIDER_COLORS[provider.name] || '#888';
    const isEnabled = localToggles[provider.name] !== false;
    const isSavingThis = saving === `toggle_${provider.name}`;
    const isTestingThis = testingProvider === provider.name;
    const testResult = testResults[provider.name];
    const whereUsed = providerUsageMap[provider.name] || [];

    return (
      <Card
        className="border-0 transition-all duration-200 hover:shadow-lg group"
        style={{
          background: `linear-gradient(135deg, ${color}06 0%, var(--bg2) 100%)`,
          border: `1px solid ${provider.available && isEnabled ? `${color}25` : 'var(--border)'}`,
        }}
      >
        <CardContent className="p-4 space-y-3">
          {/* Top row: icon + name + status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <ProviderIcon name={provider.name} size={16} />
              <div className="min-w-0">
                <h3 className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>
                  {PROVIDER_NAMES_AR[provider.name] || provider.name}
                </h3>
                <p className="text-[10px] truncate" style={{ color: 'var(--text3)' }}>
                  {PROVIDER_NAMES_EN[provider.name] || provider.name}
                </p>
              </div>
            </div>
            <StatusBadge available={provider.available} disabled={!isEnabled} />
          </div>

          {/* Model name */}
          <div className="flex items-center gap-1.5">
            <CircleDot size={10} style={{ color: 'var(--text4)' }} />
            <code className="text-[10px] truncate" style={{ color: 'var(--text2)' }}>
              {provider.model}
            </code>
          </div>

          {/* Key status */}
          <KeyBadge hasKey={provider.hasKey} prefix={provider.keyPrefix} />

          {/* Capabilities */}
          <CapabilitiesBadges capabilities={provider.capabilities} />

          {/* Where used */}
          {whereUsed.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium" style={{ color: 'var(--text4)' }}>يُستخدم في:</p>
              <div className="flex flex-wrap gap-1">
                {whereUsed.slice(0, 4).map(label => (
                  <Badge
                    key={label}
                    className="text-[8px] px-1.5 py-0 h-4"
                    style={{ background: 'rgba(0,229,255,0.08)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.12)' }}
                  >
                    {label}
                  </Badge>
                ))}
                {whereUsed.length > 4 && (
                  <Badge className="text-[8px] px-1.5 py-0 h-4" style={{ background: 'var(--bg)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                    +{whereUsed.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Test result */}
          {testResult && (
            <div
              className="rounded-lg px-2.5 py-1.5 text-[10px]"
              style={{
                background: testResult.success ? 'rgba(34,197,94,0.08)' : 'rgba(244,63,94,0.08)',
                border: `1px solid ${testResult.success ? 'rgba(34,197,94,0.15)' : 'rgba(244,63,94,0.15)'}`,
              }}
            >
              <div className="flex items-center gap-1.5">
                {testResult.success ? (
                  <CheckCircle2 size={11} style={{ color: '#22C55E' }} />
                ) : (
                  <XCircle size={11} style={{ color: '#F43F5E' }} />
                )}
                <span style={{ color: testResult.success ? '#22C55E' : '#F43F5E' }}>
                  {testResult.success ? `نجح (${testResult.duration}ms)` : `فشل: ${testResult.error?.slice(0, 50) || 'خطأ'}`}
                </span>
              </div>
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {/* Test button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px] gap-1"
                      style={{ color }}
                      disabled={isTestingThis || !provider.available}
                      onClick={() => handleTest(provider.name)}
                    >
                      {isTestingThis ? <Loader2 size={11} className="animate-spin" /> : <TestTube2 size={11} />}
                      اختبار
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>اختبار المزود مباشرة</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Settings button */}
              <Dialog open={settingsDialogProvider === provider.name} onOpenChange={(open) => !open && setSettingsDialogProvider(null)}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[10px] gap-1"
                    style={{ color: 'var(--text3)' }}
                    onClick={() => setSettingsDialogProvider(provider.name)}
                  >
                    <Settings2 size={11} />
                    إعدادات
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', direction: 'rtl' }}>
                  <DialogHeader>
                    <DialogTitle className="text-right" style={{ color: 'var(--text)' }}>
                      إعدادات {PROVIDER_NAMES_AR[provider.name] || provider.name}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-3">
                    <div className="space-y-2">
                      <p className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>النموذج الحالي</p>
                      <code className="text-[11px] block px-3 py-2 rounded-lg" style={{ background: 'var(--bg)', color: 'var(--cyan)', border: '1px solid var(--border)' }}>
                        {provider.model}
                      </code>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>الحالة</p>
                      <div className="flex items-center gap-2">
                        <StatusBadge available={provider.available} disabled={!isEnabled} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>يُستخدم في الأنابيب</p>
                      <div className="flex flex-wrap gap-1.5">
                        {whereUsed.length > 0 ? whereUsed.map(label => (
                          <Badge key={label} className="text-[10px] px-2 py-0.5" style={{ background: 'rgba(0,229,255,0.08)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.12)' }}>
                            {label}
                          </Badge>
                        )) : (
                          <p className="text-[11px]" style={{ color: 'var(--text4)' }}>لا يُستخدم حالياً</p>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Toggle switch */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]" style={{ color: isEnabled ? '#22C55E' : 'var(--text4)' }}>
                {isEnabled ? 'مفعّل' : 'معطّل'}
              </span>
              {isSavingThis ? (
                <Loader2 size={14} className="animate-spin" style={{ color }} />
              ) : (
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleToggle(provider.name, checked)}
                  className="scale-75"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ─── Image provider card component ───────────────────────
  const ImageProviderCard = ({ provider }: { provider: ImageProviderInfo }) => {
    const color = PROVIDER_COLORS[provider.name] || '#888';
    const isEnabled = localToggles[provider.name] !== false;
    const isTestingThis = testingProvider === provider.name;
    const testResult = testResults[provider.name];

    return (
      <Card
        className="border-0 transition-all duration-200 hover:shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${color}06 0%, var(--bg2) 100%)`,
          border: `1px solid ${provider.available && isEnabled ? `${color}25` : 'var(--border)'}`,
        }}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}15`, border: `1px solid ${color}25` }}
              >
                <Camera size={16} style={{ color }} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>
                  {provider.label}
                </h3>
                <p className="text-[10px] truncate" style={{ color: 'var(--text3)' }}>
                  {provider.labelEn}
                </p>
              </div>
            </div>
            <StatusBadge available={provider.available} disabled={!isEnabled} />
          </div>

          <div className="flex items-center gap-1.5">
            <CircleDot size={10} style={{ color: 'var(--text4)' }} />
            <code className="text-[10px] truncate" style={{ color: 'var(--text2)' }}>
              {provider.model}
            </code>
          </div>

          <KeyBadge hasKey={provider.hasKey} prefix={provider.keyPrefix} />

          {testResult && (
            <div
              className="rounded-lg px-2.5 py-1.5 text-[10px]"
              style={{
                background: testResult.success ? 'rgba(34,197,94,0.08)' : 'rgba(244,63,94,0.08)',
                border: `1px solid ${testResult.success ? 'rgba(34,197,94,0.15)' : 'rgba(244,63,94,0.15)'}`,
              }}
            >
              <div className="flex items-center gap-1.5">
                {testResult.success ? <CheckCircle2 size={11} style={{ color: '#22C55E' }} /> : <XCircle size={11} style={{ color: '#F43F5E' }} />}
                <span style={{ color: testResult.success ? '#22C55E' : '#F43F5E' }}>
                  {testResult.success ? `نجح (${testResult.duration}ms)` : `فشل`}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] gap-1"
              style={{ color }}
              disabled={isTestingThis || !provider.available}
              onClick={() => handleTest(provider.name)}
            >
              {isTestingThis ? <Loader2 size={11} className="animate-spin" /> : <TestTube2 size={11} />}
              اختبار
            </Button>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px]" style={{ color: isEnabled ? '#22C55E' : 'var(--text4)' }}>
                {isEnabled ? 'مفعّل' : 'معطّل'}
              </span>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => handleToggle(provider.name, checked)}
                className="scale-75"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // ─── Render ──────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6" dir="rtl">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,229,255,0.10)', border: '1px solid rgba(0,229,255,0.20)' }}
          >
            <Cpu size={20} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold font-heading" style={{ color: 'var(--text)' }}>النماذج والتعيين</h1>
            <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
              إدارة مزودي الذكاء الاصطناعي وتعيين الأنابيب
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-[12px]"
          style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}
          onClick={fetchData}
        >
          <RefreshCw size={13} />
          تحديث
        </Button>
      </div>

      {/* ═══ Section A: Overview Stats Bar ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={Cpu} label="إجمالي المزودين" value={stats.total} color="var(--cyan)" />
        <StatCard icon={CheckCircle2} label="المتاحين" value={stats.available} color="#22C55E" sub={`${stats.total > 0 ? Math.round(stats.available / stats.total * 100) : 0}% من الإجمالي`} />
        <StatCard icon={Zap} label="النشطين" value={stats.active} color="#00E5FF" />
        <StatCard icon={XCircle} label="المعطّلين" value={stats.disabled} color="#F43F5E" />
        <StatCard icon={AlertTriangle} label="قواطع الدائرة" value={Object.values(circuitBreakers).filter(cb => cb.open).length} color="#FB923C" />
      </div>

      {/* ═══ Circuit Breaker Alerts ═══ */}
      {Object.entries(circuitBreakers).some(([, cb]) => cb.open) && (
        <div className="space-y-2">
          {Object.entries(circuitBreakers).map(([name, cb]) => cb.open && (
            <div
              key={name}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px]"
              style={{
                background: 'rgba(244,63,94,0.06)',
                border: '1px solid rgba(244,63,94,0.15)',
                color: '#F43F5E',
              }}
            >
              <AlertTriangle size={14} />
              <span className="font-semibold">قاطع الدائرة — {PROVIDER_NAMES_AR[name] || name}:</span>
              <span>{cb.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Main Tabs ═══ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList
          className="w-full h-auto flex-wrap gap-1 bg-transparent p-0 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <TabsTrigger
            value="providers"
            className="text-[12px] px-4 py-2 rounded-t-lg data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            style={{
              color: activeTab === 'providers' ? 'var(--cyan)' : 'var(--text3)',
              borderBottom: activeTab === 'providers' ? '2px solid var(--cyan)' : '2px solid transparent',
              background: activeTab === 'providers' ? 'var(--cyan2)' : 'transparent',
            }}
          >
            <Cpu size={14} className="ml-1.5" />
            مزودي النصوص
          </TabsTrigger>
          <TabsTrigger
            value="image-providers"
            className="text-[12px] px-4 py-2 rounded-t-lg data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            style={{
              color: activeTab === 'image-providers' ? '#A78BFA' : 'var(--text3)',
              borderBottom: activeTab === 'image-providers' ? '2px solid #8B5CF6' : '2px solid transparent',
              background: activeTab === 'image-providers' ? 'rgba(139,92,246,0.08)' : 'transparent',
            }}
          >
            <Camera size={14} className="ml-1.5" />
            مزودي الصور
          </TabsTrigger>
          <TabsTrigger
            value="pipelines"
            className="text-[12px] px-4 py-2 rounded-t-lg data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            style={{
              color: activeTab === 'pipelines' ? '#22C55E' : 'var(--text3)',
              borderBottom: activeTab === 'pipelines' ? '2px solid #22C55E' : '2px solid transparent',
              background: activeTab === 'pipelines' ? 'rgba(34,197,94,0.08)' : 'transparent',
            }}
          >
            <Globe size={14} className="ml-1.5" />
            تعيين الأنابيب
          </TabsTrigger>
          <TabsTrigger
            value="keys"
            className="text-[12px] px-4 py-2 rounded-t-lg data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            style={{
              color: activeTab === 'keys' ? '#FB923C' : 'var(--text3)',
              borderBottom: activeTab === 'keys' ? '2px solid #FB923C' : '2px solid transparent',
              background: activeTab === 'keys' ? 'rgba(251,146,60,0.08)' : 'transparent',
            }}
          >
            <Key size={14} className="ml-1.5" />
            مفاتيح API
          </TabsTrigger>
        </TabsList>

        {/* ═══ Section B: Provider Cards Grid ═══ */}
        <TabsContent value="providers" className="mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedProviders.map(provider => (
              <ProviderCard key={provider.name} provider={provider} />
            ))}
          </div>
        </TabsContent>

        {/* ═══ Section D: Image Generation Providers ═══ */}
        <TabsContent value="image-providers" className="mt-5 space-y-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} style={{ color: '#A78BFA' }} />
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>مزودي توليد الصور</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {imageProviders.map(provider => (
              <ImageProviderCard key={provider.name} provider={provider} />
            ))}
          </div>
        </TabsContent>

        {/* ═══ Section C: Pipeline Assignment Matrix ═══ */}
        <TabsContent value="pipelines" className="mt-5 space-y-6">
          {Object.entries(LOCALE_CONFIG).map(([locale, localeInfo]) => {
            const localePipelines = pipelineMappings.filter(m => m.locale === locale);
            if (localePipelines.length === 0) return null;

            return (
              <div key={locale} className="space-y-3">
                {/* Locale header */}
                <div className="flex items-center gap-2.5">
                  <span className="text-[18px]">{localeInfo.flag}</span>
                  <h3 className="text-[14px] font-bold" style={{ color: localeInfo.color }}>
                    {localeInfo.label}
                  </h3>
                  <Separator className="flex-1" style={{ background: `${localeInfo.color}20` }} />
                  <Badge
                    className="text-[9px] px-2"
                    style={{
                      background: `${localeInfo.color}12`,
                      color: localeInfo.color,
                      border: `1px solid ${localeInfo.color}25`,
                    }}
                  >
                    {localePipelines.length} أنابيب
                  </Badge>
                </div>

                {/* Pipeline rows */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${localeInfo.color}15`, background: `${localeInfo.color}04` }}
                >
                  {localePipelines.map((mapping, idx) => {
                    const typeConfig = PIPELINE_TYPE_CONFIG[mapping.type] || PIPELINE_TYPE_CONFIG.news;
                    const TypeIcon = typeConfig.icon;
                    const currentValue = localMappings[mapping.key] || mapping.currentProvider;
                    const isSavingThis = saving === mapping.key;
                    const currentColor = PROVIDER_COLORS[currentValue] || '#888';

                    return (
                      <div
                        key={mapping.key}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                        style={{
                          borderBottom: idx < localePipelines.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        {/* Type icon */}
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ background: `${localeInfo.color}12`, border: `1px solid ${localeInfo.color}20` }}
                        >
                          <TypeIcon size={14} style={{ color: localeInfo.color }} />
                        </div>

                        {/* Pipeline label */}
                        <div className="min-w-0 w-36 flex-shrink-0">
                          <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                            {mapping.label}
                          </p>
                          <p className="text-[9px] truncate" style={{ color: 'var(--text4)' }}>
                            {mapping.labelEn}
                          </p>
                        </div>

                        {/* Arrow */}
                        <ArrowUpDown size={12} style={{ color: 'var(--text4)' }} className="flex-shrink-0 rotate-90" />

                        {/* Provider selector */}
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <Select
                            value={currentValue}
                            onValueChange={(val) => handleMappingChange(mapping.key, val)}
                            disabled={isSavingThis}
                          >
                            <SelectTrigger
                              className="h-8 text-[11px] border-0"
                              style={{
                                background: `${currentColor}08`,
                                border: `1px solid ${currentColor}20`,
                                color: 'var(--text)',
                              }}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                              style={{ background: 'var(--bg2)', border: '1px solid var(--border)', direction: 'rtl' }}
                            >
                              {providers
                                .filter(p => p.available && !p.disabled)
                                .map(p => (
                                  <SelectItem
                                    key={p.name}
                                    value={p.name}
                                    style={{ color: 'var(--text)' }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: PROVIDER_COLORS[p.name] || '#888' }}
                                      />
                                      <span>{PROVIDER_NAMES_AR[p.name] || p.name}</span>
                                      <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                                        ({p.model?.slice(0, 25)})
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>

                          {isSavingThis && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--cyan)' }} />}
                        </div>

                        {/* Custom badge */}
                        {mapping.isCustom && (
                          <Badge
                            className="text-[8px] px-1.5 py-0 h-4"
                            style={{ background: 'rgba(251,146,60,0.10)', color: '#FB923C', border: '1px solid rgba(251,146,60,0.20)' }}
                          >
                            مخصص
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* ═══ Section E: API Keys Overview ═══ */}
        <TabsContent value="keys" className="mt-5">
          <div className="flex items-center gap-2 mb-4">
            <Key size={16} style={{ color: '#FB923C' }} />
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>مفاتيح API</h2>
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)', background: 'var(--bg2)' }}
          >
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: 'var(--border)' }}>
                  <TableHead className="text-[11px] font-semibold" style={{ color: 'var(--text3)' }}>مفتاح البيئة</TableHead>
                  <TableHead className="text-[11px] font-semibold" style={{ color: 'var(--text3)' }}>الحالة</TableHead>
                  <TableHead className="text-[11px] font-semibold" style={{ color: 'var(--text3)' }}>البادئة</TableHead>
                  <TableHead className="text-[11px] font-semibold" style={{ color: 'var(--text3)' }}>المزودون</TableHead>
                  <TableHead className="text-[11px] font-semibold" style={{ color: 'var(--text3)' }}>يُستخدم في</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map(keyInfo => (
                  <TableRow key={keyInfo.name} style={{ borderColor: 'var(--border)' }}>
                    <TableCell>
                      <code className="text-[11px] font-mono" style={{ color: 'var(--text)' }}>
                        {keyInfo.name}
                      </code>
                    </TableCell>
                    <TableCell>
                      {keyInfo.exists ? (
                        <Badge
                          className="text-[9px] px-2 py-0.5"
                          style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}
                        >
                          <CheckCircle2 size={9} className="ml-1" /> موجود
                        </Badge>
                      ) : (
                        <Badge
                          className="text-[9px] px-2 py-0.5"
                          style={{ background: 'rgba(244,63,94,0.12)', color: '#F43F5E', border: '1px solid rgba(244,63,94,0.2)' }}
                        >
                          <XCircle size={9} className="ml-1" /> غير موجود
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {keyInfo.keyPrefix ? (
                        <code className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg)', color: 'var(--text3)' }}>
                          {keyInfo.keyPrefix}
                        </code>
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--text4)' }}>—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {keyInfo.providers.map(p => (
                          <Badge
                            key={p}
                            className="text-[8px] px-1.5 py-0 h-4"
                            style={{
                              background: `${PROVIDER_COLORS[p] || '#888'}12`,
                              color: PROVIDER_COLORS[p] || '#888',
                              border: `1px solid ${PROVIDER_COLORS[p] || '#888'}25`,
                            }}
                          >
                            {PROVIDER_NAMES_AR[p] || p}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {keyInfo.usedInPipelines.length > 0 ? keyInfo.usedInPipelines.map(label => (
                          <Badge
                            key={label}
                            className="text-[8px] px-1.5 py-0 h-4"
                            style={{ background: 'rgba(0,229,255,0.06)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.10)' }}
                          >
                            {label}
                          </Badge>
                        )) : (
                          <span className="text-[10px]" style={{ color: 'var(--text4)' }}>—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
