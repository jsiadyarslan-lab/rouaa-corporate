import type { Metadata } from 'next';
import { Suspense } from 'react';
import EsMarketsPageClient from '@/app/es/markets/EsMarketsPageClient';

export const metadata: Metadata = {
  title: 'Centro de Mercados',
  description: 'Siga los precios de los mercados financieros en tiempo real — índices globales, materias primas, forex, criptomonedas. Datos en tiempo real, sentimiento del mercado y análisis IA.',
  keywords: [
    'mercados financieros', 'precios de acciones', 'índices de mercado', 'trading', 'forex',
    'oro', 'petróleo', 'criptomonedas', 'bitcoin', 'criptomoneda',
    'S&P 500', 'Nasdaq', 'DXY',
  ],
  openGraph: {
    title: 'Centro de Mercados',
    description: 'Siga los precios de los mercados financieros en tiempo real — índices globales, materias primas, forex, criptomonedas.',
    locale: 'es_ES',
  },
};

export default function EsMarketsPage() {
  return (
    <Suspense>
      <EsMarketsPageClient />
    </Suspense>
  );
}
