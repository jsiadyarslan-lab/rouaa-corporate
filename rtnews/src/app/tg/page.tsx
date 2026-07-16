'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTelegramWebApp } from '@/lib/telegram-webapp/useTelegramWebApp';
import { stripSummaryMarkdown } from '@/lib/clean-markdown';

// ─── Types ─────────────────────────────────────────────────────

interface ReportItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  reportType: string;
  scope: string;
  marketImpact: string;
  confidenceScore: number;
  publishedAt: string | null;
  source: 'report' | 'analysis';
}

interface NewsItem {
  id: string;
  titleAr: string;
  title: string;
  category: string;
  impactLevel: string;
  slug: string | null;
  publishedAt: string | null;
  newsType: string;
  sentiment: string;
}

interface NotificationPrefs {
  breaking: boolean;
  analysis: boolean;
  price: boolean;
  calendar: boolean;
  daily: boolean;
}

type TabId = 'home' | 'news' | 'settings';

// ─── Constants ─────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'home', label: 'الرئيسية', icon: '📊' },
  { id: 'news', label: 'الأخبار', icon: '📰' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
];

const REPORT_TYPES: { key: string; label: string }[] = [
  { key: 'الكل', label: 'الكل' },
  { key: 'strategic', label: 'استراتيجي' },
  { key: 'daily', label: 'يومي' },
  { key: 'stocks', label: 'أسهم' },
  { key: 'forex', label: 'فوركس' },
  { key: 'commodities', label: 'سلع' },
  { key: 'energy', label: 'طاقة' },
];

const IMPACT_LABELS: Record<string, string> = {
  bullish: 'صعودي',
  bearish: 'هبوطي',
  neutral: 'محايد',
};

const IMPACT_COLORS: Record<string, string> = {
  bullish: '#00996B',
  bearish: '#D4365C',
  neutral: '#D4930D',
};

const IMPACT_BG: Record<string, string> = {
  bullish: 'rgba(0,153,107,0.12)',
  bearish: 'rgba(212,54,92,0.12)',
  neutral: 'rgba(212,147,13,0.12)',
};

const NEWS_TYPE_LABELS: Record<string, string> = {
  breaking: 'عاجل',
  live: 'مباشر',
  article: 'مقال',
};

const IMPACT_LEVEL_MAP: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: 'مرتفع', color: '#D4365C', bg: 'rgba(212,54,92,0.12)' },
  medium: { label: 'متوسط', color: '#D4930D', bg: 'rgba(212,147,13,0.12)' },
  low: { label: 'منخفض', color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
};

const DEFAULT_PREFS: NotificationPrefs = {
  breaking: true,
  analysis: true,
  price: false,
  calendar: false,
  daily: false,
};

// ─── Helper Functions ──────────────────────────────────────────

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'الآن';
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  if (diffHr < 24) return `منذ ${diffHr} ساعة`;
  if (diffDay < 7) return `منذ ${diffDay} يوم`;
  return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function truncateText(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  // V226: Smart truncation — don't cut mid-Arabic-word
  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.7) {
    return truncated.slice(0, lastSpace).trim() + '...';
  }
  return truncated.trim() + '...';
}

// ─── Skeleton Components ───────────────────────────────────────

function ReportSkeleton() {
  return (
    <div style={{
      background: 'rgba(20,20,30,0.8)',
      border: '1px solid rgba(128,128,128,0.1)',
      borderRadius: '10px',
      padding: '14px 16px',
      marginBottom: '10px',
    }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <div style={{ width: '60px', height: '18px', borderRadius: '4px', background: 'rgba(128,128,128,0.15)' }} />
        <div style={{ width: '40px', height: '18px', borderRadius: '4px', background: 'rgba(128,128,128,0.1)' }} />
      </div>
      <div style={{ width: '90%', height: '20px', borderRadius: '4px', background: 'rgba(128,128,128,0.15)', marginBottom: '8px' }} />
      <div style={{ width: '100%', height: '14px', borderRadius: '4px', background: 'rgba(128,128,128,0.1)', marginBottom: '4px' }} />
      <div style={{ width: '75%', height: '14px', borderRadius: '4px', background: 'rgba(128,128,128,0.1)' }} />
    </div>
  );
}

function NewsSkeleton() {
  return (
    <div style={{
      background: 'rgba(20,20,30,0.8)',
      border: '1px solid rgba(128,128,128,0.1)',
      borderRadius: '10px',
      padding: '12px 16px',
      marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <div style={{ width: '40px', height: '16px', borderRadius: '4px', background: 'rgba(128,128,128,0.15)' }} />
        <div style={{ width: '50px', height: '16px', borderRadius: '4px', background: 'rgba(128,128,128,0.1)' }} />
      </div>
      <div style={{ width: '95%', height: '16px', borderRadius: '4px', background: 'rgba(128,128,128,0.15)', marginBottom: '4px' }} />
      <div style={{ width: '60%', height: '14px', borderRadius: '4px', background: 'rgba(128,128,128,0.1)' }} />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function TgMiniApp() {
  const { isTelegram, user, webApp } = useTelegramWebApp();

  // ── State ──
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);
  const [reportsPage, setReportsPage] = useState(1);
  const [newsPage, setNewsPage] = useState(1);
  const [reportsHasMore, setReportsHasMore] = useState(false);
  const [newsHasMore, setNewsHasMore] = useState(false);
  const [selectedType, setSelectedType] = useState('الكل');
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const reportListRef = useRef<HTMLDivElement>(null);
  const newsListRef = useRef<HTMLDivElement>(null);

  // ── Initialize Telegram WebApp ──
  useEffect(() => {
    if (webApp) {
      try {
        webApp.setHeaderColor('#0a0a1a');
        webApp.setBackgroundColor('#0a0a1a');
      } catch {}
    }
  }, [webApp]);

  // ── Fetch Reports ──
  const fetchReports = useCallback(async (page: number = 1, type: string = selectedType) => {
    try {
      setReportsLoading(true);
      const typeParam = type !== 'الكل' ? `&type=${type}` : '';
      const res = await fetch(`/api/tg/reports?page=${page}&limit=10${typeParam}`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();

      if (page === 1) {
        setReports(data.reports || []);
      } else {
        setReports(prev => [...prev, ...(data.reports || [])]);
      }
      setReportsHasMore(data.hasMore || false);
      setReportsPage(page);
    } catch (err) {
      console.error('[TG MiniApp] Failed to fetch reports:', err);
      if (page === 1) setReports([]);
    } finally {
      setReportsLoading(false);
      setRefreshing(false);
    }
  }, [selectedType]);

  // ── Fetch News ──
  const fetchNews = useCallback(async (page: number = 1) => {
    try {
      setNewsLoading(true);
      const res = await fetch(`/api/tg/news?page=${page}&limit=15`);
      if (!res.ok) throw new Error('Failed to fetch news');
      const data = await res.json();

      if (page === 1) {
        setNews(data.news || []);
      } else {
        setNews(prev => [...prev, ...(data.news || [])]);
      }
      setNewsHasMore(data.hasMore || false);
      setNewsPage(page);
    } catch (err) {
      console.error('[TG MiniApp] Failed to fetch news:', err);
      if (page === 1) setNews([]);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  // ── Initial data load ──
  useEffect(() => {
    fetchReports(1);
    fetchNews(1);
  }, [fetchReports, fetchNews]);

  // ── Refresh when type changes ──
  useEffect(() => {
    fetchReports(1, selectedType);
  }, [selectedType, fetchReports]);

  // ── Fetch preferences ──
  useEffect(() => {
    async function loadPrefs() {
      try {
        // In Telegram, try to get prefs from the Telegram user data
        if (user) {
          const chatId = String(user.id);
          const res = await fetch(`/api/telegram/preferences?chatId=${chatId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.prefs) setPrefs(data.prefs);
          }
        }
      } catch {}
    }
    if (activeTab === 'settings') {
      loadPrefs();
    }
  }, [activeTab, user]);

  // ── Pull to refresh ──
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'home') {
      fetchReports(1);
    } else if (activeTab === 'news') {
      fetchNews(1);
    } else {
      setRefreshing(false);
    }
  }, [activeTab, fetchReports, fetchNews]);

  // ── Touch pull-to-refresh ──
  const touchStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = (e.currentTarget as HTMLElement).scrollTop;
    if (scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current <= 0) return;
    const distance = e.touches[0].clientY - touchStartY.current;
    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.5, 80));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 50) {
      handleRefresh();
    }
    setPullDistance(0);
    touchStartY.current = 0;
  }, [pullDistance, handleRefresh]);

  // ── Save Preferences ──
  const savePrefs = useCallback(async () => {
    setPrefsSaving(true);
    setPrefsSaved(false);
    try {
      if (user) {
        const chatId = String(user.id);
        await fetch('/api/telegram/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, prefs }),
        });
      }
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch (err) {
      console.error('[TG MiniApp] Failed to save prefs:', err);
    } finally {
      setPrefsSaving(false);
    }
  }, [prefs, user]);

  // ── Navigate to report detail ──
  const openReport = useCallback((slug: string) => {
    window.location.href = `/tg/reports/${slug}`;
  }, []);

  // ── Navigate to news article ──
  const openNews = useCallback((item: NewsItem) => {
    if (item.slug || item.id) {
      window.location.href = `/news/${item.slug || item.id}`;
    }
  }, []);

  // ─── Render: Report Card ─────────────────────────────────────
  const renderReportCard = (report: ReportItem) => {
    const impactColor = IMPACT_COLORS[report.marketImpact] || IMPACT_COLORS.neutral;
    const impactBg = IMPACT_BG[report.marketImpact] || IMPACT_BG.neutral;
    const impactLabel = IMPACT_LABELS[report.marketImpact] || 'محايد';
    const scopeLabel = report.scope === 'global' ? 'عالمي' :
      report.scope === 'arabic' ? 'عربي' :
      report.scope === 'regional' ? 'إقليمي' : report.scope;

    return (
      <div
        key={report.id}
        onClick={() => openReport(report.slug)}
        style={{
          background: 'rgba(20,20,30,0.8)',
          border: '1px solid rgba(128,128,128,0.1)',
          borderRadius: '10px',
          padding: '14px 16px',
          marginBottom: '10px',
          cursor: 'pointer',
          transition: 'border-color 0.2s ease',
          borderInlineStart: `3px solid ${impactColor}`,
        }}
        onTouchStart={() => {}}
      >
        {/* Top row: type badge + date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#00E5FF',
            background: 'rgba(0,229,255,0.1)',
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            {scopeLabel}
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: impactColor,
            background: impactBg,
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            {impactLabel}
          </span>
          {report.confidenceScore > 0 && (
            <span style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.4)',
              direction: 'ltr',
            }}>
              ثقة {report.confidenceScore}%
            </span>
          )}
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginRight: 'auto' }}>
            {formatTimeAgo(report.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#FFFFFF',
          lineHeight: '1.6',
          marginBottom: '6px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {report.title}
        </div>

        {/* Summary */}
        {report.summary && (
          <div style={{
            fontSize: '13px',
            lineHeight: '1.8',
            color: 'rgba(176,196,216,0.7)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {truncateText(report.summary, 120)}
          </div>
        )}
      </div>
    );
  };

  // ─── Render: News Card ───────────────────────────────────────
  const renderNewsCard = (item: NewsItem) => {
    const impactInfo = IMPACT_LEVEL_MAP[item.impactLevel] || IMPACT_LEVEL_MAP.low;
    const newsTypeLabel = NEWS_TYPE_LABELS[item.newsType] || item.newsType;
    const isBreaking = item.newsType === 'breaking';

    return (
      <div
        key={item.id}
        onClick={() => openNews(item)}
        style={{
          background: 'rgba(20,20,30,0.8)',
          border: '1px solid rgba(128,128,128,0.1)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '8px',
          cursor: 'pointer',
          transition: 'border-color 0.2s ease',
          borderInlineStart: isBreaking ? '3px solid #D4365C' : '3px solid transparent',
        }}
      >
        {/* Top row: badges + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
          {isBreaking && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#fff',
              background: '#B33A3A',
              padding: '2px 6px',
              borderRadius: '3px',
              letterSpacing: '0.5px',
            }}>
              عاجل
            </span>
          )}
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: impactInfo.color,
            background: impactInfo.bg,
            padding: '2px 6px',
            borderRadius: '3px',
          }}>
            {impactInfo.label}
          </span>
          <span style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.35)',
          }}>
            {item.category}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginRight: 'auto' }}>
            {formatTimeAgo(item.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#E8EDF5',
          lineHeight: '1.6',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.titleAr || item.title}
        </div>
      </div>
    );
  };

  // ─── Render: Home Tab ────────────────────────────────────────
  const renderHomeTab = () => (
    <div>
      {/* Type Filter Buttons */}
      <div style={{
        display: 'flex',
        gap: '6px',
        padding: '0 16px 12px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {REPORT_TYPES.map((type) => (
          <button
            key={type.key}
            onClick={() => setSelectedType(type.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: selectedType === type.key ? 700 : 500,
              color: selectedType === type.key ? '#050810' : 'rgba(255,255,255,0.6)',
              background: selectedType === type.key ? '#00E5FF' : 'rgba(255,255,255,0.06)',
              border: selectedType === type.key ? '1px solid #00E5FF' : '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div style={{ padding: '0 16px' }}>
        {reportsLoading && reportsPage === 1 ? (
          // Skeleton loading
          <>
            <ReportSkeleton />
            <ReportSkeleton />
            <ReportSkeleton />
            <ReportSkeleton />
            <ReportSkeleton />
          </>
        ) : reports.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '14px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
            لا توجد تقارير متاحة حالياً
          </div>
        ) : (
          <>
            {reports.map(renderReportCard)}
            {reportsLoading && reportsPage > 1 && <ReportSkeleton />}
          </>
        )}

        {/* Load More Button */}
        {reportsHasMore && !reportsLoading && reports.length > 0 && (
          <button
            onClick={() => fetchReports(reportsPage + 1)}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#00E5FF',
              background: 'rgba(0,229,255,0.06)',
              border: '1px solid rgba(0,229,255,0.15)',
              cursor: 'pointer',
              marginBottom: '16px',
              fontFamily: 'inherit',
            }}
          >
            عرض المزيد
          </button>
        )}
      </div>
    </div>
  );

  // ─── Render: News Tab ────────────────────────────────────────
  const renderNewsTab = () => (
    <div style={{ padding: '0 16px' }}>
      {newsLoading && newsPage === 1 ? (
        <>
          <NewsSkeleton />
          <NewsSkeleton />
          <NewsSkeleton />
          <NewsSkeleton />
          <NewsSkeleton />
          <NewsSkeleton />
        </>
      ) : news.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '14px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📰</div>
          لا توجد أخبار متاحة حالياً
        </div>
      ) : (
        <>
          {news.map(renderNewsCard)}
          {newsLoading && newsPage > 1 && <NewsSkeleton />}
        </>
      )}

      {/* Load More Button */}
      {newsHasMore && !newsLoading && news.length > 0 && (
        <button
          onClick={() => fetchNews(newsPage + 1)}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#00E5FF',
            background: 'rgba(0,229,255,0.06)',
            border: '1px solid rgba(0,229,255,0.15)',
            cursor: 'pointer',
            marginBottom: '16px',
            fontFamily: 'inherit',
          }}
        >
          عرض المزيد
        </button>
      )}
    </div>
  );

  // ─── Render: Settings Tab ────────────────────────────────────
  const renderSettingsTab = () => {
    const prefItems: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
      { key: 'breaking', label: 'أخبار عاجلة', desc: 'إشعارات الأخبار العاجلة والمستعجلة' },
      { key: 'analysis', label: 'تحليلات السوق', desc: 'تقارير وتحليلات السوق المالي' },
      { key: 'price', label: 'تنبيهات الأسعار', desc: 'تنبيهات حركة الأسعار المهمة' },
      { key: 'calendar', label: 'التقويم الاقتصادي', desc: 'أحداث التقويم الاقتصادي المهمة' },
      { key: 'daily', label: 'ملخص يومي', desc: 'ملخص يومي لأهم الأحداث المالية' },
    ];

    return (
      <div style={{ padding: '0 16px' }}>
        {/* User Greeting */}
        <div style={{
          background: 'rgba(20,20,30,0.8)',
          border: '1px solid rgba(128,128,128,0.1)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
          }}>
            {user?.first_name ? user.first_name.charAt(0) : '👤'}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
              {user ? `مرحباً ${user.first_name} 👋` : 'مرحباً بك 👋'}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              {user?.username ? `@${user.username}` : isTelegram ? 'مستخدم تيليجرام' : 'زائر'}
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          تفضيلات الإشعارات
        </div>

        {prefItems.map((item) => (
          <div
            key={item.key}
            style={{
              background: 'rgba(20,20,30,0.8)',
              border: '1px solid rgba(128,128,128,0.1)',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#E8EDF5', marginBottom: '2px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                {item.desc}
              </div>
            </div>
            {/* Toggle Switch */}
            <button
              onClick={() => setPrefs(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                background: prefs[item.key] ? '#00E5FF' : 'rgba(255,255,255,0.1)',
                border: prefs[item.key] ? '1px solid #00E5FF' : '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                padding: 0,
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: prefs[item.key] ? '#050810' : 'rgba(255,255,255,0.4)',
                position: 'absolute',
                top: '2px',
                right: prefs[item.key] ? '2px' : 'auto',
                left: prefs[item.key] ? 'auto' : '2px',
                transition: 'all 0.2s ease',
              }} />
            </button>
          </div>
        ))}

        {/* Save Button */}
        <button
          onClick={savePrefs}
          disabled={prefsSaving}
          style={{
            display: 'block',
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            color: prefsSaved ? '#050810' : '#FFFFFF',
            background: prefsSaved
              ? 'linear-gradient(135deg, #22C55E, #00E5FF)'
              : 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
            border: 'none',
            cursor: prefsSaving ? 'wait' : 'pointer',
            marginTop: '16px',
            marginBottom: '20px',
            fontFamily: 'inherit',
            opacity: prefsSaving ? 0.7 : 1,
            transition: 'all 0.3s ease',
          }}
        >
          {prefsSaving ? 'جاري الحفظ...' : prefsSaved ? '✓ تم الحفظ' : 'حفظ التفضيلات'}
        </button>

        {/* About Section */}
        <div style={{
          background: 'rgba(20,20,30,0.8)',
          border: '1px solid rgba(128,128,128,0.1)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
            عن رؤى
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.8', color: 'rgba(255,255,255,0.4)' }}>
            منصة رؤى للأخبار المالية والتداول — مدعومة بالذكاء الاصطناعي.
            نقدم لك آخر أخبار الأسواق والتحليلات المتعمقة والإشارات التداولية والتقويم الاقتصادي.
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '8px' }}>
            الإصدار 2.0 • رؤى للأنظمة الذكية
          </div>
        </div>
      </div>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a1a',
      color: '#B0C4D8',
      direction: 'rtl',
      fontFamily: 'var(--font-readex-pro), var(--font-cairo), system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: '1px solid rgba(128,128,128,0.1)',
        background: '#0a0a1a',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 700,
            color: '#050810',
            flexShrink: 0,
          }}>
            ر
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
              رؤى
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
              أخبار وتحليلات الأسواق المالية
            </div>
          </div>
          {isTelegram && (
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#22C55E',
              background: 'rgba(34,197,94,0.12)',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(34,197,94,0.25)',
            }}>
              Telegram
            </div>
          )}
        </div>
      </div>

      {/* ── Pull-to-refresh indicator ── */}
      {pullDistance > 0 && (
        <div style={{
          textAlign: 'center',
          padding: `${Math.min(pullDistance * 0.3, 20)}px 0`,
          color: pullDistance > 50 ? '#00E5FF' : 'rgba(255,255,255,0.3)',
          fontSize: '12px',
          fontWeight: 600,
          transition: 'color 0.2s',
        }}>
          {refreshing ? '⏳ جاري التحديث...' : pullDistance > 50 ? '↻ حرر للتحديث' : '↻ اسحب للتحديث'}
        </div>
      )}

      {/* ── Content Area ── */}
      <div
        ref={activeTab === 'home' ? reportListRef : newsListRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: '80px',
          paddingTop: '12px',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'news' && renderNewsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* ── Bottom Tab Navigation ── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(10,10,26,0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(128,128,128,0.1)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 0 calc(8px + env(safe-area-inset-bottom, 0px))',
        zIndex: 100,
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 16px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                minWidth: '64px',
              }}
            >
              <span style={{
                fontSize: '20px',
                transition: 'transform 0.2s',
                transform: isActive ? 'scale(1.15)' : 'scale(1)',
              }}>
                {tab.icon}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#00E5FF' : 'rgba(255,255,255,0.4)',
                transition: 'color 0.2s',
              }}>
                {tab.label}
              </span>
              {isActive && (
                <div style={{
                  width: '20px',
                  height: '2px',
                  borderRadius: '1px',
                  background: '#00E5FF',
                  position: 'absolute',
                  bottom: '4px',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
