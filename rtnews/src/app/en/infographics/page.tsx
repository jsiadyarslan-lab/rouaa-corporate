// ─── English Infographics Listing Page ──────────────────────
// Server Component — fetches English infographics from DB
// Now uses EnInfographicsListClient matching the Arabic design

import { Metadata } from 'next';
import { db } from '@/lib/db';
import EnInfographicsListClient from './EnInfographicsListClient';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Infographics',
  description: 'Visual analysis and infographics for financial and economic news from Rouaa',
  openGraph: {
    title: 'Rouaa — Infographics',
    description: 'Visual analysis and infographics for financial and economic news',
  },
};

export default async function EnInfographicsPage() {
  let infographics: any[] = [];

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
      infographics = await db.infographic.findMany({
        where: { locale: 'en', isPublished: true },
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
    console.error('[EN InfographicsPage] DB error:', err.message);
  }

  return <EnInfographicsListClient infographics={infographics} />;
}
