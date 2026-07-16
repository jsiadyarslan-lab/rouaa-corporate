import { Suspense } from 'react';
import SectorsClient from '@/components/stock-analysis/SectorsClient';

export const metadata = {
  title: 'Análisis de Sectores — Rouaa',
  description: 'Análisis integral de sectores con datos de rendimiento y las principales acciones de cada sector.',
};

export default function EsStockSectorsPage() {
  return (
    <Suspense>
      <SectorsClient locale="es" />
    </Suspense>
  );
}
