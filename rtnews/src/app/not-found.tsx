'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Custom 404 page — Client-side locale detection
 * Detects locale from window.location.pathname (/en/* = English)
 * More reliable than server-side headers for 404 pages.
 */

const popularPagesAr = [
  { href: '/', label: 'الرئيسية', color: 'var(--cyan)', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22 9 12 15 12 15 22' },
  { href: '/news', label: 'الأخبار', color: 'var(--bull)', icon: 'M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2' },
  { href: '/markets', label: 'الأسواق', color: 'var(--gold)', icon: 'M2 20h20 M5 20V10 M10 20V4 M15 20v-8 M20 20v-4' },
  { href: '/calendar', label: 'الأجندة', color: 'var(--purple)', icon: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18' },
];

const popularPagesEn = [
  { href: '/en', label: 'Home', color: 'var(--cyan)', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22 9 12 15 12 15 22' },
  { href: '/en/news', label: 'News', color: 'var(--bull)', icon: 'M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2' },
  { href: '/en/markets', label: 'Markets', color: 'var(--gold)', icon: 'M2 20h20 M5 20V10 M10 20V4 M15 20v-8 M20 20v-4' },
  { href: '/en/calendar', label: 'Calendar', color: 'var(--purple)', icon: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18' },
  { href: '/en/signals', label: 'Signals', color: 'var(--bull)', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { href: '/en/reports', label: 'Reports', color: 'var(--cyan)', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
];

export default function NotFound() {
  const [isEn, setIsEn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // V271: Detect locale from URL pathname — most reliable for 404s
    const path = window.location.pathname;
    setIsEn(path === '/en' || path.startsWith('/en/'));
    setMounted(true);
  }, []);

  const dir = isEn ? 'ltr' : 'rtl';
  const popularPages = isEn ? popularPagesEn : popularPagesAr;

  // Show nothing until client-side detection completes
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="skeleton" style={{ width: '200px', height: '40px', margin: '0 auto 16px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" dir={dir} style={{ background: 'var(--bg)' }}>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.04) 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative w-full max-w-[520px] text-center">
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'color-mix(in srgb, var(--bg3) 95%, transparent)',
              border: '1px solid var(--border)',
              boxShadow: '0 0 60px rgba(244,63,94,0.04), 0 25px 50px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Brand logo */}
            <div className="flex items-center justify-center gap-2 mb-5">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="rgba(0,229,255,0.1)" />
                <polyline points="4,20 10,12 16,16 24,6" stroke="url(#404-grad-locale)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="24" cy="6" r="2.5" fill="var(--cyan)" />
                <defs>
                  <linearGradient id="404-grad-locale" x1="4" y1="20" x2="24" y2="6">
                    <stop offset="0%" stopColor="#00E5FF" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-[20px] font-bold gradient-text font-heading">
                {isEn ? 'Rouaa' : 'رؤى'}
              </span>
            </div>

            {/* Error Icon */}
            <div className="flex items-center justify-center mb-5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </div>
            </div>

            {/* 404 Number */}
            <div className="relative mb-5">
              <span
                className="font-mono text-[90px] md:text-[120px] font-bold leading-none"
                style={{
                  background: 'linear-gradient(135deg, var(--bear) 0%, var(--purple) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  opacity: 0.25,
                }}
              >
                404
              </span>
            </div>

            {/* Message */}
            <h1 className="text-[18px] font-bold mb-2" style={{ color: 'var(--text)' }}>
              {isEn ? 'Page Not Found' : 'لا يمكن العثور على الصفحة'}
            </h1>
            <p className="text-[13px] leading-relaxed mb-5" style={{ color: 'var(--text3)' }}>
              {isEn
                ? 'The link you are trying to open seems incorrect or has been removed. Please check the link and try again.'
                : 'يبدو أن الرابط الذي تحاول فتحه غير صحيح أو تمت إزالته. تأكد من أن الرابط صحيح ثم حاول مرة أخرى.'
              }
            </p>

            {/* Search link */}
            <div className="mb-5">
              <Link
                href={isEn ? '/en/news' : '/news'}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'var(--bg4)',
                  border: '1px solid var(--border)',
                  color: 'var(--cyan)',
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {isEn ? 'Search News & Reports' : 'بحث في الأخبار والتقارير'}
              </Link>
            </div>

            {/* Popular Pages */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
              {popularPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[12px] font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: 'var(--bg4)',
                    border: '1px solid var(--border)',
                    color: page.color,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={page.icon} />
                  </svg>
                  {page.label}
                </Link>
              ))}
            </div>

            {/* Back Button */}
            <Link
              href={isEn ? '/en' : '/'}
              className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, var(--cyan) 0%, var(--purple) 100%)',
                color: 'white',
                boxShadow: '0 0 20px rgba(0,201,167,0.2)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {isEn ? 'Back to Homepage' : 'العودة إلى الصفحة الرئيسية'}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
