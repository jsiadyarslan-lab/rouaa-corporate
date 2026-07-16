// ═══════════════════════════════════════════════════════════════
// English News Pipeline Configuration
// Centralized configuration for the English language processing pipeline.
// This is the English counterpart of the Arabic pipeline config.
// All settings are independent — changes here do NOT affect Arabic pipeline.
// ═══════════════════════════════════════════════════════════════

export const EN_PIPELINE_CONFIG = {
  locale: 'en' as const,

  // ── English RSS Feed Sources V410 ──
  // V410: Cleaned up from 100+ → 45 verified working sources.
  // REMOVED: Bloomberg (403), Reuters Agency (404), Barron's (403), FT (paywall),
  // ECB (HTML not RSS), OANDA/FOREX.com/CME/ICE (no RSS), Institutional Investor,
  // World Bank/IMF/OPEC/S&P Global (no valid RSS), SEC EDGAR (Atom not parseable),
  // RT feeds (blocked in many regions), WSJ (paywall), Morningstar/Nasdaq Trader,
  // low-value tech feeds (CB Insights, PitchBook, Stratechery, a16z, First Round,
  // Fast Company, Inc.), and redundant Google News searches.
  // KEPT: CNBC (7 feeds), MarketWatch (4), BBC (3), NYT (3), Investing.com (6),
  // Cointelegraph (4), CoinDesk, Decrypt, CryptoSlate, CryptoNews,
  // OilPrice, Kitco, EIA, CleanTechnica, Federal Reserve,
  // Guardian (2), Forbes (2), CNN, DW (2), France24, Al Jazeera,
  // Google News Finance, The Hill, Economic Times India, CNBC Asia/Europe,
  // Benzinga, Seeking Alpha, Yahoo Finance, FXStreet, DailyFX, TechCrunch.
  RSS_FEEDS_EN: [
    // ═══════════════════════════════════════════
    // ── STOCKS (10 sources) ───────────────────
    // ═══════════════════════════════════════════
    { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147', category: 'stocks', source: 'CNBC' },
    { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', category: 'stocks', source: 'CNBC Investing' },
    { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15839135', category: 'earnings', source: 'CNBC Earnings' },
    { url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', category: 'stocks', source: 'MarketWatch' },
    { url: 'https://feeds.content.dowjones.io/public/rss/mw_marketpulse', category: 'stocks', source: 'MarketWatch Pulse' },
    { url: 'https://seekingalpha.com/market_currents.xml', category: 'stocks', source: 'Seeking Alpha' },

    // ═══════════════════════════════════════════
    // ── ECONOMY (14 sources) ──────────────────
    // ═══════════════════════════════════════════
    { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100727362', category: 'economy', source: 'CNBC World' },
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'economy', source: 'BBC Business' },
    { url: 'https://news.google.com/rss/search?q=financial+markets+economy+stocks&hl=en-US&gl=US&ceid=US:en', category: 'economy', source: 'Google News Finance' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', category: 'economy', source: 'NYT Business' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml', category: 'economy', source: 'NYT Economy' },
    { url: 'https://www.theguardian.com/business/rss', category: 'economy', source: 'Guardian Business' },
    { url: 'https://www.france24.com/en/business-tech/rss', category: 'economy', source: 'France24 Business' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'economy', source: 'Al Jazeera' },
    { url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', category: 'economy', source: 'Economic Times India' },
    { url: 'https://thehill.com/feed/', category: 'economy', source: 'The Hill' },

    // ═══════════════════════════════════════════
    // ── FOREX (3 sources) ─────────────────────
    // ═══════════════════════════════════════════

    // ═══════════════════════════════════════════
    // ── CRYPTO (6 sources) ────────────────────
    // ═══════════════════════════════════════════
    { url: 'https://www.coindesk.com/arc/outboundfeeds/rss', category: 'crypto', source: 'CoinDesk' },
    { url: 'https://cointelegraph.com/rss', category: 'crypto', source: 'Cointelegraph' },
    { url: 'https://cointelegraph.com/rss/tag/bitcoin', category: 'crypto', source: 'Cointelegraph BTC' },
    { url: 'https://cointelegraph.com/rss/tag/ethereum', category: 'crypto', source: 'Cointelegraph ETH' },
    { url: 'https://decrypt.co/feed', category: 'crypto', source: 'Decrypt' },
    { url: 'https://cryptonews.com/news/feed/', category: 'crypto', source: 'CryptoNews' },

    // ═══════════════════════════════════════════
    // ── ENERGY (3 sources) ────────────────────
    // ═══════════════════════════════════════════
    { url: 'https://oilprice.com/rss/main', category: 'energy', source: 'OilPrice' },

    // ═══════════════════════════════════════════
    // ── COMMODITIES (4 sources) ───────────────
    // ═══════════════════════════════════════════
    { url: 'https://www.investing.com/rss/news_11.rss', category: 'commodities', source: 'Investing.com Commodities' },

    // ═══════════════════════════════════════════
    // ── BONDS (3 sources) ─────────────────────
    // ═══════════════════════════════════════════
    { url: 'https://www.federalreserve.gov/feeds/press_all.xml', category: 'bonds', source: 'Federal Reserve' },

    // ═══════════════════════════════════════════
    // ── TECHNOLOGY (2 sources) ────────────────
    // ═══════════════════════════════════════════
    { url: 'https://techcrunch.com/feed', category: 'technology', source: 'TechCrunch' },
    { url: 'https://www.forbes.com/innovation/feed2', category: 'technology', source: 'Forbes Innovation' },

    // ═══════════════════════════════════════════
    // ── STRATEGIC / GEOPOLITICS (4 sources) ───
    // ═══════════════════════════════════════════
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'strategic', source: 'BBC World' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', category: 'strategic', source: 'NYT World' },
    { url: 'https://www.theguardian.com/world/rss', category: 'strategic', source: 'Guardian World' },

    // ═══════════════════════════════════════════
    // ── OFFICIAL SOURCES (V1070) ──────────────
    // ═══════════════════════════════════════════
    { url: 'https://www.federalreserve.gov/feeds/speeches.xml', category: 'bonds', source: 'Federal Reserve' },
    { url: 'https://www.ecb.europa.eu/rss/press.html', category: 'bonds', source: 'ECB' },
    { url: 'https://www.wto.org/library/rss/news_e.xml', category: 'economy', source: 'WTO' },
    { url: 'https://www.bea.gov/news/rss', category: 'economy', source: 'BEA' },
    { url: 'https://www.fitchratings.com/rss', category: 'economy', source: 'Fitch Ratings' },
    { url: 'https://www.brookings.edu/feed/', category: 'economy', source: 'Brookings' },

    // ═══════════════════════════════════════════
    // ── OFFICIAL SOURCES (V1081 — all verified working) ──
    // ═══════════════════════════════════════════
    // Central Banks
    { url: 'https://www.federalreserve.gov/feeds/press_all.xml', category: 'bonds', source: 'Federal Reserve' },
    { url: 'https://www.federalreserve.gov/feeds/speeches.xml', category: 'bonds', source: 'Federal Reserve Speeches' },
    { url: 'https://www.ecb.europa.eu/rss/press.html', category: 'bonds', source: 'ECB' },
    { url: 'https://www.bis.org/doclist/rss_all_categories.rss', category: 'bonds', source: 'BIS' },
    { url: 'https://www.bis.org/doclist/all_pressrels.rss', category: 'bonds', source: 'BIS Press' },
    { url: 'https://www.bis.org/doclist/cbspeeches.rss?paging_length=15', category: 'bonds', source: 'BIS CB Speeches' },
    { url: 'https://www.bankofengland.co.uk/rss/news', category: 'bonds', source: 'Bank of England' },
    { url: 'https://www.bankofengland.co.uk/rss/speeches', category: 'bonds', source: 'BoE Speeches' },
    { url: 'https://www.bankofengland.co.uk/rss/publications', category: 'bonds', source: 'BoE Publications' },
    { url: 'https://www.bankofcanada.ca/content_type/press-releases/feed/', category: 'bonds', source: 'Bank of Canada' },
    { url: 'https://www.riksbank.se/en-gb/rss/press-releases/', category: 'bonds', source: 'Riksbank' },
    { url: 'https://www.mas.gov.sg/rss', category: 'bonds', source: 'MAS Singapore' },
    { url: 'https://www.rbi.org.in/Scripts/RSS.aspx', category: 'bonds', source: 'RBI India' },
    // US Government
    { url: 'https://www.sec.gov/news/pressreleases.rss', category: 'stocks', source: 'SEC' },
    { url: 'https://www.sec.gov/news/speeches-statements.rss', category: 'stocks', source: 'SEC Speeches' },
    { url: 'https://www.sec.gov/news/testimony.rss', category: 'stocks', source: 'SEC Testimony' },
    { url: 'https://www.sec.gov/news/statements.rss', category: 'stocks', source: 'SEC Statements' },
    { url: 'https://www.sec.gov/enforcement-litigation/litigation-releases/rss', category: 'stocks', source: 'SEC Litigation' },
    { url: 'https://www.sec.gov/enforcement-litigation/administrative-proceedings/rss', category: 'stocks', source: 'SEC Admin' },
    { url: 'https://www.trade.gov/rss.xml', category: 'economy', source: 'Trade.gov' },
    { url: 'https://www.treasurydirect.gov/rss', category: 'bonds', source: 'TreasuryDirect' },
    // International
    { url: 'https://sdmxcentral.imf.org/rss.xml', category: 'economy', source: 'IMF' },
    { url: 'https://www.wto.org/library/rss/news_e.xml', category: 'economy', source: 'WTO' },
    { url: 'https://search.worldbank.org/api/v2/news', category: 'economy', source: 'World Bank' },
    // Think Tanks
    { url: 'https://www.heritage.org/rss', category: 'economy', source: 'Heritage Foundation' },
    { url: 'https://www.iif.com/feed', category: 'economy', source: 'IIF' },
    { url: 'https://www.lowyinstitute.org/rss', category: 'economy', source: 'Lowy Institute' },
    // Ratings
    { url: 'https://www.moodys.com/rss', category: 'economy', source: 'Moodys' },
    // Arab Official
    { url: 'https://www.spa.gov.sa/rss.xml', category: 'economy', source: 'Saudi Press Agency' },
    { url: 'https://www.wam.ae/rss', category: 'economy', source: 'WAM UAE' },
    { url: 'https://www.qna.org.qa/ar-QA/Pages/RSS-Feeds/Economy-International', category: 'economy', source: 'QNA International' },
    { url: 'https://www.qna.org.qa/ar-QA/Pages/RSS-Feeds/Economy-Local', category: 'economy', source: 'QNA Local' },
    { url: 'https://www.amf-france.org/fr/rss', category: 'stocks', source: 'AMF France' },

    // ═══════════════════════════════════════════
    // ── SECTOR-SPECIFIC OFFICIAL SOURCES (V1082) ──
    // ═══════════════════════════════════════════
    { url: 'https://www.federalreserve.gov/feeds/press_monetary.xml', category: 'bonds', source: 'Federal Reserve Monetary' },
    { url: 'https://www.federalreserve.gov/feeds/press_enforcement.xml', category: 'bonds', source: 'Federal Reserve Enforcement' },
    { url: 'https://www.federalreserve.gov/feeds/testimony.xml', category: 'bonds', source: 'Federal Reserve Testimony' },
    { url: 'https://www.federalreserve.gov/feeds/press_bcreg.xml', category: 'bonds', source: 'Federal Reserve Bank Regulation' },
    { url: 'https://worldsteel.org/media/press-releases/feed/', category: 'commodities', source: 'World Steel Association' },
    { url: 'https://www.sipri.org/rss', category: 'economy', source: 'SIPRI Defense' },
    { url: 'https://www.imo.org/en/pages/pressbriefingsrss.aspx', category: 'economy', source: 'IMO Maritime' },
    { url: 'https://www.imo.org/en/pages/meetingsrss.aspx', category: 'economy', source: 'IMO Meetings' },
    { url: 'https://www.faa.gov/newsroom/press_releases/rss', category: 'economy', source: 'FAA Aviation' },
    { url: 'http://www.nass.usda.gov/rss/news.xml', category: 'economy', source: 'USDA NASS News' },
    { url: 'http://www.nass.usda.gov/rss/reports.xml', category: 'economy', source: 'USDA NASS Reports' },
    { url: 'https://public.govdelivery.com/topics/USFDIC_26/feed.rss', category: 'bonds', source: 'FDIC Banking' },
    { url: 'https://www.reit.com/news/rss', category: 'economy', source: 'Nareit REIT' },
    { url: 'https://www.gsma.com/newsroom/?cat=3&feed=rss2', category: 'economy', source: 'GSMA Telecom' },
    { url: 'https://www.nielsen.com/news-center/feed/', category: 'economy', source: 'Nielsen Media' },
  ],

  // ── Separate publish limits for English pipeline ──
  // V410: Raised from 500/80 to 800/120 — English pipeline was producing far fewer
  // articles than Arabic due to: (1) many broken RSS sources (now fixed), (2) financial
  // keyword filter in cron-en (now removed), (3) insufficient stuck article recovery.
  // After fixing all three, the pipeline needs higher limits to match Arabic throughput.
  MAX_DAILY_PUBLISHED_EN: 800,
  MAX_HOURLY_PUBLISHED_EN: 120,

  // ── English Quality Thresholds ──
  MIN_ENGLISH_RATIO: 0.50,          // V393: Lowered from 0.70 to 0.50 — was too strict, matching French/Turkish
  MIN_EN_TITLE_LENGTH: 4,           // Minimum English title length
  MIN_EN_CONTENT_LENGTH: 300,         // V422: Raised from 80 → 300. 80 chars = 1 sentence, which produced
                                      // embarrassingly short articles. 300 chars = ~3-4 substantial paragraphs.
  MIN_EN_SUMMARY_LENGTH: 10,        // Minimum English summary length

  // ── English Content Quality ──
  REQUIRE_TITLE_EN: true,           // Must have English title
  REQUIRE_CONTENT_EN: true,         // Must have English content
  REQUIRE_GENERATED_IMAGE: true,    // AI-generated image is MANDATORY
  REQUIRE_SLUG: true,               // Must have slug
  REQUIRE_AI_ANALYSIS: true,        // AI analysis is MANDATORY

  // ── Processing Timeouts ──
  PROCESSING_TIMEOUT_MS: 180_000,   // 3 minutes for unified processing
  ANALYSIS_TIMEOUT_MS: 120_000,     // 2 minutes for 4-gate analysis
  IMAGE_TIMEOUT_MS: 60_000,         // 1 minute for image generation

  // ── Speculation Thresholds (English) V235-align ──
  // V235-align: Raised from 15/25 to 60/90 to match Arabic thresholds (V235).
  // English financial writing NATURALLY uses speculative language
  // ("may", "could", "might", "is expected to") which is professional,
  // not problematic. The old 15/25 thresholds blocked virtually ALL
  // English reports from ever being generated — the #2 root cause of
  // "English reports don't work at all".
  SPECULATION_REPUBLISH_THRESHOLD: 60,   // Speculative words above this → regenerate (was 15)
  SPECULATION_BLOCK_THRESHOLD: 90,       // Speculative words above this → block publishing (was 25)

  // ── English Report Schedule ──
  // All asset classes that should have English reports generated
  EN_REPORT_ASSET_CLASSES: [
    'stocks', 'commodities', 'forex', 'crypto', 'bonds',
    'energy', 'economy', 'earnings',
    // Disabled: 'realEstate', 'arabMarkets', 'banking' — insufficient English sources
    'technicalAnalysis',
  ] as const,

  // English-specific report intervals
  EN_DAILY_INTERVAL_MS: 24 * 60 * 60 * 1000,       // 24 hours
  EN_WEEKLY_INTERVAL_MS: 168 * 60 * 60 * 1000,      // 7 days
  EN_MONTHLY_INTERVAL_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
  EN_TECHNICAL_INTERVAL_MS: 8 * 60 * 60 * 1000,     // 8 hours
  EN_QUARTERLY_INTERVAL_MS: 90 * 24 * 60 * 60 * 1000, // 90 days

  // English infographic auto-generation
  EN_INFOGRAPHIC_MAX_PER_CYCLE: 3,  // V260: Increased from 2 → 3 now that news items are included
  EN_INFOGRAPHIC_MIN_CONFIDENCE: 30, // Minimum confidence score for auto-infographic

  // ── Category mapping from English category IDs to DB category strings ──
  CATEGORY_MAP_EN: {
    economy: 'Economy',
    stocks: 'Stocks',
    forex: 'Forex',
    crypto: 'Crypto',
    energy: 'Energy',
    commodities: 'Commodities',
    realEstate: 'Real Estate',
    banking: 'Banking',
    earnings: 'Earnings',
    arabMarkets: 'Arab Markets',
    bonds: 'Bonds',
    technicalAnalysis: 'Technical Analysis',
    strategic: 'Strategic',
    technology: 'Technology',
    politics: 'Politics',
    breaking: 'Breaking',
  } as Record<string, string>,

  // ── Direction ──
  TEXT_DIRECTION: 'ltr' as const,  // English is LTR

  // ── Daily Limit Reset Hour (UTC) ──
  // Hour of the day (in UTC) when the daily publish quota resets.
  // 0 = midnight UTC (default for EN pipeline).
  DAILY_LIMIT_RESET_HOUR: 0,
} as const;

export type EnPipelineConfig = typeof EN_PIPELINE_CONFIG;

// ── Dynamic English Pipeline Limits V314 ──────────────────────
// Reads from site_settings DB, falls back to hardcoded defaults.
// Allows admin to change English news limits from dashboard without redeployment.
// Follows the same pattern as Arabic pipeline's getPipelineLimits().

let _enLimitsCache: { maxDailyEnNews: number; maxHourlyEnNews: number; ts: number } | null = null;
const EN_LIMITS_CACHE_TTL_MS = 30_000; // Cache for 30 seconds to avoid DB hammering

export async function getEnPipelineLimits(): Promise<{ maxDailyEnNews: number; maxHourlyEnNews: number }> {
  // Return cached value if fresh
  if (_enLimitsCache && Date.now() - _enLimitsCache.ts < EN_LIMITS_CACHE_TTL_MS) {
    return { maxDailyEnNews: _enLimitsCache.maxDailyEnNews, maxHourlyEnNews: _enLimitsCache.maxHourlyEnNews };
  }

  try {
    const { db } = await import('@/lib/db');
    const daySetting = await db.siteSetting.findUnique({ where: { key: 'pipeline_maxDailyEnNews' } });
    const hourSetting = await db.siteSetting.findUnique({ where: { key: 'pipeline_maxHourlyEnNews' } });

    const dbDayValue = daySetting?.value ? parseInt(daySetting.value, 10) : 0;
    const dbHourValue = hourSetting?.value ? parseInt(hourSetting.value, 10) : 0;

    // If DB has a valid value (> 0), use it; otherwise fall back to hardcoded default
    const maxDailyEnNews = dbDayValue > 0 ? dbDayValue : EN_PIPELINE_CONFIG.MAX_DAILY_PUBLISHED_EN;
    const maxHourlyEnNews = dbHourValue > 0 ? dbHourValue : EN_PIPELINE_CONFIG.MAX_HOURLY_PUBLISHED_EN;

    _enLimitsCache = { maxDailyEnNews, maxHourlyEnNews, ts: Date.now() };
    return { maxDailyEnNews, maxHourlyEnNews };
  } catch {
    // Fallback to hardcoded defaults on DB error
    return {
      maxDailyEnNews: EN_PIPELINE_CONFIG.MAX_DAILY_PUBLISHED_EN,
      maxHourlyEnNews: EN_PIPELINE_CONFIG.MAX_HOURLY_PUBLISHED_EN,
    };
  }
}

// Clear the EN limits cache (call after saving new limits from admin)
export function clearEnPipelineLimitsCache(): void {
  _enLimitsCache = null;
}
