import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تخصيص التجربة',
  description: 'خصّص تجربتك الاستثمارية على منصة رؤى',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
