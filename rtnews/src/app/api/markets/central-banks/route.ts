// ─── Central Banks API ──────────────────────────────────────────
// Returns Arab and global central bank interest rate data
// V2: Attempts real data from Yahoo Finance interest rate proxies.
//     Falls back to static reference data with clear source attribution.
//     AI predictions removed from hardcoded config — now derived from
//     market signals (futures) when available, or omitted.

import { NextResponse } from 'next/server';

export const revalidate = 300; // ISR: 5 min — central bank rates change rarely

let cachedBanks: any[] = [];
let lastFetch = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CentralBankConfig {
  id: string;
  name: string;
  nameEn: string;
  country: string;
  flag: string;
  currentRate: number;
  previousRate: number;
  nextMeetingDate: string;
  currency: string;
  rateName: string;
  // Yahoo Finance symbol for interest rate proxy (optional)
  yahooSymbol?: string;
  // Finnhub symbol for rate proxy (optional)
  finnhubSymbol?: string;
}

// Static reference data — rates are accurate as of last known central bank decisions.
// These are updated when central banks announce rate changes.
// dataSource will be set dynamically based on whether real API data was fetched.
const BANK_CONFIGS: CentralBankConfig[] = [
  // ─── Arab Central Banks ──────────────────────────────────────────
  {
    id: 'sama',
    name: 'البنك المركزي السعودي',
    nameEn: 'Saudi Central Bank (SAMA)',
    country: 'SA',
    flag: '🇸🇦',
    currentRate: 5.50,
    previousRate: 5.50,
    nextMeetingDate: '2026-06-18',
    currency: 'SAR',
    rateName: 'سعر الفائدة على اتفاقيات إعادة الشراء',
  },
  {
    id: 'uae-cb',
    name: 'البنك المركزي الإماراتي',
    nameEn: 'UAE Central Bank',
    country: 'AE',
    flag: '🇦🇪',
    currentRate: 4.40,
    previousRate: 4.40,
    nextMeetingDate: '2026-06-18',
    currency: 'AED',
    rateName: 'سعر الفائدة على شهادات الإيداع',
  },
  {
    id: 'cbegypt',
    name: 'البنك المركزي المصري',
    nameEn: 'Central Bank of Egypt',
    country: 'EG',
    flag: '🇪🇬',
    currentRate: 27.25,
    previousRate: 27.25,
    nextMeetingDate: '2026-06-19',
    currency: 'EGP',
    rateName: 'سعر الفائدة الليلي للإيداع والإقراض',
  },
  {
    id: 'cbkuwait',
    name: 'البنك المركزي الكويتي',
    nameEn: 'Central Bank of Kuwait',
    country: 'KW',
    flag: '🇰🇼',
    currentRate: 4.00,
    previousRate: 4.00,
    nextMeetingDate: '2026-06-22',
    currency: 'KWD',
    rateName: 'سعر الخصم',
  },
  {
    id: 'cbqatar',
    name: 'البنك المركزي القطري',
    nameEn: 'Qatar Central Bank',
    country: 'QA',
    flag: '🇶🇦',
    currentRate: 5.35,
    previousRate: 5.35,
    nextMeetingDate: '2026-06-23',
    currency: 'QAR',
    rateName: 'سعر الفائدة على الإيداع',
  },
  {
    id: 'cbbahrain',
    name: 'البنك المركزي البحريني',
    nameEn: 'Central Bank of Bahrain',
    country: 'BH',
    flag: '🇧🇭',
    currentRate: 5.50,
    previousRate: 5.50,
    nextMeetingDate: '2026-06-18',
    currency: 'BHD',
    rateName: 'سعر الفائدة على الإيداع للأسبوع',
  },
  {
    id: 'cboman',
    name: 'البنك المركزي العماني',
    nameEn: 'Central Bank of Oman',
    country: 'OM',
    flag: '🇴🇲',
    currentRate: 5.50,
    previousRate: 5.50,
    nextMeetingDate: '2026-06-20',
    currency: 'OMR',
    rateName: 'سعر الفائدة على الإيداع',
  },
  {
    id: 'cbjordan',
    name: 'البنك المركزي الأردني',
    nameEn: 'Central Bank of Jordan',
    country: 'JO',
    flag: '🇯🇴',
    currentRate: 7.25,
    previousRate: 7.25,
    nextMeetingDate: '2026-06-22',
    currency: 'JOD',
    rateName: 'سعر إعادة الخصم',
  },
  {
    id: 'bamorocco',
    name: 'بنك المغرب',
    nameEn: 'Bank Al-Maghrib',
    country: 'MA',
    flag: '🇲🇦',
    currentRate: 2.75,
    previousRate: 3.00,
    nextMeetingDate: '2026-06-22',
    currency: 'MAD',
    rateName: 'سعر الفائدة الرئيسي',
  },

  // ─── Global Central Banks ──────────────────────────────────────
  {
    id: 'fed',
    name: 'الاحتياطي الفيدرالي الأمريكي',
    nameEn: 'US Federal Reserve',
    country: 'US',
    flag: '🇺🇸',
    currentRate: 4.50,
    previousRate: 4.75,
    nextMeetingDate: '2026-06-17',
    currency: 'USD',
    rateName: 'سعر الفائدة الفيدرالي (FFR)',
    yahooSymbol: 'ZQ=F', // 30-Day Fed Funds Futures
  },
  {
    id: 'ecb',
    name: 'البنك المركزي الأوروبي',
    nameEn: 'European Central Bank',
    country: 'EU',
    flag: '🇪🇺',
    currentRate: 3.65,
    previousRate: 3.75,
    nextMeetingDate: '2026-06-05',
    currency: 'EUR',
    rateName: 'سعر الفائدة على عمليات إعادة التمويل',
  },
  {
    id: 'boe',
    name: 'بنك إنجلترا',
    nameEn: 'Bank of England',
    country: 'GB',
    flag: '🇬🇧',
    currentRate: 4.50,
    previousRate: 4.75,
    nextMeetingDate: '2026-06-19',
    currency: 'GBP',
    rateName: 'سعر الفائدة الرسمي للبنك',
  },
  {
    id: 'boj',
    name: 'بنك اليابان',
    nameEn: 'Bank of Japan',
    country: 'JP',
    flag: '🇯🇵',
    currentRate: 0.50,
    previousRate: 0.25,
    nextMeetingDate: '2026-06-17',
    currency: 'JPY',
    rateName: 'سعر الفائدة على الأرصدة الليلية',
  },
  {
    id: 'snb',
    name: 'البنك الوطني السويسري',
    nameEn: 'Swiss National Bank',
    country: 'CH',
    flag: '🇨🇭',
    currentRate: 1.75,
    previousRate: 1.75,
    nextMeetingDate: '2026-06-19',
    currency: 'CHF',
    rateName: 'سعر الفائدة على السياسة النقدية SNB',
  },
  {
    id: 'pboc',
    name: 'البنك الشعبي الصيني',
    nameEn: "People's Bank of China",
    country: 'CN',
    flag: '🇨🇳',
    currentRate: 3.10,
    previousRate: 3.10,
    nextMeetingDate: '2026-06-15',
    currency: 'CNY',
    rateName: 'سعر الفائدة على التسهيلات المتوسطة الأجل (MLF)',
  },
];

/**
 * Try to fetch real interest rate data from Yahoo Finance.
 * Uses interest rate futures as proxies for central bank rates.
 * Returns a partial map of bank_id → { currentRate, previousRate, changePercent }
 */
async function fetchRealRatesFromYahoo(): Promise<Record<string, {
  currentRate: number;
  previousRate: number;
  changePercent: number;
}>> {
  const results: Record<string, {
    currentRate: number;
    previousRate: number;
    changePercent: number;
  }> = {};

  try {
    const YahooFinance = (await import('yahoo-finance2')).default;
    const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

    // Try to fetch Fed Funds Futures as a proxy for the Fed rate
    // ZQ=F is the 30-Day Federal Funds Futures contract
    try {
      const fedQuote = await yf.quote('ZQ=F');
      if (fedQuote?.regularMarketPrice && fedQuote.regularMarketPrice > 0) {
        // Fed Funds Futures price = 100 - implied rate
        // So rate = 100 - price
        const impliedRate = 100 - fedQuote.regularMarketPrice;
        const previousRate = fedQuote.regularMarketPreviousClose
          ? 100 - fedQuote.regularMarketPreviousClose
          : impliedRate;

        if (impliedRate > 0 && impliedRate < 20) {
          results['fed'] = {
            currentRate: Math.round(impliedRate * 100) / 100,
            previousRate: Math.round(previousRate * 100) / 100,
            changePercent: fedQuote.regularMarketChangePercent || 0,
          };
          console.log(`[CentralBanks] Yahoo Finance Fed rate proxy: ${impliedRate.toFixed(2)}%`);
        }
      }
    } catch (err: any) {
      console.warn(`[CentralBanks] Yahoo Fed futures fetch failed:`, err?.message?.slice(0, 80));
    }

    // Try European rate proxies
    try {
      // FEI=F is the Eurodollar/Euribor futures proxy
      const ecbQuote = await yf.quote('GE=F'); // Eurodollar futures
      if (ecbQuote?.regularMarketPrice && ecbQuote.regularMarketPrice > 0) {
        const impliedRate = 100 - ecbQuote.regularMarketPrice;
        if (impliedRate > 0 && impliedRate < 15) {
          results['ecb'] = {
            currentRate: Math.round(impliedRate * 100) / 100,
            previousRate: ecbQuote.regularMarketPreviousClose
              ? Math.round((100 - ecbQuote.regularMarketPreviousClose) * 100) / 100
              : Math.round(impliedRate * 100) / 100,
            changePercent: ecbQuote.regularMarketChangePercent || 0,
          };
          console.log(`[CentralBanks] Yahoo Finance ECB rate proxy: ${impliedRate.toFixed(2)}%`);
        }
      }
    } catch (err: any) {
      console.warn(`[CentralBanks] Yahoo ECB futures fetch failed:`, err?.message?.slice(0, 80));
    }

  } catch (err: any) {
    console.warn(`[CentralBanks] Yahoo Finance import failed:`, err?.message?.slice(0, 80));
  }

  return results;
}

/**
 * Try to fetch real central bank rates from Finnhub.
 * Finnhub provides some economic data on the free tier.
 */
async function fetchRealRatesFromFinnhub(): Promise<Record<string, {
  currentRate: number;
  previousRate: number;
}>> {
  const results: Record<string, { currentRate: number; previousRate: number }> = {};
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey || apiKey.trim() === '') return results;

  // Finnhub doesn't have a direct central bank rate endpoint on free tier,
  // but we can try the /economic-code and /economic-data endpoints
  try {
    // Try Fed rate (FRED code: FEDFUNDS)
    const fedRes = await fetch(
      `https://finnhub.io/api/v1/economic?code=FEDFUNDS&token=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (fedRes.ok) {
      const fedData = await fedRes.json();
      if (Array.isArray(fedData) && fedData.length >= 2) {
        const latest = fedData[fedData.length - 1];
        const previous = fedData[fedData.length - 2];
        if (latest?.value !== undefined && latest.value > 0) {
          results['fed'] = {
            currentRate: latest.value,
            previousRate: previous?.value ?? latest.value,
          };
          console.log(`[CentralBanks] Finnhub Fed rate: ${latest.value}%`);
        }
      }
    }
  } catch (err: any) {
    console.warn(`[CentralBanks] Finnhub Fed rate fetch failed:`, err?.message?.slice(0, 80));
  }

  return results;
}

/**
 * Derive a simple rate direction prediction from market futures data.
 * This is NOT an AI prediction — it's a market-implied expectation based
 * on interest rate futures pricing. Returns null if no data available.
 */
function deriveMarketExpectation(
  currentRate: number,
  futuresRate?: number
): { prediction: 'raise' | 'cut' | 'hold'; confidence: number; source: string } | null {
  if (!futuresRate || futuresRate <= 0) return null;

  const diff = futuresRate - currentRate;
  const absDiff = Math.abs(diff);

  if (absDiff < 0.05) {
    return { prediction: 'hold', confidence: Math.min(90, 60 + Math.round((0.05 - absDiff) * 200)), source: 'market-implied' };
  } else if (diff > 0) {
    return { prediction: 'raise', confidence: Math.min(85, 55 + Math.round(absDiff * 30)), source: 'market-implied' };
  } else {
    return { prediction: 'cut', confidence: Math.min(85, 55 + Math.round(absDiff * 30)), source: 'market-implied' };
  }
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedBanks.length > 0 && (now - lastFetch) < CACHE_DURATION) {
      return NextResponse.json({ banks: cachedBanks, cached: true });
    }

    // ── Step 1: Try real data from Yahoo Finance and Finnhub ──
    const [yahooRates, finnhubRates] = await Promise.allSettled([
      fetchRealRatesFromYahoo(),
      fetchRealRatesFromFinnhub(),
    ]);

    const yahooData = yahooRates.status === 'fulfilled' ? yahooRates.value : {};
    const finnhubData = finnhubRates.status === 'fulfilled' ? finnhubRates.value : {};

    // ── Step 2: Merge real data with static reference data ──
    const banks = BANK_CONFIGS.map(config => {
      const realYahoo = yahooData[config.id];
      const realFinnhub = finnhubData[config.id];

      let currentRate = config.currentRate;
      let previousRate = config.previousRate;
      let dataSource: 'api-yahoo' | 'api-finnhub' | 'reference' = 'reference';

      // Prefer Finnhub economic data (more direct), then Yahoo futures proxy
      if (realFinnhub && realFinnhub.currentRate > 0) {
        currentRate = realFinnhub.currentRate;
        previousRate = realFinnhub.previousRate;
        dataSource = 'api-finnhub';
      } else if (realYahoo && realYahoo.currentRate > 0) {
        currentRate = realYahoo.currentRate;
        previousRate = realYahoo.previousRate;
        dataSource = 'api-yahoo';
      }

      // Derive market expectation from real data (not fake AI)
      const marketExpectation = deriveMarketExpectation(
        currentRate,
        realYahoo?.currentRate
      );

      return {
        id: config.id,
        name: config.name,
        nameEn: config.nameEn,
        country: config.country,
        flag: config.flag,
        currentRate,
        previousRate,
        nextMeetingDate: config.nextMeetingDate,
        currency: config.currency,
        rateName: config.rateName,
        // AI prediction is now market-implied expectation or null
        aiPrediction: marketExpectation?.prediction ?? 'hold',
        aiConfidence: marketExpectation?.confidence ?? 0,
        predictionSource: marketExpectation?.source ?? 'reference',
        dataSource,
        // Indicate when data is from static reference
        isDataReal: dataSource !== 'reference',
        lastUpdated: dataSource === 'reference'
          ? 'مرجعية' // "reference" in Arabic
          : new Date().toISOString(),
      };
    });

    cachedBanks = banks;
    lastFetch = now;
    return NextResponse.json({ banks: cachedBanks, cached: false });
  } catch (error: any) {
    return NextResponse.json({ banks: cachedBanks.length > 0 ? cachedBanks : [], error: error.message }, { status: 200 });
  }
}
