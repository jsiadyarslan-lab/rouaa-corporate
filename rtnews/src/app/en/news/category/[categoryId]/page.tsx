import { Metadata } from 'next';
import { NEWS_CATEGORIES, getNewsCategoryId } from '@/lib/news-categories';
import { getNewsFromDB } from '@/lib/news-sources';
import EnCategoryNewsPageClient from './EnCategoryNewsPageClient';

export const revalidate = 300;
export const dynamicParams = true;

interface Props {
  params: Promise<{ categoryId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId } = await params;
  const catDef = NEWS_CATEGORIES.find(c => c.id === categoryId);
  return {
    title: catDef ? `${catDef.nameEn} - News Center` : 'News Center',
    description: catDef ? `Latest ${catDef.nameEn} news and financial analysis` : 'Financial and economic news',
  };
}

export function generateStaticParams() {
  return NEWS_CATEGORIES.map(cat => ({ categoryId: cat.id }));
}

export default async function EnCategoryNewsPage({ params }: Props) {
  const { categoryId } = await params;
  const catDef = NEWS_CATEGORIES.find(c => c.id === categoryId);

  if (!catDef) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="ltr">
        <p style={{ color: 'var(--text3)' }}>Category not found</p>
      </div>
    );
  }

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    return <EnCategoryNewsPageClient category={catDef} initialNews={[]} />;
  }

  const allItems: any[] = [];
  const seenIds = new Set<string>();

  for (const dbCat of catDef.dbCategories) {
    try {
      const result = await getNewsFromDB({ category: dbCat, locale: 'en', limit: 100 });
      for (const item of result.items) {
        if (!seenIds.has(item.id || item.url)) {
          seenIds.add(item.id || item.url);
          allItems.push(item);
        }
      }
    } catch {}
  }

  allItems.sort((a, b) => new Date(b.date || b.fetchedAt).getTime() - new Date(a.date || a.fetchedAt).getTime());

  return <EnCategoryNewsPageClient category={catDef} initialNews={allItems} />;
}
