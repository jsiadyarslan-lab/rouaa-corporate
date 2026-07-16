// ─── Admin Community API V47 ──────────────────────────────────
// Standardized auth + sanitized error responses + input validation
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, apiError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'users';

    if (type === 'users') {
      const users = await db.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      return NextResponse.json({ users });
    }

    if (type === 'subscribers') {
      const subscribers = await db.newsletterSubscriber.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ subscribers });
    }

    if (type === 'messages') {
      const messages = await db.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ messages });
    }

    return NextResponse.json({ error: 'نوع غير صالح' }, { status: 400 });
  } catch (err) {
    return apiError(err, 'جلب بيانات المجتمع');
  }
}

// PUT: Update status (e.g. mark message as read, or user role)
export async function PUT(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  try {
    const data = await req.json();
    const { id, type, ...updateData } = data;

    if (!id || !type) {
      return NextResponse.json({ error: 'المعرّف والنوع مطلوبان' }, { status: 400 });
    }

    // V47: Validate allowed update fields per type to prevent mass assignment
    if (type === 'message') {
      const allowedFields = ['status'];
      const filteredData: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (updateData[key] !== undefined) filteredData[key] = updateData[key];
      }
      await db.contactMessage.update({
        where: { id: String(id) },
        data: filteredData,
      });
    } else if (type === 'user') {
      const allowedFields = ['role', 'name'];
      const filteredData: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (updateData[key] !== undefined) filteredData[key] = updateData[key];
      }
      // V47: Log role changes for audit
      if (updateData.role) {
        console.log(`[Community API] User role change: ${id} → ${updateData.role} at ${new Date().toISOString()}`);
      }
      await db.user.update({
        where: { id: String(id) },
        data: filteredData,
      });
    } else if (type === 'subscriber') {
      const allowedFields = ['status'];
      const filteredData: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (updateData[key] !== undefined) filteredData[key] = updateData[key];
      }
      await db.newsletterSubscriber.update({
        where: { id: String(id) },
        data: filteredData,
      });
    } else {
      return NextResponse.json({ error: 'نوع غير صالح' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, 'تحديث بيانات المجتمع');
  }
}

// DELETE: Delete a record by type and id
export async function DELETE(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'نوع ومعرّف السجل مطلوبان' }, { status: 400 });
    }

    if (type === 'message') {
      await db.contactMessage.delete({ where: { id } });
    } else if (type === 'user') {
      await db.user.delete({ where: { id } });
    } else if (type === 'subscriber') {
      await db.newsletterSubscriber.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: 'نوع غير صالح' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, 'حذف سجل');
  }
}
