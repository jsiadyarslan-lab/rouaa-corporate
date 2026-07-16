// ─── Article Error Boundary ──────────────────────────────────
// Catches React rendering errors in the article page tree
// and shows a graceful fallback instead of a blank screen.
// Supports ar/en/fr/tr locales.
'use client';

import { Component, type ReactNode } from 'react';

const ERROR_MESSAGES: Record<string, { title: string; message: string; retry: string; home: string }> = {
  ar: { title: 'حدث خطأ غير متوقع', message: 'نعتذر عن هذا الخطأ. يمكنك تحديث الصفحة أو العودة للرئيسية.', retry: 'تحديث الصفحة', home: 'الرئيسية' },
  en: { title: 'An unexpected error occurred', message: 'We apologize for this error. You can refresh the page or go back to the homepage.', retry: 'Refresh Page', home: 'Home' },
  fr: { title: 'Une erreur inattendue est survenue', message: 'Nous nous excusons pour cette erreur. Vous pouvez actualiser la page ou retourner à l\'accueil.', retry: 'Actualiser', home: 'Accueil' },
  tr: { title: 'Beklenmeyen bir hata oluştu', message: 'Bu hata için özür dileriz. Sayfayı yenileyebilir veya ana sayfaya dönebilirsiniz.', retry: 'Sayfayı Yenile', home: 'Ana Sayfa' },
  es: { title: 'Ocurrió un error inesperado', message: 'Nos disculpamos por este error. Puede actualizar la página o volver a la página de inicio.', retry: 'Actualizar Página', home: 'Inicio' },
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

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ArticleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ArticleErrorBoundary] Caught error:', error.message, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const locale = detectLocale();
      const msgs = ERROR_MESSAGES[locale] || ERROR_MESSAGES.ar;
      const isRTL = locale === 'ar';

      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4" style={{ background: 'var(--bg)' }} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(244,63,94,0.12)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-[20px] font-bold mb-3" style={{ color: 'var(--text)' }}>{msgs.title}</h2>
            <p className="text-[14px] mb-6 leading-relaxed" style={{ color: 'var(--text3)' }}>
              {msgs.message}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all"
                style={{ background: 'var(--cyan)', color: '#000' }}
              >
                {msgs.retry}
              </button>
              <a
                href={`/${locale === 'ar' ? '' : locale}`}
                className="px-6 py-2.5 rounded-xl text-[14px] font-medium transition-all"
                style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}
              >
                {msgs.home}
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
