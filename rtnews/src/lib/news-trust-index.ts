// ═══════════════════════════════════════════════════════════════════
// News Trust Index — Source Reliability Scoring
// ═══════════════════════════════════════════════════════════════════
// Classifies news sources into 3 reliability tiers based on industry reputation.
// Inspired by NewsGuard / AllSides / Ad Fontes Media methodology.
//
// Tier HIGH (90-100): Tier-1 financial wire services with strict editorial standards.
//   Examples: Reuters, Bloomberg, Financial Times, Wall Street Journal, CNBC, AP.
//
// Tier MEDIUM (60-89): Reputable general news or regional outlets that cover
//   financial news accurately but with less specialization.
//   Examples: Al Jazeera, BBC, CNN, The Guardian, Sky News, Al Arabiya.
//
// Tier LOW (30-59): Aggregators, blogs, or sources requiring independent verification.
//   Examples: CryptoSlate, Reddit, anonymous blogs, RSS aggregators.
//
// Tier UNKNOWN (<30): New/unrecognized sources — flagged for verification.

export type TrustTier = 'high' | 'medium' | 'low' | 'unknown';

export interface TrustInfo {
  tier: TrustTier;
  score: number;        // 0-100
  labelAr: string;
  labelEn: string;
  labelFr: string;
  labelTr: string;
  labelEs: string;
  color: string;
  bg: string;
  border: string;
  icon: string;         // emoji or single char
}

// ─── Source Reputation Database ─────────────────────────────────
// Sources are matched by case-insensitive substring against the source field
// returned by the news pipeline. Order matters: longer/more specific patterns first.
const SOURCE_RULES: Array<{ pattern: string; tier: TrustTier; score: number }> = [
  // ─── Tier 1: Financial wire services ───
  { pattern: 'reuters', tier: 'high', score: 98 },
  { pattern: 'bloomberg', tier: 'high', score: 97 },
  { pattern: 'financial times', tier: 'high', score: 96 },
  { pattern: 'ft.com', tier: 'high', score: 96 },
  { pattern: 'wall street journal', tier: 'high', score: 95 },
  { pattern: 'wsj', tier: 'high', score: 95 },
  { pattern: 'cnbc', tier: 'high', score: 93 },
  { pattern: 'associated press', tier: 'high', score: 95 },
  { pattern: 'ap news', tier: 'high', score: 95 },
  { pattern: 'marketwatch', tier: 'high', score: 92 },
  { pattern: 'investing.com', tier: 'high', score: 90 },
  { pattern: 'barron', tier: 'high', score: 92 },
  { pattern: 'yfinance', tier: 'high', score: 88 },
  { pattern: 'yahoo finance', tier: 'high', score: 90 },
  { pattern: 'investor business', tier: 'high', score: 91 },
  { pattern: 'ibd', tier: 'high', score: 91 },

  // ─── Tier 1: Central banks / official ───
  { pattern: 'federal reserve', tier: 'high', score: 100 },
  { pattern: 'fed reserve', tier: 'high', score: 100 },
  { pattern: 'ecb', tier: 'high', score: 99 },
  { pattern: 'european central bank', tier: 'high', score: 99 },
  { pattern: 'bank of japan', tier: 'high', score: 99 },
  { pattern: 'boj', tier: 'high', score: 99 },
  { pattern: 'imf', tier: 'high', score: 99 },
  { pattern: 'world bank', tier: 'high', score: 99 },
  { pattern: 'treasury', tier: 'high', score: 95 },
  { pattern: 'sama', tier: 'high', score: 98 },           // Saudi Central Bank
  { pattern: 'central bank', tier: 'high', score: 95 },

  // ─── Tier 2: Reputable general news ───
  { pattern: 'al jazeera', tier: 'medium', score: 82 },
  { pattern: 'aljazeera', tier: 'medium', score: 82 },
  { pattern: 'bbc', tier: 'medium', score: 88 },
  { pattern: 'cnn', tier: 'medium', score: 80 },
  { pattern: 'cnn business', tier: 'medium', score: 85 },
  { pattern: 'the guardian', tier: 'medium', score: 84 },
  { pattern: 'guardian', tier: 'medium', score: 84 },
  { pattern: 'sky news', tier: 'medium', score: 80 },
  { pattern: 'al arabiya', tier: 'medium', score: 80 },
  { pattern: 'alarabiya', tier: 'medium', score: 80 },
  { pattern: 'al ain news', tier: 'medium', score: 75 },
  { pattern: 'asharq', tier: 'medium', score: 80 },
  { pattern: 'rt arabic', tier: 'medium', score: 65 },
  { pattern: 'rt.com', tier: 'medium', score: 65 },
  { pattern: 'the national', tier: 'medium', score: 82 },
  { pattern: 'gulf news', tier: 'medium', score: 78 },
  { pattern: 'arab news', tier: 'medium', score: 80 },
  { pattern: 'middle east eye', tier: 'medium', score: 70 },
  { pattern: 'daily sabah', tier: 'medium', score: 75 },
  { pattern: 'hurriyet', tier: 'medium', score: 75 },
  { pattern: 'anadolu', tier: 'medium', score: 78 },
  { pattern: 'le monde', tier: 'medium', score: 86 },
  { pattern: 'les echos', tier: 'medium', score: 84 },
  { pattern: 'el pais', tier: 'medium', score: 84 },
  { pattern: 'expansion', tier: 'medium', score: 82 },
  { pattern: 'nikkei', tier: 'medium', score: 88 },
  { pattern: 'south china morning', tier: 'medium', score: 80 },
  { pattern: 'scmp', tier: 'medium', score: 80 },

  // ─── Tier 2: Crypto specialized ───
  { pattern: 'coindesk', tier: 'medium', score: 80 },
  { pattern: 'cointelegraph', tier: 'medium', score: 75 },
  { pattern: 'decrypt', tier: 'medium', score: 70 },
  { pattern: 'the block', tier: 'medium', score: 78 },
  { pattern: 'bitcoinist', tier: 'low', score: 55 },

  // ─── Tier 3: Aggregators / blogs ───
  { pattern: 'cryptoslate', tier: 'low', score: 50 },
  { pattern: 'newsbtc', tier: 'low', score: 45 },
  { pattern: 'reddit', tier: 'low', score: 30 },
  { pattern: 'twitter', tier: 'low', score: 30 },
  { pattern: 'x.com', tier: 'low', score: 30 },
  { pattern: 'medium.com', tier: 'low', score: 40 },
  { pattern: 'substack', tier: 'low', score: 45 },
  { pattern: 'rss', tier: 'low', score: 40 },
];

// In-memory cache for source lookups (saves repeated substring scans)
const sourceCache = new Map<string, TrustInfo>();

const TIER_INFO: Record<TrustTier, Omit<TrustInfo, 'score'>> = {
  high: {
    tier: 'high',
    labelAr: 'موثوقية عالية',
    labelEn: 'High Reliability',
    labelFr: 'Haute fiabilité',
    labelTr: 'Yüksek Güvenilirlik',
    labelEs: 'Alta Confiabilidad',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.25)',
    icon: '✓',
  },
  medium: {
    tier: 'medium',
    labelAr: 'مصداقية متوسطة',
    labelEn: 'Medium Credibility',
    labelFr: 'Crédibilité moyenne',
    labelTr: 'Orta Kredi',
    labelEs: 'Credibilidad Media',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
    icon: '~',
  },
  low: {
    tier: 'low',
    labelAr: 'يتطلب تحقق',
    labelEn: 'Verification Needed',
    labelFr: 'Vérification requise',
    labelTr: 'Doğrulama Gerekli',
    labelEs: 'Verificación Requerida',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.25)',
    icon: '!',
  },
  unknown: {
    tier: 'unknown',
    labelAr: 'قيد المراجعة',
    labelEn: 'Pending Review',
    labelFr: 'En révision',
    labelTr: 'İnceleme Bekliyor',
    labelEs: 'En Revisión',
    color: '#64748B',
    bg: 'rgba(100,116,139,0.10)',
    border: 'rgba(100,116,139,0.20)',
    icon: '?',
  },
};

/**
 * Get trust tier + score for a given source name.
 * Cached for performance — repeated calls with the same source are O(1).
 */
export function getSourceTrust(source: string | undefined | null): TrustInfo {
  if (!source || typeof source !== 'string' || source.trim().length === 0) {
    return { ...TIER_INFO.unknown, score: 0 };
  }

  const key = source.toLowerCase().trim();
  const cached = sourceCache.get(key);
  if (cached) return cached;

  // Find the first matching rule (rules are ordered by specificity)
  let matchedTier: TrustTier = 'unknown';
  let matchedScore = 25;

  for (const rule of SOURCE_RULES) {
    if (key.includes(rule.pattern)) {
      matchedTier = rule.tier;
      matchedScore = rule.score;
      break;
    }
  }

  // Heuristic: if source URL ends in .gov / .org / central-bank domain, bump tier
  if (matchedTier === 'unknown') {
    if (/\.(gov|fed)\b/.test(key) || /central-bank/.test(key)) {
      matchedTier = 'high';
      matchedScore = 95;
    } else if (/\.org\b/.test(key)) {
      matchedTier = 'medium';
      matchedScore = 70;
    }
  }

  const result: TrustInfo = { ...TIER_INFO[matchedTier], score: matchedScore };
  sourceCache.set(key, result);
  return result;
}

/**
 * Get a localized label for the trust tier.
 */
export function getTrustLabel(tier: TrustTier, locale: string): string {
  const info = TIER_INFO[tier];
  if (locale === 'ar') return info.labelAr;
  if (locale === 'fr') return info.labelFr;
  if (locale === 'tr') return info.labelTr;
  if (locale === 'es') return info.labelEs;
  return info.labelEn;
}
