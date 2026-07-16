// ─── Infographic Detail Page ──────────────────────────────
// /infographics/[slug] — Individual infographic viewer
// V10: CRITICAL FIX — removed synchronous image generation that blocked page load for ~60s
// Image generation is now triggered client-side after page renders (fire-and-forget)

import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import InfographicDetailClient from './InfographicDetailClient';

// V3: Triple-force no caching for dynamic Arabic slug pages
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface Props {
  params: Promise<{ slug: string }>;
}

// Lookup helper — tries exact, NFC, NFD, then suffix match
// V314 FIX: Use findFirst instead of findUnique because @@unique([slug, locale])
// makes slug alone non-unique (same slug allowed in ar + en locales).
async function findInfographicBySlug(slug: string, locale: string = 'ar') {
  // 1. Exact match with locale
  let infographic = await db.infographic.findFirst({
    where: { slug, locale },
  });
  if (infographic) return infographic;

  // 2. NFC/NFD Unicode normalization fallback
  const nfcSlug = slug.normalize('NFC');
  const nfdSlug = slug.normalize('NFD');
  infographic = await db.infographic.findFirst({
    where: { OR: [{ slug: nfcSlug, locale }, { slug: nfdSlug, locale }] },
  });
  if (infographic) {
    console.log(`[Infographic] Found via normalization: "${infographic.slug}" vs URL "${slug}"`);
    return infographic;
  }

  // 3. Suffix match (random 4-char ID like "o2g2", "v67s")
  const suffix = slug.split('-').pop();
  if (suffix && suffix.length <= 5) {
    infographic = await db.infographic.findFirst({
      where: { slug: { endsWith: suffix }, locale },
    });
    if (infographic) {
      console.log(`[Infographic] Found via suffix "${suffix}": "${infographic.slug}"`);
      return infographic;
    }
  }

  return null;
}

export default async function InfographicDetailPage({ params }: Props) {
  const { slug } = await params;

  let infographic;
  try {
    infographic = await findInfographicBySlug(slug, 'ar');
  } catch (err) {
    console.error(`[Infographic] DB error for slug "${slug}":`, err);
    notFound();
  }

  if (!infographic) {
    console.error(`[Infographic] Not found: "${slug}"`);
    notFound();
  }

  // Increment view count
  await db.infographic.update({
    where: { id: infographic.id },
    data: { viewCount: { increment: 1 } },
  }).catch(err => console.warn('[Infographic V156] View count increment failed:', err instanceof Error ? err.message : err));

  // V10: NO synchronous image generation on page load!
  // Previously, this page called await regenerateSlideImage() which blocked
  // the page for 30-120 seconds while trying CLI → SDK → Pollinations.
  // Now the page renders instantly and the client triggers background generation.

  return <InfographicDetailClient infographic={infographic as any} />;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  // V314 FIX: Use findFirst since slug alone is not unique (@@unique([slug, locale]))
  const infographic = await db.infographic.findFirst({
    where: { slug, locale: 'ar' },
    select: { title: true, subtitle: true },
  }) || await db.infographic.findFirst({
    where: { slug: { endsWith: slug.split('-').pop() || '' }, locale: 'ar' },
    select: { title: true, subtitle: true },
  });

  return {
    title: infographic ? `${infographic.title} — إنفوغرافيك رؤى` : 'إنفوغرافيك رؤى',
    description: infographic?.subtitle || 'تحليل بصري اقتصادي من رؤى',
  };
}
