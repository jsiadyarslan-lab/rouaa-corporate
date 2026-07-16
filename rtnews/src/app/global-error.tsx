'use client';

// ─── Global Error Boundary ─────────────────────────────────
// This is REQUIRED to catch Server Component render errors.
// The default Next.js error.tsx (in /src/app/error.tsx) only catches
// errors that occur in Client Components or during the client render phase.
// Server Component errors (like Prisma throwing during SSR, JSON parse failures,
// or unhandled null dereferences) need a global-error.tsx at the root to be caught.
//
// Without this file, the user sees the cryptic message:
//   "An error occurred in the Server Components render. The specific message
//    is omitted in production builds to avoid leaking sensitive details."
// With this file, we log the full error to console (visible in Railway logs)
// AND show the user a friendlier page with a retry button.

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // CRITICAL: Log the FULL error to console so it shows in Railway logs.
    // The user cannot see this — but the developer can read it in the
    // Railway dashboard → Logs tab. This is the ONLY way to diagnose
    // 500 errors on Server Components in production.
    console.error('════════════════════════════════════════');
    console.error('🚨 GLOBAL SERVER ERROR BOUNDARY TRIGGERED');
    console.error('════════════════════════════════════════');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error digest:', error?.digest);
    console.error('Error stack:', error?.stack);
    if (error?.cause) {
      console.error('Error cause:', error.cause);
    }
    console.error('Full error object:', error);
    console.error('════════════════════════════════════════');
  }, [error]);

  // Detect locale from URL to show the right language
  let locale = 'ar';
  let dir = 'rtl';
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.startsWith('/en')) { locale = 'en'; dir = 'ltr'; }
    else if (path.startsWith('/fr')) { locale = 'fr'; dir = 'ltr'; }
    else if (path.startsWith('/tr')) { locale = 'tr'; dir = 'ltr'; }
    else if (path.startsWith('/es')) { locale = 'es'; dir = 'ltr'; }
  }

  const MESSAGES: Record<string, { title: string; description: string; retry: string; home: string; homeHref: string; reportBug: string }> = {
    ar: {
      title: 'تعذر تحميل التقرير',
      description: 'حدث خطأ أثناء تحميل هذه الصفحة. تم تسجيل تفاصيل الخطأ ويمكنك المحاولة مرة أخرى.',
      retry: 'إعادة المحاولة',
      home: 'الصفحة الرئيسية',
      homeHref: '/',
      reportBug: 'العودة لقائمة التقارير',
    },
    en: {
      title: 'Failed to Load Report',
      description: 'An error occurred while loading this page. The error details have been logged — please try again.',
      retry: 'Try Again',
      home: 'Homepage',
      homeHref: '/en',
      reportBug: 'Back to Reports',
    },
    fr: {
      title: 'Échec du Chargement',
      description: 'Une erreur est survenue lors du chargement de cette page. Les détails ont été enregistrés — veuillez réessayer.',
      retry: 'Réessayer',
      home: 'Accueil',
      homeHref: '/fr',
      reportBug: 'Retour aux Rapports',
    },
    tr: {
      title: 'Rapor Yüklenemedi',
      description: 'Bu sayfa yüklenirken bir hata oluştu. Hata detayları kaydedildi — lütfen tekrar deneyin.',
      retry: 'Tekrar Dene',
      home: 'Ana Sayfa',
      homeHref: '/tr',
      reportBug: 'Raporlara Dön',
    },
    es: {
      title: 'No se pudo Cargar el Informe',
      description: 'Ocurrió un error al cargar esta página. Los detalles del error han sido registrados — inténtelo de nuevo.',
      retry: 'Intentar de Nuevo',
      home: 'Inicio',
      homeHref: '/es',
      reportBug: 'Volver a Informes',
    },
  };

  const m = MESSAGES[locale] || MESSAGES.ar;
  const reportsHref = locale === 'ar' ? '/reports' : `/${locale}/reports`;

  return (
    <html lang={locale} dir={dir}>
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: '#0A0E27',
            direction: dir,
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '32px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                margin: '0 auto 20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(244,63,94,0.1)',
                border: '1px solid rgba(244,63,94,0.2)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>

            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#E2E8F0', margin: '0 0 12px' }}>
              {m.title}
            </h1>
            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 8px' }}>
              {m.description}
            </p>
            {error?.digest && (
              <p style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace', margin: '0 0 24px' }}>
                Digest: {error.digest}
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: '#00E5FF',
                  color: '#0A0E27',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {m.retry}
              </button>
              <a
                href={reportsHref}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#E2E8F0',
                  textDecoration: 'none',
                }}
              >
                {m.reportBug}
              </a>
              <a
                href={m.homeHref}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#94A3B8',
                  textDecoration: 'none',
                }}
              >
                {m.home}
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
