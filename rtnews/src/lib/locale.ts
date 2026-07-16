// ─── Locale Utility Module ─────────────────────────────────────
// Provides language detection, validation, and locale-aware helpers.
// Used by both Arabic and English pipelines.
//
// CRITICAL: This module is ADDITIVE — it does NOT replace any existing
// Arabic-only functions. Those remain untouched in their original files.
// This module provides the English counterparts and locale-aware routing.

export type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

// ─── Static Imports ──────────────────────────────────────────────
import { NEWS_CATEGORIES, getNewsCategoryId, IMPACT_CONFIG, SENTIMENT_CONFIG, type NewsCategoryId } from './news-categories';

// ─── English Language Detection ──────────────────────────────────

// Known financial symbols/tickers that are legitimate in any language
// and should NOT count against the English/Latin char ratio
const FINANCIAL_SYMBOLS_REGEX = /\b(?:S&P|GDP|IPO|ETF|CPI|NFP|PMI|FOMC|DXY|TNX|TLT|XAUUSD|GLD|SPY|QQQ|DIA|XLF|XLRE|XLK|XLU|XLV|VTV|IBIT|FBTC|ARKB|COIN|MSTR|BTC|ETH|NYSE|NASDAQ|NYMEX|COMEX|WTI|Brent|AAPL|MSFT|GOOGL|AMZN|TSLA|NVDA|META|FED|ECB|BOJ|BOE|SNB|RBA|BOC|RBNZ|Fed|VIX|CME|ICE|CBOT|E-mini|E-micro|AI|IT|ESG|EBITDA|ROE|ROI|EPS|P\/E|P\/B|YTD|YoY|QoQ|MoM|FWD|BPS|MBS|ABS|CLO|CDO|CDS|OTC|SEC|CFTC|FINRA|FDIC|OPEC|EIA|API|DOE|ISM|ADP)\b/gi;

/**
 * Check if text is mostly English (Latin characters).
 * Mirrors isMostlyArabic() from publisher.ts but for English content.
 * Financial symbols/tickers are excluded from the char count.
 */
export function isMostlyEnglish(text: string, threshold = 0.70): boolean {
  if (!text || text.length < 3) return false;

  const cleanedText = text.replace(FINANCIAL_SYMBOLS_REGEX, '');
  const latinChars = (cleanedText.match(/[a-zA-Z]/g) || []).length;
  const arabicChars = (cleanedText.match(/[\u0600-\u06FF]/g) || []).length;
  const totalLetters = latinChars + arabicChars;

  if (totalLetters === 0) return false;
  return latinChars / totalLetters >= threshold;
}

/**
 * Validate that text contains meaningful English content.
 * Mirrors isValidArabic() from news-ready.ts but for English.
 */
export function isValidEnglish(text: string | null | undefined, minLength = 4): boolean {
  if (!text || text.length < minLength) return false;

  // Must contain at least 3 Latin characters
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  if (latinChars < 3) return false;

  // Latin character ratio must be >= 40%
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalLetters = latinChars + arabicChars;
  if (totalLetters === 0) return false;

  return latinChars / totalLetters >= 0.40;
}

/**
 * Check if text is mostly Spanish (Latin characters with Spanish-specific chars).
 */
export function isMostlySpanish(text: string, threshold = 0.70): boolean {
  if (!text || text.length < 3) return false;
  const spanishChars = (text.match(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ¿¡]/g) || []).length;
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalLetters = spanishChars + arabicChars;
  if (totalLetters === 0) return false;
  return spanishChars / totalLetters >= threshold;
}

/**
 * Validate that text contains meaningful Spanish content.
 */
export function isValidSpanish(text: string | null | undefined, minLength = 4): boolean {
  if (!text || text.length < minLength) return false;
  const latinChars = (text.match(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g) || []).length;
  if (latinChars < 3) return false;
  return true;
}

/**
 * Check if text is mostly French (Latin characters with French-specific chars).
 */
export function isMostlyFrench(text: string, threshold = 0.70): boolean {
  if (!text || text.length < 3) return false;
  const frenchChars = (text.match(/[a-zA-ZàâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/g) || []).length;
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalLetters = frenchChars + arabicChars;
  if (totalLetters === 0) return false;
  return frenchChars / totalLetters >= threshold;
}

/**
 * Validate that text contains meaningful French content.
 */
export function isValidFrench(text: string | null | undefined, minLength = 4): boolean {
  if (!text || text.length < minLength) return false;
  const latinChars = (text.match(/[a-zA-ZàâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/g) || []).length;
  if (latinChars < 3) return false;
  return true;
}

/**
 * Check if text is mostly Turkish (Latin characters with Turkish-specific chars).
 */
export function isMostlyTurkish(text: string, threshold = 0.70): boolean {
  if (!text || text.length < 3) return false;
  const turkishChars = (text.match(/[a-zA-ZçğıöşüÇĞİÖŞÜ]/g) || []).length;
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalLetters = turkishChars + arabicChars;
  if (totalLetters === 0) return false;
  return turkishChars / totalLetters >= threshold;
}

/**
 * Validate that text contains meaningful Turkish content.
 */
export function isValidTurkish(text: string | null | undefined, minLength = 4): boolean {
  if (!text || text.length < minLength) return false;
  const latinChars = (text.match(/[a-zA-ZçğıöşüÇĞİÖŞÜ]/g) || []).length;
  if (latinChars < 3) return false;
  return true;
}

/**
 * Detect the dominant language of a text.
 * Returns 'ar' for Arabic, 'en' for English, 'es' for Spanish, 'fr' for French, 'tr' for Turkish, 'unknown' if unclear.
 */
export function detectLanguage(text: string): Locale | 'unknown' {
  if (!text || text.length < 10) return 'unknown';

  const cleanedText = text.replace(FINANCIAL_SYMBOLS_REGEX, '');
  const arabicChars = (cleanedText.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (cleanedText.match(/[a-zA-Z]/g) || []).length;
  const total = arabicChars + latinChars;

  if (total === 0) return 'unknown';
  const arabicRatio = arabicChars / total;

  if (arabicRatio >= 0.40) return 'ar';
  if (latinChars / total >= 0.50) {
    // Check for Turkish-specific characters (ş, ç, ö, ü, ğ, ı, İ)
    const turkishChars = (cleanedText.match(/[şçöüğıİ]/g) || []).length;
    if (turkishChars > 0) return 'tr';
    // Check for Spanish-specific characters (á, é, í, ó, ú, ü, ñ, ¿, ¡)
    const spanishChars = (cleanedText.match(/[áéíóúüñÁÉÍÓÚÜÑ¿¡]/g) || []).length;
    if (spanishChars > 0) return 'es';
    // Check for French-specific characters (à, â, ä, é, è, ê, ë, ï, î, ô, ù, û, ü, ÿ, ç, œ, æ)
    const frenchChars = (cleanedText.match(/[àâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]/g) || []).length;
    if (frenchChars > 0) return 'fr';
    return 'en';
  }
  return 'unknown';
}

// ─── English Garbage Content Detection ───────────────────────────

const ENGLISH_GARBAGE_PATTERNS = [
  /skip to (main )?content/i,
  /sign in/i,
  /create (an? )?account/i,
  /navigation menu/i,
  /cookie (policy|settings|notice)/i,
  /subscribe to newsletter/i,
  /accept (all )?cookies/i,
  /privacy policy/i,
  /terms of (service|use)/i,
  /related (articles|stories|posts)/i,
  /you may also like/i,
  /share this (article|post|story)/i,
  /comments \(\d+\)/i,
  /read more$/im,
  /click here to/i,
];

/**
 * Detect garbage content in English text.
 * Mirrors isGarbageContent() from publisher.ts but for English.
 */
export function isEnglishGarbageContent(text: string, minLength: number = 50): boolean {
  if (!text || text.length < minLength) return true;

  for (const pattern of ENGLISH_GARBAGE_PATTERNS) {
    if (pattern.test(text)) return true;
  }

  // Menu-like structure: many short lines
  const lines = text.split(/\n/).filter(l => l.trim().length > 0);
  if (lines.length > 15) {
    const shortLines = lines.filter(l => l.trim().length < 30).length;
    if (shortLines / lines.length > 0.7) return true;
  }

  // Repetitive content detection
  if (isEnglishRepetitiveContent(text)) return true;

  return false;
}

/**
 * Detect repetitive content in English text.
 * Mirrors isRepetitiveContent() from publisher.ts but for English.
 */
export function isEnglishRepetitiveContent(text: string): boolean {
  if (!text || text.length < 30) return false;

  const words = text
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  if (words.length < 10) return false;

  // English filler phrases
  const FILLER_PHRASES = /^(okay|yes|sure|indeed|certainly|absolutely|however|therefore|moreover|furthermore|thus|hence|well|right|exactly|really)$/i;
  let fillerCount = 0;
  for (const word of words) {
    if (FILLER_PHRASES.test(word)) fillerCount++;
  }
  if (fillerCount >= 3 && fillerCount / words.length > 0.15) return true;

  // Word frequency analysis
  const freq: Record<string, number> = {};
  for (const word of words) {
    const normalized = word.toLowerCase().trim();
    if (!normalized) continue;
    freq[normalized] = (freq[normalized] || 0) + 1;
  }

  const threshold = words.length * 0.25;
  for (const [word, count] of Object.entries(freq)) {
    if (count >= 5 && count > threshold) return true;
  }

  return false;
}

/**
 * Check if an English title is vague/meaningless.
 * Mirrors isVagueTitle() from publisher.ts but for English.
 */
export function isVagueEnglishTitle(title: string): boolean {
  if (!title || title.trim().length < 5) return true;

  // V416 FIX: Short financial headlines are valid — "Oil up 2%", "Fed on hold", "Gold falls"
  // Don't flag titles under 15 chars as vague if they contain financial keywords or numbers.
  const FINANCIAL_KEYWORDS = /\b(?:oil|gold|fed|gas|btc|eth|usd|dow|nasdaq|s&p|ftse|dax|nikkei|bond|etf|cpi|gdp|nfp|rate|rates|cut|hike|rise|fall|jump|drop|surge|slump|rally|gain|loss|up|down)\b/i;
  const HAS_NUMBER = /\d/;
  if (title.length < 15 && (FINANCIAL_KEYWORDS.test(title) || HAS_NUMBER.test(title))) {
    return false;  // Short financial headline with keyword or number — NOT vague
  }

  const ENGLISH_FUNCTION_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
    'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and', 'or',
    'if', 'while', 'about', 'up', 'it', 'its', 'this', 'that', 'these',
    'those', 'what', 'which', 'who', 'whom',
  ]);

  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);

  if (words.length < 4) return true;

  const contentWords = words.filter(w => !ENGLISH_FUNCTION_WORDS.has(w.toLowerCase()));
  if (contentWords.length < 3) return true;

  return false;
}

/** Detect if text is mostly French (enhanced with common words) */
export function isMostlyFrenchEnhanced(text: string, threshold = 0.60): boolean {
  if (!text || text.length < 20) return false;
  const frenchChars = text.match(/[àâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]/g);
  const frenchCommonWords = /\b(le|la|les|de|des|du|un|une|et|en|est|que|qui|dans|pour|pas|sur|ce|avec|ne|se|son|cette|il|elle|nous|vous|ils|elles|ont|sont|fait|tout|mais|ou|où|donc|or|ni|car|si|comme|plus|par|ses|aux|été|être|avoir|peut|aussi|entre|sans|alors)\b/gi;
  const wordMatches = text.match(frenchCommonWords);
  const score = (frenchChars?.length || 0) * 2 + (wordMatches?.length || 0);
  return score / (text.length / 10) > threshold;
}

/** Detect garbage content in French text */
export function isFrenchGarbageContent(text: string, minLength: number = 50): boolean {
  if (!text || text.length < minLength) return true;
  const lines = text.split(/\n/).filter(l => l.trim().length > 0);
  if (lines.length > 15) {
    const shortLines = lines.filter(l => l.trim().length < 30).length;
    if (shortLines / lines.length > 0.7) return true;
  }
  const frWords = text.replace(/[^a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);
  if (frWords.length < 10) return false;
  const freq: Record<string, number> = {};
  for (const word of frWords) {
    const normalized = word.toLowerCase().trim();
    if (!normalized) continue;
    freq[normalized] = (freq[normalized] || 0) + 1;
  }
  const frThreshold = frWords.length * 0.25;
  for (const [word, count] of Object.entries(freq)) {
    if (count >= 5 && count > frThreshold) return true;
  }
  return false;
}

/** Check if a French title is vague/meaningless */
export function isVagueFrenchTitle(title: string): boolean {
  if (!title || title.trim().length < 5) return true;
  const FRENCH_VAGUE = /^(analyse|rapport|marché|actualité|nouvelle|info|flash|alerte|mise à jour|bulletin|résumé|aperçu|point|note)$/i;
  if (FRENCH_VAGUE.test(title.trim())) return true;
  return false;
}

// ─── Locale-Aware Time Formatting ────────────────────────────────

/**
 * Format time ago in a locale-aware manner.
 * Replaces formatTimeAgo() from news-categories.ts with locale support.
 */
export function formatTimeAgoLocale(dateStr: string, locale: Locale = 'ar'): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return locale === 'ar' ? 'الآن' : locale === 'fr' ? 'maintenant' : locale === 'tr' ? 'şimdi' : locale === 'es' ? 'ahora' : 'now';
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return locale === 'ar' ? 'الآن' : locale === 'fr' ? 'maintenant' : locale === 'tr' ? 'şimdi' : locale === 'es' ? 'ahora' : 'now';
    if (diffMinutes < 60) {
      if (locale === 'ar') return `منذ ${diffMinutes} دقيقة`;
      if (locale === 'fr') return `il y a ${diffMinutes} min`;
      if (locale === 'tr') return `${diffMinutes} dakika önce`;
      if (locale === 'es') return `hace ${diffMinutes} min`;
      return `${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      if (locale === 'ar') return `منذ ${diffHours} ساعة`;
      if (locale === 'fr') return `il y a ${diffHours}h`;
      if (locale === 'tr') return `${diffHours} saat önce`;
      if (locale === 'es') return `hace ${diffHours}h`;
      return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      if (locale === 'ar') return `منذ ${diffDays} يوم`;
      if (locale === 'fr') return `il y a ${diffDays}j`;
      if (locale === 'tr') return `${diffDays} gün önce`;
      if (locale === 'es') return `hace ${diffDays}d`;
      return `${diffDays}d ago`;
    }

    const localeMap: Record<string, string> = { ar: 'ar-SA', en: 'en-US', es: 'es-ES', fr: 'fr-FR', tr: 'tr-TR' };
    return date.toLocaleDateString(
      locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'tr' ? 'tr-TR' : locale === 'es' ? 'es-ES' : 'en-US',
      { month: 'short', day: 'numeric' }
    );
  } catch {
    return locale === 'ar' ? 'الآن' : locale === 'fr' ? 'maintenant' : locale === 'tr' ? 'şimdi' : locale === 'es' ? 'ahora' : 'now';
  }
}

// ─── Locale-Aware Impact/Sentiment Labels ────────────────────────

export const IMPACT_CONFIG_EN: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: 'High', color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)' },
  medium: { label: 'Medium', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  low: { label: 'Low', color: '#00c896', bg: 'rgba(0,200,150,0.12)' },
};

export const IMPACT_CONFIG_FR: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: 'Élevé', color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)' },
  medium: { label: 'Moyen', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  low: { label: 'Faible', color: '#00c896', bg: 'rgba(0,200,150,0.12)' },
};

export const IMPACT_CONFIG_TR: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: 'Kritik', color: '#EF5350', bg: 'rgba(239,83,80,0.12)' },
  high:     { label: 'Yüksek', color: '#FFB800', bg: 'rgba(255,184,0,0.12)' },
  medium:   { label: 'Orta',   color: '#00E5FF', bg: 'rgba(0,229,255,0.12)' },
  low:      { label: 'Düşük',  color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
};

export const SENTIMENT_CONFIG_EN: Record<string, { label: string; color: string; bg: string }> = {
  positive: { label: 'Positive', color: '#00c896', bg: 'rgba(0,200,150,0.12)' },
  negative: { label: 'Negative', color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)' },
  neutral: { label: 'Neutral', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
};

export const SENTIMENT_CONFIG_FR: Record<string, { label: string; color: string; bg: string }> = {
  positive: { label: 'Positif', color: '#00c896', bg: 'rgba(0,200,150,0.12)' },
  negative: { label: 'Négatif', color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)' },
  neutral: { label: 'Neutre', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
};

export const SENTIMENT_CONFIG_TR: Record<string, { label: string; color: string; bg: string }> = {
  bullish:  { label: 'Yükseliş',  color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  bearish:  { label: 'Düşüş',     color: '#EF5350', bg: 'rgba(239,83,80,0.12)' },
  neutral:  { label: 'Nötr',      color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
  cautious: { label: 'Dikkatli',  color: '#FFB800', bg: 'rgba(255,184,0,0.12)' },
};

/**
 * Get locale-aware impact label.
 */
export const IMPACT_CONFIG_ES: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: 'Alto', color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)' },
  medium: { label: 'Medio', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  low: { label: 'Bajo', color: '#00c896', bg: 'rgba(0,200,150,0.12)' },
};

export const SENTIMENT_CONFIG_ES: Record<string, { label: string; color: string; bg: string }> = {
  positive: { label: 'Positivo', color: '#00c896', bg: 'rgba(0,200,150,0.12)' },
  negative: { label: 'Negativo', color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)' },
  neutral: { label: 'Neutral', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
};

export function getImpactLabel(level: string, locale: Locale = 'ar'): string {
  if (locale === 'en') return IMPACT_CONFIG_EN[level]?.label || level;
  if (locale === 'es') return IMPACT_CONFIG_ES[level]?.label || level;
  if (locale === 'fr') return IMPACT_CONFIG_FR[level]?.label || level;
  if (locale === 'tr') return IMPACT_CONFIG_TR[level]?.label || level;
  return IMPACT_CONFIG[level]?.label || level;
}

/**
 * Get locale-aware sentiment config.
 */
export function getSentimentConfig(locale: Locale = 'ar') {
  if (locale === 'en') return SENTIMENT_CONFIG_EN;
  if (locale === 'es') return SENTIMENT_CONFIG_ES;
  if (locale === 'fr') return SENTIMENT_CONFIG_FR;
  if (locale === 'tr') return SENTIMENT_CONFIG_TR;
  return SENTIMENT_CONFIG;
}

/**
 * Get category name for a given locale.
 */
export function getCategoryNameEn(category: string): string { return category; }
export function getCategoryNameFr(category: string): string { return category; }
export function getCategoryNameEs(category: string): string { return category; }
export function getCategoryNameTr(category: string): string { return category; }

/**
 * Translate category to locale.
 */
export function translateCategoryToEn(category: string): string { return category; }
export function translateCategoryToFr(category: string): string { return category; }
export function translateCategoryToEs(category: string): string { return category; }
export function translateCategoryToTr(category: string): string { return category; }

/**
 * Translate affected assets to locale.
 */
export function translateAffectedAssetsToEn(assets: any[]): any[] { return assets; }
export function translateAffectedAssetsToFr(assets: any[]): any[] { return assets; }
export function translateAffectedAssetsToEs(assets: any[]): any[] { return assets; }
export function translateAffectedAssetsToTr(assets: any[]): any[] { return assets; }

/**
 * Translate recommendation to locale.
 */
export function translateRecommendationToEn(rec: string): string { return rec; }
export function translateRecommendationToFr(rec: string): string { return rec; }
export function translateRecommendationToEs(rec: string): string { return rec; }
export function translateRecommendationToTr(rec: string): string { return rec; }

/**
 * Translate asset reason to locale.
 */
export function translateAssetReasonToEn(reason: string): string { return reason; }
export function translateAssetReasonToFr(reason: string): string { return reason; }
export function translateAssetReasonToEs(reason: string): string { return reason; }
export function translateAssetReasonToTr(reason: string): string { return reason; }

// ─── Category Name Constants ────────────────────────────────────
// Populated from NEWS_CATEGORIES — single source of truth
export const CATEGORY_NAME_EN: Record<string, string> = {
  economy: 'Economy', stocks: 'Stocks', forex: 'Forex', crypto: 'Crypto',
  energy: 'Energy', commodities: 'Commodities', bonds: 'Bonds',
  technology: 'Technology', technicalAnalysis: 'Technical Analysis',
  earnings: 'Earnings', realEstate: 'Real Estate', arabMarkets: 'Arab Markets',
  strategic: 'Geopolitics', banking: 'Banking',
};
export const CATEGORY_NAME_FR: Record<string, string> = {
  economy: 'Économie', stocks: 'Actions', forex: 'Devises', crypto: 'Crypto',
  energy: 'Énergie', commodities: 'Matières Premières', bonds: 'Obligations',
  technology: 'Technologie', technicalAnalysis: 'Analyse Technique',
  earnings: 'Résultats', realEstate: 'Immobilier', arabMarkets: 'Marchés Arabes',
  strategic: 'Géopolitique', banking: 'Banque',
};
export const CATEGORY_NAME_ES: Record<string, string> = {
  economy: 'Economía', stocks: 'Acciones', forex: 'Divisas', crypto: 'Criptomonedas',
  energy: 'Energía', commodities: 'Materias Primas', bonds: 'Bonos',
  technology: 'Tecnología', technicalAnalysis: 'Análisis Técnico',
  earnings: 'Resultados', realEstate: 'Inmobiliario', arabMarkets: 'Mercados Árabes',
  strategic: 'Geopolítica', banking: 'Banca',
};
export const CATEGORY_NAME_TR: Record<string, string> = {
  economy: 'Ekonomi', stocks: 'Hisseler', forex: 'Döviz', crypto: 'Kripto',
  energy: 'Enerji', commodities: 'Emtia', bonds: 'Tahviller',
  technology: 'Teknoloji', technicalAnalysis: 'Teknik Analiz',
  earnings: 'Kazançlar', realEstate: 'Gayrimenkul', arabMarkets: 'Arap Pazarları',
  strategic: 'Jeopolitik', banking: 'Bankacılık',
};

export const CATEGORY_AR_TO_EN: Record<string, string> = {
  'اقتصاد كلي': 'Economy', 'اقتصاد أمريكي': 'Economy', 'اقتصاد': 'Economy',
  'أسهم': 'Stocks', 'بورصة': 'Stocks',
  'عملات': 'Forex', 'فوركس': 'Forex',
  'كريبتو': 'Crypto', 'تشفير': 'Crypto', 'عملات رقمية': 'Crypto', 'أصول رقمية': 'Crypto',
  'طاقة': 'Energy', 'نفط': 'Energy', 'خام': 'Energy',
  'سلع': 'Commodities', 'معادن': 'Commodities', 'ذهب': 'Commodities',
  'بنوك مركزية': 'Banking', 'سندات': 'Bonds',
  'بنوك': 'Banking',
  'تقنية': 'Technology', 'تكنولوجيا': 'Technology',
  'تحليل فني': 'Technical Analysis',
  'أرباح شركات': 'Earnings',
  'عقارات': 'Real Estate',
  'أسواق عربية': 'Arab Markets', 'خليج': 'Arab Markets', 'سعودي': 'Arab Markets', 'إمارات': 'Arab Markets', 'مصر بورصة': 'Arab Markets', 'أبوظبي مالي': 'Arab Markets',
  'جيوسياسي': 'Geopolitics', 'سياسة': 'Geopolitics',
  'عاجل': 'Economy', // Breaking news defaults to Economy category
};
export const CATEGORY_AR_TO_FR: Record<string, string> = {
  'اقتصاد كلي': 'Économie', 'اقتصاد أمريكي': 'Économie', 'اقتصاد': 'Économie',
  'أسهم': 'Actions', 'بورصة': 'Actions',
  'عملات': 'Devises', 'فوركس': 'Devises',
  'كريبتو': 'Crypto', 'تشفير': 'Crypto', 'عملات رقمية': 'Crypto', 'أصول رقمية': 'Crypto',
  'طاقة': 'Énergie', 'نفط': 'Énergie', 'خام': 'Énergie',
  'سلع': 'Matières Premières', 'معادن': 'Matières Premières', 'ذهب': 'Matières Premières',
  'بنوك مركزية': 'Banque', 'سندات': 'Obligations',
  'بنوك': 'Banque',
  'تقنية': 'Technologie', 'تكنولوجيا': 'Technologie',
  'تحليل فني': 'Analyse Technique',
  'أرباح شركات': 'Résultats',
  'عقارات': 'Immobilier',
  'أسواق عربية': 'Marchés Arabes', 'خليج': 'Marchés Arabes', 'سعودي': 'Marchés Arabes', 'إمارات': 'Marchés Arabes', 'مصر بورصة': 'Marchés Arabes', 'أبوظبي مالي': 'Marchés Arabes',
  'جيوسياسي': 'Géopolitique', 'سياسة': 'Géopolitique',
  'عاجل': 'Économie',
};
export const CATEGORY_AR_TO_ES: Record<string, string> = {
  'اقتصاد كلي': 'Economía', 'اقتصاد أمريكي': 'Economía', 'اقتصاد': 'Economía',
  'أسهم': 'Acciones', 'بورصة': 'Acciones',
  'عملات': 'Divisas', 'فوركس': 'Divisas',
  'كريبتو': 'Criptomonedas', 'تشفير': 'Criptomonedas', 'عملات رقمية': 'Criptomonedas', 'أصول رقمية': 'Criptomonedas',
  'طاقة': 'Energía', 'نفط': 'Energía', 'خام': 'Energía',
  'سلع': 'Materias Primas', 'معادن': 'Materias Primas', 'ذهب': 'Materias Primas',
  'بنوك مركزية': 'Banca', 'سندات': 'Bonos',
  'بنوك': 'Banca',
  'تقنية': 'Tecnología', 'تكنولوجيا': 'Tecnología',
  'تحليل فني': 'Análisis Técnico',
  'أرباح شركات': 'Resultados',
  'عقارات': 'Inmobiliario',
  'أسواق عربية': 'Mercados Árabes', 'خليج': 'Mercados Árabes', 'سعودي': 'Mercados Árabes', 'إمارات': 'Mercados Árabes', 'مصر بورصة': 'Mercados Árabes', 'أبوظبي مالي': 'Mercados Árabes',
  'جيوسياسي': 'Geopolítica', 'سياسة': 'Geopolítica',
  'عاجل': 'Economía',
};
export const CATEGORY_AR_TO_TR: Record<string, string> = {
  'اقتصاد كلي': 'Ekonomi', 'اقتصاد أمريكي': 'Ekonomi', 'اقتصاد': 'Ekonomi',
  'أسهم': 'Hisseler', 'بورصة': 'Hisseler',
  'عملات': 'Döviz', 'فوركس': 'Döviz',
  'كريبتو': 'Kripto', 'تشفير': 'Kripto', 'عملات رقمية': 'Kripto', 'أصول رقمية': 'Kripto',
  'طاقة': 'Enerji', 'نفط': 'Enerji', 'خام': 'Enerji',
  'سلع': 'Emtia', 'معادن': 'Emtia', 'ذهب': 'Emtia',
  'بنوك مركزية': 'Bankacılık', 'سندات': 'Tahviller',
  'بنوك': 'Bankacılık',
  'تقنية': 'Teknoloji', 'تكنولوجيا': 'Teknoloji',
  'تحليل فني': 'Teknik Analiz',
  'أرباح شركات': 'Kazançlar',
  'عقارات': 'Gayrimenkul',
  'أسواق عربية': 'Arap Pazarları', 'خليج': 'Arap Pazarları', 'سعودي': 'Arap Pazarları', 'إمارات': 'Arap Pazarları', 'مصر بورصة': 'Arap Pazarları', 'أبوظبي مالي': 'Arap Pazarları',
  'جيوسياسي': 'Jeopolitik', 'سياسة': 'Jeopolitik',
  'عاجل': 'Ekonomi',
};

// ─── Sector/Report Translation Helpers ──────────────────────────
// V1192: Added SECTOR_MAP_AR — was missing, causing English sector names
// in the Arabic sectors page (e.g. "قطاع Technology" instead of "قطاع التكنولوجيا")
const SECTOR_MAP_AR: Record<string, string> = {
  'Energy': 'الطاقة', 'Oil': 'النفط', 'Gas': 'الغاز', 'OPEC': 'أوبك',
  'Stocks': 'الأسهم', 'Currencies': 'العملات', 'Forex': 'الفوركس', 'Crypto': 'العملات الرقمية', 'Gold': 'الذهب',
  'Commodities': 'السلع', 'Real Estate': 'العقارات', 'Housing': 'الإسكان',
  'Banks': 'البنوك', 'Interest': 'الفائدة', 'Islamic': 'الإسلامي',
  'Tech': 'التكنولوجيا', 'Technology': 'التكنولوجيا', 'AI': 'الذكاء الاصطناعي',
  'Economy': 'الاقتصاد', 'Inflation': 'التضخم', 'Unemployment': 'البطالة',
  'Health': 'الصحة', 'Healthcare': 'الرعاية الصحية', 'Pharma': 'الأدوية', 'Telecom': 'الاتصالات',
  'Agriculture': 'الزراعة', 'Education': 'التعليم', 'Transport': 'النقل',
  'Tourism': 'السياحة', 'Entertainment': 'الترفيه', 'Defense': 'الدفاع',
  'Technical Analysis': 'التحليل الفني', 'Earnings': 'نتائج الأعمال', 'Arab Markets': 'الأسواق العربية',
  'Macroeconomics': 'الاقتصاد الكلي', 'Geopolitics': 'الجيوسياسة', 'Infrastructure': 'البنية التحتية',
  'US Stocks': 'الأسهم الأمريكية', 'European Stocks': 'الأسهم الأوروبية', 'Asian Stocks': 'الأسهم الآسيوية',
  'Bonds': 'السندات', 'Economic Growth': 'النمو الاقتصادي', 'Interest Rates': 'أسعار الفائدة',
  'Trade': 'التجارة', 'Employment': 'التوظيف',
  'Consumer Cyclical': 'الاستهلاك الدوري', 'Consumer Defensive': 'السلع الاستهلاكية الأساسية',
  'Consumer Staples': 'السلع الاستهلاكية الأساسية', 'Consumer Discretionary': 'الاستهلاك الدوري',
  'Industrials': 'الصناعات', 'Industrial': 'الصناعات', 'Basic Materials': 'المواد الأساسية',
  'Materials': 'المواد الأساسية', 'Utilities': 'المرافق',
  'Communication Services': 'خدمات الاتصالات', 'Communications': 'خدمات الاتصالات',
  'Financial Services': 'الخدمات المالية', 'Financials': 'الخدمات المالية', 'Finance': 'الخدمات المالية',
  'Semiconductors': 'أشباه الموصلات', 'Semis': 'أشباه الموصلات',
  'Biotech': 'التكنولوجيا الحيوية', 'Biotechnology': 'التكنولوجيا الحيوية',
  'Pharmaceuticals': 'الأدوية', 'Automotive': 'السيارات', 'Autos': 'السيارات',
  'Aerospace': 'الفضاء والدفاع', 'Mining': 'التعدين', 'Retail': 'التجزئة',
  'Oil & Gas': 'الطاقة', 'Oil and Gas': 'الطاقة',
};

const SECTOR_MAP_FR: Record<string, string> = {
  'Energy': 'Énergie', 'Oil': 'Pétrole', 'Gas': 'Gaz', 'OPEC': 'OPEP',
  'Stocks': 'Actions', 'Currencies': 'Devises', 'Forex': 'Forex', 'Crypto': 'Crypto', 'Gold': 'Or',
  'Commodities': 'Matières Premières', 'Real Estate': 'Immobilier', 'Housing': 'Logement',
  'Banks': 'Banques', 'Interest': 'Intérêts', 'Islamic': 'Islamique',
  'Tech': 'Technologie', 'Technology': 'Technologie', 'AI': 'IA',
  'Economy': 'Économie', 'Inflation': 'Inflation', 'Unemployment': 'Chômage',
  'Health': 'Santé', 'Healthcare': 'Santé', 'Pharma': 'Pharmacie', 'Telecom': 'Télécoms',
  'Agriculture': 'Agriculture', 'Education': 'Éducation', 'Transport': 'Transport',
  'Tourism': 'Tourisme', 'Entertainment': 'Divertissement', 'Defense': 'Défense',
  'Technical Analysis': 'Analyse Technique', 'Earnings': 'Résultats', 'Arab Markets': 'Marchés Arabes',
  'Macroeconomics': 'Macroéconomie', 'Geopolitics': 'Géopolitique', 'Infrastructure': 'Infrastructure',
  'US Stocks': 'Actions US', 'European Stocks': 'Actions Européennes', 'Asian Stocks': 'Actions Asiatiques',
  'Bonds': 'Obligations', 'Economic Growth': 'Croissance Économique', 'Interest Rates': "Taux d'Intérêt",
  'Trade': 'Commerce', 'Employment': 'Emploi',
  'Consumer Cyclical': 'Consommation Cyclique', 'Consumer Defensive': 'Consommation Défensive',
  'Industrials': 'Industriels', 'Basic Materials': 'Matières de Base', 'Utilities': 'Services Publics',
  'Communication Services': 'Services de Communication', 'Financial Services': 'Services Financiers',
};

const SECTOR_MAP_ES: Record<string, string> = {
  'Energy': 'Energía', 'Oil': 'Petróleo', 'Gas': 'Gas', 'OPEC': 'OPEP',
  'Stocks': 'Acciones', 'Currencies': 'Divisas', 'Forex': 'Forex', 'Crypto': 'Criptomonedas', 'Gold': 'Oro',
  'Commodities': 'Materias Primas', 'Real Estate': 'Bienes Raíces', 'Housing': 'Vivienda',
  'Banks': 'Bancos', 'Interest': 'Interés', 'Islamic': 'Islámico',
  'Tech': 'Tecnología', 'Technology': 'Tecnología', 'AI': 'IA',
  'Economy': 'Economía', 'Inflation': 'Inflación', 'Unemployment': 'Desempleo',
  'Health': 'Salud', 'Healthcare': 'Salud', 'Pharma': 'Farmacia', 'Telecom': 'Telecomunicaciones',
  'Agriculture': 'Agricultura', 'Education': 'Educación', 'Transport': 'Transporte',
  'Tourism': 'Turismo', 'Entertainment': 'Entretenimiento', 'Defense': 'Defensa',
  'Technical Analysis': 'Análisis Técnico', 'Earnings': 'Ganancias', 'Arab Markets': 'Mercados Árabes',
  'Macroeconomics': 'Macroeconomía', 'Geopolitics': 'Geopolítica', 'Infrastructure': 'Infraestructura',
  'US Stocks': 'Acciones EE.UU.', 'European Stocks': 'Acciones Europeas', 'Asian Stocks': 'Acciones Asiáticas',
  'Bonds': 'Bonos', 'Economic Growth': 'Crecimiento Económico', 'Interest Rates': 'Tasas de Interés',
  'Trade': 'Comercio', 'Employment': 'Empleo',
  'Consumer Cyclical': 'Consumo Cíclico', 'Consumer Defensive': 'Consumo Defensivo',
  'Industrials': 'Industriales', 'Basic Materials': 'Materias Básicas', 'Utilities': 'Servicios Públicos',
  'Communication Services': 'Servicios de Comunicación', 'Financial Services': 'Servicios Financieros',
};

const SECTOR_MAP_TR: Record<string, string> = {
  'Energy': 'Enerji', 'Oil': 'Petrol', 'Gas': 'Gaz', 'OPEC': 'OPEC',
  'Stocks': 'Hisseler', 'Currencies': 'Döviz', 'Forex': 'Forex', 'Crypto': 'Kripto', 'Gold': 'Altın',
  'Commodities': 'Hammaddeler', 'Real Estate': 'Gayrimenkul', 'Housing': 'Konut',
  'Banks': 'Bankalar', 'Interest': 'Faiz', 'Islamic': 'İslami',
  'Tech': 'Teknoloji', 'Technology': 'Teknoloji', 'AI': 'YZ',
  'Economy': 'Ekonomi', 'Inflation': 'Enflasyon', 'Unemployment': 'İşsizlik',
  'Health': 'Sağlık', 'Healthcare': 'Sağlık', 'Pharma': 'İlaç', 'Telecom': 'Telekomünikasyon',
  'Agriculture': 'Tarım', 'Education': 'Eğitim', 'Transport': 'Ulaşım',
  'Tourism': 'Turizm', 'Entertainment': 'Eğlence', 'Defense': 'Savunma',
  'Technical Analysis': 'Teknik Analiz', 'Earnings': 'Kazanç Raporları', 'Arab Markets': 'Arap Piyasaları',
  'Macroeconomics': 'Makroekonomi', 'Geopolitics': 'Jeopolitik', 'Infrastructure': 'Altyapı',
  'US Stocks': 'ABD Hisseleri', 'European Stocks': 'Avrupa Hisseleri', 'Asian Stocks': 'Asya Hisseleri',
  'Bonds': 'Tahviller', 'Economic Growth': 'Ekonomik Büyüme', 'Interest Rates': 'Faiz Oranları',
  'Trade': 'Ticaret', 'Employment': 'İstihdam',
  'Consumer Cyclical': 'Döngüsel Tüketim', 'Consumer Defensive': 'Savunma Tüketim',
  'Industrials': 'Sanayi', 'Basic Materials': 'Temel Malzemeler', 'Utilities': 'Kamu Hizmetleri',
  'Communication Services': 'İletişim Hizmetleri', 'Financial Services': 'Finansal Hizmetler',
};

export function translateSectorToFr(sector: string): string {
  return SECTOR_MAP_FR[sector] || sector;
}
export function translateSectorsToFr(sectors: any[]): any[] {
  return sectors.map(s => {
    if (typeof s === 'string') return translateSectorToFr(s);
    return { ...s, sector: translateSectorToFr(s.sector) };
  });
}
export function translateSectorToEn(sector: string): string { return sector; }
export function translateSectorsToEn(sectors: any[]): any[] { return sectors; }
export function translateSectorToEs(sector: string): string {
  return SECTOR_MAP_ES[sector] || sector;
}
export function translateSectorsToEs(sectors: any[]): any[] {
  return sectors.map(s => {
    if (typeof s === 'string') return translateSectorToEs(s);
    return { ...s, sector: translateSectorToEs(s.sector) };
  });
}
export function translateSectorToTr(sector: string): string {
  return SECTOR_MAP_TR[sector] || sector;
}
export function translateSectorsToTr(sectors: any[]): any[] {
  return sectors.map(s => {
    if (typeof s === 'string') return translateSectorToTr(s);
    return { ...s, sector: translateSectorToTr(s.sector) };
  });
}

// ─── Locale-aware sector translation dispatcher ─────────────────────
// V1192: translateSectorsToAr now actually translates (was a no-op before)
export function translateSectorsToAr(sectors: any[]): any[] {
  return sectors.map(s => {
    if (typeof s === 'string') return SECTOR_MAP_AR[s] || s;
    return { ...s, sector: SECTOR_MAP_AR[s.sector] || s.sector };
  });
}
export function translateSectorsToLocale(sectors: any[], locale: Locale = 'ar'): any[] {
  if (locale === 'en') return translateSectorsToEn(sectors);
  if (locale === 'fr') return translateSectorsToFr(sectors);
  if (locale === 'es') return translateSectorsToEs(sectors);
  if (locale === 'tr') return translateSectorsToTr(sectors);
  if (locale === 'ar') return translateSectorsToAr(sectors);
  return sectors;
}

// Translate a single sector name to the given locale
// V1192: Arabic now uses SECTOR_MAP_AR (was returning English unchanged)
export function translateSectorToLocale(sector: string, locale: Locale = 'ar'): string {
  if (locale === 'en') return translateSectorToEn(sector);
  if (locale === 'fr') return translateSectorToFr(sector);
  if (locale === 'es') return translateSectorToEs(sector);
  if (locale === 'tr') return translateSectorToTr(sector);
  if (locale === 'ar') return SECTOR_MAP_AR[sector] || sector;
  return sector;
}

// V1192: Single-sector Arabic translation (was missing)
export function translateSectorToAr(sector: string): string {
  return SECTOR_MAP_AR[sector] || sector;
}

// ─── Locale Path Helper ──────────────────────────────────────────
export function getLocalePath(locale: Locale): string {
  if (locale === 'ar') return '';
  return `/${locale}`;
}

// ─── Turkish Quality Helpers ─────────────────────────────────────
export function isTurkishGarbageContent(text: string, minLength: number = 50): boolean {
  if (!text || text.length < minLength) return true;
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length > 15) {
    const shortLines = lines.filter(l => l.trim().length < 30).length;
    if (shortLines / lines.length > 0.7) return true;
  }
  return false;
}

export function isVagueTurkishTitle(title: string): boolean {
  if (!title || title.trim().length < 5) return true;
  const TURKISH_VAGUE = /^(analiz|rapor|piyasa|haber|güncel|flash|uyarı|bülten|özet|genel|not)$/i;
  if (TURKISH_VAGUE.test(title.trim())) return true;
  return false;
}
