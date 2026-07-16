'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Newspaper, RefreshCw, Loader2, CheckCircle2, XCircle,
  Activity, Clock, AlertTriangle, TrendingUp, Database,
  Zap, Globe, ExternalLink, Edit3, Trash2, Eye, Save, X,
  Cpu, BarChart3, Layers, Settings, Sparkles, FileText,
  Server, Shield, AlertCircle, ChevronRight,
} from 'lucide-react';
import { AnalyticsTab } from '@/components/agency/AnalyticsTab';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AgencyStats {
  total: number; fetched: number; drafted: number; published: number; failed: number;
  publishedToday: number; publishedThisHour: number;
  sourceBreakdown?: Record<string, number>;
  providerBreakdown?: Record<string, number>;
}

interface AgencyEventRow {
  id: string; sourceId: string; sourceName: string | null;
  eventType: string; title: string; draftTitle: string | null;
  status: string; category: string | null; llmProvider: string | null;
  newsItemId: string | null; publishedAt: string | null; createdAt: string;
  lastError: string | null;
}

interface RawSource {
  sourceId?: string;
  sourceName?: string;
  rawContent?: string;
  title?: string;
  url?: string;
  externalId?: string;
}

interface ArticleDetail {
  id: string; title: string; titleAr: string; summary: string; summaryAr: string;
  content: string; contentAr: string; category: string; sentiment: string;
  impactLevel: string; imageUrl: string | null; publishedAt: string | null;
  aiAnalysis: string | null;
  rawSource?: RawSource | null;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  published: { bg: 'rgba(16,185,129,0.15)', text: '#10b981', label: 'منشور', icon: CheckCircle2 },
  failed: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', label: 'فشل', icon: XCircle },
  fetched: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', label: 'مُجلوب', icon: Globe },
  drafted: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', label: 'مُحرَّر', icon: Edit3 },
};

const SOURCE_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  DB: { color: '#8b5cf6', label: 'قاعدة البيانات', icon: Database },
  FedRSS: { color: '#3b82f6', label: 'RSS رسمي', icon: Globe },
  SEC: { color: '#f97316', label: 'SEC EDGAR', icon: FileText },
  WorldBank: { color: '#06b6d4', label: 'البنك الدولي', icon: Server },
  FRED: { color: '#ef4444', label: 'FRED', icon: BarChart3 },
};

const CATEGORY_COLORS: Record<string, string> = {
  economy: '#3b82f6', stocks: '#10b981', crypto: '#f7931a',
  commodities: '#f59e0b', forex: '#8b5cf6', central_banks: '#ec4899',
};

const CATEGORY_LABELS: Record<string, string> = {
  economy: 'اقتصاد', stocks: 'أسهم', crypto: 'كريبتو',
  commodities: 'سلع', forex: 'عملات', central_banks: 'بنوك مركزية',
};

// ═══════════════════════════════════════════════════════════════
// Stat Card Component
// ═══════════════════════════════════════════════════════════════
function StatCard({ icon: Icon, label, value, color, sublabel }: {
  icon: any; label: string; value: number | string; color: string; sublabel?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl p-4 transition-all hover:scale-[1.02]"
      style={{ background: 'rgba(21,26,34,0.8)', border: '1px solid rgba(42,49,60,0.8)', backdropFilter: 'blur(10px)' }}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10" style={{ background: color, filter: 'blur(30px)' }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        </div>
        <div className="text-2xl font-bold text-white">{value}</div>
        {sublabel && <div className="text-[10px] text-gray-500 mt-1">{sublabel}</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Source Badge Component
// ═══════════════════════════════════════════════════════════════
function SourceBadge({ sourceId }: { sourceId: string }) {
  const config = SOURCE_CONFIG[sourceId] || { color: '#666', label: sourceId, icon: Server };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
      style={{ background: `${config.color}20`, color: config.color, border: `1px solid ${config.color}30` }}>
      <config.icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// Event Row Component
// ═══════════════════════════════════════════════════════════════
function EventRow({ event, onView, onEdit, onDelete }: {
  event: AgencyEventRow;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const st = STATUS_CONFIG[event.status] || STATUS_CONFIG.failed;
  const StatusIcon = st.icon;
  const catColor = CATEGORY_COLORS[event.category || ''] || '#666';
  const catLabel = CATEGORY_LABELS[event.category || ''] || event.category || '';

  return (
    <div className="group rounded-lg p-3 transition-all hover:bg-[rgba(42,49,60,0.3)]"
      style={{ background: 'rgba(11,14,20,0.6)', border: '1px solid rgba(42,49,60,0.6)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
              style={{ background: st.bg, color: st.text, border: `1px solid ${st.text}30` }}>
              <StatusIcon className="w-3 h-3" />
              {st.label}
            </span>
            <SourceBadge sourceId={event.sourceId} />
            {catLabel && (
              <span className="px-2 py-0.5 text-[10px] rounded font-medium"
                style={{ background: `${catColor}20`, color: catColor, border: `1px solid ${catColor}30` }}>
                {catLabel}
              </span>
            )}
            {event.llmProvider && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                <Cpu className="w-3 h-3" /> {event.llmProvider}
              </span>
            )}
          </div>
          {/* Title */}
          <div className="text-sm text-gray-200 truncate font-medium">
            {event.draftTitle || event.title}
          </div>
          {/* Error */}
          {event.lastError && (
            <div className="text-[11px] text-red-400 mt-1 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span className="truncate">{event.lastError.slice(0, 150)}</span>
            </div>
          )}
          {/* Time */}
          <div className="text-[10px] text-gray-500 mt-1">
            {new Date(event.createdAt).toLocaleString('ar', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {event.newsItemId && (
            <>
              <button onClick={() => onView(event.newsItemId!)}
                className="p-1.5 rounded hover:bg-blue-500/20 transition-colors" title="عرض">
                <Eye className="w-4 h-4 text-blue-400" />
              </button>
              <button onClick={() => onEdit(event.newsItemId!)}
                className="p-1.5 rounded hover:bg-amber-500/20 transition-colors" title="تعديل">
                <Edit3 className="w-4 h-4 text-amber-400" />
              </button>
              <button onClick={() => onDelete(event.newsItemId!)}
                className="p-1.5 rounded hover:bg-red-500/20 transition-colors" title="حذف">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Article View Dialog (with raw source comparison)
// ═══════════════════════════════════════════════════════════════
function ArticleViewDialog({ article, onClose }: {
  article: ArticleDetail | null;
  onClose: () => void;
}) {
  if (!article) return null;

  const parsedAnalysis = (() => {
    try { return JSON.parse(article.aiAnalysis || '{}'); } catch { return {}; }
  })();

  return (
    <Dialog open={!!article} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        style={{ background: '#0B0E14', border: '1px solid #2A313C' }}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-400" />
            عرض المقال
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-4 pr-2">
          {/* Image */}
          {article.imageUrl && (
            <img src={article.imageUrl} alt="" className="w-full rounded-lg max-h-56 object-cover" />
          )}

          {/* Title */}
          <div>
            <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">العنوان</div>
            <div className="text-lg font-bold text-white leading-relaxed">{article.titleAr}</div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2 py-1 rounded" style={{ background: `${CATEGORY_COLORS[article.category || ''] || '#666'}20`, color: CATEGORY_COLORS[article.category || ''] || '#666' }}>
              {CATEGORY_LABELS[article.category || ''] || article.category}
            </span>
            <span className="px-2 py-1 rounded bg-gray-700/30 text-gray-300">
              {article.sentiment === 'positive' ? 'إيجابي' : article.sentiment === 'negative' ? 'سلبي' : 'محايد'}
            </span>
            <span className="px-2 py-1 rounded bg-gray-700/30 text-gray-300">
              تأثير: {article.impactLevel === 'high' ? 'عالي' : article.impactLevel === 'medium' ? 'متوسط' : 'منخفض'}
            </span>
          </div>

          {/* Summary */}
          <div>
            <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">الملخص</div>
            <div className="text-sm text-gray-300 leading-relaxed">{article.summaryAr}</div>
          </div>

          {/* Content (news body) */}
          <div>
            <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide flex items-center gap-1">
              <FileText className="w-3 h-3" /> المحتوى (الخبر المنشور)
            </div>
            <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed p-3 rounded-lg"
              style={{ background: 'rgba(21,26,34,0.6)', border: '1px solid rgba(42,49,60,0.5)' }}>
              {article.contentAr}
            </div>
          </div>

          {/* Analysis [1]-[6] */}
          {parsedAnalysis.fullContent && (
            <div>
              <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide flex items-center gap-1">
                <BarChart3 className="w-3 h-3" /> التحليل [1]-[6]
              </div>
              <div className="text-sm text-gray-300 whitespace-pre-wrap p-3 rounded-lg leading-relaxed"
                style={{ background: 'rgba(21,26,34,0.6)', border: '1px solid rgba(42,49,60,0.5)' }}>
                {parsedAnalysis.fullContent}
              </div>
            </div>
          )}

          {/* Raw Source (for comparison) */}
          {article.rawSource && article.rawSource.rawContent && (
            <div>
              <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-2">
                <Database className="w-3 h-3" />
                <span>الخبر الخام (المصدر الأصلي للمقارنة)</span>
                {article.rawSource.sourceId && <SourceBadge sourceId={article.rawSource.sourceId} />}
              </div>
              <div className="text-xs text-gray-400 whitespace-pre-wrap p-3 rounded-lg font-mono leading-relaxed"
                style={{
                  background: 'rgba(11,14,20,0.8)',
                  border: '1px dashed rgba(212,175,55,0.3)',
                  maxHeight: '350px',
                  overflowY: 'auto',
                }}>
                {article.rawSource.rawContent}
              </div>
              {article.rawSource.url && (
                <a href={article.rawSource.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors">
                  <ExternalLink className="w-3 h-3" /> الرابط الأصلي
                </a>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Dashboard Page
// ═══════════════════════════════════════════════════════════════
export default function AgencyDashboardPage() {
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [agencyLimits, setAgencyLimits] = useState<{ hourly: number; daily: number }>({ hourly: 15, daily: 100 });
  const [events, setEvents] = useState<AgencyEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'published' | 'failed' | 'fetched' | 'drafted'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [editingArticle, setEditingArticle] = useState<ArticleDetail | null>(null);
  const [editForm, setEditForm] = useState({ titleAr: '', summaryAr: '', contentAr: '', category: '', sentiment: '', impactLevel: '' });
  const [viewingArticle, setViewingArticle] = useState<ArticleDetail | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/agency-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setEvents(data.recentEvents || []);
      }
    } catch { } finally { setLoading(false); }
  }, []);

  // V1170: Fetch agency limits from DB on page load
  const fetchAgencyLimits = useCallback(async () => {
    try {
      const res = await fetch('/api/agency-limits?key=ai-news-cron');
      if (res.ok) {
        const data = await res.json();
        if (data.hourly) setAgencyLimits({ hourly: data.hourly, daily: data.daily });
      }
    } catch { }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchAgencyLimits();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchAgencyLimits]);

  const runCycle = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/agency-cron?key=ai-news-cron&hours=6', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        toast.success(`الدورة اكتملت: ${data.published || 0} منشور، ${data.failed || 0} فشل`);
        fetchStats();
      } else { toast.error('فشل تشغيل الدورة'); }
    } catch { toast.error('خطأ في التشغيل'); }
    finally { setRunning(false); }
  };

  const viewArticle = async (newsItemId: string) => {
    try {
      const res = await fetch(`/api/agency-manage?id=${newsItemId}`);
      if (res.ok) {
        const data = await res.json();
        setViewingArticle(data);
      }
    } catch { toast.error('فشل جلب المقال'); }
  };

  const editArticle = async (newsItemId: string) => {
    try {
      const res = await fetch(`/api/agency-manage?id=${newsItemId}`);
      if (res.ok) {
        const data: ArticleDetail = await res.json();
        setEditingArticle(data);
        setEditForm({
          titleAr: data.titleAr || '', summaryAr: data.summaryAr || '',
          contentAr: data.contentAr || '', category: data.category || '',
          sentiment: data.sentiment || '', impactLevel: data.impactLevel || '',
        });
      }
    } catch { toast.error('فشل جلب المقال للتعديل'); }
  };

  const saveEdit = async () => {
    if (!editingArticle) return;
    try {
      const res = await fetch('/api/agency-manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingArticle.id, ...editForm }),
      });
      if (res.ok) { toast.success('تم حفظ التعديلات'); setEditingArticle(null); fetchStats(); }
      else { toast.error('فشل الحفظ'); }
    } catch { toast.error('خطأ في الحفظ'); }
  };

  const deleteArticle = async (articleId: string) => {
    try {
      const res = await fetch(`/api/agency-manage?id=${articleId}`, { method: 'DELETE' });
      if (res.ok) { toast.success('تم حذف المقال'); setDeleteConfirm(null); fetchStats(); }
      else { toast.error('فشل الحفظ'); }
    } catch { toast.error('خطأ في الحذف'); }
  };

  // Filter events by status AND source
  const filteredEvents = events.filter(e => {
    const statusMatch = filter === 'all' || e.status === filter;
    const sourceMatch = sourceFilter === 'all' || e.sourceId === sourceFilter;
    return statusMatch && sourceMatch;
  });

  // Calculate source breakdown from events
  const sourceBreakdown = events.reduce((acc, e) => {
    acc[e.sourceId] = (acc[e.sourceId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ background: '#0B0E14' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#059669' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-5" style={{ background: '#0B0E14', color: '#fff' }}>
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #059669, #d4af37)' }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">وكالة رؤى المالية</h1>
            <p className="text-xs text-gray-400">وكيل نشر مستقل — جلب → تحرير → تحليل → صورة → نشر</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats && (
            <div className="text-xs text-gray-400 px-3 py-2 rounded-lg" style={{ background: 'rgba(21,26,34,0.6)', border: '1px solid rgba(42,49,60,0.6)' }}>
              <Clock className="w-3 h-3 inline ml-1" />
              {stats.publishedThisHour}/10 هذه الساعة
            </div>
          )}
          <Button onClick={runCycle} disabled={running}
            style={{ background: running ? 'rgba(5,150,105,0.5)' : 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none' }}
            className="flex items-center gap-2 shadow-lg">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {running ? 'جاري...' : 'تشغيل دورة'}
          </Button>
        </div>
      </div>

      {/* ═══ Stats Grid ═══ */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard icon={Database} label="إجمالي" value={stats.total} color="#6366f1" />
          <StatCard icon={Globe} label="مُجلوبة" value={stats.fetched} color="#3b82f6" />
          <StatCard icon={Edit3} label="مُحرَّرة" value={stats.drafted} color="#f59e0b" />
          <StatCard icon={CheckCircle2} label="منشورة" value={stats.published} color="#10b981" />
          <StatCard icon={XCircle} label="فاشلة" value={stats.failed} color="#ef4444" />
          <StatCard icon={TrendingUp} label="اليوم" value={stats.publishedToday} color="#d4af37" />
          <StatCard icon={Clock} label="الساعة" value={stats.publishedThisHour} color="#8b5cf6" sublabel="حد 10/ساعة" />
        </div>
      )}

      {/* ═══ Source Breakdown Bar ═══ */}
      {Object.keys(sourceBreakdown).length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(21,26,34,0.6)', border: '1px solid rgba(42,49,60,0.6)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">توزيع المصادر (آخر {events.length} حدث)</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(sourceBreakdown).map(([source, count]) => {
              const config = SOURCE_CONFIG[source] || { color: '#666', label: source, icon: Server };
              const pct = (count / events.length * 100).toFixed(0);
              return (
                <div key={source} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: `${config.color}15`, border: `1px solid ${config.color}30` }}>
                  <config.icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                  <span className="text-xs" style={{ color: config.color }}>{config.label}</span>
                  <span className="text-xs text-gray-400">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Tabs ═══ */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList style={{ background: 'rgba(21,26,34,0.6)', border: '1px solid rgba(42,49,60,0.6)' }}>
          <TabsTrigger value="events" style={{ color: '#fff' }}>
            <Activity className="w-4 h-4 ml-1" /> الأحداث
          </TabsTrigger>
          <TabsTrigger value="sources" style={{ color: '#fff' }}>
            <Layers className="w-4 h-4 ml-1" /> المصادر
          </TabsTrigger>
          <TabsTrigger value="analytics" style={{ color: '#fff' }}>
            <BarChart3 className="w-4 h-4 ml-1" /> تحليلات المصادر
          </TabsTrigger>
          <TabsTrigger value="info" style={{ color: '#fff' }}>
            <Settings className="w-4 h-4 ml-1" /> معلومات
          </TabsTrigger>
        </TabsList>

        {/* ═══ Events Tab ═══ */}
        <TabsContent value="events" className="space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filters */}
            <div className="flex gap-1.5 p-1 rounded-lg" style={{ background: 'rgba(21,26,34,0.6)', border: '1px solid rgba(42,49,60,0.6)' }}>
              {(['all', 'published', 'failed', 'fetched', 'drafted'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: filter === f ? 'rgba(5,150,105,0.2)' : 'transparent',
                    color: filter === f ? '#10b981' : '#9ca3af',
                    border: filter === f ? '1px solid rgba(5,150,105,0.4)' : '1px solid transparent',
                  }}>
                  {f === 'all' ? 'الكل' : f === 'published' ? 'منشورة' : f === 'failed' ? 'فاشلة' : f === 'fetched' ? 'مُجلوبة' : 'مُحرَّرة'}
                  <span className="text-gray-500 mr-1">
                    ({f === 'all' ? events.length : events.filter(e => e.status === f).length})
                  </span>
                </button>
              ))}
            </div>
            {/* Source filters */}
            <div className="flex gap-1.5 p-1 rounded-lg" style={{ background: 'rgba(21,26,34,0.6)', border: '1px solid rgba(42,49,60,0.6)' }}>
              <button onClick={() => setSourceFilter('all')}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: sourceFilter === 'all' ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: sourceFilter === 'all' ? '#6366f1' : '#9ca3af',
                }}>
                كل المصادر
              </button>
              {Object.keys(sourceBreakdown).map(s => (
                <button key={s} onClick={() => setSourceFilter(s)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: sourceFilter === s ? `${SOURCE_CONFIG[s]?.color || '#666'}20` : 'transparent',
                    color: sourceFilter === s ? SOURCE_CONFIG[s]?.color || '#666' : '#9ca3af',
                  }}>
                  {SOURCE_CONFIG[s]?.label || s}
                </button>
              ))}
            </div>
          </div>

          {/* Events List */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(21,26,34,0.4)', border: '1px solid rgba(42,49,60,0.6)' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(42,49,60,0.6)' }}>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: '#059669' }} />
                <span className="text-sm font-medium text-white">آخر الأحداث</span>
                <span className="text-xs text-gray-500">({filteredEvents.length})</span>
              </div>
            </div>
            <div className="p-3">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <div className="text-sm">لا توجد أحداث</div>
                </div>
              ) : (
                <ScrollArea className="h-[550px]">
                  <div className="space-y-2">
                    {filteredEvents.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        onView={viewArticle}
                        onEdit={editArticle}
                        onDelete={(id) => setDeleteConfirm(id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══ Sources Tab ═══ */}
        <TabsContent value="sources">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'قاعدة البيانات (DB)', count: '5 collectors', color: '#8b5cf6', icon: Database, items: 'أسهم (gainers/losers/signals), عملات, كريبتو, مخاطر جيوسياسية, ملخص أسواق, أحداث اقتصادية' },
              { label: 'RSS رسمي', count: '57 مصدر', color: '#3b82f6', icon: Globe, items: 'Fed, ECB, BoE, BoC, Riksbank, BIS, FSB, CNBC, WSJ, NYT, BBC, FT, Sky News Arabia, Al Jazeera' },
              { label: 'SEC EDGAR', count: '16 شركة', color: '#f97316', icon: FileText, items: 'AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, META, INTC, AMD, NFLX, BAC, JPM, V, JNJ, WMT, DIS' },
              { label: 'FRED API', count: '10 مؤشرات', color: '#ef4444', icon: BarChart3, items: 'GDP, CPI, UNRATE, FEDFUNDS, DGS10, DGS2, DCOILWTICO, GOLDAMGBD228NLBM, EXUSEU, VIXCLS' },
              { label: 'البنك الدولي', count: '5 مؤشرات', color: '#06b6d4', icon: Server, items: 'GDP growth, Inflation, Unemployment, Exports, Imports — 10 دول' },
              { label: 'صور AI', count: 'Cloudflare → Gemini → Prodia', color: '#d4af37', icon: Sparkles, items: 'توليد صورة لكل مقال + رفع R2 (لا base64 في DB)' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-4 transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(21,26,34,0.6)', border: '1px solid rgba(42,49,60,0.6)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
                      <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <span className="text-sm font-medium text-white">{s.label}</span>
                  </div>
                </div>
                <div className="text-xs mb-2" style={{ color: s.color }}>{s.count}</div>
                <div className="text-[11px] text-gray-400 leading-relaxed">{s.items}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ═══ Analytics Tab ═══ */}
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>

        {/* ═══ Info Tab ═══ */}
        <TabsContent value="info">
          <div className="space-y-3">
            {[
              { step: '1', title: 'الجلب (Collect)', color: '#3b82f6', icon: Globe,
                desc: '5 collectors من DB (أسهم، عملات، كريبتو، مخاطر، أحداث) + 57 RSS + SEC EDGAR + FRED + World Bank. الأولوية لـ DB (مصدر حصري).' },
              { step: '2', title: 'التحرير (Draft)', color: '#f59e0b', icon: Edit3,
                desc: 'قراءة السياق الداخلي → بناء prompt عربي → LLM (ai-provider.ts, 22+ مزود) → فصل JSON (خبر + تحليل [1]-[6]) → numeric guard → quality gates' },
              { step: '3', title: 'النشر (Publish)', color: '#10b981', icon: CheckCircle2,
                desc: 'cross-pipeline dedup → توليد صورة AI → رفع R2 (لا base64) → db.newsItem.create → source="محرر رؤى الذكي" → processingStage="imaged"' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-4 flex items-start gap-4"
                style={{ background: 'rgba(21,26,34,0.6)', border: '1px solid rgba(42,49,60,0.6)' }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
                  style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}>
                  {s.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    <span className="text-sm font-semibold text-white">{s.title}</span>
                  </div>
                  <div className="text-xs text-gray-400 leading-relaxed">{s.desc}</div>
                </div>
              </div>
            ))}

            {/* Guarantees */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4" style={{ color: '#d4af37' }} />
                <span className="text-sm font-semibold" style={{ color: '#d4af37' }}>الضمانات</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-300">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> حد ذاتي قابل للتعديل (انظر أدناه)</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> لا مساس بالأنابيب (processingStage="imaged")</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> cross-pipeline dedup (URL check)</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> numeric guard (منع الأرقام المخترعة)</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> تنظيف تلقائي (failed &gt;24h, published &gt;7d)</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> لا base64 في DB (R2 أو null فقط)</div>

                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> cron تلقائي كل 10 دقائق</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> fallback 22+ مزود LLM</div>
              </div>
            </div>

            {/* ─── V1164: Agency Limits Control — outside the grid ─── */}
            <div className="rounded-xl p-4 mt-3" style={{ background: 'rgba(21,26,34,0.6)', border: '1px solid rgba(42,49,60,0.6)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4" style={{ color: '#059669' }} />
                <span className="text-sm font-semibold text-white">حدود إنتاج الوكيل</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">حد الساعة</label>
                  <Input
                    type="number"
                    id="agency-hourly-limit"
                    min={1}
                    max={100}
                    value={agencyLimits.hourly}
                    onChange={(e) => setAgencyLimits({ ...agencyLimits, hourly: parseInt(e.target.value) || 15 })}
                    className="bg-[#0B0E14] border-[#2A313C] text-white"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">عدد الأخبار القصوى في الساعة</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">حد اليوم</label>
                  <Input
                    type="number"
                    id="agency-daily-limit"
                    min={1}
                    max={500}
                    value={agencyLimits.daily}
                    onChange={(e) => setAgencyLimits({ ...agencyLimits, daily: parseInt(e.target.value) || 100 })}
                    className="bg-[#0B0E14] border-[#2A313C] text-white"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">عدد الأخبار القصوى في اليوم</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const xhr = new XMLHttpRequest();
                  xhr.open('PUT', '/api/agency-limits?key=ai-news-cron', true);
                  xhr.setRequestHeader('Content-Type', 'application/json');
                  xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                      if (xhr.status === 200) {
                        try {
                          const data = JSON.parse(xhr.responseText);
                          setAgencyLimits({ hourly: data.hourly, daily: data.daily });
                          alert('تم تحديث الحدود: ' + data.hourly + '/ساعة، ' + data.daily + '/يوم');
                        } catch {
                          alert('تم تحديث الحدود بنجاح');
                        }
                      } else {
                        alert('فشل: ' + xhr.status);
                      }
                    }
                  };
                  xhr.send(JSON.stringify({ hourly: agencyLimits.hourly, daily: agencyLimits.daily }));
                }}
                style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, marginTop: '12px' }}
              >
                حفظ الحدود
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ View Article Dialog ═══ */}
      <ArticleViewDialog article={viewingArticle} onClose={() => setViewingArticle(null)} />

      {/* ═══ Edit Article Dialog ═══ */}
      <Dialog open={!!editingArticle} onOpenChange={(open) => !open && setEditingArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{ background: '#0B0E14', border: '1px solid #2A313C' }}>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400" /> تعديل المقال
            </DialogTitle>
          </DialogHeader>
          {editingArticle && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">العنوان</label>
                <Input value={editForm.titleAr} onChange={(e) => setEditForm({ ...editForm, titleAr: e.target.value })}
                  style={{ background: 'rgba(11,14,20,0.8)', border: '1px solid #2A313C', color: '#fff' }} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">الملخص</label>
                <Textarea value={editForm.summaryAr} onChange={(e) => setEditForm({ ...editForm, summaryAr: e.target.value })}
                  rows={2} style={{ background: 'rgba(11,14,20,0.8)', border: '1px solid #2A313C', color: '#fff' }} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">المحتوى</label>
                <Textarea value={editForm.contentAr} onChange={(e) => setEditForm({ ...editForm, contentAr: e.target.value })}
                  rows={8} style={{ background: 'rgba(11,14,20,0.8)', border: '1px solid #2A313C', color: '#fff' }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الفئة</label>
                  <Input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    style={{ background: 'rgba(11,14,20,0.8)', border: '1px solid #2A313C', color: '#fff' }} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">المشاعر</label>
                  <Select value={editForm.sentiment} onValueChange={(v) => setEditForm({ ...editForm, sentiment: v })}>
                    <SelectTrigger style={{ background: 'rgba(11,14,20,0.8)', border: '1px solid #2A313C', color: '#fff' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: '#151A22', border: '1px solid #2A313C' }}>
                      <SelectItem value="positive">إيجابي</SelectItem>
                      <SelectItem value="negative">سلبي</SelectItem>
                      <SelectItem value="neutral">محايد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">التأثير</label>
                  <Select value={editForm.impactLevel} onValueChange={(v) => setEditForm({ ...editForm, impactLevel: v })}>
                    <SelectTrigger style={{ background: 'rgba(11,14,20,0.8)', border: '1px solid #2A313C', color: '#fff' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: '#151A22', border: '1px solid #2A313C' }}>
                      <SelectItem value="high">عالي</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="low">منخفض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setEditingArticle(null)} style={{ color: '#999' }}>
                  <X className="w-4 h-4 ml-1" /> إلغاء
                </Button>
                <Button onClick={saveEdit} style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none' }}>
                  <Save className="w-4 h-4 ml-1" /> حفظ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirmation ═══ */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-md" style={{ background: '#0B0E14', border: '1px solid #2A313C' }}>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> تأكيد الحذف
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-300 py-4">
            هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} style={{ color: '#999' }}>إلغاء</Button>
            <Button onClick={() => deleteArticle(deleteConfirm!)} style={{ background: '#ef4444', color: '#fff', border: 'none' }}>
              <Trash2 className="w-4 h-4 ml-1" /> حذف نهائي
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
