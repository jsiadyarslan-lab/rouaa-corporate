import type { Metadata } from 'next';
import FrLibraryPageClient from './FrLibraryPageClient';

export const metadata: Metadata = {
  title: 'Bibliothèque',
  description: 'Une bibliothèque complète de livres électroniques spécialisés dans le trading et l\'analyse financière, du débutant à l\'avancé.',
  openGraph: {
    title: 'Bibliothèque',
    description: 'Une bibliothèque complète de livres électroniques spécialisés dans le trading et l\'analyse financière, du débutant à l\'avancé.',
  },
};

export default function FrLibraryPage() {
  return <FrLibraryPageClient />;
}
