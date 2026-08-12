"""
Evidence + Provenance builder — Layer 5.
Creates Evidence records and Provenance chains linking facts to their source documents.

NO source-specific code. Works with any source that has produced Facts.
"""

from typing import List, Optional
from schemas import Fact, Document, Evidence, ProvenanceChain, SourceRef


def build_evidence(
    fact: Fact,
    document: Document,
    source_config: dict,
) -> Evidence:
    """Build an Evidence record for a single fact.

    The Evidence record links the fact to its source document with:
    - The exact paragraph index where the fact was found
    - The excerpt (text snippet) from the document
    - The extraction confidence
    - The live source URL (verifiable by buyer)
    """
    # Get the excerpt from the paragraph
    excerpt = fact.excerpt
    if not excerpt and document.content_paragraphs and fact.paragraph_index is not None:
        if 0 <= fact.paragraph_index < len(document.content_paragraphs):
            para = document.content_paragraphs[fact.paragraph_index]
            # Take first 200 chars as excerpt
            excerpt = para[:200] + "..." if len(para) > 200 else para

    evidence = Evidence(
        fact_id=fact.id,
        source_code=fact.source_code,
        document_id=fact.document_id,
        paragraph_index=fact.paragraph_index,
        excerpt=excerpt,
        extraction_confidence=fact.extraction_confidence,
        source_url=source_config.get("websiteUrl", ""),
        source_name=source_config.get("name", ""),
        document_title=document.title,
        document_date=document.published_at,
    )

    return evidence


def build_evidence_for_facts(
    facts: List[Fact],
    document: Document,
    source_config: dict,
) -> List[Evidence]:
    """Build Evidence records for all facts in a document."""
    return [build_evidence(f, document, source_config) for f in facts]


def build_provenance_chain(
    fact: Fact,
    document: Document,
    evidence: Evidence,
    source_config: dict,
) -> ProvenanceChain:
    """Build a complete provenance chain: Source → Document → Fact → Evidence.

    This is the traceability artifact. A reviewer can follow this chain
    from the Intelligence Object back to the official source URL.
    """
    chain = ProvenanceChain(
        source_code=source_config["code"],
        source_name=source_config["name"],
        source_url=source_config.get("websiteUrl", ""),
        source_type=source_config.get("type", ""),
        source_jurisdiction=source_config.get("jurisdiction", ""),
        source_trust_tier=source_config.get("trustTier", 1),
        document_id=document.id,
        document_title=document.title,
        document_url=document.raw_content_url,
        document_date=document.published_at,
        fact_id=fact.id,
        fact_metric=fact.metric,
        fact_value=fact.value,
        fact_confidence=fact.extraction_confidence,
        evidence_id=evidence.id,
        evidence_excerpt=evidence.excerpt,
        evidence_paragraph=evidence.paragraph_index,
        evidence_confidence=evidence.extraction_confidence,
    )

    # Verify the chain is complete
    chain.verify()

    return chain


def build_provenance_chains(
    facts: List[Fact],
    document: Document,
    evidence_list: List[Evidence],
    source_config: dict,
) -> List[ProvenanceChain]:
    """Build provenance chains for all facts.

    Each fact gets its own chain. The chains are independent —
    a buyer can trace any single fact back to its source.
    """
    chains = []
    evidence_by_fact = {e.fact_id: e for e in evidence_list}

    for fact in facts:
        evidence = evidence_by_fact.get(fact.id)
        if evidence:
            chain = build_provenance_chain(fact, document, evidence, source_config)
            chains.append(chain)
        else:
            print(f"    [WARN] No evidence record for fact {fact.id} ({fact.metric}={fact.value})")

    return chains


def verify_provenance(chains: List[ProvenanceChain]) -> bool:
    """Verify that all provenance chains are complete.

    A chain is complete if every field is populated and chain_verified is True.
    """
    if not chains:
        return False

    all_verified = all(chain.chain_verified for chain in chains)
    return all_verified
