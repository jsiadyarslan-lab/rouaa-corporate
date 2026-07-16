import type { Metadata } from 'next';
import TechnicalAnalysesCenter from '@/components/technical-analyses/TechnicalAnalysesCenter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = { title: 'Advanced Technical Analyses' };

export default function EnTechnicalAnalysesPage() { return <TechnicalAnalysesCenter locale="en" />; }
