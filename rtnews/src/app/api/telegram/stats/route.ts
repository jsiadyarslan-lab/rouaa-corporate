// ─── Telegram Stats API ──────────────────────────────────────
// GET: Get notification statistics (subscriber counts, etc.)
// Public endpoint — returns only counts (no PII).
// Detailed subscriber data is available via the admin dashboard.

import { NextResponse } from 'next/server';
import { getTelegramSubscriberCount } from '@/lib/telegram-notifier';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getTelegramSubscriberCount();

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('[Telegram Stats] GET error:', error.message);
    return NextResponse.json(
      { total: 0, connected: 0, byType: {} },
      { status: 500 }
    );
  }
}
