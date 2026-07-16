// ─── Regenerate Images API ───────────────────────────────
// POST /api/infographics/regenerate-images
// Admin endpoint: Regenerate AI images for a single infographic
// V5: GOLDEN RULE — Pollinations URLs ARE valid. Auto-publish when all images ready.
// Requires auth (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth-utils';
import { regenerateSlideImage, isValidImageUrl } from '@/lib/image-gen';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for AI image generation

export async function POST(request: NextRequest) {
  // Auth check — admin only
  try {
    const isAuth = await isAdminAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'خطأ في التحقق' }, { status: 401 });
  }

  let body: { infographicId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { infographicId } = body;
  if (!infographicId) {
    return NextResponse.json({ error: 'infographicId is required' }, { status: 400 });
  }

  // Fetch the infographic
  const infographic = await db.infographic.findUnique({
    where: { id: infographicId },
    select: { id: true, title: true, category: true, slides: true, isPublished: true },
  });

  if (!infographic) {
    return NextResponse.json({ error: 'Infographic not found' }, { status: 404 });
  }

  const slides = infographic.slides as any[] || [];
  const category = infographic.category || null;

  // V5: Find slides that need AI image generation
  // Pollinations URLs ARE valid — they're not treated as "needing regeneration"
  const slidesNeedingImages = slides.filter((s: any) => {
    const isNoImageType = s.type === 'recommendations' || s.type === 'summary';
    if (isNoImageType) return false;
    const position = s.image_position ?? s.content?.image_position;
    if (position === null) return false;

    const imageUrl = s.image_url || s.content?.image_url;
    // V5: Use isValidImageUrl — Pollinations URLs are valid, don't regenerate
    if (isValidImageUrl(imageUrl)) return false;
    // No valid URL → needs generation
    return true;
  });

  if (slidesNeedingImages.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'All slides have images',
      generated: 0,
    });
  }

  console.log(`[Regen-Images] ${slidesNeedingImages.length}/${slides.length} slides need AI images for: "${infographic.title?.slice(0, 50)}"`);

  // Generate images one by one
  let generated = 0;
  let failed = 0;
  for (const slide of slidesNeedingImages) {
    try {
      const result = await regenerateSlideImage(slide, category);
      if (result) {
        generated++;
      } else {
        failed++;
      }
    } catch (err: any) {
      failed++;
      console.warn(`[Regen-Images] Failed for slide ${slide.number || slide.type}: ${err.message?.slice(0, 80)}`);
    }
    // Small delay between generations to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  // V5: Check if ALL slides now have valid images — GOLDEN RULE: auto-publish if ready
  // Pollinations URLs ARE valid images
  const allSlidesReady = slides.every((s: any) => {
    const isNoImageType = s.type === 'recommendations' || s.type === 'summary';
    if (isNoImageType) return true;
    const position = s.image_position ?? s.content?.image_position;
    if (position === null) return true;
    const url = s.image_url || s.content?.image_url;
    return isValidImageUrl(url);
  });

  const updateData: any = { slides: slides };
  let autoPublished = false;

  if (allSlidesReady && failed === 0 && !infographic.isPublished) {
    updateData.isPublished = true;
    updateData.publishedAt = new Date();
    autoPublished = true;
    console.log(`[Regen-Images] ✓ GOLDEN RULE: Publishing "${infographic.title?.slice(0, 40)}" — all images ready`);
  }

  await db.infographic.update({
    where: { id: infographic.id },
    data: updateData,
  }).catch(err => console.error('[Infographics V156] Failed to update infographic:', err instanceof Error ? err.message : err));

  console.log(`[Regen-Images] ✓ Generated ${generated}/${slidesNeedingImages.length} AI images for "${infographic.title?.slice(0, 30)}"${autoPublished ? ' — PUBLISHED' : ''}`);

  return NextResponse.json({
    success: true,
    generated,
    failed,
    total: slidesNeedingImages.length,
    autoPublished,
  });
}
