'use client';

// ═══════════════════════════════════════════════════════════════════
// SmartNewsCenter — Unified News Hub for all 5 locales (V3)
// ═══════════════════════════════════════════════════════════════════
// Replaces NewsPageClient (ar), EnNewsPageClient (en/es), FrNewsPageClient,
// TrNewsPageClient — one component, one codebase, locale-driven.
//
// Revolutionary features:
//   🎧 Audio Digest — TTS for top 5 headlines (button in header)
//   📊 Live Market Ticker Sidebar — Gold, BTC, Oil, S&P, DXY, EURUSD
//   🛡️ Trust Index — source reliability badge on every card
//   🧠 Market Impact Hint — one-line prediction per card
//   ⚡ Sentiment + Impact visualization with color-coded bars
//
// Architecture:
//   - Server passes initialLiveNews (per-locale filtered)
//   - Client polls /api/news/live every 5 min for fresh data
//   - Filter (blocklist + dedupe) applied server-side in page.tsx
//   - Trust + impact hint derived client-side from item fields (no API calls)
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useNewsStore, useShallow } from '@/stores/news-store';
import {
  NEWS_CATEGORIES,
  IMPACT_CONFIG,
  SENTIMENT_CONFIG,
  getNewsCategoryId,
  getCategoryNameByLocale,
} from '@/lib/news-categories';
import { sanitizeDisplayText } from '@/lib/clean-markdown';
import { NewsItemData } from '@/components/rouaa/news/NewsCards';
import NewsImage from '@/components/rouaa/NewsImage';
import { SmartCouncilWidget, EconomicCalendarWidget, MostReadWidget } from '@/components/shared/SidebarWidgets';
import { getNewsStrings, formatTimeAgoLocale, NewsLocale } from '@/lib/news-i18n';
import MarketTickerSidebar from './MarketTickerSidebar';
import AudioDigestButton from './AudioDigestButton';
import NewsTrustBadge from './NewsTrustBadge';
import MarketImpactHint from './MarketImpactHint';
import BreakingFlash from '@/components/rouaa/BreakingFlash';
import EnBreakingFlash from '@/components/rouaa/EnBreakingFlash';

// ─── Theme-Aware Color Palette ─────────────────────────────────
interface ColorPalette {
  bg: string;
  cardBg: string;
  cardBgHover: string;
  sidebarBg: string;
  headerBg: string;
  inputBg: string;
  inputBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderHover: string;
  cyan: string;
  cyanDim: string;
  cyanBorder: string;
  purple: string;
  purpleDim: string;
  gold: string;
  goldDim: string;
  green: string;
  red: string;
  gradientOverlay: string;
  heroGradient: string;
  dividerGradient: string;
  isDark: boolean;
}

function useColors(): ColorPalette {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light'; // default dark

  return useMemo<ColorPalette>(() => ({
    bg: isDark ? '#0A0E27' : '#F0F2F7',
    cardBg: isDark ? '#0F1629' : '#FFFFFF',
    cardBgHover: isDark ? '#141B33' : '#F8F9FC',
    sidebarBg: isDark ? '#0C1024' : '#E8EBF2',
    headerBg: isDark ? 'rgba(10,14,39,0.93)' : 'rgba(240,242,247,0.93)',
    inputBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    inputBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)',
    textPrimary: isDark ? '#E2E8F0' : '#1A1A2E',
    textSecondary: isDark ? '#94A3B8' : '#4A5568',
    textMuted: isDark ? '#64748B' : '#718096',
    border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    borderHover: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.14)',
    cyan: isDark ? '#00E5FF' : '#0891B2',
    cyanDim: isDark ? 'rgba(0,229,255,0.06)' : 'rgba(8,145,178,0.08)',
    cyanBorder: isDark ? 'rgba(0,229,255,0.15)' : 'rgba(8,145,178,0.2)',
    purple: isDark ? '#8B5CF6' : '#7C3AED',
    purpleDim: isDark ? 'rgba(139,92,246,0.06)' : 'rgba(124,58,237,0.06)',
    gold: isDark ? '#d4af37' : '#B8860B',
    goldDim: isDark ? 'rgba(212,175,55,0.06)' : 'rgba(184,134,11,0.06)',
    green: isDark ? '#10B981' : '#059669',
    red: isDark ? '#EF4444' : '#DC2626',
    gradientOverlay: isDark
      ? 'linear-gradient(to top, #0F1629 0%, rgba(15,22,41,0.85) 50%, transparent 100%)'
      : 'linear-gradient(to top, #FFFFFF 0%, rgba(255,255,255,0.85) 50%, transparent 100%)',
    heroGradient: isDark
      ? 'linear-gradient(180deg, rgba(0,229,255,0.04) 0%, transparent 100%)'
      : 'linear-gradient(180deg, rgba(8,145,178,0.04) 0%, transparent 100%)',
    dividerGradient: isDark
      ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), rgba(0,229,255,0.2), rgba(255,255,255,0.08), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.06), rgba(8,145,178,0.15), rgba(0,0,0,0.06), transparent)',
    isDark,
  }), [isDark]);
}

// ─── Helpers ────────────────────────────────────────────────────

interface NewsItemProcessed extends NewsItemData {
  sourceTrust?: 'high' | 'medium' | 'low' | 'unknown';
}

function formatNewsItem(item: any): NewsItemData {
  let affectedAssets: { symbol: string; direction?: string }[] = [];
  if (item.cachedAffectedAssets) {
    try {
      const parsed = typeof item.cachedAffectedAssets === 'string' ? JSON.parse(item.cachedAffectedAssets) : item.cachedAffectedAssets;
      if (Array.isArray(parsed)) affectedAssets = parsed.map((a: any) => ({
        symbol: typeof a.symbol === 'string' ? a.symbol : String(a),
        direction: typeof a.direction === 'string' ? a.direction : undefined,
      }));
    } catch {}
  } else if (item.affectedAssets) {
    try {
      const parsed = typeof item.affectedAssets === 'string' ? JSON.parse(item.affectedAssets) : item.affectedAssets;
      if (Array.isArray(parsed)) affectedAssets = parsed.map((a: any) => ({
        symbol: typeof a.symbol === 'string' ? a.symbol : String(a),
        direction: typeof a.direction === 'string' ? a.direction : undefined,
      }));
    } catch {}
  }
  return {
    id: item.id,
    title: sanitizeDisplayText(item.title || ''),
    summary: sanitizeDisplayText(item.summary || ''),
    translatedTitle: item.translatedTitle || item.titleAr ? sanitizeDisplayText(item.translatedTitle || item.titleAr || '') : undefined,
    translatedSummary: item.translatedSummary || item.summaryAr ? sanitizeDisplayText(item.translatedSummary || item.summaryAr || '') : undefined,
    time: item.time || item.date || item.fetchedAt || new Date().toISOString(),
    source: item.source || '',
    url: item.url || '',
    category: item.category || 'Macro Economy',
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

// ─── Inline SVG Icons ───────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813L20 10l-6.088 1.187L12 17l-1.912-5.813L4 10l6.088-1.187L12 3z" />
      <path d="M18 14l.944 2.878L22 18l-3.056.122L18 21l-.944-2.878L14 18l3.056-.122L18 14z" />
    </svg>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────

function LivePulse({ C }: { C: ColorPalette }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
      background: 'rgba(16,185,129,0.1)', color: C.green,
      border: '1px solid rgba(16,185,129,0.2)',
      fontFamily: 'var(--font-jetbrains-mono, monospace)',
      letterSpacing: '0.5px',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.green, animation: 'pulse 2s infinite' }} />
      LIVE
    </span>
  );
}

function SentimentBar({ sentiment, score, C, locale }: { sentiment: string; score: number; C: ColorPalette; locale: NewsLocale }) {
  const s = getNewsStrings(locale);
  const cfg = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.neutral;
  const label = sentiment === 'positive' ? s.sentimentPositive : sentiment === 'negative' ? s.sentimentNegative : s.sentimentNeutral;
  const pct = Math.max(0, Math.min(100, score || 55));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
      <div style={{
        flex: 1, height: '4px', borderRadius: '2px',
        background: C.inputBg, overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
          borderRadius: '2px',
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{
        fontSize: '9px', color: cfg.color, fontWeight: 700,
        fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
        flexShrink: 0,
        minWidth: '36px',
      }}>
        {label}
      </span>
    </div>
  );
}

function CategoryChip({ cat, count, active, onClick, C, locale }: {
  cat: typeof NEWS_CATEGORIES[number];
  count: number;
  active: boolean;
  onClick: () => void;
  C: ColorPalette;
  locale: NewsLocale;
}) {
  const name = getCategoryNameByLocale(cat, locale);
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '7px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
        whiteSpace: 'nowrap' as const, cursor: 'pointer',
        background: active ? cat.colorBg : 'transparent',
        color: active ? cat.color : C.textMuted,
        border: `1px solid ${active ? cat.colorBorder : 'transparent'}`,
        transition: 'all 0.2s ease',
        fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
      }}
    >
      <span>{cat.icon}</span>
      <span>{name}</span>
      {count > 0 && <span style={{ opacity: 0.6, fontSize: '9px' }}>({count})</span>}
    </button>
  );
}

// ─── AI Insights Card ───────────────────────────────────────────
function AIInsightsCard({ allNews, C, locale }: { allNews: NewsItemData[]; C: ColorPalette; locale: NewsLocale }) {
  const s = getNewsStrings(locale);
  const [insightIndex, setInsightIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const insights = useMemo(() => {
    if (allNews.length === 0) return [];
    const result: { icon: string; title: string; description: string; color: string }[] = [];

    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    for (const n of allNews) {
      const key = (n.sentiment || 'neutral') as keyof typeof sentimentCounts;
      sentimentCounts[key] = (sentimentCounts[key] || 0) + 1;
    }
    const total = allNews.length;
    const positiveRatio = Math.round((sentimentCounts.positive / total) * 100);
    const negativeRatio = Math.round((sentimentCounts.negative / total) * 100);

    if (positiveRatio > 50) {
      result.push({
        icon: '📈',
        title: s.marketPositive,
        description: locale === 'ar'
          ? `${positiveRatio}% من الأخبار إيجابية — البيئة مناسبة للمخاطرة`
          : `${positiveRatio}% of news is positive — risk-on environment`,
        color: C.green,
      });
    } else if (negativeRatio > 40) {
      result.push({
        icon: '📉',
        title: s.marketNegative,
        description: locale === 'ar'
          ? `${negativeRatio}% من الأخبار سلبية — يُنصح بالحذر`
          : `${negativeRatio}% of news is negative — caution advised`,
        color: C.red,
      });
    } else {
      result.push({
        icon: '⚖️',
        title: s.marketBalanced,
        description: locale === 'ar'
          ? `التوزيع متوازن بين الإيجابي (${positiveRatio}%) والسلبي (${negativeRatio}%)`
          : `Balanced distribution — positive ${positiveRatio}% / negative ${negativeRatio}%`,
        color: C.cyan,
      });
    }

    const catCounts: Record<string, number> = {};
    for (const n of allNews) {
      const catId = getNewsCategoryId(n.category);
      catCounts[catId] = (catCounts[catId] || 0) + 1;
    }
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      const catDef = NEWS_CATEGORIES.find(c => c.id === topCat[0]);
      const catName = catDef ? getCategoryNameByLocale(catDef, locale) : topCat[0];
      result.push({
        icon: catDef?.icon || '📊',
        title: `${s.activeCategory}: ${catName}`,
        description: locale === 'ar'
          ? `${topCat[1]} خبر في هذا القطاع — حركة مهمة تستحق المتابعة`
          : `${topCat[1]} stories in this sector — notable activity worth tracking`,
        color: catDef?.color || C.cyan,
      });
    }

    const highImpactCount = allNews.filter(n => n.impactLevel === 'high').length;
    if (highImpactCount > 0) {
      result.push({
        icon: '⚡',
        title: s.highImpactEvents.replace('{count}', String(highImpactCount)),
        description: locale === 'ar'
          ? 'أحداث ذات تأثير قوي على الأسواق — راقب الأصول المتأثرة'
          : 'Events with strong market impact — watch affected assets',
        color: C.red,
      });
    }

    const breakingCount = allNews.filter(n => n.newsType === 'breaking').length;
    if (breakingCount > 0) {
      result.push({
        icon: '🔴',
        title: s.breakingCount.replace('{count}', String(breakingCount)),
        description: locale === 'ar'
          ? 'تطورات عاجلة قد تؤثر على حركة الأسواق فوراً'
          : 'Breaking developments that may move markets immediately',
        color: C.red,
      });
    }

    const aiCount = allNews.filter(n => n.aiAnalysis).length;
    if (aiCount > 0) {
      result.push({
        icon: '🤖',
        title: s.aiAnalysisCount.replace('{count}', String(aiCount)),
        description: locale === 'ar'
          ? 'تقارير تحليلية ذكية جاهزة — تعمق في التفاصيل'
          : 'Smart analytical reports ready — dive into the details',
        color: C.purple,
      });
    }

    return result;
  }, [allNews, C, locale, s]);

  useEffect(() => {
    if (insights.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setInsightIndex(prev => (prev + 1) % insights.length);
    }, 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [insights.length]);

  if (insights.length === 0) return null;
  const current = insights[insightIndex];

  return (
    <div style={{ background: C.cardBg, borderRadius: '14px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: C.purpleDim, border: `1px solid rgba(139,92,246,0.2)`,
          color: C.purple,
        }}>
          <SparklesIcon />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: C.textPrimary, fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)' }}>{s.aiInsightsTitle}</h3>
          <p style={{ fontSize: '9px', color: C.textMuted }}>{s.aiInsightsSubtitle}</p>
        </div>
        <span style={{
          fontSize: '8px', padding: '2px 6px', borderRadius: '4px',
          background: C.purpleDim, color: C.purple, fontWeight: 700,
          border: '1px solid rgba(139,92,246,0.2)',
        }}>{s.aiBadge}</span>
      </div>

      <div style={{ padding: '16px', minHeight: '80px', position: 'relative' }}>
        <div key={insightIndex} style={{ animation: 'fadeInUp 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>{current.icon}</span>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: C.textPrimary, marginBottom: '4px', lineHeight: 1.5, fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)' }}>{current.title}</h4>
              <p style={{ fontSize: '11px', color: C.textSecondary, lineHeight: 1.7 }}>{current.description}</p>
            </div>
          </div>
        </div>
      </div>

      {insights.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '0 16px 12px' }}>
          {insights.map((_, i) => (
            <button
              key={i}
              onClick={() => setInsightIndex(i)}
              style={{
                width: i === insightIndex ? '16px' : '6px', height: '6px',
                borderRadius: '3px', border: 'none', cursor: 'pointer',
                background: i === insightIndex ? current.color : C.border,
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Hero Featured Card ─────────────────────────────────────────
function HeroCard({ news, category, mounted, C, locale }: {
  news: NewsItemData;
  category: typeof NEWS_CATEGORIES[number];
  mounted: boolean;
  C: ColorPalette;
  locale: NewsLocale;
}) {
  const s = getNewsStrings(locale);
  const displayTitle = news.translatedTitle || news.title;
  const displaySummary = news.translatedSummary || news.summary;
  const pathSegment = news.slug || news.id;
  // V1066: Use locale-prefixed path so TR/EN/FR/ES users stay on their locale
  const localePrefix = locale === 'ar' ? '' : `/${locale}`;
  const linkHref = pathSegment ? `${localePrefix}/news/${pathSegment}` : '#';
  const isRecent = mounted && news.time && (Date.now() - new Date(news.time).getTime() < 2 * 60 * 60 * 1000);

  return (
    <Link href={linkHref} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        position: 'relative', borderRadius: '16px', overflow: 'hidden',
        background: C.cardBg, border: `1px solid ${C.border}`,
        transition: 'all 0.3s ease', cursor: 'pointer',
        borderInlineStart: `3px solid ${category.color}`,
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${C.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)'}`; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
          <NewsImage src={news.imageUrl} alt="" category={news.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', background: C.gradientOverlay }} />
          {news.newsType === 'breaking' && (
            <span style={{
              position: 'absolute', top: '14px', insetInlineStart: '14px',
              padding: '4px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
              background: 'rgba(239,68,68,0.9)', color: '#fff',
              backdropFilter: 'blur(8px)', letterSpacing: '1px',
              fontFamily: 'var(--font-jetbrains-mono, monospace)',
            }}>{s.breaking}</span>
          )}
          {isRecent && <span style={{ position: 'absolute', top: '14px', insetInlineEnd: '14px' }}><LivePulse C={C} /></span>}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px 24px' }}>
          {/* Top row: category + trust + sentiment */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '9px', padding: '3px 10px', borderRadius: '4px', fontWeight: 700,
              background: category.colorBg, color: category.color,
              border: `1px solid ${category.colorBorder}`,
              textTransform: 'uppercase' as const, letterSpacing: '0.3px',
              fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
            }}>
              {category.icon} {getCategoryNameByLocale(category, locale)}
            </span>
            <NewsTrustBadge source={news.source} locale={locale} />
            {news.aiAnalysis && (
              <span style={{
                fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700,
                background: 'rgba(139,92,246,0.15)', color: '#a78bfa',
              }}>{s.aiBadge}</span>
            )}
            <span style={{
              fontSize: '10px', color: C.textMuted,
              fontFamily: 'var(--font-jetbrains-mono, monospace)',
            }}>
              {mounted ? formatTimeAgoLocale(news.time, locale) : '...'}
            </span>
          </div>

          <h2 style={{
            fontSize: '22px', fontWeight: 700, color: C.textPrimary, lineHeight: 1.6, marginBottom: '10px',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
          }}>
            {sanitizeDisplayText(displayTitle)}
          </h2>

          {displaySummary && (
            <p style={{
              fontSize: '14px', color: C.textSecondary, lineHeight: 1.8, marginBottom: '14px',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {sanitizeDisplayText(displaySummary)}
            </p>
          )}

          {/* Market impact hint */}
          <div style={{ marginBottom: '12px' }}>
            <MarketImpactHint item={news} locale={locale} colors={C} />
          </div>

          {/* Bottom row: source + sentiment + impact */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {news.source && (
              <span style={{
                fontSize: '11px', color: C.textSecondary, fontWeight: 600,
                fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
              }}>
                {news.source}
              </span>
            )}
            <div style={{ flex: 1, minWidth: '120px', maxWidth: '200px' }}>
              <SentimentBar sentiment={news.sentiment} score={news.sentimentScore} C={C} locale={locale} />
            </div>
            {news.impactLevel === 'high' && (
              <span style={{
                fontSize: '9px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600,
                background: IMPACT_CONFIG.high.bg, color: IMPACT_CONFIG.high.color,
              }}>{s.impactHigh}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Article Card (Standard) ────────────────────────────────────
function ArticleCard({ news, category, mounted, C, locale }: {
  news: NewsItemData;
  category: typeof NEWS_CATEGORIES[number] | undefined;
  mounted: boolean;
  C: ColorPalette;
  locale: NewsLocale;
}) {
  const s = getNewsStrings(locale);
  const displayTitle = news.translatedTitle || news.title;
  const pathSegment = news.slug || news.id;
  // V1066: Use locale-prefixed path so TR/EN/FR/ES users stay on their locale
  const localePrefix = locale === 'ar' ? '' : `/${locale}`;
  const linkHref = pathSegment ? `${localePrefix}/news/${pathSegment}` : '#';
  const isRecent = mounted && news.time && (Date.now() - new Date(news.time).getTime() < 2 * 60 * 60 * 1000);

  return (
    <Link href={linkHref} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: C.cardBg, borderRadius: '12px', overflow: 'hidden',
        border: `1px solid ${C.border}`, transition: 'all 0.3s ease', cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 24px ${C.isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.06)'}`; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: '150px', overflow: 'hidden' }}>
          <NewsImage src={news.imageUrl} alt="" category={news.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: C.gradientOverlay }} />
          {news.newsType === 'breaking' && (
            <span style={{
              position: 'absolute', top: '10px', insetInlineStart: '10px',
              padding: '3px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 700,
              background: 'rgba(239,68,68,0.9)', color: '#fff', letterSpacing: '0.5px',
            }}>{s.breaking}</span>
          )}
          {isRecent && (
            <span style={{ position: 'absolute', top: '10px', insetInlineEnd: '10px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px 16px' }}>
          {/* Top row: category + trust */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            {category && (
              <span style={{
                fontSize: '9px', padding: '2px 8px', borderRadius: '4px', fontWeight: 700,
                background: category.colorBg, color: category.color,
                border: `1px solid ${category.colorBorder}`,
                textTransform: 'uppercase' as const, letterSpacing: '0.3px',
                fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
              }}>
                {category.icon} {getCategoryNameByLocale(category, locale)}
              </span>
            )}
            <NewsTrustBadge source={news.source} locale={locale} compact />
          </div>

          <h3 style={{
            fontSize: '15px', fontWeight: 700, color: C.textPrimary, lineHeight: 1.55, marginBottom: '8px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
          }}>
            {sanitizeDisplayText(displayTitle)}
          </h3>

          {/* Market impact hint */}
          <div style={{ marginBottom: '10px' }}>
            <MarketImpactHint item={news} locale={locale} colors={C} />
          </div>

          {/* Bottom row: sentiment + source + time + impact */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
              <NewsTrustBadge source={news.source} locale={locale} />
              {news.source && (
                <span style={{
                  fontSize: '9px', color: C.textMuted,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {news.source}
                </span>
              )}
            </div>
            <span style={{
              fontSize: '9px', color: C.textMuted,
              fontFamily: 'var(--font-jetbrains-mono, monospace)',
              flexShrink: 0,
            }}>
              {mounted ? formatTimeAgoLocale(news.time, locale) : '...'}
            </span>
          </div>

          {/* Sentiment + impact badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
            <div style={{ flex: 1, maxWidth: '140px' }}>
              <SentimentBar sentiment={news.sentiment} score={news.sentimentScore} C={C} locale={locale} />
            </div>
            {news.impactLevel === 'high' && (
              <span style={{
                fontSize: '8px', padding: '1px 6px', borderRadius: '4px', fontWeight: 600,
                background: IMPACT_CONFIG.high.bg, color: IMPACT_CONFIG.high.color,
              }}>{s.impactHigh}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Scroll To Top ──────────────────────────────────────────────
function ScrollToTop({ C, locale }: { C: ColorPalette; locale: NewsLocale }) {
  const s = getNewsStrings(locale);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{
        position: 'fixed', bottom: '80px', insetInlineEnd: '20px', zIndex: 500,
        width: '44px', height: '44px', borderRadius: '12px',
        background: `linear-gradient(135deg, ${C.cyan}, #0ea5e9)`,
        color: C.isDark ? C.bg : '#fff', border: 'none',
        boxShadow: '0 4px 20px rgba(0,229,255,0.3)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s',
      }}
      aria-label={s.backToTop}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15" /></svg>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface SmartNewsCenterProps {
  initialLiveNews?: any[];
  locale: NewsLocale;
}

export default function SmartNewsCenter({ initialLiveNews, locale }: SmartNewsCenterProps) {
  const C = useColors();
  const s = getNewsStrings(locale);
  const isRTL = s.dir === 'rtl';

  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Zustand store — same pattern as old NewsPageClient
  const { liveNews, liveNewsLoading, liveMode, fetchLiveNews, setLiveNews, setLiveMode } = useNewsStore(
    useShallow((state) => ({
      liveNews: state.liveNews,
      liveNewsLoading: state.liveNewsLoading,
      liveMode: state.liveMode,
      fetchLiveNews: state.fetchLiveNews,
      setLiveNews: state.setLiveNews,
      setLiveMode: state.setLiveMode,
    }))
  );

  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized) {
      const store = useNewsStore.getState();
      if (initialLiveNews && initialLiveNews.length > 0) {
        store.setLiveNews(initialLiveNews, new Date().toISOString());
      }
      setInitialized(true);
      const localeTag = locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'tr' ? 'tr-TR' : locale === 'es' ? 'es-ES' : 'en-US';
      setLastUpdated(new Date().toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' }));
    }
  }, [initialLiveNews, initialized, locale]);

  const effectiveLiveNews = initialized ? liveNews : (initialLiveNews || []);
  const allFormattedNews = useMemo(() => [...effectiveLiveNews].map(formatNewsItem), [effectiveLiveNews]);

  const filteredNews = useMemo(() => {
    let news = allFormattedNews;
    if (activeCategory !== 'all') {
      news = news.filter(n => getNewsCategoryId(n.category) === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      news = news.filter(n => {
        const title = (n.translatedTitle || n.title).toLowerCase();
        const summary = (n.translatedSummary || n.summary).toLowerCase();
        return title.includes(q) || summary.includes(q);
      });
    }
    return news;
  }, [allFormattedNews, activeCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of NEWS_CATEGORIES) counts[cat.id] = 0;
    for (const news of allFormattedNews) {
      const catId = getNewsCategoryId(news.category);
      counts[catId] = (counts[catId] || 0) + 1;
    }
    return counts;
  }, [allFormattedNews]);

  const categoryData = useMemo(() => {
    return NEWS_CATEGORIES.map(cat => ({
      categoryId: cat.id,
      news: filteredNews.filter(n => getNewsCategoryId(n.category) === cat.id),
    }));
  }, [filteredNews]);

  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    const hasServerData = initialLiveNews && initialLiveNews.length > 0;
    if (!hasServerData) fetchLiveNews();
    const interval = setInterval(() => {
      fetchLiveNews();
      const localeTag = locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'tr' ? 'tr-TR' : locale === 'es' ? 'es-ES' : 'en-US';
      setLastUpdated(new Date().toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' }));
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLiveNews, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const toggleLiveMode = () => setLiveMode(liveMode === 'live' ? 'paused' : 'live');
  const isInitialLoading = liveNewsLoading && effectiveLiveNews.length === 0;
  const isCategoryView = activeCategory !== 'all';

  const categoryViewHero = filteredNews[0];
  const categoryViewGrid = filteredNews.slice(1, visibleCount);
  const categoryViewHasMore = filteredNews.length > visibleCount;

  // Audio digest headlines (top 5 by impact + recency)
  const digestHeadlines = useMemo(() => {
    return [...allFormattedNews]
      .sort((a, b) => {
        // High impact first, then by date
        const aImpact = a.impactLevel === 'high' ? 3 : a.impactLevel === 'medium' ? 2 : 1;
        const bImpact = b.impactLevel === 'high' ? 3 : b.impactLevel === 'medium' ? 2 : 1;
        if (aImpact !== bImpact) return bImpact - aImpact;
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      })
      .slice(0, 5)
      .map(n => ({
        title: n.translatedTitle || n.title,
        source: n.source,
        category: n.category,
      }));
  }, [allFormattedNews]);

  // Choose the right BreakingFlash component (Arabic vs non-Arabic)
  const BreakingFlashComponent = locale === 'ar' ? BreakingFlash : EnBreakingFlash;

  return (
    <main className="min-h-screen pb-mobile-safe" dir={s.dir} style={{ background: C.bg, transition: 'background 0.3s ease' }}>
      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ═══ HERO HEADER ═══ */}
      <section style={{ padding: '28px 0 0', background: C.heroGradient }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingInline: 'clamp(16px, 4vw, 48px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={{
                fontSize: '28px', fontWeight: 700, color: C.textPrimary,
                fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
              }}>{s.pageTitle}</h1>
              <button
                onClick={toggleLiveMode}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                  background: liveMode === 'live' ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)',
                  border: `1px solid ${liveMode === 'live' ? 'rgba(16,185,129,0.2)' : 'rgba(234,179,8,0.2)'}`,
                  color: liveMode === 'live' ? C.green : '#eab308',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-jetbrains-mono, monospace)',
                  letterSpacing: '0.5px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: liveMode === 'live' ? C.green : '#eab308' }} />
                {liveMode === 'live' ? s.liveBadge : s.pausedBadge}
              </button>
              <span style={{ fontSize: '12px', color: C.textMuted, fontWeight: 600 }}>
                {s.newsCount.replace('{count}', String(allFormattedNews.length))}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {lastUpdated && <span style={{ fontSize: '10px', color: C.textMuted }}>{s.lastUpdated.replace('{time}', lastUpdated)}</span>}

              {/* Audio Digest Button (revolutionary feature) */}
              <AudioDigestButton locale={locale} headlines={digestHeadlines} colors={C} />

              {/* Search Toggle */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: showSearch ? C.cyanDim : C.cardBg,
                  border: `1px solid ${showSearch ? C.cyanBorder : C.border}`,
                  color: showSearch ? C.cyan : C.textMuted,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
                aria-label={s.search}
              >
                <SearchIcon />
              </button>

              {/* Refresh */}
              <button
                onClick={() => {
                  fetchLiveNews();
                  const localeTag = locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'tr' ? 'tr-TR' : locale === 'es' ? 'es-ES' : 'en-US';
                  setLastUpdated(new Date().toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' }));
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                  border: `1px solid ${C.border}`, color: C.textSecondary, background: C.cardBg,
                  cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                }}
                disabled={liveNewsLoading}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={liveNewsLoading ? 'animate-spin' : ''}>
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                {s.refresh}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div style={{ marginBottom: '12px', animation: 'fadeInUp 0.3s ease' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', borderRadius: '10px',
                background: C.cardBg, border: `1px solid ${C.cyanBorder}`,
                maxWidth: '500px',
              }}>
                <SearchIcon />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={s.searchPlaceholder}
                  style={{
                    flex: 1, border: 'none', outline: 'none', fontSize: '14px',
                    background: 'transparent', color: C.textPrimary,
                    fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>✕</button>
                )}
              </div>
            </div>
          )}

          <p style={{ fontSize: '13px', color: C.textSecondary, marginBottom: '20px' }}>
            {s.pageSubtitle}
          </p>
        </div>
      </section>

      {/* ═══ BREAKING FLASH BAR ═══ */}
      <BreakingFlashComponent />

      {/* ═══ CATEGORY TABS ═══ */}
      <section style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: C.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingInline: 'clamp(16px, 4vw, 48px)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            overflowX: 'auto', padding: '10px 0',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}>
            <button
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              style={{
                padding: '7px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                whiteSpace: 'nowrap', cursor: 'pointer',
                background: activeCategory === 'all' && !searchQuery ? C.cyanDim : 'transparent',
                color: activeCategory === 'all' && !searchQuery ? C.cyan : C.textMuted,
                border: `1px solid ${activeCategory === 'all' && !searchQuery ? C.cyanBorder : 'transparent'}`,
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
              }}
            >
              {s.allCategories}
            </button>
            {NEWS_CATEGORIES.map(cat => (
              <CategoryChip
                key={cat.id}
                cat={cat}
                count={categoryCounts[cat.id] || 0}
                active={activeCategory === cat.id}
                onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
                C={C}
                locale={locale}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MAIN CONTENT — Two-Column Layout ═══ */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px clamp(16px, 4vw, 48px) 48px' }}>
        {/* Loading State */}
        {isInitialLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} role="status" aria-label="Loading news">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{
                background: C.cardBg, borderRadius: '12px', padding: '24px',
                minHeight: '120px', border: `1px solid ${C.border}`,
              }}>
                <div style={{ width: '70%', height: '16px', borderRadius: '4px', background: C.inputBg, marginBottom: '8px' }} />
                <div style={{ width: '50%', height: '12px', borderRadius: '4px', background: C.inputBg }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty State (filtered) */}
        {!isInitialLoading && filteredNews.length === 0 && allFormattedNews.length > 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: C.cardBg, borderRadius: '16px', border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>🔍</div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: C.textSecondary, marginBottom: '6px' }}>{s.noResults}</p>
            <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '12px' }}>{s.noResultsHint}</p>
            <button onClick={() => { setActiveCategory('all'); setSearchQuery(''); }} style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}`, cursor: 'pointer',
              fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
            }}>
              {s.showAll}
            </button>
          </div>
        )}

        {/* No data at all */}
        {!isInitialLoading && allFormattedNews.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '64px 24px',
            background: C.cardBg, borderRadius: '16px', border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📰</div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: C.textSecondary, marginBottom: '8px' }}>{s.noNews}</p>
            <p style={{ fontSize: '13px', color: C.textMuted, marginBottom: '16px' }}>{s.noNewsHint}</p>
            <button onClick={() => fetchLiveNews()} style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}`, cursor: 'pointer',
              fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
            }}>
              {s.refreshNow}
            </button>
          </div>
        )}

        {/* ═══ TWO-COLUMN LAYOUT ═══ */}
        {!isInitialLoading && filteredNews.length > 0 && (
          <>
            <style>{`
              @media (min-width: 900px) {
                .smart-news-two-col { grid-template-columns: 5fr 2fr !important; }
              }
            `}</style>
            <div className="smart-news-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }}>
              {/* ═══ MAIN COLUMN ═══ */}
              <div>
                {/* Category view */}
                {isCategoryView && (
                  <section>
                    {categoryViewHero && (
                      <div style={{ marginBottom: '24px' }}>
                        <HeroCard
                          news={categoryViewHero}
                          category={NEWS_CATEGORIES.find(c => c.id === activeCategory) || NEWS_CATEGORIES[0]}
                          mounted={mounted}
                          C={C}
                          locale={locale}
                        />
                      </div>
                    )}
                    {categoryViewGrid.length > 0 && (
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px',
                        marginBottom: '20px',
                      }}>
                        {categoryViewGrid.map(news => {
                          const catId = getNewsCategoryId(news.category);
                          const catDef = NEWS_CATEGORIES.find(c => c.id === catId);
                          return <ArticleCard key={news.id} news={news} category={catDef} mounted={mounted} C={C} locale={locale} />;
                        })}
                      </div>
                    )}
                    {categoryViewHasMore && (
                      <div style={{ textAlign: 'center', padding: '12px 0' }}>
                        <button
                          onClick={() => setVisibleCount(prev => prev + 9)}
                          style={{
                            padding: '10px 28px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                            background: C.cyanDim, color: C.cyan,
                            border: `1px solid ${C.cyanBorder}`, cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.15)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = C.cyanDim; }}
                        >
                          {s.loadMore}
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {/* All categories view */}
                {!isCategoryView && categoryData.map((catData) => {
                  const catDef = NEWS_CATEGORIES.find(c => c.id === catData.categoryId);
                  if (!catDef || catData.news.length === 0) return null;

                  const featured = catData.news[0];
                  const rest = catData.news.slice(1, 5);

                  return (
                    <section key={catData.categoryId} style={{ marginBottom: '36px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '3px', height: '20px', borderRadius: '2px',
                            background: `linear-gradient(180deg, ${catDef.color}, ${C.purple})`,
                          }} />
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: catDef.colorBg, border: `1px solid ${catDef.colorBorder}`, fontSize: '14px',
                          }}>
                            {catDef.icon}
                          </div>
                          <h2 style={{
                            fontSize: '15px', fontWeight: 700, color: C.textPrimary,
                            fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                          }}>{getCategoryNameByLocale(catDef, locale)}</h2>
                          <span style={{
                            fontSize: '9px', padding: '2px 8px', borderRadius: '4px', fontWeight: 700,
                            background: catDef.colorBg, color: catDef.color, border: `1px solid ${catDef.colorBorder}`,
                            fontFamily: 'var(--font-jetbrains-mono, monospace)',
                          }}>
                            {catData.news.length}
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveCategory(catDef.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                            background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}`, cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                          }}
                        >
                          {s.readMore}
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }}>
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
                        <HeroCard news={featured} category={catDef} mounted={mounted} C={C} locale={locale} />
                        {rest.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                            {rest.map(news => (
                              <ArticleCard key={news.id} news={news} category={catDef} mounted={mounted} C={C} locale={locale} />
                            ))}
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>

              {/* ═══ SIDEBAR ═══ */}
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Revolutionary: Live Market Ticker Sidebar */}
                <MarketTickerSidebar locale={locale} colors={C} />

                {/* AI Insights Card */}
                <AIInsightsCard allNews={allFormattedNews} C={C} locale={locale} />

                {/* Smart Council Widget */}
                <SmartCouncilWidget locale={locale} />

                {/* Most Read Widget */}
                <MostReadWidget locale={locale} />

                {/* Economic Calendar Widget */}
                <EconomicCalendarWidget locale={locale} />

                {/* Quick Category Stats */}
                <div style={{
                  background: C.cardBg, borderRadius: '14px',
                  border: `1px solid ${C.border}`, overflow: 'hidden',
                  padding: '16px',
                }}>
                  <h4 style={{
                    fontSize: '12px', fontWeight: 700, color: C.textSecondary,
                    marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px',
                    fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                  }}>{s.newsDistribution}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {NEWS_CATEGORIES.filter(c => (categoryCounts[c.id] || 0) > 0).slice(0, 6).map(cat => {
                      const count = categoryCounts[cat.id] || 0;
                      const maxCount = Math.max(...Object.values(categoryCounts));
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      return (
                        <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', flexShrink: 0 }}>{cat.icon}</span>
                          <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: C.inputBg, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${percentage}%`, borderRadius: '3px', background: cat.color, transition: 'width 0.5s ease' }} />
                          </div>
                          <span style={{
                            fontSize: '10px', color: C.textMuted, fontWeight: 600,
                            fontFamily: 'var(--font-jetbrains-mono, monospace)',
                            minWidth: '20px', textAlign: 'start',
                          }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>

      {/* ═══ SCROLL TO TOP ═══ */}
      <ScrollToTop C={C} locale={locale} />
    </main>
  );
}
