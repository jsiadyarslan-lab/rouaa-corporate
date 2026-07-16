// ═══════════════════════════════════════════════════════════════
// Pipeline Guardian V2 — الحارس الذكي
// Unified smart monitor for ALL pipeline locales.
// OODA Loop: Observe → Orient → Decide → Act → Learn
// Auto-refreshes every 30s. Shows health score, issues, fix history.
// Telegram alerts via same bot as Raqeeb (TELEGRAM_ALERT_BOT_TOKEN).
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield, RefreshCw, Activity, CheckCircle2, AlertTriangle,
  XCircle, Zap, Loader2, Wrench, Globe,
  Clock, ChevronDown, ChevronUp, Send, Server,
  Database, Bot, TrendingUp, BarChart3, Eye,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────

type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

interface GuardianIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  affectedCount: number;
  autoFixable: boolean;
  fixApplied?: boolean;
  fixResult?: string;
}

interface LocaleHealth {
  locale: Locale;
  score: number;
  status: 'healthy' | 'degraded' | 'critical' | 'dead';
  totalBlocked: number;
  stageBreakdown: Record<string, number>;
  issues: GuardianIssue[];
  publishedToday: number;
  publishedThisHour: number;
  pendingCount: number;
  quotaRemaining: { hourly: number; daily: number };
}

interface GuardianFix {
  action: string;
  locale: Locale;
  affectedCount: number;
  success: boolean;
  message: string;
  level: string;
  timestamp: number;
  durationMs: number;
}

interface GuardianReport {
  timestamp: number;
  cycleNumber: number;
  locales: Record<Locale, LocaleHealth>;
  overallScore: number;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  fixesApplied: GuardianFix[];
  rootCausesFound: { id: string; pattern: string; severity: string; message: string; affectedCount: number; remediationLevel: string }[];
  durationMs: number;
}

// ─── Locale Info ────────────────────────────────────────

const LOCALE_INFO: Record<Locale, { name: string; nameAr: string; flag: string; color: string }> = {
  ar: { name: 'Arabic', nameAr: 'العربية', flag: '🇸🇦', color: '#00C896' },
  en: { name: 'English', nameAr: 'الإنجليزية', flag: '🇬🇧', color: '#00E5FF' },
  fr: { name: 'French', nameAr: 'الفرنسية', flag: '🇫🇷', color: '#8B5CF6' },
  tr: { name: 'Turkish', nameAr: 'التركية', flag: '🇹🇷', color: '#FF9F43' },
  es: { name: 'Spanish', nameAr: 'الإسبانية', flag: '🇪🇸', color: '#FFB800' },
};

const LEVEL_CONFIG = {
  critical: { color: '#FF4D6A', bg: 'rgba(255,77,106,0.10)', border: 'rgba(255,77,106,0.20)', icon: XCircle, label: 'حرج', labelEn: 'Critical' },
  warning: { color: '#FF9F43', bg: 'rgba(255,159,67,0.10)', border: 'rgba(255,159,67,0.20)', icon: AlertTriangle, label: 'تحذير', labelEn: 'Warning' },
  info: { color: '#00E5FF', bg: 'rgba(0,229,255,0.10)', border: 'rgba(0,229,255,0.20)', icon: CheckCircle2, label: 'معلومات', labelEn: 'Info' },
};

const STATUS_CONFIG = {
  healthy: { color: '#00C896', bg: 'rgba(0,200,150,0.10)', border: 'rgba(0,200,150,0.20)', icon: CheckCircle2, text: 'سليم', textEn: 'Healthy' },
  degraded: { color: '#FF9F43', bg: 'rgba(255,159,67,0.10)', border: 'rgba(255,159,67,0.20)', icon: AlertTriangle, text: 'متدهور', textEn: 'Degraded' },
  critical: { color: '#FF4D6A', bg: 'rgba(255,77,106,0.10)', border: 'rgba(255,77,106,0.20)', icon: XCircle, text: 'حرج', textEn: 'Critical' },
  dead: { color: '#FF4D6A', bg: 'rgba(255,77,106,0.15)', border: 'rgba(255,77,106,0.25)', icon: XCircle, text: 'متوقف', textEn: 'Dead' },
};

// ─── Helpers ────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 0) return 'الآن';
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `منذ ${secs} ثانية`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${Math.floor(hours / 24)} يوم`;
}

// ─── Score Ring Component ───────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const sc = STATUS_CONFIG[score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : score >= 20 ? 'critical' : 'dead'];
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg4)" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={sc.color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono-price text-[20px] font-bold" style={{ color: sc.color }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Stat Card Component ───────────────────────────────

function StatCard({ icon: Icon, label, value, subValue, color }: {
  icon: React.ElementType; label: string; value: string | number; subValue?: string; color: string;
}) {
  return (
    <Card className="border-0 overflow-hidden relative" style={{
      background: `linear-gradient(135deg, ${color}08, ${color}01)`,
      border: `1px solid ${color}18`,
    }}>
      <div className="absolute top-0 left-0 w-full h-[2px] opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
            <Icon size={16} style={{ color }} />
          </div>
        </div>
        <div className="font-mono-price text-[24px] font-bold leading-none mb-1" style={{ color }}>{value}</div>
        <span className="text-[10px] font-medium block" style={{ color: 'var(--text2)' }}>{label}</span>
        {subValue && <span className="text-[9px] block mt-0.5" style={{ color: 'var(--text4)' }}>{subValue}</span>}
      </CardContent>
    </Card>
  );
}

// ─── Locale Health Card ────────────────────────────────

function LocaleHealthCard({ health, onFix, fixing }: { health: LocaleHealth; onFix: (locale: Locale) => void; fixing: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const info = LOCALE_INFO[health.locale];
  const sc = STATUS_CONFIG[health.status];
  const StatusIcon = sc.icon;

  const criticalCount = health.issues.filter(i => i.severity === 'critical').length;
  const warningCount = health.issues.filter(i => i.severity === 'warning').length;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg3)', border: `1px solid ${sc.border}` }}>
      {/* Top color bar */}
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${sc.color}, transparent)` }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-[22px]">{info.flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{info.name}</span>
                <span className="text-[10px]" style={{ color: 'var(--text4)' }}>{info.nameAr}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusIcon size={12} style={{ color: sc.color }} />
                <span className="text-[11px] font-semibold" style={{ color: sc.color }}>{sc.text}</span>
              </div>
            </div>
          </div>
          <ScoreRing score={health.score} size={56} />
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: 'منشورة اليوم', value: health.publishedToday, color: '#00C896' },
            { label: 'هذه الساعة', value: health.publishedThisHour, color: '#00E5FF' },
            { label: 'محظورة', value: health.totalBlocked, color: health.totalBlocked > 50 ? '#FF4D6A' : '#FF9F43' },
            { label: 'معلقة', value: health.pendingCount, color: health.pendingCount > 200 ? '#FF4D6A' : '#8B5CF6' },
          ].map(item => (
            <div key={item.label} className="text-center p-2 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
              <span className="font-mono-price text-[16px] font-bold block" style={{ color: item.color }}>{item.value}</span>
              <span className="text-[8px] block mt-0.5" style={{ color: 'var(--text4)' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Stage breakdown */}
        {Object.keys(health.stageBreakdown).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {Object.entries(health.stageBreakdown)
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([stage, count]) => {
                const stageColors: Record<string, string> = {
                  fetched: '#00E5FF', content_loaded: '#8B5CF6', analyzed: '#FF9F43',
                  imaged: '#FFB800', published: '#00C896', skipped: '#FF4D6A', translated: '#8B5CF6',
                };
                const c = stageColors[stage] || '#FF9F43';
                return (
                  <span key={stage} className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${c}12`, color: c, border: `1px solid ${c}25` }}>
                    {stage}: {count}
                  </span>
                );
              })}
          </div>
        )}

        {/* Quota bar */}
        {health.quotaRemaining && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1">
              <div className="flex justify-between text-[9px] mb-0.5">
                <span style={{ color: 'var(--text4)' }}>حصة يومية متبقية</span>
                <span style={{ color: 'var(--cyan)' }}>{health.quotaRemaining.daily}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                <div className="h-full rounded-full transition-all" style={{ background: 'var(--cyan)', width: `${Math.min(100, Math.max(2, health.quotaRemaining.daily / 10))}%` }} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[9px] mb-0.5">
                <span style={{ color: 'var(--text4)' }}>حصة ساعية متبقية</span>
                <span style={{ color: '#8B5CF6' }}>{health.quotaRemaining.hourly}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                <div className="h-full rounded-full transition-all" style={{ background: '#8B5CF6', width: `${Math.min(100, Math.max(2, health.quotaRemaining.hourly))}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Issues section */}
        {health.issues.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-[12px] font-semibold w-full py-1.5 rounded-lg px-3 transition-all hover:opacity-80"
              style={{
                background: criticalCount > 0 ? 'rgba(255,77,106,0.08)' : 'rgba(255,159,67,0.08)',
                color: criticalCount > 0 ? '#FF4D6A' : '#FF9F43',
              }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{health.issues.length} مشكلة</span>
              {criticalCount > 0 && <Badge className="text-[8px] h-4 px-1.5 gap-0.5" style={{ background: 'rgba(255,77,106,0.15)', color: '#FF4D6A', border: '1px solid rgba(255,77,106,0.25)' }}>{criticalCount} حرج</Badge>}
              {warningCount > 0 && <Badge className="text-[8px] h-4 px-1.5 gap-0.5" style={{ background: 'rgba(255,159,67,0.15)', color: '#FF9F43', border: '1px solid rgba(255,159,67,0.25)' }}>{warningCount} تحذير</Badge>}
            </button>

            {expanded && (
              <div className="space-y-1.5 mt-2">
                {health.issues.map(issue => {
                  const lc = LEVEL_CONFIG[issue.severity];
                  const LevelIcon = lc.icon;
                  return (
                    <div key={issue.id} className="p-2.5 rounded-lg" style={{ background: lc.bg, border: `1px solid ${lc.border}` }}>
                      <div className="flex items-start gap-2">
                        <LevelIcon size={14} style={{ color: lc.color, marginTop: 1 }} className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <Badge variant="outline" className="text-[8px] h-4 px-1.5" style={{ borderColor: lc.border, color: lc.color }}>
                              {lc.label}
                            </Badge>
                            {issue.autoFixable && (
                              <Badge className="text-[8px] h-4 px-1.5" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
                                قابل للإصلاح
                              </Badge>
                            )}
                            {issue.fixApplied && (
                              <Badge className="text-[8px] h-4 px-1.5" style={{ background: 'rgba(0,200,150,0.1)', color: '#00C896', border: '1px solid rgba(0,200,150,0.2)' }}>
                                تم الإصلاح ✓
                              </Badge>
                            )}
                            <span className="text-[9px] font-mono mr-auto" style={{ color: 'var(--text4)' }}>
                              {issue.affectedCount} مقال
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text2)' }}>{issue.message}</p>
                          {issue.fixResult && (
                            <p className="text-[10px] mt-1" style={{ color: '#00C896' }}>✓ {issue.fixResult}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Fix button */}
        {health.status !== 'healthy' && (
          <Button
            onClick={() => onFix(health.locale)}
            disabled={fixing}
            className="w-full mt-3 gap-2 text-[12px] font-bold rounded-lg h-9"
            style={{
              background: health.status === 'critical' || health.status === 'dead' ? 'rgba(255,77,106,0.12)' : 'rgba(255,159,67,0.12)',
              color: health.status === 'critical' || health.status === 'dead' ? '#FF4D6A' : '#FF9F43',
              border: `1px solid ${health.status === 'critical' || health.status === 'dead' ? 'rgba(255,77,106,0.25)' : 'rgba(255,159,67,0.25)'}`,
            }}
          >
            {fixing ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
            إصلاح خط {info.nameAr}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────

export default function GuardianDashboard() {
  const [report, setReport] = useState<GuardianReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [fixingLocale, setFixingLocale] = useState<Locale | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'fixes' | 'rootcauses'>('overview');

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/guardian?section=dashboard');
      if (res.ok) {
        const data = await res.json();
        setReport(data.guardian);
      }
    } catch (err) {
      console.error('Guardian fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleFixLocale = async (locale: Locale) => {
    setFixing(true);
    setFixingLocale(locale);
    try {
      const res = await fetch('/api/admin/guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix-locale', locale }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        toast.success(`الحارس أصلح ${LOCALE_INFO[locale].name}: ${data.locale?.score}/100`);
      } else {
        toast.error(`فشل الإصلاح: ${data.message || data.error}`);
      }
      await fetchDashboard();
    } catch {
      toast.error('فشل طلب الإصلاح');
    } finally {
      setFixing(false);
      setFixingLocale(null);
    }
  };

  const handleRunGuardian = async () => {
    setFixing(true);
    try {
      const res = await fetch('/api/admin/guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', autoFix: true }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        toast.success(`الحارس: ${data.message}`);
      }
      await fetchDashboard();
    } catch {
      toast.error('فشل تشغيل الحارس');
    } finally {
      setFixing(false);
    }
  };

  const handleResetAll = async () => {
    if (!confirm('⚠️ سيتم إعادة تعيين جميع المقالات المحظورة في كل اللغات. متأكد؟')) return;
    setFixing(true);
    try {
      const res = await fetch('/api/admin/guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-all' }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        toast.success(`تم إعادة تعيين ${data.totalReset} مقال عبر كل اللغات`);
      }
      await fetchDashboard();
    } catch {
      toast.error('فشل إعادة التعيين');
    } finally {
      setFixing(false);
    }
  };

  const handleTestTelegram = async () => {
    try {
      const res = await fetch('/api/guardian/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ autoFix: false }) });
      const data = await res.json();
      if (data.success) {
        toast.success('تم تشغيل دورة الحارس — تحقق من تلغرام');
      } else {
        toast.error('فشل تشغيل الحارس');
      }
    } catch {
      toast.error('فشل الاتصال');
    }
  };

  // ─── Loading State ─────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.10)', border: '1px solid rgba(0,229,255,0.20)' }}>
            <Shield size={20} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold font-heading" style={{ color: 'var(--text)' }}>الحارس الذكي</h1>
            <p className="text-[12px]" style={{ color: 'var(--text3)' }}>جارٍ التحميل...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--bg3)' }} />)}
        </div>
      </div>
    );
  }

  const localeEntries = report ? (Object.entries(report.locales) as [Locale, LocaleHealth][]) : [];
  const overallSc = STATUS_CONFIG[report?.overallStatus || 'dead'];

  // Compute aggregate stats
  const totalPublished = localeEntries.reduce((s, [, h]) => s + h.publishedToday, 0);
  const totalPublishedHour = localeEntries.reduce((s, [, h]) => s + h.publishedThisHour, 0);
  const totalBlocked = localeEntries.reduce((s, [, h]) => s + h.totalBlocked, 0);
  const totalPending = localeEntries.reduce((s, [, h]) => s + h.pendingCount, 0);
  const criticalLocales = localeEntries.filter(([, h]) => h.status === 'critical' || h.status === 'dead');
  const totalCriticalIssues = localeEntries.reduce((s, [, h]) => s + h.issues.filter(i => i.severity === 'critical').length, 0);
  const totalWarningIssues = localeEntries.reduce((s, [, h]) => s + h.issues.filter(i => i.severity === 'warning').length, 0);
  const allFixes = report?.fixesApplied || [];

  return (
    <div className="space-y-6" dir="rtl">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.10)', border: '1px solid rgba(0,229,255,0.20)' }}>
            <Shield size={20} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold font-heading" style={{ color: 'var(--text)' }}>
              الحارس الذكي
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold mr-2"
                style={{ background: overallSc.bg, color: overallSc.color, border: `1px solid ${overallSc.border}` }}>
                OODA V2
              </span>
            </h1>
            <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
              نظام المراقبة الذكي لخطوط الأنابيب — راقب ← حلل ← قرر ← أصلح ← تعلّم
              {report && (
                <Badge className="text-[9px] mr-2 gap-1 px-1.5 py-0" style={{ background: overallSc.bg, color: overallSc.color, border: `1px solid ${overallSc.border}` }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: overallSc.color }} />
                  {overallSc.text}
                </Badge>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Overall score */}
          {report && (
            <div className="flex items-center gap-3 ml-3 px-4 py-2 rounded-xl" style={{ background: overallSc.bg, border: `1px solid ${overallSc.border}` }}>
              <ScoreRing score={report.overallScore} size={48} />
              <div>
                <span className="text-[10px] block" style={{ color: 'var(--text4)' }}>النتيجة الإجمالية</span>
                <span className="text-[14px] font-bold" style={{ color: overallSc.color }}>{report.overallScore}/100</span>
              </div>
            </div>
          )}
          <Button variant="outline" size="sm" className="text-[10px] gap-1.5"
            style={{ borderColor: 'rgba(0,229,255,0.20)', color: 'var(--cyan)' }}
            onClick={handleTestTelegram}>
            <Send size={12} />
            اختبار تلغرام
          </Button>
          <Button variant="outline" size="sm" className="text-[10px] gap-1.5"
            style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}
            onClick={handleRunGuardian} disabled={fixing}>
            {fixing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            تشغيل وإصلاح
          </Button>
          <Button variant="ghost" size="sm" className="text-[10px] gap-1"
            style={{ color: 'var(--text3)' }}
            onClick={fetchDashboard}>
            <RefreshCw size={12} />
          </Button>
          <Button variant="ghost" size="sm" className="text-[10px] gap-1"
            style={{ color: '#FF4D6A' }}
            onClick={handleResetAll} disabled={fixing}>
            إعادة تعيين الكل
          </Button>
        </div>
      </div>

      {/* ═══ Overall Stats ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          icon={Activity} label="منشورة اليوم (الكل)"
          value={totalPublished}
          subValue={`${totalPublishedHour} في الساعة الحالية`}
          color="#00C896"
        />
        <StatCard
          icon={AlertTriangle} label="محظورة"
          value={totalBlocked}
          subValue={totalBlocked > 500 ? 'عدد خطير!' : totalBlocked > 100 ? 'يحتاج مراقبة' : 'مقبول'}
          color={totalBlocked > 500 ? '#FF4D6A' : totalBlocked > 100 ? '#FF9F43' : '#00C896'}
        />
        <StatCard
          icon={Clock} label="معلقة"
          value={totalPending}
          subValue="قيد المعالجة"
          color="#8B5CF6"
        />
        <StatCard
          icon={XCircle} label="مشاكل حرجة"
          value={totalCriticalIssues}
          subValue={`${criticalLocales.length} خط أنابيب متأثر`}
          color={totalCriticalIssues > 0 ? '#FF4D6A' : '#00C896'}
        />
        <StatCard
          icon={Wrench} label="إصلاحات الحارس"
          value={allFixes.length}
          subValue={allFixes.length > 0 ? `${allFixes.filter(f => f.success).length} ناجحة` : 'لا إصلاحات بعد'}
          color="#FFB800"
        />
      </div>

      {/* ═══ Tab Toggle ═══ */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all"
          style={{
            background: activeTab === 'overview' ? 'var(--cyan2)' : 'var(--bg3)',
            border: `1px solid ${activeTab === 'overview' ? 'rgba(0,229,255,0.25)' : 'var(--border)'}`,
            color: activeTab === 'overview' ? 'var(--cyan)' : 'var(--text3)',
          }}
        >
          <Globe size={15} /> حالة الخطوط
        </button>
        <button
          onClick={() => setActiveTab('fixes')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all"
          style={{
            background: activeTab === 'fixes' ? 'rgba(255,184,0,0.1)' : 'var(--bg3)',
            border: `1px solid ${activeTab === 'fixes' ? 'rgba(255,184,0,0.25)' : 'var(--border)'}`,
            color: activeTab === 'fixes' ? '#FFB800' : 'var(--text3)',
          }}
        >
          <Wrench size={15} /> سجل الإصلاحات ({allFixes.length})
        </button>
        <button
          onClick={() => setActiveTab('rootcauses')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all"
          style={{
            background: activeTab === 'rootcauses' ? 'rgba(139,92,246,0.1)' : 'var(--bg3)',
            border: `1px solid ${activeTab === 'rootcauses' ? 'rgba(139,92,246,0.25)' : 'var(--border)'}`,
            color: activeTab === 'rootcauses' ? '#8B5CF6' : 'var(--text3)',
          }}
        >
          <BarChart3 size={15} /> تحليل الجذور ({report?.rootCausesFound?.length || 0})
        </button>
      </div>

      {/* ═══ Overview Tab — Locale Cards ═══ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {localeEntries.map(([locale, health]) => (
            <LocaleHealthCard
              key={locale}
              health={health}
              onFix={handleFixLocale}
              fixing={fixing && fixingLocale === locale}
            />
          ))}
        </div>
      )}

      {/* ═══ Fixes Tab ═══ */}
      {activeTab === 'fixes' && (
        allFixes.length > 0 ? (
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Wrench size={14} style={{ color: '#FFB800' }} />
                سجل إصلاحات الحارس
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {allFixes.slice().reverse().map((fix, i) => {
                    const info = LOCALE_INFO[fix.locale];
                    const successBg = fix.success ? 'rgba(0,200,150,0.08)' : 'rgba(255,77,106,0.08)';
                    const successBorder = fix.success ? 'rgba(0,200,150,0.20)' : 'rgba(255,77,106,0.20)';
                    const successColor = fix.success ? '#00C896' : '#FF4D6A';
                    return (
                      <div key={i} className="p-3 rounded-xl" style={{ background: successBg, border: `1px solid ${successBorder}` }}>
                        <div className="flex items-start gap-3">
                          <span className="text-[18px]">{info?.flag}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="outline" className="text-[8px] h-4 px-1.5" style={{ borderColor: successBorder, color: successColor }}>
                                {fix.success ? 'ناجح ✓' : 'فشل ✗'}
                              </Badge>
                              <Badge className="text-[8px] h-4 px-1.5" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}>
                                {fix.level || 'L2'}
                              </Badge>
                              <span className="text-[9px] font-mono" style={{ color: 'var(--text4)' }}>{fix.action}</span>
                              <span className="text-[9px] mr-auto" style={{ color: 'var(--text4)' }}>
                                {fix.affectedCount} مقال · {fix.durationMs}ms · {timeAgo(fix.timestamp)}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text2)' }}>{fix.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardContent className="p-8 text-center">
              <CheckCircle2 size={40} style={{ color: 'var(--bull)', margin: '0 auto 12px' }} />
              <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--text)' }}>لا إصلاحات بعد</h3>
              <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
                الحارس يراقب خطوط الأنابيب وسيتدخل تلقائياً عند اكتشاف أي مشكلة
              </p>
            </CardContent>
          </Card>
        )
      )}

      {/* ═══ Root Causes Tab ═══ */}
      {activeTab === 'rootcauses' && (
        report?.rootCausesFound && report.rootCausesFound.length > 0 ? (
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <BarChart3 size={14} style={{ color: '#8B5CF6' }} />
                تحليل الجذور — لماذا تحدث المشاكل؟
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.rootCausesFound.map((rc, i) => {
                  const lc = LEVEL_CONFIG[rc.severity as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.warning;
                  const LevelIcon = lc.icon;
                  return (
                    <div key={rc.id || i} className="p-3 rounded-xl" style={{ background: lc.bg, border: `1px solid ${lc.border}` }}>
                      <div className="flex items-start gap-3">
                        <LevelIcon size={16} style={{ color: lc.color, marginTop: 2 }} className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className="text-[8px] h-4 px-1.5" style={{ borderColor: lc.border, color: lc.color }}>
                              {lc.label}
                            </Badge>
                            <Badge className="text-[8px] h-4 px-1.5" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}>
                              {rc.remediationLevel}
                            </Badge>
                            <span className="text-[9px] font-mono" style={{ color: 'var(--text4)' }}>{rc.pattern}</span>
                            <span className="text-[9px] mr-auto" style={{ color: 'var(--text4)' }}>
                              {rc.affectedCount} مقال متأثر
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text2)' }}>{rc.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardContent className="p-8 text-center">
              <CheckCircle2 size={40} style={{ color: 'var(--bull)', margin: '0 auto 12px' }} />
              <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--text)' }}>لا مشاكل جذرية</h3>
              <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
                لم يكتشف الحارس أي أسباب جذرية للمشاكل حالياً — خطوط الأنابيب تعمل بشكل سليم
              </p>
            </CardContent>
          </Card>
        )
      )}

      {/* ═══ Footer ═══ */}
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Shield size={12} style={{ color: 'var(--cyan)' }} />
          <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
            الحارس الذكي V2 — آخر فحص: {report ? new Date(report.timestamp).toLocaleTimeString('ar-SA') : 'لم يبدأ'}
            {report && ` · ${report.durationMs}ms · دورة #${report.cycleNumber}`}
            {' · تحديث تلقائي كل 30 ثانية'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text4)' }}>
            <Send size={10} /> تلغرام: نفس بوت الرقيب
          </span>
          <span className="text-[10px] flex items-center gap-1" style={{ color: totalCriticalIssues > 0 ? '#FF4D6A' : 'var(--text4)' }}>
            {totalCriticalIssues > 0 ? <XCircle size={10} /> : <CheckCircle2 size={10} />}
            {totalCriticalIssues > 0 ? `${totalCriticalIssues} حرج` : 'سليم'}
          </span>
        </div>
      </div>
    </div>
  );
}
