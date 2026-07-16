// ═══════════════════════════════════════════════════════════════
// Publisher — Direct DB Write + AI Image Generation
// ═══════════════════════════════════════════════════════════════
// Writes the drafted Arabic article directly to NewsItem as a
// PUBLISHED article. Uses the existing image generation system
// (generateImageBuffer + uploadImageToR2) — NOT placeholders.
//
// CRITICAL: This module imports only from src/lib/image-gen.ts and
// src/lib/image-storage.ts (utility modules). It does NOT import
// anything from src/lib/pipeline/ (orchestrator, analyzer, etc.).
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import type { RawEvent, DraftArticle, PublishResult } from './types';
import { generateSlug } from './slug';
import { generateImageBuffer } from '@/lib/image-gen';
import { uploadImageToR2 } from '@/lib/image-storage';
import { sanitizeText } from './sanitize';


// ─── V1185: Symbol → Link conversion (WHITELIST-BASED) ────────
// Converts [[SYMBOL]] markers in article text to clickable HTML links.
// Stock symbols → /stock-analysis/{SYMBOL}
// Forex/commodity/crypto symbols → /markets?tab={category}
//
// CRITICAL FIX (V1185): Previous version (V1180/V1184) used a PATTERN-BASED
// approach that matched ANY 2-6 uppercase letters as a "stock symbol".
// PRODUCTION EVIDENCE (2026-07-08): This caused FALSE links to non-stocks:
//   - "SEC EDGAR" → /stock-analysis/SEC and /stock-analysis/EDGAR (BROKEN PAGES)
//   - "PUMA CAPITAL LLC" → /stock-analysis/PUMA, /stock-analysis/LLC (BROKEN)
//   - "CPU GPU" → /stock-analysis/CPU, /stock-analysis/GPU (BROKEN)
//   - "OTC" → /stock-analysis/OTC (BROKEN)
//   - "DE" → /stock-analysis/DE (BROKEN — Deere is 'DE' but context was different)
//
// V1185 FIX: Switch to WHITELIST approach. Only link symbols that are KNOWN
// stocks (from FMP_VERIFIED_SYMBOLS, TOP_CAC40, TOP_DAX, TOP_FTSE, etc.)
// or known crypto/commodity/index. Unknown uppercase words are NOT linked.

// Crypto symbols (well-known, safe to link)
const CRYPTO_SYMBOLS = new Set(['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'AVAX', 'LINK', 'LTC', 'UNI', 'ATOM', 'XLM']);

// Commodity symbols
const COMMODITY_SYMBOLS = new Set(['GOLD', 'XAU', 'SILVER', 'XAG', 'OIL', 'WTI', 'BRENT', 'NATGAS', 'COPPER', 'PLATINUM', 'PALLADIUM']);

// Index symbols
const INDEX_SYMBOLS = new Set(['SPX', 'SP500', 'NDX', 'NASDAQ', 'DJI', 'DOW', 'VIX', 'DXY', 'FTSE', 'DAX', 'CAC', 'NIKKEI', 'HSI']);

// Forex pairs (6-letter currency pairs)
const FOREX_PATTERN = /^[A-Z]{6}$/;

// V1185: KNOWN STOCK SYMBOLS — Whitelist built from stock-analysis-pipeline.ts
// These are the ONLY symbols that get linked to /stock-analysis/{SYMBOL}.
// Any uppercase word NOT in this set is left as plain text (no broken links).
const KNOWN_STOCK_SYMBOLS = new Set([
  // FMP_VERIFIED_SYMBOLS (US large caps)
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V',
  'UNH', 'JNJ', 'WMT', 'XOM', 'PG', 'MA', 'HD', 'CVX', 'MRK', 'ABBV',
  'AVGO', 'KO', 'PEP', 'COST', 'ADBE', 'CRM', 'AMD', 'NFLX', 'INTC', 'CMCSA',
  'LLY', 'NVO', 'ORCL', 'CSCO', 'ABT', 'CVS', 'AXP', 'MCD', 'MDLZ', 'TXN',
  'ISRG', 'GILD', 'REGN', 'VRTX', 'BIIB', 'SBUX', 'BKNG', 'AMGN', 'CAT', 'DE',
  // ADDITIONAL_SP500
  'PYPL', 'SQ', 'SHOP', 'SNAP', 'PIN', 'ROKU', 'ZM', 'DOCU', 'OKTA', 'CRWD',
  'SNOW', 'PLTR', 'COIN', 'RBLX', 'ABNB', 'RIVN', 'LCID', 'NIO', 'XPEV', 'LI',
  'BABA', 'JD', 'PDD', 'NTES', 'TCEHY', 'SE', 'GRAB', 'MSTR', 'MARA', 'RIOT',
  'NVS', 'SNY', 'MRNA', 'BNTX',
  'DELL', 'HPQ', 'HPE', 'IBM', 'MU', 'LRCX', 'AMAT', 'KLAC', 'MRVL',
  'CMG', 'YUM', 'DPZ', 'LULU', 'TGT', 'DLTR', 'DG', 'FIVE',
  'BA', 'LMT', 'RTX', 'NOC', 'GD', 'GE', 'MMM', 'HON',
  // ADDITIONAL_ASIA (US-listed ADRs only — Asian exchange symbols use suffixes)
  'BIDU', 'FUTU', 'TME', 'IQ', 'VIPS', 'INFY', 'WIT', 'HDB', 'IBN',
  'SEA', 'AEM', 'KL',
  // ETFs (safe to link — they have analysis pages)
  'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VEA', 'VWO', 'BND', 'TLT', 'GLD',
  'SLV', 'USO', 'XLF', 'XLE', 'XLK', 'XLV', 'XLY', 'XLP', 'XLI', 'XLU',
  // CAC 40 (French)
  'MC.PA', 'TTE.PA', 'OR.PA', 'SAP.PA', 'BNP.PA', 'RMS.PA', 'AI.PA', 'EL.PA',
  'SAN.PA', 'CS.PA', 'CAP.PA', 'EN.PA', 'GLE.PA', 'SU.PA', 'RI.PA', 'DG.PA',
  'AIR.PA', 'ALO.PA', 'BN.PA', 'ENGI.PA', 'WLN.PA', 'STLA.PA', 'HO.PA', 'KRNY.PA', 'ACA.PA', 'DSY.PA',
  // DAX (German)
  'SAP.DE', 'SIE.DE', 'ALV.DE', 'DTE.DE', 'IFX.DE', 'ADS.DE', 'BAS.DE', 'BMW.DE', 'BAYN.DE', 'CON.DE',
  'AIR.DE', 'RWE.DE', 'HEI.DE', 'FRE.DE', 'SHL.DE', 'QIA.DE', 'BOSS.DE',
  // FTSE (British)
  'SHEL.L', 'AZN.L', 'HSBA.L', 'ULVR.L', 'BP.L', 'GSK.L', 'RIO.L', 'BA.L', 'DGE.L', 'REL.L',
  'AZM.L', 'HLN.L', 'LSEG.L', 'SGE.L', 'PSN.L', 'PRU.L', 'DCC.L', 'SVT.L', 'SMDS.L', 'CPG.L',
  // Tadawul (Saudi)
  '2222.SR', '1120.SR', '2380.SR', '1180.SR', '1210.SR', '1320.SR', '4005.SR', '4090.SR',
]);

/**
 * V1185: Determine the link target for a symbol.
 * Returns null if symbol is NOT in the whitelist.
 * This prevents broken links to non-stocks (SEC, EDGAR, CPU, GPU, LLC, OTC, etc.)
 */
function getSymbolLink(symbol: string): string | null {
  const sym = symbol.toUpperCase().trim();
  if (!sym || sym.length < 2 || sym.length > 10) return null;

  // Forex pairs (6 letters) — checked first because they're a distinct pattern
  if (FOREX_PATTERN.test(sym)) {
    return '/markets?tab=forex';
  }

  // Crypto/commodity/index — these have their own pages
  if (CRYPTO_SYMBOLS.has(sym)) return '/markets?tab=crypto';
  if (COMMODITY_SYMBOLS.has(sym)) return '/markets?tab=commodities';
  if (INDEX_SYMBOLS.has(sym)) return '/markets?tab=overview';

  // V1185: Only link KNOWN stock symbols (whitelist)
  if (KNOWN_STOCK_SYMBOLS.has(sym)) {
    return `/stock-analysis/${sym}`;
  }

  // Unknown symbol — return null (no link, prevents broken pages)
  return null;
}

/**
 * Convert all [[SYMBOL]] markers in text to clickable HTML links.
 * Symbols that don't match any known pattern are left as plain text (without brackets).
 */
function convertSymbolLinks(text: string): string {
  if (!text) return text;
  return text.replace(/\[\[([A-Z]{1,10}(?:\.[A-Z]{2})?)\]\]/g, (match, symbol: string) => {
    const link = getSymbolLink(symbol);
    if (link) {
      return `<a href="${link}" class="symbol-link" style="color: #00E5FF; text-decoration: underline; font-weight: 600;">${symbol}</a>`;
    }
    // Unknown symbol — render as plain text (remove brackets)
    return symbol;
  });
}

/**
 * V1184: Auto-link stock symbols in article text WITHOUT relying on the LLM
 * to add [[SYMBOL]] markers.
 *
 * PRODUCTION EVIDENCE (2026-07-08): The LLM consistently ignored the
 * [[SYMBOL]] instruction in the prompt — 0 out of 10 published articles
 * contained any [[SYMBOL]] markers, so convertSymbolLinks() had nothing
 * to convert and no links appeared.
 *
 * SOLUTION: After convertSymbolLinks() handles any [[SYMBOL]] the LLM did add,
 * this function scans the text for standalone stock symbols (uppercase letters,
 * 2-6 chars, optional .PA/.DE/.L suffix) that are NOT already inside an <a> tag
 * and converts them to links.
 *
 * SAFETY: Only links symbols that:
 * 1. Are 2-6 uppercase letters (avoid common words)
 * 2. Have optional exchange suffix (.PA, .DE, .L, .SR, .T)
 * 3. Are surrounded by word boundaries (not part of a larger word)
 * 4. Are NOT inside an existing <a>...</a> tag
 * 5. Are NOT inside [[...]] (those are handled by convertSymbolLinks)
 *
 * Also handles Arabic stock names: تسلا→TSLA, أبل→AAPL, etc. via ARABIC_TO_SYMBOL map.
 */
const ARABIC_TO_SYMBOL: Record<string, string> = {
  'تسلا': 'TSLA', 'تيسلا': 'TSLA',
  'أبل': 'AAPL', 'ابل': 'AAPL', 'آبل': 'AAPL',
  'مايكروسوفت': 'MSFT', 'ميكروسوفت': 'MSFT',
  'ألفابت': 'GOOGL', 'الفابت': 'GOOGL', 'جوجل': 'GOOGL', 'غوغل': 'GOOGL',
  'أمازون': 'AMZN', 'امازون': 'AMZN',
  'إنفيديا': 'NVDA', 'انفيديا': 'NVDA', 'نفيديا': 'NVDA',
  'ميتا': 'META', 'فيسبوك': 'META',
  'إنتل': 'INTC', 'انتل': 'INTC',
  'نتفليكس': 'NFLX', 'نيتفليكس': 'NFLX',
  'بيتكوين': 'BTC', 'بتكوين': 'BTC', 'البيتكوين': 'BTC',
  'إيثيريوم': 'ETH', 'ايثيريوم': 'ETH', 'الإيثيريوم': 'ETH',
  'الذهب': 'GOLD',
  'النفط': 'OIL',
};

function autoLinkSymbols(text: string): string {
  if (!text) return text;

  // V1186 FIX: Normalize whitespace and fix broken symbol notation BEFORE linking.
  // PRODUCTION EVIDENCE: LLM wrote "SIE.\nDE" (with newline) which the regex
  // matched as two separate words "SIE." and "DE", creating a broken link:
  //   <a href="/stock-analysis/SIE.\nDE">SIE. DE</a>
  //
  // Fix step 1: Collapse all whitespace (including newlines) to single spaces.
  // Fix step 2: Remove spaces between uppercase letters and dots in stock symbol
  //   notation: "SIE. DE" → "SIE.DE", "RI. PA" → "RI.PA", "2222. SR" → "2222.SR"
  //   This pattern (LETTERS.DOT SPACE LETTERS) only appears in stock symbols,
  //   never in normal Arabic/English text, so it's safe to normalize globally.
  let result = text
    .replace(/\s+/g, ' ')
    .replace(/\b([A-Z]{2,6}|\d{4})\.\s+([A-Z]{2})\b/g, '$1.$2');

  // Step 1: Convert Arabic stock names to symbols.
  // Use word boundaries that work with Arabic (surrounding spaces, punctuation, start/end).
  for (const [arabicName, symbol] of Object.entries(ARABIC_TO_SYMBOL)) {
    // Match the Arabic name as a standalone word (not part of a larger word).
    // Use lookbehind/lookahead for non-letter characters (Arabic or Latin).
    const pattern = new RegExp(`(^|[\\s,.،؛:!؟()\\[\\]"'<>])(${arabicName})(?=$|[\\s,.،؛:!؟()\\[\\]"'<>])`, 'g');
    result = result.replace(pattern, (match, prefix, _name) => {
      const link = getSymbolLink(symbol);
      if (link) {
        return `${prefix}<a href="${link}" class="symbol-link" style="color: #00E5FF; text-decoration: underline; font-weight: 600;">${arabicName}</a>`;
      }
      return match;
    });
  }

  // Step 2: Convert standalone uppercase Latin symbols that are in the whitelist.
  // V1185: getSymbolLink() now returns null for non-whitelisted symbols,
  // so FALSE_POSITIVES check is no longer needed.
  // Strategy: split by <a> tags, only process text outside tags.
  const parts = result.split(/(<a\s[^>]*>.*?<\/a>)/g);
  for (let i = 0; i < parts.length; i++) {
    // Odd indices are <a> tags — skip them
    if (i % 2 === 1) continue;
    // Even indices are plain text — process them
    parts[i] = parts[i].replace(
      /\b([A-Z]{2,6}(?:\.[A-Z]{2})?)\b/g,
      (match, symbol: string) => {
        const link = getSymbolLink(symbol);
        if (link) {
          return `<a href="${link}" class="symbol-link" style="color: #00E5FF; text-decoration: underline; font-weight: 600;">${symbol}</a>`;
        }
        return match;
      }
    );
  }
  result = parts.join('');

  return result;
}

// ─── Category → image prompt mapping (matches imager.ts pattern) ───
const CATEGORY_VISUALS: Record<string, string> = {
  economy: 'economic indicators, GDP charts, central bank building, financial markets overview',
  stocks: 'stock market trading floor, charts, financial district, ticker boards',
  crypto: 'cryptocurrency blockchain concept, digital coins, dark background with neon',
  commodities: 'oil barrels, gold bars, commodities trading, raw materials',
  forex: 'currency exchange, dollar euro yen, forex trading screens',
  central_banks: 'central bank building, federal reserve, monetary policy, official institution',
};

function buildImagePrompt(title: string, category: string): string {
  const visual = CATEGORY_VISUALS[category] || CATEGORY_VISUALS.economy;
  return `Professional financial news illustration: ${visual}. Modern, clean, editorial style. No text overlay. High quality journalism illustration. ${title.slice(0, 60)}`;
}

/**
 * Generate an AI image and upload to R2.
 * Falls back to null if all providers fail (article publishes without image).
 */
async function generateArticleImage(title: string, category: string): Promise<string | null> {
  try {
    const prompt = buildImagePrompt(title, category);
    console.log(`[Agency Publisher] Generating image: "${prompt.slice(0, 60)}..."`);

    const imgBuffer = await generateImageBuffer(prompt, 'landscape');
    if (!imgBuffer || imgBuffer.length < 2000) {
      console.warn('[Agency Publisher] Image generation failed (all providers)');
      return null;
    }

    // Upload to R2
    const tempId = `agency-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const r2Result = await uploadImageToR2(`article-images/${tempId}`, imgBuffer, 'image/jpeg');

    if (r2Result.success && r2Result.url) {
      console.log(`[Agency Publisher] ✓ Image uploaded to R2: ${r2Result.url.slice(0, 60)}...`);
      return r2Result.url;
    }

    // V1108: NEVER store base64 in DB — causes massive bloat.
    // If R2 fails, return null (article publishes without image).
    // The UI handles null imageUrl gracefully.
    console.warn('[Agency Publisher] R2 upload failed — publishing WITHOUT image (no base64 in DB)');
    return null;
  } catch (err: any) {
    console.warn(`[Agency Publisher] Image generation error: ${err.message?.slice(0, 80)}`);
    return null;
  }
}

/**
 * Cross-pipeline dedup: check if an article with the same URL
 * already exists in NewsItem (from the news-writer or RSS pipeline).
 */
async function checkCrossPipelineDuplicate(
  url: string,
  locale: string
): Promise<{ isDuplicate: boolean; existingId?: string }> {
  if (!url) return { isDuplicate: false };

  const existing = await db.newsItem.findFirst({
    where: { url, locale },
    select: { id: true, isPublished: true, publishedAt: true },
  });

  if (existing) {
    return { isDuplicate: true, existingId: existing.id };
  }

  return { isDuplicate: false };
}

/**
 * Generate a unique slug.
 */
async function generateUniqueSlug(title: string, locale: string): Promise<string> {
  const baseSlug = generateSlug(title);
  const shortId = Math.random().toString(36).slice(2, 10);
  const slug = `${baseSlug}-${shortId}`.slice(0, 200);

  const existing = await db.newsItem.findFirst({
    where: { slug, locale },
    select: { id: true },
  });

  if (existing) {
    return `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  return slug;
}

/**
 * Publish a drafted article to NewsItem.
 *
 * Steps:
 * 1. Cross-pipeline dedup check (skip if same URL exists)
 * 2. Generate AI image (uses existing image-gen system)
 * 3. Generate unique slug
 * 4. Insert directly as published NewsItem (with aiAnalysis containing fullContent)
 * 5. Update AgencyEvent with newsItemId + publishedAt + status
 */
export async function publishArticle(
  agencyEventId: string,
  event: RawEvent,
  draft: DraftArticle
): Promise<PublishResult> {
  try {
    // Step 1: Cross-pipeline dedup
    const dupCheck = await checkCrossPipelineDuplicate(event.url, event.locale);
    if (dupCheck.isDuplicate) {
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: {
          status: 'published',
          newsItemId: dupCheck.existingId,
          publishedAt: new Date(),
          lastError: 'cross-pipeline duplicate — linked to existing article',
        },
      });

      return {
        success: false,
        duplicate: true,
        agencyEventId,
        newsItemId: dupCheck.existingId,
        reason: 'cross-pipeline duplicate',
      };
    }

    // V1148: Multi-layer dedup — uses canonical symbol map + content hash.
    // Replaces the old V1125 single-ticker matching that missed:
    //   - "تسلا" vs "تيسلا" (Arabic variants)
    //   - "Communication Services" sector (not in ticker list)
    //   - "أوكرانيا 95/100" (geopolitical entity)
    // Now uses isDuplicateArticle() from lib/dedup.ts (3-layer system).
    try {
      const { isDuplicateArticle } = await import('./dedup');
      const articleDedup = await isDuplicateArticle(draft.draftTitle, draft.draftSummary);
      if (articleDedup.duplicate) {
        console.warn(`[Agency V1148] Article rejected — duplicate: ${articleDedup.reason}`);
        await db.agencyEvent.update({
          where: { id: agencyEventId },
          data: {
            status: 'failed',
            retryCount: { increment: 1 },
            lastError: `V1148 dedup: ${articleDedup.reason}`,
            newsItemId: articleDedup.existingId || null,
          },
        });
        return {
          success: false,
          duplicate: true,
          agencyEventId,
          newsItemId: articleDedup.existingId,
          reason: `V1148 dedup: ${articleDedup.reason}`,
        };
      }
    } catch (dedupErr: any) {
      // If dedup check fails, allow publishing (fail-open to avoid blocking all articles)
      console.warn(`[Agency V1148] Article dedup check failed, allowing publish: ${dedupErr.message?.slice(0, 80)}`);
    }

    // Step 2: Generate AI image (uses existing image-gen system)
    const imageUrl = await generateArticleImage(draft.draftTitle, event.category);

    // Step 3: Generate slug
    const slug = await generateUniqueSlug(draft.draftTitle, event.locale);

    // Step 4: Build aiAnalysis JSON — moved to V1131 block below (after validation)
    // V1131: aiAnalysis is now built AFTER validation, using verified analysisText

    // Map sentiment to sentimentScore
    const sentimentScore = draft.sentiment === 'positive' ? 70 : draft.sentiment === 'negative' ? 30 : 50;
    const impactScore = draft.impactLevel === 'high' ? 80 : draft.impactLevel === 'medium' ? 50 : 25;

    // Map category to Arabic
    const categoryMap: Record<string, string> = {
      economy: 'اقتصاد كلي',
      stocks: 'أسهم',
      crypto: 'كريبتو',
      commodities: 'سلع',
      forex: 'عملات',
      central_banks: 'بنوك مركزية',
    };

    // V1137: contentAr = news body (the FULL article text)
    // V1115 set this to '' which caused articles to show ONLY summary (no body)
    // The "مترجم" badge is controlled by source name exclusion in the UI, NOT by contentAr.
    // Duplication is prevented by NOT putting newsBody in aiAnalysis.body.
    //
    // V1184 FIX: Store PLAIN TEXT in contentAr — NO HTML.
    // Previous versions (V1180/V1184) generated <a> tags and <div> styling
    // directly in contentAr, which caused:
    //   1. Raw HTML appearing in RSS feeds, search results, mobile apps
    //   2. Inconsistent styling across different rendering contexts
    //   3. SEO problems (search engines see HTML as content)
    //   4. Accessibility issues (screen readers read HTML tags)
    // Now: contentAr is pure Arabic text. The frontend handles symbol linking
    // and styling via React components.
    let newsBody = draft.draftBody || draft.draftSummary || '';
    // V1126: Don't fall back to draftBody if it's a hash
    let analysisText = (draft.fullContent && draft.fullContent.trim().length > 0)
      ? draft.fullContent
      : (draft.draftBody && !draft.draftBody.trim().startsWith('$') ? draft.draftBody : '');

    // V1188: Strip [[SYMBOL]] markers — store clean text in contentAr.
    // The frontend (SymbolLinkedText component) auto-detects symbols from plain text.
    // Storing [[ ]] markers caused ugly brackets to appear in RSS, search, and
    // some frontend sections that don't use SymbolLinkedText.
    newsBody = newsBody.replace(/\[\[([A-Z]{1,10}(?:\.[A-Z]{2})?)\]\]/g, '$1');

    // ═══════════════════════════════════════════════════════════════
    // V1211: JSON Leak Sanitizer — Defense in depth
    // Even if orchestrator's V1211-A check somehow misses a leak (e.g., due to
    // a race or new field name), strip any JSON-metadata patterns from BOTH
    // newsBody and analysisText before storing in DB.
    // The Visa article literally showed "fullContent: [1]..." to readers.
    // ═══════════════════════════════════════════════════════════════
    const JSON_LEAK_REGEX = /^(fullContent|affectedAssets|sentiment|impactLevel|recommendation|analysisPath|internalContext|draftTitle|draftBody|draftSummary|llmProvider|numericCheckPassed)\s*:[^\n]*$/gm;
    const beforeBodyLen = newsBody.length;
    const beforeAnalysisLen = analysisText.length;
    newsBody = newsBody.replace(JSON_LEAK_REGEX, '').replace(/\n{3,}/g, '\n\n').trim();
    analysisText = analysisText.replace(JSON_LEAK_REGEX, '').replace(/\n{3,}/g, '\n\n').trim();
    if (newsBody.length < beforeBodyLen - 10 || analysisText.length < beforeAnalysisLen - 10) {
      console.warn(`[Agency V1211-Publisher] Stripped JSON leak from content (body: ${beforeBodyLen}→${newsBody.length}, analysis: ${beforeAnalysisLen}→${analysisText.length})`);
    }

    // V1211: Also strip "sentiment: neutral impactLevel: low" inline patterns
    // (the Visa article had these concatenated at the end)
    const INLINE_LEAK_REGEX = /\s*(sentiment|impactLevel|affectedAssets)\s*:\s*[^\n\[]{0,50}(?=\s|$)/g;
    newsBody = newsBody.replace(INLINE_LEAK_REGEX, '').trim();
    analysisText = analysisText.replace(INLINE_LEAK_REGEX, '').trim();

    // V1211: Reject if after cleaning, body is now empty (was pure JSON leak)
    if (newsBody.trim().length < 50) {
      console.error(`[Agency Publisher V1211] Rejecting — body is pure JSON leak, no real content`);
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: {
          status: 'failed',
          retryCount: { increment: 1 },
          lastError: `V1211: body is pure JSON leak`,
        },
      });
      return {
        success: false,
        agencyEventId,
        reason: `body is pure JSON leak — rejected`,
      };
    }

    // V1188: Reject articles with non-Arabic titles
    // The LLM sometimes returns English titles for Arabic articles
    const arabicCharCount = (draft.draftTitle.match(/[\u0600-\u06FF]/g) || []).length;
    if (arabicCharCount < 3) {
      console.error(`[Agency Publisher V1188] Rejecting — title not Arabic: "${draft.draftTitle}"`);
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: {
          status: 'failed',
          retryCount: { increment: 1 },
          lastError: `V1188: title not Arabic (${arabicCharCount} Arabic chars)`,
        },
      });
      return {
        success: false,
        agencyEventId,
        reason: `title not Arabic — rejected`,
      };
    }

    // V1188: Reject articles with banned filler phrases
    const BANNED_FILLER = [
      'ما يعكس', 'ما يدل على', 'ما يبرز', 'ما يضع',
      'يدل على استقرار', 'يعكس قوة',
    ];
    const foundFiller = BANNED_FILLER.filter(p => newsBody.includes(p));
    if (foundFiller.length >= 2) {
      console.error(`[Agency Publisher V1188] Rejecting — filler phrases: ${foundFiller.join(', ')}`);
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: {
          status: 'failed',
          retryCount: { increment: 1 },
          lastError: `V1188: filler phrases (${foundFiller.join(', ')})`,
        },
      });
      return {
        success: false,
        agencyEventId,
        reason: `filler phrases — rejected`,
      };
    }

    // V1191: Reject articles with English sector names in Arabic content
    // The LLM sometimes writes "قطاع Technology" or "قطاع Financials" instead of using Arabic translations.
    // Stock tickers (TSLA, AAPL, NVDA) are allowed — only full English words for sectors are rejected.
    const ENGLISH_SECTORS = [
      'Technology', 'Healthcare', 'Financials', 'Financial Services',
      'Consumer Cyclical', 'Consumer Defensive', 'Consumer Staples',
      'Industrials', 'Energy', 'Materials', 'Basic Materials',
      'Real Estate', 'Communication Services', 'Utilities',
      'Semiconductors', 'Biotech', 'Biotechnology', 'Pharma',
      'Pharmaceuticals', 'Automotive', 'Aerospace', 'Defense',
      'Banks', 'Banking', 'Finance',
    ];
    const foundEnglishSector = ENGLISH_SECTORS.filter(s => {
      // Match as a whole word (not part of a stock ticker or URL)
      // Must be preceded by a space, Arabic letter, or start of string
      // and followed by a space, Arabic letter, punctuation, or end of string
      const regex = new RegExp(`(^|[\\s\\u0600-\\u06FF])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\u0600-\\u06FF.,;:!?]|$)`, 'u');
      return regex.test(newsBody) || regex.test(draft.draftTitle);
    });
    if (foundEnglishSector.length > 0) {
      console.error(`[Agency Publisher V1191] Rejecting — English sector name in Arabic content: ${foundEnglishSector.join(', ')}`);
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: {
          status: 'failed',
          retryCount: { increment: 1 },
          lastError: `V1191: English sector name (${foundEnglishSector.join(', ')}) — must use Arabic translation`,
        },
      });
      return {
        success: false,
        agencyEventId,
        reason: `English sector name — rejected`,
      };
    }

    // V1188: Also strip [[ ]] from analysisText
    analysisText = analysisText.replace(/\[\[([A-Z]{1,10}(?:\.[A-Z]{2})?)\]\]/g, '$1');

    // V1205: Fix dramatic overstatement — 'ينهار' for < 5% is misleading
    const titlePctMatch = draft.draftTitle.match(/ينهار\s+(\d+\.?\d*)%/) || draft.draftTitle.match(/(\d+\.?\d*)%.*ينهار/);
    if (titlePctMatch) {
      const pct = parseFloat(titlePctMatch[1]);
      if (pct < 5) {
        draft.draftTitle = draft.draftTitle.replace(/ينهار/g, 'يتذبذب');
        console.warn(`[Agency V1205] Fixed dramatic title: 'ينهار ${pct}%' → 'يتذبذب'`);
      }
    }

    // V1184: Append "read full analysis" link as PLAIN TEXT (not HTML div).
    // The frontend will style this appropriately.
    if (event.analysisUrl) {
      newsBody += `\n\n📊 للاطلاع على التحليل الفني المفصل والشامل، اطلع على صفحة تحليل السهم: ${event.analysisUrl}`;
    }

    // V1184: Add financial disclaimer for articles with price predictions
    // Required by financial journalism standards — protects against liability
    if (newsBody.includes('توقع') || newsBody.includes('مستهدف') || newsBody.includes('هدف')) {
      newsBody += '\n\n⚠️ تنبيه: هذه المعلومات لأغراض إعلامية فقط ولا تُشكل نصيحة استثمارية. التداول في الأسواق المالية ينطوي على مخاطر.';
    }

    // V1184: Add source attribution if missing
    // Financial articles must cite where price data came from
    if (!newsBody.includes('وفقاً') && !newsBody.includes('حسب') && !newsBody.includes('طبقاً')) {
      const dataSource = event.sourceName || 'بيانات السوق المباشرة';
      newsBody = newsBody.replace(
        /^سجل سهم/,
        `وفقاً لـ ${dataSource}، سجل سهم`
      );
    }

    // V1131+V1194: FINAL DEFENSE — reject ONLY if analysisText is a hash or empty.
    // V1194: Relaxed minimum length from 100 to 30 chars.
    // V1197: Also reject if analysisText looks like a bcrypt/bcrypt-like hash
    // ($2a, $2b, $2y, $29, etc.) — these are NOT valid Arabic content.
    if (!analysisText || analysisText.trim().length < 30 || analysisText.trim().startsWith('$')) {
      console.error(`[Agency Publisher V1131] Rejecting article — analysisText invalid: "${analysisText.slice(0, 50)}" (len=${analysisText.length})`);
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: {
          status: 'failed',
          retryCount: { increment: 1 },
          lastError: `Publisher V1131: analysisText invalid (len=${analysisText.length}, preview=${analysisText.slice(0, 50)})`,
        },
      });
      return {
        success: false,
        agencyEventId,
        reason: `analysisText invalid — hash or too short`,
      };
    }

    // V1197: Extra check — if analysisText looks like a hash pattern ($XX followed by digits/letters)
    // reject it. Catches $29, $2a, $2b, $2y, etc.
    if (/^\$[0-9a-z]{2,4}\$/i.test(analysisText.trim()) || /^\$[0-9a-z]{2,10}$/i.test(analysisText.trim())) {
      console.error(`[Agency Publisher V1197] Rejecting article — analysisText is hash: "${analysisText.slice(0, 30)}"`);
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: {
          status: 'failed',
          retryCount: { increment: 1 },
          lastError: `Publisher V1197: analysisText is hash: ${analysisText.slice(0, 30)}`,
        },
      });
      return {
        success: false,
        agencyEventId,
        reason: `analysisText is hash — rejected`,
      };
    }

    // V1131: Also verify aiAnalysis.fullContent is valid before storing
    const aiAnalysisObj = {
      path: draft.analysisPath || 'B',
      fullContent: analysisText,
      editedArticle: newsBody,
      body: '',  // V1137: empty — body is in contentAr, not duplicated here
      introduction: draft.draftSummary,
      conclusion: draft.recommendation || draft.draftSummary,
      summary: draft.draftSummary,
      sentiment: draft.sentiment,
      impactLevel: draft.impactLevel,
      affectedAssets: draft.affectedAssets || [],
      recommendation: draft.recommendation,
      agencyGenerated: true,
      sourceId: event.sourceId,
      sourceName: event.sourceName,
      llmProvider: draft.llmProvider,
      numericCheckPassed: draft.numericCheckPassed,
      generatedAt: new Date().toISOString(),
    };

    // Step 5: Insert directly as published NewsItem
    // V1181: Sanitize ALL text fields before insert to prevent NULL byte errors
    const newsItem = await db.newsItem.create({
      data: {
        title: sanitizeText(draft.draftTitle),
        titleAr: sanitizeText(draft.draftTitle),
        summary: sanitizeText(draft.draftSummary),
        summaryAr: sanitizeText(draft.draftSummary),
        content: sanitizeText(analysisText),  // V1115: [1]-[6] analysis (UI parses this for sections)
        contentAr: sanitizeText(newsBody),      // V1137: FULL news body — this is the article text shown to readers
        source: 'محرر رؤى الذكي',
        sourceName: 'محرر رؤى الذكي',
        isOfficialSource: true,
        url: sanitizeText(event.url),
        category: sanitizeText(categoryMap[event.category] || 'اقتصاد كلي'),
        categoryId: sanitizeText(event.category),
        sentiment: sanitizeText(draft.sentiment),
        sentimentScore,
        impactLevel: sanitizeText(draft.impactLevel),
        impactScore,
        originalLanguage: 'ar',
        locale: sanitizeText(event.locale) || 'ar',
        newsType: 'live',
        affectedAssets: sanitizeText(JSON.stringify(draft.affectedAssets || [])),
        aiAnalysis: sanitizeText(JSON.stringify(aiAnalysisObj)),  // V1131: use verified object
        isPublished: true,
        isReady: true,
        processingStage: 'agency_done',
        slug: sanitizeText(slug),
        fetchedAt: new Date(),
        publishedAt: new Date(),
        createdAt: new Date(),
        imageUrl: sanitizeText(imageUrl),
        generatedImage: sanitizeText(imageUrl),
      },
    });

    // V1145+V1194: POST-INSERT VERIFICATION — check ONLY for $-hash corruption.
    // V1194: Relaxed minimum length from 50 to 10 chars. Valid short articles were
    // being rejected. Only delete if content starts with $ (hash corruption).
    const inserted = await db.newsItem.findUnique({
      where: { id: newsItem.id },
      select: { content: true, contentAr: true, aiAnalysis: true },
    });
    if (inserted && (!inserted.content || inserted.content.trim().startsWith('$'))) {
      console.error(`[Agency Publisher V1145] POST-INSERT CORRUPTION DETECTED! content="${inserted.content?.slice(0, 50)}" — DELETING article ${newsItem.id}`);
      await db.newsItem.delete({ where: { id: newsItem.id } });
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: {
          status: 'failed',
          retryCount: { increment: 1 },
          lastError: `V1145: post-insert corruption — content="${inserted.content?.slice(0, 30)}" aiAnalysis=${inserted.aiAnalysis ? 'present' : 'NULL'}`,
        },
      });
      return {
        success: false,
        agencyEventId,
        reason: `post-insert corruption detected and deleted`,
      };
    }
    // Also verify aiAnalysis was stored
    if (inserted && !inserted.aiAnalysis) {
      console.error(`[Agency Publisher V1145] aiAnalysis is NULL after insert! Updating with valid data`);
      await db.newsItem.update({
        where: { id: newsItem.id },
        data: { aiAnalysis: JSON.stringify(aiAnalysisObj) },
      });
    }

    // Step 6: Update AgencyEvent
    await db.agencyEvent.update({
      where: { id: agencyEventId },
      data: {
        status: 'published',
        newsItemId: newsItem.id,
        publishedAt: new Date(),
      },
    });

    return {
      success: true,
      newsItemId: newsItem.id,
      agencyEventId,
    };
  } catch (err: any) {
    try {
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: {
          status: 'failed',
          retryCount: { increment: 1 },
          lastError: `publish failed: ${err.message?.slice(0, 200)}`,
        },
      });
    } catch {}

    return {
      success: false,
      agencyEventId,
      reason: err.message?.slice(0, 100),
    };
  }
}

/**
 * Disconnect Prisma client (for graceful shutdown).
 */
export async function disconnectPublisher(): Promise<void> {
  // no-op — shared db instance
}
