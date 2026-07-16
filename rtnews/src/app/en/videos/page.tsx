import { Metadata } from 'next';
import EnVideosPageClient from './EnVideosPageClient';

export const metadata: Metadata = {
  title: 'Videos | Ru\'aa',
  description: 'Professional video analysis of financial markets with animated charts and AI-powered narration',
};

export default function EnVideosPage() {
  return <EnVideosPageClient />;
}
