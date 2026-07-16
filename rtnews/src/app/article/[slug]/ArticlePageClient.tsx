// ─── Article Detail Page (v2 — Full Featured) ────────────────
// Architecture: ALL content is pre-fetched server-side from the DB.
// NO client-side fetching, translation, or AI analysis.
// The client component simply DISPLAYS whatever data it receives.
// If content is missing, it shows the original English content — NEVER a loading placeholder.

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BackToTop from '@/components/rouaa/BackToTop';
import { InsightCard } from '@/components/rouaa/article/InsightCard';
import { TradingInsightCard } from '@/components/rouaa/article/TradingInsightCard';
import { BullBearSection } from '@/components/rouaa/article/BullBearSection';
import { ReadingProgressBar } from '@/components/rouaa/article/ReadingProgressBar';
import { TableOfContents, type TocItem } from '@/components/rouaa/article/TableOfContents';
import { AnimatedSentimentGauge } from '@/components/rouaa/article/AnimatedSentimentGauge';
import { AffectedAssetsGrid } from '@/components/rouaa/article/AffectedAssetsGrid';
import { VolatilityIndicator } from '@/components/rouaa/article/VolatilityIndicator';
import { AnalysisTabs } from '@/components/rouaa/article/AnalysisTabs';
import { RelatedNewsGrid } from '@/components/rouaa/article/RelatedNewsGrid';
import { CommentsSection } from '@/components/rouaa/article/CommentsSection';
import { ShareBar } from '@/components/rouaa/article/ShareBar';
import { TextToSpeechBtn } from '@/components/rouaa/article/TextToSpeechBtn';
import { LanguageToggle, SideBySideContent } from '@/components/rouaa/article/LanguageToggle';
import { PrintBtn } from '@/components/rouaa/article/PrintBtn';
import { FocusMode } from '@/components/rouaa/article/FocusMode';
import { LiveUpdateBanner } from '@/components/rouaa/article/LiveUpdateBanner';
import { ReadingStats } from '@/components/rouaa/article/ReadingStats';
import { BookmarkWithFolders } from '@/components/rouaa/article/BookmarkWithFolders';
import { KeyboardShortcuts, ShortcutsHelp } from '@/components/rouaa/article/KeyboardShortcuts';
import { ParallaxHeroImage } from '@/components/rouaa/article/ParallaxHeroImage';
import { EventTimeline, buildTimelineEvents } from '@/components/rouaa/article/EventTimeline';
import { SentimentComparison } from '@/components/rouaa/article/SentimentComparison';
import { NewsChain } from '@/components/rouaa/article/NewsChain';
import { RelatedNewsFilters, type FilterType } from '@/components/rouaa/article/RelatedNewsFilters';
import { RelatedNewsTimeline } from '@/components/rouaa/article/RelatedNewsTimeline';
import { type NewsAnalysis } from '@/stores/news-store';
import { useUserStore, useUserStoreHydrated, useIsBookmarked } from '@/stores/user-store';
import { useToast } from '@/hooks/use-toast';
import { type ArticlePageData } from './page';
import Link from 'next/link';
import { sanitizeDisplayText } from '@/lib/clean-markdown';
import { SmartCouncilWidget, EconomicCalendarWidget, MostReadWidget } from '@/components/shared/SidebarWidgets';
import { SymbolLinkedText } from '@/components/news/SymbolLinkText';

// ─── Category badge config ──────────────────────────────────────
const categoryConfig: Record<string, { css: string; label: string }> = {
  'بنوك مركزية': { css: 'cat-central-banks', label: 'بنوك مركزية' },
  'سلع': { css: 'cat-metals', label: 'سلع' },
  'أسواق عربية': { css: 'cat-arab-markets', label: 'أسواق عربية' },
  'اقتصاد أمريكي': { css: 'cat-macro', label: 'اقتصاد أمريكي' },
  'أرباح شركات': { css: 'cat-earnings', label: 'أرباح' },
  'فوركس': { css: 'cat-forex', label: 'فوركس' },
  'عملات': { css: 'cat-forex', label: 'عملات' },
  'تشفير': { css: 'cat-crypto', label: 'كريبتو' },
  'كريبتو': { css: 'cat-crypto', label: 'كريبتو' },
  'نفط': { css: 'cat-oil', label: 'طاقة' },
  'طاقة': { css: 'cat-oil', label: 'طاقة' },
  'أسهم': { css: 'cat-stocks', label: 'أسهم' },
  'اقتصاد كلي': { css: 'cat-economy', label: 'اقتصاد كلي' },
  // V70: New sector categories from Four Gates system
  'رعاية صحية': { css: 'cat-stocks', label: 'رعاية صحية' },
  'تقنية': { css: 'cat-stocks', label: 'تقنية' },
  'تجزئة': { css: 'cat-stocks', label: 'تجزئة' },
  'صيدلة': { css: 'cat-stocks', label: 'صيدلة' },
  'عقارات': { css: 'cat-stocks', label: 'عقارات' },
  'بنوك': { css: 'cat-central-banks', label: 'بنوك' },
  'تأمين': { css: 'cat-stocks', label: 'تأمين' },
  'تعدين': { css: 'cat-metals', label: 'تعدين' },
  'اتصالات': { css: 'cat-stocks', label: 'اتصالات' },
  'نقل': { css: 'cat-stocks', label: 'نقل' },
  'زراعة': { css: 'cat-stocks', label: 'زراعة' },
  'تعليم': { css: 'cat-stocks', label: 'تعليم' },
  'ترفيه': { css: 'cat-stocks', label: 'ترفيه' },
  'صفقات واستحواذ': { css: 'cat-earnings', label: 'صفقات واستحواذ' },
  'أدوية': { css: 'cat-stocks', label: 'أدوية' },
  'أمن سيبراني': { css: 'cat-stocks', label: 'أمن سيبراني' },
};

// V70: Path configuration for Four Gates system
const pathConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  'A': { label: 'قابل للتداول', color: '#22c55e', bgColor: 'rgba(34,197,94,0.12)' },
  'B': { label: 'اقتصادي كلي', color: '#eab308', bgColor: 'rgba(234,179,8,0.12)' },
  'C': { label: 'معلومات شحيحة', color: '#f97316', bgColor: 'rgba(249,115,22,0.12)' },
};

// ─── BookmarkButton Component ─────────────────────────────────
function BookmarkButton({ articleId, onToggle }: { articleId: string; onToggle: () => void }) {
  const isBookmarked = useIsBookmarked(articleId);
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-[var(--bg4)]"
      style={{
        border: '1px solid var(--border)',
        color: isBookmarked ? 'var(--cyan)' : 'var(--text2)',
        background: isBookmarked ? 'var(--cyan2)' : 'transparent',
      }}
      aria-label={isBookmarked ? 'إزالة من المحفوظات' : 'إضافة إلى المحفوظات'}
    >
      {isBookmarked ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--cyan)" stroke="var(--cyan)" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
      )}
      {isBookmarked ? 'محفوظ' : 'حفظ'}
    </button>
  );
}

// ─── Hero Bookmark Button ────
function HeroBookmarkBtn({ articleId, onToggle }: { articleId: string; onToggle: () => void }) {
  const isBookmarked = useIsBookmarked(articleId);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all backdrop-blur-md"
      style={{
        border: isBookmarked ? '1px solid rgba(0,201,167,0.3)' : '1px solid rgba(255,255,255,0.12)',
        color: isBookmarked ? 'var(--cyan)' : 'rgba(255,255,255,0.7)',
        background: isBookmarked ? 'rgba(0,201,167,0.2)' : 'rgba(0,0,0,0.4)',
      }}
      aria-label={isBookmarked ? 'إزالة من المحفوظات' : 'إضافة إلى المحفوظات'}
    >
      {isBookmarked ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--cyan)" stroke="var(--cyan)" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
      )}
      {isBookmarked ? 'محفوظ' : 'حفظ'}
    </button>
  );
}

// Helper: ensure a value is always a string
function ensureString(val: any): string {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(v => typeof v === 'string' ? v : v != null ? JSON.stringify(v) : '').filter(Boolean).join('\n');
  if (val != null && typeof val === 'object') return JSON.stringify(val);
  if (val == null) return '';
  return String(val);
}

// V64: Strip Markdown from display text for clean rendering
function stripDisplayMarkdown(text: string): string {
  if (!text) return text;
  let r = text;
  r = r.replace(/^#{1,6}\s+/gm, '');
  r = r.replace(/\*\*(.+?)\*\*/g, '$1');
  r = r.replace(/__(.+?)__/g, '$1');
  r = r.replace(/\*(.+?)\*/g, '$1');
  r = r.replace(/(?<!\w)_(.+?)_(?!\w)/g, '$1');
  r = r.replace(/^[\-\*]\s+/gm, '');
  r = r.replace(/^[\-\*]{3,}\s*$/gm, '');
  r = r.replace(/`(.+?)`/g, '$1');
  r = r.replace(/\[(.+?)\]\(.+?\)/g, '$1');
  r = r.replace(/\n{3,}/g, '\n\n');
  return r.trim();
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

    // Split by sentence-ending punctuation (. ! ? ؟) followed by optional whitespace
    // and a capital letter or Arabic letter
    // V1069: \s* instead of \s+ — handles LLM output like "presión.El" (no space after period)
    const sentences = para
      .split(/(?<=[.!?؟])\s*(?=[A-ZÀ-ÿ\u0600-\u06FF\u00C0-\u017F«"])/)
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

// V65: Parse [1]-[6] structured analysis into sections for formatted display
interface AnalysisSection {
  num: number;
  title: string;
  content: string;
}

const sectionConfig: Record<number, { title: string; icon: string; color: string }> = {
  1: { title: 'ملخص الحدث', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'var(--cyan)' },
  2: { title: 'الأصول المتأثرة مباشرة', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: '#22c55e' },
  3: { title: 'الأصول المتأثرة بالتداعي', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: '#eab308' },
  4: { title: 'السياق الأوسع', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064', color: '#a78bfa' },
  5: { title: 'سيناريوهات التداول', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: '#f97316' },
  6: { title: 'توصية الخبراء', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14', color: 'var(--cyan)' },
};

function parseAnalysisSections(fullContent: string): AnalysisSection[] {
  if (!fullContent) return [];

  // Clean the content first
  const cleaned = stripDisplayMarkdown(fullContent);

  // Check if it has [1]-[6] structure (with or without spaces: [1] or [ 1 ])
  if (!/\[\s*1\s*\]/.test(cleaned)) {
    // No [1]-[6] structure — return as single section
    return [{ num: 0, title: '', content: cleaned }];
  }

  const sections: AnalysisSection[] = [];
  // Split by [N] markers (with or without spaces)
  const parts = cleaned.split(/\[\s*(\d)\s*\]/);

  // parts[0] is text before [1], then alternating: number, content
  for (let i = 1; i < parts.length; i += 2) {
    const num = parseInt(parts[i], 10);
    const content = (parts[i + 1] || '').trim();
    if (num >= 1 && num <= 6 && content) {
      // Extract the title from the first line of content
      const lines = content.split('\n');
      const firstLine = lines[0].trim();
      const config = sectionConfig[num];
      // The title is typically the first line, rest is content
      // But sometimes the title is part of the [N] heading and rest is body
      const bodyLines = lines.slice(1).join('\n').trim();
      const sectionTitle = config?.title || firstLine;
      const sectionContent = bodyLines || firstLine;
      sections.push({ num, title: sectionTitle, content: sectionContent });
    }
  }

  return sections;
}

function ensureStringArray(arr: any[]): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (typeof item === 'string') return item.trim();
    if (item != null && typeof item === 'object') {
      if (typeof item.text === 'string') return item.text.trim();
      if (typeof item.content === 'string') return item.content.trim();
      if (typeof item.value === 'string') return item.value.trim();
      if (typeof item.name === 'string') return item.name.trim();
      return JSON.stringify(item);
    }
    return item != null ? String(item).trim() : '';
  }).filter(s => s.length > 0);
}

// ── Build aiAnalysis from parsed fields ──
function buildAiAnalysis(data: ArticlePageData): NewsAnalysis | null {
  if (data.analysisSentiment || data.analysisRecommendation || data.analysisAffectedAssets) {
    return {
      summary: data.content || '', // Use fullContent as summary for overview tab
      sentiment: data.analysisSentiment || 'neutral',
      confidence: data.sentimentScore || 85,
      affectedAssets: data.analysisAffectedAssets || [],
      impactLevel: data.impactLevel || 'low',
      recommendation: data.analysisRecommendation || '',
    };
  }
  if (data.analysis && typeof data.analysis === 'object') {
    const a = data.analysis as any;
    return {
      summary: a.summary || a.fullContent || '',
      sentiment: a.sentiment || 'neutral',
      confidence: a.confidence || data.sentimentScore || 85,
      affectedAssets: a.affectedAssets || [],
      impactLevel: data.impactLevel || 'low',
      recommendation: a.recommendation || '',
    };
  }
  return null;
}

interface ArticlePageClientProps {
  initialData: ArticlePageData;
}

export default function ArticlePageClient({ initialData }: ArticlePageClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const article = initialData;
  const [mounted, setMounted] = useState(false);
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const [showArabic, setShowArabic] = useState(true);
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const ttsRef = useState<{ toggle: () => void } | null>(null);

  const contentText = article.contentAr || '';
  const contentParagraphs = contentText.split('\n').filter((p: string) => p.trim().length > 0);
  const [aiAnalysis] = useState<NewsAnalysis | null>(() => buildAiAnalysis(initialData));

  // V64: Clean content text from Markdown for display
  // V235: Also apply sanitizeDisplayText to remove garbage artifacts
  const cleanContentText = sanitizeDisplayText(stripDisplayMarkdown(contentText));

  const [relatedArticles, setRelatedArticles] = useState<
    { id: string; title: string; summary: string; score: number; category: string; slug?: string; sentiment?: string; impactLevel?: string; publishedAt?: string; imageUrl?: string }[]
  >([]);
  const [relatedFilter, setRelatedFilter] = useState<FilterType>('all');
  const [relatedCategory, setRelatedCategory] = useState('all');
  const [relatedViewMode, setRelatedViewMode] = useState<'grid' | 'timeline'>('grid');

  // ═══ ALL hooks declared BEFORE any conditional returns ═══
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function fetchRelated() {
      try {
        const searchRes = await fetch(`/api/search/semantic?q=${encodeURIComponent(article.title)}&limit=4&minScore=0.2&locale=ar`);
        const searchData = await searchRes.json();
        if (searchData.results) {
          setRelatedArticles(searchData.results
            .filter((r: any) => r.id !== article.id)
            .map((r: any) => ({
              id: r.id,
              title: r.titleAr || r.title || '',
              summary: r.summaryAr || r.summary || '',
              score: r.score || 0,
              category: r.category || '',
              slug: r.slug || r.id,
              sentiment: r.sentiment || undefined,
              impactLevel: r.impactLevel || undefined,
              publishedAt: r.publishedAt || r.fetchedAt || undefined,
              imageUrl: r.imageUrl || undefined,
            }))
          );
        }
      } catch {}
    }
    if (article.title) fetchRelated();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.title]);

  const storeHydrated = useUserStoreHydrated();

  useEffect(() => {
    if (!mounted || !storeHydrated) return;
    // Defer to avoid React #310 — store updates must not happen during render
    const timer = setTimeout(() => {
      useUserStore.getState().addToHistory({
        id: article.id, title: article.title, titleAr: article.titleAr,
        translatedTitle: article.translatedTitle, source: article.source, category: article.category,
      });
    }, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.id, mounted, storeHydrated]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.id, toast]);

  // ═══ ALL hooks above — conditional returns safe below ═══

  // NOTE: We do NOT return null when !mounted anymore.
  // Returning null caused the page to show NOTHING on SSR, and if
  // the useEffect failed to fire (e.g., due to a React #310 error
  // during hydration), the page stayed blank forever.
  // Now we always render the article content. Client-only interactive
  // features are conditionally rendered using the `mounted` flag.

  const getImpactBadge = (impact: string) => {
    if (impact === 'high') return { text: 'تأثير عالٍ', bg: 'rgba(244,63,94,0.12)', color: 'var(--bear)' };
    if (impact === 'medium') return { text: 'تأثير متوسط', bg: 'rgba(232,160,32,0.12)', color: 'var(--gold)' };
    return { text: 'تأثير منخفض', bg: 'rgba(100,116,139,0.12)', color: 'var(--neutral)' };
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return 'var(--bull)';
    if (sentiment === 'negative') return 'var(--bear)';
    return 'var(--neutral)';
  };

  const impact = getImpactBadge(article.impactLevel);
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  const displayTitle = sanitizeDisplayText(article.translatedTitle || article.titleAr || article.title);
  const displaySummary = article.translatedSummary || article.summaryAr || article.summary ? sanitizeDisplayText(article.translatedSummary || article.summaryAr || article.summary) : '';
  const readingTime = Math.max(1, Math.ceil((article.wordCount || (displaySummary?.length || 0)) / 200));
  const hasImage = !!article.imageUrl;

  const hasSourceContent = contentParagraphs.length > 0 && /[\u0600-\u06FF]/.test(contentText) && article.source !== 'رؤى' && article.source !== 'Rouaa' ;
  const hasAIContent = !!(article.introduction || article.body || article.conclusion || article.content);

  const PREVIEW_LINES = 3;
  // V70: Use sector from AI as display category (falls back to article.category)
  const displayCategory = article.sector || article.category;
  const catCfg = categoryConfig[displayCategory] || { css: 'cat-economy', label: displayCategory };
  const pathCfg = article.path ? pathConfig[article.path] : undefined;

  // V72: NEVER show raw English content as source — only Arabic content
  // If contentAr is empty or not Arabic, the source section is hidden entirely
  // There is NO fallback to English — the page only shows Arabic or AI analysis
  const displayContentTextClean = cleanContentText;

  // ── Build Table of Contents ──
  // Use stable primitive dependencies to prevent infinite re-renders
  const keyTakeawaysCount = article.keyTakeaways?.length ?? 0;
  const hasRecommendation = !!aiAnalysis?.recommendation;
  const affectedAssetsCount = aiAnalysis?.affectedAssets?.length ?? 0;
  const hasConclusion = !!article.conclusion;

  const tocItems: TocItem[] = useMemo(() => {
    const items: TocItem[] = [];
    if (hasSourceContent) items.push({ id: 'source-content', label: 'الخبر من المصدر', level: 1 });
    if (hasAIContent) {
      items.push({ id: 'ai-analysis', label: 'تحليل الذكاء الاصطناعي', level: 1 });
      if (keyTakeawaysCount > 0) items.push({ id: 'key-takeaways', label: 'النقاط الرئيسية', level: 2 });
      if (hasRecommendation) items.push({ id: 'trading-insight', label: 'توصية التداول', level: 2 });
      if (affectedAssetsCount > 0) items.push({ id: 'affected-assets', label: 'الأصول المتأثرة', level: 2 });
      if (hasConclusion) items.push({ id: 'conclusion', label: 'الخلاصة', level: 2 });
    }
    return items;
  }, [hasSourceContent, hasAIContent, keyTakeawaysCount, hasRecommendation, affectedAssetsCount, hasConclusion]);

  // ── TTS text ──
  const ttsText = [article.contentAr, article.introduction, article.body, article.conclusion].filter(Boolean).join('. ');

  // ── Current page URL ──
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  // ── Language toggle content ──
  const hasArabic = !!(article.contentAr && /[\u0600-\u06FF]/.test(article.contentAr));
  // V72: DISABLE English toggle entirely — we never want to show raw English text
  // The page is Arabic-only. English toggle was causing untranslated text to appear.
  const hasEnglish = false;
  // V64: Keep original for language detection, but display clean version
  const displayContentText = displayContentTextClean;

  // ── Analysis tab content builders ──
  // V65: Parse fullContent into [1]-[6] sections for structured display
  const analysisSections = useMemo(() => parseAnalysisSections(article.content || ''), [article.content]);

  const overviewTab = (
    <div>
      {article.content && (
        <div className="mb-6 p-5 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span className="text-[13px] font-bold" style={{ color: 'var(--cyan)' }}>ملخص التحليل</span>
          </div>
          {/* V65: Render [1]-[6] sections with proper formatting */}
          {analysisSections.length > 1 ? (
            <div className="space-y-4">
              {analysisSections.map((section) => {
                const config = sectionConfig[section.num];
                if (!config) {
                  // Fallback: render as plain paragraphs
                  return (
                    <div key={section.num}>
                      {splitIntoParagraphs(section.content).map((para: string, i: number) => (
                        <p key={i} className="mb-2 text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'rtl' }}><SymbolLinkedText text={para} /></p>
                      ))}
                    </div>
                  );
                }
                return (
                  <div key={section.num} className="p-4 rounded-xl" style={{
                    background: section.num === 5 ? 'rgba(249,115,22,0.04)' : section.num === 6 ? 'rgba(0,201,167,0.04)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid',
                    borderColor: section.num === 5 ? 'rgba(249,115,22,0.12)' : section.num === 6 ? 'rgba(0,201,167,0.12)' : 'var(--border)',
                    borderInlineStartWidth: '3px',
                    borderInlineStartColor: config.color,
                  }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${config.color}18`, color: config.color, border: `1px solid ${config.color}30` }}>
                        [{section.num}]
                      </span>
                      <span className="text-[13px] font-bold" style={{ color: config.color }}>{config.title}</span>
                    </div>
                    <div className="text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'rtl' }}>
                      {splitIntoParagraphs(section.content).map((para: string, i: number) => (
                        <p key={i} className="mb-2"><SymbolLinkedText text={para} /></p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback: no [1]-[6] structure — show as plain paragraphs */
            <div className="text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'rtl' }}>
              {splitIntoParagraphs(stripDisplayMarkdown(ensureString(article.content))).map((para: string, i: number) => (
                <p key={i} className="mb-3"><SymbolLinkedText text={para} /></p>
              ))}
            </div>
          )}
        </div>
      )}
      {article.keyTakeaways && article.keyTakeaways.length > 0 && (
        <div id="key-takeaways"><InsightCard insights={ensureStringArray(article.keyTakeaways)} /></div>
      )}
      {aiAnalysis?.recommendation && (
        <div id="trading-insight"><TradingInsightCard insight={ensureString(aiAnalysis.recommendation)} /></div>
      )}
    </div>
  );

  // V66: Extract sections for use across tabs — compute once
  const section4Content = useMemo(() => {
    const s4 = analysisSections.find(s => s.num === 4);
    return s4 ? s4.content : '';
  }, [analysisSections]);
  const section5Content = useMemo(() => {
    const s5 = analysisSections.find(s => s.num === 5);
    return s5 ? s5.content : '';
  }, [analysisSections]);
  const section6Content = useMemo(() => {
    const s6 = analysisSections.find(s => s.num === 6);
    return s6 ? s6.content : '';
  }, [analysisSections]);
  const section2Content = useMemo(() => {
    const s2 = analysisSections.find(s => s.num === 2);
    return s2 ? s2.content : '';
  }, [analysisSections]);
  const section3Content = useMemo(() => {
    const s3 = analysisSections.find(s => s.num === 3);
    return s3 ? s3.content : '';
  }, [analysisSections]);

  const detailedTab = (
    <div>
      {/* المقدمة: من حقل introduction أو من القسم [1] */}
      {article.introduction ? (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span className="text-[13px] font-bold" style={{ color: 'var(--cyan)' }}>مقدمة التحليل</span>
          </div>
          <div className="text-[16px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'rtl' }}>
            {splitIntoParagraphs(ensureString(article.introduction)).map((para: string, i: number) => (
              <p key={i} className="mb-4"><SymbolLinkedText text={para} /></p>
            ))}
          </div>
        </div>
      ) : null}

      {/* جسم التحليل: من حقل body أو من الأقسام [4]+[5] */}
      {article.body ? (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span className="text-[13px] font-bold" style={{ color: '#a78bfa' }}>التحليل المعمّق</span>
          </div>
          <div className="text-[16px] leading-[2.2] prose-article" style={{ color: 'var(--text2)', direction: 'rtl' }}>
            {splitIntoParagraphs(ensureString(article.body)).map((para: string, i: number) => (
              <p key={i} className="mb-4"><SymbolLinkedText text={para} /></p>
            ))}
          </div>
        </div>
      ) : null}

      {/* السياق الأوسع: القسم [4] — يُعرض دائماً إذا لم يكن مدمجاً في body */}
      {section4Content && !article.body && (
        <div className="mb-6 p-5 rounded-xl" style={{ background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.12)', borderInlineStart: '3px solid #a78bfa' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/></svg>
            <span className="text-[13px] font-bold" style={{ color: '#a78bfa' }}>السياق الأوسع</span>
          </div>
          <div className="text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'rtl' }}>
            {splitIntoParagraphs(section4Content).map((para: string, i: number) => (
              <p key={i} className="mb-3"><SymbolLinkedText text={para} /></p>
            ))}
          </div>
        </div>
      )}

      {/* سيناريوهات التداول: القسم [5] — يُعرض دائماً إذا لم يكن مدمجاً في body */}
      {section5Content && !article.body && (
        <div className="mb-6 p-5 rounded-xl" style={{ background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.12)', borderInlineStart: '3px solid #f97316' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            <span className="text-[13px] font-bold" style={{ color: '#f97316' }}>سيناريوهات التداول</span>
          </div>
          <div className="text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'rtl' }}>
            {splitIntoParagraphs(section5Content).map((para: string, i: number) => (
              <p key={i} className="mb-3"><SymbolLinkedText text={para} /></p>
            ))}
          </div>
        </div>
      )}

      {/* Fallback نهائي: إذا لم يوجد أي محتوى على الإطلاق */}
      {!article.introduction && !article.body && !section4Content && !section5Content && !article.content && (
        <div className="text-[14px] leading-[2] p-6 rounded-xl" style={{ color: 'var(--text3)', background: 'var(--bg4)', border: '1px solid var(--border)' }}>
          لا يتوفر تحليل مفصل لهذا المقال بعد — راجع تبويب نظرة عامة للتحليل الكامل
        </div>
      )}
    </div>
  );

  // V67: Extract assets from [2] and [3] sections for assets tab enrichment
  // Always try to extract, even if aiAnalysis.affectedAssets exists — they may be complementary
  const extractedAssetsFromSections = useMemo(() => {
    const assets: {symbol: string; name: string; direction: string; reason: string}[] = [];
    for (const secContent of [section2Content, section3Content]) {
      if (!secContent) continue;
      const lines = secContent.split('\n').filter(l => l.trim());
      for (const line of lines) {
        // Try to parse lines like: "Apple (AAPL) NASDAQ | صعودي | أرباح قياسية"
        const pipeParts = line.split('|').map(s => s.trim());
        if (pipeParts.length >= 2) {
          const namePart = pipeParts[0];
          const dirPart = pipeParts[1];
          const reasonPart = pipeParts[2] || '';
          let direction = 'neutral';
          if (/صعود|إيجاب|ارتفاع|up/i.test(dirPart)) direction = 'up';
          else if (/هبوط|سلبي|انخفاض|down/i.test(dirPart)) direction = 'down';
          if (namePart.length > 1) {
            assets.push({ symbol: namePart, name: namePart, direction, reason: reasonPart });
          }
        }
      }
    }
    return assets;
  }, [section2Content, section3Content]);

  // V67: Merged affected assets — from AI analysis + extracted from fullContent, deduplicated
  const mergedAffectedAssets = useMemo(() => {
    const aiAssets = aiAnalysis?.affectedAssets || [];
    // If AI assets exist and are rich (have reasons), prefer them but supplement with section extracts
    if (aiAssets.length > 0) {
      const existingSymbols = new Set(aiAssets.map((a: any) => String(a.symbol || a.name || '').split(' ')[0]));
      const supplemental = extractedAssetsFromSections.filter(a => !existingSymbols.has(a.symbol.split(' ')[0]));
      return [...aiAssets, ...supplemental];
    }
    return extractedAssetsFromSections;
  }, [aiAnalysis?.affectedAssets, extractedAssetsFromSections]);

  const assetsTab = (
    <div>
      {aiAnalysis && <AnimatedSentimentGauge sentiment={aiAnalysis.sentiment} confidence={aiAnalysis.confidence} size="md" />}
      {aiAnalysis && (
        <div className="mt-4">
          <SentimentComparison
            articleSentiment={aiAnalysis.sentiment}
            articleConfidence={aiAnalysis.confidence}
            marketSentiment={article.sentiment !== aiAnalysis.sentiment ? article.sentiment : undefined}
            marketConfidence={article.sentimentScore}
          />
        </div>
      )}
      <div className="mt-4"><VolatilityIndicator impactLevel={article.impactLevel} sentimentScore={article.sentimentScore} /></div>
      <div id="affected-assets" className="mt-4">
        {mergedAffectedAssets && mergedAffectedAssets.length > 0 && (
          <AffectedAssetsGrid assets={mergedAffectedAssets} />
        )}
      </div>
      {mergedAffectedAssets && mergedAffectedAssets.length > 0 && (
        <div className="mt-4">
          <BullBearSection
            bullishFactors={ensureStringArray(mergedAffectedAssets.filter((a: any) => a.direction === 'up').map((a: any) => a.reason ? `${a.symbol} ▲ — ${ensureString(a.reason)}` : `${a.symbol} ▲`))}
            bearishFactors={ensureStringArray(mergedAffectedAssets.filter((a: any) => a.direction === 'down').map((a: any) => a.reason ? `${a.symbol} ▼ — ${ensureString(a.reason)}` : `${a.symbol} ▼`))}
          />
        </div>
      )}
      {/* V67: Always show [2] and [3] section content as rich text context alongside structured assets */}
      {section2Content && (
        <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)', borderInlineStart: '3px solid #22c55e' }}>
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            <span className="text-[12px] font-bold" style={{ color: '#22c55e' }}>الأصول المتأثرة مباشرة</span>
          </div>
          <div className="text-[14px] leading-[2]" style={{ color: 'var(--text)', direction: 'rtl' }}>
            {splitIntoParagraphs(section2Content).map((para: string, i: number) => (
              <p key={i} className="mb-2"><SymbolLinkedText text={para} /></p>
            ))}
          </div>
        </div>
      )}
      {section3Content && (
        <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(234,179,8,0.04)', border: '1px solid rgba(234,179,8,0.12)', borderInlineStart: '3px solid #eab308' }}>
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            <span className="text-[12px] font-bold" style={{ color: '#eab308' }}>الأصول المتأثرة بالتداعي</span>
          </div>
          <div className="text-[14px] leading-[2]" style={{ color: 'var(--text)', direction: 'rtl' }}>
            {splitIntoParagraphs(section3Content).map((para: string, i: number) => (
              <p key={i} className="mb-2"><SymbolLinkedText text={para} /></p>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4">
        <EventTimeline events={buildTimelineEvents(article)} />
      </div>
    </div>
  );

  const recommendationsTab = (
    <div>
      {/* توصية التداول */}
      {aiAnalysis?.recommendation && (
        <div className="p-5 rounded-2xl mb-6" style={{ background: 'var(--cyan3)', border: '1px solid rgba(0,201,167,0.2)', borderInlineStartWidth: '4px', borderInlineStartColor: 'var(--cyan)' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
            <span className="text-[14px] font-bold" style={{ color: 'var(--cyan)' }}>توصية التداول</span>
          </div>
          <p className="text-[15px] leading-[1.9]" style={{ color: 'var(--text)' }}>{ensureString(aiAnalysis.recommendation)}</p>
        </div>
      )}

      {/* الخلاصة */}
      {article.conclusion ? (
        <div id="conclusion" className="p-6 rounded-2xl mb-6" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
            <span className="text-[15px] font-bold" style={{ color: 'var(--cyan)' }}>الخلاصة</span>
          </div>
          <div className="text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'rtl' }}>
            {splitIntoParagraphs(ensureString(article.conclusion)).map((para: string, i: number) => (
              <p key={i} className="mb-3"><SymbolLinkedText text={para} /></p>
            ))}
          </div>
        </div>
      ) : section6Content ? (
        /* Fallback: [6] توصية الخبراء كخلاصة */
        <div id="conclusion" className="p-6 rounded-2xl mb-6" style={{ background: 'rgba(0,201,167,0.04)', border: '1px solid rgba(0,201,167,0.12)', borderInlineStart: '4px solid var(--cyan)' }}>
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
            <span className="text-[15px] font-bold" style={{ color: 'var(--cyan)' }}>خلاصة الخبراء</span>
          </div>
          <div className="text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'rtl' }}>
            {splitIntoParagraphs(section6Content).map((para: string, i: number) => (
              <p key={i} className="mb-3"><SymbolLinkedText text={para} /></p>
            ))}
          </div>
        </div>
      ) : null}

      {/* النقاط الرئيسية */}
      {article.keyTakeaways && article.keyTakeaways.length > 0 && (
        <div className="mb-6">
          <InsightCard insights={ensureStringArray(article.keyTakeaways)} />
        </div>
      )}

      {/* Fallback نهائي */}
      {!aiAnalysis?.recommendation && !article.conclusion && !section6Content && (!article.keyTakeaways || article.keyTakeaways.length === 0) && (
        <div className="text-[14px] leading-[2] p-6 rounded-xl" style={{ color: 'var(--text3)', background: 'var(--bg4)', border: '1px solid var(--border)' }}>
          لا تتوفر توصيات لهذا المقال بعد — راجع تبويب نظرة عامة للتحليل الكامل
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>
      {mounted && <ReadingProgressBar />}
      {mounted && <LiveUpdateBanner articleId={article.id} publishedAt={article.publishedAt} updatedAt={article.updatedAt || article.publishedAt} />}
      {mounted && <KeyboardShortcuts
        onToggleTTS={() => { /* TTS toggle handled by TextToSpeechBtn */ }}
        onToggleFocus={() => setFocusMode(prev => !prev)}
        onShare={() => { if (navigator.share) navigator.share({ title: displayTitle, url: pageUrl }); else { navigator.clipboard.writeText(pageUrl); toast({ title: 'تم نسخ الرابط' }); } }}
        onBookmark={handleToggleBookmark}
        onCloseOverlays={() => { setShowShortcutsHelp(false); setFocusMode(false); }}
      />}
      {mounted && <ShortcutsHelp show={showShortcutsHelp} onClose={() => setShowShortcutsHelp(false)} />}

      {/* ═══ Breadcrumb ═══ */}
      <nav className="max-w-[860px] mx-auto px-4 pt-4" aria-label="التنقل">
        <ol className="flex items-center gap-1.5 text-[11px] flex-wrap" style={{ color: 'var(--text3)' }}>
          <li><Link href="/" className="hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text3)' }}>الرئيسية</Link></li>
          <li><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="rotate-180"><polyline points="9 18 15 12 9 6"/></svg></li>
          <li><Link href="/news" className="hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text3)' }}>الأخبار</Link></li>
          <li><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="rotate-180"><polyline points="9 18 15 12 9 6"/></svg></li>
          <li className="font-medium" style={{ color: 'var(--text2)' }} aria-current="page">{catCfg.label}</li>
        </ol>
      </nav>

      {/* ═══ Article Hero ═══ */}
      <header>
        {hasImage ? (
          <div className="relative h-[280px] md:h-[380px] lg:h-[440px] overflow-hidden">
            <ParallaxHeroImage src={article.imageUrl!} alt={displayTitle} category={displayCategory} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg) 0%, rgba(10,14,26,0.7) 40%, rgba(10,14,26,0.3) 100%)' }} />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12 max-w-[860px] mx-auto">
              <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                <span className="text-[11px] px-3 py-1.5 rounded-lg font-semibold backdrop-blur-md" style={{ background: 'rgba(0,201,167,0.2)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.25)' }}>{catCfg.label}</span>
                {pathCfg && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold backdrop-blur-md" style={{ background: pathCfg.bgColor, color: pathCfg.color, border: `1px solid ${pathCfg.color}30` }}>
                    {article.path === 'A' ? '📈' : article.path === 'B' ? '📊' : '⚠️'} {pathCfg.label}
                  </span>
                )}
                <span className="text-[11px] px-2.5 py-1 rounded-full font-medium backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.4)', color: impact.color, border: '1px solid rgba(255,255,255,0.08)' }}>{impact.text}</span>
                <span className="text-[11px] px-2.5 py-1 rounded-full font-medium backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.4)', color: getSentimentColor(article.sentiment), border: '1px solid rgba(255,255,255,0.08)' }}>
                  {article.sentiment === 'positive' ? '▲ إيجابي' : article.sentiment === 'negative' ? '▼ سلبي' : '● محايد'}
                </span>
                {article.newsType === 'breaking' && (
                  <span className="badge-breaking text-[10px] backdrop-blur-md" style={{ background: 'rgba(244,63,94,0.6)' }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>عاجل
                  </span>
                )}
                {(article.translatedTitle || article.titleAr) && article.source !== 'رؤى' && article.source !== 'Rouaa' && article.source !== 'محرر رؤى الذكي' && <span className="text-[9px] px-2 py-0.5 rounded-md font-medium backdrop-blur-md" style={{ background: 'rgba(0,201,167,0.2)', color: 'var(--cyan)' }}>مترجم</span>}
                <span className="flex-1" />
                {mounted && <BookmarkWithFolders articleId={article.id} articleTitle={displayTitle} variant="hero" onToggle={handleToggleBookmark} />}
              </div>
              <h1 className="text-[24px] md:text-[30px] lg:text-[36px] font-bold leading-tight mb-4 font-heading" style={{ color: 'white', direction: 'rtl' }}>{displayTitle || 'مقال إخباري'}</h1>
              <div className="flex flex-wrap items-center gap-4 text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                  <span suppressHydrationWarning>{mounted ? formatDate(article.publishedAt) : article.publishedAt}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <span>{readingTime} دقائق قراءة</span>
                </div>
                {article.source && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>{article.source.charAt(0)}</div>
                    <span>{article.source}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-6 pb-4 max-w-[860px] mx-auto px-4">
            <div className="flex items-center gap-2.5 mb-4 flex-wrap">
              <span className="text-[11px] px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(0,201,167,0.12)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.2)' }}>{catCfg.label}</span>
              {pathCfg && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: pathCfg.bgColor, color: pathCfg.color, border: `1px solid ${pathCfg.color}30` }}>
                  {article.path === 'A' ? '📈' : article.path === 'B' ? '📊' : '⚠️'} {pathCfg.label}
                </span>
              )}
              <span className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: impact.bg, color: impact.color }}>{impact.text}</span>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: article.sentiment === 'positive' ? 'rgba(34,197,94,0.12)' : article.sentiment === 'negative' ? 'rgba(244,63,94,0.12)' : 'rgba(100,116,139,0.12)', color: getSentimentColor(article.sentiment) }}>
                {article.sentiment === 'positive' ? '▲ إيجابي' : article.sentiment === 'negative' ? '▼ سلبي' : '● محايد'}
              </span>
              {article.newsType === 'breaking' && <span className="badge-breaking text-[10px]"><svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>عاجل</span>}
              {(article.translatedTitle || article.titleAr) && article.source !== 'رؤى' && article.source !== 'Rouaa' && article.source !== 'محرر رؤى الذكي' && <span className="text-[9px] px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(0,201,167,0.12)', color: 'var(--cyan)' }}>مترجم</span>}
            </div>
            <h1 className="text-[24px] md:text-[30px] font-bold leading-tight mb-3 font-heading" style={{ color: 'var(--text)', direction: 'rtl' }}>{displayTitle || 'مقال إخباري'}</h1>
            <div className="flex flex-wrap items-center gap-4 text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                <span suppressHydrationWarning>{mounted ? formatDate(article.publishedAt) : article.publishedAt}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                <span>{readingTime} دقائق قراءة</span>
              </div>
              {article.source && <span className="flex items-center gap-1.5">{article.source}</span>}
              <span className="flex-1" />
              {mounted && <BookmarkWithFolders articleId={article.id} articleTitle={displayTitle} onToggle={handleToggleBookmark} />}
            </div>
          </div>
        )}
      </header>

      {/* ═══ Action Bar: Share + TTS + Language + Print ═══ */}
      {mounted && <div className="max-w-[860px] mx-auto px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <ShareBar title={displayTitle} url={pageUrl} summary={displaySummary} sentiment={article.sentiment} source={article.source} variant="inline" />
          <span className="flex-1" />
          <FocusMode>{''}</FocusMode>
          <TextToSpeechBtn text={ttsText} />
          <LanguageToggle hasArabic={hasArabic} hasEnglish={hasEnglish} isArabic={showArabic} onToggle={setShowArabic} arabicContent={article.contentAr} englishContent={article.content} />
          <PrintBtn />
          <ReadingStats wordCount={article.wordCount || displaySummary?.split(/\s+/).length || 0} />
          <button
            onClick={() => setShowShortcutsHelp(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:bg-[var(--bg4)]"
            style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
            title="اختصارات لوحة المفاتيح"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/></svg>
          </button>
        </div>
      </div>}

      {/* ═══ SEO: JSON-LD ═══ */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": displayTitle,
          "description": displaySummary,
          "datePublished": article.publishedAt,
          "author": { "@type": "Organization", "name": article.source || "رؤى" },
          "publisher": { "@type": "Organization", "name": "رؤى", "logo": { "@type": "ImageObject", "url": "/favicon.svg" } },
          "inLanguage": "ar",
          ...(article.imageUrl ? { "image": article.imageUrl } : {}),
        })
      }} />

      {/* ═══ Main Content + Sidebar Layout ═══ */}
      <div className="max-w-[1360px] mx-auto px-4">
        {/* V1039 FIX: Added min-w-0 to article so it can shrink below its
            content's intrinsic width on mobile. Without this, flex items
            have implicit min-width: auto, which prevents shrinking below
            content size. On mobile, the article's content forced it to
            overflow the parent, causing horizontal scroll. */}
        <div className="flex gap-4 lg:gap-8">
          {/* ── Sidebar (TOC) — Desktop only ── */}
          <aside className="hidden lg:block w-[200px] flex-shrink-0">
            <div className="sticky top-20">
              <TableOfContents items={tocItems} />
            </div>
          </aside>

          {/* ── Main Article Content ── */}
          <article className="flex-1 max-w-[860px] min-w-0">

            {/* ═══ SECTION 1: SOURCE CONTENT ═══ */}
            <section id="source-content" className="mb-10">
              {displaySummary && (
                <div className="p-5 rounded-2xl mb-6" style={{ background: 'rgba(0,201,167,0.04)', border: '1px solid rgba(0,201,167,0.12)', borderInlineStart: '4px solid var(--cyan)' }}>
                  <p className="text-[15px] leading-[2] font-medium" style={{ color: 'var(--text)' }}>{displaySummary}</p>
                  {(article.translatedSummary || article.summaryAr) && article.source !== 'رؤى' && article.source !== 'Rouaa' && article.source !== 'محرر رؤى الذكي' && /[\u0600-\u06FF]/.test(displaySummary) && (
                    <span className="text-[9px] px-2 py-0.5 rounded-md font-medium mt-2 inline-block" style={{ background: 'rgba(0,201,167,0.12)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.2)' }}>مترجم</span>
                  )}
                </div>
              )}

              {article.isPreview && (
                <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(251,191,36,0.9)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span className="text-[13px] font-bold" style={{ color: 'rgba(251,191,36,0.95)' }}>جارٍ تجهيز التحليل الذكي</span>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(251,191,36,0.7)' }}>يتم حالياً معالجة هذا الخبر بالذكاء الاصطناعي. التحليل المفصل سيكون متاحاً قريباً.</p>
                </div>
              )}

              {/* V1069: For Rouaa original articles, show the FULL article body in a proper
                  labeled section — same visual structure as aggregated news "الخبر من المصدر"
                  including expand/collapse button */}
              {(article.source === 'رؤى' || article.source === 'Rouaa') && contentText && contentText.length > 30 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <span className="text-[12px] font-bold" style={{ color: 'var(--cyan)' }}>الخبر من المصدر</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(0,201,167,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.15)' }}>{article.sourceName || article.source}</span>
                  </div>

                  <div className="text-[16px] leading-[2.2] mb-4" style={{
                    color: 'var(--text)',
                    direction: /[\u0600-\u06FF]/.test(displayContentText) ? 'rtl' : 'ltr',
                    display: '-webkit-box',
                    WebkitLineClamp: sourceExpanded ? 'unset' : PREVIEW_LINES,
                    WebkitBoxOrient: 'vertical',
                    overflow: sourceExpanded ? 'visible' : 'hidden',
                  }}>
                    {splitIntoParagraphs(stripDisplayMarkdown(displayContentText)).map((para, i) => (
                      <p key={i} className="mb-3" dir={/[\u0600-\u06FF]/.test(para) ? 'rtl' : 'ltr'}>
                        <SymbolLinkedText text={para} />
                      </p>
                    ))}
                  </div>

                  {!sourceExpanded && displayContentText.length > 100 && (
                    <button onClick={() => setSourceExpanded(true)} className="w-full py-3.5 rounded-xl text-[14px] font-bold transition-all duration-300" style={{ background: 'rgba(0,201,167,0.06)', border: '1px solid rgba(0,201,167,0.2)', color: 'var(--cyan)' }}>
                      <span className="flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        اقرأ المزيد
                      </span>
                    </button>
                  )}
                  {sourceExpanded && (
                    <button onClick={() => setSourceExpanded(false)} className="w-full py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 mt-2" style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text3)' }}>
                      <span className="flex items-center justify-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                        عرض أقل
                      </span>
                    </button>
                  )}

                  <div className="mt-4 p-3 rounded-lg flex items-center gap-2" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    <span className="text-[11px]" style={{ color: 'var(--text3)' }}>المصدر: {article.sourceName || article.source}</span>
                  </div>
                </div>
              )}

              {/* V72: Only show source content if there's Arabic content available.
                  NEVER show raw untranslated English as "source content".
                  If contentAr is empty or English, this section is completely hidden. */}
              {hasSourceContent && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <span className="text-[12px] font-bold" style={{ color: 'var(--cyan)' }}>الخبر من المصدر</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(0,201,167,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.15)' }}>{article.sourceName || article.source}</span>
                    {/[\u0600-\u06FF]/.test(displayContentText) && article.source !== 'رؤى' && article.source !== 'Rouaa' && article.source !== 'محرر رؤى الذكي' && <span className="text-[9px] px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(0,201,167,0.12)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.2)' }}>مترجم</span>}
                  </div>

                  <div className="text-[16px] leading-[2.2] mb-4" style={{
                    color: 'var(--text)',
                    direction: /[\u0600-\u06FF]/.test(displayContentText) ? 'rtl' : 'ltr',
                    display: '-webkit-box',
                    WebkitLineClamp: sourceExpanded ? 'unset' : PREVIEW_LINES,
                    WebkitBoxOrient: 'vertical',
                    overflow: sourceExpanded ? 'visible' : 'hidden',
                  }}>
                    {splitIntoParagraphs(stripDisplayMarkdown(displayContentText)).map((para, i) => (
                      <p key={i} className="mb-3" dir={/[\u0600-\u06FF]/.test(para) ? 'rtl' : 'ltr'}>
                        <SymbolLinkedText text={para} />
                      </p>
                    ))}
                  </div>

                  {!sourceExpanded && displayContentText.length > 100 && (
                    <button onClick={() => setSourceExpanded(true)} className="w-full py-3.5 rounded-xl text-[14px] font-bold transition-all duration-300" style={{ background: 'rgba(0,201,167,0.06)', border: '1px solid rgba(0,201,167,0.2)', color: 'var(--cyan)' }}>
                      <span className="flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        اقرأ المزيد
                      </span>
                    </button>
                  )}
                  {sourceExpanded && (
                    <button onClick={() => setSourceExpanded(false)} className="w-full py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 mt-2" style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text3)' }}>
                      <span className="flex items-center justify-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                        عرض أقل
                      </span>
                    </button>
                  )}

                  <div className="mt-4 p-3 rounded-lg flex items-center gap-2" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    <span className="text-[11px]" style={{ color: 'var(--text3)' }}>المصدر: {article.sourceName || article.source}</span>
                  </div>
                </div>
              )}

              {!hasSourceContent && !article.content && !hasAIContent && article.source && (
                <div className="p-4 rounded-xl mb-6 flex items-center gap-2" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  <span className="text-[12px]" style={{ color: 'var(--text3)' }}>المصدر: {article.sourceName || article.source}</span>
                </div>
              )}

              {/* V27 FIX: REMOVED duplicate "تحليل ورؤى اقتصادية" section. */}
              {/* Previously, when hasSourceContent=false, AI analysis was shown here AND */}
              {/* again in the AnalysisTabs below — causing "نص الخبر هو نفسه التحليل" bug. */}
              {/* Now, AI analysis is shown ONLY ONCE in the AnalysisTabs section below. */}
              {/* When contentAr is populated (by pipeline Step 1.5), it shows as "الخبر من المصدر" */}
              {/* and the AI analysis shows separately in AnalysisTabs — no duplication. */}
            </section>

            {/* ═══ AI DIVIDER ═══ */}
            {hasAIContent && (
              <div id="ai-analysis" className="flex items-center gap-3 mb-8">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(124,111,205,0.08)', border: '1px solid rgba(124,111,205,0.15)' }}>
                  <span className="badge-ai text-[9px]">AI</span>
                  <span className="text-[11px] font-bold" style={{ color: 'var(--purple)' }}>تحليل الذكاء الاصطناعي</span>
                </div>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
            )}

            {/* ═══ SECTION 2: AI ANALYSIS ═══ */}
            <section className="mb-8">
              {hasAIContent ? (
                <AnalysisTabs
                  overview={overviewTab}
                  detailed={detailedTab}
                  assets={assetsTab}
                  recommendations={recommendationsTab}
                />
              ) : article.isPreview ? (
                <div className="p-6 rounded-2xl text-center" style={{ background: 'rgba(124,111,205,0.06)', border: '1px solid rgba(124,111,205,0.15)' }}>
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(124,111,205,0.12)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.5"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/></svg>
                  </div>
                  <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--purple)' }}>جارٍ تجهيز التحليل الذكي</h3>
                  <p className="text-[13px] leading-[1.8]" style={{ color: 'var(--text3)' }}>يعمل الذكاء الاصطناعي على تحليل هذا الخبر وإعداد تقرير مفصل. تحديث الصفحة بعد قليل للاطلاع على التحليل الكامل.</p>
                </div>
              ) : null}
            </section>

            {/* Disclaimer */}
            <div className="mt-6 p-4 rounded-xl text-[11px] leading-relaxed" style={{ background: 'rgba(232,160,32,0.04)', border: '1px solid rgba(232,160,32,0.12)' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>تنبيه: </span>
              <span style={{ color: 'var(--text3)' }}>هذا المحتوى يُقدم لأغراض إعلامية فقط. لا يُعتبر نصيحة استثمارية. التداول ينطوي على مخاطر عالية.</span>
            </div>
          </article>

          {/* ── Right Sidebar Widgets — Desktop only ── */}
          <aside className="hidden xl:block w-[260px] flex-shrink-0">
            <div className="sticky top-20 flex flex-col gap-5">
              <SmartCouncilWidget locale="ar" />
              <MostReadWidget locale="ar" />
              <EconomicCalendarWidget locale="ar" />
            </div>
          </aside>
        </div>
      </div>

      {/* ═══ Floating Share Bar — Desktop ═══ */}
      {mounted && <ShareBar title={displayTitle} url={pageUrl} summary={displaySummary} sentiment={article.sentiment} source={article.source} variant="floating" />}

      {/* ═══ News Chain (Ongoing Story) ═══ */}
      {mounted && relatedArticles.length >= 2 && (
        <div className="max-w-[860px] mx-auto px-4 mb-6">
          <NewsChain articles={relatedArticles} basePath="/news" currentArticleId={article.id} />
        </div>
      )}

      {/* ═══ Related Articles ═══ */}
      {relatedArticles.length > 0 && (
        <section className="py-8" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="max-w-[860px] mx-auto px-4">
            <div className="flex items-center gap-2 mb-5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <h3 className="text-[20px] font-bold font-heading" style={{ color: 'var(--text)' }}>مواضيع ذات صلة</h3>
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 mr-auto">
                <button
                  onClick={() => setRelatedViewMode('grid')}
                  className="p-1.5 rounded-md transition-all"
                  style={{
                    background: relatedViewMode === 'grid' ? 'var(--cyan2)' : 'transparent',
                    color: relatedViewMode === 'grid' ? 'var(--cyan)' : 'var(--text3)',
                    border: '1px solid ' + (relatedViewMode === 'grid' ? 'rgba(0,229,255,0.3)' : 'var(--border)'),
                  }}
                  aria-label="عرض شبكي"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </button>
                <button
                  onClick={() => setRelatedViewMode('timeline')}
                  className="p-1.5 rounded-md transition-all"
                  style={{
                    background: relatedViewMode === 'timeline' ? 'var(--cyan2)' : 'transparent',
                    color: relatedViewMode === 'timeline' ? 'var(--cyan)' : 'var(--text3)',
                    border: '1px solid ' + (relatedViewMode === 'timeline' ? 'rgba(0,229,255,0.3)' : 'var(--border)'),
                  }}
                  aria-label="عرض جدول زمني"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                </button>
              </div>
            </div>
            <RelatedNewsFilters
              categories={[...new Set(relatedArticles.map(a => a.category).filter(Boolean))]}
              activeFilter={relatedFilter}
              activeCategory={relatedCategory}
              onFilterChange={setRelatedFilter}
              onCategoryChange={setRelatedCategory}
            />
            {relatedViewMode === 'grid' ? (
              <RelatedNewsGrid articles={relatedArticles.filter(a => {
                if (relatedFilter !== 'all' && a.sentiment !== relatedFilter) return false;
                if (relatedCategory !== 'all' && a.category !== relatedCategory) return false;
                return true;
              })} basePath="/news" />
            ) : (
              <RelatedNewsTimeline articles={relatedArticles.filter(a => {
                if (relatedFilter !== 'all' && a.sentiment !== relatedFilter) return false;
                if (relatedCategory !== 'all' && a.category !== relatedCategory) return false;
                return true;
              })} basePath="/news" />
            )}
          </div>
        </section>
      )}

      {/* ═══ Comments Section ═══ */}
      {mounted && <div className="max-w-[860px] mx-auto px-4">
        <CommentsSection newsId={article.id} />
      </div>}

      <BackToTop />
    </main>
  );
}
