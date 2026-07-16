import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'إخلاء المسؤولية',
  description: 'إخلاء مسؤولية منصة رؤى بخصوص المحتوى المالي والتحليلات',
  openGraph: {
    title: 'إخلاء المسؤولية',
    description: 'إخلاء مسؤولية منصة رؤى بخصوص المحتوى المالي والتحليلات',
  },
};

export default function DisclaimerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
