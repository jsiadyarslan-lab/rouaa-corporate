// ═══════════════════════════════════════════════════════════════
// Prompt Builder — Unit Tests (V2: news + analysis)
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT, buildUserPrompt, parseLLMResponse } from '../lib/prompt-builder';
import type { RawEvent } from '../lib/types';

describe('SYSTEM_PROMPT', () => {
  it('is non-empty and contains Arabic instructions', () => {
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
    expect(SYSTEM_PROMPT).toContain('عربية');
    expect(SYSTEM_PROMPT).toContain('JSON');
  });

  it('specifies the output structure with news + analysis fields', () => {
    expect(SYSTEM_PROMPT).toContain('title');
    expect(SYSTEM_PROMPT).toContain('summary');
    expect(SYSTEM_PROMPT).toContain('body');
    expect(SYSTEM_PROMPT).toContain('fullContent');
    expect(SYSTEM_PROMPT).toContain('analysisPath');
    expect(SYSTEM_PROMPT).toContain('[1]-[6]');
  });
});

describe('buildUserPrompt', () => {
  const mockEvent: RawEvent = {
    sourceId: 'SEC',
    externalId: '0001234-25-000001',
    sourceName: 'SEC EDGAR',
    url: 'https://www.sec.gov/...',
    eventType: 'filing',
    title: 'Apple Inc. files 8-K',
    rawContent: 'Apple filed form 8-K on 2025-01-15.',
    category: 'stocks',
    locale: 'ar',
    publishedAtSource: new Date('2025-01-15'),
  };

  it('includes source name and date', () => {
    const prompt = buildUserPrompt(mockEvent, '{}');
    expect(prompt).toContain('SEC EDGAR');
    expect(prompt).toContain('2025-01-15');
  });

  it('includes raw content', () => {
    const prompt = buildUserPrompt(mockEvent, '{}');
    expect(prompt).toContain('Apple filed form 8-K');
  });

  it('includes internal context when provided', () => {
    const context = JSON.stringify({ recentEconomicEvents: [{ title: 'Fed rate decision' }] });
    const prompt = buildUserPrompt(mockEvent, context);
    expect(prompt).toContain('Fed rate decision');
    expect(prompt).toContain('[السياق الداخلي]');
  });

  it('omits context section when empty', () => {
    const prompt = buildUserPrompt(mockEvent, '{}');
    expect(prompt).not.toContain('[السياق الداخلي]');
  });
});

describe('parseLLMResponse', () => {
  it('parses valid JSON with news + analysis', () => {
    const raw = JSON.stringify({
      title: 'أبل تعلن نتائج قياسية',
      summary: 'حققت أبل إيرادات 100 مليار',
      body: 'أعلنت شركة أبل عن إيرادات بلغت 100 مليار دولار...',
      analysisPath: 'A',
      fullContent: '[1] ملخص الحدث\n\n[2] الأصول المتأثرة\n\n[6] توصية',
      sentiment: 'positive',
      impactLevel: 'high',
      affectedAssets: [{ symbol: 'AAPL', name: 'Apple', direction: 'up', impactDegree: 'high', reason: 'أرباح قياسية' }],
      recommendation: 'شراء',
    });
    const result = parseLLMResponse(raw);
    expect(result).not.toBeNull();
    expect(result?.title).toContain('أبل');
    expect(result?.body).toContain('100 مليار');
    expect(result?.fullContent).toContain('[1]');
    expect(result?.analysisPath).toBe('A');
    expect(result?.sentiment).toBe('positive');
  });

  it('parses JSON wrapped in markdown code block', () => {
    const raw = '```json\n{"title":"خبر","summary":"ملخص","body":"جسم","analysisPath":"B","fullContent":"[1] ملخص","sentiment":"neutral","impactLevel":"medium","affectedAssets":[],"recommendation":"انتظار"}\n```';
    const result = parseLLMResponse(raw);
    expect(result).not.toBeNull();
    expect(result?.title).toBe('خبر');
    expect(result?.fullContent).toContain('[1]');
  });

  it('parses JSON with trailing commas', () => {
    const raw = '{"title":"خبر","summary":"ملخص","body":"جسم","analysisPath":"B","fullContent":"[1] ملخص","sentiment":"neutral","impactLevel":"medium","affectedAssets":[],"recommendation":"انتظار",}';
    const result = parseLLMResponse(raw);
    expect(result).not.toBeNull();
    expect(result?.title).toBe('خبر');
  });

  it('extracts fields via regex fallback when JSON is malformed', () => {
    const raw = 'Some text before {"title":"خبر مالي","body":"جسم الخبر","fullContent":"[1] ملخص"} some text after';
    const result = parseLLMResponse(raw);
    expect(result).not.toBeNull();
    expect(result?.title).toBe('خبر مالي');
    expect(result?.body).toBe('جسم الخبر');
    expect(result?.fullContent).toContain('[1]');
  });

  it('returns null when required fields are missing', () => {
    const raw = '{"title":"خبر بدون body"}';
    const result = parseLLMResponse(raw);
    expect(result).toBeNull();
  });

  it('returns null when no valid fields found', () => {
    const raw = 'This has no JSON structure at all';
    const result = parseLLMResponse(raw);
    expect(result).toBeNull();
  });

  it('handles escaped quotes in content', () => {
    const raw = '{"title":"خبر \\"مهم\\"","summary":"ملخص","body":"جسم","analysisPath":"B","fullContent":"[1] ملخص","sentiment":"neutral","impactLevel":"medium","affectedAssets":[],"recommendation":"انتظار"}';
    const result = parseLLMResponse(raw);
    expect(result).not.toBeNull();
    expect(result?.title).toContain('مهم');
  });
});
