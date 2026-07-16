import { Metadata } from 'next';
import { db } from '@/lib/db';
import TrInfographicsListClient from './TrInfographicsListClient';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'İnfografikler',
  description: 'Rouaa\'nın finansal ve ekonomik haberleri hakkında görsel analizler ve infografikler',
  openGraph: {
    title: 'Rouaa — İnfografikler',
    description: 'Finansal ve ekonomik haberler hakkında görsel analizler ve infografikler',
  },
};

export default async function TrInfographicsPage() {
  let infographics: any[] = [];

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
      infographics = await db.infographic.findMany({
        where: { locale: 'tr', isPublished: true },
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
    console.error('[TR InfographicsPage] DB error:', err.message);
  }

  return <TrInfographicsListClient infographics={infographics} />;
}
