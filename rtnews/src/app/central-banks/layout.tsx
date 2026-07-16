import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'البنوك المركزية',
  description: 'تتبع قرارات البنوك المركزية وأسعار الفائدة والسياسات النقدية',
  openGraph: {
    title: 'البنوك المركزية',
    description: 'تتبع قرارات البنوك المركزية وأسعار الفائدة والسياسات النقدية',
  },
};

export default function CentralBanksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
