'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useNewsStore, useShallow } from '@/stores/news-store';
import { useIsBookmarked, useUserStore } from '@/stores/user-store';
import NewsImage from '@/components/rouaa/NewsImage';

// ─── Inline Bookmark Icon for News Cards ────────────────────
function CardBookmarkBtn({ newsId, newsData }: { newsId: string; newsData: any }) {
  const isBookmarked = useIsBookmarked(newsId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const store = useUserStore.getState();
    if (store.isBookmarked(newsId)) {
      store.removeBookmark(newsId);
    } else {
      const displayTitle = newsData.translatedTitle || newsData.title;
      store.addBookmark({
        id: newsId,
        slug: newsData.slug,
        title: newsData.title,
        translatedTitle: newsData.translatedTitle,
        summary: newsData.translatedSummary || newsData.summary,
        source: newsData.source || '',
        category: newsData.category || '',
        sentiment: newsData.sentiment || 'neutral',
        impactLevel: newsData.impactLevel || 'low',
        url: newsData.url,
        imageUrl: newsData.imageUrl,
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
      style={{
        background: isBookmarked ? 'var(--cyan2)' : 'var(--bg4)',
        border: '1px solid ' + (isBookmarked ? 'rgba(0,201,167,0.3)' : 'var(--border)'),
        color: isBookmarked ? 'var(--cyan)' : 'var(--text3)',
      }}
      aria-label={isBookmarked ? 'إزالة من المحفوظات' : 'إضافة إلى المحفوظات'}
      aria-pressed={isBookmarked}
    >
      {isBookmarked ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--cyan)" stroke="var(--cyan)" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </button>
  );
}

type ViewMode = 'compact' | 'dense' | 'regular';

// ── Expandable Text Component (5-line preview + "Read More") ──
function ExpandableText({ text, maxLines = 5, className = '', style = {} }: {
  text: string;
  maxLines?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [needsExpand, setNeedsExpand] = useState(false);

  useEffect(() => {
    if (!textRef.current) return;
    // Check if text overflows the max-lines
    const lineHeight = parseInt(getComputedStyle(textRef.current).lineHeight) || 20;
    const maxHeight = lineHeight * maxLines;
    setNeedsExpand(textRef.current.scrollHeight > maxHeight + 4);
  }, [text, maxLines]);

  return (
    <div>
      <p
        ref={textRef}
        className={className}
        style={{
          ...style,
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: expanded ? 'visible' : 'hidden',
        }}
      >
        {text}
      </p>
      {needsExpand && !expanded && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          className="text-[10px] font-medium mt-1 hover:underline"
          style={{ color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          اقرأ المزيد ▾
        </button>
      )}
      {expanded && needsExpand && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
          className="text-[10px] font-medium mt-1 hover:underline"
          style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          عرض أقل ▴
        </button>
      )}
    </div>
  );
}

const categoryConfig: Record<string, { css: string; label: string; accent: string }> = {
  'بنوك مركزية': { css: 'cat-central-banks', label: 'بنوك مركزية', accent: '#A78BFA' },
  'سلع': { css: 'cat-metals', label: 'سلع', accent: '#FBBF24' },
  'أسواق عربية': { css: 'cat-arab-markets', label: 'أسواق عربية', accent: '#00C9A7' },
  'اقتصاد أمريكي': { css: 'cat-macro', label: 'اقتصاد أمريكي', accent: '#FB7185' },
  'أرباح شركات': { css: 'cat-earnings', label: 'أرباح', accent: '#E8A020' },
  'فوركس': { css: 'cat-forex', label: 'فوركس', accent: '#60A5FA' },
  'عملات': { css: 'cat-forex', label: 'عملات', accent: '#60A5FA' },
  'تشفير': { css: 'cat-crypto', label: 'كريبتو', accent: '#A78BFA' },
  'كريبتو': { css: 'cat-crypto', label: 'كريبتو', accent: '#A78BFA' },
  'نفط': { css: 'cat-oil', label: 'طاقة', accent: '#FB923C' },
  'طاقة': { css: 'cat-oil', label: 'طاقة', accent: '#FB923C' },
  'أسهم': { css: 'cat-stocks', label: 'أسهم', accent: '#4ADE80' },
  'اقتصاد كلي': { css: 'cat-macro', label: 'اقتصاد كلي', accent: '#94A3B8' },
};

function getImpactBadge(impact: string) {
  if (impact === 'high') return { text: 'تأثير عالٍ', bg: 'rgba(244,63,94,0.12)', color: 'var(--bear)' };
  if (impact === 'medium') return { text: 'تأثير متوسط', bg: 'rgba(232,160,32,0.12)', color: 'var(--gold)' };
  return { text: 'منخفض', bg: 'rgba(100,116,139,0.12)', color: 'var(--neutral)' };
}

function getSentimentColor(sentiment: string) {
  if (sentiment === 'positive') return 'var(--bull)';
  if (sentiment === 'negative') return 'var(--bear)';
  return 'var(--neutral)';
}

function formatTimeStatic(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diff) || diff < 0) return 'الآن';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} د`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} س`;
    return `منذ ${Math.floor(hours / 24)} ي`;
  } catch { return 'الآن'; }
}

export default function LiveNews() {
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [archivePage, setArchivePage] = useState(1);
  const [archiveItems, setArchiveItems] = useState<any[]>([]);
  const [hasMoreArchive, setHasMoreArchive] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    liveNews,
    liveNewsLoading,
    liveNewsError,
    liveNewsLastUpdate,
    autoRefresh,
    liveMode,
    fetchLiveNews,
    setLiveMode,
  } = useNewsStore(
    useShallow((state) => ({
      liveNews: state.liveNews,
      liveNewsLoading: state.liveNewsLoading,
      liveNewsError: state.liveNewsError,
      liveNewsLastUpdate: state.liveNewsLastUpdate,
      autoRefresh: state.autoRefresh,
      liveMode: state.liveMode,
      fetchLiveNews: state.fetchLiveNews,
      setLiveMode: state.setLiveMode,
    }))
  );

  // Show loading skeleton when fetching and no data yet
  const isInitialLoading = liveNewsLoading && liveNews.length === 0;
  // Combine live news with archive items for infinite scroll
  const allNews = [...liveNews, ...archiveItems];
  const categories = ['الكل', ...Array.from(new Set(allNews.map(n => n.category)))];

  const filteredNews = allNews.filter(n => {
    const matchCategory = activeCategory === 'الكل' || n.category === activeCategory;
    if (!searchQuery) return matchCategory;
    const q = searchQuery.toLowerCase();
    const title = (n.translatedTitle || n.title || '').toLowerCase();
    const summary = (n.translatedSummary || n.summary || '').toLowerCase();
    return matchCategory && (title.includes(q) || summary.includes(q));
  });

  const displayNews = filteredNews.slice(0, visibleCount);
  const hasMore = filteredNews.length > visibleCount || hasMoreArchive;

  // Load more from archive API when user scrolls past live news
  const loadMoreFromArchive = useCallback(async () => {
    if (!hasMoreArchive || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/news/archive?page=${archivePage}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const newItems = (data.items || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          translatedTitle: item.titleAr || undefined,
          summary: item.summary || '',
          translatedSummary: item.summaryAr || undefined,
          source: item.source || '',
          category: item.category || 'اقتصاد كلي',
          slug: item.slug || '',
          sentiment: item.sentiment || 'neutral',
          impactLevel: item.impactLevel || 'low',
          time: item.fetchedAt,
          imageUrl: item.imageUrl || undefined,
          newsType: item.newsType,
        }));
        // Deduplicate
        const existingIds = new Set(allNews.map(n => n.id));
        const uniqueNew = newItems.filter((n: any) => !existingIds.has(n.id));
        setArchiveItems(prev => [...prev, ...uniqueNew]);
        setHasMoreArchive(data.hasMore || false);
        setArchivePage(prev => prev + 1);
      } else {
        setHasMoreArchive(false);
      }
    } catch {
      setHasMoreArchive(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [archivePage, hasMoreArchive, isLoadingMore, allNews]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          if (filteredNews.length > visibleCount) {
            // Still have local items to show
            setVisibleCount(prev => prev + 10);
          } else if (hasMoreArchive) {
            // Need to fetch from archive
            loadMoreFromArchive();
          }
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, filteredNews.length, visibleCount, hasMoreArchive, loadMoreFromArchive]);

  useEffect(() => { setVisibleCount(20); }, [liveNews, activeCategory, searchQuery]);
  useEffect(() => { fetchLiveNews(); }, [fetchLiveNews]);

  // Auto-refresh with batching (every 3s buffer check, 5min actual fetch)
  useEffect(() => {
    if (!autoRefresh || liveMode === 'paused') return;
    const interval = setInterval(() => { fetchLiveNews(); }, 5 * 60 * 1000);
          if (document.hidden) return; // V1020: skip polling when tab is hidden
    return () => clearInterval(interval);
  }, [autoRefresh, liveMode, fetchLiveNews]);

  // Fix hydration: only render time-dependent content after mount
  useEffect(() => { setMounted(true); }, []);

  const handleRefresh = useCallback(() => { fetchLiveNews(); }, [fetchLiveNews]);

  // Helper: build article URL from news item
  const getArticleHref = (news: any) => {
    if (!news) return '#';
    let pathSegment = news.slug || news.id;
    if (!pathSegment || typeof pathSegment !== 'string' || pathSegment === 'undefined' || pathSegment === 'null') {
      return '#';
    }
    try {
      if (pathSegment.includes('%')) {
        pathSegment = decodeURIComponent(pathSegment);
      }
    } catch {}
    return `/news/${pathSegment}`;
  };

  const toggleLiveMode = () => {
    if (liveMode === 'live') setLiveMode('paused');
    else setLiveMode('live');
  };

  const formatLastUpdate = () => {
    if (!liveNewsLastUpdate) return '';
    return formatTimeStatic(liveNewsLastUpdate);
  };

  return (
    <section id="news" className="section-block" aria-label="أخبار حية" role="region">
      <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>

        {/* Section Header with Live Toggle */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-[20px] font-bold" style={{ color: 'var(--text)' }}>أخبار حية</h2>
            {/* Live Toggle Button */}
            <button
              id="live-toggle"
              onClick={toggleLiveMode}
              aria-pressed={liveMode === 'live'}
              aria-label={liveMode === 'live' ? 'إيقاف التحديث الحي' : 'تفعيل التحديث الحي'}
              className={`live-status ${liveMode === 'live' ? 'live-status--live' : 'live-status--paused'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${liveMode === 'live' ? 'live-dot' : ''}`}
                style={{ background: liveMode === 'live' ? 'var(--bull)' : 'var(--gold)' }} />
              {liveMode === 'live' ? 'LIVE' : 'PAUSED'}
            </button>
            {liveNewsLastUpdate && (
              <span className="text-[10px]" style={{ color: 'var(--text3)' }} role="status" aria-live="polite" suppressHydrationWarning>
                {mounted ? formatLastUpdate() : '...'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg transition-all hover:bg-[var(--bg4)]"
              style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}
              disabled={liveNewsLoading}
              aria-label="تحديث الأخبار">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={liveNewsLoading ? 'animate-spin' : ''}>
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
              {liveNewsLoading ? '...' : 'تحديث'}
            </button>
            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: 'var(--bg4)' }}
              role="radiogroup" aria-label="طريقة عرض الأخبار">
              {([
                { mode: 'compact' as ViewMode, label: 'مختصر', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> },
                { mode: 'dense' as ViewMode, label: 'متوسط', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
                { mode: 'regular' as ViewMode, label: 'عادي', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> },
              ]).map(({ mode, label, icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className="px-2 py-1 rounded-md transition-all flex items-center"
                  role="radio" aria-checked={viewMode === mode} aria-label={label}
                  style={{
                    background: viewMode === mode ? 'var(--cyan2)' : 'transparent',
                    color: viewMode === mode ? 'var(--cyan)' : 'var(--text3)',
                  }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الأخبار..."
              aria-label="البحث في الأخبار"
              className="w-full pr-9 pl-4 py-2 rounded-xl text-[12px] outline-none transition-all focus:ring-1"
              style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)', '--tw-ring-color': 'var(--cyan)' } as any} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} aria-label="مسح البحث"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: 'var(--bg5)', color: 'var(--text3)' }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 custom-scrollbar" role="tablist" aria-label="تصفية حسب الفئة">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              role="tab" aria-selected={activeCategory === cat}
              className="whitespace-nowrap text-[11px] px-3 py-1 rounded-full transition-all cursor-pointer flex-shrink-0"
              style={{
                background: activeCategory === cat ? 'var(--cyan2)' : 'var(--bg4)',
                border: activeCategory === cat ? '1px solid rgba(0,201,167,0.3)' : '1px solid var(--border)',
                color: activeCategory === cat ? 'var(--cyan)' : 'var(--text3)',
                fontWeight: activeCategory === cat ? 600 : 400,
              }}>
              {cat}
            </button>
          ))}
          {filteredNews.length > 0 && (
            <span className="text-[9px] flex-shrink-0 mr-2" style={{ color: 'var(--text3)' }}>{filteredNews.length} خبر</span>
          )}
        </div>

        {/* Loading Skeleton */}
        {isInitialLoading && (
          <div className="space-y-2" role="status" aria-label="جارٍ تحميل الأخبار">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse" style={{ background: 'var(--bg4)', borderBottom: '1px solid var(--border)' }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--border)' }} />
                <span className="w-12 h-3 rounded flex-shrink-0" style={{ background: 'var(--border)' }} />
                <span className="w-16 h-3 rounded flex-shrink-0" style={{ background: 'var(--border)' }} />
                <span className="flex-1 h-3 rounded" style={{ background: 'var(--border)' }} />
                <span className="w-10 h-3 rounded flex-shrink-0" style={{ background: 'var(--border)' }} />
              </div>
            ))}
            <div className="flex items-center justify-center py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              <span className="text-[12px] mr-2" style={{ color: 'var(--cyan)' }}>جارٍ تحميل الأخبار...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {liveNewsError && liveNews.length === 0 && (
          <div className="mb-3 p-2.5 rounded-xl flex items-center gap-2" role="alert" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <span className="text-[11px]" style={{ color: 'var(--bear)' }}>تعذر تحميل الأخبار</span>
            <button onClick={handleRefresh} className="mr-auto text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(244,63,94,0.12)', color: 'var(--bear)' }}>إعادة المحاولة</button>
          </div>
        )}

        {/* Empty State */}
        {!isInitialLoading && !liveNewsError && liveNews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12" role="status">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" /></svg>
            <span className="text-[13px] mt-3" style={{ color: 'var(--text3)' }}>لا توجد أخبار حالياً</span>
            <button onClick={handleRefresh} className="mt-3 px-4 py-1.5 rounded-lg text-[11px]" style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.3)' }}>تحديث</button>
          </div>
        )}

        {/* ═══ COMPACT View — 72px cards, single-line rows ═══ */}
        {!isInitialLoading && liveNews.length > 0 && viewMode === 'compact' && (
          <div className="space-y-0" role="list" aria-label="قائمة الأخبار المختصرة">
            {displayNews.map((news) => {
              const catCfg = categoryConfig[news.category] || { css: 'cat-economy', label: news.category, accent: '#94A3B8' };
              const impact = getImpactBadge(news.impactLevel);
              const displayTitle = news.translatedTitle || news.title;
              return (
                <Link key={news.id} href={getArticleHref(news)}
                  className="card card--compact group transition-all duration-200 hover:bg-[var(--bg4)]"
                  style={{ borderBottom: '1px solid var(--border)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem' }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: getSentimentColor(news.sentiment) }} />
                  <span className="text-[9px] font-mono-price w-12 flex-shrink-0" style={{ color: 'var(--text3)' }} suppressHydrationWarning>{mounted ? formatTimeStatic(news.time) : '...'}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${catCfg.css}`}>{catCfg.label}</span>
                  <h3 className="text-[12px] flex-1 group-hover:text-[var(--cyan)] transition-colors min-w-0" style={{ color: 'var(--text)' }}>
                    <span className="block truncate">{displayTitle}</span>
                  </h3>
                  {(news.translatedSummary || news.summary) && (
                    <ExpandableText
                      text={news.translatedSummary || news.summary}
                      maxLines={2}
                      className="text-[10px] leading-[1.6] max-w-[300px]"
                      style={{ color: 'var(--text3)' }}
                    />
                  )}
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: impact.bg, color: impact.color }}>
                    {impact.text}
                  </span>
                  <span className="text-[9px] flex-shrink-0" style={{ color: 'var(--text3)' }}>{news.source || ''}</span>
                  <CardBookmarkBtn newsId={news.id} newsData={news} />
                </Link>
              );
            })}
          </div>
        )}

        {/* ═══ DENSE View — 120px cards, 2-3 column grid ═══ */}
        {!isInitialLoading && liveNews.length > 0 && viewMode === 'dense' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" role="list" aria-label="شبكة الأخبار المتوسطة"
            style={{ gap: 'var(--space-sm)' }}>
            {displayNews.map((news) => {
              const catCfg = categoryConfig[news.category] || { css: 'cat-economy', label: news.category, accent: '#94A3B8' };
              const impact = getImpactBadge(news.impactLevel);
              const displayTitle = news.translatedTitle || news.title;
              const displaySummary = news.translatedSummary || news.summary;
              return (
                <Link key={news.id} href={getArticleHref(news)}
                  className="card card--dense group transition-all duration-200 hover:border-[var(--border2)] rounded-xl overflow-hidden"
                  style={{ textDecoration: 'none', display: 'block', padding: '0.75rem' }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${catCfg.css}`}>{catCfg.label}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: impact.bg, color: impact.color }}>{impact.text}</span>
                    <span className="flex-1" />
                    <CardBookmarkBtn newsId={news.id} newsData={news} />
                  </div>
                  <h3 className="text-[12px] font-bold leading-[1.5] group-hover:text-[var(--cyan)] transition-colors line-clamp-2" style={{ color: 'var(--text)' }}>
                    {displayTitle}
                  </h3>
                  {displaySummary && (
                    <ExpandableText
                      text={displaySummary}
                      maxLines={5}
                      className="text-[10px] leading-[1.6] mt-1"
                      style={{ color: 'var(--text3)' }}
                    />
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px]" style={{ color: 'var(--text3)' }}>{news.source || 'مصدر'}</span>
                    <span className="w-1 h-1 rounded-full" style={{ background: getSentimentColor(news.sentiment) }} />
                    <span className="text-[9px] font-mono-price mr-auto" style={{ color: 'var(--text3)' }} suppressHydrationWarning>{mounted ? formatTimeStatic(news.time) : '...'}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ═══ REGULAR View — 160px cards, with thumbnails ═══ */}
        {!isInitialLoading && liveNews.length > 0 && viewMode === 'regular' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" role="list" aria-label="شبكة الأخبار الكاملة"
            style={{ gap: 'var(--space-sm)' }}>
            {displayNews.map((news) => {
              const catCfg = categoryConfig[news.category] || { css: 'cat-economy', label: news.category, accent: '#94A3B8' };
              const impact = getImpactBadge(news.impactLevel);
              const displayTitle = news.translatedTitle || news.title;
              const displaySummary = news.translatedSummary || news.summary;
              const hasImage = !!news.imageUrl;
              return (
                <Link key={news.id} href={getArticleHref(news)}
                  className="card card--regular group transition-all duration-200 hover:border-[var(--border2)] rounded-xl overflow-hidden"
                  style={{ textDecoration: 'none', display: 'block' }}>
                  {/* Compact horizontal layout: small image + content */}
                  <div className="flex gap-0 h-full">
                    {hasImage ? (
                      <div className="relative w-[90px] min-h-full flex-shrink-0 overflow-hidden">
                        <NewsImage
                          src={news.imageUrl}
                          alt={news.title || 'صورة خبر'}
                          category={news.category}
                          width={90}
                          height={90}
                          className="w-full h-full object-cover"
                          style={{ width: '90px', height: '100%' }}
                        />
                      </div>
                    ) : (
                      <div className="w-[50px] min-h-full flex-shrink-0 flex items-center justify-center"
                        style={{ background: `${catCfg.accent}10` }}>
                        <span className="text-[8px] font-bold" style={{ color: catCfg.accent }}>{catCfg.label.slice(0, 2)}</span>
                      </div>
                    )}
                    <div className="flex-1 p-2.5 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${catCfg.css}`}>{catCfg.label}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: impact.bg, color: impact.color }}>{impact.text}</span>
                        <span className="flex-1" />
                        <CardBookmarkBtn newsId={news.id} newsData={news} />
                      </div>
                      <h3 className="text-[12px] font-bold leading-[1.5] group-hover:text-[var(--cyan)] transition-colors line-clamp-2" style={{ color: 'var(--text)' }}>
                        {displayTitle}
                      </h3>
                      {displaySummary && (
                        <ExpandableText
                          text={displaySummary}
                          maxLines={5}
                          className="text-[10px] leading-[1.6] mt-1"
                          style={{ color: 'var(--text3)' }}
                        />
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px]" style={{ color: 'var(--text3)' }}>{news.source || 'مصدر'}</span>
                        <span className="w-1 h-1 rounded-full" style={{ background: getSentimentColor(news.sentiment) }} />
                        <span className="text-[9px] font-mono-price mr-auto" style={{ color: 'var(--text3)' }} suppressHydrationWarning>{mounted ? formatTimeStatic(news.time) : '...'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex items-center justify-center py-6">
            {isLoadingMore ? (
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                <span className="text-[11px]" style={{ color: 'var(--cyan)' }}>جارٍ التحميل...</span>
              </div>
            ) : (
              <button onClick={() => {
                if (filteredNews.length > visibleCount) {
                  setVisibleCount(prev => prev + 10);
                } else {
                  loadMoreFromArchive();
                }
              }}
                className="px-5 py-2 rounded-xl text-[11px] font-medium transition-all hover:-translate-y-0.5"
                style={{ border: '1px solid var(--border)', color: 'var(--text2)', background: 'var(--bg4)' }}
                aria-label="تحميل المزيد من الأرشيف">
                {isLoadingMore ? 'جارٍ التحميل...' : 'تحميل المزيد من الأرشيف'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
