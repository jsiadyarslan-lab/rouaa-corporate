// ─── French Layout ──────────────────────────────────────
// This is a CHILD layout — it CANNOT have <html> or <body> tags.
// Those are handled by the ROOT layout (app/layout.tsx) which reads
// x-locale from middleware and renders the correct shell.
//
// This layout only provides:
// 1. French-specific metadata (title, description, OG tags)
// 2. Pass-through of children

import type { Metadata } from 'next';

const SITE_URL = 'https://rouatradingnews-production.up.railway.app';

export const metadata: Metadata = {
  title: {
    default: 'Rouaa — Actualités Financières IA',
    template: '%s | Rouaa',
  },
  description:
    'Plateforme d\'actualités financières mondiales propulsée par l\'IA — actualités en direct, analyses IA, données de marché et signaux de trading',
  keywords: [
    'Rouaa', 'actualités financières', 'analyse', 'IA', 'marchés', 'forex', 'or',
    'crypto', 'Bitcoin', 'Fed', 'actions', 'calendrier économique', 'NFP', 'IPC',
    'PIB', 'FOMC', 'signaux de trading', 'infographies',
  ],
  authors: [{ name: 'Rouaa', url: SITE_URL }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: `${SITE_URL}/fr`,
    siteName: 'Rouaa',
    title: 'Rouaa — Actualités Financières IA',
    description:
      'Plateforme d\'actualités financières mondiales propulsée par l\'IA — actualités en direct, analyses IA, données de marché et signaux de trading',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Rouaa — Actualités Financières IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rouaa — Actualités Financières IA',
    description:
      'Plateforme d\'actualités financières mondiales propulsée par l\'IA — actualités en direct, analyses IA, données de marché et signaux de trading',
    images: [`${SITE_URL}/og-image.png`],
    creator: '@rouaa_news',
  },
  alternates: {
    canonical: `${SITE_URL}/fr`,
    languages: {
      ar: SITE_URL,
      en: `${SITE_URL}/en`,
      fr: `${SITE_URL}/fr`,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function FrLayout({ children }: { children: React.ReactNode }) {
  // Wrap children in dir="ltr" for belt-and-suspenders safety.
  // Root layout handles <html dir="ltr"> via middleware, but this ensures
  // any component rendered inside the /fr route is always LTR regardless
  // of any inherited RTL direction from globals.css @layer base.
  return (
    <div dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
      {children}
    </div>
  );
}
