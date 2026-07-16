'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { NEWS_CATEGORIES, IMPACT_CONFIG, SENTIMENT_CONFIG, formatTimeAgo } from '@/lib/news-categories';
import { NewsItemData } from '@/components/rouaa/news/NewsCards';
import { sanitizeDisplayText } from '@/lib/clean-markdown';
import NewsImage from '@/components/rouaa/NewsImage';

// ─── Color Palette (Bloomberg/FT Inspired) ────────────────────────
const C = {
  navy: '#0A0E27',
  darkCard: '#0F1629',
  darkCardHover: '#141B33',
  cyan: '#00E5FF',
  cyanDim: 'rgba(0,229,255,0.06)',
  cyanBorder: 'rgba(0,229,255,0.15)',
  purple: '#8B5CF6',
  purpleDim: 'rgba(139,92,246,0.06)',
  purpleBorder: 'rgba(139,92,246,0.2)',
  gold: '#d4af37',
  goldDim: 'rgba(212,175,55,0.06)',
  green: '#10B981',
  red: '#EF4444',
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
};

// ─── Format DB item ─────────────────────────────────────────────

function formatNewsItem(item: any): NewsItemData {
  let affectedAssets: { symbol: string; direction?: string }[] = [];
  if (item.cachedAffectedAssets) {
    try {
      const parsed = typeof item.cachedAffectedAssets === 'string'
        ? JSON.parse(item.cachedAffectedAssets) : item.cachedAffectedAssets;
      if (Array.isArray(parsed)) {
        affectedAssets = parsed.map((a: any) => ({
          symbol: typeof a.symbol === 'string' ? a.symbol : String(a),
          direction: typeof a.direction === 'string' ? a.direction : undefined,
        }));
      }
    } catch {}
  }

  return {
    id: item.id,
    title: item.title || '',
    summary: item.summary || '',
    translatedTitle: item.translatedTitle || item.titleAr || undefined,
    translatedSummary: item.translatedSummary || item.summaryAr || undefined,
    time: item.time || item.date || item.fetchedAt || new Date().toISOString(),
    source: item.source || '',
    url: item.url || '',
    category: item.category || 'اقتصاد كلي',
    sentiment: item.sentiment || 'neutral',
    sentimentScore: item.sentimentScore || 55,
    impactLevel: item.impactLevel || 'low',
    newsType: item.newsType || 'live',
    imageUrl: item.imageUrl || (item.id ? `/api/article-image/${item.id}` : undefined),
    slug: item.slug || undefined,
    affectedAssets,
    aiAnalysis: item.aiAnalysis || undefined,
    views: item.views || 0,
  };
}

// ─── Featured Card ──────────────────────────────────────────────

function FeaturedCard({ news, category, mounted }: { news: NewsItemData; category: typeof NEWS_CATEGORIES[number]; mounted: boolean }) {
  const displayTitle = news.translatedTitle || news.title;
  const displaySummary = news.translatedSummary || news.summary;
  const sentimentCfg = SENTIMENT_CONFIG[news.sentiment] || SENTIMENT_CONFIG.neutral;
  const impactCfg = IMPACT_CONFIG[news.impactLevel] || IMPACT_CONFIG.low;
  const pathSegment = news.slug || news.id;

  return (
    <Link href={pathSegment ? `/news/${pathSegment}` : '#'} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          position: 'relative', borderRadius: '16px', overflow: 'hidden',
          background: C.darkCard, border: `1px solid ${C.border}`,
          transition: 'all 0.3s ease', cursor: 'pointer',
          borderInlineStart: `3px solid ${category.color}`,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = C.borderHover;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: 'clamp(200px, 32vw, 300px)', overflow: 'hidden' }}>
          <NewsImage
            src={news.imageUrl}
            alt=""
            category={news.category}
            style={{ width: '100%', height: '100%' }}
          />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, #0F1629 0%, rgba(15,22,41,0.8) 50%, transparent 100%)' }} />
          {news.newsType === 'breaking' && (
            <span style={{ position: 'absolute', top: '12px', insetInlineStart: '12px', padding: '4px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, background: 'rgba(239,68,68,0.9)', color: '#fff', backdropFilter: 'blur(8px)', letterSpacing: '1px', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>عاجل</span>
          )}
          {news.impactLevel === 'high' && (
            <span style={{ position: 'absolute', top: '12px', insetInlineEnd: '12px', background: `${impactCfg.color}cc`, color: '#fff', padding: '3px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: 600, backdropFilter: 'blur(8px)' }}>تأثير عالي</span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '9px', padding: '3px 10px', borderRadius: '4px', fontWeight: 700, background: category.colorBg, color: category.color, border: `1px solid ${category.colorBorder}`, textTransform: 'uppercase' as const, letterSpacing: '0.3px' }}>
              {category.icon} {category.nameAr}
            </span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sentimentCfg.color, flexShrink: 0 }} />
            <span style={{ fontSize: '9px', color: sentimentCfg.color, fontWeight: 600 }}>{sentimentCfg.label}</span>
            {news.aiAnalysis && (
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>AI</span>
            )}
            <span style={{ fontSize: '10px', color: C.textMuted, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
              {mounted ? formatTimeAgo(news.time) : '...'}
            </span>
          </div>
          <h3 style={{
            fontSize: '22px', fontWeight: 700, color: C.textPrimary, lineHeight: '1.6', marginBottom: '10px',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {sanitizeDisplayText(displayTitle)}
          </h3>
          {displaySummary && (
            <p style={{
              fontSize: '14px', color: C.textSecondary, lineHeight: '1.8', marginBottom: '14px',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {sanitizeDisplayText(displaySummary)}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {news.source && <span style={{ fontSize: '10px', color: C.textMuted }}>{news.source}</span>}
            {news.source && <span style={{ fontSize: '8px', color: C.textMuted }}>•</span>}
            {news.impactLevel === 'high' && (
              <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, background: IMPACT_CONFIG.high.bg, color: IMPACT_CONFIG.high.color }}>
                تأثير عالي
              </span>
            )}
            {news.affectedAssets && news.affectedAssets.length > 0 && (
              <>
                <span style={{ fontSize: '8px', color: C.textMuted }}>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {news.affectedAssets.slice(0, 3).map((a, i) => (
                    <span key={i} style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 600, background: a.direction === 'up' ? 'rgba(16,185,129,0.1)' : a.direction === 'down' ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.08)', color: a.direction === 'up' ? C.green : a.direction === 'down' ? C.red : C.textMuted }}>
                      {a.symbol}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Grid Card ──────────────────────────────────────────────────

function GridCard({ news, category, mounted }: { news: NewsItemData; category: typeof NEWS_CATEGORIES[number]; mounted: boolean }) {
  const displayTitle = news.translatedTitle || news.title;
  const displaySummary = news.translatedSummary || news.summary;
  const sentimentCfg = SENTIMENT_CONFIG[news.sentiment] || SENTIMENT_CONFIG.neutral;
  const impactCfg = IMPACT_CONFIG[news.impactLevel] || IMPACT_CONFIG.low;
  const pathSegment = news.slug || news.id;

  return (
    <Link href={pathSegment ? `/news/${pathSegment}` : '#'} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          position: 'relative', borderRadius: '12px', overflow: 'hidden',
          background: C.darkCard, border: `1px solid ${C.border}`,
          transition: 'all 0.3s ease', cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = C.borderHover;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
          <NewsImage
            src={news.imageUrl}
            alt=""
            category={news.category}
            style={{ width: '100%', height: '100%' }}
          />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(15,22,41,0.9), transparent)' }} />
          {news.impactLevel === 'high' && (
            <span style={{ position: 'absolute', top: '8px', insetInlineStart: '8px', background: `${impactCfg.color}cc`, color: '#fff', padding: '2px 8px', borderRadius: '5px', fontSize: '9px', fontWeight: 600 }}>تأثير عالي</span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sentimentCfg.color, flexShrink: 0 }} />
            <span style={{ fontSize: '9px', color: sentimentCfg.color, fontWeight: 600 }}>{sentimentCfg.label}</span>
            {news.aiAnalysis && (
              <span style={{ fontSize: '8px', padding: '0px 5px', borderRadius: '3px', fontWeight: 700, background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>AI</span>
            )}
          </div>
          <h4 style={{
            fontSize: '13px', fontWeight: 600, color: C.textPrimary, lineHeight: '1.6', marginBottom: '6px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {sanitizeDisplayText(displayTitle)}
          </h4>
          {displaySummary && (
            <p style={{
              fontSize: '11px', color: C.textSecondary, lineHeight: '1.7', marginBottom: '8px',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {sanitizeDisplayText(displaySummary)}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {news.source && <span style={{ fontSize: '9px', color: C.textMuted }}>{news.source}</span>}
            {news.source && <span style={{ fontSize: '8px', color: C.textMuted }}>•</span>}
            <span style={{ fontSize: '9px', color: C.textMuted, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
              {mounted ? formatTimeAgo(news.time) : '...'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Category News Page Client ──────────────────────────────────

interface CategoryNewsPageClientProps {
  category: typeof NEWS_CATEGORIES[number];
  initialNews: any[];
}

export default function CategoryNewsPageClient({ category, initialNews }: CategoryNewsPageClientProps) {
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const allNews = useMemo(() => initialNews.map(formatNewsItem), [initialNews]);
  const pagedNews = useMemo(() => allNews.slice(0, page * PER_PAGE), [allNews, page]);
  const hasMore = pagedNews.length < allNews.length;

  const featured = allNews[0];
  const rest = pagedNews.slice(1);

  return (
    <main className="min-h-screen pb-mobile-safe" dir="rtl" style={{ background: C.navy }}>
      {/* ═══ CATEGORY HEADER ═══ */}
      <section style={{
        padding: '28px 0 0',
        background: 'linear-gradient(180deg, rgba(0,229,255,0.03) 0%, transparent 100%)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', paddingInline: 'clamp(16px, 4vw, 48px)' }}>
          <div style={{
            padding: '20px 28px', borderRadius: '12px',
            background: `linear-gradient(135deg, ${category.colorBg}, rgba(0,229,255,.02))`,
            border: `1px solid ${C.border}`, borderInlineStart: `3px solid ${category.color}`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link href="/news" style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                  background: C.darkCard, border: `1px solid ${C.border}`, color: C.textMuted,
                  textDecoration: 'none', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.color = C.cyan; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                  مركز الأخبار
                </Link>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: category.colorBg, border: `1px solid ${category.colorBorder}`, fontSize: '20px' }}>
                  {category.icon}
                </div>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.textPrimary }}>{category.nameAr}</h1>
                  <p style={{ fontSize: '10px', color: C.textMuted }}>{category.nameEn}</p>
                </div>
                <span style={{
                  fontSize: '9px', padding: '2px 8px', borderRadius: '4px', fontWeight: 700,
                  background: category.colorBg, color: category.color, border: `1px solid ${category.colorBorder}`,
                }}>
                  {allNews.length} خبر
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ NEWS CONTENT ═══ */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px clamp(16px, 4vw, 48px) 48px' }}>
        {allNews.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '64px 24px',
            background: C.darkCard, borderRadius: '16px', border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>{category.icon}</div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: C.textSecondary, marginBottom: '6px' }}>لا توجد أخبار في قسم {category.nameAr} حالياً</p>
            <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '12px' }}>يتم تحديث الأخبار تلقائياً كل بضع دقائق</p>
            <Link href="/news" style={{
              display: 'inline-block', padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}`, textDecoration: 'none',
            }}>
              العودة للأخبار
            </Link>
          </div>
        ) : (
          <>
            {/* Featured Article */}
            {featured && (
              <div style={{ marginBottom: '24px' }}>
                <FeaturedCard news={featured} category={category} mounted={mounted} />
              </div>
            )}

            {/* Grid of remaining articles */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px',
            }}>
              {rest.map((news) => (
                <GridCard key={news.id} news={news} category={category} mounted={mounted} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <button
                  onClick={() => setPage(p => p + 1)}
                  style={{
                    padding: '10px 28px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                    background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}`, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.cyanDim; }}
                >
                  عرض المزيد ({allNews.length - pagedNews.length} خبر متبقي)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
