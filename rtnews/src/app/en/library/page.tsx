import type { Metadata } from 'next';
import EnLibraryPageClient from './LibraryPageClient';

export const metadata: Metadata = {
  title: 'Library — Financial E-Books & References',
  description: 'A comprehensive library of specialized e-books on trading and financial analysis, from beginner to advanced level.',
  openGraph: {
    title: 'Library — Financial E-Books & References',
    description: 'A comprehensive library of specialized e-books on trading and financial analysis, from beginner to advanced level.',
  },
};

export default function EnLibraryPage() {
  return <EnLibraryPageClient />;
}
