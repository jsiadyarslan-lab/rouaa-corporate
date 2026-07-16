import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المكتبة',
  description: 'مكتبة شاملة من الكتب والمراجع المالية لتطوير مهاراتك في التداول والاستثمار',
  openGraph: {
    title: 'المكتبة',
    description: 'مكتبة شاملة من الكتب والمراجع المالية لتطوير مهاراتك في التداول والاستثمار',
  },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
