import type { Metadata } from 'next';
import AnalysisPage from '@/components/analysis/AnalysisPage';

export const metadata: Metadata = {
  title: 'مركز التحليل الذكي',
  description: 'تحليل AI فوري، أدوات متقدمة، رسم بياني تفاعلي، حاسبة الصفقات، مؤشرات فنية، وتوصيات ذكية مدعومة بالذكاء الاصطناعي للأسواق المالية.',
  keywords: [
    'تحليل AI', 'تحليل ذكي', 'تحليل فني', 'رسم بياني', 'حاسبة صفقات',
    'مؤشرات فنية', 'توصيات ذكية', 'ذكاء اصطناعي', 'تحليل أسواق',
    'AI analysis', 'smart trading', 'technical indicators',
  ],
  openGraph: {
    title: 'مركز التحليل الذكي',
    description: 'تحليل AI فوري، أدوات متقدمة، رسم بياني تفاعلي، حاسبة الصفقات، وتوصيات ذكية.',
  },
};

export default function AnalysisPageRoute() {
  return <AnalysisPage locale="ar" />;
}
