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
    title: `${decoded} sektörü hisseleri — Rouaa`,
    description: `${decoded} sektörü hisselerinin performans verileri, sinyaller ve değerlemelerle kapsamlı analizi.`,
    openGraph: {
      title: `${decoded} sektörü hisseleri — Rouaa`,
      description: `${decoded} sektörü hisselerinin analizi`,
    },
  };
}

export default async function TrStockSectorDetailPage({ params }: PageProps) {
  const { sector } = await params;
  const decoded = decodeURIComponent(sector);
  return (
    <Suspense>
      <SectorDetailClient locale="tr" sector={decoded} />
    </Suspense>
  );
}
