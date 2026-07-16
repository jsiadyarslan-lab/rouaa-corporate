// ─── NewsFeaturedGrid v3 — Bloomberg-style Featured Cards ──────────
// Client Component: Fetches articles from /api/news/live API
// This ensures articles ALWAYS display, even when server-side
// Prisma queries fail in the standalone Docker environment.

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NewsImage from '@/components/rouaa/NewsImage';

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
  time?: string;
  newsType?: string;
}

function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    forex: 'فوركس', metals: 'معادن', crypto: 'كريبتو', oil: 'نفط',
    stocks: 'أسهم', 'arab-markets': 'أسواق عربية', 'central-banks': 'بنوك مركزية',
    earnings: 'أرباح', macro: 'ماكرو', fed: 'فيدرالي', economy: 'اقتصاد',
  };
  return labels[cat] || 'أخبار';
}

export default function NewsFeaturedGrid() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news/live');
        if (res.ok) {
          const data = await res.json();
          const news = data.news || [];
          // Skip the first article (used in hero), take next 3
          // FIX: With 100 articles now, we still show 3 featured cards
          setArticles(news.slice(1, 4));
        }
      } catch (err) {
        console.warn('[NewsFeaturedGrid] Fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
    // Refresh every 5 minutes (skip when tab is hidden)
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchNews();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <section className="container" style={{ paddingBottom: 'var(--space-md)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border" style={{
              background: 'var(--surface-1)',
              borderColor: 'var(--rim)',
              height: '280px',
            }}>
              <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--r)' }} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  return (
    <section className="container" style={{ paddingBottom: 'var(--space-md)' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {articles.map((news, index) => {
          const displayTitle = news.titleAr || news.title;
          const displaySummary = news.summaryAr || news.summary;
          const sourceName = news.sourceName || news.source;
          // imageUrl is already computed by /api/news/live to prefer AI-generated image
          const imageUrl = news.imageUrl;
          const category = news.category || 'economy';
          const isAI = !!news.aiAnalysis;
          const isFirst = index === 0;

          return (
            <Link key={news.id} href={`/news/${news.slug || news.id}`} className="group block">
              <article
                className="relative h-full overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'var(--surface-1)',
                  borderColor: isFirst ? 'rgba(0,229,255,0.15)' : 'var(--rim)',
                  boxShadow: isFirst ? '0 0 30px rgba(0,229,255,0.06)' : '0 4px 20px rgba(0,0,0,0.2)',
                }}
              >
                {/* Top accent line for first card */}
                {isFirst && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: 'linear-gradient(90deg, var(--cyan), var(--purple))',
                  }} />
                )}

                {/* Image — always show (gradient fallback if missing/failed) */}
                <div className="aspect-video overflow-hidden">
                  <NewsImage
                    src={imageUrl}
                    alt={displayTitle}
                    category={category}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>

                {/* Content */}
                <div style={{ padding: 'var(--space-sm)' }}>
                  {/* Category + AI Badge Row */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`cat-${category} text-[10px] px-2 py-0.5 rounded-md font-semibold`}>
                      {getCategoryLabel(category)}
                    </span>
                    {isAI && (
                      <span className="badge-ai text-[9px] px-2 py-0.5">AI</span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-[15px] font-bold mb-2 line-clamp-2 leading-relaxed transition-colors duration-200"
                    style={{ color: 'var(--text-head)' }}
                  >
                    {displayTitle}
                  </h3>

                  {/* Summary */}
                  <p className="text-[12px] line-clamp-2 mb-3 leading-relaxed" style={{ color: 'var(--text2)' }}>
                    {displaySummary}
                  </p>

                  {/* Source + Time */}
                  <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text3)' }}>
                    <span className="font-semibold" style={{ color: 'var(--cyan)' }}>{sourceName}</span>
                    <span style={{ color: 'var(--text4)' }}>•</span>
                    <span>
                      {news.time ? new Date(news.time).toLocaleDateString('ar-SA', {
                        month: 'short', day: 'numeric',
                      }) : ''}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
