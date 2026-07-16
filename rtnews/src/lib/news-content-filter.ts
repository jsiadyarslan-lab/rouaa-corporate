// ═══════════════════════════════════════════════════════════════════
// News Content Filter — Block non-financial content + dedupe by title hash
// ═══════════════════════════════════════════════════════════════════
// Problem: The news pipeline ingests RSS feeds that sometimes carry
// non-financial articles (sports, entertainment, celebrity gossip, health,
// lifestyle). On a financial platform like Roua, these erode credibility.
//
// Solution:
// 1. BLOCKLIST: Reject any article whose title matches known non-financial
//    keywords (sports teams, celebrity names, entertainment shows, etc.).
// 2. DEDUPE: Drop articles with the same normalized title hash (case-folded,
//    whitespace-collapsed, punctuation-stripped). Keeps the freshest copy.
// 3. ALLOWLIST OVERRIDE: If the title contains strong financial keywords
//    (e.g. "earnings", "Fed", "BTC", "oil"), the blocklist is bypassed —
//    this prevents accidentally hiding legitimate news that happens to
//    mention a sports team owner or a celebrity-invested company.

// ─── Blocklist: Strong non-financial signals ───
// Order matters — these are checked as case-insensitive whole-word matches.
const BLOCKLIST_PATTERNS: RegExp[] = [
  // Sports
  /\b(football|soccer|basketball|baseball|cricket|hockey|tennis|golf|boxing|ufc|mma|f1|nascar|league match|champions league|la liga|premier league|serie a|bundesliga|nba|nfl|nhl|mlb|psg|real madrid|barcelona|liverpool|manchester|chelsea|arsenal|juventus|bayern)\b/i,
  // Entertainment / celebrity
  /\b(kardashian|jenner|taylor swift|kim kardashian|kanye west|beyonce|jay-z|drake|rihanna|selena gomez|justin bieber|kpop|bts|blackpink|hollywood gossip|celebrity|red carpet|oscar|emmy|grammy|golden globe|cannes film|tribeca film)\b/i,
  // Gaming
  /\b(video game|playstation|xbox|nintendo|twitch streamer|fortnite|minecraft|call of duty|league of legends|valorant|esports|gamer|gameplay|walkthrough)\b/i,
  // Lifestyle / gossip / health
  /\b(kardashian|kim k|beauty tip|workout routine|diet plan|weight loss|yoga pose|meditation retreat|fashion week|runway show|met gala|kim k fashion|celebrity diet|celebrity wedding|celebrity divorce|celebrity baby)\b/i,
  // Weather (non-market-affecting)
  /\b(weather forecast|rainy day|sunny weekend|snowstorm|heat wave|tornado warning|hurricane track)\b/i,
  // Pure crime / accidents (unless they affect markets)
  /\b(car crash|traffic accident|shooting spree|homicide|murder mystery|true crime|kidnapping|armed robbery)\b/i,
];

// ─── Allowlist: Strong financial signals (override blocklist) ───
const ALLOWLIST_PATTERNS: RegExp[] = [
  /\b(stock|share|equity|bond|treasury|yield|fed|ecb|boj|interest rate|inflation|cpi|gdp|unemployment|nonfarm|nfp|pmi|ism)\b/i,
  /\b(bitcoin|btc|ethereum|eth|crypto|cryptocurrency|altcoin|stablecoin|defi|nft|blockchain|mining|hashrate)\b/i,
  /\b(oil|crude|brent|wti|natural gas|gold|silver|copper|platinum|palladium|commodity|commodities|energy|opec)\b/i,
  /\b(forex|currency|dollar|euro|yen|pound|franc|usd|eur|jpy|gbp|chf|exchange rate|central bank)\b/i,
  /\b(earnings|revenue|profit|loss|guidance|quarterly|annual report|ipo|spac|merger|acquisition|buyback|dividend)\b/i,
  /\b(bull market|bear market|rally|selloff|correction|crash|volatility|vix|s&p|nasdaq|dow jones|nikkei|dax|ftse|cac|hang seng)\b/i,
  /\b(tariff|trade war|sanction|embargo|trade deal|wto|imf|world bank|geopolitical|embargo)\b/i,
  /\b(real estate|housing|mortgage|refi|housing market|property| REIT |commercial real estate|cre market)\b/i,
];

// ─── Title normalization for deduplication ───
// Strips punctuation, collapses whitespace, lowercases — produces a stable
// hash key for "is this article basically the same headline?" detection.
export function normalizeTitle(title: string): string {
  return (title || '')
    .toLowerCase()
    // Replace Arabic Presentation Forms with basic forms (helps cross-script dedup)
    .normalize('NFKC')
    // Strip all punctuation
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
    // Take first 120 chars — long titles with different suffixes are still the same article
    .slice(0, 120);
}

/**
 * Should this article be filtered out as non-financial?
 * Returns true if it should be REJECTED (blocked).
 */
export function isNonFinancial(title: string, summary?: string): boolean {
  const text = `${title || ''} ${summary || ''}`;

  // Allowlist override — if any strong financial signal is present, keep the article
  for (const pattern of ALLOWLIST_PATTERNS) {
    if (pattern.test(text)) return false;
  }

  // Blocklist — reject if any non-financial signal matches
  for (const pattern of BLOCKLIST_PATTERNS) {
    if (pattern.test(title || '')) return true;
  }

  return false;
}

/**
 * Filter an array of news items:
 *   - Drops non-financial articles (blocklist + allowlist logic)
 *   - Deduplicates by normalized title (keeps the most recent copy)
 *
 * Pure function — does not mutate input. Safe to use in server components.
 */
export function filterFinancialNews<T extends { title?: string; summary?: string; time?: string; fetchedAt?: string | Date }>(
  items: T[],
): T[] {
  const seen = new Map<string, T>();

  // Sort by date desc first (so we keep the freshest copy of any duplicate)
  const sorted = [...items].sort((a, b) => {
    const aTime = a.time ? new Date(a.time).getTime() : a.fetchedAt ? new Date(a.fetchedAt).getTime() : 0;
    const bTime = b.time ? new Date(b.time).getTime() : b.fetchedAt ? new Date(b.fetchedAt).getTime() : 0;
    return bTime - aTime;
  });

  for (const item of sorted) {
    if (!item.title || item.title.trim().length === 0) continue;

    // Blocklist filter
    if (isNonFinancial(item.title, item.summary)) continue;

    // Dedupe by normalized title
    const key = normalizeTitle(item.title);
    if (key.length < 10) continue;           // too short to be meaningful
    if (seen.has(key)) continue;

    seen.set(key, item);
  }

  return Array.from(seen.values());
}

/**
 * Estimate the market-impact direction of a news item from its affectedAssets
 * field. Returns a short hint string in the requested locale.
 *
 * Example output (ar): "قد يضغط على أسعار النفط"
 * Example output (en): "May pressure oil prices"
 *
 * Falls back to sentiment-based generic hint when no affectedAssets data.
 */
export function deriveMarketImpactHint(
  item: {
    sentiment?: string;
    impactLevel?: string;
    affectedAssets?: Array<{ symbol: string; direction?: string }> | string;
    category?: string;
  },
  locale: string,
): { text: string; tone: 'bullish' | 'bearish' | 'neutral'; confidence: number } | null {
  // Parse affectedAssets if it's a JSON string
  let assets: Array<{ symbol: string; direction?: string }> = [];
  if (item.affectedAssets) {
    try {
      const parsed = typeof item.affectedAssets === 'string'
        ? JSON.parse(item.affectedAssets)
        : item.affectedAssets;
      if (Array.isArray(parsed)) {
        assets = parsed.map((a: any) => ({
          symbol: typeof a?.symbol === 'string' ? a.symbol : String(a?.symbol || ''),
          direction: typeof a?.direction === 'string' ? a.direction : undefined,
        }));
      }
    } catch {
      // ignore parse errors
    }
  }

  // If we have explicit affected assets with direction, build a targeted hint
  if (assets.length > 0 && assets[0]?.symbol) {
    const firstAsset = assets[0];
    const symbol = firstAsset.symbol.toUpperCase();
    const direction = (firstAsset.direction || '').toLowerCase();

    // Asset name lookup (locale-aware)
    const assetNames: Record<string, Record<string, string>> = {
      BTC: { ar: 'البيتكوين', en: 'Bitcoin', fr: 'Bitcoin', tr: 'Bitcoin', es: 'Bitcoin' },
      ETH: { ar: 'الإيثيريوم', en: 'Ethereum', fr: 'Ethereum', tr: 'Ethereum', es: 'Ethereum' },
      XAU: { ar: 'الذهب', en: 'Gold', fr: 'Or', tr: 'Altın', es: 'Oro' },
      XAG: { ar: 'الفضة', en: 'Silver', fr: 'Argent', tr: 'Gümüş', es: 'Plata' },
      OIL: { ar: 'النفط', en: 'Oil', fr: 'Pétrole', tr: 'Petrol', es: 'Petróleo' },
      WTI: { ar: 'نفط غرب تكساس', en: 'WTI Crude', fr: 'WTI', tr: 'WTI', es: 'WTI' },
      BRENT: { ar: 'برنت', en: 'Brent', fr: 'Brent', tr: 'Brent', es: 'Brent' },
      SPX: { ar: 'مؤشر S&P 500', en: 'S&P 500', fr: 'S&P 500', tr: 'S&P 500', es: 'S&P 500' },
      DJI: { ar: 'داو جونز', en: 'Dow Jones', fr: 'Dow Jones', tr: 'Dow Jones', es: 'Dow Jones' },
      NDX: { ar: 'ناسداك 100', en: 'Nasdaq 100', fr: 'Nasdaq 100', tr: 'Nasdaq 100', es: 'Nasdaq 100' },
      USD: { ar: 'الدولار', en: 'Dollar', fr: 'Dollar', tr: 'Dolar', es: 'Dólar' },
      EUR: { ar: 'اليورو', en: 'Euro', fr: 'Euro', tr: 'Euro', es: 'Euro' },
      JPY: { ar: 'الين', en: 'Yen', fr: 'Yen', tr: 'Yen', es: 'Yen' },
      GBP: { ar: 'الجنيه', en: 'Pound', fr: 'Livre', tr: 'Sterlin', es: 'Libra' },
    };
    const assetName = (assetNames[symbol]?.[locale]) || (assetNames[symbol]?.en) || symbol;

    const localeMap: Record<string, { up: string; down: string; mixed: string; vol: string }> = {
      ar: {
        up: 'قد يدفع {asset} نحو الارتفاع',
        down: 'قد يضغط على {asset} للانخفاض',
        mixed: 'تأثير مختلط على {asset}',
        vol: 'قد يرفع تذبذب {asset}',
      },
      en: {
        up: 'May lift {asset}',
        down: 'May pressure {asset} lower',
        mixed: 'Mixed impact on {asset}',
        vol: 'May increase {asset} volatility',
      },
      fr: {
        up: 'Peut soutenir {asset}',
        down: 'Peut peser sur {asset}',
        mixed: 'Impact mixte sur {asset}',
        vol: 'Peut augmenter la volatilité de {asset}',
      },
      tr: {
        up: '{asset}\'i yükseltebilir',
        down: '{asset}\'e baskı yapabilir',
        mixed: '{asset} üzerinde karma etki',
        vol: '{asset} oynaklığını artırabilir',
      },
      es: {
        up: 'Puede impulsar {asset}',
        down: 'Puede presionar {asset} a la baja',
        mixed: 'Impacto mixto en {asset}',
        vol: 'Puede aumentar la volatilidad de {asset}',
      },
    };
    const tmpl = localeMap[locale] || localeMap.en;

    let text: string;
    let tone: 'bullish' | 'bearish' | 'neutral' = 'neutral';

    if (direction.includes('up') || direction.includes('bull') || direction.includes('long')) {
      text = tmpl.up.replace('{asset}', assetName);
      tone = 'bullish';
    } else if (direction.includes('down') || direction.includes('bear') || direction.includes('short')) {
      text = tmpl.down.replace('{asset}', assetName);
      tone = 'bearish';
    } else if (direction.includes('volat')) {
      text = tmpl.vol.replace('{asset}', assetName);
    } else {
      text = tmpl.mixed.replace('{asset}', assetName);
    }

    return {
      text,
      tone,
      confidence: item.impactLevel === 'high' ? 0.85 : item.impactLevel === 'medium' ? 0.65 : 0.45,
    };
  }

  // Fallback: derive hint from sentiment + impact level
  const sentiment = (item.sentiment || 'neutral').toLowerCase();
  const impactLevel = (item.impactLevel || 'low').toLowerCase();

  if (impactLevel === 'low') return null;        // not significant enough

  const fallbackMap: Record<string, Record<string, string>> = {
    ar: {
      positive: 'قد يدعم أسواق المخاطرة',
      negative: 'قد يدفع المستثمرين نحو الأصول الآمنة',
      neutral: 'تأثير محدود على المدى القصير',
    },
    en: {
      positive: 'May support risk assets',
      negative: 'May drive investors to safe havens',
      neutral: 'Limited short-term impact',
    },
    fr: {
      positive: 'Peut soutenir les actifs risqués',
      negative: 'Peut pousser les investisseurs vers les valeurs refuges',
      neutral: 'Impact à court terme limité',
    },
    tr: {
      positive: 'Risk varlıklarını destekleyebilir',
      negative: 'Yatırımcıları güvenli limanlara itebilir',
      neutral: 'Kısa vadeli etkisi sınırlı',
    },
    es: {
      positive: 'Puede respaldar activos de riesgo',
      negative: 'Puede impulsar a los inversores hacia refugios seguros',
      neutral: 'Impacto limitado a corto plazo',
    },
  };
  const map = fallbackMap[locale] || fallbackMap.en;
  const text = map[sentiment] || map.neutral;

  return {
    text,
    tone: sentiment === 'positive' ? 'bullish' : sentiment === 'negative' ? 'bearish' : 'neutral',
    confidence: impactLevel === 'high' ? 0.7 : 0.5,
  };
}
