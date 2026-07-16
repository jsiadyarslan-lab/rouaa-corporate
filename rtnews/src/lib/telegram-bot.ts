// ─── Telegram Bot Core ────────────────────────────────────────
// Low-level Telegram Bot API client.
// Separated from route handlers to avoid circular imports.
// This is the SINGLE source of truth for sending messages via Telegram API.

export interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: string;
  disable_web_page_preview?: boolean;
  reply_markup?: any;
}

export interface TelegramPhoto {
  chat_id: string | number;
  photo: string;          // URL of the image (R2, filesystem via app URL, or any public URL)
  caption: string;        // Caption text (max 1024 chars)
  parse_mode?: string;
  disable_web_page_preview?: boolean;
  reply_markup?: any;
}

/**
 * Send a message via the Telegram Bot API.
 * This is the core function used by all Telegram notification paths.
 *
 * @returns true if the message was sent successfully, false otherwise
 */
export async function sendTelegramMessage(message: TelegramMessage): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.warn('[TelegramBot] TELEGRAM_BOT_TOKEN not configured — skipping message');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      console.error(`[TelegramBot] sendMessage failed (${res.status}): ${errorBody.slice(0, 300)}`);
    }

    return res.ok;
  } catch (error: any) {
    console.error('[TelegramBot] sendMessage error:', error.message);
    return false;
  }
}

/**
 * Send a photo with caption via the Telegram Bot API.
 * Uses sendPhoto endpoint — the photo parameter must be a public URL.
 * Caption supports HTML parse_mode (max 1024 chars).
 *
 * @returns true if the photo was sent successfully, false otherwise
 */
export async function sendTelegramPhoto(message: TelegramPhoto): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.warn('[TelegramBot] TELEGRAM_BOT_TOKEN not configured — skipping photo');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(30000), // 30s timeout for image upload
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      console.error(`[TelegramBot] sendPhoto failed (${res.status}): ${errorBody.slice(0, 300)}`);
    }

    return res.ok;
  } catch (error: any) {
    console.error('[TelegramBot] sendPhoto error:', error.message);
    return false;
  }
}

/**
 * Set the webhook URL for the Telegram bot.
 * Called during deployment setup or via admin API.
 */
export async function setTelegramWebhook(webhookUrl: string, secretToken?: string): Promise<{ ok: boolean; description: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return { ok: false, description: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secretToken || '',
        allowed_updates: ['message'],
        drop_pending_updates: false,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    return { ok: data.ok, description: data.description || '' };
  } catch (error: any) {
    return { ok: false, description: error.message };
  }
}

/**
 * Get current webhook info for the Telegram bot.
 */
export async function getTelegramWebhookInfo(): Promise<any> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return null;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.result || null;
  } catch {
    return null;
  }
}

/**
 * Delete the current webhook (switch to polling mode).
 */
export async function deleteTelegramWebhook(): Promise<{ ok: boolean; description: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return { ok: false, description: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    return { ok: data.ok, description: data.description || '' };
  } catch (error: any) {
    return { ok: false, description: error.message };
  }
}

/**
 * Get bot info (username, etc.)
 */
export async function getTelegramBotInfo(): Promise<any> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return null;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.result || null;
  } catch {
    return null;
  }
}
