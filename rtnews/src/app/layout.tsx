// ─── Root Layout V248 — Locale-aware dynamic layout ────────────
// Reads x-locale header set by middleware to determine:
// - <html lang="ar|en|fr|tr" dir="rtl|ltr">
// - Which shell components to render (Arabic, English, French, or Turkish)
// This is the ONLY place with <html> and <body> tags.
// Child layouts (en/layout.tsx, fr/layout.tsx) must NOT have <html>/<body>.

import type { Metadata, Viewport } from "next";
import { Cairo, Readex_Pro, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ErrorBoundary";
import ThemeProvider from "@/components/ThemeProvider";
import AuthProvider from "@/components/AuthProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import OfflineIndicator from "@/components/rouaa/OfflineIndicator";
// V350: Lazy-load locale shell components — only the active locale's components
// are included in the server bundle. Previously all 4 locales (20 components)
// were eagerly imported, adding ~200-300KB of unused JS per request.
import dynamic from 'next/dynamic';

// Rouaa Universal Copilot — AI assistant on ALL pages for ALL locales
// Must use a Client Component wrapper because ssr:false is required (localStorage/window usage)
// but ssr:false is not allowed in Server Components like layout.tsx
const AssistantChatWidget = dynamic(() => import('@/components/assistant/AssistantChatWidgetClient'));

// GlobalClientComponents wraps SearchCommand + BackToTop (client-only, ssr:false inside)
// layout.tsx is a Server Component so we can't use ssr:false here directly,
// but the inner component handles ssr:false for its children
const GlobalClientComponents = dynamic(() => import('@/components/GlobalClientComponents'));

// Arabic (default)
const Navbar = dynamic(() => import('@/components/rouaa/Navbar'), { ssr: true });
const Footer = dynamic(() => import('@/components/rouaa/Footer'), { ssr: true });
const TickerBar = dynamic(() => import('@/components/rouaa/TickerBar'), { ssr: true });
const NewsTickerBar = dynamic(() => import('@/components/rouaa/NewsTickerBar'), { ssr: true });
const MobileBottomTab = dynamic(() => import('@/components/rouaa/MobileBottomTab'), { ssr: true });

// English
const EnNavbar = dynamic(() => import('@/components/en/EnNavbar'), { ssr: true });
const EnFooter = dynamic(() => import('@/components/en/EnFooter'), { ssr: true });
const EnTickerBar = dynamic(() => import('@/components/en/EnTickerBar'), { ssr: true });
const EnNewsTickerBar = dynamic(() => import('@/components/en/EnNewsTickerBar'), { ssr: true });
const EnMobileBottomTab = dynamic(() => import('@/components/en/EnMobileBottomTab'), { ssr: true });

// French
const FrNavbar = dynamic(() => import('@/components/fr/FrNavbar'), { ssr: true });
const FrFooter = dynamic(() => import('@/components/fr/FrFooter'), { ssr: true });
const FrTickerBar = dynamic(() => import('@/components/fr/FrTickerBar'), { ssr: true });
const FrNewsTickerBar = dynamic(() => import('@/components/fr/FrNewsTickerBar'), { ssr: true });
const FrMobileBottomTab = dynamic(() => import('@/components/fr/FrMobileBottomTab'), { ssr: true });

// Turkish
const TrNavbar = dynamic(() => import('@/components/tr/TrNavbar'), { ssr: true });
const TrFooter = dynamic(() => import('@/components/tr/TrFooter'), { ssr: true });
const TrTickerBar = dynamic(() => import('@/components/tr/TrTickerBar'), { ssr: true });
const TrNewsTickerBar = dynamic(() => import('@/components/tr/TrNewsTickerBar'), { ssr: true });
const TrMobileBottomTab = dynamic(() => import('@/components/tr/TrMobileBottomTab'), { ssr: true });

// Spanish
const EsNavbar = dynamic(() => import('@/components/es/EsNavbar'), { ssr: true });
const EsFooter = dynamic(() => import('@/components/es/EsFooter'), { ssr: true });
const EsTickerBar = dynamic(() => import('@/components/es/EsTickerBar'), { ssr: true });
const EsNewsTickerBar = dynamic(() => import('@/components/es/EsNewsTickerBar'), { ssr: true });
const EsMobileBottomTab = dynamic(() => import('@/components/es/EsMobileBottomTab'), { ssr: true });

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const readexPro = Readex_Pro({
  variable: "--font-readex-pro",
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const SITE_URL = "https://rouatradingnews-production.up.railway.app";
const SITE_NAME_AR = "رؤى";
const SITE_TITLE_AR = "رؤى — منصة الأخبار المالية العربية";
const SITE_DESCRIPTION_AR = "منصة الأخبار المالية العربية الأولى المدعومة بالذكاء الاصطناعي — أخبار حية، تحليلات AI، بيانات الأسواق، وتقويم اقتصادي";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#050810",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE_AR,
    template: `%s | Rouaa`,
  },
  description: SITE_DESCRIPTION_AR,
  keywords: [
    "رؤى", "أخبار مالية", "تحليلات", "ذكاء اصطناعي", "أسواق عربية", "أسواق مالية",
    "ذهب", "نفط", "فوركس", "عملات رقمية", "بيتكوين", "فيدرالي", "أسهم",
    "تقويم اقتصادي", "NFP", "CPI", "GDP", "FOMC",
    "Rouaa", "financial news", "Arabic", "markets", "forex", "gold",
  ],
  authors: [{ name: "رؤى", url: SITE_URL }],
  creator: "رؤى",
  publisher: "رؤى",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: SITE_URL,
    siteName: SITE_NAME_AR,
    title: SITE_TITLE_AR,
    description: SITE_DESCRIPTION_AR,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "رؤى — منصة الأخبار المالية العربية",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE_AR,
    description: SITE_DESCRIPTION_AR,
    images: [OG_IMAGE],
    creator: "@rouaa_news",
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "ar": SITE_URL,
      "en": `${SITE_URL}/en`,
      "fr": `${SITE_URL}/fr`,
      "tr": `${SITE_URL}/tr`,
      "es": `${SITE_URL}/es`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "finance",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // V248: Read locale from middleware-set header
  // Next.js 16: headers() is async — must await
  const headersList = await headers();
  const locale = headersList.get('x-locale') || 'ar';
  const isEn = locale === 'en';
  const isFr = locale === 'fr';
  const isTr = locale === 'tr';
  const isEs = locale === 'es';
  const dir = isEn || isFr || isTr || isEs ? 'ltr' : 'rtl';
  const lang = isEn ? 'en' : isFr ? 'fr' : isTr ? 'tr' : isEs ? 'es' : 'ar';

  // JSON-LD: locale-aware — deduplicated structure, only locale-specific fields vary
  const localeConfig: Record<string, { name: string; alternateName: string; description: string; lang: string }> = {
    es: { name: 'Rouaa', alternateName: 'Rouaa — Noticias financieras impulsadas por IA', description: 'Plataforma de noticias financieras globales impulsada por IA — noticias en vivo, análisis IA, datos de mercado y señales de trading', lang: 'es' },
    fr: { name: 'Rouaa', alternateName: "Rouaa — Actualités financières propulsées par l'IA", description: "Plateforme d'actualités financières mondiales propulsée par l'IA — actualités en direct, analyses IA, données de marché et signaux de trading", lang: 'fr' },
    tr: { name: 'Rouaa', alternateName: 'Rouaa — Yapay Zeka Destekli Finansal Haberler', description: 'Yapay zeka destekli küresel finansal haber platformu — canlı haberler, yapay zeka analizi, piyasa verileri ve işlem sinyalleri', lang: 'tr' },
    en: { name: 'Rouaa', alternateName: 'Rouaa — AI-Powered Financial News', description: 'AI-powered global financial news platform — live news, AI analysis, market data, and trading signals', lang: 'en' },
    ar: { name: 'رؤى', alternateName: 'Rouaa News — رؤى للأخبار', description: SITE_DESCRIPTION_AR, lang: 'ar' },
  };
  const lc = localeConfig[lang] || localeConfig.ar;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "name": lc.name,
    "alternateName": lc.alternateName,
    "url": SITE_URL,
    "logo": { "@type": "ImageObject", "url": `${SITE_URL}/favicon.svg` },
    "description": lc.description,
    "inLanguage": lc.lang,
    "sameAs": ["https://twitter.com/rouaa_news", "https://linkedin.com/company/rouaa"],
  };

  return (
    <html lang={lang} dir={dir} className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "if('scrollRestoration'in window.history){window.history.scrollRestoration='manual';}" }} />
        {/* Prevent flash of wrong theme — ALWAYS dark (Bloomberg Terminal) */}
        <script dangerouslySetInnerHTML={{
          __html: `try{document.documentElement.classList.add('dark');localStorage.setItem('theme','dark')}catch(e){}`
        }} />
        {/* V1022: Pause ALL CSS animations + canvas when tab is hidden.
            This is the #1 CPU/GPU saver — 39+ infinite animations stop
            instantly when the user switches tabs, and resume when they
            return. The 'tab-hidden' class on <html> triggers the CSS
            rule in globals.css that sets animation-play-state: paused. */}
        <script dangerouslySetInnerHTML={{
          __html: `document.addEventListener('visibilitychange',function(){if(document.hidden){document.documentElement.classList.add('tab-hidden')}else{document.documentElement.classList.remove('tab-hidden')}});`
        }} />
        {/* Register Service Worker */}
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`
        }} />
        {/* Telegram Web App SDK — loaded only when inside Telegram */}
        <script dangerouslySetInnerHTML={{
          __html: `if(/Telegram/i.test(navigator.userAgent)||location.hash.includes('tgWebAppData')){var s=document.createElement('script');s.src='https://telegram.org/js/telegram-web-app.js';s.async=true;document.head.appendChild(s);document.body&&document.body.classList.add('tg-webapp');document.documentElement.classList.add('tg-context')}`
        }} />
        {/* Readex Pro is loaded via next/font/google above — no CDN duplicate needed */}
        {/* JSON-LD Structured Data — locale-aware */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${cairo.variable} ${readexPro.variable} ${jetbrainsMono.variable} antialiased`} style={{ fontFamily: "var(--font-readex-pro), 'Readex Pro', var(--font-cairo), 'Segoe UI', sans-serif" }}>
      {/* Skip to content link — accessibility (WCAG 2.1 §2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold focus:shadow-lg"
        style={{ background: 'var(--cyan)', color: 'white', outline: '2px solid var(--cyan)', textDecoration: 'none' }}
      >
        {isEn ? 'Skip to main content' : isFr ? 'Aller au contenu principal' : isTr ? 'Ana içeriğe atla' : isEs ? 'Saltar al contenido principal' : 'انتقل إلى المحتوى الرئيسي'}
      </a>
      <ThemeProvider>
        <QueryProvider>
        <AuthProvider>
        <OfflineIndicator locale={locale} />
        <ErrorBoundary>
          {isEn ? (
            /* ═══ English Shell: TickerBar → NewsTickerBar → Navbar ═══ */
            <>
              <EnTickerBar className="hidden md:block" />
              <EnNewsTickerBar className="hidden md:block" />
              <EnNavbar />
            </>
          ) : isFr ? (
            /* ═══ French Shell: TickerBar → NewsTickerBar → Navbar ═══ */
            <>
              <FrTickerBar className="hidden md:block" />
              <FrNewsTickerBar className="hidden md:block" />
              <FrNavbar />
            </>
          ) : isTr ? (
            /* ═══ Turkish Shell: TickerBar → NewsTickerBar → Navbar ═══ */
            <>
              <TrTickerBar className="hidden md:block" />
              <TrNewsTickerBar className="hidden md:block" />
              <TrNavbar />
            </>
          ) : isEs ? (
            /* ═══ Spanish Shell: TickerBar → NewsTickerBar → Navbar ═══ */
            <>
              <EsTickerBar className="hidden md:block" />
              <EsNewsTickerBar className="hidden md:block" />
              <EsNavbar />
            </>
          ) : (
            /* ═══ Arabic Shell: Prices → News → Navigation ═══ */
            <>
              <TickerBar className="hidden md:block" />
              <NewsTickerBar className="hidden md:block" />
              <Navbar />
            </>
          )}
          <div
            id="main-content"
            tabIndex={-1}
            aria-label={isEn ? 'Main content' : isFr ? 'Contenu principal' : isTr ? 'Ana içerik' : isEs ? 'Contenido principal' : 'المحتوى الرئيسي'}
            className="main-content-area"
            style={{ outline: 'none', paddingTop: '128px' }}
          >
            {children}
          </div>
          {isEn ? <EnFooter /> : isFr ? <FrFooter /> : isTr ? <TrFooter /> : isEs ? <EsFooter /> : <Footer />}
          {isEn ? <EnMobileBottomTab /> : isFr ? <FrMobileBottomTab /> : isTr ? <TrMobileBottomTab /> : isEs ? <EsMobileBottomTab /> : <MobileBottomTab />}
          {/* SearchCommand & BackToTop — must be in root layout to work on ALL pages */}
          <GlobalClientComponents />
          {/* Rouaa Universal Copilot — AI assistant available on ALL pages for ALL locales */}
          <AssistantChatWidget />
          {/* Responsive padding for main content */}
          <style dangerouslySetInnerHTML={{ __html: `
            :root { --nav-top: 68px; }
            @media (max-width: 768px) {
              :root { --nav-top: 0px; }
            }
            .main-content-area {
              padding-top: 128px !important;
            }
            @media (max-width: 768px) {
              .main-content-area {
                padding-top: 70px !important;
              }
            }
            @media (max-width: 480px) {
              .main-content-area {
                padding-top: 60px !important;
              }
            }
            ${isEn || isFr || isTr || isEs ? `
            /* V250: Force LTR for English/French/Turkish/Spanish locale — override @layer base direction:rtl */
            html[dir="ltr"] body {
              direction: ltr !important;
              text-align: left !important;
            }
            html[dir="ltr"] [dir="rtl"],
            html[dir="ltr"] .text-rtl {
              direction: rtl !important;
              text-align: right !important;
            }
            ` : ''}
          `}} />
          {/* Live region for toast notifications */}
          <div aria-live="polite" aria-atomic="true" className="sr-only" id="toast-announcer" />
          <div aria-live="polite" aria-relevant="additions">
            <Toaster />
          </div>
        </ErrorBoundary>
        </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
      </body>
    </html>
  );
}
