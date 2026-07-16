'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

/**
 * BackToTop — Floating button that appears after scrolling down 400px
 * Positioned bottom-left (logical "far" side in RTL)
 * Appears above the mobile bottom tab bar
 * Features:
 * - Shows only after scrolling 400px
 * - Smooth scroll behavior
 * - Proper aria-label for accessibility
 * - Locale-aware label (Arabic/English based on path)
 * - Matches رؤى design system (gradient, glass, glow)
 * - Keyboard accessible with focus ring
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const isEnglish = pathname.startsWith('/en');

  useEffect(() => {
    const SCROLL_THRESHOLD = 400;

    function handleScroll() {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Keyboard support: Enter/Space triggers scroll
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  }, [scrollToTop]);

  const labelText = isEnglish ? 'Back to Top' : 'العودة إلى الأعلى';

  return (
    <button
      onClick={scrollToTop}
      onKeyDown={handleKeyDown}
      aria-label={labelText}
      title={labelText}
      className="fixed z-[900] w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
        insetInlineStart: '1rem',
        background: visible
          ? 'linear-gradient(135deg, var(--cyan, #00C9A7), var(--purple, #7C6FCD))'
          : 'color-mix(in srgb, var(--bg3) 90%, transparent)',
        border: visible
          ? '1px solid rgba(0,229,255,0.2)'
          : '1px solid var(--border)',
        color: visible ? '#FFFFFF' : 'var(--text2)',
        backdropFilter: 'blur(12px)',
        boxShadow: visible
          ? '0 4px 24px rgba(0,229,255,0.2), 0 2px 8px rgba(0,0,0,0.3)'
          : '0 4px 20px rgba(0,0,0,0.3)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.9)',
        pointerEvents: visible ? 'auto' : 'none',
        outlineColor: 'var(--cyan)',
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
