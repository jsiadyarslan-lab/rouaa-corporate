import type { Metadata } from 'next';
import { Suspense } from 'react';
import StockAnalysisClient from '@/components/stock-analysis/StockAnalysisClient';

export const metadata: Metadata = {
  title: 'Análisis de Acciones — Rouaa',
  description: 'Análisis integral de acciones con IA, acciones más activas, perfiles de empresas y herramientas de comparación para decisiones de inversión inteligentes.',
  keywords: [
    'análisis de acciones', 'acciones más activas', 'perfil de empresa',
    'comparar acciones', 'análisis IA', 'calificaciones de acciones',
    'capitalización de mercado', 'indicadores técnicos', 'señales de trading', 'inversión',
  ],
  openGraph: {
    title: 'Análisis de Acciones — Rouaa',
    description: 'Análisis integral de acciones, acciones más activas, perfiles de empresas y herramientas de comparación con IA.',
  },
};

export default function EsStockAnalysisPage() {
  return (
    <Suspense>
      <StockAnalysisClient locale="es" />
    </Suspense>
  );
}
