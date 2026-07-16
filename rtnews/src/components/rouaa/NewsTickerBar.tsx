'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useNewsStore, useShallow } from '@/stores/news-store';

interface NewsItem {
  id: string;
  title: string;
  titleAr?: string | null;
  translatedTitle?: string | null;
  slug?: string | null;
  source?: string | null;
}

export default function NewsTickerBar({ className = '' }: { className?: string }) {
  const { liveNews, liveNewsLoading, fetchLiveNews } = useNewsStore(
    useShallow((state) => ({
      liveNews: state.liveNews,
      liveNewsLoading: state.liveNewsLoading,
      fetchLiveNews: state.fetchLiveNews,
    }))
  );

  useEffect(() => {
    // Fetch if no data yet
    if (liveNews.length === 0) {
      fetchLiveNews();
    }
    const interval = setInterval(() => { if (!document.hidden) fetchLiveNews(); }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLiveNews, liveNews.length]);

  const headlines: NewsItem[] = liveNews;

  if (!liveNewsLoading && headlines.length === 0) return null;

  // Duplicate for seamless scroll
  const allHeadlines = [...headlines, ...headlines];

  return (
    <div
      role="region"
      aria-label="شريط عناوين الأخبار"
      className={`fixed left-0 right-0 z-[1002] overflow-hidden ${className}`}
      style={{
        top: '40px',
        height: '28px',
        background: 'linear-gradient(90deg, rgba(0,229,255,0.04), rgba(139,92,246,0.04), rgba(0,229,255,0.04))',
        borderBottom: '1px solid rgba(0,229,255,0.06)',
      }}
    >
      {/* Label */}
      <div
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5"
        style={{
          background: 'rgba(0,229,255,0.08)',
          border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: '6px',
          padding: '2px 8px',
          fontSize: '9px',
          fontWeight: 700,
          color: 'var(--cyan)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
        </svg>
        <span>أخبار</span>
      </div>

      {/* Right fade mask */}
      <div
        className="absolute right-[70px] top-0 bottom-0 w-16 z-[1]"
        style={{ background: 'linear-gradient(to left, var(--bg), transparent)' }}
      />

      {/* Left fade mask */}
      <div
        className="absolute left-0 top-0 bottom-0 w-12 z-[1]"
        style={{ background: 'linear-gradient(to right, var(--bg), transparent)' }}
      />

      {/* Scrolling headlines */}
      {liveNewsLoading ? (
        <div className="h-full flex items-center gap-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="inline-flex items-center gap-2 h-[28px] px-4" style={{ borderLeft: '1px solid rgba(0,229,255,0.05)' }}>
              <div className="skeleton" style={{ width: '120px', height: '10px' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="news-ticker-scroll h-full items-center">
          {allHeadlines.map((news, i) => {
            const title = news.titleAr || news.translatedTitle || news.title;
            const slug = news.slug;
            const href = slug ? `/news/${slug}` : news.id ? `/news/${news.id}` : '#';
            return (
              <Link
                key={`nt-${i}`}
                href={href}
                className="inline-flex items-center gap-2 h-[28px] px-4 transition-colors hover:text-[var(--cyan)]"
                style={{
                  color: 'var(--text2)',
                  fontSize: '11px',
                  fontWeight: 500,
                  borderLeft: '1px solid rgba(0,229,255,0.05)',
                  flexShrink: 0,
                  textDecoration: 'none',
                }}
              >
                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--cyan)', opacity: 0.5 }} />
                <span className="whitespace-nowrap">{title}</span>
                {news.source && (
                  <span className="text-[9px] flex-shrink-0" style={{ color: 'var(--text3)' }}>
                    ({news.source})
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .news-ticker-scroll {
          display: flex;
          animation: news-ticker 60s linear infinite;
          will-change: transform;
        }
        .news-ticker-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes news-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
