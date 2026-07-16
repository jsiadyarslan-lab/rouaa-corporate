// ─── Infographics Listing Page ─────────────────────────────
// /infographics — Public page showing all published infographics
// V16: Removed categories — cleaner, more visual design

import { db } from '@/lib/db';
import InfographicsListClient from './InfographicsListClient';

export const revalidate = 300;
export const metadata = {
  title: 'إنفوغرافيك',
  description: 'تحليلات بصرية وإنفوغرافيك للأخبار والتقارير الاقتصادية من رؤى',
};

export default async function InfographicsPage() {
  // Fetch published infographics — with error resilience for Railway cold starts
  let infographics: any[] = [];
  try {
    infographics = await db.infographic.findMany({
      where: { isPublished: true, locale: 'ar' },
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
  } catch (err) {
    console.error('[InfographicsPage] DB query failed:', err);
    // Return empty state instead of crashing — error.tsx will offer retry
  }

  return <InfographicsListClient infographics={infographics} />;
}
