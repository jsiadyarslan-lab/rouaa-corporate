'use client';

import React from 'react';

/* ══════════════════════════════════════════════════════════════════════
   ErrorBoundary — Enhanced error boundary with:
   - Structured error reporting (console.error with metadata)
   - Error type detection (network / render / chunk load)
   - Auto-retry for chunk-load errors (lazy-loaded components)
   - "Report Issue" button alongside Retry & Home
   - Different messages per error type
   - Visually consistent with رؤى design system
   ══════════════════════════════════════════════════════════════════════ */

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorType: 'render' | 'network' | 'chunk' | 'unknown';
  retryCount: number;
  isRetrying: boolean;
}

/** Detect the category of an error from its message / name */
function classifyError(error: Error): State['errorType'] {
  const msg = error.message?.toLowerCase() || '';
  const name = error.name?.toLowerCase() || '';

  // Chunk / dynamic import failures (Webpack / Turbopack)
  if (
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk') ||
    msg.includes('chunk load error') ||
    msg.includes('dynamically imported module') ||
    msg.includes('import()') ||
    msg.includes('failed to fetch dynamically imported module') ||
    name === 'chunkloaderror'
  ) {
    return 'chunk';
  }

  // Network-related errors
  if (
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('net::') ||
    msg.includes('err_network') ||
    msg.includes('err_connection') ||
    msg.includes('err_internet') ||
    name === 'typeerror' && msg.includes('fetch')
  ) {
    return 'network';
  }

  // Render errors (the default for React error boundaries)
  return 'render';
}

/** Structured error report logged to console */
function reportError(error: Error, errorInfo: React.ErrorInfo, errorType: State['errorType']) {
  const report = {
    timestamp: new Date().toISOString(),
    type: errorType,
    message: error.message,
    name: error.name,
    stack: error.stack?.slice(0, 500),
    componentStack: errorInfo.componentStack?.slice(0, 500),
    url: typeof window !== 'undefined' ? window.location.href : 'SSR',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };

  // Structured console output
  console.error('[رؤى ErrorBoundary] ─────────────────────────────────');
  console.error('Type:', report.type);
  console.error('Message:', report.message);
  console.error('URL:', report.url);
  console.error('Component Stack:', report.componentStack);
  console.error('Full Report:', report);
  console.error('─────────────────────────────────────────────────────');
}

/** Detect locale from URL path */
function detectLocale(): string {
  if (typeof window === 'undefined') return 'ar';
  const path = window.location.pathname;
  if (path.startsWith('/en')) return 'en';
  if (path.startsWith('/fr')) return 'fr';
  if (path.startsWith('/tr')) return 'tr';
  if (path.startsWith('/es')) return 'es';
  return 'ar';
}

/** Error-type-specific locale-aware messages */
const ERROR_MESSAGES_MAP: Record<string, Record<State['errorType'], { title: string; description: string }>> = {
  ar: {
    chunk: { title: 'خطأ في تحميل المكون', description: 'فشل تحميل أحد مكونات الصفحة. يتم المحاولة تلقائياً…' },
    network: { title: 'خطأ في الاتصال بالشبكة', description: 'تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.' },
    render: { title: 'حدث خطأ في العرض', description: 'حدث خطأ غير متوقع أثناء عرض الصفحة. يرجى المحاولة مرة أخرى.' },
    unknown: { title: 'حدث خطأ غير متوقع', description: 'نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.' },
  },
  en: {
    chunk: { title: 'Component Load Error', description: 'Failed to load a page component. Retrying automatically…' },
    network: { title: 'Network Connection Error', description: 'Could not connect to the server. Check your internet connection and try again.' },
    render: { title: 'Render Error', description: 'An unexpected error occurred while rendering the page. Please try again.' },
    unknown: { title: 'Unexpected Error', description: 'We apologize for this error. Please try again or return to the homepage.' },
  },
  fr: {
    chunk: { title: 'Erreur de chargement', description: 'Impossible de charger un composant. Nouvelle tentative automatique…' },
    network: { title: 'Erreur réseau', description: 'Impossible de se connecter au serveur. Vérifiez votre connexion et réessayez.' },
    render: { title: 'Erreur de rendu', description: 'Une erreur inattendue s\'est produite. Veuillez réessayer.' },
    unknown: { title: 'Erreur inattendue', description: 'Nous nous excusons pour cette erreur. Veuillez réessayer ou retourner à l\'accueil.' },
  },
  tr: {
    chunk: { title: 'Bileşen Yükleme Hatası', description: 'Bir sayfa bileşeni yüklenemedi. Otomatik olarak tekrar deniyor…' },
    network: { title: 'Ağ Bağlantı Hatası', description: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin ve tekrar deneyin.' },
    render: { title: 'Görüntüleme Hatası', description: 'Sayfa görüntülenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.' },
    unknown: { title: 'Beklenmeyen Hata', description: 'Bu hata için özür dileriz. Lütfen tekrar deneyin veya ana sayfaya dönün.' },
  },
  es: {
    chunk: { title: 'Error de carga de componente', description: 'No se pudo cargar un componente de la página. Reintentando automáticamente…' },
    network: { title: 'Error de conexión de red', description: 'No se pudo conectar al servidor. Verifique su conexión a internet e intente de nuevo.' },
    render: { title: 'Error de renderizado', description: 'Ocurrió un error inesperado al renderizar la página. Por favor intente de nuevo.' },
    unknown: { title: 'Error inesperado', description: 'Nos disculpamos por este error. Por favor intente de nuevo o vuelva a la página de inicio.' },
  },
};

const MAX_CHUNK_RETRIES = 3;
const CHUNK_RETRY_DELAY = 1500;

export default class ErrorBoundary extends React.Component<Props, State> {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorType: 'unknown', retryCount: 0, isRetrying: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorType = classifyError(error);
    return { hasError: true, error, errorType };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorType = classifyError(error);
    reportError(error, errorInfo, errorType);

    // Auto-retry for chunk load errors (common with lazy-loaded components)
    if (errorType === 'chunk' && this.state.retryCount < MAX_CHUNK_RETRIES) {
      this.setState({ isRetrying: true });
      this.retryTimer = setTimeout(() => {
        this.handleRetry();
      }, CHUNK_RETRY_DELAY);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorType: 'unknown', retryCount: 0, isRetrying: false });
  };

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorType: 'unknown',
      retryCount: prev.retryCount + 1,
      isRetrying: false,
    }));
    // Full page reload ensures clean state
    window.location.reload();
  };

  handleReport = () => {
    const { error, errorType, retryCount } = this.state;
    if (!error) return;

    const body = [
      `**نوع الخطأ:** ${errorType}`,
      `**الرسالة:** ${error.message}`,
      `**الموقع:** ${window.location.href}`,
      `**عدد المحاولات:** ${retryCount}`,
      `**الوقت:** ${new Date().toLocaleString('ar-SA')}`,
      '',
      error.stack ? `\`\`\`\n${error.stack.slice(0, 800)}\n\`\`\`` : '',
    ].join('\n');

    const mailto = `mailto:support@rouaa.app?subject=${encodeURIComponent(`تقرير خطأ: ${errorType}`)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { errorType, retryCount, isRetrying } = this.state;
      const locale = detectLocale();
      const messages = (ERROR_MESSAGES_MAP[locale] || ERROR_MESSAGES_MAP.ar)[errorType];
      const isChunkError = errorType === 'chunk';

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg, #050810)',
          color: 'var(--text, #E8EDF5)',
          fontFamily: "'Readex Pro', 'Cairo', 'Segoe UI', sans-serif",
          padding: '2rem',
          textAlign: 'center',
          direction: locale === 'ar' ? 'rtl' : 'ltr',
        }}>
          <div style={{
            background: 'var(--bg3, rgba(20,16,30,0.9))',
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            borderRadius: 'var(--r4, 22px)',
            padding: '3rem 2.5rem',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 0 80px rgba(0,229,255,0.04), 0 25px 60px rgba(0,0,0,0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Ambient glow */}
            <div style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(244,63,94,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* رؤى Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: '1.5rem' }}>
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="rgba(0,229,255,0.1)" />
                <polyline points="4,20 10,12 16,16 24,6" stroke="url(#err-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="24" cy="6" r="2.5" fill="var(--cyan, #00C9A7)" />
                <defs>
                  <linearGradient id="err-grad" x1="4" y1="20" x2="24" y2="6">
                    <stop offset="0%" stopColor="#00E5FF" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              <span style={{
                fontSize: '20px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: "'Readex Pro', sans-serif",
              }}>{locale === 'ar' ? 'رؤى' : 'Rouaa'}</span>
            </div>

            {/* Error Icon — changes based on type */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: isChunkError
                ? 'rgba(255,184,0,0.1)'
                : errorType === 'network'
                  ? 'rgba(59,167,240,0.1)'
                  : 'rgba(244,63,94,0.1)',
              border: `1px solid ${
                isChunkError
                  ? 'rgba(255,184,0,0.2)'
                  : errorType === 'network'
                    ? 'rgba(59,167,240,0.2)'
                    : 'rgba(244,63,94,0.2)'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              {isChunkError ? (
                /* Package / chunk icon */
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold, #FFB800)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              ) : errorType === 'network' ? (
                /* Network / wifi-off icon */
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(59,167,240,1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                  <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                  <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
                  <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
              ) : (
                /* General error icon */
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bear, #FF4D6A)" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
            </div>

            {/* Error type badge */}
            <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '999px',
                fontFamily: "var(--font-jetbrains-mono, monospace)",
                letterSpacing: '0.5px',
                background: isChunkError
                  ? 'rgba(255,184,0,0.12)'
                  : errorType === 'network'
                    ? 'rgba(59,167,240,0.12)'
                    : 'rgba(244,63,94,0.12)',
                color: isChunkError
                  ? 'var(--gold, #FFB800)'
                  : errorType === 'network'
                    ? '#3BA7F0'
                    : 'var(--bear, #FF4D6A)',
                border: `1px solid ${
                  isChunkError
                    ? 'rgba(255,184,0,0.25)'
                    : errorType === 'network'
                      ? 'rgba(59,167,240,0.25)'
                      : 'rgba(244,63,94,0.25)'
                }`,
              }}>
                {isChunkError ? 'CHUNK LOAD ERROR' : errorType === 'network' ? 'NETWORK ERROR' : 'RENDER ERROR'}
              </span>
            </div>

            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: 'var(--text-head, #FFFFFF)',
            }}>
              {messages.title}
            </h2>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text3, #94A3B8)',
              marginBottom: '0.5rem',
              lineHeight: 1.8,
            }}>
              {messages.description}
            </p>

            {/* Chunk auto-retry indicator */}
            {isChunkError && isRetrying && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: '1rem',
                color: 'var(--gold, #FFB800)',
                fontSize: '12px',
                fontWeight: 600,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {locale === 'ar' ? 'جاري إعادة المحاولة تلقائياً' : locale === 'tr' ? 'Otomatik olarak tekrar deniyor' : locale === 'fr' ? 'Nouvelle tentative automatique' : locale === 'es' ? 'Reintentando automáticamente' : 'Auto-retrying'} ({retryCount}/{MAX_CHUNK_RETRIES})…
              </div>
            )}

            {/* Retry count indicator */}
            {retryCount > 0 && !isRetrying && (
              <p style={{
                fontSize: '11px',
                color: 'var(--text4, #303A48)',
                marginBottom: '1rem',
                fontFamily: "var(--font-jetbrains-mono, monospace)",
              }}>
                {locale === 'ar' ? `تمت المحاولة ${retryCount} مرة` : locale === 'tr' ? `${retryCount} deneme yapıldı` : locale === 'fr' ? `${retryCount} tentative(s)` : locale === 'es' ? `${retryCount} intento(s)` : `${retryCount} attempt(s)`}
              </p>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
              {/* Retry Button */}
              <button
                onClick={this.handleRetry}
                style={{
                  background: 'linear-gradient(135deg, var(--cyan, #00C9A7), var(--purple, #7C6FCD))',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--r2, 12px)',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                {locale === 'ar' ? 'إعادة المحاولة' : locale === 'tr' ? 'Tekrar Dene' : locale === 'fr' ? 'Réessayer' : locale === 'es' ? 'Reintentar' : 'Retry'}
              </button>

              {/* Report Issue Button */}
              <button
                onClick={this.handleReport}
                style={{
                  background: 'var(--bg4, rgba(30,25,45,0.8))',
                  color: 'var(--text2, #94A3B8)',
                  border: '1px solid var(--border, rgba(255,255,255,0.08))',
                  borderRadius: 'var(--r2, 12px)',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                {locale === 'ar' ? 'الإبلاغ عن المشكلة' : locale === 'tr' ? 'Sorunu Bildir' : locale === 'fr' ? 'Signaler' : locale === 'es' ? 'Reportar Problema' : 'Report Issue'}
              </button>

              {/* Home Button */}
              <a
                href={locale === 'ar' ? '/' : `/${locale}`}
                style={{
                  background: 'var(--bg4, rgba(30,25,45,0.8))',
                  color: 'var(--text2, #94A3B8)',
                  border: '1px solid var(--border, rgba(255,255,255,0.08))',
                  borderRadius: 'var(--r2, 12px)',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                {locale === 'ar' ? 'الصفحة الرئيسية' : locale === 'tr' ? 'Ana Sayfa' : locale === 'fr' ? 'Page d\'accueil' : locale === 'es' ? 'Página de Inicio' : 'Homepage'}
              </a>
            </div>
          </div>

          {/* Spinning keyframe for auto-retry indicator */}
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
