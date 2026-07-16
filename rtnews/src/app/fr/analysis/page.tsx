import type { Metadata } from 'next';
import AnalysisPage from '@/components/analysis/AnalysisPage';

export const metadata: Metadata = {
  title: 'Centre d\'analyse intelligente',
  description: 'Analyse IA instantanée, outils avancés, graphiques interactifs, calculateur de trading, indicateurs techniques et recommandations intelligentes alimentées par l\'IA pour les marchés financiers.',
  keywords: ['analyse IA', 'analyse intelligente', 'analyse technique', 'graphique', 'calculateur de trading', 'indicateurs techniques', 'recommandations intelligentes', 'marchés financiers'],
  openGraph: {
    title: 'Centre d\'analyse intelligente',
    description: 'Analyse IA instantanée, outils avancés, graphiques interactifs, calculateur de trading et recommandations intelligentes.',
  },
};

export default function FrAnalysisPageRoute() {
  // V252: AnalysisPage now supports 'fr' locale with full French translations
  return <AnalysisPage locale="fr" />;
}
