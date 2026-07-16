// ─── Turkish Video Player Page ──────────────────────────────────
// Uses the English video player client component with Turkish metadata

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teknik Analiz — ROUA Insights',
  description: 'Gerçek piyasa verileriyle gelişmiş interaktif teknik analiz',
  openGraph: {
    locale: 'tr_TR',
  },
};

export default function TrVideoPlayerPage() {
  const Client = require('@/app/en/videos/[id]/EnVideoPlayerPageClient').default;
  return <Client locale="tr" />;
}
