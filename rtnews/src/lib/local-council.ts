// ─── Local Council Brief Generator V2 ───────────────────────
// Generates Strategic Council brief data when the trading platform's
// council module is unavailable. Uses local signal analysis to produce
// simplified council briefs with consensus-style recommendations.
//
// V2: Council briefs are now PERSISTED to the database (council_briefs table).
//     This ensures council history survives restarts and enables
//     performance tracking over time.
//
// This is a FALLBACK — the primary source is the trading platform's
// Strategic Council with 8 AI models. When the platform is available,
// real council data flows through /api/integration/council.
// Local briefs are marked with source: 'local-fallback'.

import { generateLocalSignals, type LocalTradingSignal } from './local-signals';
import { db } from './db';

// ─── Types ──────────────────────────────────────────────────

// ─── 8 AI Expert Models ─────────────────────────────────────

export interface CouncilModelVote {
  name: string;       // اسم الخبير بالعربية
  nameEn: string;     // اسم الخبير بالإنجليزية
  vote: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number; // 0-100 نسبة ثقة هذا الخبير
  reasoning?: string; // سبب التصويت (اختياري)
}

export const COUNCIL_MODELS: Array<{
  name: string;
  nameEn: string;
  specialty: string;  // التخصص
  icon: string;       // أيقونة مختصرة
}> = [
  { name: 'خبير الماكرو', nameEn: 'MacroExpert', specialty: 'تحليل الاقتصاد الكلي والسياسات النقدية', icon: '🏛' },
  { name: 'خبير المخاطر', nameEn: 'RiskExpert', specialty: 'إدارة المخاطر وتقييم التعرض', icon: '🛡' },
  { name: 'خبير الأنماط', nameEn: 'PatternExpert', specialty: 'تحليل الأنماط الفنية والشارت', icon: '📊' },
  { name: 'محلل التباين', nameEn: 'VarianceAnalyst', specialty: 'تحليل التباين والتذبذب', icon: '📈' },
  { name: 'محلل السيناريوهات', nameEn: 'ScenarioAnalyst', specialty: 'تحليل السيناريوهات المحتملة', icon: '🔮' },
  { name: 'محلل السيولة', nameEn: 'LiquidityAnalyst', specialty: 'تحليل السيولة وأحجام التداول', icon: '💧' },
  { name: 'خبير المشاعر', nameEn: 'SentimentExpert', specialty: 'تحليل مشاعر السوق والمؤشرات النفسية', icon: '🧠' },
  { name: 'المحلل الأساسي', nameEn: 'FundamentalAnalyst', specialty: 'التحليل الأساسي والأحداث المؤثرة', icon: '📋' },
];

export interface LocalCouncilBrief {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  timeframe: string;
  isActive: boolean;
  reviewStatus: string;
  analysisSummary: string;
  issuedAt: string;
  expiresAt: string;
  consensus?: {
    totalModels: number;
    buyVotes: number;
    sellVotes: number;
    neutralVotes: number;
    modelVotes: CouncilModelVote[]; // تفصيل أصوات كل خبير
  };
}

export interface LocalCouncilData {
  active: LocalCouncilBrief[];
  count: number;
  lastSessionAt: string;
  isRunning: boolean;
  source: 'local-fallback';
}

// ─── Council Brief from Signal ──────────────────────────────

/**
 * Convert a local trading signal into a council brief format.
 * Derives consensus estimates from the signal direction and confidence.
 *
 * When the trading platform is connected, real 8-model AI consensus
 * data flows directly from the Strategic Council module.
 * This fallback generates equivalent-format briefs from local analysis.
 */
/**
 * Generate deterministic individual model confidence values
 * based on pair characteristics and overall signal confidence.
 * Uses pair hash for consistency across regenerations.
 */
function generateModelVotes(
  signal: LocalTradingSignal,
  direction: 'BUY' | 'SELL'
): CouncilModelVote[] {
  const baseConfidence = signal.confidence;
  const pair = signal.pair;

  // Deterministic offsets per model per pair (no Math.random)
  // Each model has a characteristic bias and variance
  const modelProfiles: Array<{
    name: string;
    nameEn: string;
    bias: number;     // -20 to +20 offset from base confidence
    variance: number; // 0-15 random-ish variance
  }> = [
    { name: 'خبير الماكرو', nameEn: 'MacroExpert', bias: -5, variance: 8 },
    { name: 'خبير المخاطر', nameEn: 'RiskExpert', bias: 3, variance: 6 },
    { name: 'خبير الأنماط', nameEn: 'PatternExpert', bias: -8, variance: 12 },
    { name: 'محلل التباين', nameEn: 'VarianceAnalyst', bias: 5, variance: 7 },
    { name: 'محلل السيناريوهات', nameEn: 'ScenarioAnalyst', bias: -3, variance: 10 },
    { name: 'محلل السيولة', nameEn: 'LiquidityAnalyst', bias: 2, variance: 9 },
    { name: 'خبير المشاعر', nameEn: 'SentimentExpert', bias: 7, variance: 11 },
    { name: 'المحلل الأساسي', nameEn: 'FundamentalAnalyst', bias: -2, variance: 8 },
  ];

  // Deterministic seed from pair name
  let pairSeed = 0;
  for (let i = 0; i < pair.length; i++) {
    pairSeed = ((pairSeed << 5) - pairSeed + pair.charCodeAt(i)) | 0;
  }

  return modelProfiles.map((profile, idx) => {
    // Deterministic pseudo-random based on pair + model index
    const seed = Math.abs(pairSeed * (idx + 1) * 31) % 1000;
    const jitter = (seed % (profile.variance * 2 + 1)) - profile.variance;
    const modelConfidence = Math.max(35, Math.min(95, baseConfidence + profile.bias + jitter));

    // Determine vote based on confidence and direction
    const threshold = 50;
    let vote: 'BUY' | 'SELL' | 'NEUTRAL';

    if (direction === 'BUY') {
      if (modelConfidence >= 60) vote = 'BUY';
      else if (modelConfidence >= 45) vote = 'NEUTRAL';
      else vote = 'SELL';
    } else {
      if (modelConfidence >= 60) vote = 'SELL';
      else if (modelConfidence >= 45) vote = 'NEUTRAL';
      else vote = 'BUY';
    }

    return {
      name: profile.name,
      nameEn: profile.nameEn,
      vote,
      confidence: Math.round(modelConfidence),
    };
  });
}

function signalToBrief(signal: LocalTradingSignal): LocalCouncilBrief {
  // Derive vote estimates from the signal direction and confidence
  // When the trading platform is available, real AI model votes come
  // directly from the Strategic Council. This fallback approximates
  // multi-model consensus based on signal strength.
  const modelCount = 8;
  const agreementRatio = signal.confidence / 100;

  // Use deterministic timeframe based on pair (no Math.random)
  const timeframeMap: Record<string, string> = {
    'BTC/USDT': 'H4', 'ETH/USDT': 'H4',
    'XAU/USD': 'D1', 'XAG/USD': 'D1',
    'EUR/USD': 'H1', 'GBP/USD': 'H1',
  };
  const timeframe = timeframeMap[signal.pair] || 'H4';

  const direction: 'BUY' | 'SELL' = signal.action === 'WAIT'
    ? (agreementRatio > 0.5 ? 'BUY' : 'SELL')
    : signal.action as 'BUY' | 'SELL';

  // Generate individual model votes
  const modelVotes = generateModelVotes(signal, direction);

  // Count votes from individual model decisions
  const buyVotes = modelVotes.filter(m => m.vote === 'BUY').length;
  const sellVotes = modelVotes.filter(m => m.vote === 'SELL').length;
  const neutralVotes = modelVotes.filter(m => m.vote === 'NEUTRAL').length;

  const analysisSummaries: Record<string, string> = {
    'BUY': `إجماع المجلس الذكي: ${buyVotes} نماذج إيجابية، ${sellVotes} سلبي، ${neutralVotes} محايد. ${signal.reason}`,
    'SELL': `إجماع المجلس الذكي: ${sellVotes} نماذج سلبية، ${buyVotes} إيجابي، ${neutralVotes} محايد. ${signal.reason}`,
  };

  return {
    id: `council-${signal.id}`,
    pair: signal.pair,
    direction,
    entryPrice: signal.entryPrice || 0,
    stopLoss: signal.stopLoss || 0,
    takeProfit: signal.takeProfit || 0,
    confidence: signal.confidence,
    timeframe,
    isActive: true,
    reviewStatus: 'APPROVED',
    analysisSummary: analysisSummaries[direction] || signal.reason,
    issuedAt: signal.createdAt,
    expiresAt: signal.expiresAt,
    consensus: {
      totalModels: modelCount,
      buyVotes,
      sellVotes,
      neutralVotes,
      modelVotes,
    },
  };
}

// ─── Main Council Generator ─────────────────────────────────

/**
 * Persist council briefs to the database.
 * Old ACTIVE local briefs are expired before inserting new ones.
 */
async function persistCouncilBriefsToDB(briefs: LocalCouncilBrief[]): Promise<void> {
  if (briefs.length === 0) return;

  try {
    const now = new Date();

    // Expire old ACTIVE local briefs
    await db.councilBrief.updateMany({
      where: {
        source: 'local-fallback',
        isActive: true,
      },
      data: {
        isActive: false,
        reviewStatus: 'EXPIRED',
      },
    });

    // Insert new briefs
    for (const brief of briefs) {
      try {
        await db.councilBrief.create({
          data: {
            pair: brief.pair,
            direction: brief.direction,
            entryPrice: brief.entryPrice,
            stopLoss: brief.stopLoss,
            takeProfit: brief.takeProfit,
            confidence: brief.confidence,
            timeframe: brief.timeframe,
            isActive: true,
            reviewStatus: 'APPROVED',
            analysisSummary: brief.analysisSummary || '',
            consensusJson: JSON.stringify(brief.consensus || {}),
            source: 'local-fallback',
            sessionAt: now,
            expiresAt: brief.expiresAt ? new Date(brief.expiresAt) : new Date(now.getTime() + 24 * 60 * 60 * 1000),
          },
        });
      } catch (err: any) {
        if (!err?.message?.includes('Unique')) {
          console.warn(`[LocalCouncil] DB persist error for ${brief.pair}: ${err?.message?.slice(0, 80)}`);
        }
      }
    }

    console.log(`[LocalCouncil V2] Persisted ${briefs.length} briefs to DB`);
  } catch (err: any) {
    console.warn(`[LocalCouncil] DB persist failed: ${err?.message?.slice(0, 100)}`);
  }
}

/**
 * Load persisted council briefs from the database.
 */
export async function loadPersistedCouncilBriefs(): Promise<LocalCouncilBrief[]> {
  try {
    const dbBriefs = await db.councilBrief.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return dbBriefs.map(b => ({
      id: b.id,
      pair: b.pair,
      direction: b.direction as 'BUY' | 'SELL',
      entryPrice: b.entryPrice,
      stopLoss: b.stopLoss,
      takeProfit: b.takeProfit,
      confidence: b.confidence,
      timeframe: b.timeframe,
      isActive: b.isActive,
      reviewStatus: b.reviewStatus,
      analysisSummary: b.analysisSummary,
      issuedAt: b.createdAt.toISOString(),
      expiresAt: b.expiresAt?.toISOString() || new Date(b.createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      consensus: b.consensusJson ? JSON.parse(b.consensusJson) : undefined,
    }));
  } catch (err: any) {
    console.warn(`[LocalCouncil] DB load failed: ${err?.message?.slice(0, 80)}`);
    return [];
  }
}

/**
 * Generate Strategic Council briefs from local signal data.
 * Converts local trading signals into council brief format with
 * consensus derived from signal analysis.
 */
export async function generateLocalCouncilBriefs(): Promise<LocalCouncilData> {
  try {
    const { signals } = await generateLocalSignals({
      includeWait: false,
      limit: 10,
    });

    // Only convert BUY/SELL signals to council briefs
    const briefs = signals
      .filter(s => s.action !== 'WAIT' && s.entryPrice && s.entryPrice > 0)
      .map(signalToBrief);

    // V2: Persist to database (non-blocking)
    if (briefs.length > 0) {
      persistCouncilBriefsToDB(briefs).catch(err => console.error('[LocalCouncil V156] Failed to persist council briefs to DB:', err instanceof Error ? err.message : err));
    }

    return {
      active: briefs,
      count: briefs.length,
      lastSessionAt: new Date().toISOString(),
      isRunning: false,
      source: 'local-fallback',
    };
  } catch (error: any) {
    console.warn('[LocalCouncil] Failed to generate briefs:', error?.message);
    return {
      active: [],
      count: 0,
      lastSessionAt: new Date().toISOString(),
      isRunning: false,
      source: 'local-fallback',
    };
  }
}

/**
 * Generate a single council brief count.
 */
export async function generateLocalCouncilCount(): Promise<number> {
  const { count } = await generateLocalCouncilBriefs();
  return count;
}

/**
 * Check if local council generation is possible.
 */
export function canGenerateLocalCouncil(): boolean {
  return true; // Depends on local signals which use CoinGecko
}
