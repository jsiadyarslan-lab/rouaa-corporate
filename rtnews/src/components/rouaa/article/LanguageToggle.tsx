// ─── Language Toggle (Enhanced) ─────────────────────────────────
// Toggle between Arabic and English content
// Features: inline translation, side-by-side view, localStorage preference
'use client';

import { useState, useEffect } from 'react';

interface LanguageToggleProps {
  hasArabic: boolean;
  hasEnglish: boolean;
  isArabic: boolean;
  onToggle: (isArabic: boolean) => void;
  arabicContent?: string;
  englishContent?: string;
  onInlineTranslate?: (paragraphIndex: number, translated: string) => void;
}

export function LanguageToggle({ hasArabic, hasEnglish, isArabic, onToggle, arabicContent, englishContent }: LanguageToggleProps) {
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [inlineTranslateIdx, setInlineTranslateIdx] = useState<number | null>(null);

  // Load preference from localStorage
  useEffect(() => {
    try {
      const pref = localStorage.getItem('rouaa-language-pref');
      if (pref === 'en' && hasEnglish) {
        onToggle(false);
      } else if (pref === 'side-by-side') {
        setShowSideBySide(true);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save preference
  const handleToggle = (val: boolean) => {
    onToggle(val);
    try {
      localStorage.setItem('rouaa-language-pref', val ? 'ar' : 'en');
    } catch {}
  };

  const toggleSideBySide = () => {
    const newVal = !showSideBySide;
    setShowSideBySide(newVal);
    try {
      localStorage.setItem('rouaa-language-pref', newVal ? 'side-by-side' : isArabic ? 'ar' : 'en');
    } catch {}
  };

  if (!hasArabic || !hasEnglish) return null;

  return (
    <div className="flex items-center gap-1" style={{ direction: 'rtl' }}>
      {/* Language toggle buttons */}
      <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <button
          onClick={() => handleToggle(true)}
          className="px-3 py-1.5 text-[11px] font-medium transition-all"
          style={{
            background: isArabic && !showSideBySide ? 'var(--cyan2)' : 'transparent',
            color: isArabic && !showSideBySide ? 'var(--cyan)' : 'var(--text3)',
            fontWeight: isArabic && !showSideBySide ? 700 : 400,
          }}
        >
          العربية
        </button>
        <button
          onClick={() => handleToggle(false)}
          className="px-3 py-1.5 text-[11px] font-medium transition-all"
          style={{
            background: !isArabic && !showSideBySide ? 'var(--cyan2)' : 'transparent',
            color: !isArabic && !showSideBySide ? 'var(--cyan)' : 'var(--text3)',
            fontWeight: !isArabic && !showSideBySide ? 700 : 400,
            borderInlineStart: '1px solid var(--border)',
          }}
        >
          English
        </button>
      </div>

      {/* Side-by-side toggle (desktop only) */}
      <button
        onClick={toggleSideBySide}
        className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all"
        style={{
          border: '1px solid var(--border)',
          color: showSideBySide ? 'var(--cyan)' : 'var(--text3)',
          background: showSideBySide ? 'var(--cyan2)' : 'transparent',
        }}
        title="عرض جنباً إلى جنب"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="12" y1="3" x2="12" y2="21"/>
        </svg>
        مقارنة
      </button>
    </div>
  );
}

// ── Side-by-Side Content View ──
export function SideBySideContent({ arabic, english }: { arabic: string; english: string }) {
  const arabicParagraphs = arabic.split('\n').filter(p => p.trim());
  const englishParagraphs = english.split('\n').filter(p => p.trim());
  const maxLen = Math.max(arabicParagraphs.length, englishParagraphs.length);

  return (
    <div className="grid grid-cols-2 gap-6" style={{ direction: 'rtl' }}>
      {/* Arabic column */}
      <div>
        <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>العربية</span>
        </div>
        <div className="text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'rtl' }}>
          {arabicParagraphs.map((p, i) => <p key={i} className="mb-3">{p}</p>)}
        </div>
      </div>
      {/* English column */}
      <div>
        <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold" style={{ background: 'var(--purple2)', color: 'var(--purple)' }}>English</span>
        </div>
        <div className="text-[15px] leading-[1.8]" style={{ color: 'var(--text2)', direction: 'ltr' }}>
          {englishParagraphs.map((p, i) => <p key={i} className="mb-3">{p}</p>)}
        </div>
      </div>
    </div>
  );
}
