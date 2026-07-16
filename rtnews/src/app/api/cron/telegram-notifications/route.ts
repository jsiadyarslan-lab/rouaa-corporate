// ─── Telegram Notifications Cron V2 ──────────────────────────────
// Scheduled Telegram notification sender
// POST /api/cron/telegram-notifications?action=breaking|analysis|price|daily|calendar|all|setup
// Protected with CRON_SECRET + x-internal header check
//
// This endpoint fills the gap: most notification types have NO auto-trigger.
// Railway cron should call this periodically:
//   - action=breaking   → every 5 min  (newly published breaking news)
//   - action=analysis   → every 15 min (newly published analyses)
//   - action=price      → every 30 min (significant price movements)
//   - action=daily      → once daily at 8:00 AM (morning digest)
//   - action=calendar   → every 60 min (upcoming economic events)
//   - action=all        → run breaking + analysis (for periodic cron)
//   - action=setup      → ensure webhook is configured + run breaking
//
// V2: Added 'all' and 'setup' actions. Auto webhook setup on 'setup'.
//     Added TELEGRAM_BOT_TOKEN check to avoid errors when not configured.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifyTelegramSubscribers } from '@/lib/telegram-notifier';
import { setTelegramWebhook } from '@/lib/telegram-bot';
import {
  formatBreakingNews,
  formatAnalysis,
  formatPriceAlert,
  formatDailyDigest,
  formatCalendarEvent,
} from '@/lib/telegram-formatter';
import { publishToChannel } from '@/lib/telegram-channel-publisher';
import { verifyInternalOrCronAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;



// Track what we've already notified about (prevent duplicates)
// In-memory, resets on redeployment (acceptable for notifications)
const notifiedIds = new Map<string, Set<string>>();
function wasNotified(action: string, id: string): boolean {
  const set = notifiedIds.get(action);
  if (!set) return false;
  return set.has(id);
}
function markNotified(action: string, id: string): void {
  if (!notifiedIds.has(action)) notifiedIds.set(action, new Set());
  const set = notifiedIds.get(action)!;
  set.add(id);
  // Keep only last 500 IDs per action to prevent memory leak
  if (set.size > 500) {
    const entries = Array.from(set);
    set.clear();
    for (let i = entries.length - 300; i < entries.length; i++) {
      set.add(entries[i]);
    }
  }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rouatradingnews-production.up.railway.app';

// ═══════════════════════════════════════════════════════════════
//  BREAKING NEWS — Newly published breaking articles
// ═══════════════════════════════════════════════════════════════
async function handleBreaking(): Promise<{ sent: number; count: number }> {
  // Find breaking news published in the last 10 minutes that we haven't notified about
  const cutoff = new Date(Date.now() - 10 * 60 * 1000);

  const articles = await db.newsItem.findMany({
    where: {
      newsType: 'breaking',
      isPublished: true,
      isReady: true,
      locale: 'ar',  // V337: Arabic Telegram channel — Arabic news only
      publishedAt: { gte: cutoff },
    },
    select: {
      id: true,
      title: true,
      titleAr: true,
      summaryAr: true,
      summary: true,
      impactLevel: true,
      sentiment: true,
      slug: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: 5,
  });

  let totalSent = 0;

  for (const article of articles) {
    if (wasNotified('breaking', article.id)) continue;

    const title = article.titleAr || article.title;
    const summary = (article.summaryAr || article.summary || '').slice(0, 250);

    const message = formatBreakingNews({
      title,
      summary: summary || undefined,
      impactLevel: article.impactLevel,
      sentiment: article.sentiment,
      slug: article.slug || undefined,
      id: article.id,
    });

    const sent = await notifyTelegramSubscribers('breaking', message);
    markNotified('breaking', article.id);
    totalSent += sent;

    // Small delay between notifications
    if (totalSent > 0) await new Promise(r => setTimeout(r, 200));
  }

  return { sent: totalSent, count: articles.length };
}

// ═══════════════════════════════════════════════════════════════
//  ANALYSIS — Newly published market analyses
// ═══════════════════════════════════════════════════════════════
async function handleAnalysis(): Promise<{ sent: number; count: number }> {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000); // Last 30 min

  const analyses = await db.marketAnalysis.findMany({
    where: {
      isPublished: true,
      locale: 'ar',  // V337: Arabic Telegram — Arabic analyses only
      publishedAt: { gte: cutoff },
    },
    select: {
      id: true,
      title: true,
      assetClass: true,
      sentiment: true,
      confidenceScore: true,
      slug: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: 5,
  });

  let totalSent = 0;

  for (const analysis of analyses) {
    if (wasNotified('analysis', analysis.id)) continue;

    const message = formatAnalysis({
      title: analysis.title,
      assetClass: analysis.assetClass || undefined,
      sentiment: analysis.sentiment,
      confidenceScore: analysis.confidenceScore || undefined,
      slug: analysis.slug || undefined,
      id: analysis.id,
    });

    const sent = await notifyTelegramSubscribers('analysis', message);
    markNotified('analysis', analysis.id);
    totalSent += sent;

    if (totalSent > 0) await new Promise(r => setTimeout(r, 200));
  }

  return { sent: totalSent, count: analyses.length };
}

// ═══════════════════════════════════════════════════════════════
//  PRICE ALERTS — Significant price movements
// ═══════════════════════════════════════════════════════════════
async function handlePrice(): Promise<{ sent: number; alerts: number }> {
  let totalSent = 0;
  let alertCount = 0;

  try {
    // Fetch current market data from our API
    const pricesUrl = `${APP_URL}/api/markets/prices`;
    const response = await fetch(pricesUrl, {
      signal: AbortSignal.timeout(10000),
      headers: { 'x-internal': process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET || '' },
    });

    if (!response.ok) {
      console.warn(`[TelegramCron] Price fetch failed: ${response.status}`);
      return { sent: 0, alerts: 0 };
    }

    const data = await response.json();
    const prices: any[] = data.prices || data.data || [];

    // Filter for significant movers (>2% change)
    const significantMovers = prices.filter((p: any) => {
      const change = Math.abs(parseFloat(p.changePercent || p.change_percent || p.change || '0'));
      return change >= 2;
    }).slice(0, 5);

    if (significantMovers.length === 0) {
      return { sent: 0, alerts: 0 };
    }

    // Build price alert message using the formatter
    const movers = significantMovers.map((p: any) => ({
      symbol: p.symbol || p.name || '',
      name: p.name || p.symbol || '',
      nameAr: p.nameAr || undefined,
      price: parseFloat(p.price || p.lastPrice || '0'),
      changePercent: parseFloat(p.changePercent || p.change_percent || p.change || '0'),
    }));

    const message = formatPriceAlert({ movers });

    const sent = await notifyTelegramSubscribers('price', message);
    totalSent = sent;
    alertCount = significantMovers.length;
  } catch (err: any) {
    console.warn(`[TelegramCron] Price alert failed: ${err.message}`);
  }

  return { sent: totalSent, alerts: alertCount };
}

// ═══════════════════════════════════════════════════════════════
//  DAILY DIGEST — Morning summary
// ═══════════════════════════════════════════════════════════════
async function handleDaily(): Promise<{ sent: number }> {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Fetch today's content
    const [breakingNews, analyses, reports] = await Promise.all([
      db.newsItem.findMany({
        where: {
          isPublished: true,
          isReady: true,
          locale: 'ar',  // V337: Arabic daily digest
          publishedAt: { gte: yesterday },
          newsType: 'breaking',
        },
        select: { titleAr: true, title: true, impactLevel: true },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      }),
      db.marketAnalysis.findMany({
        where: { isPublished: true, locale: 'ar', publishedAt: { gte: yesterday } },  // V337
        select: { title: true, assetClass: true, sentiment: true },
        orderBy: { publishedAt: 'desc' },
        take: 3,
      }),
      db.economicReport.findMany({
        where: { isPublished: true, locale: 'ar', publishedAt: { gte: yesterday } },  // V337
        select: { title: true, reportType: true, marketImpact: true },
        orderBy: { publishedAt: 'desc' },
        take: 3,
      }),
    ]);

    // Build digest using the formatter
    const digest = formatDailyDigest({
      date: now,
      breakingNews: breakingNews.map(n => ({
        titleAr: n.titleAr,
        title: n.title,
        impactLevel: n.impactLevel,
      })),
      analyses: analyses.map(a => ({
        title: a.title,
        assetClass: a.assetClass,
        sentiment: a.sentiment,
      })),
      reports: reports.map(r => ({
        title: r.title,
        reportType: r.reportType,
        marketImpact: r.marketImpact,
      })),
    });

    const sent = await notifyTelegramSubscribers('daily', digest);
    return { sent };
  } catch (err: any) {
    console.error(`[TelegramCron] Daily digest failed: ${err.message}`);
    return { sent: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════
//  CALENDAR — Upcoming economic events
// ═══════════════════════════════════════════════════════════════
async function handleCalendar(): Promise<{ sent: number; events: number }> {
  try {
    // Fetch economic calendar data from our API
    const calendarUrl = `${APP_URL}/api/markets/calendar`;
    const response = await fetch(calendarUrl, {
      signal: AbortSignal.timeout(10000),
      headers: { 'x-internal': process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET || '' },
    });

    if (!response.ok) {
      console.warn(`[TelegramCron] Calendar fetch failed: ${response.status}`);
      return { sent: 0, events: 0 };
    }

    const data = await response.json();
    const events: any[] = data.events || data.data || [];

    // Filter for high-impact events in the next 24 hours
    const highImpactEvents = events.filter((e: any) => {
      const impact = e.impact || e.importance || '';
      return impact === 'high' || impact === 'High' || impact === '3';
    }).slice(0, 5);

    if (highImpactEvents.length === 0) {
      return { sent: 0, events: 0 };
    }

    // Build calendar message using the formatter
    const formattedEvents = highImpactEvents.map((e: any) => ({
      title: e.event || e.title || e.name || '',
      country: e.country || undefined,
      time: e.time || e.datetime || undefined,
      forecast: e.forecast || undefined,
      previous: e.previous || undefined,
    }));

    const message = formatCalendarEvent({ events: formattedEvents });

    const sent = await notifyTelegramSubscribers('calendar', message);
    return { sent, events: highImpactEvents.length };
  } catch (err: any) {
    console.warn(`[TelegramCron] Calendar notification failed: ${err.message}`);
    return { sent: 0, events: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════
//  CHANNEL CATCH-UP — Publish recently published articles to channel
//  that were missed by the publisher (e.g., articles with low impact
//  that were previously excluded, or publisher failures).
//  V213: Safety net — runs periodically to ensure no article is missed.
// ═══════════════════════════════════════════════════════════════
const channelPublishedIds = new Set<string>();

async function handleChannelCatchup(): Promise<{ published: number; failed: number }> {
  if (!process.env.TELEGRAM_CHAT_ID) {
    return { published: 0, failed: 0 };
  }

  // Find articles published in the last 30 minutes that have a slug
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);

  try {
    const articles = await db.newsItem.findMany({
      where: {
        isReady: true,
        isPublished: true,
        locale: 'ar',  // V337: Arabic channel catchup
        publishedAt: { gte: cutoff },
        slug: { not: null },
      },
      select: {
        id: true,
        titleAr: true,
        title: true,
        summaryAr: true,
        summary: true,
        contentAr: true,
        newsType: true,
        sentiment: true,
        impactLevel: true,
        affectedAssets: true,
        category: true,
        slug: true,
        sourceName: true,
        source: true,
        aiAnalysis: true,
        imageUrl: true, // EGRESS FIX: added imageUrl back (was missing), removed generatedImage from select
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });

    let published = 0;
    let failed = 0;

    for (const article of articles) {
      // Skip already published to channel in this session
      if (channelPublishedIds.has(article.id)) continue;

      const result = await publishToChannel({
        titleAr: article.titleAr,
        title: article.title,
        summaryAr: article.summaryAr,
        summary: article.summary,
        contentAr: article.contentAr,
        newsType: article.newsType || 'live',
        sentiment: article.sentiment || 'neutral',
        impactLevel: article.impactLevel || 'low',
        affectedAssets: article.affectedAssets || '[]',
        category: article.category || 'general',
        slug: article.slug,
        source: article.sourceName || article.source,
        aiAnalysis: article.aiAnalysis,
        generatedImage: article.imageUrl ? undefined : `/api/article-image/${article.id}`, // EGRESS FIX: use API route
        imageUrl: article.imageUrl || `/api/article-image/${article.id}`,
      });

      if (result.success) {
        channelPublishedIds.add(article.id);
        published++;
        console.log(`[TelegramCron V213] Channel catch-up published: "${(article.titleAr || article.title).slice(0, 50)}"`);
      } else {
        failed++;
        console.warn(`[TelegramCron V213] Channel catch-up failed for ${article.id}: ${result.error}`);
      }

      // Small delay between publishes
      if (published > 0) await new Promise(r => setTimeout(r, 300));
    }

    // Keep only last 500 IDs to prevent memory leak
    if (channelPublishedIds.size > 500) {
      const entries = Array.from(channelPublishedIds);
      channelPublishedIds.clear();
      for (let i = entries.length - 300; i < entries.length; i++) {
        channelPublishedIds.add(entries[i]);
      }
    }

    return { published, failed };
  } catch (err: any) {
    console.warn(`[TelegramCron V213] Channel catch-up failed: ${err.message}`);
    return { published: 0, failed: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════
//  MAIN HANDLER
// ═══════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  if (!verifyInternalOrCronAuth(request)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  // Early return if Telegram bot is not configured
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({
      success: false,
      error: 'TELEGRAM_BOT_TOKEN not configured',
      action: 'skipped',
      timestamp: new Date().toISOString(),
    });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'breaking';

  const startTime = Date.now();
  let result: any;
  let webhookSetup: any = null;

  switch (action) {
    case 'breaking':
      result = await handleBreaking();
      break;
    case 'analysis':
      result = await handleAnalysis();
      break;
    case 'price':
      result = await handlePrice();
      break;
    case 'daily':
      result = await handleDaily();
      break;
    case 'calendar':
      result = await handleCalendar();
      break;

    // V2: 'all' — run breaking + analysis + channel catch-up together (for periodic cron)
    case 'all': {
      const [breaking, analysis, channelCatchup] = await Promise.all([
        handleBreaking(),
        handleAnalysis(),
        handleChannelCatchup(),
      ]);
      result = { breaking, analysis, channelCatchup };
      break;
    }

    // V213: 'channel_catchup' — publish recently published articles to channel
    case 'channel_catchup': {
      result = await handleChannelCatchup();
      break;
    }

    // V2: 'setup' — ensure webhook is configured, then run breaking
    case 'setup': {
      // Auto-setup webhook
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (baseUrl && process.env.TELEGRAM_BOT_TOKEN) {
        const webhookUrl = `${baseUrl}/api/telegram`;
        webhookSetup = await setTelegramWebhook(webhookUrl, process.env.TELEGRAM_WEBHOOK_SECRET);
        console.log(`[TelegramCron] Webhook setup: ok=${webhookSetup.ok}, desc=${webhookSetup.description}`);
      }

      // Then run breaking news check
      result = await handleBreaking();
      break;
    }

    default:
      return NextResponse.json({
        error: `إجراء غير صحيح: ${action}. المتاح: breaking, analysis, price, daily, calendar, all, setup`,
      }, { status: 400 });
  }

  const duration = Date.now() - startTime;
  console.log(`[TelegramCron] action=${action}, result=${JSON.stringify(result)}, duration=${duration}ms`);

  return NextResponse.json({
    success: true,
    action,
    result,
    ...(webhookSetup && { webhookSetup }),
    duration,
    timestamp: new Date().toISOString(),
  });
}

// Allow GET for easy cron pings
export async function GET(request: NextRequest) {
  return POST(request);
}
