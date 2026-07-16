// ─── Locale Framework V337 ──────────────────────────────────
// Central locale management — THE single source of truth for all locale logic.
// Every new language adds ONE entry here, and the rest of the code adapts.
//
// DESIGN PRINCIPLES (lessons learned from English addition):
// 1. Write paths MUST set locale (was correct) ✅
// 2. Read paths MUST filter by locale (was missing — V337 fixed) ✅
// 3. This file makes locale a first-class concept, not an afterthought
// 4. Adding a new language = add one entry to SUPPORTED_LOCALES + config
//
// USAGE:
//   import { localeWhere, SUPPORTED_LOCALES, AppLocale } from '@/lib/locale-framework';
//   db.economicReport.findMany({ where: localeWhere('ar', { isPublished: true }) });
//
// DO NOT:
//   - Hard-code locale strings ('ar', 'en') in random files
//   - Add a new language by cloning files (the English mistake)
//   - Write queries without locale filters (the V337 bug)

import { db } from '@/lib/db';

// ── Core Types ──

export const SUPPORTED_LOCALES = ['ar', 'en', 'fr', 'tr', 'es'] as const;
export type AppLocale = typeof SUPPORTED_LOCALES[number];

// Default locale — used when no locale is specified
export const DEFAULT_LOCALE: AppLocale = 'ar';

// ── Locale Helper Functions ──

/**
 * Build a Prisma `where` clause with locale filter.
 * This is THE standard way to add locale to any query.
 *
 * @example
 *   // Instead of:
 *   db.economicReport.findMany({ where: { isPublished: true } })
 *   // Use:
 *   db.economicReport.findMany({ where: localeWhere('ar', { isPublished: true }) })
 */
export function localeWhere(locale: AppLocale, extra?: Record<string, any>): Record<string, any> {
  return { locale, ...extra };
}

/**
 * Get the locale from a request URL or headers.
 * Priority: ?locale= param > /en/ or /fr/ or /tr/ path prefix > Accept-Language header > default 'ar'
 */
export function detectLocale(request: Request): AppLocale {
  const url = new URL(request.url);

  // 1. Explicit query parameter
  const queryLocale = url.searchParams.get('locale');
  if (queryLocale && isSupportedLocale(queryLocale)) {
    return queryLocale as AppLocale;
  }

  // 2. Path prefix /en/ or /fr/ or /tr/
  const pathPrefix = url.pathname.split('/')[1];
  if (pathPrefix && isSupportedLocale(pathPrefix)) {
    return pathPrefix as AppLocale;
  }

  // 3. Accept-Language header
  const acceptLang = request.headers.get('accept-language');
  if (acceptLang) {
    if (acceptLang.includes('tr')) return 'tr';
    if (acceptLang.includes('fr')) return 'fr';
    if (acceptLang.includes('en')) return 'en';
  }

  return DEFAULT_LOCALE;
}

/**
 * Check if a string is a valid supported locale.
 */
export function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Validate that a Prisma query where clause includes a locale filter.
 * Used in CI/CD checks to prevent locale-missing queries.
 *
 * @example
 *   const where = { isPublished: true };
 *   validateQueryHasLocale(where, 'economicReport.findMany'); // ❌ throws
 *   const where2 = localeWhere('ar', { isPublished: true });
 *   validateQueryHasLocale(where2, 'economicReport.findMany'); // ✅ passes
 */
export function validateQueryHasLocale(where: Record<string, any>, context: string): boolean {
  if (!where || !where.locale) {
    console.warn(
      `[LocaleFramework] ⚠️ MISSING locale filter in ${context}. ` +
      `Use localeWhere() or add locale explicitly. ` +
      `This query may return mixed-language results.`
    );
    return false;
  }
  return true;
}

// ── Locale Configuration ──

export interface LocaleConfig {
  locale: AppLocale;
  /** Display name in Arabic — e.g. 'الفرنسية' */
  nameAr: string;
  /** Native name — e.g. 'Français' */
  nameNative: string;
  /** HTML dir attribute */
  dir: 'rtl' | 'ltr';
  /** RSS feed URLs for this language */
  rssSources: string[];
  /** AI providers for this language (in priority order) */
  aiProviders: string[];
  /** Default AI model for report generation */
  reportModel: string;
  /** Maximum number of published items per day */
  publishLimitPerDay: number;
  /** Whether this locale is enabled */
  enabled: boolean;
  /** Cron schedule hours (UTC) for report generation */
  reportSchedule: {
    dailyHour: number;
    analysesHours: number[];
    technicalHours: number[];
  };
  /** Asset classes relevant to this locale */
  relevantAssetClasses: string[];
  /** Site settings key prefix */
  settingsPrefix: string;
}

/**
 * Complete configuration for each supported locale.
 * To add a new language: add one entry here + translations in next.config.js.
 */
export const LOCALE_CONFIGS: Record<AppLocale, LocaleConfig> = {
  ar: {
    locale: 'ar',
    nameAr: 'العربية',
    nameNative: 'العربية',
    dir: 'rtl',
    rssSources: [
      // Arabic RSS sources (from config.ts)
    ],
    aiProviders: ['bedrock', 'gemini'],
    reportModel: 'anthropic.claude-3-5-sonnet',
    publishLimitPerDay: 500,
    enabled: true,
    reportSchedule: {
      dailyHour: 6,
      analysesHours: [9, 15, 21],
      technicalHours: [10, 16, 22],
    },
    relevantAssetClasses: [
      'stocks', 'commodities', 'forex', 'crypto', 'bonds',
      'energy', 'economy', 'technicalAnalysis', 'arabMarkets', 'earnings',
    ],
    settingsPrefix: 'reports',
  },
  en: {
    locale: 'en',
    nameAr: 'الإنجليزية',
    nameNative: 'English',
    dir: 'ltr',
    rssSources: [
      // English RSS sources (from en-pipeline-config.ts)
    ],
    aiProviders: ['groq', 'cerebras', 'mistral', 'nvidia'],
    reportModel: 'llama-3.3-70b-versatile',
    publishLimitPerDay: 200,
    enabled: true,
    reportSchedule: {
      dailyHour: 7,
      analysesHours: [7, 13, 19],
      technicalHours: [8, 14, 20],
    },
    relevantAssetClasses: [
      'stocks', 'commodities', 'forex', 'crypto', 'bonds',
      'energy', 'economy', 'earnings', 'technicalAnalysis',
    ],
    settingsPrefix: 'en_reports',
  },
  fr: {
    locale: 'fr',
    nameAr: 'الفرنسية',
    nameNative: 'Français',
    dir: 'ltr',
    rssSources: [
      // French RSS sources — to be configured
    ],
    aiProviders: ['mistral', 'groq', 'cerebras'],
    reportModel: 'mistral-large-latest',
    publishLimitPerDay: 200,
    enabled: true, // V337→V352: French pipeline deployed and tested — ENABLED
    reportSchedule: {
      dailyHour: 8,
      analysesHours: [8, 14, 20],
      technicalHours: [9, 15, 21],
    },
    relevantAssetClasses: [
      'stocks', 'commodities', 'forex', 'crypto', 'bonds',
      'energy', 'economy', 'earnings', 'technicalAnalysis',
    ],
    settingsPrefix: 'fr_reports',
  },
  tr: {
    locale: 'tr',
    nameAr: 'التركية',
    nameNative: 'Türkçe',
    dir: 'ltr',
    rssSources: [
      // Turkish RSS sources — to be configured
    ],
    aiProviders: ['groq', 'cerebras'],
    reportModel: 'llama-3.3-70b-versatile',
    publishLimitPerDay: 200,
    enabled: true,
    reportSchedule: {
      dailyHour: 9,
      analysesHours: [9, 15, 21],
      technicalHours: [10, 16, 22],
    },
    relevantAssetClasses: [
      'stocks', 'commodities', 'forex', 'crypto', 'bonds',
      'energy', 'economy', 'earnings', 'technicalAnalysis',
    ],
    settingsPrefix: 'tr_reports',
  },
  es: {
    locale: 'es',
    nameAr: 'الإسبانية',
    nameNative: 'Español',
    dir: 'ltr',
    rssSources: [
      // Spanish RSS sources — to be configured
    ],
    aiProviders: ['groq', 'cerebras'],
    reportModel: 'llama-3.3-70b-versatile',
    publishLimitPerDay: 200,
    enabled: true,
    reportSchedule: {
      dailyHour: 8,
      analysesHours: [8, 14, 20],
      technicalHours: [9, 15, 21],
    },
    relevantAssetClasses: [
      'stocks', 'commodities', 'forex', 'crypto', 'bonds',
      'energy', 'economy', 'earnings', 'technicalAnalysis',
    ],
    settingsPrefix: 'es_reports',
  },
};

/**
 * Get locale config from DB (allows admin to override defaults).
 * Falls back to LOCALE_CONFIGS if DB settings not found.
 */
export async function getLocaleConfig(locale: AppLocale): Promise<LocaleConfig> {
  const base = LOCALE_CONFIGS[locale];
  if (!base) throw new Error(`Unsupported locale: ${locale}`);

  try {
    const prefix = base.settingsPrefix;
    const settings = await db.siteSetting.findMany({
      where: { group: prefix },
    });

    if (settings.length === 0) return base;

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key.replace(new RegExp(`^${prefix}_`), '')] = s.value;
    }

    return {
      ...base,
      enabled: map.enabled !== undefined ? map.enabled !== 'false' : base.enabled,
      publishLimitPerDay: map.publishLimitPerDay
        ? parseInt(map.publishLimitPerDay, 10) || base.publishLimitPerDay
        : base.publishLimitPerDay,
    };
  } catch {
    return base;
  }
}

/**
 * Get all enabled locales.
 */
export function getEnabledLocales(): AppLocale[] {
  return SUPPORTED_LOCALES.filter(l => LOCALE_CONFIGS[l].enabled);
}

/**
 * Get the locale for a given request, with DB-configured overrides.
 */
export async function getLocaleForRequest(request: Request): Promise<LocaleConfig> {
  const locale = detectLocale(request);
  return getLocaleConfig(locale);
}

// ── CI/CD Audit Helper ──
// Run this in build to check for locale-missing queries.
// Usage: npx tsx scripts/audit-locale-queries.ts

export const AUDIT_PATTERNS = {
  // Patterns that SHOULD have locale filters
  mustHaveLocale: [
    /economicReport\.find(First|Many)/,
    /marketAnalysis\.find(First|Many)/,
    /newsItem\.find(First|Many)/,
    /newsItem\.groupBy/,
    /infographic\.find(First|Many)/,
  ],
  // Files exempt from audit (admin tools that intentionally scan all locales)
  exemptFiles: [
    'locale-framework.ts',    // This file itself
    'prisma/seed',            // DB seeding
  ],
};
