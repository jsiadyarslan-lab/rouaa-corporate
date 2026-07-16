// ─── Telegram Notify API ──────────────────────────────────────
// POST: Send notifications to all subscribed Telegram accounts
// Requires admin authentication via ADMIN_SECRET header

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTelegramMessage } from '@/lib/telegram-bot';

export const dynamic = 'force-dynamic';

type NotificationType = 'breaking' | 'analysis' | 'price' | 'calendar' | 'daily';

const VALID_TYPES: NotificationType[] = ['breaking', 'analysis', 'price', 'calendar', 'daily'];

// ─── Rate limiting for notify endpoint ────────────────────────
const notifyRateLimits = new Map<string, { count: number; resetTime: number }>();
const NOTIFY_RATE_LIMIT_WINDOW = 60_000; // 1 minute
const NOTIFY_RATE_LIMIT_MAX = 10; // 10 notify calls per minute

function checkNotifyRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = notifyRateLimits.get(key);

  if (!entry || now > entry.resetTime) {
    notifyRateLimits.set(key, { count: 1, resetTime: now + NOTIFY_RATE_LIMIT_WINDOW });
    return true;
  }

  entry.count++;
  return entry.count <= NOTIFY_RATE_LIMIT_MAX;
}

// Clean up expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of notifyRateLimits) {
    if (now > entry.resetTime) {
      notifyRateLimits.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ─── Helper: Parse notification prefs ─────────────────────────
function parsePrefs(jsonStr: string | null | undefined): Record<string, boolean> {
  if (!jsonStr) return {};
  try {
    return JSON.parse(jsonStr);
  } catch {
    return {};
  }
}

// ─── POST: Send notification to subscribers ───────────────────
export async function POST(request: Request) {
  try {
    // ── Admin authentication ──
    const adminSecret = request.headers.get('ADMIN_SECRET');
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'غير مصرح — مفتاح المدير مطلوب' },
        { status: 401 }
      );
    }

    // ── Rate limiting ──
    if (!checkNotifyRateLimit('notify')) {
      return NextResponse.json(
        { error: 'طلبات كثيرة جداً. يرجى الانتظار قبل المحاولة مرة أخرى.' },
        { status: 429 }
      );
    }

    // ── Parse request body ──
    const body = await request.json();
    const { type, message } = body as { type?: string; message?: string };

    if (!type || !VALID_TYPES.includes(type as NotificationType)) {
      return NextResponse.json(
        { error: `نوع الإشعار غير صحيح. الأنواع المتاحة: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'نص الرسالة مطلوب' },
        { status: 400 }
      );
    }

    const notificationType = type as NotificationType;

    // ── Find all connected accounts with this pref enabled ──
    const allAccounts = await db.telegramAccount.findMany({
      where: { isConnected: true },
      select: {
        id: true,
        telegramChatId: true,
        notificationPrefs: true,
      },
    });

    // Filter accounts that have this notification type enabled
    const subscribedAccounts = allAccounts.filter(account => {
      const prefs = parsePrefs(account.notificationPrefs);
      return prefs[notificationType] === true;
    });

    if (subscribedAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        skipped: allAccounts.length,
        message: 'لا يوجد مشتركين مفعّلين لهذا النوع من الإشعارات',
      });
    }

    // ── Send messages ──
    let sent = 0;
    let failed = 0;

    for (const account of subscribedAccounts) {
      try {
        const success = await sendTelegramMessage({
          chat_id: account.telegramChatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        });

        if (success) {
          sent++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }

      // Small delay between messages to avoid Telegram rate limits
      if (sent % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`[Telegram Notify] type=${notificationType}, sent=${sent}, failed=${failed}, total_subscribers=${subscribedAccounts.length}`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total_subscribers: subscribedAccounts.length,
      total_accounts: allAccounts.length,
    });
  } catch (error: any) {
    console.error('[Telegram Notify] POST error:', error.message);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إرسال الإشعارات' },
      { status: 500 }
    );
  }
}
