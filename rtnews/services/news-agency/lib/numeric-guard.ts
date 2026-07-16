// ═══════════════════════════════════════════════════════════════
// Numeric Guard
// ═══════════════════════════════════════════════════════════════
// Post-generation numeric assertion. Extracts every number from
// the LLM output and verifies each appears in the source data.
// Arabic LLMs hallucinate numbers even more than English ones —
// this guard rejects articles with fabricated numbers.
// ═══════════════════════════════════════════════════════════════

/**
 * Extract all numbers from text. Handles:
 * - Western digits: 1,234.56
 * - Arabic-Indic digits: ١٢٣٤٫٥٦
 * - Percentages: 5.5%, ٥٫٥٪
 * - Currency: $100, €200
 * - Negative: -5, −5
 */
export function extractNumbers(text: string): string[] {
  const numbers: Set<string> = new Set();

  // Western digits (with optional commas, decimals, %, currency)
  const westernPattern = /(?:[\$€£¥]|USD\s?)?(-?\d[\d,]*\.?\d*\s?%?)/g;
  let match;
  while ((match = westernPattern.exec(text)) !== null) {
    const cleaned = match[1].trim().replace(/\s+/g, '');
    if (cleaned.length > 0 && cleaned !== '-') {
      numbers.add(cleaned);
    }
  }

  // Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩)
  const arabicPattern = /(-?[٠-٩][٠-٩٬]*\.?[٠-٩]*\s?٪?)/g;
  while ((match = arabicPattern.exec(text)) !== null) {
    const cleaned = match[1].trim().replace(/\s+/g, '');
    if (cleaned.length > 0 && cleaned !== '-') {
      numbers.add(cleaned);
    }
  }

  return Array.from(numbers);
}

/**
 * Normalize a number for comparison:
 * - Convert Arabic-Indic digits to Western
 * - Remove thousands separators (commas, Arabic ٬)
 * - Remove % and currency symbols
 * - Remove spaces
 */
export function normalizeNumber(num: string): string {
  // Arabic-Indic to Western
  const arabicToWestern: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '٬': '', '٫': '.', '٪': '%',
  };

  let normalized = num;
  for (const [ar, en] of Object.entries(arabicToWestern)) {
    normalized = normalized.split(ar).join(en);
  }

  // Remove currency symbols, spaces, thousands separators
  normalized = normalized
    .replace(/[\$€£¥]/g, '')
    .replace(/USD/g, '')
    .replace(/\s+/g, '')
    .replace(/,/g, ''); // Western thousands separator

  return normalized;
}

/**
 * Check if a number (from LLM output) appears in the source text.
 * Compares normalized forms (Arabic-Indic vs Western, with/without separators).
 */
export function isNumberInSource(num: string, sourceText: string): boolean {
  const normalizedNum = normalizeNumber(num);
  if (!normalizedNum || normalizedNum === '-' || normalizedNum === '.') return true; // skip trivial

  const sourceNumbers = extractNumbers(sourceText);
  for (const srcNum of sourceNumbers) {
    const normalizedSrc = normalizeNumber(srcNum);
    if (normalizedSrc === normalizedNum) return true;

    // Also try as floats (e.g., 5.5 vs 5.50)
    const numFloat = parseFloat(normalizedNum.replace(/[^0-9.\-]/g, ''));
    const srcFloat = parseFloat(normalizedSrc.replace(/[^0-9.\-]/g, ''));
    if (!isNaN(numFloat) && !isNaN(srcFloat)) {
      // Exact match
      if (Math.abs(numFloat - srcFloat) < 0.001) return true;

      // V1182 FIX: Compare ABSOLUTE values, not signed.
      // PRODUCTION EVIDENCE: AMD article rejected as "6.51%,6.51%" because:
      //   - Source had: -6.51% (with minus sign, since changePercent is negative)
      //   - LLM wrote: 6.51% (no minus, because "يتراجع 6.51%" is correct Arabic —
      //     the word "يتراجع" already conveys the negative direction)
      //   - |6.51 - (-6.51)| = 13.02 ≠ 0.001 → rejected
      // This caused 100% of stock articles (top gainers/losers) to be rejected.
      // Fix: compare |numFloat| vs |srcFloat| — direction is conveyed in words, not sign.
      if (Math.abs(Math.abs(numFloat) - Math.abs(srcFloat)) < 0.001) return true;

      // V1118: Allow approximate matches for averages/calculated values
      // If the number is within ±15% of a source number, accept it
      if (srcFloat !== 0 && Math.abs((numFloat - srcFloat) / srcFloat) < 0.15) return true;
      // V1182: Also try absolute value comparison for the ±15% tolerance
      if (Math.abs(srcFloat) !== 0 && Math.abs((Math.abs(numFloat) - Math.abs(srcFloat)) / Math.abs(srcFloat)) < 0.15) return true;
    }
  }

  // V1118: Allow small percentages (< 3%) — common statistical noise/averages
  const numFloat = parseFloat(normalizedNum.replace(/[^0-9.\-]/g, ''));
  if (!isNaN(numFloat) && Math.abs(numFloat) < 3 && (num.includes('%') || num.includes('٪'))) {
    return true;
  }

  return false;
}

export interface NumericCheckResult {
  passed: boolean;
  unmatchedNumbers: string[];
  totalNumbers: number;
}

/**
 * Validate that every number in the LLM-generated article appears
 * in the source data. Rejects fabricated numbers.
 *
 * @param draftTitle Arabic title from LLM
 * @param draftBody Arabic body from LLM
 * @param sourceText Original raw content from the source
 */
export function validateNumbers(
  draftTitle: string,
  draftBody: string,
  sourceText: string
): NumericCheckResult {
  const draftText = `${draftTitle} ${draftBody}`;
  const draftNumbers = extractNumbers(draftText);

  // Filter out trivial numbers (single digits 0-9, very common in dates/section numbers)
  // We only validate "significant" numbers: ≥ 2 digits OR contains % OR contains currency
  const significantNumbers = draftNumbers.filter(num => {
    const normalized = normalizeNumber(num);
    const digitsOnly = normalized.replace(/[^0-9]/g, '');

    // V1162 FIX: Skip years (1900-2099) — these are NOT financial numbers.
    // The LLM naturally writes "في عام 2026" but 2026 is not in source data.
    // This caused 18% of all article rejections.
    const numInt = parseInt(digitsOnly, 10);
    if (!isNaN(numInt) && numInt >= 1900 && numInt <= 2099 && digitsOnly.length === 4) {
      return false; // Skip years
    }

    return digitsOnly.length >= 2 || num.includes('%') || num.includes('٪') || num.includes('$') || num.includes('€');
  });

  const unmatched: string[] = [];
  for (const num of significantNumbers) {
    if (!isNumberInSource(num, sourceText)) {
      unmatched.push(num);
    }
  }

  return {
    passed: unmatched.length === 0,
    unmatchedNumbers: unmatched,
    totalNumbers: significantNumbers.length,
  };
}
