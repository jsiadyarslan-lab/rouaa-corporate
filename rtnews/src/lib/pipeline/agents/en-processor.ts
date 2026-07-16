// ═══════════════════════════════════════════════════════════════
// English Unified Processor Agent
// Processes English news articles DIRECTLY in English — no translation step.
// This is the English counterpart of unified-processor.ts.
//
// Key differences from Arabic unified-processor:
// - No translation step (content is already in English)
// - English prompts for AI analysis
// - Output fields: titleEn, summaryEn, contentEn (instead of titleAr, etc.)
// - Sets locale: 'en' and categoryId fields
// - English-specific quality validation
// - LTR layout direction
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import { EN_PIPELINE_CONFIG } from '../en-pipeline-config';
import { ProcessingStage } from '../queue/job-types';

export interface EnUnifiedResult {
  articleId: string;
  success: boolean;
  duration: number;
  fields: string[];
  error?: string;
}

// ── JSON parsing utility (shared with Arabic processor) ──
function parseAIJson(text: string): Record<string, any> | null {
  if (!text) return null;

  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch { /* not pure JSON, try extraction below */ }

  // Try extracting JSON from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch { /* code block not valid JSON, continue */ }
  }

  // Try finding JSON object boundaries
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch { /* try fixing common issues below */ }

    let jsonStr = text.slice(firstBrace, lastBrace + 1);
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(jsonStr);
    } catch { /* truncated JSON recovery below */ }
  }

  // Truncated JSON recovery
  if (firstBrace !== -1) {
    let truncatedJson = text.slice(firstBrace);
    truncatedJson = truncatedJson.replace(/"[^"\\]*$/, '');
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escape = false;
    for (const ch of truncatedJson) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') openBraces++;
      if (ch === '}') openBraces--;
      if (ch === '[') openBrackets++;
      if (ch === ']') openBrackets--;
    }
    for (let i = 0; i < openBrackets; i++) truncatedJson += ']';
    for (let i = 0; i < openBraces; i++) truncatedJson += '}';
    try {
      return JSON.parse(truncatedJson);
    } catch { /* give up */ }
  }

  return null;
}

// ── Markdown stripping utility ──
function stripMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── English deduplication — removes repeated sentences ──
function deduplicateEnglishContent(text: string): string {
  if (!text || text.length < 50) return text;

  const rawParts = text.split(/[.!?]+/);
  const seen = new Map<string, string>();
  const result: string[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed || trimmed.length < 15) {
      result.push(trimmed);
      continue;
    }

    const normalized = trimmed.replace(/\s+/g, ' ').trim();

    let isDuplicate = false;
    for (const [existingNorm] of seen) {
      if (Math.abs(existingNorm.length - normalized.length) > normalized.length * 0.4) continue;

      const words1 = new Set(normalized.split(/\s+/).filter(w => w.length > 2));
      const words2 = new Set(existingNorm.split(/\s+/).filter(w => w.length > 2));
      const intersection = [...words1].filter(w => words2.has(w)).length;
      const union = new Set([...words1, ...words2]).size;
      const jaccardSimilarity = union > 0 ? intersection / union : 0;

      if (jaccardSimilarity > 0.75) {
        isDuplicate = true;
        break;
      }
    }

    if (isDuplicate) {
      console.warn(`[EnProcessor] Removed duplicate sentence: "${trimmed.slice(0, 60)}..."`);
    } else {
      seen.set(normalized, trimmed);
      result.push(trimmed);
    }
  }

  return result.join('. ').replace(/\.\. /g, '. ').replace(/\s{2,}/g, ' ').trim();
}

// ── English content quality validation ──
function isValidEnglishText(text: string, minLength: number = 10): boolean {
  if (!text || typeof text !== 'string') return false;
  if (text.length < minLength) return false;
  // Check for reasonable English character ratio
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalAlpha = latinChars + (text.match(/[\u0600-\u06FF]/g) || []).length;
  if (totalAlpha === 0) return false;
  const englishRatio = latinChars / totalAlpha;
  return englishRatio >= EN_PIPELINE_CONFIG.MIN_ENGLISH_RATIO;
}

// ── Category ID mapping ──
function mapCategoryToId(category: string): string {
  const categoryMap: Record<string, string> = {
    'economy': 'economy',
    'stocks': 'stocks',
    'forex': 'forex',
    'crypto': 'crypto',
    'energy': 'energy',
    'commodities': 'commodities',
    'real estate': 'realEstate',
    'realEstate': 'realEstate',
    'banking': 'banking',
    'earnings': 'earnings',
    'arab markets': 'arabMarkets',
    'arabMarkets': 'arabMarkets',
    'technology': 'technology',
    'politics': 'politics',
    'breaking': 'breaking',
    'اقتصاد كلي': 'economy',
    'أسهم': 'stocks',
    'عملات': 'forex',
    'فوركس': 'forex',
    'كريبتو': 'crypto',
    'عملات رقمية': 'crypto',
    'طاقة': 'energy',
    'سلع': 'commodities',
    'عقارات': 'realEstate',
    'بنوك مركزية': 'banking',
    'أرباح شركات': 'earnings',
    'أسواق عربية': 'arabMarkets',
    'تقنية': 'technology',
    'سياسة': 'politics',
    'عاجل': 'breaking',
  };
  return categoryMap[category] || 'economy';
}

export async function processArticleEn(articleId: string, targetLocale: 'en' | 'es' | 'fr' | 'tr' = 'en'): Promise<EnUnifiedResult> {
  const startTime = Date.now();
  const result: EnUnifiedResult = { articleId, success: false, duration: 0, fields: [] };

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      result.error = 'Article not found';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Skip if already fully processed with quality data in the target locale
    // V417 FIX: Also check that article.content is long enough for the publisher.
    // Previously, the skip condition only checked that article.content was truthy,
    // so articles with short RSS summaries (e.g. 30 chars) would skip reprocessing
    // and then get BLOCKED by the publisher (needs 80+ chars).
    const contentLongEnough = article.content && article.content.length >= EN_PIPELINE_CONFIG.MIN_EN_CONTENT_LENGTH;
    if (article.aiAnalysis && article.title && contentLongEnough && article.locale === targetLocale) {
      try {
        const parsed = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
        if (parsed.fullContent && parsed.path && ['A', 'B', 'C'].includes(parsed.path)) {
          // V260: Verify the content is actually in the target language (not Arabic contamination)
          const latinLetterRatio = (parsed.fullContent.match(/[a-zA-Z]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          const arabicLetterRatio = (parsed.fullContent.match(/[\u0600-\u06FF]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          // V416 FIX: Aligned skip-check with isValidEnglishText threshold (MIN_ENGLISH_RATIO = 0.50).
          // The old 0.1 Latin threshold was too lenient — articles with only 10% Latin and 29% Arabic
          // (rest numbers/symbols) would skip reprocessing, reach the publisher, and get blocked there,
          // wasting imager and publisher cycles.
          if (latinLetterRatio >= EN_PIPELINE_CONFIG.MIN_ENGLISH_RATIO && arabicLetterRatio < 0.3) {
            // V317: Skip to 'analyzed' stage for already-processed articles
            await db.newsItem.update({
              where: { id: articleId },
              data: { processingStage: 'analyzed' },
            });
            result.success = true;
            result.duration = Date.now() - startTime;
            return result;
          }
          // Content is contaminated with Arabic — must reprocess
          console.warn(`[EnProcessor V416] Article ${articleId} has Arabic-contaminated aiAnalysis (Latin ratio: ${latinLetterRatio.toFixed(2)}, AR ratio: ${arabicLetterRatio.toFixed(2)}) — reprocessing`);
        }
      } catch {
        // Non-critical: if we can't check existing data, just reprocess
        console.warn(`[EnProcessor] Skip check failed for ${articleId}, reprocessing`);
      }
    }

    // Prepare context — original text from the article
    const titleEn = article.title || '';
    const summaryEn = article.summary || '';
    const contentEn = article.content || '';
    const category = article.category || 'Economy';

    // ── Locale-aware language configuration ──
    let localeCategoryMap: Record<string, string> = EN_PIPELINE_CONFIG.CATEGORY_MAP_EN;
    let localeLanguageName = 'English';
    if (targetLocale === 'es') {
      const { ES_PIPELINE_CONFIG } = await import('../es-pipeline-config');
      localeCategoryMap = ES_PIPELINE_CONFIG.CATEGORY_MAP_ES;
      localeLanguageName = 'Spanish';
    } else if (targetLocale === 'fr') {
      const { FR_PIPELINE_CONFIG } = await import('../fr-pipeline-config');
      localeCategoryMap = FR_PIPELINE_CONFIG.CATEGORY_MAP_FR;
      localeLanguageName = 'French';
    } else if (targetLocale === 'tr') {
      const { TR_PIPELINE_CONFIG } = await import('../tr-pipeline-config');
      localeCategoryMap = TR_PIPELINE_CONFIG.CATEGORY_MAP_TR;
      localeLanguageName = 'Turkish';
    }
    const localeCfg = { languageName: localeLanguageName, categoryMap: localeCategoryMap };

    // ── SINGLE API CALL: Pre-filter + 4 Gates in one prompt (LOCALE-AWARE) ──
    const unifiedPrompt = `You are a comprehensive financial news processing system for a ${localeCfg.languageName}-language financial news platform. Your task is to process this news article through a filter gate then 4 mandatory gates in a single request, producing the title, summary, content, and complete financial analysis — ALL IN ${localeCfg.languageName.toUpperCase()}.

═══ Filter Gate — Is this financial news? ═══
This article has already been pre-filtered by a financial keyword filter.
Assume it is financial.

❌ Do NOT issue status: "REJECTED" ❌
Reject ONLY if BOTH conditions are met:
1. The topic has NO relation to economics, markets, or companies
2. There is NO potential impact on any tradeable financial asset

If unsure — classify as Path [C]. ❌ Do NOT reject ❌

═══ Geographic Filter — Priority ═══
Classify the geographic priority:

🔴 High priority (full processing + homepage visibility):
- Major global markets: US (Wall Street, Nasdaq, S&P, Fed), Europe (ECB, FTSE, DAX), Major Asia (Japan/Nikkei, China/Shanghai, Korea, India)
- Arab markets: Saudi/Tadawul, UAE/Dubai, Egypt, Qatar, Kuwait, Bahrain, Oman, Jordan
- Global commodities: Oil (WTI, Brent), Gold (XAU), Silver, Copper, OPEC
- Digital assets: Bitcoin, Ethereum, Crypto
- Trade/tariff news between major economies

🟡 Low priority (processed but auto-classified as "low priority"):
- Local markets of non-Arab, non-major countries
- If the article mentions a low-priority country BUT also relates to a major market ← give it high priority

⚠️ Application: If the article is geographically low priority ← write in sector: "Low Priority" + impactLevel: "low"

Examples of ACCEPTED articles (never reject these):
- Trump-Xi summit → affects markets and trade → Path [A]
- Political news affecting markets → Path [B]
- Corporate earnings reports → Path [A]
- Macro economic data (jobs, CPI, GDP) → Path [B]
- Company news even without ticker symbol → Path [B] or [C]
- International trade and tariff news → Path [A]
- Tech news affecting tech stocks → Path [B]
- Energy, oil, or metals news → Path [A]
- Any article from a financial source that seems general → Path [C]

═══ Gate 0 — Raw Data Extraction ═══
From the original English text, extract:
- Company / entity name (if about commodities or futures, write the basket name, e.g., WTI Crude Oil, Brent Crude, Gold)
- Ticker symbol if found (e.g., AAPL, CL, BZ, IBIT, COIN)
- Exchange / trading market (e.g., NYMEX, COMEX, NYSE, NASDAQ)
- Numbers and percentages explicitly mentioned in the text
- Original source
If no clear ticker found ← record: "No confirmed listed asset"

═══ Gate 1 — Topic Classification and Path Determination ═══
Determine the target audience first:
- Directed at individual consumer (credit score, budgeting, personal loans)? → Sector = "Personal Finance" + Path [B] mandatory
- Directed at trader/investor → continue natural classification

[A] Tradeable financial news: Listed company + ticker + impactful event | Futures + symbol | Tradeable ETFs | Bitcoin funds (IBIT, FBTC, ARKB...) | Forex pairs | Cryptocurrencies | Crypto companies (COIN, MSTR) | Indices | Trade/tariff news between major economies
→ Full article + full analysis + trading scenarios

[B] Macro economic / social / personal finance: Macro phenomena without specific tradeable asset | Consumer educational content
→ Full article + economic context only — NO trading scenarios
  ⚠️ Macro economic news (unemployment, CPI, NFP, GDP, Fed rates) strongly affects real financial assets! Include them in sections [2] and [3]:
    • US Dollar (DXY) and pairs (EUR/USD, USD/JPY, GBP/USD)
    • Treasury bonds (TNX, TLT)
    • Gold (XAUUSD, GLD)
    • Major indices (S&P 500/SPY, Nasdaq/QQQ, Dow/DIA)

[C] Deals / private companies / scarce information
→ Full article + brief analysis + low confidence classification

═══ Gate 2 — Write the Article in ${localeCfg.languageName} ═══
Write a PROFESSIONAL, SUBSTANTIAL ${localeCfg.languageName} financial news article:

⚠️⚠️⚠️ CRITICAL NUMBER RULE — Numbers are sacred! ⚠️⚠️⚠️
Every number in the original text must appear exactly in the English output:
- $16.5M must remain $16.5M (not $1.65M!)
- EPS of $0.36 must remain $0.36
- Do NOT shift the decimal point: 16.5 ≠ 1.65 and 0.36 ≠ 3.6
- If unsure about a number ← keep it exactly as written in the source

⚠️⚠️⚠️ CRITICAL CONTENT LENGTH RULE ⚠️⚠️⚠️
The contentEn field MUST be at least 300 words (not characters — WORDS).
This is a professional financial news website, not a Twitter feed.
EVERY article must have substantial, informative content that gives readers real value.
Even if the source material is short (just a title or brief summary), you MUST expand it
into a full article by providing relevant context, background, and market implications.

Writing rules:
1. ${localeCfg.languageName} title: Accurate, professional financial journalism style. Include company names + ticker if available. Do NOT add words not in the original (loss, sharp decline, major retreat) unless explicitly stated.
2. ${localeCfg.languageName} summary: Concise and professional — a faithful representation, not creative rewriting. At least 2 sentences.
3. ${localeCfg.languageName} content: Write a FULL professional news article — ALWAYS at least 4 paragraphs, regardless of source material length:
   Paragraph 1: Main event — what happened, who, when, where (factual reporting)
   Paragraph 2: Context and background — why this matters, historical context, or related events
   Paragraph 3: Market impact and analysis — how this affects markets, investors, or the economy
   Paragraph 4: Outlook and implications — what comes next, expert expectations, or broader significance

   ⚠️ If the source material is brief, EXPAND using your knowledge of:
   - The company/sector/country's recent history and current situation
   - Related market trends and data
   - Expert consensus on the topic
   - Similar past events and their outcomes
   ⚠️ Do NOT invent specific quotes, names, or events not in the source
   ⚠️ DO provide informed context that a financial journalist would include
   ⚠️ Every number from the original must appear in the English version with exactly the same value!
   ⚠️ contentEn MUST be at least 300 words — this is NON-NEGOTIABLE

═══ Gate 3 — Analysis (5-section structure) ═══

⚠️ Fundamental principle — analysis size proportional to news size:
- If the article is short (a statement or single event) → don't fill space with repetition or padding
- Write dense, honest analysis rather than long, artificial analysis

⚠️ No AI internal comments:
- Forbidden: "I'll stop here", "Note:", "As requested", "Let me continue"
- The final text is read by investors — no trace of the generation process

For Path [C] only — brief structure (2 sections only):
[1] What happened — two sentences only
[5] For traders: "Scarce information — insufficient data for reliable analysis"
Forbidden for Path [C]: sections [2] [3] [4]

For Paths [A] and [B] — full structure (5 sections):

[1] What happened — 4-5 sentences only. Do NOT repeat what you wrote in the content field.
  Mandatory content: What happened + who said it (full name + title + organization) + where and when specifically.

[2] Why this matters — 3-5 sentences explaining significance with actual numbers:
  ⚠️ Add current price of mentioned assets (e.g., "BTC is currently trading at $67,500")
  ⚠️ Add market caps or trading volumes if mentioned
  ⚠️ NO empty phrases: "enhances sector credibility", "opens the door for...", "signals a strategic shift"
  ⚠️ Macro news (jobs/CPI/NFP/GDP/rates) directly affects:
    • Unemployment or NFP → USD/DXY + EUR/USD + USD/JPY + Treasuries TNX/TLT + Gold XAUUSD/GLD
    • CPI or inflation → USD/DXY + Treasuries + Gold + Indices (SPY, QQQ)
    • Fed rate decision → USD + bonds + gold + banks (XLF) + real estate (XLRE)
    • GDP or economic growth → USD + indices + cyclical sectors (XLI) vs defensive (XLU)

[3] Affected assets — dense list of real tradeable assets:
  a. Directly affected: Name + Symbol + Exchange + Impact direction + Specific reason
  b. Cascade-affected: Specific companies/funds/sectors by name and symbol
  ⚠️ For macro news: NEVER write "not applicable"!
  ⚠️ Do NOT put "bullish" on every asset — be realistic
  ⚠️ Opinion piece rule: If the article is an opinion/column/editorial → only list assets explicitly named in source

[4] What to watch — 3 specific upcoming events or indicators related to the news:
  ⚠️ Don't write "monitor developments" — be specific!
  Correct example: "1. PayPal earnings report on March 15 2. Jerome Powell speech on March 20 3. Monthly CPI data on March 12"
  ⚠️ If you don't have 3 specific events ← write 1 or 2 only (don't invent events!)

[5] For traders — recommendation proportional to news significance:
  For Path [A]: Specific, actionable recommendation — but only if the news is sufficient:
    • If operational announcement or concrete data → specific recommendation with entry level + stop loss + target
    • If preliminary statement or expectations → write: "This is a preliminary statement, not an operational announcement — wait for confirmation before acting"
    • NO buy/sell recommendation without a specific numerical entry price
  For Path [B]: "Wait until macro trends become clearer"
  For Path [C]: "Scarce information — insufficient data"

⚠️ Recommendation rules:
- Positive = buy or hold only — no sell
- Negative = sell or hold only — no buy
- Neutral = hold only
- NO empty recommendations (monitor tensions, watch developments, exercise caution)

═══ Gate 4 — Final Verification ═══
□ Every number from the original text appears with the same value in the English output?
□ No fabricated information not in the original text?
□ No repetition between contentEn and fullContent?
□ The recommendation doesn't contradict the sentiment?
□ Trade/tariff news classified as Path [A]?
□ Crypto news classified as Path [A] + sector = "Crypto"?
□ If macro economic news → did you include USD/DXY + Treasuries + Gold in section [2]?
□ Does section [3] mention cascade-affected assets by macro data type?
□ Is the analysis size proportional to the news size?
□ If the news is a statement, not an announcement — did you clarify that in section [5]?
□ Any AI internal comments in the text? If yes → delete immediately
□ Does fullContent use sections [1]-[5] (not [1]-[6])?
□ If the article is an opinion piece — does section [3] limit to assets explicitly mentioned in source?
□ If any check fails → fix before output

═══ Article Data ═══
English Title: ${titleEn}
English Summary: ${summaryEn.slice(0, 500)}
${contentEn ? `Original English Content: ${contentEn.slice(0, 4000)}` : ''}
Current Category: ${category}

═══ Required JSON Output Format ═══
Give the result in JSON format only without any additional text:
{
  "titleEn": "The processed English title — professional financial journalism — numbers matching original",
  "summaryEn": "The English summary — concise and professional — numbers matching original",
  "contentEn": "The English news article — paragraphs based on available source material separated by newlines",
  "rawData": {
    "entityNameEn": "Company or basket name in English",
    "ticker": "Ticker symbol or No confirmed listed asset",
    "exchange": "Exchange name or contract market",
    "figures": ["Numbers and percentages from the original text"],
    "source": "Original source"
  },
  "path": "A or B or C",
  "sector": "The correct sector in English",
  "sentimentReason": "Justification for sentiment classification",
  "editedArticle": "The edited article with paragraphs based on available source",
  "fullContent": "[1] What happened\\n4-5 sentences: The event + who said it + where and when\\n\\n[2] Why this matters\\n3-5 sentences with actual numbers\\n\\n[3] Affected assets\\na. Direct + b. Cascade\\n\\n[4] What to watch\\n1-3 specific upcoming events\\n\\n[5] For traders\\nRecommendation or wait",
  "introduction": "2-3 introductory sentences",
  "body": "In-depth analysis of 3-5 paragraphs",
  "conclusion": "Investment takeaway of 2-3 sentences",
  "summary": "Event summary in two sentences",
  "sentiment": "positive or negative or neutral",
  "impactLevel": "high or medium or low",
  "keyTakeaways": ["Point 1", "Point 2", "Point 3", "Point 4"],
  "affectedAssets": [
    {"symbol": "Asset symbol", "name": "Asset name with symbol", "direction": "up or down or neutral", "impactDegree": "high or medium or low", "reason": "Impact reason", "isTradable": true}
  ],
  "recommendation": "Sharp and specific investment recommendation",
  "confidence": "X/10 — justification"
}

Strict rules:
- Answer in ${localeCfg.languageName} only — professional financial ${localeCfg.languageName}
- Do NOT fill a section if you don't have real information — deleted section is better than hallucinated
- The recommendation always aligns with the classification
- fullContent must start with [1] and end with [5] for Path [A] and [B], and contain only [1] + [5] for Path [C]
- path must be "A" or "B" or "C" only
- Do NOT forget titleEn, summaryEn, and contentEn — these are mandatory fields! (Note: field names use "En" suffix for compatibility, but the content must be written in ${localeCfg.languageName})
- contentEn does not contain Markdown formatting — plain text only with paragraphs separated by newlines
- Do NOT repeat any idea more than once in the entire analysis
- Do NOT duplicate news text in contentEn then in fullContent — each section adds new information
- keyTakeaways must add new information — not rephrase the title`;

    const aiResult = await Promise.race([
      chatCompletion([
        {
          role: 'system',
          content: unifiedPrompt,
        },
        {
          role: 'user',
          content: titleEn || summaryEn || 'Financial news article',
        },
      ], { temperature: 0.3, maxTokens: 12000, priority: 'generation', locale: 'en' }),  // V387: English pipeline — OpenRouter (Haiku) first, then cheap providers
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('English unified processing timeout')), 180000)
      ),
    ]);

    if (!aiResult.content) {
      result.error = 'AI returned empty content';
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[EnProcessor] AI response received: ${aiResult.provider}/${aiResult.model} in ${aiResult.duration}ms, ${aiResult.content.length} chars`);

    // Parse JSON from AI response
    let parsed = parseAIJson(aiResult.content);
    if (!parsed) {
      result.error = 'Failed to parse AI JSON response';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Handle AI rejection — retry once, then SKIP
    if (parsed.status === 'REJECTED') {
      const reason = parsed.reason || 'Non-financial article';
      console.log(`[EnProcessor] AI tried to REJECT article ${articleId}: "${reason}" — retrying once`);

      const noRejectPrompt = `You are a financial news processor for a ${localeCfg.languageName}-language financial news platform. ❌ Do NOT reject this article ❌

This article has been pre-filtered by a financial keyword filter and is from a reliable source. You MUST process it.
Classify it as Path [C] if you can't find sufficient data, but ❌ do NOT issue status: "REJECTED" ❌

⚠️ Golden rule: Write ONLY real information from the original text. Do NOT invent numbers, names, or events.
⚠️ Write ALL output in ${localeCfg.languageName}. Field names in JSON use "En" suffix for compatibility but content must be in ${localeCfg.languageName}.

Give the result in JSON format only:
{
  "titleEn": "The ${localeCfg.languageName} title — accurate from the source",
  "summaryEn": "${localeCfg.languageName} summary — from original text only",
  "contentEn": "Professional ${localeCfg.languageName} news article — at least 300 words with 4 paragraphs — from original, don't invent",
  "rawData": {"entityNameEn": "Entity name", "ticker": "Symbol or none", "exchange": "Exchange", "figures": ["Numbers from text"], "source": "Source"},
  "path": "C",
  "sector": "Sector",
  "sentimentReason": "Sentiment reason",
  "editedArticle": "Edited article",
  "fullContent": "[1] What happened\\nTwo-sentence summary\\n\\n[5] For traders\\nScarce information",
  "introduction": "Introduction",
  "body": "Analysis",
  "conclusion": "Conclusion",
  "summary": "Summary",
  "sentiment": "neutral",
  "impactLevel": "low",
  "keyTakeaways": ["Point from text"],
  "affectedAssets": [],
  "recommendation": "Scarce information — insufficient data",
  "confidence": "3/10"
}

${localeCfg.languageName} Title: ${titleEn}
${localeCfg.languageName} Summary: ${summaryEn.slice(0, 500)}
${contentEn ? `${localeCfg.languageName} Content: ${contentEn.slice(0, 3000)}` : ''}`;

      try {
        const retryResult = await Promise.race([
          chatCompletion([
            { role: 'system', content: noRejectPrompt },
            { role: 'user', content: titleEn || summaryEn || 'Financial news' },
          ], { temperature: 0.3, maxTokens: 4000, priority: 'generation', locale: 'en' }),  // V387: English pipeline — OpenRouter (Haiku) first
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('EnProcessor no-reject retry timeout')), 60000)
          ),
        ]);

        const retryParsed = parseAIJson(retryResult.content);
        if (retryParsed && !retryParsed.status && retryParsed.titleEn && retryParsed.contentEn
            && isValidEnglishText(retryParsed.titleEn)
            && isValidEnglishText(retryParsed.contentEn, 200)) {
          console.log(`[EnProcessor] No-reject retry SUCCEEDED for ${articleId}`);
          parsed = { ...parsed, ...retryParsed };
          if (!parsed.path) parsed.path = 'C';
          if (!parsed.sector) parsed.sector = category || 'Economy';
        } else {
          console.log(`[EnProcessor] No-reject retry produced insufficient data for ${articleId} — SKIPPING`);
          const currentRejectCount = (article.rejectCount || 0) + 1;
          // V416 FIX: Increment retryCount so the orchestrator/cron filters exclude this article
          // on the next cycle. Without this, 'skipped' articles with retryCount=0 are picked up
          // every 60 seconds, wasting AI API calls on articles the AI already rejected twice.
          await db.newsItem.update({
            where: { id: articleId },
            data: {
              processingStage: 'skipped',
              rejectCount: currentRejectCount,
              retryCount: { increment: 3 },  // Jump past MAX_RETRY_COUNT (15) in ~5 skips instead of 15
              lastError: `SKIPPED: AI rejected + retry produced no valid content. Original reason: ${reason}`,
            },
          });
          result.success = true;
          result.fields = ['skipped'];
          result.duration = Date.now() - startTime;
          return result;
        }
      } catch (retryErr: any) {
        console.warn(`[EnProcessor] No-reject retry FAILED for ${articleId}: ${retryErr.message} — SKIPPING`);
        const currentRejectCount = (article.rejectCount || 0) + 1;
        // V416 FIX: Increment retryCount — same reason as above
        await db.newsItem.update({
          where: { id: articleId },
          data: {
            processingStage: 'skipped',
            rejectCount: currentRejectCount,
            retryCount: { increment: 3 },  // Jump past MAX_RETRY_COUNT faster
            lastError: `SKIPPED: AI rejected + retry failed (${retryErr.message}). Original reason: ${reason}`,
          },
        });
        result.success = true;
        result.fields = ['skipped'];
        result.duration = Date.now() - startTime;
        return result;
      }
    }

    // ── Extract and validate all fields ──
    const updateData: Record<string, any> = {};
    const fields: string[] = [];

    // 1. title (English title — stored in `title` field for English articles)
    if (parsed.titleEn && typeof parsed.titleEn === 'string' && isValidEnglishText(parsed.titleEn, EN_PIPELINE_CONFIG.MIN_EN_TITLE_LENGTH)) {
      let titleEnCleaned = parsed.titleEn.trim();

      // Number integrity check — verify numbers in English title match original
      if (titleEn) {
        const enNumbers = titleEn.match(/\d+(?:\.\d+)?/g) || [];
        for (const num of enNumbers) {
          const numVal = parseFloat(num);
          if (isNaN(numVal) || numVal < 1) continue;
          if (!titleEnCleaned.includes(num)) {
            const shifted = (numVal / 10).toString();
            if (titleEnCleaned.includes(shifted)) {
              console.warn(`[EnProcessor] DECIMAL SHIFT in title: "${num}" became "${shifted}"! Fixing...`);
              titleEnCleaned = titleEnCleaned.replace(shifted, num);
            }
          }
        }
      }

      updateData.title = titleEnCleaned;
      fields.push('title');
    }

    // 2. summary (English summary)
    if (parsed.summaryEn && typeof parsed.summaryEn === 'string' && isValidEnglishText(parsed.summaryEn, EN_PIPELINE_CONFIG.MIN_EN_SUMMARY_LENGTH)) {
      let summaryEnCleaned = parsed.summaryEn.trim();

      // Number integrity check for summary
      if (summaryEn) {
        const enNumbers = summaryEn.match(/\d+(?:\.\d+)?/g) || [];
        for (const num of enNumbers) {
          const numVal = parseFloat(num);
          if (isNaN(numVal) || numVal < 1) continue;
          if (!summaryEnCleaned.includes(num)) {
            const shifted = (numVal / 10).toString();
            if (summaryEnCleaned.includes(shifted)) {
              console.warn(`[EnProcessor] DECIMAL SHIFT in summary: "${num}" → "${shifted}"! Fixing...`);
              summaryEnCleaned = summaryEnCleaned.replace(shifted, num);
            }
          }
        }
      }

      updateData.summary = summaryEnCleaned;
      fields.push('summary');
    }

    // 3. content (English content)
    const effectiveMinContentLength = parsed.path === 'C'
      ? 200   // Path C — brief analysis, but still needs to be substantial (was 80, way too short)
      : EN_PIPELINE_CONFIG.MIN_EN_CONTENT_LENGTH;
    if (parsed.contentEn && typeof parsed.contentEn === 'string' && parsed.contentEn.length >= effectiveMinContentLength && isValidEnglishText(parsed.contentEn, effectiveMinContentLength)) {
      let contentEn = parsed.contentEn.trim();
      contentEn = stripMarkdown(contentEn);
      contentEn = deduplicateEnglishContent(contentEn);
      if (contentEn.length >= effectiveMinContentLength) {
        updateData.content = contentEn;
        fields.push('content');
      }
    }

    // 4. slug (generate with random suffix to reduce collisions)
    if (!article.slug && updateData.title) {
      updateData.slug = generateSlug(updateData.title); // Now includes random 4-char suffix
      fields.push('slug');
    }

    // 5. locale — preserve the target locale (was hardcoded to 'en', now locale-aware)
    updateData.locale = targetLocale;
    fields.push('locale');

    // 6. categoryId
    const categoryId = mapCategoryToId(parsed.sector || category);
    updateData.categoryId = categoryId;
    fields.push('categoryId');

    // 7. Update category to locale-appropriate name if the sector was provided
    if (parsed.sector && typeof parsed.sector === 'string') {
      updateData.category = localeCfg.categoryMap[categoryId] || parsed.sector;
      fields.push('category');
    }

    // 8. aiAnalysis — reconstruct in the format expected by the rest of the pipeline
    if (parsed.path && parsed.fullContent) {
      let fullContent = parsed.fullContent || '';
      let editedArticle = parsed.editedArticle || '';
      let introduction = parsed.introduction || '';
      let body = parsed.body || '';
      let conclusion = parsed.conclusion || '';
      let recommendation = parsed.recommendation || '';

      // Remove English forbidden phrases
      const FORBIDDEN_EN = [
        'investors should', 'it is worth noting that',
        'it should be noted that', 'it is important to note',
        'needless to say', 'it goes without saying',
        'as we all know', 'clearly,',
        'obviously,', 'of course,',
        'monitor developments', 'watch closely',
        'exercise caution', 'remain cautious',
        'stay tuned', 'keep an eye on',
        'it remains to be seen',
      ];

      for (const phrase of FORBIDDEN_EN) {
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escaped, 'gi');
        fullContent = fullContent.replace(re, '');
        editedArticle = editedArticle.replace(re, '');
        recommendation = recommendation.replace(re, '');
        introduction = introduction.replace(re, '');
        body = body.replace(re, '');
        conclusion = conclusion.replace(re, '');
      }

      // Build aiAnalysis JSON
      const aiAnalysis: Record<string, any> = {
        path: parsed.path,
        sector: parsed.sector,
        sentimentReason: parsed.sentimentReason,
        editedArticle,
        fullContent,
        introduction,
        body,
        conclusion,
        summary: parsed.summary || '',
        sentiment: parsed.sentiment || 'neutral',
        impactLevel: parsed.impactLevel || 'low',
        keyTakeaways: parsed.keyTakeaways || [],
        affectedAssets: parsed.affectedAssets || [],
        recommendation,
        confidence: parsed.confidence || '5/10',
        locale: targetLocale,
        rawData: parsed.rawData || {},
      };

      updateData.aiAnalysis = JSON.stringify(aiAnalysis);
      fields.push('aiAnalysis');

      // V417 FIX: If contentEn was NOT extracted (or too short), use fullContent as content fallback.
      // This is the #1 cause of EN articles being blocked by the publisher — the AI generates
      // fullContent in the analysis but the contentEn field is either missing from the JSON or
      // too short after stripMarkdown/dedup. Without this fallback, article.content stays as the
      // short RSS summary (often <80 chars), and the publisher always blocks it.
      if (!updateData.content && fullContent && fullContent.length >= effectiveMinContentLength) {
        const cleanedFullContent = stripMarkdown(fullContent.trim());
        if (cleanedFullContent.length >= effectiveMinContentLength && isValidEnglishText(cleanedFullContent, effectiveMinContentLength)) {
          updateData.content = cleanedFullContent;
          fields.push('content');
          console.log(`[EnProcessor V417] Using fullContent as content fallback for ${articleId} (${cleanedFullContent.length} chars)`);
        }
      }

      // 9. Set sentiment, impactLevel, impactScore from AI analysis
      if (parsed.sentiment) {
        updateData.sentiment = parsed.sentiment;
        fields.push('sentiment');
      }
      if (parsed.impactLevel) {
        updateData.impactLevel = parsed.impactLevel;
        fields.push('impactLevel');
      }
      // Calculate impactScore from confidence
      if (parsed.confidence) {
        const confMatch = String(parsed.confidence).match(/(\d+)\s*\/\s*10/);
        if (confMatch) {
          updateData.impactScore = parseInt(confMatch[1], 10) * 10;
          fields.push('impactScore');
        }
      }
      // Set sentimentScore based on sentiment + impact
      if (parsed.sentiment) {
        const baseScore = parsed.sentiment === 'positive' ? 70 : parsed.sentiment === 'negative' ? 30 : 50;
        const impactMod = parsed.impactLevel === 'high' ? 15 : parsed.impactLevel === 'medium' ? 5 : 0;
        updateData.sentimentScore = parsed.sentiment === 'negative' ? baseScore - impactMod : baseScore + impactMod;
        fields.push('sentimentScore');
      }

      // 10. Set affectedAssets — with content relevance verification
      if (parsed.affectedAssets && Array.isArray(parsed.affectedAssets)) {
        // Verify each asset is actually mentioned in the article content
        const articleTextForVerify = `${titleEn || ''} ${summaryEn || ''} ${parsed.fullContent || ''} ${parsed.body || ''} ${parsed.introduction || ''}`.toLowerCase();
        const COMMODITY_KW: Record<string, string[]> = {
          XAUUSD: ['gold', 'xau', 'precious metal', 'safe haven'], XAGUSD: ['silver', 'xag', 'precious metal'],
          CL: ['oil', 'crude', 'wti', 'petroleum', 'brent', 'opec'], BZ: ['brent', 'oil', 'crude'],
          BTCUSD: ['bitcoin', 'btc', 'cryptocurrency', 'crypto'], ETHUSD: ['ethereum', 'eth', 'crypto'],
          EURUSD: ['euro', 'eur/usd', 'eurusd'], GBPUSD: ['pound', 'sterling', 'gbp/usd'],
          USDJPY: ['yen', 'jpy', 'usd/jpy'],
        };
        const verifiedAssets = parsed.affectedAssets.filter((asset: any) => {
          const sym = (asset.symbol || '').toUpperCase();
          const assetName = (asset.name || '').toLowerCase();
          if (/^[A-Z]{1,5}$/.test(sym) && !COMMODITY_KW[sym]) {
            if (!articleTextForVerify.includes(sym.toLowerCase()) && !(assetName && articleTextForVerify.includes(assetName))) return false;
          }
          const kw = COMMODITY_KW[sym];
          if (kw && !kw.some(k => articleTextForVerify.includes(k.toLowerCase())) && !articleTextForVerify.includes(sym.toLowerCase())) return false;
          return true;
        });
        updateData.affectedAssets = JSON.stringify(verifiedAssets);
        fields.push('affectedAssets');
      }
    }

    // ── Update the article ──
    if (fields.length > 0) {
      await db.newsItem.update({
        where: { id: articleId },
        data: updateData,
      });
    }

    // ── Advance processing stage ──
    // V317: EN processor does content + analysis + sentiment + assets in ONE call.
    // It must jump to 'analyzed' stage so the imager can pick it up next.
    // V417 FIX: Only advance to 'analyzed' if BOTH content AND aiAnalysis were saved.
    // Without this guard, articles with missing content/analysis advance to 'analyzed',
    // get imaged, reach the publisher, and get permanently BLOCKED — cycling forever.
    const hasContent = fields.includes('content');
    const hasAnalysis = fields.includes('aiAnalysis');
    if (hasContent && hasAnalysis) {
      await db.newsItem.update({
        where: { id: articleId },
        data: { processingStage: 'analyzed' },
      });
      console.log(`[EnProcessor V417] Article ${articleId}: ${article.processingStage} → analyzed (content+analysis saved)`);
      result.success = true;
    } else {
      // V417: Don't advance — the imager/publisher will block anyway.
      // Log which fields are missing so we can diagnose.
      const missing = [];
      if (!hasContent) missing.push('content');
      if (!hasAnalysis) missing.push('aiAnalysis');
      console.warn(`[EnProcessor V417] Article ${articleId} NOT advancing — missing: ${missing.join(', ')} (fields saved: ${fields.join(', ')})`);
      // Still report success so the orchestrator doesn't double-retry,
      // but DON'T advance the stage — let the next cycle re-process.
      result.success = true;
    }

    result.fields = fields;
    result.duration = Date.now() - startTime;
    console.log(`[EnProcessor] ✓ Processed ${articleId} in ${result.duration}ms — fields: ${fields.join(', ')}`);
    return result;
  } catch (err: any) {
    result.error = err.message;
    result.duration = Date.now() - startTime;
    console.error(`[EnProcessor] Fatal error for ${articleId}:`, err.message);
    return result;
  }
}
