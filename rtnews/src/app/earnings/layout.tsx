import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'أرباح الشركات',
  description: 'تقويم أرباح الشركات الأمريكية مع توقعات AI لحركات السهم',
  openGraph: {
    title: 'أرباح الشركات',
    description: 'تقويم أرباح الشركات الأمريكية مع توقعات AI لحركات السهم',
  },
};

export default function EarningsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
