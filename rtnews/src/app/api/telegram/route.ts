// ─── Telegram Bot API ────────────────────────────────────────
// Full webhook handler for Telegram bot integration
// Supports: /start, /news, /breaking, /alerts, /help, /connect,
//           /subscribe, /unsubscribe, /prefs, /prefs <type> on|off
// Features: Database-backed accounts, rate limiting, Arabic messages
//
// V2: sendTelegramMessage moved to @/lib/telegram-bot (avoids circular imports).
//     This route re-exports it for backward compatibility.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTelegramMessage as _sendTelegramMessage, setTelegramWebhook, getTelegramWebhookInfo, getTelegramBotInfo } from '@/lib/telegram-bot';
import {
  formatStartMessage,
  formatHelpMessage,
  formatPrefsMessage,
  formatAlertsStatus,
  formatNewsList,
  formatBreakingList,
  formatSubscribeMessage,
  formatUnsubscribeMessage,
  formatPrefToggle,
  formatConnectHelp,
  formatConnectSuccess,
  formatTestMessage,
  escapeHtml,
} from '@/lib/telegram-formatter';

// Re-export for backward compatibility (other files import from this route)
export const sendTelegramMessage = _sendTelegramMessage;

export const dynamic = 'force-dynamic';

// Resolve the app URL from various env sources
const APP_URL = process.env.NEXT_PUBLIC_APP_URL
  || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '')
  || (process.env.RAILWAY_PRIVATE_DOMAIN ? `https://${process.env.RAILWAY_PRIVATE_DOMAIN}` : '')
  || 'https://rouatradingnews-production.up.railway.app';

// ─── Types ────────────────────────────────────────────────────
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

// ─── Rate Limiting ────────────────────────────────────────────
const chatRateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 messages per chat per minute

function checkRateLimit(chatId: string): boolean {
  const now = Date.now();
  const entry = chatRateLimits.get(chatId);

  if (!entry || now > entry.resetTime) {
    chatRateLimits.set(chatId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// Clean up expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of chatRateLimits) {
    if (now > entry.resetTime) {
      chatRateLimits.delete(key);
    }
  }
}, 5 * 60 * 1000);

// sendTelegramMessage is now imported from @/lib/telegram-bot
// and re-exported above for backward compatibility.

// ─── Helper: Parse notification prefs from JSON string ────────
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

// ─── Helper: Get or create TelegramAccount ────────────────────
async function getOrCreateAccount(chatId: string | number, username?: string): Promise<any> {
  const chatIdStr = String(chatId);

  // Try to find existing account by chatId
  let account = await db.telegramAccount.findUnique({
    where: { telegramChatId: chatIdStr },
  });

  if (!account) {
    // Create new account with a generated userId (can be linked later via /connect)
    const generatedUserId = `tg_${chatIdStr}`;
    try {
      account = await db.telegramAccount.create({
        data: {
          userId: generatedUserId,
          telegramChatId: chatIdStr,
          telegramUsername: username || null,
          notificationPrefs: JSON.stringify(DEFAULT_PREFS),
          isConnected: true,
        },
      });
      console.log(`[Telegram] New account created: chatId=${chatIdStr}, username=${username || 'N/A'}`);
    } catch (createErr: any) {
      // Handle race condition — account might have been created by another request
      if (createErr.code === 'P2002') {
        account = await db.telegramAccount.findUnique({
          where: { telegramChatId: chatIdStr },
        });
      } else {
        throw createErr;
      }
    }
  } else if (username && account.telegramUsername !== username) {
    // Update username if changed
    await db.telegramAccount.update({
      where: { id: account.id },
      data: { telegramUsername: username },
    });
  }

  return account;
}

// ─── POST: Webhook handler for incoming Telegram messages ─────
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verify webhook secret (only if both secret is configured AND sent by Telegram)
    // If TELEGRAM_WEBHOOK_SECRET is set but Telegram doesn't send the header,
    // it means the webhook was registered without a secret — allow through with a warning.
    const secret = request.headers.get('x-telegram-bot-api-secret-token');
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secret && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      console.warn(`[Telegram] Webhook secret mismatch: received="${secret?.slice(0, 8)}..." expected="${process.env.TELEGRAM_WEBHOOK_SECRET?.slice(0, 8)}..."`);
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const message = body.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from?.username;

    // Rate limiting
    if (!checkRateLimit(String(chatId))) {
      await sendTelegramMessage({
        chat_id: chatId,
        text: '⚠️ تجاوزت الحد الأقصى للرسائل. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.',
      });
      return NextResponse.json({ ok: true });
    }

    // Parse command and arguments
    const parts = text.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // ─── /start ──────────────────────────────────────────────
    if (command === '/start') {
      const account = await getOrCreateAccount(chatId, username);

      await sendTelegramMessage({
        chat_id: chatId,
        text: formatStartMessage(),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 افتح رؤى', web_app: { url: `${APP_URL}/tg` } }],
          ],
        },
      });

      console.log(`[Telegram] /start from chatId=${chatId}, username=${username}, accountId=${account.id}`);
    }

    // ─── /connect <userId> ───────────────────────────────────
    else if (command === '/connect') {
      if (args.length === 0) {
        await sendTelegramMessage({
          chat_id: chatId,
          text: formatConnectHelp(),
          parse_mode: 'HTML',
        });
      } else {
        const userId = args[0];
        const account = await getOrCreateAccount(chatId, username);

        // Check if the target user exists
        const targetUser = await db.user.findUnique({ where: { id: userId } }).catch(err => { console.error('[Telegram V156] DB lookup failed - potential security issue:', err instanceof Error ? err.message : err); return null; });

        if (!targetUser) {
          await sendTelegramMessage({
            chat_id: chatId,
            text: '❌ معرّف المستخدم غير صحيح. تأكد من نسخ المعرّف من صفحة الإعدادات في الموقع.',
          });
        } else {
          // Check if another Telegram account is already connected to this userId
          const existingConnection = await db.telegramAccount.findUnique({
            where: { userId: userId },
          }).catch(err => { console.error('[Telegram V156] DB lookup failed - potential security issue:', err instanceof Error ? err.message : err); return null; });

          if (existingConnection && existingConnection.id !== account.id) {
            await sendTelegramMessage({
              chat_id: chatId,
              text: '⚠️ هذا الحساب مرتبط بحساب تيليجرام آخر بالفعل. يرجى فصل الحساب السابق أولاً.',
            });
          } else {
            // Update the account to link with the website user
            await db.telegramAccount.update({
              where: { id: account.id },
              data: { userId: userId },
            });

            await sendTelegramMessage({
              chat_id: chatId,
              text: formatConnectSuccess(targetUser.name || targetUser.email),
              parse_mode: 'HTML',
            });

            console.log(`[Telegram] Account ${account.id} linked to user ${userId}`);
          }
        }
      }
    }

    // ─── /prefs ──────────────────────────────────────────────
    else if (command === '/prefs') {
      const account = await getOrCreateAccount(chatId, username);
      const prefs = parsePrefs(account.notificationPrefs);

      if (args.length === 0) {
        // Show current preferences
        await sendTelegramMessage({
          chat_id: chatId,
          text: formatPrefsMessage(prefs),
          parse_mode: 'HTML',
        });
      } else if (args.length >= 2) {
        // Toggle a specific preference
        const prefKey = args[0].toLowerCase();
        const prefValue = args[1].toLowerCase();

        const validKeys = ['breaking', 'analysis', 'price', 'calendar', 'daily'];
        if (!validKeys.includes(prefKey)) {
          await sendTelegramMessage({
            chat_id: chatId,
            text: `❌ نوع إشعار غير صحيح. الأنواع المتاحة: ${validKeys.join(', ')}`,
          });
        } else if (prefValue !== 'on' && prefValue !== 'off') {
          await sendTelegramMessage({
            chat_id: chatId,
            text: '❌ القيمة يجب أن تكون on أو off. مثال: <code>/prefs breaking on</code>',
            parse_mode: 'HTML',
          });
        } else {
          const newValue = prefValue === 'on';
          prefs[prefKey as keyof NotificationPrefs] = newValue;

          await db.telegramAccount.update({
            where: { id: account.id },
            data: { notificationPrefs: JSON.stringify(prefs) },
          });

          const prefLabels: Record<string, string> = {
            breaking: 'أخبار عاجلة',
            analysis: 'تحليلات السوق',
            price: 'تنبيهات الأسعار',
            calendar: 'التقويم الاقتصادي',
            daily: 'ملخص يومي',
          };

          await sendTelegramMessage({
            chat_id: chatId,
            text: formatPrefToggle(prefLabels[prefKey], newValue),
            parse_mode: 'HTML',
          });
        }
      } else {
        await sendTelegramMessage({
          chat_id: chatId,
          text: '📖 الاستخدام: <code>/prefs</code> لعرض التفضيلات أو <code>/prefs breaking on</code> للتغيير',
          parse_mode: 'HTML',
        });
      }
    }

    // ─── /subscribe ───────────────────────────────────────────
    else if (command === '/subscribe') {
      const account = await getOrCreateAccount(chatId, username);
      const allOn: NotificationPrefs = { breaking: true, analysis: true, price: true, calendar: true, daily: true };

      await db.telegramAccount.update({
        where: { id: account.id },
        data: { notificationPrefs: JSON.stringify(allOn), isConnected: true },
      });

      await sendTelegramMessage({
        chat_id: chatId,
        text: formatSubscribeMessage(),
        parse_mode: 'HTML',
      });
    }

    // ─── /unsubscribe ─────────────────────────────────────────
    else if (command === '/unsubscribe') {
      const account = await getOrCreateAccount(chatId, username);
      const allOff: NotificationPrefs = { breaking: false, analysis: false, price: false, calendar: false, daily: false };

      await db.telegramAccount.update({
        where: { id: account.id },
        data: { notificationPrefs: JSON.stringify(allOff) },
      });

      await sendTelegramMessage({
        chat_id: chatId,
        text: formatUnsubscribeMessage(),
        parse_mode: 'HTML',
      });
    }

    // ─── /news ───────────────────────────────────────────────
    else if (command === '/news') {
      try {
        // FIX: Query ALL published news types (article, breaking, live)
        // Previously only queried newsType='article' which returned empty
        // because most articles are 'breaking' or 'live' type.
        const articles = await db.newsItem.findMany({
          where: { isPublished: true, isReady: true },
          orderBy: { publishedAt: 'desc' },
          take: 5,
          select: { titleAr: true, title: true, category: true, slug: true, newsType: true, impactLevel: true },
        });

        if (articles.length === 0) {
          await sendTelegramMessage({ chat_id: chatId, text: 'لا توجد أخبار متاحة حالياً' });
        } else {
          await sendTelegramMessage({
            chat_id: chatId,
            text: formatNewsList(articles.map(a => ({
              titleAr: a.titleAr,
              title: a.title,
              category: a.category,
              slug: a.slug,
              newsType: a.newsType,
              impactLevel: a.impactLevel,
            }))),
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          });
        }
      } catch (dbErr: any) {
        console.error('[Telegram] /news DB error:', dbErr.message);
        await sendTelegramMessage({
          chat_id: chatId,
          text: '❌ حدث خطأ أثناء جلب الأخبار. يرجى المحاولة لاحقاً.',
        });
      }
    }

    // ─── /breaking ───────────────────────────────────────────
    else if (command === '/breaking') {
      try {
        const breaking = await db.newsItem.findMany({
          where: { newsType: 'breaking', isPublished: true, isReady: true },  // FIX: Added isPublished check
          orderBy: { publishedAt: 'desc' },
          take: 5,
          select: { titleAr: true, title: true, impactLevel: true, slug: true },
        });

        if (breaking.length === 0) {
          await sendTelegramMessage({ chat_id: chatId, text: 'لا توجد أخبار عاجلة حالياً' });
        } else {
          await sendTelegramMessage({
            chat_id: chatId,
            text: formatBreakingList(breaking.map(b => ({
              titleAr: b.titleAr,
              title: b.title,
              impactLevel: b.impactLevel,
              slug: b.slug,
            }))),
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          });
        }
      } catch (dbErr: any) {
        console.error('[Telegram] /breaking DB error:', dbErr.message);
        await sendTelegramMessage({
          chat_id: chatId,
          text: '❌ حدث خطأ أثناء جلب الأخبار العاجلة. يرجى المحاولة لاحقاً.',
        });
      }
    }

    // ─── /alerts ─────────────────────────────────────────────
    else if (command === '/alerts') {
      const account = await getOrCreateAccount(chatId, username);
      const prefs = parsePrefs(account.notificationPrefs);

      const enabledCount = Object.values(prefs).filter(Boolean).length;
      const totalCount = Object.values(prefs).length;

      await sendTelegramMessage({
        chat_id: chatId,
        text: formatAlertsStatus(enabledCount, totalCount),
        parse_mode: 'HTML',
      });
    }

    // ─── /help ───────────────────────────────────────────────
    else if (command === '/help') {
      await sendTelegramMessage({
        chat_id: chatId,
        text: formatHelpMessage(),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Telegram Bot] Error:', error.message);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

// ─── GET: Webhook setup / status check ─────────────────────────
// ?action=setup  → Set webhook URL
// ?action=status → Get webhook info + bot info
// ?action=delete → Delete webhook
// (no param)     → Same as ?action=setup (backward compatible)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'setup';

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN غير مُعدّ' }, { status: 400 });
  }

  // ── Status check ──
  if (action === 'status') {
    const [webhookInfo, botInfo] = await Promise.all([
      getTelegramWebhookInfo(),
      getTelegramBotInfo(),
    ]);

    return NextResponse.json({
      bot: botInfo ? {
        id: botInfo.id,
        username: botInfo.username,
        firstName: botInfo.first_name,
      } : null,
      webhook: webhookInfo ? {
        url: webhookInfo.url,
        hasCustomCertificate: webhookInfo.has_custom_certificate,
        pendingUpdateCount: webhookInfo.pending_update_count,
        lastErrorDate: webhookInfo.last_error_date,
        lastErrorMessage: webhookInfo.last_error_message,
        maxConnections: webhookInfo.max_connections,
      } : null,
      tokenConfigured: true,
      appUrl: APP_URL,
    });
  }

  // ── Delete webhook ──
  if (action === 'delete') {
    const { deleteTelegramWebhook } = await import('@/lib/telegram-bot');
    const result = await deleteTelegramWebhook();
    return NextResponse.json(result);
  }

  // ── Setup webhook (default) ──
  try {
    const webhookUrl = `${APP_URL}/api/telegram`;
    const result = await setTelegramWebhook(webhookUrl, process.env.TELEGRAM_WEBHOOK_SECRET);

    console.log(`[Telegram] Webhook setup: url=${webhookUrl}, ok=${result.ok}, desc=${result.description}`);

    return NextResponse.json({
      success: result.ok,
      description: result.description,
      webhookUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
