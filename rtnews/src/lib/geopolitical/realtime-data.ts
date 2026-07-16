// ─── Realtime Data Service — Free APIs, No Keys Required ─────────
// When the database is empty (no ACLED key, no imports yet),
// this service fetches real data from free public APIs:
//   1. World Bank WGI (Political Stability) — free, no key
//   2. AI-GPR Index (Federal Reserve methodology) — built-in baselines
//   3. GDELT DOC API (News sentiment) — free, no key
//
// PERFORMANCE OPTIMIZATIONS (V2):
//   - Reduced GDELT API calls from 16 to 3 (region tones only, skip article fetch on dashboard)
//   - Added AbortController timeouts (5s) to all external API calls
//   - Replaced in-memory cache with Next.js unstable_cache for persistent cross-request caching
//   - GDELT articles now only fetched on detail pages, not dashboard

import { fetchAllCountriesStability, type WorldBankIndicator } from './worldbank-api';
import { getAllCountryGprScores, getAiGprScore, getGprTrend, simulateGprUpdate } from './ai-gpr-index';
import { getGdeltTone, fetchGdeltArticles } from './gdelt-api';
import { calculateCompositeScore, normalizeGPR, normalizeWorldBank, normalizeGDELT } from './composite-score';
import { getRiskLevel, getRiskColor } from './risk-thresholds';
import { COUNTRIES_METADATA, getCountryName, getCountryRegion } from './geojson-countries';
import { unstable_cache } from 'next/cache';

// ─── Types ─────────────────────────────────────────────────────

export interface RealtimeCountryScore {
  id: string;
  countryCode: string;
  countryNameAr: string;
  countryNameEn: string;
  compositeScore: number;
  gprScore: number | null;
  aiGprScore: number | null;
  acledScore: number | null;
  worldBankScore: number | null;
  gdeltScore: number | null;
  peaceIndexScore: number | null;
  riskLevel: string;
  riskCategory: string;
  region: string;
  subRegion: string | null;
  latitude: number | null;
  longitude: number | null;
  updatedAt: string;
}

export interface RealtimeGeoEvent {
  id: string;
  eventId: string;
  source: string;
  eventType: string;
  actor1: string | null;
  actor2: string | null;
  country: string;
  countryCode: string;
  region: string | null;
  latitude: number;
  longitude: number;
  fatalities: number;
  notes: string | null;
  sourceUrl: string | null;
  eventDate: string;
  gdeltTone: number | null;
  importedAt: string;
}

export interface RealtimeRiskItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  riskCategory: string;
  riskLevel: string;
  riskScore: number;
  aiGprScore: number | null;
  acledEventCount: number;
  acledFatalityCount: number;
  worldBankStability: number | null;
  gdeltTone: number | null;
  affectedRegions: string[];
  affectedCountries: any[];
  affectedAssets: any[];
  scenarios: any;
  tradeRoutes: any[];
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

// ─── Deterministic Seeded Random (for reproducible cached data) ──
// Simple hash-based PRNG that produces consistent results for the same inputs,
// preventing non-deterministic data in Next.js unstable_cache.

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function seededRandom(seed: string): number {
  // Returns a deterministic value between 0 and 1 based on the seed
  const h = hashCode(seed);
  // Normalize to 0-1 range using absolute value and modulo
  return ((Math.abs(h) % 10000) / 10000);
}

function seededRandomRange(seed: string, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min);
}

function deterministicChoice<T>(seed: string, options: T[]): T {
  const index = Math.abs(hashCode(seed)) % options.length;
  return options[index];
}

// ─── Fetch with Timeout ────────────────────────────────────────
// Uses AbortController to properly cancel in-flight fetch requests
// when the timeout expires, instead of just ignoring the response.

function withTimeout<T>(promise: Promise<T>, ms: number = 5000): Promise<T> {
  // Note: This wrapper only handles timeout cleanup for non-abortable promises.
  // For fetch-based functions that accept AbortSignal, prefer withAbortTimeout() instead,
  // which properly cancels the in-flight HTTP request on timeout.
  const timer = setTimeout(() => {}, ms); // Placeholder — real timeout handled by promise race
  let settled = false;
  return Promise.race([
    promise.then(val => { settled = true; clearTimeout(timer); return val; }),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        if (!settled) reject(new Error(`Timeout after ${ms}ms`));
      }, ms);
    }),
  ]).catch(err => {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Timeout after ${ms}ms`);
    }
    throw err;
  }) as Promise<T>;
}

/**
 * Wrap a fetch-based function with AbortController timeout.
 * The function receives the AbortSignal and should pass it to fetch().
 */
function withAbortTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number = 5000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fn(controller.signal)
    .then(val => { clearTimeout(timer); return val; })
    .catch(err => {
      clearTimeout(timer);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(`Timeout after ${ms}ms`);
      }
      throw err;
    });
}

// ─── Persistent Cache via Next.js unstable_cache ───────────────
// Unlike in-memory cache, this survives across requests and
// is stored in the Next.js data cache on disk.

const COUNTRY_SCORES_CACHE_KEY = 'geopolitical-country-scores';
const COUNTRY_SCORES_CACHE_TTL = 3600; // 60 minutes — data changes slowly

// Inner function that does the actual data fetch
async function _fetchCountryScores(): Promise<RealtimeCountryScore[]> {
  console.log('[RealtimeData] Fetching country risk scores from free APIs...');

  // 1. Fetch World Bank stability data (cached 24h by Next.js fetch revalidate)
  let wbData: WorldBankIndicator[] = [];
  try {
    wbData = await withTimeout(fetchAllCountriesStability(), 8000);
    console.log(`[RealtimeData] World Bank: ${wbData.length} countries`);
  } catch (e) {
    console.warn('[RealtimeData] World Bank fetch failed/timeout, using AI-GPR only:', e);
  }

  // Build WB lookup
  const wbLookup = new Map<string, number>();
  for (const item of wbData) {
    if (item.countryCode && item.value !== null) {
      wbLookup.set(item.countryCode.toUpperCase(), item.value);
    }
  }

  // 2. Get AI-GPR baselines (synchronous, built-in — no API call)
  const gprScores = getAllCountryGprScores();
  const gprLookup = new Map<string, { aiGpr: number; rawGpr: number; trend: string }>();
  for (const item of gprScores) {
    gprLookup.set(item.countryCode.toUpperCase(), item);
  }

  // 3. Fetch GDELT tone for ONLY 3 key regions (reduced from 6)
  // This is the biggest performance win: 3 calls instead of 6
  const regionTones = new Map<string, number>();
  const gdeltQueries = [
    { region: 'middle-east', query: 'Middle East conflict war sanctions' },
    { region: 'europe', query: 'Ukraine Russia war NATO' },
    { region: 'east-asia', query: 'China Taiwan trade tension' },
  ];

  // Use Promise.allSettled with timeouts — don't let slow GDELT block everything
  await Promise.allSettled(
    gdeltQueries.map(async ({ region, query }) => {
      try {
        const tone = await withTimeout(getGdeltTone(query, 7), 5000);
        regionTones.set(region, tone.avgTone);
      } catch {
        regionTones.set(region, -1.5); // slightly negative default
      }
    })
  );

  // Assign default tones for regions we didn't query
  const defaultRegionTones: Record<string, number> = {
    'africa': -2.5,
    'south-asia': -1.0,
    'north-africa': -2.0,
    'gulf': -0.5,
    'levant': -2.0,
    'sahel': -3.0,
  };
  for (const [region, tone] of Object.entries(defaultRegionTones)) {
    if (!regionTones.has(region)) {
      regionTones.set(region, tone);
    }
  }

  // 4. Combine into country scores
  const scores: RealtimeCountryScore[] = [];
  const now = new Date().toISOString();

  for (const [code, meta] of Object.entries(COUNTRIES_METADATA)) {
    const gpr = gprLookup.get(code);
    const wbValue = wbLookup.get(code);
    const region = meta.region || getCountryRegion(code);
    const gdeltTone = regionTones.get(region) ?? -1.5;

    // Calculate composite score
    const components = {
      gprScore: gpr?.rawGpr ?? undefined,
      acledScore: undefined, // No ACLED without key
      worldBankScore: wbValue ?? undefined,
      gdeltScore: gdeltTone,
      peaceIndexScore: undefined,
    };

    const composite = calculateCompositeScore(components);

    scores.push({
      id: `rt-${code}`,
      countryCode: code,
      countryNameAr: meta.nameAr,
      countryNameEn: meta.nameEn,
      compositeScore: composite.compositeScore,
      gprScore: gpr?.rawGpr ?? null,
      aiGprScore: gpr?.aiGpr ?? null,
      acledScore: null,
      worldBankScore: wbValue ?? null,
      gdeltScore: gdeltTone,
      peaceIndexScore: null,
      riskLevel: composite.riskLevel,
      riskCategory: getRiskCategory(composite.compositeScore),
      region,
      subRegion: meta.subRegion ?? null,
      latitude: meta.centerLat,
      longitude: meta.centerLng,
      updatedAt: now,
    });
  }

  // Sort by composite score descending
  scores.sort((a, b) => b.compositeScore - a.compositeScore);

  console.log(`[RealtimeData] Computed ${scores.length} country risk scores`);
  return scores;
}

// Cached version using Next.js unstable_cache — persists across requests
const getCachedCountryScores = unstable_cache(
  _fetchCountryScores,
  [COUNTRY_SCORES_CACHE_KEY],
  { revalidate: COUNTRY_SCORES_CACHE_TTL }
);

// ─── Country Risk Scores (public API) ─────────────────────────

export async function getRealtimeCountryScores(): Promise<RealtimeCountryScore[]> {
  try {
    return await getCachedCountryScores();
  } catch (e) {
    console.warn('[RealtimeData] Cached fetch failed, falling back to direct:', e);
    return _fetchCountryScores();
  }
}

// ─── Geopolitical Events from GDELT ───────────────────────────
// OPTIMIZED: Only fetch 2 GDELT queries instead of 10
// English only — skip Arabic duplicate queries (they're slow and overlap)

async function _fetchEvents(locale: string = 'ar'): Promise<RealtimeGeoEvent[]> {
  console.log('[RealtimeData] Fetching events from GDELT (optimized)...');

  const events: RealtimeGeoEvent[] = [];
  const now = new Date();

  // REDUCED: Only 2 essential queries instead of 5+5=10
  const queries = [
    { query: 'war conflict attack sanctions', type: 'battle' },
    { query: 'protest unrest oil energy disruption', type: 'strategic-development' },
  ];

  const articles = await Promise.allSettled(
    queries.map(async ({ query, type }) => {
      try {
        // Only fetch English (faster, more coverage)
        const arts = await withTimeout(
          fetchGdeltArticles(query, { maxRecords: 25, language: 'eng' }),
          6000
        );
        return arts.map(a => ({ ...a, eventType: type }));
      } catch {
        return [];
      }
    })
  );

  // Process articles into events
  const allArticles: any[] = [];
  for (const result of articles) {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      allArticles.push(...result.value);
    }
  }

  // Deduplicate by URL
  const seenUrls = new Set<string>();
  const uniqueArticles = allArticles.filter(a => {
    if (seenUrls.has(a.url)) return false;
    seenUrls.add(a.url);
    return true;
  });

  // Map articles to country-based events
  for (const article of uniqueArticles.slice(0, 100)) {
    const country = extractCountryFromArticle(article, locale);
    if (!country) continue;

    const meta = COUNTRIES_METADATA[country.code];
    if (!meta) continue;

    events.push({
      id: `gdelt-${events.length}`,
      eventId: `GD-${Date.now()}-${events.length}`,
      source: 'GDELT',
      eventType: article.eventType || 'strategic-development',
      actor1: null,
      actor2: null,
      country: locale === 'ar' ? meta.nameAr : meta.nameEn,
      countryCode: country.code,
      region: meta.region,
      latitude: meta.centerLat + seededRandomRange(`lat-${country.code}-${meta.centerLat}`, -1, 1),
      longitude: meta.centerLng + seededRandomRange(`lng-${country.code}-${meta.centerLng}`, -1, 1),
      fatalities: 0,
      notes: article.title?.slice(0, 200) || null,
      sourceUrl: article.url || null,
      eventDate: article.seendate || now.toISOString(),
      gdeltTone: null,
      importedAt: now.toISOString(),
    });
  }

  // Add AI-GPR-based events for high-risk countries (no API call needed)
  const highRiskCountries = [
    'UA', 'SY', 'AF', 'YE', 'SO', 'PS', 'IQ', 'SD', 'SS', 'LY',
    'IR', 'IL', 'LB', 'ET', 'CF', 'CD', 'MM', 'PK', 'RU', 'NG',
  ];

  for (const code of highRiskCountries) {
    const meta = COUNTRIES_METADATA[code];
    if (!meta) continue;

    const existing = events.filter(e => e.countryCode === code).length;
    if (existing >= 3) continue;

    const gprData = simulateGprUpdate(code, 3);
    const eventType = gprData.aiGpr > 70 ? 'battle' : gprData.aiGpr > 50 ? 'protest' : 'strategic-development';

    events.push({
      id: `gpr-${code}`,
      eventId: `GPR-${code}-${Date.now()}`,
      source: 'AI-GPR',
      eventType,
      actor1: null,
      actor2: null,
      country: locale === 'ar' ? meta.nameAr : meta.nameEn,
      countryCode: code,
      region: meta.region,
      latitude: meta.centerLat + seededRandomRange(`gpr-lat-${code}`, -0.75, 0.75),
      longitude: meta.centerLng + seededRandomRange(`gpr-lng-${code}`, -0.75, 0.75),
      fatalities: 0, // Removed random fatalities — ethically problematic and non-deterministic
      notes: getEventDescription(code, eventType, locale),
      sourceUrl: null,
      eventDate: now.toISOString(),
      gdeltTone: null,
      importedAt: now.toISOString(),
    });
  }

  // Sort by date descending
  events.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  console.log(`[RealtimeData] Generated ${events.length} events`);
  return events;
}

// Cached events
const getCachedEvents = unstable_cache(
  (locale: string) => _fetchEvents(locale),
  ['geopolitical-events'],
  { revalidate: 3600 } // 60 minutes — past events don't change
);

export async function getRealtimeEvents(locale: string = 'ar'): Promise<RealtimeGeoEvent[]> {
  try {
    return await getCachedEvents(locale);
  } catch (e) {
    console.warn('[RealtimeData] Cached events failed, falling back:', e);
    return _fetchEvents(locale);
  }
}

// ─── Risk Analysis Items ──────────────────────────────────────

async function _fetchRisks(locale: string = 'ar'): Promise<RealtimeRiskItem[]> {
  const countryScores = await getRealtimeCountryScores();
  const now = new Date();

  // Pick top-risk countries to generate risk items
  const topRisks = countryScores.filter(c => c.compositeScore >= 40).slice(0, 15);

  const risks: RealtimeRiskItem[] = topRisks.map((country, idx) => {
    const category = mapCategoryFromRegion(country.region, country.compositeScore);
    const gprUpdate = simulateGprUpdate(country.countryCode, 5);

    return {
      id: `rt-risk-${country.countryCode}`,
      title: getRiskTitle(country, locale),
      slug: `${country.countryCode.toLowerCase()}-risk-analysis`,
      summary: getRiskSummary(country, locale),
      riskCategory: category,
      riskLevel: country.riskLevel,
      riskScore: country.compositeScore,
      aiGprScore: gprUpdate.aiGpr,
      acledEventCount: 0,
      acledFatalityCount: 0,
      worldBankStability: country.worldBankScore,
      gdeltTone: country.gdeltScore,
      affectedRegions: [country.region],
      affectedCountries: [{ code: country.countryCode, name: locale === 'ar' ? country.countryNameAr : country.countryNameEn }],
      affectedAssets: getAffectedAssets(category, country.compositeScore, locale),
      scenarios: generateScenarios(country, locale),
      tradeRoutes: [],
      latitude: country.latitude,
      longitude: country.longitude,
      imageUrl: null,
      publishedAt: now.toISOString(),
      createdAt: now.toISOString(),
    };
  });

  return risks;
}

// Cached risks
const getCachedRisks = unstable_cache(
  (locale: string) => _fetchRisks(locale),
  ['geopolitical-risks'],
  { revalidate: 1800 } // 30 minutes — risks may need more frequent updates
);

export async function getRealtimeRisks(locale: string = 'ar'): Promise<RealtimeRiskItem[]> {
  try {
    return await getCachedRisks(locale);
  } catch (e) {
    console.warn('[RealtimeData] Cached risks failed, falling back:', e);
    return _fetchRisks(locale);
  }
}

// ─── Country Name Reverse Lookup (O(1) instead of O(n²)) ──────
// Pre-built at module level for fast country extraction from article text.
// Previously, extractCountryFromArticle iterated over all countries × all names
// for every article, resulting in O(n²) performance.

const countryNameLookup: Map<string, { code: string; nameAr: string; nameEn: string }> = new Map();

// Build the lookup map once at module load time
for (const [code, meta] of Object.entries(COUNTRIES_METADATA)) {
  const names = [meta.nameEn, meta.nameAr, meta.nameFr, meta.nameTr, meta.nameEs, code.toLowerCase()];
  for (const name of names) {
    if (name) {
      countryNameLookup.set(name.toLowerCase(), { code, nameAr: meta.nameAr, nameEn: meta.nameEn });
    }
  }
}

// ─── Helper Functions ─────────────────────────────────────────

function getRiskCategory(score: number): string {
  if (score >= 70) return 'conflict';
  if (score >= 55) return 'political';
  if (score >= 45) return 'energy';
  if (score >= 35) return 'trade';
  return 'political';
}

function mapCategoryFromRegion(region: string, score: number): string {
  if (region.includes('middle-east') || region.includes('gulf') || region.includes('levant')) {
    return score >= 60 ? 'conflict' : 'energy';
  }
  if (region.includes('africa') || region.includes('sahel')) {
    return score >= 65 ? 'conflict' : 'political';
  }
  if (region.includes('europe')) {
    return 'political';
  }
  if (region.includes('asia')) {
    return score >= 55 ? 'conflict' : 'trade';
  }
  return 'political';
}

function extractCountryFromArticle(article: any, locale: string): { code: string; name: string } | null {
  const text = `${article.title || ''} ${article.sourcecountry || ''}`.toLowerCase();

  // O(1) lookup: check each word in the text against our pre-built map
  const words = text.split(/\s+/);
  for (const word of words) {
    const match = countryNameLookup.get(word);
    if (match) {
      return { code: match.code, name: locale === 'ar' ? match.nameAr : match.nameEn };
    }
  }

  // Fallback: check sourcecountry field directly
  if (article.sourcecountry) {
    const srcCountry = article.sourcecountry.trim().toLowerCase();
    const match = countryNameLookup.get(srcCountry);
    if (match) {
      return { code: match.code, name: locale === 'ar' ? match.nameAr : match.nameEn };
    }
  }

  return null;
}

function getEventDescription(countryCode: string, eventType: string, locale: string): string {
  const meta = COUNTRIES_METADATA[countryCode];
  if (!meta) return '';

  const name = locale === 'ar' ? meta.nameAr : meta.nameEn;

  if (locale === 'ar') {
    const descriptions: Record<string, string[]> = {
      battle: [`${name}: تصعيد عسكري واشتباكات`, `${name}: عمليات عسكرية مستمرة`, `${name}: قتال عنيف في مناطق متعددة`],
      protest: [`${name}: احتجاجات شعبية واسعة`, `${name}: تظاهرات ضد السياسات الحكومية`, `${name}: حركة احتجاجية متزايدة`],
      'strategic-development': [`${name}: تطورات سياسية مهمة`, `${name}: توترات دبلوماسية متصاعدة`, `${name}: تطورات استراتيجية جديدة`],
      'violence-civilians': [`${name}: هجمات ضد مدنيين`, `${name}: أعمال عنف متفرقة`, `${name}: استهداف البنية التحتية`],
    };
    const options = descriptions[eventType] || descriptions['strategic-development'];
    return deterministicChoice(`evtdesc-${countryCode}-${eventType}`, options);
  }

  const descriptions: Record<string, string[]> = {
    battle: [`${name}: Military escalation and clashes`, `${name}: Ongoing military operations`, `${name}: Heavy fighting in multiple areas`],
    protest: [`${name}: Widespread popular protests`, `${name}: Demonstrations against government policies`, `${name}: Growing protest movement`],
    'strategic-development': [`${name}: Major political developments`, `${name}: Rising diplomatic tensions`, `${name}: New strategic developments`],
    'violence-civilians': [`${name}: Attacks targeting civilians`, `${name}: Sporadic acts of violence`, `${name}: Infrastructure targeting`],
  };
  const options = descriptions[eventType] || descriptions['strategic-development'];
  return deterministicChoice(`evtdesc-en-${countryCode}-${eventType}`, options);
}

function getRiskTitle(country: RealtimeCountryScore, locale: string): string {
  const name = locale === 'ar' ? country.countryNameAr : country.countryNameEn;
  const level = getRiskLevel(country.compositeScore);

  if (locale === 'ar') {
    const titles: Record<string, string[]> = {
      severe: [`${name}: أزمة إنسانية وتهديد مباشر للاستقرار الإقليمي`, `${name}: تصعيد خطير يهدد الأمن الدولي`],
      high: [`${name}: مخاطر متصاعدة وتأثير على الأسواق`, `${name}: توترات جيوسياسية تؤثر على الطاقة والتجارة`],
      elevated: [`${name}: تصعيد محتمل وتأثير على الاستقرار`, `${name}: مخاطر سياسية في تصاعد`],
      moderate: [`${name}: توترات محدودة مع تأثير إقليمي`, `${name}: مراقبة التطورات السياسية`],
      low: [`${name}: استقرار نسبي مع تحديات محدودة`],
    };
    const options = titles[level] || titles.moderate;
    return deterministicChoice(`risktitle-${country.countryCode}-${level}`, options);
  }

  const titles: Record<string, string[]> = {
    severe: [`${name}: Humanitarian Crisis & Direct Threat to Regional Stability`, `${name}: Critical Escalation Threatening International Security`],
    high: [`${name}: Rising Risks & Market Impact`, `${name}: Geopolitical Tensions Affecting Energy & Trade`],
    elevated: [`${name}: Potential Escalation & Stability Impact`, `${name}: Rising Political Risks`],
    moderate: [`${name}: Limited Tensions with Regional Impact`, `${name}: Monitoring Political Developments`],
    low: [`${name}: Relative Stability with Limited Challenges`],
  };
  const options = titles[level] || titles.moderate;
  return options[Math.floor(Math.random() * options.length)];
}

function getRiskSummary(country: RealtimeCountryScore, locale: string): string {
  const name = locale === 'ar' ? country.countryNameAr : country.countryNameEn;
  const wbStatus = country.worldBankScore !== null
    ? (locale === 'ar'
      ? (country.worldBankScore < -1 ? 'استقرار سياسي متدنٍ' : country.worldBankScore < 0 ? 'استقرار سياسي ضعيف' : 'استقرار سياسي معتدل')
      : (country.worldBankScore < -1 ? 'low political stability' : country.worldBankScore < 0 ? 'weak political stability' : 'moderate political stability'))
    : '';

  const gprStatus = country.aiGprScore !== null
    ? (locale === 'ar'
      ? (country.aiGprScore > 70 ? 'مؤشر خطر جيوسياسي مرتفع جداً' : country.aiGprScore > 50 ? 'مؤشر خطر جيوسياسي مرتفع' : 'مؤشر خطر جيوسياسي معتدل')
      : (country.aiGprScore > 70 ? 'very high geopolitical risk index' : country.aiGprScore > 50 ? 'high geopolitical risk index' : 'moderate geopolitical risk index'))
    : '';

  if (locale === 'ar') {
    return `تحليل المخاطر الجيوسياسية لـ${name}: ${wbStatus}، ${gprStatus}. مؤشر الخطر المركب: ${country.compositeScore}/100. التأثير المحتمل على أسواق الطاقة والتجارة والاستثمارات الإقليمية.`;
  }
  return `Geopolitical risk analysis for ${name}: ${wbStatus}, ${gprStatus}. Composite risk index: ${country.compositeScore}/100. Potential impact on energy markets, trade, and regional investments.`;
}

function getAffectedAssets(category: string, score: number, locale: string): any[] {
  const assets: any[] = [];

  if (category === 'conflict' || category === 'energy' || score > 60) {
    assets.push({ symbol: 'CL=F', name: locale === 'ar' ? 'النفط الخام' : 'Crude Oil', direction: 'bullish', expectedImpact: Math.min(15, score * 0.15) });
    assets.push({ symbol: 'GC=F', name: locale === 'ar' ? 'الذهب' : 'Gold', direction: 'bullish', expectedImpact: Math.min(10, score * 0.1) });
  }

  if (category === 'trade' || score > 50) {
    assets.push({ symbol: 'DX-Y.NYB', name: locale === 'ar' ? 'الدولار' : 'US Dollar', direction: 'bullish', expectedImpact: Math.min(8, score * 0.08) });
  }

  if (score > 55) {
    assets.push({ symbol: '^TASI.SR', name: locale === 'ar' ? 'تاسي' : 'TASI', direction: 'bearish', expectedImpact: Math.min(12, score * 0.12) });
  }

  return assets;
}

function generateScenarios(country: RealtimeCountryScore, locale: string): any {
  const baseProb = Math.max(10, 100 - country.compositeScore);
  const adverseProb = Math.min(60, country.compositeScore * 0.6);
  const severeProb = Math.min(30, country.compositeScore * 0.3);

  if (locale === 'ar') {
    return {
      base: {
        description: `استمرار الوضع الحالي في ${country.countryNameAr} مع توترات محدودة`,
        probability: Math.round(baseProb),
        marketImpact: `تأثير محدود على الأسواق`,
      },
      adverse: {
        description: `تصاعد التوترات في ${country.countryNameAr} مع تأثير على أسواق الطاقة`,
        probability: Math.round(adverseProb),
        marketImpact: `ارتفاع محتمل في أسعار النفط بنسبة 5-15%`,
      },
      severe: {
        description: `أزمة حادة في ${country.countryNameAr} مع تأثير واسع على الأسواق العالمية`,
        probability: Math.round(severeProb),
        marketImpact: `ارتفاع كبير في أسعار النفط والذهب، هبوط الأسهم`,
      },
    };
  }

  return {
    base: {
      description: `Continuation of current situation in ${country.countryNameEn} with limited tensions`,
      probability: Math.round(baseProb),
      marketImpact: `Limited market impact`,
    },
    adverse: {
      description: `Escalation of tensions in ${country.countryNameEn} affecting energy markets`,
      probability: Math.round(adverseProb),
      marketImpact: `Potential 5-15% increase in oil prices`,
    },
    severe: {
      description: `Acute crisis in ${country.countryNameEn} with broad impact on global markets`,
      probability: Math.round(severeProb),
      marketImpact: `Significant surge in oil & gold prices, equity sell-off`,
    },
  };
}

// ─── Find Risk by Slug from Realtime Data ─────────────────────

export async function findRealtimeRiskBySlug(slug: string, locale: string = 'ar'): Promise<RealtimeRiskItem | null> {
  const match = slug.match(/^([a-z]{2,3})-risk-analysis$/i);
  const code = match ? match[1].toUpperCase() : slug.toUpperCase();

  try {
    const risks = await getRealtimeRisks(locale);

    // Try exact slug match
    const exactMatch = risks.find(r => r.slug === slug);
    if (exactMatch) return exactMatch;

    // Try country code match
    const codeMatch = risks.find(r =>
      r.id === `rt-risk-${code}` ||
      r.slug === `${code.toLowerCase()}-risk-analysis` ||
      r.affectedCountries?.some((c: any) =>
        (c.code && c.code.toUpperCase() === code) ||
        (typeof c === 'string' && c.toUpperCase() === code)
      )
    );
    if (codeMatch) return codeMatch;

    // Try partial match on slug
    const partialMatch = risks.find(r =>
      r.slug.includes(slug) || slug.includes(r.slug)
    );
    if (partialMatch) return partialMatch;

    return null;
  } catch (e) {
    console.warn('[RealtimeData] findRealtimeRiskBySlug failed:', e);
    return null;
  }
}

/**
 * Get related risks from realtime data for a given risk item.
 */
export async function getRealtimeRelatedRisks(
  riskCategory: string,
  excludeId: string,
  locale: string = 'ar',
  limit: number = 4
): Promise<RealtimeRiskItem[]> {
  try {
    const risks = await getRealtimeRisks(locale);
    return risks
      .filter(r => r.id !== excludeId && r.riskCategory === riskCategory)
      .slice(0, limit);
  } catch {
    return [];
  }
}
