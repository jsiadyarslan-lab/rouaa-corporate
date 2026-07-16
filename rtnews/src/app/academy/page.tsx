import type { Metadata } from 'next';
import AcademyPageClient from './AcademyPageClient';

export const metadata: Metadata = {
  title: 'أكاديمية رؤى',
  description: 'تعلم التداول والتحليل المالي — دروس تفاعلية في التحليل الفني والأساسي، مؤشرات RSI و MACD، إدارة المخاطر، واستراتيجيات التداول للأسواق المالية.',
  keywords: [
    'أكاديمية تداول', 'تعلم التداول', 'تحليل فني', 'تحليل أساسي',
    'RSI', 'MACD', 'مؤشرات فنية', 'إدارة المخاطر', 'استراتيجيات تداول',
    'شمعات يابانية', 'دعم ومقاومة', 'خطوط الاتجاه',
    'trading academy', 'technical analysis', 'risk management',
  ],
  openGraph: {
    title: 'أكاديمية رؤى',
    description: 'تعلم التداول والتحليل المالي — دروس تفاعلية في التحليل الفني والأساسي ومؤشرات التداول.',
  },
};

export default function AcademyPage() {
  return <AcademyPageClient />;
}
