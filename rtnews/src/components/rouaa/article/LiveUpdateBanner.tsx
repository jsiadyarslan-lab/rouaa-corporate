// ─── Live Update Banner ─────────────────────────────────────────
// Shows a banner when the article has been updated
// Auto-checks for updates every 60 seconds
'use client';

import { useState, useEffect, useCallback } from 'react';

interface LiveUpdateBannerProps {
  articleId: string;
  publishedAt: string;
  updatedAt: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

function formatRelativeTime(dateStr: string, locale: 'ar' | 'en' | 'fr' | 'tr' | 'es' = 'ar'): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 1) return locale === 'es' ? 'Ahora' : locale === 'tr' ? 'Şimdi' : locale === 'fr' ? 'Maintenant' : locale === 'en' ? 'Now' : 'الآن';
    if (diffMin < 60) return locale === 'es' ? `hace ${diffMin} min` : locale === 'tr' ? `${diffMin} dk önce` : locale === 'fr' ? `il y a ${diffMin} min` : locale === 'en' ? `${diffMin} min ago` : `منذ ${diffMin} دقيقة`;
    if (diffHour < 24) return locale === 'es' ? `hace ${diffHour}h` : locale === 'tr' ? `${diffHour} saat önce` : locale === 'fr' ? `il y a ${diffHour}h` : locale === 'en' ? `${diffHour}h ago` : `منذ ${diffHour} ساعة`;
    return date.toLocaleDateString(locale === 'es' ? 'es-ES' : locale === 'tr' ? 'tr-TR' : locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

export function LiveUpdateBanner({ articleId, publishedAt, updatedAt, locale = 'ar' }: LiveUpdateBannerProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateTime, setUpdateTime] = useState<string>('');
  const [dismissed, setDismissed] = useState(false);

  // Check if article was updated after publishing
  useEffect(() => {
    if (!publishedAt || !updatedAt) return;
    const pubDate = new Date(publishedAt).getTime();
    const updDate = new Date(updatedAt).getTime();
    // If updated more than 2 minutes after publishing
    if (updDate - pubDate > 120000) {
      setHasUpdate(true);
      setUpdateTime(updatedAt);
    }
  }, [publishedAt, updatedAt]);

  // Auto-check for updates every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/news/${articleId}`, { method: 'HEAD' });
        const lastModified = res.headers.get('last-modified');
        if (lastModified && updateTime) {
          const newTime = new Date(lastModified).getTime();
          const oldTime = new Date(updateTime).getTime();
          if (newTime > oldTime) {
            setUpdateTime(lastModified);
            setHasUpdate(true);
            setDismissed(false);
          }
        }
      } catch {}
    }, 60000);
    return () => clearInterval(interval);
  }, [articleId, updateTime]);

  if (!hasUpdate || dismissed) return null;

  return (
    <div
      className="mx-auto max-w-[860px] px-4 mb-4 slide-in-top"
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background: 'rgba(0,229,255,0.08)',
          border: '1px solid rgba(0,229,255,0.2)',
          borderInlineStartWidth: '4px',
          borderInlineStartColor: 'var(--cyan)',
        }}
      >
        {/* Pulsing dot */}
        <div className="flex-shrink-0 relative">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--cyan)' }} />
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping" style={{ background: 'var(--cyan)', opacity: 0.4 }} />
        </div>
        <div className="flex-1">
          <span className="text-[12px] font-bold" style={{ color: 'var(--cyan)' }}>{t('تم تحديث هذا الخبر', 'This article has been updated', 'Cet article a été mis à jour', 'Bu makale güncellendi', 'Este artículo ha sido actualizado')}</span>
          <span className="text-[11px] mr-2" style={{ color: 'var(--text3)' }}>{formatRelativeTime(updateTime, locale)}</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-[10px] px-2 py-1 rounded-lg transition-all"
          style={{ color: 'var(--text3)', border: '1px solid var(--border)' }}
        >
          {t('إغلاق', 'Close', 'Fermer', 'Kapat', 'Cerrar')}
        </button>
      </div>
    </div>
  );
}
