'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { lessons, financialTerms, academyCategories } from '@/data/mock-data';

export default function AcademySection() {
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [mounted, setMounted] = useState(false);
  const progressPercent = Math.round((completedLessons.length / lessons.length) * 100);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('completedLessons');
    if (saved) setCompletedLessons(JSON.parse(saved));
  }, []);

  const toggleComplete = (id: string) => {
    const updated = completedLessons.includes(id)
      ? completedLessons.filter((l) => l !== id)
      : [...completedLessons, id];
    setCompletedLessons(updated);
    localStorage.setItem('completedLessons', JSON.stringify(updated));
  };

  // Term of the day — use consistent index on server (0) and actual index on client
  const dayIndex = mounted && financialTerms.length > 0 ? Math.floor(Date.now() / 86400000) % financialTerms.length : 0;
  const todaysTerm = financialTerms.length > 0 ? financialTerms[dayIndex] : { term: '—', full: 'لا توجد بيانات', description: 'لا توجد مصطلحات مالية متاحة حالياً' };

  const levelColor = (level: string) => {
    if (level === 'مبتدئ') return { bg: 'var(--bull2)', color: 'var(--bull)' };
    if (level === 'متوسط') return { bg: 'var(--gold2)', color: 'var(--gold)' };
    return { bg: 'var(--bear2)', color: 'var(--bear)' };
  };

  const filteredLessons = selectedCategory === 'الكل'
    ? lessons
    : lessons.filter(l => l.category === selectedCategory);

  return (
    <section id="academy" className="section-block">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="section-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
          </svg>
          <h2>الأكاديمية</h2>
          <span className="badge-ai text-[10px]">LEARN</span>
        </div>

        {/* Term of the Day — Featured Card */}
        <div className="glass-card-elevated p-6 mb-6 relative overflow-hidden" style={{ borderTop: '3px solid var(--purple)' }}>
          <div className="absolute top-0 left-0 right-0 h-[100px]" style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(124,111,205,0.06), transparent)' }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="badge-ai text-[10px]">مصطلح اليوم</span>
                <span className="text-[10px]" style={{ color: 'var(--text3)' }} suppressHydrationWarning>
                  {mounted ? new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }) : '...'}
                </span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-shrink-0">
                <div className="text-3xl font-bold gradient-text font-heading">{todaysTerm.term}</div>
                <div className="text-[12px]" style={{ color: 'var(--text3)' }}>{todaysTerm.full}</div>
              </div>
              <div className="flex-1">
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text)' }}>{todaysTerm.description}</p>
              </div>
              <a href="#academy" className="badge-ai text-[11px] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
                اقرأ الشرح الكامل
              </a>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="mb-6">
          <h3 className="text-[14px] font-bold mb-3" style={{ color: 'var(--text)' }}>تصفح حسب الفئة</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {academyCategories.map((cat) => (
              <button key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className="glass-card p-3 text-center transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                style={{
                  borderTop: selectedCategory === cat.name ? `2px solid ${cat.color}` : '2px solid transparent',
                  background: selectedCategory === cat.name ? `${cat.color}08` : undefined,
                }}>
                <div className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5"
                  style={{ background: `${cat.color}18`, color: cat.color }}>
                  {cat.icon}
                </div>
                <div className="text-[12px] font-medium block" style={{ color: selectedCategory === cat.name ? cat.color : 'var(--text2)' }}>
                  {cat.name}
                </div>
                <div className="text-[10px] font-mono-price" style={{ color: 'var(--text3)' }}>
                  {cat.count} درس
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px]" style={{ color: 'var(--text2)' }}>تقدمك في الأكاديمية</span>
            <span className="font-mono-price text-[13px] font-medium" style={{ color: 'var(--cyan)' }}>{completedLessons.length} / {lessons.length} درساً</span>
          </div>
          <div className="progress-bar h-[8px]">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, var(--cyan), var(--purple))' }} />
          </div>
        </div>

        {/* Financial Terms Grid */}
        <div className="mb-8">
          <h3 className="text-[14px] font-bold mb-3" style={{ color: 'var(--text)' }}>المصطلحات المالية</h3>
          <div className="flex flex-wrap gap-2">
            {financialTerms.slice(0, 12).map((term) => (
              <span key={term.term} className="text-[11px] px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
                {term.term}
              </span>
            ))}
          </div>
        </div>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredLessons.map((lesson) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const lc = levelColor(lesson.level);
            return (
              <Link key={lesson.id} href={`/academy/lesson/${lesson.id}`} className="block">
                <div className="glass-card p-4 relative group cursor-pointer transition-all duration-300 hover:-translate-y-1">
                  {isCompleted && (
                    <div className="absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--bull)' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: lc.bg, color: lc.color }}>
                      {lesson.level}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{lesson.duration}</span>
                  </div>
                  <h3 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text)' }}>{lesson.title}</h3>
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{lesson.category}</span>

                  {/* Hover read more */}
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: 'rgba(10,14,26,0.8)', backdropFilter: 'blur(4px)' }}>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--cyan)' }}>
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                        اقرأ الدرس
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
