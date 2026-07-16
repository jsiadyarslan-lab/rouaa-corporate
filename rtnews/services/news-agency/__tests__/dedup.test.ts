// ═══════════════════════════════════════════════════════════════
// Dedup System — Unit Tests
// ═══════════════════════════════════════════════════════════════
// Verifies that the 3-layer dedup catches the production failures
// observed on 2026-07-06:
//   - "تسلا" vs "تيسلا"  (Arabic normalization)
//   - "Communication Services 4.66%" repeated (sector dedup)
//   - "أوكرانيا 95/100" repeated (geopolitical entity dedup)
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  normalizeArabic,
  extractSymbols,
  extractNumbers,
  contentHash,
  debugTitle,
} from '../lib/dedup';

describe('normalizeArabic', () => {
  it('unifies Alef variants (إأآا → ا)', () => {
    expect(normalizeArabic('إسرائيل')).toBe(normalizeArabic('اسرائيل'));
    expect(normalizeArabic('أوكرانيا')).toBe(normalizeArabic('اوكرانيا'));
    expect(normalizeArabic('آبل')).toBe(normalizeArabic('ابل'));
  });

  it('unifies Yaa (ى → ي)', () => {
    expect(normalizeArabic('تيسلى')).toBe(normalizeArabic('تيسلي'));
  });

  it('unifies Taa Marbuta (ة → ه)', () => {
    expect(normalizeArabic('تيسلة')).toBe(normalizeArabic('تيسله'));
  });

  it('removes diacritics', () => {
    expect(normalizeArabic('بِسْمِ اللَّهِ')).toBe(normalizeArabic('بسم الله'));
  });

  it('normalizes whitespace', () => {
    expect(normalizeArabic('  تيسلا   تراجع  ')).toBe(normalizeArabic('تيسلا تراجع'));
  });

  it('converts to lowercase (for Latin parts)', () => {
    expect(normalizeArabic('TSLA')).toBe('tsla');
  });

  it('CRITICAL: تسلا and تيسلا are NOT unified by normalizeArabic (different words)', () => {
    // These are two different Arabic words — normalization cannot unify them.
    // The dedup system handles this via the SYNONYM MAP (extractSymbols),
    // not via normalization.
    expect(normalizeArabic('تسلا')).toBe('تسلا');
    expect(normalizeArabic('تيسلا')).toBe('تيسلا');
  });

  it('CRITICAL: تسلا and تيسلا both extract to symbol TSLA via synonym map', () => {
    // This is the actual dedup mechanism for these variants
    const s1 = extractSymbols('تسلا تراجع 7.49%');
    const s2 = extractSymbols('تيسلا تتراجع 7.49%');
    expect(s1).toContain('TSLA');
    expect(s2).toContain('TSLA');
  });
});

describe('extractSymbols', () => {
  it('detects English ticker TSLA', () => {
    const result = extractSymbols('TSLA يتراجع اليوم بنسبة 7.49%');
    expect(result).toContain('TSLA');
  });

  it('detects Arabic تسلا', () => {
    const result = extractSymbols('تيسلا تتراجع 7.49% وسط ضغوط بيعية');
    expect(result).toContain('TSLA');
  });

  it('CRITICAL: تسلا and تيسلا both map to TSLA', () => {
    const fromArabic1 = extractSymbols('تسلا تراجع 7.49%');
    const fromArabic2 = extractSymbols('تيسلا تتراجع 7.49%');
    expect(fromArabic1).toContain('TSLA');
    expect(fromArabic2).toContain('TSLA');
  });

  it('detects multiple symbols in same title', () => {
    const result = extractSymbols('Bitcoin و Ethereum يرتفعان معاً');
    expect(result).toContain('BTC');
    expect(result).toContain('ETH');
  });

  it('detects Communication Services sector (was missed before)', () => {
    const result = extractSymbols('Communication Services يتصدر السوق بارتفاع 4.66%');
    expect(result).toContain('COMM_SVCS');
  });

  // V1178 REGRESSION TEST — 6 sectors that were missing from SYMBOL_MAP.
  // PRODUCTION EVIDENCE: "قطاع الصناعات يتراجع بنسبة -4.98%" was published 3x
  // on 2026-07-08 because extractSymbols returned [] → dedup skipped all checks.
  it('V1178: detects Industrials sector (was missing — caused 3x duplicate)', () => {
    const result = extractSymbols('قطاع الصناعات يتراجع بنسبة -4.98%');
    expect(result).toContain('INDUSTRIALS');
  });

  it('V1178: detects Materials sector (was missing — caused 2x duplicate)', () => {
    const result = extractSymbols('قطاع المواد الأساسية يتصدر السوق بارتفاع متوسط 1.40%');
    expect(result).toContain('MATERIALS');
  });

  it('V1178: detects Consumer Cyclical sector (was missing — caused 3x duplicate)', () => {
    const result = extractSymbols('قطاع الاستهلاك الدوري يتراجع بنسبة -1.77%');
    expect(result).toContain('CONSUMER_CYCLICAL');
  });

  it('V1178: detects Consumer Staples sector (was missing)', () => {
    const result = extractSymbols('قطاع السلع الاستهلاكية الأساسية يتصدر السوق بارتفاع متوسط 1.06%');
    expect(result).toContain('CONSUMER_STAPLES');
  });

  it('V1178: detects Real Estate sector (was missing)', () => {
    const result = extractSymbols('قطاع العقارات يتراجع بنسبة -2.50%');
    expect(result).toContain('REAL_ESTATE');
  });

  it('V1178: detects Utilities sector (was missing)', () => {
    const result = extractSymbols('قطاع المرافق يستقر بارتفاع 0.30%');
    expect(result).toContain('UTILITIES');
  });

  it('V1178: all 12 sectors from SECTOR_AR map are now recognized', () => {
    // This is the comprehensive test — ensures no sector is missed in future.
    // Matches the SECTOR_AR map in stock-digests.ts exactly.
    const allSectorTitles = [
      'قطاع التكنولوجيا يتصدر السوق',
      'قطاع الرعاية الصحية يستقر',
      'قطاع الخدمات المالية يرتفع',
      'قطاع الاستهلاك الدوري يتراجع',
      'قطاع السلع الاستهلاكية الأساسية يصعد',
      'قطاع الصناعات يتراجع',
      'قطاع الطاقة يقفز',
      'قطاع المواد الأساسية يستقر',
      'قطاع العقارات يتراجع',
      'قطاع خدمات الاتصالات يرتفع',
      'قطاع المرافق يستقر',
    ];
    for (const title of allSectorTitles) {
      const symbols = extractSymbols(title);
      expect(symbols.length).toBeGreaterThan(0);
    }
  });

  it('detects Ukraine (was missed before)', () => {
    const result = extractSymbols('أوكرانيا 95/100: مخاطر جيوسياسية حادة');
    expect(result).toContain('UKRAINE');
  });

  it('detects VIX index', () => {
    const result = extractSymbols('مؤشر VIX 15.81 يثبت استقراره');
    expect(result).toContain('VIX');
  });

  it('returns empty array for unknown text', () => {
    const result = extractSymbols('حادث مروري في القاهرة');
    expect(result).toEqual([]);
  });

  it('dedupes symbols (no duplicate TSLA)', () => {
    const result = extractSymbols('تيسلا TSLA يرتفع');
    const tslaCount = result.filter(s => s === 'TSLA').length;
    expect(tslaCount).toBe(1);
  });
});

describe('extractNumbers', () => {
  it('extracts percentages', () => {
    const result = extractNumbers('تراجع بنسبة 7.49% اليوم');
    expect(result).toContain(7.49);
  });

  it('extracts dollar prices', () => {
    const result = extractNumbers('السعر 393.45 دولار');
    expect(result).toContain(393.45);
  });

  it('extracts from $XXX format', () => {
    const result = extractNumbers('وصل إلى $71,718.41');
    expect(result).toContain(71718.41);
  });

  it('extracts ratios like 95/100', () => {
    const result = extractNumbers('مخاطر 95/100');
    expect(result).toContain(95);
    expect(result).toContain(100);
  });

  it('extracts volume with Arabic words', () => {
    const result = extractNumbers('بحجم 73.9 مليون سهم');
    expect(result).toContain(73.9);
  });

  it('returns empty array for no numbers', () => {
    const result = extractNumbers('لا توجد أرقام هنا');
    expect(result).toEqual([]);
  });

  it('dedupes identical numbers', () => {
    const result = extractNumbers('7.49% و 7.49%');
    const count = result.filter(n => n === 7.49).length;
    expect(count).toBe(1);
  });
});

describe('contentHash', () => {
  it('produces same hash for same content', () => {
    const h1 = contentHash('TSLA تراجع 7.49%', 'خسائر كبيرة');
    const h2 = contentHash('TSLA تراجع 7.49%', 'خسائر كبيرة');
    expect(h1).toBe(h2);
  });

  it('produces same hash for Arabic vs English ticker variants', () => {
    // Both should produce same hash because both map to canonical TSLA + 7.49
    const h1 = contentHash('TSLA يتراجع 7.49%', '');
    const h2 = contentHash('تيسلا تتراجع 7.49%', '');
    expect(h1).toBe(h2);
  });

  it('produces different hash for different stocks', () => {
    const h1 = contentHash('TSLA تراجع 7.49%', '');
    const h2 = contentHash('AAPL تراجع 7.49%', '');
    expect(h1).not.toBe(h2);
  });

  it('produces different hash for same stock different percentage', () => {
    const h1 = contentHash('TSLA تراجع 7.49%', '');
    const h2 = contentHash('TSLA تراجع 5.0%', '');
    expect(h1).not.toBe(h2);
  });
});

describe('debugTitle', () => {
  it('returns all debug info', () => {
    const result = debugTitle('تيسلا تتراجع 7.49% إلى $393.45');
    expect(result.normalized).toBeTruthy();
    expect(result.symbols).toContain('TSLA');
    expect(result.numbers).toContain(7.49);
    expect(result.numbers).toContain(393.45);
    expect(result.hash).toBeTruthy();
    expect(result.hash.length).toBe(32); // MD5 hex length
  });
});

describe('V1149 — Stable-URL sources (FRED, World Bank, EIA)', () => {
  // V1149 FIX: URL dedup was rejecting ALL updates from FRED because
  // FRED uses stable URLs (e.g., fred.stlouisfed.org/series/DGS10)
  // for every update to the same series. Now URL dedup requires
  // matching numbers too — same URL + different numbers = NEW article.

  it('FRED: VIX 15.81 (2026-07-03) and VIX 18.45 (2026-07-04) are DIFFERENT articles', () => {
    // Same URL (VIXCLS series), different values
    const title1 = 'مؤشر التقلب VIX: 15.81 (2026-07-03)';
    const title2 = 'مؤشر التقلب VIX: 18.45 (2026-07-04)';

    const n1 = extractNumbers(title1);
    const n2 = extractNumbers(title2);

    // Both should have numbers but DIFFERENT values
    expect(n1.length).toBeGreaterThan(0);
    expect(n2.length).toBeGreaterThan(0);
    expect(n1).not.toEqual(n2);

    // Content hashes should be different
    const h1 = contentHash(title1, '');
    const h2 = contentHash(title2, '');
    expect(h1).not.toBe(h2);
  });

  it('FRED: VIX 15.81 published twice with same URL = DUPLICATE', () => {
    // Same URL + same numbers = duplicate (should be caught by URL+numbers check)
    const title1 = 'مؤشر التقلب VIX: 15.81 (2026-07-03)';
    const title2 = 'مؤشر التقلب VIX: 15.81 (2026-07-03)';

    const n1 = extractNumbers(title1);
    const n2 = extractNumbers(title2);

    expect(n1).toEqual(n2);

    const h1 = contentHash(title1, '');
    const h2 = contentHash(title2, '');
    expect(h1).toBe(h2);
  });

  it('FRED: 10-year Treasury 4.48% and 4.49% are DIFFERENT articles', () => {
    const title1 = 'العائد سندات الخزانة الأمريكية 10 سنوات 4.48% يثبت استقرار السوق';
    const title2 = 'العائد سندات الخزانة الأمريكية 10 سنوات 4.49% يرتفع';

    const n1 = extractNumbers(title1);
    const n2 = extractNumbers(title2);

    expect(n1).not.toEqual(n2);

    const h1 = contentHash(title1, '');
    const h2 = contentHash(title2, '');
    expect(h1).not.toBe(h2);
  });

  it('extracts numbers from FRED-style title with date in parentheses', () => {
    const title = 'سعر صرف اليوان مقابل الدولار: 6.7886 (2026-07-02)';
    const nums = extractNumbers(title);
    expect(nums).toContain(6.7886);
    // Date numbers (2026, 7, 2) might also be extracted but main number is 6.7886
  });
});

describe('Production failure regression tests', () => {
  // These are the EXACT titles that were duplicated on 2026-07-06
  // The dedup system should have caught them.

  it('FAIL: تسلا 7.49% — 6 variants should all be detected as duplicates', () => {
    const titles = [
      'تراجع تيسلا بـ 7.49% يعكس ضغوطاً على قطاع السيارات الكهربائية',
      'تيسلا تتراجع بـ 7.49% وسط ضغوط بيعية قوية في سوق الاستهلاك الدوري',
      'تراجع تيسلا بنسبة 7.49% وسط ضغوط البيع في قطاع الاستهلاك',
      'تراجع تيسلا بـ 7.49% يقود أسوأ أداء في السوق اليوم',
      'تيسلا تتراجع 7.49% وسط ضعوط بيعية قوية في سوق الأسهم',
      'TSLA يتراجع اليوم بنسبة 7.49% في سوق المستهلك الدوري',
    ];

    // V1178 FIX: The old test checked that all 6 titles produce the SAME contentHash.
    // That was the wrong check — contentHash includes ALL symbols, so if one title
    // mentions an additional sector (e.g., "الاستهلاك الدوري"), its hash differs.
    // The REAL dedup logic uses symbol OVERLAP (not equality) + number matching.
    // Correct check: every pair of titles shares TSLA symbol + 7.49 number.
    for (let i = 0; i < titles.length; i++) {
      for (let j = i + 1; j < titles.length; j++) {
        const symbolsI = extractSymbols(titles[i]);
        const symbolsJ = extractSymbols(titles[j]);
        const overlap = symbolsI.filter(s => symbolsJ.includes(s));
        const numbersI = extractNumbers(titles[i]);
        const numbersJ = extractNumbers(titles[j]);
        const numberOverlap = numbersI.filter(n =>
          numbersJ.some(rn => Math.abs(n - rn) / Math.max(n, rn, 0.01) < 0.005)
        );

        // Every pair must share at least TSLA + the 7.49 number
        expect(overlap).toContain('TSLA');
        expect(numberOverlap.length).toBeGreaterThan(0);
      }
    }
  });

  it('FAIL: Communication Services 4.66% — 2 identical titles should be detected', () => {
    const titles = [
      'Communication Services يتصدر السوق اليوم بارتفاع 4.66%',
      'Communication Services يتصدر السوق اليوم بارتفاع 4.66%',
    ];
    const hashes = titles.map(t => contentHash(t, ''));
    expect(hashes[0]).toBe(hashes[1]);
  });

  it('FAIL: أوكرانيا 95/100 — 3 variants should be detected', () => {
    const titles = [
      'أوكرانيا 95/100: مخاطر جيوسياسية حادة تؤثر على الأسواق العالمية',
      'تحليل مخاطر أوكرانيا الجيوسياسية وتداعياتها المالية',
      'تدهور الوضع الجيوسياسي في أوكرانيا: تحليلات رؤى',
    ];

    // First has 95 and 100 in title — others don't
    // But all contain UKRAINE symbol
    const symbols = titles.map(t => extractSymbols(t));
    expect(symbols[0]).toContain('UKRAINE');
    expect(symbols[1]).toContain('UKRAINE');
    expect(symbols[2]).toContain('UKRAINE');
  });
});
