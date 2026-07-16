// ─── Economic Calendar API (V3 — Real Data via Free Sources) ──────
// Fetches real economic calendar events from free public sources.
// Priority: ForexFactory (FREE, no key) → FMP → Finnhub → DB → Generated fallback
// ForexFactory data via nfs.faireconomy.media provides ~80 real events/week
// without any API key or registration required.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const revalidate = 300; // ISR: 5 min — calendar events change infrequently

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let cachedEvents: any[] = [];
let lastFetch = 0;

// ─── Locale → Region Country Mapping ─────────────────────────
// Each locale prioritizes events from its geographic region
const LOCALE_COUNTRIES: Record<string, string[]> = {
  ar: ['SA', 'AE', 'EG', 'QA', 'BH', 'KW', 'OM', 'JO', 'LB', 'IQ'],  // Middle East
  en: ['US', 'GB', 'EU', 'DE', 'FR', 'JP', 'CN', 'AU', 'CA'],         // Global/US-centric
  fr: ['FR', 'DE', 'EU', 'IT', 'ES', 'BE', 'NL', 'CH'],                // Eurozone
  tr: ['TR', 'EU', 'DE', 'US', 'GB', 'RU'],                             // Turkey + major
  es: ['ES', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'EU', 'US'],          // Spain + LatAm
};

// ─── Currency → Country Code Mapping ────────────────────────
// ForexFactory uses currency codes (USD, EUR, etc.)
// We need to map them to country codes for locale filtering
const CURRENCY_TO_COUNTRY: Record<string, string[]> = {
  USD: ['US'],
  EUR: ['EU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'GR', 'IE', 'FI'],
  GBP: ['GB'],
  JPY: ['JP'],
  AUD: ['AU'],
  CAD: ['CA'],
  CHF: ['CH'],
  NZD: ['NZ'],
  CNY: ['CN'],
  TRY: ['TR'],
  SEK: ['SE'],
  NOK: ['NO'],
  DKK: ['DK'],
  SGD: ['SG'],
  HKD: ['HK'],
  KRW: ['KR'],
  INR: ['IN'],
  MXN: ['MX'],
  BRL: ['BR'],
  ARS: ['AR'],
  CLP: ['CL'],
  COP: ['CO'],
  PEN: ['PE'],
  SAR: ['SA'],
  AED: ['AE'],
  QAR: ['QA'],
  EGP: ['EG'],
};

// ─── Arabic Event Name Translations ─────────────────────────
// Comprehensive translations for ForexFactory event names
const EVENT_NAME_AR: Record<string, string> = {
  // ─── Interest Rate Decisions ───
  'Federal Reserve Interest Rate Decision': 'قرار الفائدة الفيدرالي',
  'Fed Interest Rate Decision': 'قرار الفائدة الفيدرالي',
  'Interest Rate Decision': 'قرار سعر الفائدة',
  'Overnight Rate': 'سعر الفائدة الليلي',
  'Main Refinancing Rate': 'سعر إعادة التمويل الرئيسي',
  'Monetary Policy Statement': 'بيان السياسة النقدية',
  'BOC Rate Statement': 'بيان بنك كندا',
  'BOC Press Conference': 'مؤتمر بنك كندا الصحفي',
  'ECB Interest Rate Decision': 'قرار الفائدة الأوروبي',
  'BOE Rate Decision': 'قرار بنك إنجلترا',
  'Saudi Central Bank Rate Decision': 'قرار معدل ساما',
  'CBRT Interest Rate Decision': 'قرار البنك المركزي التركي',
  'Banxico Rate Decision': 'قرار بنك المكسيك المركزي',
  'Brazil Selic Rate Decision': 'قرار سيليك البرازيلي',
  'Japan BOJ Rate Decision': 'قرار بنك اليابان',
  'BOJ Interest Rate Decision': 'قرار بنك اليابان',
  'RBA Rate Statement': 'بيان البنك الاحتياطي الأسترالي',
  'RBNZ Rate Statement': 'بيان البنك الاحتياطي النيوزيلندي',
  'SNB Interest Rate Decision': 'قرار البنك الوطني السويسري',
  'FOMC Member Speaks': 'عضو اللجنة الفيدرالية يتحدث',
  'FOMC Member Barr Speaks': 'عضو اللجنة الفيدرالية بار يتحدث',
  'Fed Chair Speech': 'كلمة رئيس الفيدرالي',

  // ─── CPI / Inflation ───
  'CPI': 'مؤشر أسعار المستهلكين',
  'CPI Year-over-Year': 'مؤشر أسعار المستهلكين السنوي',
  'CPI Yearly': 'مؤشر أسعار المستهلكين السنوي',
  'CPI y/y': 'مؤشر أسعار المستهلكين السنوي',
  'CPI Month-over-Month': 'مؤشر أسعار المستهلكين الشهري',
  'CPI m/m': 'مؤشر أسعار المستهلكين الشهري',
  'Core CPI m/m': 'مؤشر أسعار المستهلكين الأساسي الشهري',
  'Core CPI y/y': 'مؤشر أسعار المستهلكين الأساسي السنوي',
  'Eurozone CPI YoY': 'مؤشر أسعار المستهلكين الأوروبي السنوي',
  'UK CPI YoY': 'مؤشر أسعار المستهلكين البريطاني السنوي',
  'Spain CPI YoY': 'مؤشر أسعار المستهلكين الإسباني السنوي',
  'Turkey CPI YoY': 'مؤشر أسعار المستهلكين التركي السنوي',
  'Inflation Rate': 'معدل التضخم',
  'Prelim UoM Inflation Expectations': 'توقعات التضخم الأولية - جامعة ميشيغان',

  // ─── PPI ───
  'PPI m/m': 'مؤشر أسعار المنتجين الشهري',
  'PPI y/y': 'مؤشر أسعار المنتجين السنوي',
  'Core PPI m/m': 'مؤشر أسعار المنتجين الأساسي الشهري',

  // ─── Employment ───
  'Non-Farm Payrolls': 'وظائف غير الزراعة',
  'Employment Change': 'تغير التوظيف',
  'Unemployment Claims': 'طلبات البطالة',
  'Unemployment Rate': 'معدل البطالة',
  'Turkey Unemployment Rate': 'معدل البطالة التركي',
  'ADP Employment Change': 'تغير التوظيف ADP',
  'ADP Weekly Employment Change': 'التغيير الأسبوعي لتوظيف ADP',
  'Participation Rate': 'معدل المشاركة',

  // ─── GDP ───
  'GDP': 'الناتج المحلي الإجمالي',
  'GDP Growth Rate': 'معدل نمو الناتج المحلي',
  'GDP Growth Rate QoQ': 'معدل نمو الناتج المحلي ربع سنوي',
  'GDP q/q': 'الناتج المحلي ربع سنوي',
  'GDP y/y': 'الناتج المحلي السنوي',
  'Final GDP q/q': 'الناتج المحلي النهائي ربع سنوي',
  'Final GDP Price Index y/y': 'مؤشر سعر الناتج المحلي النهائي السنوي',
  'French GDP QoQ': 'الناتج المحلي الفرنسي ربع سنوي',
  'Mexico GDP QoQ': 'الناتج المحلي المكسيكي ربع سنوي',
  'UAE Non-Oil GDP Growth': 'نمو الناتج المحلي غير النفطي الإماراتي',

  // ─── PMI ───
  'PMI': 'مؤشر مديري المشتريات',
  'PMI Manufacturing': 'مؤشر مديري المشتريات الصناعي',
  'Manufacturing PMI': 'مؤشر مديري المشتريات الصناعي',
  'Services PMI': 'مؤشر مديري المشتريات الخدمي',
  'China PMI Manufacturing': 'مؤشر مديري المشتريات الصيني الصناعي',
  'Composite PMI': 'مؤشر مديري المشتريات المركب',

  // ─── Retail / Sales ───
  'Retail Sales': 'المبيعات التجزئة',
  'Retail Sales MoM': 'المبيعات التجزئة الشهرية',
  'Retail Sales m/m': 'المبيعات التجزئة الشهرية',
  'BRC Retail Sales Monitor y/y': 'مراقب مبيعات التجزئة البريطاني السنوي',
  'Existing Home Sales': 'مبيعات المنازل القائمة',

  // ─── Oil / Energy ───
  'Crude Oil Inventories': 'مخزونات النفط الخام',
  'OPEC+ Production Meeting': 'اجتماع أوبك+ للإنتاج',
  'OPEC Meetings': 'اجتماعات أوبك',
  'OPEC-JMMC Meetings': 'اجتماعات أوبك-اللجنة المشتركة',
  'Natural Gas Storage': 'مخزونات الغاز الطبيعي',
  'API Weekly Statistical Bulletin': 'النشور الإحصائي الأسبوعي لمعهد البترول',

  // ─── Trade / Balance ───
  'Trade Balance': 'الميزان التجاري',
  'Current Account': 'الحساب الجاري',

  // ─── Business / Consumer Confidence ───
  'Consumer Confidence': 'ثقة المستهلك',
  'Business Confidence': 'ثقة الأعمال',
  'German ZEW Economic Sentiment': 'مؤشر ZEW الألماني للثقة الاقتصادية',
  'German Ifo Business Climate': 'مؤشر إيفو الألماني لمناخ الأعمال',
  'Sentix Investor Confidence': 'ثقة المستثمرين - سينتيكس',
  'SECO Consumer Climate': 'مناخ المستهلك السويسري',
  'Prelim UoM Consumer Sentiment': 'ثقة المستهلك الأولية - جامعة ميشيغان',
  'Economy Watchers Sentiment': 'ثقة المراقبين الاقتصاديين',
  'NFIB Small Business Index': 'مؤشر الأعمال الصغيرة',
  'Westpac Consumer Sentiment': 'ثقة المستهلك - ويستباك',

  // ─── Industrial / Production ───
  'Industrial Production': 'الإنتاج الصناعي',
  'Building Permits': 'تصاريح البناء',
  'Manufacturing Sales q/q': 'مبيعات الصناعة ربع سنوية',
  'German Factory Orders m/m': 'طلبات المصانع الألمانية الشهرية',
  'Final Wholesale Inventories m/m': 'المخزونات الجملية النهائية الشهرية',

  // ─── Money / Banking ───
  'M2 Money Stock y/y': 'الكتلة النقدية M2 السنوية',
  'Bank Lending y/y': 'الإقراض المصرفي السنوي',
  'Federal Budget Balance': 'رصيد الميزانية الفيدرالية',
  '10-y Bond Auction': 'مزاد السندات لعشر سنوات',
  '30-y Bond Auction': 'مزاد السندات لثلاثين سنة',

  // ─── Other ───
  'Tadawul Trading Volume': 'حجم تداولات تداول',
  'DFM Index Performance': 'أداء مؤشر سوق دبي المالي',
  'Egypt Central Bank Rate': 'قرار البنك المركزي المصري',
  'Bank Holiday': 'عطلة مصرفية',
  'Manufacturing Production m/m': 'الإنتاج الصناعي الشهري',
  'Construction PMI': 'مؤشر مديري المشتريات للبناء',
};

// ─── Country Flag Emoji Map ─────────────────────────────────
const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', GB: '🇬🇧', EU: '🇪🇺', DE: '🇩🇪', FR: '🇫🇷',
  IT: '🇮🇹', ES: '🇪🇸', JP: '🇯🇵', CN: '🇨🇳', AU: '🇦🇺',
  CA: '🇨🇦', CH: '🇨🇭', NL: '🇳🇱', BE: '🇧🇪', SA: '🇸🇦',
  AE: '🇦🇪', EG: '🇪🇬', QA: '🇶🇦', BH: '🇧🇭', KW: '🇰🇼',
  OM: '🇴🇲', JO: '🇯🇴', LB: '🇱🇧', IQ: '🇮🇶', TR: '🇹🇷',
  RU: '🇷🇺', MX: '🇲🇽', BR: '🇧🇷', AR: '🇦🇷', CL: '🇨🇱',
  CO: '🇨🇴', PE: '🇵🇪', IN: '🇮🇳', KR: '🇰🇷', SE: '🇸🇪',
  NO: '🇳🇴', DK: '🇩🇰', NZ: '🇳🇿', SG: '🇸🇬', HK: '🇭🇰',
  AT: '🇦🇹', PT: '🇵🇹', GR: '🇬🇷', IE: '🇮🇪', FI: '🇫🇮',
  OPEC: '🛢️', ALL: '🌍',
};

function getCountryFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '🌍';
}

function getEventNameAr(eventName: string): string {
  // Direct match first
  if (EVENT_NAME_AR[eventName]) return EVENT_NAME_AR[eventName];
  // Partial match (check if any key is contained in the event name)
  for (const [key, val] of Object.entries(EVENT_NAME_AR)) {
    if (eventName.toLowerCase().includes(key.toLowerCase())) return val;
  }
  // Keyword-based fallback for common terms
  const lower = eventName.toLowerCase();
  if (lower.includes('rate decision') || lower.includes('interest rate')) return 'قرار سعر الفائدة';
  if (lower.includes('cpi') || lower.includes('consumer price')) return 'مؤشر أسعار المستهلكين';
  if (lower.includes('ppi') || lower.includes('producer price')) return 'مؤشر أسعار المنتجين';
  if (lower.includes('gdp') || lower.includes('gross domestic')) return 'الناتج المحلي الإجمالي';
  if (lower.includes('pmi') || lower.includes('purchasing manager')) return 'مؤشر مديري المشتريات';
  if (lower.includes('employment') || lower.includes('payroll') || lower.includes('jobs')) return 'بيانات التوظيف';
  if (lower.includes('unemployment')) return 'معدل البطالة';
  if (lower.includes('retail sales')) return 'المبيعات التجزئة';
  if (lower.includes('trade balance')) return 'الميزان التجاري';
  if (lower.includes('manufacturing')) return 'القطاع الصناعي';
  if (lower.includes('consumer sentiment') || lower.includes('consumer confidence')) return 'ثقة المستهلك';
  if (lower.includes('business confidence') || lower.includes('business climate')) return 'ثقة الأعمال';
  if (lower.includes('oil') || lower.includes('crude') || lower.includes('inventories')) return 'بيانات النفط';
  if (lower.includes('bond') || lower.includes('auction')) return 'مزاد السندات';
  if (lower.includes('speech') || lower.includes('speaks') || lower.includes('statement')) return 'بيان سياسي نقدي';
  if (lower.includes('opec')) return 'اجتماع أوبك';
  if (lower.includes('inflation')) return 'بيانات التضخم';
  return eventName; // Return English name if no match found
}

function getAffectedAssets(eventName: string): { symbol: string; direction: string }[] {
  const name = eventName.toLowerCase();
  const assets: { symbol: string; direction: string }[] = [];
  if (name.includes('rate') || name.includes('fed') || name.includes('fomc') || name.includes('ecb') || name.includes('boe') || name.includes('cbrt') || name.includes('sama') || name.includes('banxico') || name.includes('selic') || name.includes('boc') || name.includes('rbn') || name.includes('rba') || name.includes('snb') || name.includes('refinancing')) {
    assets.push({ symbol: 'EUR/USD', direction: 'down' }, { symbol: 'XAU', direction: 'up' });
  } else if (name.includes('cpi') || name.includes('inflation') || name.includes('ppi')) {
    assets.push({ symbol: 'DXY', direction: 'up' }, { symbol: 'XAU', direction: 'down' });
  } else if (name.includes('nfp') || name.includes('employment') || name.includes('payroll') || name.includes('unemployment') || name.includes('jobs')) {
    assets.push({ symbol: 'EUR/USD', direction: 'down' }, { symbol: 'SPX', direction: 'up' });
  } else if (name.includes('oil') || name.includes('crude') || name.includes('opec') || name.includes('gas')) {
    assets.push({ symbol: 'WTI', direction: 'up' });
  } else if (name.includes('gdp')) {
    assets.push({ symbol: 'SPX', direction: 'up' });
  } else if (name.includes('pmi')) {
    assets.push({ symbol: 'DXY', direction: 'up' });
  } else if (name.includes('retail')) {
    assets.push({ symbol: 'SPX', direction: 'up' });
  } else {
    assets.push({ symbol: 'DXY', direction: 'neutral' });
  }
  return assets;
}

// ─── Currency → Primary Country Code ────────────────────────
function currencyToCountryCode(currency: string): string {
  const map: Record<string, string> = {
    USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', AUD: 'AU',
    CAD: 'CA', CHF: 'CH', NZD: 'NZ', CNY: 'CN', TRY: 'TR',
    SEK: 'SE', NOK: 'NO', DKK: 'DK', SGD: 'SG', HKD: 'HK',
    KRW: 'KR', INR: 'IN', MXN: 'MX', BRL: 'BR', ARS: 'AR',
    CLP: 'CL', COP: 'CO', PEN: 'PE', SAR: 'SA', AED: 'AE',
    QAR: 'QA', EGP: 'EG',
  };
  return map[currency] || currency;
}

// ═══════════════════════════════════════════════════════════════
// ─── PRIMARY: ForexFactory via Faireconomy (FREE — no key!) ──
// ═══════════════════════════════════════════════════════════════
// This is the PRIMARY data source. It provides ~80 real economic
// events per week from ForexFactory's calendar — no API key needed.
// Endpoint: https://nfs.faireconomy.media/ff_calendar_thisweek.json
async function fetchForexFactoryCalendar(): Promise<any[]> {
  try {
    const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 0 },
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      console.warn(`[Calendar API] ForexFactory calendar error: ${res.status}`);
      return [];
    }

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) {
      console.warn('[Calendar API] ForexFactory calendar returned empty');
      return [];
    }

    // Transform ForexFactory events to our format
    const events = json
      .filter((e: any) => e.title && e.date) // Must have title and date
      .map((e: any, i: number) => {
        const eventName = e.title || 'Economic Event';
        const currency = (e.country || 'USD').toUpperCase();
        const countryCode = currencyToCountryCode(currency);
        const impactStr = (e.impact || '').toLowerCase();
        // Map impact: High → 3, Medium → 2, Low/Holiday → 1
        const impactLevel = impactStr === 'high' ? 3 : impactStr === 'medium' ? 2 : 1;
        const eventDate = e.date ? new Date(e.date) : new Date();
        // Skip past events
        const now = new Date();
        // Include events from 6 hours ago (some might have just been released)
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

        return {
          id: `ff-${i}-${Date.now()}`,
          event: eventName,
          eventAr: getEventNameAr(eventName),
          country: getCountryFlag(countryCode === 'ALL' ? 'OPEC' : countryCode),
          countryCode: currency === 'ALL' ? 'OPEC' : countryCode,
          time: eventDate.toISOString(),
          impactLevel,
          forecast: e.forecast || '-',
          previous: e.previous || '-',
          actual: null, // ForexFactory doesn't include actual in the JSON
          currency,
          affectedAssets: getAffectedAssets(eventName),
          source: 'forexfactory',
          isReal: true,
          _sortTime: eventDate.getTime(),
        };
      })
      // Filter out past events (older than 6 hours)
      .filter((e: any) => {
        const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
        return e._sortTime > sixHoursAgo;
      })
      .sort((a: any, b: any) => a._sortTime - b._sortTime);

    // Clean up internal sort field
    events.forEach((e: any) => delete e._sortTime);

    console.log(`[Calendar API] ForexFactory fetched ${events.length} real events (free source)`);
    return events;
  } catch (err: any) {
    console.warn('[Calendar API] ForexFactory calendar error:', err.message?.slice(0, 100));
    return [];
  }
}

// ─── FMP Economic Calendar (requires API key) ──────────────
async function fetchFMPEconomicCalendar(days: number = 7): Promise<any[]> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey || apiKey.trim() === '') return [];

  try {
    const now = new Date();
    const from = now.toISOString().split('T')[0];
    const toDate = new Date(now);
    toDate.setDate(toDate.getDate() + days);
    const to = toDate.toISOString().split('T')[0];

    const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${from}&to=${to}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 0 } });
    if (!res.ok) {
      console.warn(`[Calendar API] FMP calendar error: ${res.status}`);
      return [];
    }

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return [];

    const events = json
      .filter((e: any) => e.event || e.title)
      .map((e: any, i: number) => {
        const eventName = e.event || e.title || 'Economic Event';
        const country = (e.country || 'US').toUpperCase();
        const impactStr = (e.impact || '').toLowerCase();
        const impactLevel = impactStr === 'high' ? 3 : impactStr === 'medium' ? 2 : 1;
        const eventDate = e.date ? new Date(e.date) : new Date();

        return {
          id: `fmp-${i}-${Date.now()}`,
          event: eventName,
          eventAr: getEventNameAr(eventName),
          country: getCountryFlag(country),
          countryCode: country,
          time: eventDate.toISOString(),
          impactLevel,
          forecast: e.forecast || e.estimate || '-',
          previous: e.previous || '-',
          actual: e.actual || null,
          currency: e.currency || 'USD',
          affectedAssets: getAffectedAssets(eventName),
          source: 'fmp',
          isReal: true,
        };
      })
      .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());

    console.log(`[Calendar API] FMP fetched ${events.length} real events`);
    return events;
  } catch (err: any) {
    console.warn('[Calendar API] FMP calendar error:', err.message?.slice(0, 100));
    return [];
  }
}

// ─── Finnhub Economic Calendar (requires API key) ──────────
async function fetchFinnhubEconomicCalendar(days: number = 7): Promise<any[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey || apiKey.trim() === '') return [];

  try {
    const now = new Date();
    const from = Math.floor(now.getTime() / 1000);
    const toDate = new Date(now);
    toDate.setDate(toDate.getDate() + days);
    const to = Math.floor(toDate.getTime() / 1000);

    const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 0 } });
    if (!res.ok) {
      console.warn(`[Calendar API] Finnhub calendar error: ${res.status}`);
      return [];
    }

    const json = await res.json();
    const rawEvents = json.economicCalendar || json.events || [];
    if (!Array.isArray(rawEvents) || rawEvents.length === 0) return [];

    const events = rawEvents
      .map((e: any, i: number) => {
        const eventName = e.event || e.title || 'Economic Event';
        const country = (e.country || 'US').toUpperCase();
        const impactStr = (e.impact || '').toLowerCase();
        const impactLevel = impactStr === 'high' ? 3 : impactStr === 'medium' ? 2 : 1;
        const eventDate = e.time ? new Date(e.time * 1000) : e.date ? new Date(e.date) : new Date();

        return {
          id: `fh-${i}-${Date.now()}`,
          event: eventName,
          eventAr: getEventNameAr(eventName),
          country: getCountryFlag(country),
          countryCode: country,
          time: eventDate.toISOString(),
          impactLevel,
          forecast: e.estimate || e.forecast || '-',
          previous: e.prev || e.previous || '-',
          actual: e.actual || null,
          currency: e.currency || 'USD',
          affectedAssets: getAffectedAssets(eventName),
          source: 'finnhub',
          isReal: true,
        };
      })
      .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());

    console.log(`[Calendar API] Finnhub fetched ${events.length} real events`);
    return events;
  } catch (err: any) {
    console.warn('[Calendar API] Finnhub calendar error:', err.message?.slice(0, 100));
    return [];
  }
}

// ─── DB Calendar Events ─────────────────────────────────────
async function fetchDBCalendarEvents(): Promise<any[]> {
  try {
    const dbEvents = await db.calendarEvent.findMany({
      where: { eventDate: { gte: new Date() } },
      orderBy: { eventDate: 'asc' },
      take: 20,
    });

    if (dbEvents.length > 0) {
      return dbEvents.map((e, i) => ({
        id: e.id,
        event: e.eventName,
        eventAr: e.eventNameAr || getEventNameAr(e.eventName || ''),
        country: getCountryFlag(e.country || 'US'),
        countryCode: (e.country || 'US').toUpperCase(),
        time: e.eventDate.toISOString(),
        impactLevel: e.impact === 'high' ? 3 : e.impact === 'medium' ? 2 : 1,
        forecast: e.forecast || '-',
        previous: e.previous || '-',
        actual: e.actual || null,
        currency: e.currency || 'USD',
        affectedAssets: getAffectedAssets(e.eventName || ''),
        source: 'db',
        isReal: false,
      }));
    }
  } catch {
    // DB not available
  }
  return [];
}

// ─── Generated Fallback Events (Absolute Last Resort) ──────
// Only used when ALL other sources fail (free + paid).
function generateFallbackEvents(locale: string = 'ar'): any[] {
  const now = new Date();
  console.warn(`[Calendar API] ⚠ ALL real data sources failed — using generated fallback for locale=${locale}`);

  const regionEvents: Record<string, any[]> = {
    ar: [
      { event: 'Saudi Central Bank Rate Decision', country: 'SA', currency: 'SAR', impactLevel: 3, forecast: '6.00%', previous: '6.00%' },
      { event: 'OPEC+ Production Meeting', country: 'OPEC', currency: 'USD', impactLevel: 3, forecast: '-', previous: '-' },
      { event: 'UAE Non-Oil GDP Growth', country: 'AE', currency: 'AED', impactLevel: 2, forecast: '4.5%', previous: '3.8%' },
      { event: 'Egypt Central Bank Rate', country: 'EG', currency: 'EGP', impactLevel: 3, forecast: '27.25%', previous: '27.25%' },
      { event: 'Crude Oil Inventories', country: 'US', currency: 'USD', impactLevel: 2, forecast: '-1.2M', previous: '2.1M' },
      { event: 'Fed Interest Rate Decision', country: 'US', currency: 'USD', impactLevel: 3, forecast: '5.50%', previous: '5.50%' },
      { event: 'CPI Month-over-Month', country: 'US', currency: 'USD', impactLevel: 3, forecast: '0.3%', previous: '0.4%' },
      { event: 'ECB Interest Rate Decision', country: 'EU', currency: 'EUR', impactLevel: 3, forecast: '3.65%', previous: '3.90%' },
    ],
    en: [
      { event: 'Fed Interest Rate Decision', country: 'US', currency: 'USD', impactLevel: 3, forecast: '5.50%', previous: '5.50%' },
      { event: 'Non-Farm Payrolls', country: 'US', currency: 'USD', impactLevel: 3, forecast: '180K', previous: '216K' },
      { event: 'CPI Year-over-Year', country: 'US', currency: 'USD', impactLevel: 3, forecast: '3.1%', previous: '3.4%' },
      { event: 'GDP Growth Rate QoQ', country: 'US', currency: 'USD', impactLevel: 2, forecast: '2.0%', previous: '1.6%' },
      { event: 'ECB Interest Rate Decision', country: 'EU', currency: 'EUR', impactLevel: 3, forecast: '3.65%', previous: '3.90%' },
      { event: 'BOE Rate Decision', country: 'GB', currency: 'GBP', impactLevel: 3, forecast: '5.25%', previous: '5.25%' },
      { event: 'Japan BOJ Rate Decision', country: 'JP', currency: 'JPY', impactLevel: 2, forecast: '0.10%', previous: '-0.10%' },
      { event: 'China PMI Manufacturing', country: 'CN', currency: 'CNY', impactLevel: 2, forecast: '50.4', previous: '49.0' },
    ],
    fr: [
      { event: 'French GDP QoQ', country: 'FR', currency: 'EUR', impactLevel: 2, forecast: '0.2%', previous: '0.1%' },
      { event: 'ECB Interest Rate Decision', country: 'EU', currency: 'EUR', impactLevel: 3, forecast: '3.65%', previous: '3.90%' },
      { event: 'German Ifo Business Climate', country: 'DE', currency: 'EUR', impactLevel: 2, forecast: '87.5', previous: '86.3' },
      { event: 'Eurozone CPI YoY', country: 'EU', currency: 'EUR', impactLevel: 3, forecast: '2.4%', previous: '2.6%' },
      { event: 'German ZEW Economic Sentiment', country: 'DE', currency: 'EUR', impactLevel: 2, forecast: '12.5', previous: '10.7' },
      { event: 'Fed Interest Rate Decision', country: 'US', currency: 'USD', impactLevel: 3, forecast: '5.50%', previous: '5.50%' },
      { event: 'UK CPI YoY', country: 'GB', currency: 'GBP', impactLevel: 2, forecast: '3.2%', previous: '4.0%' },
      { event: 'Crude Oil Inventories', country: 'US', currency: 'USD', impactLevel: 2, forecast: '-1.2M', previous: '2.1M' },
    ],
    tr: [
      { event: 'CBRT Interest Rate Decision', country: 'TR', currency: 'TRY', impactLevel: 3, forecast: '50.00%', previous: '50.00%' },
      { event: 'Turkey CPI YoY', country: 'TR', currency: 'TRY', impactLevel: 3, forecast: '58.5%', previous: '64.9%' },
      { event: 'Turkey Unemployment Rate', country: 'TR', currency: 'TRY', impactLevel: 2, forecast: '9.2%', previous: '9.4%' },
      { event: 'ECB Interest Rate Decision', country: 'EU', currency: 'EUR', impactLevel: 3, forecast: '3.65%', previous: '3.90%' },
      { event: 'Fed Interest Rate Decision', country: 'US', currency: 'USD', impactLevel: 3, forecast: '5.50%', previous: '5.50%' },
      { event: 'Crude Oil Inventories', country: 'US', currency: 'USD', impactLevel: 2, forecast: '-1.2M', previous: '2.1M' },
      { event: 'CPI Month-over-Month', country: 'US', currency: 'USD', impactLevel: 2, forecast: '0.3%', previous: '0.4%' },
      { event: 'German Ifo Business Climate', country: 'DE', currency: 'EUR', impactLevel: 2, forecast: '87.5', previous: '86.3' },
    ],
    es: [
      { event: 'Spain CPI YoY', country: 'ES', currency: 'EUR', impactLevel: 2, forecast: '3.2%', previous: '3.5%' },
      { event: 'Banxico Rate Decision', country: 'MX', currency: 'MXN', impactLevel: 3, forecast: '11.00%', previous: '11.25%' },
      { event: 'Brazil Selic Rate Decision', country: 'BR', currency: 'BRL', impactLevel: 3, forecast: '10.50%', previous: '10.50%' },
      { event: 'ECB Interest Rate Decision', country: 'EU', currency: 'EUR', impactLevel: 3, forecast: '3.65%', previous: '3.90%' },
      { event: 'Mexico GDP QoQ', country: 'MX', currency: 'MXN', impactLevel: 2, forecast: '0.3%', previous: '0.1%' },
      { event: 'Fed Interest Rate Decision', country: 'US', currency: 'USD', impactLevel: 3, forecast: '5.50%', previous: '5.50%' },
      { event: 'Crude Oil Inventories', country: 'US', currency: 'USD', impactLevel: 2, forecast: '-1.2M', previous: '2.1M' },
      { event: 'CPI Month-over-Month', country: 'US', currency: 'USD', impactLevel: 2, forecast: '0.3%', previous: '0.4%' },
    ],
  };

  const templates = regionEvents[locale] || regionEvents.ar;

  return templates.map((template, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() + i + 1);
    date.setHours(8 + (i % 10), (i * 15) % 60, 0, 0);

    return {
      id: `gen-${i + 1}`,
      event: template.event,
      eventAr: getEventNameAr(template.event),
      country: getCountryFlag(template.country),
      countryCode: template.country,
      time: date.toISOString(),
      impactLevel: template.impactLevel,
      forecast: template.forecast,
      previous: template.previous,
      currency: template.currency,
      affectedAssets: getAffectedAssets(template.event),
      source: 'generated',
      isReal: false,
    };
  });
}

// ─── Main GET Handler ──────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'ar';
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '15');

    const now = Date.now();

    // Check in-memory cache (valid for 10 min)
    if (cachedEvents.length > 0 && (now - lastFetch) < CACHE_DURATION) {
      const filtered = filterEventsByLocale(cachedEvents, locale, limit);
      return NextResponse.json({
        events: filtered,
        cached: true,
        source: cachedEvents[0]?.source || 'cache',
        total: cachedEvents.length,
        locale,
      });
    }

    // ── Try Data Sources in Priority Order ──
    let events: any[] = [];
    let dataSource = 'none';

    // 1. ForexFactory (FREE — no API key needed!) — PRIMARY SOURCE
    const ffEvents = await fetchForexFactoryCalendar();
    if (ffEvents.length > 0) {
      events = ffEvents;
      dataSource = 'forexfactory';
    }

    // 2. Try FMP if ForexFactory failed (requires API key)
    if (events.length === 0) {
      const fmpEvents = await fetchFMPEconomicCalendar(days);
      if (fmpEvents.length > 0) {
        events = fmpEvents;
        dataSource = 'fmp';
      }
    }

    // 3. Try Finnhub if FMP also failed (requires API key)
    if (events.length === 0) {
      const fhEvents = await fetchFinnhubEconomicCalendar(days);
      if (fhEvents.length > 0) {
        events = fhEvents;
        dataSource = 'finnhub';
      }
    }

    // 4. Try DB
    if (events.length === 0) {
      const dbEvents = await fetchDBCalendarEvents();
      if (dbEvents.length > 0) {
        events = dbEvents;
        dataSource = 'db';
      }
    }

    // 5. Absolute last resort: generated (locale-aware)
    if (events.length === 0) {
      events = generateFallbackEvents(locale);
      dataSource = 'generated';
    }

    // Update cache
    cachedEvents = events;
    lastFetch = now;

    // Filter by locale and limit
    const filtered = filterEventsByLocale(events, locale, limit);

    return NextResponse.json({
      events: filtered,
      cached: false,
      source: dataSource,
      total: events.length,
      locale,
    });
  } catch (error: any) {
    console.error('[Calendar API] Error:', error);
    return NextResponse.json(
      { events: cachedEvents.length > 0 ? cachedEvents : [], error: error.message },
      { status: 200 }
    );
  }
}

// ─── Filter Events by Locale ───────────────────────────────
// Prioritizes: 1) High-impact region events, 2) High-impact global events,
// 3) Medium/Low region events, 4) Medium/Low global events
// This ensures critical events (CPI, rate decisions, etc.) are always shown first.
function filterEventsByLocale(events: any[], locale: string, limit: number): any[] {
  const regionCountries = LOCALE_COUNTRIES[locale] || LOCALE_COUNTRIES.ar;

  // For ForexFactory data, we also match by currency-to-country mapping
  // This allows EUR events to match for French/German/Spanish locales, etc.
  const isRegionEvent = (e: any) => {
    const cc = e.countryCode || '';
    if (regionCountries.includes(cc)) return true;
    // Also check if the currency maps to a region country
    const currency = e.currency || '';
    const currencyCountries = CURRENCY_TO_COUNTRY[currency];
    if (currencyCountries) {
      return currencyCountries.some((c: string) => regionCountries.includes(c));
    }
    return false;
  };

  // Separate into 4 priority buckets:
  // Bucket 1: High-impact region events (ALWAYS included first)
  // Bucket 2: High-impact global events (ALWAYS included second)
  // Bucket 3: Medium/Low-impact region events (fill remaining slots)
  // Bucket 4: Medium/Low-impact global events (fill remaining slots)
  const sortByTime = (a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime();

  const highImpactRegion = events.filter((e: any) => e.impactLevel >= 3 && isRegionEvent(e)).sort(sortByTime);
  const highImpactGlobal = events.filter((e: any) => e.impactLevel >= 3 && !isRegionEvent(e)).sort(sortByTime);
  const medLowRegion = events.filter((e: any) => e.impactLevel < 3 && isRegionEvent(e)).sort(sortByTime);
  const medLowGlobal = events.filter((e: any) => e.impactLevel < 3 && !isRegionEvent(e)).sort(sortByTime);

  // Build the result: high-impact first, then fill with medium/low
  const result: any[] = [];

  // Always include ALL high-impact region events (up to limit)
  for (const e of highImpactRegion) {
    if (result.length >= limit) break;
    result.push(e);
  }

  // Then include high-impact global events (up to limit)
  for (const e of highImpactGlobal) {
    if (result.length >= limit) break;
    result.push(e);
  }

  // Fill remaining slots with medium/low region events
  for (const e of medLowRegion) {
    if (result.length >= limit) break;
    result.push(e);
  }

  // Fill remaining slots with medium/low global events
  for (const e of medLowGlobal) {
    if (result.length >= limit) break;
    result.push(e);
  }

  // Final sort by time for display
  result.sort(sortByTime);

  return result.slice(0, limit);
}
