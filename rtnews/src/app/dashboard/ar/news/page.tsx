// ─── Arabic News Production Line Dashboard ───────────────────
// Wraps existing news dashboard with locale='ar' filtering
// Glassmorphism style, RTL direction, Navy #0A0E27 / Cyan #00E5FF

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Pencil, Trash2, Eye, ExternalLink,
  Bot, Activity, RefreshCw, Filter, Newspaper,
  CheckCircle2, Clock, AlertTriangle, XCircle,
  ChevronLeft, ChevronRight, Zap, X, Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import NewsEditorModal from '@/components/NewsEditorModal';

// ─── Types ─────────────────────────────────────────────────
interface NewsItem {
  id: string;
  title: string;
  titleAr: string | null;
  summary: string;
  summaryAr: string | null;
  content?: string | null;
  contentAr?: string | null;
  source: string;
  url: string;
  category: string;
  sentiment: string;
  sentimentScore: number;
  impactLevel: string;
  newsType: string;
  isPublished: boolean;
  isReady?: boolean;
  imageUrl: string | null;
  aiAnalysis: string | null;
  affectedAssets?: string;
  slug?: string | null;
  processingStage?: string;
  fetchedAt: string;
  createdAt: string;
}

type TabKey = 'published' | 'fetched';
type ImpactLevel = 'high' | 'medium' | 'low';

// ─── Constants ─────────────────────────────────────────────
const CATEGORIES = [
  'الكل', 'بنوك مركزية', 'سلع', 'أسواق عربية', 'اقتصاد أمريكي',
  'أرباح شركات', 'عملات', 'كريبتو', 'طاقة', 'أسهم', 'اقتصاد كلي', 'اقتصاد',
];

const IMPACT_CONFIG: Record<ImpactLevel, { label: string; color: string; bg: string }> = {
  high: { label: 'عالي', color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)' },
  medium: { label: 'متوسط', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  low: { label: 'منخفض', color: '#00c896', bg: 'rgba(0,200,150,0.12)' },
};

const SENTIMENT_CONFIG: Record<string, { label: string; color: string }> = {
  positive: { label: 'إيجابي', color: '#00c896' },
  negative: { label: 'سلبي', color: '#ff4d6a' },
  neutral: { label: 'محايد', color: '#64748b' },
};

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  fetched: { label: 'تم الجلب', color: '#64748b', icon: '📥' },
  content_loaded: { label: 'تحميل المحتوى', color: '#3b82f6', icon: '📄' },
  translated: { label: 'تم الترجمة', color: '#8b5cf6', icon: '🌐' },
  analyzed: { label: 'تم التحليل', color: '#f59e0b', icon: '🤖' },
  imaged: { label: 'جاهز للنشر', color: '#00c896', icon: '✅' },
};

const PAGE_SIZE = 20;

// ─── Helper Functions ──────────────────────────────────────
function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getImpactLevel(level: string): ImpactLevel {
  return ['high', 'medium', 'low'].includes(level) ? (level as ImpactLevel) : 'low';
}

// ─── Main Component ────────────────────────────────────────
export default function ArNewsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('published');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [fetchedCount, setFetchedCount] = useState(0);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('الكل');
  const [impactFilter, setImpactFilter] = useState('all');

  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);

  // ─── Data Fetching ────────────────────────────────────────
  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        page: String(currentPage),
        sortBy: 'fetchedAt',
        sortOrder: 'desc',
        status: activeTab,
        locale: 'ar',
      });
      if (searchQuery) params.set('search', searchQuery);
      if (categoryFilter !== 'الكل') params.set('category', categoryFilter);
      if (impactFilter !== 'all') params.set('sentiment', impactFilter === 'high' ? 'negative' : impactFilter === 'low' ? 'positive' : 'neutral');

      const res = await fetch(`/api/news/manage?${params}`);
      const data = await res.json();
      setNews(data.news || []);
      setTotalCount(Number(data.total || 0));
      setTotalPages(Number(data.totalPages || 1));
      if (data.systemStatus) {
        setDbConnected(data.systemStatus.dbConnected);
      }
    } catch (err) {
      console.error('Failed to fetch news:', err);
      toast.error('فشل تحميل الأخبار');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, currentPage, categoryFilter, impactFilter]);

  const fetchCounts = useCallback(async () => {
    try {
      const [pubRes, fetchRes] = await Promise.all([
        fetch('/api/news/manage?limit=1&status=published&locale=ar'),
        fetch('/api/news/manage?limit=1&status=fetched&locale=ar'),
      ]);
      const pubData = await pubRes.json();
      const fetchData = await fetchRes.json();
      setPublishedCount(Number(pubData.total || 0));
      setFetchedCount(Number(fetchData.total || 0));
    } catch {
      // Silent fail for counts
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, categoryFilter, impactFilter]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleDeleteNews = useCallback(async (item: NewsItem) => {
    const displayTitle = item.titleAr || item.title;
    const isPublished = item.isReady || item.isPublished;

    const msg = isPublished
      ? `هل أنت متأكد من حذف هذا الخبر المنشور؟\n\n"${displayTitle.slice(0, 80)}"\n\nسيتم حذف الخبر نهائياً ولن يتمكن الزوار من الوصول إليه.`
      : `هل أنت متأكد من حذف هذا الخبر؟\n\n"${displayTitle.slice(0, 80)}"`;

    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/news/manage?id=${item.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل الحذف');
        return;
      }
      toast.success('تم حذف الخبر بنجاح');
      fetchNews();
      fetchCounts();
    } catch (err: any) {
      toast.error('خطأ أثناء الحذف: ' + (err.message || 'خطأ غير معروف'));
    }
  }, [fetchNews, fetchCounts]);

  const handleEditNews = useCallback((item: NewsItem) => {
    setEditingItem(item);
    setIsEditorOpen(true);
  }, []);

  const handleSaveComplete = useCallback(() => {
    fetchNews();
    fetchCounts();
  }, [fetchNews, fetchCounts]);

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchInput('');
    setSearchQuery('');
    setCategoryFilter('الكل');
    setImpactFilter('all');
  }, []);

  // ─── Render ───────────────────────────────────────────────
  return (
    <div style={{ direction: 'rtl' }}>
      {/* ═══ HEADER ═══ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <h1 style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <Newspaper size={24} style={{ color: 'var(--cyan)' }} />
            الأخبار المالية — خط الإنتاج العربي
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
          <p style={{
            fontSize: 13,
            color: 'var(--text3)',
            marginTop: 4,
          }}>
            إدارة الأخبار العربية — تصفية حسب اللغة العربية
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* DB Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: dbConnected === true ? 'rgba(0,200,83,0.1)' : dbConnected === false ? 'rgba(255,82,82,0.1)' : 'rgba(255,255,255,0.05)',
            padding: '6px 12px',
            borderRadius: 8,
            border: `1px solid ${dbConnected === true ? 'rgba(0,200,83,0.2)' : dbConnected === false ? 'rgba(255,82,82,0.2)' : 'rgba(255,255,255,0.1)'}`,
            color: dbConnected === true ? '#00c853' : dbConnected === false ? '#ff5252' : 'var(--text3)',
            fontSize: 11,
            fontWeight: 700,
          }}>
            <Activity size={12} />
            {dbConnected === true ? 'متصل' : dbConnected === false ? 'منقطع' : 'جاري الفحص'}
          </div>

          {/* Refresh */}
          <button
            onClick={() => { fetchNews(); fetchCounts(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text2)',
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} />
            تحديث
          </button>

          {/* Add News Button */}
          <button
            onClick={() => {
              setEditingItem(null);
              setIsEditorOpen(true);
            }}
            style={{
              background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,229,255,0.25)',
            }}
          >
            <Plus size={15} />
            إضافة خبر
          </button>
        </div>
      </div>

      {/* ═══ STATS BAR ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        {[
          { label: 'أخبار منشورة', count: publishedCount, color: '#00c896', bg: 'rgba(0,200,150,0.08)', icon: CheckCircle2 },
          { label: 'أخبار مجلوبة', count: fetchedCount, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', icon: Clock },
          { label: 'إجمالي الأخبار', count: publishedCount + fetchedCount, color: 'var(--cyan)', bg: 'rgba(0,229,255,0.08)', icon: Newspaper },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              style={{
                background: stat.bg,
                border: `1px solid ${stat.color}22`,
                borderRadius: 12,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: `${stat.color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.count}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ TABS ═══ */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 20,
        borderBottom: '2px solid var(--border)',
      }}>
        <button
          onClick={() => handleTabChange('published')}
          style={{
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 700,
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'published' ? '3px solid var(--cyan)' : '3px solid transparent',
            color: activeTab === 'published' ? 'var(--cyan)' : 'var(--text3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: -2,
            transition: 'all 0.2s',
          }}
        >
          <CheckCircle2 size={16} />
          الأخبار المنشورة
          <span style={{
            background: activeTab === 'published' ? 'var(--cyan2)' : 'var(--bg4)',
            color: activeTab === 'published' ? 'var(--cyan)' : 'var(--text3)',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
          }}>
            {publishedCount}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('fetched')}
          style={{
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 700,
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'fetched' ? '3px solid var(--cyan)' : '3px solid transparent',
            color: activeTab === 'fetched' ? 'var(--cyan)' : 'var(--text3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: -2,
            transition: 'all 0.2s',
          }}
        >
          <Clock size={16} />
          الأخبار المجلوبة
          <span style={{
            background: activeTab === 'fetched' ? 'var(--cyan2)' : 'var(--bg4)',
            color: activeTab === 'fetched' ? 'var(--cyan)' : 'var(--text3)',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
          }}>
            {fetchedCount}
          </span>
        </button>
      </div>

      {/* ═══ FILTER BAR ═══ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        <div style={{
          position: 'relative',
          flex: '1 1 280px',
          maxWidth: 400,
        }}>
          <Search size={14} style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text3)',
          }} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="بحث في الأخبار العربية..."
            style={{
              width: '100%',
              background: 'var(--bg4)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '10px 14px 10px 14px',
              paddingRight: 36,
              fontSize: 13,
              color: 'var(--text)',
              outline: 'none',
            }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            background: 'var(--bg4)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text2)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={impactFilter}
          onChange={(e) => setImpactFilter(e.target.value)}
          style={{
            background: 'var(--bg4)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text2)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="all">كل التأثيرات</option>
          <option value="high">عالي</option>
          <option value="medium">متوسط</option>
          <option value="low">منخفض</option>
        </select>

        <span style={{
          fontSize: 12,
          color: 'var(--text3)',
          fontWeight: 600,
        }}>
          {totalCount} نتيجة
        </span>
      </div>

      {/* ═══ NEWS TABLE ═══ */}
      <div style={{
        background: 'var(--bg2)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 100px 90px 100px 130px',
          gap: 0,
          padding: '12px 16px',
          background: 'var(--bg3)',
          borderBottom: '1px solid var(--border)',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text3)',
          alignItems: 'center',
        }}>
          <div>العنوان</div>
          <div style={{ textAlign: 'center' }}>التصنيف</div>
          <div style={{ textAlign: 'center' }}>المشاعر</div>
          <div style={{ textAlign: 'center' }}>الحالة</div>
          <div style={{ textAlign: 'center' }}>التاريخ</div>
          <div style={{ textAlign: 'center' }}>إجراءات</div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{
              width: 28,
              height: 28,
              border: '3px solid var(--border)',
              borderTopColor: 'var(--cyan)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }} />
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>جاري تحميل الأخبار العربية...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : news.length === 0 ? (
          <div style={{
            padding: 60,
            textAlign: 'center',
            color: 'var(--text3)',
          }}>
            <Newspaper size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              لا توجد أخبار عربية {activeTab === 'published' ? 'منشورة' : 'مجلوبة'}
            </p>
            <p style={{ fontSize: 12 }}>
              الأخبار العربية ستظهر هنا بعد معالجتها بالكامل
            </p>
          </div>
        ) : (
          news.map((item) => {
            const displayTitle = item.titleAr || item.title;
            const impactLevel = getImpactLevel(item.impactLevel);
            const impactCfg = IMPACT_CONFIG[impactLevel];
            const sentimentCfg = SENTIMENT_CONFIG[item.sentiment] || SENTIMENT_CONFIG.neutral;
            const isPublished = item.isReady || item.isPublished;
            const stageInfo = STAGE_CONFIG[item.processingStage || 'fetched'] || STAGE_CONFIG.fetched;

            return (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px 100px 90px 100px 130px',
                  gap: 0,
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'center',
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Title Column */}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    {isPublished ? (
                      <CheckCircle2 size={12} style={{ color: '#00c896', flexShrink: 0 }} />
                    ) : (
                      <Clock size={12} style={{ color: '#3b82f6', flexShrink: 0 }} />
                    )}
                    {displayTitle}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--text3)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.source} {item.slug && `· /${item.slug.slice(0, 30)}`}
                  </div>
                  {!isPublished && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 4,
                      fontSize: 10,
                      color: stageInfo.color,
                      background: `${stageInfo.color}15`,
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontWeight: 700,
                    }}>
                      {stageInfo.icon} {stageInfo.label}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {item.newsType === 'breaking' && (
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: '#ff4d6a',
                        background: 'rgba(255,77,106,0.12)',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}>عاجل</span>
                    )}
                    {item.aiAnalysis && (
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: 'var(--purple)',
                        background: 'rgba(139,92,246,0.1)',
                        padding: '1px 6px',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}><Bot size={8} /> AI</span>
                    )}
                    {item.titleAr && (
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: '#00c896',
                        background: 'rgba(0,200,150,0.1)',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}>مترجم</span>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text2)',
                    background: 'var(--bg4)',
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}>
                    {item.category}
                  </span>
                </div>

                {/* Sentiment */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: sentimentCfg.color,
                  }}>
                    {sentimentCfg.label}
                  </span>
                </div>

                {/* Published Status */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isPublished ? '#00c896' : '#3b82f6',
                    background: isPublished ? 'rgba(0,200,150,0.1)' : 'rgba(59,130,246,0.1)',
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}>
                    {isPublished ? 'منشور' : 'مسودة'}
                  </span>
                </div>

                {/* Date */}
                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>
                  {formatRelativeTime(item.fetchedAt)}
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}>
                  {item.slug && (
                    <a
                      href={`/news/${item.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="عرض على الموقع"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        color: 'var(--text3)',
                        background: 'transparent',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}

                  <button
                    onClick={() => handleEditNews(item)}
                    title="تعديل"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      color: 'var(--text3)',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Pencil size={13} />
                  </button>

                  <button
                    onClick={() => handleDeleteNews(item)}
                    title="حذف"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      color: 'var(--text3)',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ═══ PAGINATION ═══ */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginTop: 20,
          padding: '10px 0',
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg4)',
              color: currentPage === 1 ? 'var(--text4)' : 'var(--text2)',
              fontSize: 12,
              fontWeight: 600,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            <ChevronRight size={14} />
            السابق
          </button>

          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text2)',
            padding: '0 16px',
          }}>
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg4)',
              color: currentPage === totalPages ? 'var(--text4)' : 'var(--text2)',
              fontSize: 12,
              fontWeight: 600,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            التالي
            <ChevronLeft size={14} />
          </button>
        </div>
      )}

      {/* ═══ EDITOR MODAL ═══ */}
      <NewsEditorModal
        item={editingItem}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveComplete}
      />
    </div>
  );
}
