#!/usr/bin/env python3
"""Correctly diagnose BOC: use parse_rss_feed, then inspect content extraction."""

import sys
import os
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetcher import fetch_url, fetch_source_publications, parse_rss_feed
from source_configs import SOURCES
from content_extractor import (
    extract_document_content,
    extract_semantic_containers,
    extract_paragraph_clusters,
    score_content_candidate,
)
from normalizer import strip_html


def main():
    config = SOURCES["BOC"]

    print("=" * 70)
    print("BOC CONTENT EXTRACTION DIAGNOSTIC (corrected)")
    print("=" * 70)

    # Step 1: fetch RSS and parse
    print("\n1. Fetching BOC RSS feed...")
    success, xml, error = fetch_url(config["feedUrl"])
    print(f"   success={success}, len={len(xml)}, error={error}")

    documents = parse_rss_feed(xml, "BOC")
    print(f"   Parsed {len(documents)} documents")

    if not documents:
        print("   No documents — STOP")
        return

    # Show first 3 document titles
    for i, doc in enumerate(documents[:5]):
        print(f"   [{i}] {doc.title}")
        print(f"       URL: {doc.raw_content_url}")
        print(f"       Date: {doc.published_at}")

    # Step 2: Filter for monetary policy keywords
    print("\n2. Filtering for monetary policy keywords...")
    keywords = config["content_keywords"]
    print(f"   Keywords: {keywords}")

    for doc in documents:
        text = (doc.title + " " + doc.content_text).lower()
        matches = [kw for kw in keywords if kw.lower() in text]
        if matches:
            print(f"   MATCH: {doc.title} (matched: {matches})")

    # Step 3: Pick a target — look for "interest rate" or "overnight rate" in title
    target = None
    for doc in documents:
        title_lower = doc.title.lower()
        if "interest rate" in title_lower or "overnight rate" in title_lower or "monetary policy" in title_lower:
            target = doc
            break

    if not target:
        # Just pick the first document
        target = documents[0]

    print(f"\n3. Target document: {target.title}")
    print(f"   URL: {target.raw_content_url}")

    # Step 4: Fetch full HTML content
    print("\n4. Fetching full HTML content...")
    success, html, error = fetch_url(target.raw_content_url)
    print(f"   success={success}, len={len(html) if success else 0}, error={error}")

    if not success:
        print("   Cannot proceed without HTML")
        return

    # Save raw HTML
    with open("/home/z/my-project/scripts/pipeline/output/boc_page_raw.html", "w", encoding="utf-8") as f:
        f.write(html)
    print(f"   Saved raw HTML: output/boc_page_raw.html ({len(html)} bytes)")

    # Step 5: HTML structure analysis
    print("\n5. HTML structure analysis:")
    print(f"   <article>: {len(re.findall(r'<article[\\s>]', html, re.IGNORECASE))}")
    print(f"   <main>: {len(re.findall(r'<main[\\s>]', html, re.IGNORECASE))}")
    print(f"   <p>: {len(re.findall(r'<p[\\s>]', html, re.IGNORECASE))}")
    print(f"   <div>: {len(re.findall(r'<div[\\s>]', html, re.IGNORECASE))}")
    print(f"   <section>: {len(re.findall(r'<section[\\s>]', html, re.IGNORECASE))}")

    # Find content-bearing class names
    classes = re.findall(r'class="([^"]+)"', html)
    content_classes = [c for c in classes if any(kw in c.lower() for kw in ['content', 'main', 'article', 'post', 'body', 'entry'])]
    print(f"   content-class names (unique): {list(set(content_classes))[:10]}")

    # Step 6: Test content extractor
    print("\n6. Content extractor candidates:")
    semantic = extract_semantic_containers(html)
    print(f"   Semantic containers: {len(semantic)}")
    for ct, text in semantic[:5]:
        score = score_content_candidate(text, keywords)
        print(f"     - {ct}: {len(text)} chars, score={score}")
        print(f"       preview: {text[:200]!r}")

    clusters = extract_paragraph_clusters(html)
    print(f"\n   Paragraph clusters: {len(clusters)}")
    for i, c in enumerate(clusters[:5]):
        score = score_content_candidate(c, keywords)
        print(f"     - cluster_{i}: {len(c)} chars, score={score}")
        print(f"       preview: {c[:200]!r}")

    # Test full extraction
    content_type, content = extract_document_content(html, keywords)
    print(f"\n7. Selected content_type: {content_type}")
    print(f"   Selected content length: {len(content)} chars")

    # Step 8: Test rate patterns on extracted content AND on raw HTML
    print("\n8. Rate patterns on EXTRACTED content:")
    for pattern_str, pattern_type in config["rate_patterns"]:
        matches = list(re.finditer(pattern_str, content, re.IGNORECASE))
        if matches:
            for m in matches[:2]:
                print(f"   MATCH [{pattern_type}]: {m.group(0)!r}")
        else:
            print(f"   no match: {pattern_type}")

    print("\n9. Rate patterns on RAW HTML:")
    for pattern_str, pattern_type in config["rate_patterns"]:
        matches = list(re.finditer(pattern_str, html, re.IGNORECASE))
        if matches:
            for m in matches[:2]:
                print(f"   MATCH [{pattern_type}]: {m.group(0)!r}")
        else:
            print(f"   no match: {pattern_type}")

    # Step 10: Look for the actual rate decision text in the HTML
    print("\n10. Searching for 'overnight rate' / 'target' / 'percent' in raw HTML:")
        # This won't work because of indentation — fix below
    pass

    # Real version
    print("\n10. Searching for 'overnight rate' / 'target' / 'percent' in raw HTML:")
    for term in ["overnight rate", "target", "percent", "per cent", "policy rate", "interest rate"]:
        positions = [m.start() for m in re.finditer(term, html, re.IGNORECASE)][:3]
        if positions:
            for pos in positions:
                # Show context
                start = max(0, pos - 80)
                end = min(len(html), pos + 200)
                context = html[start:end]
                # Strip HTML tags for readability
                clean = re.sub(r'<[^>]+>', ' ', context)
                clean = re.sub(r'\s+', ' ', clean).strip()
                print(f"   '{term}' at {pos}: ...{clean[:250]}...")


if __name__ == "__main__":
    main()
