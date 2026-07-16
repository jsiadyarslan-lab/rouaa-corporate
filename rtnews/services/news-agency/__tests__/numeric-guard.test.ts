// ═══════════════════════════════════════════════════════════════
// Numeric Guard — Unit Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { extractNumbers, normalizeNumber, isNumberInSource, validateNumbers } from '../lib/numeric-guard';

describe('extractNumbers', () => {
  it('extracts Western digits with commas and decimals', () => {
    const result = extractNumbers('Revenue was 1,234.56 million dollars');
    expect(result).toContain('1,234.56');
  });

  it('extracts percentages', () => {
    const result = extractNumbers('GDP grew by 5.5% last quarter');
    expect(result).toContain('5.5%');
  });

  it('extracts Arabic-Indic digits', () => {
    const result = extractNumbers('الناتج ١٢٣٤٫٥٦ مليار');
    expect(result.some(n => n.includes('١٢٣٤'))).toBe(true);
  });

  it('extracts negative numbers', () => {
    const result = extractNumbers('Profit fell to -50.5 million');
    expect(result.some(n => n.includes('-50.5'))).toBe(true);
  });

  it('extracts currency symbols', () => {
    const result = extractNumbers('Revenue was $100,200');
    expect(result.some(n => n.includes('100,200'))).toBe(true);
  });

  it('returns empty array for text without numbers', () => {
    const result = extractNumbers('No numbers here at all');
    expect(result).toEqual([]);
  });
});

describe('normalizeNumber', () => {
  it('converts Arabic-Indic digits to Western', () => {
    expect(normalizeNumber('١٢٣٤')).toBe('1234');
  });

  it('removes thousands separators', () => {
    expect(normalizeNumber('1,234')).toBe('1234');
  });

  it('removes Arabic thousands separator', () => {
    expect(normalizeNumber('١٬٢٣٤')).toBe('1234');
  });

  it('converts Arabic decimal separator', () => {
    expect(normalizeNumber('٥٫٥')).toBe('5.5');
  });

  it('removes currency symbols', () => {
    expect(normalizeNumber('$100')).toBe('100');
  });

  it('handles percentage sign', () => {
    expect(normalizeNumber('5%')).toBe('5%');
    expect(normalizeNumber('٥٪')).toBe('5%');
  });
});

describe('isNumberInSource', () => {
  it('finds exact match', () => {
    expect(isNumberInSource('5.5%', 'Inflation was 5.5% in Q1')).toBe(true);
  });

  it('finds match across Arabic/Western digit systems', () => {
    expect(isNumberInSource('٥٫٥٪', 'Inflation was 5.5% in Q1')).toBe(true);
  });

  it('finds match with different formatting', () => {
    expect(isNumberInSource('1234', 'Revenue: 1,234 million')).toBe(true);
  });

  it('rejects fabricated numbers', () => {
    expect(isNumberInSource('99.9%', 'Inflation was 5.5% in Q1')).toBe(false);
  });

  it('handles float comparison', () => {
    expect(isNumberInSource('5.50', 'Value: 5.5')).toBe(true);
  });
});

describe('validateNumbers', () => {
  it('passes when all numbers are from source', () => {
    const source = 'Apple reported revenue of $100 billion, up 5% year over year.';
    const draft = 'أبل تحقق إيرادات 100 مليار دولار بنمو 5%';
    const result = validateNumbers('Apple revenue', draft, source);
    expect(result.passed).toBe(true);
    expect(result.unmatchedNumbers).toEqual([]);
  });

  it('fails when draft contains fabricated numbers', () => {
    const source = 'Apple reported revenue of $100 billion.';
    const draft = 'أبل تحقق إيرادات 100 مليار دولار بنمو 15%'; // 15% not in source
    const result = validateNumbers('Apple revenue', draft, source);
    expect(result.passed).toBe(false);
    expect(result.unmatchedNumbers.length).toBeGreaterThan(0);
  });

  it('ignores trivial single-digit numbers (0-9)', () => {
    const source = 'Apple reported revenue.';
    const draft = 'القسم 1 من التقرير يتحدث عن أبل';
    const result = validateNumbers('Test', draft, source);
    expect(result.passed).toBe(true);
  });

  it('passes when draft has no significant numbers', () => {
    const source = 'Fed announced a rate decision today.';
    const draft = 'الفيدرالي يعلن قراره اليوم';
    const result = validateNumbers('Fed decision', draft, source);
    expect(result.passed).toBe(true);
    expect(result.totalNumbers).toBe(0);
  });
});
