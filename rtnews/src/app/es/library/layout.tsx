import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Biblioteca',
  description: 'Una biblioteca completa de libros y referencias financieras para desarrollar tus habilidades en trading e inversión',
  openGraph: {
    title: 'Biblioteca',
    description: 'Una biblioteca completa de libros y referencias financieras para desarrollar tus habilidades en trading e inversión',
  },
};

export default function EsLibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
