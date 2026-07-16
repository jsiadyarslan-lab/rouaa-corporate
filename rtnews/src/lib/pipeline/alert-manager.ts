// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════
// ─── Pipeline Alert Manager V118 ─────────────────────────────
// Centralized alert system for the Rouaa Trading News pipeline.
// Sends Telegram alerts when the pipeline encounters critical issues.
//
// Alert conditions:
//   - 0 published articles for 30+ minutes
//   - Error rate > 50% in last 10 cycles
//   - AI providers down for 15+ minutes
//   - Pipeline not running despite cron triggers
//
// Throttle: Same alert type sent at most once every 15 minutes.
// Environment variables:
//   TELEGRAM_ALERT_BOT_TOKEN — Bot token for sending alerts
//   TELEGRAM_ALERT_CHAT_ID — Chat ID to send alerts to

import { getOrchestratorStats } from './orchestrator';

// Alert types
type AlertType = 'no_publish' | 'high_error_rate' | 'ai_down' | 'pipeline_dead';

interface AlertState {
  type: AlertType;
  lastSent: number;
  count: number;
}

// In-memory alert state — throttles duplicate alerts
const alertStates = new Map<AlertType, AlertState>();
const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes between same alerts
const MAX_ALERTS_PER_HOUR = 4;

// Track last hour's alert count
let hourlyAlertCount = 0;
let hourlyResetTime = Date.now();

// Check if we should send this alert (throttle)
function shouldSendAlert(type: AlertType): boolean {
  const now = Date.now();

  // Reset hourly counter
  if (now - hourlyResetTime > 60 * 60 * 1000) {
    hourlyAlertCount = 0;
    hourlyResetTime = now;
  }

  // Global hourly limit
  if (hourlyAlertCount >= MAX_ALERTS_PER_HOUR) {
    return false;
  }

  const state = alertStates.get(type);
  if (state && (now - state.lastSent) < ALERT_COOLDOWN_MS) {
    return false; // Cooldown not elapsed
  }

  return true;
}

// Send a Telegram alert
async function sendTelegramAlert(message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_ALERT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;

  if (!botToken || !chatId) {
    // No alert bot configured — try main bot as fallback
    const { sendTelegramMessage } = await import('@/lib/telegram-bot');
    // If we have a TELEGRAM_ALERT_CHAT_ID but no separate bot token, use main bot
    if (chatId && process.env.TELEGRAM_BOT_TOKEN) {
      return sendTelegramMessage({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      });
    }
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    return response.ok;
  } catch (err: any) {
    console.warn(`[AlertManager V118] Telegram send failed: ${err.message}`);
    return false;
  }
}

// Record and send an alert
async function triggerAlert(type: AlertType, message: string): Promise<void> {
  if (!shouldSendAlert(type)) return;

  const now = Date.now();
  const state = alertStates.get(type) || { type, lastSent: 0, count: 0 };
  state.lastSent = now;
  state.count++;
  alertStates.set(type, state);
  hourlyAlertCount++;

  console.warn(`[AlertManager V118] 🚨 ALERT [${type}]: ${message}`);

  // Try Telegram
  const sent = await sendTelegramAlert(`🚨 <b>رؤى — تنبيه أنابيب</b>\n\n${message}\n\n⏰ ${new Date().toISOString()}`);
  if (sent) {
    console.log(`[AlertManager V118] Telegram alert sent for [${type}]`);
  }
}

// ── Check all alert conditions ──
// Called at the end of each orchestrator cycle

let lastPublishTime = Date.now();
let lastCycleErrors = 0;
let lastCycleCount = 0;

export async function checkAlertConditions(
  publishedThisCycle: number,
  errorsThisCycle: number,
  processedThisCycle: number
): Promise<void> {
  const stats = await getOrchestratorStats();

  // 1. Check: 0 published for 30+ minutes
  if (publishedThisCycle > 0) {
    lastPublishTime = Date.now();
  } else {
    const minutesSincePublish = (Date.now() - lastPublishTime) / 60000;
    if (minutesSincePublish >= 30) {
      triggerAlert(
        'no_publish',
        `⚠️ لا توجد مقالات منشورة منذ ${Math.round(minutesSincePublish)} دقيقة.\nالدورات: ${stats.cycleCount} | آخر دورة: ${stats.lastCycleTime || 'لم تبدأ'} | أخطاء: ${stats.totalErrors}`
      );
    }
  }

  // 2. Check: Error rate > 50% in recent cycles
  lastCycleErrors += errorsThisCycle;
  lastCycleCount += processedThisCycle;
  if (lastCycleCount >= 10) {
    const errorRate = lastCycleErrors / lastCycleCount;
    if (errorRate > 0.5) {
      triggerAlert(
        'high_error_rate',
        `⚠️ معدل الخطأ مرتفع: ${Math.round(errorRate * 100)}% (${lastCycleErrors}/${lastCycleCount}).\nالأخطاء الإجمالية: ${stats.totalErrors} | آخر خطأ: ${stats.lastError || 'لا يوجد'}`
      );
    }
    // Reset counters
    lastCycleErrors = 0;
    lastCycleCount = 0;
  }

  // 3. Check: Pipeline not running
  if (!stats.isRunning && stats.cycleCount > 0) {
    triggerAlert(
      'pipeline_dead',
      `🔴 الأنابيب متوقفة! الدورات: ${stats.cycleCount} | آخر دورة: ${stats.lastCycleTime || 'غير معروف'} |_idle: ${stats.idleMinutes} دقيقة`
    );
  }
}

// Check if AI providers have been down (called from orchestrator when cascade failure detected)
let lastAiDownAlert = 0;
export async function alertAiProvidersDown(): Promise<void> {
  const now = Date.now();
  if (now - lastAiDownAlert < ALERT_COOLDOWN_MS) return;
  lastAiDownAlert = now;

  const stats = await getOrchestratorStats();
  triggerAlert(
    'ai_down',
    `🔴 مزودات AI متوقفة — انهيار متعاقب. المعالجة متوقفة حتى تعود الخدمات.\nالدورات: ${stats.cycleCount} | الأخطاء: ${stats.totalErrors}`
  );
}

// Reset publish time tracker (called when articles are published externally)
export function resetPublishTracker(): void {
  lastPublishTime = Date.now();
}
