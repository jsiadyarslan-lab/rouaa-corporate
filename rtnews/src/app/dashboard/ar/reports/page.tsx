// ─── Arabic Reports Production Line Dashboard ───────────────
// Wraps existing reports dashboard with locale='ar' filtering
// Shows report title, type, market impact, confidence score

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw,
  FileText, TrendingUp, TrendingDown, Minus, ChevronLeft,
  ChevronRight, X, Save, AlertTriangle,
  BarChart3, ArrowUpDown, Sparkles, Loader2, CheckCircle2,
  Wand2, Clock, Zap, BookOpen, LayoutGrid, List,
  Video, Play,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────
interface ReportItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  reportType: string;
  scope: string;
  sectors: string[];
  countries: string[];
  marketImpact: string;
  confidenceScore: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ─── Constants ─────────────────────────────────────────────
const TYPE_OPTIONS = [
  { value: 'daily', label: 'يومي' },
  { value: 'weekly', label: 'أسبوعي' },
  { value: 'monthly', label: 'شهري' },
  { value: 'quarterly', label: 'ربع سنوي' },
  { value: 'special', label: 'خاص' },
];

const IMPACT_OPTIONS = [
  { value: 'bullish', label: 'صعودي', color: 'var(--bull)' },
  { value: 'bearish', label: 'هبوطي', color: 'var(--bear)' },
  { value: 'neutral', label: 'محايد', color: 'var(--gold)' },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPE_OPTIONS.map(o => [o.value, o.label]));
const IMPACT_LABELS: Record<string, string> = Object.fromEntries(IMPACT_OPTIONS.map(o => [o.value, o.label]));

// ─── Main Component ────────────────────────────────────────
export default function ArReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'title'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modal state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Video generation state
  const [generatingVideoId, setGeneratingVideoId] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoResults, setVideoResults] = useState<Record<string, { url: string; error?: string }>>({});

  // ─── Data Fetching ────────────────────────────────────────
  const fetchReports = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        locale: 'ar',
      });
      if (typeFilter !== 'all') params.set('reportType', typeFilter);
      if (publishedFilter === 'published') params.set('isPublished', 'true');
      else if (publishedFilter === 'draft') params.set('isPublished', 'false');

      const res = await fetch(`/api/reports/manage?${params}`);
      const data = await res.json();
      if (data.reports) {
        setReports(data.reports);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      toast.error('فشل تحميل التقارير');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, publishedFilter]);

  useEffect(() => { fetchReports(1); }, [fetchReports]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ─── Filtered & sorted reports ─────────────────────────────
  const filteredReports = (() => {
    let result = [...reports];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'date') return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (sortBy === 'confidence') return dir * (a.confidenceScore - b.confidenceScore);
      if (sortBy === 'title') return dir * a.title.localeCompare(b.title, 'ar');
      return 0;
    });
    return result;
  })();

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const togglePublish = async (report: ReportItem) => {
    try {
      const res = await fetch('/api/reports/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: report.id, isPublished: !report.isPublished }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(report.isPublished ? 'تم إلغاء نشر التقرير' : 'تم نشر التقرير');
        fetchReports(pagination.page);
      } else {
        toast.error(data.error || 'فشل تحديث حالة النشر');
      }
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/reports/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم حذف التقرير بنجاح');
        setDeleteConfirm(null);
        fetchReports(pagination.page);
      } else {
        toast.error(data.error || 'فشل حذف التقرير');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  // ─── Video Generation ────────────────────────────────
  const handleGenerateVideo = async (reportId: string) => {
    setGeneratingVideoId(reportId);
    setVideoProgress(0);

    // Simulate progress
    let p = 0;
    const interval = setInterval(() => {
      p = Math.min(p + Math.random() * 8, 90);
      setVideoProgress(Math.round(p));
    }, 2000);

    try {
      const res = await fetch(`/api/economic-reports/${reportId}/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      clearInterval(interval);
      setVideoProgress(100);

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast.success('تم توليد الفيديو بنجاح!');
          setVideoResults(prev => ({ ...prev, [reportId]: { url: data.videoUrl } }));
        } else {
          toast.error(data.error || 'فشل توليد الفيديو');
          setVideoResults(prev => ({ ...prev, [reportId]: { url: '', error: data.error || 'فشل' } }));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'فشل توليد الفيديو');
        setVideoResults(prev => ({ ...prev, [reportId]: { url: '', error: errData.error || 'خطأ' } }));
      }
    } catch (err) {
      clearInterval(interval);
      toast.error('خدمة توليد الفيديو غير متاحة');
      setVideoResults(prev => ({ ...prev, [reportId]: { url: '', error: 'خدمة غير متاحة' } }));
    } finally {
      setGeneratingVideoId(null);
      setVideoProgress(0);
    }
  };

  // ─── Stats ────────────────────────────────────────────────
  const stats = {
    total: pagination.total,
    published: reports.filter(r => r.isPublished).length,
    drafts: reports.filter(r => !r.isPublished).length,
    avgConfidence: reports.length > 0 ? Math.round(reports.reduce((s, r) => s + r.confidenceScore, 0) / reports.length) : 0,
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: 'rtl' }}>
      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={22} style={{ color: 'var(--cyan)' }} />
            التقارير — خط الإنتاج العربي
            <span style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 10,
              background: 'rgba(0,229,255,0.1)',
              color: 'var(--cyan)',
              border: '1px solid rgba(0,229,255,0.2)',
              fontWeight: 700,
            }}>locale=ar</span>
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
            {stats.total} تقرير · {stats.published} منشور · {stats.drafts} مسودة
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => fetchReports(pagination.page)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px',
              background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)',
              color: 'var(--text2)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            تحديث
          </button>
        </div>
      </div>

      {/* ═══ STATS CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'إجمالي التقارير', value: stats.total, icon: FileText, color: 'var(--cyan)', bg: 'var(--cyan2)' },
          { label: 'منشورة', value: stats.published, icon: Eye, color: 'var(--bull)', bg: 'var(--bull2)' },
          { label: 'مسودات', value: stats.drafts, icon: EyeOff, color: 'var(--gold)', bg: 'var(--gold2)' },
          { label: 'متوسط الثقة', value: `${stats.avgConfidence}%`, icon: BarChart3, color: stats.avgConfidence >= 70 ? 'var(--bull)' : stats.avgConfidence >= 40 ? 'var(--gold)' : 'var(--bear)', bg: stats.avgConfidence >= 70 ? 'var(--bull2)' : stats.avgConfidence >= 40 ? 'var(--gold2)' : 'var(--bear2)' },
        ].map((stat, i) => (
          <div key={i} style={{
            padding: '14px 16px', borderRadius: '10px',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <stat.icon size={16} style={{ color: stat.color }} />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '2px' }}>{stat.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color, fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ FILTERS BAR ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        padding: '10px 14px', borderRadius: '10px',
        background: 'var(--bg3)', border: '1px solid var(--border)',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="بحث بالعنوان أو الرابط..."
            style={{
              width: '100%', padding: '7px 32px 7px 10px', borderRadius: '6px',
              background: 'var(--bg4)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: '12px', outline: 'none',
            }}
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '7px 10px', borderRadius: '6px',
            background: 'var(--bg4)', border: '1px solid var(--border)',
            color: 'var(--text2)', fontSize: '11px', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="all">كل الأنواع</option>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Published Filter */}
        <select
          value={publishedFilter}
          onChange={(e) => setPublishedFilter(e.target.value as any)}
          style={{
            padding: '7px 10px', borderRadius: '6px',
            background: 'var(--bg4)', border: '1px solid var(--border)',
            color: 'var(--text2)', fontSize: '11px', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="all">كل الحالات</option>
          <option value="published">منشور</option>
          <option value="draft">مسودة</option>
        </select>
      </div>

      {/* ═══ REPORTS TABLE ═══ */}
      <div style={{
        borderRadius: '10px', overflow: 'hidden',
        background: 'var(--bg3)', border: '1px solid var(--border)',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 90px 80px 80px 70px 90px 120px',
          gap: '8px', padding: '10px 16px',
          background: 'var(--bg4)', borderBottom: '1px solid var(--border)',
          fontSize: '10px', fontWeight: 700, color: 'var(--text3)',
          textTransform: 'uppercase', letterSpacing: '0.5px', alignItems: 'center',
        }}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => toggleSort('title')}>
            التقرير <ArrowUpDown size={10} />
          </div>
          <div>النوع</div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => toggleSort('confidence')}>
            الثقة <ArrowUpDown size={10} />
          </div>
          <div>التأثير</div>
          <div>الحالة</div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => toggleSort('date')}>
            التاريخ <ArrowUpDown size={10} />
          </div>
          <div>إجراءات</div>
          <div>فيديو</div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block', color: 'var(--cyan)' }} />
            جارٍ تحميل التقارير العربية...
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
            <FileText size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
            لا توجد تقارير عربية مطابقة
          </div>
        ) : (
          filteredReports.map((report, i) => (
            <div
              key={report.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 90px 80px 80px 70px 90px 120px',
                gap: '8px', padding: '10px 16px',
                borderBottom: i < filteredReports.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg4)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Title & Summary */}
              <div style={{ minWidth: 0 }}>
                <Link
                  href={`/reports/${report.slug}`}
                  target="_blank"
                  style={{
                    fontSize: '12px', fontWeight: 700, color: 'var(--text)',
                    textDecoration: 'none', display: 'block',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {report.title}
                </Link>
                {report.summary && (
                  <div style={{
                    fontSize: '10px', color: 'var(--text3)', marginTop: '2px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {report.summary.slice(0, 80)}{report.summary.length > 80 ? '...' : ''}
                  </div>
                )}
              </div>

              {/* Type */}
              <span style={{
                fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                background: 'var(--cyan2)', color: 'var(--cyan)', textAlign: 'center',
                border: '1px solid rgba(0,229,255,.15)',
              }}>
                {TYPE_LABELS[report.reportType] || report.reportType}
              </span>

              {/* Confidence */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '32px', height: '4px', borderRadius: '2px',
                  background: 'var(--bg5)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    width: `${report.confidenceScore}%`,
                    background: report.confidenceScore >= 70 ? 'var(--bull)' : report.confidenceScore >= 40 ? 'var(--gold)' : 'var(--bear)',
                  }} />
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 700,
                  color: report.confidenceScore >= 70 ? 'var(--bull)' : report.confidenceScore >= 40 ? 'var(--gold)' : 'var(--bear)',
                }}>
                  {report.confidenceScore}%
                </span>
              </div>

              {/* Impact */}
              <span style={{
                fontSize: '10px', fontWeight: 700,
                color: report.marketImpact === 'bullish' ? 'var(--bull)' : report.marketImpact === 'bearish' ? 'var(--bear)' : 'var(--gold)',
                display: 'flex', alignItems: 'center', gap: '3px',
              }}>
                {report.marketImpact === 'bullish' ? <TrendingUp size={11} /> : report.marketImpact === 'bearish' ? <TrendingDown size={11} /> : <Minus size={11} />}
                {IMPACT_LABELS[report.marketImpact] || report.marketImpact}
              </span>

              {/* Published Status */}
              <button
                onClick={() => togglePublish(report)}
                style={{
                  fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                  background: report.isPublished ? 'var(--bull2)' : 'var(--gold2)',
                  color: report.isPublished ? 'var(--bull)' : 'var(--gold)',
                  border: `1px solid ${report.isPublished ? 'rgba(34,197,94,.2)' : 'rgba(255,184,0,.2)'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px',
                }}
              >
                {report.isPublished ? <Eye size={10} /> : <EyeOff size={10} />}
                {report.isPublished ? 'منشور' : 'مسودة'}
              </button>

              {/* Date */}
              <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
                {new Date(report.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Link
                  href={`/reports/${report.slug}`}
                  target="_blank"
                  title="عرض"
                  style={{
                    width: '28px', height: '28px', borderRadius: '6px',
                    background: 'var(--bull2)', border: '1px solid rgba(34,197,94,.15)',
                    color: 'var(--bull)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Eye size={12} />
                </Link>
                <button
                  onClick={() => setDeleteConfirm(report.id)}
                  title="حذف"
                  style={{
                    width: '28px', height: '28px', borderRadius: '6px',
                    background: 'var(--bear2)', border: '1px solid rgba(239,83,80,.15)',
                    color: 'var(--bear)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Video Generation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {generatingVideoId === report.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Loader2 size={12} className="animate-spin" style={{ color: '#8b5cf6' }} />
                    <span style={{ fontSize: '9px', color: '#8b5cf6', fontWeight: 600 }}>{videoProgress}%</span>
                  </div>
                ) : videoResults[report.id]?.url ? (
                  <a
                    href={videoResults[report.id].url.replace('/generated/videos/', '/api/video/serve/')}
                    target="_blank"
                    title="مشاهدة الفيديو"
                    style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,.2)',
                      color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Play size={12} />
                  </a>
                ) : (
                  <button
                    onClick={() => handleGenerateVideo(report.id)}
                    title="توليد فيديو"
                    disabled={!!generatingVideoId}
                    style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,.2)',
                      color: '#3b82f6', cursor: generatingVideoId ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: generatingVideoId ? 0.4 : 1,
                    }}
                  >
                    <Video size={12} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ═══ PAGINATION ═══ */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={() => fetchReports(pagination.page - 1)}
            disabled={pagination.page <= 1}
            style={{
              padding: '6px 10px', borderRadius: '6px',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: pagination.page <= 1 ? 'var(--text4)' : 'var(--text2)',
              cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            <ChevronRight size={14} /> السابق
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text2)' }}>
            {pagination.page} / {pagination.pages}
          </span>
          <button
            onClick={() => fetchReports(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            style={{
              padding: '6px 10px', borderRadius: '6px',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: pagination.page >= pagination.pages ? 'var(--text4)' : 'var(--text2)',
              cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
              fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            التالي <ChevronLeft size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
