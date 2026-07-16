// ─── Single Infographic API ────────────────────────────────
// GET /api/infographics/[id] — Get single infographic
// PATCH /api/infographics/[id] — Update (publish/unpublish/edit slides)
// DELETE /api/infographics/[id] — Delete infographic
// V5: GOLDEN RULE — Pollinations URLs are accepted as valid image URLs

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth-utils';
import { isValidImageUrl } from '@/lib/image-gen';

export const dynamic = 'force-dynamic';

// GET — Public: fetch single infographic by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const infographic = await db.infographic.findUnique({
      where: { id },
    });

    if (!infographic) {
      return NextResponse.json({ error: 'الإنفوغرافيك غير موجود' }, { status: 404 });
    }

    // Only published infographics are publicly accessible (unless admin)
    if (!infographic.isPublished) {
      const isAdmin = await isAdminAuthenticated(request);
      if (!isAdmin) {
        return NextResponse.json({ error: 'الإنفوغرافيك غير منشور' }, { status: 403 });
      }
    }

    // Increment view count
    await db.infographic.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(infographic);
  } catch (error: any) {
    console.error('[Infographic] GET error:', error.message);
    return NextResponse.json({ error: 'فشل تحميل الإنفوغرافيك' }, { status: 500 });
  }
}

// PATCH — Admin: publish/unpublish/edit
// V2: GOLDEN RULE — cannot publish infographic without all required images
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};

    if (typeof body.isPublished === 'boolean') {
      if (body.isPublished) {
        // GOLDEN RULE V5: Verify all required images exist before publishing
        // Pollinations URLs ARE valid — they're always accessible via CDN
        const infographic = await db.infographic.findUnique({
          where: { id },
          select: { slides: true },
        });
        if (infographic) {
          const slides = (infographic.slides as any[]) || [];
          const missingImages = slides.filter(s => {
            const isNoImageType = s.type === 'recommendations' || s.type === 'summary';
            if (isNoImageType) return false;
            const position = s.image_position ?? s.content?.image_position;
            if (position === null || position === undefined) return false;
            const url = s.image_url || s.content?.image_url;
            // V5: Use isValidImageUrl — Pollinations URLs ARE valid
            return !isValidImageUrl(url);
          });

          if (missingImages.length > 0) {
            return NextResponse.json({
              error: `لا يمكن النشر — ${missingImages.length} شرائح بدون صور. قم بتوليد الصور أولاً.`,
              missingSlides: missingImages.map((s: any) => ({ number: s.number, type: s.type })),
            }, { status: 400 });
          }
        }
        updateData.isPublished = true;
        updateData.publishedAt = new Date();
      } else {
        updateData.isPublished = false;
      }
    }

    if (body.title) updateData.title = body.title;
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle;
    if (body.slides) updateData.slides = body.slides;
    if (body.category) updateData.category = body.category;

    const updated = await db.infographic.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[Infographic] PATCH error:', error.message);
    return NextResponse.json({ error: 'فشل تحديث الإنفوغرافيك' }, { status: 500 });
  }
}

// DELETE — Admin: delete infographic
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await db.infographic.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Infographic] DELETE error:', error.message);
    return NextResponse.json({ error: 'فشل حذف الإنفوغرافيك' }, { status: 500 });
  }
}
