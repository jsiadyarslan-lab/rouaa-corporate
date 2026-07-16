// ─── Regional Markets API ──────────────────────────────────────────
// Returns real-time data for stock market indices based on geographic region
// Supports: ?region=arab (default) | us | europe | turkey | hispanic
// Uses Yahoo Finance (free, no key needed) → Finnhub (fallback) → reference price
// V230: Added Yahoo Finance as primary source
// V356: Added multi-region support for locale-aware market cards

import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 60;

// ── Per-region cache ──
const regionCaches: Record<string, { markets: any[]; lastFetch: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface MarketConfig {
  id: string;
  name: string;
  nameEn: string;
  nameFr: string;
  nameTr: string;
  nameEs: string;
  flag: string;
  country: string;
  finnhubSymbol: string;
  yahooSymbol: string;
  timezone: string;
  openTime: string;
  closeTime: string;
  region: string;
  referencePrice: number;
}

// ═══════════════════════════════════════════════════════════════
//  REGION MARKET CONFIGS — Real indices with Yahoo/Finhhub symbols
// ═══════════════════════════════════════════════════════════════

const ARAB_MARKETS: MarketConfig[] = [
  { id: 'tasi', name: 'تاسي', nameEn: 'Tadawul', nameFr: 'Tadawul', nameTr: 'Tadawul', nameEs: 'Tadawul', flag: '🇸🇦', country: 'السعودية', finnhubSymbol: 'SR:TASI', yahooSymbol: '^TASI.SR', timezone: 'Asia/Riyadh', openTime: '10:00', closeTime: '15:00', region: 'الخليج', referencePrice: 12500 },
  { id: 'dfm', name: 'دبي المالي', nameEn: 'DFM', nameFr: 'DFM', nameTr: 'DFM', nameEs: 'DFM', flag: '🇦🇪', country: 'الإمارات', finnhubSymbol: 'DU:DFMGI', yahooSymbol: 'DFMGI.AE', timezone: 'Asia/Dubai', openTime: '10:00', closeTime: '14:00', region: 'الخليج', referencePrice: 4200 },
  { id: 'qe', name: 'قطر', nameEn: 'QE Index', nameFr: 'QE Index', nameTr: 'QE Index', nameEs: 'QE Index', flag: '🇶🇦', country: 'قطر', finnhubSymbol: 'QA:QE', yahooSymbol: 'QE.QA', timezone: 'Asia/Qatar', openTime: '09:30', closeTime: '13:00', region: 'الخليج', referencePrice: 10500 },
  { id: 'bse', name: 'البحرين', nameEn: 'BSE', nameFr: 'BSE', nameTr: 'BSE', nameEs: 'BSE', flag: '🇧🇭', country: 'البحرين', finnhubSymbol: 'BA:BSE', yahooSymbol: 'BSE.BH', timezone: 'Asia/Bahrain', openTime: '09:30', closeTime: '13:00', region: 'الخليج', referencePrice: 1950 },
  { id: 'egx30', name: 'EGX 30', nameEn: 'EGX 30', nameFr: 'EGX 30', nameTr: 'EGX 30', nameEs: 'EGX 30', flag: '🇪🇬', country: 'مصر', finnhubSymbol: 'EG:EGX30', yahooSymbol: 'EGX30.CA', timezone: 'Africa/Cairo', openTime: '10:00', closeTime: '14:30', region: 'مصر', referencePrice: 28000 },
  { id: 'bk', name: 'الكويت', nameEn: 'Boursa Kuwait', nameFr: 'Bourse du Koweït', nameTr: 'Kuveyt Borsası', nameEs: 'Bolsa de Kuwait', flag: '🇰🇼', country: 'الكويت', finnhubSymbol: 'KW:KWSE', yahooSymbol: 'BOURSA.KW', timezone: 'Asia/Kuwait', openTime: '09:00', closeTime: '13:00', region: 'الخليج', referencePrice: 7500 },
  { id: 'msm', name: 'مسقط', nameEn: 'MSM 30', nameFr: 'MSM 30', nameTr: 'MSM 30', nameEs: 'MSM 30', flag: '🇴🇲', country: 'عمان', finnhubSymbol: 'OM:MSM', yahooSymbol: '^MSM', timezone: 'Asia/Muscat', openTime: '10:00', closeTime: '14:00', region: 'الخليج', referencePrice: 4500 },
];

const US_MARKETS: MarketConfig[] = [
  { id: 'spx', name: 'إس آند بي 500', nameEn: 'S&P 500', nameFr: 'S&P 500', nameTr: 'S&P 500', nameEs: 'S&P 500', flag: '🇺🇸', country: 'USA', finnhubSymbol: '', yahooSymbol: '^GSPC', timezone: 'America/New_York', openTime: '09:30', closeTime: '16:00', region: 'US', referencePrice: 5300 },
  { id: 'ndx', name: 'ناسداك', nameEn: 'NASDAQ', nameFr: 'NASDAQ', nameTr: 'NASDAQ', nameEs: 'NASDAQ', flag: '🇺🇸', country: 'USA', finnhubSymbol: '', yahooSymbol: '^IXIC', timezone: 'America/New_York', openTime: '09:30', closeTime: '16:00', region: 'US', referencePrice: 16700 },
  { id: 'dji', name: 'داو جونز', nameEn: 'Dow Jones', nameFr: 'Dow Jones', nameTr: 'Dow Jones', nameEs: 'Dow Jones', flag: '🇺🇸', country: 'USA', finnhubSymbol: '', yahooSymbol: '^DJI', timezone: 'America/New_York', openTime: '09:30', closeTime: '16:00', region: 'US', referencePrice: 39000 },
  { id: 'rut', name: 'راسل 2000', nameEn: 'Russell 2000', nameFr: 'Russell 2000', nameTr: 'Russell 2000', nameEs: 'Russell 2000', flag: '🇺🇸', country: 'USA', finnhubSymbol: '', yahooSymbol: '^RUT', timezone: 'America/New_York', openTime: '09:30', closeTime: '16:00', region: 'US', referencePrice: 2050 },
  { id: 'vix', name: 'مؤشر الخوف', nameEn: 'VIX', nameFr: 'VIX', nameTr: 'VIX', nameEs: 'VIX', flag: '🇺🇸', country: 'USA', finnhubSymbol: '', yahooSymbol: '^VIX', timezone: 'America/New_York', openTime: '09:30', closeTime: '16:00', region: 'US', referencePrice: 15 },
  { id: 'nya', name: 'بورصة نيويورك', nameEn: 'NYSE Composite', nameFr: 'NYSE Composite', nameTr: 'NYSE Kompozit', nameEs: 'NYSE Compuesto', flag: '🇺🇸', country: 'USA', finnhubSymbol: '', yahooSymbol: '^NYA', timezone: 'America/New_York', openTime: '09:30', closeTime: '16:00', region: 'US', referencePrice: 17200 },
  { id: 'w5000', name: 'ويلشاير 5000', nameEn: 'Wilshire 5000', nameFr: 'Wilshire 5000', nameTr: 'Wilshire 5000', nameEs: 'Wilshire 5000', flag: '🇺🇸', country: 'USA', finnhubSymbol: '', yahooSymbol: '^W5000', timezone: 'America/New_York', openTime: '09:30', closeTime: '16:00', region: 'US', referencePrice: 47000 },
];

const EUROPE_MARKETS: MarketConfig[] = [
  { id: 'cac40', name: 'كاك 40', nameEn: 'CAC 40', nameFr: 'CAC 40', nameTr: 'CAC 40', nameEs: 'CAC 40', flag: '🇫🇷', country: 'فرنسا', finnhubSymbol: '', yahooSymbol: '^FCHI', timezone: 'Europe/Paris', openTime: '09:00', closeTime: '17:30', region: 'Europe', referencePrice: 7600 },
  { id: 'dax', name: 'داكس', nameEn: 'DAX', nameFr: 'DAX', nameTr: 'DAX', nameEs: 'DAX', flag: '🇩🇪', country: 'ألمانيا', finnhubSymbol: '', yahooSymbol: '^GDAXI', timezone: 'Europe/Berlin', openTime: '09:00', closeTime: '17:30', region: 'Europe', referencePrice: 18300 },
  { id: 'ftse100', name: 'فتسي 100', nameEn: 'FTSE 100', nameFr: 'FTSE 100', nameTr: 'FTSE 100', nameEs: 'FTSE 100', flag: '🇬🇧', country: 'بريطانيا', finnhubSymbol: '', yahooSymbol: '^FTSE', timezone: 'Europe/London', openTime: '08:00', closeTime: '16:30', region: 'Europe', referencePrice: 7700 },
  { id: 'smi', name: 'إس إم آي', nameEn: 'SMI', nameFr: 'SMI', nameTr: 'SMI', nameEs: 'SMI', flag: '🇨🇭', country: 'سويسرا', finnhubSymbol: '', yahooSymbol: '^SSMI', timezone: 'Europe/Zurich', openTime: '09:00', closeTime: '17:30', region: 'Europe', referencePrice: 11200 },
  { id: 'aex', name: 'إيه إي إكس', nameEn: 'AEX', nameFr: 'AEX', nameTr: 'AEX', nameEs: 'AEX', flag: '🇳🇱', country: 'هولندا', finnhubSymbol: '', yahooSymbol: '^AEX', timezone: 'Europe/Amsterdam', openTime: '09:00', closeTime: '17:30', region: 'Europe', referencePrice: 860 },
  { id: 'stoxx50', name: 'يورو ستوكس 50', nameEn: 'Euro Stoxx 50', nameFr: 'Euro Stoxx 50', nameTr: 'Euro Stoxx 50', nameEs: 'Euro Stoxx 50', flag: '🇪🇺', country: 'أوروبا', finnhubSymbol: '', yahooSymbol: '^STOXX50E', timezone: 'Europe/Berlin', openTime: '09:00', closeTime: '17:30', region: 'Europe', referencePrice: 4900 },
  { id: 'ibex35e', name: 'إيبكس 35', nameEn: 'IBEX 35', nameFr: 'IBEX 35', nameTr: 'IBEX 35', nameEs: 'IBEX 35', flag: '🇪🇸', country: 'إسبانيا', finnhubSymbol: '', yahooSymbol: '^IBEX', timezone: 'Europe/Madrid', openTime: '09:00', closeTime: '17:30', region: 'Europe', referencePrice: 10800 },
];

const TURKEY_MARKETS: MarketConfig[] = [
  { id: 'xu100', name: 'بيست 100', nameEn: 'BIST 100', nameFr: 'BIST 100', nameTr: 'BIST 100', nameEs: 'BIST 100', flag: '🇹🇷', country: 'تركيا', finnhubSymbol: '', yahooSymbol: 'XU100.IS', timezone: 'Europe/Istanbul', openTime: '10:00', closeTime: '18:00', region: 'Turkey', referencePrice: 8200 },
  { id: 'xu30', name: 'بيست 30', nameEn: 'BIST 30', nameFr: 'BIST 30', nameTr: 'BIST 30', nameEs: 'BIST 30', flag: '🇹🇷', country: 'تركيا', finnhubSymbol: '', yahooSymbol: 'XU030.IS', timezone: 'Europe/Istanbul', openTime: '10:00', closeTime: '18:00', region: 'Turkey', referencePrice: 9800 },
  { id: 'xbank', name: 'بيست بنوك', nameEn: 'BIST Banks', nameFr: 'BIST Banques', nameTr: 'BIST Bankalar', nameEs: 'BIST Bancos', flag: '🇹🇷', country: 'تركيا', finnhubSymbol: '', yahooSymbol: 'XBANK.IS', timezone: 'Europe/Istanbul', openTime: '10:00', closeTime: '18:00', region: 'Turkey', referencePrice: 5500 },
  { id: 'xusin', name: 'بيست صناعة', nameEn: 'BIST Industry', nameFr: 'BIST Industrie', nameTr: 'BIST Sanayi', nameEs: 'BIST Industria', flag: '🇹🇷', country: 'تركيا', finnhubSymbol: '', yahooSymbol: 'XUSIN.IS', timezone: 'Europe/Istanbul', openTime: '10:00', closeTime: '18:00', region: 'Turkey', referencePrice: 12000 },
  { id: 'xutech', name: 'بيست تكنولوجيا', nameEn: 'BIST Technology', nameFr: 'BIST Technologie', nameTr: 'BIST Teknoloji', nameEs: 'BIST Tecnología', flag: '🇹🇷', country: 'تركيا', finnhubSymbol: '', yahooSymbol: 'XUTEK.IS', timezone: 'Europe/Istanbul', openTime: '10:00', closeTime: '18:00', region: 'Turkey', referencePrice: 8200 },
  { id: 'xuhali', name: 'بيست جملة', nameEn: 'BIST Wholesale', nameFr: 'BIST Gros', nameTr: 'BIST Toptan', nameEs: 'BIST Mayorista', flag: '🇹🇷', country: 'تركيا', finnhubSymbol: '', yahooSymbol: 'XUHALI.IS', timezone: 'Europe/Istanbul', openTime: '10:00', closeTime: '18:00', region: 'Turkey', referencePrice: 4100 },
];

const HISPANIC_MARKETS: MarketConfig[] = [
  { id: 'ibex35', name: 'إيبكس 35', nameEn: 'IBEX 35', nameFr: 'IBEX 35', nameTr: 'IBEX 35', nameEs: 'IBEX 35', flag: '🇪🇸', country: 'إسبانيا', finnhubSymbol: '', yahooSymbol: '^IBEX', timezone: 'Europe/Madrid', openTime: '09:00', closeTime: '17:30', region: 'Hispanic', referencePrice: 10800 },
  { id: 'merval', name: 'ميرفال', nameEn: 'S&P Merval', nameFr: 'S&P Merval', nameTr: 'S&P Merval', nameEs: 'S&P Merval', flag: '🇦🇷', country: 'الأرجنتين', finnhubSymbol: '', yahooSymbol: '^MERV', timezone: 'America/Argentina/Buenos_Aires', openTime: '10:00', closeTime: '17:00', region: 'Hispanic', referencePrice: 1500000 },
  { id: 'bovespa', name: 'بوفيسبا', nameEn: 'Bovespa', nameFr: 'Bovespa', nameTr: 'Bovespa', nameEs: 'Bovespa', flag: '🇧🇷', country: 'البرازيل', finnhubSymbol: '', yahooSymbol: '^BVSP', timezone: 'America/Sao_Paulo', openTime: '10:00', closeTime: '17:00', region: 'Hispanic', referencePrice: 122000 },
  { id: 'ipc', name: 'آي بي سي', nameEn: 'IPC Mexico', nameFr: 'IPC Mexique', nameTr: 'IPC Meksika', nameEs: 'IPC México', flag: '🇲🇽', country: 'المكسيك', finnhubSymbol: '', yahooSymbol: '^MXX', timezone: 'America/Mexico_City', openTime: '08:30', closeTime: '15:00', region: 'Hispanic', referencePrice: 52000 },
  { id: 'ipsa', name: 'إيبسا', nameEn: 'IPSA', nameFr: 'IPSA', nameTr: 'IPSA', nameEs: 'IPSA', flag: '🇨🇱', country: 'تشيلي', finnhubSymbol: '', yahooSymbol: '^IPSA', timezone: 'America/Santiago', openTime: '09:30', closeTime: '16:00', region: 'Hispanic', referencePrice: 5700 },
  { id: 'colcap', name: 'كولكاب', nameEn: 'COLCAP', nameFr: 'COLCAP', nameTr: 'COLCAP', nameEs: 'COLCAP', flag: '🇨🇴', country: 'كولومبيا', finnhubSymbol: '', yahooSymbol: '^COLCAP', timezone: 'America/Bogota', openTime: '09:00', closeTime: '15:00', region: 'Hispanic', referencePrice: 1400 },
];

const REGION_CONFIGS: Record<string, MarketConfig[]> = {
  arab: ARAB_MARKETS,
  us: US_MARKETS,
  europe: EUROPE_MARKETS,
  turkey: TURKEY_MARKETS,
  hispanic: HISPANIC_MARKETS,
};

// Locale → default region mapping
const LOCALE_REGION_MAP: Record<string, string> = {
  ar: 'arab',
  en: 'us',
  fr: 'europe',
  tr: 'turkey',
  es: 'hispanic',
};

// ── Yahoo Finance (FREE, no API key needed) ──────────────────
async function fetchYahooQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    if (!symbol) return null;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d&includePrePost=false`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || !meta.regularMarketPrice || meta.regularMarketPrice <= 0) return null;
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose || price;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
    return { price, change, changePercent };
  } catch { return null; }
}

// ── Finnhub (requires API key) ───────────────────────────────
async function fetchFinnhubQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY || process.env.FINNHUB_KEY;
    if (!apiKey || apiKey.trim() === '' || !symbol) return null;
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.c && data.c > 0) return { price: data.c, change: data.d || 0, changePercent: data.dp || 0 };
    return null;
  } catch { return null; }
}

// ── Determine display name based on locale ──
function getLocalizedName(config: MarketConfig, locale: string): string {
  switch (locale) {
    case 'ar': return config.name;
    case 'fr': return config.nameFr || config.nameEn;
    case 'tr': return config.nameTr || config.nameEn;
    case 'es': return config.nameEs || config.nameEn;
    default: return config.nameEn;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl || new URL(request.url);
    const region = searchParams.get('region') || 'arab';
    const locale = searchParams.get('locale') || 'ar';

    const configs = REGION_CONFIGS[region] || REGION_CONFIGS.arab;

    // Check per-region cache
    const cacheKey = `${region}:${locale}`;
    const cache = regionCaches[cacheKey];
    const now = Date.now();
    if (cache && cache.markets.length > 0 && (now - cache.lastFetch) < CACHE_DURATION) {
      return NextResponse.json({ markets: cache.markets, cached: true, region });
    }

    async function fetchMarketData(config: MarketConfig) {
      // Try Yahoo Finance first (free, covers indices better)
      let quote = await fetchYahooQuote(config.yahooSymbol);

      // Fallback to Finnhub
      if (!quote || !quote.price) {
        quote = await fetchFinnhubQuote(config.finnhubSymbol);
      }

      // If still no data, use reference price with "reference" source
      if (!quote || !quote.price || quote.price <= 0) {
        return {
          id: config.id,
          name: getLocalizedName(config, locale),
          nameEn: config.nameEn,
          flag: config.flag,
          country: config.country,
          region: config.region,
          value: config.referencePrice,
          change: 0,
          sparkline: [],
          timezone: config.timezone,
          openTime: config.openTime,
          closeTime: config.closeTime,
          source: 'reference',
        };
      }

      // Generate sparkline from deterministic trend based on change percent
      const startPrice = quote.price / (1 + quote.changePercent / 100);
      const sparkline: number[] = [];
      const numPoints = 12;
      for (let i = 0; i <= numPoints; i++) {
        const progress = i / numPoints;
        const noise = Math.sin(progress * 31.4 + quote.price * 0.001) * quote.price * 0.001;
        sparkline.push(startPrice + (quote.price - startPrice) * progress + noise);
      }

      return {
        id: config.id,
        name: getLocalizedName(config, locale),
        nameEn: config.nameEn,
        flag: config.flag,
        country: config.country,
        region: config.region,
        value: quote.price,
        change: quote.changePercent,
        sparkline,
        timezone: config.timezone,
        openTime: config.openTime,
        closeTime: config.closeTime,
        source: 'live',
      };
    }

    const results = await Promise.allSettled(configs.map(config => fetchMarketData(config)));
    const markets: any[] = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);

    regionCaches[cacheKey] = { markets, lastFetch: now };
    return NextResponse.json({ markets, cached: false, region });
  } catch (error: any) {
    const cacheKey = 'arab:ar';
    const cache = regionCaches[cacheKey];
    if (cache && cache.markets.length > 0) {
      return NextResponse.json({ markets: cache.markets, cached: true, error: 'using_stale_cache' });
    }
    return NextResponse.json({ markets: [], error: error.message }, { status: 500 });
  }
}
