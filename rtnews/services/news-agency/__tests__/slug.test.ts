// ═══════════════════════════════════════════════════════════════
// Slug Generator — Unit Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { generateSlug } from '../lib/slug';

describe('generateSlug', () => {
  it('generates slug from Arabic title', () => {
    const slug = generateSlug('الفيدرالي يرفع أسعار الفائدة');
    expect(slug).toContain('الفيدرالي');
    expect(slug).toContain('الفائدة');
    expect(slug).not.toContain(' ');
  });

  it('replaces spaces with hyphens', () => {
    const slug = generateSlug('Apple reports strong earnings');
    expect(slug).toBe('apple-reports-strong-earnings');
  });

  it('lowercases English text', () => {
    const slug = generateSlug('APPLE Earnings Report');
    expect(slug).toBe('apple-earnings-report');
  });

  it('removes punctuation except hyphens', () => {
    const slug = generateSlug('Fed: "Rate decision" (updated)!');
    expect(slug).not.toContain('"');
    expect(slug).not.toContain('(');
    expect(slug).not.toContain(')');
    expect(slug).not.toContain('!');
    expect(slug).not.toContain(':');
  });

  it('collapses multiple hyphens', () => {
    const slug = generateSlug('Apple  ---  earnings');
    expect(slug).not.toContain('---');
    expect(slug.split('--').length).toBe(1);
  });

  it('trims leading/trailing hyphens', () => {
    const slug = generateSlug('  Apple earnings  ');
    expect(slug.startsWith('-')).toBe(false);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('truncates to 150 chars', () => {
    const longTitle = 'هذا عنوان طويل جدا '.repeat(50);
    const slug = generateSlug(longTitle);
    expect(slug.length).toBeLessThanOrEqual(150);
  });

  it('returns fallback for empty input', () => {
    expect(generateSlug('')).toBe('article');
    expect(generateSlug('   ')).toBe('article');
  });
});
