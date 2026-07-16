// ─── English Layout V247 ──────────────────────────────────────
// This is a CHILD layout — it CANNOT have <html> or <body> tags.
// Those are handled by the ROOT layout (app/layout.tsx) which reads
// x-locale from middleware and renders the correct shell.
//
// This layout only provides:
// 1. English-specific metadata (title, description, OG tags)
// 2. Pass-through of children

import type { Metadata } from 'next';

const SITE_URL = 'https://rouatradingnews-production.up.railway.app';

export const metadata: Metadata = {
  title: {
    default: 'Rouaa — AI-Powered Financial News',
    template: '%s | Rouaa',
  },
  description:
    'AI-powered global financial news platform — live news, AI analysis, market data, and trading signals',
  keywords: [
    'Rouaa', 'financial news', 'analysis', 'AI', 'markets', 'forex', 'gold',
    'crypto', 'Bitcoin', 'Fed', 'stocks', 'economic calendar', 'NFP', 'CPI',
    'GDP', 'FOMC', 'trading signals', 'infographics',
  ],
  authors: [{ name: 'Rouaa', url: SITE_URL }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${SITE_URL}/en`,
    siteName: 'Rouaa',
    title: 'Rouaa — AI-Powered Financial News',
    description:
      'AI-powered global financial news platform — live news, AI analysis, market data, and trading signals',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Rouaa — AI-Powered Financial News',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rouaa — AI-Powered Financial News',
    description:
      'AI-powered global financial news platform — live news, AI analysis, market data, and trading signals',
    images: [`${SITE_URL}/og-image.png`],
    creator: '@rouaa_news',
  },
  alternates: {
    canonical: `${SITE_URL}/en`,
    languages: {
      en: `${SITE_URL}/en`,
      ar: SITE_URL,
      fr: `${SITE_URL}/fr`,
      tr: `${SITE_URL}/tr`,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  // V251: Wrap children in dir="ltr" for belt-and-suspenders safety.
  // Root layout handles <html dir="ltr"> via middleware, but this ensures
  // any component rendered inside the /en route is always LTR regardless
  // of any inherited RTL direction from globals.css @layer base.
  return (
    <div dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
      {children}
    </div>
  );
}
