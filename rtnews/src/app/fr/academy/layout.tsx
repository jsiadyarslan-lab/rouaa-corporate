import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Académie',
  description: 'Apprenez le trading et l\'analyse financière de zéro à professionnel avec des leçons interactives et des termes financiers',
  openGraph: {
    title: 'Académie',
    description: 'Apprenez le trading et l\'analyse financière de zéro à professionnel avec des leçons interactives et des termes financiers',
  },
};

export default function FrAcademyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
