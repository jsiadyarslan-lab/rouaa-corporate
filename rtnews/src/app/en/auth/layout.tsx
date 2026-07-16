import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your ROUAA account',
};

export default function EnAuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
