// ─── News Source Test Endpoint ────────────────────────────────
// Tests each news source individually and returns the results.
// This helps diagnose why the pipeline might be fetching 0 items.
// Access: GET /api/news/test-sources

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    sources: {},
    zaiSdk: null,
  };

  // Test 1: RSS Feeds
  const rssFeeds = [
    { name: 'NYT Business', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml' },
    { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
    { name: 'CNBC', url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html' },
    { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews' },
  ];

  for (const feed of rssFeeds) {
    try {
      const t0 = Date.now();
      const res = await fetch(feed.url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
      });
      const text = await res.text();
      const itemCount = (text.match(/<item[^>]*>/gi) || []).length;
      results.sources[`RSS: ${feed.name}`] = {
        ok: res.ok,
        status: res.status,
        items: itemCount,
        contentLength: text.length,
        duration: Date.now() - t0,
        sample: text.slice(0, 200),
      };
    } catch (err: any) {
      results.sources[`RSS: ${feed.name}`] = {
        ok: false,
        error: err.message,
        timeout: err.name === 'AbortError' || err.message?.includes('timeout'),
      };
    }
  }

  // Test 2: z-ai-web-dev-sdk
  try {
    const t0 = Date.now();
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    const initTime = Date.now() - t0;

    // Test web search
    const searchT0 = Date.now();
    const searchResult = await zai.functions.invoke('web_search', {
      query: 'financial markets news today',
      num: 3,
    });
    const searchTime = Date.now() - searchT0;

    const searchItems = Array.isArray(searchResult) ? searchResult : [];
    results.zaiSdk = {
      ok: true,
      initTime,
      searchTime,
      itemsFound: searchItems.length,
      sampleItems: searchItems.slice(0, 2).map((item: any) => ({
        title: item.name?.slice(0, 50),
        url: item.url?.slice(0, 50),
      })),
    };
  } catch (err: any) {
    results.zaiSdk = {
      ok: false,
      error: err.message,
      stack: err.stack?.slice(0, 200),
    };
  }

  // Test 3: CryptoPanic (no API key needed)
  try {
    const t0 = Date.now();
    const res = await fetch('https://cryptopanic.com/api/v1/posts/?public=true&kind=news&currencies=BTC,ETH', {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'RouaNewsBot/1.0' },
    });
    const data = await res.json();
    results.sources['CryptoPanic'] = {
      ok: res.ok,
      status: res.status,
      items: data.results?.length || 0,
      duration: Date.now() - t0,
    };
  } catch (err: any) {
    results.sources['CryptoPanic'] = {
      ok: false,
      error: err.message,
    };
  }

  return NextResponse.json(results);
}
