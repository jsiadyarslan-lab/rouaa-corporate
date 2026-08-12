#!/usr/bin/env python3
"""Find correct feeds for sources that failed first recon pass."""

import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetcher import fetch_with_fallback, fetch_url


def probe(url, label=""):
    print(f"\n→ {label or url}")
    success, content, error, method = fetch_with_fallback(url, timeout=20)
    if not success:
        print(f"  FAIL ({method}): {error[:120]}")
        return None
    # Detect format
    is_xml = bool(re.match(r"\s*<\?xml|<rss|<feed|<rdf:RDF", content[:200]))
    is_html = "<html" in content[:500].lower()
    if is_xml:
        items = re.findall(r"<item[\s>]", content, re.IGNORECASE)
        entries = re.findall(r"<entry[\s>]", content, re.IGNORECASE)
        cnt = max(len(items), len(entries))
        print(f"  XML feed — {cnt} items, {len(content)} bytes via {method}")
        titles = re.findall(r"<title[^>]*>([^<]+)</title>", content, re.IGNORECASE)[:3]
        for t in titles:
            print(f"    -> {t[:90]}")
        return ("xml", content)
    elif is_html:
        print(f"  HTML page — {len(content)} bytes via {method}")
        # Find RSS/Atom feed links
        rss_links = re.findall(r'<link[^>]*type="application/(?:rss|atom)\+xml"[^>]*href="([^"]+)"', content, re.IGNORECASE)
        if rss_links:
            print(f"  Feed links in HTML: {rss_links[:3]}")
        # Find /feed or /rss paths
        feed_paths = re.findall(r'href="([^"]*(?:/feed|/rss|\.rss|\.xml)[^"]*)"', content, re.IGNORECASE)
        if feed_paths:
            unique = list(set(feed_paths))[:5]
            print(f"  Feed-like paths: {unique}")
        return ("html", content)
    else:
        print(f"  Unknown ({len(content)} bytes)")
        return ("unknown", content)


print("=" * 70)
print("FEED DISCOVERY — Round 2")
print("=" * 70)

# BLS — try alternative paths
print("\n=== BLS ===")
probe("https://www.bls.gov", "BLS root")
probe("https://www.bls.gov/schedule/news_release/", "BLS news releases")
probe("https://www.bls.gov/bls/news-release/", "BLS news-release path")

# ONS — UK Office for National Statistics
print("\n=== ONS ===")
probe("https://www.ons.gov.uk", "ONS root")
probe("https://www.ons.gov.uk/releasecalendar", "ONS release calendar")

# Aramco — try alternative paths
print("\n=== ARAMCO ===")
probe("https://www.aramco.com", "Aramco root")
probe("https://www.aramco.com/en/news", "Aramco news")
# Aramco might be Akamai-blocked like RBA. Try API/alternative.
probe("https://www.aramco.com/api/v1/news", "Aramco API")

# Apple IR — find their RSS
print("\n=== APPLE ===")
probe("https://investor.apple.com/investor-relations/default.aspx", "Apple IR page")
probe("https://www.apple.com/newsroom/rss/", "Apple newsroom RSS")
probe("https://www.apple.com/pr/feed.rss", "Apple PR feed")

# OFAC — find their RSS or recent actions structure
print("\n=== OFAC ===")
probe("https://ofac.treasury.gov/recent-actions", "OFAC recent actions")
probe("https://home.treasury.gov/feeds/ofac-recent-actions", "Treasury OFAC feed")
probe("https://ofac.treasury.gov/rss", "OFAC RSS path")

# BIS — find publications RSS
print("\n=== BIS ===")
probe("https://www.bis.org/list/cpubs/index.htm", "BIS publications list")
probe("https://www.bis.org/rss/cpubs.xml", "BIS cpubs RSS")
probe("https://www.bis.org/rss/index.htm", "BIS RSS index")
