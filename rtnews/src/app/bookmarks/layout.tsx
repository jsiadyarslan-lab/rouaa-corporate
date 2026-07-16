import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المحفوظات',
  description: 'أخبارك المفضلة ومقالاتك المحفوظة في مكان واحد',
  openGraph: {
    title: 'المحفوظات',
    description: 'أخبارك المفضلة ومقالاتك المحفوظة في مكان واحد',
  },
};

export default function BookmarksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
