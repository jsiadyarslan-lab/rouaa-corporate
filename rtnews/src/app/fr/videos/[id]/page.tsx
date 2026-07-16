// ─── French Video Player Page ──────────────────────────────────
// Uses the English video player client component with French metadata

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analyse Technique — ROUA Insights',
  description: 'Analyse technique interactive avancée avec des données de marché réelles',
  openGraph: {
    locale: 'fr_FR',
  },
};

export default function FrVideoPlayerPage() {
  const Client = require('@/app/en/videos/[id]/EnVideoPlayerPageClient').default;
  return <Client locale="fr" />;
}
