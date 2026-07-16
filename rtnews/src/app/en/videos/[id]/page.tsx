import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Technical Analysis Dashboard — ROUA Insights',
  description: 'Advanced interactive technical analysis with real market data',
};

export default function EnVideoPlayerPage() {
  const Client = require('./EnVideoPlayerPageClient').default;
  return <Client />;
}
