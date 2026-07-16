// ─── Dashboard Settings Page ────────────────────────────────
// Comprehensive settings with editable forms for all sections
// Now persists settings via /api/admin/settings API

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Settings, Cpu, Globe, Database, Key, Clock,
  Shield, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Server, Trash2, Save, Bot,
  Newspaper, Languages, Brain, Zap, Loader2,
  HardDrive, Webhook, FileText,
} from 'lucide-react';

interface AIProviderStatus {
  name: string;
  available: boolean;
  model?: string;
}

interface SystemStatus {
  aiProviders: AIProviderStatus[];
  dbStatus: 'connected' | 'disconnected' | 'unknown';
  dbWarning: string | null;
  cronSchedule: string;
  lastPipelineRun: string | null;
  totalArticles: number;
  totalNews: number;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'رؤى',
    siteDescription: 'منصة الأخبار المالية العربية',
  });

  const [newsSettings, setNewsSettings] = useState({
    defaultCategory: 'اقتصاد كلي',
    autoTranslate: true,
    cronInterval: '30',
    fetchInterval: '3',
    maxItemsPerRun: '15',
    minImpactLevel: '4',
  });

  const [aiSettings, setAiSettings] = useState({
    translationProvider: 'auto',
    analysisProvider: 'auto',
    rateLimit: '60',
    maxRetries: '3',
    enableFallback: true,
  });

  const [cacheSettings, setCacheSettings] = useState({
    cacheDuration: '300',
    maxAge: '3600',
    enableWarmup: true,
    warmupInterval: '60',
  });

  // V314: English pipeline limits settings
  const [pipelineSettings, setPipelineSettings] = useState({
    maxDailyEnNews: '800',
    maxHourlyEnNews: '120',
    maxDailyFrNews: '300',
    maxHourlyFrNews: '75',
    maxDailyTrNews: '1500',
    maxHourlyTrNews: '100',
    maxDailyEsNews: '300',
    maxHourlyEsNews: '50',
  });

  // V381: Stock analysis pipeline settings
  const [stockPipelineSettings, setStockPipelineSettings] = useState({
    maxDailyStockPerLocale: '200',
    maxHourlyStockPerLocale: '40',
    maxStockAiCallsPerDay: '300',
    maxStockCronRunsPerDay: '7',
    maxStocksPerCronRun: '9',
  });

  const CATEGORIES = ['اقتصاد كلي', 'أسهم', 'عملات', 'سلع', 'طاقة', 'كريبتو', 'بنوك مركزية', 'أسواق عربية', 'أرباح شركات', 'اقتصاد أمريكي'];

  // Load persisted settings on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [aiRes, pipelineRes, newsRes, settingsRes] = await Promise.all([
          fetch('/api/ai/status').catch(err => { console.warn('[Settings V156] Fetch failed:', err instanceof Error ? err.message : err); return null; }),
          fetch('/api/news/pipeline').catch(err => { console.warn('[Settings V156] Fetch failed:', err instanceof Error ? err.message : err); return null; }),
          fetch('/api/news/manage?limit=1').catch(err => { console.warn('[Settings V156] Fetch failed:', err instanceof Error ? err.message : err); return null; }),
          fetch('/api/admin/settings').catch(err => { console.warn('[Settings V156] Fetch failed:', err instanceof Error ? err.message : err); return null; }),
        ]);

        const aiData = aiRes ? await aiRes.json().catch(() => ({})) : {};
        const pipelineData = pipelineRes ? await pipelineRes.json().catch(() => ({})) : {};
        const newsData = newsRes ? await newsRes.json().catch(() => ({})) : {};
        const settingsData = settingsRes ? await settingsRes.json().catch(() => ({ settings: {} })) : { settings: {} };

        // Apply persisted settings
        const s = settingsData.settings || {};
        if (s.general) {
          setGeneralSettings(prev => ({
            ...prev,
            siteName: s.general.general_siteName || prev.siteName,
            siteDescription: s.general.general_siteDescription || prev.siteDescription,
          }));
        }
        if (s.news) {
          setNewsSettings(prev => ({
            ...prev,
            defaultCategory: s.news.news_defaultCategory || prev.defaultCategory,
            autoTranslate: s.news.news_autoTranslate !== 'false',
            cronInterval: s.news.news_cronInterval || prev.cronInterval,
            fetchInterval: s.news.news_fetchInterval || prev.fetchInterval,
            maxItemsPerRun: s.news.news_maxItemsPerRun || prev.maxItemsPerRun,
            minImpactLevel: s.news.news_minImpactLevel || prev.minImpactLevel,
          }));
        }
        if (s.ai) {
          setAiSettings(prev => ({
            ...prev,
            translationProvider: s.ai.ai_translationProvider || prev.translationProvider,
            analysisProvider: s.ai.ai_analysisProvider || prev.analysisProvider,
            rateLimit: s.ai.ai_rateLimit || prev.rateLimit,
            maxRetries: s.ai.ai_maxRetries || prev.maxRetries,
            enableFallback: s.ai.ai_enableFallback !== 'false',
          }));
        }
        if (s.cache) {
          setCacheSettings(prev => ({
            ...prev,
            cacheDuration: s.cache.cache_cacheDuration || prev.cacheDuration,
            maxAge: s.cache.cache_maxAge || prev.maxAge,
            enableWarmup: s.cache.cache_enableWarmup !== 'false',
            warmupInterval: s.cache.cache_warmupInterval || prev.warmupInterval,
          }));
        }
        // V314: Load pipeline limits from DB
        if (s.pipeline) {
          setPipelineSettings(prev => ({
            ...prev,
            maxDailyEnNews: s.pipeline.pipeline_maxDailyEnNews || prev.maxDailyEnNews,
            maxHourlyEnNews: s.pipeline.pipeline_maxHourlyEnNews || prev.maxHourlyEnNews,
            maxDailyFrNews: s.pipeline.pipeline_maxDailyFrNews || prev.maxDailyFrNews,
            maxHourlyFrNews: s.pipeline.pipeline_maxHourlyFrNews || prev.maxHourlyFrNews,
            maxDailyTrNews: s.pipeline.pipeline_maxDailyTrNews || prev.maxDailyTrNews,
            maxHourlyTrNews: s.pipeline.pipeline_maxHourlyTrNews || prev.maxHourlyTrNews,
            maxDailyEsNews: s.pipeline.pipeline_maxDailyEsNews || prev.maxDailyEsNews,
            maxHourlyEsNews: s.pipeline.pipeline_maxHourlyEsNews || prev.maxHourlyEsNews,
          }));
        }
        // V381: Load stock analysis pipeline settings from DB
        if (s.stock) {
          setStockPipelineSettings(prev => ({
            ...prev,
            maxDailyStockPerLocale: s.stock.stock_maxDailyStockPerLocale || prev.maxDailyStockPerLocale,
            maxHourlyStockPerLocale: s.stock.stock_maxHourlyStockPerLocale || prev.maxHourlyStockPerLocale,
            maxStockAiCallsPerDay: s.stock.stock_maxStockAiCallsPerDay || prev.maxStockAiCallsPerDay,
            maxStockCronRunsPerDay: s.stock.stock_maxStockCronRunsPerDay || prev.maxStockCronRunsPerDay,
            maxStocksPerCronRun: s.stock.stock_maxStocksPerCronRun || prev.maxStocksPerCronRun,
          }));
        }

        const providers: AIProviderStatus[] = [
          { name: 'Gemini', available: Boolean(aiData.providers?.gemini), model: 'gemini-2.5-flash' },
          { name: 'Groq', available: Boolean(aiData.providers?.groq), model: 'llama-3.3-70b' },
          { name: 'Cerebras', available: Boolean(aiData.providers?.cerebras), model: 'llama-3.3-70b' },
          { name: 'Mistral', available: Boolean(aiData.providers?.mistral), model: 'mistral-small-latest' },
          { name: 'DeepSeek', available: Boolean(aiData.providers?.deepseek), model: 'deepseek-chat' },
          { name: 'GLM (ZhipuAI)', available: Boolean(aiData.providers?.glm), model: 'glm-4-plus' },
          { name: 'NVIDIA', available: Boolean(aiData.providers?.nvidia), model: 'llama-3.1-8b' },
          { name: 'HuggingFace', available: Boolean(aiData.providers?.huggingface || aiData.providers?.hf), model: 'Llama-3.1-8B' },
          { name: 'Amazon Bedrock', available: Boolean(aiData.providers?.bedrock), model: 'claude-4.5-haiku' },
          { name: 'z-ai-sdk', available: Boolean(aiData.providers?.['z-ai-sdk']), model: 'z-ai' },
          { name: 'Ollama', available: Boolean(aiData.providers?.ollama), model: 'local' },
        ];

        setStatus({
          aiProviders: providers,
          dbStatus: pipelineData?.dbWarning ? 'disconnected' : 'connected',
          dbWarning: pipelineData?.dbWarning || null,
          cronSchedule: 'كل 30 دقيقة (عبر CRON_SECRET)',
          lastPipelineRun: pipelineData?.recentRuns?.[0]?.startedAt ? String(pipelineData.recentRuns[0].startedAt) : null,
          totalArticles: Number(pipelineData?.articles?.total || 0),
          totalNews: Number(newsData?.total || 0),
        });
      } catch {
        setStatus({
          aiProviders: [], dbStatus: 'unknown', dbWarning: 'لا يمكن الاتصال بالخادم',
          cronSchedule: '-', lastPipelineRun: null, totalArticles: 0, totalNews: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleSave = useCallback(async (section: string, group: string, settings: Record<string, string>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group, settings }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`تم حفظ إعدادات ${section} بنجاح`);
      } else {
        toast.error(data.error || 'فشل حفظ الإعدادات');
      }
    } catch {
      toast.error('فشل حفظ الإعدادات — تحقق من الاتصال');
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDangerAction = async (action: string) => {
    if (action === 'clearCache') {
      try {
        const res = await fetch('/api/news/warmup');
        if (res.ok) {
          toast.success('تم مسح الكاش وإعادة تحميله');
        } else {
          toast.error('فشل مسح الكاش');
        }
      } catch {
        toast.error('فشل مسح الكاش');
      }
    } else if (action === 'fetchNews') {
      try {
        // V47: Use admin pipeline API to trigger news fetch
        const res = await fetch('/api/admin/pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' }),
        });
        if (res.ok) {
          toast.success('تم تشغيل جلب الأخبار');
        } else {
          toast.error('فشل جلب الأخبار');
        }
      } catch {
        toast.error('فشل جلب الأخبار');
      }
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}</div>;
  }

  const s = status!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold font-heading" style={{ color: 'var(--text)' }}>الإعدادات</h1>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>إعدادات النظام والمزودين والتكوين</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-[var(--bg4)] flex-wrap">
          <TabsTrigger value="general" className="text-[12px] data-[state=active]:bg-[var(--cyan2)] data-[state=active]:text-[var(--cyan)]">عام</TabsTrigger>
          <TabsTrigger value="news" className="text-[12px] data-[state=active]:bg-[var(--cyan2)] data-[state=active]:text-[var(--cyan)]">الأخبار</TabsTrigger>
          <TabsTrigger value="pipeline" className="text-[12px] data-[state=active]:bg-[rgba(0,200,150,0.12)] data-[state=active]:text-[var(--bull)]">
            <Globe size={13} className="ml-1.5" />خط الإنتاج
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-[12px] data-[state=active]:bg-[var(--cyan2)] data-[state=active]:text-[var(--cyan)]">الذكاء الاصطناعي</TabsTrigger>
          <TabsTrigger value="system" className="text-[12px] data-[state=active]:bg-[var(--cyan2)] data-[state=active]:text-[var(--cyan)]">النظام</TabsTrigger>
          <TabsTrigger value="danger" className="text-[12px] data-[state=active]:bg-[rgba(255,77,106,0.12)] data-[state=active]:text-[var(--bear)]">منطقة الخطر</TabsTrigger>
          <TabsTrigger value="telegram" className="text-[12px] data-[state=active]:bg-[rgba(0,136,255,0.12)] data-[state=active]:text-[#0088FF]">
            <Bot size={13} className="ml-1.5" />تيليجرام
          </TabsTrigger>
        </TabsList>

        {/* ═══ General Settings ═══ */}
        <TabsContent value="general" className="space-y-4">
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--cyan2)' }}>
                  <Settings size={16} style={{ color: 'var(--cyan)' }} />
                </div>
                إعدادات عامة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>اسم الموقع</Label>
                <Input
                  value={generalSettings.siteName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                  className="text-[13px] h-9"
                  style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>وصف الموقع</Label>
                <Input
                  value={generalSettings.siteDescription}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                  className="text-[13px] h-9"
                  style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
              <Button onClick={() => handleSave('العامة', 'general', { siteName: generalSettings.siteName, siteDescription: generalSettings.siteDescription })} disabled={saving} className="text-[12px] gap-1.5"
                style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: 'white' }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                حفظ الإعدادات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ News Settings ═══ */}
        <TabsContent value="news" className="space-y-4">
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,200,150,0.1)' }}>
                  <Newspaper size={16} style={{ color: 'var(--bull)' }} />
                </div>
                إعدادات الأخبار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الفئة الافتراضية</Label>
                  <Select value={newsSettings.defaultCategory} onValueChange={(v) => setNewsSettings({ ...newsSettings, defaultCategory: v })}>
                    <SelectTrigger className="text-[12px] h-9" style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>أقصى عدد أخبار per Run</Label>
                  <Input
                    type="number"
                    value={newsSettings.maxItemsPerRun}
                    onChange={(e) => setNewsSettings({ ...newsSettings, maxItemsPerRun: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>فاصل Cron (بالدقائق)</Label>
                  <Input
                    type="number"
                    value={newsSettings.cronInterval}
                    onChange={(e) => setNewsSettings({ ...newsSettings, cronInterval: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>فاصل الجلب (بالدقائق)</Label>
                  <Input
                    type="number"
                    value={newsSettings.fetchInterval}
                    onChange={(e) => setNewsSettings({ ...newsSettings, fetchInterval: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>أدنى مستوى تأثير</Label>
                <Select value={newsSettings.minImpactLevel} onValueChange={(v) => setNewsSettings({ ...newsSettings, minImpactLevel: v })}>
                  <SelectTrigger className="text-[12px] h-9" style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — منخفض جداً</SelectItem>
                    <SelectItem value="2">2 — منخفض</SelectItem>
                    <SelectItem value="3">3 — متوسط</SelectItem>
                    <SelectItem value="4">4 — عالٍ</SelectItem>
                    <SelectItem value="5">5 — حرج</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
                <div className="flex items-center gap-2">
                  <Languages size={14} style={{ color: 'var(--cyan)' }} />
                  <div>
                    <Label className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>ترجمة تلقائية</Label>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>ترجمة الأخبار الإنجليزية تلقائياً</p>
                  </div>
                </div>
                <Switch checked={newsSettings.autoTranslate} onCheckedChange={(v) => setNewsSettings({ ...newsSettings, autoTranslate: v })} />
              </div>

              <Button onClick={() => handleSave('الأخبار', 'news', {
                defaultCategory: newsSettings.defaultCategory,
                autoTranslate: String(newsSettings.autoTranslate),
                cronInterval: newsSettings.cronInterval,
                fetchInterval: newsSettings.fetchInterval,
                maxItemsPerRun: newsSettings.maxItemsPerRun,
                minImpactLevel: newsSettings.minImpactLevel,
              })} disabled={saving} className="text-[12px] gap-1.5"
                style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: 'white' }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                حفظ الإعدادات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Pipeline Settings (V314: English news limits) ═══ */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,200,150,0.1)' }}>
                  <Globe size={16} style={{ color: 'var(--bull)' }} />
                </div>
                حدود الأخبار الإنجليزية
              </CardTitle>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                تحكم بعدد الأخبار الإنجليزية المنشورة يومياً وساعياً. يتم تطبيق التغييرات خلال 30 ثانية.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الحد اليومي للأخبار الإنجليزية</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={pipelineSettings.maxDailyEnNews}
                    onChange={(e) => setPipelineSettings({ ...pipelineSettings, maxDailyEnNews: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px]" style={{ color: 'var(--text4)' }}>أقصى عدد أخبار إنجليزية تُنشر باليوم (الافتراضي: 200)</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الحد الساعي للأخبار الإنجليزية</Label>
                  <Input
                    type="number"
                    min="1"
                    max="200"
                    value={pipelineSettings.maxHourlyEnNews}
                    onChange={(e) => setPipelineSettings({ ...pipelineSettings, maxHourlyEnNews: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px]" style={{ color: 'var(--text4)' }}>أقصى عدد أخبار إنجليزية تُنشر بالساعة (الافتراضي: 50)</p>
                </div>
              </div>

              {/* Current status */}
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper size={13} style={{ color: 'var(--bull)' }} />
                  <span className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الحالة الحالية</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg3)' }}>
                    <div className="text-[16px] font-bold font-mono-price" style={{ color: 'var(--bull)' }}>{pipelineSettings.maxDailyEnNews}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text4)' }}>خبر/يوم</div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg3)' }}>
                    <div className="text-[16px] font-bold font-mono-price" style={{ color: 'var(--bull)' }}>{pipelineSettings.maxHourlyEnNews}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text4)' }}>خبر/ساعة</div>
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSave('خط الإنتاج', 'pipeline', {
                maxDailyEnNews: pipelineSettings.maxDailyEnNews,
                maxHourlyEnNews: pipelineSettings.maxHourlyEnNews,
                maxDailyFrNews: pipelineSettings.maxDailyFrNews,
                maxHourlyFrNews: pipelineSettings.maxHourlyFrNews,
                maxDailyTrNews: pipelineSettings.maxDailyTrNews,
                maxHourlyTrNews: pipelineSettings.maxHourlyTrNews,
                maxDailyEsNews: pipelineSettings.maxDailyEsNews,
                maxHourlyEsNews: pipelineSettings.maxHourlyEsNews,
              })} disabled={saving} className="text-[12px] gap-1.5"
                style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: 'white' }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                حفظ إعدادات خط الإنتاج
              </Button>
            </CardContent>
          </Card>

          {/* ═══ French Pipeline Settings ═══ */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.1)' }}>
                  <Globe size={16} style={{ color: 'var(--cyan)' }} />
                </div>
                🇫🇷 حدود الأخبار الفرنسية
              </CardTitle>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                تحكم بعدد الأخبار الفرنسية المنشورة يومياً وساعياً. يتم تطبيق التغييرات خلال 30 ثانية.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الحد اليومي للأخبار الفرنسية</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={pipelineSettings.maxDailyFrNews}
                    onChange={(e) => setPipelineSettings({ ...pipelineSettings, maxDailyFrNews: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px]" style={{ color: 'var(--text4)' }}>أقصى عدد أخبار فرنسية تُنشر باليوم (الافتراضي: 300)</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الحد الساعي للأخبار الفرنسية</Label>
                  <Input
                    type="number"
                    min="1"
                    max="200"
                    value={pipelineSettings.maxHourlyFrNews}
                    onChange={(e) => setPipelineSettings({ ...pipelineSettings, maxHourlyFrNews: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px]" style={{ color: 'var(--text4)' }}>أقصى عدد أخبار فرنسية تُنشر بالساعة (الافتراضي: 75)</p>
                </div>
              </div>

              {/* Current status */}
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper size={13} style={{ color: 'var(--cyan)' }} />
                  <span className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الحالة الحالية 🇫🇷</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg3)' }}>
                    <div className="text-[16px] font-bold font-mono-price" style={{ color: 'var(--cyan)' }}>{pipelineSettings.maxDailyFrNews}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text4)' }}>خبر/يوم</div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg3)' }}>
                    <div className="text-[16px] font-bold font-mono-price" style={{ color: 'var(--cyan)' }}>{pipelineSettings.maxHourlyFrNews}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text4)' }}>خبر/ساعة</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ═══ Turkish Pipeline Settings (V381) ═══ */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,77,106,0.08)' }}>
                  <Globe size={16} style={{ color: 'var(--bear)' }} />
                </div>
                🇹🇷 حدود الأخبار التركية
              </CardTitle>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                تحكم بعدد الأخبار التركية المنشورة يومياً وساعياً. يتم تطبيق التغييرات خلال 30 ثانية.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الحد اليومي للأخبار التركية</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5000"
                    value={pipelineSettings.maxDailyTrNews}
                    onChange={(e) => setPipelineSettings({ ...pipelineSettings, maxDailyTrNews: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px]" style={{ color: 'var(--text4)' }}>أقصى عدد أخبار تركية تُنشر باليوم (الافتراضي: 1500)</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الحد الساعي للأخبار التركية</Label>
                  <Input
                    type="number"
                    min="1"
                    max="500"
                    value={pipelineSettings.maxHourlyTrNews}
                    onChange={(e) => setPipelineSettings({ ...pipelineSettings, maxHourlyTrNews: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px]" style={{ color: 'var(--text4)' }}>أقصى عدد أخبار تركية تُنشر بالساعة (الافتراضي: 100)</p>
                </div>
              </div>

              {/* Current status */}
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper size={13} style={{ color: 'var(--bear)' }} />
                  <span className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الحالة الحالية 🇹🇷</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg3)' }}>
                    <div className="text-[16px] font-bold font-mono-price" style={{ color: 'var(--bear)' }}>{pipelineSettings.maxDailyTrNews}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text4)' }}>خبر/يوم</div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg3)' }}>
                    <div className="text-[16px] font-bold font-mono-price" style={{ color: 'var(--bear)' }}>{pipelineSettings.maxHourlyTrNews}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text4)' }}>خبر/ساعة</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ═══ Spanish Pipeline Settings (V381) ═══ */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.08)' }}>
                  <Globe size={16} style={{ color: 'var(--gold)' }} />
                </div>
                🇪🇸 حدود الأخبار الإسبانية
              </CardTitle>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                تحكم بعدد الأخبار الإسبانية المنشورة يومياً وساعياً. يتم تطبيق التغييرات خلال 30 ثانية.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الحد اليومي للأخبار الإسبانية</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={pipelineSettings.maxDailyEsNews}
                    onChange={(e) => setPipelineSettings({ ...pipelineSettings, maxDailyEsNews: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px]" style={{ color: 'var(--text4)' }}>أقصى عدد أخبار إسبانية تُنشر باليوم (الافتراضي: 300)</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الحد الساعي للأخبار الإسبانية</Label>
                  <Input
                    type="number"
                    min="1"
                    max="200"
                    value={pipelineSettings.maxHourlyEsNews}
                    onChange={(e) => setPipelineSettings({ ...pipelineSettings, maxHourlyEsNews: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px]" style={{ color: 'var(--text4)' }}>أقصى عدد أخبار إسبانية تُنشر بالساعة (الافتراضي: 50)</p>
                </div>
              </div>

              {/* Current status */}
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper size={13} style={{ color: 'var(--gold)' }} />
                  <span className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الحالة الحالية 🇪🇸</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg3)' }}>
                    <div className="text-[16px] font-bold font-mono-price" style={{ color: 'var(--gold)' }}>{pipelineSettings.maxDailyEsNews}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text4)' }}>خبر/يوم</div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg3)' }}>
                    <div className="text-[16px] font-bold font-mono-price" style={{ color: 'var(--gold)' }}>{pipelineSettings.maxHourlyEsNews}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text4)' }}>خبر/ساعة</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ═══ Stock Analysis Pipeline Settings (V381) ═══ */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.12)' }}>
                  <Zap size={16} style={{ color: 'var(--gold)' }} />
                </div>
                إعدادات خط أنابيب الأسهم
              </CardTitle>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                تحكم بحصص وموارد خط أنابيب تحليلات الأسهم. هذه الإعدادات تمنع أنابيب الأسهم من استنزاف موارد AI وحجب الأخبار العادية.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الحصة اليومية لتحليلات الأسهم/لغة</Label>
                  <Input
                    type="number"
                    min="1"
                    max="500"
                    value={stockPipelineSettings.maxDailyStockPerLocale}
                    onChange={(e) => setStockPipelineSettings({ ...stockPipelineSettings, maxDailyStockPerLocale: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px]" style={{ color: 'var(--text4)' }}>أقصى عدد تحليلات أسهم تُنشر باليوم لكل لغة (الافتراضي: 200)</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الحصة الساعية لتحليلات الأسهم/لغة</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={stockPipelineSettings.maxHourlyStockPerLocale}
                    onChange={(e) => setStockPipelineSettings({ ...stockPipelineSettings, maxHourlyStockPerLocale: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px]" style={{ color: 'var(--text4)' }}>أقصى عدد تحليلات أسهم تُنشر بالساعة لكل لغة (الافتراضي: 40)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>أقصى نداءات AI للأسهم/يوم</Label>
                  <Input
                    type="number"
                    min="50"
                    max="1000"
                    value={stockPipelineSettings.maxStockAiCallsPerDay}
                    onChange={(e) => setStockPipelineSettings({ ...stockPipelineSettings, maxStockAiCallsPerDay: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px]" style={{ color: 'var(--text4)' }}>إجمالي نداءات AI المسموحة لخط الأسهم باليوم (الافتراضي: 300)</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>مرات تشغيل كرون الأسهم/يوم</Label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    value={stockPipelineSettings.maxStockCronRunsPerDay}
                    onChange={(e) => setStockPipelineSettings({ ...stockPipelineSettings, maxStockCronRunsPerDay: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px]" style={{ color: 'var(--text4)' }}>عدد مرات تشغيل كرون الأسهم يومياً (الافتراضي: 7)</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>أقصى أسهم/تشغيل</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={stockPipelineSettings.maxStocksPerCronRun}
                    onChange={(e) => setStockPipelineSettings({ ...stockPipelineSettings, maxStocksPerCronRun: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px]" style={{ color: 'var(--text4)' }}>عدد الأسهم المُحللة لكل تشغيل كرون (الافتراضي: 9)</p>
                </div>
              </div>

              {/* Stock pipeline info */}
              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={13} style={{ color: 'var(--gold)' }} />
                  <span className="text-[12px] font-bold" style={{ color: 'var(--gold)' }}>ملاحظة مهمة</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text3)' }}>
                  خط أنابيب الأسهم يستهلك موارد AI بشكل كبير. كل تحليل سهم يتطلب نداء AI واحد على الأقل.
                  الحساب التقريبي: {stockPipelineSettings.maxStockCronRunsPerDay} تشغيل × 5 لغات × {stockPipelineSettings.maxStocksPerCronRun} سهم = {parseInt(stockPipelineSettings.maxStockCronRunsPerDay || '7') * 5 * parseInt(stockPipelineSettings.maxStocksPerCronRun || '9')} نداء AI/يوم (كحد أقصى نظري).
                  رفع هذه القيم قد يؤدي إلى استنزاف موارد AI وحجب نشر الأخبار العادية.
                </p>
              </div>

              {/* Current status summary */}
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={13} style={{ color: 'var(--gold)' }} />
                  <span className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>ملخص الحصة</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg3)' }}>
                    <div className="text-[14px] font-bold font-mono-price" style={{ color: 'var(--gold)' }}>{stockPipelineSettings.maxDailyStockPerLocale}</div>
                    <div className="text-[9px]" style={{ color: 'var(--text4)' }}>تحليل/يوم/لغة</div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg3)' }}>
                    <div className="text-[14px] font-bold font-mono-price" style={{ color: 'var(--gold)' }}>{stockPipelineSettings.maxHourlyStockPerLocale}</div>
                    <div className="text-[9px]" style={{ color: 'var(--text4)' }}>تحليل/ساعة/لغة</div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg3)' }}>
                    <div className="text-[14px] font-bold font-mono-price" style={{ color: 'var(--gold)' }}>{stockPipelineSettings.maxStockAiCallsPerDay}</div>
                    <div className="text-[9px]" style={{ color: 'var(--text4)' }}>نداء AI/يوم</div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg3)' }}>
                    <div className="text-[14px] font-bold font-mono-price" style={{ color: 'var(--gold)' }}>{stockPipelineSettings.maxStockCronRunsPerDay}</div>
                    <div className="text-[9px]" style={{ color: 'var(--text4)' }}>كرون/يوم</div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg3)' }}>
                    <div className="text-[14px] font-bold font-mono-price" style={{ color: 'var(--gold)' }}>{stockPipelineSettings.maxStocksPerCronRun}</div>
                    <div className="text-[9px]" style={{ color: 'var(--text4)' }}>سهم/تشغيل</div>
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSave('خط أنابيب الأسهم', 'stock', {
                maxDailyStockPerLocale: stockPipelineSettings.maxDailyStockPerLocale,
                maxHourlyStockPerLocale: stockPipelineSettings.maxHourlyStockPerLocale,
                maxStockAiCallsPerDay: stockPipelineSettings.maxStockAiCallsPerDay,
                maxStockCronRunsPerDay: stockPipelineSettings.maxStockCronRunsPerDay,
                maxStocksPerCronRun: stockPipelineSettings.maxStocksPerCronRun,
              })} disabled={saving} className="text-[12px] gap-1.5"
                style={{ background: 'linear-gradient(135deg, var(--gold), #FF8C00)', color: 'white' }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                حفظ إعدادات خط أنابيب الأسهم
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ AI Settings ═══ */}
        <TabsContent value="ai" className="space-y-4">
          {/* AI Providers Status */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--purple2)' }}>
                  <Cpu size={16} style={{ color: 'var(--purple)' }} />
                </div>
                مزودو الذكاء الاصطناعي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {s.aiProviders.map((provider) => (
                    <div key={provider.name} className="flex items-center justify-between p-3 rounded-lg transition-all hover:bg-[var(--bg4)]" style={{ background: 'var(--bg4)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                          background: provider.available ? 'rgba(0,200,150,0.1)' : 'rgba(100,116,139,0.1)',
                        }}>
                          {provider.available ? <CheckCircle2 size={16} style={{ color: 'var(--bull)' }} /> : <XCircle size={16} style={{ color: 'var(--text4)' }} />}
                        </div>
                        <div>
                          <span className="text-[12px] font-medium" style={{ color: provider.available ? 'var(--text)' : 'var(--text3)' }}>{provider.name}</span>
                          {provider.model && <span className="text-[9px] mr-2 font-mono" style={{ color: 'var(--text4)' }}>{provider.model}</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px]" style={{
                        borderColor: provider.available ? 'rgba(0,200,150,0.2)' : 'var(--border)',
                        color: provider.available ? 'var(--bull)' : 'var(--text4)',
                      }}>
                        {provider.available ? 'متاح' : 'غير متاح'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* AI Configuration */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--cyan2)' }}>
                  <Brain size={16} style={{ color: 'var(--cyan)' }} />
                </div>
                تكوين AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>مزود الترجمة</Label>
                  <Select value={aiSettings.translationProvider} onValueChange={(v) => setAiSettings({ ...aiSettings, translationProvider: v })}>
                    <SelectTrigger className="text-[12px] h-9" style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">تلقائي (أفضل مزود متاح)</SelectItem>
                      <SelectItem value="gemini">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="groq">Groq (Llama 3.3)</SelectItem>
                      <SelectItem value="cerebras">Cerebras (Llama 3.3)</SelectItem>
                      <SelectItem value="mistral">Mistral Small</SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                      <SelectItem value="nvidia">NVIDIA (Llama 3.1)</SelectItem>
                      <SelectItem value="glm">GLM-4 Plus (ZhipuAI)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>مزود التحليل</Label>
                  <Select value={aiSettings.analysisProvider} onValueChange={(v) => setAiSettings({ ...aiSettings, analysisProvider: v })}>
                    <SelectTrigger className="text-[12px] h-9" style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">تلقائي (أفضل مزود متاح)</SelectItem>
                      <SelectItem value="gemini">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="groq">Groq (Llama 3.3)</SelectItem>
                      <SelectItem value="cerebras">Cerebras (Llama 3.3)</SelectItem>
                      <SelectItem value="mistral">Mistral Small</SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                      <SelectItem value="nvidia">NVIDIA (Llama 3.1)</SelectItem>
                      <SelectItem value="glm">GLM-4 Plus (ZhipuAI)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>حد المعدل (طلب/دقيقة)</Label>
                  <Input
                    type="number"
                    value={aiSettings.rateLimit}
                    onChange={(e) => setAiSettings({ ...aiSettings, rateLimit: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>أقصى محاولات إعادة</Label>
                  <Input
                    type="number"
                    value={aiSettings.maxRetries}
                    onChange={(e) => setAiSettings({ ...aiSettings, maxRetries: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
                <div className="flex items-center gap-2">
                  <Zap size={14} style={{ color: 'var(--gold)' }} />
                  <div>
                    <Label className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>التبديل التلقائي</Label>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>الانتقال تلقائياً لمزود بديل عند الفشل</p>
                  </div>
                </div>
                <Switch checked={aiSettings.enableFallback} onCheckedChange={(v) => setAiSettings({ ...aiSettings, enableFallback: v })} />
              </div>

              <Button onClick={() => handleSave('AI', 'ai', {
                translationProvider: aiSettings.translationProvider,
                analysisProvider: aiSettings.analysisProvider,
                rateLimit: aiSettings.rateLimit,
                maxRetries: aiSettings.maxRetries,
                enableFallback: String(aiSettings.enableFallback),
              })} disabled={saving} className="text-[12px] gap-1.5"
                style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: 'white' }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                حفظ الإعدادات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ System Status ═══ */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Database */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                  <Database size={18} style={{ color: s.dbStatus === 'connected' ? 'var(--bull)' : 'var(--bear)' }} />
                  قاعدة البيانات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {s.dbStatus === 'connected' ? (
                    <Badge style={{ background: 'rgba(0,200,150,0.12)', color: 'var(--bull)', border: '1px solid rgba(0,200,150,0.2)' }}>
                      <CheckCircle2 size={10} className="ml-1" /> متصلة
                    </Badge>
                  ) : (
                    <Badge style={{ background: 'rgba(255,77,106,0.12)', color: 'var(--bear)', border: '1px solid rgba(255,77,106,0.2)' }}>
                      <XCircle size={10} className="ml-1" /> غير متصلة
                    </Badge>
                  )}
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>PostgreSQL (Supabase)</span>
                </div>
                {s.dbWarning && (
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={12} style={{ color: 'var(--gold)' }} />
                      <span className="text-[11px] font-bold" style={{ color: 'var(--gold)' }}>تنبيه</span>
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{s.dbWarning}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
                    <div className="font-mono-price text-[16px] font-bold" style={{ color: 'var(--text)' }}>{s.totalNews}</div>
                    <div className="text-[9px]" style={{ color: 'var(--text3)' }}>أخبار</div>
                  </div>
                  <div className="p-2.5 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
                    <div className="font-mono-price text-[16px] font-bold" style={{ color: 'var(--text)' }}>{s.totalArticles}</div>
                    <div className="text-[9px]" style={{ color: 'var(--text3)' }}>مقالات AI</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cache Settings */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.1)' }}>
                    <HardDrive size={16} style={{ color: 'var(--gold)' }} />
                  </div>
                  إعدادات الكاش
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>مدة الكاش (ثانية)</Label>
                    <Input
                      type="number"
                      value={cacheSettings.cacheDuration}
                      onChange={(e) => setCacheSettings({ ...cacheSettings, cacheDuration: e.target.value })}
                      className="text-[13px] h-9"
                      style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>أقصى عمر (ثانية)</Label>
                    <Input
                      type="number"
                      value={cacheSettings.maxAge}
                      onChange={(e) => setCacheSettings({ ...cacheSettings, maxAge: e.target.value })}
                      className="text-[13px] h-9"
                      style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
                  <div className="flex items-center gap-2">
                    <RefreshCw size={14} style={{ color: 'var(--cyan)' }} />
                    <div>
                      <Label className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>تسخين الكاش</Label>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>تحميل البيانات مسبقاً</p>
                    </div>
                  </div>
                  <Switch checked={cacheSettings.enableWarmup} onCheckedChange={(v) => setCacheSettings({ ...cacheSettings, enableWarmup: v })} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>فاصل التسخين (دقيقة)</Label>
                  <Input
                    type="number"
                    value={cacheSettings.warmupInterval}
                    onChange={(e) => setCacheSettings({ ...cacheSettings, warmupInterval: e.target.value })}
                    className="text-[13px] h-9"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>

                <Button onClick={() => handleSave('الكاش', 'cache', {
                  cacheDuration: cacheSettings.cacheDuration,
                  maxAge: cacheSettings.maxAge,
                  enableWarmup: String(cacheSettings.enableWarmup),
                  warmupInterval: cacheSettings.warmupInterval,
                })} disabled={saving} className="text-[12px] gap-1.5"
                  style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: 'white' }}>
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  حفظ الإعدادات
                </Button>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                  <Shield size={18} style={{ color: 'var(--cyan)' }} />
                  الأمان
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'المصادقة', value: 'JWT (jose)', status: true },
                  { label: 'مدة الجلسة', value: '24 ساعة', status: true },
                  { label: 'حماية Dashboard', value: 'Middleware + Cookie', status: true },
                  { label: 'حماية API', value: 'CRON_SECRET + JWT', status: true },
                  { label: 'تشفير كلمة السر', value: 'bcrypt (موصى به)', status: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--bg4)' }}>
                    <span className="text-[11px]" style={{ color: 'var(--text2)' }}>{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{item.value}</span>
                      {item.status ? <CheckCircle2 size={12} style={{ color: 'var(--bull)' }} /> : <AlertTriangle size={12} style={{ color: 'var(--gold)' }} />}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pipeline Schedule */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                  <Clock size={18} style={{ color: 'var(--gold)' }} />
                  جدول التشغيل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Server size={13} style={{ color: 'var(--cyan)' }} />
                    <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>Pipeline تلقائي</span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{s.cronSchedule}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Globe size={13} style={{ color: 'var(--gold)' }} />
                    <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>جلب الأخبار</span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--text3)' }}>كل 3 دقائق (تلقائي) — 13 RSS + Finnhub</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw size={13} style={{ color: 'var(--purple)' }} />
                    <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>آخر تشغيل</span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--text3)' }}>
                    {s.lastPipelineRun ? new Date(s.lastPipelineRun).toLocaleString('ar-SA') : 'لا يوجد تشغيل مسجل'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ Danger Zone ═══ */}
        <TabsContent value="danger" className="space-y-4">
          <Card className="border-0 overflow-hidden" style={{
            background: 'var(--bg3)',
            border: '1px solid rgba(255,77,106,0.15)',
            borderTop: '3px solid var(--bear)',
          }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--bear)' }}>
                <AlertTriangle size={18} />
                منطقة الخطر
              </CardTitle>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>إجراءات لا يمكن التراجع عنها. استخدمها بحذر.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                <div>
                  <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>مسح الكاش</span>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>حذف جميع البيانات المخزنة مؤقتاً وإعادة تحميلها</p>
                </div>
                <Button variant="outline" size="sm" className="text-[11px] gap-1.5"
                  style={{ borderColor: 'rgba(255,184,0,0.3)', color: 'var(--gold)' }}
                  onClick={() => handleDangerAction('clearCache')}>
                  <RefreshCw size={12} /> مسح وإعادة تحميل
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                <div>
                  <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>جلب أخبار جديدة</span>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>تشغيل Cron يدوياً لجلب أحدث الأخبار من جميع المصادر</p>
                </div>
                <Button variant="outline" size="sm" className="text-[11px] gap-1.5"
                  style={{ borderColor: 'rgba(0,229,255,0.3)', color: 'var(--cyan)' }}
                  onClick={() => handleDangerAction('fetchNews')}>
                  <Globe size={12} /> جلب الآن
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,77,106,0.04)', border: '1px solid rgba(255,77,106,0.1)' }}>
                <div>
                  <span className="text-[13px] font-bold" style={{ color: 'var(--bear)' }}>حذف جميع الأخبار</span>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>حذف جميع الأخبار من قاعدة البيانات نهائياً — لا يمكن التراجع!</p>
                </div>
                <Button variant="outline" size="sm" className="text-[11px] gap-1.5"
                  style={{ borderColor: 'rgba(255,77,106,0.3)', color: 'var(--bear)' }}
                  onClick={() => toast.error('هذا الإجراء معطل لأسباب أمنية')}>
                  <Trash2 size={12} /> حذف الكل
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,77,106,0.04)', border: '1px solid rgba(255,77,106,0.1)' }}>
                <div>
                  <span className="text-[13px] font-bold" style={{ color: 'var(--bear)' }}>إعادة تعيين قاعدة البيانات</span>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>حذف جميع الجداول وإعادة إنشائها — سيتم حذف كل شيء!</p>
                </div>
                <Button variant="outline" size="sm" className="text-[11px] gap-1.5"
                  style={{ borderColor: 'rgba(255,77,106,0.3)', color: 'var(--bear)' }}
                  onClick={() => toast.error('هذا الإجراء معطل لأسباب أمنية')}>
                  <AlertTriangle size={12} /> إعادة تعيين
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Telegram Settings ═══ */}
        <TabsContent value="telegram" className="space-y-4">
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,136,255,0.12)' }}>
                  <Bot size={16} style={{ color: '#0088FF' }} />
                </div>
                إعدادات بوت تيليجرام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bot Status */}
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
                <div className="flex items-center gap-2">
                  <Webhook size={14} style={{ color: '#0088FF' }} />
                  <div>
                    <Label className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>حالة الـ Webhook</Label>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>اتصال بوت تيليجرام بخادم رؤى</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px]" style={{ borderColor: 'rgba(0,200,150,0.2)', color: 'var(--bull)' }}>متصل</Badge>
              </div>

              {/* Open Bot Button */}
              <a href="https://t.me/Rouatradingnews_bot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ background: 'rgba(0,136,255,0.9)', color: 'white' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                فتح البوت في تيليجرام
              </a>

              <div className="text-[11px] p-3 rounded-lg" style={{ color: 'var(--text3)', background: 'rgba(0,136,255,0.04)', border: '1px solid rgba(0,136,255,0.1)' }}>
                بوت تيليجرام يرسل الأخبار العاجلة والتنبيهات تلقائياً للمشتركين. يمكن للمستخدمين التحكم في تفضيلات الإشعارات عبر أوامر البوت مثل /prefs و /subscribe.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
