'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useMarketStore, useShallow } from '@/stores/market-store';
import type { PriceItem } from '@/stores/market-store';
import NewsImage, { preloadImage } from '@/components/rouaa/NewsImage';

/* ═══════════════════════════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════════════════════════ */
interface NewsArticle {
  id: string;
  slug?: string;
  titleAr?: string;
  title: string;
  summaryAr?: string;
  summary?: string;
  category?: string;
  sentiment?: string;
  source?: string;
  sourceName?: string;
  imageUrl?: string;
  time?: string;
  kind?: string;        // V1219: 'news' | 'strategic_report' | 'market_analysis' | 'stock_analysis'
  badge?: string;       // V1219: display label (خبر، تقرير استراتيجي، تحليل فني، تحليل سهم)
  href?: string;        // V1219: link to detail page
  isOfficialSource?: boolean;  // V1219: show "محرر رؤى الذكي" badge
}

interface HeroSectionProps {
  articles?: NewsArticle[];
}

/* ═══════════════════════════════════════════════════════════════════
   COUNCIL BRIEF (fetched from trading platform)
   ═══════════════════════════════════════════════════════════════════ */
interface CouncilBrief {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  timeframe: string;
  analysisSummary?: string;
  issuedAt: string;
}

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */
function timeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `${diffMin} دقيقة`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ساعة`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} يوم`;
  } catch {
    return '';
  }
}

function sentimentLabel(s?: string): { text: string; color: string; bg: string } {
  if (s === 'positive') return { text: 'إيجابي', color: 'var(--bull)', bg: 'var(--bull2)' };
  if (s === 'negative') return { text: 'سلبي', color: 'var(--bear)', bg: 'var(--bear2)' };
  return { text: 'محايد', color: 'var(--text3)', bg: 'rgba(100,116,139,.1)' };
}

function categoryClass(cat?: string): string {
  if (!cat) return 'cat-macro';
  const lower = cat.toLowerCase();
  if (lower.includes('عمل') || lower.includes(' forex') || lower.includes('فوركس')) return 'cat-forex';
  if (lower.includes('معادن') || lower.includes('ذهب') || lower.includes('معدن')) return 'cat-metals';
  if (lower.includes('كريبت') || lower.includes('عملات رقمية') || lower.includes('crypto')) return 'cat-crypto';
  if (lower.includes('نفط') || lower.includes('طاقة') || lower.includes('oil')) return 'cat-oil';
  if (lower.includes('أسهم') || lower.includes('stocks')) return 'cat-stocks';
  if (lower.includes('عرب') || lower.includes('arab')) return 'cat-arab-markets';
  if (lower.includes('بنك') || lower.includes('central')) return 'cat-central-banks';
  if (lower.includes('أرباح') || lower.includes('earnings')) return 'cat-earnings';
  if (lower.includes('احتياطي') || lower.includes('fed')) return 'cat-fed';
  return 'cat-macro';
}

/* ═══════════════════════════════════════════════════════════════════
   NEWS SLIDER — Auto-advancing carousel for 10 articles
   ═══════════════════════════════════════════════════════════════════ */
function NewsSlider({ articles }: { articles: NewsArticle[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = articles.length;
  const current = articles[currentIndex];

  // V120: Preload adjacent slide images so they appear instantly when advancing.
  // Preloads: next 2 slides + previous 1 slide. Fire-and-forget (no await).
  useEffect(() => {
    if (total === 0) return;
    const indices = [
      (currentIndex + 1) % total,
      (currentIndex + 2) % total,
      (currentIndex - 1 + total) % total,
    ];
    for (const idx of indices) {
      const article = articles[idx];
      if (article) {
        const imgUrl = article.imageUrl || `/api/article-image/${article.id}`;
        preloadImage(imgUrl).catch(() => {/* silent — gradient fallback handles it */});
      }
    }
  }, [currentIndex, total, articles]);

  // Auto-advance with progress bar
  useEffect(() => {
    if (isPaused || total === 0) return;

    const SLIDE_DURATION = 5000; // 5 seconds per slide
    // V1024: Removed the 50ms setInterval that caused 20 re-renders/second.
    // This was the #1 cause of fan spinning. Now we use a single setTimeout
    // to advance slides — progress bar is CSS-driven (no re-renders).
    let slideTimeout: ReturnType<typeof setTimeout> | null = null;

    const advanceSlide = () => {
      setCurrentIndex((prev) => (prev + 1) % total);
      setProgress(0);
    };

    // Schedule the next slide advance
    slideTimeout = setTimeout(advanceSlide, SLIDE_DURATION);

    return () => {
      if (slideTimeout) clearTimeout(slideTimeout);
    };
  }, [isPaused, total, currentIndex]);

  if (total === 0) {
    // Placeholder — Financial chart aesthetic
    return (
      <div
        className="glass-card relative overflow-hidden flex flex-col justify-end"
        style={{
          borderRadius: 'var(--r2)',
          minHeight: 300,
          height: '100%',
          background: 'linear-gradient(160deg, #070b14 0%, #0c1220 30%, #0e1628 50%, #0b1018 70%, #080c16 100%)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Financial grid lines background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.12,
            backgroundImage:
              'linear-gradient(rgba(0,229,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />
        {/* Subtle horizontal price-line accents */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.06,
            backgroundImage:
              'linear-gradient(rgba(0,229,255,0.6) 1px, transparent 1px)',
            backgroundSize: '100% 80px',
            backgroundPosition: '0 20px',
            pointerEvents: 'none',
          }}
        />
        {/* Candlestick-inspired vertical bars */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {/* Bar 1 — bullish */}
          <div style={{ position: 'absolute', left: '18%', top: '15%', width: 3, height: '55%', borderRadius: 1.5, background: 'linear-gradient(to top, transparent, rgba(16,185,129,0.18), transparent)' }} />
          <div style={{ position: 'absolute', left: 'calc(18% - 1px)', top: '30%', width: 5, height: '25%', borderRadius: 2, background: 'rgba(16,185,129,0.12)' }} />
          {/* Bar 2 — bearish */}
          <div style={{ position: 'absolute', left: '35%', top: '10%', width: 3, height: '60%', borderRadius: 1.5, background: 'linear-gradient(to top, transparent, rgba(239,68,68,0.15), transparent)' }} />
          <div style={{ position: 'absolute', left: 'calc(35% - 1px)', top: '20%', width: 5, height: '20%', borderRadius: 2, background: 'rgba(239,68,68,0.1)' }} />
          {/* Bar 3 — bullish */}
          <div style={{ position: 'absolute', left: '55%', top: '20%', width: 3, height: '50%', borderRadius: 1.5, background: 'linear-gradient(to top, transparent, rgba(16,185,129,0.15), transparent)' }} />
          <div style={{ position: 'absolute', left: 'calc(55% - 1px)', top: '35%', width: 5, height: '20%', borderRadius: 2, background: 'rgba(16,185,129,0.1)' }} />
          {/* Bar 4 — bearish */}
          <div style={{ position: 'absolute', left: '72%', top: '12%', width: 3, height: '45%', borderRadius: 1.5, background: 'linear-gradient(to top, transparent, rgba(239,68,68,0.12), transparent)' }} />
          <div style={{ position: 'absolute', left: 'calc(72% - 1px)', top: '22%', width: 5, height: '18%', borderRadius: 2, background: 'rgba(239,68,68,0.08)' }} />
          {/* Bar 5 — bullish */}
          <div style={{ position: 'absolute', left: '88%', top: '18%', width: 3, height: '52%', borderRadius: 1.5, background: 'linear-gradient(to top, transparent, rgba(16,185,129,0.14), transparent)' }} />
          <div style={{ position: 'absolute', left: 'calc(88% - 1px)', top: '32%', width: 5, height: '22%', borderRadius: 2, background: 'rgba(16,185,129,0.09)' }} />
        </div>
        {/* Subtle glow accents */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '50%', background: 'radial-gradient(ellipse at 20% 30%, rgba(0,229,255,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', background: 'radial-gradient(ellipse at 80% 70%, rgba(168,85,247,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(48px, 8vw, 96px)',
            fontWeight: 700,
            color: 'var(--text4)',
            opacity: 0.35,
            fontFamily: 'var(--font-cairo)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          رؤى
        </div>
        <div style={{ padding: 'var(--space-md)', position: 'relative', zIndex: 1 }}>
          <div className="badge-ai" style={{ marginBottom: 8 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
              <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z" />
            </svg>
            <span>مدعوم بالذكاء الاصطناعي</span>
          </div>
          <h2 className="font-heading" style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 700, color: 'var(--text-head)', lineHeight: 1.4, marginBottom: 8 }}>
            الذكاء يقرأ السوق.{' '}
            <span className="gradient-text">أنت تتخذ القرار.</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 480 }}>
            تحليل AI لحظي لكل خبر مالي — باللغة العربية — بيانات حية، إشارات ذكية، وتغطية 24/7
          </p>
        </div>
      </div>
    );
  }

  const displayTitle = current.titleAr || current.title;
  const displaySummary = current.summaryAr || current.summary;
  // V1219: Use href from unified feed (news, strategic_report, market_analysis, stock_analysis have different URLs)
  const articleHref = current.href || (current.slug ? `/news/${current.slug}` : current.id ? `/news/${current.id}` : '#');
  const sent = sentimentLabel(current.sentiment);

  return (
    <div
      className="relative overflow-hidden"
      style={{ borderRadius: 'var(--r2)', display: 'flex', flexDirection: 'column', height: '100%' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <Link
        href={articleHref}
        className="glass-card group relative overflow-hidden flex flex-col justify-end block"
        style={{
          borderRadius: 'var(--r2)',
          minHeight: 300,
          flex: 1,
          border: '1px solid var(--border)',
          textDecoration: 'none',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Background — Trading-style aesthetic with optional image overlay */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {/* Base: trading grid pattern (always visible as fallback) */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, #070b14 0%, #0c1220 30%, #0e1628 50%, #0b1018 70%, #080c16 100%)',
          }} />
          {/* Grid lines */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.1,
            backgroundImage: 'linear-gradient(rgba(0,229,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.25) 1px, transparent 1px)',
            backgroundSize: '40px 40px', pointerEvents: 'none',
          }} />
          {/* Image layer — AI-generated image visible as prominent background */}
          <NewsImage
            src={current.imageUrl || `/api/article-image/${current.id}`}
            alt={displayTitle}
            fill
            overlayOpacity={0.75}
            category={current.category}
            loading="eager"
          />
          {/* Gradient overlay — balanced: image visible + text readable */}
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 2,
              background: 'linear-gradient(to top, rgba(7,11,20,.92) 0%, rgba(7,11,20,.72) 30%, rgba(7,11,20,.35) 60%, rgba(7,11,20,.18) 100%)',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: 'var(--space-md)', position: 'relative', zIndex: 1 }}>
          {/* Category badge */}
          <span
            className={categoryClass(current.category)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 10px',
              borderRadius: 'var(--r)',
              fontSize: 10,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            {current.category || 'اقتصاد كلي'}
          </span>

          {/* Title */}
          <h2
            className="font-heading"
            style={{
              fontSize: 'clamp(18px, 2.5vw, 28px)',
              fontWeight: 700,
              color: 'var(--text-head)',
              lineHeight: 1.45,
              marginBottom: 8,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {displayTitle}
          </h2>

          {/* Summary */}
          {displaySummary && (
            <p
              style={{
                fontSize: 13,
                color: 'var(--text2)',
                lineHeight: 1.7,
                marginBottom: 12,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {displaySummary}
            </p>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {current.badge && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r)',
                color: 'var(--bg)', background: 'var(--cyan)',
                letterSpacing: '0.3px',
              }}>
                {current.badge}
              </span>
            )}
            {current.isOfficialSource && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 'var(--r)',
                color: 'var(--cyan)', background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.25)',
                display: 'inline-flex', alignItems: 'center', gap: 3,
              }}>
                <span style={{ fontSize: 9 }}>✦</span> محرر رؤى الذكي
              </span>
            )}
            {current.source && !current.isOfficialSource && (
              <span style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 600 }}>
                {current.source}
              </span>
            )}
            {current.time && (
              <>
                <span style={{ fontSize: 11, color: 'var(--text4)' }}>•</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{timeAgo(current.time)}</span>
              </>
            )}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 'var(--r)',
                fontSize: 10,
                fontWeight: 700,
                color: sent.color,
                background: sent.bg,
              }}
            >
              {current.sentiment === 'positive' ? '▲' : current.sentiment === 'negative' ? '▼' : '◆'}
              {sent.text}
            </span>
          </div>
        </div>

        {/* Hover glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--r2)',
            boxShadow: 'inset 0 0 0 1px rgba(0,229,255,0)',
            transition: 'box-shadow 0.3s ease',
            pointerEvents: 'none',
            zIndex: 2,
          }}
          className="group-hover:shadow-[inset_0_0_0_1px_rgba(0,229,255,0.2)]"
        />
      </Link>

      {/* Progress bar + dots */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 2, background: 'rgba(0,229,255,0.1)' }}>
          <div
            style={{
              height: '100%',
              background: 'var(--cyan)',
              width: `${progress}%`,
              transition: 'width 50ms linear',
            }}
          />
        </div>
        {/* Dot navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '6px 0',
            background: 'rgba(5,8,16,0.6)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {articles.slice(0, 10).map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setProgress(0); }}
              style={{
                width: i === currentIndex ? 24 : 12,
                height: 12,
                borderRadius: 6,
                background: i === currentIndex ? 'var(--cyan)' : 'rgba(255,255,255,0.2)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              aria-label={`الخبر ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => { setCurrentIndex((currentIndex - 1 + total) % total); setProgress(0); }}
        className="absolute top-1/2 right-2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(5,8,16,0.6)', color: 'var(--text2)', border: '1px solid var(--border)', backdropFilter: 'blur(4px)' }}
        aria-label="الخبر السابق"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        onClick={() => { setCurrentIndex((currentIndex + 1) % total); setProgress(0); }}
        className="absolute top-1/2 left-2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(5,8,16,0.6)', color: 'var(--text2)', border: '1px solid var(--border)', backdropFilter: 'blur(4px)' }}
        aria-label="الخبر التالي"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COUNCIL SIGNALS CARD — Clean Executive Design
   Professional, minimal, consistent with site design language
   ═══════════════════════════════════════════════════════════════════ */
function CouncilSignalsCard({ briefs, loading }: { briefs: CouncilBrief[]; loading: boolean }) {
  const formatPrice = (price: number) => price?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '—';

  return (
    <div
      className="glass-card"
      style={{
        borderRadius: 'var(--r2)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '8px 10px 7px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: 'var(--purple2)',
            border: '1px solid color-mix(in srgb, var(--purple) 15%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--purple)',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-head)' }}>إجماع المجلس الذكي</div>
            <div style={{ fontSize: 8, color: 'var(--text3)' }}>8 نماذج AI</div>
          </div>
        </div>
        <div className="badge-live" style={{ fontSize: 7 }}>
          <span className="live-dot" />
          مباشر
        </div>
      </div>

      {/* Brief Cards */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, padding: '7px 8px' }}>
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 60, borderRadius: 'var(--r)' }} />
            ))}
          </>
        ) : briefs.length > 0 ? (
          briefs.slice(0, 3).map((brief) => {
            const isBuy = brief.direction === 'BUY';
            const rrRatio = brief.entryPrice && brief.stopLoss && brief.takeProfit
              ? (Math.abs(brief.takeProfit - brief.entryPrice) / Math.abs(brief.entryPrice - brief.stopLoss)).toFixed(1)
              : null;
            const agreeCount = Math.round((brief.confidence / 100) * 8);
            const dirColor = isBuy ? 'var(--bull)' : 'var(--bear)';
            const dirBg = isBuy ? 'var(--bull2)' : 'var(--bear2)';
            const dirLabel = isBuy ? 'شراء' : 'بيع';
            const dirArrow = isBuy ? '▲' : '▼';

            return (
              <div
                key={brief.id}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderInlineStart: `3px solid ${dirColor}`,
                  borderRadius: 'var(--r)',
                  padding: '6px 8px',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Row 1: Pair + Direction + Confidence */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-mono)' }}>{brief.pair}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                      background: dirBg, color: dirColor,
                      border: `1px solid color-mix(in srgb, ${dirColor} 20%, transparent)`,
                      display: 'inline-flex', alignItems: 'center', gap: 2,
                    }}>
                      {dirArrow} {dirLabel}
                    </span>
                    <span style={{ fontSize: 8, color: 'var(--text4)' }}>{brief.timeframe}</span>
                  </div>
                  <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {/* Mini confidence bar */}
                    <div style={{ width: 40, height: 3, borderRadius: 2, background: 'var(--bg4)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${brief.confidence}%`, background: dirColor, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: dirColor, fontFamily: 'var(--font-mono)' }}>{brief.confidence}%</span>
                  </div>
                </div>

                {/* Price levels: SL → Entry → TP visual */}
                <div style={{ position: 'relative', padding: '0 2px' }}>
                  <div style={{
                    height: 2, borderRadius: 1,
                    background: 'var(--bg4)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: `linear-gradient(90deg, var(--bear) 0%, var(--cyan) 50%, var(--bull) 100%)`,
                      borderRadius: 2,
                      opacity: 0.5,
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ fontSize: 8, color: 'var(--bear)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>${formatPrice(brief.stopLoss)}</span>
                    <span style={{ fontSize: 8, color: 'var(--cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${formatPrice(brief.entryPrice)}</span>
                    <span style={{ fontSize: 8, color: 'var(--bull)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>${formatPrice(brief.takeProfit)}</span>
                  </div>
                </div>

                {/* Footer row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                  <span style={{ fontSize: 8, color: 'var(--text3)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                    </svg>
                    {agreeCount}/8
                  </span>
                  {rrRatio && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                      background: 'var(--cyan2)', color: 'var(--cyan)',
                      border: '1px solid var(--border2)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      R:R {rrRatio}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, padding: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--purple2)',
              border: '1px solid color-mix(in srgb, var(--purple) 10%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--purple)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>
              لا توجد إحاطات نشطة
              <br />
              <span style={{ fontSize: 8, color: 'var(--text4)' }}>يعقد المجلس جلسة كل ساعة</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '5px 8px 7px' }}>
        <Link
          href="/ar/signals"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 'var(--r)',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            color: 'var(--text2)', fontSize: 9, fontWeight: 700, textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
        >
          عرض الإشارات
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MARKET SCANNER CARD — Top gainers, losers, most active
   ═══════════════════════════════════════════════════════════════════ */
interface ScannerAsset {
  symbol: string;
  displaySymbol: string;
  price: number;
  changePercent: number;
  category: string;
}

function MarketScannerCard({ prices, loading }: { prices: ScannerAsset[]; loading: boolean }) {
  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  // Sort into gainers, losers, most active
  const { gainers, losers, mostActive } = useMemo(() => {
    if (!prices.length) return { gainers: [], losers: [], mostActive: [] };
    const sorted = [...prices].sort((a, b) => b.changePercent - a.changePercent);
    const byAbs = [...prices].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
    return {
      gainers: sorted.filter(p => p.changePercent > 0).slice(0, 7),
      losers: sorted.filter(p => p.changePercent < 0).slice(0, 7),
      mostActive: byAbs.slice(0, 7),
    };
  }, [prices]);

  const [scannerTab, setScannerTab] = useState<'gainers' | 'losers' | 'active'>('gainers');
  const displayList = scannerTab === 'gainers' ? gainers : scannerTab === 'losers' ? losers : mostActive;

  const TAB_CONFIG = [
    { id: 'gainers' as const, label: 'الأكثر ارتفاعاً', color: 'var(--bull)', icon: '▲' },
    { id: 'losers' as const, label: 'الأكثر انخفاضاً', color: 'var(--bear)', icon: '▼' },
    { id: 'active' as const, label: 'الأكثر نشاطاً', color: '#D4AF37', icon: '⚡' },
  ];

  const categoryEmoji: Record<string, string> = {
    'عملات': '💱', 'كريبتو': '🪙', 'سلع': '🥇', 'طاقة': '🛢️', 'أسهم': '📈',
  };

  return (
    <div
      className="glass-card"
      style={{
        borderRadius: 'var(--r2)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '8px 10px 7px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#D4AF37',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-head)' }}>سكانر الأسواق</div>
            <div style={{ fontSize: 8, color: 'var(--text3)' }}>مسح شامل</div>
          </div>
        </div>
        <div className="badge-live" style={{ fontSize: 7 }}>
          <span className="live-dot" />
          مباشر
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 2, padding: '5px 8px 0',
      }}>
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            onClick={() => setScannerTab(tab.id)}
            style={{
              flex: 1, padding: '4px 4px', borderRadius: 5,
              background: scannerTab === tab.id ? `${tab.color === 'var(--bull)' ? 'rgba(34,197,94,0.1)' : tab.color === 'var(--bear)' ? 'rgba(239,83,80,0.1)' : 'rgba(212,175,55,0.1)'}` : 'transparent',
              border: `1px solid ${scannerTab === tab.id ? `${tab.color === 'var(--bull)' ? 'rgba(34,197,94,0.3)' : tab.color === 'var(--bear)' ? 'rgba(239,83,80,0.3)' : 'rgba(212,175,55,0.3)'}` : 'transparent'}`,
              color: scannerTab === tab.id ? tab.color : 'var(--text4)',
              fontSize: 7, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 8 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Asset Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '6px 8px 4px', flex: 1 }}>
        {loading ? (
          <>
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="skeleton" style={{ height: 30, borderRadius: 'var(--r)' }} />
            ))}
          </>
        ) : displayList.length > 0 ? (
          displayList.map((asset, idx) => {
            const isUp = asset.changePercent >= 0;
            const dirColor = isUp ? 'var(--bull)' : 'var(--bear)';
            const dirBg = isUp ? 'var(--bull2)' : 'var(--bear2)';
            const isMostActive = scannerTab === 'active';
            const barColor = isMostActive ? '#D4AF37' : dirColor;

            return (
              <div
                key={asset.symbol}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderInlineStart: `3px solid ${barColor}`,
                  borderRadius: 'var(--r)',
                  padding: '5px 7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    fontSize: 8, fontWeight: 700, color: 'var(--text4)',
                    width: 12, textAlign: 'center',
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: 10 }}>{categoryEmoji[asset.category] || '📊'}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: 'var(--text-head)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {asset.displaySymbol}
                      </span>
                      <span style={{
                        fontSize: 7, fontWeight: 700, padding: '1px 3px', borderRadius: 2,
                        background: 'var(--bg4)', color: 'var(--text4)',
                      }}>
                        {asset.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: 'var(--text-head)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    ${formatPrice(asset.price)}
                  </span>
                  <span style={{
                    fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                    background: isMostActive ? 'rgba(212,175,55,0.1)' : dirBg,
                    color: isMostActive ? '#D4AF37' : dirColor,
                    display: 'inline-flex', alignItems: 'center', gap: 2,
                    border: `1px solid ${isMostActive ? 'rgba(212,175,55,0.25)' : 'transparent'}`,
                  }}>
                    {isMostActive ? (isUp ? '▲' : '▼') : (isUp ? '▲' : '▼')} {Math.abs(asset.changePercent).toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, padding: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center' }}>
              {scannerTab === 'gainers' ? 'لا توجد ارتفاعات' : scannerTab === 'losers' ? 'لا توجد انخفاضات' : 'لا توجد بيانات'}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '4px 8px 6px', marginTop: 'auto' }}>
        <Link
          href="/ar/market-pulse"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 'var(--r)',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            color: 'var(--text2)', fontSize: 9, fontWeight: 700, textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
        >
          نبض السوق
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN HERO SECTION
   ═══════════════════════════════════════════════════════════════════ */
export default function HeroSection({ articles = [] }: HeroSectionProps = {}) {
  const [councilBriefs, setCouncilBriefs] = useState<CouncilBrief[]>([]);
  const [councilLoading, setCouncilLoading] = useState(true);
  const [scannerPrices, setScannerPrices] = useState<ScannerAsset[]>([]);
  const [scannerLoading, setScannerLoading] = useState(true);


  // Fetch council briefs — PERF: 10s timeout, 2-min refresh, abort on unmount
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    async function fetchCouncil() {
        if (document.hidden) return; // V1020: skip polling when tab is hidden
      try {
        const res = await fetch('/api/integration/council?mode=briefs', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (res.ok) {
          const data = await res.json();
          const briefList = data?.data?.active || data?.active || data?.data || [];
          if (Array.isArray(briefList)) {
            setCouncilBriefs(briefList);
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.warn('[HeroSection] Council fetch error:', err?.message?.slice(0, 80));
        }
      } finally {
        if (!controller.signal.aborted) setCouncilLoading(false);
      }
    }

    fetchCouncil();

    // Refresh every 2 minutes
    const interval = setInterval(fetchCouncil, 2 * 60 * 1000);
    return () => {
      clearTimeout(timeout);
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  // Fetch market prices for scanner — PERF: 10s timeout, 2-min refresh, abort on unmount
  useEffect(() => {
    const controller = new AbortController();

    async function fetchPrices() {
        if (document.hidden) return; // V1020: skip polling when tab is hidden
      const perRequestController = new AbortController();
      const timeout = setTimeout(() => perRequestController.abort(), 10_000);

      try {
        const res = await fetch('/api/markets/prices', {
          cache: 'no-store',
          signal: perRequestController.signal,
        });
        if (controller.signal.aborted) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.prices && Array.isArray(data.prices)) {
            setScannerPrices(data.prices);
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.warn('[HeroSection] Scanner prices fetch error:', err?.message?.slice(0, 80));
        }
      } finally {
        clearTimeout(timeout);
        if (!controller.signal.aborted) setScannerLoading(false);
      }
    }

    fetchPrices();

    const interval = setInterval(fetchPrices, 2 * 60 * 1000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  return (
    <section
      className="relative overflow-hidden"
      style={{ paddingTop: 'clamp(12px, 2vw, 24px)', paddingBottom: 0 }}
      aria-label="رؤى - أحدث الأخبار والإشارات"
      role="banner"
    >
      <div className="relative z-10 max-w-[1400px] mx-auto" style={{ paddingInline: 'var(--space-md)' }}>
        {/* ═══════════════════════════════════════════════════════════
            HERO GRID: News Slider (left ~60%) + Council Signals (right ~40%)
            ═══════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: 'grid',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-md)',
            alignItems: 'stretch',
          }}
          className="hero-main-grid"
        >
          {/* Left: News Slider */}
          <div className="hero-article-col" style={{ display: 'flex', minHeight: 0 }}>
            <NewsSlider articles={articles} />
          </div>

          {/* Middle: Council Signals */}
          <div className="hero-side-col" style={{ display: 'flex', minHeight: 0 }}>
            <CouncilSignalsCard briefs={councilBriefs} loading={councilLoading} />
          </div>

          {/* Right: Market Scanner */}
          <div className="hero-market-col" style={{ display: 'flex', minHeight: 0 }}>
            <MarketScannerCard prices={scannerPrices} loading={scannerLoading} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CTA BAR — Compact professional call-to-action
            ═══════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderRadius: 'var(--r2)',
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--bg3) 90%, var(--cyan2)) 0%, color-mix(in srgb, var(--bg3) 90%, var(--purple2)) 100%)',
            border: '1px solid var(--border)',
            marginBottom: 'var(--space-sm)',
            flexWrap: 'wrap',
            gap: 10,
          }}
          className="cta-bar"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="badge-ai" style={{ fontSize: 9 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z" />
              </svg>
              <span>مدعوم بالذكاء الاصطناعي</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
              تحليل لحظي لكل خبر مالي — بالعربية
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a
              href="/ar/pricing"
              className="font-heading"
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 16px',
                borderRadius: 'var(--r2)',
                background: 'linear-gradient(135deg, rgba(0,60,80,.9), var(--cyan))',
                color: '#050810',
                boxShadow: '0 0 16px rgba(0,229,255,.15)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ابدأ مجاناً
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          RESPONSIVE STYLES
          ═══════════════════════════════════════════════════════════ */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .hero-main-grid {
              grid-template-columns: 1.8fr 1fr 1fr;
              align-items: stretch;
            }
            .hero-article-col,
            .hero-side-col,
            .hero-market-col {
              display: flex;
              min-height: 0;
            }
            .hero-article-col > *,
            .hero-side-col > *,
            .hero-market-col > * {
              flex: 1;
              width: 100%;
            }
            @media (max-width: 1100px) {
              .hero-main-grid {
                grid-template-columns: 1fr 1fr;
              }
              .hero-article-col {
                grid-column: 1 / -1;
              }
            }
            @media (max-width: 700px) {
              .hero-main-grid {
                grid-template-columns: 1fr;
              }
            }
          `,
        }}
      />
    </section>
  );
}
