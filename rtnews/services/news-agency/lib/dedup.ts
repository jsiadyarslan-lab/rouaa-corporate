// ═══════════════════════════════════════════════════════════════
// Agency Dedup System V1 — 3-layer duplicate detection
// ═══════════════════════════════════════════════════════════════
// PROBLEM (verified on production 2026-07-06):
//   - 6 articles about TSLA "تسلا/تيسلا 7.49%" published same day
//   - 3 articles about Ukraine 95/100 published same day
//   - 2 identical "Communication Services 4.66%" articles published 2h apart
//
// ROOT CAUSE:
//   1. Symbol dedup list only has 20 tickers (TSLA, BTC, etc.)
//      - Misses Communication Services, sector names, country names
//   2. Arabic normalization missing: "تسلا" vs "تيسلا" vs "TSLA" not unified
//   3. No content-hash dedup for same-numbers-different-title cases
//   4. No semantic similarity check
//
// SOLUTION: 3-layer dedup applied at MULTIPLE points in pipeline
//   Layer 1: Pre-LLM (before calling expensive LLM) — event-level
//   Layer 2: Post-LLM, pre-publish (article-level) — content-level
//   Layer 3: Cross-time (24h window) — repeated news detection
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import crypto from 'crypto';

// ─── Layer 0: Arabic Text Normalization ────────────────────
// Unifies Arabic character variants so "تسلا" == "تيسلا" comparisons
// work correctly. Note: this normalizes for COMPARISON ONLY — never
// stored in DB or shown to user.

export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    // Unify Alef variants
    .replace(/[إأآا]/g, 'ا')
    // Unify Yaa
    .replace(/ى/g, 'ي')
    // Unify Taa Marbuta (so "تيسلة" == "تيسلا")
    .replace(/ة/g, 'ه')
    // Unify Waw/Hamza
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    // Remove diacritics (tashkeel)
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    // Remove tatweel
    .replace(/\u0640/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ─── Symbol Synonym Map ────────────────────────────────────
// Maps Arabic asset names → canonical Latin ticker.
// When ANY variant appears in title, we treat it as the same symbol.

interface SymbolEntry {
  canonical: string;          // Latin ticker (TSLA, BTC, etc.)
  arabicVariants: string[];   // All Arabic spellings to match
  englishVariants: string[];  // English name variants
}

const SYMBOL_MAP: SymbolEntry[] = [
  // ─── US Tech Stocks ───
  { canonical: 'TSLA', arabicVariants: ['تسلا', 'تيسلا', 'تسلاء', 'تيسلة'], englishVariants: ['TESLA', 'TSLA'] },
  { canonical: 'AAPL', arabicVariants: ['أبل', 'ابل', 'آبل', 'ابلة'], englishVariants: ['APPLE', 'AAPL'] },
  { canonical: 'MSFT', arabicVariants: ['مايكروسوفت', 'ميكروسوفت'], englishVariants: ['MICROSOFT', 'MSFT'] },
  { canonical: 'GOOGL', arabicVariants: ['ألفابت', 'الفابت', 'جوجل', 'غوغل'], englishVariants: ['ALPHABET', 'GOOGLE', 'GOOGL'] },
  { canonical: 'AMZN', arabicVariants: ['أمازون', 'امازون', 'أمازون.كوم'], englishVariants: ['AMAZON', 'AMZN'] },
  { canonical: 'NVDA', arabicVariants: ['إنفيديا', 'انفيديا', 'نفيديا'], englishVariants: ['NVIDIA', 'NVDA'] },
  { canonical: 'META', arabicVariants: ['ميتا', 'فيسبوك'], englishVariants: ['META', 'FACEBOOK', 'FB'] },
  { canonical: 'AMD', arabicVariants: ['إيه إم دي', 'ايه ام دي', 'أمد'], englishVariants: ['AMD'] },
  { canonical: 'INTC', arabicVariants: ['إنتل', 'انتل', 'إنتل كورب'], englishVariants: ['INTEL', 'INTC'] },
  { canonical: 'NFLX', arabicVariants: ['نتفليكس', 'نيتفليكس'], englishVariants: ['NETFLIX', 'NFLX'] },

  // ─── US Financials ───
  { canonical: 'JPM', arabicVariants: ['جي بي مورغان', 'جي بي مورجان'], englishVariants: ['JPMORGAN', 'JPM'] },
  { canonical: 'BAC', arabicVariants: ['بنك أوف أمريكا', 'بنك امريكا', 'بانك أوف أمريكا'], englishVariants: ['BANK OF AMERICA', 'BAC'] },
  { canonical: 'GS', arabicVariants: ['غولدمان ساكس', 'جولدمان ساكس'], englishVariants: ['GOLDMAN SACHS', 'GS'] },
  { canonical: 'V', arabicVariants: ['فيزا'], englishVariants: ['VISA'] },
  { canonical: 'MA', arabicVariants: ['ماستركارد', 'ماستر كارد'], englishVariants: ['MASTERCARD', 'MA'] },

  // ─── Crypto ───
  { canonical: 'BTC', arabicVariants: ['بيتكوين', 'بتكوين', 'ب ت س', 'بي تكوين'], englishVariants: ['BITCOIN', 'BTC'] },
  { canonical: 'ETH', arabicVariants: ['إيثيريوم', 'ايثيريوم', 'إيثر', 'ايثير', 'ايثريوم'], englishVariants: ['ETHEREUM', 'ETH'] },
  { canonical: 'BNB', arabicVariants: ['بينانس', 'بينانس كوين'], englishVariants: ['BNB', 'BINANCE'] },
  { canonical: 'SOL', arabicVariants: ['سولانا', 'سول'], englishVariants: ['SOLANA', 'SOL'] },
  { canonical: 'XRP', arabicVariants: ['ريبل', 'آر بي ال'], englishVariants: ['RIPPLE', 'XRP'] },
  { canonical: 'ADA', arabicVariants: ['كاردانو'], englishVariants: ['CARDANO', 'ADA'] },
  { canonical: 'DOGE', arabicVariants: ['دوجكوين', 'دوج كوين'], englishVariants: ['DOGECOIN', 'DOGE'] },

  // ─── Energy & Commodities ───
  { canonical: 'XOM', arabicVariants: ['إكسون موبيل', 'اكسون موبيل'], englishVariants: ['EXXON', 'XOM'] },
  { canonical: 'CVX', arabicVariants: ['شيفرون'], englishVariants: ['CHEVRON', 'CVX'] },
  { canonical: 'GOLD', arabicVariants: ['الذهب'], englishVariants: ['GOLD'] },
  { canonical: 'OIL', arabicVariants: ['النفط', 'البترول', 'النفط الخام'], englishVariants: ['OIL', 'CRUDE', 'WTI', 'BRENT'] },
  { canonical: 'SILVER', arabicVariants: ['الفضة'], englishVariants: ['SILVER'] },

  // ─── Healthcare ───
  { canonical: 'VRTX', arabicVariants: ['فيرتكس', 'فيرتكس فارماسيوتيكالز', 'فيرتيكس'], englishVariants: ['VERTEX', 'VRTX'] },
  { canonical: 'PFE', arabicVariants: ['فايزر'], englishVariants: ['PFIZER', 'PFE'] },
  { canonical: 'JNJ', arabicVariants: ['جونسون آند جونسون', 'جونسون و جونسون'], englishVariants: ['JOHNSON', 'JNJ'] },

  // ─── Geopolitical entities ───
  { canonical: 'UKRAINE', arabicVariants: ['أوكرانيا', 'اوكرانيا'], englishVariants: ['UKRAINE', 'UKRAINIAN'] },
  { canonical: 'RUSSIA', arabicVariants: ['روسيا', 'الاتحاد الروسي'], englishVariants: ['RUSSIA', 'RUSSIAN'] },
  { canonical: 'GAZA', arabicVariants: ['غزة', 'قطاع غزة'], englishVariants: ['GAZA'] },
  { canonical: 'ISRAEL', arabicVariants: ['إسرائيل', 'اسرائيل'], englishVariants: ['ISRAEL', 'ISRAELI'] },
  { canonical: 'IRAN', arabicVariants: ['إيران', 'ايران'], englishVariants: ['IRAN', 'IRANIAN'] },

  // ─── Indexes ───
  { canonical: 'SPX', arabicVariants: ['إس آند بي', 'اس اند بي', 'مؤشر ستاندرد آند بورز'], englishVariants: ['S&P', 'SPX', 'SP500'] },
  { canonical: 'NDX', arabicVariants: ['ناسداك', 'نازداك'], englishVariants: ['NASDAQ', 'NDX'] },
  { canonical: 'DJI', arabicVariants: ['داو جونز', 'مؤشر داو'], englishVariants: ['DOW', 'DJI', 'DJIA'] },
  { canonical: 'VIX', arabicVariants: ['مؤشر الخوف', 'فيكس', 'مؤشر التقلب'], englishVariants: ['VIX'] },

  // ─── Sector names ───
  // V1178 FIX: Added 6 missing sectors that were causing duplicate sector articles.
  // PRODUCTION EVIDENCE (2026-07-08): "قطاع الصناعات يتراجع بنسبة -4.98%" was
  // published 3 times (09:46, 10:06, 12:40) because extractSymbols() returned []
  // for "الصناعات" — it was not in the map. With empty symbols, isDuplicateEvent()
  // returns {duplicate: false} immediately (line 322-324), skipping ALL dedup checks.
  // The 6 sectors below match the SECTOR_AR map in stock-digests.ts exactly.
  { canonical: 'COMM_SVCS', arabicVariants: ['خدمات الاتصالات', 'قطاع الاتصالات', 'خدمات اتصالات'], englishVariants: ['COMMUNICATION SERVICES'] },
  { canonical: 'TECH', arabicVariants: ['التكنولوجيا', 'قطاع التكنولوجيا', 'التقنية'], englishVariants: ['TECHNOLOGY', 'TECH'] },
  { canonical: 'ENERGY', arabicVariants: ['الطاقة', 'قطاع الطاقة'], englishVariants: ['ENERGY'] },
  { canonical: 'FINANCE', arabicVariants: ['الخدمات المالية', 'القطاع المالي', 'المالية'], englishVariants: ['FINANCIAL', 'FINANCE'] },
  { canonical: 'HEALTHCARE', arabicVariants: ['الرعاية الصحية', 'الصحة', 'القطاع الصحي'], englishVariants: ['HEALTHCARE', 'HEALTH'] },
  // V1178 NEW — 6 sectors that were missing (caused duplicate sector articles)
  { canonical: 'INDUSTRIALS', arabicVariants: ['الصناعات', 'قطاع الصناعات'], englishVariants: ['INDUSTRIALS', 'INDUSTRIAL'] },
  { canonical: 'MATERIALS', arabicVariants: ['المواد الأساسية', 'قطاع المواد الأساسية', 'المواد'], englishVariants: ['MATERIALS', 'BASIC MATERIALS', 'MATERIAL'] },
  { canonical: 'CONSUMER_CYCLICAL', arabicVariants: ['الاستهلاك الدوري', 'قطاع الاستهلاك الدوري'], englishVariants: ['CONSUMER CYCLICAL', 'CONSUMER_DISCRETIONARY'] },
  { canonical: 'CONSUMER_STAPLES', arabicVariants: ['السلع الاستهلاكية الأساسية', 'قطاع السلع الاستهلاكية الأساسية'], englishVariants: ['CONSUMER STAPLES', 'CONSUMER DEFENSIVE', 'CONSUMER_STAPLES'] },
  { canonical: 'REAL_ESTATE', arabicVariants: ['العقارات', 'قطاع العقارات'], englishVariants: ['REAL ESTATE', 'REAL_ESTATE', 'REIT'] },
  { canonical: 'UTILITIES', arabicVariants: ['المرافق', 'قطاع المرافق'], englishVariants: ['UTILITIES', 'UTILITY'] },
];

// Build a reverse lookup: every possible spelling → canonical
const VARIANT_TO_CANONICAL: Map<string, string> = new Map();
for (const entry of SYMBOL_MAP) {
  for (const v of entry.englishVariants) {
    VARIANT_TO_CANONICAL.set(v.toUpperCase(), entry.canonical);
  }
  for (const v of entry.arabicVariants) {
    VARIANT_TO_CANONICAL.set(normalizeArabic(v), entry.canonical);
  }
}

/**
 * Extract all canonical symbols mentioned in a text.
 * Returns array like ['TSLA', 'BTC'] (canonical Latin form).
 */
export function extractSymbols(text: string): string[] {
  if (!text) return [];
  const normalized = normalizeArabic(text);
  const upper = text.toUpperCase();

  const found = new Set<string>();

  // Match English tickers/names (whole word, 2+ chars including spaces for multi-word names)
  // Two patterns: single token (TSLA, BTC) and multi-word (COMMUNICATION SERVICES, BANK OF AMERICA)
  const englishSinglePattern = /\b[A-Z][A-Z0-9.&]{1,20}\b/g;
  let m: RegExpExecArray | null;
  while ((m = englishSinglePattern.exec(upper)) !== null) {
    const word = m[0];
    const canonical = VARIANT_TO_CANONICAL.get(word);
    if (canonical) found.add(canonical);
  }

  // Multi-word English matches (e.g., "COMMUNICATION SERVICES", "BANK OF AMERICA")
  const englishMultiPattern = /\b[A-Z][A-Z]+(?:\s+(?:OF|AND|&|THE)\s+[A-Z]+|\s+[A-Z]+){1,4}\b/g;
  while ((m = englishMultiPattern.exec(upper)) !== null) {
    const word = m[0].trim();
    const canonical = VARIANT_TO_CANONICAL.get(word);
    if (canonical) found.add(canonical);
    // Also try concatenation ("COMMUNICATION SERVICES" → "COMMUNICATIONSERVICES")
    const concatenated = word.replace(/\s+/g, '');
    const concatCanonical = VARIANT_TO_CANONICAL.get(concatenated);
    if (concatCanonical) found.add(concatCanonical);
  }

  // Match Arabic variants (must use normalized form)
  // Sort by length DESCENDING so longer variants match first
  // (e.g., "تيسلا موتورز" matches before "تيسلا" so we don't miss compound names)
  const arabicVariants = Array.from(VARIANT_TO_CANONICAL.entries())
    .filter(([v]) => !/^[A-Z0-9.&]+$/.test(v))
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [variant, canonical] of arabicVariants) {
    if (normalized.includes(variant)) {
      found.add(canonical);
    }
  }

  return Array.from(found);
}

// ─── Number Fingerprint ────────────────────────────────────
// Extracts all numeric values (percentages, prices, scores) from text.
// Two articles with the SAME numbers in title+summary are very likely
// to be about the same event, even if titles differ in phrasing.

export function extractNumbers(text: string): number[] {
  if (!text) return [];
  const numbers: number[] = [];

  // Match: 7.49%, $393.45, 71,718.41, 95/100, 73.9M, 1.2B
  const patterns = [
    /(\d[\d,]*\.?\d+)\s*%/g,                          // 7.49%
    /\$\s*(\d[\d,]*\.?\d+)/g,                          // $393.45
    // Arabic numbers — word boundary doesn't work well with Arabic, use lookarounds
    /(\d[\d,]*\.?\d+)\s*(?:دولار|مليون|مليار|ألف|الف|مليار\s*دولار|مليون\s*دولار)/g,
    // 95/100 — capture BOTH numbers (numerator and denominator)
    /(\d[\d,]*\.?\d+)\s*\/\s*(\d[\d,]*\.?\d+)/g,      // 95/100 (both)
    /\b(\d{1,3}(?:,\d{3})+\.?\d*)\b/g,                 // 71,718.41
    /\b(\d+\.\d{2,})\b/g,                              // any decimal with 2+ places
  ];

  for (const pattern of patterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      // m[1] always exists; m[2] only for ratio pattern (95/100)
      for (let g = 1; g < m.length; g++) {
        if (!m[g]) continue;
        const numStr = m[g].replace(/,/g, '');
        const num = parseFloat(numStr);
        if (!isNaN(num) && num > 0) {
          numbers.push(num);
        }
      }
      // Advance past match (avoid infinite loop on zero-length matches)
      if (m.index === pattern.lastIndex) pattern.lastIndex++;
    }
  }

  // Dedupe + sort (so order doesn't matter for hash)
  return Array.from(new Set(numbers)).sort((a, b) => a - b);
}

// ─── Content Hash ──────────────────────────────────────────
// Combines symbols + key numbers into a single hash.
// Two articles with same hash = same story, must be deduped.

export function contentHash(title: string, summary: string): string {
  const combined = `${title} ${summary || ''}`;
  const symbols = extractSymbols(combined).sort();
  const numbers = extractNumbers(combined);

  // Build fingerprint: symbols sorted + numbers sorted
  const fp = `${symbols.join(',')}|${numbers.join(',')}`;
  return crypto.createHash('md5').update(fp).digest('hex');
}

// ─── Layer 1: Event-level dedup (before LLM call) ─────────
// Checks if a similar event (same source + same external ID hash)
// has been processed in the last 24h.
// Returns TRUE if event should be skipped.
//
// V1149 FIX: URL dedup is no longer absolute. Many sources (FRED, World Bank,
// EIA, central bank RSS) use the SAME URL for ALL updates to a series.
// Example: FRED's DGS10 (10-year Treasury yield) always uses
//   https://fred.stlouisfed.org/series/DGS10
// regardless of the actual yield value. Absolute URL dedup rejected ALL
// subsequent updates — losing every new data point.
//
// FIX: URL dedup is now COMBINED with number check. Same URL + same key
// numbers = same article. Same URL + different numbers = NEW article.
// Also: events with NO symbols and NO numbers (pure URL sources) still
// get absolute URL dedup (those sources publish unique articles per URL).

export async function isDuplicateEvent(
  event: { sourceId: string; externalId: string; title: string; rawContent: string; url?: string }
): Promise<{ duplicate: boolean; reason?: string; existingNewsItemId?: string }> {
  // Extract symbols + numbers from the event (used by all checks below)
  const eventText = `${event.title} ${event.rawContent.slice(0, 500)}`;
  const eventSymbols = extractSymbols(eventText);
  const eventNumbers = extractNumbers(eventText);

  // 1. ABSOLUTE URL dedup — ONLY when event has NO numbers AND NO symbols.
  // This catches pure-news articles (SEC filings, central bank press releases)
  // where URL uniqueness means article uniqueness.
  // Sources like FRED/WorldBank that use stable URLs but vary numbers
  // will have numbers in the event, so they skip this check.
  if (event.url && event.url.trim() && eventNumbers.length === 0 && eventSymbols.length === 0) {
    const existing = await db.newsItem.findFirst({
      where: { url: event.url, source: 'محرر رؤى الذكي' },
      select: { id: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
    });
    if (existing) {
      return { duplicate: true, reason: `URL already published as ${existing.id} (no numbers/symbols to differ)`, existingNewsItemId: existing.id };
    }
  }

  // 2. URL + NUMBERS dedup — for stable-URL sources with varying data.
  // If the URL was published before, check if the same key numbers appear
  // in the previously published article. If yes → duplicate. If no → new.
  if (event.url && event.url.trim() && eventNumbers.length > 0) {
    const existingArticles = await db.newsItem.findMany({
      where: { url: event.url, source: 'محرر رؤى الذكي' },
      select: { id: true, title: true, titleAr: true, summaryAr: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 5, // Check last 5 articles with same URL
    });

    for (const existing of existingArticles) {
      const existingText = `${existing.titleAr || existing.title || ''} ${existing.summaryAr || ''}`;
      const existingNumbers = extractNumbers(existingText);

      // If 2+ numbers match → it's the same data point, duplicate
      let matchedNumbers = 0;
      for (const n of eventNumbers) {
        for (const rn of existingNumbers) {
          if (Math.abs(n - rn) / Math.max(n, rn, 0.01) < 0.005) {
            matchedNumbers++;
            break;
          }
        }
      }

      if (matchedNumbers >= 2) {
        return {
          duplicate: true,
          reason: `URL + ${matchedNumbers} matching numbers (same data point)`,
          existingNewsItemId: existing.id,
        };
      }
    }
  }

  // 3. Symbol + number fingerprint dedup (catches cross-URL duplicates)
  // (hash is computed for diagnostics but the actual check uses symbol+number overlap)
  void contentHash(event.title, event.rawContent.slice(0, 500));

  // If no symbols, allow (will be checked at article level via summary)
  if (eventSymbols.length === 0) {
    return { duplicate: false };
  }

  // Pull recent articles in last 24h with same primary symbol in title
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentArticles = await db.newsItem.findMany({
    where: {
      source: 'محرر رؤى الذكي',
      publishedAt: { gte: oneDayAgo },
    },
    select: { id: true, title: true, titleAr: true, summaryAr: true, publishedAt: true },
    take: 200, // Sample recent 200
    orderBy: { publishedAt: 'desc' },
  });

  // For each, check if any canonical symbol overlaps
  for (const recent of recentArticles) {
    const recentTitle = recent.titleAr || recent.title || '';
    const recentSummary = recent.summaryAr || '';
    const recentText = `${recentTitle} ${recentSummary}`;
    const recentSymbols = extractSymbols(recentText);
    const overlap = eventSymbols.filter(s => recentSymbols.includes(s));
    if (overlap.length === 0) continue;

    // Symbols overlap — now check numbers overlap
    // eventNumbers was already extracted at top of function (V1149)
    const recentNumbers = extractNumbers(recentText);

    if (recentNumbers.length > 0 && eventNumbers.length > 0) {
      // If 2+ numbers match (with 0.5% tolerance), it's the same story
      let matchedNumbers = 0;
      for (const n of eventNumbers) {
        for (const rn of recentNumbers) {
          if (Math.abs(n - rn) / Math.max(n, rn, 0.01) < 0.005) {
            matchedNumbers++;
            break;
          }
        }
      }
      if (matchedNumbers >= 2) {
        return {
          duplicate: true,
          reason: `Symbol overlap (${overlap.join(',')}) + ${matchedNumbers} matching numbers`,
          existingNewsItemId: recent.id,
        };
      }
    }

    // Symbols overlap with no number match — check title similarity
    const sim = jaccardSimilarity(
      normalizeArabic(event.title),
      normalizeArabic(recentTitle)
    );
    if (sim > 0.7) {
      return {
        duplicate: true,
        reason: `Symbol overlap (${overlap.join(',')}) + title similarity ${(sim * 100).toFixed(0)}%`,
        existingNewsItemId: recent.id,
      };
    }
  }

  return { duplicate: false };
}

// ─── Layer 2: Article-level dedup (after LLM, before publish) ─
// Stronger than event-level because we have the actual Arabic title.

export async function isDuplicateArticle(
  draftTitle: string,
  draftSummary: string
): Promise<{ duplicate: boolean; reason?: string; existingId?: string }> {
  const symbols = extractSymbols(`${draftTitle} ${draftSummary}`);
  const numbers = extractNumbers(`${draftTitle} ${draftSummary}`);

  if (symbols.length === 0 && numbers.length === 0) {
    return { duplicate: false };
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentArticles = await db.newsItem.findMany({
    where: {
      source: 'محرر رؤى الذكي',
      publishedAt: { gte: oneDayAgo },
    },
    select: { id: true, title: true, titleAr: true, summaryAr: true },
    take: 200,
    orderBy: { publishedAt: 'desc' },
  });

  for (const recent of recentArticles) {
    const recentTitle = recent.titleAr || recent.title || '';
    const recentSummary = recent.summaryAr || '';
    const recentText = `${recentTitle} ${recentSummary}`;
    const recentSymbols = extractSymbols(recentText);
    const overlap = symbols.filter(s => recentSymbols.includes(s));

    if (overlap.length === 0) continue;

    // Check numbers
    const recentNumbers = extractNumbers(recentText);
    if (numbers.length > 0 && recentNumbers.length > 0) {
      let matched = 0;
      for (const n of numbers) {
        for (const rn of recentNumbers) {
          if (Math.abs(n - rn) / Math.max(n, rn, 0.01) < 0.005) {
            matched++;
            break;
          }
        }
      }
      if (matched >= 2) {
        return {
          duplicate: true,
          reason: `Symbol+number match: ${overlap.join(',')} (${matched} numbers)`,
          existingId: recent.id,
        };
      }
    }

    // Check title similarity (post-LLM, titles are in Arabic)
    const sim = jaccardSimilarity(
      normalizeArabic(draftTitle),
      normalizeArabic(recentTitle)
    );
    if (sim > 0.65 && overlap.length > 0) {
      return {
        duplicate: true,
        reason: `Title similarity ${(sim * 100).toFixed(0)}% + symbol ${overlap.join(',')}`,
        existingId: recent.id,
      };
    }
  }

  return { duplicate: false };
}

// ─── Helper: Jaccard Similarity ────────────────────────────
// Token-based similarity. Returns 0-1 (1 = identical).
// Used for title similarity comparison.

function jaccardSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const tokensA = new Set(a.split(' ').filter(t => t.length > 1));
  const tokensB = new Set(b.split(' ').filter(t => t.length > 1));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ─── Quick diagnostic helper ───────────────────────────────
// Returns debug info about a title — useful for testing dedup logic.

export function debugTitle(title: string): {
  normalized: string;
  symbols: string[];
  numbers: number[];
  hash: string;
} {
  const normalized = normalizeArabic(title);
  const symbols = extractSymbols(title);
  const numbers = extractNumbers(title);
  const hash = contentHash(title, '');
  return { normalized, symbols, numbers, hash };
}
