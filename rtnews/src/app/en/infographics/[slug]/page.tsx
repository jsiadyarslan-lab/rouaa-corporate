// ─── English Infographic Detail Page ──────────────────────────
// /en/infographics/[slug] — Individual English infographic viewer
// V314: Created missing English detail page

import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import EnInfographicDetailClient from './EnInfographicDetailClient';

export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface Props {
  params: Promise<{ slug: string }>;
}

// Lookup helper for English infographics — simpler than Arabic (no Unicode normalization needed)
async function findEnInfographicBySlug(slug: string) {
  // 1. Exact match with locale='en'
  let infographic = await db.infographic.findFirst({
    where: { slug, locale: 'en' },
  });
  if (infographic) return infographic;

  // 2. Suffix match (random 4-char ID like "o2g2", "v67s")
  const suffix = slug.split('-').pop();
  if (suffix && suffix.length <= 5) {
    infographic = await db.infographic.findFirst({
      where: { slug: { endsWith: suffix }, locale: 'en' },
    });
    if (infographic) {
      console.log(`[EN Infographic] Found via suffix "${suffix}": "${infographic.slug}"`);
      return infographic;
    }
  }

  return null;
}

export default async function EnInfographicDetailPage({ params }: Props) {
  const { slug } = await params;

  let infographic;
  try {
    infographic = await findEnInfographicBySlug(slug);
  } catch (err) {
    console.error(`[EN Infographic] DB error for slug "${slug}":`, err);
    notFound();
  }

  if (!infographic) {
    console.error(`[EN Infographic] Not found: "${slug}"`);
    notFound();
  }

  // Increment view count
  await db.infographic.update({
    where: { id: infographic.id },
    data: { viewCount: { increment: 1 } },
  }).catch(err => console.warn('[EN Infographic V314] View count increment failed:', err instanceof Error ? err.message : err));

  return <EnInfographicDetailClient infographic={infographic as any} />;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  // V314: Use findFirst since slug alone is not unique (@@unique([slug, locale]))
  const infographic = await db.infographic.findFirst({
    where: { slug, locale: 'en' },
    select: { title: true, subtitle: true },
  }) || await db.infographic.findFirst({
    where: { slug: { endsWith: slug.split('-').pop() || '' }, locale: 'en' },
    select: { title: true, subtitle: true },
  });

  return {
    title: infographic ? `${infographic.title} — Rouaa Infographics` : 'Rouaa — Infographics',
    description: infographic?.subtitle || 'Visual economic analysis from Rouaa',
  };
}
