// ─── Arabic Raqeeb Monitor ──────────────────────────────────
// Shows pipeline health, cycle stats, error logs for the Arabic line
// Wraps the existing raqeeb monitoring data

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye, Activity, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Zap, Database, Bot, Clock, Send, Shield,
  Loader2, Wrench, Bell, Server, Cpu,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────
interface RaqeebDashboardData {
  ok: boolean;
  status: {
    isRunning: boolean;
    lastRunTime: number;
    lastRunAgo: number;
    metricHistoryCount: number;
    healingAttemptsCount: number;
  };
  current: {
    articlesLastHour: number;
    articlesLast15Min: number;
    totalReady: number;
    totalPublished: number;
    newestArticleAgeMin: number;
    pipelineRunning: boolean;
    pipelineCycles: number;
    pipelineIdleMin: number;
    publishedToday: number;
    publishedThisHour: number;
    skipRate: number;
    pendingCount: number;
    skippedCount: number;
    aiProvidersAvailable: number;
    aiProvidersTotal: number;
    aiCascadeFailure: boolean;
    dbLatencyMs: number;
    dbStatus: string;
    uptime: number;
  } | null;
  alerts: {
    id: string;
    level: 'critical' | 'warning' | 'info';
    ruleId: string;
    message: string;
    messageAr: string;
    timestamp: number;
    selfHealingAction?: string;
  }[];
  alertsByLevel: {
    critical: number;
    warning: number;
    info: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────
function formatTimeAgo(ts: number): string {
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

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}ي ${hours}س ${mins}د`;
  if (hours > 0) return `${hours}س ${mins}د`;
  return `${mins} دقيقة`;
}

const LEVEL_CONFIG = {
  critical: { color: '#FF4D6A', bg: 'rgba(255,77,106,0.10)', border: 'rgba(255,77,106,0.20)', icon: XCircle, label: 'حرج' },
  warning: { color: '#FF9F43', bg: 'rgba(255,159,67,0.10)', border: 'rgba(255,159,67,0.20)', icon: AlertTriangle, label: 'تحذير' },
  info: { color: '#00E5FF', bg: 'rgba(0,229,255,0.10)', border: 'rgba(0,229,255,0.20)', icon: CheckCircle2, label: 'معلومات' },
};

// ─── Health Gauge Component ──────────────────────────────
function HealthGauge({ label, status, detail }: { label: string; status: 'healthy' | 'degraded' | 'down'; detail: string }) {
  const config = {
    healthy: { color: '#00C896', bg: 'rgba(0,200,150,0.10)', border: 'rgba(0,200,150,0.20)', icon: CheckCircle2, text: 'سليم' },
    degraded: { color: '#FF9F43', bg: 'rgba(255,159,67,0.10)', border: 'rgba(255,159,67,0.20)', icon: AlertTriangle, text: 'متدهور' },
    down: { color: '#FF4D6A', bg: 'rgba(255,77,106,0.10)', border: 'rgba(255,77,106,0.20)', icon: XCircle, text: 'متوقف' },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <Icon size={18} style={{ color: c.color }} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold" style={{ color: c.color }}>{label}</span>
          <Badge variant="outline" className="text-[9px] h-4 px-1.5" style={{ borderColor: c.border, color: c.color }}>{c.text}</Badge>
        </div>
        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{detail}</span>
      </div>
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────
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

// ─── Main Dashboard ──────────────────────────────────────
export default function ArMonitorPage() {
  const [data, setData] = useState<RaqeebDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts'>('overview');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/raqeeb?section=dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn('[Ar Monitor] Fetch error:', err);
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

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      const res = await fetch('/api/admin/raqeeb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.ok) {
        setTimeout(fetchData, 2000);
      }
    } catch (err) {
      console.warn(`[Ar Monitor] Action ${action} failed:`, err);
    } finally {
      setTimeout(() => setActionLoading(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.10)' }}>
            <Eye size={20} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold font-heading" style={{ color: 'var(--text)' }}>رقيب رؤى — خط الإنتاج العربي</h1>
            <p className="text-[12px]" style={{ color: 'var(--text3)' }}>جارٍ التحميل...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--bg3)' }} />)}
        </div>
      </div>
    );
  }

  const current = data?.current;
  const status = data?.status;
  const alerts = data?.alerts || [];
  const alertsByLevel = data?.alertsByLevel || { critical: 0, warning: 0, info: 0 };

  const pipelineHealth: 'healthy' | 'degraded' | 'down' = current?.pipelineRunning
    ? (current.articlesLast15Min > 0 ? 'healthy' : 'degraded')
    : 'down';
  const dbHealth: 'healthy' | 'degraded' | 'down' = current?.dbStatus === 'healthy'
    ? (current.dbLatencyMs < 500 ? 'healthy' : 'degraded')
    : 'down';
  const aiHealth: 'healthy' | 'degraded' | 'down' = current?.aiCascadeFailure
    ? 'down'
    : (current && current.aiProvidersAvailable < 3 && current.aiProvidersTotal > 3 ? 'degraded' : 'healthy');

  return (
    <div className="space-y-6" dir="rtl">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.10)', border: '1px solid rgba(0,229,255,0.20)' }}>
            <Eye size={20} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold font-heading" style={{ color: 'var(--text)' }}>
              رقيب رؤى — خط الإنتاج العربي
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold mr-2"
                style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
                locale=ar
              </span>
            </h1>
            <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
              نظام المراقبة الذكي لخط الإنتاج العربي
              {status?.isRunning && (
                <Badge className="text-[9px] mr-2 gap-1 px-1.5 py-0" style={{ background: 'rgba(0,200,150,0.10)', color: 'var(--bull)', border: '1px solid rgba(0,200,150,0.20)' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--bull)' }} />
                  نشط
                </Badge>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-[10px] gap-1.5"
            style={{ borderColor: 'rgba(0,229,255,0.20)', color: 'var(--cyan)' }}
            onClick={() => handleAction('test')}
            disabled={actionLoading === 'test'}
          >
            {actionLoading === 'test' ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            اختبار تلغرام
          </Button>
          <Button variant="outline" size="sm" className="text-[10px] gap-1.5"
            style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}
            onClick={() => handleAction('monitor')}
            disabled={actionLoading === 'monitor'}
          >
            {actionLoading === 'monitor' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            تشغيل دورة
          </Button>
          <Button variant="ghost" size="sm" className="text-[10px] gap-1"
            style={{ color: 'var(--text3)' }}
            onClick={fetchData}
          >
            <RefreshCw size={12} className={actionLoading === 'refresh' ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* ═══ Health Status Row ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <HealthGauge
          label="خط الإنتاج"
          status={pipelineHealth}
          detail={current ? `دورات: ${current.pipelineCycles} | خامل: ${current.pipelineIdleMin}د` : 'لا بيانات'}
        />
        <HealthGauge
          label="قاعدة البيانات"
          status={dbHealth}
          detail={current ? `زمن الاستجابة: ${current.dbLatencyMs}ms` : 'لا بيانات'}
        />
        <HealthGauge
          label="مزودات AI"
          status={aiHealth}
          detail={current ? `متاحة: ${current.aiProvidersAvailable}/${current.aiProvidersTotal}` : 'لا بيانات'}
        />
      </div>

      {/* ═══ Main Stats Cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          icon={Activity} label="مقالات/ساعة"
          value={current?.articlesLastHour ?? '-'}
          subValue={`${current?.articlesLast15Min ?? 0} في آخر 15 د`}
          color="#00E5FF"
        />
        <StatCard
          icon={Zap} label="منشورة اليوم"
          value={current?.publishedToday ?? '-'}
          subValue={`${current?.publishedThisHour ?? 0} في الساعة الحالية`}
          color="#00C896"
        />
        <StatCard
          icon={Shield} label="نسبة الرفض"
          value={current ? `${Math.round(current.skipRate * 100)}%` : '-'}
          subValue={`${current?.skippedCount ?? 0} مرفوضة`}
          color={current && current.skipRate > 0.4 ? '#FF4D6A' : '#FF9F43'}
        />
        <StatCard
          icon={Database} label="استجابة DB"
          value={current ? `${current.dbLatencyMs}ms` : '-'}
          subValue={current?.dbStatus === 'healthy' ? 'سليمة' : 'متدهورة'}
          color={current && current.dbLatencyMs > 500 ? '#FF4D6A' : '#8B5CF6'}
        />
        <StatCard
          icon={Clock} label="وقت التشغيل"
          value={current ? formatUptime(current.uptime) : '-'}
          subValue={`آخر دورة: ${status?.lastRunAgo ?? -1 >= 0 ? formatTimeAgo(Date.now() - (status?.lastRunAgo ?? 0) * 1000) : 'لم تبدأ'}`}
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
          <Server size={15} /> ملخص خط الإنتاج
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all"
          style={{
            background: activeTab === 'alerts' ? 'rgba(255,159,67,0.1)' : 'var(--bg3)',
            border: `1px solid ${activeTab === 'alerts' ? 'rgba(255,159,67,0.25)' : 'var(--border)'}`,
            color: activeTab === 'alerts' ? '#FF9F43' : 'var(--text3)',
          }}
        >
          <Bell size={15} /> التنبيهات ({alerts.length})
        </button>
      </div>

      {/* ═══ Overview Tab ═══ */}
      {activeTab === 'overview' && (
        <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Server size={14} style={{ color: '#00E5FF' }} />
              ملخص خط الإنتاج العربي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'إجمالي الجاهزة', value: current?.totalReady ?? '-', color: '#00E5FF' },
                { label: 'إجمالي المنشورة', value: current?.totalPublished ?? '-', color: '#00C896' },
                { label: 'المعلقة', value: current?.pendingCount ?? '-', color: '#FF9F43' },
                { label: 'المرفوضة', value: current?.skippedCount ?? '-', color: '#FF4D6A' },
                { label: 'مزودات AI', value: current ? `${current.aiProvidersAvailable}/${current.aiProvidersTotal}` : '-', color: '#8B5CF6' },
                { label: 'دورات خط الإنتاج', value: current?.pipelineCycles ?? '-', color: '#FFB800' },
                { label: 'خامل (د)', value: current?.pipelineIdleMin ?? '-', color: current && current.pipelineIdleMin > 10 ? '#FF4D6A' : '#00C896' },
                { label: 'أحدث مقالة', value: current ? `${current.newestArticleAgeMin}د` : '-', color: current && current.newestArticleAgeMin > 15 ? '#FF4D6A' : '#00E5FF' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <span className="text-[10px] block mb-1" style={{ color: 'var(--text4)' }}>{item.label}</span>
                  <span className="font-mono-price text-[18px] font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Alerts Tab ═══ */}
      {activeTab === 'alerts' && (
        alerts.length > 0 ? (
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {alerts.map(alert => {
                const lc = LEVEL_CONFIG[alert.level];
                const LevelIcon = lc.icon;
                return (
                  <div key={alert.id} className="p-3 rounded-xl" style={{ background: lc.bg, border: `1px solid ${lc.border}` }}>
                    <div className="flex items-start gap-3">
                      <LevelIcon size={16} style={{ color: lc.color, marginTop: 2 }} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5" style={{ borderColor: lc.border, color: lc.color }}>
                            {lc.label}
                          </Badge>
                          <span className="text-[10px] font-mono" style={{ color: 'var(--text4)' }}>{alert.ruleId}</span>
                          <span className="text-[10px] mr-auto" style={{ color: 'var(--text4)' }}>
                            {formatTimeAgo(alert.timestamp)}
                          </span>
                        </div>
                        <p className="text-[12px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--text2)' }}>
                          {alert.messageAr || alert.message}
                        </p>
                        {alert.selfHealingAction && (
                          <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(0,229,255,0.06)' }}>
                            <Wrench size={10} style={{ color: 'var(--cyan)' }} />
                            <span className="text-[10px]" style={{ color: 'var(--cyan)' }}>
                              إصلاح ذاتي: {alert.selfHealingAction}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardContent className="p-8 text-center">
              <CheckCircle2 size={40} style={{ color: 'var(--bull)', margin: '0 auto 12px' }} />
              <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--text)' }}>لا تنبيهات حالياً</h3>
              <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
                رقيب يراقب خط الإنتاج العربي وسيُرسل تنبيهات تلغرام عند اكتشاف أي مشكلة
              </p>
            </CardContent>
          </Card>
        )
      )}

      {/* ═══ Footer ═══ */}
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Eye size={12} style={{ color: 'var(--cyan)' }} />
          <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
            رقيب رؤى — خط الإنتاج العربي — آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
            نقاط البيانات: {status?.metricHistoryCount ?? 0}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
            محاولات إصلاح: {status?.healingAttemptsCount ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}
