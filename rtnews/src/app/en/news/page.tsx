// ─── Smart News Hub Page (English, Server Component) V4 ─────────
// Unified SmartNewsCenter architecture — shares the same component as
// ar/fr/tr/es. Applies financial-content filter + dedupe at fetch time.

import { Metadata } from 'next';
import { db } from '@/lib/db';
import { NEWS_CATEGORIES } from '@/lib/news-categories';
import { filterFinancialNews } from '@/lib/news-content-filter';
import SmartNewsCenter from '@/components/news/SmartNewsCenter';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Smart News Center',
  description: 'Latest English financial and economic news with real-time AI analysis and comprehensive global and regional market coverage',
  openGraph: {
    title: 'Rouaa — Smart News Center',
    description: 'Latest English financial and economic news with real-time AI analysis',
  },
};

function formatDbItem(item: any) {
  return {
    id: item.id,
    slug: item.slug || undefined,
    newsType: item.newsType || 'live',
    title: item.title || '',
    summary: item.summary || '',
    time: item.fetchedAt?.toISOString() || new Date().toISOString(),
    source: item.sourceName || item.source || '',
    url: item.url || '',
    category: item.category || 'Macro Economy',
    sentiment: item.sentiment || 'neutral',
    sentimentScore: item.sentimentScore || 55,
    impactLevel: item.impactLevel || 'low',
    originalLanguage: 'en',
    imageUrl: `/api/article-image/${item.id}`,
    translatedTitle: undefined,
    translatedSummary: undefined,
    cachedAffectedAssets: item.affectedAssets || undefined,
    affectedAssets: item.affectedAssets || undefined,
    aiAnalysis: item.aiAnalysis || undefined,
    hasFullContent: true,
    views: item.views || 0,
  };
}

export default async function EnNewsPage() {
  const allItems: any[] = [];
  const seenIds = new Set<string>();

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
      const PER_CATEGORY_LIMIT = 20;
      for (const cat of NEWS_CATEGORIES) {
        try {
          const items = await db.newsItem.findMany({
            where: {
              locale: 'en',
              isReady: true,
              isPublished: true,
              newsType: 'live',
              slug: { not: '' },
              title: { not: '' },
              OR: [
                { categoryId: cat.id },
                ...cat.dbCategories.map(dbCat => ({ category: dbCat })),
              ],
            },
            orderBy: { fetchedAt: 'desc' },
            take: PER_CATEGORY_LIMIT,
            select: {
              id: true, slug: true, newsType: true, title: true, summary: true,
              category: true, categoryId: true, sentiment: true, sentimentScore: true,
              impactLevel: true, source: true, sourceName: true, fetchedAt: true,
              imageUrl: true, views: true,
              affectedAssets: true, aiAnalysis: true, url: true,
            },
          });
          for (const item of items) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              allItems.push(item);
            }
          }
        } catch {
          // Skip failed category fetches
        }
      }

      const globalItems = await db.newsItem.findMany({
        where: {
          locale: 'en',
          isReady: true,
          isPublished: true,
          newsType: 'live',
          slug: { not: '' },
          title: { not: '' },
        },
        orderBy: { fetchedAt: 'desc' },
        take: 200,
        select: {
          id: true, slug: true, newsType: true, title: true, summary: true,
          category: true, categoryId: true, sentiment: true, sentimentScore: true,
          impactLevel: true, source: true, sourceName: true, fetchedAt: true,
          imageUrl: true, views: true,
          affectedAssets: true, aiAnalysis: true, url: true,
        },
      });
      for (const item of globalItems) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          allItems.push(item);
        }
      }

      allItems.sort((a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime());
    }
  } catch (err: any) {
    console.error('[EN NewsPage V4] DB error:', err.message);
  }

  // Apply financial-content filter + dedupe (V4)
  const filteredItems = filterFinancialNews(
    allItems.map(item => ({
      ...item,
      // Normalize time field for the filter
      time: item.fetchedAt?.toISOString() || new Date().toISOString(),
    })),
  );

  console.log(`[EN NewsPage V4] Returning ${filteredItems.length} items (filtered from ${allItems.length} raw)`);

  const formattedItems = filteredItems.map(formatDbItem);
  return <SmartNewsCenter initialLiveNews={formattedItems} locale="en" />;
}
