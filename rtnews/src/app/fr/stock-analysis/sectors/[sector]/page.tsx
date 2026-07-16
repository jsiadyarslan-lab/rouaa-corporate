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
    title: `Actions du secteur ${decoded} — Rouaa`,
    description: `Analyse complète des actions du secteur ${decoded} avec données de performance, signaux et valorisations.`,
    openGraph: {
      title: `Actions du secteur ${decoded} — Rouaa`,
      description: `Analyse des actions du secteur ${decoded}`,
    },
  };
}

export default async function FrStockSectorDetailPage({ params }: PageProps) {
  const { sector } = await params;
  const decoded = decodeURIComponent(sector);
  return (
    <Suspense>
      <SectorDetailClient locale="fr" sector={decoded} />
    </Suspense>
  );
}
