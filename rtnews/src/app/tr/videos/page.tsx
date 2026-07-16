import { Metadata } from 'next';
import TrVideosPageClient from './TrVideosPageClient';

export const metadata: Metadata = {
  title: 'Videolar | Ru\'aa',
  description: 'Animasyonlu grafikler ve yapay zeka anlatımıyla finansal piyasaların profesyonel video analizleri',
};

export default function TrVideosPage() {
  return <TrVideosPageClient />;
}
