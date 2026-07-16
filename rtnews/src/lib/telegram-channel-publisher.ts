// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// ═══════════════════════════════════════════════════════════════
// ─── Telegram Channel Publisher V2 ──────────────────────────
// تصميم أنيق: نظافة بصرية، أقل فوضى، تركيز على المحتوى
// + دعم إرسال الصور عبر sendPhoto API
//
// هذا الموديول مسؤول عن نشر الأخبار المنسقة للقناة العامة
// باستخدام التنسيق الأنيق (Minimal Clean) مع صورة مصغرة.
//
// البيئة المطلوبة:
//   - TELEGRAM_CHAT_ID: معرف قناة @rouatradingnews
//   - NEXT_PUBLIC_APP_URL: رابط التطبيق
// ═══════════════════════════════════════════════════════════════

import { sendTelegramMessage, sendTelegramPhoto } from '@/lib/telegram-bot';

const CHANNEL_ID = process.env.TELEGRAM_CHAT_ID || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rouatradingnews-production.up.railway.app';

// ─── أنواع الرسائل ───

type NewsType = 'market_update' | 'breaking_news' | 'analysis' | 'alert' | 'daily_summary' | 'quick_alert';
type Sentiment = 'bullish' | 'bearish' | 'neutral';
type RiskLevel = 'high' | 'medium' | 'low';

// ─── ثوابت التنسيق الأنيق ───

const THICK_SEP = '━━━━━━━━━━━━━━━━━━━';

// ─── مؤشرات المشاع ───

const sentimentConfig: Record<string, { emoji: string; arrow: string; label: string }> = {
  bullish:  { emoji: '🟩', arrow: '▲', label: 'صاعد' },
  positive: { emoji: '🟩', arrow: '▲', label: 'صاعد' },
  bearish:  { emoji: '🟥', arrow: '▼', label: 'هابط' },
  negative: { emoji: '🟥', arrow: '▼', label: 'هابط' },
  neutral:  { emoji: '⬜', arrow: '◆', label: 'محايد' },
};

// ─── مستوى المخاطر ───

const riskConfig: Record<string, { emoji: string; label: string }> = {
  high:   { emoji: '🔴', label: 'عالية' },
  medium: { emoji: '🟡', label: 'متوسطة' },
  low:    { emoji: '🟢', label: 'منخفضة' },
};

// ─── أنواع الرسائل ───

const typeConfig: Record<string, { emoji: string; label: string }> = {
  breaking:     { emoji: '🚨', label: 'خبر عاجل' },
  high:         { emoji: '📊', label: 'تحديث سوقي' },
  medium:       { emoji: '📊', label: 'تحديث سوقي' },
  low:          { emoji: '⚡', label: 'تحرك سريع' },
  analysis:     { emoji: '🔬', label: 'تحليل معمّق' },
  alert:        { emoji: '🚨', label: 'تنبيه سعري' },
  daily_summary:{ emoji: '📋', label: 'ملخص يومي' },
  live:         { emoji: '📊', label: 'تحديث سوقي' },
  article:      { emoji: '📊', label: 'تحديث سوقي' },
  market_update:{ emoji: '📊', label: 'تحديث سوقي' },
  quick_alert:  { emoji: '⚡', label: 'تحرك سريع' },
};

// ═══════════════════════════════════════════════════════════════
// أدوات مساعدة
// ═══════════════════════════════════════════════════════════════

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncateText(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text;
  const lastSpace = text.lastIndexOf(' ', maxLength - 3);
  if (lastSpace > maxLength * 0.7) {
    return text.substring(0, lastSpace) + '...';
  }
  return text.substring(0, maxLength - 3) + '...';
}

function formatChange(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `<code>${sign}${percent.toFixed(2)}%</code>`;
}

function formatPrice(price: number, symbol: string, withDollarEmoji: boolean = false): string {
  const prefix = withDollarEmoji ? '💵 ' : '';
  if (!symbol) return `${prefix}$${price.toFixed(2)}`;
  if (symbol.includes('XAU') || symbol.includes('XAG')) return `${prefix}$${price.toFixed(2)}`;
  if (symbol === 'BTC/USD' || symbol === 'BTC') return `${prefix}$${price.toLocaleString()}`;
  if (symbol === 'SPX' || symbol.includes('S&P')) return `${prefix}${price.toFixed(1)}`;
  if (symbol === 'BRENT' || symbol.includes('OIL')) return `${prefix}$${price.toFixed(2)}`;
  if (symbol.includes('/')) return `${prefix}${price.toFixed(4)}`;
  return `${prefix}$${price.toFixed(2)}`;
}

/**
 * تحويل مسار الصورة إلى رابط URL كامل قابل للوصول من تيلغرام
 * - R2 URL → يُستخدم مباشرة
 * - مسار ملف محلي (/article-images/...) → يُسبق بعنوان التطبيق
 * - base64 → لا يمكن إرساله مباشرة، نعود للنص فقط
 */
function resolveImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath || imagePath.length < 10) return null;

  // R2 URL — يمكن استخدامه مباشرة
  if (imagePath.startsWith('https://') || imagePath.startsWith('http://')) {
    return imagePath;
  }

  // مسار ملف محلي — تحويله إلى URL كامل
  if (imagePath.startsWith('/article-images/') || imagePath.startsWith('/')) {
    return `${APP_URL}${imagePath}`;
  }

  // base64 — لا يمكن إرساله عبر sendPhoto (يحتاج رفع ملف)
  if (imagePath.startsWith('data:image/')) {
    return null;
  }

  return null;
}

/**
 * استخراج أسماء الأصول المتأثرة من JSON
 */
function parseAffectedAssets(affectedAssets: string | undefined): string[] {
  if (!affectedAssets) return [];
  try {
    const assets = typeof affectedAssets === 'string'
      ? JSON.parse(affectedAssets)
      : affectedAssets;

    if (Array.isArray(assets) && assets.length > 0) {
      return assets
        .slice(0, 5)
        .map((a: any) => a.name || a.symbol || a)
        .filter(Boolean);
    }
  } catch {
    // Not valid JSON, skip
  }
  return [];
}

// ═══════════════════════════════════════════════════════════════
// تنسيق الرسائل — التصميم الأنيق
// ═══════════════════════════════════════════════════════════════

interface ChannelArticle {
  titleAr?: string | null;
  title: string;
  summaryAr?: string | null;
  summary: string;
  contentAr?: string | null;
  newsType: string;
  sentiment: string;
  impactLevel: string;
  affectedAssets: string;
  category: string;
  slug?: string | null;
  source?: string | null;
  aiAnalysis?: string | null;
  generatedImage?: string | null;
  imageUrl?: string | null;
}

/**
 * تنسيق رسالة القناة — التصميم الأنيق (Minimal Clean)
 *
 * العنوان هنا
 * 📊 تحديث سوقي  ·  ⬜ محايد
 * ━━━━━━━━━━━━━━━━━━━
 *
 * ⚠️ مخاطر 🟡 متوسطة  ·  💎 مؤشر إس آند بي 500
 *
 * ▸ نقطة أولى
 * ▸ نقطة ثانية
 * ▸ نقطة ثالثة
 *
 * 🔗 اقرأ التحليل الكامل ←
 *
 * 🦁 رؤى | منصة الأخبار المالية
 */
export function formatChannelMessage(article: ChannelArticle): string {
  const title = article.titleAr || article.title;
  const summary = article.summaryAr || article.summary || '';
  const config = typeConfig[article.newsType] || typeConfig[article.impactLevel] || typeConfig.market_update;
  const sConfig = sentimentConfig[article.sentiment] || sentimentConfig.neutral;
  const lines: string[] = [];

  // ─── العنوان أولاً ───
  lines.push(`<b>${escapeHtml(title)}</b>`);

  // ─── الرأس المدمج: نوع الخبر + مؤشر المشاع ───
  lines.push(`${config.emoji} ${config.label}  ·  ${sConfig.emoji} ${sConfig.label}`);
  lines.push(THICK_SEP);

  // ─── البيانات الوصفية: مخاطر + متأثرون في سطر واحد ───
  const metaParts: string[] = [];
  if (article.impactLevel) {
    const rc = riskConfig[article.impactLevel] || riskConfig.medium;
    metaParts.push(`⚠️ مخاطر ${rc.emoji} ${rc.label}`);
  }
  const assetNames = parseAffectedAssets(article.affectedAssets);
  if (assetNames.length > 0) {
    metaParts.push(`💎 ${assetNames.map(n => escapeHtml(n)).join('، ')}`);
  }
  if (metaParts.length > 0) {
    lines.push(metaParts.join('  ·  '));
  }

  // ─── المصدر ───
  if (article.source) {
    lines.push(`📰 ${escapeHtml(article.source)}`);
  }

  // ─── النقاط الرئيسية أو الملخص ───
  const keyPoints = extractKeyPoints(article.aiAnalysis, article.contentAr, summary);
  if (keyPoints.length > 0) {
    lines.push(''); // سطر فارغ قبل النقاط
    for (const point of keyPoints) {
      lines.push(`▸ ${escapeHtml(truncateText(point, 150))}`);
    }
  } else if (summary) {
    lines.push('');
    lines.push(escapeHtml(truncateText(summary, 220)));
  }

  // ─── الرابط ← ───
  if (article.slug) {
    lines.push('');
    lines.push(`<a href="${APP_URL}/news/${escapeHtml(article.slug)}">🔗 اقرأ التحليل الكامل ←</a>`);
  }

  // ─── التذييل ───
  lines.push('');
  lines.push(`🦁 <a href="${APP_URL}">رؤى</a> | منصة الأخبار المالية`);

  return lines.join('\n');
}

/**
 * تنسيق رسالة مختصرة للتعليق على الصورة (caption)
 * تيلغرام يحد الكابشن بـ 1024 حرف
 */
export function formatChannelCaption(article: ChannelArticle): string {
  const title = article.titleAr || article.title;
  const summary = article.summaryAr || article.summary || '';
  const config = typeConfig[article.newsType] || typeConfig[article.impactLevel] || typeConfig.market_update;
  const sConfig = sentimentConfig[article.sentiment] || sentimentConfig.neutral;
  const lines: string[] = [];

  // ─── العنوان أولاً ───
  lines.push(`<b>${escapeHtml(title)}</b>`);

  // ─── الرأس المدمج: نوع الخبر + مؤشر المشاع ───
  lines.push(`${config.emoji} ${config.label}  ·  ${sConfig.emoji} ${sConfig.label}`);
  lines.push(THICK_SEP);

  // ─── البيانات الوصفية مختصرة ───
  const metaParts: string[] = [];
  if (article.impactLevel) {
    const rc = riskConfig[article.impactLevel] || riskConfig.medium;
    metaParts.push(`⚠️ ${rc.emoji} ${rc.label}`);
  }
  const assetNames = parseAffectedAssets(article.affectedAssets);
  if (assetNames.length > 0) {
    metaParts.push(`💎 ${assetNames.slice(0, 3).map(n => escapeHtml(n)).join('، ')}`);
  }
  if (metaParts.length > 0) {
    lines.push(metaParts.join('  ·  '));
  }

  // ─── النقاط الرئيسية (مختصرة أكثر) ───
  const keyPoints = extractKeyPoints(article.aiAnalysis, article.contentAr, summary);
  if (keyPoints.length > 0) {
    lines.push('');
    for (const point of keyPoints.slice(0, 3)) {
      lines.push(`▸ ${escapeHtml(truncateText(point, 120))}`);
    }
  }

  // ─── الرابط ───
  if (article.slug) {
    lines.push('');
    lines.push(`<a href="${APP_URL}/news/${escapeHtml(article.slug)}">🔗 اقرأ التحليل الكامل ←</a>`);
  }

  // ─── التذييل ───
  lines.push('');
  lines.push(`🦁 <a href="${APP_URL}">رؤى</a> | منصة الأخبار المالية`);

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// النشر للقناة
// ═══════════════════════════════════════════════════════════════

export interface ChannelPublishResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

/**
 * نشر مقال لقناة @rouatradingnews
 * - إذا وُجدت صورة → يرسل sendPhoto (صورة + كابشن)
 * - إذا لم توجد صورة → يرسل sendMessage (نص فقط)
 */
export async function publishToChannel(article: ChannelArticle): Promise<ChannelPublishResult> {
  if (!CHANNEL_ID) {
    console.warn('[ChannelPublisher] TELEGRAM_CHAT_ID not configured — skipping channel publish');
    return { success: false, error: 'TELEGRAM_CHAT_ID not configured' };
  }

  try {
    const shortTitle = (article.titleAr || article.title).slice(0, 50);

    // محاولة إرسال مع صورة
    const imageToUse = article.generatedImage || article.imageUrl;
    const imageUrl = resolveImageUrl(imageToUse);

    if (imageUrl) {
      // إرسال صورة + كابشن أنيق
      const caption = formatChannelCaption(article);

      // تحقق من طول الكابشن (حد تيلغرام: 1024 حرف)
      const finalCaption = caption.length > 1024
        ? caption.substring(0, 1020) + '...'
        : caption;

      const success = await sendTelegramPhoto({
        chat_id: CHANNEL_ID,
        photo: imageUrl,
        caption: finalCaption,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });

      if (success) {
        console.log(`[ChannelPublisher V2] ✓ Photo published to @rouatradingnews: "${shortTitle}"`);
        return { success: true };
      }

      // إذا فشل sendPhoto، نحاول بدون صورة
      console.warn(`[ChannelPublisher V2] sendPhoto failed, falling back to text-only for: "${shortTitle}"`);
    }

    // إرسال نص فقط (بدون صورة أو بعد فشل الصورة)
    const text = formatChannelMessage(article);

    const success = await sendTelegramMessage({
      chat_id: CHANNEL_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });

    if (success) {
      console.log(`[ChannelPublisher V2] ✓ Text published to @rouatradingnews: "${shortTitle}"`);
      return { success: true };
    } else {
      console.error(`[ChannelPublisher V2] ✗ Failed to publish: "${shortTitle}"`);
      return { success: false, error: 'sendMessage returned false' };
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ChannelPublisher V2] Error: ${msg}`);
    return { success: false, error: msg };
  }
}

/**
 * نشر تنبيه سعري للقناة — التصميم الأنيق
 */
export async function publishAlertToChannel(data: {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  level: 'breakout' | 'support' | 'resistance';
  direction: 'above' | 'below';
  note?: string;
  slug?: string;
}): Promise<ChannelPublishResult> {
  if (!CHANNEL_ID) {
    return { success: false, error: 'TELEGRAM_CHAT_ID not configured' };
  }

  const levelLabels: Record<string, string> = {
    breakout: 'كسر مستوى',
    support: 'اختراق دعم',
    resistance: 'اختراق مقاومة',
  };
  const dirEmoji = data.direction === 'above' ? '🔺' : '🔻';
  const dirLabel = data.direction === 'above' ? 'أعلى' : 'أدنى';

  const lines: string[] = [];
  lines.push(`<b>🚨 تنبيه سعري  ·  ${dirEmoji} ${dirLabel}</b>`);
  lines.push(THICK_SEP);
  lines.push(`<b>${escapeHtml(data.name)}</b> (<code>${escapeHtml(data.symbol)}</code>)`);
  lines.push(`${levelLabels[data.level]} ${dirLabel}`);
  lines.push('');
  lines.push(`💰 <b>${formatPrice(data.price, data.symbol, false)}</b>  ·  ${data.changePercent >= 0 ? '📈' : '📉'} ${formatChange(data.changePercent)}`);

  if (data.note) {
    lines.push('');
    lines.push(`▸ ${escapeHtml(data.note)}`);
  }

  if (data.slug) {
    lines.push('');
    lines.push(`<a href="${APP_URL}/news/${escapeHtml(data.slug)}">🔗 اقرأ التحليل الكامل ←</a>`);
  }

  lines.push('');
  lines.push(`🦁 <a href="${APP_URL}">رؤى</a> | منصة الأخبار المالية`);

  try {
    const text = lines.join('\n');
    const success = await sendTelegramMessage({
      chat_id: CHANNEL_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });

    return { success };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

/**
 * نشر ملخص يومي للقناة — التصميم الأنيق
 */
export async function publishDailySummaryToChannel(data: {
  marketOverview: string;
  items: Array<{
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
  }>;
  topHeadlines: Array<{
    title: string;
    sentiment: string;
    slug: string;
  }>;
  outlook?: string;
}): Promise<ChannelPublishResult> {
  if (!CHANNEL_ID) {
    return { success: false, error: 'TELEGRAM_CHAT_ID not configured' };
  }

  const dateStr = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lines: string[] = [];
  lines.push(`<b>📋 ملخص يومي</b>  ·  ${escapeHtml(dateStr)}`);
  lines.push(THICK_SEP);

  // حالة السوق
  lines.push(`📊 ${escapeHtml(data.marketOverview)}`);

  // أسعار رئيسية
  if (data.items.length > 0) {
    lines.push('');
    lines.push('<b>💵 أسعار رئيسية</b>');
    for (const item of data.items) {
      const arrow = item.changePercent >= 0 ? '🟩' : '🟥';
      lines.push(`${arrow} <b>${escapeHtml(item.name)}</b> ${formatPrice(item.price, item.symbol)} ${formatChange(item.changePercent)}`);
    }
  }

  // أهم العناوين
  if (data.topHeadlines.length > 0) {
    lines.push('');
    lines.push('<b>📰 أهم العناوين</b>');
    for (const h of data.topHeadlines) {
      const sConfig = sentimentConfig[h.sentiment] || sentimentConfig.neutral;
      lines.push(`${sConfig.emoji} <a href="${APP_URL}/news/${escapeHtml(h.slug)}">${escapeHtml(truncateText(h.title, 100))}</a>`);
    }
  }

  // التوقعات
  if (data.outlook) {
    lines.push('');
    lines.push(`🔮 <b>التوقعات:</b> ${escapeHtml(data.outlook)}`);
  }

  lines.push('');
  lines.push(`🦁 <a href="${APP_URL}">رؤى</a> | منصة الأخبار المالية`);

  try {
    const text = lines.join('\n');
    const success = await sendTelegramMessage({
      chat_id: CHANNEL_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });

    return { success };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

// ═══════════════════════════════════════════════════════════════
// أدوات مساعدة خاصة
// ═══════════════════════════════════════════════════════════════

/**
 * استخراج النقاط الرئيسية من تحليل AI أو المحتوى
 */
function extractKeyPoints(
  aiAnalysis?: string | null,
  contentAr?: string | null,
  summary?: string
): string[] {
  const points: string[] = [];

  // محاولة استخراج من aiAnalysis JSON
  if (aiAnalysis) {
    try {
      const parsed = typeof aiAnalysis === 'string' ? JSON.parse(aiAnalysis) : aiAnalysis;

      // keyTakeaways
      if (Array.isArray(parsed.keyTakeaways)) {
        for (const takeaway of parsed.keyTakeaways.slice(0, 4)) {
          if (typeof takeaway === 'string' && takeaway.length > 10) {
            points.push(takeaway);
          }
        }
      }

      // conclusion
      if (!points.length && parsed.conclusion && typeof parsed.conclusion === 'string') {
        const sentences = parsed.conclusion.split(/[.؟!؛]/).filter((s: string) => s.trim().length > 15);
        points.push(...sentences.slice(0, 3).map((s: string) => s.trim()));
      }

      // summary
      if (!points.length && parsed.summary && typeof parsed.summary === 'string') {
        const sentences = parsed.summary.split(/[.؟!؛]/).filter((s: string) => s.trim().length > 15);
        points.push(...sentences.slice(0, 3).map((s: string) => s.trim()));
      }
    } catch {
      // Not valid JSON, try content
    }
  }

  // محاولة استخراج من المحتوى العربي
  if (points.length === 0 && contentAr) {
    const paragraphs = contentAr.split('\n\n').filter(p => p.trim().length > 20);
    for (const para of paragraphs.slice(0, 3)) {
      const clean = para.trim().replace(/^[-•]\s*/, '');
      if (clean.length > 15) {
        points.push(clean.length > 150 ? clean.substring(0, 147) + '...' : clean);
      }
    }
  }

  // محاولة أخيرة: من الملخص
  if (points.length === 0 && summary) {
    const sentences = summary.split(/[.؟!؛،]/).filter(s => s.trim().length > 15);
    for (const s of sentences.slice(0, 3)) {
      points.push(s.trim());
    }
  }

  return points.slice(0, 4);
}
