'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ebooks } from '@/data/mock-data';

/* ─── helpers ─── */
const levelColor = (level: string) => {
  if (level === 'مبتدئ') return { bg: 'var(--bull2)', color: 'var(--bull)' };
  if (level === 'متوسط') return { bg: 'var(--gold2)', color: 'var(--gold)' };
  return { bg: 'var(--bear2)', color: 'var(--bear)' };
};

/* Default chapters to show when the field is not yet in the data */
const defaultChapters: { title: string; summary: string }[] = [
  { title: 'مقدمة الكتاب', summary: 'نظرة عامة على محتوى الكتاب وأهدافه وما ستتعلمه.' },
  { title: 'المفاهيم الأساسية', summary: 'تعريف المصطلحات والمفاهيم الجوهرية التي ستحتاجها.' },
  { title: 'التطبيق العملي', summary: 'أمثلة وتطبيقات عملية خطوة بخطوة.' },
  { title: 'استراتيجيات متقدمة', summary: 'تقنيات وأساليب متقدمة للمحترفين.' },
  { title: 'إدارة المخاطر', summary: 'كيفية حماية رأس المال وتقليل الخسائر.' },
  { title: 'الخلاصة والخطوات التالية', summary: 'ملخص لأهم النقاط وخارطة طريق للمتابعة.' },
];

/* ─── stars renderer ─── */
function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f${i}`} width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
      {half && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="none">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="var(--gold)" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="url(#half)" />
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.4" />
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e${i}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.3">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   BOOK DETAIL PAGE
   ═══════════════════════════════════════════ */
export default function BookDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const book = ebooks.find((b) => b.id === id);

  const [openChapter, setOpenChapter] = useState<number | null>(null);
  const [isReading, setIsReading] = useState(false);
  const chaptersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Scroll to chapter when opened
  useEffect(() => {
    if (openChapter !== null) {
      const el = document.getElementById(`chapter-${openChapter}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [openChapter]);

  /* ─── Start Reading handler ─── */
  const handleStartReading = () => {
    setIsReading(true);
    setOpenChapter(0);
    // Small delay to allow state update before scrolling
    setTimeout(() => {
      chaptersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  /* ─── 404 ─── */
  if (!book) {
    return (
      <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--ink)' }}>
        <div className="max-w-[1280px] mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="glass-card p-10 flex flex-col items-center gap-4 max-w-md">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <line x1="9" y1="10" x2="15" y2="10" />
              <line x1="9" y1="14" x2="13" y2="14" />
            </svg>
            <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>الكتاب غير موجود</h1>
            <p className="text-[14px]" style={{ color: 'var(--text2)' }}>
              عذراً، لم نتمكن من العثور على الكتاب المطلوب. ربما تم حذفه أو الرابط غير صحيح.
            </p>
            <Link href="/library" className="btn-fill mt-2">
              العودة للمكتبة
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ─── derived data ─── */
  const lc = levelColor(book.level);
  const chapters: { title: string; summary: string }[] =
    book.chapters?.length ? book.chapters : defaultChapters;

  const relatedBooks = ebooks
    .filter((b) => b.id !== book.id && (b.category === book.category || b.level === book.level))
    .slice(0, 3);

  /* If not enough related books, fill from the rest */
  if (relatedBooks.length < 3) {
    const remaining = ebooks.filter(
      (b) => b.id !== book.id && !relatedBooks.includes(b)
    );
    while (relatedBooks.length < 3 && remaining.length) {
      relatedBooks.push(remaining.shift()!);
    }
  }

  /* ══════════════════════════════════════
     RENDER
     ══════════════════════════════════════ */
  return (
    <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--ink)' }}>

      <div className="max-w-[1280px] mx-auto px-4 pt-4">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-[12px] mb-6" style={{ color: 'var(--text3)' }}>
          <Link href="/library" className="hover:underline" style={{ color: 'var(--cyan)' }}>
            المكتبة
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span style={{ color: 'var(--text2)' }}>{book.title}</span>
        </nav>

        {/* ── Book Header ── */}
        <div className="glass-card p-6 mb-6" style={{ borderTop: `3px solid ${book.color}` }}>
          <div className="flex flex-col md:flex-row gap-6">

            {/* Cover */}
            <div className="flex-shrink-0">
              <div
                className="relative w-full md:w-[220px] h-[280px] rounded-2xl overflow-hidden flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${book.color}20, ${book.color}08)`,
                  border: `1px solid ${book.color}30`,
                }}
              >
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke={book.color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>

                {/* Premium badge */}
                {book.isPremium && (
                  <div className="absolute top-3 start-3 badge-exclusive text-[10px] px-2.5 py-1">
                    PRO
                  </div>
                )}

                {/* Category badge */}
                <div
                  className="absolute bottom-3 end-3 text-[10px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: `${book.color}18`, color: book.color, border: `1px solid ${book.color}30` }}
                >
                  {book.category}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h1 className="text-[22px] md:text-[28px] font-bold leading-tight mb-2" style={{ color: 'var(--text-head)' }}>
                {book.title}
              </h1>

              {/* Author */}
              <p className="text-[14px] mb-4" style={{ color: 'var(--text2)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block me-1 -mt-0.5" style={{ color: 'var(--text3)' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {book.author}
              </p>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* Level badge */}
                <span
                  className="text-[11px] px-3 py-1 rounded-full font-semibold"
                  style={{ background: lc.bg, color: lc.color }}
                >
                  {book.level}
                </span>
                {/* Pages */}
                <span
                  className="text-[11px] px-3 py-1 rounded-full font-medium"
                  style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.15)' }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block me-1 -mt-0.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {book.pages} صفحة
                </span>
                {/* Category badge */}
                <span
                  className="text-[11px] px-3 py-1 rounded-full font-medium"
                  style={{ background: `${book.color}18`, color: book.color, border: `1px solid ${book.color}25` }}
                >
                  {book.category}
                </span>
                {/* Premium badge */}
                {book.isPremium && (
                  <span className="badge-exclusive text-[10px] px-2.5 py-1">
                    محتوى حصري
                  </span>
                )}
              </div>

              {/* Rating + Readers */}
              <div className="flex items-center gap-4 mb-5">
                <div className="flex items-center gap-1.5">
                  <Stars rating={book.rating} />
                  <span className="text-[13px] font-mono-price font-semibold" style={{ color: 'var(--gold)' }}>
                    {book.rating}
                  </span>
                </div>
                <div className="flex items-center gap-1" style={{ color: 'var(--text3)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span className="text-[12px] font-mono-price">
                    {(book.readers ?? 0).toLocaleString()} قارئ
                  </span>
                </div>
              </div>

              {/* CTA — NOW WORKS */}
              <button
                onClick={handleStartReading}
                className="btn-fill text-[14px] px-8 py-3"
                style={{
                  background: book.isPremium
                    ? 'linear-gradient(135deg, var(--gold), #FBBF24)'
                    : undefined,
                  color: book.isPremium ? 'var(--bg)' : undefined,
                  boxShadow: book.isPremium ? '0 4px 16px rgba(255,184,0,0.25)' : undefined,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block me-2 -mt-0.5">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                {book.isPremium ? 'متاح في Pro' : 'ابدأ القراءة'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="glass-card p-6 mb-6">
          <div className="section-title mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="17" y1="10" x2="3" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="17" y1="18" x2="3" y2="18" />
            </svg>
            <h2 className="text-[18px]">نبذة عن الكتاب</h2>
          </div>
          <p className="text-[14px] leading-[1.9]" style={{ color: 'var(--text2)' }}>
            {book.description}
          </p>
        </div>

        {/* ── Table of Contents / Chapters — NOW INTERACTIVE ── */}
        <div ref={chaptersRef} className="glass-card p-6 mb-6">
          <div className="section-title mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <h2 className="text-[18px]">فهرس المحتويات</h2>
            <span className="text-[11px] font-mono-price" style={{ color: 'var(--text3)' }}>
              {chapters.length} فصول
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {chapters.map((ch, idx) => {
              const isOpen = openChapter === idx;
              return (
                <div
                  key={idx}
                  id={`chapter-${idx}`}
                  className="rounded-xl transition-all duration-300"
                  style={{
                    borderBottom: idx < chapters.length - 1 ? '1px solid var(--border3)' : 'none',
                    background: isOpen ? `${book.color}08` : 'transparent',
                    border: isOpen ? `1px solid ${book.color}20` : '1px solid transparent',
                  }}
                >
                  {/* Chapter header — clickable */}
                  <button
                    onClick={() => setOpenChapter(isOpen ? null : idx)}
                    className="w-full flex items-start gap-3 p-3 text-right transition-colors duration-200 hover:bg-[var(--surface-2)]"
                  >
                    {/* Chapter number */}
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold font-mono-price"
                      style={{
                        background: isOpen ? `${book.color}25` : `${book.color}15`,
                        color: book.color,
                        border: `1px solid ${book.color}20`,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--text)' }}>
                        {ch.title}
                      </h4>
                      {!isOpen && (
                        <p className="text-[11px] leading-relaxed line-clamp-1" style={{ color: 'var(--text3)' }}>
                          {ch.summary}
                        </p>
                      )}
                    </div>
                    {/* Expand/Collapse icon */}
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="flex-shrink-0 mt-1 transition-transform duration-300"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Chapter expanded content */}
                  {isOpen && (
                    <div className="px-3 pb-4 pe-4" style={{ paddingInlineStart: '52px' }}>
                      <div
                        className="p-4 rounded-xl text-[13px] leading-[2]"
                        style={{ color: 'var(--text2)', background: `${book.color}06` }}
                      >
                        {ch.summary}
                      </div>
                      {/* Navigation between chapters */}
                      <div className="flex items-center justify-between mt-3">
                        <button
                          onClick={() => idx > 0 && setOpenChapter(idx - 1)}
                          disabled={idx === 0}
                          className="text-[12px] font-medium px-4 py-2 rounded-lg transition-all duration-200"
                          style={{
                            background: idx === 0 ? 'var(--bg4)' : `${book.color}15`,
                            color: idx === 0 ? 'var(--text3)' : book.color,
                            opacity: idx === 0 ? 0.5 : 1,
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          ← الفصل السابق
                        </button>
                        <span className="text-[11px] font-mono-price" style={{ color: 'var(--text3)' }}>
                          {idx + 1} / {chapters.length}
                        </span>
                        <button
                          onClick={() => idx < chapters.length - 1 && setOpenChapter(idx + 1)}
                          disabled={idx === chapters.length - 1}
                          className="text-[12px] font-medium px-4 py-2 rounded-lg transition-all duration-200"
                          style={{
                            background: idx === chapters.length - 1 ? 'var(--bg4)' : `${book.color}15`,
                            color: idx === chapters.length - 1 ? 'var(--text3)' : book.color,
                            opacity: idx === chapters.length - 1 ? 0.5 : 1,
                            cursor: idx === chapters.length - 1 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          الفصل التالي →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── You Might Also Like ── */}
        {relatedBooks.length > 0 && (
          <div className="section-block mb-6">
            <div className="section-title mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              <h2 className="text-[18px]">قد يعجبك أيضاً</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedBooks.map((rb) => {
                const rlc = levelColor(rb.level);
                return (
                  <Link key={rb.id} href={`/library/book/${rb.id}`} className="glass-card relative group cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden" style={{ borderTop: `3px solid ${rb.color}` }}>
                    {/* Cover */}
                    <div
                      className="relative h-[140px] rounded-xl mb-3 overflow-hidden flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${rb.color}15, ${rb.color}08)`, border: `1px solid ${rb.color}20` }}
                    >
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={rb.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                      </svg>
                      {rb.isPremium && (
                        <div className="absolute top-2 start-2 badge-exclusive text-[8px] px-1.5 py-0.5">PRO</div>
                      )}
                      <div
                        className="absolute bottom-2 end-2 text-[9px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${rb.color}18`, color: rb.color, border: `1px solid ${rb.color}25` }}
                      >
                        {rb.category}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: rlc.bg, color: rlc.color }}>
                        {rb.level}
                      </span>
                      <span className="text-[10px] font-mono-price" style={{ color: 'var(--text3)' }}>
                        {rb.pages} صفحة
                      </span>
                      <div className="flex items-center gap-0.5 mr-auto">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                        </svg>
                        <span className="text-[10px] font-mono-price" style={{ color: 'var(--gold)' }}>{rb.rating}</span>
                      </div>
                    </div>

                    <h3 className="text-[13px] font-bold mb-1 leading-tight" style={{ color: 'var(--text)' }}>
                      {rb.title}
                    </h3>
                    <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{rb.author}</p>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(10,14,26,0.7)', backdropFilter: 'blur(4px)' }}>
                      <span className="text-[12px] font-medium flex items-center gap-1" style={{ color: 'var(--gold)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        اقرأ المزيد
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </main>
  );
}
