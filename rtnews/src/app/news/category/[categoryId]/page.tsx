import { Metadata } from 'next';
import { NEWS_CATEGORIES, getNewsCategoryId } from '@/lib/news-categories';
import { getNewsFromDB } from '@/lib/news-sources';
import CategoryNewsPageClient from './CategoryNewsPageClient';

// V130: Changed from revalidate=60 to force-dynamic to prevent ISR 404 caching.
export const revalidate = 300;
// V128: Allow dynamic params — don't 404 for categories not pre-generated at build time.
// During build (DATABASE_URL=dummy), generateStaticParams creates category pages,
// but they have empty data. dynamicParams=true ensures on-demand rendering at runtime
// with real DB data, rather than serving stale build-time 404s.
export const dynamicParams = true;

interface Props {
  params: Promise<{ categoryId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId } = await params;
  const catDef = NEWS_CATEGORIES.find(c => c.id === categoryId);
  return {
    title: catDef ? `${catDef.nameAr} - مركز الأخبار` : 'مركز الأخبار',
    description: catDef ? `آخر أخبار ${catDef.nameAr} والتحليلات المالية` : 'أخبار مالية واقتصادية',
  };
}

export function generateStaticParams() {
  return NEWS_CATEGORIES.map(cat => ({ categoryId: cat.id }));
}

export default async function CategoryNewsPage({ params }: Props) {
  const { categoryId } = await params;
  const catDef = NEWS_CATEGORIES.find(c => c.id === categoryId);

  if (!catDef) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--text3)' }}>التصنيف غير موجود</p>
      </div>
    );
  }

  // V128: During Docker build (DATABASE_URL=dummy), return empty page instead of
  // querying DB (which would fail and potentially cache error responses)
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    return <CategoryNewsPageClient category={catDef} initialNews={[]} />;
  }

  // Fetch all news for this category
  const allItems: any[] = [];
  const seenIds = new Set<string>();

  for (const dbCat of catDef.dbCategories) {
    try {
      const result = await getNewsFromDB({ category: dbCat, limit: 100 });
      for (const item of result.items) {
        if (!seenIds.has(item.id || item.url)) {
          seenIds.add(item.id || item.url);
          allItems.push(item);
        }
      }
    } catch {}
  }

  // Sort by date
  allItems.sort((a, b) => new Date(b.date || b.fetchedAt).getTime() - new Date(a.date || a.fetchedAt).getTime());

  return <CategoryNewsPageClient category={catDef} initialNews={allItems} />;
}
