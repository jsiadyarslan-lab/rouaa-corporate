// ─── Stock Analysis Dashboard ────────────────────────────────
// Pipeline status overview, quick actions, recent analyses, company stats
// Bloomberg dark theme with glassmorphism cards

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity, TrendingUp, TrendingDown, Minus, Play, RefreshCw,
  BarChart3, Users, Globe, Zap, Clock, ArrowUpRight, ArrowDownRight,
  Flame, Loader2, AlertCircle, CheckCircle2, XCircle, Database,
  ChevronLeft, Eye, ExternalLink,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────
interface PipelineStatus {
  status: string;
  pipeline: string;
  counts: {
    total: number;
    today: number;
    byLocale: { en: number; ar: number; fr: number };
    bySignal: { bullish: number; bearish: number; neutral: number };
    byMarket: { sp500: number; cac40: number; tadawul: number };
    companies: number;
  };
  availableSymbols: { sp500: number; cac40: number; tadawul: number };
  timestamp: string;
}

interface AnalysisItem {
  id: string;
  symbol: string;
  slug: string;
  title: string;
  summary: string;
  locale: string;
  price: number;
  change: number;
  changePercent: number;
  overallSignal: string;
  overallScore: number;
  confidenceScore: number;
  riskLevel: string;
  marketType: string;
  tradeSetup: any;
  publishedAt: string | null;
  validUntil: string | null;
  createdAt: string;
}

// ─── Helpers ────────────────────────────────────────────────
function formatPrice(val: number): string {
  if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (val >= 1) return val.toFixed(2);
  return val.toFixed(4);
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

function getSignalStyle(signal: string) {
  if (signal === 'bullish') return { bg: 'rgba(0,200,150,0.12)', color: 'var(--bull)', label: 'صاعد', icon: TrendingUp };
  if (signal === 'bearish') return { bg: 'rgba(255,77,106,0.12)', color: 'var(--bear)', label: 'هابط', icon: TrendingDown };
  return { bg: 'rgba(100,116,139,0.12)', color: 'var(--text3)', label: 'محايد', icon: Minus };
}

function getLocaleInfo(locale: string) {
  switch (locale) {
    case 'ar': return { flag: '🇸🇦', label: 'العربية', color: '#00C896' };
    case 'en': return { flag: '🇬🇧', label: 'English', color: '#00E5FF' };
    case 'fr': return { flag: '🇫🇷', label: 'Français', color: '#8B5CF6' };
    case 'es': return { flag: '🇪🇸', label: 'Español', color: '#FF6B35' };
    case 'tr': return { flag: '🇹🇷', label: 'Türkçe', color: '#E53935' };
    default: return { flag: '🌐', label: locale, color: 'var(--text3)' };
  }
}

function getMarketLabel(marketType: string) {
  switch (marketType) {
    case 'sp500': return 'S&P 500';
    case 'cac40': return 'CAC 40';
    case 'tadawul': return 'تداول';
    default: return marketType;
  }
}

// ─── Section Divider ────────────────────────────────────────
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

// ─── Main Component ─────────────────────────────────────────
export default function StockAnalysisDashboard() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ locale: string; success: boolean; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, analysesRes] = await Promise.all([
        fetch('/api/stock-analysis?action=status').catch(() => null),
        fetch('/api/stock-analysis?action=list&limit=10').catch(() => null),
      ]);

      const statusData = statusRes ? await statusRes.json().catch(() => null) : null;
      const analysesData = analysesRes ? await analysesRes.json().catch(() => null) : null;

      if (statusData?.counts) {
        setStatus(statusData);
      }
      if (analysesData?.analyses) {
        setAnalyses(analysesData.analyses);
      }
    } catch (err) {
      console.error('[StockDashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRunPipeline = async (locale: string) => {
    setActionLoading(locale);
    setActionResult(null);
    try {
      const res = await fetch(`/api/stock-analysis?action=run&locale=${locale}&maxStocks=5`);
      const data = await res.json();
      setActionResult({
        locale,
        success: res.ok,
        message: res.ok
          ? `تم تشغيل الأنبوب بنجاح: ${data.result?.generated ?? 0} تحليل، ${data.result?.published ?? 0} منشور`
          : `فشل: ${data.error || data.message || 'خطأ غير معروف'}`,
      });
      // Refresh data after pipeline completes
      setTimeout(fetchData, 2000);
    } catch (err) {
      setActionResult({ locale, success: false, message: 'فشل الاتصال بالخادم' });
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  const c = status?.counts || { total: 0, today: 0, byLocale: { en: 0, ar: 0, fr: 0 }, bySignal: { bullish: 0, bearish: 0, neutral: 0 }, byMarket: { sp500: 0, cac40: 0, tadawul: 0 }, companies: 0 };

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold font-heading" style={{ color: 'var(--text)' }}>
            📈 تحليل الأسهم
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>
            لوحة تحكم أنابيب تحليل الأسهم — S&P 500 · CAC 40 · تداول
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            className="text-[11px] gap-1.5"
            style={{ color: 'var(--text2)' }}
          >
            <RefreshCw size={13} />
            تحديث
          </Button>
          <Badge className="text-[10px] gap-1.5 px-3 py-1.5" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
            <Activity size={10} />
            {c.total} تحليل
          </Badge>
        </div>
      </div>

      {/* ═══ Stats Cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            icon: BarChart3, label: 'إجمالي التحليلات',
            value: c.total,
            color: '#00E5FF',
            grad: 'linear-gradient(135deg, rgba(0,229,255,0.10) 0%, rgba(0,229,255,0.02) 100%)',
            borderColor: 'rgba(0,229,255,0.12)',
          },
          {
            icon: Zap, label: 'تحليلات اليوم',
            value: c.today,
            color: '#00C896',
            grad: 'linear-gradient(135deg, rgba(0,200,150,0.10) 0%, rgba(0,200,150,0.02) 100%)',
            borderColor: 'rgba(0,200,150,0.12)',
          },
          {
            icon: TrendingUp, label: 'إشارات صاعدة',
            value: c.bySignal.bullish,
            color: '#00C896',
            grad: 'linear-gradient(135deg, rgba(0,200,150,0.10) 0%, rgba(0,200,150,0.02) 100%)',
            borderColor: 'rgba(0,200,150,0.12)',
          },
          {
            icon: Users, label: 'ملفات الشركات',
            value: c.companies,
            color: '#8B5CF6',
            grad: 'linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(139,92,246,0.02) 100%)',
            borderColor: 'rgba(139,92,246,0.12)',
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="border-0 overflow-hidden relative transition-all duration-300 hover:scale-[1.02]"
            style={{ background: stat.grad, border: `1px solid ${stat.borderColor}` }}
          >
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
                {stat.value.toLocaleString('en-US')}
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ Pipeline Settings Quick Access (V382) ═══ */}
      <SectionDivider title="إعدادات الأنابيب" icon={Zap} color="var(--gold)" />
      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl" style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.12)' }}>
              <Zap size={14} style={{ color: 'var(--gold)' }} />
              <span className="font-mono-price text-[18px] font-bold" style={{ color: 'var(--gold)' }}>300</span>
              <span className="text-[9px] text-center" style={{ color: 'var(--text4)' }}>نداءات AI/يوم</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.12)' }}>
              <BarChart3 size={14} style={{ color: 'var(--bull)' }} />
              <span className="font-mono-price text-[18px] font-bold" style={{ color: 'var(--bull)' }}>200</span>
              <span className="text-[9px] text-center" style={{ color: 'var(--text4)' }}>حصة/يوم/لغة</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.12)' }}>
              <Clock size={14} style={{ color: 'var(--cyan)' }} />
              <span className="font-mono-price text-[18px] font-bold" style={{ color: 'var(--cyan)' }}>7</span>
              <span className="text-[9px] text-center" style={{ color: 'var(--text4)' }}>تشغيلات كرون/يوم</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
              <Globe size={14} style={{ color: '#8B5CF6' }} />
              <span className="font-mono-price text-[18px] font-bold" style={{ color: '#8B5CF6' }}>9</span>
              <span className="text-[9px] text-center" style={{ color: 'var(--text4)' }}>أسهم/تشغيل</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl" style={{ background: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.12)' }}>
              <Activity size={14} style={{ color: 'var(--text3)' }} />
              <span className="font-mono-price text-[18px] font-bold" style={{ color: 'var(--text3)' }}>40</span>
              <span className="text-[9px] text-center" style={{ color: 'var(--text4)' }}>حصة/ساعة/لغة</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
              الحساب التقريبي: 7 تشغيل × 5 لغات × 9 سهم = 315 نداء AI/يوم (كحد أقصى نظري)
            </span>
            <Link href="/dashboard/settings" className="text-[11px] font-bold flex items-center gap-1 hover:underline" style={{ color: 'var(--cyan)' }}>
              تعديل الإعدادات
              <ChevronLeft size={12} />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Per-Locale Pipeline Status ═══ */}
      <SectionDivider title="حالة الأنابيب" icon={Globe} color="var(--cyan)" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {(['ar', 'en', 'fr', 'es', 'tr'] as const).map((locale) => {
          const info = getLocaleInfo(locale);
          const count = c.byLocale[locale];
          const isRunning = actionLoading === locale;
          return (
            <Card
              key={locale}
              className="border-0 overflow-hidden relative transition-all duration-300 hover:scale-[1.01]"
              style={{
                background: `linear-gradient(135deg, ${info.color}10 0%, ${info.color}03 100%)`,
                border: `1px solid ${info.color}20`,
              }}
            >
              <div className="absolute top-0 left-0 w-full h-[2px] opacity-60" style={{
                background: `linear-gradient(90deg, transparent, ${info.color}, transparent)`,
              }} />
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[22px]">{info.flag}</span>
                    <div>
                      <h3 className="text-[14px] font-bold font-heading" style={{ color: 'var(--text)' }}>{info.label}</h3>
                      <span className="text-[10px]" style={{ color: 'var(--text4)' }}>locale: {locale}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="font-mono-price text-[20px] font-bold" style={{ color: info.color }}>{count}</span>
                    <span className="text-[10px] block" style={{ color: 'var(--text3)' }}>تحليل</span>
                  </div>
                </div>

                {/* Run Pipeline Button */}
                <Button
                  onClick={() => handleRunPipeline(locale)}
                  disabled={!!actionLoading}
                  className="w-full gap-2 text-[12px] font-bold h-9 rounded-lg"
                  style={{
                    background: isRunning ? `${info.color}30` : `${info.color}18`,
                    color: info.color,
                    border: `1px solid ${info.color}30`,
                  }}
                >
                  {isRunning ? (
                    <><Loader2 size={14} className="animate-spin" /> جارٍ التشغيل...</>
                  ) : (
                    <><Play size={14} /> تشغيل الأنبوب</>
                  )}
                </Button>

                {/* Action result feedback */}
                {actionResult && actionResult.locale === locale && (
                  <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold" style={{
                    background: actionResult.success ? 'rgba(0,200,150,0.10)' : 'rgba(255,77,106,0.10)',
                    color: actionResult.success ? 'var(--bull)' : 'var(--bear)',
                  }}>
                    {actionResult.success ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                    <span className="truncate">{actionResult.message}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ═══ Market Breakdown ═══ */}
      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* S&P 500 */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.12)' }}>
              <span className="text-[22px] flex-shrink-0">🇺🇸</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold mb-1" style={{ color: 'var(--text)' }}>S&P 500</div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[9px] block" style={{ color: 'var(--text3)' }}>تحليلات</span>
                    <span className="font-mono-price text-[16px] font-bold" style={{ color: '#00E5FF' }}>{c.byMarket.sp500}</span>
                  </div>
                  <div className="w-px h-6" style={{ background: 'var(--border)' }} />
                  <div>
                    <span className="text-[9px] block" style={{ color: 'var(--text3)' }}>رموز متاحة</span>
                    <span className="font-mono-price text-[16px] font-bold" style={{ color: 'var(--text3)' }}>{status?.availableSymbols.sp500 ?? 30}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* CAC 40 */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
              <span className="text-[22px] flex-shrink-0">🇫🇷</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold mb-1" style={{ color: 'var(--text)' }}>CAC 40</div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[9px] block" style={{ color: 'var(--text3)' }}>تحليلات</span>
                    <span className="font-mono-price text-[16px] font-bold" style={{ color: '#8B5CF6' }}>{c.byMarket.cac40}</span>
                  </div>
                  <div className="w-px h-6" style={{ background: 'var(--border)' }} />
                  <div>
                    <span className="text-[9px] block" style={{ color: 'var(--text3)' }}>رموز متاحة</span>
                    <span className="font-mono-price text-[16px] font-bold" style={{ color: 'var(--text3)' }}>{status?.availableSymbols.cac40 ?? 16}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Tadawul */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.12)' }}>
              <span className="text-[22px] flex-shrink-0">🇸🇦</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold mb-1" style={{ color: 'var(--text)' }}>تداول</div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[9px] block" style={{ color: 'var(--text3)' }}>تحليلات</span>
                    <span className="font-mono-price text-[16px] font-bold" style={{ color: '#00C896' }}>{c.byMarket.tadawul}</span>
                  </div>
                  <div className="w-px h-6" style={{ background: 'var(--border)' }} />
                  <div>
                    <span className="text-[9px] block" style={{ color: 'var(--text3)' }}>رموز متاحة</span>
                    <span className="font-mono-price text-[16px] font-bold" style={{ color: 'var(--text3)' }}>{status?.availableSymbols.tadawul ?? 8}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Recent Analyses ═══ */}
      <SectionDivider title="أحدث التحليلات" icon={Activity} color="#00C896" />
      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardContent className="p-0">
          {analyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Database size={32} style={{ color: 'var(--text4)' }} />
              <span className="text-[13px]" style={{ color: 'var(--text3)' }}>لا توجد تحليلات بعد. شغّل الأنبوب أعلاه.</span>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {analyses.map((a) => {
                  const sig = getSignalStyle(a.overallSignal);
                  const loc = getLocaleInfo(a.locale);
                  const SigIcon = sig.icon;
                  const isPositive = a.changePercent >= 0;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--cyan3)]"
                      style={{ borderBottomColor: 'var(--border)' }}
                    >
                      {/* Signal dot */}
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sig.color }} />

                      {/* Symbol */}
                      <div className="w-16 flex-shrink-0">
                        <span className="font-mono-price text-[13px] font-bold" style={{ color: 'var(--text)' }}>{a.symbol}</span>
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] truncate block" style={{ color: 'var(--text2)' }}>{a.title}</span>
                      </div>

                      {/* Locale badge */}
                      <span className="text-[10px] flex-shrink-0" title={loc.label}>{loc.flag}</span>

                      {/* Market */}
                      <span className="text-[10px] font-medium flex-shrink-0 px-1.5 py-0.5 rounded" style={{ background: 'var(--bg2)', color: 'var(--text4)' }}>
                        {getMarketLabel(a.marketType)}
                      </span>

                      {/* Price */}
                      <div className="w-24 text-right flex-shrink-0">
                        <span className="font-mono-price text-[12px] font-bold" style={{ color: 'var(--text)' }}>
                          ${formatPrice(a.price)}
                        </span>
                      </div>

                      {/* Change */}
                      <div className="w-20 text-right flex-shrink-0 flex items-center justify-end gap-0.5">
                        {isPositive ? <ArrowUpRight size={10} style={{ color: 'var(--bull)' }} /> : <ArrowDownRight size={10} style={{ color: 'var(--bear)' }} />}
                        <span className="font-mono-price text-[11px] font-bold" style={{ color: isPositive ? 'var(--bull)' : 'var(--bear)' }}>
                          {isPositive ? '+' : ''}{a.changePercent.toFixed(2)}%
                        </span>
                      </div>

                      {/* Signal badge */}
                      <div className="w-16 text-right flex-shrink-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: sig.bg, color: sig.color }}>
                          <SigIcon size={9} />
                          {sig.label}
                        </span>
                      </div>

                      {/* Time */}
                      <div className="w-16 text-right flex-shrink-0">
                        <span className="text-[10px]" style={{ color: 'var(--text4)' }}>{formatTimeAgo(a.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* ═══ Signal Distribution ═══ */}
      <SectionDivider title="توزيع الإشارات" icon={BarChart3} color="#8B5CF6" />
      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Bullish */}
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.12)' }}>
              <TrendingUp size={24} style={{ color: 'var(--bull)' }} />
              <span className="font-mono-price text-[28px] font-bold" style={{ color: 'var(--bull)' }}>{c.bySignal.bullish}</span>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text3)' }}>صاعد</span>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,200,150,0.10)' }}>
                <div className="h-full rounded-full" style={{
                  width: `${c.total ? Math.max((c.bySignal.bullish / c.total) * 100, 2) : 0}%`,
                  background: 'linear-gradient(90deg, #00C896, #00E5FF)',
                  minWidth: c.bySignal.bullish > 0 ? '4px' : '0',
                }} />
              </div>
            </div>
            {/* Bearish */}
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl" style={{ background: 'rgba(255,77,106,0.06)', border: '1px solid rgba(255,77,106,0.12)' }}>
              <TrendingDown size={24} style={{ color: 'var(--bear)' }} />
              <span className="font-mono-price text-[28px] font-bold" style={{ color: 'var(--bear)' }}>{c.bySignal.bearish}</span>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text3)' }}>هابط</span>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,77,106,0.10)' }}>
                <div className="h-full rounded-full" style={{
                  width: `${c.total ? Math.max((c.bySignal.bearish / c.total) * 100, 2) : 0}%`,
                  background: 'linear-gradient(90deg, #FF4D6A, #FF6B8A)',
                  minWidth: c.bySignal.bearish > 0 ? '4px' : '0',
                }} />
              </div>
            </div>
            {/* Neutral */}
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl" style={{ background: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.12)' }}>
              <Minus size={24} style={{ color: 'var(--text3)' }} />
              <span className="font-mono-price text-[28px] font-bold" style={{ color: 'var(--text3)' }}>{c.bySignal.neutral}</span>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text3)' }}>محايد</span>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(100,116,139,0.10)' }}>
                <div className="h-full rounded-full" style={{
                  width: `${c.total ? Math.max((c.bySignal.neutral / c.total) * 100, 2) : 0}%`,
                  background: 'linear-gradient(90deg, #64748B, #94A3B8)',
                  minWidth: c.bySignal.neutral > 0 ? '4px' : '0',
                }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Quick Links ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/dashboard/stock-analysis/ar', label: 'أنابيب العربية', flag: '🇸🇦', color: '#00C896' },
          { href: '/dashboard/stock-analysis/en', label: 'English Pipelines', flag: '🇬🇧', color: '#00E5FF' },
          { href: '/dashboard/stock-analysis/fr', label: 'Pipelines Français', flag: '🇫🇷', color: '#8B5CF6' },
          { href: '/dashboard/stock-analysis/companies', label: 'ملفات الشركات', flag: '🏢', color: '#FFB800' },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="block group">
            <Card className="border-0 overflow-hidden relative transition-all duration-300 hover:scale-[1.02] h-full" style={{
              background: `linear-gradient(135deg, ${link.color}10 0%, ${link.color}03 100%)`,
              border: `1px solid ${link.color}20`,
            }}>
              <CardContent className="p-3 flex items-center gap-2.5">
                <span className="text-[18px]">{link.flag}</span>
                <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{link.label}</span>
                <ChevronLeft size={14} className="mr-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: link.color }} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
