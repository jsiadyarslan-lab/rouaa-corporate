// ─── String Utility Functions for Stock Analysis ──────────
// Provides text sanitization and formatting helpers
// to clean raw Markdown, AI-generated titles, and display names.
// V2: Improved handling of AI-generated titles with section headings,
//     Arabic analysis prefixes, and long descriptive suffixes.

/**
 * Remove raw Markdown markers from text before displaying to users.
 * Strips: ##, ###, **, *, `, __, ~~, >, ---, - (list markers at line start)
 * Also strips common AI output artifacts (emoji, section numbers).
 * Preserves the actual content between markers.
 */
export function sanitizeMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let clean = text;

  // Remove Markdown headers (# ## ### etc.) — keep the text after them
  clean = clean.replace(/^#{1,6}\s+/gm, '');

  // Remove bold markers **text** or __text__ → text
  // V2: Use global non-greedy to handle nested ** like **Mondelez International (MDLZ)**
  clean = clean.replace(/\*\*([^*]*(?:\*(?!\*)[^*]*)*)\*\*/g, '$1');
  clean = clean.replace(/__(.*?)__/g, '$1');
  // V2: Remove orphaned ** markers left over from nested/partial bold
  clean = clean.replace(/\*\*/g, '');

  // Remove italic markers *text* or _text_ → text
  // Be careful not to remove single underscores in identifiers (e.g., S_P_500)
  clean = clean.replace(/(?<!\w)\*(?!\*)(.+?)(?<!\*)\*(?!\w)/g, '$1');
  clean = clean.replace(/(?<!\w)_(?!_)(.+?)(?<!_)_(?!\w)/g, '$1');

  // Remove inline code backticks `text` → text
  clean = clean.replace(/`([^`]+)`/g, '$1');

  // Remove strikethrough ~~text~~ → text
  clean = clean.replace(/~~(.*?)~~/g, '$1');

  // Remove blockquote markers > at start of lines
  clean = clean.replace(/^>\s*/gm, '');

  // Remove horizontal rules --- or *** or ___
  clean = clean.replace(/^[-*_]{3,}\s*$/gm, '');

  // Remove leading list markers (- or * followed by space) at start of lines
  clean = clean.replace(/^[-*]\s+/gm, '');

  // Remove numbered list markers (1. 2. etc.) at start of lines
  clean = clean.replace(/^\d+\.\s+/gm, '');

  // Remove link syntax [text](url) → text
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove image syntax ![alt](url) → alt
  clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Remove HTML tags
  clean = clean.replace(/<[^>]+>/g, '');

  // Remove emoji-like Unicode symbols commonly used in AI output
  clean = clean.replace(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  // Specific emoji characters used in AI output (including 📌 pushpin)
  clean = clean.replace(/[📌📈🔽🔥⚡💎🟢🔴🟡🟠⬆⬇✅❌🏆🤖📊⚖🚀💰⬆️⬇️💡📌📍🔔⚠️🎯🟩🟥🟧]/g, '');

  // Collapse multiple spaces into one
  clean = clean.replace(/\s{2,}/g, ' ');

  return clean.trim();
}

// ─── Known section headings that are NOT company names ────────
// AI sometimes puts a section heading as the "title" field.
// These should be detected and the title should fall back to just the symbol.
const SECTION_HEADING_PATTERNS = [
  // English
  /^Executive\s+Summary$/i,
  /^Key\s+(Takeaways|Findings|Points|Metrics)/i,
  /^Overview$/i,
  /^Introduction$/i,
  /^Conclusion$/i,
  /^Recommendation(s)?$/i,
  /^Risk\s+Assessment$/i,
  /^Technical\s+(Analysis|Indicators|Overview)/i,
  /^Fundamental\s+(Analysis|Overview)/i,
  /^Price\s+(Target|Action|Outlook)/i,
  /^Summary$/i,
  /^Analysis$/i,
  // Arabic
  /^الملخص\s+التنفيذي$/,
  /^أبرز\s+(النقاط|النتائج|الخلاصات)/,
  /^نظرة\s+عامة/,
  /^مقدمة$/,
  /^خلاصة$/,
  /^التوصيات$/,
  /^تقييم\s+المخاطر/,
  /^التحليل\s+(الفني|الأساسي)/,
  /^المؤشرات\s+الفنية/,
  /^الأسعار\s+المستهدفة/,
  /^تحليل$/,
  // French
  /^Résumé\s+(Exécutif|des\s+points\s+clés)/i,
  /^Points\s+clés/i,
  /^Aperçu\s+(général)?/i,
  /^Introduction$/i,
  /^Conclusion$/i,
  /^Recommandations?$/i,
];

/**
 * Check if a cleaned title is actually a section heading, not a company name.
 * Returns true if it matches known heading patterns.
 */
function isSectionHeading(cleanedTitle: string): boolean {
  const trimmed = cleanedTitle.trim();
  if (!trimmed || trimmed.length < 3) return true;
  return SECTION_HEADING_PATTERNS.some(pattern => pattern.test(trimmed));
}

/**
 * Extract a clean, short company name from a raw analysis title.
 * V2: Handles AI-generated titles with:
 *   - Arabic analysis prefixes: "تحليل شامل لسهم هوم ديبو (HD) – هل هو الوقت..."
 *   - Section headings: "Executive Summary", "الملخص التنفيذي"
 *   - Long descriptive suffixes after dashes
 *   - Nested Markdown bold: **Mondelez International (MDLZ)**
 *
 * Input examples → Output:
 *   "**JPMorgan Chase & Co. (JPM) – Comprehensive Stock Analysis**" → "JPMorgan Chase & Co. (JPM)"
 *   "**تحليل شامل لسهم هوم ديبو (HD) – هل هو الوقت المناسب؟**" → "هوم ديبو (HD)"
 *   "**1. الملخص التنفيذي**" → fallback to symbol only
 *   "### **Abbott Laboratories (ABT) – Comprehensive Stock Analysis**" → "Abbott Laboratories (ABT)"
 */
export function extractCleanCompanyName(rawTitle: string, symbol: string): string {
  if (!rawTitle || typeof rawTitle !== 'string') return symbol || '';

  // Step 1: Sanitize Markdown (strips **, ##, ###, emoji, list markers, etc.)
  let clean = sanitizeMarkdown(rawTitle);

  // Step 2: Check if this is a section heading, not a company name
  if (isSectionHeading(clean)) return symbol || '';

  // Step 3: Remove Arabic analysis PREFIX patterns
  // "تحليل شامل لسهم [NAME] (SYMBOL) – ..." → "[NAME] (SYMBOL)"
  // "تحليل سهم [NAME] (SYMBOL) – ..." → "[NAME] (SYMBOL)"
  // These patterns have the analysis type BEFORE the company name
  const arAnalysisPrefix = /^(تحليل\s+شامل\s+لسهم|تحليل\s+شامل\s+لـ|تحليل\s+سهم|تحليل\s+شامل)\s+/;
  if (arAnalysisPrefix.test(clean)) {
    clean = clean.replace(arAnalysisPrefix, '');
  }

  // Step 4: Remove English analysis PREFIX patterns
  // "Comprehensive Analysis of Company Name (SYMBOL)" → "Company Name (SYMBOL)"
  clean = clean.replace(/^Comprehensive\s+Analysis\s+(of\s+)?/i, '');
  clean = clean.replace(/^Comprehensive\s+Stock\s+Analysis\s+(of\s+)?/i, '');
  clean = clean.replace(/^Stock\s+Analysis\s*[:：]\s*/i, '');
  clean = clean.replace(/^Analysis\s+(of\s+)?/i, '');
  clean = clean.replace(/^Comprehensive\s+Analysis\s*[:：]\s*/i, '');

  // Step 5: Remove French analysis PREFIX patterns
  clean = clean.replace(/^Analyse\s+complète\s+(de\s+)?/i, '');
  clean = clean.replace(/^Analyse\s+(de\s+)?/i, '');

  // Step 6: Remove common analysis SUFFIXES (after dash)
  // English: "– Comprehensive Stock Analysis", "– Full Analysis"
  clean = clean.replace(/\s*[–—-]\s*(Comprehensive\s+)?Stock\s+Analysis\s*$/i, '');
  clean = clean.replace(/\s*[–—-]\s*(Full\s+)?Analysis\s*$/i, '');
  // Arabic: "– تحليل شامل", "– نظرة شاملة", "– تحليل"
  clean = clean.replace(/\s*[–—-]\s*تحليل\s+(شامل\s+)?للسهم\s*$/, '');
  clean = clean.replace(/\s*[–—-]\s*تحليل\s+شامل\s*$/, '');
  clean = clean.replace(/\s*[–—-]\s*نظرة\s+شاملة\s*$/, '');
  clean = clean.replace(/\s*[–—-]\s*تحليل\s*$/i, '');
  // French: "– Analyse complète"
  clean = clean.replace(/\s*[–—-]\s*Analyse\s+(complète\s+)?de\s+l['']action\s*$/i, '');
  clean = clean.replace(/\s*[–—-]\s*Analyse\s+complète\s*$/i, '');
  // Signal suffix: "| Bullish"
  clean = clean.replace(/\s*\|\s*(Bullish|Bearish|Neutral)\s*$/i, '');

  // Step 7: Remove long descriptive Arabic text after dash
  // Pattern: "NAME (SYMBOL) – أي نص عربي وصفي طويل"
  // Only remove if the text after the dash is Arabic (not part of company name)
  clean = clean.replace(
    /\s*[–—-]\s*[\u0600-\u06FF][\u0600-\u06FF\s،؟!.؛]+$/,
    ''
  );

  // Step 8: Remove year suffix: "– 2024", "– 2025"
  clean = clean.replace(/\s*[–—-]\s*\d{4}\s*$/, '');

  // Step 9: Remove price/date suffix patterns like "- $132.06" or "- 2024-01-15"
  clean = clean.replace(/\s*[—–-]\s*\$?[\d,.]+.*$/, '');
  clean = clean.replace(/\s*[—–-]\s*\d{1,2}[/.]\d{1,2}[/.]\d{2,4}.*$/, '');

  // Step 10: Remove "Comprehensive Analysis:" prefix with colon
  clean = clean.replace(/^Comprehensive\s+Analysis\s*[:：]\s*/i, '');
  clean = clean.replace(/^تحليل\s+شامل\s*[:：]\s*/i, '');
  clean = clean.replace(/^Analyse\s+complète\s*[:：]\s*/i, '');

  // Step 11: Remove leading "تحليل سهم:" prefix with colon
  clean = clean.replace(/^(تحليل\s+سهم\s*[:：]\s*|تحليل\s*[:：]\s*|Analysis\s*[:：]\s*|Analyse\s*[:：]\s*)/i, '');

  // Step 12: Ensure symbol is in parentheses
  const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const symbolInParens = new RegExp(`\\(\\s*${escapedSymbol}\\s*\\)`, 'i');
  if (!symbolInParens.test(clean)) {
    // Symbol not in parens — check if it appears at the end without parens
    const symbolAtEnd = new RegExp(`\\s+${escapedSymbol}\\s*$`, 'i');
    if (symbolAtEnd.test(clean)) {
      clean = clean.replace(symbolAtEnd, ` (${symbol})`);
    } else {
      // Check if symbol appears at the START followed by name in parens
      // Pattern: "AMGN (Amgen Inc.)" → should become "Amgen Inc. (AMGN)"
      const symbolAtStartWithParens = new RegExp(
        `^${escapedSymbol}\\s+\\(([^)]+)\\)\\s*$`, 'i'
      );
      const startMatch = clean.match(symbolAtStartWithParens);
      if (startMatch) {
        const innerName = startMatch[1].trim();
        // Only swap if the inner name is different from the symbol
        if (innerName.toUpperCase() !== symbol.toUpperCase()) {
          clean = `${innerName} (${symbol})`;
        }
      }
    }
  }

  clean = clean.trim();

  // Step 13: Re-check if result is a section heading after cleanup
  if (isSectionHeading(clean)) return symbol || '';

  // Step 14: If nothing meaningful remains, fallback to just the symbol
  if (!clean || clean.length < 2) return symbol || '';

  return clean;
}

/**
 * Extract just the short company name without the symbol.
 * "Comcast Corporation (CMCSA)" → "Comcast Corporation"
 */
export function extractShortName(fullName: string): string {
  if (!fullName) return '';
  // Remove "(SYMBOL)" at the end
  return fullName.replace(/\s*\([A-Z]{1,5}\)\s*$/, '').trim();
}

/**
 * Format a number as market cap string.
 * 1e12 → "$1.23T", 1e9 → "$1.2B", 1e6 → "$1.5M"
 */
export function formatMarketCap(val: number | null | undefined): string {
  if (!val || val <= 0) return '—';
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  return `$${val.toLocaleString()}`;
}

/**
 * Format a number as volume string.
 * 1e9 → "1.2B", 1e6 → "3.5M", 1e3 → "450K"
 */
export function formatVolume(val: number | null | undefined): string {
  if (!val || val <= 0) return '—';
  if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return val.toLocaleString();
}
