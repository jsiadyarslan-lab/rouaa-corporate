// ─── French News Listing Page ───────────────────────────────
// Server Component — fetches French news from DB
// Passes data to FrNewsPageClient as initialLiveNews for rendering
// Architecture mirrors the English /news/page.tsx

import { Metadata } from 'next';
import { db } from '@/lib/db';
import { NEWS_CATEGORIES } from '@/lib/news-categories';
import { filterFinancialNews } from '@/lib/news-content-filter';
import SmartNewsCenter from '@/components/news/SmartNewsCenter';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Centre d\'Actualités Intelligent',
  description: 'Dernières actualités financières et économiques françaises avec analyse IA en temps réel et couverture complète des marchés mondiaux et régionaux',
  openGraph: {
    title: 'Rouaa — Centre d\'Actualités',
    description: 'Dernières actualités financières et économiques françaises avec analyse IA en temps réel',
  },
};

// ─── Format DB item for the client store ──
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
    category: item.category || 'Économie',
    sentiment: item.sentiment || 'neutral',
    sentimentScore: item.sentimentScore || 55,
    impactLevel: item.impactLevel || 'low',
    originalLanguage: 'fr',
    imageUrl: `/api/article-image/${item.id}`,
    translatedTitle: undefined,
    translatedSummary: undefined,
    cachedAffectedAssets: item.affectedAssets || undefined,
    aiAnalysis: item.aiAnalysis || undefined,
    hasFullContent: true,
    views: item.views || 0,
  };
}

// ─── Page Component ──────────────────────────────────────────
export default async function FrNewsPage() {
  const allItems: any[] = [];
  const seenIds = new Set<string>();

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
      // Fetch per category for guaranteed representation
      const PER_CATEGORY_LIMIT = 20;
      for (const cat of NEWS_CATEGORIES) {
        try {
          const items = await db.newsItem.findMany({
            where: {
              locale: 'fr',
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

      // Also fetch global batch
      const globalItems = await db.newsItem.findMany({
        where: {
          locale: 'fr',
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

      // Sort by date
      allItems.sort((a, b) =>
        new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime()
      );
    }
  } catch (err: any) {
    console.error('[FR NewsPage V4] Erreur DB:', err.message);
  }

  // V4: Apply financial-content filter + dedupe
  const filteredItems = filterFinancialNews(
    allItems.map(item => ({
      ...item,
      time: item.fetchedAt?.toISOString() || new Date().toISOString(),
    })),
  );
  console.log(`[FR NewsPage V4] Returning ${filteredItems.length} items (filtered from ${allItems.length} raw)`);

  const formattedItems = filteredItems.map(formatDbItem);
  return <SmartNewsCenter initialLiveNews={formattedItems} locale="fr" />;
}
