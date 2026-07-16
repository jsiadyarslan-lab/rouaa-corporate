import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الأسعار',
  description: 'خطط اشتراك مرنة تناسب احتياجاتك مع ميزات حصرية للمشتركين',
  openGraph: {
    title: 'الأسعار',
    description: 'خطط اشتراك مرنة تناسب احتياجاتك مع ميزات حصرية للمشتركين',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
