// ─── Spanish Video Player Page ──────────────────────────────────
// Uses the English video player client component with Spanish metadata

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Análisis Técnico — ROUA Insights',
  description: 'Análisis técnico interactivo avanzado con datos de mercado reales',
  openGraph: {
    locale: 'es_ES',
  },
};

export default function EsVideoPlayerPage() {
  const Client = require('@/app/en/videos/[id]/EnVideoPlayerPageClient').default;
  return <Client locale="es" />;
}
