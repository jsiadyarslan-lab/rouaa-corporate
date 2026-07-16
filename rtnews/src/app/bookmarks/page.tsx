'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, type BookmarkItem } from '@/stores/user-store';
import NewsImage from '@/components/rouaa/NewsImage';

// ─── Category Config (matching LiveNews) ─────────────────────
const categoryConfig: Record<string, { label: string; accent: string }> = {
  'بنوك مركزية': { label: 'بنوك مركزية', accent: '#A78BFA' },
  'سلع': { label: 'سلع', accent: '#FBBF24' },
  'أسواق عربية': { label: 'أسواق عربية', accent: '#00C9A7' },
  'اقتصاد أمريكي': { label: 'اقتصاد أمريكي', accent: '#FB7185' },
  'أرباح شركات': { label: 'أرباح', accent: '#E8A020' },
  'فوركس': { label: 'فوركس', accent: '#60A5FA' },
  'عملات': { label: 'عملات', accent: '#60A5FA' },
  'تشفير': { label: 'كريبتو', accent: '#A78BFA' },
  'كريبتو': { label: 'كريبتو', accent: '#A78BFA' },
  'نفط': { label: 'طاقة', accent: '#FB923C' },
  'طاقة': { label: 'طاقة', accent: '#FB923C' },
  'أسهم': { label: 'أسهم', accent: '#4ADE80' },
  'اقتصاد كلي': { label: 'اقتصاد كلي', accent: '#94A3B8' },
};

type SortMode = 'newest' | 'oldest' | 'category';

function formatSavedDate(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diff) || diff < 0) return 'الآن';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `منذ ${days} يوم`;
    return new Date(dateStr).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function getSentimentColor(sentiment: string) {
  if (sentiment === 'positive') return 'var(--bull)';
  if (sentiment === 'negative') return 'var(--bear)';
  return 'var(--neutral)';
}

function getImpactBadge(impact: string) {
  if (impact === 'high') return { text: 'تأثير عالٍ', bg: 'rgba(244,63,94,0.12)', color: 'var(--bear)' };
  if (impact === 'medium') return { text: 'متوسط', bg: 'rgba(232,160,32,0.12)', color: 'var(--gold)' };
  return { text: 'منخفض', bg: 'rgba(100,116,139,0.12)', color: 'var(--neutral)' };
}

export default function BookmarksPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const bookmarks = useUserStore((s) => s.bookmarks);
  const removeBookmark = useUserStore((s) => s.removeBookmark);

  useEffect(() => { setMounted(true); }, []);

  // Derive categories from bookmarks
  const categories = useMemo(() => {
    const cats = new Set(bookmarks.map(b => b.category).filter(Boolean));
    return ['الكل', ...Array.from(cats)];
  }, [bookmarks]);

  // Filter and sort
  const filteredBookmarks = useMemo(() => {
    let items = activeCategory === 'الكل'
      ? [...bookmarks]
      : bookmarks.filter(b => b.category === activeCategory);

    switch (sortMode) {
      case 'newest':
        items.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        break;
      case 'oldest':
        items.sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());
        break;
      case 'category':
        items.sort((a, b) => a.category.localeCompare(b.category, 'ar'));
        break;
    }
    return items;
  }, [bookmarks, activeCategory, sortMode]);

  const handleCardClick = (bookmark: BookmarkItem) => {
    const pathSegment = bookmark.slug || bookmark.id;
    if (!pathSegment || typeof pathSegment !== 'string' || pathSegment === 'undefined' || pathSegment === 'null') return;
    // Navigate to article page - all data comes from DB via slug
    router.push(`/news/${pathSegment}`);
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    removeBookmark(id);
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ═══ Page Header ═══ */}
      <section className="pt-8 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--cyan2)', border: '1px solid rgba(0,201,167,0.2)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--cyan)" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h1 className="font-heading text-[28px] font-bold" style={{ color: 'var(--text)' }}>
                المحفوظات
              </h1>
              {bookmarks.length > 0 && (
                <span className="text-[12px] px-3 py-1 rounded-full font-mono-price font-bold" style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.2)' }}>
                  {bookmarks.length}
                </span>
              )}
            </div>

            {/* Sort Options */}
            {bookmarks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: 'var(--text3)' }}>ترتيب:</span>
                <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'var(--bg4)' }}>
                  {([
                    { mode: 'newest' as SortMode, label: 'الأحدث' },
                    { mode: 'oldest' as SortMode, label: 'الأقدم' },
                    { mode: 'category' as SortMode, label: 'الفئة' },
                  ]).map(({ mode, label }) => (
                    <button key={mode} onClick={() => setSortMode(mode)}
                      className="px-3 py-1.5 rounded-md text-[11px] font-medium transition-all"
                      style={{
                        background: sortMode === mode ? 'var(--cyan2)' : 'transparent',
                        color: sortMode === mode ? 'var(--cyan)' : 'var(--text3)',
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Category Filter */}
          {categories.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
              {categories.map(cat => {
                const catCount = cat === 'الكل' ? bookmarks.length : bookmarks.filter(b => b.category === cat).length;
                return (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className="whitespace-nowrap flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full transition-all cursor-pointer flex-shrink-0"
                    style={{
                      background: activeCategory === cat ? 'var(--cyan2)' : 'var(--bg4)',
                      border: activeCategory === cat ? '1px solid rgba(0,201,167,0.3)' : '1px solid var(--border)',
                      color: activeCategory === cat ? 'var(--cyan)' : 'var(--text3)',
                      fontWeight: activeCategory === cat ? 600 : 400,
                    }}>
                    {cat}
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
                      background: activeCategory === cat ? 'rgba(0,201,167,0.15)' : 'var(--bg5)',
                      color: activeCategory === cat ? 'var(--cyan)' : 'var(--text3)',
                    }}>
                      {catCount}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══ Bookmarks Grid ═══ */}
      <section className="flex-1 py-6">
        <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md, 16px)' }}>

          {/* Empty State */}
          {bookmarks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="text-[20px] font-bold mb-2 font-heading" style={{ color: 'var(--text)' }}>لا توجد مقالات محفوظة</h3>
              <p className="text-[14px] mb-6 max-w-sm text-center" style={{ color: 'var(--text3)' }}>
                احفظ المقالات التي تهمك للرجوع إليها لاحقاً بسهولة
              </p>
              <button
                onClick={() => router.push('/news')}
                className="px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:opacity-90"
                style={{ background: 'var(--cyan)', color: 'white' }}>
                تصفح الأخبار
              </button>
            </div>
          )}

          {/* No Results After Filtering */}
          {bookmarks.length > 0 && filteredBookmarks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <span className="text-[14px] mt-3" style={{ color: 'var(--text3)' }}>لا توجد نتائج لهذه الفئة</span>
              <button onClick={() => setActiveCategory('الكل')}
                className="mt-3 px-4 py-1.5 rounded-lg text-[12px]" style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.3)' }}>
                عرض الكل
              </button>
            </div>
          )}

          {/* Bookmarks Grid */}
          {filteredBookmarks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="المقالات المحفوظة">
              {filteredBookmarks.map((bookmark) => {
                const catCfg = categoryConfig[bookmark.category] || { label: bookmark.category, accent: '#94A3B8' };
                const impact = getImpactBadge(bookmark.impactLevel);
                const displayTitle = bookmark.translatedTitle || bookmark.title;
                const hasImage = !!bookmark.imageUrl;
                return (
                  <div key={bookmark.id} role="listitem"
                    className="rounded-xl overflow-hidden cursor-pointer group transition-all duration-200 hover:border-[var(--border2)]"
                    onClick={() => handleCardClick(bookmark)}
                    style={{
                      background: 'var(--bg3)',
                      border: '1px solid var(--border)',
                      borderInlineStart: `3px solid ${catCfg.accent}`,
                    }}>

                    {/* Image — always show with gradient fallback */}
                    <div className="relative h-[120px] overflow-hidden">
                      <NewsImage
                        src={bookmark.imageUrl}
                        alt={bookmark.title || 'صورة مقال محفوظ'}
                        category={bookmark.category}
                        width={400}
                        height={120}
                        className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                        style={{ width: '100%', height: '120px' }}
                      />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg3) 0%, transparent 60%)' }} />
                    </div>

                    <div className="p-4">
                      {/* Top Row: Category + Remove */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] px-2 py-0.5 rounded font-medium" style={{
                            background: `${catCfg.accent}18`,
                            color: catCfg.accent,
                            border: `1px solid ${catCfg.accent}25`,
                          }}>
                            {catCfg.label}
                          </span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: impact.bg, color: impact.color }}>
                            {impact.text}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: getSentimentColor(bookmark.sentiment) }} />
                        </div>
                        {/* Remove Button */}
                        <button
                          onClick={(e) => handleRemove(e, bookmark.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-[var(--bear2)]"
                          style={{ color: 'var(--bear)' }}
                          aria-label="إزالة من المحفوظات">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" /><path d="M6 6 12 12 18 18" />
                          </svg>
                        </button>
                      </div>

                      {/* Title */}
                      <h3 className="text-[13px] font-bold leading-[1.6] line-clamp-2 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)' }}>
                        {displayTitle}
                      </h3>

                      {/* Summary Snippet */}
                      {bookmark.summary && (
                        <p className="text-[11px] leading-[1.6] mt-1.5 line-clamp-2" style={{ color: 'var(--text3)' }}>
                          {bookmark.summary}
                        </p>
                      )}

                      {/* Bottom Row: Source + Date Saved */}
                      <div className="flex items-center gap-2 mt-3 pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                        {bookmark.source && (
                          <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{bookmark.source}</span>
                        )}
                        <span className="w-1 h-1 rounded-full" style={{ background: 'var(--text4)' }} />
                        <span className="text-[10px] font-mono-price mr-auto" style={{ color: 'var(--text4)' }} suppressHydrationWarning>
                          {formatSavedDate(bookmark.savedAt)}
                        </span>
                        {/* Bookmark icon (filled) */}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--cyan)" stroke="var(--cyan)" strokeWidth="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
