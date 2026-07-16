// ─── News Article Detail Page — Bloomberg/FT-Inspired Redesign ───
// Architecture: ALL content is pre-fetched server-side from the DB.
// NO client-side fetching, translation, or AI analysis.
// The client component simply DISPLAYS whatever data it receives.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/stores/user-store';
import { useToast } from '@/hooks/use-toast';
import { type NewsArticleData } from './page';
import { formatTimeAgo, NEWS_CATEGORIES, getNewsCategoryId } from '@/lib/news-categories';
import NewsImage from '@/components/rouaa/NewsImage';
import { SmartCouncilWidget, EconomicCalendarWidget, MostReadWidget } from '@/components/shared/SidebarWidgets';
import { SymbolLinkedText } from '@/components/news/SymbolLinkText';

// ─── Color Palette ────────────────────────────────────────────────
const C = {
  navy: '#0A0E27',
  darkCard: '#0F1629',
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

// ─── Category badge config ──────────────────────────────────────
const categoryConfig: Record<string, { label: string }> = {
  'بنوك مركزية': { label: 'بنوك مركزية' },
  'سلع': { label: 'سلع' },
  'أسواق عربية': { label: 'أسواق عربية' },
  'اقتصاد أمريكي': { label: 'اقتصاد أمريكي' },
  'أرباح شركات': { label: 'أرباح' },
  'فوركس': { label: 'فوركس' },
  'عملات': { label: 'عملات' },
  'تشفير': { label: 'كريبتو' },
  'كريبتو': { label: 'كريبتو' },
  'نفط': { label: 'طاقة' },
  'طاقة': { label: 'طاقة' },
  'أسهم': { label: 'أسهم' },
  'اقتصاد كلي': { label: 'اقتصاد كلي' },
};

// ─── Font size config ────────────────────────────────────────────
const FONT_SIZES = {
  small: { label: 'صغير', base: '14px', heading: '20px', meta: '15px' },
  medium: { label: 'متوسط', base: '16px', heading: '22px', meta: '17px' },
  large: { label: 'كبير', base: '18px', heading: '24px', meta: '19px' },
};
type FontSize = keyof typeof FONT_SIZES;

// ─── Helpers ──────────────────────────────────────────────────────
function ensureString(val: any): string {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(v => typeof v === 'string' ? v : v != null ? JSON.stringify(v) : '').filter(Boolean).join('\n');
  if (val != null && typeof val === 'object') return JSON.stringify(val);
  if (val == null) return '';
  return String(val);
}

function ensureStringArray(arr: any[]): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (typeof item === 'string') return item.trim();
    if (item != null && typeof item === 'object') {
      if (typeof item.text === 'string') return item.text.trim();
      if (typeof item.content === 'string') return item.content.trim();
      return JSON.stringify(item);
    }
    return item != null ? String(item).trim() : '';
  }).filter(s => s.length > 0);
}

// V1037 FIX: Split text into readable paragraphs.
// Source article text often comes as ONE big block (no \n newlines),
// so split('\n') produces a single <p> tag with ~1000+ characters — unreadable.
// This helper splits long paragraphs by sentence boundaries.
const MAX_PARAGRAPH_LENGTH = 280;
const SENTENCES_PER_PARAGRAPH = 2;

function splitIntoParagraphs(text: string): string[] {
  if (!text) return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  const rawParagraphs = trimmed
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const result: string[] = [];
  for (const para of rawParagraphs) {
    if (para.length <= MAX_PARAGRAPH_LENGTH) {
      result.push(para);
      continue;
    }

    // Split by sentence-ending punctuation (. ! ? ؟) followed by whitespace
    // and a capital letter or Arabic letter
    const sentences = para
      .split(/(?<=[.!?؟])\s+(?=[A-ZÀ-ÿ\u0600-\u06FF\u00C0-\u017F«"])/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (sentences.length <= 1) {
      result.push(para);
      continue;
    }

    for (let i = 0; i < sentences.length; i += SENTENCES_PER_PARAGRAPH) {
      const group = sentences.slice(i, i + SENTENCES_PER_PARAGRAPH).join(' ');
      if (group.trim().length > 0) {
        result.push(group.trim());
      }
    }
  }

  return result;
}

function getSentimentColor(sentiment: string): string {
  if (sentiment === 'positive') return C.green;
  if (sentiment === 'negative') return C.red;
  return '#64748b';
}

function getSentimentLabel(sentiment: string): string {
  if (sentiment === 'positive') return 'إيجابي';
  if (sentiment === 'negative') return 'سلبي';
  return 'محايد';
}

function getImpactBadge(impact: string): { text: string; color: string; bg: string } {
  if (impact === 'high') return { text: 'تأثير عالٍ', color: C.red, bg: 'rgba(239,68,68,0.1)' };
  if (impact === 'medium') return { text: 'تأثير متوسط', color: '#eab308', bg: 'rgba(234,179,8,0.1)' };
  return { text: 'تأثير منخفض', color: C.green, bg: 'rgba(16,185,129,0.1)' };
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}

// ─── TOC Section type ─────────────────────────────────────────────
interface TocItem {
  id: string;
  label: string;
  level: number;
}

// ─── Main Client Component ──────────────────────────────────────
interface NewsSlugPageClientProps {
  initialData: NewsArticleData;
}

export default function NewsSlugPageClient({ initialData }: NewsSlugPageClientProps) {
  const { toast } = useToast();
  const article: any = initialData;
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'assets' | 'recommendation'>('overview');

  const [relatedArticles, setRelatedArticles] = useState<
    { id: string; title: string; summary: string; category: string; slug?: string; sentiment?: string; imageUrl?: string; publishedAt?: string }[]
  >([]);

  // ─── NEW STATE ────────────────────────────────────────────────
  const [readingProgress, setReadingProgress] = useState(0);
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [infographic, setInfographic] = useState<any>(null);
  const [activeTocItem, setActiveTocItem] = useState<string>('');
  const [showMobileToc, setShowMobileToc] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // ─── Reading Progress Bar ─────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      setReadingProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ─── Infographic Fetch ────────────────────────────────────────
  useEffect(() => {
    async function fetchInfographic() {
      try {
        const res: any = await fetch(`/api/infographics?limit=1&published=true`);
        const data = await res.json();
        if (data.infographics && Array.isArray(data.infographics)) {
          const match = data.infographics.find((inf: any) => inf.sourceId === article.id || inf.sourceType === 'news');
          if (match) setInfographic(match);
        }
      } catch {}
    }
    if (article.id) fetchInfographic();
  }, [article.id]);

  // ─── TOC Active Section Tracker ───────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['section-summary', 'section-source', 'section-ai-analysis', 'section-key-takeaways', 'section-infographic', 'section-conclusion'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom > 120) {
            setActiveTocItem(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function fetchRelated() {
      try {
        const searchRes: any = await fetch(`/api/search/semantic?q=${encodeURIComponent(article.title)}&limit=4&minScore=0.2&locale=ar`);
        const searchData = await searchRes.json();
        if (searchData.results) {
          setRelatedArticles(searchData.results
            .filter((r: any) => r.id !== article.id)
            .map((r: any) => ({
              id: r.id, title: r.titleAr || r.title || '',
              summary: r.summaryAr || r.summary || '', category: r.category || '',
              slug: r.slug || r.id, sentiment: r.sentiment || undefined,
              publishedAt: r.publishedAt || r.fetchedAt || undefined, imageUrl: r.imageUrl || undefined,
            }))
          );
        }
      } catch {}
    }
    if (article.title) fetchRelated();
  }, [article.title, article.id]);

  useEffect(() => {
    if (!mounted) return;
    useUserStore.getState().addToHistory({
      id: article.id, title: article.title, titleAr: article.titleAr,
      translatedTitle: article.translatedTitle, source: article.source, category: article.category,
    });
  }, [article.id, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleBookmark = useCallback(() => {
    const store = useUserStore.getState();
    if (store.isBookmarked(article.id)) {
      store.removeBookmark(article.id);
      toast({ title: 'تمت الإزالة', description: 'تمت إزالة المقال من المحفوظات' });
    } else {
      store.addBookmark({
        id: article.id, title: article.title, titleAr: article.titleAr,
        translatedTitle: article.translatedTitle, summary: article.summary,
        source: article.source, category: article.category,
        sentiment: article.sentiment, impactLevel: article.impactLevel,
        url: article.originalUrl, imageUrl: article.imageUrl,
      });
      toast({ title: 'تم الحفظ', description: 'تمت إضافة المقال إلى المحفوظات' });
    }
  }, [article.id, toast]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: article.translatedTitle || article.title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: 'تم نسخ الرابط' });
    }
  }, [article.translatedTitle, article.title, toast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const isBookmarked = useUserStore(s => s.isBookmarked(article.id));

  if (!mounted) return null;

  // Display values
  const displayTitle = article.translatedTitle || article.titleAr || article.title;
  const displaySummary = article.translatedSummary || article.summaryAr || article.summary;
  const readingTime = Math.max(1, Math.ceil((article.wordCount || (displaySummary?.length || 0)) / 200));
  const hasImage = !!article.imageUrl;
  const catCfg = categoryConfig[article.category] || { label: article.category };
  const impact = getImpactBadge(article.impactLevel);
  const catId = getNewsCategoryId(article.category);
  const catDef = NEWS_CATEGORIES.find(c => c.id === catId);

  // Content flags
  const contentText = article.contentAr || '';
  const hasSourceContent = contentText.length > 20 && /[\u0600-\u06FF]/.test(contentText) && article.source !== 'رؤى' && article.source !== 'Rouaa'  ;
  const hasAIContent = !!(article.introduction || article.body || article.conclusion || article.content);
  const keyTakeaways = ensureStringArray(article.keyTakeaways || []);

  // Build AI analysis data
  let analysisSentiment = article.analysisSentiment || '';
  let analysisRecommendation = article.analysisRecommendation || '';
  let analysisAffectedAssets = article.analysisAffectedAssets || [];
  if (!analysisSentiment && article.analysis && typeof article.analysis === 'object') {
    const a = article.analysis as any;
    analysisSentiment = a.sentiment || '';
    analysisRecommendation = a.recommendation || '';
    analysisAffectedAssets = a.affectedAssets || [];
  }
  const hasAnalysis = !!(analysisSentiment || analysisRecommendation || (analysisAffectedAssets && analysisAffectedAssets.length > 0));

  // ─── Build Tags ───────────────────────────────────────────────
  const articleTags: string[] = [];
  if (article.tags && Array.isArray(article.tags) && article.tags.length > 0) {
    articleTags.push(...article.tags.filter((t: any) => typeof t === 'string' && t.length > 0));
  }
  if (catDef) articleTags.push(catDef.nameAr);
  if (article.affectedAssets && Array.isArray(article.affectedAssets)) {
    article.affectedAssets.forEach((a: any) => {
      const sym = typeof a === 'string' ? a : a?.symbol || a?.name || '';
      if (sym && !articleTags.includes(sym)) articleTags.push(sym);
    });
  }
  if (analysisAffectedAssets && Array.isArray(analysisAffectedAssets)) {
    analysisAffectedAssets.forEach((a: any) => {
      const sym = typeof a === 'string' ? a : a?.symbol || a?.name || '';
      if (sym && !articleTags.includes(sym)) articleTags.push(sym);
    });
  }

  // ─── Build TOC ────────────────────────────────────────────────
  const tocItems: TocItem[] = [];
  if (displaySummary) tocItems.push({ id: 'section-summary', label: 'ملخص', level: 1 });
  if (hasSourceContent) tocItems.push({ id: 'section-source', label: 'الخبر من المصدر', level: 1 });
  if (hasAIContent) tocItems.push({ id: 'section-ai-analysis', label: 'تحليل الذكاء الاصطناعي', level: 1 });
  if (keyTakeaways.length > 0) tocItems.push({ id: 'section-key-takeaways', label: 'النقاط الرئيسية', level: 2 });
  if (infographic) tocItems.push({ id: 'section-infographic', label: 'إنفوغرافيك', level: 1 });
  if (article.conclusion) tocItems.push({ id: 'section-conclusion', label: 'الخلاصة', level: 1 });

  // Font size CSS variable
  const fontCfg = FONT_SIZES[fontSize];

  return (
    <main className="min-h-screen pb-16" style={{ background: C.navy }} dir="rtl">

      {/* ═══ READING PROGRESS BAR ═══ */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        height: '3px', background: 'rgba(255,255,255,0.04)',
      }}>
        <div style={{
          height: '100%', width: `${readingProgress}%`,
          background: `linear-gradient(90deg, ${C.cyan}, ${C.purple})`,
          transition: 'width 0.1s linear',
          boxShadow: `0 0 8px ${C.cyan}44`,
        }} />
      </div>

      {/* ═══ HERO ═══ */}
      <header style={{ position: 'relative' }}>
        {hasImage ? (
          <div style={{ position: 'relative', height: 'clamp(260px, 48vw, 440px)', overflow: 'hidden' }}>
            <NewsImage src={article.imageUrl} alt={displayTitle} category={article.category} style={{ width: '100%', height: '100%' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, #0A0E27 0%, rgba(10,14,39,0.8) 40%, rgba(10,14,39,0.3) 100%)',
            }} />
          </div>
        ) : (
          <div style={{
            height: '180px',
            background: `linear-gradient(135deg, ${catDef?.colorBg || '#1a1f35'}, #0A0E27)`,
          }} />
        )}

        {/* Content overlay */}
        <div style={{
          position: 'relative', marginTop: hasImage ? '-160px' : '0',
          maxWidth: '800px', marginInline: 'auto', padding: '0 clamp(16px, 4vw, 48px)',
          zIndex: 10,
        }}>
          {/* Breadcrumb */}
          <nav style={{ marginBottom: '14px' }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: C.textMuted, flexWrap: 'wrap' }}>
              <li><Link href="/" style={{ color: C.textMuted, textDecoration: 'none' }}>الرئيسية</Link></li>
              <li style={{ color: C.textMuted }}>/</li>
              <li><Link href="/news" style={{ color: C.textMuted, textDecoration: 'none' }}>الأخبار</Link></li>
              <li style={{ color: C.textMuted }}>/</li>
              <li style={{ color: C.textSecondary, fontWeight: 500 }}>{catCfg.label}</li>
            </ol>
          </nav>

          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {catDef && (
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '4px 12px', borderRadius: '6px',
                background: 'rgba(0,229,255,0.15)', color: C.cyan, border: '1px solid rgba(0,229,255,0.25)',
                backdropFilter: 'blur(8px)',
              }}>
                {catDef.icon} {catDef.nameAr}
              </span>
            )}
            <span style={{
              fontSize: '10px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px',
              background: 'rgba(0,0,0,0.4)', color: impact.color,
              border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
            }}>
              {impact.text}
            </span>
            {/* V1057: Geopolitical Impact Badge */}
            {(() => {
              const geoKeywords = ['حرب', 'صراع', 'عقوبات', 'نووي', 'عسكرية', 'غزو', 'حدود', 'مضيق', 'war', 'conflict', 'sanctions', 'nuclear', 'military', 'invasion', 'strait'];
              const text = `${displayTitle} ${displaySummary}`.toLowerCase();
              const isGeo = geoKeywords.some(kw => text.includes(kw));
              if (!isGeo) return null;
              return (
                <a href="/geopolitical-risks" style={{
                  fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                  background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
                  border: '1px solid rgba(245,158,11,0.25)', backdropFilter: 'blur(8px)',
                  textDecoration: 'none', cursor: 'pointer',
                }}>
                  ⚔️ تأثير جيوسياسي
                </a>
              );
            })()}
            <span style={{
              fontSize: '10px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px',
              background: 'rgba(0,0,0,0.4)', color: getSentimentColor(article.sentiment),
              border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
            }}>
              {article.sentiment === 'positive' ? '▲' : article.sentiment === 'negative' ? '▼' : '●'} {getSentimentLabel(article.sentiment)}
            </span>
            {article.newsType === 'breaking' && (
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                background: 'rgba(239,68,68,0.7)', color: '#fff', backdropFilter: 'blur(8px)',
              }}>عاجل</span>
            )}
            {hasAIContent && (
              <span style={{
                fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                background: 'rgba(139,92,246,0.6)', color: '#fff', backdropFilter: 'blur(8px)',
              }}>AI</span>
            )}
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 700, color: '#FFFFFF',
            lineHeight: '1.4', marginBottom: '14px', maxWidth: '700px',
          }}>
            {displayTitle || 'مقال إخباري'}
          </h1>

          {/* Meta */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
            {article.source && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '9px', fontWeight: 700,
                }}>
                  {article.source.charAt(0)}
                </div>
                <span>{article.sourceName || article.source}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
              <span suppressHydrationWarning>{formatDate(article.publishedAt)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>{readingTime} دقائق قراءة</span>
            </div>
            {/* ═══ VIEWS COUNTER ═══ */}
            {(article.views || 0) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{article.views}</span>
                <span>مشاهدة</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ ACTION BAR ═══ */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px clamp(16px, 4vw, 48px)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
          padding: '8px 0', borderBottom: `1px solid ${C.border}`,
        }}>
          {/* ═══ FONT SIZE CONTROLS ═══ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '2px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
            {(Object.keys(FONT_SIZES) as FontSize[]).map(size => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                style={{
                  padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: fontSize === size ? C.cyanDim : 'transparent',
                  color: fontSize === size ? C.cyan : C.textMuted,
                  transition: 'all 0.2s',
                }}
                title={FONT_SIZES[size].label}
              >
                {size === 'small' ? 'ص' : size === 'medium' ? 'م' : 'ك'}
              </button>
            ))}
          </div>
          <button onClick={handleShare} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
            border: `1px solid ${C.border}`, background: 'transparent', color: C.textSecondary, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.color = C.cyan; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSecondary; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            مشاركة
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: 'تم نسخ الرابط' }); }} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
            border: `1px solid ${C.border}`, background: 'transparent', color: C.textSecondary, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.color = C.cyan; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSecondary; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            نسخ الرابط
          </button>
          {/* ═══ PRINT BUTTON ═══ */}
          <button onClick={handlePrint} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
            border: `1px solid ${C.border}`, background: 'transparent', color: C.textSecondary, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.color = C.cyan; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSecondary; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            طباعة
          </button>
          {article.originalUrl && (
            <button onClick={() => window.open(article.originalUrl, '_blank')} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
              border: `1px solid ${C.border}`, background: 'transparent', color: C.textSecondary, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.color = C.cyan; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSecondary; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              المصدر
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button onClick={handleToggleBookmark} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
            border: `1px solid ${isBookmarked ? C.cyanBorder : C.border}`,
            background: isBookmarked ? C.cyanDim : 'transparent',
            color: isBookmarked ? C.cyan : C.textSecondary, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            {isBookmarked ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill={C.cyan} stroke={C.cyan} strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
            )}
            {isBookmarked ? 'محفوظ' : 'حفظ'}
          </button>
        </div>

        {/* ═══ MOBILE TOC TOGGLE ═══ */}
        {tocItems.length > 2 && (
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => setShowMobileToc(!showMobileToc)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                background: C.darkCard, border: `1px solid ${C.border}`,
                color: C.textSecondary, cursor: 'pointer',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              فهرس المقال
              <span style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: '10px', color: C.textMuted }}>({tocItems.length})</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 'auto', transform: showMobileToc ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {showMobileToc && (
              <div style={{
                marginTop: '6px', padding: '8px', borderRadius: '8px',
                background: C.darkCard, border: `1px solid ${C.border}`,
              }}>
                {tocItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      setShowMobileToc(false);
                    }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'right',
                      padding: item.level === 2 ? '6px 12px 6px 6px' : '6px',
                      fontSize: '12px', fontWeight: activeTocItem === item.id ? 700 : 500,
                      color: activeTocItem === item.id ? C.cyan : C.textSecondary,
                      background: activeTocItem === item.id ? C.cyanDim : 'transparent',
                      border: 'none', borderRadius: '6px', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ ARTICLE CONTENT WITH SIDEBAR TOC ═══ */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', paddingInline: 'clamp(16px, 4vw, 48px)', display: 'flex', gap: '24px' }}>
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        {/* ═══ DESKTOP TOC SIDEBAR ═══ */}
        {tocItems.length > 2 && (
          <div style={{
            position: 'fixed', top: '80px', right: 'max(calc((100vw - 800px) / 2 + 16px), 16px)',
            width: '160px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
            padding: '12px', borderRadius: '10px',
            background: `${C.darkCard}cc`, backdropFilter: 'blur(12px)',
            border: `1px solid ${C.border}`, zIndex: 30,
            display: 'none',
          }}
            className="hidden lg:block"
            ref={(el) => {
              if (el) {
                // Use CSS to show only on lg+ screens
                const style = document.createElement('style');
                style.textContent = `@media (min-width: 1280px) { [data-toc-sidebar] { display: block !important; } }`;
                el.setAttribute('data-toc-sidebar', '');
                if (!document.querySelector('[data-toc-style]')) {
                  style.setAttribute('data-toc-style', '');
                  document.head.appendChild(style);
                }
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              <span style={{ fontSize: '10px', fontWeight: 700, color: C.cyan, letterSpacing: '0.5px' }}>فهرس المقال</span>
            </div>
            {tocItems.map(item => (
              <button
                key={item.id}
                onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                style={{
                  display: 'block', width: '100%', textAlign: 'right',
                  padding: item.level === 2 ? '5px 10px 5px 5px' : '5px',
                  fontSize: '11px', fontWeight: activeTocItem === item.id ? 700 : 500,
                  color: activeTocItem === item.id ? C.cyan : C.textMuted,
                  background: activeTocItem === item.id ? C.cyanDim : 'transparent',
                  border: 'none', borderRadius: '4px', cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderInlineStart: activeTocItem === item.id ? `2px solid ${C.cyan}` : '2px solid transparent',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <article ref={articleRef} style={{ fontSize: fontCfg.base, transition: 'font-size 0.2s ease' }}>

          {/* Summary Box */}
          {displaySummary && (
            <div id="section-summary" style={{
              padding: '20px 24px', borderRadius: '12px', marginBottom: '32px',
              background: C.cyanDim, border: `1px solid ${C.cyanBorder}`,
              borderInlineStart: '4px solid #00E5FF',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.cyan }}>ملخص</span>
              </div>
              <p style={{ fontSize: fontCfg.meta, lineHeight: '2', color: C.textPrimary, fontWeight: 500 }}>{displaySummary}</p>
            </div>
          )}

          {/* Source Content */}
          {hasSourceContent && (
            <section id="section-source" style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '3px', height: '18px', borderRadius: '2px', background: C.cyan }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.cyan }}>الخبر من المصدر</span>
                <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '6px', background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}` }}>{article.sourceName || article.source}</span>
              </div>
              <div style={{ fontSize: fontCfg.base, lineHeight: '2.2', color: C.textPrimary }}>
                <SymbolLinkedText
                  text={contentText}
                  paragraphStyle={{ marginBottom: '14px' }}
                />
              </div>
            </section>
          )}

          {/* ═══ AI ANALYSIS SECTION ═══ */}
          {hasAIContent && (
            <section id="section-ai-analysis" style={{ marginBottom: '36px' }}>
              {/* AI Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', background: C.border }} />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 16px', borderRadius: '8px',
                  background: C.purpleDim, border: `1px solid ${C.purpleBorder}`,
                }}>
                  <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>AI</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: C.purple }}>تحليل الذكاء الاصطناعي</span>
                </div>
                <div style={{ flex: 1, height: '1px', background: C.border }} />
              </div>

              {/* AI Summary */}
              {article.content && (
                <div style={{
                  padding: '20px 24px', borderRadius: '12px', marginBottom: '20px',
                  background: C.darkCard, border: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/></svg>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.purple }}>ملخص التحليل</span>
                  </div>
                  <div style={{ fontSize: fontCfg.meta, lineHeight: '2.2', color: C.textPrimary }}>
                    {splitIntoParagraphs(ensureString(article.content)).map((para, i) => (
                      <p key={i} style={{ marginBottom: '12px' }}>
                        <SymbolLinkedText text={para} />
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Introduction */}
              {article.introduction && (
                <div style={{ fontSize: fontCfg.base, lineHeight: '2.2', marginBottom: '20px', color: C.textPrimary }}>
                  {splitIntoParagraphs(ensureString(article.introduction)).map((para, i) => (
                    <p key={i} style={{ marginBottom: '12px' }}>
                      <SymbolLinkedText text={para} />
                    </p>
                  ))}
                </div>
              )}

              {/* Body */}
              {article.body && (
                <div style={{ fontSize: fontCfg.base, lineHeight: '2.2', marginBottom: '20px', color: C.textSecondary }}>
                  {splitIntoParagraphs(ensureString(article.body)).map((para, i) => (
                    <p key={i} style={{ marginBottom: '12px' }}>
                      <SymbolLinkedText text={para} />
                    </p>
                  ))}
                </div>
              )}

              {/* Key Takeaways */}
              {keyTakeaways.length > 0 && (
                <div id="section-key-takeaways" style={{
                  padding: '20px 24px', borderRadius: '12px', marginBottom: '20px',
                  background: C.goldDim, border: `1px solid rgba(212,175,55,0.12)`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.gold }}>النقاط الرئيسية</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {keyTakeaways.map((point, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.gold, flexShrink: 0, marginTop: '10px' }} />
                        <span style={{ fontSize: '14px', lineHeight: '2', color: C.textPrimary }}>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Analysis Tabs */}
              {hasAnalysis && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'overview' as const, label: 'نظرة عامة' },
                      { id: 'analysis' as const, label: 'تحليل مفصّل' },
                      { id: 'assets' as const, label: 'الأصول المتأثرة' },
                      { id: 'recommendation' as const, label: 'توصية التداول' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                          cursor: 'pointer',
                          background: activeTab === tab.id ? C.purpleDim : 'transparent',
                          color: activeTab === tab.id ? C.purple : C.textMuted,
                          border: `1px solid ${activeTab === tab.id ? C.purpleBorder : 'transparent'}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div style={{
                    padding: '20px 24px', borderRadius: '12px',
                    background: C.darkCard, border: `1px solid ${C.border}`,
                  }}>
                    {activeTab === 'overview' && (
                      <div style={{ fontSize: fontCfg.meta, lineHeight: '1.9', color: C.textSecondary }}>
                        {article.content ? (
                          splitIntoParagraphs(ensureString(article.content)).map((para, i) => (
                            <p key={i} style={{ marginBottom: '12px' }}>
                              <SymbolLinkedText text={para} />
                            </p>
                          ))
                        ) : (
                          <p style={{ color: C.textMuted }}>جارٍ معالجة المحتوى</p>
                        )}
                      </div>
                    )}
                    {activeTab === 'analysis' && (
                      <div>
                        {analysisSentiment && (
                          <div style={{ marginBottom: '12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: C.purple }}>الاتجاه: </span>
                            <span style={{ fontSize: '13px', color: getSentimentColor(analysisSentiment), fontWeight: 600 }}>
                              {getSentimentLabel(analysisSentiment)}
                            </span>
                          </div>
                        )}
                        {article.body ? (
                          <div style={{ fontSize: fontCfg.meta, lineHeight: '1.9', color: C.textSecondary }}>
                            {splitIntoParagraphs(ensureString(article.body)).map((para, i) => (
                              <p key={i} style={{ marginBottom: '12px' }}>
                                <SymbolLinkedText text={para} />
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: C.textMuted }}>جارٍ إنشاء التحليل المفصّل</p>
                        )}
                      </div>
                    )}
                    {activeTab === 'assets' && (
                      <div>
                        {analysisAffectedAssets && analysisAffectedAssets.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {analysisAffectedAssets.map((asset: any, i: number) => {
                              const symbol = String(asset.symbol || asset.name || '');
                              const dir = String(asset.direction || 'neutral');
                              const color = dir === 'up' ? C.green : dir === 'down' ? C.red : C.textMuted;
                              const bgColor = dir === 'up' ? 'rgba(16,185,129,0.1)' : dir === 'down' ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.08)';
                              const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '●';
                              return (
                                <span key={i} style={{
                                  fontSize: '12px', padding: '6px 14px', borderRadius: '8px', fontWeight: 600,
                                  background: bgColor, color, border: `1px solid ${color}22`,
                                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                                }}>
                                  {arrow} {symbol}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={{ color: C.textMuted }}>لم يتم تحديد أصول متأثرة</p>
                        )}
                      </div>
                    )}
                    {activeTab === 'recommendation' && (
                      <div>
                        {analysisRecommendation ? (
                          <div style={{
                            padding: '16px 20px', borderRadius: '10px',
                            background: C.cyanDim, border: `1px solid ${C.cyanBorder}`,
                            borderInlineStart: '4px solid #00E5FF',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: C.cyan }}>توصية التداول</span>
                            </div>
                            <p style={{ fontSize: fontCfg.meta, lineHeight: '1.9', color: C.textPrimary }}>{ensureString(analysisRecommendation)}</p>
                          </div>
                        ) : (
                          <p style={{ color: C.textMuted }}>لا تتوفر توصية تداول</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ INFOGRAPHIC SECTION ═══ */}
              {infographic && (
                <div id="section-infographic" style={{ marginBottom: '24px' }}>
                  <div style={{
                    padding: '20px 24px', borderRadius: '12px',
                    background: `linear-gradient(135deg, ${C.purpleDim}, ${C.cyanDim})`,
                    border: `1px solid ${C.purpleBorder}`, position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
                      background: `linear-gradient(90deg, transparent, ${C.purple}, ${C.cyan}, transparent)`, opacity: 0.4,
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: C.purpleDim, border: `1px solid ${C.purpleBorder}`,
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: C.purple }}>إنفوغرافيك</span>
                          <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>INFO</span>
                        </div>
                        {infographic.title && (
                          <span style={{ fontSize: '11px', color: C.textMuted, display: 'block', marginTop: '2px' }}>{infographic.title}</span>
                        )}
                      </div>
                    </div>
                    <Link href={`/infographics/${infographic.slug || infographic.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                      <div style={{
                        borderRadius: '10px', overflow: 'hidden',
                        border: `1px solid ${C.border}`, position: 'relative',
                        maxHeight: '400px',
                      }}>
                        {infographic.thumbnailUrl ? (
                          <img
                            src={infographic.thumbnailUrl}
                            alt={infographic.title || 'إنفوغرافيك'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : infographic.slides && Array.isArray(infographic.slides) && infographic.slides.length > 0 && infographic.slides[0]?.image_url ? (
                          <img
                            src={infographic.slides[0].image_url}
                            alt={infographic.title || 'إنفوغرافيك'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <div style={{
                            height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: C.darkCard,
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="1.5" style={{ margin: '0 auto 8px' }}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                              <p style={{ fontSize: '12px', color: C.textMuted }}>عرض الإنفوغرافيك</p>
                            </div>
                          </div>
                        )}
                        {/* Overlay gradient */}
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
                          background: 'linear-gradient(to top, rgba(10,14,39,0.8), transparent)',
                        }} />
                        {/* Caption */}
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          padding: '14px 18px',
                        }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 600, color: C.cyan,
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            عرض الإنفوغرافيك التفاعلي
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {/* Conclusion */}
              {article.conclusion && (
                <div id="section-conclusion" style={{
                  padding: '20px 24px', borderRadius: '12px',
                  background: C.darkCard, border: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.purple }}>الخلاصة</span>
                  </div>
                  <div style={{ fontSize: fontCfg.meta, lineHeight: '2.2', color: C.textPrimary }}>
                    {splitIntoParagraphs(ensureString(article.conclusion)).map((para, i) => (
                      <p key={i} style={{ marginBottom: '12px' }}>
                        <SymbolLinkedText text={para} />
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ═══ TAGS / KEYWORDS SECTION ═══ */}
          {articleTags.length > 0 && (
            <div style={{
              marginBottom: '28px', padding: '16px 20px', borderRadius: '12px',
              background: C.darkCard, border: `1px solid ${C.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.gold }}>الكلمات المفتاحية</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {articleTags.slice(0, 10).map((tag, i) => (
                  <span key={i} style={{
                    fontSize: '11px', padding: '4px 12px', borderRadius: '6px', fontWeight: 600,
                    background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}`,
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{
            marginTop: '24px', padding: '14px 18px', borderRadius: '12px', fontSize: '11px', lineHeight: '1.8',
            background: C.goldDim, border: '1px solid rgba(212,175,55,0.12)', marginBottom: '36px',
          }}>
            <span style={{ color: C.gold, fontWeight: 700 }}>تنبيه: </span>
            <span style={{ color: C.textMuted }}>هذا المحتوى يُقدم لأغراض إعلامية فقط. لا يُعتبر نصيحة استثمارية. التداول ينطوي على مخاطر عالية.</span>
          </div>
        </article>
        </div>
        <aside className="hidden lg:block" style={{ width: '280px', flexShrink: 0 }}>
          <div className="sticky top-24" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SmartCouncilWidget locale="ar" />
            <MostReadWidget locale="ar" />
            <EconomicCalendarWidget locale="ar" />
          </div>
        </aside>
      </div>

      {/* ═══ NEWSLETTER CTA ═══ */}
      <div style={{ maxWidth: '600px', margin: '0 auto 36px', paddingInline: 'clamp(16px, 4vw, 48px)' }}>
        <div style={{
          padding: '24px', borderRadius: '12px',
          background: `linear-gradient(135deg, ${C.cyanDim}, ${C.purpleDim})`,
          border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
            background: `linear-gradient(90deg, transparent, ${C.cyan}, ${C.purple}, transparent)`, opacity: 0.4,
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: C.cyanDim, border: `1px solid ${C.cyanBorder}`,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: C.textPrimary }}>النشرة البريدية</h3>
              <p style={{ fontSize: '10px', color: C.textMuted }}>توصل بأهم الأخبار والتحليلات مباشرة</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="email" placeholder="بريدك الإلكتروني" style={{
              flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '12px',
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
              color: C.textPrimary, outline: 'none',
            }} />
            <button style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
              background: `linear-gradient(135deg, ${C.cyan}, #0ea5e9)`,
              color: C.navy, border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(0,229,255,0.2)',
            }}>اشتراك</button>
          </div>
        </div>
      </div>

      {/* ═══ RELATED ARTICLES ═══ */}
      {relatedArticles.length > 0 && (
        <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '32px', paddingBottom: '24px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', paddingInline: 'clamp(16px, 4vw, 48px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '3px', height: '20px', borderRadius: '2px',
                background: `linear-gradient(180deg, ${C.cyan}, ${C.purple})`,
              }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.textPrimary }}>مواضيع ذات صلة</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {relatedArticles.map((related) => {
                const relCatDef = NEWS_CATEGORIES.find(c => c.id === getNewsCategoryId(related.category));
                const relSlug = related.slug || related.id;
                return (
                  <Link key={related.id} href={`/news/${relSlug}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: C.darkCard, borderRadius: '12px', overflow: 'hidden',
                      border: `1px solid ${C.border}`, transition: 'all 0.3s ease',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {related.imageUrl && (
                        <div style={{ height: '100px', overflow: 'hidden' }}>
                          <NewsImage src={related.imageUrl} alt="" category={related.category} style={{ width: '100%', height: '100%' }} className="group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div style={{ padding: '14px' }}>
                        {relCatDef && (
                          <span style={{
                            fontSize: '9px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600,
                            background: relCatDef.colorBg, color: relCatDef.color,
                            border: `1px solid ${relCatDef.colorBorder}`, marginBottom: '8px', display: 'inline-block',
                          }}>
                            {relCatDef.nameAr}
                          </span>
                        )}
                        <h4 style={{
                          fontSize: '13px', fontWeight: 600, color: C.textPrimary, lineHeight: '1.6',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {related.title}
                        </h4>
                        {related.publishedAt && (
                          <span style={{ fontSize: '9px', color: C.textMuted, marginTop: '6px', display: 'block', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                            {formatTimeAgo(related.publishedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BACK TO NEWS ═══ */}
      <div style={{ textAlign: 'center', padding: '24px 16px' }}>
        <Link
          href="/news"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}`,
            textDecoration: 'none', transition: 'all 0.2s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          العودة لمركز الأخبار
        </Link>
      </div>
    </main>
  );
}
