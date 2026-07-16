// ─── Telegram Preferences API ─────────────────────────────────
// GET: Get notification preferences for a chatId
// PUT: Update notification preferences for a chatId

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface NotificationPrefs {
  breaking: boolean;
  analysis: boolean;
  price: boolean;
  calendar: boolean;
  daily: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  breaking: true,
  analysis: true,
  price: false,
  calendar: false,
  daily: false,
};

function parsePrefs(jsonStr: string | null | undefined): NotificationPrefs {
  if (!jsonStr) return { ...DEFAULT_PREFS };
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      breaking: parsed.breaking !== undefined ? !!parsed.breaking : DEFAULT_PREFS.breaking,
      analysis: parsed.analysis !== undefined ? !!parsed.analysis : DEFAULT_PREFS.analysis,
      price: parsed.price !== undefined ? !!parsed.price : DEFAULT_PREFS.price,
      calendar: parsed.calendar !== undefined ? !!parsed.calendar : DEFAULT_PREFS.calendar,
      daily: parsed.daily !== undefined ? !!parsed.daily : DEFAULT_PREFS.daily,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

// ─── GET: Retrieve preferences ────────────────────────────────
export async function GET(request: Request) {
  try {
    // Admin authentication required
    const cookieHeader = request.headers.get('cookie') || '';
    const adminTokenMatch = cookieHeader.match(/admin_token=([^;]+)/);
    const adminToken = adminTokenMatch?.[1];
    if (!adminToken) {
      return NextResponse.json({ error: 'غير مصرح — سجّل الدخول أولاً' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'معرّف المحادثة (chatId) مطلوب' },
        { status: 400 }
      );
    }

    const account = await db.telegramAccount.findUnique({
      where: { telegramChatId: chatId },
    });

    if (!account) {
      // Return default prefs for new users
      return NextResponse.json({
        prefs: DEFAULT_PREFS,
        isConnected: false,
        username: null,
      });
    }

    const prefs = parsePrefs(account.notificationPrefs);

    return NextResponse.json({
      prefs,
      isConnected: account.isConnected,
      username: account.telegramUsername,
      userId: account.userId,
    });
  } catch (error: any) {
    console.error('[Telegram Preferences] GET error:', error.message);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب التفضيلات', prefs: DEFAULT_PREFS },
      { status: 500 }
    );
  }
}

// ─── PUT: Update preferences ──────────────────────────────────
export async function PUT(request: Request) {
  try {
    // Admin authentication required
    const cookieHeader = request.headers.get('cookie') || '';
    const adminTokenMatch = cookieHeader.match(/admin_token=([^;]+)/);
    const adminToken = adminTokenMatch?.[1];
    if (!adminToken) {
      return NextResponse.json({ error: 'غير مصرح — سجّل الدخول أولاً' }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, prefs } = body as {
      chatId?: string;
      prefs?: Partial<NotificationPrefs>;
    };

    if (!chatId) {
      return NextResponse.json(
        { error: 'معرّف المحادثة (chatId) مطلوب' },
        { status: 400 }
      );
    }

    if (!prefs || typeof prefs !== 'object') {
      return NextResponse.json(
        { error: 'التفضيلات (prefs) مطلوبة' },
        { status: 400 }
      );
    }

    // Find or create the account
    let account = await db.telegramAccount.findUnique({
      where: { telegramChatId: chatId },
    });

    if (!account) {
      // Create account with the provided prefs
      const mergedPrefs: NotificationPrefs = { ...DEFAULT_PREFS, ...prefs };
      account = await db.telegramAccount.create({
        data: {
          userId: `tg_${chatId}`,
          telegramChatId: chatId,
          notificationPrefs: JSON.stringify(mergedPrefs),
          isConnected: true,
        },
      });
    } else {
      // Merge with existing prefs
      const currentPrefs = parsePrefs(account.notificationPrefs);
      const mergedPrefs: NotificationPrefs = { ...currentPrefs, ...prefs };

      await db.telegramAccount.update({
        where: { id: account.id },
        data: { notificationPrefs: JSON.stringify(mergedPrefs) },
      });
    }

    const updatedPrefs = parsePrefs(
      (await db.telegramAccount.findUnique({ where: { id: account.id } }))?.notificationPrefs
    );

    return NextResponse.json({
      success: true,
      prefs: updatedPrefs,
    });
  } catch (error: any) {
    console.error('[Telegram Preferences] PUT error:', error.message);

    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'الحساب موجود بالفعل' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ التفضيلات' },
      { status: 500 }
    );
  }
}
