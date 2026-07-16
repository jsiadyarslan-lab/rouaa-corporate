import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Academia',
  description: 'Aprende trading y análisis financiero desde cero hasta profesional con lecciones interactivas y términos financieros',
  openGraph: {
    title: 'Academia',
    description: 'Aprende trading y análisis financiero desde cero hasta profesional con lecciones interactivas y términos financieros',
  },
};

export default function EsAcademyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
