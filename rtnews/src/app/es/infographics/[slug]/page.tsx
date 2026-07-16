// ─── Spanish Infographic Detail Page ────────────────────────────
// /es/infographics/[slug] — Individual Spanish infographic viewer

import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import EsInfographicDetailClient from './EsInfographicDetailClient';
import type { Metadata } from 'next';

export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface Props {
  params: Promise<{ slug: string }>;
}

async function findEsInfographicBySlug(slug: string) {
  let infographic = await db.infographic.findFirst({
    where: { slug, locale: 'es' },
  });
  if (infographic) return infographic;

  const suffix = slug.split('-').pop();
  if (suffix && suffix.length <= 5) {
    infographic = await db.infographic.findFirst({
      where: { slug: { endsWith: suffix }, locale: 'es' },
    });
    if (infographic) return infographic;
  }

  return null;
}

export default async function EsInfographicDetailPage({ params }: Props) {
  const { slug } = await params;

  let infographic;
  try {
    infographic = await findEsInfographicBySlug(slug);
  } catch (err) {
    console.error(`[ES Infographic] DB error for slug "${slug}":`, err);
    notFound();
  }

  if (!infographic) {
    notFound();
  }

  await db.infographic.update({
    where: { id: infographic.id },
    data: { viewCount: { increment: 1 } },
  }).catch(err => console.warn('[ES Infographic] View count increment failed:', err instanceof Error ? err.message : err));

  return <EsInfographicDetailClient infographic={infographic as any} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const infographic = await db.infographic.findFirst({
    where: { slug, locale: 'es' },
    select: { title: true, subtitle: true },
  }) || await db.infographic.findFirst({
    where: { slug: { endsWith: slug.split('-').pop() || '' }, locale: 'es' },
    select: { title: true, subtitle: true },
  });

  return {
    title: infographic ? `${infographic.title} — Rouaa Infografías` : 'Rouaa — Infografías',
    description: infographic?.subtitle || 'Análisis económico visual de Rouaa',
    openGraph: {
      locale: 'es_ES',
    },
  };
}
