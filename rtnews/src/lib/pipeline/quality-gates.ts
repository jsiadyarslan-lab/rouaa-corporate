// ─── Multi-Gate AI Quality System V156 ──────────────────────
// Centralized quality validation for AI-generated content.
// Combines all quality checks into a single, composable interface.
// Each gate returns a pass/fail result with a reason.
//
// Gates are organized by severity:
//   CRITICAL — blocks publishing entirely (missing required content, wrong language)
//   QUALITY  — non-blocking warnings (truncated sentences, style issues)
//
// Usage:
//   const report = runAllQualityGates('article-123', titleAr, summaryAr, contentAr);
//   if (!report.overallPassed) {
//     // Block publishing — critical failures detected
//   }

export interface GateResult {
  gate: string;
  passed: boolean;
  reason?: string;
  severity: 'critical' | 'quality';
}

export interface QualityReport {
  articleId: string;
  overallPassed: boolean;
  gates: GateResult[];
  criticalFailures: string[];
  qualityWarnings: string[];
}

// Gate 1: Arabic Language Gate
// Validates that title, summary, and content are predominantly Arabic.
// Financial symbols (S&P, GDP, etc.) are excluded from the Latin char count
// since they are legitimate parts of Arabic financial text.
export function arabicLanguageGate(
  titleAr: string | null,
  summaryAr: string | null,
  contentAr: string | null,
  threshold = 0.55,
): GateResult[] {
  const results: GateResult[] = [];
  const arabicPattern = /[\u0600-\u06FF]/g;
  const latinPattern = /[a-zA-Z]/g;
  const FINANCIAL_SYMBOLS = /\b(?:S&P|GDP|IPO|ETF|CPI|NFP|PMI|FOMC|DXY|TNX|TLT|XAUUSD|GLD|SPY|QQQ|DIA|XLF|XLRE|XLK|XLU|XLV|VTV|IBIT|FBTC|ARKB|COIN|MSTR|BTC|ETH|NYSE|NASDAQ|NYMEX|COMEX|WTI|Brent|AAPL|MSFT|GOOGL|AMZN|TSLA|NVDA|META|FED|ECB|BOJ|BOE|SNB|RBA|BOC|RBNZ)\b/gi;

  const checkField = (name: string, value: string | null, minChars: number): GateResult => {
    if (!value || value.length < minChars) {
      return {
        gate: `arabic_${name}`,
        passed: false,
        reason: `${name} is missing or too short (need ${minChars}+ chars)`,
        severity: 'critical',
      };
    }
    const cleaned = value.replace(FINANCIAL_SYMBOLS, '');
    const arabicChars = (cleaned.match(arabicPattern) || []).length;
    const latinChars = (cleaned.match(latinPattern) || []).length;
    const total = arabicChars + latinChars;
    if (total === 0 || arabicChars / total < threshold) {
      return {
        gate: `arabic_${name}`,
        passed: false,
        reason: `${name} is not mostly Arabic (${Math.round((arabicChars / Math.max(total, 1)) * 100)}% < ${threshold * 100}%)`,
        severity: 'critical',
      };
    }
    return { gate: `arabic_${name}`, passed: true, severity: 'critical' };
  };

  results.push(checkField('titleAr', titleAr, 4));
  results.push(checkField('summaryAr', summaryAr, 10));
  results.push(checkField('contentAr', contentAr, 200));
  return results;
}

// Gate 2: Foreign Script Gate
// Detects CJK (Chinese/Japanese/Korean) and Cyrillic characters
// in Arabic content fields. These should NEVER appear in Arabic
// financial news and indicate AI generation failures.
export function foreignScriptGate(
  titleAr: string | null,
  summaryAr: string | null,
  contentAr: string | null,
): GateResult[] {
  const results: GateResult[] = [];
  const cjkPattern = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
  const cyrillicPattern = /[\u0400-\u04FF]/;

  const checkField = (name: string, value: string | null): GateResult[] => {
    const gates: GateResult[] = [];
    if (!value) return gates;
    if (cjkPattern.test(value)) {
      gates.push({
        gate: `foreign_cjk_${name}`,
        passed: false,
        reason: `${name} contains CJK characters`,
        severity: 'critical',
      });
    }
    if (cyrillicPattern.test(value)) {
      gates.push({
        gate: `foreign_cyrillic_${name}`,
        passed: false,
        reason: `${name} contains Cyrillic characters`,
        severity: 'critical',
      });
    }
    return gates;
  };

  results.push(...checkField('titleAr', titleAr));
  results.push(...checkField('summaryAr', summaryAr));
  results.push(...checkField('contentAr', contentAr));
  return results;
}

// Gate 3: Content Integrity Gate
// Detects English sentences and mixed-language titles in Arabic content.
// English financial terms (S&P, GDP, etc.) are allowed within Arabic text,
// but full English sentences are not.
export function contentIntegrityGate(
  titleAr: string | null,
  summaryAr: string | null,
  contentAr: string | null,
): GateResult[] {
  const results: GateResult[] = [];
  const englishSentencePattern = /[a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,}){4,}/g;

  const checkField = (name: string, value: string | null): GateResult[] => {
    const gates: GateResult[] = [];
    if (!value) return gates;

    // English sentences check
    const finSymbols = /\b(?:S&P|GDP|IPO|ETF|CPI|NFP|BTC|ETH|AAPL|NVDA|NYSE|NASDAQ)\b/gi;
    const cleaned = value.replace(finSymbols, ' ');
    if (englishSentencePattern.test(cleaned)) {
      gates.push({
        gate: `english_sentences_${name}`,
        passed: false,
        reason: `${name} contains English sentences`,
        severity: 'quality',
      });
    }

    // Mixed language title check — titleAr should NOT start with English
    if (name === 'titleAr' && /^[A-Za-z]{2,}/.test(value.trim())) {
      gates.push({
        gate: `mixed_language_${name}`,
        passed: false,
        reason: `${name} starts with English`,
        severity: 'quality',
      });
    }

    return gates;
  };

  results.push(...checkField('titleAr', titleAr));
  results.push(...checkField('summaryAr', summaryAr));
  results.push(...checkField('contentAr', contentAr));
  return results;
}

// Gate 4: Number Integrity Gate (V232)
// Extracts all numbers from the English source and verifies they appear
// in the Arabic translation with the same value. Catches:
// - Decimal point shifts ($16.5M → 1.65 million)
// - Missing numbers (dropped during translation)
// - Invented numbers (hallucinated figures)
export function numberIntegrityGate(
  titleEn: string | null,
  summaryEn: string | null,
  contentEn: string | null,
  titleAr: string | null,
  summaryAr: string | null,
  contentAr: string | null,
): GateResult[] {
  const results: GateResult[] = [];
  
  // Combine English source
  const enSource = [titleEn, summaryEn, contentEn].filter(Boolean).join(' ');
  const arTarget = [titleAr, summaryAr, contentAr].filter(Boolean).join(' ');
  
  if (!enSource || !arTarget) return results;
  
  // Extract numbers with their context from English source
  // Match: decimals (16.5), integers (36), percentages (3.5%), dollar amounts ($16.5M)
  const numberPattern = /\$?(\d+(?:\.\d+)?)\s*(%|[MBKmbk]|billion|million|thousand|bps)?/g;
  const enNumbers: { value: number; suffix: string; context: string }[] = [];
  
  let match;
  while ((match = numberPattern.exec(enSource)) !== null) {
    const value = parseFloat(match[1]);
    if (isNaN(value) || value === 0) continue;
    const suffix = (match[2] || '').toLowerCase();
    // Skip very common/meaningless numbers (year, small numbers)
    if (value > 1900 && value < 2100 && suffix === '') continue; // Skip years
    if (value < 0.01) continue; // Skip tiny numbers
    enNumbers.push({ value, suffix, context: match[0] });
  }
  
  // For each significant English number, check if it appears in Arabic
  const MISSING_THRESHOLD = 0.15; // 15% difference allowed for rounding
  let missingCount = 0;
  const missingNumbers: string[] = [];
  
  for (const num of enNumbers) {
    // Calculate the expected Arabic representation
    // The number should appear as-is in Arabic numerals (same digits)
    // Check if the numeric value appears in Arabic text
    const numStr = num.value.toString();
    const numStrAlt = num.value.toFixed(num.value % 1 !== 0 ? (num.value.toString().split('.')[1] || '').length : 0);
    
    // Check if either the number string or its Arabic-Indic equivalent exists
    const hasDirectNumber = arTarget.includes(numStr) || arTarget.includes(numStrAlt);
    
    // Also check Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩)
    const toArabicIndic = (n: string) => n.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
    const hasArabicIndic = arTarget.includes(toArabicIndic(numStr)) || arTarget.includes(toArabicIndic(numStrAlt));
    
    // Check for the word form (e.g., "16.5 مليون" for 16.5M)
    let hasWordForm = false;
    if (num.suffix.match(/[mbk]|million|billion|thousand/i)) {
      const expectedM = num.value.toString() + ' مليون';
      const expectedB = num.value.toString() + ' مليار';
      const expectedK = num.value.toString() + ' ألف';
      hasWordForm = arTarget.includes(expectedM) || arTarget.includes(expectedB) || arTarget.includes(expectedK);
    }
    
    // Check for common decimal shift errors
    // e.g., $16.5M → 1.65 مليون (decimal shifted)
    const shiftedValue = num.value / 10;
    const hasShiftedNumber = arTarget.includes(shiftedValue.toString()) && !arTarget.includes(num.value.toString());
    
    if (!hasDirectNumber && !hasArabicIndic && !hasWordForm) {
      if (num.value >= 1) { // Only report significant numbers
        missingCount++;
        missingNumbers.push(num.context);
      }
    }
    
    // Detect decimal shift (critical error)
    if (hasShiftedNumber) {
      results.push({
        gate: 'number_decimal_shift',
        passed: false,
        reason: `V232: Decimal shift detected! ${num.context} may have been translated as ${shiftedValue} instead of ${num.value}`,
        severity: 'critical',
      });
    }
  }
  
  // If more than 50% of significant numbers are missing, flag as quality issue
  if (enNumbers.length > 0 && missingCount / enNumbers.length > 0.5) {
    results.push({
      gate: 'number_missing',
      passed: false,
      reason: `V232: ${missingCount}/${enNumbers.length} significant numbers from English source not found in Arabic translation: ${missingNumbers.slice(0, 5).join(', ')}`,
      severity: 'quality',
    });
  }
  
  // Check for "خسارة" (loss) added to title when English doesn't say "loss"
  if (titleEn && titleAr) {
    const enHasLoss = /\bloss|lost|negative|deficit\b/i.test(titleEn);
    const arHasLoss = /خسار|خاسر|عجز/i.test(titleAr);
    if (arHasLoss && !enHasLoss) {
      results.push({
        gate: 'number_inferred_loss',
        passed: false,
        reason: `V232: Arabic title says "خسارة/عجز" but English source doesn't mention "loss/negative/deficit". EPS ≠ loss automatically!`,
        severity: 'quality',
      });
    }
  }
  
  return results;
}

// ─── English Quality Gates ─────────────────────────────────────
// NEW: Parallel quality gates for the English pipeline.
// These validate English content independently from Arabic gates.
// The English pipeline generates English content directly — no translation step.

// Gate 5: English Language Gate
// Validates that title, summary, and content are predominantly English.
// This is the ENGLISH counterpart of arabicLanguageGate (Gate 1).
export function englishLanguageGate(
  title: string | null,
  summary: string | null,
  content: string | null,
  threshold = 0.70,
): GateResult[] {
  const results: GateResult[] = [];
  const latinPattern = /[a-zA-Z]/g;
  const arabicPattern = /[\u0600-\u06FF]/g;
  const FINANCIAL_SYMBOLS = /\b(?:S&P|GDP|IPO|ETF|CPI|NFP|PMI|FOMC|DXY|TNX|TLT|XAUUSD|GLD|SPY|QQQ|DIA|XLF|XLRE|XLK|XLU|XLV|VTV|IBIT|FBTC|ARKB|COIN|MSTR|BTC|ETH|NYSE|NASDAQ|NYMEX|COMEX|WTI|Brent|AAPL|MSFT|GOOGL|AMZN|TSLA|NVDA|META|FED|ECB|BOJ|BOE|SNB|RBA|BOC|RBNZ)\b/gi;

  const checkField = (name: string, value: string | null, minChars: number): GateResult => {
    if (!value || value.length < minChars) {
      return {
        gate: `english_${name}`,
        passed: false,
        reason: `${name} is missing or too short (need ${minChars}+ chars)`,
        severity: 'critical',
      };
    }
    const cleaned = value.replace(FINANCIAL_SYMBOLS, '');
    const latinChars = (cleaned.match(latinPattern) || []).length;
    const arabicChars = (cleaned.match(arabicPattern) || []).length;
    const total = latinChars + arabicChars;
    if (total === 0 || latinChars / total < threshold) {
      return {
        gate: `english_${name}`,
        passed: false,
        reason: `${name} is not mostly English (${Math.round((latinChars / Math.max(total, 1)) * 100)}% < ${threshold * 100}%)`,
        severity: 'critical',
      };
    }
    return { gate: `english_${name}`, passed: true, severity: 'critical' };
  };

  results.push(checkField('title', title, 4));
  results.push(checkField('summary', summary, 10));
  results.push(checkField('content', content, 200));
  return results;
}

// Gate 6: English Foreign Script Gate
// Detects CJK and Arabic characters in English content fields.
// For English content, Arabic text should NOT appear (unlike Arabic content
// where English terms are allowed). CJK/Cyrillic are never allowed.
export function englishForeignScriptGate(
  title: string | null,
  summary: string | null,
  content: string | null,
): GateResult[] {
  const results: GateResult[] = [];
  const cjkPattern = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
  const cyrillicPattern = /[\u0400-\u04FF]/;

  const checkField = (name: string, value: string | null): GateResult[] => {
    const gates: GateResult[] = [];
    if (!value) return gates;
    if (cjkPattern.test(value)) {
      gates.push({
        gate: `en_foreign_cjk_${name}`,
        passed: false,
        reason: `${name} contains CJK characters`,
        severity: 'critical',
      });
    }
    if (cyrillicPattern.test(value)) {
      gates.push({
        gate: `en_foreign_cyrillic_${name}`,
        passed: false,
        reason: `${name} contains Cyrillic characters`,
        severity: 'critical',
      });
    }
    return gates;
  };

  results.push(...checkField('title', title));
  results.push(...checkField('summary', summary));
  results.push(...checkField('content', content));
  return results;
}

// Gate 7: English Content Integrity Gate
// Detects Arabic sentences and mixed-language issues in English content.
// This is the ENGLISH counterpart of contentIntegrityGate (Gate 3).
export function englishContentIntegrityGate(
  title: string | null,
  summary: string | null,
  content: string | null,
): GateResult[] {
  const results: GateResult[] = [];
  // Arabic sentence pattern: 3+ consecutive Arabic words
  const arabicSentencePattern = /[\u0600-\u06FF]{2,}(?:\s+[\u0600-\u06FF]{2,}){2,}/g;

  const checkField = (name: string, value: string | null): GateResult[] => {
    const gates: GateResult[] = [];
    if (!value) return gates;

    // Arabic sentences check — English content should not contain full Arabic sentences
    if (arabicSentencePattern.test(value)) {
      gates.push({
        gate: `arabic_sentences_${name}`,
        passed: false,
        reason: `${name} contains Arabic sentences (English content should not have full Arabic sentences)`,
        severity: 'quality',
      });
    }

    return gates;
  };

  results.push(...checkField('title', title));
  results.push(...checkField('summary', summary));
  results.push(...checkField('content', content));
  return results;
}

// Gate 8: English Number Integrity Gate
// For the English→English pipeline, validates that numbers in title
// appear in content (no hallucination or dropping of figures).
export function englishNumberIntegrityGate(
  title: string | null,
  summary: string | null,
  content: string | null,
): GateResult[] {
  const results: GateResult[] = [];

  if (!title || !content) return results;

  const numberPattern = /\$?(\d+(?:\.\d+)?)\s*(%|[MBKmbk]|billion|million|thousand|bps)?/g;
  const titleNumbers: { value: number; context: string }[] = [];

  let match;
  while ((match = numberPattern.exec(title)) !== null) {
    const value = parseFloat(match[1]);
    if (isNaN(value) || value === 0) continue;
    const suffix = (match[2] || '').toLowerCase();
    if (value > 1900 && value < 2100 && suffix === '') continue; // Skip years
    if (value < 0.01) continue;
    titleNumbers.push({ value, context: match[0] });
  }

  // Check that significant title numbers appear in content
  const fullContent = [summary, content].filter(Boolean).join(' ');
  let missingCount = 0;
  const missingNumbers: string[] = [];

  for (const num of titleNumbers) {
    const numStr = num.value.toString();
    if (num.value >= 1 && !fullContent.includes(numStr)) {
      // Also check word forms: "16.5 million", "16.5 billion"
      const hasWordForm = fullContent.includes(num.value + ' million')
        || fullContent.includes(num.value + ' billion')
        || fullContent.includes(num.value + ' thousand')
        || fullContent.includes(num.value + '%');
      if (!hasWordForm) {
        missingCount++;
        missingNumbers.push(num.context);
      }
    }

    // Detect decimal shift
    const shiftedValue = num.value / 10;
    if (fullContent.includes(shiftedValue.toString()) && !fullContent.includes(num.value.toString())) {
      results.push({
        gate: 'en_number_decimal_shift',
        passed: false,
        reason: `Decimal shift detected! ${num.context} may have been rendered as ${shiftedValue} instead of ${num.value}`,
        severity: 'critical',
      });
    }
  }

  if (titleNumbers.length > 0 && missingCount / titleNumbers.length > 0.5) {
    results.push({
      gate: 'en_number_missing',
      passed: false,
      reason: `${missingCount}/${titleNumbers.length} significant numbers from title not found in content: ${missingNumbers.slice(0, 5).join(', ')}`,
      severity: 'quality',
    });
  }

  return results;
}

// ─── French Quality Gates ─────────────────────────────────────
// Quality gates for the French (fr) pipeline.
// French uses Latin script with accented characters (àâçéèêëîïôùûüÿ).
// Financial terms are allowed; Arabic/CJK/Cyrillic should NOT appear.

// Gate 9: French Language Gate
export function frenchLanguageGate(
  title: string | null,
  summary: string | null,
  content: string | null,
  threshold = 0.70,
): GateResult[] {
  const results: GateResult[] = [];
  const latinPattern = /[a-zA-ZàâçéèêëîïôùûüÿÀÂÇÉÈÊËÎÏÔÙÛÜŸ]/g;
  const arabicPattern = /[\u0600-\u06FF]/g;
  const FINANCIAL_SYMBOLS = /\b(?:S&P|GDP|IPO|ETF|CPI|NFP|PMI|FOMC|DXY|TNX|TLT|XAUUSD|GLD|SPY|QQQ|DIA|XLF|XLRE|XLK|XLU|XLV|VTV|IBIT|FBTC|ARKB|COIN|MSTR|BTC|ETH|NYSE|NASDAQ|NYMEX|COMEX|WTI|Brent|AAPL|MSFT|GOOGL|AMZN|TSLA|NVDA|META|FED|ECB|BOJ|BOE|SNB|RBA|BOC|RBNZ|CAC40|Euronext|AXA|BNP|LVMH|TotalEnergies|Sanofi|Schneider)\b/gi;

  const checkField = (name: string, value: string | null, minChars: number): GateResult => {
    if (!value || value.length < minChars) {
      return {
        gate: `french_${name}`,
        passed: false,
        reason: `${name} is missing or too short (need ${minChars}+ chars)`,
        severity: 'critical',
      };
    }
    const cleaned = value.replace(FINANCIAL_SYMBOLS, '');
    const latinChars = (cleaned.match(latinPattern) || []).length;
    const arabicChars = (cleaned.match(arabicPattern) || []).length;
    const total = latinChars + arabicChars;
    if (total === 0 || latinChars / total < threshold) {
      return {
        gate: `french_${name}`,
        passed: false,
        reason: `${name} is not mostly French (${Math.round((latinChars / Math.max(total, 1)) * 100)}% < ${threshold * 100}%)`,
        severity: 'critical',
      };
    }
    return { gate: `french_${name}`, passed: true, severity: 'critical' };
  };

  results.push(checkField('title', title, 4));
  results.push(checkField('summary', summary, 10));
  results.push(checkField('content', content, 200));
  return results;
}

// Gate 10: French Foreign Script Gate
export function frenchForeignScriptGate(
  title: string | null,
  summary: string | null,
  content: string | null,
): GateResult[] {
  const results: GateResult[] = [];
  const cjkPattern = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
  const cyrillicPattern = /[\u0400-\u04FF]/;

  const checkField = (name: string, value: string | null): GateResult[] => {
    const gates: GateResult[] = [];
    if (!value) return gates;
    if (cjkPattern.test(value)) {
      gates.push({
        gate: `fr_foreign_cjk_${name}`,
        passed: false,
        reason: `${name} contains CJK characters`,
        severity: 'critical',
      });
    }
    if (cyrillicPattern.test(value)) {
      gates.push({
        gate: `fr_foreign_cyrillic_${name}`,
        passed: false,
        reason: `${name} contains Cyrillic characters`,
        severity: 'critical',
      });
    }
    return gates;
  };

  results.push(...checkField('title', title));
  results.push(...checkField('summary', summary));
  results.push(...checkField('content', content));
  return results;
}

// Gate 11: French Content Integrity Gate
export function frenchContentIntegrityGate(
  title: string | null,
  summary: string | null,
  content: string | null,
): GateResult[] {
  const results: GateResult[] = [];
  const arabicSentencePattern = /[\u0600-\u06FF]{2,}(?:\s+[\u0600-\u06FF]{2,}){2,}/g;
  const cjkSentencePattern = /[\u4e00-\u9fff]{2,}(?:\s+[\u4e00-\u9fff]{2,}){2,}/g;

  const checkField = (name: string, value: string | null): GateResult[] => {
    const gates: GateResult[] = [];
    if (!value) return gates;

    if (arabicSentencePattern.test(value)) {
      gates.push({
        gate: `fr_arabic_sentences_${name}`,
        passed: false,
        reason: `${name} contains Arabic sentences (French content should not have full Arabic sentences)`,
        severity: 'quality',
      });
    }

    if (cjkSentencePattern.test(value)) {
      gates.push({
        gate: `fr_cjk_sentences_${name}`,
        passed: false,
        reason: `${name} contains CJK sentences (French content should not have full CJK sentences)`,
        severity: 'quality',
      });
    }

    return gates;
  };

  results.push(...checkField('title', title));
  results.push(...checkField('summary', summary));
  results.push(...checkField('content', content));
  return results;
}

// Gate 12: French Number Integrity Gate
export function frenchNumberIntegrityGate(
  title: string | null,
  summary: string | null,
  content: string | null,
): GateResult[] {
  const results: GateResult[] = [];

  if (!title || !content) return results;

  const numberPattern = /\$?(\d+(?:\.\d+)?)\s*(%|[MBKmbk]|billion|million|thousand|bps|milliard|million\d|millier)?/g;
  const titleNumbers: { value: number; context: string }[] = [];

  let match;
  while ((match = numberPattern.exec(title)) !== null) {
    const value = parseFloat(match[1]);
    if (isNaN(value) || value === 0) continue;
    const suffix = (match[2] || '').toLowerCase();
    if (value > 1900 && value < 2100 && suffix === '') continue;
    if (value < 0.01) continue;
    titleNumbers.push({ value, context: match[0] });
  }

  const fullContent = [summary, content].filter(Boolean).join(' ');
  let missingCount = 0;
  const missingNumbers: string[] = [];

  for (const num of titleNumbers) {
    const numStr = num.value.toString();
    if (num.value >= 1 && !fullContent.includes(numStr)) {
      const hasWordForm = fullContent.includes(num.value + ' million')
        || fullContent.includes(num.value + ' milliard')
        || fullContent.includes(num.value + ' millier')
        || fullContent.includes(num.value + ' billion')
        || fullContent.includes(num.value + ' thousand')
        || fullContent.includes(num.value + '%');
      if (!hasWordForm) {
        missingCount++;
        missingNumbers.push(num.context);
      }
    }

    const shiftedValue = num.value / 10;
    if (fullContent.includes(shiftedValue.toString()) && !fullContent.includes(num.value.toString())) {
      results.push({
        gate: 'fr_number_decimal_shift',
        passed: false,
        reason: `Decimal shift detected! ${num.context} may have been rendered as ${shiftedValue} instead of ${num.value}`,
        severity: 'critical',
      });
    }
  }

  if (titleNumbers.length > 0 && missingCount / titleNumbers.length > 0.5) {
    results.push({
      gate: 'fr_number_missing',
      passed: false,
      reason: `${missingCount}/${titleNumbers.length} significant numbers from title not found in content: ${missingNumbers.slice(0, 5).join(', ')}`,
      severity: 'quality',
    });
  }

  return results;
}

// ─── Turkish Quality Gates ─────────────────────────────────────
// Quality gates for the Turkish (tr) pipeline.
// Turkish uses Latin script with special characters (ı, İ, ğ, Ğ, ş, Ş, ç, Ç, ö, Ö, ü, Ü).
// Financial terms are allowed; Arabic/CJK/Cyrillic should NOT appear.

// Gate 13: Turkish Language Gate
export function turkishLanguageGate(
  title: string | null,
  summary: string | null,
  content: string | null,
  threshold = 0.70,
): GateResult[] {
  const results: GateResult[] = [];
  const latinPattern = /[a-zA-ZıİğĞşŞçÇöÖüÜ]/g;
  const arabicPattern = /[\u0600-\u06FF]/g;
  const FINANCIAL_SYMBOLS = /\b(?:S&P|GDP|IPO|ETF|CPI|NFP|PMI|FOMC|DXY|TNX|TLT|XAUUSD|GLD|SPY|QQQ|DIA|XLF|XLRE|XLK|XLU|XLV|VTV|IBIT|FBTC|ARKB|COIN|MSTR|BTC|ETH|NYSE|NASDAQ|NYMEX|COMEX|WTI|Brent|AAPL|MSFT|GOOGL|AMZN|TSLA|NVDA|META|FED|ECB|BOJ|BOE|SNB|RBA|BOC|RBNZ|BIST100|BIST|Borsa İstanbul|TCMB|İstanbul)\b/gi;

  const checkField = (name: string, value: string | null, minChars: number): GateResult => {
    if (!value || value.length < minChars) {
      return {
        gate: `turkish_${name}`,
        passed: false,
        reason: `${name} is missing or too short (need ${minChars}+ chars)`,
        severity: 'critical',
      };
    }
    const cleaned = value.replace(FINANCIAL_SYMBOLS, '');
    const latinChars = (cleaned.match(latinPattern) || []).length;
    const arabicChars = (cleaned.match(arabicPattern) || []).length;
    const total = latinChars + arabicChars;
    if (total === 0 || latinChars / total < threshold) {
      return {
        gate: `turkish_${name}`,
        passed: false,
        reason: `${name} is not mostly Turkish (${Math.round((latinChars / Math.max(total, 1)) * 100)}% < ${threshold * 100}%)`,
        severity: 'critical',
      };
    }
    return { gate: `turkish_${name}`, passed: true, severity: 'critical' };
  };

  results.push(checkField('title', title, 4));
  results.push(checkField('summary', summary, 10));
  results.push(checkField('content', content, 200));
  return results;
}

// Gate 14: Turkish Foreign Script Gate
export function turkishForeignScriptGate(
  title: string | null,
  summary: string | null,
  content: string | null,
): GateResult[] {
  const results: GateResult[] = [];
  const cjkPattern = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
  const cyrillicPattern = /[\u0400-\u04FF]/;

  const checkField = (name: string, value: string | null): GateResult[] => {
    const gates: GateResult[] = [];
    if (!value) return gates;
    if (cjkPattern.test(value)) {
      gates.push({
        gate: `tr_foreign_cjk_${name}`,
        passed: false,
        reason: `${name} contains CJK characters`,
        severity: 'critical',
      });
    }
    if (cyrillicPattern.test(value)) {
      gates.push({
        gate: `tr_foreign_cyrillic_${name}`,
        passed: false,
        reason: `${name} contains Cyrillic characters`,
        severity: 'critical',
      });
    }
    return gates;
  };

  results.push(...checkField('title', title));
  results.push(...checkField('summary', summary));
  results.push(...checkField('content', content));
  return results;
}

// Gate 15: Turkish Content Integrity Gate
export function turkishContentIntegrityGate(
  title: string | null,
  summary: string | null,
  content: string | null,
): GateResult[] {
  const results: GateResult[] = [];
  const arabicSentencePattern = /[\u0600-\u06FF]{2,}(?:\s+[\u0600-\u06FF]{2,}){2,}/g;
  const cjkSentencePattern = /[\u4e00-\u9fff]{2,}(?:\s+[\u4e00-\u9fff]{2,}){2,}/g;

  const checkField = (name: string, value: string | null): GateResult[] => {
    const gates: GateResult[] = [];
    if (!value) return gates;

    if (arabicSentencePattern.test(value)) {
      gates.push({
        gate: `tr_arabic_sentences_${name}`,
        passed: false,
        reason: `${name} contains Arabic sentences (Turkish content should not have full Arabic sentences)`,
        severity: 'quality',
      });
    }

    if (cjkSentencePattern.test(value)) {
      gates.push({
        gate: `tr_cjk_sentences_${name}`,
        passed: false,
        reason: `${name} contains CJK sentences (Turkish content should not have full CJK sentences)`,
        severity: 'quality',
      });
    }

    return gates;
  };

  results.push(...checkField('title', title));
  results.push(...checkField('summary', summary));
  results.push(...checkField('content', content));
  return results;
}

// Gate 16: Turkish Number Integrity Gate
export function turkishNumberIntegrityGate(
  title: string | null,
  summary: string | null,
  content: string | null,
): GateResult[] {
  const results: GateResult[] = [];

  if (!title || !content) return results;

  const numberPattern = /\$?(\d+(?:\.\d+)?)\s*(%|[MBKmbk]|billion|million|thousand|bps|milyar|milyon|bin)?/g;
  const titleNumbers: { value: number; context: string }[] = [];

  let match;
  while ((match = numberPattern.exec(title)) !== null) {
    const value = parseFloat(match[1]);
    if (isNaN(value) || value === 0) continue;
    const suffix = (match[2] || '').toLowerCase();
    if (value > 1900 && value < 2100 && suffix === '') continue;
    if (value < 0.01) continue;
    titleNumbers.push({ value, context: match[0] });
  }

  const fullContent = [summary, content].filter(Boolean).join(' ');
  let missingCount = 0;
  const missingNumbers: string[] = [];

  for (const num of titleNumbers) {
    const numStr = num.value.toString();
    if (num.value >= 1 && !fullContent.includes(numStr)) {
      const hasWordForm = fullContent.includes(num.value + ' milyon')
        || fullContent.includes(num.value + ' milyar')
        || fullContent.includes(num.value + ' bin')
        || fullContent.includes(num.value + ' million')
        || fullContent.includes(num.value + ' billion')
        || fullContent.includes(num.value + ' thousand')
        || fullContent.includes(num.value + '%');
      if (!hasWordForm) {
        missingCount++;
        missingNumbers.push(num.context);
      }
    }

    const shiftedValue = num.value / 10;
    if (fullContent.includes(shiftedValue.toString()) && !fullContent.includes(num.value.toString())) {
      results.push({
        gate: 'tr_number_decimal_shift',
        passed: false,
        reason: `Decimal shift detected! ${num.context} may have been rendered as ${shiftedValue} instead of ${num.value}`,
        severity: 'critical',
      });
    }
  }

  if (titleNumbers.length > 0 && missingCount / titleNumbers.length > 0.5) {
    results.push({
      gate: 'tr_number_missing',
      passed: false,
      reason: `${missingCount}/${titleNumbers.length} significant numbers from title not found in content: ${missingNumbers.slice(0, 5).join(', ')}`,
      severity: 'quality',
    });
  }

  return results;
}

// ─── Spanish Quality Gates ─────────────────────────────────────
// Quality gates for the Spanish (es) pipeline.
// Spanish uses Latin script with ñ and accented vowels (á, é, í, ó, ú, ü).
// Financial terms are allowed; Arabic/CJK/Cyrillic should NOT appear.

// Gate 17: Spanish Language Gate
export function spanishLanguageGate(
  title: string | null,
  summary: string | null,
  content: string | null,
  threshold = 0.70,
): GateResult[] {
  const results: GateResult[] = [];
  const latinPattern = /[a-zA-ZñáéíóúüÑÁÉÍÓÚÜ]/g;
  const arabicPattern = /[\u0600-\u06FF]/g;
  const FINANCIAL_SYMBOLS = /\b(?:S&P|GDP|IPO|ETF|CPI|NFP|PMI|FOMC|DXY|TNX|TLT|XAUUSD|GLD|SPY|QQQ|DIA|XLF|XLRE|XLK|XLU|XLV|VTV|IBIT|FBTC|ARKB|COIN|MSTR|BTC|ETH|NYSE|NASDAQ|NYMEX|COMEX|WTI|Brent|AAPL|MSFT|GOOGL|AMZN|TSLA|NVDA|META|FED|ECB|BOJ|BOE|SNB|RBA|BOC|RBNZ|IBEX35|IBEX|BME|Santander|BBVA|Telefónica|Repsol|Iberdrola|Inditex|CaixaBank)\b/gi;

  const checkField = (name: string, value: string | null, minChars: number): GateResult => {
    if (!value || value.length < minChars) {
      return {
        gate: `spanish_${name}`,
        passed: false,
        reason: `${name} is missing or too short (need ${minChars}+ chars)`,
        severity: 'critical',
      };
    }
    const cleaned = value.replace(FINANCIAL_SYMBOLS, '');
    const latinChars = (cleaned.match(latinPattern) || []).length;
    const arabicChars = (cleaned.match(arabicPattern) || []).length;
    const total = latinChars + arabicChars;
    if (total === 0 || latinChars / total < threshold) {
      return {
        gate: `spanish_${name}`,
        passed: false,
        reason: `${name} is not mostly Spanish (${Math.round((latinChars / Math.max(total, 1)) * 100)}% < ${threshold * 100}%)`,
        severity: 'critical',
      };
    }
    return { gate: `spanish_${name}`, passed: true, severity: 'critical' };
  };

  results.push(checkField('title', title, 4));
  results.push(checkField('summary', summary, 10));
  results.push(checkField('content', content, 200));
  return results;
}

// Gate 18: Spanish Foreign Script Gate
export function spanishForeignScriptGate(
  title: string | null,
  summary: string | null,
  content: string | null,
): GateResult[] {
  const results: GateResult[] = [];
  const cjkPattern = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
  const cyrillicPattern = /[\u0400-\u04FF]/;

  const checkField = (name: string, value: string | null): GateResult[] => {
    const gates: GateResult[] = [];
    if (!value) return gates;
    if (cjkPattern.test(value)) {
      gates.push({
        gate: `es_foreign_cjk_${name}`,
        passed: false,
        reason: `${name} contains CJK characters`,
        severity: 'critical',
      });
    }
    if (cyrillicPattern.test(value)) {
      gates.push({
        gate: `es_foreign_cyrillic_${name}`,
        passed: false,
        reason: `${name} contains Cyrillic characters`,
        severity: 'critical',
      });
    }
    return gates;
  };

  results.push(...checkField('title', title));
  results.push(...checkField('summary', summary));
  results.push(...checkField('content', content));
  return results;
}

// Gate 19: Spanish Content Integrity Gate
export function spanishContentIntegrityGate(
  title: string | null,
  summary: string | null,
  content: string | null,
): GateResult[] {
  const results: GateResult[] = [];
  const arabicSentencePattern = /[\u0600-\u06FF]{2,}(?:\s+[\u0600-\u06FF]{2,}){2,}/g;
  const cjkSentencePattern = /[\u4e00-\u9fff]{2,}(?:\s+[\u4e00-\u9fff]{2,}){2,}/g;

  const checkField = (name: string, value: string | null): GateResult[] => {
    const gates: GateResult[] = [];
    if (!value) return gates;

    if (arabicSentencePattern.test(value)) {
      gates.push({
        gate: `es_arabic_sentences_${name}`,
        passed: false,
        reason: `${name} contains Arabic sentences (Spanish content should not have full Arabic sentences)`,
        severity: 'quality',
      });
    }

    if (cjkSentencePattern.test(value)) {
      gates.push({
        gate: `es_cjk_sentences_${name}`,
        passed: false,
        reason: `${name} contains CJK sentences (Spanish content should not have full CJK sentences)`,
        severity: 'quality',
      });
    }

    return gates;
  };

  results.push(...checkField('title', title));
  results.push(...checkField('summary', summary));
  results.push(...checkField('content', content));
  return results;
}

// Gate 20: Spanish Number Integrity Gate
export function spanishNumberIntegrityGate(
  title: string | null,
  summary: string | null,
  content: string | null,
): GateResult[] {
  const results: GateResult[] = [];

  if (!title || !content) return results;

  const numberPattern = /\$?(\d+(?:\.\d+)?)\s*(%|[MBKmbk]|billion|million|thousand|bps|mil|millón|millones|mil millones|billón)?/g;
  const titleNumbers: { value: number; context: string }[] = [];

  let match;
  while ((match = numberPattern.exec(title)) !== null) {
    const value = parseFloat(match[1]);
    if (isNaN(value) || value === 0) continue;
    const suffix = (match[2] || '').toLowerCase();
    if (value > 1900 && value < 2100 && suffix === '') continue;
    if (value < 0.01) continue;
    titleNumbers.push({ value, context: match[0] });
  }

  const fullContent = [summary, content].filter(Boolean).join(' ');
  let missingCount = 0;
  const missingNumbers: string[] = [];

  for (const num of titleNumbers) {
    const numStr = num.value.toString();
    if (num.value >= 1 && !fullContent.includes(numStr)) {
      const hasWordForm = fullContent.includes(num.value + ' millón')
        || fullContent.includes(num.value + ' millones')
        || fullContent.includes(num.value + ' mil')
        || fullContent.includes(num.value + ' billón')
        || fullContent.includes(num.value + ' mil millones')
        || fullContent.includes(num.value + ' million')
        || fullContent.includes(num.value + ' billion')
        || fullContent.includes(num.value + ' thousand')
        || fullContent.includes(num.value + '%');
      if (!hasWordForm) {
        missingCount++;
        missingNumbers.push(num.context);
      }
    }

    const shiftedValue = num.value / 10;
    if (fullContent.includes(shiftedValue.toString()) && !fullContent.includes(num.value.toString())) {
      results.push({
        gate: 'es_number_decimal_shift',
        passed: false,
        reason: `Decimal shift detected! ${num.context} may have been rendered as ${shiftedValue} instead of ${num.value}`,
        severity: 'critical',
      });
    }
  }

  if (titleNumbers.length > 0 && missingCount / titleNumbers.length > 0.5) {
    results.push({
      gate: 'es_number_missing',
      passed: false,
      reason: `${missingCount}/${titleNumbers.length} significant numbers from title not found in content: ${missingNumbers.slice(0, 5).join(', ')}`,
      severity: 'quality',
    });
  }

  return results;
}

// ─── Locale-Aware Quality Gate Router ──────────────────────────────
// Routes to Arabic, English, French, Turkish, or Spanish quality gates based on the article's locale.
// This is the NEW unified entry point that should be used by the pipeline.
// The original runAllQualityGates() is preserved for backward compatibility.

export function runAllQualityGatesForLocale(
  articleId: string,
  locale: 'ar' | 'en' | 'fr' | 'tr' | 'es',
  fields: {
    title: string | null;
    summary: string | null;
    content: string | null;
    // Arabic-specific fields (only needed for Arabic locale)
    titleAr?: string | null;
    summaryAr?: string | null;
    contentAr?: string | null;
  },
): QualityReport {
  let gates: GateResult[];

  if (locale === 'en') {
    // English pipeline: validate English content directly
    gates = [
      ...englishLanguageGate(fields.title, fields.summary, fields.content),
      ...englishForeignScriptGate(fields.title, fields.summary, fields.content),
      ...englishContentIntegrityGate(fields.title, fields.summary, fields.content),
      ...englishNumberIntegrityGate(fields.title, fields.summary, fields.content),
    ];
  } else if (locale === 'fr') {
    // French pipeline: validate French content directly
    gates = [
      ...frenchLanguageGate(fields.title, fields.summary, fields.content),
      ...frenchForeignScriptGate(fields.title, fields.summary, fields.content),
      ...frenchContentIntegrityGate(fields.title, fields.summary, fields.content),
      ...frenchNumberIntegrityGate(fields.title, fields.summary, fields.content),
    ];
  } else if (locale === 'tr') {
    // Turkish pipeline: validate Turkish content directly
    gates = [
      ...turkishLanguageGate(fields.title, fields.summary, fields.content),
      ...turkishForeignScriptGate(fields.title, fields.summary, fields.content),
      ...turkishContentIntegrityGate(fields.title, fields.summary, fields.content),
      ...turkishNumberIntegrityGate(fields.title, fields.summary, fields.content),
    ];
  } else if (locale === 'es') {
    // Spanish pipeline: validate Spanish content directly
    gates = [
      ...spanishLanguageGate(fields.title, fields.summary, fields.content),
      ...spanishForeignScriptGate(fields.title, fields.summary, fields.content),
      ...spanishContentIntegrityGate(fields.title, fields.summary, fields.content),
      ...spanishNumberIntegrityGate(fields.title, fields.summary, fields.content),
    ];
  } else {
    // Arabic pipeline: use existing Arabic gates (PRESERVED exactly as-is)
    gates = [
      ...arabicLanguageGate(fields.titleAr ?? fields.title, fields.summaryAr ?? fields.summary, fields.contentAr ?? fields.content),
      ...foreignScriptGate(fields.titleAr ?? fields.title, fields.summaryAr ?? fields.summary, fields.contentAr ?? fields.content),
      ...contentIntegrityGate(fields.titleAr ?? fields.title, fields.summaryAr ?? fields.summary, fields.contentAr ?? fields.content),
    ];
    // Number integrity gate — compare English source to Arabic target
    if (fields.title || fields.summary || fields.content) {
      gates.push(...numberIntegrityGate(
        fields.title, fields.summary, fields.content,
        fields.titleAr ?? fields.title, fields.summaryAr ?? fields.summary, fields.contentAr ?? fields.content,
      ));
    }
  }

  const criticalFailures = gates
    .filter((g) => !g.passed && g.severity === 'critical')
    .map((g) => g.reason || g.gate);
  const qualityWarnings = gates
    .filter((g) => !g.passed && g.severity === 'quality')
    .map((g) => g.reason || g.gate);

  return {
    articleId,
    overallPassed: criticalFailures.length === 0,
    gates,
    criticalFailures,
    qualityWarnings,
  };
}

// Compose all gates into a single quality report.
// The article passes overall only if there are zero critical failures.
// Quality warnings are logged but don't block publishing.
// PRESERVED for backward compatibility — Arabic pipeline still calls this.
export function runAllQualityGates(
  articleId: string,
  titleAr: string | null,
  summaryAr: string | null,
  contentAr: string | null,
  // V232: Optional English source for number integrity checking
  titleEn?: string | null,
  summaryEn?: string | null,
  contentEn?: string | null,
): QualityReport {
  const gates: GateResult[] = [
    ...arabicLanguageGate(titleAr, summaryAr, contentAr),
    ...foreignScriptGate(titleAr, summaryAr, contentAr),
    ...contentIntegrityGate(titleAr, summaryAr, contentAr),
  ];

  // V232: Number integrity gate — only if English source is provided
  if (titleEn || summaryEn || contentEn) {
    gates.push(...numberIntegrityGate(titleEn ?? null, summaryEn ?? null, contentEn ?? null, titleAr, summaryAr, contentAr));
  }

  const criticalFailures = gates
    .filter((g) => !g.passed && g.severity === 'critical')
    .map((g) => g.reason || g.gate);
  const qualityWarnings = gates
    .filter((g) => !g.passed && g.severity === 'quality')
    .map((g) => g.reason || g.gate);

  return {
    articleId,
    overallPassed: criticalFailures.length === 0,
    gates,
    criticalFailures,
    qualityWarnings,
  };
}
