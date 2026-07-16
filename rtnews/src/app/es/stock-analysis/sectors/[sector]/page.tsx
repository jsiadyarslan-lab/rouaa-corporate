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
    title: `Acciones del Sector ${decoded} — Rouaa`,
    description: `Análisis integral de acciones del sector ${decoded} con datos de rendimiento, señales y valoraciones.`,
    openGraph: {
      title: `Acciones del Sector ${decoded} — Rouaa`,
      description: `Análisis de acciones del sector ${decoded}`,
    },
  };
}

export default async function EsStockSectorDetailPage({ params }: PageProps) {
  const { sector } = await params;
  const decoded = decodeURIComponent(sector);
  return (
    <Suspense>
      <SectorDetailClient locale="es" sector={decoded} />
    </Suspense>
  );
}
