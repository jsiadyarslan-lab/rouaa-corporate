// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════
// ─── Pipeline Configuration V42 ─────────────────────────────
// V42 GOLDEN RULE: Article must be 100% COMPLETE before appearing on the site.
// - isPublished=false until article is FULLY processed
// - AI-generated image is MANDATORY (must be base64, NOT external URL)
// - AI analysis with Arabic fullContent is MANDATORY
// - Arabic content 500+ chars is MANDATORY
// - isReady=true is IRREVERSIBLE — once published, NEVER unpublished or demoted
// - NO ARTICLE IS EVER DELETED — failed articles stay invisible (isReady=false)
// - publishedAt is set once when article is first published

export const PIPELINE_CONFIG = {
  // ── Orchestrator ──
  CYCLE_INTERVAL_MS: 90_000,       // Run pipeline every 90 seconds
  STARTUP_DELAY_MS: 15_000,        // Wait 15s after server start before first cycle
  CRASH_RESTART_DELAY_MS: 30_000,  // Auto-restart after crash
  ARTICLES_PER_CYCLE: 30,          // V1187: Restored from 10 to 30 — V1160 reduction was too aggressive, causing Arabic pipeline to produce only 20 articles/day
  CONCURRENT_ARTICLES: 3,          // V1160: Reduced from 5 to 3 — fewer parallel AI calls

  // ── Retry ──
  MAX_RETRY_COUNT: 15,             // V38: Increased to 15 before giving up (but NEVER delete)

  // ── Timeouts ──
  TRANSLATION_TIMEOUT_MS: 50_000,  // V38: 50s for AI translation (increased)
  CONTENT_GENERATION_TIMEOUT_MS: 80_000, // V38: 80s for AI content WRITING (increased)
  ANALYSIS_TIMEOUT_MS: 60_000,     // V38: 60s for AI analysis (increased)
  IMAGE_TIMEOUT_MS: 60_000,        // V113: Increased from 30s to 60s — 30s was too short for AI image generation, causing unnecessary failures and retries
  FETCH_TIMEOUT_MS: 15_000,        // 15s per RSS feed fetch
  CONTENT_LOAD_TIMEOUT_MS: 20_000, // 20s (kept for backward compat but not used)

  // ── Arabic Quality Thresholds ──
  ARABIC_RATIO_THRESHOLD: 0.25,    // V244: Lowered from 0.40 to 0.25 — financial titles naturally contain English tickers/symbols (e.g., "S&P 500 ترتفع" = only ~40% Arabic chars after symbol removal). 25% is the minimum to still catch fully English text while allowing financial content with English entities.
  MIXED_WORD_LIMIT: 5,             // Allow up to 5 mixed Arabic-English words
  MIN_ARABIC_CHARS: 3,             // Minimum Arabic characters to qualify

  // ── Publishing Gate (V38: Strictest) ──
  REQUIRE_TITLE_AR: true,          // Must have Arabic title
  REQUIRE_CONTENT_AR: true,        // Must have Arabic content (contentAr)
  REQUIRE_GENERATED_IMAGE: true,   // V38: AI-generated image is MANDATORY
  REQUIRE_SLUG: true,              // Must have slug
  REQUIRE_AI_ANALYSIS: true,       // V38: AI analysis is MANDATORY

  // ── Content Quality (V38: Much Stricter) ──
  MIN_CONTENT_AR_LENGTH: 200,      // V73: Reduced from 300 to 200 — many valid short news items were being rejected
  MIN_TITLE_AR_LENGTH: 4,          // Minimum Arabic title length
  MIN_SUMMARY_AR_LENGTH: 10,       // Minimum Arabic summary length

  // ── Category Default Images (V162: AI-generated via Pollinations.ai) ──
  // V162 FIX: All Unsplash URLs replaced with Pollinations.ai AI-generated images.
  // Only AI-generated images are used on the platform — no stock photos.
  CATEGORY_IMAGES: {
    'أسهم': 'https://image.pollinations.ai/prompt/stock%20market%20trading%20floor%20with%20digital%20charts?width=1200&height=675&nologo=true&seed=stocks42&model=flux',
    'كريبتو': 'https://image.pollinations.ai/prompt/cryptocurrency%20blockchain%20network%20glowing%20nodes?width=1200&height=675&nologo=true&seed=crypto42&model=flux',
    'عملات رقمية': 'https://image.pollinations.ai/prompt/cryptocurrency%20digital%20coins%20blockchain%20visualization?width=1200&height=675&nologo=true&seed=digital42&model=flux',
    'طاقة': 'https://image.pollinations.ai/prompt/oil%20refinery%20at%20sunset%20energy%20infrastructure?width=1200&height=675&nologo=true&seed=energy42&model=flux',
    'اقتصاد أمريكي': 'https://image.pollinations.ai/prompt/wall%20street%20american%20flag%20financial%20district?width=1200&height=675&nologo=true&seed=usecon42&model=flux',
    'عملات': 'https://image.pollinations.ai/prompt/world%20currencies%20floating%20exchange%20rate?width=1200&height=675&nologo=true&seed=currency42&model=flux',
    'فوركس': 'https://image.pollinations.ai/prompt/forex%20trading%20screen%20candlestick%20charts?width=1200&height=675&nologo=true&seed=forex42&model=flux',
    'بنوك مركزية': 'https://image.pollinations.ai/prompt/grand%20central%20bank%20building%20monetary%20policy?width=1200&height=675&nologo=true&seed=cbank42&model=flux',
    'أسواق عربية': 'https://image.pollinations.ai/prompt/middle%20eastern%20financial%20district%20modern%20skyscrapers?width=1200&height=675&nologo=true&seed=arabmkt42&model=flux',
    'سلع': 'https://image.pollinations.ai/prompt/gold%20bars%20crude%20oil%20barrels%20professional?width=1200&height=675&nologo=true&seed=commod42&model=flux',
    'عقارات': 'https://image.pollinations.ai/prompt/modern%20real%20estate%20luxury%20buildings?width=1200&height=675&nologo=true&seed=realest42&model=flux',
    'تقنية': 'https://image.pollinations.ai/prompt/futuristic%20technology%20AI%20digital%20transformation?width=1200&height=675&nologo=true&seed=tech42&model=flux',
    'سياسة': 'https://image.pollinations.ai/prompt/government%20building%20policy%20documents?width=1200&height=675&nologo=true&seed=politics42&model=flux',
    'أرباح شركات': 'https://image.pollinations.ai/prompt/corporate%20earnings%20profit%20charts%20growth?width=1200&height=675&nologo=true&seed=earnings42&model=flux',
    'اقتصاد كلي': 'https://image.pollinations.ai/prompt/global%20economy%20interconnected%20financial%20networks?width=1200&height=675&nologo=true&seed=macro42&model=flux',
    'عاجل': 'https://image.pollinations.ai/prompt/breaking%20news%20studio%20financial%20ticker?width=1200&height=675&nologo=true&seed=urgent42&model=flux',
  } as Record<string, string>,

  // ── Article Age Filter (V100) ──
  // Articles older than this are skipped by the article picker.
  // Stale news wastes AI resources on outdated content.
  // Set to 0 to disable (not recommended for news sites).
  MAX_ARTICLE_AGE_MS: 12 * 60 * 60 * 1000,   // V121: 12 hours (was 6) — 6h was too short; cascade failures stall the pipeline for hours, then articles age out before they get processed

  // V113: Age purge safety — when the pipeline is rate-limited, articles wait
  // in the queue without being processed. If we delete them by age during this
  // waiting period, we lose articles permanently. This setting extends the
  // deletion window to account for rate limit pauses. Only articles that have
  // been available for processing (not rate-limited) for longer than this are purged.
  MAX_ARTICLE_AGE_PURGE_MS: 24 * 60 * 60 * 1000, // V121: 24 hours (was 12) — articles wait in queue during rate limits; purging at 12h loses articles that never got a chance to process

  // ── Degraded Mode (V118) ──
  // When ALL AI providers are down for 15+ minutes, the pipeline enters
  // degraded mode: simplified processing using existing content + SVG image.
  // GOLDEN RULE: Articles are NEVER published without a generated image.
  DEGRADED_MODE_TIMEOUT_MS: 15 * 60 * 1000,  // V118: Enter degraded mode after 15 min of AI failure
  MAX_REJECT_COUNT: 10,  // V120: Raised from 3 to 10 — 3 was too aggressive, permanently losing legitimate financial articles from verified RSS sources

  // ── Fetching ──
  MAX_FETCH_ITEMS: 10,             // V1160: Reduced from 50 to 10 — stop DB bloat
  DEDUP_BY_URL: true,              // Deduplicate by URL

  // ── Cost Optimization (V98) ──
  // When true, news-sources.ts skips ALL AI calls during fetch (Steps 0,2,3,5,6).
  // Only Step 1 (HTTP fetch of article content from URL) runs — no AI cost.
  // The pipeline's Unified Processor then handles translation + analysis in a SINGLE call,
  // producing HIGHER quality output (4-gate system V91) at half the cost.
  // Old: 4 API calls/article (3 LLM + 1 image) in pre-processing
  // New: 2 API calls/article (1 unified LLM + 1 image) in pipeline
  // Revert: set env SKIP_PREPROCESS_AI=false if quality issues arise
  SKIP_PREPROCESS_AI: (process.env.SKIP_PREPROCESS_AI ?? 'true') !== 'false',

  // ── Daily Production Limit (V93) ──
  MAX_PUBLISHED_PER_DAY: 500,       // V119: Raised from 200 to 500 — 200 was too restrictive, throttling production
  MAX_PUBLISHED_PER_HOUR: 50,       // V119: Raised from 20 to 50 — 20/hour was a bottleneck (20×24=480 max, far below what sources provide)
  DAILY_LIMIT_RESET_HOUR: 0,        // Reset daily counter at midnight UTC (0=midnight, 4=4AM UTC, etc.)
} as const;

export type PipelineConfig = typeof PIPELINE_CONFIG;

// V102: Dynamic pipeline limits — reads from site_settings DB, falls back to hardcoded defaults
// Allows admin to change limits from dashboard without redeployment
let _limitsCache: { maxPublishedPerDay: number; maxPublishedPerHour: number; ts: number } | null = null;
const LIMITS_CACHE_TTL_MS = 30_000; // Cache for 30 seconds to avoid DB hammering

export async function getPipelineLimits(): Promise<{ maxPublishedPerDay: number; maxPublishedPerHour: number }> {
  // Return cached value if fresh
  if (_limitsCache && Date.now() - _limitsCache.ts < LIMITS_CACHE_TTL_MS) {
    return { maxPublishedPerDay: _limitsCache.maxPublishedPerDay, maxPublishedPerHour: _limitsCache.maxPublishedPerHour };
  }

  try {
    const { db } = await import('@/lib/db');
    const daySetting = await db.siteSetting.findUnique({ where: { key: 'pipeline_maxPublishedPerDay' } });
    const hourSetting = await db.siteSetting.findUnique({ where: { key: 'pipeline_maxPublishedPerHour' } });

    // V360 FIX: Use DB value if set (> 0), otherwise fall back to hardcoded default.
    // Previous version used Math.max(dbValue, HARDCODED) which made it IMPOSSIBLE
    // to reduce limits below the hardcoded value (500/day, 50/hour) from the dashboard.
    // The admin MUST be able to set ANY limit they want from the dashboard.
    const dbDayValue = daySetting?.value ? parseInt(daySetting.value, 10) : 0;
    const dbHourValue = hourSetting?.value ? parseInt(hourSetting.value, 10) : 0;
    const maxPublishedPerDay = dbDayValue > 0 ? dbDayValue : PIPELINE_CONFIG.MAX_PUBLISHED_PER_DAY;
    const maxPublishedPerHour = dbHourValue > 0 ? dbHourValue : PIPELINE_CONFIG.MAX_PUBLISHED_PER_HOUR;

    _limitsCache = { maxPublishedPerDay, maxPublishedPerHour, ts: Date.now() };
    return { maxPublishedPerDay, maxPublishedPerHour };
  } catch {
    // Fallback to hardcoded defaults on DB error
    return { maxPublishedPerDay: PIPELINE_CONFIG.MAX_PUBLISHED_PER_DAY, maxPublishedPerHour: PIPELINE_CONFIG.MAX_PUBLISHED_PER_HOUR };
  }
}

// V102: Clear the limits cache (call after saving new limits from admin)
export function clearPipelineLimitsCache(): void {
  _limitsCache = null;
}
