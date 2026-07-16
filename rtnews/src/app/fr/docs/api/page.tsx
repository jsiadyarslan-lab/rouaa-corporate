// ─── French API Documentation Page ────────────────────────────
import type { Metadata } from 'next';
import FrApiDocsPageClient from './FrApiDocsPageClient';

export const metadata: Metadata = {
  title: 'Documentation API — Rouaa | Rouaa API Docs',
  description: "Documentation de l'API publique de Rouaa - actualités financières, données de marché, calendrier économique",
};

export default function FrApiDocsPage() {
  return <FrApiDocsPageClient />;
}
