#!/usr/bin/env python3
"""
FED_ENF Remediation Test — Phase B: Accurate Diagnostic

Goal: Replicate the ACTUAL pipeline code path (normalizer + extractor paragraph
logic + detector trigger_metrics) to predict whether candidate patterns will
produce facts when applied as config-only changes.

This script:
  1. Re-fetches the FED RSS
  2. Identifies enforcement items
  3. For each enforcement article:
     a. Fetches HTML
     b. Uses the ACTUAL normalizer.normalize_document() to extract paragraphs
     c. Applies the ACTUAL extractor logic (per-paragraph, >20 char minimum,
        IGNORECASE flag)
     d. Reports facts that would be extracted
  4. For detector: checks whether extracted facts include any
     trigger_metrics for `regulatory_enforcement` event type
     (penalty_amount, defendant_name, action_type, violation_type)
  5. Reports predicted facts, predicted events, and predicted IOs

Decision criterion (config-only vs engineering):
  - If candidate patterns produce >= 1 fact per article AND facts include
    a trigger_metric → config-only remediation should succeed → proceed to
    Phase C (apply to source_configs.py and run real Gate 5)
  - If candidate patterns produce 0 facts → either need pattern refinement
    (still config-only) OR need extractor/detector changes (engineering)
"""
import sys
import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from typing import List, Tuple, Optional
from dataclasses import dataclass

# Add pipeline dir to path so we can import the actual modules
PIPELINE_DIR = "/home/z/my-project/rouaa-corporate/scripts/pipeline"
sys.path.insert(0, PIPELINE_DIR)

# Import the ACTUAL normalizer and extractor logic
from normalizer import normalize_document, strip_html, split_into_paragraphs
from extractor import extract_facts_multi_category, PATTERN_TYPE_METADATA
from detector import detect_event, EVENT_TYPE_RULES
from schemas import Document

FEED_URL = "https://www.federalreserve.gov/feeds/press_all.xml"

# Existing FED_ENF regulatory_patterns (copied verbatim from source_configs.py lines 746-755)
EXISTING_PATTERNS = [
    (r"(?:enforcement\s+action\s+(?:with|against))\s+([A-Z][A-Za-z\s,&\.\-]{5,80}?)(?:\s+(?:and|Former|former))", "defendant_name"),
    (r"(?:issued|assessed|imposed)\s+(?:a\s+)?(?:consent\s+)?(?:order|civil\s+money\s+penalty|fine|prohibition)", "action_type"),
    (r"(?:for|due\s+to|related\s+to)\s+([a-z\s,]{10,60}(?:fraud|violation|breach|misconduct|deficiency))", "violation_type"),
    (r"(?:agreed\s+to\s+pay|pay|penalty\s+of)\s+(?:approximately\s+)?\$([\d,]+(?:\.\d+)?)\s+(million|billion)", "penalty_amount"),
    (r"\$([\d,]+(?:\.\d+)?)\s+(million|billion)\s+(?:penalty|fine|civil\s+money)", "penalty_amount"),
]

# Candidate remediated patterns — designed to match actual Fed enforcement phrasing.
CANDIDATE_PATTERNS = [
    # Defendant names: capture individual/bank name after "against" in enforcement context
    (r"(?:Consent\s+(?:Prohibition|Order|Cease\s+and\s+Desist\s+Order|Written\s+Agreement)|Cease\s+and\s+Desist\s+Order|Civil\s+Money\s+Penalty)\s+(?:Issued\s+Against\s+|against\s+)([A-Z][A-Za-z0-9\s,&\.\-]{3,100}?)(?:[,\n\.])", "defendant_name"),
    # Action type: detect the enforcement instrument
    (r"\b(Consent\s+(?:Prohibition|Order|Cease\s+and\s+Desist)|Cease\s+and\s+Desist\s+Order|Civil\s+Money\s+Penalty|Written\s+Agreement|Removal\s+and\s+Prohibition|Order\s+of\s+Prohibition)\b", "action_type"),
    # Violation types: capture the substantive issue (more permissive)
    (r"(?:for|due\s+to|related\s+to|based\s+on|in\s+connection\s+with)\s+([a-z\s,]{8,80}(?:fraud|violation|breach|misconduct|deficiency|unsafe\s+or\s+unsound\s+practice|Bank\s+Secrecy\s+Act|BSA|AML|anti-money\s+laundering))", "violation_type"),
    # Violation types: standalone BSA/AML patterns (Fed enforcement is heavy on BSA/AML)
    (r"\b(Bank\s+Secrecy\s+Act|BSA|AML|anti-money\s+laundering|unsafe\s+or\s+unsound\s+practice[s]?)\b", "violation_type"),
    # Penalty amounts: "$X million civil money penalty"
    (r"(?:agreed\s+to\s+pay|pay|penalty\s+of|civil\s+money\s+penalty\s+of)\s+(?:approximately\s+)?\$([\d,]+(?:\.\d+)?)\s+(million|billion)", "penalty_amount"),
    (r"\$([\d,]+(?:\.\d+)?)\s+(million|billion)\s+(?:penalty|fine|civil\s+money)", "penalty_amount"),
]


def fetch_url(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "ROUA-Pipeline/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_rss_items(xml_text: str) -> List[dict]:
    root = ET.fromstring(xml_text)
    items = []
    for item in root.iter("item"):
        items.append({
            "title": (item.findtext("title") or "").strip(),
            "link": (item.findtext("link") or "").strip(),
            "pubDate": (item.findtext("pubDate") or "").strip(),
            "description": (item.findtext("description") or "").strip(),
        })
    return items


def is_enforcement_item(item: dict) -> bool:
    title_lower = item["title"].lower()
    signals = [
        "enforcement action", "consent order", "consent prohibition",
        "cease and desist", "civil money penalty", "written agreement",
        "removal and prohibition", "order of prohibition", "against ",
    ]
    return any(sig in title_lower for sig in signals)


def simulate_pipeline_for_article(
    item: dict,
    patterns: List[Tuple[str, str]],
    source_code: str = "FED_ENF",
    source_name: str = "Federal Reserve Enforcement Actions",
) -> dict:
    """Simulate the full pipeline for one article using the given patterns.

    Returns: dict with paragraphs, facts, events, predicted_ios.
    """
    # Step 1: Fetch HTML
    try:
        html = fetch_url(item["link"])
    except Exception as e:
        return {"error": f"fetch failed: {e}"}

    # Step 2: Build a Document and normalize using the ACTUAL normalizer
    doc = Document(
        id=f"{source_code}_sim_{abs(hash(item['link'])) % 10000}",
        source_code=source_code,
        title=item["title"],
        published_at=item.get("pubDate", ""),
        raw_content_url=item["link"],
        content_text=html,
        content_paragraphs=[],
        normalization_status="pending",
    )
    doc = normalize_document(doc)

    if doc.normalization_status != "normalized":
        return {"error": "normalization failed", "html_len": len(html)}

    # Step 3: Apply the ACTUAL extractor with the given patterns
    # Build a minimal source_config that only contains the patterns + event_type
    source_config = {
        "code": source_code,
        "name": source_name,
        "event_type": "regulatory_enforcement",
        "rate_patterns": [],
        "regulatory_patterns": patterns,
    }

    facts = extract_facts_multi_category(doc, source_config)

    # Step 4: Detect event using the ACTUAL detector
    event = detect_event(
        facts=facts,
        source_code=source_code,
        document_id=doc.id,
        document_title=doc.title,
        published_at=doc.published_at,
        configured_event_type="regulatory_enforcement",
    )

    return {
        "title": item["title"],
        "link": item["link"],
        "html_len": len(html),
        "paragraph_count": len(doc.content_paragraphs),
        "paragraph_lengths": [len(p) for p in doc.content_paragraphs[:5]],
        "facts_count": len(facts),
        "facts": [(f.metric, f.value) for f in facts],
        "event_detected": event is not None,
        "event_title": event.title if event else None,
        "event_description": event.description if event else None,
        "predicted_ios": 1 if event else 0,
    }


def print_result(label: str, result: dict):
    if "error" in result:
        print(f"  [{label}] ERROR: {result['error']}")
        return
    print(f"  [{label}] paragraphs={result['paragraph_count']} facts={result['facts_count']}")
    if result["facts"]:
        for metric, value in result["facts"]:
            print(f"    fact: {metric} = {value[:80]}")
    print(f"    event_detected={result['event_detected']} predicted_ios={result['predicted_ios']}")
    if result["event_detected"]:
        print(f"    event_title: {result['event_title']}")


def main():
    print("=" * 70)
    print("FED_ENF Remediation Test — Phase B: Accurate Diagnostic")
    print("Using ACTUAL pipeline code (normalizer + extractor + detector)")
    print("=" * 70)

    # Fetch RSS
    print(f"\n[1] Fetching FED RSS...")
    xml_text = fetch_url(FEED_URL)
    items = parse_rss_items(xml_text)
    print(f"  Parsed {len(items)} items")

    enforcement_items = [it for it in items if is_enforcement_item(it)]
    print(f"  Identified {len(enforcement_items)} enforcement items")

    # Test 5 enforcement items (more than Phase A for better signal)
    sample = enforcement_items[:5]
    print(f"\n[2] Testing {len(sample)} enforcement articles with EXISTING vs CANDIDATE patterns")

    print("\n" + "=" * 70)
    print("[3] EXISTING patterns (current source_configs.py)")
    print("=" * 70)
    existing_total_facts = 0
    existing_total_ios = 0
    for i, item in enumerate(sample, 1):
        print(f"\n  Article {i}: {item['title'][:80]}")
        result = simulate_pipeline_for_article(item, EXISTING_PATTERNS)
        print_result("EXISTING", result)
        if "facts_count" in result:
            existing_total_facts += result["facts_count"]
            existing_total_ios += result.get("predicted_ios", 0)

    print(f"\n  EXISTING TOTAL: facts={existing_total_facts} ios={existing_total_ios}")

    print("\n" + "=" * 70)
    print("[4] CANDIDATE patterns (proposed remediation)")
    print("=" * 70)
    candidate_total_facts = 0
    candidate_total_ios = 0
    for i, item in enumerate(sample, 1):
        print(f"\n  Article {i}: {item['title'][:80]}")
        result = simulate_pipeline_for_article(item, CANDIDATE_PATTERNS)
        print_result("CANDIDATE", result)
        if "facts_count" in result:
            candidate_total_facts += result["facts_count"]
            candidate_total_ios += result.get("predicted_ios", 0)

    print(f"\n  CANDIDATE TOTAL: facts={candidate_total_facts} ios={candidate_total_ios}")

    # Decision
    print("\n" + "=" * 70)
    print("[5] DECISION")
    print("=" * 70)
    print(f"  EXISTING:  facts={existing_total_facts}  ios={existing_total_ios}")
    print(f"  CANDIDATE: facts={candidate_total_facts}  ios={candidate_total_ios}")
    if candidate_total_ios > 0 and candidate_total_ios > existing_total_ios:
        print("  → Candidate patterns would produce IOs in actual pipeline run.")
        print("  → Pattern-specificity is CONFIG-ONLY for FED_ENF (predicted).")
        print("  → Proceed to Phase C: apply candidate patterns to source_configs.py, run real Gate 5.")
    elif candidate_total_facts > 0 and candidate_total_ios == 0:
        print("  → Candidate patterns produce facts but no events (facts don't include trigger_metrics).")
        print("  → Need pattern refinement (still config-only) OR detector changes (engineering).")
    elif candidate_total_facts == 0:
        print("  → Candidate patterns produce 0 facts even in accurate simulation.")
        print("  → Pattern refinement needed (still config-only) OR extractor/detector changes (engineering).")
    print()


if __name__ == "__main__":
    main()
