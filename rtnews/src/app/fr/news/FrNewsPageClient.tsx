'use client';

// ═══════════════════════════════════════════════════════════════════
// Rouaa News Center — French Edition — Complete Redesign V2
// Layout: Hero + Breaking + Sticky Categories + Two-Column (Main + Sidebar)
// Features: Dark/Light Mode, AI Insights Sidebar Card, Search, Live Pulse
// LTR: Full LTR support for English
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import EnBreakingFlash from '@/components/rouaa/EnBreakingFlash' // Shared component, no Fr version needed;
import { NEWS_CATEGORIES, getNewsCategoryId, getCategoryNameByLocale } from '@/lib/news-categories';
import { IMPACT_CONFIG_FR, SENTIMENT_CONFIG_FR, CATEGORY_NAME_FR, formatTimeAgoLocale } from '@/lib/locale';
import { sanitizeDisplayText } from '@/lib/clean-markdown';
import { NewsItemData } from '@/components/rouaa/news/NewsCards';
import NewsImage from '@/components/rouaa/NewsImage';
import { SmartCouncilWidget, EconomicCalendarWidget, MostReadWidget } from '@/components/shared/SidebarWidgets';

// ─── Dark-Only Color Palette (Bloomberg Terminal is ALWAYS dark) ──
// No theme toggle — hardcoded dark colors to prevent light mode leaks
const DARK_PALETTE = {
  // Backgrounds
  bg: '#0A0E27',
  cardBg: '#0F1629',
  cardBgHover: '#141B33',
  sidebarBg: '#0C1024',
  headerBg: 'rgba(10,14,39,0.93)',
  inputBg: 'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.06)',
  // Text
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  // Borders
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  // Accents
  cyan: '#00E5FF',
  cyanDim: 'rgba(0,229,255,0.06)',
  cyanBorder: 'rgba(0,229,255,0.15)',
  purple: '#8B5CF6',
  purpleDim: 'rgba(139,92,246,0.06)',
  gold: '#d4af37',
  goldDim: 'rgba(212,175,55,0.06)',
  green: '#10B981',
  red: '#EF4444',
  // Overlay
  gradientOverlay: 'linear-gradient(to top, #0F1629 0%, rgba(15,22,41,0.85) 50%, transparent 100%)',
  heroGradient: 'linear-gradient(180deg, rgba(0,229,255,0.04) 0%, transparent 100%)',
  dividerGradient: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), rgba(0,229,255,0.2), rgba(255,255,255,0.08), transparent)',
  isDark: true as const,
};

type DarkPalette = typeof DARK_PALETTE;
const C: DarkPalette = DARK_PALETTE;

// ─── Types ─────────────────────────────────────────────────────
interface CategoryNewsData {
  categoryId: string;
  news: NewsItemData[];
}

// ─── Helper ────────────────────────────────────────────────────
function formatNewsItem(item: any): NewsItemData {
  let affectedAssets: { symbol: string; direction?: string }[] = [];
  if (item.cachedAffectedAssets) {
    try {
      const parsed = typeof item.cachedAffectedAssets === 'string' ? JSON.parse(item.cachedAffectedAssets) : item.cachedAffectedAssets;
      if (Array.isArray(parsed)) affectedAssets = parsed.map((a: any) => ({ symbol: typeof a.symbol === 'string' ? a.symbol : String(a), direction: typeof a.direction === 'string' ? a.direction : undefined }));
    } catch {}
  } else if (item.affectedAssets) {
    try {
      const parsed = typeof item.affectedAssets === 'string' ? JSON.parse(item.affectedAssets) : item.affectedAssets;
      if (Array.isArray(parsed)) affectedAssets = parsed.map((a: any) => ({ symbol: typeof a.symbol === 'string' ? a.symbol : String(a), direction: typeof a.direction === 'string' ? a.direction : undefined }));
    } catch {}
  }
  return {
    id: item.id,
    title: sanitizeDisplayText(item.title || ''),
    summary: sanitizeDisplayText(item.summary || ''),
    translatedTitle: item.translatedTitle ? sanitizeDisplayText(item.translatedTitle) : undefined,
    translatedSummary: item.translatedSummary ? sanitizeDisplayText(item.translatedSummary) : undefined,
    time: item.time || item.date || item.fetchedAt || new Date().toISOString(),
    source: item.source || item.sourceName || '',
    url: item.url || '',
    category: item.category || 'Économie',
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

// ─── SVG Icons ─────────────────────────────────────────────────
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

// ─── Sub-Components ────────────────────────────────────────────

function LivePulse({ C }: { C: DarkPalette }) {
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

function SentimentDot({ sentiment, C }: { sentiment: string; C: DarkPalette }) {
  const cfg = SENTIMENT_CONFIG_FR[sentiment] || SENTIMENT_CONFIG_FR.neutral;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      <span style={{ fontSize: '9px', color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
    </div>
  );
}

function CategoryChip({ cat, count, active, onClick, C }: { cat: typeof NEWS_CATEGORIES[number]; count: number; active: boolean; onClick: () => void; C: DarkPalette }) {
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
      }}
    >
      <span>{cat.icon}</span>
      <span>{getCategoryNameByLocale(cat, 'fr')}</span>
      {count > 0 && <span style={{ opacity: 0.6, fontSize: '9px' }}>({count})</span>}
    </button>
  );
}

// ─── AI Insights Card ──────────────────────────────────────────
function AIInsightsCard({ allNews, C }: { allNews: NewsItemData[]; C: DarkPalette }) {
  const [insightIndex, setInsightIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute insights from news data
  const insights = useMemo(() => {
    if (allNews.length === 0) return [];

    const result: { icon: string; title: string; description: string; color: string }[] = [];

    // 1. Market Sentiment Summary
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    for (const n of allNews) {
      sentimentCounts[n.sentiment as keyof typeof sentimentCounts] = (sentimentCounts[n.sentiment as keyof typeof sentimentCounts] || 0) + 1;
    }
    const total = allNews.length;
    const positiveRatio = Math.round((sentimentCounts.positive / total) * 100);
    const negativeRatio = Math.round((sentimentCounts.negative / total) * 100);

    if (positiveRatio > 50) {
      result.push({
        icon: '📈',
        title: 'Les marchés sont haussiers',
        description: `${positiveRatio}% des actualités sont positives — environnement favorable pour la prise de risque`,
        color: C.green,
      });
    } else if (negativeRatio > 40) {
      result.push({
        icon: '📉',
        title: 'Prudence de marché conseillée',
        description: `${negativeRatio}% des actualités sont négatives — positionnement défensif recommandé`,
        color: C.red,
      });
    } else {
      result.push({
        icon: '⚖️',
        title: 'Sentiment de marché équilibré',
        description: `Répartition équilibrée entre positif (${positiveRatio}%) et négatif (${negativeRatio}%)`,
        color: C.cyan,
      });
    }

    // 2. Most Active Category
    const catCounts: Record<string, number> = {};
    for (const n of allNews) {
      const catId = getNewsCategoryId(n.category);
      catCounts[catId] = (catCounts[catId] || 0) + 1;
    }
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      const catDef = NEWS_CATEGORIES.find(c => c.id === topCat[0]);
      result.push({
        icon: catDef?.icon || '📊',
        title: `Pic d'actualités ${catDef?.nameEn || topCat[0]}`,
        description: `${topCat[1]} articles dans ce secteur — mouvement significatif à surveiller`,
        color: catDef?.color || C.cyan,
      });
    }

    // 3. High Impact Count
    const highImpactCount = allNews.filter(n => n.impactLevel === 'high').length;
    if (highImpactCount > 0) {
      result.push({
        icon: '⚡',
        title: `${highImpactCount} Événements à Fort Impact`,
        description: 'Événements à fort impact sur le marché — surveillez les actifs concernés',
        color: C.red,
      });
    }

    // 4. Breaking News Alert
    const breakingCount = allNews.filter(n => n.newsType === 'breaking').length;
    if (breakingCount > 0) {
      result.push({
        icon: '🔴',
        title: `${breakingCount} Actualités Flash`,
        description: 'Développements urgents pouvant impacter les mouvements du marché immédiatement',
        color: C.red,
      });
    }

    // 5. AI Analysis Coverage
    const aiCount = allNews.filter(n => n.aiAnalysis).length;
    if (aiCount > 0) {
      result.push({
        icon: '🤖',
        title: `${aiCount} Analyses IA Disponibles`,
        description: 'Rapports analytiques intelligents prêts — plongez dans les détails',
        color: C.purple,
      });
    }

    return result;
  }, [allNews, C]);

  // Auto-rotate insights
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
    <div style={{
      background: C.cardBg, borderRadius: '14px',
      border: `1px solid ${C.border}`, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: C.purpleDim, border: `1px solid rgba(139,92,246,0.2)`,
          color: C.purple,
        }}>
          <SparklesIcon />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: C.textPrimary }}>Rouaa Insights</h3>
          <p style={{ fontSize: '9px', color: C.textMuted }}>Analyse instantanée propulsée par l'IA</p>
        </div>
        <span style={{
          fontSize: '8px', padding: '2px 6px', borderRadius: '4px',
          background: C.purpleDim, color: C.purple, fontWeight: 700,
          border: '1px solid rgba(139,92,246,0.2)',
        }}>AI</span>
      </div>

      {/* Insight Content */}
      <div style={{ padding: '16px', minHeight: '80px', position: 'relative' }}>
        <div key={insightIndex} style={{ animation: 'fadeInUp 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>{current.icon}</span>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: C.textPrimary, marginBottom: '4px', lineHeight: '1.5' }}>{current.title}</h4>
              <p style={{ fontSize: '11px', color: C.textSecondary, lineHeight: '1.7' }}>{current.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dots Navigation */}
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

// ─── Hero Featured Card ────────────────────────────────────────

function HeroCard({ news, category, mounted, C }: { news: NewsItemData; category: typeof NEWS_CATEGORIES[number]; mounted: boolean; C: DarkPalette }) {
  const displayTitle = news.translatedTitle || news.title;
  const displaySummary = news.translatedSummary || news.summary;
  const pathSegment = news.slug || news.id;
  const isRecent = mounted && news.time && (Date.now() - new Date(news.time).getTime() < 2 * 60 * 60 * 1000);

  return (
    <Link href={pathSegment ? `/fr/news/${pathSegment}` : '#'} style={{ textDecoration: 'none', display: 'block' }}>
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
            <span style={{ position: 'absolute', top: '14px', insetInlineStart: '14px', padding: '4px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, background: 'rgba(239,68,68,0.9)', color: '#fff', backdropFilter: 'blur(8px)', letterSpacing: '1px', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>FLASH</span>
          )}
          {isRecent && <span style={{ position: 'absolute', top: '14px', insetInlineEnd: '14px' }}><LivePulse C={C} /></span>}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '9px', padding: '3px 10px', borderRadius: '4px', fontWeight: 700, background: category.colorBg, color: category.color, border: `1px solid ${category.colorBorder}`, textTransform: 'uppercase' as const, letterSpacing: '0.3px' }}>
              {category.icon} {CATEGORY_NAME_FR[category.id] || category.nameEn}
            </span>
            <SentimentDot sentiment={news.sentiment} C={C} />
            {news.aiAnalysis && (
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>AI</span>
            )}
            <span style={{ fontSize: '10px', color: C.textMuted, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
              {mounted ? formatTimeAgoLocale(news.time, 'fr') : '...'}
            </span>
          </div>
          <h2 style={{
            fontSize: '22px', fontWeight: 700, color: C.textPrimary, lineHeight: '1.6', marginBottom: '10px',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {sanitizeDisplayText(displayTitle)}
          </h2>
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
              <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, background: IMPACT_CONFIG_FR.high.bg, color: IMPACT_CONFIG_FR.high.color }}>
                Impact Élevé
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Article Card (Standard) ───────────────────────────────────

function ArticleCard({ news, category, mounted, C }: { news: NewsItemData; category: typeof NEWS_CATEGORIES[number] | undefined; mounted: boolean; C: DarkPalette }) {
  const displayTitle = news.translatedTitle || news.title;
  const pathSegment = news.slug || news.id;
  const sentimentCfg = SENTIMENT_CONFIG_FR[news.sentiment] || SENTIMENT_CONFIG_FR.neutral;
  const isRecent = mounted && news.time && (Date.now() - new Date(news.time).getTime() < 2 * 60 * 60 * 1000);

  return (
    <Link href={pathSegment ? `/fr/news/${pathSegment}` : '#'} style={{ textDecoration: 'none', display: 'block' }}>
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
            <span style={{ position: 'absolute', top: '10px', insetInlineStart: '10px', padding: '3px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, background: 'rgba(239,68,68,0.9)', color: '#fff', letterSpacing: '0.5px' }}>FLASH</span>
          )}
          {isRecent && (
            <span style={{ position: 'absolute', top: '10px', insetInlineEnd: '10px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            {category && (
              <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, background: category.colorBg, color: category.color, border: `1px solid ${category.colorBorder}`, textTransform: 'uppercase' as const, letterSpacing: '0.3px' }}>
                {category.icon} {CATEGORY_NAME_FR[category.id] || category.nameEn}
              </span>
            )}
          </div>
          <h3 style={{
            fontSize: '15px', fontWeight: 700, color: C.textPrimary, lineHeight: '1.55', marginBottom: '8px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {sanitizeDisplayText(displayTitle)}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sentimentCfg.color, flexShrink: 0 }} />
              <span style={{ fontSize: '9px', color: sentimentCfg.color, fontWeight: 600 }}>{sentimentCfg.label}</span>
              {news.impactLevel === 'high' && (
                <span style={{ fontSize: '8px', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, background: IMPACT_CONFIG_FR.high.bg, color: IMPACT_CONFIG_FR.high.color }}>Impact Élevé</span>
              )}
            </div>
            <span style={{ fontSize: '9px', color: C.textMuted, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
              {mounted ? formatTimeAgoLocale(news.time, 'fr') : '...'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Compact Card ──────────────────────────────────────────────

function CompactCard({ news, mounted, C }: { news: NewsItemData; mounted: boolean; C: DarkPalette }) {
  const displayTitle = news.translatedTitle || news.title;
  const sentimentCfg = SENTIMENT_CONFIG_FR[news.sentiment] || SENTIMENT_CONFIG_FR.neutral;
  const pathSegment = news.slug || news.id;

  return (
    <Link href={pathSegment ? `/fr/news/${pathSegment}` : '#'} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '14px', borderRadius: '10px',
        background: C.cardBg, border: `1px solid ${C.border}`,
        transition: 'all 0.3s ease', cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div style={{ flexShrink: 0, width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
          <NewsImage src={news.imageUrl} alt="" category={news.category} style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            fontSize: '13px', fontWeight: 600, color: C.textPrimary, lineHeight: '1.6', marginBottom: '6px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {sanitizeDisplayText(displayTitle)}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sentimentCfg.color, flexShrink: 0 }} />
            <span style={{ fontSize: '9px', color: sentimentCfg.color, fontWeight: 600 }}>{sentimentCfg.label}</span>
            {news.source && <span style={{ fontSize: '9px', color: C.textMuted }}>{news.source}</span>}
            <span style={{ fontSize: '9px', color: C.textMuted, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
              {mounted ? formatTimeAgoLocale(news.time, 'fr') : '...'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Most Read Item ────────────────────────────────────────────

function MostReadItem({ news, index, mounted, C }: { news: NewsItemData; index: number; mounted: boolean; C: DarkPalette }) {
  const pathSegment = news.slug || news.id;
  const medalColors = ['#FFB800', '#C0C0C0', '#CD7F32'];
  const medalBgs = ['rgba(255,184,0,0.1)', 'rgba(192,192,192,0.1)', 'rgba(205,127,50,0.1)'];

  return (
    <Link href={pathSegment ? `/fr/news/${pathSegment}` : '#'} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '10px 12px', borderRadius: '8px',
        transition: 'all 0.2s ease', cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = C.cyanDim; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{
          width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: index < 3 ? medalBgs[index] : 'rgba(100,116,139,0.08)',
          color: index < 3 ? medalColors[index] : C.textMuted,
          fontSize: '11px', fontWeight: 700,
          fontFamily: 'var(--font-jetbrains-mono, monospace)',
        }}>
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h5 style={{
            fontSize: '12px', fontWeight: 600, color: C.textPrimary, lineHeight: '1.6',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {news.translatedTitle || news.title}
          </h5>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            {news.impactLevel === 'high' && (
              <span style={{ fontSize: '8px', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, background: IMPACT_CONFIG_FR.high.bg, color: IMPACT_CONFIG_FR.high.color }}>Impact Élevé</span>
            )}
            <span style={{ fontSize: '9px', color: C.textMuted, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
              {mounted ? formatTimeAgoLocale(news.time, 'fr') : '...'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Scroll To Top ─────────────────────────────────────────────

function ScrollToTop({ C }: { C: DarkPalette }) {
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
        background: `linear-gradient(135deg, ${C.cyan}, #0ea5e9)`, color: C.isDark ? C.bg : '#fff', border: 'none',
        boxShadow: '0 4px 20px rgba(0,229,255,0.3)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s',
      }}
      aria-label="Retour en haut"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15" /></svg>
    </button>
  );
}

// ─── Main Page Component ───────────────────────────────────────

interface FrNewsPageClientProps {
  initialLiveNews?: any[];
}

export default function FrNewsPageClient({ initialLiveNews }: FrNewsPageClientProps) {
  // C is now a static dark-only palette defined at top of file — no useColors()
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Local French news state (NOT the shared Arabic store) ──
  // The shared useNewsStore fetches Arabic data from /api/news/live.
  // We manage French news locally, fetching from /api/news/fr/live.
  const [frLiveNews, setEnLiveNews] = useState<any[]>(initialLiveNews || []);
  const [frLiveNewsLoading, setEnLiveNewsLoading] = useState(false);
  const [liveMode, setLiveMode] = useState<'live' | 'paused'>('live');

  // Local fetch function for English live news
  const fetchFrLiveNews = useCallback(async () => {
    if (liveMode === 'paused') return;
    setEnLiveNewsLoading(true);
    try {
      const res = await fetch('/api/news/fr/live?limit=200', { cache: 'no-store' });
      const data = await res.json();
      if (data.articles && data.articles.length > 0) {
        setEnLiveNews(data.articles);
        setLastUpdated(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('[FrNewsPage] Fetch error:', err);
    } finally {
      setEnLiveNewsLoading(false);
    }
  }, [liveMode]);

  // Initialize with server-provided data
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized) {
      if (initialLiveNews && initialLiveNews.length > 0) {
        setEnLiveNews(initialLiveNews);
      }
      setInitialized(true);
      setLastUpdated(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    }
  }, [initialLiveNews, initialized]);

  const effectiveLiveNews = frLiveNews;

  const allFormattedNews = useMemo(() => {
    return [...effectiveLiveNews].map(formatNewsItem);
  }, [effectiveLiveNews]);

  // Search + Filter
  const filteredNews = useMemo(() => {
    let news = allFormattedNews;
    // Category filter
    if (activeCategory !== 'all') {
      news = news.filter(n => getNewsCategoryId(n.category) === activeCategory);
    }
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      news = news.filter(n => {
        const title = (n.translatedTitle || n.title).toLowerCase();
        const summary = (n.translatedSummary || n.summary || '').toLowerCase();
        return title.includes(q) || summary.includes(q);
      });
    }
    return news;
  }, [allFormattedNews, activeCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of NEWS_CATEGORIES) counts[cat.id] = 0;
    for (const news of allFormattedNews) {
      const catId = getNewsCategoryId(news.category);
      counts[catId] = (counts[catId] || 0) + 1;
    }
    return counts;
  }, [allFormattedNews]);

  // Category sections (when "all" is selected)
  const categoryData: CategoryNewsData[] = useMemo(() => {
    return NEWS_CATEGORIES.map(cat => ({
      categoryId: cat.id,
      news: filteredNews.filter(n => getNewsCategoryId(n.category) === cat.id),
    }));
  }, [filteredNews]);

  // Most read
  const mostReadNews = useMemo(() => {
    return [...filteredNews].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
  }, [filteredNews]);

  // Load more
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    const hasServerData = initialLiveNews && initialLiveNews.length > 0;
    if (!hasServerData) fetchFrLiveNews();
    const interval = setInterval(() => {
      fetchFrLiveNews();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchFrLiveNews]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus search when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const toggleLiveMode = () => setLiveMode(liveMode === 'live' ? 'paused' : 'live');
  const isInitialLoading = frLiveNewsLoading && effectiveLiveNews.length === 0;
  const isCategoryView = activeCategory !== 'all';

  // Category view: hero + grid
  const categoryViewHero = filteredNews[0];
  const categoryViewGrid = filteredNews.slice(1, visibleCount);
  const categoryViewHasMore = filteredNews.length > visibleCount;

  return (
    <main className="min-h-screen pb-mobile-safe" dir="ltr" style={{ background: C.bg, transition: 'background 0.3s ease' }}>
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
      <section style={{
        padding: '28px 0 0',
        background: C.heroGradient,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingInline: 'clamp(16px, 4vw, 48px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{
                fontSize: '28px', fontWeight: 700, color: C.textPrimary,
                fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
              }}>Centre d'Actualités</h1>
              <button
                onClick={toggleLiveMode}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                  background: liveMode === 'live' ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)',
                  border: `1px solid ${liveMode === 'live' ? 'rgba(16,185,129,0.2)' : 'rgba(234,179,8,0.2)'}`,
                  color: liveMode === 'live' ? C.green : '#eab308', cursor: 'pointer',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: liveMode === 'live' ? C.green : '#eab308' }} />
                {liveMode === 'live' ? 'LIVE' : 'EN PAUSE'}
              </button>
              <span style={{ fontSize: '12px', color: C.textMuted, fontWeight: 600 }}>{allFormattedNews.length} articles</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {lastUpdated && <span style={{ fontSize: '10px', color: C.textMuted }}>Dernière mise à jour : {lastUpdated}</span>}
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
                aria-label="Rechercher"
              >
                <SearchIcon />
              </button>
              {/* Refresh */}
              <button
                onClick={() => { fetchFrLiveNews(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                  border: `1px solid ${C.border}`, color: C.textSecondary, background: C.cardBg, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                disabled={frLiveNewsLoading}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={frLiveNewsLoading ? 'animate-spin' : ''}>
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                Actualiser
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
                  placeholder="Rechercher des actualités..."
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
            Intelligence financière en temps réel propulsée par l'IA — couverture complète des marchés mondiaux
          </p>
        </div>
      </section>

      {/* ═══ BREAKING FLASH BAR ═══ */}
      <EnBreakingFlash />

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
              }}
            >
              All
            </button>
            {NEWS_CATEGORIES.map(cat => (
              <CategoryChip
                key={cat.id}
                cat={cat}
                count={categoryCounts[cat.id] || 0}
                active={activeCategory === cat.id}
                onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
                C={C}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MAIN CONTENT — Two-Column Layout ═══ */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px clamp(16px, 4vw, 48px) 48px' }}>

        {/* Loading State */}
        {isInitialLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} role="status" aria-label="Chargement des actualités">
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
            <p style={{ fontSize: '14px', fontWeight: 700, color: C.textSecondary, marginBottom: '6px' }}>Aucun résultat trouvé</p>
            <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '12px' }}>Aucune actualité ne correspond à votre recherche</p>
            <button onClick={() => { setActiveCategory('all'); setSearchQuery(''); }} style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}`, cursor: 'pointer',
            }}>
              View All
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
            <p style={{ fontSize: '16px', fontWeight: 700, color: C.textSecondary, marginBottom: '8px' }}>Aucune actualité disponible</p>
            <p style={{ fontSize: '13px', color: C.textMuted, marginBottom: '16px' }}>Les actualités sont mises à jour automatiquement toutes les quelques minutes</p>
            <button onClick={() => fetchFrLiveNews()} style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}`, cursor: 'pointer',
            }}>
              Actualiser
            </button>
          </div>
        )}

        {/* ═══ TWO-COLUMN LAYOUT ═══ */}
        {!isInitialLoading && filteredNews.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }}>
            {/* --- Desktop: 2fr main + 1fr sidebar --- */}
            <style>{`
              @media (min-width: 900px) {
                .news-two-col { grid-template-columns: 5fr 2fr !important; }
              }
            `}</style>
            <div className="news-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }}>

              {/* ═══ MAIN COLUMN ═══ */}
              <div>
                {/* ═══ CATEGORY VIEW (specific category selected) ═══ */}
                {isCategoryView && (
                  <section>
                    {/* Hero */}
                    {categoryViewHero && (
                      <div style={{ marginBottom: '24px' }}>
                        <HeroCard
                          news={categoryViewHero}
                          category={NEWS_CATEGORIES.find(c => c.id === activeCategory) || NEWS_CATEGORIES[0]}
                          mounted={mounted}
                          C={C}
                        />
                      </div>
                    )}
                    {/* Grid */}
                    {categoryViewGrid.length > 0 && (
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px',
                        marginBottom: '20px',
                      }}>
                        {categoryViewGrid.map(news => {
                          const catId = getNewsCategoryId(news.category);
                          const catDef = NEWS_CATEGORIES.find(c => c.id === catId);
                          return <ArticleCard key={news.id} news={news} category={catDef} mounted={mounted} C={C} />;
                        })}
                      </div>
                    )}
                    {/* Load More */}
                    {categoryViewHasMore && (
                      <div style={{ textAlign: 'center', padding: '12px 0' }}>
                        <button
                          onClick={() => setVisibleCount(prev => prev + 9)}
                          style={{
                            padding: '10px 28px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                            background: C.cyanDim, color: C.cyan,
                            border: `1px solid ${C.cyanBorder}`, cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.15)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = C.cyanDim; }}
                        >
                          Load More
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {/* ═══ ALL CATEGORIES VIEW ═══ */}
                {!isCategoryView && categoryData.map((catData) => {
                  const catDef = NEWS_CATEGORIES.find(c => c.id === catData.categoryId);
                  if (!catDef || catData.news.length === 0) return null;

                  const featured = catData.news[0];
                  const rest = catData.news.slice(1, 5);

                  return (
                    <section key={catData.categoryId} style={{ marginBottom: '36px' }}>
                      {/* Section Header */}
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
                          <h2 style={{ fontSize: '15px', fontWeight: 700, color: C.textPrimary }}>{catDef.nameEn}</h2>
                          <span style={{
                            fontSize: '9px', padding: '2px 8px', borderRadius: '4px', fontWeight: 700,
                            background: catDef.colorBg, color: catDef.color, border: `1px solid ${catDef.colorBorder}`,
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
                          }}
                        >
                          View All
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                      </div>

                      {/* Featured + Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
                        <HeroCard news={featured} category={catDef} mounted={mounted} C={C} />
                        {rest.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                            {rest.map(news => (
                              <ArticleCard key={news.id} news={news} category={catDef} mounted={mounted} C={C} />
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
                {/* AI Insights Card */}
                <AIInsightsCard allNews={allFormattedNews} C={C} />

                {/* Smart Council Widget */}
                <SmartCouncilWidget locale="fr" />

                {/* Most Read Widget */}
                <MostReadWidget locale="fr" />

                {/* Economic Calendar Widget */}
                <EconomicCalendarWidget locale="fr" />

                {/* Quick Category Stats */}
                <div style={{
                  background: C.cardBg, borderRadius: '14px',
                  border: `1px solid ${C.border}`, overflow: 'hidden',
                  padding: '16px',
                }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: C.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Répartition des actualités</h4>
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
                          <span style={{ fontSize: '10px', color: C.textMuted, fontWeight: 600, fontFamily: 'var(--font-jetbrains-mono, monospace)', minWidth: '20px', textAlign: 'start' }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>

      {/* ═══ SCROLL TO TOP ═══ */}
      <ScrollToTop C={C} />
    </main>
  );
}
