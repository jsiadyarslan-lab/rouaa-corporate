// ─── AI Keys Management Dashboard (V400) ──────────────────
// Complete API key management: view all keys, add/remove keys,
// enable/disable providers, change assignments, test keys
// Full RTL Arabic interface with dark theme

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Key, Plus, Trash2, Play, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, Loader2, Brain, Image, Volume2, DollarSign,
  Newspaper, HardDrive, MessageSquare, Shield, Eye, EyeOff,
  ChevronDown, ChevronUp, Settings2, Zap, Clock, Server,
  Activity, ToggleLeft, ToggleRight, Copy, ExternalLink,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────
interface ProviderKey {
  index: number;
  envVar: string;
  value: string;
  masked: string;
  isNumbered: boolean;
}

interface RateLimitInfo {
  rpm: number;
  dailyLimit?: number;
  tier: string;
}

interface CategoryInfoType {
  key: string;
  label: string;
  labelEn: string;
  icon: string;
  color: string;
}

interface ProviderInfo {
  name: string;
  category: string;
  categoryInfo: CategoryInfoType;
  descriptionAr: string;
  descriptionEn: string;
  available: boolean;
  disabled: boolean;
  model: string;
  baseUrl: string;
  keys: ProviderKey[];
  keyCount: number;
  hasMultiKeySupport: boolean;
  maxNumberedKeys: number;
  numberedPattern: string;
  rateLimit: RateLimitInfo;
  pipelineAssignments: string[];
  pipelineTypes: string[];
  needsKeyForLocal: boolean;
  specialNote?: string;
}

interface CategoryGroup {
  key: string;
  label: string;
  labelEn: string;
  icon: string;
  color: string;
  providers: ProviderInfo[];
}

interface KeysData {
  stats: {
    totalProviders: number;
    providersWithKeys: number;
    activeProviders: number;
    totalKeys: number;
    multiKeyProviders: number;
  };
  categories: CategoryGroup[];
  allProviders: ProviderInfo[];
}

// ─── Provider display names ───────────────────────────────
const PROVIDER_NAMES_AR: Record<string, string> = {
  groq: 'جروك (Groq)',
  grok: 'جروك xAI (Grok)',
  bedrock: 'أمازون بيروك (Bedrock)',
  gemini: 'جوجل جيميني (Gemini)',
  deepseek: 'ديب سيك (DeepSeek)',
  openrouter: 'أوبن راوتر (OpenRouter)',
  cerebras: 'سيريبيراس (Cerebras)',
  mistral: 'ميسترال (Mistral)',
  nvidia: 'إنفيديا (NVIDIA)',
  glm: 'ChatGLM',
  sambanova: 'سامبانوفا (SambaNova)',
  cohere: 'كوهير (Cohere)',
  siliconflow: 'سيليكون فلو (SiliconFlow)',
  deepinfra: 'ديب إنفرا (DeepInfra)',
  zukijourney: 'زوكي جورني (ZukiJourney)',
  nagaai: 'ناجا AI (NagaAI)',
  ollama: 'أولاما (Ollama)',
  hf: 'هجينج فيس (HuggingFace)',
  cloudflare: 'كلاودفلير (Cloudflare)',
  together: 'توغذر AI (Together)',
  prodia: 'بروديا (Prodia)',
  stablehorde: 'ستيبل هورد (Stable Horde)',
  finnhub: 'فينهب (Finnhub)',
  fmp: 'FMP',
  alphavantage: 'ألفا فانتاج (Alpha Vantage)',
  fred: 'FRED',
  exchangerate: 'Exchange Rate API',
  newsapi: 'NewsAPI',
  currentsapi: 'Currents API',
  acled: 'ACLED',
  r2: 'Cloudflare R2',
  telegram: 'تيليجرام بوت',
};

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  text: <Brain className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  tts: <Volume2 className="h-4 w-4" />,
  financial: <DollarSign className="h-4 w-4" />,
  news: <Newspaper className="h-4 w-4" />,
  storage: <HardDrive className="h-4 w-4" />,
  messaging: <MessageSquare className="h-4 w-4" />,
  auth: <Shield className="h-4 w-4" />,
};

// ─── Main Component ──────────────────────────────────────
export default function KeysManagementPage() {
  const [data, setData] = useState<KeysData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; duration?: number; error?: string }>>({});
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());
  const [addKeyProvider, setAddKeyProvider] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showFullKey, setShowFullKey] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('all');
  const [togglingProvider, setTogglingProvider] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/keys');
      if (!res.ok) throw new Error('فشل في تحميل البيانات');
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast.error('فشل في تحميل بيانات المفاتيح');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Toggle provider enabled/disabled
  const handleToggle = async (provider: string, currentDisabled: boolean) => {
    setTogglingProvider(provider);
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          provider,
          value: currentDisabled ? 'false' : 'true',
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(currentDisabled ? `تم تفعيل ${PROVIDER_NAMES_AR[provider] || provider}` : `تم تعطيل ${PROVIDER_NAMES_AR[provider] || provider}`);
        fetchData();
      } else {
        toast.error(json.message || 'فشل في تحديث الحالة');
      }
    } catch {
      toast.error('فشل في تحديث الحالة');
    } finally {
      setTogglingProvider(null);
    }
  };

  // Test provider
  const handleTest = async (provider: string) => {
    setTestingProvider(provider);
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', provider }),
      });
      const json = await res.json();
      setTestResult(prev => ({
        ...prev,
        [provider]: {
          success: json.success,
          duration: json.duration,
          error: json.error,
        },
      }));
      if (json.success) {
        toast.success(`${PROVIDER_NAMES_AR[provider] || provider} يعمل! (${json.duration}ms)`);
      } else {
        toast.error(`${PROVIDER_NAMES_AR[provider] || provider} لا يعمل: ${json.error || 'خطأ غير معروف'}`);
      }
    } catch {
      toast.error('فشل في اختبار المزود');
      setTestResult(prev => ({ ...prev, [provider]: { success: false, error: 'فشل الاتصال' } }));
    } finally {
      setTestingProvider(null);
    }
  };

  // Add key
  const handleAddKey = async () => {
    if (!addKeyProvider || !newKeyValue.trim()) return;
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_key',
          provider: addKeyProvider,
          value: newKeyValue.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        setAddKeyProvider(null);
        setNewKeyValue('');
        fetchData();
      } else {
        toast.error(json.message || 'فشل في إضافة المفتاح');
      }
    } catch {
      toast.error('فشل في إضافة المفتاح');
    }
  };

  // Remove key
  const handleRemoveKey = async (provider: string, envVar: string) => {
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_key',
          provider,
          envVar,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        fetchData();
      } else {
        toast.error(json.message || 'فشل في حذف المفتاح');
      }
    } catch {
      toast.error('فشل في حذف المفتاح');
    }
  };

  // Toggle expand
  const toggleExpand = (name: string) => {
    setExpandedProviders(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ');
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-400" />
          <p className="text-gray-400">جاري تحميل بيانات المفاتيح...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-8 w-8 mx-auto text-yellow-400" />
          <p className="text-gray-400">فشل في تحميل البيانات</p>
          <Button onClick={fetchData} variant="outline">إعادة المحاولة</Button>
        </div>
      </div>
    );
  }

  const { stats, categories, allProviders } = data;

  // Filter by active tab
  const filteredCategories = activeTab === 'all'
    ? categories
    : categories.filter(c => c.key === activeTab);

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Key className="h-6 w-6 text-cyan-400" />
            إدارة المفاتيح والنماذج
          </h1>
          <p className="text-gray-400 text-sm mt-1">تحكم كامل بمفاتيح API والنماذج الذكية</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.totalProviders}</div>
            <div className="text-xs text-gray-400">إجمالي المزودين</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.providersWithKeys}</div>
            <div className="text-xs text-gray-400">لديهم مفاتيح</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{stats.activeProviders}</div>
            <div className="text-xs text-gray-400">مفعلين</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.totalKeys}</div>
            <div className="text-xs text-gray-400">إجمالي المفاتيح</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.multiKeyProviders}</div>
            <div className="text-xs text-gray-400">مفاتيح متعددة</div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Category Tabs ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-900/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="text-xs">الكل</TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat.key} value={cat.key} className="text-xs">
              <span className="ml-1">{CATEGORY_ICONS[cat.key]}</span>
              {cat.label}
              <Badge variant="secondary" className="mr-1 text-[10px] px-1">{cat.providers.length}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredCategories.map(category => (
            <div key={category.key} className="mb-8">
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: category.color + '20' }}>
                  <span style={{ color: category.color }}>{CATEGORY_ICONS[category.key]}</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{category.label}</h2>
                  <p className="text-xs text-gray-500">{category.labelEn}</p>
                </div>
                <Badge variant="outline" className="mr-2" style={{ borderColor: category.color, color: category.color }}>
                  {category.providers.length} مزود
                </Badge>
              </div>

              {/* Providers Table */}
              <div className="rounded-lg border border-gray-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-900/80 hover:bg-gray-900/80">
                      <TableHead className="text-gray-300 text-right">المزود</TableHead>
                      <TableHead className="text-gray-300 text-right">الحالة</TableHead>
                      <TableHead className="text-gray-300 text-right">المفاتيح</TableHead>
                      <TableHead className="text-gray-300 text-right">النموذج</TableHead>
                      <TableHead className="text-gray-300 text-right">الحد الأقصى</TableHead>
                      <TableHead className="text-gray-300 text-right">يُستخدم في</TableHead>
                      <TableHead className="text-gray-300 text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.providers.map(provider => {
                      const isExpanded = expandedProviders.has(provider.name);
                      const testRes = testResult[provider.name];
                      const isToggling = togglingProvider === provider.name;

                      return (
                        <>
                          <TableRow
                            key={provider.name}
                            className={`border-gray-800 hover:bg-gray-900/30 ${provider.disabled ? 'opacity-60' : ''}`}
                          >
                            {/* Provider Name */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleExpand(provider.name)}
                                >
                                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </Button>
                                <div>
                                  <div className="font-medium text-white text-sm">
                                    {PROVIDER_NAMES_AR[provider.name] || provider.name}
                                  </div>
                                  <div className="text-[10px] text-gray-500">{provider.descriptionAr}</div>
                                  {provider.specialNote && (
                                    <div className="text-[10px] text-amber-400 mt-0.5">⚠️ {provider.specialNote}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {provider.available && !provider.disabled ? (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                                    <CheckCircle2 className="h-3 w-3 ml-1" />
                                    يعمل
                                  </Badge>
                                ) : provider.disabled ? (
                                  <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-[10px]">
                                    <XCircle className="h-3 w-3 ml-1" />
                                    معطل
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                                    <XCircle className="h-3 w-3 ml-1" />
                                    لا يعمل
                                  </Badge>
                                )}
                                {testRes && (
                                  <Badge className={`text-[9px] ${testRes.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                    {testRes.success ? `${testRes.duration}ms` : 'فشل'}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            {/* Keys */}
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Key className="h-3 w-3 text-amber-400" />
                                <span className="text-sm text-white">{provider.keyCount}</span>
                                {provider.keyCount > 1 && (
                                  <Badge className="bg-purple-500/20 text-purple-300 text-[9px] px-1">
                                    تدوير
                                  </Badge>
                                )}
                                {provider.keyCount === 0 && (
                                  <Badge className="bg-red-500/20 text-red-300 text-[9px] px-1">
                                    بدون مفتاح
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            {/* Model */}
                            <TableCell>
                              <span className="text-xs text-gray-300 max-w-[120px] truncate block" title={provider.model}>
                                {provider.model}
                              </span>
                            </TableCell>

                            {/* Rate Limit */}
                            <TableCell>
                              <div className="text-xs">
                                <span className="text-cyan-300">{provider.rateLimit.rpm}</span>
                                <span className="text-gray-500">/د</span>
                                {provider.rateLimit.dailyLimit && (
                                  <div className="text-gray-500 text-[10px]">
                                    {provider.rateLimit.dailyLimit.toLocaleString()}/يوم
                                  </div>
                                )}
                                <Badge className={`text-[9px] px-1 mt-0.5 ${
                                  provider.rateLimit.tier === 'paid'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {provider.rateLimit.tier === 'paid' ? 'مدفوع' : 'مجاني'}
                                </Badge>
                              </div>
                            </TableCell>

                            {/* Pipeline Assignments */}
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {provider.pipelineAssignments.length > 0 ? (
                                  provider.pipelineAssignments.slice(0, 3).map((assign, idx) => (
                                    <Badge key={idx} variant="outline" className="text-[9px] px-1 py-0 border-cyan-500/30 text-cyan-300">
                                      {assign}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-gray-500">غير مُعيّن</span>
                                )}
                                {provider.pipelineAssignments.length > 3 && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                                    +{provider.pipelineAssignments.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            {/* Actions */}
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {/* Enable/Disable Toggle */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => handleToggle(provider.name, provider.disabled)}
                                        disabled={isToggling}
                                        className="p-1 rounded hover:bg-gray-700/50"
                                      >
                                        {isToggling ? (
                                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        ) : provider.disabled ? (
                                          <ToggleLeft className="h-4 w-4 text-red-400" />
                                        ) : (
                                          <ToggleRight className="h-4 w-4 text-green-400" />
                                        )}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>{provider.disabled ? 'تفعيل' : 'تعطيل'}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                {/* Test Button */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => handleTest(provider.name)}
                                        disabled={testingProvider === provider.name || !provider.available}
                                        className="p-1 rounded hover:bg-gray-700/50 disabled:opacity-30"
                                      >
                                        {testingProvider === provider.name ? (
                                          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                                        ) : (
                                          <Play className="h-4 w-4 text-cyan-400" />
                                        )}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>اختبار</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                {/* Add Key Button */}
                                {provider.hasMultiKeySupport && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => { setAddKeyProvider(provider.name); setNewKeyValue(''); }}
                                          className="p-1 rounded hover:bg-gray-700/50"
                                        >
                                          <Plus className="h-4 w-4 text-green-400" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>إضافة مفتاح</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* ─── Expanded Key Details ─── */}
                          {isExpanded && (
                            <TableRow key={`${provider.name}-detail`} className="bg-gray-950/50">
                              <TableCell colSpan={7} className="p-4">
                                <div className="space-y-3">
                                  {/* Keys List */}
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-1">
                                      <Key className="h-3 w-3 text-amber-400" />
                                      المفاتيح ({provider.keyCount})
                                    </h4>
                                    {provider.keys.length > 0 ? (
                                      <div className="space-y-1.5">
                                        {provider.keys.map((key, idx) => (
                                          <div key={idx} className="flex items-center gap-2 bg-gray-900/50 rounded px-3 py-1.5">
                                            <Badge variant="outline" className="text-[9px] px-1 min-w-[24px] justify-center">
                                              #{idx + 1}
                                            </Badge>
                                            <code className="text-xs text-gray-300 flex-1 font-mono">
                                              {showFullKey[`${provider.name}_${idx}`] ? key.value : key.masked}
                                            </code>
                                            <span className="text-[10px] text-gray-500">{key.envVar}</span>
                                            {key.isNumbered && (
                                              <Badge className="bg-purple-500/20 text-purple-300 text-[8px] px-1">مرقم</Badge>
                                            )}
                                            <button
                                              onClick={() => setShowFullKey(prev => ({
                                                ...prev,
                                                [`${provider.name}_${idx}`]: !prev[`${provider.name}_${idx}`]
                                              }))}
                                              className="p-1 hover:bg-gray-700/50 rounded"
                                            >
                                              {showFullKey[`${provider.name}_${idx}`] ? (
                                                <EyeOff className="h-3 w-3 text-gray-400" />
                                              ) : (
                                                <Eye className="h-3 w-3 text-gray-400" />
                                              )}
                                            </button>
                                            <button
                                              onClick={() => copyToClipboard(key.masked)}
                                              className="p-1 hover:bg-gray-700/50 rounded"
                                            >
                                              <Copy className="h-3 w-3 text-gray-400" />
                                            </button>
                                            {key.envVar.startsWith('provider_key_') && (
                                              <button
                                                onClick={() => handleRemoveKey(provider.name, key.envVar)}
                                                className="p-1 hover:bg-red-900/30 rounded"
                                              >
                                                <Trash2 className="h-3 w-3 text-red-400" />
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-3 text-gray-500 text-sm">
                                        <Key className="h-6 w-6 mx-auto mb-1 opacity-30" />
                                        لا يوجد مفتاح مُعد — أضف مفتاح من زمن +
                                        {provider.name === 'ollama' && (
                                          <p className="text-cyan-400 text-xs mt-1">
                                            أضف مفتاح OLLAMA_API_KEY من ollama.com لاستخدام الخدمة السحابية
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Pipeline Assignments Detail */}
                                  {provider.pipelineAssignments.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-1">
                                        <Activity className="h-3 w-3 text-cyan-400" />
                                        التعيينات ({provider.pipelineAssignments.length})
                                      </h4>
                                      <div className="flex flex-wrap gap-1">
                                        {provider.pipelineAssignments.map((assign, idx) => (
                                          <Badge key={idx} variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-300">
                                            {assign}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Extra Info */}
                                  <div className="flex gap-4 text-xs text-gray-500">
                                    {provider.baseUrl && (
                                      <div className="flex items-center gap-1">
                                        <Server className="h-3 w-3" />
                                        <span>URL: {provider.baseUrl.replace(/\/v1$/, '')}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <Zap className="h-3 w-3" />
                                      <span>{provider.rateLimit.rpm} طلب/دقيقة</span>
                                    </div>
                                    {provider.rateLimit.dailyLimit && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{provider.rateLimit.dailyLimit.toLocaleString()} طلب/يوم</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* ─── Ollama Special Section ─── */}
      {allProviders.find(p => p.name === 'ollama') && (
        <Card className="bg-cyan-500/5 border-cyan-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-cyan-300 text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              إعداد أولاما السحابي (Ollama Cloud)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-400 space-y-1">
            <p>• أنت تستخدم <span className="text-cyan-300 font-semibold">ollama.com السحابي</span> — مطلوب مفتاح API</p>
            <p>• المتغير المطلوب: <code className="text-cyan-300">OLLAMA_API_KEY</code> = مفتاحك من ollama.com</p>
            <p>• المتغير الاختياري: <code className="text-cyan-300">OLLAMA_MODEL</code> = النموذج (الافتراضي: gemma3:12b)</p>
            <p>• لا تحتاج لتعيين <code className="text-cyan-300">OLLAMA_BASE_URL</code> — النظام يوجه تلقائياً لـ ollama.com/v1</p>
            <p>• النماذج السحابية المتاحة: gemma3:12b, gemma3:4b, gemma3:27b, deepseek-v4-flash, glm-4.7, qwen3-coder:480b</p>
            <p>• الحد: 60 طلب/دقيقة — أعلى حد في النظام!</p>
            <p>• على Railway: يتم التحويل تلقائياً من localhost إلى ollama.com عند وجود المفتاح</p>
          </CardContent>
        </Card>
      )}

      {/* ─── Add Key Dialog ─── */}
      <Dialog open={!!addKeyProvider} onOpenChange={(open) => { if (!open) setAddKeyProvider(null); }}>
        <DialogContent className="bg-gray-900 border-gray-700" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-400" />
              إضافة مفتاح جديد — {addKeyProvider ? PROVIDER_NAMES_AR[addKeyProvider] || addKeyProvider : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm text-gray-300 block mb-1">مفتاح API الجديد</label>
              <Input
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
                placeholder="أدخل مفتاح API هنا..."
                className="bg-gray-800 border-gray-600 text-white font-mono"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">
                سيتم حفظ المفتاح في قاعدة البيانات وتحميله تلقائياً عند إعادة تشغيل الخادم
              </p>
            </div>
            {addKeyProvider && (
              <div className="bg-gray-800/50 rounded p-2 text-xs text-gray-400">
                <p>💡 يمكنك أيضاً إضافة مفتاح عبر متغير البيئة: <code className="text-cyan-300">{allProviders.find(p => p.name === addKeyProvider)?.numberedPattern}_{providerKeysCount(addKeyProvider) + 1}</code></p>
                <p className="mt-1">مثال: <code className="text-cyan-300">{allProviders.find(p => p.name === addKeyProvider)?.numberedPattern}_2=xai-xxxxx</code></p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">إلغاء</Button>
            </DialogClose>
            <Button
              onClick={handleAddKey}
              size="sm"
              disabled={!newKeyValue.trim() || newKeyValue.trim().length < 10}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 ml-1" />
              إضافة المفتاح
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Help Card ─── */}
      <Card className="bg-gray-900/30 border-gray-800">
        <CardContent className="p-4 text-xs text-gray-500 space-y-2">
          <h4 className="text-gray-300 font-semibold flex items-center gap-1">
            <Settings2 className="h-3 w-3" />
            كيفية إدارة المفاتيح
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <p className="text-cyan-400 font-medium">➕ إضافة مفتاح</p>
              <p>اضغط على زمن + بجانب المزود أو استخدم متغيرات البيئة المرقمة مثل <code className="text-cyan-300">GROQ_API_KEY_2</code></p>
            </div>
            <div>
              <p className="text-green-400 font-medium">🔄 التدوير التلقائي</p>
              <p>عند وجود أكثر من مفتاح، يتم التدوير بينهم تلقائياً (Round-Robin) لتوزيع الحمل</p>
            </div>
            <div>
              <p className="text-amber-400 font-medium">⚡ مفاتيح متعددة</p>
              <p>يمكنك إضافة مفاتيح متعددة عبر الفواصل: <code className="text-cyan-300">KEY1,KEY2,KEY3</code> أو متغيرات مرقمة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Helper: get current key count for a provider
  function providerKeysCount(providerName: string): number {
    return allProviders.find(p => p.name === providerName)?.keyCount || 0;
  }
}
