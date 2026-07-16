// ─── Stock Analysis Shared i18n Index ────────────────────────────
// Provides getStockLabels() and t() helper for all stock components.
// Locale files: ar.ts, en.ts, es.ts, fr.ts, tr.ts
// Keys use dot-namespacing for component-specific labels (analysis.*, detail.*, screener.*)
// while truly shared labels live at the root level.

import ar from './ar';
import en from './en';
import es from './es';
import fr from './fr';
import tr from './tr';

// ── Locale map ──

const localeMap: Record<string, Record<string, string>> = {
  ar,
  en,
  es,
  fr,
  tr,
};

// ── Fallback chain ──

const FALLBACK_LOCALE = 'en';

/**
 * Returns the merged flat label map for a given locale.
 * Falls back to English for missing keys, then returns the key itself.
 */
export function getStockLabels(locale: string): Record<string, string> {
  const labels = localeMap[locale] || localeMap[FALLBACK_LOCALE];
  const fallback = localeMap[FALLBACK_LOCALE];

  // If the requested locale is English (or fallback), return as-is
  if (locale === FALLBACK_LOCALE || labels === fallback) {
    return { ...labels };
  }

  // Merge: requested locale on top of fallback so every key has a value
  return { ...fallback, ...labels };
}

/**
 * Lookup helper – returns the translated string for a key in the given locale.
 * Supports dot-notation keys like 'analysis.pageTitle' or root keys like 'signal'.
 * Falls back to English, then returns the raw key if nothing matches.
 *
 * @param locale - 'ar' | 'en' | 'fr'
 * @param key    - dot-notation label key, e.g. 'screener.title' or 'bullish'
 */
export function t(locale: string, key: string): string {
  const labels = localeMap[locale];
  if (labels && labels[key]) return labels[key];

  const fallback = localeMap[FALLBACK_LOCALE];
  if (fallback && fallback[key]) return fallback[key];

  return key;
}

/**
 * Type-safe key list (useful for IDE autocomplete when consuming components
 * know the shape).  This is a union of all known keys across locales.
 */
export type StockLabelKey = keyof typeof en;

/**
 * Re-export individual locale records for direct import if needed.
 */
export { ar, en, es, fr, tr };
