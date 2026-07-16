import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kütüphane',
  description: 'Ticaret ve yatırım becerilerinizi geliştirmek için kapsamlı bir kitap ve finansal referans kütüphanesi',
  openGraph: {
    title: 'Kütüphane',
    description: 'Ticaret ve yatırım becerilerinizi geliştirmek için kapsamlı bir kitap ve finansal referans kütüphanesi',
  },
};

export default function TrLibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
