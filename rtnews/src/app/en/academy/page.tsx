import type { Metadata } from 'next';
import EnAcademyPageClient from './EnAcademyPageClient';

export const metadata: Metadata = {
  title: 'Rouaa Academy',
  description: 'Learn trading and financial analysis — interactive lessons in technical and fundamental analysis, RSI and MACD indicators, risk management, and trading strategies for financial markets.',
  keywords: ['trading academy', 'learn trading', 'technical analysis', 'fundamental analysis', 'RSI', 'MACD', 'technical indicators', 'risk management', 'trading strategies'],
  openGraph: {
    title: 'Rouaa Academy',
    description: 'Learn trading and financial analysis — interactive lessons in technical and fundamental analysis and trading indicators.',
  },
};

export default function EnAcademyPage() {
  return <EnAcademyPageClient />;
}
