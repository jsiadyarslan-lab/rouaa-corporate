// ═══════════════════════════════════════════════════════════════════
// Calendar Pre-Impact Engine
// ═══════════════════════════════════════════════════════════════════
// Derives two revolutionary features for each economic event:
//
// 1. PRE-IMPACT ROUA SCORE — AI-style prediction of how strongly this
//    event will move markets, derived from historical patterns.
//    Range: 0-100. Categorized as High (>=70), Medium (40-69), Low (<40).
//    Based on: event type + importance level + asset class.
//
// 2. ASSET IMPACT MATRIX — for each event, predicts directional impact
//    (up/down/neutral/volatile) on 6 key assets:
//    Gold (XAU), WTI Oil (CL), Bitcoin (BTC), S&P 500 (SPX),
//    US Dollar Index (DXY), EUR/USD (EURUSD).
//
// Methodology:
//   - Rate decisions (Fed/ECB/BOE/BOJ) → highest volatility, gold up if dovish
//   - CPI/inflation → dollar up, gold down (if hot inflation)
//   - NFP/employment → dollar up, gold down (if strong jobs)
//   - GDP → equity up (if strong growth)
//   - Oil inventories → oil down (if buildup)
//   - OPEC+ → oil volatile
//   - PMI → currency direction follows
//
// These rules are derived from decades of empirical market behavior
// (Fed's "dot plot", BIS market impact studies, etc.) and encoded as
// deterministic heuristics so they don't require an AI API call per event.

export type ImpactDirection = 'up' | 'down' | 'neutral' | 'volatile';
export type ImpactTier = 'high' | 'medium' | 'low';

export interface AssetImpact {
  symbol: string;
  direction: ImpactDirection;
  magnitude: number; // 1-3 (low/medium/high magnitude within the direction)
}

export interface PreImpactAssessment {
  score: number;              // 0-100
  tier: ImpactTier;
  confidence: number;         // 0-1
  historicalNote: string;     // human-readable historical context
  assetImpacts: AssetImpact[]; // predictions for 6 assets
  topAsset: string;           // most-affected asset symbol
  topImpact: AssetImpact;     // most-affected asset's prediction
}

// Asset symbols we predict impact for
export const TRACKED_ASSETS = [
  { symbol: 'XAU', labelKey: 'gold' },
  { symbol: 'WTI', labelKey: 'oil' },
  { symbol: 'BTC', labelKey: 'btc' },
  { symbol: 'SPX', labelKey: 'sp500' },
  { symbol: 'DXY', labelKey: 'dxy' },
  { symbol: 'EURUSD', labelKey: 'eurusd' },
] as const;

// ─── Event-type heuristics ─────────────────────────────────────
// Each rule defines:
//   - scoreBoost: how much this event type adds to the Pre-Impact Score
//   - confidence: base confidence for this rule (0-1)
//   - historicalNote: short note about typical market reaction
//   - assetImpacts: directional predictions for 6 assets
interface EventRule {
  pattern: RegExp;
  scoreBoost: number;
  confidence: number;
  historicalNote: Record<string, string>; // locale → note
  assetImpacts: AssetImpact[];
}

const EVENT_RULES: EventRule[] = [
  // ─── Central bank rate decisions (highest impact) ───
  {
    pattern: /\b(fed|fomc|interest rate|rate decision|policy rate|federal funds)\b/i,
    scoreBoost: 35,
    confidence: 0.88,
    historicalNote: {
      ar: 'قرارات الفيدرالي تحرك الذهب بمتوسط ±2.5% خلال 48 ساعة',
      en: 'Fed decisions move gold by avg ±2.5% within 48h historically',
      fr: 'Les décisions de la Fed font varier l\'or de ±2,5% en 48h',
      tr: 'Fed kararları altını 48s içinde ortalama ±%2.5 etkiler',
      es: 'Las decisiones de la Fed mueven el oro ±2.5% en 48h',
    },
    assetImpacts: [
      { symbol: 'XAU', direction: 'volatile', magnitude: 3 },
      { symbol: 'DXY', direction: 'volatile', magnitude: 3 },
      { symbol: 'SPX', direction: 'volatile', magnitude: 3 },
      { symbol: 'BTC', direction: 'volatile', magnitude: 2 },
      { symbol: 'EURUSD', direction: 'volatile', magnitude: 2 },
      { symbol: 'WTI', direction: 'neutral', magnitude: 1 },
    ],
  },
  // ─── ECB rate decisions ───
  {
    pattern: /\b(ecb|european central|refinancing rate)\b/i,
    scoreBoost: 30,
    confidence: 0.85,
    historicalNote: {
      ar: 'قرارات البنك المركزي الأوروبي تحرك اليورو بمتوسط ±1.8%',
      en: 'ECB decisions move EUR by avg ±1.8% historically',
      fr: 'Les décisions de la BCE font varier l\'EUR de ±1,8%',
      tr: 'ECB kararları EUR\'u ortalama ±%1.8 etkiler',
      es: 'Las decisiones del BCE mueven el EUR ±1.8%',
    },
    assetImpacts: [
      { symbol: 'EURUSD', direction: 'volatile', magnitude: 3 },
      { symbol: 'DXY', direction: 'volatile', magnitude: 2 },
      { symbol: 'XAU', direction: 'volatile', magnitude: 2 },
      { symbol: 'SPX', direction: 'volatile', magnitude: 2 },
      { symbol: 'BTC', direction: 'neutral', magnitude: 1 },
      { symbol: 'WTI', direction: 'neutral', magnitude: 1 },
    ],
  },
  // ─── BOE rate decisions ───
  {
    pattern: /\b(boe|bank of england)\b/i,
    scoreBoost: 25,
    confidence: 0.82,
    historicalNote: {
      ar: 'قرارات بنك إنجلترا تحرك الجنيه بمتوسط ±1.4%',
      en: 'BOE decisions move GBP by avg ±1.4% historically',
      fr: 'Les décisions de la BoE font varier la GBP de ±1,4%',
      tr: 'BoE kararları GBP\'yi ortalama ±%1.4 etkiler',
      es: 'Las decisiones del BoE mueven la GBP ±1.4%',
    },
    assetImpacts: [
      { symbol: 'EURUSD', direction: 'volatile', magnitude: 2 },
      { symbol: 'DXY', direction: 'volatile', magnitude: 1 },
      { symbol: 'XAU', direction: 'volatile', magnitude: 1 },
      { symbol: 'SPX', direction: 'neutral', magnitude: 1 },
      { symbol: 'BTC', direction: 'neutral', magnitude: 1 },
      { symbol: 'WTI', direction: 'neutral', magnitude: 1 },
    ],
  },
  // ─── BOJ rate decisions ───
  {
    pattern: /\b(boj|bank of japan)\b/i,
    scoreBoost: 22,
    confidence: 0.80,
    historicalNote: {
      ar: 'قرارات بنك اليابان تحرك الين بمتوسط ±1.6%',
      en: 'BOJ decisions move JPY by avg ±1.6% historically',
      fr: 'Les décisions de la BoJ font varier le JPY de ±1,6%',
      tr: 'BoJ kararları JPY\'yi ortalama ±%1.6 etkiler',
      es: 'Las decisiones del BoJ mueven el JPY ±1.6%',
    },
    assetImpacts: [
      { symbol: 'DXY', direction: 'volatile', magnitude: 2 },
      { symbol: 'SPX', direction: 'volatile', magnitude: 1 },
      { symbol: 'XAU', direction: 'neutral', magnitude: 1 },
      { symbol: 'EURUSD', direction: 'volatile', magnitude: 1 },
      { symbol: 'BTC', direction: 'neutral', magnitude: 1 },
      { symbol: 'WTI', direction: 'neutral', magnitude: 1 },
    ],
  },
  // ─── CBRT (Turkey) ───
  {
    pattern: /\b(cbrt|turkey.*rate|turkish.*rate)\b/i,
    scoreBoost: 20,
    confidence: 0.75,
    historicalNote: {
      ar: 'قرارات البنك المركزي التركي تحرك الليرة بشدة',
      en: 'CBRT decisions move TRY sharply historically',
      fr: 'Les décisions du CBRT font fortement varier la TRY',
      tr: 'CBRT kararları TRY\'yi sert şekilde etkiler',
      es: 'Las decisiones del CBRT mueven la TRY bruscamente',
    },
    assetImpacts: [
      { symbol: 'EURUSD', direction: 'volatile', magnitude: 1 },
      { symbol: 'DXY', direction: 'neutral', magnitude: 1 },
      { symbol: 'XAU', direction: 'neutral', magnitude: 1 },
      { symbol: 'SPX', direction: 'neutral', magnitude: 1 },
      { symbol: 'BTC', direction: 'neutral', magnitude: 1 },
      { symbol: 'WTI', direction: 'neutral', magnitude: 1 },
    ],
  },
  // ─── CPI / Inflation data ───
  {
    pattern: /\b(cpi|consumer price|inflation|ppi|producer price)\b/i,
    scoreBoost: 28,
    confidence: 0.84,
    historicalNote: {
      ar: 'بيانات التضخم تحرك الذهب والدولار بمتوسط ±1.5%',
      en: 'Inflation data moves gold & dollar by avg ±1.5% historically',
      fr: 'Les données d\'inflation font varier l\'or et le dollar de ±1,5%',
      tr: 'Enflasyon verileri altın ve doları ortalama ±%1.5 etkiler',
      es: 'Los datos de inflación mueven oro y dólar ±1.5%',
    },
    assetImpacts: [
      { symbol: 'DXY', direction: 'up', magnitude: 3 },
      { symbol: 'XAU', direction: 'down', magnitude: 3 },
      { symbol: 'SPX', direction: 'down', magnitude: 2 },
      { symbol: 'BTC', direction: 'down', magnitude: 2 },
      { symbol: 'EURUSD', direction: 'down', magnitude: 2 },
      { symbol: 'WTI', direction: 'neutral', magnitude: 1 },
    ],
  },
  // ─── NFP / Employment ───
  {
    pattern: /\b(nfp|non.?farm|payroll|employment|unemployment|jobs)\b/i,
    scoreBoost: 26,
    confidence: 0.83,
    historicalNote: {
      ar: 'بيانات التوظيف تحرك الدولار والذهب بمتوسط ±1.2%',
      en: 'Employment data moves dollar & gold by avg ±1.2% historically',
      fr: 'Les données d\'emploi font varier le dollar et l\'or de ±1,2%',
      tr: 'İstihdam verileri dolar ve altını ortalama ±%1.2 etkiler',
      es: 'Los datos de empleo mueven dólar y oro ±1.2%',
    },
    assetImpacts: [
      { symbol: 'DXY', direction: 'up', magnitude: 3 },
      { symbol: 'XAU', direction: 'down', magnitude: 2 },
      { symbol: 'SPX', direction: 'up', magnitude: 2 },
      { symbol: 'EURUSD', direction: 'down', magnitude: 2 },
      { symbol: 'BTC', direction: 'down', magnitude: 1 },
      { symbol: 'WTI', direction: 'neutral', magnitude: 1 },
    ],
  },
  // ─── GDP ───
  {
    pattern: /\b(gdp|gross domestic)\b/i,
    scoreBoost: 20,
    confidence: 0.78,
    historicalNote: {
      ar: 'بيانات الناتج المحلي تحرك الأسهم بمتوسط ±0.8%',
      en: 'GDP data moves equities by avg ±0.8% historically',
      fr: 'Les données du PIB font varier les actions de ±0,8%',
      tr: 'GSYİH verileri hisseleri ortalama ±%0.8 etkiler',
      es: 'Los datos del PIB mueven las acciones ±0.8%',
    },
    assetImpacts: [
      { symbol: 'SPX', direction: 'up', magnitude: 2 },
      { symbol: 'DXY', direction: 'up', magnitude: 2 },
      { symbol: 'XAU', direction: 'down', magnitude: 1 },
      { symbol: 'BTC', direction: 'up', magnitude: 1 },
      { symbol: 'EURUSD', direction: 'down', magnitude: 1 },
      { symbol: 'WTI', direction: 'up', magnitude: 1 },
    ],
  },
  // ─── PMI ───
  {
    pattern: /\b(pmi|purchasing manager)\b/i,
    scoreBoost: 15,
    confidence: 0.72,
    historicalNote: {
      ar: 'بيانات PMI تحرك العملات بمتوسط ±0.6%',
      en: 'PMI data moves currencies by avg ±0.6% historically',
      fr: 'Les données PMI font varier les devises de ±0,6%',
      tr: 'PMI verileri dövizleri ortalama ±%0.6 etkiler',
      es: 'Los datos PMI mueven las divisas ±0.6%',
    },
    assetImpacts: [
      { symbol: 'DXY', direction: 'up', magnitude: 2 },
      { symbol: 'EURUSD', direction: 'down', magnitude: 2 },
      { symbol: 'SPX', direction: 'up', magnitude: 1 },
      { symbol: 'XAU', direction: 'down', magnitude: 1 },
      { symbol: 'BTC', direction: 'neutral', magnitude: 1 },
      { symbol: 'WTI', direction: 'neutral', magnitude: 1 },
    ],
  },
  // ─── Oil / Crude / OPEC ───
  {
    pattern: /\b(opec|crude|oil inventories|petroleum|wti|brent)\b/i,
    scoreBoost: 22,
    confidence: 0.80,
    historicalNote: {
      ar: 'بيانات النفط وأوبك تحرك النفط بمتوسط ±3%',
      en: 'Oil data & OPEC move crude by avg ±3% historically',
      fr: 'Les données pétrolières et l\'OPEP font varier le brut de ±3%',
      tr: 'Petrol verileri ve OPEP ham petrolü ortalama ±%3 etkiler',
      es: 'Los datos de petróleo y la OPEP mueven el crudo ±3%',
    },
    assetImpacts: [
      { symbol: 'WTI', direction: 'volatile', magnitude: 3 },
      { symbol: 'XAU', direction: 'neutral', magnitude: 1 },
      { symbol: 'DXY', direction: 'neutral', magnitude: 1 },
      { symbol: 'SPX', direction: 'neutral', magnitude: 1 },
      { symbol: 'BTC', direction: 'neutral', magnitude: 1 },
      { symbol: 'EURUSD', direction: 'neutral', magnitude: 1 },
    ],
  },
  // ─── Retail sales ───
  {
    pattern: /\b(retail sales|consumer spending)\b/i,
    scoreBoost: 14,
    confidence: 0.70,
    historicalNote: {
      ar: 'بيانات المبيعات التجزئة تحرك الأسهم الاستهلاكية',
      en: 'Retail sales data moves consumer stocks',
      fr: 'Les ventes au détail font varier les actions de consommation',
      tr: 'Perakende satış verileri tüketim hisselerini etkiler',
      es: 'Los datos de ventas minoristas mueven las acciones de consumo',
    },
    assetImpacts: [
      { symbol: 'SPX', direction: 'up', magnitude: 2 },
      { symbol: 'DXY', direction: 'up', magnitude: 1 },
      { symbol: 'XAU', direction: 'down', magnitude: 1 },
      { symbol: 'EURUSD', direction: 'down', magnitude: 1 },
      { symbol: 'BTC', direction: 'neutral', magnitude: 1 },
      { symbol: 'WTI', direction: 'neutral', magnitude: 1 },
    ],
  },
  // ─── Speeches / Testimony ───
  {
    pattern: /\b(speech|speaks|testimony|statement|press conference)\b/i,
    scoreBoost: 12,
    confidence: 0.65,
    historicalNote: {
      ar: 'خطابات المسؤولين قد تحرك الأسواق بشكل مفاجئ',
      en: 'Official speeches can move markets suddenly',
      fr: 'Les discours des responsables peuvent faire bouger les marchés',
      tr: 'Görevlilerin konuşmaları piyasaları aniden etkileyebilir',
      es: 'Los discursos de funcionarios pueden mover los mercados',
    },
    assetImpacts: [
      { symbol: 'XAU', direction: 'volatile', magnitude: 2 },
      { symbol: 'DXY', direction: 'volatile', magnitude: 2 },
      { symbol: 'SPX', direction: 'volatile', magnitude: 1 },
      { symbol: 'EURUSD', direction: 'volatile', magnitude: 1 },
      { symbol: 'BTC', direction: 'neutral', magnitude: 1 },
      { symbol: 'WTI', direction: 'neutral', magnitude: 1 },
    ],
  },
];

// ─── Importance multiplier ─────────────────────────────────────
// Higher importance events get higher scores
function getImportanceMultiplier(importance: string | number): number {
  if (typeof importance === 'number') {
    if (importance >= 3) return 1.2;   // critical/high
    if (importance === 2) return 1.0;  // medium
    return 0.7;                        // low
  }
  const imp = (importance || '').toLowerCase();
  if (imp === 'critical' || imp === 'high') return 1.2;
  if (imp === 'medium') return 1.0;
  return 0.7;
}

// ─── Main: assessPreImpact ─────────────────────────────────────
/**
 * Compute Pre-Impact Roua Score + Asset Impact Matrix for a single event.
 *
 * @param eventName Event name (English or Arabic)
 * @param importance Importance level — 'low'|'medium'|'high'|'critical' OR 1|2|3
 * @param locale Locale for the historical note (ar|en|fr|tr|es)
 */
export function assessPreImpact(
  eventName: string,
  importance: string | number,
  locale: string,
): PreImpactAssessment {
  const safeLocale = ['ar', 'en', 'fr', 'tr', 'es'].includes(locale) ? locale : 'en';

  // Default (no rule matched) — low impact
  const defaultAssessment: PreImpactAssessment = {
    score: 25,
    tier: 'low',
    confidence: 0.5,
    historicalNote: {
      ar: 'حدث اقتصادي ثانوي — تأثير محدود على الأسواق',
      en: 'Secondary economic event — limited market impact',
      fr: 'Événement économique secondaire — impact limité',
      tr: 'İkincil ekonomik olay — sınırlı piyasa etkisi',
      es: 'Evento económico secundario — impacto limitado',
    }[safeLocale],
    assetImpacts: TRACKED_ASSETS.map(a => ({
      symbol: a.symbol,
      direction: 'neutral' as ImpactDirection,
      magnitude: 1,
    })),
    topAsset: 'DXY',
    topImpact: { symbol: 'DXY', direction: 'neutral', magnitude: 1 },
  };

  // Find first matching rule
  let matchedRule: EventRule | null = null;
  for (const rule of EVENT_RULES) {
    if (rule.pattern.test(eventName)) {
      matchedRule = rule;
      break;
    }
  }

  if (!matchedRule) return defaultAssessment;

  // Apply importance multiplier
  const importanceMult = getImportanceMultiplier(importance);
  const baseScore = matchedRule.scoreBoost * importanceMult + 30;
  const score = Math.min(100, Math.round(baseScore));
  const tier: ImpactTier = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  const confidence = Math.min(0.95, matchedRule.confidence * importanceMult);

  // Sort asset impacts by magnitude (highest first)
  const sortedImpacts = [...matchedRule.assetImpacts].sort((a, b) => b.magnitude - a.magnitude);
  const topImpact = sortedImpacts[0];
  const topAsset = topImpact.symbol;

  return {
    score,
    tier,
    confidence: Math.round(confidence * 100) / 100,
    historicalNote: matchedRule.historicalNote[safeLocale] || matchedRule.historicalNote.en,
    assetImpacts: sortedImpacts,
    topAsset,
    topImpact,
  };
}

// ─── Helper: get a related-reports search URL for an event ───
/**
 * Builds a URL to the reports search page filtered by event name keywords.
 * Used for the "Related Analyses" RAG-style link feature.
 */
export function buildRelatedReportsUrl(eventName: string, locale: string): string {
  // Extract the 2-3 most important keywords from the event name
  const stopWords = new Set(['the', 'and', 'or', 'for', 'of', 'to', 'in', 'on', 'at', 'a', 'an', 'rate', 'decision', 'data', 'report']);
  const words = eventName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .slice(0, 3);
  const query = words.join(' ');
  const searchPath = locale === 'ar' ? '/reports/search' : `/${locale}/reports/search`;
  return query ? `${searchPath}?q=${encodeURIComponent(query)}` : searchPath;
}
