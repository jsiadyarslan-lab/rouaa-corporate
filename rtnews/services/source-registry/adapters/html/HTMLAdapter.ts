// ═══════════════════════════════════════════════════════════════
// HTML Adapter — Fetches documents from HTML pages (V1220)
// ═══════════════════════════════════════════════════════════════
import { createHash } from 'crypto';
import type { SourceAdapter, SourceConfig, FetchResult, RawDocument } from '../types';

export class HTMLAdapter implements SourceAdapter {
  supportedMethods = ['html'];

  validate(source: SourceConfig): boolean {
    return !!source.website && source.website.startsWith('http');
  }

  async fetch(source: SourceConfig): Promise<FetchResult> {
    const startTime = Date.now();

    if (!this.validate(source)) {
      return {
        success: false,
        documents: [],
        error: 'Invalid website URL',
        durationMs: Date.now() - startTime,
      };
    }

    try {
      const response = await fetch(source.website!, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'User-Agent': 'Roua-Financial-Intelligence/1.0',
          'Accept': 'text/html, application/xhtml+xml',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          documents: [],
          error: `HTTP ${response.status}`,
          durationMs: Date.now() - startTime,
          httpStatus: response.status,
        };
      }

      const rawContent = await response.text();

      if (!rawContent || rawContent.length < 100) {
        return {
          success: false,
          documents: [],
          error: 'Empty HTML content',
          durationMs: Date.now() - startTime,
          httpStatus: response.status,
        };
      }

      const hash = createHash('sha256').update(rawContent).digest('hex');

      // Extract title from HTML
      const titleMatch = rawContent.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : undefined;

      const document: RawDocument = {
        url: source.website!,
        documentType: 'html',
        title,
        rawContent,
        hash,
        publishedAt: new Date(),
        metadata: {
          source: source.name,
          contentLength: rawContent.length,
        },
      };

      return {
        success: true,
        documents: [document],
        durationMs: Date.now() - startTime,
        httpStatus: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        documents: [],
        error: error.message || 'Unknown fetch error',
        durationMs: Date.now() - startTime,
      };
    }
  }

  nextFetchTime(source: SourceConfig): Date {
    const now = new Date();
    const freq = source.updateFrequency || 'daily';

    switch (freq) {
      case 'realtime': return new Date(now.getTime() + 5 * 60 * 1000);
      case 'daily': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() + 60 * 60 * 1000);
    }
  }
}
