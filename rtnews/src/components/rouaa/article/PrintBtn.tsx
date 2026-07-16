// ─── Print / PDF Button (Enhanced) ────────────────────────────────
// Opens browser print dialog for clean PDF output
// Enhanced with better print stylesheet integration
'use client';

import { useCallback } from 'react';

interface PrintBtnProps {
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function PrintBtn({ locale = 'ar' }: PrintBtnProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const handlePrint = useCallback(() => {
    // Add print-ready class briefly for any final adjustments
    document.body.classList.add('preparing-print');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('preparing-print');
    }, 100);
  }, []);

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-[var(--bg4)]"
      style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
      title={t('طباعة أو حفظ كـ PDF', 'Print or Save as PDF', 'Imprimer ou enregistrer en PDF', 'Yazdır veya PDF olarak kaydet', 'Imprimir o guardar como PDF')}
      aria-label={t('طباعة أو حفظ كـ PDF', 'Print or Save as PDF', 'Imprimer ou enregistrer en PDF', 'Yazdır veya PDF olarak kaydet', 'Imprimir o guardar como PDF')}
      data-print-hidden
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      {t('طباعة', 'Print', 'Imprimer', 'Yazdır', 'Imprimir')}
    </button>
  );
}
