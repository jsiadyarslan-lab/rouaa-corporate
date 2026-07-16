import type { Metadata } from 'next';
import AnalysisPage from '@/components/analysis/AnalysisPage';

export const metadata: Metadata = {
  title: 'Centro de Análisis Inteligente',
  description: 'Análisis IA instantáneo, herramientas avanzadas, gráficos interactivos, calculadora de trading, indicadores técnicos y recomendaciones inteligentes impulsadas por IA para mercados financieros.',
  keywords: ['análisis IA', 'análisis inteligente', 'análisis técnico', 'gráficos', 'calculadora de trading', 'indicadores técnicos', 'recomendaciones inteligentes', 'mercados financieros'],
  openGraph: {
    title: 'Centro de Análisis Inteligente',
    description: 'Análisis IA instantáneo, herramientas avanzadas, gráficos interactivos y recomendaciones inteligentes.',
    locale: 'es_ES',
  },
};

export default function EsAnalysisPageRoute() {
  return <AnalysisPage locale="es" />;
}
