// ─── Spanish Infographics Listing Page ──────────────────────────
// Server Component — fetches Spanish infographics from DB
// Uses EnInfographicsListClient with Spanish locale

import { Metadata } from 'next';
import { db } from '@/lib/db';
import EnInfographicsListClient from '@/app/en/infographics/EnInfographicsListClient';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Infografías',
  description: 'Análisis visuales e infografías sobre las noticias financieras y económicas de Rouaa',
  openGraph: {
    title: 'Rouaa — Infografías',
    description: 'Análisis visuales e infografías sobre las noticias financieras y económicas',
  },
};

export default async function EsInfographicsPage() {
  let infographics: any[] = [];

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
      infographics = await db.infographic.findMany({
        where: { locale: 'es', isPublished: true },
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
    console.error('[ES InfographicsPage] DB error:', err.message);
  }

  return <EnInfographicsListClient infographics={infographics} locale="es" />;
}
