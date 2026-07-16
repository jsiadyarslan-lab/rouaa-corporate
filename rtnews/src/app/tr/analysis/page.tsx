import type { Metadata } from 'next';
import AnalysisPage from '@/components/analysis/AnalysisPage';

export const metadata: Metadata = {
  title: 'Akıllı Analiz Merkezi',
  description: 'Anlık yapay zeka analizi, gelişmiş araçlar, interaktif grafikler, trading hesaplayıcısı, teknik göstergeler ve finansal piyasalar için yapay zeka destekli akıllı öneriler.',
  keywords: ['yapay zeka analizi', 'akıllı analiz', 'teknik analiz', 'grafik', 'trading hesaplayıcısı', 'teknik göstergeler', 'akıllı öneriler', 'finansal piyasalar'],
  openGraph: {
    title: 'Akıllı Analiz Merkezi',
    description: 'Anlık yapay zeka analizi, gelişmiş araçlar, interaktif grafikler, trading hesaplayıcısı ve akıllı öneriler.',
  },
};

export default function TrAnalysisPageRoute() {
  return <AnalysisPage locale="tr" />;
}
