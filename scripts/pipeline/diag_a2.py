#!/usr/bin/env python3
"""
Phase A.2 Diagnostics — inspect BOC HTML structure, RBA 403, FED regex miss.

No production code changes. Pure diagnostic.
"""

import sys
import os
import re
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetcher import fetch_url
from source_configs import SOURCES


def diagnose_boc():
    """Inspect BOC HTML structure to understand why content extraction fails."""
    print("\n" + "=" * 70)
    print("BOC DIAGNOSTIC")
    print("=" * 70)

    config = SOURCES["BOC"]
    feed_url = config["feedUrl"]

    print(f"\n1. Fetching BOC RSS feed: {feed_url}")
    success, xml_content, error = fetch_url(feed_url)
    if not success:
        print(f"  FAIL: {error}")
        return
    print(f"  OK — {len(xml_content)} bytes")

    # Parse items
    import xml.etree.ElementTree as ET
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        print(f"  XML parse error: {e}")
        return

    items = root.findall(".//item")
    print(f"  Parsed {len(items)} items from RSS")

    # Find a monetary-policy-related item
    keywords = config["content_keywords"]
    target_item = None
    for item in items:
        title_el = item.find("title")
        link_el = item.find("link")
        title = title_el.text if title_el is not None and title_el.text else ""
        link = link_el.text if link_el is not None and link_el.text else ""
        if any(kw.lower() in title.lower() for kw in keywords):
            target_item = (title, link)
            break

    if not target_item:
        # Just take first item
        if items:
            title_el = items[0].find("title")
            link_el = items[0].find("link")
            target_item = (
                title_el.text if title_el is not None and title_el.text else "",
                link_el.text if link_el is not None and link_el.text else "",
            )

    if not target_item:
        print("  No items to inspect")
        return

    title, link = target_item
    print(f"\n2. Target document: {title}")
    print(f"  URL: {link}")

    print(f"\n3. Fetching full HTML content...")
    success, html, error = fetch_url(link)
    if not success:
        print(f"  FAIL: {error}")
        return
    print(f"  OK — {len(html)} bytes")

    # Save raw HTML for inspection
    with open("/home/z/my-project/scripts/pipeline/output/boc_raw.html", "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  Saved raw HTML: output/boc_raw.html")

    # Analyze HTML structure
    print(f"\n4. HTML structure analysis:")
    print(f"   <article> tags: {len(re.findall(r'<article[^>]*>', html, re.IGNORECASE))}")
    print(f"   <main> tags: {len(re.findall(r'<main[^>]*>', html, re.IGNORECASE))}")
    print(f"   <p> tags: {len(re.findall(r'<p[^>]*>', html, re.IGNORECASE))}")
    print(f"   <div> tags: {len(re.findall(r'<div[^>]*>', html, re.IGNORECASE))}")
    role_main_count = len(re.findall(r'role=["\']main["\']', html, re.IGNORECASE))
    print(f"   role='main': {role_main_count}")

    # Look for content containers
    content_classes = re.findall(r'class="([^"]*(?:content|main|article|post|body|entry)[^"]*)"', html, re.IGNORECASE)
    print(f"   content-class hits: {content_classes[:10]}")

    # Look for JSON-LD
    jsonld_blocks = re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, re.DOTALL | re.IGNORECASE)
    print(f"   JSON-LD blocks: {len(jsonld_blocks)}")

    # Test content extractor
    print(f"\n5. Testing content_extractor on BOC HTML...")
    from content_extractor import extract_document_content, extract_semantic_containers, extract_paragraph_clusters
    candidates = extract_semantic_containers(html)
    print(f"   Semantic containers found: {len(candidates)}")
    for ct, text in candidates[:3]:
        print(f"     - {ct}: {len(text)} chars, first 100: {text[:100]!r}")

    clusters = extract_paragraph_clusters(html)
    print(f"   Paragraph clusters found: {len(clusters)}")
    for i, c in enumerate(clusters[:3]):
        print(f"     - cluster_{i}: {len(c)} chars, first 100: {c[:100]!r}")

    # Test full extraction
    content_type, content = extract_document_content(html, keywords)
    print(f"\n   Selected content_type: {content_type}")
    print(f"   Selected content length: {len(content)} chars")
    print(f"   Content preview (first 500 chars):")
    print(f"   {content[:500]!r}")

    # Test pattern matching on extracted content
    print(f"\n6. Testing rate patterns on extracted content:")
    for pattern_str, pattern_type in config["rate_patterns"]:
        matches = list(re.finditer(pattern_str, content, re.IGNORECASE))
        if matches:
            for m in matches:
                print(f"   MATCH [{pattern_type}]: {m.group(0)!r}")
        else:
            print(f"   no match: {pattern_type} — pattern: {pattern_str[:60]}...")

    # Also test on raw HTML
    print(f"\n7. Testing rate patterns on RAW HTML (before normalization):")
    for pattern_str, pattern_type in config["rate_patterns"]:
        matches = list(re.finditer(pattern_str, html, re.IGNORECASE))
        if matches:
            for m in matches[:2]:
                print(f"   MATCH [{pattern_type}]: {m.group(0)!r}")


def diagnose_rba():
    """Diagnose RBA 403 — check headers, try alternatives."""
    print("\n" + "=" * 70)
    print("RBA DIAGNOSTIC")
    print("=" * 70)

    config = SOURCES["RBA"]
    feed_url = config["feedUrl"]
    website = config["websiteUrl"]

    print(f"\n1. Current feed URL: {feed_url}")
    success, content, error = fetch_url(feed_url)
    print(f"   Result: success={success}, error={error}")
    if success:
        print(f"   Content length: {len(content)} bytes")

    print(f"\n2. Trying RBA website root: {website}")
    success, content, error = fetch_url(website)
    print(f"   Result: success={success}, error={error}")
    if success:
        print(f"   Content length: {len(content)} bytes")

    # Try with curl-like minimal headers
    print(f"\n3. Trying with Referer + Accept-Encoding headers...")
    import urllib.request
    try:
        req = urllib.request.Request(
            feed_url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/rss+xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "identity",  # no gzip
                "Referer": "https://www.rba.gov.au/",
                "Connection": "keep-alive",
            },
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read().decode("utf-8", errors="replace")
            print(f"   OK — {len(content)} bytes")
            print(f"   First 200 chars: {content[:200]!r}")
    except Exception as e:
        print(f"   FAIL: {type(e).__name__}: {e}")

    # Try alternative RBA RSS feed paths
    alt_paths = [
        "https://www.rba.gov.au/rss/rss-cb-media-releases.xml",
        "https://www.rba.gov.au/rss/media-releases.xml",
        "https://www.rba.gov.au/media-releases/rss.xml",
        "https://www.rba.gov.au/rss/",
        "https://www.rba.gov.au/media-releases/",
    ]
    print(f"\n4. Trying alternative paths:")
    for path in alt_paths:
        success, content, error = fetch_url(path)
        status = "OK" if success else f"FAIL ({error[:60]})"
        size = f"{len(content)} bytes" if success else ""
        print(f"   {path}: {status} {size}")


def diagnose_fed_regex():
    """Diagnose why FED rate_range pattern doesn't capture the full fractional range."""
    print("\n" + "=" * 70)
    print("FED REGEX DIAGNOSTIC")
    print("=" * 70)

    config = SOURCES["FED"]

    # Real excerpt from FED IO evidence
    real_text = "The Committee decided to maintain the target range for the federal funds rate at 3-1/2 to 3-3/4 percent"

    print(f"\nTest text: {real_text!r}")

    print(f"\nTesting all FED patterns:")
    for pattern_str, pattern_type in config["rate_patterns"]:
        matches = list(re.finditer(pattern_str, real_text, re.IGNORECASE))
        if matches:
            for m in matches:
                groups = m.groups()
                print(f"  MATCH [{pattern_type}]")
                print(f"    Pattern: {pattern_str}")
                print(f"    Matched: {m.group(0)!r}")
                print(f"    Groups: {groups}")
        else:
            print(f"  no match: {pattern_type}")

    # Test specific rate_range pattern
    print(f"\nDetailed analysis of rate_range pattern:")
    rr_pattern = config["rate_patterns"][0][0]
    print(f"  Pattern: {rr_pattern}")
    print(f"  Components:")
    print(f"    - target range for the federal funds rate at \\s+")
    print(f"    - group 1: \\d+(?:[-/\\s]\\d+)?  (whole+optional fraction parts)")
    print(f"    - \\s*(?:to|-)\\s*")
    print(f"    - group 2: \\d+(?:[-/\\s]\\d+)?  (whole+optional fraction parts)")
    print(f"    - \\s*(?:percent|%|pct)")

    # Manually test
    test_low = "3-1/2"
    test_high = "3-3/4"
    print(f"\n  Testing group 1 on {test_low!r}:")
    m = re.match(r"(\d+(?:[-/\s]\d+)?)", test_low)
    if m:
        print(f"    Match: {m.group(0)!r}")
        print(f"    Remaining: {test_low[m.end():]!r}")

    print(f"\n  Testing group 2 on {test_high!r}:")
    m = re.match(r"(\d+(?:[-/\s]\d+)?)", test_high)
    if m:
        print(f"    Match: {m.group(0)!r}")
        print(f"    Remaining: {test_high[m.end():]!r}")

    # Show what fraction regex actually captures
    print(f"\n  Fraction pattern \\d+(?:[-/\\s]\\d+)? applied to '3-1/2':")
    print(f"    matches '3-1' (stops at '/')")

    # Propose fix
    print(f"\n  PROPOSED FIX:")
    print(f"    New pattern: \\d+(?:[-/\\s]\\d+/?)*  (allow multiple fraction parts)")
    print(f"    Or:          \\d+(?:-\\d/\\d| \\d/\\d|\\.\\d+)?  (explicit fractional forms)")

    # Test proposed fix
    new_pattern = r"target\s+range\s+for\s+the\s+federal\s+funds\s+rate\s+at\s+(\d+(?:[-/\s]\d+/\d)?)\s*(?:to|-)\s*(\d+(?:[-/\s]\d+/\d)?)\s*(?:percent|%|pct)"
    m = re.search(new_pattern, real_text, re.IGNORECASE)
    if m:
        print(f"\n  NEW PATTERN MATCH:")
        print(f"    Matched: {m.group(0)!r}")
        print(f"    Groups: {m.groups()}")
    else:
        print(f"\n  NEW PATTERN: no match")


if __name__ == "__main__":
    diagnose_fed_regex()
    diagnose_boc()
    diagnose_rba()
