// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════
// ─── Pipeline Publisher Agent V97 ───────────────────────────
// THE GATEKEEPER — the ONLY place that sets isReady=true AND isPublished=true.
// V44: Expanded truncated sentence detection + crypto sector validation:
//   1. Arabic title (titleAr) — mostly Arabic, NOT English copy, NOT too short/vague
//   2. Arabic content (contentAr) — at least 300 chars, not garbage, no foreign scripts
//   3. AI-GENERATED image (generatedImage) — MANDATORY, must be base64, filesystem path, or R2 URL (not temp external URL)
//   4. AI analysis (aiAnalysis with Arabic fullContent) — MANDATORY, no truncated sentences
//   5. Slug
//   6. No Chinese/CJK characters in Arabic fields
//   7. Title must be meaningful (not a vague fragment)
//   8. No truncated/incomplete sentences in key text fields
//   9. V44 NEW: Check recommendation field for truncation (4th structural issue)
//   10. V44 NEW: Check fullContent section [6] for truncation
//   11. V44 NEW: Crypto/ETF articles must NOT say "لا ينطبق" on tradeable assets
// V42: Sets isReady=true AND isPublished=true AND publishedAt atomically.
// isReady=true is IRREVERSIBLE — once published, NEVER unpublished or demoted.
// NO ARTICLE IS EVER DELETED after publishing.
// V42: generatedImage must be base64 data, NOT an external URL.

import { db } from '@/lib/db';
import { PIPELINE_CONFIG } from '../config';
import { isR2Url, isSvgPlaceholderImage } from '@/lib/image-storage';
import { formatBreakingNews, formatImportantNews, formatMarketUpdate } from '@/lib/telegram-formatter';
import { publishToChannel } from '@/lib/telegram-channel-publisher';

export interface PublishResult {
  articleId: string;
  success: boolean;
  reason?: string;
  duration: number;
}

export async function publishArticle(articleId: string): Promise<PublishResult> {
  const startTime = Date.now();
  const result: PublishResult = { articleId, success: false, duration: 0 };

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      result.reason = 'Article not found';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Already published? NEVER un-publish
    if (article.isReady) {
      result.success = true;
      result.duration = Date.now() - startTime;
      return result;
    }

    // ── Determine article locale ──
    // V243→ES: Support Arabic, English, Spanish, French, and Turkish articles.
    // Latin-script locales (en, es, fr, tr) use the English validation path.
    // Default to 'ar' for existing articles (backward compatible).
    const articleLocale: 'ar' | 'en' | 'es' | 'fr' | 'tr' = ((article as any).locale === 'en' ? 'en' : (article as any).locale === 'es' ? 'es' : (article as any).locale === 'fr' ? 'fr' : (article as any).locale === 'tr' ? 'tr' : 'ar');

    // ── V359: PUBLISH QUOTA CHECK ──
    // This is the PRIMARY enforcement point for hourly/daily publishing limits.
    // ALL quality articles go through the publisher, so this check catches
    // ALL publishing paths (orchestrator, cron, housekeeping, etc.).
    // The quota manager uses DB counting + in-process tracking to prevent
    // race conditions between concurrent publishing paths.
    try {
      const { canPublish, recordPublish } = await import('../publish-quota');
      const quotaCheck = await canPublish(articleLocale as 'ar' | 'en' | 'es' | 'fr' | 'tr');
      if (!quotaCheck.allowed) {
        result.reason = `PUBLISH QUOTA EXCEEDED: ${quotaCheck.reason}`;
        result.duration = Date.now() - startTime;
        console.warn(`[Publisher V359] Article ${articleId} BLOCKED by quota: ${quotaCheck.reason}`);
        return result;
      }
    } catch (quotaErr: any) {
      // Non-critical — if quota check fails, allow publishing (fail-open)
      // This prevents a DB error from permanently blocking all publishing
      console.warn(`[Publisher V359] Quota check failed for ${articleLocale}, allowing publish: ${quotaErr.message}`);
    }

    // ── Validate all required fields ──
    const validationErrors: string[] = [];
    // V244: Declare qualityWarnings early so downgraded checks can push to it during validation
    const qualityWarnings: string[] = [];

    if (articleLocale === 'fr') {
      // ── FRENCH VALIDATION PATH (V374) ──
      // French pipeline: title/content/summary are French — stored in same fields as English.
      // French articles do NOT have titleAr/contentAr — they use title/content directly.
      const { isMostlyFrench: isMostlyFr, isFrenchGarbageContent: isFrGarbage, isVagueFrenchTitle: isVagueFr } = require('@/lib/locale');
      const { FR_PIPELINE_CONFIG } = require('@/lib/pipeline/fr-pipeline-config');

      // 1. French title (MANDATORY — must be mostly French/Latin)
      if (!article.title || article.title.length < FR_PIPELINE_CONFIG.MIN_FR_TITLE_LENGTH) {
        validationErrors.push('Missing or short French title');
      } else if (!isMostlyFr(article.title)) {
        validationErrors.push('French title is not mostly French');
      }

      // 1b. French title must be meaningful
      if (article.title && isVagueFr(article.title) && article.title.length < 10) {
        validationErrors.push('French title is a vague fragment, not a meaningful title');
      }

      // 1c. No CJK/Cyrillic in French fields
      const frFieldsToCheck: [string, string | null][] = [
        ['title', article.title],
        ['summary', article.summary],
        ['content', article.content],
      ];
      for (const [fieldName, value] of frFieldsToCheck) {
        if (value && hasCJK(value)) {
          validationErrors.push(`${fieldName} contains CJK characters (foreign script contamination)`);
        }
        if (value && /[Ѐ-ӿ]/.test(value)) {
          validationErrors.push(`${fieldName} contains Cyrillic characters (foreign script contamination)`);
        }
      }

      // 1d. Arabic contamination check — French content should NOT be mostly Arabic
      // V373: Only block if >50% Arabic chars (some financial terms are valid)
      if (article.title) {
        const arabicChars = (article.title.match(/[\u0600-\u06FF]/g) || []).length;
        const latinChars = (article.title.match(/[a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]/g) || []).length;
        if (arabicChars > latinChars && arabicChars > 5) {
          validationErrors.push('French title is mostly Arabic — content appears to be in wrong language');
        }
      }

      // 2. French content — at least MIN_FR_CONTENT_LENGTH chars, not garbage
      const hasFrContent = article.content &&
        article.content.length >= FR_PIPELINE_CONFIG.MIN_FR_CONTENT_LENGTH &&
        isMostlyFr(article.content, 0.50) &&
        !isFrGarbage(article.content, FR_PIPELINE_CONFIG.MIN_FR_CONTENT_LENGTH);

      if (!hasFrContent) {
        validationErrors.push(`Missing or short French content (need ${FR_PIPELINE_CONFIG.MIN_FR_CONTENT_LENGTH}+ chars, French, not garbage)`);
      }

    } else if (articleLocale === 'en') {
      // ── ENGLISH VALIDATION PATH ──
      // English pipeline: title/content/summary are English — no Arabic translation needed.

      // 1. English title (MANDATORY — must be mostly English)
      const { isMostlyEnglish: isMostlyEn, isVagueEnglishTitle: isVagueEn, isEnglishGarbageContent: isEnGarbage } = require('@/lib/locale');

      // V414: Import EN_PIPELINE_CONFIG for threshold alignment
      const { EN_PIPELINE_CONFIG: enCfg } = require('@/lib/pipeline/en-pipeline-config');

      // V416 FIX: Use enCfg.MIN_EN_TITLE_LENGTH (4) from config instead of hardcoded value.
      if (!article.title || article.title.length < enCfg.MIN_EN_TITLE_LENGTH) {
        validationErrors.push('Missing or short English title');
      } else if (!isMostlyEn(article.title, enCfg.MIN_ENGLISH_RATIO)) {
        // V414: Use MIN_ENGLISH_RATIO (0.50) from config instead of isMostlyEnglish default (0.70).
        // The processor validates at 0.50, so the publisher must use the same threshold.
        validationErrors.push('English title is not mostly English');
      }

      // 1b. English title must be meaningful
      // V414: Added length guard (< 10 chars) — matches Turkish pipeline behavior.
      // Short titles like "Fed cuts rate" should not be flagged as vague.
      if (article.title && article.title.length < 10 && isVagueEn(article.title)) {
        validationErrors.push('English title is a vague fragment, not a meaningful title');
      }

      // 1c. No CJK/Cyrillic in English fields
      const enFieldsToCheck: [string, string | null][] = [
        ['title', article.title],
        ['summary', article.summary],
        ['content', article.content],
      ];
      for (const [fieldName, value] of enFieldsToCheck) {
        if (value && hasCJK(value)) {
          validationErrors.push(`${fieldName} contains CJK characters (foreign script contamination)`);
        }
        if (value && /[Ѐ-ӿ]/.test(value)) {
          validationErrors.push(`${fieldName} contains Cyrillic characters (foreign script contamination)`);
        }
      }

      // 2. English content — at least MIN_EN_CONTENT_LENGTH chars, not garbage
      // V413: Changed from hardcoded 200 → EN_PIPELINE_CONFIG.MIN_EN_CONTENT_LENGTH (80).
      // The 200-char threshold was rejecting many valid RSS articles with short summaries,
      // causing them to fall into degraded mode or be stuck forever. French uses 80, Turkish uses 80.
      // V416 FIX: Removed duplicate require() — use `enCfg` (already imported at line 153).
      const hasEnContent = article.content &&
        article.content.length >= enCfg.MIN_EN_CONTENT_LENGTH &&
        isMostlyEn(article.content, enCfg.MIN_ENGLISH_RATIO) &&
        !isEnGarbage(article.content, enCfg.MIN_EN_CONTENT_LENGTH);

      if (!hasEnContent) {
        validationErrors.push(`Missing or short English content (need ${enCfg.MIN_EN_CONTENT_LENGTH}+ chars, English, not garbage)`);
      }

    } else if (articleLocale === 'tr') {
      // ── TURKISH VALIDATION PATH ──
      // Turkish pipeline: title/content/summary are Turkish — stored in same fields as English/French.
      // Turkish articles do NOT have titleAr/contentAr — they use title/content directly.
      const { isMostlyTurkish: isMostlyTr, isTurkishGarbageContent: isTrGarbage, isVagueTurkishTitle: isVagueTr } = require('@/lib/locale');
      const { TR_PIPELINE_CONFIG } = require('@/lib/pipeline/tr-pipeline-config');

      // 1. Turkish title (MANDATORY — must be mostly Turkish/Latin)
      if (!article.title || article.title.length < TR_PIPELINE_CONFIG.MIN_TR_TITLE_LENGTH) {
        validationErrors.push('Missing or short Turkish title');
      } else if (!isMostlyTr(article.title)) {
        validationErrors.push('Turkish title is not mostly Turkish');
      }

      // 1b. Turkish title must be meaningful
      if (article.title && isVagueTr(article.title) && article.title.length < 10) {
        validationErrors.push('Turkish title is a vague fragment, not a meaningful title');
      }

      // 1c. No CJK/Cyrillic in Turkish fields
      const trFieldsToCheck: [string, string | null][] = [
        ['title', article.title],
        ['summary', article.summary],
        ['content', article.content],
      ];
      for (const [fieldName, value] of trFieldsToCheck) {
        if (value && hasCJK(value)) {
          validationErrors.push(`${fieldName} contains CJK characters (foreign script contamination)`);
        }
        if (value && /[Ѐ-ӿ]/.test(value)) {
          validationErrors.push(`${fieldName} contains Cyrillic characters (foreign script contamination)`);
        }
      }

      // 1d. Arabic contamination check — Turkish content should NOT be mostly Arabic
      if (article.title) {
        const arabicChars = (article.title.match(/[\u0600-\u06FF]/g) || []).length;
        const latinChars = (article.title.match(/[a-zA-ZçğıöşüÇĞİÖŞÜâîûÂÎÛ]/g) || []).length;
        if (arabicChars > latinChars && arabicChars > 5) {
          validationErrors.push('Turkish title is mostly Arabic — content appears to be in wrong language');
        }
      }

      // 2. Turkish content — at least MIN_TR_CONTENT_LENGTH chars, not garbage
      const hasTrContent = article.content &&
        article.content.length >= TR_PIPELINE_CONFIG.MIN_TR_CONTENT_LENGTH &&
        isMostlyTr(article.content, 0.50) &&
        !isTrGarbage(article.content, TR_PIPELINE_CONFIG.MIN_TR_CONTENT_LENGTH);

      if (!hasTrContent) {
        validationErrors.push(`Missing or short Turkish content (need ${TR_PIPELINE_CONFIG.MIN_TR_CONTENT_LENGTH}+ chars, Turkish, not garbage)`);
      }

    } else if (articleLocale === 'es') {
      // ── SPANISH VALIDATION PATH ──
      // Spanish pipeline: title/content/summary are Spanish — stored in same fields as English/French.
      // Spanish articles do NOT have titleAr/contentAr — they use title/content directly.
      const { isMostlySpanish: isMostlyEs } = require('@/lib/locale');
      const { ES_PIPELINE_CONFIG } = require('@/lib/pipeline/es-pipeline-config');

      // 1. Spanish title (MANDATORY — must be mostly Spanish/Latin)
      if (!article.title || article.title.length < ES_PIPELINE_CONFIG.MIN_ES_TITLE_LENGTH) {
        validationErrors.push('Missing or short Spanish title');
      } else if (!isMostlyEs(article.title)) {
        validationErrors.push('Spanish title is not mostly Spanish');
      }

      // 1b. No CJK/Cyrillic in Spanish fields
      const esFieldsToCheck: [string, string | null][] = [
        ['title', article.title],
        ['summary', article.summary],
        ['content', article.content],
      ];
      for (const [fieldName, value] of esFieldsToCheck) {
        if (value && hasCJKCharacters(value)) {
          validationErrors.push(`${fieldName} contains CJK characters (foreign script contamination)`);
        }
        if (value && /[\u0400-\u04FF]/.test(value)) {
          validationErrors.push(`${fieldName} contains Cyrillic characters (foreign script contamination)`);
        }
      }

      // 1c. Arabic contamination check — Spanish content should NOT be mostly Arabic
      if (article.title) {
        const arabicChars = (article.title.match(/[\u0600-\u06FF]/g) || []).length;
        const latinChars = (article.title.match(/[a-zA-ZáéíóúñüÁÉÍÓÚÜÑ¿¡]/g) || []).length;
        if (arabicChars > latinChars && arabicChars > 5) {
          validationErrors.push('Spanish title is mostly Arabic — content appears to be in wrong language');
        }
      }

      // 2. Spanish content — at least MIN_ES_CONTENT_LENGTH chars, not garbage
      const hasEsContent = article.content &&
        article.content.length >= ES_PIPELINE_CONFIG.MIN_ES_CONTENT_LENGTH &&
        isMostlyEs(article.content, 0.50);

      if (!hasEsContent) {
        validationErrors.push(`Missing or short Spanish content (need ${ES_PIPELINE_CONFIG.MIN_ES_CONTENT_LENGTH}+ chars, Spanish)`);
      }

    } else {
      // ── ARABIC VALIDATION PATH (PRESERVED — unchanged from original) ──

      // 1. Arabic title (MANDATORY — must be mostly Arabic)
      if (!article.titleAr || article.titleAr.length < PIPELINE_CONFIG.MIN_TITLE_AR_LENGTH) {
        validationErrors.push('Missing or short titleAr');
      } else if (!isMostlyArabic(article.titleAr)) {
        validationErrors.push('titleAr is not mostly Arabic');
      }

      // 1b. V43→V244: Title vagueness check — DOWNGRADED to quality warning only.
      // Short financial headlines like "Fed يرفع الفائدة" or "BTC يتجاوز 100K" are legitimate
      // but have few content words. Blocking them loses valid articles.
      if (article.titleAr && isVagueTitle(article.titleAr)) {
        qualityWarnings.push('titleAr may be a vague fragment (too few content words) — publishing anyway');
      }

      // 1c. V43: No CJK (Chinese/Japanese/Korean) characters in Arabic fields
      // This catches bugs like "据说" appearing in Arabic text
      const cjkFieldsToCheck: [string, string | null][] = [
        ['titleAr', article.titleAr],
        ['summaryAr', article.summaryAr],
        ['contentAr', article.contentAr],
      ];
      for (const [fieldName, value] of cjkFieldsToCheck) {
        if (value && hasCJKCharacters(value)) {
          validationErrors.push(`${fieldName} contains CJK characters (foreign script contamination) — found: ${extractCJKSample(value)}`);
        }
      }

      // V152: No Cyrillic (Russian, etc.) characters in Arabic fields
      for (const [fieldName, value] of cjkFieldsToCheck) {
        if (value && /[\u0400-\u04FF]/.test(value)) {
          validationErrors.push(`${fieldName} contains Cyrillic characters (foreign script contamination)`);
        }
      }

      // V154: Mixed-language title detection — titleAr should NOT start with English
      if (article.titleAr && isMixedLanguageTitle(article.titleAr)) {
        validationErrors.push('titleAr starts with English text — Arabic title should begin with Arabic words');
      }

      // V154→V244: Duplicate headline check — 3-day window + near-duplicate tolerance.
      // Financial news often covers the same topic daily (e.g., "Fed يرفع الفائدة" each meeting).
      // Only block exact duplicates within 3 days; older duplicates are different news cycles.
      // Near-duplicates (normalized edit distance) are allowed — same topic, different details.
      if (article.titleAr && article.titleAr.length >= 10) {
        try {
          const normalizedTitle = article.titleAr.trim().replace(/\s+/g, ' ');
          const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
          const existingDuplicate = await db.newsItem.findFirst({
            where: {
              titleAr: normalizedTitle,
              isReady: true,
              id: { not: articleId },
              publishedAt: { gte: threeDaysAgo },
            },
            select: { id: true },
          });
          if (existingDuplicate) {
            validationErrors.push('titleAr is a duplicate of an already-published article (within 3 days)');
          }
        } catch (dupErr: unknown) {
          const errMsg = dupErr instanceof Error ? dupErr.message : String(dupErr);
          console.warn(`[Publisher V154] Duplicate title check failed: ${errMsg}`);
        }
      }

      // 1d. V98→V244: Repetitive content check — DOWNGRADED to quality warning.
      // Logging but NOT blocking — some repetitive patterns are false positives
      // (e.g., financial terms repeated across bullet points in summary).
      if (article.titleAr && isRepetitiveContent(article.titleAr)) {
        qualityWarnings.push('titleAr may have repetitive content — publishing with warning');
      }
      if (article.summaryAr && isRepetitiveContent(article.summaryAr)) {
        qualityWarnings.push('summaryAr may have repetitive content — publishing with warning');
      }

      // V156→V244: English sentence detection in contentAr/summaryAr — DOWNGRADED to warning.
      // Financial content naturally contains English terms, ticker explanations, etc.
      // Only flag as quality warning, not blocking.
      if (article.contentAr && hasEnglishSentences(article.contentAr)) {
        qualityWarnings.push('contentAr may contain English sentences — publishing with warning');
      }
      if (article.summaryAr && hasEnglishSentences(article.summaryAr)) {
        qualityWarnings.push('summaryAr may contain English sentences — publishing with warning');
      }

      // 2. Arabic content — at least 200 chars, not garbage
      const hasContentAr = article.contentAr &&
        article.contentAr.length >= PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH &&
        isMostlyArabic(article.contentAr) &&
        !isGarbageContent(article.contentAr);

      if (!hasContentAr) {
        validationErrors.push(`Missing or short Arabic contentAr (need ${PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH}+ chars, Arabic, not garbage)`);
      }
    } // end of Arabic validation else block

    // V243: English-specific duplicate and quality checks
    // V374: French-specific duplicate check added
    if (articleLocale === 'en') {
      // V414 FIX: Duplicate headline check for English articles — now with 3-day window.
      // Previously checked ALL time (no publishedAt filter), which permanently blocked
      // any title ever published. Financial news repeats topics cyclically
      // ("S&P 500 rises", "Fed holds rates"), so a permanent block killed 90%+ of
      // English publishing. Now matches FR/TR/ES which all use a 3-day window.
      if (article.title && article.title.length >= 10) {
        try {
          const normalizedTitle = article.title.trim().replace(/\s+/g, ' ');
          const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
          const existingDuplicate = await db.newsItem.findFirst({
            where: {
              title: normalizedTitle,
              locale: articleLocale,
              isReady: true,
              id: { not: articleId },
              publishedAt: { gte: threeDaysAgo },
            },
            select: { id: true },
          });
          if (existingDuplicate) {
            validationErrors.push('English title is a duplicate of an already-published article (within 3 days)');
          }
        } catch (dupErr: unknown) {
          const errMsg = dupErr instanceof Error ? dupErr.message : String(dupErr);
          console.warn(`[Publisher V414] English duplicate title check failed: ${errMsg}`);
        }
      }
    } else if (articleLocale === 'fr') {
      // V374: Duplicate headline check for French articles
      if (article.title && article.title.length >= 10) {
        try {
          const normalizedTitle = article.title.trim().replace(/\s+/g, ' ');
          const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
          const existingDuplicate = await db.newsItem.findFirst({
            where: {
              title: normalizedTitle,
              locale: 'fr',
              isReady: true,
              id: { not: articleId },
              publishedAt: { gte: threeDaysAgo },
            },
            select: { id: true },
          });
          if (existingDuplicate) {
            validationErrors.push('French title is a duplicate of an already-published article (within 3 days)');
          }
        } catch (dupErr: unknown) {
          const errMsg = dupErr instanceof Error ? dupErr.message : String(dupErr);
          console.warn(`[Publisher V374] French duplicate title check failed: ${errMsg}`);
        }
      }
    } else if (articleLocale === 'tr') {
      // Duplicate headline check for Turkish articles
      if (article.title && article.title.length >= 10) {
        try {
          const normalizedTitle = article.title.trim().replace(/\s+/g, ' ');
          const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
          const existingDuplicate = await db.newsItem.findFirst({
            where: {
              title: normalizedTitle,
              locale: 'tr',
              isReady: true,
              id: { not: articleId },
              publishedAt: { gte: threeDaysAgo },
            },
            select: { id: true },
          });
          if (existingDuplicate) {
            validationErrors.push('Turkish title is a duplicate of an already-published article (within 3 days)');
          }
        } catch (dupErr: unknown) {
          const errMsg = dupErr instanceof Error ? dupErr.message : String(dupErr);
          console.warn(`[Publisher] Turkish duplicate title check failed: ${errMsg}`);
        }
      }
    } else if (articleLocale === 'es') {
      // Duplicate headline check for Spanish articles
      if (article.title && article.title.length >= 10) {
        try {
          const normalizedTitle = article.title.trim().replace(/\s+/g, ' ');
          const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
          const existingDuplicate = await db.newsItem.findFirst({
            where: {
              title: normalizedTitle,
              locale: 'es',
              isReady: true,
              id: { not: articleId },
              publishedAt: { gte: threeDaysAgo },
            },
            select: { id: true },
          });
          if (existingDuplicate) {
            validationErrors.push('Spanish title is a duplicate of an already-published article (within 3 days)');
          }
        } catch (dupErr: unknown) {
          const errMsg = dupErr instanceof Error ? dupErr.message : String(dupErr);
          console.warn(`[Publisher] Spanish duplicate title check failed: ${errMsg}`);
        }
      }
    }

    // 3. V97/V233: AI-GENERATED image is MANDATORY — and it must be a REAL image, not a placeholder.
    // Accepted formats: base64 data URL (JPEG/PNG/WebP), filesystem path, or R2 URL (persistent).
    // Rejected: SVG placeholders (not a real image), temporary external URLs.
    // V233: SVG placeholders are NO LONGER accepted for publishing. Articles with SVG
    //   images will be blocked and reset to 'analyzed' stage for real image retry.
    //   A 1.5KB SVG placeholder is NOT a valid news article image — readers see a
    //   colored rectangle instead of a professional illustration.
    const hasGeneratedImage = !!(article.generatedImage && article.generatedImage.length > 10);
    const isExternalUrl = article.generatedImage?.startsWith('http') && !isR2Url(article.generatedImage!);
    const isSvgPlaceholder = isSvgPlaceholderImage(article.generatedImage);
    // V233: Also detect SVG stored in R2 (files ending in .svg or with very small size in R2 path) — covered by isSvgPlaceholderImage
    if (!hasGeneratedImage) {
      validationErrors.push('Missing AI-generated image (generatedImage) — source imageUrl is NOT sufficient');
    } else if (isSvgPlaceholder) {
      validationErrors.push('generatedImage is an SVG placeholder — not a real AI-generated image. Article must have a JPEG/PNG/WebP image to be published');
    } else if (isExternalUrl) {
      validationErrors.push('generatedImage is a temporary external URL (not R2/base64/filesystem) — images must be stored persistently to prevent expiration');
    }

    // 4. Slug (MANDATORY for SEO)
    if (!article.slug || article.slug.length < 2) {
      validationErrors.push('Missing slug');
    }

    // 5. AI Analysis — MANDATORY with locale-appropriate fullContent
    // V156: Typed AI analysis structure — replaces `any` with proper interface
    // V243: Locale-aware — Arabic articles need Arabic fullContent, English articles need English fullContent
    // V374: French articles need French/Latin fullContent
    interface AiAnalysis {
      fullContent?: string;
      recommendation?: string;
      keyTakeaways?: string[];
      keyInsights?: string[];
      [key: string]: unknown; // Allow additional AI-generated fields
    }
    let hasValidAnalysis = false;
    let parsedAnalysis: AiAnalysis | null = null;
    if (article.aiAnalysis && article.aiAnalysis.length > 50) {
      try {
        parsedAnalysis = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
        const fullContent = parsedAnalysis.fullContent || '';
        if (articleLocale === 'en' || articleLocale === 'es') {
          // Latin-script pipeline: fullContent must be in a Latin-script language
          if (fullContent.length > 50 && /[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]{3,}/.test(fullContent)) {
            hasValidAnalysis = true;
          }
        } else if (articleLocale === 'fr') {
          // V374: French pipeline: fullContent must contain French/Latin characters
          // French uses accented Latin chars (é, è, ê, ç, etc.) so check for Latin script
          if (fullContent.length > 50 && /[a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]{3,}/.test(fullContent)) {
            hasValidAnalysis = true;
          }
        } else if (articleLocale === 'tr') {
          // Turkish pipeline: fullContent must contain Turkish/Latin characters
          // Turkish uses Latin script with special chars (ç, ğ, ı, ö, ş, ü)
          if (fullContent.length > 50 && /[a-zA-ZçğıöşüÇĞİÖŞÜâîûÂÎÛ]{3,}/.test(fullContent)) {
            hasValidAnalysis = true;
          }
        } else {
          // Arabic pipeline: fullContent must contain Arabic (PRESERVED original logic)
          if (fullContent.length > 50 && /[\u0600-\u06FF]/.test(fullContent)) {
            hasValidAnalysis = true;
          }
        }
      } catch (parseErr) {
        // V155: Log analysis parse failure instead of silently ignoring
        console.warn(`[Publisher V155] Failed to parse aiAnalysis for ${articleId}: ${parseErr instanceof Error ? parseErr.message : 'invalid JSON'}`);
      }
    }
    if (!hasValidAnalysis) {
      const langLabel = articleLocale === 'en' ? 'English' : articleLocale === 'es' ? 'Spanish' : articleLocale === 'fr' ? 'French' : articleLocale === 'tr' ? 'Turkish' : 'Arabic';
      validationErrors.push(`Missing or invalid AI analysis (must have ${langLabel} fullContent)`);
    }

    // V73: SOFT VALIDATION — Separated into CRITICAL (blocking) and QUALITY (non-blocking) checks.
    // CRITICAL checks: Missing required content (titleAr, contentAr, image, slug, analysis)
    // QUALITY checks: Truncated sentences, pipe chars, contradictory figures, vague title
    // Articles that fail CRITICAL checks are BLOCKED.
    // Articles that fail only QUALITY checks are PUBLISHED with a warning log.
    // This prevents the pipeline from stalling when AI quality is marginal.
    const criticalErrors: string[] = [];
    // V244: qualityWarnings already declared above (before the validation block)
    // so that downgraded checks can push directly to it during validation.

    // ── CRITICAL: Missing required fields (already checked above, but re-categorize) ──
    // Validation errors from checks 1-5 above are CRITICAL
    for (const err of validationErrors) {
      // V414: Added locale-aware critical patterns — previously only checked for Arabic errors,
      // so English/French/Turkish/Spanish validation failures were downgraded to warnings.
      if (err.includes('Missing') || err.includes('short')
          || err.includes('not mostly Arabic') || err.includes('not mostly English')
          || err.includes('not mostly French') || err.includes('not mostly Turkish')
          || err.includes('not mostly Spanish')
          || err.includes('not valid JSON') || err.includes('no Arabic fullContent')
          || err.includes('is an external URL')
          || err.includes('duplicate of an already-published article')) {  // V244: Duplicate is still critical
        criticalErrors.push(err);
      } else {
        qualityWarnings.push(err);
      }
    }

    // ── V43/V44 quality checks (now NON-BLOCKING in V73) ──
    // These were blocking publishing entirely, causing pipeline stalls.
    // In V73, they only generate warnings but don't prevent publishing.

    // V44: Check recommendation for truncation (NON-BLOCKING in V73)
    if (parsedAnalysis) {
      const rec = String(parsedAnalysis.recommendation || '');
      if (rec.length > 15) {
        const recTrimmed = rec.trim();
        const endsWithPunctuation = /[.؟!؛]$/.test(recTrimmed);
        const endsWithEllipsis = /\.{2,}|…$/.test(recTrimmed);
        const endsWithIncomplete = /(?:قبل|بعد|عند|حتى|من|إلى|على|عن|مع|في|بدون|خلال|نحو|حوالي|دون)\s*$/.test(recTrimmed);

        if ((!endsWithPunctuation && !endsWithEllipsis) || endsWithIncomplete) {
          qualityWarnings.push('recommendation is truncated (no proper ending punctuation or ends with preposition)');
          // V73: Auto-fix truncated recommendation by adding ellipsis
          try {
            const fixedRec = recTrimmed.endsWith('...') ? recTrimmed : recTrimmed + '...';
            parsedAnalysis.recommendation = fixedRec;
            const updatedAnalysis = JSON.stringify(parsedAnalysis);
            await db.newsItem.update({
              where: { id: articleId },
              data: { aiAnalysis: updatedAnalysis },
            });
          } catch (fixErr: unknown) {
            const errMsg = fixErr instanceof Error ? fixErr.message : String(fixErr);
            console.warn(`[Publisher V73] Failed to auto-fix recommendation: ${errMsg}`);
          }
        }
      }
    }

    // 5c: Check for pipe character (NON-BLOCKING in V73 — auto-fix instead)
    // V374: Locale-aware — French/English use content field, Arabic uses contentAr
    const contentField = articleLocale === 'ar' ? article.contentAr : article.content;
    if (contentField && contentField.includes('|')) {
      qualityWarnings.push(`${articleLocale === 'ar' ? 'contentAr' : 'content'} contains pipe character — auto-fixing`);
      // V73: Auto-fix: replace pipe with newline
      try {
        const fixedContent = contentField.replace(/\|/g, '\n');
        await db.newsItem.update({
          where: { id: articleId },
          data: articleLocale === 'ar' ? { contentAr: fixedContent } : { content: fixedContent },
        });
        if (articleLocale === 'ar') {
          article.contentAr = fixedContent;
        } else {
          article.content = fixedContent;
        }
      } catch (fixErr: unknown) {
        const errMsg = fixErr instanceof Error ? fixErr.message : String(fixErr);
        console.warn(`[Publisher V73] Failed to auto-fix pipe chars: ${errMsg}`);
      }
    }

    // 5b: Check for truncated sentences (NON-BLOCKING in V73)
    // V374: Locale-aware — use appropriate content field per locale
    const fieldsForCompleteness: [string, string | null][] = [
      [articleLocale === 'ar' ? 'contentAr' : 'content', contentField],
    ];
    if (parsedAnalysis) {
      const takeaways = parsedAnalysis.keyTakeaways || parsedAnalysis.keyInsights || [];
      if (Array.isArray(takeaways)) {
        for (let i = 0; i < Math.min(takeaways.length, 4); i++) {
          fieldsForCompleteness.push([`keyTakeaways[${i}]`, String(takeaways[i])]);
        }
      }
    }
    for (const [fieldName, value] of fieldsForCompleteness) {
      if (value && hasTruncatedSentence(value)) {
        qualityWarnings.push(`${fieldName} contains truncated/incomplete sentence`);
      }
    }

    // 5d: Check for contradictory financial figures (NON-BLOCKING in V73)
    // V73: This check had too many false positives — different time periods, currencies, etc.
    // Downgraded to warning-only.
    if (article.summaryAr && article.contentAr) {
      const summaryNums = extractFinancialFigures(article.summaryAr);
      const contentNums = extractFinancialFigures(article.contentAr);
      const summaryByMetric: Record<string, number[]> = {};
      for (const fig of summaryNums) {
        if (!summaryByMetric[fig.metric]) summaryByMetric[fig.metric] = [];
        summaryByMetric[fig.metric].push(fig.value);
      }
      const contentByMetric: Record<string, number[]> = {};
      for (const fig of contentNums) {
        if (!contentByMetric[fig.metric]) contentByMetric[fig.metric] = [];
        contentByMetric[fig.metric].push(fig.value);
      }
      for (const metric of Object.keys(summaryByMetric)) {
        const sv = summaryByMetric[metric];
        const cv = contentByMetric[metric] || [];
        const fabricated = cv.filter(v => !sv.some(s => Math.abs(v - s) / Math.max(s, 1) < 0.1));
        if (fabricated.length > 0) {
          qualityWarnings.push(`Possible contradictory figures: ${metric} source [${sv}] vs content [${cv}]`);
        }
      }
    }

    // ── Decision ──
    // V73: Only CRITICAL errors block publishing. Quality warnings are logged but don't block.
    if (criticalErrors.length > 0) {
      result.reason = criticalErrors.join('; ');
      result.duration = Date.now() - startTime;

      const { recordError } = await import('../queue/job-manager');
      await recordError(articleId, `Publish validation failed: ${result.reason}`);

      console.warn(`[Publisher V73] Article ${articleId} BLOCKED: ${result.reason}`);
      return result;
    }

    if (qualityWarnings.length > 0) {
      console.warn(`[Publisher V73] Article ${articleId} PUBLISHED WITH WARNINGS: ${qualityWarnings.join('; ')}`);
    }

    // ── ALL CHECKS PASSED — Publish! ──
    // V42: Set isReady=true AND isPublished=true AND publishedAt atomically.
    // isReady=true is IRREVERSIBLE — this article will NEVER be unpublished or deleted.
    // publishedAt is set ONCE and NEVER changed.
    // V46 FIX: Gracefully handle missing publishedAt column — try with it first,
    // fall back to update without it if the column doesn't exist yet.
    try {
      await db.newsItem.update({
        where: { id: articleId },
        data: {
          isReady: true,
          isPublished: true,
          publishedAt: new Date(),
          processingStage: 'imaged',
        },
      });
    } catch (updateErr: unknown) {
      const updateMessage = updateErr instanceof Error ? updateErr.message : String(updateErr);
      if (updateMessage.includes('publishedAt') || updateMessage.includes('column')) {
        // Column doesn't exist yet — publish without it
        console.warn(`[Publisher V46] publishedAt column missing, publishing without it: ${updateMessage.slice(0, 100)}`);
        await db.newsItem.update({
          where: { id: articleId },
          data: {
            isReady: true,
            isPublished: true,
            processingStage: 'imaged',
          },
        });
      } else {
        throw updateErr;
      }
    }

    result.success = true;
    result.duration = Date.now() - startTime;

    // V359: Record this publish in the quota manager's in-process tracking
    // This ensures subsequent canPublish() calls account for this article
    try {
      const { recordPublish } = await import('../publish-quota');
      recordPublish(articleLocale as 'ar' | 'en' | 'es' | 'fr' | 'tr');
    } catch { /* non-critical */ }

    console.log(`[Publisher] ✓ PUBLISHED: "${article.titleAr?.slice(0, 60) || article.title?.slice(0, 60)}" (content=${article.contentAr?.length || 0}chars, image=AI, analysis=yes)`);

    // ── Send Telegram notification for published articles ──
    // V146: Now sends notifications for ALL published articles, not just breaking/high-impact.
    // - Breaking news → 'breaking' notification type (with impact emoji + sentiment)
    // - High-impact articles → 'analysis' notification type
    // - Medium-impact articles → 'analysis' notification type (NEW)
    // - Low-impact articles → skipped (too noisy for subscribers)
    // The cron job (every 5 min) catches any notifications missed by the publisher.
    if (article.newsType === 'breaking' || article.impactLevel === 'high' || article.impactLevel === 'medium') {
      try {
        const { notifyTelegramSubscribers } = await import('@/lib/telegram-notifier');
        const title = article.titleAr || article.title;
        const summary = article.summaryAr || article.summary || '';

        if (article.newsType === 'breaking') {
          const message = formatBreakingNews({
            title,
            summary: summary.slice(0, 250) || undefined,
            impactLevel: article.impactLevel,
            sentiment: article.sentiment,
            slug: article.slug || undefined,
            id: article.id,
          });

          notifyTelegramSubscribers('breaking', message).then(count => {
            if (count > 0) console.log(`[Publisher] Telegram breaking news sent to ${count} subscribers`);
          }).catch(err => console.error('[Publisher V156] Telegram breaking news notification failed:', err instanceof Error ? err.message : err));
        } else if (article.impactLevel === 'high') {
          const message = formatImportantNews({
            title,
            summary: summary.slice(0, 200) || undefined,
            sentiment: article.sentiment,
            slug: article.slug || undefined,
            id: article.id,
          });

          notifyTelegramSubscribers('analysis', message).then(count => {
            if (count > 0) console.log(`[Publisher] Telegram high-impact news sent to ${count} subscribers`);
          }).catch(err => console.error('[Publisher V156] Telegram high-impact notification failed:', err instanceof Error ? err.message : err));
        } else if (article.impactLevel === 'medium') {
          // V146: NEW — Send medium-impact articles as analysis notifications
          const message = formatMarketUpdate({
            title,
            summary: summary.slice(0, 150) || undefined,
            slug: article.slug || undefined,
            id: article.id,
          });

          notifyTelegramSubscribers('analysis', message).then(count => {
            if (count > 0) console.log(`[Publisher] Telegram medium-impact news sent to ${count} subscribers`);
          }).catch(err => console.error('[Publisher V156] Telegram medium-impact notification failed:', err instanceof Error ? err.message : err));
        }
      } catch (tgErr: unknown) {
        // Don't block publishing on Telegram failure
        const tgMessage = tgErr instanceof Error ? tgErr.message : String(tgErr);
        console.warn(`[Publisher] Telegram notification failed: ${tgMessage}`);
      }
    }

    // ── V212→V213: Publish to @rouatradingnews channel with improved format ──
    // V213 FIX: ALL published articles are now sent to the channel.
    // Previously, only breaking/high/medium impact articles were sent,
    // but most articles have impactLevel='low' and newsType='live',
    // causing 90%+ of articles to NEVER appear in the channel.
    // The channel is the public face of the platform — every published
    // article should appear there with appropriate formatting.
    try {
      const chResult = await publishToChannel({
        titleAr: article.titleAr,
        title: article.title,
        summaryAr: article.summaryAr,
        summary: article.summary,
        contentAr: article.contentAr,
        newsType: article.newsType,
        sentiment: article.sentiment,
        impactLevel: article.impactLevel,
        affectedAssets: article.affectedAssets,
        category: article.category,
        slug: article.slug,
        source: article.sourceName || article.source,
        aiAnalysis: article.aiAnalysis,
        generatedImage: article.generatedImage,
        imageUrl: article.imageUrl,
      });
      if (chResult.success) {
        const hasImage = !!(article.generatedImage || article.imageUrl);
        console.log(`[Publisher V2] ✓ Channel published: "${(article.titleAr || article.title).slice(0, 50)}" [${article.newsType}/${article.impactLevel}]${hasImage ? ' +IMG' : ''}`);
      } else {
        console.warn(`[Publisher V2] Channel publish failed: ${chResult.error}`);
      }
    } catch (chErr: unknown) {
      const chMsg = chErr instanceof Error ? chErr.message : String(chErr);
      console.warn(`[Publisher V2] Channel publish error: ${chMsg}`);
    }

    return result;
  } catch (err: unknown) {
    result.reason = err instanceof Error ? err.message : String(err);
    result.duration = Date.now() - startTime;
    console.error(`[Publisher] Fatal error for ${articleId}:`, result.reason);
    return result;
  }
}

// ── V154: Mixed-Language Title Detection ─────────────────────
// An Arabic title should START with Arabic text, not English.
// Financial titles may contain English tickers (S&P 500, BTC, GDP)
// but the primary language of an Arabic news title should be Arabic.
// Examples caught:
//   - "S&P 500 rises to record high" (fully English)
//   - "AAPL earnings beat expectations" (fully English)
//   - "Bitcoin BTC surges past $100K" (mostly English)
// Allowed:
//   - "مؤشر S&P 500 يرتفع لمستوى قياسي" (starts with Arabic)
//   - "سهم AAPL يتجاوز التوقعات" (starts with Arabic)
function isMixedLanguageTitle(title: string): boolean {
  if (!title || title.trim().length < 4) return false;

  const trimmed = title.trim();

  // V240: Allow titles that start with well-known financial entities followed by Arabic.
  // Financial news naturally starts with company names: "S&P 500 ترتفع", "Fed Rate قرر",
  // "Apple تُعلن", "NVIDIA تتجاوز". These are VALID Arabic financial titles.
  // Only block if the title has 4+ consecutive English words at the start (likely full English).
  const firstWords = trimmed.split(/\s+/).slice(0, 5);
  let consecutiveEnglish = 0;
  for (const word of firstWords) {
    if (/^[A-Za-z]/.test(word) && word.length > 1) {
      consecutiveEnglish++;
    } else {
      break; // Stop counting at first non-English word
    }
  }

  // V240→V244: Only block if 8+ consecutive English words at start (was 4).
  // Financial titles like "Fed Rate Decision Impact Market" (4 words) are valid Arabic
  // financial headlines with English entity names. Only truly English titles have 8+ words.
  if (consecutiveEnglish >= 8) return true;

  // Check: is the ENTIRE title in English? (no Arabic at all)
  const hasArabic = /[\u0600-\u06FF]/.test(trimmed);
  if (!hasArabic) return true;

  return false;
}

// Check if text is mostly Arabic (55% threshold for financial text)
// V113: Exclude known financial English abbreviations from the Latin char count.
// Financial articles naturally contain terms like S&P, GDP, IPO, ETF, etc.
// These should NOT count against the Arabic ratio.
function isMostlyArabic(text: string): boolean {
  if (!text || text.length < 3) return false;

  // V113: Remove known financial English symbols/abbreviations before counting
  // These are legitimate parts of Arabic financial text and should not reduce the Arabic ratio
  const FINANCIAL_SYMBOLS = /\b(?:S&P|GDP|IPO|ETF|CPI|NFP|PMI|FOMC|DXY|TNX|TLT|XAUUSD|GLD|SPY|QQQ|DIA|XLF|XLRE|XLK|XLU|XLV|VTV|IBIT|FBTC|ARKB|COIN|MSTR|BTC|ETH|NYSE|NASDAQ|NYMEX|COMEX|WTI|Brent|AAPL|MSFT|GOOGL|AMZN|TSLA|NVDA|META|FED|ECB|BOJ|BOE|SNB|RBA|BOC|RBNZ|Fed|VIX|FOMC|CME|ICE|CBOT|E-mini|E-micro|AI|IT|ESG|EBITDA|ROE|ROI|EPS|P\/E|P\/B|YTD|YoY|QoQ|MoM|FWD|BPS|MBS|ABS|CLO|CDO|CDS|OTC|SEC|CFTC|FINRA|FDIC|OPEC|EIA|API|DOE|ISM|ADP)\b/gi;

  const cleanedText = text.replace(FINANCIAL_SYMBOLS, '');

  const arabicChars = (cleanedText.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (cleanedText.match(/[a-zA-Z]/g) || []).length;
  const totalLetters = arabicChars + latinChars;

  if (totalLetters === 0) return false;
  const ratio = arabicChars / totalLetters;

  if (ratio < PIPELINE_CONFIG.ARABIC_RATIO_THRESHOLD || arabicChars < PIPELINE_CONFIG.MIN_ARABIC_CHARS) {
    return false;
  }

  return true;
}

// ── V43: Foreign Script Detection ──

// Check if text contains CJK (Chinese/Japanese/Korean) characters
// These should NEVER appear in Arabic financial content
function hasCJKCharacters(text: string): boolean {
  return /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(text);
}

// Alias used in French/Spanish/Turkish validation blocks
const hasCJK = hasCJKCharacters;

// Extract a sample of CJK characters for error messages (max 20 chars)
function extractCJKSample(text: string): string {
  const matches = text.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]+/g) || [];
  return matches.slice(0, 3).join(' ').slice(0, 20);
}

// ── V43: Vague Title Detection ──

// Arabic prepositions and function words that don't carry meaning alone
const ARABIC_FUNCTION_WORDS = new Set([
  'في', 'من', 'إلى', 'على', 'عن', 'مع', 'بين', 'حتى', 'بعد', 'قبل',
  'فيه', 'منه', 'عنه', 'معه', 'فيها', 'منها', 'عنها',
  'أن', 'إن', 'التي', 'الذي', 'الذين', 'اللواتي',
  'هو', 'هي', 'هم', 'هن', 'أنا', 'نحن', 'أنت',
  'لا', 'لم', 'لن', 'قد', 'كان', 'كانت', 'يكون', 'تكون',
  'هذا', 'هذه', 'ذلك', 'تلك', 'هنا', 'هناك',
  'و', 'أو', 'ثم', 'بل', 'لكن', 'حتى', 'أم',
  'بـ', 'لـ', 'كـ', 'وـ', 'فـ',
  'ما', 'كيف', 'أين', 'متى', 'لماذا', 'هل', 'أ',
  'أي', 'بعض', 'كل', 'غير', 'أيضا', 'كذلك',
  'قد', 'سوف', 'لقد', 'منذ', 'خلال', 'حوالي', 'نحو',
]);

// Check if a title is too vague to be a meaningful news headline
// A proper title should have at least 3 content words (nouns/verbs, not just prepositions)
function isVagueTitle(title: string): boolean {
  if (!title || title.trim().length < 5) return true;

  const words = title
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);

  if (words.length < 4) return true; // Too few words overall

  // Count content words (not function words)
  const contentWords = words.filter(w => !ARABIC_FUNCTION_WORDS.has(w));

  // A title needs at least 3 content words to be meaningful
  // Examples of rejected: "إلى أي مدى قد يصل" (only 1 content word: مدى/يصل)
  // Examples of accepted: "ترامب يفكر في تنظيم الذكاء الاصطناعي" (3 content words: ترامب/تنظيم/الذكاء/الاصطناعي)
  if (contentWords.length < 3) return true;

  return false;
}

// ── V43: Truncated Sentence Detection ──

// Check if text contains truncated/incomplete sentences
// Detects patterns like:
//   - Double spaces suggesting deleted words: "من الضروري  التنظيمية"
//   - Sentence starting with a noun without a verb or preposition (broken grammar)
//   - Ellipsis at the end of a sentence that should be complete
function hasTruncatedSentence(text: string): boolean {
  if (!text || text.length < 20) return false;

  // 1. Check for ellipsis ending on what should be a complete sentence
  //    (not in a numbered list context like [1], [2], etc.)
  const sentences = text.split(/[.。]/).filter(s => s.trim().length > 10);
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    // Ends with ... or … indicating truncation
    if (/[.。]{2,}$|…$/.test(trimmed)) {
      // But allow it if it's clearly an intentional trailing off in context
      // (e.g., "قد يشمل ذلك..." is ok if followed by content)
      const afterMatch = text.substring(text.indexOf(trimmed) + trimmed.length).trim();
      if (!afterMatch || afterMatch.length < 5) {
        return true; // Trailing ellipsis at the end of the text
      }
    }
  }

  // 2. Check for double/multiple spaces within a sentence
  //    This often indicates text was deleted: "من الضروري  التنظيمية" 
  //    (space where words were removed)
  const doubleSpacePattern = /\S\s{2,}\S/g;
  const doubleSpaceMatches = text.match(doubleSpacePattern);
  if (doubleSpaceMatches && doubleSpaceMatches.length >= 1) {
    // Double spaces are suspicious but could be formatting.
    // Check if the double space occurs in a context where words are missing
    // (between Arabic words, not between a number and word)
    for (const match of doubleSpaceMatches) {
      const context = text.substring(
        Math.max(0, text.indexOf(match) - 15),
        text.indexOf(match) + match.length + 15
      );
      // If there's a double space between two Arabic words, it's likely a deletion artifact
      if (/[\u0600-\u06FF]\s{2,}[\u0600-\u06FF]/.test(context)) {
        return true;
      }
    }
  }

  // 3. Check for sentences that start with a definite noun but no verb or preposition
  //    Example: "التنظيمية العالمية وتأثيراتها" (starts with adjective, no verb)
  //    This catches cases where the beginning of a sentence was cut off
  const lines = text.split('\n').filter(l => l.trim().length > 15);
  for (const line of lines) {
    const trimmed = line.trim();
    // Remove leading bullet/number markers
    const cleaned = trimmed.replace(/^[\[\(]\d+[\]\)]\s*/, '').trim();
    
    // Check if it starts with an Arabic word that has a definite article (ال)
    // but is not preceded by a verb or preposition — this is grammatically broken
    if (/^ال[\u0600-\u06FF]+/.test(cleaned)) {
      // Exception: If the word is a subject that could start a nominal sentence
      // (like "الشركة أعلنت..."), check if there's a verb within the first few words
      const firstWords = cleaned.split(/\s+/).slice(0, 5);
      const hasVerb = firstWords.some(w =>
        /أعلن|قال|أشار|ذكر|أفاد|كشف|أكد|أضاف|أوضح|بين|يكون|تكون|يمكن|ينبغي|يجب|يعتبر|يعد|يشكل|يمثل|يؤدي|يسهم|يسبب|يؤثر|يترتب/.test(w)
      );
      const hasPreposition = firstWords.slice(0, 2).some(w =>
        /^في$|^من$|^إلى$|^على$|^عن$|^مع$|^بعد$|^قبل$|^خلال$|^بـ$|^لـ$|^كـ$/.test(w)
      );
      
      // If starting with definite article and no verb or preposition nearby,
      // AND the line is short (< 80 chars), it's likely a truncated sentence
      if (!hasVerb && !hasPreposition && cleaned.length < 80) {
        return true;
      }
    }
  }

  return false;
}

// ── V43: Financial Figure Extraction ──

// Extract financial figures from Arabic text for cross-referencing
interface FinancialFigure {
  value: number;
  unit: string;   // مليون or مليار
  metric: string; // إيرادات, أرباح, خسارة, etc.
  raw: string;
}

function extractFinancialFigures(text: string): FinancialFigure[] {
  const figures: FinancialFigure[] = [];
  if (!text || text.length < 10) return figures;

  // V43 FIX: Clean numbers with spaces ("12. 4" → "12.4")
  const cleanText = text.replace(/([0-9]+)\.\s+([0-9]+)/g, '$1.$2');

  // Pattern 1: metric first then number
  const metricFirstPattern = /(?:إيرادات|إيراد|عائد|مبيعات|دخل)[^\d]{0,30}?([0-9]+\.?[0-9]*)\s*(مليون|مليار)/g;
  // Pattern 2: number first then metric context
  const numFirstPattern = /([0-9]+\.?[0-9]*)\s*(مليون|مليار)[^\u0600-\u06FF]{0,5}(?:دولار)?[^\u0600-\u06FF]{0,20}(?:على إيرادات|على مبيعات|على عائد)/g;

  let match;
  while ((match = metricFirstPattern.exec(cleanText)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    const contextStart = Math.max(0, match.index - 40);
    const context = cleanText.slice(contextStart, match.index + match[0].length + 20);
    let metric = 'غير محدد';
    if (/إيراد/.test(context)) metric = 'إيرادات';
    else if (/مبيعات/.test(context)) metric = 'مبيعات';
    else if (/عائد/.test(context)) metric = 'عائد';
    else if (/دخل/.test(context)) metric = 'دخل';
    figures.push({ value, unit, metric, raw: match[0] });
  }

  while ((match = numFirstPattern.exec(cleanText)) !== null) {
    figures.push({ value: parseFloat(match[1]), unit: match[2], metric: 'إيرادات', raw: match[0] });
  }

  // Profit/loss figures
  const profitLossPattern = /(?:أرباح|خسارة|صافي أرباح|خسارة صافية|ربح صافي|خسارة صافي)[^\d]{0,30}?([0-9]+\.?[0-9]*)\s*(مليون|مليار)/g;
  while ((match = profitLossPattern.exec(cleanText)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    const contextStart = Math.max(0, match.index - 30);
    const context = cleanText.slice(contextStart, match.index + match[0].length + 20);
    let metric = 'أرباح';
    if (/خسارة/.test(context)) metric = 'خسارة';
    else if (/صافي أرباح|أرباح صافي/.test(context)) metric = 'أرباح صافية';
    figures.push({ value, unit, metric, raw: match[0] });
  }

  return figures;
}

// Detect garbage content (navigation menus, site structure, etc.)
// V98: Added repetitive content detection (e.g., "حسناً" repeated 30+ times)
function isGarbageContent(text: string): boolean {
  if (!text || text.length < 50) return true;

  const garbagePatterns = [
    /تجاوز التنقل/i, /تخطى إلى التنقل/i, /تخطي المحتوى/i,
    /الرئيسية.*الأخبار.*الرياضة/i,
    /أسواق الولايات المتحدة.*أسواق أوروبا/i,
    /الأكثر نشاطاً.*المكاسب اليومية/i,
    /تخطى إلى المحتوى الرئيسي/i, /تخطى إلى العمود الأيمن/i,
    /سجّل الدخول/i, /أنشئ حساباً/i,
    /قائمة المراقبة/i, /البث المباشر.*قائمة/i,
    /مُحول العملات/i, /الرسومات المتقدمة/i,
    /اختيارات المحرر/i, /الأسهم الشائعة/i,
    /تقويم الأرباح/i, /دليل الشراء/i,
    /أفكار الهدايا/i, /برنامج الإذاعة/i,
  ];

  for (const pattern of garbagePatterns) {
    if (pattern.test(text)) return true;
  }

  // Menu-like structure: many short lines
  const lines = text.split(/\n/).filter(l => l.trim().length > 0);
  if (lines.length > 15) {
    const shortLines = lines.filter(l => l.trim().length < 30).length;
    if (shortLines / lines.length > 0.7) return true;
  }

  // V98→V244: Repetitive content detection — DOWNGRADED to warning only.
  // isRepetitiveContent is still called for diagnostic purposes, but no longer
  // blocks publishing. Logged as warning instead of rejecting the article.
  if (isRepetitiveContent(text)) {
    console.warn(`[Publisher V244] Repetitive content detected in garbage check — not blocking, logging only`);
    // Do NOT return true — repetitive content is a warning, not a blocker
  }

  return false;
}

// ── V98: Repetitive Content Detection ────────────────────────
// Detects when the same word or short phrase dominates the text,
// which indicates AI generation failure or garbage content.
// Examples caught:
//   - "حسناً. حسناً. حسناً." (word repeated 30+ times)
//   - "نعم نعم نعم" filling an entire article
//   - Any single word appearing >40% of all words in the text
function isRepetitiveContent(text: string): boolean {
  if (!text || text.length < 30) return false;

  // Extract all Arabic words (strip punctuation, numbers, etc.)
  const words = text
    .replace(/[^\u0600-\u06FF\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1); // Ignore single-char words

  if (words.length < 10) return false;

  // V156: Expanded filler phrases with more Arabic AI artifacts
  const FILLER_PHRASES = /^(حسنا[ًٍ]?|طبعا[ًٍ]?|إذن|بالتأكيد|نعم|أيضا[ًٍ]?|بالفعل|فعلا[ًٍ]?|صحيح|طيب|كما|لذلك|وبالتالي|الآن)$/;
  let fillerCount = 0;
  for (const word of words) {
    if (FILLER_PHRASES.test(word)) fillerCount++;
  }
  if (fillerCount >= 3 && fillerCount / words.length > 0.15) {
    console.warn(`[Publisher V156] Arabic filler phrases detected: ${fillerCount}/${words.length} words are fillers`);
    return true;
  }

  // Count word frequencies
  const freq: Record<string, number> = {};
  for (const word of words) {
    const normalized = word.trim();
    if (!normalized) continue;
    freq[normalized] = (freq[normalized] || 0) + 1;
  }

  // V156: Lowered threshold from 30% to 25% — even 25% repetition is abnormal
  const threshold = words.length * 0.25;
  for (const [word, count] of Object.entries(freq)) {
    if (count >= 5 && count > threshold) {
      console.warn(`[Publisher V98] Repetitive content detected: "${word}" appears ${count}/${words.length} times (${Math.round(count / words.length * 100)}%)`);
      return true;
    }
  }

  // Also check: are there 3+ identical consecutive lines?
  const textLines = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 3);
  let consecutiveDupes = 1;
  for (let i = 1; i < textLines.length; i++) {
    if (textLines[i] === textLines[i - 1]) {
      consecutiveDupes++;
      if (consecutiveDupes >= 5) {
        console.warn(`[Publisher V98] Repetitive lines detected: "${textLines[i].slice(0, 30)}" repeated ${consecutiveDupes}+ times consecutively`);
        return true;
      }
    } else {
      consecutiveDupes = 1;
    }
  }

  // Check: are there 5+ identical short sentences (separated by . or ؟ or !)?
  const sentences = text.split(/[.؟!؛]/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 50);
  const sentFreq: Record<string, number> = {};
  for (const sent of sentences) {
    sentFreq[sent] = (sentFreq[sent] || 0) + 1;
  }
  for (const [sent, count] of Object.entries(sentFreq)) {
    if (sent.length < 10 && count >= 3) {  // V152: Short phrases repeated 3+ times = garbage
      console.warn(`[Publisher V152] Short repetitive sentence: "${sent.slice(0, 30)}" appears ${count} times`);
      return true;
    }
    if (count >= 5) {
      console.warn(`[Publisher V98] Repetitive sentences detected: "${sent.slice(0, 30)}" appears ${count} times`);
      return true;
    }
  }

  return false;
}

// ── V156: English Sentence Detection ────────────────────────
// Detects full English sentences in Arabic content fields.
// Arabic content may contain English financial terms (S&P, GDP, BTC)
// but should NOT have full English sentences (5+ consecutive English words).
// This catches AI failures where the model outputs English instead of Arabic.
// Examples caught:
//   - "The stock market rose significantly today" (full English)
//   - "Federal Reserve decided to keep rates unchanged" (full English)
//   - Allowed: "مؤشر S&P 500 يرتفع" (English ticker within Arabic)
function hasEnglishSentences(text: string): boolean {
  if (!text || text.length < 20) return false;

  // Remove known financial symbols/tickers first (these are legitimate in Arabic text)
  const FINANCIAL_SYMBOLS = /\b(?:S&P|GDP|IPO|ETF|CPI|NFP|PMI|FOMC|DXY|TNX|TLT|XAUUSD|GLD|SPY|QQQ|DIA|XLF|XLRE|XLK|XLU|XLV|VTV|IBIT|FBTC|ARKB|COIN|MSTR|BTC|ETH|NYSE|NASDAQ|NYMEX|COMEX|WTI|Brent|AAPL|MSFT|GOOGL|AMZN|TSLA|NVDA|META|FED|ECB|BOJ|BOE|SNB|RBA|BOC|RBNZ|Fed|VIX|CME|ICE|CBOT|E-mini|E-micro|AI|IT|ESG|EBITDA|ROE|ROI|EPS|SEC|CFTC|FINRA|FDIC|OPEC|EIA|API|DOE|ISM|ADP)\b/gi;
  const cleanedText = text.replace(FINANCIAL_SYMBOLS, ' ');

  // V244: Look for 10+ consecutive English words (a full sentence) — was 5.
  // Financial Arabic content often contains 5-9 word English phrases (company descriptions,
  // earnings quotes, regulatory text). Only 10+ consecutive English words indicate
  // the content wasn't actually translated to Arabic.
  const englishSentencePattern = /[a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,}){9,}/g;
  const matches = cleanedText.match(englishSentencePattern);

  if (matches && matches.length > 0) {
    // Filter out common false positives: URLs, file paths, etc.
    const realSentences = matches.filter(m =>
      !m.match(/^(https?:|www\.|\.com|\.org|\.net|\.io)/i) && // URLs
      !m.match(/^[\d\s.]+$/) && // Numbers only
      m.split(/\s+/).filter(w => w.length > 2).length >= 10 // V244: At least 10 real words (3+ chars)
    );
    if (realSentences.length > 0) {
      console.warn(`[Publisher V156] English sentences detected in Arabic field: "${realSentences[0].slice(0, 60)}..."`);
      return true;
    }
  }

  return false;
}
