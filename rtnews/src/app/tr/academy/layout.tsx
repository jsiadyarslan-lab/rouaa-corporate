import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Akademi',
  description: 'Sıfırdan profesyonelliğe interaktif dersler ve finansal terimlerle işlem ve finansal analiz öğrenin',
  openGraph: {
    title: 'Akademi',
    description: 'Sıfırdan profesyonelliğe interaktif dersler ve finansal terimlerle işlem ve finansal analiz öğrenin',
  },
};

export default function TrAcademyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
