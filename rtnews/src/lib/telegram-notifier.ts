// ─── Telegram Notifier Module ────────────────────────────────
// Reusable module for sending Telegram notifications from anywhere in the app.
// Can be imported from API routes, cron jobs, or pipeline workers.
//
// V2: Fixed circular import — now uses @/lib/telegram-bot instead of route handler.
// V2: Fixed default notification prefs — new accounts with {} prefs now get
//     breaking=true, analysis=true by default (matching the UI expectations).

import { db } from '@/lib/db';
import { sendTelegramMessage } from '@/lib/telegram-bot';

export type NotificationType = 'breaking' | 'analysis' | 'price' | 'calendar' | 'daily';

// Default notification preferences for new accounts
const DEFAULT_PREFS: Record<string, boolean> = {
  breaking: true,
  analysis: true,
  price: false,
  calendar: false,
  daily: false,
};

// ─── Helper: Parse notification prefs ─────────────────────────
function parsePrefs(jsonStr: string | null | undefined): Record<string, boolean> {
  if (!jsonStr) return { ...DEFAULT_PREFS };

  try {
    const parsed = JSON.parse(jsonStr);
    // If parsed is empty object {}, return defaults
    if (Object.keys(parsed).length === 0) return { ...DEFAULT_PREFS };

    // Merge with defaults so new prefs are always defined
    return {
      ...DEFAULT_PREFS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/**
 * Send a notification to ALL Telegram subscribers who have the given
 * notification type enabled.
 *
 * @param type  The notification category (breaking, analysis, price, calendar, daily)
 * @param message The message text to send (supports HTML formatting)
 * @returns Number of messages successfully sent
 */
export async function notifyTelegramSubscribers(
  type: NotificationType,
  message: string,
): Promise<number> {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('[TelegramNotifier] TELEGRAM_BOT_TOKEN not configured — skipping notification');
    return 0;
  }

  try {
    // Find all connected accounts
    const allAccounts = await db.telegramAccount.findMany({
      where: { isConnected: true },
      select: {
        id: true,
        telegramChatId: true,
        notificationPrefs: true,
      },
    });

    // Filter by notification preference (use defaults for empty prefs)
    const subscribedAccounts = allAccounts.filter(account => {
      const prefs = parsePrefs(account.notificationPrefs);
      return prefs[type] === true;
    });

    if (subscribedAccounts.length === 0) {
      console.log(`[TelegramNotifier] No subscribers for type="${type}" (total accounts: ${allAccounts.length})`);
      return 0;
    }

    let sent = 0;

    for (const account of subscribedAccounts) {
      try {
        const success = await sendTelegramMessage({
          chat_id: account.telegramChatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        });

        if (success) sent++;
      } catch (err: any) {
        console.warn(`[TelegramNotifier] Failed to send to chatId=${account.telegramChatId}: ${err.message}`);
      }

      // Small delay between messages to avoid Telegram API rate limits
      if (sent > 0 && sent % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`[TelegramNotifier] type="${type}", sent=${sent}/${subscribedAccounts.length}`);
    return sent;
  } catch (error: any) {
    console.error(`[TelegramNotifier] Error notifying subscribers (type="${type}"):`, error.message);
    return 0;
  }
}

/**
 * Send a notification to a specific Telegram chat.
 *
 * @param chatId The Telegram chat ID to send to
 * @param message The message text to send (supports HTML formatting)
 * @returns Whether the message was sent successfully
 */
export async function notifyTelegramChat(
  chatId: string,
  message: string,
): Promise<boolean> {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('[TelegramNotifier] TELEGRAM_BOT_TOKEN not configured — skipping notification');
    return false;
  }

  try {
    return await sendTelegramMessage({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  } catch (error: any) {
    console.error(`[TelegramNotifier] Error sending to chatId="${chatId}":`, error.message);
    return false;
  }
}

/**
 * Get count of subscribers for a given notification type.
 * Useful for displaying stats on the frontend.
 */
export async function getTelegramSubscriberCount(type?: NotificationType): Promise<{
  total: number;
  connected: number;
  byType: Record<string, number>;
}> {
  try {
    const allAccounts = await db.telegramAccount.findMany({
      where: { isConnected: true },
      select: { notificationPrefs: true },
    });

    const types: NotificationType[] = ['breaking', 'analysis', 'price', 'calendar', 'daily'];
    const byType: Record<string, number> = {};

    for (const t of types) {
      byType[t] = allAccounts.filter(account => {
        const prefs = parsePrefs(account.notificationPrefs);
        return prefs[t] === true;
      }).length;
    }

    return {
      total: allAccounts.length,
      connected: allAccounts.length,
      byType,
    };
  } catch (error: any) {
    console.error('[TelegramNotifier] Error getting subscriber count:', error.message);
    return { total: 0, connected: 0, byType: {} };
  }
}
