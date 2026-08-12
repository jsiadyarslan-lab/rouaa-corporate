#!/usr/bin/env python3
"""
Phase B source reconnaissance — probe each candidate source's accessibility,
feed format, and content structure BEFORE adding to config.

Goal: confirm each source is reachable, identify its access method (RSS/HTML/PDF),
and verify it has substantive content we can extract.

NO production code changes — pure recon.
"""

import sys
import os
import re
import urllib.request
import urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetcher import fetch_with_fallback, fetch_url


CANDIDATES = [
    # Central banks (different from Phase A's ECB/BOE/FED/BOC)
    {
        "id": "BOJ",
        "name": "Bank of Japan",
        "category": "central_bank",
        "website": "https://www.boj.or.jp/en/",
        "feed_candidates": [
            "https://www.boj.or.jp/en/rss/whatsnew.xml",
            "https://www.boj.or.jp/rss/whatsnew.xml",
        ],
        "stress_test": "different rate terminology (complementary-lending facility, basic loan rate)",
    },
    {
        "id": "RBNZ",
        "name": "Reserve Bank of New Zealand",
        "category": "central_bank",
        "website": "https://www.rbnz.govt.nz/",
        "feed_candidates": [
            "https://www.rbnz.govt.nz/feeds/news",
            "https://www.rbnz.govt.nz/-/media/project/sites/rbnz/files/news/rss/rss-all.xml",
        ],
        "stress_test": "OCR (Official Cash Rate) — different rate name",
    },
    # Financial regulators
    {
        "id": "SEC",
        "name": "US Securities and Exchange Commission",
        "category": "financial_regulator",
        "website": "https://www.sec.gov",
        "feed_candidates": [
            "https://www.sec.gov/rss/press.xml",
            "https://www.sec.gov/news/pressreleases.rss",
        ],
        "stress_test": "regulatory enforcement actions, penalty amounts, defendant names — new event type",
    },
    {
        "id": "FCA",
        "name": "UK Financial Conduct Authority",
        "category": "financial_regulator",
        "website": "https://www.fca.org.uk",
        "feed_candidates": [
            "https://www.fca.org.uk/news/rss.xml",
            "https://www.fca.org.uk/news/feed",
        ],
        "stress_test": "regulatory fines, UK jurisdiction — different regulatory vocabulary",
    },
    # Statistical authorities
    {
        "id": "BLS",
        "name": "US Bureau of Labor Statistics",
        "category": "statistical_authority",
        "website": "https://www.bls.gov",
        "feed_candidates": [
            "https://www.bls.gov/feed/release.rss",
            "https://feeds.bls.gov/bls/feed",
        ],
        "stress_test": "numeric facts (employment level, unemployment rate, CPI) — new fact type",
    },
    {
        "id": "ONS",
        "name": "UK Office for National Statistics",
        "category": "statistical_authority",
        "website": "https://www.ons.gov.uk",
        "feed_candidates": [
            "https://www.ons.gov.uk/rss",
            "https://www.ons.gov.uk/releasecalendar RSS",
        ],
        "stress_test": "UK economic statistics, different numeric formats",
    },
    # Corporate IR
    {
        "id": "ARAMCO",
        "name": "Saudi Aramco Investor Relations",
        "category": "corporate_ir",
        "website": "https://www.aramco.com/en/investors",
        "feed_candidates": [
            "https://www.aramco.com/en/investors/news-and-events",
            "https://www.aramco.com/en/news.rss",
        ],
        "stress_test": "dividend + earnings facts — aligns with investment-intelligence evidence ($33.6B dividend)",
    },
    {
        "id": "APPLE",
        "name": "Apple Investor Relations",
        "category": "corporate_ir",
        "website": "https://investor.apple.com",
        "feed_candidates": [
            "https://investor.apple.com/investor-relations/default.aspx",
            "https://www.apple.com/pr/feed.rss",
        ],
        "stress_test": "quarterly revenue, EPS — corporate earnings extraction",
    },
    # Government / regulatory publication
    {
        "id": "OFAC",
        "name": "US Treasury OFAC",
        "category": "government_regulatory",
        "website": "https://ofac.treasury.gov",
        "feed_candidates": [
            "https://ofac.treasury.gov/recent-actions",
            "https://home.treasury.gov/feeds/ofac-recent-actions",
        ],
        "stress_test": "sanctions designations — entity names, countries, programs — aligns with risk-intelligence evidence",
    },
    # PDF-heavy source
    {
        "id": "BIS",
        "name": "Bank for International Settlements Quarterly Review",
        "category": "pdf_heavy",
        "website": "https://www.bis.org/publ/quarterly.htm",
        "feed_candidates": [
            "https://www.bis.org/list/cpubs/index.rss",
            "https://www.bis.org/publ/quarterly.htm",
        ],
        "stress_test": "PDF document extraction — different content type (financial stability, not rate decisions)",
    },
]


def probe(candidate: dict) -> dict:
    """Probe a candidate source — check website access, feed access, identify feed format."""
    result = {
        "id": candidate["id"],
        "name": candidate["name"],
        "category": candidate["category"],
        "stress_test": candidate["stress_test"],
        "website_accessible": False,
        "feed_found": False,
        "feed_url": None,
        "feed_method": None,
        "feed_size_bytes": 0,
        "feed_format": None,  # rss2 / atom / rdf / html
        "feed_item_count": 0,
        "first_items": [],
        "errors": [],
    }

    print(f"\n[{candidate['id']}] {candidate['name']} ({candidate['category']})")
    print(f"  Stress test: {candidate['stress_test']}")

    # Step 1: Check each feed candidate
    for feed_url in candidate["feed_candidates"]:
        print(f"  Probing: {feed_url}")
        success, content, error, method = fetch_with_fallback(feed_url, timeout=20)
        if not success:
            print(f"    FAIL ({method}): {error[:100]}")
            result["errors"].append(f"{feed_url}: {error[:100]}")
            continue

        # Check if it's actually a feed (XML) or HTML
        is_xml = bool(re.match(r"\s*<\?xml|<rss|<feed|<rdf:RDF", content[:200]))
        is_html = "<html" in content[:500].lower()

        if is_xml:
            # Count items
            items = re.findall(r"<item[\s>]", content, re.IGNORECASE)
            entries = re.findall(r"<entry[\s>]", content, re.IGNORECASE)
            item_count = max(len(items), len(entries))

            # Detect format
            if "<rdf:RDF" in content[:500]:
                fmt = "rdf"
            elif "<rss" in content[:500]:
                fmt = "rss2"
            elif "<feed" in content[:500]:
                fmt = "atom"
            else:
                fmt = "xml_unknown"

            # Extract first 3 titles
            titles = re.findall(r"<title[^>]*>([^<]+)</title>", content, re.IGNORECASE)[:5]

            result["feed_found"] = True
            result["feed_url"] = feed_url
            result["feed_method"] = method
            result["feed_size_bytes"] = len(content)
            result["feed_format"] = fmt
            result["feed_item_count"] = item_count
            result["first_items"] = titles

            print(f"    OK ({method}) — {fmt}, {item_count} items, {len(content)} bytes")
            for t in titles[:3]:
                print(f"      -> {t[:80]}")
            break
        elif is_html:
            # Not a feed, but page is accessible — could be HTML-only source
            print(f"    HTML page (not feed) — {len(content)} bytes via {method}")
            result["feed_found"] = False
            result["feed_url"] = feed_url  # Will use as content URL
            result["feed_method"] = method
            result["feed_size_bytes"] = len(content)
            result["feed_format"] = "html"
            # Look for any RSS link in the page
            rss_links = re.findall(r'<link[^>]*type="application/rss\+xml"[^>]*href="([^"]+)"', content, re.IGNORECASE)
            if rss_links:
                print(f"    Found RSS link in HTML: {rss_links[0]}")
                result["errors"].append(f"rss_link_in_html: {rss_links[0]}")
            break
        else:
            print(f"    Unknown content type ({len(content)} bytes)")
            result["errors"].append(f"{feed_url}: unknown content type")

    # Step 2: If no feed found, check website root accessibility
    if not result["feed_found"]:
        print(f"  No feed found — checking website root: {candidate['website']}")
        success, content, error, method = fetch_with_fallback(candidate["website"], timeout=20)
        if success:
            result["website_accessible"] = True
            print(f"    Website accessible via {method} ({len(content)} bytes)")
        else:
            print(f"    Website FAIL ({method}): {error[:100]}")
            result["errors"].append(f"website: {error[:100]}")

    return result


def main():
    print("=" * 70)
    print("PHASE B SOURCE RECONNAISSANCE")
    print("=" * 70)
    print(f"Candidates: {len(CANDIDATES)}")

    results = []
    for cand in CANDIDATES:
        try:
            r = probe(cand)
            results.append(r)
        except Exception as e:
            print(f"  [FATAL] {cand['id']}: {type(e).__name__}: {e}")
            results.append({
                "id": cand["id"],
                "name": cand["name"],
                "category": cand["category"],
                "stress_test": cand["stress_test"],
                "errors": [f"FATAL: {type(e).__name__}: {e}"],
                "feed_found": False,
            })

    # Summary
    print("\n" + "=" * 70)
    print("RECON SUMMARY")
    print("=" * 70)
    print(f"\n{'ID':<8} {'Category':<22} {'Feed':<6} {'Format':<10} {'Items':>6} {'Method':<10}")
    print("-" * 70)
    for r in results:
        feed_status = "✓" if r.get("feed_found") else "✗"
        fmt = r.get("feed_format", "-") or "-"
        items = r.get("feed_item_count", 0)
        method = r.get("feed_method", "-") or "-"
        print(f"{r['id']:<8} {r['category']:<22} {feed_status:<6} {fmt:<10} {items:>6} {method:<10}")

    # Save results
    import json
    out_path = "/home/z/my-project/scripts/pipeline/output/phase_b_recon.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nSaved: {out_path}")


if __name__ == "__main__":
    main()
