import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لوحة الامتثال والالتزام',
  description: 'لوحة متابعة الامتثال والالتزام بمعايير المحتوى على منصة رؤى — إخلاءات المسؤولية وقواعد المحتوى ومؤشرات الأداء',
  openGraph: {
    title: 'لوحة الامتثال والالتزام',
    description: 'لوحة متابعة الامتثال والالتزام بمعايير المحتوى على منصة رؤى',
  },
};

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
