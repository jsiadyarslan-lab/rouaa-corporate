// ─── Community Replies API ────────────────────────────────────
// CRUD for discussion replies

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizePromptInput } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

// GET: List replies for a discussion
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const discussionId = searchParams.get('discussionId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!discussionId) {
      return NextResponse.json({ error: 'معرف المناقشة مطلوب' }, { status: 400 });
    }

    const [replies, total] = await Promise.all([
      db.discussionReply.findMany({
        where: { discussionId },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, image: true, role: true } },
        },
      }),
      db.discussionReply.count({ where: { discussionId } }),
    ]);

    return NextResponse.json({ replies, total, page, limit });
  } catch (error: any) {
    console.error('[Community Replies] GET error:', error.message);
    return NextResponse.json({ error: 'حدث خطأ في المعالجة' }, { status: 500 });
  }
}

// POST: Create a reply
export async function POST(request: Request) {
  try {
    const { discussionId, userId, content } = await request.json();

    if (!discussionId || !userId || !content) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    if (content.length < 5) {
      return NextResponse.json({ error: 'الرد قصير جداً (5 أحرف على الأقل)' }, { status: 400 });
    }

    // Check discussion exists and isn't locked
    const discussion = await db.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) {
      return NextResponse.json({ error: 'المناقشة غير موجودة' }, { status: 404 });
    }
    if (discussion.isLocked) {
      return NextResponse.json({ error: 'المناقشة مغلقة، لا يمكن إضافة ردود' }, { status: 403 });
    }

    const reply = await db.discussionReply.create({
      data: {
        discussionId,
        userId,
        content: sanitizePromptInput(content).slice(0, 3000),
      },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    // Increment reply count on the discussion
    await db.discussion.update({
      where: { id: discussionId },
      data: { replyCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, reply });
  } catch (error: any) {
    console.error('[Community Replies] POST error:', error.message);
    return NextResponse.json({ error: 'حدث خطأ في المعالجة' }, { status: 500 });
  }
}

// PATCH: Upvote or accept a reply
export async function PATCH(request: Request) {
  try {
    const { id, action } = await request.json();
    if (!id || !action) {
      return NextResponse.json({ error: 'بيانات غير كاملة' }, { status: 400 });
    }

    const reply = await db.discussionReply.findUnique({ where: { id } });
    if (!reply) {
      return NextResponse.json({ error: 'الرد غير موجود' }, { status: 404 });
    }

    let data: any = {};
    switch (action) {
      case 'upvote': data = { upvotes: { increment: 1 } }; break;
      case 'accept': data = { isAccepted: true }; break;
      case 'unaccept': data = { isAccepted: false }; break;
      default: return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
    }

    const updated = await db.discussionReply.update({ where: { id }, data });
    return NextResponse.json({ success: true, reply: updated });
  } catch (error: any) {
    console.error('[Community Replies] PATCH error:', error.message);
    return NextResponse.json({ error: 'حدث خطأ في المعالجة' }, { status: 500 });
  }
}

// DELETE: Delete a reply
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف الرد مطلوب' }, { status: 400 });
    }

    const reply = await db.discussionReply.findUnique({ where: { id } });
    if (!reply) {
      return NextResponse.json({ error: 'الرد غير موجود' }, { status: 404 });
    }

    await db.discussionReply.delete({ where: { id } });

    // Decrement reply count
    await db.discussion.update({
      where: { id: reply.discussionId },
      data: { replyCount: { decrement: 1 } },
    }).catch(err => console.error('[Replies V156] Failed to decrement reply count:', err instanceof Error ? err.message : err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Community Replies] DELETE error:', error.message);
    return NextResponse.json({ error: 'حدث خطأ في المعالجة' }, { status: 500 });
  }
}
