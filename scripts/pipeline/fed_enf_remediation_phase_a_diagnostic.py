#!/usr/bin/env python3
"""
FED_ENF Remediation Test — Phase A: Diagnostic

Goal: Determine whether the FED_ENF Gate 5 failure can be resolved through
CONFIGURATION-ONLY changes (adjusting the regulatory_patterns list in
source_configs.py), or whether it reveals a pipeline/engineering limitation.

This script does NOT modify any pipeline code or source_configs.py. It only:
  1. Re-fetches the FED RSS feed (live)
  2. Identifies enforcement items (titles containing enforcement keywords)
  3. Fetches one or two enforcement article bodies
  4. Tests the EXISTING FED_ENF regulatory_patterns against actual content
  5. Tests CANDIDATE new patterns (the proposed remediation)
  6. Reports: which patterns matched, which didn't, and why

Decision criterion:
  - If candidate patterns match the content and would produce >= 1 fact per item
    with CONFIG-ONLY changes → pattern-specificity is config-only for this source
  - If candidate patterns cannot match without extractor/detector code changes
    → pattern-specificity reveals engineering for this source
"""
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from typing import List, Tuple, Optional

FEED_URL = "https://www.federalreserve.gov/feeds/press_all.xml"

# Existing FED_ENF regulatory_patterns (copied from source_configs.py lines 746-755)
EXISTING_PATTERNS: List[Tuple[str, str]] = [
    (r"(?:enforcement\s+action\s+(?:with|against))\s+([A-Z][A-Za-z\s,&\.\-]{5,80}?)(?:\s+(?:and|Former|former))", "defendant_name"),
    (r"(?:issued|assessed|imposed)\s+(?:a\s+)?(?:consent\s+)?(?:order|civil\s+money\s+penalty|fine|prohibition)", "action_type"),
    (r"(?:for|due\s+to|related\s+to)\s+([a-z\s,]{10,60}(?:fraud|violation|breach|misconduct|deficiency))", "violation_type"),
    (r"(?:agreed\s+to\s+pay|pay|penalty\s+of)\s+(?:approximately\s+)?\$([\d,]+(?:\.\d+)?)\s+(million|billion)", "penalty_amount"),
    (r"\$([\d,]+(?:\.\d+)?)\s+(million|billion)\s+(?:penalty|fine|civil\s+money)", "penalty_amount"),
]

# Candidate remediated patterns — designed to match actual Fed enforcement phrasing.
# Hypothesis: Fed enforcement items use "Consent Prohibition against X",
# "Consent Order against X", "Civil Money Penalty against X", and named individuals.
CANDIDATE_PATTERNS: List[Tuple[str, str]] = [
    # Defendant names: capture individual/bank name after "against" in enforcement context
    # "Consent Prohibition against Elazia Jones" → "Elazia Jones"
    # "Consent Order against First Federal Bank" → "First Federal Bank"
    (r"(?:Consent\s+(?:Prohibition|Order|Cease\s+and\s+Desist\s+Order|Written\s+Agreement)|Cease\s+and\s+Desist\s+Order|Civil\s+Money\s+Penalty)\s+(?:Issued\s+Against\s+|against\s+)([A-Z][A-Za-z0-9\s,&\.\-]{3,100}?)(?:[,\n\.])", "defendant_name"),
    # Action type: detect the enforcement instrument
    (r"\b(Consent\s+(?:Prohibition|Order|Cease\s+and\s+Desist)|Cease\s+and\s+Desist\s+Order|Civil\s+Money\s+Penalty|Written\s+Agreement|Removal\s+and\s+Prohibition|Order\s+of\s+Prohibition)\b", "action_type"),
    # Violation types: capture the substantive issue (more permissive)
    (r"(?:for|due\s+to|related\s+to|based\s+on|in\s+connection\s+with)\s+([a-z\s,]{8,80}(?:fraud|violation|breach|misconduct|deficiency|unsafe\s+or\s+unsound\s+practice|Bank\s+Secrecy\s+Act|BSA|AML))", "violation_type"),
    # Violation types: standalone BSA/AML patterns (Fed enforcement is heavy on BSA/AML)
    (r"\b(Bank\s+Secrecy\s+Act|BSA|AML|anti-money\s+laundering|unsafe\s+or\s+unsound\s+practice[s]?)\b", "violation_type"),
    # Penalty amounts: "$X million civil money penalty"
    (r"(?:agreed\s+to\s+pay|pay|penalty\s+of|civil\s+money\s+penalty\s+of)\s+(?:approximately\s+)?\$([\d,]+(?:\.\d+)?)\s+(million|billion)", "penalty_amount"),
    (r"\$([\d,]+(?:\.\d+)?)\s+(million|billion)\s+(?:penalty|fine|civil\s+money)", "penalty_amount"),
]


def fetch_rss(url: str) -> str:
    """Fetch RSS feed content."""
    req = urllib.request.Request(url, headers={"User-Agent": "ROUA-Pipeline/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_rss_items(xml_text: str) -> List[dict]:
    """Parse RSS items, returning list of {title, link, pubDate, description}."""
    root = ET.fromstring(xml_text)
    items = []
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pubDate = (item.findtext("pubDate") or "").strip()
        description = (item.findtext("description") or "").strip()
        items.append({"title": title, "link": link, "pubDate": pubDate, "description": description})
    return items


def is_enforcement_item(item: dict) -> bool:
    """Heuristic: identify enforcement-related RSS items by title keywords."""
    title_lower = item["title"].lower()
    enforcement_signals = [
        "enforcement action",
        "consent order",
        "consent prohibition",
        "cease and desist",
        "civil money penalty",
        "written agreement",
        "removal and prohibition",
        "order of prohibition",
        "against ",  # many Fed enforcement titles say "against X"
    ]
    return any(sig in title_lower for sig in enforcement_signals)


def fetch_article(url: str) -> str:
    """Fetch an article page and return visible text (rough extraction)."""
    req = urllib.request.Request(url, headers={"User-Agent": "ROUA-Pipeline/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    # Crude HTML → text: strip tags and scripts
    html = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def test_patterns(text: str, patterns: List[Tuple[str, str]], label: str) -> List[Tuple[str, str, str]]:
    """Test a list of (regex, metric) patterns against text. Return list of (metric, match_text, source_label)."""
    results = []
    for pat, metric in patterns:
        flags = re.IGNORECASE
        # Match the source_configs.py convention: case_sensitive=True would disable IGNORECASE.
        # Our candidate patterns do not set case_sensitive, so IGNORECASE is applied (matches existing extractor behavior).
        # For defendant_name patterns starting with [A-Z], IGNORECASE would also match lowercase — but our patterns
        # also anchor on the "Consent Order against" prefix, which only matches proper Fed phrasing.
        for m in re.finditer(pat, text, flags):
            captured = m.group(1) if m.groups() else m.group(0)
            results.append((metric, captured.strip(), label))
    return results


def main():
    print("=" * 70)
    print("FED_ENF Remediation Test — Phase A: Diagnostic")
    print("=" * 70)

    # 1. Fetch RSS
    print(f"\n[1] Fetching FED RSS: {FEED_URL}")
    try:
        xml_text = fetch_rss(FEED_URL)
    except Exception as e:
        print(f"  ERROR: {e}")
        sys.exit(1)
    print(f"  Fetched {len(xml_text)} bytes")

    # 2. Parse items
    items = parse_rss_items(xml_text)
    print(f"\n[2] Parsed {len(items)} RSS items")

    # 3. Filter enforcement items
    enforcement_items = [it for it in items if is_enforcement_item(it)]
    print(f"\n[3] Identified {len(enforcement_items)} enforcement items (by title keywords):")
    for i, it in enumerate(enforcement_items[:10], 1):
        print(f"  {i}. {it['title'][:110]}")
        print(f"     {it['link']}")

    # 4. Fetch first 3 enforcement articles (or all if fewer)
    sample = enforcement_items[:3]
    print(f"\n[4] Fetching {len(sample)} sample enforcement articles for pattern testing...")
    articles = []
    for it in sample:
        try:
            text = fetch_article(it["link"])
            articles.append((it, text))
            print(f"  Fetched {len(text)} chars: {it['title'][:80]}")
        except Exception as e:
            print(f"  ERROR fetching {it['link']}: {e}")

    if not articles:
        print("\nNo articles fetched — cannot proceed with pattern test.")
        sys.exit(1)

    # 5. Test EXISTING patterns
    print("\n" + "=" * 70)
    print("[5] Testing EXISTING FED_ENF regulatory_patterns against actual content")
    print("=" * 70)
    existing_total = 0
    for it, text in articles:
        print(f"\n  Article: {it['title'][:80]}")
        print(f"  Body length: {len(text)} chars")
        results = test_patterns(text, EXISTING_PATTERNS, "existing")
        if results:
            for metric, captured, _ in results:
                print(f"    MATCH ({metric}): {captured[:80]}")
        else:
            print("    NO MATCHES (0 facts would be extracted)")
        existing_total += len(results)
    print(f"\n  TOTAL existing-pattern matches across {len(articles)} articles: {existing_total}")

    # 6. Test CANDIDATE patterns
    print("\n" + "=" * 70)
    print("[6] Testing CANDIDATE remediated patterns against actual content")
    print("=" * 70)
    candidate_total = 0
    for it, text in articles:
        print(f"\n  Article: {it['title'][:80]}")
        results = test_patterns(text, CANDIDATE_PATTERNS, "candidate")
        if results:
            for metric, captured, _ in results:
                print(f"    MATCH ({metric}): {captured[:80]}")
        else:
            print("    NO MATCHES")
        candidate_total += len(results)
    print(f"\n  TOTAL candidate-pattern matches across {len(articles)} articles: {candidate_total}")

    # 7. Decision
    print("\n" + "=" * 70)
    print("[7] REMEDIATION TEST DECISION")
    print("=" * 70)
    print(f"  Existing patterns: {existing_total} matches")
    print(f"  Candidate patterns: {candidate_total} matches")
    if candidate_total > existing_total:
        print("  → Candidate patterns improve extraction.")
        print("  → If apply-as-config-only succeeds, pattern-specificity is CONFIG-ONLY for FED_ENF.")
        print("  → Proceed to Phase B: apply candidate patterns to source_configs.py and re-run Gate 5.")
    else:
        print("  → Candidate patterns do not improve extraction.")
        print("  → May need extractor/detector changes → pattern-specificity REVEALS ENGINEERING for FED_ENF.")
    print()


if __name__ == "__main__":
    main()
