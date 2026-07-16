'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ebooks } from '@/data/mock-data';

/* ── Helpers ── */
function levelBadge(level: string) {
  if (level === 'مبتدئ') return { bg: 'var(--bull2)', color: 'var(--bull)', label: 'مبتدئ' };
  if (level === 'متوسط') return { bg: 'var(--gold2)', color: 'var(--gold)', label: 'متوسط' };
  return { bg: 'var(--bear2)', color: 'var(--bear)', label: 'متقدم' };
}

/* ── Category list derived from data ── */
const CATEGORIES = ['الكل', 'AI تداول', 'تحليل فني', 'إدارة مخاطر', 'فوركس', 'كريبتو', 'أسواق عربية'];

/* ═══════════════════════════════════════════════════════════════════════
   LibraryPageClient
   ═══════════════════════════════════════════════════════════════════════ */
export default function LibraryPageClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [filterLevel, setFilterLevel] = useState<string>('الكل');
  const [expandedBook, setExpandedBook] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  /* Filter books by both category and level */
  const filteredBooks = ebooks.filter((book) => {
    const matchCategory = selectedCategory === 'الكل' || book.category === selectedCategory;
    const matchLevel = filterLevel === 'الكل' || book.level === filterLevel;
    return matchCategory && matchLevel;
  });

  const levels = ['الكل', 'مبتدئ', 'متوسط', 'متقدم'];

  return (
    <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--bg)' }}>

      <div className="pt-4">
        {/* ── Page Header ── */}
        <div className="max-w-[1280px] mx-auto px-4 mb-2" style={{ paddingInline: 'var(--space-md)' }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-heading text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-head)' }}>
              المكتبة
            </h1>
            <span className="badge-exclusive">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              اقرأ
            </span>
          </div>
          <p className="text-[14px] max-w-[600px]" style={{ color: 'var(--text-2)' }}>
            مكتبة شاملة من الكتب الإلكترونية المتخصصة في التداول والتحليل المالي، من المبتدئ إلى المتقدم.
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════
           Category filters using .tab-underline
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="فلاتر المكتبة" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            {/* Category tabs */}
            <div className="sh">
              <div className="sh-title">التصنيفات</div>
              <span className="text-[11px] font-mono-price" style={{ color: 'var(--text-3)' }}>
                {filteredBooks.length} كتاب
              </span>
            </div>

            <div className="flex items-center gap-1 mb-4 overflow-x-auto custom-scrollbar" style={{ borderBottom: '1px solid var(--rim)' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`tab-underline text-[13px] whitespace-nowrap ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Level filter tabs */}
            <div className="flex items-center gap-2 mb-6">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  className="tab-underline text-[12px]"
                  style={{
                    color: filterLevel === level ? 'var(--gold)' : undefined,
                    fontWeight: filterLevel === level ? 600 : 400,
                  }}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* ════════════════════════════════════════════════════════
               Books Grid with cover images
               ════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredBooks.map((book) => {
                const lb = levelBadge(book.level);
                const isExpanded = expandedBook === book.id;

                return (
                  <div
                    key={book.id}
                    className="glass-card relative group cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    style={{ borderTop: `3px solid ${book.color}` }}
                    onClick={() => setExpandedBook(isExpanded ? null : book.id)}
                  >
                    {/* ── Book Cover ── */}
                    <div
                      className="relative h-[180px] rounded-xl mb-4 overflow-hidden flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${book.color}15, ${book.color}08)`,
                        border: `1px solid ${book.color}20`,
                      }}
                    >
                      {/* Book SVG icon */}
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={book.color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-40"
                      >
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                      </svg>

                      {/* Premium badge */}
                      {book.isPremium && (
                        <div className="absolute top-2 start-2 badge-exclusive text-[9px] px-2 py-0.5">
                          PRO
                        </div>
                      )}

                      {/* Category badge */}
                      <div
                        className="absolute bottom-2 end-2 text-[9px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: `${book.color}18`,
                          color: book.color,
                          border: `1px solid ${book.color}25`,
                        }}
                      >
                        {book.category}
                      </div>
                    </div>

                    {/* ── Level badge + pages + rating ── */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: lb.bg, color: lb.color }}
                      >
                        {lb.label}
                      </span>
                      <span className="text-[10px] font-mono-price" style={{ color: 'var(--text-3)' }}>
                        {book.pages} صفحة
                      </span>
                      <div className="flex items-center gap-0.5 mr-auto">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                        </svg>
                        <span className="text-[10px] font-mono-price" style={{ color: 'var(--gold)' }}>{book.rating}</span>
                      </div>
                    </div>

                    {/* Title + Author */}
                    <h3 className="text-[14px] font-bold mb-1 leading-tight" style={{ color: 'var(--text-1)' }}>
                      {book.title}
                    </h3>
                    <p className="text-[11px] mb-2" style={{ color: 'var(--text-3)' }}>{book.author}</p>

                    {/* ── Expanded details ── */}
                    {isExpanded && (
                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--rim)' }}>
                        <p className="text-[12px] leading-relaxed mb-3" style={{ color: 'var(--text-2)' }}>
                          {book.description}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono-price" style={{ color: 'var(--text-3)' }}>
                            {(book.readers ?? 0).toLocaleString()} قارئ
                          </span>
                          <div className="flex items-center gap-2">
                            <button className="btn-outline text-[11px] px-3 py-1.5">
                              تحميل
                            </button>
                            <Link
                              href={`/library/book/${book.id}`}
                              className="btn-fill text-[11px] px-3 py-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {book.isPremium ? 'اقرأ في Pro' : 'اقرأ مجاناً'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {filteredBooks.length === 0 && (
              <div className="text-center py-12">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-3)"
                  strokeWidth="1.5"
                  className="mx-auto mb-3"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
                <span className="text-[13px]" style={{ color: 'var(--text-3)' }}>
                  لا توجد كتب تطابق الفلتر المحدد
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ── Reading Stats ── */}
        <section className="section-block" aria-label="إحصائيات القراءة" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">إحصائيات</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold font-mono-price gradient-text mb-1">{ebooks.length}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>كتاب متاح</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold font-mono-price" style={{ color: 'var(--bull)' }}>
                  {ebooks.filter((b) => !b.isPremium).length}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>مجاني</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold font-mono-price" style={{ color: 'var(--gold)' }}>
                  {ebooks.filter((b) => b.isPremium).length}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>حصري Pro</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold font-mono-price" style={{ color: 'var(--cyan)' }}>
                  {ebooks.reduce((sum, b) => sum + b.chapters.length, 0)}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>فصل</div>
              </div>
            </div>
          </div>
        </section>
      </div>

    </main>
  );
}
