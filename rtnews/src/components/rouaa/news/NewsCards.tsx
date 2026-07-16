// @ts-nocheck
'use client';

import Link from 'next/link';
import { NEWS_CATEGORIES, IMPACT_CONFIG, SENTIMENT_CONFIG, formatTimeAgo, getNewsCategoryId } from '@/lib/news-categories';
import { sanitizeDisplayText } from '@/lib/clean-markdown';
import { TrendingUp, TrendingDown, Minus, Zap, Clock, Share2, Bookmark, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import NewsImage from '@/components/rouaa/NewsImage';

// ─── Types ──────────────────────────────────────────────────────

export interface NewsItemData {
  id: string;
  title: string;
  summary?: string;
  translatedTitle?: string;
  translatedSummary?: string;
  time: string;
  source?: string;
  url?: string;
  category: string;
  categoryId?: string;
  sentiment: string;
  sentimentScore?: number;
  impactLevel: string;
  newsType?: string;
  imageUrl?: string;
  slug?: string;
  affectedAssets?: { symbol: string; direction?: string }[];
  aiAnalysis?: any;
  views?: number;
}

// ─── Direction Icon Helper ──────────────────────────────────────

function getDirectionIcon(direction?: string, size = 10) {
  if (direction === 'up' || direction === 'bullish') return <TrendingUp size={size} />;
  if (direction === 'down' || direction === 'bearish') return <TrendingDown size={size} />;
  return <Minus size={size} />;
}

// ─── Reading Time Estimator ─────────────────────────────────────

function getReadingTime(text?: string): string {
  if (!text) return '';
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200)); // ~200 words/min for Arabic
  return `${minutes} دق`;
}

// ─── Big Featured News Card ─────────────────────────────────────
// Used as the main/first card in each category section.
// Shows: image, title, summary, impact, sentiment, affected assets, time.

export function NewsBigCard({ news, category, mounted }: {
  news: NewsItemData;
  category: typeof NEWS_CATEGORIES[number];
  mounted: boolean;
}) {
  const displayTitle = news.translatedTitle || news.title;
  const displaySummary = news.translatedSummary || news.summary;
  const sanitizedTitle = sanitizeDisplayText(displayTitle);
  const sanitizedSummary = displaySummary ? sanitizeDisplayText(displaySummary) : undefined;
  const impactCfg = IMPACT_CONFIG[news.impactLevel] || IMPACT_CONFIG.low;
  const sentimentCfg = SENTIMENT_CONFIG[news.sentiment] || SENTIMENT_CONFIG.neutral;
  const isBreaking = news.newsType === 'breaking';
  const hasAI = !!news.aiAnalysis;

  const pathSegment = news.slug || news.id;

  return (
    <Link
      href={pathSegment ? `/news/${pathSegment}` : '#'}
      className="glass-card group transition-all duration-300 hover:-translate-y-1 block"
      style={{
        padding: '0',
        borderInlineStart: `3px solid ${category.color}`,
        background: `linear-gradient(135deg, ${category.colorBg}, var(--surface-1, var(--bg3)))`,
        textDecoration: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Image Section with Gradient Overlay — always show */}
      <div className="relative" style={{ height: 'clamp(120px, 20vw, 160px)', overflow: 'hidden' }}>
        <NewsImage
          src={news.imageUrl}
          alt=""
          category={news.category}
          style={{ width: '100%', height: '100%' }}
          className="group-hover:scale-105 transition-transform duration-700"
        />
        {/* Gradient overlay for text readability */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, var(--surface-1, var(--bg3)), transparent)' }} />
          {/* Tags overlay on image */}
          <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {isBreaking && (
              <span className="flash-alert text-[9px] px-2 py-0.5 rounded-full font-bold" style={{
                background: 'rgba(255,77,106,0.85)', color: '#fff',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,77,106,0.5)',
              }}>
                عاجل
              </span>
            )}
            {hasAI && (
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1" style={{
                background: 'rgba(139,92,246,0.75)', color: '#fff',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(139,92,246,0.4)',
              }}>
                <Zap size={8} /> AI
              </span>
            )}
          </div>
          {/* Impact indicator on image */}
          <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
              background: `${impactCfg.color}cc`, color: '#fff',
              backdropFilter: 'blur(8px)',
            }}>
              تأثير {impactCfg.label}
            </span>
          </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Tags Row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
            background: category.colorBg, color: category.color,
            border: `1px solid ${category.colorBorder}`,
          }}>
            {category.nameAr}
          </span>
          {isBreaking && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{
              background: 'rgba(255,77,106,0.15)', color: '#ff4d6a',
              border: '1px solid rgba(255,77,106,0.25)',
            }}>
              عاجل
            </span>
          )}
          <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
            background: impactCfg.bg, color: impactCfg.color,
            border: `1px solid ${impactCfg.color}33`,
          }}>
            تأثير {impactCfg.label}
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
            background: sentimentCfg.bg, color: sentimentCfg.color,
            border: `1px solid ${sentimentCfg.color}33`,
          }}>
            {sentimentCfg.label}
          </span>
          {hasAI && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1" style={{
              background: 'rgba(139,92,246,0.12)', color: '#a78bfa',
              border: '1px solid rgba(139,92,246,0.2)',
            }}>
              <Zap size={8} /> AI
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-[15px] font-bold mb-2 line-clamp-2 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)', lineHeight: '1.8' }}>
          {sanitizedTitle}
        </h4>

        {/* Summary */}
        {sanitizedSummary && (
          <p className="text-[11px] mb-3 line-clamp-2" style={{ color: 'var(--text2)', lineHeight: '1.8' }}>
            {sanitizedSummary}
          </p>
        )}

        {/* Affected Assets */}
        {news.affectedAssets && news.affectedAssets.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {news.affectedAssets.slice(0, 4).map((asset, i) => (
              <span key={i} className="text-[9px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1" style={{
                background: asset.direction === 'up' ? 'rgba(0,200,150,0.1)' : asset.direction === 'down' ? 'rgba(255,77,106,0.1)' : 'rgba(100,116,139,0.1)',
                color: asset.direction === 'up' ? '#00c896' : asset.direction === 'down' ? '#ff4d6a' : '#64748b',
                border: `1px solid ${asset.direction === 'up' ? 'rgba(0,200,150,0.2)' : asset.direction === 'down' ? 'rgba(255,77,106,0.2)' : 'rgba(100,116,139,0.2)'}`,
              }}>
                <span style={{ fontWeight: 700 }}>{asset.symbol}</span>
                {getDirectionIcon(asset.direction, 8)}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--rim, var(--border))' }}>
          <div className="flex items-center gap-2">
            {news.source && <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{news.source}</span>}
            <span style={{ fontSize: '9px', color: 'var(--text4)' }}>•</span>
            <span style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
              {mounted ? formatTimeAgo(news.time) : '...'}
            </span>
            {displaySummary && (
              <>
                <span style={{ fontSize: '9px', color: 'var(--text4)' }}>•</span>
                <span className="flex items-center gap-1" style={{ fontSize: '9px', color: 'var(--text4)' }}>
                  <Clock size={8} />
                  {getReadingTime(displaySummary)}
                </span>
              </>
            )}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text3)' }} className="group-hover:text-[var(--cyan)] transition-colors flex items-center gap-1">
            اقرأ الخبر
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </span>
        </div>
      </div>
    </Link>
  );
}


// ─── Small News Card ────────────────────────────────────────────
// Compact card used for the 5 secondary items in each category section.

export function NewsSmallCard({ news, category, mounted }: {
  news: NewsItemData;
  category: typeof NEWS_CATEGORIES[number];
  mounted: boolean;
}) {
  const displayTitle = news.translatedTitle || news.title;
  const sanitizedTitle = sanitizeDisplayText(displayTitle);
  const sentimentCfg = SENTIMENT_CONFIG[news.sentiment] || SENTIMENT_CONFIG.neutral;
  const impactCfg = IMPACT_CONFIG[news.impactLevel] || IMPACT_CONFIG.low;
  const pathSegment = news.slug || news.id;

  return (
    <Link
      href={pathSegment ? `/news/${pathSegment}` : '#'}
      className="glass-card group transition-all duration-200 hover:-translate-y-0.5 block"
      style={{ padding: '12px 14px', textDecoration: 'none' }}
    >
      <div className="flex items-start gap-2.5">
        {/* Image thumbnail — always show (gradient fallback) */}
        <div className="flex-shrink-0 relative" style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden' }}>
          <NewsImage
            src={news.imageUrl}
            alt=""
            category={news.category?.id || ''}
            style={{ width: '100%', height: '100%' }}
            className="group-hover:scale-105 transition-transform duration-300"
          />
          {/* Impact indicator dot on image */}
          {news.impactLevel === 'high' && (
            <div style={{ position: 'absolute', top: '3px', left: '3px', width: '6px', height: '6px', borderRadius: '50%', background: '#ff4d6a', boxShadow: '0 0 4px rgba(255,77,106,0.5)' }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-[12px] font-semibold line-clamp-2 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)', lineHeight: '1.7' }}>
            {sanitizedTitle}
          </h5>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {/* Impact badge — show for high impact */}
            {news.impactLevel === 'high' && (
              <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{
                background: impactCfg.bg, color: impactCfg.color,
              }}>
                تأثير عالي
              </span>
            )}
            {news.sentiment && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{
                background: sentimentCfg.bg, color: sentimentCfg.color,
              }}>
                {sentimentCfg.label}
              </span>
            )}
            {news.source && (
              <span className="text-[9px]" style={{ color: 'var(--text3)' }}>{news.source}</span>
            )}
            <span className="text-[9px]" style={{ color: 'var(--text4)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
              {mounted ? formatTimeAgo(news.time) : '...'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}


// ─── Category News Section ──────────────────────────────────────
// Contains: 1 Big Card + up to 5 Small Cards + "More" button

export function CategoryNewsSection({ category, newsItems, mounted }: {
  category: typeof NEWS_CATEGORIES[number];
  newsItems: NewsItemData[];
  mounted: boolean;
}) {
  const featured = newsItems[0];
  const smallCards = newsItems.slice(1, 6);

  return (
    <div className="mb-2">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div style={{
            width: '34px', height: '34px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: category.colorBg, border: `1px solid ${category.colorBorder}`,
            fontSize: '17px',
          }}>
            {category.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-head, var(--text))' }}>{category.nameAr}</h3>
            <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{category.nameEn}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{
            background: category.colorBg, color: category.color,
            border: `1px solid ${category.colorBorder}`,
          }}>
            {newsItems.length} خبر
          </span>
        </div>
        <Link
          href={`/news/category/${category.id}`}
          className="text-[11px] px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5"
          style={{ color: 'var(--cyan)', background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.12)' }}
        >
          المزيد
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
      </div>

      {newsItems.length === 0 ? (
        <div className="glass-card flex items-center justify-center" style={{ padding: '32px', minHeight: '120px' }}>
          <div className="text-center">
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{category.icon}</div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text3)' }}>لا توجد أخبار في هذا القسم حالياً</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text4)' }}>يتم تحديث الأخبار تلقائياً كل بضع دقائق</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Big Featured Card */}
          {featured && (
            <NewsBigCard news={featured} category={category} mounted={mounted} />
          )}

          {/* Small Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {smallCards.map((news) => (
              <NewsSmallCard key={news.id} news={news} category={category} mounted={mounted} />
            ))}
            {/* Empty slots to maintain grid */}
            {smallCards.length < 4 && Array.from({ length: 4 - smallCards.length }).map((_, i) => (
              <div key={`empty-${i}`} className="glass-card flex items-center justify-center" style={{ padding: '16px', minHeight: '80px', opacity: 0.4 }}>
                <span className="text-[10px]" style={{ color: 'var(--text4)' }}>قريباً</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
