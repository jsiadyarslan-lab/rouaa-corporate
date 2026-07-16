// ═══════════════════════════════════════════════════════════════
// Spanish News Pipeline Configuration
// Centralized configuration for the Spanish language processing pipeline.
// This is the Spanish counterpart of the English pipeline config.
// All settings are independent — changes here do NOT affect other pipelines.
// ═══════════════════════════════════════════════════════════════

export const ES_PIPELINE_CONFIG = {
  locale: 'es' as const,

  // ── Spanish RSS Feed Sources ──
  // Targeting Spanish-speaking financial audience with Spanish-language sources.
  // Covers: stocks, economy, forex, crypto, energy, commodities, bonds,
  // technology, geopolitics, technical analysis, earnings, and more.
  RSS_FEEDS_ES: [
    // ═══════════════════════════════════════════
    // ── STOCKS / RENTA VARIABLE ───────────────
    // ═══════════════════════════════════════════
    // Expansión — Leading Spanish financial newspaper
    // El Economista — Spanish financial news
    // Cinco Días — Spanish business daily
    // El País Economía — Economy section of Spain's top newspaper
    // El Mundo Economía — Economy section of El Mundo
    { url: 'https://estaticos.elmundo.es/elmundo/rss/economia.xml', category: 'economy', source: 'El Mundo Economía' },
    // La Vanguardia Economía — Catalan business news
    { url: 'https://www.lavanguardia.com/rss/economia.xml', category: 'economy', source: 'La Vanguardia' },
    // ABC Economía — Spanish business news
    { url: 'https://www.abc.es/rss/feeds/abc_Economia.xml', category: 'economy', source: 'ABC Economía' },
    // El Confidencial — Spanish digital financial newspaper
    { url: 'https://www.elconfidencial.com/rss/economia.xml', category: 'economy', source: 'El Confidencial' },

    // ═══════════════════════════════════════════
    // ── LATIN AMERICA ─────────────────────────
    // ═══════════════════════════════════════════
    // El Financiero (Mexico) — Mexican financial news
    { url: 'https://www.elfinanciero.com.mx/rss/economia.html', category: 'economy', source: 'El Financiero MX' },
    // La Nación Economía (Argentina) — Argentine business
    // El Mercurio (Chile) — Chilean business news
    { url: 'https://www.emol.com/rss/economia.html', category: 'economy', source: 'Emol Chile' },
    // Gestión (Peru) — Peruvian financial news
    // Portafolio (Colombia) — Colombian business

    // ═══════════════════════════════════════════
    // ── ECONOMY / ECONOMÍA ────────────────────
    // ═══════════════════════════════════════════
    // BBC Mundo Economía — Spanish-language BBC
    { url: 'https://feeds.bbci.co.uk/mundo/rss.xml', category: 'economy', source: 'BBC Mundo' },
    // CNN Español — Spanish CNN business
    // DW Español Economía — Deutsche Welle Spanish
    // France24 Español — French international broadcaster Spanish
    { url: 'https://www.france24.com/es/rss', category: 'economy', source: 'France24 ES' },
    // EFE Economía — Spanish news agency economy
    { url: 'https://www.efe.com/rss.aspx?service=424', category: 'economy', source: 'EFE Economía' },
    // Europa Press Economía — Spanish press agency
    { url: 'https://www.europapress.es/rss/rss.aspx?ch=002', category: 'economy', source: 'Europa Press' },
    // Reuters España — Spanish Reuters

    // ═══════════════════════════════════════════
    // ── FOREX / DIVISAS ───────────────────────
    // ═══════════════════════════════════════════
    // Investing.com Español — Forex en español
    { url: 'https://www.investing.com/rss/news_301.rss', category: 'forex', source: 'Investing.com ES' },
    // FXStreet Español — Professional forex analysis in Spanish
    // DailyFX Español — IG Group's Spanish forex

    // ═══════════════════════════════════════════
    // ── CRYPTO / CRIPTOMONEDAS ─────────────────
    // ═══════════════════════════════════════════
    // CoinDesk Español — Crypto news in Spanish
    // Cointelegraph Español — Crypto & blockchain en español
    // CriptoNoticias — Latin American crypto news
    // Bitcoinist Español — Bitcoin news in Spanish
    { url: 'https://bitcoinist.com/es/feed/', category: 'crypto', source: 'Bitcoinist ES' },

    // ═══════════════════════════════════════════
    // ── ENERGY / ENERGÍA ──────────────────────
    // ═══════════════════════════════════════════
    // Energías Renovables — Spanish renewable energy
    // OilPrice Spanish — Oil markets coverage
    // El Periódico de la Energía — Spanish energy sector
    { url: 'https://www.elperiodicodelaenergia.com/feed/', category: 'energy', source: 'Periódico Energía' },

    // ═══════════════════════════════════════════
    // ── COMMODITIES / MATERIAS PRIMAS ─────────
    // ═══════════════════════════════════════════
    // Investing.com Commodities ES
    { url: 'https://www.investing.com/rss/news_11.rss', category: 'commodities', source: 'Investing.com Materias' },
    // Kitco Español — Precious metals in Spanish
    { url: 'https://news.google.com/rss/search?q=oro+plata+materias+primas+mercados&hl=es&gl=ES&ceid=ES:es', category: 'commodities', source: 'Google News Materias' },

    // ═══════════════════════════════════════════
    // ── BONDS / RENTA FIJA ────────────────────
    // ═══════════════════════════════════════════
    // Investing.com Bonds ES
    // Google News Bonds Spanish
    { url: 'https://news.google.com/rss/search?q=bonos+deuda+soberana+BCE&hl=es&gl=ES&ceid=ES:es', category: 'bonds', source: 'Google News Bonos' },

    // ═══════════════════════════════════════════
    // ── TECHNOLOGY / TECNOLOGÍA ────────────────
    // ═══════════════════════════════════════════
    // Xataka — Spanish tech blog
    // El País Tecnología — Tech section of El País
    // Muy Computer — Spanish IT news
    { url: 'https://www.muycomputer.com/feed/', category: 'technology', source: 'MuyComputer' },
    // Hipertextual — Spanish tech & science
    { url: 'https://hipertextual.com/feed', category: 'technology', source: 'Hipertextual' },

    // ═══════════════════════════════════════════
    // ── TECHNICAL ANALYSIS / ANÁLISIS TÉCNICO ─
    // ═══════════════════════════════════════════
    // Investing.com Technical ES
    // TradingView ES — Community ideas in Spanish

    // ═══════════════════════════════════════════
    // ── GEOPOLITICS & WORLD / GEOPOLÍTICA ─────
    // ═══════════════════════════════════════════
    // RT Español — Russian perspective in Spanish
    { url: 'https://actualidad.rt.com/rss/', category: 'strategic', source: 'RT Español' },
    // Al Jazeera Español — International news
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'strategic', source: 'Al Jazeera' },
    // Google News Geopolítica ES

    // ═══════════════════════════════════════════
    // ── NEW SOURCES V402 — Enhanced Economic Coverage ──
    // ═══════════════════════════════════════════

    // ── El Economista Bolsa — Spanish stock market specific ──

    // ── Inversión & Finanzas (Spain) ──

    // ── Bolsamanía — Spanish stock market community ──
    { url: 'https://www.bolsamania.com/rss/noticias.xml', category: 'stocks', source: 'Bolsamanía' },

    // ── Cotizalia — Spanish financial markets ──

    // ── Google News ES — Banca & Seguros ──
    { url: 'https://news.google.com/rss/search?q=banca+seguros+cr%C3%A9dito+pr%C3%A9stamo+entidad+financiera&hl=es&gl=ES&ceid=ES:es', category: 'banking', source: 'Google News Banca ES' },

    // ── Google News ES — Inversiones & Fondos ──
    { url: 'https://news.google.com/rss/search?q=inversiones+fondos+inversi%C3%B3n+ETF+rentabilidad&hl=es&gl=ES&ceid=ES:es', category: 'stocks', source: 'Google News Inversiones' },

    // ── Google News ES — Fiscalidad & Impuestos ──
    { url: 'https://news.google.com/rss/search?q=fiscalidad+impuestos+IRPF+IVA+reforma+fiscal&hl=es&gl=ES&ceid=ES:es', category: 'economy', source: 'Google News Fiscalidad' },

    // ── Google News ES — Inmobiliario ──
    { url: 'https://news.google.com/rss/search?q=inmobiliario+vivienda+hipoteca+alquiler+precio&hl=es&gl=ES&ceid=ES:es', category: 'realEstate', source: 'Google News Inmobiliario' },

    // ── Google News ES — ESG & Finanzas Sostenibles ──
    { url: 'https://news.google.com/rss/search?q=ESG+finanzas+sostenibles+bono+verde+inversi%C3%B3n+responsable&hl=es&gl=ES&ceid=ES:es', category: 'bonds', source: 'Google News ESG ES' },

    // ── Google News ES — Resultados Empresariales ──
    { url: 'https://news.google.com/rss/search?q=resultados+empresariales+beneficios+IBEX+cotizaci%C3%B3n&hl=es&gl=ES&ceid=ES:es', category: 'earnings', source: 'Google News Resultados ES' },

    // ── América Economía — Latin American business ──

    // ── Forbes España ──

    // ═══════════════════════════════════════════
    // ── OFFICIAL SOURCES (V1071) — Spain, LatAm, EU, Global ──
    // ═══════════════════════════════════════════
    // Banco de España
    // CNMV (Comisión Nacional del Mercado de Valores)
    // INE (Instituto Nacional de Estadística)
    // Ministerio de Economía España
    // BME (Bolsas y Mercados Españoles)
    // Banco de México
    // Banco Central de Chile
    // Banco Central de Colombia
    { url: 'https://www.banrep.gov.co/rss', category: 'bonds', source: 'Banco de la República Colombia' },
    // Banco Central del Perú
    { url: 'https://www.bcrp.gob.pe/rss', category: 'bonds', source: 'BCRP' },
    // Banco Central de Argentina
    // Banco Central do Brasil
    { url: 'https://www.bcb.gov.br/rss', category: 'bonds', source: 'Banco Central do Brasil' },
    // ECB
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
    // Bruegel
    // EIB
    // EBRD
    // AfDB
    // ADB
    // IADB (Inter-American Development Bank)
    // CEPAL (UN Economic Commission for Latin America)
    // Nasdaq
    // NYSE
    // Euronext
    // LME
    // ICE
    // US BLS
    // US BEA
    { url: 'https://www.bea.gov/news/rss', category: 'economy', source: 'BEA' },
    // Eurostat
  ],

  // ── Separate publish limits for Spanish pipeline ──
  MAX_DAILY_PUBLISHED_ES: 300,
  MAX_HOURLY_PUBLISHED_ES: 50,
  DAILY_LIMIT_RESET_HOUR: 0,  // UTC hour when daily quota resets (0 = midnight UTC)

  // ── Spanish Quality Thresholds ──
  MIN_SPANISH_RATIO: 0.60,          // Minimum ratio of Spanish characters in content
  MIN_ES_TITLE_LENGTH: 4,           // Minimum Spanish title length
  MIN_ES_CONTENT_LENGTH: 200,       // Minimum Spanish content length
  MIN_ES_SUMMARY_LENGTH: 10,        // Minimum Spanish summary length

  // ── Spanish Content Quality ──
  REQUIRE_TITLE_ES: true,           // Must have Spanish title
  REQUIRE_CONTENT_ES: true,         // Must have Spanish content
  REQUIRE_GENERATED_IMAGE: true,    // AI-generated image is MANDATORY
  REQUIRE_SLUG: true,               // Must have slug
  REQUIRE_AI_ANALYSIS: true,        // AI analysis is MANDATORY

  // ── Processing Timeouts ──
  PROCESSING_TIMEOUT_MS: 180_000,   // 3 minutes for unified processing
  ANALYSIS_TIMEOUT_MS: 120_000,     // 2 minutes for 4-gate analysis
  IMAGE_TIMEOUT_MS: 60_000,         // 1 minute for image generation

  // ── Speculation Thresholds (Spanish) ──
  SPECULATION_REPUBLISH_THRESHOLD: 15,   // Speculative words above this → regenerate
  SPECULATION_BLOCK_THRESHOLD: 25,       // Speculative words above this → block publishing

  // V375: Speculation threshold overrides for REPORTS (longer content)
  // Reports are naturally more speculative than news articles — they analyze
  // future trends and provide forecasts. Use higher thresholds for reports.
  SPECULATION_REPORT_BLOCK_THRESHOLD: 60,  // For reports/analyses (was 25, same as articles)

  // ── Spanish Report Schedule ──
  ES_REPORT_ASSET_CLASSES: [
    'strategic', 'stocks', 'commodities', 'forex', 'crypto', 'bonds',
    'energy', 'economy', 'earnings',
    'technicalAnalysis',
  ] as const,

  // Spanish-specific report intervals
  ES_DAILY_INTERVAL_MS: 24 * 60 * 60 * 1000,       // 24 hours
  ES_WEEKLY_INTERVAL_MS: 168 * 60 * 60 * 1000,      // 7 days
  ES_MONTHLY_INTERVAL_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
  ES_TECHNICAL_INTERVAL_MS: 8 * 60 * 60 * 1000,     // 8 hours
  ES_QUARTERLY_INTERVAL_MS: 90 * 24 * 60 * 60 * 1000, // 90 days

  // Spanish infographic auto-generation
  ES_INFOGRAPHIC_MAX_PER_CYCLE: 3,
  ES_INFOGRAPHIC_MIN_CONFIDENCE: 30,

  // ── Category mapping from Spanish category IDs to DB category strings ──
  CATEGORY_MAP_ES: {
    economy: 'Economía',
    stocks: 'Renta Variable',
    forex: 'Divisas',
    crypto: 'Criptomonedas',
    energy: 'Energía',
    commodities: 'Materias Primas',
    realEstate: 'Inmobiliario',
    banking: 'Banca',
    earnings: 'Resultados',
    arabMarkets: 'Mercados Árabes',
    bonds: 'Renta Fija',
    technicalAnalysis: 'Análisis Técnico',
    strategic: 'Estratégico',
    technology: 'Tecnología',
    politics: 'Política',
    breaking: 'Urgente',
  } as Record<string, string>,

  // ── Direction ──
  TEXT_DIRECTION: 'ltr' as const,  // Spanish is LTR
} as const;

export type EsPipelineConfig = typeof ES_PIPELINE_CONFIG;

// ── Dynamic Spanish Pipeline Limits ──────────────────────
// Reads from site_settings DB, falls back to hardcoded defaults.

let _esLimitsCache: { maxDailyEsNews: number; maxHourlyEsNews: number; ts: number } | null = null;
const ES_LIMITS_CACHE_TTL_MS = 30_000; // Cache for 30 seconds

export async function getEsPipelineLimits(): Promise<{ maxDailyEsNews: number; maxHourlyEsNews: number }> {
  // Return cached value if fresh
  if (_esLimitsCache && Date.now() - _esLimitsCache.ts < ES_LIMITS_CACHE_TTL_MS) {
    return { maxDailyEsNews: _esLimitsCache.maxDailyEsNews, maxHourlyEsNews: _esLimitsCache.maxHourlyEsNews };
  }

  try {
    const { db } = await import('@/lib/db');
    const daySetting = await db.siteSetting.findUnique({ where: { key: 'pipeline_maxDailyEsNews' } });
    const hourSetting = await db.siteSetting.findUnique({ where: { key: 'pipeline_maxHourlyEsNews' } });

    const dbDayValue = daySetting?.value ? parseInt(daySetting.value, 10) : 0;
    const dbHourValue = hourSetting?.value ? parseInt(hourSetting.value, 10) : 0;

    // If DB has a valid value (> 0), use it; otherwise fall back to hardcoded default
    const maxDailyEsNews = dbDayValue > 0 ? dbDayValue : ES_PIPELINE_CONFIG.MAX_DAILY_PUBLISHED_ES;
    const maxHourlyEsNews = dbHourValue > 0 ? dbHourValue : ES_PIPELINE_CONFIG.MAX_HOURLY_PUBLISHED_ES;

    _esLimitsCache = { maxDailyEsNews, maxHourlyEsNews, ts: Date.now() };
    return { maxDailyEsNews, maxHourlyEsNews };
  } catch {
    // Fallback to hardcoded defaults on DB error
    return {
      maxDailyEsNews: ES_PIPELINE_CONFIG.MAX_DAILY_PUBLISHED_ES,
      maxHourlyEsNews: ES_PIPELINE_CONFIG.MAX_HOURLY_PUBLISHED_ES,
    };
  }
}

// Clear the ES limits cache (call after saving new limits from admin)
export function clearEsPipelineLimitsCache(): void {
  _esLimitsCache = null;
}
