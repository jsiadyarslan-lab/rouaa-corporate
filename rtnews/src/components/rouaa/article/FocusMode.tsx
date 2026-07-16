// ─── Focus Reading Mode ────────────────────────────────────────
// Full-screen reading mode that hides all distractions
'use client';

import { useState, useEffect, useCallback } from 'react';

interface FocusModeProps {
  children: React.ReactNode;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function FocusMode({ children, locale = 'ar' }: FocusModeProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const [isFocused, setIsFocused] = useState(false);

  const toggleFocus = useCallback(() => {
    setIsFocused(prev => !prev);
  }, []);

  useEffect(() => {
    if (isFocused) {
      document.body.style.overflow = 'auto';
    }
  }, [isFocused]);

  // ESC key to exit
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isFocused) setIsFocused(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFocused]);

  return (
    <>
      {/* Focus mode toggle button */}
      <button
        onClick={toggleFocus}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-[var(--bg4)]"
        style={{
          border: '1px solid var(--border)',
          color: isFocused ? 'var(--purple)' : 'var(--text3)',
          background: isFocused ? 'var(--violet-dim)' : 'transparent',
        }}
        title={isFocused ? t('الخروج من وضع القراءة', 'Exit Reading Mode', 'Quitter le mode lecture', 'Okuma Modundan Çık', 'Salir del modo lectura') : t('وضع القراءة المركزة', 'Focus Reading Mode', 'Mode lecture focus', 'Odaklı Okuma Modu', 'Modo de lectura enfocada')}
        aria-label={isFocused ? t('الخروج من وضع القراءة', 'Exit Reading Mode', 'Quitter le mode lecture', 'Okuma Modundan Çık', 'Salir del modo lectura') : t('وضع القراءة المركزة', 'Focus Reading Mode', 'Mode lecture focus', 'Odaklı Okuma Modu', 'Modo de lectura enfocada')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isFocused ? (
            <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></>
          ) : (
            <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
          )}
        </svg>
        {isFocused ? t('خروج', 'Exit', 'Quitter', 'Çık', 'Salir') : t('تركيز', 'Focus', 'Focus', 'Odaklan', 'Enfoque')}
      </button>

      {/* Content in focus mode overlay */}
      {isFocused && (
        <div
          className="fixed inset-0 z-[60] overflow-y-auto"
          style={{ background: 'var(--bg)' }}
        >
          {/* Close button */}
          <div className="sticky top-0 z-10 flex justify-between items-center px-6 py-3" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
            <span className="text-[12px] font-medium" style={{ color: 'var(--purple)' }}>{t('وضع القراءة المركزة', 'Focus Reading Mode', 'Mode lecture focus', 'Odaklı Okuma Modu', 'Modo de lectura enfocada')}</span>
            <button
              onClick={() => setIsFocused(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
              style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
              aria-label={t('إغلاق وضع القراءة', 'Close Reading Mode', 'Fermer le mode lecture', 'Okuma Modunu Kapat', 'Cerrar modo lectura')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
              {t('إغلاق (Esc)', 'Close (Esc)', 'Fermer (Échap)', 'Kapat (Esc)', 'Cerrar (Esc)')}
            </button>
          </div>
          <div className="max-w-[720px] mx-auto px-6 py-8">
            {children}
          </div>
        </div>
      )}
    </>
  );
}
