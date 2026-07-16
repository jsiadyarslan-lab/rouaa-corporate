// ─── Page de détail d'infographie en français ──────────────────────────
// /fr/infographics/[slug] — Visualiseur d'infographie individuel en français

import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import FrInfographicDetailClient from './FrInfographicDetailClient';

export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface Props {
  params: Promise<{ slug: string }>;
}

// Aide de recherche pour les infographies en français
async function findFrInfographicBySlug(slug: string) {
  // 1. Correspondance exacte avec locale='fr'
  let infographic = await db.infographic.findFirst({
    where: { slug, locale: 'fr' },
  });
  if (infographic) return infographic;

  // 2. Correspondance par suffixe (ID aléatoire de 4 caractères comme "o2g2", "v67s")
  const suffix = slug.split('-').pop();
  if (suffix && suffix.length <= 5) {
    infographic = await db.infographic.findFirst({
      where: { slug: { endsWith: suffix }, locale: 'fr' },
    });
    if (infographic) {
      console.log(`[FR Infographic] Trouvé via le suffixe "${suffix}": "${infographic.slug}"`);
      return infographic;
    }
  }

  return null;
}

export default async function FrInfographicDetailPage({ params }: Props) {
  const { slug } = await params;

  let infographic;
  try {
    infographic = await findFrInfographicBySlug(slug);
  } catch (err) {
    console.error(`[FR Infographic] Erreur DB pour le slug "${slug}":`, err);
    notFound();
  }

  if (!infographic) {
    console.error(`[FR Infographic] Non trouvé: "${slug}"`);
    notFound();
  }

  // Incrémenter le compteur de vues
  await db.infographic.update({
    where: { id: infographic.id },
    data: { viewCount: { increment: 1 } },
  }).catch(err => console.warn('[FR Infographic] Échec de l\'incrémentation du compteur de vues:', err instanceof Error ? err.message : err));

  return <FrInfographicDetailClient infographic={infographic as any} />;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  const infographic = await db.infographic.findFirst({
    where: { slug, locale: 'fr' },
    select: { title: true, subtitle: true },
  }) || await db.infographic.findFirst({
    where: { slug: { endsWith: slug.split('-').pop() || '' }, locale: 'fr' },
    select: { title: true, subtitle: true },
  });

  return {
    title: infographic ? `${infographic.title} — Infographies Rouaa` : 'Rouaa — Infographies',
    description: infographic?.subtitle || 'Analyses économiques visuelles de Rouaa',
  };
}
