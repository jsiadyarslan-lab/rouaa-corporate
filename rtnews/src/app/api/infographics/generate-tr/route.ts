// ─── Turkish Infographic Generation API (MANUAL only) ─────────
// POST /api/infographics/generate-tr
// Manual trigger for Turkish infographic generation.
// Turkish infographics are NOT auto-generated — they must be manually triggered.
//
// Body: { sourceType: "news"|"economic_report"|"market_analysis", sourceId: string }

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth-utils';
import { generateInfographicTr } from '@/lib/pipeline/agents/tr-infographic-generator';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  // Adım 1: Kimlik doğrulama kontrolü
  try {
    const isAuth = await isAdminAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
  } catch (authErr: any) {
    return NextResponse.json({ error: 'Kimlik doğrulama başarısız' }, { status: 401 });
  }

  // Adım 2: İstek gövdesini çözümle
  let body: { sourceType?: string; sourceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'İstek gövdesi JSON formatında olmalıdır' }, { status: 400 });
  }

  const { sourceType, sourceId } = body;

  if (!sourceType || !sourceId) {
    return NextResponse.json(
      { error: 'sourceType ve sourceId zorunludur' },
      { status: 400 }
    );
  }

  const validTypes = ['news', 'economic_report', 'market_analysis'];
  if (!validTypes.includes(sourceType)) {
    return NextResponse.json(
      { error: `sourceType şu değerlerden biri olmalıdır: ${validTypes.join(' | ')}` },
      { status: 400 }
    );
  }

  // Adım 3: Türk infografiğini oluştur
  console.log(`[TR Infographic API] Manuel oluşturma talebi: ${sourceType}:${sourceId}`);

  const result = await generateInfographicTr(sourceType, sourceId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Oluşturma başarısız' },
      { status: 500 }
    );
  }

  // Adım 4: Önbelleği geçersiz kıl
  try {
    revalidatePath('/tr/infographics');
    if (result.infographicId) {
      revalidatePath(`/tr/infographics/${result.infographicId}`);
    }
  } catch (revalErr: any) {
    console.warn(`[TR Infographic API] Önbellek yenileme uyarısı: ${revalErr.message}`);
  }

  return NextResponse.json({
    success: true,
    infographic: {
      id: result.infographicId,
      title: result.title,
      isPublished: result.isPublished,
      locale: 'tr',
    },
  });
}
