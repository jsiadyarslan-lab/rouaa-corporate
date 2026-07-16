// ─── Infographic Detail Error Boundary ──────────────────────
// Graceful fallback for Server Components errors on /infographics/[slug]
// Supports ar/en/fr/tr locales.

'use client';

import { useEffect } from 'react';
import { DESIGN_TOKENS, hexToRgba } from '@/components/infographics/types';
import Link from 'next/link';

const ERROR_MESSAGES: Record<string, { title: string; message: string; retry: string; back: string }> = {
  ar: { title: 'حدث خطأ أثناء تحميل الإنفوغرافيك', message: 'نعتذر عن هذا الخطأ. يمكنك المحاولة مرة أخرى أو العودة لصفحة الإنفوغرافيك.', retry: 'إعادة المحاولة', back: 'العودة للإنفوغرافيك' },
  en: { title: 'Error loading infographic', message: 'We apologize for this error. You can try again or go back to the infographics page.', retry: 'Retry', back: 'Back to Infographics' },
  fr: { title: 'Erreur lors du chargement de l\'infographie', message: 'Nous nous excusons pour cette erreur. Vous pouvez réessayer ou retourner à la page des infographies.', retry: 'Réessayer', back: 'Retour aux infographies' },
  tr: { title: 'İnfografik yüklenirken hata oluştu', message: 'Bu hata için özür dileriz. Tekrar deneyebilir veya infografikler sayfasına dönebilirsiniz.', retry: 'Tekrar Dene', back: 'İnfografiklere Dön' },
};

function detectLocale(): string {
  if (typeof window === 'undefined') return 'ar';
  const path = window.location.pathname;
  if (path.startsWith('/en')) return 'en';
  if (path.startsWith('/fr')) return 'fr';
  if (path.startsWith('/tr')) return 'tr';
  return 'ar';
}

export default function InfographicDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Infographic Detail Error Boundary]', error);
  }, [error]);

  const locale = detectLocale();
  const msgs = ERROR_MESSAGES[locale] || ERROR_MESSAGES.ar;
  const isRTL = locale === 'ar';
  const basePath = locale === 'ar' ? '/infographics' : `/${locale}/infographics`;

  return (
    <main className="min-h-screen flex items-center justify-center px-4" dir={isRTL ? 'rtl' : 'ltr'} style={{ background: DESIGN_TOKENS.bgDeep }}>
      <div className="text-center max-w-md mx-auto p-8 rounded-2xl"
        style={{ background: DESIGN_TOKENS.bgCard, border: `1px solid ${DESIGN_TOKENS.borderDefault}` }}>
        <div className="flex items-center justify-center mb-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: hexToRgba(DESIGN_TOKENS.danger, 0.08), border: `1px solid ${hexToRgba(DESIGN_TOKENS.danger, 0.15)}` }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={DESIGN_TOKENS.danger} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
        </div>
        <h2 className="text-[18px] font-bold mb-2" style={{ color: DESIGN_TOKENS.textPrimary, fontFamily: DESIGN_TOKENS.fontTitle }}>
          {msgs.title}
        </h2>
        <p className="text-[13px] mb-6 leading-relaxed" style={{ color: DESIGN_TOKENS.textSecondary, fontFamily: DESIGN_TOKENS.fontBody }}>
          {msgs.message}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all"
            style={{ background: DESIGN_TOKENS.info, color: '#fff', fontFamily: DESIGN_TOKENS.fontBody }}>
            {msgs.retry}
          </button>
          <Link
            href={basePath}
            className="px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all"
            style={{ background: DESIGN_TOKENS.bgCard, border: `1px solid ${DESIGN_TOKENS.borderDefault}`, color: DESIGN_TOKENS.textSecondary, fontFamily: DESIGN_TOKENS.fontBody }}>
            {msgs.back}
          </Link>
        </div>
      </div>
    </main>
  );
}
