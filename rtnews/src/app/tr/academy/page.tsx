import type { Metadata } from 'next';
import TrAcademyPageClient from './TrAcademyPageClient';

export const metadata: Metadata = {
  title: 'Rouaa Akademi',
  description: 'Trading ve finansal analiz öğrenin — teknik ve temel analiz, RSI ve MACD göstergeleri, risk yönetimi ve finansal piyasalar için trading stratejileri üzerine interaktif dersler.',
  keywords: ['trading akademisi', 'trading öğrenin', 'teknik analiz', 'temel analiz', 'RSI', 'MACD', 'teknik göstergeler', 'risk yönetimi', 'trading stratejileri'],
  openGraph: {
    title: 'Rouaa Akademi',
    description: 'Trading ve finansal analiz öğrenin — teknik ve temel analiz ile trading göstergeleri üzerine interaktif dersler.',
  },
};

export default function TrAcademyPage() {
  return <TrAcademyPageClient />;
}
