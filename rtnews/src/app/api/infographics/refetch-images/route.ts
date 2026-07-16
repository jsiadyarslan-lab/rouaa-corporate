// ─── Refetch Images API ──────────────────────────────────────
// POST /api/infographics/refetch-images
// Admin endpoint: Batch regenerate AI images for infographics
// V5: GOLDEN RULE — Pollinations URLs ARE valid. Auto-publish when all images ready.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth-utils';
import { regenerateSlideImage, isValidImageUrl } from '@/lib/image-gen';
import fs from 'fs';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for batch AI image generation

export async function POST(request: NextRequest) {
  // Auth check
  try {
    const isAuth = await isAdminAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
  } catch (authErr: any) {
    return NextResponse.json({ error: 'خطأ في التحقق' }, { status: 401 });
  }

  // Parse optional body for single infographic or force flag
  let targetId: string | null = null;
  let forceRegenerate = false;
  try {
    const body = await request.json();
    targetId = body.infographicId || null;
    forceRegenerate = body.force || false;
  } catch {
    // No body — process all
  }

  // Fetch infographics (include unpublished — GOLDEN RULE: drafts may be waiting for images)
  const where = targetId ? { id: targetId } : {};
  const infographics = await db.infographic.findMany({
    where,
    select: { id: true, title: true, category: true, slides: true, isPublished: true },
  });

  console.log(`[Refetch-AI] Processing ${infographics.length} infographics (force=${forceRegenerate})...`);

  let totalUpdated = 0;
  let totalImagesGenerated = 0;
  const results: { id: string; title: string; imagesGenerated: number; errors: string[] }[] = [];

  for (const inf of infographics) {
    const slides = inf.slides as any[] || [];
    const category = inf.category || null;
    const errors: string[] = [];

    // Check which slides need images
    const slidesNeedingImages = slides.filter((s: any) => {
      const isNoImageType = s.type === 'recommendations' || s.type === 'summary';
      if (isNoImageType) return false;

      const position = s.image_position ?? s.content?.image_position;
      if (position === null) return false;

      const existingUrl = s.image_url || s.content?.image_url;

      if (forceRegenerate) return true; // Force regenerate all

      // V5: Need image if: no URL, or URL is invalid
      // Pollinations URLs ARE valid — don't regenerate them
      if (!existingUrl) return true;
      if (!isValidImageUrl(existingUrl)) return true;
      // Also regenerate if /tmp image was lost after Railway redeployment
      if (existingUrl.startsWith('/api/infographic-image?path=')) {
        try {
          const filename = existingUrl.split('path=')[1]?.split('&')[0];
          if (filename && !fs.existsSync(`/tmp/rouaa-infographics/${filename}`)) {
            return true;
          }
        } catch { /* skip */ }
      }

      return false;
    });

    if (slidesNeedingImages.length === 0) continue;

    console.log(`[Refetch-AI] "${inf.title?.slice(0, 50)}" — ${slidesNeedingImages.length} slides need AI images`);

    // Generate images for each slide
    for (const slide of slidesNeedingImages) {
      try {
        const result = await regenerateSlideImage(slide, category);
        if (result) {
          totalImagesGenerated++;
        } else {
          errors.push(`Slide ${slide.number || slide.type}: generation failed`);
        }
      } catch (err: any) {
        errors.push(`Slide ${slide.number || slide.type}: ${err.message?.slice(0, 80)}`);
      }
    }

    // V5: Count how many now have valid images (Pollinations URLs ARE valid)
    const imagesNow = slides.filter((s: any) => {
      const url = s.image_url || s.content?.image_url;
      return isValidImageUrl(url);
    }).length;

    // Update DB + auto-publish if all images are now ready (GOLDEN RULE)
    if (totalImagesGenerated > 0 || errors.length > 0) {
      try {
        // V5: Check if ALL slides that need images now have valid ones
        // Pollinations URLs ARE valid images
        const allSlidesWithImages = slides.every((s: any) => {
          const isNoImageType = s.type === 'recommendations' || s.type === 'summary';
          if (isNoImageType) return true;
          const position = s.image_position ?? s.content?.image_position;
          if (position === null) return true;
          const url = s.image_url || s.content?.image_url;
          return isValidImageUrl(url);
        });

        const shouldPublish = allSlidesWithImages && errors.length === 0;
        const updateData: any = { slides: slides };

        // GOLDEN RULE: Auto-publish draft if all images are now ready
        if (shouldPublish && !inf.isPublished) {
          updateData.isPublished = true;
          updateData.publishedAt = new Date();
          console.log(`[Refetch-AI] ✓ GOLDEN RULE: Publishing "${inf.title?.slice(0, 40)}" — all images ready`);
        }

        await db.infographic.update({
          where: { id: inf.id },
          data: updateData,
        });
        totalUpdated++;
        results.push({
          id: inf.id,
          title: inf.title,
          imagesGenerated: slidesNeedingImages.length - errors.length,

          errors: errors.length > 0 ? errors : [],
        });
      } catch (dbErr: any) {
        console.warn(`[Refetch-AI] DB update failed for "${inf.title?.slice(0, 30)}": ${dbErr.message}`);
      }
    }
  }

  console.log(`[Refetch-AI] Done: ${totalUpdated} infographics updated, ${totalImagesGenerated} AI images generated`);

  return NextResponse.json({
    success: true,
    processed: infographics.length,
    updated: totalUpdated,
    totalImagesGenerated,
    results,
  });
}
