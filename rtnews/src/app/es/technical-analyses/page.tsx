import type { Metadata } from 'next';
import TechnicalAnalysesCenter from '@/components/technical-analyses/TechnicalAnalysesCenter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = { title: 'Análisis Técnicos Avanzados' };

export default function EsTechnicalAnalysesPage() { return <TechnicalAnalysesCenter locale="es" />; }
