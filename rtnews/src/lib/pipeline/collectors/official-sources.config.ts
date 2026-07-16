// ═══════════════════════════════════════════════════════════════
// Official Sources Registry — Rouaa News Writer Agent
// ═══════════════════════════════════════════════════════════════
// Purpose: Registry of official financial/economic sources that the
// news-writer agent fetches DIRECTLY (not through the RSS pipeline).
//
// All URLs in this file are VERIFIED WORKING — extracted from
// news-sources.ts (which survived the V1081 cleanup of 585 broken
// feeds). Do NOT add URLs without testing them first.
//
// Legal: All sources are public RSS feeds or public APIs with
// permissive terms of use. No scraping. User-Agent identifies us.
// ═══════════════════════════════════════════════════════════════

export type SourceType = 'rss' | 'api';
export type SourceCategory =
  | 'central_bank'
  | 'regulator'
  | 'statistics'
  | 'international_org'
  | 'sovereign_wealth'
  | 'rating_agency'
  | 'stock_exchange'
  | 'commodity_energy'
  | 'treasury'
  | 'finance_ministry'
  | 'media';

export type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

export interface OfficialSource {
  id: string;
  name: string;
  nameAr: string;
  url: string;
  type: SourceType;
  category: SourceCategory;
  defaultLocale: Locale;
  priority: 'breaking' | 'high' | 'normal';
  parser?: 'rss_standard' | 'sec_edgar_filings' | 'fred_observations' | 'treasury_auctions';
  apiKeyEnv?: string;
  rateLimitMs?: number;
  enabled: boolean;
}

// ─── User-Agent ────────────────────────────────────────────
export const OFFICIAL_USER_AGENT = 'Rouaa News Agent contact@rouaa.com';

// ─── Default rate limit: 1 request per second per source ──
export const DEFAULT_RATE_LIMIT_MS = 1000;

// ─── RSS timeout: 15 seconds ──────────────────────────────
export const RSS_TIMEOUT_MS = 15000;

// ─── API timeout: 8 seconds (hot path protection) ─────────
export const API_TIMEOUT_MS = 8000;

// ═══════════════════════════════════════════════════════════════
// SOURCE REGISTRY — All URLs verified working (from news-sources.ts)
// ═══════════════════════════════════════════════════════════════

export const OFFICIAL_SOURCES: OfficialSource[] = [

  // ─── CATEGORY 1: Central Banks (verified URLs) ──────────

  {
    id: 'fed_press',
    name: 'Federal Reserve Press Releases',
    nameAr: 'بيانات صحفية - الاحتياطي الفيدرالي',
    url: 'https://www.federalreserve.gov/feeds/press_all.xml',
    type: 'rss', category: 'central_bank', defaultLocale: 'en',
    priority: 'breaking', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'fed_speeches',
    name: 'Federal Reserve Speeches',
    nameAr: 'خطابات - الاحتياطي الفيدرالي',
    url: 'https://www.federalreserve.gov/feeds/speeches.xml',
    type: 'rss', category: 'central_bank', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'ecb_press',
    name: 'ECB Press Releases',
    nameAr: 'بيانات صحفية - البنك المركزي الأوروبي',
    url: 'https://www.ecb.europa.eu/rss/press.html',
    type: 'rss', category: 'central_bank', defaultLocale: 'en',
    priority: 'breaking', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'boc_press',
    name: 'Bank of Canada Press Releases',
    nameAr: 'بيانات صحفية - بنك كندا',
    url: 'https://www.bankofcanada.ca/content_type/press-releases/feed/',
    type: 'rss', category: 'central_bank', defaultLocale: 'en',
    priority: 'breaking', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'riksbank_press',
    name: 'Riksbank Press Releases',
    nameAr: 'بيانات صحفية - بنك السويد',
    url: 'https://www.riksbank.se/en-gb/rss/press-releases/',
    type: 'rss', category: 'central_bank', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'bis_cpmi',
    name: 'BIS CPMI News',
    nameAr: 'أخبار - بنك التسويات الدولية',
    url: 'https://www.bis.org/list/cpmi/index.rss',
    type: 'rss', category: 'central_bank', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'fsb_news',
    name: 'Financial Stability Board News',
    nameAr: 'أخبار - مجلس الاستقرار المالي',
    url: 'https://www.fsb.org/feed/',
    type: 'rss', category: 'central_bank', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'economie_gouv',
    name: 'France Economie.gouv.fr',
    nameAr: 'وزارة الاقتصاد الفرنسية',
    url: 'https://www.economie.gouv.fr/rss',
    type: 'rss', category: 'finance_ministry', defaultLocale: 'fr',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },

  // ─── CATEGORY 2: Arab Regulators (verified URLs) ────────

  {
    id: 'sca_uae',
    name: 'UAE Securities & Commodities Authority',
    nameAr: 'هيئة الأوراق المالية الإماراتية',
    url: 'https://www.sca.gov.ae/en/rss',
    type: 'rss', category: 'regulator', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'cma_sa',
    name: 'Saudi CMA News',
    nameAr: 'أخبار - هيئة السوق المالية السعودية',
    url: 'https://www.cma.org.sa/en/rss',
    type: 'rss', category: 'regulator', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: false, // DNS/SSL fails — disabled until URL verified
  },

  // ─── CATEGORY 3: Statistics Offices (verified URLs) ─────

  {
    id: 'bea_news',
    name: 'BEA News (GDP, PCE, Trade)',
    nameAr: 'أخبار - مكتب التحليل الاقتصادي الأمريكي',
    url: 'https://www.bea.gov/news/rss',
    type: 'rss', category: 'statistics', defaultLocale: 'en',
    priority: 'breaking', parser: 'rss_standard', enabled: true,
  },

  // ─── CATEGORY 4: International Organizations (verified) ─

  {
    id: 'wto_statistics',
    name: 'WTO Statistics News',
    nameAr: 'أخبار إحصائية - منظمة التجارة العالمية',
    url: 'https://www.wto.org/library/rss/statistics_news_e.xml',
    type: 'rss', category: 'international_org', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'wto_news',
    name: 'WTO News',
    nameAr: 'أخبار - منظمة التجارة العالمية',
    url: 'https://www.wto.org/library/rss/news_e.xml',
    type: 'rss', category: 'international_org', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'world_bank_data',
    name: 'World Bank Data',
    nameAr: 'بيانات - البنك الدولي',
    url: 'https://data.worldbank.org/indicator/rss',
    type: 'rss', category: 'international_org', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },

  // ─── CATEGORY 5: Sovereign Wealth Funds (verified) ──────

  {
    id: 'adia_news',
    name: 'ADIA News (UAE)',
    nameAr: 'أخبار - جهال أبوظبي للاستثمار',
    url: 'https://www.adia.ae/en/news/rss',
    type: 'rss', category: 'sovereign_wealth', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'mubadala_news',
    name: 'Mubadala News (UAE)',
    nameAr: 'أخبار - مبادلة',
    url: 'https://www.mubadala.com/en/rss',
    type: 'rss', category: 'sovereign_wealth', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },

  // ─── CATEGORY 6: Credit Rating Agencies (verified) ──────

  {
    id: 'fitch_ratings',
    name: 'Fitch Ratings News',
    nameAr: 'أخبار - فيتش للتصنيف الائتماني',
    url: 'https://www.fitchratings.com/rss',
    type: 'rss', category: 'rating_agency', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },

  // ─── CATEGORY 7: Stock Exchanges (verified) ─────────────

  {
    id: 'lse_rns',
    name: 'LSE Regulatory News Service',
    nameAr: 'خدمة الأخبار التنظيمية - بورصة لندن',
    url: 'https://www.londonstockexchange.com/rss/news',
    type: 'rss', category: 'stock_exchange', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'adx_news',
    name: 'Abu Dhabi Securities Exchange',
    nameAr: 'أخبار - بورصة أبوظبي للأوراق المالية',
    url: 'https://www.adx.ae/English/Pages/RSS.aspx',
    type: 'rss', category: 'stock_exchange', defaultLocale: 'ar',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },

  // ─── CATEGORY 8: High-Quality Media (verified, from news-sources.ts) ─
  // These are NOT "official sources" in the regulatory sense, but they
  // are reputable financial media that the agent can use to produce
  // exclusive re-edited content. They are included here because the
  // official regulatory sources alone are too few.

  {
    id: 'cnbc_top',
    name: 'CNBC Top News',
    nameAr: 'CNBC - أهم الأخبار',
    url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'cnbc_us_economy',
    name: 'CNBC US Economy',
    nameAr: 'CNBC - الاقتصاد الأمريكي',
    url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'marketwatch_top',
    name: 'MarketWatch Top Stories',
    nameAr: 'MarketWatch - أهم الأخبار',
    url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'marketwatch_pulse',
    name: 'MarketWatch Market Pulse',
    nameAr: 'MarketWatch - نبض السوق',
    url: 'https://feeds.content.dowjones.io/public/rss/mw_marketpulse',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'wsj_markets',
    name: 'WSJ Markets',
    nameAr: 'WSJ - الأسواق',
    url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'wsj_world',
    name: 'WSJ World News',
    nameAr: 'WSJ - أخبار العالم',
    url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'nyt_business',
    name: 'NYT Business',
    nameAr: 'NYT - الأعمال',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'nyt_economy',
    name: 'NYT Economy',
    nameAr: 'NYT - الاقتصاد',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'bbc_business',
    name: 'BBC Business',
    nameAr: 'BBC - الأعمال',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'ft_home',
    name: 'Financial Times',
    nameAr: 'فاينانشال تايمز',
    url: 'https://www.ft.com/rss/home',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'guardian_business',
    name: 'The Guardian Business',
    nameAr: 'الغارديان - الأعمال',
    url: 'https://www.theguardian.com/business/rss',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'economist_finance',
    name: 'The Economist Finance',
    nameAr: 'الإيكونومست - التمويل',
    url: 'https://www.economist.com/finance-and-economics/rss.xml',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'seeking_alpha',
    name: 'Seeking Alpha Market Currents',
    nameAr: 'سيكينغ ألفا',
    url: 'https://seekingalpha.com/market_currents.xml',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'business_insider',
    name: 'Business Insider',
    nameAr: 'بزنس إنسايدر',
    url: 'https://feeds.businessinsider.com/custom/all',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'npr_news',
    name: 'NPR News',
    nameAr: 'NPR - الأخبار',
    url: 'https://feeds.npr.org/1001/rss.xml',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'google_news_markets',
    name: 'Google News — Financial Markets',
    nameAr: 'أخبار جوجل - الأسواق المالية',
    url: 'https://news.google.com/rss/search?q=financial+markets+economy+stocks&hl=en-US&gl=US&ceid=US:en',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },

  // ─── CATEGORY 9: Arabic Media (verified) ────────────────

  {
    id: 'sky_news_arabia_business',
    name: 'Sky News Arabia — Business',
    nameAr: 'سكاي نيوز عربية - الأعمال',
    url: 'https://www.skynewsarabia.com/rss/business.xml',
    type: 'rss', category: 'media', defaultLocale: 'ar',
    priority: 'high', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'aljazeera_ar',
    name: 'Al Jazeera Arabic',
    nameAr: 'الجزيرة',
    url: 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9',
    type: 'rss', category: 'media', defaultLocale: 'ar',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'france24_ar_economy',
    name: 'France 24 Arabic — Economy',
    nameAr: 'فرانس 24 - الاقتصاد',
    url: 'https://www.france24.com/ar/%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF/rss',
    type: 'rss', category: 'media', defaultLocale: 'ar',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'investing_ar_stocks',
    name: 'Investing.com Arabic — Stocks',
    nameAr: 'إنفستينغ - الأسهم',
    url: 'https://sa.investing.com/rss/news_301.rss',
    type: 'rss', category: 'media', defaultLocale: 'ar',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'google_news_ar_markets',
    name: 'Google News Arabic — Financial Markets',
    nameAr: 'أخبار جوجل - الأسواق المالية العربية',
    url: 'https://news.google.com/rss/search?q=%D8%A3%D8%B3%D9%88%D8%A7%D9%82+%D9%85%D8%A7%D9%84%D9%8A%D8%A9+%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9+%D8%AA%D8%AF%D8%A7%D9%88%D9%84+%D8%A3%D8%B3%D9%87%D9%85&hl=ar&gl=EG&ceid=EG:ar',
    type: 'rss', category: 'media', defaultLocale: 'ar',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },

  // ─── CATEGORY 10: Commodities & Crypto (verified) ───────

  {
    id: 'oilprice',
    name: 'OilPrice.com',
    nameAr: 'أسعار النفط',
    url: 'https://oilprice.com/rss/main',
    type: 'rss', category: 'commodity_energy', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'coindesk',
    name: 'CoinDesk',
    nameAr: 'كوين ديسك',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
  {
    id: 'cointelegraph',
    name: 'Cointelegraph',
    nameAr: 'كوين تيليغراف',
    url: 'https://cointelegraph.com/rss',
    type: 'rss', category: 'media', defaultLocale: 'en',
    priority: 'normal', parser: 'rss_standard', enabled: true,
  },
];

// ─── SEC EDGAR: Major companies CIK list ──────────────────
export const SEC_EDGAR_WATCH_CIKS: { cik: string; ticker: string; name: string; nameAr: string }[] = [
  { cik: '0000320193', ticker: 'AAPL', name: 'Apple Inc.', nameAr: 'آبل' },
  { cik: '0000789019', ticker: 'MSFT', name: 'Microsoft Corp.', nameAr: 'مايكروسوفت' },
  { cik: '0001652044', ticker: 'GOOGL', name: 'Alphabet Inc.', nameAr: 'ألفابت' },
  { cik: '0001018724', ticker: 'AMZN', name: 'Amazon.com Inc.', nameAr: 'أمازون' },
  { cik: '0001045810', ticker: 'NVDA', name: 'NVIDIA Corp.', nameAr: 'إنفيديا' },
  { cik: '0001318605', ticker: 'TSLA', name: 'Tesla Inc.', nameAr: 'تسلا' },
  { cik: '0001326801', ticker: 'META', name: 'Meta Platforms Inc.', nameAr: 'ميتا' },
  { cik: '0000051143', ticker: 'INTC', name: 'Intel Corp.', nameAr: 'إنتل' },
  { cik: '0000002488', ticker: 'AMD', name: 'Advanced Micro Devices', nameAr: 'إيه إم دي' },
  { cik: '0000019617', ticker: 'JPM', name: 'JPMorgan Chase', nameAr: 'جي بي مورغان' },
  { cik: '0000070858', ticker: 'BAC', name: 'Bank of America', nameAr: 'بنك أوف أمريكا' },
  { cik: '0000886982', ticker: 'GS', name: 'Goldman Sachs Group', nameAr: 'غولدمان ساكس' },
  { cik: '0001403161', ticker: 'V', name: 'Visa Inc.', nameAr: 'فيزا' },
  { cik: '0001141391', ticker: 'MA', name: 'Mastercard Inc.', nameAr: 'ماستركارد' },
  { cik: '0000034088', ticker: 'XOM', name: 'Exxon Mobil', nameAr: 'إكسون موبيل' },
  { cik: '0001598460', ticker: 'BRK', name: 'Berkshire Hathaway', nameAr: 'بيركشاير هاثاواي' },
];

// ─── Helper: Get enabled sources ──────────────────────────
export function getEnabledSources(): OfficialSource[] {
  return OFFICIAL_SOURCES.filter(s => s.enabled);
}

// ─── Helper: Get sources by category ──────────────────────
export function getSourcesByCategory(category: SourceCategory): OfficialSource[] {
  return OFFICIAL_SOURCES.filter(s => s.category === category && s.enabled);
}

// ─── Helper: Count by category ────────────────────────────
export function getSourceStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const s of OFFICIAL_SOURCES) {
    if (!s.enabled) continue;
    stats[s.category] = (stats[s.category] || 0) + 1;
  }
  stats._total = Object.values(stats).reduce((a, b) => a + b, 0);
  return stats;
}
