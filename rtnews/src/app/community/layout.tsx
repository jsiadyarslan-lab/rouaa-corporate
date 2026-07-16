import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المجتمع',
  description: 'انضم لمجتمع المتداولين العرب وشارك في التصويتات والمناقشات وأفكار التداول',
  openGraph: {
    title: 'المجتمع',
    description: 'انضم لمجتمع المتداولين العرب وشارك في التصويتات والمناقشات وأفكار التداول',
  },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
