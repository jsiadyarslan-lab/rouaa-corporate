import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onboarding',
  description: 'Customize your investment experience',
};

export default function EnOnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
