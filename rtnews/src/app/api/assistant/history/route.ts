// ─── Chat History API ───────────────────────────────────────────
// GET  /api/assistant/history — Load chat sessions for logged-in user
// POST /api/assistant/history — Save a message to a chat session
// DELETE /api/assistant/history — Clear chat history for user

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';

export const dynamic = 'force-dynamic';

// ── Ensure chat tables exist (safety net) ──
let tablesVerified = false;
async function ensureChatTables() {
  if (tablesVerified) return;
  try {
    await db.$queryRaw`SELECT 1 FROM chat_sessions LIMIT 1`;
    tablesVerified = true;
  } catch {
    console.log('[History API] chat_sessions table missing — creating it...');
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id TEXT PRIMARY KEY,
          "userId" TEXT,
          locale TEXT NOT NULL DEFAULT 'ar',
          title TEXT,
          "pageUrl" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          "sessionId" TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          "toolCalls" TEXT,
          "toolResults" TEXT,
          sources TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT chat_messages_sessionId_fkey FOREIGN KEY ("sessionId") REFERENCES chat_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS chat_sessions_userId_idx ON chat_sessions("userId")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS chat_messages_sessionId_idx ON chat_messages("sessionId")`);
      console.log('[History API] ✓ chat_sessions & chat_messages tables created');
      tablesVerified = true;
    } catch (createErr: any) {
      console.error('[History API] Failed to create chat tables:', createErr.message);
    }
  }
}

// ─── GET: Load chat history ────────────────────────────────────

export async function GET(request: Request) {
  try {
    // Ensure chat tables exist
    await ensureChatTables();

    // Check authentication
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authSession.user.id;
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    console.log('[History API] GET: userId:', userId.slice(0,8), 'sessionId:', sessionId || 'all');

    // Handle "current" — load the most recent session
    if (sessionId === 'current') {
      const latestSession = await db.chatSession.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!latestSession) {
        console.log('[History API] GET current: No sessions found for user');
        return NextResponse.json({ session: null });
      }

      console.log('[History API] GET current: Found session', latestSession.id.slice(0,8), 'with', latestSession.messages.length, 'messages');

      return NextResponse.json({
        session: {
          id: latestSession.id,
          title: latestSession.title,
          locale: latestSession.locale,
          createdAt: latestSession.createdAt,
          updatedAt: latestSession.updatedAt,
          messages: latestSession.messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            sources: m.sources ? JSON.parse(m.sources) : undefined,
            toolCalls: m.toolCalls ? JSON.parse(m.toolCalls) : undefined,
            createdAt: m.createdAt,
          })),
        },
      });
    }

    // Handle specific session ID
    if (sessionId) {
      const chatSession = await db.chatSession.findFirst({
        where: { id: sessionId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!chatSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      return NextResponse.json({
        session: {
          id: chatSession.id,
          title: chatSession.title,
          locale: chatSession.locale,
          createdAt: chatSession.createdAt,
          updatedAt: chatSession.updatedAt,
          messages: chatSession.messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            sources: m.sources ? JSON.parse(m.sources) : undefined,
            toolCalls: m.toolCalls ? JSON.parse(m.toolCalls) : undefined,
            createdAt: m.createdAt,
          })),
        },
      });
    }

    // No sessionId — load all sessions for the user (most recent first)
    const sessions = await db.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1, // Just get the first message for preview/title
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    console.log('[History API] GET all: Returning', sessions.length, 'sessions for user', userId.slice(0,8));
    return NextResponse.json({
      sessions: sessions.map(s => ({
        id: s.id,
        title: s.title || (s.messages[0]?.content?.slice(0, 60) || ''),
        locale: s.locale,
        messageCount: s._count.messages,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('[History API] GET error:', error);
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
  }
}

// ─── POST: Save message ────────────────────────────────────────

const SaveMessageSchema = z.object({
  sessionId: z.string().optional(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  sources: z.array(z.string()).optional(),
  toolsUsed: z.array(z.string()).optional(),
  locale: z.enum(['ar', 'en', 'fr', 'tr', 'es']).optional(),
});

export async function POST(request: Request) {
  try {
    // Ensure chat tables exist
    await ensureChatTables();

    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
      console.warn('[History API] POST: Unauthorized — no session or user.id');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authSession.user.id;
    const body = await request.json();
    const parsed = SaveMessageSchema.safeParse(body);

    if (!parsed.success) {
      console.warn('[History API] POST: Invalid input:', (parsed as any).error.errors);
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { sessionId, role, content, sources, toolsUsed, locale } = parsed.data;

    let chatSession;

    if (sessionId) {
      // Add to existing session
      chatSession = await db.chatSession.findFirst({
        where: { id: sessionId, userId },
      });
      if (!chatSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    } else {
      // Create new session
      const title = role === 'user'
        ? content.slice(0, 100)
        : 'محادثة جديدة';
      chatSession = await db.chatSession.create({
        data: {
          userId,
          locale: locale || 'ar',
          title,
          pageUrl: '',
        },
      });
    }

    // Save the message
    const message = await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role,
        content,
        sources: sources ? JSON.stringify(sources) : null,
        toolCalls: toolsUsed ? JSON.stringify(toolsUsed) : null,
      },
    });

    // Update session's updatedAt
    await db.chatSession.update({
      where: { id: chatSession.id },
      data: { updatedAt: new Date() },
    });

    console.log('[History API] POST: Message saved — sessionId:', chatSession.id, 'messageId:', message.id, 'role:', role);

    return NextResponse.json({
      sessionId: chatSession.id,
      messageId: message.id,
      createdAt: message.createdAt,
    });
  } catch (error: any) {
    console.error('[History API] POST error:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}

// ─── DELETE: Clear history ─────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authSession.user.id;
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (sessionId) {
      // Delete specific session
      await db.chatSession.deleteMany({
        where: { id: sessionId, userId },
      });
    } else {
      // Delete all sessions for this user
      await db.chatSession.deleteMany({
        where: { userId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[History API] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 });
  }
}
