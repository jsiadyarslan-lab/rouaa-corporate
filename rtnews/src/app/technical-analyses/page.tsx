import type { Metadata } from 'next';
import TechnicalAnalysesCenter from '@/components/technical-analyses/TechnicalAnalysesCenter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = { title: 'تحليلات فنية متقدمة', description: 'تحليلات فنية وأساسية احترافية للأسواق والعملات والأسهم والكريبتو' };

export default function TechnicalAnalysesPage() { return <TechnicalAnalysesCenter locale="ar" />; }
