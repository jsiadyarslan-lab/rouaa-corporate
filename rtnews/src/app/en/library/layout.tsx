import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Library',
  description: 'A comprehensive library of books and financial references to develop your trading and investing skills',
  openGraph: {
    title: 'Library',
    description: 'A comprehensive library of books and financial references to develop your trading and investing skills',
  },
};

export default function EnLibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
