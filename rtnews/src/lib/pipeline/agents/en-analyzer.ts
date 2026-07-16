// ═══════════════════════════════════════════════════════════════
// English 4-Gates Analyzer Agent
// Performs the 4-Gates financial analysis in English.
// This is the English counterpart of analyzer.ts.
//
// Key differences from Arabic analyzer:
// - English prompts for financial analysis
// - English-specific forbidden phrases and vague patterns
// - Validates English content quality
// - Same JSON structure but with English content
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { EN_PIPELINE_CONFIG } from '../en-pipeline-config';
import { ProcessingStage } from '../queue/job-types';

export interface EnAnalysisResult {
  articleId: string;
  success: boolean;
  duration: number;
  error?: string;
}

// ── English forbidden phrases to auto-remove from AI output ──
const FORBIDDEN_PHRASES_EN = [
  // Vague/generic investor advice
  'investors should note that',
  'it is worth noting that',
  'it should be noted that',
  'it is important to note',
  'needless to say',
  'it goes without saying',
  'as we all know',
  // Empty hedging
  'monitor developments',
  'watch closely',
  'exercise caution',
  'remain cautious',
  'stay tuned',
  'keep an eye on',
  'it remains to be seen',
  // Overly speculative hedging
  'only time will tell',
  'the jury is still out',
  'remains to be seen',
];

// ── Vague/non-tradeable asset names to filter from affectedAssets ──
const VAGUE_ASSET_PATTERNS_EN = [
  /trade relations/i,
  /global economy/i,
  /global market/i,
  /world trade/i,
  /macroeconomy/i,
  /financial markets/i,
  /global markets/i,
  /financial sector/i,
  /international relations/i,
  /trade tensions/i,
  /trade war/i,
  /international trade/i,
  /financial system/i,
  /supply chain/i,
];

// ── English speculative words/phrases ──
const STRONG_SPECULATIVE_PHRASES_EN = [
  'may lead to', 'may experience', 'may reach', 'may decline', 'may rise',
  'may affect', 'could lead to', 'could be affected', 'may increase', 'may decrease',
  'could potentially', 'it is possible that', 'is likely to',
  'is expected to', 'could happen', 'might occur',
];

const WEAK_SPECULATIVE_WORDS_EN = [
  'may', 'might', 'could', 'possibly', 'perhaps', 'potentially',
  'reportedly', 'allegedly', 'presumably', 'supposedly',
];

// ── Sell/buy keywords in English recommendations ──
const SELL_KEYWORDS_EN = [
  'sell', 'short', 'sell position', 'bearish bet',
  'target decline', 'take short position', 'sell short',
  'avoid', 'exit', 'reduce exposure',
];

const BUY_KEYWORDS_EN = [
  'buy', 'long', 'buy position', 'bullish bet',
  'target rise', 'take long position', 'accumulate',
  'add to position', 'enter',
];

// ── English content quality validation ──
function isValidEnglishText(text: string, minLength: number = 10): boolean {
  if (!text || typeof text !== 'string') return false;
  if (text.length < minLength) return false;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalAlpha = latinChars + (text.match(/[\u0600-\u06FF]/g) || []).length;
  if (totalAlpha === 0) return false;
  return (latinChars / totalAlpha) >= EN_PIPELINE_CONFIG.MIN_ENGLISH_RATIO;
}

// ── English text deduplication ──
function deduplicateEnglishText(text: string): string {
  if (!text || text.length < 50) return text;

  const rawParts = text.split(/[.!?]+/);
  const seen: string[] = [];
  const result: string[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed || trimmed.length < 15) {
      result.push(trimmed);
      continue;
    }

    const normalized = trimmed.replace(/\s+/g, ' ').trim();

    let isDuplicate = false;
    for (const existing of seen) {
      if (Math.abs(existing.length - normalized.length) > normalized.length * 0.4) continue;
      const words1 = new Set(normalized.split(/\s+/).filter(w => w.length > 2));
      const words2 = new Set(existing.split(/\s+/).filter(w => w.length > 2));
      const intersection = [...words1].filter(w => words2.has(w)).length;
      const union = new Set([...words1, ...words2]).size;
      const jaccard = union > 0 ? intersection / union : 0;

      if (jaccard > 0.75) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.push(normalized);
      result.push(trimmed);
    }
  }

  return result.join('. ').replace(/\.\. /g, '. ').replace(/\s{2,}/g, ' ').trim();
}

// ── Speculation detection (English) ──
interface SpeculationReport {
  speculationScore: number;
  speculationWordCount: number;
  totalWordCount: number;
  hasSpecificNumbers: boolean;
  shouldRepublish: boolean;
  shouldNotPublish: boolean;
  reason: string;
}

function detectSpeculationEn(content: string): SpeculationReport {
  if (!content || content.trim().length < 50) {
    return {
      speculationScore: 0,
      speculationWordCount: 0,
      totalWordCount: 0,
      hasSpecificNumbers: false,
      shouldRepublish: false,
      shouldNotPublish: false,
      reason: 'Content too short for speculation analysis',
    };
  }

  let speculationWordCount = 0;

  // Count strong speculative phrases (each counts as 2)
  for (const phrase of STRONG_SPECULATIVE_PHRASES_EN) {
    const regex = new RegExp(phrase, 'gi');
    const matches = content.match(regex);
    if (matches) {
      speculationWordCount += matches.length * 2;
    }
  }

  // Count weak speculative words (each counts as 1)
  for (const word of WEAK_SPECULATIVE_WORDS_EN) {
    // Only count standalone usage (not as part of strong phrases)
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      speculationWordCount += matches.length;
    }
  }

  const totalWordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const speculationRatio = totalWordCount > 0 ? speculationWordCount / totalWordCount : 0;
  const speculationScore = Math.min(100, Math.round(speculationRatio * 500));

  // Check for specific numbers
  const numberPatterns = content.match(/\d+[\.,]?\d*\s*%|\$[\d,]+|[\d,]+\s*(?:billion|million|thousand|trillion)|\d+[\.,]?\d*/g) || [];
  const hasSpecificNumbers = numberPatterns.length >= 3;

  const shouldRepublish = speculationWordCount > EN_PIPELINE_CONFIG.SPECULATION_REPUBLISH_THRESHOLD;
  const shouldNotPublish = speculationWordCount > EN_PIPELINE_CONFIG.SPECULATION_BLOCK_THRESHOLD && !hasSpecificNumbers;

  let reason = 'Content is data-driven';
  if (shouldNotPublish) {
    reason = `Excessive speculation: ${speculationWordCount} speculative words. Content lacks real data.`;
  } else if (shouldRepublish) {
    reason = `High speculation: ${speculationWordCount} speculative words. Should regenerate with more data.`;
  } else if (!hasSpecificNumbers) {
    reason = `Low speculation count (${speculationWordCount}) but no specific numbers found — content may be vague.`;
  }

  return {
    speculationScore,
    speculationWordCount,
    totalWordCount,
    hasSpecificNumbers,
    shouldRepublish,
    shouldNotPublish,
    reason,
  };
}

// ── Sentiment-recommendation validation ──
function validateSentimentRecommendationEn(sentiment: string, recommendation: string): string {
  if (!recommendation || !sentiment) return recommendation;

  const recLower = recommendation.toLowerCase();
  const hasSell = SELL_KEYWORDS_EN.some(kw => recLower.includes(kw));
  const hasBuy = BUY_KEYWORDS_EN.some(kw => recLower.includes(kw));

  // Positive sentiment + sell recommendation = contradiction
  if (sentiment === 'positive' && hasSell) {
    console.warn(`[EnAnalyzer] Sentiment-recommendation contradiction: positive sentiment + sell recommendation. Fixing...`);
    return recommendation.replace(/\bsell\b|\bshort\b|\bexit\b|\bavoid\b/gi, 'hold');
  }

  // Negative sentiment + buy recommendation = contradiction
  if (sentiment === 'negative' && hasBuy) {
    console.warn(`[EnAnalyzer] Sentiment-recommendation contradiction: negative sentiment + buy recommendation. Fixing...`);
    return recommendation.replace(/\bbuy\b|\blong\b|\baccumulate\b|\benter\b/gi, 'hold');
  }

  return recommendation;
}

export async function analyzeArticleEn(articleId: string): Promise<EnAnalysisResult> {
  const startTime = Date.now();
  const result: EnAnalysisResult = { articleId, success: false, duration: 0 };

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      result.error = 'Article not found';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Skip if already has quality English analysis
    if (article.aiAnalysis && article.aiAnalysis.length > 100 && article.locale === 'en') {
      try {
        const parsed = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
        if (parsed.fullContent && parsed.fullContent.length > 100 && parsed.path && ['A', 'B', 'C'].includes(parsed.path)) {
          // V260: Verify the content is actually English (not Arabic contamination)
          const englishLetterRatio = (parsed.fullContent.match(/[a-zA-Z]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          const arabicLetterRatio = (parsed.fullContent.match(/[\u0600-\u06FF]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          if (englishLetterRatio > 0.1 && arabicLetterRatio < 0.3) {
            const { advanceStage } = await import('../queue/job-manager');
            await advanceStage(articleId, article.processingStage as ProcessingStage);
            result.success = true;
            result.duration = Date.now() - startTime;
            return result;
          }
          // Content is contaminated with Arabic — must re-analyze
          console.warn(`[EnAnalyzer V260] Article ${articleId} has Arabic-contaminated aiAnalysis (EN ratio: ${englishLetterRatio.toFixed(2)}, AR ratio: ${arabicLetterRatio.toFixed(2)}) — re-analyzing`);
        }
      } catch { /* re-analyze */ }
    }

    // Prepare context
    const title = article.title || '';
    const summary = article.summary || '';
    const content = article.content || '';
    const category = article.category || 'Economy';

    // V1046: Known companies lookup — help the LLM identify tickers for M&A deals
    // The LLM often fails to identify lesser-known tickers (e.g., SandRidge = SD)
    // This pre-populates a hint based on company name matching in the title/content
    const KNOWN_COMPANIES: Record<string, { ticker: string; exchange: string; sector: string }> = {
      // Energy
      'sandridge energy': { ticker: 'SD', exchange: 'NYSE', sector: 'Energy' },
      'continental resources': { ticker: 'CLR', exchange: 'NYSE', sector: 'Energy' },
      'pioneer natural resources': { ticker: 'PXD', exchange: 'NYSE', sector: 'Energy' },
      'devon energy': { ticker: 'DVN', exchange: 'NYSE', sector: 'Energy' },
      'eog resources': { ticker: 'EOG', exchange: 'NYSE', sector: 'Energy' },
      'occidental petroleum': { ticker: 'OXY', exchange: 'NYSE', sector: 'Energy' },
      'conocophillips': { ticker: 'COP', exchange: 'NYSE', sector: 'Energy' },
      'marathon oil': { ticker: 'MRO', exchange: 'NYSE', sector: 'Energy' },
      'diamondback energy': { ticker: 'FANG', exchange: 'NASDAQ', sector: 'Energy' },
      'apache corporation': { ticker: 'APA', exchange: 'NASDAQ', sector: 'Energy' },
      'murphy oil': { ticker: 'MUR', exchange: 'NYSE', sector: 'Energy' },
      'noble energy': { ticker: 'NBL', exchange: 'NASDAQ', sector: 'Energy' },
      'hess corporation': { ticker: 'HES', exchange: 'NYSE', sector: 'Energy' },
      'williams companies': { ticker: 'WMB', exchange: 'NYSE', sector: 'Energy' },
      'energy transfer': { ticker: 'ET', exchange: 'NYSE', sector: 'Energy' },
      'kinder morgan': { ticker: 'KMI', exchange: 'NYSE', sector: 'Energy' },
      'oneok': { ticker: 'OKE', exchange: 'NYSE', sector: 'Energy' },
      'enterprise products': { ticker: 'EPD', exchange: 'NYSE', sector: 'Energy' },
      // Tech (beyond WATCH_STOCKS)
      'palantir': { ticker: 'PLTR', exchange: 'NASDAQ', sector: 'Technology' },
      'salesforce': { ticker: 'CRM', exchange: 'NYSE', sector: 'Technology' },
      'adobe': { ticker: 'ADBE', exchange: 'NASDAQ', sector: 'Technology' },
      'cisco': { ticker: 'CSCO', exchange: 'NASDAQ', sector: 'Technology' },
      'oracle': { ticker: 'ORCL', exchange: 'NYSE', sector: 'Technology' },
      'broadcom': { ticker: 'AVGO', exchange: 'NASDAQ', sector: 'Technology' },
      'qualcomm': { ticker: 'QCOM', exchange: 'NASDAQ', sector: 'Technology' },
      'texas instruments': { ticker: 'TXN', exchange: 'NASDAQ', sector: 'Technology' },
      'applied materials': { ticker: 'AMAT', exchange: 'NASDAQ', sector: 'Technology' },
      'micron technology': { ticker: 'MU', exchange: 'NASDAQ', sector: 'Technology' },
      // Financial
      'morgan stanley': { ticker: 'MS', exchange: 'NYSE', sector: 'Financial' },
      'wells fargo': { ticker: 'WFC', exchange: 'NYSE', sector: 'Financial' },
      'citigroup': { ticker: 'C', exchange: 'NYSE', sector: 'Financial' },
      'blackrock': { ticker: 'BLK', exchange: 'NYSE', sector: 'Financial' },
      'berkshire hathaway': { ticker: 'BRK.B', exchange: 'NYSE', sector: 'Financial' },
      // Healthcare
      'abbvie': { ticker: 'ABBV', exchange: 'NYSE', sector: 'Healthcare' },
      'merck': { ticker: 'MRK', exchange: 'NYSE', sector: 'Healthcare' },
      'abbott laboratories': { ticker: 'ABT', exchange: 'NYSE', sector: 'Healthcare' },
      'eli lilly': { ticker: 'LLY', exchange: 'NYSE', sector: 'Healthcare' },
      'modern': { ticker: 'MRNA', exchange: 'NASDAQ', sector: 'Healthcare' },
      // Consumer
      'costco': { ticker: 'COST', exchange: 'NASDAQ', sector: 'Consumer' },
      'home depot': { ticker: 'HD', exchange: 'NYSE', sector: 'Consumer' },
      'starbucks': { ticker: 'SBUX', exchange: 'NASDAQ', sector: 'Consumer' },
      'coca cola': { ticker: 'KO', exchange: 'NYSE', sector: 'Consumer' },
      'pepsi co': { ticker: 'PEP', exchange: 'NASDAQ', sector: 'Consumer' },
      // Industrial
      'lockheed martin': { ticker: 'LMT', exchange: 'NYSE', sector: 'Industrial' },
      'raytheon': { ticker: 'RTX', exchange: 'NYSE', sector: 'Industrial' },
      '3m company': { ticker: 'MMM', exchange: 'NYSE', sector: 'Industrial' },
      'honeywell': { ticker: 'HON', exchange: 'NASDAQ', sector: 'Industrial' },
    };

    // Scan title + content for known company names
    const fullText = `${title} ${content}`.toLowerCase();
    const matchedCompanies: string[] = [];
    for (const [companyName, info] of Object.entries(KNOWN_COMPANIES)) {
      if (fullText.includes(companyName)) {
        matchedCompanies.push(`${companyName} → ${info.ticker} (${info.exchange}, ${info.sector})`);
      }
    }
    const companyHint = matchedCompanies.length > 0
      ? `\n═══ Known Companies Detected (use these tickers) ═══\n${matchedCompanies.join('\n')}\n`
      : '';

    const analysisPrompt = `You are a professional financial news analysis system. Process this article through 4 mandatory gates in order, then output the result as JSON only — ALL IN ENGLISH.

═══ Gate 0 — Raw Data Extraction ═══
From the original text, extract:
- Company / entity name
- Ticker symbol if found (e.g., AAPL, CL, BZ, IBIT, COIN)
- Exchange / trading market (e.g., NYMEX, COMEX, NYSE, NASDAQ)
- Numbers and percentages explicitly mentioned
- Original source
If no clear ticker found ← record: "No confirmed listed asset"

═══ Gate 1 — Topic Classification and Path Determination ═══
Determine target audience first:
- Consumer-oriented (credit score, budgeting, personal loans, mortgage, savings)? → Sector = "Personal Finance" + Path [B]
- Trader/investor-oriented → continue natural classification

⚠️ CRITICAL sector classification:
- Mastercard, Visa, PayPal, Stripe = "Financial" (Payment systems), NOT "Personal Finance"
- Banks (JPM, BAC, GS, WFC) = "Financial"
- Apple, Microsoft, Nvidia = "Technology"
- Exxon, Chevron, Shell = "Energy"
- JNJ, Pfizer, Moderna = "Healthcare"
- "Personal Finance" is ONLY for individual consumer financial advice (credit score, budgeting)
- NEVER use "Low Priority" as a sector — it's not a sector name

[A] Tradeable financial news: Listed company + ticker + impactful event | Futures + symbol | Tradeable ETFs | Bitcoin ETFs (IBIT, FBTC, ARKB...) | Forex pairs | Cryptocurrencies | Crypto companies (COIN, MSTR) | Indices | Trade/tariff news
→ Full article + full analysis + trading scenarios

[B] Macro economic / social / personal finance: Macro phenomena without specific tradeable asset | Consumer educational content | M&A deals for listed companies (acquirer or target has a ticker)
→ Full article + economic context only — NO trading scenarios
  ⚠️ Macro economic news (unemployment, CPI, NFP, GDP, Fed rates) directly affects:
    • US Dollar (DXY) and pairs (EUR/USD, USD/JPY, GBP/USD)
    • Treasury bonds (TNX, TLT)
    • Gold (XAUUSD, GLD)
    • Major indices (S&P 500/SPY, Nasdaq/QQQ, Dow/DIA)
  ⚠️ M&A deals (acquisitions, mergers) for listed companies → Path [B] (not [C])
    The deal value is a concrete number, the company is identifiable, and the strategic
    rationale provides context. This is NOT "scarce information" — it's a factual event.

[C] Deals / private companies / scarce information
→ Full article + brief analysis + low confidence classification
  ⚠️ [C] is ONLY for: private company deals with no public ticker, OR truly scarce data
     (no company name, no deal value, no identifiable entity).
     If a company name is mentioned AND a deal value is given → NOT [C], use [B].

═══ Gate 2 — English Article Quality ═══
Ensure the article content is:
- Professional financial English
- Numbers match the original source exactly
- No fabricated information
- Proper paragraph structure
- No repetition between sections

═══ Gate 3 — 5-Section Financial Analysis ═══

For Path [C] only (2 sections):
[1] What happened — two sentences only
[5] For traders: "Scarce information — insufficient data for reliable analysis"

For Paths [A] and [B] (5 sections):

[1] What happened — 4-5 sentences only. Include who said what (full name + title + organization) + where and when.

[2] Why this matters — 3-5 sentences with actual numbers:
  ⚠️ Add current prices of mentioned assets
  ⚠️ Add market caps or volumes if mentioned
  ⚠️ Macro news affects: USD/DXY, Treasuries, Gold, Indices

[3] Affected assets — dense list of real tradeable assets:
  a. Directly affected: Name + Symbol + Exchange + Direction + Reason
  b. Cascade-affected: Specific companies/funds/sectors

[4] What to watch — 3 specific upcoming events or indicators:
  ⚠️ Be specific! Not "monitor developments"

[5] For traders — recommendation:
  Path [A]: Specific with entry + stop loss + target (if data supports it)
  Path [B]: "Wait until macro trends become clearer"
  Path [C]: "Scarce information — insufficient data"

═══ Gate 4 — Final Verification ═══
□ Numbers match original?
□ No fabricated information?
□ No repetition?
□ Sentiment-recommendation alignment?
□ Proper path classification?

═══ Article Data ═══
Title: ${title}
Summary: ${summary.slice(0, 500)}
${content ? `Content: ${content.slice(0, 4000)}` : ''}
Category: ${category}
${companyHint}
═══ Required JSON Output ═══
{
  "rawData": {"entityNameEn": "Entity name", "ticker": "Symbol or none", "exchange": "Exchange", "figures": ["Numbers"], "source": "Source"},
  "path": "A or B or C",
  "sector": "Sector in English",
  "sentimentReason": "Sentiment justification",
  "editedArticle": "Edited article text — REAL CONTENT, not placeholders",
  "fullContent": "[1] What happened\\nAdvanced Micro Devices (AMD) shares declined 2.06% to $521.58 on Tuesday after the company announced its acquisition of MEXT, a memory-optimization startup.\\n\\n[2] Why this matters\\nThe acquisition signals AMD's push into memory optimization, a competitive frontier against NVIDIA in the AI chip race.\\n\\n[3] Affected assets\\n- AMD (NASDAQ: AMD) — direct impact, bearish short-term\\n\\n[4] What to watch\\nIntegration timeline and any guidance revision from AMD management.\\n\\n[5] For traders\\nHold short position near $520 with stop-loss at $540, target $480.",
  "introduction": "2-3 introductory sentences — REAL CONTENT",
  "body": "3-5 paragraph analysis — REAL CONTENT",
  "conclusion": "2-3 sentence investment takeaway — REAL CONTENT",
  "summary": "Two-sentence event summary — REAL CONTENT",
  "sentiment": "positive or negative or neutral",
  "impactLevel": "high or medium or low",
  "keyTakeaways": ["Point 1 — REAL CONTENT", "Point 2 — REAL CONTENT", "Point 3 — REAL CONTENT"],
  "affectedAssets": [
    {"symbol": "Symbol", "name": "Name with symbol", "direction": "up or down or neutral", "impactDegree": "high or medium or low", "reason": "Reason", "isTradable": true}
  ],
  "recommendation": "Sharp, specific investment recommendation — REAL CONTENT",
  "confidence": "X/10 — justification"
}

⚠️ CRITICAL: Replace ALL "..." placeholders with REAL content from the article data.
The example above shows REAL content, not template stubs.
Outputting "[1] What happened\\n..." with literal "..." is FORBIDDEN —
every section MUST contain actual analysis text based on the article.
If you cannot fill a section with real information, write "Insufficient data for this section" instead of "...".

Rules:
- English only — professional financial English
- Do NOT fill sections without real information
- Recommendation aligns with sentiment
- fullContent uses [1]-[5] for Path [A]/[B], only [1]+[5] for Path [C]
- path must be "A", "B", or "C" only
- No repetition across sections
- keyTakeaways add new information — not rephrasing`;

    const aiResult = await Promise.race([
      chatCompletion([
        { role: 'system', content: analysisPrompt },
        { role: 'user', content: title || summary || 'Financial news article' },
      ], { temperature: 0.3, maxTokens: 10000, priority: 'generation', locale: 'en' }),  // V387: English pipeline — OpenRouter (Haiku) first
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('English analysis timeout')), 120000)
      ),
    ]);

    if (!aiResult.content) {
      result.error = 'AI returned empty content';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Parse JSON
    let parsed: Record<string, any> | null = null;
    try {
      const text = aiResult.content.trim().replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1));
      }
    } catch { /* try recovery */ }

    if (!parsed) {
      result.error = 'Failed to parse AI JSON response';
      result.duration = Date.now() - startTime;
      return result;
    }

    // ── Post-processing: Remove forbidden phrases ──
    let fullContent = parsed.fullContent || '';
    let recommendation = parsed.recommendation || '';

    for (const phrase of FORBIDDEN_PHRASES_EN) {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'gi');
      fullContent = fullContent.replace(re, '');
      recommendation = recommendation.replace(re, '');
    }

    // Deduplicate
    fullContent = fixArabicNumbers(deduplicateEnglishText(fullContent));

    // V1045: Reject template-placeholder fullContent
    // The LLM sometimes outputs "[1] What happened\n...\n[2] Why this matters\n..." literally
    // with "..." instead of real content. This produces useless analysis.
    const PLACEHOLDER_PATTERNS = [
      /\[\d+\][^\n]*\n\s*\.\.\./,  // [1] Title\n...
      /\[\d+\][^\n]*\n\s*\.\.\.\s*\n\s*\[\d+\]/,  // [1] Title\n...\n[2]
      /^[^[]{0,30}\[\d+\][^[]{0,30}\n\.\.\.\n/gm,  // section followed by ...
    ];
    const hasPlaceholder = PLACEHOLDER_PATTERNS.some(p => p.test(fullContent));
    if (hasPlaceholder || fullContent.length < 200) {
      console.warn(`[EnAnalyzer V1045] Article ${articleId} has template-placeholder or too-short fullContent (len=${fullContent.length}) — rejecting`);
      const { recordError } = await import('../queue/job-manager');
      await recordError(articleId, `V1045: fullContent is template placeholder or too short (${fullContent.length} chars)`);
      result.error = 'Template placeholder fullContent';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Validate sentiment-recommendation alignment
    recommendation = fixArabicNumbers(validateSentimentRecommendationEn(parsed.sentiment || 'neutral', recommendation));

    // Speculation check
    const specReport = detectSpeculationEn(fullContent);
    if (specReport.shouldNotPublish) {
      console.warn(`[EnAnalyzer] Article ${articleId} blocked by speculation gate: ${specReport.reason}`);
      const { recordError } = await import('../queue/job-manager');
      await recordError(articleId, `Speculation gate: ${specReport.reason}`);
      result.error = specReport.reason;
      result.duration = Date.now() - startTime;
      return result;
    }

    // ── Filter vague assets ──
    let affectedAssets = parsed.affectedAssets || [];
    if (Array.isArray(affectedAssets)) {
      affectedAssets = affectedAssets.filter((asset: any) => {
        const name = asset.name || asset.symbol || '';
        return !VAGUE_ASSET_PATTERNS_EN.some(pattern => pattern.test(name));
      });
    }

    // ── Verify asset-content relevance ──
    // Remove assets that are NOT mentioned in the article content.
    // This prevents mis-tagging (e.g., an article about TXN tagged with XAUUSD).
    if (Array.isArray(affectedAssets) && affectedAssets.length > 0) {
      const articleText = `${title} ${summary} ${fullContent} ${parsed.body || ''} ${parsed.introduction || ''}`.toLowerCase();
      const COMMODITY_KEYWORDS: Record<string, string[]> = {
        XAUUSD: ['gold', 'xau', 'precious metal', 'safe haven', 'gold price', 'gold market', 'gold futures'],
        XAGUSD: ['silver', 'xag', 'precious metal'],
        CL: ['oil', 'crude', 'wti', 'petroleum', 'brent', 'opec', 'oil price', 'oil market'],
        BZ: ['brent', 'oil', 'crude'],
        BTCUSD: ['bitcoin', 'btc', 'cryptocurrency', 'crypto'],
        ETHUSD: ['ethereum', 'eth', 'cryptocurrency', 'crypto'],
        NG: ['natural gas', 'gas', 'lng'],
        HG: ['copper', 'industrial metal'],
        DXY: ['dollar index', 'dxy', 'us dollar'],
        SPX: ['s&p', 'sp500', 'spy', 'spx 500'],
        NDX: ['nasdaq', 'ndx', 'qqq'],
        EURUSD: ['euro', 'eur/usd', 'eurusd'],
        GBPUSD: ['pound', 'sterling', 'gbp/usd', 'gbpusd'],
        USDJPY: ['yen', 'jpy', 'usd/jpy', 'usdjpy'],
      };
      affectedAssets = affectedAssets.filter((asset: any) => {
        const sym = (asset.symbol || '').toUpperCase();
        const assetName = (asset.name || '').toLowerCase();
        // Stock tickers: check if the ticker appears in text
        if (/^[A-Z]{1,5}$/.test(sym) && sym.length <= 5 && !COMMODITY_KEYWORDS[sym]) {
          // It's a stock ticker — check if it or the company name appears in text
          const tickerMatch = articleText.includes(sym.toLowerCase());
          const nameMatch = assetName && articleText.includes(assetName.toLowerCase());
          if (!tickerMatch && !nameMatch) {
            console.warn(`[EnAnalyzer] Removing unrelated asset ${sym} from article ${articleId} — not found in content`);
            return false;
          }
        }
        // Commodities/forex: check with keyword lists
        const keywords = COMMODITY_KEYWORDS[sym];
        if (keywords) {
          const hasKeyword = keywords.some(kw => articleText.includes(kw.toLowerCase()));
          if (!hasKeyword && !articleText.includes(sym.toLowerCase())) {
            console.warn(`[EnAnalyzer] Removing unrelated commodity ${sym} from article ${articleId} — not found in content`);
            return false;
          }
        }
        return true;
      });
    }

    // ── Build aiAnalysis ──
    const aiAnalysis: Record<string, any> = {
      path: parsed.path,
      sector: parsed.sector,
      sentimentReason: parsed.sentimentReason,
      editedArticle: parsed.editedArticle || '',
      fullContent,
      introduction: parsed.introduction || '',
      body: parsed.body || '',
      conclusion: parsed.conclusion || '',
      summary: parsed.summary || '',
      sentiment: parsed.sentiment || 'neutral',
      impactLevel: parsed.impactLevel || 'low',
      keyTakeaways: parsed.keyTakeaways || [],
      affectedAssets,
      recommendation,
      confidence: parsed.confidence || '5/10',
      locale: 'en',
      rawData: parsed.rawData || {},
    };

    // V1049: Fix broken numbers in ALL text fields
    for (const field of ['fullContent', 'introduction', 'body', 'conclusion', 'editedArticle', 'recommendation', 'summary']) {
      if (typeof (aiAnalysis as any)[field] === 'string') {
        (aiAnalysis as any)[field] = fixArabicNumbers((aiAnalysis as any)[field]);
      }
    }
    if (Array.isArray(aiAnalysis.keyTakeaways)) {
      aiAnalysis.keyTakeaways = aiAnalysis.keyTakeaways.map((k: any) => typeof k === 'string' ? fixArabicNumbers(k) : k);
    }

    // ── Update article ──
    const updateData: Record<string, any> = {
      aiAnalysis: JSON.stringify(aiAnalysis),
      locale: 'en',
    };

    if (parsed.sentiment) updateData.sentiment = parsed.sentiment;
    if (parsed.impactLevel) updateData.impactLevel = parsed.impactLevel;
    if (parsed.sector) {
      const categoryMap: Record<string, string> = EN_PIPELINE_CONFIG.CATEGORY_MAP_EN;
      const catId = Object.entries(categoryMap).find(([_, v]) => v.toLowerCase() === parsed.sector.toLowerCase())?.[0];
      if (catId) {
        updateData.categoryId = catId;
        updateData.category = categoryMap[catId];
      }
    }
    if (affectedAssets.length > 0) {
      updateData.affectedAssets = JSON.stringify(affectedAssets);
    }

    // Set sentimentScore
    if (parsed.sentiment) {
      const baseScore = parsed.sentiment === 'positive' ? 70 : parsed.sentiment === 'negative' ? 30 : 50;
      const impactMod = parsed.impactLevel === 'high' ? 15 : parsed.impactLevel === 'medium' ? 5 : 0;
      updateData.sentimentScore = parsed.sentiment === 'negative' ? baseScore - impactMod : baseScore + impactMod;
    }

    // Set impactScore from confidence
    if (parsed.confidence) {
      const confMatch = String(parsed.confidence).match(/(\d+)\s*\/\s*10/);
      if (confMatch) {
        updateData.impactScore = parseInt(confMatch[1], 10) * 10;
      }
    }

    await db.newsItem.update({
      where: { id: articleId },
      data: updateData,
    });

    // Advance stage
    const { advanceStage } = await import('../queue/job-manager');
    await advanceStage(articleId, article.processingStage as ProcessingStage);

    result.success = true;
    result.duration = Date.now() - startTime;
    console.log(`[EnAnalyzer] ✓ Analyzed ${articleId} in ${result.duration}ms — path: ${parsed.path}, sentiment: ${parsed.sentiment}`);
    return result;
  } catch (err: any) {
    result.error = err.message;
    result.duration = Date.now() - startTime;
    console.error(`[EnAnalyzer] Fatal error for ${articleId}:`, err.message);
    return result;
  }
}

// V1049: Fix broken numbers (same as AR analyzer)
function fixArabicNumbers(text: string): string {
  if (!text) return text;
  let result = text;
  result = result.replace(/(\d)\s*\.\s*(\d)/g, '$1.$2');
  result = result.replace(/(\d)\s+%/g, '$1%');
  result = result.replace(/\$\s+(\d)/g, '$$$1');
  result = result.replace(/([A-Z])\.\s+([A-Z])/g, '$1.$2');
  return result;
}
