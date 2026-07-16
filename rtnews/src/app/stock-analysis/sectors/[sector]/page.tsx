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
    title: `الأسهم في قطاع ${decoded} — رؤى`,
    description: `تحليل شامل لأسهم قطاع ${decoded} مع بيانات الأداء والإشارات والتقييمات.`,
    openGraph: {
      title: `الأسهم في قطاع ${decoded} — رؤى`,
      description: `تحليل شامل لأسهم قطاع ${decoded}`,
    },
  };
}

export default async function ArStockSectorDetailPage({ params }: PageProps) {
  const { sector } = await params;
  const decoded = decodeURIComponent(sector);
  return (
    <Suspense>
      <SectorDetailClient locale="ar" sector={decoded} />
    </Suspense>
  );
}
