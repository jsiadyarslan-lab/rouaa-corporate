import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Academy',
  description: 'Learn trading and financial analysis from scratch to professional with interactive lessons and financial terms',
  openGraph: {
    title: 'Academy',
    description: 'Learn trading and financial analysis from scratch to professional with interactive lessons and financial terms',
  },
};

export default function EnAcademyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
