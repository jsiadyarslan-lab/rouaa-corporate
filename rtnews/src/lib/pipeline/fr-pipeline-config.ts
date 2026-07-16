// ═══════════════════════════════════════════════════════════════
// French News Pipeline Configuration
// Centralized configuration for the French language processing pipeline.
// This is the French counterpart of the English pipeline config.
// All settings are independent — changes here do NOT affect English or Arabic pipelines.
// ═══════════════════════════════════════════════════════════════

export const FR_PIPELINE_CONFIG = {
  locale: 'fr' as const,

  // ── French RSS Feed Sources ──
  // V354: COMPLETELY REVISED — Only verified working French-language sources.
  // Removed 29 broken feeds (403/404) and 16 English-only feeds.
  // Added 47 verified French-language RSS feeds that actually return French content.
  // All sources verified 2026-05-26 with HTTP 200 + valid XML + French content.
  RSS_FEEDS_FR: [
    // ═══════════════════════════════════════════
    // ── STOCKS / ACTIONS ──────────────────────
    // ═══════════════════════════════════════════
    // BFM TV Économie — French business TV & news
    { url: 'https://www.bfmtv.com/rss/economie/', category: 'stocks', source: 'BFM TV Économie' },
    // Capital.fr — French business & personal finance
    // Cafedelabourse — French stock market education & analysis
    { url: 'https://www.cafedelabourse.com/feed/', category: 'stocks', source: 'Cafedelabourse' },
    // TradingSat Bourse — French stock market analysis
    { url: 'https://www.tradingsat.com/rssbourse.xml', category: 'stocks', source: 'TradingSat Bourse' },
    // AGEFI Fusions-Acquisitions — French M&A news
    { url: 'https://www.agefi.fr/theme/fusions-acquisitions.rss', category: 'stocks', source: 'AGEFI M&A' },
    // AGEFI Privatisations — French privatization news
    { url: 'https://www.agefi.fr/theme/privatisation.rss', category: 'stocks', source: 'AGEFI Privatisations' },
    // Le Journal des Entreprises — French business news
    { url: 'https://www.lejournaldesentreprises.com/rss-france', category: 'stocks', source: 'Journal Entreprises' },
    // Investing.com FR — Indices boursiers
    { url: 'https://fr.investing.com/rss/stock_Indices.rss', category: 'stocks', source: 'Investing FR Indices' },
    // Investing.com FR — Futures
    { url: 'https://fr.investing.com/rss/stock_Futures.rss', category: 'stocks', source: 'Investing FR Futures' },
    // Investing.com FR — Opinions bourse
    { url: 'https://fr.investing.com/rss/stock_Opinion.rss', category: 'stocks', source: 'Investing FR Opinions' },
    // Investing.com FR — Fondamentaux bourse
    { url: 'https://fr.investing.com/rss/stock_Fundamental.rss', category: 'stocks', source: 'Investing FR Fondamentaux' },
    // Investing.com FR — Actualités marchés FR
    { url: 'https://fr.investing.com/rss/news_1065.rss', category: 'stocks', source: 'Investing FR Marchés' },
    // Google News France — Bourse & Actions
    { url: 'https://news.google.com/rss/search?q=bourse+actions+march%C3%A9s+financiers&hl=fr&gl=FR&ceid=FR:fr', category: 'stocks', source: 'Google News Bourse' },

    // ═══════════════════════════════════════════
    // ── ECONOMY / ÉCONOMIE ───────────────────
    // ═══════════════════════════════════════════
    // Le Monde Économie — Leading French newspaper economy section
    { url: 'https://www.lemonde.fr/economie/rss_full.xml', category: 'economy', source: 'Le Monde Économie' },
    // France24 Économie — International economy in French
    { url: 'https://www.france24.com/fr/economie/rss', category: 'economy', source: 'France24 Économie' },
    // RFI Économie — Radio France Internationale economy
    { url: 'https://www.rfi.fr/fr/economie/rss', category: 'economy', source: 'RFI Économie' },
    // BFM TV Environnement — French environment/economy
    { url: 'https://www.bfmtv.com/rss/environnement/', category: 'economy', source: 'BFM TV Environnement' },
    // Ministère de l'Économie — French government economy news
    { url: 'https://www.economie.gouv.fr/rss/toutesactualites', category: 'economy', source: 'Économie.gouv.fr' },
    // La Croix Économie — French Catholic daily economy
    { url: 'https://www.la-croix.com/feeds/rss/economie.xml', category: 'economy', source: 'La Croix Économie' },
    // La Croix Budget — Budget & finance
    { url: 'https://www.la-croix.com/feeds/rss/economie/budget.xml', category: 'economy', source: 'La Croix Budget' },
    // La Croix Finance — Finance news
    { url: 'https://www.la-croix.com/feeds/rss/economie/finance.xml', category: 'economy', source: 'La Croix Finance' },
    // BNP Paribas Études Économiques — French bank economic research
    // Google News France Économie — Aggregated French economy headlines
    { url: 'https://news.google.com/rss/search?q=%C3%A9conomie+march%C3%A9s+finances&hl=fr&gl=FR&ceid=FR:fr', category: 'economy', source: 'Google News France' },
    // RMC — French talk radio news
    { url: 'https://rmc.bfmtv.com/rss/', category: 'economy', source: 'RMC' },

    // ═══════════════════════════════════════════
    // ── FOREX / DEVISES ──────────────────────
    // ═══════════════════════════════════════════
    // Investing.com FR — Forex technique
    { url: 'https://fr.investing.com/rss/forex_Technical.rss', category: 'forex', source: 'Investing FR Forex Tech' },
    // Investing.com FR — Forex fondamental
    { url: 'https://fr.investing.com/rss/forex_Fundamental.rss', category: 'forex', source: 'Investing FR Forex Fond' },
    // Google News France — Devises & Forex
    { url: 'https://news.google.com/rss/search?q=forex+devises+taux+change&hl=fr&gl=FR&ceid=FR:fr', category: 'forex', source: 'Google News Forex FR' },

    // ═══════════════════════════════════════════
    // ── CRYPTO ────────────────────────────────
    // ═══════════════════════════════════════════
    // CoinAcademy — French crypto news (Tout)
    { url: 'https://coinacademy.fr/feed/', category: 'crypto', source: 'CoinAcademy' },
    // CoinAcademy — Bitcoin
    { url: 'https://coinacademy.fr/actu/bitcoin?feed=gn', category: 'crypto', source: 'CoinAcademy BTC' },
    // CoinAcademy — Altcoins
    { url: 'https://coinacademy.fr/actu/altcoins?feed=gn', category: 'crypto', source: 'CoinAcademy Altcoins' },
    // CoinAcademy — Régulation crypto
    { url: 'https://coinacademy.fr/actu/regulation?feed=gn', category: 'crypto', source: 'CoinAcademy Régulation' },
    // CoinAcademy — Analyses crypto
    { url: 'https://coinacademy.fr/tag/analyse-crypto/feed/', category: 'crypto', source: 'CoinAcademy Analyses' },
    // CoinJournal FR — Actualités crypto
    { url: 'https://coinjournal.net/fr/actualites/feed/', category: 'crypto', source: 'CoinJournal FR' },
    // CoinJournal FR — Marchés
    { url: 'https://coinjournal.net/fr/actualites/category/marches/feed/', category: 'crypto', source: 'CoinJournal Marchés' },
    // CoinJournal FR — Réglementation
    { url: 'https://coinjournal.net/fr/actualites/category/politique-et-reglementation/feed/', category: 'crypto', source: 'CoinJournal Réglementation' },
    // Journal du Coin — Tout
    { url: 'https://journalducoin.com/feed/', category: 'crypto', source: 'Journal du Coin' },
    // Journal du Coin — Bitcoin
    { url: 'https://journalducoin.com/feed/?cat=bitcoin', category: 'crypto', source: 'Journal du Coin BTC' },

    // ═══════════════════════════════════════════
    // ── ENERGY / ÉNERGIE ─────────────────────
    // ═══════════════════════════════════════════
    // Investing.com FR — Énergie
    { url: 'https://fr.investing.com/rss/commodities_Energy.rss', category: 'energy', source: 'Investing FR Énergie' },
    // Goldbroker / Or.fr — Or & métaux précieux
    { url: 'https://www.goldbroker.com/fr/actualites.rss', category: 'energy', source: 'Goldbroker FR' },
    // La Croix Planète — Environnement & énergie
    { url: 'https://www.la-croix.com/feeds/rss/planete.xml', category: 'energy', source: 'La Croix Planète' },
    // Google News France — Énergie
    { url: 'https://news.google.com/rss/search?q=%C3%A9nergie+p%C3%A9trole+gaz+climat&hl=fr&gl=FR&ceid=FR:fr', category: 'energy', source: 'Google News Énergie' },

    // ═══════════════════════════════════════════
    // ── COMMODITIES / MATIÈRES PREMIÈRES ─────
    // ═══════════════════════════════════════════
    // Investing.com FR — Agriculture
    { url: 'https://fr.investing.com/rss/commodities_Agriculture.rss', category: 'commodities', source: 'Investing FR Agriculture' },
    // Google News France — Matières premières
    { url: 'https://news.google.com/rss/search?q=mati%C3%A8res+premi%C3%A8res+or+argent+m%C3%A9taux&hl=fr&gl=FR&ceid=FR:fr', category: 'commodities', source: 'Google News Matières' },

    // ═══════════════════════════════════════════
    // ── BONDS / OBLIGATIONS ──────────────────
    // ═══════════════════════════════════════════
    // Investing.com FR — Obligations
    { url: 'https://fr.investing.com/rss/bonds_Fundamental.rss', category: 'bonds', source: 'Investing FR Obligations' },

    // ═══════════════════════════════════════════
    // ── TECHNOLOGY / TECHNOLOGIE ─────────────
    // ═══════════════════════════════════════════
    // Le Monde Informatique — Toutes actualités
    { url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/toutes-les-actualites/rss.xml', category: 'technology', source: 'Le Monde Informatique' },
    // Le Monde Informatique — IA
    { url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/intelligence-artificielle/rss.xml', category: 'technology', source: 'Le Monde Info IA' },
    // Le Monde Informatique — Innovation
    { url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/innovation/rss.xml', category: 'technology', source: 'Le Monde Info Innovation' },
    // Le Monde Informatique — Cybersécurité
    { url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/securite/rss.xml', category: 'technology', source: 'Le Monde Info Sécurité' },
    // Le Monde Informatique — Cloud
    { url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/cloud/rss.xml', category: 'technology', source: 'Le Monde Info Cloud' },
    // Le Monde Informatique — Business / IT
    { url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/business/rss.xml', category: 'technology', source: 'Le Monde Info Business' },
    // Le Monde Informatique — Startups
    { url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/startup/rss.xml', category: 'technology', source: 'Le Monde Info Startups' },
    // BFM TV Tech — French tech news
    { url: 'https://www.bfmtv.com/rss/tech/', category: 'technology', source: 'BFM TV Tech' },

    // ═══════════════════════════════════════════
    // ── EARNINGS / RÉSULTATS ─────────────────
    // ═══════════════════════════════════════════
    // Google News France — Résultats entreprises
    { url: 'https://news.google.com/rss/search?q=r%C3%A9sultats+entreprises+b%C3%A9n%C3%A9fices+chiffre+affaires&hl=fr&gl=FR&ceid=FR:fr', category: 'earnings', source: 'Google News Résultats' },

    // ═══════════════════════════════════════════
    // ── TECHNICAL ANALYSIS / ANALYSE TECHNIQUE
    // ═══════════════════════════════════════════
    // Google News France — Analyse technique
    { url: 'https://news.google.com/rss/search?q=analyse+technique+trading+indicateurs&hl=fr&gl=FR&ceid=FR:fr', category: 'technicalAnalysis', source: 'Google News Analyse Tech' },

    // ═══════════════════════════════════════════
    // ── GEOPOLITICS / GÉOPOLITIQUE ───────────
    // ═══════════════════════════════════════════
    // Google News France — Géopolitique
    { url: 'https://news.google.com/rss/search?q=g%C3%A9opolitique+sanktions+commerce+diplomatie&hl=fr&gl=FR&ceid=FR:fr', category: 'strategic', source: 'Google News Géopolitique' },

    // ═══════════════════════════════════════════
    // ── REAL ESTATE / IMMOBILIER ─────────────
    // ═══════════════════════════════════════════
    // BFM TV Immobilier — French real estate
    { url: 'https://www.bfmtv.com/rss/immobilier/', category: 'realEstate', source: 'BFM TV Immobilier' },
    // Google News France — Immobilier
    { url: 'https://news.google.com/rss/search?q=immobilier+logement+prix+immobilier&hl=fr&gl=FR&ceid=FR:fr', category: 'realEstate', source: 'Google News Immobilier' },

    // ═══════════════════════════════════════════
    // ── NEW SOURCES V402 — Enhanced Economic Coverage ──
    // ═══════════════════════════════════════════

    // ── Les Échos — Leading French business daily ──

    // ── La Tribune — French economic & financial daily ──

    // ── Challenges — French business magazine ──
    { url: 'https://www.challenges.fr/rss.xml', category: 'economy', source: 'Challenges' },

    // ── Le Figaro Économie — Major French newspaper economy section ──

    // ── Investing.com FR — Obligations Fondamental ──
    { url: 'https://fr.investing.com/rss/bonds_Technical.rss', category: 'bonds', source: 'Investing FR Obligations Tech' },

    // ── Google News FR — Banque & Finance ──
    { url: 'https://news.google.com/rss/search?q=banque+finance+cr%C3%A9dit+pr%C3%AAt+taux&hl=fr&gl=FR&ceid=FR:fr', category: 'banking', source: 'Google News Banque' },

    // ── Google News FR — Investissement & Gestion de Patrimoine ──
    { url: 'https://news.google.com/rss/search?q=investissement+patrimoine+gestion+fortune+SCPI&hl=fr&gl=FR&ceid=FR:fr', category: 'economy', source: 'Google News Patrimoine' },

    // ── Google News FR — Fiscalité & Impôts ──
    { url: 'https://news.google.com/rss/search?q=fiscalit%C3%A9+imp%C3%B4t+r%C3%A9forme+fiscale+pr%C3%A9l%C3%A8vement&hl=fr&gl=FR&ceid=FR:fr', category: 'economy', source: 'Google News Fiscalité' },

    // ── Google News FR — Assurance & Prévoyance ──
    { url: 'https://news.google.com/rss/search?q=assurance+pr%C3%A9voyance+retraite+%C3%A9pargne&hl=fr&gl=FR&ceid=FR:fr', category: 'economy', source: 'Google News Assurance' },

    // ── Google News FR — Commerce International ──
    { url: 'https://news.google.com/rss/search?q=commerce+international+import+export+douane+commerce+mondial&hl=fr&gl=FR&ceid=FR:fr', category: 'economy', source: 'Google News Commerce Intl' },

    // ── Google News FR — ESG & Finance Durable ──
    { url: 'https://news.google.com/rss/search?q=ESG+finance+durable+obligation+verte+investissement+responsable&hl=fr&gl=FR&ceid=FR:fr', category: 'bonds', source: 'Google News ESG FR' },

    // ═══════════════════════════════════════════
    // ── OFFICIAL SOURCES (V1071) — France, EU, Global ──
    // ═══════════════════════════════════════════
    // Banque de France
    // ECB (French/EU)
    { url: 'https://www.ecb.europa.eu/rss/press.html', category: 'bonds', source: 'ECB' },
    // IMF
    // World Bank
    // OECD
    // WTO
    { url: 'https://www.wto.org/library/rss/news_e.xml', category: 'economy', source: 'WTO' },
    // BIS
    // US Federal Reserve
    { url: 'https://www.federalreserve.gov/feeds/press_all.xml', category: 'bonds', source: 'Federal Reserve' },
    // Bank of England
    // US Treasury
    // SEC
    // EIA Energy
    // IEA
    // OPEC
    // CME Group
    // Fitch Ratings
    { url: 'https://www.fitchratings.com/rss', category: 'economy', source: 'Fitch Ratings' },
    // Moodys
    // S&P Global
    // Brookings
    { url: 'https://www.brookings.edu/feed/', category: 'economy', source: 'Brookings' },
    // Bruegel (European think tank)
    // EIB
    // EBRD
    // AfDB
    // ADB
    // Nasdaq
    // NYSE
    // Euronext
    // LSEG
    // US BLS
    // US BEA
    { url: 'https://www.bea.gov/news/rss', category: 'economy', source: 'BEA' },
    // US Census
    // Eurostat
    // INSEE (French statistics)
    // ACPR (French regulator)
    // AMF (French markets authority)
    // Bundesbank
    // Banca d'Italia
    // LME
    // ICE
  ],

  // ── Separate publish limits for French pipeline ──
  // French pipeline: moderate volume — French sources plus global English coverage.
  MAX_DAILY_PUBLISHED_FR: 300,
  MAX_HOURLY_PUBLISHED_FR: 50,

  // ── French Quality Thresholds ──
  // French uses Latin characters like English, but with accents (é, è, ê, à, ç, etc.)
  // so the ratio threshold is lower than English (which requires 0.70).
  MIN_FRENCH_RATIO: 0.50,            // Minimum ratio of French/Latin characters in content
  MIN_FR_TITLE_LENGTH: 4,            // Minimum French title length
  MIN_FR_CONTENT_LENGTH: 80,         // V372: Reduced from 200 to 80 — RSS summaries are often short
  MIN_FR_SUMMARY_LENGTH: 10,         // Minimum French summary length

  // ── French Content Quality ──
  REQUIRE_TITLE_FR: true,            // Must have French title
  REQUIRE_CONTENT_FR: true,          // Must have French content
  REQUIRE_GENERATED_IMAGE: true,     // AI-generated image is MANDATORY
  REQUIRE_SLUG: true,                // Must have slug
  REQUIRE_AI_ANALYSIS: true,         // AI analysis is MANDATORY

  // ── Processing Timeouts ──
  PROCESSING_TIMEOUT_MS: 180_000,    // 3 minutes for unified processing
  ANALYSIS_TIMEOUT_MS: 120_000,      // 2 minutes for 4-gate analysis
  IMAGE_TIMEOUT_MS: 60_000,          // 1 minute for image generation

  // ── Speculation Thresholds (French) ──
  SPECULATION_REPUBLISH_THRESHOLD: 15,   // Speculative words above this → regenerate
  SPECULATION_BLOCK_THRESHOLD: 40,       // V375: Raised from 25 → 40 — French financial reports naturally use more speculative language (pourrait, éventuellement, etc.)

  // ── French Report Schedule ──
  // All asset classes that should have French reports generated
  FR_REPORT_ASSET_CLASSES: [
    'stocks', 'commodities', 'forex', 'crypto', 'bonds',
    'energy', 'economy', 'earnings',
    // Disabled: 'realEstate', 'arabMarkets', 'banking' — insufficient French sources
    'technicalAnalysis',
  ] as const,

  // French-specific report intervals
  FR_DAILY_INTERVAL_MS: 24 * 60 * 60 * 1000,       // 24 hours
  FR_WEEKLY_INTERVAL_MS: 168 * 60 * 60 * 1000,      // 7 days
  FR_MONTHLY_INTERVAL_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
  FR_TECHNICAL_INTERVAL_MS: 8 * 60 * 60 * 1000,     // 8 hours
  FR_QUARTERLY_INTERVAL_MS: 90 * 24 * 60 * 60 * 1000, // 90 days

  // V375: Speculation threshold overrides for REPORTS (longer content)
  // Reports are naturally more speculative than news articles — they analyze
  // future trends and provide forecasts. Use higher thresholds for reports.
  SPECULATION_REPORT_BLOCK_THRESHOLD: 60,  // For reports/analyses (was 25, same as articles)

  // French infographic auto-generation
  FR_INFOGRAPHIC_MAX_PER_CYCLE: 3,  // Max auto-infographics per cycle
  FR_INFOGRAPHIC_MIN_CONFIDENCE: 30, // Minimum confidence score for auto-infographic

  // ── Category mapping from French category IDs to DB category strings ──
  CATEGORY_MAP_FR: {
    economy: 'Économie',
    stocks: 'Actions',
    forex: 'Devises',
    crypto: 'Crypto',
    energy: 'Énergie',
    commodities: 'Matières Premières',
    realEstate: 'Immobilier',
    banking: 'Banque',
    earnings: 'Résultats',
    arabMarkets: 'Marchés Arabes',
    bonds: 'Obligations',
    technicalAnalysis: 'Analyse Technique',
    strategic: 'Géopolitique',
    technology: 'Technologie',
    politics: 'Politique',
    breaking: 'Flash',
  } as Record<string, string>,

  // ── DAILY_LIMIT_RESET_HOUR ──
  // Hour (UTC) at which the daily publish limit resets.
  // 0 = midnight UTC (same as the old setUTCHours(0,0,0,0) behavior).
  DAILY_LIMIT_RESET_HOUR: 0,

  // ── Direction ──
  TEXT_DIRECTION: 'ltr' as const,  // French is LTR
} as const;

export type FrPipelineConfig = typeof FR_PIPELINE_CONFIG;

// ── Dynamic French Pipeline Limits ───────────────────────────
// Reads from site_settings DB, falls back to hardcoded defaults.
// Allows admin to change French news limits from dashboard without redeployment.
// Follows the same pattern as English pipeline's getEnPipelineLimits().

let _frLimitsCache: { maxDailyFrNews: number; maxHourlyFrNews: number; ts: number } | null = null;
const FR_LIMITS_CACHE_TTL_MS = 30_000; // Cache for 30 seconds to avoid DB hammering

export async function getFrPipelineLimits(): Promise<{ maxDailyFrNews: number; maxHourlyFrNews: number }> {
  // Return cached value if fresh
  if (_frLimitsCache && Date.now() - _frLimitsCache.ts < FR_LIMITS_CACHE_TTL_MS) {
    return { maxDailyFrNews: _frLimitsCache.maxDailyFrNews, maxHourlyFrNews: _frLimitsCache.maxHourlyFrNews };
  }

  try {
    const { db } = await import('@/lib/db');
    const daySetting = await db.siteSetting.findUnique({ where: { key: 'pipeline_maxDailyFrNews' } });
    const hourSetting = await db.siteSetting.findUnique({ where: { key: 'pipeline_maxHourlyFrNews' } });

    const dbDayValue = daySetting?.value ? parseInt(daySetting.value, 10) : 0;
    const dbHourValue = hourSetting?.value ? parseInt(hourSetting.value, 10) : 0;

    // If DB has a valid value (> 0), use it; otherwise fall back to hardcoded default
    const maxDailyFrNews = dbDayValue > 0 ? dbDayValue : FR_PIPELINE_CONFIG.MAX_DAILY_PUBLISHED_FR;
    const maxHourlyFrNews = dbHourValue > 0 ? dbHourValue : FR_PIPELINE_CONFIG.MAX_HOURLY_PUBLISHED_FR;

    _frLimitsCache = { maxDailyFrNews, maxHourlyFrNews, ts: Date.now() };
    return { maxDailyFrNews, maxHourlyFrNews };
  } catch {
    // Fallback to hardcoded defaults on DB error
    return {
      maxDailyFrNews: FR_PIPELINE_CONFIG.MAX_DAILY_PUBLISHED_FR,
      maxHourlyFrNews: FR_PIPELINE_CONFIG.MAX_HOURLY_PUBLISHED_FR,
    };
  }
}

// Clear the FR limits cache (call after saving new limits from admin)
export function clearFrPipelineLimitsCache(): void {
  _frLimitsCache = null;
}
