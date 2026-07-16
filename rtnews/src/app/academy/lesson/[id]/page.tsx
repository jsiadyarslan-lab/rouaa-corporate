'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { lessons, financialTerms } from '@/data/mock-data';

// Level color helper — same logic as AcademySection
const levelColor = (level: string) => {
  if (level === 'مبتدئ') return { bg: 'var(--bull2)', color: 'var(--bull)' };
  if (level === 'متوسط') return { bg: 'var(--gold2)', color: 'var(--gold)' };
  return { bg: 'var(--bear2)', color: 'var(--bear)' };
};

// Map lesson category to related financial term keywords
const categoryTermKeywords: Record<string, string[]> = {
  'تحليل فني': ['RSI', 'MACD', 'Bollinger', 'Fibonacci', 'Volatility'],
  'تحليل أساسي': ['FOMC', 'CPI', 'NFP', 'GDP', 'DXY', 'EPS', 'P/E'],
  'إدارة مخاطر': ['Stop Loss', 'Margin', 'Leverage', 'Spread', 'Volatility'],
  'استراتيجيات': ['ETF', 'IPO', 'Leverage', 'Spread', 'Stop Loss'],
};

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('completedLessons');
    if (saved) setCompletedLessons(JSON.parse(saved));
  }, []);

  const toggleComplete = (lessonId: string) => {
    const updated = completedLessons.includes(lessonId)
      ? completedLessons.filter((l) => l !== lessonId)
      : [...completedLessons, lessonId];
    setCompletedLessons(updated);
    localStorage.setItem('completedLessons', JSON.stringify(updated));
  };

  // Find lesson by id
  const lesson = lessons.find((l) => l.id === id);
  const currentIndex = lessons.findIndex((l) => l.id === id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  // Get related terms based on lesson category
  const relatedTerms = lesson
    ? (() => {
        const keywords = categoryTermKeywords[lesson.category] || [];
        const matched = financialTerms.filter((t) =>
          keywords.some((kw) => t.term.includes(kw) || t.full.includes(kw))
        );
        // If no keyword matches, return first 4 terms as fallback
        return matched.length > 0 ? matched.slice(0, 5) : financialTerms.slice(0, 4);
      })()
    : [];

  // ─── 404: Lesson not found ─────────────────────────────
  if (!lesson) {
    return (
      <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--ink)' }}>
        <div className="max-w-[800px] mx-auto px-4 py-20 text-center">
          <div
            className="glass-card-elevated p-10"
            style={{ borderTop: '3px solid var(--bear)' }}
          >
            <div className="text-6xl mb-4">📖</div>
            <h1
              className="font-heading text-2xl font-bold mb-3"
              style={{ color: 'var(--text-head)' }}
            >
              الدرس غير موجود
            </h1>
            <p className="text-[14px] mb-6" style={{ color: 'var(--text2)' }}>
              لم نتمكن من العثور على الدرس المطلوب. ربما تم حذفه أو الرابط غير صحيح.
            </p>
            <button
              className="btn-fill text-[13px] px-5 py-2.5"
              onClick={() => router.push('/academy')}
            >
              العودة إلى الأكاديمية
            </button>
          </div>
        </div>
      </main>
    );
  }

  const content = lesson.content;
  const keyPoints = lesson.keyPoints;
  const practicalExample = lesson.practicalExample;

  const lc = levelColor(lesson.level);
  const isCompleted = mounted && completedLessons.includes(lesson.id);

  return (
    <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--ink)' }}>

      <div className="pt-4 pb-8">
        <div className="max-w-[900px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
          {/* ── Breadcrumb ──────────────────────────────── */}
          <nav className="flex items-center gap-2 text-[12px] mb-5" style={{ color: 'var(--text3)' }}>
            <button
              onClick={() => router.push('/academy')}
              className="hover:underline cursor-pointer transition-colors"
              style={{ color: 'var(--cyan)' }}
            >
              الأكاديمية
            </button>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            <span>{lesson.category}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            <span style={{ color: 'var(--text2)' }}>{lesson.title}</span>
          </nav>

          {/* ── Lesson Header Card ──────────────────────── */}
          <div
            className="glass-card-elevated p-6 md:p-8 mb-6 relative overflow-hidden"
            style={{ borderTop: `3px solid ${lc.color}` }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[120px]"
              style={{
                background: `radial-gradient(ellipse at 50% -20%, ${lc.color}10, transparent)`,
              }}
            />
            <div className="relative z-10">
              {/* Level badge + Duration */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-[11px] px-3 py-1 rounded-full font-semibold"
                  style={{ background: lc.bg, color: lc.color }}
                >
                  {lesson.level}
                </span>
                <span className="text-[12px] flex items-center gap-1.5" style={{ color: 'var(--text3)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  {lesson.duration}
                </span>
                {isCompleted && (
                  <span className="text-[11px] px-3 py-1 rounded-full font-semibold flex items-center gap-1"
                    style={{ background: 'var(--bull2)', color: 'var(--bull)' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    مكتمل
                  </span>
                )}
              </div>

              {/* Title */}
              <h1
                className="font-heading text-2xl md:text-3xl font-bold mb-2"
                style={{ color: 'var(--text-head)' }}
              >
                {lesson.title}
              </h1>

              {/* Category tag */}
              <span
                className="text-[11px] px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}
              >
                {lesson.category}
              </span>
            </div>
          </div>

          {/* ── Key Points Section ──────────────────────── */}
          {keyPoints && keyPoints.length > 0 && (
            <section className="section-block" aria-label="النقاط الرئيسية" role="region">
              <div className="glass-card p-5 md:p-6 mb-6" style={{ borderInlineStart: `3px solid var(--purple)` }}>
                <div className="flex items-center gap-2 mb-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
                  </svg>
                  <h2 className="font-heading text-[16px] font-bold" style={{ color: 'var(--text-head)' }}>
                    النقاط الرئيسية
                  </h2>
                </div>
                <ul className="space-y-2.5">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] leading-relaxed" style={{ color: 'var(--text)' }}>
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                        style={{ background: 'var(--purple2)', color: 'var(--purple)' }}
                      >
                        {i + 1}
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* ── Main Content Section ────────────────────── */}
          {content && (
            <section className="section-block" aria-label="المحتوى" role="region">
              <div className="glass-card p-5 md:p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <h2 className="font-heading text-[16px] font-bold" style={{ color: 'var(--text-head)' }}>
                    الشرح التفصيلي
                  </h2>
                </div>
                <div className="text-[14px] leading-[2] space-y-4" style={{ color: 'var(--text2)' }}>
                  {content.split('\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Practical Example Section ───────────────── */}
          {practicalExample && (
            <section className="section-block" aria-label="مثال عملي" role="region">
              <div
                className="glass-card-elevated p-5 md:p-6 mb-6 relative overflow-hidden"
                style={{ borderTop: '3px solid var(--gold)' }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[100px]"
                  style={{
                    background: 'radial-gradient(ellipse at 50% -20%, rgba(255,184,0,0.06), transparent)',
                  }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                    <h2 className="font-heading text-[16px] font-bold" style={{ color: 'var(--gold)' }}>
                      مثال عملي
                    </h2>
                  </div>
                  <p className="text-[14px] leading-[2]" style={{ color: 'var(--text)' }}>
                    {practicalExample}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ── Related Terms Section ───────────────────── */}
          {relatedTerms.length > 0 && (
            <section className="section-block" aria-label="مصطلحات ذات صلة" role="region">
              <div className="glass-card p-5 md:p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <h2 className="font-heading text-[16px] font-bold" style={{ color: 'var(--text-head)' }}>
                    مصطلحات ذات صلة
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedTerms.map((term) => (
                    <div
                      key={term.term}
                      className="p-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                      style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[12px] font-bold font-mono-price"
                          style={{ color: 'var(--cyan)' }}
                        >
                          {term.term}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                          {term.full}
                        </span>
                      </div>
                      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text2)' }}>
                        {term.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Mark as Complete Button ─────────────────── */}
          <div className="mb-6">
            <button
              onClick={() => toggleComplete(lesson.id)}
              className="w-full py-3 rounded-xl text-[14px] font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
              style={{
                background: isCompleted
                  ? 'var(--bull2)'
                  : 'linear-gradient(135deg, var(--cyan), #0EA5E9)',
                color: isCompleted ? 'var(--bull)' : 'var(--bg)',
                border: isCompleted ? '1px solid rgba(0,200,150,0.25)' : 'none',
                boxShadow: isCompleted ? 'none' : '0 4px 16px rgba(0,229,255,0.25)',
              }}
            >
              {isCompleted ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  تم الإكمال — اضغط للإلغاء
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                  تحديد كمكتمل
                </>
              )}
            </button>
          </div>

          {/* ── Previous / Next Navigation ──────────────── */}
          <div className="flex items-center justify-between gap-3 mb-8">
            {prevLesson ? (
              <button
                onClick={() => router.push(`/academy/lesson/${prevLesson.id}`)}
                className="btn-outline text-[12px] px-4 py-2.5 flex items-center gap-2 flex-1 max-w-[48%]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
                <span className="truncate">{prevLesson.title}</span>
              </button>
            ) : (
              <div className="flex-1 max-w-[48%]" />
            )}

            {nextLesson ? (
              <button
                onClick={() => router.push(`/academy/lesson/${nextLesson.id}`)}
                className="btn-fill text-[12px] px-4 py-2.5 flex items-center gap-2 flex-1 max-w-[48%] justify-end"
              >
                <span className="truncate">{nextLesson.title}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </button>
            ) : (
              <div className="flex-1 max-w-[48%]" />
            )}
          </div>

          {/* ── Back to Academy Link ────────────────────── */}
          <div className="text-center">
            <button
              onClick={() => router.push('/academy')}
              className="text-[13px] font-medium flex items-center gap-2 mx-auto cursor-pointer transition-colors"
              style={{ color: 'var(--text3)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15,18 9,12 15,6" />
              </svg>
              العودة إلى الأكاديمية
            </button>
          </div>
        </div>
      </div>

    </main>
  );
}
