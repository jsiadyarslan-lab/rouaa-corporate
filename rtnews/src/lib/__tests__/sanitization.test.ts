// ─── HTML Sanitization Tests V156 ──────────────────────
// Tests for sanitization patterns used in content processing.

import { describe, test, expect } from 'vitest';

describe('HTML Sanitization', () => {
  test('XSS script tags should be stripped', () => {
    // Basic test for DOMPurify-style sanitization
    const malicious = '<script>alert("xss")</script>محتوى عربي';
    const sanitized = malicious.replace(/<script[^>]*>.*?<\/script>/gi, '');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('محتوى عربي');
  });

  test('Script tag with attributes should be stripped', () => {
    const malicious = '<script src="evil.js" type="text/javascript">alert(1)</script>مقال';
    const sanitized = malicious.replace(/<script[^>]*>.*?<\/script>/gi, '');
    expect(sanitized).not.toContain('<script');
    expect(sanitized).toContain('مقال');
  });

  test('Iframe injection should be detected', () => {
    const malicious = '<iframe src="evil.com"></iframe>محتوى';
    const hasIframe = /<iframe/i.test(malicious);
    expect(hasIframe).toBe(true);
    const sanitized = malicious.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
    expect(sanitized).toContain('محتوى');
  });

  test('Event handler attributes should be detected', () => {
    const malicious = '<div onmouseover="alert(1)">محتوى</div>';
    const hasEventHandler = /on\w+\s*=/i.test(malicious);
    expect(hasEventHandler).toBe(true);
  });

  test('Financial symbols regex', () => {
    const finSymbols = /\b(?:S&P|GDP|IPO|ETF|CPI|NFP|BTC|ETH|AAPL|NVDA)\b/i;
    expect(finSymbols.test('S&P 500')).toBe(true);
    expect(finSymbols.test('BTC')).toBe(true);
    expect(finSymbols.test('GDP')).toBe(true);
    expect(finSymbols.test('hello')).toBe(false);
    expect(finSymbols.test('السوق المالي')).toBe(false);
  });

  test('HTML entity decoding does not break Arabic text', () => {
    const arabicWithEntities = 'مؤشر &amp; السوق &lt; 500';
    // After decoding entities, Arabic should remain intact
    const decoded = arabicWithEntities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    expect(decoded).toContain('مؤشر');
    expect(decoded).toContain('السوق');
  });

  test('Pipe character detection in content', () => {
    const contentWithPipes = 'السوق|المالي|نشط';
    expect(contentWithPipes.includes('|')).toBe(true);
    const cleaned = contentWithPipes.replace(/\|/g, '\n');
    expect(cleaned).not.toContain('|');
    expect(cleaned).toContain('السوق\nالمالي\nنشط');
  });
});
