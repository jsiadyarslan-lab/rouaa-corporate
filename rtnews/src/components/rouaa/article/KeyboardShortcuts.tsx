// ─── Keyboard Shortcuts ──────────────────────────────────────────
// Global keyboard shortcuts for article pages
'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsProps {
  onToggleTTS?: () => void;
  onToggleFocus?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onCloseOverlays?: () => void;
  enabled?: boolean;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function KeyboardShortcuts({
  onToggleTTS,
  onToggleFocus,
  onShare,
  onBookmark,
  onCloseOverlays,
  enabled = true,
  locale = 'ar',
}: KeyboardShortcutsProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    switch (e.key.toLowerCase()) {
      case 't':
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          onToggleTTS?.();
        }
        break;
      case 'f':
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          onToggleFocus?.();
        }
        break;
      case 's':
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          onShare?.();
        }
        break;
      case 'b':
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          onBookmark?.();
        }
        break;
      case 'escape':
        onCloseOverlays?.();
        break;
    }
  }, [enabled, onToggleTTS, onToggleFocus, onShare, onBookmark, onCloseOverlays]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // This component doesn't render anything visible
  return null;
}

// ── Keyboard Shortcuts Help Popup ──
export function ShortcutsHelp({ show, onClose, locale = 'ar' }: { show: boolean; onClose: () => void; locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es' }) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  if (!show) return null;

  const shortcuts = [
    { key: 'T', label: t('تشغيل/إيقاف القراءة الصوتية', 'Toggle Text-to-Speech', 'Activer/désactiver la synthèse vocale', 'Sesli Okumayı Aç/Kapat', 'Activar/desactivar lectura en voz alta') },
    { key: 'F', label: t('وضع القراءة المركزة', 'Focus Reading Mode', 'Mode lecture focus', 'Odaklı Okuma Modu', 'Modo de lectura enfocada') },
    { key: 'S', label: t('مشاركة المقال', 'Share Article', "Partager l'article", 'Makaleyi Paylaş', 'Compartir artículo') },
    { key: 'B', label: t('حفظ/إزالة من المحفوظات', 'Toggle Bookmark', 'Ajouter/retirer des favoris', 'Yer İmini Aç/Kapat', 'Guardar/eliminar de guardados') },
    { key: 'Esc', label: t('إغلاق النوافذ المنبثقة', 'Close Popups', 'Fermer les popups', 'Açılır Pencereleri Kapat', 'Cerrar ventanas emergentes') },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="p-6 rounded-2xl max-w-[320px] w-full mx-4"
        style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/></svg>
          <span className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{t('اختصارات لوحة المفاتيح', 'Keyboard Shortcuts', 'Raccourcis clavier', 'Klavye Kısayolları', 'Atajos de teclado')}</span>
        </div>
        <div className="space-y-2">
          {shortcuts.map(s => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: 'var(--text3)' }}>{s.label}</span>
              <kbd
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold"
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--cyan)', minWidth: '36px', textAlign: 'center' }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 rounded-lg text-[11px] font-bold"
          style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.25)' }}
        >
          {t('إغلاق', 'Close', 'Fermer', 'Kapat', 'Cerrar')}
        </button>
      </div>
    </div>
  );
}
