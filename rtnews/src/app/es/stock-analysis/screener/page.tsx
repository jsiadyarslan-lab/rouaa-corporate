import { Suspense } from 'react';
import ScreenerClient from '@/components/stock-analysis/ScreenerClient';

export const metadata = {
  title: 'Escáner de Acciones — Rouaa',
  description: 'Herramienta avanzada de escaneo de acciones con múltiples filtros para encontrar las mejores oportunidades de inversión.',
};

export default function EsStockScreenerPage() {
  return (
    <Suspense>
      <ScreenerClient locale="es" />
    </Suspense>
  );
}
