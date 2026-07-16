import { Metadata } from 'next';
import EsVideosPageClient from './EsVideosPageClient';

export const metadata: Metadata = {
  title: 'Vídeos | Rouaa',
  description: 'Análisis profesional de mercados financieros en vídeo con gráficos animados y narración potenciada por IA',
};

export default function EsVideosPage() {
  return <EsVideosPageClient />;
}
