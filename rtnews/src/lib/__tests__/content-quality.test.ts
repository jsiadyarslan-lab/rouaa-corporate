// ─── Content Quality Pattern Tests V156 ──────────────────────
// Tests for the content quality patterns used in the publisher agent.
// These validate the regex patterns and logic that guard AI-generated content.

import { describe, test, expect } from 'vitest';

describe('Content Quality Patterns', () => {
  test('Arabic text detection pattern', () => {
    const arabicPattern = /[\u0600-\u06FF]/;
    expect(arabicPattern.test('مؤشر السوق')).toBe(true);
    expect(arabicPattern.test('Hello World')).toBe(false);
    expect(arabicPattern.test('مؤشر S&P 500')).toBe(true); // Mixed Arabic+English
    expect(arabicPattern.test('12345')).toBe(false); // Numbers only
  });

  test('English sentence pattern', () => {
    const englishSentencePattern = /[a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,}){4,}/g;
    expect(englishSentencePattern.test('The stock market rose significantly today')).toBe(true);
    expect(englishSentencePattern.test('مؤشر S&P 500 يرتفع')).toBe(false);
    expect(englishSentencePattern.test('AAPL MSFT GOOGL')).toBe(false); // Only 3 words
    expect(englishSentencePattern.test('The Federal Reserve decided to keep rates unchanged')).toBe(true);
  });

  test('CJK character detection pattern', () => {
    const cjkPattern = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
    expect(cjkPattern.test('据说')).toBe(true); // Chinese
    expect(cjkPattern.test('つた')).toBe(true); // Hiragana
    expect(cjkPattern.test('한국어')).toBe(true); // Korean
    expect(cjkPattern.test('اقتصاد')).toBe(false); // Arabic
    expect(cjkPattern.test('Hello')).toBe(false); // English
  });

  test('Cyrillic character detection pattern', () => {
    const cyrillicPattern = /[\u0400-\u04FF]/;
    expect(cyrillicPattern.test('эконом')).toBe(true);
    expect(cyrillicPattern.test('Рынок')).toBe(true);
    expect(cyrillicPattern.test('اقتصاد')).toBe(false);
    expect(cyrillicPattern.test('Hello')).toBe(false);
  });

  test('Arabic filler phrases pattern', () => {
    const fillerPattern = /^(حسنا[ًٍ]?|طبعا[ًٍ]?|إذن|بالتأكيد|نعم|أيضا[ًٍ]?)$/;
    expect(fillerPattern.test('حسناً')).toBe(true);
    expect(fillerPattern.test('طبعاً')).toBe(true);
    expect(fillerPattern.test('بالتأكيد')).toBe(true);
    expect(fillerPattern.test('نعم')).toBe(true);
    expect(fillerPattern.test('أيضاً')).toBe(true);
    expect(fillerPattern.test('اقتصاد')).toBe(false);
    expect(fillerPattern.test('مؤشر')).toBe(false);
  });

  test('V156 expanded Arabic filler phrases', () => {
    const expandedFillerPattern = /^(حسنا[ًٍ]?|طبعا[ًٍ]?|إذن|بالتأكيد|نعم|أيضا[ًٍ]?|بالفعل|فعلا[ًٍ]?|صحيح|طيب|كما|لذلك|وبالتالي|الآن)$/;
    expect(expandedFillerPattern.test('بالفعل')).toBe(true);
    expect(expandedFillerPattern.test('فعلاً')).toBe(true);
    expect(expandedFillerPattern.test('صحيح')).toBe(true);
    expect(expandedFillerPattern.test('لذلك')).toBe(true);
    expect(expandedFillerPattern.test('الآن')).toBe(true);
    expect(expandedFillerPattern.test('سوق')).toBe(false);
  });

  test('Financial symbols pattern used in Arabic ratio calculation', () => {
    // Note: We use .test() without the `g` flag to avoid stateful lastIndex issues
    const finSymbolsNoG = /\b(?:S&P|GDP|IPO|ETF|CPI|NFP|PMI|FOMC|DXY|TNX|TLT|XAUUSD|GLD|SPY|QQQ|BTC|ETH|AAPL|NVDA|NYSE|NASDAQ)\b/i;
    expect(finSymbolsNoG.test('S&P 500')).toBe(true);
    expect(finSymbolsNoG.test('مؤشر GDP')).toBe(true);
    expect(finSymbolsNoG.test('سهم AAPL')).toBe(true);
    expect(finSymbolsNoG.test('hello world')).toBe(false);
    expect(finSymbolsNoG.test('السوق المالي')).toBe(false);
  });

  test('Arabic ratio calculation logic', () => {
    // Simulate isMostlyArabic logic
    const FINANCIAL_SYMBOLS = /\b(?:S&P|GDP|IPO|ETF|CPI|NFP|BTC|ETH|AAPL|NVDA)\b/gi;
    const arabicPattern = /[\u0600-\u06FF]/g;
    const latinPattern = /[a-zA-Z]/g;
    const threshold = 0.55;

    // Pure Arabic text
    const arabicText = 'مؤشر السوق المالي يرتفع بشكل ملحوظ';
    const cleaned1 = arabicText.replace(FINANCIAL_SYMBOLS, '');
    const arabicChars1 = (cleaned1.match(arabicPattern) || []).length;
    const latinChars1 = (cleaned1.match(latinPattern) || []).length;
    const ratio1 = arabicChars1 / Math.max(arabicChars1 + latinChars1, 1);
    expect(ratio1).toBeGreaterThanOrEqual(threshold);

    // Arabic with financial symbols (should still pass after cleaning)
    const mixedText = 'مؤشر S&P 500 يرتفع والسوق المالي نشط';
    const cleaned2 = mixedText.replace(FINANCIAL_SYMBOLS, '');
    const arabicChars2 = (cleaned2.match(arabicPattern) || []).length;
    const latinChars2 = (cleaned2.match(latinPattern) || []).length;
    const ratio2 = arabicChars2 / Math.max(arabicChars2 + latinChars2, 1);
    expect(ratio2).toBeGreaterThanOrEqual(threshold);

    // English text (should fail)
    const englishText = 'The stock market rose significantly today';
    const cleaned3 = englishText.replace(FINANCIAL_SYMBOLS, '');
    const arabicChars3 = (cleaned3.match(arabicPattern) || []).length;
    const latinChars3 = (cleaned3.match(latinPattern) || []).length;
    const ratio3 = arabicChars3 / Math.max(arabicChars3 + latinChars3, 1);
    expect(ratio3).toBeLessThan(threshold);
  });

  test('Mixed language title detection — title should start with Arabic', () => {
    // /^[A-Za-z]{2,}/ only catches titles starting with 2+ consecutive English letters
    const startsWithEnglish = (title: string): boolean => /^[A-Za-z]{2,}/.test(title.trim());

    expect(startsWithEnglish('AAPL earnings beat expectations')).toBe(true); // Fully English
    expect(startsWithEnglish('Fed Rate Decision impacts markets')).toBe(true); // Starts with English word
    expect(startsWithEnglish('مؤشر S&P 500 يرتفع')).toBe(false); // Starts with Arabic
    expect(startsWithEnglish('سهم AAPL يتجاوز التوقعات')).toBe(false); // Starts with Arabic
    expect(startsWithEnglish('500 شركة')).toBe(false); // Starts with numbers, not English

    // "S&P" starts with a single letter then special char — not caught by simple regex
    // but caught by the extended first-3-words check in the publisher
    expect(startsWithEnglish('S&P 500 ترتفع')).toBe(false); // S is 1 letter, & breaks the sequence

    // Extended check: if first 2+ words are all English, it's mixed language
    const isMixedLanguageExtended = (title: string): boolean => {
      const trimmed = title.trim();
      if (/^[A-Za-z]{2,}/.test(trimmed)) return true;
      const firstWords = trimmed.split(/\s+/).slice(0, 3);
      const englishFirstWords = firstWords.filter(w => /^[A-Za-z]/.test(w) && w.length > 1);
      return englishFirstWords.length >= 2 && englishFirstWords.length === firstWords.length;
    };
    // "S&P 500 ترتفع": first 3 words are [S&P, 500, ترتفع].
    // Only 'S&P' matches /^[A-Za-z]/ && length > 1, and it's 1 of 3 — not all English.
    // This is an edge case where the mixed-language check doesn't catch it,
    // matching the actual publisher behavior.
    expect(isMixedLanguageExtended('S&P 500 ترتفع لمستوى قياسي')).toBe(false);
    expect(isMixedLanguageExtended('Fed Rate ترتفع لمستوى قياسي')).toBe(true); // First 3 words all English-starting
    expect(isMixedLanguageExtended('مؤشر S&P 500 يرتفع')).toBe(false); // Arabic starts
  });
});
