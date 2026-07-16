// ─── Turkish Layout ─────────────────────────────────────
// This is a CHILD layout — it CANNOT have <html> or <body> tags.
// Those are handled by the ROOT layout (app/layout.tsx) which reads
// x-locale from middleware and renders the correct shell.
//
// This layout only provides:
// 1. Turkish-specific metadata (title, description, OG tags)
// 2. Pass-through of children

import type { Metadata } from 'next';

const SITE_URL = 'https://rouatradingnews-production.up.railway.app';

export const metadata: Metadata = {
  title: {
    default: 'Rouaa — Yapay Zeka Destekli Finansal Haberler',
    template: '%s | Rouaa',
  },
  description:
    'Yapay zeka destekli küresel finansal haber platformu — canlı haberler, yapay zeka analizi, piyasa verileri ve işlem sinyalleri',
  keywords: [
    'Rouaa', 'finansal haberler', 'analiz', 'yapay zeka', 'piyasalar', 'forex', 'altın',
    'kripto', 'Bitcoin', 'Fed', 'hisseler', 'ekonomik takvim', 'işlem sinyalleri', 'infografikler',
  ],
  authors: [{ name: 'Rouaa', url: SITE_URL }],
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: `${SITE_URL}/tr`,
    siteName: 'Rouaa',
    title: 'Rouaa — Yapay Zeka Destekli Finansal Haberler',
    description:
      'Yapay zeka destekli küresel finansal haber platformu — canlı haberler, yapay zeka analizi, piyasa verileri ve işlem sinyalleri',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Rouaa — Yapay Zeka Destekli Finansal Haberler',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rouaa — Yapay Zeka Destekli Finansal Haberler',
    description:
      'Yapay zeka destekli küresel finansal haber platformu — canlı haberler, yapay zeka analizi, piyasa verileri ve işlem sinyalleri',
    images: [`${SITE_URL}/og-image.png`],
    creator: '@rouaa_news',
  },
  alternates: {
    canonical: `${SITE_URL}/tr`,
    languages: {
      ar: SITE_URL,
      en: `${SITE_URL}/en`,
      fr: `${SITE_URL}/fr`,
      tr: `${SITE_URL}/tr`,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TrLayout({ children }: { children: React.ReactNode }) {
  // Wrap children in dir="ltr" for belt-and-suspenders safety.
  // Root layout handles <html dir="ltr"> via middleware, but this ensures
  // any component rendered inside the /tr route is always LTR regardless
  // of any inherited RTL direction from globals.css @layer base.
  return (
    <div dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
      {children}
    </div>
  );
}
