// ═══════════════════════════════════════════════════════════════
// RSS Adapter — Fetches documents from RSS/Atom feeds (V1220)
// ═══════════════════════════════════════════════════════════════
import { createHash } from 'crypto';
import type { SourceAdapter, SourceConfig, FetchResult, RawDocument } from '../types';

export class RSSAdapter implements SourceAdapter {
  supportedMethods = ['rss'];

  validate(source: SourceConfig): boolean {
    return !!source.rss && source.rss.startsWith('http');
  }

  async fetch(source: SourceConfig): Promise<FetchResult> {
    const startTime = Date.now();

    if (!this.validate(source)) {
      return {
        success: false,
        documents: [],
        error: 'Invalid RSS URL',
        durationMs: Date.now() - startTime,
      };
    }

    try {
      const response = await fetch(source.rss!, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'User-Agent': 'Roua-Financial-Intelligence/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml',
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
          error: 'Empty or too short RSS content',
          durationMs: Date.now() - startTime,
          httpStatus: response.status,
        };
      }

      // Parse RSS items (simple extraction — no AI, just XML parsing)
      const items = this.parseRSSItems(rawContent);

      const documents: RawDocument[] = items.map(item => ({
        url: item.link || source.rss!,
        documentType: 'rss',
        title: item.title,
        rawContent: item.content || item.description || '',
        hash: createHash('sha256').update(item.content || item.description || '').digest('hex'),
        publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        metadata: {
          source: source.name,
          guid: item.guid,
          categories: item.categories,
        },
      }));

      return {
        success: true,
        documents,
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
      case 'realtime': return new Date(now.getTime() + 5 * 60 * 1000);    // 5 min
      case 'daily': return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      case 'weekly': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour default
    }
  }

  // Simple RSS XML parser — no external dependencies
  private parseRSSItems(xml: string): Array<{
    title?: string;
    link?: string;
    description?: string;
    content?: string;
    pubDate?: string;
    guid?: string;
    categories?: string[];
  }> {
    const items: Array<any> = [];

    // Match <item> blocks (RSS 2.0)
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const getItem = (tag: string): string | undefined => {
        const m = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
        return m ? m[1].trim() : undefined;
      };

      items.push({
        title: getItem('title'),
        link: getItem('link'),
        description: getItem('description'),
        content: getItem('content:encoded') || getItem('content'),
        pubDate: getItem('pubDate'),
        guid: getItem('guid'),
        categories: [],
      });
    }

    // Also match <entry> blocks (Atom)
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entryXml = match[1];
      const getEntry = (tag: string): string | undefined => {
        const m = entryXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
        return m ? m[1].trim() : undefined;
      };

      items.push({
        title: getEntry('title'),
        link: getEntry('link'),
        description: getEntry('summary'),
        content: getEntry('content'),
        pubDate: getEntry('published') || getEntry('updated'),
        guid: getEntry('id'),
        categories: [],
      });
    }

    return items;
  }
}
