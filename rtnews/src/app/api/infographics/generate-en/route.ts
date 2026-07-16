// ─── English Infographic Generation API (MANUAL only) ─────────
// POST /api/infographics/generate-en
// V254: Manual trigger for English infographic generation.
// English infographics are NOT auto-generated — they must be manually triggered.
//
// Body: { sourceType: "news"|"economic_report"|"market_analysis", sourceId: string }

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth-utils';
import { generateInfographicEn } from '@/lib/pipeline/agents/en-infographic-generator';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  // Step 1: Auth check
  try {
    const isAuth = await isAdminAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (authErr: any) {
    return NextResponse.json({ error: 'Auth check failed' }, { status: 401 });
  }

  // Step 2: Parse body
  let body: { sourceType?: string; sourceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  const { sourceType, sourceId } = body;

  if (!sourceType || !sourceId) {
    return NextResponse.json(
      { error: 'sourceType and sourceId are required' },
      { status: 400 }
    );
  }

  const validTypes = ['news', 'economic_report', 'market_analysis'];
  if (!validTypes.includes(sourceType)) {
    return NextResponse.json(
      { error: `sourceType must be one of: ${validTypes.join(' | ')}` },
      { status: 400 }
    );
  }

  // Step 3: Generate English infographic
  console.log(`[EN Infographic API] Manual generation request: ${sourceType}:${sourceId}`);

  const result = await generateInfographicEn(sourceType, sourceId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Generation failed' },
      { status: 500 }
    );
  }

  // Step 4: Revalidate cache
  try {
    revalidatePath('/en/infographics');
    if (result.infographicId) {
      revalidatePath(`/en/infographics/${result.infographicId}`);
    }
  } catch (revalErr: any) {
    console.warn(`[EN Infographic API] Cache revalidation warning: ${revalErr.message}`);
  }

  return NextResponse.json({
    success: true,
    infographic: {
      id: result.infographicId,
      title: result.title,
      isPublished: result.isPublished,
      locale: 'en',
    },
  });
}
