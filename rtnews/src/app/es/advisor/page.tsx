// ─── Spanish Advisor Page ───────────────────────────────────────
// Renders the English advisor component with locale="es" for Spanish translations

import type { Metadata } from 'next';
import EnAdvisorPage from '@/app/en/advisor/page';

export const metadata: Metadata = {
  title: 'Asesor IA de Rouaa',
  description: 'Recomendaciones de inversión personalizadas impulsadas por IA basadas en su perfil y mercados preferidos',
  openGraph: {
    title: 'Rouaa — Asesor IA',
    description: 'Recomendaciones de inversión personalizadas impulsadas por IA basadas en su perfil y mercados preferidos',
    locale: 'es_ES',
  },
};

export default function EsAdvisorPage() {
  return <EnAdvisorPage locale="es" />;
}
