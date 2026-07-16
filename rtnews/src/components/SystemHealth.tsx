'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ShieldCheck, Database, Cpu, Wifi, AlertTriangle, Loader2 } from 'lucide-react';

interface HealthData {
  db: string;
  aiAvailable: number;
  aiTotal: number;
  responseTime: number;
  status: 'optimal' | 'degraded' | 'critical';
}

export default function SystemHealth() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        // V66: Fetch from both health and AI diagnostics for comprehensive data
        const [healthRes, aiRes] = await Promise.all([
          fetch('/api/news/health').catch(err => { console.warn('[SystemHealth V156] Fetch failed:', err instanceof Error ? err.message : err); return null; }),
          fetch('/api/ai/diagnostics').catch(err => { console.warn('[SystemHealth V156] Fetch failed:', err instanceof Error ? err.message : err); return null; }),
        ]);

        const data = healthRes ? await healthRes.json().catch(() => ({})) : {};
        const aiData = aiRes ? await aiRes.json().catch(() => ({})) : {};

        // V66: Safe access — API structure may vary. Derive AI count from diagnostics or health.
        const dbTotal = data?.queue?.total || data?.db?.total || 0;
        const aiSummary = aiData?.summary || {};
        const aiAvailable = Number(aiSummary.available || aiSummary.working || 0);
        const aiTotal = Number(aiSummary.total || 0);
        const working = Number(aiSummary.working || 0);

        setHealth({
          db: dbTotal > 0 ? 'متصل' : 'خطأ',
          aiAvailable,
          aiTotal: Math.max(aiTotal, aiAvailable),
          responseTime: data?.durationMs || 0,
          status: working > 2 ? 'optimal' as const : working > 0 ? 'degraded' as const : 'critical' as const,
        });
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'فشل في جلب بيانات صحة النظام';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <Card className="border-0 overflow-hidden" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.1)' }}>
              <Activity size={16} style={{ color: 'var(--cyan)' }} />
            </div>
            حالة وصحة النظام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-4 w-12 rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !health) {
    return (
      <Card className="border-0 overflow-hidden" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,83,80,0.1)' }}>
              <Activity size={16} style={{ color: 'var(--bear)' }} />
            </div>
            حالة وصحة النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.15)' }}>
            <AlertTriangle size={14} style={{ color: 'var(--bear)' }} />
            <span className="text-[11px] font-medium" style={{ color: 'var(--bear)' }}>
              {error || 'لا تتوفر بيانات صحة النظام حالياً'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 overflow-hidden" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.1)' }}>
            <Activity size={16} style={{ color: 'var(--cyan)' }} />
          </div>
          حالة وصحة النظام
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="space-y-3">
          {[
            { label: 'قاعدة البيانات', value: health.db, icon: Database, color: health.db === 'متصل' ? 'var(--bull)' : 'var(--bear)' },
            { label: 'مزودي الذكاء الاصطناعي', value: `${health.aiAvailable}/${health.aiTotal}`, icon: Cpu, color: 'var(--purple)' },
            { label: 'سرعة الاستجابة', value: `${health.responseTime}ms`, icon: Wifi, color: 'var(--cyan)' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <item.icon size={14} style={{ color: 'var(--text3)' }} />
                <span className="text-[11px]" style={{ color: 'var(--text2)' }}>{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold" style={{ color: item.color }}>{item.value}</span>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: item.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Warning if degraded */}
        {health.status !== 'optimal' && (
          <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.15)' }}>
            <AlertTriangle size={12} style={{ color: 'var(--bear)' }} />
            <span className="text-[11px] font-bold" style={{ color: 'var(--bear)' }}>بعض مزودي الـ AI غير متاحين حالياً</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
