'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ebooks } from '@/data/mock-data';

export default function LibrarySection() {
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('الكل');

  const levels = ['الكل', 'مبتدئ', 'متوسط', 'متقدم'];
  const filteredBooks = filterLevel === 'الكل' ? ebooks : ebooks.filter(b => b.level === filterLevel);

  const levelColor = (level: string) => {
    if (level === 'مبتدئ') return { bg: 'var(--bull2)', color: 'var(--bull)' };
    if (level === 'متوسط') return { bg: 'var(--gold2)', color: 'var(--gold)' };
    return { bg: 'var(--bear2)', color: 'var(--bear)' };
  };

  return (
    <section id="library" className="section-block">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="section-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          <h2>المكتبة</h2>
          <span className="badge-exclusive text-[10px]">READ</span>
        </div>

        {/* Description */}
        <p className="text-[14px] mb-6 max-w-[600px]" style={{ color: 'var(--text2)' }}>
          مكتبة شاملة من الكتب الإلكترونية المتخصصة في التداول والتحليل المالي، من المبتدئ إلى المتقدم.
        </p>

        {/* Level Filter */}
        <div className="flex items-center gap-2 mb-6">
          {levels.map((level) => (
            <button key={level} onClick={() => setFilterLevel(level)}
              className="tab-underline text-[13px]"
              style={{ color: filterLevel === level ? 'var(--gold)' : 'var(--text3)', fontWeight: filterLevel === level ? 600 : 400 }}>
              {level}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
            {filteredBooks.length} كتاب
          </span>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredBooks.map((book) => {
            const lc = levelColor(book.level);
            const isSelected = selectedBook === book.id;
            return (
              <Link key={book.id} href={`/library/book/${book.id}`} className="block">
              <div
                className="glass-card relative group cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                style={{ borderTop: `3px solid ${book.color}` }}
                >
                
                {/* Book Cover */}
                <div className="relative h-[180px] rounded-xl mb-4 overflow-hidden flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${book.color}15, ${book.color}08)`, border: `1px solid ${book.color}20` }}>
                  {/* Book Icon */}
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={book.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                  
                  {/* Premium Badge */}
                  {book.isPremium && (
                    <div className="absolute top-2 start-2 badge-exclusive text-[9px] px-2 py-0.5">
                      PRO
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute bottom-2 end-2 text-[9px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${book.color}18`, color: book.color, border: `1px solid ${book.color}25` }}>
                    {book.category}
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: lc.bg, color: lc.color }}>
                    {book.level}
                  </span>
                  <span className="text-[10px] font-mono-price" style={{ color: 'var(--text3)' }}>
                    {book.pages} صفحة
                  </span>
                  <div className="flex items-center gap-0.5 mr-auto">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                    <span className="text-[10px] font-mono-price" style={{ color: 'var(--gold)' }}>{book.rating}</span>
                  </div>
                </div>

                <h3 className="text-[14px] font-bold mb-1 leading-tight" style={{ color: 'var(--text)' }}>
                  {book.title}
                </h3>
                <p className="text-[11px] mb-2" style={{ color: 'var(--text3)' }}>{book.author}</p>

                {/* Description on expand */}
                {isSelected && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-[12px] leading-relaxed mb-3" style={{ color: 'var(--text2)' }}>
                      {book.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono-price" style={{ color: 'var(--text3)' }}>
                        {(book.readers ?? 0).toLocaleString()} قارئ
                      </span>
                      <button className="text-[12px] font-bold px-4 py-2 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                        style={{
                          background: book.isPremium ? 'var(--gold2)' : 'var(--cyan)',
                          color: book.isPremium ? 'var(--gold)' : 'var(--bg)',
                          border: book.isPremium ? '1px solid rgba(232,160,32,0.25)' : 'none',
                        }}>
                        {book.isPremium ? 'متاح في Pro' : 'اقرأ مجاناً'}
                      </button>
                    </div>
                  </div>
                )}

              </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
