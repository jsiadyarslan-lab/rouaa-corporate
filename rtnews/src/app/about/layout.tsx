import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'عن رؤى',
  description: 'تعرّف على منصة رؤى — المنصة العربية الأولى للأخبار المالية المدعومة بالذكاء الاصطناعي',
  openGraph: {
    title: 'عن رؤى',
    description: 'تعرّف على منصة رؤى — المنصة العربية الأولى للأخبار المالية المدعومة بالذكاء الاصطناعي',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
