// ─── Smart News Hub Page (Server Component) V4 ─────────────────
// Architecture: READ-ONLY from the database.
// ALL processing (fetch, translate, generate, analyze) happens in the
// background via cron/bootstrap. The visitor ONLY reads pre-processed,
// ready content. If the DB is empty, the visitor sees an empty page —
// the cron will fill it in the background.
//
// V4: Unified SmartNewsCenter architecture.
//   - Replaces the 4 separate client files (News/EnNews/FrNews/TrNews)
//   - Filters non-financial content via news-content-filter.ts
//   - Deduplicates by normalized title hash
//   - Uses the same unified component as en/fr/tr/es variants

import { getNewsFromDB } from '@/lib/news-sources';
import { NEWS_CATEGORIES } from '@/lib/news-categories';
import { filterFinancialNews } from '@/lib/news-content-filter';
import SmartNewsCenter from '@/components/news/SmartNewsCenter';

export const revalidate = 300;

// ── Server-side data fetch for immediate rendering ──
// Only reads from DB — NEVER fetches, translates, or processes on-demand.
async function getInitialNews() {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      console.warn('[NewsPage V4] DATABASE_URL not configured');
      return { liveNews: [] };
    }

    // Per-category fetch strategy — guarantees every section has representation
    const PER_CATEGORY_LIMIT = 20;
    const allItems: any[] = [];
    const seenIds = new Set<string>();

    const globalResult = await getNewsFromDB({ limit: 200, locale: 'ar' });

    for (const cat of NEWS_CATEGORIES) {
      for (const dbCat of cat.dbCategories) {
        try {
          const result = await getNewsFromDB({ category: dbCat, limit: PER_CATEGORY_LIMIT, locale: 'ar' });
          for (const item of result.items) {
            if (!seenIds.has(item.id || item.url)) {
              seenIds.add(item.id || item.url);
              allItems.push(item);
            }
          }
        } catch {
          // Skip failed category fetches — don't block other categories
        }
      }
    }

    for (const item of globalResult.items) {
      if (!seenIds.has(item.id || item.url)) {
        seenIds.add(item.id || item.url);
        allItems.push(item);
      }
    }

    // Sort by date (newest first)
    allItems.sort((a, b) => new Date(b.fetchedAt || b.date).getTime() - new Date(a.fetchedAt || a.date).getTime());

    // ── V4: Apply financial-content filter + dedupe ──
    // Removes non-financial noise (sports, entertainment, celebrity gossip)
    // and deduplicates by normalized title hash.
    const filteredItems = filterFinancialNews(allItems.map(item => ({
      ...item,
      time: item.fetchedAt || item.date || new Date().toISOString(),
    })));

    // If DB has no ready articles, trigger background cron (fire-and-forget)
    if (filteredItems.length === 0 && allItems.length === 0) {
      console.log('[NewsPage V4] No ready articles — triggering background cron');
      try {
        const cronUrl = process.env.RAILWAY_PRIVATE_DOMAIN
          ? `http://${process.env.RAILWAY_PRIVATE_DOMAIN}:8080/api/news/cron?action=fetch`
          : 'http://localhost:8080/api/news/cron?action=fetch';
        const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET || '';
        fetch(cronUrl, {
          signal: AbortSignal.timeout(5000),
          headers: { 'x-internal': internalSecret },
        }).catch(err => console.warn('[NewsPage] Background cron trigger failed:', err instanceof Error ? err.message : String(err)));
      } catch {}
    }

    console.log(`[NewsPage V4] Returning ${filteredItems.length} items (filtered from ${allItems.length} raw)`);
    return { liveNews: filteredItems };
  } catch (err: any) {
    console.error('[NewsPage V4] getInitialNews error:', err.message);
    return { liveNews: [] };
  }
}

// ── Format DB item for the client store ──
function formatDbItem(item: any) {
  const titleAr = item.titleAr || undefined;
  const summaryAr = item.summaryAr || undefined;

  return {
    id: item.id,
    slug: item.slug || undefined,
    newsType: item.newsType || 'live',
    title: titleAr || item.title || '',
    summary: summaryAr || item.summary || '',
    time: item.fetchedAt || item.date || new Date().toISOString(),
    source: item.source || '',
    url: item.url || '',
    category: item.category || 'اقتصاد كلي',
    sentiment: item.sentiment || 'neutral',
    sentimentScore: item.sentimentScore || 55,
    impactLevel: item.impactLevel || 'low',
    originalLanguage: item.language || item.originalLanguage || 'en',
    imageUrl: `/api/article-image/${item.id}`,
    translatedTitle: titleAr || undefined,
    translatedSummary: summaryAr || undefined,
    affectedAssets: item.affectedAssets || item.cachedAffectedAssets || undefined,
    aiAnalysis: item.aiAnalysis || undefined,
    views: item.views || 0,
    hasFullContent: true,
  };
}

export default async function NewsPage() {
  const { liveNews } = await getInitialNews();
  const formattedLive = liveNews.map(formatDbItem);

  return <SmartNewsCenter initialLiveNews={formattedLive} locale="ar" />;
}
