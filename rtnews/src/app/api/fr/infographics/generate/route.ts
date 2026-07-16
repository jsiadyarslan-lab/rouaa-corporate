// ─── French Infographic Generation API (alias route) ─────────
// POST /api/fr/infographics/generate
// Convenience wrapper that delegates to the generate-fr route logic.

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth-utils';
import { generateInfographicFr } from '@/lib/pipeline/agents/fr-infographic-generator';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  // Étape 1 : Vérification d'authentification
  try {
    const isAuth = await isAdminAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  } catch (authErr: any) {
    return NextResponse.json({ error: 'Échec de la vérification d\'authentification' }, { status: 401 });
  }

  // Étape 2 : Analyser le corps de la requête
  let body: { sourceType?: string; sourceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Le corps de la requête doit être en JSON' }, { status: 400 });
  }

  const { sourceType, sourceId } = body;

  if (!sourceType || !sourceId) {
    return NextResponse.json(
      { error: 'sourceType et sourceId sont requis' },
      { status: 400 }
    );
  }

  const validTypes = ['news', 'economic_report', 'market_analysis'];
  if (!validTypes.includes(sourceType)) {
    return NextResponse.json(
      { error: `sourceType doit être l'un des suivants : ${validTypes.join(' | ')}` },
      { status: 400 }
    );
  }

  // Étape 3 : Générer l'infographie française
  console.log(`[FR Infographic API /api/fr] Demande de génération manuelle : ${sourceType}:${sourceId}`);

  const result = await generateInfographicFr(sourceType, sourceId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Échec de la génération' },
      { status: 500 }
    );
  }

  // Étape 4 : Invalider le cache
  try {
    revalidatePath('/fr/infographics');
    if (result.infographicId) {
      revalidatePath(`/fr/infographics/${result.infographicId}`);
    }
  } catch (revalErr: any) {
    console.warn(`[FR Infographic API /api/fr] Avertissement de revalidation du cache : ${revalErr.message}`);
  }

  return NextResponse.json({
    success: true,
    infographic: {
      id: result.infographicId,
      title: result.title,
      isPublished: result.isPublished,
      locale: 'fr',
    },
  });
}
