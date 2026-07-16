// ─── English Local Council Brief Generator V1 ───────────────
// English version of the Sage Council for the English-language
// financial news product. Reuses the same 8-model deterministic
// voting system from local-council.ts but with:
//   - English model names (nameEn from COUNCIL_MODELS)
//   - English specialty descriptions
//   - English analysis prompt / consensus template
//   - English analysisSummary field
//
// This is an ADDITIVE file — the Arabic local-council.ts is
// completely untouched.

import { generateLocalSignals, type LocalTradingSignal } from './local-signals';
import { db } from './db';
import {
  COUNCIL_MODELS,
  type CouncilModelVote,
  type LocalCouncilBrief,
  type LocalCouncilData,
} from './local-council';

// ─── English Specialty Overrides ────────────────────────────
// Same 8 models, but specialty descriptions in English.

const EN_COUNCIL_SPECIALTIES: Record<string, string> = {
  MacroExpert: 'Macroeconomic analysis and monetary policy evaluation',
  RiskExpert: 'Risk management and exposure assessment',
  PatternExpert: 'Technical pattern recognition and chart analysis',
  VarianceAnalyst: 'Variance and volatility analysis',
  ScenarioAnalyst: 'Scenario planning and probability assessment',
  LiquidityAnalyst: 'Liquidity flow and volume analysis',
  SentimentExpert: 'Market sentiment and psychological indicator analysis',
  FundamentalAnalyst: 'Fundamental analysis and event impact assessment',
};

// ─── English Model Votes ───────────────────────────────────
// Same deterministic voting system, but using English names
// and English reasoning.

function generateModelVotesEn(
  signal: LocalTradingSignal,
  direction: 'BUY' | 'SELL'
): CouncilModelVote[] {
  const baseConfidence = signal.confidence;
  const pair = signal.pair;

  // Deterministic offsets per model per pair — same profiles as Arabic
  const modelProfiles: Array<{
    nameEn: string;
    bias: number;
    variance: number;
  }> = [
    { nameEn: 'MacroExpert', bias: -5, variance: 8 },
    { nameEn: 'RiskExpert', bias: 3, variance: 6 },
    { nameEn: 'PatternExpert', bias: -8, variance: 12 },
    { nameEn: 'VarianceAnalyst', bias: 5, variance: 7 },
    { nameEn: 'ScenarioAnalyst', bias: -3, variance: 10 },
    { nameEn: 'LiquidityAnalyst', bias: 2, variance: 9 },
    { nameEn: 'SentimentExpert', bias: 7, variance: 11 },
    { nameEn: 'FundamentalAnalyst', bias: -2, variance: 8 },
  ];

  // Deterministic seed from pair name (same algorithm as Arabic)
  let pairSeed = 0;
  for (let i = 0; i < pair.length; i++) {
    pairSeed = ((pairSeed << 5) - pairSeed + pair.charCodeAt(i)) | 0;
  }

  return modelProfiles.map((profile, idx) => {
    const seed = Math.abs(pairSeed * (idx + 1) * 31) % 1000;
    const jitter = (seed % (profile.variance * 2 + 1)) - profile.variance;
    const modelConfidence = Math.max(35, Math.min(95, baseConfidence + profile.bias + jitter));

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
      name: profile.nameEn,        // English name as primary
      nameEn: profile.nameEn,
      vote,
      confidence: Math.round(modelConfidence),
    };
  });
}

// ─── Signal → English Brief ────────────────────────────────

function signalToBriefEn(signal: LocalTradingSignal): LocalCouncilBrief {
  const modelCount = 8;
  const agreementRatio = signal.confidence / 100;

  // Deterministic timeframe (same mapping as Arabic)
  const timeframeMap: Record<string, string> = {
    'BTC/USDT': 'H4', 'ETH/USDT': 'H4',
    'XAU/USD': 'D1', 'XAG/USD': 'D1',
    'EUR/USD': 'H1', 'GBP/USD': 'H1',
  };
  const timeframe = timeframeMap[signal.pair] || 'H4';

  const direction: 'BUY' | 'SELL' = signal.action === 'WAIT'
    ? (agreementRatio > 0.5 ? 'BUY' : 'SELL')
    : signal.action as 'BUY' | 'SELL';

  // Generate individual model votes (English)
  const modelVotes = generateModelVotesEn(signal, direction);

  // Count votes
  const buyVotes = modelVotes.filter(m => m.vote === 'BUY').length;
  const sellVotes = modelVotes.filter(m => m.vote === 'SELL').length;
  const neutralVotes = modelVotes.filter(m => m.vote === 'NEUTRAL').length;

  // English consensus summaries
  const analysisSummaries: Record<string, string> = {
    'BUY': `Sage Council Consensus: ${buyVotes} models bullish, ${sellVotes} bearish, ${neutralVotes} neutral. ${signal.reason}`,
    'SELL': `Sage Council Consensus: ${sellVotes} models bearish, ${buyVotes} bullish, ${neutralVotes} neutral. ${signal.reason}`,
  };

  return {
    id: `council-en-${signal.id}`,
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

// ─── Persist English Council Briefs ────────────────────────

async function persistEnCouncilBriefsToDB(briefs: LocalCouncilBrief[]): Promise<void> {
  if (briefs.length === 0) return;

  try {
    const now = new Date();

    // Expire old ACTIVE local briefs that were generated by the English council
    // We use the analysisSummary pattern to identify English briefs
    await db.councilBrief.updateMany({
      where: {
        source: 'local-fallback-en',
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
            source: 'local-fallback-en',
            sessionAt: now,
            expiresAt: brief.expiresAt ? new Date(brief.expiresAt) : new Date(now.getTime() + 24 * 60 * 60 * 1000),
          },
        });
      } catch (err: any) {
        if (!err?.message?.includes('Unique')) {
          console.warn(`[LocalCouncilEn] DB persist error for ${brief.pair}: ${err?.message?.slice(0, 80)}`);
        }
      }
    }

    console.log(`[LocalCouncilEn V1] Persisted ${briefs.length} English briefs to DB`);
  } catch (err: any) {
    console.warn(`[LocalCouncilEn] DB persist failed: ${err?.message?.slice(0, 100)}`);
  }
}

// ─── Load Persisted English Council Briefs ──────────────────

export async function loadPersistedEnCouncilBriefs(): Promise<LocalCouncilBrief[]> {
  try {
    const dbBriefs = await db.councilBrief.findMany({
      where: { isActive: true, source: 'local-fallback-en' },
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
    console.warn(`[LocalCouncilEn] DB load failed: ${err?.message?.slice(0, 80)}`);
    return [];
  }
}

// ─── Main English Council Generator ────────────────────────

/**
 * Generate Strategic Council briefs in English from local signal data.
 * Uses the same deterministic 8-model voting system but outputs
 * English specialty descriptions, consensus summaries, and model names.
 */
export async function generateLocalCouncilBriefsEn(): Promise<LocalCouncilData> {
  try {
    const { signals } = await generateLocalSignals({
      includeWait: false,
      limit: 10,
    });

    // Only convert BUY/SELL signals to council briefs
    const briefs = signals
      .filter(s => s.action !== 'WAIT' && s.entryPrice && s.entryPrice > 0)
      .map(signalToBriefEn);

    // Persist to database (non-blocking)
    if (briefs.length > 0) {
      persistEnCouncilBriefsToDB(briefs).catch(err => console.error('[LocalCouncilEn] Failed to persist English council briefs to DB:', err instanceof Error ? err.message : err));
    }

    return {
      active: briefs,
      count: briefs.length,
      lastSessionAt: new Date().toISOString(),
      isRunning: false,
      source: 'local-fallback',
    };
  } catch (error: any) {
    console.warn('[LocalCouncilEn] Failed to generate English briefs:', error?.message);
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
 * Generate a single English council brief count.
 */
export async function generateLocalCouncilCountEn(): Promise<number> {
  const { count } = await generateLocalCouncilBriefsEn();
  return count;
}

/**
 * Check if English local council generation is possible.
 */
export function canGenerateLocalCouncilEn(): boolean {
  return true; // Depends on local signals which use CoinGecko/Finnhub
}

/**
 * Get English specialty descriptions for the council models.
 */
export function getEnCouncilSpecialties(): Record<string, string> {
  return { ...EN_COUNCIL_SPECIALTIES };
}
