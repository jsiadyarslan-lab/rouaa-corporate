#!/usr/bin/env python3
"""
TCMB Remediation Test — Phase B: Playwright diagnostic

Goal: Confirm the diagnosis that TCMB press release URLs are JavaScript-rendered
and not present in the static HTML. If Playwright renders the page and press
release URLs appear, this confirms:
  - The failure is NOT a link_pattern mismatch
  - The failure IS a JavaScript-rendering requirement
  - Resolving this requires core pipeline changes (NOT config-only)

This is a DIAGNOSTIC ONLY — it does NOT modify source_configs.py or any
pipeline code. It just shows what would be possible if Playwright were
used for this source.
"""
import re
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = "https://www.tcmb.gov.tr/wps/wcm/connect/EN/TCMB+EN/Main+Menu/Announcements/Press+Releases/"

OUTPUT_DIR = Path("/home/z/my-project/scripts/pipeline/output/tcmb_diag")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def main():
    print("=" * 70)
    print("TCMB Remediation Test — Phase B: Playwright diagnostic")
    print("=" * 70)

    print(f"\n[1] Launching Playwright Chromium headless...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                locale="en-US",
            )
            page = context.new_page()
            print(f"[2] Navigating to: {URL}")
            response = page.goto(URL, timeout=60000, wait_until="networkidle")
            if response is None:
                print("  ERROR: No response")
                sys.exit(1)
            print(f"  HTTP status: {response.status}")

            # Wait extra time for any lazy-loaded content
            print("[3] Waiting 5 seconds for any lazy content...")
            page.wait_for_timeout(5000)

            # Get the fully rendered HTML
            rendered_html = page.content()
            print(f"  Rendered HTML length: {len(rendered_html)} bytes")

            # Save rendered HTML for inspection
            output_file = OUTPUT_DIR / "tcmb_press_index_rendered.html"
            output_file.write_text(rendered_html, encoding="utf-8")
            print(f"  Saved rendered HTML to: {output_file}")

            # Look for press release URLs in the rendered HTML
            print(f"\n[4] Searching for press release URLs in rendered HTML...")

            # Extract all <a href> URLs
            href_pattern = re.compile(r'<a\s+[^>]*href=["\']([^"\']+)["\']', re.IGNORECASE)
            all_hrefs = href_pattern.findall(rendered_html)
            print(f"  Total <a href> URLs: {len(all_hrefs)}")

            # Filter for press release-like URLs
            press_urls = [h for h in all_hrefs if 'Press' in h or 'Basin' in h or '2026' in h or '2025' in h]
            press_urls_unique = list(set(press_urls))
            print(f"  Press-like URLs (unique): {len(press_urls_unique)}")

            if press_urls_unique:
                print(f"\n  First 20 press release URLs found (after JS rendering):")
                for i, url in enumerate(sorted(press_urls_unique)[:20], 1):
                    display = url if len(url) <= 130 else url[:127] + "..."
                    print(f"  {i:2}. {display}")
            else:
                print("  Still no press release URLs found in rendered HTML.")
                print("  The content may be loaded by a click handler or further JS interaction.")

            # Test the original link_pattern against rendered HTML
            print(f"\n[5] Testing ORIGINAL link_pattern against rendered HTML...")
            original_pat = r"/wps/wcm/connect/[^\"]+Press\+Releases/2026/[^\"]+"
            original_matches = re.findall(original_pat, rendered_html)
            print(f"  Original pattern matches: {len(original_matches)}")
            if original_matches:
                print(f"  First 5 matches:")
                for m in list(set(original_matches))[:5]:
                    print(f"    {m[:130]}")

            # Test a broader pattern
            print(f"\n[6] Testing BROADER pattern (any Press+Releases URL)...")
            broad_pat = r"/wps/wcm/connect/[^\"]+Press\+Releases/[^\"]+"
            broad_matches = re.findall(broad_pat, rendered_html)
            broad_unique = list(set(broad_matches))
            print(f"  Broad pattern matches: {len(broad_matches)} (unique: {len(broad_unique)})")
            if broad_unique:
                print(f"  First 10 unique matches:")
                for m in broad_unique[:10]:
                    print(f"    {m[:130]}")

            # Decision
            print(f"\n[7] DIAGNOSIS")
            print(f"  Static HTML (urllib): empty year tab panes, no press release URLs")
            print(f"  Rendered HTML (Playwright): {len(broad_unique)} press release URLs found")
            if len(broad_unique) > 0:
                print(f"  → The press release URLs ARE present in JS-rendered HTML.")
                print(f"  → The failure is NOT a link_pattern mismatch.")
                print(f"  → The failure is a JavaScript-rendering requirement.")
                print(f"  → RESOLUTION OPTIONS:")
                print(f"     A. Add 'force_browser': True flag to TCMB config + modify fetch_with_fallback()")
                print(f"        to respect it (CORE PIPELINE CHANGE to fetcher.py)")
                print(f"     B. Add a new 'html_index_js' feed_format + new parser (CORE CHANGE)")
                print(f"     C. Find a JSON API endpoint (none found in JS files inspected)")
                print(f"  → All options require core engineering.")
                print(f"  → Per user constraint: STOP. Classification = ENGINEERING REQUIRED.")
            else:
                print(f"  → Even Playwright doesn't reveal press release URLs.")
                print(f"  → May need further investigation (click handler simulation, etc.)")
                print(f"  → Classification = UNRESOLVED")
        finally:
            browser.close()
    print()


if __name__ == "__main__":
    main()
