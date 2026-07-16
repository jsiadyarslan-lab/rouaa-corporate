import type { Metadata } from 'next';
import AnalysisPage from '@/components/analysis/AnalysisPage';

export const metadata: Metadata = {
  title: 'Smart Analysis Center',
  description: 'Instant AI analysis, advanced tools, interactive charts, trade calculator, technical indicators, and AI-powered smart recommendations for financial markets.',
  keywords: ['AI analysis', 'smart analysis', 'technical analysis', 'chart', 'trade calculator', 'technical indicators', 'smart recommendations', 'financial markets'],
  openGraph: {
    title: 'Smart Analysis Center',
    description: 'Instant AI analysis, advanced tools, interactive charts, trade calculator, and smart recommendations.',
  },
};

export default function EnAnalysisPageRoute() {
  return <AnalysisPage locale="en" />;
}
