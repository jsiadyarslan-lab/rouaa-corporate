import { Metadata } from 'next';
import FrVideosPageClient from './FrVideosPageClient';

export const metadata: Metadata = {
  title: 'Vidéos | Ru\'aa',
  description: 'Analyses vidéo professionnelles des marchés financiers avec graphiques animés et narration IA',
};

export default function FrVideosPage() {
  return <FrVideosPageClient />;
}
