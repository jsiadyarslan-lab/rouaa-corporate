#!/usr/bin/env python3
"""Inspect BOC RSS XML structure to understand why 0 items parsed."""

import sys
import os
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetcher import fetch_url


def main():
    print("Fetching BOC RSS feed...")
    success, xml, error = fetch_url("https://www.bankofcanada.ca/feed/")
    if not success:
        print(f"FAIL: {error}")
        return

    # Save raw XML
    with open("/home/z/my-project/scripts/pipeline/output/boc_rss_raw.xml", "w", encoding="utf-8") as f:
        f.write(xml)
    print(f"Saved raw XML: {len(xml)} bytes")

    # Print first 2000 chars
    print("\n--- First 2000 chars of BOC RSS XML ---")
    print(xml[:2000])
    print("--- end ---\n")

    # Count item-like tags using raw string patterns
    item_count = len(re.findall(r"<item[\s>]", xml, re.IGNORECASE))
    entry_count = len(re.findall(r"<entry[\s>]", xml, re.IGNORECASE))
    print(f"<item> tags: {item_count}")
    print(f"<entry> tags: {entry_count}")

    # Find all xmlns declarations
    xmlns_matches = re.findall(r'xmlns(?::\w+)?="[^"]+"', xml)
    print(f"xmlns declarations ({len(xmlns_matches)}):")
    for ns in xmlns_matches[:10]:
        print(f"  {ns}")

    # Try parsing with explicit namespaces
    import xml.etree.ElementTree as ET
    try:
        root = ET.fromstring(xml)
        print(f"\nRoot tag: {root.tag}")
        print(f"Root attrib: {dict(root.attrib)}")

        # Try different item selectors
        items_rss2 = root.findall(".//item")
        items_rss1 = root.findall(".//{http://purl.org/rss/1.0/}item")
        items_atom = root.findall(".//{http://www.w3.org/2005/Atom}entry")

        print(f"RSS 2.0 items (.//item): {len(items_rss2)}")
        print(f"RSS 1.0 items (ns-prefixed): {len(items_rss1)}")
        print(f"Atom entries: {len(items_atom)}")

        # List all unique element tags
        all_tags = set()
        for elem in root.iter():
            all_tags.add(elem.tag)
        print(f"\nAll unique tags in document ({len(all_tags)}):")
        for t in sorted(all_tags)[:30]:
            print(f"  {t}")

        # List top-level children of root
        print(f"\nTop-level children of root:")
        for child in root:
            print(f"  {child.tag}")
            for sub in list(child)[:5]:
                print(f"    {sub.tag}")
    except ET.ParseError as e:
        print(f"XML parse error: {e}")


if __name__ == "__main__":
    main()
