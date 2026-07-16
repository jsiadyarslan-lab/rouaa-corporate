// ─── Spanish Infographic Generation API (alias route) ─────────
// POST /api/es/infographics/generate
// Convenience wrapper that delegates to the generate-es route logic.

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth-utils';
import { generateInfographicEs } from '@/lib/pipeline/agents/es-infographic-generator';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  // Paso 1: Verificación de autenticación
  try {
    const isAuth = await isAdminAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  } catch (authErr: any) {
    return NextResponse.json({ error: 'Error en la verificación de autenticación' }, { status: 401 });
  }

  // Paso 2: Analizar el cuerpo de la solicitud
  let body: { sourceType?: string; sourceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud debe estar en JSON' }, { status: 400 });
  }

  const { sourceType, sourceId } = body;

  if (!sourceType || !sourceId) {
    return NextResponse.json(
      { error: 'sourceType y sourceId son obligatorios' },
      { status: 400 }
    );
  }

  const validTypes = ['news', 'economic_report', 'market_analysis'];
  if (!validTypes.includes(sourceType)) {
    return NextResponse.json(
      { error: `sourceType debe ser uno de los siguientes: ${validTypes.join(' | ')}` },
      { status: 400 }
    );
  }

  // Paso 3: Generar la infografía española
  console.log(`[ES Infographic API /api/es] Solicitud de generación manual: ${sourceType}:${sourceId}`);

  const result = await generateInfographicEs(sourceType, sourceId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Error en la generación' },
      { status: 500 }
    );
  }

  // Paso 4: Invalidar caché
  try {
    revalidatePath('/es/infographics');
    if (result.infographicId) {
      revalidatePath(`/es/infographics/${result.infographicId}`);
    }
  } catch (revalErr: any) {
    console.warn(`[ES Infographic API /api/es] Advertencia de revalidación de caché: ${revalErr.message}`);
  }

  return NextResponse.json({
    success: true,
    infographic: {
      id: result.infographicId,
      title: result.title,
      isPublished: result.isPublished,
      locale: 'es',
    },
  });
}
