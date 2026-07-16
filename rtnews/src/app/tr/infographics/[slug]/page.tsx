import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import TrInfographicDetailClient from './TrInfographicDetailClient';

export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface Props {
  params: Promise<{ slug: string }>;
}

async function findTrInfographicBySlug(slug: string) {
  let infographic = await db.infographic.findFirst({
    where: { slug, locale: 'tr' },
  });
  if (infographic) return infographic;

  const suffix = slug.split('-').pop();
  if (suffix && suffix.length <= 5) {
    infographic = await db.infographic.findFirst({
      where: { slug: { endsWith: suffix }, locale: 'tr' },
    });
    if (infographic) return infographic;
  }

  return null;
}

export default async function TrInfographicDetailPage({ params }: Props) {
  const { slug } = await params;

  let infographic;
  try {
    infographic = await findTrInfographicBySlug(slug);
  } catch (err) {
    notFound();
  }

  if (!infographic) {
    notFound();
  }

  await db.infographic.update({
    where: { id: infographic.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return <TrInfographicDetailClient infographic={infographic as any} />;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  const infographic = await db.infographic.findFirst({
    where: { slug, locale: 'tr' },
    select: { title: true, subtitle: true },
  }) || await db.infographic.findFirst({
    where: { slug: { endsWith: slug.split('-').pop() || '' }, locale: 'tr' },
    select: { title: true, subtitle: true },
  });

  return {
    title: infographic ? `${infographic.title} — Rouaa İnfografikler` : 'Rouaa — İnfografikler',
    description: infographic?.subtitle || 'Rouaa\'nın görsel ekonomik analizleri',
  };
}
