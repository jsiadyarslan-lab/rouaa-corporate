import type { Metadata } from 'next';
import TrLibraryPageClient from './TrLibraryPageClient';

export const metadata: Metadata = {
  title: 'Kütüphane | RuYa',
  description: 'Ticaret ve yatırım becerilerinizi geliştirmek için kapsamlı bir e-kitap kütüphanesi',
};

export default function TrLibraryPage() {
  return <TrLibraryPageClient />;
}
