// ═══════════════════════════════════════════════════════════════
// Official Sources Fetcher — Rouaa News Writer Agent
// ═══════════════════════════════════════════════════════════════
// Purpose: Fetch raw news/data from official financial sources
// (central banks, regulators, statistics offices, etc.)
//
// The agent calls this function alongside internal DB collectors,
// then edits an original article via LLM and submits to the pipeline.
// This module ONLY fetches — it does NOT edit, analyze, or publish.
//
// Legal: Public RSS feeds and public APIs only. No scraping.
// User-Agent identifies us transparently.
// ═══════════════════════════════════════════════════════════════

import { load as cheerioLoad } from 'cheerio';
import type { NewsSource } from '../agents/news-writer';
import {
  OFFICIAL_SOURCES,
  OFFICIAL_USER_AGENT,
  DEFAULT_RATE_LIMIT_MS,
  RSS_TIMEOUT_MS,
  API_TIMEOUT_MS,
  SEC_EDGAR_WATCH_CIKS,
  type OfficialSource,
  type Locale,
} from './official-sources.config';

// ─── Rate Limiter ─────────────────────────────────────────
// Simple per-source rate limiter. Prevents hammering any single
// source. Tracks last-request timestamp per source ID.
const rateLimitStore = new Map<string, number>();

async function enforceRateLimit(sourceId: string, minIntervalMs: number): Promise<void> {
  const lastRequest = rateLimitStore.get(sourceId) || 0;
  const elapsed = Date.now() - lastRequest;
  if (elapsed < minIntervalMs) {
    const wait = minIntervalMs - elapsed;
    await new Promise(resolve => setTimeout(resolve, wait));
  }
  rateLimitStore.set(sourceId, Date.now());
}

// ─── Helpers ──────────────────────────────────────────────

function extractNumbers(text: string): string[] {
  const matches = text.match(/(?:\$?\s?\d[\d,]*\.?\d*\s?%?|[-+]?\d+\.?\d*%)/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.trim()))].slice(0, 20);
}

function extractAssets(text: string): string[] {
  // Common ticker patterns: (AAPL), $TSLA, NASDAQ:MSFT
  const tickerMatches = text.match(/\(([A-Z]{1,5})\)|\$([A-Z]{1,5})|NASDAQ:([A-Z]{1,5})|NYSE:([A-Z]{1,5})/g);
  if (!tickerMatches) return [];
  const tickers = tickerMatches
    .map(m => m.replace(/[()$NASDAQ:NYSE:]/g, ''))
    .filter(t => t.length >= 1 && t.length <= 5);
  return [...new Set(tickers)].slice(0, 10);
}

function stripHtml(html: string): string {
  // Simple HTML stripper — removes tags, decodes entities, collapses whitespace
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

function truncateContent(text: string, maxLength: number = 3000): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function parsePubDate(dateStr: string): Date {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  } catch {
    // fall through
  }
  return new Date(0); // epoch = very old, will be filtered out
}

// ─── RSS Fetcher ──────────────────────────────────────────
// Standard RSS 2.0 / Atom 1.0 parser using cheerio.

async function fetchRSSFeed(
  source: OfficialSource,
  since: Date
): Promise<NewsSource[]> {
  await enforceRateLimit(source.id, source.rateLimitMs || DEFAULT_RATE_LIMIT_MS);

  let response: Response;
  try {
    response = await fetch(source.url, {
      headers: {
        'User-Agent': OFFICIAL_USER_AGENT,
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en, ar, fr, tr, es',
      },
      signal: AbortSignal.timeout(RSS_TIMEOUT_MS),
      redirect: 'follow',
    });
  } catch (err: any) {
    console.warn(`[OfficialSources] RSS fetch failed for ${source.id}: ${err.message?.slice(0, 80)}`);
    return [];
  }

  if (!response.ok) {
    console.warn(`[OfficialSources] RSS ${source.id} returned HTTP ${response.status}`);
    return [];
  }

  const xml = await response.text();
  if (!xml || xml.length < 50) {
    console.warn(`[OfficialSources] RSS ${source.id} returned empty content`);
    return [];
  }

  try {
    const $ = cheerioLoad(xml, { xml: true });
    const items: NewsSource[] = [];

    // RSS 2.0: <item> elements
    $('item').each((_i, elem) => {
      const title = $(elem).find('title').first().text().trim();
      const link = $(elem).find('link').first().text().trim();
      const description = $(elem).find('description').first().text().trim();
      const pubDateStr = $(elem).find('pubDate, dc\\:date, date').first().text().trim();
      const contentEncoded = $(elem).find('content\\:encoded').first().text().trim();

      if (!title || title.length < 5) return;

      const pubDate = parsePubDate(pubDateStr);
      if (pubDate < since) return; // skip old items

      const summary = stripHtml(description).slice(0, 500);
      const content = stripHtml(contentEncoded || description).slice(0, 3000);

      if (content.length < 20) return; // skip items with no meaningful content

      items.push({
        type: 'official_source',
        title: truncateContent(title, 300),
        summary,
        content: truncateContent(content),
        numbers: extractNumbers(`${title} ${content}`),
        assets: extractAssets(`${title} ${content}`),
        locale: source.defaultLocale,
        priority: source.priority,
        externalAttribution: {
          sourceName: source.name,
          sourceUrl: link || source.url,
        },
      });
    });

    // Atom 1.0: <entry> elements (fallback)
    if (items.length === 0) {
      $('entry').each((_i, elem) => {
        const title = $(elem).find('title').first().text().trim();
        const link = $(elem).find('link').attr('href') || '';
        const summary = $(elem).find('summary').first().text().trim()
          || $(elem).find('content').first().text().trim();
        const pubDateStr = $(elem).find('updated').first().text().trim()
          || $(elem).find('published').first().text().trim();

        if (!title || title.length < 5) return;

        const pubDate = parsePubDate(pubDateStr);
        if (pubDate < since) return;

        const cleanSummary = stripHtml(summary).slice(0, 500);
        const cleanContent = stripHtml(summary).slice(0, 3000);

        if (cleanContent.length < 20) return;

        items.push({
          type: 'official_source',
          title: truncateContent(title, 300),
          summary: cleanSummary,
          content: truncateContent(cleanContent),
          numbers: extractNumbers(`${title} ${cleanContent}`),
          assets: extractAssets(`${title} ${cleanContent}`),
          locale: source.defaultLocale,
          priority: source.priority,
          externalAttribution: {
            sourceName: source.name,
            sourceUrl: link || source.url,
          },
        });
      });
    }

    return items;
  } catch (err: any) {
    console.warn(`[OfficialSources] RSS parse failed for ${source.id}: ${err.message?.slice(0, 80)}`);
    return [];
  }
}

// ─── SEC EDGAR Fetcher ────────────────────────────────────
// Fetches recent 8-K filings for watched companies.
// SEC requires User-Agent with contact info and rate limit ≤10 req/sec.

async function fetchSECEdgar(since: Date): Promise<NewsSource[]> {
  const items: NewsSource[] = [];
  const MAX_FILINGS_PER_COMPANY = 3; // Only take the 3 most recent 8-Ks per company

  for (const company of SEC_EDGAR_WATCH_CIKS) {
    await enforceRateLimit(`sec_${company.cik}`, 200); // SEC: max 10 req/sec = 100ms min interval

    const url = `https://data.sec.gov/submissions/CIK${company.cik}.json`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': OFFICIAL_USER_AGENT,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      });
    } catch (err: any) {
      console.warn(`[OfficialSources] SEC EDGAR fetch failed for ${company.ticker}: ${err.message?.slice(0, 60)}`);
      continue;
    }

    if (!response.ok) {
      console.warn(`[OfficialSources] SEC EDGAR ${company.ticker} returned HTTP ${response.status}`);
      continue;
    }

    try {
      const data = await response.json();
      const recent = data?.filings?.recent;
      if (!recent || !Array.isArray(recent.form)) continue;

      let filingCount = 0;
      for (let i = 0; i < recent.form.length && filingCount < MAX_FILINGS_PER_COMPANY; i++) {
        const formType = recent.form[i];
        const filingDate = recent.filingDate[i];
        const accessionNumber = recent.accessionNumber[i];
        const primaryDocDescription = recent.primaryDocDescription?.[i] || '';
        const items = recent.items?.[i] || '';

        // Filter for news-worthy filings: 8-K (current report), S-1 (IPO), Form 4 (insider)
        const isNewsWorthy = formType === '8-K'
          || formType === '8-K/A'
          || formType === 'S-1'
          || formType === 'S-1/A'
          || formType === '4'
          || formType === 'SC 13D'
          || formType === 'SC 13G';

        if (!isNewsWorthy) continue;

        // Date filter
        const filingDateObj = new Date(filingDate);
        if (isNaN(filingDateObj.getTime()) || filingDateObj < since) continue;

        // Build the accession number URL (remove dashes for URL)
        const accessionNoDash = accessionNumber.replace(/-/g, '');
        const filingUrl = `https://www.sec.gov/Archives/edgar/data/${parseInt(company.cik)}/${accessionNoDash}/${accessionNumber}-index.htm`;

        const title = `${company.name} files ${formType} with SEC`;
        const summary = `${company.name} (${company.ticker}) filed ${formType} with the U.S. Securities and Exchange Commission on ${filingDate}.`;
        const content = `${company.name} (${company.ticker}) filed form ${formType} with the SEC on ${filingDate}.

Filing details:
- Form type: ${formType}
- Accession number: ${accessionNumber}
- Description: ${primaryDocDescription || 'Not specified'}
- Items reported: ${items || 'Not specified'}

This filing is available on SEC EDGAR at: ${filingUrl}

Form ${formType} is ${getFormDescription(formType)}.`;

        items.push({
          type: 'official_source',
          title,
          summary,
          content: truncateContent(content),
          numbers: extractNumbers(content),
          assets: [company.ticker],
          locale: 'en' as Locale,
          priority: formType === '8-K' ? 'breaking' : 'high',
          externalAttribution: {
            sourceName: 'SEC EDGAR',
            sourceUrl: filingUrl,
          },
        });
        filingCount++;
      }
    } catch (err: any) {
      console.warn(`[OfficialSources] SEC EDGAR parse failed for ${company.ticker}: ${err.message?.slice(0, 60)}`);
      continue;
    }
  }

  return items;
}

function getFormDescription(formType: string): string {
  const descriptions: Record<string, string> = {
    '8-K': 'a current report filed to announce major events that shareholders should know about (material acquisitions, bankruptcy, changes in control, auditor changes, etc.)',
    '8-K/A': 'an amendment to a previously filed 8-K current report',
    'S-1': 'an initial registration statement filed by companies planning to go public (IPO)',
    'S-1/A': 'an amendment to an S-1 registration statement',
    '4': 'a statement of changes in beneficial ownership (insider trading — officers, directors, or 10%+ shareholders buying or selling shares)',
    'SC 13D': 'a beneficial ownership report filed when an investor acquires 5% or more of a company\'s shares',
    'SC 13G': 'a beneficial ownership report filed by passive investors who acquire 5% or more of a company\'s shares',
  };
  return descriptions[formType] || 'a regulatory filing with the SEC';
}

// ─── Main Export ──────────────────────────────────────────
// Fetches from ALL enabled official sources for a given locale.
// Returns NewsSource[] compatible with the news-writer agent.

export async function fetchFromOfficialSources(
  locale: Locale,
  since: Date
): Promise<NewsSource[]> {
  const enabledSources = OFFICIAL_SOURCES.filter(s => s.enabled);
  console.log(`[OfficialSources] Fetching from ${enabledSources.length} sources for locale=${locale}, since=${since.toISOString()}`);

  const allItems: NewsSource[] = [];

  // 1. Fetch all RSS sources in parallel (with rate limiting per-source)
  const rssSources = enabledSources.filter(s => s.type === 'rss');
  const rssPromises = rssSources.map(async (source) => {
    try {
      const items = await fetchRSSFeed(source, since);
      if (items.length > 0) {
        console.log(`[OfficialSources] ✓ ${source.id}: ${items.length} items`);
      }
      return items;
    } catch (err: any) {
      console.warn(`[OfficialSources] ✗ ${source.id}: ${err.message?.slice(0, 60)}`);
      return [];
    }
  });

  const rssResults = await Promise.allSettled(rssPromises);
  for (const result of rssResults) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  }

  // 2. Fetch SEC EDGAR filings (API)
  try {
    const secItems = await fetchSECEdgar(since);
    if (secItems.length > 0) {
      console.log(`[OfficialSources] ✓ SEC EDGAR: ${secItems.length} filings`);
    }
    allItems.push(...secItems);
  } catch (err: any) {
    console.warn(`[OfficialSources] ✗ SEC EDGAR: ${err.message?.slice(0, 60)}`);
  }

  // 3. Deduplicate by title (case-insensitive, first 80 chars)
  const seenTitles = new Set<string>();
  const deduped = allItems.filter(item => {
    const key = item.title.toLowerCase().slice(0, 80);
    if (seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  });

  console.log(`[OfficialSources] Total: ${allItems.length} raw → ${deduped.length} after dedup`);

  return deduped;
}

// ─── Health Check ─────────────────────────────────────────
// Used by diagnostic endpoints to verify source connectivity.

export async function checkSourceHealth(): Promise<{
  total: number;
  enabled: number;
  healthy: number;
  failed: { id: string; status: number | string }[];
}> {
  const enabled = OFFICIAL_SOURCES.filter(s => s.enabled);
  const failed: { id: string; status: number | string }[] = [];
  let healthy = 0;

  for (const source of enabled) {
    if (source.type !== 'rss') continue; // Only check RSS sources (API sources need keys)
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': OFFICIAL_USER_AGENT },
        signal: AbortSignal.timeout(8000),
        method: 'HEAD',
      });
      if (response.ok) {
        healthy++;
      } else {
        failed.push({ id: source.id, status: response.status });
      }
    } catch (err: any) {
      failed.push({ id: source.id, status: err.message?.slice(0, 40) || 'error' });
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms between checks
  }

  return {
    total: OFFICIAL_SOURCES.length,
    enabled: enabled.length,
    healthy,
    failed,
  };
}
