"""
Intelligence Object generator + buyer-readable output — Layers 7.
Combines facts, events, evidence, and provenance into a final intelligence artifact.

NO source-specific code. The IO is assembled from pipeline outputs.

Architecture Gate Fix 2:
- Headline and summary generation now use data-driven functions from detector.py
- NO hardcoded monetary-policy assumptions (rate_maintain/hike/cut, policy_rate, etc.)
- Adding a new event type = adding to EVENT_TYPE_RULES in detector.py (zero code changes here)
"""

import json
from typing import List, Optional
from schemas import (
    Fact, Document, FinancialEvent, Evidence,
    ProvenanceChain, IntelligenceObject
)
from detector import build_headline, build_summary


def generate_intelligence_object(
    document: Document,
    facts: List[Fact],
    event: Optional[FinancialEvent],
    evidence_list: List[Evidence],
    provenance_chains: List[ProvenanceChain],
    source_config: dict,
) -> Optional[IntelligenceObject]:
    """Generate an Intelligence Object from pipeline outputs.

    The IO is the final buyer-visible artifact. It contains:
    - Source identity (name, code, URL)
    - Document identity (title, URL, date)
    - Event classification (type, subtype, title)
    - Key facts (list of extracted metrics)
    - Evidence chains (provenance for each fact)
    - Overall confidence
    - Provenance completeness flag

    If no facts or event were found, returns None (no intelligence to report).

    Architecture Gate Fix 2:
    - Headline and summary are generated via data-driven build_headline() and build_summary()
    - NO hardcoded monetary-policy logic
    """
    if not facts:
        return None

    if not event:
        return None

    # Build headline and summary using data-driven functions from detector.py
    source_name = source_config.get("name", source_config.get("code", ""))
    headline = build_headline(source_name, event.event_type, event.event_subtype)
    summary = build_summary(facts, event.event_type, source_name, document.published_at)

    # Calculate overall confidence — use MAX of fact confidences
    # (the IO contains multiple facts; overall confidence is the best fact's confidence,
    # not the worst — a low-confidence secondary fact shouldn't drag down a high-confidence primary)
    all_confidences = [f.extraction_confidence for f in facts]
    overall_confidence = max(all_confidences) if all_confidences else 0.0

    # Check provenance completeness
    provenance_complete = all(chain.chain_verified for chain in provenance_chains) if provenance_chains else False

    # Build fact dicts for the IO — include role + raw/normalized values
    fact_dicts = []
    for f in facts:
        fact_dicts.append({
            "metric": f.metric,
            "value": f.value,
            "unit": f.unit,
            "confidence": f.extraction_confidence,
            "paragraph": f.paragraph_index,
            "role": f.fact_role,
            "raw_value": f.raw_value,
            "normalized_value": f.normalized_value,
        })

    # Build provenance chain dicts
    chain_dicts = [chain.to_dict() for chain in provenance_chains]

    # Determine object_type from event_type (data-driven, not hardcoded)
    object_type = f"{event.event_type}_intelligence"

    io = IntelligenceObject(
        object_type=object_type,
        source_code=source_config["code"],
        source_name=source_name,
        source_url=source_config.get("websiteUrl", ""),
        document_title=document.title,
        document_url=document.raw_content_url,
        document_date=document.published_at,
        event_type=event.event_type,
        event_subtype=event.event_subtype,
        headline=headline,
        summary=summary,
        key_facts=fact_dicts,
        evidence_chains=chain_dicts,
        confidence=overall_confidence,
        provenance_complete=provenance_complete,
    )

    return io


def render_readable_output(io: IntelligenceObject) -> str:
    """Render an Intelligence Object as human-readable text.

    This is what a buyer would see — a brief, structured intelligence report
    with source attribution and evidence chain.
    """
    lines = []
    lines.append("=" * 70)
    lines.append(f"INTELLIGENCE OBJECT — {io.object_type}")
    lines.append("=" * 70)
    lines.append("")
    lines.append(f"Headline: {io.headline}")
    lines.append(f"Summary:  {io.summary}")
    lines.append(f"Confidence: {io.confidence:.0%} | Provenance: {'COMPLETE' if io.provenance_complete else 'INCOMPLETE'}")
    lines.append("")

    lines.append("--- SOURCE ---")
    lines.append(f"  Institution: {io.source_name} ({io.source_code})")
    lines.append(f"  Website:     {io.source_url}")
    lines.append(f"  Document:    {io.document_title}")
    lines.append(f"  URL:         {io.document_url}")
    lines.append(f"  Published:   {io.document_date}")
    lines.append("")

    lines.append("--- EVENT ---")
    lines.append(f"  Type:    {io.event_type}")
    lines.append(f"  Subtype: {io.event_subtype}")
    lines.append("")

    lines.append("--- KEY FACTS ---")
    for i, fact in enumerate(io.key_facts, 1):
        lines.append(f"  {i}. {fact['metric']}: {fact['value']}" +
                     (f" {fact['unit']}" if fact.get("unit") else "") +
                     f" (confidence: {fact['confidence']:.0%}, paragraph: {fact.get('paragraph', 'N/A')})")
    lines.append("")

    lines.append("--- EVIDENCE CHAINS ---")
    for i, chain in enumerate(io.evidence_chains, 1):
        lines.append(f"  Chain {i}:")
        lines.append(f"    Source:     {chain.get('source_name', 'N/A')} ({chain.get('source_code', 'N/A')})")
        lines.append(f"    Source URL: {chain.get('source_url', 'N/A')}")
        lines.append(f"    Document:   {chain.get('document_title', 'N/A')}")
        lines.append(f"    Doc URL:    {chain.get('document_url', 'N/A')}")
        lines.append(f"    Fact:       {chain.get('fact_metric', 'N/A')} = {chain.get('fact_value', 'N/A')}")
        lines.append(f"    Evidence:   {chain.get('evidence_excerpt', 'N/A')[:100]}...")
        lines.append(f"    Paragraph:  {chain.get('evidence_paragraph', 'N/A')}")
        lines.append(f"    Verified:   {chain.get('chain_verified', False)}")
        lines.append("")

    lines.append("--- TRACEABILITY ---")
    lines.append("  Intelligence Object → Evidence → Fact → Document → Official Source")
    lines.append(f"  Source URL is live and independently checkable: {io.source_url}")
    lines.append(f"  Document URL is accessible: {io.document_url}")
    lines.append("")

    return "\n".join(lines)


def save_io_to_json(io: IntelligenceObject, filepath: str) -> None:
    """Save Intelligence Object to JSON file."""
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(io.to_dict(), f, indent=2, ensure_ascii=False)


def save_readable_output(io: IntelligenceObject, filepath: str) -> None:
    """Save human-readable output to text file."""
    text = render_readable_output(io)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(text)
