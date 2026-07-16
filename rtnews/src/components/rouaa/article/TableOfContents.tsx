// ─── Table of Contents (Sticky Sidebar) ────────────────────────
// Interactive TOC that tracks the current section on scroll
'use client';

import { useState, useEffect, useRef } from 'react';

export interface TocItem {
  id: string;
  label: string;
  level: number; // 1=main, 2=sub
}

interface TableOfContentsProps {
  items: TocItem[];
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function TableOfContents({ items, locale = 'ar' }: TableOfContentsProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    // Small delay to ensure DOM elements exist
    const timer = setTimeout(() => {
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [items]);

  if (items.length === 0) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="sticky top-20" aria-label={t('جدول المحتويات', 'Table of Contents', 'Table des matières', 'İçindekiler', 'Tabla de contenidos')}>
      <div className="rounded-xl p-4" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          <span className="text-[12px] font-bold" style={{ color: 'var(--cyan)' }}>{t('المحتويات', 'Contents', 'Contenu', 'İçindekiler', 'Contenidos')}</span>
        </div>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => scrollTo(item.id)}
                className={`w-full ${locale === 'ar' ? 'text-right' : 'text-left'} text-[11px] leading-[1.6] py-1 px-2 rounded-md transition-all duration-200`}
                style={{
                  color: activeId === item.id ? 'var(--cyan)' : 'var(--text3)',
                  background: activeId === item.id ? 'var(--cyan2)' : 'transparent',
                  fontWeight: activeId === item.id ? 700 : 400,
                  paddingRight: item.level === 2 ? '20px' : '8px',
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
