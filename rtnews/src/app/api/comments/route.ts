// ─── Comments API Route (Enhanced) V156 ────────────────────────────
// GET: List comments for an article (with sorting & search)
// POST: Add a new comment (stored in DB, depth-limited to 2 levels)
// PUT: Upvote / Downvote / Report a comment
// V156: Fixed SQL injection in GET (parameterized newsId, whitelist orderBy)
// V156: Replaced .catch(() => {}) with proper error logging

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ── Helper: try to add missing columns ──
let columnsEnsured = false;
async function ensureColumns() {
  if (columnsEnsured) return;
  try {
    // Try to add new columns if they don't exist (PostgreSQL)
    const alters = [
      `ALTER TABLE comments ADD COLUMN IF NOT EXISTS downvotes INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE comments ADD COLUMN IF NOT EXISTS reports INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE comments ADD COLUMN IF NOT EXISTS isExpert BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE comments ADD COLUMN IF NOT EXISTS depth INTEGER NOT NULL DEFAULT 0`,
    ];
    for (const sql of alters) {
      await db.$executeRawUnsafe(sql);
    }
  } catch {
    // Columns may already exist or DB not available — that's fine
  }
  columnsEnsured = true;
}

// ── Helper: get parent depth ──
async function getParentDepth(parentId: string | null): Promise<number> {
  if (!parentId) return 0;
  try {
    const rows = await db.$queryRaw`SELECT depth FROM comments WHERE id = ${parentId}` as any[];
    return rows?.[0]?.depth ?? 0;
  } catch {
    return 0;
  }
}

// GET /api/comments?newsId=xxx&sort=newest|oldest|most_upvoted&search=xxx
export async function GET(request: Request) {
  try {
    await ensureColumns();
    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get('newsId');
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search') || '';

    if (!newsId) {
      return NextResponse.json({ error: 'newsId is required' }, { status: 400 });
    }

    try {
      let comments: any[];

      if (search) {
        // Search within comments for this article
        comments = await db.$queryRaw`
          SELECT id, "newsId", content, "authorName", "parentId", upvotes, downvotes, reports, "isExpert", depth, "createdAt"
          FROM comments
          WHERE "newsId" = ${newsId} AND content ILIKE ${'%' + search + '%'}
          ORDER BY "createdAt" DESC
        ` as any[];
      } else {
        // V156: Whitelist-based ORDER BY to prevent SQL injection
        const ORDER_BY_MAP: Record<string, string> = {
          newest: '"createdAt" DESC',
          oldest: '"createdAt" ASC',
          most_upvoted: 'upvotes DESC, "createdAt" DESC',
        };
        const safeOrderBy = ORDER_BY_MAP[sort] || '"createdAt" DESC';

        // V156: Use parameterized query ($1) for newsId + whitelist for ORDER BY
        // newsId is now a proper PostgreSQL parameter, not string-interpolated
        // safeOrderBy is guaranteed safe (only 3 possible whitelisted values)
        comments = await db.$queryRawUnsafe(
          `SELECT id, "newsId", content, "authorName", "parentId", upvotes, downvotes, reports, "isExpert", depth, "createdAt"
           FROM comments
           WHERE "newsId" = $1
           ORDER BY ${safeOrderBy}`,
          newsId
        ) as any[];
      }

      // Normalize missing columns
      comments = comments.map((c: any) => ({
        ...c,
        downvotes: c.downvotes ?? 0,
        reports: c.reports ?? 0,
        isExpert: c.isExpert ?? false,
        depth: c.depth ?? 0,
      }));

      const rootComments = comments.filter((c: any) => !c.parentId);
      const buildReplies = (parentId: string): any[] => {
        return comments
          .filter((c: any) => c.parentId === parentId)
          .map((c: any) => ({
            ...c,
            replies: buildReplies(c.id),
          }));
      };

      const tree = rootComments.map((c: any) => ({
        ...c,
        replies: buildReplies(c.id),
      }));

      return NextResponse.json({ comments: tree, total: comments.length });
    } catch (dbError: any) {
      console.warn('[CommentsAPI] DB query failed (table may not exist):', dbError.message);
      return NextResponse.json({ comments: [], total: 0 });
    }
  } catch (error: any) {
    console.error('[CommentsAPI] GET error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/comments
export async function POST(request: Request) {
  try {
    await ensureColumns();
    const body = await request.json();
    const { newsId, content, authorName, parentId, isExpert } = body;

    if (!newsId || !content || !authorName) {
      return NextResponse.json({ error: 'newsId, content, and authorName are required' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'التعليق طويل جداً (الحد الأقصى 1000 حرف)' }, { status: 400 });
    }

    if (content.trim().length < 3) {
      return NextResponse.json({ error: 'التعليق قصير جداً' }, { status: 400 });
    }

    // Check depth limit (max 2 levels of nesting)
    const parentDepth = await getParentDepth(parentId || null);
    if (parentDepth >= 2) {
      return NextResponse.json({ error: 'لا يمكن الرد على أكثر من مستويين' }, { status: 400 });
    }

    const newDepth = parentId ? parentDepth + 1 : 0;

    const article = await db.newsItem.findUnique({ where: { id: newsId } });
    if (!article) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    }

    try {
      const comment = await db.$queryRaw`
        INSERT INTO comments (id, "newsId", content, "authorName", "parentId", upvotes, downvotes, reports, "isExpert", depth, "createdAt")
        VALUES (gen_random_uuid(), ${newsId}, ${content.trim()}, ${authorName.trim()}, ${parentId || null}, 0, 0, 0, ${isExpert || false}, ${newDepth}, NOW())
        RETURNING id, "newsId", content, "authorName", "parentId", upvotes, downvotes, reports, "isExpert", depth, "createdAt"
      ` as any[];

      return NextResponse.json({ comment: comment[0] }, { status: 201 });
    } catch (dbError: any) {
      console.error('[CommentsAPI] Insert failed:', dbError.message);
      // Fallback: try without new columns
      try {
        const comment = await db.$queryRaw`
          INSERT INTO comments (id, "newsId", content, "authorName", "parentId", upvotes, "createdAt")
          VALUES (gen_random_uuid(), ${newsId}, ${content.trim()}, ${authorName.trim()}, ${parentId || null}, 0, NOW())
          RETURNING id, "newsId", content, "authorName", "parentId", upvotes, "createdAt"
        ` as any[];
        return NextResponse.json({ comment: { ...comment[0], downvotes: 0, reports: 0, isExpert: false, depth: newDepth } }, { status: 201 });
      } catch (fbError: any) {
        console.error('[CommentsAPI] Fallback insert also failed:', fbError.message);
        return NextResponse.json({ error: 'نظام التعليقات قيد التجهيز. حاول مرة أخرى لاحقاً.' }, { status: 503 });
      }
    }
  } catch (error: any) {
    console.error('[CommentsAPI] POST error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/comments — Upvote / Downvote / Report
export async function PUT(request: Request) {
  try {
    await ensureColumns();
    const body = await request.json();
    const { commentId, action } = body;

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
    }

    const validAction = action || 'upvote';

    try {
      if (validAction === 'upvote') {
        await db.$queryRaw`UPDATE comments SET upvotes = upvotes + 1 WHERE id = ${commentId}`;
      } else if (validAction === 'downvote') {
        await db.$executeRawUnsafe(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS downvotes INTEGER NOT NULL DEFAULT 0`).catch(err => console.error('[Comments V156] ALTER TABLE downvotes failed:', err instanceof Error ? err.message : err));
        await db.$queryRaw`UPDATE comments SET downvotes = downvotes + 1 WHERE id = ${commentId}`;
      } else if (validAction === 'report') {
        await db.$executeRawUnsafe(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS reports INTEGER NOT NULL DEFAULT 0`).catch(err => console.error('[Comments V156] ALTER TABLE reports failed:', err instanceof Error ? err.message : err));
        await db.$queryRaw`UPDATE comments SET reports = reports + 1 WHERE id = ${commentId}`;
      } else {
        return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
      }
      return NextResponse.json({ success: true, action: validAction });
    } catch (dbError: any) {
      // Fallback for upvote (original behavior)
      if (validAction === 'upvote') {
        try {
          await db.$queryRaw`UPDATE comments SET upvotes = upvotes + 1 WHERE id = ${commentId}`;
          return NextResponse.json({ success: true });
        } catch {}
      }
      return NextResponse.json({ error: 'فشل تنفيذ الإجراء' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
