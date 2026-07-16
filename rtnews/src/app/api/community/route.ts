// ─── Community API ───────────────────────────────────────────
// Discussions, replies, upvotes for the community section

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizePromptInput } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

// GET: List discussions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const sort = searchParams.get('sort') || 'recent'; // recent | popular | pinned

    const where: any = {};
    if (category && category !== 'all') where.category = category;

    const orderBy = sort === 'popular'
      ? { upvotes: 'desc' as const }
      : sort === 'pinned'
        ? [{ isPinned: 'desc' as const }, { createdAt: 'desc' as const }]
        : { createdAt: 'desc' as const };

    const [discussions, total] = await Promise.all([
      db.discussion.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, image: true, role: true } },
          _count: { select: { replies: true } },
        },
      }),
      db.discussion.count({ where }),
    ]);

    return NextResponse.json({
      discussions: discussions.map(d => ({
        ...d,
        replyCount: d._count.replies,
        _count: undefined,
      })),
      total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('[Community] GET error:', error.message);
    return NextResponse.json({ error: 'حدث خطأ في المعالجة' }, { status: 500 });
  }
}

// POST: Create discussion
export async function POST(request: Request) {
  try {
    const { userId, title, content, category, tags } = await request.json();

    if (!userId || !title || !content) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    if (content.length < 20) {
      return NextResponse.json({ error: 'المحتوى قصير جداً (20 حرف على الأقل)' }, { status: 400 });
    }

    const validCategories = ['general', 'analysis', 'question', 'idea'];
    const discussion = await db.discussion.create({
      data: {
        userId,
        title: sanitizePromptInput(title).slice(0, 300),
        content: sanitizePromptInput(content).slice(0, 5000),
        category: validCategories.includes(category) ? category : 'general',
        tags: JSON.stringify(Array.isArray(tags) ? tags.slice(0, 5) : []),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ success: true, discussion });
  } catch (error: any) {
    console.error('[Community] POST error:', error.message);
    return NextResponse.json({ error: 'حدث خطأ في المعالجة' }, { status: 500 });
  }
}

// PATCH: Upvote/downvote/pin/lock discussion
export async function PATCH(request: Request) {
  try {
    const { id, action } = await request.json();
    if (!id || !action) {
      return NextResponse.json({ error: 'بيانات غير كاملة' }, { status: 400 });
    }

    const discussion = await db.discussion.findUnique({ where: { id } });
    if (!discussion) {
      return NextResponse.json({ error: 'المناقشة غير موجودة' }, { status: 404 });
    }

    let data: any = {};
    switch (action) {
      case 'upvote': data = { upvotes: { increment: 1 } }; break;
      case 'downvote': data = { downvotes: { increment: 1 } }; break;
      case 'pin': data = { isPinned: true }; break;
      case 'unpin': data = { isPinned: false }; break;
      case 'lock': data = { isLocked: true }; break;
      case 'unlock': data = { isLocked: false }; break;
      default: return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
    }

    const updated = await db.discussion.update({ where: { id }, data });
    return NextResponse.json({ success: true, discussion: updated });
  } catch (error: any) {
    console.error('[Community] PATCH error:', error.message);
    return NextResponse.json({ error: 'حدث خطأ في المعالجة' }, { status: 500 });
  }
}
