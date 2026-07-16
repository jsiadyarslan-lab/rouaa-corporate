'use client';

import Link from 'next/link';

const DASHBOARD_ERROR_MSGS: Record<string, { title: string; message: string; retry: string; home: string }> = {
  ar: { title: 'خطأ في لوحة التحكم', message: 'حدث خطأ غير متوقع أثناء تحميل لوحة التحكم. قد يكون ذلك بسبب مشكلة في قاعدة البيانات أو اتصال الشبكة.', retry: 'إعادة المحاولة', home: 'الرئيسية' },
  en: { title: 'Dashboard Error', message: 'An unexpected error occurred while loading the dashboard. This may be due to a database issue or network connection problem.', retry: 'Retry', home: 'Home' },
  fr: { title: 'Erreur du tableau de bord', message: 'Une erreur inattendue s\'est produite lors du chargement du tableau de bord. Cela peut être dû à un problème de base de données ou de connexion réseau.', retry: 'Réessayer', home: 'Accueil' },
  tr: { title: 'Kontrol Paneli Hatası', message: 'Kontrol paneli yüklenirken beklenmeyen bir hata oluştu. Bu, bir veritabanı sorunu veya ağ bağlantı sorunundan kaynaklanıyor olabilir.', retry: 'Tekrar Dene', home: 'Ana Sayfa' },
};

function detectLocale(): string {
  if (typeof window === 'undefined') return 'ar';
  const path = window.location.pathname;
  if (path.startsWith('/en')) return 'en';
  if (path.startsWith('/fr')) return 'fr';
  if (path.startsWith('/tr')) return 'tr';
  return 'ar';
}

/**
 * Dashboard error boundary - catches runtime errors
 * and shows a user-friendly error page instead of crashing
 * V46 FIX: Use consistent CSS variable naming (--text, --bg, --border, etc.)
 * V47: Locale-aware error messages (ar/en/fr/tr)
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = detectLocale();
  const msgs = DASHBOARD_ERROR_MSGS[locale] || DASHBOARD_ERROR_MSGS.ar;
  const isRTL = locale === 'ar';
  const homePath = locale === 'ar' ? '/' : `/${locale}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir={isRTL ? 'rtl' : 'ltr'} style={{ background: 'var(--bg)' }}>
      <div className="relative w-full max-w-[520px] text-center">
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'linear-gradient(135deg, var(--bg3), var(--bg2))',
            border: '1px solid rgba(244,63,94,0.15)',
            boxShadow: '0 0 60px rgba(244,63,94,0.04), 0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          {/* Error Icon */}
          <div className="flex items-center justify-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
          </div>

          <h1 className="text-[20px] font-bold mb-3" style={{ color: 'var(--text)' }}>
            {msgs.title}
          </h1>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--text3)' }}>
            {msgs.message}
          </p>

          {/* Error details (collapsible) */}
          {error?.message && (
            <div
              className="rounded-xl p-3 mb-6 text-left"
              style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}
            >
              <p className="text-[11px] font-mono break-all" style={{ color: 'var(--bear)' }}>
                {error.message}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="px-6 py-3 text-[14px] font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, var(--cyan) 0%, var(--purple) 100%)',
                color: 'white',
                boxShadow: '0 0 20px rgba(0,229,255,0.2)',
              }}
            >
              {msgs.retry}
            </button>
            <Link
              href={homePath}
              className="px-6 py-3 text-[14px] font-medium rounded-xl transition-all hover:bg-[var(--bg4)]"
              style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}
            >
              {msgs.home}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
