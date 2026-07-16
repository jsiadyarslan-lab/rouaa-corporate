'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNewsStore, useShallow } from '@/stores/news-store';

export default function BreakingFlash() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  // Use Zustand selector to prevent unnecessary re-renders from other store changes
  const {
    breakingNews,
    breakingNewsLoading,
    newBreakingAlert,
    setNewBreakingAlert,
    fetchBreakingNews,
  } = useNewsStore(
    useShallow((state) => ({
      breakingNews: state.breakingNews,
      breakingNewsLoading: state.breakingNewsLoading,
      newBreakingAlert: state.newBreakingAlert,
      setNewBreakingAlert: state.setNewBreakingAlert,
      fetchBreakingNews: state.fetchBreakingNews,
    }))
  );

  const displayNews = breakingNews;
  const isInitialLoading = breakingNewsLoading && breakingNews.length === 0;

  useEffect(() => { fetchBreakingNews(); }, [fetchBreakingNews]);

  useEffect(() => {
    const interval = setInterval(() => { fetchBreakingNews(); }, 3 * 60 * 1000);
          if (document.hidden) return; // V1020: skip polling when tab is hidden
    return () => clearInterval(interval);
  }, [fetchBreakingNews]);

  useEffect(() => {
    if (newBreakingAlert) {
      const timer = setTimeout(() => { setNewBreakingAlert(null); }, 8000);
      return () => clearTimeout(timer);
    }
  }, [newBreakingAlert, setNewBreakingAlert]);

  if (!visible) {
    // Re-enable visibility after 5 minutes for new breaking news
    if (dismissedAt && Date.now() - dismissedAt > 5 * 60 * 1000) {
      setVisible(true);
      setDismissedAt(null);
    } else {
      return null;
    }
  }

  // Show minimal loading state while fetching initial breaking news
  if (isInitialLoading) {
    return (
      <div className="flex items-center gap-2" style={{ height: '32px', background: 'var(--bg2)', borderBottom: '1px solid rgba(255,184,0,.08)', padding: '0 12px' }}>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="flash-alert inline-flex items-center gap-1 rounded px-1.5 py-0.5"
            style={{ background: '#B33A3A', color: '#fff', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px' }}>
            <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            عاجل
          </span>
        </div>
        <div className="flex-1 overflow-hidden" style={{ height: '32px' }}>
          <div className="h-full flex items-center gap-3">
            <div className="skeleton" style={{ width: '60%', height: '11px' }} />
            <div className="skeleton" style={{ width: '30%', height: '11px' }} />
          </div>
        </div>
      </div>
    );
  }

  // No breaking news available - don't show the bar
  if (displayNews.length === 0) return null;

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return 'var(--bull)';
    if (sentiment === 'negative') return 'var(--bear)';
    return 'var(--neutral)';
  };

  const handleCardClick = (news: any) => {
    if (!news) return;
    let pathSegment = news.slug || news.id;
    if (!pathSegment || typeof pathSegment !== 'string' || pathSegment === 'undefined' || pathSegment === 'null') {
      console.warn('[BreakingFlash] Skipping navigation — invalid article identifier:', news.id, news.slug);
      return;
    }
    // Decode if already URL-encoded (prevents double-encoding in browser URL)
    try {
      if (pathSegment.includes('%')) {
        pathSegment = decodeURIComponent(pathSegment);
      }
    } catch {}
    // Navigate to article page - all data comes from DB via slug
    router.push(`/news/${pathSegment}`);
  };

  return (
    <>
      {/* New Breaking News Toast — compact, non-intrusive */}
      {newBreakingAlert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[2000]" style={{ width: '90%', maxWidth: '420px' }}
          role="alert" aria-live="assertive">
          <div className="rounded-lg p-2.5 flex items-center gap-2 cursor-pointer"
            style={{
              background: 'rgba(255,77,106,0.12)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,77,106,0.2)',
              boxShadow: '0 4px 16px rgba(255,77,106,0.1)',
            }}
            onClick={() => { setNewBreakingAlert(null); handleCardClick(newBreakingAlert); }}>
            <div className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'rgba(255,77,106,0.2)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-bold mb-0.5" style={{ color: 'var(--bear)' }}>خبر عاجل</div>
              <div className="text-[11px] font-medium leading-relaxed truncate" style={{ color: 'var(--text)' }}>
                {newBreakingAlert.translatedTitle || newBreakingAlert.titleAr || newBreakingAlert.title}
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setNewBreakingAlert(null); }}
              className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center"
              aria-label="إغلاق التنبيه"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text3)' }}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Breaking News Ticker Bar — Compact, single strip */}
      <div className="flex items-center gap-2" role="region" aria-label="شريط الأخبار العاجلة"
        style={{
          height: '32px',
        background: 'var(--bg2)',
        borderBottom: '1px solid rgba(255,184,0,.08)',
        padding: '0 12px',
      }}>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="flash-alert inline-flex items-center gap-1 rounded px-1.5 py-0.5"
            style={{
              background: '#B33A3A',
              color: '#fff',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '1.5px',
            }}>
            <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            عاجل
          </span>
          <button onClick={() => fetchBreakingNews()}
            className="text-[9px] px-1.5 py-0.5 rounded transition-all hover:bg-[var(--bg4)]"
            style={{ color: 'var(--text3)' }}
            aria-label="تحديث الأخبار العاجلة"
            disabled={breakingNewsLoading}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={breakingNewsLoading ? 'animate-spin' : ''}>
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </button>
        </div>

        {/* Scrolling headlines */}
        <div className="flex-1 overflow-hidden relative" style={{ height: '32px' }}>
          <div className="ticker-track-breaking h-full items-center whitespace-nowrap">
            {displayNews.map((news, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-4 cursor-pointer hover:underline transition-colors"
                style={{ color: 'var(--text)', fontSize: '11px', fontWeight: 500 }}
                onClick={() => handleCardClick(news)}>
                <span className="w-1 h-1 rounded-full" style={{ background: getSentimentColor(news.sentiment) }} />
                {news.translatedTitle || news.titleAr || news.title}
              </span>
            ))}
            {displayNews.map((news, i) => (
              <span key={`d-${i}`} className="inline-flex items-center gap-1.5 px-4 cursor-pointer hover:underline transition-colors"
                style={{ color: 'var(--text)', fontSize: '11px', fontWeight: 500 }}
                onClick={() => handleCardClick(news)}>
                <span className="w-1 h-1 rounded-full" style={{ background: getSentimentColor(news.sentiment) }} />
                {news.translatedTitle || news.titleAr || news.title}
              </span>
            ))}
          </div>
        </div>

        <button onClick={() => { setVisible(false); setDismissedAt(Date.now()); }}
          className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all hover:bg-[var(--bg4)]"
          aria-label="إخفاء شريط العاجل"
          style={{ color: 'var(--text3)' }}>
          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <style jsx>{`
        .ticker-track-breaking {
          display: flex;
          animation: ticker-breaking 35s linear infinite;
          will-change: transform;
        }
        .ticker-track-breaking:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-breaking {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </>
  );
}
