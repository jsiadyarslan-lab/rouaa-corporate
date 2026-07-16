'use client';

import { useState, useEffect } from 'react';
import { Bell, Info, CheckCircle2, AlertCircle, Clock, Inbox } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning';
  title: string;
  time: string;
  timestamp: number;
}

export default function SmartNotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/news/health');
        if (!res.ok) throw new Error(`خطأ: ${res.status}`);
        const data = await res.json();
        if (data.ok && data.pipeline?.recentRuns?.length > 0) {
          const apiNotifications: Notification[] = data.pipeline.recentRuns
            .slice(0, 5)
            .map((run: any) => ({
              id: `run-${run.id}`,
              type: run.status === 'completed' ? 'success' : 'warning',
              title: run.status === 'completed'
                ? `اكتملت دورة المعالجة بنجاح (${run.articlesCount} مقال)`
                : 'فشلت دورة المعالجة الأخيرة',
              time: run.startedAt ? formatTimeAgo(run.startedAt) : 'تحديث حي',
              timestamp: new Date(run.startedAt).getTime(),
            }));

          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const newOnes = apiNotifications.filter((n: Notification) => !existingIds.has(n.id));
            if (newOnes.length === 0) return prev;
            return [...newOnes, ...prev].slice(0, 10);
          });
        }
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'فشل جلب التنبيهات';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 60000);
    return () => clearInterval(interval);
  }, []);

  function formatTimeAgo(dateStr: string): string {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      if (isNaN(diff) || diff < 0) return 'الآن';
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'الآن';
      if (mins < 60) return `منذ ${mins} دقيقة`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `منذ ${hours} ساعة`;
      return `منذ ${Math.floor(hours / 24)} يوم`;
    } catch {
      return 'الآن';
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bell size={16} style={{ color: 'var(--gold)' }} />
          <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>مركز التنبيهات</h3>
        </div>
        <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg4)', color: 'var(--text3)' }}>LIVE</span>
      </div>

      {loading && notifications.length === 0 ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      ) : error && notifications.length === 0 ? (
        <div className="py-8 text-center">
          <AlertCircle size={24} className="mx-auto mb-2" style={{ color: 'var(--text4)' }} />
          <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-10 text-center">
          <Inbox size={32} className="mx-auto mb-3" style={{ color: 'var(--text4)' }} />
          <p className="text-[12px] font-medium" style={{ color: 'var(--text3)' }}>لا توجد تنبيهات حالياً</p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text4)' }}>ستظهر هنا عند تشغيل Pipeline أو حدوث أحداث مهمة</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[280px] sm:max-h-[360px] pr-4">
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="p-3 rounded-lg transition-all hover:bg-[var(--bg4)]/50" style={{
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderInlineStart: `3px solid ${n.type === 'success' ? 'var(--bull)' : n.type === 'warning' ? 'var(--bear)' : 'var(--cyan)'}`,
              }}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {n.type === 'success' && <CheckCircle2 size={14} style={{ color: 'var(--bull)' }} />}
                    {n.type === 'info' && <Info size={14} style={{ color: 'var(--cyan)' }} />}
                    {n.type === 'warning' && <AlertCircle size={14} style={{ color: 'var(--bear)' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium leading-relaxed" style={{ color: 'var(--text2)' }}>{n.title}</p>
                    <div className="flex items-center gap-1 mt-1" style={{ color: 'var(--text4)' }}>
                      <Clock size={10} />
                      <span className="text-[11px]">{n.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
