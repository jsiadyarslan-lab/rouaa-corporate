// ═══════════════════════════════════════════════════════════════
// Turkish News Pipeline Configuration
// Centralized configuration for the Turkish language processing pipeline.
// This is the Turkish counterpart of the French pipeline config.
// All settings are independent — changes here do NOT affect English, Arabic or French pipelines.
// ═══════════════════════════════════════════════════════════════

export const TR_PIPELINE_CONFIG = {
  locale: 'tr' as const,

  // ── Turkish RSS Feed Sources ──
  // Turkish financial news RSS sources — verified Turkish-language feeds.
  RSS_FEEDS_TR: [
    // ═══════════════════════════════════════════
    // ── STOCKS / HİSSELER ────────────────────
    // ═══════════════════════════════════════════
    // BloombergHT — Turkish financial news (Bloomberg Türkiye)
    { url: 'https://www.bloomberght.com/rss', category: 'stocks', source: 'BloombergHT' },
    // Dünya Gazetesi — Turkish economy & business daily
    { url: 'https://www.dunya.com/rss', category: 'stocks', source: 'Dünya Gazetesi' },
    // Bigpara Hürriyet — Turkish stock market & economy
    // Google News TR — Borsa & Hisse
    { url: 'https://news.google.com/rss/search?q=borsa+hisse+finans+piyasa&hl=tr&gl=TR&ceid=TR:tr', category: 'stocks', source: 'Google News Borsa' },
    // Mynet Finans — Turkish financial markets news
    // Investing.com TR — Turkish stock market analysis
    { url: 'https://tr.investing.com/rss/news_301.rss', category: 'stocks', source: 'Investing.com TR' },

    // ═══════════════════════════════════════════
    // ── ECONOMY / EKONOMİ ────────────────────
    // ═══════════════════════════════════════════
    // TRT Haber Ekonomi — Turkish public broadcaster economy
    // Haber7 Ekonomi — Turkish economy news
    // Dünya — Ekonomi
    { url: 'https://www.dunya.com/rss/ekonomi.xml', category: 'economy', source: 'Dünya Ekonomi' },
    // Google News TR — Ekonomi
    { url: 'https://news.google.com/rss/search?q=ekonomi+merkez+bankas%C4%B1+enflasyon+b%C3%BCy%C3%BCme&hl=tr&gl=TR&ceid=TR:tr', category: 'economy', source: 'Google News Ekonomi' },
    // Anadolu Ajansı Ekonomi — Turkish national news agency economy
    { url: 'https://www.aa.com.tr/rss/ekonomi.xml', category: 'economy', source: 'Anadolu Ajansı Ekonomi' },
    // NTV Ekonomi — Major Turkish news channel economy
    // Hürriyet Ekonomi — Leading Turkish newspaper economy
    { url: 'https://www.hurriyet.com.tr/rss/ekonomi', category: 'economy', source: 'Hürriyet Ekonomi' },
    // Google News TR — Merkez Bankası & Faiz
    { url: 'https://news.google.com/rss/search?q=merkez+bankas%C4%B1+faiz+para+politikas%C4%B1&hl=tr&gl=TR&ceid=TR:tr', category: 'economy', source: 'Google News Merkez Bankası' },

    // ═══════════════════════════════════════════
    // ── FOREX / DÖVİZ ────────────────────────
    // ═══════════════════════════════════════════
    // Bigpara Hürriyet — Döviz
    // Google News TR — Döviz & Forex
    { url: 'https://news.google.com/rss/search?q=d%C3%B6viz+forex+kur+dolar+euro&hl=tr&gl=TR&ceid=TR:tr', category: 'forex', source: 'Google News Döviz' },
    // Investing.com TR — Forex news
    { url: 'https://tr.investing.com/rss/news_11.rss', category: 'forex', source: 'Investing.com TR Forex' },
    // Google News TR — Dolar & TL
    { url: 'https://news.google.com/rss/search?q=dolar+t%C3%BCrk+liras%C4%B1+kur+de%C4%9Fi%C5%9Fimi&hl=tr&gl=TR&ceid=TR:tr', category: 'forex', source: 'Google News Dolar/TL' },

    // ═══════════════════════════════════════════
    // ── CRYPTO / KRIPTO ──────────────────────
    // ═══════════════════════════════════════════
    // Google News TR — Kripto Para
    { url: 'https://news.google.com/rss/search?q=kripto+para+bitcoin+ethereum&hl=tr&gl=TR&ceid=TR:tr', category: 'crypto', source: 'Google News Kripto' },
    // CoinTurk — Turkish crypto news
    // Google News TR — Blockchain & Regülasyon
    { url: 'https://news.google.com/rss/search?q=kripto+borsa+reg%C3%BClasyon+blockchain&hl=tr&gl=TR&ceid=TR:tr', category: 'crypto', source: 'Google News Blockchain' },
    // KoinFinans — Turkish cryptocurrency and finance
    { url: 'https://koinfinans.com/feed/', category: 'crypto', source: 'KoinFinans' },

    // ═══════════════════════════════════════════
    // ── ENERGY / ENERJİ ──────────────────────
    // ═══════════════════════════════════════════
    // Google News TR — Enerji & Petrol
    { url: 'https://news.google.com/rss/search?q=enerji+petrol+do%C4%9Fal+gaz&hl=tr&gl=TR&ceid=TR:tr', category: 'energy', source: 'Google News Enerji' },
    // Google News TR — Yenilenebilir Enerji
    { url: 'https://news.google.com/rss/search?q=yenilenebilir+enerji+g%C3%BCne%C5%9F+r%C3%BCzgar&hl=tr&gl=TR&ceid=TR:tr', category: 'energy', source: 'Google News Yenilenebilir Enerji' },

    // ═══════════════════════════════════════════
    // ── COMMODITIES / EMTİA ──────────────────
    // ═══════════════════════════════════════════
    // Bigpara Hürriyet — Emtia
    // Google News TR — Altın & Emtia
    { url: 'https://news.google.com/rss/search?q=alt%C4%B1n+emtia+g%C3%BCm%C3%BC%C5%9F&hl=tr&gl=TR&ceid=TR:tr', category: 'commodities', source: 'Google News Emtia' },
    // Google News TR — Altın Fiyatları
    { url: 'https://news.google.com/rss/search?q=alt%C4%B1n+fiyatlar%C4%B1+ons+de%C4%9Ferli+maden&hl=tr&gl=TR&ceid=TR:tr', category: 'commodities', source: 'Google News Altın Fiyatları' },

    // ═══════════════════════════════════════════
    // ── BONDS / TAHVİLLER ────────────────────
    // ═══════════════════════════════════════════
    // Google News TR — Tahvil & Bonolar
    { url: 'https://news.google.com/rss/search?q=tahvil+bono+getiri+hazine&hl=tr&gl=TR&ceid=TR:tr', category: 'bonds', source: 'Google News Tahvil' },

    // ═══════════════════════════════════════════
    // ── BANKING / BANKACILIK ─────────────────
    // ═══════════════════════════════════════════
    // Google News TR — Bankacılık & Finansal Sektör
    { url: 'https://news.google.com/rss/search?q=bankac%C4%B1l%C4%B1k+kredi+mevduat+finansal+sekt%C3%B6r&hl=tr&gl=TR&ceid=TR:tr', category: 'banking', source: 'Google News Bankacılık' },

    // ═══════════════════════════════════════════
    // ── EARNINGS / MALİ TABLOLAR ─────────────
    // ═══════════════════════════════════════════
    // Google News TR — Şirket sonuçları
    { url: 'https://news.google.com/rss/search?q=%C5%9Firket+sonu%C3%A7lar%C4%B1+kar+zarar+b%C3%BClten&hl=tr&gl=TR&ceid=TR:tr', category: 'earnings', source: 'Google News Şirket Sonuçları' },
    // Google News TR — BIST Şirket Haberleri
    { url: 'https://news.google.com/rss/search?q=BIST+hisse+temett%C3%BC+b%C3%BClten+%C5%9Firket&hl=tr&gl=TR&ceid=TR:tr', category: 'earnings', source: 'Google News BIST Şirket' },

    // ═══════════════════════════════════════════
    // ── REAL ESTATE / GAYRİMENKUL ────────────
    // ═══════════════════════════════════════════
    // Google News TR — Gayrimenkul
    { url: 'https://news.google.com/rss/search?q=gayrimenkul+konut+emlak&hl=tr&gl=TR&ceid=TR:tr', category: 'realEstate', source: 'Google News Gayrimenkul' },
    // Google News TR — Konut Piyasası
    { url: 'https://news.google.com/rss/search?q=konut+fiyat+kira+emlak+piyasa&hl=tr&gl=TR&ceid=TR:tr', category: 'realEstate', source: 'Google News Konut Piyasası' },

    // ═══════════════════════════════════════════
    // ── TECHNOLOGY / TEKNOLOJİ ───────────────
    // ═══════════════════════════════════════════
    // Google News TR — Teknoloji & Yapay Zeka
    { url: 'https://news.google.com/rss/search?q=teknoloji+yapay+zeka+yaz%C4%B1l%C4%B1m&hl=tr&gl=TR&ceid=TR:tr', category: 'technology', source: 'Google News Teknoloji' },
    // Google News TR — Yapay Zeka & İnovasyon
    { url: 'https://news.google.com/rss/search?q=yapay+zeka+teknoloji+%C5%9Firket+inovasyon&hl=tr&gl=TR&ceid=TR:tr', category: 'technology', source: 'Google News Yapay Zeka' },

    // ═══════════════════════════════════════════
    // ── STRATEGIC / JEOPOLİTİK ───────────────
    // ═══════════════════════════════════════════
    // Google News TR — Jeopolitik & Dış Politika
    { url: 'https://news.google.com/rss/search?q=jeopolitik+d%C4%B1%C5%9F+politika+uluslararas%C4%B1+ili%C5%9Fkiler&hl=tr&gl=TR&ceid=TR:tr', category: 'strategic', source: 'Google News Jeopolitik' },
    // Google News TR — Orta Doğu & Türkiye
    { url: 'https://news.google.com/rss/search?q=orta+do%C4%9Fu+t%C3%BCrkiye+uluslararas%C4%B1+ticaret&hl=tr&gl=TR&ceid=TR:tr', category: 'strategic', source: 'Google News Orta Doğu' },

    // ═══════════════════════════════════════════
    // ── TECHNICAL ANALYSIS / TEKNİK ANALİZ ──
    // ═══════════════════════════════════════════
    // Google News TR — Teknik Analiz & Grafik

    // ═══════════════════════════════════════════
    // ── NEW SOURCES V402 — Enhanced Economic Coverage ──
    // ═══════════════════════════════════════════

    // ── Ekonomim — Turkish economy & business daily ──
    { url: 'https://www.ekonomim.com/rss', category: 'economy', source: 'Ekonomim' },

    // ── Para Dergisi — Turkish financial magazine ──

    // ── Borsa Gündem — Turkish stock market news ──
    { url: 'https://www.borsagundem.com/rss', category: 'stocks', source: 'Borsa Gündem' },

    // ── Capital TR — Turkish business & finance magazine ──
    { url: 'https://www.capital.com.tr/rss', category: 'economy', source: 'Capital TR' },

    // ── Forbes Türkiye ──

    // ── Google News TR — Borsa İstanbul & IPO ──
    { url: 'https://news.google.com/rss/search?q=Borsa+%C4%B0stanbul+halka+arz+IPO+BIST+endeks&hl=tr&gl=TR&ceid=TR:tr', category: 'stocks', source: 'Google News BIST IPO' },

    // ── Google News TR — Bankacılık & Kredi ──
    { url: 'https://news.google.com/rss/search?q=bankac%C4%B1l%C4%B1k+kredi+mevduat+faiz+TCMB&hl=tr&gl=TR&ceid=TR:tr', category: 'banking', source: 'Google News Bankacılık Detay' },

    // ── Google News TR — Tarım & Gıda ──
    { url: 'https://news.google.com/rss/search?q=tar%C4%B1m+g%C4%B1da+emtia+fiyat+tar%C4%B1msal&hl=tr&gl=TR&ceid=TR:tr', category: 'commodities', source: 'Google News Tarım' },

    // ── Google News TR — ESG & Sürdürülebilirlik ──
    { url: 'https://news.google.com/rss/search?q=ESG+s%C3%BCrd%C3%BCr%C3%BClebilirlik+ye%C5%9Fil+bono+iklim+finans&hl=tr&gl=TR&ceid=TR:tr', category: 'bonds', source: 'Google News ESG TR' },

    // ── Google News TR — Otomotiv & Sanayi ──
    { url: 'https://news.google.com/rss/search?q=otomotiv+sanayi+%C3%BCretim+ihracat+imalat&hl=tr&gl=TR&ceid=TR:tr', category: 'economy', source: 'Google News Sanayi' },

    // ── Google News TR — Turizm & Hizmet ──
    { url: 'https://news.google.com/rss/search?q=turizm+hizmet+sekt%C3%B6r+istihdam+GSYH&hl=tr&gl=TR&ceid=TR:tr', category: 'economy', source: 'Google News Turizm' },

    // ═══════════════════════════════════════════
    // ── OFFICIAL SOURCES (V1071) — Turkey, EU, Global ──
    // ═══════════════════════════════════════════
    // TCMB (Türkiye Cumhuriyet Merkez Bankası)
    // BDDK (Bankacılık Düzenleme ve Denetleme Kurumu)
    // SPK (Sermaye Piyasası Kurulu)
    { url: 'https://www.spk.gov.tr/rss', category: 'stocks', source: 'SPK' },
    // TÜİK (Türkiye İstatistik Kurumu)
    // Hazine ve Maliye Bakanlığı
    { url: 'https://www.hmb.gov.tr/rss', category: 'economy', source: 'Hazine Bakanlığı' },
    // Ticaret Bakanlığı
    { url: 'https://www.ticaret.gov.tr/rss', category: 'economy', source: 'Ticaret Bakanlığı' },
    // Borsa İstanbul
    // KAP (Kamuyu Aydınlatma Platformu)
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
    // AIIB
    // IsDB (Islamic Development Bank)
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

  // ── Separate publish limits for Turkish pipeline ──
  MAX_DAILY_PUBLISHED_TR: 1500,
  MAX_HOURLY_PUBLISHED_TR: 100,

  // ── Daily limit reset hour (UTC) ──
  // The hour at which the daily quota resets. 0 = midnight UTC.
  DAILY_LIMIT_RESET_HOUR: 0,

  // ── Turkish Quality Thresholds ──
  // Turkish uses Latin characters with special chars (ş, ç, ö, ü, ğ, ı, İ)
  MIN_TURKISH_RATIO: 0.50,            // Minimum ratio of Turkish/Latin characters in content
  MIN_TR_TITLE_LENGTH: 4,             // Minimum Turkish title length
  MIN_TR_CONTENT_LENGTH: 80,          // Minimum Turkish content length
  MIN_TR_SUMMARY_LENGTH: 10,          // Minimum Turkish summary length

  // ── Turkish Content Quality ──
  REQUIRE_TITLE_TR: true,             // Must have Turkish title
  REQUIRE_CONTENT_TR: true,           // Must have Turkish content
  REQUIRE_GENERATED_IMAGE: true,      // AI-generated image is MANDATORY
  REQUIRE_SLUG: true,                 // Must have slug
  REQUIRE_AI_ANALYSIS: true,          // AI analysis is MANDATORY

  // ── Processing Timeouts ──
  PROCESSING_TIMEOUT_MS: 180_000,     // 3 minutes for unified processing
  ANALYSIS_TIMEOUT_MS: 120_000,       // 2 minutes for 4-gate analysis
  IMAGE_TIMEOUT_MS: 60_000,           // 1 minute for image generation

  // ── Speculation Thresholds (Turkish) ──
  SPECULATION_REPUBLISH_THRESHOLD: 15,   // Speculative words above this → regenerate
  SPECULATION_BLOCK_THRESHOLD: 40,       // Turkish financial reports naturally use speculative language

  // ── Turkish Report Schedule ──
  // All asset classes that should have Turkish reports generated
  TR_REPORT_ASSET_CLASSES: [
    'stocks', 'commodities', 'forex', 'crypto', 'bonds',
    'energy', 'economy', 'earnings',
    'technicalAnalysis',
  ] as const,

  // Turkish-specific report intervals
  TR_DAILY_INTERVAL_MS: 24 * 60 * 60 * 1000,       // 24 hours
  TR_WEEKLY_INTERVAL_MS: 168 * 60 * 60 * 1000,      // 7 days
  TR_MONTHLY_INTERVAL_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
  TR_TECHNICAL_INTERVAL_MS: 8 * 60 * 60 * 1000,     // 8 hours
  TR_QUARTERLY_INTERVAL_MS: 90 * 24 * 60 * 60 * 1000, // 90 days

  // Speculation threshold overrides for REPORTS (longer content)
  SPECULATION_REPORT_BLOCK_THRESHOLD: 60,

  // Turkish infographic auto-generation
  TR_INFOGRAPHIC_MAX_PER_CYCLE: 3,  // Max auto-infographics per cycle
  TR_INFOGRAPHIC_MIN_CONFIDENCE: 30, // Minimum confidence score for auto-infographic

  // ── Category mapping from Turkish category IDs to DB category strings ──
  CATEGORY_MAP_TR: {
    economy: 'Ekonomi',
    stocks: 'Hisseler',
    forex: 'Döviz',
    crypto: 'Kripto',
    energy: 'Enerji',
    commodities: 'Emtia',
    realEstate: 'Gayrimenkul',
    banking: 'Bankacılık',
    earnings: 'Mali Tablolar',
    arabMarkets: 'Arap Pazarları',
    bonds: 'Tahviller',
    technicalAnalysis: 'Teknik Analiz',
    strategic: 'Jeopolitik',
    technology: 'Teknoloji',
    politics: 'Siyaset',
    breaking: 'Flaş',
  } as Record<string, string>,

  // ── Direction ──
  TEXT_DIRECTION: 'ltr' as const,  // Turkish is LTR
} as const;

export type TrPipelineConfig = typeof TR_PIPELINE_CONFIG;

// ── Dynamic Turkish Pipeline Limits ───────────────────────────
// Reads from site_settings DB, falls back to hardcoded defaults.
// Allows admin to change Turkish news limits from dashboard without redeployment.

let _trLimitsCache: { maxDailyTrNews: number; maxHourlyTrNews: number; ts: number } | null = null;
const TR_LIMITS_CACHE_TTL_MS = 30_000; // Cache for 30 seconds to avoid DB hammering

export async function getTrPipelineLimits(): Promise<{ maxDailyTrNews: number; maxHourlyTrNews: number }> {
  // Return cached value if fresh
  if (_trLimitsCache && Date.now() - _trLimitsCache.ts < TR_LIMITS_CACHE_TTL_MS) {
    return { maxDailyTrNews: _trLimitsCache.maxDailyTrNews, maxHourlyTrNews: _trLimitsCache.maxHourlyTrNews };
  }

  try {
    const { db } = await import('@/lib/db');
    const daySetting = await db.siteSetting.findUnique({ where: { key: 'pipeline_maxDailyTrNews' } });
    const hourSetting = await db.siteSetting.findUnique({ where: { key: 'pipeline_maxHourlyTrNews' } });

    const dbDayValue = daySetting?.value ? parseInt(daySetting.value, 10) : 0;
    const dbHourValue = hourSetting?.value ? parseInt(hourSetting.value, 10) : 0;

    // V380: Changed from Math.max(db, hardcoded) to match ALL other locales.
    // Previously used Math.max which made it IMPOSSIBLE to lower the Turkish
    // quota from the admin dashboard — the hardcoded default (1500) always won.
    // Now: DB value takes priority if set, otherwise falls back to hardcoded default.
    const maxDailyTrNews = dbDayValue > 0 ? dbDayValue : TR_PIPELINE_CONFIG.MAX_DAILY_PUBLISHED_TR;
    const maxHourlyTrNews = dbHourValue > 0 ? dbHourValue : TR_PIPELINE_CONFIG.MAX_HOURLY_PUBLISHED_TR;

    _trLimitsCache = { maxDailyTrNews, maxHourlyTrNews, ts: Date.now() };
    return { maxDailyTrNews, maxHourlyTrNews };
  } catch {
    // Fallback to hardcoded defaults on DB error
    return {
      maxDailyTrNews: TR_PIPELINE_CONFIG.MAX_DAILY_PUBLISHED_TR,
      maxHourlyTrNews: TR_PIPELINE_CONFIG.MAX_HOURLY_PUBLISHED_TR,
    };
  }
}

// Clear the TR limits cache (call after saving new limits from admin)
export function clearTrPipelineLimitsCache(): void {
  _trLimitsCache = null;
}
