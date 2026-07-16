// ─── Pipeline Monitor Component V73 ───────────────────────────
// Fixed: Maps /api/news/health response to expected component structure
// Previously expected data.db.total but API returns data.queue.total
// Also added: stuck items from recentErrors, AI providers from queue data

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PipelineStats {
  ok: boolean;
  db: {
    total: number;
    ready: number;
    byStage: Record<string, number>;
    failed: number;
    health: string;
  };
  stuck: {
    count: number;
    items: Array<{
      id: string;
      title: string;
      stage: string;
      ageMinutes: number;
    }>;
    health: string;
  };
  ai: {
    health: string;
    availableNames: string[];
  };
  orchestrator: {
    running: boolean;
    paused: boolean;
    cycles: number;
    lastCycle: string | null;
    published: number;
    errors: number;
  } | null;
}

export default function PipelineMonitor() {
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [healthRes, aiRes] = await Promise.all([
        fetch('/api/news/health').catch(err => { console.warn('[PipelineMonitor V156] Fetch failed:', err instanceof Error ? err.message : err); return null; }),
        fetch('/api/ai/status').catch(err => { console.warn('[PipelineMonitor V156] Fetch failed:', err instanceof Error ? err.message : err); return null; }),
      ]);

      if (!healthRes || !healthRes.ok) {
        throw new Error(`خطأ في الاتصال: ${healthRes?.status || 'فشل الشبكة'}`);
      }

      const healthData = await healthRes.json();

      // V73: Map health API response to the component's expected structure
      // Health API returns: { status, orchestrator, queue, recentErrors, readyArticles }
      // Component expects: { db: { total, ready, byStage, health }, stuck: { count, items, health }, ai: { health, availableNames } }
      const queue = healthData.queue || {};
      const orchestrator = healthData.orchestrator || {};
      const recentErrors = healthData.recentErrors || [];

      // Build stuck items from recentErrors
      const stuckItems = recentErrors.map((e: any) => ({
        id: e.id || '',
        title: e.error || 'خطأ غير معروف',
        stage: e.stage || 'غير معروف',
        ageMinutes: e.retries ? e.retries * 5 : 0,
      }));

      // Get AI provider names from the AI status endpoint
      let aiAvailableNames: string[] = [];
      let aiHealth = 'غير معروف';
      if (aiRes && aiRes.ok) {
        try {
          const aiData = await aiRes.json();
          if (aiData.providers) {
            aiAvailableNames = aiData.providers
              .filter((p: any) => p.available && p.directTest === 'success')
              .map((p: any) => p.provider);
          }
          aiHealth = aiAvailableNames.length > 0
            ? `${aiAvailableNames.length} مزود يعمل`
            : 'لا يوجد مزودين يعملون';
        } catch {}
      } else {
        // Fallback: estimate from queue data
        aiHealth = queue.pending > 0 || queue.ready > 0 ? 'يعمل' : 'غير معروف';
      }

      const mappedStats: PipelineStats = {
        ok: healthData.status === 'healthy' || healthData.status === 'degraded',
        db: {
          total: queue.total || 0,
          ready: queue.ready || 0,
          byStage: queue.byStage || {},
          failed: queue.failed || 0,
          health: healthData.status === 'healthy' ? 'سليم' : healthData.status === 'degraded' ? 'متدهور' : 'غير سليم',
        },
        stuck: {
          count: stuckItems.length,
          items: stuckItems,
          health: stuckItems.length === 0 ? 'لا توجد مشاكل' : `${stuckItems.length} مشكلة`,
        },
        ai: {
          health: aiHealth,
          availableNames: aiAvailableNames,
        },
        orchestrator: {
          running: orchestrator.running || false,
          paused: orchestrator.paused || false,
          cycles: orchestrator.cycles || 0,
          lastCycle: orchestrator.lastCycle || null,
          published: orchestrator.published || 0,
          errors: orchestrator.errors || 0,
        },
      };

      setStats(mappedStats);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'فشل في جلب بيانات الأنظمة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleResetStuck = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/news/cron?action=unlock');
      const data = await res.json();
      if (data.status === 'ok') {
        toast.success(data.message || 'تم إعادة تعيين المقالات العالقة بنجاح');
        fetchStats();
      } else {
        toast.error('فشل في إعادة التعيين: ' + (data.error || 'خطأ غير معروف'));
      }
    } catch (err) {
      toast.error('خطأ في الاتصال بالسيرفر');
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl p-6" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <div className="skeleton h-4 w-20 mb-2 rounded" />
              <div className="skeleton h-8 w-16 mb-2 rounded" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <div className="skeleton h-5 w-48 mb-6 rounded" />
          <div className="skeleton h-32 w-full rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <AlertTriangle size={24} className="mx-auto mb-3" style={{ color: 'var(--bear)' }} />
        <p className="text-[13px] font-medium" style={{ color: 'var(--bear)' }}>{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const stages = [
    { key: 'fetched', label: 'تم الجلب', color: 'var(--text3)' },
    { key: 'translated', label: 'تمت الترجمة', color: 'var(--cyan)' },
    { key: 'analyzed', label: 'تم التحليل', color: 'var(--purple)' },
    { key: 'imaged', label: 'تم توليد الصورة', color: 'var(--bull)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-6 shadow-xl" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>إجمالي الأخبار</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{stats.db.total}</p>
          <div className="mt-2 text-[11px]" style={{ color: 'var(--bull)' }}>{stats.db.ready} جاهزة للنشر</div>
        </div>

        <div className="rounded-2xl p-6 shadow-xl" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>المقالات العالقة</p>
          <p className="text-2xl font-bold" style={{ color: stats.stuck.count > 0 ? 'var(--gold)' : 'var(--bull)' }}>
            {stats.stuck.count}
          </p>
          <div className="mt-2 text-[11px]" style={{ color: 'var(--text3)' }}>{stats.stuck.health}</div>
        </div>

        <div className="rounded-2xl p-6 shadow-xl" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>ذكاء اصطناعي</p>
          <p className="text-sm font-medium truncate" style={{ color: stats.ai.availableNames.length > 0 ? 'var(--bull)' : 'var(--text4)' }}>
            {stats.ai.availableNames.join(', ') || 'لا يوجد'}
          </p>
          <div className="mt-2 text-[11px]" style={{ color: 'var(--text3)' }}>{stats.ai.health}</div>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="rounded-2xl p-6 shadow-xl" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <h3 className="text-[13px] font-bold mb-6" style={{ color: 'var(--text)' }}>توزيع المقالات حسب المرحلة</h3>
        <div className="flex items-end min-h-[120px] sm:min-h-[160px] gap-2 mb-4">
          {stages.map(stage => {
            const count = stats.db.byStage[stage.key] || 0;
            const totalForHeight = Math.max(stats.db.total, 1);
            const height = totalForHeight > 0 ? (count / totalForHeight) * 100 : 0;
            return (
              <div key={stage.key} className="flex-1 flex flex-col items-center gap-2 group relative">
                <span className="font-mono-price text-[11px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text3)' }}>
                  {count}
                </span>
                <div
                  className="w-full rounded-t-lg transition-all duration-500 opacity-80 group-hover:opacity-100 shadow-lg"
                  style={{
                    height: `${Math.max(height, 5)}%`,
                    background: `linear-gradient(180deg, ${stage.color}, ${stage.color}66)`,
                    boxShadow: `0 0 8px ${stage.color}30`,
                  }}
                />
                <span className="text-[11px] text-center leading-tight h-8 flex items-center" style={{ color: 'var(--text3)' }}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stuck List & Reset */}
      <div className="rounded-2xl p-6 shadow-xl" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>المقالات التي تحتاج انتباه</h3>
          {stats.stuck.count > 0 && (
            confirmReset ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: 'var(--text3)' }}>تأكيد؟</span>
                <button
                  onClick={handleResetStuck}
                  disabled={resetting}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50"
                  style={{ background: 'rgba(239,83,80,0.12)', border: '1px solid rgba(239,83,80,0.2)', color: 'var(--bear)' }}
                >
                  {resetting ? 'جاري...' : 'نعم'}
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
                  style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text3)' }}
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="px-4 py-2 rounded-lg text-[11px] font-bold transition-all"
                style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)', color: 'var(--gold)' }}
              >
                إعادة تعيين الكل
              </button>
            )
          )}
        </div>

        {stats.stuck.count > 0 ? (
          <div className="space-y-3">
            {stats.stuck.items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] truncate mb-1" style={{ color: 'var(--text)' }}>{item.title}</p>
                  <div className="flex gap-2">
                    <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg4)', color: 'var(--text3)' }}>
                      المرحلة: {item.stage}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,184,0,0.08)', color: 'var(--gold)' }}>
                      منذ {item.ageMinutes} دقيقة
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: 'var(--bull)' }}>
            <CheckCircle2 size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-[11px] opacity-60">كل شيء يعمل بسلاسة! لا يوجد مقالات عالقة.</p>
          </div>
        )}
      </div>
    </div>
  );
}
