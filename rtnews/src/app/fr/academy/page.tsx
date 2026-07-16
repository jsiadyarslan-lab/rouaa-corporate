import type { Metadata } from 'next';
import FrAcademyPageClient from './FrAcademyPageClient';

export const metadata: Metadata = {
  title: 'Académie Rouaa',
  description: 'Apprenez le trading et l\'analyse financière — leçons interactives en analyse technique et fondamentale, indicateurs RSI et MACD, gestion des risques et stratégies de trading pour les marchés financiers.',
  keywords: ['académie de trading', 'apprendre le trading', 'analyse technique', 'analyse fondamentale', 'RSI', 'MACD', 'indicateurs techniques', 'gestion des risques', 'stratégies de trading'],
  openGraph: {
    title: 'Académie Rouaa',
    description: 'Apprenez le trading et l\'analyse financière — leçons interactives en analyse technique et fondamentale et indicateurs de trading.',
  },
};

export default function FrAcademyPage() {
  return <FrAcademyPageClient />;
}
