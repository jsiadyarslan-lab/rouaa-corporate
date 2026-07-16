// ═══════════════════════════════════════════════════════════════
// Federal Reserve RSS Adapter
// ═══════════════════════════════════════════════════════════════
// Fetches press releases and speeches from the Federal Reserve.
// Two RSS feeds:
//   - Press releases: https://www.federalreserve.gov/feeds/press_all.xml
//   - Speeches:       https://www.federalreserve.gov/feeds/speeches.xml
// ═══════════════════════════════════════════════════════════════

import type { RawEvent, FetchResult, Category } from '../lib/types';
import { AGENCY_USER_AGENT, FETCH_TIMEOUT_MS } from '../lib/types';
import { sanitizeText } from '../lib/sanitize';
import { load as cheerioLoad } from 'cheerio';

const FEEDS = [
  {
    url: 'https://www.federalreserve.gov/feeds/press_all.xml',
    eventType: 'press_release' as const,
    sourceName: 'Federal Reserve Press Releases',
  },
  {
    url: 'https://www.federalreserve.gov/feeds/speeches.xml',
    eventType: 'speech' as const,
    sourceName: 'Federal Reserve Speeches',
  },
];

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '...';
}

function parseDate(dateStr: string): Date {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  } catch {}
  return new Date(0); // epoch — will be filtered out
}

/**
 * Categorize Fed content based on title/keywords
 */
function categorize(title: string): Category {
  const lower = title.toLowerCase();
  if (lower.includes('rate') || lower.includes('monetary') || lower.includes('fomc') || lower.includes('interest')) {
    return 'central_banks';
  }
  if (lower.includes('banking') || lower.includes('supervision') || lower.includes('regulation')) {
    return 'economy';
  }
  return 'economy';
}

/**
 * Fetch and parse a single RSS feed
 */
async function fetchFeed(
  feedUrl: string,
  eventType: 'press_release' | 'speech',
  sourceName: string,
  since: Date
): Promise<{ events: RawEvent[]; error?: string }> {
  let response: Response;
  try {
    response = await fetch(feedUrl, {
      headers: {
        'User-Agent': AGENCY_USER_AGENT,
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });
  } catch (err: any) {
    return { events: [], error: `fetch failed: ${err.message?.slice(0, 60)}` };
  }

  if (!response.ok) {
    return { events: [], error: `HTTP ${response.status}` };
  }

  const xml = await response.text();
  if (!xml || xml.length < 50) {
    return { events: [], error: 'empty content' };
  }

  try {
    const $ = cheerioLoad(xml, { xml: true });
    const events: RawEvent[] = [];

    $('item').each((_i, elem) => {
      const title = sanitizeText($(elem).find('title').first().text());
      const link = sanitizeText($(elem).find('link').first().text());
      const description = sanitizeText($(elem).find('description').first().text());
      const pubDateStr = sanitizeText($(elem).find('pubDate, dc\\:date, date').first().text());
      const contentEncoded = sanitizeText($(elem).find('content\\:encoded').first().text());

      if (!title || title.length < 5) return;

      const pubDate = parseDate(pubDateStr);
      if (pubDate < since) return;

      const summary = stripHtml(description).slice(0, 500);
      const content = stripHtml(contentEncoded || description).slice(0, 3000);

      if (content.length < 20) return;

      // Generate external ID from link or title hash
      const externalId = link || `fed-${pubDate.getTime()}-${title.slice(0, 30)}`;

      events.push({
        sourceId: 'FedRSS',
        externalId,
        sourceName,
        url: link || feedUrl,
        eventType,
        title: truncate(sanitizeText(title), 300),
        rawContent: truncate(sanitizeText(content), 3000),
        category: categorize(title),
        locale: 'ar',
        publishedAtSource: pubDate,
      });
    });

    return { events };
  } catch (err: any) {
    return { events: [], error: `parse failed: ${err.message?.slice(0, 60)}` };
  }
}

/**
 * Fetch all Fed RSS feeds
 */
export async function fetchFedRSS(since: Date): Promise<FetchResult> {
  const startTime = Date.now();
  const allEvents: RawEvent[] = [];
  const errors: string[] = [];

  for (const feed of FEEDS) {
    const result = await fetchFeed(feed.url, feed.eventType, feed.sourceName, since);
    if (result.error) {
      errors.push(`${feed.sourceName}: ${result.error}`);
    }
    if (result.events.length > 0) {
      allEvents.push(...result.events);
    }
  }

  return {
    source: 'FedRSS',
    events: allEvents,
    errors,
    durationMs: Date.now() - startTime,
  };
}
