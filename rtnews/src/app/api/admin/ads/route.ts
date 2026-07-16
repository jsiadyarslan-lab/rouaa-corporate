// ─── Admin Ads API V47 ──────────────────────────────────────
// Standardized auth + sanitized error responses
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, apiError, validateRequired } from '@/lib/api-utils';

// GET: Fetch all advertisements
export async function GET(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  try {
    const ads = await db.advertisement.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ads });
  } catch (err) {
    return apiError(err, 'جلب الإعلانات');
  }
}

// POST: Create a new advertisement
export async function POST(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  try {
    const data = await req.json();

    const validationErr = validateRequired(data, ['title', 'imageUrl']);
    if (validationErr) {
      return NextResponse.json({ error: validationErr }, { status: 400 });
    }

    const ad = await db.advertisement.create({
      data: {
        title: String(data.title),
        imageUrl: String(data.imageUrl),
        targetUrl: data.targetUrl ? String(data.targetUrl) : null,
        position: data.position || 'sidebar',
        isActive: data.isActive ?? true,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
    return NextResponse.json({ ad });
  } catch (err) {
    return apiError(err, 'إنشاء إعلان');
  }
}

// PUT: Update an existing advertisement
export async function PUT(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  try {
    const data = await req.json();
    const { id, ...updateData } = data;

    if (!id) return NextResponse.json({ error: 'معرّف الإعلان مطلوب' }, { status: 400 });

    const ad = await db.advertisement.update({
      where: { id: String(id) },
      data: {
        ...updateData,
        endDate: updateData.endDate ? new Date(updateData.endDate) : null,
      },
    });
    return NextResponse.json({ ad });
  } catch (err) {
    return apiError(err, 'تحديث إعلان');
  }
}

// DELETE: Remove an advertisement
export async function DELETE(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'معرّف الإعلان مطلوب' }, { status: 400 });

    await db.advertisement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, 'حذف إعلان');
  }
}
