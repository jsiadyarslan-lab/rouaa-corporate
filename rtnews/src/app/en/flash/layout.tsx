import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flash News',
  description: 'Breaking financial news affecting markets in real-time',
  openGraph: {
    title: 'Flash News',
    description: 'Breaking financial news affecting markets in real-time',
  },
};

export default function EnFlashLayout({ children }: { children: React.ReactNode }) {
  return children;
}
