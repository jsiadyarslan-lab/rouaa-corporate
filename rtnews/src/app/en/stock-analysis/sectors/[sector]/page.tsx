import type { Metadata } from 'next';
import { Suspense } from 'react';
import SectorDetailClient from '@/components/stock-analysis/SectorDetailClient';

interface PageProps {
  params: Promise<{ sector: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sector } = await params;
  const decoded = decodeURIComponent(sector);
  return {
    title: `${decoded} Sector Stocks — Rouaa`,
    description: `Comprehensive analysis of stocks in the ${decoded} sector with performance data, signals, and valuations.`,
    openGraph: {
      title: `${decoded} Sector Stocks — Rouaa`,
      description: `Analysis of ${decoded} sector stocks`,
    },
  };
}

export default async function EnStockSectorDetailPage({ params }: PageProps) {
  const { sector } = await params;
  const decoded = decodeURIComponent(sector);
  return (
    <Suspense>
      <SectorDetailClient locale="en" sector={decoded} />
    </Suspense>
  );
}
