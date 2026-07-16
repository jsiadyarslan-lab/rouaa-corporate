// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// ═══════════════════════════════════════════════════════════════
// ─── Telegram Message Formatter V3 ────────────────────────────
// Revolutionary professional formatting inspired by top channels:
//   Whale Alert, Binance Killers, ForexNews, ArabBTC
//
// Design principles:
//   - Structured visual hierarchy (Title → Body → Meta → CTA)
//   - Strategic emoji placement as visual anchors
//   - Data-dense but scannable layouts
//   - Prominent clickable CTAs
//   - Dark-mode optimized (Telegram default)
//   - RTL-first Arabic layout
//   - Consistent brand identity with "🦁 رؤى" watermark
//   - 5-level separator system for visual rhythm
//   - Content quality validation (repetition, mixed scripts)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rouatradingnews-production.up.railway.app';

// ─── Separator System ──────────────────────────────────────
const SEPARATOR_BOLD   = '━━━━━━━━━━━━━━━━━━';
const SEPARATOR_MEDIUM = '───────────────────';
const SEPARATOR_THIN   = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄';
const SEPARATOR_DOT    = '• • • • • • • • • •';

// ─── Branding ──────────────────────────────────────────────
const BRAND_FOOTER = `<i>🦁 <a href="${APP_URL}">رؤى</a></i>`;
const BRAND_PLAIN  = `🦁 رؤى`;

// ═══════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS — Shared across all formatters
// ═══════════════════════════════════════════════════════════════

/** Escape HTML special characters */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Impact emoji */
export function impactEmoji(level: string | null | undefined): string {
  switch (level) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

/** Impact Arabic label */
export function impactLabel(level: string | null | undefined): string {
  switch (level) {
    case 'high': return 'مرتفع';
    case 'medium': return 'متوسط';
    case 'low': return 'منخفض';
    default: return 'غير محدد';
  }
}

/** Sentiment emoji */
export function sentimentEmoji(sentiment: string | null | undefined): string {
  switch (sentiment) {
    case 'positive': case 'bullish': return '📈';
    case 'negative': case 'bearish': return '📉';
    case 'neutral': return '➡️';
    default: return '➡️';
  }
}

/** Sentiment Arabic label */
export function sentimentLabel(sentiment: string | null | undefined): string {
  switch (sentiment) {
    case 'positive': return 'إيجابي';
    case 'negative': return 'سلبي';
    case 'bullish': return 'صاعد';
    case 'bearish': return 'هابط';
    case 'neutral': return 'محايد';
    default: return 'محايد';
  }
}

/** News type emoji */
export function newsTypeEmoji(type: string | null | undefined): string {
  switch (type) {
    case 'breaking': return '🚨';
    case 'live': return '📡';
    case 'article': return '📰';
    default: return '📰';
  }
}

/** Format number with commas */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Sanitize summary — filter repetitive/garbage content */
export function sanitizeSummary(text: string | undefined | null): string | undefined {
  if (!text || text.trim().length < 5) return undefined;

  const trimmed = text.trim();

  // Check for repetitive content: split into words, count frequency
  const words = trimmed
    .replace(/[^\u0600-\u06FF\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  if (words.length >= 5) {
    const freq: Record<string, number> = {};
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }
    const maxCount = Math.max(...Object.values(freq));
    if (maxCount > words.length * 0.5 && maxCount >= 3) {
      return undefined;
    }
  }

  // Check for repetitive sentences (e.g., "حسناً. حسناً. حسناً.")
  const sentences = trimmed.split(/[.؟!؛]/).map(s => s.trim()).filter(s => s.length > 1);
  if (sentences.length >= 3) {
    const sentFreq: Record<string, number> = {};
    for (const sent of sentences) {
      sentFreq[sent] = (sentFreq[sent] || 0) + 1;
    }
    const maxSentCount = Math.max(...Object.values(sentFreq));
    if (maxSentCount >= 3) {
      return undefined;
    }
  }

  return trimmed;
}

/** Urgency badge for breaking news */
function urgencyBadge(impactLevel?: string | null): string {
  if (impactLevel === 'high') return '🚨 عاجل جداً';
  if (impactLevel === 'medium') return '🟡 عاجل';
  return '⚪ إعلامي';
}

/** Direction indicators */
function directionIndicator(changePercent: number): { emoji: string; arrow: string } {
  if (changePercent >= 0) return { emoji: '🟢', arrow: '▲' };
  return { emoji: '🔴', arrow: '▼' };
}

// ═══════════════════════════════════════════════════════════════
//  BREAKING NEWS — عاجل
// ═══════════════════════════════════════════════════════════════
export function formatBreakingNews(options: {
  title: string;
  summary?: string;
  impactLevel?: string;
  sentiment?: string;
  slug?: string;
  id?: string;
}): string {
  const { title, summary, impactLevel, sentiment, slug, id } = options;
  const impact = impactEmoji(impactLevel);
  const sent = sentimentEmoji(sentiment);
  const link = slug ? `${APP_URL}/news/${slug}` : id ? `${APP_URL}/news/${id}` : '';
  const safeSummary = sanitizeSummary(summary);
  const badge = urgencyBadge(impactLevel);

  const lines: string[] = [
    `🚨  <b>عاجل</b>  ┃  ${badge}`,
    '',
    SEPARATOR_BOLD,
    '',
    `📰 <b>${escapeHtml(title)}</b>`,
  ];

  if (safeSummary) {
    lines.push(
      '',
      SEPARATOR_THIN,
      `▸ ${escapeHtml(safeSummary.slice(0, 250))}`,
    );
  }

  lines.push(
    '',
    SEPARATOR_THIN,
    `${sent} التوجه: ${sentimentLabel(sentiment)}  ┃  ${impact} التأثير: ${impactLabel(impactLevel)}`,
  );

  if (link) {
    lines.push(
      '',
      SEPARATOR_THIN,
      `🔗 <a href="${link}"><b>← اقرأ المزيد</b></a>`,
    );
  }

  lines.push(
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  );

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
//  IMPORTANT NEWS — خبر مهم
// ═══════════════════════════════════════════════════════════════
export function formatImportantNews(options: {
  title: string;
  summary?: string;
  sentiment?: string;
  slug?: string;
  id?: string;
}): string {
  const { title, summary, sentiment, slug, id } = options;
  const sent = sentimentEmoji(sentiment);
  const link = slug ? `${APP_URL}/news/${slug}` : id ? `${APP_URL}/news/${id}` : '';
  const safeSummary = sanitizeSummary(summary);

  const lines: string[] = [
    `📰  <b>خبر مهم</b>  ${sent}`,
    '',
    SEPARATOR_BOLD,
    '',
    `<b>${escapeHtml(title)}</b>`,
  ];

  if (safeSummary) {
    lines.push(
      '',
      `🎯 <b>${escapeHtml(safeSummary.slice(0, 200))}</b>`,
    );
  }

  if (link) {
    lines.push(
      '',
      SEPARATOR_THIN,
      `🔗 <a href="${link}"><b>← اقرأ المزيد</b></a>`,
    );
  }

  lines.push(
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  );

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
//  MARKET UPDATE — تحديث سوقي
// ═══════════════════════════════════════════════════════════════
export function formatMarketUpdate(options: {
  title: string;
  summary?: string;
  slug?: string;
  id?: string;
}): string {
  const { title, summary, slug, id } = options;
  const link = slug ? `${APP_URL}/news/${slug}` : id ? `${APP_URL}/news/${id}` : '';
  const safeSummary = sanitizeSummary(summary);

  const lines: string[] = [
    `📊  <b>تحديث سوقي</b>`,
    '',
    SEPARATOR_BOLD,
    '',
    `<b>${escapeHtml(title)}</b>`,
  ];

  if (safeSummary) {
    lines.push(
      '',
      SEPARATOR_THIN,
      `▸ ${escapeHtml(safeSummary.slice(0, 150))}`,
    );
  }

  if (link) {
    lines.push(
      '',
      SEPARATOR_THIN,
      `🔗 <a href="${link}"><b>← اقرأ المزيد</b></a>`,
    );
  }

  lines.push(
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  );

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
//  ANALYSIS — تحليل سوق جديد
// ═══════════════════════════════════════════════════════════════
export function formatAnalysis(options: {
  title: string;
  assetClass?: string;
  sentiment?: string;
  confidenceScore?: number;
  slug?: string;
  id?: string;
}): string {
  const { title, assetClass, sentiment, confidenceScore, slug, id } = options;
  const sent = sentimentEmoji(sentiment);
  const link = slug ? `${APP_URL}/analyses/${slug}` : id ? `${APP_URL}/analyses/${id}` : '';

  const lines: string[] = [
    `📊  <b>تحليل سوق جديد</b> ${sent}`,
    '',
    SEPARATOR_BOLD,
    '',
    `<b>${escapeHtml(title)}</b>`,
    '',
  ];

  // Metadata row
  const metaParts: string[] = [];
  if (assetClass) metaParts.push(`🏢 الفئة: ${escapeHtml(assetClass)}`);
  metaParts.push(`${sent} التوجه: ${sentimentLabel(sentiment)}`);
  if (confidenceScore) metaParts.push(`🎯 ثقة: ${confidenceScore}%`);

  lines.push(metaParts.join('  ┃  '));

  if (link) {
    lines.push(
      '',
      SEPARATOR_THIN,
      `🔗 <a href="${link}"><b>← اقرأ التحليل</b></a>`,
    );
  }

  lines.push(
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  );

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
//  PRICE ALERTS — تنبيهات الأسعار
// ═══════════════════════════════════════════════════════════════
export function formatPriceAlert(options: {
  movers: Array<{
    symbol: string;
    name?: string;
    nameAr?: string;
    price: number;
    changePercent: number;
  }>;
}): string {
  const { movers } = options;

  const lines: string[] = [
    `💵  <b>تنبيهات الأسعار</b>`,
    '',
    SEPARATOR_BOLD,
    `أصول بحركة ملحوظة (>2%):`,
    SEPARATOR_THIN,
  ];

  for (const mover of movers) {
    const displayName = mover.nameAr || mover.name || mover.symbol;
    const { emoji: dirEmoji, arrow } = directionIndicator(mover.changePercent);
    const changeStr = mover.changePercent >= 0
      ? `+${mover.changePercent.toFixed(2)}%`
      : `${mover.changePercent.toFixed(2)}%`;
    const priceStr = formatNumber(mover.price);

    lines.push(
      '',
      `${dirEmoji} <b>${escapeHtml(displayName)}</b> (${mover.symbol})`,
      `  ${priceStr}$  ${arrow} ${changeStr}`,
    );
  }

  lines.push(
    '',
    SEPARATOR_THIN,
    `📊 <a href="${APP_URL}/markets"><b>← بيانات الأسواق المباشرة</b></a>`,
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  );

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
//  DAILY DIGEST — ملخص يومي
// ═══════════════════════════════════════════════════════════════
export function formatDailyDigest(options: {
  date: Date;
  breakingNews: Array<{
    titleAr?: string | null;
    title: string;
    impactLevel?: string | null;
    slug?: string | null;
  }>;
  analyses: Array<{
    title: string;
    assetClass?: string | null;
    sentiment?: string | null;
  }>;
  reports: Array<{
    title: string;
    reportType?: string | null;
    marketImpact?: string | null;
  }>;
}): string {
  const { date, breakingNews, analyses, reports } = options;

  const dateStr = date.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lines: string[] = [
    `📣  <b>الملخص اليومي</b>  ┃  ${dateStr}`,
    '',
    SEPARATOR_BOLD,
  ];

  if (breakingNews.length > 0) {
    lines.push(
      '',
      `🚨 <b>أخبار عاجلة:</b>`,
    );
    breakingNews.forEach((n, i) => {
      const title = n.titleAr || n.title;
      const emoji = impactEmoji(n.impactLevel);
      const link = n.slug ? `<a href="${APP_URL}/news/${n.slug}"><b>← اقرأ</b></a>` : (n as any).id ? `<a href="${APP_URL}/news/${(n as any).id}"><b>← اقرأ</b></a>` : '';
      lines.push(`  ${i === 0 ? '❶' : i === 1 ? '❷' : i === 2 ? '❸' : i === 3 ? '❹' : '❺'} ${emoji} ${escapeHtml(title)}${link ? '  ┃  ' + link : ''}`);
    });
  }

  if (analyses.length > 0) {
    lines.push(
      '',
      `📊 <b>تحليلات السوق:</b>`,
    );
    analyses.forEach((a, i) => {
      const emoji = sentimentEmoji(a.sentiment);
      lines.push(`  ${i === 0 ? '❶' : i === 1 ? '❷' : '❸'} ${emoji} ${escapeHtml(a.title)}`);
    });
  }

  if (reports.length > 0) {
    lines.push(
      '',
      `📋 <b>تقارير اقتصادية:</b>`,
    );
    reports.forEach((r, i) => {
      const emoji = r.marketImpact === 'bullish' ? '🟢' : r.marketImpact === 'bearish' ? '🔴' : '🟡';
      lines.push(`  ${i === 0 ? '❶' : i === 1 ? '❷' : '❸'} ${emoji} ${escapeHtml(r.title)}`);
    });
  }

  if (breakingNews.length === 0 && analyses.length === 0 && reports.length === 0) {
    lines.push(
      '',
      `▸ لا توجد أخبار جديدة اليوم. نتابع من أجلك! 🤝`,
    );
  }

  lines.push(
    '',
    SEPARATOR_THIN,
    `👉 <a href="${APP_URL}"><b>← زيارة موقع رؤى</b></a>`,
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ تابعونا يومياً`,
  );

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
//  CALENDAR EVENTS — أحداث اقتصادية
// ═══════════════════════════════════════════════════════════════
export function formatCalendarEvent(options: {
  events: Array<{
    title: string;
    country?: string;
    time?: string;
    forecast?: string;
    previous?: string;
  }>;
}): string {
  const { events } = options;

  const lines: string[] = [
    `📅  <b>أحداث اقتصادية مهمة</b>`,
    '',
    SEPARATOR_BOLD,
    `الأحداث عالية التأثير:`,
    SEPARATOR_THIN,
  ];

  events.forEach((e) => {
    const countryStr = e.country ? ` (${e.country})` : '';
    const metaParts: string[] = [];
    if (e.time) metaParts.push(`🕐 ${e.time}`);
    if (e.forecast) metaParts.push(`متوقع: ${e.forecast}`);
    if (e.previous) metaParts.push(`سابق: ${e.previous}`);

    lines.push(
      '',
      `🔴 <b>${escapeHtml(e.title)}</b>${countryStr}`,
    );

    if (metaParts.length > 0) {
      lines.push(`  ${metaParts.join('  ┃  ')}`);
    }
  });

  lines.push(
    '',
    SEPARATOR_THIN,
    `👉 <a href="${APP_URL}/markets"><b>← التقويم الكامل</b></a>`,
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  );

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
//  BOT COMMAND MESSAGES
// ═══════════════════════════════════════════════════════════════

export function formatStartMessage(): string {
  return [
    `🚀  <b>أهلاً بك في رؤى</b>  🚀`,
    '',
    SEPARATOR_BOLD,
    'منصة رؤى للأخبار المالية والتداول',
    '',
    `💠 نقدم لك آخر أخبار الأسواق والتحليلات`,
    `▸ تنبيهات أسعار فورية`,
    `▸ تحليلات سوقية متعمقة`,
    `▸ تقويم اقتصادي شامل`,
    '',
    SEPARATOR_MEDIUM,
    `<b>📋 الأوامر المتاحة</b>`,
    '',
    `<code>/news</code>      ┃ آخر الأخبار`,
    `<code>/breaking</code>  ┃ الأخبار العاجلة`,
    `<code>/alerts</code>    ┃ تنبيهات الأسعار`,
    `<code>/market</code>    ┃ حالة السوق`,
    `<code>/calendar</code>  ┃ التقويم الاقتصادي`,
    `<code>/prefs</code>     ┃ إعدادات الإشعارات`,
    `<code>/subscribe</code> ┃ تفعيل الإشعارات`,
    `<code>/unsubscribe</code> ┃ إيقاف الإشعارات`,
    `<code>/connect</code>   ┃ ربط حسابك`,
    `<code>/help</code>      ┃ المساعدة`,
    '',
    SEPARATOR_MEDIUM,
    `🔔 <b>فعّل الإشعارات:</b> <code>/prefs</code>`,
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  ].join('\n');
}

export function formatHelpMessage(): string {
  return [
    `📌  <b>دليل استخدام رؤى</b>`,
    '',
    SEPARATOR_BOLD,
    '',
    `<b>📰 الأخبار</b>`,
    `<code>/news</code>      آخر الأخبار المالية`,
    `<code>/breaking</code>  الأخبار العاجلة فقط`,
    '',
    `<b>📊 التحليلات</b>`,
    `<code>/market</code>    تحليل شامل للسوق`,
    `<code>/alerts</code>    تنبيهات الأسعار`,
    '',
    `<b>📅 التقويم</b>`,
    `<code>/calendar</code>  أحداث اليوم الاقتصادية`,
    '',
    `<b>⚙️ الإعدادات</b>`,
    `<code>/prefs</code>     تخصيص الإشعارات`,
    `<code>/prefs breaking on|off</code> تغيير تفضيل`,
    `<code>/subscribe</code> تفعيل الإشعارات`,
    `<code>/unsubscribe</code> إيقاف الإشعارات`,
    `<code>/connect USER_ID</code> ربط حسابك`,
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  ].join('\n');
}

export function formatPrefsMessage(prefs: {
  breaking: boolean;
  analysis: boolean;
  price: boolean;
  calendar: boolean;
  daily: boolean;
}): string {
  const items = [
    { key: 'breaking', label: 'أخبار عاجلة', icon: '🚨', on: prefs.breaking },
    { key: 'analysis', label: 'تحليلات السوق', icon: '📊', on: prefs.analysis },
    { key: 'price', label: 'تنبيهات الأسعار', icon: '💵', on: prefs.price },
    { key: 'calendar', label: 'التقويم الاقتصادي', icon: '📅', on: prefs.calendar },
    { key: 'daily', label: 'ملخص يومي', icon: '📰', on: prefs.daily },
  ];

  const lines: string[] = [
    `⚙️  <b>إعدادات الإشعارات</b>`,
    '',
    SEPARATOR_MEDIUM,
  ];

  for (const item of items) {
    const status = item.on ? '✅ مفعّل' : '❌ معطّل';
    lines.push(`${item.icon} <b>${item.label}</b> ┃ ${status}`);
  }

  lines.push(
    '',
    SEPARATOR_THIN,
    `🔔 استخدم <code>/prefs breaking on</code> أو <code>/prefs breaking off</code> للتعديل`,
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  );

  return lines.join('\n');
}

export function formatAlertsStatus(enabledCount: number, totalCount: number): string {
  const percentage = Math.round((enabledCount / totalCount) * 100);
  const filledBlocks = Math.round(enabledCount / totalCount * 8);
  const bar = '█'.repeat(filledBlocks) + '░'.repeat(8 - filledBlocks);

  return [
    `🔔  <b>حالة التنبيهات</b>`,
    '',
    SEPARATOR_BOLD,
    '',
    `${enabledCount}/${totalCount} أنواع مفعّلة  ${bar}  ${percentage}%`,
    '',
    SEPARATOR_THIN,
    `<code>/prefs</code> ┃ عرض التفضيلات`,
    `<code>/subscribe</code> ┃ تفعيل الكل`,
    `<code>/unsubscribe</code> ┃ إيقاف الكل`,
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  ].join('\n');
}

export function formatNewsList(articles: Array<{
  titleAr?: string | null;
  title: string;
  category?: string | null;
  slug?: string | null;
  newsType?: string | null;
  impactLevel?: string | null;
}>): string {
  const lines: string[] = [
    `📰  <b>آخر الأخبار المالية</b>`,
    '',
    SEPARATOR_BOLD,
  ];

  articles.forEach((a, i) => {
    const title = a.titleAr || a.title;
    const typeEmoji = newsTypeEmoji(a.newsType);
    const impact = a.impactLevel === 'high' ? '🔴' : a.impactLevel === 'medium' ? '🟡' : '';
    const link = a.slug ? `<a href="${APP_URL}/news/${a.slug}"><b>← اقرأ</b></a>` : (a as any).id ? `<a href="${APP_URL}/news/${(a as any).id}"><b>← اقرأ</b></a>` : '';
    const category = a.category ? `┃ ${a.category}` : '';

    lines.push(
      '',
      `${typeEmoji} <b>${escapeHtml(title)}</b>${impact ? ' ' + impact : ''}`,
      `  ${category}${link ? '  ' + link : ''}`,
    );
  });

  lines.push(
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  );

  return lines.join('\n');
}

export function formatBreakingList(articles: Array<{
  titleAr?: string | null;
  title: string;
  impactLevel?: string | null;
  slug?: string | null;
}>): string {
  const lines: string[] = [
    `🚨  <b>الأخبار العاجلة</b>`,
    '',
    SEPARATOR_BOLD,
  ];

  articles.forEach((b, i) => {
    const title = b.titleAr || b.title;
    const emoji = impactEmoji(b.impactLevel);
    const link = b.slug ? `<a href="${APP_URL}/news/${b.slug}"><b>← اقرأ</b></a>` : (b as any).id ? `<a href="${APP_URL}/news/${(b as any).id}"><b>← اقرأ</b></a>` : '';
    const impactText = impactLabel(b.impactLevel);

    lines.push(
      '',
      `${emoji} <b>${escapeHtml(title)}</b>`,
      `  تأثير: ${impactText}${link ? '  ┃  ' + link : ''}`,
    );
  });

  lines.push(
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  );

  return lines.join('\n');
}

export function formatSubscribeMessage(): string {
  return [
    `✅  <b>تم تفعيل جميع الإشعارات!</b>`,
    '',
    SEPARATOR_BOLD,
    '',
    `🚨 أخبار عاجلة`,
    `📊 تحليلات السوق`,
    `💵 تنبيهات الأسعار`,
    `📅 التقويم الاقتصادي`,
    `📰 ملخص يومي`,
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  ].join('\n');
}

export function formatUnsubscribeMessage(): string {
  return [
    `🔇  <b>تم إيقاف جميع الإشعارات</b>`,
    '',
    SEPARATOR_BOLD,
    '',
    'يمكنك إعادة تفعيلها في أي وقت:',
    `<code>/subscribe</code> ┃ تفعيل الكل`,
    `<code>/prefs</code> ┃ تفعيل أنواع محددة`,
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  ].join('\n');
}

export function formatPrefToggle(label: string, enabled: boolean): string {
  return `${enabled ? '✅' : '❌'} <b>${label}</b>: ${enabled ? 'مفعّل' : 'موقف'}`;
}

export function formatConnectHelp(): string {
  return [
    `🔗  <b>ربط حساب رؤى مع تيليجرام</b>`,
    '',
    SEPARATOR_BOLD,
    '',
    `▸ 1. سجّل الدخول في الموقع`,
    `▸ 2. انسخ معرّف المستخدم من صفحة الإعدادات`,
    `▸ 3. أرسل الأمر:`,
    '',
    `<code>/connect USER_ID</code>`,
    '',
    `مثال: <code>/connect user_abc123</code>`,
  ].join('\n');
}

export function formatConnectSuccess(userName: string): string {
  return [
    `✅  <b>تم ربط حسابك بنجاح!</b>`,
    '',
    SEPARATOR_BOLD,
    '',
    `المستخدم: ${escapeHtml(userName)}`,
    '',
    'ستصلك الآن الإشعارات المخصصة لحسابك.',
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  ].join('\n');
}

export function formatTestMessage(): string {
  return [
    `🧪  <b>رسالة اختبار</b>`,
    '',
    SEPARATOR_BOLD,
    '',
    'البوت يعمل بشكل صحيح! ✅',
    '',
    `🔗 <a href="${APP_URL}"><b>← زيارة موقع رؤى</b></a>`,
    '',
    SEPARATOR_THIN,
    `${BRAND_FOOTER} ┃ منصة الأخبار المالية`,
  ].join('\n');
}
