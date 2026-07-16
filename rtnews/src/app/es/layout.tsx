// ─── Spanish Layout ──────────────────────────────────────
// This is a CHILD layout — it CANNOT have <html> or <body> tags.
// Those are handled by the ROOT layout (app/layout.tsx) which reads
// x-locale from middleware and renders the correct shell.
//
// This layout only provides:
// 1. Spanish-specific metadata (title, description, OG tags)
// 2. Pass-through of children

import type { Metadata } from 'next';

const SITE_URL = 'https://rouatradingnews-production.up.railway.app';

export const metadata: Metadata = {
  title: {
    default: 'Rouaa — Plataforma de Noticias Financieras en Español',
    template: '%s | Rouaa',
  },
  description:
    'Plataforma de noticias financieras impulsada por IA — noticias en vivo, análisis IA, datos de mercado y señales de trading en español',
  keywords: [
    'Rouaa', 'noticias financieras', 'análisis', 'IA', 'mercados', 'forex', 'oro',
    'criptomonedas', 'Bitcoin', 'Fed', 'acciones', 'calendario económico', 'NFP', 'IPC',
    'PIB', 'FOMC', 'señales de trading', 'infografías', 'español',
  ],
  authors: [{ name: 'Rouaa', url: SITE_URL }],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: `${SITE_URL}/es`,
    siteName: 'Rouaa',
    title: 'Rouaa — Plataforma de Noticias Financieras en Español',
    description:
      'Plataforma de noticias financieras impulsada por IA — noticias en vivo, análisis IA, datos de mercado y señales de trading en español',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Rouaa — Plataforma de Noticias Financieras en Español',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rouaa — Plataforma de Noticias Financieras en Español',
    description:
      'Plataforma de noticias financieras impulsada por IA — noticias en vivo, análisis IA, datos de mercado y señales de trading en español',
    images: [`${SITE_URL}/og-image.png`],
    creator: '@rouaa_news',
  },
  alternates: {
    canonical: `${SITE_URL}/es`,
    languages: {
      es: `${SITE_URL}/es`,
      en: `${SITE_URL}/en`,
      ar: SITE_URL,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EsLayout({ children }: { children: React.ReactNode }) {
  // Wrap children in dir="ltr" for belt-and-suspenders safety.
  // Root layout handles <html dir="ltr"> via middleware, but this ensures
  // any component rendered inside the /es route is always LTR regardless
  // of any inherited RTL direction from globals.css @layer base.
  return (
    <div dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
      {children}
    </div>
  );
}
