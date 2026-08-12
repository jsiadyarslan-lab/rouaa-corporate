#!/usr/bin/env python3
"""Round 3 — verify found feeds and probe ONS/BIS/Apple deeper."""

import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetcher import fetch_with_fallback, fetch_url


def probe(url, label=""):
    print(f"\n→ {label or url}")
    success, content, error, method = fetch_with_fallback(url, timeout=20)
    if not success:
        print(f"  FAIL ({method}): {error[:120]}")
        return None
    is_xml = bool(re.match(r"\s*<\?xml|<rss|<feed|<rdf:RDF", content[:200]))
    is_html = "<html" in content[:500].lower()
    if is_xml:
        items = re.findall(r"<item[\s>]", content, re.IGNORECASE)
        entries = re.findall(r"<entry[\s>]", content, re.IGNORECASE)
        cnt = max(len(items), len(entries))
        print(f"  XML feed — {cnt} items, {len(content)} bytes via {method}")
        titles = re.findall(r"<title[^>]*>([^<]+)</title>", content, re.IGNORECASE)[:5]
        for t in titles:
            print(f"    -> {t[:100]}")
        # Save raw feed for inspection
        return content
    elif is_html:
        print(f"  HTML page — {len(content)} bytes via {method}")
        rss_links = re.findall(r'<link[^>]*type="application/(?:rss|atom)\+xml"[^>]*href="([^"]+)"', content, re.IGNORECASE)
        if rss_links:
            print(f"  Feed links: {rss_links[:3]}")
        return content
    return None


print("=" * 70)
print("FEED DISCOVERY — Round 3")
print("=" * 70)

# Apple newsroom RSS feed
print("\n=== APPLE newsroom RSS-feed.rss ===")
apple_feed = probe("https://www.apple.com/newsroom/rss-feed.rss", "Apple newsroom RSS")
if apple_feed:
    # Save for inspection
    with open("/home/z/my-project/scripts/pipeline/output/apple_feed_sample.xml", "w") as f:
        f.write(apple_feed)

# BIS feeds
print("\n=== BIS all_pressrels.rss ===")
bis_pr = probe("https://www.bis.org/doclist/all_pressrels.rss", "BIS press releases RSS")
if bis_pr:
    with open("/home/z/my-project/scripts/pipeline/output/bis_feed_sample.xml", "w") as f:
        f.write(bis_pr)

print("\n=== BIS rss_all_categories.rss ===")
bis_all = probe("https://www.bis.org/doclist/rss_all_categories.rss", "BIS all categories RSS")

# BIS publications — try publications feed
print("\n=== BIS cpubs RSS alternatives ===")
probe("https://www.bis.org/doclist/reshub_papers.rss", "BIS reshub papers RSS")

# ONS — check for feed in page
print("\n=== ONS — search for RSS in release calendar page ===")
ons_html = probe("https://www.ons.gov.uk/releasecalendar", "ONS release calendar")
if ons_html:
    # Look for any rss/feed/atom references
    feed_refs = re.findall(r'(?:rss|feed|atom)[^"\']{0,50}', ons_html, re.IGNORECASE)
    print(f"  Feed-related strings: {feed_refs[:10]}")
    # Look for JSON API patterns
    api_refs = re.findall(r'/api/[^"\']+', ons_html)
    print(f"  API paths: {api_refs[:5]}")

# BLS — try Wayback Machine archive (since BLS is blocked)
print("\n=== BLS — try alternative paths via different subdomain ===")
probe("https://feeds.bls.gov/", "BLS feeds subdomain root")
probe("https://download.bls.gov/pub/time.series/", "BLS download path")

# Aramco — try SEC EDGAR for foreign filers (Aramco files with SEC as foreign private issuer)
print("\n=== ARAMCO — try SEC EDGAR alternative ===")
probe("https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001734421&type=&dateb=&owner=include&count=40", "Aramco EDGAR (CIK 0001734421)")
probe("https://www.sec.gov/rss/browse-edgar?action=getcompany&CIK=0001734421&type=6-K&dateb=&owner=include&count=40", "Aramco EDGAR RSS")

# OFAC — recent actions page structure
print("\n=== OFAC — inspect recent-actions page ===")
ofac_html = probe("https://ofac.treasury.gov/recent-actions", "OFAC recent actions")
if ofac_html:
    # Find article/page structure
    articles = re.findall(r'<article[^>]*>', ofac_html, re.IGNORECASE)
    print(f"  <article> tags: {len(articles)}")
    # Find any press release links
    pr_links = re.findall(r'href="([^"]*recent-actions[^"]*)"', ofac_html, re.IGNORECASE)
    unique_pr = list(set(pr_links))[:10]
    print(f"  recent-actions links: {unique_pr}")
    # Save for inspection
    with open("/home/z/my-project/scripts/pipeline/output/ofac_recent_actions.html", "w") as f:
        f.write(ofac_html)
