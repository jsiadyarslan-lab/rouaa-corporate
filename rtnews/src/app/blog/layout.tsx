import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المدونة',
  description: 'مقالات وآراء مالية وتحليلات معمقة من خبراء الأسواق',
  openGraph: {
    title: 'المدونة',
    description: 'مقالات وآراء مالية وتحليلات معمقة من خبراء الأسواق',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
