// ─── Arabic Infographics Dashboard V312 ──────────────────────
// Full management + generation UI matching English dashboard
// Added: Generate tab with source selection + generate button

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ImageIcon, Plus, Trash2, Eye, EyeOff, Search,
  Newspaper, FileText, BarChart3, ExternalLink,
  CheckCircle, XCircle, Loader2, Layers, Zap,
  RefreshCw, Activity, Clock, Sparkles, Image as ImageIconLucide,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────
interface InfographicItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  sourceType: string;
  sourceId?: string;
  sourceTitle?: string;
  category?: string;
  slides: any[];
  viewCount: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  impactScore?: number;
}

interface SourceItem {
  id: string;
  title: string;
  titleAr?: string;
  summary?: string;
  summaryAr?: string;
  category?: string;
  hasInfographic: boolean;
  createdAt: string;
}

const SOURCE_TYPES = [
  { value: 'news', label: 'أخبار مالية', icon: Newspaper, color: '#00BCD4' },
  { value: 'economic_report', label: 'تقارير اقتصادية', icon: FileText, color: '#059669' },
  { value: 'market_analysis', label: 'تحليلات السوق', icon: BarChart3, color: '#8B5CF6' },
];

export default function ArInfographicsPage() {
  // State
  const [activeTab, setActiveTab] = useState<'manage' | 'generate'>('manage');
  const [sourceType, setSourceType] = useState('news');
  const [infographics, setInfographics] = useState<InfographicItem[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  // ─── Fetch infographics with locale=ar ─────────────────────
  const fetchInfographics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/infographics?limit=50&locale=ar');
      const data = await res.json();
      setInfographics(data.infographics || []);
    } catch (err: any) {
      showMessage('error', 'فشل تحميل الإنفوغرافيك: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  // ─── Fetch Arabic sources for generation ───────────────────
  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      // Build the API URL based on source type — Arabic content only
      const sourceUrl = sourceType === 'news'
        ? '/api/news/manage?limit=30&status=published'
        : sourceType === 'economic_report'
        ? '/api/reports/manage?limit=30'
        : '/api/reports/manage?limit=30'; // market_analysis shares reports API

      const [srcRes, igRes] = await Promise.all([
        fetch(sourceUrl),
        fetch('/api/infographics?limit=100&locale=ar'),
      ]);
      const srcData = await srcRes.json();
      const igData = await igRes.json();

      // Get existing infographic sourceIds to mark "already generated"
      const existingSourceIds = new Set(
        (igData.infographics || []).map((ig: InfographicItem) => ig.sourceId).filter(Boolean)
      );

      // Extract items from API response
      let rawItems: any[] = [];
      if (sourceType === 'news') {
        rawItems = srcData.news || srcData.items || [];
        // Filter: only Arabic news (has titleAr or locale=ar)
        rawItems = rawItems.filter((s: any) => {
          const locale = s.locale;
          const hasArabicTitle = s.titleAr && s.titleAr.length > 3;
          const hasArabicChars = /[\u0600-\u06FF]/.test(s.titleAr || s.title || '');
          return locale === 'ar' || hasArabicTitle || hasArabicChars;
        });
      } else {
        // Economic reports / market analyses
        rawItems = srcData.reports || srcData.items || [];
        // Filter: Arabic reports (have Arabic content or locale=ar)
        rawItems = rawItems.filter((s: any) => {
          const locale = s.locale;
          const hasArabic = /[\u0600-\u06FF]/.test(s.title || '');
          return locale === 'ar' || hasArabic || !locale; // Default to ar if no locale
        });
      }

      const items: SourceItem[] = rawItems.map((s: any) => ({
        id: s.id,
        title: s.titleAr || s.title || 'بدون عنوان',
        titleAr: s.titleAr,
        summary: (s.summaryAr || s.summary || '').slice(0, 120),
        summaryAr: s.summaryAr,
        category: s.category || s.reportType,
        hasInfographic: existingSourceIds.has(s.id),
        createdAt: s.createdAt || s.fetchedAt,
      }));
      setSources(items);
    } catch (err: any) {
      showMessage('error', 'فشل تحميل المصادر: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [sourceType, showMessage]);

  // ─── Generate infographic ──────────────────────────────────
  const handleGenerate = async (sourceId: string) => {
    setGenerating(sourceId);
    try {
      const res = await fetch('/api/infographics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType, sourceId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'فشل التوليد' }));
        showMessage('error', errData.error || `فشل التوليد (${res.status})`);
        return;
      }

      const data = await res.json();
      showMessage('success', `تم توليد الإنفوغرافيك: ${data.infographic?.title || ''}`);
      fetchSources(); // Refresh to show "Generated" badge
    } catch (err: any) {
      showMessage('error', 'فشل توليد الإنفوغرافيك: ' + err.message);
    } finally {
      setGenerating(null);
    }
  };

  // ─── Toggle publish ────────────────────────────────────────
  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      const res = await fetch(`/api/infographics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      if (res.ok) {
        showMessage('success', isPublished ? 'تم إلغاء النشر' : 'تم النشر بنجاح');
        fetchInfographics();
      } else {
        showMessage('error', 'فشل تحديث حالة النشر');
      }
    } catch {
      showMessage('error', 'فشل التحديث');
    }
  };

  // ─── Delete ────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإنفوغرافيك؟')) return;
    try {
      const res = await fetch(`/api/infographics/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showMessage('success', 'تم الحذف');
        fetchInfographics();
      } else {
        showMessage('error', 'فشل الحذف');
      }
    } catch {
      showMessage('error', 'فشل الحذف');
    }
  };

  useEffect(() => {
    if (activeTab === 'manage') fetchInfographics();
    else fetchSources();
  }, [activeTab, sourceType, fetchInfographics, fetchSources]);

  // Filter by search
  const filteredInfographics = searchQuery
    ? infographics.filter(ig => ig.title.includes(searchQuery))
    : infographics;

  const totalViews = infographics.reduce((sum, i) => sum + i.viewCount, 0);
  const totalSlides = infographics.reduce((sum, i) => sum + ((i.slides as any[]) || []).length, 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.15)',
          }}>
            <Layers size={22} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              إنفوغرافيك — خط الإنتاج العربي
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
                locale=ar
              </span>
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text3)' }}>
              إنفوغرافيك خط الإنتاج العربي — التوليد التلقائي مفعّل
              <span className="text-[10px] px-1.5 py-0.5 rounded-full ms-1.5 font-semibold"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                V400 تلقائي
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('generate')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-semibold transition-all hover:opacity-90"
          style={{ background: 'var(--cyan)', color: 'var(--bg)', cursor: 'pointer' }}
        >
          <Sparkles size={14} />
          توليد جديد
        </button>
      </div>

      {/* Message toast */}
      {message && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-[13px] font-semibold"
          style={{
            background: message.type === 'success' ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)',
            color: message.type === 'success' ? '#059669' : '#dc2626',
            border: `1px solid ${message.type === 'success' ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`,
          }}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* ═══ Tabs ═══ */}
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('manage')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-[13px] font-semibold transition-all"
          style={{
            background: activeTab === 'manage' ? 'rgba(0,229,255,0.08)' : 'transparent',
            color: activeTab === 'manage' ? 'var(--cyan)' : 'var(--text3)',
          }}
        >
          <Layers size={14} />
          إدارة
          {infographics.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--cyan)', color: 'var(--bg)' }}>
              {infographics.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-[13px] font-semibold transition-all"
          style={{
            background: activeTab === 'generate' ? 'rgba(0,229,255,0.08)' : 'transparent',
            color: activeTab === 'generate' ? 'var(--cyan)' : 'var(--text3)',
          }}
        >
          <Sparkles size={14} />
          توليد
        </button>
      </div>

      {/* ═══ Manage Tab ═══ */}
      {activeTab === 'manage' && (
        <>
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'الإجمالي', value: infographics.length, color: 'var(--cyan)', icon: Layers },
              { label: 'منشور', value: infographics.filter(i => i.isPublished).length, color: '#059669', icon: Eye },
              { label: 'مسودة', value: infographics.filter(i => !i.isPublished).length, color: '#d4af37', icon: EyeOff },
              { label: 'إجمالي المشاهدات', value: totalViews, color: '#3b82f6', icon: Activity },
              { label: 'إجمالي الشرائح', value: totalSlides, color: '#D4AF37', icon: BarChart3 },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="p-3 rounded-lg" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={11} style={{ color: stat.color }} />
                    <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{stat.label}</span>
                  </div>
                  <span className="text-[20px] font-bold" style={{ color: stat.color }}>{stat.value}</span>
                </div>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
            <input
              type="text"
              placeholder="بحث في الإنفوغرافيك العربية..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2.5 rounded-lg text-[13px] outline-none transition-all"
              style={{
                background: 'var(--bg2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            />
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--cyan)' }} />
              <span className="ms-3 text-[13px]" style={{ color: 'var(--text3)' }}>جارٍ التحميل...</span>
            </div>
          )}

          {/* Infographics list */}
          {!loading && (
            <div className="space-y-2">
              {filteredInfographics.length === 0 ? (
                <div className="text-center py-16">
                  <ImageIcon size={40} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text3)' }} />
                  <p className="text-[14px] font-medium" style={{ color: 'var(--text3)' }}>لا توجد إنفوغرافيكات عربية بعد</p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--text3)', opacity: 0.7 }}>
                    انتقل إلى تبويب "توليد" لإنشاء إنفوغرافيك من الأخبار أو التقارير
                  </p>
                </div>
              ) : (
                filteredInfographics.map(ig => {
                  const slides = (ig.slides as any[]) || [];

                  return (
                    <div key={ig.id}
                      className="flex items-center gap-3 p-4 rounded-xl transition-all"
                      style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                      {/* Slide count badge */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>
                        <Layers size={18} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>
                          {ig.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                            {slides.length} شرائح
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                            {ig.sourceType === 'news' ? 'خبر' : ig.sourceType === 'economic_report' ? 'تقرير' : 'تحليل'}
                          </span>
                          <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text3)' }}>
                            <Eye size={10} /> {ig.viewCount}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleTogglePublish(ig.id, ig.isPublished)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            background: ig.isPublished ? 'rgba(5,150,105,0.1)' : 'rgba(212,175,55,0.1)',
                            color: ig.isPublished ? '#059669' : '#d4af37',
                          }}
                          title={ig.isPublished ? 'إلغاء النشر' : 'نشر'}
                        >
                          {ig.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <a href={`/infographics/${ig.slug}`} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            background: ig.isPublished ? 'rgba(0,229,255,0.1)' : 'rgba(212,175,55,0.1)',
                            color: ig.isPublished ? 'var(--cyan)' : '#d4af37',
                          }}
                          title={ig.isPublished ? 'عرض' : 'معاينة المسودة'}
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => handleDelete(ig.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ═══ Generate Tab ═══ */}
      {activeTab === 'generate' && (
        <div className="space-y-4">
          {/* Source type selector */}
          <div className="flex items-center gap-2">
            {SOURCE_TYPES.map(st => {
              const Icon = st.icon;
              const isActive = sourceType === st.value;
              return (
                <button
                  key={st.value}
                  onClick={() => setSourceType(st.value)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
                  style={{
                    background: isActive ? st.color + '15' : 'transparent',
                    color: isActive ? st.color : 'var(--text3)',
                    border: `1px solid ${isActive ? st.color + '30' : 'var(--border)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={14} />
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{
            background: 'rgba(0,229,255,0.04)',
            border: '1px solid rgba(0,229,255,0.1)',
          }}>
            <Zap size={16} style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-[12px] font-semibold" style={{ color: 'var(--cyan)' }}>آلية التوليد</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
                التوليد التلقائي مفعّل (V400) — اختر نوع المصدر ثم اضغط "توليد" بجانب الخبر أو التقرير. سيقوم AI بتحليل المحتوى وتوليد إنفوغرافيك بـ 6 شرائح (بطل ← قصة ← بيانات ← سيناريوهات ← أصول ← توصيات) مع صور AI لكل شريحة. يستغرق 30-90 ثانية.
              </p>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--cyan)' }} />
              <span className="ms-3 text-[13px]" style={{ color: 'var(--text3)' }}>جارٍ تحميل المصادر...</span>
            </div>
          )}

          {/* Sources list */}
          {!loading && (
            <div className="space-y-2">
              {sources.length === 0 ? (
                <div className="text-center py-12">
                  <Newspaper size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text3)' }} />
                  <p className="text-[13px]" style={{ color: 'var(--text3)' }}>لا توجد مصادر عربية متاحة</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text3)', opacity: 0.7 }}>
                    تأكد من وجود أخبار أو تقارير عربية منشورة
                  </p>
                </div>
              ) : (
                sources.map(source => (
                  <div key={source.id} className="flex items-center gap-3 p-4 rounded-xl" style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                  }}>
                    {/* Source icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{
                      background: sourceType === 'news' ? 'rgba(0,188,212,0.1)' :
                                  sourceType === 'economic_report' ? 'rgba(5,150,105,0.1)' : 'rgba(139,92,246,0.1)',
                      color: sourceType === 'news' ? '#00BCD4' :
                             sourceType === 'economic_report' ? '#059669' : '#8B5CF6',
                    }}>
                      {sourceType === 'news' ? <Newspaper size={18} /> :
                       sourceType === 'economic_report' ? <FileText size={18} /> : <BarChart3 size={18} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>
                        {source.title}
                      </h3>
                      {source.summary && (
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text3)' }}>
                          {source.summary}
                        </p>
                      )}
                      {source.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block" style={{
                          background: 'rgba(0,229,255,0.06)', color: 'var(--cyan)',
                        }}>
                          {source.category}
                        </span>
                      )}
                    </div>

                    {/* Generate action */}
                    <div className="flex-shrink-0">
                      {source.hasInfographic ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg" style={{
                          background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)',
                        }}>
                          <CheckCircle size={12} />
                          تم التوليد
                        </span>
                      ) : generating === source.id ? (
                        <span className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg" style={{
                          background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)',
                        }}>
                          <Loader2 size={12} className="animate-spin" />
                          جارٍ التوليد...
                        </span>
                      ) : (
                        <button
                          onClick={() => handleGenerate(source.id)}
                          className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
                          style={{ background: 'var(--cyan)', color: 'var(--bg)', cursor: 'pointer' }}
                        >
                          <Sparkles size={12} />
                          توليد
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
