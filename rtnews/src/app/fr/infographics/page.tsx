// ─── French Infographics Listing Page ──────────────────────────
// Server Component — fetches French infographics from DB
// Uses EnInfographicsListClient with French locale

import { Metadata } from 'next';
import { db } from '@/lib/db';
import EnInfographicsListClient from './FrInfographicsListClient';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Infographies',
  description: 'Analyses visuelles et infographies sur l\'actualité financière et économique de Rouaa',
  openGraph: {
    title: 'Rouaa — Infographies',
    description: 'Analyses visuelles et infographies sur l\'actualité financière et économique',
  },
};

export default async function FrInfographicsPage() {
  let infographics: any[] = [];

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
      infographics = await db.infographic.findMany({
        where: { locale: 'fr', isPublished: true },
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          sourceType: true,
          sourceId: true,
          sourceTitle: true,
          category: true,
          thumbnailUrl: true,
          impactScore: true,
          viewCount: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
          slides: true,
        },
      });
    }
  } catch (err: any) {
    console.error('[FR InfographicsPage] DB error:', err.message);
  }

  return <EnInfographicsListClient infographics={infographics} />;
}
