import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bibliothèque',
  description: 'Une bibliothèque complète de livres et références financières pour développer vos compétences en trading et investissement',
  openGraph: {
    title: 'Bibliothèque',
    description: 'Une bibliothèque complète de livres et références financières pour développer vos compétences en trading et investissement',
  },
};

export default function FrLibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
