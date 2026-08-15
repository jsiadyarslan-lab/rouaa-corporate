#!/usr/bin/env python3
"""
TCMB Remediation Test — Phase A: HTML Structure Diagnostic

Goal: Inspect the actual TCMB Press Releases page HTML and identify the
correct link_pattern for the WebSphere Portal URL structure.

The original link_pattern was:
    /wps/wcm/connect/[^"']+Press\\+Releases/2026/[^"']+

This matched 0 URLs in the original Gate 5 run.

This diagnostic:
  1. Fetches the TCMB Press Releases index page
  2. Saves the raw HTML for inspection
  3. Extracts ALL <a href="..."> URLs
  4. Filters for press-release-like URLs (containing 'Press' or 'Press+Releases' or date patterns)
  5. Tests the EXISTING link_pattern against the HTML
  6. Tests CANDIDATE link_patterns to find one that matches

NO pipeline code changes. NO source_configs.py changes. Diagnostic only.
"""
import re
import sys
import urllib.request
from pathlib import Path

FEED_URL = "https://www.tcmb.gov.tr/wps/wcm/connect/EN/TCMB+EN/Main+Menu/Announcements/Press+Releases/"

OUTPUT_DIR = Path("/home/z/my-project/scripts/pipeline/output/tcmb_diag")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Existing link_pattern from source_configs.py
EXISTING_LINK_PATTERN = r"/wps/wcm/connect/[^\"']+Press\+Releases/2026/[^\"']+"

# Candidate patterns — we'll test each and pick the one that matches the most URLs
CANDIDATE_PATTERNS = [
    # V1: Original (sanity check — should match 0)
    ("V1-original", r"/wps/wcm/connect/[^\"']+Press\+Releases/2026/[^\"']+"),
    # V2: Match any Press+Releases URL (not constrained to 2026)
    ("V2-press-any-year", r"/wps/wcm/connect/[^\"']+Press\+Releases/[^\"']+"),
    # V3: Match any Press+Releases URL OR Press Releases in any encoding
    ("V3-press-any-encoding", r"/wps/wcm/connect/[^\"']+(?:Press\+Releases|Press%20Releases)/[^\"']+"),
    # V4: Catch-all for /wps/wcm/connect URLs that look like press releases
    ("V4-wps-catchall-press", r"/wps/wcm/connect/[^\"']+(?:Press|Basin|B%C3%BClten)[^\"']+"),
    # V5: Match href URLs that contain both 'Press' and a date pattern
    ("V5-press-with-date", r"/wps/wcm/connect/[^\"']+Press[^\"']*(?:2026|2025)[^\"']*"),
    # V6: Broadest — any /wps/wcm/connect/ EN URL that's a press release page
    ("V6-broad-press", r"/wps/wcm/connect/EN/[^\"']+(?:Press|Basin)[^\"']+"),
    # V7: Match press release items by their URL-encoded form (Turkish Portal CMS convention)
    ("V7-encoded", r"/wps/wcm/connect/[^\"']+(?:Press%20Releases|Press\+Releases|Basin\+Bueltenleri|Basin\+Bultenleri)[^\"']+"),
]


def fetch_url(url: str) -> str:
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; ROUA-Pipeline/1.0)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def main():
    print("=" * 70)
    print("TCMB Remediation Test — Phase A: HTML Structure Diagnostic")
    print("=" * 70)
    print(f"\n[1] Fetching TCMB Press Releases index: {FEED_URL}")

    try:
        html = fetch_url(FEED_URL)
    except Exception as e:
        print(f"  ERROR: {e}")
        sys.exit(1)

    print(f"  Fetched {len(html)} bytes")
    (OUTPUT_DIR / "tcmb_press_index.html").write_text(html, encoding="utf-8")
    print(f"  Saved raw HTML to: {OUTPUT_DIR / 'tcmb_press_index.html'}")

    # Step 2: Extract all href URLs from <a> tags
    print(f"\n[2] Extracting all <a href> URLs...")
    href_pattern = re.compile(r'<a\s+[^>]*href=["\']([^"\']+)["\']', re.IGNORECASE)
    all_hrefs = href_pattern.findall(html)
    print(f"  Total <a href> URLs: {len(all_hrefs)}")

    # Filter for URLs that contain 'wps' or 'Press' or 'press' (likely press release links)
    press_hrefs = [h for h in all_hrefs if 'wps' in h.lower() or 'press' in h.lower() or 'basin' in h.lower()]
    print(f"  Filtered (wps/press/basin): {len(press_hrefs)}")

    # Deduplicate while preserving order
    seen = set()
    unique_press = []
    for h in press_hrefs:
        if h not in seen:
            seen.add(h)
            unique_press.append(h)

    print(f"  Unique press-like URLs: {len(unique_press)}")
    print(f"\n  First 20 unique press-like URLs:")
    for i, url in enumerate(unique_press[:20], 1):
        # Truncate long URLs for readability
        display = url if len(url) <= 120 else url[:117] + "..."
        print(f"  {i:2}. {display}")

    # Save full list of unique press URLs for reference
    (OUTPUT_DIR / "tcmb_press_urls.txt").write_text("\n".join(unique_press), encoding="utf-8")

    # Step 3: Test EXISTING link_pattern
    print(f"\n[3] Testing EXISTING link_pattern: {EXISTING_LINK_PATTERN}")
    existing_matches = re.findall(EXISTING_LINK_PATTERN, html)
    existing_unique = list(set(existing_matches))
    print(f"  Matches: {len(existing_matches)} (unique: {len(existing_unique)})")

    # Step 4: Test CANDIDATE patterns
    print(f"\n[4] Testing CANDIDATE link_patterns:")
    best_label = None
    best_count = 0
    best_unique_count = 0
    for label, pat in CANDIDATE_PATTERNS:
        try:
            matches = re.findall(pat, html)
            unique = list(set(matches))
            print(f"  [{label}] matches={len(matches)} unique={len(unique)}")
            if len(unique) > 0 and len(matches) > 0:
                print(f"    Sample URLs (first 3):")
                for u in unique[:3]:
                    display = u if len(u) <= 120 else u[:117] + "..."
                    print(f"      {display}")
            # Track best (most unique matches, but cap at 30 to avoid runaway)
            if 0 < len(unique) <= 30 and len(unique) > best_unique_count:
                best_label = label
                best_count = len(matches)
                best_unique_count = len(unique)
        except re.error as e:
            print(f"  [{label}] REGEX ERROR: {e}")

    # Step 5: Decision
    print(f"\n[5] DECISION")
    print(f"  Existing pattern matched: {len(existing_unique)} URLs")
    print(f"  Best candidate: {best_label} (matches={best_count}, unique={best_unique_count})")

    if best_label and best_unique_count > 0:
        best_pat = next(p for l, p in CANDIDATE_PATTERNS if l == best_label)
        print(f"  Recommended link_pattern for TCMB config:")
        print(f"    {best_pat!r}")
        print(f"\n  Next step: write Phase B diagnostic to verify the recommended")
        print(f"  pattern produces fetchable URLs that yield monetary policy content.")
    else:
        print(f"  No candidate pattern matched.")
        print(f"  May need broader pattern or pipeline-level changes.")
        print(f"  Inspect raw HTML: {OUTPUT_DIR / 'tcmb_press_index.html'}")
    print()


if __name__ == "__main__":
    main()
