'use client';

import { useEffect } from 'react';

const ERROR_MESSAGES: Record<string, { title: string; description: string; retry: string; home: string; homeHref: string }> = {
  ar: {
    title: 'حدث خطأ غير متوقع',
    description: 'نعتذر عن هذا الخطأ. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.',
    retry: 'إعادة المحاولة',
    home: 'الصفحة الرئيسية',
    homeHref: '/',
  },
  en: {
    title: 'An unexpected error occurred',
    description: 'We apologize for this error. You can try again or return to the homepage.',
    retry: 'Try Again',
    home: 'Homepage',
    homeHref: '/en',
  },
  fr: {
    title: 'Une erreur inattendue est survenue',
    description: 'Nous nous excusons pour cette erreur. Vous pouvez réessayer ou retourner à la page d\'accueil.',
    retry: 'Réessayer',
    home: 'Page d\'accueil',
    homeHref: '/fr',
  },
  tr: {
    title: 'Beklenmeyen bir hata oluştu',
    description: 'Bu hata için özür dileriz. Tekrar deneyebilir veya ana sayfaya dönebilirsiniz.',
    retry: 'Tekrar Dene',
    home: 'Ana Sayfa',
    homeHref: '/tr',
  },
  es: {
    title: 'Ocurrió un error inesperado',
    description: 'Nos disculpamos por este error. Puede intentarlo de nuevo o volver a la página de inicio.',
    retry: 'Intentar de Nuevo',
    home: 'Página de Inicio',
    homeHref: '/es',
  },
};

function detectLocale(): string {
  if (typeof window === 'undefined') return 'ar';
  const path = window.location.pathname;
  if (path.startsWith('/en')) return 'en';
  if (path.startsWith('/fr')) return 'fr';
  if (path.startsWith('/tr')) return 'tr';
  if (path.startsWith('/es')) return 'es';
  return 'ar';
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Error Boundary]', error);
  }, [error]);

  const locale = detectLocale();
  const messages = ERROR_MESSAGES[locale] || ERROR_MESSAGES.ar;
  const isRTL = locale === 'ar';

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="glass-card p-8 max-w-md text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>{messages.title}</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text3)' }}>
          {messages.description}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'var(--cyan)', color: 'white' }}
          >
            {messages.retry}
          </button>
          <a
            href={messages.homeHref}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text2)' }}
          >
            {messages.home}
          </a>
        </div>
      </div>
    </main>
  );
}
