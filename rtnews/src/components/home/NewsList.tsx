// ─── NewsList v5 — Reuters-style Timeline with Archive Pagination ──
// Client Component: Fetches articles from /api/news/live API
// Supports pagination via the API's page/limit parameters.
// ALL articles are accessible — no article is ever lost.
// V341: Accepts `locale` prop — single component for all languages.

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import NewsImage from '@/components/rouaa/NewsImage';
import { getSharedLabels } from '@/lib/i18n/shared';

interface Article {
  id: string;
  title: string;
  titleAr?: string;
  summary?: string;
  summaryAr?: string;
  source?: string;
  sourceName?: string;
  imageUrl?: string;
  category?: string;
  slug: string;
  aiAnalysis?: any;
  sentiment?: string;
  time?: string;
  newsType?: string;
}

interface NewsListProps {
  /** Locale code: 'ar' | 'en' | 'fr'. Defaults to 'ar'. */
  locale?: string;
}

export default function NewsList({ locale = 'ar' }: NewsListProps) {
  // ── i18n labels ──
  const L = getSharedLabels(locale);

  // Locale-aware link prefix
  const prefix = locale === 'ar' ? '/ar' : `/${locale}`;

  // Category label lookup
  const getCategoryLabel = (cat: string): string => {
    const key = `newsList.cat.${cat}` as keyof typeof L;
    return L[key] || L['newsList.defaultCategory'];
  };

  // Time-ago with locale abbreviations
  const getTimeAgo = (date: Date | string): string => {
    try {
      const now = new Date();
      const d = new Date(date);
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return L['newsList.time.now'];
      if (diffMin < 60) return `${diffMin}${L['newsList.time.min']}`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}${L['newsList.time.hour']}`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 30) return `${diffDay}${L['newsList.time.day']}`;
      const diffMonth = Math.floor(diffDay / 30);
      return `${diffMonth}${L['newsList.time.month']}`;
    } catch {
      return '';
    }
  };

  // Sentiment label helper
  const sentimentLabel = (sentiment: string): string => {
    if (sentiment === 'positive') return L['newsList.sentiment.positive'];
    if (sentiment === 'negative') return L['newsList.sentiment.negative'];
    return L['newsList.sentiment.neutral'];
  };

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 20;

  // Fetch the first page (articles 5+ since 1-4 are in hero/featured)
  const fetchInitialNews = useCallback(async () => {
    try {
      // Fetch first 2 pages to cover hero(1) + featured(3) + list(20+)
      const res = await fetch('/api/news/live?limit=40');
      if (res.ok) {
        const data = await res.json();
        const news = data.news || [];
        setArticles(news.slice(4)); // Skip first 4 (hero + featured)
        setTotalArticles(data.total || 0);
        // We fetched 40 items, slice(4) = 36 items. Has more if total > 40
        setHasMore((data.total || 0) > 40);
        setPage(2); // Next fetch will be page 2 (since we already got 40 items = ~2 pages)
      }
    } catch (err) {
      console.warn('[NewsList] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more articles from the archive API
  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      // Use the archive API for deeper pagination
      const res = await fetch(`/api/news/archive?page=${page}&limit=${PAGE_SIZE}`);
      if (res.ok) {
        const data = await res.json();
        const newItems = data.items || [];
        if (newItems.length > 0) {
          // Map archive items to Article format
          const mapped: Article[] = newItems.map((item: any) => ({
            id: item.id,
            title: item.title,
            titleAr: item.titleAr || undefined,
            summary: item.summary,
            summaryAr: item.summaryAr || undefined,
            source: item.source,
            // Always use /api/article-image route — it handles all image formats
            imageUrl: `/api/article-image/${item.id}`,
            category: item.category,
            slug: item.slug || '',
            sentiment: item.sentiment,
            time: item.fetchedAt,
            newsType: item.newsType,
          }));
          // Deduplicate: don't add articles we already have
          const existingIds = new Set(articles.map(a => a.id));
          const uniqueNew = mapped.filter((a: Article) => !existingIds.has(a.id));
          setArticles(prev => [...prev, ...uniqueNew]);
          setHasMore(data.hasMore || false);
          setTotalArticles(data.total || 0);
          setPage(prev => prev + 1);
        } else {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.warn('[NewsList] Load more failed:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, articles]);

  useEffect(() => {
    fetchInitialNews();
    // Refresh initial data every 5 minutes (skip when tab is hidden)
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchInitialNews();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchInitialNews]);

  if (loading) {
    return (
      <section className="container" style={{ paddingBottom: 'var(--space-md)' }}>
        <div className="sh" style={{ marginBottom: 'var(--space-sm)' }}>
          <h2 className="sh-title">{L['newsList.heading']}</h2>
          <Link href={`${prefix}/news`} className="sh-link">{L['newsList.viewAll']}</Link>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--r)' }} />
          ))}
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  return (
    <section className="container" style={{ paddingBottom: 'var(--space-md)' }}>
      {/* Section Header */}
      <div className="sh" style={{ marginBottom: 'var(--space-sm)' }}>
        <h2 className="sh-title">{L['newsList.heading']}</h2>
        <div className="flex items-center gap-3">
          {totalArticles > 0 && (
            <span className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
              {totalArticles} {L['newsList.archiveCount']}
            </span>
          )}
          <Link href={`${prefix}/news`} className="sh-link">{L['newsList.viewAll']}</Link>
        </div>
      </div>

      {/* News List — Timeline style */}
      <div className="space-y-2">
        {articles.map((news, index) => {
          const displayTitle = news.titleAr || news.title;
          const sourceName = news.sourceName || news.source;
          const imageUrl = news.imageUrl;
          const category = news.category || 'economy';
          const isAI = !!news.aiAnalysis;
          const sentiment = news.sentiment;
          const timeAgo = getTimeAgo(news.time || '');
          // V1219: Support unified content feed (kind, badge, href, isOfficialSource)
          const isOfficial = news.isOfficialSource || sourceName === 'محرر رؤى الذكي' || sourceName === 'Rouaa Smart Editor';
          const badge = news.badge;
          const itemHref = news.href || `${prefix}/news/${news.slug || news.id}`;

          return (
            <Link key={news.id} href={itemHref} className="group block">
              <article
                className="flex gap-3 rounded-lg border transition-all duration-200 hover:border-[rgba(0,229,255,0.15)]"
                style={{
                  background: 'var(--surface-1)',
                  borderColor: 'var(--rim)',
                  padding: '10px var(--space-sm)',
                }}
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center flex-shrink-0 pt-1" style={{ width: '20px' }}>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: isAI ? 'var(--purple)' : 'var(--cyan)',
                      boxShadow: isAI ? '0 0 8px rgba(139,92,246,0.4)' : '0 0 8px rgba(0,229,255,0.4)',
                    }}
                  />
                  {index < articles.length - 1 && (
                    <div className="w-px flex-1 mt-1" style={{ background: 'var(--rim)', minHeight: '20px' }} />
                  )}
                </div>

                {/* Thumbnail — always show (gradient fallback if missing) */}
                <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg">
                  <NewsImage
                    src={imageUrl}
                    alt={displayTitle}
                    category={category}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Category + Badges */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`cat-${category} text-[9px] px-1.5 py-0.5 rounded font-semibold`}>
                      {getCategoryLabel(category)}
                    </span>
                    {isAI && <span className="badge-ai text-[8px] px-1.5 py-0.5">AI</span>}
                    {sentiment && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          background: sentiment === 'positive' ? 'var(--up-dim)' : sentiment === 'negative' ? 'var(--down-dim)' : 'rgba(100,116,139,0.12)',
                          color: sentiment === 'positive' ? 'var(--up)' : sentiment === 'negative' ? 'var(--down)' : 'var(--neutral)',
                          border: `1px solid ${sentiment === 'positive' ? 'rgba(34,197,94,0.2)' : sentiment === 'negative' ? 'rgba(239,83,80,0.2)' : 'rgba(100,116,139,0.2)'}`,
                        }}
                      >
                        {sentimentLabel(sentiment)}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-[13px] font-semibold mb-1 line-clamp-2 leading-relaxed transition-colors duration-200"
                    style={{ color: 'var(--text-1)' }}
                  >
                    {displayTitle}
                  </h3>

                  {/* Source + Time + Badge */}
                  <div className="flex items-center gap-2 text-[10px] flex-wrap" style={{ color: 'var(--text3)' }}>
                    {badge && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: '3px',
                        color: 'var(--bg)', background: 'var(--cyan)',
                      }}>
                        {badge}
                      </span>
                    )}
                    {isOfficial && (
                      <span style={{
                        fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: '3px',
                        color: 'var(--cyan)', background: 'rgba(0, 212, 255, 0.1)',
                        border: '1px solid rgba(0, 212, 255, 0.2)',
                        display: 'inline-flex', alignItems: 'center', gap: 2,
                      }}>
                        <span style={{ fontSize: 8 }}>✦</span> محرر رؤى الذكي
                      </span>
                    )}
                    {!isOfficial && sourceName && (
                      <span className="font-semibold" style={{ color: 'var(--cyan)' }}>{sourceName}</span>
                    )}
                    <span style={{ color: 'var(--text4)' }}>•</span>
                    <span className="font-mono-price">{timeAgo}</span>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              background: loadingMore ? 'rgba(0,229,255,0.04)' : 'rgba(0,229,255,0.08)',
              color: 'var(--cyan)',
              border: '1px solid rgba(0,229,255,0.15)',
              opacity: loadingMore ? 0.6 : 1,
            }}
            onMouseOver={(e) => {
              if (!loadingMore) e.currentTarget.style.background = 'rgba(0,229,255,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(0,229,255,0.08)';
            }}
          >
            {loadingMore ? L['newsList.loading'] : `${L['newsList.loadMore']} (${totalArticles - articles.length} ${L['newsList.loadMoreRemaining']})`}
          </button>
        </div>
      )}

      {/* Archive stats */}
      {!hasMore && articles.length > 0 && (
        <div className="flex justify-center mt-3">
          <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
            {L['newsList.archiveComplete']} ({articles.length} {L['newsList.newsUnit']})
          </span>
        </div>
      )}
    </section>
  );
}
