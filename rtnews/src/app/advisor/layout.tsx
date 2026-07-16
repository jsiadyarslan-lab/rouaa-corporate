import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'غرفة عمليات رؤى',
  description: 'لوحة تحكم المتداول — أوقات التداول، قوة العملات، الأجندة الاقتصادية، وإشارات المجلس',
};

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
