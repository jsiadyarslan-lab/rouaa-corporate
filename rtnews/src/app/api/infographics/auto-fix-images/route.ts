// ─── Auto-Fix Images API ───────────────────────────────────
// POST /api/infographics/auto-fix-images
// PUBLIC endpoint (no admin auth required) to fix infographics with missing/broken images.
// V7: Also fixes UNPUBLISHED infographics and auto-publishes when all images are valid.
// V6: /api/infographic-image URLs are ALWAYS treated as invalid (ephemeral /tmp storage).
//     Fast fix: replace /tmp URLs with Pollinations URLs instantly (no image generation).
//     Slow fix: only if no image_prompt available, fall back to regeneration.
// GET /api/infographics/auto-fix-images
// Dry-run: check which infographics need image fixes.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isValidImageUrl, isPollinationsUrl, buildPollinationsUrl } from '@/lib/image-gen';

export const dynamic = 'force-dynamic';

// Default prompt for slides without a custom image_prompt
const DEFAULT_PROMPT = 'Professional financial infographic background, dark navy blue with abstract elements, gold accent, no text, ultra detailed, 8k';

/**
 * POST — Fix missing/broken infographic images.
 * PUBLIC endpoint (no admin auth required).
 * V6: Fast fix — replace /tmp URLs with Pollinations URLs instantly.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = Math.min(body.limit || 50, 200);
    const infographicId = body.infographicId; // optional: fix specific infographic

    // V7: Find ALL infographics (published AND unpublished) that may need image fixes
    const where: any = {};
    if (infographicId) where.id = infographicId;

    const infographics = await db.infographic.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        slides: true,
        isPublished: true,
      },
      take: limit,
    });

    const results: Array<{
      id: string;
      slug: string;
      status: 'already_valid' | 'fixed' | 'fixed_and_published' | 'failed';
      fixedSlides: number;
      method?: string;
      error?: string;
    }> = [];

    let fixedCount = 0;
    let validCount = 0;
    let failedCount = 0;
    let publishedCount = 0;

    for (const infographic of infographics) {
      const slides = (infographic.slides as any[]) || [];
      let needsUpdate = false;
      let fixedSlides = 0;
      let method = 'fast';

      for (const slide of slides) {
        const isNoImageType = slide.type === 'recommendations' || slide.type === 'summary';
        if (isNoImageType) continue;

        const position = slide.image_position ?? slide.content?.image_position;
        if (!position) continue;

        const imageUrl = slide.image_url || slide.content?.image_url;

        // V6: Use isValidImageUrl — /tmp URLs are now ALWAYS invalid
        if (isValidImageUrl(imageUrl)) continue;

        // Image is missing/invalid — FAST FIX: replace with Pollinations URL
        // Use existing image_prompt if available, otherwise use default
        const prompt = slide.image_prompt || slide.content?.image_prompt || DEFAULT_PROMPT;
        const pollinationsUrl = buildPollinationsUrl(prompt);

        slide.image_url = pollinationsUrl;
        if (slide.content) slide.content.image_url = pollinationsUrl;
        needsUpdate = true;
        fixedSlides++;
      }

      // V7: Check if ALL slides now have valid images — auto-publish if ready
      const allSlidesReady = slides.every((s: any) => {
        const isNoImageType = s.type === 'recommendations' || s.type === 'summary';
        if (isNoImageType) return true;
        const position = s.image_position ?? s.content?.image_position;
        if (!position) return true;
        const url = s.image_url || s.content?.image_url;
        return isValidImageUrl(url);
      });

      const shouldPublish = allSlidesReady && !infographic.isPublished;

      if (needsUpdate) {
        try {
          const updateData: any = { slides: slides };
          if (shouldPublish) {
            updateData.isPublished = true;
            updateData.publishedAt = new Date();
          }
          await db.infographic.update({
            where: { id: infographic.id },
            data: updateData,
          });
          results.push({
            id: infographic.id,
            slug: infographic.slug,
            status: shouldPublish ? 'fixed_and_published' : 'fixed',
            fixedSlides,
            method,
          });
          if (shouldPublish) publishedCount++;
          fixedCount++;
        } catch (err: any) {
          results.push({
            id: infographic.id,
            slug: infographic.slug,
            status: 'failed',
            fixedSlides: 0,
            error: err.message,
          });
          failedCount++;
        }
      } else {
        results.push({
          id: infographic.id,
          slug: infographic.slug,
          status: 'already_valid',
          fixedSlides: 0,
        });
        validCount++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: infographics.length,
        alreadyValid: validCount,
        fixed: fixedCount,
        failed: failedCount,
        autoPublished: publishedCount,
      },
      results,
    });
  } catch (error: any) {
    console.error('[infographics/auto-fix-images] Error:', error.message);
    return NextResponse.json(
      { error: 'فشل في إصلاح الصور', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET — Dry-run: check which infographics need image fixes.
 * PUBLIC endpoint — no admin auth required.
 */
export async function GET(request: NextRequest) {
  try {
    const infographics = await db.infographic.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        slug: true,
        title: true,
        slides: true,
      },
    });

    let needsFix = 0;
    let valid = 0;
    let pollinationsCount = 0;
    let tmpCount = 0;
    const needsFixList: Array<{ id: string; slug: string; title: string; missingSlides: number; tmpSlides: number }> = [];

    for (const ig of infographics) {
      const slides = (ig.slides as any[]) || [];
      let missingCount = 0;
      let tmpSlides = 0;
      let hasPollinations = false;

      for (const slide of slides) {
        const isNoImageType = slide.type === 'recommendations' || slide.type === 'summary';
        if (isNoImageType) continue;

        const position = slide.image_position ?? slide.content?.image_position;
        if (!position) continue;

        const imageUrl = slide.image_url || slide.content?.image_url;
        if (isPollinationsUrl(imageUrl)) hasPollinations = true;
        if (imageUrl?.startsWith('/api/infographic-image?path=')) tmpSlides++;

        if (!isValidImageUrl(imageUrl)) {
          missingCount++;
        }
      }

      if (hasPollinations) pollinationsCount++;
      if (tmpSlides > 0) tmpCount++;

      if (missingCount > 0) {
        needsFix++;
        needsFixList.push({
          id: ig.id,
          slug: ig.slug,
          title: ig.title,
          missingSlides: missingCount,
          tmpSlides,
        });
      } else {
        valid++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: infographics.length,
        valid,
        needsFix,
        pollinationsCount,
        tmpCount,
      },
      needsFix: needsFixList,
    });
  } catch (error: any) {
    console.error('[infographics/auto-fix-images GET] Error:', error.message);
    return NextResponse.json(
      { error: 'فشل في فحص الصور' },
      { status: 500 }
    );
  }
}
