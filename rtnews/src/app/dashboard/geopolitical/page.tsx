'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity, Globe, TrendingUp, AlertTriangle, Zap, Clock,
  RefreshCw, Play, CheckCircle2, XCircle, BarChart3,
  Map, Shield, FileText, ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────
interface SchedulerStatus {
  isRunning: boolean;
  cycleCount: number;
  lastRunTime: string | null;
  nextRunTime: string | null;
  totalGenerated: number;
  totalErrors: number;
  lastError: string | null;
  lastRunResult: {
    timestamp: string;
    generated: number;
    skipped: number;
    errors: string[];
    duration: number;
    analyses: { locale: string; title: string; slug: string; riskScore: number; riskLevel: string }[];
  } | null;
  intervalHours: number;
}

interface DashboardStats {
  total: number;
  published: number;
  byLocale: Record<string, number>;
  byCategory: Record<string, number>;
  byLevel: Record<string, number>;
  today: number;
  thisWeek: number;
  last7days: { date: string; count: number }[];
  avgRiskScore: number;
  topCountries: { name: string; count: number }[];
}

interface DashboardData {
  scheduler: SchedulerStatus;
  stats: DashboardStats;
  locale: string;
}

// ─── Constants ─────────────────────────────────────────────
const LOCALE_LABELS: Record<string, { flag: string; name: string }> = {
  ar: { flag: '🇸🇦', name: 'العربية' },
  en: { flag: '🇬🇧', name: 'English' },
  fr: { flag: '🇫🇷', name: 'Français' },
  tr: { flag: '🇹🇷', name: 'Türkçe' },
  es: { flag: '🇪🇸', name: 'Español' },
};

const RISK_LEVEL_COLORS: Record<string, string> = {
  low: '#22c55e',
  moderate: '#eab308',
  elevated: '#f97316',
  high: '#ef4444',
  severe: '#991b1b',
};

const RISK_LEVEL_LABELS_AR: Record<string, string> = {
  low: 'منخفض',
  moderate: 'معتدل',
  elevated: 'مرتفع',
  high: 'عالي',
  severe: 'حرج',
};

const CATEGORY_LABELS_AR: Record<string, string> = {
  conflict: 'صراع',
  trade: 'تجارة',
  energy: 'طاقة',
  political: 'سياسي',
  cyber: 'سيبراني',
  sanctions: 'عقوبات',
  climate: 'مناخ',
};

// ─── Component ─────────────────────────────────────────────
export default function GeopoliticalDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateScope, setGenerateScope] = useState<'all' | 'ar' | 'quick'>('all');
  const [selectedLocale, setSelectedLocale] = useState<string>('ar');

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/geopolitical-risks/dashboard');
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleManualGenerate = async () => {
    setGenerating(true);
    try {
      // V1048: Scope the generation to avoid Railway 5-min timeout
      // quick = 1 analysis, Arabic only (~30-90s)
      // ar = 3 analyses, Arabic only (~90-270s)
      // all = 3 analyses × 5 locales = 15 AI calls (~7-22min — may timeout!)
      const scopeConfig = {
        quick: { maxAnalyses: 1, locales: ['ar'] },
        ar: { maxAnalyses: 3, locales: ['ar'] },
        all: { maxAnalyses: 3, locales: ['ar', 'en', 'fr', 'tr', 'es'] },
      };
      const config = scopeConfig[generateScope] || scopeConfig.quick;

      const res = await fetch('/api/geopolitical-risks/generate', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          force: true, // V1048: always force to skip dedup on manual trigger
          maxAnalyses: config.maxAnalyses,
          locales: config.locales,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.details || `HTTP ${res.status}`);
      }

      const result = await res.json();
      toast.success(`تم توليد ${result.generated} تحليل جيوسياسي بنجاح!`);
      setTimeout(fetchDashboard, 2000);
    } catch (err: any) {
      toast.error(`فشل التوليد: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--cyan)' }} />
      </div>
    );
  }

  const { scheduler, stats } = data || { scheduler: null, stats: null };

  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--bg)' }} dir="rtl">
      {/* ─── Header ─── */}
      <div className="max-w-[1400px] mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-1 text-[13px] font-bold transition-colors" style={{ color: 'var(--text3)' }}>
              <ChevronLeft size={16} />
              لوحة التحكم
            </Link>
            <span style={{ color: 'var(--text4)' }}>/</span>
            <div className="flex items-center gap-2">
              <Globe size={22} style={{ color: '#F59E0B' }} />
              <h1 className="text-[20px] font-bold" style={{ color: 'var(--text-head)' }}>
                لوحة المخاطر الجيوسياسية
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* V1048: Scope selector */}
            <select
              value={generateScope}
              onChange={e => setGenerateScope(e.target.value as any)}
              disabled={generating}
              className="px-3 py-2.5 rounded-xl text-[12px] font-bold outline-none"
              style={{
                background: 'var(--bg4)',
                color: 'var(--text-head)',
                border: '1px solid var(--border)',
                cursor: generating ? 'wait' : 'pointer',
              }}
            >
              <option value="all">🌍 كل اللغات (15 تحليل — متوازي)</option>
              <option value="ar">🇸🇦 عربي فقط (3 تحليلات)</option>
              <option value="quick">⚡ سريع (1 تحليل — عربي)</option>
            </select>
            <button
              onClick={handleManualGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50"
              style={{
                background: generating ? 'var(--bg4)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: generating ? 'var(--text3)' : '#fff',
                border: 'none',
                cursor: generating ? 'wait' : 'pointer',
              }}
            >
              {generating ? (
                <><RefreshCw size={14} className="animate-spin" /> جاري التوليد...</>
              ) : (
                <><Play size={14} /> توليد</>
              )}
            </button>
          </div>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--text3)' }}>
          Pipeline تلقائي يولّد تحليلات المخاطر الجيوسياسية من الأخبار كل {scheduler?.intervalHours || 12} ساعة لجميع اللغات الـ5
        </p>
      </div>

      {/* ─── Scheduler Status Card ─── */}
      <div className="max-w-[1400px] mx-auto px-4 mb-6">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={18} style={{ color: scheduler?.isRunning ? '#22c55e' : '#ef4444' }} />
              <h2 className="text-[15px] font-bold" style={{ color: 'var(--text-head)' }}>حالة المجدول</h2>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{
              background: scheduler?.isRunning ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: scheduler?.isRunning ? '#22c55e' : '#ef4444',
              border: `1px solid ${scheduler?.isRunning ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              {scheduler?.isRunning ? '● يعمل' : '● متوقف'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Cycle Count */}
            <div className="text-center p-3 rounded-xl" style={{ background: 'var(--bg4)' }}>
              <div className="text-[24px] font-bold font-mono" style={{ color: 'var(--cyan)' }}>{scheduler?.cycleCount || 0}</div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>دورة تشغيل</div>
            </div>

            {/* Total Generated */}
            <div className="text-center p-3 rounded-xl" style={{ background: 'var(--bg4)' }}>
              <div className="text-[24px] font-bold font-mono" style={{ color: '#22c55e' }}>{scheduler?.totalGenerated || 0}</div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>تحليل مولّد (إجمالي)</div>
            </div>

            {/* Total Errors */}
            <div className="text-center p-3 rounded-xl" style={{ background: 'var(--bg4)' }}>
              <div className="text-[24px] font-bold font-mono" style={{ color: scheduler?.totalErrors ? '#ef4444' : 'var(--text3)' }}>{scheduler?.totalErrors || 0}</div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>أخطاء</div>
            </div>

            {/* Last Run */}
            <div className="text-center p-3 rounded-xl" style={{ background: 'var(--bg4)' }}>
              <div className="text-[13px] font-bold font-mono" style={{ color: 'var(--text-head)' }}>
                {scheduler?.lastRunTime ? new Date(scheduler.lastRunTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>
                {scheduler?.nextRunTime ? `التالي: ${new Date(scheduler.nextRunTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}` : 'آخر تشغيل'}
              </div>
            </div>
          </div>

          {/* Last Run Result */}
          {scheduler?.lastRunResult && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} style={{ color: 'var(--text3)' }} />
                <span className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>
                  آخر تشغيل: {new Date(scheduler.lastRunResult.timestamp).toLocaleString('ar-SA')}
                </span>
                <span className="text-[11px] mr-auto" style={{ color: 'var(--text4)' }}>
                  ({Math.round(scheduler.lastRunResult.duration / 1000)}s)
                </span>
              </div>

              {scheduler.lastRunResult.analyses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {scheduler.lastRunResult.analyses.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px]" style={{
                      background: 'var(--bg3)',
                      border: `1px solid ${RISK_LEVEL_COLORS[a.riskLevel] || 'var(--border)'}20`,
                    }}>
                      <span style={{ color: 'var(--text4)' }}>{LOCALE_LABELS[a.locale]?.flag}</span>
                      <span className="font-bold truncate max-w-[200px]" style={{ color: 'var(--text-head)' }}>{a.title}</span>
                      <span className="font-mono font-bold" style={{ color: RISK_LEVEL_COLORS[a.riskLevel] }}>{a.riskScore}</span>
                      <Link href={`/${a.locale}/geopolitical-risks/${a.slug}`} target="_blank" className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
                        عرض
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px]" style={{ color: 'var(--text3)' }}>لم يتم توليد تحليلات جديدة (قد تكون مكررة)</p>
              )}

              {scheduler.lastRunResult.errors.length > 0 && (
                <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={12} style={{ color: '#ef4444' }} />
                    <span className="text-[11px] font-bold" style={{ color: '#ef4444' }}>أخطاء آخر تشغيل</span>
                  </div>
                  <ul className="space-y-1">
                    {scheduler.lastRunResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i} className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Publication Stats ─── */}
      <div className="max-w-[1400px] mx-auto px-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={18} style={{ color: 'var(--cyan)' }} />
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--text-head)' }}>عدادات النشر</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Total Published */}
          <StatCard icon={<CheckCircle2 size={16} />} label="منشور" value={stats?.published || 0} color="#22c55e" />
          {/* Today */}
          <StatCard icon={<Zap size={16} />} label="اليوم" value={stats?.today || 0} color="#F59E0B" />
          {/* This Week */}
          <StatCard icon={<Clock size={16} />} label="هذا الأسبوع" value={stats?.thisWeek || 0} color="var(--cyan)" />
          {/* Avg Risk Score */}
          <StatCard icon={<TrendingUp size={16} />} label="متوسط المخاطرة" value={stats?.avgRiskScore || 0} color="#ef4444" />
          {/* Total */}
          <StatCard icon={<FileText size={16} />} label="إجمالي" value={stats?.total || 0} color="var(--text2)" />
          {/* Locales */}
          <StatCard icon={<Globe size={16} />} label="لغات نشطة" value={Object.keys(stats?.byLocale || {}).length} color="#8B5CF6" />
        </div>
      </div>

      {/* ─── By Locale ─── */}
      <div className="max-w-[1400px] mx-auto px-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Locales */}
          <div className="glass-card p-5 rounded-2xl">
            <h3 className="text-[14px] font-bold mb-4" style={{ color: 'var(--text-head)' }}>التوزيع حسب اللغة</h3>
            <div className="space-y-2">
              {Object.entries(stats?.byLocale || {}).sort((a, b) => b[1] - a[1]).map(([locale, count]) => {
                const max = Math.max(...Object.values(stats?.byLocale || {}), 1);
                const pct = (count / max) * 100;
                return (
                  <div key={locale} className="flex items-center gap-3">
                    <span className="text-[20px]">{LOCALE_LABELS[locale]?.flag}</span>
                    <span className="text-[12px] font-bold w-[60px]" style={{ color: 'var(--text2)' }}>{LOCALE_LABELS[locale]?.name || locale}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--cyan)' }} />
                    </div>
                    <span className="text-[12px] font-mono font-bold w-[30px] text-left" style={{ color: 'var(--text-head)' }}>{count}</span>
                  </div>
                );
              })}
              {Object.keys(stats?.byLocale || {}).length === 0 && (
                <p className="text-[12px] text-center py-4" style={{ color: 'var(--text3)' }}>لا توجد بيانات بعد — شغّل التوليد اليدوي</p>
              )}
            </div>
          </div>

          {/* Risk Levels */}
          <div className="glass-card p-5 rounded-2xl">
            <h3 className="text-[14px] font-bold mb-4" style={{ color: 'var(--text-head)' }}>التوزيع حسب مستوى المخاطرة</h3>
            <div className="space-y-2">
              {['severe', 'high', 'elevated', 'moderate', 'low'].map(level => {
                const count = stats?.byLevel?.[level] || 0;
                const max = Math.max(...Object.values(stats?.byLevel || {}), 1);
                const pct = (count / max) * 100;
                return (
                  <div key={level} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: RISK_LEVEL_COLORS[level] }} />
                    <span className="text-[12px] font-bold w-[60px]" style={{ color: 'var(--text2)' }}>{RISK_LEVEL_LABELS_AR[level]}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: RISK_LEVEL_COLORS[level] }} />
                    </div>
                    <span className="text-[12px] font-mono font-bold w-[30px] text-left" style={{ color: 'var(--text-head)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── By Category + Top Countries ─── */}
      <div className="max-w-[1400px] mx-auto px-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Categories */}
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} style={{ color: '#8B5CF6' }} />
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-head)' }}>التوزيع حسب الفئة</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats?.byCategory || {}).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--bg4)' }}>
                  <span className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>{CATEGORY_LABELS_AR[cat] || cat}</span>
                  <span className="text-[14px] font-mono font-bold" style={{ color: '#8B5CF6' }}>{count}</span>
                </div>
              ))}
              {Object.keys(stats?.byCategory || {}).length === 0 && (
                <p className="text-[12px] text-center py-4 col-span-2" style={{ color: 'var(--text3)' }}>لا توجد بيانات</p>
              )}
            </div>
          </div>

          {/* Top Countries */}
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Map size={16} style={{ color: '#F59E0B' }} />
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-head)' }}>أكثر الدول ذكراً</h3>
            </div>
            <div className="space-y-2">
              {stats?.topCountries?.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'var(--bg4)' }}>
                  <span className="text-[14px] font-bold w-[24px] text-center" style={{ color: 'var(--text4)' }}>#{i + 1}</span>
                  <span className="text-[12px] font-bold flex-1" style={{ color: 'var(--text-head)' }}>{c.name}</span>
                  <span className="text-[14px] font-mono font-bold" style={{ color: '#F59E0B' }}>{c.count}</span>
                </div>
              ))}
              {(!stats?.topCountries || stats.topCountries.length === 0) && (
                <p className="text-[12px] text-center py-4" style={{ color: 'var(--text3)' }}>لا توجد بيانات</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Last 7 Days Chart ─── */}
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} style={{ color: 'var(--cyan)' }} />
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-head)' }}>النشر في آخر 7 أيام</h3>
          </div>
          <div className="flex items-end gap-2 h-[120px]">
            {stats?.last7days?.map((day, i) => {
              const max = Math.max(...(stats?.last7days?.map(d => d.count) || [1]), 1);
              const h = (day.count / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text3)' }}>{day.count}</span>
                  <div className="w-full rounded-t-md transition-all" style={{
                    height: `${Math.max(h, 4)}%`,
                    background: day.count > 0 ? 'linear-gradient(180deg, var(--cyan), rgba(0,229,255,0.3))' : 'var(--bg4)',
                  }} />
                  <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                    {new Date(day.date).toLocaleDateString('ar-SA', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card Component ───────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="glass-card p-4 rounded-xl text-center">
      <div className="flex items-center justify-center mb-2" style={{ color }}>{icon}</div>
      <div className="text-[22px] font-bold font-mono" style={{ color: 'var(--text-head)' }}>{value}</div>
      <div className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>{label}</div>
    </div>
  );
}
