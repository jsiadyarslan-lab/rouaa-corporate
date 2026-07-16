// ─── Telegram Test Notification API ──────────────────────────
// POST: Send a test notification to a specific chat ID
// Used by the Telegram settings page to verify the bot connection.
// Requires the chatId in the request body.

import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram-bot';
import { formatTestMessage } from '@/lib/telegram-formatter';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chatId } = body as { chatId?: string };

    if (!chatId) {
      return NextResponse.json(
        { error: 'معرّف المحادثة (chatId) مطلوب' },
        { status: 400 }
      );
    }

    // Send test message
    const success = await sendTelegramMessage({
      chat_id: chatId,
      text: formatTestMessage(),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'تم إرسال الرسالة التجريبية بنجاح',
      });
    } else {
      return NextResponse.json(
        { error: 'فشل إرسال الرسالة — تأكد من إرسال /start للبوت أولاً', success: false },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Telegram Test] Error:', error.message);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إرسال الرسالة التجريبية', success: false },
      { status: 500 }
    );
  }
}
