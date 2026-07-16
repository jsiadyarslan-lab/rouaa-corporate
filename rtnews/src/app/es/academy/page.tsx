import type { Metadata } from 'next';
import EsAcademyPageClient from './EsAcademyPageClient';

export const metadata: Metadata = {
  title: 'Academia Rouaa',
  description: 'Aprende trading y análisis financiero — lecciones interactivas de análisis técnico y fundamental, indicadores RSI y MACD, gestión de riesgos y estrategias de trading para los mercados financieros.',
  keywords: ['academia de trading', 'aprender trading', 'análisis técnico', 'análisis fundamental', 'RSI', 'MACD', 'indicadores técnicos', 'gestión de riesgos', 'estrategias de trading'],
  openGraph: {
    title: 'Academia Rouaa',
    description: 'Aprende trading y análisis financiero — lecciones interactivas de análisis técnico y fundamental e indicadores de trading.',
  },
};

export default function EsAcademyPage() {
  return <EsAcademyPageClient />;
}
